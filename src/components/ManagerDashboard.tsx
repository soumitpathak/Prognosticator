import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  LineChart,
  Sliders,
  FileSpreadsheet,
  Download,
  Settings
} from 'lucide-react';
import {
  ActiveAnomalyAlert,
  AnomalyPredictionResult,
  AuditEvent,
  FacilityZone,
  KalmanSensitivityConfig,
  TelemetryDataPoint,
  TelemetryPacket
} from '../types';
import {
  INITIAL_ACTIVE_ALERTS,
  INITIAL_FACILITY_ZONES,
  generatePacketForZone,
  generateSyntheticStream
} from '../services/telemetryStream';
import { predictWorkforceAnomaly } from '../services/lstmAnomalyEngine';
import AuditLogModal from './AuditLogModal';
import TelemetryInspectorModal from './TelemetryInspectorModal';
import StreamSimulatorDrawer from './StreamSimulatorDrawer';
import TelemetryCharts from './TelemetryCharts';
import ActiveAlertsSection from './ActiveAlertsSection';
import ReportExportModal from './ReportExportModal';
import KalmanSettingsModal, { DEFAULT_KALMAN_CONFIG } from './KalmanSettingsModal';

export default function ManagerDashboard() {
  const [selectedZone, setSelectedZone] = useState<string>('Outdoor-Construction-Sector-4');
  const [loading, setLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<FacilityZone[]>(INITIAL_FACILITY_ZONES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryDataPoint[]>(() => generateSyntheticStream(24, 15));
  const [activeAlerts, setActiveAlerts] = useState<ActiveAnomalyAlert[]>(INITIAL_ACTIVE_ALERTS);

  const [telemetryAlert, setTelemetryAlert] = useState<AnomalyPredictionResult>({
    status: 'success',
    worker_id: 'W-9921',
    location_zone: 'Outdoor-Construction-Sector-4',
    risk_tier: 'CRITICAL_RISK',
    risk_probability: 0.892,
    reconstruction_mse: 0.342,
    explainable_attributions: {
      'Heart Rate Variability (HRV) Drop': 0.42,
      'Skin Temperature Elevation': 0.18,
      'Ambient Heat Index Load': 0.31,
      'Cumulative Sleep Deficit': 0.09
    },
    recommended_operational_action:
      'Immediate extraction: Direct worker to shaded cooling zone and dispatch medical liaison.',
    privacy_compliance:
      'Enforced: k-Anonymity & Small-Cell Suppression Applied (N >= 12, Active Count: 18)'
  });

  // Action status banner
  const [protocolActiveNotice, setProtocolActiveNotice] = useState<string | null>(null);

  // Modals & Sensitivity Config
  const [kalmanConfig, setKalmanConfig] = useState<KalmanSensitivityConfig>(DEFAULT_KALMAN_CONFIG);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Audit events trail
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'AUD-0091-AZ',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(),
      eventType: 'ALERT_DISPATCH',
      zone: 'Outdoor-Construction-Sector-4',
      cohortCount: 18,
      riskTier: 'CRITICAL_RISK',
      privacyEnforced: 'k-Anonymity Verified (N=18 >= 12)',
      actionTaken: 'High thermal load alert dispatched to zone lead'
    },
    {
      id: 'AUD-0090-SP',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      eventType: 'PRIVACY_SUPPRESSION',
      zone: 'Subgrade-Tunnel-Conduit-7',
      cohortCount: 8,
      riskTier: 'MODERATE_RISK',
      privacyEnforced: 'Cell Suppressed (N=8 < 12)',
      actionTaken: 'Suppressed individual telemetry pursuant to HIPAA/GDPR rules'
    },
    {
      id: 'AUD-0089-CL',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: 'Manufacturing-Assembly-Line-B',
      cohortCount: 42,
      riskTier: 'STABLE',
      privacyEnforced: 'Full Differential Privacy (ε=0.5)',
      actionTaken: 'Kalman filter noise baseline recalibrated'
    }
  ]);

  const activeZoneObj = zones.find((z) => z.id === selectedZone) || zones[0];
  const pendingCriticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;

  // Acknowledge anomaly alert
  const handleAcknowledgeAlert = (id: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
    const targetAlert = activeAlerts.find((a) => a.id === id);
    if (targetAlert) {
      const newAudit: AuditEvent = {
        id: `ACK-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString(),
        eventType: 'ALERT_DISPATCH',
        zone: targetAlert.location_zone,
        cohortCount: activeZoneObj.count,
        riskTier: targetAlert.severity,
        privacyEnforced: 'Logged in GDPR Audit Trail',
        actionTaken: `Safety Manager acknowledged alert ${targetAlert.id} (${targetAlert.anomaly_metric})`
      };
      setAuditEvents((prev) => [newAudit, ...prev]);
    }
  };

  // Dispatch action from active alerts list
  const handleDispatchAction = (alert: ActiveAnomalyAlert) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a))
    );
    setProtocolActiveNotice(
      `Dispatched intervention for ${alert.id} (${alert.anomaly_metric}) at ${alert.location_zone}. Directive: ${alert.recommended_action}`
    );
    const newAudit: AuditEvent = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'HYDRATION_PROTOCOL',
      zone: alert.location_zone,
      cohortCount: activeZoneObj.count,
      riskTier: alert.severity,
      privacyEnforced: alert.privacy_status,
      actionTaken: `Intervention dispatched: ${alert.recommended_action}`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    setTimeout(() => {
      setProtocolActiveNotice(null);
    }, 7000);
  };

  const handleSaveConfig = (newConfig: KalmanSensitivityConfig) => {
    setKalmanConfig(newConfig);
    const packet = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
    const recalibrated = predictWorkforceAnomaly(packet, undefined, newConfig);
    setTelemetryAlert(recalibrated);

    setProtocolActiveNotice(
      `Kalman Anomaly Sensitivity updated to ${newConfig.preset} (Critical Cutoff: ${newConfig.criticalCutoffPct}%, Q=${newConfig.processVarianceQ}, R=${newConfig.measurementVarianceR.toFixed(2)})`
    );

    const newAudit: AuditEvent = {
      id: `CALIB-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: activeZoneObj.name,
      cohortCount: activeZoneObj.count,
      riskTier: recalibrated.risk_tier,
      privacyEnforced: 'Differential Privacy Active',
      actionTaken: `Kalman detection threshold recalibrated to ${newConfig.preset} profile`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    setTimeout(() => setProtocolActiveNotice(null), 6000);
  };

  // Simulated live refresh trigger
  const handleRefreshStream = () => {
    setLoading(true);
    setTimeout(() => {
      const newPacket = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
      const result = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
      setTelemetryAlert(result);
      const newStream = generateSyntheticStream(24, 15);
      setTelemetryStream(newStream);

      // If high risk detected, dynamically add fresh anomaly into active alerts
      if (result.risk_probability > 0.4 && !result.is_suppressed) {
        const freshAlert: ActiveAnomalyAlert = {
          id: `ALR-${Math.floor(1000 + Math.random() * 9000)}-LIVE`,
          worker_id: result.worker_id,
          location_zone: result.location_zone,
          detected_at: 'Just now',
          anomaly_metric:
            result.risk_probability > 0.75
              ? 'Multi-Signal Cumulative Stress Spike'
              : 'Moderate Physiological Heat Load',
          raw_value: `Jittered Packet: MSE ${result.reconstruction_mse.toFixed(3)}`,
          kalman_smoothed_value: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}%`,
          severity: result.risk_probability > 0.75 ? 'CRITICAL' : 'MODERATE',
          kalman_status: 'Jitter Filtered & Validated',
          lead_time: '3.5h Shift Forecast',
          recommended_action: result.recommended_operational_action,
          acknowledged: false,
          privacy_status: result.privacy_compliance
        };
        setActiveAlerts((prev) => [freshAlert, ...prev.slice(0, 7)]);
      }

      // Append audit event
      const newAudit: AuditEvent = {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}-IN`,
        timestamp: new Date().toLocaleTimeString(),
        eventType: result.is_suppressed ? 'PRIVACY_SUPPRESSION' : 'ALERT_DISPATCH',
        zone: activeZoneObj.name,
        cohortCount: activeZoneObj.count,
        riskTier: result.risk_tier,
        privacyEnforced: result.privacy_compliance,
        actionTaken: result.is_suppressed
          ? 'Masked small-cell alert to shield worker anonymity'
          : `Processed stream packet; MSE: ${result.reconstruction_mse}`
      };
      setAuditEvents((prev) => [newAudit, ...prev]);

      setLoading(false);
    }, 450);
  };

  const handleTriggerHydrationProtocol = () => {
    setProtocolActiveNotice(
      `Zone Hydration Protocol activated for ${activeZoneObj.name}. Automated sirens & water mist cooling units dispatched.`
    );
    const newAudit: AuditEvent = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}-HYD`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'HYDRATION_PROTOCOL',
      zone: activeZoneObj.name,
      cohortCount: activeZoneObj.count,
      riskTier: telemetryAlert.risk_tier,
      privacyEnforced: 'Aggregated Directive Dispatched',
      actionTaken: 'Mandatory 15-minute hydration pause & shaded cool-down initiated'
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    setTimeout(() => {
      setProtocolActiveNotice(null);
    }, 6000);
  };

  const handleCustomPacketFromSimulator = (customPacket: TelemetryPacket) => {
    const result = predictWorkforceAnomaly(customPacket, undefined, kalmanConfig);
    setTelemetryAlert(result);

    // Update zone count if changed
    if (customPacket.cohort_size) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone ? { ...z, count: customPacket.cohort_size || z.count } : z
        )
      );
    }

    if (!result.is_suppressed && result.risk_probability > 0.4) {
      const simAlert: ActiveAnomalyAlert = {
        id: `SIM-ALR-${Math.floor(1000 + Math.random() * 9000)}`,
        worker_id: customPacket.worker_id,
        location_zone: customPacket.location_zone,
        detected_at: 'Just now (Simulated)',
        anomaly_metric: 'Injected Thermal & Noise Stress Test',
        raw_value: `Heat: ${customPacket.heat_index}°C, Sleep: ${customPacket.sleep_deficit_hours}h`,
        kalman_smoothed_value: `Predicted Risk: ${(result.risk_probability * 100).toFixed(1)}%`,
        severity: result.risk_probability > 0.75 ? 'CRITICAL' : 'HIGH',
        kalman_status: 'Jitter Filtered & Validated',
        lead_time: '2.8h Before Exceedance',
        recommended_action: result.recommended_operational_action,
        acknowledged: false,
        privacy_status: result.privacy_compliance
      };
      setActiveAlerts((prev) => [simAlert, ...prev]);
    }

    const newAudit: AuditEvent = {
      id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: result.is_suppressed ? 'PRIVACY_SUPPRESSION' : 'ALERT_DISPATCH',
      zone: customPacket.location_zone,
      cohortCount: customPacket.cohort_size || 0,
      riskTier: result.risk_tier,
      privacyEnforced: result.privacy_compliance,
      actionTaken: result.is_suppressed
        ? 'Simulator: Cell suppressed (N < 12)'
        : `Simulator packet injected; Prob: ${(result.risk_probability * 100).toFixed(1)}%`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6">
      {/* Top Navigation Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-lg gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg">
            <Activity className="text-cyan-400 h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PROGNOSTICATOR <span className="text-cyan-400 text-sm font-normal">| Azure IoT Hub Stream</span>
            </h1>
            <p className="text-xs text-slate-400">Population &amp; Workforce Health Early Warning Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Azure Pipeline Active</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Differential Privacy Active (&epsilon;-DP)</span>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Adjust Kalman filter sensitivity and anomaly detection thresholds"
          >
            <Settings className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sensitivity: <strong className="font-bold text-white ml-0.5">{kalmanConfig.preset}</strong></span>
          </button>
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tune Telemetry</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Download Report</span>
          </button>
        </div>
      </header>

      {/* Protocol Banner Notification */}
      {protocolActiveNotice && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
            <span className="font-medium">{protocolActiveNotice}</span>
          </div>
          <button
            onClick={() => setProtocolActiveNotice(null)}
            className="text-cyan-400 hover:text-white text-xs underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Macro Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Monitored Workforce</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-white">1,420 Active</h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <Users className="h-3 w-3 mr-1" /> 100% Anonymized
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Critical Alerts</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-rose-400">{pendingCriticalCount}</h3>
            <span className="text-xs text-rose-400 font-semibold flex items-center">
              <ShieldAlert className="h-3 w-3 mr-1" /> Immediate Action
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Avg Wet-Bulb Heat Index</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">42.5°C</h3>
            <span className="text-xs text-slate-400">Severe Thermal Load</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Model Lead Time (Backtested)</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-cyan-400">3.8 Hours</h3>
            <span className="text-xs text-cyan-400 font-semibold">Prior to Incident</span>
          </div>
        </div>
      </div>

      {/* Sliding 24-Hour Recharts Telemetry Stream */}
      <TelemetryCharts data={telemetryStream} zoneName={activeZoneObj.name} />

      {/* Active Alerts Section (Kalman Filter Anomaly Detection with Severity Color-Coding) */}
      <ActiveAlertsSection
        alerts={activeAlerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
      />

      {/* Main Operational Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Geospatial Zone Selector / Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-cyan-400" /> Industrial Facility Zones
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">4 Zones</span>
            </div>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.name}
                  onClick={() => {
                    setSelectedZone(zone.id);
                    const newPacket = generatePacketForZone(zone, zone.status === 'CRITICAL');
                    const res = predictWorkforceAnomaly(newPacket);
                    setTelemetryAlert(res);
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedZone === zone.id
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-md'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate mr-2">{zone.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        zone.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : zone.status === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {zone.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>
                      Active Cohort:{' '}
                      {zone.count < 12 ? (
                        <span className="text-amber-400 font-bold">N = {zone.count} (Suppressed)</span>
                      ) : (
                        `N = ${zone.count} (Protected)`
                      )}
                    </span>
                    <span>Heat Load: {zone.temp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Regulatory Notice:</strong> k-Anonymity small-cell suppression enforces strict masking on cohorts
                under N=12 to shield individual worker identity.
              </p>
            </div>

            <button
              onClick={() => setIsInspectorOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-medium py-2 rounded-lg transition"
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>Inspect Multi-Signal Kalman Waveform</span>
            </button>
          </div>
        </div>

        {/* Right 2 Cols: Real-Time Explainable AI Triage & SHAP Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-cyan-400" /> Real-Time LSTM Anomaly &amp; Explainable AI (XAI) Drilldown
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshStream}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 transition border border-slate-700/80"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Simulate Stream Packet</span>
              </button>
            </div>
          </div>

          {/* Anomaly Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-2">
              <div>
                <span className="text-xs text-slate-400 font-mono">
                  ANOMALY ID: {telemetryAlert.worker_id} | ZONE: {telemetryAlert.location_zone}
                </span>
                <h3 className="text-lg font-bold text-white flex items-center mt-1">
                  Cohort Risk Probability:
                  {telemetryAlert.is_suppressed ? (
                    <span className="text-amber-400 ml-2">[SUPPRESSED DUE TO N &lt; 12 CELL LIMIT]</span>
                  ) : (
                    <span
                      className={`ml-2 ${
                        telemetryAlert.risk_tier === 'CRITICAL_RISK'
                          ? 'text-rose-400'
                          : telemetryAlert.risk_tier === 'MODERATE_RISK'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(telemetryAlert.risk_probability * 100).toFixed(1)}% ({telemetryAlert.risk_tier})
                    </span>
                  )}
                </h3>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-lg text-rose-400 text-xs font-mono">
                Reconstruction MSE: {telemetryAlert.reconstruction_mse.toFixed(3)}
              </div>
            </div>

            {/* Explainable AI Attribute Weights */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Integrated Gradients / Feature Attribution (Why did this alert trigger?)
              </h4>
              <div className="space-y-2.5">
                {Object.entries(telemetryAlert.explainable_attributions).map(([feature, weight]) => (
                  <div key={feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{feature}</span>
                      <span className="text-cyan-400 font-mono">
                        {telemetryAlert.is_suppressed ? 'Masked' : `${(weight * 100).toFixed(0)}% contribution`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: telemetryAlert.is_suppressed ? '0%' : `${weight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="mt-5 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-lg">
              <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">
                Recommended Operational Action
              </p>
              <p className="text-sm text-white font-medium">{telemetryAlert.recommended_operational_action}</p>
            </div>

            {/* Privacy Compliance Footer Tag */}
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <Lock className="h-3 w-3 text-cyan-400 shrink-0" />
              <span>{telemetryAlert.privacy_compliance}</span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTriggerHydrationProtocol}
              className="flex-1 min-w-[200px] bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition shadow-lg shadow-cyan-600/20 flex items-center justify-center"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Trigger Zone Hydration Protocol
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-emerald-600/40 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download Compliance Report (PDF/CSV)</span>
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-slate-700 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Export Audit Log (GDPR/HIPAA)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditEvents={auditEvents}
      />

      <TelemetryInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        telemetryStream={telemetryStream}
        zoneName={activeZoneObj.name}
      />

      <StreamSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currentZone={selectedZone}
        onSimulateCustomPacket={handleCustomPacketFromSimulator}
      />

      <ReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeAlerts={activeAlerts}
        telemetryStream={telemetryStream}
        currentZone={activeZoneObj.name}
        zones={zones}
      />

      <KalmanSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentConfig={kalmanConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}

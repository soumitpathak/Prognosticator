import React, { useState, useEffect, useCallback } from 'react';
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
  Settings,
  Radio,
  Send,
  Plus,
  Zap,
  CloudSun
} from 'lucide-react';
import {
  ActiveAnomalyAlert,
  AnomalyPredictionResult,
  AuditEvent,
  FacilityZone,
  KalmanSensitivityConfig,
  MedicalDispatchNotification,
  TelemetryDataPoint,
  TelemetryPacket,
  ZoneWeatherData,
  SensorStreamToggles,
  SystemAuditLogEntry,
  SensorCorrelationPoint,
  VoiceAlertSettings
} from '../types';
import {
  INITIAL_ACTIVE_ALERTS,
  INITIAL_FACILITY_ZONES,
  INITIAL_SYSTEM_AUDIT_LOGS,
  generatePacketForZone,
  generateSyntheticStream,
  generateCorrelationDataset
} from '../services/telemetryStream';
import { predictWorkforceAnomaly } from '../services/lstmAnomalyEngine';
import { fetchLiveZoneWeather } from '../services/weatherService';
import { voiceAlertService, DEFAULT_VOICE_SETTINGS } from '../services/voiceAlertService';
import AuditLogModal from './AuditLogModal';
import TelemetryInspectorModal from './TelemetryInspectorModal';
import StreamSimulatorDrawer from './StreamSimulatorDrawer';
import TelemetryCharts from './TelemetryCharts';
import ActiveAlertsSection from './ActiveAlertsSection';
import SensorCorrelationScatterPlot from './SensorCorrelationScatterPlot';
import ReportExportModal from './ReportExportModal';
import KalmanSettingsModal, { DEFAULT_KALMAN_CONFIG } from './KalmanSettingsModal';
import MedicalDispatchModal from './MedicalDispatchModal';
import CustomZoneBuilderModal from './CustomZoneBuilderModal';
import ZoneWeatherCard from './ZoneWeatherCard';
import IncidentProjectionChart from './IncidentProjectionChart';
import FloorPlan2DView from './FloorPlan2DView';
import SystemAuditLog from './SystemAuditLog';
import ResourceAllocationModule from './ResourceAllocationModule';
import VoiceAlertsModal from './VoiceAlertsModal';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import { FileText, Loader2, Navigation, ShieldCheck, Crosshair, Wrench, Volume2, VolumeX, UserCheck } from 'lucide-react';

const INITIAL_MEDICAL_DISPATCHES: MedicalDispatchNotification[] = [
  {
    id: 'DSP-9921-COOL',
    alertId: 'ALR-8842-CR',
    zone: 'Outdoor-Construction-Sector-4',
    severity: 'CRITICAL',
    recipientRole: 'On-Site Rapid Cooling Evacuation Team',
    contactMethod: 'DUAL_CHANNEL',
    recipientPhone: '+1 (555) 911-COOL-2',
    messagePayload:
      'CRITICAL ALERT: Worker W-9921 exhibiting severe autonomic deceleration (HRV 31ms, skin temp 38.4°C). Immediate extraction to shaded tent with oral rehydration dispatched.',
    stagedAt: '10 mins ago',
    status: 'TRANSMITTED'
  },
  {
    id: 'DSP-6104-PPE',
    alertId: 'ALR-8839-HG',
    zone: 'Outdoor-Construction-Sector-4',
    severity: 'HIGH',
    recipientRole: 'Acoustic Hearing Protection Officer',
    contactMethod: 'SMS',
    recipientPhone: '+1 (555) 441-NOISE',
    messagePayload:
      'HIGH NOISE HAZARD: Machine 4B acoustic overpressure breach (104.8 dB raw / 98.4 dB smoothed). Deploy secondary ear defenders to Sector 4 cohort.',
    stagedAt: '25 mins ago',
    status: 'ACKNOWLEDGED_BY_TEAM',
    acknowledgedAt: '20 mins ago',
    responderNotes: 'Secondary ear defenders distributed; compressor vibration dampeners checked.'
  },
  {
    id: 'DSP-3209-REST',
    alertId: 'ALR-8827-MD',
    zone: 'Warehouse-Logistics-Hub-North',
    severity: 'MODERATE',
    recipientRole: 'Warehouse Logistics Shift Supervisor',
    contactMethod: 'SMS',
    recipientPhone: '+1 (555) 728-WH-LEAD',
    messagePayload:
      'MODERATE FATIGUE: Worker W-3209 sleep deficit exceedance (3.5h). Reassign to ground-level staging.',
    stagedAt: '45 mins ago',
    status: 'STAGED'
  }
];

export default function ManagerDashboard() {
  const [selectedZone, setSelectedZone] = useState<string>('Outdoor-Construction-Sector-4');
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<FacilityZone[]>(INITIAL_FACILITY_ZONES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryDataPoint[]>(() => generateSyntheticStream(24, 15));
  const [activeAlerts, setActiveAlerts] = useState<ActiveAnomalyAlert[]>(INITIAL_ACTIVE_ALERTS);
  const [correlationData, setCorrelationData] = useState<SensorCorrelationPoint[]>(() =>
    generateCorrelationDataset('ALL')
  );

  // Live Weather State
  const [currentWeather, setCurrentWeather] = useState<ZoneWeatherData | null>(null);

  // Streaming IoT Hub Simulator State
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(false);
  const [jitterEnabled, setJitterEnabled] = useState<boolean>(true);
  const [packetCounter, setPacketCounter] = useState<number>(142);

  // Automated Protocol Medical Dispatches State
  const [medicalDispatches, setMedicalDispatches] = useState<MedicalDispatchNotification[]>(INITIAL_MEDICAL_DISPATCHES);

  // Sensitivity Settings Config
  const [kalmanConfig, setKalmanConfig] = useState<KalmanSensitivityConfig>(DEFAULT_KALMAN_CONFIG);

  // Modals & Drawers
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isZoneBuilderOpen, setIsZoneBuilderOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceAlertSettings>(DEFAULT_VOICE_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const unsub = voiceAlertService.subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  const handleSpeakAlert = (alert: ActiveAnomalyAlert) => {
    voiceAlertService.speakAlert(alert, voiceSettings);
  };

  const handleStopSpeaking = () => {
    voiceAlertService.cancelSpeech();
  };

  // Client-Side Executive PDF Export State
  const [isDirectPdfExporting, setIsDirectPdfExporting] = useState<boolean>(false);
  const [directPdfStatus, setDirectPdfStatus] = useState<string>('');

  // 2D Floor Plan Sensor Stream Toggles State
  const [streamToggles, setStreamToggles] = useState<SensorStreamToggles>({
    ambientTemp: true,
    noiseDb: true,
    hrvDrop: true,
    skinTemp: true,
    twlHeatStrain: true,
    aqiAirQuality: true,
    riskScore: true
  });

  const handleToggleStream = (key: keyof SensorStreamToggles) => {
    setStreamToggles((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSetAllStreams = (enable: boolean) => {
    setStreamToggles({
      ambientTemp: enable,
      noiseDb: enable,
      hrvDrop: enable,
      skinTemp: enable,
      twlHeatStrain: enable,
      aqiAirQuality: enable,
      riskScore: enable
    });
  };

  // System Audit Log State (Manual changes to thresholds & zone configs)
  const [systemAuditLogs, setSystemAuditLogs] = useState<SystemAuditLogEntry[]>(INITIAL_SYSTEM_AUDIT_LOGS);

  const handleAddManualAuditLog = (newEntry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>) => {
    const entry: SystemAuditLogEntry = {
      ...newEntry,
      id: `AUD-MAN-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setSystemAuditLogs((prev) => [entry, ...prev]);
    setProtocolActiveNotice(
      `Recorded manual parameter override by ${newEntry.userId} for "${newEntry.parameter}".`
    );
  };

  // Action status banner
  const [protocolActiveNotice, setProtocolActiveNotice] = useState<string | null>(null);

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
  const stagedDispatchCount = medicalDispatches.filter((d) => d.status === 'STAGED').length;

  // Sync hyper-local live weather via Open-Meteo API
  const syncLiveWeather = useCallback(async (zone: FacilityZone) => {
    setWeatherLoading(true);
    try {
      const weather = await fetchLiveZoneWeather(zone.latitude, zone.longitude, zone.name);
      setCurrentWeather(weather);

      // Adjust zone heat load if apparent temperature is high
      if (weather.apparentTemperature) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === zone.id
              ? {
                  ...z,
                  temp: `${weather.temperature}°C`,
                  heatIndex: weather.apparentTemperature
                }
              : z
          )
        );
      }
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch live weather on initial mount or when zone changes
  useEffect(() => {
    syncLiveWeather(activeZoneObj);
  }, [activeZoneObj.id, syncLiveWeather]);

  // Streaming IoT Hub Simulator Interval
  useEffect(() => {
    if (!isStreamingActive) return;

    const interval = setInterval(() => {
      setPacketCounter((c) => c + 1);

      // Generate next rolling point with simulated jitter if enabled
      const jitterFactor = jitterEnabled ? (Math.random() - 0.5) * 8.0 : (Math.random() - 0.5) * 1.5;
      const packet = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
      const result = predictWorkforceAnomaly(packet, undefined, kalmanConfig);
      setTelemetryAlert(result);

      // Advance sliding chart by 1 step
      setTelemetryStream((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const now = new Date();
        const newPoint: TelemetryDataPoint = {
          ...last,
          timestamp: now.toISOString(),
          timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ambient_temp_c: Number((last.ambient_temp_c + (Math.random() - 0.48) * 0.4).toFixed(1)),
          raw_noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor).toFixed(1)),
          noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor * 0.25).toFixed(1)),
          smoothed_noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor * 0.25).toFixed(1)),
          smoothed_hrv: Number(Math.max(25, last.smoothed_hrv + (Math.random() - 0.5) * 1.5).toFixed(1)),
          raw_hrv: Number(Math.max(20, last.smoothed_hrv + jitterFactor * 1.5).toFixed(1)),
          risk_score: Number((result.risk_probability * 100).toFixed(1))
        };
        return [...prev.slice(1), newPoint];
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isStreamingActive, jitterEnabled, activeZoneObj, kalmanConfig]);

  // Handle Burst Event Triggers
  const handleTriggerBurst = (type: 'HEATWAVE' | 'NOISE' | 'CARDIAC' | 'DROPOUT') => {
    if (type === 'HEATWAVE') {
      const burstPacket: TelemetryPacket = {
        worker_id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
        location_zone: activeZoneObj.name,
        timestamp: new Date().toISOString(),
        hrv_series: [42, 38, 35, 33, 31, 30, 28],
        skin_temp_series: [37.8, 38.1, 38.3, 38.6, 38.8],
        heat_index: 47.5,
        sleep_deficit_hours: 4.0,
        cohort_size: activeZoneObj.count,
        twl_index: 82.0,
        ambient_temp_c: 46.5,
        aqi: 185
      };
      const res = predictWorkforceAnomaly(burstPacket, undefined, kalmanConfig);
      setTelemetryAlert(res);

      // Auto-stage medical cooling dispatch
      const newDispatch: MedicalDispatchNotification = {
        id: `AUTO-${Math.floor(1000 + Math.random() * 9000)}-COOL`,
        alertId: `BURST-HEAT-${Math.floor(1000 + Math.random() * 9000)}`,
        zone: activeZoneObj.name,
        severity: 'CRITICAL',
        recipientRole: 'On-Site Rapid Cooling Evacuation Team',
        contactMethod: 'DUAL_CHANNEL',
        recipientPhone: '+1 (555) 911-COOL-2',
        messagePayload: `AUTOMATED EMERGENCY DISPATCH: Flash Heatwave Burst detected at ${activeZoneObj.name} (Ambient: 46.5°C, WBGT Apparent: 47.5°C). Immediate shaded extraction & cooling vests dispatched.`,
        stagedAt: 'Just now',
        status: 'STAGED'
      };
      setMedicalDispatches((prev) => [newDispatch, ...prev]);

      setProtocolActiveNotice(
        `BURST TRIGGERED: Flash Heatwave Exceedance (46.5°C). Critical alert active & automated medical dispatch staged in queue.`
      );
    } else if (type === 'NOISE') {
      const burstAlert: ActiveAnomalyAlert = {
        id: `BURST-NOISE-${Math.floor(1000 + Math.random() * 9000)}`,
        worker_id: 'W-6104',
        location_zone: activeZoneObj.name,
        detected_at: 'Just now',
        anomaly_metric: 'Acoustic Machinery Overpressure Blast',
        raw_value: 'Noise: 108.5 dB (OSHA Rupture Threshold)',
        kalman_smoothed_value: 'Kalman Estimate: 102.4 dB',
        severity: 'CRITICAL',
        kalman_status: 'Confirmed Sensor Spike',
        lead_time: 'Immediate Hearing Protection Breach',
        recommended_action: 'Emergency machine shutdown & mandatory high-attenuation PPE verification.',
        acknowledged: false,
        privacy_status: 'k-Anonymity Verified (N >= 12)'
      };
      setActiveAlerts((prev) => [burstAlert, ...prev]);

      const newDispatch: MedicalDispatchNotification = {
        id: `AUTO-${Math.floor(1000 + Math.random() * 9000)}-PPE`,
        alertId: burstAlert.id,
        zone: activeZoneObj.name,
        severity: 'HIGH',
        recipientRole: 'Acoustic Audiology PPE Officer',
        contactMethod: 'SMS',
        recipientPhone: '+1 (555) 441-NOISE',
        messagePayload: `ACOUSTIC BLAST DETECTED: 108.5 dB at ${activeZoneObj.name}. Deploy hearing evaluation & acoustic damper inspections.`,
        stagedAt: 'Just now',
        status: 'STAGED'
      };
      setMedicalDispatches((prev) => [newDispatch, ...prev]);

      setProtocolActiveNotice('BURST TRIGGERED: Acoustic Overpressure (108.5 dB). Audiology protocol staged.');
    } else if (type === 'CARDIAC') {
      const burstPacket: TelemetryPacket = {
        worker_id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
        location_zone: activeZoneObj.name,
        timestamp: new Date().toISOString(),
        hrv_series: [29, 28, 27, 26, 26, 25],
        skin_temp_series: [38.2, 38.4, 38.6],
        heat_index: 43.0,
        sleep_deficit_hours: 4.5,
        cohort_size: activeZoneObj.count
      };
      const res = predictWorkforceAnomaly(burstPacket, undefined, kalmanConfig);
      setTelemetryAlert(res);

      setProtocolActiveNotice('BURST TRIGGERED: Autonomic Cardiac Collapse (-60% HRV drop to 26ms). Critical extraction flagged.');
    } else if (type === 'DROPOUT') {
      setProtocolActiveNotice(
        'BURST TRIGGERED: 3 Sensor Packets Dropped. Kalman State Filter successfully imputed missing state with covariance R=0.10.'
      );
    }
  };

  // Add Custom Zone from Zone Builder
  const handleAddCustomZone = (newZone: FacilityZone) => {
    setZones((prev) => [...prev, newZone]);
    setSelectedZone(newZone.id);
    syncLiveWeather(newZone);

    const newAudit: AuditEvent = {
      id: `ZONE-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: newZone.name,
      cohortCount: newZone.count,
      riskTier: 'STABLE',
      privacyEnforced: newZone.count < 12 ? 'Cell Suppressed (N<12)' : 'k-Anonymity Verified',
      actionTaken: `Supervisors instantiated custom zone "${newZone.name}" with custom HRV=${newZone.customBaselines?.baselineHrv}ms, Noise=${newZone.customBaselines?.noiseLimitDb}dB`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    const zoneAuditLog: SystemAuditLogEntry = {
      id: `AUD-ZN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'ZONE_CONFIG',
      targetModule: `Zone: ${newZone.name}`,
      parameter: 'Custom Baselines & Microclimate Configuration',
      previousValue: 'Unregistered / None',
      newValue: `HRV: ${newZone.customBaselines?.baselineHrv}ms, Noise: ${newZone.customBaselines?.noiseLimitDb}dB, Heat: ${newZone.customBaselines?.heatThresholdC}°C`,
      justification: `Supervisory creation of monitored sector "${newZone.name}" with cohort size N=${newZone.count}`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [zoneAuditLog, ...prev]);

    setProtocolActiveNotice(`Custom Monitoring Zone "${newZone.name}" created and connected to live weather stream.`);
  };

  // Transmit medical dispatch
  const handleTransmitDispatch = (id: string) => {
    setMedicalDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'TRANSMITTED' } : d))
    );
    setProtocolActiveNotice(`Medical dispatch ${id} transmitted via Azure IoT Hub SMS/Radio relay.`);
  };

  const handleTransmitAllDispatches = () => {
    const count = stagedDispatchCount;
    setMedicalDispatches((prev) =>
      prev.map((d) => (d.status === 'STAGED' ? { ...d, status: 'TRANSMITTED' } : d))
    );
    setProtocolActiveNotice(`Transmitted all ${count} staged medical dispatches to on-site liaisons.`);
  };

  const handleAcknowledgeDispatch = (id: string, notes?: string) => {
    setMedicalDispatches((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'ACKNOWLEDGED_BY_TEAM',
              acknowledgedAt: new Date().toLocaleTimeString(),
              responderNotes: notes || 'Medical liaison arrived at zone tent.'
            }
          : d
      )
    );
  };

  const handleStageNewDispatch = (dispatchData: Omit<MedicalDispatchNotification, 'id' | 'stagedAt' | 'status'>) => {
    const newD: MedicalDispatchNotification = {
      ...dispatchData,
      id: `DSP-${Math.floor(1000 + Math.random() * 9000)}-MAN`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newD, ...prev]);
    setProtocolActiveNotice(`Staged new medical dispatch for ${dispatchData.zone} in queue.`);
  };

  // Acknowledge anomaly alert
  const handleAcknowledgeAlert = (id: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  // Dispatch action from active alerts list
  const handleDispatchAction = (alert: ActiveAnomalyAlert) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a))
    );

    const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';

    // Auto-stage dispatch notification
    const staged: MedicalDispatchNotification = {
      id: isPredictive
        ? `MNT-${Math.floor(1000 + Math.random() * 9000)}-ORD`
        : `DSP-${Math.floor(1000 + Math.random() * 9000)}-ALR`,
      alertId: alert.id,
      zone: alert.location_zone,
      severity: alert.severity === 'LOW' ? 'MODERATE' : alert.severity,
      recipientRole: isPredictive
        ? 'Reliability Engineering & Vibration Analysis Crew'
        : 'On-Site Medical Triage Lead',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: isPredictive ? '+1 (555) 832-MAINT' : '+1 (555) 911-COOL-2',
      messagePayload: isPredictive
        ? `PREDICTIVE MAINTENANCE WORK ORDER: ${alert.anomaly_metric} on ${alert.equipment_name || alert.worker_id} (${alert.equipment_id}). Directive: ${alert.recommended_action}`
        : `INTERVENTION DISPATCH: ${alert.anomaly_metric} at ${alert.location_zone}. Directive: ${alert.recommended_action}`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [staged, ...prev]);

    setProtocolActiveNotice(
      isPredictive
        ? `Predictive maintenance work order dispatched for ${alert.equipment_name || alert.id} (${alert.anomaly_metric}). Reliability crew notified via dual-channel SMS.`
        : `Dispatched intervention for ${alert.id} (${alert.anomaly_metric}). Automated SMS notification staged in medical dispatch queue.`
    );
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

    const thresholdAuditLog: SystemAuditLogEntry = {
      id: `AUD-TH-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Kalman Anomaly Filter Engine',
      parameter: `Sensitivity Preset: ${newConfig.preset} (Critical Cutoff & Noise Parameters)`,
      previousValue: `Preset: ${kalmanConfig.preset} (Cutoff: ${kalmanConfig.criticalCutoffPct}%, Q: ${kalmanConfig.processVarianceQ})`,
      newValue: `Preset: ${newConfig.preset} (Cutoff: ${newConfig.criticalCutoffPct}%, Q: ${newConfig.processVarianceQ}, R: ${newConfig.measurementVarianceR.toFixed(2)})`,
      justification: `Supervisory threshold recalibration to ${newConfig.preset} profile for active sector ${activeZoneObj.name}.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [thresholdAuditLog, ...prev]);

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

        // Synthesize audible voice alert for on-site supervisors
        if (voiceSettings.enabled) {
          voiceAlertService.speakAlert(freshAlert, voiceSettings);
        }
      }

      setLoading(false);
    }, 450);
  };

  const handleTriggerHydrationProtocol = () => {
    setProtocolActiveNotice(
      `Zone Hydration Protocol activated for ${activeZoneObj.name}. Automated sirens, water mist cooling units & medical liaisons dispatched.`
    );
    const newDispatch: MedicalDispatchNotification = {
      id: `HYD-${Math.floor(1000 + Math.random() * 9000)}`,
      alertId: 'ZONE-WIDE-HYDRATION',
      zone: activeZoneObj.name,
      severity: 'HIGH',
      recipientRole: 'Zone Hydration & Rest Foreman',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 772-COOL',
      messagePayload: `ZONE HYDRATION PROTOCOL TRIGGERED: Enforce mandatory 15-minute shaded pause for ${activeZoneObj.name} (N=${activeZoneObj.count}). Distribute 250ml electrolyte fluid.`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newDispatch, ...prev]);

    setTimeout(() => {
      setProtocolActiveNotice(null);
    }, 6000);
  };

  const handleCustomPacketFromSimulator = (customPacket: TelemetryPacket) => {
    const result = predictWorkforceAnomaly(customPacket, undefined, kalmanConfig);
    setTelemetryAlert(result);

    if (customPacket.cohort_size) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone ? { ...z, count: customPacket.cohort_size || z.count } : z
        )
      );
    }
  };

  // Direct Client-Side Executive Safety PDF Report Export
  const handleDirectPdfExport = async () => {
    setIsDirectPdfExporting(true);
    setDirectPdfStatus('Capturing telemetry charts & compiling executive safety report...');
    try {
      await generateExecutiveSafetyPdfReport({
        activeAlerts,
        telemetryStream,
        currentZone: activeZoneObj,
        zones,
        telemetryElementId: 'telemetry-charts-card',
        projectionElementId: 'incident-projection-chart-card',
        alertsElementId: 'active-alerts-section',
        onProgress: (status) => setDirectPdfStatus(status)
      });
      setProtocolActiveNotice('Executive Safety Report PDF successfully generated & downloaded.');
      setTimeout(() => setProtocolActiveNotice(null), 5000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setProtocolActiveNotice('Direct PDF capture encountered an issue, opening report modal instead.');
      setIsReportModalOpen(true);
    } finally {
      setIsDirectPdfExporting(false);
      setDirectPdfStatus('');
    }
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

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Medical Dispatch Queue Trigger */}
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center space-x-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Open Automated Medical Protocol Dispatch Queue"
          >
            <Radio className="h-3.5 w-3.5 text-rose-400" />
            <span>
              Medical Dispatch{' '}
              {stagedDispatchCount > 0 && (
                <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px] ml-1">
                  {stagedDispatchCount} Staged
                </span>
              )}
            </span>
          </button>

          {/* Continuous IoT Stream State Indicator */}
          <button
            onClick={() => setIsStreamingActive((s) => !s)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              isStreamingActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Live Continuous IoT Streaming Engine"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isStreamingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            <span>{isStreamingActive ? 'Streaming Hub: LIVE' : 'Streaming Hub: PAUSED'}</span>
          </button>

          {/* Audible Voice Dispatch Modal Trigger */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
              isSpeaking
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse'
                : voiceSettings.enabled
                ? 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Configure audible synthesized voice alerts for on-site supervisors"
          >
            {voiceSettings.enabled ? (
              <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'text-cyan-300 animate-ping' : 'text-cyan-400'}`} />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>
              Voice Dispatch:{' '}
              <strong className="text-white ml-0.5">
                {isSpeaking ? 'SPEAKING' : voiceSettings.enabled ? 'ON' : 'MUTED'}
              </strong>
            </span>
          </button>

          {/* Safety Resources Allocation Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('resource-allocation-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Dynamic On-Site Safety Resource Allocation & Personnel Redistribution"
          >
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Safety Resources</span>
          </button>

          {/* Sensitivity Settings */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Adjust Kalman filter sensitivity and anomaly detection thresholds"
          >
            <Settings className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              Sensitivity: <strong className="font-bold text-white ml-0.5">{kalmanConfig.preset}</strong>
            </span>
          </button>

          {/* System Audit Trail Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('system-audit-log-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="View System Audit Log tracking manual sensitivity and zone changes"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit Trail ({systemAuditLogs.length})</span>
          </button>

          {/* Sensor Correlation Scatter Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('sensor-correlation-scatter-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Explore multi-variable sensor correlations & root causes"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            <span>Correlations ({correlationData.length})</span>
          </button>

          {/* Simulator & Jitter Drawer */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>IoT Hub &amp; Bursts</span>
          </button>

          {/* Executive Safety PDF Report (Client-Side) */}
          <button
            onClick={handleDirectPdfExport}
            disabled={isDirectPdfExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs border ${
              isDirectPdfExporting
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-cyan-950/70 hover:bg-cyan-900/70 border-cyan-500/40 text-cyan-300'
            }`}
            title="Directly compile & download printable Executive Safety PDF report capturing telemetry charts and active alerts"
          >
            {isDirectPdfExporting ? (
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span>{isDirectPdfExporting ? 'Generating PDF...' : 'Executive Safety PDF'}</span>
          </button>

          {/* Compliance Report Modal Trigger */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Reports &amp; CSV</span>
          </button>
        </div>
      </header>

      {/* PDF Export In-Flight Notification */}
      {isDirectPdfExporting && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 text-xs flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
            <div>
              <span className="font-bold text-white text-sm block">Generating Executive Safety PDF Report...</span>
              <span className="text-[11px] text-cyan-300 font-mono">{directPdfStatus}</span>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full font-mono font-semibold border border-cyan-500/40">
            Client-Side jsPDF &amp; Canvas
          </span>
        </div>
      )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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

        {/* Equipment Predictive Maintenance Macro Metric Card */}
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl">
          <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            Predictive Maintenance
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">
              {activeAlerts.filter((a) => a.alert_type === 'PREDICTIVE_MAINTENANCE' && !a.acknowledged).length} Pending
            </h3>
            <span className="text-[11px] text-amber-300/80 font-mono">
              Vibration / Heat
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Avg Wet-Bulb Heat Index</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">{activeZoneObj.heatIndex || 42.5}°C</h3>
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

      {/* Hyper-Local Real-Time Weather Integration Card */}
      <ZoneWeatherCard
        weather={currentWeather}
        loading={weatherLoading}
        onRefreshWeather={() => syncLiveWeather(activeZoneObj)}
        zoneName={activeZoneObj.name}
        latitude={activeZoneObj.latitude}
        longitude={activeZoneObj.longitude}
      />

      {/* 2D Floor Plan Visualization Component with Zone Hotspots & Sensor Telemetry Stream Toggles */}
      <FloorPlan2DView
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        activeAlerts={activeAlerts}
        streamToggles={streamToggles}
        onToggleStream={handleToggleStream}
        onSetAllStreams={handleSetAllStreams}
        recentTelemetryPoint={telemetryStream[telemetryStream.length - 1]}
      />

      {/* Sliding 24-Hour Recharts Telemetry Stream with 1-Hour Forecast */}
      <TelemetryCharts
        data={telemetryStream}
        zoneName={activeZoneObj.name}
        streamToggles={streamToggles}
      />

      {/* Multi-Variable Sensor Correlation & Root-Cause Scatter Plot (Recharts) */}
      <div id="sensor-correlation-scatter-section">
        <SensorCorrelationScatterPlot
          data={correlationData}
          zones={zones}
          selectedZoneId={selectedZone}
          onSelectZone={(zoneId) => setSelectedZone(zoneId)}
        />
      </div>

      {/* 48-Hour Potential Incident Volume Projection Trend Analysis (Recharts) */}
      <IncidentProjectionChart
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        currentZone={activeZoneObj}
      />

      {/* Active Alerts Section (Kalman Filter Anomaly Detection with D3 Weekly Heatmap & Predictive Maintenance) */}
      <ActiveAlertsSection
        alerts={activeAlerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
        onSpeakAlert={handleSpeakAlert}
        isSpeaking={isSpeaking}
        voiceEnabled={voiceSettings.enabled}
      />

      {/* Main Operational Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Geospatial Zone Selector / Heatmap & Custom Zone Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-cyan-400" /> Industrial Facility Zones
              </h2>
              <button
                onClick={() => setIsZoneBuilderOpen(true)}
                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition shadow-xs"
              >
                <Plus className="h-3 w-3" />
                <span>Custom Zone</span>
              </button>
            </div>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedZone(zone.id);
                    const newPacket = generatePacketForZone(zone, zone.status === 'CRITICAL');
                    const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
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
                  {zone.customBaselines && (
                    <div className="text-[10px] text-cyan-400/80 font-mono mt-1">
                      Custom Baselines: HRV {zone.customBaselines.baselineHrv}ms | Noise {zone.customBaselines.noiseLimitDb}dB
                    </div>
                  )}
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
              onClick={() => setIsDispatchModalOpen(true)}
              className="bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-rose-600/40 flex items-center gap-1.5 shadow-sm"
            >
              <Radio className="h-4 w-4 text-rose-400" />
              <span>Stage Medical Dispatch ({stagedDispatchCount})</span>
            </button>
            <button
              onClick={handleDirectPdfExport}
              disabled={isDirectPdfExporting}
              className={`font-medium py-2.5 px-4 rounded-lg text-sm transition border flex items-center gap-1.5 shadow-sm ${
                isDirectPdfExporting
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border-cyan-500/40'
              }`}
            >
              {isDirectPdfExporting ? (
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-cyan-400" />
              )}
              <span>{isDirectPdfExporting ? 'Generating PDF...' : 'Executive Safety PDF'}</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-emerald-600/40 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Compliance CSV / Print</span>
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-slate-700 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic On-Site Safety Resource Allocation & Personnel Redistribution Module */}
      <ResourceAllocationModule
        zones={zones}
        alerts={activeAlerts}
        onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
      />

      {/* System Audit Log Component: Manual Changes to Sensitivity Thresholds & Zone Configurations */}
      <div id="system-audit-log-section">
        <SystemAuditLog
          logs={systemAuditLogs}
          onAddManualLog={handleAddManualAuditLog}
        />
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
        isStreamingActive={isStreamingActive}
        onToggleLiveStream={() => setIsStreamingActive((s) => !s)}
        jitterEnabled={jitterEnabled}
        onToggleJitter={() => setJitterEnabled((j) => !j)}
        onTriggerBurst={handleTriggerBurst}
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

      <MedicalDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        dispatches={medicalDispatches}
        onTransmitDispatch={handleTransmitDispatch}
        onTransmitAll={handleTransmitAllDispatches}
        onAcknowledgeDispatch={handleAcknowledgeDispatch}
        onStageNewDispatch={handleStageNewDispatch}
        zoneNames={zones.map((z) => z.name)}
      />

      <CustomZoneBuilderModal
        isOpen={isZoneBuilderOpen}
        onClose={() => setIsZoneBuilderOpen(false)}
        onAddZone={handleAddCustomZone}
      />

      {/* Audible Voice Alerts Synthesis Modal */}
      <VoiceAlertsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={voiceSettings}
        onUpdateSettings={setVoiceSettings}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
      />
    </div>
  );
}

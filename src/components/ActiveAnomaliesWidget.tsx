import React, { useState, useMemo } from 'react';
import { ActiveAnomalyAlert, TelemetryDataPoint } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  Heart,
  Thermometer,
  Volume2,
  Wrench,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  ArrowRight,
  Radio,
  Zap,
  Sparkles,
  ChevronRight,
  Send,
  Eye,
  Activity,
  Layers,
  Lock
} from 'lucide-react';
import ExplainableAnomalyTooltip from './ExplainableAnomalyTooltip';

interface ActiveAnomaliesWidgetProps {
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  onAcknowledgeAlert: (id: string) => void;
  onDispatchAction: (alert: ActiveAnomalyAlert) => void;
  onSelectZone: (zoneId: string) => void;
  onSpeakAlert?: (alert: ActiveAnomalyAlert) => void;
  isSpeaking?: boolean;
}

function ActiveAnomaliesWidgetComponent({
  alerts,
  telemetryStream,
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone,
  onSpeakAlert,
  isSpeaking = false
}: ActiveAnomaliesWidgetProps) {
  const [filterType, setFilterType] = useState<'URGENT' | 'HEALTH' | 'EQUIPMENT' | 'ALL'>('URGENT');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Latest real-time telemetry sample point
  const latestTelemetry = telemetryStream[telemetryStream.length - 1];

  // Urgent anomalies: Critical and High severity alerts
  const urgentAlerts = useMemo(() => {
    return alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  }, [alerts]);

  const pendingCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && !a.acknowledged).length;

  // Filtered alerts list based on selected view mode (keeps acknowledged alerts visible with clear badge instead of disappearing)
  const displayedAlerts = useMemo(() => {
    const list = alerts.filter((alert) => {
      if (filterType === 'URGENT') {
        return alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
      }
      if (filterType === 'HEALTH') {
        return alert.alert_type !== 'PREDICTIVE_MAINTENANCE';
      }
      if (filterType === 'EQUIPMENT') {
        return alert.alert_type === 'PREDICTIVE_MAINTENANCE';
      }
      return true;
    });

    // Sort unacknowledged alerts first so action items stay at the top without hiding resolved ones
    return [...list].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      return 0;
    });
  }, [alerts, filterType]);

  // Compute live real-time telemetry deviation highlights from current stream
  const liveDeviations = useMemo(() => {
    if (!latestTelemetry) return [];

    const deviations: Array<{
      id: string;
      label: string;
      metric: string;
      currentValue: string;
      baseline: string;
      delta: string;
      severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NOMINAL';
      icon: typeof Heart;
      iconColor: string;
    }> = [];

    // 1. Autonomic Heart Rate Variability Deviation
    const hrvBaseline = 68.0;
    const hrvCurrent = latestTelemetry.smoothed_hrv;
    const hrvDropPct = latestTelemetry.hrv_drop_pct || ((hrvBaseline - hrvCurrent) / hrvBaseline) * 100;
    if (hrvCurrent <= 40) {
      deviations.push({
        id: 'DEV-HRV',
        label: 'Acute Autonomic Strain (HRV)',
        metric: 'Parasympathetic Tone',
        currentValue: `${hrvCurrent.toFixed(1)} ms`,
        baseline: `${hrvBaseline} ms baseline`,
        delta: `-${hrvDropPct.toFixed(1)}% drop`,
        severity: 'CRITICAL',
        icon: Heart,
        iconColor: 'text-rose-400'
      });
    } else if (hrvCurrent <= 52) {
      deviations.push({
        id: 'DEV-HRV',
        label: 'Moderate Cardiovascular Fatigue',
        metric: 'HRV RMSSD',
        currentValue: `${hrvCurrent.toFixed(1)} ms`,
        baseline: `${hrvBaseline} ms baseline`,
        delta: `-${hrvDropPct.toFixed(1)}% drop`,
        severity: 'HIGH',
        icon: Heart,
        iconColor: 'text-amber-400'
      });
    }

    // 2. Core / Skin Temperature Elevation
    const skinTemp = latestTelemetry.skin_temp_c;
    if (skinTemp >= 38.0) {
      deviations.push({
        id: 'DEV-TEMP',
        label: 'Hyperthermic Core Drift',
        metric: 'Worker Skin Temperature',
        currentValue: `${skinTemp.toFixed(1)}°C`,
        baseline: '36.5°C nominal',
        delta: `+${(skinTemp - 36.5).toFixed(1)}°C elevation`,
        severity: 'CRITICAL',
        icon: Thermometer,
        iconColor: 'text-rose-400'
      });
    } else if (skinTemp >= 37.4) {
      deviations.push({
        id: 'DEV-TEMP',
        label: 'Elevated Heat Accumulation',
        metric: 'Skin Temperature',
        currentValue: `${skinTemp.toFixed(1)}°C`,
        baseline: '36.5°C nominal',
        delta: `+${(skinTemp - 36.5).toFixed(1)}°C`,
        severity: 'HIGH',
        icon: Thermometer,
        iconColor: 'text-amber-400'
      });
    }

    // 3. Acoustic Machine Overpressure
    const noise = latestTelemetry.noise_db ?? latestTelemetry.raw_noise_db;
    if (noise >= 95.0) {
      deviations.push({
        id: 'DEV-NOISE',
        label: 'Acoustic Machinery Overpressure',
        metric: 'Ambient Noise Pressure',
        currentValue: `${noise.toFixed(1)} dBA`,
        baseline: '85.0 dBA OSHA Limit',
        delta: `+${(noise - 85.0).toFixed(1)} dBA breach`,
        severity: 'CRITICAL',
        icon: Volume2,
        iconColor: 'text-rose-400'
      });
    } else if (noise >= 86.0) {
      deviations.push({
        id: 'DEV-NOISE',
        label: 'Elevated Acoustic Permissible Limit',
        metric: 'Ambient Noise Pressure',
        currentValue: `${noise.toFixed(1)} dBA`,
        baseline: '85.0 dBA OSHA Limit',
        delta: `+${(noise - 85.0).toFixed(1)} dBA`,
        severity: 'HIGH',
        icon: Volume2,
        iconColor: 'text-amber-400'
      });
    }

    // 4. Machinery Vibration (Predictive Maintenance)
    if (latestTelemetry.equipment_vibration_mm_s && latestTelemetry.equipment_vibration_mm_s >= 4.5) {
      deviations.push({
        id: 'DEV-VIB',
        label: 'Motor Bearing Vibration Runout',
        metric: 'ISO 10816 Velocity RMS',
        currentValue: `${latestTelemetry.equipment_vibration_mm_s.toFixed(2)} mm/s`,
        baseline: '2.8 mm/s nominal',
        delta: `+${((latestTelemetry.equipment_vibration_mm_s - 2.8) / 2.8 * 100).toFixed(0)}% breach`,
        severity: latestTelemetry.equipment_vibration_mm_s >= 6.0 ? 'CRITICAL' : 'HIGH',
        icon: Wrench,
        iconColor: 'text-amber-400'
      });
    }

    return deviations;
  }, [latestTelemetry]);

  return (
    <div
      id="active-anomalies-widget"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5 shadow-sm"
    >
      {/* Widget Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Active Health &amp; Safety Anomalies
              </h2>
              {criticalCount + highCount > 0 && (
                <span className="bg-rose-500/15 text-rose-300 border border-rose-500/35 text-[11px] px-2 py-0.5 rounded-full font-semibold font-mono tabular-nums">
                  {criticalCount + highCount} Urgent Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time telemetry deviation triage &middot; Kalman noise verified
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType('URGENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-semibold text-xs cursor-pointer ${
              filterType === 'URGENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Urgent ({criticalCount + highCount})</span>
          </button>

          <button
            onClick={() => setFilterType('HEALTH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium text-xs cursor-pointer ${
              filterType === 'HEALTH'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Physiological</span>
          </button>

          <button
            onClick={() => setFilterType('EQUIPMENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium text-xs cursor-pointer ${
              filterType === 'EQUIPMENT'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Equipment</span>
          </button>

          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md transition text-xs font-medium cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({alerts.length})
          </button>
        </div>
      </div>

      {/* Live Stream Telemetry Deviations Summary */}
      {liveDeviations.length > 0 && (
        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Current Stream Deviations
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {latestTelemetry?.timeLabel || 'Live'} &middot; 15m interval
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {liveDeviations.map((dev) => {
              const IconComp = dev.icon;
              return (
                <div
                  key={dev.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between bg-slate-950/60 ${
                    dev.severity === 'CRITICAL'
                      ? 'border-rose-500/40 border-l-2 border-l-rose-500'
                      : 'border-amber-500/35 border-l-2 border-l-amber-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                      <IconComp className={`h-3.5 w-3.5 shrink-0 ${dev.iconColor}`} />
                      {dev.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        dev.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {dev.severity}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold font-mono tabular-nums text-white">{dev.currentValue}</span>
                    <span className="text-xs font-mono tabular-nums font-semibold text-rose-400">{dev.delta}</span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                    Ref: {dev.baseline}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Urgent Anomalies Triage Queue */}
      <div className="space-y-3 mt-4">
        {displayedAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-200">All Urgent Deviations Triage Clear</p>
            <p className="text-xs text-slate-400 mt-1">
              No unacknowledged critical anomalies in active queue for the selected filter.
            </p>
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
            const isCritical = alert.severity === 'CRITICAL';

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-colors p-4 bg-slate-950/40 ${
                  isCritical
                    ? 'border-rose-500/40 border-l-2 border-l-rose-500'
                    : alert.severity === 'HIGH'
                    ? 'border-amber-500/35 border-l-2 border-l-amber-500'
                    : 'border-slate-800 hover:border-slate-700'
                } ${alert.acknowledged ? 'opacity-65' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: Severity & Anomaly Information */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                        }`}
                      >
                        {alert.severity}
                      </span>

                      <span className="font-semibold text-sm text-white">
                        {alert.anomaly_metric}
                      </span>

                      <ExplainableAnomalyTooltip alert={alert} triggerVariant="badge" />

                      <span className="text-xs font-mono text-slate-400">{alert.id}</span>
                      <span className="text-slate-600">&middot;</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {alert.detected_at}
                      </span>
                    </div>

                    {/* Zone & Cohort Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <button
                        onClick={() => onSelectZone(alert.location_zone)}
                        className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition underline underline-offset-2 cursor-pointer"
                        title="Focus dashboard on this facility zone"
                      >
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-medium">{alert.location_zone}</span>
                      </button>

                      <span className="text-slate-600">&middot;</span>

                      {isPredictive ? (
                        <span className="font-mono text-amber-300">
                          {alert.equipment_name || alert.equipment_id} ({alert.equipment_id})
                        </span>
                      ) : (
                        <span className="font-mono text-slate-300">
                          Worker ID: {alert.worker_id}
                        </span>
                      )}

                      <span className="text-slate-600">&middot;</span>

                      <span className="text-emerald-400 text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {alert.privacy_status}
                      </span>
                    </div>

                    {/* Telemetry Comparison & Protocol Strip */}
                    <div className="pt-2 border-t border-slate-800/70 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Activity className="h-3 w-3 text-cyan-400" />
                          Kalman Verification
                        </span>
                        <div className="font-mono text-xs tabular-nums">
                          <span className="text-amber-300">{alert.raw_value}</span>
                          <span className="mx-1.5 text-slate-600">&rarr;</span>
                          <span className="text-cyan-300 font-semibold">{alert.kalman_smoothed_value}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          {alert.kalman_status}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-rose-400" />
                          Early Warning Lead
                        </span>
                        <div className="text-xs font-semibold text-rose-300 font-mono tabular-nums">
                          {alert.lead_time}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                          Protocol Directive
                        </span>
                        <div className="text-xs text-slate-200 line-clamp-2">
                          {alert.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    {alert.acknowledged ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Protocol Staged</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => onDispatchAction(alert)}
                          className={`text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                            isPredictive
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : isCritical
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>
                            {isPredictive ? 'Dispatch Reliability Tech' : 'Dispatch Rapid Triage'}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>Acknowledge</span>
                          </button>

                          {onSpeakAlert && (
                            <button
                              onClick={() => onSpeakAlert(alert)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 p-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                              title="Voice broadcast alert over PA system"
                              aria-label="Voice Broadcast"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Summary Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 mt-4 border-t border-slate-800 gap-2">
        <span>
          Pending Urgent: <strong className="text-white font-mono tabular-nums">{criticalCount + highCount}</strong>
        </span>

        <span>
          Kalman False-Positive Suppression: <strong className="text-emerald-400 font-mono tabular-nums">97.9%</strong>
        </span>

        <span className="text-slate-400">
          Relay: Azure IoT SMS &middot; UHF Ch 4
        </span>
      </div>
    </div>
  );
}

const ActiveAnomaliesWidget = React.memo(ActiveAnomaliesWidgetComponent);
export default ActiveAnomaliesWidget;

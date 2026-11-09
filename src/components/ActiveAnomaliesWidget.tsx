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

export default function ActiveAnomaliesWidget({
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

  // Filtered alerts list based on selected view mode
  const displayedAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterType === 'URGENT') {
        return (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') && !alert.acknowledged;
      }
      if (filterType === 'HEALTH') {
        return alert.alert_type !== 'PREDICTIVE_MAINTENANCE';
      }
      if (filterType === 'EQUIPMENT') {
        return alert.alert_type === 'PREDICTIVE_MAINTENANCE';
      }
      return true;
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
      className="bg-slate-900 border-2 border-rose-500/40 rounded-xl p-5 mb-6 shadow-2xl shadow-rose-950/20 relative overflow-hidden"
    >
      {/* Top Banner Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"></div>

      {/* Widget Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center justify-center p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Active Health &amp; Safety Anomalies
                </h2>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wide flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-spin text-rose-400" />
                  HIGH-PRIORITY COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time telemetry stream deviation analyzer • Kalman noise verified • Immediate triage staging
              </p>
            </div>
          </div>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('URGENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-semibold text-xs ${
                filterType === 'URGENT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
              <span>Urgent Triage ({criticalCount + highCount})</span>
            </button>

            <button
              onClick={() => setFilterType('HEALTH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium text-xs ${
                filterType === 'HEALTH'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className="h-3.5 w-3.5 text-cyan-400" />
              <span>Physiological Strain</span>
            </button>

            <button
              onClick={() => setFilterType('EQUIPMENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium text-xs ${
                filterType === 'EQUIPMENT'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Predictive Equipment</span>
            </button>

            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-md transition text-xs font-medium ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Live Stream Telemetry Deviations Ticker */}
      {liveDeviations.length > 0 && (
        <div className="my-4 bg-slate-950/80 border border-rose-500/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                Real-Time Telemetry Stream Deviations Detected (Current Sliding Interval)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Timestamp: {latestTelemetry?.timeLabel || 'Live'} | Sample Rate: 15m
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {liveDeviations.map((dev) => {
              const IconComp = dev.icon;
              return (
                <div
                  key={dev.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    dev.severity === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold truncate flex items-center gap-1.5">
                      <IconComp className={`h-3.5 w-3.5 shrink-0 ${dev.iconColor}`} />
                      {dev.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        dev.severity === 'CRITICAL'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {dev.severity}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold font-mono text-white">{dev.currentValue}</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{dev.delta}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
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
          <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-300">All Urgent Deviations Triage Clear</p>
            <p className="text-[11px] text-slate-500 mt-1">
              No unacknowledged critical anomalies in active queue for the selected filter.
            </p>
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
            const isCritical = alert.severity === 'CRITICAL';
            const isExpanded = selectedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all duration-200 p-4 ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/30'
                    : alert.severity === 'HIGH'
                    ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                } ${alert.acknowledged ? 'opacity-65' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: Severity & Anomaly Information */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity Pill with pulsing beacon */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          isCritical
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 shadow-xs shadow-rose-500/20'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isCritical ? 'bg-rose-400 animate-ping' : 'bg-orange-400'}`}></span>
                        {alert.severity} DEVIATION
                      </span>

                      {/* Type Badge */}
                      {isPredictive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Wrench className="h-3 w-3 text-amber-400" />
                          PREDICTIVE MAINTENANCE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          <Heart className="h-3 w-3 text-cyan-400" />
                          PHYSIOLOGICAL STRAIN
                        </span>
                      )}

                      {/* Title */}
                      <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                        {alert.anomaly_metric}
                      </span>

                      {/* Explainable Anomaly Tooltip */}
                      <ExplainableAnomalyTooltip alert={alert} triggerVariant="badge" />

                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{alert.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {alert.detected_at}
                      </span>
                    </div>

                    {/* Zone & Cohort Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <button
                        onClick={() => onSelectZone(alert.location_zone)}
                        className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition underline underline-offset-2"
                        title="Focus dashboard on this facility zone"
                      >
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-medium">{alert.location_zone}</span>
                      </button>

                      <span className="text-slate-600">|</span>

                      {isPredictive ? (
                        <span className="font-mono text-amber-300">
                          Equipment: {alert.equipment_name || alert.equipment_id} ({alert.equipment_id})
                        </span>
                      ) : (
                        <span className="font-mono text-slate-300">
                          Worker Masked ID: {alert.worker_id}
                        </span>
                      )}

                      <span className="text-slate-600">|</span>

                      <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                        <Lock className="h-3 w-3 text-emerald-400" />
                        {alert.privacy_status}
                      </span>
                    </div>

                    {/* Telemetry Comparison & Kalman Verification Strip */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                          <Activity className="h-3 w-3 text-cyan-400" />
                          Raw Telemetry vs Kalman Smoothed:
                        </span>
                        <div className="font-mono text-[11px]">
                          <span className="text-amber-400 font-medium">Raw: {alert.raw_value}</span>
                          <span className="mx-1 text-slate-600">&rarr;</span>
                          <span className="text-cyan-400 font-bold">K: {alert.kalman_smoothed_value}</span>
                        </div>
                        <span className="text-[10px] text-cyan-300 font-mono block">
                          Filter Status: {alert.kalman_status}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3 text-rose-400" />
                          Predictive Lead Time Margin:
                        </span>
                        <div className="text-xs font-bold text-rose-300 font-mono">
                          {alert.lead_time}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Triage Window Before Syncope / Seizure
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                          Recommended Protocol Directive:
                        </span>
                        <div className="text-[11px] text-slate-200 line-clamp-2">
                          {alert.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: High-Priority Operational Action Buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    {/* Speak Alert Voice Broadcast */}
                    {onSpeakAlert && (
                      <button
                        onClick={() => onSpeakAlert(alert)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center justify-center gap-1.5"
                        title="Voice broadcast synthesized alert over PA system"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Voice Broadcast</span>
                      </button>
                    )}

                    {alert.acknowledged ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Protocol Staged</span>
                      </span>
                    ) : (
                      <>
                        {/* Primary Urgent Dispatch Button */}
                        <button
                          onClick={() => onDispatchAction(alert)}
                          className={`text-xs font-bold px-4 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-1.5 ${
                            isPredictive
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                              : isCritical
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>
                            {isPredictive ? 'Dispatch Reliability Tech' : 'Dispatch Rapid Triage'}
                          </span>
                        </button>

                        {/* Acknowledge Button */}
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition border border-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>Acknowledge</span>
                        </button>
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
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800 gap-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400"></span>
          Pending Urgent Deviations: <strong className="text-white">{criticalCount + highCount}</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          Kalman False-Positive Suppression: <strong className="text-white">97.9%</strong>
        </span>

        <span className="text-slate-400">
          Triage Dispatch Relay: Azure IoT SMS + UHF Channel 4
        </span>
      </div>
    </div>
  );
}

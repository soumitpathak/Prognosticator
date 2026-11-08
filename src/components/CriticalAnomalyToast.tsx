import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Sparkles,
  Radio,
  TrendingUp,
  X,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Heart,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Activity,
  History,
  Brain,
  Flame,
  Users,
  ExternalLink
} from 'lucide-react';
import { CriticalAnomalyToastData } from '../types';
import { voiceAlertService } from '../services/voiceAlertService';

interface CriticalAnomalyToastProps {
  toasts: CriticalAnomalyToastData[];
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onClearAll?: () => void;
  onDismissAll?: () => void;
  onDispatchAction?: (toast: CriticalAnomalyToastData) => void;
  onInspectInChart?: (zoneId: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  isMuted?: boolean;
  onToggleMuteAlerts?: () => void;
}

export default function CriticalAnomalyToast({
  toasts,
  onDismiss,
  onAcknowledge,
  onClearAll,
  onDismissAll,
  onDispatchAction,
  onInspectInChart,
  soundEnabled = true,
  onToggleSound,
  isMuted = false,
  onToggleMuteAlerts
}: CriticalAnomalyToastProps) {
  const [hoveredToastId, setHoveredToastId] = useState<string | null>(null);
  const [expandedAttributions, setExpandedAttributions] = useState<Record<string, boolean>>({});
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyLog, setHistoryLog] = useState<CriticalAnomalyToastData[]>([]);

  const handleDismissAll = onDismissAll || onClearAll;

  // Accumulate past toasts into shift history log
  useEffect(() => {
    if (toasts.length > 0) {
      setHistoryLog((prev) => {
        const newItems = toasts.filter((t) => !prev.some((p) => p.id === t.id));
        if (newItems.length === 0) return prev;
        return [...newItems, ...prev].slice(0, 40);
      });
    }
  }, [toasts]);

  // Play audio chime when a new toast arrives (unless muted)
  useEffect(() => {
    if (toasts.length > 0 && soundEnabled && !isMuted) {
      const topToast = toasts[0];
      const sev = topToast.riskTier === 'HIGH_RISK' ? 'HIGH' : 'CRITICAL';
      voiceAlertService.playAlertChime(sev);
    }
  }, [toasts.length, soundEnabled, isMuted]);

  const toggleAttributions = (id: string) => {
    setExpandedAttributions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (toasts.length === 0 && !showHistoryModal) return null;

  const visibleToasts = toasts.slice(0, 4);
  const queuedCount = toasts.length - visibleToasts.length;

  return (
    <>
      {/* Floating Top-Right Toast Stack */}
      <aside
        aria-label="High-Risk Population Health Anomaly Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none select-none"
      >
        {/* Floating Stack Header Bar (when active toasts exist) */}
        {toasts.length > 0 && (
          <div className="pointer-events-auto flex items-center justify-between bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold tracking-wider font-mono text-[11px] text-white flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-cyan-400" />
                <span>POPULATION HEALTH ALERTS ({toasts.length})</span>
              </span>
              {queuedCount > 0 && (
                <span className="bg-rose-950 border border-rose-800 text-rose-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  +{queuedCount} queued
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              {onToggleMuteAlerts && (
                <button
                  onClick={onToggleMuteAlerts}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition cursor-pointer flex items-center gap-1 ${
                    isMuted
                      ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title={isMuted ? 'Alerts are muted — Click to unmute' : 'Mute health anomaly alert notifications'}
                >
                  {isMuted ? (
                    <VolumeX className="h-3 w-3 text-amber-400" />
                  ) : (
                    <Volume2 className="h-3 w-3 text-cyan-400" />
                  )}
                  <span>{isMuted ? 'MUTED' : 'MUTE ALERTS'}</span>
                </button>
              )}

              {onToggleSound && !onToggleMuteAlerts && (
                <button
                  onClick={onToggleSound}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title={soundEnabled ? 'Mute alert chimes' : 'Unmute alert chimes'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </button>
              )}

              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="View shift anomaly alert history"
              >
                <History className="h-3.5 w-3.5" />
              </button>

              {handleDismissAll && (
                <button
                  onClick={handleDismissAll}
                  className="flex items-center space-x-1 text-[10px] font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 hover:text-white px-2 py-0.5 rounded transition font-mono cursor-pointer shadow-xs"
                  title="Dismiss all active alerts in queue"
                >
                  <X className="h-3 w-3 text-rose-400" />
                  <span>Dismiss All</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Multi-Anomaly Queue Sticky Bar with prominent Dismiss All button */}
        {toasts.length > 1 && handleDismissAll && (
          <div className="pointer-events-auto bg-slate-950/95 border border-rose-500/50 rounded-xl px-3 py-2 shadow-2xl flex items-center justify-between backdrop-blur-md animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-200">
                <strong className="text-rose-400 font-bold">{toasts.length}</strong> active anomaly alerts
              </span>
            </div>
            <button
              onClick={handleDismissAll}
              className="flex items-center space-x-1.5 text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3 py-1 rounded-lg transition shadow-md shadow-rose-950/50 cursor-pointer"
              title="Dismiss all anomalies currently in queue"
            >
              <X className="h-3.5 w-3.5" />
              <span>Dismiss All ({toasts.length})</span>
            </button>
          </div>
        )}

        {/* Stack of Active Population Health Toasts */}
        {visibleToasts.map((toast) => {
          const isHovered = hoveredToastId === toast.id;
          const isCritical = toast.riskTier !== 'HIGH_RISK';
          const isAttributionsExpanded = !!expandedAttributions[toast.id];

          return (
            <div
              key={toast.id}
              onMouseEnter={() => setHoveredToastId(toast.id)}
              onMouseLeave={() => setHoveredToastId(null)}
              className={`pointer-events-auto bg-slate-950/95 border-2 rounded-2xl shadow-2xl p-4 backdrop-blur-md relative overflow-hidden transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4 ${
                isCritical
                  ? 'border-rose-500 shadow-rose-950/60 bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950'
                  : 'border-amber-500 shadow-amber-950/50 bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950'
              }`}
            >
              {/* Top Engine & Severity Banner */}
              <div
                className={`flex items-center justify-between pb-2 mb-2.5 border-b ${
                  isCritical ? 'border-rose-900/60' : 'border-amber-900/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isCritical ? 'bg-rose-400' : 'bg-amber-400'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isCritical ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    ></span>
                  </span>
                  <div>
                    <span
                      className={`text-xs font-black tracking-wider uppercase font-mono flex items-center gap-1.5 ${
                        isCritical ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {isCritical ? (
                        <AlertOctagon className="h-4 w-4 text-rose-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      <span>
                        {isCritical ? 'CRITICAL POPULATION HEALTH ANOMALY' : 'HIGH-RISK POPULATION HEALTH ANOMALY'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Prognosticator Telemetry Engine • LSTM-Kalman Core
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {toast.timeFormatted}
                  </span>
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer hover:bg-slate-800"
                    title="Dismiss alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Department & Population Cohort Row */}
              <div className="grid grid-cols-2 gap-2 mb-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                {/* Department & Location */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-cyan-400" /> Department / Facility
                  </span>
                  <div className="font-bold text-white text-xs mt-0.5 truncate" title={toast.department}>
                    {toast.department}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">
                    {toast.zoneName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <Users className="h-2.5 w-2.5" />
                    <span>Cohort: N={toast.cohortCount || 18} Workers</span>
                  </span>
                </div>

                {/* Engine Risk Probability & Confidence */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center justify-end gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" /> Engine Confidence
                  </span>
                  <div className="font-mono font-black text-sm text-emerald-400 mt-0.5">
                    {toast.confidenceLevelFormatted}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5">
                    <span className={isCritical ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                      {toast.riskProbability
                        ? `${(toast.riskProbability * 100).toFixed(1)}% Risk Prob`
                        : 'Exceedance Detected'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Recon MSE: {toast.reconstructionMse.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Anomaly Metric & Multi-Signal Exceedance */}
              <div className="space-y-1.5 text-xs text-slate-200 mb-2.5">
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-medium">Trigger Signal:</span>
                  <span className={`font-semibold text-right ${isCritical ? 'text-rose-300' : 'text-amber-300'}`}>
                    {toast.anomalyMetric}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                  <span className="text-slate-400">Observed Telemetry:</span>
                  <span className="text-right">
                    <strong className={isCritical ? 'text-rose-400' : 'text-amber-400'}>
                      {toast.measuredValue}
                    </strong>
                  </span>
                </div>

                {/* Explainable AI Attribution Bars (Collapsible) */}
                {toast.attributions && Object.keys(toast.attributions).length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleAttributions(toast.id)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Brain className="h-3 w-3" />
                      <span>
                        {isAttributionsExpanded ? 'Hide Attribution Weights' : 'Show Explainable Feature Weights (SHAP)'}
                      </span>
                      {isAttributionsExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    {isAttributionsExpanded && (
                      <div className="mt-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-1.5 animate-in fade-in-50">
                        <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                          Telemetry Signal Weight Contribution:
                        </div>
                        {Object.entries(toast.attributions).map(([feature, weight]) => {
                          const pct = Math.round(Number(weight) * 100);
                          return (
                            <div key={feature} className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-300 truncate max-w-[190px]">{feature}</span>
                                <span className="text-cyan-400 font-bold">{pct}%</span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Directive Action Box */}
                <div
                  className={`p-2 rounded-lg border text-[11px] ${
                    isCritical
                      ? 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                      : 'bg-amber-950/40 border-amber-900/50 text-amber-200'
                  }`}
                >
                  <strong
                    className={`uppercase text-[10px] block font-bold mb-0.5 flex items-center gap-1 ${
                      isCritical ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    <Activity className="h-3 w-3" />
                    <span>Operational Directive:</span>
                  </strong>
                  {toast.recommendedAction}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                {onDispatchAction && (
                  <button
                    onClick={() => onDispatchAction(toast)}
                    disabled={toast.dispatched}
                    className={`flex-1 flex items-center justify-center space-x-1.5 text-white font-bold text-xs py-1.5 px-2.5 rounded-lg transition shadow-md cursor-pointer ${
                      toast.dispatched
                        ? 'bg-emerald-700/80 cursor-default'
                        : isCritical
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                        : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-slate-950 font-black'
                    }`}
                  >
                    <Radio className={`h-3.5 w-3.5 ${toast.dispatched ? '' : 'animate-pulse'}`} />
                    <span>{toast.dispatched ? 'Dispatch Staged ✓' : 'Stage Medical Dispatch'}</span>
                  </button>
                )}

                {onInspectInChart && (
                  <button
                    onClick={() => onInspectInChart(toast.zoneId)}
                    className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                    title="Inspect anomaly in 24h Telemetry Chart"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Chart</span>
                  </button>
                )}

                <button
                  onClick={() => onAcknowledge(toast.id)}
                  disabled={toast.acknowledged}
                  className={`flex items-center space-x-1 text-xs py-1.5 px-2.5 rounded-lg border transition cursor-pointer ${
                    toast.acknowledged
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Acknowledge alert"
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${toast.acknowledged ? 'text-emerald-400' : 'text-slate-400'}`}
                  />
                  <span>{toast.acknowledged ? 'Acked' : 'Ack'}</span>
                </button>
              </div>

              {/* Compliance & Privacy Shield Footer Tag */}
              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-cyan-400" />
                  <span>{toast.privacyNotice || 'k-Anonymity Verified (N >= 12)'}</span>
                </span>
                <span>Pseudonym: {toast.workerPseudonym}</span>
              </div>

              {/* Countdown Progress Bar (Pauses when hovered or acknowledged) */}
              {!toast.acknowledged && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
                  <div
                    className={`h-full transition-all duration-100 ease-linear ${
                      isCritical
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{
                      animation: isHovered
                        ? 'none'
                        : `toast-progress ${toast.autoDismissMs}ms linear forwards`,
                      width: isHovered ? '100%' : undefined
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* Shift Population Health Anomaly Incident History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <History className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Shift Population Health Anomaly Alerts Log</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {historyLog.length} recorded
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-risk population strain events detected by the Prognosticator Telemetry Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {historyLog.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No high-risk population health anomalies recorded during this monitoring session.
                </div>
              ) : (
                historyLog.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.department}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                            item.riskTier === 'HIGH_RISK'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.riskTier || 'CRITICAL_RISK'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {item.anomalyMetric} • <span className="font-mono text-slate-400">{item.measuredValue}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.zoneName} • {item.timeFormatted} • Confidence: {item.confidenceLevelFormatted} • MSE: {item.reconstructionMse.toFixed(3)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {onInspectInChart && (
                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            onInspectInChart(item.zoneId);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                Showing last {historyLog.length} events (k-Anonymity Verified)
              </span>
              <button
                onClick={() => setHistoryLog([])}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

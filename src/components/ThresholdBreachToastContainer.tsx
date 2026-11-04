import React, { useState, useEffect } from 'react';
import { ThresholdBreachToast } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Heart,
  Sun,
  Thermometer,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  ExternalLink,
  Radio,
  Clock,
  History,
  TrendingUp,
  Activity,
  ChevronRight
} from 'lucide-react';
import { voiceAlertService } from '../services/voiceAlertService';

interface ThresholdBreachToastContainerProps {
  toasts: ThresholdBreachToast[];
  onDismissToast: (id: string) => void;
  onAcknowledgeToast: (id: string) => void;
  onClearAllToasts: () => void;
  onInspectSignalInChart?: (signalKey: string) => void;
  onDispatchActionForToast?: (toast: ThresholdBreachToast) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function ThresholdBreachToastContainer({
  toasts,
  onDismissToast,
  onAcknowledgeToast,
  onClearAllToasts,
  onInspectSignalInChart,
  onDispatchActionForToast,
  soundEnabled = true,
  onToggleSound
}: ThresholdBreachToastContainerProps) {
  const [hoveredToastId, setHoveredToastId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [allTimeHistory, setAllTimeHistory] = useState<ThresholdBreachToast[]>([]);

  // Accumulate past toasts in shift history
  useEffect(() => {
    if (toasts.length > 0) {
      setAllTimeHistory((prev) => {
        const newItems = toasts.filter((t) => !prev.some((p) => p.id === t.id));
        if (newItems.length === 0) return prev;
        return [...newItems, ...prev].slice(0, 50); // keep last 50
      });
    }
  }, [toasts]);

  const renderSignalIcon = (signalKey: ThresholdBreachToast['signalKey']) => {
    switch (signalKey) {
      case 'heartRate':
        return <Heart className="h-4 w-4 text-rose-400 animate-pulse" />;
      case 'ambientTemp':
        return <Sun className="h-4 w-4 text-amber-400" />;
      case 'hrv':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'skinTemp':
        return <Thermometer className="h-4 w-4 text-rose-400" />;
      case 'noise':
        return <Volume2 className="h-4 w-4 text-orange-400" />;
      case 'riskScore':
        return <ShieldAlert className="h-4 w-4 text-purple-400" />;
      case 'twl':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
  };

  const getSeverityBadgeClass = (severity: ThresholdBreachToast['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/40';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-yellow-950/40';
    }
  };

  const getBorderSeverityClass = (severity: ThresholdBreachToast['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-rose-500/70 shadow-lg shadow-rose-950/40 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900';
      case 'HIGH':
        return 'border-amber-500/70 shadow-lg shadow-amber-950/30 bg-gradient-to-br from-slate-900 via-amber-950/15 to-slate-900';
      default:
        return 'border-yellow-500/60 shadow-lg shadow-yellow-950/20 bg-gradient-to-br from-slate-900 via-yellow-950/10 to-slate-900';
    }
  };

  if (toasts.length === 0 && !showHistoryModal) {
    return null;
  }

  // Display at most 4 toasts at once to prevent viewport overcrowding
  const visibleToasts = toasts.slice(0, 4);
  const hiddenCount = toasts.length - visibleToasts.length;

  return (
    <>
      {/* Floating Bottom-Right Toast Stack */}
      <aside aria-label="Real-Time Threshold Breach Notifications" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none select-none">
        {/* Floating Stack Header Bar (when active toasts exist) */}
        {toasts.length > 0 && (
          <div className="pointer-events-auto flex items-center justify-between bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-bold tracking-wider font-mono text-[11px] text-white">
                LIVE BREACH TOASTS ({toasts.length})
              </span>
              {hiddenCount > 0 && (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  +{hiddenCount} queued
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
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
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="View shift breach toast history"
              >
                <History className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={onClearAllToasts}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition font-mono"
                title="Dismiss all active toasts"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Stack of Active Toasts */}
        <div className="flex flex-col gap-2.5">
          {visibleToasts.map((toast) => {
            const isHovered = hoveredToastId === toast.id;

            return (
              <div
                key={toast.id}
                onMouseEnter={() => setHoveredToastId(toast.id)}
                onMouseLeave={() => setHoveredToastId(null)}
                className={`pointer-events-auto rounded-xl border backdrop-blur-md p-3.5 shadow-2xl transition-all duration-300 transform translate-y-0 relative overflow-hidden ${getBorderSeverityClass(
                  toast.severity
                )}`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 shrink-0">
                      {renderSignalIcon(toast.signalKey)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white tracking-tight">
                          {toast.signalName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold border uppercase tracking-wider ${getSeverityBadgeClass(
                            toast.severity
                          )}`}
                        >
                          {toast.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {toast.zoneName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {toast.timeFormatted}
                    </span>
                    <button
                      onClick={() => onDismissToast(toast.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                      title="Dismiss notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metric Exceedance Comparison Row */}
                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 mb-2 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      MEASURED SENSOR VALUE
                    </span>
                    <span className="text-base font-extrabold text-white">
                      {toast.measuredFormatted}
                    </span>
                  </div>

                  <div className="text-center px-2">
                    <span className="text-rose-400 font-bold block text-sm">&gt;</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      CONFIGURED LIMIT
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {toast.thresholdFormatted}
                    </span>
                  </div>

                  <div className="pl-2 border-l border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      BREACH DELTA
                    </span>
                    <span className="text-xs font-bold text-rose-400">
                      {toast.deltaFormatted}
                    </span>
                  </div>
                </div>

                {/* Directive Snippet */}
                <p className="text-[11px] text-slate-300 leading-snug mb-2.5 line-clamp-2">
                  <span className="text-amber-400 font-semibold font-mono">Action: </span>
                  {toast.recommendedAction}
                </p>

                {/* Interactive Toast Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Acknowledge Button */}
                    <button
                      onClick={() => onAcknowledgeToast(toast.id)}
                      disabled={toast.acknowledged}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                        toast.acknowledged
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                      }`}
                      title="Acknowledge reading breach"
                    >
                      <CheckCircle2 className={`h-3 w-3 ${toast.acknowledged ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{toast.acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                    </button>

                    {/* Stage Medical / Team Dispatch */}
                    {onDispatchActionForToast && (
                      <button
                        onClick={() => onDispatchActionForToast(toast)}
                        className="flex items-center space-x-1 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-md text-[11px] font-semibold transition shadow-xs"
                        title="Transmit automated medical or hazard dispatch"
                      >
                        <Radio className="h-3 w-3 text-rose-400" />
                        <span>Dispatch Team</span>
                      </button>
                    )}
                  </div>

                  {/* Inspect in 24h Recharts Chart */}
                  {onInspectSignalInChart && (
                    <button
                      onClick={() => onInspectSignalInChart(toast.signalKey)}
                      className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition hover:underline"
                      title="Jump to 24h Recharts chart with this signal isolated or overlaid"
                    >
                      <span>Inspect in Chart</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Auto-Dismiss Countdown Bar */}
                {!toast.acknowledged && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
                    <div
                      className={`h-full ${
                        toast.severity === 'CRITICAL'
                          ? 'bg-rose-500'
                          : toast.severity === 'HIGH'
                          ? 'bg-amber-500'
                          : 'bg-yellow-500'
                      } ${isHovered ? 'animate-none opacity-50' : ''}`}
                      style={{
                        animation: isHovered
                          ? 'none'
                          : `toast-progress ${toast.autoDismissMs / 1000}s linear forwards`
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Shift Breach Toast History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <History className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Shift Sensor Threshold Breach Notifications Log
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audited list of real-time threshold breaches caught by the safety monitoring engine ({allTimeHistory.length} total events)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {allTimeHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No sensor threshold breaches recorded during this monitoring session.
                </div>
              ) : (
                allTimeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {renderSignalIcon(item.signalKey)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.signalName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${getSeverityBadgeClass(
                              item.severity
                            )}`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.zoneName} • {item.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right font-mono">
                      <div>
                        <span className="text-rose-400 font-bold block">
                          {item.measuredFormatted}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Limit: {item.thresholdFormatted}
                        </span>
                      </div>
                      {onInspectSignalInChart && (
                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            onInspectSignalInChart(item.signalKey);
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-300 transition text-[11px]"
                          title="Inspect in 24h chart"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                Showing last {allTimeHistory.length} incident records in RAM
              </span>
              <button
                onClick={() => setAllTimeHistory([])}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition"
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

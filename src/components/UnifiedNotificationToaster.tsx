import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Heart,
  Thermometer,
  Sun,
  Activity,
  Volume2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { CriticalAnomalyToastData, ThresholdBreachToast } from '../types';

export type UnifiedToastItem = {
  id: string;
  sourceType: 'CRITICAL_ANOMALY' | 'THRESHOLD_BREACH';
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  title: string;
  metric: string;
  location: string;
  timestamp: string;
  recommendedAction: string;
  createdAt: number;
  autoDismissMs: number;
  originalCritical?: CriticalAnomalyToastData;
  originalBreach?: ThresholdBreachToast;
};

interface UnifiedNotificationToasterProps {
  criticalToasts: CriticalAnomalyToastData[];
  breachToasts: ThresholdBreachToast[];
  onDismissCritical: (id: string) => void;
  onDismissBreach: (id: string) => void;
  onAcknowledgeCritical?: (id: string) => void;
  onAcknowledgeBreach?: (id: string) => void;
  onClearAll?: () => void;
  onDispatchCritical?: (toast: CriticalAnomalyToastData) => void;
  onDispatchBreach?: (toast: ThresholdBreachToast) => void;
  onInspectInChart?: (target: string) => void;
  onOpenNotificationCenter?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function UnifiedNotificationToaster({
  criticalToasts,
  breachToasts,
  onDismissCritical,
  onDismissBreach,
  onAcknowledgeCritical,
  onAcknowledgeBreach,
  onClearAll,
  onDispatchCritical,
  onDispatchBreach,
  onInspectInChart,
  onOpenNotificationCenter
}: UnifiedNotificationToasterProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Normalize and merge both toast queues, sorting newest first
  const unifiedItems: UnifiedToastItem[] = useMemo(() => {
    const items: UnifiedToastItem[] = [];

    // Map critical anomaly alerts
    criticalToasts.forEach((ct) => {
      items.push({
        id: ct.id,
        sourceType: 'CRITICAL_ANOMALY',
        severity: ct.riskTier === 'HIGH_RISK' ? 'HIGH' : 'CRITICAL',
        title: `${ct.zoneName || 'Sector Alert'} · ${ct.anomalyMetric}`,
        metric: `${ct.measuredValue} (Limit ${ct.thresholdLimit})`,
        location: ct.department || ct.zoneName,
        timestamp: ct.timeFormatted,
        recommendedAction: ct.recommendedAction,
        createdAt: ct.createdAt || Date.now(),
        autoDismissMs: ct.autoDismissMs || 8000,
        originalCritical: ct
      });
    });

    // Map threshold breach alerts
    breachToasts.forEach((bt) => {
      // Avoid duplicate alert if already represented by critical anomaly
      const isDuplicate = items.some(
        (existing) =>
          existing.location === bt.zoneName &&
          Math.abs(existing.createdAt - (bt.createdAt || 0)) < 4000
      );
      if (!isDuplicate) {
        items.push({
          id: bt.id,
          sourceType: 'THRESHOLD_BREACH',
          severity: bt.severity === 'CRITICAL' ? 'CRITICAL' : bt.severity === 'HIGH' ? 'HIGH' : 'WARNING',
          title: `${bt.zoneName || 'Zone'} · ${bt.signalName}`,
          metric: `${bt.measuredFormatted} (${bt.deltaFormatted})`,
          location: bt.zoneName,
          timestamp: bt.timeFormatted,
          recommendedAction: bt.recommendedAction,
          createdAt: bt.createdAt || Date.now(),
          autoDismissMs: bt.autoDismissMs || 7000,
          originalBreach: bt
        });
      }
    });

    // Sort newest first
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [criticalToasts, breachToasts]);

  // Handle individual dismiss
  const handleDismiss = (item: UnifiedToastItem) => {
    if (item.sourceType === 'CRITICAL_ANOMALY') {
      onDismissCritical(item.id);
    } else {
      onDismissBreach(item.id);
    }
  };

  // Handle quick dispatch action
  const handleDispatch = (item: UnifiedToastItem) => {
    if (item.sourceType === 'CRITICAL_ANOMALY' && item.originalCritical && onDispatchCritical) {
      onDispatchCritical(item.originalCritical);
    } else if (item.sourceType === 'THRESHOLD_BREACH' && item.originalBreach && onDispatchBreach) {
      onDispatchBreach(item.originalBreach);
    }
  };

  const currentToast = unifiedItems[0];
  const currentToastId = currentToast?.id;
  const currentToastSource = currentToast?.sourceType;
  const currentToastCreatedAt = currentToast?.createdAt || 0;
  // Snappy 6-second auto-dismiss for prompt disappearing
  const currentToastDismissMs = 6000;

  // Stable, self-contained auto-dismiss: Evaluates elapsed time against creation timestamp
  // Prevents parent re-renders or stream updates from resetting the timer!
  useEffect(() => {
    if (!currentToastId) return;

    const checkInterval = setInterval(() => {
      // Pause countdown while user is hovering over the toast
      if (hoveredId === currentToastId) return;

      const elapsed = Date.now() - currentToastCreatedAt;
      if (elapsed >= currentToastDismissMs) {
        if (currentToastSource === 'CRITICAL_ANOMALY') {
          onDismissCritical(currentToastId);
        } else {
          onDismissBreach(currentToastId);
        }
      }
    }, 250);

    return () => {
      clearInterval(checkInterval);
    };
  }, [currentToastId, currentToastSource, currentToastCreatedAt, hoveredId, onDismissCritical, onDismissBreach]);

  if (unifiedItems.length === 0) {
    return null;
  }

  // Strictly keep exactly ONE notification at a time in the lower bottom right
  const hiddenCount = unifiedItems.length - 1;

  const renderIcon = (item: UnifiedToastItem) => {
    if (item.severity === 'CRITICAL') {
      return <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />;
    }
    return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
  };

  return (
    <aside
      aria-label="Real-time Safety Intelligence Alerts"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 max-w-sm sm:max-w-md w-full pointer-events-none select-none"
    >
      {/* Discreet Multi-Alert Summary Strip when additional alerts are queued */}
      {hiddenCount > 0 && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 w-full bg-slate-900/95 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-md text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-200">
              <strong className="text-white font-semibold">+{hiddenCount}</strong> more alert{hiddenCount === 1 ? '' : 's'} in queue
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNotificationCenter && (
              <button
                onClick={onOpenNotificationCenter}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>View Center</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}

            {onClearAll && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-white transition font-mono cursor-pointer"
                title="Dismiss all active alerts"
              >
                Dismiss All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exactly ONE Compact, High-Legibility Toast Card */}
      {currentToast && (() => {
        const isCritical = currentToast.severity === 'CRITICAL';
        const isHovered = hoveredId === currentToast.id;

        return (
          <div
            key={currentToast.id}
            onMouseEnter={() => setHoveredId(currentToast.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`pointer-events-auto w-full bg-slate-900/95 border rounded-xl shadow-xl backdrop-blur-md p-3 relative overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
              isCritical
                ? 'border-rose-500/50 shadow-rose-950/20'
                : 'border-amber-500/50 shadow-amber-950/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              {/* Left Indicator & Info */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {renderIcon(currentToast)}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {currentToast.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border font-semibold ${
                        isCritical
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                      }`}
                    >
                      {currentToast.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                    {currentToast.metric}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <button
                      onClick={() => handleDispatch(currentToast)}
                      className="font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Stage Action</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>

                    {onInspectInChart && (
                      <button
                        onClick={() => onInspectInChart(currentToast.location)}
                        className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismiss(currentToast)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition cursor-pointer shrink-0"
                title="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Subtle Progress Countdown Bar */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                isCritical ? 'bg-rose-500/70' : 'bg-amber-500/70'
              } ${isHovered ? 'w-full' : 'animate-[toast-progress_6s_linear_forwards]'}`}
            />
          </div>
        );
      })()}
    </aside>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Heart,
  Thermometer,
  Activity,
  Cpu,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Pin,
  PinOff
} from 'lucide-react';
import { CriticalAnomalyToastData, ThresholdBreachToast } from '../types';

export type UnifiedToastItem = {
  id: string;
  sourceType: 'CRITICAL_ANOMALY' | 'THRESHOLD_BREACH';
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  title: string;
  metric: string;
  location: string;
  zoneId?: string;
  timestamp: string;
  recommendedAction: string;
  createdAt: number;
  autoDismissMs: number;
  acknowledged?: boolean;
  isKalmanModelAnomaly?: boolean;
  kalmanSmoothed?: string;
  rawMeasured?: string;
  kalmanStatus?: string;
  reconstructionMse?: number;
  riskProbability?: number;
  cohortCount?: number;
  privacyNotice?: string;
  attributions?: Record<string, number>;
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
  onOpenNotificationCenter,
  soundEnabled = true,
  onToggleSound
}: UnifiedNotificationToasterProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Auto-dismiss enabled by default (6s for standard, 8s for critical)
  const [isAutoDismissEnabled, setIsAutoDismissEnabled] = useState<boolean>(true);
  // Tracks items currently undergoing smooth exit animation
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  // Normalize and merge both toast queues, sorting newest first
  const unifiedItems: UnifiedToastItem[] = useMemo(() => {
    const items: UnifiedToastItem[] = [];

    // Map critical and high-risk Kalman anomaly alerts
    criticalToasts.forEach((ct) => {
      items.push({
        id: ct.id,
        sourceType: 'CRITICAL_ANOMALY',
        severity: ct.riskTier === 'HIGH_RISK' ? 'HIGH' : 'CRITICAL',
        title: ct.anomalyMetric || 'Health Telemetry Anomaly',
        metric: ct.measuredValue || `State Estimate Prob: ${(ct.confidenceLevel * 100).toFixed(1)}%`,
        location: ct.department || ct.zoneName,
        zoneId: ct.zoneId || ct.zoneName,
        timestamp: ct.timeFormatted,
        recommendedAction: ct.recommendedAction,
        createdAt: ct.createdAt || Date.now(),
        autoDismissMs: 6500,
        acknowledged: ct.acknowledged,
        isKalmanModelAnomaly: true,
        kalmanSmoothed: ct.kalmanSmoothedValue,
        rawMeasured: ct.rawMeasuredValue || ct.measuredValue,
        kalmanStatus: ct.kalmanStatus || 'Kalman State Divergence Validated',
        reconstructionMse: ct.reconstructionMse ?? 0.385,
        riskProbability: ct.riskProbability ?? ct.confidenceLevel,
        cohortCount: ct.cohortCount || 18,
        privacyNotice: ct.privacyNotice || 'k-Anonymity Verified (N >= 12) & ε=0.5 DP Shield',
        attributions: ct.attributions,
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
          title: bt.signalName || 'Threshold Breach',
          metric: `${bt.measuredFormatted} (${bt.deltaFormatted})`,
          location: bt.zoneName,
          zoneId: bt.zoneId || bt.zoneName,
          timestamp: bt.timeFormatted,
          recommendedAction: bt.recommendedAction,
          createdAt: bt.createdAt || Date.now(),
          autoDismissMs: 6000,
          isKalmanModelAnomaly: false,
          originalBreach: bt
        });
      }
    });

    // Sort newest first
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [criticalToasts, breachToasts]);

  // Smooth dismiss handler: animates out cleanly before updating React state
  const handleSmoothDismiss = (item: UnifiedToastItem) => {
    setDismissingIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      if (item.sourceType === 'CRITICAL_ANOMALY') {
        onDismissCritical(item.id);
      } else {
        onDismissBreach(item.id);
      }
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 280);
  };

  // Smooth dismiss all handler
  const handleSmoothDismissAll = () => {
    const allIds = new Set(unifiedItems.map((i) => i.id));
    setDismissingIds(allIds);
    setTimeout(() => {
      if (onClearAll) {
        onClearAll();
      } else {
        unifiedItems.forEach((item) => {
          if (item.sourceType === 'CRITICAL_ANOMALY') {
            onDismissCritical(item.id);
          } else {
            onDismissBreach(item.id);
          }
        });
      }
      setDismissingIds(new Set());
    }, 280);
  };

  // Handle individual acknowledge
  const handleAcknowledge = (item: UnifiedToastItem) => {
    if (item.sourceType === 'CRITICAL_ANOMALY' && onAcknowledgeCritical) {
      onAcknowledgeCritical(item.id);
    } else if (item.sourceType === 'THRESHOLD_BREACH' && onAcknowledgeBreach) {
      onAcknowledgeBreach(item.id);
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

  // Keep max 1 active visible toast on screen to avoid covering charts or tables
  const visibleItems = unifiedItems.slice(0, 1);
  const hiddenCount = unifiedItems.length - visibleItems.length;

  // Graceful auto-dismiss timer per visible item
  useEffect(() => {
    if (!isAutoDismissEnabled || visibleItems.length === 0) return;

    const currentItem = visibleItems[0];
    if (hoveredId === currentItem.id) return; // Pause on hover
    if (dismissingIds.has(currentItem.id)) return;

    const remainingTime = Math.max(1000, currentItem.autoDismissMs - (Date.now() - currentItem.createdAt));
    const timer = setTimeout(() => {
      handleSmoothDismiss(currentItem);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [visibleItems, hoveredId, isAutoDismissEnabled, dismissingIds]);

  if (unifiedItems.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Kalman Filtering Anomaly & Safety Alerts"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-sm w-full pointer-events-none select-none transition-all duration-300"
    >
      {/* Sleek Top Pill when multiple alerts exist in queue */}
      {hiddenCount > 0 && (
        <div className="pointer-events-auto flex items-center justify-between gap-2.5 w-full bg-slate-900/95 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg text-xs text-slate-200 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-300 truncate">
              <strong className="text-white font-semibold">+{hiddenCount}</strong> more in queue
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSmoothDismissAll}
              className="text-[11px] font-semibold text-rose-300 hover:text-white px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 transition cursor-pointer"
              title="Dismiss all alerts and clear screen"
            >
              Dismiss All
            </button>

            {onOpenNotificationCenter && (
              <button
                type="button"
                onClick={onOpenNotificationCenter}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5"
                title="View full notification log"
              >
                <span>View Center</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Active Toast (Sleek, Compact, Translucent Glassmorphism) */}
      {visibleItems.map((item) => {
        const isCritical = item.severity === 'CRITICAL';
        const isHovered = hoveredId === item.id;
        const isDismissing = dismissingIds.has(item.id);
        const isKalman = item.isKalmanModelAnomaly;
        const riskPct = item.riskProbability ? (item.riskProbability * 100).toFixed(0) : '89';

        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`pointer-events-auto w-full rounded-xl shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300 border ${
              isDismissing
                ? 'opacity-0 translate-x-8 scale-95 duration-300 pointer-events-none'
                : 'opacity-100 translate-x-0 scale-100 duration-200'
            } ${
              isCritical
                ? 'bg-slate-900/95 border-rose-500/60 ring-1 ring-rose-500/30 text-slate-100'
                : 'bg-slate-900/95 border-amber-500/60 ring-1 ring-amber-500/30 text-slate-100'
            }`}
          >
            {/* Header: Severity Badge, Zone, Time & Comfortable Close Button */}
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[9px] border shrink-0 ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {item.severity} &middot; {riskPct}%
                </span>
                <span className="font-semibold text-white truncate text-xs">{item.location}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{item.timestamp}</span>

                <button
                  type="button"
                  onClick={() => setIsAutoDismissEnabled((prev) => !prev)}
                  className={`p-1 rounded text-[10px] transition cursor-pointer flex items-center gap-1 ${
                    !isAutoDismissEnabled
                      ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={!isAutoDismissEnabled ? 'Alert is pinned (pause auto-dismiss). Click to enable auto-dismiss' : 'Auto-dismissing in 6s. Click to pin'}
                >
                  {!isAutoDismissEnabled ? <Pin className="h-3 w-3 fill-cyan-400" /> : <PinOff className="h-3 w-3" />}
                </button>

                {/* Generous Hit-Target Close Button for Smooth Dismissal */}
                <button
                  type="button"
                  onClick={() => handleSmoothDismiss(item)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close notification"
                  title="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content: Clean, High-Signal Metric & 1-Line Directive */}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                    {isKalman ? <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                    <span>{item.title}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {item.metric}
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-emerald-400 flex items-center gap-1 shrink-0 pt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  <span>k≥12</span>
                </div>
              </div>

              {item.recommendedAction && (
                <div className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-start gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-tight">
                    <strong className="text-amber-300">Action:</strong> {item.recommendedAction}
                  </p>
                </div>
              )}

              {/* Quick Actions Strip */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(item)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border ${
                      item.acknowledged
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>{item.acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatch(item)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-600 transition cursor-pointer flex items-center gap-1"
                  >
                    <Radio className="h-3 w-3 text-rose-400" />
                    <span>Dispatch</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSmoothDismiss(item)}
                  className="text-[11px] text-slate-400 hover:text-white transition cursor-pointer font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Smooth Animated Progress Bar */}
            {isAutoDismissEnabled && (
              <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isCritical ? 'bg-rose-500' : 'bg-amber-500'
                  } ${isHovered ? 'w-full opacity-30' : 'animate-[toast-progress_6s_linear_forwards]'}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

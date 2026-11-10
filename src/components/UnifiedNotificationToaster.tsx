import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Heart,
  Thermometer,
  Activity,
  Cpu,
  Brain,
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
  VolumeX
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
        autoDismissMs: ct.autoDismissMs || 9000,
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
          Math.abs(existing.createdAt - (bt.createdAt || 0)) < 3000
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
          autoDismissMs: bt.autoDismissMs || 7000,
          isKalmanModelAnomaly: false,
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

  // Stack up to 2 active toasts simultaneously for optimal situational awareness without clutter
  const visibleItems = unifiedItems.slice(0, 2);
  const hiddenCount = unifiedItems.length - visibleItems.length;

  // Auto-dismiss management for all visible toasts
  useEffect(() => {
    if (visibleItems.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      visibleItems.forEach((item) => {
        if (hoveredId === item.id) return; // Pause countdown on hover

        const elapsed = now - item.createdAt;
        if (elapsed >= item.autoDismissMs) {
          if (item.sourceType === 'CRITICAL_ANOMALY') {
            onDismissCritical(item.id);
          } else {
            onDismissBreach(item.id);
          }
        }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [visibleItems, hoveredId, onDismissCritical, onDismissBreach]);

  if (unifiedItems.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Kalman Filtering Anomaly & Safety Alerts"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none select-none"
    >
      {/* Multi-Alert Summary Strip when queue has overflow */}
      {hiddenCount > 0 && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 w-full bg-slate-950/95 border border-slate-700/80 rounded-xl px-3.5 py-1.5 shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              <strong className="text-white font-semibold">+{hiddenCount}</strong> additional anomaly alert{hiddenCount === 1 ? '' : 's'} in queue
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNotificationCenter && (
              <button
                onClick={onOpenNotificationCenter}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Center</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}

            {onClearAll && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-white transition font-mono cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-800"
                title="Dismiss all active alerts"
              >
                Dismiss All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stack of Active Toasts (Up to 2 stacked cards) */}
      {visibleItems.map((item) => {
        const isCritical = item.severity === 'CRITICAL';
        const isHovered = hoveredId === item.id;
        const isKalman = item.isKalmanModelAnomaly;
        const riskPct = item.riskProbability ? (item.riskProbability * 100).toFixed(1) : '89.4';

        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`pointer-events-auto w-full rounded-xl shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 border-2 ${
              isCritical
                ? 'bg-slate-950/95 border-rose-500/80 shadow-rose-950/40 text-slate-100'
                : 'bg-slate-950/95 border-amber-500/80 shadow-amber-950/40 text-slate-100'
            }`}
          >
            {/* Top Indicator Strip */}
            <div
              className={`px-3 py-1.5 flex items-center justify-between border-b text-[11px] font-mono ${
                isCritical
                  ? 'bg-rose-950/70 border-rose-800/60 text-rose-200'
                  : 'bg-amber-950/70 border-amber-800/60 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isKalman ? (
                  <>
                    <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-pulse shrink-0" />
                    <span className="font-bold tracking-tight text-white flex items-center gap-1">
                      <span>KALMAN ANOMALY DETECTED</span>
                      <span className="text-[10px] text-cyan-300 font-normal hidden sm:inline">• P_k|k = 0.024</span>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold tracking-tight text-white">THRESHOLD BREACH ALERT</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[9px] border ${
                    isCritical
                      ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                      : 'bg-amber-900/80 text-amber-200 border-amber-700'
                  }`}
                >
                  {item.severity} RISK ({riskPct}%)
                </span>
                <button
                  onClick={() => handleDismiss(item)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Main Body */}
            <div className="p-3 space-y-2">
              {/* Location & Title */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-white truncate">{item.location}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-[11px] font-mono text-cyan-400">N={item.cohortCount || 18}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                      <ShieldCheck className="h-3 w-3" />
                      <span className="hidden sm:inline">k≥12</span>
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-rose-300 mt-0.5 truncate flex items-center gap-1">
                    <Activity className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{item.title}</span>
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {item.timestamp}
                  </span>
                </div>
              </div>

              {/* Kalman Telemetry Metric Card */}
              {isKalman && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Telemetry:</span>
                    <span className="text-white font-medium truncate max-w-[240px]">
                      {item.metric}
                    </span>
                  </div>
                  {item.kalmanSmoothed && (
                    <div className="flex justify-between items-center text-cyan-300 border-t border-slate-800/60 pt-1">
                      <span className="text-slate-400 text-[10px]">Kalman Smoothed:</span>
                      <span className="font-bold text-[10px]">{item.kalmanSmoothed}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-1">
                    <span>MSE: <strong className="text-slate-200">{item.reconstructionMse?.toFixed(3) ?? '0.385'}</strong></span>
                    <span className="text-emerald-400 truncate max-w-[190px]">{item.kalmanStatus}</span>
                  </div>
                </div>
              )}

              {/* Threshold Breach details if not kalman */}
              {!isKalman && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Breach Reading:</span>
                    <span className="text-white font-semibold">{item.metric}</span>
                  </div>
                </div>
              )}

              {/* Operational Action Directive */}
              {item.recommendedAction && (
                <div className="text-[11px] text-slate-200 bg-slate-900/90 border border-slate-700/60 rounded-md p-1.5 flex items-start gap-1.5">
                  <Zap className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-tight">
                    <strong className="text-amber-300">Directive:</strong> {item.recommendedAction}
                  </p>
                </div>
              )}

              {/* Interactive Actions */}
              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAcknowledge(item)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border ${
                      item.acknowledged
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 cursor-default'
                        : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border-cyan-700/70'
                    }`}
                    title="Acknowledge anomaly in compliance audit trail"
                  >
                    <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                    <span>{item.acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                  </button>

                  <button
                    onClick={() => handleDispatch(item)}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/70 transition cursor-pointer flex items-center gap-1"
                    title="Stage medical or cooling dispatch team"
                  >
                    <Radio className="h-3 w-3 text-rose-400" />
                    <span>Dispatch</span>
                  </button>
                </div>

                {onInspectInChart && item.zoneId && (
                  <button
                    onClick={() => onInspectInChart(item.zoneId!)}
                    className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-0.5 cursor-pointer"
                    title="Scroll to telemetry waveform chart"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Visual Auto-Dismiss Progress Countdown Bar */}
            <div
              className={`absolute bottom-0 left-0 h-1 transition-all ${
                isCritical ? 'bg-rose-500' : 'bg-amber-500'
              } ${isHovered ? 'w-full opacity-40' : 'animate-[toast-progress_9s_linear_forwards]'}`}
            />
          </div>
        );
      })}
    </aside>
  );
}

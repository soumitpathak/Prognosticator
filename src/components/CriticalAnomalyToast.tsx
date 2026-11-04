import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
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
  ExternalLink,
  Target
} from 'lucide-react';
import { CriticalAnomalyToastData } from '../types';
import { voiceAlertService } from '../services/voiceAlertService';

interface CriticalAnomalyToastProps {
  toasts: CriticalAnomalyToastData[];
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onDispatchAction?: (toast: CriticalAnomalyToastData) => void;
  onInspectInChart?: (zoneId: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function CriticalAnomalyToast({
  toasts,
  onDismiss,
  onAcknowledge,
  onDispatchAction,
  onInspectInChart,
  soundEnabled = true,
  onToggleSound
}: CriticalAnomalyToastProps) {
  const [hoveredToastId, setHoveredToastId] = useState<string | null>(null);

  // Play audio chime when a new toast arrives
  useEffect(() => {
    if (toasts.length > 0 && soundEnabled) {
      voiceAlertService.playAlertChime();
    }
  }, [toasts.length, soundEnabled]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isHovered = hoveredToastId === toast.id;

        return (
          <div
            key={toast.id}
            onMouseEnter={() => setHoveredToastId(toast.id)}
            onMouseLeave={() => setHoveredToastId(null)}
            className="pointer-events-auto bg-slate-950/95 border-2 border-rose-500 rounded-2xl shadow-2xl shadow-rose-950/60 p-4 backdrop-blur-md relative overflow-hidden transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4"
          >
            {/* Top Critical Header Banner */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-900/60">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-rose-400 font-mono flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                  CRITICAL ANOMALY DETECTED
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {toast.timeFormatted}
                </span>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Department & Confidence Level Row (Mandatory Key Display) */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              {/* Department */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-cyan-400" /> Department / Facility
                </span>
                <div className="font-bold text-white text-xs mt-0.5 truncate" title={toast.department}>
                  {toast.department}
                </div>
                <span className="text-[10px] text-slate-500 font-mono truncate block">
                  {toast.zoneName}
                </span>
              </div>

              {/* Confidence Level */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center justify-end gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-400" /> Model Confidence
                </span>
                <div className="font-mono font-black text-sm text-emerald-400 mt-0.5">
                  {toast.confidenceLevelFormatted}
                </div>
                <span className="text-[10px] text-rose-400 font-mono">
                  MSE: {toast.reconstructionMse.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Anomaly Details */}
            <div className="space-y-1.5 text-xs text-slate-200 mb-3">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Metric Trigger:</span>
                <span className="font-semibold text-rose-300 text-right">{toast.anomalyMetric}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Measured vs Limit:</span>
                <span>
                  <strong className="text-rose-400">{toast.measuredValue}</strong> (Limit: {toast.thresholdLimit})
                </span>
              </div>
              <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-900/40 text-[11px] text-rose-200">
                <strong className="text-rose-400 uppercase text-[10px] block font-bold mb-0.5">Directive Action:</strong>
                {toast.recommendedAction}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
              {onDispatchAction && (
                <button
                  onClick={() => onDispatchAction(toast)}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-1.5 px-2.5 rounded-lg transition shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  <span>Stage Medical Dispatch</span>
                </button>
              )}

              {onInspectInChart && (
                <button
                  onClick={() => onInspectInChart(toast.zoneId)}
                  className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  title="Inspect anomaly in 30-Day Trend Chart"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Chart</span>
                </button>
              )}

              <button
                onClick={() => onAcknowledge(toast.id)}
                className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                title="Acknowledge alert"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ack</span>
              </button>
            </div>

            {/* Compliance Footer Tag */}
            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                {toast.privacyNotice}
              </span>
              <span>Pseudonym: {toast.workerPseudonym}</span>
            </div>

            {/* Countdown Progress Bar */}
            {!isHovered && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-100 ease-linear"
                style={{
                  animation: `toast-progress ${toast.autoDismissMs}ms linear forwards`
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

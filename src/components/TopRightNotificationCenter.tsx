import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ActiveAnomalyAlert } from '../types';
import {
  Bell,
  BellRing,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  CheckCheck,
  Zap,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface TopRightNotificationCenterProps {
  alerts: ActiveAnomalyAlert[];
  onViewDetails?: (alert: ActiveAnomalyAlert) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onAcknowledgeAll?: (alertIds: string[]) => void;
  onSimulateHighRiskAlert?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

export default function TopRightNotificationCenter({
  alerts,
  onViewDetails,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onSimulateHighRiskAlert,
  soundEnabled = true,
  onToggleSound,
  className = ''
}: TopRightNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter only high-risk anomalies (CRITICAL and HIGH tiers)
  const highRiskAlerts = useMemo(() => {
    return alerts.filter(
      (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    );
  }, [alerts]);

  // Unacknowledged high-risk count
  const unacknowledgedCount = useMemo(() => {
    return highRiskAlerts.filter((a) => !a.acknowledged).length;
  }, [highRiskAlerts]);

  const criticalCount = useMemo(() => {
    return highRiskAlerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
  }, [highRiskAlerts]);

  // Filtered by dropdown pill selection
  const displayedAlerts = useMemo(() => {
    if (filterSeverity === 'ALL') return highRiskAlerts;
    return highRiskAlerts.filter((a) => a.severity === filterSeverity);
  }, [highRiskAlerts, filterSeverity]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAcknowledgeAll = () => {
    if (onAcknowledgeAll) {
      const ids = highRiskAlerts.filter((a) => !a.acknowledged).map((a) => a.id);
      onAcknowledgeAll(ids);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Top-Right Notification Center Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer select-none ${
          unacknowledgedCount > 0
            ? criticalCount > 0
              ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500/70 text-rose-200 shadow-md shadow-rose-950/60 ring-1 ring-rose-500/40'
              : 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/70 text-amber-200 shadow-md shadow-amber-950/50'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
        }`}
        title={`Notification Center: ${unacknowledgedCount} high-risk anomaly alerts triggered`}
        aria-label="Notification Center"
        aria-expanded={isOpen}
      >
        {unacknowledgedCount > 0 ? (
          <BellRing className="h-4 w-4 text-rose-400 animate-bounce" />
        ) : (
          <Bell className="h-4 w-4 text-slate-400" />
        )}
        <span className="hidden sm:inline">Notifications</span>

        {/* Count Badge */}
        {unacknowledgedCount > 0 ? (
          <span className="flex items-center">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="bg-rose-600 text-white font-mono font-bold px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
              {unacknowledgedCount}
            </span>
          </span>
        ) : (
          <span className="text-slate-500 text-[10px] font-mono">0</span>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden font-sans backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  High-Risk Anomaly Alerts
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {unacknowledgedCount} unacknowledged breach{unacknowledgedCount === 1 ? '' : 'es'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* Sound Toggle */}
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                    soundEnabled
                      ? 'text-cyan-400 hover:bg-slate-800'
                      : 'text-slate-500 hover:bg-slate-800'
                  }`}
                  title={soundEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition cursor-pointer"
                title="Close Notification Center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter & Action Bar */}
          <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFilterSeverity('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  filterSeverity === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({highRiskAlerts.length})
              </button>
              <button
                onClick={() => setFilterSeverity('CRITICAL')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  filterSeverity === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterSeverity('HIGH')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  filterSeverity === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                High
              </button>
            </div>

            {unacknowledgedCount > 0 && (
              <button
                onClick={handleAcknowledgeAll}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition cursor-pointer font-bold"
                title="Acknowledge all pending high-risk notifications"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Alert Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {displayedAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-300">All Clear</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No high-risk anomaly threshold breaches currently pending review.
                </p>
              </div>
            ) : (
              displayedAlerts.map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-850/70 ${
                      !alert.acknowledged
                        ? isCritical
                          ? 'bg-rose-950/20'
                          : 'bg-amber-950/15'
                        : 'opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase border ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-bold text-slate-200 truncate max-w-[170px]" title={alert.anomaly_metric}>
                          {alert.anomaly_metric}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{alert.detected_at}</span>
                      </span>
                    </div>

                    {/* Zone & Measured Readings */}
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1 truncate max-w-[190px]">
                        <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{alert.location_zone}</span>
                      </span>
                      <span className="text-slate-300 tabular-nums">
                        {alert.raw_value}
                      </span>
                    </div>

                    {/* Directive */}
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {alert.recommended_action}
                    </p>

                    {/* Actions Row */}
                    <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500">
                        {alert.acknowledged ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Acknowledged
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Requires Action
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!alert.acknowledged && onAcknowledgeAlert && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 transition cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}

                        {onViewDetails && (
                          <button
                            onClick={() => {
                              onViewDetails(alert);
                              setIsOpen(false);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold flex items-center space-x-0.5 transition cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action Strip */}
          <div className="bg-slate-950 p-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            {onSimulateHighRiskAlert && (
              <button
                onClick={onSimulateHighRiskAlert}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 transition cursor-pointer font-semibold"
                title="Inject a simulated high-risk anomaly event to test notification flow"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Simulate High-Risk Alert</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                const el = document.getElementById('notification-center-section') || document.getElementById('security-audit-log-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer ml-auto flex items-center space-x-1"
            >
              <span>View Full Queue &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

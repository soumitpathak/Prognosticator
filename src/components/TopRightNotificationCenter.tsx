import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ActiveAnomalyAlert, TelemetryRiskBreachEvent } from '../types';
import {
  Bell,
  BellRing,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  CheckCheck,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  Sliders,
  Radio,
  ExternalLink
} from 'lucide-react';
import { desktopNotificationService } from '../services/desktopNotificationService';

export interface TopRightNotificationCenterProps {
  alerts: ActiveAnomalyAlert[];
  onViewDetails?: (alert: ActiveAnomalyAlert) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onAcknowledgeAll?: (alertIds: string[]) => void;
  onSimulateHighRiskAlert?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  // Health Telemetry Risk Threshold props
  telemetryRiskThreshold?: number;
  onUpdateTelemetryRiskThreshold?: (val: number) => void;
  riskThresholdBreaches?: TelemetryRiskBreachEvent[];
  onAcknowledgeRiskBreach?: (id: string) => void;
  currentTelemetryRisk?: number;
  onTestBrowserAlert?: () => void;
  browserPermission?: 'granted' | 'denied' | 'default' | 'unsupported';
  onRequestBrowserPermission?: () => void;
  browserAlertsEnabled?: boolean;
  onToggleBrowserAlerts?: () => void;
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
  telemetryRiskThreshold = 75,
  onUpdateTelemetryRiskThreshold,
  riskThresholdBreaches = [],
  onAcknowledgeRiskBreach,
  currentTelemetryRisk = 84.8,
  onTestBrowserAlert,
  browserPermission: propPermission,
  onRequestBrowserPermission,
  browserAlertsEnabled = true,
  onToggleBrowserAlerts,
  className = ''
}: TopRightNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'RISK_BREACHES'>('ALERTS');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [testAlertNotice, setTestAlertNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check browser notification permission
  const [localPermission, setLocalPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() => {
    return desktopNotificationService.checkPermission();
  });
  const permission = propPermission || localPermission;

  // Filter only high-risk anomalies (CRITICAL and HIGH tiers)
  const highRiskAlerts = useMemo(() => {
    return alerts.filter(
      (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    );
  }, [alerts]);

  // Unacknowledged count (anomalies + breaches)
  const unacknowledgedAlertsCount = useMemo(() => {
    return highRiskAlerts.filter((a) => !a.acknowledged).length;
  }, [highRiskAlerts]);

  const unacknowledgedBreachesCount = useMemo(() => {
    return riskThresholdBreaches.filter((b) => !b.acknowledged).length;
  }, [riskThresholdBreaches]);

  const totalUnacknowledged = unacknowledgedAlertsCount + unacknowledgedBreachesCount;

  const isRiskCurrentlyBreached = currentTelemetryRisk >= telemetryRiskThreshold;

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
    if (activeTab === 'ALERTS' && onAcknowledgeAll) {
      const ids = highRiskAlerts.filter((a) => !a.acknowledged).map((a) => a.id);
      onAcknowledgeAll(ids);
    } else if (activeTab === 'RISK_BREACHES' && onAcknowledgeRiskBreach) {
      riskThresholdBreaches.forEach((b) => {
        if (!b.acknowledged) onAcknowledgeRiskBreach(b.id);
      });
    }
  };

  const handleRequestPermission = async () => {
    if (onRequestBrowserPermission) {
      onRequestBrowserPermission();
    } else {
      const res = await desktopNotificationService.requestPermission();
      setLocalPermission(res);
    }
  };

  const handleTriggerTestAlert = () => {
    if (onTestBrowserAlert) {
      onTestBrowserAlert();
    } else {
      desktopNotificationService.notifyRiskThresholdBreach(
        {
          id: `TEST-BREACH-${Date.now()}`,
          riskScore: currentTelemetryRisk || 85.0,
          threshold: telemetryRiskThreshold,
          delta: Number(((currentTelemetryRisk || 85.0) - telemetryRiskThreshold).toFixed(1)),
          zoneName: 'Outdoor Construction Sector 4',
          workerCount: 18,
          primarySignal: 'Acute Tachycardia & Core Thermal Plume',
          recommendedAction: 'Immediate shaded rest rotation and hydration triage.'
        },
        { forceTrigger: true }
      );
    }
    setTestAlertNotice('Browser notification dispatched! Check desktop.');
    setTimeout(() => setTestAlertNotice(null), 4000);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Top-Right Notification Center Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer select-none ${
          isRiskCurrentlyBreached
            ? 'bg-gradient-to-r from-rose-950/90 to-amber-950/90 hover:from-rose-900 hover:to-amber-900 border-rose-500/80 text-rose-100 shadow-md shadow-rose-950/60 ring-1 ring-rose-500/50'
            : totalUnacknowledged > 0
            ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500/70 text-rose-200 shadow-md shadow-rose-950/60 ring-1 ring-rose-500/40'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
        }`}
        title={`Notification Center: Threshold ${telemetryRiskThreshold}% (Current: ${currentTelemetryRisk.toFixed(1)}%) | ${totalUnacknowledged} unread`}
        aria-label="Notification Center"
        aria-expanded={isOpen}
      >
        {isRiskCurrentlyBreached || totalUnacknowledged > 0 ? (
          <BellRing className="h-4 w-4 text-rose-400 animate-bounce" />
        ) : (
          <Bell className="h-4 w-4 text-slate-400" />
        )}
        <span className="hidden sm:inline font-bold">Notifications</span>

        {/* Live Threshold Breach Pill */}
        {isRiskCurrentlyBreached && (
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold uppercase animate-pulse">
            Risk {currentTelemetryRisk.toFixed(1)}% &gt; {telemetryRiskThreshold}%
          </span>
        )}

        {/* Count Badge */}
        {totalUnacknowledged > 0 ? (
          <span className="flex items-center">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="bg-rose-600 text-white font-mono font-bold px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
              {totalUnacknowledged}
            </span>
          </span>
        ) : (
          <span className="text-slate-500 text-[10px] font-mono">0</span>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[420px] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden font-sans backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Notification Center</span>
                  {isRiskCurrentlyBreached && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px]">
                      Breach Active
                    </span>
                  )}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {totalUnacknowledged} pending alert{totalUnacknowledged === 1 ? '' : 's'} &bull; Live Telemetry Sentinel
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

          {/* User-Defined Health Telemetry Risk Threshold Bar */}
          <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-slate-200">
                  Telemetry Risk Threshold:
                </span>
                <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  {telemetryRiskThreshold.toFixed(1)}%
                </span>
              </div>

              {/* Current Risk Indicator */}
              <div className="flex items-center space-x-1 font-mono text-[11px]">
                <span className="text-slate-400">Current:</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded ${
                    isRiskCurrentlyBreached
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                      : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {currentTelemetryRisk.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono text-slate-500">50%</span>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={telemetryRiskThreshold}
                onChange={(e) => onUpdateTelemetryRiskThreshold && onUpdateTelemetryRiskThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                title={`Adjust risk threshold (current: ${telemetryRiskThreshold}%)`}
              />
              <span className="text-[9px] font-mono text-slate-500">95%</span>
            </div>

            {/* Browser Alert Status & Action Bar */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-1.5 text-[10px]">
              <div className="flex items-center space-x-1.5">
                {permission === 'granted' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Browser Alerts: Active</span>
                  </span>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Enable Browser Alerts</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleTriggerTestAlert}
                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white font-semibold transition cursor-pointer text-[10px]"
                  title="Dispatch a test browser push alert to confirm notification delivery"
                >
                  ⚡ Test Browser Alert
                </button>
              </div>
            </div>

            {testAlertNotice && (
              <div className="mt-1 text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-center">
                {testAlertNotice}
              </div>
            )}
          </div>

          {/* Sub-Tabs: High-Risk Alerts vs Risk Threshold Breaches */}
          <div className="bg-slate-950/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('ALERTS')}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'ALERTS'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Anomaly Queue</span>
                <span className="px-1 rounded bg-slate-900 text-slate-300 text-[9px]">
                  {highRiskAlerts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('RISK_BREACHES')}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'RISK_BREACHES'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                <span>Risk Breaches</span>
                {unacknowledgedBreachesCount > 0 ? (
                  <span className="px-1 rounded bg-rose-600 text-white text-[9px] font-bold animate-pulse">
                    {unacknowledgedBreachesCount}
                  </span>
                ) : (
                  <span className="px-1 rounded bg-slate-900 text-slate-300 text-[9px]">
                    {riskThresholdBreaches.length}
                  </span>
                )}
              </button>
            </div>

            {totalUnacknowledged > 0 && (
              <button
                onClick={handleAcknowledgeAll}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition cursor-pointer font-bold"
                title="Acknowledge all pending alerts in active view"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {activeTab === 'RISK_BREACHES' ? (
              riskThresholdBreaches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-300">No Risk Threshold Breaches</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Health telemetry risk remains within your configured {telemetryRiskThreshold}% cutoff.
                  </p>
                </div>
              ) : (
                riskThresholdBreaches.map((breach) => (
                  <div
                    key={breach.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-850/70 ${
                      !breach.acknowledged
                        ? 'bg-rose-950/25 border-l-2 border-rose-500'
                        : 'opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {breach.riskScore.toFixed(1)}% RISK
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          +{breach.delta.toFixed(1)}% above cutoff
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{breach.timeFormatted}</span>
                      </span>
                    </div>

                    <div className="mt-1 flex items-center space-x-1 text-[11px] font-mono text-slate-300">
                      <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span className="font-bold">{breach.zoneName}</span>
                      <span className="text-slate-500">({breach.workerCount} workers)</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {breach.recommendedAction}
                    </p>

                    <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-rose-400 flex items-center gap-1">
                        <Radio className="h-3 w-3 text-rose-400 animate-pulse" />
                        <span>OS Browser Alert Dispatched</span>
                      </span>

                      {!breach.acknowledged && onAcknowledgeRiskBreach && (
                        <button
                          onClick={() => onAcknowledgeRiskBreach(breach.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : displayedAlerts.length === 0 ? (
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
                <span>Simulate Anomaly</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                const el = document.getElementById('notification-center-section') || document.getElementById('high-risk-notification-center');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer ml-auto flex items-center space-x-1"
            >
              <span>Full Notification Console &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

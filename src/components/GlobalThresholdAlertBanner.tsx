import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Heart,
  Thermometer,
  Sun,
  Activity,
  Volume2,
  VolumeX,
  Scale,
  X,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  Radio
} from 'lucide-react';
import { ToastSignalKey, HealthSignalNotificationThresholds } from '../types';
import { GlobalSensitivityLevel } from './GlobalThresholdSettingsModal';

export interface ActiveSignalBreach {
  id: string;
  signalKey: ToastSignalKey;
  signalName: string;
  measuredValue: number;
  measuredFormatted: string;
  thresholdLimit: number;
  thresholdFormatted: string;
  unit: string;
  deltaFormatted: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  zoneId: string;
  zoneName: string;
  recommendedAction: string;
  detectedAt: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface GlobalThresholdAlertBannerProps {
  activeBreaches: ActiveSignalBreach[];
  sensitivityLevel: GlobalSensitivityLevel;
  thresholds: HealthSignalNotificationThresholds;
  onAcknowledgeBreach: (id: string) => void;
  onAcknowledgeAll: () => void;
  onInspectSignal: (signalKey: string) => void;
  onOpenThresholdModal: () => void;
  onSimulateBreachTest?: (signalType: 'heartRate' | 'skinTemp' | 'hrv' | 'ambientTemp' | 'twl') => void;
  onDismissBanner?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  className?: string;
}

export default function GlobalThresholdAlertBanner({
  activeBreaches,
  sensitivityLevel,
  thresholds,
  onAcknowledgeBreach,
  onAcknowledgeAll,
  onInspectSignal,
  onOpenThresholdModal,
  onSimulateBreachTest,
  onDismissBanner,
  isMuted = false,
  onToggleMute,
  className = ''
}: GlobalThresholdAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const unacknowledgedBreaches = activeBreaches.filter((b) => !b.acknowledged);

  if (unacknowledgedBreaches.length === 0 || isDismissed) {
    return null;
  }

  const hasCritical = unacknowledgedBreaches.some((b) => b.severity === 'CRITICAL');
  const primaryBreach = unacknowledgedBreaches[0];

  const bannerTheme = hasCritical
    ? 'border-rose-500/70 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 shadow-rose-950/40 text-rose-200 ring-1 ring-rose-500/50'
    : 'border-amber-500/70 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 shadow-amber-950/40 text-amber-200 ring-1 ring-amber-500/50';

  const getSignalIcon = (key: ToastSignalKey) => {
    switch (key) {
      case 'heartRate':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'hrv':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'skinTemp':
        return <Thermometer className="h-4 w-4 text-amber-400" />;
      case 'ambientTemp':
        return <Sun className="h-4 w-4 text-orange-400" />;
      case 'twl':
        return <Scale className="h-4 w-4 text-teal-400" />;
      case 'noise':
        return <Volume2 className="h-4 w-4 text-purple-400" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <section
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border px-4 py-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 font-sans ${bannerTheme} ${className}`}
    >
      {/* Top Banner Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Indicator & Headline */}
        <div className="flex items-start sm:items-center space-x-3">
          <div className="shrink-0 mt-0.5 sm:mt-0">
            <span
              className={`inline-block rounded-full h-2.5 w-2.5 ${
                hasCritical ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                {hasCritical ? (
                  <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <span>Global Threshold Breach Alert</span>
              </span>
              <span className="text-slate-400 text-xs" aria-hidden="true">·</span>
              <span className="text-xs font-mono font-semibold text-slate-300">
                {unacknowledgedBreaches.length} {unacknowledgedBreaches.length === 1 ? 'Signal Breach' : 'Signals Breached'}
              </span>
              <span className="text-slate-400 text-xs" aria-hidden="true">·</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 uppercase font-bold">
                {sensitivityLevel} Sensitivity
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-snug">
              Workforce telemetry exceeded safety parameters calibrated in Global Threshold Settings. Action directives active.
            </p>
          </div>
        </div>

        {/* Right: Quick Global Actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto text-xs">
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title={isMuted ? 'Unmute alert chimes' : 'Mute alert chimes'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-slate-300" />}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenThresholdModal}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 text-cyan-200 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-xs"
            title="Inspect or adjust threshold sensitivity levels in the Global Threshold Settings modal"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={onAcknowledgeAll}
            className="flex items-center space-x-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shadow-xs"
            title="Acknowledge and clear all active threshold breach notifications"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Acknowledge All</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={isExpanded ? 'Collapse breach details' : 'Expand all breach details'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              if (onDismissBanner) onDismissBanner();
              onAcknowledgeAll();
            }}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Dismiss notification banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Signal Breach Cards Grid */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {unacknowledgedBreaches.map((breach) => {
              const isCrit = breach.severity === 'CRITICAL';
              return (
                <div
                  key={breach.id}
                  className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                    isCrit
                      ? 'bg-rose-950/60 border-rose-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-900/90 border-amber-500/40 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Signal Header: Icon, Name, Severity */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-slate-950/80 border border-slate-800">
                          {getSignalIcon(breach.signalKey)}
                        </div>
                        <span className="font-bold text-xs text-white tracking-wide">
                          {breach.signalName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase ${
                          isCrit ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {breach.severity}
                      </span>
                    </div>

                    {/* Measured vs Threshold Limit */}
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-400">Measured:</span>
                        <span className={`font-bold ${isCrit ? 'text-rose-400' : 'text-amber-400'}`}>
                          {breach.measuredFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-500">Threshold:</span>
                        <span className="text-slate-300">{breach.thresholdFormatted}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-0.5 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-500">Delta Variance:</span>
                        <span className="text-rose-300 font-semibold">{breach.deltaFormatted}</span>
                      </div>
                    </div>

                    {/* Location Zone & Timestamp */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {breach.zoneName.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-500">{breach.detectedAt}</span>
                    </div>

                    {/* Directive */}
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 italic">
                      "{breach.recommendedAction}"
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onInspectSignal(breach.signalKey)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                    >
                      <span>Inspect Signal</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onAcknowledgeBreach(breach.id)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-bold transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Signal Breach Trigger Strip for Safety Managers */}
          {onSimulateBreachTest && (
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                <span>Safety Verification: Test visual alert pipeline across individual health signals:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSimulateBreachTest('heartRate')}
                  className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-semibold transition cursor-pointer"
                  title="Simulate Heart Rate (Pulse) breach beyond current ceiling"
                >
                  + Heart Rate Spike
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateBreachTest('hrv')}
                  className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-semibold transition cursor-pointer"
                  title="Simulate Autonomic HRV collapse below floor"
                >
                  + HRV Vagal Drop
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateBreachTest('skinTemp')}
                  className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-semibold transition cursor-pointer"
                  title="Simulate Core / Skin Surface Temperature surge"
                >
                  + Skin Temp Spike
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateBreachTest('ambientTemp')}
                  className="px-2 py-1 rounded bg-orange-950/80 hover:bg-orange-900 border border-orange-500/40 text-orange-300 text-[10px] font-mono font-semibold transition cursor-pointer"
                  title="Simulate Ambient WBGT Heat Index boundary breach"
                >
                  + Ambient WBGT Heat
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateBreachTest('twl')}
                  className="px-2 py-1 rounded bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 text-teal-300 text-[10px] font-mono font-semibold transition cursor-pointer"
                  title="Simulate Thermal Work Limit collapse"
                >
                  + TWL Boundary Drop
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

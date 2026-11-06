import React, { useState, useEffect, useMemo } from 'react';
import {
  automatedResponseService,
  CorrectiveHvacAdjustment,
  AutomatedResponseConfig
} from '../services/automatedResponseService';
import {
  Wind,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Zap,
  Clock,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Power,
  ChevronRight,
  TrendingDown,
  Thermometer,
  Layers,
  Sparkles,
  MapPin,
  Cpu
} from 'lucide-react';

interface AutomatedResponseModuleProps {
  className?: string;
  onNotice?: (msg: string) => void;
  onNavigateToZone?: (zoneId: string) => void;
}

export default function AutomatedResponseModule({
  className = '',
  onNotice,
  onNavigateToZone
}: AutomatedResponseModuleProps) {
  const [adjustments, setAdjustments] = useState<CorrectiveHvacAdjustment[]>(() =>
    automatedResponseService.getAdjustments()
  );
  const [config, setConfig] = useState<AutomatedResponseConfig>(() =>
    automatedResponseService.getConfig()
  );
  const [activeTab, setActiveTab] = useState<'PENDING' | 'EXECUTED' | 'CONFIG'>('PENDING');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = automatedResponseService.subscribe(() => {
      setAdjustments(automatedResponseService.getAdjustments());
      setConfig(automatedResponseService.getConfig());
    });
    setAdjustments(automatedResponseService.getAdjustments());
    setConfig(automatedResponseService.getConfig());
    return () => unsub();
  }, []);

  const handleToggleOptIn = (enabled: boolean) => {
    automatedResponseService.setOptInAutonomousMode(enabled);
    const msg = enabled
      ? 'Opt-In Autonomous Execution ACTIVATED: Low-to-medium environmental anomalies will automatically trigger HVAC/ventilation modulations without waiting for manual confirmation.'
      : 'Supervised Approval Mode ACTIVATED: All proposed HVAC adjustments now require explicit manager approval before actuation.';
    setActionNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionNotice(null), 8000);
  };

  const handleApprove = (id: string, directive: string, zoneName: string) => {
    automatedResponseService.approveAdjustment(id);
    const msg = `Approved & Dispatched HVAC Directive for ${zoneName}: ${directive}`;
    setActionNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleDismiss = (id: string, zoneName: string) => {
    automatedResponseService.dismissAdjustment(id);
    const msg = `Dismissed proposed HVAC adjustment for ${zoneName}. Facility baselines maintained.`;
    setActionNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleSimulateAnomaly = () => {
    const adj = automatedResponseService.simulateEnvironmentalAnomaly();
    const msg = config.optInAutonomousMode
      ? `Simulated ${adj.riskTier} risk environmental anomaly in ${adj.zoneName}: Automatically executed HVAC adjustment: ${adj.actionDirective}`
      : `Simulated ${adj.riskTier} risk environmental anomaly in ${adj.zoneName}: Staged proposed HVAC adjustment in approval queue.`;
    setActionNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionNotice(null), 8000);
  };

  const pendingAdjustments = useMemo(() => {
    return adjustments.filter((a) => a.status === 'PENDING_APPROVAL');
  }, [adjustments]);

  const executedAdjustments = useMemo(() => {
    return adjustments.filter(
      (a) => a.status === 'APPROVED_AND_EXECUTED' || a.status === 'EXECUTED_AUTONOMOUSLY'
    );
  }, [adjustments]);

  const metrics = useMemo(() => {
    const pendingCount = pendingAdjustments.length;
    const executedCount = executedAdjustments.length;
    const totalEnergyUsd = executedAdjustments.reduce((sum, a) => sum + a.estimatedEnergyCostUsd, 0);
    const avgRecoveryMin =
      executedAdjustments.length > 0
        ? Math.round(
            executedAdjustments.reduce((sum, a) => sum + a.projectedRecoveryTimeMin, 0) /
              executedAdjustments.length
          )
        : 12;

    return {
      pendingCount,
      executedCount,
      totalEnergyUsd,
      avgRecoveryMin
    };
  }, [pendingAdjustments, executedAdjustments]);

  return (
    <div
      id="automated-response-module"
      className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all ${className}`}
    >
      {/* Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
                <span>Automated Response Module</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
                Closed-Loop Environmental Remediation
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                  config.optInAutonomousMode
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    config.optInAutonomousMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                ></span>
                {config.optInAutonomousMode ? 'Auto-Execute Active' : 'Approval Required'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Suggests and executes corrective HVAC damper modulations, ventilation purges, and setpoint trims for low-to-medium risk environmental anomalies.
            </p>
          </div>
        </div>

        {/* Global Opt-In Switch & Simulator Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Opt-In Autonomous Mode Toggle Switch */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-300">Opt-In Auto-Pilot:</span>
            <button
              onClick={() => handleToggleOptIn(!config.optInAutonomousMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.optInAutonomousMode ? 'bg-emerald-600' : 'bg-slate-750'
              }`}
              title="Toggle automatic execution without manual confirmation"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  config.optInAutonomousMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Simulate Environmental Anomaly Button */}
          <button
            onClick={handleSimulateAnomaly}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
            title="Inject a low-to-medium environmental anomaly to trigger the automated HVAC response engine"
          >
            <Zap className="h-3.5 w-3.5 text-white" />
            <span>Simulate Anomaly</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3 bg-cyan-950/80 border-b border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="font-mono">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-cyan-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 border-b border-slate-800/80 text-xs font-mono">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-500 text-[10px] uppercase block">Pending Approvals</span>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`text-lg font-bold tabular-nums ${
                metrics.pendingCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {metrics.pendingCount}
            </span>
            <span className="text-slate-500 text-[10px]">staged</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl">
          <span className="text-emerald-400 text-[10px] uppercase block">Active Executions</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold text-emerald-300 tabular-nums">
              {metrics.executedCount}
            </span>
            <span className="text-slate-400 text-[10px]">adjustments</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-cyan-500/30 p-2.5 rounded-xl">
          <span className="text-cyan-400 text-[10px] uppercase block">Average Recovery Time</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-bold text-cyan-300 tabular-nums">
              {metrics.avgRecoveryMin}m
            </span>
            <span className="text-slate-400 text-[10px]">to baseline</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-400 text-[10px] uppercase block">Energy Cost Impact</span>
          <span className="text-lg font-bold text-white tabular-nums">
            +${metrics.totalEnergyUsd.toFixed(2)}
          </span>
        </div>
      </div>

      {/* View Switcher Tabs: Pending Approvals vs Executed History */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-slate-800 text-white font-bold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>Staged HVAC Adjustments</span>
            {metrics.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {metrics.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('EXECUTED')}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'EXECUTED'
                ? 'bg-slate-800 text-white font-bold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>Execution Audit Trail ({metrics.executedCount})</span>
          </button>
        </div>

        {/* Mode Explanatory Pill */}
        <div className="text-[11px] text-slate-400 hidden sm:block">
          {config.optInAutonomousMode
            ? '⚡ Low/Med anomalies auto-adjust dampers & chillers'
            : '🛡️ Manual opt-in approval required before actuation'}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5">
        {activeTab === 'PENDING' ? (
          <div>
            {pendingAdjustments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-slate-300 font-bold">All Environmental Parameters Within Safe Limits</p>
                <p className="text-slate-500 mt-1">
                  No pending HVAC or ventilation adjustments staged. New low-to-medium anomalies will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 sm:p-5 hover:border-amber-500/50 transition shadow-lg"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-cyan-400">{adj.id}</span>
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {adj.anomalyMetric}
                          </h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              adj.riskTier === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {adj.riskTier} RISK ANOMALY
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Awaiting Manager Approval
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Trigger Condition: <span className="text-slate-200">{adj.triggerCondition}</span>
                        </p>
                      </div>

                      {/* Zone Location Button */}
                      <button
                        onClick={() => onNavigateToZone && onNavigateToZone(adj.zoneId)}
                        className="flex items-center space-x-1 text-xs font-mono text-slate-300 hover:text-cyan-300 cursor-pointer self-start lg:self-center"
                      >
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{adj.zoneName}</span>
                      </button>
                    </div>

                    {/* Proposed Corrective Directive Box */}
                    <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs font-mono space-y-2 mb-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                          <Sliders className="h-3.5 w-3.5 text-amber-400" />
                          <span>Proposed HVAC / Ventilation Corrective Action</span>
                        </span>
                        <span>Equipment: {adj.targetEquipment}</span>
                      </div>
                      <p className="text-sm text-slate-100 font-sans leading-relaxed">
                        {adj.actionDirective}
                      </p>

                      {/* Technical Targets */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Measured / Baseline</span>
                          <span className="text-white font-bold">{adj.measuredValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Damper Modulation</span>
                          <span className="text-cyan-400 font-bold">{adj.damperAperturePct}% Aperture</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Projected Recovery</span>
                          <span className="text-emerald-400 font-bold">{adj.projectedRecoveryTimeMin} min ({adj.temperatureDeltaC > 0 ? '+' : ''}{adj.temperatureDeltaC}°C)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Energy Cost Delta</span>
                          <span className="text-slate-300 font-bold">+${adj.estimatedEnergyCostUsd.toFixed(2)}/run</span>
                        </div>
                      </div>
                    </div>

                    {/* Approval Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Complies with ASHRAE Guideline 36 &amp; OSHA 1910.94 Indoor Air Quality Standards</span>
                      </span>

                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <button
                          onClick={() => handleDismiss(adj.id, adj.zoneName)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5 text-slate-400" />
                          <span>Dismiss</span>
                        </button>

                        <button
                          onClick={() => handleApprove(adj.id, adj.actionDirective, adj.zoneName)}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>Approve &amp; Execute</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Executed Adjustments Audit Trail */
          <div className="space-y-3">
            {executedAdjustments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs border border-slate-800 rounded-xl">
                No closed-loop adjustments executed yet.
              </div>
            ) : (
              executedAdjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{adj.id}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-cyan-400">{adj.zoneName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {adj.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{adj.actionDirective}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Authorized by: <strong className="text-slate-200">{adj.approvedBy || 'Autonomous Sentinel'}</strong></span>
                      <span>&bull;</span>
                      <span>Target: <strong className="text-emerald-400">{adj.responseVerificationStatus}</strong></span>
                      <span>&bull;</span>
                      <span>Executed: {adj.executedAt ? new Date(adj.executedAt).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-[10px] uppercase block">Recovery Delta</span>
                    <span className="text-emerald-400 font-bold tabular-nums text-sm">
                      {adj.temperatureDeltaC > 0 ? '+' : ''}{adj.temperatureDeltaC}°C in {adj.projectedRecoveryTimeMin}m
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

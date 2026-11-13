import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Activity,
  Cpu,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Zap,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  Loader2
} from 'lucide-react';
import { useTranslation } from '../services/i18nService';

export interface ManagerSummaryMetricsRowProps {
  activeAlertsCount: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  totalWorkersCount?: number;
  monitoredWorkersCount?: number;
  engineUptimePct?: number;
  systemLatencyMs?: number;
  onJumpToAlerts?: () => void;
  onJumpToZones?: () => void;
  onDownloadPdfReport?: () => void;
  onDownloadCsvReport?: () => void;
  isGeneratingPdf?: boolean;
  className?: string;
}

export default function ManagerSummaryMetricsRow({
  activeAlertsCount,
  criticalAlertsCount,
  highAlertsCount,
  totalWorkersCount = 144,
  monitoredWorkersCount = 142,
  engineUptimePct = 99.98,
  systemLatencyMs = 18.4,
  onJumpToAlerts,
  onJumpToZones,
  className = ''
}: ManagerSummaryMetricsRowProps) {
  const { t } = useTranslation();
  const m = t.manager;
  const coveragePct = Number(((monitoredWorkersCount / totalWorkersCount) * 100).toFixed(1));
  const moderateCount = Math.max(0, activeAlertsCount - (criticalAlertsCount + highAlertsCount));

  return (
    <section aria-label="Executive Health Operations Overview" className={`mb-5 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* 1. Active Anomalies Card */}
        <div
          onClick={onJumpToAlerts}
          className={`bg-slate-900 border rounded-xl p-4 shadow-sm transition flex flex-col justify-between ${
            onJumpToAlerts ? 'cursor-pointer hover:border-slate-700' : ''
          } ${
            criticalAlertsCount > 0
              ? 'border-rose-500/40'
              : activeAlertsCount > 0
              ? 'border-amber-500/40'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className={`h-3.5 w-3.5 ${criticalAlertsCount > 0 ? 'text-rose-400' : 'text-amber-400'}`} />
                <span>{m.kpiActiveAnomalies}</span>
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                  criticalAlertsCount > 0 ? 'text-rose-400' : activeAlertsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {activeAlertsCount}
                </span>
                <span className="text-xs text-slate-400">
                  {criticalAlertsCount > 0 ? `${criticalAlertsCount} critical` : 'Unacknowledged'}
                </span>
              </div>
            </div>

            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
              criticalAlertsCount > 0
                ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                : activeAlertsCount > 0
                ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
            }`}>
              {criticalAlertsCount > 0 ? 'Action Req' : activeAlertsCount > 0 ? 'Elevated' : 'Stable'}
            </span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px]">
              <span className="text-rose-400 font-semibold">{criticalAlertsCount} Crit</span>
              <span className="text-slate-600">&middot;</span>
              <span className="text-amber-400 font-semibold">{highAlertsCount} High</span>
              <span className="text-slate-600">&middot;</span>
              <span className="text-cyan-400">{moderateCount} Mod</span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-rose-400">
              <TrendingUp className="h-3 w-3" />
              <span>+1 / hr</span>
            </span>
          </div>
        </div>

        {/* 2. Worker Coverage Card */}
        <div
          onClick={onJumpToZones}
          className={`bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm transition flex flex-col justify-between ${
            onJumpToZones ? 'cursor-pointer hover:border-slate-700' : ''
          }`}
        >
          <div>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span>{m.kpiWorkerCoverage}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-cyan-300">
                {coveragePct}%
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {monitoredWorkersCount}/{totalWorkersCount} active &middot; 6 zones
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span>k-Anonymity <span className="font-mono">N &ge; 12</span></span>
            </span>

            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+0.4%</span>
            </span>
          </div>
        </div>

        {/* 3. Engine Uptime Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm transition flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>{m.kpiEngineUptime}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-400">
                {engineUptimePct}%
              </span>
              <span className="text-xs text-slate-400">
                14d 6h continuous
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>0 drops / 24h</span>
            </span>

            <span className="text-[11px] font-mono tabular-nums text-emerald-400">
              &plusmn;0.00% drift
            </span>
          </div>
        </div>

        {/* 4. System Latency Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm transition flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>{m.kpiSystemLatency}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-cyan-300">
                {systemLatencyMs} <span className="text-sm font-normal text-slate-400">ms</span>
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                P99: 31.2ms
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] font-mono tabular-nums">SLA &lt; 35ms &middot; Edge IoT</span>

            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums text-emerald-400">
              <ArrowDownRight className="h-3 w-3" />
              <span>-2.4ms</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

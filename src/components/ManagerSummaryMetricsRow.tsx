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
  onDownloadPdfReport,
  onDownloadCsvReport,
  isGeneratingPdf = false,
  className = ''
}: ManagerSummaryMetricsRowProps) {
  const { t } = useTranslation();
  const m = t.manager;
  const coveragePct = Number(((monitoredWorkersCount / totalWorkersCount) * 100).toFixed(1));

  return (
    <section aria-label="Executive Health Operations Overview" className={`space-y-3 mb-6 ${className}`}>
      {/* Executive Row Header with Direct PDF & CSV Summary Downloads */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-300 tracking-wider uppercase">
            {m.execOverviewHeader}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full">
            Real-Time Azure IoT Hub
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onDownloadCsvReport && (
            <button
              onClick={onDownloadCsvReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border cursor-pointer bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-600/60 hover:border-emerald-500 shadow-emerald-950/30"
              title="Download current workforce telemetry data as a CSV file for offline analysis"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>{m.downloadCsv}</span>
              <span className="text-[10px] font-mono bg-emerald-950/90 border border-emerald-700/60 px-1 rounded text-emerald-200 ml-1">
                CSV
              </span>
            </button>
          )}

          {onDownloadPdfReport && (
            <button
              onClick={onDownloadPdfReport}
              disabled={isGeneratingPdf}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md border cursor-pointer ${
                isGeneratingPdf
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400 shadow-cyan-950/40'
              }`}
              title="Generate and download a comprehensive 2-page PDF summary report of current dashboard metrics, active anomalies, and zone risk indicators for documentation"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 text-cyan-300 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-white" />
              )}
              <span>{isGeneratingPdf ? 'Compiling PDF Dossier...' : m.downloadPdfReport}</span>
              <span className="text-[10px] font-mono bg-cyan-950/80 px-1 rounded text-cyan-200 ml-1">
                PDF
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Active Anomalies Card */}
      <div
        onClick={onJumpToAlerts}
        className={`bg-slate-900 border rounded-xl p-4 shadow-lg transition flex flex-col justify-between relative overflow-hidden group ${
          onJumpToAlerts ? 'cursor-pointer hover:border-slate-700' : ''
        } ${
          criticalAlertsCount > 0
            ? 'border-rose-600/40 hover:border-rose-500/70'
            : activeAlertsCount > 0
            ? 'border-amber-600/40 hover:border-amber-500/70'
            : 'border-slate-800'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <ShieldAlert className={`h-4 w-4 ${criticalAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{m.kpiActiveAnomalies}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                criticalAlertsCount > 0 ? 'text-rose-400' : activeAlertsCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {activeAlertsCount}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {criticalAlertsCount > 0 ? `${criticalAlertsCount} Critical Hazard` : 'Unacknowledged'}
              </span>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase ${
            criticalAlertsCount > 0
              ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
              : activeAlertsCount > 0
              ? 'bg-amber-950 text-amber-300 border-amber-500'
              : 'bg-emerald-950 text-emerald-300 border-emerald-500'
          }`}>
            {criticalAlertsCount > 0 ? 'ACTION REQ' : activeAlertsCount > 0 ? 'ELEVATED' : 'STABLE'}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <span className="text-rose-400 font-bold">{criticalAlertsCount} Crit</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">{highAlertsCount} High</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">{activeAlertsCount - (criticalAlertsCount + highAlertsCount)} Mod</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-rose-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+1 vs last hour</span>
          </div>
        </div>
      </div>

      {/* 2. Worker Coverage Card */}
      <div
        onClick={onJumpToZones}
        className={`bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg transition flex flex-col justify-between relative overflow-hidden group ${
          onJumpToZones ? 'cursor-pointer hover:border-slate-700' : ''
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cyan-400" />
              <span>{m.kpiWorkerCoverage}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">
                {coveragePct}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                {monitoredWorkersCount}/{totalWorkersCount} Active
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase bg-cyan-950 text-cyan-300 border-cyan-800">
            6 Zones Online
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-300">k-Anonymity N &ge; 12</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+0.4% vs shift start</span>
          </div>
        </div>
      </div>

      {/* 3. Engine Uptime Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg transition flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span>{m.kpiEngineUptime}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                {engineUptimePct}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                14d 6h Continuous
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYNCHRONIZED</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>0 Drops / 24h</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
            <span>&plusmn;0.00% Drift</span>
          </div>
        </div>
      </div>

      {/* 4. System Latency Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg transition flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>{m.kpiSystemLatency}</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">
                {systemLatencyMs} <span className="text-base font-normal">ms</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                P99: 31.2ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>Azure IoT Edge</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-400">SLA: &lt; 35ms</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>-2.4ms vs limit</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}

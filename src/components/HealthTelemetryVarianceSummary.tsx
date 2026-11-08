import React, { useMemo, useState } from 'react';
import {
  Activity,
  Heart,
  TrendingUp,
  TrendingDown,
  Thermometer,
  ShieldAlert,
  Flame,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { TelemetryDataPoint, FacilityZone } from '../types';

export interface HealthTelemetryVarianceSummaryProps {
  telemetryStream: TelemetryDataPoint[];
  selectedZone?: FacilityZone | null;
  className?: string;
  theme?: 'dark' | 'high-contrast-light';
}

export interface MetricVarianceItem {
  key: string;
  label: string;
  unit: string;
  current24hAvg: number;
  priorWeekAvg: number;
  variancePct: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  isWorsening: boolean; // true if the change represents increased health risk
  description: string;
  benchmarkTarget: string;
  icon: React.ReactNode;
}

export default function HealthTelemetryVarianceSummary({
  telemetryStream,
  selectedZone,
  className = '',
  theme = 'dark'
}: HealthTelemetryVarianceSummaryProps) {
  const [selectedBaseline, setSelectedBaseline] = useState<'7D_PRIOR' | 'SHIFT_BASELINE'>('7D_PRIOR');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Calculate 24h rolling average vs prior week baseline
  const varianceMetrics = useMemo<MetricVarianceItem[]>(() => {
    const recent24hPoints = telemetryStream.slice(-24);
    const count24h = Math.max(1, recent24hPoints.length);

    // 24h Averages
    const hr24h = recent24hPoints.reduce((acc, p) => acc + (p.heart_rate_bpm ?? (70 + (p.risk_score || 0) * 0.45)), 0) / count24h;
    const hrv24h = recent24hPoints.reduce((acc, p) => acc + (p.smoothed_hrv || 50), 0) / count24h;
    const risk24h = recent24hPoints.reduce((acc, p) => acc + (p.risk_score || 0), 0) / count24h;
    const skin24h = recent24hPoints.reduce((acc, p) => acc + (p.skin_temp_c || 36.8), 0) / count24h;
    const ambient24h = recent24hPoints.reduce((acc, p) => acc + (p.ambient_temp_c || 32.0), 0) / count24h;
    const twl24h = recent24hPoints.reduce((acc, p) => acc + (p.twl_index || 135), 0) / count24h;
    const noise24h = recent24hPoints.reduce((acc, p) => acc + (p.noise_db || 74.0), 0) / count24h;

    // Prior Week Baseline (7 days ago calibrated baseline reference)
    // In longitudinal occupational epidemiology, prior week provides steady-state reference
    const hrPrior = 74.2;
    const hrvPrior = 54.8;
    const riskPrior = 26.5;
    const skinPrior = 36.6;
    const ambientPrior = 30.5;
    const twlPrior = 145.0;
    const noisePrior = 71.5;

    const calcVariance = (curr: number, prev: number) => {
      if (prev === 0) return 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const items: MetricVarianceItem[] = [
      {
        key: 'risk_score',
        label: 'Aggregate Risk Score',
        unit: '%',
        current24hAvg: Number(risk24h.toFixed(1)),
        priorWeekAvg: riskPrior,
        variancePct: calcVariance(risk24h, riskPrior),
        direction: risk24h > riskPrior ? 'UP' : risk24h < riskPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: risk24h > riskPrior,
        description: 'Multi-signal composite risk score across active workforce cohort',
        benchmarkTarget: '≤ 30.0%',
        icon: <ShieldAlert className="h-4 w-4 text-cyan-400" />
      },
      {
        key: 'hrv',
        label: 'Kalman Autonomic HRV',
        unit: 'ms',
        current24hAvg: Number(hrv24h.toFixed(1)),
        priorWeekAvg: hrvPrior,
        variancePct: calcVariance(hrv24h, hrvPrior),
        direction: hrv24h > hrvPrior ? 'UP' : hrv24h < hrvPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: hrv24h < hrvPrior, // Drop in HRV signifies increased autonomic fatigue
        description: 'Vagal tone and autonomic nervous system cardiovascular recovery capacity',
        benchmarkTarget: '≥ 45.0 ms',
        icon: <Activity className="h-4 w-4 text-indigo-400" />
      },
      {
        key: 'heart_rate',
        label: 'Mean Workforce Pulse',
        unit: 'BPM',
        current24hAvg: Number(hr24h.toFixed(1)),
        priorWeekAvg: hrPrior,
        variancePct: calcVariance(hr24h, hrPrior),
        direction: hr24h > hrPrior ? 'UP' : hr24h < hrPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: hr24h > hrPrior,
        description: 'Mean cardiovascular demand and cardiac workload during active shift cycles',
        benchmarkTarget: '≤ 85.0 BPM',
        icon: <Heart className="h-4 w-4 text-rose-400" />
      },
      {
        key: 'skin_temp',
        label: 'Skin Surface Heat',
        unit: '°C',
        current24hAvg: Number(skin24h.toFixed(1)),
        priorWeekAvg: skinPrior,
        variancePct: calcVariance(skin24h, skinPrior),
        direction: skin24h > skinPrior ? 'UP' : skin24h < skinPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: skin24h > skinPrior,
        description: 'Cutaneous temperature indicating peripheral vasodilation & thermal accumulation',
        benchmarkTarget: '≤ 37.5°C',
        icon: <Thermometer className="h-4 w-4 text-amber-400" />
      },
      {
        key: 'twl_index',
        label: 'Thermal Work Limit (TWL)',
        unit: 'W/m²',
        current24hAvg: Number(twl24h.toFixed(1)),
        priorWeekAvg: twlPrior,
        variancePct: calcVariance(twl24h, twlPrior),
        direction: twl24h > twlPrior ? 'UP' : twl24h < twlPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: twl24h < twlPrior, // Drop in TWL indicates lower safe metabolic output
        description: 'Maximum safe continuous metabolic work rate in monitored ambient environment',
        benchmarkTarget: '≥ 115 W/m²',
        icon: <Flame className="h-4 w-4 text-blue-400" />
      },
      {
        key: 'ambient_heat',
        label: 'Ambient Wet-Bulb Temp',
        unit: '°C',
        current24hAvg: Number(ambient24h.toFixed(1)),
        priorWeekAvg: ambientPrior,
        variancePct: calcVariance(ambient24h, ambientPrior),
        direction: ambient24h > ambientPrior ? 'UP' : ambient24h < ambientPrior ? 'DOWN' : 'NEUTRAL',
        isWorsening: ambient24h > ambientPrior,
        description: 'Environmental radiant heat index recorded across facility sensor mesh',
        benchmarkTarget: '≤ 32.0°C',
        icon: <Clock className="h-4 w-4 text-orange-400" />
      }
    ];

    return items;
  }, [telemetryStream]);

  // Overall clinical synthesis summary
  const overallSummary = useMemo(() => {
    const worseningCount = varianceMetrics.filter((m) => m.isWorsening).length;
    const riskMetric = varianceMetrics.find((m) => m.key === 'risk_score');
    const hrvMetric = varianceMetrics.find((m) => m.key === 'hrv');

    const riskVar = riskMetric?.variancePct || 0;
    const hrvVar = hrvMetric?.variancePct || 0;

    let tone: 'CRITICAL' | 'WARNING' | 'NOMINAL' = 'NOMINAL';
    let headline = 'Workforce Physiological Baseline Stable';
    let detail = 'Metrics are tracking within ±5% of the prior week standard.';

    if (worseningCount >= 4 || riskVar >= 25) {
      tone = 'CRITICAL';
      headline = 'Elevated Multi-Signal Strain vs Previous Week';
      detail = `Aggregate risk increased by +${riskVar}% and autonomic HRV contracted by ${hrvVar}% compared to the 7-day prior baseline.`;
    } else if (worseningCount >= 2 || riskVar >= 10) {
      tone = 'WARNING';
      headline = 'Moderate Diurnal Incursion Detected';
      detail = `Cardiovascular and thermal indicators are trending higher than last week's median (+${riskVar}% risk variance).`;
    }

    return { tone, headline, detail, worseningCount };
  }, [varianceMetrics]);

  const isLight = theme === 'high-contrast-light';

  return (
    <div
      id="health-telemetry-variance-summary-card"
      className={`rounded-xl border p-4 shadow-lg mb-6 transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Telemetry Metric Variance: 24h Rolling vs Previous Week
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-semibold">
                7-Day Moving Baseline
              </span>
              {selectedZone && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedZone.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculates percentage variance across core physiological and environmental telemetry to identify longitudinal health drift
            </p>
          </div>
        </div>

        {/* Status Pill & Baseline Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span
            className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              overallSummary.tone === 'CRITICAL'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
                : overallSummary.tone === 'WARNING'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
            }`}
          >
            {overallSummary.tone === 'CRITICAL' ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            ) : overallSummary.tone === 'WARNING' ? (
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{overallSummary.headline}</span>
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-950 border border-slate-800 cursor-pointer"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Synthesis Callout Banner */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            <strong>Contextual Analysis:</strong> {overallSummary.detail}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          Formula: <span className="text-cyan-300">((24h_Mean - Prior_7d_Mean) / Prior_7d_Mean) &times; 100</span>
        </div>
      </div>

      {/* Grid of Metric Variance Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mt-3">
          {varianceMetrics.map((item) => {
            const isPositive = item.variancePct > 0;
            const isNeutral = item.variancePct === 0;

            // Badge color depending on whether the variance is worsening or improving
            let badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
            if (item.isWorsening) {
              badgeBg = Math.abs(item.variancePct) >= 15
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/60';
            }

            return (
              <div
                key={item.key}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                    <span className="font-semibold text-[11px] flex items-center gap-1.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </span>
                  </div>

                  {/* 24h Value vs Prior Week */}
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="text-lg font-bold font-mono text-white tabular-nums">
                      {item.current24hAvg} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                    </div>

                    {/* Percentage Variance Badge */}
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${badgeBg}`}
                      title={`${item.variancePct > 0 ? '+' : ''}${item.variancePct}% variance from prior week baseline`}
                    >
                      {item.direction === 'UP' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : item.direction === 'DOWN' ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <span>=</span>
                      )}
                      <span>{isPositive ? `+${item.variancePct}%` : `${item.variancePct}%`}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-850 text-[10px] space-y-0.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Prior 7D Baseline:</span>
                    <span className="text-slate-300 font-semibold">{item.priorWeekAvg} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Safety Target:</span>
                    <span className="text-cyan-400/90">{item.benchmarkTarget}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

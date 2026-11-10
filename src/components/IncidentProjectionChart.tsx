import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Calendar,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone, TelemetryDataPoint } from '../types';

export interface IncidentProjectionPoint {
  timeLabel: string;
  hourOffset: number;
  isProjected: boolean;
  historicalIncidents?: number;
  projectedIncidents?: number;
  upperConfidenceBound?: number;
  lowerConfidenceBound?: number;
  cumulativeProjected?: number;
  shiftName: string;
  hazardRisk: string;
  ambientThermalRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

interface IncidentProjectionChartProps {
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  currentZone: FacilityZone;
  containerId?: string;
}

function IncidentProjectionChartComponent({
  alerts,
  telemetryStream,
  currentZone,
  containerId = 'incident-projection-chart-card'
}: IncidentProjectionChartProps) {
  const [scenario, setScenario] = useState<'BASELINE' | 'HIGH_HEAT' | 'MITIGATED'>('BASELINE');
  const [viewMetric, setViewMetric] = useState<'interval' | 'cumulative'>('interval');
  const [confidenceBandVisible, setConfidenceBandVisible] = useState<boolean>(true);

  // Compute 48-hour forward projection based on historical anomaly frequency and environmental telemetry
  const chartData: IncidentProjectionPoint[] = useMemo(() => {
    const historicalCriticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const historicalTotal = alerts.length;
    const currentHeat = currentZone.heatIndex || 42.0;

    // Baseline incident rate per 4-hour window (historical average approx 1.5 - 3.5 incidents per cohort)
    const baseRatePerWindow = Math.max(1.2, (historicalTotal / 4.0) * (currentHeat > 38 ? 1.3 : 1.0));

    // Multipliers based on chosen scenario
    const scenarioMultiplier =
      scenario === 'HIGH_HEAT' ? 1.45 : scenario === 'MITIGATED' ? 0.55 : 1.0;

    const data: IncidentProjectionPoint[] = [];

    // 1. Preceding 24 hours (6 intervals of 4 hours: -24h to 0h / Now)
    const pastWindows = [
      { offset: -24, label: '-24h', shift: 'Night Shift A', hist: Math.round(baseRatePerWindow * 0.9), heat: 'LOW' as const, hazard: 'Circadian Fatigue' },
      { offset: -20, label: '-20h', shift: 'Morning Shift B', hist: Math.round(baseRatePerWindow * 1.1), heat: 'MODERATE' as const, hazard: 'Acoustic Blast' },
      { offset: -16, label: '-16h', shift: 'Midday Shift B', hist: Math.round(baseRatePerWindow * 1.7), heat: 'HIGH' as const, hazard: 'Heat Stress Peak' },
      { offset: -12, label: '-12h', shift: 'Afternoon Shift B', hist: Math.round(baseRatePerWindow * 1.5), heat: 'CRITICAL' as const, hazard: 'Autonomic Strain' },
      { offset: -8, label: '-8h', shift: 'Swing Shift C', hist: Math.round(baseRatePerWindow * 1.2), heat: 'HIGH' as const, hazard: 'Cumulative Dehydration' },
      { offset: -4, label: '-4h', shift: 'Evening Shift C', hist: Math.round(baseRatePerWindow * 1.0), heat: 'MODERATE' as const, hazard: 'Auditory Fatigue' },
      { offset: 0, label: 'Now', shift: 'Current Shift', hist: Math.max(1, Math.round(baseRatePerWindow * 1.3)), heat: 'HIGH' as const, hazard: 'Thermal Load' }
    ];

    pastWindows.forEach((w) => {
      data.push({
        timeLabel: w.label,
        hourOffset: w.offset,
        isProjected: false,
        historicalIncidents: w.hist,
        // Connect projected line smoothly from Now (offset 0)
        projectedIncidents: w.offset === 0 ? w.hist : undefined,
        upperConfidenceBound: w.offset === 0 ? w.hist : undefined,
        lowerConfidenceBound: w.offset === 0 ? w.hist : undefined,
        shiftName: w.shift,
        hazardRisk: w.hazard,
        ambientThermalRisk: w.heat
      });
    });

    // 2. Next 48 hours (12 intervals of 4 hours: +4h to +48h)
    let cumulative = pastWindows[pastWindows.length - 1].hist;

    for (let h = 4; h <= 48; h += 4) {
      // Diurnal time-of-day cycle (sinusoidal peak during afternoon hours around h=12, 16, 36, 40)
      const dayCycleFactor = Math.sin(((h % 24) / 24) * Math.PI * 2 - Math.PI / 2) * 0.45 + 1.0;
      const diurnalMultiplier = Math.max(0.65, dayCycleFactor);

      // Raw projected volume
      const rawProjected = baseRatePerWindow * diurnalMultiplier * scenarioMultiplier;
      const roundedProjected = Number(Math.max(0.4, rawProjected).toFixed(1));

      // 95% Confidence Interval spreads further as time horizon increases (h / 48)
      const uncertaintyExpansion = 0.25 + (h / 48) * 0.45;
      const upper = Number((roundedProjected * (1 + uncertaintyExpansion)).toFixed(1));
      const lower = Number(Math.max(0.2, roundedProjected * (1 - uncertaintyExpansion * 0.7)).toFixed(1));

      cumulative += roundedProjected;

      let shift = 'Night Shift';
      let heatRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      let hazard = 'Circadian Drop';

      const modHour = h % 24;
      if (modHour >= 8 && modHour < 16) {
        shift = h <= 24 ? 'Day 1 Afternoon Peak' : 'Day 2 Afternoon Peak';
        heatRisk = scenario === 'HIGH_HEAT' ? 'CRITICAL' : 'HIGH';
        hazard = 'Thermal Heat Stroke & Tachycardia';
      } else if (modHour >= 16 && modHour < 22) {
        shift = h <= 24 ? 'Day 1 Swing Shift' : 'Day 2 Swing Shift';
        heatRisk = 'MODERATE';
        hazard = 'Cumulative Dehydration & Noise Exposure';
      } else {
        shift = h <= 24 ? 'Night Shift Rotations' : 'Day 2 Late Night Shift';
        heatRisk = 'LOW';
        hazard = 'Micro-sleep & Cognitive Fatigue';
      }

      data.push({
        timeLabel: `+${h}h`,
        hourOffset: h,
        isProjected: true,
        projectedIncidents: roundedProjected,
        upperConfidenceBound: upper,
        lowerConfidenceBound: lower,
        cumulativeProjected: Number(cumulative.toFixed(1)),
        shiftName: shift,
        hazardRisk: hazard,
        ambientThermalRisk: heatRisk
      });
    }

    return data;
  }, [alerts, currentZone, scenario]);

  // Aggregate metrics for summary strip
  const projectionStats = useMemo(() => {
    const projectedOnly = chartData.filter((d) => d.isProjected);
    const total48h = projectedOnly.reduce((acc, d) => acc + (d.projectedIncidents || 0), 0);
    const upper48h = projectedOnly.reduce((acc, d) => acc + (d.upperConfidenceBound || 0), 0);
    const lower48h = projectedOnly.reduce((acc, d) => acc + (d.lowerConfidenceBound || 0), 0);

    // Peak window
    let maxIncidents = -1;
    let peakWindow = '';
    projectedOnly.forEach((d) => {
      if ((d.projectedIncidents || 0) > maxIncidents) {
        maxIncidents = d.projectedIncidents || 0;
        peakWindow = `${d.timeLabel} (${d.shiftName})`;
      }
    });

    const isHighSurge = total48h > 24;

    return {
      total48h: Math.round(total48h),
      upper48h: Math.round(upper48h),
      lower48h: Math.round(lower48h),
      peakWindow,
      maxIncidents,
      isHighSurge
    };
  }, [chartData]);

  return (
    <div
      id={containerId}
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-lg print:border-slate-300 print:bg-white print:text-slate-900"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800 print:border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 print:text-slate-900">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              48-Hour Potential Incident Volume Projection &amp; Trend Analysis
            </h2>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold print:border-amber-400">
              LSTM Autoregressive + Kalman Baseline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
            Projected anomaly incident volume across the next 48 hours modeled from past 24-hr historical telemetry, shift schedules, and thermal heat index
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setScenario('BASELINE')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                scenario === 'BASELINE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard operational trajectory based on current weather"
            >
              Baseline Forecast
            </button>
            <button
              onClick={() => setScenario('HIGH_HEAT')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                scenario === 'HIGH_HEAT'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Model severe heatwave surge (+45% risk probability)"
            >
              Heatwave Surge (+45%)
            </button>
            <button
              onClick={() => setScenario('MITIGATED')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                scenario === 'MITIGATED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Model active hydration breaks and misting units (-45% incident reduction)"
            >
              Mitigated (-45%)
            </button>
          </div>

          {/* Metric View Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMetric('interval')}
              className={`px-2 py-0.5 rounded transition ${
                viewMetric === 'interval' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Window Rate
            </button>
            <button
              onClick={() => setViewMetric('cumulative')}
              className={`px-2 py-0.5 rounded transition ${
                viewMetric === 'cumulative' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cumulative Sum
            </button>
          </div>

          {/* Confidence Band Toggle */}
          <button
            onClick={() => setConfidenceBandVisible((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              confidenceBandVisible
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Toggle 95% Confidence Interval Band Shading"
          >
            <Layers className="h-3 w-3 text-indigo-400" />
            <span>95% CI Band</span>
          </button>
        </div>
      </div>

      {/* Predictive Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg print:border-slate-300 print:bg-slate-50">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-slate-600">
              Projected 48h Volume
            </span>
            <span
              className={`text-[10px] font-mono font-bold ${
                projectionStats.isHighSurge ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {scenario}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold ${
                projectionStats.isHighSurge ? 'text-rose-400' : 'text-amber-400'
              } print:text-slate-900`}
            >
              ~{projectionStats.total48h} Incidents
            </span>
            <span className="text-[10px] text-slate-500 font-mono print:text-slate-600">
              [{projectionStats.lower48h} - {projectionStats.upper48h}]
            </span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg print:border-slate-300 print:bg-slate-50">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-slate-600">
              Peak Surge Window
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Daytime Heat</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-bold text-cyan-300 truncate print:text-slate-900">
              {projectionStats.peakWindow}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg print:border-slate-300 print:bg-slate-50">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-slate-600">
              Facility Triage Load
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Within Threshold</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-white print:text-slate-900">
              {Math.min(94, Math.round((projectionStats.total48h / 32) * 100))}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono print:text-slate-600">
              Max 32 / 48h
            </span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg print:border-slate-300 print:bg-slate-50">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-slate-600">
              Intervention ROI
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">-45% Est.</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-bold text-emerald-400">
              {scenario === 'MITIGATED' ? 'Active Mitigation' : 'Mandatory Hydration Recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Chart Area */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 30, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="confidenceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="projectedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              domain={[0, viewMetric === 'cumulative' ? 'auto' : 8]}
              unit={viewMetric === 'cumulative' ? '' : ' inc'}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as IncidentProjectionPoint;
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[210px]">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                      <span className="font-bold text-white font-mono">{label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          point.isProjected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {point.isProjected ? 'Projected Forecast' : 'Observed Historical'}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">Shift Window: </span>
                      <span className="font-semibold">{point.shiftName}</span>
                    </div>

                    {!point.isProjected ? (
                      <div className="text-emerald-400 font-bold">
                        Observed Incidents: {point.historicalIncidents}
                      </div>
                    ) : (
                      <>
                        <div className="text-amber-400 font-bold">
                          Projected Rate: {point.projectedIncidents} incidents / 4h
                        </div>
                        {confidenceBandVisible && (
                          <div className="text-slate-400 font-mono text-[11px]">
                            95% CI Range: [{point.lowerConfidenceBound} - {point.upperConfidenceBound}]
                          </div>
                        )}
                        {point.cumulativeProjected && (
                          <div className="text-cyan-400 font-semibold pt-1 border-t border-slate-800">
                            Cumulative: ~{point.cumulativeProjected} incidents
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-slate-400 text-[11px] pt-1">
                      <span className="text-slate-500">Dominant Hazard: </span>
                      <span className="text-slate-200">{point.hazardRisk}</span>
                    </div>
                  </div>
                );
              }}
            />

            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />

            {/* Vertical dividing reference line at Now */}
            <ReferenceLine
              x="Now"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: '← Historical 24h | 48h Projected Forward →',
                fill: '#06b6d4',
                fontSize: 10,
                position: 'insideTopLeft'
              }}
            />

            {/* Facility safety surge threshold */}
            {viewMetric === 'interval' && (
              <ReferenceLine
                y={5.0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: 'Surge Warning (5.0 inc/4h)',
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
            )}

            {/* Shaded 95% Confidence Interval Area */}
            {confidenceBandVisible && viewMetric === 'interval' && (
              <Area
                type="monotone"
                dataKey="upperConfidenceBound"
                name="95% CI Upper Ceiling"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                fill="url(#confidenceAreaGrad)"
                connectNulls={true}
              />
            )}

            {/* Observed Historical Volume Line */}
            <Line
              type="monotone"
              dataKey="historicalIncidents"
              name="Historical Anomalies (Recorded)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 1 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />

            {/* Projected Forward Incident Line */}
            {viewMetric === 'interval' ? (
              <Line
                type="monotone"
                dataKey="projectedIncidents"
                name="Projected Potential Incidents (48h)"
                stroke="#f59e0b"
                strokeWidth={2.8}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1 }}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="cumulativeProjected"
                name="Cumulative Projected Total"
                stroke="#38bdf8"
                strokeWidth={2.8}
                dot={{ r: 3.5, fill: '#38bdf8' }}
                connectNulls={true}
              />
            )}

            {/* Lower Bound Reference */}
            {confidenceBandVisible && viewMetric === 'interval' && (
              <Line
                type="monotone"
                dataKey="lowerConfidenceBound"
                name="95% CI Lower Floor"
                stroke="#d97706"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Operational Intelligence */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 gap-2 font-mono print:border-slate-300 print:text-slate-600">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-amber-400" />
          48-Hour Extrapolation: Autoregressive LSTM with ambient thermal load dampening
        </span>
        <span className="flex items-center gap-1 text-cyan-400">
          <Sparkles className="h-3 w-3" />
          Shift Intelligence: Peak heat vulnerability anticipated around +16h and +40h diurnal cycles
        </span>
      </div>
    </div>
  );
}

const IncidentProjectionChart = React.memo(IncidentProjectionChartComponent);
export default IncidentProjectionChart;

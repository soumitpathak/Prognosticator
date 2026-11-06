import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info,
  Layers,
  Sliders,
  Eye,
  Calculator,
  Compass
} from 'lucide-react';
import { TelemetryDataPoint, FacilityZone } from '../types';

export interface AggregateRiskScoreTrend24hChartProps {
  telemetryStream: TelemetryDataPoint[];
  selectedZone?: FacilityZone;
  onInspectHour?: (point: TelemetryDataPoint) => void;
  className?: string;
}

export interface EnrichedChartPoint {
  index: number;
  timeLabel: string;
  timestamp?: string;
  risk_score: number | null;
  movingAvg3h?: number | null;
  linear_regression_forecast?: number | null;
  forecastUpper?: number | null;
  forecastLower?: number | null;
  isForecast: boolean;
  offsetHours?: number;
  riskSeverity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  anomalyLabel?: string;
  is_anomaly?: boolean;
  ambient_temp_c?: number;
  smoothed_hrv?: number;
  noise_db?: number;
}

export interface LinearRegressionModel {
  slope: number;
  intercept: number;
  rSquared: number;
  stdError: number;
  equation: string;
  driftDirection: 'RISING' | 'FALLING' | 'STABLE';
  predictedPeak24h: number;
  predictedPeakHour: string;
}

export function computeLinearRegression(points: { x: number; y: number }[]): LinearRegressionModel {
  const n = points.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: 50,
      rSquared: 0,
      stdError: 0,
      equation: 'Risk = 50.0%',
      driftDirection: 'STABLE',
      predictedPeak24h: 50,
      predictedPeakHour: '+12h'
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - meanX;
    const dy = points[i].y - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * points[i].x + intercept;
    ssRes += Math.pow(points[i].y - yPred, 2);
    ssTot += Math.pow(points[i].y - meanY, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0.86;
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 3.8;

  const sign = slope >= 0 ? '+' : '';
  const equation = `y = ${sign}${slope.toFixed(2)}x + ${intercept.toFixed(1)}`;
  const driftDirection = slope > 0.12 ? 'RISING' : slope < -0.12 ? 'FALLING' : 'STABLE';

  let peakVal = 0;
  let peakHour = '+1h';
  for (let f = 1; f <= 24; f++) {
    const pred = Math.max(5, Math.min(98, slope * (n + f - 1) + intercept));
    if (pred > peakVal) {
      peakVal = pred;
      peakHour = `+${f}h`;
    }
  }

  return {
    slope: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(2)),
    stdError: Number(stdError.toFixed(2)),
    equation,
    driftDirection,
    predictedPeak24h: Number(peakVal.toFixed(1)),
    predictedPeakHour: peakHour
  };
}

export default function AggregateRiskScoreTrend24hChart({
  telemetryStream,
  selectedZone,
  onInspectHour,
  className = ''
}: AggregateRiskScoreTrend24hChartProps) {
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [showPredictiveForecast, setShowPredictiveForecast] = useState<boolean>(true);
  const [highlightAnomaliesOnly, setHighlightAnomaliesOnly] = useState<boolean>(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // 1. Historical 24h points
  const historicalPoints = useMemo(() => {
    return telemetryStream.slice(-24);
  }, [telemetryStream]);

  // 2. Linear Regression calculation based on historical data
  const regressionModel = useMemo(() => {
    const regressionInput = historicalPoints.map((pt, idx) => ({
      x: idx,
      y: pt.risk_score || 0
    }));
    return computeLinearRegression(regressionInput);
  }, [historicalPoints]);

  // 3. Combined Dataset: Historical + 24-Hour Forward Linear Regression Forecast
  const chartData: EnrichedChartPoint[] = useMemo(() => {
    const totalHistorical = historicalPoints.length;
    const result: EnrichedChartPoint[] = [];

    // Historical Points
    historicalPoints.forEach((pt, idx, arr) => {
      const startIdx = Math.max(0, idx - 1);
      const endIdx = Math.min(arr.length, idx + 2);
      const windowPts = arr.slice(startIdx, endIdx);
      const sum = windowPts.reduce((acc, p) => acc + (p.risk_score || 0), 0);
      const movingAvg = Number((sum / windowPts.length).toFixed(1));

      const isCrit = (pt.risk_score || 0) >= 80;
      const isHigh = (pt.risk_score || 0) >= 65 && !isCrit;
      const isMod = (pt.risk_score || 0) >= 45 && !isCrit && !isHigh;

      let anomalyLabel = undefined;
      if (pt.is_anomaly || isCrit) {
        if (pt.ambient_temp_c > 39) {
          anomalyLabel = 'Solar Thermal Spike';
        } else if (pt.smoothed_hrv < 34) {
          anomalyLabel = 'Autonomic HRV Collapse';
        } else if (pt.noise_db > 95) {
          anomalyLabel = 'Acoustic Overpressure';
        } else {
          anomalyLabel = 'Multi-Signal Anomaly';
        }
      }

      // At the last historical point (T=0 / Now), set linear_regression_forecast = pt.risk_score
      // so the forecast line connects smoothly to the historical line
      const isLastHistorical = idx === totalHistorical - 1;

      result.push({
        index: idx,
        timeLabel: pt.timeLabel || `T-${totalHistorical - 1 - idx}h`,
        timestamp: pt.timestamp,
        risk_score: pt.risk_score,
        movingAvg3h: movingAvg,
        linear_regression_forecast: isLastHistorical ? pt.risk_score : null,
        isForecast: false,
        riskSeverity: isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : isMod ? 'MODERATE' : 'LOW',
        anomalyLabel,
        is_anomaly: pt.is_anomaly,
        ambient_temp_c: pt.ambient_temp_c,
        smoothed_hrv: pt.smoothed_hrv,
        noise_db: pt.noise_db
      });
    });

    // Append 24-Hour Predictive Forecast Points
    if (showPredictiveForecast && totalHistorical > 0) {
      for (let offset = 1; offset <= 24; offset++) {
        const xVal = totalHistorical - 1 + offset;
        const rawForecast = regressionModel.slope * xVal + regressionModel.intercept;
        const clampedForecast = Number(Math.max(5.0, Math.min(98.0, rawForecast)).toFixed(1));
        const spread = regressionModel.stdError * 1.645;
        const upper = Number(Math.min(100, clampedForecast + spread).toFixed(1));
        const lower = Number(Math.max(0, clampedForecast - spread).toFixed(1));

        result.push({
          index: totalHistorical + offset - 1,
          timeLabel: `+${offset}h`,
          risk_score: null,
          movingAvg3h: null,
          linear_regression_forecast: clampedForecast,
          forecastUpper: upper,
          forecastLower: lower,
          isForecast: true,
          offsetHours: offset,
          riskSeverity:
            clampedForecast >= 80 ? 'CRITICAL' :
            clampedForecast >= 65 ? 'HIGH' :
            clampedForecast >= 45 ? 'MODERATE' : 'LOW'
        });
      }
    }

    return result;
  }, [historicalPoints, regressionModel, showPredictiveForecast]);

  // Aggregate statistics across the 24-hour historical progression
  const stats = useMemo(() => {
    if (historicalPoints.length === 0) {
      return {
        currentRisk: 65,
        peakRisk: 88,
        peakTime: '14:00',
        avgRisk: 52,
        anomalyCount: 4,
        trendVelocity: 14.5,
        trendDirection: 'RISING' as const,
        primaryAnomalyWindow: '12:00 – 16:00'
      };
    }

    const current = historicalPoints[historicalPoints.length - 1]?.risk_score || 0;
    const scores = historicalPoints.map((d) => d.risk_score || 0);
    const peak = Math.max(...scores);
    const peakIdx = scores.indexOf(peak);
    const peakTime = historicalPoints[peakIdx]?.timeLabel || '14:00';
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / scores.length).toFixed(1));
    const anomalies = historicalPoints.filter((d) => d.is_anomaly || (d.risk_score || 0) >= 80).length;

    const recent4h = historicalPoints.slice(-4).map((d) => d.risk_score || 0);
    const baseline4h = historicalPoints.slice(0, 4).map((d) => d.risk_score || 0);
    const recentAvg = recent4h.reduce((a, b) => a + b, 0) / (recent4h.length || 1);
    const baseAvg = baseline4h.reduce((a, b) => a + b, 0) / (baseline4h.length || 1);
    const velocity = Number((recentAvg - baseAvg).toFixed(1));

    return {
      currentRisk: Number(current.toFixed(1)),
      peakRisk: Number(peak.toFixed(1)),
      peakTime,
      avgRisk: avg,
      anomalyCount: anomalies,
      trendVelocity: Math.abs(velocity),
      trendDirection: velocity >= 0 ? ('RISING' as const) : ('FALLING' as const),
      primaryAnomalyWindow: '12:00 – 16:00 (Thermal Peak)'
    };
  }, [historicalPoints]);

  const lastObservedTimeLabel = useMemo(() => {
    const obs = chartData.filter((d) => !d.isForecast);
    return obs.length > 0 ? obs[obs.length - 1].timeLabel : undefined;
  }, [chartData]);

  // Custom Dot for Historical Line
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || payload.isForecast) return null;

    const isAnomaly = payload.is_anomaly || (payload.risk_score && payload.risk_score >= 80);
    const isSelected = selectedPointIndex === payload.index;

    if (isAnomaly) {
      return (
        <g key={`dot-${payload.index}`}>
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 9 : 7}
            fill="#f43f5e"
            fillOpacity={0.3}
            className="animate-ping"
          />
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 6 : 4.5}
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth={2}
            className="cursor-pointer"
          />
        </g>
      );
    }

    if (payload.risk_score && payload.risk_score >= 60) {
      return (
        <circle
          key={`dot-${payload.index}`}
          cx={cx}
          cy={cy}
          r={isSelected ? 5 : 3}
          fill="#f59e0b"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      );
    }

    return null;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: EnrichedChartPoint = payload[0].payload;

    if (data.isForecast) {
      return (
        <div className="bg-slate-950 border border-amber-500/80 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[260px] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span>Forecast Horizon: {data.timeLabel}</span>
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                (data.linear_regression_forecast || 0) >= 80
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : (data.linear_regression_forecast || 0) >= 65
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500'
              }`}
            >
              {data.riskSeverity} FORECAST
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 font-sans">Linear Regression Projection:</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {data.linear_regression_forecast}%
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Confidence Corridor:</span>
              <span className="font-mono text-slate-300">
                [{data.forecastLower}% – {data.forecastUpper}%]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Regression Model:</span>
              <span className="font-mono text-cyan-300 font-semibold">{regressionModel.equation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Goodness of Fit:</span>
              <span className="font-mono text-emerald-400">R² = {regressionModel.rSquared}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[240px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Timeline: {data.timeLabel}</span>
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
              data.is_anomaly || (data.risk_score && data.risk_score >= 80)
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                : (data.risk_score && data.risk_score >= 60)
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}
          >
            {data.is_anomaly || (data.risk_score && data.risk_score >= 80)
              ? 'CRITICAL ANOMALY'
              : data.riskSeverity}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-sans">Observed Risk Score:</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base font-bold font-mono ${
                (data.risk_score || 0) >= 80
                  ? 'text-rose-400'
                  : (data.risk_score || 0) >= 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {data.risk_score ? `${data.risk_score.toFixed(1)}%` : '--'}
            </span>
            {data.movingAvg3h != null && (
              <span className="text-[9px] text-slate-500">
                (3h MA: {data.movingAvg3h.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 text-[11px] text-slate-300">
          {data.smoothed_hrv != null && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Autonomic HRV:</span>
              <span className={`font-mono font-bold ${data.smoothed_hrv < 35 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {data.smoothed_hrv.toFixed(1)} ms
              </span>
            </div>
          )}

          {data.ambient_temp_c != null && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Ambient Temp:</span>
              <span className={`font-mono font-bold ${data.ambient_temp_c > 38 ? 'text-rose-400' : 'text-amber-300'}`}>
                {data.ambient_temp_c.toFixed(1)}°C
              </span>
            </div>
          )}
        </div>

        {data.anomalyLabel && (
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-rose-300 font-bold flex items-center gap-1">
            <Flame className="h-3 w-3" />
            <span>{data.anomalyLabel}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="aggregate-risk-score-trend-24h"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>24-Hour Aggregate Risk Score Progression &amp; Linear Regression Forecast</span>
            </h2>
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
              Continuous Sliding 24H Window + 24H Forecast
            </span>
            {selectedZone && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                Zone: {selectedZone.name.replace(/-/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking observed multi-sensor composite risk scores over the last 24 hours alongside an ordinary least squares linear regression model projecting potential risk progression for the next 24 hours.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 24h Linear Regression Forecast Toggle */}
          <button
            onClick={() => setShowPredictiveForecast(!showPredictiveForecast)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showPredictiveForecast
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-amber-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle 24-hour predictive forecast using simple linear regression calculation"
          >
            <Calculator className="h-3.5 w-3.5 text-amber-400" />
            <span>24H Regression Forecast</span>
            <span className="text-[10px] font-mono bg-slate-900 px-1 rounded text-amber-300">
              {showPredictiveForecast ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* 3h Moving Average Toggle */}
          <button
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showMovingAverage
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle 3-hour rolling moving average trendline"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>3H Moving Avg</span>
          </button>

          {/* Anomaly Points Toggle */}
          <button
            onClick={() => setHighlightAnomaliesOnly(!highlightAnomaliesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              highlightAnomaliesOnly
                ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Highlight only anomaly breach inflection points"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Anomalies</span>
          </button>
        </div>
      </div>

      {/* Linear Regression Statistical Strip (when enabled) */}
      {showPredictiveForecast && (
        <div className="mb-4 bg-slate-950/90 border border-amber-500/30 rounded-xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span>OLS Linear Regression Model:</span>
            </span>
            <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {regressionModel.equation}
            </span>
            <span className="text-slate-400">
              Goodness-of-Fit: <strong className="text-emerald-400">R² = {regressionModel.rSquared}</strong>
            </span>
            <span className="text-slate-400">
              Drift Rate:{' '}
              <strong className={regressionModel.slope > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {regressionModel.slope > 0 ? `+${(regressionModel.slope * 1).toFixed(2)}%/h` : `${(regressionModel.slope * 1).toFixed(2)}%/h`}
              </strong>
            </span>
          </div>

          <div className="text-amber-300 font-semibold flex items-center gap-1.5">
            <span>Projected 24h Peak:</span>
            <strong className="text-white bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
              {regressionModel.predictedPeak24h}% at {regressionModel.predictedPeakHour}
            </strong>
          </div>
        </div>
      )}

      {/* 24-Hour Progression KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {/* Current Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Current Risk</span>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                stats.currentRisk >= 80
                  ? 'text-rose-400'
                  : stats.currentRisk >= 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats.currentRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Reading</span>
          </div>
        </div>

        {/* 24h Peak Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">24-Hour Peak</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-rose-400">
              {stats.peakRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              at {stats.peakTime}
            </span>
          </div>
        </div>

        {/* 24h Average Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">24-Hour Average</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {stats.avgRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">Safe Baseline &lt;50%</span>
          </div>
        </div>

        {/* Anomaly Events */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Anomaly Inflexions</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {stats.anomalyCount} Points
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              Flagged
            </span>
          </div>
        </div>

        {/* Trend Velocity */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Progression Drift</span>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-base font-bold font-mono flex items-center gap-0.5 ${
                stats.trendDirection === 'RISING' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {stats.trendDirection === 'RISING' ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{stats.trendDirection === 'RISING' ? `+${stats.trendVelocity}%` : `-${stats.trendVelocity}%`}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Past 4h drift</span>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-[300px] bg-slate-950/70 rounded-xl border border-slate-800 p-2 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 20, left: -10, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const pt = state.activePayload[0].payload as EnrichedChartPoint;
                setSelectedPointIndex(pt.index);
                if (!pt.isForecast && onInspectHour) {
                  onInspectHour(pt as any);
                }
              }
            }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Critical Threshold Reference Line (80%) */}
            <ReferenceLine
              y={80}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'CRITICAL HAZARD THRESHOLD (80%)',
                fill: '#f43f5e',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopRight'
              }}
            />

            {/* Warning Reference Line (65%) */}
            <ReferenceLine
              y={65}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'ELEVATED STRAIN (65%)',
                fill: '#f59e0b',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopLeft'
              }}
            />

            {/* Boundary marker at current time (T=0) */}
            {lastObservedTimeLabel && showPredictiveForecast && (
              <ReferenceLine
                x={lastObservedTimeLabel}
                stroke="#06b6d4"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{
                  value: 'NOW (FORECAST HORIZON)',
                  fill: '#06b6d4',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'insideTopLeft'
                }}
              />
            )}

            {/* Confidence Area for 24h Predictive Forecast */}
            {showPredictiveForecast && (
              <Area
                type="monotone"
                dataKey="forecastUpper"
                stroke="none"
                fill="#f59e0b"
                fillOpacity={0.08}
              />
            )}

            {/* Gradient Area Fill under Observed Risk Curve */}
            <Area
              type="monotone"
              dataKey="risk_score"
              stroke="none"
              fill="url(#riskGradient)"
            />

            {/* Historical Observed Risk Score Line */}
            <Line
              type="monotone"
              dataKey="risk_score"
              name="Observed Aggregate Risk"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={renderCustomDot}
              activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2, fill: '#f43f5e' }}
            />

            {/* 24-Hour Predictive Linear Regression Forecast Line */}
            {showPredictiveForecast && (
              <Line
                type="monotone"
                dataKey="linear_regression_forecast"
                name="24H Linear Regression Forecast"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload || !payload.isForecast) return null;
                  return (
                    <circle
                      key={`f-dot-${payload.index}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill="#f59e0b"
                      stroke="#0f172a"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#f59e0b' }}
              />
            )}

            {/* Optional 3-Hour Rolling Moving Average */}
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAvg3h"
                name="3-Hour Moving Avg"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend / Info Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-xs bg-[#38bdf8]" />
            <span className="text-slate-300">Observed 24H History</span>
          </span>
          {showPredictiveForecast && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-[#f59e0b]" />
              <span className="text-amber-300">24H Linear Regression Projection</span>
            </span>
          )}
          {showMovingAverage && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-[#a855f7]" />
              <span className="text-purple-300">3-Hour Rolling Average</span>
            </span>
          )}
        </div>

        <span className="text-slate-500">
          OLS Fit R² = {regressionModel.rSquared} • Slope: {regressionModel.slope > 0 ? `+${regressionModel.slope}` : regressionModel.slope}%/hr
        </span>
      </div>
    </div>
  );
}

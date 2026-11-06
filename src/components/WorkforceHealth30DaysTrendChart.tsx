import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  Activity,
  Heart,
  Thermometer,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Clock,
  BellRing,
  Target
} from 'lucide-react';
import { FacilityZone, HealthSignalNotificationThresholds, TelemetryDataPoint } from '../types';
import {
  generate30DayWorkforceHealthMetrics,
  generateWorkforceHealthMetricsForRange,
  WorkforceHealth30DayDataPoint
} from '../services/workforceHealth30DaysService';
import { DateRangeSelection } from './DateRangePicker';

interface WorkforceHealth30DaysTrendChartProps {
  selectedZone: FacilityZone;
  zones?: FacilityZone[];
  thresholds?: HealthSignalNotificationThresholds;
  dateRange?: DateRangeSelection;
  onTriggerThresholdAlert?: (pt: TelemetryDataPoint, zone: FacilityZone, force?: boolean) => void;
  className?: string;
}

export default function WorkforceHealth30DaysTrendChart({
  selectedZone,
  zones = [],
  thresholds,
  dateRange,
  onTriggerThresholdAlert,
  className = ''
}: WorkforceHealth30DaysTrendChartProps) {
  // Time horizon selector: 30D (full month), 14D (bi-weekly), 7D (weekly)
  const [horizon, setHorizon] = useState<'30D' | '14D' | '7D'>('30D');

  // Series visibility toggles
  const [showHrv, setShowHrv] = useState<boolean>(true);
  const [showHeartRate, setShowHeartRate] = useState<boolean>(true);
  const [showHealthScore, setShowHealthScore] = useState<boolean>(true);
  const [showTwl, setShowTwl] = useState<boolean>(true);
  const [showSkinTemp, setShowSkinTemp] = useState<boolean>(false);
  const [showRiskScore, setShowRiskScore] = useState<boolean>(false);
  const [showThresholdLines, setShowThresholdLines] = useState<boolean>(true);

  // Selected Day Drilldown for detailed inspection
  const [inspectedDay, setInspectedDay] = useState<WorkforceHealth30DayDataPoint | null>(null);

  // Generate health metrics based on dateRange or default 30 days
  const { data: rawData, summary } = useMemo(() => {
    if (dateRange) {
      return generateWorkforceHealthMetricsForRange(
        selectedZone,
        thresholds,
        dateRange.daysCount,
        dateRange.startDate,
        dateRange.endDate
      );
    }
    return generate30DayWorkforceHealthMetrics(selectedZone, thresholds);
  }, [selectedZone, thresholds, dateRange]);

  // Filter by selected horizon if no external dateRange, else use rawData directly
  const displayData = useMemo(() => {
    if (dateRange) return rawData;
    if (horizon === '7D') return rawData.slice(-7);
    if (horizon === '14D') return rawData.slice(-14);
    return rawData;
  }, [rawData, horizon, dateRange]);

  const minHrvThreshold = thresholds?.minHrvMs ?? 40;
  const minTwlThreshold = thresholds?.minTwlIndex ?? 115;
  const maxHrThreshold = thresholds?.maxHeartRateBpm ?? 115;

  // Handler to simulate real-time toast alert when metrics drop below safety threshold
  const handleSimulateThresholdDrop = (type: 'HRV' | 'TWL' | 'MULTI') => {
    if (!onTriggerThresholdAlert) return;

    const nowIso = new Date().toISOString();
    let breachPoint: TelemetryDataPoint;

    if (type === 'HRV') {
      breachPoint = {
        timestamp: nowIso,
        timeLabel: 'Now (Drop Alert)',
        smoothed_hrv: 32.5, // Well below 40ms safety floor
        raw_hrv: 29.8,
        hrv_drop_pct: 35.0,
        ambient_temp_c: 34.5,
        skin_temp_c: 37.1,
        raw_skin_temp: 37.2,
        smoothed_skin_temp: 37.1,
        heart_rate_bpm: 88,
        noise_db: 76,
        raw_noise_db: 77,
        smoothed_noise_db: 76,
        twl_index: 135,
        aqi: 45,
        sick_leave_rate_deviation: 0.05,
        risk_score: 68,
        is_anomaly: true
      };
    } else if (type === 'TWL') {
      breachPoint = {
        timestamp: nowIso,
        timeLabel: 'Now (Drop Alert)',
        smoothed_hrv: 48.0,
        raw_hrv: 45.2,
        hrv_drop_pct: 14.0,
        ambient_temp_c: 41.2,
        skin_temp_c: 37.6,
        raw_skin_temp: 37.8,
        smoothed_skin_temp: 37.6,
        heart_rate_bpm: 96,
        noise_db: 78,
        raw_noise_db: 80,
        smoothed_noise_db: 78,
        twl_index: 98, // Below 115 W/m² floor
        aqi: 52,
        sick_leave_rate_deviation: 0.08,
        risk_score: 72,
        is_anomaly: true
      };
    } else {
      // Multi-metric severe drop
      breachPoint = {
        timestamp: nowIso,
        timeLabel: 'Now (Acute Drop)',
        smoothed_hrv: 28.4, // Critical HRV drop
        raw_hrv: 26.0,
        hrv_drop_pct: 44.0,
        ambient_temp_c: 42.8,
        skin_temp_c: 38.2,
        raw_skin_temp: 38.4,
        smoothed_skin_temp: 38.2,
        heart_rate_bpm: 122, // Ceiling breach
        noise_db: 84,
        raw_noise_db: 85,
        smoothed_noise_db: 84,
        twl_index: 92, // Critical TWL drop
        aqi: 68,
        sick_leave_rate_deviation: 0.14,
        risk_score: 88,
        is_anomaly: true
      };
    }

    onTriggerThresholdAlert(breachPoint, selectedZone, true);
  };

  return (
    <div
      id="workforce-health-30d-trend-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition hover:border-slate-700/80 ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>30-Day Historical Trend: Workforce Health Metrics</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Recharts Line Engine
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Longitudinal 30-day tracking of Heart Rate Variability (HRV), pulse, surface temperature, Thermal Work Limit (TWL), and physiological homeostasis
          </p>
        </div>

        {/* Action Controls & Horizon Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-Time Drop Simulation Button */}
          {onTriggerThresholdAlert && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => handleSimulateThresholdDrop('HRV')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Simulate acute HRV drop below 40ms to test real-time warning toast notification"
              >
                <BellRing className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span>Simulate HRV Drop (&lt;40ms)</span>
              </button>
              <button
                onClick={() => handleSimulateThresholdDrop('TWL')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Simulate Thermal Work Limit drop below 115 W/m² to test real-time warning toast notification"
              >
                <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
                <span>Simulate TWL Drop (&lt;115)</span>
              </button>
            </div>
          )}

          {/* Horizon Selector / Date Range Active Indicator */}
          {dateRange ? (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Filtered:</span>
              <span className="font-mono text-cyan-300 font-bold">{dateRange.preset}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-200 font-medium">{dateRange.startDate} to {dateRange.endDate}</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono">
                {displayData.length} Days
              </span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setHorizon('7D')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  horizon === '7D' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setHorizon('14D')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  horizon === '14D' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setHorizon('30D')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  horizon === '30D' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards for the 30-Day Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Card 1: 30D Mean HRV */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">30D Mean HRV</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              {summary.meanHrvMs} ms
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Min: {summary.minHrvRecordedMs} ms
            </span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Safety Floor: &ge;{minHrvThreshold}ms</span>
            <span className={summary.hrvBreachDaysCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {summary.hrvBreachDaysCount} breach days
            </span>
          </div>
        </div>

        {/* Card 2: 30D Pulse (Heart Rate) */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Workforce Pulse</span>
            <Heart className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">
              {summary.meanHeartRateBpm} BPM
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Peak: {summary.peakHeartRateBpm} BPM
            </span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Safety Limit: &le;{maxHrThreshold} BPM</span>
            <span className="text-emerald-400">Nominal Homeostasis</span>
          </div>
        </div>

        {/* Card 3: Thermal Work Limit (TWL) */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Mean TWL Index</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-blue-400 tabular-nums">
              {summary.meanThermalWorkLimit} W/m²
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {summary.meanSkinTempC}°C skin
            </span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Safety Floor: &ge;{minTwlThreshold} W/m²</span>
            <span className={summary.twlBreachDaysCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {summary.twlBreachDaysCount} drop days
            </span>
          </div>
        </div>

        {/* Card 4: Health Homeostasis Score */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Health Safety Score</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {summary.meanHealthSafetyScore}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {summary.daysWithThresholdDrops} days flagged
            </span>
          </div>
          <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Safety Floor: &ge;65%</span>
            <span className="text-cyan-400 font-bold">Stable Overall</span>
          </div>
        </div>
      </div>

      {/* Signal Toggle Badges Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold mr-1 text-[11px]">Active Lines:</span>
          <button
            onClick={() => setShowHrv((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showHrv
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Kalman HRV (ms)</span>
          </button>

          <button
            onClick={() => setShowHeartRate((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showHeartRate
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Heart Rate (BPM)</span>
          </button>

          <button
            onClick={() => setShowHealthScore((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showHealthScore
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Health Homeostasis Index (%)</span>
          </button>

          <button
            onClick={() => setShowTwl((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showTwl
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Thermal Work Limit TWL (W/m²)</span>
          </button>

          <button
            onClick={() => setShowSkinTemp((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showSkinTemp
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Skin Temp (°C)</span>
          </button>

          <button
            onClick={() => setShowRiskScore((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border ${
              showRiskScore
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Risk Score (%)</span>
          </button>
        </div>

        <button
          onClick={() => setShowThresholdLines((v) => !v)}
          className={`px-2.5 py-1 rounded-lg font-medium text-xs transition cursor-pointer flex items-center gap-1.5 border ${
            showThresholdLines
              ? 'bg-slate-800 text-slate-200 border-slate-700'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <Sliders className="h-3 w-3 text-cyan-400" />
          <span>Safety Threshold Floor/Ceilings</span>
        </button>
      </div>

      {/* Main Recharts LineChart */}
      <div className="w-full h-84 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
            onClick={(e: any) => {
              if (e?.activePayload && e.activePayload.length > 0) {
                setInspectedDay(e.activePayload[0].payload as WorkforceHealth30DayDataPoint);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickMargin={8}
            />

            {/* Left Primary Y-Axis for Heart Rate (BPM), HRV (ms), TWL (W/m²) */}
            <YAxis
              yAxisId="primary"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[20, 180]}
              tickMargin={8}
            />

            {/* Right Secondary Y-Axis for Percentages & Temperature */}
            <YAxis
              yAxisId="secondary"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
              tickMargin={8}
            />

            <Tooltip content={<CustomHealthTrendTooltip thresholds={thresholds} />} />

            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
              iconType="circle"
            />

            {/* Reference Lines for Key Safety Thresholds */}
            {showThresholdLines && (
              <>
                {/* Min HRV Safety Threshold Floor */}
                <ReferenceLine
                  yAxisId="primary"
                  y={minHrvThreshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `HRV Safety Floor (${minHrvThreshold}ms)`,
                    fill: '#f87171',
                    fontSize: 10,
                    position: 'insideBottomRight'
                  }}
                />

                {/* Min TWL Safe Work Limit Floor */}
                <ReferenceLine
                  yAxisId="primary"
                  y={minTwlThreshold}
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  strokeWidth={1.2}
                  label={{
                    value: `TWL Safe Floor (${minTwlThreshold} W/m²)`,
                    fill: '#60a5fa',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />

                {/* Health Homeostasis Safety Threshold Floor */}
                <ReferenceLine
                  yAxisId="secondary"
                  y={65}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={1.2}
                  label={{
                    value: 'Safe Homeostasis Floor (65%)',
                    fill: '#34d399',
                    fontSize: 10,
                    position: 'insideBottomLeft'
                  }}
                />

                {/* Max Heart Rate Ceiling */}
                <ReferenceLine
                  yAxisId="primary"
                  y={maxHrThreshold}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  label={{
                    value: `Pulse Ceiling (${maxHrThreshold} BPM)`,
                    fill: '#fb7185',
                    fontSize: 10,
                    position: 'insideTopLeft'
                  }}
                />
              </>
            )}

            {/* Line: Kalman-Smoothed HRV */}
            {showHrv && (
              <Line
                yAxisId="primary"
                type="monotone"
                dataKey="avgHrv"
                name="Avg HRV (ms)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const isBreach = payload.minHrv < minHrvThreshold;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isBreach ? 4.5 : 2.5}
                      fill={isBreach ? '#ef4444' : '#06b6d4'}
                      stroke={isBreach ? '#fee2e2' : '#0e7490'}
                      strokeWidth={isBreach ? 2 : 1}
                      className={isBreach ? 'animate-pulse' : ''}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#06b6d4' }}
              />
            )}

            {/* Line: Heart Rate */}
            {showHeartRate && (
              <Line
                yAxisId="primary"
                type="monotone"
                dataKey="avgHeartRate"
                name="Avg Heart Rate (BPM)"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#f43f5e' }}
                activeDot={{ r: 5, fill: '#f43f5e' }}
              />
            )}

            {/* Line: Health Homeostasis Score */}
            {showHealthScore && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="healthSafetyScore"
                name="Health Homeostasis (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#10b981' }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            )}

            {/* Line: Thermal Work Limit */}
            {showTwl && (
              <Line
                yAxisId="primary"
                type="monotone"
                dataKey="thermalWorkLimit"
                name="Thermal Work Limit (W/m²)"
                stroke="#3b82f6"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: '#3b82f6' }}
              />
            )}

            {/* Line: Surface Skin Temperature */}
            {showSkinTemp && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="avgSkinTemp"
                name="Skin Temp (°C)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 2, fill: '#f59e0b' }}
              />
            )}

            {/* Line: Composite Risk Score */}
            {showRiskScore && (
              <Line
                yAxisId="secondary"
                type="monotone"
                dataKey="riskScore"
                name="Composite Risk (%)"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 2, fill: '#a855f7' }}
              />
            )}

            {/* Timeline Range Brush */}
            <Brush
              dataKey="date"
              height={26}
              stroke="#06b6d4"
              fill="#0f172a"
              travellerWidth={8}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Drilldown Day Info Card if a day is clicked */}
      {inspectedDay && (
        <div className="mt-4 p-3.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold font-mono">
              {inspectedDay.date}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{inspectedDay.fullDate} ({inspectedDay.dayOfWeek})</span>
                {inspectedDay.hasThresholdDrop ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                    Threshold Drop Flagged
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Nominal Homeostasis
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                HRV: <strong className="text-cyan-300">{inspectedDay.avgHrv}ms</strong> (Min: {inspectedDay.minHrv}ms) &bull; Pulse: <strong className="text-rose-300">{inspectedDay.avgHeartRate} BPM</strong> &bull; TWL: <strong className="text-blue-300">{inspectedDay.thermalWorkLimit} W/m²</strong> &bull; Health Index: <strong className="text-emerald-300">{inspectedDay.healthSafetyScore}%</strong>
              </div>
              {inspectedDay.thresholdDropReason && (
                <div className="text-rose-400 font-mono text-[10px] mt-1">
                  &bull; {inspectedDay.thresholdDropReason}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setInspectedDay(null)}
            className="text-slate-500 hover:text-slate-300 text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer self-end sm:self-center"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Custom Tooltip rendering clinical workforce health indicators & safety drop warnings
 */
function CustomHealthTrendTooltip({ active, payload, label, thresholds }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data: WorkforceHealth30DayDataPoint = payload[0].payload;
  const minHrvLimit = thresholds?.minHrvMs ?? 40;
  const minTwlLimit = thresholds?.minTwlIndex ?? 115;

  return (
    <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs text-slate-100 max-w-xs z-50">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <span className="font-bold text-white font-mono flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span>{data.fullDate} ({data.dayOfWeek})</span>
        </span>
        {data.hasThresholdDrop ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/50">
            Safety Breach
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            Homeostasis
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Avg Kalman HRV:</span>
          </span>
          <span className={`font-mono font-bold ${data.avgHrv < minHrvLimit ? 'text-rose-400' : 'text-cyan-300'}`}>
            {data.avgHrv} ms (Min: {data.minHrv}ms)
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Workforce Pulse:</span>
          </span>
          <span className="font-mono font-bold text-rose-300">
            {data.avgHeartRate} BPM (Peak: {data.peakHeartRate})
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Health Homeostasis Index:</span>
          </span>
          <span className={`font-mono font-bold ${data.healthSafetyScore < 65 ? 'text-amber-400' : 'text-emerald-300'}`}>
            {data.healthSafetyScore}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Thermal Work Limit:</span>
          </span>
          <span className={`font-mono font-bold ${data.thermalWorkLimit < minTwlLimit ? 'text-amber-400' : 'text-blue-300'}`}>
            {data.thermalWorkLimit} W/m²
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Skin Temperature:</span>
          </span>
          <span className="font-mono font-bold text-amber-300">
            {data.avgSkinTemp}°C (Amb: {data.ambientTemp}°C)
          </span>
        </div>
      </div>

      {data.thresholdDropReason && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-rose-300 font-mono">
          <strong>Alert:</strong> {data.thresholdDropReason}
        </div>
      )}
    </div>
  );
}

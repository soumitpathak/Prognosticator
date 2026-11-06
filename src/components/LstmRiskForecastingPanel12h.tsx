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
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  Zap,
  Flame,
  Activity,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Thermometer,
  Heart,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone, Lstm12hForecastResult, Lstm12hForecastHour } from '../types';
import { generateLstm12hForecast } from '../services/lstm12hForecastingService';

export interface LstmRiskForecastingPanel12hProps {
  alerts: ActiveAnomalyAlert[];
  selectedZone?: FacilityZone;
  onStageMitigation?: (forecast: Lstm12hForecastResult, targetHour: Lstm12hForecastHour) => void;
  className?: string;
}

export default function LstmRiskForecastingPanel12h({
  alerts,
  selectedZone,
  onStageMitigation,
  className = ''
}: LstmRiskForecastingPanel12hProps) {
  const [selectedScenario, setSelectedScenario] = useState<'BASELINE' | 'HEAT_SURGE' | 'MITIGATED'>('BASELINE');
  const [selectedHourOffset, setSelectedHourOffset] = useState<number | null>(null);
  const [mitigationNotice, setMitigationNotice] = useState<string | null>(null);

  // Generate 12-hour LSTM forecast
  const forecast: Lstm12hForecastResult = useMemo(() => {
    return generateLstm12hForecast(alerts, selectedZone, { scenario: selectedScenario });
  }, [alerts, selectedZone, selectedScenario]);

  // Selected hour object for deep inspection
  const selectedHour = useMemo(() => {
    if (!selectedHourOffset) {
      return forecast.hours.find((h) => h.isProjectedPeak) || forecast.hours[0];
    }
    return forecast.hours.find((h) => h.hourOffset === selectedHourOffset) || forecast.hours[0];
  }, [forecast.hours, selectedHourOffset]);

  const handleTriggerMitigation = () => {
    if (onStageMitigation) {
      onStageMitigation(forecast, selectedHour);
    }
    setMitigationNotice(
      `Pre-emptive mitigation protocol staged for ${selectedHour.timeLabel}: ${selectedHour.recommendedMitigation || 'Cooling stations and rotation protocols dispatched.'}`
    );
    setTimeout(() => setMitigationNotice(null), 6000);
  };

  // Custom Chart Tooltip
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: Lstm12hForecastHour = payload[0].payload;

    return (
      <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[260px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Forecast: {data.timeLabel}</span>
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
              data.projectedRiskScore >= 80
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                : data.projectedRiskScore >= 65
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}
          >
            {data.projectedRiskTier.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Projected Risk Score */}
        <div className="flex items-baseline justify-between mb-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-sans">LSTM Projected Risk:</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base font-bold font-mono ${
                data.projectedRiskScore >= 80
                  ? 'text-rose-400'
                  : data.projectedRiskScore >= 65
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {data.projectedRiskScore}%
            </span>
            <span className="text-[9px] text-slate-500">
              (±{((data.confidenceUpper - data.confidenceLower) / 2).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="space-y-1 text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">LSTM Reconstruction MSE:</span>
            <span className="font-mono text-cyan-300 font-bold">{data.reconstructionMse}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">Confidence Corridor:</span>
            <span className="font-mono text-slate-300">
              [{data.confidenceLower}% – {data.confidenceUpper}%]
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">Ambient Heat Projection:</span>
            <span className="font-mono text-amber-300">{data.ambientHeatForecastC}°C</span>
          </div>
        </div>

        {data.predictedThresholdBreach && (
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-rose-300">
            <strong>Breach:</strong> {data.predictedThresholdBreach}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="lstm-risk-forecasting-panel-12h"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3.5 mb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>12-Hour LSTM Predictive Risk Forecasting</span>
              </h2>
              <span className="text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                Autoencoder Simulation
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>Next 12h (+1h to +12h)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates multi-signal risk trajectory using temporal LSTM cell states, circadian cardiac fatigue, and diurnal microclimate heat loading.
            </p>
          </div>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-stretch sm:self-auto">
          <button
            onClick={() => setSelectedScenario('BASELINE')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
              selectedScenario === 'BASELINE'
                ? 'bg-purple-950 text-purple-200 border border-purple-500/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Current Trajectory</span>
          </button>
          <button
            onClick={() => setSelectedScenario('HEAT_SURGE')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
              selectedScenario === 'HEAT_SURGE'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-xs'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Heat Surge (+4°C)</span>
          </button>
          <button
            onClick={() => setSelectedScenario('MITIGATED')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
              selectedScenario === 'MITIGATED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-xs'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <ShieldAlert className="h-3 w-3 text-emerald-400" />
            <span>Mitigated Protocols</span>
          </button>
        </div>
      </div>

      {/* Mitigation Notice Banner */}
      {mitigationNotice && (
        <div className="mb-3.5 bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{mitigationNotice}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
            DISPATCHED
          </span>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Projected Peak Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
            <span>Projected Peak Risk</span>
            <span className="text-purple-400 font-bold">{forecast.peakTimeLabel}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                forecast.projectedPeakRisk >= 80
                  ? 'text-rose-400'
                  : forecast.projectedPeakRisk >= 65
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {forecast.projectedPeakRisk}%
            </span>
            <span className="text-[10px] font-mono text-rose-400">
              +{forecast.riskInflectionVelocity}% Spike
            </span>
          </div>
        </div>

        {/* Hours in High/Critical Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">High-Risk Exposure</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {forecast.hoursInHighOrCriticalRisk} Hours
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              of 12 Projected
            </span>
          </div>
        </div>

        {/* LSTM Model Certainty */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">LSTM Certainty Index</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {forecast.modelConfidenceIndex}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              State Covariance
            </span>
          </div>
        </div>

        {/* Baseline Live Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Live Baseline Starting</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-200">
              {forecast.baselineCurrentRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              T=0 Snapshot
            </span>
          </div>
        </div>
      </div>

      {/* Main 12-Hour LSTM Projection Chart */}
      <div className="w-full h-[250px] bg-slate-950/70 rounded-xl border border-slate-800 p-2 pt-3 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecast.hours}
            margin={{ top: 12, right: 20, left: -10, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const pt = state.activePayload[0].payload as Lstm12hForecastHour;
                setSelectedHourOffset(pt.hourOffset);
              }
            }}
          >
            <defs>
              <linearGradient id="lstmRiskArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
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

            <Tooltip content={<CustomForecastTooltip />} />

            {/* Critical Risk Reference (80%) */}
            <ReferenceLine
              y={80}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'CRITICAL THRESHOLD (80%)',
                fill: '#f43f5e',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopRight'
              }}
            />

            {/* Elevated Risk Reference (65%) */}
            <ReferenceLine
              y={65}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'ELEVATED RISK (65%)',
                fill: '#f59e0b',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopLeft'
              }}
            />

            {/* Confidence Corridor Fill */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="#a855f7"
              fillOpacity={0.1}
            />

            {/* Gradient Area under Projected Curve */}
            <Area
              type="monotone"
              dataKey="projectedRiskScore"
              stroke="none"
              fill="url(#lstmRiskArea)"
            />

            {/* Primary Projected Line */}
            <Line
              type="monotone"
              dataKey="projectedRiskScore"
              name="LSTM Projected Risk"
              stroke="#c084fc"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy || !payload) return null;
                const isPeak = payload.isProjectedPeak;
                const isSelected = selectedHourOffset === payload.hourOffset;

                return (
                  <g key={`dot-${payload.hourOffset}`}>
                    {isPeak && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="#f43f5e"
                        fillOpacity={0.4}
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isPeak ? 5.5 : isSelected ? 5 : 3.5}
                      fill={isPeak ? '#f43f5e' : isSelected ? '#a855f7' : '#c084fc'}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      className="cursor-pointer"
                    />
                  </g>
                );
              }}
              activeDot={{ r: 6.5, stroke: '#ffffff', strokeWidth: 2, fill: '#c084fc' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Forecast Timeline Strip */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-mono text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            Hourly Forecast Timeline (Click to Inspect / Stage Protocol)
          </span>
          <span className="text-[11px] text-purple-300 font-mono">
            {forecast.keyDriversSummary}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {forecast.hours.map((h) => {
            const isSelected = selectedHour.hourOffset === h.hourOffset;
            const isCritical = h.projectedRiskScore >= 80;
            const isHigh = h.projectedRiskScore >= 65 && !isCritical;

            return (
              <button
                key={h.hourOffset}
                onClick={() => setSelectedHourOffset(h.hourOffset)}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/90 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                    : isCritical
                    ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                    : isHigh
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-slate-400">+{h.hourOffset}h</span>
                  {h.isProjectedPeak && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" title="Projected Peak" />
                  )}
                </div>
                <div
                  className={`text-sm font-bold font-mono my-0.5 ${
                    isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  {h.projectedRiskScore}%
                </div>
                <div className="text-[9px] font-mono text-slate-500 truncate" title={h.absoluteTime}>
                  {h.absoluteTime}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Deep Inspection & Pre-Emptive Mitigation Staging Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div
            className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
              selectedHour.projectedRiskScore >= 80
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                : selectedHour.projectedRiskScore >= 65
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-400'
                : 'bg-purple-950/80 border-purple-500/60 text-purple-400'
            }`}
          >
            {selectedHour.projectedRiskScore >= 80 ? (
              <Flame className="h-5 w-5 animate-pulse" />
            ) : selectedHour.projectedRiskScore >= 65 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">
                Inspection Window: {selectedHour.timeLabel} ({selectedHour.absoluteTime})
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  selectedHour.projectedRiskScore >= 80
                    ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                    : selectedHour.projectedRiskScore >= 65
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                }`}
              >
                {selectedHour.projectedRiskTier.replace(/_/g, ' ')}
              </span>
              {selectedHour.isProjectedPeak && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-500">
                  PEAK RISK HOUR
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 font-mono text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500">Projected Risk:</span>{' '}
                <strong className="text-white">{selectedHour.projectedRiskScore}%</strong>
              </div>
              <div>
                <span className="text-slate-500">Reconstruction MSE:</span>{' '}
                <strong className="text-cyan-300">{selectedHour.reconstructionMse}</strong>
              </div>
              <div>
                <span className="text-slate-500">Ambient Forecast:</span>{' '}
                <strong className="text-amber-300">{selectedHour.ambientHeatForecastC}°C</strong>
              </div>
            </div>

            <p className="text-slate-300 mt-2 font-sans text-xs">
              <strong>Primary Driver:</strong> {selectedHour.primaryProjectedDriver}
            </p>

            {selectedHour.predictedThresholdBreach && (
              <p className="text-rose-300 mt-1 font-mono text-[11px]">
                <strong>Anticipated Breach:</strong> {selectedHour.predictedThresholdBreach}
              </p>
            )}
          </div>
        </div>

        {/* Pre-emptive Action Button */}
        <div className="shrink-0 w-full md:w-auto flex flex-col items-end gap-1.5">
          <button
            onClick={handleTriggerMitigation}
            className="w-full md:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            title="Stage pre-emptive cooling, hydration stations, or maintenance order prior to projected peak"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Stage Pre-Emptive Mitigation ({selectedHour.timeLabel})</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono text-center md:text-right">
            Dispatches automated hydration stations &amp; shaded rest rotations
          </span>
        </div>
      </div>
    </div>
  );
}

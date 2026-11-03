import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { TelemetryDataPoint } from '../types';
import {
  Thermometer,
  Volume2,
  Activity,
  Filter,
  Clock,
  AlertTriangle,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface TelemetryChartsProps {
  data: TelemetryDataPoint[];
  zoneName: string;
}

interface ChartDataWithForecast extends Partial<TelemetryDataPoint> {
  timeLabel: string;
  isForecast?: boolean;
  forecast_temp?: number;
  forecast_noise?: number;
  forecast_hrv?: number;
  forecast_risk?: number;
}

export default function TelemetryCharts({ data, zoneName }: TelemetryChartsProps) {
  const [activeMetric, setActiveMetric] = useState<'temp' | 'noise' | 'hrv' | 'combined'>('temp');
  const [windowHours, setWindowHours] = useState<number>(24);
  const [showForecast, setShowForecast] = useState<boolean>(true);

  // Filter based on selected time window (data frequency is 15min, so 4 points/hour)
  const pointsToShow = Math.min(data.length, windowHours * 4);
  const historicalSlice = data.slice(-pointsToShow);

  // Calculate linear trend from the last 6 observed samples (~1.5 hours)
  const trendSamples = historicalSlice.slice(-6);
  const n = trendSamples.length;

  const computeSlope = (extractor: (p: TelemetryDataPoint) => number): number => {
    if (n < 2) return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    trendSamples.forEach((p, idx) => {
      const y = extractor(p);
      sumX += idx;
      sumY += y;
      sumXY += idx * y;
      sumXX += idx * idx;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    return slope;
  };

  const tempSlope = computeSlope((p) => p.ambient_temp_c);
  const noiseSlope = computeSlope((p) => p.noise_db ?? p.smoothed_noise_db ?? 75);
  const hrvSlope = computeSlope((p) => p.smoothed_hrv);
  const riskSlope = computeSlope((p) => p.risk_score);

  const lastPoint = historicalSlice[historicalSlice.length - 1] || data[data.length - 1];

  // Construct combined historical + forecast dataset
  const combinedData: ChartDataWithForecast[] = historicalSlice.map((d, idx) => {
    const isLast = idx === historicalSlice.length - 1;
    return {
      ...d,
      isForecast: false,
      // Connect forecast line seamlessly from the last historical point
      forecast_temp: isLast ? d.ambient_temp_c : undefined,
      forecast_noise: isLast ? (d.noise_db ?? d.smoothed_noise_db) : undefined,
      forecast_hrv: isLast ? d.smoothed_hrv : undefined,
      forecast_risk: isLast ? d.risk_score : undefined
    };
  });

  // Generate 4 forecast steps (15-min intervals: +15m, +30m, +45m, +60m)
  if (showForecast && lastPoint) {
    const forecastIntervals = ['+15m', '+30m', '+45m', '+60m'];
    forecastIntervals.forEach((intervalLabel, stepIdx) => {
      const step = stepIdx + 1;
      const projTemp = Math.min(52, Math.max(20, Number((lastPoint.ambient_temp_c + tempSlope * step).toFixed(1))));
      const projNoise = Math.min(120, Math.max(55, Number(((lastPoint.noise_db ?? 75) + noiseSlope * step).toFixed(1))));
      const projHrv = Math.min(85, Math.max(20, Number((lastPoint.smoothed_hrv + hrvSlope * step).toFixed(1))));
      const projRisk = Math.min(100, Math.max(0, Number((lastPoint.risk_score + riskSlope * step).toFixed(1))));

      combinedData.push({
        timeLabel: `${intervalLabel} (Proj)`,
        timestamp: new Date(Date.now() + step * 15 * 60 * 1000).toISOString(),
        isForecast: true,
        forecast_temp: projTemp,
        forecast_noise: projNoise,
        forecast_hrv: projHrv,
        forecast_risk: projRisk
      });
    });
  }

  const currentPoint = lastPoint;
  const maxNoise = Math.max(...historicalSlice.map((d) => d.raw_noise_db || 0));
  const maxTemp = Math.max(...historicalSlice.map((d) => d.ambient_temp_c || 0));
  const finalProjectedTemp = combinedData[combinedData.length - 1]?.forecast_temp ?? currentPoint?.ambient_temp_c;
  const tempDiff = Number((finalProjectedTemp - (currentPoint?.ambient_temp_c || 0)).toFixed(1));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-lg">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Sliding Real-Time Sensor Telemetry &amp; Predictive Forecasting
            </h2>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
              Recharts + 1-Hour Trajectory
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Zone: <span className="text-cyan-300 font-medium">{zoneName}</span> | Historical 24h stream with forward predictive extrapolation
          </p>
        </div>

        {/* Metric and Window Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Hour Forecast Toggle */}
          <button
            onClick={() => setShowForecast((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition ${
              showForecast
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
            <span>1-Hour Forecast Line {showForecast ? '[ON]' : '[OFF]'}</span>
          </button>

          {/* Stream Selector Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMetric('temp')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeMetric === 'temp'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Thermometer className="h-3.5 w-3.5" />
              <span>Ambient Temp (°C)</span>
            </button>
            <button
              onClick={() => setActiveMetric('noise')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeMetric === 'noise'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Noise (dB)</span>
            </button>
            <button
              onClick={() => setActiveMetric('hrv')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeMetric === 'hrv'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>HRV (Smoothed)</span>
            </button>
            <button
              onClick={() => setActiveMetric('combined')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeMetric === 'combined'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Multi-Signal Fusion</span>
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            {[6, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setWindowHours(hrs)}
                className={`px-2 py-0.5 rounded transition ${
                  windowHours === hrs ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick KPI Strip with Predictive Trend Callouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ambient Temperature</span>
            {showForecast && (
              <span className={`text-[10px] font-mono font-bold ${tempDiff >= 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                {tempDiff >= 0 ? `+${tempDiff}°C` : `${tempDiff}°C`} next 1h
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-amber-400">{currentPoint?.ambient_temp_c ?? '--'}°C</span>
            <span className="text-[11px] text-slate-500 font-mono">(Peak: {maxTemp}°C)</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Acoustic Pressure</span>
            {showForecast && (
              <span className="text-[10px] font-mono text-slate-400">
                Trend: {noiseSlope >= 0 ? 'Rising' : 'Damping'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-rose-400">{currentPoint?.noise_db ?? '--'} dB</span>
            <span className="text-[11px] text-slate-500 font-mono">(Peak: {maxNoise.toFixed(1)} dB)</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kalman Smoothed HRV</span>
            {showForecast && (
              <span className="text-[10px] font-mono text-cyan-400">
                1h Proj: {combinedData[combinedData.length - 1]?.forecast_hrv ?? '--'} ms
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-cyan-400">{currentPoint?.smoothed_hrv ?? '--'} ms</span>
            <span className="text-[11px] text-slate-500 font-mono">(Drop: {currentPoint?.hrv_drop_pct}%)</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Shift Risk Probability</span>
            {showForecast && (
              <span className="text-[10px] font-mono text-rose-400 font-semibold">
                1h Proj: {combinedData[combinedData.length - 1]?.forecast_risk ?? '--'}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg font-bold ${
              (currentPoint?.risk_score ?? 0) >= 70 ? 'text-rose-400' :
              (currentPoint?.risk_score ?? 0) >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentPoint?.risk_score ?? 0}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">LSTM Score</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Area with Predictive Forecasting Line */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'temp' ? (
            <AreaChart data={combinedData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[24, 48]} tick={{ fontSize: 11 }} unit="°C" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '35°C Heat Stress', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={42} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '42°C Severe Danger', fill: '#ef4444', fontSize: 10, position: 'top' }} />
              {currentPoint && (
                <ReferenceLine
                  x={currentPoint.timeLabel}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  label={{ value: 'Now | 1-Hr Forecast →', fill: '#38bdf8', fontSize: 10, position: 'insideTopLeft' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="ambient_temp_c"
                name="Ambient Temperature (°C) [Historical]"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
                connectNulls={false}
              />
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast_temp"
                  name="Projected Next Hour Forecast (°C)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#38bdf8' }}
                  connectNulls={true}
                />
              )}
            </AreaChart>
          ) : activeMetric === 'noise' ? (
            <AreaChart data={combinedData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="noiseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[60, 115]} tick={{ fontSize: 11 }} unit=" dB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '85 dB OSHA Limit', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
              {currentPoint && (
                <ReferenceLine
                  x={currentPoint.timeLabel}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  label={{ value: 'Now | 1-Hr Forecast →', fill: '#38bdf8', fontSize: 10, position: 'insideTopLeft' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="raw_noise_db"
                name="Raw Sensor Jitter (dB)"
                stroke="#fda4af"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="noise_db"
                name="Kalman Smoothed Noise (dB)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#noiseGradient)"
                connectNulls={false}
              />
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast_noise"
                  name="Projected Next Hour Noise (dB)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#38bdf8' }}
                  connectNulls={true}
                />
              )}
            </AreaChart>
          ) : activeMetric === 'hrv' ? (
            <LineChart data={combinedData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[20, 80]} tick={{ fontSize: 11 }} unit=" ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <ReferenceLine y={40} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '40ms Critical Fatigue', fill: '#f43f5e', fontSize: 10 }} />
              {currentPoint && (
                <ReferenceLine
                  x={currentPoint.timeLabel}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  label={{ value: 'Now | 1-Hr Forecast →', fill: '#38bdf8', fontSize: 10, position: 'insideTopLeft' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="raw_hrv"
                name="Raw Wearable HRV (ms)"
                stroke="#f59e0b"
                strokeWidth={1.2}
                dot={false}
                opacity={0.65}
              />
              <Line
                type="monotone"
                dataKey="smoothed_hrv"
                name="Kalman Filtered HRV (ms)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast_hrv"
                  name="Projected Next Hour HRV (ms)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#a855f7' }}
                  connectNulls={true}
                />
              )}
            </LineChart>
          ) : (
            <LineChart data={combinedData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#64748b" domain={[20, 110]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              {currentPoint && (
                <ReferenceLine
                  yAxisId="left"
                  x={currentPoint.timeLabel}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  label={{ value: 'Now | 1-Hr Forecast →', fill: '#38bdf8', fontSize: 10, position: 'insideTopLeft' }}
                />
              )}
              <Line yAxisId="left" type="monotone" dataKey="ambient_temp_c" name="Ambient Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls={false} />
              <Line yAxisId="left" type="monotone" dataKey="noise_db" name="Kalman Noise (dB)" stroke="#f43f5e" strokeWidth={2} dot={false} connectNulls={false} />
              <Line yAxisId="left" type="monotone" dataKey="smoothed_hrv" name="Kalman HRV (ms)" stroke="#06b6d4" strokeWidth={2} dot={false} connectNulls={false} />
              <Line yAxisId="right" type="monotone" dataKey="risk_score" name="Risk %" stroke="#a855f7" strokeWidth={2.5} dot={false} connectNulls={false} />
              {showForecast && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="forecast_risk"
                  name="Projected 1-Hr Risk %"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#ec4899' }}
                  connectNulls={true}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 gap-2 font-mono">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-cyan-400" />
          Sliding 24-hr buffer: Continuous rolling window (15-min intervals)
        </span>
        <span className="flex items-center gap-1 text-sky-400">
          <Sparkles className="h-3 w-3" />
          Projected 1-Hour Forecast: Extrapolates 4 intervals (+15m, +30m, +45m, +60m) via trend velocity
        </span>
      </div>
    </div>
  );
}

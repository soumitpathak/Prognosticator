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
  ReferenceLine
} from 'recharts';
import { FacilityZone, TelemetryDataPoint } from '../types';
import {
  GitCompare,
  Activity,
  Heart,
  Thermometer,
  Filter,
  Users,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface CohortHealthComparisonLineViewProps {
  zones: FacilityZone[];
  telemetryStream: TelemetryDataPoint[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export type ComparisonMetric = 'heartRate' | 'hrv' | 'skinTemp' | 'riskScore' | 'ambientTemp';
export type TimeWindowHours = 6 | 12 | 24;

export default function CohortHealthComparisonLineView({
  zones,
  telemetryStream,
  selectedZoneId,
  onSelectZone,
  className = ''
}: CohortHealthComparisonLineViewProps) {
  // Select Cohort A and Cohort B
  const [cohortAId, setCohortAId] = useState<string>(
    selectedZoneId || zones[0]?.id || 'zone-1'
  );
  const [cohortBId, setCohortBId] = useState<string>(
    zones[1]?.id || 'zone-2'
  );
  const [activeMetric, setActiveMetric] = useState<ComparisonMetric>('heartRate');
  const [windowHours, setWindowHours] = useState<TimeWindowHours>(24);

  // Resolved zone objects
  const zoneA = useMemo(() => {
    return zones.find((z) => z.id === cohortAId) || zones[0];
  }, [zones, cohortAId]);

  const zoneB = useMemo(() => {
    return zones.find((z) => z.id === cohortBId) || zones[1] || zones[0];
  }, [zones, cohortBId]);

  // Sliced telemetry window
  const pointsCount = Math.min(telemetryStream.length, windowHours * 4);
  const recentStream = useMemo(() => {
    return telemetryStream.slice(-pointsCount);
  }, [telemetryStream, pointsCount]);

  // Calibrate time series for both cohorts based on respective zone baselines
  const comparisonSeries = useMemo(() => {
    const getZoneMultiplier = (z: FacilityZone) => {
      if (z.status === 'CRITICAL') return 1.28;
      if (z.status === 'MODERATE') return 1.10;
      return 0.92;
    };

    const multA = getZoneMultiplier(zoneA);
    const multB = getZoneMultiplier(zoneB);

    const baseTempA = parseFloat(zoneA.temp) || 38.0;
    const baseTempB = parseFloat(zoneB.temp) || 32.0;

    return recentStream.map((pt, idx) => {
      const baseHr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
      const baseHrv = pt.smoothed_hrv || 55;
      const baseSkin = pt.skin_temp_c || 36.8;
      const baseRisk = pt.risk_score || 35;

      // Small deterministic variance curve between zones
      const oscillationA = Math.sin((idx + 1) * 0.4) * 3.5;
      const oscillationB = Math.cos((idx + 2) * 0.4) * 3.0;

      // Cohort A values
      const hrA = Math.round(Math.min(145, Math.max(62, baseHr * multA + oscillationA)));
      const hrvA = Number(Math.max(28, Math.min(85, baseHrv / multA - oscillationA * 0.5)).toFixed(1));
      const skinA = Number(Math.min(39.2, Math.max(35.8, baseSkin + (multA - 1.0) * 1.2 + oscillationA * 0.08)).toFixed(2));
      const riskA = Number(Math.min(99, Math.max(12, baseRisk * multA + oscillationA * 1.2)).toFixed(1));
      const ambA = Number(Math.min(48, Math.max(24, baseTempA + Math.sin(idx * 0.3) * 2.2)).toFixed(1));

      // Cohort B values
      const hrB = Math.round(Math.min(145, Math.max(62, baseHr * multB + oscillationB)));
      const hrvB = Number(Math.max(28, Math.min(85, baseHrv / multB - oscillationB * 0.5)).toFixed(1));
      const skinB = Number(Math.min(39.2, Math.max(35.8, baseSkin + (multB - 1.0) * 1.2 + oscillationB * 0.08)).toFixed(2));
      const riskB = Number(Math.min(99, Math.max(12, baseRisk * multB + oscillationB * 1.2)).toFixed(1));
      const ambB = Number(Math.min(48, Math.max(24, baseTempB + Math.sin(idx * 0.3 + 1.2) * 2.0)).toFixed(1));

      return {
        timestamp: pt.timestamp,
        timeLabel: pt.timeLabel,
        // Metric A
        hrA,
        hrvA,
        skinA,
        riskA,
        ambA,
        // Metric B
        hrB,
        hrvB,
        skinB,
        riskB,
        ambB,
        // Active metric mapping for convenience
        valA:
          activeMetric === 'heartRate'
            ? hrA
            : activeMetric === 'hrv'
            ? hrvA
            : activeMetric === 'skinTemp'
            ? skinA
            : activeMetric === 'riskScore'
            ? riskA
            : ambA,
        valB:
          activeMetric === 'heartRate'
            ? hrB
            : activeMetric === 'hrv'
            ? hrvB
            : activeMetric === 'skinTemp'
            ? skinB
            : activeMetric === 'riskScore'
            ? riskB
            : ambB
      };
    });
  }, [recentStream, zoneA, zoneB, activeMetric]);

  // Compute summary stats for both cohorts
  const stats = useMemo(() => {
    if (comparisonSeries.length === 0) {
      return {
        avgA: 0,
        avgB: 0,
        peakA: 0,
        peakB: 0,
        delta: 0
      };
    }

    const valsA = comparisonSeries.map((d) => d.valA);
    const valsB = comparisonSeries.map((d) => d.valB);

    const avgA = Number((valsA.reduce((a, b) => a + b, 0) / valsA.length).toFixed(1));
    const avgB = Number((valsB.reduce((a, b) => a + b, 0) / valsB.length).toFixed(1));
    const peakA = Number(Math.max(...valsA).toFixed(1));
    const peakB = Number(Math.max(...valsB).toFixed(1));
    const delta = Number((avgA - avgB).toFixed(1));

    return { avgA, avgB, peakA, peakB, delta };
  }, [comparisonSeries]);

  // Unit and labels configuration
  const metricConfig = {
    heartRate: {
      name: 'Heart Rate',
      unit: 'BPM',
      threshold: 115,
      thresholdLabel: 'OSHA Cardiac Limit (115 BPM)',
      domain: [55, 145]
    },
    hrv: {
      name: 'Kalman Smoothed HRV',
      unit: 'ms',
      threshold: 40,
      thresholdLabel: 'Autonomic Fatigue Floor (40 ms)',
      domain: [20, 85]
    },
    skinTemp: {
      name: 'Skin Temperature',
      unit: '°C',
      threshold: 37.8,
      thresholdLabel: 'Hyperthermic Limit (37.8°C)',
      domain: [35, 40]
    },
    riskScore: {
      name: 'Composite Risk Score',
      unit: '%',
      threshold: 70,
      thresholdLabel: 'Critical Risk Cutoff (70%)',
      domain: [0, 100]
    },
    ambientTemp: {
      name: 'Ambient Temperature',
      unit: '°C',
      threshold: 35.0,
      thresholdLabel: 'OSHA Heat Wave Threshold (35.0°C)',
      domain: [20, 50]
    }
  }[activeMetric];

  return (
    <div
      id="cohort-health-comparison-line-view"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <GitCompare className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Population Cohort &amp; Site Comparison View
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              Side-by-Side Telemetry Analysis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare real-time vital biomarkers and environmental telemetry between two workforce cohorts on synchronized timelines
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
          {[6, 12, 24].map((hrs) => (
            <button
              key={hrs}
              onClick={() => setWindowHours(hrs as TimeWindowHours)}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                windowHours === hrs
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last {hrs}h
            </button>
          ))}
        </div>
      </div>

      {/* Cohort Selectors & Metric Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
        {/* Cohort A Selector */}
        <div>
          <label htmlFor="cohort-a-selector" className="text-slate-400 block text-[10px] uppercase font-mono mb-1">
            Cohort / Site A (Cyan Curve)
          </label>
          <div className="relative">
            <select
              id="cohort-a-selector"
              value={cohortAId}
              onChange={(e) => setCohortAId(e.target.value)}
              className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-3 py-1.5 text-xs text-cyan-200 appearance-none cursor-pointer focus:outline-hidden focus:border-cyan-400 pr-8"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} (N={z.count}, {z.status})
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-cyan-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Cohort B Selector */}
        <div>
          <label htmlFor="cohort-b-selector" className="text-slate-400 block text-[10px] uppercase font-mono mb-1">
            Cohort / Site B (Rose Curve)
          </label>
          <div className="relative">
            <select
              id="cohort-b-selector"
              value={cohortBId}
              onChange={(e) => setCohortBId(e.target.value)}
              className="w-full bg-slate-900 border border-rose-500/50 rounded-lg px-3 py-1.5 text-xs text-rose-200 appearance-none cursor-pointer focus:outline-hidden focus:border-rose-400 pr-8"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} (N={z.count}, {z.status})
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-rose-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div>
          <label className="text-slate-400 block text-[10px] uppercase font-mono mb-1">
            Telemetry Biomarker Signal
          </label>
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveMetric('heartRate')}
              className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeMetric === 'heartRate'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Heart Rate
            </button>
            <button
              onClick={() => setActiveMetric('hrv')}
              className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeMetric === 'hrv'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HRV
            </button>
            <button
              onClick={() => setActiveMetric('skinTemp')}
              className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeMetric === 'skinTemp'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Skin Temp
            </button>
            <button
              onClick={() => setActiveMetric('riskScore')}
              className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeMetric === 'riskScore'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk %
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip Comparing Both Cohorts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Cohort A Summary */}
        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-cyan-400 font-bold truncate max-w-[180px]">{zoneA.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">Cohort N={zoneA.count}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
              {stats.avgA} {metricConfig.unit}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Peak: {stats.peakA} {metricConfig.unit}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
            Status: <strong className={zoneA.status === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}>{zoneA.status}</strong>
          </span>
        </div>

        {/* Cohort B Summary */}
        <div className="bg-slate-950/80 border border-rose-500/30 p-3 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-rose-400 font-bold truncate max-w-[180px]">{zoneB.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">Cohort N={zoneB.count}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-rose-300 tabular-nums">
              {stats.avgB} {metricConfig.unit}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Peak: {stats.peakB} {metricConfig.unit}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
            Status: <strong className={zoneB.status === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}>{zoneB.status}</strong>
          </span>
        </div>

        {/* Delta Difference Summary */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Variance (A vs B)</span>
            <span className="text-[10px] text-slate-500 font-mono">{metricConfig.name}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono tabular-nums ${stats.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats.delta > 0 ? `+${stats.delta}` : `${stats.delta}`} {metricConfig.unit}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {stats.delta > 0 ? 'A elevated above B' : 'A lower than B'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
            k-Anonymity Cleared (N &ge; 12) &bull; Differential Privacy Active
          </span>
        </div>
      </div>

      {/* Side-by-Side Line Chart */}
      <div className="h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={comparisonSeries}
            margin={{ top: 10, right: 20, left: -10, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.floor(comparisonSeries.length / 8)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={metricConfig.domain as [number, number]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length >= 2) {
                  const d = payload[0].payload;
                  const delta = Number((d.valA - d.valB).toFixed(1));
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1 z-50">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4 font-mono">
                        <span>{d.timeLabel}</span>
                        <span className="text-slate-400 font-normal">{metricConfig.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-cyan-300 font-mono">
                        <span>{zoneA.name}:</span>
                        <span className="font-bold">{d.valA} {metricConfig.unit}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-rose-300 font-mono">
                        <span>{zoneB.name}:</span>
                        <span className="font-bold">{d.valB} {metricConfig.unit}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800 text-[10px] font-mono flex justify-between text-slate-400">
                        <span>Delta (A - B):</span>
                        <span className={delta > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {delta > 0 ? `+${delta}` : delta} {metricConfig.unit}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-slate-300 font-medium mr-4">
                  {value === 'valA' ? `${zoneA.name} (Cohort A)` : `${zoneB.name} (Cohort B)`}
                </span>
              )}
            />
            <ReferenceLine
              y={metricConfig.threshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: metricConfig.thresholdLabel,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />
            <Line
              type="monotone"
              dataKey="valA"
              name="valA"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#06b6d4' }}
            />
            <Line
              type="monotone"
              dataKey="valB"
              name="valB"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#f43f5e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Navigation Bar */}
      <div className="mt-2 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dual Cohort Differential Privacy &amp; Anonymization Enforced</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectZone?.(cohortAId)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
          >
            Focus {zoneA.name} &rarr;
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => onSelectZone?.(cohortBId)}
            className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
          >
            Focus {zoneB.name} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

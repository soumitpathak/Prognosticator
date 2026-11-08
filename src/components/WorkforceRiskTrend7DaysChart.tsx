import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Activity,
  Flame,
  Filter,
  RotateCcw,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Zap,
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  WhatIfParameters,
  DEFAULT_WHAT_IF_PARAMETERS,
  recalculateTrendWithWhatIf,
  calculateWhatIfImpact
} from '../services/whatIfSimulationEngine';
import WhatIfSimulatorPanel from './WhatIfSimulatorPanel';

export interface DayRiskPoint {
  isoDate: string; // YYYY-MM-DD
  date: string;
  dayName: string;
  fullDate: string;
  avgRiskScore: number;
  peakRiskScore: number;
  anomalyCount: number;
  criticalCount: number;
  isSpike: boolean;
  spikeReason?: string;
  primaryZone: string;
  peakTime: string;
}

export const EXTENDED_RISK_DATA: DayRiskPoint[] = [
  {
    isoDate: '2026-10-24',
    date: 'Sat 10/24',
    dayName: 'Saturday',
    fullDate: 'October 24, 2026',
    avgRiskScore: 16.2,
    peakRiskScore: 28.5,
    anomalyCount: 1,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Manufacturing Assembly Line B',
    peakTime: '10:40'
  },
  {
    isoDate: '2026-10-25',
    date: 'Sun 10/25',
    dayName: 'Sunday',
    fullDate: 'October 25, 2026',
    avgRiskScore: 15.0,
    peakRiskScore: 26.0,
    anomalyCount: 1,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Warehouse Logistics Hub North',
    peakTime: '11:15'
  },
  {
    isoDate: '2026-10-26',
    date: 'Mon 10/26',
    dayName: 'Monday',
    fullDate: 'October 26, 2026',
    avgRiskScore: 22.4,
    peakRiskScore: 41.2,
    anomalyCount: 3,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '13:30'
  },
  {
    isoDate: '2026-10-27',
    date: 'Tue 10/27',
    dayName: 'Tuesday',
    fullDate: 'October 27, 2026',
    avgRiskScore: 24.1,
    peakRiskScore: 46.8,
    anomalyCount: 4,
    criticalCount: 1,
    isSpike: false,
    primaryZone: 'Tunnel Complex Conduit 7',
    peakTime: '14:00'
  },
  {
    isoDate: '2026-10-28',
    date: 'Wed 10/28',
    dayName: 'Wednesday',
    fullDate: 'October 28, 2026',
    avgRiskScore: 35.8,
    peakRiskScore: 66.2,
    anomalyCount: 7,
    criticalCount: 2,
    isSpike: true,
    spikeReason: 'Sudden ambient heat surge & hydraulic pump cavitation',
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '15:20'
  },
  {
    isoDate: '2026-10-29',
    date: 'Thu 10/29',
    dayName: 'Thursday',
    fullDate: 'October 29, 2026',
    avgRiskScore: 30.2,
    peakRiskScore: 52.4,
    anomalyCount: 4,
    criticalCount: 1,
    isSpike: false,
    primaryZone: 'Manufacturing Assembly Line B',
    peakTime: '13:45'
  },
  {
    isoDate: '2026-10-30',
    date: 'Fri 10/30',
    dayName: 'Friday',
    fullDate: 'October 30, 2026',
    avgRiskScore: 21.0,
    peakRiskScore: 38.0,
    anomalyCount: 2,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Warehouse Logistics Hub North',
    peakTime: '12:10'
  },
  // Default 7-day window starts here (Oct 31 to Nov 6)
  {
    isoDate: '2026-10-31',
    date: 'Sat 10/31',
    dayName: 'Saturday',
    fullDate: 'October 31, 2026',
    avgRiskScore: 19.4,
    peakRiskScore: 34.2,
    anomalyCount: 2,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Warehouse Logistics Hub North',
    peakTime: '14:20'
  },
  {
    isoDate: '2026-11-01',
    date: 'Sun 11/01',
    dayName: 'Sunday',
    fullDate: 'November 1, 2026',
    avgRiskScore: 17.8,
    peakRiskScore: 31.0,
    anomalyCount: 1,
    criticalCount: 0,
    isSpike: false,
    primaryZone: 'Manufacturing Assembly Line B',
    peakTime: '11:15'
  },
  {
    isoDate: '2026-11-02',
    date: 'Mon 11/02',
    dayName: 'Monday',
    fullDate: 'November 2, 2026',
    avgRiskScore: 28.5,
    peakRiskScore: 54.0,
    anomalyCount: 5,
    criticalCount: 1,
    isSpike: false,
    primaryZone: 'Tunnel Complex Conduit 7',
    peakTime: '15:10'
  },
  {
    isoDate: '2026-11-03',
    date: 'Tue 11/03',
    dayName: 'Tuesday',
    fullDate: 'November 3, 2026',
    avgRiskScore: 38.2,
    peakRiskScore: 68.5,
    anomalyCount: 8,
    criticalCount: 2,
    isSpike: true,
    spikeReason: 'Wet-bulb heat index spike & heavy conveyor motor vibration',
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '14:45'
  },
  {
    isoDate: '2026-11-04',
    date: 'Wed 11/04',
    dayName: 'Wednesday',
    fullDate: 'November 4, 2026',
    avgRiskScore: 52.6,
    peakRiskScore: 84.8,
    anomalyCount: 14,
    criticalCount: 4,
    isSpike: true,
    spikeReason: 'Diurnal solar thermal runaway (44.8°C) + acoustic breach (104.8 dB)',
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '14:15'
  },
  {
    isoDate: '2026-11-05',
    date: 'Thu 11/05',
    dayName: 'Thursday',
    fullDate: 'November 5, 2026',
    avgRiskScore: 44.1,
    peakRiskScore: 76.2,
    anomalyCount: 11,
    criticalCount: 3,
    isSpike: true,
    spikeReason: 'Autonomic vagal tone depletion & conveyor roller cage friction',
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '13:50'
  },
  {
    isoDate: '2026-11-06',
    date: 'Fri 11/06',
    dayName: 'Friday (Today)',
    fullDate: 'November 6, 2026',
    avgRiskScore: 28.4,
    peakRiskScore: 64.5,
    anomalyCount: 7,
    criticalCount: 2,
    isSpike: false,
    spikeReason: 'Active cooling mitigations staged; thermal index stabilizing',
    primaryZone: 'Outdoor Construction Sector 4',
    peakTime: '12:30'
  }
];

export interface WorkforceRiskTrend7DaysChartProps {
  className?: string;
  onSelectDay?: (day: DayRiskPoint) => void;
  whatIfParams?: WhatIfParameters;
  onUpdateWhatIfParams?: (params: WhatIfParameters) => void;
  isWhatIfOpen?: boolean;
  onToggleWhatIfOpen?: () => void;
  theme?: 'dark' | 'high-contrast-light';
  showMovingAverage?: boolean;
  onToggleMovingAverage?: (active?: boolean) => void;
}

export interface EnrichedRiskPoint extends DayRiskPoint {
  isForecast?: boolean;
  forecastUpper?: number;
  forecastLower?: number;
  uncertaintyMargin?: number;
  // What-If simulated dynamic fields
  simulatedPeakRiskScore?: number;
  simulatedAvgRiskScore?: number;
  simulatedForecastUpper?: number;
  simulatedForecastLower?: number;
  simulatedUncertaintyMargin?: number;
  simulatedIsSpike?: boolean;
  simulatedAnomalyCount?: number;
  simulatedCriticalCount?: number;
  riskDelta?: number;
  // Historical Moving Average fields
  ma3d_avgRisk?: number;
  ma3d_peakRisk?: number;
  maDegradationDelta?: number;
}

export default function WorkforceRiskTrend7DaysChart({
  className = '',
  onSelectDay,
  whatIfParams: propWhatIfParams,
  onUpdateWhatIfParams,
  isWhatIfOpen: propIsWhatIfOpen,
  onToggleWhatIfOpen,
  theme = 'dark',
  showMovingAverage: propShowMovingAverage,
  onToggleMovingAverage
}: WorkforceRiskTrend7DaysChartProps) {
  // Date Range Filtering State (Default: Last 7 Days: 2026-10-31 to 2026-11-06)
  const [startDate, setStartDate] = useState<string>('2026-10-31');
  const [endDate, setEndDate] = useState<string>('2026-11-06');
  const [activePreset, setActivePreset] = useState<'7d' | '3d' | 'surge' | '14d' | 'custom'>('7d');
  const [viewMetric, setViewMetric] = useState<'both' | 'peak' | 'avg'>('both');
  const [selectedDay, setSelectedDay] = useState<DayRiskPoint | null>(EXTENDED_RISK_DATA[EXTENDED_RISK_DATA.length - 1]);

  // Prediction Uncertainty & Confidence Interval Band State
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showForecastHorizon, setShowForecastHorizon] = useState<boolean>(true);
  const [confidenceLevel, setConfidenceLevel] = useState<90 | 95 | 99>(95);

  // What-If Simulator State (supports internal or controlled props)
  const [internalWhatIfParams, setInternalWhatIfParams] = useState<WhatIfParameters>(DEFAULT_WHAT_IF_PARAMETERS);
  const [internalIsWhatIfOpen, setInternalIsWhatIfOpen] = useState<boolean>(false);
  const [compareWithBaseline, setCompareWithBaseline] = useState<boolean>(true);

  const activeWhatIfParams = propWhatIfParams ?? internalWhatIfParams;
  const isSimulatorOpen = propIsWhatIfOpen ?? internalIsWhatIfOpen;

  const handleParamsChange = (newParams: WhatIfParameters) => {
    if (onUpdateWhatIfParams) {
      onUpdateWhatIfParams(newParams);
    } else {
      setInternalWhatIfParams(newParams);
    }
  };

  const handleToggleSimulator = () => {
    if (onToggleWhatIfOpen) {
      onToggleWhatIfOpen();
    } else {
      setInternalIsWhatIfOpen((prev) => !prev);
    }
  };

  // Compute live What-If impact summary metrics
  const whatIfImpact = useMemo(() => {
    return calculateWhatIfImpact(activeWhatIfParams);
  }, [activeWhatIfParams]);

  // Apply custom date range filter to the risk trend data
  const filteredData = useMemo(() => {
    const list = EXTENDED_RISK_DATA.filter(
      (item) => item.isoDate >= startDate && item.isoDate <= endDate
    );
    return list.length > 0 ? list : EXTENDED_RISK_DATA.slice(-7);
  }, [startDate, endDate]);

  // Moving Average Overlay State (helps safety managers identify long-term degradation trajectories)
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(
    propShowMovingAverage !== undefined ? propShowMovingAverage : true
  );

  useEffect(() => {
    if (propShowMovingAverage !== undefined) {
      setShowMovingAverage(propShowMovingAverage);
    }
  }, [propShowMovingAverage]);

  const effectiveShowMA = propShowMovingAverage !== undefined ? propShowMovingAverage : showMovingAverage;

  // Combined Dataset: Historical Points + Dynamic 72h Forward Forecast with 95% Confidence Interval Band & Real-Time What-If Recalculations
  const chartData: EnrichedRiskPoint[] = useMemo(() => {
    const raw = recalculateTrendWithWhatIf(
      filteredData,
      activeWhatIfParams,
      confidenceLevel,
      showForecastHorizon
    );

    // Compute 3-day rolling moving averages to expose degradation trends
    return raw.map((d, idx, arr) => {
      const windowPoints = 3;
      const startIdx = Math.max(0, idx - windowPoints + 1);
      const sub = arr.slice(startIdx, idx + 1);
      const maAvg = Number((sub.reduce((acc, p) => acc + (p.simulatedAvgRiskScore ?? p.avgRiskScore), 0) / sub.length).toFixed(1));
      const maPeak = Number((sub.reduce((acc, p) => acc + (p.simulatedPeakRiskScore ?? p.peakRiskScore), 0) / sub.length).toFixed(1));
      const delta = Number(((d.simulatedAvgRiskScore ?? d.avgRiskScore) - maAvg).toFixed(1));
      return {
        ...d,
        ma3d_avgRisk: maAvg,
        ma3d_peakRisk: maPeak,
        maDegradationDelta: delta
      };
    });
  }, [filteredData, activeWhatIfParams, confidenceLevel, showForecastHorizon]);

  const spikesCount = useMemo(() => {
    return chartData.filter((d) => (activeWhatIfParams.isSimulationActive ? d.simulatedIsSpike : d.isSpike)).length;
  }, [chartData, activeWhatIfParams.isSimulationActive]);

  const highestSpikeDay = useMemo(() => {
    return [...filteredData].sort((a, b) => b.peakRiskScore - a.peakRiskScore)[0] || filteredData[0];
  }, [filteredData]);

  const averageRiskScoreInRange = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, d) => acc + d.avgRiskScore, 0);
    return Number((sum / filteredData.length).toFixed(1));
  }, [filteredData]);

  const handlePointClick = (entry: DayRiskPoint) => {
    setSelectedDay(entry);
    if (onSelectDay) {
      onSelectDay(entry);
    }
  };

  // Quick preset filter handlers
  const handleApplyPreset = (preset: '7d' | '3d' | 'surge' | '14d') => {
    setActivePreset(preset);
    if (preset === '7d') {
      setStartDate('2026-10-31');
      setEndDate('2026-11-06');
    } else if (preset === '3d') {
      setStartDate('2026-11-04');
      setEndDate('2026-11-06');
    } else if (preset === 'surge') {
      setStartDate('2026-11-03');
      setEndDate('2026-11-05');
    } else if (preset === '14d') {
      setStartDate('2026-10-24');
      setEndDate('2026-11-06');
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset('custom');
  };

  return (
    <div
      id="workforce-risk-trend-7d-card"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Workforce Risk Level Trend
            </h3>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              {filteredData.length} Days Filtered ({startDate} to {endDate})
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
              {spikesCount} Spikes Identified
            </span>
            <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Layers className="h-3 w-3 text-indigo-400" />
              <span>{confidenceLevel}% Prediction Uncertainty Band</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking longitudinal aggregate risk trajectories and identifying diurnal/environmental stress spikes with shaded prediction uncertainty corridor
          </p>
        </div>

        {/* View Metric Toggles & Confidence Band Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* What-If Simulator Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSimulator}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              activeWhatIfParams.isSimulationActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 font-black'
                : isSimulatorOpen
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Open 'What-If' Simulator to adjust vaccination rates, humidity, and heat"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span>&lsquo;What-If&rsquo; Simulator</span>
            {activeWhatIfParams.isSimulationActive ? (
              <span className="text-[9px] font-mono px-1 rounded bg-slate-950 text-amber-300 font-black">
                ACTIVE
              </span>
            ) : isSimulatorOpen ? (
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                OPEN
              </span>
            ) : null}
          </button>

          {/* Shaded Uncertainty Band Toggle */}
          <button
            onClick={() => setShowConfidenceBand((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showConfidenceBand
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60 shadow-indigo-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle shaded prediction uncertainty corridor on health risk trend"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Uncertainty Band</span>
            <span className="text-[10px] font-mono bg-indigo-900/80 px-1 rounded text-white">
              {showConfidenceBand ? `${confidenceLevel}% CI` : 'OFF'}
            </span>
          </button>

          {/* Forward 72h Projection Toggle */}
          <button
            onClick={() => setShowForecastHorizon((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showForecastHorizon
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-amber-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle +72-hour forward predictive projection points"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>+72h Forecast</span>
            <span className="text-[10px] font-mono bg-amber-900/80 px-1 rounded text-white">
              {showForecastHorizon ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Historical Moving Average Toggle */}
          <button
            onClick={() => {
              const nextVal = !effectiveShowMA;
              setShowMovingAverage(nextVal);
              if (onToggleMovingAverage) onToggleMovingAverage(nextVal);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              effectiveShowMA
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-emerald-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle 3-day rolling moving average baseline to detect long-term signal degradation"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>3D Moving Avg</span>
            <span className="text-[10px] font-mono bg-emerald-900/80 px-1 rounded text-white">
              {effectiveShowMA ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* View Metric Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMetric('both')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMetric === 'both' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Peak &amp; Avg
            </button>
            <button
              onClick={() => setViewMetric('peak')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMetric === 'peak' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Peak Only
            </button>
            <button
              onClick={() => setViewMetric('avg')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMetric === 'avg' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Average Only
            </button>
          </div>
        </div>
      </div>

      {/* Embedded What-If Simulator Tool Panel */}
      <WhatIfSimulatorPanel
        params={activeWhatIfParams}
        onChangeParams={handleParamsChange}
        isOpen={isSimulatorOpen}
        onToggleOpen={handleToggleSimulator}
        theme={theme}
        className="mt-3.5"
      />

      {/* Real-time What-If Comparison Toolbar */}
      {activeWhatIfParams.isSimulationActive && (
        <div className="mt-3.5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-bold text-amber-300">
              ⚡ What-If Recalculations Displayed:
            </span>
            <span className="text-slate-300">
              Vax: <strong>{activeWhatIfParams.vaccinationRatePct}%</strong> | Humidity: <strong>{activeWhatIfParams.seasonalHumidityPct}%</strong> | Heat: <strong>{activeWhatIfParams.ambientHeatC}°C</strong> | Shift: <strong>{activeWhatIfParams.shiftDurationHours}h</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold border ${
                whatIfImpact.netRiskDelta > 0
                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {whatIfImpact.netRiskDelta > 0 ? `+${whatIfImpact.netRiskDelta}%` : `${whatIfImpact.netRiskDelta}%`} Risk Delta
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareWithBaseline((prev) => !prev)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                compareWithBaseline
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle baseline reference lines overlay on chart"
            >
              <Eye className="h-3 w-3" />
              <span>{compareWithBaseline ? 'Compare with Baseline (On)' : 'Simulation Only'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleParamsChange({ ...DEFAULT_WHAT_IF_PARAMETERS, isSimulationActive: false })}
              className="text-[11px] text-amber-400 hover:text-white underline cursor-pointer ml-1"
            >
              Reset to Baseline
            </button>
          </div>
        </div>
      )}

      {/* Date Range Picker Component Bar */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
        {/* Date Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">Custom Window:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                min="2026-10-24"
                max={endDate}
                onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                className="bg-transparent text-white text-xs focus:outline-hidden font-mono cursor-pointer"
              />
            </div>

            <span className="text-slate-600">&rarr;</span>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max="2026-11-06"
                onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-hidden font-mono cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Quick Range Presets & Confidence Level selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase text-slate-500 font-bold mr-1">Presets:</span>
          <button
            onClick={() => handleApplyPreset('7d')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
              activePreset === '7d'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            7-Day Standard
          </button>
          <button
            onClick={() => handleApplyPreset('3d')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
              activePreset === '3d'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            Last 3 Days
          </button>
          <button
            onClick={() => handleApplyPreset('surge')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
              activePreset === 'surge'
                ? 'bg-rose-950 text-rose-300 border-rose-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            Peak Surge (Nov 3–5)
          </button>
          <button
            onClick={() => handleApplyPreset('14d')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
              activePreset === '14d'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            Full 14 Days
          </button>
          {showConfidenceBand && (
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
              <span className="text-[10px] uppercase text-slate-500 font-bold">CI:</span>
              {([90, 95, 99] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setConfidenceLevel(lvl)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    confidenceLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-indigo-300 border border-slate-800'
                  }`}
                  title={`Set statistical uncertainty corridor to ${lvl}% Confidence Interval`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
          )}
          {activePreset === 'custom' && (
            <button
              onClick={() => handleApplyPreset('7d')}
              className="p-1 text-slate-400 hover:text-cyan-400 transition"
              title="Reset to 7-Day Default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Composed Chart with Shaded Prediction Uncertainty Band & What-If Overlay */}
      <div className="mt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedData = state.activePayload[0].payload as EnrichedRiskPoint;
                  handlePointClick(clickedData);
                }
              }}
            >
              <defs>
                <linearGradient id="workforceRiskUncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeWhatIfParams.isSimulationActive ? "#f59e0b" : "#818cf8"} stopOpacity={0.38} />
                  <stop offset="50%" stopColor={activeWhatIfParams.isSimulationActive ? "#d97706" : "#6366f1"} stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                unit="%"
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as EnrichedRiskPoint;
                    const isSimActive = activeWhatIfParams.isSimulationActive;

                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs font-mono min-w-[280px]">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-2">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {data.isForecast && <Sparkles className="h-3 w-3 text-amber-400" />}
                            <span>{data.fullDate}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {isSimActive && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[10px]">
                                WHAT-IF
                              </span>
                            )}
                            {data.isForecast ? (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 text-[10px]">
                                FORECAST
                              </span>
                            ) : (data.simulatedIsSpike ?? data.isSpike) ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 text-[10px]">
                                SPIKE
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {isSimActive ? (
                            <>
                              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/40">
                                <div className="flex justify-between items-center text-amber-300 font-bold">
                                  <span>Simulated Peak Risk:</span>
                                  <span className="text-sm tabular-nums text-white">
                                    {data.simulatedPeakRiskScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                  <span>Baseline Peak: {data.peakRiskScore}%</span>
                                  <span className={`font-bold ${data.riskDelta && data.riskDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {data.riskDelta && data.riskDelta > 0 ? `+${data.riskDelta}%` : `${data.riskDelta}%`} vs Base
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between gap-4 text-cyan-300">
                                <span>Simulated Mean Risk:</span>
                                <span className="font-bold tabular-nums">
                                  {data.simulatedAvgRiskScore}%{' '}
                                  <span className="text-slate-500 font-normal text-[10px]">(Base: {data.avgRiskScore}%)</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between gap-4 text-rose-400">
                                <span>{data.isForecast ? 'Forecasted Peak Risk:' : 'Peak Workforce Risk:'}</span>
                                <span className="font-bold tabular-nums">{data.peakRiskScore}%</span>
                              </div>
                              <div className="flex justify-between gap-4 text-cyan-300">
                                <span>{data.isForecast ? 'Projected Mean Risk:' : 'Daily Mean Risk:'}</span>
                                <span className="font-bold tabular-nums">{data.avgRiskScore}%</span>
                              </div>
                            </>
                          )}

                          {/* Shaded Uncertainty Band in Tooltip */}
                          {showConfidenceBand && (
                            <div className="mt-1 pt-1 border-t border-slate-800/80 bg-indigo-950/40 p-1.5 rounded border border-indigo-500/30">
                              <div className="flex justify-between text-indigo-300 font-semibold text-[11px]">
                                <span>{confidenceLevel}% Uncertainty Corridor:</span>
                                <span className="font-mono text-white">
                                  [{isSimActive ? data.simulatedForecastLower : data.forecastLower}% – {isSimActive ? data.simulatedForecastUpper : data.forecastUpper}%]
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                <span>Confidence Margin:</span>
                                <span className="text-indigo-400 font-mono">
                                  ±{isSimActive ? data.simulatedUncertaintyMargin : data.uncertaintyMargin}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Historical Moving Average & Degradation Trajectory in Tooltip */}
                          {effectiveShowMA && data.ma3d_avgRisk !== undefined && (
                            <div className="mt-1 pt-1 border-t border-slate-800/80 bg-emerald-950/40 p-1.5 rounded border border-emerald-500/30">
                              <div className="flex justify-between text-emerald-300 font-semibold text-[11px]">
                                <span>3D Moving Average:</span>
                                <span className="font-mono text-white">{data.ma3d_avgRisk}%</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                <span>Degradation Trend:</span>
                                <span className={`font-mono font-bold ${
                                  (data.maDegradationDelta ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  {(data.maDegradationDelta ?? 0) > 0 ? `+${data.maDegradationDelta}% (Elevating)` : `${data.maDegradationDelta}% (Stable)`}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between gap-4 text-slate-400 pt-1">
                            <span>Anomalies {isSimActive ? 'Simulated:' : data.isForecast ? 'Projected:' : 'Detected:'}</span>
                            <span className="font-bold text-white tabular-nums">
                              {isSimActive ? data.simulatedAnomalyCount : data.anomalyCount} ({isSimActive ? data.simulatedCriticalCount : data.criticalCount} Critical)
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>Peak Window:</span>
                            <span className="text-slate-300">{data.peakTime}</span>
                          </div>
                          <div className="pt-1 text-[11px] text-amber-300 border-t border-slate-800/80">
                            <span>Hotspot: {data.primaryZone}</span>
                          </div>
                          {data.spikeReason && (
                            <div className="text-[10px] text-rose-300/90 italic pt-0.5 max-w-xs">
                              Cause: {data.spikeReason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {/* Threshold Lines */}
              <ReferenceLine
                y={65}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'High Risk Spike Threshold (65%)',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
              <ReferenceLine
                y={30}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: 'Safe Baseline Target (30%)',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideBottomRight'
                }}
              />

              {/* Shaded Confidence Interval / Prediction Uncertainty Band */}
              {showConfidenceBand && (
                <Area
                  type="monotone"
                  dataKey={activeWhatIfParams.isSimulationActive ? "simulatedForecastUpper" : "forecastUpper"}
                  name={activeWhatIfParams.isSimulationActive ? `${confidenceLevel}% What-If Recalculated Uncertainty Band` : `${confidenceLevel}% Prediction Uncertainty Band`}
                  stroke={activeWhatIfParams.isSimulationActive ? "#f59e0b" : "#818cf8"}
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  fill="url(#workforceRiskUncertaintyGradient)"
                />
              )}

              {/* Baseline Reference Lines when What-If is Active and compareWithBaseline is True */}
              {activeWhatIfParams.isSimulationActive && compareWithBaseline && (
                <>
                  <Line
                    type="monotone"
                    dataKey="peakRiskScore"
                    name="Baseline Peak Risk (Reference)"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#64748b', stroke: '#0f172a', strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  {(viewMetric === 'both' || viewMetric === 'avg') && (
                    <Line
                      type="monotone"
                      dataKey="avgRiskScore"
                      name="Baseline Avg Risk (Reference)"
                      stroke="#475569"
                      strokeWidth={1.4}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  )}
                </>
              )}

              {/* Active Simulation Recalculated Peak Risk Line */}
              {activeWhatIfParams.isSimulationActive ? (
                (viewMetric === 'both' || viewMetric === 'peak') && (
                  <Line
                    type="monotone"
                    dataKey="simulatedPeakRiskScore"
                    name="What-If Recalculated Peak Risk"
                    stroke="#f59e0b"
                    strokeWidth={2.8}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isSpike = payload.simulatedIsSpike;
                      const isForecast = payload.isForecast;
                      return (
                        <circle
                          key={`dot-sim-${payload.date}`}
                          cx={cx}
                          cy={cy}
                          r={isSpike ? 6.5 : isForecast ? 5 : 4.5}
                          fill={isSpike ? '#ef4444' : isForecast ? '#f59e0b' : '#fbbf24'}
                          stroke="#ffffff"
                          strokeWidth={2}
                          className={isSpike ? 'animate-pulse' : ''}
                        />
                      );
                    }}
                    activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )
              ) : (
                /* Standard Non-Simulated Peak Risk Line */
                (viewMetric === 'both' || viewMetric === 'peak') && (
                  <Line
                    type="monotone"
                    dataKey="peakRiskScore"
                    name="Peak Daily Risk Level"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isSpike = payload.isSpike;
                      const isForecast = payload.isForecast;
                      return (
                        <circle
                          key={`dot-peak-${payload.date}`}
                          cx={cx}
                          cy={cy}
                          r={isSpike ? 6 : isForecast ? 4.5 : 4}
                          fill={isForecast ? '#f59e0b' : isSpike ? '#ef4444' : '#f43f5e'}
                          stroke={isForecast ? '#ffffff' : '#0f172a'}
                          strokeWidth={2}
                          className={isSpike ? 'animate-pulse' : ''}
                        />
                      );
                    }}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )
              )}

              {/* Active Simulation Recalculated Avg Risk Line */}
              {activeWhatIfParams.isSimulationActive ? (
                (viewMetric === 'both' || viewMetric === 'avg') && (
                  <Line
                    type="monotone"
                    dataKey="simulatedAvgRiskScore"
                    name="What-If Recalculated Mean Risk"
                    stroke="#06b6d4"
                    strokeWidth={2.2}
                    strokeDasharray="4 2"
                    dot={{ r: 3.5, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )
              ) : (
                /* Standard Non-Simulated Average Risk Line */
                (viewMetric === 'both' || viewMetric === 'avg') && (
                  <Line
                    type="monotone"
                    dataKey="avgRiskScore"
                    name="Average Daily Risk Level"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={{ r: 3.5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )
              )}

              {/* Historical Moving Average Baseline Line (identifies long-term signal degradation trends) */}
              {effectiveShowMA && (
                <Line
                  type="monotone"
                  dataKey="ma3d_avgRisk"
                  name="3-Day Historical Moving Avg"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spikes Analysis Callout & Selected Day Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mb-1">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Highest Spike in Selected Window</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {highestSpikeDay.peakRiskScore}%
            </span>
            <span className="text-xs text-rose-400 font-mono">on {highestSpikeDay.date}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            {highestSpikeDay.spikeReason || 'Peak diurnal temperature escalation'} ({highestSpikeDay.criticalCount} Critical anomalies in {highestSpikeDay.primaryZone}).
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Selected Window Mean Risk Score</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {averageRiskScoreInRange}%
            </span>
            <span className="text-xs text-cyan-300 font-mono">across {filteredData.length} days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mean aggregate workforce risk across selected time frame. Baseline threshold is 30.0%.
          </p>
        </div>

        {/* Selected Day Inspector */}
        <div className="bg-slate-950/70 border border-cyan-500/30 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Calendar className="h-3.5 w-3.5" />
                {selectedDay ? selectedDay.fullDate : 'Select Day'}
              </span>
              {selectedDay?.isSpike && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  SPIKE CONFIRMED
                </span>
              )}
            </div>
            {selectedDay ? (
              <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                <div>
                  Peak:{' '}
                  <strong className="text-rose-400 tabular-nums">{selectedDay.peakRiskScore}%</strong> at{' '}
                  <span className="text-slate-400">{selectedDay.peakTime}</span> &bull; Mean:{' '}
                  <strong className="text-cyan-300 tabular-nums">{selectedDay.avgRiskScore}%</strong>
                </div>
                <div className="text-slate-400 text-[10px] truncate">
                  Zone: {selectedDay.primaryZone}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Click any point on the chart to inspect that day.</p>
            )}
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 mt-1">
            Recharts Line Engine &bull; Filtered via Date Range Picker
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  ChevronDown
} from 'lucide-react';

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
}

export default function WorkforceRiskTrend7DaysChart({
  className = '',
  onSelectDay
}: WorkforceRiskTrend7DaysChartProps) {
  // Date Range Filtering State (Default: Last 7 Days: 2026-10-31 to 2026-11-06)
  const [startDate, setStartDate] = useState<string>('2026-10-31');
  const [endDate, setEndDate] = useState<string>('2026-11-06');
  const [activePreset, setActivePreset] = useState<'7d' | '3d' | 'surge' | '14d' | 'custom'>('7d');
  const [viewMetric, setViewMetric] = useState<'both' | 'peak' | 'avg'>('both');
  const [selectedDay, setSelectedDay] = useState<DayRiskPoint | null>(EXTENDED_RISK_DATA[EXTENDED_RISK_DATA.length - 1]);

  // Apply custom date range filter to the risk trend data
  const filteredData = useMemo(() => {
    const list = EXTENDED_RISK_DATA.filter(
      (item) => item.isoDate >= startDate && item.isoDate <= endDate
    );
    return list.length > 0 ? list : EXTENDED_RISK_DATA.slice(-7);
  }, [startDate, endDate]);

  const spikesCount = useMemo(() => {
    return filteredData.filter((d) => d.isSpike).length;
  }, [filteredData]);

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
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg ${className}`}>
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
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking longitudinal aggregate risk trajectories and identifying diurnal/environmental stress spikes with custom time window filtering
          </p>
        </div>

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

        {/* Quick Range Presets */}
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

      {/* Main Recharts Line Chart */}
      <div className="mt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedData = state.activePayload[0].payload as DayRiskPoint;
                  handlePointClick(clickedData);
                }
              }}
            >
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
                    const data = payload[0].payload as DayRiskPoint;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs font-mono">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-2">
                          <span className="font-bold text-white">{data.fullDate}</span>
                          {data.isSpike && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 text-[10px]">
                              SPIKE
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4 text-rose-400">
                            <span>Peak Workforce Risk:</span>
                            <span className="font-bold tabular-nums">{data.peakRiskScore}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-cyan-300">
                            <span>Daily Mean Risk:</span>
                            <span className="font-bold tabular-nums">{data.avgRiskScore}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>Anomalies Detected:</span>
                            <span className="font-bold text-white tabular-nums">
                              {data.anomalyCount} ({data.criticalCount} Critical)
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>Peak Risk Time:</span>
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

              {/* Peak Risk Line */}
              {(viewMetric === 'both' || viewMetric === 'peak') && (
                <Line
                  type="monotone"
                  dataKey="peakRiskScore"
                  name="Peak Daily Risk Level"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isSpike = payload.isSpike;
                    return (
                      <circle
                        key={`dot-peak-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={isSpike ? 6 : 4}
                        fill={isSpike ? '#ef4444' : '#f43f5e'}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className={isSpike ? 'animate-pulse' : ''}
                      />
                    );
                  }}
                  activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Average Risk Line */}
              {(viewMetric === 'both' || viewMetric === 'avg') && (
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
              )}
            </LineChart>
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

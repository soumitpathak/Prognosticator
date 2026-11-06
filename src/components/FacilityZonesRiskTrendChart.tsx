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
import { FacilityZone, ActiveAnomalyAlert } from '../types';
import {
  TrendingUp,
  MapPin,
  Flame,
  Activity,
  Calendar,
  Clock,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface FacilityZonesRiskTrendChartProps {
  zones: FacilityZone[];
  alerts?: ActiveAnomalyAlert[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

interface MultiZoneTimePoint {
  timeLabel: string;
  fullTimestamp: string;
  hourIndex: number;
  [zoneKey: string]: number | string; // zone risk score numbers
}

const ZONE_COLORS: Record<string, { stroke: string; label: string; shortName: string }> = {
  'Outdoor-Construction-Sector-4': {
    stroke: '#f43f5e', // rose-500
    label: 'Outdoor Construction Sector 4',
    shortName: 'Sector 4 (Construction)'
  },
  'Warehouse-Logistics-Hub-North': {
    stroke: '#06b6d4', // cyan-500
    label: 'Warehouse Logistics Hub North',
    shortName: 'Logistics Hub North'
  },
  'Manufacturing-Assembly-Line-B': {
    stroke: '#6366f1', // indigo-500
    label: 'Manufacturing Assembly Line B',
    shortName: 'Assembly Line B'
  },
  'Subgrade-Tunnel-Conduit-7': {
    stroke: '#10b981', // emerald-500
    label: 'Subgrade Tunnel Conduit 7',
    shortName: 'Tunnel Conduit 7'
  },
  'Heavy-Chemical-Refinement': {
    stroke: '#a855f7', // purple-500
    label: 'Heavy Chemical Refinement',
    shortName: 'Chemical Refinement'
  },
  'Smelting-Metal-Foundry': {
    stroke: '#f59e0b', // amber-500
    label: 'Smelting & Metal Foundry',
    shortName: 'Smelting Foundry'
  }
};

export default function FacilityZonesRiskTrendChart({
  zones,
  alerts = [],
  selectedZoneId,
  onSelectZone,
  className = ''
}: FacilityZonesRiskTrendChartProps) {
  const [timeMode, setTimeMode] = useState<'24h' | '7d'>('24h');
  const [activeZoneToggles, setActiveZoneToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    zones.forEach((z) => {
      initial[z.id] = true;
    });
    return initial;
  });

  function getZoneRiskScore(zone: FacilityZone): number {
    if (zone.status === 'CRITICAL' || zone.id.includes('Sector-4')) return 78.5;
    if (zone.status === 'MODERATE' || zone.id.includes('Tunnel')) return 54.2;
    if (zone.id.includes('Warehouse')) return 38.6;
    return 24.8;
  }

  // Ensure default zones exist if zones array is custom
  const effectiveZones = useMemo(() => {
    if (zones && zones.length > 0) return zones;
    return [
      { id: 'Outdoor-Construction-Sector-4', name: 'Outdoor Construction Sector 4', status: 'CRITICAL', count: 24, temp: '41.2°C', heatIndex: 43.5, twl: 92.4, aqi: 75, description: 'High thermal exposure', activeHazards: ['Heat Index', 'HRV Drop'], latitude: 37.77, longitude: -122.41 },
      { id: 'Warehouse-Logistics-Hub-North', name: 'Warehouse Logistics Hub North', status: 'MODERATE', count: 32, temp: '24.5°C', heatIndex: 26.0, twl: 142.1, aqi: 52, description: 'Logistics center', activeHazards: ['Fatigue'], latitude: 37.78, longitude: -122.42 },
      { id: 'Manufacturing-Assembly-Line-B', name: 'Manufacturing Assembly Line B', status: 'STABLE', count: 45, temp: '23.0°C', heatIndex: 23.5, twl: 118.0, aqi: 45, description: 'Robotics assembly', activeHazards: ['Noise'], latitude: 37.79, longitude: -122.43 },
      { id: 'Subgrade-Tunnel-Conduit-7', name: 'Subgrade Tunnel Conduit 7', status: 'CRITICAL', count: 18, temp: '33.8°C', heatIndex: 38.2, twl: 104.5, aqi: 88, description: 'Confined utility space', activeHazards: ['Humidity', 'Heat'], latitude: 37.80, longitude: -122.44 }
    ] as FacilityZone[];
  }, [zones]);

  // Generate 24-hour multi-zone trend data or 7-day multi-zone trend data
  const chartData: MultiZoneTimePoint[] = useMemo(() => {
    if (timeMode === '24h') {
      const points: MultiZoneTimePoint[] = [];
      const now = new Date('2026-11-06T12:00:00Z');

      for (let h = 23; h >= 0; h--) {
        const timePoint = new Date(now.getTime() - h * 3600000);
        const hourStr = timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const hourNum = timePoint.getHours();

        const point: MultiZoneTimePoint = {
          timeLabel: hourStr,
          fullTimestamp: timePoint.toISOString(),
          hourIndex: 24 - h
        };

        // Diurnal curve variations per facility zone:
        // Sector 4 peaks around 13:00 - 16:00 due to solar heat
        const solarPeak = Math.max(0, Math.sin(((hourNum - 6) / 14) * Math.PI));
        const shiftRamp = hourNum >= 8 && hourNum <= 17 ? 1.0 : 0.4;

        effectiveZones.forEach((z) => {
          let baseRisk = getZoneRiskScore(z);
          if (z.id.includes('Sector-4') || z.id.includes('Construction')) {
            baseRisk = Math.min(94, Math.max(22, 28 + solarPeak * 52 + (Math.sin(h * 1.5) * 6)));
          } else if (z.id.includes('Warehouse') || z.id.includes('Logistics')) {
            // Logistics peaks during shift change and afternoon fulfillment rush
            baseRisk = Math.min(75, Math.max(15, 18 + shiftRamp * 24 + (hourNum === 14 ? 18 : 0) + (Math.cos(h) * 4)));
          } else if (z.id.includes('Assembly') || z.id.includes('Manufacturing')) {
            // Manufacturing has steady low-to-moderate robotic work
            baseRisk = Math.min(65, Math.max(12, 16 + shiftRamp * 16 + (Math.sin(h * 0.8) * 3)));
          } else if (z.id.includes('Tunnel') || z.id.includes('Conduit')) {
            // Subgrade tunnel peaks in afternoon due to heat accumulation
            baseRisk = Math.min(85, Math.max(20, 26 + solarPeak * 36 + (Math.cos(h * 1.2) * 5)));
          } else {
            baseRisk = Math.min(88, Math.max(15, (getZoneRiskScore(z) * 0.7) + (Math.sin(h) * 12)));
          }

          point[z.id] = Number(baseRisk.toFixed(1));
        });

        points.push(point);
      }
      return points;
    } else {
      // 7-day daily trend points
      const points: MultiZoneTimePoint[] = [];
      const days = ['Sat 10/31', 'Sun 11/01', 'Mon 11/02', 'Tue 11/03', 'Wed 11/04', 'Thu 11/05', 'Fri 11/06 (Today)'];
      const rawMultipliers = [0.45, 0.40, 0.70, 0.85, 1.20, 1.05, 0.88]; // surge on Nov 3-5

      days.forEach((dayName, idx) => {
        const mult = rawMultipliers[idx];
        const point: MultiZoneTimePoint = {
          timeLabel: dayName,
          fullTimestamp: `2026-11-0${idx + 1}`,
          hourIndex: idx
        };

        effectiveZones.forEach((z) => {
          let score = getZoneRiskScore(z) * mult;
          if (z.id.includes('Sector-4')) score = Math.min(95, Math.max(25, 30 + mult * 48));
          else if (z.id.includes('Warehouse')) score = Math.min(70, Math.max(18, 20 + mult * 25));
          else if (z.id.includes('Assembly')) score = Math.min(60, Math.max(15, 18 + mult * 18));
          else if (z.id.includes('Tunnel')) score = Math.min(86, Math.max(22, 25 + mult * 38));

          point[z.id] = Number(score.toFixed(1));
        });

        points.push(point);
      });
      return points;
    }
  }, [timeMode, effectiveZones]);

  // Toggle zone visibility on chart
  const handleToggleZone = (zoneId: string) => {
    setActiveZoneToggles((prev) => ({
      ...prev,
      [zoneId]: prev[zoneId] === undefined ? false : !prev[zoneId]
    }));
  };

  const handleSelectAllZones = (selectAll: boolean) => {
    const updated: Record<string, boolean> = {};
    effectiveZones.forEach((z) => {
      updated[z.id] = selectAll;
    });
    setActiveZoneToggles(updated);
  };

  // Compute key summary statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { highestZone: 'N/A', peakScore: 0, lowestZone: 'N/A', lowestScore: 0, avgRisk: 0 };

    let highestScore = -1;
    let highestZoneName = '';
    let lowestScore = 999;
    let lowestZoneName = '';
    let totalScoreSum = 0;
    let count = 0;

    effectiveZones.forEach((z) => {
      const scores = chartData.map((d) => (typeof d[z.id] === 'number' ? (d[z.id] as number) : 0));
      const maxZ = Math.max(...scores);
      const minZ = Math.min(...scores);
      const avgZ = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);

      if (maxZ > highestScore) {
        highestScore = maxZ;
        highestZoneName = z.name;
      }
      if (minZ < lowestScore) {
        lowestScore = minZ;
        lowestZoneName = z.name;
      }

      totalScoreSum += avgZ;
      count++;
    });

    return {
      highestZone: highestZoneName,
      peakScore: Number(highestScore.toFixed(1)),
      lowestZone: lowestZoneName,
      lowestScore: Number(lowestScore.toFixed(1)),
      avgRisk: count > 0 ? Number((totalScoreSum / count).toFixed(1)) : 0
    };
  }, [chartData, effectiveZones]);

  return (
    <div
      id="facility-zones-risk-trend-chart-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Facility Zones Health Risk Trends Over Time
              </h2>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Recharts Multi-Line Engine
              </span>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                {effectiveZones.length} Zones Compared
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative longitudinal risk score analysis across monitored work sectors, evaluating cross-zone microclimate and ergonomic strain patterns.
            </p>
          </div>
        </div>

        {/* View Mode & Selection Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Time Window Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setTimeMode('24h')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeMode === '24h'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>24-Hour Hourly</span>
            </button>
            <button
              onClick={() => setTimeMode('7d')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                timeMode === '7d'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>7-Day Trajectory</span>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleSelectAllZones(true)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition cursor-pointer"
              title="Show all facility zone lines"
            >
              All
            </button>
            <button
              onClick={() => handleSelectAllZones(false)}
              className="text-[10px] text-slate-400 hover:text-white font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition cursor-pointer"
              title="Hide all facility zone lines"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Zone Filter Legend Chips */}
      <div className="my-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-slate-500 uppercase font-mono font-bold flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3 text-cyan-400" /> Active Series:
        </span>

        {effectiveZones.map((zone) => {
          const cfg = ZONE_COLORS[zone.id] || {
            stroke: '#94a3b8',
            label: zone.name,
            shortName: zone.name.split('-')[0]
          };
          const isVisible = activeZoneToggles[zone.id] !== false;
          const isSelected = selectedZoneId === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => {
                handleToggleZone(zone.id);
                if (onSelectZone) onSelectZone(zone.id);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border cursor-pointer ${
                isVisible
                  ? isSelected
                    ? 'bg-slate-800 text-white border-cyan-400 shadow-xs ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                  : 'bg-slate-950/60 text-slate-500 border-slate-800/80 opacity-50 line-through'
              }`}
              title={`Toggle ${zone.name} line on trend chart (Current risk: ${getZoneRiskScore(zone)}%)`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: cfg.stroke }}
              ></span>
              <span className="truncate max-w-[150px]">{cfg.shortName}</span>
              <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                ({getZoneRiskScore(zone)}%)
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Multi-Line Recharts Canvas */}
      <div className="h-72 sm:h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              unit="%"
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div className="bg-slate-950 border border-slate-700/90 p-3 rounded-xl shadow-2xl text-xs font-mono backdrop-blur-md min-w-56 z-50">
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-[11px]">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          {label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {timeMode === '24h' ? 'Hourly Snapshot' : 'Daily Risk Average'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {payload.map((entry: any) => {
                          const zoneId = entry.dataKey as string;
                          const cfg = ZONE_COLORS[zoneId] || { label: zoneId, shortName: zoneId, stroke: entry.color };
                          const val = Number(entry.value);

                          return (
                            <div key={zoneId} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 truncate text-slate-300">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: entry.color }}
                                ></span>
                                <span className="truncate max-w-[150px]">{cfg.shortName}:</span>
                              </span>
                              <span
                                className={`font-bold tabular-nums ${
                                  val >= 65
                                    ? 'text-rose-400 font-extrabold'
                                    : val >= 40
                                    ? 'text-amber-300'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {val.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                        <span>Safe Baseline: 30%</span>
                        <span className="text-rose-400 font-semibold">High Risk: &ge;65%</span>
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
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
            />

            {/* Statutory Safety Threshold Lines */}
            <ReferenceLine
              y={65}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{
                value: 'High Risk Cutoff (65%)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight',
                fontFamily: 'monospace'
              }}
            />
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              label={{
                value: 'Safe Baseline Target (30%)',
                fill: '#10b981',
                fontSize: 10,
                position: 'insideBottomRight',
                fontFamily: 'monospace'
              }}
            />

            {/* Individual Facility Zone Lines */}
            {effectiveZones.map((zone) => {
              const cfg = ZONE_COLORS[zone.id] || { stroke: '#06b6d4', label: zone.name, shortName: zone.name };
              const isVisible = activeZoneToggles[zone.id] !== false;

              if (!isVisible) return null;

              return (
                <Line
                  key={zone.id}
                  type="monotone"
                  dataKey={zone.id}
                  name={cfg.shortName}
                  stroke={cfg.stroke}
                  strokeWidth={selectedZoneId === zone.id ? 3 : 2}
                  dot={{ r: 3, fill: cfg.stroke, stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
        <div className="bg-slate-950/70 border border-rose-500/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Highest Risk Facility Zone</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">
              {stats.peakScore}%
            </span>
            <span className="text-[11px] text-rose-400 truncate">
              {stats.highestZone}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Subject to direct solar radiation and elevated ambient wet-bulb thermal loads.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Most Resilient Facility Zone</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">
              {stats.lowestScore}%
            </span>
            <span className="text-[11px] text-emerald-400 truncate">
              {stats.lowestZone}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Controlled climate, ergonomic floor damping, and low parasympathetic fatigue.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cross-Facility Average Risk</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">
              {stats.avgRisk}%
            </span>
            <span className="text-[11px] text-cyan-300">
              Across {effectiveZones.length} Zones
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Aggregate mean workforce hazard exposure across all operational sites.
          </p>
        </div>
      </div>
    </div>
  );
}

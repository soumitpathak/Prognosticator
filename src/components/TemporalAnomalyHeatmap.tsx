import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { FacilityZone, ActiveAnomalyAlert } from '../types';
import {
  Flame,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Sun,
  Moon,
  Activity,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  Thermometer,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export interface HourlyDiurnalPoint {
  hour: number;
  hourLabel: string;
  shiftType: 'NIGHT' | 'DAWN' | 'MORNING' | 'MIDDAY_PEAK' | 'EVENING';
  shiftName: string;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  totalFrequency: number;
  severityIndex: number; // 0 - 100
  ambientHeatC: number;
  primaryHazard: string;
  directive: string;
}

interface TemporalAnomalyHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export default function TemporalAnomalyHeatmap({
  zones = [],
  alerts = [],
  selectedZoneId = 'ALL',
  onSelectZone,
  className = ''
}: TemporalAnomalyHeatmapProps) {
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>(selectedZoneId || 'ALL');
  const [selectedHour, setSelectedHour] = useState<number>(13); // Default to peak thermal hour (13:00)
  const [viewMetric, setViewMetric] = useState<'SEVERITY_STACK' | 'FREQUENCY_BARS'>('SEVERITY_STACK');

  // Generate deterministic 24-hour diurnal anomaly data enriched with live alert counts
  const diurnalData: HourlyDiurnalPoint[] = useMemo(() => {
    const isSector4 = activeZoneFilter.includes('Construction') || activeZoneFilter === 'Outdoor-Construction-Sector-4';
    const isWarehouse = activeZoneFilter.includes('Warehouse') || activeZoneFilter === 'Warehouse-Logistics-Hub-North';
    const isManufacturing = activeZoneFilter.includes('Manufacturing') || activeZoneFilter === 'Manufacturing-Assembly-Line-B';

    const currentHour = new Date().getHours();

    return Array.from({ length: 24 }, (_, h) => {
      const hourLabel = `${h.toString().padStart(2, '0')}:00`;

      // Determine shift phase
      let shiftType: HourlyDiurnalPoint['shiftType'] = 'NIGHT';
      let shiftName = 'Night Maintenance Shift';
      let hazard = 'Cumulative Sleep Deficit & Autonomic Drift';
      let directive = 'Enforce standard ergonomic rotation and lighted staging inspection.';

      if (h >= 6 && h < 10) {
        shiftType = 'DAWN';
        shiftName = 'Dawn Handover & Morning Ramp';
        hazard = 'Warmup Autonomic Heart Rate Deviation';
        directive = 'Administer pre-shift biometric sync and mandatory hydration screening.';
      } else if (h >= 10 && h < 13) {
        shiftType = 'MORNING';
        shiftName = 'Mid-Morning Production Shift';
        hazard = 'Elevated Wet-Bulb Load & Acoustic Machinery Jitter';
        directive = 'Inspect hearing defenders; transition to shaded staging.';
      } else if (h >= 13 && h < 17) {
        shiftType = 'MIDDAY_PEAK';
        shiftName = 'Peak Solar Thermal Radiation Window';
        hazard = 'Critical Wet-Bulb Heat Index Exceedance (WBGT > 34°C)';
        directive = 'OSHA/ISO 45001 Mandatory 15-min shaded pause per hour with 250ml electrolyte fluid.';
      } else if (h >= 17 && h < 21) {
        shiftType = 'EVENING';
        shiftName = 'Late Afternoon Cooling & Evening Shift';
        hazard = 'Cumulative Dehydration & Core Temp Creep';
        directive = 'Provide cold mist stations; mandatory rest prior to shift handover.';
      }

      // Base diurnal frequency curve
      let critical = 0;
      let high = 0;
      let moderate = 0;
      let low = 0;

      if (h >= 12 && h <= 15) {
        // Peak thermal window
        critical = isSector4 ? 4 : isWarehouse ? 2 : 1;
        high = isSector4 ? 3 : 2;
        moderate = 2;
        low = 1;
      } else if (h >= 10 && h <= 17) {
        critical = isSector4 ? 2 : 1;
        high = isSector4 ? 3 : 2;
        moderate = 2;
        low = 1;
      } else if (h >= 6 && h <= 9) {
        critical = 0;
        high = isSector4 ? 2 : 1;
        moderate = 2;
        low = 2;
      } else if (h >= 18 && h <= 21) {
        critical = isSector4 ? 1 : 0;
        high = 2;
        moderate = 2;
        low = 1;
      } else {
        // Night
        critical = 0;
        high = 0;
        moderate = isWarehouse ? 2 : 1;
        low = 1;
      }

      // Inject real-time alerts into current hour and adjacent hours
      if (h === currentHour) {
        const activeCritical = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
        const activeHigh = alerts.filter((a) => a.severity === 'HIGH' && !a.acknowledged).length;
        critical += Math.max(1, activeCritical);
        high += Math.max(1, activeHigh);
      }

      const totalFrequency = critical + high + moderate + low;

      // Diurnal heat curve calculation
      let ambientHeatC = 30.0;
      if (h >= 6 && h <= 19) {
        ambientHeatC = Number((31.0 + 13.5 * Math.sin(((h - 6) / 13) * Math.PI)).toFixed(1));
        if (isSector4) ambientHeatC = Number((ambientHeatC + 2.5).toFixed(1));
      } else {
        ambientHeatC = Number((29.0 + (h > 19 ? (24 - h) * 0.4 : h * 0.3)).toFixed(1));
      }

      // Normalized severity index (0 - 100)
      const severityIndex = Math.min(
        100,
        Math.round(
          (critical * 36 + high * 22 + moderate * 12 + low * 5) /
            Math.max(1, totalFrequency) *
            2.4
        )
      );

      return {
        hour: h,
        hourLabel,
        shiftType,
        shiftName,
        criticalCount: critical,
        highCount: high,
        moderateCount: moderate,
        lowCount: low,
        totalFrequency,
        severityIndex,
        ambientHeatC,
        primaryHazard: hazard,
        directive
      };
    });
  }, [activeZoneFilter, alerts]);

  // Aggregate cycle metrics
  const cycleSummary = useMemo(() => {
    const totalAnomalies = diurnalData.reduce((acc, d) => acc + d.totalFrequency, 0);
    const criticalTotal = diurnalData.reduce((acc, d) => acc + d.criticalCount, 0);
    const highTotal = diurnalData.reduce((acc, d) => acc + d.highCount, 0);
    const peakHour = [...diurnalData].sort((a, b) => b.totalFrequency - a.totalFrequency)[0];
    const peakSeverityHour = [...diurnalData].sort((a, b) => b.severityIndex - a.severityIndex)[0];

    return {
      totalAnomalies,
      criticalTotal,
      highTotal,
      peakHour,
      peakSeverityHour
    };
  }, [diurnalData]);

  const activeHourData = useMemo(() => {
    return diurnalData.find((d) => d.hour === selectedHour) || diurnalData[13];
  }, [diurnalData, selectedHour]);

  // Helper for heatmap matrix cell color by severity & count
  const getHeatmapCellColor = (count: number, tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW') => {
    if (count === 0) return 'bg-slate-950/70 border-slate-800/60 text-slate-600';
    switch (tier) {
      case 'CRITICAL':
        if (count >= 3) return 'bg-rose-600 border-rose-400 text-white font-bold shadow-xs shadow-rose-600/50';
        if (count >= 2) return 'bg-rose-800/90 border-rose-600/80 text-rose-100 font-bold';
        return 'bg-rose-950/80 border-rose-800/60 text-rose-300';
      case 'HIGH':
        if (count >= 3) return 'bg-amber-600 border-amber-400 text-slate-950 font-bold shadow-xs shadow-amber-600/40';
        if (count >= 2) return 'bg-amber-700/90 border-amber-500/80 text-amber-100 font-bold';
        return 'bg-amber-950/80 border-amber-800/60 text-amber-300';
      case 'MODERATE':
        if (count >= 2) return 'bg-yellow-700/80 border-yellow-500/70 text-yellow-100 font-semibold';
        return 'bg-yellow-950/70 border-yellow-800/50 text-yellow-300';
      case 'LOW':
        if (count >= 2) return 'bg-cyan-800/70 border-cyan-600/70 text-cyan-100';
        return 'bg-cyan-950/60 border-cyan-800/40 text-cyan-300';
    }
  };

  return (
    <section
      id="temporal-anomaly-heatmap-card"
      aria-label="24-Hour Temporal Health Anomaly Heat-Map"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 shrink-0">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                24-Hour Temporal Health Anomaly Heat-Map
              </h2>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded-md font-semibold">
                Recharts Diurnal Matrix
              </span>
              <span className="text-[10px] text-orange-400 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Circadian Shift Cycle</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Diurnal concentration of anomaly frequency, multi-tier severity breakdown, and ambient thermal strain over a full 24-hour cycle.
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
            <select
              value={activeZoneFilter}
              onChange={(e) => {
                setActiveZoneFilter(e.target.value);
                if (onSelectZone && e.target.value !== 'ALL') {
                  onSelectZone(e.target.value);
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Monitored Sectors</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Metric Mode Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMetric('SEVERITY_STACK')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMetric === 'SEVERITY_STACK'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Stacked severity breakdown per hour"
            >
              Severity Stack
            </button>
            <button
              onClick={() => setViewMetric('FREQUENCY_BARS')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMetric === 'FREQUENCY_BARS'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Total anomaly frequency per hour"
            >
              Frequency
            </button>
          </div>
        </div>
      </div>

      {/* Circadian Shift Phase Highlights Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-3.5 text-xs font-mono">
        <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span className="flex items-center gap-1">
              <Moon className="h-3 w-3 text-cyan-400" /> Night Shift (00 - 06h)
            </span>
            <span className="text-cyan-400 font-bold">Low Strain</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {diurnalData.slice(0, 6).reduce((a, b) => a + b.totalFrequency, 0)}{' '}
            <span className="text-xs font-normal text-slate-500">events</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            Dominant: Autonomic Sleep Deficit
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-yellow-400" /> Morning Shift (06 - 12h)
            </span>
            <span className="text-yellow-400 font-bold">Ramping</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {diurnalData.slice(6, 12).reduce((a, b) => a + b.totalFrequency, 0)}{' '}
            <span className="text-xs font-normal text-slate-500">events</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            Dominant: Acoustic &amp; Warmup Strain
          </div>
        </div>

        <div className="bg-slate-950/80 border border-rose-900/40 p-2.5 rounded-xl bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950">
          <div className="flex items-center justify-between text-rose-300 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-rose-400 animate-pulse" /> Peak Thermal (12 - 18h)
            </span>
            <span className="text-rose-400 font-bold">CRITICAL</span>
          </div>
          <div className="text-lg font-bold text-rose-300 mt-1">
            {diurnalData.slice(12, 18).reduce((a, b) => a + b.totalFrequency, 0)}{' '}
            <span className="text-xs font-normal text-rose-400/80">events</span>
          </div>
          <div className="text-[10px] text-rose-300/80 truncate mt-0.5">
            Dominant: WBGT Thermal Syncope Risk
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-amber-400" /> Evening Shift (18 - 24h)
            </span>
            <span className="text-amber-400 font-bold">Elevated</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {diurnalData.slice(18, 24).reduce((a, b) => a + b.totalFrequency, 0)}{' '}
            <span className="text-xs font-normal text-slate-500">events</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            Dominant: Cumulative Dehydration
          </div>
        </div>
      </div>

      {/* Main Recharts 24-Hour Diurnal Composed Chart */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800/60 gap-2">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-bold text-white">RECHARTS TEMPORAL DISTRIBUTION</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-[11px]">
              Click any hour bar below to inspect shift diagnostics
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-rose-500 rounded-xs"></span>
              <span>Critical</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-amber-500 rounded-xs"></span>
              <span>High</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-yellow-500 rounded-xs"></span>
              <span>Moderate</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 bg-cyan-500 rounded-xs"></span>
              <span>Low</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-pink-500 inline-block"></span>
              <span className="text-pink-400">Severity Index</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 bg-orange-600/40 rounded-xs"></span>
              <span className="text-orange-400">Thermal Heat Curve</span>
            </span>
          </div>
        </div>

        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={diurnalData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              onClick={(state) => {
                if (state && typeof state.activeTooltipIndex === 'number') {
                  setSelectedHour(state.activeTooltipIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="heatCurveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="hourLabel"
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis: Anomaly Count */}
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                label={{
                  value: 'Anomaly Count / Hr',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  dy: 45
                }}
              />

              {/* Right Y Axis: Severity Index (0 - 100) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke="#ec4899"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload as HourlyDiurnalPoint;
                    return (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono z-50">
                        <div className="flex items-center justify-between gap-4 pb-1.5 mb-1.5 border-b border-slate-800">
                          <span className="font-bold text-white text-sm">{data.hourLabel}</span>
                          <span className="text-[10px] text-cyan-400 font-semibold">{data.shiftName}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300 pb-1">
                          <span>Total Frequency:</span>
                          <strong className="text-white text-sm">{data.totalFrequency} events</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-rose-400">
                            <span>Critical:</span>
                            <strong>{data.criticalCount}</strong>
                          </div>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>High:</span>
                            <strong>{data.highCount}</strong>
                          </div>
                          <div className="flex items-center justify-between text-yellow-300">
                            <span>Moderate:</span>
                            <strong>{data.moderateCount}</strong>
                          </div>
                          <div className="flex items-center justify-between text-cyan-400">
                            <span>Low:</span>
                            <strong>{data.lowCount}</strong>
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-0.5 text-[11px]">
                          <div className="flex justify-between text-pink-400 font-bold">
                            <span>Severity Index:</span>
                            <span>{data.severityIndex} / 100</span>
                          </div>
                          <div className="flex justify-between text-orange-400">
                            <span>Ambient Heat Load:</span>
                            <span>{data.ambientHeatC}°C</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            <span className="text-slate-300 font-semibold">Hazard: </span>
                            {data.primaryHazard}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Peak Thermal Reference Line */}
              <ReferenceLine
                x="13:00"
                yAxisId="left"
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{
                  value: '13:00 Peak Thermal Solar Zenith',
                  position: 'insideTopRight',
                  fill: '#f43f5e',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />

              {/* Diurnal Ambient Thermal Background Area */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="ambientHeatC"
                name="Ambient Heat (°C)"
                stroke="#ea580c"
                strokeWidth={1.5}
                fill="url(#heatCurveAreaGradient)"
                dot={false}
              />

              {/* Stacked Bars for Severity Tiers */}
              <Bar yAxisId="left" dataKey="criticalCount" name="Critical" fill="#f43f5e" stackId="sev" />
              <Bar yAxisId="left" dataKey="highCount" name="High" fill="#f59e0b" stackId="sev" />
              <Bar yAxisId="left" dataKey="moderateCount" name="Moderate" fill="#eab308" stackId="sev" />
              <Bar
                yAxisId="left"
                dataKey="lowCount"
                name="Low"
                fill="#06b6d4"
                stackId="sev"
                radius={[3, 3, 0, 0]}
              />

              {/* Composite Severity Index Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="severityIndex"
                name="Severity Index (0-100)"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#ec4899' }}
                activeDot={{ r: 5, fill: '#ffffff', stroke: '#ec4899', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 24-Hour Discrete Heat-Map Grid Matrix (24 Columns x 4 Severity Rows) */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 sm:p-4 mb-4">
        <div className="flex items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>TEMPORAL MATRIX CELLS (HOUR × SEVERITY TIER)</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span className="text-slate-500">Intensity:</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-500">0</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950 text-rose-300">1</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-800 text-rose-100">2-3</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-600 text-white font-bold">4+</span>
          </div>
        </div>

        {/* The 24-Hour Matrix Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[680px]">
            {/* Shift header labels spanning the 24 columns */}
            <div className="grid grid-cols-24 gap-1 text-[9px] font-mono text-center mb-1 text-slate-500">
              <div className="col-span-6 bg-slate-900/40 rounded py-0.5 text-cyan-400/80 truncate">
                NIGHT (00-06)
              </div>
              <div className="col-span-4 bg-slate-900/40 rounded py-0.5 text-yellow-400/80 truncate">
                DAWN (06-10)
              </div>
              <div className="col-span-7 bg-rose-950/40 border border-rose-900/40 rounded py-0.5 text-rose-300 truncate">
                PEAK THERMAL (10-17)
              </div>
              <div className="col-span-4 bg-slate-900/40 rounded py-0.5 text-amber-400/80 truncate">
                EVENING (17-21)
              </div>
              <div className="col-span-3 bg-slate-900/40 rounded py-0.5 text-cyan-400/80 truncate">
                NIGHT (21-24)
              </div>
            </div>

            {/* Hour Numbers Row */}
            <div className="grid grid-cols-24 gap-1 text-[9px] font-mono text-center mb-1 text-slate-400">
              {diurnalData.map((d) => (
                <button
                  key={d.hour}
                  onClick={() => setSelectedHour(d.hour)}
                  className={`py-0.5 rounded transition cursor-pointer ${
                    selectedHour === d.hour
                      ? 'bg-cyan-600 text-white font-bold ring-1 ring-cyan-400'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  {d.hour}h
                </button>
              ))}
            </div>

            {/* Severity Tier Rows */}
            <div className="space-y-1 font-mono text-[10px]">
              {/* Row 1: Critical */}
              <div className="flex items-center gap-1">
                <span className="w-16 text-[10px] text-rose-400 font-bold shrink-0 truncate">
                  CRITICAL
                </span>
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {diurnalData.map((d) => (
                    <button
                      key={`crit-${d.hour}`}
                      onClick={() => setSelectedHour(d.hour)}
                      className={`h-6 rounded flex items-center justify-center border text-[10px] transition cursor-pointer ${getHeatmapCellColor(
                        d.criticalCount,
                        'CRITICAL'
                      )} ${selectedHour === d.hour ? 'ring-2 ring-white z-10 scale-105' : ''}`}
                      title={`${d.hourLabel} Critical Anomalies: ${d.criticalCount}`}
                    >
                      {d.criticalCount > 0 ? d.criticalCount : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: High */}
              <div className="flex items-center gap-1">
                <span className="w-16 text-[10px] text-amber-400 font-bold shrink-0 truncate">
                  HIGH
                </span>
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {diurnalData.map((d) => (
                    <button
                      key={`high-${d.hour}`}
                      onClick={() => setSelectedHour(d.hour)}
                      className={`h-6 rounded flex items-center justify-center border text-[10px] transition cursor-pointer ${getHeatmapCellColor(
                        d.highCount,
                        'HIGH'
                      )} ${selectedHour === d.hour ? 'ring-2 ring-white z-10 scale-105' : ''}`}
                      title={`${d.hourLabel} High Anomalies: ${d.highCount}`}
                    >
                      {d.highCount > 0 ? d.highCount : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Moderate */}
              <div className="flex items-center gap-1">
                <span className="w-16 text-[10px] text-yellow-300 font-medium shrink-0 truncate">
                  MODERATE
                </span>
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {diurnalData.map((d) => (
                    <button
                      key={`mod-${d.hour}`}
                      onClick={() => setSelectedHour(d.hour)}
                      className={`h-6 rounded flex items-center justify-center border text-[10px] transition cursor-pointer ${getHeatmapCellColor(
                        d.moderateCount,
                        'MODERATE'
                      )} ${selectedHour === d.hour ? 'ring-2 ring-white z-10 scale-105' : ''}`}
                      title={`${d.hourLabel} Moderate Anomalies: ${d.moderateCount}`}
                    >
                      {d.moderateCount > 0 ? d.moderateCount : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Low */}
              <div className="flex items-center gap-1">
                <span className="w-16 text-[10px] text-cyan-400 font-medium shrink-0 truncate">
                  LOW
                </span>
                <div className="grid grid-cols-24 gap-1 flex-1">
                  {diurnalData.map((d) => (
                    <button
                      key={`low-${d.hour}`}
                      onClick={() => setSelectedHour(d.hour)}
                      className={`h-6 rounded flex items-center justify-center border text-[10px] transition cursor-pointer ${getHeatmapCellColor(
                        d.lowCount,
                        'LOW'
                      )} ${selectedHour === d.hour ? 'ring-2 ring-white z-10 scale-105' : ''}`}
                      title={`${d.hourLabel} Low Anomalies: ${d.lowCount}`}
                    >
                      {d.lowCount > 0 ? d.lowCount : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Hour Shift Deep-Dive Inspector Card */}
      <div className="bg-slate-950 p-3.5 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-bold text-xs">
              {activeHourData.hourLabel} - {((activeHourData.hour + 1) % 24).toString().padStart(2, '0')}:00
            </span>
            <span className="font-bold text-white text-sm">
              {activeHourData.shiftName}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-400">
              Hour Severity Index:{' '}
              <strong className={activeHourData.severityIndex > 70 ? 'text-rose-400' : 'text-amber-400'}>
                {activeHourData.severityIndex} / 100
              </strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-orange-400 flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5" />
              <span>{activeHourData.ambientHeatC}°C Ambient</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Severity Distribution for this Hour */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">
              ANOMALY FREQUENCY BREAKDOWN
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white font-mono">
                {activeHourData.totalFrequency}
              </span>
              <span className="text-xs text-slate-400 font-mono">Total Anomalies</span>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-[11px] font-mono">
              <span className="text-rose-400 font-bold">{activeHourData.criticalCount} Crit</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-bold">{activeHourData.highCount} High</span>
              <span className="text-slate-600">·</span>
              <span className="text-yellow-400">{activeHourData.moderateCount} Mod</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">{activeHourData.lowCount} Low</span>
            </div>
          </div>

          {/* Primary Hazard Analysis */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
              DOMINANT PHYSIOLOGICAL HAZARD
            </span>
            <div className="text-slate-200 font-semibold text-xs mt-1">
              {activeHourData.primaryHazard}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
              <span>Monitored across {zones.length} active workforce cohorts</span>
            </div>
          </div>

          {/* Operational Directive Action */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold block mb-1 flex items-center gap-1">
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>SUPERVISORY DIRECTIVE</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-snug">
                {activeHourData.directive}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

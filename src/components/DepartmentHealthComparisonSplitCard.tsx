import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { FacilityZone } from '../types';
import { DateRangeSelection } from './DateRangePicker';

export interface DepartmentHistoricalComparison {
  departmentId: string;
  departmentName: string;
  facilityLocation: string;
  cohortSize: number;
  currentMonth: {
    periodLabel: string;
    avgHeartRate: number;
    avgHrv: number;
    avgSkinTemp: number;
    avgTwl: number;
    healthScore: number;
    anomalyCount: number;
    criticalIncidents: number;
    status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  };
  previousMonth: {
    periodLabel: string;
    avgHeartRate: number;
    avgHrv: number;
    avgSkinTemp: number;
    avgTwl: number;
    healthScore: number;
    anomalyCount: number;
    criticalIncidents: number;
    status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  };
  keyInsight: string;
  primaryMitigation: string;
}

export const DEPARTMENT_COMPARISON_DATA: DepartmentHistoricalComparison[] = [
  {
    departmentId: 'Outdoor-Construction-Sector-4',
    departmentName: 'Civil & Structural Construction',
    facilityLocation: 'GCC Megasite - Sector 4',
    cohortSize: 18,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 84,
      avgHrv: 58.4,
      avgSkinTemp: 37.1,
      avgTwl: 124,
      healthScore: 71,
      anomalyCount: 16,
      criticalIncidents: 4,
      status: 'CRITICAL'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 89,
      avgHrv: 52.1,
      avgSkinTemp: 37.6,
      avgTwl: 108,
      healthScore: 62,
      anomalyCount: 24,
      criticalIncidents: 7,
      status: 'CRITICAL'
    },
    keyInsight: 'HRV increased +6.3ms and critical incidents decreased by 43% following automated misting tent deployment and mandatory 15-minute hydration rotations.',
    primaryMitigation: 'Shaded cooling extraction tent & microclimate hydration fans active'
  },
  {
    departmentId: 'Warehouse-Logistics-Hub-North',
    departmentName: 'Supply Chain & High-Bay Fulfillment',
    facilityLocation: 'London Gateway - Hub North',
    cohortSize: 25,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 75,
      avgHrv: 64.2,
      avgSkinTemp: 36.6,
      avgTwl: 148,
      healthScore: 82,
      anomalyCount: 7,
      criticalIncidents: 1,
      status: 'MODERATE'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 78,
      avgHrv: 61.5,
      avgSkinTemp: 36.8,
      avgTwl: 142,
      healthScore: 77,
      anomalyCount: 11,
      criticalIncidents: 2,
      status: 'MODERATE'
    },
    keyInsight: 'Kinetic ergonomics schedule adjustments reduced shift-end autonomic fatigue by 22% across high-bay picking cohorts.',
    primaryMitigation: 'Staggered robotic gantry picking cycles & ergonomic rotation'
  },
  {
    departmentId: 'Subgrade-Tunnel-Conduit-7',
    departmentName: 'Underground Infrastructure & Conduit',
    facilityLocation: 'Tunnel Complex - Conduit 7',
    cohortSize: 14,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 82,
      avgHrv: 56.8,
      avgSkinTemp: 37.0,
      avgTwl: 132,
      healthScore: 74,
      anomalyCount: 12,
      criticalIncidents: 3,
      status: 'CRITICAL'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 87,
      avgHrv: 51.0,
      avgSkinTemp: 37.4,
      avgTwl: 116,
      healthScore: 65,
      anomalyCount: 18,
      criticalIncidents: 6,
      status: 'CRITICAL'
    },
    keyInsight: 'Forced-air tunnel ventilation upgrade reduced core heat build-up and elevated mean TWL by +16 W/m².',
    primaryMitigation: 'High-volume axial airflow blowers & dual-channel acoustic ear defenders'
  },
  {
    departmentId: 'Manufacturing-Assembly-Line-B',
    departmentName: 'Precision Robotics & Mechatronics',
    facilityLocation: 'Bay Area Plant - Line B',
    cohortSize: 42,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 71,
      avgHrv: 72.5,
      avgSkinTemp: 36.3,
      avgTwl: 168,
      healthScore: 92,
      anomalyCount: 3,
      criticalIncidents: 0,
      status: 'STABLE'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 72,
      avgHrv: 70.8,
      avgSkinTemp: 36.4,
      avgTwl: 165,
      healthScore: 90,
      anomalyCount: 4,
      criticalIncidents: 0,
      status: 'STABLE'
    },
    keyInsight: 'Autonomous climate controls maintain optimal physiological baseline with zero recorded critical anomalies.',
    primaryMitigation: 'HEPA microfiltration & active vibration dampening mounts'
  },
  {
    departmentId: 'Chemical-Refining-Plant-C',
    departmentName: 'Hazardous Process Chemistry',
    facilityLocation: 'Gulf Coast Facility - Unit C',
    cohortSize: 16,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 79,
      avgHrv: 62.0,
      avgSkinTemp: 36.9,
      avgTwl: 138,
      healthScore: 78,
      anomalyCount: 9,
      criticalIncidents: 2,
      status: 'MODERATE'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 83,
      avgHrv: 57.5,
      avgSkinTemp: 37.3,
      avgTwl: 125,
      healthScore: 70,
      anomalyCount: 14,
      criticalIncidents: 4,
      status: 'CRITICAL'
    },
    keyInsight: 'Positive-pressure cooling suits reduced exertional cardiac demand by 4 BPM and boosted cohort recovery.',
    primaryMitigation: 'Continuous VOC vapor scavengers & chilled PPE micro-loops'
  },
  {
    departmentId: 'Cold-Chain-Cryogenic-Alpha',
    departmentName: 'Cold Chain & Cryogenic Logistics',
    facilityLocation: 'Rotterdam Port - Cryo Vault A',
    cohortSize: 12,
    currentMonth: {
      periodLabel: 'Current Month (Oct / Nov 2026)',
      avgHeartRate: 69,
      avgHrv: 74.0,
      avgSkinTemp: 35.8,
      avgTwl: 178,
      healthScore: 94,
      anomalyCount: 2,
      criticalIncidents: 0,
      status: 'STABLE'
    },
    previousMonth: {
      periodLabel: 'Previous Month (Sept / Oct 2026)',
      avgHeartRate: 70,
      avgHrv: 72.8,
      avgSkinTemp: 35.9,
      avgTwl: 175,
      healthScore: 93,
      anomalyCount: 3,
      criticalIncidents: 0,
      status: 'STABLE'
    },
    keyInsight: 'Thermal transition airlocks prevent hypothermic shock; physiological homeostasis strictly maintained.',
    primaryMitigation: 'Heated recovery anteroom & 45-minute cold-zone exposure cap'
  }
];

interface DepartmentHealthComparisonSplitCardProps {
  zones?: FacilityZone[];
  dateRange?: DateRangeSelection;
  selectedDepartmentId?: string;
  onSelectDepartmentId?: (id: string) => void;
  className?: string;
}

export default function DepartmentHealthComparisonSplitCard({
  zones,
  dateRange,
  selectedDepartmentId,
  onSelectDepartmentId,
  className = ''
}: DepartmentHealthComparisonSplitCardProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(selectedDepartmentId || 'Outdoor-Construction-Sector-4');
  const [viewMode, setViewMode] = useState<'SPLIT_CARD' | 'ALL_DEPARTMENTS_TABLE'>('SPLIT_CARD');

  // Synchronize if external selectedDepartmentId changes
  useEffect(() => {
    if (selectedDepartmentId) {
      setSelectedDeptId(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);

  const handleSelectDept = (id: string) => {
    setSelectedDeptId(id);
    onSelectDepartmentId?.(id);
  };

  const selectedDept =
    DEPARTMENT_COMPARISON_DATA.find((d) => d.departmentId === selectedDeptId) ||
    DEPARTMENT_COMPARISON_DATA[0];

  // Dynamic time scaling based on date range days count (e.g. 7D, 14D, 30D, 90D)
  const timeScale = dateRange ? dateRange.daysCount / 30 : 1;

  const current = useMemo(() => {
    if (!dateRange || dateRange.preset === '30D') return selectedDept.currentMonth;
    return {
      ...selectedDept.currentMonth,
      periodLabel: `Active Filter: ${dateRange.label} (${dateRange.startDate} – ${dateRange.endDate})`,
      anomalyCount: Math.max(1, Math.round(selectedDept.currentMonth.anomalyCount * timeScale)),
      criticalIncidents: Math.max(0, Math.round(selectedDept.currentMonth.criticalIncidents * timeScale))
    };
  }, [selectedDept, dateRange, timeScale]);

  const previous = useMemo(() => {
    if (!dateRange || dateRange.preset === '30D') return selectedDept.previousMonth;
    return {
      ...selectedDept.previousMonth,
      periodLabel: `Comparative Historical Benchmark (Prior ${dateRange.daysCount} Days Window)`,
      anomalyCount: Math.max(1, Math.round(selectedDept.previousMonth.anomalyCount * timeScale)),
      criticalIncidents: Math.max(0, Math.round(selectedDept.previousMonth.criticalIncidents * timeScale))
    };
  }, [selectedDept, dateRange, timeScale]);

  // Compute metric deltas
  const hrDelta = current.avgHeartRate - previous.avgHeartRate; // negative is improvement
  const hrvDelta = Number((current.avgHrv - previous.avgHrv).toFixed(1)); // positive is improvement
  const skinDelta = Number((current.avgSkinTemp - previous.avgSkinTemp).toFixed(1)); // negative is improvement
  const twlDelta = current.avgTwl - previous.avgTwl; // positive is improvement
  const healthDelta = current.healthScore - previous.healthScore; // positive is improvement
  const anomalyDelta = current.anomalyCount - previous.anomalyCount; // negative is improvement

  return (
    <div
      id="department-health-comparison-split-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition hover:border-slate-700/80 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-600/20 to-indigo-600/20 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Department Health Metrics vs. Previous Month Historical Averages</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Split-View Comparison
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Side-by-side longitudinal variance comparing current workforce physiological metrics against the prior month rolling baseline
          </p>
          {dateRange && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded w-fit">
              <Calendar className="h-3 w-3" />
              <span>Timeframe Filtered: {dateRange.label} ({dateRange.daysCount} Days)</span>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setViewMode('SPLIT_CARD')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'SPLIT_CARD'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Split Card View
          </button>
          <button
            onClick={() => setViewMode('ALL_DEPARTMENTS_TABLE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'ALL_DEPARTMENTS_TABLE'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Departments Table
          </button>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {DEPARTMENT_COMPARISON_DATA.map((dept) => {
          const isSelected = dept.departmentId === selectedDeptId;
          return (
            <button
              key={dept.departmentId}
              onClick={() => handleSelectDept(dept.departmentId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Building2 className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{dept.departmentName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  dept.currentMonth.status === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300'
                    : dept.currentMonth.status === 'MODERATE'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                {dept.currentMonth.healthScore}%
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === 'SPLIT_CARD' ? (
        <>
          {/* Active Department Details Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedDept.departmentName}</span>
              <span className="text-slate-500 font-mono">({selectedDept.facilityLocation})</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                Cohort: {selectedDept.cohortSize} Workers
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400">Homeostasis Shift:</span>
              <span
                className={`font-bold flex items-center gap-1 px-2 py-0.5 rounded ${
                  healthDelta >= 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {healthDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{healthDelta >= 0 ? `+${healthDelta}% Improvement` : `${healthDelta}% Strain`}</span>
              </span>
            </div>
          </div>

          {/* Main Side-by-Side Split Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left Card: Current Month (Real-Time Live Cohort Operations) */}
            <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                      {current.periodLabel}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      current.status === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                        : current.status === 'MODERATE'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    }`}
                  >
                    {current.status} RISK TIER
                  </span>
                </div>

                {/* Big Core Score */}
                <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">
                      Workforce Health Safety Score
                    </div>
                    <div className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
                      {current.healthScore}%
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <div>Anomalies: <strong className="text-rose-400">{current.anomalyCount} events</strong></div>
                    <div>Critical: <strong className="text-rose-300">{current.criticalIncidents} active</strong></div>
                  </div>
                </div>

                {/* Metric Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      <span>Workforce Heart Rate:</span>
                    </span>
                    <span className="font-mono font-bold text-rose-300">{current.avgHeartRate} BPM</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Kalman-Smoothed HRV:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{current.avgHrv} ms</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                      <span>Surface Skin Temperature:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">{current.avgSkinTemp}°C</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                      <span>Thermal Work Limit (TWL):</span>
                    </span>
                    <span className="font-mono font-bold text-blue-300">{current.avgTwl} W/m²</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Live Telemetry &bull; Ingestion Rate: 15s</span>
              </div>
            </div>

            {/* Right Card: Previous Month (Historical Averages) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-indigo-600" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">
                      {previous.periodLabel}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      previous.status === 'CRITICAL'
                        ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                        : previous.status === 'MODERATE'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {previous.status} BASELINE
                  </span>
                </div>

                {/* Big Historical Score */}
                <div className="my-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">
                      Historical Month Baseline
                    </div>
                    <div className="text-3xl font-bold font-mono text-slate-300 tabular-nums">
                      {previous.healthScore}%
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <div>Anomalies: <strong className="text-slate-300">{previous.anomalyCount} events</strong></div>
                    <div>Critical: <strong className="text-slate-300">{previous.criticalIncidents} events</strong></div>
                  </div>
                </div>

                {/* Metric Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-slate-400" />
                      <span>Workforce Heart Rate:</span>
                    </span>
                    <span className="font-mono text-slate-300">{previous.avgHeartRate} BPM</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      <span>Kalman-Smoothed HRV:</span>
                    </span>
                    <span className="font-mono text-slate-300">{previous.avgHrv} ms</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                      <span>Surface Skin Temperature:</span>
                    </span>
                    <span className="font-mono text-slate-300">{previous.avgSkinTemp}°C</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      <span>Thermal Work Limit (TWL):</span>
                    </span>
                    <span className="font-mono text-slate-300">{previous.avgTwl} W/m²</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Rolling 30-Day Epoch &bull; OSHA / ISO 45001 Audited</span>
              </div>
            </div>
          </div>

          {/* Variance & Operational Insights Footer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            {/* Metric Shift Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-semibold font-mono text-[11px]">Variance vs Prior Month:</span>
              <span
                className={`px-2 py-1 rounded-lg font-mono font-bold flex items-center gap-1 border ${
                  hrDelta <= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                Pulse: {hrDelta <= 0 ? `${hrDelta} BPM` : `+${hrDelta} BPM`}
              </span>

              <span
                className={`px-2 py-1 rounded-lg font-mono font-bold flex items-center gap-1 border ${
                  hrvDelta >= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                HRV: {hrvDelta >= 0 ? `+${hrvDelta} ms` : `${hrvDelta} ms`}
              </span>

              <span
                className={`px-2 py-1 rounded-lg font-mono font-bold flex items-center gap-1 border ${
                  twlDelta >= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                TWL: {twlDelta >= 0 ? `+${twlDelta} W/m²` : `${twlDelta} W/m²`}
              </span>

              <span
                className={`px-2 py-1 rounded-lg font-mono font-bold flex items-center gap-1 border ${
                  anomalyDelta <= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                }`}
              >
                Anomalies: {anomalyDelta <= 0 ? `${anomalyDelta} events` : `+${anomalyDelta} events`}
              </span>
            </div>

            {/* Operational Directive / Action Insight */}
            <div className="text-slate-400 text-xs max-w-lg">
              <span className="text-cyan-400 font-bold">Clinical Analysis: </span>
              <span>{selectedDept.keyInsight}</span>
            </div>
          </div>
        </>
      ) : (
        /* All Departments Comparison Table */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Current Score</th>
                <th className="py-2.5 px-3">Prior Month</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Pulse (Now vs Prior)</th>
                <th className="py-2.5 px-3">HRV (Now vs Prior)</th>
                <th className="py-2.5 px-3">TWL (Now vs Prior)</th>
                <th className="py-2.5 px-3">Active Hazards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {DEPARTMENT_COMPARISON_DATA.map((dept) => {
                const delta = dept.currentMonth.healthScore - dept.previousMonth.healthScore;
                const isSelected = dept.departmentId === selectedDeptId;
                return (
                  <tr
                    key={dept.departmentId}
                    onClick={() => {
                      setSelectedDeptId(dept.departmentId);
                      setViewMode('SPLIT_CARD');
                    }}
                    className={`hover:bg-slate-800/50 transition cursor-pointer ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{dept.departmentName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {dept.facilityLocation}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                      {dept.currentMonth.healthScore}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {dept.previousMonth.healthScore}%
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          delta >= 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {delta >= 0 ? `+${delta}%` : `${delta}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <strong className="text-rose-300">{dept.currentMonth.avgHeartRate}</strong>
                      <span className="text-slate-500"> / {dept.previousMonth.avgHeartRate} BPM</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <strong className="text-cyan-300">{dept.currentMonth.avgHrv}</strong>
                      <span className="text-slate-500"> / {dept.previousMonth.avgHrv} ms</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <strong className="text-blue-300">{dept.currentMonth.avgTwl}</strong>
                      <span className="text-slate-500"> / {dept.previousMonth.avgTwl} W/m²</span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-xs">
                      {dept.primaryMitigation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

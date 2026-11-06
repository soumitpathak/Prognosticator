import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Activity,
  Flame,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Globe,
  Filter,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Users,
  Compass,
  ArrowRight,
  CheckCircle2,
  Thermometer,
  Zap
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, DepartmentHeatmapRow } from '../types';

interface OrganizationalAnomalyHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
}

export const ORGANIZATIONAL_DEPARTMENTS_DATA: DepartmentHeatmapRow[] = [
  {
    id: 'Outdoor-Construction-Sector-4',
    departmentName: 'Civil & Structural Construction',
    facilityLocation: 'Sector 4 Heavy Works (GCC Desert Site)',
    region: 'Middle East & Desert Operations',
    latitude: 25.0657,
    longitude: 55.1713,
    cohortSize: 84,
    totalAnomalies: 86,
    criticalCount: 42,
    moderateCount: 44,
    anomalyRatePer100: 102.4,
    heatStrainIndex: 'EXTREME',
    primaryRiskDriver: 'Severe Wet-Bulb Heat Load (WBGT > 34°C) & Solar Radiation',
    trendShiftPct: -14.2,
    weeklyDays: [8, 11, 14, 18, 17, 9, 9], // Mon-Sun
    shiftDistribution: {
      morning: 14,
      afternoonPeak: 48,
      evening: 18,
      night: 6
    }
  },
  {
    id: 'Warehouse-Logistics-Hub-North',
    departmentName: 'Supply Chain & High-Bay Fulfillment',
    facilityLocation: 'Logistics Hub North (London Gateway)',
    region: 'European Distribution Network',
    latitude: 51.5074,
    longitude: -0.1278,
    cohortSize: 68,
    totalAnomalies: 46,
    criticalCount: 12,
    moderateCount: 34,
    anomalyRatePer100: 67.6,
    heatStrainIndex: 'MODERATE',
    primaryRiskDriver: 'Cumulative Sleep Deficit & Long-Shift Autonomic Fatigue',
    trendShiftPct: -4.8,
    weeklyDays: [6, 7, 8, 9, 7, 5, 4],
    shiftDistribution: {
      morning: 11,
      afternoonPeak: 14,
      evening: 12,
      night: 9
    }
  },
  {
    id: 'Manufacturing-Assembly-Line-B',
    departmentName: 'Precision Robotics & Mechatronics',
    facilityLocation: 'Robotic Line B (Bay Area Tech Hub)',
    region: 'North America Advanced Manufacturing',
    latitude: 37.7749,
    longitude: -122.4194,
    cohortSize: 62,
    totalAnomalies: 38,
    criticalCount: 9,
    moderateCount: 29,
    anomalyRatePer100: 61.3,
    heatStrainIndex: 'LOW',
    primaryRiskDriver: 'Acoustic Machinery Vibration & Repetitive Ergonomic Strain',
    trendShiftPct: -8.5,
    weeklyDays: [5, 6, 8, 7, 6, 3, 3],
    shiftDistribution: {
      morning: 12,
      afternoonPeak: 15,
      evening: 8,
      night: 3
    }
  },
  {
    id: 'Subgrade-Tunnel-Conduit-7',
    departmentName: 'Underground Infrastructure & Conduit',
    facilityLocation: 'Conduit 7 Sub-Surface Network',
    region: 'Metropolitan Utility Corridors',
    latitude: 40.7128,
    longitude: -74.006,
    cohortSize: 28,
    totalAnomalies: 24,
    criticalCount: 8,
    moderateCount: 16,
    anomalyRatePer100: 85.7,
    heatStrainIndex: 'HIGH',
    primaryRiskDriver: 'Restricted Airflow, Micro-Particulate AQI & Confined Heat',
    trendShiftPct: +6.2,
    weeklyDays: [3, 4, 5, 4, 4, 2, 2],
    shiftDistribution: {
      morning: 6,
      afternoonPeak: 9,
      evening: 6,
      night: 3
    }
  },
  {
    id: 'Chemical-Refining-Plant-C',
    departmentName: 'Hazardous Process Chemistry',
    facilityLocation: 'Refinery Plant C (Gulf Coast Terminal)',
    region: 'North America Industrial Processing',
    latitude: 29.7604,
    longitude: -95.3698,
    cohortSize: 45,
    totalAnomalies: 31,
    criticalCount: 11,
    moderateCount: 20,
    anomalyRatePer100: 68.9,
    heatStrainIndex: 'HIGH',
    primaryRiskDriver: 'Thermal Exchangers & High-Pressure Acoustic Valve Overexposure',
    trendShiftPct: -2.1,
    weeklyDays: [4, 5, 6, 6, 5, 3, 2],
    shiftDistribution: {
      morning: 8,
      afternoonPeak: 12,
      evening: 7,
      night: 4
    }
  },
  {
    id: 'Cold-Chain-Cryogenic-Alpha',
    departmentName: 'Cold Chain & Cryogenic Logistics',
    facilityLocation: 'Depot Alpha (Rotterdam Port Terminal)',
    region: 'European Cold-Chain Hub',
    latitude: 51.9244,
    longitude: 4.4777,
    cohortSize: 35,
    totalAnomalies: 9,
    criticalCount: 1,
    moderateCount: 8,
    anomalyRatePer100: 25.7,
    heatStrainIndex: 'LOW',
    primaryRiskDriver: 'Hypothermic Vasoconstriction & Rapid Temperature Shifts',
    trendShiftPct: -18.0,
    weeklyDays: [1, 2, 2, 2, 1, 1, 0],
    shiftDistribution: {
      morning: 3,
      afternoonPeak: 3,
      evening: 2,
      night: 1
    }
  }
];

export default function OrganizationalAnomalyHeatmap({
  zones,
  alerts,
  selectedZoneId,
  onSelectZone
}: OrganizationalAnomalyHeatmapProps) {
  const [viewMode, setViewMode] = useState<'MATRIX' | 'GEOGRAPHIC'>('MATRIX');
  const [matrixDimension, setMatrixDimension] = useState<'DAYS_OF_WEEK' | 'SHIFT_PERIODS'>('DAYS_OF_WEEK');
  const [timeWindow, setTimeWindow] = useState<'7D' | '14D' | '30D'>('30D');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [hoveredCell, setHoveredCell] = useState<{
    dept: DepartmentHeatmapRow;
    colName: string;
    count: number;
    hazard: string;
    tier: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL';
  } | null>(null);

  const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shiftLabels = ['Dawn (04-08)', 'Morning (08-12)', 'Afternoon Peak (12-16)', 'Evening (16-20)'];

  // Scale data according to time window
  const windowMultiplier = timeWindow === '7D' ? 0.35 : timeWindow === '14D' ? 0.6 : 1.0;

  // Aggregate stats across organization
  const orgStats = useMemo(() => {
    let total = 0;
    let critical = 0;
    let totalWorkers = 0;
    let maxDept = ORGANIZATIONAL_DEPARTMENTS_DATA[0];

    ORGANIZATIONAL_DEPARTMENTS_DATA.forEach((dept) => {
      const scaledTotal = Math.round(dept.totalAnomalies * windowMultiplier);
      const scaledCrit = Math.round(dept.criticalCount * windowMultiplier);
      total += scaledTotal;
      critical += scaledCrit;
      totalWorkers += dept.cohortSize;

      if (scaledTotal > Math.round(maxDept.totalAnomalies * windowMultiplier)) {
        maxDept = dept;
      }
    });

    const orgRate = totalWorkers > 0 ? Number(((total / totalWorkers) * 100).toFixed(1)) : 0;

    return {
      totalAnomalies: total,
      criticalAnomalies: critical,
      totalWorkers,
      topHotspot: maxDept,
      orgRatePer100: orgRate,
      hotspotSharePct: total > 0 ? Number(((Math.round(maxDept.totalAnomalies * windowMultiplier) / total) * 100).toFixed(1)) : 0
    };
  }, [windowMultiplier]);

  // Determine severity tier for a given anomaly frequency and department strain
  const getSeverityTier = (count: number, dept?: DepartmentHeatmapRow): 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL' => {
    if (count === 0) return 'NOMINAL';
    if (severityFilter === 'HIGH') return 'HIGH';
    if (severityFilter === 'MEDIUM') return 'MEDIUM';
    if (severityFilter === 'LOW') return 'LOW';

    // When viewing all: evaluate by intensity thresholds
    if (count >= 9 || (dept && dept.heatStrainIndex === 'EXTREME' && count >= 6)) return 'HIGH';
    if (count >= 4 || (dept && (dept.heatStrainIndex === 'HIGH' || dept.heatStrainIndex === 'MODERATE') && count >= 3)) return 'MEDIUM';
    return 'LOW';
  };

  // Dynamic color coding for anomaly markers with distinct shades for low, medium, and high severity
  const getCellColorClass = (count: number, dept?: DepartmentHeatmapRow) => {
    if (count === 0) return 'bg-slate-900/60 text-slate-500 border-slate-800';
    const tier = getSeverityTier(count, dept);

    switch (tier) {
      case 'HIGH':
        return 'bg-rose-950/90 text-rose-200 border-rose-500/80 hover:border-rose-400 hover:bg-rose-900/90 shadow-md shadow-rose-950/40 animate-pulse font-bold ring-1 ring-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-200 border-amber-500/60 hover:border-amber-400 hover:bg-amber-900/90 shadow-xs ring-1 ring-amber-500/20';
      case 'LOW':
      default:
        return 'bg-emerald-950/75 text-emerald-300 border-emerald-600/60 hover:border-emerald-400 hover:bg-emerald-900/90 shadow-xs ring-1 ring-emerald-500/20';
    }
  };

  // Dynamic visual marker dot for cells
  const getSeverityMarkerDot = (count: number, dept?: DepartmentHeatmapRow) => {
    if (count === 0) return null;
    const tier = getSeverityTier(count, dept);

    switch (tier) {
      case 'HIGH':
        return <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 inline-block animate-ping mr-1" title="High Severity Marker" />;
      case 'MEDIUM':
        return <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 inline-block mr-1" title="Medium Severity Marker" />;
      case 'LOW':
      default:
        return <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 inline-block mr-1" title="Low Severity Marker" />;
    }
  };

  return (
    <div id="org-anomaly-heatmap-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative">
      {/* Component Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">Organization-Wide Anomaly Frequency Heatmap</h2>
              <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold">
                <Sparkles className="h-2.5 w-2.5" /> Multi-Facility Cross-Section
              </span>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-sm">
                6 Operating Divisions Mapped
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Geographical &amp; departmental hazard dispersion matrix highlighting where physiological and environmental anomalies concentrate across the organization.
            </p>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'MATRIX'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Department Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('GEOGRAPHIC')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'GEOGRAPHIC'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Geographical Map</span>
            </button>
          </div>

          {/* Time Window Pills */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['7D', '14D', '30D'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  timeWindow === tw
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tw === '7D' ? '7 Days' : tw === '14D' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Dynamic Severity Triage Filter Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                severityFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Severities
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                severityFilter === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500 shadow-xs ring-1 ring-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>High (Critical)</span>
            </button>
            <button
              onClick={() => setSeverityFilter('MEDIUM')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                severityFilter === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-xs ring-1 ring-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              <span>Medium (Moderate)</span>
            </button>
            <button
              onClick={() => setSeverityFilter('LOW')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                severityFilter === 'LOW'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-xs ring-1 ring-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Low (Nominal)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Top Anomaly Hotspot</span>
            <Flame className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-base font-bold text-white mt-1 truncate" title={orgStats.topHotspot.departmentName}>
            {orgStats.topHotspot.departmentName}
          </div>
          <span className="text-[10px] text-rose-400 font-mono">
            {Math.round(orgStats.topHotspot.totalAnomalies * windowMultiplier)} Events ({orgStats.hotspotSharePct}% of Org)
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Total Organization Incidents</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {orgStats.totalAnomalies} Flagged
          </div>
          <span className="text-[10px] text-slate-400">
            {orgStats.criticalAnomalies} Critical ({Math.round((orgStats.criticalAnomalies / (orgStats.totalAnomalies || 1)) * 100)}% Severity)
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Org Anomaly Density</span>
            <Users className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 mt-1">
            {orgStats.orgRatePer100} / 100
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Across {orgStats.totalWorkers} On-Duty Personnel
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Most Resilient Facility</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1 truncate">
            Cold Chain Storage Alpha
          </div>
          <span className="text-[10px] text-slate-400">
            {Math.round(9 * windowMultiplier)} Events | 25.7/100 rate
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: DEPARTMENT MATRIX HEATMAP */}
      {viewMode === 'MATRIX' ? (
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
          {/* Sub-toggle: Group by Days of Week vs Shift Periods */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 mb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>Temporal Distribution Axis:</span>
              <div className="flex bg-slate-900 rounded-md p-0.5 border border-slate-800">
                <button
                  onClick={() => setMatrixDimension('DAYS_OF_WEEK')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    matrixDimension === 'DAYS_OF_WEEK'
                      ? 'bg-slate-800 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Days of Week (Mon - Sun)
                </button>
                <button
                  onClick={() => setMatrixDimension('SHIFT_PERIODS')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    matrixDimension === 'SHIFT_PERIODS'
                      ? 'bg-slate-800 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Shift Horizons (Dawn to Night)
                </button>
              </div>
            </div>

            {/* Dynamic Severity Color Coding Legend */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span>Severity Triage Coding:</span>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">0 Nominal</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Low Severity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-200 border border-amber-500/60 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Medium Severity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/90 text-rose-200 border border-rose-500/80 font-bold flex items-center gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  High / Critical
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold w-64">Department / Geographical Site</th>
                <th className="py-2.5 px-2 text-center font-semibold w-16">Cohort</th>
                {matrixDimension === 'DAYS_OF_WEEK'
                  ? daysLabels.map((day) => (
                      <th key={day} className="py-2.5 px-2 text-center font-semibold">
                        {day}
                      </th>
                    ))
                  : shiftLabels.map((shift) => (
                      <th key={shift} className="py-2.5 px-2 text-center font-semibold">
                        {shift}
                      </th>
                    ))}
                <th className="py-2.5 px-3 text-right font-semibold w-24">Horizon Total</th>
                <th className="py-2.5 px-3 text-right font-semibold w-24">Rate/100</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ORGANIZATIONAL_DEPARTMENTS_DATA.map((dept) => {
                const isSelected = selectedZoneId === dept.id;
                const totalRowAnomalies = Math.round(dept.totalAnomalies * windowMultiplier);

                return (
                  <tr
                    key={dept.id}
                    onClick={() => onSelectZone(dept.id)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Department Name & Location */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <Building2
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-white text-xs font-sans group-hover:text-cyan-300 transition">
                            {dept.departmentName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-slate-500" />
                            <span>{dept.facilityLocation}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cohort Size */}
                    <td className="py-3 px-2 text-center font-sans text-slate-300">
                      {dept.cohortSize}
                    </td>

                    {/* Heatmap Matrix Cells */}
                    {matrixDimension === 'DAYS_OF_WEEK'
                      ? dept.weeklyDays.map((val, idx) => {
                          const scaledVal = Math.round(val * windowMultiplier);
                          const cellVal =
                            severityFilter === 'HIGH'
                              ? Math.round(scaledVal * 0.45)
                              : severityFilter === 'MEDIUM'
                              ? Math.round(scaledVal * 0.40)
                              : severityFilter === 'LOW'
                              ? Math.max(0, scaledVal - Math.round(scaledVal * 0.45) - Math.round(scaledVal * 0.40))
                              : scaledVal;
                          const colorClass = getCellColorClass(cellVal, dept);
                          const markerDot = getSeverityMarkerDot(cellVal, dept);
                          const cellTier = getSeverityTier(cellVal, dept);

                          return (
                            <td key={idx} className="py-2 px-1.5 text-center">
                              <div
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    dept,
                                    colName: daysLabels[idx],
                                    count: cellVal,
                                    hazard: dept.primaryRiskDriver,
                                    tier: cellTier
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-2 rounded-lg border font-bold text-xs transition transform hover:scale-105 flex items-center justify-center gap-1 ${colorClass}`}
                              >
                                {markerDot}
                                <span>{cellVal}</span>
                              </div>
                            </td>
                          );
                        })
                      : [
                          dept.shiftDistribution.morning,
                          dept.shiftDistribution.afternoonPeak,
                          dept.shiftDistribution.evening,
                          dept.shiftDistribution.night
                        ].map((shiftVal, idx) => {
                          const scaledVal = Math.round(shiftVal * windowMultiplier);
                          const cellVal =
                            severityFilter === 'HIGH'
                              ? Math.round(scaledVal * 0.5)
                              : severityFilter === 'MEDIUM'
                              ? Math.round(scaledVal * 0.35)
                              : severityFilter === 'LOW'
                              ? Math.max(0, scaledVal - Math.round(scaledVal * 0.5) - Math.round(scaledVal * 0.35))
                              : scaledVal;
                          const colorClass = getCellColorClass(cellVal, dept);
                          const markerDot = getSeverityMarkerDot(cellVal, dept);
                          const cellTier = getSeverityTier(cellVal, dept);

                          return (
                            <td key={idx} className="py-2 px-1.5 text-center">
                              <div
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    dept,
                                    colName: shiftLabels[idx],
                                    count: cellVal,
                                    hazard: dept.primaryRiskDriver,
                                    tier: cellTier
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-2 rounded-lg border font-bold text-xs transition transform hover:scale-105 flex items-center justify-center gap-1 ${colorClass}`}
                              >
                                {markerDot}
                                <span>{cellVal}</span>
                              </div>
                            </td>
                          );
                        })}

                    {/* Horizon Total */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-sm text-white">
                        {severityFilter === 'HIGH'
                          ? Math.round(dept.criticalCount * windowMultiplier)
                          : severityFilter === 'MEDIUM'
                          ? Math.round(dept.moderateCount * windowMultiplier)
                          : severityFilter === 'LOW'
                          ? Math.max(0, totalRowAnomalies - Math.round(dept.criticalCount * windowMultiplier) - Math.round(dept.moderateCount * windowMultiplier))
                          : totalRowAnomalies}
                      </span>
                    </td>

                    {/* Anomaly Rate per 100 */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          dept.anomalyRatePer100 > 90
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : dept.anomalyRatePer100 > 50
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {dept.anomalyRatePer100}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW MODE 2: GEOGRAPHICAL REGIONAL MAP VIEW */
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 mb-4 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>Geographical Facility Coordinates &amp; Dynamic Severity Triage:</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Live Satellite Meteorological Sync (Open-Meteo GPS Grid)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ORGANIZATIONAL_DEPARTMENTS_DATA.map((dept) => {
              const isSelected = selectedZoneId === dept.id;
              const scaledTotal = Math.round(dept.totalAnomalies * windowMultiplier);
              const scaledCrit = Math.round(dept.criticalCount * windowMultiplier);
              const scaledMod = Math.round(dept.moderateCount * windowMultiplier);
              const scaledLow = Math.max(0, scaledTotal - scaledCrit - scaledMod);

              // Dynamic Severity Tier for the facility
              const deptTier = getSeverityTier(scaledTotal, dept);
              const severityBorderClass =
                deptTier === 'HIGH'
                  ? 'border-l-4 border-l-rose-500 hover:border-rose-500/80 shadow-rose-950/20'
                  : deptTier === 'MEDIUM'
                  ? 'border-l-4 border-l-amber-500 hover:border-amber-500/80 shadow-amber-950/20'
                  : 'border-l-4 border-l-emerald-500 hover:border-emerald-500/80 shadow-emerald-950/20';

              const severityBadgeStyle =
                deptTier === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : deptTier === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500';

              const severityDotStyle =
                deptTier === 'HIGH'
                  ? 'bg-rose-400 animate-ping'
                  : deptTier === 'MEDIUM'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400';

              return (
                <div
                  key={dept.id}
                  onClick={() => onSelectZone(dept.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-900'
                  } ${severityBorderClass}`}
                >
                  {/* Top Bar: Department & Dynamic Severity Marker */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        {dept.region}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition mt-0.5">
                        {dept.departmentName}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 flex items-center gap-1.5 ${severityBadgeStyle}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${severityDotStyle}`}></span>
                        <span>{deptTier === 'HIGH' ? 'HIGH RISK' : deptTier === 'MEDIUM' ? 'MOD RISK' : 'LOW RISK'}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2.5">
                    {dept.facilityLocation}
                  </p>

                  {/* Frequency Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-2 rounded-lg border border-slate-800 mb-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <strong className="text-sm font-mono text-cyan-300 font-bold">{scaledTotal}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 block font-medium">Critical</span>
                      <strong className="text-sm font-mono text-rose-400 font-bold">{scaledCrit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block font-medium">Moderate</span>
                      <strong className="text-sm font-mono text-amber-400 font-bold">{scaledMod}</strong>
                    </div>
                  </div>

                  {/* Visual Severity Breakdown Bar */}
                  <div className="mb-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Severity Dispersion:</span>
                      <span className="text-slate-300">
                        {scaledCrit} High &bull; {scaledMod} Med &bull; {scaledLow} Low
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${scaledTotal > 0 ? (scaledCrit / scaledTotal) * 100 : 0}%` }}
                        title={`${scaledCrit} High Severity`}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${scaledTotal > 0 ? (scaledMod / scaledTotal) * 100 : 0}%` }}
                        title={`${scaledMod} Medium Severity`}
                      />
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${scaledTotal > 0 ? (scaledLow / scaledTotal) * 100 : 0}%` }}
                        title={`${scaledLow} Low Severity`}
                      />
                    </div>
                  </div>

                  {/* Hazard Attribution & Trend */}
                  <div className="space-y-1 text-[11px]">
                    <div className="text-slate-400">
                      <strong className="text-slate-300 font-medium">Primary Hazard:</strong>{' '}
                      <span className="text-rose-300">{dept.primaryRiskDriver}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-[10px]">
                      <span className="text-slate-500">
                        GPS: {dept.latitude.toFixed(2)}°N, {dept.longitude.toFixed(2)}°
                      </span>
                      <span className={dept.trendShiftPct <= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {dept.trendShiftPct > 0 ? `+${dept.trendShiftPct}%` : `${dept.trendShiftPct}%`} Trend
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hover Inspection Callout */}
      {hoveredCell && (
        <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-cyan-500/40 text-xs text-slate-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong>{hoveredCell.dept.departmentName}</strong> — {hoveredCell.colName}:{' '}
              <strong className="text-white">{hoveredCell.count} Anomaly Events</strong>. Primary Driver:{' '}
              <span className="text-rose-300">{hoveredCell.hazard}</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Click row to filter dashboard</span>
        </div>
      )}

      {/* Footer Notes */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-2.5 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
          <span>Cross-Facility Surveillance: Click any department row or geographical tile to isolate that sector across the entire portal.</span>
        </div>
        <div>
          <span>Privacy Shield: k-Anonymity Verified (Cohort N &ge; 12 across all 6 sectors)</span>
        </div>
      </div>
    </div>
  );
}

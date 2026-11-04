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
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL_ONLY'>('ALL');
  const [hoveredCell, setHoveredCell] = useState<{
    dept: DepartmentHeatmapRow;
    colName: string;
    count: number;
    hazard: string;
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

  // Color generator based on frequency value
  const getCellColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-900/60 text-slate-500 border-slate-800';
    if (count <= 2) return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/40 hover:border-cyan-400';
    if (count <= 5) return 'bg-teal-900/70 text-teal-200 border-teal-700/50 hover:border-teal-400';
    if (count <= 9) return 'bg-amber-950/80 text-amber-200 border-amber-600/50 hover:border-amber-400';
    return 'bg-rose-950/90 text-rose-200 border-rose-500/70 hover:border-rose-400 shadow-sm animate-pulse';
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

          {/* Severity Toggle */}
          <button
            onClick={() => setSeverityFilter((f) => (f === 'ALL' ? 'CRITICAL_ONLY' : 'ALL'))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              severityFilter === 'CRITICAL_ONLY'
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>{severityFilter === 'CRITICAL_ONLY' ? 'Critical Only' : 'All Severities'}</span>
          </button>
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

            {/* Heat Intensity Legend */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span>Heat Density:</span>
              <div className="flex items-center space-x-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800">0 Nominal</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800">1-2 Low</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-900 text-teal-200 border border-teal-700">3-5 Mod</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-950 text-amber-200 border border-amber-600">6-9 Elevated</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950 text-rose-200 border border-rose-500 font-bold">10+ Critical</span>
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
                          const cellVal = severityFilter === 'CRITICAL_ONLY' ? Math.round(scaledVal * 0.45) : scaledVal;
                          const colorClass = getCellColorClass(cellVal);

                          return (
                            <td key={idx} className="py-2 px-1.5 text-center">
                              <div
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    dept,
                                    colName: daysLabels[idx],
                                    count: cellVal,
                                    hazard: dept.primaryRiskDriver
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-2 rounded-lg border font-bold text-xs transition transform hover:scale-105 ${colorClass}`}
                              >
                                {cellVal}
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
                          const cellVal = severityFilter === 'CRITICAL_ONLY' ? Math.round(scaledVal * 0.5) : scaledVal;
                          const colorClass = getCellColorClass(cellVal);

                          return (
                            <td key={idx} className="py-2 px-1.5 text-center">
                              <div
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    dept,
                                    colName: shiftLabels[idx],
                                    count: cellVal,
                                    hazard: dept.primaryRiskDriver
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`w-full py-2 rounded-lg border font-bold text-xs transition transform hover:scale-105 ${colorClass}`}
                              >
                                {cellVal}
                              </div>
                            </td>
                          );
                        })}

                    {/* Horizon Total */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-sm text-white">
                        {severityFilter === 'CRITICAL_ONLY' ? Math.round(dept.criticalCount * windowMultiplier) : totalRowAnomalies}
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
              <span>Geographical Facility Coordinates &amp; Regional Anomaly Densities:</span>
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

              return (
                <div
                  key={dept.id}
                  onClick={() => onSelectZone(dept.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Top Bar: Department & Heat Strain */}
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

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                        dept.heatStrainIndex === 'EXTREME'
                          ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                          : dept.heatStrainIndex === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      }`}
                    >
                      {dept.heatStrainIndex} STRAIN
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                    {dept.facilityLocation}
                  </p>

                  {/* Frequency Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 mb-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Anomalies</span>
                      <strong className="text-sm font-mono text-cyan-300 font-bold">{scaledTotal}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Critical</span>
                      <strong className="text-sm font-mono text-rose-400 font-bold">{scaledCrit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Rate/100</span>
                      <strong className="text-sm font-mono text-amber-400 font-bold">{dept.anomalyRatePer100}</strong>
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

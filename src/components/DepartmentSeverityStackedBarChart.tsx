import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  BarChart3,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Building2,
  Percent,
  Hash,
  Info,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { FacilityZone } from '../types';

export interface DepartmentSeverityItem {
  id: string;
  departmentName: string;
  departmentShort: string;
  facilityLocation: string;
  region: string;
  cohortSize: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  riskDensityPct: number; // (Critical + High) / Total * 100
  ratePer100Workers: number;
  primaryRiskDriver: string;
}

export const DEPARTMENT_SEVERITY_30D_DATA: DepartmentSeverityItem[] = [
  {
    id: 'Outdoor-Construction-Sector-4',
    departmentName: 'Civil & Structural Construction',
    departmentShort: 'Construction (Sec 4)',
    facilityLocation: 'Sector 4 Heavy Works (GCC Desert Site)',
    region: 'Middle East Operations',
    cohortSize: 84,
    critical: 42,
    high: 22,
    medium: 14,
    low: 8,
    total: 86,
    riskDensityPct: 74.4,
    ratePer100Workers: 102.4,
    primaryRiskDriver: 'Extreme Wet-Bulb Heat Load (WBGT > 34°C) & Solar Radiance'
  },
  {
    id: 'Warehouse-Logistics-Hub-North',
    departmentName: 'Supply Chain & High-Bay Fulfillment',
    departmentShort: 'Logistics (Hub North)',
    facilityLocation: 'Logistics Hub North (London Gateway)',
    region: 'European Network',
    cohortSize: 68,
    critical: 12,
    high: 14,
    medium: 12,
    low: 8,
    total: 46,
    riskDensityPct: 56.5,
    ratePer100Workers: 67.6,
    primaryRiskDriver: 'Cumulative Sleep Deficit & Long-Shift Autonomic Exhaustion'
  },
  {
    id: 'Manufacturing-Assembly-Line-B',
    departmentName: 'Precision Robotics & Mechatronics',
    departmentShort: 'Robotics (Line B)',
    facilityLocation: 'Robotic Line B (Bay Area Tech Hub)',
    region: 'North America Advanced Mfg',
    cohortSize: 62,
    critical: 9,
    high: 11,
    medium: 12,
    low: 6,
    total: 38,
    riskDensityPct: 52.6,
    ratePer100Workers: 61.3,
    primaryRiskDriver: 'High-Frequency Acoustic Machinery Noise & Repetitive Vibration'
  },
  {
    id: 'Chemical-Refining-Plant-C',
    departmentName: 'Hazardous Process Chemistry',
    departmentShort: 'Refining (Plant C)',
    facilityLocation: 'Refinery Plant C (Gulf Coast Terminal)',
    region: 'Industrial Refining',
    cohortSize: 45,
    critical: 11,
    high: 10,
    medium: 6,
    low: 4,
    total: 31,
    riskDensityPct: 67.7,
    ratePer100Workers: 68.9,
    primaryRiskDriver: 'Thermal Exchangers & High-Pressure Acoustic Valve Stress'
  },
  {
    id: 'Subgrade-Tunnel-Conduit-7',
    departmentName: 'Underground Infrastructure & Conduit',
    departmentShort: 'Tunnel (Conduit 7)',
    facilityLocation: 'Conduit 7 Sub-Surface Network',
    region: 'Metropolitan Corridors',
    cohortSize: 28,
    critical: 8,
    high: 7,
    medium: 5,
    low: 4,
    total: 24,
    riskDensityPct: 62.5,
    ratePer100Workers: 85.7,
    primaryRiskDriver: 'Restricted Airflow, Micro-Particulate PM2.5 & Confined Heat'
  },
  {
    id: 'Cold-Chain-Cryogenic-Alpha',
    departmentName: 'Cold Chain & Cryogenic Logistics',
    departmentShort: 'Cold Chain (Alpha)',
    facilityLocation: 'Depot Alpha (Rotterdam Port)',
    region: 'European Cold-Chain',
    cohortSize: 35,
    critical: 1,
    high: 2,
    medium: 4,
    low: 2,
    total: 9,
    riskDensityPct: 33.3,
    ratePer100Workers: 25.7,
    primaryRiskDriver: 'Hypothermic Vasoconstriction & Rapid Temperature Shifts'
  }
];

interface DepartmentSeverityStackedBarChartProps {
  zones?: FacilityZone[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
}

export default function DepartmentSeverityStackedBarChart({
  zones,
  selectedZoneId,
  onSelectZone
}: DepartmentSeverityStackedBarChartProps) {
  const [sortBy, setSortBy] = useState<'RISK_DENSITY' | 'TOTAL_VOLUME' | 'CRITICAL' | 'ALPHABETICAL'>('RISK_DENSITY');
  const [isNormalizedPercent, setIsNormalizedPercent] = useState<boolean>(false);
  const [hoveredDepartmentId, setHoveredDepartmentId] = useState<string | null>(null);

  // Sorted and transformed dataset
  const chartData = useMemo(() => {
    const list = [...DEPARTMENT_SEVERITY_30D_DATA];

    if (sortBy === 'RISK_DENSITY') {
      list.sort((a, b) => b.riskDensityPct - a.riskDensityPct);
    } else if (sortBy === 'TOTAL_VOLUME') {
      list.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'CRITICAL') {
      list.sort((a, b) => b.critical - a.critical);
    } else if (sortBy === 'ALPHABETICAL') {
      list.sort((a, b) => a.departmentName.localeCompare(b.departmentName));
    }

    if (!isNormalizedPercent) {
      return list;
    }

    // Normalized to 100% stacked density
    return list.map((item) => {
      const tot = item.total || 1;
      return {
        ...item,
        criticalNorm: Number(((item.critical / tot) * 100).toFixed(1)),
        highNorm: Number(((item.high / tot) * 100).toFixed(1)),
        mediumNorm: Number(((item.medium / tot) * 100).toFixed(1)),
        lowNorm: Number(((item.low / tot) * 100).toFixed(1))
      };
    });
  }, [sortBy, isNormalizedPercent]);

  // Organizational totals
  const totals = useMemo(() => {
    const totalAnomalies = DEPARTMENT_SEVERITY_30D_DATA.reduce((acc, d) => acc + d.total, 0);
    const critical = DEPARTMENT_SEVERITY_30D_DATA.reduce((acc, d) => acc + d.critical, 0);
    const high = DEPARTMENT_SEVERITY_30D_DATA.reduce((acc, d) => acc + d.high, 0);
    const medium = DEPARTMENT_SEVERITY_30D_DATA.reduce((acc, d) => acc + d.medium, 0);
    const low = DEPARTMENT_SEVERITY_30D_DATA.reduce((acc, d) => acc + d.low, 0);
    const avgRiskDensity = Number((((critical + high) / totalAnomalies) * 100).toFixed(1));

    return { totalAnomalies, critical, high, medium, low, avgRiskDensity };
  }, []);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DepartmentSeverityItem;
      const isSelected = selectedZoneId === data.id;

      return (
        <div className="bg-slate-900/95 border-2 border-indigo-500/70 p-4 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[280px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <strong className="text-white text-sm block">{data.departmentName}</strong>
              <span className="text-[10px] text-slate-400">{data.facilityLocation}</span>
            </div>
            {isSelected && (
              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-1.5 py-0.5 rounded font-mono font-bold">
                Active Zone
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center text-rose-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-rose-500" /> Critical Severity:
              </span>
              <strong>{data.critical} ({((data.critical / data.total) * 100).toFixed(1)}%)</strong>
            </div>

            <div className="flex justify-between items-center text-orange-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-orange-500" /> High Severity:
              </span>
              <strong>{data.high} ({((data.high / data.total) * 100).toFixed(1)}%)</strong>
            </div>

            <div className="flex justify-between items-center text-amber-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-amber-500" /> Medium Severity:
              </span>
              <strong>{data.medium} ({((data.medium / data.total) * 100).toFixed(1)}%)</strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-slate-500" /> Low Severity:
              </span>
              <strong>{data.low} ({((data.low / data.total) * 100).toFixed(1)}%)</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center font-mono">
            <span className="text-slate-400">Total 30D Anomalies:</span>
            <span className="text-white font-bold text-sm">{data.total}</span>
          </div>

          <div className="flex justify-between items-center font-mono mt-1">
            <span className="text-slate-400">Risk Density (High+Crit):</span>
            <span className="text-rose-400 font-bold">{data.riskDensityPct}%</span>
          </div>

          <p className="mt-2 text-[10px] text-slate-400 font-sans italic border-t border-slate-800/80 pt-1">
            Driver: {data.primaryRiskDriver}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="department-severity-stacked-bar-chart"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative"
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Anomaly Severity Distribution &amp; Risk Density per Department
              </h2>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-semibold">
                Last 30 Days (4-Tier Severity)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Stacked risk density distribution comparing Critical, High, Medium, and Low severity anomalies across organizational departments.
            </p>
          </div>
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-xs">
          {/* Absolute vs Percentage Toggle */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsNormalizedPercent(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                !isNormalizedPercent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show absolute incident counts"
            >
              <Hash className="h-3 w-3" />
              <span>Count</span>
            </button>
            <button
              onClick={() => setIsNormalizedPercent(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                isNormalizedPercent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show normalized 100% stacked percentage"
            >
              <Percent className="h-3 w-3" />
              <span>100% Density</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <ArrowUpDown className="h-3 w-3 text-slate-400 mr-1.5" />
            <span className="text-[11px] text-slate-500 mr-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort departments by metric"
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="RISK_DENSITY" className="bg-slate-900">Risk Density (High+Crit %)</option>
              <option value="TOTAL_VOLUME" className="bg-slate-900">Total Volume</option>
              <option value="CRITICAL" className="bg-slate-900">Critical Incidents</option>
              <option value="ALPHABETICAL" className="bg-slate-900">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 text-xs">
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
            Total 30D Anomalies
          </span>
          <div className="text-lg font-bold text-white mt-0.5 font-mono">
            {totals.totalAnomalies}
          </div>
          <span className="text-[10px] text-slate-500">6 Departments</span>
        </div>

        <div className="bg-slate-950 border border-rose-500/40 p-2.5 rounded-xl">
          <span className="text-[10px] text-rose-300 font-medium uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Critical
          </span>
          <div className="text-lg font-bold text-rose-400 mt-0.5 font-mono">
            {totals.critical}
          </div>
          <span className="text-[10px] text-slate-400">
            {((totals.critical / totals.totalAnomalies) * 100).toFixed(1)}% of total
          </span>
        </div>

        <div className="bg-slate-950 border border-orange-500/40 p-2.5 rounded-xl">
          <span className="text-[10px] text-orange-300 font-medium uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> High
          </span>
          <div className="text-lg font-bold text-orange-400 mt-0.5 font-mono">
            {totals.high}
          </div>
          <span className="text-[10px] text-slate-400">
            {((totals.high / totals.totalAnomalies) * 100).toFixed(1)}% of total
          </span>
        </div>

        <div className="bg-slate-950 border border-amber-500/40 p-2.5 rounded-xl">
          <span className="text-[10px] text-amber-300 font-medium uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Medium
          </span>
          <div className="text-lg font-bold text-amber-400 mt-0.5 font-mono">
            {totals.medium}
          </div>
          <span className="text-[10px] text-slate-400">
            {((totals.medium / totals.totalAnomalies) * 100).toFixed(1)}% of total
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl">
          <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Low
          </span>
          <div className="text-lg font-bold text-slate-300 mt-0.5 font-mono">
            {totals.low}
          </div>
          <span className="text-[10px] text-slate-400">
            {((totals.low / totals.totalAnomalies) * 100).toFixed(1)}% of total
          </span>
        </div>

        <div className="bg-slate-950 border border-indigo-500/40 p-2.5 rounded-xl">
          <span className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider block">
            Avg Risk Density
          </span>
          <div className="text-lg font-bold text-indigo-400 mt-0.5 font-mono">
            {totals.avgRiskDensity}%
          </div>
          <span className="text-[10px] text-slate-500">Critical + High</span>
        </div>
      </div>

      {/* Main Stacked Bar Chart */}
      <div className="h-80 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                const dep = e.activePayload[0].payload as DepartmentSeverityItem;
                if (onSelectZone) onSelectZone(dep.id);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="departmentShort"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              dy={8}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit={isNormalizedPercent ? '%' : ''}
              domain={isNormalizedPercent ? [0, 100] : [0, 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Stacked Bars: Low, Medium, High, Critical */}
            <Bar
              dataKey={isNormalizedPercent ? 'lowNorm' : 'low'}
              name="Low Severity"
              stackId="severity"
              fill="#64748b"
              radius={[0, 0, 0, 0]}
              animationDuration={600}
            />
            <Bar
              dataKey={isNormalizedPercent ? 'mediumNorm' : 'medium'}
              name="Medium Severity"
              stackId="severity"
              fill="#eab308"
              radius={[0, 0, 0, 0]}
              animationDuration={600}
            />
            <Bar
              dataKey={isNormalizedPercent ? 'highNorm' : 'high'}
              name="High Severity"
              stackId="severity"
              fill="#f97316"
              radius={[0, 0, 0, 0]}
              animationDuration={600}
            />
            <Bar
              dataKey={isNormalizedPercent ? 'criticalNorm' : 'critical'}
              name="Critical Severity"
              stackId="severity"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Summary Table / Risk Density Matrix */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Department &amp; Facility</th>
              <th className="py-2.5 px-2 text-center text-slate-300">Cohort</th>
              <th className="py-2.5 px-2 text-center text-rose-400">Critical</th>
              <th className="py-2.5 px-2 text-center text-orange-400">High</th>
              <th className="py-2.5 px-2 text-center text-amber-400">Medium</th>
              <th className="py-2.5 px-2 text-center text-slate-400">Low</th>
              <th className="py-2.5 px-3 text-right">Total 30D</th>
              <th className="py-2.5 px-3 text-right text-rose-400">Risk Density</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {chartData.map((dep) => {
              const isSelected = selectedZoneId === dep.id;
              return (
                <tr
                  key={dep.id}
                  className={`hover:bg-slate-900/60 transition ${
                    isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{dep.departmentName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dep.facilityLocation}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{dep.cohortSize}</td>
                  <td className="py-2.5 px-2 text-center text-rose-400 font-bold">{dep.critical}</td>
                  <td className="py-2.5 px-2 text-center text-orange-400 font-bold">{dep.high}</td>
                  <td className="py-2.5 px-2 text-center text-amber-400">{dep.medium}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{dep.low}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">{dep.total}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        dep.riskDensityPct >= 70
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : dep.riskDensityPct >= 50
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {dep.riskDensityPct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectZone && onSelectZone(dep.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                    >
                      Filter Zone &rarr;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

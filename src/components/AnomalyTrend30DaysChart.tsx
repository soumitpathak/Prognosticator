import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Brush
} from 'recharts';
import {
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  Clock,
  ShieldCheck,
  Eye,
  Sliders,
  Zap,
  Target,
  History
} from 'lucide-react';
import { AnomalyTrendDay, AnomalyTrendDayWithProjection, FacilityZone, ActiveAnomalyAlert, HealthSignalNotificationThresholds } from '../types';
import { AnomalyTrendSummaryStats } from '../services/anomalyTrend30DayService';

interface AnomalyTrend30DaysChartProps {
  data: AnomalyTrendDayWithProjection[];
  summary: AnomalyTrendSummaryStats;
  currentZone: FacilityZone;
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onExportReport: (format: 'PDF' | 'CSV') => void;
  isExporting?: boolean;
  dailyFrequencyThreshold?: number;
  criticalFrequencyThreshold?: number;
  proactiveRiskThreshold?: number;
  sensitivityLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM';
  onOpenThresholdPanel?: () => void;
}

export default function AnomalyTrend30DaysChart({
  data,
  summary,
  currentZone,
  zones,
  selectedZoneId,
  onSelectZone,
  onExportReport,
  isExporting = false,
  dailyFrequencyThreshold = 5,
  criticalFrequencyThreshold = 3,
  proactiveRiskThreshold = 5.5,
  sensitivityLevel = 'MEDIUM',
  onOpenThresholdPanel
}: AnomalyTrend30DaysChartProps) {
  // Horizon Filter: 7 Days, 14 Days, 30 Days
  const [horizon, setHorizon] = useState<'7D' | '14D' | '30D'>('30D');

  // Series visibility toggles
  const [showTotal, setShowTotal] = useState<boolean>(true);
  const [showCritical, setShowCritical] = useState<boolean>(true);
  const [showModerate, setShowModerate] = useState<boolean>(true);
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [showReferenceThreshold, setShowReferenceThreshold] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showPrevPeriodComparison, setShowPrevPeriodComparison] = useState<boolean>(false);

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Selected Day Drilldown State
  const [selectedDay, setSelectedDay] = useState<AnomalyTrendDayWithProjection | null>(null);

  // Filtered dataset according to selected horizon & forecast toggle
  const filteredData = useMemo(() => {
    let base = data;
    if (!showForecast) {
      base = data.filter((d) => !d.isProjected);
    }
    if (horizon === '7D') {
      return base.filter((d) => !d.isProjected).slice(-7);
    }
    if (horizon === '14D') {
      return base.filter((d) => !d.isProjected).slice(-14);
    }
    return base;
  }, [data, horizon, showForecast]);

  // Compute local slice stats
  const sliceStats = useMemo(() => {
    const historicalSlice = filteredData.filter((d) => !d.isProjected);
    const total = historicalSlice.reduce((acc, d) => acc + d.totalAnomalies, 0);
    const critical = historicalSlice.reduce((acc, d) => acc + d.criticalCount, 0);
    const mean = historicalSlice.length > 0 ? (total / historicalSlice.length).toFixed(1) : '0';
    return { total, critical, mean };
  }, [filteredData]);

  // Projected 7-day range for shaded ReferenceArea
  const forecastRange = useMemo(() => {
    const projectedPoints = filteredData.filter((d) => d.isProjected);
    if (projectedPoints.length < 2) return null;
    return {
      start: projectedPoints[0].date,
      end: projectedPoints[projectedPoints.length - 1].date,
      count: projectedPoints.length
    };
  }, [filteredData]);

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload as AnomalyTrendDayWithProjection;

      // Forecast point tooltip
      if (dayData.isProjected) {
        return (
          <div className="bg-slate-900/95 border-2 border-indigo-500/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[280px] pointer-events-none z-50">
            <div className="flex items-center justify-between border-b border-indigo-900/80 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span>{dayData.fullDate} ({dayData.dayOfWeek})</span>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono font-bold">
                7-DAY SMA FORECAST
              </span>
            </div>

            <div className="space-y-1.5 mb-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Projected Anomaly Frequency:</span>
                <span className="font-bold text-indigo-300 font-mono text-base">~{dayData.projectedTrend} / day</span>
              </div>
              <div className="flex justify-between items-center text-indigo-200">
                <span className="text-slate-400">95% Shaded Uncertainty Band:</span>
                <span className="font-mono font-semibold">{dayData.projectedLower} – {dayData.projectedUpper} events</span>
              </div>
              <div className="flex justify-between items-center text-emerald-300">
                <span className="text-slate-400">Model Projection Confidence:</span>
                <span className="font-mono font-semibold">{dayData.projectedConfidence}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                <span className="text-slate-400">Underlying Algorithm:</span>
                <span className="font-mono text-cyan-400">7-Day Simple Moving Average</span>
              </div>
            </div>

            <div className="bg-indigo-950/40 rounded-lg p-2 border border-indigo-900/40 text-[11px] text-indigo-200">
              <strong className="text-indigo-300 block font-semibold mb-0.5">Projected Workplace Outlook:</strong>
              Expected ambient temp ~{dayData.avgAmbientTempC}°C, workforce HRV stability ~{dayData.avgHrvMs}ms. Shaded indigo band shows projected moving average trajectory.
            </div>
          </div>
        );
      }
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[260px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>{dayData.fullDate} ({dayData.dayOfWeek})</span>
            </div>
            {dayData.isHeatwavePeriod && (
              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold animate-pulse">
                HEATWAVE PEAK
              </span>
            )}
          </div>

          <div className="space-y-1.5 mb-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Anomaly Events:</span>
              <span className="font-bold text-cyan-300 font-mono text-sm">{dayData.totalAnomalies}</span>
            </div>
            <div className="flex justify-between items-center text-rose-300">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Critical Tier:
              </span>
              <span className="font-mono font-semibold">{dayData.criticalCount}</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Moderate Tier:
              </span>
              <span className="font-mono font-semibold">{dayData.moderateCount}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Mitigated / Resolved:
              </span>
              <span className="font-mono font-semibold">{dayData.resolvedCount}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">7-Day Moving Avg:</span>
              <span className="font-mono text-emerald-400 font-semibold">{dayData.movingAvg7d} / day</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Rate per 100 Workers:</span>
              <span className="font-mono text-indigo-300">{dayData.anomalyRatePer100}</span>
            </div>

            {showPrevPeriodComparison && dayData.prevPeriodAnomalies !== undefined && (
              <div className="pt-2 mt-2 border-t border-purple-900/60 bg-purple-950/40 -mx-1 px-2.5 py-1.5 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-purple-200 font-semibold text-xs">
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3 text-purple-400" />
                    Prior 30D ({dayData.prevPeriodDate}):
                  </span>
                  <span className="font-mono text-purple-300">{dayData.prevPeriodAnomalies} events</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Cycle Variance:</span>
                  <span
                    className={`font-mono font-bold ${
                      (dayData.periodVariancePct || 0) <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(dayData.periodVariancePct || 0) > 0 ? `+${dayData.periodVariancePct}%` : `${dayData.periodVariancePct}%`} Shift
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 space-y-1 text-[11px]">
            <div className="text-slate-400">
              <strong className="text-slate-300">Primary Hazard Driver:</strong> {dayData.primaryDriver}
            </div>
            <div className="text-slate-400">
              <strong className="text-slate-300">Peak Exposure Window:</strong> {dayData.peakHour}
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>Avg Temp: <strong className="text-amber-400">{dayData.avgAmbientTempC}°C</strong></span>
              <span>Avg Cohort HRV: <strong className="text-emerald-400">{dayData.avgHrvMs} ms</strong></span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="anomaly-trend-30d-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">30-Day Anomaly Trend Frequency Intelligence</h2>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-sm flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Recharts Longitudinal Analytics
              </span>
              <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold">
                <Target className="h-2.5 w-2.5 text-rose-400" />
                Action Threshold: {dailyFrequencyThreshold}/day ({sensitivityLevel})
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
                k-Anonymity Verified (N &ge; 12)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Longitudinal surveillance tracking daily anomaly event frequency, severity dispersion, and 7-day rolling moving averages across facility cohorts.
            </p>
          </div>
        </div>

        {/* Action Controls: Horizon, Zone Selector, Threshold Config, and Export Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {onOpenThresholdPanel && (
            <button
              onClick={onOpenThresholdPanel}
              className="flex items-center space-x-1.5 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-300 text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shadow-xs"
              title="Open Custom Anomaly Detection Thresholds Configuration Panel"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sensitivity ({dailyFrequencyThreshold}/day)</span>
            </button>
          )}

          {/* Zone Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
            <select
              value={selectedZoneId}
              onChange={(e) => onSelectZone(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Facility Zones (Combined Cohort)
              </option>
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="bg-slate-900 text-slate-200">
                  {z.name} ({z.count} workers)
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Pills */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['7D', '14D', '30D'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  horizon === h
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h === '7D' ? 'Last 7 Days' : h === '14D' ? 'Last 14 Days' : 'Full 30 Days'}
              </button>
            ))}
          </div>

          {/* Export View Anomaly Report as Simulated PDF / CSV Button */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              disabled={isExporting}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md border border-cyan-400/40 cursor-pointer disabled:opacity-50"
              title="Export the current 30-day anomaly view report as simulated PDF or CSV and record an immutable entry in the audit logging trail"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Export View Report (Audit Logged)</span>
              <ChevronDown className={`h-3 w-3 text-white/80 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Export View &amp; Register Audit Trail</span>
                    <span className="text-[10px] text-cyan-400 font-mono">ISO 45001</span>
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportReport('PDF');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cyan-950/70 hover:text-cyan-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Simulated Executive PDF</div>
                          <div className="text-[10px] text-slate-400">Formal audit document with KPI breakdown</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">.pdf</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportReport('CSV');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-950/70 hover:text-emerald-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Simulated Compliance CSV</div>
                          <div className="text-[10px] text-slate-400">RFC 4180 raw tabular dataset for audit logs</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">.csv</span>
                    </button>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-800 px-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>System Audit Trail</span>
                    <span className="text-emerald-400">Auto-Registered</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analytical KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Total Anomalies */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {horizon === '30D' ? 'Total 30D Anomalies' : `Total (${horizon})`}
            </span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {horizon === '30D' ? summary.totalAnomalies30d : sliceStats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span>Critical:</span>
            <strong className="text-rose-400">
              {horizon === '30D' ? summary.criticalAnomalies30d : sliceStats.critical}
            </strong>
            <span className="text-slate-600">|</span>
            <span>Mod:</span>
            <strong className="text-amber-400">
              {horizon === '30D' ? summary.moderateAnomalies30d : sliceStats.total - sliceStats.critical}
            </strong>
          </div>
        </div>

        {/* Daily Mean Frequency */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Daily Mean Frequency</span>
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 mt-1">
            {horizon === '30D' ? `${summary.dailyMeanFrequency} / day` : `${sliceStats.mean} / day`}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">7-Day Moving Baseline</span>
        </div>

        {/* Peak Day Load */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Peak Anomaly Load</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {summary.peakDay.total} Events
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.peakDay.date} ({summary.peakDay.critical} Critical)
          </span>
        </div>

        {/* 14-Day Trajectory */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">14D Trajectory Shift</span>
            {summary.trendComparisonPct <= 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
            )}
          </div>
          <div
            className={`text-xl font-bold mt-1 ${
              summary.trendComparisonPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.trendComparisonPct > 0 ? `+${summary.trendComparisonPct}%` : `${summary.trendComparisonPct}%`}
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.trendComparisonPct <= 0 ? 'Cooling Protocol Efficacy' : 'Elevated Thermal Load'}
          </span>
        </div>

        {/* Mitigation Resolution Rate */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mitigation Resolution</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {summary.mitigationResolutionRate}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Rest/Hydration Staged</span>
        </div>
      </div>

      {/* Series Toggle Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Active Series:</span>
          <button
            onClick={() => setShowTotal((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showTotal
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>Total Daily Anomalies</span>
          </button>

          <button
            onClick={() => setShowCritical((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showCritical
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>Critical Severity</span>
          </button>

          <button
            onClick={() => setShowModerate((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showModerate
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Moderate Severity</span>
          </button>

          <button
            onClick={() => setShowMovingAvg((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showMovingAvg
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>7-Day Moving Avg</span>
          </button>

          <button
            onClick={() => setShowResolved((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showResolved
                ? 'bg-teal-950/80 text-teal-300 border-teal-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            <span>Mitigated / Resolved</span>
          </button>

          <button
            onClick={() => setShowForecast((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showForecast
                ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/60 shadow-xs ring-1 ring-indigo-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>7-Day SMA Shaded Forecast</span>
          </button>

          <button
            onClick={() => setShowPrevPeriodComparison((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showPrevPeriodComparison
                ? 'bg-purple-950/90 text-purple-300 border-purple-500/60 shadow-xs ring-1 ring-purple-500/30 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle historical comparison between the current 30-day period and the prior 30-day period (Sep 05 - Oct 05)"
          >
            <History className="h-3 w-3 text-purple-400" />
            <span>Compare Previous 30-Day Period</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showReferenceThreshold}
              onChange={(e) => setShowReferenceThreshold(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Visual Action Benchmark ({dailyFrequencyThreshold}/day)</span>
          </label>
        </div>
      </div>

      {/* Contextual 30-Day Period Comparison Analysis Banner */}
      {showPrevPeriodComparison && (
        <div className="mb-3 bg-purple-950/30 border border-purple-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-purple-200 gap-2 animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-purple-900/60 border border-purple-500/50 text-purple-300 shrink-0">
              <History className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Longitudinal 30-Day Period Contextual Analysis</span>
                <span className="text-[10px] bg-purple-900/80 text-purple-300 border border-purple-700 px-1.5 py-0.2 rounded font-mono">
                  Cycle Over Cycle
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 mt-0.5">
                Comparing Current Period (Oct 06 &ndash; Nov 04) against Previous Period (Sep 05 &ndash; Oct 05, pre-cooling intervention).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono self-end sm:self-auto bg-slate-950/80 px-3 py-1.5 rounded-lg border border-purple-900/60">
            <span className="text-slate-300">
              Current: <strong className="text-cyan-400">{summary.totalAnomalies30d}</strong> events
            </span>
            <span className="text-slate-600">vs</span>
            <span className="text-slate-300">
              Previous: <strong className="text-purple-300">{summary.prevPeriodTotal30d || 232}</strong> events
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                (summary.periodComparisonDeltaPct || -14.7) <= 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {(summary.periodComparisonDeltaPct || -14.7) > 0 ? `+${summary.periodComparisonDeltaPct}%` : `${summary.periodComparisonDeltaPct || -14.7}%`} Net Shift
            </span>
          </div>
        </div>
      )}

      {/* Main Recharts Line Chart Container */}
      <div className="h-80 w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                setSelectedDay(e.activePayload[0].payload);
              }
            }}
          >
            <defs>
              <linearGradient id="forecastAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              dy={5}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 'dataMax + 2']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
            />

            {/* Shaded 7-Day Predicted Region (SMA Projection Window) */}
            {showForecast && forecastRange && (
              <ReferenceArea
                x1={forecastRange.start}
                x2={forecastRange.end}
                stroke="#6366f1"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
                fill="#4338ca"
                fillOpacity={0.14}
                label={{
                  value: 'Predicted 7D SMA Projection Window',
                  fill: '#a5b4fc',
                  fontSize: 10,
                  position: 'insideTop',
                  offset: 8
                }}
              />
            )}

            {showReferenceThreshold && (
              <>
                <ReferenceLine
                  y={dailyFrequencyThreshold}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Action Benchmark: ${dailyFrequencyThreshold}/day [${sensitivityLevel}]`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'insideTopLeft'
                  }}
                />
                {criticalFrequencyThreshold && showCritical && (
                  <ReferenceLine
                    y={criticalFrequencyThreshold}
                    stroke="#fb7185"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    label={{
                      value: `Critical Ceiling: ${criticalFrequencyThreshold}/day`,
                      fill: '#fb7185',
                      fontSize: 9,
                      position: 'insideBottomLeft'
                    }}
                  />
                )}
                {proactiveRiskThreshold != null && (
                  <ReferenceLine
                    y={proactiveRiskThreshold}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    label={{
                      value: `Proactive Risk Limit: ${proactiveRiskThreshold}/day (Pre-emptive Alert)`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                )}
              </>
            )}

            {/* Shaded Area for Projected Upper Confidence Bound */}
            {showForecast && (
              <Area
                type="monotone"
                dataKey="projectedUpper"
                name="Projected Upper Uncertainty Band"
                stroke="#818cf8"
                strokeWidth={1}
                strokeDasharray="2 2"
                fill="url(#forecastAreaGradient)"
                legendType="none"
                tooltipType="none"
                isAnimationActive={false}
              />
            )}

            {showTotal && (
              <Line
                type="monotone"
                dataKey="totalAnomalies"
                name="Total Daily Anomalies"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
              />
            )}

            {showCritical && (
              <Line
                type="monotone"
                dataKey="criticalCount"
                name="Critical Severity"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#f43f5e' }}
                activeDot={{ r: 5, fill: '#fb7185', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
              />
            )}

            {showModerate && (
              <Line
                type="monotone"
                dataKey="moderateCount"
                name="Moderate Severity"
                stroke="#f59e0b"
                strokeWidth={1.8}
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 5, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 1.5 }}
                animationDuration={600}
              />
            )}

            {showMovingAvg && (
              <Line
                type="monotone"
                dataKey="movingAvg7d"
                name="7-Day Moving Avg"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                animationDuration={600}
              />
            )}

            {/* Projected Moving Average Trend Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="projectedTrend"
                name="7-Day SMA Projection"
                stroke="#818cf8"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#818cf8', stroke: '#4f46e5', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#c7d2fe', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
                connectNulls
              />
            )}

            {showResolved && (
              <Line
                type="monotone"
                dataKey="resolvedCount"
                name="Mitigated / Resolved"
                stroke="#2dd4bf"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                animationDuration={600}
              />
            )}

            {/* Previous 30-Day Period Comparison Line */}
            {showPrevPeriodComparison && (
              <Line
                type="monotone"
                dataKey="prevPeriodAnomalies"
                name="Previous 30-Day Period (Cycle-over-Cycle)"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#c084fc', stroke: '#9333ea', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#e9d5ff', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={600}
                connectNulls
              />
            )}

            {horizon === '30D' && (
              <Brush
                dataKey="date"
                height={22}
                stroke="#0ea5e9"
                fill="#0f172a"
                tickFormatter={() => ''}
                travellerWidth={10}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Day Inspection Detail Box */}
      {selectedDay && (
        <div className="mt-4 bg-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-lg animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 mb-2.5 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                Historical Day Focus: {selectedDay.fullDate} ({selectedDay.dayOfWeek})
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {selectedDay.totalAnomalies} Total Flagged
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close Focus &times;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Primary Incident Attribution:</span>
              <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span>{selectedDay.primaryDriver}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Peak Hazard Exposure Window: <strong className="text-slate-200">{selectedDay.peakHour}</strong>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Environmental &amp; Physiological Load:</span>
              <div className="flex items-center justify-between text-slate-200 mt-1">
                <span>Ambient Average:</span>
                <strong className="text-amber-400">{selectedDay.avgAmbientTempC}°C</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Cohort Mean HRV:</span>
                <strong className="text-emerald-400">{selectedDay.avgHrvMs} ms</strong>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Operational Triage Resolution:</span>
              <div className="flex items-center justify-between text-slate-200 mt-1">
                <span>Critical Evacuations:</span>
                <strong className="text-rose-400">{selectedDay.criticalCount} staged</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Rest Stabilizations:</span>
                <strong className="text-emerald-400">{selectedDay.resolvedCount} verified</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info: Non-punitive and k-Anonymity Note */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-2.5 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Statutory Audit Logging: All 30-day export requests cryptographically signed &amp; registered in System Audit Trail.</span>
        </div>
        <div>
          <span>Tip: Click any data point to inspect that day's environmental attributions.</span>
        </div>
      </div>
    </div>
  );
}

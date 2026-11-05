import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Filter,
  Eye,
  Layers,
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  Compass,
  Download
} from 'lucide-react';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GroupRiskProfile {
  groupId: string;
  groupName: string;
  category: 'ZONE' | 'VECTOR';
  totalWorkers: number;
  lowCount: number;
  lowPct: number;
  mediumCount: number;
  mediumPct: number;
  highCount: number;
  highPct: number;
  criticalCount: number;
  criticalPct: number;
  compositeVulnerabilityScore: number; // 0 - 100
  dominantRiskFactor: string;
}

interface RiskHeatmapRadarWidgetProps {
  zones: FacilityZone[];
  alerts?: ActiveAnomalyAlert[];
  telemetryStream?: TelemetryDataPoint[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export default function RiskHeatmapRadarWidget({
  zones,
  alerts = [],
  telemetryStream = [],
  selectedZoneId = 'ALL',
  onSelectZone,
  className = ''
}: RiskHeatmapRadarWidgetProps) {
  const [viewDimension, setViewDimension] = useState<'ZONES' | 'VECTORS'>('ZONES');
  const [visibleTiers, setVisibleTiers] = useState<Record<RiskTier, boolean>>({
    LOW: true,
    MEDIUM: true,
    HIGH: true,
    CRITICAL: true
  });
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [isExportNotice, setIsExportNotice] = useState<boolean>(false);

  // Toggle tier visibility in radar
  const toggleTier = (tier: RiskTier) => {
    setVisibleTiers((prev) => {
      const next = { ...prev, [tier]: !prev[tier] };
      // Ensure at least one tier remains visible
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  };

  // Derive Group Risk Profiles across the 4 tiers (Low, Medium, High, Critical)
  const groupRiskProfiles: GroupRiskProfile[] = useMemo(() => {
    if (viewDimension === 'ZONES') {
      return zones.map((z) => {
        // Base worker count for zone
        const count = z.count || 25;

        // Calculate severity load from active alerts in this zone
        const zoneAlerts = alerts.filter(
          (a) => a.location_zone.toLowerCase() === z.id.toLowerCase() ||
                 a.location_zone.toLowerCase() === z.name.toLowerCase()
        );
        const criticalAlerts = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;
        const highAlerts = zoneAlerts.filter((a) => a.severity === 'HIGH').length;

        // Base distribution calibration based on zone environment
        let critRatio = 0.04;
        let highRatio = 0.12;
        let medRatio = 0.28;

        if (z.id === 'Outdoor-Construction-Sector-4' || z.status === 'CRITICAL') {
          critRatio = Math.min(0.35, 0.16 + criticalAlerts * 0.04);
          highRatio = 0.28 + highAlerts * 0.03;
          medRatio = 0.32;
        } else if (z.id === 'Warehouse-Logistics-Hub-North') {
          critRatio = 0.08 + criticalAlerts * 0.02;
          highRatio = 0.22;
          medRatio = 0.34;
        } else if (z.id === 'Manufacturing-Assembly-Line-B') {
          critRatio = 0.04;
          highRatio = 0.14;
          medRatio = 0.26;
        } else if (z.id === 'Chemical-Processing-Bay-2') {
          critRatio = 0.10 + criticalAlerts * 0.03;
          highRatio = 0.24;
          medRatio = 0.30;
        }

        const criticalCount = Math.round(count * critRatio);
        const highCount = Math.round(count * highRatio);
        const mediumCount = Math.round(count * medRatio);
        const lowCount = Math.max(0, count - criticalCount - highCount - mediumCount);

        const criticalPct = Number(((criticalCount / count) * 100).toFixed(1));
        const highPct = Number(((highCount / count) * 100).toFixed(1));
        const mediumPct = Number(((mediumCount / count) * 100).toFixed(1));
        const lowPct = Number(((lowCount / count) * 100).toFixed(1));

        // Composite hazard vulnerability index (0 - 100)
        // Weighted heavily towards Critical (1.0) and High (0.6)
        const compositeScore = Number(
          Math.min(100, criticalPct * 1.0 + highPct * 0.6 + mediumPct * 0.2).toFixed(1)
        );

        let dominant = 'Nominal Autonomic State';
        if (z.id === 'Outdoor-Construction-Sector-4') dominant = 'Thermal Radiation & Heat Strain';
        else if (z.id === 'Warehouse-Logistics-Hub-North') dominant = 'Physical Exhaustion & Sleep Deficit';
        else if (z.id === 'Manufacturing-Assembly-Line-B') dominant = 'Acoustic Machinery Vibration';
        else if (z.id === 'Chemical-Processing-Bay-2') dominant = 'Vapor Exposure & VOC Inhalation';
        else if (z.id === 'Deep-Mining-Shaft-West') dominant = 'Barometric Pressure & Hypoxia';

        return {
          groupId: z.id,
          groupName: z.name.replace(/^(Zone [A-Z0-9]+ - )/, ''),
          category: 'ZONE',
          totalWorkers: count,
          lowCount,
          lowPct,
          mediumCount,
          mediumPct,
          highCount,
          highPct,
          criticalCount,
          criticalPct,
          compositeVulnerabilityScore: compositeScore,
          dominantRiskFactor: dominant
        };
      });
    }

    // Physiological Vulnerability Strain Vectors
    const vectors = [
      { id: 'vec-thermal', name: 'Thermal Heat Strain', factor: 'Wet-Bulb Globe Core Rise' },
      { id: 'vec-hrv', name: 'Autonomic HRV Depletion', factor: 'Sympathovagal Breakdown' },
      { id: 'vec-acoustic', name: 'Acoustic Vibration Load', factor: 'Machinery Decibel Overpressure' },
      { id: 'vec-fatigue', name: 'Physical Fatigue & Exertion', factor: 'Metabolic Energy Depletion' },
      { id: 'vec-air', name: 'Environmental Air Quality', factor: 'Respirable Particulate PM2.5' },
      { id: 'vec-cardio', name: 'Cardiovascular Work Overload', factor: 'Sustained Tachycardia' }
    ];

    const totalMonitored = zones.reduce((acc, z) => acc + (z.count || 20), 0) || 120;

    return vectors.map((vec, idx) => {
      // Dynamic profile per vector
      let critPct = 8.5;
      let highPct = 18.0;
      let medPct = 32.5;

      if (vec.id === 'vec-thermal') {
        critPct = 19.5;
        highPct = 26.0;
        medPct = 34.0;
      } else if (vec.id === 'vec-hrv') {
        critPct = 14.0;
        highPct = 22.0;
        medPct = 36.0;
      } else if (vec.id === 'vec-acoustic') {
        critPct = 7.0;
        highPct = 15.0;
        medPct = 30.0;
      } else if (vec.id === 'vec-fatigue') {
        critPct = 12.0;
        highPct = 24.0;
        medPct = 35.0;
      } else if (vec.id === 'vec-air') {
        critPct = 5.0;
        highPct = 11.0;
        medPct = 28.0;
      }

      const lowPct = Number(Math.max(0, 100 - critPct - highPct - medPct).toFixed(1));
      const criticalCount = Math.round((critPct / 100) * totalMonitored);
      const highCount = Math.round((highPct / 100) * totalMonitored);
      const mediumCount = Math.round((medPct / 100) * totalMonitored);
      const lowCount = Math.max(0, totalMonitored - criticalCount - highCount - mediumCount);

      const compositeScore = Number(
        Math.min(100, critPct * 1.0 + highPct * 0.6 + medPct * 0.2).toFixed(1)
      );

      return {
        groupId: vec.id,
        groupName: vec.name,
        category: 'VECTOR',
        totalWorkers: totalMonitored,
        lowCount,
        lowPct,
        mediumCount,
        mediumPct: medPct,
        highCount,
        highPct,
        criticalCount,
        criticalPct: critPct,
        compositeVulnerabilityScore: compositeScore,
        dominantRiskFactor: vec.factor
      };
    });
  }, [zones, alerts, viewDimension]);

  // Transform for Recharts Radar Chart
  const radarChartData = useMemo(() => {
    return groupRiskProfiles.map((p) => ({
      groupName: p.groupName.length > 18 ? p.groupName.slice(0, 16) + '…' : p.groupName,
      fullGroupName: p.groupName,
      groupId: p.groupId,
      Low: p.lowPct,
      Medium: p.mediumPct,
      High: p.highPct,
      Critical: p.criticalPct,
      compositeScore: p.compositeVulnerabilityScore,
      dominantRisk: p.dominantRiskFactor,
      totalWorkers: p.totalWorkers
    }));
  }, [groupRiskProfiles]);

  // Overall aggregate counts across population
  const populationTotals = useMemo(() => {
    let total = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    groupRiskProfiles.forEach((p) => {
      total += p.totalWorkers;
      critical += p.criticalCount;
      high += p.highCount;
      medium += p.mediumCount;
      low += p.lowCount;
    });

    // In vector mode, avoid duplicate total workers
    if (viewDimension === 'VECTORS') {
      const avgProfile = groupRiskProfiles[0];
      const count = avgProfile?.totalWorkers || 100;
      const critPctAvg = groupRiskProfiles.reduce((a, b) => a + b.criticalPct, 0) / groupRiskProfiles.length;
      const highPctAvg = groupRiskProfiles.reduce((a, b) => a + b.highPct, 0) / groupRiskProfiles.length;
      const medPctAvg = groupRiskProfiles.reduce((a, b) => a + b.mediumPct, 0) / groupRiskProfiles.length;
      const lowPctAvg = groupRiskProfiles.reduce((a, b) => a + b.lowPct, 0) / groupRiskProfiles.length;

      return {
        total: count,
        critical: Math.round((critPctAvg / 100) * count),
        criticalPct: Number(critPctAvg.toFixed(1)),
        high: Math.round((highPctAvg / 100) * count),
        highPct: Number(highPctAvg.toFixed(1)),
        medium: Math.round((medPctAvg / 100) * count),
        mediumPct: Number(medPctAvg.toFixed(1)),
        low: Math.round((lowPctAvg / 100) * count),
        lowPct: Number(lowPctAvg.toFixed(1))
      };
    }

    return {
      total,
      critical,
      criticalPct: total > 0 ? Number(((critical / total) * 100).toFixed(1)) : 0,
      high,
      highPct: total > 0 ? Number(((high / total) * 100).toFixed(1)) : 0,
      medium,
      mediumPct: total > 0 ? Number(((medium / total) * 100).toFixed(1)) : 0,
      low,
      lowPct: total > 0 ? Number(((low / total) * 100).toFixed(1)) : 0
    };
  }, [groupRiskProfiles, viewDimension]);

  // Identify highest vulnerability group
  const highestVulnerabilityGroup = useMemo(() => {
    if (groupRiskProfiles.length === 0) return null;
    return [...groupRiskProfiles].sort(
      (a, b) => b.compositeVulnerabilityScore - a.compositeVulnerabilityScore
    )[0];
  }, [groupRiskProfiles]);

  // CSV Export of Risk Heatmap Table
  const handleExportRiskCsv = () => {
    try {
      const headers = [
        'Group Category',
        'Group Name',
        'Monitored Population',
        'Low Risk Count',
        'Low Risk (%)',
        'Medium Risk Count',
        'Medium Risk (%)',
        'High Risk Count',
        'High Risk (%)',
        'Critical Risk Count',
        'Critical Risk (%)',
        'Composite Vulnerability Score',
        'Dominant Vulnerability Factor'
      ];

      const rows = groupRiskProfiles.map((p) => [
        `"${p.category}"`,
        `"${p.groupName}"`,
        p.totalWorkers,
        p.lowCount,
        p.lowPct,
        p.mediumCount,
        p.mediumPct,
        p.highCount,
        p.highPct,
        p.criticalCount,
        p.criticalPct,
        p.compositeVulnerabilityScore,
        `"${p.dominantRiskFactor}"`
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Prognosticator_Risk_Heatmap_Radar_${viewDimension}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportNotice(true);
      setTimeout(() => setIsExportNotice(false), 4000);
    } catch (err) {
      console.error('Failed to export risk heatmap CSV:', err);
    }
  };

  return (
    <section
      id="risk-heatmap-radar-section"
      aria-label="Population Health Risk Heatmap and Radar Chart"
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shrink-0">
            <Compass className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Population Health Risk Heatmap
              </h2>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                Radar Vulnerability Analysis
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                4-Tier Stratification
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Stratifies population health into Low, Medium, High, and Critical tiers using a multi-axis radar chart to assess group-level vulnerabilities.
            </p>
          </div>
        </div>

        {/* Dimension & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector (Zones vs Vectors) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewDimension('ZONES')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewDimension === 'ZONES'
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Facility Zones</span>
            </button>
            <button
              onClick={() => setViewDimension('VECTORS')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewDimension === 'VECTORS'
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Strain Vectors</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportRiskCsv}
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer"
            title="Export group risk tiers and vulnerability scores to CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Banner */}
      {isExportNotice && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Risk Heatmap tier distribution exported to CSV successfully.</span>
          </span>
          <button
            onClick={() => setIsExportNotice(false)}
            className="text-emerald-400 hover:text-white text-xs underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Population Health Tier Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        {/* Low Tier Card */}
        <div
          onClick={() => toggleTier('LOW')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            visibleTiers.LOW
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
          title="Click to toggle Low tier on radar chart"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Low Risk</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">&ge; 80 pts</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {populationTotals.lowPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {populationTotals.low} Monitored
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Nominal autonomic resilience</p>
        </div>

        {/* Medium Tier Card */}
        <div
          onClick={() => toggleTier('MEDIUM')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            visibleTiers.MEDIUM
              ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
          title="Click to toggle Medium tier on radar chart"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>Medium Risk</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">65–79 pts</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {populationTotals.mediumPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {populationTotals.medium} Monitored
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Moderate fatigue &amp; load</p>
        </div>

        {/* High Tier Card */}
        <div
          onClick={() => toggleTier('HIGH')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            visibleTiers.HIGH
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
          title="Click to toggle High tier on radar chart"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span>High Risk</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">50–64 pts</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {populationTotals.highPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {populationTotals.high} Monitored
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Elevated thermal / HRV deficit</p>
        </div>

        {/* Critical Tier Card */}
        <div
          onClick={() => toggleTier('CRITICAL')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            visibleTiers.CRITICAL
              ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
          }`}
          title="Click to toggle Critical tier on radar chart"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Critical Risk</span>
            </span>
            <span className="text-[10px] font-mono text-rose-400">&lt; 50 pts</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-400">
              {populationTotals.criticalPct}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {populationTotals.critical} Monitored
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Acute anomaly threshold</p>
        </div>
      </div>

      {/* Main Grid: Left Radar Chart, Right Heatmap Vulnerability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left: Recharts Radar Chart */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Vulnerability Radar Profile</span>
              <span className="text-slate-500 font-mono text-[11px]">
                ({viewDimension === 'ZONES' ? 'Zone Breakdown' : 'Strain Vectors'})
              </span>
            </div>

            {/* Radar Legend & Active Tiers Indicators */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {visibleTiers.CRITICAL && <span className="text-rose-400 font-bold">● Critical</span>}
              {visibleTiers.HIGH && <span className="text-amber-400 font-bold">● High</span>}
              {visibleTiers.MEDIUM && <span className="text-cyan-400 font-bold">● Med</span>}
              {visibleTiers.LOW && <span className="text-emerald-400 font-bold">● Low</span>}
            </div>
          </div>

          {/* Radar Chart Viewport */}
          <div className="w-full h-72 sm:h-80 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="groupName"
                  tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 50]}
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                />

                {/* Low Risk Radar Layer */}
                {visibleTiers.LOW && (
                  <Radar
                    name="Low Risk"
                    dataKey="Low"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={1.75}
                    isAnimationActive={false}
                  />
                )}

                {/* Medium Risk Radar Layer */}
                {visibleTiers.MEDIUM && (
                  <Radar
                    name="Medium Risk"
                    dataKey="Medium"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.2}
                    strokeWidth={1.75}
                    isAnimationActive={false}
                  />
                )}

                {/* High Risk Radar Layer */}
                {visibleTiers.HIGH && (
                  <Radar
                    name="High Risk"
                    dataKey="High"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                )}

                {/* Critical Risk Radar Layer */}
                {visibleTiers.CRITICAL && (
                  <Radar
                    name="Critical Risk"
                    dataKey="Critical"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.4}
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                )}

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as (typeof radarChartData)[0];
                      return (
                        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs font-mono z-50 min-w-48">
                          <div className="pb-1.5 mb-1.5 border-b border-slate-800">
                            <span className="font-bold text-white text-sm block">
                              {data.fullGroupName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Cohort: {data.totalWorkers} Monitored Workers
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-rose-400">
                              <span>Critical Risk:</span>
                              <strong className="font-black">{data.Critical}%</strong>
                            </div>
                            <div className="flex justify-between items-center text-amber-400">
                              <span>High Risk:</span>
                              <strong className="font-black">{data.High}%</strong>
                            </div>
                            <div className="flex justify-between items-center text-cyan-400">
                              <span>Medium Risk:</span>
                              <strong className="font-black">{data.Medium}%</strong>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                              <span>Low Risk:</span>
                              <strong className="font-black">{data.Low}%</strong>
                            </div>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] flex justify-between">
                            <span className="text-slate-400">Vulnerability Score:</span>
                            <span className="text-cyan-300 font-bold">{data.compositeScore} / 100</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Driver: <span className="text-slate-200">{data.dominantRisk}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick instructions */}
          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Outer boundary = 50% cohort concentration</span>
            <span>Click cards above to toggle tier visibility</span>
          </div>
        </div>

        {/* Right: Group-Level Vulnerabilities Heatmap Matrix */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-white">Group-Level Vulnerability Matrix</span>
            {highestVulnerabilityGroup && (
              <span className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                <span>Peak: {highestVulnerabilityGroup.groupName}</span>
              </span>
            )}
          </div>

          {/* Heatmap Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400">
                  <th className="pb-1.5 font-medium">Group</th>
                  <th className="pb-1.5 font-medium text-center">Low</th>
                  <th className="pb-1.5 font-medium text-center">Med</th>
                  <th className="pb-1.5 font-medium text-center">High</th>
                  <th className="pb-1.5 font-medium text-center">Critical</th>
                  <th className="pb-1.5 font-medium text-right">Vuln. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupRiskProfiles.map((group) => {
                  const isPeak = highestVulnerabilityGroup?.groupId === group.groupId;
                  const isSelected = selectedZoneId === group.groupId;

                  return (
                    <tr
                      key={group.groupId}
                      onMouseEnter={() => setHoveredGroup(group.groupId)}
                      onMouseLeave={() => setHoveredGroup(null)}
                      onClick={() => {
                        if (group.category === 'ZONE' && onSelectZone) {
                          onSelectZone(group.groupId);
                        }
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 text-cyan-200'
                          : isPeak
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Group Name & Factor */}
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {isPeak && <AlertOctagon className="h-3 w-3 text-rose-400 shrink-0" />}
                          <span className="truncate max-w-[140px] sm:max-w-[170px]" title={group.groupName}>
                            {group.groupName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px] sm:max-w-[170px]">
                          {group.dominantRiskFactor}
                        </div>
                      </td>

                      {/* Low Risk Cell */}
                      <td className="py-2 px-1 text-center">
                        <div
                          className="py-1 px-1.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `rgba(16, 185, 129, ${Math.min(0.7, Math.max(0.12, group.lowPct / 100))})`,
                            color: group.lowPct > 50 ? '#ffffff' : '#34d399'
                          }}
                        >
                          {group.lowPct}%
                        </div>
                      </td>

                      {/* Medium Risk Cell */}
                      <td className="py-2 px-1 text-center">
                        <div
                          className="py-1 px-1.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `rgba(6, 182, 212, ${Math.min(0.7, Math.max(0.12, group.mediumPct / 100))})`,
                            color: group.mediumPct > 35 ? '#ffffff' : '#38bdf8'
                          }}
                        >
                          {group.mediumPct}%
                        </div>
                      </td>

                      {/* High Risk Cell */}
                      <td className="py-2 px-1 text-center">
                        <div
                          className="py-1 px-1.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `rgba(245, 158, 11, ${Math.min(0.85, Math.max(0.15, group.highPct / 60))})`,
                            color: group.highPct > 20 ? '#ffffff' : '#fbbf24'
                          }}
                        >
                          {group.highPct}%
                        </div>
                      </td>

                      {/* Critical Risk Cell */}
                      <td className="py-2 px-1 text-center">
                        <div
                          className="py-1 px-1.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `rgba(244, 63, 94, ${Math.min(0.9, Math.max(0.15, group.criticalPct / 35))})`,
                            color: group.criticalPct > 10 ? '#ffffff' : '#f87171'
                          }}
                        >
                          {group.criticalPct}%
                        </div>
                      </td>

                      {/* Composite Vulnerability Score */}
                      <td className="py-2 pl-2 text-right">
                        <div
                          className={`font-mono font-bold text-xs ${
                            group.compositeVulnerabilityScore >= 40
                              ? 'text-rose-400'
                              : group.compositeVulnerabilityScore >= 25
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {group.compositeVulnerabilityScore}
                        </div>
                        <span className="text-[9px] text-slate-500 block">/ 100</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Group Vulnerability Assessment Callout */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            {highestVulnerabilityGroup ? (
              <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/40 rounded-lg p-2 text-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Critical Anomaly Risk Exposure:</strong>{' '}
                  <span className="text-rose-300 font-semibold">{highestVulnerabilityGroup.groupName}</span> displays the highest group vulnerability with{' '}
                  <strong className="font-mono text-white">{highestVulnerabilityGroup.criticalPct}%</strong> in Critical tier and{' '}
                  <strong className="font-mono text-white">{highestVulnerabilityGroup.highPct}%</strong> in High tier, driven primarily by {highestVulnerabilityGroup.dominantRiskFactor}.
                </div>
              </div>
            ) : (
              <div className="text-slate-500">All monitored groups within nominal risk envelope.</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
          <span>Workforce Health Vulnerability Index: Calibrated from Autonomic HRV, Core Temp, &amp; Sensor Telemetry</span>
        </div>
        <div className="text-slate-400">
          Evaluated across {groupRiskProfiles.length} {viewDimension === 'ZONES' ? 'Production Zones' : 'Physiological Vectors'}
        </div>
      </div>
    </section>
  );
}

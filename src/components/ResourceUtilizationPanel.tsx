import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Thermometer,
  Wind,
  Activity,
  Layers,
  ArrowRightLeft,
  Download,
  Info,
  Maximize2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  MapPin,
  Flame,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Eye
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert } from '../types';

interface ResourceUtilizationPanelProps {
  zones: FacilityZone[];
  alerts?: ActiveAnomalyAlert[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  onNavigateToFloorplan?: () => void;
  className?: string;
}

type HeatmapMode = 'WORKER_DENSITY' | 'THERMAL_HEAT_STRAIN' | 'COMPOSITE_RISK' | 'CAPACITY_UTILIZATION';

interface ZoneStaffingModel {
  zoneId: string;
  maxSafeCapacity: number;
  currentWorkers: number;
  simulatedWorkers: number;
  areaSqMeters: number;
  coolingShelterProximityMeters: number;
}

// Recommended baseline safe staffing capacities based on ventilation, TWL, and ergonomics
const DEFAULT_SAFE_CAPACITIES: Record<string, { maxSafe: number; area: number; coolingDist: number }> = {
  'Outdoor-Construction-Sector-4': { maxSafe: 15, area: 1200, coolingDist: 85 },
  'Manufacturing-Assembly-Line-B': { maxSafe: 50, area: 2400, coolingDist: 15 },
  'Warehouse-Logistics-Hub-North': { maxSafe: 30, area: 1800, coolingDist: 30 },
  'Subgrade-Tunnel-Conduit-7': { maxSafe: 10, area: 350, coolingDist: 140 }
};

export default function ResourceUtilizationPanel({
  zones,
  alerts = [],
  selectedZoneId,
  onSelectZone,
  onNavigateToFloorplan,
  className = ''
}: ResourceUtilizationPanelProps) {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('WORKER_DENSITY');
  const [activeZoneDetailId, setActiveZoneDetailId] = useState<string>(selectedZoneId || zones[0]?.id || '');
  const [showRebalanceModal, setShowRebalanceModal] = useState<boolean>(false);
  const [rebalanceFeedback, setRebalanceFeedback] = useState<string | null>(null);

  // Simulated staffing adjustments state: zoneId -> delta
  const [staffingAdjustments, setStaffingAdjustments] = useState<Record<string, number>>({});

  // Sync activeZoneDetailId when prop changes
  React.useEffect(() => {
    if (selectedZoneId && zones.some((z) => z.id === selectedZoneId)) {
      setActiveZoneDetailId(selectedZoneId);
    }
  }, [selectedZoneId, zones]);

  // Merge zones with capacity models and adjustments
  const zoneStaffingData = useMemo(() => {
    return zones.map((zone) => {
      const defaultCap = DEFAULT_SAFE_CAPACITIES[zone.id] || {
        maxSafe: Math.max(12, Math.round(zone.count * 1.25)),
        area: 800,
        coolingDist: 50
      };

      const delta = staffingAdjustments[zone.id] || 0;
      const effectiveWorkers = Math.max(0, zone.count + delta);
      const utilizationPct = defaultCap.maxSafe > 0 ? (effectiveWorkers / defaultCap.maxSafe) * 100 : 0;

      // Risk weight factor
      const riskMultiplier = zone.status === 'CRITICAL' ? 1.8 : zone.status === 'MODERATE' ? 1.25 : 0.8;
      const compositeRiskIndex = Math.min(100, Math.round(utilizationPct * 0.5 * riskMultiplier + (zone.heatIndex || 30) * 0.7));

      // Active alerts in this zone
      const zoneAlerts = alerts.filter(
        (a) =>
          a.location_zone.toLowerCase().includes(zone.id.toLowerCase()) ||
          zone.name.toLowerCase().includes(a.location_zone.toLowerCase())
      );

      return {
        ...zone,
        maxSafeCapacity: defaultCap.maxSafe,
        areaSqMeters: defaultCap.area,
        coolingDistMeters: defaultCap.coolingDist,
        currentWorkers: zone.count,
        effectiveWorkers,
        delta,
        utilizationPct,
        compositeRiskIndex,
        zoneAlertsCount: zoneAlerts.length,
        criticalAlertsCount: zoneAlerts.filter((a) => a.severity === 'CRITICAL').length
      };
    });
  }, [zones, alerts, staffingAdjustments]);

  // Selected Zone Details
  const activeZoneDetail = useMemo(() => {
    return zoneStaffingData.find((z) => z.id === activeZoneDetailId) || zoneStaffingData[0];
  }, [zoneStaffingData, activeZoneDetailId]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    const totalWorkers = zoneStaffingData.reduce((acc, z) => acc + z.effectiveWorkers, 0);
    const totalCapacity = zoneStaffingData.reduce((acc, z) => acc + z.maxSafeCapacity, 0);
    const overallUtilization = totalCapacity > 0 ? (totalWorkers / totalCapacity) * 100 : 0;

    const highRiskWorkers = zoneStaffingData
      .filter((z) => z.status === 'CRITICAL' || z.status === 'MODERATE')
      .reduce((acc, z) => acc + z.effectiveWorkers, 0);

    const highRiskPct = totalWorkers > 0 ? (highRiskWorkers / totalWorkers) * 100 : 0;

    const overloadedZones = zoneStaffingData.filter((z) => z.effectiveWorkers > z.maxSafeCapacity);
    const criticalHeatZones = zoneStaffingData.filter((z) => (z.twl || 150) < 115 || z.heatIndex > 40);

    return {
      totalWorkers,
      totalCapacity,
      overallUtilization: Math.round(overallUtilization),
      highRiskWorkers,
      highRiskPct: Math.round(highRiskPct),
      overloadedZonesCount: overloadedZones.length,
      criticalHeatZonesCount: criticalHeatZones.length
    };
  }, [zoneStaffingData]);

  // Quick Action: Execute Automated Safe Rebalancing
  const handleExecuteAutomatedRebalance = () => {
    // Logic: identify critical overloaded zones and transfer 3-5 workers to stable climate-controlled zones
    const newAdjustments: Record<string, number> = {};
    let totalMoved = 0;

    // Critical zones to relieve
    zoneStaffingData.forEach((z) => {
      if (z.status === 'CRITICAL' && z.effectiveWorkers > 12) {
        const relief = Math.min(5, Math.max(2, z.effectiveWorkers - 12));
        newAdjustments[z.id] = -relief;
        totalMoved += relief;
      }
    });

    // Stable zones to receive
    const stableZone = zoneStaffingData.find((z) => z.status === 'STABLE');
    if (stableZone && totalMoved > 0) {
      newAdjustments[stableZone.id] = (newAdjustments[stableZone.id] || 0) + totalMoved;
    }

    setStaffingAdjustments(newAdjustments);
    setRebalanceFeedback(
      `Shift rebalancing applied: Reassigned ${totalMoved} workers from critical thermal zones to climate-controlled staging.`
    );
    setTimeout(() => setRebalanceFeedback(null), 5000);
  };

  // Reset Staffing Simulation
  const handleResetAdjustments = () => {
    setStaffingAdjustments({});
    setRebalanceFeedback('Staffing adjustments reset to live physical badge telemetry.');
    setTimeout(() => setRebalanceFeedback(null), 4000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Zone ID',
      'Zone Name',
      'Safety Status',
      'Active Workers',
      'Max Safe Capacity',
      'Utilization Rate (%)',
      'TWL Index (W/m2)',
      'Heat Index (°C)',
      'AQI',
      'Zone Area (m2)',
      'Active Alerts Count'
    ];

    const rows = zoneStaffingData.map((z) => [
      `"${z.id}"`,
      `"${z.name.replace(/"/g, '""')}"`,
      `"${z.status}"`,
      z.effectiveWorkers,
      z.maxSafeCapacity,
      `${z.utilizationPct.toFixed(1)}%`,
      z.twl || 'N/A',
      z.heatIndex || 'N/A',
      z.aqi || 'N/A',
      z.areaSqMeters,
      z.zoneAlertsCount
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prognosticator_Resource_Utilization_Heatmap_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper for heatmap visual intensity style
  const getHeatmapZoneVisuals = (zone: typeof zoneStaffingData[0]) => {
    if (heatmapMode === 'WORKER_DENSITY') {
      const densityPer100m2 = (zone.effectiveWorkers / zone.areaSqMeters) * 100;
      if (densityPer100m2 > 1.2 || zone.effectiveWorkers > zone.maxSafeCapacity) {
        return {
          glowColor: 'rgba(239, 68, 68, 0.45)', // Red glow
          borderColor: 'border-rose-500',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          intensityLabel: 'High Congestion'
        };
      } else if (densityPer100m2 > 0.7) {
        return {
          glowColor: 'rgba(245, 158, 11, 0.35)', // Amber glow
          borderColor: 'border-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          intensityLabel: 'Moderate Density'
        };
      }
      return {
        glowColor: 'rgba(16, 185, 129, 0.2)', // Emerald glow
        borderColor: 'border-emerald-500/60',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        intensityLabel: 'Dispersed / Safe'
      };
    } else if (heatmapMode === 'THERMAL_HEAT_STRAIN') {
      if ((zone.twl || 150) < 100 || (zone.heatIndex || 30) > 40) {
        return {
          glowColor: 'rgba(225, 29, 72, 0.5)',
          borderColor: 'border-rose-500',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-500/50',
          intensityLabel: 'Severe Thermal Danger'
        };
      } else if ((zone.twl || 150) < 125 || (zone.heatIndex || 30) > 34) {
        return {
          glowColor: 'rgba(245, 158, 11, 0.4)',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/50',
          intensityLabel: 'Elevated Heat Strain'
        };
      }
      return {
        glowColor: 'rgba(6, 182, 212, 0.25)',
        borderColor: 'border-cyan-500/60',
        textColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
        intensityLabel: 'Optimal Microclimate'
      };
    } else if (heatmapMode === 'CAPACITY_UTILIZATION') {
      if (zone.utilizationPct > 100) {
        return {
          glowColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'border-red-500',
          textColor: 'text-red-400',
          badgeBg: 'bg-red-950 text-red-300 border-red-500',
          intensityLabel: `${zone.utilizationPct.toFixed(0)}% OVERLOAD`
        };
      } else if (zone.utilizationPct > 80) {
        return {
          glowColor: 'rgba(245, 158, 11, 0.35)',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/50',
          intensityLabel: `${zone.utilizationPct.toFixed(0)}% Near Capacity`
        };
      }
      return {
        glowColor: 'rgba(16, 185, 129, 0.25)',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
        intensityLabel: `${zone.utilizationPct.toFixed(0)}% Safe Operating`
      };
    } else {
      // COMPOSITE_RISK
      if (zone.compositeRiskIndex > 75) {
        return {
          glowColor: 'rgba(225, 29, 72, 0.5)',
          borderColor: 'border-rose-500',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-500',
          intensityLabel: `Score ${zone.compositeRiskIndex}/100 - Critical`
        };
      } else if (zone.compositeRiskIndex > 50) {
        return {
          glowColor: 'rgba(245, 158, 11, 0.35)',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/50',
          intensityLabel: `Score ${zone.compositeRiskIndex}/100 - Warning`
        };
      }
      return {
        glowColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
        intensityLabel: `Score ${zone.compositeRiskIndex}/100 - Normal`
      };
    }
  };

  return (
    <div
      id="resource-utilization-panel"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Ambient backdrop gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Global Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-lg">
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Resource Utilization &amp; Workforce Heatmap
              <span className="text-xs font-mono font-normal bg-amber-950/70 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                {aggregateMetrics.totalWorkers} Workers Deployed Across {zoneStaffingData.length} Zones
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time worker density distribution across high-risk industrial zones with thermal heat strain overlay, capacity monitoring, and automated shift rebalancing.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Automated Rebalance Trigger */}
          <button
            onClick={handleExecuteAutomatedRebalance}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-md transition cursor-pointer"
            title="Auto-rebalance workers from high-strain zones to safe rest areas"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Auto-Rebalance Cohort</span>
          </button>

          {Object.keys(staffingAdjustments).length > 0 && (
            <button
              onClick={handleResetAdjustments}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Reset simulated adjustments to live physical telemetry"
            >
              <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-xs"
            title="Download full utilization metrics as CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          {onNavigateToFloorplan && (
            <button
              onClick={onNavigateToFloorplan}
              className="flex items-center space-x-1 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              title="Open full 2D interactive architectural floorplan"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Floorplan</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Feedback Banner */}
      {rebalanceFeedback && (
        <div className="my-3 p-3 bg-amber-950/70 border border-amber-500/50 rounded-lg text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{rebalanceFeedback}</span>
          </div>
          <button
            onClick={() => setRebalanceFeedback(null)}
            className="text-amber-400 hover:text-white underline text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Warning Alert if Critical Overload Exists */}
      {aggregateMetrics.overloadedZonesCount > 0 && (
        <div className="my-3 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs flex items-start gap-3 animate-fadeIn">
          <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-rose-200 block">
              High-Risk Zone Overcapacity Detected ({aggregateMetrics.overloadedZonesCount} Zone{aggregateMetrics.overloadedZonesCount !== 1 ? 's' : ''})
            </span>
            <p className="text-slate-300 mt-0.5">
              Worker concentration in hazardous industrial zones exceeds safe thermal exposure dwell times. Continuous staffing under current TWL (&lt; 115 W/m²) may precipitate autonomic exhaustion. Execute automated rotation or manually reassign workers below.
            </p>
          </div>
          <button
            onClick={handleExecuteAutomatedRebalance}
            className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
          >
            Rebalance Now
          </button>
        </div>
      )}

      {/* KPI Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Monitored Workforce</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-white">{aggregateMetrics.totalWorkers}</span>
              <span className="text-xs text-slate-400">/ {aggregateMetrics.totalCapacity} Cap</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  aggregateMetrics.overallUtilization > 90
                    ? 'bg-rose-500'
                    : aggregateMetrics.overallUtilization > 75
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, aggregateMetrics.overallUtilization)}%` }}
              ></div>
            </div>
          </div>
          <Users className="h-6 w-6 text-cyan-400/50" />
        </div>

        <div className="bg-slate-950/80 border border-rose-500/30 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-300 uppercase tracking-wider block font-medium">High-Risk Zone Exposure</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-rose-400">{aggregateMetrics.highRiskWorkers}</span>
              <span className="text-xs text-rose-300/80">({aggregateMetrics.highRiskPct}% of total)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">In Critical/Moderate Sectors</span>
          </div>
          <Flame className="h-6 w-6 text-rose-500/50" />
        </div>

        <div className="bg-slate-950/80 border border-amber-500/30 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-medium">Thermal Strain Zones</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-amber-400">{aggregateMetrics.criticalHeatZonesCount}</span>
              <span className="text-xs text-slate-400">TWL &lt; 115 W/m²</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Require Mandatory Hydration</span>
          </div>
          <Thermometer className="h-6 w-6 text-amber-400/50" />
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Capacity Bottlenecks</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className={`text-xl font-bold ${aggregateMetrics.overloadedZonesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {aggregateMetrics.overloadedZonesCount}
              </span>
              <span className="text-xs text-slate-400">Over-Limit Zones</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {aggregateMetrics.overloadedZonesCount > 0 ? 'Action Recommended' : 'Optimal Capacity'}
            </span>
          </div>
          <ShieldCheck className={`h-6 w-6 ${aggregateMetrics.overloadedZonesCount > 0 ? 'text-rose-400/60' : 'text-emerald-400/60'}`} />
        </div>
      </div>

      {/* Heatmap Mode Selector Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 text-xs mb-4">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-slate-300 font-semibold">Heatmap Overlay Mode:</span>
        </div>

        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-medium flex-wrap gap-1">
          <button
            onClick={() => setHeatmapMode('WORKER_DENSITY')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              heatmapMode === 'WORKER_DENSITY'
                ? 'bg-cyan-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Worker Density</span>
          </button>

          <button
            onClick={() => setHeatmapMode('THERMAL_HEAT_STRAIN')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              heatmapMode === 'THERMAL_HEAT_STRAIN'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Thermal Strain (TWL)</span>
          </button>

          <button
            onClick={() => setHeatmapMode('CAPACITY_UTILIZATION')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              heatmapMode === 'CAPACITY_UTILIZATION'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Capacity %</span>
          </button>

          <button
            onClick={() => setHeatmapMode('COMPOSITE_RISK')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
              heatmapMode === 'COMPOSITE_RISK'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Risk-Weighted Load</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Heatmap Facility Grid on Left, Zone Detail Drilldown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Heatmap Visual Map Board (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Schematic Sub-header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Facility Spatial Schematic Overlay
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Mode: <span className="text-cyan-300 font-bold">{heatmapMode.replace(/_/g, ' ')}</span>
            </span>
          </div>

          {/* Interactive Heatmap Floor Schematic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10 py-1">
            {zoneStaffingData.map((zone) => {
              const visuals = getHeatmapZoneVisuals(zone);
              const isSelected = zone.id === activeZoneDetailId;

              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    setActiveZoneDetailId(zone.id);
                    if (onSelectZone) onSelectZone(zone.id);
                  }}
                  style={{
                    boxShadow: `0 0 25px ${visuals.glowColor}`
                  }}
                  className={`relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.01]'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-850'
                  }`}
                >
                  {/* Heatmap Radial Halo Background */}
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-all duration-300 opacity-60"
                    style={{ backgroundColor: visuals.glowColor }}
                  ></div>

                  {/* Top Bar of Zone Card */}
                  <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        {zone.id.split('-')[0]}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-[170px]" title={zone.name}>
                        {zone.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${visuals.badgeBg}`}
                    >
                      {zone.status}
                    </span>
                  </div>

                  {/* Heatmap Overlay Intensity Badge */}
                  <div className="flex items-center justify-between text-[11px] font-mono mb-2 relative z-10">
                    <span className="text-slate-400">Heat Level:</span>
                    <span className={`font-bold ${visuals.textColor}`}>{visuals.intensityLabel}</span>
                  </div>

                  {/* Worker Headcount Meter */}
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <Users className="h-3 w-3 text-cyan-400" />
                        <span>Staff:</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {zone.effectiveWorkers}
                        <span className="text-[10px] text-slate-400 font-normal"> / {zone.maxSafeCapacity} max</span>
                        {zone.delta !== 0 && (
                          <span
                            className={`ml-1 text-[10px] ${
                              zone.delta > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            ({zone.delta > 0 ? `+${zone.delta}` : zone.delta})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar of Capacity */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          zone.utilizationPct > 100
                            ? 'bg-rose-500 animate-pulse'
                            : zone.utilizationPct > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, zone.utilizationPct)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Environmental Telemetry Metrics Chips */}
                  <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-300 relative z-10">
                    <div className="bg-slate-950/70 p-1 rounded text-center">
                      <span className="text-slate-500 block text-[8px]">TWL</span>
                      <span
                        className={`font-bold ${
                          (zone.twl || 150) < 115 ? 'text-rose-400' : 'text-cyan-300'
                        }`}
                      >
                        {zone.twl ? `${zone.twl}` : '142'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 p-1 rounded text-center">
                      <span className="text-slate-500 block text-[8px]">TEMP</span>
                      <span className="font-bold text-amber-300">{zone.temp || '31°C'}</span>
                    </div>
                    <div className="bg-slate-950/70 p-1 rounded text-center">
                      <span className="text-slate-500 block text-[8px]">ALERTS</span>
                      <span
                        className={`font-bold ${
                          zone.zoneAlertsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {zone.zoneAlertsCount}
                      </span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="mt-2 text-center text-[10px] font-semibold text-cyan-400 flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>Inspecting Cohort</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Heatmap Legend Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-400 font-mono">
            <div className="flex items-center space-x-3">
              <span className="text-slate-500">Legend:</span>
              <div className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span>Safe / Dispersed</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                <span>Elevated Strain</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-rose-300 font-bold">Critical Overload</span>
              </div>
            </div>
            <span className="text-slate-500 text-[10px]">
              Click any zone tile to adjust staffing allocation
            </span>
          </div>
        </div>

        {/* Right Side: Active Zone Cohort & Rebalancing Console (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            {/* Header of Drilldown */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono block uppercase">Zone Drilldown &amp; Staffing</span>
                <h3 className="text-sm font-bold text-white">{activeZoneDetail.name}</h3>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  activeZoneDetail.status === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                    : activeZoneDetail.status === 'MODERATE'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {activeZoneDetail.status}
              </span>
            </div>

            {/* Description & Hazard List */}
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {activeZoneDetail.description || 'Monitored industrial facility sector.'}
            </p>

            <div className="mb-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Environmental Hazards:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeZoneDetail.activeHazards && activeZoneDetail.activeHazards.length > 0 ? (
                  activeZoneDetail.activeHazards.map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                      <span>{h}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No primary hazards logged</span>
                )}
              </div>
            </div>

            {/* Staffing Allocation Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Manual Staffing Allocation</span>
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {activeZoneDetail.effectiveWorkers} Workers
                </span>
              </div>

              {/* Slider for adjusting cohort */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(activeZoneDetail.maxSafeCapacity * 1.5, 60)}
                  value={activeZoneDetail.effectiveWorkers}
                  onChange={(e) => {
                    const newVal = parseInt(e.target.value, 10);
                    const newDelta = newVal - activeZoneDetail.currentWorkers;
                    setStaffingAdjustments((prev) => ({
                      ...prev,
                      [activeZoneDetail.id]: newDelta
                    }));
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>0 (Vacant)</span>
                  <span className="text-amber-400">Safe Cap: {activeZoneDetail.maxSafeCapacity}</span>
                  <span>{Math.round(activeZoneDetail.maxSafeCapacity * 1.5)} (Max)</span>
                </div>
              </div>

              {/* Quick Stepper Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px]">Quick Reassign:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setStaffingAdjustments((prev) => ({
                        ...prev,
                        [activeZoneDetail.id]: (prev[activeZoneDetail.id] || 0) - 2
                      }));
                    }}
                    disabled={activeZoneDetail.effectiveWorkers <= 0}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition disabled:opacity-40"
                    title="Evacuate 2 workers to rest shelter"
                  >
                    -2 Relieve
                  </button>

                  <button
                    onClick={() => {
                      setStaffingAdjustments((prev) => ({
                        ...prev,
                        [activeZoneDetail.id]: (prev[activeZoneDetail.id] || 0) + 2
                      }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition"
                    title="Deploy 2 reinforcement workers"
                  >
                    +2 Deploy
                  </button>
                </div>
              </div>
            </div>

            {/* Ergonomic & Thermal Safety Diagnostics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Zone Floor Area</span>
                <span className="font-bold text-white text-xs mt-0.5 block">
                  {activeZoneDetail.areaSqMeters} m²
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {((activeZoneDetail.effectiveWorkers / activeZoneDetail.areaSqMeters) * 100).toFixed(1)} workers / 100m²
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Cooling Proximity</span>
                <span className="font-bold text-cyan-300 text-xs mt-0.5 block">
                  {activeZoneDetail.coolingDistMeters}m to Shelter
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {activeZoneDetail.coolingDistMeters < 30 ? 'Immediate Access' : 'Escorted Transit Required'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer for Selected Zone */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {activeZoneDetail.zoneAlertsCount} active alert{activeZoneDetail.zoneAlertsCount !== 1 ? 's' : ''} in zone
            </span>

            <button
              onClick={() => {
                if (onSelectZone) onSelectZone(activeZoneDetail.id);
                const el = document.getElementById('historical-health-chart-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs font-semibold underline"
            >
              <span>Inspect Telemetry Trend</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

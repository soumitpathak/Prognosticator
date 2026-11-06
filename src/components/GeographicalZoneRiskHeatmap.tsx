import React, { useState, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Users,
  MapPin,
  Activity,
  Layers,
  Sparkles,
  Thermometer,
  Volume2,
  Heart,
  Wind,
  Compass,
  Filter,
  CheckCircle2,
  ArrowRight,
  Radio,
  Clock,
  Eye,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';

export interface WorkforceSegmentData {
  id: string;
  segmentName: string;
  roleCategory: string;
  zoneId: string;
  zoneName: string;
  locationLabel: string;
  cohortSize: number;
  activeRiskScore: number; // 0 - 100
  riskTier: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'STABLE';
  hasHighRiskMarker: boolean;
  anomalyMarkerTitle?: string;
  anomalyMarkerAttribution?: string;
  measuredMetrics: {
    heartRateBpm: number;
    hrvMs: number;
    skinTempC: number;
    noiseDb: number;
    ambientTempC: number;
    twlWPerM2: number;
  };
  recommendedAction: string;
  privacyShieldEnforced: boolean;
}

interface GeographicalZoneRiskHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onDispatchAction?: (alertOrZone: { zoneName: string; severity: 'CRITICAL' | 'HIGH' | 'MODERATE'; directive: string }) => void;
  className?: string;
}

export default function GeographicalZoneRiskHeatmap({
  zones,
  alerts,
  telemetryStream,
  selectedZoneId,
  onSelectZone,
  onDispatchAction,
  className = ''
}: GeographicalZoneRiskHeatmapProps) {
  const [viewMode, setViewMode] = useState<'GEOGRAPHICAL_ZONES' | 'WORKFORCE_SEGMENTS'>('GEOGRAPHICAL_ZONES');
  const [highRiskOnly, setHighRiskOnly] = useState<boolean>(false);
  const [selectedInspectId, setSelectedInspectId] = useState<string | null>(null);
  const [metricLayer, setMetricLayer] = useState<'RISK' | 'THERMAL' | 'AUTONOMIC_HRV' | 'ACOUSTIC'>('RISK');

  // Latest telemetry snapshot
  const latestTelemetry = telemetryStream[telemetryStream.length - 1] || null;

  // Rich workforce segment models representing operational cohorts
  const workforceSegments: WorkforceSegmentData[] = useMemo(() => {
    return [
      {
        id: 'SEG-RIGGERS-SEC4',
        segmentName: 'Heavy Structural Steel Riggers & Ironworkers',
        roleCategory: 'High-Altitude Structural Assembly',
        zoneId: 'Outdoor-Construction-Sector-4',
        zoneName: 'Outdoor Construction Sector 4',
        locationLabel: 'Sector 4 High Elevation Grid',
        cohortSize: 18,
        activeRiskScore: 92.4,
        riskTier: 'CRITICAL_RISK',
        hasHighRiskMarker: true,
        anomalyMarkerTitle: 'Acute Autonomic & Core Thermal Strain Breach',
        anomalyMarkerAttribution: 'Solar radiation load (44.2°C) + Heavy physical exertion causing cardiac acceleration and HRV collapse (31 ms).',
        measuredMetrics: {
          heartRateBpm: latestTelemetry?.heart_rate_bpm ?? 138,
          hrvMs: latestTelemetry?.smoothed_hrv ?? 31.4,
          skinTempC: latestTelemetry?.skin_temp_c ?? 38.45,
          noiseDb: latestTelemetry?.noise_db ?? 98.4,
          ambientTempC: latestTelemetry?.ambient_temp_c ?? 44.2,
          twlWPerM2: latestTelemetry?.twl_index ?? 92.4
        },
        recommendedAction: 'Immediate shaded cooling extraction; stage rapid oral rehydration and 20-minute mandatory rest cycle.',
        privacyShieldEnforced: true
      },
      {
        id: 'SEG-TUNNEL-EXCAV',
        segmentName: 'Subgrade Conduit Excavators & Pipe Fitters',
        roleCategory: 'Confined Space Heavy Utility',
        zoneId: 'Subgrade-Tunnel-Conduit-7',
        zoneName: 'Subgrade Tunnel Conduit 7',
        locationLabel: 'Conduit Trench Level -3',
        cohortSize: 8,
        activeRiskScore: 86.8,
        riskTier: 'HIGH_RISK',
        hasHighRiskMarker: true,
        anomalyMarkerTitle: 'Restricted Airflow & Micro-Particulate Dust Breach',
        anomalyMarkerAttribution: 'Elevated AQI (122) & confined space humidity trap retarding convective sweat evaporation.',
        measuredMetrics: {
          heartRateBpm: 122,
          hrvMs: 34.8,
          skinTempC: 37.85,
          noiseDb: 91.2,
          ambientTempC: 38.1,
          twlWPerM2: 104.5
        },
        recommendedAction: 'Deploy auxiliary ventilation blowers; k-anonymity privacy shield active (N=8 < 12 small-cell suppressed).',
        privacyShieldEnforced: true
      },
      {
        id: 'SEG-WH-LOGISTICS',
        segmentName: 'High-Bay Material Handlers & Forklift Operators',
        roleCategory: 'Continuous Warehouse Logistics',
        zoneId: 'Warehouse-Logistics-Hub-North',
        zoneName: 'Warehouse Logistics Hub North',
        locationLabel: 'Logistics Staging Bay 3',
        cohortSize: 25,
        activeRiskScore: 68.5,
        riskTier: 'MODERATE_RISK',
        hasHighRiskMarker: false,
        anomalyMarkerTitle: 'Circadian Fatigue & Sleep Deficit Accumulation',
        anomalyMarkerAttribution: 'Accumulated 3.5h sleep debt over 10-hour shift rotation causing parasympathetic suppression.',
        measuredMetrics: {
          heartRateBpm: 94,
          hrvMs: 44.2,
          skinTempC: 36.95,
          noiseDb: 78.5,
          ambientTempC: 36.5,
          twlWPerM2: 118.0
        },
        recommendedAction: 'Rotate personnel from high-level pick stacks to ground sorting; stage hydration break.',
        privacyShieldEnforced: true
      },
      {
        id: 'SEG-ROBOTICS-LINEB',
        segmentName: 'Precision Robotics & Mechatronics Technicians',
        roleCategory: 'Advanced Manufacturing Clean Line',
        zoneId: 'Manufacturing-Assembly-Line-B',
        zoneName: 'Manufacturing Assembly Line B',
        locationLabel: 'Cleanroom Cell 2B',
        cohortSize: 42,
        activeRiskScore: 28.2,
        riskTier: 'STABLE',
        hasHighRiskMarker: false,
        anomalyMarkerTitle: 'Nominal Baseline Operating State',
        anomalyMarkerAttribution: 'All microclimate and physiological biomarkers running within 1-sigma standard bounds.',
        measuredMetrics: {
          heartRateBpm: 76,
          hrvMs: 62.8,
          skinTempC: 36.4,
          noiseDb: 68.2,
          ambientTempC: 31.0,
          twlWPerM2: 142.1
        },
        recommendedAction: 'Maintain standard 2-hour ergonomic rotation intervals.',
        privacyShieldEnforced: true
      },
      {
        id: 'SEG-CHEM-REFINERY',
        segmentName: 'Hazardous Chemical Reaction Operators',
        roleCategory: 'High-Pressure Refining & Valve Staging',
        zoneId: 'Chemical-Refining-Plant-C',
        zoneName: 'Chemical Refining Plant C',
        locationLabel: 'Cracking Tower Battery D',
        cohortSize: 34,
        activeRiskScore: 78.4,
        riskTier: 'HIGH_RISK',
        hasHighRiskMarker: true,
        anomalyMarkerTitle: 'Acoustic Steam Relief Valve Overpressure Spike',
        anomalyMarkerAttribution: 'Exchanger blowdown acoustic surge (102.4 dBA) and radiant flange heat (39.8°C).',
        measuredMetrics: {
          heartRateBpm: 118,
          hrvMs: 38.2,
          skinTempC: 37.6,
          noiseDb: 102.4,
          ambientTempC: 39.8,
          twlWPerM2: 108.2
        },
        recommendedAction: 'Mandate secondary ear defense verification; inspect vibration mounts on compressor 3.',
        privacyShieldEnforced: true
      },
      {
        id: 'SEG-COLD-CHAIN',
        segmentName: 'Cryogenic Palletizers & Freeze Staging Crew',
        roleCategory: 'Sub-Zero Cold Chain Depots',
        zoneId: 'Cold-Chain-Cryogenic-Alpha',
        zoneName: 'Cold Chain Cryogenic Depot Alpha',
        locationLabel: 'Deep Freeze Bay -18°C',
        cohortSize: 22,
        activeRiskScore: 24.5,
        riskTier: 'STABLE',
        hasHighRiskMarker: false,
        anomalyMarkerTitle: 'Nominal Hypothermic Guarding',
        anomalyMarkerAttribution: 'Thermoregulatory coats intact; cutaneous vasoconstriction within safe time limits.',
        measuredMetrics: {
          heartRateBpm: 74,
          hrvMs: 66.4,
          skinTempC: 35.8,
          noiseDb: 62.0,
          ambientTempC: 8.5,
          twlWPerM2: 165.0
        },
        recommendedAction: 'Verify mandatory 30-minute warming chamber transitions.',
        privacyShieldEnforced: true
      }
    ];
  }, [latestTelemetry]);

  // Aggregate Geographical Zones with Real-Time Risk Calculations
  const geographicalZonesWithRisk = useMemo(() => {
    return zones.map((zone) => {
      const zoneAlerts = alerts.filter(
        (a) =>
          a.location_zone.toLowerCase().includes(zone.id.toLowerCase()) ||
          zone.id.toLowerCase().includes(a.location_zone.toLowerCase())
      );
      const criticalAlerts = zoneAlerts.filter((a) => a.severity === 'CRITICAL');
      const highAlerts = zoneAlerts.filter((a) => a.severity === 'HIGH');
      const hasHighRiskMarker = zone.status === 'CRITICAL' || criticalAlerts.length > 0 || highAlerts.length > 0;

      // Calculate composite risk score based on zone attributes & alerts
      let computedRisk = zone.status === 'CRITICAL' ? 88.5 : zone.status === 'MODERATE' ? 56.0 : 26.5;
      if (criticalAlerts.length > 0) computedRisk = Math.min(96.5, computedRisk + criticalAlerts.length * 4.5);

      // Primary risk driver detection
      let primaryDriver = 'Baseline Variation';
      if (zone.temp && parseFloat(zone.temp) > 40) {
        primaryDriver = 'Extreme Ambient Heat & Solar Radiant Load';
      } else if (zone.aqi > 100) {
        primaryDriver = 'Confined Particulate AQI & Low Ventilation';
      } else if (zone.heatIndex > 35) {
        primaryDriver = 'Elevated Wet-Bulb Heat Index';
      } else if (zone.status === 'CRITICAL') {
        primaryDriver = 'Acute Autonomic & Core Temperature Strain';
      }

      // Heatmap Color scale logic (0 - 100)
      const isCritical = computedRisk >= 80;
      const isHigh = computedRisk >= 65 && computedRisk < 80;
      const isModerate = computedRisk >= 45 && computedRisk < 65;

      return {
        ...zone,
        zoneAlerts,
        criticalAlertCount: criticalAlerts.length,
        hasHighRiskMarker,
        computedRisk,
        primaryDriver,
        riskTier: isCritical
          ? ('CRITICAL_RISK' as const)
          : isHigh
          ? ('HIGH_RISK' as const)
          : isModerate
          ? ('MODERATE_RISK' as const)
          : ('STABLE' as const)
      };
    });
  }, [zones, alerts]);

  // Filtering based on High-Risk Only toggle
  const filteredZones = useMemo(() => {
    if (!highRiskOnly) return geographicalZonesWithRisk;
    return geographicalZonesWithRisk.filter((z) => z.hasHighRiskMarker || z.computedRisk >= 65);
  }, [geographicalZonesWithRisk, highRiskOnly]);

  const filteredWorkforceSegments = useMemo(() => {
    if (!highRiskOnly) return workforceSegments;
    return workforceSegments.filter((s) => s.hasHighRiskMarker || s.activeRiskScore >= 65);
  }, [workforceSegments, highRiskOnly]);

  // High-Risk Summary Metrics
  const highRiskZoneCount = geographicalZonesWithRisk.filter((z) => z.hasHighRiskMarker).length;
  const highRiskSegmentCount = workforceSegments.filter((s) => s.hasHighRiskMarker).length;
  const totalMonitoredWorkers = geographicalZonesWithRisk.reduce((acc, z) => acc + (z.count || 0), 0);

  // Inspector target object
  const inspectedZone = selectedInspectId
    ? geographicalZonesWithRisk.find((z) => z.id === selectedInspectId)
    : null;
  const inspectedSegment = selectedInspectId
    ? workforceSegments.find((s) => s.id === selectedInspectId)
    : null;

  // Color helper for risk score
  const getRiskScoreBadge = (score: number) => {
    if (score >= 80) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs shadow-rose-950/40 ring-1 ring-rose-500/40';
    }
    if (score >= 60) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const getHeatmapCellGradient = (score: number, isSelected: boolean) => {
    if (score >= 80) {
      return isSelected
        ? 'bg-gradient-to-br from-rose-950/90 via-rose-900/80 to-slate-900 border-rose-400 ring-2 ring-rose-500/60 shadow-lg shadow-rose-950/50'
        : 'bg-gradient-to-br from-rose-950/80 via-rose-900/50 to-slate-950 border-rose-500/60 hover:border-rose-400 shadow-md shadow-rose-950/30';
    }
    if (score >= 60) {
      return isSelected
        ? 'bg-gradient-to-br from-amber-950/90 via-amber-900/70 to-slate-900 border-amber-400 ring-2 ring-amber-500/60 shadow-lg shadow-amber-950/50'
        : 'bg-gradient-to-br from-amber-950/70 via-amber-900/40 to-slate-950 border-amber-500/50 hover:border-amber-400';
    }
    return isSelected
      ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-cyan-400 ring-2 ring-cyan-500/50 shadow-md shadow-cyan-950/40'
      : 'bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border-slate-800 hover:border-slate-700';
  };

  return (
    <div id="geographical-zone-risk-heatmap" className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Geographical Zones &amp; Workforce Segments Risk Heatmap</span>
            </h2>
            <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
              {highRiskZoneCount} High-Risk Zones Active
            </span>
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Live Anomaly Sentinel
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic thermal &amp; multidimensional anomaly heat matrix highlighting geographical sectors and labor cohorts currently breaching physiological and environmental safety thresholds.
          </p>
        </div>

        {/* Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Dual Perspective Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('GEOGRAPHICAL_ZONES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'GEOGRAPHICAL_ZONES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Geographical Zones</span>
            </button>
            <button
              onClick={() => setViewMode('WORKFORCE_SEGMENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'WORKFORCE_SEGMENTS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Workforce Segments</span>
            </button>
          </div>

          {/* Metric Layer Filter (Only in Geographical Mode) */}
          {viewMode === 'GEOGRAPHICAL_ZONES' && (
            <div className="hidden sm:flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setMetricLayer('RISK')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  metricLayer === 'RISK' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Composite Risk
              </button>
              <button
                onClick={() => setMetricLayer('THERMAL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  metricLayer === 'THERMAL' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal WBGT
              </button>
              <button
                onClick={() => setMetricLayer('AUTONOMIC_HRV')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  metricLayer === 'AUTONOMIC_HRV' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Autonomic HRV
              </button>
            </div>
          )}

          {/* High-Risk Only Quick Filter */}
          <button
            onClick={() => setHighRiskOnly(!highRiskOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-xs ${
              highRiskOnly
                ? 'bg-rose-950 text-rose-200 border-rose-500 ring-2 ring-rose-500/40'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Toggle filter to display only zones or segments with active high-risk anomaly markers"
          >
            <Filter className={`h-3.5 w-3.5 ${highRiskOnly ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>High-Risk Only</span>
            {highRiskOnly && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">High-Risk Sectors</span>
            <div className="text-xl font-bold font-mono text-rose-400 flex items-center gap-1.5 mt-0.5">
              <span>{highRiskZoneCount} / {geographicalZonesWithRisk.length}</span>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            </div>
          </div>
          <Flame className="h-4 w-4 text-rose-400 shrink-0" />
        </div>

        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">High-Risk Cohorts</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {highRiskSegmentCount} of {workforceSegments.length}
            </div>
          </div>
          <Users className="h-4 w-4 text-amber-400 shrink-0" />
        </div>

        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Monitored Personnel</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {totalMonitoredWorkers} Workers
            </div>
          </div>
          <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
        </div>

        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Privacy Shield</span>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>k-Anonymity Verified</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">N &ge; 12</span>
        </div>
      </div>

      {/* HEATMAP VIEW 1: GEOGRAPHICAL ZONES HEATMAP */}
      {viewMode === 'GEOGRAPHICAL_ZONES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Operational Facility Zones ({filteredZones.length} Mapped)</span>
            </span>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-950 border border-emerald-600/70" /> Stable (&lt;45%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-950 border border-amber-500/70" /> Moderate (45-79%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-950 border border-rose-500/80 animate-pulse" /> Critical (&ge;80%)
              </span>
            </div>
          </div>

          {/* Geographical Cards Heat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const cardBg = getHeatmapCellGradient(zone.computedRisk, isSelected);

              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    onSelectZone(zone.id);
                    setSelectedInspectId(zone.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${cardBg}`}
                >
                  {/* High-Risk Anomaly Marker Pulsing Halo */}
                  {zone.hasHighRiskMarker && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/15 rounded-full blur-xl pointer-events-none animate-pulse" />
                  )}

                  <div>
                    {/* Header: Zone Name & Anomaly Marker Beacon */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="pr-1">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-cyan-400" />
                          <span>{zone.latitude.toFixed(2)}°N, {zone.longitude.toFixed(2)}°E</span>
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition mt-0.5 line-clamp-1" title={zone.name}>
                          {zone.name.replace(/-/g, ' ')}
                        </h3>
                      </div>

                      {/* Anomaly Marker Badge */}
                      {zone.hasHighRiskMarker ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-500 bg-rose-950 text-rose-300 flex items-center gap-1 animate-pulse shrink-0 shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                          <span>HIGH-RISK</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-400 shrink-0">
                          NOMINAL
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {zone.description}
                    </p>

                    {/* Sensor Heat Matrix Metrics */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 mb-3 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono">Heat / Temp</span>
                        <strong className="text-xs font-mono text-amber-300 font-bold">{zone.temp || '32.0°C'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono">Wet-Bulb TWL</span>
                        <strong className="text-xs font-mono text-cyan-300 font-bold">{zone.twl} W/m²</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono">AQI Level</span>
                        <strong className={`text-xs font-mono font-bold ${zone.aqi > 100 ? 'text-rose-400' : 'text-emerald-300'}`}>
                          {zone.aqi}
                        </strong>
                      </div>
                    </div>

                    {/* Visual Risk Gradient Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Risk Intensity:</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded border ${getRiskScoreBadge(zone.computedRisk)}`}>
                          {zone.computedRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            zone.computedRisk >= 80 ? 'bg-rose-500 animate-pulse' : zone.computedRisk >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${zone.computedRisk}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Primary Hazard & Action */}
                  <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="text-slate-400 line-clamp-1 mb-2">
                      <strong className="text-slate-300">Driver:</strong>{' '}
                      <span className={zone.hasHighRiskMarker ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
                        {zone.primaryDriver}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Cohort: <strong className="text-slate-300">{zone.count}</strong> on duty
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectZone(zone.id);
                          if (zone.hasHighRiskMarker && onDispatchAction) {
                            onDispatchAction({
                              zoneName: zone.name,
                              severity: 'CRITICAL',
                              directive: `High-risk anomaly marker triggered in ${zone.name}. Staged automated cooling & hydration triage.`
                            });
                          }
                        }}
                        className={`text-[11px] font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                          zone.hasHighRiskMarker
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{zone.hasHighRiskMarker ? 'Dispatch Protocol' : 'Select Zone'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HEATMAP VIEW 2: WORKFORCE SEGMENTS HEATMAP */}
      {viewMode === 'WORKFORCE_SEGMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span>Operational Labor Cohorts &amp; Physiological Anomaly Markers ({filteredWorkforceSegments.length} Segments)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Real-Time Physiological Telemetry (HRV, Core Temp, Acoustic dB)
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono uppercase tracking-wider bg-slate-950/90">
                  <th className="py-3 px-3 font-semibold">Workforce Cohort &amp; Location</th>
                  <th className="py-3 px-2 text-center font-semibold">Size</th>
                  <th className="py-3 px-2 text-center font-semibold">Heart Rate</th>
                  <th className="py-3 px-2 text-center font-semibold">Autonomic HRV</th>
                  <th className="py-3 px-2 text-center font-semibold">Core/Skin Temp</th>
                  <th className="py-3 px-2 text-center font-semibold">Noise dB</th>
                  <th className="py-3 px-2 text-center font-semibold">Composite Risk</th>
                  <th className="py-3 px-3 font-semibold text-center">Anomaly Marker</th>
                  <th className="py-3 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredWorkforceSegments.map((segment) => {
                  const isSelected = selectedZoneId === segment.zoneId;

                  return (
                    <tr
                      key={segment.id}
                      onClick={() => {
                        onSelectZone(segment.zoneId);
                        setSelectedInspectId(segment.id);
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400'
                          : segment.hasHighRiskMarker
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-900/80'
                      }`}
                    >
                      {/* Cohort Name & Duty Station */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`p-1.5 rounded-lg border shrink-0 ${
                              segment.hasHighRiskMarker
                                ? 'bg-rose-950/80 border-rose-500/50 text-rose-400 animate-pulse'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs font-sans">
                              {segment.segmentName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-slate-500" />
                              <span>{segment.locationLabel}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-cyan-400">{segment.zoneName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cohort Size */}
                      <td className="py-3 px-2 text-center font-sans text-slate-300">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px]">
                          N={segment.cohortSize}
                        </span>
                      </td>

                      {/* Heart Rate */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold ${
                            segment.measuredMetrics.heartRateBpm > 120
                              ? 'text-rose-400 animate-pulse'
                              : segment.measuredMetrics.heartRateBpm > 100
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {segment.measuredMetrics.heartRateBpm} BPM
                        </span>
                      </td>

                      {/* Autonomic HRV */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold ${
                            segment.measuredMetrics.hrvMs < 35
                              ? 'text-rose-400 animate-pulse'
                              : segment.measuredMetrics.hrvMs < 50
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {segment.measuredMetrics.hrvMs.toFixed(1)} ms
                        </span>
                      </td>

                      {/* Skin Temperature */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold ${
                            segment.measuredMetrics.skinTempC > 38.0
                              ? 'text-rose-400 animate-pulse'
                              : segment.measuredMetrics.skinTempC > 37.2
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {segment.measuredMetrics.skinTempC.toFixed(1)}°C
                        </span>
                      </td>

                      {/* Noise Level */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold ${
                            segment.measuredMetrics.noiseDb > 95
                              ? 'text-rose-400'
                              : segment.measuredMetrics.noiseDb > 85
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {segment.measuredMetrics.noiseDb.toFixed(1)} dB
                        </span>
                      </td>

                      {/* Composite Risk Score Badge */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${getRiskScoreBadge(
                            segment.activeRiskScore
                          )}`}
                        >
                          {segment.activeRiskScore.toFixed(1)}%
                        </span>
                      </td>

                      {/* Anomaly Marker Tag */}
                      <td className="py-3 px-3 text-center">
                        {segment.hasHighRiskMarker ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500/80 text-rose-300 font-bold text-[10px] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                            <span>{segment.anomalyMarkerTitle?.split(' ')[0] || 'CRITICAL'} BREACH</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>STABLE</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(segment.zoneId);
                            if (segment.hasHighRiskMarker && onDispatchAction) {
                              onDispatchAction({
                                zoneName: segment.zoneName,
                                severity: 'CRITICAL',
                                directive: `${segment.segmentName}: ${segment.recommendedAction}`
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded font-sans font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer ${
                            segment.hasHighRiskMarker
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <span>{segment.hasHighRiskMarker ? 'Triage' : 'Inspect'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTOR CALLOUT FOOTER */}
      {(inspectedZone || inspectedSegment) && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start md:items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-white flex flex-wrap items-center gap-2">
                <span>
                  {inspectedZone
                    ? `Inspected Sector: ${inspectedZone.name}`
                    : `Inspected Cohort: ${inspectedSegment?.segmentName}`}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    (inspectedZone?.hasHighRiskMarker || inspectedSegment?.hasHighRiskMarker)
                      ? 'bg-rose-950 text-rose-300 border-rose-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {(inspectedZone?.hasHighRiskMarker || inspectedSegment?.hasHighRiskMarker)
                    ? 'HIGH-RISK ANOMALY ACTIVE'
                    : 'NOMINAL STATUS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {inspectedSegment
                  ? inspectedSegment.anomalyMarkerAttribution
                  : inspectedZone?.description || 'Active telemetry streaming into Kalman-LSTM pipeline.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const targetZoneId = inspectedZone?.id || inspectedSegment?.zoneId;
                if (targetZoneId) onSelectZone(targetZoneId);
                const el = document.getElementById('historical-health-chart-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition cursor-pointer"
            >
              View Telemetry Series
            </button>
            <button
              onClick={() => setSelectedInspectId(null)}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice Strip */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-2.5 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
          <span>Click any geographical sector or workforce cohort row to isolate its telemetry and deploy pre-emptive protocols.</span>
        </div>
        <div className="text-slate-400">
          Privacy Shield: k-Anonymity Verified (Cohort N &ge; 12 across operational zones)
        </div>
      </div>
    </div>
  );
}

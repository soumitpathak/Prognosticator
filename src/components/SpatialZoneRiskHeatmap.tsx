import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Users,
  MapPin,
  Activity,
  Layers,
  Thermometer,
  Volume2,
  Wind,
  CheckCircle2,
  ArrowRight,
  Radio,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  Zap,
  Info,
  Cpu,
  Wrench,
  Clock
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint, IoTEndpointFailureForecast } from '../types';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';

export interface SpatialZoneRiskHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onDispatchMitigation?: (zone: FacilityZone, action: string) => void;
  onNavigateToMaintenance?: (endpointId: string) => void;
  className?: string;
}

export type HeatmapMetricMode = 'COMPOSITE_RISK' | 'THERMAL' | 'ACOUSTIC' | 'WORKER_DENSITY' | 'IOT_PREDICTIVE_FAILURES';

interface ZoneSpatialMetrics {
  zone: FacilityZone;
  riskScore: number; // 0 - 100
  isHotSpot: boolean; // riskScore >= 65
  hotSpotSeverity: 'CRITICAL_HOTSPOT' | 'HIGH_HOTSPOT' | 'MODERATE' | 'LOW';
  activeAlertCount: number;
  criticalAlertCount: number;
  workerCount: number;
  workerDensity: number; // per 100m²
  tempC: number;
  noiseDb: number;
  twlIndex: number;
  aqi: number;
  primaryHazard: string;
  gridCoordinates: { x: number; y: number; width: number; height: number; sector: string };
  iotEndpoints: IoTEndpointFailureForecast[];
  maxEndpointFailureProb: number;
  criticalEndpointCount: number;
  iotSensorsCoordinates: { endpoint: IoTEndpointFailureForecast; pinX: number; pinY: number }[];
}

export default function SpatialZoneRiskHeatmap({
  zones,
  alerts,
  telemetryStream,
  selectedZoneId,
  onSelectZone,
  onDispatchMitigation,
  onNavigateToMaintenance,
  className = ''
}: SpatialZoneRiskHeatmapProps) {
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('COMPOSITE_RISK');
  const [filterHotspotsOnly, setFilterHotspotsOnly] = useState<boolean>(false);
  const [inspectedZoneId, setInspectedZoneId] = useState<string | null>(null);
  const [iotEndpoints, setIotEndpoints] = useState<IoTEndpointFailureForecast[]>([]);
  const [selectedSensorPin, setSelectedSensorPin] = useState<IoTEndpointFailureForecast | null>(null);

  // Sync with predictive maintenance service
  useEffect(() => {
    const unsub = predictiveMaintenanceService.subscribe(() => {
      setIotEndpoints(predictiveMaintenanceService.getEndpoints());
    });
    setIotEndpoints(predictiveMaintenanceService.getEndpoints());
    return () => unsub();
  }, []);

  const latestTelemetry = telemetryStream[telemetryStream.length - 1] || null;

  // Spatial coordinates & metrics for each facility zone
  const spatialZoneData: ZoneSpatialMetrics[] = useMemo(() => {
    // Spatial layout coordinates for SVG floor plan grid
    const layoutCoords: Record<string, { x: number; y: number; width: number; height: number; sector: string }> = {
      'Outdoor-Construction-Sector-4': { x: 20, y: 20, width: 280, height: 160, sector: 'SECTOR-04-NW' },
      'Manufacturing-Assembly-Line-B': { x: 320, y: 20, width: 260, height: 160, sector: 'LINE-B-NE' },
      'Warehouse-Logistics-Hub-North': { x: 20, y: 200, width: 240, height: 160, sector: 'WH-HUB-SW' },
      'Subgrade-Tunnel-Conduit-7': { x: 280, y: 200, width: 170, height: 160, sector: 'TUNNEL-C7-SE' },
      'Central-Maintenance-Depot': { x: 470, y: 200, width: 110, height: 160, sector: 'DEPOT-CTR-E' }
    };

    return zones.map((zone) => {
      const zoneAlerts = alerts.filter(
        (a) =>
          a.location_zone === zone.id ||
          a.location_zone === zone.name ||
          zone.name.toLowerCase().includes(a.location_zone.toLowerCase())
      );
      const criticalCount = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const highCount = zoneAlerts.filter((a) => a.severity === 'HIGH').length;

      // Deterministic risk score based on zone metrics & alerts
      let baseRisk = 24.0;
      if (zone.id === 'Outdoor-Construction-Sector-4') {
        baseRisk = 88.5; // Primary acute hotspot
      } else if (zone.id === 'Subgrade-Tunnel-Conduit-7') {
        baseRisk = 72.4; // Secondary enclosed hotspot
      } else if (zone.id === 'Manufacturing-Assembly-Line-B') {
        baseRisk = 48.2;
      } else if (zone.id === 'Warehouse-Logistics-Hub-North') {
        baseRisk = 38.0;
      } else {
        baseRisk = 18.5;
      }

      // Dynamic adjustment with live telemetry
      if (latestTelemetry && zone.id === 'Outdoor-Construction-Sector-4') {
        baseRisk = Math.min(96, Math.max(75, latestTelemetry.risk_score * 1.05));
      }

      const isHotSpot = baseRisk >= 65 || criticalCount > 0;
      const hotSpotSeverity: ZoneSpatialMetrics['hotSpotSeverity'] =
        baseRisk >= 80 || criticalCount >= 2
          ? 'CRITICAL_HOTSPOT'
          : baseRisk >= 65 || highCount >= 2
          ? 'HIGH_HOTSPOT'
          : baseRisk >= 40
          ? 'MODERATE'
          : 'LOW';

      // Parse temperature
      const tempNum = parseFloat(zone.temp.replace(/[^0-9.-]/g, '')) || 32.5;

      // Estimated worker density (count / simulated area in 100m²)
      const areaUnits = zone.id === 'Outdoor-Construction-Sector-4' ? 5.2 : zone.id === 'Warehouse-Logistics-Hub-North' ? 9.6 : 4.5;
      const density = Number(((zone.count || 20) / areaUnits).toFixed(1));

      const coords = layoutCoords[zone.id] || { x: 50, y: 50, width: 200, height: 140, sector: 'GENERAL' };

      // Correlate IoT Endpoints for this facility zone
      const zoneIotEndpoints = iotEndpoints.filter((ep) => {
        return (
          ep.zoneId === zone.id ||
          ep.zoneName.toLowerCase() === zone.name.toLowerCase() ||
          zone.name.toLowerCase().includes(ep.zoneName.toLowerCase()) ||
          ep.zoneName.toLowerCase().includes(zone.name.toLowerCase())
        );
      });

      const maxFailProb =
        zoneIotEndpoints.length > 0 ? Math.max(...zoneIotEndpoints.map((e) => e.failureProbabilityPct)) : 0;
      const criticalEpCount = zoneIotEndpoints.filter(
        (e) => e.forecastHorizon === 'CRITICAL_FAIL_24H' || e.healthScore <= 30
      ).length;

      // Assign spatial pin coordinates inside this zone
      const iotSensorsCoordinates = zoneIotEndpoints.map((ep, idx) => {
        const pinOffset = 42 + idx * 80;
        const pinX = coords.x + Math.min(coords.width - 45, pinOffset);
        const pinY = coords.y + coords.height - 24;
        return { endpoint: ep, pinX, pinY };
      });

      return {
        zone,
        riskScore: Number(baseRisk.toFixed(1)),
        isHotSpot,
        hotSpotSeverity,
        activeAlertCount: zoneAlerts.length,
        criticalAlertCount: criticalCount,
        workerCount: zone.count || 24,
        workerDensity: density,
        tempC: tempNum,
        noiseDb: zone.id === 'Manufacturing-Assembly-Line-B' ? 92.4 : zone.id === 'Outdoor-Construction-Sector-4' ? 88.0 : 76.5,
        twlIndex: zone.twl || 140,
        aqi: zone.aqi || 42,
        primaryHazard: zone.activeHazards[0] || 'Elevated Thermal Gradient',
        gridCoordinates: coords,
        iotEndpoints: zoneIotEndpoints,
        maxEndpointFailureProb: maxFailProb,
        criticalEndpointCount: criticalEpCount,
        iotSensorsCoordinates
      };
    });
  }, [zones, alerts, latestTelemetry, iotEndpoints]);

  // Filtered zones
  const displayedZones = useMemo(() => {
    if (filterHotspotsOnly) {
      return spatialZoneData.filter((z) => z.isHotSpot);
    }
    return spatialZoneData;
  }, [spatialZoneData, filterHotspotsOnly]);

  const activeHotspotsCount = spatialZoneData.filter((z) => z.isHotSpot).length;
  const inspectedZone = spatialZoneData.find((z) => z.zone.id === (inspectedZoneId || selectedZoneId)) || spatialZoneData[0];

  // Helper color gradient function based on selected metric mode
  const getCellMetricColor = (z: ZoneSpatialMetrics) => {
    switch (metricMode) {
      case 'COMPOSITE_RISK': {
        if (z.riskScore >= 80) return { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-400', fill: '#e11d48', glow: 'shadow-rose-600/30' };
        if (z.riskScore >= 65) return { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-400', fill: '#f59e0b', glow: 'shadow-amber-600/30' };
        if (z.riskScore >= 40) return { bg: 'bg-amber-950/40', border: 'border-amber-700/50', text: 'text-amber-300', fill: '#d97706', glow: 'shadow-transparent' };
        return { bg: 'bg-emerald-950/40', border: 'border-emerald-600/40', text: 'text-emerald-400', fill: '#10b981', glow: 'shadow-transparent' };
      }
      case 'IOT_PREDICTIVE_FAILURES': {
        if (z.maxEndpointFailureProb >= 80) return { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-400', fill: '#e11d48', glow: 'shadow-rose-600/30' };
        if (z.maxEndpointFailureProb >= 60) return { bg: 'bg-amber-950/80', border: 'border-amber-500', text: 'text-amber-400', fill: '#f59e0b', glow: 'shadow-amber-600/30' };
        if (z.maxEndpointFailureProb >= 30) return { bg: 'bg-yellow-950/50', border: 'border-yellow-600/50', text: 'text-yellow-300', fill: '#eab308', glow: 'shadow-transparent' };
        return { bg: 'bg-emerald-950/40', border: 'border-emerald-600/40', text: 'text-emerald-400', fill: '#10b981', glow: 'shadow-transparent' };
      }
      case 'THERMAL': {
        if (z.tempC >= 42) return { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-400', fill: '#e11d48', glow: 'shadow-rose-600/30' };
        if (z.tempC >= 36) return { bg: 'bg-orange-950/70', border: 'border-orange-500', text: 'text-orange-400', fill: '#f97316', glow: 'shadow-orange-600/30' };
        if (z.tempC >= 30) return { bg: 'bg-amber-950/50', border: 'border-amber-500/50', text: 'text-amber-300', fill: '#f59e0b', glow: 'shadow-transparent' };
        return { bg: 'bg-cyan-950/50', border: 'border-cyan-600/40', text: 'text-cyan-400', fill: '#06b6d4', glow: 'shadow-transparent' };
      }
      case 'ACOUSTIC': {
        if (z.noiseDb >= 90) return { bg: 'bg-rose-950/80', border: 'border-rose-500', text: 'text-rose-400', fill: '#e11d48', glow: 'shadow-rose-600/30' };
        if (z.noiseDb >= 85) return { bg: 'bg-amber-950/70', border: 'border-amber-500', text: 'text-amber-400', fill: '#f59e0b', glow: 'shadow-amber-600/30' };
        return { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-300', fill: '#64748b', glow: 'shadow-transparent' };
      }
      case 'WORKER_DENSITY': {
        if (z.workerDensity >= 6.0) return { bg: 'bg-indigo-950/80', border: 'border-indigo-500', text: 'text-indigo-400', fill: '#6366f1', glow: 'shadow-indigo-600/30' };
        if (z.workerDensity >= 4.0) return { bg: 'bg-cyan-950/60', border: 'border-cyan-500/60', text: 'text-cyan-400', fill: '#06b6d4', glow: 'shadow-transparent' };
        return { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-400', fill: '#475569', glow: 'shadow-transparent' };
      }
    }
  };

  const getMetricDisplayValue = (z: ZoneSpatialMetrics) => {
    switch (metricMode) {
      case 'COMPOSITE_RISK':
        return `${z.riskScore}% Risk`;
      case 'IOT_PREDICTIVE_FAILURES':
        return z.criticalEndpointCount > 0
          ? `${z.criticalEndpointCount} Critical Sensor${z.criticalEndpointCount > 1 ? 's' : ''}`
          : z.maxEndpointFailureProb > 0
          ? `${z.maxEndpointFailureProb}% Fail Risk`
          : 'Nominal Hardware';
      case 'THERMAL':
        return `${z.tempC}°C Ambient`;
      case 'ACOUSTIC':
        return `${z.noiseDb} dBA SPL`;
      case 'WORKER_DENSITY':
        return `${z.workerDensity} / 100m²`;
    }
  };

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Header with Title, Mode Toggles, and Hotspot Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-400">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Spatial Zone Risk Heatmap &bull; Facility Hazard Hot Spots
                </h3>
                {activeHotspotsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    {activeHotspotsCount} Hot Spots Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-zone spatial distribution of real-time aggregate risk levels, thermal microclimates, and localized hazard density
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Metric Layer Selector & Hotspot Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMetricMode('COMPOSITE_RISK')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer ${
                metricMode === 'COMPOSITE_RISK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Composite Risk
            </button>
            <button
              onClick={() => setMetricMode('THERMAL')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer ${
                metricMode === 'THERMAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thermal (°C)
            </button>
            <button
              onClick={() => setMetricMode('ACOUSTIC')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer ${
                metricMode === 'ACOUSTIC'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acoustic (dB)
            </button>
            <button
              onClick={() => setMetricMode('WORKER_DENSITY')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer ${
                metricMode === 'WORKER_DENSITY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Density
            </button>
            <button
              onClick={() => setMetricMode('IOT_PREDICTIVE_FAILURES')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                metricMode === 'IOT_PREDICTIVE_FAILURES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Correlate IoT endpoint failure predictions with facility floor plan locations"
            >
              <Cpu className="w-3 h-3 text-cyan-300" />
              <span>IoT Failures</span>
            </button>
          </div>

          {/* Filter Hotspots Only Toggle */}
          <button
            onClick={() => setFilterHotspotsOnly((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              filterHotspotsOnly
                ? 'bg-rose-950/80 border-rose-500/70 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Filter view to only show zones currently categorized as high-risk hot spots (Risk >= 65%)"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{filterHotspotsOnly ? 'Hot Spots Only' : 'All Zones'}</span>
          </button>
        </div>
      </div>

      {/* Hot Spot Banner Alert if any zone exceeds critical threshold */}
      {activeHotspotsCount > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 animate-bounce" />
            <span className="text-slate-200">
              <strong className="text-rose-300 font-bold">Spatial Hot Spot Notice: </strong>
              Elevated hazard concentration flagged in{' '}
              {spatialZoneData
                .filter((z) => z.isHotSpot)
                .map((z) => `${z.zone.name} (${z.riskScore}%)`)
                .join(', ')}
              . High priority inspection advised.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40 font-bold shrink-0">
            RAPID MITIGATION STAGED
          </span>
        </div>
      )}

      {/* Main Grid: Spatial Heatmap Canvas + Interactive Zone Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Side (7 cols): Interactive SVG Spatial Heatmap Floor Matrix */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              Facility Spatial Coordinate Layout (Scale: 1:250)
            </span>
            <span>Click any sector to inspect &amp; focus</span>
          </div>

          {/* SVG Facility Floor Heatmap */}
          <div className="relative w-full aspect-[600/380] rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80">
            <svg
              viewBox="0 0 600 380"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))' }}
            >
              <defs>
                {/* Radial gradients for hotspots */}
                <radialGradient id="hotspot-glow-sector4" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#e11d48" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hotspot-glow-tunnel" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                {/* Grid pattern */}
                <pattern id="facility-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" opacity="0.4" />
                </pattern>
              </defs>

              {/* Background architectural grid */}
              <rect width="600" height="380" fill="#090d16" />
              <rect width="600" height="380" fill="url(#facility-grid)" />

              {/* Render Zone Heat Quadrants */}
              {spatialZoneData.map((z) => {
                const { x, y, width, height, sector } = z.gridCoordinates;
                const isSelected = selectedZoneId === z.zone.id || inspectedZoneId === z.zone.id;
                const colors = getCellMetricColor(z);

                return (
                  <g
                    key={z.zone.id}
                    className="cursor-pointer transition-all duration-200 group"
                    onClick={() => {
                      setInspectedZoneId(z.zone.id);
                      onSelectZone(z.zone.id);
                    }}
                  >
                    {/* Hotspot radial ambient halo if risk is high */}
                    {z.isHotSpot && (
                      <circle
                        cx={x + width / 2}
                        cy={y + height / 2}
                        r={Math.max(width, height) * 0.7}
                        fill={z.riskScore >= 80 ? 'url(#hotspot-glow-sector4)' : 'url(#hotspot-glow-tunnel)'}
                        className="animate-pulse"
                      />
                    )}

                    {/* Zone bounding box */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx="8"
                      fill={colors.fill}
                      fillOpacity={isSelected ? 0.35 : z.isHotSpot ? 0.25 : 0.12}
                      stroke={isSelected ? '#38bdf8' : z.isHotSpot ? colors.fill : '#334155'}
                      strokeWidth={isSelected ? 3 : z.isHotSpot ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : z.isHotSpot ? 'none' : '4 2'}
                      className="transition-colors group-hover:fill-opacity-40"
                    />

                    {/* Sector Code Watermark */}
                    <text
                      x={x + 12}
                      y={y + 22}
                      fill={isSelected ? '#38bdf8' : '#94a3b8'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {sector}
                    </text>

                    {/* Hot spot beacon badge */}
                    {z.isHotSpot && (
                      <g transform={`translate(${x + width - 75}, ${y + 10})`}>
                        <rect width="65" height="18" rx="4" fill="#991b1b" fillOpacity="0.9" />
                        <text
                          x="32"
                          y="13"
                          textAnchor="middle"
                          fill="#fecdd3"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          HOT SPOT
                        </text>
                      </g>
                    )}

                    {/* Zone Name Label */}
                    <text
                      x={x + 12}
                      y={y + 44}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {z.zone.name.length > 24 ? z.zone.name.slice(0, 22) + '...' : z.zone.name}
                    </text>

                    {/* Metric Display Text */}
                    <text
                      x={x + 12}
                      y={y + 68}
                      fill={colors.fill}
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {getMetricDisplayValue(z)}
                    </text>

                    {/* Secondary Metrics Summary in Cell */}
                    <text
                      x={x + 12}
                      y={y + 90}
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {z.workerCount} Workers &bull; {z.tempC}°C &bull; {z.activeAlertCount} Alert{z.activeAlertCount !== 1 ? 's' : ''}
                    </text>

                    {/* Mini Visual Heat Level Progress Bar */}
                    <rect
                      x={x + 12}
                      y={y + 102}
                      width={width - 24}
                      height="5"
                      rx="2.5"
                      fill="#1e293b"
                    />
                    <rect
                      x={x + 12}
                      y={y + 102}
                      width={((width - 24) * z.riskScore) / 100}
                      height="5"
                      rx="2.5"
                      fill={colors.fill}
                    />

                    {/* Interactive Spatial IoT Sensor Pins & Failure Status */}
                    {z.iotSensorsCoordinates.map(({ endpoint, pinX, pinY }) => {
                      const isEpCritical =
                        endpoint.forecastHorizon === 'CRITICAL_FAIL_24H' || endpoint.healthScore <= 30;
                      const isEpWarning =
                        endpoint.forecastHorizon === 'HIGH_FAIL_72H' || endpoint.forecastHorizon === 'ELEVATED_FAIL_7D';
                      const pinColor = isEpCritical ? '#f43f5e' : isEpWarning ? '#f59e0b' : '#06b6d4';
                      const isPinSelected = selectedSensorPin?.endpointId === endpoint.endpointId;

                      return (
                        <g
                          key={endpoint.endpointId}
                          className="cursor-pointer group/pin"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSensorPin(endpoint);
                            setInspectedZoneId(z.zone.id);
                          }}
                        >
                          {/* Pulsing ring for critical endpoint failure */}
                          {isEpCritical && (
                            <circle
                              cx={pinX}
                              cy={pinY}
                              r="11"
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="1.5"
                              opacity="0.8"
                              className="animate-ping"
                            />
                          )}

                          {/* Sensor Pin Node Background */}
                          <rect
                            x={pinX - 18}
                            y={pinY - 9}
                            width="58"
                            height="18"
                            rx="4"
                            fill="#020617"
                            stroke={isPinSelected ? '#38bdf8' : pinColor}
                            strokeWidth={isPinSelected ? 2 : 1.2}
                            fillOpacity="0.95"
                          />

                          {/* Status Dot */}
                          <circle cx={pinX - 10} cy={pinY} r="3.5" fill={pinColor} />

                          {/* Endpoint Short Label */}
                          <text
                            x={pinX - 4}
                            y={pinY + 3.5}
                            fill={isPinSelected ? '#38bdf8' : '#f8fafc'}
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {endpoint.endpointId
                              .replace('SENS-', '')
                              .replace('GATEWAY-', 'GW-')
                              .replace('TEMP-PROBE-', 'TMP-')
                              .slice(0, 7)}
                          </text>

                          {/* Failure Probability Tag */}
                          <g transform={`translate(${pinX + 17}, ${pinY - 8})`}>
                            <rect width="19" height="9" rx="2" fill={pinColor} fillOpacity="0.9" />
                            <text
                              x="9.5"
                              y="7"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="6.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {endpoint.failureProbabilityPct}%
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Selection Indicator Beacon */}
                    {isSelected && (
                      <circle
                        cx={x + width - 15}
                        cy={y + height - 15}
                        r="5"
                        fill="#38bdf8"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Heatmap Legend Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
            <span className="font-semibold text-slate-300">
              {metricMode === 'IOT_PREDICTIVE_FAILURES' ? 'IoT Hardware Failure Spectrum:' : 'Spatial Hazard Spectrum:'}
            </span>
            <div className="flex items-center gap-3">
              {metricMode === 'IOT_PREDICTIVE_FAILURES' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Nominal (&lt;30%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <span>Elevated (30-59%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>High Risk (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-400 font-bold">Imminent Fail (&ge;80%)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Stable (&lt;40%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>Moderate (40-64%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-400 font-bold">Hot Spot (&ge;65%)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (5 cols): Selected Hot Spot / Zone Inspection Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Detailed Inspector Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Zone Hot Spot Diagnostics
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    inspectedZone.isHotSpot
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {inspectedZone.isHotSpot ? 'CRITICAL HOT SPOT' : 'NORMAL RANGE'}
                </span>
              </div>

              {/* Zone Name & Sector */}
              <div className="mt-3">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{inspectedZone.zone.name}</span>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {inspectedZone.gridCoordinates.sector}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {inspectedZone.zone.description}
                </p>
              </div>

              {/* Key Diagnostic Metric Matrix */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>COMPOSITE RISK</span>
                    <ShieldAlert className="h-3 w-3 text-rose-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-rose-400">
                    {inspectedZone.riskScore}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {inspectedZone.isHotSpot ? 'Exceeds 65% cutoff' : 'Within normal limits'}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>WORKFORCE COUNT</span>
                    <Users className="h-3 w-3 text-indigo-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    {inspectedZone.workerCount} Workers
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Density: {inspectedZone.workerDensity}/100m²
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>MICROCLIMATE HEAT</span>
                    <Thermometer className="h-3 w-3 text-amber-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-amber-300">
                    {inspectedZone.tempC}°C
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    TWL: {inspectedZone.twlIndex} W/m²
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>ACOUSTIC SPL</span>
                    <Volume2 className="h-3 w-3 text-cyan-400" />
                  </div>
                  <div className="text-base font-bold font-mono text-cyan-400">
                    {inspectedZone.noiseDb} dBA
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    AQI: {inspectedZone.aqi}
                  </div>
                </div>
              </div>

              {/* Primary Hazard & Anomaly Attribution */}
              <div className="mt-3.5 p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">
                  Primary Hazard Factor
                </span>
                <div className="text-slate-200 font-medium flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{inspectedZone.primaryHazard}</span>
                </div>
                {inspectedZone.activeAlertCount > 0 && (
                  <div className="mt-2 text-[11px] text-rose-300 font-mono">
                    &bull; {inspectedZone.activeAlertCount} Active Anomaly Signals ({inspectedZone.criticalAlertCount} Critical)
                  </div>
                )}
              </div>

              {/* IoT Endpoint Failure Predictions & Degradation Status in this Zone */}
              <div className="mt-3.5 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    IoT Endpoints in Sector ({inspectedZone.iotEndpoints.length})
                  </span>
                  {inspectedZone.criticalEndpointCount > 0 ? (
                    <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40 animate-pulse">
                      {inspectedZone.criticalEndpointCount} Imminent Failures
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                      Telemetry Nominal
                    </span>
                  )}
                </div>

                {inspectedZone.iotEndpoints.length === 0 ? (
                  <div className="text-slate-500 text-[11px] italic py-2">
                    No active telemetry endpoints deployed in this specific sector.
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {inspectedZone.iotEndpoints.map((ep) => {
                      const isCritical = ep.forecastHorizon === 'CRITICAL_FAIL_24H' || ep.healthScore <= 30;
                      const isWarning =
                        ep.forecastHorizon === 'HIGH_FAIL_72H' || ep.forecastHorizon === 'ELEVATED_FAIL_7D';
                      const isPinSelected = selectedSensorPin?.endpointId === ep.endpointId;

                      return (
                        <div
                          key={ep.endpointId}
                          onClick={() => setSelectedSensorPin(ep)}
                          className={`p-2.5 rounded-lg border transition cursor-pointer ${
                            isPinSelected
                              ? 'bg-slate-800 border-cyan-500/80 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                              : isCritical
                              ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50'
                              : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white text-[11px]">{ep.endpointName}</span>
                                {ep.isStagedForMaintenance && (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono">
                                    Staged
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 block">{ep.endpointId}</span>
                            </div>

                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                isCritical
                                  ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                                  : isWarning
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              }`}
                            >
                              {ep.failureProbabilityPct}% Fail Prob
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono">
                            <div>
                              <span className="text-slate-500 block text-[9px]">HEALTH</span>
                              <span
                                className={`font-bold ${
                                  ep.healthScore <= 30
                                    ? 'text-rose-400'
                                    : ep.healthScore <= 50
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {ep.healthScore}/100
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px]">MTTF</span>
                              <span className="font-bold text-cyan-400">{ep.mttfHours}h</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px]">RUL</span>
                              <span className="font-bold text-slate-200">{ep.remainingUsefulLifeDays}d</span>
                            </div>
                          </div>

                          <div className="mt-2 text-[10px] text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800/80">
                            <span className="text-amber-400 font-semibold">Root Vulnerability: </span>
                            {ep.rootCauseVulnerability}
                          </div>

                          {onNavigateToMaintenance && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToMaintenance(ep.endpointId);
                              }}
                              className="mt-2 w-full flex items-center justify-center space-x-1 py-1 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-semibold transition cursor-pointer"
                            >
                              <Cpu className="w-3 h-3 text-cyan-400" />
                              <span>Open 30-Day Predictive Degradation Curve</span>
                              <ChevronRight className="w-3 h-3 text-cyan-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions for Selected Zone */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onSelectZone(inspectedZone.zone.id);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-700 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>Focus Live Telemetry</span>
              </button>

              {onDispatchMitigation && inspectedZone.isHotSpot && (
                <button
                  onClick={() =>
                    onDispatchMitigation(
                      inspectedZone.zone,
                      `Stage rapid cooling station and misting fan to ${inspectedZone.zone.name}`
                    )
                  }
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Dispatch Mitigation</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Hot Spots Summary List */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-2">
              Zone Risk Overview &bull; Quick Select
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {displayedZones.map((z) => (
                <button
                  key={z.zone.id}
                  onClick={() => {
                    setInspectedZoneId(z.zone.id);
                    onSelectZone(z.zone.id);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition cursor-pointer ${
                    (inspectedZoneId || selectedZoneId) === z.zone.id
                      ? 'bg-slate-800 border-cyan-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        z.isHotSpot ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="truncate font-medium">{z.zone.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                    <span className={z.isHotSpot ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {z.riskScore}%
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

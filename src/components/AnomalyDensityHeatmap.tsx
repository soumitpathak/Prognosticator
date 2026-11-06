import React, { useState, useMemo } from 'react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  TelemetryDataPoint
} from '../types';
import {
  Flame,
  Activity,
  Cpu,
  Wind,
  MapPin,
  AlertTriangle,
  Zap,
  Layers,
  Radio,
  Sliders,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  Crosshair,
  ShieldAlert,
  Users
} from 'lucide-react';

interface AnomalyDensityHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  onDispatchMitigation?: (zoneName: string, action: string) => void;
  className?: string;
}

export type DensityMetricFilter = 'ALL' | 'THERMAL' | 'BIOMECHANICAL' | 'EQUIPMENT' | 'ENVIRONMENTAL';
export type HeatmapVisualMode = 'GRADIENT' | 'PINPOINTS' | 'CONTOURS';

interface SchematicSensorNode {
  id: string;
  name: string;
  type: 'THERMAL' | 'BIOMECHANICAL' | 'EQUIPMENT' | 'ENVIRONMENTAL';
  x: number;
  y: number;
  baseAnomalies: number;
}

interface SchematicZoneLayout {
  zoneId: string;
  zoneName: string;
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
  sensors: SchematicSensorNode[];
}

const SCHEMATIC_LAYOUTS: Record<string, SchematicZoneLayout> = {
  'Outdoor-Construction-Sector-4': {
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4',
    code: 'SEC-04-EXT',
    x: 30,
    y: 35,
    w: 420,
    h: 215,
    labelX: 50,
    labelY: 65,
    sensors: [
      { id: 'WBGT-401', name: 'Ambient Wet-Bulb Sensor 401', type: 'THERMAL', x: 110, y: 120, baseAnomalies: 9 },
      { id: 'VIB-402', name: 'Piezo Vibration Sensor 402', type: 'EQUIPMENT', x: 250, y: 100, baseAnomalies: 8 },
      { id: 'BLE-403', name: 'Worker Wearable Hub 403', type: 'BIOMECHANICAL', x: 360, y: 160, baseAnomalies: 5 },
      { id: 'DUST-404', name: 'Laser PM2.5 / Dust Monitor 404', type: 'ENVIRONMENTAL', x: 180, y: 190, baseAnomalies: 3 }
    ]
  },
  'Manufacturing-Assembly-Line-B': {
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    code: 'ASY-LN-02',
    x: 480,
    y: 35,
    w: 450,
    h: 215,
    labelX: 500,
    labelY: 65,
    sensors: [
      { id: 'ROBOT-201', name: 'Welding Robot Arm Accel 201', type: 'EQUIPMENT', x: 570, y: 110, baseAnomalies: 4 },
      { id: 'NOISE-202', name: 'Acoustic Sound Level Mic 202', type: 'ENVIRONMENTAL', x: 720, y: 100, baseAnomalies: 3 },
      { id: 'ERG-203', name: 'Conveyor Ergonomic Bio-Hub 203', type: 'BIOMECHANICAL', x: 840, y: 160, baseAnomalies: 6 },
      { id: 'TEMP-204', name: 'Assembly Ambient RTD 204', type: 'THERMAL', x: 670, y: 190, baseAnomalies: 2 }
    ]
  },
  'Foundry-Furnace-Bay-B': {
    zoneId: 'Foundry-Furnace-Bay-B',
    zoneName: 'Foundry & Furnace Bay B',
    code: 'FND-BAY-01',
    x: 30,
    y: 275,
    w: 280,
    h: 225,
    labelX: 50,
    labelY: 305,
    sensors: [
      { id: 'IR-TEMP-101', name: 'Crucible Infrared Pyrometer 101', type: 'THERMAL', x: 100, y: 360, baseAnomalies: 12 },
      { id: 'GAS-CO-102', name: 'Carbon Monoxide Toxic PID 102', type: 'ENVIRONMENTAL', x: 220, y: 350, baseAnomalies: 5 },
      { id: 'HEAT-HRV-103', name: 'Pouring Crew Biometric Gateway 103', type: 'BIOMECHANICAL', x: 160, y: 440, baseAnomalies: 8 }
    ]
  },
  'Warehouse-Logistics-Hub-North': {
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Warehouse Logistics Hub North',
    code: 'LOG-HUB-03',
    x: 335,
    y: 275,
    w: 320,
    h: 225,
    labelX: 355,
    labelY: 305,
    sensors: [
      { id: 'AGV-VIB-301', name: 'AGV Fleet Docking Accel 301', type: 'EQUIPMENT', x: 410, y: 350, baseAnomalies: 3 },
      { id: 'PALLET-302', name: 'Palletizing Cell Strain Bio-Node 302', type: 'BIOMECHANICAL', x: 550, y: 360, baseAnomalies: 7 },
      { id: 'HVAC-303', name: 'Chilled Storage Loop Temp 303', type: 'THERMAL', x: 480, y: 440, baseAnomalies: 2 }
    ]
  },
  'Chemical-Processing-Sublevel': {
    zoneId: 'Chemical-Processing-Sublevel',
    zoneName: 'Chemical Processing Sublevel',
    code: 'CHM-SUB-05',
    x: 680,
    y: 275,
    w: 250,
    h: 225,
    labelX: 700,
    labelY: 305,
    sensors: [
      { id: 'PUMP-VIB-501', name: 'Slurry Pump P-402 ISO Accel 501', type: 'EQUIPMENT', x: 750, y: 350, baseAnomalies: 11 },
      { id: 'VOC-PID-502', name: 'Solvent Vapor Gas PID 502', type: 'ENVIRONMENTAL', x: 860, y: 360, baseAnomalies: 6 },
      { id: 'AIR-FLOW-503', name: 'Ventilation Scrubber Flow 503', type: 'ENVIRONMENTAL', x: 800, y: 440, baseAnomalies: 4 }
    ]
  }
};

export default function AnomalyDensityHeatmap({
  zones,
  alerts,
  selectedZoneId: propSelectedZoneId,
  onSelectZone,
  onDispatchMitigation,
  className = ''
}: AnomalyDensityHeatmapProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    propSelectedZoneId || 'Foundry-Furnace-Bay-B'
  );
  const [metricFilter, setMetricFilter] = useState<DensityMetricFilter>('ALL');
  const [visualMode, setVisualMode] = useState<HeatmapVisualMode>('GRADIENT');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [simulatedSurgeZoneId, setSimulatedSurgeZoneId] = useState<string | null>(null);
  const [surgeBonus, setSurgeBonus] = useState<Record<string, number>>({});
  const [surgeNotice, setSurgeNotice] = useState<string | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (propSelectedZoneId) {
      setSelectedZoneId(propSelectedZoneId);
    }
  }, [propSelectedZoneId]);

  // Handle zone selection
  const handleZoneClick = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    if (onSelectZone) onSelectZone(zoneId);
  };

  // Simulate Anomaly Surge on demand
  const handleSimulateSurge = () => {
    const targetZoneId = selectedZoneId || 'Foundry-Furnace-Bay-B';
    setSimulatedSurgeZoneId(targetZoneId);
    setSurgeBonus((prev) => ({
      ...prev,
      [targetZoneId]: (prev[targetZoneId] || 0) + 7
    }));

    const zoneObj = SCHEMATIC_LAYOUTS[targetZoneId];
    const msg = `Simulated anomaly traffic surge (+7 triggers) injected into ${zoneObj?.zoneName || targetZoneId}. Density heatmap recalculated with active radar pinpoint.`;
    setSurgeNotice(msg);

    setTimeout(() => {
      setSimulatedSurgeZoneId(null);
      setTimeout(() => setSurgeNotice(null), 6000);
    }, 1500);
  };

  // Compute live anomaly counts per zone and per sensor
  const zoneDensityData = useMemo(() => {
    const result: Record<
      string,
      {
        totalCount: number;
        thermalCount: number;
        biomechanicalCount: number;
        equipmentCount: number;
        environmentalCount: number;
        densityIndex: number; // 0 - 100
        densityLevel: 'CRITICAL_HOTSPOT' | 'HIGH_TRAFFIC' | 'MODERATE' | 'LOW' | 'NOMINAL';
        sensors: (SchematicSensorNode & { currentAnomalies: number })[];
      }
    > = {};

    Object.values(SCHEMATIC_LAYOUTS).forEach((layout) => {
      // Find matching live alerts for this zone
      const liveAlertsForZone = alerts.filter(
        (a) =>
          a.location_zone.toLowerCase().includes(layout.zoneId.toLowerCase()) ||
          layout.zoneId.toLowerCase().includes(a.location_zone.toLowerCase())
      );

      let thermal = 0;
      let biomechanical = 0;
      let equipment = 0;
      let environmental = 0;

      liveAlertsForZone.forEach((a) => {
        const m = (a.anomaly_metric || '').toLowerCase();
        if (a.equipment_id || a.alert_type === 'PREDICTIVE_MAINTENANCE' || m.includes('vibration') || m.includes('bearing')) {
          equipment++;
        } else if (m.includes('thermal') || m.includes('temp') || m.includes('heat') || m.includes('twl')) {
          thermal++;
        } else if (m.includes('noise') || m.includes('acoustic') || m.includes('aqi') || m.includes('air')) {
          environmental++;
        } else {
          biomechanical++;
        }
      });

      // Add surge bonus if applied
      const bonus = surgeBonus[layout.zoneId] || 0;

      // Distribute to schematic sensors
      const sensorsWithLive = layout.sensors.map((sensor) => {
        let count = sensor.baseAnomalies;
        if (sensor.type === 'THERMAL') count += thermal;
        if (sensor.type === 'BIOMECHANICAL') count += biomechanical;
        if (sensor.type === 'EQUIPMENT') count += equipment;
        if (sensor.type === 'ENVIRONMENTAL') count += environmental;
        if (bonus > 0) count += Math.round(bonus / layout.sensors.length);

        return {
          ...sensor,
          currentAnomalies: count
        };
      });

      // Filter by metric filter
      let filteredCount = 0;
      sensorsWithLive.forEach((s) => {
        if (metricFilter === 'ALL' || s.type === metricFilter) {
          filteredCount += s.currentAnomalies;
        }
      });

      const densityIndex = Math.min(Math.round((filteredCount / 32) * 100), 100);

      let densityLevel: 'CRITICAL_HOTSPOT' | 'HIGH_TRAFFIC' | 'MODERATE' | 'LOW' | 'NOMINAL' = 'NOMINAL';
      if (filteredCount >= 16) densityLevel = 'CRITICAL_HOTSPOT';
      else if (filteredCount >= 10) densityLevel = 'HIGH_TRAFFIC';
      else if (filteredCount >= 6) densityLevel = 'MODERATE';
      else if (filteredCount >= 2) densityLevel = 'LOW';

      result[layout.zoneId] = {
        totalCount: filteredCount,
        thermalCount: thermal,
        biomechanicalCount: biomechanical,
        equipmentCount: equipment,
        environmentalCount: environmental,
        densityIndex,
        densityLevel,
        sensors: sensorsWithLive
      };
    });

    return result;
  }, [alerts, metricFilter, surgeBonus]);

  // Identify highest traffic hotspot
  const topHotspot = useMemo(() => {
    let topZoneId = 'Foundry-Furnace-Bay-B';
    let maxCount = -1;

    Object.entries(zoneDensityData).forEach(([zoneId, data]) => {
      if (data.totalCount > maxCount) {
        maxCount = data.totalCount;
        topZoneId = zoneId;
      }
    });

    const layout = SCHEMATIC_LAYOUTS[topZoneId];
    return {
      zoneId: topZoneId,
      zoneName: layout?.zoneName || topZoneId,
      count: maxCount,
      densityLevel: zoneDensityData[topZoneId]?.densityLevel || 'HIGH_TRAFFIC',
      sensors: zoneDensityData[topZoneId]?.sensors || []
    };
  }, [zoneDensityData]);

  const activeZoneData = zoneDensityData[selectedZoneId] || zoneDensityData['Foundry-Furnace-Bay-B'];
  const activeZoneLayout = SCHEMATIC_LAYOUTS[selectedZoneId] || SCHEMATIC_LAYOUTS['Foundry-Furnace-Bay-B'];

  // Color mapper for density level
  const getDensityColor = (count: number) => {
    if (count >= 16) return { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#ef4444', text: '#fca5a5' }; // Critical red
    if (count >= 10) return { fill: 'rgba(249, 115, 22, 0.28)', stroke: '#f97316', text: '#fdba74' }; // High orange
    if (count >= 6) return { fill: 'rgba(234, 179, 8, 0.20)', stroke: '#eab308', text: '#fde047' }; // Moderate yellow
    if (count >= 2) return { fill: 'rgba(6, 182, 212, 0.15)', stroke: '#06b6d4', text: '#67e8f9' }; // Low cyan
    return { fill: 'rgba(30, 41, 59, 0.20)', stroke: '#334155', text: '#94a3b8' }; // Nominal dark slate
  };

  return (
    <div
      id="anomaly-density-floor-plan-heatmap"
      className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
                <span>Anomaly Density Heatmap</span>
              </h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold">
                Schematic Floor Plan Overlay
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                Multi-Sensor Traffic Pinpointing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Overlays real-time multi-sensor anomaly counts onto a 2D schematic architectural floor plan to pinpoint high-traffic error zones and recurring failure nodes.
            </p>
          </div>
        </div>

        {/* Action Controls & Metric Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate Surge Button */}
          <button
            onClick={handleSimulateSurge}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
            title="Inject simulated sensor anomaly traffic into current zone to test heatmap rendering"
          >
            <Zap className="h-3.5 w-3.5 text-white" />
            <span>Simulate Error Surge</span>
          </button>

          {/* Visual Mode Toggles */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setVisualMode('GRADIENT')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                visualMode === 'GRADIENT'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setVisualMode('PINPOINTS')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                visualMode === 'PINPOINTS'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sensor Pins
            </button>
          </div>
        </div>
      </div>

      {/* Surge Notice Banner */}
      {surgeNotice && (
        <div className="p-3 bg-rose-950/80 border-b border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Flame className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
            <span className="font-mono">{surgeNotice}</span>
          </div>
          <button
            onClick={() => setSurgeNotice(null)}
            className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Chips Bar & High-Traffic Hotspot Banner */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono">
        {/* Metric Layer Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Layer:</span>
          {(['ALL', 'THERMAL', 'BIOMECHANICAL', 'EQUIPMENT', 'ENVIRONMENTAL'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setMetricFilter(filter)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                metricFilter === filter
                  ? 'bg-slate-800 text-white font-bold border border-slate-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {filter === 'ALL' ? 'All Errors' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Pinpoint Hotspot Callout */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs">
          <Crosshair className="h-4 w-4 text-rose-400 shrink-0 animate-spin" />
          <span className="text-slate-400">Peak Error Hotspot:</span>
          <strong className="text-rose-300">{topHotspot.zoneName}</strong>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">
            {topHotspot.count} anomalies
          </span>
        </div>
      </div>

      {/* Main Floor Plan & Forensic Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Schematic SVG Floor Plan (8 Cols) */}
        <div className="lg:col-span-8 p-4 bg-slate-950/90 relative overflow-hidden select-none">
          {/* Floor Plan Header Overlay */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>FACILITY LEVEL 1 — SCHEMATIC SENSOR ERROR TOPOLOGY</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Click any zone to inspect localized error distribution
            </div>
          </div>

          {/* SVG Schematic Canvas */}
          <div className="w-full aspect-[960/530] bg-slate-950 rounded-xl border border-slate-800/80 p-2 relative shadow-inner overflow-hidden">
            <svg
              viewBox="0 0 960 530"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
            >
              {/* Architectural Grid lines */}
              <defs>
                <pattern id="arch-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>

                {/* Heat Radial Gradients for Hotspots */}
                <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.65" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#eab308" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-moderate" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Grid */}
              <rect width="960" height="530" fill="url(#arch-grid)" />

              {/* Facility Outer Perimeter Walls */}
              <rect
                x="15"
                y="15"
                width="930"
                height="500"
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
                rx="8"
              />

              {/* Render Each Schematic Zone Box */}
              {Object.values(SCHEMATIC_LAYOUTS).map((layout) => {
                const zoneData = zoneDensityData[layout.zoneId] || { totalCount: 0, densityIndex: 0 };
                const isSelected = selectedZoneId === layout.zoneId;
                const isSurging = simulatedSurgeZoneId === layout.zoneId;
                const colors = getDensityColor(zoneData.totalCount);

                return (
                  <g
                    key={layout.zoneId}
                    onClick={() => handleZoneClick(layout.zoneId)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    {/* Zone Boundary Polygon */}
                    <rect
                      x={layout.x}
                      y={layout.y}
                      width={layout.w}
                      height={layout.h}
                      rx="8"
                      fill={visualMode === 'GRADIENT' ? colors.fill : 'rgba(15, 23, 42, 0.6)'}
                      stroke={isSelected ? '#38bdf8' : isSurging ? '#f43f5e' : colors.stroke}
                      strokeWidth={isSelected ? 3 : isSurging ? 3 : 1.5}
                      strokeDasharray={isSelected ? 'none' : 'none'}
                      className="transition-all duration-200 hover:fill-opacity-80"
                    />

                    {/* Radial Heat Glow Overlay for High-Traffic Zones */}
                    {visualMode === 'GRADIENT' && zoneData.totalCount >= 10 && (
                      <ellipse
                        cx={layout.x + layout.w / 2}
                        cy={layout.y + layout.h / 2}
                        rx={layout.w * 0.42}
                        ry={layout.h * 0.42}
                        fill={zoneData.totalCount >= 16 ? 'url(#heat-critical)' : 'url(#heat-high)'}
                        pointerEvents="none"
                      />
                    )}

                    {/* Zone Code & Name Header */}
                    <text
                      x={layout.labelX}
                      y={layout.labelY}
                      fill="#e2e8f0"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.5"
                    >
                      {layout.zoneName}
                    </text>
                    <text
                      x={layout.labelX}
                      y={layout.labelY + 16}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      [{layout.code}]
                    </text>

                    {/* Zone Anomaly Count Pill (Top Right) */}
                    <g transform={`translate(${layout.x + layout.w - 85}, ${layout.y + 14})`}>
                      <rect
                        width="72"
                        height="22"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke={colors.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x="36"
                        y="15"
                        fill={colors.text}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {zoneData.totalCount} Errors
                      </text>
                    </g>

                    {/* Surging Radar Pulse Ring if Anomaly Surge Active */}
                    {(isSurging || (topHotspot.zoneId === layout.zoneId && zoneData.totalCount >= 16)) && (
                      <circle
                        cx={layout.x + layout.w / 2}
                        cy={layout.y + layout.h / 2}
                        r="35"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="animate-ping opacity-75"
                        pointerEvents="none"
                      />
                    )}

                    {/* Sensor Node Pins within Zone */}
                    {zoneData.sensors.map((sensor) => {
                      const isHovered = hoveredNodeId === sensor.id;
                      const sensorColor =
                        sensor.currentAnomalies >= 10
                          ? '#ef4444'
                          : sensor.currentAnomalies >= 6
                          ? '#f97316'
                          : sensor.currentAnomalies >= 3
                          ? '#eab308'
                          : '#06b6d4';

                      return (
                        <g
                          key={sensor.id}
                          transform={`translate(${sensor.x}, ${sensor.y})`}
                          onMouseEnter={() => setHoveredNodeId(sensor.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          className="cursor-pointer"
                        >
                          {/* Pulsing ring for high-traffic sensors */}
                          {sensor.currentAnomalies >= 8 && (
                            <circle
                              r="16"
                              fill="none"
                              stroke={sensorColor}
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              className="animate-spin"
                            />
                          )}

                          {/* Sensor Pin Circle */}
                          <circle
                            r="10"
                            fill="rgba(15, 23, 42, 0.95)"
                            stroke={sensorColor}
                            strokeWidth="2"
                          />

                          {/* Center Dot */}
                          <circle r="3.5" fill={sensorColor} />

                          {/* Anomaly Badge */}
                          <rect
                            x="11"
                            y="-9"
                            width="28"
                            height="16"
                            rx="3"
                            fill="rgba(15, 23, 42, 0.9)"
                            stroke={sensorColor}
                            strokeWidth="1"
                          />
                          <text
                            x="25"
                            y="3"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            +{sensor.currentAnomalies}
                          </text>

                          {/* Sensor Hover Tooltip */}
                          {isHovered && (
                            <g transform="translate(-60, -38)">
                              <rect
                                width="140"
                                height="28"
                                rx="4"
                                fill="#020617"
                                stroke="#38bdf8"
                                strokeWidth="1"
                              />
                              <text
                                x="70"
                                y="14"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                                textAnchor="middle"
                              >
                                {sensor.id}
                              </text>
                              <text
                                x="70"
                                y="23"
                                fill="#94a3b8"
                                fontSize="7.5"
                                fontFamily="monospace"
                                textAnchor="middle"
                              >
                                {sensor.type} &bull; {sensor.currentAnomalies} errors
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Heatmap Legend Bar */}
          <div className="mt-3.5 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px] uppercase font-bold">
              Anomaly Error Density Spectrum:
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-800 border border-slate-700"></span>
                <span className="text-slate-400">0 Nominal</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-sm bg-cyan-950 border border-cyan-500"></span>
                <span className="text-cyan-400">1-5 Low</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-950 border border-amber-500"></span>
                <span className="text-amber-400">6-10 Moderate</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-sm bg-orange-950 border border-orange-500"></span>
                <span className="text-orange-400">11-15 High</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-sm bg-rose-950 border border-rose-500 animate-pulse"></span>
                <span className="text-rose-400 font-bold">16+ Hotspot</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forensic Detail & Zone Error Inspector (4 Cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-950/60 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-0.5">
              Forensic Error Inspector
            </span>
            <h4 className="text-base font-bold text-white tracking-wide">
              {activeZoneLayout.zoneName}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-400">
              <span>Code: {activeZoneLayout.code}</span>
              <span>·</span>
              <span className={`font-bold ${activeZoneData.totalCount >= 16 ? 'text-rose-400' : 'text-amber-400'}`}>
                {activeZoneData.densityLevel.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Total Anomalies</span>
              <span className="text-xl font-bold text-white tabular-nums">{activeZoneData.totalCount}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Density Rating</span>
              <span className="text-xl font-bold text-rose-400 tabular-nums">{activeZoneData.densityIndex}/100</span>
            </div>
          </div>

          {/* Anomaly Category Distribution for Selected Zone */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Error Distribution by Vector
            </span>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-orange-400">
                  <Flame className="h-3 w-3" />
                  <span>Thermal Strain:</span>
                </span>
                <strong className="text-white tabular-nums">{activeZoneData.thermalCount}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Activity className="h-3 w-3" />
                  <span>Biomechanical:</span>
                </span>
                <strong className="text-white tabular-nums">{activeZoneData.biomechanicalCount}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Cpu className="h-3 w-3" />
                  <span>Equipment Vibration:</span>
                </span>
                <strong className="text-white tabular-nums">{activeZoneData.equipmentCount}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Wind className="h-3 w-3" />
                  <span>Environmental / Gas:</span>
                </span>
                <strong className="text-white tabular-nums">{activeZoneData.environmentalCount}</strong>
              </div>
            </div>
          </div>

          {/* Active Sensor Node Pins in Zone */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-2">
              Zone Sensor Component Pinpoints ({activeZoneData.sensors.length} Nodes)
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeZoneData.sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-slate-200 font-bold block">{sensor.name}</span>
                    <span className="text-[10px] text-slate-500">Node ID: {sensor.id} &bull; {sensor.type}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sensor.currentAnomalies >= 8
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    +{sensor.currentAnomalies} err
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Mitigation Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (onDispatchMitigation) {
                  onDispatchMitigation(
                    activeZoneLayout.zoneName,
                    'Deploying on-site technician team for sensor recalibration and thermal barrier shielding.'
                  );
                }
              }}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-md cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Dispatch Hotspot Mitigation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

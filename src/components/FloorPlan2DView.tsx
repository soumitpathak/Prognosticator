import React, { useState } from 'react';
import { FacilityZone, ActiveAnomalyAlert, SensorStreamToggles, TelemetryDataPoint } from '../types';
import {
  MapPin,
  Layers,
  Thermometer,
  Volume2,
  Heart,
  Wind,
  ShieldAlert,
  Users,
  Radio,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Navigation,
  Activity,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders
} from 'lucide-react';

interface FloorPlan2DViewProps {
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  activeAlerts: ActiveAnomalyAlert[];
  streamToggles: SensorStreamToggles;
  onToggleStream: (key: keyof SensorStreamToggles) => void;
  onSetAllStreams: (enable: boolean) => void;
  recentTelemetryPoint?: TelemetryDataPoint;
}

type OverlayMode = 'all' | 'thermal' | 'acoustic' | 'nodes';

export default function FloorPlan2DView({
  zones,
  selectedZoneId,
  onSelectZone,
  activeAlerts,
  streamToggles,
  onToggleStream,
  onSetAllStreams,
  recentTelemetryPoint
}: FloorPlan2DViewProps) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('all');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Calculate zone-specific alert count
  const getZoneAlerts = (zoneId: string) => {
    return activeAlerts.filter(
      (a) =>
        a.location_zone.toLowerCase().includes(zoneId.toLowerCase()) ||
        zoneId.toLowerCase().includes(a.location_zone.toLowerCase())
    );
  };

  const selectedZoneAlerts = selectedZone ? getZoneAlerts(selectedZone.id) : [];

  // Zone coordinates mapping for the 2D layout (SVG canvas 940 x 520)
  const zoneLayouts: Record<
    string,
    {
      x: number;
      y: number;
      w: number;
      h: number;
      labelX: number;
      labelY: number;
      code: string;
      sensors: { x: number; y: number; type: 'temp' | 'noise' | 'hrv' | 'aqi'; label: string }[];
    }
  > = {
    'Outdoor-Construction-Sector-4': {
      x: 35,
      y: 40,
      w: 360,
      h: 215,
      labelX: 55,
      labelY: 70,
      code: 'SEC-04-EXT',
      sensors: [
        { x: 90, y: 130, type: 'temp', label: 'WBGT-4A' },
        { x: 210, y: 110, type: 'noise', label: 'MIC-4B' },
        { x: 310, y: 180, type: 'hrv', label: 'BLE-GW-4C' },
        { x: 160, y: 195, type: 'aqi', label: 'AQI-DUST' }
      ]
    },
    'Manufacturing-Assembly-Line-B': {
      x: 430,
      y: 40,
      w: 475,
      h: 215,
      labelX: 450,
      labelY: 70,
      code: 'ASY-LN-02',
      sensors: [
        { x: 500, y: 110, type: 'noise', label: 'MIC-ROBOT-1' },
        { x: 640, y: 140, type: 'temp', label: 'HVAC-TEMP' },
        { x: 790, y: 100, type: 'hrv', label: 'BLE-GW-ROBO' },
        { x: 840, y: 190, type: 'aqi', label: 'SCRUB-AQI' }
      ]
    },
    'Subgrade-Tunnel-Conduit-7': {
      x: 35,
      y: 285,
      w: 360,
      h: 195,
      labelX: 55,
      labelY: 315,
      code: 'SUB-CON-07',
      sensors: [
        { x: 100, y: 380, type: 'aqi', label: 'GAS-O2-CO' },
        { x: 220, y: 410, type: 'temp', label: 'TEMP-SUB' },
        { x: 320, y: 350, type: 'hrv', label: 'CONFINED-BLE' }
      ]
    },
    'Warehouse-Logistics-Hub-North': {
      x: 430,
      y: 285,
      w: 475,
      h: 195,
      labelX: 450,
      labelY: 315,
      code: 'WHS-LOG-N',
      sensors: [
        { x: 520, y: 370, type: 'noise', label: 'FORKLIFT-DB' },
        { x: 660, y: 410, type: 'temp', label: 'BAY-TEMP' },
        { x: 770, y: 350, type: 'hrv', label: 'BLE-PALLET' },
        { x: 840, y: 430, type: 'aqi', label: 'DIESEL-PART' }
      ]
    }
  };

  // Fallback for custom added zones
  const getCustomZoneLayout = (zoneId: string, index: number) => {
    if (zoneLayouts[zoneId]) return zoneLayouts[zoneId];
    // Dynamic quadrant allocation
    const col = index % 2;
    const row = Math.floor(index / 2) % 2;
    return {
      x: col === 0 ? 35 : 430,
      y: row === 0 ? 40 : 285,
      w: col === 0 ? 360 : 475,
      h: row === 0 ? 215 : 195,
      labelX: col === 0 ? 55 : 450,
      labelY: row === 0 ? 70 : 315,
      code: `CST-ZN-0${index + 1}`,
      sensors: [
        { x: (col === 0 ? 35 : 430) + 70, y: (row === 0 ? 40 : 285) + 80, type: 'temp' as const, label: 'TEMP' },
        { x: (col === 0 ? 35 : 430) + 200, y: (row === 0 ? 40 : 285) + 120, type: 'noise' as const, label: 'NOISE' },
        { x: (col === 0 ? 35 : 430) + 120, y: (row === 0 ? 40 : 285) + 150, type: 'hrv' as const, label: 'BIOMETRIC' }
      ]
    };
  };

  return (
    <div id="floor-plan-2d-view" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
      {/* Component Header & Control Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                2D Facility Floor Plan &amp; Spatial Sensor Telemetry
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-sm">
                  Interactive SCADA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any facility zone to filter localized health stats and toggle individual sensor telemetry streams.
              </p>
            </div>
          </div>
        </div>

        {/* Layer Overlay Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
              <Layers className="h-3 w-3 text-cyan-400" /> Layer:
            </span>
            <button
              onClick={() => setOverlayMode('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                overlayMode === 'all'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Systems
            </button>
            <button
              onClick={() => setOverlayMode('thermal')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                overlayMode === 'thermal'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Thermal Heatmap
            </button>
            <button
              onClick={() => setOverlayMode('acoustic')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                overlayMode === 'acoustic'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Acoustic dB
            </button>
            <button
              onClick={() => setOverlayMode('nodes')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                overlayMode === 'nodes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sensor Nodes
            </button>
          </div>
        </div>
      </div>

      {/* Main 2D Floor Plan SVG Canvas */}
      <div className="relative bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden">
        {/* Subtle Architectural Blueprint Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* SVG Blueprint Canvas */}
        <svg
          viewBox="0 0 940 520"
          className="w-full h-auto select-none"
          style={{ minHeight: '360px' }}
        >
          <defs>
            {/* Thermal Radiant Heat Gradients */}
            <radialGradient id="thermalRadialExtreme" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="thermalRadialModerate" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Acoustic Noise Waves */}
            <radialGradient id="acousticRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>

            {/* Selected Zone Glow Pattern */}
            <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.12" />
            </pattern>
          </defs>

          {/* Exterior Facility Perimeter Wall */}
          <rect
            x="20"
            y="20"
            width="900"
            height="480"
            rx="12"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Central Ventilation / Corridor Spine */}
          <rect x="395" y="25" width="35" height="470" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="412" y1="30" x2="412" y2="490" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
          <text x="412" y="260" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 412 260)">
            CENTRAL PRESSURIZED HVAC CORRIDOR &amp; EVACUATION SPINE
          </text>

          {/* Emergency Exits & Air Showers */}
          <g fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">
            <rect x="25" y="235" width="10" height="30" rx="2" fill="#10b981" />
            <text x="42" y="254" fill="#34d399">EXIT WEST</text>
            <rect x="905" y="235" width="10" height="30" rx="2" fill="#10b981" />
            <text x="860" y="254" fill="#34d399">EXIT EAST</text>
          </g>

          {/* Zones Rendering */}
          {zones.map((zone, idx) => {
            const layout = getCustomZoneLayout(zone.id, idx);
            const isSelected = selectedZoneId === zone.id;
            const isHovered = hoveredZoneId === zone.id;
            const zoneAlertList = getZoneAlerts(zone.id);
            const hasCritical = zone.status === 'CRITICAL' || zoneAlertList.some((a) => a.severity === 'CRITICAL');
            const hasModerate = zone.status === 'MODERATE' || zoneAlertList.some((a) => a.severity === 'MODERATE');

            let strokeColor = '#38bdf8';
            let fillColor = '#0f172a';
            let statusTextColor = '#38bdf8';

            if (hasCritical) {
              strokeColor = '#f43f5e';
              fillColor = '#1c0c14';
              statusTextColor = '#fb7185';
            } else if (hasModerate) {
              strokeColor = '#f59e0b';
              fillColor = '#191308';
              statusTextColor = '#fbbf24';
            } else {
              strokeColor = '#10b981';
              fillColor = '#061713';
              statusTextColor = '#34d399';
            }

            return (
              <g
                key={zone.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectZone(zone.id)}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                {/* Zone Boundary Rectangle */}
                <rect
                  x={layout.x}
                  y={layout.y}
                  width={layout.w}
                  height={layout.h}
                  rx="8"
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.85 : 0.65}
                  stroke={isSelected ? '#38bdf8' : strokeColor}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  strokeOpacity={isSelected ? 1 : 0.75}
                />

                {/* Selected Crosshatch Pattern Fill */}
                {isSelected && (
                  <rect
                    x={layout.x}
                    y={layout.y}
                    width={layout.w}
                    height={layout.h}
                    rx="8"
                    fill="url(#diagonalHatch)"
                    pointerEvents="none"
                  />
                )}

                {/* Thermal Stress Overlay Blob if enabled */}
                {(overlayMode === 'all' || overlayMode === 'thermal') && hasCritical && (
                  <circle
                    cx={layout.x + layout.w * 0.45}
                    cy={layout.y + layout.h * 0.5}
                    r={layout.h * 0.42}
                    fill="url(#thermalRadialExtreme)"
                    pointerEvents="none"
                  />
                )}

                {(overlayMode === 'all' || overlayMode === 'thermal') && hasModerate && (
                  <circle
                    cx={layout.x + layout.w * 0.55}
                    cy={layout.y + layout.h * 0.5}
                    r={layout.h * 0.38}
                    fill="url(#thermalRadialModerate)"
                    pointerEvents="none"
                  />
                )}

                {/* Acoustic Noise Overlay Wave if enabled */}
                {(overlayMode === 'all' || overlayMode === 'acoustic') && (
                  <ellipse
                    cx={layout.x + layout.w * 0.7}
                    cy={layout.y + layout.h * 0.4}
                    rx={layout.w * 0.28}
                    ry={layout.h * 0.3}
                    fill="url(#acousticRadial)"
                    pointerEvents="none"
                  />
                )}

                {/* Zone Structural Details & Sub-Racks */}
                {zone.id.includes('Warehouse') && (
                  <g stroke="#334155" strokeWidth="1" strokeOpacity="0.4" pointerEvents="none">
                    <line x1={layout.x + 40} y1={layout.y + 45} x2={layout.x + layout.w - 40} y2={layout.y + 45} />
                    <line x1={layout.x + 40} y1={layout.y + 90} x2={layout.x + layout.w - 40} y2={layout.y + 90} />
                    <line x1={layout.x + 40} y1={layout.y + 135} x2={layout.x + layout.w - 40} y2={layout.y + 135} />
                  </g>
                )}

                {zone.id.includes('Assembly') && (
                  <g stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="6 3" pointerEvents="none">
                    <line x1={layout.x + 30} y1={layout.y + layout.h * 0.55} x2={layout.x + layout.w - 30} y2={layout.y + layout.h * 0.55} />
                    <circle cx={layout.x + 120} cy={layout.y + layout.h * 0.55} r="8" fill="none" />
                    <circle cx={layout.x + 240} cy={layout.y + layout.h * 0.55} r="8" fill="none" />
                    <circle cx={layout.x + 360} cy={layout.y + layout.h * 0.55} r="8" fill="none" />
                  </g>
                )}

                {zone.id.includes('Outdoor') && (
                  <g stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.25" pointerEvents="none">
                    <line x1={layout.x + 20} y1={layout.y + 40} x2={layout.x + 70} y2={layout.y + 90} />
                    <line x1={layout.x + 70} y1={layout.y + 40} x2={layout.x + 20} y2={layout.y + 90} />
                    <line x1={layout.x + 80} y1={layout.y + 40} x2={layout.x + 130} y2={layout.y + 90} />
                    <line x1={layout.x + 130} y1={layout.y + 40} x2={layout.x + 80} y2={layout.y + 90} />
                  </g>
                )}

                {/* Corner Targeting Brackets for Selected Zone */}
                {isSelected && (
                  <g stroke="#38bdf8" strokeWidth="2.5" fill="none">
                    <path d={`M ${layout.x + 1} ${layout.y + 14} L ${layout.x + 1} ${layout.y + 1} L ${layout.x + 14} ${layout.y + 1}`} />
                    <path d={`M ${layout.x + layout.w - 14} ${layout.y + 1} L ${layout.x + layout.w - 1} ${layout.y + 1} L ${layout.x + layout.w - 1} ${layout.y + 14}`} />
                    <path d={`M ${layout.x + 1} ${layout.y + layout.h - 14} L ${layout.x + 1} ${layout.y + layout.h - 1} L ${layout.x + 14} ${layout.y + layout.h - 1}`} />
                    <path d={`M ${layout.x + layout.w - 14} ${layout.y + layout.h - 1} L ${layout.x + layout.w - 1} ${layout.y + layout.h - 1} L ${layout.x + layout.w - 1} ${layout.y + layout.h - 14}`} />
                  </g>
                )}

                {/* Zone Code & Label Header */}
                <text
                  x={layout.labelX}
                  y={layout.labelY - 10}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  [{layout.code}]
                </text>
                <text
                  x={layout.labelX}
                  y={layout.labelY + 6}
                  fill="#ffffff"
                  fontSize="13"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="bold"
                >
                  {zone.name.replace('Outdoor-', '').replace('Manufacturing-', '').replace('Warehouse-', '').replace('Subgrade-', '')}
                </text>

                {/* Live Micro Status Badges on Floor Map */}
                <g transform={`translate(${layout.x + layout.w - 125}, ${layout.y + 16})`}>
                  <rect
                    x="0"
                    y="0"
                    width="112"
                    height="22"
                    rx="4"
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth="1"
                    strokeOpacity="0.8"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r="4"
                    fill={strokeColor}
                    className={hasCritical ? 'animate-ping' : ''}
                  />
                  <text
                    x="22"
                    y="15"
                    fill={statusTextColor}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {zone.status} • {zone.temp}
                  </text>
                </g>

                {/* Sensor Telemetry Nodes on Zone Map */}
                {(overlayMode === 'all' || overlayMode === 'nodes') &&
                  layout.sensors.map((sensor, sIdx) => {
                    const isNodeActive =
                      (sensor.type === 'temp' && streamToggles.ambientTemp) ||
                      (sensor.type === 'noise' && streamToggles.noiseDb) ||
                      (sensor.type === 'hrv' && streamToggles.hrvDrop) ||
                      (sensor.type === 'aqi' && streamToggles.aqiAirQuality);

                    const nodeColor =
                      sensor.type === 'temp'
                        ? '#f59e0b'
                        : sensor.type === 'noise'
                        ? '#a855f7'
                        : sensor.type === 'hrv'
                        ? '#ec4899'
                        : '#10b981';

                    return (
                      <g key={sIdx} transform={`translate(${sensor.x}, ${sensor.y})`}>
                        {isNodeActive && (
                          <circle cx="0" cy="0" r="7" fill={nodeColor} fillOpacity="0.25" className="animate-pulse" />
                        )}
                        <circle
                          cx="0"
                          cy="0"
                          r="3.5"
                          fill={isNodeActive ? nodeColor : '#475569'}
                          stroke="#0f172a"
                          strokeWidth="1"
                        />
                        <text
                          x="7"
                          y="3"
                          fill={isNodeActive ? '#e2e8f0' : '#64748b'}
                          fontSize="7.5"
                          fontFamily="monospace"
                        >
                          {sensor.label}
                        </text>
                      </g>
                    );
                  })}

                {/* Bottom Stats Strip in Zone Polygon */}
                <g transform={`translate(${layout.x + 16}, ${layout.y + layout.h - 26})`}>
                  <rect
                    x="-4"
                    y="-12"
                    width={layout.w - 24}
                    height="20"
                    rx="3"
                    fill="#020617"
                    fillOpacity="0.75"
                    stroke="#1e293b"
                    strokeWidth="0.8"
                  />
                  <text x="4" y="2" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    WORKFORCE: <tspan fill="#38bdf8" fontWeight="bold">N={zone.count}</tspan> {zone.count < 12 ? '(SUPPRESSED)' : '(PROTECTED)'}
                  </text>
                  <text x={layout.w - 170} y="2" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                    ALERTS: <tspan fill={zoneAlertList.length > 0 ? '#f43f5e' : '#34d399'} fontWeight="bold">{zoneAlertList.length} Active</tspan>
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Zone Quick Identifier Banner */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-md flex items-center space-x-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-400">Inspecting Zone:</span>
          <span className="font-bold text-white">{selectedZone.name}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
              selectedZone.status === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400'
                : selectedZone.status === 'MODERATE'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {selectedZone.status}
          </span>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg p-2 shadow-md hidden sm:flex items-center space-x-4 text-[11px] text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span>Critical Anomaly</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span>Moderate Heat</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>Stable Baseline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 border border-cyan-400 rounded-sm"></span>
            <span>Active Selection</span>
          </div>
        </div>
      </div>

      {/* Localized Health Stats & Telemetry Stream Control Panel */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Localized Health Stats for the Selected Area */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Localized Health &amp; Exposure Stats: {selectedZone.name}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              GPS: {selectedZone.latitude.toFixed(3)}°, {selectedZone.longitude.toFixed(3)}°
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Worker Density */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <Users className="h-3 w-3 mr-1 text-cyan-400" />
                <span>Worker Density</span>
              </div>
              <div className="text-lg font-bold text-white">N = {selectedZone.count}</div>
              <div className="text-[10px] mt-0.5">
                {selectedZone.count < 12 ? (
                  <span className="text-amber-400 font-semibold">Small-Cell Suppressed</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">k-Anonymity Verified</span>
                )}
              </div>
            </div>

            {/* Heat Stress Index */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <Thermometer className="h-3 w-3 mr-1 text-rose-400" />
                <span>WBGT Heat Index</span>
              </div>
              <div className="text-lg font-bold text-white">{selectedZone.heatIndex || 42.5}°C</div>
              <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                {selectedZone.heatIndex > 40 ? 'Severe Thermal Strain' : 'Moderate Heat Load'}
              </div>
            </div>

            {/* Acoustic Noise Exposure */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <Volume2 className="h-3 w-3 mr-1 text-purple-400" />
                <span>Noise Exposure</span>
              </div>
              <div className="text-lg font-bold text-white">
                {selectedZone.customBaselines?.noiseLimitDb || 88} dBA
              </div>
              <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                {(selectedZone.customBaselines?.noiseLimitDb || 88) >= 85 ? 'OSHA Limit Exceeded' : 'Permissible Level'}
              </div>
            </div>

            {/* Air Quality & TWL */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <Wind className="h-3 w-3 mr-1 text-emerald-400" />
                <span>TWL / Air Quality</span>
              </div>
              <div className="text-lg font-bold text-white">
                {selectedZone.twl} <span className="text-xs font-normal text-slate-400">W/m²</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                AQI: {selectedZone.aqi} • {selectedZone.aqi > 100 ? 'Unhealthy' : 'Moderate'}
              </div>
            </div>

            {/* Active Anomaly Alerts */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <ShieldAlert className="h-3 w-3 mr-1 text-rose-400" />
                <span>Active Anomalies</span>
              </div>
              <div className="text-lg font-bold text-rose-400">{selectedZoneAlerts.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {selectedZoneAlerts.filter((a) => a.severity === 'CRITICAL').length} Critical
              </div>
            </div>

            {/* Biometric Baseline Status */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center text-slate-400 text-[11px] mb-1">
                <Heart className="h-3 w-3 mr-1 text-pink-400" />
                <span>Baseline HRV</span>
              </div>
              <div className="text-lg font-bold text-white">
                {selectedZone.customBaselines?.baselineHrv || 68} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                Skin Baseline: {selectedZone.customBaselines?.baselineSkinTemp || 36.5}°C
              </div>
            </div>
          </div>

          {/* Active Hazards Tag List */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Active Hazards:</span>
            {selectedZone.activeHazards.map((hazard, hIdx) => (
              <span
                key={hIdx}
                className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px] px-2 py-0.5 rounded font-mono"
              >
                {hazard}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Toggle Individual Sensor Telemetry Streams */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Toggle Individual Sensor Telemetry Streams
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSetAllStreams(true)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                >
                  Enable All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => onSetAllStreams(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-300 font-semibold underline"
                >
                  Mute All
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Enable or disable specific sensor feeds for <strong className="text-slate-200">{selectedZone.name}</strong> to isolate physiological signals versus ambient environmental noise in the sliding telemetry charts:
            </p>

            {/* 6 Individual Sensor Feeds Toggle Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {/* Ambient Temp */}
              <button
                onClick={() => onToggleStream('ambientTemp')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.ambientTemp
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Thermometer className={`h-4 w-4 ${streamToggles.ambientTemp ? 'text-amber-400' : 'text-slate-600'}`} />
                  {streamToggles.ambientTemp ? (
                    <Eye className="h-3 w-3 text-amber-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Ambient Temp</div>
                <div className="text-[10px] font-mono text-slate-400">WBGT Heat Load</div>
              </button>

              {/* Noise dB */}
              <button
                onClick={() => onToggleStream('noiseDb')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.noiseDb
                    ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Volume2 className={`h-4 w-4 ${streamToggles.noiseDb ? 'text-purple-400' : 'text-slate-600'}`} />
                  {streamToggles.noiseDb ? (
                    <Eye className="h-3 w-3 text-purple-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Acoustic Noise</div>
                <div className="text-[10px] font-mono text-slate-400">OSHA 85 dB Mic</div>
              </button>

              {/* HRV Variability */}
              <button
                onClick={() => onToggleStream('hrvDrop')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.hrvDrop
                    ? 'bg-pink-950/40 border-pink-500/60 text-pink-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Heart className={`h-4 w-4 ${streamToggles.hrvDrop ? 'text-pink-400' : 'text-slate-600'}`} />
                  {streamToggles.hrvDrop ? (
                    <Eye className="h-3 w-3 text-pink-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Worker HRV</div>
                <div className="text-[10px] font-mono text-slate-400">Autonomic Stress</div>
              </button>

              {/* Skin Temp */}
              <button
                onClick={() => onToggleStream('skinTemp')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.skinTemp
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Zap className={`h-4 w-4 ${streamToggles.skinTemp ? 'text-rose-400' : 'text-slate-600'}`} />
                  {streamToggles.skinTemp ? (
                    <Eye className="h-3 w-3 text-rose-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Skin / Core Temp</div>
                <div className="text-[10px] font-mono text-slate-400">Thermoregulation</div>
              </button>

              {/* AQI & TWL */}
              <button
                onClick={() => onToggleStream('aqiAirQuality')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.aqiAirQuality
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Wind className={`h-4 w-4 ${streamToggles.aqiAirQuality ? 'text-emerald-400' : 'text-slate-600'}`} />
                  {streamToggles.aqiAirQuality ? (
                    <Eye className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Air Quality &amp; TWL</div>
                <div className="text-[10px] font-mono text-slate-400">Particulate &amp; Vents</div>
              </button>

              {/* Risk Score */}
              <button
                onClick={() => onToggleStream('riskScore')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  streamToggles.riskScore
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <Activity className={`h-4 w-4 ${streamToggles.riskScore ? 'text-cyan-400' : 'text-slate-600'}`} />
                  {streamToggles.riskScore ? (
                    <Eye className="h-3 w-3 text-cyan-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-white">Multi-Signal Risk</div>
                <div className="text-[10px] font-mono text-slate-400">LSTM / Kalman Index</div>
              </button>
            </div>
          </div>

          {/* Real-Time Live Feed Indicator Bar */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300 font-mono text-[11px]">
                Active Stream Channels:{' '}
                <strong className="text-cyan-400">
                  {Object.values(streamToggles).filter(Boolean).length} / 6
                </strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Synchronized with 24-hr Recharts Telemetry stream below
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

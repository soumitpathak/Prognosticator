import React, { useState, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Users,
  MapPin,
  Activity,
  Layers,
  Thermometer,
  Wind,
  Filter,
  CheckCircle2,
  ArrowRight,
  Radio,
  Clock,
  Eye,
  Info,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';

export interface ZoneAnomalyConcentrationHeatmapProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  telemetryStream?: TelemetryDataPoint[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onDispatchMitigation?: (zone: FacilityZone, action: string) => void;
  className?: string;
}

interface ZoneConcentrationData {
  zone: FacilityZone;
  anomalyCount: number;
  criticalCount: number;
  highCount: number;
  concentrationScore: number; // 0 - 100
  tier: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  densityPerSqMeter: number;
  primaryHazard: string;
  workerCount: number;
  quadrants: {
    name: string;
    score: number;
    hazard: string;
    activeCount: number;
  }[];
  trendDirection: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export default function ZoneAnomalyConcentrationHeatmap({
  zones,
  alerts,
  telemetryStream = [],
  selectedZoneId,
  onSelectZone,
  onDispatchMitigation,
  className = ''
}: ZoneAnomalyConcentrationHeatmapProps) {
  const [viewMode, setViewMode] = useState<'SPATIAL' | 'MATRIX' | 'VECTORS'>('SPATIAL');
  const [timeWindow, setTimeWindow] = useState<'1H' | '8H' | '24H'>('8H');
  const [filterHighConcentrationOnly, setFilterHighConcentrationOnly] = useState(false);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [stagedActionNotice, setStagedActionNotice] = useState<string | null>(null);

  // Compute concentration data per zone
  const concentrationData: ZoneConcentrationData[] = useMemo(() => {
    return zones.map((zone) => {
      // Find alerts for this zone
      const zoneAlerts = alerts.filter(
        (a) => a.location_zone.toLowerCase().includes(zone.id.toLowerCase()) ||
               zone.name.toLowerCase().includes(a.location_zone.toLowerCase())
      );

      const criticalAlerts = zoneAlerts.filter((a) => a.severity === 'CRITICAL');
      const highAlerts = zoneAlerts.filter((a) => a.severity === 'HIGH');

      // Base concentration calculation from alerts + thermal stress
      const alertWeight = zoneAlerts.length * 14 + criticalAlerts.length * 20 + highAlerts.length * 10;
      const heatFactor = Math.max(0, ((zone.heatIndex || 38) - 30) * 2.5);
      const twlPenalty = zone.twl < 140 ? (140 - zone.twl) * 0.4 : 0;

      // Base score normalized 0-100
      let rawScore = alertWeight + heatFactor + twlPenalty;
      if (zone.status === 'CRITICAL') rawScore = Math.max(rawScore, 75);
      else if (zone.status === 'MODERATE') rawScore = Math.max(rawScore, 48);

      const concentrationScore = Math.min(98, Math.max(12, Math.round(rawScore)));

      let tier: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (concentrationScore >= 75) tier = 'EXTREME';
      else if (concentrationScore >= 50) tier = 'HIGH';
      else if (concentrationScore >= 30) tier = 'MODERATE';

      // Primary hazard classification
      let primaryHazard = 'Cardiovascular Fatigue';
      if (zone.heatIndex >= 44 || zone.temp.includes('4')) {
        primaryHazard = 'Extreme Solar Heat Strain & WBGT';
      } else if (zone.id.includes('Tunnel') || zone.aqi > 90) {
        primaryHazard = 'Subgrade Hypoxia & Particulate AQI';
      } else if (zone.id.includes('Foundry') || zone.id.includes('Smelting')) {
        primaryHazard = 'Radiant Blast & Thermal Stress';
      } else if (zone.id.includes('Assembly')) {
        primaryHazard = 'Repetitive Ergonomic & Acoustic Strain';
      } else if (zone.id.includes('Warehouse')) {
        primaryHazard = 'Cumulative Exertion & Dehydration';
      }

      // Generate 4 sub-quadrants
      const quadrants = [
        {
          name: 'Quad A: Ingress & Primary Rigging',
          score: Math.min(99, Math.round(concentrationScore * 1.05)),
          hazard: primaryHazard,
          activeCount: Math.ceil(zoneAlerts.length * 0.4)
        },
        {
          name: 'Quad B: Heavy Processing Line',
          score: Math.min(99, Math.round(concentrationScore * 0.9)),
          hazard: 'Thermal Exertion',
          activeCount: Math.floor(zoneAlerts.length * 0.3)
        },
        {
          name: 'Quad C: Material Transfer Bay',
          score: Math.min(99, Math.round(concentrationScore * 0.8)),
          hazard: 'Acoustic Load',
          activeCount: Math.floor(zoneAlerts.length * 0.2)
        },
        {
          name: 'Quad D: Staging & Buffer Zone',
          score: Math.min(99, Math.round(concentrationScore * 0.65)),
          hazard: 'Baseline Fatigue',
          activeCount: Math.max(0, zoneAlerts.length - Math.ceil(zoneAlerts.length * 0.4) - Math.floor(zoneAlerts.length * 0.3) - Math.floor(zoneAlerts.length * 0.2))
        }
      ];

      return {
        zone,
        anomalyCount: zoneAlerts.length,
        criticalCount: criticalAlerts.length,
        highCount: highAlerts.length,
        concentrationScore,
        tier,
        densityPerSqMeter: parseFloat((concentrationScore / 22).toFixed(1)),
        primaryHazard,
        workerCount: zone.count || 24,
        quadrants,
        trendDirection: concentrationScore >= 60 ? 'INCREASING' : concentrationScore >= 40 ? 'STABLE' : 'DECREASING'
      };
    });
  }, [zones, alerts]);

  // Active / Selected zone data
  const selectedZoneData = useMemo(() => {
    return concentrationData.find((d) => d.zone.id === selectedZoneId) || concentrationData[0];
  }, [concentrationData, selectedZoneId]);

  // Summary KPIs
  const maxConcentrationZone = useMemo(() => {
    return [...concentrationData].sort((a, b) => b.concentrationScore - a.concentrationScore)[0];
  }, [concentrationData]);

  const avgConcentration = useMemo(() => {
    if (!concentrationData.length) return 0;
    const sum = concentrationData.reduce((acc, curr) => acc + curr.concentrationScore, 0);
    return Math.round(sum / concentrationData.length);
  }, [concentrationData]);

  const highConcentrationCount = useMemo(() => {
    return concentrationData.filter((d) => d.concentrationScore >= 50).length;
  }, [concentrationData]);

  const filteredZones = useMemo(() => {
    if (filterHighConcentrationOnly) {
      return concentrationData.filter((d) => d.concentrationScore >= 50);
    }
    return concentrationData;
  }, [concentrationData, filterHighConcentrationOnly]);

  const handleMitigationClick = (zone: FacilityZone, action: string) => {
    if (onDispatchMitigation) {
      onDispatchMitigation(zone, action);
    }
    setStagedActionNotice(`Mitigation deployed to ${zone.name}: ${action}`);
    setTimeout(() => setStagedActionNotice(null), 5000);
  };

  // Helper for concentration heat color
  const getConcentrationColor = (score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-rose-950/70',
        border: 'border-rose-500/80',
        text: 'text-rose-400',
        glow: 'shadow-rose-900/40 ring-1 ring-rose-500/50',
        bar: 'bg-rose-500',
        badge: 'text-rose-400'
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-orange-950/60',
        border: 'border-orange-500/70',
        text: 'text-orange-400',
        glow: 'shadow-orange-900/30',
        bar: 'bg-orange-500',
        badge: 'text-orange-400'
      };
    }
    if (score >= 30) {
      return {
        bg: 'bg-amber-950/40',
        border: 'border-amber-600/50',
        text: 'text-amber-400',
        glow: 'shadow-amber-900/20',
        bar: 'bg-amber-500',
        badge: 'text-amber-400'
      };
    }
    return {
      bg: 'bg-slate-900/80',
      border: 'border-cyan-800/40',
      text: 'text-cyan-400',
      glow: 'shadow-slate-900',
      bar: 'bg-cyan-500',
      badge: 'text-cyan-400'
    };
  };

  return (
    <div id="zone-anomaly-concentration-heatmap" className={`bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 ${className}`}>
      {/* Top Header & Operational Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Zone Anomaly Concentration Heatmap
            </h3>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-xs font-mono text-cyan-400">Spatial Hazard Density</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual spatial matrix displaying geographic concentration intensity of workforce health anomalies and physiological strain hot spots.
          </p>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('SPATIAL')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'SPATIAL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spatial Facility Grid
            </button>
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'MATRIX'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sub-Quad Matrix
            </button>
            <button
              onClick={() => setViewMode('VECTORS')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'VECTORS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hazard Vectors
            </button>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['1H', '8H', '24H'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition cursor-pointer ${
                  timeWindow === tw
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tw === '1H' ? '1h Instant' : tw === '8H' ? '8h Shift' : '24h Total'}
              </button>
            ))}
          </div>

          {/* High Concentration Filter Toggle */}
          <button
            onClick={() => setFilterHighConcentrationOnly((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
              filterHighConcentrationOnly
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>High Risk Only (≥50%)</span>
          </button>
        </div>
      </div>

      {/* Real-Time Concentration Summary Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Peak Concentration Zone</div>
          <div className="text-sm font-bold text-rose-400 font-mono mt-0.5 truncate">
            {maxConcentrationZone?.zone.name || 'Outdoor Sector 4'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Concentration Index: <span className="font-mono text-rose-300 font-semibold">{maxConcentrationZone?.concentrationScore}%</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Mean Anomaly Density</div>
          <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
            {avgConcentration}% <span className="text-xs font-normal text-slate-400">facility avg</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Scale: 0 (Quiescent) - 100 (Critical)
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Active High-Risk Hotspots</div>
          <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
            {highConcentrationCount} / {zones.length} <span className="text-xs font-normal text-slate-400">zones</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Requiring immediate rotation
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] text-slate-400">Monitored In Hot Zones</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            {concentrationData.reduce((acc, z) => acc + (z.concentrationScore >= 50 ? z.workerCount : 0), 0)} <span className="text-xs font-normal text-slate-400">workers</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Live wearable biometrics active
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {stagedActionNotice && (
        <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{stagedActionNotice}</span>
          </div>
          <button
            onClick={() => setStagedActionNotice(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Heatmap Canvas */}
      {viewMode === 'SPATIAL' && (
        <div className="space-y-4">
          {/* Spatial Grid representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredZones.map((item) => {
              const colors = getConcentrationColor(item.concentrationScore);
              const isSelected = item.zone.id === selectedZoneId;

              return (
                <div
                  key={item.zone.id}
                  onClick={() => onSelectZone(item.zone.id)}
                  onMouseEnter={() => setHoveredZoneId(item.zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer ${colors.bg} ${colors.border} ${
                    isSelected ? 'ring-2 ring-cyan-400 shadow-lg ' + colors.glow : 'hover:border-slate-500'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-0.5">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        <span className="font-mono text-[11px] uppercase tracking-wider">{item.zone.id.split('-')[0]}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug">
                        {item.zone.name}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {item.concentrationScore}%
                      </div>
                      <div className={`text-[10px] font-semibold tracking-wider ${colors.text}`}>
                        {item.tier}
                      </div>
                    </div>
                  </div>

                  {/* Visual Heat Density Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Anomaly Concentration Index</span>
                      <span className="font-mono text-white text-[11px] font-semibold">{item.anomalyCount} active alerts</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${colors.bar} transition-all duration-500`}
                        style={{ width: `${item.concentrationScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Sub-Quad Mini Heat Matrix */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Sub-Sector Quad Concentration</span>
                      <span className="font-mono text-cyan-400 text-[10px]">4 Sectors</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {item.quadrants.map((quad, qIdx) => {
                        const qColor = getConcentrationColor(quad.score);
                        return (
                          <div
                            key={qIdx}
                            className={`p-1.5 rounded-md border text-[10px] font-mono flex items-center justify-between ${qColor.bg} ${qColor.border}`}
                          >
                            <span className="truncate max-w-[90px] text-slate-300">
                              Q{qIdx + 1}: {quad.name.split(':')[0].replace('Quad ', '')}
                            </span>
                            <span className={`font-bold ${qColor.text}`}>
                              {quad.score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zone Microclimate & Hazard Strip */}
                  <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      <span className="flex items-center space-x-1" title="Heat Index">
                        <Thermometer className="h-3 w-3 text-amber-400" />
                        <span>{item.zone.heatIndex || 38.5}°C</span>
                      </span>
                      <span className="flex items-center space-x-1" title="Thermal Work Limit">
                        <Wind className="h-3 w-3 text-cyan-400" />
                        <span>{item.zone.twl} W/m²</span>
                      </span>
                      <span className="flex items-center space-x-1" title="Workers in Zone">
                        <Users className="h-3 w-3 text-indigo-400" />
                        <span>{item.workerCount}</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectZone(item.zone.id);
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Quad Matrix View */}
      {viewMode === 'MATRIX' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Facility Zone</th>
                <th className="py-2.5 px-3">Overall Intensity</th>
                <th className="py-2.5 px-3">Quad A (Ingress)</th>
                <th className="py-2.5 px-3">Quad B (Heavy Line)</th>
                <th className="py-2.5 px-3">Quad C (Transfer)</th>
                <th className="py-2.5 px-3">Quad D (Buffer)</th>
                <th className="py-2.5 px-3">Primary Hazard</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredZones.map((item) => {
                const colors = getConcentrationColor(item.concentrationScore);
                const isSelected = item.zone.id === selectedZoneId;
                return (
                  <tr
                    key={item.zone.id}
                    onClick={() => onSelectZone(item.zone.id)}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white font-sans">{item.zone.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.zone.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${colors.text}`}>{item.concentrationScore}%</span>
                        <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${item.concentrationScore}%` }}></div>
                        </div>
                      </div>
                    </td>
                    {item.quadrants.map((quad, qIdx) => {
                      const qColor = getConcentrationColor(quad.score);
                      return (
                        <td key={qIdx} className="py-3 px-3">
                          <div className={`px-2 py-1 rounded border text-[11px] font-bold text-center ${qColor.bg} ${qColor.border} ${qColor.text}`}>
                            {quad.score}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-slate-300 font-sans text-xs">
                      {item.primaryHazard}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMitigationClick(item.zone, 'Activate high-velocity misting & rotation');
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        Mitigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hazard Vectors View */}
      {viewMode === 'VECTORS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredZones.map((item) => {
            const colors = getConcentrationColor(item.concentrationScore);
            return (
              <div
                key={item.zone.id}
                className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{item.zone.name}</h4>
                  <span className={`text-xs font-mono font-bold ${colors.text}`}>
                    {item.concentrationScore}% Anomaly Density
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Dominant Hazard Vector:</div>
                    <div className="text-amber-300 font-semibold mt-0.5">{item.primaryHazard}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded">
                      <div className="text-slate-500">Heat Index</div>
                      <div className="text-white font-bold">{item.zone.heatIndex}°C</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded">
                      <div className="text-slate-500">TWL Safe Limit</div>
                      <div className="text-white font-bold">{item.zone.twl} W/m²</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded">
                      <div className="text-slate-500">AQI Particulate</div>
                      <div className="text-white font-bold">{item.zone.aqi}</div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleMitigationClick(item.zone, 'Stage hydration & portable chiller packs')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Stage Mitigation Protocol</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Zone Deep Dive Drawer / Details */}
      {selectedZoneData && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-cyan-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-bold uppercase font-mono tracking-wider">Active Focus:</span>
              <span className="text-white font-bold">{selectedZoneData.zone.name}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-cyan-300">{selectedZoneData.workerCount} personnel</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-mono">Concentration: {selectedZoneData.concentrationScore}%</span>
            </div>
            <p className="text-xs text-slate-400">
              Primary Anomaly Driver: <strong className="text-amber-300">{selectedZoneData.primaryHazard}</strong>. {selectedZoneData.anomalyCount} alerts active in this geographic quadrant.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleMitigationClick(selectedZoneData.zone, 'Dispatch Emergency Rest Breaks & Electrolytes')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Dispatch Rapid Protocols</span>
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Concentration Scale:</span>
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="h-2.5 w-4 rounded-xs bg-cyan-950 border border-cyan-800"></span>
            <span>0-29% (Low)</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="h-2.5 w-4 rounded-xs bg-amber-950 border border-amber-600"></span>
            <span>30-49% (Moderate)</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="h-2.5 w-4 rounded-xs bg-orange-950 border border-orange-500"></span>
            <span>50-74% (High)</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <span className="h-2.5 w-4 rounded-xs bg-rose-950 border border-rose-500"></span>
            <span>75-100% (Extreme Hotspot)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Source: In-Situ Microclimate Telemetry + Wearable Anomaly Detector
        </div>
      </div>
    </div>
  );
}

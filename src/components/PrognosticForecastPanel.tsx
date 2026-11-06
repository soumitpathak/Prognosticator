import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Zap,
  Flame,
  Activity,
  Layers,
  Thermometer,
  ShieldCheck,
  RotateCcw,
  GitCompare,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';

export interface PrognosticForecastPanelProps {
  alerts: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  selectedZone?: FacilityZone;
  onSelectZone?: (zoneId: string) => void;
  onApplyPreemptiveProtocol?: (scenario: string, details: string) => void;
  className?: string;
}

export type ForecastHorizon = '24H' | '48H';
export type ForecastScenario = 'BASELINE' | 'HEAT_SURGE' | 'MITIGATED';

export interface PrognosticDataPoint {
  timeOffset: number; // e.g. 4, 8, 12 ... 48
  timeLabel: string;
  shiftLabel: string;
  projectedRiskScore: number; // 0 - 100
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
  simulatedAnomalyCount: number;
  primaryRiskDriver: string;
  highestRiskZone: string;
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE';
  isPeak: boolean;
  // Comparative fields
  projectedRiskScoreA?: number;
  projectedRiskScoreB?: number;
  simulatedAnomalyCountA?: number;
  simulatedAnomalyCountB?: number;
  deltaRisk?: number;
}

export default function PrognosticForecastPanel({
  alerts,
  zones,
  selectedZone,
  onSelectZone,
  onApplyPreemptiveProtocol,
  className = ''
}: PrognosticForecastPanelProps) {
  const [horizon, setHorizon] = useState<ForecastHorizon>('48H');
  const [scenario, setScenario] = useState<ForecastScenario>('BASELINE');
  const [selectedPointOffset, setSelectedPointOffset] = useState<number | null>(null);
  const [mitigationNotice, setMitigationNotice] = useState<string | null>(null);

  // Comparison Tool State
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [zoneAId, setZoneAId] = useState<string>(
    selectedZone?.id || zones[0]?.id || 'Outdoor-Construction-Sector-4'
  );
  const [zoneBId, setZoneBId] = useState<string>(
    zones[2]?.id || 'Warehouse-Logistics-Hub-North'
  );

  const zoneAObj = useMemo(() => {
    return zones.find((z) => z.id === zoneAId) || zones[0];
  }, [zones, zoneAId]);

  const zoneBObj = useMemo(() => {
    return zones.find((z) => z.id === zoneBId) || zones[1] || zones[0];
  }, [zones, zoneBId]);

  // Compute 24-48h simulated trend data
  const forecastData: PrognosticDataPoint[] = useMemo(() => {
    const historicalCriticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const historicalTotal = alerts.length;
    const currentHeatIndex = selectedZone?.heatIndex || 39.5;

    // Multiplier based on scenario
    const scenarioRiskMultiplier =
      scenario === 'HEAT_SURGE' ? 1.35 : scenario === 'MITIGATED' ? 0.65 : 1.0;
    const scenarioAnomalyMultiplier =
      scenario === 'HEAT_SURGE' ? 1.45 : scenario === 'MITIGATED' ? 0.55 : 1.0;

    const baseRisk = Math.min(65, Math.max(28, 25 + historicalTotal * 3 + (currentHeatIndex - 32) * 1.8));

    // Base risks for comparative zones
    const heatA = zoneAObj?.heatIndex || 42.0;
    const heatB = zoneBObj?.heatIndex || 34.0;
    const isSector4A = zoneAId.includes('Sector-4');
    const isSector4B = zoneBId.includes('Sector-4');
    const isFoundryA = zoneAId.includes('Foundry') || zoneAId.includes('Smelting');
    const isFoundryB = zoneBId.includes('Foundry') || zoneBId.includes('Smelting');
    const isTunnelA = zoneAId.includes('Tunnel');
    const isTunnelB = zoneBId.includes('Tunnel');

    const baseRiskA = isSector4A ? 68 : isFoundryA ? 62 : isTunnelA ? 48 : 30 + (heatA - 30) * 1.2;
    const baseRiskB = isSector4B ? 68 : isFoundryB ? 62 : isTunnelB ? 48 : 30 + (heatB - 30) * 1.2;

    // Steps: 48h has 12 points (every 4h). 24h has 6 points.
    const maxHours = horizon === '24H' ? 24 : 48;
    const points: PrognosticDataPoint[] = [];

    const shiftNames = [
      'Late Afternoon Shift',
      'Evening Shift (Twilight Handover)',
      'Night Shift A (Circadian Nadir)',
      'Dawn Shift (First Light Turnover)',
      'Morning Shift B (Operational Ramp)',
      'Midday Peak Thermal Shift',
      'Afternoon Shift B (Solar Zenith)',
      'Evening Shift B (Cumulative Fatigue)',
      'Night Shift C (Core Slump)',
      'Dawn Shift C (Pre-Heat Rotation)',
      'Morning Shift C (High Velocity)',
      'Midday Peak Thermal Horizon'
    ];

    const drivers = [
      'Peak Afternoon Solar WBGT Spike',
      'Residual Radiant Heat Dissipation',
      'Circadian Melatonin Peak & Alertness Drop',
      'Morning Shift Handover Desynchronization',
      'Rapid Ambient Air Temperature Rise',
      'Solar Radiation & Severe Core Temp Elevation',
      'Sustained Physical Exertion & Dehydration',
      'Cumulative Multi-Shift Autonomic Stress',
      'Night-time Subgrade Humidity Accumulation',
      'Transition Period Thermal Expansion',
      'Heavy Machinery Mechanical Heat Output',
      'Second-Day Compounding Heat Stress Event'
    ];

    for (let h = 4; h <= maxHours; h += 4) {
      const idx = Math.floor(h / 4) - 1;
      const shift = shiftNames[idx % shiftNames.length];
      const driver = drivers[idx % drivers.length];

      // Diurnal rhythm oscillation: peak in midday (+24h, +48h), lower at night (+12h, +36h)
      const hourOfDay = (14 + h) % 24; // assume starting at 14:00
      let diurnalFactor = 0;
      if (hourOfDay >= 12 && hourOfDay <= 17) {
        diurnalFactor = 16.5; // Afternoon heat peak
      } else if (hourOfDay >= 1 && hourOfDay <= 5) {
        diurnalFactor = -12.0; // Early morning minimum
      } else if (hourOfDay >= 8 && hourOfDay <= 11) {
        diurnalFactor = 8.0; // Morning ramp
      }

      // Day 2 compounding fatigue trend (+3% drift for second 24 hours)
      const day2Compounding = h > 24 ? (h - 24) * 0.45 : 0;

      let score = (baseRisk + diurnalFactor + day2Compounding) * scenarioRiskMultiplier;
      score = Math.min(96, Math.max(15, Math.round(score * 10) / 10));

      const spread = 7.5 + (h / 48) * 6.0; // Uncertainty band widens further in the future
      const upper = Math.min(99, Math.round((score + spread) * 10) / 10);
      const lower = Math.max(8, Math.round((score - spread) * 10) / 10);

      // Simulated anomaly events in this 4-hour window
      const baseEvents = (score / 22) * scenarioAnomalyMultiplier;
      const simulatedAnomalyCount = Math.max(0, Math.round(baseEvents * 10) / 10);

      // Comparative calculation for Zone A and Zone B
      let scoreA = (baseRiskA + diurnalFactor + day2Compounding) * scenarioRiskMultiplier;
      scoreA = Math.min(98, Math.max(12, Math.round(scoreA * 10) / 10));

      // Zone B diurnal response (indoor or warehouse has dampened diurnal swing)
      const isIndoorB = !isSector4B && !isFoundryB;
      const diurnalB = isIndoorB ? diurnalFactor * 0.5 : diurnalFactor;
      let scoreB = (baseRiskB + diurnalB + day2Compounding * 0.7) * scenarioRiskMultiplier;
      scoreB = Math.min(98, Math.max(12, Math.round(scoreB * 10) / 10));

      const anomaliesA = Math.max(0, Math.round((scoreA / 22) * scenarioAnomalyMultiplier * 10) / 10);
      const anomaliesB = Math.max(0, Math.round((scoreB / 24) * scenarioAnomalyMultiplier * 10) / 10);
      const deltaRisk = Math.round((scoreA - scoreB) * 10) / 10;

      let tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE' = 'STABLE';
      if (score >= 75) tier = 'CRITICAL';
      else if (score >= 50) tier = 'HIGH';
      else if (score >= 35) tier = 'MODERATE';

      const highRiskZone =
        score >= 65
          ? 'Outdoor-Construction-Sector-4'
          : score >= 45
          ? 'Subgrade-Tunnel-Conduit-7'
          : 'Warehouse-Logistics-Hub-North';

      points.push({
        timeOffset: h,
        timeLabel: `+${h}h (${hourOfDay.toString().padStart(2, '0')}:00)`,
        shiftLabel: shift,
        projectedRiskScore: score,
        upperConfidenceBound: upper,
        lowerConfidenceBound: lower,
        simulatedAnomalyCount,
        primaryRiskDriver: driver,
        highestRiskZone: highRiskZone,
        tier,
        isPeak: false,
        projectedRiskScoreA: scoreA,
        projectedRiskScoreB: scoreB,
        simulatedAnomalyCountA: anomaliesA,
        simulatedAnomalyCountB: anomaliesB,
        deltaRisk
      });
    }

    // Mark peak hour
    let maxPt = points[0];
    points.forEach((pt) => {
      if (pt.projectedRiskScore > maxPt.projectedRiskScore) maxPt = pt;
    });
    if (maxPt) maxPt.isPeak = true;

    return points;
  }, [alerts, selectedZone, scenario, horizon, zoneAObj, zoneBObj, zoneAId, zoneBId]);

  // Selected or Peak data point for inspection
  const activeInspectionPoint = useMemo(() => {
    if (selectedPointOffset !== null) {
      const found = forecastData.find((p) => p.timeOffset === selectedPointOffset);
      if (found) return found;
    }
    return forecastData.find((p) => p.isPeak) || forecastData[0];
  }, [forecastData, selectedPointOffset]);

  // Overall forecast metrics
  const forecastMetrics = useMemo(() => {
    const peak = forecastData.reduce((prev, curr) =>
      curr.projectedRiskScore > prev.projectedRiskScore ? curr : prev
    , forecastData[0]);

    const totalSimulatedEvents = forecastData.reduce(
      (sum, p) => sum + p.simulatedAnomalyCount,
      0
    );

    const highRiskHours = forecastData.filter((p) => p.projectedRiskScore >= 50).length * 4;

    // Comparative aggregates
    const peakA = Math.max(...forecastData.map((p) => p.projectedRiskScoreA || 0));
    const peakB = Math.max(...forecastData.map((p) => p.projectedRiskScoreB || 0));
    const totalEventsA = Math.round(forecastData.reduce((sum, p) => sum + (p.simulatedAnomalyCountA || 0), 0));
    const totalEventsB = Math.round(forecastData.reduce((sum, p) => sum + (p.simulatedAnomalyCountB || 0), 0));
    const highRiskHoursA = forecastData.filter((p) => (p.projectedRiskScoreA || 0) >= 50).length * 4;
    const highRiskHoursB = forecastData.filter((p) => (p.projectedRiskScoreB || 0) >= 50).length * 4;

    return {
      peakScore: peak?.projectedRiskScore || 0,
      peakTime: peak?.timeLabel || '+24h',
      peakDriver: peak?.primaryRiskDriver || 'Peak Thermal Exertion',
      totalSimulatedEvents: Math.round(totalSimulatedEvents),
      highRiskHours,
      peakZone: peak?.highestRiskZone || 'Outdoor Sector 4',
      // Comparative
      peakA,
      peakB,
      totalEventsA,
      totalEventsB,
      highRiskHoursA,
      highRiskHoursB,
      deltaPeak: Math.round((peakA - peakB) * 10) / 10
    };
  }, [forecastData]);

  // Handle mitigation trigger
  const handleDeployPreemptiveAction = () => {
    const details = isCompareMode
      ? `Comparative 48h Pre-emptive protocol: Allocating 70% of cooling & hydration assets to higher-risk Zone (${zoneAObj?.name}) over ${zoneBObj?.name}.`
      : `48h Pre-emptive protocol staged for peak window ${forecastMetrics.peakTime}: Mandating 20m shaded rest every 45m, deploying mobile misting rigs to ${forecastMetrics.peakZone}, and pre-allocating rapid IV hydration units.`;
    if (onApplyPreemptiveProtocol) {
      onApplyPreemptiveProtocol(scenario, details);
    }
    setMitigationNotice(
      `Pre-emptive protocol successfully staged for ${forecastMetrics.peakTime}! Expected risk reduction: -35%.`
    );
    setTimeout(() => setMitigationNotice(null), 7000);
  };

  // Custom Recharts Tooltip
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: PrognosticDataPoint = payload[0].payload;

    if (isCompareMode) {
      const isAHigher = (data.projectedRiskScoreA || 0) >= (data.projectedRiskScoreB || 0);
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[310px] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Comparative Horizon: {data.timeLabel}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {data.shiftLabel.split(' ')[0]}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Zone A */}
            <div className="p-2 rounded bg-cyan-950/50 border border-cyan-800/60">
              <div className="flex justify-between items-center">
                <span className="text-cyan-300 font-bold truncate max-w-[180px]">
                  Zone A: {zoneAObj?.name}
                </span>
                <span className="font-bold text-cyan-200 text-sm">
                  {data.projectedRiskScoreA}% Risk
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-cyan-400/80 mt-0.5">
                <span>Simulated Anomaly Rate:</span>
                <span>{data.simulatedAnomalyCountA} events / 4h</span>
              </div>
            </div>

            {/* Zone B */}
            <div className="p-2 rounded bg-rose-950/50 border border-rose-800/60">
              <div className="flex justify-between items-center">
                <span className="text-rose-300 font-bold truncate max-w-[180px]">
                  Zone B: {zoneBObj?.name}
                </span>
                <span className="font-bold text-rose-200 text-sm">
                  {data.projectedRiskScoreB}% Risk
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-rose-400/80 mt-0.5">
                <span>Simulated Anomaly Rate:</span>
                <span>{data.simulatedAnomalyCountB} events / 4h</span>
              </div>
            </div>

            {/* Divergence Delta */}
            <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Risk Variance Delta:</span>
              <span className={`font-bold ${isAHigher ? 'text-cyan-300' : 'text-rose-300'}`}>
                {isAHigher ? `Zone A +${data.deltaRisk}% higher` : `Zone B +${Math.abs(data.deltaRisk || 0)}% higher`}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[280px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Forecast Horizon: {data.timeLabel}</span>
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
              data.tier === 'CRITICAL'
                ? 'bg-rose-950 text-rose-300 border-rose-600'
                : data.tier === 'HIGH'
                ? 'bg-orange-950 text-orange-300 border-orange-600'
                : data.tier === 'MODERATE'
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-emerald-950 text-emerald-300 border-emerald-600'
            }`}
          >
            {data.tier}
          </span>
        </div>

        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Shift Window:</span>
            <span className="font-semibold text-white">{data.shiftLabel}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Projected Risk Score:</span>
            <span className="font-bold text-cyan-300 text-sm">{data.projectedRiskScore}%</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>95% Confidence Interval:</span>
            <span>[{data.lowerConfidenceBound}% - {data.upperConfidenceBound}%]</span>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-400">Simulated Anomaly Rate:</span>
            <span className="font-bold text-amber-400">{data.simulatedAnomalyCount} events / 4h</span>
          </div>

          <div className="pt-1.5 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 block mb-0.5">Primary Hazard Driver:</span>
            <span className="text-rose-300 font-sans font-semibold">{data.primaryRiskDriver}</span>
          </div>

          <div className="text-[10px] text-slate-500 pt-0.5">
            Highest Risk Zone: <span className="text-cyan-400 font-mono">{data.highestRiskZone}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="prognostic-forecast-panel" className={`bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Prognostic Forecast: 24–48h Workforce Health Risk Projections
            </h3>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-xs font-mono text-cyan-400">Temporal Autoencoder Simulation</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projects potential workforce health risks 24 to 48 hours ahead using simulated physiological trend data, circadian oscillations, and predictive meteorological forecasts.
          </p>
        </div>

        {/* Horizon, Scenario & Comparison Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Comparison Mode Toggle */}
          <button
            onClick={() => setIsCompareMode((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer border ${
              isCompareMode
                ? 'bg-gradient-to-r from-cyan-600 to-rose-600 text-white border-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Toggle between single zone focus and comparative dual-zone health impact projections"
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>{isCompareMode ? 'Comparison Mode Active' : 'Compare Zones'}</span>
          </button>

          {/* Horizon Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setHorizon('24H')}
              className={`px-3 py-1 rounded-md font-mono text-xs transition cursor-pointer ${
                horizon === '24H'
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24h Horizon
            </button>
            <button
              onClick={() => setHorizon('48H')}
              className={`px-3 py-1 rounded-md font-mono text-xs transition cursor-pointer ${
                horizon === '48H'
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              48h Horizon
            </button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['BASELINE', 'HEAT_SURGE', 'MITIGATED'] as const).map((sc) => (
              <button
                key={sc}
                onClick={() => setScenario(sc)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  scenario === sc
                    ? sc === 'HEAT_SURGE'
                      ? 'bg-rose-950 text-rose-300 font-bold border border-rose-600'
                      : sc === 'MITIGATED'
                      ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600'
                      : 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc === 'BASELINE' ? 'Baseline' : sc === 'HEAT_SURGE' ? 'Heat Surge (+4°C)' : 'Mitigated (-35%)'}
              </button>
            ))}
          </div>

          {/* Pre-Emptive Mitigation Quick Trigger */}
          <button
            onClick={handleDeployPreemptiveAction}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
            title="Deploy pre-emptive countermeasures ahead of forecasted peak risk window"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Deploy Pre-Emptive Protocols</span>
          </button>
        </div>
      </div>

      {/* Comparison Tool Bar (Shown when isCompareMode is active) */}
      {isCompareMode && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-cyan-800/60 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <GitCompare className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                Comparative Facility Zone Pair:
              </span>
            </div>

            {/* Quick Preset Pairs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Presets:</span>
              <button
                onClick={() => {
                  setZoneAId('Outdoor-Construction-Sector-4');
                  setZoneBId('Warehouse-Logistics-Hub-North');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
              >
                Outdoor Sector 4 vs Logistics Hub
              </button>
              <button
                onClick={() => {
                  setZoneAId('Manufacturing-Assembly-Line-B');
                  setZoneBId('Subgrade-Tunnel-Conduit-7');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
              >
                Assembly Line B vs Tunnel Conduit 7
              </button>
              <button
                onClick={() => {
                  setZoneAId('Outdoor-Construction-Sector-4');
                  setZoneBId('Smelting-Metal-Foundry');
                }}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono transition cursor-pointer"
              >
                Sector 4 vs Smelting Foundry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Zone A Selector */}
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-600/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-cyan-400 font-bold uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
                  <span>Zone A (Baseline Reference)</span>
                </span>
                <span className="font-mono text-cyan-200 text-xs font-bold">
                  Peak Risk: {forecastMetrics.peakA}%
                </span>
              </div>
              <select
                value={zoneAId}
                onChange={(e) => setZoneAId(e.target.value)}
                className="w-full bg-slate-900 border border-cyan-700 rounded-md py-1.5 px-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (Heat Index: {z.heatIndex}°C)
                  </option>
                ))}
              </select>
            </div>

            {/* Zone B Selector */}
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-600/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-rose-400 font-bold uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
                  <span>Zone B (Comparative Target)</span>
                </span>
                <span className="font-mono text-rose-200 text-xs font-bold">
                  Peak Risk: {forecastMetrics.peakB}%
                </span>
              </div>
              <select
                value={zoneBId}
                onChange={(e) => setZoneBId(e.target.value)}
                className="w-full bg-slate-900 border border-rose-700 rounded-md py-1.5 px-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-rose-400"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (Heat Index: {z.heatIndex}°C)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {mitigationNotice && (
        <div className="my-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{mitigationNotice}</span>
          </div>
          <button
            onClick={() => setMitigationNotice(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Comparative Impact Overview Metrics */}
      {isCompareMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Peak Risk Divergence</div>
            <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
              Δ {Math.abs(forecastMetrics.deltaPeak)}% Risk Score
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {forecastMetrics.deltaPeak >= 0
                ? `${zoneAObj?.name.split('-')[0]} is higher`
                : `${zoneBObj?.name.split('-')[0]} is higher`}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Zone A 48h Events</div>
            <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
              ~{forecastMetrics.totalEventsA} Anomalies
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {forecastMetrics.highRiskHoursA}h in high risk tier (≥50%)
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Zone B 48h Events</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
              ~{forecastMetrics.totalEventsB} Anomalies
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {forecastMetrics.highRiskHoursB}h in high risk tier (≥50%)
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Resource Priority Allocation</div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
              {forecastMetrics.peakA >= forecastMetrics.peakB ? '70% Zone A' : '65% Zone B'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Cooling & hydration priority
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Peak Risk Velocity Window</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
              {forecastMetrics.peakTime}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Projected Peak: <span className="font-mono text-rose-300 font-bold">{forecastMetrics.peakScore}%</span> risk
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Projected Anomaly Volume</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              ~{forecastMetrics.totalSimulatedEvents} events
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Over {horizon === '24H' ? '24' : '48'}h simulated window
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">High-Risk Exposure Hours</div>
            <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
              {forecastMetrics.highRiskHours} Hours <span className="text-xs font-normal text-slate-400">({(forecastMetrics.highRiskHours / (horizon === '24H' ? 24 : 48) * 100).toFixed(0)}%)</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Periods with risk score ≥ 50%
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Vulnerable Primary Zone</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5 truncate">
              {forecastMetrics.peakZone.replace(/-/g, ' ')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Primary: {forecastMetrics.peakDriver}
            </div>
          </div>
        </div>
      )}

      {/* Main Recharts Prognostic Projection Canvas */}
      <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="text-xs text-slate-400">
            {isCompareMode ? (
              <span>
                Comparative Projection: <strong className="text-cyan-400 font-mono">{zoneAObj?.name}</strong> vs <strong className="text-rose-400 font-mono">{zoneBObj?.name}</strong>
              </span>
            ) : (
              <span>
                Trajectory Progression (<span className="text-cyan-400 font-semibold font-mono">Simulated Health Risk %</span> with 95% Confidence Bounds & <span className="text-amber-400 font-semibold font-mono">Predicted Anomaly Count</span>)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
            {isCompareMode ? (
              <>
                <span className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-3 bg-cyan-400"></span>
                  <span className="text-cyan-300">Zone A: {zoneAObj?.name.split('-')[0]}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-3 bg-rose-400"></span>
                  <span className="text-rose-300">Zone B: {zoneBObj?.name.split('-')[0]}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-3 bg-amber-500 border-dashed"></span>
                  <span>Critical (75%)</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-3 bg-cyan-400"></span>
                  <span>Projected Risk Score</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-3 bg-indigo-500/30 border border-indigo-400/40"></span>
                  <span>95% Confidence Band</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-3 bg-rose-500 border-dashed"></span>
                  <span>OSHA Critical (75%)</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecastData}
              margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedPointOffset(e.activePayload[0].payload.timeOffset);
                }
              }}
            >
              <defs>
                <linearGradient id="prognosticRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="prognosticConfidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              />

              <YAxis
                yAxisId="risk"
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit="%"
              />

              {!isCompareMode && (
                <YAxis
                  yAxisId="anomalies"
                  orientation="right"
                  domain={[0, 8]}
                  stroke="#64748b"
                  tick={{ fill: '#f59e0b', fontSize: 10, fontFamily: 'monospace' }}
                />
              )}

              <Tooltip content={<CustomForecastTooltip />} />

              {/* Reference Threshold Lines */}
              <ReferenceLine
                yAxisId="risk"
                y={75}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: 'CRITICAL (75%)', fill: '#f43f5e', fontSize: 9, position: 'insideTopLeft' }}
              />
              <ReferenceLine
                yAxisId="risk"
                y={50}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'WARNING (50%)', fill: '#f59e0b', fontSize: 9, position: 'insideTopLeft' }}
              />

              {isCompareMode ? (
                <>
                  {/* Zone A Trajectory */}
                  <Line
                    yAxisId="risk"
                    type="monotone"
                    dataKey="projectedRiskScoreA"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                    name={`Zone A: ${zoneAObj?.name}`}
                  />

                  {/* Zone B Trajectory */}
                  <Line
                    yAxisId="risk"
                    type="monotone"
                    dataKey="projectedRiskScoreB"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#fb7185', stroke: '#ffffff', strokeWidth: 2 }}
                    name={`Zone B: ${zoneBObj?.name}`}
                  />
                </>
              ) : (
                <>
                  {/* 95% Confidence Interval Upper Bound Area */}
                  <Area
                    yAxisId="risk"
                    type="monotone"
                    dataKey="upperConfidenceBound"
                    stroke="#6366f1"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    fill="url(#prognosticConfidenceBand)"
                    name="Upper Bound (95% CI)"
                  />

                  {/* Simulated Anomaly Count Bars */}
                  <Bar
                    yAxisId="anomalies"
                    dataKey="simulatedAnomalyCount"
                    fill="#f59e0b"
                    opacity={0.35}
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    name="Simulated Anomalies"
                  />

                  {/* Primary Projected Risk Line */}
                  <Line
                    yAxisId="risk"
                    type="monotone"
                    dataKey="projectedRiskScore"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                    name="Projected Risk"
                  />

                  {/* Lower Bound for visual enclosure */}
                  <Line
                    yAxisId="risk"
                    type="monotone"
                    dataKey="lowerConfidenceBound"
                    stroke="#4f46e5"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Lower Bound"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Time Horizon Deep Dive Inspector */}
      {activeInspectionPoint && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-bold uppercase font-mono tracking-wider">Inspected Window:</span>
              <span className="text-white font-bold">{activeInspectionPoint.timeLabel}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300 font-semibold">{activeInspectionPoint.shiftLabel}</span>
              <span className="text-slate-600">·</span>
              {isCompareMode ? (
                <span className="font-mono text-cyan-300 font-bold">
                  Zone A: {activeInspectionPoint.projectedRiskScoreA}% vs Zone B: {activeInspectionPoint.projectedRiskScoreB}% (Δ {activeInspectionPoint.deltaRisk}%)
                </span>
              ) : (
                <span className={`font-mono font-bold ${
                  activeInspectionPoint.tier === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {activeInspectionPoint.projectedRiskScore}% Risk
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Hazard Vector: <strong className="text-rose-300">{activeInspectionPoint.primaryRiskDriver}</strong>. Highest vulnerability anticipated in <span className="font-mono text-cyan-400">{activeInspectionPoint.highestRiskZone}</span> (~{activeInspectionPoint.simulatedAnomalyCount} expected events).
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDeployPreemptiveAction}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Stage Protocol for This Shift</span>
            </button>
          </div>
        </div>
      )}

      {/* Zone-by-Zone 24-48h Prognostic Outlook Grid */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Facility Zone-by-Zone 24h & 48h Prognostic Risk Trajectories
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {zones.length} Monitored Zones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((zone) => {
            // Calculate simulated 24h & 48h projections for this specific zone
            const isSector4 = zone.id.includes('Sector-4');
            const isFoundry = zone.id.includes('Foundry') || zone.id.includes('Smelting');
            const isTunnel = zone.id.includes('Tunnel');

            const baseScore = isSector4 ? 78 : isFoundry ? 68 : isTunnel ? 55 : 32;
            const mult = scenario === 'HEAT_SURGE' ? 1.25 : scenario === 'MITIGATED' ? 0.7 : 1.0;

            const proj24 = Math.min(95, Math.round(baseScore * mult));
            const proj48 = Math.min(98, Math.round((baseScore + 4) * mult));

            const isRising = proj48 > proj24;

            return (
              <div
                key={zone.id}
                onClick={() => {
                  if (onSelectZone) onSelectZone(zone.id);
                  if (isCompareMode) {
                    setZoneBId(zone.id);
                  }
                }}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-xs truncate max-w-[170px]">
                      {zone.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{zone.id}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-white">{proj48}%</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
                      <span>48h</span>
                      {isRising ? (
                        <span className="text-rose-400">↑</span>
                      ) : (
                        <span className="text-emerald-400">↓</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>24h: {proj24}%</span>
                    <span>48h: {proj48}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        proj48 >= 75
                          ? 'bg-rose-500'
                          : proj48 >= 50
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${proj48}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

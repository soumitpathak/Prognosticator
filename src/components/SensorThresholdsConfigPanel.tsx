import React, { useState, useMemo } from 'react';
import { HealthSignalNotificationThresholds, FacilityZone, TelemetryDataPoint } from '../types';
import {
  Sliders,
  Heart,
  Thermometer,
  Sun,
  Volume2,
  ShieldAlert,
  Activity,
  CheckCircle2,
  RotateCcw,
  Save,
  AlertTriangle,
  Zap,
  TrendingDown,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LineChart,
  Radio,
  VolumeX,
  Bell
} from 'lucide-react';
import { DEFAULT_HEALTH_THRESHOLDS } from './HealthThresholdsConfigModal';

export interface SensorThresholdsConfigPanelProps {
  thresholds: HealthSignalNotificationThresholds;
  onUpdateThresholds: (newThresholds: HealthSignalNotificationThresholds, justification: string) => void;
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  telemetryStream: TelemetryDataPoint[];
  onOpenAdvancedModal?: () => void;
  onScrollToChart?: () => void;
}

export default function SensorThresholdsConfigPanel({
  thresholds,
  onUpdateThresholds,
  zones,
  selectedZoneId,
  onSelectZone,
  telemetryStream,
  onOpenAdvancedModal,
  onScrollToChart
}: SensorThresholdsConfigPanelProps) {
  const [localValues, setLocalValues] = useState<HealthSignalNotificationThresholds>(thresholds);
  const [justification, setJustification] = useState<string>('Standard workforce safety baseline recalibration.');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'CARDIO_THERMAL' | 'ENVIRONMENTAL' | 'CHANNELS'>('CARDIO_THERMAL');

  // Keep local values in sync when external thresholds change
  React.useEffect(() => {
    setLocalValues(thresholds);
  }, [thresholds]);

  // Compute live breach counts against current local threshold values in the 24h stream
  const breachMetrics = useMemo(() => {
    let hrBreaches = 0;
    let ambientBreaches = 0;
    let hrvBreaches = 0;
    let skinBreaches = 0;
    let noiseBreaches = 0;
    let riskBreaches = 0;
    let totalBreaches = 0;

    const maxHr = localValues.maxHeartRateBpm ?? 115;
    const maxAmb = localValues.maxAmbientHeatC;
    const minHrv = localValues.minHrvMs;
    const maxSkin = localValues.maxSkinTempC;
    const maxNoise = localValues.maxNoiseDb;
    const maxRisk = localValues.riskScoreCutoffPct;

    telemetryStream.forEach((pt) => {
      const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
      const isHr = hr >= maxHr;
      const isAmb = pt.ambient_temp_c >= maxAmb;
      const isHrv = pt.smoothed_hrv <= minHrv;
      const isSkin = pt.skin_temp_c >= maxSkin;
      const isNoise = (pt.noise_db ?? pt.raw_noise_db ?? 0) >= maxNoise;
      const isRisk = pt.risk_score >= maxRisk;

      if (isHr) hrBreaches++;
      if (isAmb) ambientBreaches++;
      if (isHrv) hrvBreaches++;
      if (isSkin) skinBreaches++;
      if (isNoise) noiseBreaches++;
      if (isRisk) riskBreaches++;

      if (isHr || isAmb || isHrv || isSkin || isNoise || isRisk || pt.is_anomaly) {
        totalBreaches++;
      }
    });

    return {
      hrBreaches,
      ambientBreaches,
      hrvBreaches,
      skinBreaches,
      noiseBreaches,
      riskBreaches,
      totalBreaches,
      totalSamples: telemetryStream.length
    };
  }, [telemetryStream, localValues]);

  const handleApply = () => {
    onUpdateThresholds(localValues, justification);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };

  const handleReset = () => {
    setLocalValues(DEFAULT_HEALTH_THRESHOLDS);
    setJustification('Reset to default OSHA/ISO safety thresholds.');
    onUpdateThresholds(DEFAULT_HEALTH_THRESHOLDS, 'Reset to default OSHA/ISO safety thresholds.');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };

  const applyPreset = (preset: 'OSHA_STANDARD' | 'HEATWAVE' | 'ACOUSTIC_HEAVY' | 'INDOOR_CLEAN') => {
    let updated: HealthSignalNotificationThresholds;
    let note = '';

    switch (preset) {
      case 'HEATWAVE':
        updated = {
          ...localValues,
          maxAmbientHeatC: 34.0,
          maxHeartRateBpm: 110,
          minHrvMs: 46,
          maxHrvDropPct: 20,
          maxSkinTempC: 37.4,
          maxNoiseDb: 85.0,
          minTwlIndex: 125,
          riskScoreCutoffPct: 55
        };
        note = 'Applied Extreme Solar Heatwave Protocol (tightened thermal & cardiovascular baselines).';
        break;

      case 'ACOUSTIC_HEAVY':
        updated = {
          ...localValues,
          maxAmbientHeatC: 36.0,
          maxHeartRateBpm: 115,
          minHrvMs: 42,
          maxHrvDropPct: 25,
          maxSkinTempC: 37.8,
          maxNoiseDb: 80.0,
          minTwlIndex: 115,
          riskScoreCutoffPct: 60
        };
        note = 'Applied Heavy Acoustic & Mechanical Machinery Protection Baseline.';
        break;

      case 'INDOOR_CLEAN':
        updated = {
          ...localValues,
          maxAmbientHeatC: 30.0,
          maxHeartRateBpm: 105,
          minHrvMs: 50,
          maxHrvDropPct: 18,
          maxSkinTempC: 37.2,
          maxNoiseDb: 75.0,
          minTwlIndex: 130,
          riskScoreCutoffPct: 50
        };
        note = 'Applied Controlled Indoor Precision Assembly Baseline.';
        break;

      case 'OSHA_STANDARD':
      default:
        updated = {
          ...localValues,
          maxAmbientHeatC: 36.0,
          maxHeartRateBpm: 115,
          minHrvMs: 40,
          maxHrvDropPct: 25,
          maxSkinTempC: 37.8,
          maxNoiseDb: 85.0,
          minTwlIndex: 115,
          riskScoreCutoffPct: 65
        };
        note = 'Applied OSHA Standard & ISO 10816 Baseline Thresholds.';
        break;
    }

    setLocalValues(updated);
    setJustification(note);
    onUpdateThresholds(updated, note);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };

  return (
    <div id="sensor-thresholds-config-panel" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6 transition-all">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 rounded-xl shadow-xs shrink-0">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Custom Sensor Signal Alert Thresholds
              </h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Live Recharts Coupling
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define custom trigger limits for cardiovascular strain (Heart Rate, HRV) and microclimate hazards (Ambient Temp, Skin Temp, Noise).
            </p>
          </div>
        </div>

        {/* Live Breach Stats Badge & Expand Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-950/80 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">24h Breaches:</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
              breachMetrics.totalBreaches > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {breachMetrics.totalBreaches} / {breachMetrics.totalSamples} intervals
            </span>
          </div>

          {onScrollToChart && (
            <button
              onClick={onScrollToChart}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
              title="Jump to 24h Historical Anomaly Trends Recharts visualization"
            >
              <LineChart className="h-3.5 w-3.5 text-cyan-400" />
              <span>View 24h Chart</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <span>{isExpanded ? 'Collapse' : 'Configure'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Preset Quick-Selector Bar & Scope */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium flex items-center mr-1">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-cyan-400" /> Operational Presets:
              </span>
              <button
                onClick={() => applyPreset('OSHA_STANDARD')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition text-xs"
              >
                OSHA Industrial
              </button>
              <button
                onClick={() => applyPreset('HEATWAVE')}
                className="px-2.5 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 font-semibold transition text-xs"
              >
                Heatwave Protocol
              </button>
              <button
                onClick={() => applyPreset('ACOUSTIC_HEAVY')}
                className="px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 font-semibold transition text-xs"
              >
                Acoustic / Machinery
              </button>
              <button
                onClick={() => applyPreset('INDOOR_CLEAN')}
                className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 font-semibold transition text-xs"
              >
                Indoor Controlled
              </button>
            </div>

            {/* Scope Selection */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Applicable Scope:</span>
              <select
                value={localValues.applicableZoneId}
                onChange={(e) => {
                  const newScope = e.target.value;
                  setLocalValues({ ...localValues, applicableZoneId: newScope });
                  if (newScope !== 'ALL') {
                    onSelectZone(newScope);
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">Global (All Facility Zones)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (N={z.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('CARDIO_THERMAL')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'CARDIO_THERMAL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span>Cardiovascular &amp; Core Thermal (Heart Rate, Temp, HRV)</span>
            </button>
            <button
              onClick={() => setActiveTab('ENVIRONMENTAL')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ENVIRONMENTAL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Microclimate &amp; Acoustics (Noise, TWL, Risk Score)</span>
            </button>
            <button
              onClick={() => setActiveTab('CHANNELS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'CHANNELS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="h-3.5 w-3.5 text-indigo-400" />
              <span>Dispatch Channels &amp; Automation</span>
            </button>
          </div>

          {/* Main Threshold Sliders Grid */}
          {activeTab === 'CARDIO_THERMAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Heart Rate Ceiling (bpm) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-rose-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-400">
                        <Heart className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Heart Rate Ceiling</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      {localValues.maxHeartRateBpm ?? 115} BPM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Maximum sustained worker heart rate. Triggers tachycardia and autonomic strain protocols.
                  </p>
                  <input
                    type="range"
                    min="80"
                    max="160"
                    step="1"
                    value={localValues.maxHeartRateBpm ?? 115}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, maxHeartRateBpm: Number(e.target.value) })
                    }
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>80 BPM</span>
                    <span>OSHA: 115 BPM</span>
                    <span>160 BPM</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.hrBreaches > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                  }`}>
                    {breachMetrics.hrBreaches} intervals
                  </span>
                </div>
              </div>

              {/* 2. Ambient Temperature Ceiling (°C) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
                        <Sun className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Ambient Temp Ceiling</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {localValues.maxAmbientHeatC.toFixed(1)}°C
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Ambient facility microclimate limit. Adjusts wet-bulb thermal work baseline.
                  </p>
                  <input
                    type="range"
                    min="25"
                    max="48"
                    step="0.5"
                    value={localValues.maxAmbientHeatC}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, maxAmbientHeatC: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>25.0°C</span>
                    <span>OSHA: 36.0°C</span>
                    <span>48.0°C</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.ambientBreaches > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'
                  }`}>
                    {breachMetrics.ambientBreaches} intervals
                  </span>
                </div>
              </div>

              {/* 3. Heart Rate Variability (HRV Floor ms) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">HRV Floor (Parasympathetic)</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {localValues.minHrvMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Minimum acceptable HRV RMSSD. Sudden collapse below this floor indicates autonomic fatigue.
                  </p>
                  <input
                    type="range"
                    min="25"
                    max="65"
                    step="1"
                    value={localValues.minHrvMs}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, minHrvMs: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>25 ms</span>
                    <span>Standard: 40 ms</span>
                    <span>65 ms</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.hrvBreaches > 0 ? 'text-cyan-400 font-bold' : 'text-emerald-400'
                  }`}>
                    {breachMetrics.hrvBreaches} intervals
                  </span>
                </div>
              </div>

              {/* 4. Worker Core / Skin Temperature Ceiling (°C) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-red-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-red-950/60 border border-red-500/40 rounded-lg text-red-400">
                        <Thermometer className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Skin Temp Ceiling</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                      {localValues.maxSkinTempC.toFixed(1)}°C
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Maximum core/cutaneous temperature before heat stroke and syncope intervention.
                  </p>
                  <input
                    type="range"
                    min="36.0"
                    max="39.5"
                    step="0.1"
                    value={localValues.maxSkinTempC}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, maxSkinTempC: Number(e.target.value) })
                    }
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>36.0°C</span>
                    <span>Clinical: 37.8°C</span>
                    <span>39.5°C</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.skinBreaches > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'
                  }`}>
                    {breachMetrics.skinBreaches} intervals
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ENVIRONMENTAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 5. Acoustic Noise Ceiling (dBA) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg text-indigo-400">
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Noise Ceiling (dBA)</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                      {localValues.maxNoiseDb.toFixed(1)} dBA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Permissible Exposure Limit for industrial sound pressure levels (OSHA 8-hour TWA).
                  </p>
                  <input
                    type="range"
                    min="70"
                    max="105"
                    step="1"
                    value={localValues.maxNoiseDb}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, maxNoiseDb: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>70 dBA</span>
                    <span>OSHA: 85 dBA</span>
                    <span>105 dBA</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.noiseBreaches > 0 ? 'text-indigo-400 font-bold' : 'text-emerald-400'
                  }`}>
                    {breachMetrics.noiseBreaches} intervals
                  </span>
                </div>
              </div>

              {/* 6. Composite Anomaly Risk Cutoff (%) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Risk Score Cutoff</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {localValues.riskScoreCutoffPct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Multivariate LSTM Autoencoder reconstruction error threshold for incident escalation.
                  </p>
                  <input
                    type="range"
                    min="35"
                    max="85"
                    step="1"
                    value={localValues.riskScoreCutoffPct}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, riskScoreCutoffPct: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>35%</span>
                    <span>Threshold: 65%</span>
                    <span>85%</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">24h Breaches:</span>
                  <span className={`font-mono font-semibold ${
                    breachMetrics.riskBreaches > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}>
                    {breachMetrics.riskBreaches} intervals
                  </span>
                </div>
              </div>

              {/* 7. Max HRV Drop Percentage (%) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Max HRV Drop %</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {localValues.maxHrvDropPct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Maximum percentage decrease from cohort baseline before acute cardiac fatigue trigger.
                  </p>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="1"
                    value={localValues.maxHrvDropPct}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, maxHrvDropPct: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>10%</span>
                    <span>Standard: 25%</span>
                    <span>45%</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Status:</span>
                  <span className="text-cyan-400 font-mono font-semibold">Active Filter</span>
                </div>
              </div>

              {/* 8. Minimum Thermal Work Limit (TWL) */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl transition shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Minimum TWL Floor</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {localValues.minTwlIndex} W/m²
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Thermal Work Limit safe metabolic work floor. Lower values denote hazardous heat strain.
                  </p>
                  <input
                    type="range"
                    min="85"
                    max="160"
                    step="5"
                    value={localValues.minTwlIndex}
                    onChange={(e) =>
                      setLocalValues({ ...localValues, minTwlIndex: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>85 W/m²</span>
                    <span>Safe: 115 W/m²</span>
                    <span>160 W/m²</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">ISO 7243:</span>
                  <span className="text-amber-400 font-mono font-semibold">Heat Stress Validated</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CHANNELS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-cyan-500/40 transition">
                <input
                  type="checkbox"
                  checked={localValues.enableSmsRadioDispatch}
                  onChange={(e) =>
                    setLocalValues({ ...localValues, enableSmsRadioDispatch: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Automated Medical Dispatch Queue</span>
                  <span className="text-[11px] text-slate-400">
                    Auto-stage dual-channel UHF Radio &amp; SMS dispatch whenever thresholds are breached.
                  </span>
                </div>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-cyan-500/40 transition">
                <input
                  type="checkbox"
                  checked={localValues.enableVoiceAlerts}
                  onChange={(e) =>
                    setLocalValues({ ...localValues, enableVoiceAlerts: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Audible Text-to-Speech Chime</span>
                  <span className="text-[11px] text-slate-400">
                    Play synthesized speech announcements on on-site supervisory terminal speakers.
                  </span>
                </div>
              </label>

              <label className="flex items-center space-x-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-cyan-500/40 transition">
                <input
                  type="checkbox"
                  checked={localValues.enableInAppBeacon}
                  onChange={(e) =>
                    setLocalValues({ ...localValues, enableInAppBeacon: e.target.checked })
                  }
                  className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Floor Plan Pulse Beacons</span>
                  <span className="text-[11px] text-slate-400">
                    Flash red visual warning beacons over breaching sector in the 2D layout.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Justification & Save / Reset Controls */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-auto flex-1 flex items-center space-x-2">
              <span className="text-xs text-slate-400 whitespace-nowrap font-medium">Audit Trail Note:</span>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Required justification reason for audit log..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              {isSavedNotice && (
                <span className="text-xs text-emerald-400 flex items-center font-medium animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" />
                  Thresholds Applied &amp; Recharts Synced!
                </span>
              )}

              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={handleApply}
                className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md shadow-cyan-900/30 transition"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Apply Thresholds</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

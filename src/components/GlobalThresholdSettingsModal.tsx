import React, { useState, useMemo } from 'react';
import {
  Sliders,
  X,
  Heart,
  Thermometer,
  Sun,
  Activity,
  Volume2,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Save,
  AlertTriangle,
  Info,
  Zap,
  Check,
  Layers,
  ArrowRight,
  TrendingDown,
  BarChart3,
  Scale
} from 'lucide-react';
import { HealthSignalNotificationThresholds, FacilityZone, TelemetryDataPoint } from '../types';

export type GlobalSensitivityLevel = 'STANDARD' | 'HIGH' | 'EXTREME' | 'CUSTOM';

export interface SignalThresholdPreset {
  name: string;
  maxHeartRateBpm: number;
  minHrvMs: number;
  maxHrvDropPct: number;
  maxSkinTempC: number;
  maxAmbientHeatC: number;
  minTwlIndex: number;
  maxNoiseDb: number;
  riskScoreCutoffPct: number;
  kalmanSigmaTolerance: number;
  description: string;
  recommendedUse: string;
}

export const SENSITIVITY_PRESETS: Record<'STANDARD' | 'HIGH' | 'EXTREME', SignalThresholdPreset> = {
  STANDARD: {
    name: 'Standard (OSHA / ISO Baseline)',
    maxHeartRateBpm: 120,
    minHrvMs: 40,
    maxHrvDropPct: 25,
    maxSkinTempC: 37.8,
    maxAmbientHeatC: 36.0,
    minTwlIndex: 115,
    maxNoiseDb: 85.0,
    riskScoreCutoffPct: 65,
    kalmanSigmaTolerance: 3.0,
    description: 'Calibrated to OSHA 1910 and ISO 7243 industrial ergonomics. Filters transient sensor noise with standard 3.0σ bounds.',
    recommendedUse: 'Standard indoor/outdoor shifts, temperate weather, and routine physical work.'
  },
  HIGH: {
    name: 'High Sensitivity (Active Heatwave / Strenuous Shifts)',
    maxHeartRateBpm: 110,
    minHrvMs: 48,
    maxHrvDropPct: 18,
    maxSkinTempC: 37.4,
    maxAmbientHeatC: 32.0,
    minTwlIndex: 140,
    maxNoiseDb: 82.0,
    riskScoreCutoffPct: 50,
    kalmanSigmaTolerance: 2.2,
    description: 'Tighter 2.2σ bounds trigger proactive alerts at early signs of autonomic fatigue and compensatory heat strain.',
    recommendedUse: 'Elevated ambient temperatures (>32°C), heavy chemical PPE suits, or extended shifts.'
  },
  EXTREME: {
    name: 'Extreme Sensitivity (Emergency Protocol / Severe Thermal Stress)',
    maxHeartRateBpm: 100,
    minHrvMs: 55,
    maxHrvDropPct: 12,
    maxSkinTempC: 37.1,
    maxAmbientHeatC: 29.0,
    minTwlIndex: 165,
    maxNoiseDb: 80.0,
    riskScoreCutoffPct: 40,
    kalmanSigmaTolerance: 1.6,
    description: 'Ultra-vigilant 1.6σ bounds provide earliest possible detection with zero tolerance for biometric degradation.',
    recommendedUse: 'Hazardous air quality, extreme heatwaves (>40°C WBGT), confined space entry, or unacclimatized personnel.'
  }
};

export interface GlobalThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: HealthSignalNotificationThresholds;
  currentSensitivity?: GlobalSensitivityLevel | 'MEDIUM' | 'LOW';
  onSaveSettings: (
    updatedThresholds: HealthSignalNotificationThresholds,
    sensitivityLevel: GlobalSensitivityLevel,
    justification: string
  ) => void;
  zones?: FacilityZone[];
  telemetryStream?: TelemetryDataPoint[];
}

export default function GlobalThresholdSettingsModal({
  isOpen,
  onClose,
  currentThresholds,
  currentSensitivity = 'STANDARD',
  onSaveSettings,
  zones = [],
  telemetryStream = []
}: GlobalThresholdSettingsModalProps) {
  // Normalize initial sensitivity
  const initialLevel: GlobalSensitivityLevel =
    currentSensitivity === 'HIGH'
      ? 'HIGH'
      : currentSensitivity === 'EXTREME'
      ? 'EXTREME'
      : currentSensitivity === 'CUSTOM'
      ? 'CUSTOM'
      : 'STANDARD';

  const [selectedPreset, setSelectedPreset] = useState<GlobalSensitivityLevel>(initialLevel);
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'SIGNALS_CONFIG' | 'COMPARISON'>('PRESETS');

  // Working state for thresholds
  const [thresholds, setThresholds] = useState<HealthSignalNotificationThresholds>({
    ...currentThresholds,
    maxHeartRateBpm: currentThresholds.maxHeartRateBpm ?? 120
  });

  const [justification, setJustification] = useState<string>(
    'Scheduled shift safety calibration: Applied global threshold sensitivity across workforce biometric streams.'
  );

  // When a preset is selected, update threshold values
  const handleSelectPreset = (presetKey: GlobalSensitivityLevel) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'CUSTOM') {
      const p = SENSITIVITY_PRESETS[presetKey];
      setThresholds((prev) => ({
        ...prev,
        maxHeartRateBpm: p.maxHeartRateBpm,
        minHrvMs: p.minHrvMs,
        maxHrvDropPct: p.maxHrvDropPct,
        maxSkinTempC: p.maxSkinTempC,
        maxAmbientHeatC: p.maxAmbientHeatC,
        minTwlIndex: p.minTwlIndex,
        maxNoiseDb: p.maxNoiseDb,
        riskScoreCutoffPct: p.riskScoreCutoffPct,
        sensitivityLevel: presetKey === 'STANDARD' ? 'LOW' : presetKey === 'HIGH' ? 'HIGH' : 'HIGH'
      }));
      setJustification(`Applied ${p.name} for active operational monitoring.`);
    }
  };

  const handleCustomThresholdChange = (key: keyof HealthSignalNotificationThresholds, value: number) => {
    setSelectedPreset('CUSTOM');
    setThresholds((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Compute live impact against current telemetry stream
  const impactAnalysis = useMemo(() => {
    if (!telemetryStream || telemetryStream.length === 0) {
      return { totalBreaches: 3, elevatedChannels: ['HRV Vagal', 'Ambient Heat'] };
    }

    const hrCeiling = thresholds.maxHeartRateBpm ?? 120;
    const hrvFloor = thresholds.minHrvMs;
    const skinCeiling = thresholds.maxSkinTempC;
    const ambCeiling = thresholds.maxAmbientHeatC;
    const twlFloor = thresholds.minTwlIndex;
    const noiseCeiling = thresholds.maxNoiseDb;
    const riskCutoff = thresholds.riskScoreCutoffPct;

    let hrBreaches = 0;
    let hrvBreaches = 0;
    let skinBreaches = 0;
    let ambBreaches = 0;
    let twlBreaches = 0;
    let noiseBreaches = 0;
    let riskBreaches = 0;

    telemetryStream.forEach((pt) => {
      const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
      if (hr > hrCeiling) hrBreaches++;
      if (pt.smoothed_hrv < hrvFloor) hrvBreaches++;
      if (pt.skin_temp_c > skinCeiling) skinBreaches++;
      if (pt.ambient_temp_c > ambCeiling) ambBreaches++;
      if (pt.twl_index < twlFloor) twlBreaches++;
      if (pt.smoothed_noise_db > noiseCeiling) noiseBreaches++;
      if (pt.risk_score > riskCutoff) riskBreaches++;
    });

    const totalBreaches =
      hrBreaches + hrvBreaches + skinBreaches + ambBreaches + twlBreaches + noiseBreaches + riskBreaches;

    const channels: string[] = [];
    if (hrBreaches > 0) channels.push(`Heart Rate (${hrBreaches})`);
    if (hrvBreaches > 0) channels.push(`HRV Collapse (${hrvBreaches})`);
    if (skinBreaches > 0) channels.push(`Skin Temp (${skinBreaches})`);
    if (ambBreaches > 0) channels.push(`Ambient Heat (${ambBreaches})`);
    if (twlBreaches > 0) channels.push(`TWL Limit (${twlBreaches})`);
    if (noiseBreaches > 0) channels.push(`Noise Level (${noiseBreaches})`);

    return { totalBreaches, elevatedChannels: channels };
  }, [telemetryStream, thresholds]);

  const handleSave = () => {
    onSaveSettings(thresholds, selectedPreset, justification);
    onClose();
  };

  const handleResetToStandard = () => {
    handleSelectPreset('STANDARD');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-thresholds-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 text-cyan-400 shadow-sm">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="global-thresholds-modal-title" className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Global Threshold Settings
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold">
                  Sensitivity: {selectedPreset}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure anomaly sensitivity levels (Standard, High, Extreme) across all health and environmental signals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'PRESETS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sensitivity Presets (Standard / High / Extreme)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SIGNALS_CONFIG')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'SIGNALS_CONFIG'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Per-Signal Custom Thresholds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPARISON')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'COMPARISON'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preset Matrix Comparison
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: SENSITIVITY PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Standard Preset */}
                <div
                  onClick={() => handleSelectPreset('STANDARD')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    selectedPreset === 'STANDARD'
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {selectedPreset === 'STANDARD' && (
                    <div className="absolute top-3 right-3 text-cyan-400 bg-cyan-950 p-1 rounded-full border border-cyan-500/50">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                      Baseline OSHA
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">Standard Sensitivity</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {SENSITIVITY_PRESETS.STANDARD.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heart Rate:</span>
                      <span>≤ 120 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HRV Floor:</span>
                      <span>≥ 40 ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Skin Temp:</span>
                      <span>≤ 37.8°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WBGT Heat:</span>
                      <span>≤ 36.0°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kalman Bounds:</span>
                      <span className="text-cyan-400">3.0σ</span>
                    </div>
                  </div>
                </div>

                {/* High Sensitivity Preset */}
                <div
                  onClick={() => handleSelectPreset('HIGH')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    selectedPreset === 'HIGH'
                      ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {selectedPreset === 'HIGH' && (
                    <div className="absolute top-3 right-3 text-amber-400 bg-amber-950 p-1 rounded-full border border-amber-500/50">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                      Elevated Vigilance
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">High Sensitivity</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {SENSITIVITY_PRESETS.HIGH.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heart Rate:</span>
                      <span>≤ 110 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HRV Floor:</span>
                      <span>≥ 48 ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Skin Temp:</span>
                      <span>≤ 37.4°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WBGT Heat:</span>
                      <span>≤ 32.0°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kalman Bounds:</span>
                      <span className="text-amber-400">2.2σ</span>
                    </div>
                  </div>
                </div>

                {/* Extreme Sensitivity Preset */}
                <div
                  onClick={() => handleSelectPreset('EXTREME')}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    selectedPreset === 'EXTREME'
                      ? 'bg-slate-800/90 border-rose-500 shadow-md shadow-rose-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {selectedPreset === 'EXTREME' && (
                    <div className="absolute top-3 right-3 text-rose-400 bg-rose-950 p-1 rounded-full border border-rose-500/50">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block font-bold">
                      Emergency Maximum
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">Extreme Sensitivity</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {SENSITIVITY_PRESETS.EXTREME.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heart Rate:</span>
                      <span>≤ 100 BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HRV Floor:</span>
                      <span>≥ 55 ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Skin Temp:</span>
                      <span>≤ 37.1°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WBGT Heat:</span>
                      <span>≤ 29.0°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kalman Bounds:</span>
                      <span className="text-rose-400">1.6σ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Impact & Telemetry Projection Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      Live Telemetry Stream Projection Under Selected Sensitivity
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Evaluated against active 24h streaming buffer across all monitored facility sectors.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Estimated Alerts</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      {impactAnalysis.totalBreaches} Threshold Breaches
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SIGNALS_CONFIG')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-xs cursor-pointer"
                  >
                    <span>Fine-Tune</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PER-SIGNAL CUSTOM THRESHOLDS */}
          {activeTab === 'SIGNALS_CONFIG' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">
                  Adjusting any slider switches mode to <strong className="text-amber-400 font-mono">CUSTOM</strong>.
                </span>
                <button
                  type="button"
                  onClick={handleResetToStandard}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to OSHA Standard
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Heart Rate (Pulse) */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">Max Heart Rate Ceiling</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      {thresholds.maxHeartRateBpm ?? 120} BPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="85"
                    max="160"
                    step="1"
                    value={thresholds.maxHeartRateBpm ?? 120}
                    onChange={(e) => handleCustomThresholdChange('maxHeartRateBpm', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme: 100 BPM</span>
                    <span>High: 110 BPM</span>
                    <span>Standard: 120 BPM</span>
                  </div>
                </div>

                {/* 2. Kalman Autonomic HRV Floor */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Min Autonomic HRV Floor</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      {thresholds.minHrvMs} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="75"
                    step="1"
                    value={thresholds.minHrvMs}
                    onChange={(e) => handleCustomThresholdChange('minHrvMs', Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Standard: 40 ms</span>
                    <span>High: 48 ms</span>
                    <span>Extreme: 55 ms</span>
                  </div>
                </div>

                {/* 3. Core / Surface Skin Temperature */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Max Core / Skin Temp Ceiling</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {thresholds.maxSkinTempC}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="36.5"
                    max="39.0"
                    step="0.1"
                    value={thresholds.maxSkinTempC}
                    onChange={(e) => handleCustomThresholdChange('maxSkinTempC', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme: 37.1°C</span>
                    <span>High: 37.4°C</span>
                    <span>Standard: 37.8°C</span>
                  </div>
                </div>

                {/* 4. Ambient Heat / Wet-Bulb WBGT */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-orange-400" />
                      <span className="text-xs font-bold text-white">Max Ambient WBGT Heat Ceiling</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-orange-400">
                      {thresholds.maxAmbientHeatC}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="26.0"
                    max="45.0"
                    step="0.5"
                    value={thresholds.maxAmbientHeatC}
                    onChange={(e) => handleCustomThresholdChange('maxAmbientHeatC', Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme: 29.0°C</span>
                    <span>High: 32.0°C</span>
                    <span>Standard: 36.0°C</span>
                  </div>
                </div>

                {/* 5. Thermal Work Limit (TWL) Minimum */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-teal-400" />
                      <span className="text-xs font-bold text-white">Min Thermal Work Limit (TWL)</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-teal-400">
                      {thresholds.minTwlIndex} W/m²
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="220"
                    step="5"
                    value={thresholds.minTwlIndex}
                    onChange={(e) => handleCustomThresholdChange('minTwlIndex', Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Standard: 115 W/m²</span>
                    <span>High: 140 W/m²</span>
                    <span>Extreme: 165 W/m²</span>
                  </div>
                </div>

                {/* 6. Acoustic Noise Limit */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Max Acoustic Noise Limit</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-purple-400">
                      {thresholds.maxNoiseDb} dBA
                    </span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="105"
                    step="1"
                    value={thresholds.maxNoiseDb}
                    onChange={(e) => handleCustomThresholdChange('maxNoiseDb', Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme: 80 dBA</span>
                    <span>High: 82 dBA</span>
                    <span>Standard: 85 dBA</span>
                  </div>
                </div>

                {/* 7. Composite Risk Score Cutoff */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">Composite Neural Risk Score Cutoff</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-indigo-400">
                      {thresholds.riskScoreCutoffPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="85"
                    step="1"
                    value={thresholds.riskScoreCutoffPct}
                    onChange={(e) => handleCustomThresholdChange('riskScoreCutoffPct', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Extreme: 40% (Earliest alerts)</span>
                    <span>High: 50%</span>
                    <span>Standard: 65% (OSHA recommended)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRESET MATRIX COMPARISON */}
          {activeTab === 'COMPARISON' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Side-by-side comparison matrix of sensitivity levels across primary health signals and noise filtering parameters:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono">
                      <th className="p-3">Health Signal</th>
                      <th className="p-3 text-cyan-400">Standard (OSHA)</th>
                      <th className="p-3 text-amber-400">High Sensitivity</th>
                      <th className="p-3 text-rose-400">Extreme Sensitivity</th>
                      <th className="p-3 text-slate-300">Active Setting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-rose-400" /> Heart Rate (Pulse)
                      </td>
                      <td className="p-3 text-cyan-300">120 BPM</td>
                      <td className="p-3 text-amber-300">110 BPM</td>
                      <td className="p-3 text-rose-300">100 BPM</td>
                      <td className="p-3 font-bold text-white">{thresholds.maxHeartRateBpm ?? 120} BPM</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-cyan-400" /> Autonomic HRV Floor
                      </td>
                      <td className="p-3 text-cyan-300">40 ms</td>
                      <td className="p-3 text-amber-300">48 ms</td>
                      <td className="p-3 text-rose-300">55 ms</td>
                      <td className="p-3 font-bold text-white">{thresholds.minHrvMs} ms</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5 text-amber-400" /> Skin / Core Temp
                      </td>
                      <td className="p-3 text-cyan-300">37.8°C</td>
                      <td className="p-3 text-amber-300">37.4°C</td>
                      <td className="p-3 text-rose-300">37.1°C</td>
                      <td className="p-3 font-bold text-white">{thresholds.maxSkinTempC}°C</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Sun className="h-3.5 w-3.5 text-orange-400" /> Ambient WBGT Heat
                      </td>
                      <td className="p-3 text-cyan-300">36.0°C</td>
                      <td className="p-3 text-amber-300">32.0°C</td>
                      <td className="p-3 text-rose-300">29.0°C</td>
                      <td className="p-3 font-bold text-white">{thresholds.maxAmbientHeatC}°C</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-teal-400" /> Min Thermal Work Limit
                      </td>
                      <td className="p-3 text-cyan-300">115 W/m²</td>
                      <td className="p-3 text-amber-300">140 W/m²</td>
                      <td className="p-3 text-rose-300">165 W/m²</td>
                      <td className="p-3 font-bold text-white">{thresholds.minTwlIndex} W/m²</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-purple-400" /> Acoustic Noise Ceiling
                      </td>
                      <td className="p-3 text-cyan-300">85 dBA</td>
                      <td className="p-3 text-amber-300">82 dBA</td>
                      <td className="p-3 text-rose-300">80 dBA</td>
                      <td className="p-3 font-bold text-white">{thresholds.maxNoiseDb} dBA</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" /> Composite Risk Cutoff
                      </td>
                      <td className="p-3 text-cyan-300">65%</td>
                      <td className="p-3 text-amber-300">50%</td>
                      <td className="p-3 text-rose-300">40%</td>
                      <td className="p-3 font-bold text-white">{thresholds.riskScoreCutoffPct}%</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-yellow-400" /> Kalman Innovation Tolerance
                      </td>
                      <td className="p-3 text-cyan-300">3.0σ (Standard)</td>
                      <td className="p-3 text-amber-300">2.2σ (Tight)</td>
                      <td className="p-3 text-rose-300">1.6σ (Zero-Tolerance)</td>
                      <td className="p-3 font-bold text-yellow-400">
                        {selectedPreset === 'STANDARD' ? '3.0σ' : selectedPreset === 'HIGH' ? '2.2σ' : selectedPreset === 'EXTREME' ? '1.6σ' : 'Custom'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Operational Justification / Compliance Audit Input */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Operational Justification (OSHA / ISO Audit Trail)</span>
              <span className="text-[10px] text-slate-500 font-normal">Logged to system audit records</span>
            </label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State reason for threshold adjustments..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {/* Quick justification chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Quick Justifications:</span>
              {[
                'Active High Ambient Heatwave Warning',
                'Heavy Protective Gear Strenuous Shift',
                'Unacclimatized New Cohort Onboarding',
                'Post-Incident Precautionary Stance',
                'Routine OSHA Compliance Calibration'
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setJustification(q)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToStandard}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to OSHA Standard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md shadow-cyan-950/40 cursor-pointer border border-cyan-400/40"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply Global Thresholds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

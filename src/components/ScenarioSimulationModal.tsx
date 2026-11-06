import React, { useState, useMemo } from 'react';
import {
  Sliders,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Volume2,
  Users,
  Heart,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Info,
  Send,
  Droplets,
  Truck
} from 'lucide-react';
import {
  ScenarioSimulationInputs,
  ScenarioSimulationOutput,
  simulateScenarioAnomaly
} from '../services/lstmAnomalyEngine';
import { FacilityZone, TelemetryPacket } from '../types';

export interface ScenarioSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeZone?: FacilityZone;
  onInjectSimulatedScenario?: (packet: TelemetryPacket, scenarioData: ScenarioSimulationOutput) => void;
  onNotice?: (message: string) => void;
}

const DEFAULT_SCENARIO_INPUTS: ScenarioSimulationInputs = {
  ambientTempC: 38.5,
  relativeHumidityPct: 68,
  noiseLevelDb: 88,
  trafficDensityLevel: 6,
  workerHeartRateBpm: 124,
  hrvMs: 34,
  sleepDeficitHours: 2.5
};

export default function ScenarioSimulationModal({
  isOpen,
  onClose,
  activeZone,
  onInjectSimulatedScenario,
  onNotice
}: ScenarioSimulationModalProps) {
  const [inputs, setInputs] = useState<ScenarioSimulationInputs>(DEFAULT_SCENARIO_INPUTS);
  const [selectedPreset, setSelectedPreset] = useState<string>('CUSTOM');
  const [injectedNotice, setInjectedNotice] = useState<string | null>(null);

  // Compute live LSTM-Kalman engine prediction on every parameter adjustment
  const simulationResult: ScenarioSimulationOutput = useMemo(() => {
    return simulateScenarioAnomaly(inputs);
  }, [inputs]);

  if (!isOpen) return null;

  // Preset Handlers
  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    switch (presetKey) {
      case 'BASELINE_NORMAL':
        setInputs({
          ambientTempC: 24.0,
          relativeHumidityPct: 45,
          noiseLevelDb: 68,
          trafficDensityLevel: 2,
          workerHeartRateBpm: 76,
          hrvMs: 68,
          sleepDeficitHours: 0.0
        });
        break;
      case 'SUMMER_HEATWAVE_HUMIDITY':
        setInputs({
          ambientTempC: 43.5,
          relativeHumidityPct: 82,
          noiseLevelDb: 78,
          trafficDensityLevel: 4,
          workerHeartRateBpm: 138,
          hrvMs: 30,
          sleepDeficitHours: 2.0
        });
        break;
      case 'HIGH_NOISE_TRAFFIC_RUSH':
        setInputs({
          ambientTempC: 32.0,
          relativeHumidityPct: 52,
          noiseLevelDb: 96,
          trafficDensityLevel: 9,
          workerHeartRateBpm: 122,
          hrvMs: 38,
          sleepDeficitHours: 3.5
        });
        break;
      case 'SUBGRADE_TUNNEL_SURGE':
        setInputs({
          ambientTempC: 39.0,
          relativeHumidityPct: 90,
          noiseLevelDb: 94,
          trafficDensityLevel: 8,
          workerHeartRateBpm: 145,
          hrvMs: 25,
          sleepDeficitHours: 4.5
        });
        break;
      default:
        break;
    }
  };

  const handleSliderChange = <K extends keyof ScenarioSimulationInputs>(key: K, value: number) => {
    setSelectedPreset('CUSTOM');
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetToBaseline = () => {
    handleApplyPreset('BASELINE_NORMAL');
  };

  const handleInjectToLiveStream = () => {
    if (!onInjectSimulatedScenario) return;

    // Generate telemetry packet representing this simulated state
    const zoneName = activeZone?.name || 'Outdoor Construction Sector 4';
    const zoneId = activeZone?.id || 'Outdoor-Construction-Sector-4';

    const packet: TelemetryPacket = {
      worker_id: `SIM-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      location_zone: zoneId,
      timestamp: new Date().toISOString(),
      hrv_series: [inputs.hrvMs + 2, inputs.hrvMs - 1, inputs.hrvMs],
      skin_temp_series: [36.8, 37.4, 38.2],
      heat_index: simulationResult.computedHeatIndexC,
      sleep_deficit_hours: inputs.sleepDeficitHours,
      cohort_size: 18,
      twl_index: simulationResult.twlIndex,
      ambient_temp_c: inputs.ambientTempC,
      aqi: inputs.ambientTempC > 38 ? 140 : 65
    };

    onInjectSimulatedScenario(packet, simulationResult);
    setInjectedNotice(`Simulated scenario injected into live telemetry stream for ${zoneName}!`);
    if (onNotice) {
      onNotice(`Scenario Simulation applied to live model: ${simulationResult.riskScorePct}% predicted risk tier (${simulationResult.riskTier}).`);
    }
    setTimeout(() => setInjectedNotice(null), 4000);
  };

  const isCritical = simulationResult.riskTier === 'CRITICAL_RISK';
  const isModerate = simulationResult.riskTier === 'MODERATE_RISK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Scenario Simulation &bull; Real-Time LSTM-Kalman Stress Lab</h3>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  Interactive Variable Sensitivity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust environmental and physiological variables (humidity, acoustic noise, traffic density) to observe real-time model predictions and feature attribution shifts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Status Injection Feedback */}
          {injectedNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{injectedNotice}</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-bold">
                STREAM UPDATED
              </span>
            </div>
          )}

          {/* Preset Buttons Bar */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Scenario Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleApplyPreset('BASELINE_NORMAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                    selectedPreset === 'BASELINE_NORMAL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Safe Baseline
                </button>
                <button
                  onClick={() => handleApplyPreset('SUMMER_HEATWAVE_HUMIDITY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                    selectedPreset === 'SUMMER_HEATWAVE_HUMIDITY'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  High Humidity Heatwave
                </button>
                <button
                  onClick={() => handleApplyPreset('HIGH_NOISE_TRAFFIC_RUSH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                    selectedPreset === 'HIGH_NOISE_TRAFFIC_RUSH'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Heavy Noise &amp; Traffic
                </button>
                <button
                  onClick={() => handleApplyPreset('SUBGRADE_TUNNEL_SURGE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                    selectedPreset === 'SUBGRADE_TUNNEL_SURGE'
                      ? 'bg-rose-700 text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Confined Tunnel Surge
                </button>
              </div>
            </div>

            <button
              onClick={handleResetToBaseline}
              className="flex items-center space-x-1 text-xs font-mono text-slate-400 hover:text-cyan-400 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Safe Limits</span>
            </button>
          </div>

          {/* Core Grid: Left Variable Controls (6 cols), Right Real-Time Model Impact (6 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Col (6 cols): Input Variables */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  Adjustable Simulation Variables
                </span>
                <span className="text-[10px] font-mono text-slate-400">Live Model Sync</span>
              </div>

              {/* Slider 1: Relative Humidity (%) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Relative Humidity</span>
                  </label>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">
                    {inputs.relativeHumidityPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="95"
                  step="1"
                  value={inputs.relativeHumidityPct}
                  onChange={(e) => handleSliderChange('relativeHumidityPct', Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>15% (Dry Air)</span>
                  <span>45% (Safe)</span>
                  <span className="text-amber-400">80%+ (Severe Heat Index Surge)</span>
                </div>
              </div>

              {/* Slider 2: Acoustic Noise Level (dBA) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Acoustic Noise Level</span>
                  </label>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {inputs.noiseLevelDb} dBA
                  </span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="110"
                  step="1"
                  value={inputs.noiseLevelDb}
                  onChange={(e) => handleSliderChange('noiseLevelDb', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>45 dBA (Quiet)</span>
                  <span className="text-slate-400">85 dBA (OSHA Max)</span>
                  <span className="text-rose-400">110 dBA (Extreme Press)</span>
                </div>
              </div>

              {/* Slider 3: Traffic Density & Logistical Transit (1-10) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Traffic / Forklift &amp; Worker Density</span>
                  </label>
                  <span className="font-mono font-bold text-indigo-400 tabular-nums">
                    Level {inputs.trafficDensityLevel} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={inputs.trafficDensityLevel}
                  onChange={(e) => handleSliderChange('trafficDensityLevel', Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Isolated Corridor)</span>
                  <span>5 (Standard Staging)</span>
                  <span className="text-indigo-300">10 (Maximum Transit Congestion)</span>
                </div>
              </div>

              {/* Slider 4: Ambient Temperature (°C) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                    <span>Ambient Dry-Bulb Temperature</span>
                  </label>
                  <span className="font-mono font-bold text-rose-400 tabular-nums">
                    {inputs.ambientTempC}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="48"
                  step="0.5"
                  value={inputs.ambientTempC}
                  onChange={(e) => handleSliderChange('ambientTempC', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>20°C (Comfortable)</span>
                  <span>35°C (Threshold)</span>
                  <span className="text-rose-400">48°C (Extreme Desert/Plant)</span>
                </div>
              </div>

              {/* Slider 5: Worker Heart Rate & Autonomic HRV */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Heart className="h-3 w-3 text-rose-400" />
                      Heart Rate
                    </span>
                    <span className="font-mono font-bold text-white">{inputs.workerHeartRateBpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="170"
                    step="1"
                    value={inputs.workerHeartRateBpm}
                    onChange={(e) => handleSliderChange('workerHeartRateBpm', Number(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-cyan-400" />
                      HRV (RMSSD)
                    </span>
                    <span className="font-mono font-bold text-white">{inputs.hrvMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    step="1"
                    value={inputs.hrvMs}
                    onChange={(e) => handleSliderChange('hrvMs', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Col (6 cols): Real-Time LSTM-Kalman Model Impact */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    Real-Time Model Impact &amp; Prediction
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                        : isModerate
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}
                  >
                    {simulationResult.riskTier}
                  </span>
                </div>

                {/* KPI Gauges Matrix */}
                <div className="grid grid-cols-3 gap-2.5 mt-3">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Predicted Risk</div>
                    <div
                      className={`text-xl font-bold font-mono mt-0.5 ${
                        isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {simulationResult.riskScorePct}%
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {isCritical ? 'Critical Exceedance' : isModerate ? 'Moderate Threshold' : 'Safe Normal'}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">NOAA Heat Index</div>
                    <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                      {simulationResult.computedHeatIndexC}°C
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      TWL: {simulationResult.twlIndex} W/m²
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Reconstruction MSE</div>
                    <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                      {simulationResult.reconstructionMse.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Cutoff: &gt;0.250
                    </div>
                  </div>
                </div>

                {/* Real-Time Shift in Feature Attributions */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white font-mono flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      Dynamic Feature Attributions (% of Total Risk)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Updates Instantly</span>
                  </div>

                  <div className="space-y-2">
                    {simulationResult.topAttributions.slice(0, 4).map((attr, idx) => (
                      <div key={attr.featureName} className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-xs">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-medium text-slate-200">
                            #{idx + 1} {attr.featureName}
                          </span>
                          <span className="font-mono font-bold text-rose-400">
                            {attr.attributionPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              idx === 0
                                ? 'bg-rose-500'
                                : idx === 1
                                ? 'bg-amber-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, attr.attributionPct * 1.8)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                          <span>Measured: {attr.measuredValue}</span>
                          <span>Baseline: {attr.baselineValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synthesis & Counterfactual */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Real-Time Model Decision Insight</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {simulationResult.explainabilitySummary}
                  </p>
                  <p className="text-emerald-300/90 text-[10px] font-mono mt-1 pt-1 border-t border-slate-800">
                    &bull; {simulationResult.counterfactualInsight}
                  </p>
                </div>
              </div>

              {/* Bottom Injection Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Target Zone: {activeZone?.name || 'Outdoor Construction Sector 4'}
                </span>

                <button
                  onClick={handleInjectToLiveStream}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-cyan-600/30 cursor-pointer"
                  title="Inject these simulated parameters into the live telemetry feed for this zone"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                  <span>Apply Scenario to Live Stream</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <div className="text-xs text-slate-400 font-mono">
            <span>Model: LSTM Autoencoder (12-step lookback) with 1D Kalman pre-filtering.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

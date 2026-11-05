import React, { useState, useMemo } from 'react';
import {
  KalmanSensitivityConfig,
  HealthSignalNotificationThresholds,
  FacilityZone,
  AnomalyPredictionResult,
  TelemetryPacket,
  RiskTier
} from '../types';
import {
  Sliders,
  Cpu,
  Activity,
  Heart,
  Thermometer,
  Sun,
  Volume2,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Save,
  AlertTriangle,
  Zap,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Radio,
  SlidersHorizontal,
  Target
} from 'lucide-react';
import { predictWorkforceAnomaly, computeLstmReconstructionAnomaly } from '../services/lstmAnomalyEngine';

interface AlgorithmSensitivityConfigPanelProps {
  kalmanConfig: KalmanSensitivityConfig;
  onUpdateKalmanConfig: (config: KalmanSensitivityConfig) => void;
  healthThresholds: HealthSignalNotificationThresholds;
  onUpdateHealthThresholds: (thresholds: HealthSignalNotificationThresholds, justification: string) => void;
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onScrollToHistoricalLog?: () => void;
}

export default function AlgorithmSensitivityConfigPanel({
  kalmanConfig,
  onUpdateKalmanConfig,
  healthThresholds,
  onUpdateHealthThresholds,
  zones,
  selectedZoneId,
  onSelectZone,
  onScrollToHistoricalLog
}: AlgorithmSensitivityConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALGORITHM_CORE' | 'SENSOR_LIMITS' | 'SIMULATION'>('ALGORITHM_CORE');

  // Local state for algorithm parameters
  const [localPreset, setLocalPreset] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM'>(
    kalmanConfig.preset || 'MEDIUM'
  );
  const [criticalCutoffPct, setCriticalCutoffPct] = useState<number>(kalmanConfig.criticalCutoffPct || 75);
  const [moderateCutoffPct, setModerateCutoffPct] = useState<number>(kalmanConfig.moderateCutoffPct || 40);
  const [processVarianceQ, setProcessVarianceQ] = useState<number>(kalmanConfig.processVarianceQ || 0.001);
  const [measurementVarianceR, setMeasurementVarianceR] = useState<number>(kalmanConfig.measurementVarianceR || 0.1);
  const [autoImputeMissing, setAutoImputeMissing] = useState<boolean>(kalmanConfig.autoImputeMissing ?? true);
  const [suppressSmallCells, setSuppressSmallCells] = useState<boolean>(kalmanConfig.suppressSmallCells ?? true);

  // LSTM Feature Weights
  const [weightHrv, setWeightHrv] = useState<number>(0.4);
  const [weightTemp, setWeightTemp] = useState<number>(0.2);
  const [weightHeat, setWeightHeat] = useState<number>(0.3);
  const [weightFatigue, setWeightFatigue] = useState<number>(0.1);

  // Sensor threshold limits
  const [minHrvMs, setMinHrvMs] = useState<number>(healthThresholds.minHrvMs || 40);
  const [maxHeartRateBpm, setMaxHeartRateBpm] = useState<number>(healthThresholds.maxHeartRateBpm || 115);
  const [maxSkinTempC, setMaxSkinTempC] = useState<number>(healthThresholds.maxSkinTempC || 37.8);
  const [maxAmbientHeatC, setMaxAmbientHeatC] = useState<number>(healthThresholds.maxAmbientHeatC || 36.0);
  const [maxNoiseDb, setMaxNoiseDb] = useState<number>(healthThresholds.maxNoiseDb || 85.0);

  // Audit and Feedback
  const [justification, setJustification] = useState<string>('Calibrated anomaly algorithm sensitivity thresholds.');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Live Sandbox Simulation State
  const [simulationResult, setSimulationResult] = useState<AnomalyPredictionResult | null>(null);
  const [simHrvInput, setSimHrvInput] = useState<number>(32.0);
  const [simTempInput, setSimTempInput] = useState<number>(38.2);
  const [simHeatInput, setSimHeatInput] = useState<number>(39.5);
  const [simSleepDeficitInput, setSimSleepDeficitInput] = useState<number>(2.5);

  // Keep local values in sync when external props change
  React.useEffect(() => {
    setCriticalCutoffPct(kalmanConfig.criticalCutoffPct || 75);
    setModerateCutoffPct(kalmanConfig.moderateCutoffPct || 40);
    setProcessVarianceQ(kalmanConfig.processVarianceQ || 0.001);
    setMeasurementVarianceR(kalmanConfig.measurementVarianceR || 0.1);
    setLocalPreset(kalmanConfig.preset || 'MEDIUM');
  }, [kalmanConfig]);

  React.useEffect(() => {
    setMinHrvMs(healthThresholds.minHrvMs);
    setMaxHeartRateBpm(healthThresholds.maxHeartRateBpm || 115);
    setMaxSkinTempC(healthThresholds.maxSkinTempC);
    setMaxAmbientHeatC(healthThresholds.maxAmbientHeatC);
    setMaxNoiseDb(healthThresholds.maxNoiseDb);
  }, [healthThresholds]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setLocalPreset(preset);
    let crit = 75;
    let mod = 40;
    let q = 0.001;
    let r = 0.1;
    let hrv = 40;
    let hr = 115;
    let temp = 37.8;
    let amb = 36.0;
    let noise = 85.0;

    if (preset === 'HIGH') {
      crit = 60;
      mod = 30;
      q = 0.005;
      r = 0.05;
      hrv = 45;
      hr = 105;
      temp = 37.4;
      amb = 34.0;
      noise = 80.0;
    } else if (preset === 'LOW') {
      crit = 85;
      mod = 55;
      q = 0.0005;
      r = 0.25;
      hrv = 35;
      hr = 125;
      temp = 38.2;
      amb = 38.0;
      noise = 90.0;
    }

    setCriticalCutoffPct(crit);
    setModerateCutoffPct(mod);
    setProcessVarianceQ(q);
    setMeasurementVarianceR(r);
    setMinHrvMs(hrv);
    setMaxHeartRateBpm(hr);
    setMaxSkinTempC(temp);
    setMaxAmbientHeatC(amb);
    setMaxNoiseDb(noise);
  };

  // Run Real-Time Test Simulation through LSTM Engine
  const handleRunEngineSimulation = () => {
    const testPacket: TelemetryPacket = {
      worker_id: 'W-TEST-SIM',
      location_zone: zones.find((z) => z.id === selectedZoneId)?.name || 'Facility Test Zone',
      timestamp: new Date().toISOString(),
      hrv_series: [48, 44, 40, 36, simHrvInput],
      skin_temp_series: [36.8, 37.1, 37.4, 37.8, simTempInput],
      heat_index: simHeatInput,
      sleep_deficit_hours: simSleepDeficitInput,
      cohort_size: 18
    };

    const config: KalmanSensitivityConfig = {
      preset: localPreset,
      processVarianceQ,
      measurementVarianceR,
      criticalCutoffPct,
      moderateCutoffPct,
      autoImputeMissing,
      suppressSmallCells
    };

    const result = predictWorkforceAnomaly(testPacket, undefined, config);
    setSimulationResult(result);
  };

  // Save and Apply Configuration
  const handleSaveAndApply = () => {
    const updatedKalmanConfig: KalmanSensitivityConfig = {
      preset: localPreset,
      processVarianceQ,
      measurementVarianceR,
      criticalCutoffPct,
      moderateCutoffPct,
      autoImputeMissing,
      suppressSmallCells
    };

    const updatedHealthThresholds: HealthSignalNotificationThresholds = {
      ...healthThresholds,
      minHrvMs,
      maxHeartRateBpm,
      maxSkinTempC,
      maxAmbientHeatC,
      maxNoiseDb,
      riskScoreCutoffPct: criticalCutoffPct,
      sensitivityLevel: localPreset
    };

    onUpdateKalmanConfig(updatedKalmanConfig);
    onUpdateHealthThresholds(
      updatedHealthThresholds,
      justification || `Updated anomaly algorithms: Critical cutoff ${criticalCutoffPct}%, Q=${processVarianceQ}, R=${measurementVarianceR}.`
    );

    setSaveSuccessMessage(
      `Sensitivity thresholds successfully applied to LSTM Autoencoder & Kalman filter engines (${localPreset} profile).`
    );
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  const handleResetDefaults = () => {
    handleSelectPreset('MEDIUM');
    setJustification('Reset to ISO 45001 / OSHA balanced algorithm defaults.');
  };

  return (
    <div
      id="algorithm-sensitivity-config-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6 transition-all"
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 rounded-xl shadow-xs shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-wide">
                Anomaly Detection Algorithm Sensitivity Configuration
              </h2>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase">
                LSTM &amp; Kalman Core
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                Active Profile: {localPreset}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune mathematical sensitivity cutoffs for the LSTM Autoencoder reconstruction engine, Kalman noise filter parameters, and multi-signal physiological threshold ceilings.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onScrollToHistoricalLog && (
            <button
              onClick={onScrollToHistoricalLog}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
              title="Inspect recent events in the Historical Anomaly Event Log"
            >
              <Activity className="h-3.5 w-3.5 text-rose-400" />
              <span>Inspect Event Log</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse' : 'Configure'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Confirmation Banner */}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between px-5 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-mono text-emerald-300">
            AUDIT COMMITTED
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Preset Selector Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" /> Sensitivity Profiles
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select an engineered sensitivity profile or customize individual mathematical weights below.
              </p>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs flex-wrap gap-1">
              <button
                onClick={() => handleSelectPreset('HIGH')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  localPreset === 'HIGH'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                <Zap className="h-3 w-3 text-rose-400" />
                <span>High Sensitivity (Early Warning)</span>
              </button>

              <button
                onClick={() => handleSelectPreset('MEDIUM')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  localPreset === 'MEDIUM'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                <span>Balanced (Standard Default)</span>
              </button>

              <button
                onClick={() => handleSelectPreset('LOW')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  localPreset === 'LOW'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <span>Conservative (Alert Fatigue Dampener)</span>
              </button>

              {localPreset === 'CUSTOM' && (
                <span className="px-3 py-1.5 rounded-md font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/50 shadow-xs flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3 text-indigo-400" />
                  <span>Custom Sliders</span>
                </span>
              )}
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('ALGORITHM_CORE')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ALGORITHM_CORE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-indigo-300" />
              <span>LSTM &amp; Kalman Filter Parameters</span>
            </button>
            <button
              onClick={() => setActiveTab('SENSOR_LIMITS')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'SENSOR_LIMITS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span>Health Signal Cutoff Thresholds</span>
            </button>
            <button
              onClick={() => setActiveTab('SIMULATION')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'SIMULATION'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5 text-cyan-400" />
              <span>Live Engine Sandbox Simulator</span>
            </button>
          </div>

          {/* Tab 1: LSTM Autoencoder & Kalman Core Parameters */}
          {activeTab === 'ALGORITHM_CORE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Critical Risk Probability Cutoff */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        Critical Risk Cutoff
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        {criticalCutoffPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      LSTM reconstruction error sigmoid probability required to classify as an acute Critical Risk anomaly.
                    </p>
                    <input
                      type="range"
                      min="40"
                      max="95"
                      step="1"
                      value={criticalCutoffPct}
                      onChange={(e) => {
                        setCriticalCutoffPct(Number(e.target.value));
                        setLocalPreset('CUSTOM');
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>40% (Aggressive)</span>
                      <span>Default: 75%</span>
                      <span>95% (Permissive)</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    Tier: <strong className="text-rose-400">CRITICAL_RISK</strong>
                  </div>
                </div>

                {/* 2. Moderate Risk Probability Cutoff */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Moderate Risk Cutoff
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {moderateCutoffPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Threshold probability for triggering preventive rest breaks and automated cohort hydration protocols.
                    </p>
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="1"
                      value={moderateCutoffPct}
                      onChange={(e) => {
                        setModerateCutoffPct(Number(e.target.value));
                        setLocalPreset('CUSTOM');
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>20% (Strict)</span>
                      <span>Default: 40%</span>
                      <span>70%</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    Tier: <strong className="text-amber-400">MODERATE_RISK</strong>
                  </div>
                </div>

                {/* 3. Kalman Process Noise Covariance (Q) */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        Process Variance (Q)
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                        {processVarianceQ.toFixed(5)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Determines how rapidly the Kalman filter tracks genuine physical changes versus rejecting transient noise.
                    </p>
                    <input
                      type="range"
                      min="0.0001"
                      max="0.01"
                      step="0.0001"
                      value={processVarianceQ}
                      onChange={(e) => {
                        setProcessVarianceQ(Number(e.target.value));
                        setLocalPreset('CUSTOM');
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>0.0001 (Heavy Smoothing)</span>
                      <span>0.01 (Rapid Track)</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    Innovation Gain: <strong className="text-cyan-300">Auto-tuned</strong>
                  </div>
                </div>

                {/* 4. Kalman Measurement Noise Covariance (R) */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-indigo-400" />
                        Measurement Noise (R)
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                        {measurementVarianceR.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Estimated variance of wearable sensor optical/thermal noise and motion artifacts.
                    </p>
                    <input
                      type="range"
                      min="0.01"
                      max="0.50"
                      step="0.01"
                      value={measurementVarianceR}
                      onChange={(e) => {
                        setMeasurementVarianceR(Number(e.target.value));
                        setLocalPreset('CUSTOM');
                      }}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>0.01 (High Trust)</span>
                      <span>Default: 0.10</span>
                      <span>0.50 (High Jitter)</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    Filter State: <strong className="text-emerald-400">Active</strong>
                  </div>
                </div>
              </div>

              {/* Toggles Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImputeMissing}
                    onChange={(e) => {
                      setAutoImputeMissing(e.target.checked);
                      setLocalPreset('CUSTOM');
                    }}
                    className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-Impute Missing Packets</span>
                    <span className="text-[11px] text-slate-400">
                      Use Kalman linear state-transition extrapolation when Bluetooth packets are dropped.
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={suppressSmallCells}
                    onChange={(e) => {
                      setSuppressSmallCells(e.target.checked);
                      setLocalPreset('CUSTOM');
                    }}
                    className="rounded text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Small-Cell Privacy Suppression ($N \ge 12$)</span>
                    <span className="text-[11px] text-slate-400">
                      Suppress individual worker tokens when cohort size drops below $k$-anonymity safety threshold.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Tab 2: Health Signal Notification Cutoffs */}
          {activeTab === 'SENSOR_LIMITS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Minimum HRV Floor */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-emerald-400" />
                    Autonomic HRV Floor (ms)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {minHrvMs} ms
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Minimum acceptable vagal tone. Drops below this threshold indicate parasympathetic burnout.
                </p>
                <input
                  type="range"
                  min="25"
                  max="60"
                  step="1"
                  value={minHrvMs}
                  onChange={(e) => {
                    setMinHrvMs(Number(e.target.value));
                    setLocalPreset('CUSTOM');
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>25 ms</span>
                  <span>Default: 40 ms</span>
                  <span>60 ms</span>
                </div>
              </div>

              {/* Heart Rate Ceiling */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-rose-400" />
                    Heart Rate Ceiling (BPM)
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    {maxHeartRateBpm} BPM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Maximum allowable sustained pulse rate before tachycardia alert trigger.
                </p>
                <input
                  type="range"
                  min="90"
                  max="150"
                  step="1"
                  value={maxHeartRateBpm}
                  onChange={(e) => {
                    setMaxHeartRateBpm(Number(e.target.value));
                    setLocalPreset('CUSTOM');
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>90 BPM</span>
                  <span>Default: 115 BPM</span>
                  <span>150 BPM</span>
                </div>
              </div>

              {/* Cutaneous Skin Temp */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4 text-amber-400" />
                    Skin Temp Ceiling (°C)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {maxSkinTempC.toFixed(1)}°C
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Maximum surface/core temperature before exertional heat exhaustion triage.
                </p>
                <input
                  type="range"
                  min="36.5"
                  max="39.5"
                  step="0.1"
                  value={maxSkinTempC}
                  onChange={(e) => {
                    setMaxSkinTempC(Number(e.target.value));
                    setLocalPreset('CUSTOM');
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>36.5°C</span>
                  <span>Default: 37.8°C</span>
                  <span>39.5°C</span>
                </div>
              </div>

              {/* Ambient Heat Ceiling */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <Sun className="h-4 w-4 text-orange-400" />
                    Ambient Heat Ceiling (°C)
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                    {maxAmbientHeatC.toFixed(1)}°C
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Ambient wet-bulb microclimate thermal ceiling. Triggers cooling mist stations.
                </p>
                <input
                  type="range"
                  min="28.0"
                  max="45.0"
                  step="0.5"
                  value={maxAmbientHeatC}
                  onChange={(e) => {
                    setMaxAmbientHeatC(Number(e.target.value));
                    setLocalPreset('CUSTOM');
                  }}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>28.0°C</span>
                  <span>Default: 36.0°C</span>
                  <span>45.0°C</span>
                </div>
              </div>

              {/* Acoustic Noise Limit */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-indigo-400" />
                    Acoustic Noise Limit (dBA)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    {maxNoiseDb.toFixed(1)} dBA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  OSHA 8-hour TWA permissible exposure level for heavy machinery sound pressure.
                </p>
                <input
                  type="range"
                  min="70"
                  max="105"
                  step="1"
                  value={maxNoiseDb}
                  onChange={(e) => {
                    setMaxNoiseDb(Number(e.target.value));
                    setLocalPreset('CUSTOM');
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>70 dBA</span>
                  <span>OSHA: 85 dBA</span>
                  <span>105 dBA</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Live Algorithm Sandbox Simulator */}
          {activeTab === 'SIMULATION' && (
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-cyan-400" />
                    Live Algorithm Inference Sandbox
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inject test biometric and microclimate signals to verify how your custom sensitivity thresholds classify the risk tier in real time.
                  </p>
                </div>
                <button
                  onClick={handleRunEngineSimulation}
                  className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs shrink-0"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Execute Test Inference</span>
                </button>
              </div>

              {/* Simulation Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Simulated HRV:</span>
                    <span className="font-mono text-cyan-300">{simHrvInput.toFixed(1)} ms</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="68"
                    step="1"
                    value={simHrvInput}
                    onChange={(e) => setSimHrvInput(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Simulated Skin Temp:</span>
                    <span className="font-mono text-amber-300">{simTempInput.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range"
                    min="36.0"
                    max="39.5"
                    step="0.1"
                    value={simTempInput}
                    onChange={(e) => setSimTempInput(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Heat Index:</span>
                    <span className="font-mono text-orange-300">{simHeatInput.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="48"
                    step="0.5"
                    value={simHeatInput}
                    onChange={(e) => setSimHeatInput(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-slate-300 font-semibold mb-1">
                    <span>Sleep Deficit:</span>
                    <span className="font-mono text-purple-300">{simSleepDeficitInput.toFixed(1)} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.5"
                    value={simSleepDeficitInput}
                    onChange={(e) => setSimSleepDeficitInput(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulation Result Output Card */}
              {simulationResult && (
                <div className="bg-slate-900/95 border border-cyan-500/50 p-4 rounded-xl text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Inference Output Under Current Sensitivity Thresholds:
                    </span>
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded text-[11px] border ${
                        simulationResult.risk_tier === 'CRITICAL_RISK'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : simulationResult.risk_tier === 'MODERATE_RISK'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      }`}
                    >
                      {simulationResult.risk_tier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Risk Probability:</span>
                      <span className="text-white font-bold text-sm">
                        {(simulationResult.risk_probability * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Reconstruction MSE:</span>
                      <span className="text-amber-300 font-bold text-sm">
                        {simulationResult.reconstruction_mse.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Critical Cutoff Benchmark:</span>
                      <span className="text-rose-400 font-bold text-sm">{criticalCutoffPct}%</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded">
                      <span className="text-slate-500 text-[10px] block">Privacy Status:</span>
                      <span className="text-emerald-400 text-xs">k&ge;12 Cleared</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg text-slate-300 text-xs">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                      Explainable Feature Attributions:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                      {Object.entries(simulationResult.explainable_attributions).map(([feature, weight]) => (
                        <div key={feature} className="flex justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
                          <span className="text-slate-400 truncate mr-2" title={feature}>{feature.split(' ')[0]}:</span>
                          <span className="text-cyan-300 font-bold">{(weight * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Note & Save / Reset Controls */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-auto flex-1 flex items-center space-x-2">
              <span className="text-xs text-slate-400 whitespace-nowrap font-medium">Audit Justification:</span>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Reason for sensitivity threshold adjustments (ISO audit compliance)..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                onClick={handleResetDefaults}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                title="Reset to factory recommended Balanced defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={handleSaveAndApply}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md shadow-indigo-900/40 transition cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Apply Sensitivity Thresholds</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

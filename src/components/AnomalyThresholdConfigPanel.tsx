import React, { useState, useMemo } from 'react';
import {
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  Info,
  Activity,
  Heart,
  Thermometer,
  Volume2,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { HealthSignalNotificationThresholds, AnomalyTrendDay, AnomalyTrendDayWithProjection, FacilityZone } from '../types';

interface AnomalyThresholdConfigPanelProps {
  thresholds: HealthSignalNotificationThresholds;
  onUpdateThresholds: (
    updatedThresholds: HealthSignalNotificationThresholds,
    justification: string
  ) => void;
  trendData: AnomalyTrendDay[];
  dailyFrequencyThreshold: number;
  onDailyFrequencyThresholdChange: (val: number) => void;
  criticalFrequencyThreshold: number;
  onCriticalFrequencyThresholdChange: (val: number) => void;
  proactiveRiskThreshold?: number;
  onProactiveRiskThresholdChange?: (val: number) => void;
  sensitivityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM';
  onSensitivityLevelChange: (lvl: 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM') => void;
  onScrollToTrendChart?: () => void;
  selectedZone: FacilityZone;
  onTriggerPreemptiveAlert?: () => void;
}

export default function AnomalyThresholdConfigPanel({
  thresholds,
  onUpdateThresholds,
  trendData,
  dailyFrequencyThreshold,
  onDailyFrequencyThresholdChange,
  criticalFrequencyThreshold,
  onCriticalFrequencyThresholdChange,
  proactiveRiskThreshold = 5.5,
  onProactiveRiskThresholdChange,
  sensitivityLevel,
  onSensitivityLevelChange,
  onScrollToTrendChart,
  selectedZone,
  onTriggerPreemptiveAlert
}: AnomalyThresholdConfigPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [localDailyLimit, setLocalDailyLimit] = useState<number>(dailyFrequencyThreshold);
  const [localCriticalLimit, setLocalCriticalLimit] = useState<number>(criticalFrequencyThreshold);
  const [localProactiveRiskLimit, setLocalProactiveRiskLimit] = useState<number>(
    proactiveRiskThreshold ?? thresholds.proactiveRiskThreshold ?? 5.5
  );
  const [localRiskCutoff, setLocalRiskCutoff] = useState<number>(thresholds.riskScoreCutoffPct);
  const [localHrvFloor, setLocalHrvFloor] = useState<number>(thresholds.minHrvMs);
  const [localMaxTemp, setLocalMaxTemp] = useState<number>(thresholds.maxAmbientHeatC);
  const [localMaxNoise, setLocalMaxNoise] = useState<number>(thresholds.maxNoiseDb);
  const [justification, setJustification] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync internal state with external changes
  React.useEffect(() => {
    setLocalDailyLimit(dailyFrequencyThreshold);
    setLocalCriticalLimit(criticalFrequencyThreshold);
    setLocalProactiveRiskLimit(proactiveRiskThreshold ?? thresholds.proactiveRiskThreshold ?? 5.5);
    setLocalRiskCutoff(thresholds.riskScoreCutoffPct);
    setLocalHrvFloor(thresholds.minHrvMs);
    setLocalMaxTemp(thresholds.maxAmbientHeatC);
    setLocalMaxNoise(thresholds.maxNoiseDb);
  }, [dailyFrequencyThreshold, criticalFrequencyThreshold, proactiveRiskThreshold, thresholds]);

  // Peak 7-day moving average projection across the projected forecast window
  const peakForecastSma = useMemo(() => {
    const projectedItems = (trendData as AnomalyTrendDayWithProjection[]).filter(
      (d) => d.isProjected && d.projectedTrend != null
    );
    if (projectedItems.length > 0) {
      const maxVal = Math.max(...projectedItems.map((d) => d.projectedTrend || 0));
      return Number(maxVal.toFixed(1));
    }
    // Fallback if not projected
    const last7 = trendData.slice(-7);
    if (last7.length === 0) return 4.8;
    const avg = last7.reduce((acc, d) => acc + d.totalAnomalies, 0) / last7.length;
    return Number(avg.toFixed(1));
  }, [trendData]);

  const isProactiveRiskBreached = peakForecastSma > localProactiveRiskLimit;
  const exceedanceDelta = Number((peakForecastSma - localProactiveRiskLimit).toFixed(1));

  // Handle Preset Selection
  const handleSelectPreset = (preset: 'HIGH' | 'MEDIUM' | 'LOW') => {
    onSensitivityLevelChange(preset);
    let newDaily = 5;
    let newCrit = 3;
    let newProactive = 5.5;
    let newRisk = 65;
    let newHrv = 40;
    let newTemp = 36.0;

    if (preset === 'HIGH') {
      newDaily = 3;
      newCrit = 2;
      newProactive = 3.5;
      newRisk = 55;
      newHrv = 45;
      newTemp = 34.5;
    } else if (preset === 'LOW') {
      newDaily = 8;
      newCrit = 5;
      newProactive = 7.5;
      newRisk = 75;
      newHrv = 35;
      newTemp = 38.0;
    }

    setLocalDailyLimit(newDaily);
    setLocalCriticalLimit(newCrit);
    setLocalProactiveRiskLimit(newProactive);
    setLocalRiskCutoff(newRisk);
    setLocalHrvFloor(newHrv);
    setLocalMaxTemp(newTemp);

    onDailyFrequencyThresholdChange(newDaily);
    onCriticalFrequencyThresholdChange(newCrit);
    if (onProactiveRiskThresholdChange) {
      onProactiveRiskThresholdChange(newProactive);
    }
  };

  // Compute live impact on existing 30-day trend data
  const impactStats = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return { breachedDays: 0, breachPct: 0, criticalDays: 0 };
    }
    const breachedDays = trendData.filter((d) => d.totalAnomalies >= localDailyLimit).length;
    const criticalDays = trendData.filter((d) => d.criticalCount >= localCriticalLimit).length;
    const breachPct = Number(((breachedDays / trendData.length) * 100).toFixed(1));

    return { breachedDays, breachPct, criticalDays };
  }, [trendData, localDailyLimit, localCriticalLimit]);

  const handleSliderChange = (val: number) => {
    setLocalDailyLimit(val);
    onDailyFrequencyThresholdChange(val);
    onSensitivityLevelChange('CUSTOM');
  };

  const handleCriticalSliderChange = (val: number) => {
    setLocalCriticalLimit(val);
    onCriticalFrequencyThresholdChange(val);
    onSensitivityLevelChange('CUSTOM');
  };

  const handleProactiveRiskSliderChange = (val: number) => {
    setLocalProactiveRiskLimit(val);
    if (onProactiveRiskThresholdChange) {
      onProactiveRiskThresholdChange(val);
    }
    onSensitivityLevelChange('CUSTOM');
  };

  const handleSaveAllThresholds = () => {
    const updated: HealthSignalNotificationThresholds = {
      ...thresholds,
      dailyAnomalyFrequencyThreshold: localDailyLimit,
      criticalDailyFrequencyThreshold: localCriticalLimit,
      proactiveRiskThreshold: localProactiveRiskLimit,
      riskScoreCutoffPct: localRiskCutoff,
      minHrvMs: localHrvFloor,
      maxAmbientHeatC: localMaxTemp,
      maxNoiseDb: localMaxNoise,
      sensitivityLevel
    };

    onUpdateThresholds(
      updated,
      justification || `Applied custom ${sensitivityLevel} thresholds (Action: ${localDailyLimit}/day, Proactive Risk: ${localProactiveRiskLimit}/day, Risk cutoff: ${localRiskCutoff}%).`
    );

    setSaveSuccessNotice(
      `Custom thresholds applied: Action ${localDailyLimit}/day, Proactive Risk safe level ${localProactiveRiskLimit}/day, Critical limit ${localCriticalLimit}/day. Logged to System Audit Trail.`
    );
    setTimeout(() => setSaveSuccessNotice(null), 5000);
  };

  const handleResetDefaults = () => {
    handleSelectPreset('MEDIUM');
    setJustification('');
  };

  return (
    <div id="anomaly-threshold-config-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Custom Anomaly Detection Thresholds &amp; Sensitivity Config</h2>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-sm">
                Live Trend Visualization Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune supervisory sensitivity levels and action benchmarks. Threshold lines are visualized dynamically on the longitudinal anomaly trend chart below.
            </p>
          </div>
        </div>

        {/* Quick Expand & Visual Jump Controls */}
        <div className="flex items-center space-x-2">
          {onScrollToTrendChart && (
            <button
              onClick={onScrollToTrendChart}
              className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
              title="Jump to 30-Day Trend Chart to see threshold reference line"
            >
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>Inspect on Chart</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Confirmation Banner */}
      {saveSuccessNotice && (
        <div className="mt-3 bg-emerald-950/80 border border-emerald-500/50 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-mono text-emerald-300">ISO 45001 LOGGED</span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Sensitivity Preset Level Selector Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" /> Sensitivity Level Presets
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select an enterprise preset to automatically calibrate daily action frequencies, critical limits, and Kalman variance.
              </p>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => handleSelectPreset('HIGH')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  sensitivityLevel === 'HIGH'
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
                  sensitivityLevel === 'MEDIUM'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                <span>Balanced / Standard (Recommended)</span>
              </button>
              <button
                onClick={() => handleSelectPreset('LOW')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  sensitivityLevel === 'LOW'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <span>Conservative / Low Fatigue</span>
              </button>
              {sensitivityLevel === 'CUSTOM' && (
                <span className="px-3 py-1.5 rounded-md font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/50 shadow-xs flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3 text-indigo-400" />
                  <span>Custom Sliders Active</span>
                </span>
              )}
            </div>
          </div>

          {/* Pre-Emptive Alert Trigger Banner if 7-day Moving Avg Projection exceeds Safe Threshold */}
          {isProactiveRiskBreached && (
            <div className="bg-amber-950/90 border border-amber-500/70 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-900/60 border border-amber-500/60 text-amber-300 shrink-0">
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold">PRE-EMPTIVE PROACTIVE RISK ALERT TRIGGERED</strong>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                      Forecast Exceedance: +{exceedanceDelta}/day
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 mt-0.5">
                    The 7-day moving average projection reaches <strong>{peakForecastSma} events/day</strong>, exceeding your configured safe proactive risk limit of <strong>{localProactiveRiskLimit} events/day</strong>. Pre-emptive intervention is armed before an acute critical spike occurs.
                  </p>
                </div>
              </div>
              {onTriggerPreemptiveAlert && (
                <button
                  onClick={onTriggerPreemptiveAlert}
                  className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm shrink-0"
                  title="Broadcast pre-emptive warning toast to safety managers"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Send Pre-Emptive Alert</span>
                </button>
              )}
            </div>
          )}

          {/* Granular Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Proactive Risk Threshold Slider (7-Day SMA Projection) */}
            <div
              className={`p-3.5 rounded-xl shadow-xs relative overflow-hidden transition-all ${
                isProactiveRiskBreached
                  ? 'bg-amber-950/40 border-2 border-amber-500/70 shadow-amber-950/30'
                  : 'bg-slate-950/90 border border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  'Proactive Risk' Threshold Slider
                </span>
                <span
                  className={`text-sm font-mono font-bold px-2 py-0.5 rounded border ${
                    isProactiveRiskBreached
                      ? 'bg-amber-950 text-amber-300 border-amber-500 font-extrabold animate-pulse'
                      : 'text-white bg-amber-950/80 border-amber-500/40'
                  }`}
                >
                  {localProactiveRiskLimit.toFixed(1)} events / day
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Triggers pre-emptive supervisor notification if the 7-day moving average projection exceeds safe levels before a critical anomaly actually occurs.
              </p>

              {/* Live Comparison Gauge */}
              <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg mb-2 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">7-Day Projected Peak SMA:</span>
                <span className="font-mono font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-indigo-400" />
                  <span>{peakForecastSma} events/day</span>
                  {isProactiveRiskBreached ? (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-500/40">
                      Exceeded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                      Safe Margin
                    </span>
                  )}
                </span>
              </div>

              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={localProactiveRiskLimit}
                onChange={(e) => handleProactiveRiskSliderChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>2.0/day (High Vigilance)</span>
                <span>Default: 5.5</span>
                <span>10.0/day (Permissive)</span>
              </div>
            </div>

            {/* 2. Daily Anomaly Frequency Action Benchmark (Visualized on Chart) */}
            <div className="bg-slate-950/90 border border-cyan-500/40 p-3.5 rounded-xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Daily Action Benchmark
                </span>
                <span className="text-sm font-mono font-bold text-white bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                  {localDailyLimit} events / day
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Renders as primary red reference line on the 30-day trend chart. Triggers supervisory cohort intervention.
              </p>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={localDailyLimit}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 event/day (Strict)</span>
                <span>Default: 5</span>
                <span>15 events/day (Permissive)</span>
              </div>
            </div>

            {/* 2. Critical Daily Limit (Visualized on Chart) */}
            <div className="bg-slate-950/90 border border-rose-500/40 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Critical Incidents Limit
                </span>
                <span className="text-sm font-mono font-bold text-white bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded">
                  {localCriticalLimit} critical / day
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Maximum allowable acute medical incidents before mandatory area evacuation sirens are triggered.
              </p>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={localCriticalLimit}
                onChange={(e) => handleCriticalSliderChange(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 incident (Zero Tolerance)</span>
                <span>Default: 3</span>
                <span>8 incidents</span>
              </div>
            </div>

            {/* 3. Composite Risk Cutoff % */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  LSTM Reconstruction Risk Cutoff
                </span>
                <span className="text-sm font-mono font-bold text-white bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded">
                  {localRiskCutoff}% Cutoff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Deviation probability threshold calculated by Kalman-smoothed reconstruction error vector.
              </p>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={localRiskCutoff}
                onChange={(e) => {
                  setLocalRiskCutoff(Number(e.target.value));
                  onSensitivityLevelChange('CUSTOM');
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>40% (Ultra sensitive)</span>
                <span>Default: 65%</span>
                <span>90% (Low false alarms)</span>
              </div>
            </div>

            {/* 4. Minimum Autonomic HRV Floor (ms) */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-emerald-400" />
                  Autonomic HRV Floor (ms)
                </span>
                <span className="text-sm font-mono font-bold text-white bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                  {localHrvFloor} ms
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Workforce RMSSD floor below which parasympathetic exhaustion and cardiac fatigue is flagged.
              </p>
              <input
                type="range"
                min="25"
                max="55"
                step="1"
                value={localHrvFloor}
                onChange={(e) => {
                  setLocalHrvFloor(Number(e.target.value));
                  onSensitivityLevelChange('CUSTOM');
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>25 ms (Exhaustion)</span>
                <span>Default: 40 ms</span>
                <span>55 ms (High reserve)</span>
              </div>
            </div>

            {/* 5. Max Ambient Heat (°C) */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                  Ambient Heat Threshold (°C)
                </span>
                <span className="text-sm font-mono font-bold text-white bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                  {localMaxTemp}°C
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Dry-bulb ambient heat limit triggering automated wet-bulb misting and shaded hydration pauses.
              </p>
              <input
                type="range"
                min="30"
                max="44"
                step="0.5"
                value={localMaxTemp}
                onChange={(e) => {
                  setLocalMaxTemp(Number(e.target.value));
                  onSensitivityLevelChange('CUSTOM');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>30.0°C</span>
                <span>Default: 36.0°C</span>
                <span>44.0°C (Extreme)</span>
              </div>
            </div>

            {/* 6. Acoustic Noise Limit (dBA) */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                  Acoustic Noise Limit (dBA)
                </span>
                <span className="text-sm font-mono font-bold text-white bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                  {localMaxNoise} dBA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2.5">
                OSHA 8-hour TWA ceiling for heavy machinery overpressure and secondary ear defender mandates.
              </p>
              <input
                type="range"
                min="70"
                max="100"
                step="1"
                value={localMaxNoise}
                onChange={(e) => {
                  setLocalMaxNoise(Number(e.target.value));
                  onSensitivityLevelChange('CUSTOM');
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>70 dBA</span>
                <span>Default: 85 dBA (OSHA)</span>
                <span>100 dBA</span>
              </div>
            </div>
          </div>

          {/* Live Trend Impact Simulation Preview Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="text-white font-semibold flex items-center gap-2">
                  <span>30-Day Trend Impact Simulation:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {impactStats.breachedDays} of {trendData.length} Days Breached ({impactStats.breachPct}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  At {localDailyLimit} anomalies/day, {impactStats.breachedDays} historical days cross the reference line. Critical limit of {localCriticalLimit}/day flags {impactStats.criticalDays} acute days.
                </p>
              </div>
            </div>

            {/* Justification & Save Controls */}
            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Audit justification (e.g. Heightened heatwave alert)..."
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full md:w-72"
              />
              <button
                onClick={handleSaveAllThresholds}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md cursor-pointer shrink-0"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save &amp; Log Audit</span>
              </button>
              <button
                onClick={handleResetDefaults}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer shrink-0"
                title="Reset to default Balanced preset"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

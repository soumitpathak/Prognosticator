import React from 'react';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Droplets,
  Heart,
  Clock,
  Thermometer,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  WhatIfParameters,
  DEFAULT_WHAT_IF_PARAMETERS,
  WHAT_IF_PRESETS,
  WhatIfPresetKey,
  calculateWhatIfImpact,
  WhatIfImpactSummary
} from '../services/whatIfSimulationEngine';

export interface WhatIfSimulatorPanelProps {
  params: WhatIfParameters;
  onChangeParams: (updated: WhatIfParameters) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  theme?: 'dark' | 'high-contrast-light';
  className?: string;
}

export default function WhatIfSimulatorPanel({
  params,
  onChangeParams,
  isOpen,
  onToggleOpen,
  theme = 'dark',
  className = ''
}: WhatIfSimulatorPanelProps) {
  const impact: WhatIfImpactSummary = calculateWhatIfImpact(params);
  const isLight = theme === 'high-contrast-light';

  const handleUpdate = (field: keyof WhatIfParameters, value: any) => {
    onChangeParams({
      ...params,
      [field]: value,
      isSimulationActive: true
    });
  };

  const handleApplyPreset = (presetKey: WhatIfPresetKey) => {
    const found = WHAT_IF_PRESETS.find((p) => p.id === presetKey);
    if (found) {
      onChangeParams({
        ...found.params,
        isSimulationActive: presetKey !== 'BASELINE'
      });
    }
  };

  const handleReset = () => {
    onChangeParams({
      ...DEFAULT_WHAT_IF_PARAMETERS,
      isSimulationActive: false
    });
  };

  const isNetPositive = impact.netRiskDelta > 0;
  const isNetNeutral = impact.netRiskDelta === 0;

  return (
    <div
      id="what-if-simulator-tool-panel"
      className={`rounded-xl border transition-all duration-300 ${
        isLight
          ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm'
          : 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-xl'
      } ${className}`}
    >
      {/* Simulator Banner / Header Bar */}
      <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                &lsquo;What-If&rsquo; Multi-Parameter Risk Simulator
              </h3>
              {params.isSimulationActive ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
                  <Zap className="h-2.5 w-2.5 text-amber-400" />
                  <span>LIVE RECALCULATION ACTIVE</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  BASELINE MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust environmental humidity, workforce vaccination rates, and cooling protocols to observe real-time recalculations in the risk trend chart
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Quick Simulation Active Toggle Switch */}
          <button
            type="button"
            onClick={() => onChangeParams({ ...params, isSimulationActive: !params.isSimulationActive })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs border ${
              params.isSimulationActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 font-black'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={params.isSimulationActive ? 'Disable What-If Simulation' : 'Enable What-If Simulation Recalculation'}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{params.isSimulationActive ? 'Simulation Active' : 'Activate Simulation'}</span>
          </button>

          {/* Reset Button */}
          {params.isSimulationActive && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Reset all parameters to facility baseline"
            >
              <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label={isOpen ? 'Collapse What-If Simulator' : 'Expand What-If Simulator'}
            title={isOpen ? 'Collapse simulator controls' : 'Expand simulator controls'}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Recalculation Live Variance Strip (Always visible for quick glance) */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Net Risk Impact:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs tabular-nums border ${
                isNetNeutral
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : isNetPositive
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              }`}
            >
              {isNetNeutral ? '0.0% (Baseline)' : isNetPositive ? `+${impact.netRiskDelta}% Risk Surge` : `${impact.netRiskDelta}% Risk Reduction`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Vaccination Rate:</span>
            <span
              className={`font-bold tabular-nums ${
                impact.herdImmunityAchieved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {params.vaccinationRatePct}%{' '}
              <span className="text-[10px] font-normal opacity-80">
                ({impact.herdImmunityAchieved ? '≥80% Herd Immunity' : 'Vulnerable'})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Seasonal Humidity:</span>
            <span
              className={`font-bold tabular-nums ${
                params.seasonalHumidityPct > 70 ? 'text-rose-400' : 'text-cyan-400'
              }`}
            >
              {params.seasonalHumidityPct}%{' '}
              <span className="text-[10px] font-normal opacity-80">
                ({impact.evaporativeEfficiencyPct}% Cooling Eff.)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Heat Index:</span>
            <span className="font-bold text-amber-300 tabular-nums">
              {impact.heatIndexC}°C
            </span>
          </div>
        </div>

        {/* Indicator button when collapsed */}
        {!isOpen && (
          <button
            onClick={onToggleOpen}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
          >
            <span>Adjust Parameters &amp; Presets</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Expandable Controls Section */}
      {isOpen && (
        <div className="p-4 space-y-5 animate-in fade-in duration-200">
          {/* Preset Buttons Bar */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold mb-2 flex items-center justify-between">
              <span>Quick Scenario Presets:</span>
              <span className="text-[10px] text-slate-500 font-normal">Click a scenario to auto-populate sliders</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {WHAT_IF_PRESETS.map((preset) => {
                const isSelected =
                  params.vaccinationRatePct === preset.params.vaccinationRatePct &&
                  params.seasonalHumidityPct === preset.params.seasonalHumidityPct &&
                  params.ambientHeatC === preset.params.ambientHeatC;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/70 border-amber-500/70 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate">{preset.label}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* 1. Workforce Vaccination Rate Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <label htmlFor="input-vax-rate" className="text-xs font-bold text-slate-200">
                    Workforce Vaccination Rate
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 tabular-nums">
                  {params.vaccinationRatePct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Population immunization coverage against circulating viral strains. Target &ge;80% for herd immunity protection.
              </p>
              <input
                id="input-vax-rate"
                type="range"
                min="0"
                max="100"
                step="1"
                value={params.vaccinationRatePct}
                onChange={(e) => handleUpdate('vaccinationRatePct', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>0% (Unprotected)</span>
                <span className={params.vaccinationRatePct >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  Herd Target: 80%
                </span>
                <span>100% (Universal)</span>
              </div>
            </div>

            {/* 2. Seasonal Humidity Level Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <label htmlFor="input-humidity-level" className="text-xs font-bold text-slate-200">
                    Seasonal Relative Humidity
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 tabular-nums">
                  {params.seasonalHumidityPct}% RH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Seasonal ambient moisture levels. Relative humidity &gt;70% severely restricts evaporative heat dissipation.
              </p>
              <input
                id="input-humidity-level"
                type="range"
                min="20"
                max="95"
                step="1"
                value={params.seasonalHumidityPct}
                onChange={(e) => handleUpdate('seasonalHumidityPct', Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>20% (Arid)</span>
                <span className="text-cyan-400">Baseline: 55%</span>
                <span className="text-rose-400">95% (Tropical Surge)</span>
              </div>
            </div>

            {/* 3. Ambient Heat / Heatwave Index Slider */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4 text-rose-400" />
                  <label htmlFor="input-ambient-heat" className="text-xs font-bold text-slate-200">
                    Ambient Heat / Solar Load
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40 tabular-nums">
                  {params.ambientHeatC}°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Dry-bulb ambient air temperature and diurnal solar radiation exposure across open-air facility sectors.
              </p>
              <input
                id="input-ambient-heat"
                type="range"
                min="20"
                max="50"
                step="0.5"
                value={params.ambientHeatC}
                onChange={(e) => handleUpdate('ambientHeatC', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>20°C (Mild)</span>
                <span className="text-rose-400">OSHA Cutoff: 38°C</span>
                <span>50°C (Extreme)</span>
              </div>
            </div>

            {/* 4. Shift Duration & Cumulative Fatigue */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <label htmlFor="input-shift-duration" className="text-xs font-bold text-slate-200">
                    Shift Duration &amp; Overtime
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 tabular-nums">
                  {params.shiftDurationHours} Hours
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Scheduled shift length. Extended shifts beyond 8 hours accelerate cardiac strain and sleep debt degradation.
              </p>
              <input
                id="input-shift-duration"
                type="range"
                min="6"
                max="14"
                step="0.5"
                value={params.shiftDurationHours}
                onChange={(e) => handleUpdate('shiftDurationHours', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>6h (Part-time)</span>
                <span>Standard: 8.5h</span>
                <span className="text-rose-400">14h (Double-Shift)</span>
              </div>
            </div>

            {/* 5. Active Cooling PPE & Misting Compliance */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  <label htmlFor="input-cooling-ppe" className="text-xs font-bold text-slate-200">
                    Active Cooling PPE &amp; Vests
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40 tabular-nums">
                  {params.ppeCoolingMitigationPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Phase-change cooling vest deployment and auxiliary airflow misting station utilization rate.
              </p>
              <input
                id="input-cooling-ppe"
                type="range"
                min="40"
                max="100"
                step="1"
                value={params.ppeCoolingMitigationPct}
                onChange={(e) => handleUpdate('ppeCoolingMitigationPct', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>40% (Low)</span>
                <span>Baseline: 85%</span>
                <span className="text-emerald-400">100% (Full Kit)</span>
              </div>
            </div>

            {/* 6. Hydration & Micro-Rest Frequency */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-purple-400" />
                  <label htmlFor="input-rest-frequency" className="text-xs font-bold text-slate-200">
                    Hydration &amp; Rest Breaks
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 tabular-nums">
                  {params.restHydrationFrequencyMin} min / hr
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                Enforced hourly rest rotation in shaded cooling shelters with electrolyte fluid rehydration.
              </p>
              <input
                id="input-rest-frequency"
                type="range"
                min="5"
                max="30"
                step="1"
                value={params.restHydrationFrequencyMin}
                onChange={(e) => handleUpdate('restHydrationFrequencyMin', Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
                <span>5 min (Minimal)</span>
                <span>Baseline: 15 min</span>
                <span className="text-emerald-400">30 min (Heavy Work)</span>
              </div>
            </div>
          </div>

          {/* Clinical & Epidemiological Sensitivity Breakdown */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Real-Time Model Recalculation Breakdown:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Vaccination Impact</div>
                <div className={impact.vaxImpact > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {impact.vaxImpact > 0 ? `+${impact.vaxImpact}%` : `${impact.vaxImpact}%`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Humidity Heat Load</div>
                <div className={impact.humidityImpact > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {impact.humidityImpact > 0 ? `+${impact.humidityImpact}%` : `${impact.humidityImpact}%`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Thermal Heat Delta</div>
                <div className={impact.heatImpact > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {impact.heatImpact > 0 ? `+${impact.heatImpact}%` : `${impact.heatImpact}%`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Shift Duration Load</div>
                <div className={impact.shiftImpact > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {impact.shiftImpact > 0 ? `+${impact.shiftImpact}%` : `${impact.shiftImpact}%`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Cooling Mitigation</div>
                <div className={impact.mitigationImpact > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {impact.mitigationImpact > 0 ? `+${impact.mitigationImpact}%` : `${impact.mitigationImpact}%`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Apparent Heat Category</div>
                <div className="text-amber-300 font-bold truncate">
                  {impact.heatCategory.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

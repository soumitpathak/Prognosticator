import React, { useState } from 'react';
import {
  Heart,
  Thermometer,
  ShieldAlert,
  Activity,
  Sliders,
  Filter,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Volume2,
  Sun,
  Wind,
  Wrench,
  Sparkles,
  Info,
  X,
  Radio,
  Layers,
  Clock
} from 'lucide-react';

export interface SignalCategoryState {
  cardiac: boolean;
  environmental: boolean;
  performance: boolean;
}

export interface GranularSignalState {
  // Cardiac
  heartRate: boolean;
  hrv: boolean;
  hrvDrop: boolean;
  bloodPressure: boolean;

  // Environmental
  skinTemp: boolean;
  ambientTemp: boolean;
  twl: boolean;
  noise: boolean;
  aqi: boolean;

  // Performance
  riskScore: boolean;
  stressScore: boolean;
  equipmentVibration: boolean;
  incidentProjections: boolean;
}

export const DEFAULT_SIGNAL_CATEGORIES: SignalCategoryState = {
  cardiac: true,
  environmental: true,
  performance: true
};

export const DEFAULT_GRANULAR_SIGNALS: GranularSignalState = {
  heartRate: true,
  hrv: true,
  hrvDrop: true,
  bloodPressure: true,
  skinTemp: true,
  ambientTemp: true,
  twl: true,
  noise: true,
  aqi: true,
  riskScore: true,
  stressScore: true,
  equipmentVibration: true,
  incidentProjections: true
};

interface SignalCategoryFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: SignalCategoryState;
  onToggleCategory: (category: keyof SignalCategoryState) => void;
  granularSignals: GranularSignalState;
  onToggleSignal: (signalKey: keyof GranularSignalState) => void;
  onResetFilters: () => void;
  onSelectAllSignals: () => void;
  showMovingAverages: boolean;
  onToggleMovingAverages: () => void;
  maWindowHours?: number;
  onChangeMaWindow?: (hours: number) => void;
  isAccessibilityMode?: boolean;
  onToggleAccessibilityMode?: () => void;
  className?: string;
}

export default function SignalCategoryFilterSidebar({
  isOpen,
  onClose,
  categories,
  onToggleCategory,
  granularSignals,
  onToggleSignal,
  onResetFilters,
  onSelectAllSignals,
  showMovingAverages,
  onToggleMovingAverages,
  maWindowHours = 4,
  onChangeMaWindow,
  isAccessibilityMode = false,
  onToggleAccessibilityMode,
  className = ''
}: SignalCategoryFilterSidebarProps) {
  // Collapsible category accordions
  const [expandedSections, setExpandedSections] = useState<{
    cardiac: boolean;
    environmental: boolean;
    performance: boolean;
  }>({
    cardiac: true,
    environmental: true,
    performance: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalActiveSignals = Object.values(granularSignals).filter(Boolean).length;
  const totalSignals = Object.keys(granularSignals).length;

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Signal Category Filters Sidebar"
      className={`fixed top-0 left-0 bottom-0 z-50 w-80 md:w-92 bg-slate-950/95 border-r border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col font-sans transition-all duration-300 animate-in slide-in-from-left no-print ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 text-cyan-400 shadow-sm">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Signal Category Filter</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {totalActiveSignals}/{totalSignals}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Filter specific telemetry categories across charts &amp; widgets
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close filter sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Global Historical Moving Average Degradation Controller */}
      <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-b border-purple-500/30">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-purple-500/20 text-purple-300">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Historical Moving Averages
              </span>
              <span className="text-[10px] text-purple-300/80 font-mono">
                Long-Term Signal Degradation
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={onToggleMovingAverages}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              showMovingAverages ? 'bg-purple-600' : 'bg-slate-800'
            }`}
            title="Toggle historical moving average overlays across all chart components"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                showMovingAverages ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-[10px] text-slate-400 leading-snug">
          Overlays smoothed rolling baselines to identify subtle multi-hour autonomic fatigue and heat strain degradation.
        </p>

        {showMovingAverages && onChangeMaWindow && (
          <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Rolling Window:</span>
            <div className="flex items-center space-x-1">
              {[2, 4, 8].map((h) => (
                <button
                  key={h}
                  onClick={() => onChangeMaWindow(h)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    maWindowHours === h
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global Accessibility Mode Card */}
      {onToggleAccessibilityMode && (
        <div className="mx-3.5 mb-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-md bg-amber-900/60 border border-amber-500/50 text-amber-300">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Accessibility Mode</span>
                <span className="text-[10px] text-amber-300/80 font-mono">High-Contrast Light</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAccessibilityMode}
              onClick={onToggleAccessibilityMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isAccessibilityMode ? 'bg-amber-500' : 'bg-slate-800'
              }`}
              title="Toggle global Accessibility Mode (.manager-high-contrast-light on root element)"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAccessibilityMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Applies <code className="text-amber-300 font-mono">.manager-high-contrast-light</code> to the root element for visually impaired users.
          </p>
        </div>
      )}

      {/* Main Filter Accordion Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Quick Bulk Actions */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pb-1">
          <span>Active Filter Channels</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAllSignals}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={onResetFilters}
              className="text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 1. CARDIAC SIGNALS CATEGORY */}
        <div className={`rounded-xl border transition-all ${
          categories.cardiac
            ? 'bg-slate-900/80 border-rose-500/40 shadow-xs'
            : 'bg-slate-950/40 border-slate-800 opacity-60'
        }`}>
          {/* Category Master Header */}
          <div className="p-3 flex items-center justify-between">
            <div
              onClick={() => toggleSection('cardiac')}
              className="flex items-center space-x-2.5 cursor-pointer select-none flex-1"
            >
              <div className={`p-1.5 rounded-lg border ${
                categories.cardiac
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Heart className={`h-4 w-4 ${categories.cardiac ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Cardiac &amp; Autonomic
                  </span>
                  <span className="text-[10px] font-mono px-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Vital
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  HR, HRV, Arterial Pressure
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Category Master Toggle */}
              <button
                type="button"
                onClick={() => onToggleCategory('cardiac')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border ${
                  categories.cardiac
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={categories.cardiac ? 'Disable all cardiac signals' : 'Enable all cardiac signals'}
              >
                {categories.cardiac ? 'VISIBLE' : 'HIDDEN'}
              </button>

              <button
                onClick={() => toggleSection('cardiac')}
                className="text-slate-400 hover:text-white p-0.5"
              >
                {expandedSections.cardiac ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Granular Sub-Signals */}
          {expandedSections.cardiac && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-rose-400" />
                  <span>Heart Rate (Pulse BPM)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.heartRate}
                  onChange={() => onToggleSignal('heartRate')}
                  disabled={!categories.cardiac}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Heart Rate Variability (HRV / RMSSD)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.hrv}
                  onChange={() => onToggleSignal('hrv')}
                  disabled={!categories.cardiac}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  <span>HRV Drop Rate (% Deviation)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.hrvDrop}
                  onChange={() => onToggleSignal('hrvDrop')}
                  disabled={!categories.cardiac}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-purple-400" />
                  <span>Arterial Blood Pressure (Systolic/Diastolic)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.bloodPressure}
                  onChange={() => onToggleSignal('bloodPressure')}
                  disabled={!categories.cardiac}
                  className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>
            </div>
          )}
        </div>

        {/* 2. ENVIRONMENTAL & THERMAL SIGNALS CATEGORY */}
        <div className={`rounded-xl border transition-all ${
          categories.environmental
            ? 'bg-slate-900/80 border-amber-500/40 shadow-xs'
            : 'bg-slate-950/40 border-slate-800 opacity-60'
        }`}>
          {/* Category Master Header */}
          <div className="p-3 flex items-center justify-between">
            <div
              onClick={() => toggleSection('environmental')}
              className="flex items-center space-x-2.5 cursor-pointer select-none flex-1"
            >
              <div className={`p-1.5 rounded-lg border ${
                categories.environmental
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Environmental &amp; Thermal
                  </span>
                  <span className="text-[10px] font-mono px-1.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Ambient
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Temp, TWL, Noise, AQI
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Category Master Toggle */}
              <button
                type="button"
                onClick={() => onToggleCategory('environmental')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border ${
                  categories.environmental
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={categories.environmental ? 'Disable all environmental signals' : 'Enable all environmental signals'}
              >
                {categories.environmental ? 'VISIBLE' : 'HIDDEN'}
              </button>

              <button
                onClick={() => toggleSection('environmental')}
                className="text-slate-400 hover:text-white p-0.5"
              >
                {expandedSections.environmental ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Granular Sub-Signals */}
          {expandedSections.environmental && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                  <span>Skin &amp; Core Temperature (°C)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.skinTemp}
                  onChange={() => onToggleSignal('skinTemp')}
                  disabled={!categories.environmental}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ambient Workplace Temp (°C)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.ambientTemp}
                  onChange={() => onToggleSignal('ambientTemp')}
                  disabled={!categories.environmental}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Thermal Work Limit (TWL W/m²)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.twl}
                  onChange={() => onToggleSignal('twl')}
                  disabled={!categories.environmental}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-orange-400" />
                  <span>Acoustic Noise Dosimetry (dBA)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.noise}
                  onChange={() => onToggleSignal('noise')}
                  disabled={!categories.environmental}
                  className="rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Wind className="h-3.5 w-3.5 text-teal-400" />
                  <span>Air Quality Index (AQI PM2.5)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.aqi}
                  onChange={() => onToggleSignal('aqi')}
                  disabled={!categories.environmental}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>
            </div>
          )}
        </div>

        {/* 3. PERFORMANCE & OPERATIONAL SIGNALS CATEGORY */}
        <div className={`rounded-xl border transition-all ${
          categories.performance
            ? 'bg-slate-900/80 border-purple-500/40 shadow-xs'
            : 'bg-slate-950/40 border-slate-800 opacity-60'
        }`}>
          {/* Category Master Header */}
          <div className="p-3 flex items-center justify-between">
            <div
              onClick={() => toggleSection('performance')}
              className="flex items-center space-x-2.5 cursor-pointer select-none flex-1"
            >
              <div className={`p-1.5 rounded-lg border ${
                categories.performance
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Performance &amp; Risk
                  </span>
                  <span className="text-[10px] font-mono px-1.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Engine
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Risk Score, Vibration, Projections
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Category Master Toggle */}
              <button
                type="button"
                onClick={() => onToggleCategory('performance')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border ${
                  categories.performance
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={categories.performance ? 'Disable all performance signals' : 'Enable all performance signals'}
              >
                {categories.performance ? 'VISIBLE' : 'HIDDEN'}
              </button>

              <button
                onClick={() => toggleSection('performance')}
                className="text-slate-400 hover:text-white p-0.5"
              >
                {expandedSections.performance ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Granular Sub-Signals */}
          {expandedSections.performance && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
                  <span>Composite Risk Score (%)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.riskScore}
                  onChange={() => onToggleSignal('riskScore')}
                  disabled={!categories.performance}
                  className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Autonomic Stress Index (0-100)</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.stressScore}
                  onChange={() => onToggleSignal('stressScore')}
                  disabled={!categories.performance}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  <span>Machinery Vibration &amp; Bearing Temp</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.equipmentVibration}
                  onChange={() => onToggleSignal('equipmentVibration')}
                  disabled={!categories.performance}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-slate-800/40 px-1.5 rounded">
                <span className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Forward Incident Likelihood Projections</span>
                </span>
                <input
                  type="checkbox"
                  checked={granularSignals.incidentProjections}
                  onChange={() => onToggleSignal('incidentProjections')}
                  disabled={!categories.performance}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>Sentinel: Dynamic Sync</span>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

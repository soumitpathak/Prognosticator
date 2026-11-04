import React, { useState } from 'react';
import { HealthSignalNotificationThresholds, FacilityZone } from '../types';
import {
  Sliders,
  X,
  Heart,
  Thermometer,
  Volume2,
  ShieldAlert,
  Sun,
  Activity,
  Bell,
  Radio,
  CheckCircle2,
  RotateCcw,
  Save,
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  VolumeX
} from 'lucide-react';

export const DEFAULT_HEALTH_THRESHOLDS: HealthSignalNotificationThresholds = {
  minHrvMs: 40,
  maxHrvDropPct: 25,
  maxSkinTempC: 37.8,
  maxAmbientHeatC: 36.0,
  maxNoiseDb: 85.0,
  minTwlIndex: 115,
  riskScoreCutoffPct: 65,
  maxHeartRateBpm: 120,
  enableSmsRadioDispatch: true,
  enableVoiceAlerts: true,
  enableInAppBeacon: true,
  applicableZoneId: 'ALL'
};

interface HealthThresholdsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: HealthSignalNotificationThresholds;
  onSaveThresholds: (
    updatedThresholds: HealthSignalNotificationThresholds,
    justification: string
  ) => void;
  zones: FacilityZone[];
  activeZoneId?: string;
}

export default function HealthThresholdsConfigModal({
  isOpen,
  onClose,
  currentThresholds,
  onSaveThresholds,
  zones,
  activeZoneId = 'ALL'
}: HealthThresholdsConfigModalProps) {
  const [thresholds, setThresholds] = useState<HealthSignalNotificationThresholds>(currentThresholds);
  const [justification, setJustification] = useState<string>(
    'Scheduled workforce health baseline recalibration pursuant to occupational safety guidelines.'
  );
  const [activeTab, setActiveTab] = useState<'PHYSIOLOGICAL' | 'ENVIRONMENTAL' | 'CHANNELS'>('PHYSIOLOGICAL');

  if (!isOpen) return null;

  // Preset Configurations
  const applyPreset = (presetName: 'OSHA_STANDARD' | 'HIGH_HEAT' | 'ACOUSTIC_HEAVY' | 'INDOOR_CONTROLLED') => {
    switch (presetName) {
      case 'OSHA_STANDARD':
        setThresholds({
          ...thresholds,
          minHrvMs: 40,
          maxHrvDropPct: 25,
          maxSkinTempC: 37.8,
          maxAmbientHeatC: 36.0,
          maxNoiseDb: 85.0,
          minTwlIndex: 115,
          riskScoreCutoffPct: 65
        });
        setJustification('Applied Standard OSHA & ISO 10816 baseline thresholds.');
        break;
      case 'HIGH_HEAT':
        setThresholds({
          ...thresholds,
          minHrvMs: 46,
          maxHrvDropPct: 20,
          maxSkinTempC: 37.4,
          maxAmbientHeatC: 34.0,
          maxNoiseDb: 85.0,
          minTwlIndex: 125,
          riskScoreCutoffPct: 55
        });
        setJustification('Heightened extreme ambient solar heatwave protocol: Lowered thermal trigger thresholds.');
        break;
      case 'ACOUSTIC_HEAVY':
        setThresholds({
          ...thresholds,
          minHrvMs: 42,
          maxHrvDropPct: 25,
          maxSkinTempC: 37.8,
          maxAmbientHeatC: 36.0,
          maxNoiseDb: 82.0, // Stricter noise limit
          minTwlIndex: 115,
          riskScoreCutoffPct: 60
        });
        setJustification('Heavy pneumatic drilling / pile-driving shift: Stringent noise exposure limits enforced.');
        break;
      case 'INDOOR_CONTROLLED':
        setThresholds({
          ...thresholds,
          minHrvMs: 36,
          maxHrvDropPct: 30,
          maxSkinTempC: 38.0,
          maxAmbientHeatC: 38.0,
          maxNoiseDb: 80.0,
          minTwlIndex: 135,
          riskScoreCutoffPct: 75
        });
        setJustification('Indoor climate-controlled cleanroom assembly: Adjusted for low-strain environment.');
        break;
    }
  };

  const handleSave = () => {
    onSaveThresholds(thresholds, justification);
    onClose();
  };

  const handleReset = () => {
    setThresholds(DEFAULT_HEALTH_THRESHOLDS);
    setJustification('Reset workforce health notification thresholds to factory OSHA/ISO defaults.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-xl text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Workforce Health Signal Thresholds
                </h2>
                <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  EHS Rule Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure custom trigger cutoffs for physiological autonomic fatigue, heat strain, and environmental hazards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Profiles Bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Operational Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => applyPreset('OSHA_STANDARD')}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition"
            >
              OSHA/ISO Baseline
            </button>
            <button
              onClick={() => applyPreset('HIGH_HEAT')}
              className="px-2.5 py-1 rounded-md bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Sun className="h-3 w-3 text-amber-400" />
              <span>Solar Heatwave</span>
            </button>
            <button
              onClick={() => applyPreset('ACOUSTIC_HEAVY')}
              className="px-2.5 py-1 rounded-md bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Volume2 className="h-3 w-3 text-rose-400" />
              <span>Heavy Acoustic</span>
            </button>
            <button
              onClick={() => applyPreset('INDOOR_CONTROLLED')}
              className="px-2.5 py-1 rounded-md bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition"
            >
              Indoor Climate
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-5 pt-2">
          <button
            onClick={() => setActiveTab('PHYSIOLOGICAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'PHYSIOLOGICAL'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="h-4 w-4 text-cyan-400" />
            <span>Physiological Autonomic Signals</span>
          </button>
          <button
            onClick={() => setActiveTab('ENVIRONMENTAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'ENVIRONMENTAL'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="h-4 w-4 text-amber-400" />
            <span>Environmental Hazard Exposures</span>
          </button>
          <button
            onClick={() => setActiveTab('CHANNELS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'CHANNELS'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="h-4 w-4 text-rose-400" />
            <span>Notification &amp; Triage Dispatch</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PHYSIOLOGICAL SIGNALS */}
          {activeTab === 'PHYSIOLOGICAL' && (
            <div className="space-y-6">
              {/* Signal 1: Minimum HRV Floor */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Minimum Heart Rate Variability (HRV Floor)</h4>
                      <p className="text-xs text-slate-400">
                        Parasympathetic tone cutoff. Drops below this threshold indicate acute cardiac and autonomic fatigue.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-cyan-400">{thresholds.minHrvMs} ms</span>
                    <span className="text-[10px] text-slate-500 block">Nominal: 68 ms</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">25ms</span>
                  <input
                    type="range"
                    min="25"
                    max="60"
                    step="1"
                    value={thresholds.minHrvMs}
                    onChange={(e) => setThresholds({ ...thresholds, minHrvMs: Number(e.target.value) })}
                    className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">60ms</span>
                </div>
              </div>

              {/* Signal 2: Max Allowable HRV Drop Percentage */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-rose-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Maximum Allowable HRV Drop Percentage</h4>
                      <p className="text-xs text-slate-400">
                        Percentage drop from individual worker baseline triggering an immediate fatigue notification.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-rose-400">{thresholds.maxHrvDropPct}% Drop</span>
                    <span className="text-[10px] text-slate-500 block">Standard: 25%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">10%</span>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={thresholds.maxHrvDropPct}
                    onChange={(e) => setThresholds({ ...thresholds, maxHrvDropPct: Number(e.target.value) })}
                    className="flex-1 accent-rose-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">50%</span>
                </div>
              </div>

              {/* Signal 3: Worker Core / Skin Temperature Limit */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Worker Core / Skin Temperature Limit</h4>
                      <p className="text-xs text-slate-400">
                        Maximum permissible sustained worker skin temperature before hyperthermia alert is staged.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-amber-400">{thresholds.maxSkinTempC.toFixed(1)}°C</span>
                    <span className="text-[10px] text-slate-500 block">Baseline: 36.5°C</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">36.8°C</span>
                  <input
                    type="range"
                    min="36.8"
                    max="39.2"
                    step="0.1"
                    value={thresholds.maxSkinTempC}
                    onChange={(e) => setThresholds({ ...thresholds, maxSkinTempC: Number(e.target.value) })}
                    className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">39.2°C</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENVIRONMENTAL SIGNALS */}
          {activeTab === 'ENVIRONMENTAL' && (
            <div className="space-y-6">
              {/* Signal 4: Ambient Heat Index / WBGT */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Ambient Heat Index / Wet-Bulb Cutoff</h4>
                      <p className="text-xs text-slate-400">
                        Microclimate solar apparent heat index triggering automatic zone rest breaks.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-amber-400">{thresholds.maxAmbientHeatC.toFixed(1)}°C</span>
                    <span className="text-[10px] text-slate-500 block">Extreme: &ge; 40.0°C</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">30°C</span>
                  <input
                    type="range"
                    min="30"
                    max="46"
                    step="0.5"
                    value={thresholds.maxAmbientHeatC}
                    onChange={(e) => setThresholds({ ...thresholds, maxAmbientHeatC: Number(e.target.value) })}
                    className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">46°C</span>
                </div>
              </div>

              {/* Signal 5: Acoustic Noise Limit (dBA) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-rose-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Acoustic Machinery Permissible Limit</h4>
                      <p className="text-xs text-slate-400">
                        Continuous industrial noise pressure threshold (OSHA Action Level: 85 dBA, Rupture: 105 dBA).
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-rose-400">{thresholds.maxNoiseDb.toFixed(1)} dBA</span>
                    <span className="text-[10px] text-slate-500 block">OSHA Limit: 85.0</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">75 dBA</span>
                  <input
                    type="range"
                    min="75"
                    max="105"
                    step="1"
                    value={thresholds.maxNoiseDb}
                    onChange={(e) => setThresholds({ ...thresholds, maxNoiseDb: Number(e.target.value) })}
                    className="flex-1 accent-rose-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">105 dBA</span>
                </div>
              </div>

              {/* Signal 6: Minimum Thermal Work Limit (TWL) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Minimum Thermal Work Limit (TWL Floor)</h4>
                      <p className="text-xs text-slate-400">
                        Evaporative metabolic cooling capability limit (W/m²). Values below 115 W/m² indicate severe heat accumulation.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-cyan-400">{thresholds.minTwlIndex} W/m²</span>
                    <span className="text-[10px] text-slate-500 block">Critical: &lt; 100</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">80</span>
                  <input
                    type="range"
                    min="80"
                    max="150"
                    step="5"
                    value={thresholds.minTwlIndex}
                    onChange={(e) => setThresholds({ ...thresholds, minTwlIndex: Number(e.target.value) })}
                    className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">150</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & DISPATCH */}
          {activeTab === 'CHANNELS' && (
            <div className="space-y-6">
              {/* Anomaly Model Risk Score Cutoff */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Composite Anomaly Risk Score Cutoff</h4>
                      <p className="text-xs text-slate-400">
                        LSTM-Kalman probability threshold required to classify a deviation as Critical.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-purple-400">{thresholds.riskScoreCutoffPct}%</span>
                    <span className="text-[10px] text-slate-500 block">Default: 65%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-mono w-10">45%</span>
                  <input
                    type="range"
                    min="45"
                    max="85"
                    step="5"
                    value={thresholds.riskScoreCutoffPct}
                    onChange={(e) => setThresholds({ ...thresholds, riskScoreCutoffPct: Number(e.target.value) })}
                    className="flex-1 accent-purple-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">85%</span>
                </div>
              </div>

              {/* Notification Channel Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Automated Alert Escalation Channels
                </h4>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">In-App Visual Warning Beacon</span>
                      <span className="text-[11px] text-slate-400">Pulsing top banner and active anomalies widget alert</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={thresholds.enableInAppBeacon}
                    onChange={(e) => setThresholds({ ...thresholds, enableInAppBeacon: e.target.checked })}
                    className="h-4 w-4 rounded accent-cyan-500 bg-slate-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition">
                  <div className="flex items-center space-x-3">
                    <Radio className="h-4 w-4 text-rose-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">Automated Dual-Channel SMS / Radio Triage</span>
                      <span className="text-[11px] text-slate-400">Stages immediate dispatch order to on-site cooling/audiology crew</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={thresholds.enableSmsRadioDispatch}
                    onChange={(e) => setThresholds({ ...thresholds, enableSmsRadioDispatch: e.target.checked })}
                    className="h-4 w-4 rounded accent-rose-500 bg-slate-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="h-4 w-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">Audible Synthesized Voice Broadcast</span>
                      <span className="text-[11px] text-slate-400">Web Audio chime followed by natural voice announcement</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={thresholds.enableVoiceAlerts}
                    onChange={(e) => setThresholds({ ...thresholds, enableVoiceAlerts: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500 bg-slate-800"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Scope Selection: Target Facility Zone */}
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Application Scope:
            </label>
            <select
              value={thresholds.applicableZoneId}
              onChange={(e) => setThresholds({ ...thresholds, applicableZoneId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Apply Universally across All Monitored Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Target Specific Zone: {z.name} (N={z.count})
                </option>
              ))}
            </select>
          </div>

          {/* Compliance Justification Field */}
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              Corporate EHS Compliance Justification (Mandatory Audit Trail):
            </label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Recalibration for shift 2 extreme weather advisory..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply Custom Thresholds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

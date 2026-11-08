import React, { useState } from 'react';
import { KalmanSensitivityConfig, SensitivityPreset, VoiceAlertSettings } from '../types';
import {
  Sliders,
  Settings,
  ShieldAlert,
  CheckCircle2,
  X,
  RotateCcw,
  Gauge,
  Sparkles,
  Info,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import { voiceAlertService } from '../services/voiceAlertService';

interface KalmanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: KalmanSensitivityConfig;
  onSaveConfig: (newConfig: KalmanSensitivityConfig) => void;
  voiceSettings?: VoiceAlertSettings;
  onUpdateVoiceSettings?: (newSettings: VoiceAlertSettings) => void;
  onOpenVoiceModal?: () => void;
}

export const DEFAULT_KALMAN_CONFIG: KalmanSensitivityConfig = {
  preset: 'MEDIUM',
  processVarianceQ: 0.01,
  measurementVarianceR: 0.1,
  criticalCutoffPct: 75,
  moderateCutoffPct: 40,
  autoImputeMissing: true,
  suppressSmallCells: true
};

export default function KalmanSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  voiceSettings,
  onUpdateVoiceSettings,
  onOpenVoiceModal
}: KalmanSettingsModalProps) {
  const [config, setConfig] = useState<KalmanSensitivityConfig>(currentConfig);
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState<boolean>(voiceSettings?.enabled ?? true);
  const [testStatus, setTestStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: SensitivityPreset) => {
    if (preset === 'HIGH') {
      setConfig({
        preset: 'HIGH',
        processVarianceQ: 0.02,
        measurementVarianceR: 0.05,
        criticalCutoffPct: 60,
        moderateCutoffPct: 30,
        autoImputeMissing: true,
        suppressSmallCells: true
      });
    } else if (preset === 'MEDIUM') {
      setConfig(DEFAULT_KALMAN_CONFIG);
    } else if (preset === 'LOW') {
      setConfig({
        preset: 'LOW',
        processVarianceQ: 0.005,
        measurementVarianceR: 0.25,
        criticalCutoffPct: 85,
        moderateCutoffPct: 55,
        autoImputeMissing: true,
        suppressSmallCells: true
      });
    } else {
      setConfig((prev) => ({ ...prev, preset: 'CUSTOM' }));
    }
  };

  const handleToggleVoiceAlerts = (checked: boolean) => {
    setLocalVoiceEnabled(checked);
    if (onUpdateVoiceSettings && voiceSettings) {
      onUpdateVoiceSettings({
        ...voiceSettings,
        enabled: checked
      });
    }
  };

  const handleTestCriticalVoiceAlert = async () => {
    setTestStatus('Speaking critical anomaly alert...');
    try {
      if (voiceAlertService.isSupported()) {
        await voiceAlertService.speakRawText(
          'Priority One Critical Alert: Severe cardiovascular autonomic deceleration and core temperature 38.6 degrees Celsius in Outdoor Construction Sector 4. Immediate cooling extraction required.',
          voiceSettings || {
            enabled: true,
            volume: 1.0,
            rate: 1.05,
            pitch: 1.0,
            announceCriticalOnly: false,
            chimeSound: true,
            selectedVoiceName: '',
            severityAudioToggles: { CRITICAL: true, HIGH: true, MODERATE: true, LOW: false }
          }
        );
        setTestStatus('Voice playback completed.');
        setTimeout(() => setTestStatus(''), 4000);
      } else {
        setTestStatus('SpeechSynthesis API not supported.');
      }
    } catch {
      setTestStatus('Speech synthesis playback error.');
    }
  };

  const handleSave = () => {
    onSaveConfig(config);
    if (onUpdateVoiceSettings && voiceSettings) {
      onUpdateVoiceSettings({
        ...voiceSettings,
        enabled: localVoiceEnabled
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Kalman Anomaly Sensitivity &amp; Threshold Settings
              </h3>
              <p className="text-xs text-slate-400">
                Calibrate 1D recursive Kalman noise parameters and LSTM risk classification cutoffs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Preset Cards (High / Medium / Low) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2.5">
              Anomaly Sensitivity Profile
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* HIGH */}
              <div
                onClick={() => handleSelectPreset('HIGH')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  config.preset === 'HIGH'
                    ? 'bg-rose-500/15 border-rose-500/60 text-white shadow-md shadow-rose-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-rose-400">HIGH</span>
                    {config.preset === 'HIGH' && <CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Early warning focus. Triggers at 60% probability. Maximum lead time.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-rose-300">
                  Cutoff: &gt;60%
                </div>
              </div>

              {/* MEDIUM */}
              <div
                onClick={() => handleSelectPreset('MEDIUM')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  config.preset === 'MEDIUM'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-md shadow-cyan-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-cyan-400">MEDIUM (Standard)</span>
                    {config.preset === 'MEDIUM' && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Balanced industrial threshold. Triggers at 75% with 3.8h clinical lead time.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-300">
                  Cutoff: &gt;75%
                </div>
              </div>

              {/* LOW */}
              <div
                onClick={() => handleSelectPreset('LOW')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  config.preset === 'LOW'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md shadow-amber-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-amber-400">LOW</span>
                    {config.preset === 'LOW' && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Heavy damping. Triggers only on acute severe collapse (&gt;85%).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-amber-300">
                  Cutoff: &gt;85%
                </div>
              </div>
            </div>
          </div>

          {/* Granular Sliders (Active if Custom or fine-tuning) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-cyan-400" /> Granular Parameter Tuning
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Active Profile: <strong className="text-white">{config.preset}</strong>
              </span>
            </div>

            {/* Critical Cutoff */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Critical Risk Cutoff Threshold:</span>
                <span className="font-mono text-rose-400 font-bold">{config.criticalCutoffPct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                value={config.criticalCutoffPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    criticalCutoffPct: val,
                    preset: 'CUSTOM'
                  }));
                }}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>50% (Very Aggressive)</span>
                <span>75% (Nominal)</span>
                <span>90% (Strictly Emergency)</span>
              </div>
            </div>

            {/* Moderate Cutoff */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Moderate Risk Cutoff Threshold:</span>
                <span className="font-mono text-amber-400 font-bold">{config.moderateCutoffPct}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                value={config.moderateCutoffPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    moderateCutoffPct: val,
                    preset: 'CUSTOM'
                  }));
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Kalman Measurement Noise R */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Kalman Measurement Noise Covariance ($R$):</span>
                <span className="font-mono text-cyan-400 font-bold">{config.measurementVarianceR.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.02}
                max={0.35}
                step={0.01}
                value={config.measurementVarianceR}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    measurementVarianceR: val,
                    preset: 'CUSTOM'
                  }));
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Higher $R$ increases Kalman smoothing, damping harsh electromagnetic sensor spikes.
              </p>
            </div>
          </div>

          {/* Accessibility & Speech-to-Text Audio Alerts Section (SpeechSynthesis API) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-white flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-cyan-400" />
                <span>Accessibility &amp; Speech-to-Text Audio Alerts</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full font-bold">
                SpeechSynthesis API
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-xs">
                    Spoken Audio Alerts for New Critical Health Anomalies
                  </span>
                  {localVoiceEnabled && (
                    <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Synthesizes spoken audio announcements aloud using the browser's native <code className="text-cyan-300 font-mono">SpeechSynthesis</code> API whenever a new critical health anomaly is detected. Provides hands-free accessibility for field supervisors without requiring continuous screen monitoring.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localVoiceEnabled}
                  onChange={(e) => handleToggleVoiceAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* Test Voice Announcement Button & Advanced Config Link */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900">
              <button
                type="button"
                onClick={handleTestCriticalVoiceAlert}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 transition cursor-pointer shadow-xs"
                title="Test SpeechSynthesis audio playback for a sample critical health anomaly"
              >
                <Play className="h-3.5 w-3.5 text-indigo-400" />
                <span>Test Critical Speech Alert</span>
              </button>

              {testStatus && (
                <span className="text-[11px] text-cyan-300 font-mono animate-pulse">
                  {testStatus}
                </span>
              )}

              {onOpenVoiceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVoiceModal();
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                >
                  Advanced Voice &amp; Speed Settings &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>State-Space Operational Impact:</strong> Adjusting sensitivity dynamically recalibrates the LSTM Autoencoder reconstruction MSE trigger threshold. High sensitivity is recommended during acute heatwaves and high-exertion shifts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setConfig(DEFAULT_KALMAN_CONFIG)}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset to Defaults</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-5 py-2 rounded-lg transition shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Apply Sensitivity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

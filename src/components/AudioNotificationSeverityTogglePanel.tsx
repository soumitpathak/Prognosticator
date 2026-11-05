import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  Play,
  Bell,
  BellOff,
  Sparkles,
  Zap
} from 'lucide-react';
import { SeverityAudioToggles, VoiceAlertSettings } from '../types';
import { voiceAlertService } from '../services/voiceAlertService';

interface AudioNotificationSeverityTogglePanelProps {
  voiceSettings: VoiceAlertSettings;
  onUpdateVoiceSettings: (newSettings: VoiceAlertSettings) => void;
  onLogAuditAction?: (category: string, action: string, justification: string) => void;
}

export default function AudioNotificationSeverityTogglePanel({
  voiceSettings,
  onUpdateVoiceSettings,
  onLogAuditAction
}: AudioNotificationSeverityTogglePanelProps) {
  const [testingSeverity, setTestingSeverity] = useState<string | null>(null);

  const toggles: SeverityAudioToggles = voiceSettings.severityAudioToggles || {
    CRITICAL: true,
    HIGH: true,
    MODERATE: true,
    LOW: false
  };

  const handleToggleSeverity = (level: keyof SeverityAudioToggles) => {
    const updatedToggles: SeverityAudioToggles = {
      ...toggles,
      [level]: !toggles[level]
    };

    const newSettings: VoiceAlertSettings = {
      ...voiceSettings,
      severityAudioToggles: updatedToggles
    };

    onUpdateVoiceSettings(newSettings);

    if (onLogAuditAction) {
      onLogAuditAction(
        'THRESHOLD_CHANGE',
        `Audio alert for ${level} severity set to ${updatedToggles[level] ? 'ENABLED' : 'MUTED'}`,
        'Safety supervisor modified real-time acoustic alert dispatch permissions.'
      );
    }
  };

  const handleToggleMasterMute = () => {
    const isMasterEnabled = voiceSettings.enabled;
    const newSettings: VoiceAlertSettings = {
      ...voiceSettings,
      enabled: !isMasterEnabled
    };

    onUpdateVoiceSettings(newSettings);

    if (onLogAuditAction) {
      onLogAuditAction(
        'THRESHOLD_CHANGE',
        `Master audio alerts ${!isMasterEnabled ? 'ENABLED' : 'MUTED'}`,
        'Supervisor toggled platform-wide acoustic broadcast.'
      );
    }
  };

  const handleSetAllLevels = (enable: boolean) => {
    const updatedToggles: SeverityAudioToggles = {
      CRITICAL: enable,
      HIGH: enable,
      MODERATE: enable,
      LOW: enable
    };

    const newSettings: VoiceAlertSettings = {
      ...voiceSettings,
      enabled: enable ? true : voiceSettings.enabled,
      severityAudioToggles: updatedToggles
    };

    onUpdateVoiceSettings(newSettings);

    if (onLogAuditAction) {
      onLogAuditAction(
        'THRESHOLD_CHANGE',
        `All severity audio alert channels ${enable ? 'UNMUTED' : 'MUTED'}`,
        'Supervisor batch-configured alert notification sound matrix.'
      );
    }
  };

  const handleTestSeverityAudio = async (level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW') => {
    setTestingSeverity(level);
    try {
      // Play chime tone
      await voiceAlertService.playAlertChime(level);

      // Play voice announcement sample if voice is enabled
      if (voiceSettings.enabled) {
        const sampleText =
          level === 'CRITICAL'
            ? 'Priority One Critical Alert. Core heat strain breach detected in Sector Four.'
            : level === 'HIGH'
            ? 'High Severity Notice. Acoustic limit exceeded in Sector Four.'
            : level === 'MODERATE'
            ? 'Moderate Advisory. Circadian fatigue threshold reached.'
            : 'Low Severity Telemetry Advisory. Minor sensor variance filtered.';

        await voiceAlertService.speakRawText(sampleText, voiceSettings);
      }
    } finally {
      setTestingSeverity(null);
    }
  };

  const activeCount = Object.values(toggles).filter(Boolean).length;

  return (
    <div
      id="audio-notification-severity-toggle-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6"
    >
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border shadow-xs shrink-0 transition-colors ${
              voiceSettings.enabled
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-950 border-slate-700 text-slate-500'
            }`}
          >
            {voiceSettings.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-wide">
                Real-Time Audio Alerts Severity Toggles
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                  voiceSettings.enabled && activeCount > 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                }`}
              >
                {voiceSettings.enabled
                  ? `${activeCount} of 4 Severity Levels Audible`
                  : 'Master Audio Muted'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granularly mute or enable synthesized warning chimes and voice broadcasts per anomaly severity tier to eliminate alarm fatigue while protecting high-urgency incidents.
            </p>
          </div>
        </div>

        {/* Master Audio Control Switch & Batch Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleSetAllLevels(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Enable audio notifications for all 4 severity levels"
          >
            Enable All
          </button>
          <button
            onClick={() => handleSetAllLevels(false)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Mute audio notifications across all severity levels"
          >
            Mute All Levels
          </button>

          <button
            onClick={handleToggleMasterMute}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              voiceSettings.enabled
                ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {voiceSettings.enabled ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{voiceSettings.enabled ? 'Master Mute' : 'Master Unmute'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid of 4 Severity Level Cards */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. CRITICAL Risk Audio Toggle */}
        <div
          className={`p-4 rounded-xl border transition shadow-xs flex flex-col justify-between ${
            toggles.CRITICAL && voiceSettings.enabled
              ? 'bg-rose-950/30 border-rose-500/50 shadow-rose-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
                Critical Risk (P1)
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  toggles.CRITICAL && voiceSettings.enabled
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                {toggles.CRITICAL && voiceSettings.enabled ? 'AUDIBLE' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Acute cardiovascular strain, severe thermal hyperthermia, or impending machinery catastrophic failure.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mb-3">
              Chime Tone: <span className="text-rose-400 font-semibold">Sawtooth 880Hz &rarr; 659Hz</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => handleToggleSeverity('CRITICAL')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                toggles.CRITICAL && voiceSettings.enabled
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {toggles.CRITICAL && voiceSettings.enabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Audible</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleTestSeverityAudio('CRITICAL')}
              disabled={testingSeverity !== null}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Test audio chime and voice sample for Critical tier"
            >
              <Play className="h-3.5 w-3.5 text-rose-400" />
            </button>
          </div>
        </div>

        {/* 2. HIGH Severity Audio Toggle */}
        <div
          className={`p-4 rounded-xl border transition shadow-xs flex flex-col justify-between ${
            toggles.HIGH && voiceSettings.enabled
              ? 'bg-amber-950/30 border-amber-500/50 shadow-amber-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                High Severity
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  toggles.HIGH && voiceSettings.enabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                {toggles.HIGH && voiceSettings.enabled ? 'AUDIBLE' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Acoustic OSHA overpressure, sustained elevated core heat, or heavy machinery vibration anomalies.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mb-3">
              Chime Tone: <span className="text-amber-400 font-semibold">Sine 740Hz &rarr; 587Hz</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => handleToggleSeverity('HIGH')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                toggles.HIGH && voiceSettings.enabled
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {toggles.HIGH && voiceSettings.enabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Audible</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleTestSeverityAudio('HIGH')}
              disabled={testingSeverity !== null}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Test audio chime and voice sample for High tier"
            >
              <Play className="h-3.5 w-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* 3. MODERATE Risk Audio Toggle */}
        <div
          className={`p-4 rounded-xl border transition shadow-xs flex flex-col justify-between ${
            toggles.MODERATE && voiceSettings.enabled
              ? 'bg-purple-950/30 border-purple-500/50 shadow-purple-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wide">
                <Info className="h-3.5 w-3.5 text-purple-400" />
                Moderate Risk
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  toggles.MODERATE && voiceSettings.enabled
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                {toggles.MODERATE && voiceSettings.enabled ? 'AUDIBLE' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Early autonomic fatigue, cumulative sleep deficits, or preventive hydration pause triggers.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mb-3">
              Chime Tone: <span className="text-purple-400 font-semibold">Sine 523Hz &rarr; 659Hz</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => handleToggleSeverity('MODERATE')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                toggles.MODERATE && voiceSettings.enabled
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {toggles.MODERATE && voiceSettings.enabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Audible</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleTestSeverityAudio('MODERATE')}
              disabled={testingSeverity !== null}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Test audio chime and voice sample for Moderate tier"
            >
              <Play className="h-3.5 w-3.5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* 4. LOW Severity Audio Toggle */}
        <div
          className={`p-4 rounded-xl border transition shadow-xs flex flex-col justify-between ${
            toggles.LOW && voiceSettings.enabled
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-emerald-950/20'
              : 'bg-slate-950/60 border-slate-800 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Low Advisory (Nominal)
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  toggles.LOW && voiceSettings.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                {toggles.LOW && voiceSettings.enabled ? 'AUDIBLE' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Kalman-smoothed transient sensor jitter, baseline noise suppression, and routine periodic pings.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mb-3">
              Chime Tone: <span className="text-emerald-400 font-semibold">Subtle Soft Blip 440Hz</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => handleToggleSeverity('LOW')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                toggles.LOW && voiceSettings.enabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {toggles.LOW && voiceSettings.enabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Audible</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Muted</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleTestSeverityAudio('LOW')}
              disabled={testingSeverity !== null}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Test audio chime and voice sample for Low tier"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            Audio alerts trigger in real time via Web Audio API oscillators and SpeechSynthesis across telemetry and incident streams.
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Default recommendations: Critical &amp; High Active &bull; Low Muted
        </div>
      </div>
    </div>
  );
}

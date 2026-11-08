import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Play,
  Square,
  Sparkles,
  Sliders,
  ShieldAlert,
  BellRing,
  Mic,
  Activity,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { VoiceAlertSettings } from '../types';
import { voiceAlertService } from '../services/voiceAlertService';

interface VoiceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceAlertSettings;
  onUpdateSettings: (newSettings: VoiceAlertSettings) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export default function VoiceAlertsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isSpeaking,
  onStopSpeaking
}: VoiceAlertsModalProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testStatus, setTestStatus] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleTestSpeech = async () => {
    setTestStatus('Synthesizing audio test...');
    try {
      if (settings.chimeSound) {
        await voiceAlertService.playAlertChime();
      }
      await voiceAlertService.speakRawText(
        'Prognosticator Audio Dispatch online. Testing voice alert synthesis for on-site supervisory teams. Critical anomaly voice notification ready.',
        settings
      );
      setTestStatus('Voice playback completed successfully.');
      setTimeout(() => setTestStatus(''), 4000);
    } catch (e) {
      setTestStatus('Playback error. Check browser speech settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl border ${
              settings.enabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Speech-to-Text &amp; Spoken Audio Alerts</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  SpeechSynthesis API
                </span>
                {isSpeaking && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    ACTIVE VOICE BROADCAST
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Browser SpeechSynthesis accessibility audio alerts for new critical health anomalies without requiring continuous screen monitoring
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Master Enable Banner */}
          <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
            settings.enabled
              ? 'bg-cyan-950/30 border-cyan-500/40'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${settings.enabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Spoken Audio Alerts for Critical Anomalies</h4>
                <p className="text-xs text-slate-400">
                  Automatically synthesize spoken verbal warnings via SpeechSynthesis API when new critical health anomalies occur
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Active Speaking Indicator & Stop Button */}
          {isSpeaking && (
            <div className="bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/40 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-0.5 h-5">
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-3"></span>
                  <span className="w-1 bg-cyan-300 rounded-full animate-pulse h-5"></span>
                  <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-2"></span>
                  <span className="w-1 bg-cyan-200 rounded-full animate-pulse h-4"></span>
                </div>
                <span className="text-xs font-semibold text-cyan-200">
                  Synthesizer Currently Broadcasting Audio Stream...
                </span>
              </div>
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop Speaking</span>
              </button>
            </div>
          )}

          {/* Configuration Parameters */}
          <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" /> Speech &amp; Chime Controls
            </h4>

            {/* Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Broadcast Volume</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Spoken Speed (Cadence)</span>
                <span className="text-cyan-400 font-mono font-bold">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.35"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ ...settings, rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Voice Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium block">Synthesizer Voice Engine</label>
              <select
                value={settings.selectedVoiceName || ''}
                onChange={(e) => onUpdateSettings({ ...settings, selectedVoiceName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white p-2.5 focus:ring-1 focus:ring-cyan-400 focus:outline-hidden"
              >
                <option value="">Default Recommended Natural English Voice</option>
                {availableVoices
                  .filter((v) => v.lang.startsWith('en'))
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
            </div>

            {/* Notification Filters */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.announceCriticalOnly}
                  onChange={(e) => onUpdateSettings({ ...settings, announceCriticalOnly: e.target.checked })}
                  className="rounded-md border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 h-4 w-4"
                />
                <span>Only announce <strong>CRITICAL</strong> severity anomalies (suppress High/Moderate alerts)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.chimeSound}
                  onChange={(e) => onUpdateSettings({ ...settings, chimeSound: e.target.checked })}
                  className="rounded-md border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 h-4 w-4"
                />
                <span>Synthesize dual-tone radio attention chime (880Hz &rarr; 660Hz) prior to spoken voice</span>
              </label>
            </div>
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={handleTestSpeech}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Test Voice Announcement</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSettings({ ...settings, enabled: !settings.enabled })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                settings.enabled
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              {settings.enabled ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{settings.enabled ? 'Mute Voice Alerts' : 'Enable Voice Alerts'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

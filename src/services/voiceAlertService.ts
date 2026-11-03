import { ActiveAnomalyAlert, VoiceAlertSettings } from '../types';

export const DEFAULT_VOICE_SETTINGS: VoiceAlertSettings = {
  enabled: true,
  volume: 1.0,
  rate: 1.05,
  pitch: 1.0,
  announceCriticalOnly: false,
  chimeSound: true,
  selectedVoiceName: ''
};

class VoiceAlertService {
  private audioCtx: AudioContext | null = null;
  private isSpeakingState = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private lastSpokenAlertId: string | null = null;
  private lastSpokenTimestamp = 0;

  constructor() {
    // Lazy audio context initialization upon user interaction
  }

  public subscribeSpeakingState(cb: (speaking: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isSpeakingState);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private setSpeaking(val: boolean) {
    this.isSpeakingState = val;
    this.listeners.forEach((cb) => cb(val));
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Synthesize a two-tone industrial warning chime using Web Audio API
   */
  public async playAlertChime(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Primary oscillator: High attention tone
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(880, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.28); // E5

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      // Return a short promise to let the chime play before speech begins
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      // AudioContext might be blocked until gesture, gracefully continue
      console.warn('Audio chime playback omitted or blocked:', err);
    }
  }

  /**
   * Format natural spoken text from an anomaly alert
   */
  public formatAlertSpeech(alert: ActiveAnomalyAlert): string {
    const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
    const severityPrefix =
      alert.severity === 'CRITICAL'
        ? 'Priority One Critical Alert.'
        : alert.severity === 'HIGH'
        ? 'High Severity Notice.'
        : 'Safety Telemetry Notice.';

    const locationClean = alert.location_zone.replace(/-/g, ' ');

    if (isPredictive) {
      const equipment = alert.equipment_name || alert.equipment_id || 'Industrial Equipment';
      const vib = alert.vibration_mm_s ? `${alert.vibration_mm_s} millimeters per second` : '';
      const heat = alert.equipment_temp_c ? `${alert.equipment_temp_c} degrees Celsius` : '';
      const telemetrySummary = vib && heat ? `Vibration measured at ${vib}, with bearing heat at ${heat}.` : '';

      return `${severityPrefix} Predictive Maintenance Flag in ${locationClean}. Equipment: ${equipment}. ${telemetrySummary} Required directive: ${alert.recommended_action}`;
    }

    // Health Anomaly
    const metricClean = alert.anomaly_metric.replace(/&/g, 'and');
    const workerClean = alert.worker_id.replace('-', ' ');

    return `${severityPrefix} Health anomaly in ${locationClean}. Target cohort worker token ${workerClean}. Anomaly: ${metricClean}. Required directive: ${alert.recommended_action}`;
  }

  /**
   * Speak a synthesized announcement for an alert
   */
  public async speakAlert(
    alert: ActiveAnomalyAlert,
    settings: VoiceAlertSettings = DEFAULT_VOICE_SETTINGS
  ): Promise<void> {
    if (!settings.enabled) return;
    if (settings.announceCriticalOnly && alert.severity !== 'CRITICAL') return;
    if (!this.isSupported()) return;

    // Deduplication within 10 seconds for the same alert ID
    const now = Date.now();
    if (this.lastSpokenAlertId === alert.id && now - this.lastSpokenTimestamp < 10000) {
      return;
    }
    this.lastSpokenAlertId = alert.id;
    this.lastSpokenTimestamp = now;

    // Play chime if enabled
    if (settings.chimeSound) {
      await this.playAlertChime();
    }

    const speechText = this.formatAlertSpeech(alert);
    return this.speakRawText(speechText, settings);
  }

  /**
   * Speak arbitrary text (e.g. for testing voice or system status)
   */
  public async speakRawText(text: string, settings: VoiceAlertSettings = DEFAULT_VOICE_SETTINGS): Promise<void> {
    if (!this.isSupported()) return;

    // Stop current ongoing speech to ensure immediate priority delivery
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0, Math.min(1, settings.volume));
      utterance.rate = Math.max(0.7, Math.min(1.5, settings.rate));
      utterance.pitch = Math.max(0.7, Math.min(1.3, settings.pitch));

      if (settings.selectedVoiceName) {
        const voices = window.speechSynthesis.getVoices();
        const found = voices.find((v) => v.name === settings.selectedVoiceName);
        if (found) utterance.voice = found;
      } else {
        // Prefer natural English voices if available
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          (v) => (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))) || v.lang.startsWith('en')
        );
        if (englishVoice) utterance.voice = englishVoice;
      }

      this.setSpeaking(true);

      utterance.onend = () => {
        this.setSpeaking(false);
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.setSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public cancelSpeech(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.setSpeaking(false);
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeakingState || (this.isSupported() && window.speechSynthesis.speaking);
  }
}

export const voiceAlertService = new VoiceAlertService();

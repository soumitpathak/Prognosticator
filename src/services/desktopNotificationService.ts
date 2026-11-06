import { ActiveAnomalyAlert, DesktopNotificationConfig, DesktopAlertPayload } from '../types';

/**
 * Enterprise Browser-Based Desktop Notification Service
 * Manages OS-level desktop notifications when the safety manager is tabbed out,
 * ensuring zero missed critical life-safety and environmental anomalies.
 */

class DesktopNotificationService {
  private config: DesktopNotificationConfig = {
    enabled: true,
    permission: 'default',
    notifyOnlyWhenTabbedOut: true,
    minimumSeverity: 'CRITICAL',
    soundChimeEnabled: true,
    cooldownSeconds: 8,
    lastAlertSentAt: 0
  };

  private listeners: Set<(config: DesktopNotificationConfig) => void> = new Set();
  private originalDocumentTitle: string = 'Prognosticator';
  private titleFlashInterval: number | null = null;
  private recentSentAlertIds: Set<string> = new Set();
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.originalDocumentTitle = document.title || 'Prognosticator';
      this.checkPermission();

      // Listen for visibility changes to stop title flashing when tab returns to focus
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.stopTitleFlashing();
        }
      });
      window.addEventListener('focus', () => {
        this.stopTitleFlashing();
      });
    }
  }

  public checkPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.config.permission = 'unsupported';
    } else {
      this.config.permission = Notification.permission;
    }
    this.notifyListeners();
    return this.config.permission;
  }

  public async requestPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.config.permission = 'unsupported';
      this.notifyListeners();
      return 'unsupported';
    }

    try {
      const perm = await Notification.requestPermission();
      this.config.permission = perm;
      if (perm === 'granted') {
        this.config.enabled = true;
      }
      this.notifyListeners();
      return perm;
    } catch {
      this.config.permission = 'denied';
      this.notifyListeners();
      return 'denied';
    }
  }

  public subscribe(callback: (config: DesktopNotificationConfig) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.config });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb({ ...this.config }));
  }

  public updateConfig(partial: Partial<DesktopNotificationConfig>) {
    this.config = { ...this.config, ...partial };
    this.notifyListeners();
  }

  public getConfig(): DesktopNotificationConfig {
    return { ...this.config };
  }

  public isTabbedOut(): boolean {
    if (typeof document === 'undefined') return false;
    return document.visibilityState === 'hidden' || !document.hasFocus();
  }

  /**
   * Generates a clean synthetic audio chime using the Web Audio API
   */
  public playAlertChime(severity: 'CRITICAL' | 'HIGH' | 'MODERATE' = 'CRITICAL') {
    if (!this.config.soundChimeEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      if (severity === 'CRITICAL') {
        // High urgency two-tone alert
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(660, now + 0.12); // E5
        osc.frequency.setValueAtTime(987.77, now + 0.25); // B5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.55);
      } else {
        // Warning chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      osc.connect(gain);
      gain.connect(this.audioContext.destination);
    } catch {
      // Audio playback failed or blocked by policy
    }
  }

  /**
   * Flashes the document title to attract manager attention even if OS notifications are denied
   */
  private startTitleFlashing(alertText: string) {
    if (typeof document === 'undefined' || this.titleFlashInterval) return;

    let isAlert = true;
    this.titleFlashInterval = window.setInterval(() => {
      document.title = isAlert ? `🚨 ${alertText}` : this.originalDocumentTitle;
      isAlert = !isAlert;
    }, 1000);
  }

  private stopTitleFlashing() {
    if (this.titleFlashInterval) {
      clearInterval(this.titleFlashInterval);
      this.titleFlashInterval = null;
    }
    if (typeof document !== 'undefined') {
      document.title = this.originalDocumentTitle;
    }
  }

  /**
   * Dispatches a desktop notification when tabbed out or forced test
   */
  public notifyAnomaly(
    alert: ActiveAnomalyAlert | DesktopAlertPayload,
    options: { forceTrigger?: boolean } = {}
  ): boolean {
    if (!this.config.enabled) return false;

    // Check severity filter
    if (this.config.minimumSeverity === 'CRITICAL' && alert.severity !== 'CRITICAL') {
      return false;
    }

    // Check tabbed-out condition
    const tabbedOut = this.isTabbedOut();
    if (this.config.notifyOnlyWhenTabbedOut && !tabbedOut && !options.forceTrigger) {
      return false;
    }

    // Throttle duplicate alerts
    const now = Date.now();
    const cooldownMs = this.config.cooldownSeconds * 1000;
    if (
      !options.forceTrigger &&
      this.config.lastAlertSentAt &&
      now - this.config.lastAlertSentAt < cooldownMs &&
      this.recentSentAlertIds.has(alert.id)
    ) {
      return false;
    }

    this.recentSentAlertIds.add(alert.id);
    if (this.recentSentAlertIds.size > 50) {
      this.recentSentAlertIds.clear();
    }
    this.config.lastAlertSentAt = now;

    // Trigger audio chime
    const chimeSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' =
      alert.severity === 'LOW' ? 'MODERATE' : alert.severity;
    this.playAlertChime(chimeSeverity);

    const zoneLabel = 'zone' in alert ? alert.zone : alert.location_zone;

    // Flash tab title if tabbed out
    if (tabbedOut) {
      this.startTitleFlashing(`CRITICAL ALERT in ${zoneLabel || 'Facility'}!`);
    }

    // Attempt OS-level native desktop notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = 'title' in alert ? alert.title : `🚨 CRITICAL ANOMALY: ${alert.severity}`;
        const zone = zoneLabel || 'Sector';
        const metric = 'anomaly_metric' in alert ? alert.anomaly_metric : alert.metric;
        const action = 'recommended_action' in alert ? alert.recommended_action : alert.actionRequired;

        const notif = new Notification(title, {
          body: `Zone: ${zone}\nMetric: ${metric}\nAction: ${action}`,
          tag: `prognosticator-${alert.id}`,
          requireInteraction: true,
          silent: !this.config.soundChimeEnabled
        });

        notif.onclick = () => {
          window.focus();
          this.stopTitleFlashing();
          notif.close();
        };

        return true;
      } catch {
        // In iframe or sandboxed context where notification constructor throws
        return false;
      }
    }

    return false;
  }
}

export const desktopNotificationService = new DesktopNotificationService();

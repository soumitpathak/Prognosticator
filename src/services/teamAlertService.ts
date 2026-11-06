import { TeamAlertNotification, IncidentAssignment, ActiveAnomalyAlert } from '../types';

const STORAGE_KEY = 'prognosticator_team_alerts';

export const INITIAL_TEAM_ALERTS: TeamAlertNotification[] = [
  {
    id: 'TA-8842-SJ',
    incidentId: 'ALR-8842-CR',
    assigneeId: 'ASG-COOL-02',
    assigneeName: 'Sarah Jenkins',
    assigneeRole: 'Rapid Cooling & Heat Evacuation Lead',
    title: 'CRITICAL: Acute Autonomic & Thermal Strain Dispatch',
    severity: 'CRITICAL',
    zone: 'Outdoor-Construction-Sector-4',
    anomalyMetric: 'Autonomic HRV Collapse (31ms) & Skin Heat 38.4°C',
    directive: 'Deploy mobile shaded cooling tent and oral electrolyte hydration pack to Sector 4 cohort.',
    timestamp: '12 mins ago',
    deliveredAt: '2026-11-06T12:00:15Z',
    readAt: '2026-11-06T12:02:40Z',
    acknowledgedAt: '2026-11-06T12:03:10Z',
    status: 'EN_ROUTE',
    fieldNotes: 'On site with portable cooling vest and vitals monitor. Initiating worker extraction.'
  },
  {
    id: 'TA-9042-DZ',
    incidentId: 'ALR-PM-9042',
    assigneeId: 'ASG-MECH-03',
    assigneeName: 'Derek Zhang',
    assigneeRole: 'Reliability Vibration Engineer',
    title: 'CRITICAL: Conveyor Drive 4B Roller Bearing Excursion',
    severity: 'CRITICAL',
    zone: 'Outdoor-Construction-Sector-4',
    anomalyMetric: 'Vibration 7.2 mm/s RMS & Motor Casing Heat 89.1°C',
    directive: 'LOTO Stage 2 electrical lockout; grease drive roller bearing sleeve to prevent shaft seizure.',
    timestamp: '18 mins ago',
    deliveredAt: '2026-11-06T11:54:20Z',
    readAt: '2026-11-06T11:56:05Z',
    status: 'READ',
    fieldNotes: 'LOTO permit approved. Heading to Sector 4 MCC cabinet with high-temp grease gun.'
  },
  {
    id: 'TA-8839-TS',
    incidentId: 'ALR-8839-HG',
    assigneeId: 'ASG-NOISE-04',
    assigneeName: 'Thomas Schmidt',
    assigneeRole: 'Acoustic Hearing Protection Officer',
    title: 'HIGH: Acoustic Machinery Overpressure Blast (104.8 dBA)',
    severity: 'HIGH',
    zone: 'Outdoor-Construction-Sector-4',
    anomalyMetric: 'Compressor Acoustic Shock (104.8 dB raw / 98.4 dB smoothed)',
    directive: 'Deploy secondary ear defenders to Sector 4 cohort; check compressor vibration dampeners.',
    timestamp: '28 mins ago',
    deliveredAt: '2026-11-06T11:44:10Z',
    readAt: '2026-11-06T11:45:30Z',
    acknowledgedAt: '2026-11-06T11:46:00Z',
    status: 'RESOLVED',
    fieldNotes: 'Secondary ear defenders distributed; dampeners re-seated. Ambient noise reduced to 81.2 dBA.'
  },
  {
    id: 'TA-7120-DZ',
    incidentId: 'ALR-PM-7120',
    assigneeId: 'ASG-MECH-03',
    assigneeName: 'Derek Zhang',
    assigneeRole: 'Reliability Vibration Engineer',
    title: 'HIGH: Chiller Pump 2 Rotor Harmonic Jitter',
    severity: 'HIGH',
    zone: 'Warehouse-Logistics-Hub-North',
    anomalyMetric: 'Vibration 5.4 mm/s RMS & Bearing Heat 76.5°C',
    directive: 'Inspect pump suction cavitation and replenish synthetic polyurea grease.',
    timestamp: '36 mins ago',
    deliveredAt: '2026-11-06T11:36:20Z',
    status: 'UNREAD'
  }
];

class TeamAlertService {
  private alerts: TeamAlertNotification[] = [];
  private listeners: Set<(alerts: TeamAlertNotification[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.alerts = INITIAL_TEAM_ALERTS;
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored);
      } else {
        this.alerts = INITIAL_TEAM_ALERTS;
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to load team alerts from localStorage:', e);
      this.alerts = INITIAL_TEAM_ALERTS;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (e) {
      console.warn('Failed to save team alerts to localStorage:', e);
    }
    this.notify();
  }

  private notify(): void {
    const copy = [...this.alerts];
    this.listeners.forEach((listener) => listener(copy));
  }

  public subscribe(listener: (alerts: TeamAlertNotification[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.alerts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAlerts(): TeamAlertNotification[] {
    return [...this.alerts];
  }

  public getAlertsForAssignee(assigneeId: string): TeamAlertNotification[] {
    return this.alerts.filter((a) => a.assigneeId === assigneeId);
  }

  public getUnreadCount(assigneeId?: string): number {
    if (assigneeId) {
      return this.alerts.filter((a) => a.assigneeId === assigneeId && a.status === 'UNREAD').length;
    }
    return this.alerts.filter((a) => a.status === 'UNREAD').length;
  }

  public markAsRead(alertId: string): TeamAlertNotification | null {
    const idx = this.alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return null;

    const alert = this.alerts[idx];
    if (alert.status === 'UNREAD') {
      const updated: TeamAlertNotification = {
        ...alert,
        status: 'READ',
        readAt: new Date().toISOString()
      };
      this.alerts[idx] = updated;
      this.saveToStorage();
      return updated;
    }
    return alert;
  }

  public markAsEnRoute(alertId: string, notes?: string): TeamAlertNotification | null {
    const idx = this.alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return null;

    const alert = this.alerts[idx];
    const nowIso = new Date().toISOString();
    const updated: TeamAlertNotification = {
      ...alert,
      status: 'EN_ROUTE',
      readAt: alert.readAt || nowIso,
      acknowledgedAt: nowIso,
      fieldNotes: notes || alert.fieldNotes || 'Field team en route to incident coordinates.'
    };
    this.alerts[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  public markAsResolved(alertId: string, notes?: string): TeamAlertNotification | null {
    const idx = this.alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return null;

    const alert = this.alerts[idx];
    const updated: TeamAlertNotification = {
      ...alert,
      status: 'RESOLVED',
      fieldNotes: notes || alert.fieldNotes || 'Corrective action verified. Site returned to safe baseline.'
    };
    this.alerts[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  public createAlertFromAssignment(
    assignment: IncidentAssignment,
    alert: ActiveAnomalyAlert
  ): TeamAlertNotification {
    const nowIso = new Date().toISOString();
    const newId = `TA-${Date.now().toString().slice(-4)}-${assignment.assigneeId?.slice(-2) || 'ASG'}`;

    const newTeamAlert: TeamAlertNotification = {
      id: newId,
      incidentId: alert.id,
      assigneeId: assignment.assigneeId || 'ASG-MED-01',
      assigneeName: assignment.assigneeName || 'Dr. Marcus Vance, MD',
      assigneeRole: assignment.assigneeRole || 'Emergency Medical Lead',
      title: `${alert.severity}: ${alert.anomaly_metric}`,
      severity: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      zone: alert.location_zone,
      anomalyMetric: alert.anomaly_metric,
      directive: alert.recommended_action,
      timestamp: 'Just now',
      deliveredAt: nowIso,
      status: 'UNREAD',
      fieldNotes: assignment.resolutionNotes
    };

    // Prepend
    this.alerts = [newTeamAlert, ...this.alerts];
    this.saveToStorage();
    return newTeamAlert;
  }

  public resetToDefaults(): void {
    this.alerts = INITIAL_TEAM_ALERTS;
    this.saveToStorage();
  }
}

export const teamAlertService = new TeamAlertService();

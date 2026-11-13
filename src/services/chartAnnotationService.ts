/**
 * Service for managing qualitative chart annotations on health risk trend charts.
 * Allows managers to attach, view, update, and remove contextual notes
 * (e.g. 'Facility event: HVAC maintenance') that persist across the system in localStorage.
 */

export interface ChartAnnotation {
  id: string;
  chartType: '24h_risk' | '7d_risk' | 'historical_vitals' | 'all';
  pointTimeLabel: string; // e.g. "14:00", "T-10h", "Wed 10/28"
  pointIndex: number;
  riskScore: number;
  pointType: 'SPIKE' | 'TROUGH' | 'ANOMALY' | 'CUSTOM';
  title: string; // e.g. "Facility event: HVAC maintenance"
  note: string; // Detailed qualitative description
  category:
    | 'FACILITY_EVENT'
    | 'HVAC_MAINTENANCE'
    | 'EQUIPMENT_OVERPRESSURE'
    | 'ENVIRONMENTAL_HEAT'
    | 'SHIFT_HANDOVER'
    | 'PPE_DRILL'
    | 'OTHER';
  author: string; // e.g. "Safety Director (Safety Lead)"
  createdAt: string;
  zoneId?: string;
  zoneName?: string;
}

const STORAGE_KEY = 'prognosticator_health_chart_annotations_v1';

const INITIAL_ANNOTATIONS: ChartAnnotation[] = [
  {
    id: 'NOTE-2026-001',
    chartType: '24h_risk',
    pointTimeLabel: '14:00',
    pointIndex: 14,
    riskScore: 84.5,
    pointType: 'SPIKE',
    title: 'Facility event: HVAC maintenance',
    note: 'Primary chiller unit condenser pump maintenance caused temporary microclimate airflow reduction in Sector 4.',
    category: 'HVAC_MAINTENANCE',
    author: 'Safety Director (Safety Lead)',
    createdAt: '2026-10-30T14:15:00.000Z',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4'
  },
  {
    id: 'NOTE-2026-002',
    chartType: '24h_risk',
    pointTimeLabel: '07:00',
    pointIndex: 7,
    riskScore: 24.2,
    pointType: 'TROUGH',
    title: 'Shift Handover & Cool-Down Routine',
    note: 'Optimal biometric recovery window following pre-shift hydration protocol and misting fan deployment.',
    category: 'SHIFT_HANDOVER',
    author: 'Elena Rostova (Compliance)',
    createdAt: '2026-10-30T07:30:00.000Z',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4'
  },
  {
    id: 'NOTE-2026-003',
    chartType: '24h_risk',
    pointTimeLabel: '18:00',
    pointIndex: 18,
    riskScore: 78.9,
    pointType: 'SPIKE',
    title: 'Extreme Solar Radiation Peak',
    note: 'Afternoon solar radiant heat surge recorded at 41.2°C ambient black-globe temp. Forced 15-min rest cycles ordered.',
    category: 'ENVIRONMENTAL_HEAT',
    author: 'Marcus Brody (Site Ops Lead)',
    createdAt: '2026-10-30T18:20:00.000Z',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4'
  }
];

class ChartAnnotationService {
  private annotations: ChartAnnotation[] = [];
  private listeners: Set<(annotations: ChartAnnotation[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.annotations = parsed;
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load chart annotations from localStorage:', err);
    }
    // Default seed
    this.annotations = [...INITIAL_ANNOTATIONS];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.annotations));
      }
    } catch (err) {
      console.warn('Failed to save chart annotations to localStorage:', err);
    }
  }

  private notify() {
    this.saveToStorage();
    const copy = [...this.annotations];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Annotation listener error:', err);
      }
    });
  }

  public getAnnotations(chartType?: '24h_risk' | '7d_risk' | 'historical_vitals' | 'all'): ChartAnnotation[] {
    if (!chartType || chartType === 'all') {
      return [...this.annotations];
    }
    return this.annotations.filter((a) => a.chartType === chartType || a.chartType === 'all');
  }

  public getAnnotationsForTimeLabel(timeLabel: string, chartType?: '24h_risk' | '7d_risk' | 'historical_vitals'): ChartAnnotation[] {
    return this.annotations.filter((a) => {
      const matchTime = a.pointTimeLabel.toLowerCase() === timeLabel.toLowerCase();
      const matchChart = !chartType || a.chartType === chartType || a.chartType === 'all';
      return matchTime && matchChart;
    });
  }

  public addAnnotation(
    annotation: Omit<ChartAnnotation, 'id' | 'createdAt'>
  ): ChartAnnotation {
    const newRecord: ChartAnnotation = {
      ...annotation,
      id: `NOTE-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    this.annotations = [newRecord, ...this.annotations];
    this.notify();
    return newRecord;
  }

  public updateAnnotation(id: string, updates: Partial<Omit<ChartAnnotation, 'id' | 'createdAt'>>): boolean {
    const idx = this.annotations.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.annotations[idx] = {
      ...this.annotations[idx],
      ...updates
    };
    this.notify();
    return true;
  }

  public deleteAnnotation(id: string): boolean {
    const prevLen = this.annotations.length;
    this.annotations = this.annotations.filter((a) => a.id !== id);
    if (this.annotations.length !== prevLen) {
      this.notify();
      return true;
    }
    return false;
  }

  public resetToDefaults() {
    this.annotations = [...INITIAL_ANNOTATIONS];
    this.notify();
  }

  public subscribe(listener: (annotations: ChartAnnotation[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.annotations]);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const chartAnnotationService = new ChartAnnotationService();

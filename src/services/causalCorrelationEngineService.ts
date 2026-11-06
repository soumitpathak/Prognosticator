import {
  CausalZoneNode,
  CausalPropagationLink,
  CausalIncidentChainEvent,
  FacilityZone,
  ActiveAnomalyAlert
} from '../types';

export const INITIAL_CAUSAL_NODES: CausalZoneNode[] = [
  {
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Sector 4',
    riskScore: 88,
    activeAnomaliesCount: 4,
    status: 'CRITICAL',
    adjacentZoneIds: ['Warehouse-Logistics-Hub-North', 'Subgrade-Tunnel-Conduit-7'],
    x: 20,
    y: 30,
    headcount: 38,
    ambientTempC: 38.6
  },
  {
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics Hub North',
    riskScore: 68,
    activeAnomaliesCount: 2,
    status: 'MODERATE',
    adjacentZoneIds: ['Outdoor-Construction-Sector-4', 'Manufacturing-Assembly-Line-B', 'Subgrade-Tunnel-Conduit-7'],
    x: 52,
    y: 20,
    headcount: 46,
    ambientTempC: 33.2
  },
  {
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Assembly Line B',
    riskScore: 54,
    activeAnomaliesCount: 1,
    status: 'MODERATE',
    adjacentZoneIds: ['Warehouse-Logistics-Hub-North', 'Subgrade-Tunnel-Conduit-7'],
    x: 80,
    y: 45,
    headcount: 58,
    ambientTempC: 28.5
  },
  {
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Tunnel Conduit 7',
    riskScore: 74,
    activeAnomaliesCount: 2,
    status: 'CRITICAL',
    adjacentZoneIds: ['Outdoor-Construction-Sector-4', 'Warehouse-Logistics-Hub-North', 'Manufacturing-Assembly-Line-B'],
    x: 48,
    y: 75,
    headcount: 18,
    ambientTempC: 31.0
  }
];

export const INITIAL_CAUSAL_LINKS: CausalPropagationLink[] = [
  {
    id: 'LINK-SEC4-TO-LOGN',
    sourceZoneId: 'Outdoor-Construction-Sector-4',
    sourceZoneName: 'Outdoor Sector 4',
    targetZoneId: 'Warehouse-Logistics-Hub-North',
    targetZoneName: 'Logistics Hub North',
    pearsonR: 0.86,
    causalConfidencePct: 92,
    timeLagMinutes: 22,
    transmissionVector: 'THERMAL_PLUME',
    transmissionDescription:
      'Prevailing southern heat plume sweeps through high-bay loading docks, increasing indoor ambient temperature by +3.4°C within 22 minutes.',
    isCascadingActive: true,
    recentPropagationCount: 14,
    decouplingRecommendation:
      'Activate high-speed roll-up curtain barrier at Bay 4 and switch Logistics Hub roof exhaust fans to forced negative pressure.',
    historicalPValue: 0.0004
  },
  {
    id: 'LINK-SEC4-TO-TUN7',
    sourceZoneId: 'Outdoor-Construction-Sector-4',
    sourceZoneName: 'Outdoor Sector 4',
    targetZoneId: 'Subgrade-Tunnel-Conduit-7',
    targetZoneName: 'Tunnel Conduit 7',
    pearsonR: 0.79,
    causalConfidencePct: 88,
    timeLagMinutes: 14,
    transmissionVector: 'ACOUSTIC_RESONANCE',
    transmissionDescription:
      'Heavy compaction rig operation in Sector 4 transmits 18-35 Hz sub-audible vibration down continuous foundation piles into subgrade ceiling structure.',
    isCascadingActive: true,
    recentPropagationCount: 9,
    decouplingRecommendation:
      'Schedule dynamic vibration damper inspection on Tunnel 7 utility racks; stagger compaction rig shifts with subgrade worker entry.',
    historicalPValue: 0.0012
  },
  {
    id: 'LINK-LOGN-TO-ASYB',
    sourceZoneId: 'Warehouse-Logistics-Hub-North',
    sourceZoneName: 'Logistics Hub North',
    targetZoneId: 'Manufacturing-Assembly-Line-B',
    targetZoneName: 'Assembly Line B',
    pearsonR: 0.74,
    causalConfidencePct: 81,
    timeLagMinutes: 38,
    transmissionVector: 'WORKER_FLOW',
    transmissionDescription:
      'Tired material-handling forklift drivers rotating from overheated Logistics Hub transfer elevated cardiac stress & fatigue into precision assembly line.',
    isCascadingActive: false,
    recentPropagationCount: 6,
    decouplingRecommendation:
      'Mandate 15-minute cool-down hydration interlock before material handlers cross into Assembly Line B.',
    historicalPValue: 0.0035
  },
  {
    id: 'LINK-TUN7-TO-ASYB',
    sourceZoneId: 'Subgrade-Tunnel-Conduit-7',
    sourceZoneName: 'Tunnel Conduit 7',
    targetZoneId: 'Manufacturing-Assembly-Line-B',
    targetZoneName: 'Assembly Line B',
    pearsonR: 0.69,
    causalConfidencePct: 77,
    timeLagMinutes: 46,
    transmissionVector: 'HVAC_CONDUIT',
    transmissionDescription:
      'Shared ventilation return plenum draws stagnant warm air from conduit into assembly hall during high heat loads.',
    isCascadingActive: false,
    recentPropagationCount: 4,
    decouplingRecommendation:
      'Modulate HVAC bypass dampers to 100% fresh outside air purge mode; isolate Tunnel 7 air return.',
    historicalPValue: 0.0089
  }
];

export const INITIAL_CASCADING_CHAIN: CausalIncidentChainEvent[] = [
  {
    step: 1,
    timeOffset: '14:10:00 (T+0m)',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Sector 4',
    incidentType: 'Primary Heat Dome & Solar Radiation Surge',
    metricValue: 'Ambient 39.1°C / TWL 118 W/m² (Critical)',
    causalRole: 'ORIGIN',
    delayFromOriginMins: 0,
    confidencePct: 98
  },
  {
    step: 2,
    timeOffset: '14:24:00 (T+14m)',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Tunnel Conduit 7',
    incidentType: 'Structural Acoustic Vibration & Air Inversion',
    metricValue: 'Vibration 5.8 mm/s / HRV -28% (High)',
    causalRole: 'INTERMEDIATE_PROPAGATION',
    delayFromOriginMins: 14,
    confidencePct: 88
  },
  {
    step: 3,
    timeOffset: '14:32:00 (T+22m)',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics Hub North',
    incidentType: 'Thermal Plume Bay Ingress & Heat Strain',
    metricValue: 'Ambient 34.6°C / Forklift Driver Heart Rate 118 bpm',
    causalRole: 'INTERMEDIATE_PROPAGATION',
    delayFromOriginMins: 22,
    confidencePct: 92
  },
  {
    step: 4,
    timeOffset: '15:10:00 (T+60m)',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Assembly Line B',
    incidentType: 'Micro-Fatigue & Ergonomic Precision Drift',
    metricValue: 'Assembly Error Rate +34% / Worker HRV Drop',
    causalRole: 'TERMINAL_CASCADE',
    delayFromOriginMins: 60,
    confidencePct: 79
  }
];

class CausalCorrelationEngineService {
  private nodes: CausalZoneNode[] = [...INITIAL_CAUSAL_NODES];
  private links: CausalPropagationLink[] = [...INITIAL_CAUSAL_LINKS];
  private chain: CausalIncidentChainEvent[] = [...INITIAL_CASCADING_CHAIN];
  private listeners: Set<() => void> = new Set();
  private selectedZoneId: string = 'Outdoor-Construction-Sector-4';

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getNodes(): CausalZoneNode[] {
    return [...this.nodes];
  }

  public getLinks(): CausalPropagationLink[] {
    return [...this.links];
  }

  public getIncidentChain(): CausalIncidentChainEvent[] {
    return [...this.chain];
  }

  public getSelectedZoneId(): string {
    return this.selectedZoneId;
  }

  public setSelectedZoneId(zoneId: string) {
    this.selectedZoneId = zoneId;
    this.notify();
  }

  public triggerSimulatedCascade(originZoneId: string) {
    const origin = this.nodes.find((n) => n.zoneId === originZoneId);
    if (!origin) return;

    this.selectedZoneId = originZoneId;

    // Elevate origin node
    this.nodes = this.nodes.map((n) => {
      if (n.zoneId === originZoneId) {
        return {
          ...n,
          riskScore: 94,
          status: 'CRITICAL',
          activeAnomaliesCount: n.activeAnomaliesCount + 1
        };
      }
      return n;
    });

    // Activate relevant links
    this.links = this.links.map((link) => {
      if (link.sourceZoneId === originZoneId) {
        return {
          ...link,
          isCascadingActive: true,
          recentPropagationCount: link.recentPropagationCount + 1
        };
      }
      return link;
    });

    this.notify();
  }

  public decoupleLink(linkId: string): CausalPropagationLink | null {
    const idx = this.links.findIndex((l) => l.id === linkId);
    if (idx === -1) return null;

    const link = this.links[idx];
    const updated: CausalPropagationLink = {
      ...link,
      isCascadingActive: false,
      causalConfidencePct: Math.round(link.causalConfidencePct * 0.4),
      pearsonR: Number((link.pearsonR * 0.45).toFixed(2))
    };

    this.links[idx] = updated;
    this.notify();
    return updated;
  }

  public exportCausalReportCsv(): void {
    const headers = [
      'Link_ID',
      'Source_Zone',
      'Target_Zone',
      'Correlation_R',
      'Causal_Confidence_Pct',
      'Time_Lag_Minutes',
      'Transmission_Vector',
      'Is_Cascading_Active',
      'Propagation_Count',
      'Historical_P_Value',
      'Description',
      'Decoupling_Recommendation'
    ];

    const rows = this.links.map((l) => [
      `"${l.id}"`,
      `"${l.sourceZoneName}"`,
      `"${l.targetZoneName}"`,
      l.pearsonR,
      l.causalConfidencePct,
      l.timeLagMinutes,
      `"${l.transmissionVector}"`,
      l.isCascadingActive ? 'YES' : 'NO',
      l.recentPropagationCount,
      l.historicalPValue,
      `"${l.transmissionDescription.replace(/"/g, '""')}"`,
      `"${l.decouplingRecommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Causal_InterZone_Correlation_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const causalCorrelationEngineService = new CausalCorrelationEngineService();

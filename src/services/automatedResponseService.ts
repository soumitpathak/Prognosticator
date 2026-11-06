/**
 * Automated Response Service
 *
 * Closed-loop remediation engine that detects low-to-medium risk environmental
 * anomalies (thermal creep, humidity spikes, particulate accumulation, acoustic resonance)
 * and proposes or automatically executes corrective HVAC / ventilation adjustments,
 * featuring an opt-in approval workflow.
 */

export type EnvironmentalRiskTier = 'LOW' | 'MEDIUM';

export type AdjustmentStatus = 'PENDING_APPROVAL' | 'EXECUTED_AUTONOMOUSLY' | 'APPROVED_AND_EXECUTED' | 'DISMISSED';

export interface CorrectiveHvacAdjustment {
  id: string; // e.g., 'RESP-HVAC-9482'
  triggeredAt: string;
  anomalyMetric: string;
  triggerCondition: string;
  zoneId: string;
  zoneName: string;
  riskTier: EnvironmentalRiskTier;
  measuredValue: string;
  targetBaseline: string;
  targetEquipment: string; // e.g., 'AHU-04 Supply Air VAV & Chilled Loop 2'
  actionDirective: string; // e.g., 'Modulate VAV damper to 85% and depress chilled setpoint by -2.5°C'
  damperAperturePct: number; // e.g., 85
  temperatureDeltaC: number; // e.g., -2.5
  airExchangeRateAch: number; // e.g., 10 ACH
  projectedRecoveryTimeMin: number; // e.g., 14 min
  estimatedEnergyCostUsd: number; // e.g., $3.40
  status: AdjustmentStatus;
  approvedBy?: string;
  executedAt?: string;
  responseVerificationStatus: 'OPTIMIZING' | 'TARGET_ACHIEVED' | 'STAGED' | 'OVERRIDDEN';
  residualRiskScore: number; // 0-100
}

export interface AutomatedResponseConfig {
  optInAutonomousMode: boolean; // false = require manager approval; true = execute automatically
  maxCoolingOffsetC: number; // maximum allowable automated offset, default 3.5°C
  maxVentilationAch: number; // maximum ACH purge, default 12 ACH
  requireDualAuthForChillers: boolean;
  autoLogToAuditTrail: boolean;
}

type Listener = () => void;

class AutomatedResponseService {
  private config: AutomatedResponseConfig = {
    optInAutonomousMode: false,
    maxCoolingOffsetC: 3.5,
    maxVentilationAch: 12,
    requireDualAuthForChillers: false,
    autoLogToAuditTrail: true
  };

  private adjustments: CorrectiveHvacAdjustment[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.seedInitialAdjustments();
  }

  private seedInitialAdjustments(): void {
    const now = Date.now();
    this.adjustments = [
      {
        id: 'RESP-HVAC-8812',
        triggeredAt: new Date(now - 12 * 60000).toISOString(),
        anomalyMetric: 'Ambient Heat Index Drift',
        triggerCondition: 'Ambient temperature reached 31.8°C with rising solar radiation (MODERATE)',
        zoneId: 'Outdoor-Construction-Sector-4',
        zoneName: 'Outdoor Construction Sector 4',
        riskTier: 'MEDIUM',
        measuredValue: '31.8°C (TWL: 135 W/m²)',
        targetBaseline: '26.0°C (TWL: 180 W/m²)',
        targetEquipment: 'Staging Pad Evaporative Misting Manifold & Portable Shaded Chiller Unit 1',
        actionDirective: 'Energize high-pressure evaporative misting nozzles at 1000 PSI and deploy 24,000 BTU spot cooling tents.',
        damperAperturePct: 100,
        temperatureDeltaC: -3.2,
        airExchangeRateAch: 8,
        projectedRecoveryTimeMin: 12,
        estimatedEnergyCostUsd: 4.80,
        status: 'PENDING_APPROVAL',
        responseVerificationStatus: 'STAGED',
        residualRiskScore: 32
      },
      {
        id: 'RESP-VENT-8813',
        triggeredAt: new Date(now - 35 * 60000).toISOString(),
        anomalyMetric: 'Particulate PM2.5 Accumulation',
        triggerCondition: 'Fine dust particulates elevated to 48 µg/m³ during shift cutting cycle (LOW)',
        zoneId: 'Fabrication-Machining-Bay',
        zoneName: 'Fabrication & Machining Bay',
        riskTier: 'LOW',
        measuredValue: '48.2 µg/m³',
        targetBaseline: '< 20 µg/m³',
        targetEquipment: 'Local Exhaust Ventilation (LEV) Scrubber Fan Unit 2 & Fresh Air Purge Damper',
        actionDirective: 'Actuate LEV damper from 40% to 90% aperture and ramp roof extraction blower to 55 Hz to purge machining aerosol.',
        damperAperturePct: 90,
        temperatureDeltaC: -1.0,
        airExchangeRateAch: 12,
        projectedRecoveryTimeMin: 9,
        estimatedEnergyCostUsd: 2.10,
        status: 'APPROVED_AND_EXECUTED',
        approvedBy: 'Shift Supervisor (Auto-Response Protocol)',
        executedAt: new Date(now - 30 * 60000).toISOString(),
        responseVerificationStatus: 'TARGET_ACHIEVED',
        residualRiskScore: 18
      },
      {
        id: 'RESP-HVAC-8814',
        triggeredAt: new Date(now - 6 * 60000).toISOString(),
        anomalyMetric: 'Chilled Water Return Temp Creep',
        triggerCondition: 'Assembly cooling loop Delta-T narrowed to 3.1°C indicating localized heat buildup (LOW)',
        zoneId: 'Manufacturing-Assembly-Line-B',
        zoneName: 'Manufacturing Assembly Line B',
        riskTier: 'LOW',
        measuredValue: '28.4°C Return Temp',
        targetBaseline: '24.0°C Return Temp',
        targetEquipment: 'AHU-02 Variable Air Volume (VAV) Terminal Boxes 01-06',
        actionDirective: 'Step up supply blower to 80% flow capacity and lower chilled water supply setpoint by -2.0°C.',
        damperAperturePct: 80,
        temperatureDeltaC: -2.0,
        airExchangeRateAch: 8,
        projectedRecoveryTimeMin: 15,
        estimatedEnergyCostUsd: 3.20,
        status: 'PENDING_APPROVAL',
        responseVerificationStatus: 'STAGED',
        residualRiskScore: 24
      }
    ];
  }

  public getConfig(): AutomatedResponseConfig {
    return { ...this.config };
  }

  public setOptInAutonomousMode(enabled: boolean): void {
    this.config.optInAutonomousMode = enabled;
    // If enabled, auto-execute any currently pending responses
    if (enabled) {
      this.adjustments = this.adjustments.map((adj) => {
        if (adj.status === 'PENDING_APPROVAL') {
          return {
            ...adj,
            status: 'EXECUTED_AUTONOMOUSLY',
            executedAt: new Date().toISOString(),
            approvedBy: 'Autonomous Closed-Loop HVAC Sentinel (Opt-In Enabled)',
            responseVerificationStatus: 'OPTIMIZING'
          };
        }
        return adj;
      });
    }
    this.notify();
  }

  public getAdjustments(): CorrectiveHvacAdjustment[] {
    return [...this.adjustments].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  public approveAdjustment(id: string, approverName: string = 'EHS Operations Manager'): void {
    this.adjustments = this.adjustments.map((adj) => {
      if (adj.id === id) {
        return {
          ...adj,
          status: 'APPROVED_AND_EXECUTED',
          approvedBy: approverName,
          executedAt: new Date().toISOString(),
          responseVerificationStatus: 'OPTIMIZING'
        };
      }
      return adj;
    });
    this.notify();
  }

  public dismissAdjustment(id: string): void {
    this.adjustments = this.adjustments.map((adj) => {
      if (adj.id === id) {
        return {
          ...adj,
          status: 'DISMISSED',
          responseVerificationStatus: 'OVERRIDDEN'
        };
      }
      return adj;
    });
    this.notify();
  }

  /**
   * Simulates detection of a low-to-medium environmental anomaly
   * and stages or automatically executes a corrective HVAC adjustment.
   */
  public simulateEnvironmentalAnomaly(): CorrectiveHvacAdjustment {
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const isMedium = Math.random() > 0.5;
    const now = new Date().toISOString();

    const presets = [
      {
        metric: 'Ambient Relative Humidity Surge',
        condition: 'Zone relative humidity reached 74% with latent heat accumulation (MEDIUM)',
        zoneId: 'Foundry-Furnace-Bay-B',
        zoneName: 'Foundry & Furnace Bay B',
        measured: '74.2% RH / 32.4°C',
        baseline: '< 55% RH / 26.0°C',
        equipment: 'Foundry Roof Exhaust Dampers & Dehumidification Chiller Coil B',
        directive: 'Command Roof Louvers 1-4 to 100% full purge and drop Chiller Coil setpoint by -3.0°C to condense ambient vapor.',
        delta: -3.0,
        ach: 12,
        time: 14,
        cost: 5.60
      },
      {
        metric: 'Carbon Dioxide (CO2) Stagnation',
        condition: 'CO2 concentration elevated to 1,080 ppm in packing cell (LOW)',
        zoneId: 'Warehouse-Logistics-Hub-North',
        zoneName: 'Warehouse Logistics Hub North',
        measured: '1,080 ppm CO2',
        baseline: '< 700 ppm CO2',
        equipment: 'HVAC Economizer Outdoor Air Damper 03',
        directive: 'Open economizer fresh outdoor air intake from 15% to 65% to purge carbon dioxide buildup.',
        delta: -1.2,
        ach: 9,
        time: 10,
        cost: 1.80
      },
      {
        metric: 'Thermal Microclimate Inversion',
        condition: 'Localized mezzanine radiant temperature exceeded 30.5°C (LOW)',
        zoneId: 'Chemical-Processing-Sublevel',
        zoneName: 'Chemical Processing Sublevel',
        measured: '30.8°C Mezzanine RTD',
        baseline: '< 25.5°C Nominal',
        equipment: 'Circulation Destratification Blower Array & Subgrade Chiller Loop',
        directive: 'Engage ceiling destratification fans at 75% speed and lower chilled water supply to 19.5°C.',
        delta: -2.2,
        ach: 8,
        time: 16,
        cost: 3.10
      }
    ];

    const pick = presets[Math.floor(Math.random() * presets.length)];
    const status: AdjustmentStatus = this.config.optInAutonomousMode
      ? 'EXECUTED_AUTONOMOUSLY'
      : 'PENDING_APPROVAL';

    const newAdjustment: CorrectiveHvacAdjustment = {
      id: `RESP-HVAC-${idNum}`,
      triggeredAt: now,
      anomalyMetric: pick.metric,
      triggerCondition: pick.condition,
      zoneId: pick.zoneId,
      zoneName: pick.zoneName,
      riskTier: isMedium ? 'MEDIUM' : 'LOW',
      measuredValue: pick.measured,
      targetBaseline: pick.baseline,
      targetEquipment: pick.equipment,
      actionDirective: pick.directive,
      damperAperturePct: 85,
      temperatureDeltaC: pick.delta,
      airExchangeRateAch: pick.ach,
      projectedRecoveryTimeMin: pick.time,
      estimatedEnergyCostUsd: pick.cost,
      status,
      approvedBy: this.config.optInAutonomousMode
        ? 'Autonomous Closed-Loop HVAC Sentinel (Opt-In Enabled)'
        : undefined,
      executedAt: this.config.optInAutonomousMode ? now : undefined,
      responseVerificationStatus: this.config.optInAutonomousMode ? 'OPTIMIZING' : 'STAGED',
      residualRiskScore: 22
    };

    this.adjustments = [newAdjustment, ...this.adjustments];
    this.notify();
    return newAdjustment;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const automatedResponseService = new AutomatedResponseService();

import {
  IoTEndpointFailureForecast,
  DegradationDataPoint,
  ActiveAnomalyAlert,
  IoTEndpointType,
  ThirtyDayDegradationProjectionPoint
} from '../types';

export const INITIAL_IOT_ENDPOINTS: IoTEndpointFailureForecast[] = [
  {
    endpointId: 'SENS-VIB-402',
    endpointName: 'Piezoelectric Accelerometer 402',
    endpointType: 'ACCELEROMETER',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4',
    firmwareVersion: 'v3.4.1-rc2',
    installDate: '2025-08-14',
    lastCalibrationDate: '2026-05-10',
    healthScore: 34,
    failureProbabilityPct: 88,
    degradationRatePctPerDay: 4.8,
    mttfHours: 19.4,
    remainingUsefulLifeDays: 0.8,
    forecastHorizon: 'CRITICAL_FAIL_24H',
    driftDeltaPercent: +18.4,
    signalToNoiseRatioDb: 14.2, // degraded from 38dB
    batteryVoltage: 3.12, // nominal 3.6V
    packetLossRatePct: 7.8,
    currentAnomalyAttribution:
      'High-frequency mechanical harmonic shock from heavy machinery coupled with extreme ambient thermal exposure (>38°C) causing piezoelectric ceramic micro-fractures.',
    rootCauseVulnerability: 'Piezo crystal polarization drift under persistent high-g cyclic resonance.',
    prescribedPreventiveAction:
      'Emergency sensor head swap with heavy-duty ceramic isolated unit (Model PCB-603C01); replace mounting stud.',
    costAvoidanceUsd: 14200,
    historicalDegradationSeries: [
      { day: '-12d', observedHealth: 88, predictedDegradation: 88, failureThreshold: 30 },
      { day: '-10d', observedHealth: 82, predictedDegradation: 83, failureThreshold: 30 },
      { day: '-8d', observedHealth: 74, predictedDegradation: 76, failureThreshold: 30 },
      { day: '-6d', observedHealth: 66, predictedDegradation: 68, failureThreshold: 30 },
      { day: '-4d', observedHealth: 54, predictedDegradation: 57, failureThreshold: 30 },
      { day: '-2d', observedHealth: 42, predictedDegradation: 45, failureThreshold: 30 },
      { day: 'Today', observedHealth: 34, predictedDegradation: 34, failureThreshold: 30 },
      { day: '+1d (Proj)', observedHealth: 26, predictedDegradation: 26, failureThreshold: 30 },
      { day: '+2d (Proj)', observedHealth: 18, predictedDegradation: 18, failureThreshold: 30 },
      { day: '+3d (Proj)', observedHealth: 11, predictedDegradation: 11, failureThreshold: 30 }
    ]
  },
  {
    endpointId: 'SENS-PPG-109',
    endpointName: 'Wearable Optical PPG Band Node 109',
    endpointType: 'PPG_BIOMETRIC',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4',
    firmwareVersion: 'v2.18.0',
    installDate: '2026-01-20',
    lastCalibrationDate: '2026-09-01',
    healthScore: 48,
    failureProbabilityPct: 71,
    degradationRatePctPerDay: 3.2,
    mttfHours: 54.0,
    remainingUsefulLifeDays: 2.3,
    forecastHorizon: 'HIGH_FAIL_72H',
    driftDeltaPercent: -12.1,
    signalToNoiseRatioDb: 18.5,
    batteryVoltage: 3.28,
    packetLossRatePct: 4.2,
    currentAnomalyAttribution:
      'Repeated sweat salinity ingress and optical emitter lumen decay during outdoor continuous heat stress cohorts.',
    rootCauseVulnerability: 'Photodiode glass scratch & silicone gasket degradation from abrasive silica dust.',
    prescribedPreventiveAction:
      'Issue replacement IP68 hermetically sealed wearable wristband; recalibrate baseline heart rate variability zero-offset.',
    costAvoidanceUsd: 4800,
    historicalDegradationSeries: [
      { day: '-12d', observedHealth: 92, predictedDegradation: 91, failureThreshold: 30 },
      { day: '-10d', observedHealth: 86, predictedDegradation: 85, failureThreshold: 30 },
      { day: '-8d', observedHealth: 79, predictedDegradation: 78, failureThreshold: 30 },
      { day: '-6d', observedHealth: 71, predictedDegradation: 70, failureThreshold: 30 },
      { day: '-4d', observedHealth: 63, predictedDegradation: 62, failureThreshold: 30 },
      { day: '-2d', observedHealth: 55, predictedDegradation: 54, failureThreshold: 30 },
      { day: 'Today', observedHealth: 48, predictedDegradation: 48, failureThreshold: 30 },
      { day: '+1d (Proj)', observedHealth: 41, predictedDegradation: 41, failureThreshold: 30 },
      { day: '+2d (Proj)', observedHealth: 34, predictedDegradation: 34, failureThreshold: 30 },
      { day: '+3d (Proj)', observedHealth: 27, predictedDegradation: 27, failureThreshold: 30 }
    ]
  },
  {
    endpointId: 'SENS-GAS-303',
    endpointName: 'Subgrade Tunnel Multi-Gas PID Sensor 303',
    endpointType: 'GAS_PID',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Subgrade Tunnel Conduit 7',
    firmwareVersion: 'v4.0.5',
    installDate: '2025-11-05',
    lastCalibrationDate: '2026-08-15',
    healthScore: 56,
    failureProbabilityPct: 58,
    degradationRatePctPerDay: 2.1,
    mttfHours: 110.0,
    remainingUsefulLifeDays: 4.6,
    forecastHorizon: 'ELEVATED_FAIL_7D',
    driftDeltaPercent: +9.6,
    signalToNoiseRatioDb: 22.0,
    batteryVoltage: 3.42,
    packetLossRatePct: 2.9,
    currentAnomalyAttribution:
      'Continuous exposure to subgrade diesel particulate matter and high relative humidity (84%) causing UV lamp window deposition.',
    rootCauseVulnerability: 'Krypton lamp window coating decay reducing ionization potential of target VOC molecules.',
    prescribedPreventiveAction:
      'Perform ultrasonic clean of 10.6 eV lamp window; recalibrate span gas with isobutylene standard.',
    costAvoidanceUsd: 19500,
    historicalDegradationSeries: [
      { day: '-12d', observedHealth: 95, predictedDegradation: 94, failureThreshold: 30 },
      { day: '-10d', observedHealth: 90, predictedDegradation: 89, failureThreshold: 30 },
      { day: '-8d', observedHealth: 84, predictedDegradation: 83, failureThreshold: 30 },
      { day: '-6d', observedHealth: 76, predictedDegradation: 75, failureThreshold: 30 },
      { day: '-4d', observedHealth: 70, predictedDegradation: 68, failureThreshold: 30 },
      { day: '-2d', observedHealth: 62, predictedDegradation: 61, failureThreshold: 30 },
      { day: 'Today', observedHealth: 56, predictedDegradation: 56, failureThreshold: 30 },
      { day: '+1d (Proj)', observedHealth: 51, predictedDegradation: 51, failureThreshold: 30 },
      { day: '+2d (Proj)', observedHealth: 46, predictedDegradation: 46, failureThreshold: 30 },
      { day: '+3d (Proj)', observedHealth: 41, predictedDegradation: 41, failureThreshold: 30 }
    ]
  },
  {
    endpointId: 'GATEWAY-LORA-01',
    endpointName: 'Warehouse Logistics Industrial LoRa Gateway',
    endpointType: 'EDGE_GATEWAY',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Warehouse Logistics Hub North',
    firmwareVersion: 'v5.2.0-lts',
    installDate: '2025-03-10',
    lastCalibrationDate: '2026-04-12',
    healthScore: 78,
    failureProbabilityPct: 22,
    degradationRatePctPerDay: 0.6,
    mttfHours: 520.0,
    remainingUsefulLifeDays: 21.5,
    forecastHorizon: 'NOMINAL',
    driftDeltaPercent: +2.1,
    signalToNoiseRatioDb: 31.4,
    batteryVoltage: 12.4, // DC line powered
    packetLossRatePct: 0.4,
    currentAnomalyAttribution:
      'Nominal performance. Minor packet collisions during forklift cluster shifts.',
    rootCauseVulnerability: 'None detected; standard capacitor heat dissipation nominal.',
    prescribedPreventiveAction: 'Scheduled routine antenna VSWR sweep at next 90-day maintenance interval.',
    costAvoidanceUsd: 3200,
    historicalDegradationSeries: [
      { day: '-12d', observedHealth: 98, predictedDegradation: 98, failureThreshold: 30 },
      { day: '-10d', observedHealth: 96, predictedDegradation: 95, failureThreshold: 30 },
      { day: '-8d', observedHealth: 93, predictedDegradation: 92, failureThreshold: 30 },
      { day: '-6d', observedHealth: 89, predictedDegradation: 88, failureThreshold: 30 },
      { day: '-4d', observedHealth: 85, predictedDegradation: 84, failureThreshold: 30 },
      { day: '-2d', observedHealth: 81, predictedDegradation: 81, failureThreshold: 30 },
      { day: 'Today', observedHealth: 78, predictedDegradation: 78, failureThreshold: 30 },
      { day: '+1d (Proj)', observedHealth: 76, predictedDegradation: 76, failureThreshold: 30 },
      { day: '+2d (Proj)', observedHealth: 74, predictedDegradation: 74, failureThreshold: 30 },
      { day: '+3d (Proj)', observedHealth: 72, predictedDegradation: 72, failureThreshold: 30 }
    ]
  },
  {
    endpointId: 'SENS-TEMP-201',
    endpointName: 'Assembly Line Thermal Heat Flux Array 201',
    endpointType: 'SKIN_TEMP_PROBE',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    firmwareVersion: 'v1.9.4',
    installDate: '2026-02-14',
    lastCalibrationDate: '2026-07-22',
    healthScore: 41,
    failureProbabilityPct: 82,
    degradationRatePctPerDay: 3.9,
    mttfHours: 32.0,
    remainingUsefulLifeDays: 1.3,
    forecastHorizon: 'CRITICAL_FAIL_24H',
    driftDeltaPercent: -15.8,
    signalToNoiseRatioDb: 16.0,
    batteryVoltage: 3.18,
    packetLossRatePct: 6.1,
    currentAnomalyAttribution:
      'Infrared thermopile detector lens contamination from robotic welding flux spatter causing severe negative temperature read bias.',
    rootCauseVulnerability: 'Silicon filter lens carbonization from continuous high-temperature weld arcs.',
    prescribedPreventiveAction:
      'Replace disposable zinc selenide protective shield; execute two-point thermal blackbody calibration.',
    costAvoidanceUsd: 11200,
    historicalDegradationSeries: [
      { day: '-12d', observedHealth: 90, predictedDegradation: 90, failureThreshold: 30 },
      { day: '-10d', observedHealth: 83, predictedDegradation: 84, failureThreshold: 30 },
      { day: '-8d', observedHealth: 75, predictedDegradation: 76, failureThreshold: 30 },
      { day: '-6d', observedHealth: 66, predictedDegradation: 67, failureThreshold: 30 },
      { day: '-4d', observedHealth: 58, predictedDegradation: 57, failureThreshold: 30 },
      { day: '-2d', observedHealth: 48, predictedDegradation: 48, failureThreshold: 30 },
      { day: 'Today', observedHealth: 41, predictedDegradation: 41, failureThreshold: 30 },
      { day: '+1d (Proj)', observedHealth: 33, predictedDegradation: 33, failureThreshold: 30 },
      { day: '+2d (Proj)', observedHealth: 25, predictedDegradation: 25, failureThreshold: 30 },
      { day: '+3d (Proj)', observedHealth: 17, predictedDegradation: 17, failureThreshold: 30 }
    ]
  }
];

export function generate30DayDegradationProjection(
  endpoint: IoTEndpointFailureForecast,
  stressMultiplier: number = 1.0
): ThirtyDayDegradationProjectionPoint[] {
  const points: ThirtyDayDegradationProjectionPoint[] = [];
  const baseHealth = endpoint.healthScore;
  const degradationRate = endpoint.degradationRatePctPerDay * stressMultiplier;
  const now = new Date();

  let currentHealth = baseHealth;

  for (let day = 1; day <= 30; day++) {
    const futureDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    const dateLabel = futureDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    // Nonlinear degradation curve modeling accelerated decay past warning floor
    const accelerationFactor = currentHealth < 50 ? 1.25 : 1.0;
    const dayDegradation = Number((degradationRate * accelerationFactor * (1 + 0.04 * Math.sin(day * 0.7))).toFixed(2));
    currentHealth = Math.max(0, Number((currentHealth - dayDegradation).toFixed(1)));

    // Confidence interval widens over time (heteroscedastic predictive uncertainty)
    const uncertaintyMargin = Number((1.2 + day * 0.35).toFixed(1));
    const upperConfidenceBound = Math.min(100, Number((currentHealth + uncertaintyMargin).toFixed(1)));
    const lowerConfidenceBound = Math.max(0, Number((currentHealth - uncertaintyMargin).toFixed(1)));

    const cumulativeLoss = Number((100 - currentHealth).toFixed(1));

    // Sigmoidal failure probability
    let failProb = Math.min(99, Math.round(100 / (1 + Math.exp((currentHealth - 28) / 8))));
    if (currentHealth <= 30) failProb = Math.max(85, failProb);

    let status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL_FAILURE' = 'NOMINAL';
    if (currentHealth <= 30) {
      status = 'CRITICAL_FAILURE';
    } else if (currentHealth <= 50) {
      status = 'ELEVATED';
    }

    points.push({
      day,
      dayLabel: `Day +${day}`,
      dateLabel,
      healthIndex: currentHealth,
      upperConfidenceBound,
      lowerConfidenceBound,
      dailyDegradationRate: dayDegradation,
      cumulativeDegradationPct: cumulativeLoss,
      failureProbabilityPct: failProb,
      criticalThreshold: 30,
      warningFloor: 50,
      status
    });
  }

  return points;
}

class PredictiveMaintenanceForecastManager {
  private endpoints: IoTEndpointFailureForecast[] = INITIAL_IOT_ENDPOINTS.map((ep) => ({
    ...ep,
    thirtyDayProjection: generate30DayDegradationProjection(ep, 1.0)
  }));
  private listeners: Set<() => void> = new Set();
  private stressMultiplier: number = 1.0;

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getEndpoints(): IoTEndpointFailureForecast[] {
    return [...this.endpoints];
  }

  public setStressMultiplier(mult: number) {
    this.stressMultiplier = mult;
    this.endpoints = this.endpoints.map((ep) => {
      const baseProb = ep.failureProbabilityPct;
      const adjustedProb = Math.min(99, Math.round(baseProb * mult));
      const adjustedMttf = Math.max(4, Math.round(ep.mttfHours / mult));
      const adjustedRul = Number((ep.remainingUsefulLifeDays / mult).toFixed(1));
      let horizon = ep.forecastHorizon;
      if (adjustedMttf <= 24) horizon = 'CRITICAL_FAIL_24H';
      else if (adjustedMttf <= 72) horizon = 'HIGH_FAIL_72H';
      else if (adjustedMttf <= 168) horizon = 'ELEVATED_FAIL_7D';
      else horizon = 'NOMINAL';

      const projected = generate30DayDegradationProjection(
        { ...ep, failureProbabilityPct: adjustedProb, mttfHours: adjustedMttf },
        mult
      );

      return {
        ...ep,
        failureProbabilityPct: adjustedProb,
        mttfHours: adjustedMttf,
        remainingUsefulLifeDays: adjustedRul,
        forecastHorizon: horizon,
        thirtyDayProjection: projected
      };
    });
    this.notify();
  }

  public getStressMultiplier(): number {
    return this.stressMultiplier;
  }

  public get30DayProjection(endpointId: string): ThirtyDayDegradationProjectionPoint[] {
    const ep = this.endpoints.find((e) => e.endpointId === endpointId);
    if (!ep) return [];
    if (ep.thirtyDayProjection && ep.thirtyDayProjection.length === 30) {
      return ep.thirtyDayProjection;
    }
    return generate30DayDegradationProjection(ep, this.stressMultiplier);
  }

  public stageMaintenanceForEndpoint(endpointId: string): IoTEndpointFailureForecast | null {
    const idx = this.endpoints.findIndex((ep) => ep.endpointId === endpointId);
    if (idx === -1) return null;

    const ep = this.endpoints[idx];
    const updated: IoTEndpointFailureForecast = {
      ...ep,
      isStagedForMaintenance: true
    };
    this.endpoints[idx] = updated;
    this.notify();
    return updated;
  }

  public executePreventiveCalibration(endpointId: string): IoTEndpointFailureForecast | null {
    const idx = this.endpoints.findIndex((ep) => ep.endpointId === endpointId);
    if (idx === -1) return null;

    const ep = this.endpoints[idx];
    const recalibratedBase: IoTEndpointFailureForecast = {
      ...ep,
      healthScore: 96,
      failureProbabilityPct: 8,
      degradationRatePctPerDay: 0.4,
      mttfHours: 720.0,
      remainingUsefulLifeDays: 30.0,
      forecastHorizon: 'NOMINAL',
      driftDeltaPercent: 0.2,
      signalToNoiseRatioDb: 36.5,
      batteryVoltage: 3.6,
      packetLossRatePct: 0.1,
      isStagedForMaintenance: false,
      lastCalibrationDate: new Date().toISOString().slice(0, 10),
      historicalDegradationSeries: ep.historicalDegradationSeries.map((d, i) =>
        i >= 6 ? { ...d, observedHealth: 96, predictedDegradation: 96 } : d
      )
    };

    const newProjection = generate30DayDegradationProjection(recalibratedBase, this.stressMultiplier);
    const updated: IoTEndpointFailureForecast = {
      ...recalibratedBase,
      thirtyDayProjection: newProjection
    };

    this.endpoints[idx] = updated;
    this.notify();
    return updated;
  }

  public exportForecastCsv(): void {
    const headers = [
      'Endpoint_ID',
      'Name',
      'Type',
      'Zone',
      'Health_Score',
      'Failure_Probability_Pct',
      'Degradation_Rate_Pct_Per_Day',
      'MTTF_Hours',
      'RUL_Days',
      'Failure_Horizon',
      'Sensor_Drift_Pct',
      'SNR_dB',
      'Battery_V',
      'Packet_Loss_Pct',
      'Root_Cause_Vulnerability',
      'Prescribed_Action',
      'Cost_Avoidance_USD'
    ];

    const rows = this.endpoints.map((ep) => [
      `"${ep.endpointId}"`,
      `"${ep.endpointName.replace(/"/g, '""')}"`,
      `"${ep.endpointType}"`,
      `"${ep.zoneName.replace(/"/g, '""')}"`,
      ep.healthScore,
      ep.failureProbabilityPct,
      ep.degradationRatePctPerDay,
      ep.mttfHours,
      ep.remainingUsefulLifeDays,
      `"${ep.forecastHorizon}"`,
      ep.driftDeltaPercent,
      ep.signalToNoiseRatioDb,
      ep.batteryVoltage,
      ep.packetLossRatePct,
      `"${ep.rootCauseVulnerability.replace(/"/g, '""')}"`,
      `"${ep.prescribedPreventiveAction.replace(/"/g, '""')}"`,
      ep.costAvoidanceUsd
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IoT_Endpoint_Failure_Forecast_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceForecastManager();

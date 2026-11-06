import { FacilityZone, TelemetryDataPoint } from '../types';

export type TrendPrecursorSeverity = 'ELEVATED_DRIFT' | 'MODERATE_DRIFT' | 'EARLY_WATCH';

export type PredictiveTrendType =
  | 'AUTONOMIC_DECELERATION'
  | 'THERMAL_ACCUMULATION'
  | 'CARDIAC_DRIFT'
  | 'RESPIRATORY_SYNERGY';

export interface PredictiveTrendAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  trendType: PredictiveTrendType;
  title: string;
  metricName: string;
  currentKalmanSmoothedValue: string;
  rawJitterRange: string;
  baselineValue: string;
  acuteBreachThreshold: string;
  kalmanDriftVelocity: string; // e.g. "-2.6 ms/hr"
  driftDirection: 'DECAY' | 'SURGE';
  estimatedLeadTimeToBreach: string; // e.g. "2h 15m"
  leadTimeHours: number;
  confidencePct: number;
  rSquared: number;
  kalmanVarianceP: number;
  precursorSeverity: TrendPrecursorSeverity;
  contributingFactors: string[];
  recommendedEarlyAction: string;
  status: 'ACTIVE_PRECURSOR' | 'MITIGATION_STAGED' | 'MONITORING';
  detectedAt: string;
  cohortSize: number;
}

export function generatePredictiveTrendAlerts(
  telemetryStream: TelemetryDataPoint[] = [],
  zones: FacilityZone[] = []
): PredictiveTrendAlert[] {
  // If telemetry stream has points, calculate latest smoothed values
  const latestPoint = telemetryStream[telemetryStream.length - 1];
  const hrvSmoothed = latestPoint?.smoothed_hrv || 46.2;
  const tempSmoothed = latestPoint?.smoothed_skin_temp || 37.45;

  return [
    {
      id: 'TRD-HRV-8841',
      zoneId: 'Outdoor-Construction-Sector-4',
      zoneName: 'Outdoor-Construction-Sector-4',
      trendType: 'AUTONOMIC_DECELERATION',
      title: 'Progressive Autonomic Deceleration (HRV Decay Slope)',
      metricName: 'Autonomic HRV Tone (ms)',
      currentKalmanSmoothedValue: `${hrvSmoothed} ms`,
      rawJitterRange: '±7.8 ms transient noise suppressed',
      baselineValue: '64.0 ms',
      acuteBreachThreshold: '32.0 ms (Critical Syncope Floor)',
      kalmanDriftVelocity: '-2.6 ms/hour',
      driftDirection: 'DECAY',
      estimatedLeadTimeToBreach: '2h 15m before acute alarm',
      leadTimeHours: 2.25,
      confidencePct: 96.4,
      rSquared: 0.94,
      kalmanVarianceP: 0.021,
      precursorSeverity: 'ELEVATED_DRIFT',
      contributingFactors: [
        'Prolonged continuous solar radiation (WBGT > 34°C)',
        'Sustained cardiovascular work without autonomic reset period',
        'Delayed parasympathetic reactivation between exertion cycles'
      ],
      recommendedEarlyAction:
        'Schedule mandatory 15-minute active shaded cooling break and administer 400ml chilled electrolyte solution immediately to reset autonomic trajectory before cardiac exhaustion.',
      status: 'ACTIVE_PRECURSOR',
      detectedAt: '14 mins ago',
      cohortSize: 18
    },
    {
      id: 'TRD-TMP-6102',
      zoneId: 'Smelting-Metal-Foundry',
      zoneName: 'Smelting & Metal Foundry',
      trendType: 'THERMAL_ACCUMULATION',
      title: 'Sub-Clinical Core Temperature Creep (Thermal Accumulation)',
      metricName: 'Skin/Core Temperature (°C)',
      currentKalmanSmoothedValue: `${tempSmoothed}°C`,
      rawJitterRange: '±0.45°C sensor contact noise filtered',
      baselineValue: '36.5°C',
      acuteBreachThreshold: '38.5°C (OSHA Hyperthermia Emergency)',
      kalmanDriftVelocity: '+0.21°C/hour',
      driftDirection: 'SURGE',
      estimatedLeadTimeToBreach: '3h 10m before acute alarm',
      leadTimeHours: 3.17,
      confidencePct: 94.1,
      rSquared: 0.91,
      kalmanVarianceP: 0.034,
      precursorSeverity: 'ELEVATED_DRIFT',
      contributingFactors: [
        'Radiant blast furnace emission exceeding baseline absorption capacity',
        'Impaired sweat evaporation rate in high ambient humidity',
        'In-situ microclimate stagnant air pockets near ladle pouring zone'
      ],
      recommendedEarlyAction:
        'Activate portable high-velocity auxiliary chiller fans in pouring bay and rotate casting technicians to control pulpit on a 30-minute staggered cycle.',
      status: 'ACTIVE_PRECURSOR',
      detectedAt: '26 mins ago',
      cohortSize: 14
    },
    {
      id: 'TRD-HYP-7319',
      zoneId: 'Subgrade-Tunnel-Conduit-7',
      zoneName: 'Subgrade-Tunnel-Conduit-7',
      trendType: 'RESPIRATORY_SYNERGY',
      title: 'Synergistic Subgrade Particulate & TWL Fatigue Trend',
      metricName: 'Thermal Work Limit (W/m²) & HRV Drift',
      currentKalmanSmoothedValue: 'TWL 104.5 W/m² (Falling), HRV -14.2%',
      rawJitterRange: '±12 W/m² barometric sensor fluctuation',
      baselineValue: '145.0 W/m²',
      acuteBreachThreshold: '90.0 W/m² (Work Stop Limit)',
      kalmanDriftVelocity: '-3.8 W/m²/hour',
      driftDirection: 'DECAY',
      estimatedLeadTimeToBreach: '3h 45m before acute alarm',
      leadTimeHours: 3.75,
      confidencePct: 91.8,
      rSquared: 0.88,
      kalmanVarianceP: 0.042,
      precursorSeverity: 'MODERATE_DRIFT',
      contributingFactors: [
        'Subterranean utility piping installation confined space ventilation drop',
        'Progressive accumulation of micro-particulates elevating respiratory workload',
        'Continuous kneeling posture restricting lower extremity venous return'
      ],
      recommendedEarlyAction:
        'Increase auxiliary scrubbed ventilation flow rates by 25% and mandate 10-minute posture elevation rotation at tunnel mouth.',
      status: 'ACTIVE_PRECURSOR',
      detectedAt: '42 mins ago',
      cohortSize: 8
    },
    {
      id: 'TRD-CRD-3208',
      zoneId: 'Warehouse-Logistics-Hub-North',
      zoneName: 'Warehouse-Logistics-Hub-North',
      trendType: 'CARDIAC_DRIFT',
      title: 'Resting Pulse Decoupling & Cumulative Exertion Drift',
      metricName: 'Kalman Baseline Resting Heart Rate',
      currentKalmanSmoothedValue: '88 bpm during stationary scans',
      rawJitterRange: '±6 bpm wrist motion artifact suppressed',
      baselineValue: '72 bpm',
      acuteBreachThreshold: '105 bpm (Resting Tachycardia)',
      kalmanDriftVelocity: '+3.4 bpm/hour',
      driftDirection: 'SURGE',
      estimatedLeadTimeToBreach: '4h 50m before acute alarm',
      leadTimeHours: 4.83,
      confidencePct: 89.5,
      rSquared: 0.86,
      kalmanVarianceP: 0.048,
      precursorSeverity: 'EARLY_WATCH',
      contributingFactors: [
        'High-bay inventory order picking pace without sufficient micro-recovery pauses',
        'Consecutive shift cumulative sleep debt accumulation (avg 2.8h deficit)',
        'Hydration intake lagging calculated metabolic sweat rate by 35%'
      ],
      recommendedEarlyAction:
        'Rebalance order distribution to allocate automated pallet lifters to high-rack aisles and enforce hydration re-supply check-in.',
      status: 'ACTIVE_PRECURSOR',
      detectedAt: '58 mins ago',
      cohortSize: 25
    }
  ];
}

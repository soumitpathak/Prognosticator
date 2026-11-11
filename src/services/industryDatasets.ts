import { TelemetryDataPoint } from '../types';

export interface IndustryScenario {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  hazardProfile: string[];
  expectedRiskTier: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'STABLE';
  keyClinicalFindings: string;
  sampleCount: number;
  data: TelemetryDataPoint[];
}

/**
 * Generates realistic 24-point time-series matching specific industrial hazard dynamics
 */
function createScenarioData(params: {
  baseTemp: number;
  tempPeakDelta: number;
  baseHrv: number;
  hrvDepressionDelta: number;
  baseSkinTemp: number;
  skinTempRise: number;
  baseHeartRate: number;
  heartRateRise: number;
  baseNoise: number;
  baseTwl: number;
  baseAqi: number;
  baseVibration: number;
  anomalyHourStart: number;
  anomalyHourEnd: number;
  zoneName: string;
}): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const baseTime = new Date();
  baseTime.setHours(0, 0, 0, 0);

  for (let h = 0; h < 24; h++) {
    const time = new Date(baseTime.getTime() + h * 60 * 60 * 1000);
    const hourStr = `${time.getHours().toString().padStart(2, '0')}:00`;

    // Diurnal factor peaks around hour 14 (2 PM)
    const diurnalFactor = Math.sin(((h - 6) / 18) * Math.PI);
    const isDaytime = h >= 6 && h <= 20;
    const isAnomaly = h >= params.anomalyHourStart && h <= params.anomalyHourEnd;

    // Environmental calculations
    const ambientTemp = Number(
      (params.baseTemp + (isDaytime ? diurnalFactor * params.tempPeakDelta : 0) + (isAnomaly ? 3.5 : 0)).toFixed(1)
    );
    const rawNoise = Math.round(
      params.baseNoise + (isDaytime ? Math.random() * 8 : -15) + (isAnomaly ? 14 : 0)
    );
    const smoothedNoise = Math.round(rawNoise * 0.95);
    const twl = Math.round(
      Math.max(65, params.baseTwl - (isAnomaly ? 35 : isDaytime ? 20 : 0))
    );
    const aqi = Math.round(params.baseAqi + (isAnomaly ? 45 : Math.random() * 10));

    // Physiological calculations
    const heartRate = Math.round(
      params.baseHeartRate + (isDaytime ? 15 : 0) + (isAnomaly ? params.heartRateRise : 0) + (Math.random() * 6 - 3)
    );
    const rawHrv = Math.round(
      Math.max(12, params.baseHrv - (isAnomaly ? params.hrvDepressionDelta : 0) + (Math.random() * 6 - 3))
    );
    const smoothedHrv = Math.round(rawHrv + 1);
    const hrvDropPct = Math.round(((params.baseHrv - smoothedHrv) / params.baseHrv) * 100);

    const skinTemp = Number(
      (params.baseSkinTemp + (isAnomaly ? params.skinTempRise : (Math.random() * 0.4 - 0.2))).toFixed(1)
    );
    const smoothedSkinTemp = skinTemp;

    // Machinery telemetry
    const vibration = Number(
      (params.baseVibration + (isAnomaly ? 4.2 : Math.random() * 0.4)).toFixed(2)
    );
    const bearingTemp = Number((ambientTemp + 42 + (isAnomaly ? 24 : 0)).toFixed(1));

    // Composite risk score (0-100)
    let risk = isAnomaly ? 86 : isDaytime ? 48 : 22;
    risk = Math.max(0, Math.min(100, Math.round(risk + Math.random() * 8 - 4)));

    points.push({
      timestamp: time.toISOString(),
      timeLabel: hourStr,
      ambient_temp_c: ambientTemp,
      noise_db: smoothedNoise,
      raw_noise_db: rawNoise,
      smoothed_noise_db: smoothedNoise,
      twl_index: twl,
      aqi,
      hrv_drop_pct: Math.max(0, hrvDropPct),
      raw_hrv: rawHrv,
      smoothed_hrv: smoothedHrv,
      skin_temp_c: skinTemp,
      raw_skin_temp: skinTemp,
      smoothed_skin_temp: smoothedSkinTemp,
      sick_leave_rate_deviation: isAnomaly ? 3.8 : 0.8,
      is_anomaly: isAnomaly,
      risk_score: risk,
      heart_rate_bpm: heartRate,
      raw_heart_rate_bpm: heartRate,
      equipment_vibration_mm_s: vibration,
      equipment_bearing_temp_c: bearingTemp,
      zone: params.zoneName
    });
  }

  return points;
}

export const INDUSTRY_SCENARIOS: IndustryScenario[] = [
  {
    id: 'FOUNDRY_SMELTER',
    name: 'Blast Furnace & Molten Cast Line',
    industry: 'Foundry & Heavy Metallurgy',
    location: 'Duisburg / Ruhr Valley Smelting Complex',
    description:
      'Continuous blast furnace tapping cell. High radiant heat exposure with intense infrared radiation and elevated acoustic noise from extraction blowers.',
    hazardProfile: [
      'Radiant Heat > 48°C',
      'Severe TWL Depression (< 90 W/m²)',
      'Acoustic Pressure > 100 dBA',
      'Exhaust Blower Vibration'
    ],
    expectedRiskTier: 'CRITICAL_RISK',
    keyClinicalFindings:
      'Marked autonomic parasympathetic withdrawal (RMSSD drops from 68ms to 18ms between 13:00-17:00), severe cardiac drift (heart rate sustains 132 bpm), and skin temperature rises to 38.6°C, indicating compensatory evaporative limit exhaustion.',
    sampleCount: 24,
    data: createScenarioData({
      baseTemp: 34.0,
      tempPeakDelta: 12.0, // Peaks at 46-48°C
      baseHrv: 68,
      hrvDepressionDelta: 48, // Plummets to 20ms
      baseSkinTemp: 36.6,
      skinTempRise: 2.0, // Reaches 38.6°C
      baseHeartRate: 74,
      heartRateRise: 52, // Climbs to 126-134 bpm
      baseNoise: 88,
      baseTwl: 140, // Drops to ~85 W/m² during crisis
      baseAqi: 75,
      baseVibration: 2.8,
      anomalyHourStart: 12,
      anomalyHourEnd: 17,
      zoneName: 'Foundry-Blast-Furnace-A'
    })
  },
  {
    id: 'UNDERGROUND_MINING',
    name: 'Sub-Level Deep Extraction Shaft',
    industry: 'Underground Mining & Tunneling',
    location: 'Sudbury Basin / Sub-Level 4000',
    description:
      'Confined deep-rock stope with high relative humidity (>85%), thermal virgin rock conduction, and diesel particulate exhaust.',
    hazardProfile: [
      'High Wet-Bulb Humidity (88% RH)',
      'Thermal Rock Conduction (38°C)',
      'Diesel PM2.5 Accumulation',
      'Confined Circulation'
    ],
    expectedRiskTier: 'HIGH_RISK',
    keyClinicalFindings:
      'Impaired latent sweat evaporation due to 88% relative humidity. Sustained core temperature elevation with elevated respiratory rate and sleep deficit-induced autonomic blunting.',
    sampleCount: 24,
    data: createScenarioData({
      baseTemp: 32.0,
      tempPeakDelta: 6.0,
      baseHrv: 64,
      hrvDepressionDelta: 32,
      baseSkinTemp: 36.5,
      skinTempRise: 1.4,
      baseHeartRate: 78,
      heartRateRise: 36,
      baseNoise: 92,
      baseTwl: 110,
      baseAqi: 135,
      baseVibration: 3.2,
      anomalyHourStart: 10,
      anomalyHourEnd: 16,
      zoneName: 'Underground-Shaft-Level-4'
    })
  },
  {
    id: 'DESERT_INFRASTRUCTURE',
    name: 'Desert Pipeline & Solar Construction',
    industry: 'Civil Infrastructure & Energy',
    location: 'Rub al Khali / Sector 4 Solar Park',
    description:
      'Unshaded open-air civil trenching under intense direct solar irradiance (WBGT > 42°C) with desert dust aerosol.',
    hazardProfile: [
      'Solar Radiation WBGT > 42°C',
      'Apparent Heat Index > 50°C',
      'Acute Dehydration Prodrome',
      'Silica Airborne Dust'
    ],
    expectedRiskTier: 'CRITICAL_RISK',
    keyClinicalFindings:
      'Acute rapid tachycardia (138 bpm), acute heat illness prodrome, severe autonomic fatigue, and extreme TWL drop requiring immediate oral fluid rehydration and cold-pack tent dispatch.',
    sampleCount: 24,
    data: createScenarioData({
      baseTemp: 35.0,
      tempPeakDelta: 14.0, // Reaches 49°C midday
      baseHrv: 70,
      hrvDepressionDelta: 50,
      baseSkinTemp: 36.7,
      skinTempRise: 2.2,
      baseHeartRate: 72,
      heartRateRise: 60,
      baseNoise: 80,
      baseTwl: 130,
      baseAqi: 110,
      baseVibration: 2.1,
      anomalyHourStart: 11,
      anomalyHourEnd: 16,
      zoneName: 'Desert-Solar-Sector-4'
    })
  },
  {
    id: 'COLD_CHAIN_LOGISTICS',
    name: 'Sub-Zero Cryogenic Fulfillment Bay',
    industry: 'Cold Storage & Biological Logistics',
    location: 'Antwerp Intermodal Cryo-Depot',
    description:
      'Industrial blast freezer and cold packaging terminal (-22°C ambient). Extreme vasoconstriction with rapid peripheral cooling and shivering thermogenesis.',
    hazardProfile: [
      'Deep Sub-Zero (-22°C)',
      'Peripheral Vasoconstriction',
      'Cold-Induced Hypertension',
      'Ergonomic Lifting in Heavy Thermal PPE'
    ],
    expectedRiskTier: 'MODERATE_RISK',
    keyClinicalFindings:
      'Sharp peripheral vasoconstriction resulting in dropped skin temperature (33.8°C), paradoxically elevated blood pressure and sudden heart rate spikes upon entering airlock transitions.',
    sampleCount: 24,
    data: createScenarioData({
      baseTemp: -18.0,
      tempPeakDelta: -4.0, // Drops to -22°C
      baseHrv: 72,
      hrvDepressionDelta: 24,
      baseSkinTemp: 36.2,
      skinTempRise: -2.4, // Drops to 33.8°C
      baseHeartRate: 70,
      heartRateRise: 30,
      baseNoise: 76,
      baseTwl: 180,
      baseAqi: 35,
      baseVibration: 1.5,
      anomalyHourStart: 8,
      anomalyHourEnd: 14,
      zoneName: 'Cold-Storage-Bay-C'
    })
  }
];

/**
 * Converts a scenario data points array to an RFC-4180 compliant CSV string
 */
export function scenarioToCsvString(scenario: IndustryScenario): string {
  const headers = [
    'Timestamp',
    'Time_Label',
    'Zone',
    'Ambient_Temp_C',
    'Skin_Temp_C',
    'Heart_Rate_BPM',
    'HRV_RMSSD_ms',
    'HRV_Drop_Pct',
    'Noise_dBA',
    'Thermal_Work_Limit_TWL',
    'AQI',
    'Equipment_Vibration_mm_s',
    'Equipment_Bearing_Temp_C',
    'Is_Anomaly',
    'Risk_Score_Pct'
  ];

  const rows = scenario.data.map((d) => [
    `"${d.timestamp}"`,
    `"${d.timeLabel}"`,
    `"${d.zone || scenario.name}"`,
    d.ambient_temp_c,
    d.skin_temp_c,
    d.heart_rate_bpm ?? 75,
    d.smoothed_hrv,
    d.hrv_drop_pct,
    d.noise_db,
    d.twl_index,
    d.aqi,
    d.equipment_vibration_mm_s ?? 2.1,
    d.equipment_bearing_temp_c ?? 55,
    d.is_anomaly ? 1 : 0,
    d.risk_score
  ].join(','));

  const metaHeader = [
    `# PROGNOSTICATOR INDUSTRIAL BENCHMARK DATASET`,
    `# Industry: ${scenario.industry}`,
    `# Location: ${scenario.location}`,
    `# Scenario: ${scenario.name}`,
    `# Description: ${scenario.description}`,
    `# Hazards: ${scenario.hazardProfile.join('; ')}`,
    `# Expected Risk Classification: ${scenario.expectedRiskTier}`,
    `# Generated: ${new Date().toISOString()}`
  ].join('\r\n');

  return [metaHeader, headers.join(','), ...rows].join('\r\n');
}

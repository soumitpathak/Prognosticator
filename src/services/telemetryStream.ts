import { ActiveAnomalyAlert, FacilityZone, TelemetryDataPoint, TelemetryPacket, SystemAuditLogEntry } from '../types';
import { defaultKalman } from './kalmanFilter';

/**
 * Synthetic Multi-Signal Telemetry Generator
 * Generates realistic 24-hour sliding telemetry streams
 * with diurnal temperature cycles, ambient noise levels (dB), TWL heat strain index,
 * AQI air quality, heart rate variability (HRV), and skin temperature.
 */

export const INITIAL_FACILITY_ZONES: FacilityZone[] = [
  {
    id: 'Outdoor-Construction-Sector-4',
    name: 'Outdoor-Construction-Sector-4',
    status: 'CRITICAL',
    count: 18,
    temp: '44.2°C',
    heatIndex: 42.5,
    twl: 92.4,
    aqi: 154,
    description: 'Direct sun exposure, asphalt laying & structural steel work',
    activeHazards: ['Severe Thermal Radiation', 'High Wet-Bulb Load', 'Acoustic Machinery Overexposure'],
    latitude: 25.0657,
    longitude: 55.1713,
    customBaselines: {
      baselineHrv: 64,
      baselineSkinTemp: 36.6,
      noiseLimitDb: 90,
      heatThresholdC: 40
    }
  },
  {
    id: 'Manufacturing-Assembly-Line-B',
    name: 'Manufacturing-Assembly-Line-B',
    status: 'STABLE',
    count: 42,
    temp: '31.0°C',
    heatIndex: 28.5,
    twl: 142.1,
    aqi: 48,
    description: 'Indoor climate-controlled precision robotic assembly line',
    activeHazards: ['Repetitive Ergonomic Strain', 'Moderate Acoustic Noise'],
    latitude: 37.7749,
    longitude: -122.4194,
    customBaselines: {
      baselineHrv: 70,
      baselineSkinTemp: 36.4,
      noiseLimitDb: 80,
      heatThresholdC: 32
    }
  },
  {
    id: 'Warehouse-Logistics-Hub-North',
    name: 'Warehouse-Logistics-Hub-North',
    status: 'MODERATE',
    count: 25,
    temp: '36.5°C',
    heatIndex: 35.8,
    twl: 118.0,
    aqi: 95,
    description: 'High-bay inventory sorting and forklift logistics bay',
    activeHazards: ['Moderate Ambient Heat', 'Continuous Material Handling', 'Diesel Particulate AQI'],
    latitude: 29.9792,
    longitude: 31.1342,
    customBaselines: {
      baselineHrv: 66,
      baselineSkinTemp: 36.5,
      noiseLimitDb: 85,
      heatThresholdC: 36
    }
  },
  {
    id: 'Subgrade-Tunnel-Conduit-7',
    name: 'Subgrade-Tunnel-Conduit-7 (Suppressed)',
    status: 'MODERATE',
    count: 8,
    temp: '38.1°C',
    heatIndex: 37.0,
    twl: 104.5,
    aqi: 122,
    description: 'Subterranean utility piping installation cohort (N=8 < 12)',
    activeHazards: ['Confined Space', 'k-Anonymity Small-Cell Suppressed'],
    latitude: 40.7128,
    longitude: -74.0060,
    customBaselines: {
      baselineHrv: 65,
      baselineSkinTemp: 36.5,
      noiseLimitDb: 88,
      heatThresholdC: 34
    }
  }
];

export const INITIAL_ACTIVE_ALERTS: ActiveAnomalyAlert[] = [
  {
    id: 'ALR-8842-CR',
    worker_id: 'W-9921',
    location_zone: 'Outdoor-Construction-Sector-4',
    detected_at: '12 mins ago',
    anomaly_metric: 'Acute Autonomic & Thermal Strain',
    raw_value: 'HRV: 31 ms (Jitter: ±8ms), Skin: 38.4°C',
    kalman_smoothed_value: 'HRV: 34.2 ms, Skin: 38.15°C',
    severity: 'CRITICAL',
    kalman_status: 'Jitter Filtered & Validated',
    lead_time: '3.8h Prior to Syncope',
    recommended_action: 'Immediate extraction: Escort cohort member to air-conditioned shelter, administer 500ml oral rehydration solution.',
    acknowledged: false,
    privacy_status: 'k-Anonymity Cleared (N=18 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  },
  {
    id: 'ALR-PM-9042',
    worker_id: 'EQUIP-CONV-4B',
    location_zone: 'Outdoor-Construction-Sector-4',
    detected_at: '18 mins ago',
    anomaly_metric: 'Predictive Maintenance: Bearing Vibration & Motor Casing Heat',
    raw_value: 'Vibration: 7.2 mm/s RMS, Casing Heat: 89.1°C',
    kalman_smoothed_value: 'Vibration: 6.85 mm/s, Casing Heat: 86.4°C',
    severity: 'CRITICAL',
    kalman_status: 'Jitter Filtered & Validated',
    lead_time: '18.5h To Bearing Cage Failure',
    recommended_action: 'LOTO Stage 2: Immediate conveyor drive motor isolation and roller bearing replacement to prevent shaft seizure.',
    acknowledged: false,
    privacy_status: 'Machine Telemetry (ISO 10816 Vibration Compliance)',
    alert_type: 'PREDICTIVE_MAINTENANCE',
    equipment_id: 'MTR-DRIVE-4B',
    equipment_name: 'Conveyor Drive Motor 4B',
    equipment_subsystem: 'Drive Roller Bearing Sleeve & Stator',
    vibration_mm_s: 6.85,
    equipment_temp_c: 86.4,
    iso_10816_class: 'ISO 10816-3 Class II (Severe Zone C/D)',
    maintenance_urgency: 'BEARING_REPLACEMENT'
  },
  {
    id: 'ALR-8839-HG',
    worker_id: 'W-6104',
    location_zone: 'Outdoor-Construction-Sector-4',
    detected_at: '28 mins ago',
    anomaly_metric: 'Acoustic Machinery Overexposure & Temp Spike',
    raw_value: 'Noise: 104.8 dB, Ambient: 45.1°C',
    kalman_smoothed_value: 'Noise: 98.4 dB, Ambient: 44.2°C',
    severity: 'HIGH',
    kalman_status: 'Transient Noise Suppressed',
    lead_time: '2.5h Permissible Limit Exceeded',
    recommended_action: 'Mandatory noise ear-defender inspection and immediate mechanical vibration damper check.',
    acknowledged: false,
    privacy_status: 'k-Anonymity Cleared (N=18 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  },
  {
    id: 'ALR-PM-7120',
    worker_id: 'EQUIP-PMP-02',
    location_zone: 'Warehouse-Logistics-Hub-North',
    detected_at: '36 mins ago',
    anomaly_metric: 'Predictive Maintenance: Rotor Harmonic Jitter & Pump Heat',
    raw_value: 'Vibration: 5.4 mm/s RMS, Heat: 76.5°C',
    kalman_smoothed_value: 'Vibration: 4.92 mm/s, Heat: 74.8°C',
    severity: 'HIGH',
    kalman_status: 'Transient Noise Suppressed',
    lead_time: '34.0h Mechanical Runout Margin',
    recommended_action: 'Apply synthetic high-temp lubrication to thrust bearing assembly; inspect suction manifold for fluid cavitation.',
    acknowledged: false,
    privacy_status: 'Machine Telemetry (ISO 10816 Vibration Compliance)',
    alert_type: 'PREDICTIVE_MAINTENANCE',
    equipment_id: 'PMP-CHILLER-02',
    equipment_name: 'Primary HVAC Chilled Water Pump',
    equipment_subsystem: 'Impeller Shaft & Thrust Bearing',
    vibration_mm_s: 4.92,
    equipment_temp_c: 74.8,
    iso_10816_class: 'ISO 10816-3 Class II (Warning Zone B/C)',
    maintenance_urgency: 'SCHEDULED_LUBRICATION'
  },
  {
    id: 'ALR-8827-MD',
    worker_id: 'W-3209',
    location_zone: 'Warehouse-Logistics-Hub-North',
    detected_at: '54 mins ago',
    anomaly_metric: 'Sleep Debt & Progressive Heart Rate Drift',
    raw_value: 'HRV Drop: 22.4%, Sleep Debt: 3.5h',
    kalman_smoothed_value: 'HRV Drop: 19.8% (Imputed 2 dropped packets)',
    severity: 'MODERATE',
    kalman_status: 'Signal Imputed',
    lead_time: '4.2h Shift Fatigue Horizon',
    recommended_action: 'Rotate worker from high-bay forklift operations to floor-level scanning station.',
    acknowledged: false,
    privacy_status: 'k-Anonymity Cleared (N=25 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  },
  {
    id: 'ALR-PM-4105',
    worker_id: 'EQUIP-BLW-03',
    location_zone: 'Manufacturing-Assembly-Line-B',
    detected_at: '1h 10m ago',
    anomaly_metric: 'Predictive Maintenance: Dynamic Unbalance Jitter',
    raw_value: 'Vibration: 4.1 mm/s RMS, Motor: 69.8°C',
    kalman_smoothed_value: 'Vibration: 3.75 mm/s, Motor: 68.2°C',
    severity: 'MODERATE',
    kalman_status: 'Signal Imputed',
    lead_time: '72.0h Preventive Service Window',
    recommended_action: 'Clean particulate residue from centrifugal blower blades to restore dynamic rotational balance.',
    acknowledged: false,
    privacy_status: 'Machine Telemetry (ISO 10816 Vibration Compliance)',
    alert_type: 'PREDICTIVE_MAINTENANCE',
    equipment_id: 'FAN-EXHAUST-03',
    equipment_name: 'Centrifugal Exhaust Blower 3',
    equipment_subsystem: 'Impeller Fan Blades & Dynamic Balance',
    vibration_mm_s: 3.75,
    equipment_temp_c: 68.2,
    iso_10816_class: 'ISO 10816-3 Class I (Borderline Zone B)',
    maintenance_urgency: 'ROTOR_REBALANCE'
  },
  {
    id: 'ALR-8815-LW',
    worker_id: 'W-7140',
    location_zone: 'Manufacturing-Assembly-Line-B',
    detected_at: '1h 35m ago',
    anomaly_metric: 'Transient Electro-Magnetic Noise Deviation',
    raw_value: 'Skin Temp spike: +1.8°C (single second)',
    kalman_smoothed_value: 'Skin Temp normalized: 36.7°C',
    severity: 'LOW',
    kalman_status: 'Confirmed Sensor Spike',
    lead_time: 'Zero Clinical Impact',
    recommended_action: 'No operational extraction necessary. Sensor lead recalibration logged in telemetry audit.',
    acknowledged: true,
    privacy_status: 'k-Anonymity Cleared (N=42 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  },
  {
    id: 'ALR-8809-HG',
    worker_id: 'W-5182',
    location_zone: 'Outdoor-Construction-Sector-4',
    detected_at: '1h 48m ago',
    anomaly_metric: 'Thermal Radiation & Progressive Core Temperature Creep',
    raw_value: 'Skin Temp: 38.3°C, TWL Index: 88 W/m²',
    kalman_smoothed_value: 'Skin Temp: 38.05°C, TWL Index: 90.2 W/m²',
    severity: 'HIGH',
    kalman_status: 'Jitter Filtered & Validated',
    lead_time: '1.8h Heat Exhaustion Horizon',
    recommended_action: 'Enforce scheduled rotational shaded cooling and administer chilled 250ml electrolyte pouch.',
    acknowledged: false,
    privacy_status: 'k-Anonymity Cleared (N=18 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  },
  {
    id: 'ALR-PM-3890',
    worker_id: 'EQUIP-HYD-04',
    location_zone: 'Warehouse-Logistics-Hub-North',
    detected_at: '2h 15m ago',
    anomaly_metric: 'Predictive Maintenance: Hydraulic Actuator Cavitation & Pressure Jitter',
    raw_value: 'Vibration: 5.8 mm/s RMS, Manifold Pressure: 182 bar',
    kalman_smoothed_value: 'Vibration: 5.25 mm/s, Manifold Pressure: 179 bar',
    severity: 'HIGH',
    kalman_status: 'Confirmed Sensor Spike',
    lead_time: '28.0h Actuator Seal Degradation Limit',
    recommended_action: 'Bleed entrained air from secondary hydraulic valve block and replenish ISO VG 46 fluid reservoir.',
    acknowledged: true,
    privacy_status: 'Machine Telemetry (ISO 10816 Vibration Compliance)',
    alert_type: 'PREDICTIVE_MAINTENANCE',
    equipment_id: 'ACT-HYD-04',
    equipment_name: 'High-Bay Lift Hydraulic Actuator 4',
    equipment_subsystem: 'Secondary Cylinder Piston & High-Pressure Seal',
    vibration_mm_s: 5.25,
    equipment_temp_c: 72.1,
    iso_10816_class: 'ISO 10816-3 Class II (Warning Zone C)',
    maintenance_urgency: 'SCHEDULED_LUBRICATION'
  },
  {
    id: 'ALR-8798-MD',
    worker_id: 'W-4420',
    location_zone: 'Manufacturing-Assembly-Line-B',
    detected_at: '2h 40m ago',
    anomaly_metric: 'Ergonomic Joint Acceleration & Rapid Micro-Fatigue',
    raw_value: 'Wrist Angular Velocity: 142 deg/s, Fatigue Index: 68%',
    kalman_smoothed_value: 'Angular Velocity: 128 deg/s, Fatigue Index: 64%',
    severity: 'MODERATE',
    kalman_status: 'Signal Imputed',
    lead_time: '3.6h Repetitive Strain Window',
    recommended_action: 'Perform ergonomic workstation height adjustment; schedule mandatory 10-minute upper-body micro-break.',
    acknowledged: true,
    privacy_status: 'k-Anonymity Cleared (N=42 ≥ 12)',
    alert_type: 'HEALTH_ANOMALY'
  }
];

export function generateSyntheticStream(hours = 24, freqMinutes = 15): TelemetryDataPoint[] {
  const pointsCount = Math.floor((hours * 60) / freqMinutes);
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const rawHrvList: number[] = [];
  const rawSkinList: number[] = [];
  const rawNoiseList: number[] = [];
  const rawHeartRateList: number[] = [];

  const rawData: Array<{
    timestamp: string;
    timeLabel: string;
    ambient_temp_c: number;
    raw_noise_db: number;
    twl_index: number;
    aqi: number;
    hrv_drop_pct: number;
    raw_hrv: number;
    raw_skin_temp: number;
    raw_heart_rate_bpm: number;
    sick_leave_rate_deviation: number;
    is_anomaly: boolean;
    equipment_vibration_mm_s?: number;
    equipment_bearing_temp_c?: number;
  }> = [];

  const anomalyStart = Math.floor(pointsCount * 0.65);
  const anomalyEnd = Math.floor(pointsCount * 0.88);

  for (let i = 0; i < pointsCount; i++) {
    const pointTime = new Date(startTime.getTime() + i * freqMinutes * 60 * 1000);
    const progress = i / pointsCount;

    // Diurnal temperature sinusoid (peak in afternoon)
    const diurnal = Math.sin(progress * 2 * Math.PI - Math.PI / 2);
    let ambientTemp = 32.0 + 6.0 * diurnal + (Math.random() - 0.5) * 1.2;
    let twlIndex = 140.0 - (ambientTemp - 30.0) * 3.5 + (Math.random() - 0.5) * 2.5;
    let aqi = 90.0 + 20.0 * Math.sin(progress * 4 * Math.PI) + (Math.random() - 0.5) * 5.0;

    // Industrial noise levels: baseline ~72 dB with midday spikes to 95+ dB plus sensor acoustic flutter
    const workShiftFactor = Math.sin(progress * Math.PI); // higher during mid-shift
    let rawNoise = 68.0 + 18.0 * Math.max(0, workShiftFactor) + (Math.random() - 0.5) * 6.5;

    let hrvDropPct = 5.0 + (Math.random() - 0.5) * 4.0;
    let skinTemp = 36.6 + (Math.random() - 0.5) * 0.25;
    let sickLeaveDev = Math.max(0, (Math.random() - 0.5) * 0.4);

    // Industrial vibration & motor/bearing heat metrics for Predictive Maintenance & multi-variable correlations
    let equipVibration = 1.8 + 0.08 * (rawNoise - 60) + (Math.random() - 0.5) * 0.4;
    let equipBearingTemp = 48.0 + 0.75 * (ambientTemp - 25.0) + 0.15 * (rawNoise - 60) + (Math.random() - 0.5) * 1.5;

    // Heart rate baseline: ~72-76 bpm with exertion and diurnal modulation
    let heartRate = 72.0 + 8.0 * Math.max(0, workShiftFactor) + (ambientTemp - 28.0) * 0.8 + (Math.random() - 0.5) * 5.0;

    const isAnomaly = i >= anomalyStart && i <= anomalyEnd;
    if (isAnomaly) {
      ambientTemp += 8.5;
      twlIndex -= 35.0;
      aqi += 65.0;
      rawNoise += 14.5;
      hrvDropPct += 28.5;
      skinTemp += 1.35;
      sickLeaveDev += 2.4;
      equipVibration += 3.8; // Exceeds ISO 10816 4.5 mm/s limit
      equipBearingTemp += 26.5; // High thermal spike in bearing casing (> 82°C)
      heartRate += 38.0 + (Math.random() - 0.5) * 6.0; // Tachycardic surge reaching 120-132 bpm
    }

    const rawHrv = Math.max(25, 68.0 * (1.0 - hrvDropPct / 100) + (Math.random() - 0.5) * 6.0);
    rawHrvList.push(rawHrv);
    rawSkinList.push(skinTemp);
    rawNoiseList.push(rawNoise);
    rawHeartRateList.push(heartRate);

    rawData.push({
      timestamp: pointTime.toISOString(),
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ambient_temp_c: Number(ambientTemp.toFixed(1)),
      raw_noise_db: Number(rawNoise.toFixed(1)),
      twl_index: Number(twlIndex.toFixed(1)),
      aqi: Math.round(aqi),
      hrv_drop_pct: Number(Math.min(100, Math.max(0, hrvDropPct)).toFixed(1)),
      raw_hrv: Number(rawHrv.toFixed(1)),
      raw_skin_temp: Number(skinTemp.toFixed(2)),
      raw_heart_rate_bpm: Math.round(heartRate),
      sick_leave_rate_deviation: Number(sickLeaveDev.toFixed(2)),
      is_anomaly: isAnomaly,
      equipment_vibration_mm_s: Number(Math.max(0.5, equipVibration).toFixed(2)),
      equipment_bearing_temp_c: Number(equipBearingTemp.toFixed(1))
    });
  }

  // Smooth series through Kalman filter
  const smoothedHrvList = defaultKalman.smooth(rawHrvList);
  const smoothedSkinList = defaultKalman.smooth(rawSkinList);
  const smoothedNoiseList = defaultKalman.smooth(rawNoiseList);
  const smoothedHeartRateList = defaultKalman.smooth(rawHeartRateList);

  return rawData.map((d, idx) => {
    const sHrv = smoothedHrvList[idx];
    const sTemp = smoothedSkinList[idx];
    const sNoise = smoothedNoiseList[idx];
    const sHeartRate = smoothedHeartRateList[idx];

    // Compute continuous risk score 0 - 100
    const hrvDrop = Math.max(0, 68.0 - sHrv) / 68.0;
    const tempSpike = Math.max(0, sTemp - 36.5) / 36.5;
    const heatLoad = Math.max(0, d.ambient_temp_c - 32.0) / 20.0;
    const noiseFactor = Math.max(0, sNoise - 85.0) / 30.0;
    const heartRateStrain = Math.max(0, sHeartRate - 100.0) / 40.0;
    const mse = 0.3 * hrvDrop + 0.2 * tempSpike + 0.2 * heatLoad + 0.1 * noiseFactor + 0.1 * heartRateStrain + 0.1 * (d.sick_leave_rate_deviation / 4.0);
    const riskProb = 1.0 / (1.0 + Math.exp(-12 * (mse - 0.25)));

    return {
      ...d,
      noise_db: sNoise,
      smoothed_noise_db: sNoise,
      smoothed_hrv: sHrv,
      skin_temp_c: sTemp,
      smoothed_skin_temp: sTemp,
      heart_rate_bpm: Math.round(sHeartRate),
      raw_heart_rate_bpm: d.raw_heart_rate_bpm,
      risk_score: Number((riskProb * 100).toFixed(1))
    };
  });
}

/**
 * Generate multi-variable correlation dataset for Recharts ScatterPlot analysis
 */
export function generateCorrelationDataset(zoneId?: string): import('../types').SensorCorrelationPoint[] {
  const points: import('../types').SensorCorrelationPoint[] = [];
  const zones = INITIAL_FACILITY_ZONES.map((z) => z.id);

  // Generate 80 realistic sample points with controlled multi-variable cluster correlations
  // (e.g. Ambient Temp vs Noise, Vibration vs Motor Heat, Ambient Temp vs HRV drop)
  for (let i = 0; i < 90; i++) {
    const assignedZone = zones[i % zones.length];
    if (zoneId && zoneId !== 'ALL' && assignedZone !== zoneId) continue;

    const isConstruction = assignedZone === 'Outdoor-Construction-Sector-4';
    const isLogistics = assignedZone === 'Warehouse-Logistics-Hub-North';
    const isAssembly = assignedZone === 'Manufacturing-Assembly-Line-B';

    // Ambient Temp & Noise base
    let baseTemp = isConstruction ? 38 + Math.random() * 8 : isLogistics ? 32 + Math.random() * 6 : 28 + Math.random() * 5;
    let baseNoise = isConstruction ? 82 + Math.random() * 20 : isAssembly ? 76 + Math.random() * 14 : 70 + Math.random() * 16;

    // Physical coupling: High equipment load produces higher acoustic noise and higher motor vibration
    let equipVibration = 1.2 + ((baseNoise - 65) / 35) * 2.8 + (Math.random() - 0.5) * 0.8;
    // Motor heat correlates with ambient heat and vibration friction
    let equipHeat = 45 + (baseTemp - 25) * 0.65 + equipVibration * 4.8 + (Math.random() - 0.5) * 3.5;

    // Physiological strain: skin temp and HRV drop correlate with ambient heat and noise stress
    let skinTemp = 36.4 + Math.max(0, (baseTemp - 32) * 0.08) + (Math.random() - 0.5) * 0.3;
    let hrvDrop = Math.max(2, (baseTemp - 28) * 1.6 + (baseNoise - 70) * 0.8 + (Math.random() - 0.5) * 6);
    let rawHrv = Math.max(28, 68 * (1 - hrvDrop / 100));
    let twlIndex = Math.max(70, 160 - baseTemp * 2.1 - (baseNoise - 70) * 0.4);
    let aqi = Math.round(50 + (baseTemp - 25) * 2.2 + Math.random() * 30);

    // Hazard clusters & Incidents
    let isIncident = false;
    let incidentType: import('../types').AlertType | 'NONE' = 'NONE';
    let incidentLabel = '';
    let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';

    // Multi-variable cluster 1: High Vibration + High Motor Heat -> Predictive Maintenance Anomaly
    if (equipVibration > 4.5 || (equipVibration > 3.8 && equipHeat > 78) || (i % 14 === 0)) {
      if (Math.random() > 0.4 || i % 14 === 0) {
        isIncident = true;
        incidentType = 'PREDICTIVE_MAINTENANCE';
        if (equipVibration > 5.5 || equipHeat > 84) {
          severity = 'CRITICAL';
          equipVibration = Math.max(equipVibration, 5.8 + Math.random() * 1.8);
          equipHeat = Math.max(equipHeat, 85 + Math.random() * 8);
          incidentLabel = 'Critical Bearing Wear / High Vibration Spike';
        } else {
          severity = 'HIGH';
          equipVibration = Math.max(equipVibration, 4.6 + Math.random() * 0.8);
          equipHeat = Math.max(equipHeat, 76 + Math.random() * 6);
          incidentLabel = 'Harmonic Rotor Jitter & Thermal Overheat';
        }
      }
    }

    // Multi-variable cluster 2: High Ambient Heat (>40°C) + High Acoustic Noise (>92 dB) -> Acute Worker Heat Exhaustion
    if (!isIncident && ((baseTemp > 41 && baseNoise > 90) || (baseTemp > 43) || (i % 19 === 0))) {
      isIncident = true;
      incidentType = 'HEALTH_ANOMALY';
      if (baseTemp > 42 && hrvDrop > 35) {
        severity = 'CRITICAL';
        incidentLabel = 'Severe Heat-Acoustic Syncope Hazard';
        skinTemp = Math.max(skinTemp, 38.2);
        hrvDrop = Math.max(hrvDrop, 42);
      } else {
        severity = 'HIGH';
        incidentLabel = 'Autonomic De-compensation / Noise Fatigue';
        hrvDrop = Math.max(hrvDrop, 28);
      }
    }

    const riskScore = Math.min(
      100,
      Math.max(5, (baseTemp - 30) * 2.2 + (baseNoise - 75) * 1.5 + (equipVibration - 2) * 8 + (isIncident ? 35 : 0))
    );

    const time = new Date(Date.now() - (90 - i) * 20 * 60 * 1000);

    points.push({
      id: `CORR-PT-${1000 + i}`,
      timestamp: time.toISOString(),
      timeLabel: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      zone: assignedZone,
      ambient_temp_c: Number(baseTemp.toFixed(1)),
      noise_db: Number(baseNoise.toFixed(1)),
      equipment_vibration_mm_s: Number(equipVibration.toFixed(2)),
      equipment_bearing_temp_c: Number(equipHeat.toFixed(1)),
      skin_temp_c: Number(skinTemp.toFixed(2)),
      hrv_drop_pct: Number(hrvDrop.toFixed(1)),
      raw_hrv: Number(rawHrv.toFixed(1)),
      twl_index: Number(twlIndex.toFixed(1)),
      aqi,
      risk_score: Number(riskScore.toFixed(1)),
      is_incident: isIncident,
      incident_type: incidentType,
      incident_label: incidentLabel || (isIncident ? 'Hazard Anomaly' : 'Normal Operating Baseline'),
      severity
    });
  }

  return points;
}

/**
 * Generate a single simulated telemetry packet for a zone
 */
export function generatePacketForZone(zone: FacilityZone, injectSevereAnomaly = false): TelemetryPacket {
  const noiseHrv = () => (Math.random() - 0.5) * 6;
  const noiseTemp = () => (Math.random() - 0.5) * 0.3;

  let baseHrv = 62.0;
  let baseTemp = 36.7;
  let heatIndex = zone.heatIndex;
  let sleepDeficit = 2.0 + Math.random() * 2.0;

  if (zone.status === 'CRITICAL' || injectSevereAnomaly) {
    baseHrv = 38.5; // Severe drop
    baseTemp = 38.1; // Elevated skin temp
    heatIndex = Math.max(42.0, zone.heatIndex);
    sleepDeficit = 3.5;
  } else if (zone.status === 'MODERATE') {
    baseHrv = 52.0;
    baseTemp = 37.1;
    sleepDeficit = 2.5;
  }

  // 12-point rolling series
  const hrvSeries: number[] = [];
  const skinTempSeries: number[] = [];

  for (let i = 0; i < 12; i++) {
    hrvSeries.push(Number((baseHrv + noiseHrv()).toFixed(1)));
    skinTempSeries.push(Number((baseTemp + noiseTemp()).toFixed(2)));
  }

  return {
    worker_id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
    location_zone: zone.id,
    timestamp: new Date().toISOString(),
    hrv_series: hrvSeries,
    skin_temp_series: skinTempSeries,
    heat_index: Number(heatIndex.toFixed(1)),
    sleep_deficit_hours: Number(sleepDeficit.toFixed(1)),
    cohort_size: zone.count,
    twl_index: zone.twl,
    ambient_temp_c: parseFloat(zone.temp),
    aqi: zone.aqi
  };
}

export const INITIAL_SYSTEM_AUDIT_LOGS: SystemAuditLogEntry[] = [
  {
    id: 'AUD-TH-9841',
    timestamp: '2026-03-30 14:15:22',
    userId: 'USR-SAF-104',
    userName: 'Dr. Sarah Chen',
    userRole: 'Lead Safety Engineer',
    category: 'THRESHOLD_CHANGE',
    targetModule: 'Kalman Anomaly Filter Engine',
    parameter: 'Critical Risk Cutoff %',
    previousValue: '75.0%',
    newValue: '65.0%',
    justification: 'Heightened extreme ambient solar heatwave forecast in Sector 4; lower threshold triggers earlier preventative hydration staging.',
    approvalStatus: 'VERIFIED'
  },
  {
    id: 'AUD-TH-9820',
    timestamp: '2026-03-30 11:32:05',
    userId: 'USR-ENG-441',
    userName: 'David Ruiz',
    userRole: 'SCADA Instrumentation Specialist',
    category: 'THRESHOLD_CHANGE',
    targetModule: 'Kalman State Estimator (Core Filter)',
    parameter: 'Measurement Noise Variance (R)',
    previousValue: 'R = 0.100',
    newValue: 'R = 0.050',
    justification: 'New high-precision Bluetooth 5.4 biometric chest patches deployed; lowered sensor variance expectation to accelerate Kalman response time.',
    approvalStatus: 'VERIFIED'
  },
  {
    id: 'AUD-ZN-9788',
    timestamp: '2026-03-30 09:40:18',
    userId: 'USR-OPS-882',
    userName: 'Marcus Vance',
    userRole: 'Operations Director',
    category: 'ZONE_CONFIG',
    targetModule: 'Zone: Outdoor-Construction-Sector-4',
    parameter: 'Acoustic Permissible Limit (dB)',
    previousValue: '85.0 dBA',
    newValue: '90.0 dBA',
    justification: 'Heavy pneumatic pile driving scheduled for Shift 1; acoustic limit adjusted with mandatory Class 5 earmuff PPE protocol enforcement.',
    approvalStatus: 'VERIFIED'
  },
  {
    id: 'AUD-ZN-9755',
    timestamp: '2026-03-29 16:50:41',
    userId: 'USR-MED-042',
    userName: 'Dr. Emily Thorne',
    userRole: 'Chief Occupational Physician',
    category: 'ZONE_CONFIG',
    targetModule: 'Zone: Warehouse-Logistics-Hub-North',
    parameter: 'Baseline HRV Floor (ms)',
    previousValue: '70.0 ms',
    newValue: '66.0 ms',
    justification: 'Annual worker cohort cardiovascular baseline recalibration following seasonal health assessment.',
    approvalStatus: 'VERIFIED'
  },
  {
    id: 'AUD-TH-9712',
    timestamp: '2026-03-29 13:05:10',
    userId: 'USR-MGR-2026',
    userName: 'Alex Mercer',
    userRole: 'EHS Manager on Duty',
    category: 'THRESHOLD_CHANGE',
    targetModule: 'Kalman Process Noise Matrix',
    parameter: 'Process Covariance (Q)',
    previousValue: 'Q = 0.010',
    newValue: 'Q = 0.020',
    justification: 'Dynamic tracking adjustment for high-turnover shift changeover and rapid physiological state transitions.',
    approvalStatus: 'VERIFIED'
  },
  {
    id: 'AUD-ZN-9680',
    timestamp: '2026-03-28 10:14:33',
    userId: 'USR-OPS-882',
    userName: 'Marcus Vance',
    userRole: 'Operations Director',
    category: 'ZONE_CONFIG',
    targetModule: 'Zone: Subgrade-Tunnel-Conduit-7',
    parameter: 'Small-Cell Cell Size Threshold',
    previousValue: 'N = 10',
    newValue: 'N = 12',
    justification: 'Privacy compliance hardening to meet updated HIPAA / GDPR anonymization standards for confined space utility workers.',
    approvalStatus: 'VERIFIED'
  }
];

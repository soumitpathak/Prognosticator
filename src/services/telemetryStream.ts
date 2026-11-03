import { ActiveAnomalyAlert, FacilityZone, TelemetryDataPoint, TelemetryPacket } from '../types';
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
    activeHazards: ['Severe Thermal Radiation', 'High Wet-Bulb Load', 'Acoustic Machinery Overexposure']
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
    activeHazards: ['Repetitive Ergonomic Strain', 'Moderate Acoustic Noise']
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
    activeHazards: ['Moderate Ambient Heat', 'Continuous Material Handling', 'Diesel Particulate AQI']
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
    activeHazards: ['Confined Space', 'k-Anonymity Small-Cell Suppressed']
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
    privacy_status: 'k-Anonymity Cleared (N=18 ≥ 12)'
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
    privacy_status: 'k-Anonymity Cleared (N=18 ≥ 12)'
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
    privacy_status: 'k-Anonymity Cleared (N=25 ≥ 12)'
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
    privacy_status: 'k-Anonymity Cleared (N=42 ≥ 12)'
  }
];

export function generateSyntheticStream(hours = 24, freqMinutes = 15): TelemetryDataPoint[] {
  const pointsCount = Math.floor((hours * 60) / freqMinutes);
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const rawHrvList: number[] = [];
  const rawSkinList: number[] = [];
  const rawNoiseList: number[] = [];

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
    sick_leave_rate_deviation: number;
    is_anomaly: boolean;
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

    const isAnomaly = i >= anomalyStart && i <= anomalyEnd;
    if (isAnomaly) {
      ambientTemp += 8.5;
      twlIndex -= 35.0;
      aqi += 65.0;
      rawNoise += 14.5;
      hrvDropPct += 28.5;
      skinTemp += 1.35;
      sickLeaveDev += 2.4;
    }

    const rawHrv = Math.max(25, 68.0 * (1.0 - hrvDropPct / 100) + (Math.random() - 0.5) * 6.0);
    rawHrvList.push(rawHrv);
    rawSkinList.push(skinTemp);
    rawNoiseList.push(rawNoise);

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
      sick_leave_rate_deviation: Number(sickLeaveDev.toFixed(2)),
      is_anomaly: isAnomaly
    });
  }

  // Smooth series through Kalman filter
  const smoothedHrvList = defaultKalman.smooth(rawHrvList);
  const smoothedSkinList = defaultKalman.smooth(rawSkinList);
  const smoothedNoiseList = defaultKalman.smooth(rawNoiseList);

  return rawData.map((d, idx) => {
    const sHrv = smoothedHrvList[idx];
    const sTemp = smoothedSkinList[idx];
    const sNoise = smoothedNoiseList[idx];

    // Compute continuous risk score 0 - 100
    const hrvDrop = Math.max(0, 68.0 - sHrv) / 68.0;
    const tempSpike = Math.max(0, sTemp - 36.5) / 36.5;
    const heatLoad = Math.max(0, d.ambient_temp_c - 32.0) / 20.0;
    const noiseFactor = Math.max(0, sNoise - 85.0) / 30.0;
    const mse = 0.35 * hrvDrop + 0.2 * tempSpike + 0.25 * heatLoad + 0.1 * noiseFactor + 0.1 * (d.sick_leave_rate_deviation / 4.0);
    const riskProb = 1.0 / (1.0 + Math.exp(-12 * (mse - 0.25)));

    return {
      ...d,
      noise_db: sNoise,
      smoothed_noise_db: sNoise,
      smoothed_hrv: sHrv,
      skin_temp_c: sTemp,
      smoothed_skin_temp: sTemp,
      risk_score: Number((riskProb * 100).toFixed(1))
    };
  });
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

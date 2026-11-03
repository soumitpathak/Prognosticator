import { FacilityZone, TelemetryDataPoint, TelemetryPacket } from '../types';
import { defaultKalman } from './kalmanFilter';

/**
 * Synthetic Multi-Signal Telemetry Generator
 * Generates realistic 72-hour or live rolling industrial telemetry streams
 * with diurnal temperature cycles, TWL heat strain index, AQI air quality,
 * heart rate variability (HRV), and skin temperature.
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
    activeHazards: ['Severe Thermal Radiation', 'High Wet-Bulb Load', 'Elevated Exertion']
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
    activeHazards: ['Repetitive Ergonomic Strain']
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
    activeHazards: ['Moderate Ambient Heat', 'Continuous Material Handling']
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

export function generateSyntheticStream(hours = 24, freqMinutes = 15): TelemetryDataPoint[] {
  const pointsCount = Math.floor((hours * 60) / freqMinutes);
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const rawHrvList: number[] = [];
  const rawSkinList: number[] = [];
  const rawData: Array<{
    timestamp: string;
    timeLabel: string;
    ambient_temp_c: number;
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

    let hrvDropPct = 5.0 + (Math.random() - 0.5) * 4.0;
    let skinTemp = 36.6 + (Math.random() - 0.5) * 0.25;
    let sickLeaveDev = Math.max(0, (Math.random() - 0.5) * 0.4);

    const isAnomaly = i >= anomalyStart && i <= anomalyEnd;
    if (isAnomaly) {
      ambientTemp += 8.5;
      twlIndex -= 35.0;
      aqi += 65.0;
      hrvDropPct += 28.5;
      skinTemp += 1.35;
      sickLeaveDev += 2.4;
    }

    const rawHrv = Math.max(25, 68.0 * (1.0 - hrvDropPct / 100) + (Math.random() - 0.5) * 6.0);
    rawHrvList.push(rawHrv);
    rawSkinList.push(skinTemp);

    rawData.push({
      timestamp: pointTime.toISOString(),
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ambient_temp_c: Number(ambientTemp.toFixed(1)),
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

  return rawData.map((d, idx) => {
    const sHrv = smoothedHrvList[idx];
    const sTemp = smoothedSkinList[idx];

    // Compute continuous risk score 0 - 100
    const hrvDrop = Math.max(0, 68.0 - sHrv) / 68.0;
    const tempSpike = Math.max(0, sTemp - 36.5) / 36.5;
    const heatLoad = Math.max(0, d.ambient_temp_c - 32.0) / 20.0;
    const mse = 0.4 * hrvDrop + 0.2 * tempSpike + 0.3 * heatLoad + 0.1 * (d.sick_leave_rate_deviation / 4.0);
    const riskProb = 1.0 / (1.0 + Math.exp(-12 * (mse - 0.25)));

    return {
      ...d,
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

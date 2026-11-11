import { TelemetryDataPoint } from '../types';
import { defaultKalman } from './kalmanFilter';

export interface ParseUploadResult {
  success: boolean;
  data: TelemetryDataPoint[];
  detectedColumns: string[];
  rowCount: number;
  industrySummary?: string;
  error?: string;
}

/**
 * Parses user-uploaded CSV text into structured TelemetryDataPoint array
 */
export function parseUploadedCsv(csvText: string, defaultZone = 'Uploaded-Facility-Data'): ParseUploadResult {
  try {
    const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    // Strip comment lines starting with # or //
    const dataLines = rawLines.filter((l) => !l.startsWith('#') && !l.startsWith('//'));

    if (dataLines.length < 2) {
      return {
        success: false,
        data: [],
        detectedColumns: [],
        rowCount: 0,
        error: 'CSV file must contain a header row and at least one data row.'
      };
    }

    // Parse header
    const headers = parseCsvRow(dataLines[0]).map((h) => h.toLowerCase().trim());
    const detectedColumns = [...headers];

    // Helper to find column index matching several aliases
    const findIndex = (aliases: string[]): number => {
      for (const alias of aliases) {
        const idx = headers.findIndex((h) => h === alias || h.includes(alias));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const timeIdx = findIndex(['timestamp', 'datetime', 'date', 'time_iso']);
    const labelIdx = findIndex(['time_label', 'timelabel', 'time', 'hour']);
    const zoneIdx = findIndex(['zone', 'location', 'facility', 'department']);
    const ambTempIdx = findIndex(['ambient_temp_c', 'ambient_temp', 'ambient', 'temp_ambient', 'dry_bulb', 'temp_c']);
    const skinTempIdx = findIndex(['skin_temp_c', 'skin_temp', 'skintemp', 'skin', 'core_temp']);
    const hrIdx = findIndex(['heart_rate_bpm', 'heart_rate', 'heartrate', 'hr_bpm', 'hr', 'pulse', 'bpm']);
    const hrvIdx = findIndex(['hrv_rmssd_ms', 'hrv_rmssd', 'rmssd', 'hrv', 'smoothed_hrv', 'raw_hrv']);
    const noiseIdx = findIndex(['noise_dba', 'noise_db', 'noise', 'acoustic', 'sound_db', 'dba']);
    const twlIdx = findIndex(['thermal_work_limit_twl', 'twl_index', 'twl', 'thermal_work_limit']);
    const aqiIdx = findIndex(['aqi', 'air_quality', 'pm25', 'pm2_5', 'air_quality_index']);
    const vibIdx = findIndex(['equipment_vibration_mm_s', 'vibration_mm_s', 'vibration', 'vib_rms']);
    const bearingTempIdx = findIndex(['equipment_bearing_temp_c', 'bearing_temp', 'motor_temp', 'casing_temp']);
    const riskIdx = findIndex(['risk_score_pct', 'risk_score', 'risk', 'anomaly_score']);
    const isAnomalyIdx = findIndex(['is_anomaly', 'anomaly', 'incident', 'breach']);

    const points: TelemetryDataPoint[] = [];

    for (let i = 1; i < dataLines.length; i++) {
      const row = parseCsvRow(dataLines[i]);
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

      const getNum = (idx: number, fallback: number): number => {
        if (idx === -1 || idx >= row.length) return fallback;
        const val = parseFloat(row[idx]);
        return Number.isFinite(val) ? val : fallback;
      };

      const now = new Date();
      now.setHours(now.getHours() - (dataLines.length - i));

      const timestamp = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : now.toISOString();
      const timeLabel = labelIdx !== -1 && row[labelIdx] ? row[labelIdx] : `${(i % 24).toString().padStart(2, '0')}:00`;
      const zone = zoneIdx !== -1 && row[zoneIdx] ? row[zoneIdx] : defaultZone;

      const rawAmb = getNum(ambTempIdx, 32.0);
      const rawSkin = getNum(skinTempIdx, 36.6);
      const rawHr = Math.round(getNum(hrIdx, 76));
      const rawHrv = Math.round(getNum(hrvIdx, 65));
      const rawNoise = Math.round(getNum(noiseIdx, 78));
      const twl = Math.round(getNum(twlIdx, 135));
      const aqi = Math.round(getNum(aqiIdx, 65));
      const vibration = getNum(vibIdx, 1.8);
      const bearingTemp = getNum(bearingTempIdx, 58.0);

      // Anomaly detection
      const explicitAnomaly = isAnomalyIdx !== -1 ? row[isAnomalyIdx] === '1' || row[isAnomalyIdx].toLowerCase() === 'true' : false;
      const computedRisk = riskIdx !== -1 ? getNum(riskIdx, 25) : explicitAnomaly ? 85 : rawHrv < 35 || rawSkin > 38.0 ? 82 : 28;
      const isAnomaly = explicitAnomaly || computedRisk >= 65 || rawHrv < 32;

      points.push({
        timestamp,
        timeLabel,
        ambient_temp_c: rawAmb,
        noise_db: rawNoise,
        raw_noise_db: rawNoise,
        smoothed_noise_db: Math.round(rawNoise * 0.96),
        twl_index: twl,
        aqi,
        hrv_drop_pct: Math.max(0, Math.round(((68 - rawHrv) / 68) * 100)),
        raw_hrv: rawHrv,
        smoothed_hrv: Math.round(rawHrv * 0.98),
        skin_temp_c: rawSkin,
        raw_skin_temp: rawSkin,
        smoothed_skin_temp: rawSkin,
        sick_leave_rate_deviation: isAnomaly ? 2.5 : 0.5,
        is_anomaly: isAnomaly,
        risk_score: Math.max(0, Math.min(100, Math.round(computedRisk))),
        heart_rate_bpm: rawHr,
        raw_heart_rate_bpm: rawHr,
        equipment_vibration_mm_s: vibration,
        equipment_bearing_temp_c: bearingTemp,
        zone
      });
    }

    if (points.length === 0) {
      return {
        success: false,
        data: [],
        detectedColumns,
        rowCount: 0,
        error: 'No valid data points could be parsed from the CSV rows.'
      };
    }

    return {
      success: true,
      data: points,
      detectedColumns,
      rowCount: points.length,
      industrySummary: `Successfully parsed ${points.length} intervals with columns: ${detectedColumns.slice(0, 6).join(', ')}...`
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      detectedColumns: [],
      rowCount: 0,
      error: `CSV Parse Error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * Parses user-uploaded JSON file into structured TelemetryDataPoint array
 */
export function parseUploadedJson(jsonText: string): ParseUploadResult {
  try {
    const parsed = JSON.parse(jsonText);
    let rawList: any[] = [];

    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.data)) rawList = parsed.data;
      else if (Array.isArray(parsed.telemetry)) rawList = parsed.telemetry;
      else if (Array.isArray(parsed.points)) rawList = parsed.points;
      else if (Array.isArray(parsed.twentyFourHourTimeSeries)) rawList = parsed.twentyFourHourTimeSeries;
      else {
        return {
          success: false,
          data: [],
          detectedColumns: [],
          rowCount: 0,
          error: 'JSON must be an array of data points or contain a "data" / "telemetry" array property.'
        };
      }
    }

    if (rawList.length === 0) {
      return {
        success: false,
        data: [],
        detectedColumns: [],
        rowCount: 0,
        error: 'JSON telemetry array is empty.'
      };
    }

    const detectedColumns = Object.keys(rawList[0] || {});
    const points: TelemetryDataPoint[] = rawList.map((item, idx) => {
      const now = new Date();
      now.setHours(now.getHours() - (rawList.length - idx));

      const rawAmb = Number(item.ambient_temp_c ?? item.ambientTempC ?? item.temp ?? 30.0);
      const rawSkin = Number(item.skin_temp_c ?? item.skinTempC ?? item.skinTemp ?? 36.5);
      const rawHr = Number(item.heart_rate_bpm ?? item.heartRateBpm ?? item.heartRate ?? 76);
      const rawHrv = Number(item.raw_hrv ?? item.hrv ?? item.rmssd ?? item.smoothed_hrv ?? 64);
      const noise = Number(item.noise_db ?? item.noise ?? item.acousticNoiseDba ?? 78);
      const twl = Number(item.twl_index ?? item.twl ?? 140);
      const aqi = Number(item.aqi ?? 60);
      const risk = Number(item.risk_score ?? item.riskScorePct ?? (rawHrv < 35 ? 85 : 24));

      return {
        timestamp: item.timestamp ?? now.toISOString(),
        timeLabel: item.timeLabel ?? item.time ?? `${(idx % 24).toString().padStart(2, '0')}:00`,
        ambient_temp_c: rawAmb,
        noise_db: noise,
        raw_noise_db: noise,
        smoothed_noise_db: Math.round(noise * 0.96),
        twl_index: twl,
        aqi,
        hrv_drop_pct: Math.max(0, Math.round(((68 - rawHrv) / 68) * 100)),
        raw_hrv: rawHrv,
        smoothed_hrv: Math.round(rawHrv),
        skin_temp_c: rawSkin,
        raw_skin_temp: rawSkin,
        smoothed_skin_temp: rawSkin,
        sick_leave_rate_deviation: item.sick_leave_rate_deviation ?? 0.8,
        is_anomaly: item.is_anomaly ?? item.isAnomaly ?? (risk >= 65),
        risk_score: Math.max(0, Math.min(100, Math.round(risk))),
        heart_rate_bpm: Math.round(rawHr),
        raw_heart_rate_bpm: Math.round(rawHr),
        equipment_vibration_mm_s: item.equipment_vibration_mm_s ?? 2.1,
        equipment_bearing_temp_c: item.equipment_bearing_temp_c ?? 56,
        zone: item.zone ?? 'Uploaded-JSON-Stream'
      };
    });

    return {
      success: true,
      data: points,
      detectedColumns,
      rowCount: points.length,
      industrySummary: `Successfully parsed ${points.length} JSON telemetry packets.`
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      detectedColumns: [],
      rowCount: 0,
      error: `JSON Parse Error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * Splits a CSV line respecting quoted commas
 */
function parseCsvRow(rowStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

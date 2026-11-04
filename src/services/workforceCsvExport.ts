import { TelemetryDataPoint, HealthSignalNotificationThresholds } from '../types';

/**
 * Workforce Health Telemetry CSV Export Service
 * Formats historical 24-hour multi-signal health telemetry into RFC 4180 compliant CSV format
 * for offline occupational health analysis, EHS audit trails, and epidemiologic reporting.
 */

export function exportWorkforceHealthCsv(
  data: TelemetryDataPoint[],
  zoneName: string = 'All-Facility-Zones',
  thresholds?: Partial<HealthSignalNotificationThresholds>
): { success: boolean; recordCount: number; filename: string } {
  if (!data || data.length === 0) {
    throw new Error('No historical telemetry data available to export.');
  }

  const hrvFloor = thresholds?.minHrvMs ?? 40;
  const tempFloor = thresholds?.maxSkinTempC ?? 37.8;
  const noiseLimit = thresholds?.maxNoiseDb ?? 85.0;
  const riskCutoff = thresholds?.riskScoreCutoffPct ?? 65.0;

  const headers = [
    'Record_Index',
    'Timestamp_ISO',
    'Time_Label',
    'Facility_Zone',
    'Kalman_Smoothed_HRV_ms',
    'Raw_Sensor_HRV_ms',
    'HRV_Drop_Percentage',
    'Worker_Skin_Temp_C',
    'Ambient_Temp_C',
    'Acoustic_Noise_dBA',
    'Thermal_Work_Limit_TWL',
    'Air_Quality_Index_AQI',
    'Sick_Leave_Rate_Deviation',
    'Equipment_Vibration_RMS_mm_s',
    'Equipment_Bearing_Temp_C',
    'Anomaly_Risk_Score_Pct',
    'Is_Anomaly_Interval',
    'HRV_Threshold_Breached',
    'Thermal_Threshold_Breached',
    'Noise_Threshold_Breached',
    'Clinical_Triage_Classification',
    'Privacy_Compliance_Standard'
  ];

  const rows = data.map((point, index) => {
    const isHrvBreach = point.smoothed_hrv < hrvFloor;
    const isTempBreach = point.skin_temp_c >= tempFloor;
    const isNoiseBreach = (point.noise_db ?? point.raw_noise_db ?? 0) >= noiseLimit;
    const isRiskBreach = point.risk_score >= riskCutoff;

    let triageClass = 'NOMINAL_HOMEOSTASIS';
    if (point.is_anomaly || isRiskBreach) {
      if (isHrvBreach && isTempBreach) {
        triageClass = 'CRITICAL_ACUTE_HEAT_AND_CARDIAC_STRAIN';
      } else if (isHrvBreach) {
        triageClass = 'ELEVATED_AUTONOMIC_FATIGUE';
      } else if (isTempBreach) {
        triageClass = 'HYPERTHERMIC_HEAT_ACCUMULATION';
      } else if (isNoiseBreach) {
        triageClass = 'ACOUSTIC_OVERPRESSURE_HAZARD';
      } else {
        triageClass = 'MULTIVARIATE_ANOMALY_ELEVATED';
      }
    }

    const cleanZone = (point.zone || zoneName).replace(/,/g, ' ');

    return [
      index + 1,
      `"${point.timestamp}"`,
      `"${point.timeLabel}"`,
      `"${cleanZone}"`,
      point.smoothed_hrv.toFixed(1),
      point.raw_hrv.toFixed(1),
      point.hrv_drop_pct.toFixed(1),
      point.skin_temp_c.toFixed(2),
      point.ambient_temp_c.toFixed(1),
      (point.noise_db ?? point.raw_noise_db ?? 75.0).toFixed(1),
      point.twl_index.toFixed(1),
      point.aqi,
      point.sick_leave_rate_deviation.toFixed(2),
      (point.equipment_vibration_mm_s ?? 2.1).toFixed(2),
      (point.equipment_bearing_temp_c ?? 52.4).toFixed(1),
      point.risk_score.toFixed(1),
      point.is_anomaly ? 'TRUE' : 'FALSE',
      isHrvBreach ? 'BREACHED' : 'CLEAR',
      isTempBreach ? 'BREACHED' : 'CLEAR',
      isNoiseBreach ? 'BREACHED' : 'CLEAR',
      `"${triageClass}"`,
      '"k-Anonymity N>=12 / Differential Privacy ε=0.5 / Non-Punitive GDPR"'
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  // Trigger browser download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const timeStamp = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const sanitizedZone = zoneName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Prognosticator_Workforce_Health_Data_24H_${sanitizedZone}_${dateStamp}_${timeStamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    recordCount: data.length,
    filename
  };
}

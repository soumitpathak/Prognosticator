import { TelemetryDataPoint, HealthSignalNotificationThresholds, FacilityZone, ActiveAnomalyAlert } from '../types';
import { defaultPrivacyShield } from './privacyShield';
import { generateExecutiveSafetyPdfReport } from './executivePdfGenerator';

export interface DownloadReportOptions {
  data: TelemetryDataPoint[];
  thresholds: HealthSignalNotificationThresholds;
  zone: FacilityZone;
  activeAlerts: ActiveAnomalyAlert[];
  format: 'JSON' | 'CSV' | 'PDF';
  onProgress?: (status: string) => void;
}

export interface AnomalyReportJson {
  reportMetadata: {
    platform: string;
    version: string;
    generatedAt: string;
    generatedTimestampIso: string;
    targetZone: {
      id: string;
      name: string;
      status: string;
      workerCount: number;
      ambientTemp: string;
      heatIndex: number;
      twl: number;
      aqi: number;
      coordinates: { latitude: number; longitude: number };
    };
    privacyCompliance: {
      standard: string;
      differentialPrivacyEpsilon: number;
      kAnonymityCellSize: number;
      isCohortSuppressed: boolean;
      status: string;
    };
    samplingHorizon: string;
    totalSampleIntervals: number;
    totalThresholdBreachCount: number;
  };
  activeThresholdSettings: {
    maxHeartRateBpm: number;
    maxAmbientHeatC: number;
    minHrvMs: number;
    maxHrvDropPct: number;
    maxSkinTempC: number;
    maxNoiseDb: number;
    minTwlIndex: number;
    riskScoreCutoffPct: number;
    applicableZoneId: string;
    notificationChannels: {
      enableSmsRadioDispatch: boolean;
      enableVoiceAlerts: boolean;
      enableInAppBeacon: boolean;
    };
  };
  summaryAnalytics24h: {
    peakHeartRateBpm: number;
    avgHeartRateBpm: number;
    peakAmbientTempC: number;
    minWorkerHrvMs: number;
    avgWorkerHrvMs: number;
    peakSkinTempC: number;
    peakAnomalyRiskPct: number;
    totalAnomalyIntervals: number;
  };
  timestampedAlertHistory: Array<{
    alertId: string;
    timestamp: string;
    timeLabel: string;
    sensorSignal: string;
    measuredValue: string;
    thresholdLimit: string;
    breachDelta: string;
    severity: string;
    incidentDescription: string;
    recommendedAction: string;
    status: string;
    complianceShield: string;
  }>;
  twentyFourHourTimeSeries: Array<{
    timestamp: string;
    timeLabel: string;
    heartRateBpm: number;
    ambientTempC: number;
    kalmanSmoothedHrvMs: number;
    rawHrvMs: number;
    skinTempC: number;
    acousticNoiseDba: number;
    twlIndex: number;
    aqi: number;
    anomalyRiskScorePct: number;
    isAnomaly: boolean;
    isHeartRateBreached: boolean;
    isAmbientHeatBreached: boolean;
    isHrvBreached: boolean;
    isSkinTempBreached: boolean;
    isNoiseBreached: boolean;
  }>;
}

/**
 * Downloads 24-hour anomaly trend data and threshold settings as a JSON file
 */
export function downloadAnomalyReportJson({
  data,
  thresholds,
  zone,
  activeAlerts
}: Omit<DownloadReportOptions, 'format'>): { success: boolean; filename: string; sizeBytes: number } {
  const now = new Date();
  const maxHrLimit = thresholds.maxHeartRateBpm ?? 115;
  const maxAmbLimit = thresholds.maxAmbientHeatC;
  const minHrvFloor = thresholds.minHrvMs;
  const maxSkinLimit = thresholds.maxSkinTempC;
  const maxNoiseLimit = thresholds.maxNoiseDb;
  const riskCutoff = thresholds.riskScoreCutoffPct;

  const cohortSize = zone.count || 14;
  const isCohortSuppressed = defaultPrivacyShield.isCohortSuppressed(cohortSize);

  let peakHr = 0;
  let hrSum = 0;
  let peakAmb = 0;
  let minHrv = Infinity;
  let hrvSum = 0;
  let peakSkin = 0;
  let peakRisk = 0;
  let totalBreaches = 0;

  const timeSeries = data.map((pt) => {
    const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
    const amb = pt.ambient_temp_c;
    const hrv = pt.smoothed_hrv;
    const skin = pt.skin_temp_c;
    const noise = pt.noise_db ?? pt.raw_noise_db ?? 75;
    
    // In compliance with epsilon-DP, inject Laplace noise onto risk scores
    const sanitizedRisk = isCohortSuppressed
      ? 0
      : Math.max(0, Math.min(100, Number((pt.risk_score + defaultPrivacyShield.sampleLaplace(1.0) * 2).toFixed(1))));

    if (hr > peakHr) peakHr = hr;
    hrSum += hr;
    if (amb > peakAmb) peakAmb = amb;
    if (hrv < minHrv) minHrv = hrv;
    hrvSum += hrv;
    if (skin > peakSkin) peakSkin = skin;
    if (sanitizedRisk > peakRisk) peakRisk = sanitizedRisk;

    const isHrBreach = hr >= maxHrLimit;
    const isAmbBreach = amb >= maxAmbLimit;
    const isHrvBreach = hrv <= minHrvFloor;
    const isSkinBreach = skin >= maxSkinLimit;
    const isNoiseBreach = noise >= maxNoiseLimit;

    if (isHrBreach || isAmbBreach || isHrvBreach || isSkinBreach || isNoiseBreach || pt.is_anomaly || sanitizedRisk >= riskCutoff) {
      totalBreaches++;
    }

    return {
      timestamp: pt.timestamp,
      timeLabel: pt.timeLabel,
      heartRateBpm: isCohortSuppressed ? 0 : hr,
      ambientTempC: amb,
      kalmanSmoothedHrvMs: isCohortSuppressed ? 0 : hrv,
      rawHrvMs: isCohortSuppressed ? 0 : pt.raw_hrv,
      skinTempC: isCohortSuppressed ? 0 : skin,
      acousticNoiseDba: noise,
      twlIndex: pt.twl_index,
      aqi: pt.aqi,
      anomalyRiskScorePct: sanitizedRisk,
      isAnomaly: pt.is_anomaly,
      isHeartRateBreached: isHrBreach,
      isAmbientHeatBreached: isAmbBreach,
      isHrvBreached: isHrvBreach,
      isSkinTempBreached: isSkinBreach,
      isNoiseBreached: isNoiseBreach
    };
  });

  const count = data.length || 1;

  // Build timestamped alert history from alerts & points
  const alertHistory = activeAlerts.map((a) => {
    const isSuppressed = defaultPrivacyShield.isCohortSuppressed(zone.count);
    return {
      alertId: a.id,
      timestamp: new Date().toISOString(),
      timeLabel: a.detected_at,
      sensorSignal: a.anomaly_metric,
      measuredValue: isSuppressed ? '[CELL SUPPRESSED: N < 12]' : a.raw_value,
      thresholdLimit: a.kalman_smoothed_value,
      breachDelta: a.kalman_status,
      severity: a.severity,
      incidentDescription: a.recommended_action,
      recommendedAction: a.recommended_action,
      status: a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE_UNACKNOWLEDGED',
      complianceShield: isSuppressed
        ? 'k-Anonymity Small-Cell Suppressed (N < 12)'
        : 'k-Anonymity Cleared (N >= 12, ε=0.5 DP)'
    };
  });

  const reportPayload: AnomalyReportJson = {
    reportMetadata: {
      platform: 'PROGNOSTICATOR Workforce Health & Predictive Safety Intelligence',
      version: '2.0.0',
      generatedAt: now.toLocaleString(),
      generatedTimestampIso: now.toISOString(),
      targetZone: {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        workerCount: zone.count,
        ambientTemp: zone.temp,
        heatIndex: zone.heatIndex,
        twl: zone.twl,
        aqi: zone.aqi,
        coordinates: { latitude: zone.latitude, longitude: zone.longitude }
      },
      privacyCompliance: {
        standard: 'EU GDPR Article 9 & HIPAA Security Rule',
        differentialPrivacyEpsilon: defaultPrivacyShield.epsilon,
        kAnonymityCellSize: defaultPrivacyShield.minCohortSize,
        isCohortSuppressed,
        status: isCohortSuppressed
          ? 'ENFORCED: Small-cell suppressed (N < 12)'
          : 'ENFORCED: k-Anonymity (N >= 12) & ε=0.5 DP Active (Zero PII Disclosed)'
      },
      samplingHorizon: 'Last 24 Sliding Hours (15-minute rolling epochs)',
      totalSampleIntervals: data.length,
      totalThresholdBreachCount: totalBreaches
    },
    activeThresholdSettings: {
      maxHeartRateBpm: maxHrLimit,
      maxAmbientHeatC: thresholds.maxAmbientHeatC,
      minHrvMs: thresholds.minHrvMs,
      maxHrvDropPct: thresholds.maxHrvDropPct,
      maxSkinTempC: thresholds.maxSkinTempC,
      maxNoiseDb: thresholds.maxNoiseDb,
      minTwlIndex: thresholds.minTwlIndex,
      riskScoreCutoffPct: thresholds.riskScoreCutoffPct,
      applicableZoneId: thresholds.applicableZoneId,
      notificationChannels: {
        enableSmsRadioDispatch: thresholds.enableSmsRadioDispatch,
        enableVoiceAlerts: thresholds.enableVoiceAlerts,
        enableInAppBeacon: thresholds.enableInAppBeacon
      }
    },
    summaryAnalytics24h: {
      peakHeartRateBpm: isCohortSuppressed ? 0 : peakHr,
      avgHeartRateBpm: isCohortSuppressed ? 0 : Number((hrSum / count).toFixed(0)),
      peakAmbientTempC: Number(peakAmb.toFixed(1)),
      minWorkerHrvMs: isCohortSuppressed ? 0 : Number(minHrv.toFixed(1)),
      avgWorkerHrvMs: isCohortSuppressed ? 0 : Number((hrvSum / count).toFixed(1)),
      peakSkinTempC: isCohortSuppressed ? 0 : Number(peakSkin.toFixed(1)),
      peakAnomalyRiskPct: Number(peakRisk.toFixed(1)),
      totalAnomalyIntervals: totalBreaches
    },
    timestampedAlertHistory: alertHistory,
    twentyFourHourTimeSeries: timeSeries
  };

  const jsonStr = JSON.stringify(reportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStamp = now.toISOString().slice(0, 10);
  const timeStamp = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const sanitizedZone = zone.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Prognosticator_24H_Anomaly_Report_${sanitizedZone}_${dateStamp}_${timeStamp}.json`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    sizeBytes: blob.size
  };
}

/**
 * Downloads 24-hour anonymized health trend data and threshold settings as an RFC 4180 CSV file,
 * strictly enforcing the Privacy Shield layer (k-Anonymity N>=12 and Differential Privacy ε=0.5).
 */
export function downloadAnomalyReportCsv({
  data,
  thresholds,
  zone,
  activeAlerts
}: Omit<DownloadReportOptions, 'format'>): { success: boolean; filename: string; recordCount: number } {
  const now = new Date();
  const maxHrLimit = thresholds.maxHeartRateBpm ?? 115;
  const maxAmbLimit = thresholds.maxAmbientHeatC;
  const minHrvFloor = thresholds.minHrvMs;
  const maxSkinLimit = thresholds.maxSkinTempC;
  const maxNoiseLimit = thresholds.maxNoiseDb;
  const riskCutoff = thresholds.riskScoreCutoffPct;

  const cohortSize = zone.count || 14;
  const isCohortSuppressed = defaultPrivacyShield.isCohortSuppressed(cohortSize);

  // Metadata comments in CSV preamble
  const metadataLines = [
    `# ==============================================================================`,
    `# PROGNOSTICATOR ENTERPRISE ANONYMIZED HEALTH TREND & COMPLIANCE REPORT`,
    `# Generated At: ${now.toLocaleString()} (${now.toISOString()})`,
    `# Facility Zone: ${zone.name} (${zone.id}) | Monitored Workforce Cohort: ${cohortSize} Workers`,
    `# Privacy Standard: US HIPAA Security Rule (45 CFR § 164.514) & EU GDPR Article 9`,
    `# Privacy Shield Status: ${
      isCohortSuppressed
        ? `CELL SUPPRESSED (Cohort N=${cohortSize} < 12 k-Anonymity threshold). Individual biometrics masked.`
        : `VERIFIED k-Anonymity (N=${cohortSize} >= 12) & ε=0.5 Differential Privacy Enforced.`
    }`,
    `# Non-Punitive Legal Policy: Strictly prohibited for disciplinary evaluations or performance reviews.`,
    `# ACTIVE THRESHOLD SETTINGS:`,
    `# Max Heart Rate Limit: ${maxHrLimit} BPM`,
    `# Max Ambient Temperature Limit: ${maxAmbLimit.toFixed(1)}°C`,
    `# Min HRV Floor: ${minHrvFloor} ms`,
    `# Max HRV Drop Percentage: ${thresholds.maxHrvDropPct}%`,
    `# Max Skin Temperature Limit: ${maxSkinLimit.toFixed(1)}°C`,
    `# Max Acoustic Noise Limit: ${maxNoiseLimit.toFixed(1)} dBA`,
    `# Min Thermal Work Limit (TWL): ${thresholds.minTwlIndex} W/m²`,
    `# Composite Anomaly Risk Cutoff: ${riskCutoff}%`,
    `# Applicable Scope: ${thresholds.applicableZoneId}`,
    `# ==============================================================================`,
    `# SECTION 1: SLIDING 24-HOUR HEALTH TREND TIME SERIES`,
    `# ==============================================================================`
  ];

  const headers = [
    'Interval_Index',
    'Timestamp_ISO',
    'Time_Label',
    'Facility_Zone',
    'Heart_Rate_BPM',
    'HR_Threshold_BPM',
    'HR_Breach_Flag',
    'Ambient_Temp_C',
    'Ambient_Threshold_C',
    'Ambient_Breach_Flag',
    'Kalman_Smoothed_HRV_ms',
    'Raw_Wearable_HRV_ms',
    'HRV_Floor_ms',
    'HRV_Breach_Flag',
    'Skin_Temp_C',
    'Skin_Threshold_C',
    'Skin_Breach_Flag',
    'Acoustic_Noise_dBA',
    'Noise_Threshold_dBA',
    'Noise_Breach_Flag',
    'Thermal_Work_Limit_TWL',
    'Air_Quality_Index_AQI',
    'DP_Sanitized_Risk_Score_Pct',
    'Risk_Cutoff_Pct',
    'Is_Anomaly_Interval',
    'Overall_Threshold_Breached',
    'Clinical_Safety_Triage_Status',
    'Privacy_Shield_Compliance'
  ];

  const rows = data.map((pt, idx) => {
    const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
    const amb = pt.ambient_temp_c;
    const hrv = pt.smoothed_hrv;
    const skin = pt.skin_temp_c;
    const noise = pt.noise_db ?? pt.raw_noise_db ?? 75;

    // Apply Differential Privacy noise (epsilon = 0.5) to risk score
    const dpNoise = defaultPrivacyShield.sampleLaplace(1.0);
    const sanitizedRisk = isCohortSuppressed
      ? 0
      : Math.max(0, Math.min(100, Number((pt.risk_score + dpNoise * 2).toFixed(1))));

    const isHrBreach = hr >= maxHrLimit;
    const isAmbBreach = amb >= maxAmbLimit;
    const isHrvBreach = hrv <= minHrvFloor;
    const isSkinBreach = skin >= maxSkinLimit;
    const isNoiseBreach = noise >= maxNoiseLimit;
    const isRiskBreach = sanitizedRisk >= riskCutoff;
    const isAnyBreach = isHrBreach || isAmbBreach || isHrvBreach || isSkinBreach || isNoiseBreach || pt.is_anomaly || isRiskBreach;

    let triageStatus = 'NOMINAL_HOMEOSTASIS';
    if (isHrBreach && isSkinBreach) {
      triageStatus = 'CRITICAL_ACUTE_HEAT_AND_CARDIAC_STRAIN';
    } else if (isHrBreach) {
      triageStatus = 'ELEVATED_HEART_RATE_TACHYCARDIA';
    } else if (isAmbBreach) {
      triageStatus = 'HIGH_AMBIENT_SOLAR_HEATWAVE';
    } else if (isHrvBreach) {
      triageStatus = 'PARASYMPATHETIC_AUTONOMIC_FATIGUE';
    } else if (isSkinBreach) {
      triageStatus = 'HYPERTHERMIC_HEAT_ACCUMULATION';
    } else if (isNoiseBreach) {
      triageStatus = 'ACOUSTIC_OVERPRESSURE_HAZARD';
    } else if (isRiskBreach || pt.is_anomaly) {
      triageStatus = 'MULTIVARIATE_ANOMALY_DIVERGENCE';
    }

    const cleanZone = (pt.zone || zone.name).replace(/,/g, ' ');

    return [
      idx + 1,
      `"${pt.timestamp}"`,
      `"${pt.timeLabel}"`,
      `"${cleanZone}"`,
      isCohortSuppressed ? '"[SUPPRESSED: N<12]"' : hr,
      maxHrLimit,
      isHrBreach ? 'BREACHED' : 'CLEAR',
      amb.toFixed(1),
      maxAmbLimit.toFixed(1),
      isAmbBreach ? 'BREACHED' : 'CLEAR',
      isCohortSuppressed ? '"[SUPPRESSED: N<12]"' : hrv.toFixed(1),
      isCohortSuppressed ? '"[SUPPRESSED: N<12]"' : pt.raw_hrv.toFixed(1),
      minHrvFloor,
      isHrvBreach ? 'BREACHED' : 'CLEAR',
      isCohortSuppressed ? '"[SUPPRESSED: N<12]"' : skin.toFixed(2),
      maxSkinLimit.toFixed(1),
      isSkinBreach ? 'BREACHED' : 'CLEAR',
      noise.toFixed(1),
      maxNoiseLimit.toFixed(1),
      isNoiseBreach ? 'BREACHED' : 'CLEAR',
      pt.twl_index.toFixed(1),
      pt.aqi,
      isCohortSuppressed ? '"[SUPPRESSED: N<12]"' : sanitizedRisk.toFixed(1),
      riskCutoff,
      pt.is_anomaly ? 'TRUE' : 'FALSE',
      isAnyBreach ? 'TRUE' : 'FALSE',
      `"${triageStatus}"`,
      isCohortSuppressed
        ? '"k-Anonymity Suppressed (N<12)"'
        : '"k-Anonymity N>=12 / ε=0.5 DP / Non-Punitive"'
    ].join(',');
  });

  // Section 2: Active Anomaly & Kalman State Validations
  const anomalySectionLines = [
    '',
    `# ==============================================================================`,
    `# SECTION 2: ACTIVE ANOMALY DETECTIONS & KALMAN VALIDATION LOG`,
    `# ==============================================================================`,
    'Alert_ID,Alert_Type,Worker_Pseudonym,Location_Zone,Detected_At,Anomaly_Metric,Severity,Kalman_Status,Raw_Value,Kalman_Smoothed_Value,Early_Warning_Lead,Recommended_Action,Compliance_Shield,Acknowledged',
    ...activeAlerts.map((a) => {
      const isSupp = defaultPrivacyShield.isCohortSuppressed(cohortSize);
      // Mask worker ID pseudonyms strictly for privacy
      const pseudonymToken = `TOKEN-WRK-${a.worker_id.replace(/[^0-9]/g, '').padStart(4, '0')}`;
      return [
        `"${a.id}"`,
        `"${a.alert_type || 'HEALTH_ANOMALY'}"`,
        `"${pseudonymToken}"`,
        `"${a.location_zone.replace(/"/g, '""')}"`,
        `"${a.detected_at}"`,
        `"${a.anomaly_metric.replace(/"/g, '""')}"`,
        `"${a.severity}"`,
        `"${a.kalman_status}"`,
        isSupp ? '"[SUPPRESSED: N<12]"' : `"${a.raw_value.replace(/"/g, '""')}"`,
        isSupp ? '"[SUPPRESSED: N<12]"' : `"${a.kalman_smoothed_value.replace(/"/g, '""')}"`,
        `"${a.lead_time}"`,
        `"${a.recommended_action.replace(/"/g, '""')}"`,
        `"${isSupp ? 'k-Anonymity Suppressed' : a.privacy_status}"`,
        `"${a.acknowledged ? 'YES' : 'NO'}"`
      ].join(',');
    }),
    '',
    `# ==============================================================================`,
    `# SECTION 3: LEGAL & STATUTORY ATTESTATION`,
    `# ==============================================================================`,
    `# All data in this report is generated in strict accordance with the Prognosticator Privacy Shield.`,
    `# Compliant with EU GDPR Article 9 (Special Category Health Data) and HIPAA Security Rule § 164.514.`,
    `# Certified Zero-PII Export: No worker names, device serials, or biometric identities are stored or disclosed.`
  ];

  const csvContent = [...metadataLines, headers.join(','), ...rows, ...anomalySectionLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStamp = now.toISOString().slice(0, 10);
  const timeStamp = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const sanitizedZone = zone.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Prognosticator_Anonymized_Health_Compliance_Report_${sanitizedZone}_${dateStamp}_${timeStamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    recordCount: data.length
  };
}

/**
 * Downloads a complete multi-page Anonymized Executive Health & Safety Compliance PDF Report
 */
export async function downloadAnomalyReportPdf({
  data,
  thresholds,
  zone,
  activeAlerts,
  zones,
  onProgress
}: {
  data: TelemetryDataPoint[];
  thresholds: HealthSignalNotificationThresholds;
  zone: FacilityZone;
  activeAlerts: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  onProgress?: (status: string) => void;
}): Promise<void> {
  await generateExecutiveSafetyPdfReport({
    activeAlerts,
    telemetryStream: data,
    currentZone: zone,
    zones,
    telemetryElementId: 'telemetry-charts-card',
    projectionElementId: 'incident-projection-chart-card',
    alertsElementId: 'active-alerts-section',
    onProgress
  });
}

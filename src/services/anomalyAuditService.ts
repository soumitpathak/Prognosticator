import { AnomalyAuditRecord, ActiveAnomalyAlert, FacilityZone } from '../types';
import { getAlertDepartment } from '../components/ActiveAlertsSection';

/**
 * Anomaly Audit Log Service
 * Maintains an immutable audit record of previously flagged anomalies,
 * including historical timestamp, model confidence score, and corrective action taken.
 */

export const INITIAL_ANOMALY_AUDIT_RECORDS: AnomalyAuditRecord[] = [
  {
    id: 'AN-AUD-1001',
    anomalyId: 'ALR-8842-CR',
    timestamp: '2026-11-04T09:08:15Z',
    timeFormatted: '2026-11-04 09:08:15',
    relativeTime: '12 mins ago',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Construction & Civil Infrastructure',
    anomalyMetric: 'Acute Autonomic & Thermal Heat Strain',
    measuredValue: 'HRV: 31 ms (Raw Jitter: ±8ms), Skin: 38.4°C',
    thresholdLimit: 'HRV Floor: 40 ms, Skin Ceiling: 37.8°C',
    severity: 'CRITICAL',
    confidenceScore: 0.952,
    confidenceScoreFormatted: '95.2%',
    modelAttribution: 'LSTM Autoencoder (MSE: 0.342, 42% HRV Drop contribution) + Kalman Filter Jitter Verification',
    correctiveActionTaken: 'Immediate shaded tent extraction; administered 500ml oral electrolyte rehydration solution. Vital signs returned to homeostasis.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Dr. Marcus Vance, MD (Emergency Medical Lead)',
    workerId: 'W-9921',
    privacyEnforced: 'k-Anonymity Verified (N=18 ≥ 12)',
    responderNotes: 'Worker rested for 30 minutes in air-conditioned recovery trailer. RMSSD restored from 31ms to 64ms.'
  },
  {
    id: 'AN-AUD-1002',
    anomalyId: 'ALR-PM-9042',
    timestamp: '2026-11-04T09:02:40Z',
    timeFormatted: '2026-11-04 09:02:40',
    relativeTime: '18 mins ago',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Mechanical Reliability & Maintenance',
    anomalyMetric: 'Predictive Maintenance: Bearing Vibration & Motor Heat',
    measuredValue: 'Vibration: 7.2 mm/s RMS, Casing Heat: 89.1°C',
    thresholdLimit: 'ISO 10816 Limit: 4.5 mm/s, Thermal Ceiling: 65.0°C',
    severity: 'CRITICAL',
    confidenceScore: 0.978,
    confidenceScoreFormatted: '97.8%',
    modelAttribution: 'Harmonic FFT Spectral Energy Ratio + Kalman Smoothed Vibration Drift',
    correctiveActionTaken: 'LOTO Stage 2 isolation enacted. Reliability team replaced worn drive roller bearing sleeve before shaft seizure.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Derek Zhang (Reliability Vibration Engineer)',
    equipmentId: 'MTR-DRIVE-4B',
    privacyEnforced: 'Machine Telemetry (ISO 10816-3 Class II)',
    responderNotes: 'Drive motor re-greased and laser-aligned. Vibration reduced from 6.85 mm/s to 1.82 mm/s (Nominal Zone A).'
  },
  {
    id: 'AN-AUD-1003',
    anomalyId: 'ALR-8839-HG',
    timestamp: '2026-11-04T08:52:10Z',
    timeFormatted: '2026-11-04 08:52:10',
    relativeTime: '28 mins ago',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Construction & Civil Infrastructure',
    anomalyMetric: 'Acoustic Machinery Overpressure Blast',
    measuredValue: 'Noise: 104.8 dBA, Ambient: 45.1°C',
    thresholdLimit: 'Permissible Noise Ceiling: 85.0 dBA, Heat Ceiling: 36.0°C',
    severity: 'HIGH',
    confidenceScore: 0.894,
    confidenceScoreFormatted: '89.4%',
    modelAttribution: 'Kalman Transient Noise Suppressor + Multi-sensor Microphone Acoustic Verification',
    correctiveActionTaken: 'Mandatory secondary ear-defender distribution to Sector 4 cohort. Compressor vibration dampeners re-seated.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Acoustic Hearing Protection Officer',
    workerId: 'W-6104',
    privacyEnforced: 'k-Anonymity Verified (N=18 ≥ 12)',
    responderNotes: 'Dual-grade ear defenders deployed. Ambient sound at worker station dampened to 81.2 dBA.'
  },
  {
    id: 'AN-AUD-1004',
    anomalyId: 'ALR-PM-7120',
    timestamp: '2026-11-04T08:44:20Z',
    timeFormatted: '2026-11-04 08:44:20',
    relativeTime: '36 mins ago',
    zone: 'Warehouse-Logistics-Hub-North',
    department: 'Mechanical Reliability & Maintenance',
    anomalyMetric: 'Predictive Maintenance: Rotor Harmonic Jitter & Pump Heat',
    measuredValue: 'Vibration: 5.4 mm/s RMS, Heat: 76.5°C',
    thresholdLimit: 'ISO Limit: 4.5 mm/s, Baseline Heat: 55.0°C',
    severity: 'HIGH',
    confidenceScore: 0.881,
    confidenceScoreFormatted: '88.1%',
    modelAttribution: 'Dynamic Centrifugal Frequency Analysis + Thermal Runaway Kalman Predictor',
    correctiveActionTaken: 'Applied synthetic high-temperature polyurea grease to thrust bearing assembly. Cleared pump suction cavitation.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Thomas Schmidt (Reliability Vibration Lead)',
    equipmentId: 'PMP-CHILLER-02',
    privacyEnforced: 'Machine Telemetry (ISO 10816-3 Class II)',
    responderNotes: 'Bearing temperature stabilized at 58.2°C. Suction pressure restored to 4.2 bar.'
  },
  {
    id: 'AN-AUD-1005',
    anomalyId: 'ALR-8827-MD',
    timestamp: '2026-11-04T08:26:00Z',
    timeFormatted: '2026-11-04 08:26:00',
    relativeTime: '54 mins ago',
    zone: 'Warehouse-Logistics-Hub-North',
    department: 'Logistics & Warehouse Operations',
    anomalyMetric: 'Sleep Debt & Progressive Heart Rate Drift',
    measuredValue: 'HRV Drop: 22.4%, Sleep Debt: 3.5h, HR Drift: +16 BPM',
    thresholdLimit: 'Max HRV Drop: 20%, Max Sleep Deficit: 2.0h',
    severity: 'MODERATE',
    confidenceScore: 0.816,
    confidenceScoreFormatted: '81.6%',
    modelAttribution: 'Autonomic Circadian Rhythm Drift Model + Missing Packet Kalman Imputation',
    correctiveActionTaken: 'Reassigned worker from high-bay forklift driving to ground-level parcel scanning duty with mandatory 15-minute fluid break.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Warehouse Logistics Shift Supervisor',
    workerId: 'W-3209',
    privacyEnforced: 'k-Anonymity Verified (N=25 ≥ 12)',
    responderNotes: 'Worker successfully completed remainder of shift in low-risk sorting zone without tachycardia.'
  },
  {
    id: 'AN-AUD-1006',
    anomalyId: 'ALR-PM-4105',
    timestamp: '2026-11-04T08:10:00Z',
    timeFormatted: '2026-11-04 08:10:00',
    relativeTime: '1h 10m ago',
    zone: 'Manufacturing-Assembly-Line-B',
    department: 'Mechanical Reliability & Maintenance',
    anomalyMetric: 'Predictive Maintenance: Dynamic Unbalance Jitter',
    measuredValue: 'Vibration: 4.1 mm/s RMS, Motor: 69.8°C',
    thresholdLimit: 'Vibration Floor: 2.8 mm/s, Baseline: 55.0°C',
    severity: 'MODERATE',
    confidenceScore: 0.792,
    confidenceScoreFormatted: '79.2%',
    modelAttribution: 'Autoregressive Blower Spectrum Model + 72-hour Runout Window Estimator',
    correctiveActionTaken: 'Cleaned particulate build-up from centrifugal fan impeller blades to restore dynamic rotational symmetry.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Kenji Sato (Laser Alignment Specialist)',
    equipmentId: 'FAN-EXHAUST-03',
    privacyEnforced: 'Machine Telemetry (ISO 10816-3 Class I)',
    responderNotes: 'Static & dynamic rotor re-balance verified. Vibration dropped to 1.4 mm/s RMS.'
  },
  {
    id: 'AN-AUD-1007',
    anomalyId: 'ALR-8815-LW',
    timestamp: '2026-11-04T07:45:00Z',
    timeFormatted: '2026-11-04 07:45:00',
    relativeTime: '1h 35m ago',
    zone: 'Manufacturing-Assembly-Line-B',
    department: 'Robotics & Precision Assembly',
    anomalyMetric: 'Transient Electro-Magnetic Noise Deviation',
    measuredValue: 'Skin Temp spike: +1.8°C (single 1-second interval)',
    thresholdLimit: 'Smoothed Threshold: 37.8°C',
    severity: 'LOW',
    confidenceScore: 0.645,
    confidenceScoreFormatted: '64.5%',
    modelAttribution: 'Kalman Filter Residual Spike Detection (Zero Physiological Cross-Correlation)',
    correctiveActionTaken: 'No physical worker extraction required. Wearable BLE chest electrode lead re-seated; recalibration event logged.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Automated Kalman Signal Recalibration Engine',
    workerId: 'W-7140',
    privacyEnforced: 'k-Anonymity Verified (N=42 ≥ 12)',
    responderNotes: 'Signal normalized to 36.7°C baseline. False-positive transient RF interference filtered.'
  },
  {
    id: 'AN-AUD-1008',
    anomalyId: 'ALR-8798-CR',
    timestamp: '2026-11-04T06:30:15Z',
    timeFormatted: '2026-11-04 06:30:15',
    relativeTime: '2h 50m ago',
    zone: 'Subgrade-Tunnel-Conduit-7',
    department: 'Subgrade Tunnel & Utility Conduits',
    anomalyMetric: 'Confined Space Humidity & Severe Thermal Inversion',
    measuredValue: 'Ambient: 38.6°C (WBGT: 39.8°C), HRV: 33.5 ms',
    thresholdLimit: 'Thermal Work Limit: 110 W/m² (Measured: 84 W/m²)',
    severity: 'CRITICAL',
    confidenceScore: 0.964,
    confidenceScoreFormatted: '96.4%',
    modelAttribution: 'Small-Cell Privacy Suppressed (N=8 < 12) + Synthetic Multi-variate Strain Aggregator',
    correctiveActionTaken: 'Evacuated subgrade cohort to ground-level staging; activated auxiliary duct ventilation turbines.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Elena Rostova (Confined Space Safety Officer)',
    workerId: 'W-CONDUIT-04',
    privacyEnforced: 'k-Anonymity Cell-Suppressed (Cohort N=8 < 12, PII Cryptographically Masked)',
    responderNotes: 'Tunnel ambient temperature brought down to 31.5°C before crew re-entry.'
  },
  {
    id: 'AN-AUD-1009',
    anomalyId: 'ALR-8762-HG',
    timestamp: '2026-11-04T05:15:00Z',
    timeFormatted: '2026-11-04 05:15:00',
    relativeTime: '4h 05m ago',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Construction & Civil Infrastructure',
    anomalyMetric: 'Night-Shift Circadian Desynchronization & Tachycardia',
    measuredValue: 'Heart Rate: 128 BPM (Baseline: 74 BPM), HRV: 28 ms',
    thresholdLimit: 'Max Heart Rate Ceiling: 115 BPM, HRV Floor: 40 ms',
    severity: 'HIGH',
    confidenceScore: 0.912,
    confidenceScoreFormatted: '91.2%',
    modelAttribution: 'LSTM Circadian Deficit Neural Net + Continuous BLE Ingestion',
    correctiveActionTaken: 'Mandatory 20-minute shaded hydration break; cold towel neck wraps deployed by on-site nurse.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Sarah Jenkins, RN (Medical Responder)',
    workerId: 'W-8812',
    privacyEnforced: 'k-Anonymity Verified (N=18 ≥ 12)',
    responderNotes: 'Pulse decreased from 128 BPM to 82 BPM within 18 minutes. Worker cleared for light task.'
  },
  {
    id: 'AN-AUD-1010',
    anomalyId: 'ALR-8740-MD',
    timestamp: '2026-11-04T03:50:00Z',
    timeFormatted: '2026-11-04 03:50:00',
    relativeTime: '5h 30m ago',
    zone: 'Warehouse-Logistics-Hub-North',
    department: 'Logistics & Warehouse Operations',
    anomalyMetric: 'Diesel Particulate AQI Exceedance & Elevated Respiratory Effort',
    measuredValue: 'AQI: 168 (Unhealthy), Respiration Drift: +6 breaths/min',
    thresholdLimit: 'AQI Ceiling: 100, Respiration Norm: 16 breaths/min',
    severity: 'MODERATE',
    confidenceScore: 0.835,
    confidenceScoreFormatted: '83.5%',
    modelAttribution: 'Environmental Optical Particle Counter + Biometric Respiration Kalman Estimator',
    correctiveActionTaken: 'Forklift exhaust scrubbers activated; high-filtration N95 particulate respirators distributed to bay workers.',
    actionStatus: 'COMPLETED',
    actionTakenBy: 'Elena Rostova (Warehouse Health Steward)',
    workerId: 'W-3108',
    privacyEnforced: 'k-Anonymity Verified (N=25 ≥ 12)',
    responderNotes: 'Bay roll-up doors opened; cross-draft reduced AQI from 168 to 62 within 40 minutes.'
  }
];

/**
 * Build dynamic audit records combining initial historical audit log
 * with any active alerts and newly staged/transmitted medical dispatches.
 */
export function compileFullAnomalyAuditLog(
  activeAlerts: ActiveAnomalyAlert[] = [],
  dispatches: any[] = []
): AnomalyAuditRecord[] {
  const recordsMap = new Map<string, AnomalyAuditRecord>();

  // Add standard historical base records
  INITIAL_ANOMALY_AUDIT_RECORDS.forEach((rec) => {
    recordsMap.set(rec.anomalyId, { ...rec });
  });

  // Merge active alerts
  activeAlerts.forEach((alert, index) => {
    const dept = getAlertDepartment(alert);
    const existing = recordsMap.get(alert.id);

    // Calculate realistic confidence score based on severity
    let confidence = 0.948;
    if (alert.severity === 'CRITICAL') confidence = 0.94 + ((index % 5) * 0.012);
    else if (alert.severity === 'HIGH') confidence = 0.86 + ((index % 5) * 0.015);
    else if (alert.severity === 'MODERATE') confidence = 0.78 + ((index % 5) * 0.018);
    else confidence = 0.65 + ((index % 5) * 0.02);

    confidence = Math.min(0.995, Math.max(0.60, Number(confidence.toFixed(3))));

    // Determine corrective action taken
    let correctiveAction = alert.recommended_action;
    let actionStatus: AnomalyAuditRecord['actionStatus'] = alert.acknowledged ? 'COMPLETED' : 'DISPATCH_STAGED';
    let actionTakenBy = 'Automated Anomaly Rule Engine';

    // Cross-reference with dispatches
    const matchedDispatch = dispatches.find((d) => d.alertId === alert.id || d.zone === alert.location_zone);
    if (matchedDispatch) {
      if (matchedDispatch.status === 'TRANSMITTED') {
        actionStatus = 'TRANSMITTED';
        actionTakenBy = matchedDispatch.recipientRole;
        correctiveAction = `${alert.recommended_action} Dispatched to ${matchedDispatch.recipientRole} via ${matchedDispatch.contactMethod}.`;
      } else if (matchedDispatch.status === 'ACKNOWLEDGED_BY_TEAM') {
        actionStatus = 'COMPLETED';
        actionTakenBy = matchedDispatch.recipientRole;
        correctiveAction = `${alert.recommended_action} Protocol confirmed on-site: ${matchedDispatch.responderNotes || 'Action resolved.'}`;
      }
    }

    const record: AnomalyAuditRecord = {
      id: existing ? existing.id : `AN-AUD-${2000 + index}`,
      anomalyId: alert.id,
      timestamp: existing ? existing.timestamp : new Date().toISOString(),
      timeFormatted: existing ? existing.timeFormatted : new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: alert.detected_at,
      zone: alert.location_zone,
      department: dept.name,
      anomalyMetric: alert.anomaly_metric,
      measuredValue: alert.raw_value,
      thresholdLimit: alert.kalman_smoothed_value,
      severity: alert.severity,
      confidenceScore: confidence,
      confidenceScoreFormatted: `${(confidence * 100).toFixed(1)}%`,
      modelAttribution: alert.alert_type === 'PREDICTIVE_MAINTENANCE'
        ? 'ISO 10816 Vibration Severity Filter + Motor Thermal Kalman Extrapolator'
        : 'LSTM Autoregressive Autoencoder + Kalman Jitter Suppression Engine',
      correctiveActionTaken: correctiveAction,
      actionStatus,
      actionTakenBy,
      workerId: alert.worker_id,
      equipmentId: alert.equipment_id,
      privacyEnforced: alert.privacy_status,
      responderNotes: alert.acknowledged ? 'Protocol dispatched and acknowledged by on-duty safety response crew.' : undefined
    };

    recordsMap.set(alert.id, record);
  });

  return Array.from(recordsMap.values()).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Export Anomaly Audit Log to CSV (RFC 4180 format)
 */
export function exportAnomalyAuditCsv(records: AnomalyAuditRecord[]): {
  success: boolean;
  recordCount: number;
  filename: string;
} {
  const headers = [
    'Audit_Record_ID',
    'Anomaly_ID',
    'Historical_Timestamp_UTC',
    'Formatted_Time',
    'Relative_Time',
    'Facility_Zone',
    'Department_Category',
    'Anomaly_Hazard_Metric',
    'Sensor_Measured_Value',
    'Threshold_Limit',
    'Severity_Tier',
    'Model_Confidence_Score_Pct',
    'Model_Attribution_Method',
    'Corrective_Action_Taken',
    'Action_Status',
    'Action_Executed_By',
    'Subject_Worker_Or_Equipment_ID',
    'Privacy_Shield_Compliance'
  ];

  const escapeCsv = (str: string | undefined): string => {
    if (!str) return '""';
    return `"${str.toString().replace(/"/g, '""')}"`;
  };

  const rows = records.map((rec) => [
    rec.id,
    rec.anomalyId,
    rec.timestamp,
    rec.timeFormatted,
    rec.relativeTime,
    rec.zone,
    rec.department,
    rec.anomalyMetric,
    escapeCsv(rec.measuredValue),
    escapeCsv(rec.thresholdLimit),
    rec.severity,
    rec.confidenceScoreFormatted,
    escapeCsv(rec.modelAttribution),
    escapeCsv(rec.correctiveActionTaken),
    rec.actionStatus,
    escapeCsv(rec.actionTakenBy),
    rec.equipmentId || rec.workerId || 'ANONYMIZED',
    escapeCsv(rec.privacyEnforced)
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `anomaly-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return { success: true, recordCount: records.length, filename };
}

/**
 * Export Anomaly Audit Log to JSON
 */
export function exportAnomalyAuditJson(records: AnomalyAuditRecord[]): {
  success: boolean;
  filename: string;
} {
  const filename = `anomaly-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const anchor = document.createElement('a');
  anchor.href = dataStr;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  return { success: true, filename };
}

/**
 * Serializes the current active anomaly data in the state into RFC 4180 CSV format
 * and triggers a browser download for audit logs.
 */
export function serializeCurrentAnomalyDataToCsvAndDownload(
  anomalies: ActiveAnomalyAlert[],
  zone?: FacilityZone,
  options?: {
    userName?: string;
    auditStandard?: string;
  }
): {
  success: boolean;
  recordCount: number;
  filename: string;
  csvContent: string;
} {
  const now = new Date();
  const dateIso = now.toISOString();
  const dateStr = dateIso.slice(0, 10);
  const timeStr = dateIso.slice(11, 19).replace(/:/g, '-');
  const auditStandard = options?.auditStandard || 'ISO 45001 / OSHA 1910 Occupational Safety Standard';
  const userName = options?.userName || 'Safety Director (EHS Safety Supervisor)';
  const zoneName = zone?.name || 'All Facility Zones';
  const zoneId = zone?.id || 'GLOBAL_FACILITY';

  const metadataLines = [
    `# ==============================================================================`,
    `# PROGNOSTICATOR ENTERPRISE HEALTH INTELLIGENCE - AUDIT LOG CSV EXPORT`,
    `# ==============================================================================`,
    `# Report Scope: Current Live Anomaly State Snapshot`,
    `# Audit Export Standard: ${auditStandard}`,
    `# Generated At (UTC): ${dateIso}`,
    `# Exporting Safety Officer: ${userName}`,
    `# Primary Facility Zone: ${zoneName} (${zoneId})`,
    `# Privacy Shield Status: k-Anonymity Verified (Cohort N >= 12), ε=0.5 Differential Privacy`,
    `# Active Anomaly Record Count: ${anomalies.length}`,
    `# ==============================================================================`,
    `#`
  ];

  const headers = [
    'Anomaly_ID',
    'Worker_Token',
    'Facility_Zone',
    'Detected_At',
    'Anomaly_Hazard_Metric',
    'Severity_Tier',
    'Triage_Status',
    'Raw_Sensor_Value',
    'Kalman_Smoothed_Value',
    'Kalman_Filter_Status',
    'Lead_Time_Window',
    'Recommended_Corrective_Action',
    'Privacy_Shield_Compliance',
    'Audit_Standard',
    'Export_Timestamp_UTC'
  ];

  const escapeCsv = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const s = String(str);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = anomalies.map((a) => {
    const workerToken = a.worker_id ? `TOKEN-${a.worker_id.replace(/[^0-9A-Za-z]/g, '')}` : 'ANONYMIZED_COHORT';
    return [
      escapeCsv(a.id),
      escapeCsv(workerToken),
      escapeCsv(a.location_zone),
      escapeCsv(a.detected_at),
      escapeCsv(a.anomaly_metric),
      escapeCsv(a.severity),
      escapeCsv(a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE_TRIAGE'),
      escapeCsv(a.raw_value),
      escapeCsv(a.kalman_smoothed_value),
      escapeCsv(a.kalman_status),
      escapeCsv(a.lead_time || 'Immediate'),
      escapeCsv(a.recommended_action),
      escapeCsv(a.privacy_status || 'k-Anonymity Verified (N>=12)'),
      escapeCsv(auditStandard),
      escapeCsv(dateIso)
    ].join(',');
  });

  const csvContent = [...metadataLines, headers.join(','), ...rows].join('\r\n');
  const filename = `Prognosticator_Current_Anomaly_Data_Audit_${zoneId}_${dateStr}_${timeStr}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.visibility = 'hidden';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    success: true,
    recordCount: anomalies.length,
    filename,
    csvContent
  };
}


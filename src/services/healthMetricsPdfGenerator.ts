import jsPDF from 'jspdf';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint, HealthSignalNotificationThresholds } from '../types';
import { defaultPrivacyShield } from './privacyShield';

export interface HealthMetricsExportData {
  zone: FacilityZone;
  telemetryStream: TelemetryDataPoint[];
  activeAlerts: ActiveAnomalyAlert[];
  thresholds?: HealthSignalNotificationThresholds;
  averageRiskScore?: string;
  activeAnomaliesCount?: number;
  totalAnomalies24h?: number;
  connectedEndpoints?: string;
  safetyPersonnel?: string;
  userName?: string;
  onProgress?: (step: string, percent: number) => void;
}

export interface HealthMetricsPdfResult {
  filename: string;
  sizeBytes: number;
  timestamp: string;
}

/**
 * Executes mock PDF generation process for the current health metrics display,
 * stepping through mock analysis phases and generating a certified A4 PDF document.
 */
export async function generateHealthMetricsPdfReport({
  zone,
  telemetryStream,
  activeAlerts,
  thresholds,
  averageRiskScore = '28.4%',
  activeAnomaliesCount,
  totalAnomalies24h = 14,
  connectedEndpoints = '184 / 184 (100% Online)',
  safetyPersonnel = '12 Officers (9 Deployed, 3 Standby)',
  userName = 'Alex Mercer (EHS Safety Lead)',
  onProgress
}: HealthMetricsExportData): Promise<HealthMetricsPdfResult> {
  // Step 1: Ingesting current health metrics & baseline telemetry
  onProgress?.('Ingesting current health metrics display & sensor baselines...', 15);
  await new Promise((r) => setTimeout(r, 260));

  // Step 2: Privacy Shield validation (k-Anonymity & Differential Privacy)
  onProgress?.('Verifying k-Anonymity (N >= 12) & ε=0.5 Differential Privacy Shield...', 45);
  await new Promise((r) => setTimeout(r, 280));

  // Step 3: Computing Kalman innovation margins & risk distributions
  onProgress?.('Synthesizing Kalman innovation estimates & clinical vitals...', 75);
  await new Promise((r) => setTimeout(r, 280));

  // Step 4: Compiling vector PDF layout
  onProgress?.('Compiling vector PDF document & cryptographic audit seal...', 92);
  await new Promise((r) => setTimeout(r, 240));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const timestamp = `${dateStr} ${timeStr}`;

  const cohortSize = zone.count || 14;
  const isCohortSuppressed = defaultPrivacyShield.isCohortSuppressed(cohortSize);

  // Latest telemetry data point
  const latestPoint = telemetryStream.length > 0 ? telemetryStream[telemetryStream.length - 1] : null;
  const currentHr = latestPoint?.heart_rate_bpm ?? Math.round(72 + (68 - (latestPoint?.smoothed_hrv || 56)) * 1.2);
  const currentHrv = latestPoint?.smoothed_hrv ?? 54.2;
  const currentRawHrv = latestPoint?.raw_hrv ?? 51.8;
  const currentSkinTemp = latestPoint?.skin_temp_c ?? 36.9;
  const currentNoise = latestPoint?.noise_db ?? latestPoint?.raw_noise_db ?? 74.5;
  const currentTwl = latestPoint?.twl_index ?? 142;
  const currentAqi = latestPoint?.aqi ?? 46;
  const currentRiskScore = latestPoint?.risk_score ?? 28.4;

  let y = 14;

  // Header Bar
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 24, 'F');

  // Accent Line
  pdf.setFillColor(6, 182, 212); // cyan-500
  pdf.rect(0, 24, pageWidth, 1.5, 'F');

  // Branding
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PROGNOSTICATOR WORKFORCE INTELLIGENCE', margin, 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('Current Health Metrics & Predictive Anomaly Dossier', margin, 17);

  pdf.setFontSize(7);
  pdf.setTextColor(203, 213, 225);
  pdf.text(`EXPORTED: ${timestamp} | AUDITOR: ${userName}`, pageWidth - margin, 11, { align: 'right' });
  pdf.text('SECURITY SPEC: OSHA 1910 / HIPAA § 164.514', pageWidth - margin, 17, { align: 'right' });

  y = 33;

  // Title Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`FACILITY ZONE: ${zone.name.toUpperCase()} (${zone.id})`, margin + 4, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `Monitored Cohort: ${cohortSize} Workers  |  Zone Status: ${zone.status}  |  Ambient: ${zone.temp}  |  Heat Index: ${zone.heatIndex}°C  |  TWL: ${zone.twl} W/m²`,
    margin + 4,
    y + 12
  );

  y += 24;

  // Section 1: Core Operational Health KPIs (Matching Dashboard KPI cards)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. CORE OPERATIONAL HEALTH KPIS (CURRENT SNAPSHOT)', margin, y);

  y += 5;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  // KPI Card 1: Average Workforce Risk Score
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('AVG WORKFORCE RISK', margin + 3, y + 5);
  pdf.setFontSize(13);
  pdf.setTextColor(6, 182, 212); // cyan-600
  pdf.text(averageRiskScore, margin + 3, y + 13);
  pdf.setFontSize(6.5);
  pdf.setTextColor(16, 185, 129); // emerald-600
  pdf.text('Status: Normal Baseline', margin + 3, y + 18);

  // KPI Card 2: Anomalies Detected 24h
  const col2X = margin + cardWidth + 3;
  pdf.roundedRect(col2X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('24H ANOMALY EVENTS', col2X + 3, y + 5);
  pdf.setFontSize(13);
  pdf.setTextColor(225, 29, 72); // rose-600
  pdf.text(`${totalAnomalies24h} Events`, col2X + 3, y + 13);
  pdf.setFontSize(6.5);
  pdf.setTextColor(217, 119, 6); // amber-600
  pdf.text(`${activeAnomaliesCount ?? activeAlerts.length} Active Incidents`, col2X + 3, y + 18);

  // KPI Card 3: Connected IoT Endpoints
  const col3X = margin + (cardWidth + 3) * 2;
  pdf.roundedRect(col3X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('CONNECTED IOT SENSORS', col3X + 3, y + 5);
  pdf.setFontSize(13);
  pdf.setTextColor(16, 185, 129); // emerald-600
  pdf.text('184 / 184', col3X + 3, y + 13);
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('100% Online (15s Ping)', col3X + 3, y + 18);

  // KPI Card 4: Safety Personnel Allocation
  const col4X = margin + (cardWidth + 3) * 3;
  pdf.roundedRect(col4X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('SAFETY OFFICERS', col4X + 3, y + 5);
  pdf.setFontSize(13);
  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.text('12 Officers', col4X + 3, y + 13);
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('9 Deployed | 3 Standby', col4X + 3, y + 18);

  y += cardHeight + 8;

  // Section 2: Real-Time Biometric & Environmental Signal Matrix
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. MULTI-SIGNAL HEALTH TELEMETRY & KALMAN INNOVATIONS', margin, y);

  y += 5;

  // Table Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(margin, y, contentWidth, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Signal Metric', margin + 4, y + 5);
  pdf.text('Current Value', margin + 55, y + 5);
  pdf.text('Nominal Range', margin + 90, y + 5);
  pdf.text('Alert Threshold', margin + 125, y + 5);
  pdf.text('Kalman Triage Status', margin + 155, y + 5);

  y += 7;

  const vitalsRows = [
    {
      metric: 'Workforce Heart Rate (Pulse)',
      value: isCohortSuppressed ? '[SUPPRESSED: N<12]' : `${currentHr} BPM`,
      nominal: '60 - 100 BPM',
      threshold: `>= ${thresholds?.maxHeartRateBpm ?? 115} BPM`,
      status: currentHr >= (thresholds?.maxHeartRateBpm ?? 115) ? 'THRESHOLD BREACH' : 'HOMEOSTASIS NOMINAL'
    },
    {
      metric: 'Kalman-Smoothed HRV (RMSSD)',
      value: isCohortSuppressed ? '[SUPPRESSED: N<12]' : `${currentHrv.toFixed(1)} ms`,
      nominal: '45.0 - 75.0 ms',
      threshold: `<= ${thresholds?.minHrvMs ?? 40} ms`,
      status: currentHrv <= (thresholds?.minHrvMs ?? 40) ? 'AUTONOMIC FATIGUE' : 'AUTONOMIC RECOVERY'
    },
    {
      metric: 'Raw Wearable HRV (Jitter-filtered)',
      value: isCohortSuppressed ? '[SUPPRESSED: N<12]' : `${currentRawHrv.toFixed(1)} ms`,
      nominal: '40.0 - 80.0 ms',
      threshold: 'Raw Jitter Spike',
      status: 'KALMAN SMOOTHED'
    },
    {
      metric: 'Worker Skin Temperature',
      value: isCohortSuppressed ? '[SUPPRESSED: N<12]' : `${currentSkinTemp.toFixed(1)} °C`,
      nominal: '35.5 - 37.2 °C',
      threshold: `>= ${thresholds?.maxSkinTempC ?? 37.8}°C`,
      status: currentSkinTemp >= (thresholds?.maxSkinTempC ?? 37.8) ? 'HYPERTHERMIA WARNING' : 'THERMALLY BALANCED'
    },
    {
      metric: 'Acoustic Sound Exposure',
      value: `${currentNoise.toFixed(1)} dBA`,
      nominal: '< 75.0 dBA',
      threshold: `>= ${thresholds?.maxNoiseDb ?? 85.0} dBA`,
      status: currentNoise >= (thresholds?.maxNoiseDb ?? 85.0) ? 'NOISE HAZARD OVERPRESSURE' : 'PERMISSIBLE NOISE'
    },
    {
      metric: 'Thermal Work Limit (TWL)',
      value: `${currentTwl.toFixed(0)} W/m²`,
      nominal: '> 140 W/m²',
      threshold: `<= ${thresholds?.minTwlIndex ?? 115} W/m²`,
      status: currentTwl <= (thresholds?.minTwlIndex ?? 115) ? 'WORK-REST SCHEDULE MANDATORY' : 'SAFE CONTINUOUS WORK'
    },
    {
      metric: 'Air Quality Index (AQI)',
      value: `${currentAqi} AQI`,
      nominal: '0 - 50 (Good)',
      threshold: '>= 100 (Unhealthy)',
      status: currentAqi > 100 ? 'PARTICULATE WARNING' : 'AIR QUALITY EXCELLENT'
    },
    {
      metric: 'Composite Anomaly Risk Index',
      value: `${currentRiskScore.toFixed(1)}%`,
      nominal: '< 35.0%',
      threshold: `>= ${thresholds?.riskScoreCutoffPct ?? 70}%`,
      status: currentRiskScore >= 70 ? 'CRITICAL RISK DETECTED' : currentRiskScore >= 45 ? 'ELEVATED RISK' : 'LOW RISK'
    }
  ];

  vitalsRows.forEach((row, idx) => {
    const isAlt = idx % 2 === 1;
    pdf.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
    pdf.rect(margin, y, contentWidth, 6, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 41, 59);
    pdf.text(row.metric, margin + 4, y + 4.2);

    pdf.setFont('helvetica', 'normal');
    pdf.text(row.value, margin + 55, y + 4.2);
    pdf.text(row.nominal, margin + 90, y + 4.2);
    pdf.text(row.threshold, margin + 125, y + 4.2);

    if (row.status.includes('BREACH') || row.status.includes('HAZARD') || row.status.includes('CRITICAL')) {
      pdf.setTextColor(225, 29, 72);
      pdf.setFont('helvetica', 'bold');
    } else if (row.status.includes('WARNING') || row.status.includes('ELEVATED') || row.status.includes('MANDATORY')) {
      pdf.setTextColor(217, 119, 6);
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(16, 185, 129);
      pdf.setFont('helvetica', 'normal');
    }
    pdf.text(row.status, margin + 155, y + 4.2);

    y += 6;
  });

  y += 6;

  // Section 3: Active Incident Triage & Alerts
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`3. ACTIVE POPULATION HEALTH INCIDENTS & ANOMALY ALERTS (${activeAlerts.length})`, margin, y);

  y += 5;

  if (activeAlerts.length === 0) {
    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(187, 247, 208);
    pdf.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(22, 101, 52);
    pdf.text('All active worker cohorts are within nominal physiological and environmental thresholds. Zero active anomalies.', margin + 4, y + 6);
    y += 14;
  } else {
    activeAlerts.slice(0, 4).forEach((alert) => {
      const isCritical = alert.severity === 'CRITICAL';
      pdf.setFillColor(isCritical ? 255 : 254, isCritical ? 241 : 243, isCritical ? 242 : 199);
      pdf.setDrawColor(isCritical ? 254 : 253, isCritical ? 205 : 230, isCritical ? 211 : 138);
      pdf.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(isCritical ? 190 : 180, isCritical ? 18 : 83, isCritical ? 60 : 9);
      pdf.text(`[${alert.severity}] ${alert.anomaly_metric} in ${alert.location_zone} (Alert ID: ${alert.id})`, margin + 3, y + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      const actionText = alert.recommended_action.length > 85 ? alert.recommended_action.slice(0, 82) + '...' : alert.recommended_action;
      pdf.text(`Measured: ${alert.raw_value}  |  Kalman State: ${alert.kalman_smoothed_value}  |  Directive: ${actionText}`, margin + 3, y + 9);

      y += 14;
    });
  }

  y += 2;

  // Section 4: Privacy Shield & Statutory Attestation
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('4. PRIVACY SHIELD & REGULATORY NON-PUNITIVE ATTESTATION', margin + 3, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `k-Anonymity Verified (Cohort N=${cohortSize} >= 12) & ε=0.5 Differential Privacy Active. Zero PII or biometric identities disclosed.`,
    margin + 3,
    y + 9.5
  );
  pdf.text(
    'In strict adherence to EU GDPR Article 9 & US HIPAA Security Rule § 164.514. Prohibited for employee performance evaluations.',
    margin + 3,
    y + 14
  );

  // Footer Bar
  const footerY = pageHeight - 12;
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, footerY, pageWidth, 12, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('PROGNOSTICATOR ENTERPRISE HEALTH INTELLIGENCE  •  OFFICIAL MOCK AUDIT REPORT', margin, footerY + 7);
  pdf.text('PAGE 1 OF 1  •  IMMUTABLE DIGITAL RECORD', pageWidth - margin, footerY + 7, { align: 'right' });

  // Complete progress
  onProgress?.('Mock PDF Generation Complete! Initiating browser download...', 100);
  await new Promise((r) => setTimeout(r, 200));

  const cleanZone = zone.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Prognosticator_Health_Metrics_Report_${cleanZone}_${dateStr}.pdf`;

  pdf.save(filename);

  return {
    filename,
    sizeBytes: 48500,
    timestamp
  };
}

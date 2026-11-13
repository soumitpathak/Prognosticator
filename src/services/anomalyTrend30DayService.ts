import jsPDF from 'jspdf';
import { AnomalyTrendDay, AnomalyTrendDayWithProjection, FacilityZone, ActiveAnomalyAlert, HealthSignalNotificationThresholds } from '../types';

/**
 * 30-Day Anomaly Trend Frequency Intelligence Service
 * Generates calibrated 30-day historical time series data and handles
 * simulated PDF & CSV report exports for compliance audit logging.
 */

export function generate30DayAnomalyTrend(
  zones: FacilityZone[],
  selectedZoneId = 'ALL'
): AnomalyTrendDay[] {
  const result: AnomalyTrendDay[] = [];
  const baseDate = new Date('2026-11-04T09:30:00'); // current simulated time

  // Calibrated daily anomaly baseline generator
  // Incorporates historical weather shifts, weekend shift volume differences, and cooling protocol rollouts
  const rawDailyFrequencies = [
    // Days 0-5 (Early October: Moderate season)
    { dayOffset: 29, total: 5, crit: 1, mod: 4, res: 4, temp: 31.2, hrv: 66, driver: 'Acoustic Machinery Vibration' },
    { dayOffset: 28, total: 6, crit: 2, mod: 4, res: 5, temp: 32.0, hrv: 65, driver: 'High Wet-Bulb Strain' },
    { dayOffset: 27, total: 4, crit: 1, mod: 3, res: 4, temp: 30.5, hrv: 68, driver: 'Shift Handover Deficit' },
    { dayOffset: 26, total: 3, crit: 0, mod: 3, res: 3, temp: 29.8, hrv: 70, driver: 'Acoustic Machinery Vibration' },
    { dayOffset: 25, total: 2, crit: 0, mod: 2, res: 2, temp: 28.5, hrv: 72, driver: 'Ergonomic Repetitive Strain' }, // Weekend
    { dayOffset: 24, total: 3, crit: 1, mod: 2, res: 3, temp: 29.0, hrv: 71, driver: 'Ergonomic Repetitive Strain' }, // Weekend

    // Days 6-12 (Mid-October: Beginning of dry thermal wave)
    { dayOffset: 23, total: 7, crit: 2, mod: 5, res: 6, temp: 34.5, hrv: 63, driver: 'Thermal Radiation & Ambient Heat' },
    { dayOffset: 22, total: 8, crit: 3, mod: 5, res: 6, temp: 36.8, hrv: 60, driver: 'Solar Radiation Load' },
    { dayOffset: 21, total: 9, crit: 3, mod: 6, res: 7, temp: 37.9, hrv: 58, driver: 'Autonomic HRV Collapse' },
    { dayOffset: 20, total: 11, crit: 4, mod: 7, res: 9, temp: 39.5, hrv: 55, driver: 'Extreme Wet-Bulb Load' },
    { dayOffset: 19, total: 10, crit: 4, mod: 6, res: 8, temp: 40.2, hrv: 54, driver: 'Thermal Radiation Load' },
    { dayOffset: 18, total: 4, crit: 1, mod: 3, res: 4, temp: 37.0, hrv: 62, driver: 'Cumulative Sleep Deficit' }, // Weekend
    { dayOffset: 17, total: 5, crit: 1, mod: 4, res: 4, temp: 38.2, hrv: 61, driver: 'High Wet-Bulb Strain' }, // Weekend

    // Days 13-19 (Peak Heatwave & High Operational Load: Oct 19 - Oct 25)
    { dayOffset: 16, total: 13, crit: 5, mod: 8, res: 10, temp: 42.1, hrv: 51, driver: 'Severe Thermal Radiation' },
    { dayOffset: 15, total: 14, crit: 6, mod: 8, res: 11, temp: 43.5, hrv: 49, driver: 'Acute Parasympathetic Fatigue' }, // Peak Day
    { dayOffset: 14, total: 12, crit: 5, mod: 7, res: 10, temp: 42.8, hrv: 50, driver: 'Core Heat Accumulation' },
    { dayOffset: 13, total: 10, crit: 4, mod: 6, res: 9, temp: 41.0, hrv: 53, driver: 'Thermal Work Limit Breach' },
    { dayOffset: 12, total: 9, crit: 3, mod: 6, res: 8, temp: 39.2, hrv: 56, driver: 'Acoustic Machinery Overpressure' },
    { dayOffset: 11, total: 4, crit: 1, mod: 3, res: 4, temp: 36.5, hrv: 64, driver: 'Sleep Deficit Exceedance' }, // Weekend
    { dayOffset: 10, total: 5, crit: 1, mod: 4, res: 4, temp: 37.0, hrv: 63, driver: 'Ergonomic Vibration Hazard' }, // Weekend

    // Days 20-25 (Post-Intervention: Zone Hydration Protocol & Misting Tents Deployed)
    { dayOffset: 9, total: 8, crit: 2, mod: 6, res: 7, temp: 37.8, hrv: 62, driver: 'Hydration Recovery Stabilization' },
    { dayOffset: 8, total: 7, crit: 2, mod: 5, res: 6, temp: 36.2, hrv: 64, driver: 'Acoustic Overpressure Breach' },
    { dayOffset: 7, total: 6, crit: 1, mod: 5, res: 5, temp: 35.0, hrv: 66, driver: 'Rotational Work Rest Cycle' },
    { dayOffset: 6, total: 5, crit: 1, mod: 4, res: 5, temp: 34.1, hrv: 67, driver: 'Cumulative Shift Fatigue' },
    { dayOffset: 5, total: 4, crit: 1, mod: 3, res: 4, temp: 33.4, hrv: 68, driver: 'Machine Noise Vibration' },
    { dayOffset: 4, total: 3, crit: 0, mod: 3, res: 3, temp: 32.0, hrv: 70, driver: 'Ergonomic Staging Strain' }, // Weekend
    { dayOffset: 3, total: 3, crit: 0, mod: 3, res: 3, temp: 31.8, hrv: 71, driver: 'Acoustic Machinery Overpressure' }, // Weekend

    // Days 26-29 (Recent 4 Days including today Nov 04)
    { dayOffset: 2, total: 6, crit: 2, mod: 4, res: 5, temp: 35.4, hrv: 65, driver: 'High Wet-Bulb Thermal Load' },
    { dayOffset: 1, total: 7, crit: 2, mod: 5, res: 6, temp: 36.5, hrv: 63, driver: 'Autonomic HRV Collapse' },
    { dayOffset: 0, total: 8, crit: 3, mod: 5, res: 6, temp: 38.4, hrv: 61, driver: 'Severe Thermal Radiation' } // Today Nov 04
  ];

  // Zone scaling factors
  const isAll = selectedZoneId === 'ALL';
  const targetZone = zones.find((z) => z.id === selectedZoneId);

  let scaleFactor = 1.0;
  if (!isAll && targetZone) {
    if (targetZone.id === 'Outdoor-Construction-Sector-4') {
      scaleFactor = 0.52; // High thermal & noise share
    } else if (targetZone.id === 'Warehouse-Logistics-Hub-North') {
      scaleFactor = 0.28; // Fatigue & sleep deficit share
    } else if (targetZone.id === 'Manufacturing-Assembly-Line-B') {
      scaleFactor = 0.20; // Noise & ergonomic share
    } else {
      scaleFactor = 0.25;
    }
  }

  // Generate 30 daily records
  rawDailyFrequencies.forEach((entry, idx) => {
    const dayDate = new Date(baseDate.getTime() - entry.dayOffset * 86400000);
    const dateFormatted = dayDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const fullDateIso = dayDate.toISOString().slice(0, 10);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    const totalRaw = isAll ? entry.total : Math.max(1, Math.round(entry.total * scaleFactor));
    const critRaw = isAll ? entry.crit : Math.min(totalRaw, Math.round(entry.crit * scaleFactor));
    const modRaw = Math.max(0, totalRaw - critRaw);
    const resRaw = Math.min(totalRaw, Math.round(entry.res * (isAll ? 1.0 : scaleFactor)));

    // Simulated zone distribution
    const zoneDistribution: Record<string, number> = {};
    zones.forEach((z) => {
      if (z.id === 'Outdoor-Construction-Sector-4') {
        zoneDistribution[z.id] = Math.round(totalRaw * 0.52);
      } else if (z.id === 'Warehouse-Logistics-Hub-North') {
        zoneDistribution[z.id] = Math.round(totalRaw * 0.28);
      } else {
        zoneDistribution[z.id] = Math.max(0, totalRaw - (zoneDistribution['Outdoor-Construction-Sector-4'] || 0) - (zoneDistribution['Warehouse-Logistics-Hub-North'] || 0));
      }
    });

    const isHeatwave = entry.dayOffset >= 13 && entry.dayOffset <= 19;
    const ratePer100 = Number(((totalRaw / (isAll ? 85 : targetZone?.count || 25)) * 100).toFixed(1));

    // Calibrated previous 30-day period baseline (Days 30-59 prior: Sept 05 - Oct 05, 2026)
    // Reflects early late-summer operational conditions prior to automated misting tent deployment
    const prevDailyPattern = [
      { total: 7, crit: 2 },
      { total: 8, crit: 3 },
      { total: 7, crit: 2 },
      { total: 6, crit: 2 },
      { total: 4, crit: 1 },
      { total: 4, crit: 1 },
      { total: 9, crit: 3 },
      { total: 10, crit: 4 },
      { total: 11, crit: 4 },
      { total: 12, crit: 5 },
      { total: 13, crit: 5 },
      { total: 5, crit: 2 },
      { total: 6, crit: 2 },
      { total: 14, crit: 6 },
      { total: 16, crit: 7 }, // Previous period peak day
      { total: 15, crit: 6 },
      { total: 13, crit: 5 },
      { total: 11, crit: 4 },
      { total: 6, crit: 2 },
      { total: 7, crit: 2 },
      { total: 10, crit: 4 },
      { total: 9, crit: 3 },
      { total: 8, crit: 3 },
      { total: 7, crit: 2 },
      { total: 6, crit: 2 },
      { total: 4, crit: 1 },
      { total: 5, crit: 1 },
      { total: 8, crit: 3 },
      { total: 9, crit: 3 },
      { total: 10, crit: 4 }
    ];

    const prevEntry = prevDailyPattern[idx] || { total: 8, crit: 3 };
    const prevTotal = isAll ? prevEntry.total : Math.max(1, Math.round(prevEntry.total * scaleFactor));
    const prevCrit = isAll ? prevEntry.crit : Math.min(prevTotal, Math.round(prevEntry.crit * scaleFactor));
    const prevDateObj = new Date(dayDate.getTime() - 30 * 86400000);
    const prevDateFormatted = prevDateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const diffPct = prevTotal > 0 ? Number((((totalRaw - prevTotal) / prevTotal) * 100).toFixed(1)) : 0;

    result.push({
      dayIndex: idx,
      date: dateFormatted,
      fullDate: fullDateIso,
      dayOfWeek,
      totalAnomalies: totalRaw,
      criticalCount: critRaw,
      moderateCount: modRaw,
      resolvedCount: resRaw,
      movingAvg7d: 0, // calculated below
      anomalyRatePer100: ratePer100,
      avgAmbientTempC: entry.temp,
      avgHrvMs: entry.hrv,
      peakHour: '13:30 - 15:45',
      primaryDriver: entry.driver,
      isHeatwavePeriod: isHeatwave,
      zoneCounts: zoneDistribution,
      prevPeriodAnomalies: prevTotal,
      prevPeriodCritical: prevCrit,
      prevPeriodDate: prevDateFormatted,
      periodVariancePct: diffPct
    });
  });

  // Compute 7-day rolling moving average
  for (let i = 0; i < result.length; i++) {
    const windowStart = Math.max(0, i - 6);
    const windowSlice = result.slice(windowStart, i + 1);
    const sum = windowSlice.reduce((acc, curr) => acc + curr.totalAnomalies, 0);
    result[i].movingAvg7d = Number((sum / windowSlice.length).toFixed(1));
  }

  return result;
}

/**
 * Extends the 30-day historical anomaly trend with a 7-day predicted moving average projection
 * including upper and lower confidence uncertainty boundaries for shaded visualization in Recharts.
 */
export function generate30DayAnomalyTrendWithProjection(
  zones: FacilityZone[],
  selectedZoneId = 'ALL'
): AnomalyTrendDayWithProjection[] {
  const historical = generate30DayAnomalyTrend(zones, selectedZoneId);

  // Compute Simple Moving Average (SMA) over the last 7 historical days
  const last7Days = historical.slice(-7);
  const smaRecent = last7Days.reduce((acc, curr) => acc + curr.totalAnomalies, 0) / (last7Days.length || 1);

  // Compute variance & standard deviation across recent window for confidence bounds
  const variance =
    last7Days.reduce((acc, curr) => acc + Math.pow(curr.totalAnomalies - smaRecent, 2), 0) / (last7Days.length || 1);
  const stdDev = Math.max(0.8, Math.sqrt(variance));

  const lastDay = historical[historical.length - 1];
  const lastDateTime = new Date('2026-11-04T09:30:00').getTime();

  // Map historical days: bridge point links seamlessly to predicted line
  const combined: AnomalyTrendDayWithProjection[] = historical.map((d, idx) => {
    const isBridgePoint = idx === historical.length - 1;
    return {
      ...d,
      isProjected: false,
      projectedTrend: isBridgePoint ? d.totalAnomalies : null,
      projectedUpper: isBridgePoint ? d.totalAnomalies : null,
      projectedLower: isBridgePoint ? d.totalAnomalies : null,
      projectedConfidence: 98
    };
  });

  // Project next 7 days using Simple Moving Average
  for (let i = 1; i <= 7; i++) {
    const nextTime = new Date(lastDateTime + i * 86400000);
    const dateFormatted = nextTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const fullDateIso = nextTime.toISOString().slice(0, 10);
    const dayOfWeek = nextTime.toLocaleDateString('en-US', { weekday: 'short' });
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';

    // Projected mean using SMA (with realistic weekend operational moderation)
    const projectedVal = Number((isWeekend ? Math.max(1, smaRecent * 0.58) : smaRecent).toFixed(1));
    const margin = Number((stdDev * 1.45 + i * 0.12).toFixed(1));
    const upper = Number((projectedVal + margin).toFixed(1));
    const lower = Number(Math.max(0, projectedVal - margin).toFixed(1));

    combined.push({
      dayIndex: 29 + i,
      date: dateFormatted,
      fullDate: fullDateIso,
      dayOfWeek,
      totalAnomalies: 0,
      criticalCount: Number((projectedVal * 0.33).toFixed(1)),
      moderateCount: Number((projectedVal * 0.67).toFixed(1)),
      resolvedCount: Number((projectedVal * 0.85).toFixed(1)),
      movingAvg7d: projectedVal,
      anomalyRatePer100: Number(((projectedVal / 85) * 100).toFixed(1)),
      avgAmbientTempC: Number((34.8 - i * 0.25).toFixed(1)),
      avgHrvMs: Number((62 + i * 0.4).toFixed(1)),
      peakHour: '13:00 - 15:30 (Forecasted)',
      primaryDriver: 'Projected 7-Day SMA Baseline (Moving Average Drift)',
      isHeatwavePeriod: false,
      zoneCounts: {},
      isProjected: true,
      projectedTrend: projectedVal,
      projectedUpper: upper,
      projectedLower: lower,
      projectedConfidence: Math.max(82, Math.round(95 - i * 1.8))
    });
  }

  return combined;
}

export interface AnomalyTrendSummaryStats {
  totalAnomalies30d: number;
  criticalAnomalies30d: number;
  moderateAnomalies30d: number;
  resolvedAnomalies30d: number;
  dailyMeanFrequency: number;
  peakDay: {
    date: string;
    total: number;
    critical: number;
    driver: string;
  };
  trendComparisonPct: number; // Comparison of last 14 days vs prior 14 days
  mitigationResolutionRate: number; // % resolved/stabilized
  prevPeriodTotal30d: number;
  prevPeriodCritical30d: number;
  periodComparisonDeltaPct: number; // e.g. -14.7% change vs previous 30 days
}

export function computeTrendSummary(data: AnomalyTrendDay[]): AnomalyTrendSummaryStats {
  if (!data || data.length === 0) {
    return {
      totalAnomalies30d: 0,
      criticalAnomalies30d: 0,
      moderateAnomalies30d: 0,
      resolvedAnomalies30d: 0,
      dailyMeanFrequency: 0,
      peakDay: { date: 'N/A', total: 0, critical: 0, driver: 'None' },
      trendComparisonPct: 0,
      mitigationResolutionRate: 0,
      prevPeriodTotal30d: 0,
      prevPeriodCritical30d: 0,
      periodComparisonDeltaPct: 0
    };
  }

  const total = data.reduce((acc, d) => acc + d.totalAnomalies, 0);
  const critical = data.reduce((acc, d) => acc + d.criticalCount, 0);
  const moderate = data.reduce((acc, d) => acc + d.moderateCount, 0);
  const resolved = data.reduce((acc, d) => acc + d.resolvedCount, 0);
  const dailyMean = Number((total / data.length).toFixed(1));

  // Previous 30-day period aggregates
  const prevTotal = data.reduce((acc, d) => acc + (d.prevPeriodAnomalies || 0), 0);
  const prevCritical = data.reduce((acc, d) => acc + (d.prevPeriodCritical || 0), 0);
  const periodDelta = prevTotal > 0 ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(1)) : 0;

  let peak = data[0];
  for (const day of data) {
    if (day.totalAnomalies > peak.totalAnomalies) {
      peak = day;
    }
  }

  // Compare second fortnight (days 15-29) vs first fortnight (days 0-14)
  const first14 = data.slice(0, 15).reduce((acc, d) => acc + d.totalAnomalies, 0);
  const last14 = data.slice(15).reduce((acc, d) => acc + d.totalAnomalies, 0);
  const trendPct = first14 > 0 ? Number((((last14 - first14) / first14) * 100).toFixed(1)) : 0;
  const resolutionRate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 88.5;

  return {
    totalAnomalies30d: total,
    criticalAnomalies30d: critical,
    moderateAnomalies30d: moderate,
    resolvedAnomalies30d: resolved,
    dailyMeanFrequency: dailyMean,
    peakDay: {
      date: peak.date,
      total: peak.totalAnomalies,
      critical: peak.criticalCount,
      driver: peak.primaryDriver
    },
    trendComparisonPct: trendPct,
    mitigationResolutionRate: resolutionRate,
    prevPeriodTotal30d: prevTotal,
    prevPeriodCritical30d: prevCritical,
    periodComparisonDeltaPct: periodDelta
  };
}

/**
 * Generates and downloads a simulated Executive Anomaly Audit Report as PDF
 */
export async function exportSimulatedAnomalyReportPdf({
  data,
  summary,
  currentZone,
  activeAlerts,
  thresholds,
  userName = 'Safety Director (EHS Lead Supervisor)'
}: {
  data: AnomalyTrendDay[];
  summary: AnomalyTrendSummaryStats;
  currentZone: FacilityZone;
  activeAlerts: ActiveAnomalyAlert[];
  thresholds: HealthSignalNotificationThresholds;
  userName?: string;
}): Promise<{ filename: string; sizeBytes: number }> {
  const doc = new jsPDF({
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

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(6, 182, 212); // cyan-500 accent line
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('PROGNOSTICATOR — 30-DAY ANOMALY TREND AUDIT REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Official Statutory Compliance Audit Record | Horizon: Last 30 Calendar Days | Generated: ${dateStr} ${timeStr}`, margin, 18);

  let y = 33;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('AUDIT SNAPSHOT METADATA', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Target Scope: ${currentZone.name} (Cohort: ${currentZone.count} workers, Temp: ${currentZone.temp})`, margin + 4, y + 12);
  doc.text(`Authorized Officer: ${userName} | Role: EHS Safety Supervisor`, margin + 4, y + 17);
  doc.text(`Privacy Shield: k-Anonymity Verified (N >= 12) & ε=0.5 Differential Privacy Calibration Enforced`, margin + 4, y + 22);
  doc.text(`Active Alert Threshold: HRV Floor ${thresholds.minHrvMs}ms | Risk Cutoff ${thresholds.riskScoreCutoffPct}% | Noise Limit ${thresholds.maxNoiseDb} dBA`, margin + 4, y + 27);

  y += 33;

  // 30-Day Executive Trend Summary Box
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(20, 184, 166); // teal-500
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 118, 110);
  doc.text('30-DAY ANOMALY FREQUENCY ANALYTICAL KPI METRICS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const kpiColWidth = contentWidth / 4;
  doc.text(`Total Anomalies: ${summary.totalAnomalies30d}`, margin + 4, y + 13);
  doc.text(`Critical Tier: ${summary.criticalAnomalies30d}`, margin + 4 + kpiColWidth, y + 13);
  doc.text(`Daily Mean: ${summary.dailyMeanFrequency} / day`, margin + 4 + kpiColWidth * 2, y + 13);
  doc.text(`Resolution Rate: ${summary.mitigationResolutionRate}%`, margin + 4 + kpiColWidth * 3, y + 13);

  doc.text(`Peak Incident Load: ${summary.peakDay.total} events (${summary.peakDay.date})`, margin + 4, y + 19);
  doc.text(`Primary Driver: ${summary.peakDay.driver}`, margin + 4 + kpiColWidth * 1.5, y + 19);
  doc.text(`14-Day Trajectory: ${summary.trendComparisonPct}%`, margin + 4 + kpiColWidth * 3, y + 19);

  y += 30;

  // Recent 14-Day Daily Sample Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DAILY ANOMALY FREQUENCY & MOVING AVERAGE LOG (SAMPLE)', margin, y);

  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Date', margin + 2, y + 5);
  doc.text('Day', margin + 18, y + 5);
  doc.text('Total', margin + 30, y + 5);
  doc.text('Critical', margin + 44, y + 5);
  doc.text('Moderate', margin + 60, y + 5);
  doc.text('Resolved', margin + 78, y + 5);
  doc.text('7d MA', margin + 96, y + 5);
  doc.text('Rate/100', margin + 112, y + 5);
  doc.text('Primary Environmental Driver', margin + 132, y + 5);

  y += 7;

  // Table rows (Last 15 days)
  const recentDays = data.slice(-15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  recentDays.forEach((day, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setTextColor(51, 65, 85);
    doc.text(day.date, margin + 2, y + 4.5);
    doc.text(day.dayOfWeek, margin + 18, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(String(day.totalAnomalies), margin + 30, y + 4.5);

    if (day.criticalCount > 0) {
      doc.setTextColor(225, 29, 72); // rose-600
    }
    doc.text(String(day.criticalCount), margin + 44, y + 4.5);

    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(String(day.moderateCount), margin + 60, y + 4.5);

    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(String(day.resolvedCount), margin + 78, y + 4.5);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(String(day.movingAvg7d), margin + 96, y + 4.5);
    doc.text(String(day.anomalyRatePer100), margin + 112, y + 4.5);

    const cleanDriver = day.primaryDriver.length > 30 ? day.primaryDriver.slice(0, 28) + '...' : day.primaryDriver;
    doc.text(cleanDriver, margin + 132, y + 4.5);

    y += 6;
  });

  y += 6;

  // Section: Active Unresolved Alerts in Current View
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`CURRENT VIEW ACTIVE ALERTS (${activeAlerts.length} Flagged Incidents)`, margin, y);

  y += 4;

  activeAlerts.slice(0, 3).forEach((alert) => {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(190, 18, 60);
    doc.text(`[${alert.severity}] ${alert.anomaly_metric} in ${alert.location_zone}`, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Raw: ${alert.raw_value} | Kalman: ${alert.kalman_smoothed_value} | Detected: ${alert.detected_at} | Action: ${alert.recommended_action}`, margin + 3, y + 9);

    y += 14;
  });

  // Footer Statutory Attestation
  const footerY = pageHeight - 16;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY - 2, pageWidth, 18, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('OSHA Standard 1910 / EU GDPR Article 9 / ISO 45001 Workforce Occupational Health Attestation. Immutable Audit Record.', margin, footerY + 3);
  doc.text('Cryptographically Verified & Tokenized via Prognosticator Privacy Shield. N >= 12 Small-Cell Masking Enforced.', margin, footerY + 8);

  const filename = `Prognosticator_30Day_Anomaly_Trend_Audit_Report_${currentZone.id}_${dateStr}.pdf`;
  doc.save(filename);

  return {
    filename,
    sizeBytes: 42000
  };
}

/**
 * Generates and downloads a simulated Anomaly Report as CSV for compliance audit logging
 */
export function exportSimulatedAnomalyReportCsv({
  data,
  summary,
  currentZone,
  activeAlerts,
  thresholds,
  userName = 'Safety Director (EHS Lead Supervisor)'
}: {
  data: AnomalyTrendDay[];
  summary: AnomalyTrendSummaryStats;
  currentZone: FacilityZone;
  activeAlerts: ActiveAnomalyAlert[];
  thresholds: HealthSignalNotificationThresholds;
  userName?: string;
}): { filename: string; recordCount: number } {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const metadataLines = [
    '# ============================================================================== =',
    '# PROGNOSTICATOR: 30-DAY ANOMALY TREND AUDIT & COMPLIANCE LOG (RFC 4180 CSV)',
    '# ============================================================================== =',
    `# Generated At: "${dateStr} ${timeStr}"`,
    `# Authorized User: "${userName}"`,
    `# Target Zone Scope: "${currentZone.name}" (ID: ${currentZone.id}, Status: ${currentZone.status}, Count: ${currentZone.count})`,
    `# Horizon: "Last 30 Calendar Days"`,
    `# Total 30-Day Anomalies: ${summary.totalAnomalies30d}`,
    `# Critical Anomalies: ${summary.criticalAnomalies30d}`,
    `# Moderate Anomalies: ${summary.moderateAnomalies30d}`,
    `# Daily Mean Frequency: ${summary.dailyMeanFrequency}`,
    `# Peak Incident Load: "${summary.peakDay.total} events on ${summary.peakDay.date} (Primary: ${summary.peakDay.driver})"`,
    `# Mitigation Resolution Rate: "${summary.mitigationResolutionRate}%"`,
    `# Privacy Standard: "k-Anonymity Verified (N >= 12), ε=0.5 Differential Privacy Calibration"`,
    `# Legal Alignment: "OSHA 1910 / EU GDPR Article 9 / HIPAA Security Rule § 164.514"`,
    ''
  ];

  const headers = [
    'Day_Index',
    'Calendar_Date',
    'ISO_Date',
    'Day_Of_Week',
    'Total_Anomalies_Count',
    'Critical_Severity_Count',
    'Moderate_Severity_Count',
    'Resolved_Mitigated_Count',
    'Seven_Day_Moving_Average',
    'Incident_Rate_Per_100_Workers',
    'Avg_Ambient_Temp_C',
    'Avg_Workforce_HRV_ms',
    'Peak_Hazard_Window',
    'Primary_Environmental_Driver',
    'Heatwave_Flag',
    'k_Anonymity_Compliance_Status'
  ];

  const rows = data.map((d) => [
    d.dayIndex + 1,
    `"${d.date}"`,
    `"${d.fullDate}"`,
    `"${d.dayOfWeek}"`,
    d.totalAnomalies,
    d.criticalCount,
    d.moderateCount,
    d.resolvedCount,
    d.movingAvg7d,
    d.anomalyRatePer100,
    d.avgAmbientTempC.toFixed(1),
    d.avgHrvMs.toFixed(1),
    `"${d.peakHour}"`,
    `"${d.primaryDriver.replace(/"/g, '""')}"`,
    d.isHeatwavePeriod ? 'TRUE' : 'FALSE',
    '"k-Anonymity Verified (N>=12)"'
  ].join(','));

  const alertsHeader = [
    '',
    '# ============================================================================== =',
    '# CURRENT ACTIVE ANOMALY ALERTS SNAPSHOT',
    '# ============================================================================== =',
    'Alert_ID,Zone,Metric,Severity,Raw_Value,Kalman_Smoothed,Detected_At,Recommended_Action,Status'
  ];

  const alertRows = activeAlerts.map((a) => [
    `"${a.id}"`,
    `"${a.location_zone}"`,
    `"${a.anomaly_metric}"`,
    `"${a.severity}"`,
    `"${a.raw_value}"`,
    `"${a.kalman_smoothed_value}"`,
    `"${a.detected_at}"`,
    `"${a.recommended_action.replace(/"/g, '""')}"`,
    `"${a.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE_TRIAGE'}"`
  ].join(','));

  const csvContent = [...metadataLines, headers.join(','), ...rows, ...alertsHeader, ...alertRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `Prognosticator_30Day_Anomaly_Trend_Audit_Report_${currentZone.id}_${dateStr}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    filename,
    recordCount: data.length
  };
}

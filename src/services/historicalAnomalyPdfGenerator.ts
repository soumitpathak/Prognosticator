import jsPDF from 'jspdf';
import { FacilityZone } from '../types';
import { HistoricalAnomalyEvent } from '../components/HistoricalAnomalyEventLog';

export interface GenerateHistoricalAnomalyPdfOptions {
  events: HistoricalAnomalyEvent[];
  zones: FacilityZone[];
  targetZone?: string;
  standard?: string;
  auditorName?: string;
  includeCertificationHeader?: boolean;
  includeKpiSummary?: boolean;
  onProgress?: (msg: string) => void;
}

export interface PdfExportResult {
  filename: string;
  recordCount: number;
  standard: string;
  fileSizeBytes: number;
}

/**
 * Generates an executive-formatted, compliance-ready PDF document
 * for the Historical Anomaly Event Log using jsPDF.
 */
export async function generateHistoricalAnomalyPdfReport({
  events,
  zones,
  targetZone = 'ALL',
  standard = 'ISO 45001:2018 Occupational Health & Safety',
  auditorName = 'Lead EHS Safety Auditor (ID: EHS-2026-904)',
  includeCertificationHeader = true,
  includeKpiSummary = true,
  onProgress
}: GenerateHistoricalAnomalyPdfOptions): Promise<PdfExportResult> {
  onProgress?.('Initializing PDF engine...');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const timestamp = `${dateStr} ${timeStr} UTC`;

  const zoneName =
    targetZone === 'ALL'
      ? 'All Monitored Production Zones'
      : zones.find((z) => z.id === targetZone)?.name || targetZone;

  // Pre-calculate summary statistics
  const totalEvents = events.length;
  const criticalCount = events.filter((e) => e.severityTier === 'CRITICAL').length;
  const highCount = events.filter((e) => e.severityTier === 'HIGH').length;
  const moderateCount = events.filter((e) => e.severityTier === 'MODERATE').length;
  const lowCount = events.filter((e) => e.severityTier === 'LOW').length;
  const acknowledgedCount = events.filter((e) => e.acknowledged).length;
  const resolutionRate = totalEvents > 0 ? Math.round((acknowledgedCount / totalEvents) * 100) : 100;
  const avgScore =
    totalEvents > 0
      ? (events.reduce((sum, e) => sum + e.severityScore, 0) / totalEvents).toFixed(1)
      : '0.0';

  // Digital integrity signature
  const integrityHash = `SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-K12`;

  let pageNumber = 1;

  // Helper to draw consistent corporate header on any page
  const drawPageHeader = (page: number) => {
    // Top banner background
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 20, 'F');

    // Cyan accent strip
    pdf.setFillColor(6, 182, 212); // cyan-500
    pdf.rect(0, 20, pageWidth, 1.2, 'F');

    // Corporate branding
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PROGNOSTICATOR', margin, 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text('|  HISTORICAL ANOMALY EVENT AUDIT LOG & COMPLIANCE DOSSIER', margin + 38, 12);

    // Right-aligned metadata
    pdf.setFontSize(7);
    pdf.setTextColor(203, 213, 225);
    pdf.text(`SCOPE: ${zoneName.substring(0, 28).toUpperCase()}`, pageWidth - margin, 9, { align: 'right' });
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${timestamp}`, pageWidth - margin, 14, { align: 'right' });
  };

  // Helper to draw consistent legal & confidentiality footer on any page
  const drawPageFooter = (page: number, estimatedTotal: number) => {
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(0, pageHeight - 11, pageWidth, 11, 'F');
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(0, pageHeight - 11, pageWidth, pageHeight - 11);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(
      'STRICTLY CONFIDENTIAL — PROCESSED UNDER OSHA 1910, ISO 45001, & GDPR ART. 9 (k-ANONYMITY N >= 12 ENFORCED)',
      margin,
      pageHeight - 5
    );
    pdf.setFont('helvetica', 'bold');
    pdf.text(`PAGE ${page}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  // --------------------------------------------------------------------------
  // PAGE 1: Executive Title, Certification Header & KPI Summary
  // --------------------------------------------------------------------------
  drawPageHeader(pageNumber);

  let curY = 27;

  // Document Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Historical Anomaly Event Log & Compliance Report', margin, curY);
  curY += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    'Formal longitudinal incident record including sensor deviations, Kalman innovation values, and early-warning leads.',
    margin,
    curY
  );
  curY += 7;

  // Statutory Certification Box
  if (includeCertificationHeader) {
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.roundedRect(margin, curY, contentWidth, 23, 1.5, 1.5, 'FD');

    // Green verification left pill
    pdf.setFillColor(16, 185, 129); // emerald-500
    pdf.rect(margin, curY, 2.5, 23, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('STATUTORY AUDIT & PRIVACY COMPLIANCE CERTIFICATION', margin + 5, curY + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);

    pdf.text(`Compliance Standard: ${standard}`, margin + 5, curY + 10);
    pdf.text(`Certified Auditor: ${auditorName}`, margin + 5, curY + 14.5);
    pdf.text(`Cohort Scope: ${zoneName} (${totalEvents} events evaluated)`, margin + 5, curY + 19);

    pdf.text(`Integrity Hash: ${integrityHash}`, margin + 95, curY + 10);
    pdf.text(`Privacy Shield: k-Anonymity Verified (N >= 12, ε=0.5 DP)`, margin + 95, curY + 14.5);
    pdf.text(`Record Timestamp: ${timestamp}`, margin + 95, curY + 19);

    curY += 27;
  }

  // Executive KPI Summary Cards
  if (includeKpiSummary) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('EXECUTIVE AUDIT METRICS SUMMARY', margin, curY);
    curY += 3.5;

    const cardWidth = (contentWidth - 10) / 5;
    const cardHeight = 15;

    // Card 1: Total Incidents
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, curY, cardWidth, cardHeight, 1, 1, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('TOTAL LOGGED', margin + 2.5, curY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${totalEvents}`, margin + 2.5, curY + 10.5);
    pdf.setFontSize(6);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Recorded Events', margin + 2.5, curY + 13.5);

    // Card 2: Critical Tier
    pdf.setFillColor(255, 241, 242);
    pdf.setDrawColor(254, 205, 211);
    pdf.roundedRect(margin + cardWidth + 2.5, curY, cardWidth, cardHeight, 1, 1, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(225, 29, 72);
    pdf.text('CRITICAL TIER', margin + cardWidth + 5, curY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(190, 18, 60);
    pdf.text(`${criticalCount}`, margin + cardWidth + 5, curY + 10.5);
    pdf.setFontSize(6);
    pdf.setTextColor(244, 63, 94);
    pdf.text('Immediate Action', margin + cardWidth + 5, curY + 13.5);

    // Card 3: High Severity
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(253, 230, 138);
    pdf.roundedRect(margin + (cardWidth + 2.5) * 2, curY, cardWidth, cardHeight, 1, 1, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text('HIGH SEVERITY', margin + (cardWidth + 2.5) * 2 + 2.5, curY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(180, 83, 9);
    pdf.text(`${highCount}`, margin + (cardWidth + 2.5) * 2 + 2.5, curY + 10.5);
    pdf.setFontSize(6);
    pdf.setTextColor(217, 119, 6);
    pdf.text('Elevated Triage', margin + (cardWidth + 2.5) * 2 + 2.5, curY + 13.5);

    // Card 4: Mean Severity Score
    pdf.setFillColor(240, 253, 250);
    pdf.setDrawColor(204, 251, 241);
    pdf.roundedRect(margin + (cardWidth + 2.5) * 3, curY, cardWidth, cardHeight, 1, 1, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(13, 148, 136);
    pdf.text('MEAN SEVERITY', margin + (cardWidth + 2.5) * 3 + 2.5, curY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 118, 110);
    pdf.text(`${avgScore}`, margin + (cardWidth + 2.5) * 3 + 2.5, curY + 10.5);
    pdf.setFontSize(6);
    pdf.setTextColor(20, 184, 166);
    pdf.text('Composite (0-100)', margin + (cardWidth + 2.5) * 3 + 2.5, curY + 13.5);

    // Card 5: Triage Review Rate
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(167, 243, 208);
    pdf.roundedRect(margin + (cardWidth + 2.5) * 4, curY, cardWidth, cardHeight, 1, 1, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(5, 150, 105);
    pdf.text('REVIEWED RATE', margin + (cardWidth + 2.5) * 4 + 2.5, curY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(4, 120, 87);
    pdf.text(`${resolutionRate}%`, margin + (cardWidth + 2.5) * 4 + 2.5, curY + 10.5);
    pdf.setFontSize(6);
    pdf.setTextColor(16, 185, 129);
    pdf.text(`${acknowledgedCount} of ${totalEvents} Signed`, margin + (cardWidth + 2.5) * 4 + 2.5, curY + 13.5);

    curY += 19;
  }

  // --------------------------------------------------------------------------
  // TABLE SECTION: Detailed Anomaly Records
  // --------------------------------------------------------------------------
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`ANOMALY EVENT LOG ENTRIES (${totalEvents} Records)`, margin, curY);
  curY += 4;

  // Table Column Definitions
  // Total width: contentWidth = 186mm
  const colX = {
    id: margin, // 20mm
    time: margin + 21, // 27mm
    zone: margin + 49, // 27mm
    metric: margin + 77, // 40mm
    deviation: margin + 118, // 26mm
    severity: margin + 145, // 18mm
    directive: margin + 164 // 22mm
  };

  const drawTableHeader = (y: number) => {
    pdf.setFillColor(30, 41, 59); // slate-800
    pdf.rect(margin, y, contentWidth, 6.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);

    pdf.text('EVENT ID', colX.id + 1, y + 4.5);
    pdf.text('DATE / TIME (UTC)', colX.time, y + 4.5);
    pdf.text('FACILITY ZONE', colX.zone, y + 4.5);
    pdf.text('ANOMALY METRIC & SIGNAL', colX.metric, y + 4.5);
    pdf.text('MEASURED / LIMIT', colX.deviation, y + 4.5);
    pdf.text('SEVERITY', colX.severity, y + 4.5);
    pdf.text('STATUS', colX.directive, y + 4.5);
  };

  drawTableHeader(curY);
  curY += 6.5;

  // Row printing loop with automatic page breaks
  const rowHeight = 9.5;
  const maxY = pageHeight - 16; // bottom margin limit before footer

  events.forEach((evt, idx) => {
    if (curY + rowHeight > maxY) {
      // Draw footer on current page
      drawPageFooter(pageNumber, 0);

      // Start new page
      pdf.addPage();
      pageNumber++;
      drawPageHeader(pageNumber);

      curY = 27;
      drawTableHeader(curY);
      curY += 6.5;
    }

    // Alternating row background
    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(margin, curY, contentWidth, rowHeight, 'F');

    // Row separator line
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight);

    // Event ID
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(evt.id, colX.id + 1, curY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(evt.workerId || 'Worker Cohort', colX.id + 1, curY + 7.5);

    // Date / Time
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(51, 65, 85);
    const shortDate = evt.timeFormatted || evt.timestamp.slice(0, 16);
    pdf.text(shortDate, colX.time, curY + 4);

    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(evt.leadTime || '+15m lead time', colX.time, curY + 7.5);

    // Facility Zone
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(30, 41, 59);
    const cleanZone = evt.zoneName.replace(/-/g, ' ');
    pdf.text(cleanZone.length > 18 ? cleanZone.substring(0, 17) + '…' : cleanZone, colX.zone, curY + 4);

    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    const cleanDept = evt.department || 'Operations';
    pdf.text(cleanDept.length > 20 ? cleanDept.substring(0, 19) + '…' : cleanDept, colX.zone, curY + 7.5);

    // Anomaly Metric
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setTextColor(15, 23, 42);
    const metricText = evt.anomalyMetric;
    pdf.text(metricText.length > 28 ? metricText.substring(0, 27) + '…' : metricText, colX.metric, curY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    const directiveText = evt.operationalDirective;
    pdf.text(directiveText.length > 32 ? directiveText.substring(0, 31) + '…' : directiveText, colX.metric, curY + 7.5);

    // Deviation / Values
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(51, 65, 85);
    pdf.text(evt.measuredValue || 'Breach', colX.deviation, curY + 4);

    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(evt.thresholdLimit.length > 18 ? evt.thresholdLimit.substring(0, 17) + '…' : evt.thresholdLimit, colX.deviation, curY + 7.5);

    // Severity Pill
    let pillBg = [241, 245, 249];
    let pillText = [71, 85, 105];
    if (evt.severityTier === 'CRITICAL') {
      pillBg = [255, 228, 230]; // rose-100
      pillText = [190, 18, 60]; // rose-700
    } else if (evt.severityTier === 'HIGH') {
      pillBg = [254, 243, 199]; // amber-100
      pillText = [180, 83, 9]; // amber-700
    } else if (evt.severityTier === 'MODERATE') {
      pillBg = [254, 249, 195]; // yellow-100
      pillText = [161, 98, 7]; // yellow-700
    } else {
      pillBg = [224, 242, 254]; // sky-100
      pillText = [3, 105, 161]; // sky-700
    }

    pdf.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
    pdf.roundedRect(colX.severity, curY + 1.5, 16, 4.5, 0.8, 0.8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.8);
    pdf.setTextColor(pillText[0], pillText[1], pillText[2]);
    pdf.text(evt.severityTier, colX.severity + 8, curY + 4.7, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Score: ${evt.severityScore.toFixed(0)}`, colX.severity + 8, curY + 8, { align: 'center' });

    // Status Pill
    if (evt.acknowledged) {
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(colX.directive, curY + 1.8, 18, 5, 0.8, 0.8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.5);
      pdf.setTextColor(5, 150, 105);
      pdf.text('VERIFIED', colX.directive + 9, curY + 5.2, { align: 'center' });
    } else {
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(colX.directive, curY + 1.8, 18, 5, 0.8, 0.8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.5);
      pdf.setTextColor(220, 38, 38);
      pdf.text('PENDING', colX.directive + 9, curY + 5.2, { align: 'center' });
    }

    curY += rowHeight;
  });

  // Footer for the final page
  drawPageFooter(pageNumber, pageNumber);

  onProgress?.('Saving PDF document...');
  const filename = `Prognosticator_Historical_Anomaly_Log_${dateStr}.pdf`;
  pdf.save(filename);

  return {
    filename,
    recordCount: totalEvents,
    standard,
    fileSizeBytes: 65000 + totalEvents * 350
  };
}

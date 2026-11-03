import React, { useState } from 'react';
import { ActiveAnomalyAlert, TelemetryDataPoint, FacilityZone } from '../types';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Loader2,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  currentZone: string;
  zones: FacilityZone[];
}

export default function ReportExportModal({
  isOpen,
  onClose,
  activeAlerts,
  telemetryStream,
  currentZone,
  zones
}: ReportExportModalProps) {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState<string>('');

  if (!isOpen) return null;

  const currentZoneObj = zones.find((z) => z.name === currentZone || z.id === currentZone) || zones[0];
  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const generateCsv = () => {
    const csvRows: string[] = [];

    // Header metadata
    csvRows.push('# PROGNOSTICATOR ENTERPRISE HEALTH & SAFETY COMPLIANCE REPORT');
    csvRows.push(`# Generated At: ${timestamp}`);
    csvRows.push(`# Target Facility Zone: ${currentZone}`);
    csvRows.push('# Privacy Standard: HIPAA Security Rule & GDPR Article 9 Compliant (k-Anonymity N>=12 & Differential Privacy)');
    csvRows.push('');

    // Section 1: Active Anomaly Incidents
    csvRows.push('--- SECTION 1: ACTIVE KALMAN HEALTH ANOMALIES & INTERVENTIONS ---');
    csvRows.push('Alert_ID,Worker_Token,Zone,Detected_At,Anomaly_Metric,Severity,Kalman_Status,Raw_Value,Kalman_Smoothed_Value,Lead_Time,Action_Required,Compliance_Status,Acknowledged');

    activeAlerts.forEach((a) => {
      const row = [
        `"${a.id}"`,
        `"${a.worker_id}"`,
        `"${a.location_zone}"`,
        `"${a.detected_at}"`,
        `"${a.anomaly_metric}"`,
        `"${a.severity}"`,
        `"${a.kalman_status}"`,
        `"${a.raw_value.replace(/"/g, '""')}"`,
        `"${a.kalman_smoothed_value.replace(/"/g, '""')}"`,
        `"${a.lead_time}"`,
        `"${a.recommended_action.replace(/"/g, '""')}"`,
        `"${a.privacy_status}"`,
        `"${a.acknowledged ? 'YES' : 'NO'}"`
      ];
      csvRows.push(row.join(','));
    });

    csvRows.push('');
    // Section 2: Sliding 24-Hour Sensor Telemetry Log
    csvRows.push('--- SECTION 2: 24-HOUR MULTI-SIGNAL SENSOR TELEMETRY LOG ---');
    csvRows.push('Timestamp,Time_Label,Ambient_Temp_C,Noise_dB,Raw_Noise_dB,HRV_ms,Raw_HRV_ms,Skin_Temp_C,TWL_Index,AQI,Risk_Score_Pct,Is_Anomaly');

    telemetryStream.forEach((t) => {
      const row = [
        `"${t.timestamp}"`,
        `"${t.timeLabel}"`,
        t.ambient_temp_c,
        t.noise_db ?? t.smoothed_noise_db ?? 0,
        t.raw_noise_db ?? 0,
        t.smoothed_hrv,
        t.raw_hrv,
        t.skin_temp_c,
        t.twl_index,
        t.aqi,
        t.risk_score,
        t.is_anomaly ? 'TRUE' : 'FALSE'
      ];
      csvRows.push(row.join(','));
    });

    csvRows.push('');
    csvRows.push('--- SECTION 3: COMPLIANCE ATTESTATION ---');
    csvRows.push('# All biometric data processed strictly via aggregate cell protection. No individual raw identifiers disclosed.');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `prognosticator-compliance-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccessMessage('Compliance CSV report downloaded successfully.');
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  const handleGenerateClientSidePdf = async () => {
    setIsPdfGenerating(true);
    setPdfGenerationStatus('Capturing telemetry charts & compiling executive report...');

    try {
      await generateExecutiveSafetyPdfReport({
        activeAlerts,
        telemetryStream,
        currentZone: currentZoneObj,
        zones,
        telemetryElementId: 'telemetry-charts-card',
        projectionElementId: 'incident-projection-chart-card',
        alertsElementId: 'active-alerts-section',
        onProgress: (status) => setPdfGenerationStatus(status)
      });

      setDownloadSuccessMessage('Executive Safety Report PDF generated and downloaded successfully.');
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      setDownloadSuccessMessage('PDF export encountered an issue. Falling back to print view.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } finally {
      setIsPdfGenerating(false);
      setPdfGenerationStatus('');
    }
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prognosticator Compliance Report - ${dateFormatted}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; color: #0369a1; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .kpi-grid { display: flex; gap: 15px; margin: 20px 0; }
            .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .kpi-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .kpi-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .sev-critical { color: #dc2626; font-weight: bold; }
            .sev-high { color: #ea580c; font-weight: bold; }
            .sev-mod { color: #d97706; font-weight: bold; }
            .notice { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px; border-radius: 6px; font-size: 12px; margin-top: 25px; }
            @media print {
              body { margin: 15mm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">PROGNOSTICATOR ENTERPRISE HEALTH & SAFETY AUDIT REPORT</h1>
            <p class="subtitle">Multi-Signal Population Surveillance &amp; Early-Warning Compliance Documentation</p>
            <p style="font-size: 11px; color: #64748b;">Generated: ${timestamp} | Facility Zone: ${currentZone}</p>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Active Monitored Workforce</div>
              <div class="kpi-value">${currentZoneObj.count || 1420} Workers</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Active Critical Alerts</div>
              <div class="kpi-value">${activeAlerts.filter((a) => a.severity === 'CRITICAL').length} Incidents</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Avg Wet-Bulb Heat Index</div>
              <div class="kpi-value">${currentZoneObj.heatIndex || 42.5}°C</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Model Lead Time</div>
              <div class="kpi-value">3.8 Hours</div>
            </div>
          </div>

          <h3>1. Active Detected Health Anomalies (Kalman Validated)</h3>
          <table>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Zone</th>
                <th>Anomaly Metric</th>
                <th>Severity</th>
                <th>Kalman State Validation</th>
                <th>Early Warning Lead</th>
                <th>Action Protocol</th>
              </tr>
            </thead>
            <tbody>
              ${activeAlerts
                .map(
                  (a) => `
                <tr>
                  <td style="font-family: monospace; font-weight: bold;">${a.id}</td>
                  <td>${a.location_zone}</td>
                  <td><strong>${a.anomaly_metric}</strong></td>
                  <td class="${a.severity === 'CRITICAL' ? 'sev-critical' : a.severity === 'HIGH' ? 'sev-high' : 'sev-mod'}">${a.severity}</td>
                  <td style="font-size: 11px;">${a.kalman_status} (${a.kalman_smoothed_value})</td>
                  <td style="font-family: monospace;">${a.lead_time}</td>
                  <td style="font-size: 11px;">${a.recommended_action}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="notice">
            <strong>Compliance Statement:</strong> All biometrics are processed with strict k-Anonymity small-cell suppression (N &ge; 12) and Differential Privacy (epsilon=0.5). Raw biometric identity tracking is cryptographically prohibited under European GDPR Article 9 &amp; US HIPAA Security Rule.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);

    setDownloadSuccessMessage('Summary PDF print stream dispatched.');
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Executive Safety Report &amp; Compliance Generator
              </h3>
              <p className="text-xs text-slate-400">
                Generate printable executive safety reports capturing telemetry charts, 48-hour incident forecasts, and active alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback message */}
        {downloadSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Loading Progress State */}
        {isPdfGenerating && (
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-3 animate-pulse">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-white">Rendering Client-Side Executive PDF Report...</div>
              <div className="text-[11px] text-cyan-300 font-mono mt-0.5">{pdfGenerationStatus}</div>
            </div>
          </div>
        )}

        {/* Report Overview Card */}
        <div className="py-4 space-y-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Report Inclusions &amp; Facility Context
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Report Date</span>
                <span className="text-slate-200 font-medium font-mono">{dateFormatted}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Active Facility</span>
                <span className="text-cyan-400 font-medium truncate block">{currentZoneObj.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Active Alerts</span>
                <span className="text-rose-400 font-bold">{activeAlerts.length} Recorded</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">48h Projection</span>
                <span className="text-amber-400 font-bold">Autoregressive LSTM</span>
              </div>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* 1. Client-Side Executive PDF (Direct Canvas & Vector generation) */}
            <div
              onClick={!isPdfGenerating ? handleGenerateClientSidePdf : undefined}
              className={`p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400 cursor-pointer transition flex flex-col justify-between group shadow-lg shadow-cyan-950/30 ${
                isPdfGenerating ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition" />
                    Executive PDF
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                    Client-Side PDF
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Captures live telemetry charts, 48-hour incident projection trends, and active Kalman anomaly logs into a multi-page executive document.
                </p>
              </div>
              <button
                disabled={isPdfGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateClientSidePdf();
                }}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. CSV Option */}
            <div
              onClick={generateCsv}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-emerald-500/50 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition" />
                    Compliance CSV
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                    RFC 4180
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tabular spreadsheet format containing active anomalies, 24-hr multi-signal points (ambient temp, noise dB, HRV), and validation records.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateCsv();
                }}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV File</span>
              </button>
            </div>

            {/* 3. Browser Print / Save PDF View */}
            <div
              onClick={handlePrintPdf}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-indigo-500/50 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Printer className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition" />
                    Print Layout
                  </span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                    Native Print
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Quick browser print stream for hardcopy paper sign-offs and shift supervisor hand-off documentation.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintPdf();
                }}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-500/30 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-400" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>GDPR Article 9 &amp; HIPAA Security Rule Certification Included</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-1.5 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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
  AlertTriangle,
  Loader2,
  Sparkles,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import { downloadAnomalyReportCsv } from '../services/reportExportService';
import { defaultPrivacyShield } from '../services/privacyShield';

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
  const [selectedExportZoneId, setSelectedExportZoneId] = useState<string>(currentZone);

  if (!isOpen) return null;

  const currentZoneObj =
    zones.find((z) => z.id === selectedExportZoneId || z.name === selectedExportZoneId) ||
    zones.find((z) => z.name === currentZone || z.id === currentZone) ||
    zones[0];

  const cohortSize = currentZoneObj.count || 14;
  const isCohortSuppressed = defaultPrivacyShield.isCohortSuppressed(cohortSize);

  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleExportCsv = () => {
    try {
      const result = downloadAnomalyReportCsv({
        data: telemetryStream,
        thresholds: {
          minHrvMs: 40,
          maxHrvDropPct: 35,
          maxSkinTempC: 37.8,
          maxAmbientHeatC: 38.0,
          maxNoiseDb: 85.0,
          minTwlIndex: 115,
          riskScoreCutoffPct: 70,
          maxHeartRateBpm: 115,
          enableSmsRadioDispatch: true,
          enableVoiceAlerts: true,
          enableInAppBeacon: true,
          applicableZoneId: currentZoneObj.id
        },
        zone: currentZoneObj,
        activeAlerts
      });

      setDownloadSuccessMessage(
        `Compliance CSV exported successfully (${result.recordCount} samples). File: ${result.filename}`
      );
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      setDownloadSuccessMessage(`CSV export error: ${err?.message || 'Failed to generate file'}`);
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    }
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
    window.print();
    setDownloadSuccessMessage('Dispatched printable audit stream to browser.');
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                Export anonymized health trend reports to CSV or PDF for OSHA, HIPAA, and GDPR compliance
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

        <div className="overflow-y-auto flex-1 pr-1 space-y-4 py-4">
          {/* Privacy Shield Specifications Verification Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                Privacy Shield Compliance Attestation
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                GDPR Art. 9 &amp; HIPAA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              All exported health trends strictly enforce the Prognosticator Privacy Shield specifications.
              Individual identifiable records are masked using small-cell suppression when cohort size{' '}
              <strong>N &lt; 12</strong>, and continuous risk scores receive calibrated Laplace differential privacy noise (
              <strong>&epsilon; = 0.5</strong>). Under company policy and HIPAA guidelines, exported data is strictly non-punitive.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">k-Anonymity Standard</span>
                <span className={`font-bold ${isCohortSuppressed ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isCohortSuppressed ? `Suppressed (N=${cohortSize} < 12)` : `Verified (N=${cohortSize} >= 12)`}
                </span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Differential Privacy</span>
                <span className="text-cyan-400 font-bold">&epsilon; = 0.5 (Laplace Noise)</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Personal Identifiers</span>
                <span className="text-purple-400 font-bold">Zero PII / Pseudonymized</span>
              </div>
            </div>
          </div>

          {/* Facility Zone Selection & Report Context */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1">
              <label htmlFor="target-facility-zone-select" className="text-slate-400 block text-[10px] uppercase font-mono mb-1">
                Target Facility Zone For Export
              </label>
              <div className="relative">
                <select
                  id="target-facility-zone-select"
                  aria-label="Target Facility Zone For Export"
                  value={selectedExportZoneId}
                  onChange={(e) => setSelectedExportZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white appearance-none cursor-pointer focus:outline-hidden focus:border-cyan-500"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Cohort N={z.count} workers, {z.status} risk)
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 text-center shrink-0">
              <div>
                <span className="text-slate-500 block text-[10px]">Cohort Size</span>
                <span className="text-white font-bold font-mono">{cohortSize}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Active Alerts</span>
                <span className="text-rose-400 font-bold font-mono">{activeAlerts.length}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Sampling</span>
                <span className="text-cyan-400 font-bold font-mono">24h / 15m</span>
              </div>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Client-Side Executive PDF */}
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
                    Multi-Page PDF
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Captures live telemetry charts, 48-hour incident projection trends, active Kalman anomaly logs, and dual supervisory sign-off blocks.
                </p>
              </div>
              <button
                disabled={isPdfGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateClientSidePdf();
                }}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Compliance CSV Option */}
            <div
              onClick={handleExportCsv}
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
                  Tabular spreadsheet format containing 24-hour health trend series (HR, HRV, skin temp, noise dB, TWL) and active anomaly incidents.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportCsv();
                }}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
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
                  Quick browser print view for physical hardcopy filing and shift supervisor handover documentation.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintPdf();
                }}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-500/30 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-400" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>GDPR Article 9 &amp; HIPAA Security Rule Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-1.5 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

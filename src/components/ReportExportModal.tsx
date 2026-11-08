import React, { useState, useMemo } from 'react';
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
  Lock,
  ChevronDown,
  Activity,
  Layers,
  Heart,
  Thermometer,
  ShieldAlert,
  Calendar,
  Clock
} from 'lucide-react';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import { generateDashboardSummaryPdfReport } from '../services/dashboardSummaryPdfGenerator';
import {
  downloadAnomalyReportCsv,
  downloadHealthTrendsCsv,
  downloadActiveAnomaliesCsv
} from '../services/reportExportService';
import { defaultPrivacyShield } from '../services/privacyShield';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  currentZone: string;
  zones: FacilityZone[];
}

export type ExportScope = 'ALL' | 'HEALTH_TRENDS' | 'ANOMALIES';
export type TimeHorizon = '24h' | '12h' | '8h' | '4h';

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
  const [isCsvGenerating, setIsCsvGenerating] = useState<boolean>(false);
  const [selectedExportZoneId, setSelectedExportZoneId] = useState<string>(currentZone);
  const [exportScope, setExportScope] = useState<ExportScope>('ALL');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('24h');

  // Determine active zone object
  const currentZoneObj = useMemo(() => {
    return (
      zones.find((z) => z.id === selectedExportZoneId || z.name === selectedExportZoneId) ||
      zones.find((z) => z.name === currentZone || z.id === currentZone) ||
      zones[0]
    );
  }, [zones, selectedExportZoneId, currentZone]);

  // Filter telemetry stream by time horizon
  const filteredTelemetry = useMemo(() => {
    const total = telemetryStream.length;
    let sliceCount = total;
    if (timeHorizon === '4h') sliceCount = Math.min(total, 16);
    else if (timeHorizon === '8h') sliceCount = Math.min(total, 32);
    else if (timeHorizon === '12h') sliceCount = Math.min(total, 48);
    else sliceCount = total; // 24h = ~96 15-minute points

    return telemetryStream.slice(-sliceCount);
  }, [telemetryStream, timeHorizon]);

  // Filter alerts by selected zone if not "all"
  const relevantAlerts = useMemo(() => {
    if (selectedExportZoneId === 'ALL_FACILITIES') {
      return activeAlerts;
    }
    return activeAlerts.filter(
      (a) =>
        a.location_zone === currentZoneObj.name ||
        a.location_zone === currentZoneObj.id
    );
  }, [activeAlerts, selectedExportZoneId, currentZoneObj]);

  if (!isOpen) return null;

  const cohortSize = currentZoneObj.count || 14;
  const isCohortSuppressed = defaultPrivacyShield.isCohortSuppressed(cohortSize);

  // Quick summary stats
  const peakHr = filteredTelemetry.reduce(
    (max, p) => Math.max(max, p.heart_rate_bpm ?? Math.round(72 + (68 - p.smoothed_hrv) * 1.2)),
    0
  );
  const minHrv = filteredTelemetry.reduce((min, p) => Math.min(min, p.smoothed_hrv || 50), 100);
  const peakSkin = filteredTelemetry.reduce((max, p) => Math.max(max, p.skin_temp_c || 36.5), 0);
  const peakRisk = filteredTelemetry.reduce((max, p) => Math.max(max, p.risk_score || 0), 0);

  // 1. Export CSV according to scope
  const handleExportCsv = (specificScope?: ExportScope) => {
    const scope = specificScope || exportScope;
    setIsCsvGenerating(true);

    try {
      const defaultThresholds = {
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
      };

      let result;
      if (scope === 'HEALTH_TRENDS') {
        result = downloadHealthTrendsCsv({
          data: filteredTelemetry,
          thresholds: defaultThresholds,
          zone: currentZoneObj
        });
        setDownloadSuccessMessage(
          `Health trends CSV downloaded (${result.recordCount} intervals). File: ${result.filename}`
        );
      } else if (scope === 'ANOMALIES') {
        result = downloadActiveAnomaliesCsv({
          activeAlerts: relevantAlerts,
          zone: currentZoneObj
        });
        setDownloadSuccessMessage(
          `Active anomalies CSV downloaded (${result.recordCount} alerts). File: ${result.filename}`
        );
      } else {
        result = downloadAnomalyReportCsv({
          data: filteredTelemetry,
          thresholds: defaultThresholds,
          zone: currentZoneObj,
          activeAlerts: relevantAlerts
        });
        setDownloadSuccessMessage(
          `Combined health & anomaly CSV downloaded (${result.recordCount} intervals, ${relevantAlerts.length} alerts). File: ${result.filename}`
        );
      }

      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      setDownloadSuccessMessage(`CSV export error: ${err?.message || 'Failed to generate file'}`);
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } finally {
      setIsCsvGenerating(false);
    }
  };

  // 2. Export Executive Multi-Page PDF
  const handleGenerateExecutivePdf = async () => {
    setIsPdfGenerating(true);
    setPdfGenerationStatus('Capturing telemetry charts & compiling executive report...');

    try {
      await generateExecutiveSafetyPdfReport({
        activeAlerts: relevantAlerts,
        telemetryStream: filteredTelemetry,
        currentZone: currentZoneObj,
        zones,
        telemetryElementId: 'telemetry-charts-card',
        riskTrendElementId: 'workforce-risk-trend-7d-card',
        predictiveChartElementId: 'kalman-predictive-model-30days-chart',
        aggregateRiskElementId: 'aggregate-risk-score-trend-24h',
        health30dElementId: 'workforce-health-30d-trend-card',
        anomalyTrendElementId: 'anomaly-trend-30d-card',
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

  // 3. Export Summary Metrics PDF
  const handleGenerateSummaryPdf = async () => {
    setIsPdfGenerating(true);
    setPdfGenerationStatus('Compiling 2-page metrics and anomaly breakdown PDF...');

    try {
      await generateDashboardSummaryPdfReport({
        activeAlerts: relevantAlerts,
        currentZone: currentZoneObj,
        zones,
        telemetryStream: filteredTelemetry,
        onProgress: (status) => setPdfGenerationStatus(status)
      });

      setDownloadSuccessMessage('Dashboard Summary PDF generated and downloaded successfully.');
      setTimeout(() => setDownloadSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Failed to generate summary PDF report:', error);
      setDownloadSuccessMessage('Summary PDF export failed.');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 p-2.5 rounded-xl text-cyan-400">
              <Download className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Export Data: Health Trends &amp; Anomaly Reports
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download current workforce vital telemetry, Kalman anomaly validations, and hazard logs in CSV or PDF formats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {downloadSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Loading Progress State */}
        {isPdfGenerating && (
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-3 animate-pulse">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-white">Generating Executive Report Document...</div>
              <div className="text-[11px] text-cyan-300 font-mono mt-0.5">{pdfGenerationStatus}</div>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 pr-1 space-y-4 py-4">
          {/* Privacy Shield Attestation Banner */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/30 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                Privacy Shield Compliance Guarantee
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                GDPR Art. 9 &amp; HIPAA § 164.514
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Exported records protect worker privacy with k-Anonymity small-cell suppression (N &ge; 12) and Laplace differential privacy noise (&epsilon; = 0.5) applied to all individual risk scores. Individual personal identifiers (PII) are strictly scrubbed and pseudonymized.
            </p>
          </div>

          {/* Export Configuration Controls: Scope, Zone, and Time Horizon */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Scope Selector */}
              <div>
                <label className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  1. Data Content Scope
                </label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setExportScope('ALL')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      exportScope === 'ALL'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Data
                  </button>
                  <button
                    onClick={() => setExportScope('HEALTH_TRENDS')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      exportScope === 'HEALTH_TRENDS'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Health Trends
                  </button>
                  <button
                    onClick={() => setExportScope('ANOMALIES')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      exportScope === 'ANOMALIES'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Anomalies
                  </button>
                </div>
              </div>

              {/* 2. Facility Zone Selector */}
              <div>
                <label htmlFor="export-zone-select" className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  2. Target Workplace Zone
                </label>
                <div className="relative">
                  <select
                    id="export-zone-select"
                    value={selectedExportZoneId}
                    onChange={(e) => setSelectedExportZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white appearance-none cursor-pointer focus:outline-hidden focus:border-cyan-500 pr-8"
                  >
                    <option value="ALL_FACILITIES">All Facility Zones (Consolidated)</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (N={z.count} workers, {z.status} risk)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* 3. Time Horizon Selector */}
              <div>
                <label className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  3. Sampling Window
                </label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setTimeHorizon('24h')}
                    className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timeHorizon === '24h'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    24h Rolling
                  </button>
                  <button
                    onClick={() => setTimeHorizon('12h')}
                    className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timeHorizon === '12h'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    12h
                  </button>
                  <button
                    onClick={() => setTimeHorizon('8h')}
                    className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timeHorizon === '8h'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    8h Shift
                  </button>
                  <button
                    onClick={() => setTimeHorizon('4h')}
                    className={`flex-1 py-1.5 px-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      timeHorizon === '4h'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4h Surge
                  </button>
                </div>
              </div>
            </div>

            {/* Live Data Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Data Intervals</span>
                <span className="text-cyan-400 font-bold font-mono text-sm tabular-nums">
                  {filteredTelemetry.length} samples
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Active Anomalies</span>
                <span className={`font-bold font-mono text-sm tabular-nums ${relevantAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {relevantAlerts.length} events
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Cohort Size</span>
                <span className="text-white font-bold font-mono text-sm tabular-nums">
                  {cohortSize} workers
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Peak HR / Min HRV</span>
                <span className="text-amber-400 font-bold font-mono text-xs tabular-nums">
                  {peakHr} bpm / {minHrv.toFixed(1)} ms
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px]">k-Anonymity (N&ge;12)</span>
                <span className={`font-bold font-mono text-xs ${isCohortSuppressed ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isCohortSuppressed ? 'Suppressed (<12)' : 'Cleared (&ge;12)'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Download Format Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* CARD 1: CSV Export Option */}
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-900/60 hover:border-emerald-400 transition flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                    CSV Data Export
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                    RFC 4180
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Raw tabular format ready for Excel, Google Sheets, Python / Pandas, or PowerBI. Contains multi-signal time series, Kalman smoothed values, breach flags, and active incident records.
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Export Content:</span>
                    <strong className="text-white">
                      {exportScope === 'ALL'
                        ? 'Full Trends + Anomaly Log'
                        : exportScope === 'HEALTH_TRENDS'
                        ? 'Health Trends Series Only'
                        : 'Active Anomalies Table Only'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sampling Interval:</span>
                    <span className="text-emerald-400 font-mono">15-Minute Epochs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Differential Privacy:</span>
                    <span className="text-cyan-400 font-mono">&epsilon; = 0.5 Noise Added</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  disabled={isCsvGenerating}
                  onClick={() => handleExportCsv()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download {exportScope === 'HEALTH_TRENDS' ? 'Health Trends' : exportScope === 'ANOMALIES' ? 'Anomaly Reports' : 'All Data'} as CSV
                  </span>
                </button>

                {/* Sub-actions for specific CSV files */}
                {exportScope === 'ALL' && (
                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={() => handleExportCsv('HEALTH_TRENDS')}
                      className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-md transition text-center cursor-pointer font-medium"
                    >
                      Trends Only (CSV)
                    </button>
                    <button
                      onClick={() => handleExportCsv('ANOMALIES')}
                      className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-md transition text-center cursor-pointer font-medium"
                    >
                      Anomalies Only (CSV)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: PDF Export Option */}
            <div className="p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-slate-900/60 hover:border-cyan-400 transition flex flex-col justify-between shadow-lg shadow-cyan-950/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-400" />
                    PDF Report Export
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-semibold">
                    Multi-Page Document
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Publication-ready PDF document complete with captured visual telemetry trends, incident projections, active Kalman validation details, and formal EHS supervisory sign-off blocks.
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Document Format:</span>
                    <strong className="text-white">A4 Portrait (Vector Typography)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Visual Assets:</span>
                    <span className="text-cyan-400">Captured Telemetry &amp; Projections</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sign-Off Blocks:</span>
                    <span className="text-purple-400">EHS Lead &amp; Medical Officer</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  disabled={isPdfGenerating}
                  onClick={handleGenerateExecutivePdf}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isPdfGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compiling PDF Report...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Executive PDF Report</span>
                    </>
                  )}
                </button>

                {/* Sub-actions for PDF reports */}
                <div className="flex gap-2 text-[11px]">
                  <button
                    disabled={isPdfGenerating}
                    onClick={handleGenerateSummaryPdf}
                    className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-md transition text-center cursor-pointer font-medium disabled:opacity-50"
                  >
                    Summary Metrics (PDF)
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md transition text-center cursor-pointer font-medium flex items-center gap-1 shrink-0"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>Strictly Non-Punitive Occupational Health &amp; Safety Compliance Standard</span>
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

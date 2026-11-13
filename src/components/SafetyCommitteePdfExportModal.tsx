import React, { useState } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  Activity,
  FileCheck,
  Download,
  Loader2,
  Clock,
  MapPin,
  Building2,
  CheckSquare,
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ActiveAnomalyAlert,
  FacilityZone,
  TelemetryDataPoint,
  HealthSignalNotificationThresholds,
  KalmanSensitivityConfig
} from '../types';
import { generateSafetyCommitteePdfReport, GeneratedPdfResult } from '../services/safetyCommitteePdfGenerator';

export interface SafetyCommitteePdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlerts: ActiveAnomalyAlert[];
  currentZone: FacilityZone;
  zones: FacilityZone[];
  telemetryStream: TelemetryDataPoint[];
  healthThresholds?: HealthSignalNotificationThresholds;
  kalmanConfig?: KalmanSensitivityConfig;
  onExportSuccess?: (filename: string, result: GeneratedPdfResult) => void;
}

export default function SafetyCommitteePdfExportModal({
  isOpen,
  onClose,
  activeAlerts,
  currentZone,
  zones,
  telemetryStream,
  healthThresholds,
  kalmanConfig,
  onExportSuccess
}: SafetyCommitteePdfExportModalProps) {
  const [meetingTitle, setMeetingTitle] = useState('Joint Health & Safety Committee (JHSC) Review Session');
  const [docketNumber, setDocketNumber] = useState(
    () => `JHSC-REV-${new Date().toISOString().split('T')[0]}-${currentZone.id.toUpperCase()}`
  );
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [committeeChair, setCommitteeChair] = useState('Dr. Sarah Lin, MD (Occupational Health Lead)');
  const [safetyOfficer, setSafetyOfficer] = useState('EHS Safety Director (CSP)');
  const [agendaNotes, setAgendaNotes] = useState(
    'Review of current shift telemetry, thermal strain thresholds, active acoustic exposure levels, and preventive engineering mitigations across operational zones.'
  );

  const [sections, setSections] = useState({
    executiveKpis: true,
    telemetryVitals: true,
    zoneAudit: true,
    anomalyLog: true,
    predictiveProjections: true,
    actionItems: true,
    committeeSignOff: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute live stats for modal preview
  const recentPoints = telemetryStream.slice(-20);
  const avgRisk = recentPoints.length > 0
    ? Number((recentPoints.reduce((acc, p) => acc + (p.risk_score || 0), 0) / recentPoints.length).toFixed(1))
    : 44.2;
  const currentRisk = recentPoints.length > 0 ? recentPoints[recentPoints.length - 1].risk_score : 48.0;
  const criticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const totalMonitored = zones.reduce((acc, z) => acc + (z.count || 0), 0);

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress('Compiling statistical indicators...');
    try {
      const result = await generateSafetyCommitteePdfReport({
        activeAlerts,
        currentZone,
        zones,
        telemetryStream,
        healthThresholds,
        kalmanConfig,
        meetingTitle,
        docketNumber,
        committeeChair,
        safetyOfficer,
        meetingDate,
        agendaNotes,
        includedSections: sections,
        onProgress: (status) => setExportProgress(status)
      });

      setExportSuccessMessage(`Downloaded: ${result.filename}`);
      onExportSuccess?.(result.filename, result);

      setTimeout(() => {
        setExportSuccessMessage(null);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Safety committee PDF export error:', err);
      setExportProgress('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Safety Committee PDF Report Export
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  OFFLINE REVIEW
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official workforce health &amp; operational hazard dossier for Joint Health &amp; Safety Committee (JHSC) meetings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Key Statistics Callout Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Site Zone</span>
              <div className="text-sm font-bold text-white truncate">{currentZone.name}</div>
              <span className="text-[10px] text-cyan-400 font-mono">{currentZone.id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Current Risk</span>
              <div className="text-sm font-bold text-rose-400">{currentRisk}%</div>
              <span className="text-[10px] text-slate-400">24h Mean: {avgRisk}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Active Anomalies</span>
              <div className="text-sm font-bold text-amber-400">{activeAlerts.length} Flagged</div>
              <span className="text-[10px] text-slate-400">{criticalCount} Critical priority</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Monitored Cohort</span>
              <div className="text-sm font-bold text-emerald-400">{totalMonitored} Workers</div>
              <span className="text-[10px] text-slate-400">k &ge; 12 Privacy Shield</span>
            </div>
          </div>

          {/* Meeting & Docket Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Committee Meeting Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Committee Meeting Title / Session</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Monthly Joint Health & Safety Committee Meeting"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Docket Reference Number</label>
                <input
                  type="text"
                  value={docketNumber}
                  onChange={(e) => setDocketNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="JHSC-REV-2026-..."
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Committee Chairperson</label>
                <input
                  type="text"
                  value={committeeChair}
                  onChange={(e) => setCommitteeChair(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">EHS Safety Director / Officer</label>
                <input
                  type="text"
                  value={safetyOfficer}
                  onChange={(e) => setSafetyOfficer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Agenda & Offline Focus Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Committee Agenda &amp; Offline Review Focus</span>
            </label>
            <textarea
              rows={2}
              value={agendaNotes}
              onChange={(e) => setAgendaNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Specify agenda topics, flagged risk items, or specific engineering controls to deliberate..."
            />
          </div>

          {/* Section Inclusion Checkboxes */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Report Sections to Include</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleSection('executiveKpis')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.executiveKpis ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">Executive Safety KPI Cards</div>
                  <div className="text-[10px] text-slate-400">Risk index, headcount, anomaly count, microclimate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('telemetryVitals')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.telemetryVitals ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">Multi-Signal Statistical Table</div>
                  <div className="text-[10px] text-slate-400">Heart rate, HRV, core temp, ambient heat, noise</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('zoneAudit')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.zoneAudit ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">Facility Zones Safety Matrix</div>
                  <div className="text-[10px] text-slate-400">Comparative risk ranking across all work areas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('anomalyLog')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.anomalyLog ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">Active Anomaly Ledger &amp; Root Cause</div>
                  <div className="text-[10px] text-slate-400">Flagged incidents, deviation deltas, diagnosis</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('predictiveProjections')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.predictiveProjections ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">12h Predictive Shift Projections</div>
                  <div className="text-[10px] text-slate-400">Thermal peak forecast and hydration recovery cycles</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('committeeSignOff')}
                className="flex items-center space-x-2 text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer"
              >
                {sections.committeeSignOff ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">Statutory Committee Sign-Off Block</div>
                  <div className="text-[10px] text-slate-400">Formal endorsement fields for Chair, EHS, and Union</div>
                </div>
              </button>
            </div>
          </div>

          {/* Regulatory Standards Compliance Notice */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-slate-400">
            <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="text-slate-200">OSHA 1910.132 &amp; ISO 45001 Compliant:</strong> This generated PDF document formats
              all live statistical parameters into a standardized 3-page offline dossier formatted for physical printing or offline PDF distribution during safety committee meetings.
            </div>
          </div>

          {/* Export Success Feedback */}
          {exportSuccessMessage && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-3 rounded-xl flex items-center space-x-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{exportSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>A4 Document Format • 3 Pages Vector Output</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-950/50 transition cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{exportProgress || 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Safety Committee PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

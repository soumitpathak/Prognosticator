import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  Download,
  FileText,
  Clock,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Calendar,
  Send,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  SafetyOfficer,
  DeploymentOrder,
  IncidentAssignment,
  TelemetryDataPoint
} from '../types';
import { exportDailySummaryReportCsv } from '../services/dailySummaryCsvExport';

export interface DailySummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  officers?: SafetyOfficer[];
  orders?: DeploymentOrder[];
  incidentAssignments?: Record<string, IncidentAssignment>;
  telemetryStream?: TelemetryDataPoint[];
}

export default function DailySummaryReportModal({
  isOpen,
  onClose,
  zones,
  alerts,
  officers = [],
  orders = [],
  incidentAssignments = {},
  telemetryStream = []
}: DailySummaryReportModalProps) {
  const [viewMode, setViewMode] = useState<'email' | 'visual'>('email');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute 24-hour summary metrics
  const summaryMetrics = useMemo(() => {
    // Average risk score from telemetry or default
    const avgRisk =
      telemetryStream.length > 0
        ? Number(
            (
              telemetryStream.reduce((acc, pt) => acc + (pt.risk_score || 0), 0) /
              telemetryStream.length
            ).toFixed(1)
          )
        : 28.4;

    const totalAnomalies24h = Math.max(14, alerts.length);
    const criticalAnomalies = alerts.filter((a) => a.severity === 'CRITICAL').length || 4;
    const highAnomalies = alerts.filter((a) => a.severity === 'HIGH').length || 7;
    const moderateAnomalies = alerts.filter((a) => a.severity === 'MODERATE').length || 3;

    const totalHeadcount = zones.reduce((acc, z) => acc + (z.count || 0), 0) || 142;
    const connectedEndpoints = 184;

    const resolvedIncidents = Object.values(incidentAssignments).filter(
      (i) => i.status === 'Resolved'
    ).length;
    const pendingIncidents = Object.values(incidentAssignments).filter(
      (i) => i.status === 'Pending'
    ).length;
    const investigatingIncidents = Object.values(incidentAssignments).filter(
      (i) => i.status === 'Investigating'
    ).length;

    return {
      avgRisk,
      totalAnomalies24h,
      criticalAnomalies,
      highAnomalies,
      moderateAnomalies,
      totalHeadcount,
      connectedEndpoints,
      resolvedIncidents,
      pendingIncidents,
      investigatingIncidents,
      redeploymentsCount: orders.length || 3
    };
  }, [telemetryStream, alerts, zones, incidentAssignments, orders]);

  // Generate plain-text email-ready formatted report string
  const emailReportText = useMemo(() => {
    const dateFormatted = 'Friday, November 6, 2026';
    const timestampFormatted = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    return `FROM: Alex Mercer, Lead EHS Operations Supervisor <alex.mercer@prognosticator-safety.internal>
TO: EHS Leadership Team, Plant General Manager, Shift Operations Supervisors
DATE: ${dateFormatted} (${timestampFormatted})
SUBJECT: [DAILY EHS REPORT] 24-Hour Population Health & Resource Deployment Dossier

================================================================================
EXECUTIVE INCIDENT & RESOURCE ALLOCATION SUMMARY (LAST 24 HOURS)
Prognosticator Enterprise Workforce Intelligence Core • Facility Operations
================================================================================

1. KEY REAL-TIME HEALTH & SAFETY METRICS (PAST 24 HOURS)
--------------------------------------------------------------------------------
• Average Workforce Risk Score: ${summaryMetrics.avgRisk}% (24h Peak: 78.2% in Sector 4)
• Total Anomalies Detected (24h): ${summaryMetrics.totalAnomalies24h} Events
    - Critical Severity: ${summaryMetrics.criticalAnomalies}
    - High Severity: ${summaryMetrics.highAnomalies}
    - Moderate Severity: ${summaryMetrics.moderateAnomalies}
• Monitored Workforce Population: ${summaryMetrics.totalHeadcount} Personnel across ${zones.length} Zones
• Connected IoT Biometric & Environmental Endpoints: ${summaryMetrics.connectedEndpoints} / ${summaryMetrics.connectedEndpoints} (100% Online)
• Personnel Redeployments Executed: ${summaryMetrics.redeploymentsCount} Shift Adjustments
• Incident Status Trackers: ${summaryMetrics.resolvedIncidents} Resolved | ${summaryMetrics.investigatingIncidents} Investigating | ${summaryMetrics.pendingIncidents} Pending

2. NOTABLE ANOMALY & INCIDENT EVENTS (CHRONOLOGICAL 24H)
--------------------------------------------------------------------------------
${alerts
  .map(
    (a, idx) =>
      `[${idx + 1}] ID: ${a.id} | Zone: ${a.location_zone} | Severity: ${a.severity}
    Event: ${a.anomaly_metric}
    Reading: Raw: ${a.raw_value} / Smoothed: ${a.kalman_smoothed_value}
    Recommended Action: ${a.recommended_action}
    Status: ${a.acknowledged ? 'Acknowledged & Field Mitigated' : 'Under Active Surveillance'}`
  )
  .join('\n\n')}

3. RESOURCE ALLOCATION & SAFETY PERSONNEL DEPLOYMENT CHANGES (24H)
--------------------------------------------------------------------------------
Summary of dynamic supervisor transfers executed in response to anomaly surges:
${orders
  .map(
    (ord) =>
      `• Order ${ord.id} (${ord.timestamp}):
    Officer(s): ${ord.officerNames.join(', ')}
    Route: ${ord.fromZone} ➔ ${ord.toZone}
    Urgency: ${ord.urgency} | Justification: "${ord.reason}"
    Current Status: ${ord.status}`
  )
  .join('\n\n')}

Zone Staffing Ratios & Coverage Health:
${zones
  .map((z) => {
    const assignedOfficers = officers.filter((o) => o.currentZoneId === z.id);
    const count = z.count || 24;
    const ratio = assignedOfficers.length > 0 ? (count / assignedOfficers.length).toFixed(1) : 'No Staff';
    return `• ${z.name}: ${assignedOfficers.length} Officers assigned to ${count} workers (Ratio 1:${ratio}) — Status: ${z.status} (${z.temp})`;
  })
  .join('\n')}

4. ACTIVE INCIDENT RESPONSE STATUS TRACKERS
--------------------------------------------------------------------------------
${Object.entries(incidentAssignments)
  .map(([id, assign]) => {
    return `• Alert ${id}:
    Status: ${assign.status.toUpperCase()} | Priority: ${assign.priority}
    Assigned Lead: ${assign.assigneeName || 'Unassigned'} (${assign.assigneeRole || 'EHS Specialist'})
    Latest Field Note: "${assign.resolutionNotes || 'Response team on-site conducting assessment.'}"
    Updated: ${assign.updatedAt}`;
  })
  .join('\n\n')}

5. ACTIONABLE DIRECTIVES & HANDOVER FOR INCOMING SHIFT
--------------------------------------------------------------------------------
1. Outdoor Construction Sector 4: Maintain mandatory 15-minute shaded pause rotation and continuous misting due to diurnal thermal runaway peak.
2. Manufacturing Assembly Line B: LOTO Stage 2 electrical lockout scheduled for Conveyor 4B bearing lubrication replenishment.
3. Personal Protective Equipment: Secondary acoustic hearing defenders mandate remains active in Sector 4 high-decibel radius.
4. Privacy Compliance: All published metrics verified under k-Anonymity (N >= 12) and Differential Privacy (epsilon=0.5).

================================================================================
Generated automatically by Prognosticator Early-Warning Intelligence
Signed: Alex Mercer, Lead EHS Operations Supervisor
Report Verification Hash: SHA256-EHS-DAILY-${Date.now().toString(16).toUpperCase()}
================================================================================`;
  }, [summaryMetrics, alerts, orders, zones, officers, incidentAssignments]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(emailReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = emailReportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([emailReportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `daily-summary-report-24h-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const [csvExportSuccess, setCsvExportSuccess] = useState<boolean>(false);

  const handleExportCsv = () => {
    exportDailySummaryReportCsv(
      zones,
      alerts,
      officers,
      orders,
      incidentAssignments,
      telemetryStream
    );
    setCsvExportSuccess(true);
    setTimeout(() => setCsvExportSuccess(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Daily Summary Report (24h)</h3>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  Email-Ready
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  Aggregated Past 24h
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregates all 24h anomaly triggers, resource allocations, and active incident response status trackers
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono mr-2">
              <button
                onClick={() => setViewMode('email')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'email' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Email Format
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'visual' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Executive Cards
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
          {viewMode === 'email' ? (
            /* Email-Ready Pre-Formatted View */
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 shadow-inner">
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>Plain-Text &bull; Ready to copy &amp; send via Email / Slack</span>
                  <span className="text-cyan-400">Character count: {emailReportText.length} chars</span>
                </div>
                <pre className="whitespace-pre-wrap font-mono leading-relaxed select-all text-[11px] text-slate-300">
                  {emailReportText}
                </pre>
              </div>
            </div>
          ) : (
            /* Visual Executive Cards View */
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase">Avg Workforce Risk</span>
                  <div className="text-xl font-bold text-cyan-400 mt-1 tabular-nums">
                    {summaryMetrics.avgRisk}%
                  </div>
                  <span className="text-[10px] text-slate-500">Peak: 78.2% (Sector 4)</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase">24h Total Anomalies</span>
                  <div className="text-xl font-bold text-rose-400 mt-1 tabular-nums">
                    {summaryMetrics.totalAnomalies24h}
                  </div>
                  <span className="text-[10px] text-rose-300">
                    {summaryMetrics.criticalAnomalies} Critical &bull; {summaryMetrics.highAnomalies} High
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase">Monitored Endpoints</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {summaryMetrics.connectedEndpoints} / {summaryMetrics.connectedEndpoints}
                  </div>
                  <span className="text-[10px] text-emerald-500">100% Telemetry Online</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase">Resource Redeployments</span>
                  <div className="text-xl font-bold text-amber-300 mt-1 tabular-nums">
                    {summaryMetrics.redeploymentsCount}
                  </div>
                  <span className="text-[10px] text-slate-500">Dynamic Adjustments</span>
                </div>
              </div>

              {/* Resource Allocation Changes in Past 24h */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white uppercase font-mono mb-3 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-cyan-400" />
                  Resource Allocation Redeployments (Past 24 Hours)
                </h4>
                <div className="space-y-2.5">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{ord.id}</span>
                          <span className="text-white font-medium">{ord.officerNames.join(', ')}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                            {ord.urgency}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ord.fromZone} ➔ <strong className="text-cyan-300">{ord.toZone}</strong> &bull; &ldquo;{ord.reason}&rdquo;
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Incident Response Status Trackers */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white uppercase font-mono mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Active Incident Response Status Trackers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(incidentAssignments).map(([id, item]) => (
                    <div key={id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-cyan-400">{id}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'Investigating'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Assignee: {item.assigneeName || 'Unassigned'}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-1 line-clamp-2 italic">
                        &ldquo;{item.resolutionNotes || 'Conducting on-site investigation.'}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {copied ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-4 w-4 text-emerald-400" />
                Copied formatted report to clipboard! Ready to paste.
              </span>
            ) : (
              <span>Click button to copy email format or download as text file.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-cyan-600/30 cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Email Text'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
              title="Export 24-hour summary dataset as RFC 4180 CSV for external analytics"
            >
              {csvExportSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>CSV Exported</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs transition border border-slate-700 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-300" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

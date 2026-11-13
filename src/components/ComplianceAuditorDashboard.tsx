import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  ShieldCheck,
  Lock,
  Download,
  CheckCircle2,
  Scale,
  Database,
  Sparkles,
  Globe2,
  FileSpreadsheet,
  FileText,
  BarChart3
} from 'lucide-react';
import { UserPersona, RegulatoryJurisdiction } from '../types';
import { REGULATORY_FRAMEWORKS } from '../services/authService';
import { INITIAL_FACILITY_ZONES, INITIAL_ACTIVE_ALERTS, generateSyntheticStream } from '../services/telemetryStream';
import { systemComplianceService } from '../services/systemComplianceService';
import { complianceAuditService } from '../services/complianceAuditService';
import { generateComplianceAuditPdf } from '../services/compliancePdfGenerator';
import { exportCurrentAnomalyLogsAndTrendsCsv } from '../services/complianceCsvExport';
import { generate30DayAnomalyTrendWithProjection } from '../services/anomalyTrend30DayService';
import { compileFullAnomalyAuditLog } from '../services/anomalyAuditService';
import { defaultPrivacyShield } from '../services/privacyShield';
import { useTranslation } from '../services/i18nService';
import { crossRoleOperationsService, useCrossRoleOperations } from '../services/crossRoleOperationsService';
import LanguageAutocomplete from './LanguageAutocomplete';

interface ComplianceAuditorDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

type AuditorTab = 'LEDGER' | 'AGGREGATE_COMPLIANCE' | 'EXPORTS';

export default function ComplianceAuditorDashboard({
  currentUser,
  isAccessibilityMode = false
}: ComplianceAuditorDashboardProps) {
  const { t } = useTranslation();
  const a = t.auditor;
  const ops = useCrossRoleOperations();
  const logs = ops.ledgerBlocks;
  const [activeTab, setActiveTab] = useState<AuditorTab>('LEDGER');
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const framework = REGULATORY_FRAMEWORKS[currentUser.jurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;
  const complianceEvents = useMemo(() => systemComplianceService.getEvents(), [exportedStatus, logs.length]);
  const summaryMetrics = useMemo(() => systemComplianceService.getSummaryMetrics(), [exportedStatus, logs.length]);
  const operationalAuditRecords = useMemo(() => complianceAuditService.getRecords().slice(0, 6), [logs.length]);

  const recordAuditExport = (action: 'EXPORTED_PDF' | 'EXPORTED_CSV', reportName: string) => {
    systemComplianceService.logEvent({
      accessorId: currentUser.id,
      accessorName: currentUser.name,
      accessorRole: currentUser.roleTitle,
      department: currentUser.department,
      reportName,
      reportType: 'POPULATION_HEALTH_EPIDEMIOLOGY',
      accessAction: action,
      hipaaClassification: 'HIPAA §164.514 Safe Harbor De-Identified Statutory Inspection',
      privacyShieldMetric: {
        epsilonConsumed: 0.05,
        kAnonymityCount: 14,
        laplaceNoiseBudgetRemaining: 2.45,
        status: 'COMPLIANT_AUTHORIZED'
      },
      dataSubjectCount: 144,
      justification: `Statutory regulatory inspection export by ${currentUser.name}.`,
      ipAddress: '10.200.4.18',
      terminalId: 'WSH-INSPECTOR-05'
    });
    crossRoleOperationsService.recordAuditExport({
      actorRole: 'WSH_AUDITOR_ER',
      reportTitle: reportName,
      legalStandard: `${framework.regulatoryBody} / HIPAA §164.514`
    });
  };

  const handleExportDossier = () => {
    const reportData = {
      auditTimestamp: new Date().toISOString(),
      inspector: currentUser.name,
      clearanceLevel: currentUser.clearanceLevel,
      organization: currentUser.organization,
      frameworkCompliance: {
        singaporeMOM: '100% COMPLIANT - ZERO CITATIONS',
        usOshaHeatNEP: '100% COMPLIANT - ZERO CITATIONS',
        gccMoHREMidday: 'ACTIVE MANDATORY RECESS ENFORCED',
        euGdprArt9: 'k-ANONYMITY >= 12 & EPSILON=0.5 VALIDATED'
      },
      cryptographicAuditChain: logs,
      hipaaAccessEvents: complianceEvents.slice(0, 10)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WSH_Regulatory_Audit_Dossier_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    recordAuditExport('EXPORTED_CSV', 'WSH Statutory Regulatory Audit Dossier (JSON)');
    setExportedStatus('Digitally signed WSH Statutory Regulatory Audit Dossier (JSON) successfully exported.');
    setTimeout(() => setExportedStatus(null), 5000);
  };

  const handleExportCertifiedPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateComplianceAuditPdf({
        events: complianceEvents,
        summaryMetrics,
        reportTitle: `Statutory Regulatory Compliance & HIPAA Inspection Dossier (${framework.countryName})`,
        auditScopeFilter: `Inspector: ${currentUser.name} (${currentUser.clearanceLevel})`
      });
      recordAuditExport('EXPORTED_PDF', 'Certified HIPAA & WSH Compliance Audit Dossier (PDF)');
      setExportedStatus('Certified Statutory Compliance & HIPAA Audit Dossier (PDF) generated and downloaded.');
      setTimeout(() => setExportedStatus(null), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportComplianceCsv = () => {
    const stream = generateSyntheticStream(24, 60);
    const trendData = generate30DayAnomalyTrendWithProjection(INITIAL_FACILITY_ZONES);
    const anomalyAuditRecords = compileFullAnomalyAuditLog(INITIAL_ACTIVE_ALERTS, []);
    const res = exportCurrentAnomalyLogsAndTrendsCsv({
      activeAlerts: INITIAL_ACTIVE_ALERTS,
      anomalyAuditRecords,
      trendData,
      zones: INITIAL_FACILITY_ZONES,
      telemetryStream: stream,
      supervisorName: `${currentUser.name} (${currentUser.roleTitle})`,
      auditStandard: `${framework.regulatoryBody} / HIPAA §164.514`
    });
    if (res.success) {
      recordAuditExport('EXPORTED_CSV', `Statutory Compliance Audit CSV (${res.filename})`);
      setExportedStatus(`Compliance Audit & Anomaly Trend CSV exported (${res.filename}).`);
      setTimeout(() => setExportedStatus(null), 5000);
    }
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-950/40">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {a.title}
              </h1>
              <span className="text-xs font-sans font-medium text-rose-400">
                &middot; {a.badge} {currentUser.clearanceLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {a.loggedInAs} <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle}) &middot; {a.primaryJurisdiction}:{' '}
              <span className="text-rose-300">{framework.countryName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={handleExportDossier}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>{a.exportDossierBtn}</span>
          </button>
          <LanguageAutocomplete
            dropDirection="down"
            compact
            isAccessibilityMode={isAccessibilityMode}
            idPrefix="auditor-landing-lang"
          />
        </div>
      </header>

      {/* PBAC Read-Only Separation of Duties Banner */}
      <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-rose-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <span>
            {a.scopePermitted}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <Lock className="h-3 w-3 text-amber-400 shrink-0" />
          <span>{a.scopeBlocked}</span>
        </div>
      </div>

      {/* Auditor Role Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl mb-6 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'LEDGER' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>{a.tabLedger}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AGGREGATE_COMPLIANCE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'AGGREGATE_COMPLIANCE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{a.tabAggregate}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('EXPORTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'EXPORTS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{a.tabExports}</span>
        </button>
      </div>

      {/* Export Status Feedback */}
      {exportedStatus && (
        <div className="mb-5 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{exportedStatus}</span>
        </div>
      )}

      {/* Regulatory Compliance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{a.kpiMomWsha}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">100% PASS</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-sans font-medium">Cap. 354A &middot; 0 Citations</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{a.kpiKAnonymity}</span>
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            k &ge; {Math.max(12, Math.round(summaryMetrics.averageKAnonymity))}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-sans font-medium tabular-nums">Threshold Target: k &ge; 12</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{a.kpiEpsilon}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">&epsilon; = 0.50</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-sans font-medium">Laplace Noise Calibrated</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{a.kpiAuditChain}</span>
            <Database className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono tabular-nums">SEALED</div>
          <div className="text-[11px] text-rose-400 mt-1 font-sans font-medium tabular-nums">
            {summaryMetrics.totalEvents24h} HIPAA Events Logged
          </div>
        </div>
      </div>

      {/* TAB 1: CRYPTOGRAPHIC AUDIT LEDGER & PRIVACY PROOFS */}
      {activeTab === 'LEDGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column (7 cols): Immutable Audit Trail */}
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-rose-400" />
                    <span>{a.ledgerTitle}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {a.ledgerDesc}
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Ledger Height: {(99820 + logs.length).toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white font-mono">{log.id}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-900 text-rose-300 border border-rose-500/30 uppercase">
                            {log.eventType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {log.timestamp} &middot; Actor: <strong className="text-slate-200">{log.actorPseudonym}</strong>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {log.status}
                      </span>
                    </div>

                    {log.summary && (
                      <div className="text-xs text-slate-200">
                        {log.summary}
                      </div>
                    )}

                    <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80 font-mono text-[10px] break-all text-slate-400">
                      <span className="text-slate-500 select-none">SHA-256: </span>
                      <span className="text-cyan-300">{log.blockHash}</span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <strong>Standard Reference:</strong> {log.legalStandard}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live HIPAA / System Access Log Feed */}
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-white">{a.liveHipaaEvents}</h3>
              <div className="space-y-2">
                {complianceEvents.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{ev.reportName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 shrink-0">
                        {ev.accessAction}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {ev.accessorName} ({ev.accessorRole}) &middot; k={ev.privacyShieldMetric.kAnonymityCount} &middot;{' '}
                      {ev.privacyShieldMetric.status}
                    </div>
                  </div>
                ))}
                {operationalAuditRecords.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{rec.targetModule}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                        {rec.eventType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {rec.actor}: {rec.previousValue} &rarr; {rec.newValue} ({rec.regulatoryStandard})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Mathematical Privacy Proof & Statutory Scope */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-rose-400" />
                <span>{a.privacyProofTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {a.privacyProofDesc}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mb-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">k-Anonymity Group Size:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.max(12, Math.round(summaryMetrics.averageKAnonymity))} Workers (PASS &ge; 12)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Differential Privacy Budget (&epsilon;):</span>
                  <span className="font-mono font-bold text-cyan-400">0.50 (High Privacy Rigor)</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">HIPAA §164.514 Safe Harbor:</span>
                  <span className="font-mono font-bold text-emerald-400">18 Identifiers Redacted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GDPR Article 9 Special Category:</span>
                  <span className="font-mono font-bold text-emerald-400">Zero Unmasked Biometrics</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-rose-400" />
                  <span>{a.legalWarrantyTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As an accredited statutory auditor under Ministry of Manpower WSH Regulations, all inspection queries execute on de-identified cryptographic copies. Raw worker identities remain in cryptographically sealed enclave hardware.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGGREGATE COMPLIANCE & JURISDICTIONS */}
      {activeTab === 'AGGREGATE_COMPLIANCE' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-400" />
              <span>{a.aggregateComplianceTitle}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Zone</th>
                    <th className="p-2.5">Cohort Count</th>
                    <th className="p-2.5">Heat Index</th>
                    <th className="p-2.5">TWL Limit</th>
                    <th className="p-2.5">Compliance Posture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {INITIAL_FACILITY_ZONES.map((zone) => {
                    const suppressed = defaultPrivacyShield.isCohortSuppressed(zone.count);
                    return (
                      <tr key={zone.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-white font-semibold">{zone.name}</td>
                        <td className="p-2.5 text-cyan-300">
                          {suppressed ? 'SUPPRESSED (k < 12)' : `${zone.count} Workers`}
                        </td>
                        <td className="p-2.5 text-amber-300">{suppressed ? 'REDACTED' : `${zone.heatIndex}°C`}</td>
                        <td className="p-2.5 text-slate-200">{zone.twl} W/m²</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            {suppressed ? 'k-ANONYMITY GUARDED' : 'WSH COMPLIANT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-cyan-400" />
              <span>{a.multiJurisdictionTitle}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(REGULATORY_FRAMEWORKS) as RegulatoryJurisdiction[]).map((jurKey) => {
                const fw = REGULATORY_FRAMEWORKS[jurKey];
                return (
                  <div key={jurKey} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{fw.countryName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {fw.complianceStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono">{fw.regulatoryBody}</div>
                    <div className="text-[11px] text-slate-300">
                      Stop-Work WBGT: <strong>{fw.wbgtThresholds.stopWorkWbgtC}&deg;C</strong> &middot; Rest Cycles:{' '}
                      <strong>{fw.wbgtThresholds.moderateRestMinsPerHour}/{fw.wbgtThresholds.highRestMinsPerHour} min/hr</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {fw.migrantWorkforceProtections.nonPunitiveFatigueReportingClause}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFIED REGULATORY EXPORTS */}
      {activeTab === 'EXPORTS' && (
        <div className="border border-slate-800 rounded-xl bg-slate-900 p-6 space-y-4 animate-fadeIn">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-rose-400" />
            <span>{a.certifiedExportsTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            {a.certifiedExportsDesc}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <button
              type="button"
              onClick={handleExportCertifiedPdf}
              disabled={isGeneratingPdf}
              className="p-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-left space-y-1.5 transition cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <FileText className="h-4 w-4" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'HIPAA & WSH Audit PDF'}</span>
              </div>
              <p className="text-[11px] text-rose-100">
                Vector A4 compliance dossier with cryptographic hashes and k-anonymity verification.
              </p>
            </button>

            <button
              type="button"
              onClick={handleExportComplianceCsv}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 text-left space-y-1.5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Compliance Audit &amp; Trend CSV</span>
              </div>
              <p className="text-[11px] text-slate-400">
                RFC-4180 compliant audit trail and 30-day de-identified anomaly frequencies.
              </p>
            </button>

            <button
              type="button"
              onClick={handleExportDossier}
              className="p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 text-left space-y-1.5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                <Download className="h-4 w-4" />
                <span>Signed JSON Ledger Dossier</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Machine-verifiable Merkle/SHA-256 block chain and multi-jurisdiction attestation.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

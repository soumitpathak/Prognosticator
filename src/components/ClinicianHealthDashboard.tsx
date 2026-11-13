import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Heart,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  Thermometer,
  Send,
  FileText,
  Sparkles,
  Lock,
  BarChart3,
  Sliders,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';
import { UserPersona } from '../types';
import { REGULATORY_FRAMEWORKS } from '../services/authService';
import { INITIAL_FACILITY_ZONES, INITIAL_ACTIVE_ALERTS, generateSyntheticStream } from '../services/telemetryStream';
import {
  calculateWhatIfImpact,
  WHAT_IF_PRESETS,
  WhatIfParameters,
  DEFAULT_WHAT_IF_PARAMETERS
} from '../services/whatIfSimulationEngine';
import { systemComplianceService } from '../services/systemComplianceService';
import { complianceAuditService } from '../services/complianceAuditService';
import { generateHealthMetricsPdfReport } from '../services/healthMetricsPdfGenerator';
import { exportWorkforceHealthCsv } from '../services/workforceCsvExport';
import { DEFAULT_HEALTH_THRESHOLDS } from './HealthThresholdsConfigModal';
import { defaultPrivacyShield } from '../services/privacyShield';
import { useTranslation } from '../services/i18nService';
import {
  crossRoleOperationsService,
  useCrossRoleOperations,
  ClinicalTriageRecord
} from '../services/crossRoleOperationsService';
import LanguageAutocomplete from './LanguageAutocomplete';

interface ClinicianHealthDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

type ClinicianTab = 'TRIAGE' | 'ANALYTICS' | 'SIMULATOR' | 'AUDIT_REPORTS';

export default function ClinicianHealthDashboard({
  currentUser,
  isAccessibilityMode = false
}: ClinicianHealthDashboardProps) {
  const { t } = useTranslation();
  const c = t.clinician;
  const ops = useCrossRoleOperations();
  const triageQueue = ops.triageQueue;
  const [activeTab, setActiveTab] = useState<ClinicianTab>('TRIAGE');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'OBSERVE'>('ALL');
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // What-If Clinical Heat Strain Simulation State
  const [simParams, setSimParams] = useState<WhatIfParameters>({
    ...DEFAULT_WHAT_IF_PARAMETERS,
    isSimulationActive: true
  });

  const framework = REGULATORY_FRAMEWORKS[currentUser.jurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;
  const telemetryStream = useMemo(() => generateSyntheticStream(24, 60), []);
  const simImpact = useMemo(() => calculateWhatIfImpact(simParams), [simParams]);
  const clinicalAuditEvents = useMemo(() => systemComplianceService.getEvents().slice(0, 8), [dispatchFeedback, ops.ledgerBlocks.length]);

  const filteredQueue = useMemo(() => {
    if (priorityFilter === 'ALL') return triageQueue;
    return triageQueue.filter((item) => item.triagePriority === priorityFilter);
  }, [triageQueue, priorityFilter]);

  const handleDispatchRehydration = (record: ClinicalTriageRecord) => {
    crossRoleOperationsService.dispatchClinicalRehydration({
      recordId: record.id,
      actorName: currentUser.name,
      actorRole: currentUser.roleTitle,
      regulatoryStandard: `${framework.regulatoryBody.split(' ')[0]} & HIPAA §164.514`
    });
    setDispatchFeedback(`Medical liaison and oral electrolyte protocol dispatched for [${record.workerPseudonym}] (${record.id}). Worker terminal & Audit ledger updated.`);
    setTimeout(() => setDispatchFeedback(null), 5000);
  };

  const handleMarkEvaluated = (record: ClinicalTriageRecord) => {
    crossRoleOperationsService.evaluateClinicalRecord(record.id, currentUser.name);
    setDispatchFeedback(`Clinical evaluation completed and cleared for [${record.workerPseudonym}].`);
    setTimeout(() => setDispatchFeedback(null), 4000);
  };

  const handleExportClinicalPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generateHealthMetricsPdfReport({
        zone: INITIAL_FACILITY_ZONES[0],
        telemetryStream,
        activeAlerts: INITIAL_ACTIVE_ALERTS,
        thresholds: DEFAULT_HEALTH_THRESHOLDS,
        userName: `${currentUser.name} (${currentUser.roleTitle})`
      });
      systemComplianceService.logEvent({
        accessorId: currentUser.id,
        accessorName: currentUser.name,
        accessorRole: currentUser.roleTitle,
        department: currentUser.department,
        reportName: `Clinical Health Metrics Audit (${result.filename})`,
        reportType: 'WORKER_HEALTH_PHI',
        accessAction: 'EXPORTED_PDF',
        hipaaClassification: 'HIPAA §164.514 Safe Harbor De-Identified Clinical Report',
        privacyShieldMetric: {
          epsilonConsumed: 0.1,
          kAnonymityCount: 14,
          laplaceNoiseBudgetRemaining: 2.5,
          status: 'COMPLIANT_AUTHORIZED'
        },
        dataSubjectCount: 14,
        justification: 'Clinical physician physiological strain assessment export.',
        ipAddress: '10.240.12.84',
        terminalId: 'CLINIC-WS-01'
      });
      setDispatchFeedback(`Certified Clinical Health Metrics PDF exported (${result.filename}).`);
      setTimeout(() => setDispatchFeedback(null), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportClinicalCsv = () => {
    const res = exportWorkforceHealthCsv(telemetryStream, INITIAL_FACILITY_ZONES[0].name, DEFAULT_HEALTH_THRESHOLDS);
    if (res.success) {
      setDispatchFeedback(`De-identified Cohort Clinical CSV exported (${res.filename}, ${res.recordCount} intervals).`);
      setTimeout(() => setDispatchFeedback(null), 5000);
    }
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Clinician Command Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950/40">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {c.title}
              </h1>
              <span className="text-xs font-sans font-medium text-emerald-400">
                &middot; {c.badge} ({currentUser.clearanceLevel})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {c.loggedInAs} <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle}) &middot; {c.jurisdiction}:{' '}
              <span className="text-emerald-300">{framework.countryName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{c.hipaaGuarded}</span>
            <span className="text-slate-600" aria-hidden="true">&middot;</span>
            <span className="text-emerald-300 font-semibold">{c.zeroDisciplinary}</span>
          </div>
          <LanguageAutocomplete
            dropDirection="down"
            compact
            isAccessibilityMode={isAccessibilityMode}
            idPrefix="clinician-landing-lang"
          />
        </div>
      </header>

      {/* PBAC Scope Banner */}
      <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            {c.scopePermitted}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <Lock className="h-3 w-3 text-amber-400 shrink-0" />
          <span>{c.scopeBlocked}</span>
        </div>
      </div>

      {/* Role-Specific Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl mb-6 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('TRIAGE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'TRIAGE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{c.tabTriage}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'ANALYTICS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{c.tabAnalytics}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SIMULATOR')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'SIMULATOR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>{c.tabSimulator}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_REPORTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'AUDIT_REPORTS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>{c.tabAuditReports}</span>
        </button>
      </div>

      {/* Notice Banner */}
      {dispatchFeedback && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{dispatchFeedback}</span>
        </div>
      )}

      {/* Clinical KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{c.kpiHrv}</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">34.2 ms</div>
          <div className="text-[11px] text-rose-400 mt-1 font-sans font-medium tabular-nums">-43.0% Autonomic Suppression</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{c.kpiSkinTemp}</span>
            <Thermometer className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">38.12&deg;C</div>
          <div className="text-[11px] text-rose-400 mt-1 font-sans font-medium tabular-nums">+1.62&deg;C Core Heat Elevation</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{c.kpiMeanHr}</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono tabular-nums">124 BPM</div>
          <div className="text-[11px] text-amber-400 mt-1 font-sans font-medium tabular-nums">Tachycardic Cutoff: 115 BPM</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{c.kpiRehydration}</span>
            <Droplets className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            {triageQueue.filter((q) => q.status === 'PENDING').length} Urgent / 18 Cohort
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-sans font-medium">Stage-2 Electrolyte Protocol</div>
        </div>
      </div>

      {/* TAB 1: CLINICAL TRIAGE & MEDICAL DISPATCH */}
      {activeTab === 'TRIAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column (7 cols): Active Clinical Triage Queue */}
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>{c.triageQueueTitle}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {c.triageQueueDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {(['ALL', 'URGENT', 'HIGH', 'OBSERVE'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriorityFilter(tier)}
                      className={`px-2 py-1 rounded border transition cursor-pointer ${
                        priorityFilter === tier
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition ${
                      item.triagePriority === 'URGENT'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : item.triagePriority === 'HIGH'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white font-mono">{item.workerPseudonym}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              item.triagePriority === 'URGENT'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                : item.triagePriority === 'HIGH'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {item.triagePriority} PRIORITY
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{item.zone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.department}</div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          item.status === 'DISPATCHED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : item.status === 'EVALUATED'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono my-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Heart Rate</span>
                        <span className="font-bold text-white">{item.heartRate} BPM</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">HRV Autonomic</span>
                        <span className="font-bold text-rose-400">{item.hrv} ms</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Skin Temp</span>
                        <span className="font-bold text-amber-300">{item.skinTemp}&deg;C</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Dehydration Index</span>
                        <span className="font-bold text-cyan-300">{item.dehydrationIndex} / 100</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                      <strong>Clinical Action:</strong> {item.recommendedAction}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                      {item.status !== 'EVALUATED' && (
                        <button
                          type="button"
                          onClick={() => handleMarkEvaluated(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
                        >
                          {c.markEvaluated}
                        </button>
                      )}
                      {item.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleDispatchRehydration(item)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Send className="h-3 w-3" />
                          <span>{c.dispatchLiaison}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Autonomic Correlation & Physician Boundary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>{c.ansCorrelationTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {c.ansCorrelationDesc}
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                <div className="h-32 w-full flex items-end gap-2 pt-2 px-1">
                  {[
                    { hrv: '58ms', hr: 78 },
                    { hrv: '52ms', hr: 88 },
                    { hrv: '46ms', hr: 98 },
                    { hrv: '39ms', hr: 112 },
                    { hrv: '34ms', hr: 124 },
                    { hrv: '31ms', hr: 138 }
                  ].map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[9px] font-mono text-cyan-300 mb-1">{point.hrv}</span>
                      <div
                        style={{ height: `${(point.hr / 140) * 100}%` }}
                        className={`w-full rounded-t ${
                          point.hr > 120 ? 'bg-rose-500' : point.hr > 100 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-500 mt-1">{point.hr}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
                  <span>Healthy Baseline (Left)</span>
                  <span className="text-rose-400">Extreme Strain (Right)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>{c.ethicalBoundaryTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {c.ethicalBoundaryDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGGREGATE COHORT ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <span>{c.cohortAnalyticsTitle}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {c.cohortAnalyticsDesc}
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                k-Anonymity Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_FACILITY_ZONES.map((zone) => {
                const suppressed = defaultPrivacyShield.isCohortSuppressed(zone.count);
                return (
                  <div key={zone.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{zone.name}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          zone.status === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : zone.status === 'MODERATE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Cohort Size</span>
                        <span className="font-bold text-cyan-300">{suppressed ? 'MASKED (<12)' : `${zone.count} Workers`}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Heat Index</span>
                        <span className="font-bold text-amber-300">{zone.heatIndex}&deg;C</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">TWL Limit</span>
                        <span className="font-bold text-white">{zone.twl} W/m²</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{zone.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 24h Cohort Physiological Stream Summary */}
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3">24-Hour Cohort Physiological Telemetry (Kalman-Smoothed)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Interval</th>
                    <th className="p-2.5">Mean HRV</th>
                    <th className="p-2.5">Skin Temp</th>
                    <th className="p-2.5">Ambient Heat</th>
                    <th className="p-2.5">TWL Index</th>
                    <th className="p-2.5">Cohort Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {telemetryStream.slice(-8).map((pt, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-300">{pt.timeLabel}</td>
                      <td className="p-2.5 text-cyan-300">{pt.smoothed_hrv.toFixed(1)} ms</td>
                      <td className="p-2.5 text-amber-300">{pt.smoothed_skin_temp.toFixed(2)}&deg;C</td>
                      <td className="p-2.5 text-slate-200">{pt.ambient_temp_c.toFixed(1)}&deg;C</td>
                      <td className="p-2.5 text-slate-200">{pt.twl_index.toFixed(0)} W/m²</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pt.risk_score >= 70
                              ? 'bg-rose-950 text-rose-300'
                              : pt.risk_score >= 45
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {pt.risk_score.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINICAL WHAT-IF SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>{c.simulatorTitle}</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {WHAT_IF_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSimParams({ ...preset.params, isSimulationActive: true })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Ambient Heat (&deg;C)</span>
                  <span className="font-mono text-amber-300">{simParams.ambientHeatC.toFixed(1)}&deg;C</span>
                </label>
                <input
                  type="range"
                  min={22}
                  max={48}
                  step={0.5}
                  value={simParams.ambientHeatC}
                  onChange={(e) => setSimParams((p) => ({ ...p, ambientHeatC: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Relative Humidity (%)</span>
                  <span className="font-mono text-cyan-300">{simParams.seasonalHumidityPct}%</span>
                </label>
                <input
                  type="range"
                  min={25}
                  max={95}
                  step={1}
                  value={simParams.seasonalHumidityPct}
                  onChange={(e) => setSimParams((p) => ({ ...p, seasonalHumidityPct: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Rest &amp; Hydration Interval (mins/hr)</span>
                  <span className="font-mono text-emerald-300">{simParams.restHydrationFrequencyMin} min/h</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={simParams.restHydrationFrequencyMin}
                  onChange={(e) => setSimParams((p) => ({ ...p, restHydrationFrequencyMin: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Cooling PPE Mitigation (%)</span>
                  <span className="font-mono text-emerald-300">{simParams.ppeCoolingMitigationPct}%</span>
                </label>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={2}
                  value={simParams.ppeCoolingMitigationPct}
                  onChange={(e) => setSimParams((p) => ({ ...p, ppeCoolingMitigationPct: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">{c.projectedOutcomeTitle}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Effective Heat Index</span>
                <span className="text-lg font-bold text-amber-300">{simImpact.heatIndexC.toFixed(1)}&deg;C</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cohort Risk Delta</span>
                <span className={`text-lg font-bold ${simImpact.netRiskDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simImpact.netRiskDelta > 0 ? '+' : ''}
                  {simImpact.netRiskDelta.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Evaporative Cooling</span>
                <span className="text-lg font-bold text-cyan-300">{simImpact.evaporativeEfficiencyPct.toFixed(0)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Projected Risk Tier</span>
                <span className="text-sm font-bold text-white">{simImpact.riskTier}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL AUDIT LOG & CERTIFIED REPORTS */}
      {activeTab === 'AUDIT_REPORTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              <span>{c.auditTrailTitle}</span>
            </h2>
            <div className="space-y-2.5">
              {clinicalAuditEvents.map((ev) => (
                <div key={ev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{ev.reportName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {ev.accessAction}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Actor: <strong className="text-slate-200">{ev.accessorName}</strong> ({ev.accessorRole}) &middot; k={ev.privacyShieldMetric.kAnonymityCount}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">Hash: {ev.cryptographicHash}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>{c.certifiedExportsTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate de-identified occupational health assessments certified under {framework.regulatoryBody} and HIPAA §164.514 Safe Harbor.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportClinicalPdf}
                disabled={isGeneratingPdf}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>{isGeneratingPdf ? 'Generating Clinical PDF...' : c.exportPdfBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleExportClinicalCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{c.exportCsvBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

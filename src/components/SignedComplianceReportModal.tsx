import React, { useState } from 'react';
import { AnomalyAuditRecord } from '../types';
import { nlpAnomalyInsightsService, NlpSynthesisReport } from '../services/nlpAnomalyInsightsService';
import {
  generateSignedQuarterlyCompliancePdf,
  SigningOfficerInfo
} from '../services/signedQuarterlyCompliancePdfGenerator';
import {
  FileText,
  X,
  CheckCircle2,
  ShieldCheck,
  Download,
  Calendar,
  Lock,
  UserCheck,
  Brain,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

interface SignedComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditRecords: AnomalyAuditRecord[];
  nlpReport?: NlpSynthesisReport;
}

export default function SignedComplianceReportModal({
  isOpen,
  onClose,
  auditRecords,
  nlpReport: propNlpReport
}: SignedComplianceReportModalProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q4 2026 (Oct 01 - Dec 31, 2026)');
  const [officerName, setOfficerName] = useState<string>('Dr. Marcus Vance, MD, CSP, CIH');
  const [officerTitle, setOfficerTitle] = useState<string>('Chief Environmental Health & Safety (EHS) Director');
  const [certification, setCertification] = useState<string>('Board Certified Industrial Hygienist (ABIH #9482) & CSP');
  const [badgeNumber, setBadgeNumber] = useState<string>('EHS-DIR-00194');
  const [isAttested, setIsAttested] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);

  // Fallback or active NLP report
  const nlpReport = propNlpReport || nlpAnomalyInsightsService.generate24hInsights(auditRecords, [], 24);

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    if (!isAttested) return;
    setIsGenerating(true);
    setGenerationProgress('Preparing statutory audit datasets...');

    try {
      const officerInfo: SigningOfficerInfo = {
        name: officerName,
        title: officerTitle,
        certification,
        badgeNumber
      };

      await generateSignedQuarterlyCompliancePdf({
        auditRecords,
        nlpReport,
        quarterLabel: selectedQuarter,
        officerInfo,
        onProgress: (msg) => setGenerationProgress(msg)
      });

      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(null);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to generate compliance PDF:', err);
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const criticalCount = auditRecords.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = auditRecords.filter((a) => a.severity === 'HIGH').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
                  <span>Compile Signed Quarterly Compliance Report</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  PDF / Vector Dossier
                </span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                  OSHA 1910 &amp; HIPAA § 164.312(b)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Compiles the Security Audit Log and recent NLP Anomaly Insights into a signed, tamper-evident regulatory dossier.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs font-mono">
          {/* Quarter Reporting Scope */}
          <div>
            <label className="text-slate-300 font-bold block mb-1.5 uppercase text-[11px] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>1. Select Statutory Reporting Quarter</span>
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Q4 2026 (Oct 01 - Dec 31, 2026)">Q4 2026 (Oct 01 - Dec 31, 2026) — Active Shift Filing</option>
              <option value="Q3 2026 (Jul 01 - Sep 30, 2026)">Q3 2026 (Jul 01 - Sep 30, 2026) — Historical Archive</option>
              <option value="Q2 2026 (Apr 01 - Jun 30, 2026)">Q2 2026 (Apr 01 - Jun 30, 2026) — Historical Archive</option>
              <option value="Q1 2026 (Jan 01 - Mar 31, 2026)">Q1 2026 (Jan 01 - Mar 31, 2026) — Historical Archive</option>
            </select>
          </div>

          {/* Dossier Compilation Preview Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 block flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Compiled Audit Content Overview</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Security Log Events</span>
                <span className="text-white font-bold tabular-nums text-sm">{auditRecords.length} Records</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-rose-500/30">
                <span className="text-rose-400 block text-[10px]">Critical / High</span>
                <span className="text-rose-300 font-bold tabular-nums text-sm">{criticalCount + highCount} Events</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Top Anomaly Type</span>
                <span className="text-cyan-400 font-bold text-xs truncate block">
                  {nlpReport.topAnomalyTypes[0]?.name || 'Thermal Strain'}
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-emerald-500/30">
                <span className="text-emerald-400 block text-[10px]">Privacy Standard</span>
                <span className="text-emerald-300 font-bold text-xs">k-Anon (N &gt;= 12)</span>
              </div>
            </div>

            {/* NLP Root-Cause Summary Preview Excerpt */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <Brain className="h-3.5 w-3.5 text-amber-400" />
                <span>NLP Root-Cause Diagnostic Excerpt:</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                {nlpReport.executiveDiagnosticNarrative.slice(0, 240)}...
              </p>
            </div>
          </div>

          {/* Certifying Officer Credentials Form */}
          <div className="space-y-3">
            <span className="text-slate-300 font-bold block uppercase text-[11px] flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>2. Certifying Officer Credentials &amp; Electronic Seal</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Officer Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Official Title</label>
                <input
                  type="text"
                  value={officerTitle}
                  onChange={(e) => setOfficerTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Board Certification / License</label>
                <input
                  type="text"
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">EHS Officer Badge ID</label>
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Statutory Attestation Checkbox */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-start space-x-3">
            <input
              type="checkbox"
              id="compliance-attest-chk"
              checked={isAttested}
              onChange={(e) => setIsAttested(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="compliance-attest-chk" className="cursor-pointer text-slate-300 font-sans text-xs leading-relaxed">
              <strong className="text-emerald-300 block font-mono text-[11px] mb-0.5">
                Official Regulatory Declaration &amp; Electronic Signature Agreement
              </strong>
              I attest under official administrative responsibility that this Quarterly Compliance Dossier reflects an authentic, un-tampered compilation of statutory security audit records and NLP diagnostic findings under OSHA 1910.1020, HIPAA §164.312(b), and ISO 45001 standards.
            </label>
          </div>

          {/* Progress Banner */}
          {generationProgress && (
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-lg text-cyan-200 text-xs flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>{generationProgress}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-400 text-[11px]">
            Format: Landscape A4 Vector PDF &bull; Cryptographic Merkle Root Seal
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleGeneratePdf}
              disabled={!isAttested || isGenerating}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? 'Generating Signed PDF...' : 'Generate & Download Signed PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

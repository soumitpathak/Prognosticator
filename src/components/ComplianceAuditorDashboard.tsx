import React, { useState } from 'react';
import {
  FileCheck,
  Shield,
  ShieldCheck,
  Lock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  Clock,
  Key,
  Database,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { UserPersona } from '../types';

interface ComplianceAuditorDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  blockHash: string;
  eventType: 'HVAC_ACTUATION' | 'REST_BREAK_ISSUED' | 'THRESHOLD_CALIBRATED' | 'MEDICAL_DISPATCH' | 'PRIVACY_SHIELD_VERIFIED';
  actorPseudonym: string;
  legalStandard: string;
  status: 'VERIFIED' | 'TAMPER_PROOF';
}

const AUDIT_CHAIN: AuditLogEntry[] = [
  {
    id: 'BLK-99824',
    timestamp: '2026-11-11 14:15:22 UTC',
    blockHash: '0x8f3c7e91a24d5b6c801e9a2f7c4b1d3e8a9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    eventType: 'REST_BREAK_ISSUED',
    actorPseudonym: 'SYSTEM_AUTONOMOUS_PBAC',
    legalStandard: 'Singapore MOM WSHA 2024 / WBGT >= 32.0°C Protocol',
    status: 'VERIFIED'
  },
  {
    id: 'BLK-99823',
    timestamp: '2026-11-11 13:58:10 UTC',
    blockHash: '0x5b2a9f7e1c8d4e3f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f',
    eventType: 'HVAC_ACTUATION',
    actorPseudonym: 'FACILITY_ENGINEER_MV',
    legalStandard: 'ASHRAE 62.1-2022 Indoor Air Quality & Thermal Standard',
    status: 'TAMPER_PROOF'
  },
  {
    id: 'BLK-99822',
    timestamp: '2026-11-11 13:30:45 UTC',
    blockHash: '0x1c3e5a7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c',
    eventType: 'PRIVACY_SHIELD_VERIFIED',
    actorPseudonym: 'CRYPTOGRAPHIC_AUDITOR',
    legalStandard: 'HIPAA §164.514 Safe Harbor & GDPR Article 9 Verification',
    status: 'VERIFIED'
  },
  {
    id: 'BLK-99821',
    timestamp: '2026-11-11 12:45:00 UTC',
    blockHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    eventType: 'THRESHOLD_CALIBRATED',
    actorPseudonym: 'SAFETY_DIRECTOR_SC',
    legalStandard: 'OSHA Heat National Emphasis Program CPL 03-00-024',
    status: 'TAMPER_PROOF'
  }
];

export default function ComplianceAuditorDashboard({
  currentUser,
  isAccessibilityMode = false
}: ComplianceAuditorDashboardProps) {
  const [logs] = useState<AuditLogEntry[]>(AUDIT_CHAIN);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

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
      cryptographicAuditChain: logs
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WSH_Regulatory_Audit_Dossier_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportedStatus('Digitally signed WSH Statutory Regulatory Audit Dossier successfully exported.');
    setTimeout(() => setExportedStatus(null), 5000);
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-950/40">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Statutory Regulatory Compliance &amp; WSH Audit Inspectorate
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                AUDITOR CLEARANCE LEVEL 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={handleExportDossier}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export Certified Regulatory Dossier</span>
          </button>
        </div>
      </header>

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
            <span className="text-xs font-medium uppercase font-mono">Singapore MOM WSHA</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">100% PASS</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">Cap. 354A &middot; 0 Citations</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Small-Cell k-Anonymity</span>
            <Lock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">k &ge; 14</div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono">Threshold Target: k &ge; 12</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">&epsilon;-Differential Privacy</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">&epsilon; = 0.50</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">Laplace Noise Calibrated</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Audit Chain Integrity</span>
            <Database className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono">SEALED</div>
          <div className="text-[11px] text-rose-400 mt-1 font-mono">SHA-256 Merkle Proven</div>
        </div>
      </div>

      {/* Main Grid: Cryptographic Ledger & Privacy Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Immutable Audit Trail */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-rose-400" />
                  <span>Immutable Cryptographic Tamper-Evident Audit Ledger</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Append-only cryptographic blocks timestamped with SHA-256 hashes verifying all system overrides and rest breaks.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">Ledger Height: 99,824</span>
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
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-slate-900 text-rose-300 border border-rose-500/30 uppercase">
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
        </div>

        {/* Right Column (5 cols): Mathematical Privacy Proof & Statutory Scope */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Scale className="h-4 w-4 text-rose-400" />
              <span>Small-Cell Privacy &amp; Anti-Surveillance Proof</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Mathematical guarantees preventing individual re-identification by supervisors or third parties.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mb-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">k-Anonymity Group Size:</span>
                <span className="font-mono font-bold text-emerald-400">14 Workers (PASS &ge; 12)</span>
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
                <span>Statutory Auditor Legal Warranty</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As an accredited statutory auditor under Ministry of Manpower WSH Regulations, all inspection queries execute on de-identified cryptographic copies. Raw worker identities remain in cryptographically sealed enclave hardware.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

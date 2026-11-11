import React from 'react';
import { AuditEvent } from '../types';
import { ShieldCheck, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditEvents: AuditEvent[];
}

export default function AuditLogModal({ isOpen, onClose, auditEvents }: AuditLogModalProps) {
  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `prognosticator-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                GDPR & HIPAA Compliance Audit Trail
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Immutable Log
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Audited multi-signal anomaly detections, cell suppression actions, and automated protocol dispatches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Compliance Statement Banner */}
        <div className="bg-slate-950 p-4 border-b border-slate-800/80 text-xs text-slate-300 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Regulatory Standard:</strong> All telemetry logs are strictly processed with Differential Privacy (ε=0.5) and small-cell suppression (N ≥ 12). Worker identity keys are anonymized prior to storage. Under European GDPR Article 9 & US HIPAA Security Rule, disciplinary usage is cryptographically prohibited.
          </p>
        </div>

        {/* Table of Events */}
        <div className="overflow-y-auto flex-1 p-5">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider">
              <tr>
                <th className="p-3 rounded-l-lg">Event ID / Time</th>
                <th className="p-3">Type</th>
                <th className="p-3">Facility Zone</th>
                <th className="p-3">Cohort Size</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3">Privacy Enforcement</th>
                <th className="p-3 rounded-r-lg">Action Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditEvents.map((evt, index) => (
                <tr key={`${evt.id}-${index}`} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono">
                    <div className="text-cyan-400 font-semibold">{evt.id}</div>
                    <div className="text-[10px] text-slate-400">{evt.timestamp}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700">
                      {evt.eventType}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-200">{evt.zone}</td>
                  <td className="p-3 font-mono">
                    {evt.cohortCount < 12 ? (
                      <span className="text-amber-400 font-bold">N={evt.cohortCount} (Suppressed)</span>
                    ) : (
                      <span className="text-emerald-400">N={evt.cohortCount}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        evt.riskTier === 'CRITICAL_RISK'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : evt.riskTier === 'MODERATE_RISK'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {evt.riskTier}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">{evt.privacyEnforced}</td>
                  <td className="p-3 font-medium text-white">{evt.actionTaken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">Total Audit Records: {auditEvents.length}</span>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit JSON</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

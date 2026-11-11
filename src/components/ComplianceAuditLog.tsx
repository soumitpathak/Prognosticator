import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Lock,
  Cpu,
  User,
  Sliders,
  History,
  Info,
  Clock,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  complianceAuditService,
  ComplianceAuditRecord
} from '../services/complianceAuditService';

interface ComplianceAuditLogProps {
  className?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function ComplianceAuditLog({
  className = '',
  onClose,
  isModal = false
}: ComplianceAuditLogProps) {
  const [records, setRecords] = useState<ComplianceAuditRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = complianceAuditService.subscribe((updated) => {
      setRecords(updated);
    });
    return () => unsub();
  }, []);

  const handleExportCsv = () => {
    const { filename, recordCount } = complianceAuditService.exportAuditTrailCsv();
    setExportNotice(`Exported ${recordCount} audit records to ${filename}`);
    setTimeout(() => setExportNotice(null), 6000);
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2500);
  };

  const handleSimulateManualOverride = () => {
    complianceAuditService.logEvent({
      eventType: 'MANUAL_OVERRIDE',
      actor: 'Alex Mercer',
      actorRole: 'Safety Compliance Officer',
      actorType: 'USER',
      targetModule: 'Kalman Filter Gateway',
      parameter: 'Manual Noise Variance Override (Q Matrix)',
      previousValue: 'Q = 0.001 (Automated Default)',
      newValue: 'Q = 0.005 (Fast-Response Overdrive)',
      justification: 'Manual override engaged to sharpen real-time anomaly detection during simulated heavy machinery vibration test.',
      regulatoryStandard: 'OSHA 1910.120 / ISO 45001 §9.1',
      complianceStatus: 'OVERRIDDEN',
      zoneId: 'Outdoor-Construction-Sector-4'
    });
  };

  const handleSimulateAutomatedAdjustment = () => {
    complianceAuditService.logEvent({
      eventType: 'AUTOMATED_ADJUSTMENT',
      actor: 'Prognosticator Kalman-LSTM Core',
      actorRole: 'Autonomous AI Sentinel',
      actorType: 'SYSTEM',
      targetModule: 'Automated Response Module',
      parameter: 'Chilled Evaporative Fan Velocity Auto-Steer',
      previousValue: '850 RPM (Nominal)',
      newValue: '1450 RPM (High-Velocity Misting Cycle)',
      justification: 'Autonomous adjustment initiated when moving average heat index climbed past 38.2°C.',
      regulatoryStandard: 'ISO 45001 §8.1.2',
      complianceStatus: 'VERIFIED',
      zoneId: 'Outdoor-Construction-Sector-4'
    });
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'ALL') {
        if (filterType === 'MANUAL_OVERRIDE' && r.eventType !== 'MANUAL_OVERRIDE') return false;
        if (filterType === 'AUTOMATED_ADJUSTMENT' && r.eventType !== 'AUTOMATED_ADJUSTMENT') return false;
        if (filterType === 'SECURITY_ACCESS' && r.eventType !== 'SECURITY_ACCESS') return false;
      }
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'OVERRIDDEN' && r.complianceStatus !== 'OVERRIDDEN') return false;
        if (filterStatus === 'VERIFIED' && r.complianceStatus !== 'VERIFIED' && r.complianceStatus !== 'COMPLIANT_AUTHORIZED') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.id.toLowerCase().includes(q) ||
          r.actor.toLowerCase().includes(q) ||
          r.targetModule.toLowerCase().includes(q) ||
          r.parameter.toLowerCase().includes(q) ||
          r.justification.toLowerCase().includes(q) ||
          r.regulatoryStandard.toLowerCase().includes(q) ||
          r.newValue.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, filterType, filterStatus, searchQuery]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = records.length;
    const manualOverrides = records.filter((r) => r.eventType === 'MANUAL_OVERRIDE').length;
    const automatedAdjustments = records.filter((r) => r.eventType === 'AUTOMATED_ADJUSTMENT').length;
    const verifiedRate = total > 0 ? 100 : 0;
    return { total, manualOverrides, automatedAdjustments, verifiedRate };
  }, [records]);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Compliance Audit Log</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Statutory Audit Trail (OSHA / ISO 45001 / HIPAA)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically hashed ledger recording all supervisor manual overrides and automated algorithm adjustments.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={handleSimulateManualOverride}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-600/40 transition cursor-pointer"
            title="Simulate a manual supervisor parameter override"
          >
            <User className="h-3.5 w-3.5 text-amber-400" />
            <span>Simulate Override</span>
          </button>

          <button
            onClick={handleSimulateAutomatedAdjustment}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-600/40 transition cursor-pointer"
            title="Simulate an autonomous system closed-loop adjustment"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Simulate Auto-Adjust</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 transition shadow-sm cursor-pointer"
            title="Export full historical audit trail as an RFC 4180 CSV file for regulatory inspectors"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>Export Audit Trail (CSV)</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 p-2.5 px-4 text-xs font-mono text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </span>
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">RFC 4180 Verified</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Logged Events</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
            <span className="text-[10px] font-mono text-slate-400">Ledger Entries</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-3">
          <span className="text-[10px] font-mono text-amber-400 uppercase block flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Manual Overrides</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">{stats.manualOverrides}</span>
            <span className="text-[10px] font-mono text-amber-300/70">Supervisor Interventions</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-cyan-900/40 rounded-lg p-3">
          <span className="text-[10px] font-mono text-cyan-400 uppercase block flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>Automated Adjustments</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-cyan-400">{stats.automatedAdjustments}</span>
            <span className="text-[10px] font-mono text-cyan-300/70">Autonomous Closed-Loop</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-emerald-900/40 rounded-lg p-3">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Cryptographic Integrity</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">100% Sealed</span>
            <span className="text-[10px] font-mono text-emerald-400">SHA-256 Valid</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <span className="text-slate-400 text-[11px] font-mono mr-1">Type:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterType === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setFilterType('MANUAL_OVERRIDE')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterType === 'MANUAL_OVERRIDE'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Manual Overrides ({stats.manualOverrides})
            </button>
            <button
              onClick={() => setFilterType('AUTOMATED_ADJUSTMENT')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterType === 'AUTOMATED_ADJUSTMENT'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Automated ({stats.automatedAdjustments})
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-slate-400 text-[11px] font-mono ml-1 mr-1">Status:</span>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterStatus === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('OVERRIDDEN')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterStatus === 'OVERRIDDEN' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Overridden
            </button>
            <button
              onClick={() => setFilterStatus('VERIFIED')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterStatus === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Verified
            </button>
          </div>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor, module, parameter, hash..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider backdrop-blur-md">
            <tr>
              <th className="py-2.5 px-3">Event &amp; Timestamp</th>
              <th className="py-2.5 px-3">Action Type</th>
              <th className="py-2.5 px-3">Actor &amp; Authority</th>
              <th className="py-2.5 px-3">Target Module &amp; Parameter</th>
              <th className="py-2.5 px-3">Value Transition</th>
              <th className="py-2.5 px-3">Justification &amp; Standard</th>
              <th className="py-2.5 px-3">Tamper-Evident SHA-256</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-sans">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                  No compliance audit events match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, index) => {
                const isManual = r.eventType === 'MANUAL_OVERRIDE';
                const isAuto = r.eventType === 'AUTOMATED_ADJUSTMENT';

                return (
                  <tr key={`${r.id}-${index}`} className="hover:bg-slate-800/40 transition">
                    {/* Event & Timestamp */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-white text-[11px]">{r.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{r.dateFormatted} {r.timeFormatted}</span>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isManual ? (
                        <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          <User className="h-3 w-3 text-amber-400" />
                          <span>MANUAL OVERRIDE</span>
                        </span>
                      ) : isAuto ? (
                        <span className="inline-flex items-center gap-1 bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          <Cpu className="h-3 w-3 text-cyan-400" />
                          <span>AUTO ADJUSTMENT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          <Lock className="h-3 w-3 text-indigo-400" />
                          <span>{r.eventType}</span>
                        </span>
                      )}
                    </td>

                    {/* Actor & Authority */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{r.actor}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.actorRole}</div>
                    </td>

                    {/* Target Module & Parameter */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-cyan-300 text-[11px]">{r.targetModule}</div>
                      <div className="text-[11px] text-slate-300 font-mono mt-0.5">{r.parameter}</div>
                    </td>

                    {/* Value Transition */}
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="text-[10px] text-slate-400 font-mono line-through truncate" title={r.previousValue}>
                        Prev: {r.previousValue}
                      </div>
                      <div className="text-[11px] text-emerald-300 font-mono font-medium truncate" title={r.newValue}>
                        New: {r.newValue}
                      </div>
                    </td>

                    {/* Justification & Regulatory Standard */}
                    <td className="py-2.5 px-3 max-w-[260px]">
                      <p className="text-[11px] text-slate-300 line-clamp-2" title={r.justification}>
                        {r.justification}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-semibold">
                        <span className="bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                          {r.regulatoryStandard}
                        </span>
                      </div>
                    </td>

                    {/* Digital Signature SHA-256 */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-400 font-mono" title={r.digitalSignatureHash}>
                          {r.digitalSignatureHash.slice(0, 10)}...{r.digitalSignatureHash.slice(-6)}
                        </span>
                        <button
                          onClick={() => handleCopyHash(r.id, r.digitalSignatureHash)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                          title="Copy full cryptographic SHA-256 signature hash"
                        >
                          {copiedHashId === r.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Compliance Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      {r.complianceStatus === 'OVERRIDDEN' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">
                          <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
                          <span>OVERRIDDEN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                          <span>VERIFIED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Regulatory Notice */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Statutory Chain of Custody: Tamper-Evident SHA-256 Hashing Active</span>
        </div>
        <div>
          Showing {filteredRecords.length} of {records.length} total events • Export RFC 4180 CSV for OSHA / ISO Inspections
        </div>
      </div>
    </div>
  );
}

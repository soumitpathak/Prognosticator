import React, { useState, useMemo } from 'react';
import { AnomalyAuditRecord } from '../types';
import {
  FileText,
  ShieldCheck,
  Download,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  History,
  RotateCcw,
  Zap,
  Cpu,
  Truck,
  Wrench,
  Heart,
  Volume2,
  Thermometer
} from 'lucide-react';
import { exportAnomalyAuditCsv, exportAnomalyAuditJson } from '../services/anomalyAuditService';

interface AnomalyAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditRecords: AnomalyAuditRecord[];
}

export default function AnomalyAuditLogModal({
  isOpen,
  onClose,
  auditRecords
}: AnomalyAuditLogModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Extract unique departments
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    auditRecords.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set).sort();
  }, [auditRecords]);

  // Filtered and searched records
  const filteredRecords = useMemo(() => {
    return auditRecords.filter((record) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          record.id.toLowerCase().includes(q) ||
          record.anomalyId.toLowerCase().includes(q) ||
          record.anomalyMetric.toLowerCase().includes(q) ||
          record.correctiveActionTaken.toLowerCase().includes(q) ||
          record.zone.toLowerCase().includes(q) ||
          record.department.toLowerCase().includes(q) ||
          record.actionTakenBy.toLowerCase().includes(q) ||
          (record.workerId && record.workerId.toLowerCase().includes(q)) ||
          (record.equipmentId && record.equipmentId.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Severity
      if (severityFilter !== 'ALL') {
        if (severityFilter === 'CRITICAL' && record.severity !== 'CRITICAL') return false;
        if (severityFilter === 'MEDIUM' && record.severity !== 'HIGH' && record.severity !== 'MODERATE') return false;
        if (severityFilter === 'LOW' && record.severity !== 'LOW') return false;
        if (severityFilter === 'HIGH' && record.severity !== 'HIGH') return false;
        if (severityFilter === 'MODERATE' && record.severity !== 'MODERATE') return false;
      }

      // Department
      if (departmentFilter !== 'ALL' && record.department !== departmentFilter) {
        return false;
      }

      // Action Status
      if (statusFilter !== 'ALL' && record.actionStatus !== statusFilter) {
        return false;
      }

      // Min Confidence
      if (minConfidence > 0 && record.confidenceScore < minConfidence / 100) {
        return false;
      }

      return true;
    });
  }, [auditRecords, searchQuery, severityFilter, departmentFilter, statusFilter, minConfidence]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = auditRecords.length;
    if (total === 0) return { total: 0, avgConfidence: 0, completedActions: 0, criticalCount: 0 };

    const sumConf = auditRecords.reduce((acc, r) => acc + r.confidenceScore, 0);
    const avgConfidence = (sumConf / total) * 100;
    const completedActions = auditRecords.filter((r) => r.actionStatus === 'COMPLETED').length;
    const criticalCount = auditRecords.filter((r) => r.severity === 'CRITICAL').length;

    return {
      total,
      avgConfidence: Number(avgConfidence.toFixed(1)),
      completedActions,
      criticalCount
    };
  }, [auditRecords]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const res = exportAnomalyAuditCsv(filteredRecords);
    setExportNotice(`Exported ${res.recordCount} audit records to CSV (${res.filename})`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleExportJson = () => {
    const res = exportAnomalyAuditJson(filteredRecords);
    setExportNotice(`Exported audit log to JSON (${res.filename})`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setDepartmentFilter('ALL');
    setStatusFilter('ALL');
    setMinConfidence(0);
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    severityFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    minConfidence > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 md:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/80 gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/15 border border-cyan-500/40 p-2.5 rounded-xl text-cyan-400 shadow-xs">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Anomaly Audit Log
                </h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  GDPR &amp; HIPAA Immutable Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete forensic register listing the historical timestamp, model confidence score, and corrective action taken for every previously flagged anomaly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
              title="Download audit records as CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
              title="Download audit records as JSON"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition ml-1"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {exportNotice && (
          <div className="p-2.5 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between px-5">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-emerald-400 hover:text-white underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Flagged Anomalies</span>
            <div className="text-lg font-bold text-white mt-0.5">{stats.total} Flagged Records</div>
            <span className="text-[10px] text-slate-500">Across All Facility Sectors</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average Model Confidence</span>
            <div className="text-lg font-bold text-cyan-300 mt-0.5">{stats.avgConfidence}%</div>
            <span className="text-[10px] text-cyan-500/80">LSTM Autoencoder + Kalman</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Corrective Actions Executed</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {stats.completedActions} / {stats.total} Resolved
            </div>
            <span className="text-[10px] text-emerald-500/80">
              {stats.total > 0 ? Math.round((stats.completedActions / stats.total) * 100) : 0}% Protocol Closure
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Critical Anomalies Audited</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{stats.criticalCount} Critical Cases</div>
            <span className="text-[10px] text-rose-500/80">100% Rapid Cooling / LOTO</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by anomaly ID, metric, action, worker, or zone..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="MEDIUM">Medium (High/Moderate)</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">All Actions</option>
                <option value="COMPLETED">Action Completed</option>
                <option value="TRANSMITTED">Transmitted / En Route</option>
                <option value="DISPATCH_STAGED">Staged in Queue</option>
              </select>
            </div>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                title="Reset filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 sticky top-0 uppercase text-[10px] text-slate-400 tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Audit ID / Timestamp</th>
                <th className="p-3">Flagged Anomaly &amp; Zone</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Model Confidence</th>
                <th className="p-3">Corrective Action Taken</th>
                <th className="p-3">Action Status &amp; Sign-off</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => {
                  const isExpanded = expandedRecordId === record.id;
                  const isCritical = record.severity === 'CRITICAL';
                  const isHigh = record.severity === 'HIGH';

                  return (
                    <React.Fragment key={`${record.id}-${index}`}>
                      <tr
                        className={`hover:bg-slate-800/40 transition group cursor-pointer ${
                          isExpanded ? 'bg-slate-800/30' : ''
                        }`}
                        onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                      >
                        {/* Historical Timestamp & Audit ID */}
                        <td className="p-3 align-top font-mono">
                          <div className="text-cyan-400 font-bold text-xs">{record.id}</div>
                          <div className="text-[11px] text-white mt-0.5">{record.timeFormatted}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{record.relativeTime}</span>
                          </div>
                        </td>

                        {/* Flagged Anomaly & Zone */}
                        <td className="p-3 align-top">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{record.anomalyMetric}</span>
                          </div>
                          <div className="text-[11px] text-cyan-300 mt-0.5 flex items-center gap-1">
                            <span className="text-slate-500 font-mono text-[10px]">{record.anomalyId}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span>{record.zone}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{record.department}</div>
                        </td>

                        {/* Severity */}
                        <td className="p-3 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                                : isHigh
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                : record.severity === 'MODERATE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {record.severity}
                          </span>
                        </td>

                        {/* Model Confidence Score */}
                        <td className="p-3 align-top font-mono">
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full ${
                                  record.confidenceScore >= 0.90
                                    ? 'bg-rose-500'
                                    : record.confidenceScore >= 0.80
                                    ? 'bg-amber-500'
                                    : 'bg-cyan-500'
                                }`}
                                style={{ width: `${record.confidenceScore * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-white text-xs">{record.confidenceScoreFormatted}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">LSTM-Kalman Prob.</span>
                        </td>

                        {/* Corrective Action Taken */}
                        <td className="p-3 align-top max-w-sm">
                          <p className="text-slate-200 text-xs font-medium leading-relaxed">
                            {record.correctiveActionTaken}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span className="text-slate-500">Threshold:</span>
                            <span className="font-mono text-amber-300">{record.thresholdLimit}</span>
                          </div>
                        </td>

                        {/* Action Status & Sign-off */}
                        <td className="p-3 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              record.actionStatus === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : record.actionStatus === 'TRANSMITTED'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {record.actionStatus.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[160px]" title={record.actionTakenBy}>
                            By: {record.actionTakenBy}
                          </div>
                        </td>

                        {/* Expand Toggle */}
                        <td className="p-3 align-top text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRecordId(isExpanded ? null : record.id);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Forensic Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                                  Audit Forensic Dossier: {record.id} ({record.anomalyId})
                                </span>
                                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {record.privacyEnforced}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                    Sensor Telemetry &amp; Exceedance
                                  </span>
                                  <div className="mt-1 font-mono text-slate-200">
                                    <div><strong>Measured:</strong> {record.measuredValue}</div>
                                    <div className="text-amber-400"><strong>Threshold:</strong> {record.thresholdLimit}</div>
                                    {record.workerId && <div className="text-cyan-400"><strong>Worker ID:</strong> {record.workerId}</div>}
                                    {record.equipmentId && <div className="text-amber-400"><strong>Equipment:</strong> {record.equipmentId}</div>}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                    Algorithm Attribution &amp; Confidence
                                  </span>
                                  <div className="mt-1 font-mono text-slate-300">
                                    <div><strong>Confidence:</strong> {record.confidenceScoreFormatted}</div>
                                    <div className="text-slate-400 text-[11px] mt-1">{record.modelAttribution}</div>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                    Corrective Action Audit Sign-off
                                  </span>
                                  <div className="mt-1 text-slate-300">
                                    <div><strong>Status:</strong> {record.actionStatus}</div>
                                    <div><strong>Sign-off:</strong> {record.actionTakenBy}</div>
                                    {record.responderNotes && (
                                      <div className="text-emerald-300 text-[11px] mt-1 bg-emerald-950/40 p-2 rounded border border-emerald-500/30">
                                        <strong>Responder Follow-up:</strong> {record.responderNotes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
                      <p className="font-semibold text-slate-300">No anomaly audit records match your filters.</p>
                      <p className="text-[11px] text-slate-500">Try clearing search terms or resetting severity and status filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredRecords.length} of {auditRecords.length} historical audit entries &bull; Cryptographically sealed
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-slate-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={onClose}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

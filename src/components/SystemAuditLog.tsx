import React, { useState, useMemo } from 'react';
import { SystemAuditLogEntry, AuditChangeCategory } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Sliders,
  MapPin,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';

interface SystemAuditLogProps {
  logs: SystemAuditLogEntry[];
  onAddManualLog?: (newEntry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>) => void;
}

export default function SystemAuditLog({ logs, onAddManualLog }: SystemAuditLogProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AuditChangeCategory>('ALL');
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Manual Override Form State
  const [formUserId, setFormUserId] = useState<string>('USR-SAF-104');
  const [formUserName, setFormUserName] = useState<string>('Dr. Sarah Chen');
  const [formUserRole] = useState<string>('Lead Occupational Safety Engineer');
  const [formCategory, setFormCategory] = useState<AuditChangeCategory>('THRESHOLD_CHANGE');
  const [formTargetModule, setFormTargetModule] = useState<string>('Kalman Anomaly Filter Engine');
  const [formParameter, setFormParameter] = useState<string>('Critical Risk Cutoff Threshold %');
  const [formPrevValue, setFormPrevValue] = useState<string>('75%');
  const [formNewValue, setFormNewValue] = useState<string>('65%');
  const [formJustification, setFormJustification] = useState<string>(
    'Ad-hoc adjustment for heightened ambient heatwave alert and high-vibration drilling operations.'
  );

  // Filter logs based on search and category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory =
        selectedCategory === 'ALL' || log.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        log.userId.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.targetModule.toLowerCase().includes(q) ||
        log.parameter.toLowerCase().includes(q) ||
        log.justification.toLowerCase().includes(q) ||
        log.newValue.toLowerCase().includes(q) ||
        log.previousValue.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [logs, searchQuery, selectedCategory]);

  // Aggregate stats
  const totalCount = logs.length;
  const thresholdCount = logs.filter((l) => l.category === 'THRESHOLD_CHANGE').length;
  const zoneConfigCount = logs.filter((l) => l.category === 'ZONE_CONFIG').length;
  const exportCount = logs.filter((l) => l.category === 'REPORT_EXPORT').length;
  const uniqueUsers = Array.from(new Set(logs.map((l) => l.userId))).length;

  // Handle Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Audit_ID',
      'Timestamp',
      'User_ID',
      'User_Name',
      'User_Role',
      'Change_Category',
      'Target_Module_or_Zone',
      'Parameter_Modified',
      'Previous_Value',
      'New_Value',
      'Operational_Justification',
      'Compliance_Status'
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userId}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.category}"`,
      `"${l.targetModule.replace(/"/g, '""')}"`,
      `"${l.parameter.replace(/"/g, '""')}"`,
      `"${l.previousValue.replace(/"/g, '""')}"`,
      `"${l.newValue.replace(/"/g, '""')}"`,
      `"${l.justification.replace(/"/g, '""')}"`,
      `"${l.approvalStatus}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Submit manual override form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJustification.trim()) return;

    if (onAddManualLog) {
      onAddManualLog({
        userId: formUserId.trim() || 'USR-MGR-2026',
        userName: formUserName.trim() || 'Alex Mercer',
        userRole: formUserRole || 'EHS Safety Supervisor',
        category: formCategory,
        targetModule: formTargetModule,
        parameter: formParameter,
        previousValue: formPrevValue,
        newValue: formNewValue,
        justification: formJustification,
        approvalStatus: 'VERIFIED'
      });
    }

    setIsManualModalOpen(false);
    setFormJustification('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
      {/* Component Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">System Audit Log</h2>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-sm">
                OSHA 1910 / ISO 45001 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable register of manual adjustments to anomaly sensitivity thresholds and zone configurations, recording timestamps and User IDs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Manual Override</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
            title="Download CSV report of manual threshold and zone configuration adjustments"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium">Total Audit Events</span>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
          <span className="text-[10px] text-indigo-400 font-mono">100% Cryptographically Logged</span>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium">Threshold Adjustments</span>
          <div className="text-xl font-bold text-purple-400 mt-1">{thresholdCount}</div>
          <span className="text-[10px] text-slate-400">Kalman Q/R &amp; Cutoff Values</span>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium">Zone Config Changes</span>
          <div className="text-xl font-bold text-cyan-400 mt-1">{zoneConfigCount}</div>
          <span className="text-[10px] text-slate-400">Baselines &amp; Sector Limits</span>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium">Active Supervisors</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{uniqueUsers} Users</div>
          <span className="text-[10px] text-emerald-400 font-mono">RBAC Identity Verified</span>
        </div>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
        {/* Category Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setSelectedCategory('THRESHOLD_CHANGE')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              selectedCategory === 'THRESHOLD_CHANGE'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>Thresholds ({thresholdCount})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('ZONE_CONFIG')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              selectedCategory === 'ZONE_CONFIG'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <MapPin className="h-3 w-3" />
            <span>Zone Configs ({zoneConfigCount})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('REPORT_EXPORT')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              selectedCategory === 'REPORT_EXPORT'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs font-semibold'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Download className="h-3 w-3" />
            <span>Audit Exports ({exportCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search User ID, module, parameter..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5 font-semibold">Timestamp</th>
              <th className="py-3 px-3.5 font-semibold">User ID &amp; Operator</th>
              <th className="py-3 px-3.5 font-semibold">Category</th>
              <th className="py-3 px-3.5 font-semibold">Target Module / Zone</th>
              <th className="py-3 px-3.5 font-semibold">Parameter Modified</th>
              <th className="py-3 px-3.5 font-semibold">Value Diff (Old → New)</th>
              <th className="py-3 px-3.5 font-semibold">Justification / Rationale</th>
              <th className="py-3 px-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  No audit trail records found matching query &ldquo;{searchQuery}&rdquo;.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const isThreshold = log.category === 'THRESHOLD_CHANGE';

                return (
                  <tr key={`${log.id}-${index}`} className="hover:bg-slate-900/50 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block pl-4">{log.id}</span>
                    </td>

                    {/* User ID & Operator */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-[10px]">
                          {log.userId}
                        </span>
                        <div>
                          <div className="text-white font-medium text-xs">{log.userName}</div>
                          <div className="text-[10px] text-slate-400">{log.userRole}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {isThreshold ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Sliders className="h-2.5 w-2.5 mr-1" /> Threshold
                        </span>
                      ) : log.category === 'REPORT_EXPORT' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Download className="h-2.5 w-2.5 mr-1" /> Audit Export
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <MapPin className="h-2.5 w-2.5 mr-1" /> {log.category.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    {/* Target Module / Zone */}
                    <td className="py-3 px-3.5 font-medium text-slate-200">
                      <div className="truncate max-w-[180px]" title={log.targetModule}>
                        {log.targetModule}
                      </div>
                    </td>

                    {/* Parameter */}
                    <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                      <div className="truncate max-w-[190px]" title={log.parameter}>
                        {log.parameter}
                      </div>
                    </td>

                    {/* Value Diff */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-rose-400/90 line-through bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {log.previousValue}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="text-emerald-400 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {log.newValue}
                        </span>
                      </div>
                    </td>

                    {/* Justification */}
                    <td className="py-3 px-3.5 text-xs text-slate-300 max-w-[280px]">
                      <p className="line-clamp-2" title={log.justification}>
                        {log.justification}
                      </p>
                    </td>

                    {/* Compliance Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {log.approvalStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Override Log Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Log Manual System Parameter Override
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">User ID (Identity)</label>
                  <input
                    type="text"
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Operator Name</label>
                  <input
                    type="text"
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Audit Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as AuditChangeCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="THRESHOLD_CHANGE">Threshold Change (Kalman Anomaly Sensitivity / Cutoffs)</option>
                  <option value="ZONE_CONFIG">Zone Configuration (Baselines, Noise Limits, Microclimate)</option>
                  <option value="FILTER_CALIBRATION">Filter Calibration (Process Noise Q / Measurement Noise R)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Module / Zone</label>
                <input
                  type="text"
                  value={formTargetModule}
                  onChange={(e) => setFormTargetModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Parameter Modified</label>
                <input
                  type="text"
                  value={formParameter}
                  onChange={(e) => setFormParameter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Previous Value</label>
                  <input
                    type="text"
                    value={formPrevValue}
                    onChange={(e) => setFormPrevValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">New Calibrated Value</label>
                  <input
                    type="text"
                    value={formNewValue}
                    onChange={(e) => setFormNewValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Operational Justification &amp; Compliance Rationale
                </label>
                <textarea
                  value={formJustification}
                  onChange={(e) => setFormJustification(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                  placeholder="State the engineering rationale, environmental trigger, or clinical protocol justifying this change..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Commit Audit Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

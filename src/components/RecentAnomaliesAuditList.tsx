import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Activity,
  Layers,
  Wrench,
  Radio,
  Eye,
  FileText
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';

import AnomalyTelemetryDetailModal from './AnomalyTelemetryDetailModal';

interface RecentAnomaliesAuditListProps {
  alerts: ActiveAnomalyAlert[];
  zones?: FacilityZone[];
  onAcknowledgeAlert?: (id: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onInspectAnomaly?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  selectedAnomalyId?: string;
}

export default function RecentAnomaliesAuditList({
  alerts,
  zones = [],
  onAcknowledgeAlert,
  onDispatchAction,
  onInspectAnomaly,
  onSelectZone,
  selectedAnomalyId
}: RecentAnomaliesAuditListProps) {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportNotice, setIsExportNotice] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<ActiveAnomalyAlert | null>(null);

  // Take the last 10 detected anomalies (most recent first)
  const last10Anomalies = useMemo(() => {
    return alerts.slice(0, 10);
  }, [alerts]);

  // Filtered view of the last 10
  const filteredAnomalies = useMemo(() => {
    return last10Anomalies.filter((a) => {
      const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSeverity;
      const matchesText =
        a.id.toLowerCase().includes(q) ||
        a.anomaly_metric.toLowerCase().includes(q) ||
        a.location_zone.toLowerCase().includes(q) ||
        a.worker_id.toLowerCase().includes(q) ||
        a.recommended_action.toLowerCase().includes(q) ||
        (a.equipment_name && a.equipment_name.toLowerCase().includes(q));
      return matchesSeverity && matchesText;
    });
  }, [last10Anomalies, severityFilter, searchQuery]);

  const severityCounts = useMemo(() => {
    const counts = { ALL: last10Anomalies.length, CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
    last10Anomalies.forEach((a) => {
      if (counts[a.severity] !== undefined) {
        counts[a.severity]++;
      }
    });
    return counts;
  }, [last10Anomalies]);

  // Export current list as quick audit CSV
  const handleExportQuickAuditCsv = () => {
    try {
      const headers = ['Audit ID', 'Timestamp', 'Severity', 'Anomaly Metric', 'Zone / Department', 'Worker / Equip ID', 'Raw Reading', 'Kalman Filtered', 'Recommended Action', 'Status'];
      const rows = filteredAnomalies.map((a) => [
        `"${a.id}"`,
        `"${a.detected_at}"`,
        `"${a.severity}"`,
        `"${a.anomaly_metric.replace(/"/g, '""')}"`,
        `"${a.location_zone}"`,
        `"${a.worker_id}"`,
        `"${a.raw_value.replace(/"/g, '""')}"`,
        `"${a.kalman_smoothed_value.replace(/"/g, '""')}"`,
        `"${a.recommended_action.replace(/"/g, '""')}"`,
        `"${a.acknowledged ? 'ACKNOWLEDGED' : 'PENDING_TRIAGE'}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `prognosticator_last10_anomalies_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportNotice('Exported last 10 anomalies CSV audit log successfully.');
      setTimeout(() => setIsExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
    }
  };

  const getSeverityBadge = (sev: ActiveAnomalyAlert['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-xs animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/50 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            HIGH
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            LOW
          </span>
        );
    }
  };

  return (
    <div id="recent-anomalies-audit-list" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative">
      {/* Header with Title, Count Badge & Quick Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">Last 10 Detected Anomalies</h2>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-sm font-semibold">
                Quick Audit View
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                (Showing {filteredAnomalies.length} of 10)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological ledger of recent population health &amp; equipment anomalies with exact timestamps, severity levels, and operational descriptions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportQuickAuditCsv}
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-xs"
            title="Download quick CSV snapshot of the last 10 anomalies"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isExportNotice && (
        <div className="mb-3 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs px-3 py-2 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{isExportNotice}</span>
          <button onClick={() => setIsExportNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer">&times;</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        {/* Severity Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium text-[11px] mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Severity:
          </span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => {
            const count = severityCounts[sev];
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded-md font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/60 font-bold'
                      : sev === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/60 font-bold'
                      : sev === 'MODERATE'
                      ? 'bg-yellow-950 text-yellow-300 border border-yellow-500/60 font-bold'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{sev}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-black/40 text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search last 10 anomalies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Scrollable List Container (Displays the last 10 detected anomalies) */}
      <div className="overflow-y-auto max-h-96 pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {filteredAnomalies.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">No anomalies match the selected filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Showing filtered subset of the last 10 detected anomalies. Clear filter to view all 10 entries.
            </p>
          </div>
        ) : (
          filteredAnomalies.map((alert, index) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const isModerate = alert.severity === 'MODERATE';
            const isPM = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
            const isSelected = selectedAnomaly?.id === alert.id || selectedAnomalyId === alert.id;

            const severityBorderClass =
              isCritical || isHigh
                ? 'border-l-4 border-l-rose-500 bg-slate-950/90 border-rose-500/40 hover:border-rose-500/80 shadow-xs shadow-rose-950/20'
                : isModerate
                ? 'border-l-4 border-l-amber-500 bg-slate-950/90 border-amber-500/30 hover:border-amber-500/70 shadow-xs shadow-amber-950/20'
                : 'border-l-4 border-l-emerald-500 bg-slate-950/90 border-emerald-500/30 hover:border-emerald-500/70 shadow-xs shadow-emerald-950/20';

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAnomaly(alert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAnomaly(alert);
                  }
                }}
                className={`rounded-xl p-3.5 border transition-all duration-200 cursor-pointer relative overflow-hidden group text-left ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40'
                    : severityBorderClass
                }`}
              >
                {/* Index & Top Row: Timestamp, Severity, Anomaly ID & Click Hint */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      #{index + 1}
                    </span>
                    <span className="text-slate-200 font-mono font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{alert.detected_at}</span>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="font-mono text-[11px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                      {alert.id}
                    </span>
                    {isPM && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                        <Wrench className="h-3 w-3 text-amber-400" /> Equipment
                      </span>
                    )}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/60">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 transition hidden sm:inline font-mono">
                      Click for Telemetry &amp; Kalman Values &rarr;
                    </span>
                    {getSeverityBadge(alert.severity)}
                    {alert.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 font-mono bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                        Pending Triage
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Body: Metric Name & Brief Operational Description */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {isCritical ? (
                        <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                      ) : isHigh ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      ) : (
                        <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                      )}
                      <span>{alert.anomaly_metric}</span>
                    </h4>

                    {/* Zone / Department link */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectZone) onSelectZone(alert.location_zone);
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-300 transition text-left cursor-pointer truncate max-w-xs"
                      title="Filter dashboard by this zone"
                    >
                      <span className="text-slate-500 mr-1">Zone:</span>
                      <strong className="text-slate-300 underline decoration-slate-600 underline-offset-2">
                        {alert.location_zone}
                      </strong>
                    </button>
                  </div>

                  {/* Brief Operational Description */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                    <strong className="text-slate-400 font-semibold mr-1">Brief Description:</strong>
                    {alert.recommended_action}
                  </p>
                </div>

                {/* Bottom Metadata & Quick Audit Actions Bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
                  {/* Telemetry and Pseudonym Metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono">
                    <span>
                      Target: <strong className="text-slate-200">{alert.equipment_name || alert.worker_id}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Telemetry: <span className="text-amber-300">{alert.raw_value}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Filtered: <span className="text-emerald-400">{alert.kalman_smoothed_value}</span>
                    </span>
                    {alert.lead_time && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400">Horizon: {alert.lead_time}</span>
                      </>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedAnomaly(alert)}
                      className="flex items-center space-x-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white px-2 py-1 rounded border border-cyan-500/40 transition cursor-pointer shadow-xs"
                      title="Inspect specific telemetry readings and Kalman confidence values"
                    >
                      <Activity className="h-3 w-3 text-cyan-400" />
                      <span>Telemetry &amp; Kalman</span>
                    </button>

                    {onInspectAnomaly && (
                      <button
                        type="button"
                        onClick={() => onInspectAnomaly(alert)}
                        className="flex items-center space-x-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                        title="Focus in trend chart and telemetry inspector"
                      >
                        <Eye className="h-3 w-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    )}

                    {!alert.acknowledged && onAcknowledgeAlert && (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="flex items-center space-x-1 text-[11px] font-medium bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 px-2 py-1 rounded border border-slate-800 hover:border-emerald-600/50 transition cursor-pointer"
                        title="Mark this anomaly acknowledged"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {onDispatchAction && (
                      <button
                        type="button"
                        onClick={() => onDispatchAction(alert)}
                        className="flex items-center space-x-1 text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/50 transition cursor-pointer shadow-xs"
                        title="Stage rapid intervention or work order dispatch"
                      >
                        <Send className="h-3 w-3 text-cyan-400" />
                        <span>{isPM ? 'Work Order' : 'Dispatch'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Audit Notice & k-Anonymity guarantee */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-2 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Audit Log Integrity: Immutable anomaly tracking with SHA-256 state verification.</span>
        </div>
        <div>
          <span>Privacy Shield: k-Anonymity (N &ge; 12) &amp; Small-Cell Suppression Applied.</span>
        </div>
      </div>

      {/* Detailed Telemetry & Kalman Filter Diagnostics Modal */}
      <AnomalyTelemetryDetailModal
        isOpen={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        anomaly={selectedAnomaly}
        zone={zones.find((z) => z.id === selectedAnomaly?.location_zone || z.name === selectedAnomaly?.location_zone)}
        onAcknowledgeAlert={onAcknowledgeAlert}
        onDispatchAction={onDispatchAction}
        onSelectZone={onSelectZone}
      />
    </div>
  );
}

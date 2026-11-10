import React, { useState, useMemo } from 'react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Search,
  Download,
  Volume2,
  Send,
  Eye,
  Activity,
  Heart,
  Thermometer,
  Volume2 as VolumeIcon,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCheck,
  Radio,
  MapPin,
  ExternalLink,
  Info,
  GitMerge,
  Sparkles
} from 'lucide-react';
import RootCauseAnalysisModal from './RootCauseAnalysisModal';

interface ChronologicalAnomalyLogPanelProps {
  alerts: ActiveAnomalyAlert[];
  zones?: FacilityZone[];
  selectedZoneId?: string;
  onAcknowledgeAlert: (alertId: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  onSpeakAlert?: (alert: ActiveAnomalyAlert) => void;
  onIsolateSignalInChart?: (signalKey: string) => void;
  isSpeaking?: boolean;
}

type SeverityFilter = 'ALL_HIGH_PRIORITY' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'ALL';
type StatusFilter = 'ALL' | 'UNACKNOWLEDGED' | 'ACKNOWLEDGED';

function ChronologicalAnomalyLogPanelComponent({
  alerts,
  zones = [],
  selectedZoneId,
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone,
  onSpeakAlert,
  onIsolateSignalInChart,
  isSpeaking
}: ChronologicalAnomalyLogPanelProps) {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>(selectedZoneId || 'ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [selectedRootCauseAlert, setSelectedRootCauseAlert] = useState<ActiveAnomalyAlert | null>(null);

  // Sync zone filter if selectedZoneId prop changes externally
  React.useEffect(() => {
    if (selectedZoneId && zoneFilter === 'ALL') {
      // Keep user choice unless explicitly matching
    }
  }, [selectedZoneId]);

  // Filter and sort alerts in reverse chronological order (newest first)
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        // Severity filter
        if (severityFilter === 'ALL_HIGH_PRIORITY') {
          if (alert.severity !== 'CRITICAL' && alert.severity !== 'HIGH') return false;
        } else if (severityFilter === 'CRITICAL') {
          if (alert.severity !== 'CRITICAL') return false;
        } else if (severityFilter === 'HIGH') {
          if (alert.severity !== 'HIGH') return false;
        } else if (severityFilter === 'MODERATE') {
          if (alert.severity !== 'MODERATE') return false;
        } else if (severityFilter === 'LOW') {
          if (alert.severity !== 'LOW') return false;
        }

        // Status filter
        if (statusFilter === 'UNACKNOWLEDGED' && alert.acknowledged) return false;
        if (statusFilter === 'ACKNOWLEDGED' && !alert.acknowledged) return false;

        // Zone filter
        if (zoneFilter !== 'ALL') {
          const zoneObj = zones.find((z) => z.id === zoneFilter);
          const matchesId = alert.location_zone.toLowerCase().includes(zoneFilter.toLowerCase());
          const matchesName = zoneObj ? alert.location_zone.toLowerCase().includes(zoneObj.name.toLowerCase()) : false;
          if (!matchesId && !matchesName) return false;
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = alert.id.toLowerCase().includes(q);
          const matchWorker = alert.worker_id.toLowerCase().includes(q);
          const matchZone = alert.location_zone.toLowerCase().includes(q);
          const matchMetric = alert.anomaly_metric.toLowerCase().includes(q);
          const matchAction = alert.recommended_action.toLowerCase().includes(q);
          const matchEquip = (alert.equipment_name || '').toLowerCase().includes(q);
          if (!matchId && !matchWorker && !matchZone && !matchMetric && !matchAction && !matchEquip) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Parse dates or timestamps
        const timeA = new Date(a.detected_at).getTime() || 0;
        const timeB = new Date(b.detected_at).getTime() || 0;
        return timeB - timeA;
      });
  }, [alerts, severityFilter, statusFilter, zoneFilter, searchQuery, zones]);

  // Statistics for audit log overview
  const logStats = useMemo(() => {
    const totalHighPriority = alerts.filter(
      (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
    ).length;
    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
    const unacknowledgedCount = alerts.filter(
      (a) => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'HIGH')
    ).length;

    return {
      totalHighPriority,
      criticalCount,
      highCount,
      unacknowledgedCount
    };
  }, [alerts]);

  // Export Chronological Anomaly Log as CSV
  const handleExportAnomalyCsv = () => {
    try {
      const headers = [
        'Timestamp (ISO)',
        'Alert ID',
        'Severity',
        'Status',
        'Facility Zone',
        'Worker/Equipment ID',
        'Anomaly Metric',
        'Raw Sensor Value',
        'Kalman Filtered Value',
        'Early Warning Lead Time',
        'Operational Action Directive',
        'Privacy Compliance Status'
      ];

      const rows = filteredAlerts.map((a) => [
        `"${a.detected_at}"`,
        `"${a.id}"`,
        `"${a.severity}"`,
        `"${a.acknowledged ? 'ACKNOWLEDGED' : 'UNACKNOWLEDGED'}"`,
        `"${a.location_zone.replace(/"/g, '""')}"`,
        `"${a.worker_id}"`,
        `"${a.anomaly_metric.replace(/"/g, '""')}"`,
        `"${a.raw_value.replace(/"/g, '""')}"`,
        `"${a.kalman_smoothed_value.replace(/"/g, '""')}"`,
        `"${a.lead_time.replace(/"/g, '""')}"`,
        `"${a.recommended_action.replace(/"/g, '""')}"`,
        `"${a.privacy_status.replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Prognosticator_Anomaly_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedbackNotice(`Exported ${filteredAlerts.length} anomaly audit log records as CSV.`);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to export anomaly CSV:', err);
      setFeedbackNotice('Failed to export CSV: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  // Batch Acknowledge All High-Priority Alerts
  const handleAcknowledgeAllVisible = () => {
    const unacked = filteredAlerts.filter((a) => !a.acknowledged);
    if (unacked.length === 0) return;

    unacked.forEach((a) => onAcknowledgeAlert(a.id));
    setFeedbackNotice(`Acknowledged ${unacked.length} high-priority anomaly alerts.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Helper to map metric to chart signal for isolating
  const handleIsolateSignalFromAlert = (metric: string) => {
    const lower = metric.toLowerCase();
    let targetKey = 'smoothedHrv';
    if (lower.includes('temp') || lower.includes('heat') || lower.includes('thermal')) {
      targetKey = 'skinTemp';
    } else if (lower.includes('noise') || lower.includes('acoustic') || lower.includes('decibel')) {
      targetKey = 'noiseDb';
    } else if (lower.includes('risk') || lower.includes('composite')) {
      targetKey = 'riskScore';
    } else if (lower.includes('raw') || lower.includes('jitter')) {
      targetKey = 'rawHrv';
    }

    if (onIsolateSignalInChart) {
      onIsolateSignalInChart(targetKey);
    }

    // Smooth scroll to historical chart
    const el = document.getElementById('historical-health-chart-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Relative time helper
  const getRelativeTime = (timestampStr: string) => {
    try {
      const then = new Date(timestampStr).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - then) / 1000);

      if (isNaN(then) || diffSec < 0) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      id="chronological-anomaly-log-panel"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header and Overview */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-rose-400" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Chronological Anomaly Log
              <span className="text-xs font-mono font-normal bg-rose-950/70 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                {filteredAlerts.length} High-Priority Alert{filteredAlerts.length !== 1 ? 's' : ''}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time timestamped audit log of physiological and environmental threshold breaches with Kalman validation and early-warning lead times.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Unacknowledged count badge */}
          {logStats.unacknowledgedCount > 0 && (
            <button
              onClick={handleAcknowledgeAllVisible}
              className="flex items-center space-x-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
              title="Acknowledge all pending high-priority alerts in current filtered view"
            >
              <CheckCheck className="h-3.5 w-3.5 text-rose-400" />
              <span>Acknowledge All ({logStats.unacknowledgedCount})</span>
            </button>
          )}

          {/* Export Anomaly CSV Button */}
          <button
            onClick={handleExportAnomalyCsv}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition shadow-xs"
            title="Download full chronological anomaly audit log as CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export Log CSV</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center space-x-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition"
            title={isExpanded ? 'Collapse Anomaly Log' : 'Expand Anomaly Log'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Temporary Feedback Notification */}
      {feedbackNotice && (
        <div className="my-3 p-3 bg-cyan-950/70 border border-cyan-500/50 rounded-lg text-cyan-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-cyan-400 hover:text-white underline text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Total High-Priority</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{logStats.totalHighPriority}</span>
          </div>
          <AlertOctagon className="h-6 w-6 text-rose-400/50" />
        </div>

        <div className="bg-slate-950/70 border border-rose-500/30 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-300 uppercase tracking-wider block font-medium">Critical Alerts</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">{logStats.criticalCount}</span>
          </div>
          <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>
        </div>

        <div className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-medium">High Severity</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{logStats.highCount}</span>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-400/50" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Unacknowledged</span>
            <span className={`text-xl font-bold mt-0.5 block ${logStats.unacknowledgedCount > 0 ? 'text-rose-400 font-black' : 'text-emerald-400'}`}>
              {logStats.unacknowledgedCount}
            </span>
          </div>
          <ShieldCheck className={`h-6 w-6 ${logStats.unacknowledgedCount > 0 ? 'text-rose-400/60' : 'text-emerald-400/60'}`} />
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search and Filter Controls Toolbar */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs mb-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, zone, worker token, metric or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-8 pr-3 py-1.5 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-medium flex-wrap gap-0.5">
              <button
                onClick={() => setSeverityFilter('ALL')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'ALL'
                    ? 'bg-slate-700 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSeverityFilter('CRITICAL')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'CRITICAL'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setSeverityFilter('HIGH')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'HIGH'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setSeverityFilter('MODERATE')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'MODERATE'
                    ? 'bg-yellow-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-yellow-300'
                }`}
              >
                Medium / Mod
              </button>
              <button
                onClick={() => setSeverityFilter('LOW')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'LOW'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setSeverityFilter('ALL_HIGH_PRIORITY')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  severityFilter === 'ALL_HIGH_PRIORITY'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                High Priority
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-medium">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded transition ${
                  statusFilter === 'ALL' ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setStatusFilter('UNACKNOWLEDGED')}
                className={`px-2 py-1 rounded transition ${
                  statusFilter === 'UNACKNOWLEDGED'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('ACKNOWLEDGED')}
                className={`px-2 py-1 rounded transition ${
                  statusFilter === 'ACKNOWLEDGED'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Acknowledged
              </button>
            </div>

            {/* Zone Filter Dropdown */}
            {zones.length > 0 && (
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Facility Zones ({zones.length})</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chronological Table / List View */}
          {filteredAlerts.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-white">No Matching Anomaly Alerts</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No health or safety deviations match your current filter parameters. All active telemetry streams are operating within verified statistical baselines.
              </p>
              {(searchQuery || severityFilter !== 'ALL_HIGH_PRIORITY' || statusFilter !== 'ALL' || zoneFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('ALL_HIGH_PRIORITY');
                    setStatusFilter('ALL');
                    setZoneFilter('ALL');
                  }}
                  className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Timestamp / Lead Time</th>
                    <th className="py-2.5 px-3 font-semibold">Severity &amp; Alert ID</th>
                    <th className="py-2.5 px-3 font-semibold">Zone / Monitored Target</th>
                    <th className="py-2.5 px-3 font-semibold">Anomaly Metric &amp; Telemetry Deviation</th>
                    <th className="py-2.5 px-3 font-semibold">Operational Directive</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Audit &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredAlerts.map((alert) => {
                    const isCritical = alert.severity === 'CRITICAL';
                    const isHigh = alert.severity === 'HIGH';
                    const isExpandedRow = expandedAlertId === alert.id;

                    return (
                      <React.Fragment key={alert.id}>
                        <tr
                          className={`transition hover:bg-slate-800/40 ${
                            !alert.acknowledged
                              ? isCritical
                                ? 'bg-rose-950/20'
                                : 'bg-amber-950/15'
                              : 'bg-slate-900/60'
                          }`}
                        >
                          {/* Column 1: Timestamp & Relative Lead Time */}
                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-200 font-mono font-medium">
                              <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              <span>{alert.detected_at}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                              <span className="text-slate-400 font-mono">
                                ({getRelativeTime(alert.detected_at)})
                              </span>
                              <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[10px]">
                                {alert.lead_time}
                              </span>
                            </div>
                          </td>

                          {/* Column 2: Severity Badge & Alert ID */}
                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                                  isCritical
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-xs'
                                    : isHigh
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {isCritical && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>}
                                {alert.severity}
                              </span>
                              <span className="font-mono text-slate-300 font-semibold text-[11px]">
                                {alert.id}
                              </span>
                            </div>
                            <div className="mt-1">
                              {alert.acknowledged ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                  <CheckCircle2 className="h-3 w-3" /> Acknowledged
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold animate-pulse">
                                  <AlertTriangle className="h-3 w-3" /> Unacknowledged
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Column 3: Facility Zone & Anonymized ID */}
                          <td className="py-3 px-3 align-top">
                            <div className="font-semibold text-white flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                              <button
                                onClick={() => {
                                  if (onSelectZone) {
                                    const match = zones.find((z) => z.name.toLowerCase().includes(alert.location_zone.toLowerCase()) || alert.location_zone.toLowerCase().includes(z.name.toLowerCase()));
                                    if (match) onSelectZone(match.id);
                                  }
                                }}
                                className="hover:text-cyan-300 hover:underline text-left"
                                title="Filter by this industrial zone"
                              >
                                {alert.location_zone}
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {alert.alert_type === 'PREDICTIVE_MAINTENANCE' ? (
                                <span className="text-amber-300 flex items-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  {alert.equipment_name || alert.equipment_id}
                                </span>
                              ) : (
                                <span>{alert.worker_id}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {alert.privacy_status || 'k≥12 Anonymity Validated'}
                            </div>
                          </td>

                          {/* Column 4: Anomaly Metric & Telemetry Deviation */}
                          <td className="py-3 px-3 align-top">
                            <button
                              onClick={() => setSelectedRootCauseAlert(alert)}
                              className="font-bold text-slate-100 hover:text-cyan-300 flex items-center gap-1.5 transition text-left cursor-pointer group"
                              title="Click to perform Root Cause Analysis (Environmental vs. Operational)"
                            >
                              {alert.anomaly_metric.toLowerCase().includes('hrv') ? (
                                <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition" />
                              ) : alert.anomaly_metric.toLowerCase().includes('temp') ? (
                                <Thermometer className="h-3.5 w-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition" />
                              ) : alert.anomaly_metric.toLowerCase().includes('noise') ? (
                                <VolumeIcon className="h-3.5 w-3.5 text-orange-400 shrink-0 group-hover:scale-110 transition" />
                              ) : (
                                <Activity className="h-3.5 w-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
                              )}
                              <span className="group-hover:underline">{alert.anomaly_metric}</span>
                              <GitMerge className="h-3 w-3 text-purple-400 opacity-60 group-hover:opacity-100" />
                            </button>

                            <div className="grid grid-cols-2 gap-1.5 mt-1 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-500 text-[10px] block">Raw Sensor:</span>
                                <span className="text-amber-300 font-semibold">{alert.raw_value}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block">Kalman Smoothed:</span>
                                <span className="text-cyan-300 font-bold">{alert.kalman_smoothed_value}</span>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                                <span>{alert.kalman_status}</span>
                              </span>
                              <button
                                onClick={() => setSelectedRootCauseAlert(alert)}
                                className="text-purple-400 hover:text-purple-300 text-[9px] underline font-sans cursor-pointer"
                              >
                                Root Cause &rarr;
                              </button>
                            </div>
                          </td>

                          {/* Column 5: Operational Directive */}
                          <td className="py-3 px-3 align-top">
                            <p className="text-slate-300 leading-snug line-clamp-2" title={alert.recommended_action}>
                              {alert.recommended_action}
                            </p>
                            <button
                              onClick={() => setExpandedAlertId(isExpandedRow ? null : alert.id)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{isExpandedRow ? 'Hide details' : 'View full triage details'}</span>
                              {isExpandedRow ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </td>

                          {/* Column 6: Actions */}
                          <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                            <div className="flex flex-col items-end gap-1.5">
                              {/* Acknowledge Button */}
                              {!alert.acknowledged ? (
                                <button
                                  onClick={() => onAcknowledgeAlert(alert.id)}
                                  className="flex items-center space-x-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded text-xs font-semibold transition shadow-xs cursor-pointer"
                                  title="Acknowledge alert and log to audit trail"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Acknowledge</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-medium">
                                  Logged
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {/* Root Cause Analysis Modal Trigger */}
                                <button
                                  onClick={() => setSelectedRootCauseAlert(alert)}
                                  className="flex items-center space-x-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
                                  title="Analyze Environmental vs. Operational Root Causes"
                                >
                                  <GitMerge className="h-3 w-3 text-purple-400" />
                                  <span>Root Cause</span>
                                </button>

                                {/* Isolate Signal in Chart */}
                                <button
                                  onClick={() => handleIsolateSignalFromAlert(alert.anomaly_metric)}
                                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                                  title="Scroll up and isolate this health signal on the 24-hour line chart"
                                >
                                  <Activity className="h-3 w-3 text-cyan-400" />
                                  <span>Isolate</span>
                                </button>

                                {/* Dispatch Action */}
                                {onDispatchAction && (
                                  <button
                                    onClick={() => onDispatchAction(alert)}
                                    className="flex items-center space-x-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                                    title="Stage Automated Medical or Safety Protocol Dispatch"
                                  >
                                    <Send className="h-3 w-3 text-rose-400" />
                                    <span>Dispatch</span>
                                  </button>
                                )}

                                {/* Voice Readout Button */}
                                {onSpeakAlert && (
                                  <button
                                    onClick={() => onSpeakAlert(alert)}
                                    className={`p-1 rounded text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition cursor-pointer ${
                                      isSpeaking ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800'
                                    }`}
                                    title="Speak alert synthesis over PA/Radio"
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Audit & Root-Cause Detail Row */}
                        {isExpandedRow && (
                          <tr className="bg-slate-950/90 border-b border-slate-800">
                            <td colSpan={6} className="p-4 text-xs">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-300">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                                  <span className="font-bold text-white flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                                    Full Telemetry &amp; Protocol Audit Dossier: {alert.id}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    Status: {alert.acknowledged ? 'VERIFIED_ACKNOWLEDGED' : 'ACTION_REQUIRED'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] mb-3">
                                  <div>
                                    <span className="text-slate-500 text-[10px] block uppercase">Recommended Protocol</span>
                                    <p className="font-sans text-white text-xs mt-0.5">{alert.recommended_action}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-[10px] block uppercase">Statistical Filtering Status</span>
                                    <p className="text-cyan-300 mt-0.5">{alert.kalman_status}</p>
                                    <p className="text-slate-400 text-[10px] mt-0.5">
                                      Raw: {alert.raw_value} ➔ Smoothed: {alert.kalman_smoothed_value}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-[10px] block uppercase">Compliance &amp; Privacy Lock</span>
                                    <p className="text-emerald-400 mt-0.5 flex items-center gap-1">
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      <span>{alert.privacy_status || 'HIPAA / GDPR k-Anonymity Cleared'}</span>
                                    </p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">
                                      No raw biometric identifiers stored in central supervisory logs.
                                    </p>
                                  </div>
                                </div>

                                {/* Root Cause Analysis Launcher in Expanded Dossier */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/40 rounded-lg gap-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                      <GitMerge className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold text-white block">
                                        Root Cause Heuristic Diagnostics (Environmental vs. Operational)
                                      </span>
                                      <span className="text-[11px] text-slate-400 block">
                                        Analyze causal split between ambient microclimate and operational exertion cadence.
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setSelectedRootCauseAlert(alert)}
                                    className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-md shrink-0"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Launch Root Cause Analysis</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Panel Audit Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 gap-2 font-mono mt-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                All logged anomalies are cryptographically timestamped and filtered via Prognosticator LSTM-Kalman engine under HIPAA/GDPR k-Anonymity ($N \ge 12$).
              </span>
            </div>
            <div className="text-slate-400">
              Showing {filteredAlerts.length} of {alerts.length} total events
            </div>
          </div>
        </>
      )}

      {/* Root Cause Analysis Modal */}
      {selectedRootCauseAlert && (
        <RootCauseAnalysisModal
          isOpen={Boolean(selectedRootCauseAlert)}
          onClose={() => setSelectedRootCauseAlert(null)}
          alert={selectedRootCauseAlert}
          zone={zones.find(
            (z) =>
              z.id === selectedRootCauseAlert.location_zone ||
              z.name.toLowerCase().includes(selectedRootCauseAlert.location_zone.toLowerCase()) ||
              selectedRootCauseAlert.location_zone.toLowerCase().includes(z.name.toLowerCase())
          )}
          onDispatchMitigation={onDispatchAction}
        />
      )}
    </div>
  );
}

const ChronologicalAnomalyLogPanel = React.memo(ChronologicalAnomalyLogPanelComponent);
export default ChronologicalAnomalyLogPanel;

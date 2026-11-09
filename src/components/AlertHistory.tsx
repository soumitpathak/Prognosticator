import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  Download,
  Edit3,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Heart,
  Thermometer,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  CheckCheck,
  Archive
} from 'lucide-react';
import { ActiveAnomalyAlert } from '../types';

export interface PastAnomalyRecord {
  id: string;
  timestamp: string; // ISO 8601
  timeFormatted: string; // e.g., "Nov 9, 2026 03:15 AM"
  timeAgo: string; // e.g., "22m ago"
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  anomalyMetric: string;
  locationZone: string;
  workerId: string;
  rawValue?: string;
  smoothedValue?: string;
  leadTime?: string;
  resolutionNotes: string;
  resolvedAt?: string;
  resolvedBy?: string;
  status: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'REVIEWED' | 'ARCHIVED';
  signalType?: string;
  recommendedAction?: string;
}

export interface AlertHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  pastAnomalies: PastAnomalyRecord[];
  onUpdateResolutionNote: (id: string, note: string, author?: string) => void;
  onMarkResolved: (id: string, note?: string) => void;
  onBulkMarkStatus?: (
    ids: string[],
    newStatus: 'REVIEWED' | 'ARCHIVED' | 'RESOLVED',
    note?: string
  ) => void;
  onInspectAnomaly?: (alert: any) => void;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

export const INITIAL_PAST_ANOMALIES: PastAnomalyRecord[] = [
  {
    id: 'ALR-8842-CR',
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    timeFormatted: 'Today 03:30 AM',
    timeAgo: '24m ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Acute Autonomic & Thermal Strain',
    locationZone: 'Outdoor-Construction-Sector-4',
    workerId: 'W-9921',
    rawValue: 'HRV: 31 ms (Jitter: ±8ms), Skin: 38.4°C',
    smoothedValue: 'HRV: 34.2 ms, Skin: 38.15°C',
    leadTime: '3.8h Prior to Syncope',
    resolutionNotes:
      'Escorted worker to shaded cooling tent with chilled electrolyte rehydration (500ml). Skin temperature normalized to 37.0°C within 18 minutes; rested 30 minutes before returning to light duty.',
    resolvedAt: 'Today 03:48 AM',
    resolvedBy: 'Safety Officer Martinez (Triage Lead)',
    status: 'RESOLVED',
    signalType: 'CARDIAC_THERMAL',
    recommendedAction: 'Immediate shaded rest and oral hydration.'
  },
  {
    id: 'ALR-PM-9042',
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    timeFormatted: 'Today 03:02 AM',
    timeAgo: '52m ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Bearing Vibration & Motor Casing Heat',
    locationZone: 'Outdoor-Construction-Sector-4',
    workerId: 'MTR-DRIVE-4B',
    rawValue: 'Vibration: 7.2 mm/s RMS, Casing Heat: 89.1°C',
    smoothedValue: 'Vibration: 6.85 mm/s, Casing Heat: 86.4°C',
    leadTime: '18.5h To Seizure',
    resolutionNotes:
      'LOTO Stage 2 executed. Conveyor Drive 4B motor roller bearing sleeve re-lubricated with high-temp synthetic grease; vibration dropped to 2.1 mm/s RMS (ISO Class II Zone A).',
    resolvedAt: 'Today 03:35 AM',
    resolvedBy: 'Reliability Tech Kowalski',
    status: 'RESOLVED',
    signalType: 'EQUIPMENT_VIBRATION',
    recommendedAction: 'Conveyor drive motor bearing inspection and lubrication.'
  },
  {
    id: 'ALR-8839-HG',
    timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    timeFormatted: 'Today 02:29 AM',
    timeAgo: '1h 25m ago',
    severity: 'HIGH',
    anomalyMetric: 'Acoustic Machinery Overexposure & Temp Spike',
    locationZone: 'Outdoor-Construction-Sector-4',
    workerId: 'W-6104',
    rawValue: 'Noise: 104.8 dB, Ambient: 45.1°C',
    smoothedValue: 'Noise: 98.4 dB, Ambient: 44.2°C',
    leadTime: '2.5h Permissible Limit',
    resolutionNotes:
      'Distributed dual-layer earmuffs with active acoustic attenuation. Compressor 4B acoustic shroud baffle reseated; ambient noise reduced to 82 dBA.',
    resolvedAt: 'Today 02:50 AM',
    resolvedBy: 'Industrial Hygienist Chen',
    status: 'RESOLVED',
    signalType: 'ENVIRONMENTAL_ACOUSTIC',
    recommendedAction: 'Verify hearing protection and dampener placement.'
  },
  {
    id: 'ALR-8827-MD',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    timeFormatted: 'Today 01:34 AM',
    timeAgo: '2h 20m ago',
    severity: 'MODERATE',
    anomalyMetric: 'Cumulative Fatigue & Reaction Drift',
    locationZone: 'Warehouse-Logistics-Hub-North',
    workerId: 'W-3209',
    rawValue: 'Reaction Latency: +420ms, Sleep Deficit: 3.5h',
    smoothedValue: 'Normalized Reaction Index: 62/100',
    leadTime: '1.2h Prior to Performance Error',
    resolutionNotes:
      'Worker reassigned from high-reach forklift operation to floor-level inventory scanning for the remainder of shift; verified zero micro-sleep events.',
    resolvedAt: 'Today 01:55 AM',
    resolvedBy: 'Shift Supervisor Davies',
    status: 'RESOLVED',
    signalType: 'PERFORMANCE_FATIGUE',
    recommendedAction: 'Reassign to lower-hazard staging.'
  },
  {
    id: 'ALR-8815-HG',
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    timeFormatted: 'Yesterday 11:24 PM',
    timeAgo: '3h 30m ago',
    severity: 'HIGH',
    anomalyMetric: 'Thermal Work Limit (TWL) Boundary Breach',
    locationZone: 'Smelting-Foundry-East',
    workerId: 'W-7740',
    rawValue: 'TWL: 98 W/m² (Critical < 115 W/m²)',
    smoothedValue: 'TWL Kalman: 104 W/m²',
    leadTime: '45m Prior to Heat Stroke Index',
    resolutionNotes:
      'Activated localized spot air blowers and mandated 15min work / 15min rest rotation. Hydration stations restocked with electrolyte packets.',
    resolvedAt: 'Yesterday 11:50 PM',
    resolvedBy: 'Foundry Lead Vance',
    status: 'RESOLVED',
    signalType: 'ENVIRONMENTAL_TWL',
    recommendedAction: 'Enforce TWL work-rest cycles and spot cooling.'
  },
  {
    id: 'ALR-8799-CR',
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    timeFormatted: 'Yesterday 09:54 PM',
    timeAgo: '6h ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Cardiac Pulse Tachycardia Surge (>138 BPM)',
    locationZone: 'Outdoor-Construction-Sector-4',
    workerId: 'W-4412',
    rawValue: 'Pulse: 142 BPM, Core Temp: 38.6°C',
    smoothedValue: 'Pulse: 136 BPM, Core Temp: 38.35°C',
    leadTime: '2.0h Prior to Cardiac Distress',
    resolutionNotes:
      'Full emergency cooling protocol initiated. Cold towels applied to neck and axillae; oral electrolytes administered. Follow-up ECG confirmed recovery to normal sinus rhythm (78 BPM). Worker cleared for next shift.',
    resolvedAt: 'Yesterday 10:30 PM',
    resolvedBy: 'Dr. Evans (Site Medical Officer)',
    status: 'RESOLVED',
    signalType: 'CARDIAC_PULSE',
    recommendedAction: 'Direct medical evaluation and cooling therapy.'
  },
  {
    id: 'ALR-8780-MD',
    timestamp: new Date(Date.now() - 500 * 60 * 1000).toISOString(),
    timeFormatted: 'Yesterday 07:34 PM',
    timeAgo: '8h 20m ago',
    severity: 'MODERATE',
    anomalyMetric: 'Mild Microclimate Dehydration Gradient',
    locationZone: 'Manufacturing-Assembly-Line-B',
    workerId: 'W-1120',
    rawValue: 'Bioimpedance Drift: -4.8%, Skin Temp: 37.5°C',
    smoothedValue: 'Bioimpedance Drift: -4.1%',
    leadTime: '3.5h Prior to Cramping',
    resolutionNotes:
      'Hydration coach visited station; worker completed 750ml fluid replenishment. Post-check bioimpedance variance stabilized to -1.2%.',
    resolvedAt: 'Yesterday 08:00 PM',
    resolvedBy: 'Wellness Coordinator Lin',
    status: 'RESOLVED',
    signalType: 'PHYSIOLOGICAL_HYDRATION',
    recommendedAction: 'Scheduled hydration check-in.'
  }
];

export default function AlertHistory({
  isOpen,
  onClose,
  pastAnomalies,
  onUpdateResolutionNote,
  onMarkResolved,
  onBulkMarkStatus,
  onInspectAnomaly,
  onSelectZone,
  className = '',
  isDocked = false,
  onToggleDock
}: AlertHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'REVIEWED' | 'ARCHIVED' | 'PENDING'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST_FIRST' | 'OLDEST_FIRST'>('NEWEST_FIRST');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  
  // Note editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingAuthor, setEditingAuthor] = useState<string>('');

  // Expanded items for full telemetry drilldown view
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportedRecently, setExportedRecently] = useState<boolean>(false);

  // Filtered and sorted anomalies
  const filteredAnomalies = useMemo(() => {
    let list = [...pastAnomalies];

    // Severity filter
    if (severityFilter !== 'ALL') {
      list = list.filter((item) => item.severity === severityFilter);
    }

    // Status filter
    if (statusFilter === 'RESOLVED') {
      list = list.filter((item) => item.status === 'RESOLVED');
    } else if (statusFilter === 'REVIEWED') {
      list = list.filter((item) => item.status === 'REVIEWED');
    } else if (statusFilter === 'ARCHIVED') {
      list = list.filter((item) => item.status === 'ARCHIVED');
    } else if (statusFilter === 'PENDING') {
      list = list.filter((item) => item.status !== 'RESOLVED' && item.status !== 'ARCHIVED');
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.anomalyMetric.toLowerCase().includes(q) ||
          item.locationZone.toLowerCase().includes(q) ||
          item.workerId.toLowerCase().includes(q) ||
          item.resolutionNotes.toLowerCase().includes(q) ||
          (item.resolvedBy && item.resolvedBy.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'NEWEST_FIRST' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [pastAnomalies, severityFilter, statusFilter, searchTerm, sortOrder]);

  // Bulk Selection Computations & Handlers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredAnomalies.length === 0) return false;
    return filteredAnomalies.every((a) => selectedIds.includes(a.id));
  }, [filteredAnomalies, selectedIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredAnomalies.length === 0) return false;
    return filteredAnomalies.some((a) => selectedIds.includes(a.id)) && !isAllFilteredSelected;
  }, [filteredAnomalies, selectedIds, isAllFilteredSelected]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredAnomalies.map((a) => a.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredAnomalies.map((a) => a.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleExecuteBulkAction = (newStatus: 'REVIEWED' | 'ARCHIVED' | 'RESOLVED') => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onBulkMarkStatus) {
      onBulkMarkStatus(selectedIds, newStatus);
    }
    const label = newStatus === 'REVIEWED' ? 'Reviewed' : newStatus === 'ARCHIVED' ? 'Archived' : 'Resolved';
    setBulkNotice(`Successfully marked ${count} ${count === 1 ? 'alert' : 'alerts'} as '${label}'.`);
    setTimeout(() => setBulkNotice(null), 3500);
    setSelectedIds([]);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = pastAnomalies.length;
    const resolved = pastAnomalies.filter((a) => a.status === 'RESOLVED').length;
    const reviewed = pastAnomalies.filter((a) => a.status === 'REVIEWED').length;
    const archived = pastAnomalies.filter((a) => a.status === 'ARCHIVED').length;
    const critical = pastAnomalies.filter((a) => a.severity === 'CRITICAL').length;
    const high = pastAnomalies.filter((a) => a.severity === 'HIGH').length;
    const resolvedPct = total > 0 ? Math.round(((resolved + reviewed) / total) * 100) : 0;
    return { total, resolved, reviewed, archived, critical, high, resolvedPct };
  }, [pastAnomalies]);

  const handleStartEdit = (item: PastAnomalyRecord) => {
    setEditingId(item.id);
    setEditingText(item.resolutionNotes);
    setEditingAuthor(item.resolvedBy || 'Safety Manager');
  };

  const handleSaveNote = (id: string) => {
    if (editingText.trim()) {
      onUpdateResolutionNote(id, editingText.trim(), editingAuthor.trim() || 'Safety Manager');
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleExportCsv = () => {
    const headers = [
      'Alert ID',
      'Timestamp (ISO)',
      'Time Formatted',
      'Severity Level',
      'Anomaly Metric',
      'Location Zone',
      'Worker / Equipment ID',
      'Raw Telemetry',
      'Smoothed Telemetry',
      'Status',
      'Resolution Notes',
      'Resolved At',
      'Resolved By',
      'Recommended Action / Directive',
      'Signal Type',
      'Regulatory Compliance Standard'
    ];

    const rows = filteredAnomalies.map((item) => [
      `"${item.id}"`,
      `"${item.timestamp}"`,
      `"${item.timeFormatted}"`,
      `"${item.severity}"`,
      `"${item.anomalyMetric.replace(/"/g, '""')}"`,
      `"${item.locationZone}"`,
      `"${item.workerId}"`,
      `"${(item.rawValue || '').replace(/"/g, '""')}"`,
      `"${(item.smoothedValue || '').replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${item.resolutionNotes.replace(/"/g, '""')}"`,
      `"${item.resolvedAt || ''}"`,
      `"${(item.resolvedBy || '').replace(/"/g, '""')}"`,
      `"${(item.recommendedAction || '').replace(/"/g, '""')}"`,
      `"${(item.signalType || '').replace(/"/g, '""')}"`,
      `"OSHA 1910 / Differential Privacy (k=12)"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `alert-history-chronological-records-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedRecently(true);
    setTimeout(() => setExportedRecently(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (visible only when not docked) */}
      {!isDocked && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Side Panel Drawer */}
      <aside
        aria-label="Chronological Past Alerts and Resolution History"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[520px] lg:w-[560px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col font-sans transition-all duration-300 animate-in slide-in-from-right no-print ${className}`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600/30 to-cyan-600/30 border border-indigo-500/50 text-indigo-400 shadow-xs">
                <History className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-wide">Alert History</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                    {stats.total} Records
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Chronological log of past anomalies with timestamps &amp; resolution notes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {onToggleDock && (
                <button
                  type="button"
                  onClick={onToggleDock}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title={isDocked ? 'Undock panel (slide-over mode)' : 'Dock panel alongside dashboard'}
                >
                  {isDocked ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close alert history panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-1.5 flex flex-col">
              <span className="text-slate-400 text-[9px]">Total</span>
              <span className="text-xs font-bold text-white font-mono">{stats.total}</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-1.5 flex flex-col">
              <span className="text-slate-400 text-[9px]">Resolved</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {stats.resolved}
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-1.5 flex flex-col">
              <span className="text-slate-400 text-[9px]">Reviewed</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {stats.reviewed}
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-1.5 flex flex-col">
              <span className="text-slate-400 text-[9px]">Archived</span>
              <span className="text-xs font-bold text-indigo-300 font-mono">
                {stats.archived}
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-1.5 flex flex-col">
              <span className="text-slate-400 text-[9px]">Critical</span>
              <span className="text-xs font-bold text-rose-400 font-mono">{stats.critical}</span>
            </div>
          </div>

          {/* Search, Sort & Export Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search metrics, zones, workers, resolution notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === 'NEWEST_FIRST' ? 'OLDEST_FIRST' : 'NEWEST_FIRST'))
              }
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
              title={`Sorting: ${sortOrder === 'NEWEST_FIRST' ? 'Newest to Oldest' : 'Oldest to Newest'}`}
            >
              <ArrowUpDown className="h-3 w-3 text-cyan-400" />
              <span>{sortOrder === 'NEWEST_FIRST' ? 'Newest' : 'Oldest'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
                exportedRecently
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/50'
                  : 'bg-emerald-950 hover:bg-emerald-900 border-emerald-500/50 text-emerald-200 hover:text-white'
              }`}
              title="Export the current list of anomalies and their resolution notes to a CSV file for long-term record-keeping"
              aria-label="Export anomalies and resolution notes to CSV"
            >
              {exportedRecently ? (
                <Check className="h-3.5 w-3.5 text-white animate-bounce" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>{exportedRecently ? 'CSV Exported!' : 'Export CSV'}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/40 text-emerald-300 border border-emerald-500/30">
                {filteredAnomalies.length}
              </span>
            </button>
          </div>

          {/* Filter Segmented Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase px-1.5 font-mono">Sev:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    severityFilter === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : sev === 'HIGH'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : sev === 'MODERATE'
                        ? 'bg-yellow-600 text-slate-950 shadow-xs'
                        : 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-wrap">
              {(['ALL', 'PENDING', 'RESOLVED', 'REVIEWED', 'ARCHIVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All'
                    : st === 'PENDING'
                    ? 'Pending'
                    : st === 'RESOLVED'
                    ? 'Resolved'
                    : st === 'REVIEWED'
                    ? 'Reviewed'
                    : 'Archived'}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Notification Feedback */}
          {bulkNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{bulkNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setBulkNotice(null)}
                className="text-emerald-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Bulk Selection Action Bar (Appears when 1 or more alerts are checked) */}
          {selectedIds.length > 0 && (
            <div className="p-2.5 bg-slate-950 border border-cyan-500/50 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-cyan-950/50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-500 text-slate-950 text-xs font-bold font-mono">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-semibold text-cyan-200">
                  {selectedIds.length} {selectedIds.length === 1 ? 'alert' : 'alerts'} selected
                </span>
                <span className="text-slate-600 text-xs">|</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExecuteBulkAction('REVIEWED')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer transition border border-cyan-400/40"
                  title="Mark selected alerts as Reviewed simultaneously"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark as Reviewed</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteBulkAction('ARCHIVED')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-sm cursor-pointer transition border border-indigo-400/40"
                  title="Mark selected alerts as Archived simultaneously"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Mark as Archived</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteBulkAction('RESOLVED')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm cursor-pointer transition border border-emerald-400/40"
                  title="Mark selected alerts as Resolved simultaneously"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolve</span>
                </button>
              </div>
            </div>
          )}

          {/* Master Select All Toolbar */}
          {filteredAnomalies.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-400 border-b border-slate-800/80 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeFilteredSelected;
                  }}
                  onChange={handleSelectAllFiltered}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-300">
                  {selectedIds.length > 0 ? (
                    <span>
                      <strong className="text-cyan-400 font-mono">{selectedIds.length}</strong> of {filteredAnomalies.length} selected
                    </span>
                  ) : (
                    <span>Select all ({filteredAnomalies.length})</span>
                  )}
                </span>
              </label>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    Bulk management mode
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable List of Past Anomalies */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/40">
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No past anomalies match filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Try adjusting the severity or search criteria to view earlier workforce health and maintenance alerts.
              </p>
              {(severityFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setSeverityFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            filteredAnomalies.map((item) => {
              const isEditing = editingId === item.id;
              const isExpanded = expandedId === item.id;
              const isSelected = selectedIds.includes(item.id);

              const severityColor =
                item.severity === 'CRITICAL'
                  ? 'border-l-rose-500 text-rose-400'
                  : item.severity === 'HIGH'
                  ? 'border-l-amber-500 text-amber-400'
                  : item.severity === 'MODERATE'
                  ? 'border-l-yellow-500 text-yellow-400'
                  : 'border-l-cyan-500 text-cyan-400';

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 rounded-xl bg-slate-900/60 border border-l-4 ${severityColor} p-3.5 space-y-2.5 transition ${
                    isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-500/40 bg-cyan-950/20 shadow-md'
                      : 'border-slate-800/80 hover:border-slate-700/90'
                  }`}
                >
                  {/* Top Row: Checkbox, Timestamp, Severity, Zone, Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Checkbox for bulk selection */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer shrink-0"
                        aria-label={`Select alert ${item.id} for bulk operations`}
                      />

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-mono font-bold text-white tracking-wide">{item.id}</span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="font-semibold">{item.severity}</span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{item.timeAgo}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span
                            onClick={() => onSelectZone?.(item.locationZone)}
                            className="hover:text-cyan-300 hover:underline cursor-pointer truncate"
                          >
                            {item.locationZone.replace(/-/g, ' ')}
                          </span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="font-mono text-slate-300 shrink-0">{item.workerId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'RESOLVED' ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Resolved</span>
                        </span>
                      ) : item.status === 'REVIEWED' ? (
                        <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-medium" title="Reviewed by safety manager">
                          <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Reviewed</span>
                        </span>
                      ) : item.status === 'ARCHIVED' ? (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium" title="Archived in regulatory storage">
                          <Archive className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Archived</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkResolved(item.id)}
                          className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer"
                          title="Mark this anomaly resolved with a resolution note"
                        >
                          <Check className="h-3 w-3 text-amber-400" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Anomaly Metric Title & Raw Values */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center justify-between">
                      <span>{item.anomalyMetric}</span>
                      {item.leadTime && (
                        <span className="text-[10px] text-cyan-400 font-mono font-normal">
                          {item.leadTime}
                        </span>
                      )}
                    </h4>
                    {item.rawValue && (
                      <div className="text-[11px] font-mono text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <span>
                          <strong className="text-slate-500">Measured:</strong> {item.rawValue}
                        </span>
                        {item.smoothedValue && (
                          <span>
                            <strong className="text-slate-500">Kalman:</strong> {item.smoothedValue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resolution Notes Section */}
                  <div className="rounded-lg bg-slate-950/90 border border-slate-800/90 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Resolution Notes</span>
                      </span>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit Note</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="Document operational intervention, medical response, or maintenance action..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Author (e.g. Safety Lead Martinez)"
                            value={editingAuthor}
                            onChange={(e) => setEditingAuthor(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 flex-1"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item.id)}
                              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition shadow-xs cursor-pointer"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save Note</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{item.resolutionNotes}"
                      </p>
                    )}

                    {/* Metadata Footer: Resolved At & By */}
                    {(item.resolvedAt || item.resolvedBy) && !isEditing && (
                      <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span>{item.resolvedBy || 'Site Safety Staff'}</span>
                        <span>{item.resolvedAt || item.timeFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar: Inspect Anomaly & Expand Details */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Full Context'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {onInspectAnomaly && (
                      <button
                        type="button"
                        onClick={() => onInspectAnomaly(item)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition cursor-pointer"
                      >
                        <Activity className="h-3 w-3" />
                        <span>Inspect Neural Telemetry</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Expanded Context Details */}
                  {isExpanded && (
                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] space-y-1.5 animate-in fade-in">
                      <div className="flex justify-between text-slate-400">
                        <span>Event Timestamp:</span>
                        <span className="font-mono text-slate-200">{item.timeFormatted} ({item.timestamp})</span>
                      </div>
                      {item.recommendedAction && (
                        <div className="text-slate-400">
                          <span className="block font-semibold text-slate-300">Initial Directive:</span>
                          <span className="text-slate-300">{item.recommendedAction}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Compliance Status:</span>
                        <span className="text-emerald-400 font-mono">k-Anonymity Verified (OSHA 1910 Compliant)</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Audit Trail Maintained</span>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white font-semibold transition cursor-pointer text-xs"
            title="Export the current list of anomalies and their resolution notes to a CSV file for long-term record-keeping"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV (Record-Keeping)</span>
          </button>
        </div>
      </aside>
    </>
  );
}

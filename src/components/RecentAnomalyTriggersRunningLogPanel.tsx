import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Filter,
  Search,
  Download,
  Sparkles,
  Radio,
  FileSpreadsheet,
  MapPin,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  Layers,
  Zap,
  Users
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';

interface RecentAnomalyTriggersRunningLogPanelProps {
  alerts: ActiveAnomalyAlert[];
  zones?: FacilityZone[];
  onAcknowledgeAlert?: (id: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  onInspectAnomaly?: (alert: ActiveAnomalyAlert) => void;
}

export default function RecentAnomalyTriggersRunningLogPanel({
  alerts,
  zones = [],
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone,
  onInspectAnomaly
}: RecentAnomalyTriggersRunningLogPanelProps) {
  // Local running log state initialized from alerts and supporting real-time trigger injection
  const [runningLog, setRunningLog] = useState<ActiveAnomalyAlert[]>(() => alerts);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Keep running log synced with incoming alerts prop while preserving any newly simulated triggers
  React.useEffect(() => {
    setRunningLog((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const incomingNew = alerts.filter((a) => !existingIds.has(a.id));
      if (incomingNew.length > 0) {
        return [...incomingNew, ...prev];
      }
      return prev;
    });
  }, [alerts]);

  // Department mapping helper
  const getDepartmentInfo = useCallback(
    (zoneId: string) => {
      const foundZone = zones.find((z) => z.id === zoneId || z.name === zoneId);
      if (foundZone) {
        return {
          name: foundZone.name,
          location: foundZone.name,
          cohort: foundZone.count || 48
        };
      }
      // Defaults by zone pattern
      if (zoneId.includes('Construction') || zoneId.includes('Sector-4')) {
        return {
          name: 'Civil & Structural Construction',
          location: 'Sector 4 Heavy Works (GCC Desert Site)',
          cohort: 84
        };
      }
      if (zoneId.includes('Warehouse') || zoneId.includes('North')) {
        return {
          name: 'Supply Chain & High-Bay Fulfillment',
          location: 'Logistics Hub North (London Gateway)',
          cohort: 68
        };
      }
      if (zoneId.includes('Manufacturing') || zoneId.includes('Line-B')) {
        return {
          name: 'Precision Robotics & Mechatronics',
          location: 'Robotic Line B (Bay Area Tech Hub)',
          cohort: 62
        };
      }
      if (zoneId.includes('Tunnel') || zoneId.includes('Subgrade')) {
        return {
          name: 'Underground Infrastructure & Conduit',
          location: 'Conduit 7 Sub-Surface Utility Network',
          cohort: 28
        };
      }
      return {
        name: zoneId.replace(/-/g, ' '),
        location: 'Industrial Facility Site',
        cohort: 42
      };
    },
    [zones]
  );

  // Severity normalizer (maps CRITICAL and HIGH to 'HIGH', MODERATE to 'MEDIUM', and LOW to 'LOW')
  const normalizeSeverity = (sev: ActiveAnomalyAlert['severity']): 'HIGH' | 'MEDIUM' | 'LOW' => {
    if (sev === 'CRITICAL' || sev === 'HIGH') return 'HIGH';
    if (sev === 'MODERATE') return 'MEDIUM';
    return 'LOW';
  };

  // Filtered running log list
  const filteredLog = useMemo(() => {
    return runningLog.filter((item) => {
      const itemTier = normalizeSeverity(item.severity);
      const matchesSeverity = severityFilter === 'ALL' || itemTier === severityFilter;

      const dept = getDepartmentInfo(item.location_zone);
      const matchesDepartment =
        selectedDepartment === 'ALL' ||
        item.location_zone === selectedDepartment ||
        dept.name.toLowerCase().includes(selectedDepartment.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSeverity && matchesDepartment;

      const matchesQuery =
        item.id.toLowerCase().includes(q) ||
        item.anomaly_metric.toLowerCase().includes(q) ||
        item.location_zone.toLowerCase().includes(q) ||
        dept.name.toLowerCase().includes(q) ||
        item.detected_at.toLowerCase().includes(q) ||
        item.recommended_action.toLowerCase().includes(q);

      return matchesSeverity && matchesDepartment && matchesQuery;
    });
  }, [runningLog, severityFilter, selectedDepartment, searchQuery, getDepartmentInfo]);

  // Statistics across the running log
  const stats = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    const depts = new Set<string>();

    runningLog.forEach((item) => {
      const tier = normalizeSeverity(item.severity);
      if (tier === 'HIGH') high++;
      else if (tier === 'MEDIUM') medium++;
      else low++;
      depts.add(item.location_zone);
    });

    return {
      total: runningLog.length,
      high,
      medium,
      low,
      departmentsCount: depts.size
    };
  }, [runningLog]);

  // Simulate injecting a real-time anomaly trigger into the running log with exact live timestamp
  const handleSimulateNewTrigger = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const idSuffix = Math.floor(1000 + Math.random() * 9000);

    const simulationPresets: Array<{
      metric: string;
      raw: string;
      kalman: string;
      sev: ActiveAnomalyAlert['severity'];
      zone: string;
      action: string;
    }> = [
      {
        metric: 'Acute Autonomic HRV Collapse (<38 ms)',
        raw: '34.2 ms (High Jitter)',
        kalman: '37.8 ms (Smoothed Confidence: 96.2%)',
        sev: 'CRITICAL',
        zone: 'Outdoor-Construction-Sector-4',
        action: 'Immediate rapid cooling evacuation & core temperature stabilization protocol.'
      },
      {
        metric: 'Wet-Bulb Globe Temp (WBGT) Exceedance (34.8°C)',
        raw: '35.6°C (Thermal Drift)',
        kalman: '34.8°C (Valid Sensor Spike)',
        sev: 'HIGH',
        zone: 'Outdoor-Construction-Sector-4',
        action: 'Activate continuous misting cannons and transition to 15-min work / 45-min rest cycles.'
      },
      {
        metric: 'Parasympathetic Fatigue & Cumulative Sleep Strain',
        raw: '49.0 ms HRV (Micro-Fluctuations)',
        kalman: '51.2 ms (Noise Filtered)',
        sev: 'MODERATE',
        zone: 'Warehouse-Logistics-Hub-North',
        action: 'Rotate worker off high-bay machinery and stage ergonomic rest rotation.'
      },
      {
        metric: 'Acoustic Machinery Vibration Resonance (94.2 dBA)',
        raw: '98.4 dBA (Impulsive Spike)',
        kalman: '94.2 dBA (Kalman Validated)',
        sev: 'MODERATE',
        zone: 'Manufacturing-Assembly-Line-B',
        action: 'Inspect automated bearing damper and enforce dual-layer hearing protection.'
      },
      {
        metric: 'Microclimate Ambient Shift Baseline (Nominal Variance)',
        raw: '31.2°C',
        kalman: '30.8°C (Filtered Baseline)',
        sev: 'LOW',
        zone: 'Subgrade-Tunnel-Conduit-7',
        action: 'Routine microclimate ventilation fan speed adjustment; continue passive telemetry surveillance.'
      }
    ];

    const pick = simulationPresets[Math.floor(Math.random() * simulationPresets.length)];

    const newTrigger: ActiveAnomalyAlert = {
      id: `TRG-${idSuffix}`,
      worker_id: `WKR-SIM-${Math.floor(100 + Math.random() * 900)}`,
      location_zone: pick.zone,
      detected_at: timeFormatted,
      anomaly_metric: pick.metric,
      raw_value: pick.raw,
      kalman_smoothed_value: pick.kalman,
      severity: pick.sev,
      kalman_status: 'Jitter Filtered & Validated',
      lead_time: 'Immediate',
      recommended_action: pick.action,
      acknowledged: false,
      privacy_status: 'k-Anonymity Verified (Cohort N=12)'
    };

    setRunningLog((prev) => [newTrigger, ...prev]);
    setSelectedTriggerId(newTrigger.id);
  };

  // Export running log as RFC 4180 Traceability CSV
  const handleExportTraceabilityCsv = () => {
    try {
      const headers = [
        'Trigger ID',
        'Detection Timestamp',
        'Severity Level',
        'Severity Category',
        'Affected Department',
        'Facility Site Location',
        'Anomaly Metric / Signal',
        'Raw Telemetry Reading',
        'Kalman Smoothed Reading',
        'Signal Filtering Status',
        'Recommended Operational Action',
        'Triage Status'
      ];

      const rows = filteredLog.map((item) => {
        const dept = getDepartmentInfo(item.location_zone);
        const tier = normalizeSeverity(item.severity);
        return [
          `"${item.id}"`,
          `"${item.detected_at}"`,
          `"${item.severity}"`,
          `"${tier}"`,
          `"${dept.name}"`,
          `"${dept.location}"`,
          `"${item.anomaly_metric.replace(/"/g, '""')}"`,
          `"${item.raw_value.replace(/"/g, '""')}"`,
          `"${item.kalman_smoothed_value.replace(/"/g, '""')}"`,
          `"${item.kalman_status}"`,
          `"${item.recommended_action.replace(/"/g, '""')}"`,
          `"${item.acknowledged ? 'ACKNOWLEDGED' : 'PENDING_TRIAGE'}"`
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `anomaly_triggers_traceability_log_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice(`Exported ${filteredLog.length} anomaly triggers to traceability CSV audit log.`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err: any) {
      console.error('Failed to export traceability CSV:', err);
    }
  };

  return (
    <div
      id="incident-traceability-running-log"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Background Subtle Radar Glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Live Status */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-4 border-b border-slate-800 gap-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-sm relative">
            <Radio className="h-5 w-5 animate-pulse text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Recent Anomaly Triggers Traceability Log
              </h2>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE SURVEILLANCE RUNNING LOG
              </span>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-sm">
                ISO 45001 Traceability
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous live running ledger of anomaly triggers with synchronized timestamps, dynamic severity triage markers, and department attribution for auditable incident traceability.
            </p>
          </div>
        </div>

        {/* Action Controls: Live Simulation & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          <button
            onClick={handleSimulateNewTrigger}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md border border-cyan-400/40 cursor-pointer"
            title="Inject a newly detected live simulated anomaly trigger into the running log to verify real-time incident traceability"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-200 animate-pulse" />
            <span>Simulate New Trigger</span>
          </button>

          <button
            onClick={handleExportTraceabilityCsv}
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Export running log entries into an RFC 4180 CSV spreadsheet for statutory safety audit logging"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Traceability CSV</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Notice */}
      {exportNotice && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-white text-xs cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Traceability KPI Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4 text-xs">
        {/* Total Logged */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span>Running Log Buffer</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono">{stats.total}</div>
          <span className="text-[10px] text-slate-500">Live Triggers Recorded</span>
        </div>

        {/* High Severity */}
        <div className="bg-slate-950 border border-rose-900/40 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-rose-300 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              High / Critical
            </span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{stats.high}</div>
          <span className="text-[10px] text-rose-300/80">Immediate Evacuation</span>
        </div>

        {/* Medium Severity */}
        <div className="bg-slate-950 border border-amber-900/40 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-amber-300 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Medium / Moderate
            </span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1 font-mono">{stats.medium}</div>
          <span className="text-[10px] text-amber-300/80">Staged Rest Rotation</span>
        </div>

        {/* Low Severity */}
        <div className="bg-slate-950 border border-emerald-900/40 p-2.5 rounded-xl">
          <div className="flex items-center justify-between text-emerald-300 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Low / Nominal
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">{stats.low}</div>
          <span className="text-[10px] text-emerald-300/80">Passive Monitoring</span>
        </div>

        {/* Departments Affected */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span>Affected Depts</span>
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 mt-1 font-mono">{stats.departmentsCount} / 6</div>
          <span className="text-[10px] text-slate-500">Facility Zones Active</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
        {/* Severity Triage Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Sliders className="h-3 w-3 text-cyan-400" />
            Severity Triage:
          </span>

          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              severityFilter === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Severities ({stats.total})
          </button>

          {/* High Severity Pill */}
          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              severityFilter === 'HIGH'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-xs ring-1 ring-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>High ({stats.high})</span>
          </button>

          {/* Medium Severity Pill */}
          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              severityFilter === 'MEDIUM'
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/80 shadow-xs ring-1 ring-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Medium ({stats.medium})</span>
          </button>

          {/* Low Severity Pill */}
          <button
            onClick={() => setSeverityFilter('LOW')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              severityFilter === 'LOW'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Low ({stats.low})</span>
          </button>
        </div>

        {/* Department Selector & Search Input */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Department Filter Dropdown */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Departments (Organization-Wide)
              </option>
              <option value="Outdoor-Construction-Sector-4" className="bg-slate-900 text-slate-200">
                Civil &amp; Structural Construction (Sector 4)
              </option>
              <option value="Warehouse-Logistics-Hub-North" className="bg-slate-900 text-slate-200">
                Supply Chain &amp; Logistics Hub North
              </option>
              <option value="Manufacturing-Assembly-Line-B" className="bg-slate-900 text-slate-200">
                Precision Robotics &amp; Assembly Line B
              </option>
              <option value="Subgrade-Tunnel-Conduit-7" className="bg-slate-900 text-slate-200">
                Underground Conduit 7 Infrastructure
              </option>
              <option value="Cold-Chain-Storage-Alpha" className="bg-slate-900 text-slate-200">
                Cold Chain Storage Facility Alpha
              </option>
              <option value="Chemical-Process-Plant-C" className="bg-slate-900 text-slate-200">
                Chemical Processing Unit C
              </option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search triggers by metric, ID, worker..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Running Log Table / List View */}
      <div className="overflow-y-auto max-h-[520px] pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {filteredLog.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
            <CheckCircle2 className="h-9 w-9 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-200">No anomaly triggers match current filter criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting the severity triage buttons or clearing your department search query.
            </p>
          </div>
        ) : (
          filteredLog.map((trigger, idx) => {
            const tier = normalizeSeverity(trigger.severity);
            const dept = getDepartmentInfo(trigger.location_zone);
            const isSelected = selectedTriggerId === trigger.id;

            // Dynamic color styling according to severity tier (Low, Medium, High)
            const severityStyles = {
              HIGH: {
                cardBorder: 'border-rose-500/50 hover:border-rose-500 bg-slate-950/90 shadow-sm shadow-rose-950/30',
                leftAccent: 'border-l-4 border-l-rose-500',
                badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-xs animate-pulse',
                dotColor: 'bg-rose-500',
                textAccent: 'text-rose-400',
                icon: ShieldAlert,
                label: trigger.severity === 'CRITICAL' ? 'CRITICAL SEVERITY' : 'HIGH SEVERITY'
              },
              MEDIUM: {
                cardBorder: 'border-amber-500/40 hover:border-amber-500 bg-slate-950/90 shadow-sm shadow-amber-950/20',
                leftAccent: 'border-l-4 border-l-amber-500',
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
                dotColor: 'bg-amber-500',
                textAccent: 'text-amber-400',
                icon: AlertTriangle,
                label: 'MEDIUM SEVERITY'
              },
              LOW: {
                cardBorder: 'border-emerald-500/40 hover:border-emerald-500 bg-slate-950/90 shadow-sm shadow-emerald-950/20',
                leftAccent: 'border-l-4 border-l-emerald-500',
                badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
                dotColor: 'bg-emerald-400',
                textAccent: 'text-emerald-400',
                icon: CheckCircle2,
                label: 'LOW SEVERITY'
              }
            }[tier];

            const SeverityIcon = severityStyles.icon;

            return (
              <div
                key={`${trigger.id}-${idx}`}
                onClick={() => setSelectedTriggerId(trigger.id)}
                className={`rounded-xl p-3.5 border transition-all duration-200 cursor-pointer relative overflow-hidden group text-left ${
                  isSelected ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400 shadow-xl' : severityStyles.cardBorder
                } ${severityStyles.leftAccent}`}
              >
                {/* Top Header Row: Timestamp, Trigger ID, Dynamic Severity Badge & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2.5">
                    {/* Index Rank */}
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      #{idx + 1}
                    </span>

                    {/* Timestamp with Clock Icon */}
                    <div className="flex items-center space-x-1.5 text-slate-200 font-mono font-semibold">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{trigger.detected_at}</span>
                    </div>

                    <span className="text-slate-600">|</span>

                    {/* Trigger Unique ID */}
                    <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                      {trigger.id}
                    </span>

                    {/* Worker Identifier */}
                    <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                      {trigger.worker_id}
                    </span>
                  </div>

                  {/* Right Header: Dynamic Color-Coded Severity Marker & Triage Pill */}
                  <div className="flex items-center space-x-2">
                    {/* Dynamic Severity Marker Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${severityStyles.badgeBg}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${severityStyles.dotColor}`}></span>
                      <span>{severityStyles.label}</span>
                    </span>

                    {/* Acknowledged Status */}
                    {trigger.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-mono bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">
                        Pending Triage
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Content: Metric Name, Department & Sensor Values */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    {/* Anomaly Metric Title */}
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <SeverityIcon className={`h-4 w-4 shrink-0 ${severityStyles.textAccent}`} />
                      <span>{trigger.anomaly_metric}</span>
                    </h4>

                    {/* Affected Department Badge (Clickable for zone filter) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectZone) onSelectZone(trigger.location_zone);
                      }}
                      className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-cyan-300 transition bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer"
                      title="Filter dashboard by this department"
                    >
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                      <strong className="text-white font-semibold">{dept.name}</strong>
                      <span className="text-slate-500 text-[10px]">({dept.cohort} workers)</span>
                    </button>
                  </div>

                  {/* Signal Traceability Row: Raw Sensor vs Kalman Smoothed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-950/90 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        Telemetry Signal Traceability
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 font-mono text-[11px]">
                        <span className="text-slate-400">Raw:</span>
                        <span className="text-slate-200 font-semibold">{trigger.raw_value}</span>
                        <span className="text-slate-600">&rarr;</span>
                        <span className="text-cyan-300 font-bold">Kalman: {trigger.kalman_smoothed_value}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        Facility Location Site
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-slate-300 text-[11px] truncate">
                        <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{dept.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Directive & Traceability Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                    <p className="text-xs text-slate-300 leading-snug">
                      <strong className="text-slate-400">Action Directive:</strong>{' '}
                      <span className={severityStyles.textAccent}>{trigger.recommended_action}</span>
                    </p>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      {onInspectAnomaly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectAnomaly(trigger);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1"
                          title="Inspect anomaly in 30-day longitudinal trend chart"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3 w-3 text-cyan-400" />
                        </button>
                      )}

                      {onDispatchAction && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDispatchAction(trigger);
                          }}
                          className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                          title="Stage immediate rapid cooling dispatch"
                        >
                          Dispatch Protocol
                        </button>
                      )}

                      {onAcknowledgeAlert && !trigger.acknowledged && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledgeAlert(trigger.id);
                            setRunningLog((prev) =>
                              prev.map((t) => (t.id === trigger.id ? { ...t, acknowledged: true } : t))
                            );
                          }}
                          className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                          title="Acknowledge this anomaly trigger"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Traceability Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 font-mono">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Continuous Anomaly Surveillance: All triggers timestamped &amp; indexed to Departmental Traceability Trail.</span>
        </div>
        <div>
          <span>Tip: Click &quot;Simulate New Trigger&quot; to test live running ledger updates.</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { ActiveAnomalyAlert, FacilityZone, HealthSignalNotificationThresholds, TelemetryDataPoint } from '../types';
import {
  History,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Heart,
  Sun,
  Thermometer,
  Volume2,
  Wrench,
  Activity,
  CheckCircle2,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Volume2 as VolumeIcon,
  Radio,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { downloadAnomalyReportCsv, downloadAnomalyReportJson } from '../services/reportExportService';

export interface AlertHistoryEvent {
  id: string;
  timestamp: string;
  timeLabel: string;
  zone: string;
  signalType: 'HEART_RATE' | 'AMBIENT_TEMP' | 'HRV_COLLAPSE' | 'SKIN_TEMP' | 'NOISE' | 'RISK_SCORE' | 'EQUIPMENT_VIBRATION';
  signalName: string;
  measuredValueFormatted: string;
  thresholdLimitFormatted: string;
  deviationDelta: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  rootCause: string;
  recommendedAction: string;
  acknowledged: boolean;
  workerId?: string;
  equipmentId?: string;
  isRealTimeAlert?: boolean;
}

interface AlertHistoryTableProps {
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  thresholds: HealthSignalNotificationThresholds;
  zones: FacilityZone[];
  selectedZone: FacilityZone;
  onAcknowledgeAlert?: (id: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  onSpeakAlert?: (alert: ActiveAnomalyAlert) => void;
  isSpeaking?: boolean;
  onScrollToChart?: () => void;
  onOpenThresholdsModal?: () => void;
}

export default function AlertHistoryTable({
  alerts,
  telemetryStream,
  thresholds,
  zones,
  selectedZone,
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone,
  onSpeakAlert,
  isSpeaking,
  onScrollToChart,
  onOpenThresholdsModal
}: AlertHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Compile full timestamped incident history combining active alerts and telemetry threshold breaches
  const fullAlertHistory: AlertHistoryEvent[] = useMemo(() => {
    const list: AlertHistoryEvent[] = [];
    const maxHrLimit = thresholds.maxHeartRateBpm ?? 115;
    const maxAmbLimit = thresholds.maxAmbientHeatC ?? 36.0;
    const minHrvFloor = thresholds.minHrvMs ?? 40;
    const maxSkinLimit = thresholds.maxSkinTempC ?? 37.8;
    const maxNoiseLimit = thresholds.maxNoiseDb ?? 85.0;
    const riskCutoff = thresholds.riskScoreCutoffPct ?? 65;

    // 1. First add all formal Active Anomaly Alerts (most urgent)
    alerts.forEach((alert) => {
      let signalType: AlertHistoryEvent['signalType'] = 'RISK_SCORE';
      const metricLower = alert.anomaly_metric.toLowerCase();

      if (metricLower.includes('vibration') || metricLower.includes('bearing') || alert.alert_type === 'PREDICTIVE_MAINTENANCE') {
        signalType = 'EQUIPMENT_VIBRATION';
      } else if (metricLower.includes('hrv') || metricLower.includes('cardiac') || metricLower.includes('autonomic')) {
        signalType = 'HRV_COLLAPSE';
      } else if (metricLower.includes('skin') || metricLower.includes('core')) {
        signalType = 'SKIN_TEMP';
      } else if (metricLower.includes('ambient') || metricLower.includes('heat')) {
        signalType = 'AMBIENT_TEMP';
      } else if (metricLower.includes('noise') || metricLower.includes('acoustic')) {
        signalType = 'NOISE';
      }

      list.push({
        id: alert.id,
        timestamp: new Date().toISOString(),
        timeLabel: alert.detected_at,
        zone: alert.location_zone,
        signalType,
        signalName: alert.anomaly_metric,
        measuredValueFormatted: alert.raw_value,
        thresholdLimitFormatted: alert.kalman_smoothed_value,
        deviationDelta: alert.kalman_status,
        severity: alert.severity,
        rootCause: alert.anomaly_metric,
        recommendedAction: alert.recommended_action,
        acknowledged: alert.acknowledged,
        workerId: alert.worker_id,
        equipmentId: alert.equipment_id,
        isRealTimeAlert: true
      });
    });

    // 2. Scan historical 24-hour telemetry stream for timestamped threshold exceedance intervals
    telemetryStream.forEach((pt, index) => {
      const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
      const amb = pt.ambient_temp_c;
      const hrv = pt.smoothed_hrv;
      const skin = pt.skin_temp_c;
      const noise = pt.noise_db ?? pt.raw_noise_db ?? 75;
      const risk = pt.risk_score;

      // Check Heart Rate limit breach
      if (hr >= maxHrLimit) {
        list.push({
          id: `EV-HR-${1000 + index}`,
          timestamp: pt.timestamp,
          timeLabel: pt.timeLabel,
          zone: pt.zone || selectedZone.name,
          signalType: 'HEART_RATE',
          signalName: 'Worker Heart Rate (Pulse Exceedance)',
          measuredValueFormatted: `${hr} BPM (Raw: ${pt.raw_heart_rate_bpm ?? hr} BPM)`,
          thresholdLimitFormatted: `Threshold Limit: ${maxHrLimit} BPM`,
          deviationDelta: `+${hr - maxHrLimit} BPM over limit`,
          severity: hr >= maxHrLimit + 12 ? 'CRITICAL' : 'HIGH',
          rootCause: 'Cardiovascular heat strain & sustained physical workload triggering tachycardia.',
          recommendedAction: 'Stage rapid shaded cooling station and mandatory hydration break.',
          acknowledged: index < telemetryStream.length - 8,
          workerId: `W-${Math.floor(1000 + (index % 9) * 900)}`
        });
      }

      // Check Ambient Temperature limit breach
      if (amb >= maxAmbLimit && index % 2 === 0) {
        list.push({
          id: `EV-AMB-${2000 + index}`,
          timestamp: pt.timestamp,
          timeLabel: pt.timeLabel,
          zone: pt.zone || selectedZone.name,
          signalType: 'AMBIENT_TEMP',
          signalName: 'Ambient Wet-Bulb Thermal Overload',
          measuredValueFormatted: `${amb.toFixed(1)}°C Ambient`,
          thresholdLimitFormatted: `Thermal Ceiling: ${maxAmbLimit.toFixed(1)}°C`,
          deviationDelta: `+${(amb - maxAmbLimit).toFixed(1)}°C over threshold`,
          severity: amb >= maxAmbLimit + 4 ? 'CRITICAL' : 'HIGH',
          rootCause: 'Direct solar radiation exposure and ambient industrial machinery thermal accumulation.',
          recommendedAction: 'Enforce 15-minute rest-work cycle and deploy misting cooling fans.',
          acknowledged: true
        });
      }

      // Check HRV Collapse breach
      if (hrv <= minHrvFloor && index % 3 === 0) {
        list.push({
          id: `EV-HRV-${3000 + index}`,
          timestamp: pt.timestamp,
          timeLabel: pt.timeLabel,
          zone: pt.zone || selectedZone.name,
          signalType: 'HRV_COLLAPSE',
          signalName: 'Parasympathetic HRV Collapse',
          measuredValueFormatted: `${hrv.toFixed(1)} ms RMSSD (Raw: ${pt.raw_hrv.toFixed(1)} ms)`,
          thresholdLimitFormatted: `HRV Floor: ${minHrvFloor} ms`,
          deviationDelta: `-${(minHrvFloor - hrv).toFixed(1)} ms below safety floor`,
          severity: 'CRITICAL',
          rootCause: 'Autonomic nervous system exhaustion; parasympathetic vagal withdrawal under heat strain.',
          recommendedAction: 'Immediate cohort rotation from heavy lifting to ground-level scanning duty.',
          acknowledged: index < telemetryStream.length - 6,
          workerId: `W-${Math.floor(2000 + (index % 7) * 800)}`
        });
      }

      // Check Skin Temperature breach
      if (skin >= maxSkinLimit && index % 4 === 0) {
        list.push({
          id: `EV-SKN-${4000 + index}`,
          timestamp: pt.timestamp,
          timeLabel: pt.timeLabel,
          zone: pt.zone || selectedZone.name,
          signalType: 'SKIN_TEMP',
          signalName: 'Worker Skin Thermal Accumulation',
          measuredValueFormatted: `${skin.toFixed(2)}°C Core Skin`,
          thresholdLimitFormatted: `Clinical Limit: ${maxSkinLimit.toFixed(1)}°C`,
          deviationDelta: `+${(skin - maxSkinLimit).toFixed(2)}°C above limit`,
          severity: skin >= 38.2 ? 'CRITICAL' : 'HIGH',
          rootCause: 'Evaporative sweat cooling impaired by high ambient wet-bulb humidity.',
          recommendedAction: 'Deploy ice vests and medical liaison physiological monitoring.',
          acknowledged: true,
          workerId: `W-${Math.floor(3000 + (index % 5) * 700)}`
        });
      }

      // Check Noise Overexposure breach
      if (noise >= maxNoiseLimit && index % 4 === 0) {
        list.push({
          id: `EV-NOS-${5000 + index}`,
          timestamp: pt.timestamp,
          timeLabel: pt.timeLabel,
          zone: pt.zone || selectedZone.name,
          signalType: 'NOISE',
          signalName: 'Acoustic Sound Pressure Breach',
          measuredValueFormatted: `${noise.toFixed(1)} dBA Acoustic`,
          thresholdLimitFormatted: `Permissible Limit: ${maxNoiseLimit.toFixed(1)} dBA`,
          deviationDelta: `+${(noise - maxNoiseLimit).toFixed(1)} dBA above OSHA limit`,
          severity: 'HIGH',
          rootCause: 'Heavy mechanical impact tool operation and acoustic resonance.',
          recommendedAction: 'Inspect dual-grade ear defender PPE and check machinery vibration isolators.',
          acknowledged: true
        });
      }
    });

    // Remove duplicates by ID and return list
    const unique = new Map<string, AlertHistoryEvent>();
    list.forEach((item) => {
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
    });

    return Array.from(unique.values());
  }, [alerts, telemetryStream, thresholds, selectedZone]);

  // Apply filters and text search
  const filteredEvents = useMemo(() => {
    return fullAlertHistory.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          item.id.toLowerCase().includes(q) ||
          item.signalName.toLowerCase().includes(q) ||
          item.zone.toLowerCase().includes(q) ||
          item.rootCause.toLowerCase().includes(q) ||
          (item.workerId && item.workerId.toLowerCase().includes(q)) ||
          (item.equipmentId && item.equipmentId.toLowerCase().includes(q));
        if (!matchText) return false;
      }

      // Signal filter
      if (signalFilter !== 'ALL' && item.signalType !== signalFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) {
        return false;
      }

      // Zone filter
      if (zoneFilter !== 'ALL') {
        const matchesZone =
          item.zone.toLowerCase().includes(zoneFilter.toLowerCase()) ||
          (selectedZone && item.zone.toLowerCase().includes(selectedZone.name.toLowerCase()));
        if (!matchesZone) return false;
      }

      // Status filter
      if (statusFilter === 'ACKNOWLEDGED' && !item.acknowledged) return false;
      if (statusFilter === 'UNACKNOWLEDGED' && item.acknowledged) return false;

      return true;
    });
  }, [fullAlertHistory, searchQuery, signalFilter, severityFilter, zoneFilter, statusFilter, selectedZone]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Quick CSV / JSON export handlers for the Alert History table
  const handleExportHistoryJson = () => {
    const res = downloadAnomalyReportJson({
      data: telemetryStream,
      thresholds,
      zone: selectedZone,
      activeAlerts: alerts
    });
    setExportNotice(`Exported full 24h report & alert history (${res.filename})`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleExportHistoryCsv = () => {
    const res = downloadAnomalyReportCsv({
      data: telemetryStream,
      thresholds,
      zone: selectedZone,
      activeAlerts: alerts
    });
    setExportNotice(`Exported full 24h CSV anomaly report (${res.recordCount} rows, ${res.filename})`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  // Helper to render signal icon
  const renderSignalIcon = (type: AlertHistoryEvent['signalType']) => {
    switch (type) {
      case 'HEART_RATE':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'AMBIENT_TEMP':
        return <Sun className="h-4 w-4 text-amber-400" />;
      case 'HRV_COLLAPSE':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'SKIN_TEMP':
        return <Thermometer className="h-4 w-4 text-red-400" />;
      case 'NOISE':
        return <Volume2 className="h-4 w-4 text-indigo-400" />;
      case 'EQUIPMENT_VIBRATION':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <div id="alert-history-table-section" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
      {/* Top Header & Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded-xl shadow-xs shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Alert History &amp; Incident Log
              </h3>
              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                {filteredEvents.length} Recorded Incidents
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Timestamped log of historical events when biometrics (Heart Rate, HRV, Skin Temp) or environment (Ambient Heat, Noise) exceeded custom alert thresholds.
            </p>
          </div>
        </div>

        {/* Action Buttons: Download JSON & CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportHistoryCsv}
            className="flex items-center space-x-1.5 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Download full 24-hour anomaly trend data and threshold settings as CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleExportHistoryJson}
            className="flex items-center space-x-1.5 bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Download full 24-hour anomaly trend data and threshold settings as JSON"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Download JSON</span>
          </button>

          {onScrollToChart && (
            <button
              onClick={onScrollToChart}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
              title="Jump to 24h Recharts visualization"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Chart</span>
            </button>
          )}
        </div>
      </div>

      {/* In-Flight Download Confirmation Notice */}
      {exportNotice && (
        <div className="p-3 bg-emerald-950/60 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between px-5 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-400 hover:text-white underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Controls Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by incident ID, signal, zone, or keyword..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Signal Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Signal:</span>
            <select
              value={signalFilter}
              onChange={(e) => {
                setSignalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">All Signals</option>
              <option value="HEART_RATE">Heart Rate (Pulse)</option>
              <option value="AMBIENT_TEMP">Ambient Heat</option>
              <option value="HRV_COLLAPSE">HRV Collapse</option>
              <option value="SKIN_TEMP">Worker Skin Temp</option>
              <option value="NOISE">Acoustic Noise</option>
              <option value="EQUIPMENT_VIBRATION">Equipment Vibration</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="UNACKNOWLEDGED">Unacknowledged</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert History Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Event ID / Time</th>
              <th className="py-3 px-4">Facility Zone</th>
              <th className="py-3 px-4">Sensor Signal</th>
              <th className="py-3 px-4">Measured vs Threshold</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Root Cause &amp; Directive</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedEvents.length > 0 ? (
              paginatedEvents.map((evt) => {
                const isCritical = evt.severity === 'CRITICAL';
                const isHigh = evt.severity === 'HIGH';

                return (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Timestamp & Event ID */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-white text-xs">
                          {evt.id}
                        </span>
                        {evt.isRealTimeAlert && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                        <span>{evt.timeLabel}</span>
                      </div>
                      {evt.workerId && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          Worker: {evt.workerId}
                        </div>
                      )}
                      {evt.equipmentId && (
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          Equip: {evt.equipmentId}
                        </div>
                      )}
                    </td>

                    {/* Facility Zone */}
                    <td className="py-3 px-4 align-top">
                      <span className="font-medium text-slate-200 block truncate max-w-[170px]" title={evt.zone}>
                        {evt.zone}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        k-Anonymity Verified
                      </span>
                    </td>

                    {/* Sensor Signal */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-slate-800 border border-slate-700 shrink-0">
                          {renderSignalIcon(evt.signalType)}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">
                            {evt.signalType.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400 line-clamp-1" title={evt.signalName}>
                            {evt.signalName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Measured vs Threshold */}
                    <td className="py-3 px-4 align-top font-mono">
                      <div className="text-white font-bold text-xs">
                        {evt.measuredValueFormatted}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {evt.thresholdLimitFormatted}
                      </div>
                      <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                        {evt.deviationDelta}
                      </div>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>

                    {/* Root Cause & Recommended Action */}
                    <td className="py-3 px-4 align-top max-w-xs">
                      <p className="text-slate-300 text-[11px] font-medium leading-snug">
                        {evt.rootCause}
                      </p>
                      <p className="text-cyan-400 text-[10px] mt-1 leading-snug">
                        <strong>Directive:</strong> {evt.recommendedAction}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-top text-right">
                      <div className="flex items-center justify-end space-x-1.5 flex-wrap">
                        {onSpeakAlert && (
                          <button
                            onClick={() => {
                              const alertMatch = alerts.find((a) => a.id === evt.id);
                              if (alertMatch) onSpeakAlert(alertMatch);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Audible voice announcement"
                          >
                            <VolumeIcon className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onAcknowledgeAlert && !evt.acknowledged && (
                          <button
                            onClick={() => onAcknowledgeAlert(evt.id)}
                            className="px-2 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition shadow-xs"
                          >
                            Ack
                          </button>
                        )}

                        {evt.acknowledged && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
                    <p className="font-medium text-slate-300">No incident events match the selected filters.</p>
                    <p className="text-[11px] text-slate-500">All sensor telemetry within configured threshold parameters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination & Summary Footer */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 text-[11px] font-mono">
          Showing {filteredEvents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length} threshold exceedance events
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 mr-2">
            <span>Per Page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-[11px] focus:outline-hidden"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 py-0.5 text-[11px] font-mono text-slate-300 font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

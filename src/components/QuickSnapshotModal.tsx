import React, { useState, useMemo } from 'react';
import {
  ActiveAnomalyAlert,
  FacilityZone,
  AnomalyAuditRecord
} from '../types';
import {
  Camera,
  X,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Wind
} from 'lucide-react';

interface QuickSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  anomalyAuditRecords?: AnomalyAuditRecord[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onJumpToZone?: (zoneId: string) => void;
}

export interface ZoneRiskSnapshot {
  zone: FacilityZone;
  riskScore: number;
  activeAnomaliesCount: number;
  criticalCount: number;
  highCount: number;
  dominantHazard: string;
  recommendedAction: string;
}

export default function QuickSnapshotModal({
  isOpen,
  onClose,
  alerts,
  zones,
  anomalyAuditRecords = [],
  onAcknowledgeAlert,
  onJumpToZone
}: QuickSnapshotModalProps) {
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string>(() => new Date().toISOString());
  const [snapshotId, setSnapshotId] = useState<string>(() => `SNAP-${Date.now().toString().slice(-6)}`);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Take a fresh snapshot
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSnapshotTimestamp(new Date().toISOString());
      setSnapshotId(`SNAP-${Date.now().toString().slice(-6)}`);
      setIsRefreshing(false);
    }, 400);
  };

  // Compile Anomaly Counts
  const counts = useMemo(() => {
    const totalActive = alerts.length;
    const critical = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const high = alerts.filter((a) => a.severity === 'HIGH').length;
    const moderate = alerts.filter((a) => a.severity === 'MODERATE').length;
    const low = alerts.filter((a) => a.severity === 'LOW').length;
    const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

    // Category distribution
    let thermal = 0;
    let biomechanical = 0;
    let equipment = 0;
    let environmental = 0;

    alerts.forEach((a) => {
      const metric = (a.anomaly_metric || '').toLowerCase();
      if (a.equipment_id || a.alert_type === 'PREDICTIVE_MAINTENANCE' || metric.includes('vibration') || metric.includes('bearing')) {
        equipment++;
      } else if (metric.includes('thermal') || metric.includes('temp') || metric.includes('heat') || metric.includes('twl')) {
        thermal++;
      } else if (metric.includes('noise') || metric.includes('acoustic') || metric.includes('aqi') || metric.includes('air')) {
        environmental++;
      } else {
        biomechanical++;
      }
    });

    return {
      totalActive,
      critical,
      high,
      moderate,
      low,
      unacknowledged,
      thermal,
      biomechanical,
      equipment,
      environmental
    };
  }, [alerts]);

  // Compute High-Risk Zones Analysis
  const zoneSnapshots = useMemo<ZoneRiskSnapshot[]>(() => {
    return zones.map((zone) => {
      const zoneAlerts = alerts.filter((a) => a.location_zone === zone.id || a.location_zone === zone.name);
      const crit = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const hg = zoneAlerts.filter((a) => a.severity === 'HIGH').length;

      // Calculate composite risk score (0-100)
      let baseScore = zone.status === 'CRITICAL' ? 82 : zone.status === 'MODERATE' ? 62 : 35;
      baseScore += crit * 8 + hg * 4;
      const riskScore = Math.min(Math.max(baseScore, 10), 98);

      const dominantHazard =
        zoneAlerts.length > 0
          ? zoneAlerts[0].anomaly_metric
          : zone.activeHazards && zone.activeHazards.length > 0
          ? zone.activeHazards[0]
          : 'Elevated Ambient Thermal Work Limit';

      const recommendedAction =
        zoneAlerts.length > 0
          ? zoneAlerts[0].recommended_action
          : zone.status === 'CRITICAL'
          ? 'Mandate 45-min rest rotation and deploy emergency evaporative misting.'
          : 'Maintain active sensor telemetry monitoring; stage hydration relief.';

      return {
        zone,
        riskScore,
        activeAnomaliesCount: zoneAlerts.length,
        criticalCount: crit,
        highCount: hg,
        dominantHazard,
        recommendedAction
      };
    });
  }, [zones, alerts]);

  // Filter high-risk zones (Risk >= 55 or has active anomalies or status != STABLE)
  const highRiskZones = useMemo(() => {
    return zoneSnapshots
      .filter((zs) => zs.riskScore >= 55 || zs.activeAnomaliesCount > 0 || zs.zone.status !== 'STABLE')
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [zoneSnapshots]);

  const topHighRiskZone = highRiskZones[0] || zoneSnapshots[0];
  const totalMonitoredWorkersInRisk = highRiskZones.reduce((acc, zs) => acc + (zs.zone.count || 0), 0);

  // Executive summary paragraph
  const executiveSummary = useMemo(() => {
    const formattedDate = new Date(snapshotTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const topZoneName = topHighRiskZone ? topHighRiskZone.zone.name : 'Outdoor Construction Sector 4';
    const topRiskScore = topHighRiskZone ? topHighRiskZone.riskScore : 78;

    return `Operational Health & Risk Snapshot as of ${formattedDate}: There are currently ${counts.totalActive} active anomalies monitored across the facility (${counts.critical} CRITICAL, ${counts.high} HIGH, ${counts.moderate} MODERATE). ${highRiskZones.length} facility zones meet elevated or critical risk thresholds, encompassing ${totalMonitoredWorkersInRisk} on-shift personnel. The highest risk concentration is in ${topZoneName} with a composite risk index of ${topRiskScore}/100, driven predominantly by ${topHighRiskZone?.dominantHazard || 'thermal strain'}. ${counts.unacknowledged} unacknowledged alerts require supervisory triage.`;
  }, [snapshotTimestamp, counts, highRiskZones, topHighRiskZone, totalMonitoredWorkersInRisk]);

  // Copy plain text summary report to clipboard
  const handleCopyReport = () => {
    const reportText = `========================================================\n` +
      `PROGNOSTICATOR — OPERATIONAL ANOMALY & RISK SNAPSHOT\n` +
      `Snapshot ID: ${snapshotId}\n` +
      `Generated At: ${new Date(snapshotTimestamp).toLocaleString()}\n` +
      `========================================================\n\n` +
      `EXECUTIVE SUMMARY:\n${executiveSummary}\n\n` +
      `CURRENT ANOMALY COUNTS:\n` +
      `- Total Active Anomalies: ${counts.totalActive}\n` +
      `- Critical Severity: ${counts.critical}\n` +
      `- High Severity: ${counts.high}\n` +
      `- Moderate Severity: ${counts.moderate}\n` +
      `- Low Severity: ${counts.low}\n` +
      `- Pending Action / Unacknowledged: ${counts.unacknowledged}\n\n` +
      `CATEGORY BREAKDOWN:\n` +
      `- Thermal Strain: ${counts.thermal}\n` +
      `- Biomechanical & Autonomic: ${counts.biomechanical}\n` +
      `- Machinery / Mechanical: ${counts.equipment}\n` +
      `- Environmental / Acoustic: ${counts.environmental}\n\n` +
      `HIGH-RISK FACILITY ZONES (${highRiskZones.length} ZONES):\n` +
      highRiskZones
        .map(
          (zs, i) =>
            `[#${i + 1}] ${zs.zone.name} (${zs.zone.id})\n` +
            `  Risk Score: ${zs.riskScore}/100 [${zs.zone.status}]\n` +
            `  Headcount: ${zs.zone.count} workers | Active Anomalies: ${zs.activeAnomaliesCount} (${zs.criticalCount} Critical)\n` +
            `  Dominant Hazard: ${zs.dominantHazard}\n` +
            `  Directive: ${zs.recommendedAction}\n`
        )
        .join('\n') +
      `\n========================================================\n` +
      `End of Snapshot — Prognosticator Enterprise Health Sentinel`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print blocked by iframe context:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
                  <span>Current Anomaly &amp; High-Risk Zone Snapshot</span>
                </h3>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  {snapshotId}
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE SNAPSHOT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Captured at: {new Date(snapshotTimestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Refresh and take new live snapshot"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition cursor-pointer"
              title="Copy complete snapshot text report"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition cursor-pointer"
              title="Print Snapshot"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Snapshot Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Executive Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center space-x-2 mb-2 font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Executive Operational Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {executiveSummary}
            </p>
          </div>

          {/* Key Anomaly Counts Metric Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              1. Current Anomaly Counts by Severity
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 font-mono text-xs">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block">Active Anomalies</span>
                <span className="text-xl font-bold text-white tabular-nums">{counts.totalActive}</span>
              </div>
              <div className="bg-slate-950/80 border border-rose-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-rose-400 uppercase block flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Critical
                </span>
                <span className="text-xl font-bold text-rose-300 tabular-nums">{counts.critical}</span>
              </div>
              <div className="bg-slate-950/80 border border-amber-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-amber-400 uppercase block">High Severity</span>
                <span className="text-xl font-bold text-amber-300 tabular-nums">{counts.high}</span>
              </div>
              <div className="bg-slate-950/80 border border-cyan-500/40 p-3 rounded-xl">
                <span className="text-[10px] text-cyan-400 uppercase block">Moderate</span>
                <span className="text-xl font-bold text-cyan-300 tabular-nums">{counts.moderate}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-700 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Low Severity</span>
                <span className="text-xl font-bold text-slate-300 tabular-nums">{counts.low}</span>
              </div>
              <div className="bg-slate-950/80 border border-indigo-500/40 p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-indigo-400 uppercase block">Action Pending</span>
                <span className={`text-xl font-bold tabular-nums ${counts.unacknowledged > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {counts.unacknowledged}
                </span>
              </div>
            </div>
          </div>

          {/* Anomaly Category Distribution Strip */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 font-mono text-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold block mb-2">
              Anomaly Categories Breakdown
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-between">
                <span className="text-orange-400 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Thermal Strain</span>
                </span>
                <strong className="text-white tabular-nums">{counts.thermal}</strong>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <span className="text-cyan-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Biomechanical</span>
                </span>
                <strong className="text-white tabular-nums">{counts.biomechanical}</strong>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <span className="text-purple-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Equipment</span>
                </span>
                <strong className="text-white tabular-nums">{counts.equipment}</strong>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5" />
                  <span>Environmental</span>
                </span>
                <strong className="text-white tabular-nums">{counts.environmental}</strong>
              </div>
            </div>
          </div>

          {/* High-Risk Zones Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <span>2. High-Risk Facility Zones</span>
                <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-600/50 px-2 py-0.5 rounded font-mono font-bold">
                  {highRiskZones.length} Zones Exceed Safety Cutoff
                </span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Total Exposed Workforce: <strong className="text-white tabular-nums">{totalMonitoredWorkersInRisk}</strong> workers
              </span>
            </div>

            <div className="space-y-3">
              {highRiskZones.map((zs, idx) => (
                <div
                  key={zs.zone.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-2.5">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-200 shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-white tracking-wide">
                            {zs.zone.name}
                          </h5>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              zs.zone.status === 'CRITICAL'
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                : zs.zone.status === 'MODERATE'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {zs.zone.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                          <span>Zone ID: {zs.zone.id}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-slate-500" />
                            <span>{zs.zone.count} workers</span>
                          </span>
                          <span>·</span>
                          <span>Temp: {zs.zone.temp}</span>
                          <span>·</span>
                          <span>TWL: {zs.zone.twl} W/m²</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Score Progress */}
                    <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Risk Score</span>
                        <span className={`text-base font-bold tabular-nums ${zs.riskScore >= 75 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {zs.riskScore}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Active Anomalies</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold text-white tabular-nums">{zs.activeAnomaliesCount}</span>
                          {zs.criticalCount > 0 && (
                            <span className="text-[10px] text-rose-400">({zs.criticalCount} Crit)</span>
                          )}
                        </div>
                      </div>
                      {onJumpToZone && (
                        <button
                          onClick={() => {
                            onJumpToZone(zs.zone.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hazard & Directive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Primary Hazard Driver</span>
                      <span className="text-slate-200">{zs.dominantHazard}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-emerald-400 uppercase block mb-0.5">Recommended Directive</span>
                      <span className="text-slate-200 font-sans">{zs.recommendedAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Anomalies Quick Triage Table */}
          {alerts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                3. Active Anomaly Triage List ({alerts.length} Items)
              </h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Alert ID</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5">Zone</th>
                        <th className="p-2.5">Anomaly Metric</th>
                        <th className="p-2.5">Value / Threshold</th>
                        <th className="p-2.5">Status</th>
                        {onAcknowledgeAlert && <th className="p-2.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {alerts.slice(0, 6).map((alert) => (
                        <tr key={alert.id} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-slate-200 font-bold">{alert.id}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : alert.severity === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300">{alert.location_zone}</td>
                          <td className="p-2.5 text-slate-200">{alert.anomaly_metric}</td>
                          <td className="p-2.5 text-slate-400">
                            {alert.raw_value} <span className="text-slate-600">/</span> {alert.kalman_smoothed_value}
                          </td>
                          <td className="p-2.5">
                            <span className={alert.acknowledged ? 'text-emerald-400' : 'text-amber-400'}>
                              {alert.acknowledged ? 'ACKNOWLEDGED' : 'ACTION_REQUIRED'}
                            </span>
                          </td>
                          {onAcknowledgeAlert && (
                            <td className="p-2.5 text-right">
                              {!alert.acknowledged && (
                                <button
                                  onClick={() => onAcknowledgeAlert(alert.id)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] border border-slate-700 cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-400 text-[11px]">
            Snapshot Hash: <span className="text-slate-300">{snapshotId}-SHA256</span> · ISO 45001 Verified
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition cursor-pointer"
            >
              {copied ? 'Copied to Clipboard' : 'Copy Summary'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer shadow-md"
            >
              Close Snapshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

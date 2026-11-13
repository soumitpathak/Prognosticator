import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  ShieldAlert,
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  Flame,
  Volume2,
  Heart,
  Lock,
  ArrowRight,
  UserCheck,
  Printer,
  Sparkles,
  Zap,
  Radio
} from 'lucide-react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  SafetyOfficer,
  MaintenanceTicket,
  SystemAuditLogEntry,
  ShiftHandoverReport
} from '../types';
import { maintenanceSchedulingService } from '../services/maintenanceSchedulingService';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  officers: SafetyOfficer[];
  onLogAudit?: (entry: SystemAuditLogEntry) => void;
  onNotice?: (msg: string) => void;
}

export default function ShiftHandoverModal({
  isOpen,
  onClose,
  zones,
  alerts,
  officers,
  onLogAudit,
  onNotice
}: ShiftHandoverModalProps) {
  const [outgoingSupervisor] = useState<string>('Outgoing Shift Supervisor (EHS Lead)');
  const [incomingSupervisor, setIncomingSupervisor] = useState<string>('Jordan Hayes (EHS Supervisor - Incoming Shift)');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [supervisorNotes, setSupervisorNotes] = useState<string>(
    'Ensure Sector 4 shaded tent hydration protocol is strictly maintained through 14:00 peak solar irradiance. Conveyor Drive Motor 4B bearing replacement requires verified LOTO tagout before mechanical technician entry.'
  );

  // Retrieve current predictive maintenance tickets
  const maintenanceTickets = useMemo(() => {
    return maintenanceSchedulingService.getTickets();
  }, [isOpen]);

  const pendingTickets = useMemo(() => {
    return maintenanceTickets.filter((t) => t.status !== 'RESOLVED');
  }, [maintenanceTickets]);

  const lotoTickets = useMemo(() => {
    return pendingTickets.filter((t) => t.lotoRequired);
  }, [pendingTickets]);

  // 8-Hour Anomaly Distribution and Trend synthesis
  const anomalyStats = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const high = alerts.filter((a) => a.severity === 'HIGH').length;
    const moderate = alerts.filter((a) => a.severity === 'MODERATE').length;
    const total = alerts.length;

    // Simulate 8-hour hourly anomaly counts for trendline
    const hourlyTrend = [
      { hour: '03:00 - 04:00', count: 0, critical: 0, high: 0 },
      { hour: '04:00 - 05:00', count: 1, critical: 0, high: 0 },
      { hour: '05:00 - 06:00', count: 0, critical: 0, high: 0 },
      { hour: '06:00 - 07:00', count: 1, critical: 0, high: 1 },
      { hour: '07:00 - 08:00', count: 2, critical: 1, high: 0 },
      { hour: '08:00 - 09:00', count: 2, critical: 1, high: 1 },
      { hour: '09:00 - 10:00', count: 3, critical: 1, high: 2 },
      { hour: '10:00 - 11:00 (Current)', count: Math.max(3, total), critical, high }
    ];

    // Find highest risk zone
    let highestZone = zones[0]?.name || 'Outdoor-Construction-Sector-4';
    const criticalAlert = alerts.find((a) => a.severity === 'CRITICAL');
    if (criticalAlert) highestZone = criticalAlert.location_zone;

    return {
      total,
      critical,
      high,
      moderate,
      hourlyTrend,
      highestZone,
      peakTemp: 45.1,
      peakNoise: 104.8,
      minHrv: 18,
      peakVibration: 6.85
    };
  }, [alerts, zones]);

  // Deployment statistics
  const deployedOfficers = officers.filter((o) => o.status === 'DEPLOYED');
  const standbyOfficers = officers.filter((o) => o.currentZoneId === 'CENTRAL_STANDBY');

  const handoverStatus: ShiftHandoverReport['handoverStatus'] =
    anomalyStats.critical > 0 || lotoTickets.length > 0
      ? 'CRITICAL_CONDITIONAL'
      : anomalyStats.high > 0
      ? 'ELEVATED_ATTENTION'
      : 'CLEARED_NOMINAL';

  const immediateDirectives = useMemo(() => [
    `1. Mandatory Hydration Protocol: High wet-bulb thermal index (>42°C) in ${anomalyStats.highestZone}. Enforce 15-min shaded recovery intervals for cohort (N=${zones.find((z) => z.name === anomalyStats.highestZone)?.count || 18}).`,
    `2. Mechanical LOTO Tagout: Conveyor Drive Motor 4B (MTR-DRIVE-4B) flagged with ISO 10816 Class II vibration runaway (6.85 mm/s RMS). Lockout mandatory prior to bearing replacement.`,
    `3. Biometric Stress Monitoring: Worker W-9921 recorded acute parasympathetic withdrawal (RMSSD 18ms). Maintain shaded rest until autonomic index normalizes above 45ms.`
  ], [anomalyStats, zones]);

  const handleCopyReport = () => {
    const textReport = `=====================================================
SHIFT-HANDOVER BRIEFING DOSSIER (LAST 8 HOURS)
Generated: ${new Date().toLocaleString()}
Shift Window: Last 8 Hours (03:00 - 11:00)
Outgoing Supervisor: ${outgoingSupervisor}
Incoming Supervisor: ${incomingSupervisor}
Handover Status: ${handoverStatus.replace('_', ' ')}
=====================================================

1. SENSOR ANOMALY TRENDS (LAST 8 HOURS)
- Total Anomalies Detected: ${anomalyStats.total}
- Critical Risk Incidents: ${anomalyStats.critical}
- High Priority Breaches: ${anomalyStats.high}
- Moderate Stress Flags: ${anomalyStats.moderate}
- Highest Hazard Concentration: ${anomalyStats.highestZone}
- Peak Ambient Temperature: ${anomalyStats.peakTemp}°C
- Peak Acoustic Noise: ${anomalyStats.peakNoise} dB(A)
- Minimum Worker HRV (RMSSD): ${anomalyStats.minHrv} ms
- Peak Machine Vibration: ${anomalyStats.peakVibration} mm/s RMS

2. PENDING PREDICTIVE MAINTENANCE WORK ORDERS (${pendingTickets.length} ACTIVE)
${pendingTickets
  .map(
    (t, idx) =>
      `  [${idx + 1}] ${t.id} - ${t.equipmentName} (${t.equipmentId})
      Subsystem: ${t.equipmentSubsystem} | Zone: ${t.zone}
      Urgency: ${t.urgency} | Status: ${t.status}
      LOTO Stage 2: ${t.lotoRequired ? 'MANDATORY ENFORCED' : 'Standard'}
      Required Parts: ${t.requiredParts.join(', ')}
      Directive: ${t.recommendedAction}`
  )
  .join('\n\n')}

3. ON-SITE SAFETY PERSONNEL STATUS
- Deployed in Zones: ${deployedOfficers.length} Officers
- Central Standby Reserve: ${standbyOfficers.length} Officers
- Distribution:
${zones
  .map((z) => {
    const count = officers.filter((o) => o.currentZoneId === z.id).length;
    return `  - ${z.name}: ${count} personnel assigned (${z.status})`;
  })
  .join('\n')}

4. IMMEDIATE SUPERVISORY DIRECTIVES FOR INCOMING SHIFT
${immediateDirectives.join('\n')}

SUPERVISOR NOTES:
"${supervisorNotes}"

Handover Acknowledgment: ${isSignedOff ? 'SIGNED & AUDIT VERIFIED' : 'PENDING INCOMING SIGN-OFF'}
=====================================================`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    if (onNotice) {
      onNotice('Shift-Handover Dossier copied to clipboard in standardized format.');
    }
  };

  const handleSignOffHandover = () => {
    setIsSignedOff(true);

    const auditEntry: SystemAuditLogEntry = {
      id: `AUD-HND-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: incomingSupervisor.split(' (')[0],
      userRole: 'Incoming EHS Shift Supervisor',
      category: 'SHIFT_HANDOVER',
      targetModule: 'Safety Workforce Resource Allocation',
      parameter: '8-Hour Shift Handover Transition',
      previousValue: `Lead: ${outgoingSupervisor.split(' (')[0]}`,
      newValue: `Lead: ${incomingSupervisor.split(' (')[0]}`,
      justification: `Formal shift transition signed off. Acknowledged ${anomalyStats.total} anomalies, ${pendingTickets.length} pending maintenance work orders (${lotoTickets.length} LOTO mandatory), and staffing of ${deployedOfficers.length} deployed officers.`,
      approvalStatus: 'VERIFIED'
    };

    if (onLogAudit) onLogAudit(auditEntry);
    if (onNotice) {
      onNotice(
        `Shift Handover acknowledged by ${incomingSupervisor.split(' (')[0]}. Transition logged in System Audit Register.`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex justify-between items-start p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl">
              <Clock className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Shift-Handover Safety Briefing Dossier
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-cyan-500/40">
                  Last 8 Hours (03:00 – 11:00)
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    handoverStatus === 'CRITICAL_CONDITIONAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : handoverStatus === 'ELEVATED_ATTENTION'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {handoverStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive 8-hour sensor anomaly trend analysis, outstanding predictive maintenance work orders, and incoming supervisor sign-off
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 text-xs">
          {/* Supervisor Transition Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Outgoing Safety Supervisor
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                <span className="font-semibold text-slate-200 text-sm">{outgoingSupervisor}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shift: Night-to-Morning Active Watch &bull; Concluding Duty
              </span>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-1">
                Incoming Safety Supervisor
              </label>
              <select
                value={incomingSupervisor}
                onChange={(e) => setIncomingSupervisor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 focus:outline-hidden font-medium"
              >
                <option value="Jordan Hayes (EHS Supervisor - Incoming Shift)">
                  Jordan Hayes (EHS Supervisor - Incoming Shift)
                </option>
                <option value="Elena Vance (Senior Industrial Safety Lead)">
                  Elena Vance (Senior Industrial Safety Lead)
                </option>
                <option value="Marcus Miller, CSP (Shift Safety Director)">
                  Marcus Miller, CSP (Shift Safety Director)
                </option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Next Shift: Day Operational Peak (11:00 – 19:00)
              </span>
            </div>
          </div>

          {/* 8-Hour Sensor Anomaly Trends Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                1. Sensor Anomaly Trends Summary (Past 8 Hours)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {anomalyStats.total} Total Anomalies Detected
              </span>
            </div>

            {/* Macro Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Critical Incidents</span>
                <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                  {anomalyStats.critical} Events
                </div>
                <span className="text-[10px] text-rose-300/80">Immediate Intervention</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">High Noise &amp; Thermal</span>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {anomalyStats.high} Events
                </div>
                <span className="text-[10px] text-amber-300/80">Peak: {anomalyStats.peakNoise} dB</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Lowest Worker HRV</span>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {anomalyStats.minHrv} ms RMSSD
                </div>
                <span className="text-[10px] text-slate-400">Worker W-9921</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Peak Vibration</span>
                <div className="text-lg font-bold font-mono text-orange-400 mt-0.5">
                  {anomalyStats.peakVibration} mm/s
                </div>
                <span className="text-[10px] text-slate-400">ISO Class II Runaway</span>
              </div>
            </div>

            {/* 8-Hour Hourly Anomaly Distribution Bar Visualizer */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                Hourly Anomaly Frequency Distribution (03:00 to 11:00)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {anomalyStats.hourlyTrend.map((h, i) => (
                  <div key={i} className="flex flex-col items-center bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-mono">{h.hour.split(' ')[0]}</span>
                    <div className="my-1.5 flex items-baseline gap-1">
                      <span className="text-sm font-bold font-mono text-white">{h.count}</span>
                      <span className="text-[9px] text-slate-500">alerts</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          h.critical > 0
                            ? 'bg-rose-500'
                            : h.high > 0
                            ? 'bg-amber-500'
                            : h.count > 0
                            ? 'bg-cyan-500'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.min(100, (h.count / 4) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Anomaly Concentration */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Highest Incident Sector:</span>
                  <span className="font-bold text-white block mt-0.5">{anomalyStats.highestZone}</span>
                </div>
                <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono font-bold border border-rose-500/30">
                  4 Anomalies (High Exposure)
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Primary Contributing Factor:</span>
                  <span className="font-bold text-cyan-300 block mt-0.5">Solar Thermal Load &amp; Machinery Runout</span>
                </div>
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold border border-cyan-500/30">
                  OSHA Level 3 Alert
                </span>
              </div>
            </div>
          </div>

          {/* Pending Predictive Maintenance Tickets Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-amber-400" />
                2. Pending Maintenance Work Orders &amp; Equipment Hazards ({pendingTickets.length} Outstanding)
              </h4>
              <span className="text-[11px] text-rose-400 font-mono font-bold">
                {lotoTickets.length} Mandatory LOTO Enforced
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-amber-400 font-bold">{ticket.id}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="font-bold text-white">{ticket.equipmentName}</span>
                      <span className="text-slate-400 font-mono">({ticket.equipmentId})</span>

                      {ticket.lotoRequired && (
                        <span className="bg-rose-500/20 text-rose-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-500/40 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> LOTO MANDATORY
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          ticket.status === 'STAGED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1">
                      <strong className="text-slate-400">Issue:</strong> {ticket.issueDescription}
                    </p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>Zone: <strong className="text-slate-200">{ticket.zone}</strong></span>
                      <span>&bull;</span>
                      <span>Vibration: <strong className="text-amber-400 font-mono">{ticket.vibrationMmS} mm/s</strong></span>
                      <span>&bull;</span>
                      <span>Parts Required: <strong className="text-slate-200">{ticket.requiredParts.join(', ')}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] text-slate-400 block">Assigned Specialist:</span>
                    <span className="text-xs font-bold text-cyan-300">
                      {ticket.assignedTechnicianName || 'Pending Shift Dispatch'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-Site Safety Resource Allocation & Personnel Status */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-3">
              <Users className="h-4 w-4 text-cyan-400" />
              3. Current Safety Personnel Deployment Breakdown ({officers.length} Monitored)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {zones.map((zone) => {
                const assigned = officers.filter((o) => o.currentZoneId === zone.id);
                return (
                  <div key={zone.id} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-white truncate max-w-[140px]">{zone.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          zone.status === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : zone.status === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Staff Assigned: <strong className="text-cyan-400 font-mono">{assigned.length} Officers</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {assigned.map((a) => a.name.split(' ')[0]).join(', ') || 'No staff assigned'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>
                Central Standby Reserve: <strong className="text-white">{standbyOfficers.length} personnel</strong> ready for immediate hot-zone reinforcement.
              </span>
            </div>
          </div>

          {/* Immediate Supervisory Directives for Incoming Shift */}
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              4. Immediate Operational Directives for Incoming Shift
            </h4>
            <div className="space-y-1.5">
              {immediateDirectives.map((dir, i) => (
                <p key={i} className="text-slate-200 text-xs font-medium">
                  {dir}
                </p>
              ))}
            </div>

            {/* Outgoing Supervisor Notes */}
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Outgoing Supervisor Operational Notes / Handover Handoff Instructions:
              </label>
              <textarea
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Handover Sign-Off State */}
          {isSignedOff && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Handover Formal Sign-Off Verified</span>
                  <span className="text-[11px] text-emerald-300">
                    Acknowledged by {incomingSupervisor} &bull; Recorded in System Audit Register
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                COMPLIANT
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition"
              title="Copy formatted 8-hour handover summary text to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
              <span>{copied ? 'Copied Dossier!' : 'Copy Briefing to Clipboard'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isSignedOff ? (
              <button
                onClick={handleSignOffHandover}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition shadow-md shadow-cyan-600/20"
                title="Formally sign off and log handover into system audit register"
              >
                <UserCheck className="h-4 w-4" />
                <span>Sign &amp; Acknowledge Handover</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition"
              >
                Done
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 px-3 rounded-lg border border-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

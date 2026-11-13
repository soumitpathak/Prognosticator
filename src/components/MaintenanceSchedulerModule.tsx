import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Phone,
  Award,
  Layers,
  Settings,
  Flame,
  Check,
  ChevronRight,
  Filter,
  Lock,
  Zap
} from 'lucide-react';
import {
  MaintenanceTechnician,
  MaintenanceTicket,
  ActiveAnomalyAlert,
  SystemAuditLogEntry,
  FacilityZone,
  TicketStatus
} from '../types';
import {
  maintenanceSchedulingService
} from '../services/maintenanceSchedulingService';

interface MaintenanceSchedulerModuleProps {
  alerts: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onLogAudit: (entry: SystemAuditLogEntry) => void;
  onNotice: (msg: string) => void;
  onSelectZone: (zoneId: string) => void;
}

function MaintenanceSchedulerModuleComponent({
  alerts,
  zones,
  onAcknowledgeAlert,
  onLogAudit,
  onNotice,
  onSelectZone
}: MaintenanceSchedulerModuleProps) {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [technicians, setTechnicians] = useState<MaintenanceTechnician[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [manualTechSelection, setManualTechSelection] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showRoster, setShowRoster] = useState<boolean>(false);

  // Sync with service
  useEffect(() => {
    const unsub = maintenanceSchedulingService.subscribe(() => {
      setTickets(maintenanceSchedulingService.getTickets());
      setTechnicians(maintenanceSchedulingService.getTechnicians());
    });

    setTickets(maintenanceSchedulingService.getTickets());
    setTechnicians(maintenanceSchedulingService.getTechnicians());

    return () => unsub();
  }, []);

  // Sync incoming predictive maintenance alerts into tickets if not already present
  useEffect(() => {
    const predictiveAlerts = alerts.filter(
      (a) => a.alert_type === 'PREDICTIVE_MAINTENANCE' && !a.acknowledged
    );
    predictiveAlerts.forEach((alert) => {
      maintenanceSchedulingService.stageTicketFromAlert(alert);
    });
  }, [alerts]);

  const handleAutoSchedule = (ticketId: string) => {
    const result = maintenanceSchedulingService.autoScheduleTicket(ticketId);
    if (result) {
      onLogAudit(result.auditEntry);
      onNotice(
        `Auto-Scheduled ${result.technician.name} to Work Order ${result.ticket.id} (${result.ticket.equipmentName}). Match Score: ${result.ticket.matchScorePct || 95}%.`
      );
      if (onAcknowledgeAlert) {
        onAcknowledgeAlert(result.ticket.alertId);
      }
    }
  };

  const handleManualAssign = (ticketId: string) => {
    const techId = manualTechSelection[ticketId];
    if (!techId) return;

    const result = maintenanceSchedulingService.assignTicket(
      ticketId,
      techId,
      'Supervisor manual technician assignment via Manager Dashboard'
    );

    if (result) {
      onLogAudit(result.auditEntry);
      onNotice(
        `Assigned ${result.technician.name} to ${result.ticket.equipmentName} (${result.ticket.id}). Technician status set to ON_REPAIR.`
      );
      if (onAcknowledgeAlert) {
        onAcknowledgeAlert(result.ticket.alertId);
      }
    }
  };

  const handleAdvanceStatus = (ticketId: string, nextStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    const updated = maintenanceSchedulingService.advanceTicketStatus(ticketId, nextStatus);
    if (updated) {
      if (nextStatus === 'RESOLVED') {
        const auditLog: SystemAuditLogEntry = {
          id: `AUD-RES-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          userId: 'USR-MGR-2026',
          userName: 'Safety Director',
          userRole: 'EHS Manager on Duty',
          category: 'MAINTENANCE_DISPATCH',
          targetModule: 'Automated Predictive Maintenance Scheduler',
          parameter: `Resolved Work Order ${ticketId}`,
          previousValue: 'Status: IN_PROGRESS',
          newValue: 'Status: RESOLVED & VERIFIED',
          justification: `Work order for ${updated.equipmentName} successfully completed by ${updated.assignedTechnicianName || 'maintenance team'}. Baseline vibration and temperature restored.`,
          approvalStatus: 'VERIFIED'
        };
        onLogAudit(auditLog);
        onNotice(
          `Work Order ${ticketId} resolved for ${updated.equipmentName}. Technician returned to AVAILABLE pool.`
        );
      } else {
        onNotice(`Work Order ${ticketId} transitioned to IN_PROGRESS. Technician on-site.`);
      }
    }
  };

  // Metrics
  const stagedCount = tickets.filter((t) => t.status === 'STAGED').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const availableTechCount = technicians.filter((t) => t.status === 'AVAILABLE').length;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div id="maintenance-scheduler-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg">
            <Wrench className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Automated Predictive Maintenance Scheduler
              </h2>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border border-amber-500/40">
                ISO 10816 Vibration &bull; Smart Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlates anomalous equipment vibration and thermal signatures with certified technician availability and zone proximity
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRoster((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
              showRoster
                ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>{showRoster ? 'Hide Technician Roster' : `Technicians (${availableTechCount}/${technicians.length} Available)`}</span>
          </button>

          {stagedCount > 0 && (
            <button
              onClick={() => {
                const firstStaged = tickets.find((t) => t.status === 'STAGED');
                if (firstStaged) handleAutoSchedule(firstStaged.id);
              }}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-amber-600/20"
              title="Automatically match and dispatch the highest-rated available technician to the most critical pending predictive maintenance alert"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Schedule Best Match</span>
            </button>
          )}
        </div>
      </div>

      {/* Scheduler Macro Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-lg bg-amber-950/10">
          <span className="text-[11px] text-amber-300 font-medium block flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" /> Pending Work Orders
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-400 font-mono">{stagedCount} Unassigned</span>
            <span className="text-[10px] text-amber-300/80 font-mono">Requires Dispatch</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Available Technicians</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-400 font-mono">{availableTechCount} Ready</span>
            <span className="text-[10px] text-slate-400 font-mono">Total Roster: {technicians.length}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Active Repairs in Progress</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-cyan-400 font-mono">{inProgressCount} Tickets</span>
            <span className="text-[10px] text-slate-400 font-mono">Mean MTTR: 2.1h</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Resolved Shift Work Orders</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-200 font-mono">{resolvedCount} Complete</span>
            <span className="text-[10px] text-emerald-400 font-mono">Zero Secondary Tripping</span>
          </div>
        </div>
      </div>

      {/* Technician Roster Collapsible Section */}
      {showRoster && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" /> Certified Reliability Technicians &amp; Shift Availability
            </h3>
            <span className="text-[11px] text-slate-400">ISO 18436 &bull; EPA 608 &bull; ISA Certified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {tech.name}
                      </h4>
                      <span className="text-[11px] text-amber-300/90 font-mono block mt-0.5">
                        {tech.certification}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                        tech.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : tech.status === 'ON_REPAIR'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600'
                      }`}
                    >
                      {tech.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Assigned Sector:</span>
                      <strong className="text-slate-200">{tech.assignedZone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift Window:</span>
                      <span className="font-mono">{tech.shiftWindow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Tickets:</span>
                      <span className="font-mono text-cyan-400">{tech.activeTicketsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-cyan-400" /> {tech.contactPhone}
                  </span>
                  <span className="font-mono text-amber-400">&starf; {tech.rating} / 5.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Section: Correlated Predictive Maintenance Dispatch & Active Tickets */}
      <div className="space-y-4">
        {/* Ticket Filter Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Filter Work Orders:</span>
            {['ALL', 'STAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition ${
                  filterStatus === status
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredTickets.length} of {tickets.length} total work orders
          </span>
        </div>

        {/* Work Orders List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-xl text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-300">No work orders match this filter.</p>
              <p className="text-xs text-slate-500 mt-1">All equipment within normal vibration tolerances.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isStaged = ticket.status === 'STAGED';
              const isAssigned = ticket.status === 'ASSIGNED';
              const isInProgress = ticket.status === 'IN_PROGRESS';
              const isResolved = ticket.status === 'RESOLVED';

              // Get technician correlation rankings
              const correlatedTechs = maintenanceSchedulingService.correlateTechniciansForTicket(ticket);
              const bestMatch = correlatedTechs[0];
              const selectedTechId = manualTechSelection[ticket.id] || bestMatch?.technician.id || '';

              return (
                <div
                  key={ticket.id}
                  className={`bg-slate-950/80 border rounded-xl p-4 transition-all ${
                    isStaged
                      ? 'border-amber-500/40 shadow-lg shadow-amber-950/20'
                      : isResolved
                      ? 'border-emerald-500/30 opacity-80'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-3 border-b border-slate-800/80 gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                          {ticket.id}
                        </span>
                        <h3 className="text-base font-bold text-white">{ticket.equipmentName}</h3>
                        <span className="text-xs font-mono text-slate-400">({ticket.equipmentId})</span>

                        {ticket.lotoRequired && (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> LOTO STAGE 2 MANDATORY
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                        <span>Zone: <strong className="text-slate-200">{ticket.zone}</strong></span>
                        <span>&bull;</span>
                        <span>Subsystem: <strong className="text-slate-300">{ticket.equipmentSubsystem}</strong></span>
                        <span>&bull;</span>
                        <span className="font-mono text-amber-400">Vibration: {ticket.vibrationMmS} mm/s RMS</span>
                        <span>&bull;</span>
                        <span className="text-[11px] font-mono text-slate-400">{ticket.isoClass}</span>
                      </div>
                    </div>

                    {/* Status Pill & MTTR */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-mono">
                        Est. MTTR: <strong className="text-white">{ticket.estimatedMttrHours}h</strong>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isStaged
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : isAssigned
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : isInProgress
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Issue & Directive */}
                  <div className="my-3 text-xs text-slate-300 space-y-1">
                    <p>
                      <strong className="text-slate-400">Fault Detection:</strong> {ticket.issueDescription}
                    </p>
                    <p className="text-cyan-300">
                      <strong className="text-slate-400">Directive:</strong> {ticket.recommendedAction}
                    </p>
                  </div>

                  {/* Required Parts & Equipment Kit */}
                  {ticket.requiredParts && ticket.requiredParts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 my-2">
                      <span className="text-[11px] text-slate-400 font-semibold mr-1">Parts Required:</span>
                      {ticket.requiredParts.map((part, i) => (
                        <span
                          key={i}
                          className="bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dispatch & Technician Assignment Panel */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    {isStaged ? (
                      <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">Recommended Technician:</span>
                              <span className="text-xs font-bold text-amber-400">{bestMatch?.technician.name}</span>
                              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                                {bestMatch?.score}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {bestMatch?.matchReasons.slice(0, 2).join(' • ')}
                            </p>
                          </div>
                        </div>

                        {/* Assignment Triggers */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          {/* Manual Selector Dropdown */}
                          <select
                            value={selectedTechId}
                            onChange={(e) =>
                              setManualTechSelection((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value
                              }))
                            }
                            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 flex-1 md:flex-none"
                          >
                            {correlatedTechs.map((ct) => (
                              <option key={ct.technician.id} value={ct.technician.id}>
                                {ct.technician.name} ({ct.score}% - {ct.technician.status})
                              </option>
                            ))}
                          </select>

                          {/* 1-Click Auto Assign */}
                          <button
                            onClick={() => handleAutoSchedule(ticket.id)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-md shadow-amber-600/20 flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Auto-Assign</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-300 gap-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-cyan-400" />
                          <span>
                            Assigned to:{' '}
                            <strong className="text-white font-semibold">
                              {ticket.assignedTechnicianName || 'Certified Technician'}
                            </strong>
                          </span>
                          {ticket.assignedAt && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              at {ticket.assignedAt}
                            </span>
                          )}
                        </div>

                        {/* Lifecycle action buttons */}
                        <div className="flex items-center gap-2">
                          {isAssigned && (
                            <button
                              onClick={() => handleAdvanceStatus(ticket.id, 'IN_PROGRESS')}
                              className="bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold px-3 py-1 rounded-md transition flex items-center gap-1"
                            >
                              <span>Start Repair Work</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => handleAdvanceStatus(ticket.id, 'RESOLVED')}
                              className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-md transition flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Mark Work Order Resolved</span>
                            </button>
                          )}

                          {isResolved && (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Resolved &amp; Verified ({ticket.completedAt})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const MaintenanceSchedulerModule = React.memo(MaintenanceSchedulerModuleComponent);
export default MaintenanceSchedulerModule;

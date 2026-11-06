import React, { useState, useEffect, useMemo } from 'react';
import {
  proactiveMaintenanceSchedulerService,
  ProactiveMaintenanceTask
} from '../services/proactiveMaintenanceSchedulerService';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Zap,
  Activity,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Cpu,
  RefreshCw,
  Box,
  FileSpreadsheet
} from 'lucide-react';

interface ProactiveMaintenanceSchedulerCardProps {
  className?: string;
  onNotice?: (msg: string) => void;
  onNavigateToZone?: (zoneId: string) => void;
}

export default function ProactiveMaintenanceSchedulerCard({
  className = '',
  onNotice,
  onNavigateToZone
}: ProactiveMaintenanceSchedulerCardProps) {
  const [tasks, setTasks] = useState<ProactiveMaintenanceTask[]>(() =>
    proactiveMaintenanceSchedulerService.getTasks()
  );
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL_24H' | 'HIGH_72H' | 'COMPLETED'>('ALL');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = proactiveMaintenanceSchedulerService.subscribe(() => {
      setTasks(proactiveMaintenanceSchedulerService.getTasks());
    });
    setTasks(proactiveMaintenanceSchedulerService.getTasks());
    return () => unsub();
  }, []);

  const handleDispatch = (taskId: string, techName: string, componentName: string) => {
    proactiveMaintenanceSchedulerService.dispatchTechnician(taskId);
    const msg = `Dispatched certified technician ${techName} for proactive sensor component swap: ${componentName}`;
    setActionSuccessNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  const handleStartTask = (taskId: string) => {
    proactiveMaintenanceSchedulerService.startTask(taskId);
    const msg = `Proactive maintenance work order ${taskId} transitioned to IN_PROGRESS. Sensor calibration kit checked out.`;
    setActionSuccessNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  const handleCompleteTask = (taskId: string, endpointName: string) => {
    proactiveMaintenanceSchedulerService.completeAndCalibrateTask(taskId);
    const msg = `Component ${endpointName} successfully replaced and recalibrated. LSTM-Kalman health score restored to 100%.`;
    setActionSuccessNotice(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  const handleSimulateNewFailure = () => {
    const newTask = proactiveMaintenanceSchedulerService.triggerSimulatedPrediction();
    const msg = `LSTM-Kalman Engine flagged impending failure for ${newTask.endpointName} in ${newTask.zoneName} (${newTask.mttfHours}h MTTF). Proactive maintenance task auto-staged!`;
    setActionSuccessNotice(msg);
    if (onNotice) onNotice(msg);
    setExpandedTaskId(newTask.id);
    setTimeout(() => setActionSuccessNotice(null), 8000);
  };

  const handleExportCsv = () => {
    proactiveMaintenanceSchedulerService.exportTasksCsv();
    const msg = `Exported 72-hour proactive maintenance task schedule to CSV.`;
    setActionSuccessNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Metrics
  const metrics = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'REPLACED_VERIFIED');
    const critical24h = activeTasks.filter((t) => t.priority === 'CRITICAL_24H').length;
    const high72h = activeTasks.filter((t) => t.priority === 'HIGH_72H').length;
    const completed = tasks.filter((t) => t.status === 'REPLACED_VERIFIED').length;
    const totalCostAvoidance = tasks.reduce((acc, t) => acc + t.costAvoidanceUsd, 0);

    const nearestMttf =
      activeTasks.length > 0
        ? Math.min(...activeTasks.map((t) => t.mttfHours))
        : 0;

    return {
      activeCount: activeTasks.length,
      critical24h,
      high72h,
      completed,
      totalCostAvoidance,
      nearestMttf
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'ALL') return tasks;
    if (activeFilter === 'CRITICAL_24H') return tasks.filter((t) => t.priority === 'CRITICAL_24H' && t.status !== 'REPLACED_VERIFIED');
    if (activeFilter === 'HIGH_72H') return tasks.filter((t) => t.priority === 'HIGH_72H' && t.status !== 'REPLACED_VERIFIED');
    return tasks.filter((t) => t.status === 'REPLACED_VERIFIED');
  }, [tasks, activeFilter]);

  return (
    <div
      id="proactive-maintenance-scheduler-card"
      className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
                <span>Proactive Maintenance Scheduler</span>
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                LSTM-Kalman 72h Failure Horizon
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                Auto-Trigger Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically stages preemptive hardware replacement work orders when Kalman filter innovation drift predicts sensor failure within 72 hours.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate New Sensor Failure Button */}
          <button
            onClick={handleSimulateNewFailure}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
            title="Inject a synthetic LSTM-Kalman sensor failure prediction (< 72h) to verify auto-scheduling"
          >
            <Zap className="h-3.5 w-3.5 text-slate-950" />
            <span>Simulate 72h Failure</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
            title="Export 72h proactive maintenance schedule as CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionSuccessNotice && (
        <div className="p-3 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 border-b border-slate-800/80 text-xs font-mono">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-500 text-[10px] uppercase block">Predicted Failures &lt; 72h</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold text-white tabular-nums">{metrics.activeCount}</span>
            <span className="text-slate-400 text-[10px]">active components</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 p-2.5 rounded-xl">
          <span className="text-rose-400 text-[10px] uppercase block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Nearest Failure (MTTF)
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-bold text-rose-300 tabular-nums">
              {metrics.nearestMttf > 0 ? `${metrics.nearestMttf.toFixed(1)}h` : 'None'}
            </span>
            <span className="text-slate-400 text-[10px]">window</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl">
          <span className="text-emerald-400 text-[10px] uppercase block">Total Cost Avoidance</span>
          <span className="text-lg font-bold text-emerald-300 tabular-nums">
            ${metrics.totalCostAvoidance.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-400 text-[10px] uppercase block">Work Orders Resolved</span>
          <span className="text-lg font-bold text-cyan-300 tabular-nums">{metrics.completed}</span>
        </div>
      </div>

      {/* Task Filters & Status Bar */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-white font-bold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All Proactive Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('CRITICAL_24H')}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
              activeFilter === 'CRITICAL_24H'
                ? 'bg-rose-950 text-rose-200 font-bold border border-rose-500/50'
                : 'text-slate-400 hover:text-rose-300 border border-transparent'
            }`}
          >
            <span>Critical &lt; 24h</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
              {metrics.critical24h}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('HIGH_72H')}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
              activeFilter === 'HIGH_72H'
                ? 'bg-amber-950 text-amber-200 font-bold border border-amber-500/50'
                : 'text-slate-400 hover:text-amber-300 border border-transparent'
            }`}
          >
            <span>High &lt; 72h</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {metrics.high72h}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              activeFilter === 'COMPLETED'
                ? 'bg-slate-800 text-white font-bold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Completed ({metrics.completed})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Showing {filteredTasks.length} predictive maintenance tasks
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/40" />
            <p>No predictive maintenance tasks match the selected filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCritical = task.priority === 'CRITICAL_24H';
            const isResolved = task.status === 'REPLACED_VERIFIED';
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 transition hover:bg-slate-850/50 ${
                  isResolved ? 'opacity-70 bg-slate-950/40' : ''
                }`}
              >
                {/* Task Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-400'
                          : isCritical
                          ? 'bg-rose-950/80 border border-rose-500/50 text-rose-400'
                          : 'bg-amber-950/80 border border-amber-500/50 text-amber-400'
                      }`}
                    >
                      <Cpu className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-cyan-400">
                          {task.endpointId}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {task.endpointName}
                        </h4>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isResolved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isResolved
                            ? 'RESOLVED & RECALIBRATED'
                            : isCritical
                            ? 'CRITICAL < 24H'
                            : 'HIGH < 72H'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        <button
                          onClick={() => onNavigateToZone && onNavigateToZone(task.zoneId)}
                          className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer"
                        >
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span>{task.zoneName}</span>
                        </button>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>Predicted Failure: <strong>{task.mttfHours.toFixed(1)} hrs</strong></span>
                        </span>
                        <span>·</span>
                        <span className="text-slate-400">
                          Drift: <strong className="text-rose-400">{task.kalmanDriftPercent > 0 ? '+' : ''}{task.kalmanDriftPercent}%</strong>
                        </span>
                        <span>·</span>
                        <span className="text-slate-400">
                          Tech: <strong className="text-white">{task.assignedTechnician.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & MTTF Countdown */}
                  <div className="flex items-center space-x-2 shrink-0 font-mono">
                    {!isResolved && task.status === 'AUTO_STAGED' && (
                      <button
                        onClick={() =>
                          handleDispatch(task.id, task.assignedTechnician.name, task.endpointName)
                        }
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                        title="Dispatch assigned certified technician immediately"
                      >
                        <Send className="h-3.5 w-3.5 text-white" />
                        <span>Dispatch Tech</span>
                      </button>
                    )}

                    {!isResolved && task.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                        title="Mark work order as actively in-progress"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-950" />
                        <span>Start Repair</span>
                      </button>
                    )}

                    {!isResolved && task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteTask(task.id, task.endpointName)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                        title="Mark component replaced and recalibrated to nominal baseline"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        <span>Mark Replaced</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer border border-slate-700"
                      title="Toggle diagnostic details"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Forensics'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Forensic & Action Section */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3.5 rounded-xl text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Diagnostic Attribution */}
                      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                          LSTM-Kalman Failure Attribution
                        </span>
                        <p className="text-slate-300 font-sans leading-relaxed text-xs">
                          {task.currentAnomalyAttribution}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400">
                          Root Cause Vulnerability: <span className="text-rose-300">{task.rootCauseVulnerability}</span>
                        </div>
                      </div>

                      {/* Prescribed Action & Replacement Part */}
                      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block mb-1">
                          Prescribed Preventive Action
                        </span>
                        <p className="text-slate-300 font-sans leading-relaxed text-xs">
                          {task.prescribedPreventiveAction}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                          <Box className="h-3 w-3 text-cyan-400" />
                          <span>Part: <strong className="text-slate-200">{task.requiredPartNumber}</strong></span>
                          <span>·</span>
                          <span>Location: <strong className="text-white">{task.partLocation}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Technician & Deadline Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-4 w-4 text-cyan-400" />
                        <div>
                          <span className="text-slate-400">Assigned: </span>
                          <span className="text-white font-bold">{task.assignedTechnician.name}</span>
                          <span className="text-slate-500"> ({task.assignedTechnician.certification})</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-slate-400">
                        <span>SLA Deadline: <strong className="text-amber-300">{new Date(task.targetCompletionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        <span>·</span>
                        <span>Downtime Cost Avoidance: <strong className="text-emerald-400">${task.costAvoidanceUsd.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

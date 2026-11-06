import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  UserCheck,
  Flame,
  Wrench,
  Heart,
  Volume2,
  X,
  Radio,
  Wifi,
  Battery,
  Shield,
  MessageSquare,
  Eye,
  CheckCheck,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  ChevronRight,
  Filter
} from 'lucide-react';
import { TeamAlertNotification, IncidentAssignee } from '../types';
import { teamAlertService } from '../services/teamAlertService';
import { DEFAULT_FIELD_ASSIGNEES } from './NotificationCenter';

export interface TeamAlertMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssigneeId?: string;
  onAlertAcknowledged?: (alert: TeamAlertNotification) => void;
}

export default function TeamAlertMobileModal({
  isOpen,
  onClose,
  initialAssigneeId = 'ASG-COOL-02',
  onAlertAcknowledged
}: TeamAlertMobileModalProps) {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(initialAssigneeId);
  const [alerts, setAlerts] = useState<TeamAlertNotification[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD' | 'ACTIVE'>('ALL');
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'MOBILE_VIEW' | 'SUPERVISOR_MATRIX'>('MOBILE_VIEW');

  useEffect(() => {
    const unsub = teamAlertService.subscribe((updated) => {
      setAlerts(updated);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentAssignee = DEFAULT_FIELD_ASSIGNEES.find((a) => a.id === selectedAssigneeId) || DEFAULT_FIELD_ASSIGNEES[0];

  // Alerts for currently selected engineer
  const engineerAlerts = alerts.filter((a) => a.assigneeId === selectedAssigneeId);

  const filteredAlerts = engineerAlerts.filter((a) => {
    if (filterMode === 'UNREAD') return a.status === 'UNREAD';
    if (filterMode === 'ACTIVE') return a.status === 'UNREAD' || a.status === 'READ' || a.status === 'EN_ROUTE';
    return true;
  });

  const unreadCount = engineerAlerts.filter((a) => a.status === 'UNREAD').length;
  const totalUnreadAll = alerts.filter((a) => a.status === 'UNREAD').length;

  const handleMarkAsRead = (alertId: string) => {
    const updated = teamAlertService.markAsRead(alertId);
    if (updated && onAlertAcknowledged) {
      onAlertAcknowledged(updated);
    }
  };

  const handleMarkEnRoute = (alertId: string) => {
    const note = noteInputs[alertId] || 'Acknowledged dispatch. In transit to incident coordinates.';
    const updated = teamAlertService.markAsEnRoute(alertId, note);
    if (updated && onAlertAcknowledged) {
      onAlertAcknowledged(updated);
    }
    setNoteInputs((prev) => ({ ...prev, [alertId]: '' }));
  };

  const handleMarkResolved = (alertId: string) => {
    const note = noteInputs[alertId] || 'Corrective action verified. Anomaly stabilized.';
    const updated = teamAlertService.markAsResolved(alertId, note);
    if (updated && onAlertAcknowledged) {
      onAlertAcknowledged(updated);
    }
    setNoteInputs((prev) => ({ ...prev, [alertId]: '' }));
  };

  const handleResetToSeed = () => {
    teamAlertService.resetToDefaults();
  };

  const formatReadReceiptTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Top Title Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Team Alert &amp; Mobile Read Receipts Terminal</h2>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  Live Dispatch Mesh
                </span>
                {totalUnreadAll > 0 && (
                  <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-500 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {totalUnreadAll} Unread Across Field
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates real-time push alerts sent to field teams and tracks immutable supervisor read receipts (Unread, Read, En Route, Resolved).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToSeed}
              className="text-slate-400 hover:text-white px-2 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Reset alerts state to initial demo seed"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset Seed</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Mode Bar */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Select Field Engineer / Responder:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {DEFAULT_FIELD_ASSIGNEES.map((eng) => {
                const isSelected = eng.id === selectedAssigneeId;
                const unreadForEng = alerts.filter((a) => a.assigneeId === eng.id && a.status === 'UNREAD').length;
                return (
                  <button
                    key={eng.id}
                    onClick={() => setSelectedAssigneeId(eng.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 text-xs ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{eng.avatarInitials}</span>
                    <span className="hidden sm:inline">{eng.name.split(' ')[0]}</span>
                    {unreadForEng > 0 && (
                      <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadForEng}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('MOBILE_VIEW')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'MOBILE_VIEW'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile Handset View</span>
            </button>
            <button
              onClick={() => setActiveTab('SUPERVISOR_MATRIX')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'SUPERVISOR_MATRIX'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Read Receipts Matrix</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50">
          {activeTab === 'MOBILE_VIEW' ? (
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6">
              {/* Mobile Phone Device Frame */}
              <div className="w-full max-w-[380px] bg-slate-950 border-4 border-slate-800 rounded-[38px] p-3 shadow-2xl relative overflow-hidden flex flex-col min-h-[580px]">
                {/* Speaker Notch & Camera */}
                <div className="w-28 h-4 bg-slate-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center space-x-2">
                  <div className="h-1.5 w-10 bg-slate-800 rounded-full" />
                  <div className="h-2 w-2 rounded-full bg-slate-800" />
                </div>

                {/* Mobile Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-white">09:42</span>
                  <div className="flex items-center space-x-1.5">
                    <Wifi className="h-3 w-3 text-cyan-400" />
                    <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                    <Battery className="h-3 w-3 text-emerald-400" />
                    <span>94%</span>
                  </div>
                </div>

                {/* Handset Lock/Header Bar */}
                <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950/60 rounded-2xl mt-2 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {currentAssignee.avatarInitials}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{currentAssignee.name}</div>
                      <div className="text-[10px] text-slate-400">{currentAssignee.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60">
                      ON DUTY
                    </span>
                    <div className="text-[9px] font-mono text-slate-500 mt-0.5">Mesh Node Active</div>
                  </div>
                </div>

                {/* Mobile Filter Tabs */}
                <div className="flex items-center justify-between text-xs mt-3 px-1">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1">
                    <span>Incident Notifications</span>
                    {unreadCount > 0 && (
                      <span className="h-4 px-1.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount} NEW
                      </span>
                    )}
                  </span>

                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                    <button
                      onClick={() => setFilterMode('ALL')}
                      className={`px-2 py-0.5 rounded ${filterMode === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      All ({engineerAlerts.length})
                    </button>
                    <button
                      onClick={() => setFilterMode('UNREAD')}
                      className={`px-2 py-0.5 rounded ${filterMode === 'UNREAD' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>

                {/* Scrollable Mobile Alert Feed */}
                <div className="flex-1 overflow-y-auto mt-2 space-y-2.5 pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredAlerts.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                      <p className="text-white font-semibold">No Pending Alerts</p>
                      <p className="text-[11px] text-slate-400 mt-1">All dispatched incidents have been read and actioned.</p>
                    </div>
                  ) : (
                    filteredAlerts.map((item) => {
                      const isCritical = item.severity === 'CRITICAL';
                      const isUnread = item.status === 'UNREAD';
                      const isEnRoute = item.status === 'EN_ROUTE';
                      const isResolved = item.status === 'RESOLVED';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                            isUnread
                              ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                              : isEnRoute
                              ? 'bg-cyan-950/30 border-cyan-500/60'
                              : isResolved
                              ? 'bg-slate-900/60 border-slate-800 opacity-80'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          {/* Alert Header */}
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                className={`text-[9px] font-mono font-black uppercase px-2 py-0.2 rounded-full border ${
                                  isCritical
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500'
                                }`}
                              >
                                {item.severity}
                              </span>

                              <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-cyan-400" />
                                <span>{item.timestamp}</span>
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white leading-tight">
                              {item.title}
                            </h4>

                            <div className="text-[10px] font-mono text-cyan-300 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-cyan-400" />
                              <span>{item.zone.replace(/-/g, ' ')}</span>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                              <strong className="text-amber-300">Directive:</strong> {item.directive}
                            </p>
                          </div>

                          {/* Read Receipt & Tracking Status Stamp */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] font-mono space-y-1.5">
                            {/* Read Receipt Stamp */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Read Receipt:</span>
                              {isUnread ? (
                                <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>UNREAD (Pending Receipt)</span>
                                </span>
                              ) : (
                                <span className="text-cyan-300 font-bold flex items-center gap-1">
                                  <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Read at {formatReadReceiptTime(item.readAt)}</span>
                                </span>
                              )}
                            </div>

                            {/* Status State Badge */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Dispatch Status:</span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[9px] uppercase ${
                                  isResolved
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                    : isEnRoute
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse'
                                    : isUnread
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500'
                                }`}
                              >
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {item.fieldNotes && (
                              <div className="text-[10px] text-slate-400 italic bg-slate-950 p-1.5 rounded">
                                &quot;{item.fieldNotes}&quot;
                              </div>
                            )}

                            {/* Mobile Interactive Buttons */}
                            <div className="pt-1 flex flex-col gap-1.5">
                              {isUnread && (
                                <button
                                  onClick={() => handleMarkAsRead(item.id)}
                                  className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Confirm Read Receipt</span>
                                </button>
                              )}

                              {!isResolved && (
                                <div className="flex items-center gap-1">
                                  {!isEnRoute && (
                                    <button
                                      onClick={() => handleMarkEnRoute(item.id)}
                                      className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Send className="h-3 w-3" />
                                      <span>En Route</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleMarkResolved(item.id)}
                                    className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Resolve</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Home indicator bar */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2 mb-1" />
              </div>

              {/* Responder Details & Quick Instructions Sidebar */}
              <div className="w-full md:w-80 space-y-4 text-xs font-mono">
                {/* Engineer Card */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                    <UserCheck className="h-4 w-4 text-cyan-400" />
                    <span>Field Responder Profile</span>
                  </h3>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-white">{currentAssignee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Specialty:</span>
                      <span className="text-cyan-300">{currentAssignee.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Emergency Line:</span>
                      <span className="text-emerald-400">{currentAssignee.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Incidents:</span>
                      <span className="font-bold text-white">{engineerAlerts.length} Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unread Receipts:</span>
                      <span className={unreadCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {unreadCount} Pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* Read Receipt Protocol Information */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <span>Statutory Read Receipt SLA</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Under ISO 45001 protocol, when a manager dispatches a high-risk event to a field responder, an immutable timestamp is recorded as soon as the engineer opens or confirms receipt on their mobile terminal.
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    &bull; Target Read Latency: &le; 180 seconds
                    <br />
                    &bull; En Route Handover Target: &le; 5 minutes
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Supervisor Global Read Receipts Matrix */
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 text-cyan-400" />
                  <span>Real-Time Incident Read Receipts Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Full statutory trail tracking message delivery, engineer read receipts, and en-route status confirmations across the entire workforce.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Alert ID</th>
                        <th className="p-2.5">Assignee</th>
                        <th className="p-2.5">Zone</th>
                        <th className="p-2.5">Dispatched</th>
                        <th className="p-2.5">Read Receipt Status</th>
                        <th className="p-2.5">Read Timestamp</th>
                        <th className="p-2.5">Field Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {alerts.map((a) => {
                        const isRead = a.status !== 'UNREAD';
                        return (
                          <tr key={a.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">{a.incidentId}</td>
                            <td className="p-2.5 text-cyan-300 font-semibold">{a.assigneeName}</td>
                            <td className="p-2.5 text-slate-300">{a.zone}</td>
                            <td className="p-2.5 text-slate-400">{a.timestamp}</td>
                            <td className="p-2.5">
                              {isRead ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  <span>CONFIRMED READ</span>
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>UNREAD</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {a.readAt ? formatReadReceiptTime(a.readAt) : 'Pending...'}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  a.status === 'RESOLVED'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                    : a.status === 'EN_ROUTE'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                                    : a.status === 'READ'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-500'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500'
                                }`}
                              >
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

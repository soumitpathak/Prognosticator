import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Plus,
  Trash2,
  Check,
  Bell,
  Sliders,
  Send,
  ShieldAlert,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Flame,
  Users
} from 'lucide-react';
import { SystemAuditLogEntry } from '../types';

export interface DailySummaryRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
}

export interface DailySummaryTriggerConfig {
  autoDeliverOnHighRisk: boolean;
  minSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  riskScoreThresholdPct: number;
  requireWorkerClusterOverlap: boolean;
  minWorkerClusterSize: number;
  cooldownMins: number;
  includeCsvAttachment: boolean;
  includeTelemetryLogs: boolean;
  scheduledDigestTime: string;
}

export const DEFAULT_RECIPIENTS: DailySummaryRecipient[] = [
  {
    id: 'REC-01',
    name: 'Alex Mercer',
    email: 'alex.mercer@prognosticator-safety.internal',
    role: 'Lead EHS Operations Supervisor',
    enabled: true
  },
  {
    id: 'REC-02',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@operations.internal',
    role: 'Day Shift Operations Lead',
    enabled: true
  },
  {
    id: 'REC-03',
    name: 'Sarah Jenkins, RN',
    email: 'sarah.jenkins@medical.internal',
    role: 'Rapid Medical Cooling Liaison',
    enabled: true
  },
  {
    id: 'REC-04',
    name: 'Plant Executive Safety Board',
    email: 'ehs-executive-board@global-industrial.internal',
    role: 'Regulatory Compliance Director',
    enabled: false
  }
];

export const DEFAULT_TRIGGER_CONFIG: DailySummaryTriggerConfig = {
  autoDeliverOnHighRisk: true,
  minSeverity: 'HIGH',
  riskScoreThresholdPct: 65,
  requireWorkerClusterOverlap: true,
  minWorkerClusterSize: 18,
  cooldownMins: 60,
  includeCsvAttachment: true,
  includeTelemetryLogs: true,
  scheduledDigestTime: '08:00'
};

export interface DailySummaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: {
    recipients: DailySummaryRecipient[];
    triggers: DailySummaryTriggerConfig;
  }) => void;
  onLogAudit?: (entry: SystemAuditLogEntry) => void;
  onNotice?: (msg: string) => void;
}

export default function DailySummaryConfigModal({
  isOpen,
  onClose,
  onSave,
  onLogAudit,
  onNotice
}: DailySummaryConfigModalProps) {
  // Local state initialized from localStorage if available
  const [recipients, setRecipients] = useState<DailySummaryRecipient[]>(() => {
    try {
      const saved = localStorage.getItem('prognosticator_daily_summary_recipients');
      return saved ? JSON.parse(saved) : DEFAULT_RECIPIENTS;
    } catch {
      return DEFAULT_RECIPIENTS;
    }
  });

  const [triggers, setTriggers] = useState<DailySummaryTriggerConfig>(() => {
    try {
      const saved = localStorage.getItem('prognosticator_daily_summary_triggers');
      return saved ? JSON.parse(saved) : DEFAULT_TRIGGER_CONFIG;
    } catch {
      return DEFAULT_TRIGGER_CONFIG;
    }
  });

  // New recipient form state
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('Site Safety Lead');
  const [formError, setFormError] = useState<string | null>(null);
  const [isTestSending, setIsTestSending] = useState<boolean>(false);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);

  // Add recipient handler
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newEmail.trim() || !newEmail.includes('@') || !newEmail.includes('.')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!newName.trim()) {
      setFormError('Please enter the recipient full name or role title.');
      return;
    }

    const newRec: DailySummaryRecipient = {
      id: `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole.trim() || 'EHS Specialist',
      enabled: true
    };

    setRecipients((prev) => [...prev, newRec]);
    setNewName('');
    setNewEmail('');
  };

  const handleToggleRecipient = (id: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  // Test automated delivery dispatch
  const handleSendTestDispatch = () => {
    setIsTestSending(true);
    const activeEmails = recipients.filter((r) => r.enabled).map((r) => r.email);

    setTimeout(() => {
      setIsTestSending(false);
      setTestSentNotice(`Test Daily Summary Report dispatched to ${activeEmails.length} active recipients.`);

      const auditLog: SystemAuditLogEntry = {
        id: `AUD-TEST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Operations Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: 'Daily Summary Automated Delivery',
        parameter: 'Test Email Dispatch',
        previousValue: 'N/A',
        newValue: `Transmitted test summary to ${activeEmails.length} recipients (${activeEmails.join(', ')})`,
        justification: 'Manual test delivery executed from Daily Summary Configuration Modal.',
        approvalStatus: 'VERIFIED'
      };

      if (onLogAudit) onLogAudit(auditLog);
      if (onNotice) {
        onNotice(`Test Daily Summary Report sent to ${activeEmails.length} recipient(s). Verification logged.`);
      }

      setTimeout(() => setTestSentNotice(null), 5000);
    }, 800);
  };

  // Save configuration
  const handleSave = () => {
    try {
      localStorage.setItem('prognosticator_daily_summary_recipients', JSON.stringify(recipients));
      localStorage.setItem('prognosticator_daily_summary_triggers', JSON.stringify(triggers));
    } catch {
      // Ignore storage errors in hermetic sandbox
    }

    if (onSave) {
      onSave({ recipients, triggers });
    }

    const auditLog: SystemAuditLogEntry = {
      id: `AUD-CFG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Operations Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Daily Summary Automated Delivery',
      parameter: 'Automated Dispatch Thresholds & Recipient Configuration',
      previousValue: 'Previous configuration',
      newValue: `Auto-delivery: ${triggers.autoDeliverOnHighRisk ? 'ON' : 'OFF'} at >=${triggers.riskScoreThresholdPct}% risk, min severity: ${triggers.minSeverity}, ${recipients.length} recipients`,
      justification: 'Configured automated high-risk anomaly summary triggers and email delivery distribution.',
      approvalStatus: 'APPLIED'
    };

    if (onLogAudit) onLogAudit(auditLog);
    if (onNotice) {
      onNotice('Daily Summary automated delivery thresholds and recipients saved successfully.');
    }

    onClose();
  };

  if (!isOpen) return null;

  const enabledRecipientsCount = recipients.filter((r) => r.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-500/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Daily Summary Report &bull; Automated Delivery Configuration</h3>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  Email Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure authorized email recipients and automated trigger thresholds when high-risk anomalies emerge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Status Feedback Notice */}
          {testSentNotice && (
            <div className="bg-emerald-950/80 border border-emerald-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{testSentNotice}</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
                DISPATCHED
              </span>
            </div>
          )}

          {/* Section 1: Automated Delivery Trigger Thresholds */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  High-Risk Anomaly Automated Dispatch Triggers
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-mono text-slate-300">
                  {triggers.autoDeliverOnHighRisk ? 'Automated Dispatch: ACTIVE' : 'Automated Dispatch: OFF'}
                </span>
                <input
                  type="checkbox"
                  checked={triggers.autoDeliverOnHighRisk}
                  onChange={(e) =>
                    setTriggers((prev) => ({ ...prev, autoDeliverOnHighRisk: e.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trigger 1: Minimum Anomaly Severity */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Trigger Severity Threshold
                </label>
                <select
                  value={triggers.minSeverity}
                  onChange={(e) =>
                    setTriggers((prev) => ({
                      ...prev,
                      minSeverity: e.target.value as DailySummaryTriggerConfig['minSeverity']
                    }))
                  }
                  disabled={!triggers.autoDeliverOnHighRisk}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 font-mono disabled:opacity-50"
                >
                  <option value="CRITICAL">CRITICAL Anomalies Only (Acute Heat / Cardiac Collapse)</option>
                  <option value="HIGH">HIGH &amp; CRITICAL Anomalies (Thermal, Acoustic, Machinery)</option>
                  <option value="MODERATE">MODERATE, HIGH, &amp; CRITICAL (All Tracked Anomalies)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Automatically delivers report immediately when an anomaly of this severity is flagged
                </span>
              </div>

              {/* Trigger 2: Risk Score Cutoff Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Workforce Risk Score Inflection Trigger
                  </label>
                  <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">
                    &ge; {triggers.riskScoreThresholdPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="5"
                  value={triggers.riskScoreThresholdPct}
                  onChange={(e) =>
                    setTriggers((prev) => ({
                      ...prev,
                      riskScoreThresholdPct: Number(e.target.value)
                    }))
                  }
                  disabled={!triggers.autoDeliverOnHighRisk}
                  className="w-full accent-rose-500 cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>40% (Low Threshold)</span>
                  <span>65% (Recommended)</span>
                  <span>90% (Extreme Only)</span>
                </div>
              </div>

              {/* Trigger 3: Spatial Cluster Density Condition */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={triggers.requireWorkerClusterOverlap}
                    onChange={(e) =>
                      setTriggers((prev) => ({
                        ...prev,
                        requireWorkerClusterOverlap: e.target.checked
                      }))
                    }
                    disabled={!triggers.autoDeliverOnHighRisk}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 h-4 w-4 mt-0.5 cursor-pointer disabled:opacity-50"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Require Worker Cluster Proximity Overlap
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Only auto-deliver if anomaly zone contains &ge; {triggers.minWorkerClusterSize} workers (Dense Proximity Hazard)
                    </span>
                  </div>
                </label>
              </div>

              {/* Trigger 4: Cooldown period */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Auto-Delivery Cooldown Window
                </label>
                <select
                  value={triggers.cooldownMins}
                  onChange={(e) =>
                    setTriggers((prev) => ({ ...prev, cooldownMins: Number(e.target.value) }))
                  }
                  disabled={!triggers.autoDeliverOnHighRisk}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 font-mono disabled:opacity-50"
                >
                  <option value={30}>30 Minutes Cooldown (High Frequency)</option>
                  <option value={60}>60 Minutes Cooldown (Recommended)</option>
                  <option value={120}>120 Minutes Cooldown (Digest Throttle)</option>
                  <option value={240}>4 Hours Cooldown (Per-Shift Only)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Prevents email inbox flooding during continuous ongoing anomaly events
                </span>
              </div>
            </div>

            {/* Delivery Payload Options */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-5 text-xs text-slate-300 font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.includeCsvAttachment}
                  onChange={(e) =>
                    setTriggers((prev) => ({ ...prev, includeCsvAttachment: e.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  Attach full 24h CSV dataset
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.includeTelemetryLogs}
                  onChange={(e) =>
                    setTriggers((prev) => ({ ...prev, includeTelemetryLogs: e.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                />
                <span>Include Kalman-filtered sensor readings</span>
              </label>
            </div>
          </div>

          {/* Section 2: Authorized Email Recipients */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Authorized Delivery Recipients ({enabledRecipientsCount} Active)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {recipients.length} Total Configured
              </span>
            </div>

            {/* Add Recipient Form */}
            <form onSubmit={handleAddRecipient} className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. elena@safety.internal"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role / Function</label>
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="e.g. Shift Lead"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
              {formError && (
                <div className="text-[11px] text-rose-400 font-mono mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{formError}</span>
                </div>
              )}
            </form>

            {/* Recipients List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recipients.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition ${
                    rec.enabled
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={rec.enabled}
                      onChange={() => handleToggleRecipient(rec.id)}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                      title={rec.enabled ? 'Click to disable delivery' : 'Click to enable delivery'}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{rec.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">({rec.role})</span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 block truncate">{rec.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        rec.enabled
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rec.enabled ? 'RECEIVING' : 'PAUSED'}
                    </span>
                    <button
                      onClick={() => handleDeleteRecipient(rec.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove recipient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleSendTestDispatch}
            disabled={isTestSending || enabledRecipientsCount === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <Send className={`h-3.5 w-3.5 text-cyan-400 ${isTestSending ? 'animate-bounce' : ''}`} />
            <span>{isTestSending ? 'Dispatching Test Email...' : 'Send Test Dispatch'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-cyan-600/30 cursor-pointer"
            >
              <Check className="h-4 w-4 text-white" />
              <span>Save Trigger Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

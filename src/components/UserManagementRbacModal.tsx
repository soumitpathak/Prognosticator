import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  Users,
  Key,
  ShieldAlert,
  FileCheck,
  Stethoscope,
  Wrench,
  HardHat,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserPersona, UserRole, Permission, ClearanceLevel } from '../types';
import { authService, TARGET_PERSONAS } from '../services/authService';

interface UserManagementRbacModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona?: (persona: UserPersona) => void;
}

const ALL_PERMISSIONS: { key: Permission; label: string; description: string; category: string }[] = [
  {
    key: 'VIEW_AGGREGATE_ANALYTICS',
    label: 'View Population Analytics & Heatmaps',
    description: 'Access to aggregate facility maps, cohort trend sparklines, and spatial risk indices (guarded by k >= 12 small-cell suppression).',
    category: 'SURVEILLANCE'
  },
  {
    key: 'VIEW_PRIVATE_BIOMETRICS',
    label: 'View Personal Sovereign Biometrics',
    description: 'Direct access to raw individual ECG, heart rate variability, skin temperature, and hydration telemetry (Worker only).',
    category: 'PRIVACY'
  },
  {
    key: 'CONFIGURE_GLOBAL_THRESHOLDS',
    label: 'Configure Global Health Thresholds',
    description: 'Permission to calibrate Kalman filter noise parameters, OSHA thermal cutoffs, and acoustic alarm levels.',
    category: 'CONFIGURATION'
  },
  {
    key: 'ACTUATE_HVAC_REMEDIATION',
    label: 'Actuate Building HVAC & Chiller Remediations',
    description: 'Authority to override mechanical building automation, adjust airflow dampers, and initiate pre-cooling cycles.',
    category: 'CONTROL'
  },
  {
    key: 'DISPATCH_MEDICAL_EMERGENCY',
    label: 'Dispatch Emergency Medical Rapid Response',
    description: 'Trigger SMS, digital radio broadcast, and on-site paramedic cooling dispatch for critical physiological exhaustion.',
    category: 'EMERGENCY'
  },
  {
    key: 'SCHEDULE_IOT_MAINTENANCE',
    label: 'Schedule Proactive IoT Maintenance',
    description: 'Issue work orders for ISO 10816 machinery vibration degradation and bearing replacement.',
    category: 'MAINTENANCE'
  },
  {
    key: 'EXPORT_CERTIFIED_REPORTS',
    label: 'Export Certified Reports & Dossiers',
    description: 'Generate digitally signed Executive PDF summaries, HIPAA §164.514 compliance records, and raw telemetry CSVs.',
    category: 'COMPLIANCE'
  },
  {
    key: 'VIEW_COMPLIANCE_AUDIT_LOGS',
    label: 'View Cryptographic Compliance Audit Logs',
    description: 'Read immutable tamper-evident event logs tracking all user access, automated actions, and threshold overrides.',
    category: 'AUDIT'
  },
  {
    key: 'RUN_WHAT_IF_SIMULATIONS',
    label: 'Run What-If Scenario Simulations',
    description: 'Execute thermal physics and worker density Monte Carlo scenario projections.',
    category: 'ANALYTICS'
  },
  {
    key: 'REQUEST_ANONYMOUS_REST_BREAK',
    label: 'Request Sovereign Anonymous Rest Break',
    description: 'Send non-punitive fatigue/heat recovery signal without supervisor identification or wage deduction.',
    category: 'WORKER_RIGHTS'
  },
  {
    key: 'MANAGE_USER_ROLES',
    label: 'Manage User Roles & PBAC Policies',
    description: 'Administer enterprise directory personas, assign clearance levels, and review policy evaluation traces.',
    category: 'ADMIN'
  }
];

export default function UserManagementRbacModal({
  isOpen,
  onClose,
  onSelectPersona
}: UserManagementRbacModalProps) {
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'SIMULATOR' | 'DIRECTORY'>('MATRIX');
  const [testAction, setTestAction] = useState<Permission>('ACTUATE_HVAC_REMEDIATION');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('SAFETY_DIRECTOR');
  const [selectedClearance, setSelectedClearance] = useState<ClearanceLevel>('LEVEL_4_EXECUTIVE');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const simulationResult = authService.evaluatePolicy(testAction);

  const handleStartEditRole = (persona: UserPersona) => {
    setEditingUserId(persona.id);
    setSelectedRole(persona.role);
    setSelectedClearance(persona.clearanceLevel);
  };

  const handleSaveRole = (userId: string) => {
    const updated = authService.updateUserRole(userId, selectedRole, selectedClearance);
    if (updated) {
      setAdminNotification(`Successfully updated role for ${updated.name} to [${selectedRole}] with [${selectedClearance}].`);
      setEditingUserId(null);
      setTimeout(() => setAdminNotification(null), 4000);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SAFETY_DIRECTOR':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">Safety Director (Admin)</span>;
      case 'OCCUPATIONAL_HEALTH_OFFICER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">Occupational Health</span>;
      case 'FACILITY_ENGINEER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">Facility Engineer</span>;
      case 'FRONTLINE_WORKER':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">Frontline / Migrant</span>;
      case 'COMPLIANCE_AUDITOR':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">Compliance Auditor</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 rounded-xl text-indigo-400 shadow-md">
              <Shield className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Enterprise User Management &amp; Role Governance</span>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Admin Exclusive
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Administrator Access Granted: You have exclusive authority to assign, modify, and revoke user roles and clearance levels.'
                  : 'Role Management Restricted: Only Enterprise Administrators (Safety Director) have authority to assign or modify roles.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DIRECTORY'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Active Enterprise Directory ({TARGET_PERSONAS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MATRIX')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MATRIX'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Role vs. Permission Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Live PBAC Policy Evaluator</span>
          </button>
        </div>

        {/* Notification Toast */}
        {adminNotification && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{adminNotification}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {activeTab === 'DIRECTORY' && (
            <div className="space-y-3">
              {/* Admin vs Non-Admin Notice Banner */}
              {isAdmin ? (
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>
                      <strong>Admin Governance Active:</strong> You can modify any user&apos;s role below. Their post-login landing dashboard will automatically adjust based on their assigned role.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900 border border-cyan-500/50 text-white shrink-0">
                    ADMIN
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Role Editing Restricted:</strong> Only System Administrators (Safety Director) can modify user roles. Your current role is <strong className="text-white">[{currentUser.role}]</strong>.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Enterprise user directory with role assignments:</span>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search persona or department..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {TARGET_PERSONAS.filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    p.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    p.roleTitle.toLowerCase().includes(searchFilter.toLowerCase())
                ).map((persona) => {
                  const isCurrent = currentUser.id === persona.id;
                  const isEditing = editingUserId === persona.id;

                  return (
                    <div
                      key={persona.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isCurrent
                          ? 'bg-slate-800/80 border-indigo-500/80'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`h-9 w-9 rounded-full ${persona.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                            {persona.avatarInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{persona.name}</span>
                              {getRoleBadge(persona.role)}
                              {isCurrent && (
                                <span className="text-[9px] font-mono bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {persona.email} &middot; {persona.department}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              Clearance: <span className="text-amber-400">{persona.clearanceLevel}</span> &middot; Permissions: <span className="text-cyan-400">{persona.permissions.length}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isAdmin && !isEditing && (
                            <button
                              type="button"
                              onClick={() => handleStartEditRole(persona)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                            >
                              <Key className="h-3 w-3" />
                              <span>Manage Role</span>
                            </button>
                          )}

                          {isAdmin && onSelectPersona && (
                            <button
                              type="button"
                              onClick={() => {
                                authService.switchPersona(persona.id);
                                onSelectPersona(persona);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition cursor-pointer"
                            >
                              Switch View
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Admin In-line Role Editor */}
                      {isAdmin && isEditing && (
                        <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-900/90 p-3 rounded-lg space-y-3">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Assign New Role &amp; Clearance Level for {persona.name}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Assigned Role</label>
                              <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="SAFETY_DIRECTOR">SAFETY_DIRECTOR (Admin / Whole-Site Command)</option>
                                <option value="OCCUPATIONAL_HEALTH_OFFICER">OCCUPATIONAL_HEALTH_OFFICER (Clinical Physician)</option>
                                <option value="FACILITY_ENGINEER">FACILITY_ENGINEER (HVAC & Mechanical)</option>
                                <option value="COMPLIANCE_AUDITOR">COMPLIANCE_AUDITOR (Statutory WSH Inspector)</option>
                                <option value="FRONTLINE_WORKER">FRONTLINE_WORKER (Sovereign Private Shield)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Clearance Level</label>
                              <select
                                value={selectedClearance}
                                onChange={(e) => setSelectedClearance(e.target.value as ClearanceLevel)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="LEVEL_1_BASIC">LEVEL_1_BASIC (Frontline Worker)</option>
                                <option value="LEVEL_2_CLINICAL">LEVEL_2_CLINICAL (Medical / Physician)</option>
                                <option value="LEVEL_3_TECHNICAL">LEVEL_3_TECHNICAL (Engineering / Automation)</option>
                                <option value="LEVEL_4_EXECUTIVE">LEVEL_4_EXECUTIVE (Safety Director / Administrator)</option>
                                <option value="LEVEL_5_AUDITOR">LEVEL_5_AUDITOR (Statutory Government Inspector)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveRole(persona.id)}
                              className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Save Role Assignment</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'MATRIX' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Detailed authorization matrix detailing which persona roles are granted specific operational actions:
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Permission / Operational Action</th>
                      <th className="p-3 text-center">Safety Director</th>
                      <th className="p-3 text-center">Health Officer</th>
                      <th className="p-3 text-center">Facility Eng</th>
                      <th className="p-3 text-center">Migrant Worker</th>
                      <th className="p-3 text-center">Govt Auditor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {ALL_PERMISSIONS.map((perm) => {
                      const hasSD = TARGET_PERSONAS.find((p) => p.role === 'SAFETY_DIRECTOR')?.permissions.includes(perm.key);
                      const hasOH = TARGET_PERSONAS.find((p) => p.role === 'OCCUPATIONAL_HEALTH_OFFICER')?.permissions.includes(perm.key);
                      const hasFE = TARGET_PERSONAS.find((p) => p.role === 'FACILITY_ENGINEER')?.permissions.includes(perm.key);
                      const hasFW = TARGET_PERSONAS.find((p) => p.role === 'FRONTLINE_WORKER')?.permissions.includes(perm.key);
                      const hasCA = TARGET_PERSONAS.find((p) => p.role === 'COMPLIANCE_AUDITOR')?.permissions.includes(perm.key);

                      return (
                        <tr key={perm.key} className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white">{perm.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{perm.description}</div>
                          </td>
                          <td className="p-3 text-center">
                            {hasSD ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasOH ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasFE ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasFW ? (
                              <CheckCircle2 className="h-4 w-4 text-purple-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasCA ? (
                              <CheckCircle2 className="h-4 w-4 text-rose-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SIMULATOR' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  <Key className="h-4 w-4 text-indigo-400" />
                  <span>Current Active Session Context</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-300 font-mono text-[11px]">
                  <span>User: <strong className="text-white">{currentUser.name}</strong></span>
                  <span>Role: <strong className="text-cyan-400">{currentUser.roleTitle}</strong></span>
                  <span>Clearance: <strong className="text-amber-400">{currentUser.clearanceLevel}</strong></span>
                  <span>Workforce Category: <strong className="text-purple-400">{currentUser.workforceType}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Action to Evaluate with PBAC Policy Engine:
                </label>
                <select
                  value={testAction}
                  onChange={(e) => setTestAction(e.target.value as Permission)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                >
                  {ALL_PERMISSIONS.map((perm) => (
                    <option key={perm.key} value={perm.key}>
                      [{perm.category}] {perm.label} ({perm.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Evaluation Outcome Box */}
              <div
                className={`p-4 rounded-xl border ${
                  simulationResult.allowed
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {simulationResult.allowed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  )}
                  <div className="font-bold text-sm">
                    {simulationResult.allowed ? 'ACTION PERMITTED' : 'ACCESS DENIED / PROTECTED'}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 ml-auto">
                    {simulationResult.policyCode}
                  </span>
                </div>
                <p className="text-xs mt-2 leading-relaxed opacity-90">
                  {simulationResult.reason}
                </p>
              </div>

              {/* Sovereign Isolation Notice for Workers */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-purple-400" />
                  <span>Sovereign Privacy Shield Architecture Principle</span>
                </div>
                <p className="text-[11px] text-purple-200/80 leading-relaxed">
                  Frontline and migrant workers are mathematically isolated from managerial supervision tools. Conversely, safety managers cannot access individual unmasked biometrics under any permission tier without violating HIPAA Safe Harbor § 164.514 and GDPR Article 9.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Policy Evaluation Engine: OPA Rego-Compatible RBAC Specification</span>
          <span className="font-mono">User Roles Managed Exclusively by Administrator</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  Shield,
  UserCheck,
  Lock,
  Mail,
  Key,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe2,
  Users,
  Stethoscope,
  Wrench,
  FileCheck,
  HardHat
} from 'lucide-react';
import { UserPersona, UserRole, WorkforceType } from '../types';
import { authService, TARGET_PERSONAS } from '../services/authService';
import { signInWithGoogle } from '../services/firebase';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: UserPersona) => void;
  onOpenRbacModal?: () => void;
}

export default function UserLoginModal({
  isOpen,
  onClose,
  onUserChanged,
  onOpenRbacModal
}: UserLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'PERSONAS' | 'CREDENTIALS'>('PERSONAS');
  const [emailInput, setEmailInput] = useState<string>('sarah.chen@prognosticator.io');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  if (!isOpen) return null;

  const handleSelectPersona = (persona: UserPersona) => {
    const updated = authService.switchPersona(persona.id);
    setSuccessMessage(`Switched session to ${persona.name} (${persona.roleTitle})`);
    onUserChanged(updated);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 700);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = authService.loginWithCredentials(emailInput);
    setSuccessMessage(`Authenticated as ${updated.name} (${updated.roleTitle})`);
    onUserChanged(updated);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 700);
  };

  const handleGoogleSignIn = async () => {
    try {
      setSuccessMessage('Opening Google Authentication...');
      const user = await signInWithGoogle();
      const updated = authService.loginWithFirebaseUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setSuccessMessage(`Authenticated as ${user.displayName || user.email}!`);
      onUserChanged(updated);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Firebase Google sign-in failed:', err);
      setSuccessMessage(`Notice: ${err?.message || 'Authentication flow closed or cancelled.'}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SAFETY_DIRECTOR':
        return <Shield className="h-4 w-4 text-cyan-400" />;
      case 'OCCUPATIONAL_HEALTH_OFFICER':
        return <Stethoscope className="h-4 w-4 text-emerald-400" />;
      case 'FACILITY_ENGINEER':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      case 'FRONTLINE_WORKER':
        return <HardHat className="h-4 w-4 text-purple-400" />;
      case 'COMPLIANCE_AUDITOR':
        return <FileCheck className="h-4 w-4 text-rose-400" />;
      default:
        return <UserCheck className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getWorkforceBadge = (type: WorkforceType) => {
    switch (type) {
      case 'MIGRANT_WORKFORCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
            Migrant Workforce
          </span>
        );
      case 'DOMESTIC_WORKFORCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
            Resident Workforce
          </span>
        );
      case 'SUPERVISORY_STAFF':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
            Site Management
          </span>
        );
      case 'INDEPENDENT_AUDITOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            Govt / Third-Party Inspector
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 rounded-xl text-cyan-400 shadow-md">
              <Lock className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enterprise Identity &amp; Persona Access</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                  RBAC / PBAC Standard
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticate or switch between occupational safety personas (Safety Directors, Clinicians, Engineers, Migrant Workers, and Government Inspectors).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {authService.isAdmin() && onOpenRbacModal && (
              <button
                type="button"
                onClick={onOpenRbacModal}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-900/60 transition cursor-pointer shadow-xs"
                title="Manage Roles & Governance"
              >
                <Key className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Manage Roles (Admin)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('PERSONAS')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'PERSONAS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Targeted Challenge Personas (1-Click Switch)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`py-2 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'CREDENTIALS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Direct Enterprise Sign-In</span>
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {activeTab === 'PERSONAS' ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Select a persona to test role-specific dashboards, permissions, and migrant workforce protections:</span>
                <span className="font-mono text-[11px] text-cyan-400">Current: {currentUser.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TARGET_PERSONAS.map((persona) => {
                  const isCurrent = currentUser.id === persona.id;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => handleSelectPersona(persona)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-slate-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        {/* Top Persona Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div className={`h-8 w-8 rounded-full ${persona.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                              {persona.avatarInitials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white">{persona.name}</span>
                                {getRoleIcon(persona.role)}
                              </div>
                              <div className="text-[11px] text-cyan-300 font-medium">
                                {persona.roleTitle}
                              </div>
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="text-[9px] font-mono bg-cyan-900/80 text-cyan-200 px-1.5 py-0.5 rounded font-bold border border-cyan-500/40">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {getWorkforceBadge(persona.workforceType)}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {persona.clearanceLevel}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Globe2 className="h-2.5 w-2.5" />
                            {persona.languageLabel}
                          </span>
                        </div>

                        {/* Bio / Scope */}
                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {persona.bioSummary}
                        </p>
                      </div>

                      {/* Permissions Strip & Action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">
                          {persona.permissions.length} Permissions
                        </span>
                        <button
                          type="button"
                          className={`flex items-center gap-1 font-semibold transition ${
                            isCurrent ? 'text-cyan-400' : 'text-slate-300 group-hover:text-cyan-400'
                          }`}
                        >
                          <span>{isCurrent ? 'Active Session' : 'Switch Session'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span>Enter organizational email address. For testing, choose from active directory personas:</span>
                <div className="mt-1.5 space-y-1 font-mono text-[11px]">
                  <div className="text-cyan-400 cursor-pointer hover:underline" onClick={() => setEmailInput('sarah.chen@prognosticator.io')}>
                    • sarah.chen@prognosticator.io (Safety Director)
                  </div>
                  <div className="text-emerald-400 cursor-pointer hover:underline" onClick={() => setEmailInput('dr.aravind@prognosticator.io')}>
                    • dr.aravind@prognosticator.io (Occupational Health Lead)
                  </div>
                  <div className="text-purple-400 cursor-pointer hover:underline" onClick={() => setEmailInput('tariq.mansoor@worker.local')}>
                    • tariq.mansoor@worker.local (Migrant Frontline Worker)
                  </div>
                  <div className="text-rose-400 cursor-pointer hover:underline" onClick={() => setEmailInput('e.rostova@wsh-inspector.gov')}>
                    • e.rostova@wsh-inspector.gov (Government WSH Inspector)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enterprise Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SSO / Security Token Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>Authenticate &amp; Load Authorization Profile</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] font-mono text-slate-500 uppercase">Or Federated Cloud ID</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign in with Google (Firebase Cloud Auth)</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Standards: NIST SP 800-162 ABAC / ISO 27001 RBAC</span>
          <span className="font-mono">Privacy Shield $k \ge 12$ Strictly Guarded</span>
        </div>
      </div>
    </div>
  );
}

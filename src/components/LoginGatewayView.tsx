import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Stethoscope,
  Wrench,
  HardHat,
  FileCheck,
  Building2,
  Sparkles,
  Users
} from 'lucide-react';
import { UserPersona, UserRole, WorkforceType, RegulatoryJurisdiction } from '../types';
import { authService, TARGET_PERSONAS, REGULATORY_FRAMEWORKS } from '../services/authService';

interface LoginGatewayViewProps {
  onLoginSuccess: (user: UserPersona) => void;
  isAccessibilityMode?: boolean;
}

export default function LoginGatewayView({
  onLoginSuccess,
  isAccessibilityMode = false
}: LoginGatewayViewProps) {
  const [authMode, setAuthMode] = useState<'PERSONAS' | 'CREDENTIALS'>('PERSONAS');
  const [emailInput, setEmailInput] = useState<string>('sarah.chen@prognosticator.io');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<RegulatoryJurisdiction>(
    authService.getActiveJurisdiction()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const handleSelectPersona = (persona: UserPersona) => {
    setIsLoading(true);
    setLoginFeedback(`Authenticating session as ${persona.name} (${persona.roleTitle})...`);
    authService.setActiveJurisdiction(selectedJurisdiction);

    setTimeout(() => {
      const loggedUser = authService.switchPersona(persona.id);
      setIsLoading(false);
      onLoginSuccess(loggedUser);
    }, 400);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginFeedback(`Verifying security credentials for ${emailInput}...`);
    authService.setActiveJurisdiction(selectedJurisdiction);

    setTimeout(() => {
      const loggedUser = authService.loginWithCredentials(emailInput, passwordInput);
      setIsLoading(false);
      onLoginSuccess(loggedUser);
    }, 450);
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
        return <Users className="h-4 w-4 text-cyan-400" />;
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
            Site Leadership
          </span>
        );
      case 'INDEPENDENT_AUDITOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            Govt / WSH Auditor
          </span>
        );
    }
  };

  const currentFw = REGULATORY_FRAMEWORKS[selectedJurisdiction];

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8 transition-colors ${
      isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-950/50">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Prognosticator</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                ENTERPRISE v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Workforce Health Early-Warning Intelligence &amp; Multi-Jurisdictional Heat Defense Platform
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <Globe2 className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-slate-400">Jurisdiction:</span>
          <select
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value as RegulatoryJurisdiction)}
            className="bg-slate-900 border border-slate-700 text-emerald-300 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {Object.keys(REGULATORY_FRAMEWORKS).map((jurKey) => (
              <option key={jurKey} value={jurKey}>
                {REGULATORY_FRAMEWORKS[jurKey as RegulatoryJurisdiction].countryName} ({REGULATORY_FRAMEWORKS[jurKey as RegulatoryJurisdiction].regulatoryBody.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-4xl mx-auto w-full my-6 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                <span>Enterprise Identity &amp; Role-Based Access Gateway</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your verified occupational health persona or sign in with enterprise credentials.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('PERSONAS')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  authMode === 'PERSONAS'
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>1-Click Personas</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('CREDENTIALS')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  authMode === 'CREDENTIALS'
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Key className="h-3.5 w-3.5" />
                <span>Email &amp; Password</span>
              </button>
            </div>
          </div>

          {/* Loading / Feedback Banner */}
          {loginFeedback && (
            <div className="mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
              <span className="font-semibold">{loginFeedback}</span>
            </div>
          )}

          {/* Tab 1: Persona Grid */}
          {authMode === 'PERSONAS' && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Select a targeted occupational health role to enter the system:</span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Target Country: {currentFw.countryName}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {TARGET_PERSONAS.map((persona) => (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-cyan-500/60 transition cursor-pointer group flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className={`h-9 w-9 rounded-xl ${persona.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-md`}>
                            {persona.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                              <span>{persona.name}</span>
                              {getRoleIcon(persona.role)}
                            </div>
                            <div className="text-[11px] text-cyan-400 font-medium">
                              {persona.roleTitle}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {persona.clearanceLevel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {getWorkforceBadge(persona.workforceType)}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Globe2 className="h-2.5 w-2.5" />
                          {persona.languageLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {persona.bioSummary}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {persona.permissions.length} Permissions Authorized
                      </span>
                      <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Authenticate</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Standard Credentials */}
          {authMode === 'CREDENTIALS' && (
            <form onSubmit={handleCredentialsSubmit} className="mt-6 max-w-md mx-auto space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Quick-fill Sample Enterprise Accounts:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEmailInput('sarah.chen@prognosticator.io')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-pointer transition"
                  >
                    Safety Director
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailInput('dr.aravind@prognosticator.io')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 cursor-pointer transition"
                  >
                    Clinician
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailInput('tariq.mansoor@worker.local')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 cursor-pointer transition"
                  >
                    Migrant Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailInput('e.rostova@wsh-inspector.gov')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 cursor-pointer transition"
                  >
                    MOM Auditor
                  </button>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password / SSO Security Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
                  />
                  <span>Keep session active</span>
                </label>
                <span className="text-cyan-400 cursor-pointer hover:underline">
                  Reset MFA Token
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-cyan-950/40 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>Sign In &amp; Launch Authorized Dashboard</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Statutory Footer */}
      <div className="max-w-5xl mx-auto w-full pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span>&copy; 2026 Prognosticator Intelligence Platform</span>
          <span>·</span>
          <span>Regulatory Compliance: {currentFw.regulatoryBody}</span>
        </div>
        <div className="font-mono text-[11px]">
          Privacy Shield: k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
        </div>
      </div>
    </div>
  );
}

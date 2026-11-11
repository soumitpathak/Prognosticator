import React, { useState, useEffect, lazy, Suspense } from 'react';
import ManagerDashboard from './components/ManagerDashboard';
const WorkerPrivateDashboard = lazy(() => import('./components/WorkerPrivateDashboard'));
const ClinicianHealthDashboard = lazy(() => import('./components/ClinicianHealthDashboard'));
const FacilityEngineeringDashboard = lazy(() => import('./components/FacilityEngineeringDashboard'));
const ComplianceAuditorDashboard = lazy(() => import('./components/ComplianceAuditorDashboard'));
const ArchitectureModal = lazy(() => import('./components/ArchitectureModal'));
const UserLoginModal = lazy(() => import('./components/UserLoginModal'));
const UserManagementRbacModal = lazy(() => import('./components/UserManagementRbacModal'));
const MigrantWorkforceComplianceModal = lazy(() => import('./components/MigrantWorkforceComplianceModal'));
const LoginGatewayView = lazy(() => import('./components/LoginGatewayView'));

import {
  Shield,
  UserCheck,
  Layers,
  Eye,
  Key,
  Scale,
  Users,
  LogOut,
  Lock,
  AlertTriangle,
  Globe2,
  HardHat,
  Stethoscope,
  Wrench,
  FileCheck
} from 'lucide-react';
import { UserPersona, RegulatoryJurisdiction, UserRole } from './types';
import { authService, REGULATORY_FRAMEWORKS } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserPersona>(() => authService.getCurrentUser());
  const [currentJurisdiction, setCurrentJurisdiction] = useState<RegulatoryJurisdiction>(() =>
    authService.getActiveJurisdiction()
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  // Landing dashboard strictly based on assigned user role
  const [activeRoleView, setActiveRoleView] = useState<UserRole>(() => authService.getCurrentUser().role);

  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRbacModalOpen, setIsRbacModalOpen] = useState<boolean>(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const isAdmin = authService.isAdmin();

  // Global Accessibility Mode State (High-Contrast Light presentation for visually impaired users)
  const [isAccessibilityMode, setIsAccessibilityMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prognosticator_accessibility_mode');
      if (saved !== null) return saved === 'true';
      const themeSaved = localStorage.getItem('prognosticator_dashboard_theme');
      return themeSaved === 'high-contrast-light';
    }
    return false;
  });

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user, jur, authStatus) => {
      setCurrentUser(user);
      setCurrentJurisdiction(jur);
      setIsAuthenticated(authStatus);
      // Strictly align landing console to user's assigned role
      setActiveRoleView(user.role);
    });
    return unsubscribe;
  }, []);

  // Apply .manager-high-contrast-light CSS class to the root element for visually impaired users
  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;
    const rootDiv = document.getElementById('root');

    if (isAccessibilityMode) {
      rootEl.classList.add('manager-high-contrast-light');
      rootEl.classList.remove('dark');
      bodyEl.classList.add('manager-high-contrast-light');
      if (rootDiv) rootDiv.classList.add('manager-high-contrast-light');
      try {
        localStorage.setItem('prognosticator_accessibility_mode', 'true');
        localStorage.setItem('prognosticator_dashboard_theme', 'high-contrast-light');
      } catch {}
    } else {
      rootEl.classList.remove('manager-high-contrast-light');
      rootEl.classList.add('dark');
      bodyEl.classList.remove('manager-high-contrast-light');
      if (rootDiv) rootDiv.classList.remove('manager-high-contrast-light');
      try {
        localStorage.setItem('prognosticator_accessibility_mode', 'false');
        localStorage.setItem('prognosticator_dashboard_theme', 'dark');
      } catch {}
    }
  }, [isAccessibilityMode]);

  const toggleAccessibilityMode = () => {
    setIsAccessibilityMode((prev) => !prev);
  };

  const handleRoleViewChange = (targetRole: UserRole) => {
    // Non-admins cannot switch their console
    if (!isAdmin && targetRole !== currentUser.role) {
      setAccessDeniedMessage(`Access Restricted: As a [${currentUser.roleTitle}], your operational console is strictly governed by Enterprise Admin policy.`);
      return;
    }
    setAccessDeniedMessage(null);
    setActiveRoleView(targetRole);
  };

  const frameworkDetail = REGULATORY_FRAMEWORKS[currentJurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;

  const getRoleIcon = (role?: UserRole) => {
    const target = role || currentUser.role;
    switch (target) {
      case 'SAFETY_DIRECTOR':
        return <Shield className="h-3.5 w-3.5 text-cyan-400" />;
      case 'OCCUPATIONAL_HEALTH_OFFICER':
        return <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />;
      case 'FACILITY_ENGINEER':
        return <Wrench className="h-3.5 w-3.5 text-amber-400" />;
      case 'FRONTLINE_WORKER':
        return <HardHat className="h-3.5 w-3.5 text-purple-400" />;
      case 'COMPLIANCE_AUDITOR':
        return <FileCheck className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <UserCheck className="h-3.5 w-3.5 text-cyan-400" />;
    }
  };

  const getRoleLandingTitle = (role: UserRole) => {
    switch (role) {
      case 'SAFETY_DIRECTOR':
        return 'Executive Whole-Site Command & Prognostics';
      case 'OCCUPATIONAL_HEALTH_OFFICER':
        return 'Occupational Health & Clinical Triage Center';
      case 'FACILITY_ENGINEER':
        return 'Facility HVAC & Mechanical Reliability Console';
      case 'COMPLIANCE_AUDITOR':
        return 'Statutory Regulatory Compliance & WSH Audit';
      case 'FRONTLINE_WORKER':
        return 'Sovereign Worker Private Biometric Shield';
    }
  };

  // If user is not authenticated, display the full Enterprise Login Gateway
  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping mr-2"></span>
            Loading Enterprise Authentication Gateway...
          </div>
        }
      >
        <LoginGatewayView
          onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            setCurrentUser(user);
            setActiveRoleView(user.role);
          }}
          isAccessibilityMode={isAccessibilityMode}
        />
      </Suspense>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white ${
      isAccessibilityMode ? 'manager-high-contrast-light bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Universal Mode Bar: Follows strict 3-zone enterprise contract */}
      <div className={`border-b px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors sticky top-0 z-50 backdrop-blur-md ${
        isAccessibilityMode ? 'bg-slate-200/95 border-slate-300 text-slate-900' : 'bg-[#090D17]/95 border-slate-800/80 text-slate-100'
      }`}>
        {/* Zone 1: Brand & Operational Status */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className={`font-black tracking-tight text-sm font-sans ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>
              PROGNOSTICATOR
            </span>
            <span className="font-mono text-[10px] tracking-wider text-cyan-400 border border-cyan-500/30 px-1 py-0.2 rounded bg-cyan-950/40">
              v2.4
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">&middot;</span>
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Surveillance Active:</span>
            <span className="text-cyan-300 font-semibold">{frameworkDetail.countryName.split(' ')[0]}</span>
          </div>
        </div>

        {/* Zone 2: View Mode Indicator & Role Landing Console */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            /* Admin Console Switcher: Allows enterprise admin to inspect all 5 operational roles */
            <div className={`flex items-center border rounded-lg p-0.5 ${
              isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => handleRoleViewChange('SAFETY_DIRECTOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeRoleView === 'SAFETY_DIRECTOR'
                    ? isAccessibilityMode ? 'bg-cyan-700 text-white shadow-xs font-bold' : 'bg-cyan-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Executive Whole-Site Command & Prognostics"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Executive Site Command</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('OCCUPATIONAL_HEALTH_OFFICER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeRoleView === 'OCCUPATIONAL_HEALTH_OFFICER'
                    ? isAccessibilityMode ? 'bg-emerald-700 text-white shadow-xs font-bold' : 'bg-emerald-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Occupational Health & Clinical Triage Center"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Clinical Health</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('FACILITY_ENGINEER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeRoleView === 'FACILITY_ENGINEER'
                    ? isAccessibilityMode ? 'bg-amber-700 text-white shadow-xs font-bold' : 'bg-amber-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Facility HVAC & Mechanical Reliability Console"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Facility HVAC</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('COMPLIANCE_AUDITOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeRoleView === 'COMPLIANCE_AUDITOR'
                    ? isAccessibilityMode ? 'bg-rose-700 text-white shadow-xs font-bold' : 'bg-rose-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Statutory Regulatory Compliance & WSH Audit"
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">WSH Audit</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('FRONTLINE_WORKER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeRoleView === 'FRONTLINE_WORKER'
                    ? isAccessibilityMode ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-purple-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sovereign Worker Private Biometric Terminal"
              >
                <HardHat className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Worker Shield</span>
              </button>
            </div>
          ) : (
            /* Non-Admin Locked Indicator: strictly locked to assigned role */
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isAccessibilityMode ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                {getRoleIcon(currentUser.role)}
                <span className="font-bold text-xs">{getRoleLandingTitle(currentUser.role)}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                <span>Role Assigned by Admin</span>
              </span>
            </div>
          )}
        </div>

        {/* Zone 3: Right Action Cluster: Admin Role Management, Persona, Compliance, A11y, Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Admin Role Management Trigger (Exclusive to Admin) */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsRbacModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
                isAccessibilityMode
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100'
                  : 'bg-indigo-950/50 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/40'
              }`}
              title="Enterprise Administrator: Manage User Roles and PBAC Policies"
            >
              <Key className="h-3.5 w-3.5 text-indigo-400" />
              <span>Manage User Roles (Admin)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRbacModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer shadow-xs ${
                isAccessibilityMode
                  ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-white'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title="Inspect Your Role Permissions & PBAC Policy evaluation"
            >
              <Lock className="h-3 w-3 text-slate-400" />
              <span className="hidden md:inline">Permissions</span>
            </button>
          )}

          {/* Persona Card / Switcher Button: Switcher is accessible to Admin; Non-admin sees locked persona badge */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer shadow-xs ${
                isAccessibilityMode
                  ? 'bg-slate-100 hover:bg-white text-slate-900 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800/90 text-slate-200 border-slate-700'
              }`}
              title="Click to switch test persona"
            >
              <div className={`h-5 w-5 rounded-md ${currentUser.avatarColor} text-white font-bold flex items-center justify-center text-[10px]`}>
                {currentUser.avatarInitials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                  <span>{currentUser.name.split(',')[0]}</span>
                  {getRoleIcon()}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  {currentUser.role.replace(/_/g, ' ')}
                </div>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                SWITCH
              </span>
            </button>
          ) : (
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isAccessibilityMode
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-slate-900/90 text-slate-200 border-slate-800'
            }`}>
              <div className={`h-5 w-5 rounded-md ${currentUser.avatarColor} text-white font-bold flex items-center justify-center text-[10px]`}>
                {currentUser.avatarInitials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                  <span>{currentUser.name.split(',')[0]}</span>
                  {getRoleIcon()}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  {currentUser.role.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          )}

          {/* Country & Migrant Workforce Compliance Button */}
          <button
            type="button"
            onClick={() => setIsComplianceModalOpen(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
            }`}
            title="Inspect Country & Migrant Workforce Compliance (Singapore MOM, GCC MoHRE, OSHA, GDPR)"
          >
            <Scale className="h-3.5 w-3.5 text-emerald-400" />
            <span>{frameworkDetail.countryName.split(' ')[0]} Compliance</span>
            <span className="text-[9px] font-mono bg-emerald-900 text-emerald-200 px-1 py-0.2 rounded font-bold">
              {frameworkDetail.regulatoryBody.split(' ')[0]}
            </span>
          </button>

          {/* Global Accessibility Mode Toggle Button */}
          <button
            type="button"
            role="switch"
            aria-checked={isAccessibilityMode}
            onClick={toggleAccessibilityMode}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Accessibility Mode: High-contrast light presentation"
          >
            <Eye className={`h-3.5 w-3.5 ${isAccessibilityMode ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">A11y</span>
            <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold ${
              isAccessibilityMode ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {isAccessibilityMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setIsArchModalOpen(true)}
            className={`flex items-center space-x-1 transition text-[11px] cursor-pointer ${
              isAccessibilityMode ? 'text-slate-700 hover:text-cyan-700 font-medium' : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">System Spec</span>
          </button>

          {/* Direct Logout Button */}
          <button
            type="button"
            onClick={() => {
              authService.logout();
              setIsAuthenticated(false);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-900 text-rose-400 border-rose-500/30 hover:bg-rose-950/40'
            }`}
            title="Log out and return to Login Gateway"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>

      {/* PBAC Access Denied Notification Banner */}
      {accessDeniedMessage && (
        <div className="bg-rose-950/80 border-b border-rose-500/60 p-3 px-6 text-xs text-rose-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-100">PBAC Access Guarded:</span>
            <span>{accessDeniedMessage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setAccessDeniedMessage(null)}
              className="text-rose-400 hover:text-white font-bold text-xs p-1"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Strictly renders the dedicated landing dashboard based on role */}
      <main className="flex-1">
        {activeRoleView === 'SAFETY_DIRECTOR' && (
          <ManagerDashboard
            isAccessibilityMode={isAccessibilityMode}
            onToggleAccessibilityMode={toggleAccessibilityMode}
            currentUser={currentUser}
          />
        )}

        {activeRoleView === 'OCCUPATIONAL_HEALTH_OFFICER' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-emerald-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping mr-2"></span>
                Loading Occupational Health &amp; Clinical Triage Console...
              </div>
            }
          >
            <ClinicianHealthDashboard
              currentUser={currentUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'FACILITY_ENGINEER' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-amber-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping mr-2"></span>
                Loading Facility Engineering &amp; Mechanical Reliability Console...
              </div>
            }
          >
            <FacilityEngineeringDashboard
              currentUser={currentUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'COMPLIANCE_AUDITOR' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-rose-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-ping mr-2"></span>
                Loading Statutory Regulatory Compliance &amp; WSH Audit Inspectorate...
              </div>
            }
          >
            <ComplianceAuditorDashboard
              currentUser={currentUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'FRONTLINE_WORKER' && (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12 text-purple-400 font-mono text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping mr-2"></span>
                  Loading sovereign private biometric shield...
                </div>
              }
            >
              <WorkerPrivateDashboard />
            </Suspense>
          </div>
        )}
      </main>

      {/* Persistent Platform & Compliance Footer */}
      <footer className={`border-t px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 transition-colors ${
        isAccessibilityMode ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-900 text-slate-500'
      }`}>
        <div className="flex items-center space-x-3">
          <span>&copy; 2026 Prognosticator Intelligence Platform</span>
          <span className={`hidden sm:inline ${isAccessibilityMode ? 'text-slate-400' : 'text-slate-700'}`}>·</span>
          <span className={isAccessibilityMode ? 'text-slate-900 font-medium' : 'text-slate-400'}>
            {frameworkDetail.countryName} ({frameworkDetail.regulatoryBody.split(' ')[0]}) &amp; HIPAA Shield Certified
          </span>
        </div>
        <div className={`text-[11px] font-mono ${isAccessibilityMode ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
          Dual Workforce Equity · Non-Punitive Telemetry · k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
        </div>
      </footer>

      {/* System Pipeline Architecture Modal */}
      {isArchModalOpen && (
        <Suspense fallback={null}>
          <ArchitectureModal
            isOpen={true}
            onClose={() => setIsArchModalOpen(false)}
          />
        </Suspense>
      )}

      {/* User Login & Persona Switcher Modal */}
      {isLoginModalOpen && (
        <Suspense fallback={null}>
          <UserLoginModal
            isOpen={true}
            onClose={() => setIsLoginModalOpen(false)}
            onUserChanged={(user) => {
              setCurrentUser(user);
              setIsAuthenticated(true);
              setActiveRoleView(user.role);
            }}
          />
        </Suspense>
      )}

      {/* RBAC / PBAC Permissions Matrix & Role Management Modal */}
      {isRbacModalOpen && (
        <Suspense fallback={null}>
          <UserManagementRbacModal
            isOpen={true}
            onClose={() => setIsRbacModalOpen(false)}
            onSelectPersona={(persona) => {
              setCurrentUser(persona);
              setIsAuthenticated(true);
              setActiveRoleView(persona.role);
            }}
          />
        </Suspense>
      )}

      {/* Country & Migrant Workforce Compliance Modal */}
      {isComplianceModalOpen && (
        <Suspense fallback={null}>
          <MigrantWorkforceComplianceModal
            isOpen={true}
            onClose={() => setIsComplianceModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

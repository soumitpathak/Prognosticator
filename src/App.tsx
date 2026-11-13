import React, { useState, useEffect, lazy, Suspense } from 'react';
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
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
  Eye,
  LogOut,
  Lock,
  AlertTriangle,
  HardHat,
  Stethoscope,
  Wrench,
  FileCheck,
  Key,
  Globe2
} from 'lucide-react';
import { UserPersona, RegulatoryJurisdiction, UserRole } from './types';
import { authService, REGULATORY_FRAMEWORKS, TARGET_PERSONAS } from './services/authService';
import { useTranslation } from './services/i18nService';
import LanguageAutocomplete from './components/LanguageAutocomplete';

export default function App() {
  const { t } = useTranslation();
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
        return t.shell.roleTabDirector;
      case 'OCCUPATIONAL_HEALTH_OFFICER':
        return t.clinician.title;
      case 'FACILITY_ENGINEER':
        return t.engineer.title;
      case 'COMPLIANCE_AUDITOR':
        return t.auditor.title;
      case 'FRONTLINE_WORKER':
        return t.worker.title;
    }
  };

  const getShortCountryLabel = (jur: RegulatoryJurisdiction) => {
    switch (jur) {
      case 'SINGAPORE_MOM':
        return 'Singapore (MOM)';
      case 'GCC_MOHRE':
        return 'GCC (MoHRE)';
      case 'US_OSHA_NIOSH':
        return 'United States (OSHA)';
      case 'EU_GDPR_OSHA':
        return 'European Union (GDPR)';
    }
  };

  // When an Admin audits another role via the top console switcher, reflect that role's persona context
  const effectiveRoleUser: UserPersona =
    isAdmin && activeRoleView !== currentUser.role
      ? TARGET_PERSONAS.find((p) => p.role === activeRoleView) || currentUser
      : currentUser;

  // If user is not authenticated, display the full Enterprise Login Gateway
  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className={`min-h-screen flex items-center justify-center font-mono text-xs ${
            isAccessibilityMode ? 'bg-slate-100 text-cyan-800' : 'bg-slate-950 text-cyan-400'
          }`}>
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping mr-2"></span>
            {t.shell.loadingGateway}
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
        {/* Zone 1: Brand & Operational Jurisdiction */}
        <div className="flex items-center space-x-3 shrink-0">
          <span className={`font-extrabold tracking-tight text-sm font-sans whitespace-nowrap ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>
            PROGNOSTICATOR
          </span>
          <span className={`hidden sm:inline ${isAccessibilityMode ? 'text-slate-400' : 'text-slate-600'}`} aria-hidden="true">&middot;</span>
          <div className={`hidden lg:flex items-center space-x-1.5 text-[11px] font-sans ${
            isAccessibilityMode ? 'text-slate-700' : 'text-slate-400'
          }`}>
            <span>{t.shell.surveillanceActive}</span>
            <span className={`font-semibold ${isAccessibilityMode ? 'text-cyan-800' : 'text-cyan-300'}`}>
              {getShortCountryLabel(currentJurisdiction)}
            </span>
          </div>
        </div>

        {/* Zone 2: View Mode Indicator & Role Landing Console */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            /* Admin Console Switcher: Allows enterprise admin to audit all 5 operational roles */
            <div className={`flex items-center border rounded-lg p-0.5 ${
              isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => handleRoleViewChange('SAFETY_DIRECTOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeRoleView === 'SAFETY_DIRECTOR'
                    ? isAccessibilityMode ? 'bg-cyan-700 text-white shadow-xs font-bold' : 'bg-cyan-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.shell.roleTabDirector}
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.shell.roleTabDirector}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('OCCUPATIONAL_HEALTH_OFFICER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeRoleView === 'OCCUPATIONAL_HEALTH_OFFICER'
                    ? isAccessibilityMode ? 'bg-emerald-700 text-white shadow-xs font-bold' : 'bg-emerald-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.clinician.title}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t.shell.roleTabClinician}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('FACILITY_ENGINEER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeRoleView === 'FACILITY_ENGINEER'
                    ? isAccessibilityMode ? 'bg-amber-700 text-white shadow-xs font-bold' : 'bg-amber-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.engineer.title}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t.shell.roleTabEngineer}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('COMPLIANCE_AUDITOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeRoleView === 'COMPLIANCE_AUDITOR'
                    ? isAccessibilityMode ? 'bg-rose-700 text-white shadow-xs font-bold' : 'bg-rose-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.auditor.title}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{t.shell.roleTabAuditor}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleViewChange('FRONTLINE_WORKER')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeRoleView === 'FRONTLINE_WORKER'
                    ? isAccessibilityMode ? 'bg-purple-700 text-white shadow-xs font-bold' : 'bg-purple-600 text-white shadow-xs'
                    : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.worker.title}
              >
                <HardHat className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.shell.roleTabWorker}</span>
              </button>
            </div>
          ) : (
            /* Non-Admin Locked Indicator: strictly locked to assigned role */
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
              isAccessibilityMode ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900/80 border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                {getRoleIcon(currentUser.role)}
                <span className="font-bold text-xs">{getRoleLandingTitle(currentUser.role)}</span>
              </div>
              <span className={isAccessibilityMode ? 'text-slate-400' : 'text-slate-600'} aria-hidden="true">&middot;</span>
              <span className={`text-[11px] font-sans flex items-center gap-1 whitespace-nowrap ${
                isAccessibilityMode ? 'text-slate-700 font-medium' : 'text-slate-400'
              }`}>
                <Lock className="h-3 w-3" />
                <span>{t.shell.strictRoleSeparation}</span>
              </span>
            </div>
          )}
        </div>

        {/* Zone 3: Right Action Cluster: Clean Persona & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Persona Card: Switcher accessible to Admin; Non-admin sees locked role badge */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer shadow-xs ${
                isAccessibilityMode
                  ? 'bg-slate-100 hover:bg-white text-slate-900 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800/90 text-slate-200 border-slate-700'
              }`}
              title="Click to switch test persona or manage credentials"
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
              <span className={`text-[10px] font-sans font-semibold whitespace-nowrap ${
                isAccessibilityMode ? 'text-cyan-800' : 'text-cyan-400'
              }`}>
                &middot; {t.shell.switchLabel}
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

          {/* Direct Admin RBAC & Jurisdiction Compliance Buttons */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsRbacModalOpen(true)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs whitespace-nowrap ${
                isAccessibilityMode
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
                  : 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border-indigo-500/40'
              }`}
              title="Open Enterprise User Management & PBAC Role Matrix"
            >
              <Key className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden xl:inline">{t.shell.rbacLabel}</span>
            </button>
          )}

          {activeRoleView !== 'FRONTLINE_WORKER' && (
            <button
              type="button"
              onClick={() => setIsComplianceModalOpen(true)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs whitespace-nowrap ${
                isAccessibilityMode
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-500/30'
              }`}
              title="View Country & Migrant Workforce Statutory Protections"
            >
              <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden xl:inline">{t.shell.statutesLabel}</span>
            </button>
          )}

          {/* Frontline Worker Sovereign Protection Indicator */}
          {activeRoleView === 'FRONTLINE_WORKER' && (
            <div className={`flex items-center gap-1.5 px-1.5 text-[11px] font-sans font-medium whitespace-nowrap ${
              isAccessibilityMode ? 'text-purple-800' : 'text-purple-300'
            }`}>
              <Shield className={`h-3.5 w-3.5 ${isAccessibilityMode ? 'text-purple-700' : 'text-purple-400'}`} />
              <span>{t.shell.sovereignShield}</span>
            </div>
          )}

          {/* Global Accessibility / Sunlight High-Contrast Mode Toggle Button (All Roles) */}
          <button
            type="button"
            role="switch"
            aria-checked={isAccessibilityMode}
            onClick={toggleAccessibilityMode}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs whitespace-nowrap ${
              isAccessibilityMode
                ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-400/50 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Accessibility & Sunlight High-Contrast Light Mode"
          >
            <Eye className={`h-3.5 w-3.5 ${isAccessibilityMode ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{t.shell.a11yLabel}</span>
            <span className={`text-[10px] font-mono tabular-nums font-bold ${
              isAccessibilityMode ? 'text-slate-950' : 'text-slate-400'
            }`}>
              {isAccessibilityMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Direct Logout Button */}
          <button
            type="button"
            onClick={() => {
              authService.logout();
              setIsAuthenticated(false);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer shadow-xs whitespace-nowrap ${
              isAccessibilityMode
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-900 text-rose-400 border-rose-500/30 hover:bg-rose-950/40'
            }`}
            title="Log out and return to Login Gateway"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">{t.shell.logOut}</span>
          </button>
        </div>
      </div>

      {/* PBAC Access Denied Notification Banner */}
      {accessDeniedMessage && (
        <div className={`border-b p-3 px-6 text-xs flex items-center justify-between gap-3 animate-fadeIn ${
          isAccessibilityMode
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className={`h-4 w-4 shrink-0 ${isAccessibilityMode ? 'text-rose-700' : 'text-rose-400'}`} />
            <span className={`font-semibold ${isAccessibilityMode ? 'text-rose-950' : 'text-rose-100'}`}>PBAC Access Guarded:</span>
            <span>{accessDeniedMessage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setAccessDeniedMessage(null)}
              className={`font-bold text-xs p-1 cursor-pointer ${
                isAccessibilityMode ? 'text-rose-700 hover:text-rose-950' : 'text-rose-400 hover:text-white'
              }`}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Admin Role-Audit Indicator when previewing another operational role */}
      {isAdmin && activeRoleView !== currentUser.role && (
        <div className={`border-b px-6 py-2 text-xs flex items-center justify-between gap-3 ${
          isAccessibilityMode
            ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
            : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className={`h-3.5 w-3.5 shrink-0 ${isAccessibilityMode ? 'text-indigo-700' : 'text-indigo-400'}`} />
            <span>
              <strong>{t.shell.adminPreviewTitle}</strong> {t.shell.adminPreviewViewing}{' '}
              <strong className={isAccessibilityMode ? 'text-slate-950' : 'text-white'}>
                {getRoleLandingTitle(activeRoleView)}
              </strong> ({effectiveRoleUser.name}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveRoleView(currentUser.role)}
            className={`text-[11px] font-mono underline cursor-pointer shrink-0 ${
              isAccessibilityMode ? 'text-cyan-800 hover:text-slate-950 font-bold' : 'text-cyan-300 hover:text-white'
            }`}
          >
            {t.shell.returnToExec} &rarr;
          </button>
        </div>
      )}

      {/* Main Content Area: Strictly renders the dedicated landing dashboard based on role */}
      <main className="flex-1">
        {activeRoleView === 'SAFETY_DIRECTOR' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping mr-2"></span>
                {t.shell.loadingDirector}
              </div>
            }
          >
            <ManagerDashboard
              isAccessibilityMode={isAccessibilityMode}
              onToggleAccessibilityMode={toggleAccessibilityMode}
              currentUser={effectiveRoleUser}
            />
          </Suspense>
        )}

        {activeRoleView === 'OCCUPATIONAL_HEALTH_OFFICER' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-emerald-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping mr-2"></span>
                {t.shell.loadingClinician}
              </div>
            }
          >
            <ClinicianHealthDashboard
              currentUser={effectiveRoleUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'FACILITY_ENGINEER' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-amber-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping mr-2"></span>
                {t.shell.loadingEngineer}
              </div>
            }
          >
            <FacilityEngineeringDashboard
              currentUser={effectiveRoleUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'COMPLIANCE_AUDITOR' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-rose-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-ping mr-2"></span>
                {t.shell.loadingAuditor}
              </div>
            }
          >
            <ComplianceAuditorDashboard
              currentUser={effectiveRoleUser}
              isAccessibilityMode={isAccessibilityMode}
            />
          </Suspense>
        )}

        {activeRoleView === 'FRONTLINE_WORKER' && (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Suspense
              fallback={
                <div className={`flex items-center justify-center p-12 font-mono text-sm ${
                  isAccessibilityMode ? 'text-purple-800' : 'text-purple-400'
                }`}>
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping mr-2"></span>
                  {t.shell.loadingWorker}
                </div>
              }
            >
              <WorkerPrivateDashboard
                currentUser={effectiveRoleUser}
                isAccessibilityMode={isAccessibilityMode}
              />
            </Suspense>
          </div>
        )}
      </main>

      {/* Persistent Platform & Compliance Footer with Single-Select Autocomplete Language Selector */}
      <footer className={`border-t px-4 md:px-6 py-3 flex flex-col lg:flex-row items-center justify-between text-xs gap-3 transition-colors ${
        isAccessibilityMode ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-900 text-slate-500'
      }`}>
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
          <span>{t.shell.footerCopyright}</span>
          <span className={`hidden sm:inline ${isAccessibilityMode ? 'text-slate-400' : 'text-slate-700'}`}>·</span>
          <span className={isAccessibilityMode ? 'text-slate-900 font-medium' : 'text-slate-400'}>
            {frameworkDetail.countryName} ({frameworkDetail.regulatoryBody.split(' ')[0]}) &amp; {t.shell.footerCertified}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
          <div className={`text-[11px] font-mono ${isAccessibilityMode ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
            {t.shell.footerInvariants}
          </div>
          <LanguageAutocomplete
            dropDirection="up"
            isAccessibilityMode={isAccessibilityMode}
            idPrefix="app-footer-lang"
          />
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
            onOpenRbacModal={isAdmin ? () => {
              setIsLoginModalOpen(false);
              setIsRbacModalOpen(true);
            } : undefined}
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

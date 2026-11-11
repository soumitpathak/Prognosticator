import React, { useState, useEffect, lazy, Suspense } from 'react';
import ManagerDashboard from './components/ManagerDashboard';
const WorkerPrivateDashboard = lazy(() => import('./components/WorkerPrivateDashboard'));
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
import { UserPersona, RegulatoryJurisdiction } from './types';
import { authService, REGULATORY_FRAMEWORKS } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserPersona>(() => authService.getCurrentUser());
  const [currentJurisdiction, setCurrentJurisdiction] = useState<RegulatoryJurisdiction>(() =>
    authService.getActiveJurisdiction()
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  const [activeTab, setActiveTab] = useState<'manager' | 'worker'>(() => {
    const user = authService.getCurrentUser();
    return user.role === 'FRONTLINE_WORKER' ? 'worker' : 'manager';
  });

  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRbacModalOpen, setIsRbacModalOpen] = useState<boolean>(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

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
      if (user.role === 'FRONTLINE_WORKER') {
        setActiveTab('worker');
      }
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

  const handleTabChange = (target: 'manager' | 'worker') => {
    if (target === 'manager' && currentUser.role === 'FRONTLINE_WORKER') {
      const policyCheck = authService.evaluatePolicy('VIEW_AGGREGATE_ANALYTICS');
      setAccessDeniedMessage(policyCheck.reason);
      return;
    }
    setAccessDeniedMessage(null);
    setActiveTab(target);
  };

  const frameworkDetail = REGULATORY_FRAMEWORKS[currentJurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;

  const getRoleIcon = () => {
    switch (currentUser.role) {
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
            if (user.role === 'FRONTLINE_WORKER') {
              setActiveTab('worker');
            } else {
              setActiveTab('manager');
            }
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
      {/* Top Universal Mode Bar */}
      <div className={`border-b px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
        isAccessibilityMode ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center space-x-2.5">
          <span className={`font-bold tracking-tight text-sm font-sans ${isAccessibilityMode ? 'text-slate-950' : 'text-white'}`}>Prognosticator</span>
          <span className="text-slate-400 hidden sm:inline">·</span>
          <span className={`text-xs hidden sm:inline ${isAccessibilityMode ? 'text-slate-700' : 'text-slate-400'}`}>Workforce Health Early Warning Intelligence</span>
        </div>

        {/* View Mode Switcher */}
        <div className={`flex items-center border rounded-lg p-0.5 ${
          isAccessibilityMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => handleTabChange('manager')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === 'manager'
                ? isAccessibilityMode ? 'bg-cyan-700 text-white shadow-xs font-bold' : 'bg-cyan-600 text-white shadow-sm'
                : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Safety Manager Portal</span>
          </button>
          <button
            onClick={() => handleTabChange('worker')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === 'worker'
                ? isAccessibilityMode ? 'bg-cyan-700 text-white shadow-xs font-bold' : 'bg-cyan-600 text-white shadow-sm'
                : isAccessibilityMode ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Private Worker View</span>
          </button>
        </div>

        {/* Right Action Cluster: RBAC Persona, Country Compliance, Accessibility, Architecture, Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Active Persona Pill / Switcher Button */}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-slate-100 hover:bg-white text-slate-900 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Click to switch user persona or view credentials"
          >
            <div className={`h-5 w-5 rounded-full ${currentUser.avatarColor} text-white font-bold flex items-center justify-center text-[10px]`}>
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
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              SWITCH
            </span>
          </button>

          {/* RBAC & PBAC Permissions Inspector Button */}
          <button
            type="button"
            onClick={() => setIsRbacModalOpen(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-white'
                : 'bg-slate-900 text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/40'
            }`}
            title="Inspect Role-Based & Policy-Based Access Control matrix"
          >
            <Key className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">RBAC Matrix</span>
          </button>

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
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-rose-900 hover:bg-rose-800 text-white font-bold px-2.5 py-1 rounded text-[11px] transition cursor-pointer border border-rose-500/40"
            >
              Switch to Safety Manager Persona
            </button>
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

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'manager' ? (
          <ManagerDashboard
            isAccessibilityMode={isAccessibilityMode}
            onToggleAccessibilityMode={toggleAccessibilityMode}
          />
        ) : (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping mr-2"></span>
                Loading private biometric vault...
              </div>
            }>
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
              if (user.role === 'FRONTLINE_WORKER') {
                setActiveTab('worker');
              }
            }}
          />
        </Suspense>
      )}

      {/* RBAC / PBAC Permissions Matrix Modal */}
      {isRbacModalOpen && (
        <Suspense fallback={null}>
          <UserManagementRbacModal
            isOpen={true}
            onClose={() => setIsRbacModalOpen(false)}
            onSelectPersona={(persona) => {
              setCurrentUser(persona);
              setIsAuthenticated(true);
              if (persona.role === 'FRONTLINE_WORKER') {
                setActiveTab('worker');
              }
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

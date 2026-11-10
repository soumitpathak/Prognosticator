import React, { useState, useEffect, lazy, Suspense } from 'react';
import ManagerDashboard from './components/ManagerDashboard';
const WorkerPrivateDashboard = lazy(() => import('./components/WorkerPrivateDashboard'));
const ArchitectureModal = lazy(() => import('./components/ArchitectureModal'));
import { Shield, UserCheck, Layers, Eye } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'worker'>('manager');
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);

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

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white ${
      isAccessibilityMode ? 'manager-high-contrast-light bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Universal Mode Bar */}
      <div className={`border-b px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
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
            onClick={() => setActiveTab('manager')}
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
            onClick={() => setActiveTab('worker')}
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

        {/* Global Accessibility Mode Toggle & System Spec trigger */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Global Accessibility Mode Toggle Button */}
          <button
            type="button"
            role="switch"
            aria-checked={isAccessibilityMode}
            onClick={toggleAccessibilityMode}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
              isAccessibilityMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Accessibility Mode: High-contrast light presentation for visually impaired users (applies .manager-high-contrast-light to root element)"
          >
            <Eye className={`h-3.5 w-3.5 ${isAccessibilityMode ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Accessibility Mode</span>
            <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
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
            <span>System Pipeline &amp; Privacy Spec</span>
          </button>
        </div>
      </div>

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
          <span className={isAccessibilityMode ? 'text-slate-900 font-medium' : 'text-slate-400'}>GDPR &amp; HIPAA Privacy Shield Certified</span>
        </div>
        <div className={`text-[11px] font-mono ${isAccessibilityMode ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
          Non-Punitive Telemetry · k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
        </div>
      </footer>

      {/* System Pipeline Architecture Modal (Rendered on-demand) */}
      {isArchModalOpen && (
        <Suspense fallback={null}>
          <ArchitectureModal
            isOpen={true}
            onClose={() => setIsArchModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

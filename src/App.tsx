import React, { useState, useEffect } from 'react';
import ManagerDashboard from './components/ManagerDashboard';
import WorkerPrivateDashboard from './components/WorkerPrivateDashboard';
import ArchitectureModal from './components/ArchitectureModal';
import { Shield, UserCheck, Layers, Radio, Eye } from 'lucide-react';

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
      <div className="bg-slate-950 border-b border-slate-800 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <span className="text-white font-bold tracking-tight text-sm font-sans">Prognosticator</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 text-xs hidden sm:inline">Workforce Health Early Warning Intelligence</span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'manager'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Safety Manager Portal</span>
          </button>
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'worker'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
            className="flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition text-[11px]"
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
            <WorkerPrivateDashboard />
          </div>
        )}
      </main>

      {/* Persistent Platform & Compliance Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span>&copy; 2026 Prognosticator Intelligence Platform</span>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span className="text-slate-400">GDPR &amp; HIPAA Privacy Shield Certified</span>
        </div>
        <div className="text-slate-500 text-[11px] font-mono">
          Non-Punitive Telemetry · k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
        </div>
      </footer>

      {/* System Pipeline Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}

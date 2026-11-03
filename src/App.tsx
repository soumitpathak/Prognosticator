import React, { useState } from 'react';
import ManagerDashboard from './components/ManagerDashboard';
import WorkerPrivateDashboard from './components/WorkerPrivateDashboard';
import ArchitectureModal from './components/ArchitectureModal';
import { Shield, UserCheck, Layers, Radio } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'worker'>('manager');
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Universal Mode Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold tracking-wider font-mono text-[11px]">PROGNOSTICATOR v2.0</span>
          <span className="text-slate-600">/</span>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>Azure IoT Hub Gateway Active</span>
          </div>
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

        {/* System Spec & Architecture trigger */}
        <div className="flex items-center gap-3">
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
          <ManagerDashboard />
        ) : (
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <WorkerPrivateDashboard />
          </div>
        )}
      </main>

      {/* Persistent System Health Footer matching API /health */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 md:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Engine: Prognosticator LSTM-Kalman Core (Online)</span>
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-slate-400">Compliance: GDPR &amp; HIPAA Aligned</span>
        </div>
        <div className="text-slate-500 font-mono">
          Privacy Shield: k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
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

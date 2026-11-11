import React, { useState } from 'react';
import {
  Stethoscope,
  Heart,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  Thermometer,
  Clock,
  UserCheck,
  Send,
  CheckCircle2,
  FileText,
  Filter,
  Sparkles
} from 'lucide-react';
import { UserPersona } from '../types';

interface ClinicianHealthDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

interface ClinicalTriageRecord {
  id: string;
  workerPseudonym: string;
  zone: string;
  department: string;
  heartRate: number;
  hrv: number;
  skinTemp: number;
  dehydrationIndex: number;
  triagePriority: 'URGENT' | 'HIGH' | 'OBSERVE';
  recommendedAction: string;
  status: 'PENDING' | 'DISPATCHED' | 'EVALUATED';
}

const INITIAL_CLINICAL_QUEUE: ClinicalTriageRecord[] = [
  {
    id: 'CLIN-001',
    workerPseudonym: 'W-9921',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Civil Infrastructure Deep Foundation',
    heartRate: 138,
    hrv: 31.0,
    skinTemp: 38.6,
    dehydrationIndex: 88,
    triagePriority: 'URGENT',
    recommendedAction: 'Immediate shaded cooling extraction; stage rapid oral electrolyte rehydration.',
    status: 'PENDING'
  },
  {
    id: 'CLIN-002',
    workerPseudonym: 'W-4810',
    zone: 'Underground-Tunnel-Shaft-B',
    department: 'Tunneling & Structural Rigging',
    heartRate: 124,
    hrv: 34.5,
    skinTemp: 38.1,
    dehydrationIndex: 76,
    triagePriority: 'HIGH',
    recommendedAction: 'Mandate 20-minute shaded rest break; deliver 750ml cold electrolyte drink.',
    status: 'PENDING'
  },
  {
    id: 'CLIN-003',
    workerPseudonym: 'W-7742',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Civil Infrastructure Deep Foundation',
    heartRate: 118,
    hrv: 38.2,
    skinTemp: 37.9,
    dehydrationIndex: 68,
    triagePriority: 'OBSERVE',
    recommendedAction: 'Remote monitoring active; verify water station consumption at 14:00.',
    status: 'EVALUATED'
  }
];

export default function ClinicianHealthDashboard({
  currentUser,
  isAccessibilityMode = false
}: ClinicianHealthDashboardProps) {
  const [triageQueue, setTriageQueue] = useState<ClinicalTriageRecord[]>(INITIAL_CLINICAL_QUEUE);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  const handleDispatchRehydration = (recordId: string) => {
    setTriageQueue((prev) =>
      prev.map((item) => (item.id === recordId ? { ...item, status: 'DISPATCHED' } : item))
    );
    setDispatchFeedback(`Medical liaison and oral electrolyte protocol dispatched for Record [${recordId}].`);
    setTimeout(() => setDispatchFeedback(null), 5000);
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Clinician Command Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950/40">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Occupational Health &amp; Clinical Triage Center
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                CLINICAL MD CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>HIPAA §164.514 &amp; GDPR Art. 9 Guarded</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold">
            Zero Disciplinary Tracking
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      {dispatchFeedback && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{dispatchFeedback}</span>
        </div>
      )}

      {/* Clinical KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Cohort Mean HRV</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">34.2 ms</div>
          <div className="text-[11px] text-rose-400 mt-1 font-mono">-43.0% Autonomic Suppression</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Epidermal Core Temp</span>
            <Thermometer className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">38.12&deg;C</div>
          <div className="text-[11px] text-rose-400 mt-1 font-mono">+1.62&deg;C Core Heat Elevation</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Mean Exertion HR</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono tabular-nums">124 BPM</div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">Tachycardic Cutoff: 115 BPM</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Oral Rehydration Queue</span>
            <Droplets className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">18 Workers</div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono">Stage-2 Electrolyte Protocol</div>
        </div>
      </div>

      {/* Main Grid: Triage Queue & Clinical Biomarker Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Active Clinical Triage Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Active Physiological Strain &amp; Dehydration Triage Queue</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time algorithmic flags prioritized by autonomic cardiac strain and core temperature spike.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {triageQueue.filter((q) => q.status !== 'EVALUATED').length} Pending Review
              </span>
            </div>

            <div className="space-y-3">
              {triageQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition ${
                    item.triagePriority === 'URGENT'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : item.triagePriority === 'HIGH'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white font-mono">{item.workerPseudonym}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            item.triagePriority === 'URGENT'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : item.triagePriority === 'HIGH'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {item.triagePriority} PRIORITY
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.zone}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.department}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.status === 'DISPATCHED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Vitals Row */}
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono my-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Heart Rate</span>
                      <span className="font-bold text-white">{item.heartRate} BPM</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">HRV Autonomic</span>
                      <span className="font-bold text-rose-400">{item.hrv} ms</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Skin Temp</span>
                      <span className="font-bold text-amber-300">{item.skinTemp}&deg;C</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Dehydration Index</span>
                      <span className="font-bold text-cyan-300">{item.dehydrationIndex} / 100</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    <strong>Clinical Action:</strong> {item.recommendedAction}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                    {item.status !== 'DISPATCHED' && (
                      <button
                        type="button"
                        onClick={() => handleDispatchRehydration(item.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="h-3 w-3" />
                        <span>Dispatch Oral Rehydration Liaison</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Physiological Strain Correlation & Confidential Consult Ledger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Autonomic Nervous System Correlation (HRV vs Temp)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Inverse autonomic relationship between heart rate elevation and parasympathetic HRV suppression.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4">
              <div className="h-32 w-full flex items-end gap-2 pt-2 px-1">
                {[
                  { hrv: '58ms', hr: 78 },
                  { hrv: '52ms', hr: 88 },
                  { hrv: '46ms', hr: 98 },
                  { hrv: '39ms', hr: 112 },
                  { hrv: '34ms', hr: 124 },
                  { hrv: '31ms', hr: 138 }
                ].map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] font-mono text-cyan-300 mb-1">{point.hrv}</span>
                    <div
                      style={{ height: `${(point.hr / 140) * 100}%` }}
                      className={`w-full rounded-t ${
                        point.hr > 120 ? 'bg-rose-500' : point.hr > 100 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">{point.hr}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
                <span>Healthy Baseline (Left)</span>
                <span className="text-rose-400">Extreme Strain (Right)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Physician Ethical Boundary Standard</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                All clinical records are de-identified under HIPAA §164.514 Safe Harbor and GDPR Article 9. Site supervisors receive aggregate readiness alerts only; individual health telemetry is legally privileged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

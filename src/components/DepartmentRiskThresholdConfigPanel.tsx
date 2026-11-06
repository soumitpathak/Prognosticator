import React, { useState, useMemo } from 'react';
import {
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building2,
  MapPin,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Activity
} from 'lucide-react';
import { DepartmentRiskThreshold } from '../types';

export interface DepartmentRiskThresholdConfigPanelProps {
  departmentThresholds: DepartmentRiskThreshold[];
  onSaveThresholds: (
    updated: DepartmentRiskThreshold[],
    justification: string
  ) => void;
  onResetDefaults: () => void;
  className?: string;
}

export const DEFAULT_DEPARTMENT_RISK_THRESHOLDS: DepartmentRiskThreshold[] = [
  {
    departmentId: 'Outdoor-Construction-Sector-4',
    departmentName: 'Civil & Structural Construction',
    facilityLocation: 'GCC Megasite - Sector 4',
    thresholdPct: 75,
    defaultThresholdPct: 75,
    currentRiskScore: 88.5,
    isBreached: true,
    primaryRiskDriver: 'Extreme Ambient Thermal Loading (43.2°C) & Exertional Tachycardia'
  },
  {
    departmentId: 'Subgrade-Tunnel-Conduit-7',
    departmentName: 'Underground Infrastructure & Conduit',
    facilityLocation: 'Tunnel Complex - Conduit 7',
    thresholdPct: 70,
    defaultThresholdPct: 70,
    currentRiskScore: 86.8,
    isBreached: true,
    primaryRiskDriver: 'Acoustic Shock (104.8 dBA) & Confined Microclimate Heat'
  },
  {
    departmentId: 'Warehouse-Logistics-Hub-North',
    departmentName: 'Supply Chain & High-Bay Fulfillment',
    facilityLocation: 'London Gateway - Hub North',
    thresholdPct: 75,
    defaultThresholdPct: 75,
    currentRiskScore: 68.5,
    isBreached: false,
    primaryRiskDriver: 'Shift-End Autonomic HRV Fatigue & Repetitive Kinetic Strain'
  },
  {
    departmentId: 'Manufacturing-Assembly-Line-B',
    departmentName: 'Precision Robotics & Mechatronics',
    facilityLocation: 'Bay Area Plant - Line B',
    thresholdPct: 80,
    defaultThresholdPct: 80,
    currentRiskScore: 28.2,
    isBreached: false,
    primaryRiskDriver: 'Nominal Operations; Baseline Autonomous Vibration'
  },
  {
    departmentId: 'Chemical-Refining-Plant-C',
    departmentName: 'Hazardous Process Chemistry',
    facilityLocation: 'Gulf Coast Facility - Unit C',
    thresholdPct: 75,
    defaultThresholdPct: 75,
    currentRiskScore: 78.4,
    isBreached: true,
    primaryRiskDriver: 'Vapor Pressure Excursion & Respiratory Demand'
  },
  {
    departmentId: 'Cold-Chain-Cryogenic-Alpha',
    departmentName: 'Cold Chain & Cryogenic Logistics',
    facilityLocation: 'Rotterdam Port - Cryo Vault A',
    thresholdPct: 70,
    defaultThresholdPct: 70,
    currentRiskScore: 24.5,
    isBreached: false,
    primaryRiskDriver: 'Sub-Zero Thermal Stress Protocols Stable'
  }
];

export default function DepartmentRiskThresholdConfigPanel({
  departmentThresholds,
  onSaveThresholds,
  onResetDefaults,
  className = ''
}: DepartmentRiskThresholdConfigPanelProps) {
  const [localThresholds, setLocalThresholds] = useState<DepartmentRiskThreshold[]>(departmentThresholds);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [justification, setJustification] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync when prop updates
  React.useEffect(() => {
    setLocalThresholds(departmentThresholds);
  }, [departmentThresholds]);

  // Compute live breaches based on local slider adjustments
  const breaches = useMemo(() => {
    return localThresholds.filter((d) => d.currentRiskScore > d.thresholdPct);
  }, [localThresholds]);

  const handleSliderChange = (deptId: string, newThreshold: number) => {
    setLocalThresholds((prev) =>
      prev.map((item) =>
        item.departmentId === deptId
          ? {
              ...item,
              thresholdPct: newThreshold,
              isBreached: item.currentRiskScore > newThreshold
            }
          : item
      )
    );
  };

  const handleApplyGlobalPreset = (presetPct: number) => {
    setLocalThresholds((prev) =>
      prev.map((item) => ({
        ...item,
        thresholdPct: presetPct,
        isBreached: item.currentRiskScore > presetPct
      }))
    );
  };

  const handleSave = () => {
    onSaveThresholds(
      localThresholds,
      justification || `Updated custom department risk thresholds across ${localThresholds.length} operational divisions.`
    );
    setSaveSuccessMsg(`Custom department risk score thresholds applied and registered to System Audit Trail.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  const handleReset = () => {
    onResetDefaults();
    setJustification('');
    setSaveSuccessMsg('Restored standard department risk thresholds (Default: 75% Balanced).');
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  return (
    <div
      id="department-risk-threshold-config-panel"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shadow-sm">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">Department-Specific Risk Score Thresholds</h2>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                Granular Division Config
              </span>
              {breaches.length > 0 && (
                <span className="text-[10px] font-mono uppercase bg-rose-950 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                  {breaches.length} Departments Breaching Threshold
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure tailored risk score thresholds for distinct departments. When a department&apos;s live composite risk score crosses its threshold, a high-priority alert badge appears in the Notification Center.
            </p>
          </div>
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 transition cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Configure'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Confirmation Banner */}
      {saveSuccessMsg && (
        <div className="mt-3 bg-emerald-950/80 border border-emerald-500/50 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-mono text-emerald-300">
            AUDIT VERIFIED
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Global Quick Presets Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Bulk Enterprise Presets</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Apply standardized baseline risk score cutoffs across all operating divisions simultaneously.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleApplyGlobalPreset(60)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition cursor-pointer"
              >
                High Vigilance (60%)
              </button>
              <button
                onClick={() => handleApplyGlobalPreset(75)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 transition cursor-pointer"
              >
                Balanced Standard (75%)
              </button>
              <button
                onClick={() => handleApplyGlobalPreset(85)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                Permissive (85%)
              </button>
            </div>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {localThresholds.map((dept) => {
              const isBreached = dept.currentRiskScore > dept.thresholdPct;
              const delta = Number((dept.currentRiskScore - dept.thresholdPct).toFixed(1));

              return (
                <div
                  key={dept.departmentId}
                  className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isBreached
                      ? 'bg-rose-950/25 border-rose-500/70 shadow-md shadow-rose-950/30'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Glowing halo when breached */}
                  {isBreached && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none animate-pulse" />
                  )}

                  <div>
                    {/* Department Title & Breach Badge */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-cyan-400" />
                          <span>{dept.facilityLocation}</span>
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1" title={dept.departmentName}>
                          {dept.departmentName}
                        </h3>
                      </div>

                      {/* Breach Status Tag */}
                      {isBreached ? (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-500 bg-rose-950 text-rose-300 flex items-center gap-1 animate-pulse shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                          <span>+{delta}% BREACH</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-600/50 bg-emerald-950 text-emerald-300 shrink-0">
                          COMPLIANT
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                      <strong className="text-slate-300">Hazard:</strong> {dept.primaryRiskDriver}
                    </p>

                    {/* Live Comparison Readout */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 mb-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Live Risk Score</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong
                            className={`text-base font-mono font-bold ${
                              dept.currentRiskScore >= 80
                                ? 'text-rose-400'
                                : dept.currentRiskScore >= 60
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {dept.currentRiskScore.toFixed(1)}%
                          </strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Custom Threshold</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-base font-mono font-bold text-white">
                            {dept.thresholdPct}%
                          </strong>
                          <span className="text-[10px] text-slate-500">(Def: {dept.defaultThresholdPct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Threshold Slider */}
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>Set Alert Threshold:</span>
                        <span className="text-cyan-400 font-bold">{dept.thresholdPct}% Limit</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="95"
                        step="1"
                        value={dept.thresholdPct}
                        onChange={(e) => handleSliderChange(dept.departmentId, Number(e.target.value))}
                        className={`w-full cursor-pointer ${
                          isBreached ? 'accent-rose-500' : 'accent-indigo-500'
                        }`}
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>40% (Strict)</span>
                        <span>75% (Std)</span>
                        <span>95% (Permissive)</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Quick Presets Row */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Presets:</span>
                    <div className="flex items-center space-x-1">
                      {[60, 70, 75, 80, 85].map((presetVal) => (
                        <button
                          key={presetVal}
                          onClick={() => handleSliderChange(dept.departmentId, presetVal)}
                          className={`px-1.5 py-0.5 rounded transition ${
                            dept.thresholdPct === presetVal
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {presetVal}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar: Audit Justification & Save */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <div className="text-white font-semibold flex items-center gap-2">
                  <span>Threshold Breach Status:</span>
                  <span
                    className={`font-mono font-bold ${
                      breaches.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {breaches.length > 0
                      ? `${breaches.length} of ${localThresholds.length} Departments Breaching Configured Thresholds`
                      : 'All Departments Currently Compliant'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Threshold adjustments will update the active alert badge in the Notification Center immediately upon saving.
                </p>
              </div>
            </div>

            {/* Justification & Save Controls */}
            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Statutory reason (e.g. Extreme desert heat protocol)..."
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full md:w-72"
              />
              <button
                onClick={handleSave}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md cursor-pointer shrink-0"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save &amp; Log Audit</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer shrink-0"
                title="Reset to default department thresholds"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

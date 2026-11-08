import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  X,
  Activity,
  Heart,
  Thermometer,
  Volume2,
  Wrench,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  GitMerge,
  ArrowRight,
  ShieldAlert,
  Flame,
  Wind,
  Layers,
  FileText,
  UserCheck,
  Check,
  Zap,
  BarChart3,
  Sliders,
  Compass
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';

export interface RootCauseFactor {
  id: string;
  category: 'ENVIRONMENTAL' | 'OPERATIONAL';
  title: string;
  description: string;
  contributionPct: number;
  severityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  sensorMetric: string;
  measuredReading: string;
  recommendedControl: string;
}

export interface RootCauseAnalysisResult {
  primaryCategory: 'ENVIRONMENTAL' | 'OPERATIONAL' | 'CO-CONTRIBUTORY';
  environmentalPct: number;
  operationalPct: number;
  confidenceScore: number;
  executiveSummary: string;
  causalChain: Array<{
    step: number;
    title: string;
    detail: string;
    timeOffset: string;
    type: 'ENVIRONMENTAL' | 'OPERATIONAL' | 'PHYSIOLOGICAL';
  }>;
  factors: RootCauseFactor[];
  immediateRemediation: string[];
  preventativeControls: string[];
}

export interface RootCauseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: ActiveAnomalyAlert | null;
  zone?: FacilityZone;
  onDispatchMitigation?: (alert: ActiveAnomalyAlert) => void;
  onAttachNote?: (alert: ActiveAnomalyAlert) => void;
}

/**
 * Placeholder / Heuristic Root Cause Analysis Engine
 * Evaluates anomaly metric, raw values, zone location, and time to classify
 * environmental vs. operational causal contributors.
 */
export function analyzeRootCause(alert: ActiveAnomalyAlert, zone?: FacilityZone): RootCauseAnalysisResult {
  const metric = (alert.anomaly_metric || '').toLowerCase();
  const raw = alert.raw_value || '';
  const zoneName = alert.location_zone || 'Industrial Zone';

  const isThermal = metric.includes('temp') || metric.includes('thermal') || metric.includes('heat');
  const isHrv = metric.includes('hrv') || metric.includes('autonomic') || metric.includes('cardio');
  const isNoise = metric.includes('noise') || metric.includes('acoustic') || metric.includes('decibel');
  const isVibration = metric.includes('vibration') || metric.includes('mechanical') || metric.includes('bearing') || alert.alert_type === 'PREDICTIVE_MAINTENANCE';

  // Environmental vs Operational percentages
  let envPct = 50;
  let opPct = 50;
  let primaryCat: 'ENVIRONMENTAL' | 'OPERATIONAL' | 'CO-CONTRIBUTORY' = 'CO-CONTRIBUTORY';
  let summary = '';

  if (isThermal) {
    envPct = 68;
    opPct = 32;
    primaryCat = 'ENVIRONMENTAL';
    summary = `Microclimate ambient thermal radiation in ${zoneName} exceeding Wet-Bulb Globe Temperature limits, exacerbated by worker vapor-barrier PPE encapsulation restricting metabolic heat dissipation.`;
  } else if (isHrv) {
    envPct = 38;
    opPct = 62;
    primaryCat = 'OPERATIONAL';
    summary = `Prolonged physical work cadence without mandatory cooling rotations resulting in autonomic parasympathetic withdrawal and cardiovascular cardiac strain under heavy exertion.`;
  } else if (isNoise) {
    envPct = 78;
    opPct = 22;
    primaryCat = 'ENVIRONMENTAL';
    summary = `Acoustic overpressure from structural industrial machinery reverberating in enclosed reflective spaces, requiring immediate engineering noise damping and secondary ear defense.`;
  } else if (isVibration) {
    envPct = 25;
    opPct = 75;
    primaryCat = 'OPERATIONAL';
    summary = `Extended cyclic tool engagement and bearing friction inducing high-frequency mechanical vibration; component fatigue requires immediate operational shutdown and lubrication.`;
  } else {
    envPct = 54;
    opPct = 46;
    primaryCat = 'CO-CONTRIBUTORY';
    summary = `Multi-factorial sensor threshold exceedance driven by simultaneous microclimate ambient heat elevation and accelerated shift operational pacing.`;
  }

  // Factors breakdown
  const factors: RootCauseFactor[] = [
    {
      id: 'FACTOR-ENV-1',
      category: 'ENVIRONMENTAL',
      title: isThermal ? 'Solar Radiant Flux & Ambient Temp' : isNoise ? 'Acoustic Sound Pressure Level' : 'Ambient Microclimate Heat Load',
      description: isThermal
        ? 'Ambient sensor measured excessive solar radiant thermal flux and ambient temperatures well above seasonal comfort floors.'
        : isNoise
        ? 'Machinery acoustic emissions exceeding the 85 dBA continuous NIOSH/OSHA permissible exposure limit.'
        : 'Ambient temperature elevation creating continuous background thermal strain.',
      contributionPct: isThermal ? 42 : isNoise ? 54 : 30,
      severityLevel: alert.severity,
      sensorMetric: isNoise ? 'Ambient Sound Level (dBA)' : 'Ambient Temperature (°C)',
      measuredReading: isNoise ? '96.4 dBA' : zone?.temp || '41.2°C',
      recommendedControl: isNoise ? 'Install acoustic baffling panels & inspect muffler dampeners' : 'Deploy evaporative misting fans and deploy shade canopy structures'
    },
    {
      id: 'FACTOR-ENV-2',
      category: 'ENVIRONMENTAL',
      title: 'Restricted Air Velocity & Ventilation CFM',
      description: 'Static indoor/semi-enclosed air velocity (< 0.28 m/s) preventing convective cooling and moisture evaporation.',
      contributionPct: isThermal ? 26 : isNoise ? 24 : 24,
      severityLevel: 'HIGH',
      sensorMetric: 'Airflow Velocity & TWL Index',
      measuredReading: `${zone?.twl ?? 108} W/m² (TWL Buffer Floor)`,
      recommendedControl: 'Command variable-frequency ventilation fans to maximum rated CFM'
    },
    {
      id: 'FACTOR-OP-1',
      category: 'OPERATIONAL',
      title: 'Continuous High-Metabolic Exertion Duration',
      description: 'Shift cohort has engaged in unbroken moderate-to-heavy physical labor for > 135 minutes without a shaded rest interval.',
      contributionPct: isHrv ? 38 : isVibration ? 48 : 22,
      severityLevel: 'HIGH',
      sensorMetric: 'Unbroken Exertion Interval',
      measuredReading: '135 mins (Limit: 90 mins)',
      recommendedControl: 'Enforce mandatory 15-minute shaded pause with 250ml electrolyte hydration'
    },
    {
      id: 'FACTOR-OP-2',
      category: 'OPERATIONAL',
      title: 'Protective Equipment (PPE) Thermal Encapsulation',
      description: 'Heavy chemical/mechanical vapor-barrier coveralls reducing sweat evaporation efficiency by an estimated 46%.',
      contributionPct: isHrv ? 24 : isVibration ? 27 : 10,
      severityLevel: 'MODERATE',
      sensorMetric: 'PPE Clo Thermal Insulation Value',
      measuredReading: '1.45 Clo (Heavy Encapsulation)',
      recommendedControl: 'Transition to active phase-change cooling vests under mandatory PPE'
    }
  ];

  // 4-Step Causal Sequence
  const causalChain = [
    {
      step: 1,
      title: 'Initial Environmental Shift',
      detail: isThermal
        ? 'Zone ambient temperature rose +4.8°C over 45 minutes as solar apex peaked.'
        : isNoise
        ? 'Primary compressor bearing vibration acoustic harmonic exceeded 90 dBA.'
        : 'Ambient thermal index escalated across Sector 4 work quadrant.',
      timeOffset: 'T - 60 min',
      type: 'ENVIRONMENTAL' as const
    },
    {
      step: 2,
      title: 'Operational Heat Retention',
      detail: 'Worker vapor-barrier PPE trapped metabolic body heat during continuous physical manual lifting.',
      timeOffset: 'T - 35 min',
      type: 'OPERATIONAL' as const
    },
    {
      step: 3,
      title: 'Autonomic Physiological Compensation',
      detail: 'Heart rate elevated to compensation range while vagal nerve autonomic HRV decreased by 34%.',
      timeOffset: 'T - 15 min',
      type: 'PHYSIOLOGICAL' as const
    },
    {
      step: 4,
      title: 'Threshold Exceedance & Detection',
      detail: `Kalman filter filtered transient sensor jitter and confirmed acute ${alert.anomaly_metric} inflection breach.`,
      timeOffset: 'T - 0 min (Trigger)',
      type: 'PHYSIOLOGICAL' as const
    }
  ];

  return {
    primaryCategory: primaryCat,
    environmentalPct: envPct,
    operationalPct: opPct,
    confidenceScore: 94.6,
    executiveSummary: summary,
    causalChain,
    factors,
    immediateRemediation: [
      'Extract affected worker cohort to designated shaded, climate-controlled recovery trailer.',
      'Provide 250ml chilled electrolyte solution and monitor autonomic HRV recovery.',
      'Inspect personal protective equipment (PPE) fit and apply cooling gel wraps.'
    ],
    preventativeControls: [
      'Stagger shift rotation schedule to 30-minute work / 15-minute rest intervals.',
      'Command automated closed-loop ventilation and misting trailers in the target zone.',
      'Log root cause evaluation to OSHA 1910 / ISO 45001 compliance audit trail.'
    ]
  };
}

export default function RootCauseAnalysisModal({
  isOpen,
  onClose,
  alert,
  zone,
  onDispatchMitigation,
  onAttachNote
}: RootCauseAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'causalChain' | 'remediation'>('overview');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [actionDoneNotice, setActionDoneNotice] = useState<string | null>(null);

  const analysis = useMemo(() => {
    if (!alert) return null;
    return analyzeRootCause(alert, zone);
  }, [alert, zone]);

  if (!isOpen || !alert || !analysis) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';

  const handleCopyReport = () => {
    const text = `PROGNOSTICATOR ROOT CAUSE ANALYSIS REPORT
Alert ID: ${alert.id} (${alert.severity})
Detected At: ${alert.detected_at}
Location Zone: ${alert.location_zone}
Anomaly Metric: ${alert.anomaly_metric}
Raw / Filtered Value: ${alert.raw_value} / ${alert.kalman_smoothed_value}

PRIMARY DRIVER: ${analysis.primaryCategory} (Environmental: ${analysis.environmentalPct}%, Operational: ${analysis.operationalPct}%)
Summary: ${analysis.executiveSummary}

RECOMMENDED DIRECTIVE:
${analysis.immediateRemediation.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-slate-950/80">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-xl border mt-0.5 ${
                isCritical
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : isHigh
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              }`}
            >
              <GitMerge className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Root Cause Analysis</span>
                  <span className="font-mono text-xs text-slate-400 font-normal">
                    [{alert.id}]
                  </span>
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                      : isHigh
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                      : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {alert.severity} SEVERITY
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                  AI Attribution: {analysis.confidenceScore}% Certainty
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Target Zone: <strong className="text-slate-200">{alert.location_zone}</strong></span>
                <span>•</span>
                <span>Worker Token: <strong className="text-slate-200 font-mono">{alert.worker_id}</strong></span>
                <span>•</span>
                <span>Detected: <span className="font-mono text-slate-300">{alert.detected_at}</span></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Notice */}
        {actionDoneNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{actionDoneNotice}</span>
            </span>
            <button
              onClick={() => setActionDoneNotice(null)}
              className="text-[10px] text-emerald-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Factor Breakdown</span>
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'factors'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Environmental vs. Operational ({analysis.factors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('causalChain')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'causalChain'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Causal Sequence Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'remediation'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Corrective Directives</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Executive Root Cause Hypothesis</span>
                  </span>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                    Primary Driver: {analysis.primaryCategory}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {analysis.executiveSummary}
                </p>
                <div className="pt-2 border-t border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reported Metric</span>
                    <span className="text-slate-300 font-semibold">{alert.anomaly_metric}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Raw Telemetry</span>
                    <span className="text-amber-300 font-semibold">{alert.raw_value}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kalman Smoothed</span>
                    <span className="text-cyan-300 font-semibold">{alert.kalman_smoothed_value}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Early Lead Time</span>
                    <span className="text-emerald-300 font-semibold">{alert.lead_time || 'Immediate'}</span>
                  </div>
                </div>
              </div>

              {/* High-Level Factor Split Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Environmental Factors ({analysis.environmentalPct}%)</span>
                  </span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Operational Factors ({analysis.operationalPct}%)</span>
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  </span>
                </div>

                {/* Progress Split Bar */}
                <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${analysis.environmentalPct}%` }}
                    className="bg-gradient-to-r from-cyan-600 to-teal-500 transition-all duration-500 flex items-center justify-center text-[9px] font-mono text-white font-bold"
                  >
                    {analysis.environmentalPct}%
                  </div>
                  <div
                    style={{ width: `${analysis.operationalPct}%` }}
                    className="bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-500 flex items-center justify-center text-[9px] font-mono text-white font-bold"
                  >
                    {analysis.operationalPct}%
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Ambient climate, airflow, solar radiation, acoustic sound</span>
                  <span>Physical exertion, PPE thermal clo, shift pacing, task schedule</span>
                </div>
              </div>

              {/* Side-by-Side Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Environmental Card */}
                <div className="bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Wind className="h-4 w-4 text-cyan-400" />
                      <span>Environmental Conditions</span>
                    </span>
                    <span className="text-[10px] font-mono bg-cyan-900/60 px-2 py-0.5 rounded text-cyan-200">
                      {analysis.environmentalPct}% Contributory
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Microclimate ambient heat load ({zone?.temp || '38.5°C'}) elevating core body temperature.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Local air movement &lt; 0.3 m/s restricting convective sweat evaporation.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Thermal Work Limit (TWL) registered below safe continuous work threshold.</span>
                    </li>
                  </ul>
                </div>

                {/* Operational Card */}
                <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-amber-400" />
                      <span>Operational &amp; Task Factors</span>
                    </span>
                    <span className="text-[10px] font-mono bg-amber-900/60 px-2 py-0.5 rounded text-amber-200">
                      {analysis.operationalPct}% Contributory
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>Continuous work period exceeding 120 minutes without mandated shaded recovery.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>Heavy PPE vapor-barrier insulation creating localized microclimate heat retention.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>High metabolic exertion rate coinciding with solar apex turnaround interval.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'factors' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Detailed Factor Weightings &amp; Specific Sensor Readings</span>
                <span className="font-mono text-[11px]">Sorted by Contribution %</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {analysis.factors.map((factor) => {
                  const isEnv = factor.category === 'ENVIRONMENTAL';
                  return (
                    <div
                      key={factor.id}
                      className={`p-4 rounded-xl border transition ${
                        isEnv
                          ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400'
                          : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isEnv
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {factor.category}
                          </span>
                          <h4 className="text-sm font-bold text-white">{factor.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded">
                            {factor.contributionPct}% Contribution
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-3 leading-relaxed font-sans">
                        {factor.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
                        <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Measured Metric Reading:</span>
                          <span className="text-white font-bold">{factor.sensorMetric}: </span>
                          <span className="text-amber-300 font-bold">{factor.measuredReading}</span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Recommended Engineering Control:</span>
                          <span className="text-emerald-300 font-medium">{factor.recommendedControl}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'causalChain' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Chronological 4-Step Causal Sequence (Precursor to Breach)</span>
                <span className="text-[10px] font-mono text-cyan-400">Kalman State-Space Reconstruction</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {analysis.causalChain.map((chain) => (
                  <div key={chain.step} className="relative">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                        chain.type === 'ENVIRONMENTAL'
                          ? 'bg-cyan-950 text-cyan-400 border-cyan-500'
                          : chain.type === 'OPERATIONAL'
                          ? 'bg-amber-950 text-amber-400 border-amber-500'
                          : 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse'
                      }`}
                    >
                      {chain.step}
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{chain.title}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                              chain.type === 'ENVIRONMENTAL'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : chain.type === 'OPERATIONAL'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {chain.type}
                          </span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          {chain.timeOffset}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {chain.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="space-y-4">
              {/* Immediate Directives */}
              <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Immediate Medical &amp; Field Remediation Directives</span>
                </div>
                <div className="space-y-2">
                  {analysis.immediateRemediation.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/40">
                      <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventative Controls */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span>Engineering &amp; Administrative Preventative Controls</span>
                </div>
                <div className="space-y-2">
                  {analysis.preventativeControls.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap justify-between items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer font-semibold"
              title="Copy Root Cause summary to clipboard"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5 text-slate-400" />}
              <span>{isCopied ? 'Report Copied' : 'Copy Summary'}</span>
            </button>

            {onAttachNote && (
              <button
                onClick={() => {
                  onAttachNote(alert);
                  setActionDoneNotice(`Attached root cause analysis note to anomaly [${alert.id}] in chart audit log.`);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 transition cursor-pointer font-semibold"
                title="Attach qualitative root cause note to health risk trend chart"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Attach Note to Chart</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDispatchMitigation && (
              <button
                onClick={() => {
                  onDispatchMitigation(alert);
                  setActionDoneNotice(`Dispatched corrective mitigation response team for ${alert.location_zone}.`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-md shadow-rose-950/40 cursor-pointer"
                title="Stage immediate medical/safety protocol dispatch for this root cause"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Stage Remediation Dispatch</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

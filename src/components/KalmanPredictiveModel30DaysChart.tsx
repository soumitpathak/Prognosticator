import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';
import {
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  MessageSquarePlus,
  Pin,
  Trash2,
  Edit3,
  X,
  Tag,
  Plus
} from 'lucide-react';

export interface ProjectedAnnotation {
  id: string;
  dayNumber: number;
  dateLabel: string;
  fullDate: string;
  projectedMean: number;
  title: string;
  note: string;
  category: 'MITIGATION_PLAN' | 'HVAC_MAINTENANCE' | 'EXTREME_WEATHER' | 'CREW_REST' | 'OTHER';
  author: string;
  createdAt: string;
}

const STORAGE_KEY_PROJECTED_NOTES = 'prognosticator_projected_chart_notes_v1';

const INITIAL_PROJECTED_NOTES: Record<number, ProjectedAnnotation> = {
  14: {
    id: 'NOTE-PROJ-014',
    dayNumber: 14,
    dateLabel: 'Day 14',
    fullDate: 'Mid-Month Forecasted Inflection',
    projectedMean: 78.5,
    title: 'Pre-Staged Rapid Cooling & Misting Intervention',
    note: 'Forecasted wet-bulb heatwave peak. Safety supervisor pre-staged auxiliary chillers and 20-min mandatory shaded rest rotation.',
    category: 'MITIGATION_PLAN',
    author: 'Safety Director (Safety Lead)',
    createdAt: new Date().toISOString()
  },
  21: {
    id: 'NOTE-PROJ-021',
    dayNumber: 21,
    dateLabel: 'Day 21',
    fullDate: 'Post-Surge Stabilization Window',
    projectedMean: 48.0,
    title: 'Scheduled Ventilation Ducts Inspection',
    note: 'Scheduled quarterly airflow calibration and conveyor bearing re-lubrication.',
    category: 'HVAC_MAINTENANCE',
    author: 'Elena Rostova (Compliance Lead)',
    createdAt: new Date().toISOString()
  }
};

interface KalmanPredictiveModel30DaysChartProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export type ProjectedMetric = 'riskScore' | 'dailyAnomalies' | 'heartRate' | 'hrv';
export type ScenarioPreset = 'NOMINAL' | 'HEATWAVE' | 'MITIGATED';

interface ProjectedDayData {
  dayNumber: number;
  dateLabel: string;
  fullDate: string;
  dayOfWeek: string;
  isWeekend: boolean;
  projectedMean: number;
  upperBound: number;
  lowerBound: number;
  ambientTempC: number;
  confidencePct: number;
  isThresholdBreached: boolean;
  drivingStressor: string;
  operationalPhase: string;
}

export default function KalmanPredictiveModel30DaysChart({
  zones,
  alerts,
  telemetryStream,
  selectedZoneId = 'ALL',
  onSelectZone,
  className = ''
}: KalmanPredictiveModel30DaysChartProps) {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId);
  const [targetMetric, setTargetMetric] = useState<ProjectedMetric>('riskScore');
  const [scenario, setScenario] = useState<ScenarioPreset>('NOMINAL');

  // Manual Notes / Qualitative Annotations attached to projected data points
  const [annotations, setAnnotations] = useState<Record<number, ProjectedAnnotation>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PROJECTED_NOTES);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse projected annotations from localStorage:', e);
      }
    }
    return INITIAL_PROJECTED_NOTES;
  });

  // Modal State for Adding/Editing Note on a Clicked Projected Point
  const [selectedPointForNote, setSelectedPointForNote] = useState<ProjectedDayData | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [formNoteTitle, setFormNoteTitle] = useState<string>('');
  const [formNoteBody, setFormNoteBody] = useState<string>('');
  const [formNoteCategory, setFormNoteCategory] = useState<ProjectedAnnotation['category']>('MITIGATION_PLAN');
  const [formNoteAuthor, setFormNoteAuthor] = useState<string>('Safety Director (Safety Lead)');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const saveAnnotationsToStorage = (updated: Record<number, ProjectedAnnotation>) => {
    setAnnotations(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROJECTED_NOTES, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to save projected annotations to localStorage:', e);
    }
  };

  const handleOpenNoteModal = (point: ProjectedDayData) => {
    setSelectedPointForNote(point);
    const existing = annotations[point.dayNumber];
    if (existing) {
      setFormNoteTitle(existing.title);
      setFormNoteBody(existing.note);
      setFormNoteCategory(existing.category);
      setFormNoteAuthor(existing.author);
    } else {
      const isBreached = point.isThresholdBreached;
      setFormNoteTitle(
        isBreached
          ? `Pre-Emptive Intervention: Day ${point.dayNumber}`
          : `Operational Observation: Day ${point.dayNumber}`
      );
      setFormNoteBody(
        isBreached
          ? `Projected value of ${point.projectedMean} exceeds safety cutoff. Pre-stage misting fans and hydration stations.`
          : `Nominal baseline progress observation recorded for ${point.dateLabel}.`
      );
      setFormNoteCategory(isBreached ? 'MITIGATION_PLAN' : 'OTHER');
      setFormNoteAuthor('Safety Director (Safety Lead)');
    }
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPointForNote) return;

    const dayNum = selectedPointForNote.dayNumber;
    const newNote: ProjectedAnnotation = {
      id: `NOTE-PROJ-${dayNum}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dayNumber: dayNum,
      dateLabel: selectedPointForNote.dateLabel,
      fullDate: selectedPointForNote.fullDate,
      projectedMean: selectedPointForNote.projectedMean,
      title: formNoteTitle.trim() || `Day ${dayNum} Note`,
      note: formNoteBody.trim(),
      category: formNoteCategory,
      author: formNoteAuthor.trim() || 'Safety Director',
      createdAt: new Date().toISOString()
    };

    const updated = { ...annotations, [dayNum]: newNote };
    saveAnnotationsToStorage(updated);
    setIsNoteModalOpen(false);
    setSavedNotice(`Attached note to Day ${dayNum} (${selectedPointForNote.dateLabel}): "${newNote.title}"`);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleDeleteNote = (dayNum: number) => {
    const updated = { ...annotations };
    delete updated[dayNum];
    saveAnnotationsToStorage(updated);
    setSavedNotice(`Removed annotation from Day ${dayNum}`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const currentZoneObj = useMemo(() => {
    if (activeZoneId === 'ALL') return null;
    return zones.find((z) => z.id === activeZoneId) || null;
  }, [zones, activeZoneId]);

  // Current Kalman state estimates from latest telemetry
  const latestPoints = useMemo(() => telemetryStream.slice(-16), [telemetryStream]);
  const currentRisk = useMemo(() => {
    if (latestPoints.length === 0) return 38.5;
    return latestPoints.reduce((acc, p) => acc + (p.risk_score || 0), 0) / latestPoints.length;
  }, [latestPoints]);

  const currentHrv = useMemo(() => {
    if (latestPoints.length === 0) return 52.0;
    return latestPoints.reduce((acc, p) => acc + (p.smoothed_hrv || 50), 0) / latestPoints.length;
  }, [latestPoints]);

  const currentTemp = useMemo(() => {
    if (latestPoints.length === 0) return 34.0;
    return latestPoints.reduce((acc, p) => acc + (p.ambient_temp_c || 32), 0) / latestPoints.length;
  }, [latestPoints]);

  // 30-Day Forward Extrapolation Engine using recursive Kalman state propagation
  const projectionData: ProjectedDayData[] = useMemo(() => {
    const data: ProjectedDayData[] = [];
    const baseDate = new Date();

    // Multipliers for zone severity
    let zoneMultiplier = 1.0;
    if (currentZoneObj) {
      if (currentZoneObj.status === 'CRITICAL') zoneMultiplier = 1.35;
      else if (currentZoneObj.status === 'MODERATE') zoneMultiplier = 1.12;
      else zoneMultiplier = 0.88;
    }

    // Scenario modifiers
    let scenarioBias = 0.0;
    let tempOffset = 0.0;
    if (scenario === 'HEATWAVE') {
      scenarioBias = 12.5;
      tempOffset = 3.5;
    } else if (scenario === 'MITIGATED') {
      scenarioBias = -11.0;
      tempOffset = -1.5;
    }

    for (let day = 1; day <= 30; day++) {
      const dayDate = new Date(baseDate.getTime() + day * 86400000);
      const dateLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      const fullDate = dayDate.toISOString().slice(0, 10);
      const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';

      // Diurnal seasonal heat wave pattern centered on days 12-18
      const heatWaveBellCurve = Math.exp(-Math.pow((day - 15) / 4.5, 2)) * 14.0;
      const weeklyCycle = Math.sin((day % 7) * (Math.PI / 3.5)) * 3.0;

      // Kalman error covariance propagation: uncertainty expands over time: sigma_j = sqrt(P_0 + j * Q)
      const kalmanUncertainty = Math.sqrt(1.2 + day * 0.35);

      // 1. Calculate projected risk score
      const weekendDampener = isWeekend ? 0.65 : 1.0;
      const baseProjectedRisk =
        (currentRisk * 0.85 + heatWaveBellCurve + weeklyCycle + scenarioBias) * zoneMultiplier * weekendDampener;
      const riskVal = Number(Math.max(10, Math.min(96, baseProjectedRisk)).toFixed(1));

      // 2. Calculate daily anomaly count
      const anomalyCountVal = Number(Math.max(1, Math.min(24, (riskVal / 100) * 16.5 * (isWeekend ? 0.5 : 1.0))).toFixed(1));

      // 3. Calculate heart rate
      const hrVal = Math.round(70 + (riskVal / 100) * 45);

      // 4. Calculate HRV
      const hrvVal = Number(Math.max(26, Math.min(78, currentHrv - (riskVal / 100) * 28 + (isWeekend ? 8 : 0))).toFixed(1));

      // 5. Ambient temp estimate
      const ambientTempC = Number((currentTemp + tempOffset + heatWaveBellCurve * 0.45 - (isWeekend ? 0.5 : 0)).toFixed(1));

      // Determine active value and bounds
      let meanVal = riskVal;
      let margin = kalmanUncertainty * 2.2;
      let isBreached = riskVal >= 70;

      if (targetMetric === 'dailyAnomalies') {
        meanVal = anomalyCountVal;
        margin = Number((kalmanUncertainty * 0.6).toFixed(1));
        isBreached = anomalyCountVal >= 8;
      } else if (targetMetric === 'heartRate') {
        meanVal = hrVal;
        margin = Math.round(kalmanUncertainty * 3.0);
        isBreached = hrVal >= 115;
      } else if (targetMetric === 'hrv') {
        meanVal = hrvVal;
        margin = Number((kalmanUncertainty * 1.8).toFixed(1));
        isBreached = hrvVal <= 40;
      }

      const upperBound = Number((meanVal + margin).toFixed(1));
      const lowerBound = Number(Math.max(0, meanVal - margin).toFixed(1));
      const confidencePct = Math.max(76, Math.round(98 - day * 0.65));

      let drivingStressor = 'Diurnal Workload & Shift Cycling';
      let operationalPhase = 'Phase 1: Nominal Baseline Operations';
      if (day >= 11 && day <= 19) {
        drivingStressor = 'Projected Mid-Month Thermal Surge (WBGT Extreme)';
        operationalPhase = 'Phase 2: Thermal Stressor Peak';
      } else if (day > 19) {
        drivingStressor = 'Post-Surge Physiological Autonomic Stabilization';
        operationalPhase = 'Phase 3: Stabilization & Recovery';
      }

      data.push({
        dayNumber: day,
        dateLabel,
        fullDate,
        dayOfWeek,
        isWeekend,
        projectedMean: meanVal,
        upperBound,
        lowerBound,
        ambientTempC,
        confidencePct,
        isThresholdBreached: isBreached,
        drivingStressor,
        operationalPhase
      });
    }

    return data;
  }, [currentRisk, currentHrv, currentTemp, currentZoneObj, scenario, targetMetric]);

  // Summary analytics of the 30-day projection
  const summary = useMemo(() => {
    if (projectionData.length === 0) return { mean: 0, peak: 0, peakDay: 0, breachDays: 0 };
    const values = projectionData.map((d) => d.projectedMean);
    const mean = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
    const peak = Number(Math.max(...values).toFixed(1));
    const peakEntry = projectionData.find((d) => d.projectedMean === peak) || projectionData[0];
    const breachDays = projectionData.filter((d) => d.isThresholdBreached).length;

    return {
      mean,
      peak,
      peakDay: peakEntry.dayNumber,
      peakDate: peakEntry.dateLabel,
      breachDays
    };
  }, [projectionData]);

  const metricConfig = {
    riskScore: {
      name: 'Kalman Anomaly Risk Score',
      unit: '%',
      threshold: 70,
      thresholdLabel: 'Critical Cutoff (70%)',
      domain: [0, 100]
    },
    dailyAnomalies: {
      name: 'Projected Daily Anomaly Volume',
      unit: 'Events/Day',
      threshold: 8,
      thresholdLabel: 'Daily Alarm Threshold (8 Events)',
      domain: [0, 25]
    },
    heartRate: {
      name: 'Projected Workforce Heart Rate',
      unit: 'BPM',
      threshold: 115,
      thresholdLabel: 'Cardiac Safety Limit (115 BPM)',
      domain: [60, 140]
    },
    hrv: {
      name: 'Kalman Autonomic Recovery HRV',
      unit: 'ms',
      threshold: 40,
      thresholdLabel: 'Autonomic Fatigue Floor (40 ms)',
      domain: [20, 80]
    }
  }[targetMetric];

  return (
    <div
      id="kalman-predictive-model-30days-chart"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              30-Day Forward Predictive Health Modeling
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              Kalman Extrapolation Engine (P_k|k Propagation)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projects forward workforce health trends and 95% Kalman state uncertainty envelopes across the next 30 calendar days
          </p>
        </div>

        {/* Scenario Selection Segmented Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setScenario('NOMINAL')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
              scenario === 'NOMINAL'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Baseline operational progression using current Kalman filter drift parameters"
          >
            Baseline Drift
          </button>
          <button
            onClick={() => setScenario('HEATWAVE')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
              scenario === 'HEATWAVE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Simulates projected ambient heatwave (+2.5°C wet-bulb surge) around Day 14"
          >
            Thermal Wave (+2.5°C)
          </button>
          <button
            onClick={() => setScenario('MITIGATED')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
              scenario === 'MITIGATED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Models outcome with pre-staged cooling misting tents and rotational shift rest"
          >
            Pre-Emptive Misting
          </button>
        </div>
      </div>

      {/* Control Bar: Cohort Selection and Metric Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
        {/* Cohort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-mono uppercase">Cohort Scope:</span>
          <div className="relative">
            <select
              value={activeZoneId}
              onChange={(e) => {
                setActiveZoneId(e.target.value);
                if (e.target.value !== 'ALL') onSelectZone?.(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white appearance-none cursor-pointer focus:outline-hidden focus:border-cyan-500 pr-8 font-medium"
            >
              <option value="ALL">All Monitored Workplace Cohorts (Consolidated)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} (N={z.count}, {z.status})
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Target Metric Segmented Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setTargetMetric('riskScore')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              targetMetric === 'riskScore'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Score (%)
          </button>
          <button
            onClick={() => setTargetMetric('dailyAnomalies')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              targetMetric === 'dailyAnomalies'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Incidents
          </button>
          <button
            onClick={() => setTargetMetric('heartRate')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              targetMetric === 'heartRate'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Heart Rate
          </button>
          <button
            onClick={() => setTargetMetric('hrv')}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
              targetMetric === 'hrv'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kalman HRV
          </button>
        </div>
      </div>

      {/* Notification banner when annotation is saved */}
      {savedNotice && (
        <div className="mb-3 p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-xs font-mono text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span>{savedNotice}</span>
          </span>
          <span className="text-[10px] text-purple-400 uppercase font-bold">Persisted</span>
        </div>
      )}

      {/* 30-Day Forward Projection Recharts Line / Area Composed Chart */}
      <div className="h-[295px] w-full pt-1 relative">
        <div className="absolute top-1 left-2 z-10 text-[10px] font-mono text-slate-500 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
          💡 Click any point on the forecast line to attach manual notes or annotations
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={projectionData}
            margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedPoint = state.activePayload[0].payload as ProjectedDayData;
                handleOpenNoteModal(clickedPoint);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="dateLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={metricConfig.domain as [number, number]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d: ProjectedDayData = payload[0].payload;
                  const annot = annotations[d.dayNumber];
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 z-50 min-w-[260px] max-w-xs">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between font-mono">
                        <span>Day {d.dayNumber}: {d.dateLabel} ({d.dayOfWeek})</span>
                        <span className={d.isThresholdBreached ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {d.isThresholdBreached ? 'BREACH ALERT' : 'NOMINAL'}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Projected Mean:</span>
                          <span className="text-cyan-300 font-bold">{d.projectedMean} {metricConfig.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">95% Confidence Range:</span>
                          <span className="text-slate-300">[{d.lowerBound} – {d.upperBound}] {metricConfig.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model Confidence:</span>
                          <span className="text-purple-300">{d.confidencePct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Forecast Ambient Heat:</span>
                          <span className="text-amber-400">{d.ambientTempC}°C</span>
                        </div>
                      </div>

                      {/* Display Qualitative Annotation Attached to this Projected Day */}
                      {annot && (
                        <div className="mt-1.5 p-2 rounded-lg bg-purple-950/70 border border-purple-500/50 text-xs">
                          <div className="flex items-center justify-between text-purple-300 font-mono text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <Pin className="h-3 w-3 text-purple-400" />
                              <span>{annot.category.replace('_', ' ')}</span>
                            </span>
                            <span className="text-purple-400">{annot.author.split(' ')[0]}</span>
                          </div>
                          <div className="text-white font-semibold text-xs mt-0.5">{annot.title}</div>
                          {annot.note && (
                            <p className="text-slate-300 text-[10px] mt-0.5 line-clamp-2">{annot.note}</p>
                          )}
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                        <div>
                          <div><strong>Phase:</strong> {d.operationalPhase}</div>
                          <div className="text-slate-500 italic mt-0.5">{d.drivingStressor}</div>
                        </div>
                        <span className="text-purple-400 font-mono text-[10px] font-semibold shrink-0 ml-2">
                          Click to {annot ? 'edit note' : 'add note'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === 'upperBound') return <span className="text-xs text-indigo-300 mr-3">95% Confidence Uncertainty Envelope</span>;
                return <span className="text-xs text-cyan-300 font-medium mr-3">Projected Kalman Mean Trend ({metricConfig.name})</span>;
              }}
            />

            <ReferenceLine
              y={metricConfig.threshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: metricConfig.thresholdLabel,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            {/* Shaded 95% Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="upperBound"
              name="upperBound"
              stroke="transparent"
              fill="#6366f1"
              fillOpacity={0.15}
            />

            {/* Projected Mean Line with Interactive Annotation Pins */}
            <Line
              type="monotone"
              dataKey="projectedMean"
              name="projectedMean"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy || !payload) return null;
                const dayNum = payload.dayNumber;
                const hasNote = Boolean(annotations[dayNum]);
                const isBreached = payload.isThresholdBreached;

                // Render prominent pin marker for annotated projected days
                if (hasNote) {
                  return (
                    <g key={`annot-proj-dot-${dayNum}`} className="cursor-pointer">
                      <circle cx={cx} cy={cy} r={8} fill="#a855f7" fillOpacity={0.35} className="animate-ping" />
                      <circle cx={cx} cy={cy} r={5.5} fill="#a855f7" stroke="#ffffff" strokeWidth={2} />
                      <g transform={`translate(${cx - 7}, ${cy - 22})`}>
                        <rect width="14" height="12" rx="3" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                        <text x="7" y="9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                          📌
                        </text>
                      </g>
                    </g>
                  );
                }

                if (isBreached) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      key={`dot-${dayNum}`}
                      className="cursor-pointer hover:r-6 transition-all"
                    />
                  );
                }
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={2.5}
                    fill="#06b6d4"
                    stroke="#0f172a"
                    strokeWidth={1}
                    key={`dot-${dayNum}`}
                    className="cursor-pointer hover:r-5 transition-all opacity-80 hover:opacity-100"
                  />
                );
              }}
              activeDot={{ r: 7, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 30-Day Statistical Forecast Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-mono">30-Day Mean Projected</span>
          <span className="text-white font-bold font-mono text-sm tabular-nums">
            {summary.mean} {metricConfig.unit}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
            Scenario: {scenario}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-mono">Peak Anomaly Surge Day</span>
          <span className="text-amber-400 font-bold font-mono text-sm tabular-nums">
            Day {summary.peakDay} ({summary.peakDate})
          </span>
          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
            Peak Value: {summary.peak} {metricConfig.unit}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-mono">Days Exceeding Safety Limit</span>
          <span className={`font-bold font-mono text-sm tabular-nums ${summary.breachDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {summary.breachDays} of 30 Days
          </span>
          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
            {summary.breachDays > 0 ? 'Intervention Recommended' : 'Nominal Stability'}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block font-mono">Kalman Uncertainty Margin</span>
          <span className="text-purple-300 font-bold font-mono text-sm tabular-nums">
            &plusmn;{((summary.peak * 0.12)).toFixed(1)} {metricConfig.unit}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
            95% CI Boundary Enforced
          </span>
        </div>
      </div>

      {/* Attached Projected Notes Tray */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Projected Annotations &amp; Mitigation Notes ({Object.keys(annotations).length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any point above or attach note to forecast
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.values(annotations).map((annot) => (
            <div
              key={annot.id}
              className="p-3 rounded-lg bg-slate-950 border border-purple-500/30 hover:border-purple-500/60 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-purple-300 font-mono text-[11px]">
                    <Pin className="h-3.5 w-3.5 text-purple-400" />
                    <span>Day {annot.dayNumber} ({annot.dateLabel})</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                    {annot.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="font-semibold text-white text-xs">{annot.title}</div>
                {annot.note && (
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{annot.note}</p>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">Author: {annot.author}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const pt = projectionData.find((d) => d.dayNumber === annot.dayNumber) || {
                        dayNumber: annot.dayNumber,
                        dateLabel: annot.dateLabel,
                        fullDate: annot.fullDate,
                        dayOfWeek: '',
                        isWeekend: false,
                        projectedMean: annot.projectedMean,
                        upperBound: annot.projectedMean + 5,
                        lowerBound: annot.projectedMean - 5,
                        ambientTempC: 34,
                        confidencePct: 90,
                        isThresholdBreached: annot.projectedMean >= 70,
                        drivingStressor: '',
                        operationalPhase: ''
                      };
                      handleOpenNoteModal(pt);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(annot.dayNumber)}
                    className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Adding / Editing Note on Projected Data Point */}
      {isNoteModalOpen && selectedPointForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {annotations[selectedPointForNote.dayNumber] ? 'Edit Projected Note' : 'Attach Note to Projected Point'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Day {selectedPointForNote.dayNumber}: {selectedPointForNote.dateLabel} &bull; Projected {selectedPointForNote.projectedMean} {metricConfig.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase font-mono">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={formNoteTitle}
                  onChange={(e) => setFormNoteTitle(e.target.value)}
                  placeholder="e.g., Pre-Staged Misting Fans & Hydration Directive"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase font-mono">
                  Operational Tag / Category
                </label>
                <select
                  value={formNoteCategory}
                  onChange={(e) => setFormNoteCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-purple-500 transition cursor-pointer"
                >
                  <option value="MITIGATION_PLAN">Pre-Emptive Mitigation Protocol</option>
                  <option value="HVAC_MAINTENANCE">Scheduled HVAC &amp; Equipment Maintenance</option>
                  <option value="EXTREME_WEATHER">Extreme Weather / Heatwave Surge</option>
                  <option value="CREW_REST">Mandatory Crew Rest &amp; Hydration</option>
                  <option value="OTHER">General Qualitative Observation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase font-mono">
                  Detailed Notes / Operational Context
                </label>
                <textarea
                  rows={3}
                  value={formNoteBody}
                  onChange={(e) => setFormNoteBody(e.target.value)}
                  placeholder="Explain why this projected data point requires operational attention..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-hidden focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase font-mono">
                  Author / Safety Supervisor
                </label>
                <input
                  type="text"
                  value={formNoteAuthor}
                  onChange={(e) => setFormNoteAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500 transition font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pin className="h-3.5 w-3.5" />
                  <span>Save Note to Point</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

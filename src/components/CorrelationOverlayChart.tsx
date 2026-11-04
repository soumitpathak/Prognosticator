import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { TelemetryDataPoint, HealthSignalNotificationThresholds } from '../types';
import {
  Activity,
  Heart,
  Thermometer,
  Sun,
  Volume2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Compass,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';

export interface CorrelationSignalDef {
  id: string;
  name: string;
  shortName: string;
  category: 'ENVIRONMENTAL' | 'WORKER_HEALTH';
  unit: string;
  color: string;
  dataKey: string;
  getValue: (p: TelemetryDataPoint) => number;
  getThreshold: (thresholds?: HealthSignalNotificationThresholds) => number | undefined;
  thresholdType: 'UPPER_LIMIT' | 'LOWER_LIMIT';
  description: string;
}

export const CORRELATION_SIGNALS: Record<string, CorrelationSignalDef> = {
  ambientTemp: {
    id: 'ambientTemp',
    name: 'Ambient Temperature (Heat Index)',
    shortName: 'Ambient Heat',
    category: 'ENVIRONMENTAL',
    unit: '°C',
    color: '#f59e0b', // amber
    dataKey: 'ambient_temp_c',
    getValue: (p) => p.ambient_temp_c ?? 32.0,
    getThreshold: (t) => t?.maxAmbientHeatC ?? 36.0,
    thresholdType: 'UPPER_LIMIT',
    description: 'Hyper-local microclimate apparent heat index measured by on-site IoT environmental sensors.'
  },
  noiseDb: {
    id: 'noiseDb',
    name: 'Acoustic Noise Overpressure',
    shortName: 'Acoustic Noise',
    category: 'ENVIRONMENTAL',
    unit: 'dBA',
    color: '#f97316', // orange
    dataKey: 'noise_db',
    getValue: (p) => p.noise_db ?? p.raw_noise_db ?? 75.0,
    getThreshold: (t) => t?.maxNoiseDb ?? 85.0,
    thresholdType: 'UPPER_LIMIT',
    description: 'Industrial ambient acoustic pressure exposure with dosimeter dB weighting.'
  },
  twl: {
    id: 'twl',
    name: 'Thermal Work Limit (TWL Index)',
    shortName: 'TWL Index',
    category: 'ENVIRONMENTAL',
    unit: 'W/m²',
    color: '#10b981', // emerald
    dataKey: 'twl_index',
    getValue: (p) => p.twl_index ?? 140,
    getThreshold: (t) => t?.minTwlIndex ?? 140,
    thresholdType: 'LOWER_LIMIT',
    description: 'Safe continuous metabolic work rate in watts per square meter of body surface.'
  },
  aqi: {
    id: 'aqi',
    name: 'Air Quality & Particulate Index',
    shortName: 'Air Quality (AQI)',
    category: 'ENVIRONMENTAL',
    unit: 'AQI',
    color: '#6366f1', // indigo
    dataKey: 'aqi',
    getValue: (p) => p.aqi ?? 65,
    getThreshold: () => 100,
    thresholdType: 'UPPER_LIMIT',
    description: 'Composite particulate PM2.5 and atmospheric volatile organic compound index.'
  },
  heartRate: {
    id: 'heartRate',
    name: 'Worker Heart Rate (Cardiovascular Pulse)',
    shortName: 'Heart Rate',
    category: 'WORKER_HEALTH',
    unit: 'BPM',
    color: '#f43f5e', // rose
    dataKey: 'heart_rate_bpm',
    getValue: (p) => p.heart_rate_bpm ?? Math.round(72 + (68 - p.smoothed_hrv) * 1.2),
    getThreshold: (t) => t?.maxHeartRateBpm ?? 115,
    thresholdType: 'UPPER_LIMIT',
    description: 'Wearable biometric photoplethysmography (PPG) pulse rate reflecting cardiac strain.'
  },
  smoothedHrv: {
    id: 'smoothedHrv',
    name: 'Kalman-Smoothed Worker HRV (RMSSD)',
    shortName: 'Kalman HRV',
    category: 'WORKER_HEALTH',
    unit: 'ms',
    color: '#06b6d4', // cyan
    dataKey: 'smoothed_hrv',
    getValue: (p) => p.smoothed_hrv ?? 68.0,
    getThreshold: (t) => t?.minHrvMs ?? 40.0,
    thresholdType: 'LOWER_LIMIT',
    description: 'Parasympathetic vagal tone proxy filtered through Prognosticator Kalman state engine.'
  },
  rawHrv: {
    id: 'rawHrv',
    name: 'Raw Wearable HRV (Sensor Jitter)',
    shortName: 'Raw Wearable HRV',
    category: 'WORKER_HEALTH',
    unit: 'ms',
    color: '#fbbf24', // amber-yellow
    dataKey: 'raw_hrv',
    getValue: (p) => p.raw_hrv ?? 68.0,
    getThreshold: (t) => t?.minHrvMs ?? 40.0,
    thresholdType: 'LOWER_LIMIT',
    description: 'Unfiltered instantaneous wearable RMSSD capture including physical motion artifacts.'
  },
  skinTemp: {
    id: 'skinTemp',
    name: 'Worker Skin / Surface Core Temperature',
    shortName: 'Skin Temp',
    category: 'WORKER_HEALTH',
    unit: '°C',
    color: '#ec4899', // pink
    dataKey: 'skin_temp_c',
    getValue: (p) => p.skin_temp_c ?? 36.6,
    getThreshold: (t) => t?.maxSkinTempC ?? 37.8,
    thresholdType: 'UPPER_LIMIT',
    description: 'Sub-dermal thermal flux sensor tracking core metabolic accumulation and heat storage.'
  },
  riskScore: {
    id: 'riskScore',
    name: 'Prognosticator Composite Health Risk',
    shortName: 'Anomaly Risk %',
    category: 'WORKER_HEALTH',
    unit: '%',
    color: '#a855f7', // purple
    dataKey: 'risk_score',
    getValue: (p) => p.risk_score ?? 15.0,
    getThreshold: (t) => t?.riskScoreCutoffPct ?? 65.0,
    thresholdType: 'UPPER_LIMIT',
    description: 'LSTM neural network multidimensional autoencoder anomaly risk probability.'
  }
};

export interface CorrelationPreset {
  id: string;
  name: string;
  description: string;
  signalA: string;
  signalB: string;
  clinicalSignificance: string;
}

export const CORRELATION_PRESETS: CorrelationPreset[] = [
  {
    id: 'heat_pulse',
    name: '🌡️ Ambient Heat vs. 💓 Heart Rate',
    description: 'Cardiovascular heat compensation workload',
    signalA: 'ambientTemp',
    signalB: 'heartRate',
    clinicalSignificance:
      'Evaluates circulatory strain: as environmental heat load rises, peripheral vasodilation drives stroke volume and tachycardia.'
  },
  {
    id: 'heat_hrv',
    name: '🌡️ Ambient Heat vs. 📉 Worker HRV',
    description: 'Autonomic nervous exhaustion & heat strain',
    signalA: 'ambientTemp',
    signalB: 'smoothedHrv',
    clinicalSignificance:
      'Classic inverse correlation: high thermal index causes autonomic collapse and sympathetic overload, lowering HRV below 35ms.'
  },
  {
    id: 'noise_hrv',
    name: '🔊 Acoustic Noise vs. 📉 Worker HRV',
    description: 'Auditory stress-induced sympathetic spike',
    signalA: 'noiseDb',
    signalB: 'smoothedHrv',
    clinicalSignificance:
      'Acoustic overpressure (>85 dBA) stimulates adrenal cortisol release and vagal withdrawal, precipitating rapid autonomic fatigue.'
  },
  {
    id: 'heat_skin',
    name: '🌡️ Ambient Heat vs. 🌡️ Skin Temperature',
    description: 'Thermal storage & microclimate coupling',
    signalA: 'ambientTemp',
    signalB: 'skinTemp',
    clinicalSignificance:
      'Monitors core heat accumulation when wet-bulb evaporation fails, tracking skin surface thermal convergence with ambient temperature.'
  },
  {
    id: 'pulse_skin',
    name: '💓 Heart Rate vs. 🌡️ Skin Temperature',
    description: 'Metabolic workload vs. thermoregulation',
    signalA: 'skinTemp',
    signalB: 'heartRate',
    clinicalSignificance:
      'Direct coupling between core temperature elevation and cardiac output required to maintain tissue perfusion.'
  },
  {
    id: 'twl_pulse',
    name: '💨 TWL Index vs. 💓 Heart Rate',
    description: 'Work-rest limits vs. cardiovascular reserve',
    signalA: 'twl',
    signalB: 'heartRate',
    clinicalSignificance:
      'As safe Thermal Work Limit (TWL) collapses below 140 W/m², cardiac demand spikes to compensate for metabolic heat dissipation.'
  },
  {
    id: 'hrv_risk',
    name: '📉 Worker HRV vs. ⚠️ Risk Probability',
    description: 'Autonomic biomarkers vs. LSTM anomaly score',
    signalA: 'smoothedHrv',
    signalB: 'riskScore',
    clinicalSignificance:
      'Validates LSTM reconstruction error: parasympathetic suppression correlates directly with multidimensional anomaly risk tiers.'
  }
];

interface CorrelationOverlayChartProps {
  data: TelemetryDataPoint[];
  zoneName: string;
  thresholds?: HealthSignalNotificationThresholds;
  activeThresholdCutoff?: number;
  initialSignalA?: string;
  initialSignalB?: string;
  onOpenThresholdsModal?: () => void;
}

export default function CorrelationOverlayChart({
  data,
  zoneName,
  thresholds,
  activeThresholdCutoff = 65,
  initialSignalA = 'ambientTemp',
  initialSignalB = 'heartRate',
  onOpenThresholdsModal
}: CorrelationOverlayChartProps) {
  const [signalAKey, setSignalAKey] = useState<string>(initialSignalA);
  const [signalBKey, setSignalBKey] = useState<string>(initialSignalB);
  const [selectedHours, setSelectedHours] = useState<number>(24);
  const [subView, setSubView] = useState<'DUAL_AXIS' | 'SCATTER_PLOT'>('DUAL_AXIS');
  const [showThresholdLines, setShowThresholdLines] = useState<boolean>(true);

  const signalADef = CORRELATION_SIGNALS[signalAKey] || CORRELATION_SIGNALS.ambientTemp;
  const signalBDef = CORRELATION_SIGNALS[signalBKey] || CORRELATION_SIGNALS.heartRate;

  // Filter dataset to selected horizon (e.g. 24h = 96 points @ 15 min steps)
  const slicedData = useMemo(() => {
    const pointsCount = Math.min(data.length, selectedHours * 4);
    return data.slice(-pointsCount);
  }, [data, selectedHours]);

  // Compute Dual Signal Values, Pearson r, Covariance, Dynamic Min/Max Domains
  const {
    chartData,
    pearsonR,
    rSquared,
    strengthLabel,
    relationshipType,
    narrativeInsight,
    leadLagInsight,
    statA,
    statB,
    scatterPoints
  } = useMemo(() => {
    if (!slicedData.length) {
      return {
        chartData: [],
        pearsonR: 0,
        rSquared: 0,
        strengthLabel: 'INSUFFICIENT DATA',
        relationshipType: 'NONE',
        narrativeInsight: 'Telemetry stream initializing...',
        leadLagInsight: 'Lead/lag cross-correlation requires at least 8 interval samples.',
        statA: { mean: 0, min: 0, max: 0, peak: 0, breaches: 0 },
        statB: { mean: 0, min: 0, max: 0, peak: 0, breaches: 0 },
        scatterPoints: []
      };
    }

    const threshA = signalADef.getThreshold(thresholds);
    const threshB = signalBDef.getThreshold(thresholds);

    let sumA = 0;
    let sumB = 0;
    let minA = Infinity;
    let maxA = -Infinity;
    let minB = Infinity;
    let maxB = -Infinity;
    let breachesA = 0;
    let breachesB = 0;

    const valuesA: number[] = [];
    const valuesB: number[] = [];

    const prepared = slicedData.map((pt, idx) => {
      const valA = signalADef.getValue(pt);
      const valB = signalBDef.getValue(pt);

      valuesA.push(valA);
      valuesB.push(valB);

      sumA += valA;
      sumB += valB;
      if (valA < minA) minA = valA;
      if (valA > maxA) maxA = valA;
      if (valB < minB) minB = valB;
      if (valB > maxB) maxB = valB;

      const isBreachedA =
        threshA !== undefined &&
        (signalADef.thresholdType === 'UPPER_LIMIT' ? valA >= threshA : valA <= threshA);
      const isBreachedB =
        threshB !== undefined &&
        (signalBDef.thresholdType === 'UPPER_LIMIT' ? valB >= threshB : valB <= threshB);

      if (isBreachedA) breachesA++;
      if (isBreachedB) breachesB++;

      const dateObj = new Date(pt.timestamp);
      const formattedClock = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return {
        ...pt,
        idx,
        timeLabel: pt.timeLabel,
        formattedClock,
        valA,
        valB,
        isBreachedA,
        isBreachedB,
        hasBothBreached: isBreachedA && isBreachedB
      };
    });

    const n = prepared.length;
    const meanA = sumA / (n || 1);
    const meanB = sumB / (n || 1);

    // Compute Pearson r correlation
    let num = 0;
    let denA = 0;
    let denB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = valuesA[i] - meanA;
      const diffB = valuesB[i] - meanB;
      num += diffA * diffB;
      denA += diffA * diffA;
      denB += diffB * diffB;
    }

    const den = Math.sqrt(denA * denB);
    const r = den > 0 ? Number((num / den).toFixed(3)) : 0;
    const rSq = Number((r * r).toFixed(3));

    // Lead-Lag Cross Correlation Calculation (shifts of -2, -1, 0, +1, +2 intervals = -30m to +30m)
    let bestLag = 0;
    let bestAbsR = Math.abs(r);

    for (let lag = -2; lag <= 2; lag++) {
      if (lag === 0) continue;
      let lagNum = 0;
      let lagDenA = 0;
      let lagDenB = 0;
      let count = 0;

      for (let i = 0; i < n; i++) {
        const j = i + lag;
        if (j >= 0 && j < n) {
          const diffA = valuesA[i] - meanA;
          const diffB = valuesB[j] - meanB;
          lagNum += diffA * diffB;
          lagDenA += diffA * diffA;
          lagDenB += diffB * diffB;
          count++;
        }
      }

      if (count > 5) {
        const lagDen = Math.sqrt(lagDenA * lagDenB);
        const lagR = lagDen > 0 ? Math.abs(lagNum / lagDen) : 0;
        if (lagR > bestAbsR + 0.05) {
          bestAbsR = lagR;
          bestLag = lag;
        }
      }
    }

    // Interpret Strength
    const absR = Math.abs(r);
    let strLabel = 'WEAK / UNCORRELATED';
    if (absR >= 0.8) strLabel = 'VERY STRONG CORRELATION';
    else if (absR >= 0.6) strLabel = 'STRONG CORRELATION';
    else if (absR >= 0.4) strLabel = 'MODERATE CORRELATION';

    let relType: 'POSITIVE' | 'NEGATIVE' | 'NONE' = 'NONE';
    if (r > 0.15) relType = 'POSITIVE';
    else if (r < -0.15) relType = 'NEGATIVE';

    // Clinical Narrative Synthesis
    let narrative = '';
    if (relType === 'POSITIVE') {
      narrative = `Positive linear correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}): As ${signalADef.shortName} increases, ${signalBDef.shortName} concurrently elevates across the ${zoneName} cohort (${(rSq * 100).toFixed(0)}% of variance explained).`;
    } else if (relType === 'NEGATIVE') {
      narrative = `Inverted correlation (r = ${r.toFixed(2)}): Rising ${signalADef.shortName} drives a sharp reduction in ${signalBDef.shortName}, indicating physiological fatigue and autonomic depletion (${(rSq * 100).toFixed(0)}% of variance explained).`;
    } else {
      narrative = `Signals operate largely independently (r = ${r.toFixed(2)}): ${signalADef.shortName} fluctuations currently demonstrate minimal direct impact on ${signalBDef.shortName}.`;
    }

    // Lead/Lag Insight Text
    let lagText = '';
    if (bestLag > 0) {
      lagText = `${signalADef.shortName} shifts lead ${signalBDef.shortName} physiological response by ~${bestLag * 15} minutes (r improves to ${bestAbsR.toFixed(2)} with lag).`;
    } else if (bestLag < 0) {
      lagText = `${signalBDef.shortName} precedes environmental shift by ~${Math.abs(bestLag) * 15} minutes, suggesting anticipatory workload or microclimate thermal inertia.`;
    } else {
      lagText = `Coupling is synchronous: immediate real-time response observed within the 15-minute sampling window.`;
    }

    // 2D Scatter Points for Scatter View
    const scatter = prepared.map((p) => ({
      x: p.valA,
      y: p.valB,
      timeLabel: p.timeLabel,
      formattedClock: p.formattedClock,
      isBreachedA: p.isBreachedA,
      isBreachedB: p.isBreachedB
    }));

    return {
      chartData: prepared,
      pearsonR: r,
      rSquared: rSq,
      strengthLabel: strLabel,
      relationshipType: relType,
      narrativeInsight: narrative,
      leadLagInsight: lagText,
      statA: {
        mean: Number(meanA.toFixed(1)),
        min: Number(minA.toFixed(1)),
        max: Number(maxA.toFixed(1)),
        peak: Number(maxA.toFixed(1)),
        breaches: breachesA
      },
      statB: {
        mean: Number(meanB.toFixed(1)),
        min: Number(minB.toFixed(1)),
        max: Number(maxB.toFixed(1)),
        peak: Number(maxB.toFixed(1)),
        breaches: breachesB
      },
      scatterPoints: scatter
    };
  }, [slicedData, signalADef, signalBDef, thresholds, zoneName]);

  // Calculate dynamic axis domains with 10% breathing room
  const domainA = useMemo<[number, number]>(() => {
    const min = statA.min;
    const max = statA.max;
    const thresh = signalADef.getThreshold(thresholds);
    const effectiveMax = thresh ? Math.max(max, thresh) : max;
    const effectiveMin = thresh && signalADef.thresholdType === 'LOWER_LIMIT' ? Math.min(min, thresh) : min;
    const range = effectiveMax - effectiveMin || 10;
    const paddedMin = Math.floor(Math.max(0, effectiveMin - range * 0.15));
    const paddedMax = Math.ceil(effectiveMax + range * 0.15);
    return [paddedMin, paddedMax];
  }, [statA, signalADef, thresholds]);

  const domainB = useMemo<[number, number]>(() => {
    const min = statB.min;
    const max = statB.max;
    const thresh = signalBDef.getThreshold(thresholds);
    const effectiveMax = thresh ? Math.max(max, thresh) : max;
    const effectiveMin = thresh && signalBDef.thresholdType === 'LOWER_LIMIT' ? Math.min(min, thresh) : min;
    const range = effectiveMax - effectiveMin || 10;
    const paddedMin = Math.floor(Math.max(0, effectiveMin - range * 0.15));
    const paddedMax = Math.ceil(effectiveMax + range * 0.15);
    return [paddedMin, paddedMax];
  }, [statB, signalBDef, thresholds]);

  // Apply a correlation preset
  const handleApplyPreset = (preset: CorrelationPreset) => {
    setSignalAKey(preset.signalA);
    setSignalBKey(preset.signalB);
  };

  // Custom Dual-Axis Tooltip
  const renderDualTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = chartData.find((d) => d.timeLabel === label) || payload[0]?.payload;
    if (!pt) return null;

    const threshA = signalADef.getThreshold(thresholds);
    const threshB = signalBDef.getThreshold(thresholds);

    return (
      <div className="bg-slate-950/98 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs font-sans max-w-sm space-y-3 z-50">
        <div className="border-b border-slate-800 pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center space-x-1.5 font-mono text-cyan-300 font-bold text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{pt.formattedClock} UTC</span>
              <span className="text-slate-400 font-normal">({pt.timeLabel})</span>
            </span>
            {pt.hasBothBreached ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse font-mono">
                DUAL BREACH ⚠️
              </span>
            ) : pt.isBreachedA || pt.isBreachedB ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/50 font-mono">
                THRESHOLD BREACH
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                NOMINAL
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Simultaneous Dual-Signal Telemetry Measurement
          </div>
        </div>

        {/* Signal A Reading */}
        <div
          className="p-2.5 rounded-lg border font-mono text-[11px] space-y-1"
          style={{
            backgroundColor: `${signalADef.color}10`,
            borderColor: `${signalADef.color}40`
          }}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold flex items-center gap-1.5" style={{ color: signalADef.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: signalADef.color }} />
              {signalADef.name}:
            </span>
            <span className="text-white font-extrabold text-sm">
              {pt.valA} {signalADef.unit}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Configured Threshold:</span>
            <span className={pt.isBreachedA ? 'text-rose-400 font-bold' : 'text-slate-300'}>
              {threshA !== undefined ? `${threshA} ${signalADef.unit}` : 'None'}
              {pt.isBreachedA && ' (BREACH)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Delta from 24h Mean ({statA.mean}):</span>
            <span className="text-slate-200">
              {pt.valA >= statA.mean ? '+' : ''}
              {(pt.valA - statA.mean).toFixed(1)} {signalADef.unit}
            </span>
          </div>
        </div>

        {/* Signal B Reading */}
        <div
          className="p-2.5 rounded-lg border font-mono text-[11px] space-y-1"
          style={{
            backgroundColor: `${signalBDef.color}10`,
            borderColor: `${signalBDef.color}40`
          }}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold flex items-center gap-1.5" style={{ color: signalBDef.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: signalBDef.color }} />
              {signalBDef.name}:
            </span>
            <span className="text-white font-extrabold text-sm">
              {pt.valB} {signalBDef.unit}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Configured Threshold:</span>
            <span className={pt.isBreachedB ? 'text-rose-400 font-bold' : 'text-slate-300'}>
              {threshB !== undefined ? `${threshB} ${signalBDef.unit}` : 'None'}
              {pt.isBreachedB && ' (BREACH)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Delta from 24h Mean ({statB.mean}):</span>
            <span className="text-slate-200">
              {pt.valB >= statB.mean ? '+' : ''}
              {(pt.valB - statB.mean).toFixed(1)} {signalBDef.unit}
            </span>
          </div>
        </div>

        {/* Dynamic Point Correlation Note */}
        <div className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-slate-800">
          <span className="text-cyan-400 font-semibold font-mono">Statistical Impact: </span>
          {pt.hasBothBreached
            ? 'Concurrent breach: Environmental threshold exceedance aligns with acute worker health impairment.'
            : pt.isBreachedA
            ? `Environmental strain active (${signalADef.shortName}), worker compensation within tolerance.`
            : pt.isBreachedB
            ? `Worker physiological marker elevated despite nominal ${signalADef.shortName}.`
            : 'Both signals within configured safety margins.'}
        </div>
      </div>
    );
  };

  const threshValA = signalADef.getThreshold(thresholds);
  const threshValB = signalBDef.getThreshold(thresholds);

  return (
    <div className="space-y-4">
      {/* Top Correlation Selector Ribbon */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Layers className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Simultaneous Dual-Signal Correlation Engine
                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Pearson r = {pearsonR > 0 ? `+${pearsonR.toFixed(2)}` : pearsonR.toFixed(2)}
                </span>
              </span>
              <p className="text-[11px] text-slate-400">
                Overlay an environmental stressor against a worker health biomarker on synchronized dual Y-axes
              </p>
            </div>
          </div>

          {/* View Mode & Time Horizon Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* View Mode Switch: Dual-Axis vs 2D Scatter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 font-mono text-[11px]">
              <button
                onClick={() => setSubView('DUAL_AXIS')}
                className={`px-2.5 py-1 rounded transition font-semibold ${
                  subView === 'DUAL_AXIS'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dual Y-Axis Waveform
              </button>
              <button
                onClick={() => setSubView('SCATTER_PLOT')}
                className={`px-2.5 py-1 rounded transition font-semibold ${
                  subView === 'SCATTER_PLOT'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Correlation Scatter
              </button>
            </div>

            {/* Threshold Reference Lines Toggle */}
            <button
              onClick={() => setShowThresholdLines((v) => !v)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                showThresholdLines
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle threshold reference lines on dual axes"
            >
              Thresholds {showThresholdLines ? '[ON]' : '[OFF]'}
            </button>

            {/* Time Span Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 font-mono text-[11px]">
              {[6, 12, 24].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => setSelectedHours(hrs)}
                  className={`px-2 py-0.5 rounded transition ${
                    selectedHours === hrs
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signal Pair Pickers: Signal A (Left Axis) vs Signal B (Right Axis) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Signal A (Left Axis) Selector */}
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: signalADef.color }} />
                <span>Primary Signal (Left Y-Axis):</span>
              </label>
              <span className="text-[10px] font-mono" style={{ color: signalADef.color }}>
                {signalADef.category === 'ENVIRONMENTAL' ? 'Environmental Factor' : 'Worker Biomarker'}
              </span>
            </div>
            <select
              value={signalAKey}
              onChange={(e) => setSignalAKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-hidden focus:border-cyan-500"
            >
              <optgroup label="Environmental Stressors">
                <option value="ambientTemp">🌡️ Ambient Heat Index (°C)</option>
                <option value="noiseDb">🔊 Acoustic Noise Exposure (dBA)</option>
                <option value="twl">💨 Thermal Work Limit TWL (W/m²)</option>
                <option value="aqi">🌫️ Air Quality Index (AQI)</option>
              </optgroup>
              <optgroup label="Worker Health Markers">
                <option value="heartRate">💓 Worker Heart Rate / Pulse (BPM)</option>
                <option value="smoothedHrv">📉 Kalman-Smoothed Worker HRV (ms)</option>
                <option value="rawHrv">📊 Raw Wearable HRV (ms)</option>
                <option value="skinTemp">🌡️ Skin / Surface Core Temp (°C)</option>
                <option value="riskScore">⚠️ Composite Health Risk (%)</option>
              </optgroup>
            </select>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Unit: <strong className="text-white">{signalADef.unit}</strong></span>
              <span>24h Mean: <strong className="text-white">{statA.mean} {signalADef.unit}</strong></span>
              <span>
                Limit: <strong style={{ color: signalADef.color }}>{threshValA !== undefined ? `${threshValA} ${signalADef.unit}` : 'None'}</strong>
              </span>
            </div>
          </div>

          {/* Signal B (Right Axis) Selector */}
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: signalBDef.color }} />
                <span>Secondary Signal (Right Y-Axis):</span>
              </label>
              <span className="text-[10px] font-mono" style={{ color: signalBDef.color }}>
                {signalBDef.category === 'WORKER_HEALTH' ? 'Worker Biomarker' : 'Environmental Factor'}
              </span>
            </div>
            <select
              value={signalBKey}
              onChange={(e) => setSignalBKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-hidden focus:border-cyan-500"
            >
              <optgroup label="Worker Health Markers">
                <option value="heartRate">💓 Worker Heart Rate / Pulse (BPM)</option>
                <option value="smoothedHrv">📉 Kalman-Smoothed Worker HRV (ms)</option>
                <option value="rawHrv">📊 Raw Wearable HRV (ms)</option>
                <option value="skinTemp">🌡️ Skin / Surface Core Temp (°C)</option>
                <option value="riskScore">⚠️ Composite Health Risk (%)</option>
              </optgroup>
              <optgroup label="Environmental Stressors">
                <option value="ambientTemp">🌡️ Ambient Heat Index (°C)</option>
                <option value="noiseDb">🔊 Acoustic Noise Exposure (dBA)</option>
                <option value="twl">💨 Thermal Work Limit TWL (W/m²)</option>
                <option value="aqi">🌫️ Air Quality Index (AQI)</option>
              </optgroup>
            </select>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Unit: <strong className="text-white">{signalBDef.unit}</strong></span>
              <span>24h Mean: <strong className="text-white">{statB.mean} {signalBDef.unit}</strong></span>
              <span>
                Limit: <strong style={{ color: signalBDef.color }}>{threshValB !== undefined ? `${threshValB} ${signalBDef.unit}` : 'None'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Correlation Presets Selector */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              Quick Industry Correlation Presets:
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Select standard pairing to identify physiological causal chains:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CORRELATION_PRESETS.map((preset) => {
              const isCurrent = preset.signalA === signalAKey && preset.signalB === signalBKey;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
                  title={`${preset.name} - ${preset.description}`}
                >
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Correlation Statistics & Analytical Insight Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Metric 1: Pearson r & Strength */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
            PEARSON CORRELATION (r)
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span
              className={`text-2xl font-black font-mono ${
                relationshipType === 'POSITIVE'
                  ? 'text-rose-400'
                  : relationshipType === 'NEGATIVE'
                  ? 'text-cyan-400'
                  : 'text-slate-300'
              }`}
            >
              {pearsonR > 0 ? `+${pearsonR.toFixed(2)}` : pearsonR.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              R² = {(rSquared * 100).toFixed(0)}%
            </span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded w-fit uppercase ${
              Math.abs(pearsonR) >= 0.7
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : Math.abs(pearsonR) >= 0.4
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {strengthLabel}
          </span>
        </div>

        {/* Metric 2: Cross-Correlation Lead / Lag */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3" />
            PHASE LEAD / LAG TIMING
          </span>
          <p className="text-xs text-slate-200 leading-snug my-1 font-mono">
            {leadLagInsight}
          </p>
          <span className="text-[10px] text-slate-400">
            Computed via 15-minute cross-covariance window
          </span>
        </div>

        {/* Metric 3: Threshold Breach Concurrence */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            CONCURRENT EXCEEDANCES
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-xl font-bold text-white font-mono">
              {chartData.filter((d) => d.hasBothBreached).length}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Intervals ({statA.breaches} A / {statB.breaches} B)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Intervals where both stressor &amp; biomarker breached thresholds
          </span>
        </div>

        {/* Metric 4: Physiological Mechanism Narrative */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
            <Compass className="h-3 w-3 text-cyan-400" />
            ETIOLOGICAL INTERPRETATION
          </span>
          <p className="text-[11px] text-slate-300 leading-snug my-1">
            {narrativeInsight}
          </p>
          <span className="text-[10px] text-cyan-300/80 font-mono">
            Prognosticator Correlation Model
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        {subView === 'DUAL_AXIS' ? (
          <div className="w-full h-84">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 35, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />

                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />

                {/* Left Y-Axis: Dedicated to Signal A */}
                <YAxis
                  yAxisId="leftAxis"
                  stroke={signalADef.color}
                  domain={domainA}
                  tick={{ fontSize: 11, fill: signalADef.color }}
                  tickLine={{ stroke: signalADef.color }}
                  axisLine={{ stroke: signalADef.color }}
                  unit={` ${signalADef.unit}`}
                />

                {/* Right Y-Axis: Dedicated to Signal B */}
                <YAxis
                  yAxisId="rightAxis"
                  orientation="right"
                  stroke={signalBDef.color}
                  domain={domainB}
                  tick={{ fontSize: 11, fill: signalBDef.color }}
                  tickLine={{ stroke: signalBDef.color }}
                  axisLine={{ stroke: signalBDef.color }}
                  unit={` ${signalBDef.unit}`}
                />

                <Tooltip
                  content={renderDualTooltip}
                  cursor={{ stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                />

                {/* Threshold Reference Lines */}
                {showThresholdLines && threshValA !== undefined && (
                  <ReferenceLine
                    yAxisId="leftAxis"
                    y={threshValA}
                    stroke={signalADef.color}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `${signalADef.shortName} Limit (${threshValA} ${signalADef.unit})`,
                      fill: signalADef.color,
                      fontSize: 10,
                      position: 'insideTopLeft'
                    }}
                  />
                )}

                {showThresholdLines && threshValB !== undefined && (
                  <ReferenceLine
                    yAxisId="rightAxis"
                    y={threshValB}
                    stroke={signalBDef.color}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `${signalBDef.shortName} Limit (${threshValB} ${signalBDef.unit})`,
                      fill: signalBDef.color,
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                )}

                {/* Signal A Waveform (Primary / Environmental) */}
                <Line
                  yAxisId="leftAxis"
                  type="monotone"
                  dataKey="valA"
                  name={`${signalADef.name} (${signalADef.unit})`}
                  stroke={signalADef.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: signalADef.color,
                    stroke: '#020617',
                    strokeWidth: 2
                  }}
                  isAnimationActive={false}
                />

                {/* Signal B Waveform (Secondary / Worker Biomarker) */}
                <Line
                  yAxisId="rightAxis"
                  type="monotone"
                  dataKey="valB"
                  name={`${signalBDef.name} (${signalBDef.unit})`}
                  stroke={signalBDef.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: signalBDef.color,
                    stroke: '#020617',
                    strokeWidth: 2
                  }}
                  isAnimationActive={false}
                />

                <Brush
                  dataKey="timeLabel"
                  height={24}
                  stroke="#475569"
                  fill="#090d16"
                  tickFormatter={() => ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* 2D Correlation Scatter Plot View */
          <div className="w-full h-84 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
              <span className="font-mono">
                X-Axis: <strong style={{ color: signalADef.color }}>{signalADef.name} ({signalADef.unit})</strong>
              </span>
              <span className="font-mono">
                Y-Axis: <strong style={{ color: signalBDef.color }}>{signalBDef.name} ({signalBDef.unit})</strong>
              </span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={signalADef.shortName}
                  unit={` ${signalADef.unit}`}
                  domain={domainA}
                  stroke={signalADef.color}
                  tick={{ fontSize: 11, fill: signalADef.color }}
                  label={{
                    value: `${signalADef.name} (${signalADef.unit})`,
                    position: 'insideBottom',
                    offset: -12,
                    fill: signalADef.color,
                    fontSize: 11
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={signalBDef.shortName}
                  unit={` ${signalBDef.unit}`}
                  domain={domainB}
                  stroke={signalBDef.color}
                  tick={{ fontSize: 11, fill: signalBDef.color }}
                  label={{
                    value: `${signalBDef.name} (${signalBDef.unit})`,
                    angle: -90,
                    position: 'insideLeft',
                    fill: signalBDef.color,
                    fontSize: 11
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const dataPoint = payload[0]?.payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          {dataPoint.formattedClock} UTC ({dataPoint.timeLabel})
                        </div>
                        <div style={{ color: signalADef.color }}>
                          {signalADef.shortName}: {dataPoint.x} {signalADef.unit}
                        </div>
                        <div style={{ color: signalBDef.color }}>
                          {signalBDef.shortName}: {dataPoint.y} {signalBDef.unit}
                        </div>
                        {dataPoint.isBreachedA || dataPoint.isBreachedB ? (
                          <div className="text-rose-400 text-[10px] pt-1">
                            ⚠️ Threshold Exceedance Logged
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                />
                <Scatter
                  name="Interval Observations"
                  data={scatterPoints}
                  fill="#06b6d4"
                  opacity={0.75}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend & Instructions Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 gap-2 font-mono mt-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: signalADef.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: signalADef.color }} />
              Left Axis: {signalADef.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: signalBDef.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: signalBDef.color }} />
              Right Axis: {signalBDef.name}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            {onOpenThresholdsModal && (
              <button
                onClick={onOpenThresholdsModal}
                className="text-indigo-400 hover:text-indigo-300 underline transition text-[11px]"
              >
                Configure Threshold Limits
              </button>
            )}
            <span>•</span>
            <span className="text-slate-400">
              Drag bottom brush to zoom specific work-shift time slices
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

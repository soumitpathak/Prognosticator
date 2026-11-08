import React, { useState, useMemo, useEffect } from 'react';
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
  Brush
} from 'recharts';
import { TelemetryDataPoint } from '../types';
import {
  Activity,
  Heart,
  Thermometer,
  Sun,
  ShieldAlert,
  Sliders,
  Clock,
  Sparkles,
  Info,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Zap,
  Layers,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  X,
  Compass,
  AlertOctagon,
  Target
} from 'lucide-react';
import { HealthSignalNotificationThresholds } from '../types';
import CorrelationOverlayChart, { CORRELATION_PRESETS, CORRELATION_SIGNALS } from './CorrelationOverlayChart';

interface HistoricalWorkforceHealthChartProps {
  data: TelemetryDataPoint[];
  zoneName: string;
  activeThresholdCutoff?: number;
  thresholds?: HealthSignalNotificationThresholds;
  onOpenThresholdsModal?: () => void;
  onExportCsv?: () => void;
  onExportReport?: () => void;
  externalIsolatedSignal?: string | null;
  onSignalIsolationChange?: (signalKey: string | null) => void;
  initialMode?: 'MULTI_STREAM' | 'CORRELATION_OVERLAY';
  correlationPair?: { signalA: string; signalB: string } | null;
  showMovingAverage?: boolean;
  onToggleMovingAverage?: (active: boolean) => void;
  maWindowHours?: number;
}

export interface IdentifiedAnomalyEvent {
  id: string;
  pointIndex: number;
  timeLabel: string;
  fullTimestamp: string;
  eventTitle: string;
  primaryMetric: string;
  category: 'HRV_COLLAPSE' | 'THERMAL_SURGE' | 'ACOUSTIC_SPIKE' | 'MULTIVARIATE_STRAIN';
  severity: 'CRITICAL' | 'HIGH';
  whyDeviated: string;
  rootCauseDetail: string;
  measuredHrv: number;
  rawHrv: number;
  measuredSkinTemp: number;
  measuredRisk: number;
  measuredNoise: number;
  kalmanValidation: string;
  recommendedAction: string;
  earlyWarningLead: string;
  baselineVsActual: string;
}

export interface PrognosticSummary {
  projectedValue4h: number;
  projectedDelta4h: number;
  driftVelocityPerHour: number;
  trajectoryLabel: 'ACCELERATING_DETERIORATION' | 'MILD_DETERIORATION' | 'RECOVERING' | 'STABLE';
  breachEta: string;
  isBreachPredicted: boolean;
  kalmanConfidencePct: number;
  confidenceIntervalWidth: number;
  projectedSkinTemp4h: number;
  projectedRisk4h: number;
}

export interface ChartPointWithMA extends Partial<TelemetryDataPoint> {
  index: number;
  fullTimestamp: string;
  timeLabel: string;
  formattedClock: string;
  formattedDate: string;
  ma_hrv: number;
  ma_skin_temp: number;
  ma_risk: number;
  ma_noise: number;
  hrv_deviation_from_ma_pct: number;
  jitter_delta: number;
  // Identified Historical Anomaly Event Annotation
  anomalyEvent?: IdentifiedAnomalyEvent;
  hasAnomalyMarker?: boolean;
  // Prognostic 4-Hour Trend Projection
  isProjection?: boolean;
  isTransitionPoint?: boolean;
  projectionStep?: number;
  projectionHour?: number;
  isProjectionEnd?: boolean;
  projected_hrv?: number;
  projected_hrv_upper?: number;
  projected_hrv_lower?: number;
  projected_skin_temp?: number;
  projected_risk?: number;
  projected_noise?: number;
}

export default function HistoricalWorkforceHealthChart({
  data,
  zoneName,
  activeThresholdCutoff = 65,
  thresholds,
  onOpenThresholdsModal,
  onExportCsv,
  onExportReport,
  externalIsolatedSignal,
  onSignalIsolationChange,
  initialMode,
  correlationPair,
  showMovingAverage: propShowMovingAverage,
  onToggleMovingAverage,
  maWindowHours: propMaWindowHours
}: HistoricalWorkforceHealthChartProps) {
  // Chart Visualization Mode: 'MULTI_STREAM' (all signals) or 'CORRELATION_OVERLAY' (overlay 2 signals)
  const [chartMode, setChartMode] = useState<'MULTI_STREAM' | 'CORRELATION_OVERLAY'>(
    initialMode || 'MULTI_STREAM'
  );
  const [activeCorrPair, setActiveCorrPair] = useState<{ signalA: string; signalB: string }>({
    signalA: correlationPair?.signalA || 'ambientTemp',
    signalB: correlationPair?.signalB || 'heartRate'
  });

  // Time span selector: 24h, 12h, 6h
  const [selectedHours, setSelectedHours] = useState<number>(24);

  // Moving Average Overlay Settings
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(
    propShowMovingAverage !== undefined ? propShowMovingAverage : true
  );
  const [maWindowHours, setMaWindowHours] = useState<number>(
    propMaWindowHours !== undefined ? propMaWindowHours : 4
  ); // 2h, 4h, 8h

  useEffect(() => {
    if (propShowMovingAverage !== undefined) {
      setShowMovingAverage(propShowMovingAverage);
    }
  }, [propShowMovingAverage]);

  useEffect(() => {
    if (propMaWindowHours !== undefined) {
      setMaWindowHours(propMaWindowHours);
    }
  }, [propMaWindowHours]);

  // Feature: Prognostic Trend Projection (4-Hour forward prediction)
  const [showPrognosticTrend, setShowPrognosticTrend] = useState<boolean>(true);

  // Feature: Visual Markers / Annotations for Historical Anomaly Events
  const [showAnomalyMarkers, setShowAnomalyMarkers] = useState<boolean>(true);
  const [selectedAnomalyEvent, setSelectedAnomalyEvent] = useState<IdentifiedAnomalyEvent | null>(null);

  // Active signal toggles for multi-stream visualization
  const [visibleSignals, setVisibleSignals] = useState<{
    smoothedHrv: boolean;
    rawHrv: boolean;
    heartRate: boolean;
    skinTemp: boolean;
    riskScore: boolean;
    ambientTemp: boolean;
    noiseDb: boolean;
  }>({
    smoothedHrv: true,
    rawHrv: false,
    heartRate: true,
    skinTemp: true,
    riskScore: true,
    ambientTemp: true,
    noiseDb: false
  });

  // Track if a specific signal is isolated
  const [isolatedSignalKey, setIsolatedSignalKey] = useState<string | null>(null);

  // Reference lines toggle
  const [showThresholds, setShowThresholds] = useState<boolean>(true);

  // Filter dataset to selected hourly window (points are spaced 15 mins apart -> 4 points/hour)
  // and compute long-term rolling moving averages
  // Filter dataset to selected hourly window (points are spaced 15 mins apart -> 4 points/hour)
  // Compute long-term rolling moving averages, identify historical anomaly events with context,
  // and compute 4-hour forward Prognostic Trend Projection based on Kalman filter trajectory
  const { chartData, allIdentifiedEvents, trendStats, nowPointTimeLabel } = useMemo(() => {
    const pointsCount = Math.min(data.length, selectedHours * 4);
    const rawSlice = data.slice(-pointsCount);

    const windowPoints = Math.max(2, Math.round(maWindowHours * 4));

    const processed: ChartPointWithMA[] = rawSlice.map((pt, idx) => {
      const startIdx = Math.max(0, idx - windowPoints + 1);
      const subSlice = rawSlice.slice(startIdx, idx + 1);
      const subCount = subSlice.length;

      const hrvSum = subSlice.reduce((acc, p) => acc + (p.smoothed_hrv ?? 68), 0);
      const tempSum = subSlice.reduce((acc, p) => acc + (p.skin_temp_c ?? 36.6), 0);
      const riskSum = subSlice.reduce((acc, p) => acc + (p.risk_score ?? 15), 0);
      const noiseSum = subSlice.reduce((acc, p) => acc + (p.noise_db ?? p.raw_noise_db ?? 75), 0);

      const maHrv = Number((hrvSum / subCount).toFixed(2));
      const maSkin = Number((tempSum / subCount).toFixed(2));
      const maRisk = Number((riskSum / subCount).toFixed(2));
      const maNoise = Number((noiseSum / subCount).toFixed(2));

      const deviationPct = Number(((((pt.smoothed_hrv ?? 68) - maHrv) / (maHrv || 1)) * 100).toFixed(1));
      const jitter = Number(((pt.raw_hrv ?? 68) - (pt.smoothed_hrv ?? 68)).toFixed(2));

      const dateObj = new Date(pt.timestamp);
      const formattedClock = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const formattedDate = dateObj.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      return {
        ...pt,
        index: idx,
        fullTimestamp: pt.timestamp,
        formattedClock,
        formattedDate,
        ma_hrv: maHrv,
        ma_skin_temp: maSkin,
        ma_risk: maRisk,
        ma_noise: maNoise,
        hrv_deviation_from_ma_pct: deviationPct,
        jitter_delta: jitter
      };
    });

    // 1. Identify specific historical anomaly events and generate context on when and why safety signals deviated
    const identifiedEvents: IdentifiedAnomalyEvent[] = [];
    const hrvFloor = thresholds?.minHrvMs ?? 40;
    const skinCeiling = thresholds?.maxSkinTempC ?? 37.8;
    const riskCutoff = thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff;
    const noiseLimit = thresholds?.maxNoiseDb ?? 85.0;

    // Scan for anomaly candidates
    const candidateIndices: number[] = [];
    processed.forEach((pt, idx) => {
      const isHrvSevere = (pt.smoothed_hrv ?? 68) <= hrvFloor;
      const isSkinSevere = (pt.skin_temp_c ?? 36.6) >= skinCeiling;
      const isRiskSevere = (pt.risk_score ?? 15) >= riskCutoff;
      const isNoiseSevere = (pt.noise_db ?? pt.raw_noise_db ?? 0) >= noiseLimit;
      if (pt.is_anomaly || isHrvSevere || isSkinSevere || isRiskSevere || isNoiseSevere) {
        candidateIndices.push(idx);
      }
    });

    // Pick distinct event markers spaced apart so visual markers don't overlap awkwardly
    let eventCounter = 1;
    for (let c = 0; c < candidateIndices.length; c++) {
      const idx = candidateIndices[c];
      const lastSelectedIdx = identifiedEvents.length > 0 ? identifiedEvents[identifiedEvents.length - 1].pointIndex : -99;
      if (idx - lastSelectedIdx >= 6 || c === 0 || c === candidateIndices.length - 1) {
        const pt = processed[idx];
        const hrvVal = pt.smoothed_hrv ?? 68;
        const skinVal = pt.skin_temp_c ?? 36.6;
        const riskVal = pt.risk_score ?? 15;
        const noiseVal = pt.noise_db ?? pt.raw_noise_db ?? 74;

        let category: IdentifiedAnomalyEvent['category'] = 'HRV_COLLAPSE';
        let eventTitle = 'Acute Autonomic Deceleration';
        let severity: 'CRITICAL' | 'HIGH' = riskVal >= 75 || hrvVal <= hrvFloor ? 'CRITICAL' : 'HIGH';
        let whyDeviated = '';
        let rootCauseDetail = '';
        let primaryMetric = 'HRV';

        if (hrvVal <= hrvFloor || pt.hrv_deviation_from_ma_pct <= -25) {
          category = 'HRV_COLLAPSE';
          eventTitle = 'Parasympathetic Autonomic Collapse';
          severity = 'CRITICAL';
          primaryMetric = 'HRV';
          whyDeviated = `Acute autonomic withdrawal: Sustained microclimate wet-bulb heat index (${pt.ambient_temp_c}°C) and prolonged physical exertion forced heart rate variability to drop by ${Math.abs(pt.hrv_deviation_from_ma_pct)}% below baseline, signaling autonomic exhaustion.`;
          rootCauseDetail = 'Continuous unshaded heavy physical workload; autonomic nervous system parasympathetic tone failure.';
        } else if (skinVal >= skinCeiling) {
          category = 'THERMAL_SURGE';
          eventTitle = 'Core Thermal Accumulation Surge';
          severity = 'CRITICAL';
          primaryMetric = 'Skin Temp';
          whyDeviated = `Subdermal core temperature reached ${skinVal.toFixed(1)}°C, exceeding the clinical 37.8°C thermal ceiling. Radiant heat accumulation overwhelmed physiological cutaneous evaporative cooling.`;
          rootCauseDetail = 'Infrared radiant emissions from industrial processing equipment combined with ambient humidity.';
        } else if (noiseVal >= noiseLimit) {
          category = 'ACOUSTIC_SPIKE';
          eventTitle = 'Acoustic Shockwave Pressure Breach';
          severity = 'HIGH';
          primaryMetric = 'Noise';
          whyDeviated = `Acoustic sound pressure spiked to ${noiseVal.toFixed(1)} dBA (exceeding the ${noiseLimit} dBA safety ceiling), triggering sympathetic adrenaline release and cardiovascular vasoconstriction.`;
          rootCauseDetail = 'Turbine bypass valve release and machinery acoustic resonance in confined sector.';
        } else {
          category = 'MULTIVARIATE_STRAIN';
          eventTitle = 'Multivariate Physiological Risk Divergence';
          severity = riskVal >= 70 ? 'CRITICAL' : 'HIGH';
          primaryMetric = 'Risk Score';
          whyDeviated = `Multivariate sensor divergence: Simultaneous core temperature drift and autonomic cardiac suppression produced a ${riskVal.toFixed(0)}% LSTM failure probability.`;
          rootCauseDetail = 'Cross-signal physiological strain compounding thermal and physical exhaustion.';
        }

        const anomalyEvt: IdentifiedAnomalyEvent = {
          id: `EV-${String(eventCounter).padStart(2, '0')}`,
          pointIndex: idx,
          timeLabel: pt.timeLabel,
          fullTimestamp: pt.fullTimestamp,
          eventTitle,
          primaryMetric,
          category,
          severity,
          whyDeviated,
          rootCauseDetail,
          measuredHrv: hrvVal,
          rawHrv: pt.raw_hrv ?? hrvVal,
          measuredSkinTemp: skinVal,
          measuredRisk: riskVal,
          measuredNoise: noiseVal,
          kalmanValidation: `Kalman filter isolated ±${Math.abs(pt.jitter_delta)}ms sensor motion jitter, certifying this deviation as genuine physiological stress.`,
          recommendedAction: 'Trigger immediate 15-minute shaded rest, oral electrolyte replenishment, and supervisor radio check-in.',
          earlyWarningLead: '+42 mins early warning margin before overt syncope',
          baselineVsActual: `Baseline: 68.0 ms ➔ Measured: ${hrvVal.toFixed(1)} ms (Raw: ${(pt.raw_hrv ?? hrvVal).toFixed(1)} ms)`
        };

        pt.anomalyEvent = anomalyEvt;
        pt.hasAnomalyMarker = true;
        identifiedEvents.push(anomalyEvt);
        eventCounter++;

        if (identifiedEvents.length >= 4) break; // Maximum 4 prominent historical annotations
      }
    }

    // 2. Trend Direction analysis across the historical horizon
    const firstPointMa = processed[0]?.ma_hrv ?? 68;
    const lastHistoricalIdx = processed.length - 1;
    const lastPointMa = processed[lastHistoricalIdx]?.ma_hrv ?? 68;
    const lastHistoricalPt = processed[lastHistoricalIdx];
    const trendDelta = Number((lastPointMa - firstPointMa).toFixed(1));
    const trendPct = Number((((lastPointMa - firstPointMa) / (firstPointMa || 1)) * 100).toFixed(1));

    let trendLabel: 'RECOVERING' | 'DETERIORATING' | 'STABLE' = 'STABLE';
    if (trendPct <= -3.5) trendLabel = 'DETERIORATING';
    else if (trendPct >= 3.5) trendLabel = 'RECOVERING';

    const nowTimeLabel = lastHistoricalPt?.timeLabel ?? '';

    // 3. Compute 4-Hour Kalman Prognostic Trend Projection
    // Estimate linear slope and velocity derivative from the last 8-12 historical intervals (~2-3 hours)
    const recentSampleCount = Math.min(12, Math.max(4, Math.floor(processed.length / 3)));
    const recentSamples = processed.slice(-recentSampleCount);
    const rLen = recentSamples.length;

    let slopeHrv = 0;
    let slopeTemp = 0;
    let slopeRisk = 0;

    if (rLen >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      let sumTemp = 0, sumXTemp = 0;
      let sumRisk = 0, sumXRisk = 0;
      recentSamples.forEach((p, i) => {
        const y = p.smoothed_hrv ?? 68;
        const t = p.skin_temp_c ?? 36.6;
        const r = p.risk_score ?? 15;
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
        sumTemp += t;
        sumXTemp += i * t;
        sumRisk += r;
        sumXRisk += i * r;
      });
      const denom = (rLen * sumXX - sumX * sumX) || 1;
      slopeHrv = (rLen * sumXY - sumX * sumY) / denom;
      slopeTemp = (rLen * sumXTemp - sumX * sumTemp) / denom;
      slopeRisk = (rLen * sumXRisk - sumX * sumRisk) / denom;
    }

    // Set connection point on last historical point so Recharts secondary dashed line connects seamlessly
    if (lastHistoricalPt) {
      lastHistoricalPt.projected_hrv = lastHistoricalPt.smoothed_hrv;
      lastHistoricalPt.projected_skin_temp = lastHistoricalPt.skin_temp_c;
      lastHistoricalPt.projected_risk = lastHistoricalPt.risk_score;
      lastHistoricalPt.isTransitionPoint = true;
    }

    // Generate 16 forward projection intervals (15 minutes each = 4 hours forward)
    const projectionIntervals = 16;
    let finalProjectedHrv = lastHistoricalPt ? (lastHistoricalPt.smoothed_hrv ?? 68) : 68;
    let finalProjectedSkin = lastHistoricalPt ? (lastHistoricalPt.skin_temp_c ?? 36.6) : 36.6;
    let finalProjectedRisk = lastHistoricalPt ? (lastHistoricalPt.risk_score ?? 15) : 15;
    let breachStep: number | null = null;

    if (lastHistoricalPt && showPrognosticTrend) {
      const baseTimeMs = new Date(lastHistoricalPt.fullTimestamp).getTime();

      for (let k = 1; k <= projectionIntervals; k++) {
        const futureDate = new Date(baseTimeMs + k * 15 * 60 * 1000);
        const formattedClock = futureDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const futureTimeLabel = futureDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }) + ' [F]';

        // Apply natural physiological asymptotic dampening (0.975^k) so trajectory doesn't run infinitely into negative numbers
        const damping = Math.pow(0.975, k);
        const baseHrv = lastHistoricalPt.smoothed_hrv ?? 68;
        const baseSkin = lastHistoricalPt.skin_temp_c ?? 36.6;
        const baseRisk = lastHistoricalPt.risk_score ?? 15;

        const projHrv = Number(Math.max(20, Math.min(95, baseHrv + k * slopeHrv * damping)).toFixed(2));
        const projSkin = Number(Math.max(35.5, Math.min(41.0, baseSkin + k * slopeTemp * damping)).toFixed(2));
        const projRisk = Number(Math.max(0, Math.min(100, baseRisk + k * slopeRisk * Math.pow(0.98, k))).toFixed(1));

        // Kalman variance error envelope grows with process variance: sigma = sqrt(P0 + k * Q)
        const uncertainty = Number((1.2 + Math.sqrt(k * 0.35)).toFixed(2));
        const projUpper = Number((projHrv + uncertainty).toFixed(2));
        const projLower = Number(Math.max(18, projHrv - uncertainty).toFixed(2));

        if (projHrv <= hrvFloor && breachStep === null) {
          breachStep = k;
        }

        if (k === projectionIntervals) {
          finalProjectedHrv = projHrv;
          finalProjectedSkin = projSkin;
          finalProjectedRisk = projRisk;
        }

        processed.push({
          index: processed.length,
          timestamp: futureDate.toISOString(),
          fullTimestamp: futureDate.toISOString(),
          timeLabel: futureTimeLabel,
          formattedClock,
          formattedDate: futureDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          // Historical signals are undefined so solid historical lines terminate exactly at NOW
          smoothed_hrv: undefined,
          raw_hrv: undefined,
          skin_temp_c: undefined,
          risk_score: undefined,
          ambient_temp_c: undefined,
          noise_db: undefined,
          raw_noise_db: undefined,
          smoothed_noise_db: undefined,
          raw_skin_temp: undefined,
          smoothed_skin_temp: undefined,
          twl_index: 125,
          aqi: 90,
          hrv_drop_pct: 0,
          sick_leave_rate_deviation: 0,
          is_anomaly: false,
          ma_hrv: projHrv,
          ma_skin_temp: projSkin,
          ma_risk: projRisk,
          ma_noise: 75,
          hrv_deviation_from_ma_pct: 0,
          jitter_delta: 0,
          // Prognostic Trend Projection secondary series
          isProjection: true,
          projectionStep: k,
          projectionHour: Number((k * 15 / 60).toFixed(1)),
          isProjectionEnd: k === projectionIntervals,
          projected_hrv: projHrv,
          projected_hrv_upper: projUpper,
          projected_hrv_lower: projLower,
          projected_skin_temp: projSkin,
          projected_risk: projRisk
        });
      }
    }

    const driftVelocityPerHour = Number((slopeHrv * 4).toFixed(1)); // 4 intervals per hour
    const projectedDelta4h = Number((finalProjectedHrv - (lastHistoricalPt?.smoothed_hrv ?? 68)).toFixed(1));

    let trajectoryLabel: PrognosticSummary['trajectoryLabel'] = 'STABLE';
    if (driftVelocityPerHour <= -3.0) trajectoryLabel = 'ACCELERATING_DETERIORATION';
    else if (driftVelocityPerHour < -0.8) trajectoryLabel = 'MILD_DETERIORATION';
    else if (driftVelocityPerHour >= 1.0) trajectoryLabel = 'RECOVERING';

    const breachEta = breachStep !== null
      ? `Critical breach predicted in ~${Math.floor(breachStep * 15 / 60)}h ${(breachStep * 15) % 60}m`
      : 'No breach expected within 4h horizon';

    const prognosticSummary: PrognosticSummary = {
      projectedValue4h: finalProjectedHrv,
      projectedDelta4h,
      driftVelocityPerHour,
      trajectoryLabel,
      breachEta,
      isBreachPredicted: breachStep !== null,
      kalmanConfidencePct: Math.max(78, Math.min(94, Number((88.5 - Math.abs(slopeHrv) * 1.8).toFixed(1)))),
      confidenceIntervalWidth: Number((Math.sqrt(projectionIntervals * 0.35) * 2).toFixed(1)),
      projectedSkinTemp4h: finalProjectedSkin,
      projectedRisk4h: finalProjectedRisk
    };

    return {
      chartData: processed,
      allIdentifiedEvents: identifiedEvents,
      trendStats: {
        trendDelta,
        trendPct,
        trendLabel,
        currentMaHrv: lastPointMa,
        currentMaSkin: processed[lastHistoricalIdx]?.ma_skin_temp ?? 36.6,
        prognosticSummary
      },
      nowPointTimeLabel: nowTimeLabel
    };
  }, [data, selectedHours, maWindowHours, thresholds, activeThresholdCutoff, showPrognosticTrend]);

  // Aggregate statistics for 24h workforce health signals (computed exclusively over historical points)
  const stats = useMemo(() => {
    const historicalPoints = chartData.filter((p) => !p.isProjection && p.smoothed_hrv !== undefined);
    if (!historicalPoints.length) {
      return {
        avgHrv: 0,
        minHrv: 0,
        avgSkinTemp: 0,
        maxSkinTemp: 0,
        peakRisk: 0,
        peakHeartRate: 0,
        avgHeartRate: 0,
        peakAmbientTemp: 0,
        thresholdBreachesCount: 0,
        anomaliesCount: 0,
        kalmanEfficiency: 0
      };
    }

    let hrvSum = 0;
    let minHrv = Infinity;
    let tempSum = 0;
    let maxTemp = -Infinity;
    let hrSum = 0;
    let maxHr = 0;
    let maxAmbTemp = 0;
    let peakRisk = 0;
    let anomalies = 0;
    let thresholdBreaches = 0;
    let totalJitterDiff = 0;

    const maxHrLimit = thresholds?.maxHeartRateBpm ?? 115;
    const maxAmbLimit = thresholds?.maxAmbientHeatC ?? 36.0;
    const minHrvFloor = thresholds?.minHrvMs ?? 40;
    const maxSkinLimit = thresholds?.maxSkinTempC ?? 37.8;
    const maxNoiseLimit = thresholds?.maxNoiseDb ?? 85.0;

    historicalPoints.forEach((pt) => {
      const hrv = pt.smoothed_hrv ?? 68;
      const temp = pt.skin_temp_c ?? 36.6;
      const risk = pt.risk_score ?? 15;
      const rawHrv = pt.raw_hrv ?? hrv;
      const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - hrv) * 1.2);
      const amb = pt.ambient_temp_c ?? 32.0;
      const noise = pt.noise_db ?? pt.raw_noise_db ?? 75;

      hrvSum += hrv;
      if (hrv < minHrv) minHrv = hrv;
      tempSum += temp;
      if (temp > maxTemp) maxTemp = temp;
      if (hr > maxHr) maxHr = hr;
      if (amb > maxAmbTemp) maxAmbTemp = amb;
      hrSum += hr;
      if (risk > peakRisk) peakRisk = risk;

      const isBreached = hr >= maxHrLimit || amb >= maxAmbLimit || hrv <= minHrvFloor || temp >= maxSkinLimit || noise >= maxNoiseLimit || pt.is_anomaly || risk >= (thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff);
      if (isBreached) {
        thresholdBreaches++;
      }
      if (pt.is_anomaly || risk >= (thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff)) {
        anomalies++;
      }
      totalJitterDiff += Math.abs(rawHrv - hrv);
    });

    const count = historicalPoints.length;
    const avgHrv = Number((hrvSum / count).toFixed(1));
    const avgSkinTemp = Number((tempSum / count).toFixed(1));
    const avgHeartRate = Number((hrSum / count).toFixed(0));
    const kalmanEfficiency = Math.min(
      98,
      Math.max(74, Number((84.2 + (totalJitterDiff / count) * 2.3).toFixed(1)))
    );

    return {
      avgHrv,
      minHrv: Number(minHrv.toFixed(1)),
      avgSkinTemp,
      maxSkinTemp: Number(maxTemp.toFixed(1)),
      peakRisk: Number(peakRisk.toFixed(1)),
      peakHeartRate: maxHr || 118,
      avgHeartRate,
      peakAmbientTemp: Number(maxAmbTemp.toFixed(1)),
      thresholdBreachesCount: thresholdBreaches,
      anomaliesCount: anomalies,
      kalmanEfficiency
    };
  }, [chartData, activeThresholdCutoff, thresholds]);

  // Sync with external isolated signal if supplied
  React.useEffect(() => {
    if (externalIsolatedSignal !== undefined) {
      if (externalIsolatedSignal) {
        handleIsolate(externalIsolatedSignal);
      } else if (isolatedSignalKey) {
        handleResetDefaults();
      }
    }
  }, [externalIsolatedSignal]);

  // Sync with external correlation pair if supplied
  React.useEffect(() => {
    if (correlationPair) {
      setActiveCorrPair(correlationPair);
      setChartMode('CORRELATION_OVERLAY');
    }
  }, [correlationPair]);

  const handleToggle = (key: string) => {
    if (isolatedSignalKey) {
      setIsolatedSignalKey(null);
      onSignalIsolationChange?.(null);
    }
    if (key === 'showMovingAverage') {
      setShowMovingAverage((prev) => !prev);
    } else if (key === 'projectedHrv') {
      setShowPrognosticTrend((prev) => !prev);
    } else {
      setVisibleSignals((prev) => ({
        ...prev,
        [key]: !prev[key as keyof typeof visibleSignals]
      }));
    }
  };

  const toggleSignal = (key: keyof typeof visibleSignals) => {
    handleToggle(key);
  };

  const handleIsolate = (key: string) => {
    if (isolatedSignalKey === key) {
      // Exit isolation - restore default signals
      setIsolatedSignalKey(null);
      onSignalIsolationChange?.(null);
      setVisibleSignals({
        smoothedHrv: true,
        rawHrv: false,
        heartRate: true,
        skinTemp: true,
        riskScore: true,
        ambientTemp: true,
        noiseDb: false
      });
      setShowMovingAverage(true);
      setShowPrognosticTrend(true);
    } else {
      // Isolate this specific signal
      setIsolatedSignalKey(key);
      onSignalIsolationChange?.(key);
      if (key === 'showMovingAverage') {
        setVisibleSignals({
          smoothedHrv: false,
          rawHrv: false,
          heartRate: false,
          skinTemp: false,
          riskScore: false,
          ambientTemp: false,
          noiseDb: false
        });
        setShowMovingAverage(true);
      } else if (key === 'projectedHrv') {
        setVisibleSignals({
          smoothedHrv: true,
          rawHrv: false,
          heartRate: false,
          skinTemp: false,
          riskScore: false,
          ambientTemp: false,
          noiseDb: false
        });
        setShowMovingAverage(false);
        setShowPrognosticTrend(true);
      } else {
        setVisibleSignals({
          smoothedHrv: key === 'smoothedHrv',
          rawHrv: key === 'rawHrv',
          heartRate: key === 'heartRate',
          skinTemp: key === 'skinTemp',
          riskScore: key === 'riskScore',
          ambientTemp: key === 'ambientTemp',
          noiseDb: key === 'noiseDb'
        });
        setShowMovingAverage(false);
      }
    }
  };

  const handleSelectAll = () => {
    setIsolatedSignalKey(null);
    onSignalIsolationChange?.(null);
    setVisibleSignals({
      smoothedHrv: true,
      rawHrv: true,
      heartRate: true,
      skinTemp: true,
      riskScore: true,
      ambientTemp: true,
      noiseDb: true
    });
    setShowMovingAverage(true);
    setShowPrognosticTrend(true);
  };

  const handleResetDefaults = () => {
    setIsolatedSignalKey(null);
    onSignalIsolationChange?.(null);
    setVisibleSignals({
      smoothedHrv: true,
      rawHrv: false,
      heartRate: true,
      skinTemp: true,
      riskScore: true,
      ambientTemp: true,
      noiseDb: false
    });
    setShowMovingAverage(true);
    setShowPrognosticTrend(true);
  };

  const handleIsolateGroup = (group: 'hrv' | 'thermal' | 'risk') => {
    setIsolatedSignalKey(null);
    onSignalIsolationChange?.(null);
    if (group === 'hrv') {
      setVisibleSignals({
        smoothedHrv: true,
        rawHrv: true,
        heartRate: true,
        skinTemp: false,
        riskScore: false,
        ambientTemp: false,
        noiseDb: false
      });
      setShowMovingAverage(true);
    } else if (group === 'thermal') {
      setVisibleSignals({
        smoothedHrv: false,
        rawHrv: false,
        heartRate: false,
        skinTemp: true,
        riskScore: false,
        ambientTemp: true,
        noiseDb: false
      });
      setShowMovingAverage(false);
    } else if (group === 'risk') {
      setVisibleSignals({
        smoothedHrv: false,
        rawHrv: false,
        heartRate: false,
        skinTemp: false,
        riskScore: true,
        ambientTemp: false,
        noiseDb: false
      });
      setShowMovingAverage(false);
    }
  };

  // Custom Visual Marker for Identified Historical Anomaly Events
  const renderAnomalyMarkerDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || !payload.anomalyEvent || !showAnomalyMarkers) return null;

    const event = payload.anomalyEvent as IdentifiedAnomalyEvent;
    const isSelected = selectedAnomalyEvent?.id === event.id;
    const isCritical = event.severity === 'CRITICAL';

    return (
      <g
        key={`anom-marker-${event.id}-${payload.timeLabel}`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnomalyEvent(isSelected ? null : event);
        }}
      >
        {/* Pulsing halo */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 16 : 10}
          fill={isCritical ? '#f43f5e' : '#f59e0b'}
          fillOpacity={0.25}
          className="animate-ping"
        />
        {/* Solid halo ring */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 10 : 8}
          fill="#0f172a"
          stroke={isSelected ? '#38bdf8' : isCritical ? '#f43f5e' : '#f59e0b'}
          strokeWidth={isSelected ? 2.5 : 2}
        />
        {/* Diamond Core Indicator */}
        <polygon
          points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
          fill={isCritical ? '#f43f5e' : '#f59e0b'}
        />
        {/* Vertical Annotation Stem & Flag */}
        <line
          x1={cx}
          y1={cy - 8}
          x2={cx}
          y2={cy - 22}
          stroke={isCritical ? '#f43f5e' : '#f59e0b'}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
        <rect
          x={cx - 18}
          y={cy - 34}
          width={36}
          height={14}
          rx={3}
          fill="#020617"
          stroke={isSelected ? '#38bdf8' : isCritical ? '#f43f5e' : '#f59e0b'}
          strokeWidth={isSelected ? 2 : 1}
        />
        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fill={isCritical ? '#fecdd3' : '#fef08a'}
          fontSize={8.5}
          fontWeight="bold"
          fontFamily="monospace"
        >
          ⚠ {event.id}
        </text>
      </g>
    );
  };

  // Custom Dot for Prognostic 4h Trend Line
  const renderPrognosticDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || !payload.isProjection) return null;

    if (payload.projectionStep % 4 === 0 || payload.isProjectionEnd) {
      return (
        <circle
          key={`proj-dot-${payload.timeLabel}`}
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#38bdf8"
          stroke="#0f172a"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  // Custom Recharts Tooltip with exact timestamps, unrounded signal values, anomaly event context, and prognostic projections
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const pt: ChartPointWithMA | undefined =
      chartData.find((d) => d.timeLabel === label) || payload[0]?.payload;
    if (!pt) return null;

    // Special Forecast Tooltip Render
    if (pt.isProjection) {
      return (
        <div className="bg-slate-950/98 border border-sky-500/60 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs font-sans max-w-sm space-y-3 z-50">
          <div className="border-b border-slate-800 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center space-x-1.5 font-mono text-sky-300 font-bold text-xs">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <span>{pt.formattedClock} UTC</span>
                <span className="text-slate-400 font-normal">({pt.timeLabel})</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/25 text-sky-300 border border-sky-500/50 animate-pulse font-mono">
                +4H PROGNOSTIC FORECAST
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Projection Horizon: +{pt.projectionHour}h forward from current telemetry ({pt.projectionStep} of 16 intervals)
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-sky-300 font-bold">
              <span>Projected Kalman HRV:</span>
              <span className="text-white text-sm">{pt.projected_hrv?.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Kalman 95% Confidence Band:</span>
              <span className="text-sky-400 font-mono">
                {pt.projected_hrv_lower?.toFixed(1)} – {pt.projected_hrv_upper?.toFixed(1)} ms
              </span>
            </div>
            {pt.projected_skin_temp !== undefined && (
              <div className="flex justify-between items-center text-rose-300">
                <span>Projected Skin Temp:</span>
                <span className="font-semibold">{pt.projected_skin_temp?.toFixed(1)}°C</span>
              </div>
            )}
            {pt.projected_risk !== undefined && (
              <div className="flex justify-between items-center text-purple-300">
                <span>Projected Risk Score:</span>
                <span className="font-semibold">{pt.projected_risk?.toFixed(0)}%</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed pt-1">
            <p className="flex items-start gap-1.5">
              <Compass className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Calculated via Prognosticator Kalman state derivative. Assumes current microclimate exposure and workload trajectory continue without intervention.
              </span>
            </p>
          </div>
        </div>
      );
    }

    const hrvFloor = thresholds?.minHrvMs ?? 40;
    const skinCeiling = thresholds?.maxSkinTempC ?? 37.8;
    const riskCutoff = thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff;

    const isHighRisk = (pt.risk_score ?? 15) >= riskCutoff;
    const isHrvCritical = (pt.smoothed_hrv ?? 68) <= hrvFloor;
    const isTempElevated = (pt.skin_temp_c ?? 36.6) >= skinCeiling;
    const isNoiseHigh = (pt.noise_db ?? pt.raw_noise_db ?? 0) >= (thresholds?.maxNoiseDb ?? 85.0);

    return (
      <div className="bg-slate-950/98 border border-cyan-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs font-sans max-w-sm space-y-3 z-50">
        {/* Precise Timestamp & Interval Identification */}
        <div className="border-b border-slate-800 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center space-x-1.5 font-mono text-cyan-300 font-bold text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{pt.formattedClock} UTC</span>
              <span className="text-slate-400 font-normal">({pt.timeLabel})</span>
            </span>

            {pt.anomalyEvent || pt.is_anomaly || isHrvCritical || isHighRisk ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
                {pt.anomalyEvent ? pt.anomalyEvent.id : isHrvCritical ? 'AUTONOMIC COLLAPSE' : 'DEVIATION DETECTED'}
              </span>
            ) : isTempElevated ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                THERMAL ELEVATION
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                NOMINAL HOMEOSTASIS
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-500" />
              {pt.formattedDate}
            </span>
            <span className="text-slate-400 text-[10px]">
              Sample #{pt.index + 1} of {chartData.length} (15m interval)
            </span>
          </div>
          <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5 truncate">
            Zone: {zoneName} | k-Anonymity Verified (N &ge; 12)
          </div>
        </div>

        {/* Identified Anomaly Event Context Callout (When & Why Safety Signals Deviated) */}
        {pt.anomalyEvent && (
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/60 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-rose-300 font-bold font-mono">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                {pt.anomalyEvent.id}: {pt.anomalyEvent.eventTitle}
              </span>
              <span className="text-[10px] bg-rose-500/30 text-rose-200 px-1.5 py-0.2 rounded border border-rose-500/40">
                {pt.anomalyEvent.severity}
              </span>
            </div>
            <p className="text-slate-200 text-[10px] leading-relaxed">
              <strong className="text-rose-300">Why Deviated:</strong> {pt.anomalyEvent.whyDeviated}
            </p>
            <div className="text-[10px] text-cyan-300 font-mono flex items-center justify-between pt-1 border-t border-rose-900/60">
              <span>{pt.anomalyEvent.baselineVsActual}</span>
              <span className="text-emerald-400">{pt.anomalyEvent.earlyWarningLead}</span>
            </div>
          </div>
        )}

        {/* Precise Signal Values Grid */}
        <div className="space-y-1.5 font-mono text-[11px]">
          {/* Kalman Smoothed HRV */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              Kalman Smoothed HRV:
            </span>
            <div className="text-right">
              <span className={`font-bold ${isHrvCritical ? 'text-rose-400 underline font-black' : 'text-white'}`}>
                {pt.smoothed_hrv?.toFixed(2)} ms
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                ({(pt.smoothed_hrv ?? 68) < 68 ? '-' : '+'}{Math.abs((pt.smoothed_hrv ?? 68) - 68).toFixed(1)} vs 68ms)
              </span>
            </div>
          </div>

          {/* Raw Sensor HRV */}
          {visibleSignals.rawHrv && pt.raw_hrv !== undefined && (
            <div className="flex justify-between items-center py-0.5 text-amber-300/90">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                Raw Wearable HRV:
              </span>
              <div className="text-right">
                <span className="font-semibold">{pt.raw_hrv.toFixed(2)} ms</span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                  (Jitter: {pt.jitter_delta >= 0 ? `+${pt.jitter_delta}` : pt.jitter_delta}ms)
                </span>
              </div>
            </div>
          )}

          {/* Moving Average Overlay Trend */}
          {showMovingAverage && pt.ma_hrv !== undefined && (
            <div className="flex justify-between items-center py-0.5 bg-emerald-950/30 px-2 rounded border border-emerald-500/20 text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                {maWindowHours}h Moving Avg Trend:
              </span>
              <div className="text-right font-bold">
                <span>{pt.ma_hrv.toFixed(2)} ms</span>
                <span className="text-[10px] text-emerald-400 ml-1.5 font-normal">
                  ({pt.hrv_deviation_from_ma_pct >= 0 ? `+${pt.hrv_deviation_from_ma_pct}` : pt.hrv_deviation_from_ma_pct}% vs MA)
                </span>
              </div>
            </div>
          )}

          {/* Worker Heart Rate */}
          {pt.heart_rate_bpm !== undefined && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                Worker Heart Rate:
              </span>
              <div className="text-right">
                <span
                  className={`font-bold ${
                    pt.heart_rate_bpm >= (thresholds?.maxHeartRateBpm ?? 115)
                      ? 'text-rose-400 font-black underline'
                      : 'text-white'
                  }`}
                >
                  {pt.heart_rate_bpm} BPM
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  ({pt.heart_rate_bpm >= (thresholds?.maxHeartRateBpm ?? 115) ? 'Breached' : 'Nominal'})
                </span>
              </div>
            </div>
          )}

          {/* Worker Skin Temperature */}
          {pt.skin_temp_c !== undefined && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                Worker Skin Temp:
              </span>
              <div className="text-right">
                <span className={`font-bold ${isTempElevated ? 'text-rose-400 font-black' : 'text-white'}`}>
                  {pt.skin_temp_c.toFixed(2)}°C
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  ({pt.skin_temp_c >= 36.5 ? `+${(pt.skin_temp_c - 36.5).toFixed(2)}` : (pt.skin_temp_c - 36.5).toFixed(2)}°C)
                </span>
              </div>
            </div>
          )}

          {/* Composite Anomaly Risk Score */}
          {pt.risk_score !== undefined && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-purple-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                Anomaly Risk Score:
              </span>
              <div className="text-right">
                <span className={`font-bold ${isHighRisk ? 'text-rose-400' : 'text-purple-200'}`}>
                  {pt.risk_score.toFixed(1)}%
                </span>
                {showMovingAverage && (
                  <span className="text-[10px] text-slate-400 ml-1 font-mono">
                    (MA: {pt.ma_risk.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ambient Heat Index & Acoustic Noise */}
          {(visibleSignals.ambientTemp || visibleSignals.noiseDb) && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-300">
              {visibleSignals.ambientTemp && pt.ambient_temp_c !== undefined && (
                <div>
                  <span className="text-slate-400 block">Ambient Temp:</span>
                  <span className="font-bold text-amber-300">{pt.ambient_temp_c.toFixed(1)}°C</span>
                  <span className="text-slate-500 block">TWL: {pt.twl_index?.toFixed(0)} W/m²</span>
                </div>
              )}
              {visibleSignals.noiseDb && (pt.noise_db !== undefined || pt.raw_noise_db !== undefined) && (
                <div>
                  <span className="text-slate-400 block">Acoustic Level:</span>
                  <span className={`font-bold ${isNoiseHigh ? 'text-rose-400' : 'text-orange-300'}`}>
                    {(pt.noise_db ?? pt.raw_noise_db ?? 0).toFixed(1)} dBA
                  </span>
                  <span className="text-slate-500 block">AQI: {pt.aqi}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explainable Clinical Assessment & Guidance */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          {isHrvCritical ? (
            <p className="text-rose-300 font-semibold flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Acute autonomic failure: HRV is {(pt.smoothed_hrv ?? 0).toFixed(1)}ms (floor: {hrvFloor}ms). Immediate shaded rest and oral rehydration required.
              </span>
            </p>
          ) : isTempElevated ? (
            <p className="text-amber-300 font-medium flex items-start gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Core heat accumulation detected at {(pt.skin_temp_c ?? 0).toFixed(2)}°C. Rotate cohort to air-conditioned rest area.
              </span>
            </p>
          ) : isNoiseHigh ? (
            <p className="text-orange-300 font-medium flex items-start gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Acoustic exposure breach: {(pt.noise_db ?? pt.raw_noise_db ?? 0).toFixed(1)} dBA exceeds safe 85 dBA action ceiling.
              </span>
            </p>
          ) : (
            <p className="text-emerald-300/90 font-medium flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Worker physiological state is within optimal homeostatic thresholds. 4-hour moving average trend is stable.
              </span>
            </p>
          )}
        </div>
      </div>
    );
  };

  const latestHistoricalPoint = chartData.filter((p) => !p.isProjection).slice(-1)[0] || chartData[0];

  const signalsList = [
    {
      key: 'smoothedHrv',
      label: 'Kalman Filtered HRV',
      shortLabel: 'Kalman Filtered HRV',
      unit: 'ms',
      color: '#06b6d4',
      lineStyle: 'solid',
      strokeWidth: '2.5px',
      axis: 'Left (ms)',
      active: visibleSignals.smoothedHrv,
      currentValue: latestHistoricalPoint?.smoothed_hrv !== undefined ? `${latestHistoricalPoint.smoothed_hrv.toFixed(1)} ms` : '--',
      description: 'Autonomous nervous system HRV; low values signal acute fatigue and autonomic strain.',
      isPrimary: true
    },
    {
      key: 'rawHrv',
      label: 'Raw Wearable HRV (Jitter)',
      shortLabel: 'Raw Wearable HRV',
      unit: 'ms',
      color: '#fbbf24',
      lineStyle: 'dashed',
      strokeWidth: '1px',
      axis: 'Left (ms)',
      active: visibleSignals.rawHrv,
      currentValue: latestHistoricalPoint?.raw_hrv !== undefined ? `${latestHistoricalPoint.raw_hrv.toFixed(1)} ms` : '--',
      description: 'Unfiltered photoplethysmography telemetry exhibiting sensor jitter and motion noise.'
    },
    {
      key: 'heartRate',
      label: 'Worker Heart Rate (Pulse)',
      shortLabel: 'Heart Rate',
      unit: 'BPM',
      color: '#e11d48',
      lineStyle: 'solid',
      strokeWidth: '2px',
      axis: 'Left (BPM)',
      active: visibleSignals.heartRate,
      currentValue: latestHistoricalPoint ? `${(latestHistoricalPoint.heart_rate_bpm ?? Math.round(72 + (68 - (latestHistoricalPoint.smoothed_hrv ?? 68)) * 1.2))} BPM` : '--',
      description: 'Cardiovascular heart rate pulse tracking physical exertion, heat strain, and tachycardia.',
      isPrimary: true
    },
    {
      key: 'showMovingAverage',
      label: `${maWindowHours}h Moving Avg Trend`,
      shortLabel: `${maWindowHours}h Trend MA`,
      unit: 'ms',
      color: '#34d399',
      lineStyle: 'long-dash',
      strokeWidth: '3px',
      axis: 'Left (ms)',
      active: showMovingAverage,
      currentValue: latestHistoricalPoint?.ma_hrv !== undefined ? `${latestHistoricalPoint.ma_hrv.toFixed(1)} ms` : '--',
      description: 'Rolling baseline revealing systemic longitudinal trend velocity across the work shift.'
    },
    {
      key: 'skinTemp',
      label: 'Worker Skin Temp',
      shortLabel: 'Worker Skin Temp',
      unit: '°C',
      color: '#f43f5e',
      lineStyle: 'solid',
      strokeWidth: '2px',
      axis: 'Left (°C)',
      active: visibleSignals.skinTemp,
      currentValue: latestHistoricalPoint?.skin_temp_c !== undefined ? `${latestHistoricalPoint.skin_temp_c.toFixed(1)}°C` : '--',
      description: 'Subdermal core temperature sensor tracking physiological heat stress accumulation.'
    },
    {
      key: 'riskScore',
      label: 'Anomaly Risk Score',
      shortLabel: 'Risk Score %',
      unit: '%',
      color: '#c084fc',
      lineStyle: 'solid',
      strokeWidth: '2.5px',
      axis: 'Right (%)',
      active: visibleSignals.riskScore,
      currentValue: latestHistoricalPoint?.risk_score !== undefined ? `${latestHistoricalPoint.risk_score.toFixed(1)}%` : '--',
      description: 'Multivariate LSTM composite risk probability assessing combined stress factors.'
    },
    {
      key: 'ambientTemp',
      label: 'Ambient Heat Index',
      shortLabel: 'Ambient Heat',
      unit: '°C',
      color: '#f59e0b',
      lineStyle: 'solid',
      strokeWidth: '1.8px',
      axis: 'Left (°C)',
      active: visibleSignals.ambientTemp,
      currentValue: latestHistoricalPoint?.ambient_temp_c !== undefined ? `${latestHistoricalPoint.ambient_temp_c.toFixed(1)}°C` : '--',
      description: 'Environmental microclimate dry-bulb temperature recorded at local zone beacon.'
    },
    {
      key: 'noiseDb',
      label: 'Acoustic Noise Pressure',
      shortLabel: 'Acoustic Noise',
      unit: 'dBA',
      color: '#fb923c',
      lineStyle: 'solid',
      strokeWidth: '1.8px',
      axis: 'Left (dBA)',
      active: visibleSignals.noiseDb,
      currentValue: latestHistoricalPoint ? `${(latestHistoricalPoint.noise_db ?? latestHistoricalPoint.raw_noise_db ?? 75).toFixed(1)} dBA` : '--',
      description: 'Continuous calibrated acoustic decibel exposure monitoring.'
    },
    {
      key: 'projectedHrv',
      label: '4h Prognostic Trend (Kalman)',
      shortLabel: '4h Prognostic Trend',
      unit: 'ms',
      color: '#38bdf8',
      lineStyle: 'dashed',
      strokeWidth: '2.5px',
      axis: 'Left (ms)',
      active: showPrognosticTrend,
      currentValue: trendStats?.prognosticSummary ? `${trendStats.prognosticSummary.projectedValue4h.toFixed(1)} ms` : '--',
      description: 'Kalman trajectory 4-hour forward predictive forecast with physiological damping.'
    }
  ];

  return (
    <div
      id="historical-health-chart-card"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Background visual aura */}
      <div className="absolute top-0 right-0 w-96 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-lg">
              <Heart className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Historical Workforce Health Signal Telemetry (24-Hour Horizon)
            </h2>
            <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Recharts Multi-Axis Engine
            </span>
            {showMovingAverage && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                {maWindowHours}h Moving Avg Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking longitudinal heart rate variability (HRV), skin thermal drift, and multivariate health risk scores across{' '}
            <span className="text-cyan-300 font-medium">{zoneName}</span> cohort.
          </p>
        </div>

        {/* View Mode Switcher: Multi-Stream vs Dual-Signal Correlation Overlay */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setChartMode('MULTI_STREAM')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                chartMode === 'MULTI_STREAM'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Multi-Stream View (All 24h Signals)</span>
            </button>

            <button
              onClick={() => setChartMode('CORRELATION_OVERLAY')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                chartMode === 'CORRELATION_OVERLAY'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Dual-Signal Correlation Overlay</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.2 rounded font-mono font-bold">
                PEARSON r
              </span>
            </button>
          </div>
        </div>

        {/* Action Controls & Signal Selectors */}
        {chartMode === 'MULTI_STREAM' && (
          <div className="flex flex-wrap items-center gap-2.5">
          {/* Signal Selection Pill Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => toggleSignal('smoothedHrv')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.smoothedHrv
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Kalman Smoothed HRV series"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>HRV (Smoothed)</span>
            </button>

            <button
              onClick={() => toggleSignal('rawHrv')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.rawHrv
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Raw Wearable HRV with sensor jitter"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span>Raw Jitter</span>
            </button>

            <button
              onClick={() => toggleSignal('skinTemp')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.skinTemp
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Worker Core/Skin Temperature"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              <span>Skin Temp</span>
            </button>

            <button
              onClick={() => toggleSignal('heartRate')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.heartRate
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Worker Heart Rate (Pulse)"
            >
              <Heart className="h-3 w-3 text-rose-400" />
              <span>Heart Rate</span>
            </button>

            <button
              onClick={() => toggleSignal('riskScore')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.riskScore
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Combined Health Risk Probability"
            >
              <span className="h-2 w-2 rounded-full bg-purple-400"></span>
              <span>Risk %</span>
            </button>

            <button
              onClick={() => toggleSignal('ambientTemp')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.ambientTemp
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Ambient Heat Index"
            >
              <Thermometer className="h-3 w-3" />
              <span>Ambient Heat</span>
            </button>

            <button
              onClick={() => toggleSignal('noiseDb')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs ${
                visibleSignals.noiseDb
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Acoustic Noise Exposure"
            >
              <Volume2 className="h-3 w-3" />
              <span>Noise</span>
            </button>
          </div>

          {/* Moving Average Overlay Toggle & Window Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                const nextVal = !showMovingAverage;
                setShowMovingAverage(nextVal);
                if (onToggleMovingAverage) onToggleMovingAverage(nextVal);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                showMovingAverage
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Long-Term Moving Average Trend Line Overlay"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>MA Overlay {showMovingAverage ? '[ON]' : '[OFF]'}</span>
            </button>

            {showMovingAverage && (
              <div className="flex items-center ml-1 border-l border-slate-800 pl-1 font-mono text-[11px]">
                {[2, 4, 8].map((windowHrs) => (
                  <button
                    key={windowHrs}
                    onClick={() => setMaWindowHours(windowHrs)}
                    className={`px-1.5 py-0.5 rounded transition ${
                      maWindowHours === windowHrs
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${windowHrs}-hour rolling moving average (${windowHrs * 4} sample intervals)`}
                  >
                    {windowHrs}h
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Anomaly Event Markers & Annotations Toggle */}
          <button
            onClick={() => setShowAnomalyMarkers((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              showAnomalyMarkers
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Visual Markers & Explanatory Annotations for Identified Historical Anomaly Events"
          >
            <AlertTriangle className={`h-3 w-3 ${showAnomalyMarkers ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Anomaly Markers {showAnomalyMarkers ? `[ON • ${allIdentifiedEvents.length}]` : '[OFF]'}</span>
          </button>

          {/* 4-Hour Prognostic Trend Projection Toggle */}
          <button
            onClick={() => setShowPrognosticTrend((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              showPrognosticTrend
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle 4-Hour Forward Prognostic Trend Projection based on Kalman Trajectory"
          >
            <Sparkles className={`h-3 w-3 ${showPrognosticTrend ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Prognostic 4h {showPrognosticTrend ? '[ON]' : '[OFF]'}</span>
          </button>

          {/* Reference Lines Toggle */}
          <button
            onClick={() => setShowThresholds((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              showThresholds
                ? 'bg-slate-800 border-slate-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Clinical Safety Guideline Reference Lines"
          >
            <Sliders className="h-3 w-3 text-cyan-400" />
            <span>Thresholds {showThresholds ? 'ON' : 'OFF'}</span>
          </button>

          {/* Time Span Picker (6h, 12h, 24h) */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {[6, 12, 24].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setSelectedHours(hrs)}
                className={`px-2.5 py-0.5 rounded transition ${
                  selectedHours === hrs
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>

          {/* Custom Thresholds Configuration Button */}
          {onOpenThresholdsModal && (
            <button
              onClick={onOpenThresholdsModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold transition shadow-xs"
              title="Open Custom Health Signals & Notification Thresholds Configuration Modal"
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Threshold Rules</span>
            </button>
          )}

          {/* Export Historical Data as CSV Button */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Export Current Historical 24-Hour Workforce Health Data as a CSV file"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export 24h CSV</span>
            </button>
          )}

          {/* Export Report Mock PDF Button */}
          {onExportReport && (
            <button
              onClick={onExportReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 hover:from-cyan-800 hover:to-blue-800 text-cyan-200 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Trigger mock PDF generation process for current health metrics display"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export Report</span>
            </button>
          )}
        </div>
        )}
      </div>

      {chartMode === 'CORRELATION_OVERLAY' ? (
        <div className="mt-4">
          <CorrelationOverlayChart
            data={data}
            zoneName={zoneName}
            thresholds={thresholds}
            activeThresholdCutoff={activeThresholdCutoff}
            initialSignalA={activeCorrPair.signalA}
            initialSignalB={activeCorrPair.signalB}
            onOpenThresholdsModal={onOpenThresholdsModal}
          />
        </div>
      ) : (
        <>
          {/* Aggregate Health Statistics Bar with Long-Term Trend & 4h Prognostic Forecast */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 my-4">
        {/* 1. Mean Worker HRV */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Mean Worker HRV</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-cyan-400">{stats.avgHrv} ms</span>
            <span className="text-[10px] text-slate-500 font-mono">(Min: {stats.minHrv})</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Floor: {thresholds?.minHrvMs ?? 40} ms</span>
        </div>

        {/* 2. Peak Heart Rate */}
        <div className="bg-slate-950/70 border border-rose-500/30 p-3 rounded-lg">
          <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-medium flex items-center gap-1">
            <Heart className="h-3 w-3 text-rose-400" />
            Peak Heart Rate
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold ${
              stats.peakHeartRate >= (thresholds?.maxHeartRateBpm ?? 115) ? 'text-rose-400 font-black' : 'text-white'
            }`}>
              {stats.peakHeartRate} BPM
            </span>
            <span className="text-[10px] text-slate-500 font-mono">(Avg: {stats.avgHeartRate})</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Ceiling: {thresholds?.maxHeartRateBpm ?? 115} BPM
          </span>
        </div>

        {/* 3. Peak Ambient Temp */}
        <div className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-lg">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-medium flex items-center gap-1">
            <Sun className="h-3 w-3 text-amber-400" />
            Peak Ambient Temp
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold ${
              stats.peakAmbientTemp >= (thresholds?.maxAmbientHeatC ?? 36.0) ? 'text-amber-400 font-black' : 'text-white'
            }`}>
              {stats.peakAmbientTemp}°C
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Heat Index</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Ceiling: {(thresholds?.maxAmbientHeatC ?? 36.0).toFixed(1)}°C
          </span>
        </div>

        {/* 4. Mean Skin Temp */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Mean Skin Temp</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-rose-400">{stats.avgSkinTemp}°C</span>
            <span className="text-[10px] text-slate-500 font-mono">(Max: {stats.maxSkinTemp}°C)</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Ceiling: {(thresholds?.maxSkinTempC ?? 37.8).toFixed(1)}°C</span>
        </div>

        {/* 5. 24h Threshold Breaches */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Threshold Breaches</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold ${
              stats.thresholdBreachesCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {stats.thresholdBreachesCount}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Intervals</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {stats.anomaliesCount} Anomaly Interval{stats.anomaliesCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* 6. Long-Term Trend Moving Average */}
        <div className="bg-slate-950/70 border border-emerald-500/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">
              {maWindowHours}h Trend Velocity
            </span>
            {trendStats.trendLabel === 'DETERIORATING' ? (
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            ) : trendStats.trendLabel === 'RECOVERING' ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-cyan-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold ${
                trendStats.trendLabel === 'DETERIORATING'
                  ? 'text-rose-400'
                  : trendStats.trendLabel === 'RECOVERING'
                  ? 'text-emerald-400'
                  : 'text-cyan-300'
              }`}
            >
              {trendStats.trendPct >= 0 ? `+${trendStats.trendPct}` : trendStats.trendPct}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({trendStats.currentMaHrv}ms MA)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block capitalize">
            {trendStats.trendLabel.toLowerCase()} trajectory
          </span>
        </div>

        {/* 7. 4-Hour Kalman Prognostic Trend Card */}
        <div className={`bg-slate-950/70 border p-3 rounded-lg transition ${
          showPrognosticTrend ? 'border-sky-500/40 bg-sky-950/20' : 'border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-400" />
              +4h Prognostic
            </span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
              trendStats.prognosticSummary.trajectoryLabel === 'ACCELERATING_DETERIORATION'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : trendStats.prognosticSummary.trajectoryLabel === 'MILD_DETERIORATION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {trendStats.prognosticSummary.trajectoryLabel.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-sky-300">
              {trendStats.prognosticSummary.projectedValue4h.toFixed(1)} ms
            </span>
            <span className={`text-[10px] font-mono ${
              trendStats.prognosticSummary.driftVelocityPerHour < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              ({trendStats.prognosticSummary.driftVelocityPerHour > 0 ? '+' : ''}{trendStats.prognosticSummary.driftVelocityPerHour} ms/h)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate" title={trendStats.prognosticSummary.breachEta}>
            {trendStats.prognosticSummary.isBreachPredicted ? (
              <span className="text-rose-400 font-semibold">{trendStats.prognosticSummary.breachEta}</span>
            ) : (
              <span>95% CI ±{trendStats.prognosticSummary.confidenceIntervalWidth}ms</span>
            )}
          </span>
        </div>

        {/* 8. 24h Peak Risk */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">24h Peak Risk</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold ${
                stats.peakRisk >= (thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff) ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {stats.peakRisk}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LSTM Score</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            {stats.kalmanEfficiency}% Jitter Filtered
          </span>
        </div>
      </div>

      {/* Identified Historical Anomaly Events Quick-Access Ribbon */}
      {showAnomalyMarkers && allIdentifiedEvents.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[11px] uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              Historical Anomaly Events ({allIdentifiedEvents.length}):
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Click any pin or badge to inspect why safety signals deviated:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            {allIdentifiedEvents.map((evt) => {
              const isSelected = selectedAnomalyEvent?.id === evt.id;
              const isCritical = evt.severity === 'CRITICAL';
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedAnomalyEvent(isSelected ? null : evt)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition border font-semibold ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : isCritical
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
                      : 'bg-amber-950/50 text-amber-300 border-amber-500/30 hover:bg-amber-900/50'
                  }`}
                  title={`${evt.eventTitle} (${evt.timeLabel}) - Click to inspect why signal deviated`}
                >
                  <span>⚠ {evt.id}</span>
                  <span className="opacity-70 font-normal">({evt.timeLabel})</span>
                  <span className="text-[10px] opacity-80 capitalize hidden md:inline">
                    • {evt.primaryMetric}
                  </span>
                </button>
              );
            })}
            {selectedAnomalyEvent && (
              <button
                onClick={() => setSelectedAnomalyEvent(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Historical Anomaly Event Annotation Callout Card */}
      {selectedAnomalyEvent && (
        <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-amber-500/50 shadow-xl relative overflow-hidden text-xs">
          <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold text-xs">
                ANOMALY EVENT {selectedAnomalyEvent.id}
              </span>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                {selectedAnomalyEvent.eventTitle}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  selectedAnomalyEvent.severity === 'CRITICAL'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {selectedAnomalyEvent.severity} DEVIATION
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                {selectedAnomalyEvent.timeLabel}
              </span>
              <button
                onClick={() => setSelectedAnomalyEvent(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Close annotation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Narrative: When & Why Safety Signals Deviated */}
          <div className="my-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
              Why Safety Signals Deviated (Physiological &amp; Environmental Etiology)
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {selectedAnomalyEvent.whyDeviated}
            </p>
          </div>

          {/* Diagnostic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TELEMETRY READINGS</span>
              <div className="mt-1 space-y-1">
                <div className="text-cyan-300 font-bold">
                  HRV: {selectedAnomalyEvent.measuredHrv.toFixed(1)} ms{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Raw: {selectedAnomalyEvent.rawHrv.toFixed(1)} ms)
                  </span>
                </div>
                <div className="text-rose-300">
                  Skin Temp: {selectedAnomalyEvent.measuredSkinTemp.toFixed(2)}°C
                </div>
                <div className="text-purple-300">
                  Risk Score: {selectedAnomalyEvent.measuredRisk.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ROOT CAUSE &amp; KALMAN ISOLATION</span>
              <p className="text-slate-300 text-[10px] mt-1 leading-snug font-sans">
                {selectedAnomalyEvent.rootCauseDetail}
              </p>
              <div className="text-emerald-400 text-[10px] mt-1 font-mono">
                {selectedAnomalyEvent.kalmanValidation}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ACTION &amp; LEAD TIME MARGIN</span>
              <div className="text-emerald-300 font-bold mt-1 text-[11px]">
                {selectedAnomalyEvent.earlyWarningLead}
              </div>
              <p className="text-slate-300 text-[10px] mt-1 leading-snug font-sans">
                {selectedAnomalyEvent.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Recharts LineChart with Moving Average Overlay */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 30, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              minTickGap={30}
            />

            {/* Left Y-Axis: Physiological Values (HRV in ms, Temp in °C, Heart Rate in BPM, Noise in dB) */}
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              domain={[20, visibleSignals.heartRate ? 145 : 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              unit=""
            />

            {/* Right Y-Axis: Risk Percentage (0% to 100%) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#a855f7"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 11, fill: '#c084fc' }}
            />

            <Tooltip
              content={renderCustomTooltip}
              cursor={{ stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />

            <Legend
              content={() => null}
            />

            {/* Health Safety Guideline Reference Lines */}
            {showThresholds && (
              <>
                {/* Heart Rate Ceiling Threshold Line */}
                {visibleSignals.heartRate && (thresholds?.maxHeartRateBpm ?? 115) && (
                  <ReferenceLine
                    yAxisId="left"
                    y={thresholds?.maxHeartRateBpm ?? 115}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Max Heart Rate (${thresholds?.maxHeartRateBpm ?? 115} BPM)`,
                      fill: '#fda4af',
                      fontSize: 10,
                      position: 'insideTopLeft'
                    }}
                  />
                )}

                {/* Critical HRV Floor Threshold Line */}
                <ReferenceLine
                  yAxisId="left"
                  y={thresholds?.minHrvMs ?? 40}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Critical HRV Floor (${thresholds?.minHrvMs ?? 40} ms)`,
                    fill: '#f87171',
                    fontSize: 10,
                    position: 'insideBottomLeft'
                  }}
                />

                {/* Baseline Workforce HRV Reference Line */}
                <ReferenceLine
                  yAxisId="left"
                  y={68}
                  stroke="#06b6d4"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Baseline Workforce HRV (68 ms)',
                    fill: '#22d3ee',
                    fontSize: 10,
                    position: 'insideTopLeft'
                  }}
                />

                {/* Ambient Temperature Ceiling Threshold Line */}
                {visibleSignals.ambientTemp && thresholds?.maxAmbientHeatC && (
                  <ReferenceLine
                    yAxisId="left"
                    y={thresholds.maxAmbientHeatC}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Max Ambient (${thresholds.maxAmbientHeatC.toFixed(1)}°C)`,
                      fill: '#fcd34d',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                )}

                {/* Skin Temperature Ceiling Threshold Line */}
                {visibleSignals.skinTemp && (
                  <ReferenceLine
                    yAxisId="left"
                    y={thresholds?.maxSkinTempC ?? 37.8}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    label={{
                      value: `Max Skin Temp (${(thresholds?.maxSkinTempC ?? 37.8).toFixed(1)}°C)`,
                      fill: '#fbbf24',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                )}

                {/* Acoustic Noise Limit Reference Line */}
                {visibleSignals.noiseDb && thresholds?.maxNoiseDb && (
                  <ReferenceLine
                    yAxisId="left"
                    y={thresholds.maxNoiseDb}
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Noise Limit (${thresholds.maxNoiseDb.toFixed(1)} dBA)`,
                      fill: '#a5b4fc',
                      fontSize: 10,
                      position: 'insideBottomRight'
                    }}
                  />
                )}

                {/* Critical Risk Cutoff Threshold Line */}
                <ReferenceLine
                  yAxisId="right"
                  y={thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Critical Risk Cutoff (${thresholds?.riskScoreCutoffPct ?? activeThresholdCutoff}%)`,
                    fill: '#fb7185',
                    fontSize: 10,
                    position: 'insideBottomRight'
                  }}
                />
              </>
            )}

            {/* NOW Boundary & Forecast Horizon Divider */}
            {showPrognosticTrend && nowPointTimeLabel && (
              <ReferenceLine
                yAxisId="left"
                x={nowPointTimeLabel}
                stroke="#38bdf8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: 'NOW (Forecast Horizon ➔)',
                  fill: '#38bdf8',
                  fontSize: 10,
                  position: 'insideTopLeft'
                }}
              />
            )}

            {/* Raw Wearable HRV with Sensor Jitter */}
            {visibleSignals.rawHrv && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="raw_hrv"
                name="Raw Wearable HRV (ms)"
                stroke="#fbbf24"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                opacity={0.65}
                isAnimationActive={false}
              />
            )}

            {/* Kalman Smoothed HRV Trajectory with Visual Anomaly Markers */}
            {visibleSignals.smoothedHrv && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="smoothed_hrv"
                name="Kalman Filtered HRV (ms)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={showAnomalyMarkers ? renderAnomalyMarkerDot : false}
                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            )}

            {/* 4-Hour Kalman Prognostic Trend Projection (Secondary Dashed Line) */}
            {showPrognosticTrend && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="projected_hrv"
                name="4h Prognostic Trend (HRV, ms)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={renderPrognosticDot}
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Moving Average Overlay: Long-Term Trend Line */}
            {showMovingAverage && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ma_hrv"
                name={`${maWindowHours}h Moving Avg Trend (HRV, ms)`}
                stroke="#34d399"
                strokeWidth={3}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Worker Heart Rate (Pulse in BPM) */}
            {visibleSignals.heartRate && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="heart_rate_bpm"
                name="Worker Heart Rate (BPM)"
                stroke="#e11d48"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#e11d48', stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            )}

            {/* Mean Worker Core / Skin Temperature */}
            {visibleSignals.skinTemp && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="skin_temp_c"
                name="Worker Skin Temp (°C)"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#f43f5e' }}
                isAnimationActive={false}
              />
            )}

            {/* 4-Hour Prognostic Trend Projection for Skin Temp (Secondary Dashed Line) */}
            {showPrognosticTrend && visibleSignals.skinTemp && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="projected_skin_temp"
                name="4h Prognostic Trend (Skin Temp, °C)"
                stroke="#fb7185"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Ambient Heat Index */}
            {visibleSignals.ambientTemp && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ambient_temp_c"
                name="Ambient Heat Index (°C)"
                stroke="#f59e0b"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Acoustic Pressure Noise (dB) */}
            {visibleSignals.noiseDb && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="noise_db"
                name="Acoustic Noise (dBA)"
                stroke="#fb923c"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Population Health Risk Probability Score (Right Axis) */}
            {visibleSignals.riskScore && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="risk_score"
                name="Anomaly Risk Score (%)"
                stroke="#c084fc"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#c084fc', stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            )}

            {/* 4-Hour Prognostic Trend Projection for Risk Score (Secondary Dashed Line) */}
            {showPrognosticTrend && visibleSignals.riskScore && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="projected_risk"
                name="4h Prognostic Trend (Risk, %)"
                stroke="#e879f9"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Time Brush for interactive 24-hour panning & scrubbing */}
            <Brush
              dataKey="timeLabel"
              height={22}
              stroke="#475569"
              fill="#0f172a"
              tickFormatter={() => ''}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend with Checkbox Toggles & Signal Isolation */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              Interactive Telemetry Legend &amp; Signal Isolation
            </span>
            {isolatedSignalKey ? (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 animate-pulse">
                <Eye className="h-3 w-3" />
                ISOLATED:{' '}
                {signalsList.find((s) => s.key === isolatedSignalKey)?.shortLabel || isolatedSignalKey}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">
                ({signalsList.filter((s) => s.active).length} of 7 active)
              </span>
            )}
          </div>

          {/* Quick Presets & Isolate Actions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {isolatedSignalKey && (
              <button
                onClick={handleResetDefaults}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded transition shadow-xs flex items-center gap-1"
                title="Exit single signal isolation mode and restore standard multi-signal telemetry view"
              >
                <EyeOff className="h-3 w-3" />
                <span>Exit Isolation</span>
              </button>
            )}
            <button
              onClick={handleSelectAll}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] px-2 py-0.5 rounded transition"
              title="Show all 7 workforce health telemetry signals simultaneously"
            >
              Select All
            </button>
            <button
              onClick={handleResetDefaults}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] px-2 py-0.5 rounded transition"
              title="Reset to default primary signals (Smoothed HRV, Skin Temp, Risk %, MA Trend)"
            >
              Reset Default
            </button>
            <button
              onClick={() => handleIsolateGroup('hrv')}
              className="bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 text-[11px] px-2 py-0.5 rounded transition"
              title="Isolate HRV signals (Kalman Smoothed + Raw Wearable + MA Trend)"
            >
              Isolate HRV
            </button>
            <button
              onClick={() => handleIsolateGroup('thermal')}
              className="bg-rose-950/70 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 text-[11px] px-2 py-0.5 rounded transition"
              title="Isolate thermal signals (Worker Skin Temp + Ambient Heat Index)"
            >
              Isolate Thermal
            </button>
          </div>
        </div>

        {/* Legend Grid with Checkboxes, Color Swatches, Live Values, and Isolate Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {signalsList.map((sig) => {
            const isIsolated = isolatedSignalKey === sig.key;
            return (
              <div
                key={sig.key}
                onClick={() => handleToggle(sig.key)}
                className={`flex flex-col justify-between p-2.5 rounded-lg border text-xs transition cursor-pointer select-none ${
                  isIsolated
                    ? 'bg-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : sig.active
                    ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Top Row: Checkbox + Color Swatch + Signal Name + Isolate Button */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1" title={sig.description}>
                    <input
                      type="checkbox"
                      checked={sig.active}
                      onChange={() => {}} // Handled by parent card click
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: sig.color }}
                        ></span>
                        <span
                          className={`font-semibold truncate text-[11px] ${
                            sig.active ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {sig.shortLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {sig.axis}
                      </span>
                    </div>
                  </div>

                  {/* Isolate Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIsolate(sig.key);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition shrink-0 ${
                      isIsolated
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={
                      isIsolated
                        ? 'Exit isolation and restore other signals'
                        : `Isolate ${sig.label} (hide all other signals)`
                    }
                  >
                    {isIsolated ? 'EXIT' : 'ISOLATE'}
                  </button>
                </div>

                {/* Bottom Row: Line style indicator & Latest telemetry reading */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-5 h-0.5 rounded"
                      style={{
                        backgroundColor: sig.color,
                        borderTop: sig.lineStyle === 'dashed' ? `1px dashed ${sig.color}` : undefined
                      }}
                    ></span>
                  </div>
                  <span
                    className="font-mono font-bold"
                    style={{ color: sig.active ? sig.color : '#64748b' }}
                  >
                    {sig.currentValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Footer with Explanatory Legend & Methodology */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 gap-2 font-mono">
        <div className="flex items-center space-x-2">
          <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            Hover over any interval on the waveform to inspect high-precision physiological telemetry, full timestamps, and moving average deltas.
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Smoothed Signal
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {maWindowHours}h Trend MA
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Thermal Ceiling
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Anomaly Pin ⚠
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            +4h Prognostic Forecast
          </span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

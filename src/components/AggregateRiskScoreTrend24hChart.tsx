import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info,
  Layers,
  Sliders,
  Eye,
  Calculator,
  Compass,
  MessageSquarePlus,
  Tag,
  Trash2,
  Edit3,
  Pin,
  Plus,
  X,
  FileText,
  Check,
  ChevronDown,
  User,
  Wrench,
  Crosshair
} from 'lucide-react';
import { TelemetryDataPoint, FacilityZone } from '../types';
import { chartAnnotationService, ChartAnnotation } from '../services/chartAnnotationService';
import { complianceAuditService } from '../services/complianceAuditService';

export interface AggregateRiskScoreTrend24hChartProps {
  telemetryStream: TelemetryDataPoint[];
  selectedZone?: FacilityZone;
  onInspectHour?: (point: TelemetryDataPoint) => void;
  className?: string;
}

export interface EnrichedChartPoint {
  index: number;
  timeLabel: string;
  timestamp?: string;
  risk_score: number | null;
  movingAvg3h?: number | null;
  linear_regression_forecast?: number | null;
  forecastUpper?: number | null;
  forecastLower?: number | null;
  confidenceBand?: [number, number] | null;
  forecastSpread?: number | null;
  isForecast: boolean;
  offsetHours?: number;
  riskSeverity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  anomalyLabel?: string;
  is_anomaly?: boolean;
  ambient_temp_c?: number;
  smoothed_hrv?: number;
  noise_db?: number;
  // Qualitative annotation attached to this spike/trough
  hasAnnotation?: boolean;
  annotation?: ChartAnnotation;
}

export interface LinearRegressionModel {
  slope: number;
  intercept: number;
  rSquared: number;
  stdError: number;
  equation: string;
  driftDirection: 'RISING' | 'FALLING' | 'STABLE';
  predictedPeak24h: number;
  predictedPeak: number;
  predictedPeakHour: string;
  horizonHours: number;
}

export function computeLinearRegression(
  points: { x: number; y: number }[],
  horizonHours: number = 24
): LinearRegressionModel {
  const n = points.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: 50,
      rSquared: 0,
      stdError: 0,
      equation: 'Risk = 50.0%',
      driftDirection: 'STABLE',
      predictedPeak24h: 50,
      predictedPeak: 50,
      predictedPeakHour: `+${Math.min(12, horizonHours)}h`,
      horizonHours
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - meanX;
    const dy = points[i].y - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * points[i].x + intercept;
    ssRes += Math.pow(points[i].y - yPred, 2);
    ssTot += Math.pow(points[i].y - meanY, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0.86;
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 3.8;

  const sign = slope >= 0 ? '+' : '';
  const equation = `y = ${sign}${slope.toFixed(2)}x + ${intercept.toFixed(1)}`;
  const driftDirection = slope > 0.12 ? 'RISING' : slope < -0.12 ? 'FALLING' : 'STABLE';

  let peakVal = 0;
  let peakHour = '+1h';
  for (let f = 1; f <= horizonHours; f++) {
    const pred = Math.max(5, Math.min(98, slope * (n + f - 1) + intercept));
    if (pred > peakVal) {
      peakVal = pred;
      peakHour = `+${f}h`;
    }
  }

  const roundedPeak = Number(peakVal.toFixed(1));

  return {
    slope: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(2)),
    stdError: Number(stdError.toFixed(2)),
    equation,
    driftDirection,
    predictedPeak24h: roundedPeak,
    predictedPeak: roundedPeak,
    predictedPeakHour: peakHour,
    horizonHours
  };
}

export default function AggregateRiskScoreTrend24hChart({
  telemetryStream,
  selectedZone,
  onInspectHour,
  className = ''
}: AggregateRiskScoreTrend24hChartProps) {
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [showPredictiveForecast, setShowPredictiveForecast] = useState<boolean>(true);
  const [forecastHorizon, setForecastHorizon] = useState<number>(24);
  const [highlightAnomaliesOnly, setHighlightAnomaliesOnly] = useState<boolean>(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Vertical Crosshair & Precision Data-Inspector State
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<EnrichedChartPoint | null>(null);

  // Prediction Uncertainty / Confidence Interval Band State
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [confidenceLevel, setConfidenceLevel] = useState<90 | 95 | 99>(95);

  // Persistent Annotations State
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [showAnnotationsTray, setShowAnnotationsTray] = useState<boolean>(true);

  // Annotation Modal State
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState<boolean>(false);
  const [modalPoint, setModalPoint] = useState<EnrichedChartPoint | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('Facility event: HVAC maintenance');
  const [formNote, setFormNote] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ChartAnnotation['category']>('HVAC_MAINTENANCE');
  const [formAuthor, setFormAuthor] = useState<string>('Alex Mercer (Safety Lead)');
  const [annotationSavedNotice, setAnnotationSavedNotice] = useState<string | null>(null);

  // Subscribe to persistent annotations service
  useEffect(() => {
    const unsub = chartAnnotationService.subscribe((items) => {
      setAnnotations(items);
    });
    return () => unsub();
  }, []);

  // Map of annotations by timeLabel for fast O(1) lookup
  const annotationsByTimeLabel = useMemo(() => {
    const map = new Map<string, ChartAnnotation>();
    annotations.forEach((a) => {
      map.set(a.pointTimeLabel.toLowerCase(), a);
    });
    return map;
  }, [annotations]);

  // 1. Historical 24h points
  const historicalPoints = useMemo(() => {
    return telemetryStream.slice(-24);
  }, [telemetryStream]);

  // 2. Linear Regression calculation based on historical data & dynamic forecast horizon (12h - 72h)
  const regressionModel = useMemo(() => {
    const regressionInput = historicalPoints.map((pt, idx) => ({
      x: idx,
      y: pt.risk_score || 0
    }));
    return computeLinearRegression(regressionInput, forecastHorizon);
  }, [historicalPoints, forecastHorizon]);

  // 3. Combined Dataset: Historical + Forward Linear Regression Forecast + Annotations
  const chartData: EnrichedChartPoint[] = useMemo(() => {
    const totalHistorical = historicalPoints.length;
    const result: EnrichedChartPoint[] = [];

    // Historical Points
    historicalPoints.forEach((pt, idx, arr) => {
      const startIdx = Math.max(0, idx - 1);
      const endIdx = Math.min(arr.length, idx + 2);
      const windowPts = arr.slice(startIdx, endIdx);
      const sum = windowPts.reduce((acc, p) => acc + (p.risk_score || 0), 0);
      const movingAvg = Number((sum / windowPts.length).toFixed(1));

      const isCrit = (pt.risk_score || 0) >= 80;
      const isHigh = (pt.risk_score || 0) >= 65 && !isCrit;
      const isMod = (pt.risk_score || 0) >= 45 && !isCrit && !isHigh;

      let anomalyLabel = undefined;
      if (pt.is_anomaly || isCrit) {
        if (pt.ambient_temp_c > 39) {
          anomalyLabel = 'Solar Thermal Spike';
        } else if (pt.smoothed_hrv < 34) {
          anomalyLabel = 'Autonomic HRV Collapse';
        } else if (pt.noise_db > 95) {
          anomalyLabel = 'Acoustic Overpressure';
        } else {
          anomalyLabel = 'Multi-Signal Anomaly';
        }
      }

      const isLastHistorical = idx === totalHistorical - 1;
      const timeLabel = pt.timeLabel || `T-${totalHistorical - 1 - idx}h`;
      const annot = annotationsByTimeLabel.get(timeLabel.toLowerCase());

      result.push({
        index: idx,
        timeLabel,
        timestamp: pt.timestamp,
        risk_score: pt.risk_score,
        movingAvg3h: movingAvg,
        linear_regression_forecast: isLastHistorical ? pt.risk_score : null,
        forecastUpper: isLastHistorical ? pt.risk_score : null,
        forecastLower: isLastHistorical ? pt.risk_score : null,
        confidenceBand: isLastHistorical && pt.risk_score != null ? [pt.risk_score, pt.risk_score] : null,
        forecastSpread: 0,
        isForecast: false,
        riskSeverity: isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : isMod ? 'MODERATE' : 'LOW',
        anomalyLabel,
        is_anomaly: pt.is_anomaly,
        ambient_temp_c: pt.ambient_temp_c,
        smoothed_hrv: pt.smoothed_hrv,
        noise_db: pt.noise_db,
        hasAnnotation: Boolean(annot),
        annotation: annot
      });
    });

    // Append Dynamic Predictive Forecast Points across chosen horizon (e.g., 24h, 48h, 72h)
    if (showPredictiveForecast && totalHistorical > 0) {
      const zMultiplier = confidenceLevel === 99 ? 2.576 : confidenceLevel === 90 ? 1.645 : 1.960;
      for (let offset = 1; offset <= forecastHorizon; offset++) {
        const xVal = totalHistorical - 1 + offset;
        const rawForecast = regressionModel.slope * xVal + regressionModel.intercept;
        const clampedForecast = Number(Math.max(5.0, Math.min(98.0, rawForecast)).toFixed(1));
        // Confidence interval expands as forecast horizon extends further out (heteroskedastic variance expansion)
        const horizonFactor = 1 + (offset / forecastHorizon) * 0.55;
        const spread = Number((regressionModel.stdError * zMultiplier * horizonFactor).toFixed(1));
        const upper = Number(Math.min(100, clampedForecast + spread).toFixed(1));
        const lower = Number(Math.max(0, clampedForecast - spread).toFixed(1));

        result.push({
          index: totalHistorical + offset - 1,
          timeLabel: `+${offset}h`,
          risk_score: null,
          movingAvg3h: null,
          linear_regression_forecast: clampedForecast,
          forecastUpper: upper,
          forecastLower: lower,
          confidenceBand: [lower, upper],
          forecastSpread: Number((upper - lower).toFixed(1)),
          isForecast: true,
          offsetHours: offset,
          riskSeverity:
            clampedForecast >= 80 ? 'CRITICAL' :
            clampedForecast >= 65 ? 'HIGH' :
            clampedForecast >= 45 ? 'MODERATE' : 'LOW'
        });
      }
    }

    return result;
  }, [historicalPoints, regressionModel, showPredictiveForecast, annotationsByTimeLabel, forecastHorizon, confidenceLevel]);

  // Aggregate statistics across the 24-hour historical progression
  const stats = useMemo(() => {
    if (historicalPoints.length === 0) {
      return {
        currentRisk: 65,
        peakRisk: 88,
        peakTime: '14:00',
        avgRisk: 52,
        anomalyCount: 4,
        trendVelocity: 14.5,
        trendDirection: 'RISING' as const,
        primaryAnomalyWindow: '12:00 – 16:00'
      };
    }

    const current = historicalPoints[historicalPoints.length - 1]?.risk_score || 0;
    const scores = historicalPoints.map((d) => d.risk_score || 0);
    const peak = Math.max(...scores);
    const peakIdx = scores.indexOf(peak);
    const peakTime = historicalPoints[peakIdx]?.timeLabel || '14:00';
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / scores.length).toFixed(1));
    const anomalies = historicalPoints.filter((d) => d.is_anomaly || (d.risk_score || 0) >= 80).length;

    const recent4h = historicalPoints.slice(-4).map((d) => d.risk_score || 0);
    const baseline4h = historicalPoints.slice(0, 4).map((d) => d.risk_score || 0);
    const recentAvg = recent4h.reduce((a, b) => a + b, 0) / (recent4h.length || 1);
    const baseAvg = baseline4h.reduce((a, b) => a + b, 0) / (baseline4h.length || 1);
    const velocity = Number((recentAvg - baseAvg).toFixed(1));

    return {
      currentRisk: Number(current.toFixed(1)),
      peakRisk: Number(peak.toFixed(1)),
      peakTime,
      avgRisk: avg,
      anomalyCount: anomalies,
      trendVelocity: Math.abs(velocity),
      trendDirection: velocity >= 0 ? ('RISING' as const) : ('FALLING' as const),
      primaryAnomalyWindow: '12:00 – 16:00 (Thermal Peak)'
    };
  }, [historicalPoints]);

  const lastObservedTimeLabel = useMemo(() => {
    const obs = chartData.filter((d) => !d.isForecast);
    return obs.length > 0 ? obs[obs.length - 1].timeLabel : undefined;
  }, [chartData]);

  // Open Annotation Modal for a specific point
  const handleOpenAnnotationModal = (point: EnrichedChartPoint) => {
    setModalPoint(point);
    setSelectedPointIndex(point.index);

    const existing = point.annotation || annotationsByTimeLabel.get(point.timeLabel.toLowerCase());
    if (existing) {
      setEditingAnnotationId(existing.id);
      setFormTitle(existing.title);
      setFormNote(existing.note);
      setFormCategory(existing.category);
      setFormAuthor(existing.author);
    } else {
      setEditingAnnotationId(null);
      const isSpike = (point.risk_score || 0) >= 65;
      const isTrough = (point.risk_score || 0) <= 35;
      if (isSpike) {
        setFormTitle('Facility event: HVAC maintenance');
        setFormNote('Chiller unit bypass or elevated microclimate thermal strain during scheduled maintenance.');
        setFormCategory('HVAC_MAINTENANCE');
      } else if (isTrough) {
        setFormTitle('Shift Handover & Cool-Down Routine');
        setFormNote('Biometric recovery window following scheduled crew rotation and hydration protocol.');
        setFormCategory('SHIFT_HANDOVER');
      } else {
        setFormTitle('Operational Event Note');
        setFormNote('');
        setFormCategory('FACILITY_EVENT');
      }
    }
    setIsAnnotationModalOpen(true);
  };

  // Save or Update Annotation
  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPoint) return;

    const riskVal = modalPoint.risk_score || 0;
    const ptType: ChartAnnotation['pointType'] =
      riskVal >= 65 ? 'SPIKE' : riskVal <= 35 ? 'TROUGH' : 'CUSTOM';

    if (editingAnnotationId) {
      // Update
      chartAnnotationService.updateAnnotation(editingAnnotationId, {
        title: formTitle,
        note: formNote,
        category: formCategory,
        author: formAuthor
      });

      complianceAuditService.logEvent({
        eventType: 'MANUAL_OVERRIDE',
        actor: formAuthor,
        actorRole: 'Safety Compliance Officer',
        actorType: 'USER',
        targetModule: 'Health Risk Trend Chart',
        parameter: `Qualitative Annotation Updated [${modalPoint.timeLabel}]`,
        previousValue: `Annotation ${editingAnnotationId}`,
        newValue: `${formTitle}: ${formNote.slice(0, 45)}...`,
        justification: 'Safety supervisor revised qualitative facility event annotation.',
        regulatoryStandard: 'OSHA 1910.120 / ISO 45001 §9.1',
        complianceStatus: 'VERIFIED',
        zoneId: selectedZone?.id
      });

      setAnnotationSavedNotice(`Updated annotation for ${modalPoint.timeLabel}: "${formTitle}"`);
    } else {
      // Create new
      const created = chartAnnotationService.addAnnotation({
        chartType: '24h_risk',
        pointTimeLabel: modalPoint.timeLabel,
        pointIndex: modalPoint.index,
        riskScore: riskVal,
        pointType: ptType,
        title: formTitle,
        note: formNote,
        category: formCategory,
        author: formAuthor,
        zoneId: selectedZone?.id,
        zoneName: selectedZone?.name
      });

      complianceAuditService.logEvent({
        eventType: 'MANUAL_OVERRIDE',
        actor: formAuthor,
        actorRole: 'Safety Compliance Officer',
        actorType: 'USER',
        targetModule: 'Health Risk Trend Chart',
        parameter: `Qualitative Annotation Attached [${modalPoint.timeLabel}]`,
        previousValue: 'None',
        newValue: `Attached "${formTitle}" (Type: ${ptType}, Risk: ${riskVal}%)`,
        justification: formNote || 'Contextual operational event attached by supervisor to document trend anomaly.',
        regulatoryStandard: 'OSHA 1910.120(b)(4)',
        complianceStatus: 'VERIFIED',
        zoneId: selectedZone?.id
      });

      setAnnotationSavedNotice(`Attached qualitative note to ${modalPoint.timeLabel} (${ptType}): "${formTitle}"`);
    }

    setIsAnnotationModalOpen(false);
    setTimeout(() => setAnnotationSavedNotice(null), 5000);
  };

  // Delete Annotation
  const handleDeleteAnnotation = (id: string, timeLabel: string) => {
    const deleted = chartAnnotationService.deleteAnnotation(id);
    if (deleted) {
      complianceAuditService.logEvent({
        eventType: 'MANUAL_OVERRIDE',
        actor: 'Alex Mercer',
        actorRole: 'Safety Compliance Officer',
        actorType: 'USER',
        targetModule: 'Health Risk Trend Chart',
        parameter: `Qualitative Annotation Removed [${timeLabel}]`,
        previousValue: `Annotation ID ${id}`,
        newValue: 'Deleted from Persistent Storage',
        justification: 'Supervisor removed historical chart annotation from risk progression timeline.',
        regulatoryStandard: 'OSHA 1910.120',
        complianceStatus: 'VERIFIED',
        zoneId: selectedZone?.id
      });
      setAnnotationSavedNotice(`Removed annotation for ${timeLabel}`);
      setTimeout(() => setAnnotationSavedNotice(null), 4000);
    }
  };

  // Custom Dot for Historical Line (shows special interactive badge for annotated points)
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || payload.isForecast) return null;

    const isAnomaly = payload.is_anomaly || (payload.risk_score && payload.risk_score >= 80);
    const isSelected = selectedPointIndex === payload.index;
    const hasNote = payload.hasAnnotation;

    if (hasNote) {
      return (
        <g key={`annot-dot-${payload.index}`} className="cursor-pointer">
          {/* Outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 10 : 8}
            fill="#a855f7"
            fillOpacity={0.3}
            className="animate-ping"
          />
          {/* Main marker */}
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 6 : 5}
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth={2}
          />
          {/* Flag pin above */}
          <g transform={`translate(${cx - 7}, ${cy - 22})`}>
            <rect width="14" height="12" rx="3" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
            <text x="7" y="9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
              💬
            </text>
          </g>
        </g>
      );
    }

    if (isAnomaly) {
      return (
        <g key={`dot-${payload.index}`}>
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 9 : 7}
            fill="#f43f5e"
            fillOpacity={0.3}
            className="animate-ping"
          />
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 6 : 4.5}
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth={2}
            className="cursor-pointer"
          />
        </g>
      );
    }

    if (payload.risk_score && payload.risk_score >= 60) {
      return (
        <circle
          key={`dot-${payload.index}`}
          cx={cx}
          cy={cy}
          r={isSelected ? 5 : 3.5}
          fill="#f59e0b"
          stroke="#0f172a"
          strokeWidth={1.5}
          className="cursor-pointer"
        />
      );
    }

    return (
      <circle
        key={`dot-${payload.index}`}
        cx={cx}
        cy={cy}
        r={isSelected ? 4 : 2}
        fill="#38bdf8"
        stroke="#0f172a"
        strokeWidth={1}
        className="cursor-pointer opacity-70 hover:opacity-100"
      />
    );
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: EnrichedChartPoint = payload[0].payload;

    if (data.isForecast) {
      return (
        <div className="bg-slate-950 border border-amber-500/80 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[270px] backdrop-blur-md">
          {/* Data Inspector Crosshair Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/30 mb-2">
            <span className="flex items-center gap-1 font-bold">
              <Crosshair className="h-3 w-3 text-amber-400" />
              <span>DATA INSPECTOR: X={data.timeLabel}, Y={data.linear_regression_forecast}%</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Projection</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span>Forecast Horizon: {data.timeLabel}</span>
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                (data.linear_regression_forecast || 0) >= 80
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                  : (data.linear_regression_forecast || 0) >= 65
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500'
              }`}
            >
              {data.riskSeverity} FORECAST
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 font-sans">Linear Regression Projection:</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {data.linear_regression_forecast}%
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between bg-amber-950/40 p-1 rounded border border-amber-500/20">
              <span className="text-amber-300 font-sans font-semibold">{confidenceLevel}% Uncertainty Band:</span>
              <span className="font-mono text-white font-bold">
                [{data.forecastLower}% – {data.forecastUpper}%]
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="font-sans">Prediction Margin of Error:</span>
              <span className="font-mono text-amber-300">±{((data.forecastSpread || 0) / 2).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Regression Model:</span>
              <span className="font-mono text-cyan-300 font-semibold">{regressionModel.equation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Goodness of Fit:</span>
              <span className="font-mono text-emerald-400">R² = {regressionModel.rSquared}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl text-xs font-mono min-w-[270px] backdrop-blur-md">
        {/* Data Inspector Crosshair Header */}
        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30 mb-2">
          <span className="flex items-center gap-1 font-bold">
            <Crosshair className="h-3 w-3 text-cyan-400" />
            <span>INSPECTOR: X={data.timeLabel}, Y={data.risk_score ? `${data.risk_score.toFixed(1)}%` : '--'}</span>
          </span>
          {data.risk_score && Math.abs(data.risk_score - stats.peakRisk) < 0.2 ? (
            <span className="text-rose-400 font-bold bg-rose-950/80 px-1 rounded border border-rose-500/40">★ 24H PEAK</span>
          ) : data.risk_score && Math.abs(data.risk_score - stats.peakRisk) <= 3.0 ? (
            <span className="text-amber-400 font-bold">▲ SPIKE</span>
          ) : (
            <span className="text-slate-400">{data.isForecast ? 'Forecast' : 'Observed'}</span>
          )}
        </div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Timeline: {data.timeLabel}</span>
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
              data.is_anomaly || (data.risk_score && data.risk_score >= 80)
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                : (data.risk_score && data.risk_score >= 60)
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}
          >
            {data.is_anomaly || (data.risk_score && data.risk_score >= 80)
              ? 'CRITICAL ANOMALY'
              : data.riskSeverity}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 font-sans">Observed Risk Score:</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base font-bold font-mono ${
                (data.risk_score || 0) >= 80
                  ? 'text-rose-400'
                  : (data.risk_score || 0) >= 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {data.risk_score ? `${data.risk_score.toFixed(1)}%` : '--'}
            </span>
            {data.movingAvg3h != null && (
              <span className="text-[9px] text-slate-500">
                (3h MA: {data.movingAvg3h.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* Qualitative Note Pill (if attached) */}
        {data.hasAnnotation && data.annotation && (
          <div className="mb-2 p-2 rounded-lg bg-purple-950/70 border border-purple-500/50 text-[11px] font-sans">
            <div className="flex items-center justify-between text-purple-300 font-bold mb-0.5">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Pin className="h-3 w-3 text-purple-400" />
                <span>QUALITATIVE NOTE ({data.annotation.pointType})</span>
              </span>
              <span className="text-[9px] text-purple-400 font-mono">{data.annotation.author.split(' ')[0]}</span>
            </div>
            <p className="text-white font-medium text-xs">{data.annotation.title}</p>
            {data.annotation.note && (
              <p className="text-slate-300 text-[10px] mt-1 line-clamp-2">{data.annotation.note}</p>
            )}
          </div>
        )}

        <div className="space-y-1 text-[11px] text-slate-300">
          {data.smoothed_hrv != null && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Autonomic HRV:</span>
              <span className={`font-mono font-bold ${data.smoothed_hrv < 35 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {data.smoothed_hrv.toFixed(1)} ms
              </span>
            </div>
          )}

          {data.ambient_temp_c != null && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Ambient Temp:</span>
              <span className={`font-mono font-bold ${data.ambient_temp_c > 38 ? 'text-rose-400' : 'text-amber-300'}`}>
                {data.ambient_temp_c.toFixed(1)}°C
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Click point to {data.hasAnnotation ? 'edit note' : 'attach note'}</span>
          <span className="text-purple-400 font-semibold">Interactive</span>
        </div>
      </div>
    );
  };

  return (
    <div
      id="aggregate-risk-score-trend-24h"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>24-Hour Health Risk Trend &amp; {forecastHorizon}H Predictive Forecast</span>
            </h2>
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
              Interactive Annotations Enabled
            </span>
            {selectedZone && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                Zone: {selectedZone.name.replace(/-/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Click on specific spikes or troughs on the chart to attach persistent qualitative notes (e.g., 'Facility event: HVAC maintenance') that persist across the system.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Forecast Horizon Slider & Presets (12h, 24h, 48h, 72h) */}
          <div className="flex items-center gap-2 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono text-[11px] whitespace-nowrap">Horizon:</span>
              <span className="font-mono font-bold text-amber-200 bg-amber-950/90 border border-amber-500/50 px-1.5 py-0.5 rounded text-[11px]">
                {forecastHorizon}h
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={72}
              step={6}
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(Number(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title={`Adjust Forecast Horizon: ${forecastHorizon} Hours (12h to 72h)`}
            />
            <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
              {([24, 48, 72] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    forecastHorizon === h
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                  }`}
                  title={`Set predictive forecast horizon to ${h} hours`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Annotate Spikes/Troughs Button */}
          <button
            onClick={() => {
              // Pick highest spike or current selected point
              const targetPoint =
                (selectedPointIndex !== null && chartData[selectedPointIndex]) ||
                chartData.reduce((prev, curr) => ((curr.risk_score || 0) > (prev.risk_score || 0) ? curr : prev), chartData[0]);
              if (targetPoint) {
                handleOpenAnnotationModal(targetPoint);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Attach a qualitative note to a spike or trough on the health risk trend chart"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-purple-400" />
            <span>Annotate Spikes/Troughs</span>
            <span className="text-[10px] font-mono bg-purple-900/90 px-1.5 py-0.2 rounded text-white font-bold">
              {annotations.length}
            </span>
          </button>

          {/* Predictive Regression Forecast Toggle */}
          <button
            onClick={() => setShowPredictiveForecast(!showPredictiveForecast)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showPredictiveForecast
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-amber-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={`Toggle ${forecastHorizon}-hour predictive forecast using linear regression calculation`}
          >
            <Calculator className="h-3.5 w-3.5 text-amber-400" />
            <span>{forecastHorizon}H Regression</span>
            <span className="text-[10px] font-mono bg-slate-900 px-1 rounded text-amber-300">
              {showPredictiveForecast ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Vertical Crosshair & Data-Inspector Reticle Toggle */}
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showCrosshair
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-cyan-950/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle precision vertical crosshair line & coordinate data-inspector reticle"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            <span>Crosshair Inspector</span>
            <span className="text-[10px] font-mono bg-slate-900 px-1 rounded text-cyan-300 font-bold">
              {showCrosshair ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Shaded Uncertainty Band & Confidence Interval Selector */}
          {showPredictiveForecast && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs shadow-xs">
              <button
                onClick={() => setShowConfidenceBand(!showConfidenceBand)}
                className={`flex items-center gap-1 font-semibold transition cursor-pointer ${
                  showConfidenceBand ? 'text-amber-300' : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Toggle shaded prediction uncertainty corridor"
              >
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span>Uncertainty Band</span>
                <span className="text-[10px] font-mono bg-amber-950/80 px-1 rounded border border-amber-500/30 text-amber-300">
                  {showConfidenceBand ? 'ON' : 'OFF'}
                </span>
              </button>
              {showConfidenceBand && (
                <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                  {([90, 95, 99] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setConfidenceLevel(lvl)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                        confidenceLevel === lvl
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                      }`}
                      title={`Set statistical uncertainty corridor to ${lvl}% Confidence Interval`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3h Moving Average Toggle */}
          <button
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showMovingAverage
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle 3-hour rolling moving average trendline"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>3H Moving Avg</span>
          </button>

          {/* Anomaly Points Toggle */}
          <button
            onClick={() => setHighlightAnomaliesOnly(!highlightAnomaliesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              highlightAnomaliesOnly
                ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Highlight only anomaly breach inflection points"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Anomalies</span>
          </button>
        </div>
      </div>

      {/* Annotation Saved Banner */}
      {annotationSavedNotice && (
        <div className="mb-4 bg-purple-950/80 border border-purple-500/50 rounded-xl p-2.5 px-4 text-xs font-mono text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span>{annotationSavedNotice}</span>
          </span>
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Persisted</span>
        </div>
      )}

      {/* Linear Regression Statistical Strip (when enabled) */}
      {showPredictiveForecast && (
        <div className="mb-4 bg-slate-950/90 border border-amber-500/30 rounded-xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span>OLS Linear Regression ({forecastHorizon}h Horizon):</span>
            </span>
            <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {regressionModel.equation}
            </span>
            <span className="text-slate-400">
              Goodness-of-Fit: <strong className="text-emerald-400">R² = {regressionModel.rSquared}</strong>
            </span>
            <span className="text-slate-400">
              Drift Rate:{' '}
              <strong className={regressionModel.slope > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {regressionModel.slope > 0 ? `+${(regressionModel.slope * 1).toFixed(2)}%/h` : `${(regressionModel.slope * 1).toFixed(2)}%/h`}
              </strong>
            </span>
          </div>

          <div className="text-amber-300 font-semibold flex items-center gap-1.5">
            <span>Projected {forecastHorizon}h Peak:</span>
            <strong className="text-white bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
              {regressionModel.predictedPeak}% at {regressionModel.predictedPeakHour}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              (Window: +1h to +{forecastHorizon}h)
            </span>
          </div>
        </div>
      )}

      {/* 24-Hour Progression KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {/* Current Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Current Risk</span>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                stats.currentRisk >= 80
                  ? 'text-rose-400'
                  : stats.currentRisk >= 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats.currentRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Reading</span>
          </div>
        </div>

        {/* 24h Peak Risk (Spike) */}
        <div
          onClick={() => {
            const peakPt = chartData.find((d) => d.timeLabel === stats.peakTime);
            if (peakPt) handleOpenAnnotationModal(peakPt);
          }}
          className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between cursor-pointer hover:border-rose-500/50 transition group"
          title="Click to annotate this 24-hour peak spike"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">24-Hour Peak Spike</span>
            <MessageSquarePlus className="h-3 w-3 text-slate-500 group-hover:text-rose-400 transition" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-rose-400">
              {stats.peakRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              at {stats.peakTime}
            </span>
          </div>
        </div>

        {/* 24h Average Risk */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">24-Hour Average</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-cyan-300">
              {stats.avgRisk}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">Safe Baseline &lt;50%</span>
          </div>
        </div>

        {/* Anomaly Events */}
        <div className="bg-slate-950 border border-slate-800/90 p-3 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Anomaly Inflexions</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {stats.anomalyCount} Points
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              Flagged
            </span>
          </div>
        </div>

        {/* Qualitative Notes Count */}
        <div className="bg-slate-950 border border-purple-900/40 p-3 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase text-purple-400">Qualitative Notes</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-purple-300">
              {annotations.length} Notes
            </span>
            <span className="text-[10px] font-mono text-purple-400">
              Active Pins
            </span>
          </div>
        </div>
      </div>

      {/* Precision Data-Inspector Line & Real-Time Coordinate HUD Bar */}
      <div
        className={`mb-3 p-3 rounded-xl border transition-all duration-150 text-xs font-mono ${
          hoveredPoint
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
            : 'bg-slate-950/70 border-slate-800 text-slate-400'
        }`}
      >
        {hoveredPoint ? (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Coordinate readout */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold bg-cyan-950/90 px-2 py-0.5 rounded-md border border-cyan-500/40">
                <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                <span>DATA INSPECTOR:</span>
              </div>

              <div className="flex items-center gap-1 text-white">
                <span className="text-slate-400 font-normal">X Coordinate:</span>
                <span className="font-bold text-cyan-300 font-mono">{hoveredPoint.timeLabel}</span>
                <span className="text-[10px] text-slate-400">
                  ({hoveredPoint.isForecast ? `+${hoveredPoint.offsetHours}h Forward Projection` : 'Historical Shift Observation'})
                </span>
              </div>

              <div className="flex items-center gap-1 text-white">
                <span className="text-slate-400 font-normal">Y Coordinate:</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    (hoveredPoint.risk_score ?? hoveredPoint.linear_regression_forecast ?? 0) >= 80
                      ? 'text-rose-400'
                      : (hoveredPoint.risk_score ?? hoveredPoint.linear_regression_forecast ?? 0) >= 60
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {hoveredPoint.risk_score != null
                    ? `${hoveredPoint.risk_score.toFixed(1)}% Risk`
                    : `${hoveredPoint.linear_regression_forecast}% Forecast`}
                </span>
              </div>

              {/* Peak Proximity Analysis */}
              {!hoveredPoint.isForecast && hoveredPoint.risk_score != null && (
                <div className="flex items-center gap-1">
                  {Math.abs(hoveredPoint.risk_score - stats.peakRisk) < 0.2 ? (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded font-bold text-[11px] animate-pulse">
                      ★ 24H ABSOLUTE PEAK SPIKE ({hoveredPoint.risk_score.toFixed(1)}%)
                    </span>
                  ) : Math.abs(hoveredPoint.risk_score - stats.peakRisk) <= 4.0 ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[11px]">
                      ▲ Peak Vicinity (Δ -{(stats.peakRisk - hoveredPoint.risk_score).toFixed(1)}% vs Max)
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      Peak Delta: -{(stats.peakRisk - hoveredPoint.risk_score).toFixed(1)}% vs Peak ({stats.peakRisk}%)
                    </span>
                  )}
                </div>
              )}

              {/* Statistical Uncertainty Band readout for Forecast Points */}
              {hoveredPoint.isForecast && (
                <div className="flex items-center gap-1.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[11px]">
                  <span>{confidenceLevel}% Uncertainty Band:</span>
                  <span className="font-bold text-white">
                    [{hoveredPoint.forecastLower}% – {hoveredPoint.forecastUpper}%]
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    (±{((hoveredPoint.forecastSpread || 0) / 2).toFixed(1)}% margin)
                  </span>
                </div>
              )}
            </div>

            {/* Right: Telemetry Coordinates */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-300 font-mono flex-wrap">
              {!hoveredPoint.isForecast ? (
                <>
                  {hoveredPoint.ambient_temp_c != null && (
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Temp: <strong className="text-amber-300">{hoveredPoint.ambient_temp_c.toFixed(1)}°C</strong>
                    </span>
                  )}
                  {hoveredPoint.smoothed_hrv != null && (
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      HRV: <strong className="text-cyan-300">{hoveredPoint.smoothed_hrv.toFixed(1)}ms</strong>
                    </span>
                  )}
                  {hoveredPoint.noise_db != null && (
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Noise: <strong className="text-orange-300">{hoveredPoint.noise_db.toFixed(0)}dB</strong>
                    </span>
                  )}
                  {hoveredPoint.hasAnnotation && (
                    <span className="bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded font-bold">
                      💬 Note: {hoveredPoint.annotation?.title}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-amber-300/90 text-[10px]">
                  Heteroskedastic Uncertainty Corridor (Model R² = {regressionModel.rSquared})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <Crosshair className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Data-Inspector Crosshair Active:</strong> Hover over any peak spike, trough, or forecast horizon to inspect exact Cartesian coordinate values.
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <span>
                Peak: <strong className="text-rose-400">{stats.peakRisk}% at {stats.peakTime}</strong>
              </span>
              <span>
                Latest: <strong className="text-cyan-300">{stats.currentRisk}%</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recharts Canvas with Click-to-Annotate & Crosshair Data-Inspector */}
      <div className="w-full h-[320px] bg-slate-950/70 rounded-xl border border-slate-800 p-2 pt-3 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 18, right: 20, left: -10, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const pt = state.activePayload[0].payload as EnrichedChartPoint;
                setHoveredPoint(pt);
              }
            }}
            onMouseLeave={() => {
              setHoveredPoint(null);
            }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const pt = state.activePayload[0].payload as EnrichedChartPoint;
                setSelectedPointIndex(pt.index);
                if (!pt.isForecast) {
                  // Interactive annotation trigger: clicking a spike or trough opens annotation modal
                  handleOpenAnnotationModal(pt);
                  if (onInspectHour) {
                    onInspectHour(pt as any);
                  }
                }
              }
            }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>

              {/* Shaded Prediction Uncertainty Band Gradient */}
              <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.32} />
                <stop offset="50%" stopColor="#d97706" stopOpacity={0.20} />
                <stop offset="100%" stopColor="#b45309" stopOpacity={0.09} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={showCrosshair ? { stroke: '#38bdf8', strokeWidth: 1.5, strokeDasharray: '4 4' } : false}
            />

            {/* Critical Threshold Reference Line (80%) */}
            <ReferenceLine
              y={80}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'CRITICAL HAZARD THRESHOLD (80%)',
                fill: '#f43f5e',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopRight'
              }}
            />

            {/* Warning Reference Line (65%) */}
            <ReferenceLine
              y={65}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'ELEVATED STRAIN (65%)',
                fill: '#f59e0b',
                fontSize: 9,
                fontFamily: 'monospace',
                position: 'insideTopLeft'
              }}
            />

            {/* Boundary marker at current time (T=0) */}
            {lastObservedTimeLabel && showPredictiveForecast && (
              <ReferenceLine
                x={lastObservedTimeLabel}
                stroke="#06b6d4"
                strokeDasharray="2 2"
                strokeWidth={1.5}
                label={{
                  value: 'NOW (FORECAST HORIZON)',
                  fill: '#06b6d4',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'insideTopLeft'
                }}
              />
            )}

            {/* Vertical Crosshair Line (Data-Inspector) at hover point */}
            {showCrosshair && hoveredPoint && (
              <ReferenceLine
                x={hoveredPoint.timeLabel}
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="3 2"
                label={{
                  value: `${hoveredPoint.timeLabel} [${
                    hoveredPoint.risk_score != null
                      ? `${hoveredPoint.risk_score.toFixed(1)}%`
                      : `${hoveredPoint.linear_regression_forecast}%`
                  }]`,
                  fill: '#38bdf8',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Horizontal Crosshair Line at point value */}
            {showCrosshair && hoveredPoint && (
              <ReferenceLine
                y={hoveredPoint.risk_score ?? hoveredPoint.linear_regression_forecast ?? 0}
                stroke="#38bdf8"
                strokeWidth={1}
                strokeDasharray="2 2"
                strokeOpacity={0.65}
              />
            )}

            {/* Shaded Prediction Uncertainty / Confidence Interval Band */}
            {showPredictiveForecast && showConfidenceBand && (
              <>
                <Area
                  type="monotone"
                  dataKey="confidenceBand"
                  name={`${confidenceLevel}% Prediction Uncertainty Band`}
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.45}
                  fill="url(#uncertaintyGradient)"
                  isAnimationActive={false}
                  connectNulls
                />
                {/* Upper Boundary Fence of Confidence Interval */}
                <Line
                  type="monotone"
                  dataKey="forecastUpper"
                  name={`Upper ${confidenceLevel}% CI Fence`}
                  stroke="#fbbf24"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
                {/* Lower Boundary Fence of Confidence Interval */}
                <Line
                  type="monotone"
                  dataKey="forecastLower"
                  name={`Lower ${confidenceLevel}% CI Fence`}
                  stroke="#fbbf24"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              </>
            )}

            {/* Gradient Area Fill under Observed Risk Curve */}
            <Area
              type="monotone"
              dataKey="risk_score"
              stroke="none"
              fill="url(#riskGradient)"
            />

            {/* Historical Observed Risk Score Line */}
            <Line
              type="monotone"
              dataKey="risk_score"
              name="Observed Aggregate Risk"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={renderCustomDot}
              activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#a855f7' }}
            />

            {/* 24-Hour Predictive Linear Regression Forecast Line */}
            {showPredictiveForecast && (
              <Line
                type="monotone"
                dataKey="linear_regression_forecast"
                name="24H Linear Regression Forecast"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload || !payload.isForecast) return null;
                  return (
                    <circle
                      key={`f-dot-${payload.index}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill="#f59e0b"
                      stroke="#0f172a"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#f59e0b' }}
              />
            )}

            {/* Optional 3-Hour Rolling Moving Average */}
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAvg3h"
                name="3-Hour Moving Avg"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend / Info Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-xs bg-[#38bdf8]" />
            <span className="text-slate-300">Observed Risk</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 border border-white" />
            <span className="text-purple-300">Qualitative Annotation (Click point to view/edit)</span>
          </span>
          {showPredictiveForecast && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-[#f59e0b]" />
              <span className="text-amber-300">24H Regression Projection</span>
            </span>
          )}
          {showPredictiveForecast && showConfidenceBand && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-xs bg-amber-500/30 border border-amber-500/60" />
              <span className="text-amber-300">{confidenceLevel}% Uncertainty Band</span>
            </span>
          )}
          {showCrosshair && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-[#38bdf8]" />
              <span className="text-cyan-300">Inspector Crosshair</span>
            </span>
          )}
          {showMovingAverage && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t border-dashed border-[#a855f7]" />
              <span className="text-purple-300">3-Hour Rolling MA</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAnnotationsTray(!showAnnotationsTray)}
          className="text-purple-300 hover:text-purple-200 transition flex items-center gap-1 cursor-pointer font-semibold"
        >
          <span>{showAnnotationsTray ? 'Hide Qualitative Notes' : 'Show Qualitative Notes'} ({annotations.length})</span>
          <ChevronDown className={`h-3 w-3 transform transition ${showAnnotationsTray ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Active Qualitative Annotations Tray */}
      {showAnnotationsTray && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Pin className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Persistent Qualitative Annotations
              </span>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                {annotations.length} Attached to Spikes &amp; Troughs
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Persisted across system &amp; logged in statutory audit trail
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {annotations.length === 0 ? (
              <div className="col-span-full py-4 text-center text-xs text-slate-500 font-mono bg-slate-950/60 rounded-lg border border-slate-800">
                No qualitative notes attached yet. Click on any spike or trough on the chart above to attach a note.
              </div>
            ) : (
              annotations.map((ann) => {
                const isSpike = ann.pointType === 'SPIKE';
                const isTrough = ann.pointType === 'TROUGH';

                return (
                  <div
                    key={ann.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3 shadow-md flex flex-col justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase border ${
                              isSpike
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : isTrough
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-purple-950 text-purple-300 border-purple-800'
                            }`}
                          >
                            {ann.pointType}: {ann.pointTimeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Risk: <strong className="text-white">{ann.riskScore}%</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const matchPt = chartData.find(
                                (d) => d.timeLabel.toLowerCase() === ann.pointTimeLabel.toLowerCase()
                              ) || {
                                index: ann.pointIndex,
                                timeLabel: ann.pointTimeLabel,
                                risk_score: ann.riskScore,
                                isForecast: false,
                                annotation: ann
                              };
                              handleOpenAnnotationModal(matchPt as EnrichedChartPoint);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Edit this qualitative note"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnotation(ann.id, ann.pointTimeLabel)}
                            className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete this note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {ann.note}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Author: {ann.author.split(' ')[0]}</span>
                      <span className="text-purple-400">{ann.category.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Interactive Modal: Attach / Edit Qualitative Note on Spike or Trough */}
      {isAnnotationModalOpen && modalPoint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{editingAnnotationId ? 'Edit Qualitative Note' : 'Attach Qualitative Note'}</span>
                    <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                      {modalPoint.timeLabel} ({modalPoint.risk_score}%)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record operational context for this spike/trough to persist across the platform.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAnnotationModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAnnotation} className="p-4 sm:p-5 space-y-4 text-xs font-sans">
              {/* Quick Preset Buttons */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Facility event: HVAC maintenance', cat: 'HVAC_MAINTENANCE' as const },
                    { label: 'Shift Handover & Cool-Down Routine', cat: 'SHIFT_HANDOVER' as const },
                    { label: 'Extreme Solar Radiation Peak', cat: 'ENVIRONMENTAL_HEAT' as const },
                    { label: 'Compressor Vibration Overpressure', cat: 'EQUIPMENT_OVERPRESSURE' as const },
                    { label: 'PPE Non-compliance Drill', cat: 'PPE_DRILL' as const }
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => {
                        setFormTitle(preset.label);
                        setFormCategory(preset.cat);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                        formTitle === preset.label
                          ? 'bg-purple-900 text-white border-purple-500'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block mb-1">
                  Event Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Facility event: HVAC maintenance"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Category & Author Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block mb-1">
                    Event Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition cursor-pointer"
                  >
                    <option value="HVAC_MAINTENANCE">HVAC &amp; Chiller Maintenance</option>
                    <option value="FACILITY_EVENT">Facility Event / Operations</option>
                    <option value="ENVIRONMENTAL_HEAT">Environmental Heat Surge</option>
                    <option value="EQUIPMENT_OVERPRESSURE">Equipment Pressure / Vibration</option>
                    <option value="SHIFT_HANDOVER">Shift Handover Recovery</option>
                    <option value="PPE_DRILL">PPE / Safety Drill</option>
                    <option value="OTHER">Other Operational Context</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block mb-1">
                    Author / Lead
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Alex Mercer (Safety Lead)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Detailed Qualitative Note */}
              <div>
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block mb-1">
                  Qualitative Description / Root Cause Analysis
                </label>
                <textarea
                  rows={3}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Detail the operational situation, root cause, or corrective actions taken..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none font-sans"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {editingAnnotationId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingAnnotationId) {
                        handleDeleteAnnotation(editingAnnotationId, modalPoint.timeLabel);
                        setIsAnnotationModalOpen(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Note</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-mono text-slate-500">
                    Will auto-log in Compliance Audit Trail
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnotationModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 transition shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Annotation</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

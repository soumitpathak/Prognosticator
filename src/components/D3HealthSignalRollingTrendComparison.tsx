import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Heart,
  Thermometer,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  Target,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  RefreshCw,
  Sun
} from 'lucide-react';
import { FacilityZone, HealthSignalNotificationThresholds } from '../types';
import {
  generate30DayWorkforceHealthMetrics,
  generateWorkforceHealthMetricsForRange,
  WorkforceHealth30DayDataPoint
} from '../services/workforceHealth30DaysService';
import { DateRangeSelection } from './DateRangePicker';

export type HealthSignalKey = 'hrv' | 'skinTemp' | 'heartRate' | 'twl' | 'healthScore';

interface SignalConfig {
  key: HealthSignalKey;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  color: string;
  colorDark: string;
  gradientStop: string;
  higherIsBetter: boolean;
  toleranceDelta: number;
  getBaseline: (zone: FacilityZone, thresholds?: HealthSignalNotificationThresholds) => number;
  getValue: (d: WorkforceHealth30DayDataPoint) => number;
  formatValue: (val: number) => string;
  evaluateDelta: (val: number, baseline: number) => {
    label: string;
    status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
    detail: string;
  };
}

const SIGNAL_CONFIGS: Record<HealthSignalKey, SignalConfig> = {
  hrv: {
    key: 'hrv',
    label: 'Heart Rate Variability (HRV - RMSSD)',
    shortLabel: 'HRV Autonomic',
    unit: 'ms',
    description: 'Parasympathetic tone & autonomic recovery. Prolonged drops below baseline indicate cumulative worker fatigue and thermal exhaustion.',
    color: '#06b6d4', // Cyan
    colorDark: '#083344',
    gradientStop: '#0891b2',
    higherIsBetter: true,
    toleranceDelta: 8.0,
    getBaseline: (zone) => zone.customBaselines?.baselineHrv ?? 68.0,
    getValue: (d) => d.avgHrv,
    formatValue: (v) => `${v.toFixed(1)} ms`,
    evaluateDelta: (val, baseline) => {
      const drop = baseline - val;
      if (drop > 15) {
        return { label: 'Severe Autonomic Drop', status: 'CRITICAL', detail: 'Significant parasympathetic deceleration >15ms below baseline. Heat fatigue protocol indicated.' };
      }
      if (drop > 8) {
        return { label: 'Moderate Vagal Suppression', status: 'ELEVATED', detail: 'Autonomic recovery suppressed below baseline tolerance band. Active monitoring.' };
      }
      return { label: 'Optimal Homeostatic Baseline', status: 'OPTIMAL', detail: 'Worker vagal autonomic recovery within normative baseline boundaries.' };
    }
  },
  skinTemp: {
    key: 'skinTemp',
    label: 'Core / Skin Temperature (Telemetry)',
    shortLabel: 'Skin Temp',
    unit: '°C',
    description: 'Continuous thermal storage indicator. Elevation above historical baseline indicates rising core heat strain and reduced convective cooling.',
    color: '#f43f5e', // Rose
    colorDark: '#4c0519',
    gradientStop: '#e11d48',
    higherIsBetter: false,
    toleranceDelta: 0.35,
    getBaseline: (zone) => zone.customBaselines?.baselineSkinTemp ?? 36.4,
    getValue: (d) => d.avgSkinTemp,
    formatValue: (v) => `${v.toFixed(2)} °C`,
    evaluateDelta: (val, baseline) => {
      const excess = val - baseline;
      if (excess > 0.8) {
        return { label: 'Acute Thermal Strain', status: 'CRITICAL', detail: 'Core/skin temperature +0.8°C above baseline. High hyperthermia risk.' };
      }
      if (excess > 0.35) {
        return { label: 'Elevated Heat Storage', status: 'ELEVATED', detail: 'Mild heat storage accumulation above historical normative envelope.' };
      }
      return { label: 'Normothermic Balance', status: 'OPTIMAL', detail: 'Thermal gradient and convective skin dissipation at steady-state baseline.' };
    }
  },
  heartRate: {
    key: 'heartRate',
    label: 'Mean Daily Heart Rate (Shift)',
    shortLabel: 'Heart Rate',
    unit: 'bpm',
    description: 'Cardiovascular exertion and metabolic workload. Elevated shift averages versus baseline indicate cardiovascular fatigue and thermal compensation.',
    color: '#f59e0b', // Amber
    colorDark: '#451a03',
    gradientStop: '#d97706',
    higherIsBetter: false,
    toleranceDelta: 6.0,
    getBaseline: () => 72.0,
    getValue: (d) => d.avgHeartRate,
    formatValue: (v) => `${v.toFixed(0)} bpm`,
    evaluateDelta: (val, baseline) => {
      const delta = val - baseline;
      if (delta > 14) {
        return { label: 'Tachycardic Cardiac Strain', status: 'CRITICAL', detail: 'Cardiovascular load sustained >14 bpm above historical shift baseline.' };
      }
      if (delta > 6) {
        return { label: 'Elevated Cardiac Exertion', status: 'ELEVATED', detail: 'Cardiac compensation for ambient heat and physical demand.' };
      }
      return { label: 'Stable Cardiovascular Rhythm', status: 'OPTIMAL', detail: 'Resting & shift cardiovascular rates within normative baseline parameters.' };
    }
  },
  twl: {
    key: 'twl',
    label: 'Thermal Work Limit (TWL Index)',
    shortLabel: 'Thermal Work Limit',
    unit: 'W/m²',
    description: 'Maximum continuous metabolic heat dissipation limit. Drops below baseline require mandatory work-rest cycles and hydration interventions.',
    color: '#10b981', // Emerald
    colorDark: '#022c22',
    gradientStop: '#059669',
    higherIsBetter: true,
    toleranceDelta: 18.0,
    getBaseline: () => 165.0,
    getValue: (d) => d.thermalWorkLimit,
    formatValue: (v) => `${v.toFixed(0)} W/m²`,
    evaluateDelta: (val, baseline) => {
      if (val < 115) {
        return { label: 'Mandatory Work-Rest Intervention', status: 'CRITICAL', detail: 'TWL < 115 W/m²: Environment cannot safely dissipate standard metabolic heat.' };
      }
      if (val < baseline - 18) {
        return { label: 'Constrained Evaporative Buffer', status: 'ELEVATED', detail: 'Environmental heat capacity reduced below standard operational baseline.' };
      }
      return { label: 'Unrestricted Work Capacity', status: 'OPTIMAL', detail: 'High evaporative cooling capacity sustaining continuous work rates.' };
    }
  },
  healthScore: {
    key: 'healthScore',
    label: 'Physiological Homeostasis Score',
    shortLabel: 'Homeostasis Index',
    unit: '%',
    description: 'Composite multi-signal resilience index (0-100%) synthesizing cardiac variability, thermal load, and sleep recovery.',
    color: '#818cf8', // Indigo
    colorDark: '#1e1b4b',
    gradientStop: '#6366f1',
    higherIsBetter: true,
    toleranceDelta: 6.0,
    getBaseline: () => 88.0,
    getValue: (d) => d.healthSafetyScore,
    formatValue: (v) => `${v.toFixed(1)}%`,
    evaluateDelta: (val, baseline) => {
      const drop = baseline - val;
      if (drop > 14 || val < 70) {
        return { label: 'Critical Physiological Distress', status: 'CRITICAL', detail: 'Multi-biomarker decompensation breaching composite safety tolerance.' };
      }
      if (drop > 6 || val < 82) {
        return { label: 'Moderate Resilience Depletion', status: 'ELEVATED', detail: 'Cumulative biological fatigue accumulating across the 30-day window.' };
      }
      return { label: 'Robust Adaptive Homeostasis', status: 'OPTIMAL', detail: 'Optimal physiological resilience and biological recovery capacity.' };
    }
  }
};

export interface D3HealthSignalRollingTrendComparisonProps {
  selectedZone: FacilityZone;
  zones?: FacilityZone[];
  thresholds?: HealthSignalNotificationThresholds;
  dateRange?: DateRangeSelection;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export default function D3HealthSignalRollingTrendComparison({
  selectedZone,
  zones = [],
  thresholds,
  dateRange,
  onSelectZone,
  className = ''
}: D3HealthSignalRollingTrendComparisonProps) {
  // Selected health signal to compare against baseline
  const [activeSignal, setActiveSignal] = useState<HealthSignalKey>('hrv');

  // Horizon filter: 30D (full month), 14D (bi-weekly), 7D (weekly)
  const [horizon, setHorizon] = useState<'30D' | '14D' | '7D'>('30D');

  // Visual toggle overlays
  const [showBaselineLine, setShowBaselineLine] = useState<boolean>(true);
  const [showToleranceBand, setShowToleranceBand] = useState<boolean>(true);
  const [showRollingMa, setShowRollingMa] = useState<boolean>(true);
  const [showDeviationRibbon, setShowDeviationRibbon] = useState<boolean>(true);

  // SVG & Tooltip interaction state
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(860);

  // Hover state for interactive D3 inspection
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    fullDate: string;
    dayOfWeek: string;
    val: number;
    rolling7d: number;
    baseline: number;
    variancePct: number;
    absoluteDiff: number;
    evaluation: { label: string; status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL'; detail: string };
    isWeekend: boolean;
    isHeatwave: boolean;
  } | null>(null);
  const [tooltipCoord, setTooltipCoord] = useState<{ x: number; y: number } | null>(null);

  // Responsive Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const config = SIGNAL_CONFIGS[activeSignal];
  const baselineValue = useMemo(() => config.getBaseline(selectedZone, thresholds), [config, selectedZone, thresholds]);

  // Generate 30 days of workforce health data
  const rawDataset = useMemo(() => {
    if (dateRange) {
      return generateWorkforceHealthMetricsForRange(
        selectedZone,
        thresholds,
        dateRange.daysCount,
        dateRange.startDate,
        dateRange.endDate
      ).data;
    }
    return generate30DayWorkforceHealthMetrics(selectedZone, thresholds).data;
  }, [selectedZone, thresholds, dateRange]);

  // Compute rolling statistics & filter by horizon
  const processedData = useMemo(() => {
    let sliced = rawDataset;
    if (horizon === '7D') {
      sliced = rawDataset.slice(-7);
    } else if (horizon === '14D') {
      sliced = rawDataset.slice(-14);
    }

    return sliced.map((pt, index, arr) => {
      const val = config.getValue(pt);

      // 7-day rolling window average
      const windowStart = Math.max(0, index - 6);
      const windowPoints = arr.slice(windowStart, index + 1);
      const rollingSum = windowPoints.reduce((acc, p) => acc + config.getValue(p), 0);
      const rolling7d = Number((rollingSum / windowPoints.length).toFixed(2));

      // 3-day rolling window average
      const window3Start = Math.max(0, index - 2);
      const window3Points = arr.slice(window3Start, index + 1);
      const rolling3d = Number((window3Points.reduce((acc, p) => acc + config.getValue(p), 0) / window3Points.length).toFixed(2));

      // Variance vs baseline
      const absoluteDiff = Number((val - baselineValue).toFixed(2));
      const variancePct = baselineValue !== 0 ? Number((((val - baselineValue) / baselineValue) * 100).toFixed(1)) : 0;
      const evaluation = config.evaluateDelta(val, baselineValue);

      // Baseline upper & lower tolerance boundaries
      const baselineUpper = Number((baselineValue + config.toleranceDelta).toFixed(2));
      const baselineLower = Number((Math.max(0, baselineValue - config.toleranceDelta)).toFixed(2));

      // Is value out of standard tolerance bounds?
      const isOutOfBand = config.higherIsBetter
        ? val < baselineLower
        : val > baselineUpper;

      return {
        ...pt,
        val,
        rolling7d,
        rolling3d,
        baseline: baselineValue,
        baselineUpper,
        baselineLower,
        absoluteDiff,
        variancePct,
        evaluation,
        isOutOfBand
      };
    });
  }, [rawDataset, horizon, config, baselineValue]);

  // Rolling Summary Statistics for KPI cards
  const summaryKpis = useMemo(() => {
    if (processedData.length === 0) {
      return {
        rollingMean: baselineValue,
        baseline: baselineValue,
        netVariancePct: 0,
        outOfBandCount: 0,
        maxDeviation: 0,
        trendDirection: 'STABLE' as 'IMPROVING' | 'DETERIORATING' | 'STABLE',
        recentTrajectoryDelta: 0
      };
    }

    const sumVal = processedData.reduce((acc, d) => acc + d.val, 0);
    const rollingMean = Number((sumVal / processedData.length).toFixed(2));
    const netVariancePct = baselineValue !== 0 ? Number((((rollingMean - baselineValue) / baselineValue) * 100).toFixed(1)) : 0;
    const outOfBandCount = processedData.filter((d) => d.isOutOfBand).length;

    // Largest deviation from baseline
    let maxDev = 0;
    processedData.forEach((d) => {
      const dev = Math.abs(d.variancePct);
      if (dev > maxDev) maxDev = dev;
    });

    // Trend trajectory: compare first third vs last third
    const chunk = Math.max(2, Math.floor(processedData.length / 3));
    const earlyChunk = processedData.slice(0, chunk);
    const recentChunk = processedData.slice(-chunk);
    const earlyMean = earlyChunk.reduce((a, b) => a + b.val, 0) / earlyChunk.length;
    const recentMean = recentChunk.reduce((a, b) => a + b.val, 0) / recentChunk.length;
    const trajectoryDelta = Number((recentMean - earlyMean).toFixed(2));

    let trendDirection: 'IMPROVING' | 'DETERIORATING' | 'STABLE' = 'STABLE';
    if (config.higherIsBetter) {
      if (trajectoryDelta > config.toleranceDelta * 0.4) trendDirection = 'IMPROVING';
      else if (trajectoryDelta < -config.toleranceDelta * 0.4) trendDirection = 'DETERIORATING';
    } else {
      if (trajectoryDelta < -config.toleranceDelta * 0.4) trendDirection = 'IMPROVING';
      else if (trajectoryDelta > config.toleranceDelta * 0.4) trendDirection = 'DETERIORATING';
    }

    return {
      rollingMean,
      baseline: baselineValue,
      netVariancePct,
      outOfBandCount,
      maxDeviation: Number(maxDev.toFixed(1)),
      trendDirection,
      recentTrajectoryDelta: trajectoryDelta
    };
  }, [processedData, baselineValue, config]);

  // Render D3 Visualization
  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const height = 360;
    const margin = { top: 32, right: 45, bottom: 42, left: 52 };
    const width = Math.max(340, containerWidth);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Definitions (Gradients, Clip Paths, Glow Filters)
    const defs = svg.append('defs');

    // Signal fill area gradient
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-health-signal-grad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', config.color).attr('stop-opacity', 0.28);
    areaGrad.append('stop').attr('offset', '85%').attr('stop-color', config.color).attr('stop-opacity', 0.04);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', config.color).attr('stop-opacity', 0.0);

    // Tolerance corridor gradient
    const corridorGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-corridor-band-grad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    corridorGrad.append('stop').attr('offset', '0%').attr('stop-color', '#334155').attr('stop-opacity', 0.22);
    corridorGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1e293b').attr('stop-opacity', 0.12);

    // Strain/Deviation ribbon gradient
    const deviationGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-deviation-grad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    deviationGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.35);
    deviationGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.05);

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'd3-signal-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.2').attr('result', 'blur');
    glowFilter.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', (d) => d);

    // Clip path for animated drawing
    const clipId = `d3-clip-${activeSignal}`;
    defs
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Main group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: scalePoint based on date labels
    const xScale = d3
      .scalePoint<string>()
      .domain(processedData.map((d) => d.date))
      .range([0, innerWidth])
      .padding(0.25);

    // Y Scale: compute domain including baseline, tolerance envelope, and daily values
    const allValues = processedData.map((d) => d.val);
    allValues.push(baselineValue);
    allValues.push(baselineValue + config.toleranceDelta);
    allValues.push(Math.max(0, baselineValue - config.toleranceDelta));
    processedData.forEach((d) => {
      allValues.push(d.rolling7d);
    });

    const minRaw = d3.min(allValues) ?? 0;
    const maxRaw = d3.max(allValues) ?? 100;
    const span = Math.max(1, maxRaw - minRaw);
    const domainPadding = span * 0.18;

    const yMin = Math.max(0, Number((minRaw - domainPadding).toFixed(1)));
    const yMax = Number((maxRaw + domainPadding).toFixed(1));

    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0]);

    // Background Grid Lines
    const yTicks = yScale.ticks(6);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // 1. Shaded Baseline Normal Tolerance Corridor (Envelope)
    if (showToleranceBand) {
      const upperY = yScale(baselineValue + config.toleranceDelta);
      const lowerY = yScale(Math.max(yMin, baselineValue - config.toleranceDelta));
      const bandHeight = Math.max(1, lowerY - upperY);

      g.append('rect')
        .attr('x', 0)
        .attr('y', upperY)
        .attr('width', innerWidth)
        .attr('height', bandHeight)
        .attr('fill', 'url(#d3-corridor-band-grad)')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.9);

      // Baseline corridor label
      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', upperY + 12)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`Baseline Normal Corridor (±${config.toleranceDelta}${config.unit})`);
    }

    // 2. Baseline Average Reference Line
    if (showBaselineLine) {
      const baselineY = yScale(baselineValue);

      // Dashed reference line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', baselineY)
        .attr('y2', baselineY)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1.75)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.85);

      // Baseline tag label
      const labelGroup = g.append('g').attr('transform', `translate(8, ${baselineY - 7})`);
      labelGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', -9)
        .attr('width', 175)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#090d16')
        .attr('stroke', '#475569')
        .attr('stroke-width', 0.75);

      labelGroup
        .append('text')
        .attr('x', 6)
        .attr('y', 2)
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`BASELINE AVG: ${baselineValue.toFixed(1)} ${config.unit}`);
    }

    // 3. Shaded Area Under Rolling Signal Path
    const areaGenerator = d3
      .area<(typeof processedData)[0]>()
      .x((d) => xScale(d.date) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(processedData)
      .attr('d', areaGenerator)
      .attr('fill', 'url(#d3-health-signal-grad)')
      .attr('clip-path', `url(#${clipId})`);

    // 4. Deviation Highlight Ribbon (shaded when signal drops below baseline if higher-is-better, or spikes above if lower-is-better)
    if (showDeviationRibbon) {
      const deviationArea = d3
        .area<(typeof processedData)[0]>()
        .x((d) => xScale(d.date) ?? 0)
        .y0((d) => yScale(baselineValue))
        .y1((d) => {
          if (config.higherIsBetter) {
            return d.val < baselineValue ? yScale(d.val) : yScale(baselineValue);
          } else {
            return d.val > baselineValue ? yScale(d.val) : yScale(baselineValue);
          }
        })
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(processedData)
        .attr('d', deviationArea)
        .attr('fill', 'url(#d3-deviation-grad)')
        .attr('clip-path', `url(#${clipId})`);
    }

    // 5. 7-Day Rolling Moving Average Line (Smoothed Trend)
    if (showRollingMa) {
      const maLineGenerator = d3
        .line<(typeof processedData)[0]>()
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.rolling7d))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(processedData)
        .attr('d', maLineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#a78bfa') // Soft purple
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.85)
        .attr('clip-path', `url(#${clipId})`);
    }

    // 6. Primary Rolling Daily Signal Stroke Line
    const lineGenerator = d3
      .line<(typeof processedData)[0]>()
      .x((d) => xScale(d.date) ?? 0)
      .y((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(processedData)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', config.color)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#d3-signal-glow)')
      .attr('clip-path', `url(#${clipId})`);

    // 7. Data Points: Highlight days with out-of-band strain or breaches
    processedData.forEach((d) => {
      const cx = xScale(d.date) ?? 0;
      const cy = yScale(d.val);

      if (d.isOutOfBand) {
        // Outer warning pulse ring
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 6.5)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.7);

        // Center breach node
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 3.5)
          .attr('fill', '#f43f5e')
          .attr('stroke', '#020617')
          .attr('stroke-width', 1);
      } else if (d.isWeekend) {
        // Small muted weekend marker
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 2)
          .attr('fill', '#64748b')
          .attr('opacity', 0.6);
      } else {
        // Standard signal node
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 2.8)
          .attr('fill', config.color)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1);
      }
    });

    // 8. Bottom X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(4)
      .tickFormat((dateStr) => {
        // Show all dates if 7D/14D; show every 2nd or 3rd date if 30D on smaller screens
        const idx = processedData.findIndex((d) => d.date === dateStr);
        if (horizon === '30D' && innerWidth < 680 && idx % 3 !== 0 && idx !== processedData.length - 1) {
          return '';
        }
        if (horizon === '30D' && innerWidth < 880 && idx % 2 !== 0 && idx !== processedData.length - 1) {
          return '';
        }
        return dateStr;
      });

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace');

    // 9. Left Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSize(4);
    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').attr('stroke', '#334155');
    yAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace');

    // Y Axis Unit Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .text(`${config.shortLabel} (${config.unit})`);

    // 10. Interactive Pointer Overlay & Crosshairs
    const focusGroup = g.append('g').style('display', 'none');

    // Vertical tracking crosshair line
    const focusLine = focusGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.25)
      .attr('stroke-dasharray', '3,3');

    // Highlight circle on signal
    const focusSignalCircle = focusGroup
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', config.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Highlight circle on baseline
    const focusBaselineCircle = focusGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#cbd5e1')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5);

    // Full tracking transparent overlay rectangle
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', () => {
        focusGroup.style('display', null);
      })
      .on('mouseleave', () => {
        focusGroup.style('display', 'none');
        setHoveredPoint(null);
        setTooltipCoord(null);
      })
      .on('mousemove', (event) => {
        const [pointerX] = d3.pointer(event);

        // Find nearest date point
        let nearestPoint = processedData[0];
        let minDistance = Infinity;

        processedData.forEach((d) => {
          const cx = xScale(d.date) ?? 0;
          const dist = Math.abs(cx - pointerX);
          if (dist < minDistance) {
            minDistance = dist;
            nearestPoint = d;
          }
        });

        if (nearestPoint) {
          const targetX = xScale(nearestPoint.date) ?? 0;
          const targetY = yScale(nearestPoint.val);
          const baselineY = yScale(baselineValue);

          focusLine.attr('x1', targetX).attr('x2', targetX);
          focusSignalCircle.attr('cx', targetX).attr('cy', targetY);
          focusBaselineCircle.attr('cx', targetX).attr('cy', baselineY);

          // Calculate global container tooltip position
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setTooltipCoord({
              x: targetX + margin.left,
              y: Math.min(targetY + margin.top, innerHeight - 40)
            });
          }

          setHoveredPoint({
            date: nearestPoint.date,
            fullDate: nearestPoint.fullDate,
            dayOfWeek: nearestPoint.dayOfWeek,
            val: nearestPoint.val,
            rolling7d: nearestPoint.rolling7d,
            baseline: baselineValue,
            variancePct: nearestPoint.variancePct,
            absoluteDiff: nearestPoint.absoluteDiff,
            evaluation: nearestPoint.evaluation,
            isWeekend: nearestPoint.isWeekend,
            isHeatwave: nearestPoint.isHeatwave
          });
        }
      });
  }, [
    processedData,
    activeSignal,
    config,
    baselineValue,
    containerWidth,
    horizon,
    showBaselineLine,
    showToleranceBand,
    showRollingMa,
    showDeviationRibbon
  ]);

  // Export rolling 30-day trend comparison data to CSV
  const handleExportCsv = useCallback(() => {
    const headers = [
      'Date',
      'DayOfWeek',
      'SignalName',
      'DailyMeasuredValue',
      'Unit',
      'Rolling7DayAverage',
      'HistoricalBaselineAverage',
      'BaselineLowerTolerance',
      'BaselineUpperTolerance',
      'VarianceFromBaselinePct',
      'AbsoluteVariance',
      'ComplianceStatus',
      'ClinicalInterpretation',
      'FacilityZone'
    ];

    const rows = processedData.map((d) => [
      d.fullDate,
      d.dayOfWeek,
      config.label,
      d.val,
      config.unit,
      d.rolling7d,
      baselineValue,
      d.baselineLower,
      d.baselineUpper,
      `${d.variancePct}%`,
      d.absoluteDiff,
      d.evaluation.status,
      `"${d.evaluation.label.replace(/"/g, '""')}"`,
      `"${selectedZone.name.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rolling30D_${activeSignal}_vs_Baseline_${selectedZone.id}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedData, config, baselineValue, selectedZone, activeSignal]);

  // Download SVG Vector Image
  const handleDownloadSvg = useCallback(() => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `D3_${activeSignal}_Trend_vs_Baseline_${new Date().toISOString().slice(0, 10)}.svg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeSignal]);

  return (
    <section
      aria-label="Rolling 30-Day Health Signals vs Baseline Trend Comparison"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Rolling 30-Day Health Signals vs. Baseline Averages
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/90 border border-cyan-800/80 px-2 py-0.5 rounded-sm">
                  D3.js Vector Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Longitudinal comparative analytics evaluating multi-day sensor telemetry drift against established cohort baselines and tolerance envelopes.
              </p>
            </div>
          </div>
        </div>

        {/* Global Facility Zone Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          {zones.length > 0 && onSelectZone && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Zone:</span>
              <select
                value={selectedZone.id}
                onChange={(e) => onSelectZone(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-hidden"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Controls */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition cursor-pointer"
            title="Export rolling comparison dataset to CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition cursor-pointer"
            title="Download vector graphic as SVG"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Signal Selection Segmented Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {/* Signal Selection Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 flex-wrap">
          {(Object.keys(SIGNAL_CONFIGS) as HealthSignalKey[]).map((sigKey) => {
            const sig = SIGNAL_CONFIGS[sigKey];
            const isActive = activeSignal === sigKey;

            return (
              <button
                key={sigKey}
                onClick={() => setActiveSignal(sigKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {sigKey === 'hrv' && <Activity className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />}
                {sigKey === 'skinTemp' && <Thermometer className={`h-3.5 w-3.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />}
                {sigKey === 'heartRate' && <Heart className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />}
                {sigKey === 'twl' && <Sun className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />}
                {sigKey === 'healthScore' && <Target className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />}
                <span>{sig.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Time Horizon Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(['30D', '14D', '7D'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                horizon === h
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {h === '30D' ? 'Rolling 30D' : h === '14D' ? '14 Days' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {/* Card 1: 30-Day Rolling Mean */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Rolling Mean ({horizon})
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {config.formatValue(summaryKpis.rollingMean)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg across active {processedData.length} days
          </div>
        </div>

        {/* Card 2: Historical Baseline Average */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Zone Baseline Average
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono mt-1">
            {config.formatValue(summaryKpis.baseline)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Tolerance: ±{config.toleranceDelta} {config.unit}
          </div>
        </div>

        {/* Card 3: Net Baseline Variance */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Net Baseline Variance
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${
              summaryKpis.netVariancePct === 0
                ? 'text-slate-300'
                : (config.higherIsBetter && summaryKpis.netVariancePct < 0) || (!config.higherIsBetter && summaryKpis.netVariancePct > 0)
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}
          >
            {summaryKpis.netVariancePct > 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{summaryKpis.netVariancePct > 0 ? `+${summaryKpis.netVariancePct}%` : `${summaryKpis.netVariancePct}%`}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Relative drift vs. baseline
          </div>
        </div>

        {/* Card 4: Days Out of Tolerance Corridor */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Out-of-Tolerance Days
          </div>
          <div className="text-xl font-bold font-mono mt-1 flex items-center gap-1.5">
            <span className={summaryKpis.outOfBandCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {summaryKpis.outOfBandCount}
            </span>
            <span className="text-xs text-slate-500">/ {processedData.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summaryKpis.outOfBandCount === 0 ? 'Nominal stability' : 'Exceeding tolerance corridor'}
          </div>
        </div>

        {/* Card 5: Trend Trajectory */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Longitudinal Trend
          </div>
          <div className="text-sm font-bold font-mono mt-2 flex items-center gap-1.5">
            {summaryKpis.trendDirection === 'IMPROVING' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Recovering</span>
              </span>
            ) : summaryKpis.trendDirection === 'DETERIORATING' ? (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                <span>Degrading</span>
              </span>
            ) : (
              <span className="text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Stationary</span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Trajectory Δ: {summaryKpis.recentTrajectoryDelta > 0 ? `+${summaryKpis.recentTrajectoryDelta}` : summaryKpis.recentTrajectoryDelta} {config.unit}
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles Strip */}
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showBaselineLine}
              onChange={(e) => setShowBaselineLine(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 border-b-2 border-dashed border-slate-300 inline-block"></span>
              <span>Baseline Average Line</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showToleranceBand}
              onChange={(e) => setShowToleranceBand(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-3 bg-slate-700/60 rounded-xs inline-block"></span>
              <span>Normal Tolerance Corridor</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showRollingMa}
              onChange={(e) => setShowRollingMa(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 border-b-2 border-dotted border-purple-400 inline-block"></span>
              <span>7-Day Rolling Trend (Smoothed)</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={showDeviationRibbon}
              onChange={(e) => setShowDeviationRibbon(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-3 bg-rose-500/30 rounded-xs inline-block"></span>
              <span>Highlight Adverse Divergence</span>
            </span>
          </label>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Interactive D3 Vector: Hover cursor to inspect date telemetry vs baseline
        </div>
      </div>

      {/* D3 Vector Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl border border-slate-800/80 p-2">
        <svg ref={svgRef} className="w-full block select-none" />

        {/* Rich Interactive Floating Tooltip */}
        {hoveredPoint && tooltipCoord && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-950/95 border border-slate-700 rounded-lg p-3 text-xs shadow-2xl backdrop-blur-md max-w-xs transition-all duration-75"
            style={{
              left: `${Math.min(tooltipCoord.x + 14, containerWidth - 260)}px`,
              top: `${Math.max(12, tooltipCoord.y - 45)}px`
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <div className="font-mono font-bold text-white flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-cyan-400" />
                <span>{hoveredPoint.fullDate}</span>
                <span className="text-slate-400 text-[10px]">({hoveredPoint.dayOfWeek})</span>
              </div>
              {hoveredPoint.isHeatwave && (
                <span className="text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-700/50 px-1.5 py-0.2 rounded">
                  Heatwave
                </span>
              )}
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Measured:</span>
                <span className="text-white font-bold" style={{ color: config.color }}>
                  {config.formatValue(hoveredPoint.val)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">7D Rolling MA:</span>
                <span className="text-purple-300 font-semibold">
                  {config.formatValue(hoveredPoint.rolling7d)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Baseline Average:</span>
                <span className="text-slate-300">
                  {config.formatValue(hoveredPoint.baseline)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400">Variance from Baseline:</span>
                <span
                  className={`font-bold ${
                    hoveredPoint.variancePct === 0
                      ? 'text-slate-300'
                      : (config.higherIsBetter && hoveredPoint.variancePct < 0) || (!config.higherIsBetter && hoveredPoint.variancePct > 0)
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {hoveredPoint.variancePct > 0 ? `+${hoveredPoint.variancePct}%` : `${hoveredPoint.variancePct}%`}
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    ({hoveredPoint.absoluteDiff > 0 ? `+${hoveredPoint.absoluteDiff}` : hoveredPoint.absoluteDiff} {config.unit})
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] leading-tight">
              <div
                className={`font-bold mb-0.5 ${
                  hoveredPoint.evaluation.status === 'CRITICAL'
                    ? 'text-rose-400'
                    : hoveredPoint.evaluation.status === 'ELEVATED'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                ● {hoveredPoint.evaluation.label}
              </div>
              <p className="text-slate-400">{hoveredPoint.evaluation.detail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }}></span>
            <span>Daily 30D Rolling Signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-4 border-b-2 border-dashed border-slate-300"></span>
            <span>Historical Baseline Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 bg-slate-700/60 rounded-xs"></span>
            <span>Normal Tolerance Envelope (±{config.toleranceDelta}{config.unit})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            <span>Corridor Breach Day</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500">
          Source: Azure IoT Wearable Telemetry &bull; ISO 45001 Baseline Reference Engine
        </div>
      </div>
    </section>
  );
}

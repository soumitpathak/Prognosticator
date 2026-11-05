import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  Clock,
  ShieldCheck,
  Eye,
  Sliders,
  Zap,
  Target,
  History,
  Maximize2
} from 'lucide-react';
import { AnomalyTrendDay, AnomalyTrendDayWithProjection, FacilityZone, ActiveAnomalyAlert, HealthSignalNotificationThresholds } from '../types';
import { AnomalyTrendSummaryStats } from '../services/anomalyTrend30DayService';

export interface D3AnomalyTrend30DaysChartProps {
  data: AnomalyTrendDayWithProjection[];
  summary: AnomalyTrendSummaryStats;
  currentZone: FacilityZone;
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onExportReport: (format: 'PDF' | 'CSV') => void;
  isExporting?: boolean;
  dailyFrequencyThreshold?: number;
  criticalFrequencyThreshold?: number;
  proactiveRiskThreshold?: number;
  sensitivityLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM';
  onOpenThresholdPanel?: () => void;
  onOpenCompliancePdfModal?: () => void;
}

export default function D3AnomalyTrend30DaysChart({
  data,
  summary,
  currentZone,
  zones,
  selectedZoneId,
  onSelectZone,
  onExportReport,
  isExporting = false,
  dailyFrequencyThreshold = 5,
  criticalFrequencyThreshold = 3,
  proactiveRiskThreshold = 5.5,
  sensitivityLevel = 'MEDIUM',
  onOpenThresholdPanel,
  onOpenCompliancePdfModal
}: D3AnomalyTrend30DaysChartProps) {
  // Horizon Filter: 7 Days, 14 Days, 30 Days
  const [horizon, setHorizon] = useState<'7D' | '14D' | '30D'>('30D');

  // Series visibility toggles
  const [showTotal, setShowTotal] = useState<boolean>(true);
  const [showCritical, setShowCritical] = useState<boolean>(true);
  const [showModerate, setShowModerate] = useState<boolean>(true);
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [showReferenceThreshold, setShowReferenceThreshold] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [showPrevPeriodComparison, setShowPrevPeriodComparison] = useState<boolean>(false);

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Selected Day Drilldown State
  const [selectedDay, setSelectedDay] = useState<AnomalyTrendDayWithProjection | null>(null);

  // Hover Tooltip State (managed by D3 interactions)
  const [hoveredDay, setHoveredDay] = useState<AnomalyTrendDayWithProjection | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // SVG & Container Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(900);

  // Filtered dataset according to selected horizon & forecast toggle
  const filteredData = useMemo(() => {
    let base = data;
    if (!showForecast) {
      base = data.filter((d) => !d.isProjected);
    }
    if (horizon === '7D') {
      return base.filter((d) => !d.isProjected).slice(-7);
    }
    if (horizon === '14D') {
      return base.filter((d) => !d.isProjected).slice(-14);
    }
    return base;
  }, [data, horizon, showForecast]);

  // Compute local slice stats
  const sliceStats = useMemo(() => {
    const historicalSlice = filteredData.filter((d) => !d.isProjected);
    const total = historicalSlice.reduce((acc, d) => acc + d.totalAnomalies, 0);
    const critical = historicalSlice.reduce((acc, d) => acc + d.criticalCount, 0);
    const mean = historicalSlice.length > 0 ? (total / historicalSlice.length).toFixed(1) : '0';
    return { total, critical, mean };
  }, [filteredData]);

  // Handle responsive resize of container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // D3 Rendering Pipeline
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || filteredData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const height = 340;
    const margin = { top: 25, right: 35, bottom: 45, left: 45 };
    const width = Math.max(320, containerWidth);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Definitions & Gradients
    const defs = svg.append('defs');

    // Forecast uncertainty band gradient
    const forecastGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-forecast-grad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    forecastGrad.append('stop').attr('offset', '0%').attr('stop-color', '#818cf8').attr('stop-opacity', 0.28);
    forecastGrad.append('stop').attr('offset', '100%').attr('stop-color', '#818cf8').attr('stop-opacity', 0.02);

    // Total series area gradient
    const totalAreaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-total-area-grad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    totalAreaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.18);
    totalAreaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Glow filter for highlighting lines
    const glowFilter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    glowFilter.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', (d) => d);

    // Root Group
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: scalePoint based on dates
    const xScale = d3
      .scalePoint<string>()
      .domain(filteredData.map((d) => d.date))
      .range([0, innerWidth])
      .padding(0.2);

    // Y Scale: scaleLinear based on max anomalies
    const maxVal = d3.max(filteredData, (d) => {
      let m = Math.max(d.totalAnomalies, d.projectedUpper || 0, dailyFrequencyThreshold, proactiveRiskThreshold);
      if (showCritical) m = Math.max(m, d.criticalCount);
      return m;
    }) || 14;

    const yScale = d3
      .scaleLinear()
      .domain([0, Math.ceil(maxVal * 1.15)])
      .nice()
      .range([innerHeight, 0]);

    // Background Horizontal Gridlines
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

    // Shaded 7-Day SMA Projection Window Region
    const projectedPoints = filteredData.filter((d) => d.isProjected);
    if (showForecast && projectedPoints.length >= 2) {
      const startX = xScale(projectedPoints[0].date) ?? 0;
      const endX = xScale(projectedPoints[projectedPoints.length - 1].date) ?? innerWidth;
      const rectWidth = Math.max(0, endX - startX);

      // Forecast background shade
      g.append('rect')
        .attr('x', startX)
        .attr('y', 0)
        .attr('width', rectWidth)
        .attr('height', innerHeight)
        .attr('fill', '#4338ca')
        .attr('fill-opacity', 0.12)
        .attr('stroke', '#6366f1')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');

      // Forecast label in top area
      g.append('text')
        .attr('x', startX + rectWidth / 2)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a5b4fc')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '600')
        .text('7-DAY SMA FORECAST WINDOW');

      // Area generator for Projected Upper Uncertainty Cone
      const forecastArea = d3
        .area<AnomalyTrendDayWithProjection>()
        .defined((d) => Boolean(d.isProjected && d.projectedUpper !== undefined))
        .x((d) => xScale(d.date) ?? 0)
        .y0((d) => yScale(d.projectedLower || 0))
        .y1((d) => yScale(d.projectedUpper || 0))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'url(#d3-forecast-grad)')
        .attr('d', forecastArea);
    }

    // Reference Thresholds
    if (showReferenceThreshold) {
      // 1. Action Benchmark Line (Red dashed)
      const actionY = yScale(dailyFrequencyThreshold);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', actionY)
        .attr('y2', actionY)
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '5,4');

      // Action Benchmark Badge Label
      g.append('text')
        .attr('x', 6)
        .attr('y', actionY - 5)
        .attr('fill', '#f43f5e')
        .attr('font-size', '9.5px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`Action Benchmark: ${dailyFrequencyThreshold}/day [${sensitivityLevel}]`);

      // 2. Critical Ceiling Line (Pink fine dashed)
      if (criticalFrequencyThreshold && showCritical) {
        const critY = yScale(criticalFrequencyThreshold);
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', critY)
          .attr('y2', critY)
          .attr('stroke', '#fb7185')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '2,3');

        g.append('text')
          .attr('x', innerWidth - 6)
          .attr('y', critY - 4)
          .attr('text-anchor', 'end')
          .attr('fill', '#fb7185')
          .attr('font-size', '9px')
          .attr('font-family', 'ui-monospace, monospace')
          .text(`Critical Ceiling: ${criticalFrequencyThreshold}/day`);
      }

      // 3. Proactive Risk Limit (Amber dashed)
      if (proactiveRiskThreshold != null) {
        const proY = yScale(proactiveRiskThreshold);
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', proY)
          .attr('y2', proY)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3');

        g.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', proY - 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f59e0b')
          .attr('font-size', '9px')
          .attr('font-weight', '600')
          .attr('font-family', 'ui-monospace, monospace')
          .text(`Proactive Risk Limit: ${proactiveRiskThreshold}/day`);
      }
    }

    // Line Generators
    // 1. Total Daily Anomalies Area & Line
    if (showTotal) {
      const totalArea = d3
        .area<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected)
        .x((d) => xScale(d.date) ?? 0)
        .y0(innerHeight)
        .y1((d) => yScale(d.totalAnomalies))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'url(#d3-total-area-grad)')
        .attr('d', totalArea);

      const totalLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected)
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.totalAnomalies))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2.6)
        .attr('filter', 'url(#d3-glow)')
        .attr('d', totalLine);

      // Total dots
      g.selectAll('.dot-total')
        .data(filteredData.filter((d) => !d.isProjected))
        .enter()
        .append('circle')
        .attr('class', 'dot-total')
        .attr('cx', (d) => xScale(d.date) ?? 0)
        .attr('cy', (d) => yScale(d.totalAnomalies))
        .attr('r', (d) => (d.totalAnomalies >= dailyFrequencyThreshold ? 4 : 3))
        .attr('fill', (d) => (d.totalAnomalies >= dailyFrequencyThreshold ? '#38bdf8' : '#06b6d4'))
        .attr('stroke', '#0891b2')
        .attr('stroke-width', 1.2);
    }

    // 2. Critical Severity Line (Rose)
    if (showCritical) {
      const critLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected)
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.criticalCount))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 2)
        .attr('d', critLine);

      g.selectAll('.dot-crit')
        .data(filteredData.filter((d) => !d.isProjected && d.criticalCount > 0))
        .enter()
        .append('circle')
        .attr('class', 'dot-crit')
        .attr('cx', (d) => xScale(d.date) ?? 0)
        .attr('cy', (d) => yScale(d.criticalCount))
        .attr('r', 2.8)
        .attr('fill', '#f43f5e')
        .attr('stroke', '#881337')
        .attr('stroke-width', 1);
    }

    // 3. Moderate Severity Line (Amber)
    if (showModerate) {
      const modLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected)
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.moderateCount))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.8)
        .attr('d', modLine);

      g.selectAll('.dot-mod')
        .data(filteredData.filter((d) => !d.isProjected && d.moderateCount > 0))
        .enter()
        .append('circle')
        .attr('class', 'dot-mod')
        .attr('cx', (d) => xScale(d.date) ?? 0)
        .attr('cy', (d) => yScale(d.moderateCount))
        .attr('r', 2.2)
        .attr('fill', '#f59e0b');
    }

    // 4. 7-Day Rolling Moving Average Line (Emerald Dashed)
    if (showMovingAvg) {
      const movLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected && d.movingAvg7d > 0)
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.movingAvg7d))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', movLine);
    }

    // 5. 7-Day SMA Projection Trend Line (Indigo Dashed with connected anchor)
    if (showForecast) {
      const forecastPoints = filteredData.filter((d) => d.projectedTrend !== undefined);
      if (forecastPoints.length > 0) {
        const projLine = d3
          .line<AnomalyTrendDayWithProjection>()
          .x((d) => xScale(d.date) ?? 0)
          .y((d) => yScale(d.projectedTrend || d.movingAvg7d))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(forecastPoints)
          .attr('fill', 'none')
          .attr('stroke', '#818cf8')
          .attr('stroke-width', 2.4)
          .attr('stroke-dasharray', '5,4')
          .attr('d', projLine);

        g.selectAll('.dot-proj')
          .data(forecastPoints)
          .enter()
          .append('circle')
          .attr('class', 'dot-proj')
          .attr('cx', (d) => xScale(d.date) ?? 0)
          .attr('cy', (d) => yScale(d.projectedTrend || d.movingAvg7d))
          .attr('r', 3.2)
          .attr('fill', '#818cf8')
          .attr('stroke', '#4338ca')
          .attr('stroke-width', 1.5);
      }
    }

    // 6. Mitigated / Resolved Line (Teal dotted)
    if (showResolved) {
      const resLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => !d.isProjected)
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.resolvedCount))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#2dd4bf')
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '2,2')
        .attr('d', resLine);
    }

    // 7. Cycle Over Cycle Previous 30-Day Line (Purple)
    if (showPrevPeriodComparison) {
      const prevLine = d3
        .line<AnomalyTrendDayWithProjection>()
        .defined((d) => Boolean(d.prevPeriodAnomalies !== undefined))
        .x((d) => xScale(d.date) ?? 0)
        .y((d) => yScale(d.prevPeriodAnomalies || 0))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', '#c084fc')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '4,3')
        .attr('d', prevLine);
    }

    // Bottom X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(4)
      .tickPadding(8)
      .tickFormat((d) => {
        // Density filter: for 30 days show every 2nd or 3rd tick on small screens
        if (horizon === '30D' && innerWidth < 600) {
          const idx = filteredData.findIndex((item) => item.date === d);
          return idx % 3 === 0 ? d : '';
        }
        if (horizon === '30D' && innerWidth < 900) {
          const idx = filteredData.findIndex((item) => item.date === d);
          return idx % 2 === 0 ? d : '';
        }
        return d;
      });

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    xAxisGroup.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10.5px');

    // Left Y-Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => `${d}`)
      .tickSize(4)
      .tickPadding(6);

    const yAxisGroup = g.append('g').call(yAxis);

    yAxisGroup.select('.domain').attr('stroke', '#334155');
    yAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yAxisGroup.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10.5px');

    // Y Axis Title Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -34)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .text('Daily Anomalies Count');

    // Interactive Hover Hairline & Crosshair Overlay
    const crosshair = g.append('line').attr('stroke', '#38bdf8').attr('stroke-width', 1).attr('stroke-dasharray', '3,3').attr('opacity', 0);

    const highlightCircle = g
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Overlay rect for pointer interactions
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);

        // Find nearest point
        let closestDist = Infinity;
        let closestItem = filteredData[0];

        filteredData.forEach((d) => {
          const px = xScale(d.date) ?? 0;
          const dist = Math.abs(px - mx);
          if (dist < closestDist) {
            closestDist = dist;
            closestItem = d;
          }
        });

        if (closestItem) {
          const cx = xScale(closestItem.date) ?? 0;
          const cy = yScale(closestItem.isProjected ? (closestItem.projectedTrend || 5) : closestItem.totalAnomalies);

          crosshair.attr('x1', cx).attr('x2', cx).attr('y1', 0).attr('y2', innerHeight).attr('opacity', 0.85);

          highlightCircle.attr('cx', cx).attr('cy', cy).attr('opacity', 1);

          setHoveredDay(closestItem);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        }
      })
      .on('mouseleave', () => {
        crosshair.attr('opacity', 0);
        highlightCircle.attr('opacity', 0);
        setHoveredDay(null);
        setTooltipPos(null);
      })
      .on('click', () => {
        if (hoveredDay) {
          setSelectedDay(hoveredDay);
        }
      });
  }, [
    filteredData,
    containerWidth,
    horizon,
    showTotal,
    showCritical,
    showModerate,
    showMovingAvg,
    showResolved,
    showForecast,
    showReferenceThreshold,
    showPrevPeriodComparison,
    dailyFrequencyThreshold,
    criticalFrequencyThreshold,
    proactiveRiskThreshold,
    sensitivityLevel
  ]);

  return (
    <div id="anomaly-trend-30d-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative" ref={containerRef}>
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-4 mb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">30-Day Anomaly Trend Frequency Intelligence</h2>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold shadow-xs">
                <Sparkles className="h-2.5 w-2.5 text-cyan-400" /> D3.js Vector Engine v7
              </span>
              <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-sm flex items-center gap-1 font-bold">
                <Target className="h-2.5 w-2.5 text-rose-400" />
                Action Threshold: {dailyFrequencyThreshold}/day ({sensitivityLevel})
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
                k-Anonymity Verified (N &ge; 12)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive D3.js vector visualization tracking longitudinal anomaly event frequencies, rolling moving averages, and 7-day predictive projections.
            </p>
          </div>
        </div>

        {/* Action Controls: Sensitivity, Zone Selector, Horizon, and Export Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {onOpenThresholdPanel && (
            <button
              onClick={onOpenThresholdPanel}
              className="flex items-center space-x-1.5 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-300 text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shadow-xs"
              title="Open Custom Anomaly Detection Thresholds Configuration Panel"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sensitivity ({dailyFrequencyThreshold}/day)</span>
            </button>
          )}

          {/* Zone Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
            <select
              value={selectedZoneId}
              onChange={(e) => onSelectZone(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Facility Zones (Combined Cohort)
              </option>
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="bg-slate-900 text-slate-200">
                  {z.name} ({z.count} workers)
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Pills */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['7D', '14D', '30D'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  horizon === h
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h === '7D' ? 'Last 7 Days' : h === '14D' ? 'Last 14 Days' : 'Full 30 Days'}
              </button>
            ))}
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              disabled={isExporting}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md border border-cyan-400/40 cursor-pointer disabled:opacity-50"
              title="Export anomaly report in formatted PDF or CSV for compliance reporting"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Export Dossier (Audit Logged)</span>
              <ChevronDown className={`h-3 w-3 text-white/80 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Export Formats &amp; Standards</span>
                    <span className="text-[10px] text-cyan-400 font-mono">ISO 45001</span>
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        if (onOpenCompliancePdfModal) {
                          onOpenCompliancePdfModal();
                        } else {
                          onExportReport('PDF');
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cyan-950/70 hover:text-cyan-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Formatted PDF Audit Dossier</div>
                          <div className="text-[10px] text-slate-400">Formal printable document with KPI tables</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">.pdf</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        onExportReport('CSV');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-950/70 hover:text-emerald-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Compliance CSV Report</div>
                          <div className="text-[10px] text-slate-400">RFC 4180 raw tabular dataset for audit logs</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">.csv</span>
                    </button>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-800 px-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>System Audit Trail</span>
                    <span className="text-emerald-400">Auto-Registered</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analytical KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Total Anomalies */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {horizon === '30D' ? 'Total 30D Anomalies' : `Total (${horizon})`}
            </span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {horizon === '30D' ? summary.totalAnomalies30d : sliceStats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span>Critical:</span>
            <strong className="text-rose-400">
              {horizon === '30D' ? summary.criticalAnomalies30d : sliceStats.critical}
            </strong>
            <span className="text-slate-600">|</span>
            <span>Mod:</span>
            <strong className="text-amber-400">
              {horizon === '30D' ? summary.moderateAnomalies30d : sliceStats.total - sliceStats.critical}
            </strong>
          </div>
        </div>

        {/* Daily Mean Frequency */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Daily Mean Frequency</span>
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300 mt-1">
            {horizon === '30D' ? `${summary.dailyMeanFrequency} / day` : `${sliceStats.mean} / day`}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">7-Day Moving Baseline</span>
        </div>

        {/* Peak Day Load */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Peak Anomaly Load</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {summary.peakDay.total} Events
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.peakDay.date} ({summary.peakDay.critical} Critical)
          </span>
        </div>

        {/* 14-Day Trajectory */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">14D Trajectory Shift</span>
            {summary.trendComparisonPct <= 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
            )}
          </div>
          <div
            className={`text-xl font-bold mt-1 ${
              summary.trendComparisonPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.trendComparisonPct > 0 ? `+${summary.trendComparisonPct}%` : `${summary.trendComparisonPct}%`}
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.trendComparisonPct <= 0 ? 'Cooling Protocol Efficacy' : 'Elevated Thermal Load'}
          </span>
        </div>

        {/* Mitigation Resolution Rate */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Mitigation Resolution</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {summary.mitigationResolutionRate}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Rest/Hydration Staged</span>
        </div>
      </div>

      {/* Series Toggle Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Active D3 Series:</span>
          <button
            onClick={() => setShowTotal((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showTotal
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>Total Daily Anomalies</span>
          </button>

          <button
            onClick={() => setShowCritical((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showCritical
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>Critical Severity</span>
          </button>

          <button
            onClick={() => setShowModerate((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showModerate
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Moderate Severity</span>
          </button>

          <button
            onClick={() => setShowMovingAvg((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showMovingAvg
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>7-Day Moving Avg</span>
          </button>

          <button
            onClick={() => setShowForecast((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showForecast
                ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/60 shadow-xs ring-1 ring-indigo-500/30 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>7-Day SMA Projection Window</span>
          </button>

          <button
            onClick={() => setShowResolved((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showResolved
                ? 'bg-teal-950/80 text-teal-300 border-teal-500/50 shadow-xs'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            <span>Mitigated / Resolved</span>
          </button>

          <button
            onClick={() => setShowPrevPeriodComparison((v) => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
              showPrevPeriodComparison
                ? 'bg-purple-950/90 text-purple-300 border-purple-500/60 shadow-xs ring-1 ring-purple-500/30 font-bold'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle previous 30-day comparative baseline curve"
          >
            <History className="h-3 w-3 text-purple-400" />
            <span>Prior 30D Comparison</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showReferenceThreshold}
              onChange={(e) => setShowReferenceThreshold(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Visual Benchmark ({dailyFrequencyThreshold}/day)</span>
          </label>
        </div>
      </div>

      {/* Main D3 SVG Container with Hairline Crosshair & Glass Tooltip */}
      <div className="w-full bg-slate-950/90 rounded-xl p-2 sm:p-3 border border-slate-800 relative overflow-hidden">
        <svg ref={svgRef} className="w-full overflow-visible select-none" />

        {/* Floating Glass Tooltip */}
        {hoveredDay && tooltipPos && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[240px] max-w-[300px] transition-transform duration-75"
            style={{
              left: Math.min(Math.max(10, tooltipPos.x - 120), containerWidth - 280),
              top: Math.max(10, tooltipPos.y - 170)
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>{hoveredDay.fullDate} ({hoveredDay.dayOfWeek})</span>
              </div>
              {hoveredDay.isProjected ? (
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold">
                  SMA PROJECTION
                </span>
              ) : hoveredDay.isHeatwavePeriod ? (
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-700 px-1.5 py-0.2 rounded font-bold animate-pulse">
                  HEATWAVE
                </span>
              ) : null}
            </div>

            {hoveredDay.isProjected ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Projected Anomaly Frequency:</span>
                  <span className="font-bold text-indigo-300 font-mono">~{hoveredDay.projectedTrend} / day</span>
                </div>
                <div className="flex justify-between items-center text-indigo-200">
                  <span className="text-slate-400">Uncertainty Range:</span>
                  <span className="font-mono">{hoveredDay.projectedLower} – {hoveredDay.projectedUpper} events</span>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span className="text-slate-400">Projection Confidence:</span>
                  <span className="font-mono">{hoveredDay.projectedConfidence}%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Anomalies:</span>
                  <span className="font-bold text-cyan-300 font-mono text-sm">{hoveredDay.totalAnomalies}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span> Critical:
                  </span>
                  <span className="font-mono font-semibold">{hoveredDay.criticalCount}</span>
                </div>
                <div className="flex justify-between items-center text-amber-300">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Moderate:
                  </span>
                  <span className="font-mono font-semibold">{hoveredDay.moderateCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">7-Day Moving Avg:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{hoveredDay.movingAvg7d} / day</span>
                </div>
                <div className="bg-slate-950/70 p-1.5 rounded mt-1 border border-slate-800/80 text-[10.5px]">
                  <span className="text-slate-400">Driver: </span>
                  <strong className="text-slate-200">{hoveredDay.primaryDriver}</strong>
                </div>
              </div>
            )}
            <div className="mt-1.5 text-[9.5px] text-cyan-400/80 font-mono text-center">
              Click data point to pin full diagnostic focus
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Drilldown Inspection Box */}
      {selectedDay && (
        <div className="mt-4 bg-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-lg animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 mb-2.5 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                Detailed Day Inspection: {selectedDay.fullDate} ({selectedDay.dayOfWeek})
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {selectedDay.totalAnomalies} Total Incidents
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800"
            >
              Close Focus &times;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Primary Incident Attribution:</span>
              <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span>{selectedDay.primaryDriver}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Peak Hazard Exposure Window: <strong className="text-slate-200">{selectedDay.peakHour}</strong>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Environmental &amp; Physiological Load:</span>
              <div className="flex items-center justify-between text-slate-200 mt-1">
                <span>Ambient Average:</span>
                <strong className="text-amber-400">{selectedDay.avgAmbientTempC}°C</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Cohort Mean HRV:</span>
                <strong className="text-emerald-400">{selectedDay.avgHrvMs} ms</strong>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Operational Triage Resolution:</span>
              <div className="flex items-center justify-between text-slate-200 mt-1">
                <span>Critical Evacuations:</span>
                <strong className="text-rose-400">{selectedDay.criticalCount} staged</strong>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Rest Stabilizations:</span>
                <strong className="text-emerald-400">{selectedDay.resolvedCount} verified</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info: Non-punitive and k-Anonymity Note */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/80 pt-2.5 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>D3 Vector Pipeline: Scaled to cohort data with k-Anonymity (N &ge; 12) &amp; ISO 45001 compliance.</span>
        </div>
        <div>
          <span>Tip: Hover along the curve or click any node to pin environmental diagnostics.</span>
        </div>
      </div>
    </div>
  );
}

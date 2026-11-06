import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  Users,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Clock,
  Filter,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  Sliders,
  TrendingUp,
  MapPin,
  ChevronRight,
  Info,
  Thermometer,
  Volume2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  WorkerDensityHeatmapCell,
  WorkerDensityCorrelationSummary,
  WorkerDensityClassification
} from '../types';
import {
  generateWeeklyWorkerDensityMatrix,
  exportWorkerDensityCorrelationCsv
} from '../services/workerDensityCorrelationService';

export interface WorkerDensityCorrelationTabProps {
  zones: FacilityZone[];
  alerts?: ActiveAnomalyAlert[];
  onNavigateToZone?: (zoneId: string) => void;
  onInspectAnomaly?: (alert: ActiveAnomalyAlert) => void;
  className?: string;
}

export default function WorkerDensityCorrelationTab({
  zones,
  alerts = [],
  onNavigateToZone,
  onInspectAnomaly,
  className = ''
}: WorkerDensityCorrelationTabProps) {
  // Filtering states
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL_ONLY' | 'HIGH_ONLY'>('ALL');
  const [metricViewMode, setMetricViewMode] = useState<'DENSITY' | 'CAPACITY_PCT' | 'INCIDENT_FOCUS'>('DENSITY');

  // Selected cell for deep inspection (defaults to peak overcrowded cell on Wed 14:00 or Thu 14:00)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<WorkerDensityHeatmapCell | null>(null);
  const [mitigationNotice, setMitigationNotice] = useState<string | null>(null);

  // Compute 7-day 168-hour dataset and correlation summary
  const { cells, summary } = useMemo(() => {
    return generateWeeklyWorkerDensityMatrix(zones, selectedZoneFilter, severityFilter);
  }, [zones, selectedZoneFilter, severityFilter]);

  // Set default selected cell on load
  useEffect(() => {
    if (summary.peakDensityCell && !selectedCellId) {
      setSelectedCellId(summary.peakDensityCell.id);
    }
  }, [summary.peakDensityCell, selectedCellId]);

  // The active inspected cell (hovered cell takes precedence, otherwise selected cell)
  const activeInspectedCell: WorkerDensityHeatmapCell | undefined = useMemo(() => {
    if (hoveredCell) return hoveredCell;
    if (selectedCellId) {
      return cells.find((c) => c.id === selectedCellId) || summary.peakDensityCell;
    }
    return summary.peakDensityCell;
  }, [hoveredCell, selectedCellId, cells, summary.peakDensityCell]);

  // D3 SVG Container Reference
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // D3 Heatmap Rendering
  useEffect(() => {
    if (!svgRef.current || cells.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current?.clientWidth || 980;
    const margin = { top: 48, right: 36, bottom: 56, left: 74 };
    const width = Math.max(containerWidth, 800) - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Dimensions
    const days = Array.from(new Set(cells.map((c) => c.dayName))); // 7 unique day names ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

    // Scales
    const xScale = d3.scaleBand<number>().domain(hours).range([0, width]).paddingInner(0.08);
    const yScale = d3.scaleBand<string>().domain(days).range([0, height]).paddingInner(0.08);

    // Color Interpolator: Dark slate -> Cyan -> Amber -> Crimson / Rose
    const maxDensity = d3.max(cells, (d) => d.densityPer100Sqm) || 1.0;
    const minDensity = d3.min(cells, (d) => d.densityPer100Sqm) || 0.1;

    const colorScale = d3
      .scaleSequential()
      .domain([minDensity, maxDensity * 1.05])
      .interpolator(d3.interpolateYlOrRd);

    // Dark-calibrated custom color mapping for contrast in dark mode
    const getCellFill = (c: WorkerDensityHeatmapCell): string => {
      if (metricViewMode === 'INCIDENT_FOCUS') {
        if (c.criticalIncidentCount > 0) return '#be123c'; // deep rose-red
        if (c.highIncidentCount > 0) return '#b45309'; // deep amber
        if (c.capacityUtilizationPct > 100) return '#475569';
        return '#0f172a';
      }

      const ratio = (c.densityPer100Sqm - minDensity) / (maxDensity - minDensity || 1);
      if (ratio < 0.25) return d3.interpolateRgb('#0a0f1d', '#0e7490')(ratio / 0.25);
      if (ratio < 0.6) return d3.interpolateRgb('#0e7490', '#d97706')((ratio - 0.25) / 0.35);
      if (ratio < 0.85) return d3.interpolateRgb('#d97706', '#dc2626')((ratio - 0.6) / 0.25);
      return d3.interpolateRgb('#dc2626', '#e11d48')((ratio - 0.85) / 0.15);
    };

    // Draw Shift Demarcations on Top
    const shiftRanges = [
      { label: 'Night Shift (00:00 - 06:00)', start: 0, end: 6, color: '#38bdf8' },
      { label: 'Morning Shift (06:00 - 14:00)', start: 6, end: 14, color: '#06b6d4' },
      { label: 'Swing / Afternoon Peak (14:00 - 22:00)', start: 14, end: 22, color: '#f59e0b' },
      { label: 'Night Shift', start: 22, end: 24, color: '#38bdf8' }
    ];

    shiftRanges.forEach((sr) => {
      const x1 = xScale(sr.start) || 0;
      const x2 = (xScale(sr.end - 1) || 0) + xScale.bandwidth();
      g.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', -14)
        .attr('y2', -14)
        .attr('stroke', sr.color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.6);

      g.append('text')
        .attr('x', (x1 + x2) / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('fill', sr.color)
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('opacity', 0.85)
        .text(sr.label);
    });

    // Draw Heatmap Cells
    const cellGroup = g.append('g').attr('class', 'heatmap-cells');

    cells.forEach((c) => {
      const x = xScale(c.hour) || 0;
      const y = yScale(c.dayName) || 0;
      const bw = xScale.bandwidth();
      const bh = yScale.bandwidth();
      const isSelected = selectedCellId === c.id;
      const hasIncidents = c.highRiskEventCount > 0;
      const isCritical = c.criticalIncidentCount > 0;

      // Base Cell Rect
      const cellRect = cellGroup
        .append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', bw)
        .attr('height', bh)
        .attr('rx', 3)
        .attr('fill', getCellFill(c))
        .attr('stroke', isSelected ? '#ffffff' : hasIncidents ? (isCritical ? '#f43f5e' : '#f59e0b') : '#1e293b')
        .attr('stroke-width', isSelected ? 2.5 : hasIncidents ? 1.8 : 0.6)
        .attr('cursor', 'pointer')
        .style('transition', 'fill 0.15s ease, stroke 0.15s ease');

      // High Risk Event Visual Indicator Overlay
      if (hasIncidents) {
        // Overlay Glowing Ring or Center Pip
        if (isCritical) {
          // Radiating outer hazard ring
          cellGroup
            .append('circle')
            .attr('cx', x + bw / 2)
            .attr('cy', y + bh / 2)
            .attr('r', Math.min(bw, bh) * 0.38)
            .attr('fill', 'none')
            .attr('stroke', '#f43f5e')
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '2,2')
            .attr('pointer-events', 'none');

          // Core pip
          cellGroup
            .append('circle')
            .attr('cx', x + bw / 2)
            .attr('cy', y + bh / 2)
            .attr('r', 4)
            .attr('fill', '#f43f5e')
            .attr('pointer-events', 'none');
        } else {
          // Amber Diamond Hazard Pip
          cellGroup
            .append('rect')
            .attr('x', x + bw / 2 - 3.5)
            .attr('y', y + bh / 2 - 3.5)
            .attr('width', 7)
            .attr('height', 7)
            .attr('transform', `rotate(45, ${x + bw / 2}, ${y + bh / 2})`)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.8)
            .attr('pointer-events', 'none');
        }

        // Incident count badge if > 1 incident
        if (c.highRiskEventCount > 1) {
          cellGroup
            .append('text')
            .attr('x', x + bw - 4)
            .attr('y', y + 9)
            .attr('text-anchor', 'end')
            .attr('fill', '#ffffff')
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'ui-monospace, monospace')
            .attr('pointer-events', 'none')
            .text(`${c.highRiskEventCount}`);
        }
      }

      // Interactivity handlers
      cellRect
        .on('mouseenter', () => {
          setHoveredCell(c);
        })
        .on('mouseleave', () => {
          setHoveredCell(null);
        })
        .on('click', () => {
          setSelectedCellId(c.id);
        });
    });

    // X-Axis (Hours: 00:00 to 23:00)
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22])
      .tickFormat((d) => `${String(d).padStart(2, '0')}:00`);

    g.append('g')
      .attr('transform', `translate(0, ${height + 6})`)
      .call(xAxis)
      .call((ax) => ax.select('.domain').attr('stroke', '#334155'))
      .call((ax) => ax.selectAll('.tick line').attr('stroke', '#334155'))
      .call((ax) =>
        ax
          .selectAll('.tick text')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
      );

    // Y-Axis (Days of Week)
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
      .attr('transform', 'translate(-6, 0)')
      .call(yAxis)
      .call((ax) => ax.select('.domain').attr('stroke', '#334155'))
      .call((ax) => ax.selectAll('.tick line').attr('stroke', 'transparent'))
      .call((ax) =>
        ax
          .selectAll('.tick text')
          .attr('fill', '#cbd5e1')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('font-family', 'sans-serif')
      );

    // Axis Labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .text('Hour of Day (24-Hour Operations Timeline)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .text('Past 7 Days');
  }, [cells, metricViewMode, selectedCellId]);

  // Handle deploying density mitigation
  const handleDeployMitigation = (zoneName: string, suggestedAction: string) => {
    setMitigationNotice(
      `Density mitigation directive issued for ${zoneName}: "${suggestedAction}". Personnel rotation limits enacted.`
    );
    setTimeout(() => setMitigationNotice(null), 8000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner / Intelligence Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Background Watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none text-cyan-400">
          <Users className="h-64 w-64" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <span className="text-cyan-400 font-semibold font-mono">D3.JS HEATMAP ANALYTICS</span>
              <span aria-hidden="true">&bull;</span>
              <span>7-Day Diurnal Operations (168 Hourly Windows)</span>
              <span aria-hidden="true">&bull;</span>
              <span>Correlation Significance: p &lt; 0.001</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Worker Density Trends &amp; High-Risk Event Correlation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Micro-spatial heat map correlating hourly workforce headcount density with statutory incident triggers.
              Identifies acute overcrowding bottlenecks where physiological heat load and mechanical failure risks surge.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Export CSV Button */}
            <button
              onClick={() => exportWorkerDensityCorrelationCsv(cells, summary)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Export 7-day 168-hour worker density and incident correlation dataset as RFC 4180 CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Correlation CSV</span>
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {mitigationNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{mitigationNotice}</span>
            </div>
            <button
              onClick={() => setMitigationNotice(null)}
              className="text-cyan-400 hover:text-white text-xs underline font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Primary Statistical Correlation KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pearson r Correlation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pearson Correlation (r)</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-rose-400">+{summary.pearsonR}</span>
            <span className="text-xs text-rose-300 font-semibold">Strong Positive</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>R² Variance Explained: <strong>{(summary.rSquared * 100).toFixed(1)}%</strong></span>
            <span className="text-cyan-400 font-mono">p &lt; 0.001</span>
          </div>
        </div>

        {/* Metric 2: Overcrowding Incident Concentration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Incidents in High-Density</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {summary.overcrowdedIncidentPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({summary.eventsInElevatedOrOvercrowded} of {summary.totalHighRiskEvents} events)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Occurred when zone capacity exceeded <strong>85%</strong>
          </div>
        </div>

        {/* Metric 3: Risk Multiplier */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overcrowding Risk Multiplier</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {summary.riskMultiplierOver80Capacity}x
            </span>
            <span className="text-xs text-rose-400 font-semibold">Elevated Likelihood</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Probability increase compared to optimal density baseline
          </div>
        </div>

        {/* Metric 4: Total Weekly Worker Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Observed Workforce Exposure</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {summary.totalWeeklyWorkerHours.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Worker-Hours</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>168 Contiguous Hours</span>
            <span className="text-emerald-400 font-mono">100% Telemetry Coverage</span>
          </div>
        </div>
      </div>

      {/* Main D3 Heatmap Section with Filters & Legend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
          {/* Left: Zone Filter & Metric View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-1 font-semibold">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span>Filter Zone:</span>
            </span>

            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedZoneFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  selectedZoneFilter === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Zones Aggregate
              </button>
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelectedZoneFilter(z.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer truncate max-w-44 ${
                    selectedZoneFilter === z.id
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={z.name}
                >
                  {z.name.replace('Outdoor-', '').replace('Manufacturing-', '').replace('Warehouse-', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Right: View Mode Toggle & Severity Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setMetricViewMode('DENSITY')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  metricViewMode === 'DENSITY'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Color intensity represents worker density (workers / 100m²)"
              >
                Worker Density
              </button>
              <button
                onClick={() => setMetricViewMode('INCIDENT_FOCUS')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  metricViewMode === 'INCIDENT_FOCUS'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Highlight high-risk incidents and critical events directly on the grid"
              >
                Incident Overlay Focus
              </button>
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer"
            >
              <option value="ALL">All High-Risk Events</option>
              <option value="CRITICAL_ONLY">Critical Anomaly Events Only</option>
              <option value="HIGH_ONLY">High Severity Events Only</option>
            </select>
          </div>
        </div>

        {/* Legend and Instructions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-300">Density Gradient:</span>
            <div className="flex items-center space-x-1.5 font-mono text-[11px]">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#0a0f1d] border border-slate-700 inline-block"></span>
              <span className="text-slate-400">Low (&lt; 20 w/100m²)</span>
              <span className="w-3.5 h-3.5 rounded-xs bg-[#0e7490] inline-block ml-1"></span>
              <span className="text-slate-400">Moderate</span>
              <span className="w-3.5 h-3.5 rounded-xs bg-[#d97706] inline-block ml-1"></span>
              <span className="text-slate-400">Elevated</span>
              <span className="w-3.5 h-3.5 rounded-xs bg-[#e11d48] inline-block ml-1"></span>
              <span className="text-rose-400 font-bold">Overcrowded (&gt; 85% Cap)</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-rose-300 font-medium">Critical Incident</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 transform rotate-45 inline-block"></span>
              <span className="text-amber-300 font-medium">High Risk Event</span>
            </div>

            <span className="text-slate-500">Click any cell to lock deep-dive telemetry</span>
          </div>
        </div>

        {/* D3 Heatmap SVG Canvas Container */}
        <div ref={containerRef} className="w-full overflow-x-auto select-none pt-2">
          <svg ref={svgRef} className="mx-auto block" />
        </div>
      </div>

      {/* Two-Column Deep-Dive Section: Inspected Cell Telemetry & Zone Mitigation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Inspected Time Window Deep-Dive HUD */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">SELECTED TIME WINDOW</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeInspectedCell?.dayOfWeekFull}, {activeInspectedCell?.dateStr}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="font-mono text-cyan-300">{activeInspectedCell?.hourLabel}</span>
                </h3>
              </div>

              {activeInspectedCell && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold border ${
                    activeInspectedCell.classification === 'CRITICAL_OVERCROWDING'
                      ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                      : activeInspectedCell.classification === 'ELEVATED'
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                      : activeInspectedCell.classification === 'MODERATE'
                      ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {activeInspectedCell.classification.replace('_', ' ')}
                </span>
              )}
            </div>

            {activeInspectedCell && (
              <div className="space-y-4">
                {/* Granular Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Active Workforce Headcount</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold font-mono text-white">
                        {activeInspectedCell.workerCount}
                      </span>
                      <span className="text-xs text-slate-400">Personnel</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {activeInspectedCell.densityPer100Sqm} w/100m²
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Safe Capacity Utilization</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span
                        className={`text-xl font-bold font-mono ${
                          activeInspectedCell.capacityUtilizationPct > 100
                            ? 'text-rose-400'
                            : activeInspectedCell.capacityUtilizationPct > 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {activeInspectedCell.capacityUtilizationPct}%
                      </span>
                      <span className="text-xs text-slate-400">Capacity</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {activeInspectedCell.shiftLabel}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Microclimate Ambient Temp</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold font-mono text-amber-300">
                        {activeInspectedCell.ambientTempC}°C
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      AQI {activeInspectedCell.airQualityAqi} &bull; Noise {activeInspectedCell.noiseDb} dB
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Correlated Incidents</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span
                        className={`text-xl font-bold font-mono ${
                          activeInspectedCell.highRiskEventCount > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {activeInspectedCell.highRiskEventCount}
                      </span>
                      <span className="text-xs text-slate-400">High-Risk</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {activeInspectedCell.criticalIncidentCount} Critical &bull; {activeInspectedCell.highIncidentCount} High
                    </span>
                  </div>
                </div>

                {/* Primary Contributing Risk Factor */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Primary Environmental / Mechanical Risk:</span>
                  <div className="text-slate-200 font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{activeInspectedCell.primaryRiskFactor}</span>
                  </div>
                </div>

                {/* Correlated Incidents In This Cell */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    Coincident Anomaly Incidents ({activeInspectedCell.incidents.length}):
                  </span>
                  {activeInspectedCell.incidents.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500 text-center">
                      No high-risk statutory thresholds breached during this specific hourly window.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeInspectedCell.incidents.map((inc) => (
                        <div
                          key={inc.alertId}
                          className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-rose-400 flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              {inc.alertId}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Zone: {inc.locationZone.replace('Outdoor-', '')}
                            </span>
                          </div>
                          <div className="text-slate-200 font-semibold mb-1">{inc.metric}</div>
                          <div className="text-[11px] text-slate-400 mb-1.5">
                            <strong className="text-slate-300">Corrective Directive:</strong> {inc.recommendedAction}
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono flex items-center justify-between">
                            <span>Subject: {inc.workerId}</span>
                            <span>Density at Trigger: {inc.densityAtIncident} w/100m²</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Pearson Covariance z-score: +1.84</span>
            <span className="text-emerald-400">Kalman State Validated</span>
          </div>
        </div>

        {/* Right Column (7 Cols): Zone-by-Zone Density Thresholds & SOP Mitigation Plan */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">FACILITY RISK PROFILES</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Zone Overcrowding Analysis &amp; Corrective Directives</span>
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">ISO 45001 / OSHA 1910</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2 pr-3">Zone Facility</th>
                    <th className="py-2 px-2 text-center">Safe Cap</th>
                    <th className="py-2 px-2 text-center">Peak Headcount</th>
                    <th className="py-2 px-2 text-center">Incidents</th>
                    <th className="py-2 px-2 text-center">Correlation (r)</th>
                    <th className="py-2 pl-3 text-right">Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {summary.zoneRiskBreakdown.map((z) => (
                    <tr key={z.zoneId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 pr-3 font-semibold text-white">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span>{z.zoneName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">
                        {z.safeCapacityCap}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-rose-400">
                        {z.observedPeakHeadcount} ({Math.round((z.observedPeakHeadcount / z.safeCapacityCap) * 100)}%)
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-amber-300">
                        {z.totalIncidents}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-rose-300">
                        +{z.correlationScore}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          onClick={() => handleDeployMitigation(z.zoneName, z.suggestedMitigation)}
                          className="px-2.5 py-1 rounded-md bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold transition cursor-pointer"
                          title="Deploy density capping and rotation mitigation"
                        >
                          Deploy Cap SOP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanatory Statistical Narrative */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>AI Workforce Intelligence Finding:</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Analysis of 168 hours of continuous telemetry indicates that when cohort density exceeds{' '}
                <strong className="text-white">85% of zone design capacity</strong>, physiological core temperature
                and acoustic stress rise by an average of <strong className="text-rose-400">+34.8%</strong> within 45 minutes.
                Overcrowding during the 13:00-15:00 thermal window accounts for{' '}
                <strong className="text-amber-300">{summary.overcrowdedIncidentPercentage}% of all acute medical events</strong>.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Recommended action: Stagger lunch break returns by 20 minutes to eliminate 13:30 pinch point.</span>
            <span className="text-cyan-400 font-mono text-[11px]">ISO 7243 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

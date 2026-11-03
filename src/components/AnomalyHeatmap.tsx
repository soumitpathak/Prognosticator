import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Calendar, Filter, Sparkles, AlertCircle, Info } from 'lucide-react';

export interface HeatmapCellData {
  day: string;
  dayIndex: number;
  timeSlot: string;
  timeSlotIndex: number;
  zone: string;
  count: number;
  criticalCount: number;
  primaryHazard: string;
  avgHeatIndex: number;
}

interface AnomalyHeatmapProps {
  onSelectCell?: (cell: HeatmapCellData) => void;
}

export default function AnomalyHeatmap({ onSelectCell }: AnomalyHeatmapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = [
    '00:00 - 04:00 (Night Shift)',
    '04:00 - 08:00 (Dawn Shift)',
    '08:00 - 12:00 (Morning Shift)',
    '12:00 - 16:00 (Peak Thermal Shift)',
    '16:00 - 20:00 (Evening Shift)',
    '20:00 - 24:00 (Night Handover)'
  ];

  // Generate deterministic past week heatmap dataset
  const generateWeeklyData = (): HeatmapCellData[] => {
    const data: HeatmapCellData[] = [];
    const zones = [
      'Outdoor-Construction-Sector-4',
      'Manufacturing-Assembly-Line-B',
      'Warehouse-Logistics-Hub-North',
      'Subgrade-Tunnel-Conduit-7'
    ];

    days.forEach((day, dIdx) => {
      timeSlots.forEach((slot, tIdx) => {
        // Higher frequencies on mid-week afternoons (Wed/Thu peak heat)
        const isMiddayHeat = tIdx === 3;
        const isMidWeek = dIdx >= 2 && dIdx <= 4;
        const isWeekend = dIdx >= 5;

        let baseCount = 0;
        let critical = 0;
        let hazard = 'Baseline Variation';
        let heat = 32.0;

        if (isMiddayHeat && isMidWeek) {
          baseCount = Math.floor(4 + (dIdx * 1.5) % 4);
          critical = Math.floor(baseCount * 0.6);
          hazard = 'Severe Solar Radiation & Thermal Work Limit Drop';
          heat = 43.5;
        } else if (isMiddayHeat) {
          baseCount = 3;
          critical = 1;
          hazard = 'Elevated Wet-Bulb Load (WBGT > 34°C)';
          heat = 40.2;
        } else if (tIdx === 2 || tIdx === 4) {
          baseCount = isMidWeek ? 2 : 1;
          critical = 0;
          hazard = 'Acoustic Machinery Vibration & Ergonomic Exertion';
          heat = 36.0;
        } else if (isWeekend) {
          baseCount = dIdx === 5 ? 1 : 0;
          critical = 0;
          hazard = 'Weekend Maintenance Skeleton Crew';
          heat = 31.5;
        }

        data.push({
          day,
          dayIndex: dIdx,
          timeSlot: slot.split(' ')[0], // '00:00', '04:00', etc.
          timeSlotIndex: tIdx,
          zone: isMiddayHeat ? zones[0] : zones[(dIdx + tIdx) % zones.length],
          count: baseCount,
          criticalCount: critical,
          primaryHazard: hazard,
          avgHeatIndex: heat
        });
      });
    });

    return data;
  };

  const [heatmapData] = useState<HeatmapCellData[]>(generateWeeklyData);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 65 };
    const containerWidth = svgRef.current.clientWidth || 700;
    const width = Math.max(500, containerWidth) - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3
      .scaleBand()
      .domain(days)
      .range([0, width])
      .padding(0.08);

    const timeLabels = timeSlots.map((s) => s.split(' ')[0]);
    const yScale = d3
      .scaleBand()
      .domain(timeLabels)
      .range([0, height])
      .padding(0.08);

    // Color interpolation using D3: from slate-900 to amber to rose/red
    const maxVal = d3.max(heatmapData, (d) => d.count) || 6;
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 1, 3, maxVal])
      .range(['#0f172a', '#1e293b', '#f59e0b', '#f43f5e']);

    // Draw X Axis (Days of Week)
    g.append('g')
      .attr('transform', `translate(0, -8)`)
      .call(d3.axisTop(xScale).tickSize(0))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    // Draw Y Axis (Time Slots)
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Draw Heatmap Cells
    const cells = g
      .selectAll('.heatmap-rect')
      .data(heatmapData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell-group')
      .attr('transform', (d) => `translate(${xScale(d.day)}, ${yScale(d.timeSlot)})`);

    cells
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => (d.count === 0 ? '#0b1120' : colorScale(d.count)))
      .attr('stroke', (d) => (d.criticalCount > 0 ? '#f43f5e' : '#334155'))
      .attr('stroke-width', (d) => (d.criticalCount > 0 ? 1.5 : 0.6))
      .attr('stroke-opacity', 0.8)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.5)
          .attr('transform', 'scale(1.05)')
          .attr('transform-origin', 'center');
        setHoveredCell(d);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .attr('stroke', d.criticalCount > 0 ? '#f43f5e' : '#334155')
          .attr('stroke-width', d.criticalCount > 0 ? 1.5 : 0.6)
          .attr('transform', 'scale(1)');
        setHoveredCell(null);
      })
      .on('click', (event, d) => {
        if (onSelectCell) onSelectCell(d);
      });

    // Count labels inside cells with incidents
    cells
      .filter((d) => d.count > 0)
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.count >= 3 ? '#ffffff' : '#e2e8f0'))
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => d.count);
  }, [heatmapData]);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-4">
      {/* Title and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            D3 Weekly Health Anomaly Frequency Heatmap (Past 7 Days)
          </h3>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
            Pattern Analysis
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
          <span>Incidents:</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#0b1120] border border-slate-700"></span> 0
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#1e293b] border border-slate-700"></span> 1
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]"></span> 2-3
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#f43f5e] border border-rose-500"></span> 4+ (Critical)
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full min-w-[540px] h-[240px]" />
      </div>

      {/* Hover Info / Inspection Panel */}
      <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {hoveredCell ? (
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>{hoveredCell.day} at {hoveredCell.timeSlot}</span>
                <span className="text-cyan-400">• {hoveredCell.zone}</span>
                {hoveredCell.criticalCount > 0 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">
                    {hoveredCell.criticalCount} Critical
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total Detected: <strong className="text-white">{hoveredCell.count} anomalies</strong> | Hazard: <span className="text-amber-300">{hoveredCell.primaryHazard}</span> | Heat Index: <span className="text-cyan-300">{hoveredCell.avgHeatIndex}°C</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Hover over any day/shift cell in the D3 heatmap to view anomaly frequency, primary hazards, and thermal load clustering.</span>
          </div>
        )}

        <div className="text-[10px] text-slate-500 font-mono shrink-0">
          Clustering: Mid-Day Thermal Peak (12:00 - 16:00)
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MapPin,
  Flame,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';

export interface ZoneClusterData {
  id: string;
  name: string;
  department: string;
  x: number;
  y: number;
  radius: number;
  riskScore: number; // 0-100
  workerCount: number;
  status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  clusterTier: 'CRITICAL_CLUSTER' | 'HIGH_CLUSTER' | 'MODERATE_CLUSTER' | 'NOMINAL';
  primaryHazard: string;
  ambientTemp: number;
  avgHrv: number;
  avgHr: number;
  subClusters: Array<{
    subId: string;
    label: string;
    dx: number;
    dy: number;
    intensity: number; // 0-1
    risk: number;
  }>;
}

interface D3WorkplaceZoneRiskHeatmapProps {
  zones: FacilityZone[];
  alerts?: ActiveAnomalyAlert[];
  telemetryStream?: TelemetryDataPoint[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

export default function D3WorkplaceZoneRiskHeatmap({
  zones,
  alerts = [],
  telemetryStream = [],
  selectedZoneId,
  onSelectZone,
  className = ''
}: D3WorkplaceZoneRiskHeatmapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter states
  const [clusterFilter, setClusterFilter] = useState<'ALL' | 'HIGH_CRITICAL' | 'THERMAL' | 'ACOUSTIC'>('ALL');
  const [heatmapMode, setHeatmapMode] = useState<'INTENSITY_CLUSTERS' | 'WORKER_DENSITY' | 'COMBINED'>('COMBINED');
  const [hoveredCluster, setHoveredCluster] = useState<ZoneClusterData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute rich workplace zone spatial layout & risk clusters
  const clusterData: ZoneClusterData[] = useMemo(() => {
    // Spatial grid coordinates for 6 facility zones
    const zoneLayoutCoordinates: Record<string, { x: number; y: number; dept: string }> = {
      'Outdoor-Construction-Sector-4': { x: 190, y: 140, dept: 'Civil & Structural Construction' },
      'Subgrade-Tunnel-Conduit-7': { x: 530, y: 130, dept: 'Underground Infrastructure & Conduit' },
      'Warehouse-Logistics-Hub-North': { x: 360, y: 270, dept: 'Supply Chain & High-Bay Fulfillment' },
      'Manufacturing-Assembly-Line-B': { x: 170, y: 390, dept: 'Precision Robotics & Mechatronics' },
      'Chemical-Refining-Plant-C': { x: 540, y: 380, dept: 'Hazardous Process Chemistry' },
      'Cold-Chain-Cryogenic-Alpha': { x: 360, y: 440, dept: 'Cold Chain & Cryogenic Logistics' }
    };

    return zones.map((zone, idx) => {
      const coords = zoneLayoutCoordinates[zone.id] || {
        x: 150 + (idx % 3) * 220,
        y: 140 + Math.floor(idx / 3) * 220,
        dept: zone.name
      };

      const zoneAlerts = alerts.filter((a) => a.location_zone === zone.id || a.location_zone === zone.name);
      const criticalCount = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;

      // Calculate risk score based on zone status and alerts
      let calculatedRisk = zone.status === 'CRITICAL' ? 88 : zone.status === 'MODERATE' ? 64 : 26;
      if (zone.id === 'Outdoor-Construction-Sector-4') calculatedRisk = 89.4;
      if (zone.id === 'Subgrade-Tunnel-Conduit-7') calculatedRisk = 86.2;
      if (zone.id === 'Chemical-Refining-Plant-C') calculatedRisk = 76.5;

      const clusterTier: ZoneClusterData['clusterTier'] =
        calculatedRisk >= 80 ? 'CRITICAL_CLUSTER' : calculatedRisk >= 65 ? 'HIGH_CLUSTER' : calculatedRisk >= 40 ? 'MODERATE_CLUSTER' : 'NOMINAL';

      // Sub-quadrant hazard dispersion points to form a gaussian heat density cluster
      const subClusters = [
        { subId: 'Q1', label: 'North Gate', dx: -28, dy: -22, intensity: calculatedRisk / 100, risk: calculatedRisk },
        { subId: 'Q2', label: 'Core Workface', dx: 0, dy: 0, intensity: Math.min(1.0, (calculatedRisk + 8) / 100), risk: Math.min(100, calculatedRisk + 6) },
        { subId: 'Q3', label: 'Staging Area', dx: 30, dy: -18, intensity: (calculatedRisk * 0.85) / 100, risk: calculatedRisk * 0.88 },
        { subId: 'Q4', label: 'Heavy Machinery Cell', dx: -18, dy: 26, intensity: (calculatedRisk * 0.9) / 100, risk: calculatedRisk * 0.92 },
        { subId: 'Q5', label: 'Extraction Corridor', dx: 26, dy: 24, intensity: (calculatedRisk * 0.75) / 100, risk: calculatedRisk * 0.78 }
      ];

      const ambientTempNum = parseFloat(zone.temp) || 34.0;
      const hrvVal = zone.customBaselines?.baselineHrv || (calculatedRisk > 75 ? 44.5 : 68.0);
      const hrVal = calculatedRisk > 75 ? 88 : 72;

      return {
        id: zone.id,
        name: zone.name,
        department: coords.dept,
        x: coords.x,
        y: coords.y,
        radius: Math.max(34, Math.min(58, 28 + (zone.count || 15) * 0.9)),
        riskScore: calculatedRisk,
        workerCount: zone.count || 18,
        status: zone.status,
        clusterTier,
        primaryHazard: zone.activeHazards?.[0] || 'Cumulative Ergonomic Fatigue',
        ambientTemp: ambientTempNum,
        avgHrv: hrvVal,
        avgHr: hrVal,
        subClusters
      };
    });
  }, [zones, alerts]);

  // Filtered clusters based on active filter button
  const filteredClusters = useMemo(() => {
    if (clusterFilter === 'HIGH_CRITICAL') {
      return clusterData.filter((c) => c.riskScore >= 65);
    }
    if (clusterFilter === 'THERMAL') {
      return clusterData.filter((c) => c.primaryHazard.toLowerCase().includes('thermal') || c.ambientTemp >= 37);
    }
    if (clusterFilter === 'ACOUSTIC') {
      return clusterData.filter((c) => c.primaryHazard.toLowerCase().includes('acoustic') || c.id.includes('Tunnel'));
    }
    return clusterData;
  }, [clusterData, clusterFilter]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 720;
    const height = 530;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');

    // Defs for gradients & gaussian blur filters
    const defs = svg.append('defs');

    // Gaussian blur filter for heatmap glow effect
    const filter = defs.append('filter').attr('id', 'd3-heatmap-blur').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '22').attr('result', 'blur');

    // Risk Color Scale (interpolates from calm emerald -> cyan -> amber -> rose -> deep crimson)
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 30, 60, 80, 100])
      .range(['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#b91c1c']);

    // Radial Gradients for each cluster to simulate thermal density dissipation
    filteredClusters.forEach((cluster) => {
      const gradient = defs
        .append('radialGradient')
        .attr('id', `heat-grad-${cluster.id}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      const coreColor = colorScale(cluster.riskScore);
      const isCritical = cluster.riskScore >= 80;

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', isCritical ? 0.85 : 0.65);

      gradient
        .append('stop')
        .attr('offset', '55%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', isCritical ? 0.45 : 0.3);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', 0);
    });

    // Zoom container
    const g = svg.append('g').attr('class', 'd3-heatmap-main-group');

    // 1. Draw Facility Background Grid & Blueprint Gridlines
    const gridG = g.append('g').attr('class', 'facility-grid-lines').attr('opacity', 0.25);
    for (let x = 30; x <= width; x += 40) {
      gridG.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height).attr('stroke', '#334155').attr('stroke-width', 0.8);
    }
    for (let y = 30; y <= height; y += 40) {
      gridG.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y).attr('stroke', '#334155').attr('stroke-width', 0.8);
    }

    // 2. Facility Boundary Sectors (Light blueprint polygons)
    const sectorsG = g.append('g').attr('class', 'facility-sectors');
    const sectors = [
      { name: 'ZONE A • HEAVY EXCAVATION & CIVIL SECTOR', x: 20, y: 20, w: 320, h: 220 },
      { name: 'ZONE B • SUBGRADE CONDUIT & VENTILATION', x: 370, y: 20, w: 330, h: 220 },
      { name: 'ZONE C • AUTOMATED LOGISTICS & FULFILLMENT', x: 20, y: 260, w: 320, h: 250 },
      { name: 'ZONE D • HIGH-CONTAINMENT REFINING & CRYO', x: 370, y: 260, w: 330, h: 250 }
    ];

    sectors.forEach((sec) => {
      sectorsG
        .append('rect')
        .attr('x', sec.x)
        .attr('y', sec.y)
        .attr('width', sec.w)
        .attr('height', sec.h)
        .attr('rx', 12)
        .attr('fill', '#0b1329')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4 4');

      sectorsG
        .append('text')
        .attr('x', sec.x + 12)
        .attr('y', sec.y + 18)
        .attr('fill', '#475569')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(sec.name);
    });

    // 3. Heatmap Density Layer (Underneath nodes)
    const heatDensityG = g.append('g').attr('class', 'heat-density-layer');

    filteredClusters.forEach((cluster) => {
      const isCritical = cluster.riskScore >= 80;
      const heatRadius = cluster.radius * (isCritical ? 2.4 : 1.9);

      // Render Sub-Cluster heat kernels to give smooth clustered intensity
      cluster.subClusters.forEach((sub) => {
        heatDensityG
          .append('circle')
          .attr('cx', cluster.x + sub.dx)
          .attr('cy', cluster.y + sub.dy)
          .attr('r', cluster.radius * 1.3)
          .attr('fill', `url(#heat-grad-${cluster.id})`)
          .attr('filter', 'url(#d3-heatmap-blur)')
          .attr('opacity', sub.intensity);
      });

      // Primary zone heat blob
      heatDensityG
        .append('circle')
        .attr('cx', cluster.x)
        .attr('cy', cluster.y)
        .attr('r', heatRadius)
        .attr('fill', `url(#heat-grad-${cluster.id})`)
        .attr('filter', 'url(#d3-heatmap-blur)');
    });

    // 4. Cluster Nodes & Interactive Hit Zones Layer
    const nodesG = g.append('g').attr('class', 'cluster-nodes-layer');

    filteredClusters.forEach((cluster) => {
      const isSelected = selectedZoneId === cluster.id;
      const isCritical = cluster.riskScore >= 80;
      const color = colorScale(cluster.riskScore);

      const nodeGroup = nodesG
        .append('g')
        .attr('class', `cluster-node node-${cluster.id}`)
        .attr('transform', `translate(${cluster.x}, ${cluster.y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', (event) => {
          setHoveredCluster(cluster);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mousemove', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mouseleave', () => {
          setHoveredCluster(null);
          setTooltipPos(null);
        })
        .on('click', () => {
          onSelectZone?.(cluster.id);
        });

      // Pulsing outer ripple for critical / high risk clusters
      if (isCritical) {
        nodeGroup
          .append('circle')
          .attr('r', cluster.radius + 14)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.8)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-dasharray', '5 3')
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', `${cluster.radius + 6};${cluster.radius + 20};${cluster.radius + 6}`)
          .attr('dur', '2.5s')
          .attr('repeatCount', 'indefinite');
      }

      // Selected ring
      if (isSelected) {
        nodeGroup
          .append('circle')
          .attr('r', cluster.radius + 7)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 2.5);
      }

      // Main Node Circle
      nodeGroup
        .append('circle')
        .attr('r', cluster.radius)
        .attr('fill', '#090d16')
        .attr('stroke', color)
        .attr('stroke-width', isSelected ? 3 : 2)
        .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))');

      // Inner risk fill gauge ring
      const innerRadius = cluster.radius - 4;
      nodeGroup
        .append('circle')
        .attr('r', innerRadius)
        .attr('fill', color)
        .attr('fill-opacity', 0.18);

      // Risk score text in center
      nodeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-2px')
        .attr('fill', '#ffffff')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(`${Math.round(cluster.riskScore)}%`);

      // Risk label below
      nodeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '12px')
        .attr('fill', color)
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(isCritical ? 'CRITICAL RISK' : cluster.riskScore >= 65 ? 'HIGH RISK' : 'STABLE');

      // Worker count badge on top right of node
      const badgeG = nodeGroup.append('g').attr('transform', `translate(${cluster.radius * 0.65}, ${-cluster.radius * 0.65})`);

      badgeG
        .append('circle')
        .attr('r', 10)
        .attr('fill', '#020617')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.2);

      badgeG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '3.5px')
        .attr('fill', '#94a3b8')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(cluster.workerCount);

      // Zone Name Label Banner below node
      const labelY = cluster.radius + 16;
      nodeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', labelY)
        .attr('fill', '#f8fafc')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(cluster.name.replace(/-/g, ' '));

      nodeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', labelY + 12)
        .attr('fill', '#94a3b8')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(`${cluster.ambientTemp}°C | HRV ${cluster.avgHrv}ms`);
    });

    // 5. Connective hazard flow vectors between adjacent zones
    const linksG = g.append('g').attr('class', 'hazard-vectors').attr('opacity', 0.2);
    linksG
      .append('line')
      .attr('x1', 190)
      .attr('y1', 140)
      .attr('x2', 360)
      .attr('y2', 270)
      .attr('stroke', '#f43f5e')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1.5);
    linksG
      .append('line')
      .attr('x1', 530)
      .attr('y1', 130)
      .attr('x2', 360)
      .attr('y2', 270)
      .attr('stroke', '#f59e0b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1.5);

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 2.8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
  }, [filteredClusters, selectedZoneId, onSelectZone]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(600).call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  };

  return (
    <div
      id="d3-workplace-zone-risk-heatmap-card"
      ref={containerRef}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition hover:border-slate-700/80 relative ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-rose-600/20 to-orange-600/20 border border-rose-500/40 rounded-xl text-rose-400">
              <Flame className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Workplace Zone Health Risk Clusters Heatmap</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-500/40">
                D3.js Vector Heatmap
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spatial thermal and physiological risk density highlighting hazardous worker clusters across facility sectors
          </p>
        </div>

        {/* Filter & Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Risk Filter Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setClusterFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                clusterFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Zones
            </button>
            <button
              onClick={() => setClusterFilter('HIGH_CRITICAL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                clusterFilter === 'HIGH_CRITICAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>High &amp; Critical Clusters</span>
            </button>
            <button
              onClick={() => setClusterFilter('THERMAL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                clusterFilter === 'THERMAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              <Thermometer className="h-3 w-3" />
              <span>Thermal Strain</span>
            </button>
          </div>

          {/* Reset Zoom Button */}
          <button
            onClick={handleResetZoom}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            title="Reset D3 Zoom and Pan"
          >
            <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Cluster Severity Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs font-mono">
        <div className="bg-slate-950/80 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Critical Cluster</div>
            <div className="text-lg font-bold text-rose-400">Outdoor Sector 4</div>
            <div className="text-[10px] text-slate-400">Risk: 89.4% &bull; 18 Workers</div>
          </div>
          <Flame className="h-5 w-5 text-rose-400 animate-pulse" />
        </div>

        <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Severe Cluster</div>
            <div className="text-lg font-bold text-rose-400">Tunnel Conduit 7</div>
            <div className="text-[10px] text-slate-400">Risk: 86.2% &bull; 14 Workers</div>
          </div>
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        </div>

        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Elevated Cluster</div>
            <div className="text-lg font-bold text-amber-300">Chemical Plant C</div>
            <div className="text-[10px] text-slate-400">Risk: 76.5% &bull; 16 Workers</div>
          </div>
          <Activity className="h-5 w-5 text-amber-400" />
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Stable Zones</div>
            <div className="text-lg font-bold text-emerald-400">3 Sectors Nominal</div>
            <div className="text-[10px] text-slate-400">Assembly, Cryo, Warehouse</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* SVG Container for D3 Canvas */}
      <div className="relative w-full h-[440px] sm:h-[490px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <svg ref={svgRef} className="w-full h-full select-none" />

        {/* Floating D3 Heatmap Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-[11px] font-mono pointer-events-none">
          <div className="text-slate-400 font-bold mb-1">D3 Health Risk Intensity Scale:</div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-[10px]">0% Low</span>
            <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 via-amber-400 via-rose-500 to-red-700 border border-slate-700" />
            <span className="text-rose-400 text-[10px]">100% Critical</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-500">
            Scroll to zoom &bull; Drag to pan &bull; Click zone to isolate
          </div>
        </div>

        {/* Hover Tooltip Popup rendered in DOM */}
        {hoveredCluster && tooltipPos && (
          <div
            className="absolute z-50 bg-slate-950/95 border border-cyan-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs text-slate-100 max-w-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: Math.max(120, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 700) - 120)),
              top: tooltipPos.y - 10
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>{hoveredCluster.name}</span>
              </span>
              <span
                className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                  hoveredCluster.riskScore >= 80
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                    : hoveredCluster.riskScore >= 65
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                {hoveredCluster.riskScore}% RISK
              </span>
            </div>

            <div className="text-[11px] text-slate-400 mb-1.5">
              <strong>Department:</strong> {hoveredCluster.department}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div>Cohort: <strong className="text-white">{hoveredCluster.workerCount} workers</strong></div>
              <div>Ambient: <strong className="text-amber-300">{hoveredCluster.ambientTemp}°C</strong></div>
              <div>HRV (RMSSD): <strong className="text-cyan-300">{hoveredCluster.avgHrv} ms</strong></div>
              <div>Mean Pulse: <strong className="text-rose-300">{hoveredCluster.avgHr} BPM</strong></div>
            </div>

            <div className="mt-2 text-[10px] text-rose-300 font-mono">
              <strong>Primary Hazard:</strong> {hoveredCluster.primaryHazard}
            </div>

            <div className="mt-1 text-[9px] text-cyan-400 italic">
              Click to select and isolate this zone across dashboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

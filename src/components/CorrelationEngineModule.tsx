import React, { useState, useEffect, useMemo } from 'react';
import {
  GitMerge,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Wind,
  Flame,
  Volume2,
  Users,
  Zap,
  Activity,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  Compass,
  Layers,
  ChevronRight,
  Sparkles,
  Sliders
} from 'lucide-react';
import {
  CausalZoneNode,
  CausalPropagationLink,
  CausalIncidentChainEvent,
  TransmissionVector
} from '../types';
import { causalCorrelationEngineService } from '../services/causalCorrelationEngineService';

interface CorrelationEngineModuleProps {
  onNavigateToZone?: (zoneId: string) => void;
  onNotice?: (msg: string) => void;
}

export default function CorrelationEngineModule({
  onNavigateToZone,
  onNotice
}: CorrelationEngineModuleProps) {
  const [nodes, setNodes] = useState<CausalZoneNode[]>([]);
  const [links, setLinks] = useState<CausalPropagationLink[]>([]);
  const [chain, setChain] = useState<CausalIncidentChainEvent[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('Outdoor-Construction-Sector-4');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>('LINK-SEC4-TO-LOGN');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync with service
  useEffect(() => {
    const unsub = causalCorrelationEngineService.subscribe(() => {
      setNodes(causalCorrelationEngineService.getNodes());
      setLinks(causalCorrelationEngineService.getLinks());
      setChain(causalCorrelationEngineService.getIncidentChain());
      setSelectedZoneId(causalCorrelationEngineService.getSelectedZoneId());
    });
    setNodes(causalCorrelationEngineService.getNodes());
    setLinks(causalCorrelationEngineService.getLinks());
    setChain(causalCorrelationEngineService.getIncidentChain());
    setSelectedZoneId(causalCorrelationEngineService.getSelectedZoneId());
    return () => unsub();
  }, []);

  const activeZone = useMemo(() => {
    return nodes.find((n) => n.zoneId === selectedZoneId) || nodes[0];
  }, [nodes, selectedZoneId]);

  const selectedLink = useMemo(() => {
    return links.find((l) => l.id === selectedLinkId) || links[0];
  }, [links, selectedLinkId]);

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    causalCorrelationEngineService.setSelectedZoneId(zoneId);
    const relatedLink = links.find((l) => l.sourceZoneId === zoneId || l.targetZoneId === zoneId);
    if (relatedLink) {
      setSelectedLinkId(relatedLink.id);
    }
  };

  const handleSimulateCascade = () => {
    setIsSimulating(true);
    causalCorrelationEngineService.triggerSimulatedCascade(selectedZoneId);
    const msg = `Simulated high-risk surge injected in ${activeZone.zoneName}. Causal vectors propagated to adjacent zones with active time-lags.`;
    setActionNotice(msg);
    onNotice?.(msg);
    setTimeout(() => {
      setIsSimulating(false);
      setTimeout(() => setActionNotice(null), 6000);
    }, 1200);
  };

  const handleDecouple = (linkId: string) => {
    const decoupled = causalCorrelationEngineService.decoupleLink(linkId);
    if (decoupled) {
      const msg = `Causal link decoupled between ${decoupled.sourceZoneName} and ${decoupled.targetZoneName}. Mitigation: ${decoupled.decouplingRecommendation}`;
      setActionNotice(msg);
      onNotice?.(msg);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const getVectorIcon = (vector: TransmissionVector) => {
    switch (vector) {
      case 'THERMAL_PLUME':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'HVAC_CONDUIT':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'WORKER_FLOW':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'ACOUSTIC_RESONANCE':
        return <Volume2 className="w-4 h-4 text-orange-400" />;
      case 'ELECTRICAL_BUS':
        return <Zap className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getVectorLabel = (vector: TransmissionVector) => {
    switch (vector) {
      case 'THERMAL_PLUME':
        return 'Thermal Plume Diffusion';
      case 'HVAC_CONDUIT':
        return 'HVAC Ventilation Draft';
      case 'WORKER_FLOW':
        return 'Crew Rotation Transfer';
      case 'ACOUSTIC_RESONANCE':
        return 'Ground Acoustic Resonance';
      case 'ELECTRICAL_BUS':
        return 'Substation Voltage Droop';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <GitMerge className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Inter-Zone Causal Correlation Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-600/40 font-mono">
                  Granger Spatio-Temporal Model
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Analyzes if high-risk anomalies in one zone correlate with subsequent issues in adjacent zones, providing a causal link visualization.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateCascade}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 border border-rose-400/40 transition cursor-pointer"
            title="Simulate a sudden thermal/vibration surge in the selected zone and observe cascading downstream impacts"
          >
            <Zap className={`w-3.5 h-3.5 text-white ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Propagating Cascade...' : 'Simulate Surge Cascade'}</span>
          </button>

          <button
            onClick={() => causalCorrelationEngineService.exportCausalReportCsv()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Matrix CSV</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="my-3 p-3 bg-indigo-950/80 border border-indigo-500/50 rounded-lg text-xs text-indigo-200 flex items-center justify-between animate-fadeIn">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-indigo-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Layout: Visual Topological Graph & Causal Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left: Topological Spatial Graph with Directed Causal Links */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Spatial Topological Adjacency &amp; Causal Vectors
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Click nodes or vectors to inspect propagation
            </span>
          </div>

          {/* Interactive Topology Canvas */}
          <div className="relative w-full h-[380px] bg-slate-900/40 rounded-lg my-3 border border-slate-800/60 overflow-hidden select-none">
            {/* Background Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.8" />
                </pattern>
                <marker
                  id="arrowhead-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
                </marker>
                <marker
                  id="arrowhead-idle"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* SVG Connecting Vector Arrows between Nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {links.map((link) => {
                const source = nodes.find((n) => n.zoneId === link.sourceZoneId);
                const target = nodes.find((n) => n.zoneId === link.targetZoneId);
                if (!source || !target) return null;

                const isSelected = link.id === selectedLinkId;
                const strokeColor = link.isCascadingActive
                  ? '#f43f5e'
                  : isSelected
                  ? '#38bdf8'
                  : '#334155';

                return (
                  <g key={link.id}>
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={strokeColor}
                      strokeWidth={isSelected || link.isCascadingActive ? 3.5 : 2}
                      strokeDasharray={link.isCascadingActive ? '6 4' : undefined}
                      markerEnd={link.isCascadingActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-idle)'}
                      className={link.isCascadingActive ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Zone Nodes */}
            {nodes.map((node) => {
              const isSelected = node.zoneId === selectedZoneId;
              const isCritical = node.status === 'CRITICAL';
              return (
                <div
                  key={node.zoneId}
                  onClick={() => handleSelectZone(node.zoneId)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-10 p-3 rounded-xl border transition-all cursor-pointer shadow-lg max-w-[175px] ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                      : isCritical
                      ? 'bg-slate-900 border-rose-500/80 shadow-rose-950/50'
                      : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[11px] text-white truncate">{node.zoneName}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isCritical ? 'bg-rose-500 animate-ping' : node.status === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-baseline justify-between text-[10px] text-slate-300 font-mono mt-1">
                    <span>Risk:</span>
                    <span
                      className={`font-bold ${
                        isCritical ? 'text-rose-400' : node.status === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {node.riskScore}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
                    <span>{node.headcount} Workers</span>
                    <span>{node.ambientTempC}°C</span>
                  </div>
                </div>
              );
            })}

            {/* Link Midpoint Vector Badges (Clickable) */}
            {links.map((link) => {
              const source = nodes.find((n) => n.zoneId === link.sourceZoneId);
              const target = nodes.find((n) => n.zoneId === link.targetZoneId);
              if (!source || !target) return null;

              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              const isSelected = link.id === selectedLinkId;

              return (
                <button
                  key={`badge-${link.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLinkId(link.id);
                  }}
                  style={{
                    left: `${midX}%`,
                    top: `${midY}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 flex items-center space-x-1 px-2 py-1 rounded-md text-[9px] font-mono font-bold transition shadow-md border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-white ring-2 ring-cyan-300/60'
                      : link.isCascadingActive
                      ? 'bg-rose-950 text-rose-300 border-rose-500/80 animate-pulse'
                      : 'bg-slate-950/90 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                  title={`${link.sourceZoneName} → ${link.targetZoneName} (r=${link.pearsonR}, +${link.timeLagMinutes}m)`}
                >
                  {getVectorIcon(link.transmissionVector)}
                  <span>r={link.pearsonR}</span>
                  <span className="text-[8px] opacity-80">+{link.timeLagMinutes}m</span>
                </button>
              );
            })}
          </div>

          {/* Quick Zone Navigation Footer */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span className="text-[11px]">Active Focus: <strong className="text-white">{activeZone.zoneName}</strong></span>
            {onNavigateToZone && (
              <button
                onClick={() => onNavigateToZone(activeZone.zoneId)}
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-medium"
              >
                <span>Jump to Zone Live Telemetry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Causal Link Details, Propagation Vector & Mitigation */}
        <div className="lg:col-span-5 space-y-4">
          {selectedLink && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">CAUSAL VECTOR LINK</span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span>{selectedLink.sourceZoneName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedLink.targetZoneName}</span>
                  </h3>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      selectedLink.isCascadingActive
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    }`}
                  >
                    {selectedLink.isCascadingActive ? 'Cascade Active' : 'Decoupled / Stable'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px]">CORRELATION</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">r = {selectedLink.pearsonR}</span>
                  <span className="text-[9px] text-slate-500 block">p = {selectedLink.historicalPValue}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[9px]">CAUSAL CONF</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedLink.causalConfidencePct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Granger P-test</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[9px]">PROPAGATION LAG</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    +{selectedLink.timeLagMinutes} min
                  </span>
                  <span className="text-[9px] text-slate-500 block">Lead time</span>
                </div>
              </div>

              {/* Physical Transmission Mechanism */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  {getVectorIcon(selectedLink.transmissionVector)}
                  <span>{getVectorLabel(selectedLink.transmissionVector)}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{selectedLink.transmissionDescription}</p>
              </div>

              {/* Decoupling Recommendation & Action */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                <span className="text-emerald-400 font-bold block text-[10px] uppercase">
                  RECOMMENDED INTER-ZONE MITIGATION
                </span>
                <p className="text-slate-200 text-[11px]">{selectedLink.decouplingRecommendation}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDecouple(selectedLink.id)}
                    disabled={!selectedLink.isCascadingActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      selectedLink.isCascadingActive
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Deploy Containment Decoupling</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cascading Incident Chain Timeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Cascading Incident Timeline
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">4-Stage Propagation</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {chain.map((step) => {
                const isOrigin = step.causalRole === 'ORIGIN';
                const isTerminal = step.causalRole === 'TERMINAL_CASCADE';
                return (
                  <div
                    key={step.step}
                    className={`p-2.5 rounded-lg border text-xs transition ${
                      isOrigin
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : isTerminal
                        ? 'bg-purple-950/30 border-purple-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                        <span className="h-4 w-4 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono text-[9px]">
                          {step.step}
                        </span>
                        {step.zoneName}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">{step.timeOffset}</span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-medium mt-1">{step.incidentType}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{step.metricValue}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

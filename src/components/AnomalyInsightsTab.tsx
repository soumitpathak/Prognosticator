import React, { useState, useMemo, useEffect } from 'react';
import {
  ActiveAnomalyAlert,
  AnomalyAuditRecord,
  FacilityZone
} from '../types';
import {
  nlpAnomalyInsightsService,
  NlpSynthesisReport,
  NlpFrequentAnomalyType,
  AnomalyTypeCategory
} from '../services/nlpAnomalyInsightsService';
import {
  Sparkles,
  Brain,
  RefreshCw,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Flame,
  Activity,
  Cpu,
  Wind,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Sliders,
  CheckCircle2,
  Terminal,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface AnomalyInsightsTabProps {
  alerts: ActiveAnomalyAlert[];
  anomalyAuditRecords: AnomalyAuditRecord[];
  zones?: FacilityZone[];
  className?: string;
}

export default function AnomalyInsightsTab({
  alerts,
  anomalyAuditRecords,
  zones = [],
  className = ''
}: AnomalyInsightsTabProps) {
  const [timeWindowHours, setTimeWindowHours] = useState<number>(24);
  const [selectedCategory, setSelectedCategory] = useState<AnomalyTypeCategory | 'ALL'>('ALL');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedDirectiveId, setCopiedDirectiveId] = useState<string | null>(null);
  const [selectedTypeDetail, setSelectedTypeDetail] = useState<string | null>(null);

  // Generate or re-generate NLP report
  const [report, setReport] = useState<NlpSynthesisReport>(() =>
    nlpAnomalyInsightsService.generate24hInsights(anomalyAuditRecords, alerts, 24)
  );

  // Recompute when records or alerts change
  useEffect(() => {
    setReport(nlpAnomalyInsightsService.generate24hInsights(anomalyAuditRecords, alerts, timeWindowHours));
  }, [anomalyAuditRecords, alerts, timeWindowHours]);

  const handleRegenerate = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setReport(nlpAnomalyInsightsService.generate24hInsights(anomalyAuditRecords, alerts, timeWindowHours));
      setIsSynthesizing(false);
    }, 750);
  };

  const handleCopySummary = () => {
    if (!report) return;
    const textToCopy = `PROGNOSTICATOR NLP ANOMALY INSIGHTS SUMMARY (Last ${report.timeWindowHours}h)\n\n` +
      `Executive Diagnostic Narrative:\n${report.executiveDiagnosticNarrative}\n\n` +
      `Primary Root Cause Hypothesis:\n${report.primaryRootCauseHypothesis}\n\n` +
      `Top Anomaly Frequency Breakdown:\n` +
      report.topAnomalyTypes
        .map(
          (t, i) =>
            `#${i + 1} ${t.name} (${t.count} events, ${t.percentageOfTotal}%)\n- Root Cause: ${t.nlpRootCauseSummary}\n- Directives: ${t.prescriptiveRemediationDirectives.join('; ')}`
        )
        .join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyDirective = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDirectiveId(id);
    setTimeout(() => setCopiedDirectiveId(null), 2500);
  };

  const handleExportText = () => {
    nlpAnomalyInsightsService.exportReportText(report);
  };

  const filteredTypes = useMemo(() => {
    if (selectedCategory === 'ALL') return report.topAnomalyTypes;
    return report.topAnomalyTypes.filter((t) => t.category === selectedCategory);
  }, [report, selectedCategory]);

  const getCategoryMeta = (category: AnomalyTypeCategory) => {
    switch (category) {
      case 'THERMAL':
        return {
          icon: <Flame className="h-4 w-4 text-orange-400" />,
          label: 'Thermal Strain',
          color: 'text-orange-400',
          border: 'border-orange-500/30',
          bg: 'bg-orange-950/40',
          barColor: 'bg-orange-500'
        };
      case 'BIOMECHANICAL':
        return {
          icon: <Activity className="h-4 w-4 text-cyan-400" />,
          label: 'Biomechanical & Autonomic',
          color: 'text-cyan-400',
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-950/40',
          barColor: 'bg-cyan-500'
        };
      case 'EQUIPMENT':
        return {
          icon: <Cpu className="h-4 w-4 text-purple-400" />,
          label: 'Machinery & Mechanical',
          color: 'text-purple-400',
          border: 'border-purple-500/30',
          bg: 'bg-purple-950/40',
          barColor: 'bg-purple-500'
        };
      case 'ENVIRONMENTAL':
        return {
          icon: <Wind className="h-4 w-4 text-emerald-400" />,
          label: 'Environmental & Acoustic',
          color: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-950/40',
          barColor: 'bg-emerald-500'
        };
    }
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 ${className}`}>
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-400">
              <Brain className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-2">
              <span>Natural Language Processing Root-Cause Synthesis</span>
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-semibold">
              NLP Transformer v3.4
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
              Semantic Coherence {report.modelMetadata.semanticCoherenceScore}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Synthesizes statutory telemetry, mechanical harmonics, and worker biometrics detected across the facility in the last {timeWindowHours} hours to diagnose underlying physical catalysts and human factor vulnerabilities.
          </p>
        </div>

        {/* NLP Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Window Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {[6, 12, 24, 48].map((hours) => (
              <button
                key={hours}
                onClick={() => setTimeWindowHours(hours)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  timeWindowHours === hours
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>

          {/* Regenerate NLP Button */}
          <button
            onClick={handleRegenerate}
            disabled={isSynthesizing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Re-run NLP parsing on latest telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Regenerate'}</span>
          </button>

          {/* Copy Summary Text */}
          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            title="Copy natural language diagnostic narrative to clipboard"
          >
            {copiedText ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Export Report Markdown */}
          <button
            onClick={handleExportText}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
            title="Download complete NLP diagnostic report as Markdown"
          >
            <Download className="h-3.5 w-3.5 text-slate-950" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Executive Diagnostic Narrative Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-amber-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              24-Hour Executive Diagnostic Narrative
            </h4>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span>Processed: <strong className="text-white tabular-nums">{report.totalAnomaliesProcessed}</strong> events</span>
            <span>·</span>
            <span>Tokens: <strong className="text-amber-300 tabular-nums">{report.modelMetadata.tokenCount}</strong></span>
            <span>·</span>
            <span>Latency: <strong className="text-white tabular-nums">{report.modelMetadata.processingTimeMs}ms</strong></span>
          </div>
        </div>

        {/* Natural Language Narrative Text */}
        <div className="space-y-3.5 text-slate-200 text-sm leading-relaxed">
          <p className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-slate-100 font-sans border-l-4 border-l-amber-500">
            {report.executiveDiagnosticNarrative}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Primary Root Cause Hypothesis */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Primary Root-Cause Hypothesis</span>
              </span>
              <p className="text-slate-300 leading-normal font-sans text-xs">
                {report.primaryRootCauseHypothesis}
              </p>
            </div>

            {/* Environmental & Operational Compounding Factors */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-cyan-400" />
                <span>Environmental &amp; Thermal Co-Factors</span>
              </span>
              <p className="text-slate-300 leading-normal font-sans text-xs">
                {report.environmentalCompoundingSynthesis}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Ranking Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <span>Most Frequent Anomaly Types &amp; Root-Cause Forensic Profiles</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              Ranked by 24h Frequency
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any profile to inspect extracted semantic entity tokens and prescriptive remediation directives.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {(['ALL', 'THERMAL', 'BIOMECHANICAL', 'EQUIPMENT', 'ENVIRONMENTAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-bold border border-slate-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-950'
              }`}
            >
              {cat === 'ALL' ? 'All Types' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked Anomaly Type Cards */}
      <div className="space-y-4">
        {filteredTypes.map((type, index) => {
          const meta = getCategoryMeta(type.category);
          const isExpanded = selectedTypeDetail === type.id || index === 0;

          return (
            <div
              key={type.id}
              className={`bg-slate-950/70 border rounded-xl overflow-hidden transition-all duration-200 ${
                isExpanded ? `${meta.border} shadow-lg ring-1 ring-slate-800` : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header & Frequency Bar */}
              <div
                onClick={() => setSelectedTypeDetail(isExpanded ? null : type.id)}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/50 hover:bg-slate-900/80 transition"
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  {/* Rank Badge */}
                  <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-slate-100 shrink-0">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`p-1 rounded ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </span>
                      <h5 className="text-sm font-bold text-white tracking-wide">
                        {type.name}
                      </h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${meta.bg} ${meta.color} border ${meta.border}`}>
                        {meta.label}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                          type.threatUrgencyRating === 'CRITICAL_INTERVENTION'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : type.threatUrgencyRating === 'HIGH_PRIORITY'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {type.threatUrgencyRating.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Zone & Personnel Tags */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>{type.affectedZones.join(', ')}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-500" />
                        <span>~{type.affectedPersonnelCount} workers exposed</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Frequency Stats & Trajectory */}
                <div className="flex items-center space-x-4 md:space-x-6 shrink-0 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">24h Frequency</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-bold text-white tabular-nums">{type.count}</span>
                      <span className="text-slate-400">({type.percentageOfTotal}%)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">24h Shift Delta</span>
                    <span className={`text-xs font-bold tabular-nums flex items-center gap-0.5 ${type.trendVsPrior24hPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      <TrendingUp className="h-3 w-3 inline" />
                      {type.trendVsPrior24hPct >= 0 ? `+${type.trendVsPrior24hPct}%` : `${type.trendVsPrior24hPct}%`}
                    </span>
                  </div>

                  <div className="hidden sm:block w-28">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Volume Share</span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${meta.barColor}`}
                        style={{ width: `${Math.min(type.percentageOfTotal * 1.5, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded NLP Root-Cause Forensic Section */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/90 space-y-4">
                  {/* Highlighted NLP Root Cause Summary */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Brain className="h-3.5 w-3.5 text-amber-400" />
                        <span>NLP Root-Cause Diagnostic Summary</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Model Confidence: {(type.avgConfidenceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {type.nlpRootCauseSummary}
                    </p>
                  </div>

                  {/* Dual Mechanism Grid: Mechanical Driver vs Physiological/Equipment Degradation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Mechanical / Operational Driver */}
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg font-mono">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Primary Mechanical / Physical Catalyst</span>
                      </span>
                      <p className="text-slate-300 font-sans text-xs leading-normal">
                        {type.primaryMechanicalDriver}
                      </p>
                    </div>

                    {/* Physiological Impact Mechanism */}
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg font-mono">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-rose-400" />
                        <span>Worker Biometric / Failure Mechanism</span>
                      </span>
                      <p className="text-slate-300 font-sans text-xs leading-normal">
                        {type.physiologicalImpactMechanism}
                      </p>
                    </div>
                  </div>

                  {/* Contributing Operational Conditions */}
                  <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg">
                    <span className="text-xs font-bold font-mono text-slate-300 block mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Contributing Environmental &amp; Operational Stressors</span>
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300">
                      {type.contributingOperationalFactors.map((factor, fIdx) => (
                        <li key={fIdx} className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                          <span className="font-sans leading-snug">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Extracted Semantic Entity Tokens */}
                  <div>
                    <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-2">
                      Extracted NLP Semantic Tokens
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {type.extractedSemanticEntities.map((ent, eIdx) => (
                        <span
                          key={eIdx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-200 flex items-center gap-1"
                        >
                          <span className="text-[9px] uppercase font-bold text-amber-400/80">{ent.type}:</span>
                          <span>{ent.entity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptive Remediation Directives */}
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
                    <span className="text-xs font-bold font-mono text-emerald-300 block mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Prescriptive NLP Remediation Directives</span>
                    </span>
                    <div className="space-y-2">
                      {type.prescriptiveRemediationDirectives.map((directive, dIdx) => {
                        const directiveKey = `${type.id}-dir-${dIdx}`;
                        const isCopied = copiedDirectiveId === directiveKey;

                        return (
                          <div
                            key={dIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-950/80 border border-emerald-500/20 rounded-md text-xs text-slate-200"
                          >
                            <span className="font-sans leading-snug flex items-center gap-2">
                              <span className="text-emerald-400 font-mono font-bold">[{dIdx + 1}]</span>
                              <span>{directive}</span>
                            </span>
                            <button
                              onClick={() => handleCopyDirective(directiveKey, directive)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition shrink-0 cursor-pointer flex items-center gap-1"
                              title="Copy directive instruction"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-slate-400" />
                                  <span>Copy Action</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

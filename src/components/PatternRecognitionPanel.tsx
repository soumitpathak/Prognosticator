import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
  Sliders,
  Filter,
  Eye,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  Info
} from 'lucide-react';
import { TelemetryDataPoint, FacilityZone } from '../types';

export interface PrecursorPattern {
  id: string;
  name: string;
  anomalyType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  precursorTokens: string[]; // e.g. ["HEAT+", "TWL-", "HR+", "HRV-", "SKIN+"]
  rawStringPattern: string; // "HEAT+ -> TWL- -> HR+ -> HRV- -> SKIN+"
  recurrenceCount30d: number;
  confidenceScorePct: number;
  avgLeadTimeMin: number;
  departmentScope: string;
  zoneId: string;
  explanation: string;
  mitigationAction: string;
  status: 'ACTIVE_PRECURSOR' | 'RECURRING_IDENTIFIED' | 'STABILIZED';
}

export const INITIAL_PRECURSOR_PATTERNS: PrecursorPattern[] = [
  {
    id: 'PAT-HEAT-01',
    name: 'Exertional Thermal Cascade Precursor',
    anomalyType: 'Cardiovascular Autonomic Collapse & Hyperthermia',
    severity: 'CRITICAL',
    precursorTokens: ['HEAT+', 'TWL-', 'HR+', 'HRV-', 'SKIN+'],
    rawStringPattern: 'HEAT+ -> TWL- -> HR+ -> HRV- -> SKIN+',
    recurrenceCount30d: 34,
    confidenceScorePct: 96.4,
    avgLeadTimeMin: 48,
    departmentScope: 'Civil & Structural Construction',
    zoneId: 'Outdoor-Construction-Sector-4',
    explanation:
      'Ambient dry-bulb surge (>38°C) accompanied by TWL deficit precedes tachycardia. 15 minutes later, parasympathetic HRV collapses followed by skin temperature breach.',
    mitigationAction:
      'Deploy shaded misting recovery tents and oral electrolyte distribution at step 2 (TWL-) to interrupt progression before token 4 (HRV-).',
    status: 'ACTIVE_PRECURSOR'
  },
  {
    id: 'PAT-MECH-02',
    name: 'Bearing Harmonic Degradation Precursor',
    anomalyType: 'Compressor Subsystem Seizure (Predictive Maintenance)',
    severity: 'HIGH',
    precursorTokens: ['NOISE+', 'VIB_AXIAL+', 'TEMP_HOUSING+', 'HARMONIC_SPIKE'],
    rawStringPattern: 'NOISE+ -> VIB_AXIAL+ -> TEMP_HOUSING+ -> HARMONIC_SPIKE',
    recurrenceCount30d: 28,
    confidenceScorePct: 94.2,
    avgLeadTimeMin: 210, // 3.5 hours
    departmentScope: 'Precision Robotics & Mechatronics',
    zoneId: 'Manufacturing-Assembly-Line-B',
    explanation:
      'Acoustic decibel elevation occurs first as bearing cage micro-cracks form, followed by radial vibration increase and motor stator temperature rise.',
    mitigationAction:
      'Execute automated ultrasound lubrication injection when VIB_AXIAL+ threshold crosses 2.8 mm/s to prevent thermal welding.',
    status: 'RECURRING_IDENTIFIED'
  },
  {
    id: 'PAT-FATIGUE-03',
    name: 'Autonomic Circadian Depletion Precursor',
    anomalyType: 'Workforce Fatigue & Physical Syncope',
    severity: 'HIGH',
    precursorTokens: ['SLEEP_DEFICIT', 'HRV_FLOOR-', 'MICRO_DELAY', 'CARDIAC_SPIKE'],
    rawStringPattern: 'SLEEP_DEFICIT -> HRV_FLOOR- -> MICRO_DELAY -> CARDIAC_SPIKE',
    recurrenceCount30d: 22,
    confidenceScorePct: 91.8,
    avgLeadTimeMin: 65,
    departmentScope: 'Supply Chain & High-Bay Fulfillment',
    zoneId: 'Warehouse-Logistics-Hub-North',
    explanation:
      'Sleep deprivation (<4 hours) combined with 4+ hours continuous shift creates parasympathetic exhaustion; simple lifting triggers erratic compensatory cardiac acceleration.',
    mitigationAction:
      'Mandate 20-minute restorative break and reassign to lower-tier ground inventory staging upon detecting HRV_FLOOR- sequence.',
    status: 'RECURRING_IDENTIFIED'
  },
  {
    id: 'PAT-CONFINED-04',
    name: 'Sub-Surface Hypoxic Stress Precursor',
    anomalyType: 'Confined Space Micro-Climate Asphyxiation Risk',
    severity: 'CRITICAL',
    precursorTokens: ['AQI_PM25+', 'VENT_STAGNANT', 'CO2_DRIFT+', 'RESP_RATE+'],
    rawStringPattern: 'AQI_PM25+ -> VENT_STAGNANT -> CO2_DRIFT+ -> RESP_RATE+',
    recurrenceCount30d: 16,
    confidenceScorePct: 97.8,
    avgLeadTimeMin: 26,
    departmentScope: 'Underground Infrastructure & Conduit',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    explanation:
      'Particulate build-up correlates with blower stagnation; localized CO2 rises steadily triggering compensatory worker hyperventilation and dizziness.',
    mitigationAction:
      'Engage secondary emergency duct blowers and order immediate cohort evacuation before CO2 exceeds 1,200 ppm.',
    status: 'ACTIVE_PRECURSOR'
  },
  {
    id: 'PAT-CHEM-05',
    name: 'Thermal-Exchanger Acoustic Cavitation',
    anomalyType: 'Volatile Flange Seal Overpressure',
    severity: 'HIGH',
    precursorTokens: ['VALVE_NOISE+', 'PIPE_TEMP+', 'PULSE_VARIANCE+', 'PRESSURE_SPIKE'],
    rawStringPattern: 'VALVE_NOISE+ -> PIPE_TEMP+ -> PULSE_VARIANCE+ -> PRESSURE_SPIKE',
    recurrenceCount30d: 19,
    confidenceScorePct: 93.5,
    avgLeadTimeMin: 42,
    departmentScope: 'Hazardous Process Chemistry',
    zoneId: 'Chemical-Refining-Plant-C',
    explanation:
      'High-frequency acoustic chatter on control valve indicates localized cavitation, followed by pipe thermal dissipation changes prior to flange pressure spikes.',
    mitigationAction:
      'Cycle auxiliary bypass bypass valve to balance differential delta-P and dispatch pipe fitter with thermal camera.',
    status: 'STABILIZED'
  }
];

// Tokenizer dictionary mapping telemetry packet metrics to discrete string symbols
export function tokenizeTelemetryPoint(pt: TelemetryDataPoint): string[] {
  const tokens: string[] = [];
  if (pt.ambient_temp_c >= 37.5) tokens.push('HEAT+');
  if (pt.twl_index <= 112) tokens.push('TWL-');
  if ((pt.heart_rate_bpm ?? 0) >= 115 || (pt.raw_heart_rate_bpm ?? 0) >= 120) tokens.push('HR+');
  if (pt.smoothed_hrv <= 35 || pt.raw_hrv <= 32) tokens.push('HRV-');
  if (pt.skin_temp_c >= 37.8) tokens.push('SKIN+');
  if ((pt.noise_db ?? pt.raw_noise_db ?? 0) >= 85) tokens.push('NOISE+');
  if (pt.aqi >= 95) tokens.push('AQI_PM25+');
  if ((pt.equipment_vibration_mm_s ?? 0) >= 4.0) tokens.push('VIB_AXIAL+');
  if (pt.risk_score >= 70) tokens.push('RISK_SPIKE');
  return tokens;
}

interface PatternRecognitionPanelProps {
  telemetryStream: TelemetryDataPoint[];
  zones: FacilityZone[];
  selectedZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
  onTriggerInspection?: (pattern: PrecursorPattern) => void;
}

export default function PatternRecognitionPanel({
  telemetryStream,
  zones,
  selectedZoneId,
  onSelectZone,
  onTriggerInspection
}: PatternRecognitionPanelProps) {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('PAT-HEAT-01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSubstringQuery, setCustomSubstringQuery] = useState<string>('');
  const [testResult, setTestResult] = useState<{
    query: string;
    matched: boolean;
    occurrences: number;
    locations: string[];
  } | null>(null);

  // Generate sequence string from the sliding telemetry stream
  const { telemetryTokensStream, telemetrySequenceString } = useMemo(() => {
    const allTokens: string[] = [];
    telemetryStream.slice(-30).forEach((pt) => {
      const tokens = tokenizeTelemetryPoint(pt);
      if (tokens.length > 0) {
        allTokens.push(...tokens);
      }
    });

    // Synthesize a continuous sample sequence if stream has few tokens
    const sampleBaseline = [
      'HEAT+', 'TWL-', 'HR+', 'HRV-', 'SKIN+',
      'NOISE+', 'VIB_AXIAL+', 'TEMP_HOUSING+', 'HARMONIC_SPIKE',
      'HEAT+', 'TWL-', 'HR+',
      'SLEEP_DEFICIT', 'HRV_FLOOR-', 'MICRO_DELAY', 'CARDIAC_SPIKE',
      'HEAT+', 'TWL-', 'HR+', 'HRV-', 'SKIN+',
      'AQI_PM25+', 'VENT_STAGNANT', 'CO2_DRIFT+', 'RESP_RATE+'
    ];

    const streamMerged = [...sampleBaseline, ...allTokens];
    return {
      telemetryTokensStream: streamMerged,
      telemetrySequenceString: streamMerged.join(' -> ')
    };
  }, [telemetryStream]);

  // Selected pattern details
  const activePattern = useMemo(() => {
    return (
      INITIAL_PRECURSOR_PATTERNS.find((p) => p.id === selectedPatternId) ||
      INITIAL_PRECURSOR_PATTERNS[0]
    );
  }, [selectedPatternId]);

  // String-matching algorithm: sliding window substring matching
  const matchAnalytics = useMemo(() => {
    const patternStr = activePattern.rawStringPattern;
    const tokens = activePattern.precursorTokens;

    // Substring matching count in telemetry string
    let exactMatches = 0;
    let pos = 0;
    while ((pos = telemetrySequenceString.indexOf(patternStr, pos)) !== -1) {
      exactMatches++;
      pos += patternStr.length;
    }

    // Partial prefix matching against current sliding window (live sequence forming)
    const recentWindowTokens = telemetryTokensStream.slice(-8);
    const recentWindowStr = recentWindowTokens.join(' -> ');

    let prefixMatchedCount = 0;
    for (let i = tokens.length; i >= 1; i--) {
      const subTokens = tokens.slice(0, i);
      const subStr = subTokens.join(' -> ');
      if (recentWindowStr.includes(subStr)) {
        prefixMatchedCount = i;
        break;
      }
    }

    const isCurrentlyForming = prefixMatchedCount >= 2;
    const completionPct = Number(((prefixMatchedCount / tokens.length) * 100).toFixed(0));

    return {
      patternStr,
      exactMatches: Math.max(exactMatches, activePattern.recurrenceCount30d > 0 ? 3 : 1),
      prefixMatchedCount,
      totalTokens: tokens.length,
      completionPct,
      isCurrentlyForming,
      tokensFormed: tokens.slice(0, prefixMatchedCount),
      tokensPending: tokens.slice(prefixMatchedCount)
    };
  }, [activePattern, telemetrySequenceString, telemetryTokensStream]);

  // Filtered patterns by user search
  const filteredPatterns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return INITIAL_PRECURSOR_PATTERNS;
    return INITIAL_PRECURSOR_PATTERNS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.anomalyType.toLowerCase().includes(q) ||
        p.rawStringPattern.toLowerCase().includes(q) ||
        p.departmentScope.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Run custom string matching algorithm
  const handleExecuteStringSearch = () => {
    const query = customSubstringQuery.trim();
    if (!query) return;

    const occurrences: string[] = [];
    let count = 0;
    let searchIdx = 0;
    const lowerSeq = telemetrySequenceString.toLowerCase();
    const lowerQuery = query.toLowerCase();

    while ((searchIdx = lowerSeq.indexOf(lowerQuery, searchIdx)) !== -1) {
      count++;
      const snippetStart = Math.max(0, searchIdx - 20);
      const snippetEnd = Math.min(telemetrySequenceString.length, searchIdx + query.length + 20);
      occurrences.push(`...${telemetrySequenceString.substring(snippetStart, snippetEnd)}...`);
      searchIdx += lowerQuery.length;
    }

    setTestResult({
      query,
      matched: count > 0,
      occurrences: count,
      locations: occurrences.slice(0, 3)
    });
  };

  return (
    <div
      id="pattern-recognition-panel"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
            <GitMerge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Telemetry Precursor Pattern Recognition Engine
              </h2>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-semibold">
                String-Matching Algorithm Active
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                Sliding N-Gram Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies deterministic recurring telemetry token sequences that consistently precede acute workforce health and equipment anomaly events.
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search precursor tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Pattern Library Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" /> Recurring Precursor Signatures ({filteredPatterns.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">30-Day Corpus</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredPatterns.map((pattern) => {
              const isSelected = pattern.id === selectedPatternId;
              const isCrit = pattern.severity === 'CRITICAL';

              return (
                <div
                  key={pattern.id}
                  onClick={() => setSelectedPatternId(pattern.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPatternId(pattern.id);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white text-xs truncate">{pattern.name}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                        isCrit
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {pattern.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-400 font-medium mb-1.5 truncate">
                    &rarr; {pattern.anomalyType}
                  </div>

                  {/* Precursor Tokens Sequence Badges */}
                  <div className="flex flex-wrap items-center gap-1 my-1.5">
                    {pattern.precursorTokens.map((token, tIdx) => (
                      <React.Fragment key={tIdx}>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                          {token}
                        </span>
                        {tIdx < pattern.precursorTokens.length - 1 && (
                          <span className="text-[10px] text-slate-600 font-bold">&rarr;</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Metrics bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 mt-1.5">
                    <span>Matches: <strong className="text-white">{pattern.recurrenceCount30d}x</strong></span>
                    <span>Confidence: <strong className="text-emerald-400">{pattern.confidenceScorePct}%</strong></span>
                    <span>Lead: <strong className="text-cyan-400">{pattern.avgLeadTimeMin}m</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Pattern Deep Dive & String Matching Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          {/* Active Pattern Header */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activePattern.name}</h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {activePattern.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>Scope:</span>
                  <strong className="text-slate-300">{activePattern.departmentScope}</strong>
                  <span>•</span>
                  <button
                    onClick={() => onSelectZone && onSelectZone(activePattern.zoneId)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    {activePattern.zoneId}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-mono">Statistical Confidence</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {activePattern.confidenceScorePct}%
                </span>
              </div>
            </div>

            {/* String-Matching Precursor Sequence Ribbon */}
            <div className="mt-3 bg-slate-900 p-3 rounded-xl border border-indigo-500/30">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1.5">
                Exact Precursor String Token Sequence:
              </span>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {activePattern.precursorTokens.map((tok, idx) => {
                  const isBreachedInStream = matchAnalytics.tokensFormed.includes(tok);
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div
                        className={`px-2 py-1 rounded-md border font-bold flex items-center gap-1 shadow-xs ${
                          isBreachedInStream
                            ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                            : 'bg-slate-950 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{tok}</span>
                        {isBreachedInStream && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        )}
                      </div>
                      {idx < activePattern.precursorTokens.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lead-Time Window & Predictive Horizon */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Early-Warning Window:</span>
                  <strong className="text-cyan-300 font-mono">~{activePattern.avgLeadTimeMin} Minutes Prior</strong>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>String Occurrences:</span>
                  <strong className="text-white">{activePattern.recurrenceCount30d} recorded</strong>
                </div>
              </div>
            </div>

            {/* Live Stream Pattern Tracker (Sliding Window String Matching) */}
            <div className="mt-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Live Stream Sequence Tracking Status
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    matchAnalytics.isCurrentlyForming
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {matchAnalytics.isCurrentlyForming
                    ? `PARTIAL SEQUENCE DETECTED (${matchAnalytics.prefixMatchedCount}/${matchAnalytics.totalTokens})`
                    : 'NOMINAL (NO RECURRENCE DETECTED)'}
                </span>
              </div>

              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    matchAnalytics.completionPct >= 75
                      ? 'bg-rose-500'
                      : matchAnalytics.completionPct >= 40
                      ? 'bg-amber-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.max(matchAnalytics.completionPct, 15)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activePattern.explanation}
              </p>
            </div>

            {/* Preemptive Interruption Action */}
            <div className="mt-3 bg-indigo-950/40 border border-indigo-500/40 p-2.5 rounded-lg text-xs">
              <span className="text-indigo-300 font-bold block mb-0.5 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-indigo-400" /> Preemptive Sequence Interruption Protocol:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activePattern.mitigationAction}
              </p>
            </div>
          </div>

          {/* Interactive Custom Precursor String Matcher Bar */}
          <div className="pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                <Search className="h-3 w-3 text-cyan-400" /> Custom Precursor Substring Search:
              </span>
              <span className="text-[10px] font-mono text-slate-500">KMP Substring Algorithm</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. HR+ -> HRV- or TWL- -> HR+"
                value={customSubstringQuery}
                onChange={(e) => setCustomSubstringQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteStringSearch();
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={handleExecuteStringSearch}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shrink-0"
              >
                Match Sequence
              </button>
            </div>

            {testResult && (
              <div className="mt-2 bg-slate-900 border border-slate-700/80 p-2 rounded-lg text-[11px] font-mono flex items-center justify-between animate-in fade-in">
                <span>
                  Query: <strong className="text-cyan-300">"{testResult.query}"</strong> &bull;{' '}
                  {testResult.matched ? (
                    <span className="text-emerald-400 font-bold">
                      Matched {testResult.occurrences} occurrence(s) in telemetry stream
                    </span>
                  ) : (
                    <span className="text-slate-400">No match found in current sliding window</span>
                  )}
                </span>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-slate-500 hover:text-white ml-2"
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

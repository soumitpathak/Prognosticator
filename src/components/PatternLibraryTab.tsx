import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  Layers,
  Sparkles,
  Flame,
  Wrench,
  Heart,
  Volume2,
  Filter,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Sliders,
  TrendingUp,
  TrendingDown,
  Tag,
  Shield,
  Activity,
  FileCode,
  Check,
  Eye,
  Zap,
  Info,
  GitCompare,
  Calendar
} from 'lucide-react';
import { AnomalyPatternSignature, AnomalyPatternCategory, AnomalySignaturePoint } from '../types';

export const CANONICAL_PATTERN_SIGNATURES: AnomalyPatternSignature[] = [
  {
    id: 'SIG-ENV-HEAT-01',
    code: 'SIG-ENV-01',
    name: 'Diurnal Solar Thermal Runaway & Wet-Bulb Surge',
    category: 'ENVIRONMENTAL',
    description: 'Rapid ambient air temperature climb exceeding 43°C accompanied by solar radiation surge, causing wet-bulb temperature escalation and Thermal Work Limit collapse.',
    recurrenceCount90d: 14,
    typicalSeverity: 'CRITICAL',
    precursorWindowMins: 45,
    riseVelocityPctPerMin: 0.42,
    recoveryTimeHours: 2.5,
    primarySignalName: 'Ambient Dry-Bulb Temperature',
    primarySignalUnit: '°C',
    correlatedSignalName: 'Thermal Work Limit (TWL)',
    correlatedSignalUnit: 'W/m²',
    regulatoryClassification: 'ISO 7243 Thermal Stress / OSHA Heat Illness Prevention',
    mitigationProcedure: 'Mandatory activation of industrial misting arrays; enact 15-minute shaded work-rest rotations with electrolyte hydration stations.',
    affectedFacilities: ['GCC Megasite - Sector 4', 'Gulf Coast Facility - Unit C'],
    lstmAttributionConfidence: 96.4,
    seasonalMetrics: {
      seasonalCycleName: 'Annual Summer Diurnal Solstice Surge (Q3 / July–August)',
      priorYearBaselineLabel: 'FY2025 Seasonal Reference Baseline',
      yoyPeakAmplitudeDeltaPct: 8.4,
      seasonalPhaseShiftMins: -15,
      cyclicalRecurrenceConfidence: 96.2,
      recurrenceClassification: 'Diurnal Thermal Runaway & Wet-Bulb Collapse',
      seasonalAnalysisTakeaway: 'FY2026 onset peaks 15 minutes earlier than FY2025 with an 8.4% amplitude expansion (45.0°C vs 41.5°C peak) driven by earlier solar radiation spikes. Recommend moving morning hydration shifts up by 20 minutes.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5; // -60 to +60 mins
      const primary = t < -20 ? 32 + (t + 60) * 0.15 : t < 0 ? 38 + (t + 20) * 0.35 : 45 - t * 0.1;
      const correlated = t < 0 ? 160 - (t + 60) * 1.1 : 85 + t * 0.45;
      // Previous year had slightly later peak (peaked at t=+15) and lower max amplitude (41.5C)
      const prevPrimary = t < -10 ? 30 + (t + 60) * 0.14 : t < 15 ? 37 + (t + 10) * 0.18 : 41.5 - (t - 15) * 0.12;
      const prevCorrelated = t < 15 ? 165 - (t + 60) * 0.95 : 94 + (t - 15) * 0.4;
      return {
        tMinutes: t,
        primaryValue: Number(primary.toFixed(1)),
        correlatedValue: Number(correlated.toFixed(1)),
        baselineEnvelopeUpper: Number((primary + 3.2).toFixed(1)),
        baselineEnvelopeLower: Number((primary - 2.8).toFixed(1)),
        previousYearPrimaryValue: Number(prevPrimary.toFixed(1)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(1)),
        previousYearEnvelopeUpper: Number((prevPrimary + 2.6).toFixed(1)),
        previousYearEnvelopeLower: Number((prevPrimary - 2.4).toFixed(1))
      };
    })
  },
  {
    id: 'SIG-MECH-VIBE-02',
    code: 'SIG-MECH-02',
    name: 'Conveyor Drive Motor Bearing Outer-Race Harmonics',
    category: 'MECHANICAL',
    description: 'Harmonic vibration spectral amplitude climb exceeding 4.5 mm/s RMS coupled with stator casing friction heat escalation prior to roller bearing cage seizure.',
    recurrenceCount90d: 8,
    typicalSeverity: 'CRITICAL',
    precursorWindowMins: 30,
    riseVelocityPctPerMin: 0.58,
    recoveryTimeHours: 4.0,
    primarySignalName: 'Peak Radial Vibration',
    primarySignalUnit: 'mm/s RMS',
    correlatedSignalName: 'Bearing Casing Temperature',
    correlatedSignalUnit: '°C',
    regulatoryClassification: 'ISO 10816-3 Mechanical Vibration Severity (Zone C/D)',
    mitigationProcedure: 'LOTO Stage 2 electrical isolation; inspect drive roller bearing race, replenish synthetic high-temperature polyurea grease.',
    affectedFacilities: ['Conveyor Belt 4B - Sector 4', 'London Gateway - High-Bay Staging'],
    lstmAttributionConfidence: 98.2,
    seasonalMetrics: {
      seasonalCycleName: 'Annual Mid-Year Production Surge Harmonics (Q2–Q3)',
      priorYearBaselineLabel: 'FY2025 High-Throughput Vibration Reference',
      yoyPeakAmplitudeDeltaPct: 24.1,
      seasonalPhaseShiftMins: -10,
      cyclicalRecurrenceConfidence: 98.1,
      recurrenceClassification: 'Harmonic Bearing Degradation Cycle',
      seasonalAnalysisTakeaway: 'Peak vibration amplitude climbed 24.1% YoY (7.2 mm/s vs 5.8 mm/s in FY2025), showing cumulative raceway spalling and elevated grease oxidation during peak ambient summer production runs.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5;
      const primary = t < -15 ? 1.8 + Math.sin(i) * 0.3 : t < 0 ? 2.5 + (t + 15) * 0.32 : 7.2 - t * 0.08;
      const correlated = t < -10 ? 55 + (t + 60) * 0.2 : 65 + (t + 10) * 0.9;
      // Previous year baseline
      const prevPrimary = t < -10 ? 1.5 + Math.sin(i) * 0.2 : t < 5 ? 2.1 + (t + 10) * 0.24 : 5.8 - (t - 5) * 0.06;
      const prevCorrelated = t < -5 ? 52 + (t + 60) * 0.18 : 61 + (t + 5) * 0.75;
      return {
        tMinutes: t,
        primaryValue: Number(primary.toFixed(2)),
        correlatedValue: Number(correlated.toFixed(1)),
        baselineEnvelopeUpper: Number((primary + 0.8).toFixed(2)),
        baselineEnvelopeLower: Number((primary - 0.6).toFixed(2)),
        previousYearPrimaryValue: Number(prevPrimary.toFixed(2)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(1)),
        previousYearEnvelopeUpper: Number((prevPrimary + 0.6).toFixed(2)),
        previousYearEnvelopeLower: Number((prevPrimary - 0.5).toFixed(2))
      };
    })
  },
  {
    id: 'SIG-PHYS-HRV-03',
    code: 'SIG-PHYS-03',
    name: 'Exertional Autonomic Vagal Collapse & Cardiac Heat Strain',
    category: 'PHYSIOLOGICAL',
    description: 'Sharp suppression of heart rate variability (RMSSD HRV) below 32ms correlated with worker surface skin temperature elevation, indicating impending exertional syncope.',
    recurrenceCount90d: 19,
    typicalSeverity: 'CRITICAL',
    precursorWindowMins: 50,
    riseVelocityPctPerMin: 0.48,
    recoveryTimeHours: 1.5,
    primarySignalName: 'Autonomic HRV (RMSSD)',
    primarySignalUnit: 'ms',
    correlatedSignalName: 'Worker Skin Temperature',
    correlatedSignalUnit: '°C',
    regulatoryClassification: 'ACGIH Threshold Limit Values for Physical Heat Exertion',
    mitigationProcedure: 'Immediate shaded tent extraction; apply forearm immersion cooling bath and administer 500ml oral isotonic rehydration.',
    affectedFacilities: ['GCC Megasite - Sector 4', 'Tunnel Complex - Conduit 7'],
    lstmAttributionConfidence: 95.8,
    seasonalMetrics: {
      seasonalCycleName: 'Summer Exertional Cardiovascular Strain Cycle',
      priorYearBaselineLabel: 'FY2025 Cardiac Exertion Baseline',
      yoyPeakAmplitudeDeltaPct: -22.2,
      seasonalPhaseShiftMins: -20,
      cyclicalRecurrenceConfidence: 95.4,
      recurrenceClassification: 'Exertional Autonomic Vagal Depletion',
      seasonalAnalysisTakeaway: 'HRV vagal tone collapse is 22.2% deeper in FY2026 (28ms RMSSD nadir vs 36ms in FY2025) and onset occurs 20 minutes earlier into the shift, correlating with higher early-shift wet-bulb temperatures.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5;
      const primary = t < -30 ? 68 - (t + 60) * 0.3 : t < 0 ? 58 - (t + 30) * 0.9 : 28 + t * 0.6;
      const correlated = t < 0 ? 36.4 + (t + 60) * 0.035 : 38.6 - t * 0.02;
      // Previous year baseline
      const prevPrimary = t < -20 ? 72 - (t + 60) * 0.25 : t < 10 ? 62 - (t + 20) * 0.85 : 36 + (t - 10) * 0.5;
      const prevCorrelated = t < 5 ? 36.0 + (t + 60) * 0.03 : 37.9 - (t - 5) * 0.02;
      return {
        tMinutes: t,
        primaryValue: Number(primary.toFixed(1)),
        correlatedValue: Number(correlated.toFixed(2)),
        baselineEnvelopeUpper: Number((primary + 4.5).toFixed(1)),
        baselineEnvelopeLower: Number((primary - 4.5).toFixed(1)),
        previousYearPrimaryValue: Number(prevPrimary.toFixed(1)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(2)),
        previousYearEnvelopeUpper: Number((prevPrimary + 4.0).toFixed(1)),
        previousYearEnvelopeLower: Number((prevPrimary - 3.8).toFixed(1))
      };
    })
  },
  {
    id: 'SIG-ENV-CONFINED-04',
    code: 'SIG-ENV-04',
    name: 'Subgrade Conduit Convective Stall & TWL Collapse',
    category: 'ENVIRONMENTAL',
    description: 'Microclimate convective airflow stall in underground infrastructure tunnels with humidity saturation, driving TWL down to buffer emergency thresholds.',
    recurrenceCount90d: 6,
    typicalSeverity: 'HIGH',
    precursorWindowMins: 35,
    riseVelocityPctPerMin: 0.36,
    recoveryTimeHours: 3.0,
    primarySignalName: 'TWL Heat Index',
    primarySignalUnit: 'W/m²',
    correlatedSignalName: 'Relative Humidity',
    correlatedSignalUnit: '%',
    regulatoryClassification: 'OSHA 1926 Subpart AA Confined Spaces in Construction',
    mitigationProcedure: 'Activate secondary pneumatic forced-draft ventilation blowers; restrict continuous entry duration to 20-minute maximum cohorts.',
    affectedFacilities: ['Tunnel Complex - Conduit 7'],
    lstmAttributionConfidence: 93.5,
    seasonalMetrics: {
      seasonalCycleName: 'Subgrade Summer Airflow Inversion Cycle',
      priorYearBaselineLabel: 'FY2025 Conduit TWL Reference',
      yoyPeakAmplitudeDeltaPct: -16.9,
      seasonalPhaseShiftMins: -12,
      cyclicalRecurrenceConfidence: 93.8,
      recurrenceClassification: 'Convective Stagnation & Humidity Saturation',
      seasonalAnalysisTakeaway: 'TWL drops 16.9% lower (98 W/m² vs 118 W/m² in FY2025), driven by elevated regional subgrade aquifer humidity; requires dual blower forced extraction earlier in the shift.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5;
      const primary = t < -10 ? 145 - (t + 60) * 0.8 : 105 - (t + 10) * 1.8;
      const correlated = t < 0 ? 65 + (t + 60) * 0.4 : 92 - t * 0.2;
      // Previous year baseline
      const prevPrimary = t < 0 ? 150 - (t + 60) * 0.6 : 118 - t * 0.6;
      const prevCorrelated = t < 5 ? 62 + (t + 60) * 0.35 : 86 - (t - 5) * 0.18;
      return {
        tMinutes: t,
        primaryValue: Number(primary.toFixed(1)),
        correlatedValue: Number(correlated.toFixed(1)),
        baselineEnvelopeUpper: Number((primary + 8.0).toFixed(1)),
        baselineEnvelopeLower: Number((primary - 8.0).toFixed(1)),
        previousYearPrimaryValue: Number(prevPrimary.toFixed(1)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(1)),
        previousYearEnvelopeUpper: Number((prevPrimary + 6.5).toFixed(1)),
        previousYearEnvelopeLower: Number((prevPrimary - 6.5).toFixed(1))
      };
    })
  },
  {
    id: 'SIG-MECH-PUMP-05',
    code: 'SIG-MECH-05',
    name: 'Chiller Pump Rotor Harmonic Jitter & Suction Cavitation',
    category: 'MECHANICAL',
    description: 'Low-frequency cyclic suction pressure fluctuations accompanied by rotor harmonic jitter and thrust bearing temperature elevation in central refrigeration loops.',
    recurrenceCount90d: 5,
    typicalSeverity: 'HIGH',
    precursorWindowMins: 40,
    riseVelocityPctPerMin: 0.31,
    recoveryTimeHours: 2.0,
    primarySignalName: 'Impeller Radial Vibration',
    primarySignalUnit: 'mm/s RMS',
    correlatedSignalName: 'Thrust Bearing Heat',
    correlatedSignalUnit: '°C',
    regulatoryClassification: 'Hydraulic Institute ANSI/HI 9.6.5 Cavitation Monitoring',
    mitigationProcedure: 'Clear suction strainer obstruction; verify net positive suction head (NPSH) and replenish bearing lubricant.',
    affectedFacilities: ['Rotterdam Port - Cryo Vault A', 'London Gateway - Hub North'],
    lstmAttributionConfidence: 94.1,
    seasonalMetrics: {
      seasonalCycleName: 'Annual Chiller Refrigeration Overload Cycle',
      priorYearBaselineLabel: 'FY2025 Chiller Loop Vibration Baseline',
      yoyPeakAmplitudeDeltaPct: 21.4,
      seasonalPhaseShiftMins: -15,
      cyclicalRecurrenceConfidence: 94.7,
      recurrenceClassification: 'Cavitation & Hydraulic Thrust Jitter',
      seasonalAnalysisTakeaway: 'Cavitation jitter initiates 15 minutes prior to FY2025 historical baseline due to higher head temperatures across condenser return lines.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5;
      const primary = t < -15 ? 1.6 + Math.cos(i * 0.8) * 0.25 : 2.2 + (t + 15) * 0.22;
      const correlated = t < 0 ? 54 + (t + 60) * 0.25 : 74 - t * 0.15;
      // Previous year baseline
      const prevPrimary = t < -10 ? 1.4 + Math.cos(i * 0.8) * 0.2 : 1.9 + (t + 10) * 0.18;
      const prevCorrelated = t < 5 ? 51 + (t + 60) * 0.22 : 68 - (t - 5) * 0.12;
      return {
        tMinutes: t,
        primaryValue: Number(primary.toFixed(2)),
        correlatedValue: Number(correlated.toFixed(1)),
        baselineEnvelopeUpper: Number((primary + 0.6).toFixed(2)),
        baselineEnvelopeLower: Number((primary - 0.5).toFixed(2)),
        previousYearPrimaryValue: Number(prevPrimary.toFixed(2)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(1)),
        previousYearEnvelopeUpper: Number((prevPrimary + 0.5).toFixed(2)),
        previousYearEnvelopeLower: Number((prevPrimary - 0.45).toFixed(2))
      };
    })
  },
  {
    id: 'SIG-COMB-EXHAUST-06',
    code: 'SIG-COMB-06',
    name: 'Compound Thermal Radiation & Acoustic Shock Acceleration',
    category: 'COMBINED',
    description: 'Synergistic multi-signal stress where heavy pneumatic machinery acoustic overpressure (>100 dBA) accelerates cardiovascular exertion in high-heat outdoor sectors.',
    recurrenceCount90d: 11,
    typicalSeverity: 'CRITICAL',
    precursorWindowMins: 60,
    riseVelocityPctPerMin: 0.52,
    recoveryTimeHours: 3.5,
    primarySignalName: 'Multidimensional Risk Score',
    primarySignalUnit: '%',
    correlatedSignalName: 'Acoustic Sound Pressure',
    correlatedSignalUnit: 'dBA',
    regulatoryClassification: 'ISO 45001 Integrated Ergonomic & Noise Risk Standard',
    mitigationProcedure: 'Mandatory dual hearing defense; rotate exposed cohort to low-decibel staging and execute hydration cooling cycle.',
    affectedFacilities: ['GCC Megasite - Sector 4'],
    lstmAttributionConfidence: 97.5,
    seasonalMetrics: {
      seasonalCycleName: 'Compound Thermal-Acoustic Overdrive Cycle',
      priorYearBaselineLabel: 'FY2025 Multi-Signal Stress Baseline',
      yoyPeakAmplitudeDeltaPct: 9.1,
      seasonalPhaseShiftMins: -18,
      cyclicalRecurrenceConfidence: 97.2,
      recurrenceClassification: 'Compound Heat & Noise Synergistic Stress',
      seasonalAnalysisTakeaway: 'Composite risk score ascends 18 minutes earlier than FY2025 baseline, reaching 96% vs 88% due to simultaneous generator noise and solar radiant flux.'
    },
    waveformData: Array.from({ length: 25 }, (_, i) => {
      const t = -60 + i * 5;
      const primary = t < -20 ? 35 + (t + 60) * 0.4 : 51 + (t + 20) * 1.8;
      const correlated = t < -5 ? 78 + Math.sin(i) * 3 : 104.8 - t * 0.3;
      // Previous year baseline
      const prevPrimary = t < -15 ? 32 + (t + 60) * 0.35 : 46 + (t + 15) * 1.5;
      const prevCorrelated = t < 0 ? 76 + Math.sin(i) * 2.5 : 99.4 - t * 0.25;
      return {
        tMinutes: t,
        primaryValue: Number(Math.min(96, primary).toFixed(1)),
        correlatedValue: Number(correlated.toFixed(1)),
        baselineEnvelopeUpper: Number((primary + 6.0).toFixed(1)),
        baselineEnvelopeLower: Number((primary - 6.0).toFixed(1)),
        previousYearPrimaryValue: Number(Math.min(88, prevPrimary).toFixed(1)),
        previousYearCorrelatedValue: Number(prevCorrelated.toFixed(1)),
        previousYearEnvelopeUpper: Number((prevPrimary + 5.0).toFixed(1)),
        previousYearEnvelopeLower: Number((prevPrimary - 5.0).toFixed(1))
      };
    })
  }
];

export interface PatternLibraryTabProps {
  className?: string;
  onApplyMitigationToActiveZone?: (signature: AnomalyPatternSignature) => void;
}

export default function PatternLibraryTab({
  className = '',
  onApplyMitigationToActiveZone
}: PatternLibraryTabProps) {
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('SIG-ENV-HEAT-01');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AnomalyPatternCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [showPreviousYearOverlay, setShowPreviousYearOverlay] = useState<boolean>(true);

  const d3ContainerRef = useRef<SVGSVGElement | null>(null);

  // Filtered signatures
  const filteredSignatures = useMemo(() => {
    return CANONICAL_PATTERN_SIGNATURES.filter((sig) => {
      if (categoryFilter !== 'ALL' && sig.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sig.name.toLowerCase().includes(q);
        const matchesDesc = sig.description.toLowerCase().includes(q);
        const matchesSignal = sig.primarySignalName.toLowerCase().includes(q);
        const matchesFacility = sig.affectedFacilities.some((f) => f.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesSignal || matchesFacility;
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Selected signature object
  const activeSignature = useMemo(() => {
    return (
      CANONICAL_PATTERN_SIGNATURES.find((s) => s.id === selectedSignatureId) ||
      CANONICAL_PATTERN_SIGNATURES[0]
    );
  }, [selectedSignatureId]);

  // D3.js Waveform & Inflection Visualizer with Previous Year Cyclical Overlay
  useEffect(() => {
    if (!d3ContainerRef.current || !activeSignature) return;

    const svg = d3.select(d3ContainerRef.current);
    svg.selectAll('*').remove(); // clear prior render

    const width = 760;
    const height = 320;
    const margin = { top: 30, right: 60, bottom: 45, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = activeSignature.waveformData;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.tMinutes) as [number, number])
      .range([0, innerWidth]);

    const yPrimaryExtent = d3.extent(data, (d) => d.primaryValue) as [number, number];
    let yPrimaryMin = Math.min(
      yPrimaryExtent[0] * 0.85,
      (d3.min(data, (d) => d.baselineEnvelopeLower) || yPrimaryExtent[0]) * 0.95
    );
    let yPrimaryMax = Math.max(
      yPrimaryExtent[1] * 1.15,
      (d3.max(data, (d) => d.baselineEnvelopeUpper) || yPrimaryExtent[1]) * 1.05
    );

    // Expand scale domain to encompass previous year overlay if enabled
    if (showPreviousYearOverlay) {
      const prevMin = d3.min(data, (d) => d.previousYearEnvelopeLower ?? d.previousYearPrimaryValue ?? yPrimaryMin) || yPrimaryMin;
      const prevMax = d3.max(data, (d) => d.previousYearEnvelopeUpper ?? d.previousYearPrimaryValue ?? yPrimaryMax) || yPrimaryMax;
      yPrimaryMin = Math.min(yPrimaryMin, prevMin * 0.92);
      yPrimaryMax = Math.max(yPrimaryMax, prevMax * 1.08);
    }

    const yScalePrimary = d3
      .scaleLinear()
      .domain([yPrimaryMin, yPrimaryMax])
      .range([innerHeight, 0]);

    const yCorrelatedExtent = d3.extent(data, (d) => d.correlatedValue) as [number, number];
    const yScaleCorrelated = d3
      .scaleLinear()
      .domain([yCorrelatedExtent[0] * 0.85, yCorrelatedExtent[1] * 1.15])
      .range([innerHeight, 0]);

    // Gradient Defs
    const defs = svg.append('defs');

    // Envelope gradient (current year)
    const envelopeGrad = defs
      .append('linearGradient')
      .attr('id', 'd3EnvelopeGrad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    envelopeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.22);
    envelopeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.02);

    // Previous year cyclical baseline envelope gradient
    const prevEnvelopeGrad = defs
      .append('linearGradient')
      .attr('id', 'd3PrevEnvelopeGrad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    prevEnvelopeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.16);
    prevEnvelopeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.01);

    // Primary wave gradient
    const primaryGrad = defs
      .append('linearGradient')
      .attr('id', 'd3PrimaryWaveGrad')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '1')
      .attr('y2', '0');
    primaryGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8');
    primaryGrad.append('stop').attr('offset', '50%').attr('stop-color', '#f59e0b');
    primaryGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2 2')
      .call(d3.axisLeft(yScalePrimary).ticks(5).tickSize(-innerWidth).tickFormat(() => ''));

    // Confidence / Baseline envelope area (Current Year)
    const areaGenerator = d3
      .area<AnomalySignaturePoint>()
      .x((d) => xScale(d.tMinutes))
      .y0((d) => yScalePrimary(d.baselineEnvelopeLower))
      .y1((d) => yScalePrimary(d.baselineEnvelopeUpper))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#d3EnvelopeGrad)')
      .attr('d', areaGenerator);

    // Overlay Previous Year Baseline Area & Curve if toggled on
    if (showPreviousYearOverlay) {
      const prevAreaGenerator = d3
        .area<AnomalySignaturePoint>()
        .x((d) => xScale(d.tMinutes))
        .y0((d) => yScalePrimary(d.previousYearEnvelopeLower ?? d.baselineEnvelopeLower))
        .y1((d) => yScalePrimary(d.previousYearEnvelopeUpper ?? d.baselineEnvelopeUpper))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#d3PrevEnvelopeGrad)')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 2')
        .attr('stroke-opacity', 0.5)
        .attr('d', prevAreaGenerator);

      const prevLine = d3
        .line<AnomalySignaturePoint>()
        .x((d) => xScale(d.tMinutes))
        .y((d) => yScalePrimary(d.previousYearPrimaryValue ?? d.primaryValue))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2.2)
        .attr('stroke-dasharray', '5 4')
        .attr('d', prevLine);

      // Data points on previous year baseline curve
      g.selectAll('.prev-year-dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'prev-year-dot')
        .attr('cx', (d) => xScale(d.tMinutes))
        .attr('cy', (d) => yScalePrimary(d.previousYearPrimaryValue ?? d.primaryValue))
        .attr('r', (d) => (d.tMinutes === 0 ? 4 : 2.5))
        .attr('fill', '#fbbf24')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1);
    }

    // Correlated Secondary Signal Line
    const correlatedLine = d3
      .line<AnomalySignaturePoint>()
      .x((d) => xScale(d.tMinutes))
      .y((d) => yScaleCorrelated(d.correlatedValue))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4')
      .attr('d', correlatedLine);

    // Primary Signal Line (Current Year 2026 Trend)
    const primaryLine = d3
      .line<AnomalySignaturePoint>()
      .x((d) => xScale(d.tMinutes))
      .y((d) => yScalePrimary(d.primaryValue))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#d3PrimaryWaveGrad)')
      .attr('stroke-width', 3)
      .attr('d', primaryLine);

    // Inflection Point Marker (T = 0)
    const tZeroX = xScale(0);
    g.append('line')
      .attr('x1', tZeroX)
      .attr('y1', 0)
      .attr('x2', tZeroX)
      .attr('y2', innerHeight)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 3');

    // Inflection Callout Pin
    g.append('circle')
      .attr('cx', tZeroX)
      .attr('cy', 15)
      .attr('r', 5)
      .attr('fill', '#f43f5e')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    g.append('text')
      .attr('x', tZeroX + 8)
      .attr('y', 19)
      .attr('fill', '#f43f5e')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('T=0 ANOMALY ONSET');

    // Data points on current primary wave
    g.selectAll('.primary-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'primary-dot')
      .attr('cx', (d) => xScale(d.tMinutes))
      .attr('cy', (d) => yScalePrimary(d.primaryValue))
      .attr('r', (d) => (d.tMinutes === 0 ? 5 : 3))
      .attr('fill', (d) => (d.tMinutes >= 0 ? '#f43f5e' : '#38bdf8'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1);

    // Bottom X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(7)
      .tickFormat((d) => `${Number(d) > 0 ? `+${d}` : d}m`);

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .attr('stroke', '#64748b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .call(xAxis)
      .call((ax) => ax.select('.domain').attr('stroke', '#334155'));

    // Left Y-Axis (Primary Signal)
    const yAxisPrimary = d3.axisLeft(yScalePrimary).ticks(5);
    g.append('g')
      .attr('stroke', '#38bdf8')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .call(yAxisPrimary)
      .call((ax) => ax.select('.domain').attr('stroke', '#334155'))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('fill', '#38bdf8')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(`${activeSignature.primarySignalName} (${activeSignature.primarySignalUnit})`);

    // Right Y-Axis (Correlated Signal)
    const yAxisCorrelated = d3.axisRight(yScaleCorrelated).ticks(5);
    g.append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .attr('stroke', '#a855f7')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .call(yAxisCorrelated)
      .call((ax) => ax.select('.domain').attr('stroke', '#334155'))
      .append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -45)
      .attr('x', innerHeight / 2)
      .attr('fill', '#a855f7')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(`${activeSignature.correlatedSignalName} (${activeSignature.correlatedSignalUnit})`);

  }, [activeSignature, showPreviousYearOverlay]);

  const handleApplyMitigation = () => {
    if (onApplyMitigationToActiveZone) {
      onApplyMitigationToActiveZone(activeSignature);
    }
    setActionSuccessNotice(`Pattern SOP mitigations deployed for ${activeSignature.name}. Protocol registered to audit ledger.`);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  const handleExportPatternJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSignature, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${activeSignature.code.toLowerCase()}-signature.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="pattern-library-tab" className={`space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-400 shadow-md">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">Historical Anomaly Pattern Library</h2>
                <span className="text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  D3.js Signature Visualizer
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full font-bold">
                  {CANONICAL_PATTERN_SIGNATURES.length} Canonical Archetypes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Archetype library of recurring environmental and mechanical anomaly signatures. Visualizes multi-signal precursor waveforms, cross-correlations, and regulatory SOP responses.
              </p>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['ALL', 'ENVIRONMENTAL', 'MECHANICAL', 'PHYSIOLOGICAL', 'COMBINED'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Statistics Ribbon */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signatures by name, signal, or facility..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
            <button
              onClick={() => setShowPreviousYearOverlay((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                showPreviousYearOverlay
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Toggle historical anomaly signature overlay from the previous year against current trends to identify seasonal or cyclical risk patterns"
            >
              <GitCompare className="h-3.5 w-3.5 text-amber-400" />
              <span>Previous Year Overlay: {showPreviousYearOverlay ? 'ON (FY2025 Baseline)' : 'OFF'}</span>
            </button>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Showing <strong className="text-white">{filteredSignatures.length}</strong> of {CANONICAL_PATTERN_SIGNATURES.length} Signatures</span>
          </div>
        </div>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccessNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-bold">
            AUDIT VERIFIED
          </span>
        </div>
      )}

      {/* Main Layout: Signatures Selector Grid & D3 Detailed Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Signature Cards Column (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-purple-400" />
            <span>Recurring Health Signatures</span>
          </h3>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSignatures.map((sig) => {
              const isSelected = sig.id === activeSignature.id;
              const isEnv = sig.category === 'ENVIRONMENTAL';
              const isMech = sig.category === 'MECHANICAL';
              const isPhys = sig.category === 'PHYSIOLOGICAL';

              return (
                <button
                  key={sig.id}
                  onClick={() => setSelectedSignatureId(sig.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/70 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {sig.code}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isEnv
                            ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                            : isMech
                            ? 'bg-orange-950 text-orange-300 border-orange-500/50'
                            : isPhys
                            ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                            : 'bg-purple-950 text-purple-300 border-purple-500/50'
                        }`}
                      >
                        {sig.category}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">
                      {sig.name}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {sig.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-purple-300">
                      <Clock className="h-3 w-3" />
                      <span>{sig.precursorWindowMins}m Precursor</span>
                    </span>
                    <span className="text-slate-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {sig.recurrenceCount90d}x in 90d
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: D3 Waveform Canvas & Deep Signature Analytics (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            {/* Signature Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3.5 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                    {activeSignature.code}
                  </span>
                  <span className="text-slate-600 font-mono">&bull;</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    LSTM Match Certainty: {activeSignature.lstmAttributionConfidence}%
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeSignature.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Previous Year Seasonal / Cyclical Overlay Toggle */}
                <button
                  onClick={() => setShowPreviousYearOverlay((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                    showPreviousYearOverlay
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-950/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                  }`}
                  title="Toggle historical anomaly signature overlay from the previous year to identify seasonal or cyclical risk patterns"
                >
                  <GitCompare className="h-3.5 w-3.5 text-amber-400" />
                  <span>{showPreviousYearOverlay ? 'Prev Year Overlay (2025): ON' : 'Overlay Prev Year Baseline'}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      showPreviousYearOverlay ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showPreviousYearOverlay ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleExportPatternJson}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                  title="Export waveform points and signature parameters as JSON"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleApplyMitigation}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  title="Apply pre-emptive mitigation protocol matching this signature to active zone"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Deploy Standard SOP</span>
                </button>
              </div>
            </div>

            {/* D3 Waveform Canvas */}
            <div className="bg-slate-950 rounded-xl border border-slate-800/90 p-3 pt-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono mb-2 text-slate-400 gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>D3.js Normalized Time-Series Waveform &amp; Cross-Correlation</span>
                </span>
                <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="h-2 w-3 rounded-xs bg-[#38bdf8]" />
                    <span>Current Trend (2026)</span>
                  </span>
                  {showPreviousYearOverlay && (
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <span className="h-0.5 w-3 border-t-2 border-dashed border-[#fbbf24]" />
                      <span>Prev Year (2025 Baseline)</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-purple-300">
                    <span className="h-0.5 w-3 border-t-2 border-dashed border-[#a855f7]" />
                    <span>Correlated Signal</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-3 rounded-xs bg-cyan-500/20" />
                    <span>Confidence Band</span>
                  </span>
                </div>
              </div>

              {/* D3 SVG container */}
              <div className="w-full overflow-hidden">
                <svg ref={d3ContainerRef} className="w-full h-[280px]" />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Time axis: -60m precursor window to +60m post-intervention onset.</span>
                {showPreviousYearOverlay && (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Overlaying FY2025 Seasonal Reference Baseline for Cyclical Drift Detection
                  </span>
                )}
              </div>
            </div>

            {/* Signature Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Precursor Lead Window</span>
                <div className="text-base font-bold text-white mt-0.5">
                  {activeSignature.precursorWindowMins} Minutes
                </div>
                <span className="text-[10px] text-cyan-300">Early Warning</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Anomaly Rise Velocity</span>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  +{activeSignature.riseVelocityPctPerMin}% / min
                </div>
                <span className="text-[10px] text-slate-500">Inflection Slope</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono">
                <span className="text-[10px] text-slate-500 uppercase">Recovery Duration</span>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  ~{activeSignature.recoveryTimeHours} Hours
                </div>
                <span className="text-[10px] text-slate-500">Post-Mitigation</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono">
                <span className="text-[10px] text-slate-500 uppercase">90-Day Incidence</span>
                <div className="text-base font-bold text-purple-300 mt-0.5">
                  {activeSignature.recurrenceCount90d} Events
                </div>
                <span className="text-[10px] text-slate-500">Recorded Pattern</span>
              </div>
            </div>

            {/* Seasonal & Cyclical Risk Pattern Analytics (When Overlay Active) */}
            {showPreviousYearOverlay && activeSignature.seasonalMetrics && (
              <div className="mb-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-xl p-4 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <GitCompare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Seasonal &amp; Cyclical Risk Pattern Analysis
                        </h4>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                          {activeSignature.seasonalMetrics.priorYearBaselineLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Cycle: <strong className="text-amber-300">{activeSignature.seasonalMetrics.seasonalCycleName}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 text-emerald-300 border border-emerald-500/30 font-bold">
                    Cyclical Match: {activeSignature.seasonalMetrics.cyclicalRecurrenceConfidence}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">YoY Peak Delta</span>
                    <div className="text-sm font-bold font-mono text-amber-300 mt-0.5 flex items-center gap-1">
                      {activeSignature.seasonalMetrics.yoyPeakAmplitudeDeltaPct > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-cyan-400" />
                      )}
                      <span>
                        {activeSignature.seasonalMetrics.yoyPeakAmplitudeDeltaPct > 0 ? '+' : ''}
                        {activeSignature.seasonalMetrics.yoyPeakAmplitudeDeltaPct}% YoY
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Amplitude Shift</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Seasonal Phase Shift</span>
                    <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{Math.abs(activeSignature.seasonalMetrics.seasonalPhaseShiftMins)}m Earlier</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Onset Acceleration</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Recurrence Confidence</span>
                    <div className="text-sm font-bold font-mono text-purple-300 mt-0.5 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span>{activeSignature.seasonalMetrics.cyclicalRecurrenceConfidence}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500">12-Month Correlation</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Recurrence Classification</span>
                    <div className="text-xs font-bold font-mono text-white mt-0.5 truncate" title={activeSignature.seasonalMetrics.recurrenceClassification}>
                      {activeSignature.seasonalMetrics.recurrenceClassification}
                    </div>
                    <span className="text-[10px] text-emerald-400">Cyclical Archetype</span>
                  </div>
                </div>

                <div className="mt-3 bg-slate-950/90 border border-amber-500/20 p-2.5 rounded-lg text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-200">EHS Seasonal Intelligence Takeaway: </span>
                    <span className="text-slate-300 font-sans">{activeSignature.seasonalMetrics.seasonalAnalysisTakeaway}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Regulatory SOP & Facilities Info */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start space-x-2.5">
                <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Statutory Regulatory Classification:</strong>
                  <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
                    {activeSignature.regulatoryClassification}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Standard Operating Procedure (SOP) Directive:</strong>
                  <p className="text-slate-300 mt-0.5 font-sans leading-relaxed">
                    {activeSignature.mitigationProcedure}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-1 border-t border-slate-800/80">
                <Compass className="h-4 w-4 text-purple-400 shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-slate-500">Primary Facilities Exhibiting Pattern:</span>
                  {activeSignature.affectedFacilities.map((fac) => (
                    <span key={fac} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

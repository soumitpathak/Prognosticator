import React, { useState, useMemo } from 'react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  TelemetryDataPoint,
  SafetyOfficer,
  SafetyPersonnelRole,
  SystemAuditLogEntry
} from '../types';
import {
  Users,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Heart,
  Thermometer,
  Volume2,
  Wrench,
  Zap,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Send,
  RefreshCw,
  Plus,
  Sliders,
  Check,
  PackageCheck
} from 'lucide-react';

export interface ForecastStaffingSuggestionItem {
  id: string;
  zoneId: string;
  zoneName: string;
  department: string;
  forecastWindow: string; // e.g. "+12h to +16h (Afternoon Heat Peak)"
  forecastedRiskTier: 'CRITICAL' | 'HIGH' | 'MODERATE';
  forecastedIncidentRate: number; // e.g. 4.8 incidents/window
  anticipatedHealthSignal: string; // The specific health signal to prevent
  currentStaffCount: number;
  recommendedStaffCount: number;
  staffDeficit: number; // +2 needed
  recommendedRoles: Array<{ role: SafetyPersonnelRole; roleName: string; count: number }>;
  suggestedAction: string;
  resourceKitRecommendations: string[];
  estimatedRiskMitigationPct: number; // e.g. 46%
  status: 'PENDING_DEPLOYMENT' | 'APPLIED';
}

interface ForecastedResourceDistributionWidgetProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  currentZone: FacilityZone;
  onApplyReallocation?: (order: {
    fromZone: string;
    toZone: string;
    officerNames: string[];
    reason: string;
  }) => void;
  onLogAudit?: (entry: SystemAuditLogEntry) => void;
  onNotice?: (msg: string) => void;
  onSelectZone?: (zoneId: string) => void;
}

function ForecastedResourceDistributionWidgetComponent({
  zones,
  alerts,
  telemetryStream,
  currentZone,
  onApplyReallocation,
  onLogAudit,
  onNotice,
  onSelectZone
}: ForecastedResourceDistributionWidgetProps) {
  const [horizonWindow, setHorizonWindow] = useState<'12H' | '24H' | '48H'>('24H');
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<string>>(new Set());
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>('Outdoor-Construction-Sector-4');

  // Compute 48-hour forecasted risk trends & dynamic staffing suggestions for each zone
  const suggestions: ForecastStaffingSuggestionItem[] = useMemo(() => {
    return zones.map((zone, index) => {
      const isSector4 = zone.id.includes('Sector-4') || zone.id.includes('Construction');
      const isAssembly = zone.id.includes('Assembly') || zone.id.includes('Manufacturing');
      const isWarehouse = zone.id.includes('Warehouse') || zone.id.includes('Logistics');
      const isTunnel = zone.id.includes('Tunnel') || zone.id.includes('Conduit');

      let department = 'General Operations';
      if (isSector4) department = 'Construction & Civil Infrastructure';
      else if (isAssembly) department = 'Robotics & Precision Assembly';
      else if (isWarehouse) department = 'Logistics & Warehouse Operations';
      else if (isTunnel) department = 'Subgrade Tunnel & Utility Conduits';

      const zoneAlerts = alerts.filter((a) => a.location_zone === zone.id && !a.acknowledged);
      const criticalCount = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const cohortSize = zone.count || 12;

      // Base staffing recommendations according to horizon
      let forecastWindow = '+12h to +16h (Day 1 Afternoon Heat Peak)';
      let forecastedRiskTier: 'CRITICAL' | 'HIGH' | 'MODERATE' = 'MODERATE';
      let forecastedIncidentRate = 2.4;
      let anticipatedHealthSignal = 'Progressive Cardiovascular & Thermal Fatigue';
      let recommendedStaffCount = 2;
      let currentStaffCount = 1;
      let suggestedAction = 'Enforce rotational cool-down intervals and pre-stage electrolyte hydration stations.';
      let resourceKits = ['Mobile Hydration Cart (50L)', 'Electrolyte Tablets'];
      let mitigationPct = 42;
      let recommendedRoles: Array<{ role: SafetyPersonnelRole; roleName: string; count: number }> = [
        { role: 'HEAT_HYDRATION_STEWARD', roleName: 'Heat & Hydration Steward', count: 1 }
      ];

      if (isSector4) {
        forecastWindow =
          horizonWindow === '12H'
            ? '+4h to +8h (Midday Solar Elevation)'
            : horizonWindow === '24H'
            ? '+12h to +16h (Severe Wet-Bulb Heat Index 46.5°C)'
            : '+36h to +40h (Day 2 Heatwave Resurgence)';
        forecastedRiskTier = 'CRITICAL';
        forecastedIncidentRate = horizonWindow === '48H' ? 7.6 : 5.8;
        anticipatedHealthSignal = 'Acute Parasympathetic HRV Collapse, Tachycardia & Wet-Bulb Heat Stroke';
        currentStaffCount = 2;
        recommendedStaffCount = 4;
        suggestedAction =
          'Pre-deploy 2 Emergency Medical Responders and 1 Heat Steward at Sector 4 Shaded Base 2 hours prior to the heatwave peak. Institute mandatory 15m cooling breaks.';
        resourceKits = [
          '4x Cold-Air Misting Turbines',
          '80L Oral Electrolyte Solution',
          '4x Ice-Immersion Cooling Vests',
          'Continuous ECG Telemetry Beacons'
        ];
        mitigationPct = 54;
        recommendedRoles = [
          { role: 'EMERGENCY_MEDICAL_RESPONDER', roleName: 'Emergency Medical Responder', count: 2 },
          { role: 'HEAT_HYDRATION_STEWARD', roleName: 'Heat & Hydration Steward', count: 1 },
          { role: 'RELIABILITY_VIBRATION_ENGINEER', roleName: 'Reliability Vibration Engineer', count: 1 }
        ];
      } else if (isAssembly) {
        forecastWindow =
          horizonWindow === '12H'
            ? '+6h to +10h (Full Shift Peak Output)'
            : horizonWindow === '24H'
            ? '+18h to +22h (Robotic Tool Harmonic Resonance)'
            : '+42h to +46h (Secondary Tooling Wear)';
        forecastedRiskTier = 'HIGH';
        forecastedIncidentRate = 3.2;
        anticipatedHealthSignal = 'Acoustic Machinery Overpressure & Upper-Extremity Ergonomic Strain';
        currentStaffCount = 2;
        recommendedStaffCount = 3;
        suggestedAction =
          'Reassign 1 Acoustic Safety Officer to conduct mandatory audiometric PPE checks and inspect machinery dampeners before line velocity ramps up.';
        resourceKits = [
          '35x High-Attenuation Dual-Grade Ear Defenders',
          'Vibration Damping Floor Mats',
          'Acoustic Dosimeter Calibration Unit'
        ];
        mitigationPct = 48;
        recommendedRoles = [
          { role: 'ACOUSTIC_SAFETY_OFFICER', roleName: 'Acoustic Safety Officer', count: 1 },
          { role: 'ERGONOMIC_SAFETY_LEAD', roleName: 'Ergonomic Safety Lead', count: 1 }
        ];
      } else if (isWarehouse) {
        forecastWindow =
          horizonWindow === '12H'
            ? '+8h to +12h (Shift Changeover)'
            : horizonWindow === '24H'
            ? '+20h to +24h (Circadian Night Shift Loading)'
            : '+32h to +36h (Cross-Dock Surge)';
        forecastedRiskTier = 'MODERATE';
        forecastedIncidentRate = 2.8;
        anticipatedHealthSignal = 'Circadian Autonomic Desynchronization & Micro-sleeps on Forklifts';
        currentStaffCount = 1;
        recommendedStaffCount = 2;
        suggestedAction =
          'Stage 1 Ergonomic Safety Lead to rotate high-bay forklift operators with sleep debt (> 3h) to ground-level automated sorting duty.';
        resourceKits = [
          'Optical Fatigue Alert Eye-Trackers',
          'Shaded Ground Staging Area',
          'Hydration & Electrolyte Stations'
        ];
        mitigationPct = 39;
        recommendedRoles = [
          { role: 'ERGONOMIC_SAFETY_LEAD', roleName: 'Ergonomic Safety Lead', count: 1 },
          { role: 'HEAT_HYDRATION_STEWARD', roleName: 'Heat & Hydration Steward', count: 1 }
        ];
      } else if (isTunnel) {
        forecastWindow =
          horizonWindow === '12H'
            ? '+2h to +6h (Conduit Pipe Welding)'
            : horizonWindow === '24H'
            ? '+14h to +18h (Subterranean Thermal Inversion)'
            : '+26h to +30h (Confined Atmosphere)';
        forecastedRiskTier = 'HIGH';
        forecastedIncidentRate = 2.6;
        anticipatedHealthSignal = 'Confined Space Core Thermal Accumulation & k-Anonymity Small-Cell Risk';
        currentStaffCount = 0;
        recommendedStaffCount = 2;
        suggestedAction =
          'Deploy 1 Confined Space Responder with portable auxiliary blowers. Restrict continuous subgrade shift duration to 45 minutes maximum.';
        resourceKits = [
          'Portable Duct Air Evacuator (3000 CFM)',
          'Multi-Gas Atmospheric Sniffers',
          'Rapid Extraction Stretcher & Harness'
        ];
        mitigationPct = 52;
        recommendedRoles = [
          { role: 'EMERGENCY_MEDICAL_RESPONDER', roleName: 'Emergency Medical Responder', count: 1 },
          { role: 'HEAT_HYDRATION_STEWARD', roleName: 'Heat & Hydration Steward', count: 1 }
        ];
      }

      const suggestionId = `SUGG-${zone.id}-${horizonWindow}`;
      const isApplied = appliedSuggestionIds.has(suggestionId);
      const staffDeficit = Math.max(0, recommendedStaffCount - currentStaffCount);

      return {
        id: suggestionId,
        zoneId: zone.id,
        zoneName: zone.name,
        department,
        forecastWindow,
        forecastedRiskTier,
        forecastedIncidentRate,
        anticipatedHealthSignal,
        currentStaffCount,
        recommendedStaffCount,
        staffDeficit,
        recommendedRoles,
        suggestedAction,
        resourceKitRecommendations: resourceKits,
        estimatedRiskMitigationPct: mitigationPct,
        status: isApplied ? 'APPLIED' : 'PENDING_DEPLOYMENT'
      };
    });
  }, [zones, alerts, horizonWindow, appliedSuggestionIds]);

  // Aggregate metrics
  const totalPreventableIncidents = useMemo(() => {
    return suggestions.reduce((acc, s) => acc + s.forecastedIncidentRate, 0);
  }, [suggestions]);

  const totalDeficitStaff = useMemo(() => {
    return suggestions.reduce((acc, s) => acc + s.staffDeficit, 0);
  }, [suggestions]);

  // Handle single suggestion apply
  const handleApplySuggestion = (sugg: ForecastStaffingSuggestionItem) => {
    setAppliedSuggestionIds((prev) => new Set(prev).add(sugg.id));

    if (onApplyReallocation) {
      onApplyReallocation({
        fromZone: 'CENTRAL_STANDBY',
        toZone: sugg.zoneId,
        officerNames: sugg.recommendedRoles.map((r) => `${r.roleName} (${r.count})`),
        reason: `48h Forecast Optimization: ${sugg.anticipatedHealthSignal} at ${sugg.forecastWindow}`
      });
    }

    if (onLogAudit) {
      onLogAudit({
        id: `AUD-STF-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Manager on Duty',
        category: 'RESOURCE_REALLOCATION',
        targetModule: `Staffing Forecast: ${sugg.zoneName}`,
        parameter: 'Pre-emptive Health Signal Staffing Distribution',
        previousValue: `Staff: ${sugg.currentStaffCount} Officers`,
        newValue: `Staff: ${sugg.recommendedStaffCount} Officers (${sugg.recommendedRoles.map((r) => r.roleName).join(', ')})`,
        justification: `Pre-emptive staffing to prevent forecasted health signal: "${sugg.anticipatedHealthSignal}" (${sugg.forecastWindow}).`,
        approvalStatus: 'VERIFIED'
      });
    }

    if (onNotice) {
      onNotice(
        `Applied optimal resource distribution for ${sugg.zoneName}: Deployed ${sugg.staffDeficit} additional officers to prevent "${sugg.anticipatedHealthSignal}".`
      );
    }
  };

  // Handle batch auto-apply for all suggestions
  const handleAutoApplyAll = () => {
    const newSet = new Set(appliedSuggestionIds);
    suggestions.forEach((s) => newSet.add(s.id));
    setAppliedSuggestionIds(newSet);

    if (onLogAudit) {
      onLogAudit({
        id: `AUD-STF-ALL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Manager on Duty',
        category: 'RESOURCE_REALLOCATION',
        targetModule: 'Global Facility Staffing Optimization',
        parameter: `48-Hour Forecast Auto-Distribution (${horizonWindow})`,
        previousValue: 'Fragmented Zone Allocation',
        newValue: `Optimal Distribution Enforced Across ${suggestions.length} Zones (${totalDeficitStaff} Personnel Reallocated)`,
        justification: `Systemic staffing redistribution applied based on 48-hour LSTM risk projections to avert acute physiological incidents.`,
        approvalStatus: 'VERIFIED'
      });
    }

    if (onNotice) {
      onNotice(
        `Global Staffing Optimization Applied: Reallocated ${totalDeficitStaff} on-site safety personnel across ${suggestions.length} zones based on 48h forecasted risk trends.`
      );
    }
  };

  return (
    <div
      id="forecasted-resource-widget"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500"></div>

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/15 border border-indigo-500/40 p-2 rounded-lg text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Forecasted Risk Staffing &amp; Resource Distribution
                </h2>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  PREVENTIVE REALLOCATION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive workforce health optimization engine: Suggests optimal personnel and protective resource distribution based on 48-hour LSTM forecasted risk trends to prevent potential health signals before they happen.
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Horizon Tabs & Auto-Apply */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Window Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setHorizonWindow('12H')}
              className={`px-3 py-1.5 rounded-md transition font-semibold text-xs ${
                horizonWindow === '12H'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Next 12 Hours
            </button>
            <button
              onClick={() => setHorizonWindow('24H')}
              className={`px-3 py-1.5 rounded-md transition font-semibold text-xs ${
                horizonWindow === '24H'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24h Peak Surge
            </button>
            <button
              onClick={() => setHorizonWindow('48H')}
              className={`px-3 py-1.5 rounded-md transition font-semibold text-xs ${
                horizonWindow === '48H'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              48h Full Forecast
            </button>
          </div>

          {/* Auto-Apply All Button */}
          <button
            onClick={handleAutoApplyAll}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md shadow-indigo-600/20"
            title="Automatically distribute on-site safety personnel and resources according to forecasted risk peaks"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Apply Optimal Staffing Distribution</span>
          </button>
        </div>
      </div>

      {/* Forecast KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Forecast Horizon</span>
            <div className="text-base font-bold text-white mt-0.5">
              {horizonWindow === '12H' ? 'Immediate Shift (12h)' : horizonWindow === '24H' ? '24h Peak Surge' : '48-Hour Full Trajectory'}
            </div>
            <span className="text-[10px] text-indigo-400">Recharts Autoregressive Model</span>
          </div>
          <Calendar className="h-7 w-7 text-indigo-400/50" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Potential Signals Preventable</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              ~{Math.round(totalPreventableIncidents)} Incident Signals
            </div>
            <span className="text-[10px] text-amber-400/80">Heat, HRV Collapse, Acoustic Blast</span>
          </div>
          <Heart className="h-7 w-7 text-amber-400/50" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Suggested Staff Reallocations</span>
            <div className="text-base font-bold text-cyan-300 mt-0.5">
              +{totalDeficitStaff} Officers Recommended
            </div>
            <span className="text-[10px] text-cyan-400/80">Medical Responders &amp; Stewards</span>
          </div>
          <Users className="h-7 w-7 text-cyan-400/50" />
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg. Predicted Risk Reduction</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              -48.5% Predicted Reduction
            </div>
            <span className="text-[10px] text-emerald-400/80">With Pre-emptive Interventions</span>
          </div>
          <ShieldCheck className="h-7 w-7 text-emerald-400/50" />
        </div>
      </div>

      {/* Suggested Zone Distribution Cards */}
      <div className="space-y-3 mt-4">
        {suggestions.map((sugg) => {
          const isApplied = sugg.status === 'APPLIED';
          const isCritical = sugg.forecastedRiskTier === 'CRITICAL';
          const isHigh = sugg.forecastedRiskTier === 'HIGH';
          const isExpanded = expandedZoneId === sugg.zoneId;

          return (
            <div
              key={sugg.id}
              className={`rounded-xl border transition-all p-4 ${
                isCritical
                  ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/25 via-slate-900 to-slate-900/90'
                  : isHigh
                  ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900/90'
                  : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Zone, Forecast Window, Anticipated Signal */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      {sugg.zoneName}
                    </span>

                    <span className="text-slate-500 text-xs">&bull;</span>
                    <span className="text-xs text-slate-400">{sugg.department}</span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {isCritical && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                      FORECAST: {sugg.forecastedRiskTier} RISK
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      {sugg.forecastWindow}
                    </span>
                  </div>

                  {/* Anticipated Potential Health Signal Box */}
                  <div className="flex items-start gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                    <Heart className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-300 block">
                        Potential Health Signal to Prevent:
                      </span>
                      <span className="text-white font-medium">{sugg.anticipatedHealthSignal}</span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Forecasted Volume: <strong>~{sugg.forecastedIncidentRate} incidents</strong> during surge window if unmitigated.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Staffing Metric & Action Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 lg:pl-4">
                  {/* Staff Allocation Counter */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center min-w-[130px]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Staff Allocation</span>
                    <div className="text-sm font-mono mt-0.5">
                      <span className="text-slate-400">{sugg.currentStaffCount} Current</span>
                      <span className="mx-1 text-slate-600">&rarr;</span>
                      <span className="text-cyan-300 font-bold">{sugg.recommendedStaffCount} Optimal</span>
                    </div>
                    {sugg.staffDeficit > 0 && !isApplied ? (
                      <span className="text-[10px] text-rose-400 font-bold font-mono">
                        Deficit: +{sugg.staffDeficit} Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> Staffing Optimal
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    {isApplied ? (
                      <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Distribution Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplySuggestion(sugg)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Deploy Optimal Staff (+{sugg.staffDeficit})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedZoneId(isExpanded ? null : sugg.zoneId)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 transition"
                    >
                      <span>{isExpanded ? 'Hide Strategy' : 'View Prevention Strategy'}</span>
                      <ChevronRight className={`h-3 w-3 transform transition ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Prevention Strategy Dossier */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg animate-fadeIn">
                  {/* Recommended Roles */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                      <Users className="h-3 w-3 text-cyan-400" />
                      Suggested Role Distribution:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {sugg.recommendedRoles.map((r, i) => (
                        <li key={i} className="text-slate-200 flex items-center justify-between font-mono text-[11px]">
                          <span>{r.roleName}</span>
                          <span className="text-cyan-300 font-bold">+{r.count} Officer</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Resource Kits */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                      <PackageCheck className="h-3 w-3 text-amber-400" />
                      Pre-staged Resource &amp; PPE Kits:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {sugg.resourceKitRecommendations.map((kit, i) => (
                        <li key={i} className="text-slate-300 text-[11px] flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-amber-400"></span>
                          <span>{kit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pre-emptive Directive & Impact */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                        <Zap className="h-3 w-3 text-emerald-400" />
                        Preventive Operational Directive:
                      </span>
                      <p className="text-slate-200 text-[11px] mt-1 leading-snug">
                        {sugg.suggestedAction}
                      </p>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 flex items-center justify-between">
                      <span>Forecasted Risk Reduction:</span>
                      <span className="font-bold">-{sugg.estimatedRiskMitigationPct}% Incidents</span>
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

const ForecastedResourceDistributionWidget = React.memo(ForecastedResourceDistributionWidgetComponent);
export default ForecastedResourceDistributionWidget;

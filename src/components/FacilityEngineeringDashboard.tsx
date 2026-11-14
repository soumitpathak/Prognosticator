import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Fan,
  Gauge,
  Activity,
  Sliders,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Power,
  Lock,
  Cpu,
  BarChart3,
  ClipboardList,
  Zap
} from 'lucide-react';
import { UserPersona, RegulatoryJurisdiction } from '../types';
import { authService, REGULATORY_FRAMEWORKS } from '../services/authService';
import { INITIAL_FACILITY_ZONES } from '../services/telemetryStream';
import {
  automatedResponseService,
  CorrectiveHvacAdjustment
} from '../services/automatedResponseService';
import {
  proactiveMaintenanceSchedulerService,
  ProactiveMaintenanceTask
} from '../services/proactiveMaintenanceSchedulerService';
import {
  calculateWhatIfImpact,
  WHAT_IF_PRESETS,
  WhatIfParameters,
  DEFAULT_WHAT_IF_PARAMETERS
} from '../services/whatIfSimulationEngine';
import { complianceAuditService } from '../services/complianceAuditService';
import { useTranslation } from '../services/i18nService';
import {
  crossRoleOperationsService,
  useCrossRoleOperations
} from '../services/crossRoleOperationsService';
import LanguageAutocomplete from './LanguageAutocomplete';

interface FacilityEngineeringDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

type EngineeringTab = 'HVAC' | 'MAINTENANCE' | 'SIMULATOR' | 'AUDIT';

export default function FacilityEngineeringDashboard({
  currentUser,
  isAccessibilityMode = false
}: FacilityEngineeringDashboardProps) {
  const { t } = useTranslation();
  const e = t.engineer;
  const ops = useCrossRoleOperations();
  const zones = ops.hvacZones;
  const assets = ops.vibrationAssets;
  const [activeTab, setActiveTab] = useState<EngineeringTab>('HVAC');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Live Automated HVAC Response Engine
  const [adjustments, setAdjustments] = useState<CorrectiveHvacAdjustment[]>(() =>
    automatedResponseService.getAdjustments()
  );
  const [isAutonomousHvac, setIsAutonomousHvac] = useState<boolean>(
    () => automatedResponseService.getConfig().optInAutonomousMode
  );

  // Live 72h Proactive IoT Maintenance Queue
  const [iotTasks, setIotTasks] = useState<ProactiveMaintenanceTask[]>(() =>
    proactiveMaintenanceSchedulerService.getTasks()
  );

  // Thermal What-If Simulation State
  const [simParams, setSimParams] = useState<WhatIfParameters>({
    ...DEFAULT_WHAT_IF_PARAMETERS,
    isSimulationActive: true
  });

  const [activeJurisdiction, setActiveJurisdiction] = useState<RegulatoryJurisdiction>(() =>
    authService.getActiveJurisdiction()
  );

  useEffect(() => {
    return authService.onAuthChange((_u, jur) => {
      setActiveJurisdiction(jur);
    });
  }, []);

  const framework = REGULATORY_FRAMEWORKS[activeJurisdiction] || REGULATORY_FRAMEWORKS[currentUser.jurisdiction] || REGULATORY_FRAMEWORKS.US_OSHA_NIOSH;
  const simImpact = useMemo(() => calculateWhatIfImpact(simParams), [simParams]);
  const auditRecords = useMemo(() => complianceAuditService.getRecords().slice(0, 10), [actionNotice, ops.ledgerBlocks.length]);

  useEffect(() => {
    const unsubResp = automatedResponseService.subscribe(() => {
      setAdjustments([...automatedResponseService.getAdjustments()]);
      setIsAutonomousHvac(automatedResponseService.getConfig().optInAutonomousMode);
    });
    const unsubMaint = proactiveMaintenanceSchedulerService.subscribe(() => {
      setIotTasks([...proactiveMaintenanceSchedulerService.getTasks()]);
    });
    return () => {
      unsubResp();
      unsubMaint();
    };
  }, []);

  const handleActuateDamper = (zoneId: string, delta: number) => {
    crossRoleOperationsService.actuateHvacDamper({
      zoneId,
      delta,
      actorName: currentUser.name,
      actorRole: currentUser.roleTitle
    });
    setActionNotice(`Ventilation damper actuation command sent to ${zoneId} (${delta > 0 ? `+${delta}%` : `${delta}%`} airflow) & logged to audit ledger.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleIssueWorkOrder = (assetId: string) => {
    crossRoleOperationsService.issueVibrationWorkOrder({
      assetId,
      actorName: currentUser.name,
      actorRole: currentUser.roleTitle
    });
    setActionNotice(`72-Hour ISO 10816 Bearing Maintenance Work Order issued for ${assetId} & recorded in compliance ledger.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApproveAdjustment = (adjId: string) => {
    const target = adjustments.find((a) => a.id === adjId);
    automatedResponseService.approveAdjustment(adjId, currentUser.name);
    crossRoleOperationsService.recordHvacRemediationDecision({
      adjustmentId: adjId,
      zoneName: target?.zoneName || 'Facility Zone',
      decision: 'APPROVED',
      actorName: currentUser.name
    });
    setActionNotice(`HVAC Remediation ${adjId} approved, actuated via BACnet/Modbus, and sealed in audit ledger.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDismissAdjustment = (adjId: string) => {
    const target = adjustments.find((a) => a.id === adjId);
    automatedResponseService.dismissAdjustment(adjId);
    crossRoleOperationsService.recordHvacRemediationDecision({
      adjustmentId: adjId,
      zoneName: target?.zoneName || 'Facility Zone',
      decision: 'DISMISSED',
      actorName: currentUser.name
    });
    setActionNotice(`HVAC Remediation ${adjId} overridden by Facility Engineer.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleAutonomous = () => {
    const next = !isAutonomousHvac;
    automatedResponseService.setOptInAutonomousMode(next);
    crossRoleOperationsService.recordHvacRemediationDecision({
      adjustmentId: 'AUTO-BMS-MODE',
      zoneName: 'Site-Wide BMS Loop',
      decision: 'AUTONOMOUS',
      actorName: currentUser.name
    });
    setActionNotice(`Closed-Loop Autonomous HVAC Remediation ${next ? 'ENABLED' : 'SET TO MANUAL APPROVAL'}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-950/40">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {e.title}
              </h1>
              <span className="text-xs font-sans font-medium text-amber-400">
                &middot; {e.badge} {currentUser.clearanceLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {e.loggedInAs} <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle}) &middot; {e.jurisdiction}:{' '}
              <span className="text-amber-300">{framework.countryName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Fan className="h-4 w-4 text-cyan-400" />
            <span>{e.chillerActive}</span>
            <span className="text-slate-600" aria-hidden="true">&middot;</span>
            <span className="text-amber-300 font-semibold">{e.bacnetConnected}</span>
          </div>
          <LanguageAutocomplete
            dropDirection="down"
            compact
            isAccessibilityMode={isAccessibilityMode}
            idPrefix="engineer-landing-lang"
          />
        </div>
      </header>

      {/* PBAC Scope Banner */}
      <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-amber-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>
            {e.scopePermitted}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <Lock className="h-3 w-3 text-rose-400 shrink-0" />
          <span>{e.scopeBlocked}</span>
        </div>
      </div>

      {/* Role-Specific Engineering Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl mb-6 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('HVAC')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'HVAC' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Fan className="h-4 w-4" />
          <span>{e.tabHvac}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'MAINTENANCE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>{e.tabMaintenance}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SIMULATOR')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'SIMULATOR' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>{e.tabSimulator}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'AUDIT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>{e.tabAudit}</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="mb-5 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Engineering KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{e.kpiTwl}</span>
            <Gauge className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {Math.round(zones.reduce((sum, z) => sum + z.twl, 0) / zones.length)} W/m²
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-sans font-medium tabular-nums">Buffer Zone (Safe &gt; 220 W/m²)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{e.kpiAch}</span>
            <Fan className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {(zones.reduce((sum, z) => sum + z.ach, 0) / zones.length).toFixed(1)} ACH
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-sans font-medium">ASHRAE 62.1 Compliant</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{e.kpiVibration}</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">7.6 mm/s</div>
          <div className="text-[11px] text-rose-400 mt-1 font-sans font-medium">ISO 10816 Alarm on Fan-4B</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold font-sans">{e.kpiWorkOrders}</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            {iotTasks.filter((t) => t.status !== 'REPLACED_VERIFIED').length} Active
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-sans font-medium">72-Hour Mean Time To Repair</div>
        </div>
      </div>

      {/* TAB 1: HVAC & AUTOMATED REMEDIATION */}
      {activeTab === 'HVAC' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Sector Ventilation & Damper Control */}
            <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-amber-400" />
                    <span>{e.sectorVentTitle}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {e.sectorVentDesc}
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400">4 Facility Sectors Live</span>
              </div>

              <div className="space-y-3.5">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-4 rounded-xl border transition ${
                      zone.status === 'CRITICAL'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : zone.status === 'ELEVATED'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{zone.name}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              zone.status === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                : zone.status === 'ELEVATED'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {zone.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          WBGT: <strong className="text-white">{zone.wbgt}&deg;C</strong> &middot; TWL:{' '}
                          <strong className={zone.twl < 140 ? 'text-rose-400' : 'text-amber-400'}>{zone.twl} W/m²</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-cyan-400">{zone.ach} ACH</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Damper: {zone.damperPosition}%</span>
                      </div>
                    </div>

                    <div className="my-3">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Damper Aperture</span>
                        <span>Fan VFD: {zone.fanSpeedHz} Hz</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${zone.damperPosition}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            zone.damperPosition > 85 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="text-[11px] font-mono text-slate-400">
                        Chiller Loop: <strong className="text-white">{zone.chillerSetpoint}&deg;C</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActuateDamper(zone.id, -10)}
                          disabled={zone.damperPosition <= 10}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-mono text-[11px] transition cursor-pointer"
                        >
                          {e.damperMinus}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActuateDamper(zone.id, +10)}
                          disabled={zone.damperPosition >= 100}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-mono font-bold text-[11px] transition cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <Power className="h-3 w-3" />
                          <span>{e.damperPlus}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Closed-Loop Automated HVAC Adjustments & Aggregate Environmental Telemetry */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span>{e.remediationQueueTitle}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleToggleAutonomous}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                      isAutonomousHvac
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isAutonomousHvac ? 'AUTONOMOUS: ON' : 'MANUAL APPROVAL'}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {adjustments.slice(0, 4).map((adj) => (
                    <div key={adj.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{adj.zoneName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-500/30">
                          {adj.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-cyan-300 font-mono">{adj.targetEquipment}</div>
                      <p className="text-[11px] text-slate-400">{adj.actionDirective}</p>
                      {adj.status === 'PENDING_APPROVAL' && (
                        <div className="flex justify-end gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={() => handleDismissAdjustment(adj.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                          >
                            {e.overrideBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveAdjustment(adj.id)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            {e.approveActuate}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregate Environmental Telemetry (Zero Biometrics) */}
              <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <span>{e.aggregateEnvTitle}</span>
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  {INITIAL_FACILITY_ZONES.slice(0, 4).map((fz) => (
                    <div key={fz.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-200 truncate pr-2">{fz.name}</span>
                      <span className="text-amber-300 shrink-0">
                        {fz.heatIndex}&deg;C &middot; TWL {fz.twl} &middot; AQI {fz.aqi}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISO 10816 VIBRATION & IOT MAINTENANCE */}
      {activeTab === 'MAINTENANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-6 border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>{e.vibrationTelemetryTitle}</span>
            </h2>
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">{asset.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {asset.location} &middot; {asset.isoClass}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                        asset.maintenanceStatus === 'INSPECTION_URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : asset.maintenanceStatus === 'SCHEDULED_72H'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {asset.maintenanceStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-500 block">RMS Velocity</span>
                      <span
                        className={`font-bold ${
                          asset.velocityRmsMmS > 7.1
                            ? 'text-rose-400'
                            : asset.velocityRmsMmS > 4.5
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {asset.velocityRmsMmS} mm/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Bearing Temp</span>
                      <span className="font-bold text-white">{asset.bearingTempC}&deg;C</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Acoustic Noise</span>
                      <span className={`font-bold ${asset.noiseDba > 85 ? 'text-amber-300' : 'text-slate-300'}`}>
                        {asset.noiseDba} dBA
                      </span>
                    </div>
                  </div>

                  {asset.maintenanceStatus !== 'SCHEDULED_72H' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleIssueWorkOrder(asset.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Wrench className="h-3 w-3" />
                        <span>Issue 72h Maintenance Order</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>{e.maintenanceQueueTitle}</span>
            </h2>
            <div className="space-y-3">
              {iotTasks.map((tsk) => (
                <div key={tsk.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white">{tsk.endpointName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {tsk.zoneName} &middot; MTTF: <strong className="text-rose-400">{tsk.mttfHours.toFixed(1)}h</strong> &middot; Tech: {tsk.assignedTechnician.name}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                      {tsk.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{tsk.prescribedPreventiveAction}</p>
                  <div className="flex justify-end gap-2 pt-1">
                    {tsk.status === 'AUTO_STAGED' && (
                      <button
                        type="button"
                        onClick={() => {
                          proactiveMaintenanceSchedulerService.dispatchTechnician(tsk.id);
                          setActionNotice(`Technician dispatched for ${tsk.endpointId}.`);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Dispatch Technician
                      </button>
                    )}
                    {tsk.status === 'DISPATCHED' && (
                      <button
                        type="button"
                        onClick={() => {
                          proactiveMaintenanceSchedulerService.completeAndCalibrateTask(tsk.id);
                          setActionNotice(`Sensor ${tsk.endpointId} replaced & calibrated.`);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Complete &amp; Calibrate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THERMAL & VENTILATION WHAT-IF SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>{e.simulatorTitle}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {WHAT_IF_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSimParams({ ...preset.params, isSimulationActive: true })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Ambient Plant Heat (&deg;C)</span>
                  <span className="font-mono text-amber-300">{simParams.ambientHeatC.toFixed(1)}&deg;C</span>
                </label>
                <input
                  type="range"
                  min={22}
                  max={48}
                  step={0.5}
                  value={simParams.ambientHeatC}
                  onChange={(e) => setSimParams((p) => ({ ...p, ambientHeatC: Number(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Relative Humidity (%)</span>
                  <span className="font-mono text-cyan-300">{simParams.seasonalHumidityPct}%</span>
                </label>
                <input
                  type="range"
                  min={25}
                  max={95}
                  step={1}
                  value={simParams.seasonalHumidityPct}
                  onChange={(e) => setSimParams((p) => ({ ...p, seasonalHumidityPct: Number(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>HVAC / Cooling Mitigation (%)</span>
                  <span className="font-mono text-emerald-300">{simParams.ppeCoolingMitigationPct}%</span>
                </label>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={2}
                  value={simParams.ppeCoolingMitigationPct}
                  onChange={(e) => setSimParams((p) => ({ ...p, ppeCoolingMitigationPct: Number(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">{e.projectedThermalTitle}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Effective Heat Index</span>
                <span className="text-lg font-bold text-amber-300">{simImpact.heatIndexC.toFixed(1)}&deg;C</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Net Risk Delta</span>
                <span className={`text-lg font-bold ${simImpact.netRiskDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simImpact.netRiskDelta > 0 ? '+' : ''}
                  {simImpact.netRiskDelta.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Evaporative Cooling</span>
                <span className="text-lg font-bold text-cyan-300">{simImpact.evaporativeEfficiencyPct.toFixed(0)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Heat Category</span>
                <span className="text-sm font-bold text-white">{simImpact.heatCategory}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-slate-300">
              <ShieldCheck className="h-4 w-4 text-amber-400 inline mr-1.5" />
              Automated HVAC actuation reduces physiological heat strain without penalizing frontline worker rest cycles.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ENGINEERING AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 space-y-3 animate-fadeIn">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-400" />
            <span>{e.auditLogTitle}</span>
          </h2>
          <div className="space-y-2.5">
            {auditRecords.map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">
                    {rec.targetModule} &middot; {rec.parameter}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                    {rec.eventType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Actor: <strong className="text-slate-200">{rec.actor}</strong> &middot; {rec.previousValue} &rarr;{' '}
                  <strong className="text-cyan-300">{rec.newValue}</strong>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {rec.regulatoryStandard} &middot; Hash: {rec.digitalSignatureHash.slice(0, 32)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MoveRight,
  Sparkles,
  Heart,
  Volume2,
  Wrench,
  Clock,
  Send,
  Zap,
  MapPin,
  ChevronDown
} from 'lucide-react';
import {
  FacilityZone,
  ActiveAnomalyAlert,
  SafetyOfficer,
  SafetyPersonnelRole,
  DeploymentOrder,
  SystemAuditLogEntry
} from '../types';

export interface ResourceAllocationModuleProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  onLogAudit?: (entry: SystemAuditLogEntry) => void;
  onNotice?: (msg: string) => void;
}

export const INITIAL_SAFETY_OFFICERS: SafetyOfficer[] = [
  {
    id: 'OFF-01',
    name: 'Dr. Marcus Vance, MD',
    role: 'EMERGENCY_MEDICAL_RESPONDER',
    currentZoneId: 'Outdoor-Construction-Sector-4',
    status: 'DEPLOYED',
    assignedAt: '08:00 AM',
    contactNumber: '+1 (555) 911-0101',
    specialization: 'Acute Trauma & Heat Stroke Triage',
    experienceYears: 12
  },
  {
    id: 'OFF-02',
    name: 'Sarah Jenkins, RN',
    role: 'EMERGENCY_MEDICAL_RESPONDER',
    currentZoneId: 'Outdoor-Construction-Sector-4',
    status: 'DEPLOYED',
    assignedAt: '08:30 AM',
    contactNumber: '+1 (555) 911-0102',
    specialization: 'Autonomic Dehydration Recovery',
    experienceYears: 8
  },
  {
    id: 'OFF-03',
    name: 'Tariq Al-Mansoor',
    role: 'HEAT_HYDRATION_STEWARD',
    currentZoneId: 'Outdoor-Construction-Sector-4',
    status: 'DEPLOYED',
    assignedAt: '09:00 AM',
    contactNumber: '+1 (555) 772-0201',
    specialization: 'Electrolyte Misting & Shaded Pause Enforcement',
    experienceYears: 6
  },
  {
    id: 'OFF-04',
    name: 'Elena Rostova',
    role: 'HEAT_HYDRATION_STEWARD',
    currentZoneId: 'Warehouse-Logistics-Hub-North',
    status: 'DEPLOYED',
    assignedAt: '08:15 AM',
    contactNumber: '+1 (555) 772-0202',
    specialization: 'High-Bay Fatigue & Fluid Supply Chain',
    experienceYears: 5
  },
  {
    id: 'OFF-05',
    name: 'Carlos Mendoza',
    role: 'ACOUSTIC_SAFETY_OFFICER',
    currentZoneId: 'Manufacturing-Assembly-Line-B',
    status: 'DEPLOYED',
    assignedAt: '07:45 AM',
    contactNumber: '+1 (555) 441-0301',
    specialization: 'Dosimetry Sound Baffling & Decibel Isolation',
    experienceYears: 9
  },
  {
    id: 'OFF-06',
    name: 'Priya Patel',
    role: 'ACOUSTIC_SAFETY_OFFICER',
    currentZoneId: 'Manufacturing-Assembly-Line-B',
    status: 'DEPLOYED',
    assignedAt: '08:00 AM',
    contactNumber: '+1 (555) 441-0302',
    specialization: 'Ear Defender Compliance & Vibration Attenuation',
    experienceYears: 7
  },
  {
    id: 'OFF-07',
    name: 'Derek Zhang',
    role: 'RELIABILITY_VIBRATION_ENGINEER',
    currentZoneId: 'Outdoor-Construction-Sector-4',
    status: 'DEPLOYED',
    assignedAt: '09:15 AM',
    contactNumber: '+1 (555) 832-0401',
    specialization: 'ISO 10816 Machinery Vibration Diagnostics',
    experienceYears: 11
  },
  {
    id: 'OFF-08',
    name: 'Thomas Schmidt',
    role: 'RELIABILITY_VIBRATION_ENGINEER',
    currentZoneId: 'Warehouse-Logistics-Hub-North',
    status: 'DEPLOYED',
    assignedAt: '08:45 AM',
    contactNumber: '+1 (555) 832-0402',
    specialization: 'Centrifugal Pump Cavitation & Bearing Greasing',
    experienceYears: 14
  },
  {
    id: 'OFF-09',
    name: 'Maya Lin',
    role: 'ERGONOMIC_SAFETY_LEAD',
    currentZoneId: 'Manufacturing-Assembly-Line-B',
    status: 'DEPLOYED',
    assignedAt: '07:30 AM',
    contactNumber: '+1 (555) 620-0501',
    specialization: 'Repetitive Motion & Heavy Lifting Biomechanics',
    experienceYears: 10
  },
  {
    id: 'OFF-10',
    name: 'Liam Gallagher',
    role: 'EMERGENCY_MEDICAL_RESPONDER',
    currentZoneId: 'CENTRAL_STANDBY',
    status: 'STANDBY',
    assignedAt: '10:00 AM',
    contactNumber: '+1 (555) 911-0103',
    specialization: 'Rapid Extraction & First Aid Liaison',
    experienceYears: 6
  },
  {
    id: 'OFF-11',
    name: 'Aisha Diallo',
    role: 'HEAT_HYDRATION_STEWARD',
    currentZoneId: 'CENTRAL_STANDBY',
    status: 'STANDBY',
    assignedAt: '10:00 AM',
    contactNumber: '+1 (555) 772-0203',
    specialization: 'Thermal Work Limit Monitoring',
    experienceYears: 4
  },
  {
    id: 'OFF-12',
    name: 'Kenji Sato',
    role: 'RELIABILITY_VIBRATION_ENGINEER',
    currentZoneId: 'CENTRAL_STANDBY',
    status: 'STANDBY',
    assignedAt: '10:00 AM',
    contactNumber: '+1 (555) 832-0403',
    specialization: 'Drive Motor Laser Alignment',
    experienceYears: 9
  }
];

export const INITIAL_DEPLOYMENT_ORDERS: DeploymentOrder[] = [
  {
    id: 'ORD-9821',
    timestamp: '18 mins ago',
    fromZone: 'Manufacturing-Assembly-Line-B',
    toZone: 'Outdoor-Construction-Sector-4',
    officerIds: ['OFF-07'],
    officerNames: ['Derek Zhang'],
    reason: 'Critical vibration exceedance on Conveyor Drive Motor 4B',
    urgency: 'CRITICAL',
    status: 'COMPLETED'
  },
  {
    id: 'ORD-9784',
    timestamp: '42 mins ago',
    fromZone: 'CENTRAL_STANDBY',
    toZone: 'Outdoor-Construction-Sector-4',
    officerIds: ['OFF-03'],
    officerNames: ['Tariq Al-Mansoor'],
    reason: 'Wet-bulb heat index breached 42°C threshold',
    urgency: 'CRITICAL',
    status: 'COMPLETED'
  }
];

export default function ResourceAllocationModule({
  zones,
  alerts,
  onLogAudit,
  onNotice
}: ResourceAllocationModuleProps) {
  const [officers, setOfficers] = useState<SafetyOfficer[]>(INITIAL_SAFETY_OFFICERS);
  const [orders, setOrders] = useState<DeploymentOrder[]>(INITIAL_DEPLOYMENT_ORDERS);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [targetZoneId, setTargetZoneId] = useState<string>('Outdoor-Construction-Sector-4');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isReallocating, setIsReallocating] = useState<boolean>(false);

  // Group officers by zone
  const officersByZone = useMemo(() => {
    const map: Record<string, SafetyOfficer[]> = {
      CENTRAL_STANDBY: []
    };
    zones.forEach((z) => {
      map[z.id] = [];
    });
    officers.forEach((o) => {
      if (!map[o.currentZoneId]) map[o.currentZoneId] = [];
      map[o.currentZoneId].push(o);
    });
    return map;
  }, [officers, zones]);

  // Calculate zone risk metrics & staffing adequacy
  const zoneStaffingStats = useMemo(() => {
    return zones.map((zone) => {
      const assigned = officersByZone[zone.id] || [];
      const zoneAlerts = alerts.filter((a) => a.location_zone === zone.id && !a.acknowledged);
      const criticalAlerts = zoneAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const count = zone.count || 1;

      // Recommended staff formula: baseline 1 per 12 workers + 1 per critical alert + 1 if heat > 40°C
      let recommended = Math.max(1, Math.ceil(count / 12));
      if (criticalAlerts > 0) recommended += criticalAlerts;
      if (zone.status === 'CRITICAL') recommended += 1;

      const ratio = assigned.length > 0 ? (count / assigned.length).toFixed(1) : 'No Staff';
      let coverageStatus: 'OPTIMAL' | 'SUFFICIENT' | 'CRITICAL_DEFICIT' = 'SUFFICIENT';

      if (assigned.length === 0 || (zone.status === 'CRITICAL' && assigned.length < recommended)) {
        coverageStatus = 'CRITICAL_DEFICIT';
      } else if (assigned.length >= recommended) {
        coverageStatus = 'OPTIMAL';
      }

      return {
        zone,
        assigned,
        zoneAlertsCount: zoneAlerts.length,
        criticalAlertsCount: criticalAlerts,
        recommendedCount: recommended,
        ratio,
        coverageStatus
      };
    });
  }, [zones, officersByZone, alerts]);

  const standbyOfficers = officersByZone['CENTRAL_STANDBY'] || [];

  // Manual Transfer Handler
  const handleTransferOfficer = () => {
    if (!selectedOfficerId || !targetZoneId) return;

    const officer = officers.find((o) => o.id === selectedOfficerId);
    if (!officer) return;

    const fromZoneName =
      officer.currentZoneId === 'CENTRAL_STANDBY'
        ? 'Central Standby Reserve'
        : zones.find((z) => z.id === officer.currentZoneId)?.name || officer.currentZoneId;

    const targetZoneObj = zones.find((z) => z.id === targetZoneId);
    const targetZoneName = targetZoneObj?.name || targetZoneId;

    if (officer.currentZoneId === targetZoneId) {
      if (onNotice) onNotice(`${officer.name} is already stationed at ${targetZoneName}.`);
      return;
    }

    const defaultReason = transferReason || `Supervisory redeployment to support ${targetZoneName} risk coverage`;

    // Update officer state
    setOfficers((prev) =>
      prev.map((o) =>
        o.id === selectedOfficerId
          ? {
              ...o,
              currentZoneId: targetZoneId,
              status: targetZoneId === 'CENTRAL_STANDBY' ? 'STANDBY' : 'DEPLOYED',
              assignedAt: 'Just now'
            }
          : o
      )
    );

    // Create deployment order
    const newOrder: DeploymentOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      fromZone: fromZoneName,
      toZone: targetZoneName,
      officerIds: [officer.id],
      officerNames: [officer.name],
      reason: defaultReason,
      urgency: targetZoneObj?.status === 'CRITICAL' ? 'CRITICAL' : 'ELEVATED',
      status: 'ACTIVE'
    };
    setOrders((prev) => [newOrder, ...prev]);

    // Audit Log Entry
    const auditLog: SystemAuditLogEntry = {
      id: `AUD-RES-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Operations Supervisor',
      category: 'RESOURCE_REALLOCATION',
      targetModule: 'On-Site Safety Workforce Deployment',
      parameter: `Personnel: ${officer.name} (${officer.role.replace(/_/g, ' ')})`,
      previousValue: `Station: ${fromZoneName}`,
      newValue: `Station: ${targetZoneName}`,
      justification: defaultReason,
      approvalStatus: 'APPLIED'
    };
    if (onLogAudit) onLogAudit(auditLog);

    if (onNotice) {
      onNotice(
        `Dynamic Reallocation: ${officer.name} redeployed to ${targetZoneName}. Deployment order ${newOrder.id} logged in System Audit.`
      );
    }

    setSelectedOfficerId('');
    setTransferReason('');
  };

  // Automated Risk-Based Dynamic Optimization Rebalance
  const handleAutoRebalance = () => {
    setIsReallocating(true);

    setTimeout(() => {
      // Find critical zones needing reinforcement
      const criticalZone = zones.find((z) => z.status === 'CRITICAL') || zones[0];
      const stableZone = zones.find((z) => z.status === 'STABLE') || zones[1];

      // Rebalance: move 1-2 officers from STABLE or STANDBY to CRITICAL
      let movedOfficers: SafetyOfficer[] = [];

      setOfficers((prev) => {
        const next = [...prev];

        // First prioritize standby officers
        const standbyIdx = next.findIndex((o) => o.currentZoneId === 'CENTRAL_STANDBY');
        if (standbyIdx !== -1) {
          next[standbyIdx] = {
            ...next[standbyIdx],
            currentZoneId: criticalZone.id,
            status: 'DEPLOYED',
            assignedAt: 'Just now (Auto-Rebalanced)'
          };
          movedOfficers.push(next[standbyIdx]);
        }

        // Second, take an acoustic or ergonomic officer from stable zone
        const stableIdx = next.findIndex(
          (o) => o.currentZoneId === stableZone.id && (o.role === 'ACOUSTIC_SAFETY_OFFICER' || o.role === 'ERGONOMIC_SAFETY_LEAD')
        );
        if (stableIdx !== -1) {
          next[stableIdx] = {
            ...next[stableIdx],
            currentZoneId: criticalZone.id,
            status: 'DEPLOYED',
            assignedAt: 'Just now (Auto-Rebalanced)'
          };
          movedOfficers.push(next[stableIdx]);
        }

        return next;
      });

      if (movedOfficers.length > 0) {
        const orderId = `ORD-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
        const names = movedOfficers.map((o) => o.name);

        const newOrder: DeploymentOrder = {
          id: orderId,
          timestamp: 'Just now',
          fromZone: `${stableZone.name} & Central Standby`,
          toZone: criticalZone.name,
          officerIds: movedOfficers.map((o) => o.id),
          officerNames: names,
          reason: `Algorithmic rebalance triggered by high-risk anomaly density in ${criticalZone.name}`,
          urgency: 'CRITICAL',
          status: 'ACTIVE'
        };
        setOrders((prev) => [newOrder, ...prev]);

        const auditLog: SystemAuditLogEntry = {
          id: `AUD-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          userId: 'SYS-ALG-OPT',
          userName: 'Prognosticator AI Rebalance Engine',
          userRole: 'Autonomous Dispatch Engine',
          category: 'RESOURCE_REALLOCATION',
          targetModule: 'On-Site Safety Workforce Deployment',
          parameter: `Dynamic Redistribution (${movedOfficers.length} Officers)`,
          previousValue: `Dispersed across ${stableZone.name} & Standby`,
          newValue: `Consolidated at ${criticalZone.name}`,
          justification: `Automated risk matching: Critical thermal load (${criticalZone.temp}) and active anomalies required immediate coverage saturation.`,
          approvalStatus: 'VERIFIED'
        };
        if (onLogAudit) onLogAudit(auditLog);

        if (onNotice) {
          onNotice(
            `Automated Reallocation Complete: ${names.join(', ')} redeployed to ${criticalZone.name} to neutralize critical deficit.`
          );
        }
      }

      setIsReallocating(false);
    }, 600);
  };

  const getRoleIcon = (role: SafetyPersonnelRole) => {
    switch (role) {
      case 'EMERGENCY_MEDICAL_RESPONDER':
        return <Heart className="h-3.5 w-3.5 text-rose-400" />;
      case 'HEAT_HYDRATION_STEWARD':
        return <Zap className="h-3.5 w-3.5 text-amber-400" />;
      case 'ACOUSTIC_SAFETY_OFFICER':
        return <Volume2 className="h-3.5 w-3.5 text-cyan-400" />;
      case 'RELIABILITY_VIBRATION_ENGINEER':
        return <Wrench className="h-3.5 w-3.5 text-orange-400" />;
      case 'ERGONOMIC_SAFETY_LEAD':
        return <Users className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  const getRoleBadge = (role: SafetyPersonnelRole) => {
    switch (role) {
      case 'EMERGENCY_MEDICAL_RESPONDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Heart className="h-3 w-3 text-rose-400" />
            Medical Responder
          </span>
        );
      case 'HEAT_HYDRATION_STEWARD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Zap className="h-3 w-3 text-amber-400" />
            Hydration Steward
          </span>
        );
      case 'ACOUSTIC_SAFETY_OFFICER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Volume2 className="h-3 w-3 text-cyan-400" />
            Acoustic Officer
          </span>
        );
      case 'RELIABILITY_VIBRATION_ENGINEER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <Wrench className="h-3 w-3 text-orange-400" />
            Reliability Engineer
          </span>
        );
      case 'ERGONOMIC_SAFETY_LEAD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Users className="h-3 w-3 text-indigo-400" />
            Ergonomic Lead
          </span>
        );
    }
  };

  return (
    <div id="resource-allocation-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-lg">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              Dynamic On-Site Safety Resource Allocation &amp; Redistribution
            </h2>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {officers.length} Safety Personnel Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamically reposition safety officers, medical liaisons, and reliability engineers in response to real-time anomaly clusters
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoRebalance}
            disabled={isReallocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
              isReallocating
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-transparent'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isReallocating ? 'animate-spin' : ''}`} />
            <span>{isReallocating ? 'Calculating Optimal Redistribution...' : 'Auto-Redistribute by Risk'}</span>
          </button>
        </div>
      </div>

      {/* Manual Quick Transfer Control Bar */}
      <div className="my-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <MoveRight className="h-3.5 w-3.5 text-cyan-400" />
          Supervisor Direct Redeployment Console
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Select Officer */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Safety Officer to Reassign</label>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 focus:outline-hidden"
            >
              <option value="">Select On-Site Officer...</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} — {officer.role.replace(/_/g, ' ')} (
                  {officer.currentZoneId === 'CENTRAL_STANDBY'
                    ? 'Standby Reserve'
                    : zones.find((z) => z.id === officer.currentZoneId)?.name || officer.currentZoneId}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Select Target Zone */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Destination Facility Zone</label>
            <select
              value={targetZoneId}
              onChange={(e) => setTargetZoneId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 focus:outline-hidden"
            >
              <option value="CENTRAL_STANDBY">Central Standby Reserve</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.status} • {zone.temp})
                </option>
              ))}
            </select>
          </div>

          {/* Justification / Directive */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">EHS Directive / Reason</label>
            <input
              type="text"
              placeholder="e.g. Reinforce heat wave recovery..."
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white p-2 focus:ring-1 focus:ring-cyan-400 focus:outline-hidden"
            />
          </div>

          {/* Confirm Redeployment Button */}
          <div className="flex items-end">
            <button
              onClick={handleTransferOfficer}
              disabled={!selectedOfficerId || !targetZoneId}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-3 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Issue Deployment Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zone Staffing Allocation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {zoneStaffingStats.map(
          ({ zone, assigned, zoneAlertsCount, criticalAlertsCount, recommendedCount, ratio, coverageStatus }) => {
            const isCritical = zone.status === 'CRITICAL';
            const isDeficit = coverageStatus === 'CRITICAL_DEFICIT';

            return (
              <div
                key={zone.id}
                className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                  isDeficit
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/20'
                    : isCritical
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  {/* Zone Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="truncate mr-2">
                      <h3 className="text-xs font-bold text-white truncate" title={zone.name}>
                        {zone.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        Cohort Size: <strong className="text-slate-200">N={zone.count}</strong> • Temp:{' '}
                        <strong className="text-amber-400">{zone.temp}</strong>
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono shrink-0 ${
                        zone.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : zone.status === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {zone.status}
                    </span>
                  </div>

                  {/* Coverage Status Bar */}
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 my-2.5 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Staffing Coverage:</span>
                      <span
                        className={`text-[10px] font-bold font-mono ${
                          coverageStatus === 'OPTIMAL'
                            ? 'text-emerald-400'
                            : coverageStatus === 'CRITICAL_DEFICIT'
                            ? 'text-rose-400 animate-pulse'
                            : 'text-amber-400'
                        }`}
                      >
                        {coverageStatus === 'CRITICAL_DEFICIT'
                          ? 'DEFICIT (Reinforce)'
                          : coverageStatus === 'OPTIMAL'
                          ? 'OPTIMAL COVERAGE'
                          : 'SUFFICIENT'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                      <span>Assigned Staff:</span>
                      <span className="font-bold text-white">
                        {assigned.length} / {recommendedCount} Rec.
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>Staff-to-Worker Ratio:</span>
                      <span className="text-cyan-300">1 : {ratio}</span>
                    </div>
                  </div>

                  {/* Active Anomaly Alerts Tag */}
                  {zoneAlertsCount > 0 && (
                    <div className="mb-2.5 flex items-center justify-between text-[10px] font-mono bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-1 rounded-md">
                      <span className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="h-3 w-3 text-rose-400" />
                        {zoneAlertsCount} Active Anomalies
                      </span>
                      {criticalAlertsCount > 0 && (
                        <span className="text-rose-400 font-bold">{criticalAlertsCount} Critical</span>
                      )}
                    </div>
                  )}

                  {/* Stationed Personnel List */}
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Stationed Personnel ({assigned.length})
                    </span>

                    {assigned.length === 0 ? (
                      <div className="py-2 text-center text-slate-500 text-[11px] border border-dashed border-slate-800 rounded-lg">
                        No personnel currently assigned
                      </div>
                    ) : (
                      assigned.map((officer) => (
                        <div
                          key={officer.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs flex justify-between items-center gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-white font-medium text-xs truncate block">{officer.name}</span>
                            <div className="mt-0.5">{getRoleBadge(officer.role)}</div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">{officer.assignedAt}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Redeploy Quick Action */}
                <div className="pt-3 border-t border-slate-800/80 mt-3">
                  <button
                    onClick={() => {
                      setTargetZoneId(zone.id);
                      const available = officers.find((o) => o.currentZoneId !== zone.id);
                      if (available) setSelectedOfficerId(available.id);
                    }}
                    className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold py-1 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-md transition"
                  >
                    Deploy Reinforcements Here &rarr;
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Central Standby Reserve & Recent Deployment Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Central Standby Reserve */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              Central Standby Safety Reserve ({standbyOfficers.length})
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Immediate Readiness
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {standbyOfficers.length === 0 ? (
              <div className="py-4 text-center text-slate-500 text-xs">
                All personnel currently deployed across facility zones.
              </div>
            ) : (
              standbyOfficers.map((officer) => (
                <div
                  key={officer.id}
                  className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="text-white font-medium block">{officer.name}</span>
                    <span className="text-[10px] text-slate-400">{officer.specialization}</span>
                    <div className="mt-1">{getRoleBadge(officer.role)}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOfficerId(officer.id);
                      setTargetZoneId('Outdoor-Construction-Sector-4');
                    }}
                    className="text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-2.5 py-1 rounded-md transition"
                  >
                    Deploy
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Reallocation Deployment Orders */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              Active Redistribution Deployment Log ({orders.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Synchronized with System Audit Register</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto pr-1">
            {orders.map((order) => (
              <div key={order.id} className="py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold text-[11px]">{order.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-white font-medium">{order.officerNames.join(', ')}</span>
                    <span className="text-slate-500">•</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        order.urgency === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {order.urgency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-300">{order.fromZone}</span>
                    <span>&rarr;</span>
                    <span className="text-cyan-300 font-semibold">{order.toZone}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 italic">"{order.reason}"</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">{order.timestamp}</span>
                  <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Deployed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

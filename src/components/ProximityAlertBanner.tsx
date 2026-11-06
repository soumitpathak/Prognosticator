import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Users,
  Flame,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  BellRing,
  MapPin,
  Volume2,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert } from '../types';

export interface ProximityAlertZone {
  zoneId: string;
  zoneName: string;
  workerCount: number;
  densityPer100Sqm: number;
  clusterClassification: 'CRITICAL_OVERCROWDING' | 'HIGH_DENSITY' | 'MODERATE_CLUSTER';
  activeAnomalyTitle: string;
  anomalySeverity: 'CRITICAL' | 'HIGH';
  hazardRadiusMeters: number;
  primaryHazardMetric: string;
  recommendedImmediateAction: string;
  temperature?: string;
  isAcknowledged: boolean;
}

export interface ProximityAlertBannerProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  onAcknowledgeZone?: (zoneId: string) => void;
  onDeploySupport?: (zoneId: string, actionType: string) => void;
  className?: string;
}

export default function ProximityAlertBanner({
  zones,
  alerts,
  onAcknowledgeZone,
  onDeploySupport,
  className = ''
}: ProximityAlertBannerProps) {
  const [acknowledgedZoneIds, setAcknowledgedZoneIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Compute overlapping zones between high-risk anomalies and high-density worker clusters
  const proximityAlerts: ProximityAlertZone[] = useMemo(() => {
    const list: ProximityAlertZone[] = [];

    zones.forEach((zone) => {
      const zoneAlerts = alerts.filter(
        (a) => (a.location_zone === zone.id || a.location_zone === zone.name) && !a.acknowledged
      );
      const hasCriticalAlert = zoneAlerts.some((a) => a.severity === 'CRITICAL');
      const hasHighAlert = zoneAlerts.some((a) => a.severity === 'HIGH');
      const isCriticalZone = zone.status === 'CRITICAL' || hasCriticalAlert;
      const isHighRiskZone = zone.status === 'MODERATE' || hasHighAlert;

      // Density calculation: default area assumed 300m² per sector if not specified
      const workerCount = zone.count || 24;
      const approxArea = 300;
      const densityPer100Sqm = Number(((workerCount / approxArea) * 100).toFixed(1));

      // Overlap trigger condition: Zone is high/critical risk AND has >= 18 workers or density >= 6.0
      const isHighDensityCluster = workerCount >= 18 || densityPer100Sqm >= 6.0;

      if ((isCriticalZone || isHighRiskZone) && isHighDensityCluster) {
        const primaryAlert = zoneAlerts[0];
        const title = primaryAlert?.anomaly_metric || (isCriticalZone ? 'Compound Thermal Radiation & Machinery Strain' : 'Elevated Acoustic & Fatigue Overpressure');
        const metric = primaryAlert ? `${primaryAlert.raw_value} (Smoothed: ${primaryAlert.kalman_smoothed_value})` : (isCriticalZone ? 'Temperature 44.8°C / Noise 104.8 dB' : 'Noise 98.4 dB / TWL 92 W/m²');

        list.push({
          zoneId: zone.id,
          zoneName: zone.name,
          workerCount,
          densityPer100Sqm,
          clusterClassification: workerCount >= 24 ? 'CRITICAL_OVERCROWDING' : 'HIGH_DENSITY',
          activeAnomalyTitle: title,
          anomalySeverity: isCriticalZone ? 'CRITICAL' : 'HIGH',
          hazardRadiusMeters: isCriticalZone ? 25 : 15,
          primaryHazardMetric: metric,
          temperature: zone.temp,
          recommendedImmediateAction: isCriticalZone
            ? 'Enact immediate 50% cohort dispersion; deploy shaded cooling misting station and stage paramedic hydration.'
            : 'Stagger shift break intervals to reduce density below 5.0/100m²; mandate dual-hearing PPE.',
          isAcknowledged: acknowledgedZoneIds.has(zone.id)
        });
      }
    });

    return list;
  }, [zones, alerts, acknowledgedZoneIds]);

  const activeProximityAlerts = useMemo(() => {
    return proximityAlerts.filter((a) => !a.isAcknowledged);
  }, [proximityAlerts]);

  const handleAcknowledge = (zoneId: string) => {
    setAcknowledgedZoneIds((prev) => new Set([...prev, zoneId]));
    if (onAcknowledgeZone) {
      onAcknowledgeZone(zoneId);
    }
  };

  const handleDeploy = (zoneId: string, actionType: string) => {
    if (onDeploySupport) {
      onDeploySupport(zoneId, actionType);
    }
    // Also mark as acknowledged
    setAcknowledgedZoneIds((prev) => new Set([...prev, zoneId]));
  };

  if (isDismissed || activeProximityAlerts.length === 0) {
    return null;
  }

  return (
    <div
      id="proximity-alert-system-banner"
      className={`bg-gradient-to-r from-red-950/95 via-rose-950/90 to-amber-950/90 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden ring-1 ring-rose-500/40 mb-6 ${className}`}
    >
      {/* Background glow and indicator */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10 border-b border-rose-800/60 pb-3.5">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-900/80 border-2 border-rose-400 text-rose-200 shrink-0 shadow-lg animate-pulse">
            <AlertOctagon className="h-6 w-6 text-rose-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="bg-rose-500 text-slate-950 font-black text-[10px] font-mono uppercase px-2 py-0.5 rounded-full tracking-wider animate-bounce">
                PROXIMITY ALERT
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">
                {activeProximityAlerts.length} High-Risk Anomaly / Worker Density Overlap{activeProximityAlerts.length > 1 ? 's' : ''}
              </span>
              <span className="text-[10px] font-mono bg-slate-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                OSHA &bull; Spatial Hazard Overlap
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              High-Risk Anomaly Zone Overlaps Dense Worker Cluster
            </h3>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/70 border border-rose-500/40 text-xs font-semibold text-rose-200 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse Details' : 'Expand Details'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-rose-300/80 hover:text-white hover:bg-rose-900/50 rounded-lg transition cursor-pointer"
            title="Dismiss Proximity Alert Banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Cluster Overlap Details */}
      {isExpanded && (
        <div className="mt-4 space-y-3 relative z-10">
          <p className="text-xs text-rose-200/90 leading-relaxed max-w-4xl">
            <strong>Critical Spatial Warning:</strong> Real-time telemetry detects high-severity environmental/mechanical anomalies directly overlapping within zones containing dense clusters of workforce personnel. Concentrated personnel clusters increase thermal accumulation, impede rapid egress, and amplify collective physiological strain.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
            {activeProximityAlerts.map((item) => (
              <div
                key={item.zoneId}
                className="bg-slate-950/85 border border-rose-500/60 rounded-xl p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{item.zoneName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Zone ID: {item.zoneId} {item.temperature ? `&bull; Ambient: ${item.temperature}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {item.anomalySeverity} HAZARD
                    </span>
                  </div>

                  {/* Overlap Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 my-2.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Cluster Size</span>
                      <span className="text-rose-400 font-bold text-sm tabular-nums">
                        {item.workerCount} Workers
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Density</span>
                      <span className="text-amber-300 font-bold text-sm tabular-nums">
                        {item.densityPer100Sqm} / 100m²
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Hazard Radius</span>
                      <span className="text-cyan-300 font-bold text-sm tabular-nums">
                        {item.hazardRadiusMeters} Meters
                      </span>
                    </div>
                  </div>

                  {/* Anomaly & Hazard Description */}
                  <div className="text-xs space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-rose-300">
                      <Flame className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span className="font-semibold text-white">{item.activeAnomalyTitle}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-5">
                      <strong>Hazard Metric:</strong> {item.primaryHazardMetric}
                    </p>
                    <p className="text-[11px] text-amber-200/90 pl-5 italic">
                      <strong>Directive:</strong> {item.recommendedImmediateAction}
                    </p>
                  </div>
                </div>

                {/* Immediate Mitigation Action Buttons */}
                <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleDeploy(item.zoneId, 'DISPERSE_CLUSTER')}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1"
                      title="Enforce 50% staggered rotation to disperse worker cluster"
                    >
                      <Users className="h-3 w-3" />
                      <span>Disperse Cluster (50% Egress)</span>
                    </button>

                    <button
                      onClick={() => handleDeploy(item.zoneId, 'PERIMETER_MITIGATION')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
                      title="Deploy safety officer to erect 20m safety exclusion perimeter"
                    >
                      <span>Erect 20m Perimeter</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAcknowledge(item.zoneId)}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:underline transition cursor-pointer"
                  >
                    Acknowledge Warning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

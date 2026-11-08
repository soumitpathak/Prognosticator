import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Eye,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  MapPin,
  Send,
  Sparkles,
  CheckCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Wrench,
  Heart,
  Volume2,
  Download,
  FileSpreadsheet,
  Sliders,
  Building2,
  Thermometer,
  Zap,
  Users,
  Radio,
  Activity,
  Copy,
  Check,
  Layers,
  BatteryCharging,
  ShieldCheck,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  Phone,
  Shield,
  MessageSquare,
  FileText,
  Loader2,
  VolumeX,
  Gauge
} from 'lucide-react';
import {
  ActiveAnomalyAlert,
  FacilityZone,
  IncidentWorkflowStatus,
  IncidentAssignee,
  IncidentAssignment,
  IncidentActivityLogEntry,
  TeamAlertNotification,
  TelemetryRiskBreachEvent
} from '../types';
import { teamAlertService } from '../services/teamAlertService';
import { desktopNotificationService } from '../services/desktopNotificationService';

export interface DepartmentBreachInfo {
  departmentId: string;
  departmentName: string;
  currentRisk: number;
  threshold: number;
  facilityLocation?: string;
}

export const DEFAULT_FIELD_ASSIGNEES: IncidentAssignee[] = [
  {
    id: 'ASG-MED-01',
    name: 'Dr. Marcus Vance, MD',
    role: 'Emergency Medical Lead',
    team: 'MEDICAL_TRIAGE',
    avatarInitials: 'MV',
    phone: '+1 (555) 911-COOL-2',
    activeIncidentsCount: 2
  },
  {
    id: 'ASG-COOL-02',
    name: 'Sarah Jenkins',
    role: 'Rapid Cooling & Heat Evacuation Lead',
    team: 'THERMAL_COOLING',
    avatarInitials: 'SJ',
    phone: '+1 (555) 441-HEAT',
    activeIncidentsCount: 3
  },
  {
    id: 'ASG-MECH-03',
    name: 'Derek Zhang',
    role: 'Reliability Vibration Engineer',
    team: 'MECHANICAL_RELIABILITY',
    avatarInitials: 'DZ',
    phone: '+1 (555) 882-VIBE',
    activeIncidentsCount: 1
  },
  {
    id: 'ASG-NOISE-04',
    name: 'Thomas Schmidt',
    role: 'Acoustic Hearing Protection Officer',
    team: 'ACOUSTIC_DEFENSE',
    avatarInitials: 'TS',
    phone: '+1 (555) 441-NOISE',
    activeIncidentsCount: 1
  },
  {
    id: 'ASG-HAZ-05',
    name: 'Elena Rostova',
    role: 'Process Safety & Hazmat Specialist',
    team: 'HAZMAT_SAFETY',
    avatarInitials: 'ER',
    phone: '+1 (555) 773-CHEM',
    activeIncidentsCount: 0
  },
  {
    id: 'ASG-EHS-06',
    name: 'Alex Mercer',
    role: 'EHS Lead Supervisor',
    team: 'EHS_LEAD',
    avatarInitials: 'AM',
    phone: '+1 (555) 234-SAFE',
    activeIncidentsCount: 1
  }
];

export const INITIAL_INCIDENT_ASSIGNMENTS: Record<string, IncidentAssignment> = {
  'ALR-8842-CR': {
    eventId: 'ALR-8842-CR',
    status: 'Investigating',
    assigneeId: 'ASG-COOL-02',
    assigneeName: 'Sarah Jenkins',
    assigneeRole: 'Rapid Cooling & Heat Evacuation Lead',
    assignedAt: '10 mins ago',
    updatedAt: '5 mins ago',
    priority: 'CRITICAL',
    resolutionNotes: 'Field team deployed shaded cooling tent and oral hydration pack; worker vitals stabilizing.',
    activityLog: [
      {
        timestamp: '10 mins ago',
        action: 'Incident Created & Assigned',
        actor: 'Alex Mercer (Supervisor)',
        notes: 'Dispatched Sarah Jenkins to Sector 4 structural rebar grid.',
        newStatus: 'Pending'
      },
      {
        timestamp: '5 mins ago',
        action: 'Status Updated to Investigating',
        actor: 'Sarah Jenkins (Field Lead)',
        notes: 'On site. Administering oral rehydration and monitoring surface skin thermistor.',
        previousStatus: 'Pending',
        newStatus: 'Investigating'
      }
    ]
  },
  'ALR-PM-9042': {
    eventId: 'ALR-PM-9042',
    status: 'Pending',
    assigneeId: 'ASG-MECH-03',
    assigneeName: 'Derek Zhang',
    assigneeRole: 'Reliability Vibration Engineer',
    assignedAt: '15 mins ago',
    updatedAt: '15 mins ago',
    priority: 'CRITICAL',
    resolutionNotes: 'Awaiting LOTO Stage 2 electrical lockout before bearing sleeve inspection.',
    activityLog: [
      {
        timestamp: '15 mins ago',
        action: 'Incident Assigned',
        actor: 'Alex Mercer (Supervisor)',
        notes: 'Conveyor 4B bearing vibration spike flagged at 7.2 mm/s RMS.',
        newStatus: 'Pending'
      }
    ]
  },
  'ALR-8839-HG': {
    eventId: 'ALR-8839-HG',
    status: 'Resolved',
    assigneeId: 'ASG-NOISE-04',
    assigneeName: 'Thomas Schmidt',
    assigneeRole: 'Acoustic Hearing Protection Officer',
    assignedAt: '28 mins ago',
    updatedAt: '8 mins ago',
    priority: 'HIGH',
    resolutionNotes: 'Distributed secondary ear-defenders; compressor vibration dampeners checked and retightened.',
    activityLog: [
      {
        timestamp: '28 mins ago',
        action: 'Incident Assigned',
        actor: 'Alex Mercer (Supervisor)',
        newStatus: 'Pending'
      },
      {
        timestamp: '18 mins ago',
        action: 'Status Changed to Investigating',
        actor: 'Thomas Schmidt',
        newStatus: 'Investigating'
      },
      {
        timestamp: '8 mins ago',
        action: 'Incident Resolved',
        actor: 'Thomas Schmidt',
        notes: 'Acoustic levels reduced from 104.8 dBA to 81.2 dBA.',
        previousStatus: 'Investigating',
        newStatus: 'Resolved'
      }
    ]
  }
};

export const INITIAL_RISK_BREACHES: TelemetryRiskBreachEvent[] = [
  {
    id: 'BREACH-8901',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    timeFormatted: '4 mins ago',
    riskScore: 84.8,
    threshold: 75.0,
    delta: 9.8,
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor Construction Sector 4',
    workerCount: 18,
    severity: 'CRITICAL',
    triggerSignals: [
      { signalName: 'Cardiovascular Autonomic Collapse', measuredValue: 'HRV 28.2 ms (Drop -52%)', referenceBaseline: 'Nominal >= 55.0 ms' },
      { signalName: 'Apparent Heat Index Plume', measuredValue: '43.2°C (WBGT 32.1°C)', referenceBaseline: 'Nominal <= 35.0°C' },
      { signalName: 'Mean Tachycardia Cohort Load', measuredValue: '138 BPM', referenceBaseline: 'Safe Max <= 115 BPM' }
    ],
    recommendedAction: 'Immediate shaded cooling extraction, oral electrolyte hydration protocol, and stage on-site medical liaison.',
    acknowledged: false,
    browserAlertDispatched: true,
    workerPseudonym: 'W-9921'
  },
  {
    id: 'BREACH-8894',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    timeFormatted: '18 mins ago',
    riskScore: 78.4,
    threshold: 75.0,
    delta: 3.4,
    zoneId: 'Subgrade-Utility-Tunnel-B',
    zoneName: 'Subgrade Utility Tunnel B',
    workerCount: 8,
    severity: 'HIGH',
    triggerSignals: [
      { signalName: 'Thermal Work Limit (TWL) Deceleration', measuredValue: '108.4 W/m²', referenceBaseline: 'Min Safe >= 140 W/m²' },
      { signalName: 'Relative Humidity Saturation', measuredValue: '86% RH (Subgrade Plume)', referenceBaseline: 'Comfort Range <= 65%' }
    ],
    recommendedAction: 'Mandate immediate 15-minute rest rotation in acclimatized staging bay; activate booster air blowers.',
    acknowledged: true,
    browserAlertDispatched: true,
    workerPseudonym: 'W-4402'
  }
];

export interface NotificationCenterProps {
  alerts: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  onViewDetails: (alert: ActiveAnomalyAlert) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onAcknowledgeAll?: () => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  departmentThresholdBreaches?: DepartmentBreachInfo[];
  onOpenDepartmentThresholds?: () => void;
  onExportComplianceCsv?: () => void;
  onGeneratePdfReport?: () => void;
  onInjectTestAnomaly?: () => void;
  isGeneratingPdf?: boolean;
  incidentAssignments?: Record<string, IncidentAssignment>;
  onUpdateIncidentAssignment?: (assignment: IncidentAssignment) => void;
  // User-defined health telemetry risk threshold & browser alert props
  telemetryRiskThreshold?: number;
  onUpdateTelemetryRiskThreshold?: (val: number) => void;
  riskThresholdBreaches?: TelemetryRiskBreachEvent[];
  onAcknowledgeRiskBreach?: (id: string) => void;
  onClearRiskBreaches?: () => void;
  currentTelemetryRisk?: number;
  onTestBrowserAlert?: () => void;
  onSimulateRiskBreach?: () => void;
  browserPermission?: 'granted' | 'denied' | 'default' | 'unsupported';
  onRequestBrowserPermission?: () => void;
  browserAlertsEnabled?: boolean;
  onToggleBrowserAlerts?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

export interface GranularTelemetryMetadata {
  sensorTemp: {
    ambientC: number;
    casingProbeC: number;
    thresholdCeilingC: number;
    deltaC: number;
    status: 'CRITICAL_HEAT' | 'ELEVATED' | 'NOMINAL';
    statusLabel: string;
    operatingRange: string;
    calibrationDrift: string;
    sensorModel: string;
  };
  voltageStability: {
    railVoltageV: number;
    nominalVoltageV: number;
    deviationPct: number;
    stabilityScorePct: number;
    rippleMv: number;
    powerSource: string;
    batteryPercent?: number;
    railStatus: 'STABLE' | 'MINOR_RIPPLE' | 'CRITICAL_VARIANCE';
    brownoutMarginV: number;
  };
  workerDensity: {
    zoneId: string;
    zoneName: string;
    workerCount: number;
    zoneAreaM2: number;
    zoneAreaSqFt: number;
    densityPer1000M2: number;
    densityPer1000SqFt: number;
    occupancyPct: number;
    maxSafeCapacity: number;
    densityTier: 'HIGH' | 'MODERATE' | 'LOW';
    densityTierLabel: string;
    twlIndex: number;
    twlClassification: string;
    microclimateNotice: string;
    privacyNotice: string;
  };
  signalGateway: {
    gatewayNodeId: string;
    rssiDbm: number;
    snrDb: number;
    protocol: string;
    packetDeliveryPct: number;
    kalmanNoiseSuppressionPct: number;
  };
}

export function computeGranularTelemetry(
  alert: ActiveAnomalyAlert,
  zone?: FacilityZone
): GranularTelemetryMetadata {
  const isPM = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
  const isCritical = alert.severity === 'CRITICAL';
  const zoneId = alert.location_zone;

  let zoneAreaM2 = 3200;
  let maxCapacity = 30;
  let microclimateNotice = 'Standard industrial workflow density distribution.';

  if (zoneId.includes('Sector-4') || zoneId.includes('Construction')) {
    zoneAreaM2 = 4200;
    maxCapacity = 24;
    microclimateNotice = 'High unshaded structural rebar grid concentration; elevated thermal plume retention in active cohort.';
  } else if (zoneId.includes('Tunnel') || zoneId.includes('Conduit')) {
    zoneAreaM2 = 340;
    maxCapacity = 10;
    microclimateNotice = 'Confined subgrade conduit geometry restricts convective air circulation and heat dissipation.';
  } else if (zoneId.includes('Warehouse') || zoneId.includes('Logistics')) {
    zoneAreaM2 = 12500;
    maxCapacity = 45;
    microclimateNotice = 'Aisle staging and automated stacker forklift transit corridor density.';
  } else if (zoneId.includes('Assembly') || zoneId.includes('Manufacturing')) {
    zoneAreaM2 = 3800;
    maxCapacity = 50;
    microclimateNotice = 'Cleanroom robotics cell with regulated HVAC laminar airflow.';
  } else if (zoneId.includes('Chemical') || zoneId.includes('Refining')) {
    zoneAreaM2 = 4600;
    maxCapacity = 22;
    microclimateNotice = 'Hazardous process vessels requiring minimum 8m physical dispersion radius.';
  } else if (zoneId.includes('Cold') || zoneId.includes('Cryo')) {
    zoneAreaM2 = 1800;
    maxCapacity = 14;
    microclimateNotice = 'Cryogenic vault with strictly timed thermal exposure rotations.';
  }

  const workerCount = zone?.count ?? 18;
  const zoneAreaSqFt = Math.round(zoneAreaM2 * 10.7639);
  const densityPer1000M2 = Number(((workerCount / zoneAreaM2) * 1000).toFixed(2));
  const densityPer1000SqFt = Number(((workerCount / zoneAreaSqFt) * 1000).toFixed(2));
  const occupancyPct = Math.min(100, Math.round((workerCount / maxCapacity) * 100));

  let densityTier: 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
  let densityTierLabel = 'Moderate Operational Density';
  if (occupancyPct >= 80 || densityPer1000M2 >= 15) {
    densityTier = 'HIGH';
    densityTierLabel = 'High Density (Thermal Accumulation Warning)';
  } else if (occupancyPct < 45 && densityPer1000M2 < 3) {
    densityTier = 'LOW';
    densityTierLabel = 'Low Dispersed Density';
  }

  const twlIndex = zone?.twl ?? (zoneId.includes('Sector-4') ? 92.4 : 124.5);
  const twlClassification =
    twlIndex < 115
      ? 'Buffer Zone (15m Rest Rotation Required)'
      : twlIndex < 140
      ? 'Acclimatized Zone (Continuous Work Permitted)'
      : 'Unrestricted Working Conditions';

  const ambientFromZone = zone?.temp ? parseFloat(zone.temp) : 43.2;
  const ambientC = Number((ambientFromZone).toFixed(1));

  let casingProbeC = Number((ambientC + 2.7).toFixed(1));
  let thresholdCeilingC = 40.0;
  let sensorModel = 'Biosensing IoT Wearable Node v3.4 (NTC Probe)';

  if (isPM) {
    casingProbeC = alert.equipment_temp_c ?? 86.4;
    thresholdCeilingC = 65.0;
    sensorModel = 'Tri-Axial High-Temp Piezoelectric Vibration/RTD (PT-100)';
  } else if (alert.raw_value.includes('Skin:')) {
    const skinMatch = alert.raw_value.match(/Skin:\s*([\d.]+)/);
    if (skinMatch) {
      casingProbeC = Number((parseFloat(skinMatch[1]) + 6.4).toFixed(1));
    }
  }

  const deltaC = Number((casingProbeC - thresholdCeilingC).toFixed(1));
  const status: 'CRITICAL_HEAT' | 'ELEVATED' | 'NOMINAL' =
    casingProbeC > thresholdCeilingC + 15 || ambientC > 44
      ? 'CRITICAL_HEAT'
      : casingProbeC > thresholdCeilingC || ambientC > 38
      ? 'ELEVATED'
      : 'NOMINAL';

  const statusLabel =
    status === 'CRITICAL_HEAT'
      ? `Critical Thermal Excursion (+${deltaC > 0 ? deltaC : 4.8}°C above ceiling)`
      : status === 'ELEVATED'
      ? `Elevated Thermal State (+${deltaC > 0 ? deltaC : 2.1}°C above ceiling)`
      : 'Within Standard Operating Envelope';

  const operatingRange = isPM ? '-30°C to +125°C (Continuous)' : '-20°C to +70°C (Industrial Class II)';
  const calibrationDrift = '±0.06°C (Zero-drift auto-calibrated)';

  const nominalVoltageV = isPM ? 24.0 : 3.3;
  const voltageNoise = isCritical ? -0.032 : -0.014;
  const railVoltageV = Number((nominalVoltageV + voltageNoise).toFixed(3));
  const deviationPct = Number((((railVoltageV - nominalVoltageV) / nominalVoltageV) * 100).toFixed(2));
  const stabilityScorePct = isCritical ? 98.7 : 99.4;
  const rippleMv = isCritical ? 8.4 : 4.2;
  const powerSource = isPM
    ? 'Isolated 24V DC DIN-Rail Industrial Bus'
    : 'LiFePO4 Edge Cell (89% Capacity, ~16.4h Reserve)';
  const batteryPercent = isPM ? undefined : 89;
  const brownoutMarginV = isPM ? 4.8 : 0.33;
  const railStatus = rippleMv > 15 ? 'CRITICAL_VARIANCE' : rippleMv > 6 ? 'MINOR_RIPPLE' : 'STABLE';

  const gatewayNodeId = `GW-AZURE-IOT-${
    zoneId.includes('Sector-4') ? '04-EAST' : zoneId.includes('Tunnel') ? '07-SUB' : '02-HUB'
  }`;
  const rssiDbm = isCritical ? -68 : -62;
  const snrDb = 9.4;
  const protocol = 'LoRaWAN EU868 / Azure IoT Hub MQTT';
  const packetDeliveryPct = 99.94;
  const kalmanNoiseSuppressionPct = 81.6;

  return {
    sensorTemp: {
      ambientC,
      casingProbeC,
      thresholdCeilingC,
      deltaC,
      status,
      statusLabel,
      operatingRange,
      calibrationDrift,
      sensorModel
    },
    voltageStability: {
      railVoltageV,
      nominalVoltageV,
      deviationPct,
      stabilityScorePct,
      rippleMv,
      powerSource,
      batteryPercent,
      railStatus,
      brownoutMarginV
    },
    workerDensity: {
      zoneId,
      zoneName: zone?.name || zoneId.replace(/-/g, ' '),
      workerCount,
      zoneAreaM2,
      zoneAreaSqFt,
      densityPer1000M2,
      densityPer1000SqFt,
      occupancyPct,
      maxSafeCapacity: maxCapacity,
      densityTier,
      densityTierLabel,
      twlIndex,
      twlClassification,
      microclimateNotice,
      privacyNotice: `k-Anonymity Verified (Cohort N=${workerCount} >= 12, ε=0.5 Differential Privacy)`
    },
    signalGateway: {
      gatewayNodeId,
      rssiDbm,
      snrDb,
      protocol,
      packetDeliveryPct,
      kalmanNoiseSuppressionPct
    }
  };
}

export default function NotificationCenter({
  alerts,
  zones,
  onViewDetails,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onDispatchAction,
  onSelectZone,
  departmentThresholdBreaches = [],
  onOpenDepartmentThresholds,
  onExportComplianceCsv,
  onGeneratePdfReport,
  onInjectTestAnomaly,
  isGeneratingPdf = false,
  incidentAssignments: propAssignments,
  onUpdateIncidentAssignment,
  telemetryRiskThreshold: propRiskThreshold,
  onUpdateTelemetryRiskThreshold,
  riskThresholdBreaches: propRiskBreaches,
  onAcknowledgeRiskBreach: propOnAcknowledgeRiskBreach,
  onClearRiskBreaches: propOnClearRiskBreaches,
  currentTelemetryRisk = 84.8,
  onTestBrowserAlert,
  onSimulateRiskBreach,
  browserPermission: propPermission,
  onRequestBrowserPermission,
  browserAlertsEnabled: propBrowserAlertsEnabled,
  onToggleBrowserAlerts,
  soundEnabled: propSoundEnabled,
  onToggleSound,
  className = ''
}: NotificationCenterProps) {
  // Notification View Mode: 'ALL_ALERTS' | 'RISK_BREACHES' | 'WORKFLOW_DISPATCH'
  const [activeViewMode, setActiveViewMode] = useState<'ALL_ALERTS' | 'RISK_BREACHES' | 'WORKFLOW_DISPATCH'>('ALL_ALERTS');

  // Internal or controlled threshold
  const [internalRiskThreshold, setInternalRiskThreshold] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prognosticator_telemetry_risk_threshold');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 40 && parsed <= 95) return parsed;
      }
    }
    return 75.0;
  });

  const activeRiskThreshold = propRiskThreshold !== undefined ? propRiskThreshold : internalRiskThreshold;

  const handleUpdateThreshold = (val: number) => {
    const clamped = Math.max(40, Math.min(95, Number(val.toFixed(1))));
    setInternalRiskThreshold(clamped);
    try {
      localStorage.setItem('prognosticator_telemetry_risk_threshold', clamped.toString());
    } catch {}
    if (onUpdateTelemetryRiskThreshold) {
      onUpdateTelemetryRiskThreshold(clamped);
    }
  };

  // Internal or controlled risk breaches
  const [internalRiskBreaches, setInternalRiskBreaches] = useState<TelemetryRiskBreachEvent[]>(INITIAL_RISK_BREACHES);
  const activeRiskBreaches = propRiskBreaches !== undefined ? propRiskBreaches : internalRiskBreaches;

  const handleAcknowledgeBreach = (id: string) => {
    if (propOnAcknowledgeRiskBreach) {
      propOnAcknowledgeRiskBreach(id);
    } else {
      setInternalRiskBreaches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, acknowledged: true } : b))
      );
    }
  };

  const handleClearBreaches = () => {
    if (propOnClearRiskBreaches) {
      propOnClearRiskBreaches();
    } else {
      setInternalRiskBreaches([]);
    }
  };

  // Browser Permission State
  const [localPermission, setLocalPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() => {
    return desktopNotificationService.checkPermission();
  });
  const permission = propPermission || localPermission;

  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    if (onRequestBrowserPermission) {
      onRequestBrowserPermission();
    } else {
      const res = await desktopNotificationService.requestPermission();
      setLocalPermission(res);
    }
  };

  const handleFireTestAlert = () => {
    if (onTestBrowserAlert) {
      onTestBrowserAlert();
    } else {
      desktopNotificationService.notifyRiskThresholdBreach(
        {
          id: `TEST-BREACH-${Date.now()}`,
          riskScore: currentTelemetryRisk || 85.0,
          threshold: activeRiskThreshold,
          delta: Number(((currentTelemetryRisk || 85.0) - activeRiskThreshold).toFixed(1)),
          zoneName: 'Outdoor Construction Sector 4',
          workerCount: 18,
          primarySignal: 'Acute Tachycardia & Core Thermal Plume',
          recommendedAction: 'Immediate shaded rest rotation and hydration triage.'
        },
        { forceTrigger: true }
      );
    }
    setTestNotificationFeedback('🚨 Test Browser Alert dispatched! Check your desktop/OS notification center.');
    setTimeout(() => setTestNotificationFeedback(null), 6000);
  };

  const handleSimulateSurge = () => {
    if (onSimulateRiskBreach) {
      onSimulateRiskBreach();
    } else {
      const simulatedScore = Number((activeRiskThreshold + 9.8).toFixed(1));
      const simulatedBreach: TelemetryRiskBreachEvent = {
        id: `BREACH-SIM-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: 'Just now',
        riskScore: simulatedScore,
        threshold: activeRiskThreshold,
        delta: Number((simulatedScore - activeRiskThreshold).toFixed(1)),
        zoneId: 'Outdoor-Construction-Sector-4',
        zoneName: 'Outdoor Construction Sector 4',
        workerCount: 18,
        severity: 'CRITICAL',
        triggerSignals: [
          { signalName: 'Elevated Cardiac Strain Vector', measuredValue: '142 BPM Tachycardia', referenceBaseline: 'Safe Max <= 115 BPM' },
          { signalName: 'Thermal Index Plume Spike', measuredValue: '43.8°C Extreme Danger', referenceBaseline: 'Ceiling <= 38.0°C' },
          { signalName: 'TWL Fatigue Index', measuredValue: '88.5 W/m² (Severe)', referenceBaseline: 'Buffer >= 115 W/m²' }
        ],
        recommendedAction: 'Mandate immediate shaded rest extraction and stage oral rehydration protocol.',
        acknowledged: false,
        browserAlertDispatched: true,
        workerPseudonym: 'W-9921'
      };
      setInternalRiskBreaches((prev) => [simulatedBreach, ...prev]);
      desktopNotificationService.notifyRiskThresholdBreach(
        {
          id: simulatedBreach.id,
          riskScore: simulatedBreach.riskScore,
          threshold: simulatedBreach.threshold,
          delta: simulatedBreach.delta,
          zoneName: simulatedBreach.zoneName,
          workerCount: simulatedBreach.workerCount,
          primarySignal: 'Elevated Cardiac Strain & Thermal Spike',
          recommendedAction: simulatedBreach.recommendedAction
        },
        { forceTrigger: true }
      );
    }
    setActiveViewMode('RISK_BREACHES');
    setTestNotificationFeedback('⚡ Simulated Risk Surge (84.8%) triggered! Browser alert dispatched and logged.');
    setTimeout(() => setTestNotificationFeedback(null), 6000);
  };

  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'UNACKNOWLEDGED'>('ALL');
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState<'ALL' | 'Pending' | 'Investigating' | 'Resolved'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBreachBannerDismissed, setIsBreachBannerDismissed] = useState<boolean>(false);

  // Expanded event cards state for granular telemetry view
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Incident Workflow State
  const [assignments, setAssignments] = useState<Record<string, IncidentAssignment>>(
    propAssignments || INITIAL_INCIDENT_ASSIGNMENTS
  );
  const [activeWorkflowModalAlert, setActiveWorkflowModalAlert] = useState<ActiveAnomalyAlert | null>(null);
  const [assigneeSelectId, setAssigneeSelectId] = useState<string>('ASG-MED-01');
  const [resolutionInput, setResolutionInput] = useState<string>('');

  // Keep synced if prop changes
  React.useEffect(() => {
    if (propAssignments) {
      setAssignments(propAssignments);
    }
  }, [propAssignments]);

  // Real-Time Team Alerts & Read Receipts Store
  const [teamAlerts, setTeamAlerts] = useState<TeamAlertNotification[]>(() =>
    teamAlertService.getAlerts()
  );

  React.useEffect(() => {
    const unsub = teamAlertService.subscribe((alerts) => {
      setTeamAlerts(alerts);
    });
    return () => unsub();
  }, []);

  // High-Risk events
  const highRiskEvents = useMemo(() => {
    return alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  }, [alerts]);

  // Filtered by user criteria, workflow status, & search
  const filteredEvents = useMemo(() => {
    return highRiskEvents.filter((item) => {
      // Severity / Status filter
      if (filterSeverity === 'CRITICAL' && item.severity !== 'CRITICAL') return false;
      if (filterSeverity === 'UNACKNOWLEDGED' && item.acknowledged) return false;

      // Workflow Status Filter
      if (filterWorkflowStatus !== 'ALL') {
        const assignment = assignments[item.id];
        const status = assignment ? assignment.status : 'Pending';
        if (status !== filterWorkflowStatus) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMetric = item.anomaly_metric.toLowerCase().includes(query);
        const matchesZone = item.location_zone.toLowerCase().includes(query);
        const matchesWorker = item.worker_id.toLowerCase().includes(query);
        const matchesAction = item.recommended_action.toLowerCase().includes(query);
        const assignment = assignments[item.id];
        const matchesAssignee = assignment?.assigneeName?.toLowerCase().includes(query) || false;
        return matchesMetric || matchesZone || matchesWorker || matchesAction || matchesAssignee;
      }
      return true;
    });
  }, [highRiskEvents, filterSeverity, filterWorkflowStatus, searchQuery, assignments]);

  const unacknowledgedCount = useMemo(() => {
    return highRiskEvents.filter((a) => !a.acknowledged).length;
  }, [highRiskEvents]);

  const criticalCount = useMemo(() => {
    return highRiskEvents.filter((a) => a.severity === 'CRITICAL').length;
  }, [highRiskEvents]);

  // Workflow status counters
  const workflowCounts = useMemo(() => {
    let pending = 0;
    let investigating = 0;
    let resolved = 0;

    highRiskEvents.forEach((item) => {
      const a = assignments[item.id];
      const status = a ? a.status : 'Pending';
      if (status === 'Pending') pending++;
      else if (status === 'Investigating') investigating++;
      else if (status === 'Resolved') resolved++;
    });

    return { pending, investigating, resolved };
  }, [highRiskEvents, assignments]);

  const toggleExpandEvent = (eventId: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (expandedEventIds.size === filteredEvents.length && filteredEvents.length > 0) {
      setExpandedEventIds(new Set());
    } else {
      setExpandedEventIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleCopyTelemetryJson = (alert: ActiveAnomalyAlert, meta: GranularTelemetryMetadata) => {
    const jsonStr = JSON.stringify(
      {
        alert_id: alert.id,
        timestamp: alert.detected_at,
        metric: alert.anomaly_metric,
        severity: alert.severity,
        location_zone: alert.location_zone,
        subject: alert.equipment_name || alert.worker_id,
        incident_assignment: assignments[alert.id] || null,
        granular_telemetry_metadata: meta
      },
      null,
      2
    );

    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiedId(alert.id);
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  // Workflow Handlers: Assign / Update Status
  const handleOpenWorkflowModal = (alert: ActiveAnomalyAlert) => {
    setActiveWorkflowModalAlert(alert);
    const existing = assignments[alert.id];
    if (existing?.assigneeId) {
      setAssigneeSelectId(existing.assigneeId);
    } else {
      // Suggest based on alert type
      if (alert.alert_type === 'PREDICTIVE_MAINTENANCE') {
        setAssigneeSelectId('ASG-MECH-03'); // Derek Zhang
      } else if (alert.anomaly_metric.toLowerCase().includes('noise')) {
        setAssigneeSelectId('ASG-NOISE-04'); // Thomas Schmidt
      } else if (alert.anomaly_metric.toLowerCase().includes('heat') || alert.anomaly_metric.toLowerCase().includes('temp')) {
        setAssigneeSelectId('ASG-COOL-02'); // Sarah Jenkins
      } else {
        setAssigneeSelectId('ASG-MED-01'); // Dr. Marcus Vance
      }
    }
    setResolutionInput(existing?.resolutionNotes || '');
  };

  const handleSaveWorkflow = (newStatus: IncidentWorkflowStatus) => {
    if (!activeWorkflowModalAlert) return;

    const alert = activeWorkflowModalAlert;
    const assignee = DEFAULT_FIELD_ASSIGNEES.find((a) => a.id === assigneeSelectId);
    const existing = assignments[alert.id];
    const previousStatus = existing?.status || 'Pending';

    const newActivity: IncidentActivityLogEntry = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: previousStatus === newStatus ? 'Assignment Updated' : `Status Transition: ${previousStatus} → ${newStatus}`,
      actor: 'Alex Mercer (Safety Manager)',
      notes: resolutionInput || undefined,
      previousStatus,
      newStatus
    };

    const updatedAssignment: IncidentAssignment = {
      eventId: alert.id,
      status: newStatus,
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
      assigneeRole: assignee?.role,
      assignedAt: existing?.assignedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: 'Just now',
      priority: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      resolutionNotes: resolutionInput || existing?.resolutionNotes,
      activityLog: [newActivity, ...(existing?.activityLog || [])]
    };

    setAssignments((prev) => ({
      ...prev,
      [alert.id]: updatedAssignment
    }));

    // Generate/sync mobile team alert notification for the assigned field engineer
    if (assignee && alert) {
      teamAlertService.createAlertFromAssignment(updatedAssignment, alert);
    }

    if (onUpdateIncidentAssignment) {
      onUpdateIncidentAssignment(updatedAssignment);
    }

    setActiveWorkflowModalAlert(null);
  };

  const handleQuickStatusChange = (alertId: string, targetStatus: IncidentWorkflowStatus) => {
    const existing = assignments[alertId];
    const previousStatus = existing?.status || 'Pending';

    const newActivity: IncidentActivityLogEntry = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `Status Transition: ${previousStatus} → ${targetStatus}`,
      actor: 'Alex Mercer (Safety Manager)',
      previousStatus,
      newStatus: targetStatus
    };

    const updatedAssignment: IncidentAssignment = {
      eventId: alertId,
      status: targetStatus,
      assigneeId: existing?.assigneeId || 'ASG-MED-01',
      assigneeName: existing?.assigneeName || 'Dr. Marcus Vance, MD',
      assigneeRole: existing?.assigneeRole || 'Emergency Medical Lead',
      assignedAt: existing?.assignedAt || 'Just now',
      updatedAt: 'Just now',
      priority: 'HIGH',
      resolutionNotes: existing?.resolutionNotes,
      activityLog: [newActivity, ...(existing?.activityLog || [])]
    };

    setAssignments((prev) => ({
      ...prev,
      [alertId]: updatedAssignment
    }));

    // Sync status change to teamAlertService for mobile receipts
    const matchedAlert = teamAlerts.find((ta) => ta.incidentId === alertId);
    if (matchedAlert) {
      if (targetStatus === 'Investigating') {
        teamAlertService.markAsEnRoute(matchedAlert.id, 'Engineer transitioning to investigating.');
      } else if (targetStatus === 'Resolved') {
        teamAlertService.markAsResolved(matchedAlert.id, 'Incident verified as resolved.');
      }
    }

    if (onUpdateIncidentAssignment) {
      onUpdateIncidentAssignment(updatedAssignment);
    }
  };

  const getAnomalyIcon = (metric: string, isPM?: boolean) => {
    const m = metric.toLowerCase();
    if (isPM || m.includes('vibration') || m.includes('bearing') || m.includes('machinery')) {
      return <Wrench className="h-4 w-4 text-orange-400" />;
    }
    if (m.includes('hrv') || m.includes('autonomic') || m.includes('cardio') || m.includes('strain')) {
      return <Heart className="h-4 w-4 text-rose-400" />;
    }
    if (m.includes('temp') || m.includes('thermal') || m.includes('heat')) {
      return <Flame className="h-4 w-4 text-amber-400" />;
    }
    if (m.includes('noise') || m.includes('acoustic')) {
      return <Volume2 className="h-4 w-4 text-cyan-400" />;
    }
    return <AlertTriangle className="h-4 w-4 text-rose-400" />;
  };

  return (
    <div
      id="high-risk-notification-center"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col relative overflow-hidden ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3.5 mb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-sm">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-bold text-white items-center justify-center">
                  {unacknowledgedCount}
                </span>
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>High-Risk Event Notification &amp; Incident Dispatch Center</span>
              </h2>

              <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                {highRiskEvents.length} Active Events
              </span>

              {criticalCount > 0 && (
                <span className="text-[10px] font-mono uppercase bg-rose-950 text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                  {criticalCount} Critical
                </span>
              )}

              {/* Department Threshold Breach Alert Badge */}
              {departmentThresholdBreaches.length > 0 && (
                <button
                  onClick={onOpenDepartmentThresholds}
                  className="text-[10px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/80 hover:border-amber-400 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-sm cursor-pointer"
                  title="Click to inspect department risk score threshold exceedances"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-400 animate-bounce" />
                  <span>{departmentThresholdBreaches.length} Dept Threshold Breaches</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign high-risk alerts to field teams or maintenance engineers, track live status (Pending, Investigating, Resolved), and inspect granular telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Master Expand/Collapse All Telemetry Details */}
          {filteredEvents.length > 0 && (
            <button
              onClick={handleToggleExpandAll}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-xs ${
                expandedEventIds.size === filteredEvents.length && filteredEvents.length > 0
                  ? 'bg-indigo-950/90 border-indigo-500/60 text-indigo-300'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
              title="Expand or collapse granular telemetry metadata for all visible events"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {expandedEventIds.size === filteredEvents.length && filteredEvents.length > 0
                  ? 'Collapse All Telemetry'
                  : 'Expand All Telemetry'}
              </span>
            </button>
          )}

          {/* Test Anomaly Injection Button */}
          {onInjectTestAnomaly && (
            <button
              onClick={onInjectTestAnomaly}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-rose-950 via-amber-950 to-rose-900 hover:from-rose-900 hover:to-amber-900 text-rose-200 hover:text-white px-3 py-1.5 rounded-lg border border-rose-500/50 text-xs font-bold transition cursor-pointer shadow-xs animate-pulse"
              title="Randomly inject a simulated high-risk event into this notification center for testing response workflows"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Test Anomaly</span>
            </button>
          )}

          {/* Extended Export Controls: Compliance CSV & Enterprise PDF Report */}
          {(onExportComplianceCsv || onGeneratePdfReport) && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {onExportComplianceCsv && (
                <button
                  onClick={onExportComplianceCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold transition cursor-pointer"
                  title="Download RFC 4180 CSV export of current anomaly telemetry formatted for statutory enterprise compliance"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
              )}

              {onGeneratePdfReport && (
                <button
                  onClick={onGeneratePdfReport}
                  disabled={isGeneratingPdf}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    isGeneratingPdf
                      ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-200 animate-pulse'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                  }`}
                  title="Compile current dashboard state, active incident logs, and predictive forecast chart into a downloadable enterprise-grade PDF report"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 text-cyan-300 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-white" />
                  )}
                  <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Generate PDF Report'}</span>
                </button>
              )}
            </div>
          )}

          {/* Acknowledge All */}
          {onAcknowledgeAll && unacknowledgedCount > 0 && (
            <button
              onClick={onAcknowledgeAll}
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium transition cursor-pointer"
              title="Acknowledge all current notifications"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Acknowledge All</span>
            </button>
          )}

          {/* Severity Filter Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filterSeverity === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({highRiskEvents.length})
            </button>
            <button
              onClick={() => setFilterSeverity('CRITICAL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                filterSeverity === 'CRITICAL'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-xs'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>Critical</span>
            </button>
            <button
              onClick={() => setFilterSeverity('UNACKNOWLEDGED')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filterSeverity === 'UNACKNOWLEDGED'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Unread ({unacknowledgedCount})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HEALTH TELEMETRY RISK THRESHOLD & BROWSER ALERT SENTINEL  */}
      {/* ========================================================= */}
      <div className="mb-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-inner relative overflow-hidden">
        {/* Glow accent */}
        <div className={`absolute top-0 right-0 w-64 h-32 rounded-full blur-2xl pointer-events-none ${
          currentTelemetryRisk >= activeRiskThreshold ? 'bg-rose-500/10' : 'bg-cyan-500/10'
        }`} />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                <Sliders className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Health Telemetry Risk Threshold &amp; Browser Alerts Sentinel</span>
              </h3>
              {currentTelemetryRisk >= activeRiskThreshold ? (
                <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                  <span>Threshold Exceeded (+{(currentTelemetryRisk - activeRiskThreshold).toFixed(1)}%)</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Within Safety Envelope</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure your critical cutoff. When streaming population health telemetry risk exceeds this user-defined threshold, immediate browser alerts, sirens, and field dispatch directives are triggered.
            </p>
          </div>

          {/* Quick Browser Alert Testing Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                title="Request native browser notification permission"
              >
                <Bell className="h-3.5 w-3.5 text-white animate-bounce" />
                <span>Enable Browser Alerts</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>OS Push: Permitted</span>
              </span>
            )}

            <button
              onClick={handleFireTestAlert}
              className="flex items-center space-x-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
              title="Dispatch a test OS browser alert to verify native push notification and audio chime"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Test Browser Alert</span>
            </button>

            <button
              onClick={handleSimulateSurge}
              className="flex items-center space-x-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
              title="Simulate sudden telemetry spike exceeding user threshold to verify automated alert trigger"
            >
              <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span>Simulate Risk Surge</span>
            </button>
          </div>
        </div>

        {/* Feedback notice when test fired */}
        {testNotificationFeedback && (
          <div className="my-2 p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span>{testNotificationFeedback}</span>
            <button onClick={() => setTestNotificationFeedback(null)} className="text-cyan-400 hover:text-white text-xs">&times;</button>
          </div>
        )}

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 pt-1">
          {/* Left: Interactive Threshold Slider & Preset Tiers */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                  <span>User-Defined Risk Threshold Cutoff</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-mono">Cutoff:</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="40"
                      max="95"
                      step="0.5"
                      value={activeRiskThreshold}
                      onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value) || 75)}
                      className="w-16 bg-slate-950 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs font-mono font-bold text-cyan-400">%</span>
                  </div>
                </div>
              </div>

              {/* Slider with visual gradient background */}
              <div className="relative mb-2">
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="0.5"
                  value={activeRiskThreshold}
                  onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>40% (Cautious)</span>
                  <span>65% (EHS Baseline)</span>
                  <span className="text-cyan-400 font-bold">75% (Recommended)</span>
                  <span>85% (Severe)</span>
                  <span>95% (Life Safety)</span>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {[
                { label: '60% Cautious', val: 60.0 },
                { label: '70% Standard EHS', val: 70.0 },
                { label: '75% Recommended', val: 75.0 },
                { label: '80% High Strain', val: 80.0 },
                { label: '85% Acute Triage', val: 85.0 }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => handleUpdateThreshold(p.val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                    activeRiskThreshold === p.val
                      ? 'bg-cyan-600 text-white font-bold shadow-xs'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Live Telemetry Risk vs Threshold Comparison Gauge */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Live Telemetry Risk Monitor</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Outdoor Sector 4 Live
                </span>
              </div>

              {/* Progress Gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-slate-400">Current Health Risk:</span>
                  <span className={`text-sm font-bold ${
                    currentTelemetryRisk >= activeRiskThreshold ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {currentTelemetryRisk.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar with cutoff line */}
                <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentTelemetryRisk >= activeRiskThreshold
                        ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600'
                        : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, currentTelemetryRisk)}%` }}
                  />
                  {/* Threshold vertical line indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xs z-10"
                    style={{ left: `${Math.min(100, activeRiskThreshold)}%` }}
                    title={`User Threshold: ${activeRiskThreshold}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0% Safe</span>
                  <span className="text-white font-bold">Cutoff: {activeRiskThreshold.toFixed(1)}%</span>
                  <span>100% Critical</span>
                </div>
              </div>
            </div>

            {/* Threshold Exceedance Result Banner */}
            <div className={`mt-2 p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
              currentTelemetryRisk >= activeRiskThreshold
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5">
                {currentTelemetryRisk >= activeRiskThreshold ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 animate-bounce" />
                    <span className="font-bold">EXCEEDED: +{(currentTelemetryRisk - activeRiskThreshold).toFixed(1)}% above cutoff!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Safe buffer: {(activeRiskThreshold - currentTelemetryRisk).toFixed(1)}% below cutoff</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {currentTelemetryRisk >= activeRiskThreshold ? 'Immediate Alert Sent' : 'Monitored'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary View Mode Switcher */}
      <div className="mb-3.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setActiveViewMode('ALL_ALERTS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'ALL_ALERTS'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>High-Risk Anomaly Alerts ({highRiskEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('RISK_BREACHES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'RISK_BREACHES'
                ? 'bg-gradient-to-r from-rose-950 to-amber-950 text-rose-200 border border-rose-500/60 shadow-xs'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <BellRing className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>Telemetry Risk Threshold Breaches</span>
            {activeRiskBreaches.filter((b) => !b.acknowledged).length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold animate-pulse">
                {activeRiskBreaches.filter((b) => !b.acknowledged).length} Active
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 text-[10px] font-mono">
                {activeRiskBreaches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveViewMode('WORKFLOW_DISPATCH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'WORKFLOW_DISPATCH'
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-xs'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Incident Field Dispatch ({workflowCounts.investigating} Active)</span>
          </button>
        </div>

        {activeViewMode === 'RISK_BREACHES' && activeRiskBreaches.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                activeRiskBreaches.forEach((b) => handleAcknowledgeBreach(b.id));
              }}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Acknowledge All Breaches</span>
            </button>
            <button
              onClick={handleClearBreaches}
              className="text-[11px] font-mono text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
            >
              Clear Log
            </button>
          </div>
        )}
      </div>

      {/* Incident Response Workflow Status Filter Ribbon */}
      <div className="mb-3.5 bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Workflow Status:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setFilterWorkflowStatus('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filterWorkflowStatus === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Statuses ({highRiskEvents.length})
            </button>
            <button
              onClick={() => setFilterWorkflowStatus('Pending')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterWorkflowStatus === 'Pending'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Pending ({workflowCounts.pending})</span>
            </button>
            <button
              onClick={() => setFilterWorkflowStatus('Investigating')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterWorkflowStatus === 'Investigating'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-xs'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Investigating ({workflowCounts.investigating})</span>
            </button>
            <button
              onClick={() => setFilterWorkflowStatus('Resolved')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterWorkflowStatus === 'Resolved'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Resolved ({workflowCounts.resolved})</span>
            </button>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
          {workflowCounts.investigating} Active Field Teams Deployed
        </span>
      </div>

      {/* Department Threshold Breach Alert Callout Banner */}
      {departmentThresholdBreaches.length > 0 && !isBreachBannerDismissed && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <strong className="text-white font-bold">DEPARTMENT RISK SCORE THRESHOLD ALERT:</strong>
                <span className="text-amber-300">
                  {departmentThresholdBreaches.length} division{departmentThresholdBreaches.length > 1 ? 's' : ''} exceed configured supervisory cutoffs:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {departmentThresholdBreaches.map((b) => (
                  <span
                    key={b.departmentId}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-amber-500/50 text-amber-200"
                  >
                    <strong>{b.departmentName}</strong>: {b.currentRisk.toFixed(1)}% &gt; {b.threshold}% Limit
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end">
            {onOpenDepartmentThresholds && (
              <button
                onClick={onOpenDepartmentThresholds}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Sliders className="h-3 w-3" />
                <span>Configure Thresholds</span>
              </button>
            )}
            <button
              onClick={() => setIsBreachBannerDismissed(true)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 cursor-pointer"
              title="Dismiss banner"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* If viewing Risk Threshold Breaches */}
      {activeViewMode === 'RISK_BREACHES' ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
          {activeRiskBreaches.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-white">No Telemetry Risk Threshold Breaches Recorded</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Streaming health risk telemetry is stabilized below your configured threshold cutoff of {activeRiskThreshold.toFixed(1)}%.
              </p>
            </div>
          ) : (
            activeRiskBreaches.map((breach) => {
              const isCritical = breach.severity === 'CRITICAL' || breach.riskScore >= 80;
              return (
                <div
                  key={breach.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col ${
                    !breach.acknowledged
                      ? isCritical
                        ? 'bg-rose-950/30 border-rose-500/70 shadow-lg shadow-rose-950/20'
                        : 'bg-amber-950/25 border-amber-500/60'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className="p-1.5 rounded-lg bg-rose-950 border border-rose-500/50 text-rose-400">
                        <Radio className="h-4 w-4 animate-pulse" />
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded uppercase bg-rose-500/20 text-rose-300 border border-rose-500/50">
                        {breach.riskScore.toFixed(1)}% RISK SCORE
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        +{breach.delta.toFixed(1)}% above cutoff ({breach.threshold.toFixed(1)}%)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        ID: {breach.id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{breach.timeFormatted} ({new Date(breach.timestamp).toLocaleTimeString()})</span>
                    </div>
                  </div>

                  {/* Sector & Worker Cohort */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1 font-bold">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-white">{breach.zoneName}</span>
                      </span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-cyan-300 font-semibold">{breach.workerCount} Active Workers in Cohort</span>
                      {breach.workerPseudonym && (
                        <>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-indigo-300">Subject: {breach.workerPseudonym}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>OS Push Alert Dispatched</span>
                      </span>
                    </div>
                  </div>

                  {/* Triggering Signals Breakdown */}
                  <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {breach.triggerSignals.map((sig, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
                        <div className="text-slate-400 text-[10px] font-semibold">{sig.signalName}</div>
                        <div className="text-rose-300 font-bold mt-0.5">{sig.measuredValue}</div>
                        <div className="text-slate-500 text-[9px] mt-0.5">Ref: {sig.referenceBaseline}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Action */}
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs">
                    <strong className="text-amber-300 uppercase tracking-wider text-[10px] block mb-0.5">Recommended Safety Directive:</strong>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{breach.recommendedAction}</p>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono">
                      {breach.acknowledged ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Acknowledged by Safety Supervisor</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Immediate Action Required</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!breach.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeBreach(breach.id)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Acknowledge Breach
                        </button>
                      )}
                      {onSelectZone && (
                        <button
                          onClick={() => onSelectZone(breach.zoneId)}
                          className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Inspect Zone</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          {/* Filter / Search Sub-Bar */}
          <div className="relative mb-3">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter recent high-risk events by anomaly type, assignee, zone, or worker..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Scrollable Events List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
        {filteredEvents.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-white">No High-Risk Events in Current Filter</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All monitored physiological and mechanical telemetry parameters are currently stabilized within safe thresholds.
            </p>
          </div>
        ) : (
          filteredEvents.map((item) => {
            const isCritical = item.severity === 'CRITICAL';
            const isPM = item.alert_type === 'PREDICTIVE_MAINTENANCE';
            const isExpanded = expandedEventIds.has(item.id);
            const matchedZone = zones.find((z) => z.id === item.location_zone);
            const meta = computeGranularTelemetry(item, matchedZone);
            const assignment = assignments[item.id] || {
              eventId: item.id,
              status: 'Pending' as IncidentWorkflowStatus,
              priority: isCritical ? 'CRITICAL' : 'HIGH',
              updatedAt: 'Recently',
              activityLog: []
            };

            const isPending = assignment.status === 'Pending';
            const isInvestigating = assignment.status === 'Investigating';
            const isResolved = assignment.status === 'Resolved';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col group relative overflow-hidden ${
                  isResolved
                    ? 'bg-slate-950/60 border-slate-800/60 opacity-90'
                    : !item.acknowledged
                    ? isCritical
                      ? 'bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/20 hover:border-rose-400'
                      : 'bg-amber-950/25 border-amber-500/50 hover:border-amber-400'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                }`}
              >
                {/* Main Card Summary Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full">
                  {/* Left: Icon, Details, Timestamp & Anomaly Type */}
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg border mt-0.5 shrink-0 ${
                        isCritical
                          ? 'bg-rose-950/80 border-rose-500/60 text-rose-400'
                          : 'bg-amber-950/80 border-amber-500/60 text-amber-400'
                      }`}
                    >
                      {getAnomalyIcon(item.anomaly_metric, isPM)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Header Row: Timestamp + Anomaly Type + Severity Badge + Workflow Tracker */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-white flex items-center gap-1">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span>{item.detected_at}</span>
                        </span>

                        <span className="text-slate-600 font-mono text-xs">&bull;</span>

                        <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition truncate">
                          {item.anomaly_metric}
                        </h3>

                        <span
                          className={`text-[9px] font-black uppercase font-mono px-2 py-0.2 rounded-full border shrink-0 ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          }`}
                        >
                          {item.severity}
                        </span>

                        {/* Incident Workflow Status Tracker Badge */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenWorkflowModal(item)}
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition cursor-pointer ${
                              isResolved
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 hover:bg-emerald-900/80'
                                : isInvestigating
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70 hover:bg-cyan-900/80'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/70 hover:bg-amber-900/80'
                            }`}
                            title="Click to manage incident assignment and update status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isResolved
                                  ? 'bg-emerald-400'
                                  : isInvestigating
                                  ? 'bg-cyan-400 animate-ping'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="uppercase">{assignment.status}</span>
                            {assignment.assigneeName && (
                              <span className="text-slate-400 font-normal truncate max-w-[120px]">
                                &bull; {assignment.assigneeName.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        </div>

                        {!item.acknowledged && (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Metadata Sub-Row: Zone, Worker / Equipment, Telemetry values */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1 text-cyan-300">
                          <MapPin className="h-3 w-3 text-cyan-400" />
                          <span>{item.location_zone.replace(/-/g, ' ')}</span>
                        </span>

                        <span className="text-slate-600">&bull;</span>

                        <span>
                          Subject: <strong className="text-slate-200">{item.equipment_name || item.worker_id}</strong>
                        </span>

                        <span className="text-slate-600">&bull;</span>

                        <span>
                          Reading: <strong className="text-amber-300">{item.raw_value}</strong>
                        </span>

                        {item.lead_time && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-emerald-400">Lead: {item.lead_time}</span>
                          </>
                        )}
                      </div>

                      {/* Incident Assignee & Directive snippet */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                        {assignment.assigneeName ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300 font-mono text-[10px]">
                              <UserCheck className="h-3 w-3 text-cyan-400" />
                              <span>Assigned: <strong className="text-white">{assignment.assigneeName}</strong> ({assignment.assigneeRole})</span>
                            </span>
                            {(() => {
                              const ta = teamAlerts.find((a) => a.incidentId === item.id);
                              if (!ta) return null;
                              if (ta.status === 'RESOLVED') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px]">
                                    <CheckCheck className="h-2.5 w-2.5 text-emerald-400" />
                                    <span>Resolved</span>
                                  </span>
                                );
                              }
                              if (ta.status === 'EN_ROUTE') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] animate-pulse">
                                    <Radio className="h-2.5 w-2.5 text-amber-400" />
                                    <span>En Route (Acknowledged)</span>
                                  </span>
                                );
                              }
                              if (ta.status === 'READ') {
                                const timeStr = ta.readAt
                                  ? new Date(ta.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Verified';
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-[10px]" title={`Read receipt timestamp: ${ta.readAt}`}>
                                    <CheckCheck className="h-2.5 w-2.5 text-cyan-400" />
                                    <span>Read receipt ✓✓ {timeStr}</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px]" title={`Delivered at ${ta.deliveredAt}, waiting for mobile read receipt`}>
                                  <Check className="h-2.5 w-2.5 text-slate-500" />
                                  <span>Delivered (Unread)</span>
                                </span>
                              );
                            })()}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenWorkflowModal(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-[10px] hover:bg-amber-900/60 transition cursor-pointer"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>+ Assign Field Team / Engineer</span>
                          </button>
                        )}

                        <span className="text-slate-400 line-clamp-1 font-sans">
                          <strong className="text-slate-300">Directive:</strong> {item.recommended_action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    {/* Incident Assign / Response Button */}
                    <button
                      onClick={() => handleOpenWorkflowModal(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Open incident response workflow modal to assign team and update tracking status"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Assign / Status</span>
                    </button>

                    {/* Expand / Collapse Granular Telemetry Button */}
                    <button
                      onClick={() => toggleExpandEvent(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isExpanded
                          ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                      }`}
                      title={
                        isExpanded
                          ? 'Collapse granular telemetry metadata'
                          : 'Expand granular telemetry metadata (Sensor Temperature, Voltage Stability, Worker Density)'
                      }
                    >
                      <Layers className={`h-3.5 w-3.5 ${isExpanded ? 'text-indigo-300' : 'text-indigo-400'}`} />
                      <span>{isExpanded ? 'Collapse' : 'Telemetry'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    {/* Quick Acknowledge */}
                    {!item.acknowledged && onAcknowledgeAlert && (
                      <button
                        onClick={() => onAcknowledgeAlert(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                        title="Mark as acknowledged"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Acknowledge</span>
                      </button>
                    )}

                    {/* Primary 'View Details' Action Button */}
                    <button
                      onClick={() => onViewDetails(item)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-950/40 group-hover:bg-cyan-500"
                      title="Open comprehensive telemetry parameters & Kalman state decomposition modal"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Workflow Status Tracker Step-Bar on Card */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Incident Tracker:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'Pending')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          isPending
                            ? 'bg-amber-950 text-amber-300 border border-amber-500'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        1. Pending
                      </button>
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'Investigating')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          isInvestigating
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        2. Investigating
                      </button>
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'Resolved')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          isResolved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        3. Resolved
                      </button>
                    </div>
                  </div>

                  {assignment.updatedAt && (
                    <span className="text-slate-500 hidden sm:inline">
                      Updated: {assignment.updatedAt}
                    </span>
                  )}
                </div>

                {/* ========================================================= */}
                {/* EXPANDED VIEW: GRANULAR TELEMETRY METADATA               */}
                {/* ========================================================= */}
                {isExpanded && (
                  <div className="w-full mt-3 pt-3 border-t border-slate-800/90 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Expanded Section Subheader */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/90 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Granular Telemetry Metadata &amp; Zone Operational Envelope
                        </span>
                        <span className="hidden sm:inline text-slate-600">|</span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {meta.signalGateway.gatewayNodeId} ({meta.signalGateway.protocol})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyTelemetryJson(item, meta)}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-mono transition cursor-pointer"
                          title="Copy full telemetry metadata to clipboard as JSON"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied JSON!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-400" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onViewDetails(item)}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition cursor-pointer"
                          title="Open analytical decomposition modal"
                        >
                          <span>Full Modal</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Three-Card Granular Telemetry Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. SENSOR TEMPERATURE METADATA CARD */}
                      <div className="bg-slate-950/95 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                              <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                              <span>Sensor Temperature</span>
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                meta.sensorTemp.status === 'CRITICAL_HEAT'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                                  : meta.sensorTemp.status === 'ELEVATED'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                              }`}
                            >
                              {meta.sensorTemp.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Primary Temp Metrics */}
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <div className="text-xl font-bold font-mono text-white tracking-tight">
                                {meta.sensorTemp.casingProbeC}°C
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Sensor Internal/Probe Temp
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold font-mono text-amber-300">
                                {meta.sensorTemp.ambientC}°C
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Ambient Air Temp
                              </span>
                            </div>
                          </div>

                          {/* Temperature Specs Details */}
                          <div className="space-y-1 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Thermal Ceiling:</span>
                              <span className="font-semibold text-slate-200">
                                {meta.sensorTemp.thresholdCeilingC}°C
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Thermal Variance:</span>
                              <span
                                className={
                                  meta.sensorTemp.deltaC > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                                }
                              >
                                {meta.sensorTemp.deltaC > 0 ? `+${meta.sensorTemp.deltaC}°C Exceedance` : 'Nominal'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Calibrated Range:</span>
                              <span className="text-slate-400">{meta.sensorTemp.operatingRange}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Hardware Drift:</span>
                              <span className="text-cyan-400">{meta.sensorTemp.calibrationDrift}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-slate-500 line-clamp-1 italic font-mono">
                          Hardware: {meta.sensorTemp.sensorModel}
                        </div>
                      </div>

                      {/* 2. VOLTAGE STABILITY METADATA CARD */}
                      <div className="bg-slate-950/95 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
                              <Zap className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Voltage Stability</span>
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                meta.voltageStability.railStatus === 'STABLE'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/60'
                              }`}
                            >
                              {meta.voltageStability.stabilityScorePct}% STABLE
                            </span>
                          </div>

                          {/* Primary Voltage Metric */}
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <div className="text-xl font-bold font-mono text-white tracking-tight flex items-center gap-1">
                                <span>{meta.voltageStability.railVoltageV.toFixed(2)} V</span>
                                <span className="text-xs font-normal text-slate-500">
                                  / {meta.voltageStability.nominalVoltageV.toFixed(1)}V Bus
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Measured Sensor Bus Voltage
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold font-mono text-cyan-300">
                                ±{meta.voltageStability.rippleMv} mV
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Peak-to-Peak Ripple
                              </span>
                            </div>
                          </div>

                          {/* Voltage Stability Specs */}
                          <div className="space-y-1 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Rail Deviation:</span>
                              <span className="font-semibold text-slate-200">
                                {meta.voltageStability.deviationPct}%
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Brownout Margin:</span>
                              <span className="text-emerald-400 font-semibold">
                                +{meta.voltageStability.brownoutMarginV}V Headroom
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Power Source:</span>
                              <span className="text-slate-300 truncate max-w-[150px]" title={meta.voltageStability.powerSource}>
                                {meta.voltageStability.batteryPercent ? `LiFePO4 (${meta.voltageStability.batteryPercent}%)` : '24V DC Bus'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Filter Status:</span>
                              <span className="text-cyan-400">Kalman State Regularized</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-slate-500 line-clamp-1 italic font-mono flex items-center gap-1">
                          <BatteryCharging className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{meta.voltageStability.powerSource}</span>
                        </div>
                      </div>

                      {/* 3. WORKER DENSITY & ZONE SPECIFIC METADATA CARD */}
                      <div className="bg-slate-950/95 border border-indigo-500/30 rounded-xl p-3 flex flex-col justify-between shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                              <Users className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Zone Worker Density</span>
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                meta.workerDensity.densityTier === 'HIGH'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                                  : meta.workerDensity.densityTier === 'MODERATE'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                              }`}
                            >
                              {meta.workerDensity.densityTier} DENSITY
                            </span>
                          </div>

                          {/* Primary Density Metric */}
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <div className="text-xl font-bold font-mono text-white tracking-tight">
                                {meta.workerDensity.densityPer1000M2}{' '}
                                <span className="text-xs font-normal text-slate-400">
                                  / 1,000 m²
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Active Cohort Concentration
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold font-mono text-indigo-300">
                                {meta.workerDensity.workerCount} Workers
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {meta.workerDensity.occupancyPct}% of Max Cap ({meta.workerDensity.maxSafeCapacity})
                              </span>
                            </div>
                          </div>

                          {/* Zone Physical & Thermal Specs */}
                          <div className="space-y-1 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Zone Floor Area:</span>
                              <span className="text-slate-200">
                                {meta.workerDensity.zoneAreaM2.toLocaleString()} m² ({meta.workerDensity.zoneAreaSqFt.toLocaleString()} sq ft)
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Thermal Work Limit:</span>
                              <span className="text-amber-300 font-semibold">
                                {meta.workerDensity.twlIndex} W/m²
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Work Rotation:</span>
                              <span className="text-slate-300 truncate max-w-[150px]" title={meta.workerDensity.twlClassification}>
                                {meta.workerDensity.twlClassification}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Privacy Cleared:</span>
                              <span className="text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                <span>k &ge; 12 Cleared</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-slate-400 line-clamp-1 italic font-sans" title={meta.workerDensity.microclimateNotice}>
                          {meta.workerDensity.microclimateNotice}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Telemetry Gateway & Action Bar */}
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                          <span>RSSI: <strong className="text-white">{meta.signalGateway.rssiDbm} dBm</strong></span>
                        </span>
                        <span className="text-slate-700">&bull;</span>
                        <span>SNR: <strong className="text-white">+{meta.signalGateway.snrDb} dB</strong></span>
                        <span className="text-slate-700">&bull;</span>
                        <span>Delivery: <strong className="text-emerald-400">{meta.signalGateway.packetDeliveryPct}%</strong></span>
                        <span className="text-slate-700">&bull;</span>
                        <span>Kalman Noise Rejection: <strong className="text-cyan-400">{meta.signalGateway.kalmanNoiseSuppressionPct}%</strong></span>
                      </div>

                      {onSelectZone && (
                        <button
                          onClick={() => onSelectZone(item.location_zone)}
                          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition text-[11px] cursor-pointer"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Filter &amp; Focus Zone</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* Incident Response Assignment & Status Management Modal */}
      {activeWorkflowModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl max-w-lg w-full relative">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/50 text-indigo-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Incident Response &amp; Field Assignment</h3>
                  <p className="text-xs text-slate-400">
                    Alert ID: <strong className="font-mono text-cyan-300">{activeWorkflowModalAlert.id}</strong> &bull; {activeWorkflowModalAlert.anomaly_metric}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveWorkflowModalAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Field Team / Maintenance Engineer Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                  Assign to Field Team / Maintenance Engineer:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_FIELD_ASSIGNEES.map((assignee) => {
                    const isSelected = assigneeSelectId === assignee.id;
                    return (
                      <button
                        key={assignee.id}
                        type="button"
                        onClick={() => setAssigneeSelectId(assignee.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="h-7 w-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {assignee.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate text-white">{assignee.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{assignee.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution / Investigation Dispatch Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                  Supervisor Directive &amp; Investigation Notes:
                </label>
                <textarea
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="Detail field directive (e.g. Deploy shaded cooling tent, administer 500ml oral electrolyte pack, inspect bearing lubrication)..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Action Buttons to save directly into specific status */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 uppercase tracking-wider text-[11px]">
                  Update Incident Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSaveWorkflow('Pending')}
                    className="p-2.5 rounded-xl border border-amber-500/50 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>Set Pending</span>
                  </button>

                  <button
                    onClick={() => handleSaveWorkflow('Investigating')}
                    className="p-2.5 rounded-xl border border-cyan-500/60 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span>Mark Investigating</span>
                  </button>

                  <button
                    onClick={() => handleSaveWorkflow('Resolved')}
                    className="p-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            Use &apos;Assign / Status&apos; to dispatch field teams and track workflow lifecycle across Pending, Investigating, and Resolved states.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400 shrink-0">
          <span>{workflowCounts.investigating} Active In Field</span>
          <span className="text-slate-700">|</span>
          <span>{workflowCounts.resolved} Resolved</span>
        </div>
      </div>
    </div>
  );
}

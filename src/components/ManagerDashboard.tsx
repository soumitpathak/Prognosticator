import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  LineChart,
  Sliders,
  FileSpreadsheet,
  Download,
  Settings,
  Radio,
  Send,
  Plus,
  Zap,
  CloudSun,
  TrendingUp
} from 'lucide-react';
import {
  ActiveAnomalyAlert,
  AnomalyPredictionResult,
  AuditEvent,
  FacilityZone,
  KalmanSensitivityConfig,
  MedicalDispatchNotification,
  TelemetryDataPoint,
  TelemetryPacket,
  ZoneWeatherData,
  SensorStreamToggles,
  SystemAuditLogEntry,
  SensorCorrelationPoint,
  VoiceAlertSettings,
  HealthSignalNotificationThresholds,
  ThresholdBreachToast,
  ToastSignalKey,
  AnomalyAuditRecord,
  CriticalAnomalyToastData
} from '../types';
import {
  INITIAL_ACTIVE_ALERTS,
  INITIAL_FACILITY_ZONES,
  INITIAL_SYSTEM_AUDIT_LOGS,
  generatePacketForZone,
  generateSyntheticStream,
  generateCorrelationDataset
} from '../services/telemetryStream';
import { predictWorkforceAnomaly } from '../services/lstmAnomalyEngine';
import { fetchLiveZoneWeather } from '../services/weatherService';
import { voiceAlertService, DEFAULT_VOICE_SETTINGS } from '../services/voiceAlertService';
import AuditLogModal from './AuditLogModal';
import AnomalyAuditLogModal from './AnomalyAuditLogModal';
import ForecastedResourceDistributionWidget from './ForecastedResourceDistributionWidget';
import { compileFullAnomalyAuditLog } from '../services/anomalyAuditService';
import TelemetryInspectorModal from './TelemetryInspectorModal';
import StreamSimulatorDrawer from './StreamSimulatorDrawer';
import TelemetryCharts from './TelemetryCharts';
import ActiveAlertsSection from './ActiveAlertsSection';
import SensorCorrelationScatterPlot from './SensorCorrelationScatterPlot';
import ReportExportModal from './ReportExportModal';
import KalmanSettingsModal, { DEFAULT_KALMAN_CONFIG } from './KalmanSettingsModal';
import MedicalDispatchModal from './MedicalDispatchModal';
import CustomZoneBuilderModal from './CustomZoneBuilderModal';
import ZoneWeatherCard from './ZoneWeatherCard';
import IncidentProjectionChart from './IncidentProjectionChart';
import FloorPlan2DView from './FloorPlan2DView';
import SystemAuditLog from './SystemAuditLog';
import ResourceAllocationModule from './ResourceAllocationModule';
import VoiceAlertsModal from './VoiceAlertsModal';
import IncidentHotspotsWidget from './IncidentHotspotsWidget';
import GlobalSearchBar from './GlobalSearchBar';
import BiometricSyncModule from './BiometricSyncModule';
import MaintenanceSchedulerModule from './MaintenanceSchedulerModule';
import HistoricalWorkforceHealthChart from './HistoricalWorkforceHealthChart';
import ActiveAnomaliesWidget from './ActiveAnomaliesWidget';
import ChronologicalAnomalyLogPanel from './ChronologicalAnomalyLogPanel';
import AlertHistoryTable from './AlertHistoryTable';
import RecentAnomaliesAuditList from './RecentAnomaliesAuditList';
import ThresholdBreachToastContainer from './ThresholdBreachToastContainer';
import CriticalAnomalyToast from './CriticalAnomalyToast';
import HealthThresholdsConfigModal, { DEFAULT_HEALTH_THRESHOLDS } from './HealthThresholdsConfigModal';
import SensorThresholdsConfigPanel from './SensorThresholdsConfigPanel';
import { exportWorkforceHealthCsv } from '../services/workforceCsvExport';
import { downloadAnomalyReportJson, downloadAnomalyReportCsv } from '../services/reportExportService';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import AnomalyTrend30DaysChart from './AnomalyTrend30DaysChart';
import AnomalyThresholdConfigPanel from './AnomalyThresholdConfigPanel';
import OrganizationalAnomalyHeatmap from './OrganizationalAnomalyHeatmap';
import PatternRecognitionPanel from './PatternRecognitionPanel';
import DepartmentSeverityStackedBarChart from './DepartmentSeverityStackedBarChart';
import {
  generate30DayAnomalyTrend,
  generate30DayAnomalyTrendWithProjection,
  computeTrendSummary,
  exportSimulatedAnomalyReportPdf,
  exportSimulatedAnomalyReportCsv
} from '../services/anomalyTrend30DayService';
import { FileText, Loader2, Navigation, ShieldCheck, Crosshair, Wrench, Volume2, VolumeX, UserCheck, Sparkles, Heart, Clock, History, ChevronDown, FileCode, Bell, BellRing, Flame, Globe, GitMerge, BarChart3 } from 'lucide-react';

const INITIAL_MEDICAL_DISPATCHES: MedicalDispatchNotification[] = [
  {
    id: 'DSP-9921-COOL',
    alertId: 'ALR-8842-CR',
    zone: 'Outdoor-Construction-Sector-4',
    severity: 'CRITICAL',
    recipientRole: 'On-Site Rapid Cooling Evacuation Team',
    contactMethod: 'DUAL_CHANNEL',
    recipientPhone: '+1 (555) 911-COOL-2',
    messagePayload:
      'CRITICAL ALERT: Worker W-9921 exhibiting severe autonomic deceleration (HRV 31ms, skin temp 38.4°C). Immediate extraction to shaded tent with oral rehydration dispatched.',
    stagedAt: '10 mins ago',
    status: 'TRANSMITTED'
  },
  {
    id: 'DSP-6104-PPE',
    alertId: 'ALR-8839-HG',
    zone: 'Outdoor-Construction-Sector-4',
    severity: 'HIGH',
    recipientRole: 'Acoustic Hearing Protection Officer',
    contactMethod: 'SMS',
    recipientPhone: '+1 (555) 441-NOISE',
    messagePayload:
      'HIGH NOISE HAZARD: Machine 4B acoustic overpressure breach (104.8 dB raw / 98.4 dB smoothed). Deploy secondary ear defenders to Sector 4 cohort.',
    stagedAt: '25 mins ago',
    status: 'ACKNOWLEDGED_BY_TEAM',
    acknowledgedAt: '20 mins ago',
    responderNotes: 'Secondary ear defenders distributed; compressor vibration dampeners checked.'
  },
  {
    id: 'DSP-3209-REST',
    alertId: 'ALR-8827-MD',
    zone: 'Warehouse-Logistics-Hub-North',
    severity: 'MODERATE',
    recipientRole: 'Warehouse Logistics Shift Supervisor',
    contactMethod: 'SMS',
    recipientPhone: '+1 (555) 728-WH-LEAD',
    messagePayload:
      'MODERATE FATIGUE: Worker W-3209 sleep deficit exceedance (3.5h). Reassign to ground-level staging.',
    stagedAt: '45 mins ago',
    status: 'STAGED'
  }
];

export default function ManagerDashboard() {
  const [selectedZone, setSelectedZone] = useState<string>('Outdoor-Construction-Sector-4');
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<FacilityZone[]>(INITIAL_FACILITY_ZONES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryDataPoint[]>(() => generateSyntheticStream(24, 15));
  const [activeAlerts, setActiveAlerts] = useState<ActiveAnomalyAlert[]>(INITIAL_ACTIVE_ALERTS);
  const [correlationData, setCorrelationData] = useState<SensorCorrelationPoint[]>(() =>
    generateCorrelationDataset('ALL')
  );

  // Live Weather State
  const [currentWeather, setCurrentWeather] = useState<ZoneWeatherData | null>(null);

  // Streaming IoT Hub Simulator State
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(false);
  const [jitterEnabled, setJitterEnabled] = useState<boolean>(true);
  const [packetCounter, setPacketCounter] = useState<number>(142);

  // Automated Protocol Medical Dispatches State
  const [medicalDispatches, setMedicalDispatches] = useState<MedicalDispatchNotification[]>(INITIAL_MEDICAL_DISPATCHES);

  // Sensitivity Settings Config
  const [kalmanConfig, setKalmanConfig] = useState<KalmanSensitivityConfig>(DEFAULT_KALMAN_CONFIG);

  // Modals & Drawers
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAnomalyAuditModalOpen, setIsAnomalyAuditModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isZoneBuilderOpen, setIsZoneBuilderOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceAlertSettings>(DEFAULT_VOICE_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Full Anomaly Audit Log Records (Historical timestamp, confidence score, corrective action)
  const anomalyAuditRecords: AnomalyAuditRecord[] = useMemo(() => {
    return compileFullAnomalyAuditLog(activeAlerts, medicalDispatches);
  }, [activeAlerts, medicalDispatches]);

  useEffect(() => {
    const unsub = voiceAlertService.subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  const handleSpeakAlert = (alert: ActiveAnomalyAlert) => {
    voiceAlertService.speakAlert(alert, voiceSettings);
  };

  const handleStopSpeaking = () => {
    voiceAlertService.cancelSpeech();
  };

  // Client-Side Executive PDF Export State
  const [isDirectPdfExporting, setIsDirectPdfExporting] = useState<boolean>(false);
  const [directPdfStatus, setDirectPdfStatus] = useState<string>('');

  // 30-Day Anomaly Trend Frequency Intelligence State
  const [anomalyTrendZoneId, setAnomalyTrendZoneId] = useState<string>('ALL');
  const [isExportingAuditReport, setIsExportingAuditReport] = useState<boolean>(false);
  const [isViewAuditMenuOpen, setIsViewAuditMenuOpen] = useState<boolean>(false);

  const anomalyTrend30d = useMemo(() => {
    return generate30DayAnomalyTrendWithProjection(zones, anomalyTrendZoneId);
  }, [zones, anomalyTrendZoneId]);

  const anomalyTrendSummary = useMemo(() => {
    return computeTrendSummary(anomalyTrend30d);
  }, [anomalyTrend30d]);

  // Real-Time Notification Toast System State
  const [activeToasts, setActiveToasts] = useState<ThresholdBreachToast[]>([]);
  const [toastSoundEnabled, setToastSoundEnabled] = useState<boolean>(true);
  const [criticalAnomalyToasts, setCriticalAnomalyToasts] = useState<CriticalAnomalyToastData[]>([]);
  const lastCriticalToastTimestampsRef = useRef<Record<string, number>>({});

  const handleDismissCriticalToast = useCallback((id: string) => {
    setCriticalAnomalyToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAcknowledgeCriticalToast = useCallback((id: string) => {
    setCriticalAnomalyToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, acknowledged: true } : t))
    );
    setProtocolActiveNotice('Critical anomaly notification acknowledged by safety supervisor.');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, []);

  const handleDispatchActionForCriticalToast = useCallback((toast: CriticalAnomalyToastData) => {
    const newDispatch: MedicalDispatchNotification = {
      id: `DSP-${Date.now().toString().slice(-4)}-CRIT`,
      alertId: toast.anomalyId || toast.id,
      zone: toast.zoneName,
      severity: 'CRITICAL',
      recipientRole: 'On-Site Rapid Cooling Evacuation Team',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 911-CRIT',
      messagePayload: `CRITICAL ANOMALY EVACUATION [${toast.department}]: ${toast.anomalyMetric} detected with ${toast.confidenceLevelFormatted} confidence. Directive: ${toast.recommendedAction}`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newDispatch, ...prev]);
    handleAcknowledgeCriticalToast(toast.id);
    setProtocolActiveNotice(
      `Priority Medical dispatch staged for critical anomaly in ${toast.department} (${toast.zoneName}) at ${toast.confidenceLevelFormatted} confidence.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 6000);
  }, [handleAcknowledgeCriticalToast]);

  const handleInspectCriticalToastInChart = useCallback((zoneId: string) => {
    setAnomalyTrendZoneId(zoneId);
    const el = document.getElementById('anomaly-trend-30d-card');
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const triggerCriticalAnomalyNotification = useCallback(
    (params: {
      department?: string;
      confidenceLevel: number;
      anomalyId?: string;
      workerPseudonym?: string;
      locationZone?: string;
      zoneId?: string;
      anomalyMetric?: string;
      measuredValue?: string;
      thresholdLimit?: string;
      reconstructionMse?: number;
      recommendedAction?: string;
      privacyNotice?: string;
      force?: boolean;
    }) => {
      const now = Date.now();
      const zoneKey = params.locationZone || 'default';
      const lastTrigger = lastCriticalToastTimestampsRef.current[zoneKey] || 0;
      if (!params.force && now - lastTrigger < 8000) return; // 8-second debounce per zone
      lastCriticalToastTimestampsRef.current[zoneKey] = now;

      const confScore = params.confidenceLevel > 1 ? params.confidenceLevel / 100 : params.confidenceLevel;
      const confFormatted = `${(confScore * 100).toFixed(1)}%`;

      // Map zone/location to department
      let dept = params.department;
      if (!dept) {
        const loc = (params.locationZone || '').toLowerCase();
        if (loc.includes('construction') || loc.includes('sector-4')) {
          dept = 'Civil & Structural Construction';
        } else if (loc.includes('tunnel') || loc.includes('subgrade') || loc.includes('mining')) {
          dept = 'Underground Mining & Tunneling';
        } else if (loc.includes('chemical') || loc.includes('refinement')) {
          dept = 'Heavy Chemical Refinement';
        } else if (loc.includes('warehouse') || loc.includes('logistics')) {
          dept = 'Warehouse Logistics & Supply';
        } else if (loc.includes('smelting') || loc.includes('foundry')) {
          dept = 'Smelting & Metal Fabrication';
        } else if (loc.includes('assembly') || loc.includes('manufacturing')) {
          dept = 'Advanced Manufacturing Line';
        } else {
          dept = 'Industrial Operations Division';
        }
      }

      const toastId = `CRIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timeFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const newToast: CriticalAnomalyToastData = {
        id: toastId,
        anomalyId: params.anomalyId || `ALR-${Math.floor(1000 + Math.random() * 9000)}-CR`,
        timestamp: new Date().toISOString(),
        timeFormatted,
        department: dept,
        zoneId: params.zoneId || params.locationZone || 'Outdoor-Construction-Sector-4',
        zoneName: params.locationZone || 'Outdoor-Construction-Sector-4',
        confidenceLevel: confScore,
        confidenceLevelFormatted: confFormatted,
        reconstructionMse: params.reconstructionMse ?? 0.385,
        anomalyMetric: params.anomalyMetric || 'Multi-Signal Cumulative Stress Spike',
        measuredValue: params.measuredValue || 'Heart Rate 138 BPM, Skin 38.6°C',
        thresholdLimit: params.thresholdLimit || 'HR 115 BPM, Skin 37.8°C',
        recommendedAction:
          params.recommendedAction ||
          'Immediate shaded cooling extraction; stage medical dispatch liaison.',
        workerPseudonym: params.workerPseudonym || `W-${Math.floor(1000 + Math.random() * 9000)}`,
        cohortCount: 18,
        privacyNotice: params.privacyNotice || 'k-Anonymity Verified (N >= 12) & ε=0.5 Differential Privacy',
        createdAt: now,
        autoDismissMs: 12000,
        acknowledged: false
      };

      setCriticalAnomalyToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (toastSoundEnabled) {
        voiceAlertService.playAlertChime();
      }
    },
    [toastSoundEnabled]
  );

  // Custom Anomaly Detection Thresholds & Sensitivity State (Visualized on Trend Chart)
  const [dailyFrequencyThreshold, setDailyFrequencyThreshold] = useState<number>(5);
  const [criticalFrequencyThreshold, setCriticalFrequencyThreshold] = useState<number>(3);
  const [proactiveRiskThreshold, setProactiveRiskThreshold] = useState<number>(5.5);
  const [sensitivityLevel, setSensitivityLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM'>('MEDIUM');

  // Peak 7-day moving average projection across the projected forecast window
  const peakForecastedSma = useMemo(() => {
    const projectedDays = anomalyTrend30d.filter((d) => d.isProjected && d.projectedTrend != null);
    if (projectedDays.length > 0) {
      const maxVal = Math.max(...projectedDays.map((d) => d.projectedTrend || 0));
      return Number(maxVal.toFixed(1));
    }
    return 6.8;
  }, [anomalyTrend30d]);

  // Pre-emptive notification trigger if 7-day moving average projection exceeds safe levels before a critical anomaly occurs
  const triggerPreemptiveProactiveAlert = useCallback(
    (customSma?: number, customThreshold?: number) => {
      const sma = customSma ?? peakForecastedSma;
      const safeLimit = customThreshold ?? proactiveRiskThreshold;
      const delta = (sma - safeLimit).toFixed(1);
      const activeZone = zones.find((z) => z.id === selectedZone) || zones[0];

      // Trigger high-priority pre-emptive toast notification
      const preemptiveToast: ThresholdBreachToast = {
        id: `PREEMPTIVE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        signalKey: 'anomalyEngine',
        signalName: 'Pre-Emptive Proactive Risk Threshold Exceeded',
        measuredValue: sma,
        measuredFormatted: `${sma} events/day (7D Moving Avg Projection)`,
        thresholdLimit: safeLimit,
        thresholdFormatted: `${safeLimit} events/day (Proactive Safe Limit)`,
        unit: 'events/day',
        deltaFormatted: `+${delta} events/day above safe limit`,
        severity: 'HIGH',
        zoneId: activeZone.id,
        zoneName: activeZone.name,
        workerCount: activeZone.count || 24,
        recommendedAction: `PRE-EMPTIVE ACTION: Forecasted 7-day moving average (${sma}/day) exceeds proactive safe limit (${safeLimit}/day) prior to acute incident. Distribute cooling stations, schedule staggered rotations, and inspect microclimate controls.`,
        acknowledged: false,
        createdAt: Date.now(),
        autoDismissMs: 14000
      };

      setActiveToasts((prev) => [preemptiveToast, ...prev].slice(0, 8));

      setProtocolActiveNotice(
        `PRE-EMPTIVE PROACTIVE NOTIFICATION: 7-day moving average projection (${sma}/day) exceeds safe level (${safeLimit}/day) in ${activeZone.name}. Pre-emptive cooling & rotation protocols activated.`
      );
      setTimeout(() => setProtocolActiveNotice(null), 8000);

      if (toastSoundEnabled) {
        voiceAlertService.playAlertChime();
      }
    },
    [peakForecastedSma, proactiveRiskThreshold, selectedZone, zones, toastSoundEnabled]
  );

  const lastPreemptiveTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (peakForecastedSma > proactiveRiskThreshold) {
      const now = Date.now();
      if (now - lastPreemptiveTriggerRef.current > 30000) {
        lastPreemptiveTriggerRef.current = now;
        triggerPreemptiveProactiveAlert(peakForecastedSma, proactiveRiskThreshold);
      }
    }
  }, [peakForecastedSma, proactiveRiskThreshold, triggerPreemptiveProactiveAlert]);

  // Custom Health Signal Notification Thresholds Configuration State
  const [healthThresholds, setHealthThresholds] = useState<HealthSignalNotificationThresholds>(DEFAULT_HEALTH_THRESHOLDS);
  const [isHealthThresholdsModalOpen, setIsHealthThresholdsModalOpen] = useState<boolean>(false);
  const [isolatedHealthSignal, setIsolatedHealthSignal] = useState<string | null>(null);

  const [activeCorrelationPair, setActiveCorrelationPair] = useState<{ signalA: string; signalB: string } | null>(null);
  const lastBreachTimestampsRef = useRef<Record<string, number>>({});

  const checkReadingForThresholdBreaches = useCallback(
    (pt: TelemetryDataPoint, zone: FacilityZone, force = false) => {
      const now = Date.now();
      const timeFormatted = new Date(pt.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const newToasts: ThresholdBreachToast[] = [];

      const evaluateSignal = (
        signalKey: ThresholdBreachToast['signalKey'],
        signalName: string,
        measuredVal: number,
        limitVal: number | undefined,
        unit: string,
        isBreached: boolean,
        severity: 'CRITICAL' | 'HIGH' | 'WARNING',
        deltaStr: string,
        recommendedAction: string,
        autoDismissMs: number
      ) => {
        if (!isBreached || limitVal === undefined) return;
        const cooldownKey = `${zone.id}-${signalKey}`;
        const lastTriggered = lastBreachTimestampsRef.current[cooldownKey] || 0;
        if (!force && now - lastTriggered < 15000) return; // 15-second cooldown per signal per zone

        lastBreachTimestampsRef.current[cooldownKey] = now;

        newToasts.push({
          id: `TOAST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: pt.timestamp,
          timeFormatted,
          signalKey,
          signalName,
          measuredValue: measuredVal,
          measuredFormatted: `${measuredVal.toFixed(1)} ${unit}`,
          thresholdLimit: limitVal,
          thresholdFormatted: `${limitVal.toFixed(1)} ${unit}`,
          unit,
          deltaFormatted: deltaStr,
          severity,
          zoneId: zone.id,
          zoneName: zone.name,
          workerCount: zone.count,
          recommendedAction,
          acknowledged: false,
          createdAt: now,
          autoDismissMs
        });
      };

      // 1. Heart Rate
      const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
      const hrLimit = healthThresholds.maxHeartRateBpm ?? 115;
      if (hr > hrLimit) {
        const delta = hr - hrLimit;
        const sev: 'CRITICAL' | 'HIGH' = delta >= 15 ? 'CRITICAL' : 'HIGH';
        evaluateSignal(
          'heartRate',
          'Heart Rate (Pulse) Exceeded',
          hr,
          hrLimit,
          'BPM',
          true,
          sev,
          `+${delta} BPM (+${((delta / hrLimit) * 100).toFixed(0)}%)`,
          'Direct worker cohort to cooling shaded shelter; hydrate immediately with electrolyte solution.',
          sev === 'CRITICAL' ? 12000 : 8000
        );
      }

      // 2. Ambient Heat
      const amb = pt.ambient_temp_c;
      const ambLimit = healthThresholds.maxAmbientHeatC;
      if (amb > ambLimit) {
        const delta = Number((amb - ambLimit).toFixed(1));
        const sev: 'CRITICAL' | 'HIGH' = delta >= 3.0 ? 'CRITICAL' : 'HIGH';
        evaluateSignal(
          'ambientTemp',
          'Ambient Temperature Ceiling Exceeded',
          amb,
          ambLimit,
          '°C',
          true,
          sev,
          `+${delta}°C`,
          'Activate industrial misting fans and initiate 15-minute rotation work-rest schedule.',
          8000
        );
      }

      // 3. Worker HRV Drop
      const hrv = pt.smoothed_hrv;
      const hrvFloor = healthThresholds.minHrvMs;
      if (hrv < hrvFloor) {
        const delta = Number((hrvFloor - hrv).toFixed(1));
        const sev: 'CRITICAL' | 'HIGH' = hrv <= 30 ? 'CRITICAL' : 'HIGH';
        evaluateSignal(
          'hrv',
          'Autonomic HRV Collapse (Vagal Depletion)',
          hrv,
          hrvFloor,
          'ms',
          true,
          sev,
          `-${delta} ms (-${((delta / hrvFloor) * 100).toFixed(0)}%)`,
          'Critical autonomic strain detected. Direct worker to immediate medical rest break.',
          sev === 'CRITICAL' ? 14000 : 9000
        );
      }

      // 4. Skin Temperature
      const skin = pt.skin_temp_c;
      const skinLimit = healthThresholds.maxSkinTempC;
      if (skin > skinLimit) {
        const delta = Number((skin - skinLimit).toFixed(2));
        const sev: 'CRITICAL' | 'HIGH' = delta >= 0.8 ? 'CRITICAL' : 'HIGH';
        evaluateSignal(
          'skinTemp',
          'Worker Surface Skin Temp Exceeded',
          skin,
          skinLimit,
          '°C',
          true,
          sev,
          `+${delta}°C`,
          'Immerse forearms in cool water bath; check for signs of exertional heat exhaustion.',
          8000
        );
      }

      // 5. Acoustic Noise
      const noise = pt.noise_db ?? pt.raw_noise_db ?? 75;
      const noiseLimit = healthThresholds.maxNoiseDb;
      if (noise > noiseLimit) {
        const delta = Number((noise - noiseLimit).toFixed(1));
        evaluateSignal(
          'noise',
          'Acoustic Noise Overpressure Exceeded',
          noise,
          noiseLimit,
          'dBA',
          true,
          delta >= 10 ? 'HIGH' : 'WARNING',
          `+${delta} dBA`,
          'Mandate secondary hearing protection; inspect heavy machinery vibration mounts.',
          7000
        );
      }

      // 6. Composite Risk Score
      const risk = pt.risk_score;
      const riskCutoff = healthThresholds.riskScoreCutoffPct;
      if (risk > riskCutoff) {
        const delta = Number((risk - riskCutoff).toFixed(1));
        evaluateSignal(
          'riskScore',
          'Multidimensional Risk Cutoff Exceeded',
          risk,
          riskCutoff,
          '%',
          true,
          risk >= 85 ? 'CRITICAL' : 'HIGH',
          `+${delta}%`,
          'LSTM Autoencoder flagged high multi-signal reconstruction deviation. Safety officer review required.',
          10000
        );
      }

      if (newToasts.length > 0) {
        setActiveToasts((prev) => [...newToasts, ...prev].slice(0, 8));
        if (toastSoundEnabled) {
          voiceAlertService.playAlertChime();
        }
      }
    },
    [healthThresholds, toastSoundEnabled]
  );

  const triggerAnomalyToast = useCallback(
    (
      alert: {
        title: string;
        metric: string;
        measuredVal: number;
        measuredFormatted: string;
        limitVal: number;
        limitFormatted: string;
        deltaFormatted: string;
        severity: 'CRITICAL' | 'HIGH' | 'WARNING';
        action: string;
        zoneName: string;
        zoneId: string;
        cohortCount: number;
        signalKey?: ToastSignalKey;
        privacyStatus?: string;
      },
      force = false
    ) => {
      const now = Date.now();
      const cooldownKey = `anomaly-${alert.zoneId}-${alert.metric}`;
      const lastTriggered = lastBreachTimestampsRef.current[cooldownKey] || 0;
      if (!force && now - lastTriggered < 10000) return; // 10-second cooldown
      lastBreachTimestampsRef.current[cooldownKey] = now;

      const timeFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const newToast: ThresholdBreachToast = {
        id: `TOAST-ANOMALY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        timeFormatted,
        signalKey: alert.signalKey || 'anomalyEngine',
        signalName: alert.title,
        measuredValue: alert.measuredVal,
        measuredFormatted: alert.measuredFormatted,
        thresholdLimit: alert.limitVal,
        thresholdFormatted: alert.limitFormatted,
        unit: '%',
        deltaFormatted: alert.deltaFormatted,
        severity: alert.severity,
        zoneId: alert.zoneId,
        zoneName: alert.zoneName,
        workerCount: alert.cohortCount,
        recommendedAction: alert.action,
        acknowledged: false,
        createdAt: now,
        autoDismissMs: alert.severity === 'CRITICAL' ? 14000 : 9000,
        privacyComplianceNotice: alert.privacyStatus || 'k-Anonymity Verified (N >= 12)'
      };

      setActiveToasts((prev) => [newToast, ...prev].slice(0, 8));
      if (toastSoundEnabled) {
        voiceAlertService.playAlertChime();
      }
    },
    [toastSoundEnabled]
  );

  // Auto-dismiss countdown for non-acknowledged toasts
  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveToasts((prev) =>
        prev.filter((t) => {
          if (t.acknowledged) return false;
          return now - t.createdAt < t.autoDismissMs;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [activeToasts.length]);

  const handleDismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAcknowledgeToast = (id: string) => {
    setActiveToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, acknowledged: true } : t))
    );
    setProtocolActiveNotice('Sensor threshold breach notification acknowledged by safety manager.');
  };

  const handleClearAllToasts = () => {
    setActiveToasts([]);
  };

  const handleInspectSignalInChart = (signalKey: string) => {
    if (signalKey === 'anomalyEngine') {
      const el = document.getElementById('active-anomalies-widget') || document.getElementById('historical-health-chart-card');
      el?.scrollIntoView({ behavior: 'smooth' });
      setIsolatedHealthSignal('riskScore');
      return;
    }

    const el = document.getElementById('historical-health-chart-card');
    el?.scrollIntoView({ behavior: 'smooth' });

    // Set correlation overlay pairing
    if (signalKey === 'ambientTemp' || signalKey === 'noiseDb' || signalKey === 'twl' || signalKey === 'aqi') {
      setActiveCorrelationPair({ signalA: signalKey, signalB: 'heartRate' });
    } else {
      setActiveCorrelationPair({
        signalA: 'ambientTemp',
        signalB: signalKey === 'hrv' ? 'smoothedHrv' : signalKey
      });
    }
    setIsolatedHealthSignal(signalKey);
  };

  const handleDispatchActionForToast = (toast: ThresholdBreachToast) => {
    const isThermal = toast.signalKey === 'ambientTemp' || toast.signalKey === 'skinTemp';
    const isNoise = toast.signalKey === 'noise';

    const newDispatch: MedicalDispatchNotification = {
      id: `DSP-${Date.now().toString().slice(-4)}-TOAST`,
      alertId: toast.id,
      zone: toast.zoneName,
      severity: toast.severity === 'WARNING' ? 'MODERATE' : toast.severity,
      recipientRole: isThermal
        ? 'On-Site Rapid Cooling Evacuation Team'
        : isNoise
        ? 'Acoustic Hearing Protection Officer'
        : 'On-Site Medical Triage Lead',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 911-TOAST',
      messagePayload: `THRESHOLD BREACH NOTIFICATION: ${toast.signalName} measured ${toast.measuredFormatted} (exceeds ${toast.thresholdFormatted}). Directive: ${toast.recommendedAction}`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };

    setMedicalDispatches((prev) => [newDispatch, ...prev]);
    handleAcknowledgeToast(toast.id);
    setProtocolActiveNotice(
      `Medical dispatch staged for ${toast.signalName} breach in ${toast.zoneName}. Priority notification queued.`
    );
  };

  const handleSimulateBreachToast = () => {
    const dummyBreachPoint: TelemetryDataPoint = {
      timestamp: new Date().toISOString(),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heart_rate_bpm: (healthThresholds.maxHeartRateBpm ?? 115) + 12,
      raw_heart_rate_bpm: (healthThresholds.maxHeartRateBpm ?? 115) + 16,
      ambient_temp_c: Number((healthThresholds.maxAmbientHeatC + 2.4).toFixed(1)),
      noise_db: healthThresholds.maxNoiseDb + 6.5,
      raw_noise_db: healthThresholds.maxNoiseDb + 8.0,
      smoothed_noise_db: healthThresholds.maxNoiseDb + 6.5,
      twl_index: 85,
      aqi: 68,
      hrv_drop_pct: 38.5,
      raw_hrv: Math.max(18, healthThresholds.minHrvMs - 9.0),
      smoothed_hrv: Math.max(20, healthThresholds.minHrvMs - 7.5),
      skin_temp_c: Number((healthThresholds.maxSkinTempC + 0.65).toFixed(2)),
      raw_skin_temp: Number((healthThresholds.maxSkinTempC + 0.85).toFixed(2)),
      smoothed_skin_temp: Number((healthThresholds.maxSkinTempC + 0.65).toFixed(2)),
      sick_leave_rate_deviation: 0.08,
      risk_score: Math.min(95, healthThresholds.riskScoreCutoffPct + 14),
      is_anomaly: true
    };
    checkReadingForThresholdBreaches(dummyBreachPoint, activeZoneObj, true);

    // Also trigger Prognosticator Engine Anomaly Alert Toast
    triggerAnomalyToast(
      {
        title: 'Prognosticator Engine: Acute Multidimensional Anomaly',
        metric: 'LSTM Reconstruction Deviation Vector',
        measuredVal: Math.min(95, healthThresholds.riskScoreCutoffPct + 14),
        measuredFormatted: `${Math.min(95, healthThresholds.riskScoreCutoffPct + 14)}% Composite Risk`,
        limitVal: healthThresholds.riskScoreCutoffPct,
        limitFormatted: `${healthThresholds.riskScoreCutoffPct}% Cutoff`,
        deltaFormatted: `+14.0% Deviation`,
        severity: 'CRITICAL',
        action: 'Immediate supervisory triage: activate misting cooling tents and mandate shaded hydration rest pause.',
        zoneName: activeZoneObj.name,
        zoneId: activeZoneObj.id,
        cohortCount: activeZoneObj.count,
        signalKey: 'anomalyEngine',
        privacyStatus: 'k-Anonymity Verified (N >= 12)'
      },
      true
    );

    setProtocolActiveNotice('Simulated live sensor threshold breach event and Prognosticator Engine anomaly triggered for active zone.');
  };

  const handleSaveHealthThresholds = (
    updatedThresholds: HealthSignalNotificationThresholds,
    justification: string
  ) => {
    setHealthThresholds(updatedThresholds);
    if (updatedThresholds.dailyAnomalyFrequencyThreshold !== undefined) {
      setDailyFrequencyThreshold(updatedThresholds.dailyAnomalyFrequencyThreshold);
    }
    if (updatedThresholds.criticalDailyFrequencyThreshold !== undefined) {
      setCriticalFrequencyThreshold(updatedThresholds.criticalDailyFrequencyThreshold);
    }
    if (updatedThresholds.sensitivityLevel) {
      setSensitivityLevel(updatedThresholds.sensitivityLevel);
    }
    setKalmanConfig((prev) => ({
      ...prev,
      criticalCutoffPct: updatedThresholds.riskScoreCutoffPct
    }));

    const auditEntry: SystemAuditLogEntry = {
      id: `AUD-HT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Workforce Health Signals Rule Engine',
      parameter: 'Custom Health Signal Notification Thresholds',
      previousValue: `HRV Floor: ${healthThresholds.minHrvMs}ms, Max Drop: ${healthThresholds.maxHrvDropPct}%, Skin: ${healthThresholds.maxSkinTempC}°C, Noise: ${healthThresholds.maxNoiseDb}dB, Risk: ${healthThresholds.riskScoreCutoffPct}%`,
      newValue: `HRV Floor: ${updatedThresholds.minHrvMs}ms, Max Drop: ${updatedThresholds.maxHrvDropPct}%, Skin: ${updatedThresholds.maxSkinTempC}°C, Noise: ${updatedThresholds.maxNoiseDb}dB, Risk: ${updatedThresholds.riskScoreCutoffPct}% (Scope: ${updatedThresholds.applicableZoneId})`,
      justification: justification || 'Custom workforce health signal thresholds updated.',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Custom Health Signal Thresholds applied: HRV Floor ${updatedThresholds.minHrvMs}ms, Max Drop ${updatedThresholds.maxHrvDropPct}%, Skin Temp ${updatedThresholds.maxSkinTempC}°C, Noise Limit ${updatedThresholds.maxNoiseDb}dBA, Risk Cutoff ${updatedThresholds.riskScoreCutoffPct}%.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 6000);
  };

  const handleExportWorkforceCsv = () => {
    try {
      const result = downloadAnomalyReportCsv({
        data: telemetryStream,
        thresholds: healthThresholds,
        zone: activeZoneObj,
        activeAlerts
      });
      setProtocolActiveNotice(
        `Anonymized workforce health compliance report exported successfully as CSV (${result.recordCount} samples). File: ${result.filename}`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      setProtocolActiveNotice('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDownloadReport = async (format: 'JSON' | 'CSV' | 'PDF') => {
    try {
      if (format === 'PDF') {
        await handleDirectPdfExport();
        setIsDownloadMenuOpen(false);
        return;
      }

      if (format === 'JSON') {
        const result = downloadAnomalyReportJson({
          data: telemetryStream,
          thresholds: healthThresholds,
          zone: activeZoneObj,
          activeAlerts
        });
        setProtocolActiveNotice(
          `24-Hour Anomaly Trend & Thresholds report generated and downloaded as JSON (${Math.round(result.sizeBytes / 1024)} KB): ${result.filename}`
        );
      } else {
        const result = downloadAnomalyReportCsv({
          data: telemetryStream,
          thresholds: healthThresholds,
          zone: activeZoneObj,
          activeAlerts
        });
        setProtocolActiveNotice(
          `Anonymized Compliance CSV Report generated and downloaded (${result.recordCount} records): ${result.filename}`
        );
      }
      setTimeout(() => setProtocolActiveNotice(null), 6000);
      setIsDownloadMenuOpen(false);
    } catch (err: any) {
      console.error('Download report failed:', err);
      setProtocolActiveNotice(`Failed to generate report: ${err?.message || 'Unknown error'}`);
    }
  };

  // Export Current View Anomaly Report as Simulated PDF/CSV with System Audit Logging
  const handleExportViewAuditReport = async (format: 'PDF' | 'CSV') => {
    setIsExportingAuditReport(true);
    try {
      let filename = '';
      if (format === 'PDF') {
        const res = await exportSimulatedAnomalyReportPdf({
          data: anomalyTrend30d,
          summary: anomalyTrendSummary,
          currentZone: activeZoneObj,
          activeAlerts,
          thresholds: healthThresholds,
          userName: 'Alex Mercer (EHS Lead Supervisor)'
        });
        filename = res.filename;
      } else {
        const res = exportSimulatedAnomalyReportCsv({
          data: anomalyTrend30d,
          summary: anomalyTrendSummary,
          currentZone: activeZoneObj,
          activeAlerts,
          thresholds: healthThresholds,
          userName: 'Alex Mercer (EHS Lead Supervisor)'
        });
        filename = res.filename;
      }

      // Record immutable system audit log entry
      const auditEntry: SystemAuditLogEntry = {
        id: `AUD-EXP-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: '30-Day Anomaly Trend Intelligence',
        parameter: `Anomaly View Report Export (${format})`,
        previousValue: 'N/A (Ad-hoc Snapshot)',
        newValue: `Exported ${format} audit document: ${filename}`,
        justification: `Exported current view anomaly report (${format}) with 30-day trend frequency & active alerts for compliance audit logging.`,
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      // Record audit event trail
      const auditEvent: AuditEvent = {
        id: `AUD-EVT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        eventType: 'EXPORT_AUDIT',
        zone: activeZoneObj.name,
        cohortCount: activeZoneObj.count,
        riskTier: activeZoneObj.status === 'CRITICAL' ? 'CRITICAL_RISK' : 'STABLE',
        privacyEnforced: 'k-Anonymity Verified (N>=12)',
        actionTaken: `Simulated ${format} anomaly view report exported for audit logging: ${filename}`
      };
      setAuditEvents((prev) => [auditEvent, ...prev]);

      setProtocolActiveNotice(
        `Current view anomaly report exported as ${format} (${filename}) and registered in System Audit Trail with immutable verification.`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
      setIsViewAuditMenuOpen(false);
    } catch (err: any) {
      console.error('Export view audit report failed:', err);
      setProtocolActiveNotice(`Failed to export report: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExportingAuditReport(false);
    }
  };

  // 2D Floor Plan Sensor Stream Toggles State
  const [streamToggles, setStreamToggles] = useState<SensorStreamToggles>({
    ambientTemp: true,
    noiseDb: true,
    hrvDrop: true,
    skinTemp: true,
    twlHeatStrain: true,
    aqiAirQuality: true,
    riskScore: true
  });

  const handleToggleStream = (key: keyof SensorStreamToggles) => {
    setStreamToggles((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSetAllStreams = (enable: boolean) => {
    setStreamToggles({
      ambientTemp: enable,
      noiseDb: enable,
      hrvDrop: enable,
      skinTemp: enable,
      twlHeatStrain: enable,
      aqiAirQuality: enable,
      riskScore: enable
    });
  };

  // System Audit Log State (Manual changes to thresholds & zone configs)
  const [systemAuditLogs, setSystemAuditLogs] = useState<SystemAuditLogEntry[]>(INITIAL_SYSTEM_AUDIT_LOGS);

  const handleAddManualAuditLog = (newEntry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>) => {
    const entry: SystemAuditLogEntry = {
      ...newEntry,
      id: `AUD-MAN-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setSystemAuditLogs((prev) => [entry, ...prev]);
    setProtocolActiveNotice(
      `Recorded manual parameter override by ${newEntry.userId} for "${newEntry.parameter}".`
    );
  };

  // Action status banner
  const [protocolActiveNotice, setProtocolActiveNotice] = useState<string | null>(null);

  const [telemetryAlert, setTelemetryAlert] = useState<AnomalyPredictionResult>({
    status: 'success',
    worker_id: 'W-9921',
    location_zone: 'Outdoor-Construction-Sector-4',
    risk_tier: 'CRITICAL_RISK',
    risk_probability: 0.892,
    reconstruction_mse: 0.342,
    explainable_attributions: {
      'Heart Rate Variability (HRV) Drop': 0.42,
      'Skin Temperature Elevation': 0.18,
      'Ambient Heat Index Load': 0.31,
      'Cumulative Sleep Deficit': 0.09
    },
    recommended_operational_action:
      'Immediate extraction: Direct worker to shaded cooling zone and dispatch medical liaison.',
    privacy_compliance:
      'Enforced: k-Anonymity & Small-Cell Suppression Applied (N >= 12, Active Count: 18)'
  });

  // Audit events trail
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'AUD-0091-AZ',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(),
      eventType: 'ALERT_DISPATCH',
      zone: 'Outdoor-Construction-Sector-4',
      cohortCount: 18,
      riskTier: 'CRITICAL_RISK',
      privacyEnforced: 'k-Anonymity Verified (N=18 >= 12)',
      actionTaken: 'High thermal load alert dispatched to zone lead'
    },
    {
      id: 'AUD-0090-SP',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      eventType: 'PRIVACY_SUPPRESSION',
      zone: 'Subgrade-Tunnel-Conduit-7',
      cohortCount: 8,
      riskTier: 'MODERATE_RISK',
      privacyEnforced: 'Cell Suppressed (N=8 < 12)',
      actionTaken: 'Suppressed individual telemetry pursuant to HIPAA/GDPR rules'
    },
    {
      id: 'AUD-0089-CL',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: 'Manufacturing-Assembly-Line-B',
      cohortCount: 42,
      riskTier: 'STABLE',
      privacyEnforced: 'Full Differential Privacy (ε=0.5)',
      actionTaken: 'Kalman filter noise baseline recalibrated'
    }
  ]);

  const activeZoneObj = zones.find((z) => z.id === selectedZone) || zones[0];
  const pendingCriticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const stagedDispatchCount = medicalDispatches.filter((d) => d.status === 'STAGED').length;

  // Sync hyper-local live weather via Open-Meteo API
  const syncLiveWeather = useCallback(async (zone: FacilityZone) => {
    setWeatherLoading(true);
    try {
      const weather = await fetchLiveZoneWeather(zone.latitude, zone.longitude, zone.name);
      setCurrentWeather(weather);

      // Adjust zone heat load if apparent temperature is high
      if (weather.apparentTemperature) {
        setZones((prev) =>
          prev.map((z) =>
            z.id === zone.id
              ? {
                  ...z,
                  temp: `${weather.temperature}°C`,
                  heatIndex: weather.apparentTemperature
                }
              : z
          )
        );
      }
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch live weather on initial mount or when zone changes
  useEffect(() => {
    syncLiveWeather(activeZoneObj);
  }, [activeZoneObj.id, syncLiveWeather]);

  // Streaming IoT Hub Simulator Interval
  useEffect(() => {
    if (!isStreamingActive) return;

    const interval = setInterval(() => {
      setPacketCounter((c) => c + 1);

      // Generate next rolling point with simulated jitter if enabled
      const jitterFactor = jitterEnabled ? (Math.random() - 0.5) * 8.0 : (Math.random() - 0.5) * 1.5;
      const packet = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
      const result = predictWorkforceAnomaly(packet, undefined, kalmanConfig);
      setTelemetryAlert(result);

      // Real-time alert toast notification if Prognosticator Engine detects critical risk anomaly
      if (result.risk_probability >= 0.70 || result.risk_tier === 'CRITICAL_RISK') {
        triggerAnomalyToast({
          title: 'Prognosticator Engine: Critical Risk Anomaly',
          metric: 'LSTM Multidimensional Anomaly Vector',
          measuredVal: Number((result.risk_probability * 100).toFixed(1)),
          measuredFormatted: `${(result.risk_probability * 100).toFixed(1)}% Risk Prob`,
          limitVal: kalmanConfig.criticalCutoffPct,
          limitFormatted: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
          deltaFormatted: `+${((result.risk_probability * 100) - kalmanConfig.criticalCutoffPct).toFixed(1)}%`,
          severity: 'CRITICAL',
          action: result.recommended_operational_action,
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'anomalyEngine',
          privacyStatus: result.privacy_compliance
        });

        triggerCriticalAnomalyNotification({
          confidenceLevel: result.risk_probability,
          locationZone: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          workerPseudonym: result.worker_id,
          anomalyMetric: 'LSTM Multidimensional Stress Vector Spike',
          measuredValue: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}%`,
          thresholdLimit: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
          reconstructionMse: result.reconstruction_mse,
          recommendedAction: result.recommended_operational_action,
          privacyNotice: result.privacy_compliance
        });
      }

      // Advance sliding chart by 1 step
      setTelemetryStream((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const now = new Date();
        const smoothedHrv = Number(Math.max(25, last.smoothed_hrv + (Math.random() - 0.5) * 1.5).toFixed(1));
        const rawHrv = Number(Math.max(20, smoothedHrv + jitterFactor * 1.5).toFixed(1));
        const hr = Math.round(72 + (68 - smoothedHrv) * 1.25);
        const newPoint: TelemetryDataPoint = {
          ...last,
          timestamp: now.toISOString(),
          timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          heart_rate_bpm: hr,
          raw_heart_rate_bpm: Math.round(72 + (68 - rawHrv) * 1.25),
          ambient_temp_c: Number((last.ambient_temp_c + (Math.random() - 0.48) * 0.4).toFixed(1)),
          raw_noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor).toFixed(1)),
          noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor * 0.25).toFixed(1)),
          smoothed_noise_db: Number(Math.max(60, (last.noise_db ?? 75) + jitterFactor * 0.25).toFixed(1)),
          smoothed_hrv: smoothedHrv,
          raw_hrv: rawHrv,
          skin_temp_c: Number(((last.skin_temp_c ?? 36.6) + (Math.random() - 0.49) * 0.08).toFixed(2)),
          risk_score: Number((result.risk_probability * 100).toFixed(1))
        };
        // Trigger real-time threshold check on streaming telemetry point
        checkReadingForThresholdBreaches(newPoint, activeZoneObj);
        return [...prev.slice(1), newPoint];
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isStreamingActive, jitterEnabled, activeZoneObj, kalmanConfig, checkReadingForThresholdBreaches, triggerAnomalyToast]);

  // Handle Burst Event Triggers
  const handleTriggerBurst = (type: 'HEATWAVE' | 'NOISE' | 'CARDIAC' | 'DROPOUT') => {
    if (type === 'HEATWAVE') {
      const burstPacket: TelemetryPacket = {
        worker_id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
        location_zone: activeZoneObj.name,
        timestamp: new Date().toISOString(),
        hrv_series: [42, 38, 35, 33, 31, 30, 28],
        skin_temp_series: [37.8, 38.1, 38.3, 38.6, 38.8],
        heat_index: 47.5,
        sleep_deficit_hours: 4.0,
        cohort_size: activeZoneObj.count,
        twl_index: 82.0,
        ambient_temp_c: 46.5,
        aqi: 185
      };
      const res = predictWorkforceAnomaly(burstPacket, undefined, kalmanConfig);
      setTelemetryAlert(res);

      // Trigger Real-Time Toast Alert for Prognosticator Heatwave Anomaly
      triggerAnomalyToast(
        {
          title: 'Flash Heatwave Exceedance Burst',
          metric: 'Extreme Wet-Bulb Heat Index',
          measuredVal: 46.5,
          measuredFormatted: '46.5°C Ambient (47.5°C Heat Index)',
          limitVal: healthThresholds.maxAmbientHeatC,
          limitFormatted: `${healthThresholds.maxAmbientHeatC}°C Limit`,
          deltaFormatted: `+${(46.5 - healthThresholds.maxAmbientHeatC).toFixed(1)}°C`,
          severity: 'CRITICAL',
          action: 'Immediate shaded extraction and automated misting cooling vests deployed.',
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'ambientTemp',
          privacyStatus: 'k-Anonymity Verified (N >= 12)'
        },
        true
      );

      // Auto-stage medical cooling dispatch
      const newDispatch: MedicalDispatchNotification = {
        id: `AUTO-${Math.floor(1000 + Math.random() * 9000)}-COOL`,
        alertId: `BURST-HEAT-${Math.floor(1000 + Math.random() * 9000)}`,
        zone: activeZoneObj.name,
        severity: 'CRITICAL',
        recipientRole: 'On-Site Rapid Cooling Evacuation Team',
        contactMethod: 'DUAL_CHANNEL',
        recipientPhone: '+1 (555) 911-COOL-2',
        messagePayload: `AUTOMATED EMERGENCY DISPATCH: Flash Heatwave Burst detected at ${activeZoneObj.name} (Ambient: 46.5°C, WBGT Apparent: 47.5°C). Immediate shaded extraction & cooling vests dispatched.`,
        stagedAt: 'Just now',
        status: 'STAGED'
      };
      setMedicalDispatches((prev) => [newDispatch, ...prev]);

      triggerCriticalAnomalyNotification({
        department: 'Civil & Structural Construction',
        confidenceLevel: 0.962,
        locationZone: activeZoneObj.name,
        zoneId: activeZoneObj.id,
        anomalyMetric: 'Extreme Ambient Heatwave Spike (46.5°C)',
        measuredValue: '46.5°C Ambient (WBGT 47.5°C)',
        thresholdLimit: `${healthThresholds.maxAmbientHeatC}°C Limit`,
        reconstructionMse: 0.442,
        recommendedAction: 'Immediate shaded extraction & automated misting cooling vests deployed.',
        force: true
      });

      setProtocolActiveNotice(
        `BURST TRIGGERED: Flash Heatwave Exceedance (46.5°C). Critical alert active & automated medical dispatch staged in queue.`
      );
    } else if (type === 'NOISE') {
      const burstAlert: ActiveAnomalyAlert = {
        id: `BURST-NOISE-${Math.floor(1000 + Math.random() * 9000)}`,
        worker_id: 'W-6104',
        location_zone: activeZoneObj.name,
        detected_at: 'Just now',
        anomaly_metric: 'Acoustic Machinery Overpressure Blast',
        raw_value: 'Noise: 108.5 dB (OSHA Rupture Threshold)',
        kalman_smoothed_value: 'Kalman Estimate: 102.4 dB',
        severity: 'CRITICAL',
        kalman_status: 'Confirmed Sensor Spike',
        lead_time: 'Immediate Hearing Protection Breach',
        recommended_action: 'Emergency machine shutdown & mandatory high-attenuation PPE verification.',
        acknowledged: false,
        privacy_status: 'k-Anonymity Verified (N >= 12)'
      };
      setActiveAlerts((prev) => [burstAlert, ...prev]);

      // Trigger Real-Time Toast Alert for Acoustic Blast
      triggerAnomalyToast(
        {
          title: 'Acoustic Machinery Overpressure Blast',
          metric: 'OSHA Acoustic Limit Breach',
          measuredVal: 108.5,
          measuredFormatted: '108.5 dBA Blast',
          limitVal: healthThresholds.maxNoiseDb,
          limitFormatted: `${healthThresholds.maxNoiseDb} dBA Limit`,
          deltaFormatted: `+${(108.5 - healthThresholds.maxNoiseDb).toFixed(1)} dBA`,
          severity: 'CRITICAL',
          action: 'Emergency machine shutdown & mandatory high-attenuation PPE verification.',
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'noise',
          privacyStatus: 'k-Anonymity Verified (N >= 12)'
        },
        true
      );

      triggerCriticalAnomalyNotification({
        department: 'Heavy Chemical Refinement',
        confidenceLevel: 0.935,
        locationZone: activeZoneObj.name,
        zoneId: activeZoneObj.id,
        anomalyMetric: 'Acoustic Machinery Overpressure Blast',
        measuredValue: '108.5 dBA Blast',
        thresholdLimit: `${healthThresholds.maxNoiseDb} dBA Limit`,
        reconstructionMse: 0.391,
        recommendedAction: 'Emergency machine shutdown & mandatory high-attenuation PPE verification.',
        force: true
      });

      const newDispatch: MedicalDispatchNotification = {
        id: `AUTO-${Math.floor(1000 + Math.random() * 9000)}-PPE`,
        alertId: burstAlert.id,
        zone: activeZoneObj.name,
        severity: 'HIGH',
        recipientRole: 'Acoustic Audiology PPE Officer',
        contactMethod: 'SMS',
        recipientPhone: '+1 (555) 441-NOISE',
        messagePayload: `ACOUSTIC BLAST DETECTED: 108.5 dB at ${activeZoneObj.name}. Deploy hearing evaluation & acoustic damper inspections.`,
        stagedAt: 'Just now',
        status: 'STAGED'
      };
      setMedicalDispatches((prev) => [newDispatch, ...prev]);

      setProtocolActiveNotice('BURST TRIGGERED: Acoustic Overpressure (108.5 dB). Audiology protocol staged.');
    } else if (type === 'CARDIAC') {
      const burstPacket: TelemetryPacket = {
        worker_id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
        location_zone: activeZoneObj.name,
        timestamp: new Date().toISOString(),
        hrv_series: [29, 28, 27, 26, 26, 25],
        skin_temp_series: [38.2, 38.4, 38.6],
        heat_index: 43.0,
        sleep_deficit_hours: 4.5,
        cohort_size: activeZoneObj.count
      };
      const res = predictWorkforceAnomaly(burstPacket, undefined, kalmanConfig);
      setTelemetryAlert(res);

      // Trigger Real-Time Toast Alert for Cardiac Autonomic Collapse
      triggerAnomalyToast(
        {
          title: 'Autonomic Cardiac Strain Collapse',
          metric: 'HRV Vagal Depletion Spike',
          measuredVal: 26,
          measuredFormatted: '26 ms (-60% HRV)',
          limitVal: healthThresholds.minHrvMs,
          limitFormatted: `${healthThresholds.minHrvMs} ms Floor`,
          deltaFormatted: `-${(healthThresholds.minHrvMs - 26).toFixed(0)} ms Drop`,
          severity: 'CRITICAL',
          action: 'Direct worker to shaded cooling rest tent with vital sign telemetry monitoring.',
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'hrv',
          privacyStatus: 'k-Anonymity Verified (N >= 12)'
        },
        true
      );

      triggerCriticalAnomalyNotification({
        department: 'Civil & Structural Construction',
        confidenceLevel: res.risk_probability,
        locationZone: activeZoneObj.name,
        zoneId: activeZoneObj.id,
        workerPseudonym: burstPacket.worker_id,
        anomalyMetric: 'Autonomic Cardiac Strain Collapse',
        measuredValue: 'HRV 26 ms (-60% Drop), Core Temp 38.6°C',
        thresholdLimit: `${healthThresholds.minHrvMs} ms Floor`,
        reconstructionMse: res.reconstruction_mse,
        recommendedAction: 'Direct worker to shaded cooling rest tent with vital sign telemetry monitoring.',
        force: true
      });

      setProtocolActiveNotice('BURST TRIGGERED: Autonomic Cardiac Collapse (-60% HRV drop to 26ms). Critical extraction flagged.');
    } else if (type === 'DROPOUT') {
      triggerAnomalyToast(
        {
          title: 'Kalman State Imputation Verified',
          metric: 'Sensor Packet Loss Reconstructed',
          measuredVal: 3,
          measuredFormatted: '3 Dropped Packets Imputed',
          limitVal: 0,
          limitFormatted: 'Zero Drop Baseline',
          deltaFormatted: 'Covariance R=0.10',
          severity: 'WARNING',
          action: 'State trajectory maintained by Kalman filter without false alarm interruption.',
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'anomalyEngine',
          privacyStatus: 'Mathematical Imputation (Zero PII Disclosed)'
        },
        true
      );

      setProtocolActiveNotice(
        'BURST TRIGGERED: 3 Sensor Packets Dropped. Kalman State Filter successfully imputed missing state with covariance R=0.10.'
      );
    }
  };

  // Add Custom Zone from Zone Builder
  const handleAddCustomZone = (newZone: FacilityZone) => {
    setZones((prev) => [...prev, newZone]);
    setSelectedZone(newZone.id);
    syncLiveWeather(newZone);

    const newAudit: AuditEvent = {
      id: `ZONE-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: newZone.name,
      cohortCount: newZone.count,
      riskTier: 'STABLE',
      privacyEnforced: newZone.count < 12 ? 'Cell Suppressed (N<12)' : 'k-Anonymity Verified',
      actionTaken: `Supervisors instantiated custom zone "${newZone.name}" with custom HRV=${newZone.customBaselines?.baselineHrv}ms, Noise=${newZone.customBaselines?.noiseLimitDb}dB`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    const zoneAuditLog: SystemAuditLogEntry = {
      id: `AUD-ZN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'ZONE_CONFIG',
      targetModule: `Zone: ${newZone.name}`,
      parameter: 'Custom Baselines & Microclimate Configuration',
      previousValue: 'Unregistered / None',
      newValue: `HRV: ${newZone.customBaselines?.baselineHrv}ms, Noise: ${newZone.customBaselines?.noiseLimitDb}dB, Heat: ${newZone.customBaselines?.heatThresholdC}°C`,
      justification: `Supervisory creation of monitored sector "${newZone.name}" with cohort size N=${newZone.count}`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [zoneAuditLog, ...prev]);

    setProtocolActiveNotice(`Custom Monitoring Zone "${newZone.name}" created and connected to live weather stream.`);
  };

  // Transmit medical dispatch
  const handleTransmitDispatch = (id: string) => {
    setMedicalDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'TRANSMITTED' } : d))
    );
    setProtocolActiveNotice(`Medical dispatch ${id} transmitted via Azure IoT Hub SMS/Radio relay.`);
  };

  const handleTransmitAllDispatches = () => {
    const count = stagedDispatchCount;
    setMedicalDispatches((prev) =>
      prev.map((d) => (d.status === 'STAGED' ? { ...d, status: 'TRANSMITTED' } : d))
    );
    setProtocolActiveNotice(`Transmitted all ${count} staged medical dispatches to on-site liaisons.`);
  };

  const handleAcknowledgeDispatch = (id: string, notes?: string) => {
    setMedicalDispatches((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'ACKNOWLEDGED_BY_TEAM',
              acknowledgedAt: new Date().toLocaleTimeString(),
              responderNotes: notes || 'Medical liaison arrived at zone tent.'
            }
          : d
      )
    );
  };

  const handleStageNewDispatch = (dispatchData: Omit<MedicalDispatchNotification, 'id' | 'stagedAt' | 'status'>) => {
    const newD: MedicalDispatchNotification = {
      ...dispatchData,
      id: `DSP-${Math.floor(1000 + Math.random() * 9000)}-MAN`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newD, ...prev]);
    setProtocolActiveNotice(`Staged new medical dispatch for ${dispatchData.zone} in queue.`);
  };

  // Acknowledge anomaly alert
  const handleAcknowledgeAlert = (id: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  // Dispatch action from active alerts list
  const handleDispatchAction = (alert: ActiveAnomalyAlert) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a))
    );

    const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';

    // Auto-stage dispatch notification
    const staged: MedicalDispatchNotification = {
      id: isPredictive
        ? `MNT-${Math.floor(1000 + Math.random() * 9000)}-ORD`
        : `DSP-${Math.floor(1000 + Math.random() * 9000)}-ALR`,
      alertId: alert.id,
      zone: alert.location_zone,
      severity: alert.severity === 'LOW' ? 'MODERATE' : alert.severity,
      recipientRole: isPredictive
        ? 'Reliability Engineering & Vibration Analysis Crew'
        : 'On-Site Medical Triage Lead',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: isPredictive ? '+1 (555) 832-MAINT' : '+1 (555) 911-COOL-2',
      messagePayload: isPredictive
        ? `PREDICTIVE MAINTENANCE WORK ORDER: ${alert.anomaly_metric} on ${alert.equipment_name || alert.worker_id} (${alert.equipment_id}). Directive: ${alert.recommended_action}`
        : `INTERVENTION DISPATCH: ${alert.anomaly_metric} at ${alert.location_zone}. Directive: ${alert.recommended_action}`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [staged, ...prev]);

    setProtocolActiveNotice(
      isPredictive
        ? `Predictive maintenance work order dispatched for ${alert.equipment_name || alert.id} (${alert.anomaly_metric}). Reliability crew notified via dual-channel SMS.`
        : `Dispatched intervention for ${alert.id} (${alert.anomaly_metric}). Automated SMS notification staged in medical dispatch queue.`
    );
  };

  const handleSaveConfig = (newConfig: KalmanSensitivityConfig) => {
    setKalmanConfig(newConfig);
    const packet = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
    const recalibrated = predictWorkforceAnomaly(packet, undefined, newConfig);
    setTelemetryAlert(recalibrated);

    setProtocolActiveNotice(
      `Kalman Anomaly Sensitivity updated to ${newConfig.preset} (Critical Cutoff: ${newConfig.criticalCutoffPct}%, Q=${newConfig.processVarianceQ}, R=${newConfig.measurementVarianceR.toFixed(2)})`
    );

    const newAudit: AuditEvent = {
      id: `CALIB-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'CALIBRATION',
      zone: activeZoneObj.name,
      cohortCount: activeZoneObj.count,
      riskTier: recalibrated.risk_tier,
      privacyEnforced: 'Differential Privacy Active',
      actionTaken: `Kalman detection threshold recalibrated to ${newConfig.preset} profile`
    };
    setAuditEvents((prev) => [newAudit, ...prev]);

    const thresholdAuditLog: SystemAuditLogEntry = {
      id: `AUD-TH-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Kalman Anomaly Filter Engine',
      parameter: `Sensitivity Preset: ${newConfig.preset} (Critical Cutoff & Noise Parameters)`,
      previousValue: `Preset: ${kalmanConfig.preset} (Cutoff: ${kalmanConfig.criticalCutoffPct}%, Q: ${kalmanConfig.processVarianceQ})`,
      newValue: `Preset: ${newConfig.preset} (Cutoff: ${newConfig.criticalCutoffPct}%, Q: ${newConfig.processVarianceQ}, R: ${newConfig.measurementVarianceR.toFixed(2)})`,
      justification: `Supervisory threshold recalibration to ${newConfig.preset} profile for active sector ${activeZoneObj.name}.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [thresholdAuditLog, ...prev]);

    setTimeout(() => setProtocolActiveNotice(null), 6000);
  };

  // Simulated live refresh trigger
  const handleRefreshStream = () => {
    setLoading(true);
    setTimeout(() => {
      const newPacket = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
      const result = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
      setTelemetryAlert(result);
      const newStream = generateSyntheticStream(24, 15);
      setTelemetryStream(newStream);

      // If high risk detected, dynamically add fresh anomaly into active alerts
      if (result.risk_probability > 0.4 && !result.is_suppressed) {
        const freshAlert: ActiveAnomalyAlert = {
          id: `ALR-${Math.floor(1000 + Math.random() * 9000)}-LIVE`,
          worker_id: result.worker_id,
          location_zone: result.location_zone,
          detected_at: 'Just now',
          anomaly_metric:
            result.risk_probability > 0.75
              ? 'Multi-Signal Cumulative Stress Spike'
              : 'Moderate Physiological Heat Load',
          raw_value: `Jittered Packet: MSE ${result.reconstruction_mse.toFixed(3)}`,
          kalman_smoothed_value: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}%`,
          severity: result.risk_probability > 0.75 ? 'CRITICAL' : 'MODERATE',
          kalman_status: 'Jitter Filtered & Validated',
          lead_time: '3.5h Shift Forecast',
          recommended_action: result.recommended_operational_action,
          acknowledged: false,
          privacy_status: result.privacy_compliance
        };
        setActiveAlerts((prev) => [freshAlert, ...prev.slice(0, 7)]);

        // Trigger real-time anomaly toast notification
        triggerAnomalyToast(
          {
            title: `Prognosticator Engine: ${freshAlert.anomaly_metric}`,
            metric: 'LSTM Anomaly Detection',
            measuredVal: Number((result.risk_probability * 100).toFixed(1)),
            measuredFormatted: `${(result.risk_probability * 100).toFixed(1)}% Risk Prob`,
            limitVal: kalmanConfig.criticalCutoffPct,
            limitFormatted: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
            deltaFormatted: `+${((result.risk_probability * 100) - kalmanConfig.criticalCutoffPct).toFixed(1)}%`,
            severity: freshAlert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            action: freshAlert.recommended_action,
            zoneName: activeZoneObj.name,
            zoneId: activeZoneObj.id,
            cohortCount: activeZoneObj.count,
            signalKey: 'anomalyEngine',
            privacyStatus: freshAlert.privacy_status
          },
          true
        );

        if (freshAlert.severity === 'CRITICAL' || result.risk_probability > 0.70) {
          triggerCriticalAnomalyNotification({
            confidenceLevel: result.risk_probability,
            locationZone: activeZoneObj.name,
            zoneId: activeZoneObj.id,
            workerPseudonym: result.worker_id,
            anomalyMetric: freshAlert.anomaly_metric,
            measuredValue: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}%`,
            thresholdLimit: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
            reconstructionMse: result.reconstruction_mse,
            recommendedAction: freshAlert.recommended_action,
            privacyNotice: freshAlert.privacy_status,
            force: true
          });
        }

        // Synthesize audible voice alert for on-site supervisors
        if (voiceSettings.enabled) {
          voiceAlertService.speakAlert(freshAlert, voiceSettings);
        }
      }

      setLoading(false);
    }, 450);
  };

  const handleTriggerHydrationProtocol = () => {
    setProtocolActiveNotice(
      `Zone Hydration Protocol activated for ${activeZoneObj.name}. Automated sirens, water mist cooling units & medical liaisons dispatched.`
    );
    const newDispatch: MedicalDispatchNotification = {
      id: `HYD-${Math.floor(1000 + Math.random() * 9000)}`,
      alertId: 'ZONE-WIDE-HYDRATION',
      zone: activeZoneObj.name,
      severity: 'HIGH',
      recipientRole: 'Zone Hydration & Rest Foreman',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 772-COOL',
      messagePayload: `ZONE HYDRATION PROTOCOL TRIGGERED: Enforce mandatory 15-minute shaded pause for ${activeZoneObj.name} (N=${activeZoneObj.count}). Distribute 250ml electrolyte fluid.`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newDispatch, ...prev]);

    setTimeout(() => {
      setProtocolActiveNotice(null);
    }, 6000);
  };

  const handleCustomPacketFromSimulator = (customPacket: TelemetryPacket) => {
    const result = predictWorkforceAnomaly(customPacket, undefined, kalmanConfig);
    setTelemetryAlert(result);

    if (customPacket.cohort_size) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone ? { ...z, count: customPacket.cohort_size || z.count } : z
        )
      );
    }
  };

  // Direct Client-Side Executive Safety PDF Report Export
  const handleDirectPdfExport = async () => {
    setIsDirectPdfExporting(true);
    setDirectPdfStatus('Capturing telemetry charts & compiling executive safety report...');
    try {
      await generateExecutiveSafetyPdfReport({
        activeAlerts,
        telemetryStream,
        currentZone: activeZoneObj,
        zones,
        telemetryElementId: 'telemetry-charts-card',
        projectionElementId: 'incident-projection-chart-card',
        alertsElementId: 'active-alerts-section',
        onProgress: (status) => setDirectPdfStatus(status)
      });
      setProtocolActiveNotice('Executive Safety Report PDF successfully generated & downloaded.');
      setTimeout(() => setProtocolActiveNotice(null), 5000);
    } catch (err) {
      console.error('PDF export failed:', err);
      setProtocolActiveNotice('Direct PDF capture encountered an issue, opening report modal instead.');
      setIsReportModalOpen(true);
    } finally {
      setIsDirectPdfExporting(false);
      setDirectPdfStatus('');
    }
  };

  const handleSyncBiometricToKalman = (workerId: string, hrvRmssd: number, heartRate: number) => {
    const updatedPacket: TelemetryPacket = {
      ...generatePacketForZone(activeZoneObj, hrvRmssd < 28),
      worker_id: workerId,
      hrv_series: [hrvRmssd + 4, hrvRmssd + 2, hrvRmssd, Math.max(12, hrvRmssd - 1)]
    };
    const res = predictWorkforceAnomaly(updatedPacket, undefined, kalmanConfig);
    setTelemetryAlert(res);
    setProtocolActiveNotice(
      `Synchronized live wearable biometrics for ${workerId} (HRV: ${hrvRmssd}ms, HR: ${heartRate} BPM). Anomaly risk updated to ${(res.risk_probability * 100).toFixed(1)}%.`
    );

    const syncAudit: SystemAuditLogEntry = {
      id: `AUD-BIO-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Manager on Duty',
      category: 'BIOMETRIC_SYNC',
      targetModule: 'Wearable Health Device BLE Ingestion Hub',
      parameter: `Live Biometric Sync: ${workerId}`,
      previousValue: `HRV: ${activeZoneObj.customBaselines?.baselineHrv || 68}ms`,
      newValue: `Live RMSSD: ${hrvRmssd}ms (HR: ${heartRate} BPM)`,
      justification: `Ingested real-time wearable beat-to-beat variability into Kalman state estimator.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [syncAudit, ...prev]);

    setTimeout(() => setProtocolActiveNotice(null), 6000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6">
      {/* Top Navigation Bar */}
      {/* Top Navigation Bar */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-lg gap-4">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg">
            <Activity className="text-cyan-400 h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PROGNOSTICATOR <span className="text-cyan-400 text-sm font-normal">| Azure IoT Hub Stream</span>
            </h1>
            <p className="text-xs text-slate-400">Population &amp; Workforce Health Early Warning Platform</p>
          </div>
        </div>

        {/* Global Search Bar: Quick navigation to specific zones, sensor IDs, or recent alert reports */}
        <div className="w-full xl:w-96 xl:mx-2">
          <GlobalSearchBar
            zones={zones}
            alerts={activeAlerts}
            onSelectZone={(zoneId) => {
              setSelectedZone(zoneId);
              const z = zones.find((item) => item.id === zoneId);
              if (z) {
                const newPacket = generatePacketForZone(z, z.status === 'CRITICAL');
                const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
                setTelemetryAlert(res);
              }
            }}
            onSelectAlert={(alertId) => {
              const a = activeAlerts.find((item) => item.id === alertId);
              if (a) {
                setSelectedZone(a.location_zone);
              }
            }}
          />
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* High-Priority Active Anomalies Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('active-anomalies-widget');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-rose-950/70 hover:bg-rose-900/70 border border-rose-500/50 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs animate-pulse"
            title="Jump to High-Priority Active Anomalies & Urgent Triage Widget"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Active Anomalies ({pendingCriticalCount} Critical)</span>
          </button>

          {/* Last 10 Detected Anomalies Quick Audit Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('recent-anomalies-audit-list');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Jump to Last 10 Detected Anomalies Scrollable Quick Audit List"
          >
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Last 10 Anomalies</span>
          </button>

          {/* Sensor Signal Alert Thresholds Config Panel Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('sensor-thresholds-config-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to Custom Sensor Signals Alert Thresholds Configuration Panel"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Alert Thresholds</span>
          </button>

          {/* Anomaly Detection Sensitivity Thresholds Config Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('anomaly-threshold-config-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/60 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            title="Jump to Custom Anomaly Detection Thresholds & Sensitivity Configuration Panel"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sensitivity Config ({dailyFrequencyThreshold}/day)</span>
          </button>

          {/* 30-Day Anomaly Trend Frequency Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('anomaly-trend-30d-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to 30-Day Anomaly Trend Frequency Recharts Analytics"
          >
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            <span>30d Trend Frequency</span>
          </button>

          {/* Organization-Wide Geographical & Department Heatmap Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('org-anomaly-heatmap-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-rose-950/70 hover:bg-rose-900/70 border border-rose-500/50 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            title="Jump to Organization-Wide Geographical & Department Anomaly Frequency Heatmap"
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Org Heatmap (6 Facilities)</span>
          </button>

          {/* Department Anomaly Severity Stacked Bar Chart Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('department-severity-stacked-bar-chart');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/60 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            title="Jump to Anomaly Severity Distribution (Low, Medium, High, Critical) per Department Stacked Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Severity Distribution (Stacked Bar)</span>
          </button>

          {/* Telemetry Precursor Pattern Recognition Engine Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('pattern-recognition-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/60 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            title="Jump to Telemetry Precursor Pattern Recognition Engine (String-Matching Algorithm)"
          >
            <GitMerge className="h-3.5 w-3.5 text-purple-400" />
            <span>Pattern Recognition</span>
          </button>

          {/* 24-Hour Workforce Health Chart Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('historical-health-chart-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to Historical Workforce Health Signals 24h Chart"
          >
            <LineChart className="h-3.5 w-3.5 text-cyan-400" />
            <span>24h Health Signals</span>
          </button>

          {/* 48-Hour Incident Volume Projection Forecast Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('incident-projection-chart-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to 48-Hour Potential Incident Volume Projection Trend Analysis Graph (Recharts)"
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            <span>48h Forecast</span>
          </button>

          {/* 48-Hour Forecast Staffing & Resource Distribution Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('forecasted-resource-widget');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to Forecasted Risk Staffing & Resource Distribution Widget"
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span>Forecast Staffing</span>
          </button>

          {/* Anomaly Audit Log Modal Trigger Button */}
          <button
            onClick={() => setIsAnomalyAuditModalOpen(true)}
            className="flex items-center space-x-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            title="Open Anomaly Audit Log Modal: Timestamp, Model Confidence Score, and Corrective Action Taken for Every Flagged Anomaly"
          >
            <History className="h-3.5 w-3.5 text-cyan-400" />
            <span>Anomaly Audit Log</span>
          </button>
          {/* Incident Hotspots NLG Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('incident-hotspots-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Incident Hotspots & Top 3 Contributing Factors Natural Language Generation"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Hotspots NLG</span>
          </button>

          {/* Real-Time Wearable Biometric Synchronization Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('biometric-sync-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Real-Time Wearable Biometric Synchronization & Worker HRV Stress Monitoring"
          >
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            <span>Biometrics HRV</span>
          </button>

          {/* Chronological Anomaly Log Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('chronological-anomaly-log-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Chronological list-view summary of all recent high-priority health and safety alerts"
          >
            <Clock className="h-3.5 w-3.5 text-rose-400" />
            <span>Anomaly Log</span>
          </button>

          {/* Alert History Table Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('alert-history-table-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Jump to Sensor Signal Threshold Exceedance & Incident Alert History Table"
          >
            <History className="h-3.5 w-3.5 text-emerald-400" />
            <span>Alert History</span>
          </button>

          {/* Automated Predictive Maintenance Scheduler Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('maintenance-scheduler-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Automated Predictive Maintenance Work Order Scheduler & Technician Dispatch"
          >
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            <span>Maintenance Dispatch</span>
          </button>

          {/* Medical Dispatch Queue Trigger */}
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center space-x-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Open Automated Medical Protocol Dispatch Queue"
          >
            <Radio className="h-3.5 w-3.5 text-rose-400" />
            <span>
              Medical Dispatch{' '}
              {stagedDispatchCount > 0 && (
                <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px] ml-1">
                  {stagedDispatchCount} Staged
                </span>
              )}
            </span>
          </button>

          {/* Continuous IoT Stream State Indicator */}
          <button
            onClick={() => setIsStreamingActive((s) => !s)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              isStreamingActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Live Continuous IoT Streaming Engine"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isStreamingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            <span>{isStreamingActive ? 'Streaming Hub: LIVE' : 'Streaming Hub: PAUSED'}</span>
          </button>

          {/* Audible Voice Dispatch Modal Trigger */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
              isSpeaking
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse'
                : voiceSettings.enabled
                ? 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Configure audible synthesized voice alerts for on-site supervisors"
          >
            {voiceSettings.enabled ? (
              <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'text-cyan-300 animate-ping' : 'text-cyan-400'}`} />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>
              Voice Dispatch:{' '}
              <strong className="text-white ml-0.5">
                {isSpeaking ? 'SPEAKING' : voiceSettings.enabled ? 'ON' : 'MUTED'}
              </strong>
            </span>
          </button>

          {/* Safety Resources Allocation Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('resource-allocation-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Dynamic On-Site Safety Resource Allocation & Personnel Redistribution"
          >
            <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Safety Resources</span>
          </button>

          {/* Sensitivity Settings */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Adjust Kalman filter sensitivity and anomaly detection thresholds"
          >
            <Settings className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              Sensitivity: <strong className="font-bold text-white ml-0.5">{kalmanConfig.preset}</strong>
            </span>
          </button>

          {/* System Audit Trail Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('system-audit-log-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="View System Audit Log tracking manual sensitivity and zone changes"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit Trail ({systemAuditLogs.length})</span>
          </button>

          {/* Sensor Correlation Scatter Jump Button */}
          <button
            onClick={() => {
              const el = document.getElementById('sensor-correlation-scatter-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
            title="Explore multi-variable sensor correlations & root causes"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            <span>Correlations ({correlationData.length})</span>
          </button>

          {/* Simulator & Jitter Drawer */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center space-x-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>IoT Hub &amp; Bursts</span>
          </button>

          {/* Executive Safety PDF Report (Client-Side) */}
          <button
            onClick={handleDirectPdfExport}
            disabled={isDirectPdfExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs border ${
              isDirectPdfExporting
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-cyan-950/70 hover:bg-cyan-900/70 border-cyan-500/40 text-cyan-300'
            }`}
            title="Directly compile & download printable Executive Safety PDF report capturing telemetry charts and active alerts"
          >
            {isDirectPdfExporting ? (
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span>{isDirectPdfExporting ? 'Generating PDF...' : 'Executive Safety PDF'}</span>
          </button>

          {/* Custom Health Signal Notification Thresholds Configuration Button */}
          <button
            onClick={() => setIsHealthThresholdsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Configure custom notification thresholds for specific workforce health signals"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Health Thresholds</span>
          </button>

          {/* Test Real-Time Breach Notification Toast Button */}
          <button
            onClick={handleSimulateBreachToast}
            className="flex items-center space-x-1.5 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/50 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer animate-pulse"
            title="Simulate live sensor reading exceeding custom thresholds to trigger real-time notification toast alert"
          >
            <BellRing className="h-3.5 w-3.5 text-rose-400" />
            <span>Test Breach Alert</span>
          </button>

          {/* Test Real-Time Critical Anomaly Toast Notification Button (Shows Department & Model Confidence Level) */}
          <button
            onClick={() => {
              triggerCriticalAnomalyNotification({
                department: 'Civil & Structural Construction',
                confidenceLevel: 0.948,
                locationZone: activeZoneObj.name,
                zoneId: activeZoneObj.id,
                workerPseudonym: 'W-9921',
                anomalyMetric: 'Cardiovascular Autonomic Collapse & Extreme Core Temp',
                measuredValue: 'Heart Rate 142 BPM, Skin Temp 38.8°C',
                thresholdLimit: 'HR Max 115 BPM, Skin 37.8°C',
                reconstructionMse: 0.428,
                recommendedAction: 'Immediate shaded cooling extraction; stage medical dispatch liaison.',
                force: true
              });
            }}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-rose-950/60 cursor-pointer border border-rose-400/60"
            title="Simulate detection of a new critical anomaly to test real-time notification toast displaying Department and Confidence Level"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-white animate-pulse" />
            <span>Simulate Critical Toast</span>
          </button>

          {/* Test Real-Time Pre-Emptive Proactive Alert Button */}
          <button
            onClick={() => triggerPreemptiveProactiveAlert()}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-amber-950/50 cursor-pointer border border-amber-400"
            title="Trigger pre-emptive proactive notification when 7-day moving average projection exceeds safe levels before a critical anomaly occurs"
          >
            <Zap className="h-3.5 w-3.5 text-slate-950 animate-bounce" />
            <span>Simulate Pre-Emptive Alert</span>
          </button>

          {/* Download Report Button (Converts current 24h anomaly trends & threshold settings to JSON or CSV) */}
          <div className="relative">
            <button
              onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md border border-cyan-400/40"
              title="Download current 24-hour anomaly trend data and threshold settings as JSON or CSV file"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Download Report</span>
              <ChevronDown className={`h-3 w-3 text-white/80 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDownloadMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDownloadMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-68 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Export 24h Trends &amp; Thresholds</span>
                    <span className="text-[10px] text-cyan-400 font-mono">RFC 4180</span>
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => handleDownloadReport('CSV')}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-950/70 hover:text-emerald-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Compliance CSV</div>
                          <div className="text-[10px] text-slate-400">RFC 4180 with Privacy Shield preambles</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">.csv</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReport('PDF')}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cyan-950/70 hover:text-cyan-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Executive Safety PDF</div>
                          <div className="text-[10px] text-slate-400">Charts capture, anomaly logs &amp; legal audit</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">.pdf</span>
                    </button>
                    <button
                      onClick={() => handleDownloadReport('JSON')}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-indigo-950/70 hover:text-indigo-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileCode className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">JSON Data Dump</div>
                          <div className="text-[10px] text-slate-400">Raw telemetry, thresholds &amp; alert history</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold">.json</span>
                    </button>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-800/80 px-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Privacy Shield Enforced</span>
                    <span className="text-emerald-400">&epsilon;=0.5 / N&ge;12</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Current View Anomaly Report Button (Simulated PDF/CSV with System Audit Logging) */}
          <div className="relative">
            <button
              onClick={() => setIsViewAuditMenuOpen((prev) => !prev)}
              disabled={isExportingAuditReport}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md border border-cyan-400/40 cursor-pointer disabled:opacity-50"
              title="Export current view anomaly report as a simulated PDF or CSV file for audit logging purposes"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
              <span>Export View Report (Audit Logged)</span>
              <ChevronDown className={`h-3 w-3 text-white/80 transition-transform ${isViewAuditMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isViewAuditMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsViewAuditMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Export View for Audit Logging</span>
                    <span className="text-[10px] text-cyan-400 font-mono">ISO 45001</span>
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      onClick={() => handleExportViewAuditReport('PDF')}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cyan-950/70 hover:text-cyan-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Simulated PDF Report</div>
                          <div className="text-[10px] text-slate-400">Executive anomaly audit with 30d trend</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">.pdf</span>
                    </button>
                    <button
                      onClick={() => handleExportViewAuditReport('CSV')}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-950/70 hover:text-emerald-200 text-slate-200 rounded-lg transition group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-semibold text-white">Simulated CSV File</div>
                          <div className="text-[10px] text-slate-400">RFC 4180 raw tabular dataset for audit logs</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">.csv</span>
                    </button>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-800/80 px-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>System Audit Trail</span>
                    <span className="text-emerald-400">Auto-Registered &amp; Logged</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Historical Workforce Health Data CSV Button */}
          <button
            onClick={handleExportWorkforceCsv}
            className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            title="Export current 24-hour historical workforce health data as a CSV file for offline reporting"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Health CSV</span>
          </button>

          {/* Compliance Report Modal Trigger */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
            <span>Reports &amp; Print</span>
          </button>
        </div>
      </header>

      {/* PDF Export In-Flight Notification */}
      {isDirectPdfExporting && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 text-xs flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
            <div>
              <span className="font-bold text-white text-sm block">Generating Executive Safety PDF Report...</span>
              <span className="text-[11px] text-cyan-300 font-mono">{directPdfStatus}</span>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full font-mono font-semibold border border-cyan-500/40">
            Client-Side jsPDF &amp; Canvas
          </span>
        </div>
      )}

      {/* Protocol Banner Notification */}
      {protocolActiveNotice && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
            <span className="font-medium">{protocolActiveNotice}</span>
          </div>
          <button
            onClick={() => setProtocolActiveNotice(null)}
            className="text-cyan-400 hover:text-white text-xs underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Macro Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Monitored Workforce</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-white">1,420 Active</h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <Users className="h-3 w-3 mr-1" /> 100% Anonymized
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Critical Alerts</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-rose-400">{pendingCriticalCount}</h3>
            <span className="text-xs text-rose-400 font-semibold flex items-center">
              <ShieldAlert className="h-3 w-3 mr-1" /> Immediate Action
            </span>
          </div>
        </div>

        {/* Equipment Predictive Maintenance Macro Metric Card */}
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl">
          <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            Predictive Maintenance
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">
              {activeAlerts.filter((a) => a.alert_type === 'PREDICTIVE_MAINTENANCE' && !a.acknowledged).length} Pending
            </h3>
            <span className="text-[11px] text-amber-300/80 font-mono">
              Vibration / Heat
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Avg Wet-Bulb Heat Index</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">{activeZoneObj.heatIndex || 42.5}°C</h3>
            <span className="text-xs text-slate-400">Severe Thermal Load</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Model Lead Time (Backtested)</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-cyan-400">3.8 Hours</h3>
            <span className="text-xs text-cyan-400 font-semibold">Prior to Incident</span>
          </div>
        </div>
      </div>

      {/* High-Priority Active Anomalies Widget (Using Real-Time Telemetry to Highlight Urgent Health & Safety Deviations) */}
      <ActiveAnomaliesWidget
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onSpeakAlert={handleSpeakAlert}
        isSpeaking={isSpeaking}
      />

      {/* Incident Hotspots Summary Widget (Text-Based Natural Language Generation) */}
      <IncidentHotspotsWidget
        alerts={activeAlerts}
        zones={zones}
        telemetryStream={telemetryStream}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onOpenVoiceAlerts={() => setIsVoiceModalOpen(true)}
      />

      {/* Hyper-Local Real-Time Weather Integration Card */}
      <ZoneWeatherCard
        weather={currentWeather}
        loading={weatherLoading}
        onRefreshWeather={() => syncLiveWeather(activeZoneObj)}
        zoneName={activeZoneObj.name}
        latitude={activeZoneObj.latitude}
        longitude={activeZoneObj.longitude}
      />

      {/* Real-Time Biometric Synchronization Hub (Wearable Health Devices & Live HRV Stress Monitoring) */}
      <BiometricSyncModule
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onSyncBiometricToKalman={handleSyncBiometricToKalman}
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
      />

      {/* 2D Floor Plan Visualization Component with Zone Hotspots & Sensor Telemetry Stream Toggles */}
      <FloorPlan2DView
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        activeAlerts={activeAlerts}
        streamToggles={streamToggles}
        onToggleStream={handleToggleStream}
        onSetAllStreams={handleSetAllStreams}
        recentTelemetryPoint={telemetryStream[telemetryStream.length - 1]}
      />

      {/* Custom Sensor Signals Alert Thresholds Configuration Panel (Inline Real-Time Control) */}
      <SensorThresholdsConfigPanel
        thresholds={healthThresholds}
        onUpdateThresholds={handleSaveHealthThresholds}
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        telemetryStream={telemetryStream}
        onOpenAdvancedModal={() => setIsHealthThresholdsModalOpen(true)}
        onScrollToChart={() => {
          const el = document.getElementById('historical-health-chart-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Last 10 Detected Anomalies Scrollable Quick Audit List Component */}
      <RecentAnomaliesAuditList
        alerts={activeAlerts}
        zones={zones}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onInspectAnomaly={(alert) => {
          setAnomalyTrendZoneId(alert.location_zone);
          const el = document.getElementById('anomaly-trend-30d-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
      />

      {/* Telemetry Precursor Pattern Recognition Engine (String-Matching Algorithm) */}
      <PatternRecognitionPanel
        telemetryStream={telemetryStream}
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
      />

      {/* Custom Anomaly Detection Thresholds & Sensitivity Configuration Panel */}
      <AnomalyThresholdConfigPanel
        thresholds={healthThresholds}
        onUpdateThresholds={handleSaveHealthThresholds}
        trendData={anomalyTrend30d}
        dailyFrequencyThreshold={dailyFrequencyThreshold}
        onDailyFrequencyThresholdChange={setDailyFrequencyThreshold}
        criticalFrequencyThreshold={criticalFrequencyThreshold}
        onCriticalFrequencyThresholdChange={setCriticalFrequencyThreshold}
        proactiveRiskThreshold={proactiveRiskThreshold}
        onProactiveRiskThresholdChange={setProactiveRiskThreshold}
        onTriggerPreemptiveAlert={() => triggerPreemptiveProactiveAlert()}
        sensitivityLevel={sensitivityLevel}
        onSensitivityLevelChange={setSensitivityLevel}
        onScrollToTrendChart={() => {
          const el = document.getElementById('anomaly-trend-30d-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        selectedZone={activeZoneObj}
      />

      {/* 30-Day Longitudinal Anomaly Trend Frequency Intelligence Line Chart (Recharts) */}
      <AnomalyTrend30DaysChart
        data={anomalyTrend30d}
        summary={anomalyTrendSummary}
        currentZone={activeZoneObj}
        zones={zones}
        selectedZoneId={anomalyTrendZoneId}
        onSelectZone={(zoneId) => setAnomalyTrendZoneId(zoneId)}
        onExportReport={handleExportViewAuditReport}
        isExporting={isExportingAuditReport}
        dailyFrequencyThreshold={dailyFrequencyThreshold}
        criticalFrequencyThreshold={criticalFrequencyThreshold}
        proactiveRiskThreshold={proactiveRiskThreshold}
        sensitivityLevel={sensitivityLevel}
        onOpenThresholdPanel={() => {
          const el = document.getElementById('anomaly-threshold-config-panel');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Organization-Wide Geographical & Departmental Anomaly Frequency Heatmap */}
      <OrganizationalAnomalyHeatmap
        zones={zones}
        alerts={activeAlerts}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
      />

      {/* Anomaly Severity Distribution (Low, Medium, High, Critical) per Department Stacked Bar Chart */}
      <DepartmentSeverityStackedBarChart
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
      />

      {/* Historical Workforce Health Signal Data Line Chart (Last 24 Hours via Recharts) */}
      <HistoricalWorkforceHealthChart
        data={telemetryStream}
        zoneName={activeZoneObj.name}
        activeThresholdCutoff={kalmanConfig.criticalCutoffPct}
        thresholds={healthThresholds}
        onOpenThresholdsModal={() => setIsHealthThresholdsModalOpen(true)}
        onExportCsv={handleExportWorkforceCsv}
        externalIsolatedSignal={isolatedHealthSignal}
        onSignalIsolationChange={setIsolatedHealthSignal}
        correlationPair={activeCorrelationPair}
      />

      {/* Chronological Anomaly Log Panel below Line Chart */}
      <ChronologicalAnomalyLogPanel
        alerts={activeAlerts}
        zones={zones}
        selectedZoneId={selectedZone}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onSelectZone={(zoneId) => setSelectedZone(zoneId)}
        onSpeakAlert={handleSpeakAlert}
        onIsolateSignalInChart={(sigKey) => setIsolatedHealthSignal(sigKey)}
        isSpeaking={isSpeaking}
      />

      {/* Alert History Table: Timestamped Log of Past Incidents Exceeding Thresholds */}
      <AlertHistoryTable
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        thresholds={healthThresholds}
        zones={zones}
        selectedZone={activeZoneObj}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onSpeakAlert={handleSpeakAlert}
        isSpeaking={isSpeaking}
        onScrollToChart={() => {
          const el = document.getElementById('historical-health-chart-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenThresholdsModal={() => setIsHealthThresholdsModalOpen(true)}
      />

      {/* Sliding 24-Hour Recharts Telemetry Stream with 1-Hour Forecast */}
      <TelemetryCharts
        data={telemetryStream}
        zoneName={activeZoneObj.name}
        streamToggles={streamToggles}
      />

      {/* Multi-Variable Sensor Correlation & Root-Cause Scatter Plot (Recharts) */}
      <div id="sensor-correlation-scatter-section">
        <SensorCorrelationScatterPlot
          data={correlationData}
          zones={zones}
          selectedZoneId={selectedZone}
          onSelectZone={(zoneId) => setSelectedZone(zoneId)}
        />
      </div>

      {/* 48-Hour Potential Incident Volume Projection Trend Analysis (Recharts) */}
      <IncidentProjectionChart
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        currentZone={activeZoneObj}
      />

      {/* 48-Hour Forecasted Risk Staffing & Resource Distribution Widget */}
      <ForecastedResourceDistributionWidget
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        currentZone={activeZoneObj}
        onApplyReallocation={(order) => {
          setProtocolActiveNotice(
            `Staffing Distribution Applied: Reallocated personnel to ${order.toZone} to prevent forecasted health signals.`
          );
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
        onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
      />

      {/* Active Alerts Section (Kalman Filter Anomaly Detection with D3 Weekly Heatmap & Predictive Maintenance) */}
      <ActiveAlertsSection
        alerts={activeAlerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
        onSpeakAlert={handleSpeakAlert}
        isSpeaking={isSpeaking}
        voiceEnabled={voiceSettings.enabled}
      />

      {/* Automated Predictive Maintenance Scheduler Tool (Correlating Alerts with Technician Availability) */}
      <MaintenanceSchedulerModule
        alerts={activeAlerts}
        zones={zones}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
      />

      {/* Main Operational Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Geospatial Zone Selector / Heatmap & Custom Zone Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-cyan-400" /> Industrial Facility Zones
              </h2>
              <button
                onClick={() => setIsZoneBuilderOpen(true)}
                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition shadow-xs"
              >
                <Plus className="h-3 w-3" />
                <span>Custom Zone</span>
              </button>
            </div>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedZone(zone.id);
                    const newPacket = generatePacketForZone(zone, zone.status === 'CRITICAL');
                    const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
                    setTelemetryAlert(res);
                  }}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedZone === zone.id
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-md'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate mr-2">{zone.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        zone.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : zone.status === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {zone.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>
                      Active Cohort:{' '}
                      {zone.count < 12 ? (
                        <span className="text-amber-400 font-bold">N = {zone.count} (Suppressed)</span>
                      ) : (
                        `N = ${zone.count} (Protected)`
                      )}
                    </span>
                    <span>Heat Load: {zone.temp}</span>
                  </div>
                  {zone.customBaselines && (
                    <div className="text-[10px] text-cyan-400/80 font-mono mt-1">
                      Custom Baselines: HRV {zone.customBaselines.baselineHrv}ms | Noise {zone.customBaselines.noiseLimitDb}dB
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Regulatory Notice:</strong> k-Anonymity small-cell suppression enforces strict masking on cohorts
                under N=12 to shield individual worker identity.
              </p>
            </div>

            <button
              onClick={() => setIsInspectorOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-medium py-2 rounded-lg transition"
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>Inspect Multi-Signal Kalman Waveform</span>
            </button>
          </div>
        </div>

        {/* Right 2 Cols: Real-Time Explainable AI Triage & SHAP Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-cyan-400" /> Real-Time LSTM Anomaly &amp; Explainable AI (XAI) Drilldown
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshStream}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 transition border border-slate-700/80"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Simulate Stream Packet</span>
              </button>
            </div>
          </div>

          {/* Anomaly Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-2">
              <div>
                <span className="text-xs text-slate-400 font-mono">
                  ANOMALY ID: {telemetryAlert.worker_id} | ZONE: {telemetryAlert.location_zone}
                </span>
                <h3 className="text-lg font-bold text-white flex items-center mt-1">
                  Cohort Risk Probability:
                  {telemetryAlert.is_suppressed ? (
                    <span className="text-amber-400 ml-2">[SUPPRESSED DUE TO N &lt; 12 CELL LIMIT]</span>
                  ) : (
                    <span
                      className={`ml-2 ${
                        telemetryAlert.risk_tier === 'CRITICAL_RISK'
                          ? 'text-rose-400'
                          : telemetryAlert.risk_tier === 'MODERATE_RISK'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(telemetryAlert.risk_probability * 100).toFixed(1)}% ({telemetryAlert.risk_tier})
                    </span>
                  )}
                </h3>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-lg text-rose-400 text-xs font-mono">
                Reconstruction MSE: {telemetryAlert.reconstruction_mse.toFixed(3)}
              </div>
            </div>

            {/* Explainable AI Attribute Weights */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Integrated Gradients / Feature Attribution (Why did this alert trigger?)
              </h4>
              <div className="space-y-2.5">
                {Object.entries(telemetryAlert.explainable_attributions).map(([feature, weight]) => (
                  <div key={feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{feature}</span>
                      <span className="text-cyan-400 font-mono">
                        {telemetryAlert.is_suppressed ? 'Masked' : `${(weight * 100).toFixed(0)}% contribution`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: telemetryAlert.is_suppressed ? '0%' : `${weight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="mt-5 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-lg">
              <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">
                Recommended Operational Action
              </p>
              <p className="text-sm text-white font-medium">{telemetryAlert.recommended_operational_action}</p>
            </div>

            {/* Privacy Compliance Footer Tag */}
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <Lock className="h-3 w-3 text-cyan-400 shrink-0" />
              <span>{telemetryAlert.privacy_compliance}</span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTriggerHydrationProtocol}
              className="flex-1 min-w-[200px] bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition shadow-lg shadow-cyan-600/20 flex items-center justify-center"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Trigger Zone Hydration Protocol
            </button>
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-rose-600/40 flex items-center gap-1.5 shadow-sm"
            >
              <Radio className="h-4 w-4 text-rose-400" />
              <span>Stage Medical Dispatch ({stagedDispatchCount})</span>
            </button>
            <button
              onClick={handleDirectPdfExport}
              disabled={isDirectPdfExporting}
              className={`font-medium py-2.5 px-4 rounded-lg text-sm transition border flex items-center gap-1.5 shadow-sm ${
                isDirectPdfExporting
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border-cyan-500/40'
              }`}
            >
              {isDirectPdfExporting ? (
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-cyan-400" />
              )}
              <span>{isDirectPdfExporting ? 'Generating PDF...' : 'Executive Safety PDF'}</span>
            </button>
            <button
              onClick={handleExportWorkforceCsv}
              className="bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 font-semibold py-2.5 px-4 rounded-lg text-sm transition border border-emerald-500/50 flex items-center gap-1.5 shadow-sm"
              title="Download 24-hour historical health telemetry as CSV"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Export Health CSV (24h)</span>
            </button>
            <button
              onClick={() => handleExportViewAuditReport('PDF')}
              disabled={isExportingAuditReport}
              className="bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 font-semibold py-2.5 px-4 rounded-lg text-sm transition border border-cyan-500/50 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Export current view anomaly report as a simulated PDF/CSV file for audit logging purposes"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Export View Audit Report</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-slate-700 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Compliance Reports</span>
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-slate-700 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Audit Log</span>
            </button>
            <button
              onClick={() => setIsAnomalyAuditModalOpen(true)}
              className="bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 font-semibold py-2.5 px-4 rounded-lg text-sm transition border border-cyan-500/50 flex items-center gap-1.5 shadow-sm"
              title="Open Anomaly Audit Log: Historical timestamp, confidence score, and corrective action taken"
            >
              <History className="h-4 w-4 text-cyan-400" />
              <span>Anomaly Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic On-Site Safety Resource Allocation & Personnel Redistribution Module */}
      <ResourceAllocationModule
        zones={zones}
        alerts={activeAlerts}
        onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
      />

      {/* System Audit Log Component: Manual Changes to Sensitivity Thresholds & Zone Configurations */}
      <div id="system-audit-log-section">
        <SystemAuditLog
          logs={systemAuditLogs}
          onAddManualLog={handleAddManualAuditLog}
        />
      </div>

      {/* Modals & Drawers */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditEvents={auditEvents}
      />

      <AnomalyAuditLogModal
        isOpen={isAnomalyAuditModalOpen}
        onClose={() => setIsAnomalyAuditModalOpen(false)}
        auditRecords={anomalyAuditRecords}
      />

      <TelemetryInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        telemetryStream={telemetryStream}
        zoneName={activeZoneObj.name}
      />

      <StreamSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currentZone={selectedZone}
        onSimulateCustomPacket={handleCustomPacketFromSimulator}
        isStreamingActive={isStreamingActive}
        onToggleLiveStream={() => setIsStreamingActive((s) => !s)}
        jitterEnabled={jitterEnabled}
        onToggleJitter={() => setJitterEnabled((j) => !j)}
        onTriggerBurst={handleTriggerBurst}
      />

      <ReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeAlerts={activeAlerts}
        telemetryStream={telemetryStream}
        currentZone={activeZoneObj.name}
        zones={zones}
      />

      <KalmanSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentConfig={kalmanConfig}
        onSaveConfig={handleSaveConfig}
      />

      <MedicalDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        dispatches={medicalDispatches}
        onTransmitDispatch={handleTransmitDispatch}
        onTransmitAll={handleTransmitAllDispatches}
        onAcknowledgeDispatch={handleAcknowledgeDispatch}
        onStageNewDispatch={handleStageNewDispatch}
        zoneNames={zones.map((z) => z.name)}
      />

      <CustomZoneBuilderModal
        isOpen={isZoneBuilderOpen}
        onClose={() => setIsZoneBuilderOpen(false)}
        onAddZone={handleAddCustomZone}
      />

      {/* Audible Voice Alerts Synthesis Modal */}
      <VoiceAlertsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        settings={voiceSettings}
        onUpdateSettings={setVoiceSettings}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
      />

      {/* Workforce Health Signal Notification Thresholds Configuration Modal */}
      <HealthThresholdsConfigModal
        isOpen={isHealthThresholdsModalOpen}
        onClose={() => setIsHealthThresholdsModalOpen(false)}
        currentThresholds={healthThresholds}
        onSaveThresholds={handleSaveHealthThresholds}
        zones={zones}
        activeZoneId={selectedZone}
      />

      {/* Real-Time Critical Anomaly Notification Toast Component (Showing Department & Confidence Level) */}
      <CriticalAnomalyToast
        toasts={criticalAnomalyToasts}
        onDismiss={handleDismissCriticalToast}
        onAcknowledge={handleAcknowledgeCriticalToast}
        onDispatchAction={handleDispatchActionForCriticalToast}
        onInspectInChart={handleInspectCriticalToastInChart}
        soundEnabled={toastSoundEnabled}
        onToggleSound={() => setToastSoundEnabled((s) => !s)}
      />

      {/* Real-Time Threshold Breach Notification Toast Container */}
      <ThresholdBreachToastContainer
        toasts={activeToasts}
        onDismissToast={handleDismissToast}
        onAcknowledgeToast={handleAcknowledgeToast}
        onClearAllToasts={handleClearAllToasts}
        onInspectSignalInChart={handleInspectSignalInChart}
        onDispatchActionForToast={handleDispatchActionForToast}
        soundEnabled={toastSoundEnabled}
        onToggleSound={() => setToastSoundEnabled((s) => !s)}
      />
    </div>
  );
}

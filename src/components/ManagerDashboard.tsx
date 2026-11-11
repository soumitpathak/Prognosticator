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
  TrendingUp,
  TrendingDown,
  Printer,
  Filter,
  Thermometer,
  RotateCcw,
  Minus,
  UploadCloud
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
  CriticalAnomalyToastData,
  DepartmentRiskThreshold,
  Lstm12hForecastResult,
  Lstm12hForecastHour,
  IncidentAssignment,
  TelemetryRiskBreachEvent
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
import { compileFullAnomalyAuditLog, serializeCurrentAnomalyDataToCsvAndDownload } from '../services/anomalyAuditService';
import TelemetryInspectorModal from './TelemetryInspectorModal';
import StreamSimulatorDrawer from './StreamSimulatorDrawer';
import TelemetryCharts from './TelemetryCharts';
import ActiveAlertsSection from './ActiveAlertsSection';
import SensorCorrelationScatterPlot from './SensorCorrelationScatterPlot';
import ReportExportModal from './ReportExportModal';
import TelemetryUploadModal from './TelemetryUploadModal';
import HealthMetricsPdfExportModal from './HealthMetricsPdfExportModal';
import DownloadOptionsModal from './DownloadOptionsModal';
import SafetyCommitteePdfExportModal from './SafetyCommitteePdfExportModal';
import { generateSafetyCommitteePdfReport } from '../services/safetyCommitteePdfGenerator';
import SignalCategoryFilterSidebar, {
  DEFAULT_SIGNAL_CATEGORIES,
  DEFAULT_GRANULAR_SIGNALS,
  SignalCategoryState,
  GranularSignalState
} from './SignalCategoryFilterSidebar';
import { exportDashboardDataCsv } from '../services/dashboardCsvExport';
import WorkforceHealth30DaysTrendChart from './WorkforceHealth30DaysTrendChart';
import D3HealthSignalRollingTrendComparison from './D3HealthSignalRollingTrendComparison';
import DepartmentHealthComparisonSplitCard from './DepartmentHealthComparisonSplitCard';
import D3WorkplaceZoneRiskHeatmap from './D3WorkplaceZoneRiskHeatmap';
import DepartmentZoneSearchLookup, { DepartmentZoneEntity } from './DepartmentZoneSearchLookup';
import DateRangePicker, { DateRangeSelection, DEFAULT_DATE_RANGE } from './DateRangePicker';
import KalmanSettingsModal, { DEFAULT_KALMAN_CONFIG } from './KalmanSettingsModal';
import MedicalDispatchModal from './MedicalDispatchModal';
import CustomZoneBuilderModal from './CustomZoneBuilderModal';
import ZoneWeatherCard from './ZoneWeatherCard';
import IncidentProjectionChart from './IncidentProjectionChart';
import FloorPlan2DView from './FloorPlan2DView';
import SystemAuditLog from './SystemAuditLog';
import ResourceAllocationModule, { INITIAL_SAFETY_OFFICERS, INITIAL_DEPLOYMENT_ORDERS } from './ResourceAllocationModule';
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
import UnifiedNotificationToaster from './UnifiedNotificationToaster';
import HealthThresholdsConfigModal, { DEFAULT_HEALTH_THRESHOLDS } from './HealthThresholdsConfigModal';
import SensorThresholdsConfigPanel from './SensorThresholdsConfigPanel';
import { exportWorkforceHealthCsv } from '../services/workforceCsvExport';
import { downloadAnomalyReportJson, downloadAnomalyReportCsv } from '../services/reportExportService';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import AnomalyTrend30DaysChart from './AnomalyTrend30DaysChart';
import D3AnomalyTrend30DaysChart from './D3AnomalyTrend30DaysChart';
import AnomalyThresholdConfigPanel from './AnomalyThresholdConfigPanel';
import HistoricalAnomalyEventLog from './HistoricalAnomalyEventLog';
import AlgorithmSensitivityConfigPanel from './AlgorithmSensitivityConfigPanel';
import AudioNotificationSeverityTogglePanel from './AudioNotificationSeverityTogglePanel';
import HistoricalAnomalyCsvExportModal from './HistoricalAnomalyCsvExportModal';
import HistoricalAnomalyPdfExportModal from './HistoricalAnomalyPdfExportModal';
import OrganizationalAnomalyHeatmap from './OrganizationalAnomalyHeatmap';
import GeographicalZoneRiskHeatmap from './GeographicalZoneRiskHeatmap';
import GeospatialSummaryWidget from './GeospatialSummaryWidget';
import KalmanCohortAnomalyNotificationPanel from './KalmanCohortAnomalyNotificationPanel';
import CohortHealthComparisonLineView from './CohortHealthComparisonLineView';
import KalmanPredictiveModel30DaysChart from './KalmanPredictiveModel30DaysChart';
import IncidentLog from './IncidentLog';
import NotificationCenter, { INITIAL_INCIDENT_ASSIGNMENTS, INITIAL_RISK_BREACHES } from './NotificationCenter';
import DepartmentRiskThresholdConfigPanel, { DEFAULT_DEPARTMENT_RISK_THRESHOLDS } from './DepartmentRiskThresholdConfigPanel';
import AggregateRiskScoreTrend24hChart from './AggregateRiskScoreTrend24hChart';
import WorkforceRiskTrend7DaysChart from './WorkforceRiskTrend7DaysChart';
import DailySummaryReportModal from './DailySummaryReportModal';
import DailySummaryConfigModal from './DailySummaryConfigModal';
import HealthTelemetryVarianceSummary from './HealthTelemetryVarianceSummary';
import AlertForecastCard from './AlertForecastCard';
import SpatialZoneRiskHeatmap from './SpatialZoneRiskHeatmap';
import ExplainableAiLogWindow from './ExplainableAiLogWindow';
import ScenarioSimulationModal from './ScenarioSimulationModal';
import { ScenarioSimulationOutput } from '../services/lstmAnomalyEngine';
import ProximityAlertBanner from './ProximityAlertBanner';
import LstmRiskForecastingPanel12h from './LstmRiskForecastingPanel12h';
import AnomalyTelemetryDetailModal from './AnomalyTelemetryDetailModal';
import RecentAnomalyTriggersRunningLogPanel from './RecentAnomalyTriggersRunningLogPanel';
import PatternRecognitionPanel from './PatternRecognitionPanel';
import DepartmentSeverityStackedBarChart from './DepartmentSeverityStackedBarChart';
import PopulationHealthSparkline from './PopulationHealthSparkline';
import HistoricalPopulationHealthAnomaliesLog from './HistoricalPopulationHealthAnomaliesLog';
import TemporalAnomalyHeatmap from './TemporalAnomalyHeatmap';
import RiskHeatmapRadarWidget from './RiskHeatmapRadarWidget';
import {
  generate30DayAnomalyTrend,
  generate30DayAnomalyTrendWithProjection,
  computeTrendSummary,
  exportSimulatedAnomalyReportPdf,
  exportSimulatedAnomalyReportCsv
} from '../services/anomalyTrend30DayService';
import PatternLibraryTab from './PatternLibraryTab';
import WorkerDensityCorrelationTab from './WorkerDensityCorrelationTab';
import TeamAlertMobileModal from './TeamAlertMobileModal';
import { teamAlertService } from '../services/teamAlertService';
import { exportDailySummaryReportCsv } from '../services/dailySummaryCsvExport';
import { desktopNotificationService } from '../services/desktopNotificationService';
import { systemComplianceService } from '../services/systemComplianceService';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import { causalCorrelationEngineService } from '../services/causalCorrelationEngineService';
import SystemComplianceAuditModule from './SystemComplianceAuditModule';
import PredictiveMaintenanceModule from './PredictiveMaintenanceModule';
import CorrelationEngineModule from './CorrelationEngineModule';
import TopRightNotificationCenter from './TopRightNotificationCenter';
import FacilityZonesRiskTrendChart from './FacilityZonesRiskTrendChart';
import SecurityAuditLogPanel from './SecurityAuditLogPanel';
import AnomalyTrendSparklineWidget from './AnomalyTrendSparklineWidget';
import MiniSparkline from './MiniSparkline';
import ExplainableAnomalyTooltip from './ExplainableAnomalyTooltip';
import ZoneAnomalyConcentrationHeatmap from './ZoneAnomalyConcentrationHeatmap';
import PrognosticForecastPanel from './PrognosticForecastPanel';
import PredictiveTrendAlertsPanel from './PredictiveTrendAlertsPanel';
import { exportCurrentAnomalyLogsAndTrendsCsv } from '../services/complianceCsvExport';
import QuickSnapshotModal from './QuickSnapshotModal';
import ProactiveMaintenanceSchedulerCard from './ProactiveMaintenanceSchedulerCard';
import AnomalyDensityHeatmap from './AnomalyDensityHeatmap';
import AutomatedResponseModule from './AutomatedResponseModule';
import SignedComplianceReportModal from './SignedComplianceReportModal';
import ComplianceAuditLog from './ComplianceAuditLog';
import ManagerSummaryMetricsRow from './ManagerSummaryMetricsRow';
import ResourceUtilizationPanel from './ResourceUtilizationPanel';
import AlertHistory, { PastAnomalyRecord, INITIAL_PAST_ANOMALIES } from './AlertHistory';
import GlobalThresholdSettingsModal, { GlobalSensitivityLevel } from './GlobalThresholdSettingsModal';
import GlobalThresholdAlertBanner, { ActiveSignalBreach } from './GlobalThresholdAlertBanner';
import { complianceAuditService } from '../services/complianceAuditService';
import { chartAnnotationService } from '../services/chartAnnotationService';
import { generateDashboardSummaryPdfReport } from '../services/dashboardSummaryPdfGenerator';
import { FileText, Loader2, Navigation, ShieldCheck, Shield, Crosshair, Wrench, Volume2, VolumeX, UserCheck, Sparkles, Heart, Clock, History, ChevronDown, FileCode, Bell, BellRing, Flame, Globe, GitMerge, BarChart3, Compass, Smartphone, BookmarkCheck, Layers, Mail, Cpu, Calendar, Camera, Wind, GitCompare, Sun, Moon, AlertOctagon } from 'lucide-react';

export type TeamMemberRole = 'SAFETY_OFFICER' | 'MAINTENANCE_CREW' | 'OPERATIONS_LEAD';

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

/**
 * Small percentage change indicator component displayed alongside sparklines
 * to highlight positive or negative shifts in health signals over the last 24 hours.
 */
export function HealthSignal24hBadge({
  data,
  lowerIsBetter = false,
  label = '24h',
  className = ''
}: {
  data: number[];
  lowerIsBetter?: boolean;
  label?: string;
  className?: string;
}) {
  const shift = useMemo(() => {
    if (!data || data.length < 2) {
      return { pct: 0, text: '0.0%', isIncrease: false, isDecrease: false, isFlat: true };
    }
    const first = data[0];
    const last = data[data.length - 1];
    if (Math.abs(first) < 0.0001) {
      const diff = last - first;
      return {
        pct: diff,
        text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
        isIncrease: diff > 0.05,
        isDecrease: diff < -0.05,
        isFlat: Math.abs(diff) <= 0.05
      };
    }
    const pct = ((last - first) / Math.abs(first)) * 100;
    return {
      pct,
      text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      isIncrease: pct > 0.05,
      isDecrease: pct < -0.05,
      isFlat: Math.abs(pct) <= 0.05
    };
  }, [data]);

  // Determine positive (improving) or negative (degrading) shift
  // For risk score, anomalies, vibration, temperature: lower is better (a decrease is an improvement)
  // For resilience, connectivity, staffing, HRV: higher is better (an increase is an improvement)
  const isImproving = lowerIsBetter ? shift.isDecrease : shift.isIncrease;
  const isWorsening = lowerIsBetter ? shift.isIncrease : shift.isDecrease;

  let colorClasses = 'bg-slate-800/90 text-slate-300 border-slate-700/80';
  let IconComponent = Minus;

  if (isImproving) {
    colorClasses = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-xs shadow-emerald-950/40';
    IconComponent = shift.isIncrease ? TrendingUp : TrendingDown;
  } else if (isWorsening) {
    colorClasses = Math.abs(shift.pct) >= 8
      ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-xs shadow-rose-950/40'
      : 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-xs shadow-amber-950/40';
    IconComponent = shift.isIncrease ? TrendingUp : TrendingDown;
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${colorClasses} ${className}`}
      title={`${shift.text} shift in health signal over the last 24 hours (${isImproving ? 'Improving health trajectory' : isWorsening ? 'Signal degradation / increased risk' : 'Stable telemetry baseline'})`}
    >
      <IconComponent className="h-3 w-3 shrink-0" />
      <span>{shift.text}</span>
      {label && <span className="text-[9px] opacity-75 font-normal ml-0.5">{label}</span>}
    </span>
  );
}

let globalSeqCounter = 1000;
export const generateUniqueId = (prefix = 'ID') => {
  globalSeqCounter = (globalSeqCounter + 1) % 900000;
  return `${prefix}-${Date.now()}-${globalSeqCounter}`;
};

export interface ManagerDashboardProps {
  isAccessibilityMode?: boolean;
  onToggleAccessibilityMode?: () => void;
}

export default function ManagerDashboard({
  isAccessibilityMode: propIsAccessibilityMode,
  onToggleAccessibilityMode: propOnToggleAccessibilityMode
}: ManagerDashboardProps = {}) {
  const [selectedZone, setSelectedZone] = useState<string>('Outdoor-Construction-Sector-4');
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<FacilityZone[]>(INITIAL_FACILITY_ZONES);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryDataPoint[]>(() => generateSyntheticStream(24, 15));
  const [activeAlerts, setActiveAlerts] = useState<ActiveAnomalyAlert[]>(INITIAL_ACTIVE_ALERTS);
  const [correlationData, setCorrelationData] = useState<SensorCorrelationPoint[]>(() =>
    generateCorrelationDataset('ALL')
  );
  const activeZoneObj = zones.find((z) => z.id === selectedZone) || zones[0];

  // Live Weather State
  const [currentWeather, setCurrentWeather] = useState<ZoneWeatherData | null>(null);

  // Accessibility Mode State (High-Contrast Light presentation for visually impaired users)
  const [isAccessibilityMode, setIsAccessibilityMode] = useState<boolean>(() => {
    if (propIsAccessibilityMode !== undefined) return propIsAccessibilityMode;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prognosticator_accessibility_mode');
      if (saved !== null) return saved === 'true';
      return document.documentElement.classList.contains('manager-high-contrast-light');
    }
    return false;
  });

  // Dashboard Theme Switcher: 'dark' (Standard Tactical) or 'high-contrast-light' (Daylight / High-Contrast Accessibility)
  const [dashboardTheme, setDashboardTheme] = useState<'dark' | 'high-contrast-light'>(() => {
    if (typeof window !== 'undefined') {
      const savedAcc = localStorage.getItem('prognosticator_accessibility_mode');
      if (savedAcc === 'true') return 'high-contrast-light';
      const savedTheme = localStorage.getItem('prognosticator_dashboard_theme');
      if (savedTheme === 'high-contrast-light' || savedTheme === 'dark') return savedTheme;
    }
    return 'dark';
  });

  // Sync prop changes
  useEffect(() => {
    if (propIsAccessibilityMode !== undefined) {
      setIsAccessibilityMode(propIsAccessibilityMode);
    }
  }, [propIsAccessibilityMode]);

  // Apply or remove the '.manager-high-contrast-light' CSS class to the root element for visually impaired users
  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;
    const rootDiv = document.getElementById('root');

    if (isAccessibilityMode) {
      rootEl.classList.add('manager-high-contrast-light');
      rootEl.classList.remove('dark');
      bodyEl.classList.add('manager-high-contrast-light');
      if (rootDiv) rootDiv.classList.add('manager-high-contrast-light');
      setDashboardTheme('high-contrast-light');
      try {
        localStorage.setItem('prognosticator_accessibility_mode', 'true');
        localStorage.setItem('prognosticator_dashboard_theme', 'high-contrast-light');
      } catch {}
    } else {
      rootEl.classList.remove('manager-high-contrast-light');
      rootEl.classList.add('dark');
      bodyEl.classList.remove('manager-high-contrast-light');
      if (rootDiv) rootDiv.classList.remove('manager-high-contrast-light');
      setDashboardTheme('dark');
      try {
        localStorage.setItem('prognosticator_accessibility_mode', 'false');
        localStorage.setItem('prognosticator_dashboard_theme', 'dark');
      } catch {}
    }
  }, [isAccessibilityMode]);

  const handleToggleAccessibilityMode = () => {
    if (propOnToggleAccessibilityMode) {
      propOnToggleAccessibilityMode();
    } else {
      setIsAccessibilityMode((prev) => !prev);
    }
  };

  const handleToggleTheme = (newTheme: 'dark' | 'high-contrast-light') => {
    setDashboardTheme(newTheme);
    const isAcc = newTheme === 'high-contrast-light';
    setIsAccessibilityMode(isAcc);
    if (propOnToggleAccessibilityMode && isAcc !== isAccessibilityMode) {
      propOnToggleAccessibilityMode();
    }
    try {
      localStorage.setItem('prognosticator_dashboard_theme', newTheme);
      localStorage.setItem('prognosticator_accessibility_mode', isAcc ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Streaming IoT Hub Simulator State (Active by default for continuous anomaly detection)
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(true);
  const [jitterEnabled, setJitterEnabled] = useState<boolean>(true);
  const [packetCounter, setPacketCounter] = useState<number>(142);

  // Automated Protocol Medical Dispatches State
  const [medicalDispatches, setMedicalDispatches] = useState<MedicalDispatchNotification[]>(INITIAL_MEDICAL_DISPATCHES);

  // Sensitivity Settings Config
  const [kalmanConfig, setKalmanConfig] = useState<KalmanSensitivityConfig>(DEFAULT_KALMAN_CONFIG);

  // Kalman Filter Real-Time Confidence & Desktop Notification Sentinel State
  const [kalmanConfidence, setKalmanConfidence] = useState<number>(94.2);
  const [kalmanConfidenceThreshold, setKalmanConfidenceThreshold] = useState<number>(85.0);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState<boolean>(true);
  const [desktopNotificationPermission, setDesktopNotificationPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const lastKalmanNotificationRef = useRef<number>(0);

  // Longitudinal Date Range & Timeframe Filter State (Filters Historical Trends & Department Split Comparison)
  const [healthDateRange, setHealthDateRange] = useState<DateRangeSelection>(DEFAULT_DATE_RANGE);
  const [selectedComparisonDeptId, setSelectedComparisonDeptId] = useState<string>('Outdoor-Construction-Sector-4');

  // Progressive below-the-fold component loading for instantaneous initial page load
  const [isDeferredLoaded, setIsDeferredLoaded] = useState<boolean>(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDeferredLoaded(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  // What-If Simulator state for WorkforceRiskTrend7DaysChart
  const [isWhatIfSimulatorOpen, setIsWhatIfSimulatorOpen] = useState<boolean>(false);

  const handleOpenWhatIfSimulator = () => {
    setIsWhatIfSimulatorOpen(true);
    const el = document.getElementById('workforce-risk-trend-7d-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-cyan-500', 'transition-all');
      setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-500'), 2500);
    }
  };

  // User-Defined Health Telemetry Risk Threshold State (Persisted in localStorage)
  const [telemetryRiskThreshold, setTelemetryRiskThreshold] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prognosticator_telemetry_risk_threshold');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 40 && val <= 95) return val;
      }
    }
    return 75.0;
  });

  const [riskThresholdBreaches, setRiskThresholdBreaches] = useState<TelemetryRiskBreachEvent[]>(INITIAL_RISK_BREACHES);
  const lastRiskBreachAlertRef = useRef<number>(0);

  const handleUpdateTelemetryRiskThreshold = useCallback((newThreshold: number) => {
    const clamped = Math.max(40, Math.min(95, Number(newThreshold.toFixed(1))));
    setTelemetryRiskThreshold(clamped);
    try {
      localStorage.setItem('prognosticator_telemetry_risk_threshold', clamped.toString());
    } catch {}

    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-THRESH'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Safety Supervisor',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Health Telemetry Risk Threshold Sentinel',
      parameter: 'Telemetry Risk Cutoff Percentage',
      previousValue: `${telemetryRiskThreshold.toFixed(1)}%`,
      newValue: `${clamped.toFixed(1)}%`,
      justification: `Updated supervisory cutoff for automated browser alerts and immediate awareness protocols.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(`Health telemetry risk threshold updated to ${clamped.toFixed(1)}%. Browser alerts will fire above this cutoff.`);
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, [telemetryRiskThreshold]);

  const handleAcknowledgeRiskBreach = useCallback((id: string) => {
    setRiskThresholdBreaches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, acknowledged: true } : b))
    );
  }, []);

  const handleClearRiskBreaches = useCallback(() => {
    setRiskThresholdBreaches([]);
    setProtocolActiveNotice('All telemetry risk threshold breach records cleared.');
    setTimeout(() => setProtocolActiveNotice(null), 4000);
  }, []);

  const triggerTelemetryRiskBrowserAlert = useCallback(
    (currentRisk: number, zone: FacilityZone, result?: AnomalyPredictionResult) => {
      const now = Date.now();
      // Cooldown of 12 seconds to prevent alert saturation
      if (now - lastRiskBreachAlertRef.current < 12000) {
        return;
      }
      lastRiskBreachAlertRef.current = now;

      const delta = Number((currentRisk - telemetryRiskThreshold).toFixed(1));
      const breachId = generateUniqueId('BREACH');

      // 1. Spawning browser native notification + audio chime + title flash
      desktopNotificationService.notifyRiskThresholdBreach(
        {
          id: breachId,
          riskScore: currentRisk,
          threshold: telemetryRiskThreshold,
          delta,
          zoneName: zone.name,
          workerCount: zone.count,
          primarySignal: result?.explainable_attributions
            ? Object.keys(result.explainable_attributions)[0]
            : 'Acute Autonomic Deceleration & Thermal Strain',
          recommendedAction: result?.recommended_operational_action || 'Mandate shaded cooling rest and oral hydration.'
        },
        { forceTrigger: true }
      );

      // 2. Add to breach ledger
      const newBreach: TelemetryRiskBreachEvent = {
        id: breachId,
        timestamp: new Date().toISOString(),
        timeFormatted: 'Just now',
        riskScore: currentRisk,
        threshold: telemetryRiskThreshold,
        delta,
        zoneId: zone.id,
        zoneName: zone.name,
        workerCount: zone.count,
        severity: currentRisk >= 80 ? 'CRITICAL' : 'HIGH',
        triggerSignals: [
          { signalName: 'Multivariate LSTM Risk Probability', measuredValue: `${currentRisk.toFixed(1)}% (Cutoff: ${telemetryRiskThreshold.toFixed(1)}%)`, referenceBaseline: `Safe Floor <= ${telemetryRiskThreshold}%` },
          { signalName: 'Thermal Work Limit (TWL) Status', measuredValue: `${zone.twl ? zone.twl.toFixed(1) : '94.2'} W/m²`, referenceBaseline: 'Nominal >= 140 W/m²' },
          { signalName: 'Ambient / WBGT Heat Plume', measuredValue: `${zone.temp || '41.2'}°C`, referenceBaseline: 'Ceiling <= 36.0°C' }
        ],
        recommendedAction: result?.recommended_operational_action || 'Immediate shaded cooling extraction; stage medical dispatch liaison.',
        acknowledged: false,
        browserAlertDispatched: true,
        workerPseudonym: result?.worker_id || 'W-9921'
      };

      setRiskThresholdBreaches((prev) => [newBreach, ...prev].slice(0, 30));

      // 3. System audit log
      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-NOTIF'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'THRESHOLD_CHANGE',
        targetModule: 'Health Telemetry Risk Threshold Sentinel',
        parameter: 'Browser Alert Triggered',
        previousValue: `${telemetryRiskThreshold.toFixed(1)}% Threshold`,
        newValue: `Exceeded: ${currentRisk.toFixed(1)}% (+${delta}%)`,
        justification: `Automated browser alert dispatched because health telemetry risk in ${zone.name} exceeded user-defined cutoff (${telemetryRiskThreshold}%).`,
        approvalStatus: 'VERIFIED',
        zoneId: zone.id
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `🚨 BROWSER ALERT DISPATCHED: Telemetry risk in ${zone.name} (${currentRisk.toFixed(1)}%) exceeded your ${telemetryRiskThreshold}% threshold (+${delta}%).`
      );
      setTimeout(() => setProtocolActiveNotice(null), 8000);
    },
    [telemetryRiskThreshold]
  );

  // Subscribe to centralized browser desktop notification service
  useEffect(() => {
    const unsub = desktopNotificationService.subscribe((cfg) => {
      setDesktopNotificationsEnabled(cfg.enabled);
      setDesktopNotificationPermission(
        cfg.permission === 'unsupported' ? 'denied' : (cfg.permission as NotificationPermission)
      );
    });
    return () => unsub();
  }, []);

  // Modals & Primary View Tabs
  const [managerTab, setManagerTab] = useState<
    'live' | 'resourceUtilization' | 'compliance' | 'complianceAudit' | 'predictiveMaintenance' | 'correlationEngine' | 'density' | 'patterns'
  >('live');

  // Team Member View Role Toggle State: Safety Compliance Officer vs Maintenance Crew vs Operations Lead
  const [activeRole, setActiveRole] = useState<TeamMemberRole>('SAFETY_OFFICER');

  // Real-Time Alert Mute State (Persisted in localStorage)
  const [isAlertsMuted, setIsAlertsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('prognosticator_alerts_muted') === 'true';
    }
    return false;
  });

  const handleSwitchRole = (newRole: TeamMemberRole) => {
    const prevRole = activeRole;
    setActiveRole(newRole);
    complianceAuditService.logEvent({
      eventType: 'MANUAL_OVERRIDE',
      actor: 'Alex Mercer',
      actorRole:
        newRole === 'SAFETY_OFFICER'
          ? 'Safety Compliance Officer'
          : newRole === 'MAINTENANCE_CREW'
          ? 'Maintenance Crew Lead'
          : 'Site Operations Lead',
      actorType: 'USER',
      targetModule: 'Team Member View Access Control',
      parameter: 'Active Role Switch',
      previousValue: prevRole,
      newValue: newRole,
      justification: `Supervisor switched active dashboard view role to ${newRole}. Access privileges and forecast data visibility dynamically reconfigured.`,
      regulatoryStandard: 'HIPAA §164.312(b) & EU GDPR Art. 30',
      complianceStatus: 'VERIFIED'
    });
    if (newRole === 'MAINTENANCE_CREW') {
      setProtocolActiveNotice(
        'Maintenance Crew View Active: Sensitive worker biometric forecasting is restricted per OSHA/HIPAA regulations. Environmental & equipment monitors active.'
      );
      setTimeout(() => setProtocolActiveNotice(null), 7000);
    } else {
      setProtocolActiveNotice(`Switched dashboard view role to: ${newRole.replace('_', ' ')}.`);
      setTimeout(() => setProtocolActiveNotice(null), 5000);
    }
  };

  const handleToggleMuteAlerts = () => {
    setIsAlertsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('prognosticator_alerts_muted', String(next));
      }
      complianceAuditService.logEvent({
        eventType: 'MANUAL_OVERRIDE',
        actor: 'Alex Mercer',
        actorRole: 'Safety Compliance Officer',
        actorType: 'USER',
        targetModule: 'Real-Time Notification Dispatcher',
        parameter: 'Alert Notification Mute State',
        previousValue: prev ? 'MUTED' : 'ACTIVE',
        newValue: next ? 'MUTED' : 'ACTIVE',
        justification: next
          ? 'Supervisor muted live health anomaly alerts (visual audit logging maintained in ledger).'
          : 'Supervisor unmuted live health anomaly alerts.',
        regulatoryStandard: 'OSHA 1910.165(b)(2)',
        complianceStatus: 'OVERRIDDEN'
      });
      setProtocolActiveNotice(
        next ? '🚨 All anomaly alerts MUTED (silent mode). Audit logging active.' : '🔔 Anomaly alerts UNMUTED.'
      );
      setTimeout(() => setProtocolActiveNotice(null), 5000);
      return next;
    });
  };

  const [isTeamAlertModalOpen, setIsTeamAlertModalOpen] = useState<boolean>(false);
  const [unreadTeamAlertCount, setUnreadTeamAlertCount] = useState<number>(() =>
    teamAlertService.getUnreadCount()
  );

  useEffect(() => {
    const unsub = teamAlertService.subscribe((alerts) => {
      setUnreadTeamAlertCount(alerts.filter((a) => a.status === 'UNREAD').length);
    });
    return () => unsub();
  }, []);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAnomalyAuditModalOpen, setIsAnomalyAuditModalOpen] = useState<boolean>(false);
  const [isQuickSnapshotModalOpen, setIsQuickSnapshotModalOpen] = useState<boolean>(false);
  const [isSignedCompliancePdfModalOpen, setIsSignedCompliancePdfModalOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHealthMetricsPdfModalOpen, setIsHealthMetricsPdfModalOpen] = useState<boolean>(false);
  const [isDownloadOptionsModalOpen, setIsDownloadOptionsModalOpen] = useState<boolean>(false);
  const [isSafetyCommitteePdfModalOpen, setIsSafetyCommitteePdfModalOpen] = useState<boolean>(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState<boolean>(false);
  const [isAlertHistoryDocked, setIsAlertHistoryDocked] = useState<boolean>(false);
  const [pastAnomalies, setPastAnomalies] = useState<PastAnomalyRecord[]>(INITIAL_PAST_ANOMALIES);
  const [isGlobalThresholdModalOpen, setIsGlobalThresholdModalOpen] = useState<boolean>(false);
  const [globalSensitivity, setGlobalSensitivity] = useState<GlobalSensitivityLevel>('STANDARD');
  const [acknowledgedBreachIds, setAcknowledgedBreachIds] = useState<Set<string>>(new Set());
  const [simulatedBreaches, setSimulatedBreaches] = useState<ActiveSignalBreach[]>([]);
  const [isSignalFilterSidebarOpen, setIsSignalFilterSidebarOpen] = useState<boolean>(false);
  const [signalCategories, setSignalCategories] = useState<SignalCategoryState>(DEFAULT_SIGNAL_CATEGORIES);
  const [granularSignals, setGranularSignals] = useState<GranularSignalState>(DEFAULT_GRANULAR_SIGNALS);
  const [showGlobalMovingAverages, setShowGlobalMovingAverages] = useState<boolean>(true);
  const [globalMaWindowHours, setGlobalMaWindowHours] = useState<number>(4);

  const handleToggleSignalCategory = (cat: keyof SignalCategoryState) => {
    setSignalCategories((prev) => {
      const nextVal = !prev[cat];
      const nextState = { ...prev, [cat]: nextVal };

      // Synchronize associated granular signals
      if (cat === 'cardiac') {
        setGranularSignals((g) => ({
          ...g,
          heartRate: nextVal,
          hrv: nextVal,
          hrvDrop: nextVal,
          bloodPressure: nextVal
        }));
      } else if (cat === 'environmental') {
        setGranularSignals((g) => ({
          ...g,
          skinTemp: nextVal,
          ambientTemp: nextVal,
          twl: nextVal,
          noise: nextVal,
          aqi: nextVal
        }));
      } else if (cat === 'performance') {
        setGranularSignals((g) => ({
          ...g,
          riskScore: nextVal,
          stressScore: nextVal,
          equipmentVibration: nextVal,
          incidentProjections: nextVal
        }));
      }
      return nextState;
    });
  };

  const handleToggleGranularSignal = (sig: keyof GranularSignalState) => {
    setGranularSignals((prev) => {
      const nextState = { ...prev, [sig]: !prev[sig] };
      const cardiacAny = nextState.heartRate || nextState.hrv || nextState.hrvDrop || nextState.bloodPressure;
      const envAny = nextState.skinTemp || nextState.ambientTemp || nextState.twl || nextState.noise || nextState.aqi;
      const perfAny = nextState.riskScore || nextState.stressScore || nextState.equipmentVibration || nextState.incidentProjections;
      setSignalCategories({
        cardiac: cardiacAny,
        environmental: envAny,
        performance: perfAny
      });
      return nextState;
    });
  };

  const handleResetSignalFilters = () => {
    setSignalCategories(DEFAULT_SIGNAL_CATEGORIES);
    setGranularSignals(DEFAULT_GRANULAR_SIGNALS);
    setShowGlobalMovingAverages(true);
  };

  const handleSelectAllSignals = () => {
    setSignalCategories({ cardiac: true, environmental: true, performance: true });
    setGranularSignals({
      heartRate: true,
      hrv: true,
      hrvDrop: true,
      bloodPressure: true,
      skinTemp: true,
      ambientTemp: true,
      twl: true,
      noise: true,
      aqi: true,
      riskScore: true,
      stressScore: true,
      equipmentVibration: true,
      incidentProjections: true
    });
  };

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isZoneBuilderOpen, setIsZoneBuilderOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceAlertSettings>(DEFAULT_VOICE_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Daily Summary Report Modal State
  const [isDailySummaryReportOpen, setIsDailySummaryReportOpen] = useState<boolean>(false);
  const [isDailySummaryConfigOpen, setIsDailySummaryConfigOpen] = useState<boolean>(false);

  // Scenario Simulation & Explainable AI Modal State
  const [isScenarioSimulationOpen, setIsScenarioSimulationOpen] = useState<boolean>(false);
  const [isExplainableAiModalOpen, setIsExplainableAiModalOpen] = useState<boolean>(false);

  // Synchronized Incident Workflow Assignments
  const [incidentAssignments, setIncidentAssignments] = useState<Record<string, IncidentAssignment>>(
    INITIAL_INCIDENT_ASSIGNMENTS
  );

  const handleUpdateIncidentAssignment = (assignment: IncidentAssignment) => {
    setIncidentAssignments((prev) => ({
      ...prev,
      [assignment.eventId]: assignment
    }));
  };

  const handleInjectSimulatedScenario = (
    packet: TelemetryPacket,
    scenarioData: ScenarioSimulationOutput
  ) => {
    handleCustomPacketFromSimulator(packet);
    setProtocolActiveNotice(
      `Scenario Simulation Active in ${packet.location_zone}: ${scenarioData.riskScorePct}% predicted risk (${scenarioData.riskTier}). Top feature: ${scenarioData.topAttributions[0]?.featureName} (${scenarioData.topAttributions[0]?.attributionPct}%).`
    );
    setTimeout(() => setProtocolActiveNotice(null), 8000);
  };

  const handleExportDailySummaryCsv = () => {
    const { filename, recordCount } = exportDailySummaryReportCsv(
      zones,
      activeAlerts,
      INITIAL_SAFETY_OFFICERS,
      INITIAL_DEPLOYMENT_ORDERS,
      incidentAssignments,
      telemetryStream
    );

    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-CSV'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Operations Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Daily Summary Report',
      parameter: '24-Hour Operational Dataset CSV Export',
      previousValue: 'N/A',
      newValue: `Exported ${recordCount} summary records to ${filename}`,
      justification: 'Exported complete 24-hour daily summary dataset as RFC 4180 CSV for external statistical analysis.',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Daily Summary Report exported to CSV: ${filename} (${recordCount} records). Registered statutory audit event.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 7000);
  };

  // Anomaly Telemetry Detail Modal State
  const [selectedAnomalyForDetail, setSelectedAnomalyForDetail] = useState<ActiveAnomalyAlert | null>(null);
  const [isAnomalyDetailModalOpen, setIsAnomalyDetailModalOpen] = useState<boolean>(false);

  const handleOpenAnomalyDetails = (alert: ActiveAnomalyAlert) => {
    setSelectedAnomalyForDetail(alert);
    setIsAnomalyDetailModalOpen(true);
  };

  const handleAcknowledgeAllAlerts = () => {
    setActiveAlerts((prev) =>
      prev.map((a) => ({ ...a, acknowledged: true }))
    );
    setProtocolActiveNotice('All high-risk event notifications marked as acknowledged by safety supervisor.');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  };

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

  // Compliance CSV Export Modal State
  const [isComplianceCsvExportModalOpen, setIsComplianceCsvExportModalOpen] = useState<boolean>(false);

  const handleHistoricalComplianceExportLogged = (
    filename: string,
    recordCount: number,
    standard: string
  ) => {
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-EXP'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Lead Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Historical Anomaly Events Log',
      parameter: 'Compliance CSV Export',
      previousValue: 'N/A',
      newValue: `Exported ${recordCount} anomaly records under ${standard}: ${filename}`,
      justification: `Audited historical anomaly CSV export for statutory ${standard} compliance reporting.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Historical Anomaly Events Log exported to CSV for compliance reporting (${recordCount} records, ${standard}). File: ${filename}`
    );
    setTimeout(() => setProtocolActiveNotice(null), 7000);
  };

  // Historical Anomaly Formatted PDF Export Modal State
  const [isCompliancePdfExportModalOpen, setIsCompliancePdfExportModalOpen] = useState<boolean>(false);

  const handleHistoricalCompliancePdfExportLogged = (
    filename: string,
    recordCount: number,
    standard: string
  ) => {
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-PDF'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Lead Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Historical Anomaly Events Log',
      parameter: 'Compliance Formatted PDF Export',
      previousValue: 'N/A',
      newValue: `Generated and exported ${recordCount} anomaly records as formatted PDF under ${standard}: ${filename}`,
      justification: `Audited historical anomaly formatted PDF document export for statutory ${standard} compliance reporting.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Historical Anomaly Events Log exported to formatted PDF document (${recordCount} records, ${standard}). File: ${filename}`
    );
    setTimeout(() => setProtocolActiveNotice(null), 7000);
  };

  const handleHealthMetricsReportExported = (filename: string, recordCount: number) => {
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-PDF'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Lead Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Real-Time Health Metrics & KPI Display',
      parameter: 'Health Metrics Mock PDF Report Export',
      previousValue: 'N/A (Ad-hoc Snapshot)',
      newValue: `Generated and exported PDF document: ${filename}`,
      justification: `Executed mock PDF generation process for current health metrics display with 24h operational KPIs, multi-signal vitals, and statutory compliance seals.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Health Metrics Report PDF successfully generated & downloaded: ${filename}. Registered in System Audit Trail.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 7000);
  };

  // 30-Day Trend Chart Engine Selector (Recharts Engine active by default)
  const [trendChartEngine, setTrendChartEngine] = useState<'D3' | 'RECHARTS'>('RECHARTS');

  // Client-Side Executive PDF Export State
  const [isDirectPdfExporting, setIsDirectPdfExporting] = useState<boolean>(false);
  const [directPdfStatus, setDirectPdfStatus] = useState<string>('');
  const [isGeneratingSummaryPdf, setIsGeneratingSummaryPdf] = useState<boolean>(false);

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

  // 48-Hour Forward Incident Surge Predictive Analysis State
  const [isSimulated48hSurgeActive, setIsSimulated48hSurgeActive] = useState<boolean>(true);
  const [isPredictiveSurgeBannerDismissed, setIsPredictiveSurgeBannerDismissed] = useState<boolean>(false);

  // Compute 48-hour forward incident likelihood surge by comparing next 48h projections vs 7-day historical moving average
  const predictive48hAnalysis = useMemo(() => {
    const historical = anomalyTrend30d.filter((d) => !d.isProjected);
    const projected = anomalyTrend30d.filter((d) => d.isProjected);

    // Compute baseline from the latest 7-day rolling moving average of historical observations
    const latestHistorical = historical.length > 0 ? historical[historical.length - 1] : null;
    const baselineDailyRate =
      latestHistorical?.movingAvg7d && latestHistorical.movingAvg7d > 0
        ? latestHistorical.movingAvg7d
        : 5.2;

    // Next 48 hours is represented by the first two projected days (+24h and +48h)
    const next48hPoints = projected.slice(0, 2);
    const computed48hDailyRate =
      next48hPoints.length > 0
        ? next48hPoints.reduce((acc, d) => acc + (d.projectedTrend ?? d.movingAvg7d ?? baselineDailyRate), 0) /
          next48hPoints.length
        : baselineDailyRate * 1.25;

    // Calculate increase percentage
    const computedIncreasePct = Number(
      (((computed48hDailyRate - baselineDailyRate) / baselineDailyRate) * 100).toFixed(1)
    );

    // When simulated surge is active, provide a calibrated +26.4% incident likelihood surge
    const effectiveIncreasePct = isSimulated48hSurgeActive
      ? Math.max(26.4, computedIncreasePct)
      : computedIncreasePct;

    const effectiveProjectedDailyRate = isSimulated48hSurgeActive
      ? Number((baselineDailyRate * (1 + effectiveIncreasePct / 100)).toFixed(1))
      : Number(computed48hDailyRate.toFixed(1));

    const total48hForecastedEvents = Math.round(effectiveProjectedDailyRate * 2);

    return {
      baselineDailyRate: Number(baselineDailyRate.toFixed(1)),
      projected48hDailyRate: effectiveProjectedDailyRate,
      increasePct: effectiveIncreasePct,
      isTriggered: effectiveIncreasePct >= 20.0,
      total48hForecastedEvents,
      primaryDriver: latestHistorical?.primaryDriver || 'Thermal Radiation & Autonomic HRV Fatigue',
      peakWindow: '13:30 – 16:15 Daily',
      confidenceScore: next48hPoints[0]?.projectedConfidence ?? 94.2,
      affectedCohorts: ['Outdoor Construction Sector 4', 'Warehouse Logistics Hub North']
    };
  }, [anomalyTrend30d, isSimulated48hSurgeActive]);

  // Handle Staging Pre-emptive Protocols for the 48h Predictive Surge
  const handleStagePreemptive48hMitigation = useCallback(() => {
    const newDispatch: MedicalDispatchNotification = {
      id: generateUniqueId('PREDICT-DSP'),
      alertId: 'PREDICTIVE-48H-SURGE',
      zone: 'Outdoor-Construction-Sector-4',
      severity: 'HIGH',
      recipientRole: 'Pre-Emptive Thermal Defense & Rapid Hydration Team',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 911-PRED',
      messagePayload: `PREDICTIVE 48H SURGE (+${predictive48hAnalysis.increasePct}%): Staged automated hydration stations, continuous misting protocols, and staggered 20-minute shaded rest rotations.`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newDispatch, ...prev]);

    // Statutory Audit Log entry
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUDIT-PRED'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: 'usr-soc-automaton',
      userName: 'Predictive Trend Analysis Engine',
      userRole: 'SAFETY_DIRECTOR',
      category: 'MAINTENANCE_DISPATCH',
      targetModule: 'Longitudinal Trend & 48H Incident Surge Predictor',
      parameter: '48-Hour Incident Likelihood Inflection Surge',
      previousValue: `${predictive48hAnalysis.baselineDailyRate}/day (7D Moving Avg)`,
      newValue: `${predictive48hAnalysis.projected48hDailyRate}/day (+${predictive48hAnalysis.increasePct}% Spike)`,
      justification: `Pre-emptive mitigation protocols staged based on 48h predictive incident likelihood surge (+${predictive48hAnalysis.increasePct}% vs 7D baseline). Forecasted volume: ~${predictive48hAnalysis.total48hForecastedEvents} events across ${predictive48hAnalysis.affectedCohorts.join(', ')}.`,
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Pre-emptive protocols activated! Dispatched automated rapid hydration teams to ${predictive48hAnalysis.affectedCohorts[0]}. Registered statutory audit event.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 8000);
  }, [predictive48hAnalysis]);

  // Scroll smoothly to Forecast / Trend Chart
  const handleScrollToForecastChart = useCallback(() => {
    const el = document.getElementById('anomaly-trend-30d-card') || document.getElementById('incident-projection-chart-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-rose-500', 'transition-all');
      setTimeout(() => el.classList.remove('ring-2', 'ring-rose-500'), 3000);
    }
  }, []);

  // Real-Time Notification Toast System State
  const [activeToasts, setActiveToasts] = useState<ThresholdBreachToast[]>([]);
  const [criticalAnomalyToasts, setCriticalAnomalyToasts] = useState<CriticalAnomalyToastData[]>([]);
  const [toastSoundEnabled, setToastSoundEnabled] = useState<boolean>(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setIsExportMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        setIsToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const lastCriticalToastTimestampsRef = useRef<Record<string, number>>({});

  const handleDismissCriticalToast = useCallback((id: string) => {
    setCriticalAnomalyToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearAllCriticalToasts = useCallback(() => {
    setCriticalAnomalyToasts([]);
  }, []);

  const handleAcknowledgeCriticalToast = useCallback((id: string) => {
    setCriticalAnomalyToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, acknowledged: true } : t))
    );
    setProtocolActiveNotice('Population health anomaly notification acknowledged by safety supervisor.');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, []);

  const handleDispatchActionForCriticalToast = useCallback((toast: CriticalAnomalyToastData) => {
    const newDispatch: MedicalDispatchNotification = {
      id: generateUniqueId('DSP-CRIT'),
      alertId: toast.anomalyId || toast.id,
      zone: toast.zoneName,
      severity: toast.riskTier === 'HIGH_RISK' ? 'HIGH' : 'CRITICAL',
      recipientRole: 'On-Site Rapid Cooling Evacuation Team',
      contactMethod: 'DUAL_CHANNEL',
      recipientPhone: '+1 (555) 911-CRIT',
      messagePayload: `POPULATION HEALTH ANOMALY EVACUATION [${toast.department}]: ${toast.anomalyMetric} detected with ${toast.confidenceLevelFormatted} confidence. Directive: ${toast.recommendedAction}`,
      stagedAt: 'Just now',
      status: 'STAGED'
    };
    setMedicalDispatches((prev) => [newDispatch, ...prev]);
    setCriticalAnomalyToasts((prev) =>
      prev.map((t) => (t.id === toast.id ? { ...t, acknowledged: true, dispatched: true } : t))
    );
    setProtocolActiveNotice(
      `Priority Medical dispatch staged for population health anomaly in ${toast.department} (${toast.zoneName}) at ${toast.confidenceLevelFormatted} confidence.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 6000);
  }, []);

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
      riskTier?: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK';
      riskProbability?: number;
      attributions?: Record<string, number>;
      cohortCount?: number;
      force?: boolean;
      // Kalman Filter Model specific properties
      kalmanSmoothedValue?: string;
      rawMeasuredValue?: string;
      kalmanStatus?: string;
      kalmanGain?: number;
      processVarianceQ?: number;
      measurementVarianceR?: number;
    }) => {
      const now = Date.now();
      const zoneKey = params.locationZone || 'default';
      const lastTrigger = lastCriticalToastTimestampsRef.current[zoneKey] || 0;
      if (!params.force && now - lastTrigger < 8000) return; // 8-second cooldown for background stream
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

      const toastId = `POP-HEALTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timeFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const effectiveRiskTier = params.riskTier || (confScore >= 0.75 ? 'CRITICAL_RISK' : 'HIGH_RISK');

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
        cohortCount: params.cohortCount || 18,
        privacyNotice: params.privacyNotice || 'k-Anonymity Verified (N >= 12) & ε=0.5 Differential Privacy',
        createdAt: now,
        autoDismissMs: effectiveRiskTier === 'CRITICAL_RISK' ? 14000 : 10000,
        acknowledged: false,
        riskTier: effectiveRiskTier,
        riskProbability: params.riskProbability ?? confScore,
        attributions: params.attributions,
        kalmanSmoothedValue: params.kalmanSmoothedValue,
        rawMeasuredValue: params.rawMeasuredValue,
        kalmanStatus: params.kalmanStatus,
        kalmanGain: params.kalmanGain,
        processVarianceQ: params.processVarianceQ,
        measurementVarianceR: params.measurementVarianceR
      };

      setCriticalAnomalyToasts((prev) => [newToast, ...prev].slice(0, 4));

      // Trigger Browser-Based Desktop Alert when tabbed out (or forced)
      if (effectiveRiskTier === 'CRITICAL_RISK') {
        desktopNotificationService.notifyAnomaly({
          id: newToast.id,
          title: `🚨 CRITICAL ANOMALY: ${newToast.department}`,
          body: `Zone: ${newToast.zoneName}\nMetric: ${newToast.anomalyMetric} (${newToast.measuredValue})\nAction: ${newToast.recommendedAction}`,
          severity: 'CRITICAL',
          zone: newToast.zoneName,
          metric: `${newToast.anomalyMetric} (${newToast.measuredValue})`,
          timestamp: newToast.timestamp,
          actionRequired: newToast.recommendedAction
        });

        // Record HIPAA-compliant access & alert review event
        systemComplianceService.logEvent({
          accessorId: 'SYS-AUTOPILOT-01',
          accessorName: 'Prognosticator AI Core & Safety Sentinel',
          accessorRole: 'Autonomous Health Surveillance Core',
          department: newToast.department,
          reportName: `Critical Anomaly Telemetry Dossier (${newToast.zoneName})`,
          reportType: 'BIOMETRIC_TELEMETRY',
          accessAction: 'VIEWED_STREAM',
          hipaaClassification: 'HIPAA §164.312(b) Audit Controls & Real-Time Alert Review',
          privacyShieldMetric: {
            epsilonConsumed: 0.05,
            kAnonymityCount: newToast.cohortCount || 18,
            laplaceNoiseBudgetRemaining: 2.85,
            status: 'COMPLIANT_AUTHORIZED'
          },
          dataSubjectCount: newToast.cohortCount || 18,
          justification: `Urgent early-warning detection for ${newToast.anomalyMetric} in ${newToast.zoneName}.`,
          ipAddress: '10.240.8.14',
          terminalId: 'OPS-MGR-TERMINAL-1'
        });
      }

      if (toastSoundEnabled && !isAlertsMuted) {
        const chimeSev = effectiveRiskTier === 'HIGH_RISK' ? 'HIGH' : 'CRITICAL';
        voiceAlertService.playAlertChime(chimeSev, voiceSettings.severityAudioToggles);
      }

      // Voice Alert SpeechSynthesis for New Critical Health Anomalies (Accessibility Mode)
      if (voiceSettings.enabled && !isAlertsMuted) {
        if (effectiveRiskTier === 'CRITICAL_RISK' || !voiceSettings.announceCriticalOnly) {
          const zoneClean = (newToast.zoneName || 'Monitored Facility').replace(/-/g, ' ');
          const spokenText = `Priority One Critical Health Anomaly detected in ${newToast.department}, ${zoneClean}. Hazard: ${newToast.anomalyMetric}. Required directive: ${newToast.recommendedAction}`;
          voiceAlertService.speakRawText(spokenText, voiceSettings);
        }
      }
    },
    [toastSoundEnabled, isAlertsMuted, voiceSettings]
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
        voiceAlertService.playAlertChime('HIGH', voiceSettings.severityAudioToggles);
      }
    },
    [peakForecastedSma, proactiveRiskThreshold, selectedZone, zones, toastSoundEnabled, voiceSettings.severityAudioToggles]
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

      // 7. Thermal Work Limit (TWL) Dropping Below Safety Threshold
      const twl = pt.twl_index;
      const twlFloor = healthThresholds.minTwlIndex ?? 115;
      if (twl !== undefined && twl < twlFloor) {
        const delta = Number((twlFloor - twl).toFixed(0));
        const sev: 'CRITICAL' | 'HIGH' = twl <= 95 ? 'CRITICAL' : 'HIGH';
        evaluateSignal(
          'twl',
          'Thermal Work Limit (TWL) Dropped Below Safety Threshold',
          twl,
          twlFloor,
          'W/m²',
          true,
          sev,
          `-${delta} W/m² (-${Math.round((delta / twlFloor) * 100)}%)`,
          'TWL index fell below safe thermal limit. Mandate immediate 15-minute shaded cooling rotation and oral electrolyte rehydration.',
          sev === 'CRITICAL' ? 14000 : 9000
        );
      }

      // 8. Workforce Physiological Health Score Dropping Below Safe Homeostasis Floor
      const healthHomeostasisScore = Math.max(
        0,
        Math.min(100, Math.round(100 - risk * 0.45 - Math.max(0, 65 - pt.smoothed_hrv) * 0.7 - Math.max(0, 130 - (pt.twl_index ?? 140)) * 0.2))
      );
      if (healthHomeostasisScore < 65) {
        const delta = 65 - healthHomeostasisScore;
        evaluateSignal(
          'riskScore',
          'Workforce Health Index Dropped Below Safety Threshold',
          healthHomeostasisScore,
          65,
          '%',
          true,
          healthHomeostasisScore <= 45 ? 'CRITICAL' : 'HIGH',
          `-${delta}% below homeostasis floor`,
          'Severe cumulative physiological strain detected across cohort. Dispatch field safety officer to conduct wellness triage.',
          10000
        );
      }

      if (newToasts.length > 0) {
        setActiveToasts((prev) => [...newToasts, ...prev].slice(0, 8));
        if (toastSoundEnabled) {
          const maxSev = newToasts.some((t) => t.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH';
          voiceAlertService.playAlertChime(maxSev, voiceSettings.severityAudioToggles);
        }
      }
    },
    [healthThresholds, toastSoundEnabled, voiceSettings.severityAudioToggles]
  );

  // Computed live active breaches against Global Threshold Settings
  const activeSignalBreaches = useMemo<ActiveSignalBreach[]>(() => {
    const latest = telemetryStream[telemetryStream.length - 1];
    if (!latest) return simulatedBreaches;

    const breaches: ActiveSignalBreach[] = [];
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Heart Rate (Pulse BPM)
    const hr = latest.heart_rate_bpm ?? Math.round(72 + (68 - latest.smoothed_hrv) * 1.25);
    const hrLimit = healthThresholds.maxHeartRateBpm ?? 120;
    if (hr > hrLimit) {
      const delta = hr - hrLimit;
      const id = `breach-hr-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'heartRate',
        signalName: 'Heart Rate (Pulse BPM) Exceeded',
        measuredValue: hr,
        measuredFormatted: `${hr} BPM`,
        thresholdLimit: hrLimit,
        thresholdFormatted: `≤ ${hrLimit} BPM Ceiling [${globalSensitivity}]`,
        unit: 'BPM',
        deltaFormatted: `+${delta} BPM (+${Math.round((delta / hrLimit) * 100)}%)`,
        severity: delta >= 15 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Mandate immediate shaded cooling shelter rotation and electrolyte hydration.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 2. Autonomic HRV Floor (ms)
    const hrv = latest.smoothed_hrv;
    const hrvFloor = healthThresholds.minHrvMs;
    if (hrv < hrvFloor) {
      const delta = Number((hrvFloor - hrv).toFixed(1));
      const id = `breach-hrv-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'hrv',
        signalName: 'Autonomic HRV Collapse (Vagal Tone Depletion)',
        measuredValue: hrv,
        measuredFormatted: `${hrv} ms`,
        thresholdLimit: hrvFloor,
        thresholdFormatted: `≥ ${hrvFloor} ms Floor [${globalSensitivity}]`,
        unit: 'ms',
        deltaFormatted: `-${delta} ms (-${Math.round((delta / hrvFloor) * 100)}%)`,
        severity: hrv <= 32 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Critical autonomic strain detected. Direct worker to immediate medical rest break.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 3. Core / Surface Skin Temperature (°C)
    const skin = latest.skin_temp_c;
    const skinLimit = healthThresholds.maxSkinTempC;
    if (skin > skinLimit) {
      const delta = Number((skin - skinLimit).toFixed(2));
      const id = `breach-skin-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'skinTemp',
        signalName: 'Worker Surface Skin Temperature Ceiling Exceeded',
        measuredValue: skin,
        measuredFormatted: `${skin}°C`,
        thresholdLimit: skinLimit,
        thresholdFormatted: `≤ ${skinLimit}°C Ceiling [${globalSensitivity}]`,
        unit: '°C',
        deltaFormatted: `+${delta}°C`,
        severity: delta >= 0.7 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Direct worker to active air-conditioned recovery bay; check for heat exhaustion.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 4. Ambient Wet-Bulb WBGT Heat (°C)
    const amb = latest.ambient_temp_c;
    const ambLimit = healthThresholds.maxAmbientHeatC;
    if (amb > ambLimit) {
      const delta = Number((amb - ambLimit).toFixed(1));
      const id = `breach-amb-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'ambientTemp',
        signalName: 'Ambient WBGT Heat Ceiling Exceeded',
        measuredValue: amb,
        measuredFormatted: `${amb}°C`,
        thresholdLimit: ambLimit,
        thresholdFormatted: `≤ ${ambLimit}°C Ceiling [${globalSensitivity}]`,
        unit: '°C',
        deltaFormatted: `+${delta}°C`,
        severity: delta >= 2.5 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Activate industrial misting blowers and mandate 15min rest rotation per OSHA.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 5. Thermal Work Limit (TWL in W/m²)
    const twl = latest.twl_index;
    const twlFloor = healthThresholds.minTwlIndex ?? 115;
    if (twl !== undefined && twl < twlFloor) {
      const delta = Number((twlFloor - twl).toFixed(0));
      const id = `breach-twl-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'twl',
        signalName: 'Thermal Work Limit (TWL) Below Safe Floor',
        measuredValue: twl,
        measuredFormatted: `${twl} W/m²`,
        thresholdLimit: twlFloor,
        thresholdFormatted: `≥ ${twlFloor} W/m² Floor [${globalSensitivity}]`,
        unit: 'W/m²',
        deltaFormatted: `-${delta} W/m²`,
        severity: twl <= 95 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Severe metabolic heat deficit. Enforce mandatory rest and chilled fluid replenishment.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 6. Acoustic Noise (dBA)
    const noise = latest.smoothed_noise_db ?? latest.noise_db ?? 75;
    const noiseLimit = healthThresholds.maxNoiseDb;
    if (noise > noiseLimit) {
      const delta = Number((noise - noiseLimit).toFixed(1));
      const id = `breach-noise-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'noise',
        signalName: 'Acoustic Machinery Overpressure Breach',
        measuredValue: noise,
        measuredFormatted: `${noise} dBA`,
        thresholdLimit: noiseLimit,
        thresholdFormatted: `≤ ${noiseLimit} dBA Ceiling [${globalSensitivity}]`,
        unit: 'dBA',
        deltaFormatted: `+${delta} dBA`,
        severity: delta >= 10 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Inspect dual-layer hearing protection and verify acoustic barrier seals.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    // 7. Composite Risk Score (%)
    const risk = latest.risk_score;
    const riskCutoff = healthThresholds.riskScoreCutoffPct;
    if (risk > riskCutoff) {
      const delta = Number((risk - riskCutoff).toFixed(1));
      const id = `breach-risk-${selectedZone}`;
      breaches.push({
        id,
        signalKey: 'riskScore',
        signalName: 'Multidimensional Risk Score Cutoff Exceeded',
        measuredValue: risk,
        measuredFormatted: `${risk}%`,
        thresholdLimit: riskCutoff,
        thresholdFormatted: `≤ ${riskCutoff}% Cutoff [${globalSensitivity}]`,
        unit: '%',
        deltaFormatted: `+${delta}%`,
        severity: risk >= 85 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'LSTM Autoencoder flagged high multi-signal reconstruction error. Safety triage deployed.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: acknowledgedBreachIds.has(id)
      });
    }

    const unackSimulated = simulatedBreaches.filter((s) => !acknowledgedBreachIds.has(s.id));
    return [...unackSimulated, ...breaches];
  }, [telemetryStream, healthThresholds, globalSensitivity, selectedZone, activeZoneObj, acknowledgedBreachIds, simulatedBreaches]);

  const activeBreachSignalKeys = useMemo(() => {
    return activeSignalBreaches.filter((b) => !b.acknowledged).map((b) => b.signalKey);
  }, [activeSignalBreaches]);

  const handleAcknowledgeSignalBreach = (id: string) => {
    setAcknowledgedBreachIds((prev) => new Set([...prev, id]));
    setActiveToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, acknowledged: true } : t))
    );
    setProtocolActiveNotice('Health signal threshold breach visual alert acknowledged.');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  };

  const handleAcknowledgeAllSignalBreaches = () => {
    setAcknowledgedBreachIds(new Set(activeSignalBreaches.map((b) => b.id)));
    setActiveToasts((prev) => prev.map((t) => ({ ...t, acknowledged: true })));
    setProtocolActiveNotice('All active health signal threshold breach visual alerts acknowledged.');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  };

  const handleSimulateSignalBreachTest = (signalType: 'heartRate' | 'skinTemp' | 'hrv' | 'ambientTemp' | 'twl') => {
    const testId = `test-breach-${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let newBreach: ActiveSignalBreach;

    if (signalType === 'heartRate') {
      const val = (healthThresholds.maxHeartRateBpm ?? 120) + 16;
      newBreach = {
        id: testId,
        signalKey: 'heartRate',
        signalName: 'Simulated Pulse Tachycardia Breach',
        measuredValue: val,
        measuredFormatted: `${val} BPM`,
        thresholdLimit: healthThresholds.maxHeartRateBpm ?? 120,
        thresholdFormatted: `≤ ${healthThresholds.maxHeartRateBpm ?? 120} BPM [${globalSensitivity}]`,
        unit: 'BPM',
        deltaFormatted: `+16 BPM (+${Math.round((16 / (healthThresholds.maxHeartRateBpm ?? 120)) * 100)}%)`,
        severity: 'CRITICAL',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Immediate shaded rest and hydration protocol activated.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: false
      };
    } else if (signalType === 'skinTemp') {
      const val = Number((healthThresholds.maxSkinTempC + 0.85).toFixed(2));
      newBreach = {
        id: testId,
        signalKey: 'skinTemp',
        signalName: 'Simulated Core / Skin Surface Temperature Surge',
        measuredValue: val,
        measuredFormatted: `${val}°C`,
        thresholdLimit: healthThresholds.maxSkinTempC,
        thresholdFormatted: `≤ ${healthThresholds.maxSkinTempC}°C [${globalSensitivity}]`,
        unit: '°C',
        deltaFormatted: `+0.85°C`,
        severity: 'CRITICAL',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Direct worker cohort to misting cooling shelter.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: false
      };
    } else if (signalType === 'hrv') {
      const val = Math.max(18, healthThresholds.minHrvMs - 14);
      newBreach = {
        id: testId,
        signalKey: 'hrv',
        signalName: 'Simulated Autonomic HRV Vagal Collapse',
        measuredValue: val,
        measuredFormatted: `${val} ms`,
        thresholdLimit: healthThresholds.minHrvMs,
        thresholdFormatted: `≥ ${healthThresholds.minHrvMs} ms [${globalSensitivity}]`,
        unit: 'ms',
        deltaFormatted: `-14 ms (-${Math.round((14 / healthThresholds.minHrvMs) * 100)}%)`,
        severity: 'CRITICAL',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Autonomous nervous system fatigue detected. Immediate rest break.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: false
      };
    } else if (signalType === 'ambientTemp') {
      const val = Number((healthThresholds.maxAmbientHeatC + 3.2).toFixed(1));
      newBreach = {
        id: testId,
        signalKey: 'ambientTemp',
        signalName: 'Simulated Ambient WBGT Heat Spike',
        measuredValue: val,
        measuredFormatted: `${val}°C`,
        thresholdLimit: healthThresholds.maxAmbientHeatC,
        thresholdFormatted: `≤ ${healthThresholds.maxAmbientHeatC}°C [${globalSensitivity}]`,
        unit: '°C',
        deltaFormatted: `+3.2°C`,
        severity: 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Enforce 15-minute rotation cycles per OSHA heat stress standard.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: false
      };
    } else {
      const val = Math.max(80, (healthThresholds.minTwlIndex ?? 115) - 22);
      newBreach = {
        id: testId,
        signalKey: 'twl',
        signalName: 'Simulated Thermal Work Limit (TWL) Collapse',
        measuredValue: val,
        measuredFormatted: `${val} W/m²`,
        thresholdLimit: healthThresholds.minTwlIndex ?? 115,
        thresholdFormatted: `≥ ${healthThresholds.minTwlIndex ?? 115} W/m² [${globalSensitivity}]`,
        unit: 'W/m²',
        deltaFormatted: `-22 W/m²`,
        severity: 'CRITICAL',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        recommendedAction: 'Mandate immediate spot cooling and fluid replacement.',
        detectedAt: nowStr,
        timestamp: Date.now(),
        acknowledged: false
      };
    }

    setSimulatedBreaches((prev) => [newBreach, ...prev]);

    const toast: ThresholdBreachToast = {
      id: `TOAST-TEST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      signalKey: newBreach.signalKey,
      signalName: newBreach.signalName,
      measuredValue: newBreach.measuredValue,
      measuredFormatted: newBreach.measuredFormatted,
      thresholdLimit: newBreach.thresholdLimit,
      thresholdFormatted: newBreach.thresholdFormatted,
      unit: newBreach.unit,
      deltaFormatted: newBreach.deltaFormatted,
      severity: newBreach.severity,
      zoneId: newBreach.zoneId,
      zoneName: newBreach.zoneName,
      workerCount: activeZoneObj.count,
      recommendedAction: newBreach.recommendedAction,
      acknowledged: false,
      createdAt: Date.now(),
      autoDismissMs: 12000
    };
    setActiveToasts((prev) => [toast, ...prev].slice(0, 8));
    if (toastSoundEnabled && !isAlertsMuted) {
      voiceAlertService.playAlertChime(newBreach.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH', voiceSettings.severityAudioToggles);
    }
    setProtocolActiveNotice(`Visual alert triggered: ${newBreach.signalName} breached Global Threshold (${newBreach.measuredFormatted} vs ${newBreach.thresholdFormatted}).`);
    setTimeout(() => setProtocolActiveNotice(null), 6000);
  };

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
      if (!force && now - lastTriggered < 60000) return; // 60-second cooldown for background stream
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
        const mappedSev = alert.severity === 'WARNING' ? 'MODERATE' : alert.severity;
        voiceAlertService.playAlertChime(mappedSev, voiceSettings.severityAudioToggles);
      }
    },
    [toastSoundEnabled, voiceSettings.severityAudioToggles]
  );

  const handleDismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
    if (signalKey.includes('Sector') || signalKey.includes('Zone') || signalKey.includes('Line') || signalKey.includes('Hub') || signalKey.includes('Tunnel') || signalKey.toLowerCase().includes('kalman')) {
      const el = document.getElementById('kalman-predictive-model-30days-chart') || document.getElementById('historical-workforce-health-chart') || document.getElementById('telemetry-charts-card');
      el?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

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
      id: generateUniqueId('DSP-TOAST'),
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

  const handleSimulateHealthMetricDrop = (type: 'HRV' | 'TWL' | 'MULTI') => {
    const nowIso = new Date().toISOString();
    let pt: TelemetryDataPoint;
    if (type === 'HRV') {
      const smoothedHrv = Math.max(18, healthThresholds.minHrvMs - 9.5);
      pt = {
        timestamp: nowIso,
        timeLabel: 'Now (HRV Drop Alert)',
        smoothed_hrv: smoothedHrv,
        raw_hrv: Math.max(16, healthThresholds.minHrvMs - 12.0),
        hrv_drop_pct: 36.5,
        ambient_temp_c: 34.0,
        skin_temp_c: 37.0,
        raw_skin_temp: 37.1,
        smoothed_skin_temp: 37.0,
        heart_rate_bpm: 88,
        noise_db: 74,
        raw_noise_db: 75,
        smoothed_noise_db: 74,
        twl_index: 145,
        aqi: 46,
        sick_leave_rate_deviation: 0.05,
        risk_score: 68,
        is_anomaly: true
      };
      setProtocolActiveNotice(
        `Real-Time Alert Triggered: Worker HRV dropped below safety threshold (${pt.smoothed_hrv}ms vs ${healthThresholds.minHrvMs}ms safety floor). Toast warning dispatched.`
      );
    } else if (type === 'TWL') {
      const twlVal = Math.max(70, (healthThresholds.minTwlIndex ?? 115) - 20);
      pt = {
        timestamp: nowIso,
        timeLabel: 'Now (TWL Drop Alert)',
        smoothed_hrv: 52.0,
        raw_hrv: 49.5,
        hrv_drop_pct: 12.0,
        ambient_temp_c: 41.5,
        skin_temp_c: 37.7,
        raw_skin_temp: 37.9,
        smoothed_skin_temp: 37.7,
        heart_rate_bpm: 96,
        noise_db: 78,
        raw_noise_db: 79,
        smoothed_noise_db: 78,
        twl_index: twlVal,
        aqi: 54,
        sick_leave_rate_deviation: 0.07,
        risk_score: 72,
        is_anomaly: true
      };
      setProtocolActiveNotice(
        `Real-Time Alert Triggered: Thermal Work Limit (TWL) dropped below safety threshold (${pt.twl_index} W/m² vs ${healthThresholds.minTwlIndex} W/m² limit). Toast warning dispatched.`
      );
    } else {
      pt = {
        timestamp: nowIso,
        timeLabel: 'Now (Multi-Metric Drop)',
        smoothed_hrv: Math.max(18, healthThresholds.minHrvMs - 12.0),
        raw_hrv: Math.max(15, healthThresholds.minHrvMs - 14.0),
        hrv_drop_pct: 42.0,
        ambient_temp_c: 42.5,
        skin_temp_c: 38.2,
        raw_skin_temp: 38.4,
        smoothed_skin_temp: 38.2,
        heart_rate_bpm: (healthThresholds.maxHeartRateBpm ?? 115) + 8,
        noise_db: 84,
        raw_noise_db: 86,
        smoothed_noise_db: 84,
        twl_index: Math.max(65, (healthThresholds.minTwlIndex ?? 115) - 25),
        aqi: 68,
        sick_leave_rate_deviation: 0.15,
        risk_score: 90,
        is_anomaly: true
      };
      setProtocolActiveNotice(
        'Critical Real-Time Alert Triggered: Multiple workforce health metrics dropped below safety thresholds! Warning toasts active.'
      );
    }
    checkReadingForThresholdBreaches(pt, activeZoneObj, true);
    setTimeout(() => setProtocolActiveNotice(null), 8000);
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

  // Download CSV of current workforce telemetry data for offline analysis
  const handleDownloadWorkforceTelemetryCsv = useCallback(() => {
    try {
      const res = exportWorkforceHealthCsv(
        telemetryStream,
        activeZoneObj.name,
        healthThresholds
      );

      // Record statutory audit log entry
      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-CSV'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: 'Workforce Telemetry Data Exporter',
        parameter: 'Workforce Telemetry CSV Export',
        previousValue: 'Live In-Memory Stream',
        newValue: `Exported ${res.recordCount} telemetry records to ${res.filename}`,
        justification: 'Exported current workforce health and multi-signal telemetry dataset as RFC 4180 CSV for offline occupational health analysis.',
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `Workforce telemetry data exported to CSV (${res.recordCount} records): ${res.filename}`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
    } catch (err: any) {
      console.error('Workforce CSV export failed:', err);
      setProtocolActiveNotice('Failed to export workforce CSV: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setProtocolActiveNotice(null), 5000);
    }
  }, [telemetryStream, activeZoneObj, healthThresholds]);

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

  // Export current dashboard state as CSV for reporting purposes
  const handleExportDashboardCsv = useCallback(() => {
    try {
      const currentActiveZone = zones.find((z) => z.id === selectedZone) || zones[0];
      const res = exportDashboardDataCsv({
        zones,
        activeAlerts,
        telemetryStream,
        currentZone: currentActiveZone,
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor'
      });

      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-DASH-CSV'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: 'Dashboard Data CSV Export Engine',
        parameter: 'Comprehensive Dashboard Data CSV',
        previousValue: 'N/A',
        newValue: `Exported full dashboard state (${res.recordCount} entries) to CSV: ${res.filename}`,
        justification: 'Exported comprehensive current dashboard telemetry, zone KPI summaries, and active anomaly alerts to RFC 4180 CSV for site safety meetings and offline analysis.',
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `Current dashboard data exported to CSV (${res.recordCount} records): ${res.filename}`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
    } catch (err: any) {
      console.error('Failed to export dashboard CSV:', err);
      setProtocolActiveNotice('Dashboard CSV export failed: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setProtocolActiveNotice(null), 5000);
    }
  }, [zones, activeAlerts, telemetryStream, selectedZone]);

  // Dispatches clean print stylesheet for site safety briefings
  const handlePrintDashboard = useCallback(() => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print blocked by iframe context:', err);
    }
  }, []);

  // Formal Comprehensive Telemetry PDF Report utilizing print-friendly styles
  const handleDownloadPdfReport = useCallback(() => {
    const previousTitle = document.title;
    const dateFormatted = new Date().toISOString().split('T')[0];
    const currentZone = zones.find((z) => z.id === selectedZone) || activeZoneObj;
    const formalTitle = `Prognosticator_Workforce_Health_Telemetry_Report_${currentZone?.id || 'Facility'}_${dateFormatted}`;
    document.title = formalTitle;

    setProtocolActiveNotice(
      'Generating comprehensive telemetry PDF report using print-friendly styles. Choose "Save as PDF" in the destination dialog.'
    );

    // Record compliance audit log for formal report generation
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-PDF'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Safety Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Print-Friendly Telemetry PDF Engine',
      parameter: 'Comprehensive Telemetry Dossier PDF',
      previousValue: 'N/A',
      newValue: `Generated comprehensive telemetry PDF report: ${formalTitle}.pdf`,
      justification: 'Utilized existing print-friendly stylesheet to render comprehensive workforce telemetry data, Kalman filtering model parameters, and active anomaly logs for regulatory inspection and site safety meetings.',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    // Record statutory HIPAA / OSHA compliance access event
    systemComplianceService.logEvent({
      accessorId: 'USR-MGR-2026',
      accessorName: 'Alex Mercer',
      accessorRole: 'EHS Safety Supervisor',
      department: currentZone.name,
      reportName: 'Comprehensive Workforce Health Telemetry Report',
      reportType: 'POPULATION_HEALTH_EPIDEMIOLOGY',
      accessAction: 'EXPORTED_PDF',
      hipaaClassification: 'HIPAA §164.312(b) Audit Controls & Regulatory Inspection',
      privacyShieldMetric: {
        epsilonConsumed: 0.05,
        kAnonymityCount: currentZone.count || 18,
        laplaceNoiseBudgetRemaining: 2.80,
        status: 'COMPLIANT_AUTHORIZED'
      },
      dataSubjectCount: currentZone.count || 18,
      justification: 'Generated comprehensive PDF report of current telemetry data utilizing print-friendly styles.',
      ipAddress: '10.240.8.14',
      terminalId: 'OPS-MGR-TERMINAL-1'
    });

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('Print blocked by iframe context:', err);
      }
      setTimeout(() => {
        document.title = previousTitle;
        setProtocolActiveNotice('Comprehensive Telemetry PDF Report generated successfully.');
        setTimeout(() => setProtocolActiveNotice(null), 5000);
      }, 1500);
    }, 250);
  }, [selectedZone, zones, activeZoneObj]);

  // Alias for backward compatibility
  const handleExportToPdfWithPrintStyles = handleDownloadPdfReport;

  // Trigger realistic Kalman filtering health anomaly simulation & toast alert
  const triggerKalmanAnomalySimulation = useCallback((customZone?: FacilityZone) => {
    const targetZone = customZone || activeZoneObj;
    const rawHrv = 30.8;
    const smoothedHrv = 34.2;
    const rawTemp = 38.65;
    const smoothedTemp = 38.20;
    const heartRate = 138;
    const mse = 0.412;
    const riskProb = 0.924;

    triggerCriticalAnomalyNotification({
      department: targetZone.name.includes('Construction') ? 'Civil & Structural Construction' : 'Industrial Operations Division',
      confidenceLevel: riskProb,
      riskProbability: riskProb,
      riskTier: 'CRITICAL_RISK',
      locationZone: targetZone.name,
      zoneId: targetZone.id,
      cohortCount: targetZone.count,
      workerPseudonym: `W-${Math.floor(1000 + Math.random() * 9000)}`,
      anomalyMetric: 'Acute Autonomic & Core Temperature Strain (Kalman Innovation Exceeded)',
      measuredValue: `State Estimate Prob: 92.4% (MSE: 0.412, HR: ${heartRate} BPM)`,
      rawMeasuredValue: `Raw HRV: ${rawHrv}ms, Skin Temp: ${rawTemp}°C (Jitter: ±7.4ms)`,
      kalmanSmoothedValue: `HRV: ${smoothedHrv}ms, Skin: ${smoothedTemp}°C (P_k|k = 0.024)`,
      kalmanStatus: 'Recursive Jitter Filtered & State Drift Validated',
      thresholdLimit: `HRV Min ${targetZone.customBaselines?.baselineHrv || 60}ms, Skin Max ${healthThresholds.maxSkinTempC}°C`,
      reconstructionMse: mse,
      recommendedAction: 'Immediate shaded cooling extraction; stage rapid oral rehydration and medical dispatch liaison.',
      privacyNotice: `k-Anonymity Cleared (N=${targetZone.count} ≥ 12) & ε=0.5 Differential Privacy Shield`,
      attributions: {
        'Heart Rate Variability (HRV) Collapse': 0.42,
        'Thermal Heat Index Load': 0.31,
        'Skin Temperature Elevation': 0.18,
        'Sleep Debt Cumulative Fatigue': 0.09
      },
      force: true
    });

    setProtocolActiveNotice(
      `Kalman model anomaly triggered for ${targetZone.name}. Visual toast notification dispatched.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, [activeZoneObj, healthThresholds, triggerCriticalAnomalyNotification]);

  // Handle successful safety committee PDF generation & log statutory audit record
  const handleSafetyCommitteeExportSuccess = useCallback((filename: string) => {
    setProtocolActiveNotice(`Safety Committee PDF Report successfully generated & downloaded: ${filename}`);
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-JHSC'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Safety Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Safety Committee PDF Report Engine',
      parameter: 'Offline Review Dossier PDF',
      previousValue: 'N/A',
      newValue: `Generated safety committee PDF report: ${filename}`,
      justification: 'Exported current dashboard statistics as a formal PDF report for offline review by the Joint Health & Safety Committee (JHSC).',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);
    setTimeout(() => setProtocolActiveNotice(null), 6000);
  }, []);

  // Direct export of current dashboard statistics as a PDF report for offline safety committee review
  const handleDirectSafetyCommitteePdfExport = useCallback(async () => {
    try {
      const currentZone = zones.find((z) => z.id === selectedZone) || zones[0];
      setProtocolActiveNotice('Compiling current dashboard statistics for safety committee offline review...');
      const res = await generateSafetyCommitteePdfReport({
        activeAlerts,
        currentZone,
        zones,
        telemetryStream,
        healthThresholds,
        kalmanConfig
      });
      handleSafetyCommitteeExportSuccess(res.filename);
    } catch (err: any) {
      console.error('Failed to export safety committee PDF:', err);
      setProtocolActiveNotice('Direct generation failed, opening Safety Committee export dialog.');
      setIsSafetyCommitteePdfModalOpen(true);
    }
  }, [zones, selectedZone, activeAlerts, telemetryStream, healthThresholds, kalmanConfig, handleSafetyCommitteeExportSuccess]);

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

  // Compile and download comprehensive 2-page PDF summary report of current dashboard metrics and active anomalies
  const handleDownloadDashboardSummaryPdf = async () => {
    setIsGeneratingSummaryPdf(true);
    setProtocolActiveNotice('Compiling current dashboard metrics and active anomalies into PDF summary report...');
    try {
      const filename = await generateDashboardSummaryPdfReport({
        activeAlerts,
        currentZone: activeZoneObj,
        zones,
        telemetryStream,
        annotations: chartAnnotationService.getAnnotations(),
        supervisorName: 'Alex Mercer (Safety Compliance Lead)',
        activeRole:
          activeRole === 'SAFETY_OFFICER'
            ? 'Safety Compliance Officer'
            : activeRole === 'MAINTENANCE_CREW'
            ? 'Maintenance Crew Lead'
            : 'Site Operations Lead',
        onProgress: (msg) => setProtocolActiveNotice(msg)
      });
      setProtocolActiveNotice(`Dashboard summary PDF report generated and downloaded: ${filename}`);
      setTimeout(() => setProtocolActiveNotice(null), 8000);
    } catch (err: any) {
      console.error('Failed to generate dashboard summary PDF:', err);
      setProtocolActiveNotice(`PDF summary generation failed: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setProtocolActiveNotice(null), 8000);
    } finally {
      setIsGeneratingSummaryPdf(false);
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
        id: generateUniqueId('AUD-EXP'),
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
        id: generateUniqueId('AUD-EVT'),
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

  // Derive effective stream toggles combining local floor plan settings with global signal category filters
  const effectiveStreamToggles = useMemo<SensorStreamToggles>(() => {
    return {
      ambientTemp: streamToggles.ambientTemp && signalCategories.environmental && granularSignals.ambientTemp,
      noiseDb: streamToggles.noiseDb && signalCategories.environmental && granularSignals.noise,
      hrvDrop: streamToggles.hrvDrop && signalCategories.cardiac && granularSignals.hrvDrop,
      skinTemp: streamToggles.skinTemp && signalCategories.environmental && granularSignals.skinTemp,
      twlHeatStrain: streamToggles.twlHeatStrain && signalCategories.environmental && granularSignals.twl,
      aqiAirQuality: streamToggles.aqiAirQuality && signalCategories.environmental && granularSignals.aqi,
      riskScore: streamToggles.riskScore && signalCategories.performance && granularSignals.riskScore
    };
  }, [streamToggles, signalCategories, granularSignals]);

  // System Audit Log State (Manual changes to thresholds & zone configs)
  const [systemAuditLogs, setSystemAuditLogs] = useState<SystemAuditLogEntry[]>(INITIAL_SYSTEM_AUDIT_LOGS);

  const handleAddManualAuditLog = (newEntry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>) => {
    const entry: SystemAuditLogEntry = {
      ...newEntry,
      id: generateUniqueId('AUD-MAN'),
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

  const pendingCriticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const stagedDispatchCount = medicalDispatches.filter((d) => d.status === 'STAGED').length;

  // ==========================================
  // Department-Specific Custom Risk Score Thresholds State
  // ==========================================
  const [departmentRiskThresholds, setDepartmentRiskThresholds] = useState<DepartmentRiskThreshold[]>(
    DEFAULT_DEPARTMENT_RISK_THRESHOLDS
  );

  // Computed department threshold breaches for Notification Center alert badge
  const departmentThresholdBreaches = useMemo(() => {
    return departmentRiskThresholds
      .filter((d) => d.currentRiskScore > d.thresholdPct)
      .map((d) => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        currentRisk: d.currentRiskScore,
        threshold: d.thresholdPct,
        facilityLocation: d.facilityLocation
      }));
  }, [departmentRiskThresholds]);

  const handleSaveDepartmentThresholds = useCallback(
    (updated: DepartmentRiskThreshold[], justification: string) => {
      setDepartmentRiskThresholds(updated);
      const breachedCount = updated.filter((d) => d.currentRiskScore > d.thresholdPct).length;
      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-DTH'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Lead Supervisor',
        category: 'THRESHOLD_CHANGE',
        targetModule: 'Department Risk Score Thresholds',
        parameter: 'Custom Division Risk Cutoffs',
        previousValue: 'Previous Threshold Configuration',
        newValue: `Configured ${updated.length} department thresholds (${breachedCount} exceeding limit)`,
        justification: justification || 'Audited adjustment of department-specific risk score threshold parameters.',
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `Department risk score thresholds saved to audit log! ${breachedCount} department(s) currently exceed configured thresholds.`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
    },
    []
  );

  const handleResetDepartmentThresholds = useCallback(() => {
    setDepartmentRiskThresholds(DEFAULT_DEPARTMENT_RISK_THRESHOLDS);
    setProtocolActiveNotice('Department risk score thresholds restored to default levels (Balanced 75%).');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, []);

  // Simulated CSV Export of Current Anomaly Telemetry Data Formatted for Enterprise Reporting Compliance
  const handleSimulatedComplianceCsvExport = useCallback(() => {
    const res = serializeCurrentAnomalyDataToCsvAndDownload(activeAlerts, activeZoneObj, {
      auditStandard: 'ISO 45001:2018 / OSHA 1910 Compliance Framework',
      userName: 'Alex Mercer (EHS Safety Supervisor)'
    });

    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-CSV'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Lead Supervisor',
      category: 'REPORT_EXPORT',
      targetModule: 'Enterprise Anomaly Telemetry Export',
      parameter: 'Compliance CSV Export',
      previousValue: 'N/A',
      newValue: `Exported ${res.recordCount} anomaly telemetry records: ${res.filename}`,
      justification: 'Simulated compliance CSV export for enterprise safety audit and statutory reporting.',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    setProtocolActiveNotice(
      `Simulated enterprise compliance CSV exported successfully (${res.recordCount} telemetry records, ISO 45001 / OSHA 1910). File: ${res.filename}`
    );
    setTimeout(() => setProtocolActiveNotice(null), 7000);
  }, [activeAlerts, activeZoneObj]);

  // Test Anomaly Random Injection Handler for Testing Response Workflows
  const handleInjectTestAnomaly = useCallback(() => {
    const testTemplates: Array<{
      metric: string;
      raw: string;
      smoothed: string;
      severity: 'CRITICAL' | 'HIGH';
      leadTime: string;
      action: string;
      alertType: 'HEALTH_ANOMALY' | 'PREDICTIVE_MAINTENANCE';
      preferredZone?: string;
    }> = [
      {
        metric: 'Acute Autonomic & Core Thermal Strain',
        raw: 'HRV: 26.4 ms (±7ms), Skin: 38.6°C, TWL: 84 W/m²',
        smoothed: 'HRV: 29.8 ms, Skin: 38.3°C',
        severity: 'CRITICAL',
        leadTime: '2.5h Prior to Syncope',
        action: 'Immediate extraction: Escort cohort member to air-conditioned shelter, administer 500ml oral electrolyte rehydration.',
        alertType: 'HEALTH_ANOMALY',
        preferredZone: 'Outdoor-Construction-Sector-4'
      },
      {
        metric: 'Predictive Maintenance: High-Frequency Bearing Cavitation',
        raw: 'Vibration: 8.6 mm/s RMS, Casing Heat: 92.4°C',
        smoothed: 'Vibration: 8.1 mm/s, Casing Heat: 89.8°C',
        severity: 'CRITICAL',
        leadTime: '3.8h Prior to Motor Seizure',
        action: 'Throttle line speed by 35%; stage predictive vibration inspection & auxiliary lubrication flush.',
        alertType: 'PREDICTIVE_MAINTENANCE',
        preferredZone: 'Outdoor-Construction-Sector-4'
      },
      {
        metric: 'Acoustic Machinery Overpressure Spike',
        raw: 'Peak: 106.8 dBA raw / Leq: 98.4 dBA',
        smoothed: 'Leq: 96.2 dBA smoothed',
        severity: 'HIGH',
        leadTime: 'Immediate Noise Dose Limit Breach',
        action: 'Deploy secondary Class 5 ear defenders to zone cohort; rotate workers out of compressor perimeter.',
        alertType: 'HEALTH_ANOMALY',
        preferredZone: 'Outdoor-Construction-Sector-4'
      },
      {
        metric: 'Cardiovascular Autonomic Collapse Under Heavy Exertion',
        raw: 'Heart Rate: 154 BPM, HRV: 22.8 ms, Exertion Load: 94%',
        smoothed: 'Heart Rate: 148 BPM, HRV: 25.4 ms',
        severity: 'CRITICAL',
        leadTime: '1.5h Prior to Heat Stroke',
        action: 'Direct worker to shaded cooling shelter; stage on-site medical dispatch triage assessment.',
        alertType: 'HEALTH_ANOMALY',
        preferredZone: 'Manufacturing-Assembly-Line-B'
      },
      {
        metric: 'Confined Space Atmospheric Inversion & Oxygen Depletion',
        raw: 'O2 Level: 18.6%, VOC: 48 ppm, Heat Index: 39.8°C',
        smoothed: 'O2: 18.9%, VOC: 44 ppm',
        severity: 'CRITICAL',
        leadTime: 'Immediate Evacuation Threshold',
        action: 'Evacuate utility trench cohort; initiate forced explosion-proof fresh air ventilation.',
        alertType: 'HEALTH_ANOMALY',
        preferredZone: 'Subgrade-Tunnel-Conduit-7'
      },
      {
        metric: 'Conveyor Drive Harmonic Distortion & Gearbox Chatter',
        raw: 'THD: 15.2%, Current Imbalance: 8.4%, Vib: 6.8 mm/s',
        smoothed: 'THD: 13.8%, Vib: 6.4 mm/s',
        severity: 'HIGH',
        leadTime: '4.5h Prior to Inverter Trip',
        action: 'Engage active harmonic filtering; inspect drive belt tension and motor shaft alignment.',
        alertType: 'PREDICTIVE_MAINTENANCE',
        preferredZone: 'Warehouse-Logistics-Hub-North'
      }
    ];

    const pick = testTemplates[Math.floor(Math.random() * testTemplates.length)];
    const randomWorkerNum = Math.floor(Math.random() * 8999 + 1000);
    const workerId = pick.alertType === 'PREDICTIVE_MAINTENANCE' ? `EQUIP-DRIVE-${Math.floor(Math.random() * 8 + 1)}` : `W-${randomWorkerNum}`;
    const targetZone = pick.preferredZone || activeZoneObj.name;
    const testId = generateUniqueId('ALR-TEST');

    const newAlert: ActiveAnomalyAlert = {
      id: testId,
      worker_id: workerId,
      location_zone: targetZone,
      detected_at: 'Just now',
      anomaly_metric: pick.metric,
      raw_value: pick.raw,
      kalman_smoothed_value: pick.smoothed,
      severity: pick.severity,
      kalman_status: 'Jitter Filtered & Validated',
      lead_time: pick.leadTime,
      recommended_action: pick.action,
      acknowledged: false,
      privacy_status: 'k-Anonymity Cleared (N>=12)',
      alert_type: pick.alertType,
      equipment_name: pick.alertType === 'PREDICTIVE_MAINTENANCE' ? workerId : undefined
    };

    // Inject into active alerts list
    setActiveAlerts((prev) => [newAlert, ...prev]);

    // Register in system audit logs
    const auditEntry: SystemAuditLogEntry = {
      id: generateUniqueId('AUD-TEST'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Alex Mercer',
      userRole: 'EHS Lead Supervisor',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Notification Center (Test Injection)',
      parameter: 'Simulated High-Risk Anomaly',
      previousValue: 'N/A',
      newValue: `Injected ${newAlert.severity}: ${newAlert.anomaly_metric} (${workerId})`,
      justification: 'Simulated test anomaly injected to verify real-time notification triage and field dispatch routing.',
      approvalStatus: 'VERIFIED'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    // Play chime if audio is enabled
    if (toastSoundEnabled) {
      voiceAlertService.playAlertChime(newAlert.severity, voiceSettings.severityAudioToggles);
    }

    setProtocolActiveNotice(
      `TEST ANOMALY INJECTED: [${newAlert.severity}] ${newAlert.anomaly_metric} for ${workerId} in ${targetZone}. Notification Center updated.`
    );
    setTimeout(() => setProtocolActiveNotice(null), 8000);

    // Scroll smoothly to Notification Center
    const el = document.getElementById('notification-center-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeZoneObj, toastSoundEnabled, voiceSettings.severityAudioToggles]);

  // Stage Pre-Emptive Protocols from 12-Hour LSTM Predictive Risk Forecast
  const handleStageLstmPreemptiveMitigation = useCallback(
    (forecast: Lstm12hForecastResult, targetHour: Lstm12hForecastHour) => {
      const newDispatch: MedicalDispatchNotification = {
        id: generateUniqueId('LSTM-DSP'),
        alertId: `LSTM-PREDICT-${targetHour.hourOffset}H`,
        zone: activeZoneObj.name,
        severity: targetHour.projectedRiskScore >= 80 ? 'CRITICAL' : 'HIGH',
        recipientRole: 'Pre-Emptive Thermal Defense & Rapid Hydration Team',
        contactMethod: 'DUAL_CHANNEL',
        recipientPhone: '+1 (555) 911-LSTM',
        messagePayload: `LSTM 12H FORECAST MITIGATION [${targetHour.timeLabel}]: Projected Risk ${targetHour.projectedRiskScore}% (${targetHour.primaryProjectedDriver}). Directive: ${targetHour.recommendedMitigation || 'Deploy rapid shaded hydration trailers.'}`,
        stagedAt: 'Just now',
        status: 'STAGED'
      };
      setMedicalDispatches((prev) => [newDispatch, ...prev]);

      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-LSTM'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Lead Supervisor',
        category: 'MAINTENANCE_DISPATCH',
        targetModule: '12-Hour LSTM Predictive Risk Forecaster',
        parameter: 'Pre-Emptive Protocol Staging',
        previousValue: `${forecast.baselineCurrentRisk}% Baseline Risk`,
        newValue: `Staged protocols for ${targetHour.timeLabel} (${targetHour.projectedRiskScore}% Projected Peak)`,
        justification: `Staged pre-emptive mitigation based on LSTM temporal cell projection for ${targetHour.timeLabel} to prevent predicted acute hazard.`,
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `Pre-emptive protocol staged for LSTM projected peak (${targetHour.timeLabel}, ${targetHour.projectedRiskScore}%). Dispatch team alerted.`
      );
      setTimeout(() => setProtocolActiveNotice(null), 7000);
    },
    [activeZoneObj]
  );

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

  // Desktop Notifications & Kalman Filter Confidence Alert Handlers
  const requestDesktopNotificationPermission = useCallback(async () => {
    const perm = await desktopNotificationService.requestPermission();
    setDesktopNotificationPermission(perm === 'unsupported' ? 'denied' : (perm as NotificationPermission));
    if (perm === 'granted') {
      setProtocolActiveNotice('Desktop Notifications active: You will receive OS alerts for critical anomalies when tabbed out.');
      setTimeout(() => setProtocolActiveNotice(null), 6000);
      return true;
    } else {
      setProtocolActiveNotice('Desktop Notification permission dismissed or denied. Tab title flashing & audio chime remain active.');
      setTimeout(() => setProtocolActiveNotice(null), 5000);
      return false;
    }
  }, []);

  const sendKalmanConfidenceDesktopNotification = useCallback(
    (confidence: number, threshold: number, force = false) => {
      const now = Date.now();
      if (!force && now - lastKalmanNotificationRef.current < 20000) {
        return; // 20s cooldown
      }
      lastKalmanNotificationRef.current = now;

      const title = `⚠️ Kalman Filter Confidence Drop Alert (${confidence.toFixed(1)}%)`;
      const body = `Kalman Filter confidence has dropped to ${confidence.toFixed(1)}% (below safety threshold of ${threshold.toFixed(1)}%). Elevated sensor noise and covariance drift detected in ${activeZoneObj.name}.`;

      // 1. Spawning browser native Desktop Notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && desktopNotificationsEnabled) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
              tag: 'kalman-confidence-breach'
            });
          } catch (err) {
            console.warn('Native notification spawn failed:', err);
          }
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then((perm) => {
            setDesktopNotificationPermission(perm);
            if (perm === 'granted') {
              try {
                new Notification(title, { body, tag: 'kalman-confidence-breach' });
              } catch (e) {
                console.warn(e);
              }
            }
          });
        }
      }

      // 2. High-priority in-app threshold breach toast alert
      const toastItem: ThresholdBreachToast = {
        id: `TOAST-KALMAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        signalKey: 'anomalyEngine',
        signalName: 'Kalman Filter Confidence Drop Alert',
        measuredValue: confidence,
        measuredFormatted: `${confidence.toFixed(1)}% Confidence`,
        thresholdLimit: threshold,
        thresholdFormatted: `${threshold.toFixed(1)}% Safety Floor`,
        unit: '%',
        deltaFormatted: `-${(threshold - confidence).toFixed(1)}% below threshold`,
        severity: confidence < 75 ? 'CRITICAL' : 'HIGH',
        zoneId: activeZoneObj.id,
        zoneName: activeZoneObj.name,
        workerCount: activeZoneObj.count,
        recommendedAction: 'Telemetry noise covariance exceeds optimal state space model limits. Recalibrate Kalman Q/R matrices and inspect local IoT gateways.',
        acknowledged: false,
        createdAt: now,
        autoDismissMs: 14000
      };
      setActiveToasts((prev) => [toastItem, ...prev].slice(0, 8));

      // 3. System Audit Log entry
      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-NOTIF'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Lead Supervisor',
        category: 'THRESHOLD_CHANGE',
        targetModule: 'Kalman Filter Real-Time Confidence Monitor',
        parameter: 'Kalman Confidence Drop Desktop Notification',
        previousValue: `${threshold.toFixed(1)}% Threshold`,
        newValue: `Dropped to ${confidence.toFixed(1)}%`,
        justification: `Desktop notification triggered due to Kalman state filter confidence falling below minimum safety threshold (${threshold}%).`,
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `DESKTOP NOTIFICATION DISPATCHED: Kalman Filter Confidence (${confidence.toFixed(1)}%) dropped below ${threshold}% threshold in ${activeZoneObj.name}.`
      );
      setTimeout(() => setProtocolActiveNotice(null), 7000);
    },
    [activeZoneObj, desktopNotificationsEnabled]
  );

  const handleSimulateKalmanConfidenceDrop = useCallback(() => {
    const droppedConfidence = Number((kalmanConfidenceThreshold - 7.5 - Math.random() * 4).toFixed(1));
    setKalmanConfidence(droppedConfidence);
    sendKalmanConfidenceDesktopNotification(droppedConfidence, kalmanConfidenceThreshold, true);
  }, [kalmanConfidenceThreshold, sendKalmanConfidenceDesktopNotification]);

  const handleTestDesktopNotification = useCallback(async () => {
    desktopNotificationService.notifyAnomaly(
      {
        id: `TEST-DESKTOP-${Date.now()}`,
        title: '🚨 CRITICAL TEST ALERT: Autonomous Heat Surge',
        body: 'Sector 4: Extreme apparent heat 41.2°C, Worker W-9921 HRV dropped to 28ms. Immediate cooling evacuation staged.',
        severity: 'CRITICAL',
        zone: 'Outdoor-Construction-Sector-4',
        metric: 'Thermal Strain & Tachycardia Spike',
        timestamp: new Date().toISOString(),
        actionRequired: 'Evacuate to shaded cooling tent with oral hydration.'
      },
      { forceTrigger: true }
    );
    setProtocolActiveNotice('Test Desktop Alert dispatched! (Audio chime synthesized and OS notification dispatched)');
    setTimeout(() => setProtocolActiveNotice(null), 5000);
  }, []);

  // Serializes the current active anomaly state into RFC 4180 CSV and triggers browser download for audit logs
  const handleExportCurrentAnomalyCsvDirect = useCallback(() => {
    try {
      const res = serializeCurrentAnomalyDataToCsvAndDownload(activeAlerts, activeZoneObj, {
        userName: 'Alex Mercer (EHS Safety Supervisor)',
        auditStandard: 'ISO 45001 / OSHA 1910 Occupational Safety Standard'
      });

      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-CSV'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: 'Current Anomaly State Serializer',
        parameter: 'Current Anomaly Data CSV Export',
        previousValue: 'In-Memory React State',
        newValue: `Exported ${res.recordCount} current anomaly records: ${res.filename}`,
        justification: 'Exported current anomaly data in the React state into CSV format for compliance audit logs.',
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      setProtocolActiveNotice(
        `Current anomaly data serialized and downloaded to CSV (${res.recordCount} alerts): ${res.filename}`
      );
      setTimeout(() => setProtocolActiveNotice(null), 6000);
      setIsViewAuditMenuOpen(false);
    } catch (err: any) {
      console.error('Failed to export current anomaly CSV:', err);
      setProtocolActiveNotice('Failed to export CSV: ' + (err?.message || 'Unknown error'));
    }
  }, [activeAlerts, activeZoneObj]);

  // Exports current anomaly detection logs and trend data as RFC 4180 CSV for statutory compliance reporting
  const handleExportAnomalyLogsAndTrendDataCsv = useCallback(() => {
    try {
      const res = exportCurrentAnomalyLogsAndTrendsCsv({
        activeAlerts,
        anomalyAuditRecords,
        trendData: anomalyTrend30d,
        zones,
        telemetryStream,
        supervisorName: 'Alex Mercer (EHS Safety Supervisor)',
        auditStandard: 'ISO 45001:2018 / OSHA 29 CFR 1910.120',
        currentZoneName: activeZoneObj.name
      });

      const auditEntry: SystemAuditLogEntry = {
        id: generateUniqueId('AUD-COMP'),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        userId: 'USR-MGR-2026',
        userName: 'Alex Mercer',
        userRole: 'EHS Safety Supervisor',
        category: 'REPORT_EXPORT',
        targetModule: 'Compliance Reporting Engine',
        parameter: 'Current Anomaly Logs & Trend Data CSV Export',
        previousValue: 'N/A',
        newValue: `Exported ${res.recordCount} records (active alerts, audit trail, 30-day trends): ${res.filename}`,
        justification: 'Exported all analytics CSV dossier containing current anomaly logs and historical trend data for offline compliance auditing (ISO 45001 / OSHA 1910).',
        approvalStatus: 'VERIFIED'
      };
      setSystemAuditLogs((prev) => [auditEntry, ...prev]);

      // Record in tamper-evident compliance audit trail
      complianceAuditService.logEvent({
        eventType: 'MANUAL_OVERRIDE',
        actor: 'Alex Mercer',
        actorRole:
          activeRole === 'SAFETY_OFFICER'
            ? 'Safety Compliance Officer'
            : activeRole === 'MAINTENANCE_CREW'
            ? 'Maintenance Crew Lead'
            : 'Site Operations Lead',
        actorType: 'USER',
        targetModule: 'Offline Compliance Audit Ledger',
        parameter: 'All Analytics CSV Export',
        previousValue: 'N/A',
        newValue: `Exported ${res.recordCount} records: ${res.filename}`,
        justification: 'Exported all analytics CSV of current anomaly log and historical trend data for offline regulatory auditing.',
        regulatoryStandard: 'OSHA 1910.120 / ISO 45001 §9.1',
        complianceStatus: 'VERIFIED',
        zoneId: activeZoneObj.id
      });

      setProtocolActiveNotice(
        `All Analytics CSV exported for offline auditing (${res.recordCount} records across active anomaly log and historical trends): ${res.filename}`
      );
      setTimeout(() => setProtocolActiveNotice(null), 8000);
    } catch (err: any) {
      console.error('Failed to export all analytics CSV:', err);
      setProtocolActiveNotice('Failed to export CSV: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setProtocolActiveNotice(null), 6000);
    }
  }, [activeAlerts, anomalyAuditRecords, anomalyTrend30d, zones, telemetryStream, activeZoneObj, activeRole]);

  // Initial demonstration high-risk population health anomaly toast alert on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCriticalAnomalyNotification({
        department: 'Civil & Structural Construction',
        confidenceLevel: 0.948,
        riskProbability: 0.892,
        riskTier: 'CRITICAL_RISK',
        locationZone: 'Outdoor-Construction-Sector-4',
        zoneId: 'Outdoor-Construction-Sector-4',
        cohortCount: 18,
        workerPseudonym: 'W-9921',
        anomalyMetric: 'Acute Autonomic & Core Temperature Strain',
        measuredValue: 'Heart Rate 138 BPM, Skin Temp 38.6°C, TWL 92.4 W/m²',
        thresholdLimit: 'HR Max 115 BPM, Skin 37.8°C',
        reconstructionMse: 0.385,
        recommendedAction: 'Immediate shaded cooling extraction; stage medical dispatch liaison.',
        privacyNotice: 'k-Anonymity Verified (N >= 12) & ε=0.5 Differential Privacy',
        attributions: {
          'Heart Rate Variability (HRV) Drop': 0.42,
          'Ambient Heat Index Load': 0.31,
          'Skin Temperature Elevation': 0.18,
          'Cumulative Sleep Deficit': 0.09
        },
        force: true
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [triggerCriticalAnomalyNotification]);

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

      // Evaluate live telemetry risk against user-defined threshold for browser alerts
      const currentRisk = Number((result.risk_probability * 100).toFixed(1));
      if (currentRisk >= telemetryRiskThreshold) {
        triggerTelemetryRiskBrowserAlert(currentRisk, activeZoneObj, result);
      }

      // Dynamically compute real-time Kalman filter confidence based on noise & jitter
      const jitterPenalty = jitterEnabled ? Math.abs(jitterFactor) * 1.5 : Math.abs(jitterFactor) * 0.5;
      const dynamicKalmanConf = Number(Math.max(68.0, Math.min(99.4, 96.8 - jitterPenalty + (Math.random() - 0.5) * 1.5)).toFixed(1));
      setKalmanConfidence(dynamicKalmanConf);

      if (dynamicKalmanConf < kalmanConfidenceThreshold) {
        sendKalmanConfidenceDesktopNotification(dynamicKalmanConf, kalmanConfidenceThreshold);
      }

      // Real-time alert toast notification if Prognosticator Engine detects high-risk or critical population health anomaly
      if (result.risk_probability >= 0.65 || result.risk_tier === 'CRITICAL_RISK') {
        const isCrit = result.risk_tier === 'CRITICAL_RISK' || result.risk_probability >= 0.75;
        triggerAnomalyToast({
          title: isCrit
            ? 'Prognosticator Engine: Critical Risk Anomaly'
            : 'Prognosticator Engine: High-Risk Population Strain',
          metric: 'LSTM Multidimensional Anomaly Vector',
          measuredVal: Number((result.risk_probability * 100).toFixed(1)),
          measuredFormatted: `${(result.risk_probability * 100).toFixed(1)}% Risk Prob`,
          limitVal: kalmanConfig.criticalCutoffPct,
          limitFormatted: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
          deltaFormatted: `+${((result.risk_probability * 100) - kalmanConfig.criticalCutoffPct).toFixed(1)}%`,
          severity: isCrit ? 'CRITICAL' : 'HIGH',
          action: result.recommended_operational_action,
          zoneName: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          signalKey: 'anomalyEngine',
          privacyStatus: result.privacy_compliance
        });

        const lastStreamPt = telemetryStream[telemetryStream.length - 1];
        const rawHrvDisplay = lastStreamPt?.raw_hrv ? `${lastStreamPt.raw_hrv}ms` : '31.2ms (±6ms Jitter)';
        const smoothedHrvDisplay = lastStreamPt?.smoothed_hrv ? `${lastStreamPt.smoothed_hrv}ms` : '34.6ms';
        const rawTempDisplay = lastStreamPt?.raw_skin_temp ? `${lastStreamPt.raw_skin_temp}°C` : '38.4°C';
        const smoothedTempDisplay = lastStreamPt?.smoothed_skin_temp ? `${lastStreamPt.smoothed_skin_temp}°C` : '38.1°C';

        triggerCriticalAnomalyNotification({
          confidenceLevel: result.risk_probability,
          riskProbability: result.risk_probability,
          riskTier: isCrit ? 'CRITICAL_RISK' : 'HIGH_RISK',
          locationZone: activeZoneObj.name,
          zoneId: activeZoneObj.id,
          cohortCount: activeZoneObj.count,
          workerPseudonym: result.worker_id,
          anomalyMetric: isCrit
            ? 'Acute Autonomic Deceleration & Thermal Strain'
            : 'Elevated Multi-Signal Population Heat Stress',
          measuredValue: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}% (MSE: ${result.reconstruction_mse.toFixed(3)})`,
          rawMeasuredValue: `Raw HRV: ${rawHrvDisplay}, Raw Skin: ${rawTempDisplay}`,
          kalmanSmoothedValue: `Smoothed HRV: ${smoothedHrvDisplay}, Temp: ${smoothedTempDisplay}`,
          kalmanStatus: 'Recursive Jitter Filtered & State Drift Validated',
          thresholdLimit: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
          reconstructionMse: result.reconstruction_mse,
          recommendedAction: result.recommended_operational_action,
          privacyNotice: result.privacy_compliance,
          attributions: result.explainable_attributions
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
  }, [isStreamingActive, jitterEnabled, activeZoneObj, kalmanConfig, checkReadingForThresholdBreaches, triggerAnomalyToast, kalmanConfidenceThreshold, sendKalmanConfidenceDesktopNotification, telemetryRiskThreshold, triggerTelemetryRiskBrowserAlert]);

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

  // Acknowledge anomaly alert and sync with past anomalies history
  const handleAcknowledgeAlert = (id: string) => {
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );

    const alertObj = activeAlerts.find((a) => a.id === id);
    if (alertObj) {
      setPastAnomalies((prev) => {
        if (prev.some((p) => p.id === id)) {
          return prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'RESOLVED',
                  resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              : p
          );
        }
        const newRecord: PastAnomalyRecord = {
          id: alertObj.id,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeAgo: 'Just now',
          severity: alertObj.severity,
          anomalyMetric: alertObj.anomaly_metric,
          locationZone: alertObj.location_zone,
          workerId: alertObj.worker_id,
          rawValue: alertObj.raw_value,
          smoothedValue: alertObj.kalman_smoothed_value,
          leadTime: alertObj.lead_time,
          resolutionNotes: `Acknowledged and verified by safety operations. Recommended directive executed: ${alertObj.recommended_action}`,
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          resolvedBy: 'Safety Operations Lead',
          status: 'RESOLVED'
        };
        return [newRecord, ...prev];
      });
    }
  };

  // Update resolution note for past anomaly
  const handleUpdatePastAnomalyResolutionNote = (id: string, note: string, author?: string) => {
    setPastAnomalies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              resolutionNotes: note,
              resolvedBy: author || item.resolvedBy || 'Safety Operations Lead',
              resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'RESOLVED'
            }
          : item
      )
    );
    setProtocolActiveNotice(`Resolution notes recorded for past anomaly ${id}.`);
  };

  // Mark past anomaly resolved directly from side panel
  const handleMarkPastAnomalyResolved = (id: string, note?: string) => {
    setPastAnomalies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'RESOLVED',
              resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              resolutionNotes:
                note ||
                (item.resolutionNotes && !item.resolutionNotes.toLowerCase().includes('pending')
                  ? item.resolutionNotes
                  : 'Safety protocol executed: Direct cooling, rest rotation, or equipment dampening verified.')
            }
          : item
      )
    );
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
    setProtocolActiveNotice(`Past anomaly ${id} marked resolved with resolution notes.`);
  };

  // Bulk update past anomalies status (Reviewed, Archived, Resolved)
  const handleBulkUpdatePastAnomaliesStatus = (
    ids: string[],
    newStatus: 'REVIEWED' | 'ARCHIVED' | 'RESOLVED',
    note?: string
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPastAnomalies((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const actionLabel =
          newStatus === 'REVIEWED'
            ? 'Reviewed by Safety Operations Lead'
            : newStatus === 'ARCHIVED'
            ? 'Archived into long-term compliance retention'
            : 'Marked resolved in bulk operations';
        return {
          ...item,
          status: newStatus,
          resolvedAt: item.resolvedAt || timeStr,
          resolvedBy: item.resolvedBy || 'Safety Operations Lead',
          resolutionNotes: note
            ? note
            : item.resolutionNotes
            ? `${item.resolutionNotes} [${actionLabel}: ${timeStr}]`
            : `${actionLabel} at ${timeStr}.`
        };
      })
    );
    if (newStatus === 'RESOLVED' || newStatus === 'REVIEWED') {
      setActiveAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, acknowledged: true } : a))
      );
    }
    const statusLabel = newStatus === 'REVIEWED' ? 'Reviewed' : newStatus === 'ARCHIVED' ? 'Archived' : 'Resolved';
    setProtocolActiveNotice(
      `Bulk operation completed: ${ids.length} ${ids.length === 1 ? 'alert' : 'alerts'} marked as '${statusLabel}'.`
    );
  };

  // Save global threshold settings and synchronize sensitivity level
  const handleSaveGlobalThresholdSettings = (
    updatedThresholds: HealthSignalNotificationThresholds,
    sensitivity: GlobalSensitivityLevel,
    justificationStr: string
  ) => {
    setHealthThresholds(updatedThresholds);
    setGlobalSensitivity(sensitivity);

    if (sensitivity === 'STANDARD') {
      setDailyFrequencyThreshold(5);
      setCriticalFrequencyThreshold(3);
      setProactiveRiskThreshold(5.5);
      setSensitivityLevel('MEDIUM');
      setKalmanConfig((prev) => ({
        ...prev,
        preset: 'MEDIUM',
        criticalCutoffPct: 65,
        measurementVarianceR: 2.0
      }));
    } else if (sensitivity === 'HIGH') {
      setDailyFrequencyThreshold(4);
      setCriticalFrequencyThreshold(2);
      setProactiveRiskThreshold(4.0);
      setSensitivityLevel('HIGH');
      setKalmanConfig((prev) => ({
        ...prev,
        preset: 'HIGH',
        criticalCutoffPct: 50,
        measurementVarianceR: 1.2
      }));
    } else if (sensitivity === 'EXTREME') {
      setDailyFrequencyThreshold(3);
      setCriticalFrequencyThreshold(1);
      setProactiveRiskThreshold(3.0);
      setSensitivityLevel('HIGH');
      setKalmanConfig((prev) => ({
        ...prev,
        preset: 'HIGH',
        criticalCutoffPct: 40,
        measurementVarianceR: 0.8
      }));
    } else {
      setSensitivityLevel('CUSTOM');
      setKalmanConfig((prev) => ({
        ...prev,
        preset: 'CUSTOM',
        criticalCutoffPct: updatedThresholds.riskScoreCutoffPct
      }));
    }

    const auditEntry: SystemAuditLogEntry = {
      id: `LOG-THRESH-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      userId: 'USR-SEC-MGR',
      userName: 'Safety Operations Lead',
      userRole: 'SITE_SAFETY_MANAGER',
      category: 'THRESHOLD_CHANGE',
      targetModule: 'Global Anomaly Engine',
      parameter: 'Multi-Signal Sensitivity & Health Thresholds',
      previousValue: `Baseline (${healthThresholds.riskScoreCutoffPct}%)`,
      newValue: `${sensitivity} Sensitivity (${updatedThresholds.riskScoreCutoffPct}% Cutoff)`,
      justification: justificationStr,
      approvalStatus: 'APPLIED',
      ipAddress: '10.240.8.14',
      zoneId: 'ALL'
    };
    setSystemAuditLogs((prev) => [auditEntry, ...prev]);

    // Reset acknowledged breaches so newly tightened thresholds immediately trigger visual alerts
    setAcknowledgedBreachIds(new Set());

    // Immediately trigger check against latest telemetry point with force = true
    const latestPt = telemetryStream[telemetryStream.length - 1];
    if (latestPt) {
      checkReadingForThresholdBreaches(latestPt, activeZoneObj, true);
    }

    setProtocolActiveNotice(
      `Global Threshold Sensitivity applied: ${sensitivity} (Risk Cutoff: ${updatedThresholds.riskScoreCutoffPct}%, HR Ceiling: ${updatedThresholds.maxHeartRateBpm ?? 120} BPM, WBGT: ${updatedThresholds.maxAmbientHeatC}°C). Visual alerts active.`
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
        setActiveAlerts((prev) => [freshAlert, ...prev.slice(0, 50)]);

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

    if (result.risk_probability >= 0.65 || result.risk_tier === 'CRITICAL_RISK') {
      const isCrit = result.risk_tier === 'CRITICAL_RISK' || result.risk_probability >= 0.75;
      triggerCriticalAnomalyNotification({
        confidenceLevel: result.risk_probability,
        riskProbability: result.risk_probability,
        riskTier: isCrit ? 'CRITICAL_RISK' : 'HIGH_RISK',
        locationZone: customPacket.location_zone || activeZoneObj.name,
        zoneId: customPacket.location_zone || activeZoneObj.id,
        cohortCount: customPacket.cohort_size || activeZoneObj.count,
        workerPseudonym: result.worker_id,
        anomalyMetric: isCrit
          ? 'Acute Autonomic Deceleration & Thermal Strain'
          : 'Elevated Multi-Signal Population Heat Stress',
        measuredValue: `State Estimate Prob: ${(result.risk_probability * 100).toFixed(1)}% (MSE: ${result.reconstruction_mse.toFixed(3)})`,
        thresholdLimit: `${kalmanConfig.criticalCutoffPct}% Cutoff`,
        reconstructionMse: result.reconstruction_mse,
        recommendedAction: result.recommended_operational_action,
        privacyNotice: result.privacy_compliance,
        attributions: result.explainable_attributions,
        force: true
      });
    }

    if (customPacket.cohort_size) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone ? { ...z, count: customPacket.cohort_size || z.count } : z
        )
      );
    }
  };

  // Ingest custom parsed telemetry or benchmark scenario dataset
  const handleIngestUploadedDataset = (uploadedData: TelemetryDataPoint[], sourceName: string) => {
    if (!uploadedData || uploadedData.length === 0) return;
    setTelemetryStream(uploadedData);

    // Compute updated alert prediction from the latest ingested telemetry data point
    const slice = uploadedData.slice(-12);
    const latest = uploadedData[uploadedData.length - 1];
    const syntheticPacket: TelemetryPacket = {
      timestamp: latest.timestamp || new Date().toISOString(),
      worker_id: 'INGESTED_COHORT',
      location_zone: activeZoneObj.name,
      cohort_size: activeZoneObj.count,
      hrv_series: slice.map((p) => p.smoothed_hrv || p.raw_hrv || 55),
      skin_temp_series: slice.map((p) => p.smoothed_skin_temp || p.skin_temp_c || 36.8),
      heat_index: latest.ambient_temp_c ? latest.ambient_temp_c + 3.0 : 38.0,
      sleep_deficit_hours: 2.5,
      twl_index: latest.twl_index,
      ambient_temp_c: latest.ambient_temp_c,
      aqi: latest.aqi,
      sick_leave_rate_deviation: latest.sick_leave_rate_deviation || 0
    };

    const res = predictWorkforceAnomaly(syntheticPacket, undefined, kalmanConfig);
    setTelemetryAlert(res);

    setProtocolActiveNotice(`Active Telemetry Switched: Ingested ${uploadedData.length} records from ${sourceName}`);
    setTimeout(() => {
      setProtocolActiveNotice(null);
    }, 8000);
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
    <div
      className={`min-h-screen font-sans p-4 md:p-6 transition-colors duration-200 ${
        dashboardTheme === 'high-contrast-light'
          ? 'manager-high-contrast-light bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Print-Friendly Header Banner: Formatted for Site Safety Meetings & Physical Handouts */}
      <div className="hidden print:block print-header-banner bg-white text-slate-900 border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase font-sans">
              PROGNOSTICATOR &bull; SITE SAFETY &amp; WORKFORCE HEALTH INTELLIGENCE
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Population Health Early-Warning Platform &bull; Multi-Signal Telemetry, Kalman Anomaly Detection &bull; Site Meeting Brief
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-700">
            <div><strong>Date:</strong> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Site Lead:</strong> Alex Mercer (EHS Safety Supervisor)</div>
            <div><strong>Scope:</strong> {activeZoneObj.name}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono border-t border-slate-300 pt-2">
          <div><strong>Total Workforce:</strong> {zones.reduce((s, z) => s + (z.count || 0), 0)} Personnel</div>
          <div><strong>Active Anomalies:</strong> {activeAlerts.length} Events Logged</div>
          <div><strong>Facility Zones:</strong> {zones.length} Zones Online</div>
          <div><strong>Compliance Seal:</strong> OSHA 1910 / ISO 45001 / GDPR Art. 9</div>
        </div>
      </div>

      {/* Comprehensive Telemetry Data Report Section (Leverages print-friendly styles for PDF Generation) */}
      <div className="hidden print:block mb-6 space-y-4 text-xs font-sans text-slate-900">
        {/* Telemetry Snapshot Table */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 mb-2 border-b border-slate-300 pb-1 flex justify-between items-center">
            <span>1. Current Multi-Signal Health &amp; Environmental Telemetry</span>
            <span className="text-[10px] font-mono text-slate-600 font-normal">Slide Window: 24h &bull; Sliding Interval: 15m</span>
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 font-mono text-slate-700 bg-slate-50">
                <th className="py-1 px-2">Telemetry Parameter</th>
                <th className="py-1 px-2">Raw Measured Reading</th>
                <th className="py-1 px-2">Safe Threshold / Baseline</th>
                <th className="py-1 px-2">Kalman Smoothed Estimate</th>
                <th className="py-1 px-2">Validation Status / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Ambient Temperature (°C)</td>
                <td className="py-1.5 px-2">{activeZoneObj.temp}</td>
                <td className="py-1.5 px-2">&le; {healthThresholds.maxAmbientHeatC}&deg;C</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.ambient_temp_c ?? 38.4}&deg;C</td>
                <td className="py-1.5 px-2 font-semibold text-rose-700">Solar Diurnal Peak</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Wet-Bulb Heat Index / TWL</td>
                <td className="py-1.5 px-2">{activeZoneObj.heatIndex}&deg;C (TWL: {activeZoneObj.twl} W/m&sup2;)</td>
                <td className="py-1.5 px-2">TWL &gt; 115 W/m&sup2; (Safe Work)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.twl_index ?? 92.4} W/m&sup2;</td>
                <td className="py-1.5 px-2 font-semibold text-amber-700">Thermal Strain Alert</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Heart Rate Variability (HRV ms)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.raw_hrv ?? 31.0} ms</td>
                <td className="py-1.5 px-2">&ge; {activeZoneObj.customBaselines?.baselineHrv || 60} ms baseline</td>
                <td className="py-1.5 px-2 font-bold text-cyan-800">{telemetryStream[telemetryStream.length - 1]?.smoothed_hrv ?? 34.2} ms</td>
                <td className="py-1.5 px-2 font-semibold text-rose-700">-46.8% Autonomic Drop</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Mean Workforce Heart Rate (BPM)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.raw_heart_rate_bpm ?? 128} BPM</td>
                <td className="py-1.5 px-2">&le; {healthThresholds.maxHeartRateBpm} BPM limit</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.heart_rate_bpm ?? 124} BPM</td>
                <td className="py-1.5 px-2 font-semibold text-amber-700">Tachycardic Exertion</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Epidermal Skin Temperature (&deg;C)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.raw_skin_temp ?? 38.35}&deg;C</td>
                <td className="py-1.5 px-2">&le; {healthThresholds.maxSkinTempC}&deg;C</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.smoothed_skin_temp ?? 38.12}&deg;C</td>
                <td className="py-1.5 px-2 font-semibold text-rose-700">+1.62&deg;C Core Elevation</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Acoustic Machinery Noise (dBA)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.raw_noise_db ?? 98.4} dBA</td>
                <td className="py-1.5 px-2">&le; {activeZoneObj.customBaselines?.noiseLimitDb || 85} dBA (8h PEL)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.smoothed_noise_db ?? 94.2} dBA</td>
                <td className="py-1.5 px-2 font-semibold text-amber-700">Overexposure Zone</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold font-sans">Air Quality Index (AQI PM2.5)</td>
                <td className="py-1.5 px-2">{activeZoneObj.aqi} AQI</td>
                <td className="py-1.5 px-2">&le; 100 AQI (Good/Moderate)</td>
                <td className="py-1.5 px-2">{telemetryStream[telemetryStream.length - 1]?.aqi ?? activeZoneObj.aqi} AQI</td>
                <td className="py-1.5 px-2 font-semibold text-amber-700">Unhealthy for Sensitive Groups</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Kalman Filtering Model Diagnostics & Risk State */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 mb-2 border-b border-slate-300 pb-1">
            2. Kalman Filter Model Diagnostics &amp; Risk State Estimation
          </h2>
          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2 border border-slate-300 rounded bg-slate-50">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Process Noise Covariance (Q)</span>
              <strong className="text-sm text-slate-950">Q = {kalmanConfig.processVarianceQ.toFixed(3)}</strong>
              <span className="text-[10px] text-slate-600 block mt-0.5">Underlying physiological transition rate</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Measurement Noise Variance (R)</span>
              <strong className="text-sm text-slate-950">R = {kalmanConfig.measurementVarianceR.toFixed(3)}</strong>
              <span className="text-[10px] text-slate-600 block mt-0.5">Bluetooth biometric sensor jitter envelope</span>
            </div>
            <div className="p-2 border border-slate-300 rounded bg-slate-50">
              <span className="text-slate-600 block text-[10px] uppercase font-bold">Innovation Covariance (P_k|k)</span>
              <strong className="text-sm text-slate-950">P_k|k = 0.024</strong>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Filter Stability: Optimal (99.4%)</span>
            </div>
          </div>
          <div className="mt-2.5 p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono flex justify-between items-center">
            <span><strong>Reconstruction MSE:</strong> {telemetryAlert?.reconstruction_mse?.toFixed(3) ?? '0.385'}</span>
            <span><strong>Risk Probability:</strong> {((telemetryAlert?.risk_probability ?? 0.884) * 100).toFixed(1)}%</span>
            <span><strong>Risk Tier:</strong> <strong className="text-rose-800">{telemetryAlert?.risk_tier ?? 'CRITICAL_RISK'}</strong></span>
            <span><strong>Privacy Shield:</strong> <strong className="text-emerald-800">k={activeZoneObj.count} &ge; 12 (&epsilon;=0.5 DP)</strong></span>
          </div>
        </div>

        {/* Active Workforce Anomaly Incidents Table */}
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 mb-2 border-b border-slate-300 pb-1">
            3. Active Population Health Anomalies ({activeAlerts.length} Flagged Events)
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 font-mono text-slate-700 bg-slate-50">
                <th className="py-1 px-2">Alert ID</th>
                <th className="py-1 px-2">Location Zone</th>
                <th className="py-1 px-2">Severity</th>
                <th className="py-1 px-2">Anomaly Metric</th>
                <th className="py-1 px-2">Raw vs Kalman Reading</th>
                <th className="py-1 px-2">Early Warning Lead</th>
                <th className="py-1 px-2">Prescribed Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {activeAlerts.slice(0, 5).map((alert) => (
                <tr key={alert.id}>
                  <td className="py-1 px-2 font-bold">{alert.id}</td>
                  <td className="py-1 px-2">{alert.location_zone}</td>
                  <td className="py-1 px-2">
                    <span className={`font-bold ${alert.severity === 'CRITICAL' ? 'text-rose-700' : 'text-amber-700'}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-1 px-2 font-sans font-medium">{alert.anomaly_metric}</td>
                  <td className="py-1 px-2 font-mono text-[10px]">
                    <div>Raw: {alert.raw_value}</div>
                    <div className="text-cyan-800 font-semibold">Kalman: {alert.kalman_smoothed_value}</div>
                  </td>
                  <td className="py-1 px-2">{alert.lead_time}</td>
                  <td className="py-1 px-2 font-sans text-slate-800">{alert.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-lg gap-4">
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

        {/* Right Header Controls Group: Aligned together on the right */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto lg:ml-auto justify-start lg:justify-end">
          {/* Global Search Bar: Queries specific alert logs, worker IDs, telemetry, or facility zones */}
          <div className="w-full sm:w-64 md:w-72 lg:w-80">
            <GlobalSearchBar
            zones={zones}
            alerts={activeAlerts}
            theme={dashboardTheme}
            onSelectZone={(zoneId) => {
              setSelectedZone(zoneId);
              setSelectedComparisonDeptId(zoneId);
              setAnomalyTrendZoneId(zoneId);
              const z = zones.find((item) => item.id === zoneId) || activeZoneObj;
              if (z) {
                const newPacket = generatePacketForZone(z, z.status === 'CRITICAL');
                const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
                setTelemetryAlert(res);
              }
              setProtocolActiveNotice(`Global Search: Focused on Facility Zone [${zoneId}]`);
              setTimeout(() => setProtocolActiveNotice(null), 5000);
            }}
            onSelectAlert={(alertId) => {
              const matchedAlert = activeAlerts.find((a) => a.id === alertId);
              if (matchedAlert) {
                handleOpenAnomalyDetails(matchedAlert);
              } else {
                if (managerTab !== 'live') setManagerTab('live');
                setProtocolActiveNotice(`Global Search: Selected Alert Log [${alertId}]. Navigating to Incident Records.`);
                setTimeout(() => setProtocolActiveNotice(null), 5000);
                const el = document.getElementById('incident-log-section') || document.getElementById('historical-anomaly-events-log');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onSelectWorker={(workerId, zoneId) => {
              if (zoneId) {
                setSelectedZone(zoneId);
                setSelectedComparisonDeptId(zoneId);
                setAnomalyTrendZoneId(zoneId);
              }
              // Broadcast worker selection to BiometricSyncModule
              window.dispatchEvent(
                new CustomEvent('prognosticator:select-worker', {
                  detail: { workerId }
                })
              );
              setProtocolActiveNotice(`Global Search: Located Worker [${workerId}] in ${zoneId || activeZoneObj.name}. Live wearable telemetry focused.`);
              setTimeout(() => setProtocolActiveNotice(null), 5000);
              const el = document.getElementById('biometric-sync-section') || document.getElementById('worker-density-correlation-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectTelemetryCategory={(categoryKey) => {
              setIsolatedHealthSignal(categoryKey);
              if (managerTab !== 'live') setManagerTab('live');
              setProtocolActiveNotice(`Global Search: Isolated Telemetry Category [${categoryKey.toUpperCase()}]. Highlighting multi-signal stream.`);
              setTimeout(() => setProtocolActiveNotice(null), 5000);
              const el = document.getElementById('historical-workforce-health-chart') || document.getElementById('telemetry-charts-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectReport={(reportKey) => {
              if (reportKey === 'DOWNLOAD_PDF_REPORT') {
                handleDownloadPdfReport();
              } else if (reportKey === 'EXPORT_DATA') {
                setIsReportModalOpen(true);
              } else if (reportKey === 'EXPORT_ALL_ANALYTICS_CSV') {
                handleExportAnomalyLogsAndTrendDataCsv();
              } else if (reportKey === 'DASHBOARD_SUMMARY_PDF') {
                handleDownloadDashboardSummaryPdf();
              } else if (reportKey === 'PREDICTIVE_SURGE_48H') {
                handleScrollToForecastChart();
              } else if (reportKey === 'SIGNED_COMPLIANCE_PDF') {
                setIsSignedCompliancePdfModalOpen(true);
              } else if (reportKey === 'DAILY_SUMMARY_REPORT') {
                setIsDailySummaryReportOpen(true);
              } else if (reportKey === 'COMPLIANCE_AUDIT_LOG') {
                setManagerTab('complianceAudit');
              } else if (reportKey === 'HEALTH_METRICS_PDF') {
                setIsHealthMetricsPdfModalOpen(true);
              } else if (reportKey === 'ANOMALY_TREND_30D') {
                const el = document.getElementById('anomaly-trend-30d-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              } else if (reportKey === 'PREDICTIVE_MAINTENANCE_TAB') {
                setManagerTab('predictiveMaintenance');
              } else if (reportKey === 'RESOURCE_UTILIZATION_HEATMAP') {
                setManagerTab('resourceUtilization');
                const el = document.getElementById('resource-utilization-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              } else if (reportKey === 'COHORT_COMPARISON_VIEW') {
                if (managerTab !== 'live') setManagerTab('live');
                setTimeout(() => {
                  const el = document.getElementById('cohort-health-comparison-line-view');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              } else if (reportKey === 'PREDICTIVE_30D_MODEL') {
                if (managerTab !== 'live') setManagerTab('live');
                setTimeout(() => {
                  const el = document.getElementById('kalman-predictive-model-30days-chart');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              } else if (reportKey === 'INCIDENT_LOG') {
                if (managerTab !== 'live') setManagerTab('live');
                setTimeout(() => {
                  const el = document.getElementById('incident-log-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }
            }}
          />
        </div>

        {/* Team Member View Role Toggle: Filters visible data and controls based on specific user role, restricting sensitive forecast data */}
        <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1 shadow-inner shrink-0 h-9">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 flex items-center gap-1">
            <Users className="h-3 w-3 text-cyan-400" />
            <span className="hidden sm:inline">Role View:</span>
          </span>
          <button
            onClick={() => handleSwitchRole('SAFETY_OFFICER')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'SAFETY_OFFICER'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Safety Compliance Officer: Unrestricted access to all forecast models, biometric telemetry, and HIPAA audit trails"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Safety Officer</span>
          </button>
          <button
            onClick={() => handleSwitchRole('MAINTENANCE_CREW')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'MAINTENANCE_CREW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Maintenance Crew: Focus on HVAC, environmental sensors, and equipment health. Sensitive worker biometric forecasts restricted."
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Maintenance Crew</span>
            <span className="text-[9px] font-mono bg-amber-950 text-amber-200 px-1 rounded uppercase">Restricted</span>
          </button>
          <button
            onClick={() => handleSwitchRole('OPERATIONS_LEAD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeRole === 'OPERATIONS_LEAD'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Site Operations Lead: Operational throughput, worker coverage, and shift health overview"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Ops Lead</span>
          </button>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mute Alerts Quick Toggle */}
          <button
            onClick={handleToggleMuteAlerts}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-medium transition border cursor-pointer ${
              isAlertsMuted
                ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={isAlertsMuted ? 'Health anomaly alerts are MUTED — Click to unmute' : 'Mute health anomaly alert notifications'}
          >
            {isAlertsMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            )}
            <span>{isAlertsMuted ? 'Alerts Muted' : 'Mute'}</span>
          </button>

          {/* Top-Right Notification Center anchored in top right */}
          <TopRightNotificationCenter
            alerts={activeAlerts}
            onViewDetails={handleOpenAnomalyDetails}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onAcknowledgeAll={(ids) => {
              setActiveAlerts((prev) =>
                prev.map((a) => (ids.includes(a.id) ? { ...a, acknowledged: true } : a))
              );
              setProtocolActiveNotice('All high-risk anomaly event notifications acknowledged.');
              setTimeout(() => setProtocolActiveNotice(null), 5000);
            }}
            onSimulateHighRiskAlert={() => {
              triggerCriticalAnomalyNotification({
                department: 'Civil & Structural Construction',
                confidenceLevel: 0.952,
                riskProbability: 0.912,
                riskTier: 'CRITICAL_RISK',
                locationZone: activeZoneObj.name,
                zoneId: activeZoneObj.id,
                cohortCount: activeZoneObj.count,
                workerPseudonym: 'W-9921',
                anomalyMetric: 'Cardiovascular Autonomic Collapse & Extreme Core Temp',
                measuredValue: 'Heart Rate 142 BPM, Skin Temp 38.8°C',
                thresholdLimit: 'HR Max 115 BPM, Skin 37.8°C',
                reconstructionMse: 0.428,
                recommendedAction: 'Immediate shaded cooling extraction; stage medical dispatch liaison.',
                force: true
              });
            }}
            soundEnabled={toastSoundEnabled}
            onToggleSound={() => setToastSoundEnabled((prev) => !prev)}
            telemetryRiskThreshold={telemetryRiskThreshold}
            onUpdateTelemetryRiskThreshold={handleUpdateTelemetryRiskThreshold}
            riskThresholdBreaches={riskThresholdBreaches}
            onAcknowledgeRiskBreach={handleAcknowledgeRiskBreach}
            currentTelemetryRisk={Number(((telemetryAlert?.risk_probability ?? 0.848) * 100).toFixed(1))}
            browserPermission={desktopNotificationPermission}
            onRequestBrowserPermission={() => {
              desktopNotificationService.requestPermission().then((p) => {
                setDesktopNotificationPermission(p === 'unsupported' ? 'denied' : (p as NotificationPermission));
              });
            }}
            browserAlertsEnabled={desktopNotificationsEnabled}
            onToggleBrowserAlerts={() => {
              const next = !desktopNotificationsEnabled;
              setDesktopNotificationsEnabled(next);
              desktopNotificationService.updateConfig({ enabled: next });
            }}
            onTestBrowserAlert={() => {
              const cur = Number(((telemetryAlert?.risk_probability ?? 0.848) * 100).toFixed(1));
              desktopNotificationService.notifyRiskThresholdBreach(
                {
                  id: `TEST-TOPRIGHT-${Date.now()}`,
                  riskScore: cur,
                  threshold: telemetryRiskThreshold,
                  delta: Number((cur - telemetryRiskThreshold).toFixed(1)),
                  zoneName: activeZoneObj.name,
                  workerCount: activeZoneObj.count,
                  primarySignal: 'Cardiovascular Autonomic Collapse & Extreme Core Temp',
                  recommendedAction: 'Immediate shaded cooling extraction; stage medical dispatch liaison.'
                },
                { forceTrigger: true }
              );
              setProtocolActiveNotice('Browser Alert dispatched! OS notification & audio chime triggered.');
              setTimeout(() => setProtocolActiveNotice(null), 5000);
            }}
          />
        </div>
        </div>
      </header>

      {/* Executive Action & Filter Strip */}
      <div className="relative z-40 bg-slate-900 border border-slate-800 rounded-xl p-3 mb-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Left: Longitudinal Timeframe / Date Range Filter */}
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={healthDateRange}
            onChange={(newRange) => {
              setHealthDateRange(newRange);
              setProtocolActiveNotice(
                `Timeframe filter updated: ${newRange.label} (${newRange.daysCount} days applied)`
              );
              setTimeout(() => setProtocolActiveNotice(null), 6000);
            }}
          />
        </div>

        {/* Right: Consolidated Executive Actions & Menus */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download CSV Button: Exports current workforce telemetry data as CSV file for offline analysis */}
          <button
            onClick={handleDownloadWorkforceTelemetryCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm"
            title="Download current workforce telemetry data as a CSV file for offline analysis"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>

          {/* Download PDF Report (Print Styles) */}
          <button
            onClick={handleDownloadPdfReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shadow-sm"
            title="Download comprehensive PDF report of current telemetry data leveraging print-friendly styles"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Download PDF Report</span>
          </button>

          {/* Simulate Kalman Anomaly Alert Toast */}
          <button
            onClick={() => triggerKalmanAnomalySimulation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 transition cursor-pointer shadow-xs"
            title="Trigger visual toast alert for a significant Kalman filtering health telemetry anomaly"
          >
            <Cpu className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>Simulate Kalman Anomaly</span>
          </button>

          {/* What-If Simulator Trigger */}
          <button
            onClick={handleOpenWhatIfSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 transition cursor-pointer shadow-xs"
            title="Launch What-If Environmental & Physical Stress Simulation"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>What-If Simulator</span>
          </button>

          {/* Telemetry Ingest & Industry Benchmarks */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition cursor-pointer shadow-xs"
            title="Upload custom CSV/JSON telemetry or load industry benchmark datasets (Foundry, Mining, Solar, Cold-Chain)"
          >
            <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ingest &amp; Benchmarks</span>
          </button>

          {/* Reports & Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => {
                setIsExportMenuOpen((prev) => !prev);
                setIsToolsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Reports &amp; Export</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-72 bg-slate-950 border border-slate-700 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98)] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ring-1 ring-slate-700"
                onClick={() => setIsExportMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  Executive PDF Reports
                </div>
                <button
                  onClick={handleDownloadPdfReport}
                  className="w-full text-left px-3 py-2 text-cyan-300 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition font-semibold"
                  title="Download comprehensive PDF report of current telemetry data leveraging print-friendly styles"
                >
                  <Printer className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Download PDF Report (Print Styles)</span>
                </button>
                <button
                  onClick={handleDownloadDashboardSummaryPdf}
                  disabled={isGeneratingSummaryPdf}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Executive PDF Summary</span>
                </button>
                <button
                  onClick={() => setIsSignedCompliancePdfModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Signed Compliance PDF</span>
                </button>
                <button
                  onClick={() => setIsHealthMetricsPdfModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Activity className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Health Metrics Audit PDF</span>
                </button>
                <button
                  onClick={() => setIsSafetyCommitteePdfModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Users className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Safety Committee Report</span>
                </button>
                <button
                  onClick={() => setIsCompliancePdfExportModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">OSHA/ISO Compliance PDF</span>
                </button>

                <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-800 mt-1">
                  CSV Data Exports
                </div>
                <button
                  onClick={handleDownloadWorkforceTelemetryCsv}
                  className="w-full text-left px-3 py-2 text-emerald-300 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition font-semibold"
                  title="Download current workforce telemetry data as a CSV file for offline analysis"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Download Telemetry CSV (Workforce)</span>
                </button>
                <button
                  onClick={handleExportDashboardCsv}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Telemetry &amp; Dashboard CSV</span>
                </button>
                <button
                  onClick={handleExportCurrentAnomalyCsvDirect}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Anomaly Event Log CSV</span>
                </button>
                <button
                  onClick={handleExportWorkforceCsv}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Workforce Cohort CSV</span>
                </button>
                <button
                  onClick={() => setIsComplianceCsvExportModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Compliance Audit CSV</span>
                </button>

                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-cyan-400 hover:bg-cyan-950/40 flex items-center gap-2 cursor-pointer transition font-medium"
                  >
                    <Sliders className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Custom Export Wizard...</span>
                  </button>
                  <button
                    onClick={handlePrintDashboard}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Print for Site Safety Meeting</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tools & Operations Dropdown */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => {
                setIsToolsMenuOpen((prev) => !prev);
                setIsExportMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer shadow-xs"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Tools &amp; Ops</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-72 bg-slate-950 border border-slate-700 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98)] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ring-1 ring-slate-700"
                onClick={() => setIsToolsMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  Operations &amp; Dispatch
                </div>
                <button
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition font-medium"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>Medical Dispatch Liaison</span>
                </button>
                <button
                  onClick={() => setIsTeamAlertModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Team Mobile Alerts</span>
                  </div>
                  {unreadTeamAlertCount > 0 && (
                    <span className="text-[10px] font-bold bg-cyan-600 text-white px-1.5 py-0.5 rounded-full">
                      {unreadTeamAlertCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Audio &amp; Voice Config</span>
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('d3-rolling-30d-health-signals-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      el.classList.add('ring-2', 'ring-cyan-500', 'transition-all');
                      setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-500'), 2500);
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-cyan-300 hover:bg-cyan-950/40 flex items-center gap-2 cursor-pointer transition font-medium"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>D3 30D Trend vs. Baseline</span>
                </button>

                <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-800 mt-1">
                  Configuration &amp; Audit
                </div>
                <button
                  onClick={() => setIsQuickSnapshotModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Camera className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Executive Quick Snapshot</span>
                </button>
                <button
                  onClick={() => setIsAnomalyAuditModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span>HIPAA Anomaly Audit Log</span>
                </button>
                <button
                  onClick={() => setIsHealthThresholdsModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <Sliders className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Health &amp; Vital Thresholds</span>
                </button>
                <button
                  onClick={() => setIsGlobalThresholdModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <AlertOctagon className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Global Risk Thresholds</span>
                </button>
                <button
                  onClick={() => setIsZoneBuilderOpen(true)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Custom Zone Builder</span>
                </button>
              </div>
            )}
          </div>

          {/* Kalman & Algorithm Settings */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer shadow-xs"
            title="Algorithm Sensitivity &amp; Kalman Filter Parameters"
          >
            <Settings className="h-3.5 w-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Category-Based Signal Filter & Historical Moving Average Global Strip */}
      <div className="relative z-30 bg-slate-900 border border-slate-800 rounded-xl p-3 mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span className="uppercase tracking-wider text-[11px] font-mono">Signal Visibility:</span>
          </div>

          {/* Cardiac Signals Category Toggle */}
          <button
            onClick={() => handleToggleSignalCategory('cardiac')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              signalCategories.cardiac
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-950/30'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through opacity-70'
            }`}
            title="Toggle visibility of Cardiac telemetry signals (Heart Rate, Kalman HRV, HRV Drops, Blood Pressure)"
          >
            <Heart className={`h-3 w-3 ${signalCategories.cardiac ? 'text-rose-400' : 'text-slate-600'}`} />
            <span>Cardiac Signals</span>
            <span className={`text-[10px] font-mono px-1 rounded ${signalCategories.cardiac ? 'bg-rose-900 text-white' : 'bg-slate-900 text-slate-500'}`}>
              {signalCategories.cardiac ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Environmental Signals Category Toggle */}
          <button
            onClick={() => handleToggleSignalCategory('environmental')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              signalCategories.environmental
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-950/30'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through opacity-70'
            }`}
            title="Toggle visibility of Environmental telemetry signals (Skin Temp, Ambient Temp, TWL, Noise dB, AQI)"
          >
            <Thermometer className={`h-3 w-3 ${signalCategories.environmental ? 'text-amber-400' : 'text-slate-600'}`} />
            <span>Environmental Signals</span>
            <span className={`text-[10px] font-mono px-1 rounded ${signalCategories.environmental ? 'bg-amber-900 text-white' : 'bg-slate-900 text-slate-500'}`}>
              {signalCategories.environmental ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Performance Signals Category Toggle */}
          <button
            onClick={() => handleToggleSignalCategory('performance')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              signalCategories.performance
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-purple-950/30'
                : 'bg-slate-950 text-slate-500 border-slate-800 line-through opacity-70'
            }`}
            title="Toggle visibility of Performance & Operational risk metrics (Risk Score, Stress Index, Vibration, Projections)"
          >
            <ShieldAlert className={`h-3 w-3 ${signalCategories.performance ? 'text-purple-400' : 'text-slate-600'}`} />
            <span>Performance Signals</span>
            <span className={`text-[10px] font-mono px-1 rounded ${signalCategories.performance ? 'bg-purple-900 text-white' : 'bg-slate-900 text-slate-500'}`}>
              {signalCategories.performance ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Historical Moving Average Baseline Master Toggle */}
          <button
            onClick={() => setShowGlobalMovingAverages((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              showGlobalMovingAverages
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-slate-950 text-slate-500 border-slate-800 opacity-70'
            }`}
            title="Toggle historical rolling moving averages across all charts to identify long-term signal degradation trends"
          >
            <TrendingUp className={`h-3 w-3 ${showGlobalMovingAverages ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span>Historical Moving Averages</span>
            <span className={`text-[10px] font-mono px-1 rounded ${showGlobalMovingAverages ? 'bg-emerald-900 text-white' : 'bg-slate-900 text-slate-500'}`}>
              {showGlobalMovingAverages ? 'ACTIVE' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(!signalCategories.cardiac || !signalCategories.environmental || !signalCategories.performance) && (
            <button
              onClick={handleResetSignalFilters}
              className="px-2 py-1 rounded text-xs text-amber-300 hover:text-white bg-amber-950/60 border border-amber-600/40 cursor-pointer flex items-center gap-1 font-mono"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={() => setIsSignalFilterSidebarOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-700 cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="h-3 w-3 text-cyan-400" />
            <span>Configure Signals &rarr;</span>
          </button>
        </div>
      </div>

      {/* Role Restriction Banner: Highlighted when Maintenance Crew view is active */}
      {activeRole === 'MAINTENANCE_CREW' && (
        <div className="relative z-20 bg-amber-950 border border-amber-600/50 rounded-xl p-3.5 px-4 mb-4 text-xs font-mono text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>MAINTENANCE CREW VIEW ACTIVE:</strong> Sensitive worker health forecasting &amp; personal biometric telemetry are restricted per OSHA 1910 and HIPAA §164.312 privacy requirements. Environmental and equipment telemetry remain active.
            </span>
          </div>
          <button
            onClick={() => handleSwitchRole('SAFETY_OFFICER')}
            className="text-amber-300 underline font-bold hover:text-white cursor-pointer shrink-0"
          >
            Switch to Safety Officer (Full Access) &rarr;
          </button>
        </div>
      )}

      {/* Row of Summary Metric Cards at Top of ManagerDashboard: Active Anomalies, Worker Coverage, Engine Uptime, System Latency */}
      <div className="relative z-10">
        <ManagerSummaryMetricsRow
          activeAlertsCount={activeAlerts.filter((a) => !a.acknowledged).length}
          criticalAlertsCount={activeAlerts.filter((a) => !a.acknowledged && a.severity === 'CRITICAL').length}
          highAlertsCount={activeAlerts.filter((a) => !a.acknowledged && a.severity === 'HIGH').length}
          totalWorkersCount={144}
          monitoredWorkersCount={142}
          engineUptimePct={99.98}
          systemLatencyMs={18.4}
          onJumpToAlerts={() => {
            const el = document.getElementById('active-alerts-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onJumpToZones={() => {
            const el = document.getElementById('floorplan-view-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onDownloadPdfReport={handleDownloadDashboardSummaryPdf}
          onDownloadCsvReport={handleDownloadWorkforceTelemetryCsv}
          isGeneratingPdf={isGeneratingSummaryPdf}
          className="mb-6"
        />
      </div>

      {/* Primary Dashboard View Mode Tabs: Live Operations, Compliance Audit Log, System Compliance (HIPAA), Predictive IoT, Causal Links, Density, Pattern Library */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-lg">
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 flex-wrap gap-1">
          <button
            onClick={() => setManagerTab('live')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'live'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Live Operations</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-cyan-300 font-mono">
              Real-Time
            </span>
          </button>

          {/* Resource Utilization (Heatmap Overlay) Tab Button */}
          <button
            onClick={() => setManagerTab('resourceUtilization')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'resourceUtilization'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-md shadow-orange-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-amber-300" />
            <span>Resource Utilization</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 font-mono font-bold border border-amber-500/40">
              Heatmap
            </span>
          </button>

          {/* New Compliance Audit Log Tab Button */}
          <button
            onClick={() => setManagerTab('complianceAudit')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'complianceAudit'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span>Compliance Audit Log</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/40">
              CSV Export
            </span>
          </button>

          <button
            onClick={() => setManagerTab('compliance')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'compliance'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>HIPAA Access Log</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/40">
              Security
            </span>
          </button>

          <button
            onClick={() => setManagerTab('predictiveMaintenance')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'predictiveMaintenance'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="h-4 w-4 text-cyan-300" />
            <span>Predictive Maintenance</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono font-bold border border-cyan-500/40">
              IoT Forecast
            </span>
          </button>

          <button
            onClick={() => setManagerTab('correlationEngine')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'correlationEngine'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GitMerge className="h-4 w-4 text-indigo-300" />
            <span>Correlation Engine</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 font-mono font-bold border border-indigo-500/40">
              Causal Links
            </span>
          </button>

          <button
            onClick={() => setManagerTab('density')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'density'
                ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-amber-300" />
            <span>Worker Density (D3)</span>
          </button>

          <button
            onClick={() => setManagerTab('patterns')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
              managerTab === 'patterns'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-4 w-4 text-purple-300" />
            <span>Pattern Library</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Desktop Notification Armed Status Button */}
          <button
            onClick={requestDesktopNotificationPermission}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              desktopNotificationPermission === 'granted'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
            }`}
            title="Desktop alerts trigger OS notifications for critical anomalies when tabbed out"
          >
            {desktopNotificationPermission === 'granted' ? (
              <>
                <Bell className="h-3.5 w-3.5 text-emerald-400" />
                <span>Desktop Alerts: Active (Tabbed-Out OS Detection)</span>
              </>
            ) : (
              <>
                <BellRing className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>Enable Desktop Alerts</span>
              </>
            )}
          </button>

          <button
            onClick={handleTestDesktopNotification}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
            title="Dispatch test notification with audio chime to verify operating system alerts"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test OS Alert</span>
          </button>

          <button
            onClick={() => setIsTeamAlertModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
            <span>Team Mobile</span>
            {unreadTeamAlertCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] animate-pulse">
                {unreadTeamAlertCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Global Notification System: Visual Alert Banner triggered when any health signal breaches thresholds defined in Global Threshold Settings */}
      <GlobalThresholdAlertBanner
        activeBreaches={activeSignalBreaches}
        sensitivityLevel={globalSensitivity}
        thresholds={healthThresholds}
        onAcknowledgeBreach={handleAcknowledgeSignalBreach}
        onAcknowledgeAll={handleAcknowledgeAllSignalBreaches}
        onInspectSignal={handleInspectSignalInChart}
        onOpenThresholdModal={() => setIsGlobalThresholdModalOpen(true)}
        onSimulateBreachTest={handleSimulateSignalBreachTest}
        isMuted={isAlertsMuted}
        onToggleMute={handleToggleMuteAlerts}
        className="mb-5"
      />

      {/* Non-Live Primary View Tabs */}
      {managerTab === 'resourceUtilization' && (
        <div className="mb-6 animate-fadeIn">
          <ResourceUtilizationPanel
            zones={zones}
            alerts={activeAlerts}
            selectedZoneId={selectedZone}
            onSelectZone={(zoneId) => setSelectedZone(zoneId)}
            onNavigateToFloorplan={() => {
              setManagerTab('live');
              setTimeout(() => {
                const el = document.getElementById('floor-plan-2d-view');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        </div>
      )}
      {managerTab === 'complianceAudit' && (
        <div className="mb-6 animate-fadeIn">
          <ComplianceAuditLog />
        </div>
      )}
      {managerTab === 'compliance' && (
        <div className="mb-6 animate-fadeIn">
          <SystemComplianceAuditModule />
        </div>
      )}
      {managerTab === 'predictiveMaintenance' && (
        <div className="mb-6 animate-fadeIn">
          <PredictiveMaintenanceModule
            onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
            onNotice={(msg) => {
              setProtocolActiveNotice(msg);
              setTimeout(() => setProtocolActiveNotice(null), 8000);
            }}
            onNavigateToZone={(zoneId) => {
              setSelectedZone(zoneId);
              setManagerTab('live');
            }}
          />
        </div>
      )}
      {managerTab === 'correlationEngine' && (
        <div className="mb-6 animate-fadeIn">
          <CorrelationEngineModule
            onNavigateToZone={(zoneId) => {
              setSelectedZone(zoneId);
              setManagerTab('live');
            }}
            onNotice={(msg) => {
              setProtocolActiveNotice(msg);
              setTimeout(() => setProtocolActiveNotice(null), 8000);
            }}
          />
        </div>
      )}
      {managerTab === 'patterns' && (
        <div className="mb-6 animate-fadeIn">
          <PatternLibraryTab
            onApplyMitigationToActiveZone={(sig) => {
              setProtocolActiveNotice(
                `Standard Operating Procedure deployed: "${sig.mitigationProcedure}" for ${sig.name} (${sig.regulatoryClassification}).`
              );
              setTimeout(() => setProtocolActiveNotice(null), 8000);
            }}
          />
        </div>
      )}
      {managerTab === 'density' && (
        <div className="mb-6 animate-fadeIn">
          <WorkerDensityCorrelationTab
            zones={zones}
            alerts={activeAlerts}
            onNavigateToZone={(zoneId) => {
              setSelectedZone(zoneId);
              setManagerTab('live');
            }}
            onInspectAnomaly={handleOpenAnomalyDetails}
          />
        </div>
      )}

      {/* Primary Live Operations View: Persistent DOM to prevent expensive remounting & D3/Chart recalculation */}
      <div className={managerTab === 'live' ? 'block' : 'hidden'}>

      {/* Top-Level Summary Section: Real-Time Critical KPIs & Status Cards */}
      <div id="top-level-summary-kpis" className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Real-Time Workforce Intelligence &bull; Core Operational KPIs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-signal aggregate risk health, anomaly telemetry velocity, and edge IoT connectivity
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Report Mock PDF Button for Health Metrics Display */}
            <button
              onClick={() => setIsHealthMetricsPdfModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition shadow-md shadow-cyan-900/40 cursor-pointer border border-cyan-400/50"
              title="Trigger mock PDF generation process for current health metrics display"
            >
              <FileText className="h-3.5 w-3.5 text-white" />
              <span>Export Report</span>
            </button>

            <button
              onClick={handleExportDailySummaryCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition shadow-xs cursor-pointer"
              title="Export current 24-hour summary dataset as CSV for external analysis (Excel, Tableau, Python)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV (24h)</span>
            </button>

            <button
              onClick={() => setIsDailySummaryReportOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-md shadow-cyan-900/40 cursor-pointer"
              title="Open Automated Daily Email Digest summarizing the Top 5 most critical anomalies detected over the last 24 hours"
            >
              <Mail className="h-3.5 w-3.5 text-white" />
              <span>Automated Daily Email Digest</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow-xs">
                Top 5 Critical
              </span>
            </button>

            <button
              onClick={() => setIsDailySummaryConfigOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-cyan-300 font-semibold text-xs transition shadow-xs cursor-pointer"
              title="Configure authorized email recipients and automated delivery triggers for high-risk anomalies"
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Auto-Delivery Config</span>
            </button>

            <button
              onClick={() => setIsScenarioSimulationOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition shadow-md shadow-indigo-900/40 cursor-pointer"
              title="Open Scenario Simulation to adjust variables (humidity, noise, traffic) and observe real-time model impact"
            >
              <Sliders className="h-3.5 w-3.5 text-white" />
              <span>Scenario Simulation</span>
            </button>
          </div>
        </div>

        {/* 5 Primary Critical KPI Status Cards (Including Real-Time Health Anomaly Trend Sparkline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Average Workforce Risk Score */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Average Workforce Risk Score
                </span>
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                  28.4%
                </span>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  -1.2% vs 1h
                </span>
              </div>
            </div>

            {/* 24-Hour Signal Trend Mini-Sparkline */}
            <div className="my-2 py-1 bg-slate-950/60 rounded-lg px-2 border border-slate-850">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                <span className="text-slate-400 font-medium">24h Risk Trajectory</span>
                <div className="flex items-center gap-1.5">
                  <HealthSignal24hBadge
                    data={telemetryStream.slice(-24).map((p) => p.risk_score || 0)}
                    lowerIsBetter={true}
                    label="24h"
                  />
                  <span className="text-cyan-400 font-bold">Hourly LSTM</span>
                </div>
              </div>
              <MiniSparkline
                data={telemetryStream.slice(-24).map((p) => p.risk_score || 0)}
                color="#06b6d4"
                unit="%"
                height={28}
                showMinMax={true}
                showCurrentDot={true}
                ariaLabel="24-hour average workforce risk score trend"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Status: <strong className="text-emerald-400">Normal Baseline</strong></span>
              <span className="text-slate-500">Peak: 78.2%</span>
            </div>
          </div>

          {/* Card 2: Real-Time Anomaly Trend Sparkline Component */}
          <AnomalyTrendSparklineWidget
            alerts={activeAlerts}
            telemetryStream={telemetryStream}
            onClickInspect={() => {
              const el = document.getElementById('anomaly-trend-30d-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Card 3: Anomalies Detected (24h) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Anomalies Detected (24h)
                </span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                  14 Events
                </span>
                <span className="text-xs text-amber-300 font-mono font-medium">
                  {activeAlerts.length} Active
                </span>
              </div>
            </div>

            {/* 24-Hour Anomaly Frequency Mini-Sparkline */}
            <div className="my-2 py-1 bg-slate-950/60 rounded-lg px-2 border border-slate-850">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                <span className="text-slate-400 font-medium">24h Anomaly Velocity</span>
                <div className="flex items-center gap-1.5">
                  <HealthSignal24hBadge
                    data={telemetryStream.slice(-24).map((p, idx) => {
                      const base = p.is_anomaly ? 3 : p.risk_score > 60 ? 2 : p.risk_score > 40 ? 1 : 0;
                      return Math.max(0, base + (idx % 4 === 0 && p.risk_score > 50 ? 1 : 0));
                    })}
                    lowerIsBetter={true}
                    label="24h"
                  />
                  <span className="text-rose-400 font-bold">Peaks Flagged</span>
                </div>
              </div>
              <MiniSparkline
                data={telemetryStream.slice(-24).map((p, idx) => {
                  const base = p.is_anomaly ? 3 : p.risk_score > 60 ? 2 : p.risk_score > 40 ? 1 : 0;
                  return Math.max(0, base + (idx % 4 === 0 && p.risk_score > 50 ? 1 : 0));
                })}
                color="#f43f5e"
                unit=" ev"
                height={28}
                showMinMax={true}
                showCurrentDot={true}
                ariaLabel="24-hour anomaly frequency trend"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-rose-300">4 Critical &bull; 7 High</span>
              <span className="text-emerald-400">11 Mitigated</span>
            </div>
          </div>

          {/* Card 4: Connected IoT Endpoints */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Connected IoT Endpoints
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Radio className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  184 / 184
                </span>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  100% Online
                </span>
              </div>
            </div>

            {/* 24-Hour IoT Connectivity Mini-Sparkline */}
            <div className="my-2 py-1 bg-slate-950/60 rounded-lg px-2 border border-slate-850">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                <span className="text-slate-400 font-medium">24h Signal Mesh</span>
                <div className="flex items-center gap-1.5">
                  <HealthSignal24hBadge
                    data={telemetryStream.slice(-24).map((_, i) => 184 - (i === 4 ? 1 : 0))}
                    lowerIsBetter={false}
                    label="24h"
                  />
                  <span className="text-emerald-400 font-bold">100% SLA</span>
                </div>
              </div>
              <MiniSparkline
                data={telemetryStream.slice(-24).map((_, i) => 184 - (i === 4 ? 1 : 0))}
                color="#10b981"
                unit=" dev"
                height={28}
                showMinMax={false}
                showCurrentDot={true}
                ariaLabel="24-hour IoT endpoint connectivity stability"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Telemetry Ping: 15s</span>
              <span className="text-slate-500">0 Dropouts</span>
            </div>
          </div>

          {/* Card 5: Safety Personnel Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Safety Personnel Allocation
                </span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  12 Officers
                </span>
                <span className="text-xs text-cyan-300 font-mono font-medium">
                  Ratio 1:12
                </span>
              </div>
            </div>

            {/* 24-Hour Personnel Deployment Mini-Sparkline */}
            <div className="my-2 py-1 bg-slate-950/60 rounded-lg px-2 border border-slate-850">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-0.5">
                <span className="text-slate-400 font-medium">24h Shift Staffing</span>
                <div className="flex items-center gap-1.5">
                  <HealthSignal24hBadge
                    data={telemetryStream.slice(-24).map((p) => (p.risk_score > 60 ? 12 : p.risk_score > 40 ? 11 : 10))}
                    lowerIsBetter={false}
                    label="24h"
                  />
                  <span className="text-indigo-400 font-bold">Active Ratio</span>
                </div>
              </div>
              <MiniSparkline
                data={telemetryStream.slice(-24).map((p) => (p.risk_score > 60 ? 12 : p.risk_score > 40 ? 11 : 10))}
                color="#818cf8"
                unit=" staff"
                height={28}
                showMinMax={false}
                showCurrentDot={true}
                ariaLabel="24-hour safety personnel deployment trend"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>9 Deployed Across Zones</span>
              <span className="text-amber-300 font-bold">3 Standby</span>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour vs Previous Week Telemetry Variance Summary Component */}
      <HealthTelemetryVarianceSummary
        telemetryStream={telemetryStream}
        theme={dashboardTheme}
        thresholdBreaches={activeBreachSignalKeys}
        className="mb-6"
      />

      {/* Proactive Alert Forecast Card: Analyzes Health Risk Growth Rates to Predict Upcoming Spikes */}
      <AlertForecastCard
        telemetryStream={telemetryStream}
        zones={zones}
        selectedZoneId={selectedZone}
        onStageMitigation={(forecast) => {
          setProtocolActiveNotice(
            `Mitigation Protocol Staged for ${forecast.zoneName}: ${forecast.action} (Projected peak: ${forecast.projectedPeak}%, Time to breach: ~${forecast.timeToSpikeHours}h)`
          );
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onViewTrendChart={() => {
          const el = document.getElementById('workforce-risk-trend-7d-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        theme={dashboardTheme}
        className="mb-6"
      />

      {/* Proactive Maintenance Scheduler: Triggers when LSTM-Kalman engine predicts sensor component failure within 72h */}
      <ProactiveMaintenanceSchedulerCard
        className="mb-6"
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onNavigateToZone={(zoneId) => {
          setSelectedZone(zoneId);
          const el = document.getElementById('anomaly-density-floor-plan-heatmap');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Automated Response Module: Corrective HVAC/Ventilation Adjustments for Low-to-Medium Environmental Anomalies */}
      <AutomatedResponseModule
        className="mb-6"
        onNotice={(msg) => {
          setProtocolActiveNotice(msg);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onNavigateToZone={(zoneId) => {
          setSelectedZone(zoneId);
          const el = document.getElementById('anomaly-density-floor-plan-heatmap');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Kalman Filter Cohort Anomaly Sentinel & Notification Panel: Alerts safety managers when anomaly scores exceed defined thresholds for any population cohort */}
      <KalmanCohortAnomalyNotificationPanel
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onDispatchMitigation={(cohortName, action) => {
          setProtocolActiveNotice(`Mitigation Protocol Dispatched to ${cohortName}: ${action}`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onLogAudit={(action, details) => {
          const entry: SystemAuditLogEntry = {
            id: generateUniqueId('AUD-KALMAN'),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            userId: 'USR-MGR-2026',
            userName: 'Alex Mercer',
            userRole: 'EHS Operations Supervisor',
            category: 'THRESHOLD_CHANGE',
            targetModule: 'Kalman Cohort Sentinel',
            parameter: action,
            previousValue: 'NOMINAL',
            newValue: action,
            justification: details,
            approvalStatus: 'VERIFIED'
          };
          setSystemAuditLogs((prev) => [entry, ...prev]);
        }}
        onTriggerAnomalyToast={(cohort) => {
          triggerCriticalAnomalyNotification({
            department: cohort.cohortName,
            confidenceLevel: cohort.kalmanAnomalyScore / 100,
            riskProbability: cohort.kalmanAnomalyScore / 100,
            riskTier: cohort.severity === 'CRITICAL' ? 'CRITICAL_RISK' : 'HIGH_RISK',
            locationZone: cohort.zoneName,
            zoneId: cohort.zoneId,
            cohortCount: cohort.populationSize,
            workerPseudonym: `COHORT-${cohort.zoneId.slice(0, 8)}`,
            anomalyMetric: `${cohort.primaryAttribution} (Kalman Score: ${cohort.kalmanAnomalyScore}%)`,
            measuredValue: `Kalman Anomaly Score: ${cohort.kalmanAnomalyScore}% (Limit: ${cohort.thresholdLimit}%)`,
            rawMeasuredValue: `Raw Measured Divergence: +${cohort.divergenceDelta}%`,
            kalmanSmoothedValue: `Kalman Smoothed Score: ${cohort.kalmanAnomalyScore}%`,
            kalmanStatus: cohort.kalmanValidationStatus,
            thresholdLimit: `${cohort.thresholdLimit}% Safe Threshold`,
            reconstructionMse: 0.392,
            recommendedAction: cohort.recommendedIntervention,
            privacyNotice: `k-Anonymity Verified (N=${cohort.populationSize} >= 12) & ε=0.5 DP Shield`,
            force: true
          });
        }}
        className="mb-6"
      />

      {/* Real-Time Health Metric Safety Alert System Monitor Bar */}
      <div id="real-time-alert-system-panel" className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <BellRing className="h-5 w-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Real-Time Health Metric Safety Alert System
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active &bull; Toast Warnings Armed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates streaming telemetry packets every 3.2s &bull; Immediately fires warning toasts when health metrics drop below safety floors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSimulateHealthMetricDrop('HRV')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Test real-time warning toast when worker HRV drops below the 40ms safety threshold"
            >
              <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span>Simulate HRV Drop (&lt;40ms)</span>
            </button>

            <button
              onClick={() => handleSimulateHealthMetricDrop('TWL')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Test real-time warning toast when Thermal Work Limit drops below 115 W/m²"
            >
              <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
              <span>Simulate TWL Drop (&lt;115)</span>
            </button>

            <button
              onClick={() => handleSimulateHealthMetricDrop('MULTI')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md shadow-red-950/50 cursor-pointer"
              title="Simulate severe multi-signal health drop across HRV, TWL, and pulse"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-white" />
              <span>Acute Multi-Drop Alert</span>
            </button>

            <button
              onClick={() => setIsHealthThresholdsModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Configure custom health signal notification thresholds"
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Thresholds</span>
            </button>
          </div>
        </div>

        {/* Live Safety Floor Badges */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono text-slate-400">
            <span className="text-slate-300 font-semibold">Active Safety Thresholds:</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              HRV Safety Floor: <strong className="text-cyan-400">&ge;{healthThresholds.minHrvMs} ms</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              TWL Safe Work Limit: <strong className="text-blue-400">&ge;{healthThresholds.minTwlIndex} W/m²</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              Health Homeostasis: <strong className="text-emerald-400">&ge;65%</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              Pulse Ceiling: <strong className="text-rose-400">&le;{healthThresholds.maxHeartRateBpm ?? 115} BPM</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              Skin Temp Ceiling: <strong className="text-amber-400">&le;{healthThresholds.maxSkinTempC}°C</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Active Warning Toasts:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${activeToasts.length > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-slate-950 text-slate-500'}`}>
              {activeToasts.length} Active
            </span>
            {activeToasts.length > 0 && (
              <button
                onClick={handleClearAllToasts}
                className="flex items-center space-x-1 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 px-2 py-0.5 rounded cursor-pointer ml-1 transition"
                title="Dismiss all active warning toasts at once"
              >
                <span>Dismiss All ({activeToasts.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proximity Alert Warning System: Triggers if High-Risk Anomaly Overlaps High-Density Worker Cluster */}
      <ProximityAlertBanner
        zones={zones}
        alerts={activeAlerts}
        onAcknowledgeZone={(zoneId) => {
          setProtocolActiveNotice(`Proximity warning acknowledged for ${zoneId}. Field safety steward notified.`);
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
        onDeploySupport={(zoneId, actionType) => {
          setProtocolActiveNotice(`Rapid mitigation protocol activated: ${actionType} in ${zoneId}.`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
      />

      {/* Recharts 7-Day Aggregate Workforce Risk Level Line Chart with What-If Simulator & Prediction Uncertainty Band */}
      <WorkforceRiskTrend7DaysChart
        className="mb-6"
        theme={dashboardTheme}
        isWhatIfOpen={isWhatIfSimulatorOpen}
        onToggleWhatIfOpen={() => setIsWhatIfSimulatorOpen((prev) => !prev)}
        showMovingAverage={showGlobalMovingAverages}
        onToggleMovingAverage={(active) => setShowGlobalMovingAverages(active !== undefined ? active : !showGlobalMovingAverages)}
        onSelectDay={(day) => {
          if (day.isSpike) {
            setProtocolActiveNotice(
              `Inspecting 7-day risk spike on ${day.fullDate}: Peak risk ${day.peakRiskScore}% driven by ${day.spikeReason}.`
            );
            setTimeout(() => setProtocolActiveNotice(null), 7000);
          }
        }}
      />

      {/* Recharts Multi-Zone Facility Health Risk Trends Over Time Line Chart */}
      <FacilityZonesRiskTrendChart
        zones={zones}
        alerts={activeAlerts}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
        className="mb-6"
      />

      {/* Anomaly Density Heatmap: Overlays Multi-Sensor Anomaly Counts Onto Schematic Architectural Floor Plan to Pinpoint High-Traffic Error Areas */}
      <AnomalyDensityHeatmap
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
        onDispatchMitigation={(zoneName, action) => {
          setProtocolActiveNotice(`Hotspot mitigation team dispatched to ${zoneName}: ${action}`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        className="mb-6"
      />

      {/* Zone Anomaly Concentration Heatmap: Visual Heatmap Representing Geographic or Zone-Based Health Anomaly Concentration Levels */}
      <ZoneAnomalyConcentrationHeatmap
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onDispatchMitigation={(zoneObj, action) => {
          setProtocolActiveNotice(`Rapid mitigation protocol activated in ${zoneObj.name}: ${action}`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        className="mb-6"
      />

      {/* Spatial Distribution Risk Heatmap: Visual Identification of Hazard Hot Spots Across Zones Alongside Existing Charts */}
      <SpatialZoneRiskHeatmap
        className="mb-6"
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onDispatchMitigation={(zoneObj, action) => {
          setProtocolActiveNotice(`Rapid mitigation protocol activated in ${zoneObj.name}: ${action}`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onNavigateToMaintenance={(endpointId) => {
          setManagerTab('predictiveMaintenance');
        }}
      />

      {/* D3-Powered Workplace Zone Health Risk Clusters Heatmap */}
      <D3WorkplaceZoneRiskHeatmap
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
      />

      {isDeferredLoaded ? (
        <>
      {/* Resource Utilization & Worker Distribution Heatmap Panel */}
      <ResourceUtilizationPanel
        zones={zones}
        alerts={activeAlerts}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
        onNavigateToFloorplan={() => {
          const el = document.getElementById('floor-plan-2d-view');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mb-6"
      />

      {/* Explainable AI (XAI) Log Window: Top Contributing Factors for High-Risk Anomaly Detections by LSTM-Kalman Engine */}
      <ExplainableAiLogWindow
        className="mb-6"
        anomalies={activeAlerts}
        zones={zones}
        onOpenScenarioSimulation={() => setIsScenarioSimulationOpen(true)}
        onDispatchMitigation={handleDispatchAction}
      />

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

      {/* 48-Hour Incident Likelihood Surge Predictive Analysis Banner */}
      {predictive48hAnalysis.increasePct >= 20.0 && !isPredictiveSurgeBannerDismissed && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900/95 to-amber-950/75 border-2 border-rose-500/70 shadow-2xl relative overflow-hidden ring-1 ring-rose-500/30 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none text-rose-400">
            <TrendingUp className="h-44 w-44" />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
            {/* Left: Surge Beacon & Analytical Breakdown */}
            <div className="flex items-start sm:items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-rose-900/60 border-2 border-rose-500 text-rose-300 shrink-0 shadow-lg relative">
                <AlertTriangle className="h-7 w-7 text-rose-400 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="h-3 w-3 text-rose-400" />
                    PREDICTIVE ANALYSIS ALERT &bull; 48-HOUR SURGE WARNING
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    Inflection Threshold &ge; 20% Breached
                  </span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700">
                    Model Confidence: {predictive48hAnalysis.confidenceScore}%
                  </span>
                </div>

                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>+{predictive48hAnalysis.increasePct}% Projected Incident Likelihood Increase Over Next 48 Hours</span>
                </h3>

                <p className="text-xs text-rose-200/90 mt-1 max-w-3xl leading-relaxed">
                  Longitudinal 30-day anomaly trend frequency and forward projection models indicate an acute{' '}
                  <strong className="text-white">+{predictive48hAnalysis.increasePct}% incident likelihood velocity spike</strong> over the upcoming 48 hours (rising from rolling baseline of <span className="font-mono text-cyan-300 font-semibold">{predictive48hAnalysis.baselineDailyRate}/day</span> to <span className="font-mono text-rose-300 font-bold">{predictive48hAnalysis.projected48hDailyRate}/day</span>, forecasted <span className="font-mono text-rose-300 font-bold">~{predictive48hAnalysis.total48hForecastedEvents} events</span>). Primary hazard vector: <span className="text-amber-300 font-semibold">{predictive48hAnalysis.primaryDriver}</span> across {predictive48hAnalysis.affectedCohorts.join(', ')}.
                </p>
              </div>
            </div>

            {/* Right: Key Proactive Metrics & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <div className="flex bg-slate-950/80 p-2.5 rounded-xl border border-rose-900/60 divide-x divide-slate-800 text-xs">
                <div className="px-3 text-center">
                  <div className="text-[10px] text-slate-400">Baseline 7D Rate</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">{predictive48hAnalysis.baselineDailyRate}/day</div>
                </div>
                <div className="px-3 text-center">
                  <div className="text-[10px] text-slate-400">48h Forecast Rate</div>
                  <div className="text-sm font-bold text-rose-400 font-mono">{predictive48hAnalysis.projected48hDailyRate}/day</div>
                </div>
                <div className="px-3 text-center">
                  <div className="text-[10px] text-slate-400">Surge Delta</div>
                  <div className="text-sm font-bold text-rose-300 font-mono">+{predictive48hAnalysis.increasePct}%</div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <button
                  onClick={handleStagePreemptive48hMitigation}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-lg cursor-pointer border border-rose-400/40"
                  title="Stage pre-emptive rapid cooling stations and hydration rotations before acute anomalies materialize"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Stage Pre-Emptive Protocols</span>
                </button>

                <button
                  onClick={handleScrollToForecastChart}
                  className="flex items-center justify-center space-x-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Jump directly to 30-day anomaly trend and 48-hour forward projection chart"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Inspect Trend Chart</span>
                </button>

                <button
                  onClick={() => handleExportViewAuditReport('PDF')}
                  className="flex items-center justify-center space-x-1 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/50 text-indigo-200 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Export 48h predictive risk brief as simulated PDF for statutory audit"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Risk Brief PDF</span>
                </button>

                <button
                  onClick={() => setIsPredictiveSurgeBannerDismissed(true)}
                  className="px-2.5 py-2 text-slate-400 hover:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-900 transition cursor-pointer"
                  title="Dismiss 48-hour predictive surge banner"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kalman Filter Real-Time Confidence & Desktop Notification Sentinel Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Left: Kalman Filter Confidence Status */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                kalmanConfidence >= kalmanConfidenceThreshold
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/70 text-rose-400 animate-pulse'
              }`}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">Kalman Filter Real-Time Confidence Sentinel</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1 ${
                    kalmanConfidence >= kalmanConfidenceThreshold
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      kalmanConfidence >= kalmanConfidenceThreshold ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                    }`}
                  />
                  State Confidence: {kalmanConfidence.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Threshold: &lt;{kalmanConfidenceThreshold.toFixed(1)}% Triggers Alert
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitors recursive 1D Kalman state estimation confidence. If high noise or packet jitter drops confidence below the safety threshold, an OS desktop notification and audit entry are dispatched immediately.
              </p>
            </div>
          </div>

          {/* Right: Controls & Simulation Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Threshold Slider / Presets */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Floor:</span>
              {[75, 80, 85, 90].map((th) => (
                <button
                  key={th}
                  onClick={() => setKalmanConfidenceThreshold(th)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition cursor-pointer ${
                    kalmanConfidenceThreshold === th
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {th}%
                </button>
              ))}
            </div>

            {/* Desktop Notification Permission Status / Toggle */}
            <button
              onClick={requestDesktopNotificationPermission}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                desktopNotificationPermission === 'granted'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
              }`}
              title={
                desktopNotificationPermission === 'granted'
                  ? 'Desktop notification permission is granted'
                  : 'Click to grant browser notification permission for desktop alerts'
              }
            >
              {desktopNotificationPermission === 'granted' ? (
                <>
                  <Bell className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Desktop Alerts: Active</span>
                </>
              ) : (
                <>
                  <BellRing className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>Enable Desktop Alerts</span>
                </>
              )}
            </button>

            {/* Simulate Confidence Drop (< 85%) */}
            <button
              onClick={handleSimulateKalmanConfidenceDrop}
              className="flex items-center space-x-1.5 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/60 text-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              title={`Instantly simulate a Kalman filter confidence collapse below threshold to trigger desktop notification and in-app alerts`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Simulate Confidence Drop (&lt;{kalmanConfidenceThreshold}%)</span>
            </button>

            {/* Test Desktop Notification Button */}
            <button
              onClick={handleTestDesktopNotification}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Send a sample desktop notification to verify operating system permissions"
            >
              <Bell className="h-3.5 w-3.5 text-cyan-400" />
              <span>Test OS Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Population Health Score Fluctuation Sparkline (Powered by Recharts) */}
      <PopulationHealthSparkline
        telemetryStream={telemetryStream}
        selectedZone={activeZoneObj}
        zones={zones}
        onScrollToFullChart={() => {
          const el = document.getElementById('historical-health-chart-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mb-6"
      />

      {/* Macro Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Monitored Workforce</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-bold text-white">1,420 Active</h3>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <Users className="h-3 w-3 mr-1" /> 100% Anonymized
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Resilience Trend</span>
              <HealthSignal24hBadge
                data={telemetryStream.slice(-24).map((p) => Math.round(100 - p.risk_score * 0.6))}
                lowerIsBetter={false}
                label="24h"
              />
            </div>
            <MiniSparkline
              data={telemetryStream.slice(-24).map((p) => Math.round(100 - p.risk_score * 0.6))}
              color="#10b981"
              height={28}
              width={95}
              unit="%"
              showForecast={true}
              forecastDays={7}
              ariaLabel="24-hour resilience trend with 7-day linear forecast"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Critical Alerts</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-bold text-rose-400">{pendingCriticalCount}</h3>
              <span className="text-xs text-rose-400 font-semibold flex items-center">
                <ShieldAlert className="h-3 w-3 mr-1" /> Immediate Action
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Risk Variance</span>
              <HealthSignal24hBadge
                data={telemetryStream.slice(-24).map((p) => p.risk_score)}
                lowerIsBetter={true}
                label="24h"
              />
            </div>
            <MiniSparkline
              data={telemetryStream.slice(-24).map((p) => p.risk_score)}
              color="#f43f5e"
              height={28}
              width={95}
              unit="%"
              showForecast={true}
              forecastDays={7}
              ariaLabel="24-hour risk variance trend with 7-day linear forecast"
            />
          </div>
        </div>

        {/* Equipment Predictive Maintenance Macro Metric Card */}
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl flex flex-col justify-between">
          <div>
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
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">ISO 10816 Curve</span>
              <HealthSignal24hBadge
                data={telemetryStream.slice(-24).map((p) => (p.equipment_vibration_mm_s ?? 2.8) * 10)}
                lowerIsBetter={true}
                label="24h"
              />
            </div>
            <MiniSparkline
              data={telemetryStream.slice(-24).map((p) => (p.equipment_vibration_mm_s ?? 2.8) * 10)}
              color="#f59e0b"
              height={28}
              width={95}
              unit="mm/s"
              showForecast={true}
              forecastDays={7}
              ariaLabel="24-hour ISO 10816 vibration curve with 7-day linear forecast"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Wet-Bulb Heat Index</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-bold text-amber-400">{activeZoneObj.heatIndex || 42.5}°C</h3>
              <span className="text-xs text-slate-400">Severe Thermal Load</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Heat Wave Index</span>
              <HealthSignal24hBadge
                data={telemetryStream.slice(-24).map((p) => p.ambient_temp_c)}
                lowerIsBetter={true}
                label="24h"
              />
            </div>
            <MiniSparkline
              data={telemetryStream.slice(-24).map((p) => p.ambient_temp_c)}
              color="#f97316"
              height={28}
              width={95}
              unit="°C"
              showForecast={true}
              forecastDays={7}
              ariaLabel="24-hour ambient heat index trend with 7-day linear forecast"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Model Lead Time (Backtested)</p>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-bold text-cyan-400">3.8 Hours</h3>
              <span className="text-xs text-cyan-400 font-semibold">Prior to Incident</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">HRV Autonomic</span>
              <HealthSignal24hBadge
                data={telemetryStream.slice(-24).map((p) => p.smoothed_hrv)}
                lowerIsBetter={false}
                label="24h"
              />
            </div>
            <MiniSparkline
              data={telemetryStream.slice(-24).map((p) => p.smoothed_hrv)}
              color="#06b6d4"
              height={28}
              width={95}
              unit="ms"
              showForecast={true}
              forecastDays={7}
              ariaLabel="24-hour HRV autonomic trend with 7-day linear forecast"
            />
          </div>
        </div>
      </div>

      {/* Predictive Trend Alerts (Kalman Drift Early Warning): Identifies and Surfaces Long-Term Negative Health Trends Before High-Risk Alerts Trigger */}
      <PredictiveTrendAlertsPanel
        telemetryStream={telemetryStream}
        zones={zones}
        onDeployPrecursorAction={(trendAlert, directive) => {
          const newAudit: AuditEvent = {
            id: generateUniqueId('AUD-TRD'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            eventType: 'ALERT_DISPATCH',
            zone: trendAlert.zoneName,
            cohortCount: trendAlert.cohortSize,
            riskTier: 'MODERATE_RISK',
            privacyEnforced: 'Differential Privacy Enforced (k=12)',
            actionTaken: `Precursor Early Countermeasure Deployed: ${directive}`
          };
          setAuditEvents((prev: AuditEvent[]) => [newAudit, ...prev]);
          setProtocolActiveNotice(`Predictive Trend Precursor Action Staged: ${directive}`);
          setTimeout(() => setProtocolActiveNotice(null), 7000);
        }}
        onInspectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
      />

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

      {/* Visual Heatmap Highlighting Geographical Zones & Workforce Segments Showing High-Risk Anomaly Markers */}
      <GeographicalZoneRiskHeatmap
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onDispatchAction={(actionData) => {
          const newDispatch: MedicalDispatchNotification = {
            id: generateUniqueId('DSP-MAP'),
            alertId: generateUniqueId('ALR-ZONE'),
            zone: actionData.zoneName,
            severity: actionData.severity,
            recipientRole: 'On-Site Rapid Cooling Evacuation Team',
            contactMethod: 'DUAL_CHANNEL',
            recipientPhone: '+1 (555) 911-ZONE',
            messagePayload: actionData.directive,
            stagedAt: 'Just now',
            status: 'STAGED'
          };
          setMedicalDispatches((prev) => [newDispatch, ...prev]);
          setProtocolActiveNotice(
            `Medical dispatch staged from Geographical Zone Heatmap: ${actionData.directive}`
          );
          setTimeout(() => setProtocolActiveNotice(null), 6000);
        }}
        className="mb-6"
      />

      {/* High-Risk Event Notification Center (Scrollable Queue of Recent High-Risk Events with Timestamp, Anomaly Type, and View Details) */}
      <div id="notification-center-section">
        <NotificationCenter
          alerts={activeAlerts}
          zones={zones}
          onViewDetails={handleOpenAnomalyDetails}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onAcknowledgeAll={handleAcknowledgeAllAlerts}
          onDispatchAction={handleDispatchAction}
          onSelectZone={(zoneId) => {
            setSelectedZone(zoneId);
            setAnomalyTrendZoneId(zoneId);
            const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
            const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
            const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
            setTelemetryAlert(res);
          }}
          departmentThresholdBreaches={departmentThresholdBreaches}
          onOpenDepartmentThresholds={() => {
            const el = document.getElementById('department-risk-threshold-config-panel');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-indigo-500', 'transition-all');
              setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500'), 3000);
            }
          }}
          onExportComplianceCsv={handleSimulatedComplianceCsvExport}
          onGeneratePdfReport={handleDirectPdfExport}
          onInjectTestAnomaly={handleInjectTestAnomaly}
          isGeneratingPdf={isDirectPdfExporting}
          incidentAssignments={incidentAssignments}
          onUpdateIncidentAssignment={handleUpdateIncidentAssignment}
          telemetryRiskThreshold={telemetryRiskThreshold}
          onUpdateTelemetryRiskThreshold={handleUpdateTelemetryRiskThreshold}
          riskThresholdBreaches={riskThresholdBreaches}
          onAcknowledgeRiskBreach={handleAcknowledgeRiskBreach}
          onClearRiskBreaches={handleClearRiskBreaches}
          currentTelemetryRisk={Number(((telemetryAlert?.risk_probability ?? 0.848) * 100).toFixed(1))}
          browserPermission={desktopNotificationPermission}
          onRequestBrowserPermission={() => {
            desktopNotificationService.requestPermission().then((p) => {
              setDesktopNotificationPermission(p === 'unsupported' ? 'denied' : (p as NotificationPermission));
            });
          }}
          browserAlertsEnabled={desktopNotificationsEnabled}
          onToggleBrowserAlerts={() => {
            const next = !desktopNotificationsEnabled;
            setDesktopNotificationsEnabled(next);
            desktopNotificationService.updateConfig({ enabled: next });
          }}
          soundEnabled={toastSoundEnabled}
          onToggleSound={() => setToastSoundEnabled((p) => !p)}
          onTestBrowserAlert={() => {
            const cur = Number(((telemetryAlert?.risk_probability ?? 0.848) * 100).toFixed(1));
            desktopNotificationService.notifyRiskThresholdBreach(
              {
                id: `TEST-SENTINEL-${Date.now()}`,
                riskScore: cur,
                threshold: telemetryRiskThreshold,
                delta: Number((cur - telemetryRiskThreshold).toFixed(1)),
                zoneName: activeZoneObj.name,
                workerCount: activeZoneObj.count,
                primarySignal: 'Cardiovascular Autonomic Collapse & Extreme Core Temp',
                recommendedAction: 'Immediate shaded cooling extraction; stage medical dispatch liaison.'
              },
              { forceTrigger: true }
            );
            setProtocolActiveNotice('Browser Alert dispatched! OS notification and audio siren triggered.');
            setTimeout(() => setProtocolActiveNotice(null), 5000);
          }}
          onSimulateRiskBreach={() => {
            const simulatedScore = Number((telemetryRiskThreshold + 9.8).toFixed(1));
            triggerTelemetryRiskBrowserAlert(simulatedScore, activeZoneObj);
          }}
          className="mb-6"
        />
      </div>

      {/* Configuration Panel for Custom Department Risk Score Threshold Values */}
      <DepartmentRiskThresholdConfigPanel
        departmentThresholds={departmentRiskThresholds}
        onSaveThresholds={handleSaveDepartmentThresholds}
        onResetDefaults={handleResetDepartmentThresholds}
        className="mb-6"
      />

      {/* Real-Time 24-Hour Aggregate Risk Score Progression Trend Line Chart (Using Recharts & 24H Linear Regression Forecast) */}
      <AggregateRiskScoreTrend24hChart
        telemetryStream={telemetryStream}
        selectedZone={activeZoneObj}
        showMovingAverage={showGlobalMovingAverages}
        onToggleMovingAverage={(active) => setShowGlobalMovingAverages(active !== undefined ? active : !showGlobalMovingAverages)}
        onInspectHour={(pt) => {
          setIsolatedHealthSignal('riskScore');
          const el = document.getElementById('historical-health-chart-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mb-6"
      />

      {/* 24-48 Hour Prognostic Forecast Panel & 12h LSTM: Gated and restricted when Maintenance Crew view is active */}
      {activeRole === 'MAINTENANCE_CREW' ? (
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-5 mb-6 text-slate-300 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Sensitive Workforce Health Forecasting Restricted
                </h3>
                <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                  Maintenance Crew Role Gated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Access to individualized worker physiological stress projections, LSTM neural risk curves, and personal biometric predictions is restricted under OSHA 1910 and HIPAA §164.312 privacy requirements for the Maintenance Crew view. Physical equipment telemetry, HVAC response, and microclimate environmental monitors remain active.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-400 font-mono">
                  Active for Maintenance: <strong className="text-cyan-400">HVAC Automation</strong> • <strong className="text-cyan-400">Microclimate Environmental Sensors</strong> • <strong className="text-cyan-400">Equipment Vibration &amp; RUL</strong>
                </span>
                <button
                  onClick={() => handleSwitchRole('SAFETY_OFFICER')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer ml-auto"
                >
                  Switch to Safety Officer View (Full Access) &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <PrognosticForecastPanel
            alerts={activeAlerts}
            zones={zones}
            selectedZone={activeZoneObj}
            onSelectZone={(zoneId) => {
              setSelectedZone(zoneId);
              setAnomalyTrendZoneId(zoneId);
              const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
              const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
              const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
              setTelemetryAlert(res);
            }}
            onApplyPreemptiveProtocol={(scenarioType, details) => {
              const newAudit: AuditEvent = {
                id: generateUniqueId('AUD-PROG'),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                eventType: 'ALERT_DISPATCH',
                zone: activeZoneObj.name,
                cohortCount: activeZoneObj.count,
                riskTier: 'CRITICAL_RISK',
                privacyEnforced: 'Differential Privacy Enforced (k=12)',
                actionTaken: details
              };
              setAuditEvents((prev: AuditEvent[]) => [newAudit, ...prev]);
              setProtocolActiveNotice(`Prognostic 24-48h Pre-emptive Countermeasure staged: ${details}`);
              setTimeout(() => setProtocolActiveNotice(null), 7000);
            }}
            className="mb-6"
          />

          <LstmRiskForecastingPanel12h
            alerts={activeAlerts}
            selectedZone={activeZoneObj}
            onStageMitigation={handleStageLstmPreemptiveMitigation}
            className="mb-6"
          />
        </>
      )}

      {/* Historical Population Health Anomalies Log (Lists the Last 5 Detected Events with Timestamps and Severity Levels) */}
      <HistoricalPopulationHealthAnomaliesLog
        alerts={activeAlerts}
        zones={zones}
        selectedZoneId={selectedZone}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onInspectAnomaly={(alert) => {
          setAnomalyTrendZoneId(alert.location_zone);
          const el = document.getElementById('anomaly-trend-30d-card') || document.getElementById('historical-health-chart-card');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onSpeakAlert={handleSpeakAlert}
        onOpenComplianceExportModal={() => setIsComplianceCsvExportModalOpen(true)}
        isSpeaking={isSpeaking}
        className="mb-6"
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
        streamToggles={effectiveStreamToggles}
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

      {/* Dedicated Algorithm Sensitivity Configuration Panel for Anomaly Detection Algorithms */}
      <AlgorithmSensitivityConfigPanel
        kalmanConfig={kalmanConfig}
        onUpdateKalmanConfig={(newConfig) => {
          setKalmanConfig(newConfig);
          const newPacket = generatePacketForZone(activeZoneObj, activeZoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, newConfig);
          setTelemetryAlert(res);
        }}
        healthThresholds={healthThresholds}
        onUpdateHealthThresholds={handleSaveHealthThresholds}
        zones={zones}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
        onScrollToHistoricalLog={() => {
          const el = document.getElementById('historical-anomaly-event-log-panel');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Real-Time Audio Alerts Notification Toggle System per Severity Level */}
      <AudioNotificationSeverityTogglePanel
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={setVoiceSettings}
        onLogAuditAction={(cat, action, justification) => {
          const auditEntry: SystemAuditLogEntry = {
            id: generateUniqueId('AUD-AUD'),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            userId: 'USR-MGR-2026',
            userName: 'Alex Mercer',
            userRole: 'EHS Safety Manager',
            category: 'THRESHOLD_CHANGE',
            targetModule: 'Real-Time Audio Notification Engine',
            parameter: 'Severity Audio Toggles',
            previousValue: 'N/A',
            newValue: action,
            justification: justification || 'Adjusted acoustic audio alert permissions per severity tier.',
            approvalStatus: 'VERIFIED'
          };
          setSystemAuditLogs((prev) => [auditEntry, ...prev]);
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

      {/* 30-Day Longitudinal Anomaly Trend Frequency Intelligence Line Chart (Recharts / D3.js) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2.5 px-1 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Longitudinal Trend Visualizer:</span>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs shadow-xs">
            <button
              onClick={() => setTrendChartEngine('RECHARTS')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                trendChartEngine === 'RECHARTS'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span>Recharts Line Engine (Active)</span>
            </button>
            <button
              onClick={() => setTrendChartEngine('D3')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                trendChartEngine === 'D3'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3 w-3 text-cyan-200" />
              <span>D3.js Vector Engine</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Recharts Longitudinal Line Chart &bull; Multi-Series &bull; 7D SMA Projection &bull; 30-Day Frequency</span>
        </div>
      </div>

      {trendChartEngine === 'RECHARTS' ? (
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
          onOpenCompliancePdfModal={() => setIsCompliancePdfExportModalOpen(true)}
        />
      ) : (
        <D3AnomalyTrend30DaysChart
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
          onOpenCompliancePdfModal={() => setIsCompliancePdfExportModalOpen(true)}
        />
      )}

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

      {/* 24-Hour Temporal Health Anomaly Heat-Map Visualization (Using Recharts) */}
      <TemporalAnomalyHeatmap
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
        className="mb-6"
      />

      {/* Population Health Risk Heatmap Widget (Categorizes into Low, Medium, High, Critical using Radar Chart) */}
      <RiskHeatmapRadarWidget
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
      />

      {/* Longitudinal Health Analytics & Timeframe Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl mb-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Longitudinal Workforce Health Analytics &amp; Comparative Baselines</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                Filtered: {healthDateRange.preset}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Filter historical trends and department comparison metrics across specific operational timeframes
            </p>
          </div>
        </div>

        {/* Quick jump to D3 30D Trend Comparison & Date Range Picker Control */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById('d3-rolling-30d-health-signals-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('ring-2', 'ring-cyan-500', 'transition-all');
                setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-500'), 2500);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition cursor-pointer shadow-xs"
            title="Jump to D3 Rolling 30-Day Health Signals vs. Baseline Comparison section"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>D3 30D Signals vs. Baseline</span>
          </button>

          <DateRangePicker
            value={healthDateRange}
            onChange={(newRange) => {
              setHealthDateRange(newRange);
              setProtocolActiveNotice(
                `Timeframe filter updated: ${newRange.label} (${newRange.daysCount} days applied)`
              );
              setTimeout(() => setProtocolActiveNotice(null), 6000);
            }}
          />
        </div>
      </div>

      {/* Split-View Department Health Metrics vs Previous Month Historical Averages Comparison Card */}
      <DepartmentHealthComparisonSplitCard
        zones={zones}
        dateRange={healthDateRange}
        selectedDepartmentId={selectedComparisonDeptId}
        onSelectDepartmentId={(id) => {
          setSelectedComparisonDeptId(id);
          setSelectedZone(id);
        }}
        className="mb-6"
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

      {/* D3 Vector Engine: Rolling 30-Day Health Signals vs. Baseline Averages Trend Comparison Section */}
      <div id="d3-rolling-30d-health-signals-section" className="scroll-mt-6">
        <D3HealthSignalRollingTrendComparison
          selectedZone={activeZoneObj}
          zones={zones}
          thresholds={healthThresholds}
          dateRange={healthDateRange}
          onSelectZone={(zoneId) => {
            setSelectedZone(zoneId);
            setAnomalyTrendZoneId(zoneId);
            const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
            const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
            const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
            setTelemetryAlert(res);
          }}
          className="mb-6"
        />
      </div>

      {/* Historical Trend of Workforce Health Metrics Line Chart (Recharts) */}
      <WorkforceHealth30DaysTrendChart
        selectedZone={activeZoneObj}
        zones={zones}
        thresholds={healthThresholds}
        dateRange={healthDateRange}
        onTriggerThresholdAlert={checkReadingForThresholdBreaches}
        showMovingAverage={showGlobalMovingAverages}
        onToggleMovingAverage={(active) => setShowGlobalMovingAverages(active !== undefined ? active : !showGlobalMovingAverages)}
        className="mb-6"
      />

      {/* 30-Day Forward Predictive Health Modeling using Kalman Filter Extrapolation */}
      <KalmanPredictiveModel30DaysChart
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
      />

      {/* Historical Workforce Health Signal Data Line Chart (Last 24 Hours via Recharts) */}
      <HistoricalWorkforceHealthChart
        data={telemetryStream}
        zoneName={activeZoneObj.name}
        activeThresholdCutoff={kalmanConfig.criticalCutoffPct}
        thresholds={healthThresholds}
        onOpenThresholdsModal={() => setIsHealthThresholdsModalOpen(true)}
        onExportCsv={handleExportWorkforceCsv}
        onExportReport={() => setIsHealthMetricsPdfModalOpen(true)}
        externalIsolatedSignal={isolatedHealthSignal}
        onSignalIsolationChange={setIsolatedHealthSignal}
        correlationPair={activeCorrelationPair}
        showMovingAverage={showGlobalMovingAverages}
        onToggleMovingAverage={(active) => setShowGlobalMovingAverages(active !== undefined ? active : !showGlobalMovingAverages)}
        maWindowHours={globalMaWindowHours}
      />

      {/* Dedicated Historical Anomaly Events Log Component with Severity Scores & Timestamp Details */}
      <HistoricalAnomalyEventLog
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        zones={zones}
        selectedZoneId={selectedZone}
        thresholds={healthThresholds}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
        }}
        onSpeakAlert={handleSpeakAlert}
        onOpenSensitivityPanel={() => {
          const el = document.getElementById('algorithm-sensitivity-config-panel');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenComplianceExportModal={() => setIsComplianceCsvExportModalOpen(true)}
        onOpenCompliancePdfExportModal={() => setIsCompliancePdfExportModalOpen(true)}
        isSpeaking={isSpeaking}
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

      {/* Incident Log: Comprehensive Historical Alerts Triggered by Anomaly Detection System */}
      <IncidentLog
        alerts={activeAlerts}
        zones={zones}
        selectedZoneId={selectedZone}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDispatchAction={handleDispatchAction}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        onSpeakAlert={handleSpeakAlert}
        isSpeaking={isSpeaking}
        theme={dashboardTheme}
        className="mb-6"
      />

      {/* Geospatial Summary Widget: Categorizes health telemetry metrics by site location / region using a simple chart */}
      <GeospatialSummaryWidget
        zones={zones}
        alerts={activeAlerts}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
      />

      {/* Sliding 24-Hour Recharts Telemetry Stream with 1-Hour Forecast */}
      <TelemetryCharts
        data={telemetryStream}
        zoneName={activeZoneObj.name}
        streamToggles={effectiveStreamToggles}
        showMovingAverage={showGlobalMovingAverages}
        onToggleMovingAverage={(active) => setShowGlobalMovingAverages(active !== undefined ? active : !showGlobalMovingAverages)}
        onExportData={() => setIsReportModalOpen(true)}
      />

      {/* Side-by-Side Population Cohort & Site Health Telemetry Line Chart Comparison View */}
      <CohortHealthComparisonLineView
        zones={zones}
        telemetryStream={telemetryStream}
        selectedZoneId={selectedZone}
        onSelectZone={(zoneId) => {
          setSelectedZone(zoneId);
          setSelectedComparisonDeptId(zoneId);
          setAnomalyTrendZoneId(zoneId);
          const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
          const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
          const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
          setTelemetryAlert(res);
        }}
        className="mb-6"
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
        onExportData={() => setIsReportModalOpen(true)}
        onInspectAnomaly={handleOpenAnomalyDetails}
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
              onClick={handleDownloadPdfReport}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
              title="Download comprehensive telemetry PDF report leveraging print-friendly styles"
            >
              <Printer className="h-4 w-4" />
              <span>Download PDF Report</span>
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
        incidentAssignments={incidentAssignments}
        onUpdateIncidentAssignment={handleUpdateIncidentAssignment}
      />

      {/* Security Audit Log Panel: Listing Recent Anomaly Detection Events with Severity Indicators & Timestamps */}
      <SecurityAuditLogPanel
        alerts={activeAlerts}
        anomalyAuditRecords={anomalyAuditRecords}
        zones={zones}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onAcknowledgeAll={handleAcknowledgeAllAlerts}
        onViewDetails={handleOpenAnomalyDetails}
        onExportCsv={handleExportAnomalyLogsAndTrendDataCsv}
        onOpenSignedCompliancePdf={() => setIsSignedCompliancePdfModalOpen(true)}
        className="mb-6"
      />

      {/* System Audit Log Component: Manual Changes to Sensitivity Thresholds & Zone Configurations */}
      <div id="system-audit-log-section">
        <SystemAuditLog
          logs={systemAuditLogs}
          onAddManualLog={handleAddManualAuditLog}
        />
      </div>
        </>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-xl mb-6 text-center">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Hydrating telemetry streams &amp; prognostic charts...</span>
          </div>
        </div>
      )}
      </div>

      {/* Modals & Drawers - Loaded conditionally on demand for optimal runtime performance */}
      {isSignedCompliancePdfModalOpen && (
        <SignedComplianceReportModal
          isOpen={true}
          onClose={() => setIsSignedCompliancePdfModalOpen(false)}
          auditRecords={anomalyAuditRecords}
        />
      )}

      {isDailySummaryReportOpen && (
        <DailySummaryReportModal
          isOpen={true}
          onClose={() => setIsDailySummaryReportOpen(false)}
          onOpenConfig={() => setIsDailySummaryConfigOpen(true)}
          zones={zones}
          alerts={activeAlerts}
          pastAnomalies={pastAnomalies}
          incidentAssignments={incidentAssignments}
          telemetryStream={telemetryStream}
        />
      )}

      {isDailySummaryConfigOpen && (
        <DailySummaryConfigModal
          isOpen={true}
          onClose={() => setIsDailySummaryConfigOpen(false)}
          onLogAudit={(entry) => setSystemAuditLogs((prev) => [entry, ...prev])}
          onNotice={(msg) => {
            setProtocolActiveNotice(msg);
            setTimeout(() => setProtocolActiveNotice(null), 6000);
          }}
        />
      )}

      {isScenarioSimulationOpen && (
        <ScenarioSimulationModal
          isOpen={true}
          onClose={() => setIsScenarioSimulationOpen(false)}
          activeZone={activeZoneObj}
          onInjectSimulatedScenario={handleInjectSimulatedScenario}
          onNotice={(msg) => {
            setProtocolActiveNotice(msg);
            setTimeout(() => setProtocolActiveNotice(null), 7000);
          }}
        />
      )}

      {isExplainableAiModalOpen && (
        <ExplainableAiLogWindow
          isModal
          isOpen={true}
          onClose={() => setIsExplainableAiModalOpen(false)}
          anomalies={activeAlerts}
          zones={zones}
          onOpenScenarioSimulation={() => {
            setIsExplainableAiModalOpen(false);
            setIsScenarioSimulationOpen(true);
          }}
          onDispatchMitigation={handleDispatchAction}
        />
      )}

      {isAuditModalOpen && (
        <AuditLogModal
          isOpen={true}
          onClose={() => setIsAuditModalOpen(false)}
          auditEvents={auditEvents}
        />
      )}

      {isAnomalyAuditModalOpen && (
        <AnomalyAuditLogModal
          isOpen={true}
          onClose={() => setIsAnomalyAuditModalOpen(false)}
          auditRecords={anomalyAuditRecords}
        />
      )}

      {isQuickSnapshotModalOpen && (
        <QuickSnapshotModal
          isOpen={true}
          onClose={() => setIsQuickSnapshotModalOpen(false)}
          alerts={activeAlerts}
          zones={zones}
          anomalyAuditRecords={anomalyAuditRecords}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onJumpToZone={(zoneId) => {
            setSelectedZone(zoneId);
            setIsQuickSnapshotModalOpen(false);
            const el = document.getElementById('zone-anomaly-concentration-heatmap');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {isInspectorOpen && (
        <TelemetryInspectorModal
          isOpen={true}
          onClose={() => setIsInspectorOpen(false)}
          telemetryStream={telemetryStream}
          zoneName={activeZoneObj.name}
        />
      )}

      {isSimulatorOpen && (
        <StreamSimulatorDrawer
          isOpen={true}
          onClose={() => setIsSimulatorOpen(false)}
          currentZone={selectedZone}
          onSimulateCustomPacket={handleCustomPacketFromSimulator}
          isStreamingActive={isStreamingActive}
          onToggleLiveStream={() => setIsStreamingActive((s) => !s)}
          jitterEnabled={jitterEnabled}
          onToggleJitter={() => setJitterEnabled((j) => !j)}
          onTriggerBurst={handleTriggerBurst}
        />
      )}

      {isReportModalOpen && (
        <ReportExportModal
          isOpen={true}
          onClose={() => setIsReportModalOpen(false)}
          activeAlerts={activeAlerts}
          telemetryStream={telemetryStream}
          currentZone={activeZoneObj.name}
          zones={zones}
        />
      )}

      {isSettingsModalOpen && (
        <KalmanSettingsModal
          isOpen={true}
          onClose={() => setIsSettingsModalOpen(false)}
          currentConfig={kalmanConfig}
          onSaveConfig={handleSaveConfig}
          voiceSettings={voiceSettings}
          onUpdateVoiceSettings={setVoiceSettings}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        />
      )}

      {isDispatchModalOpen && (
        <MedicalDispatchModal
          isOpen={true}
          onClose={() => setIsDispatchModalOpen(false)}
          dispatches={medicalDispatches}
          onTransmitDispatch={handleTransmitDispatch}
          onTransmitAll={handleTransmitAllDispatches}
          onAcknowledgeDispatch={handleAcknowledgeDispatch}
          onStageNewDispatch={handleStageNewDispatch}
          zoneNames={zones.map((z) => z.name)}
        />
      )}

      {isZoneBuilderOpen && (
        <CustomZoneBuilderModal
          isOpen={true}
          onClose={() => setIsZoneBuilderOpen(false)}
          onAddZone={handleAddCustomZone}
        />
      )}

      {/* Audible Voice Alerts Synthesis Modal */}
      {isVoiceModalOpen && (
        <VoiceAlertsModal
          isOpen={true}
          onClose={() => setIsVoiceModalOpen(false)}
          settings={voiceSettings}
          onUpdateSettings={setVoiceSettings}
          isSpeaking={isSpeaking}
          onStopSpeaking={handleStopSpeaking}
        />
      )}

      {/* Workforce Health Signal Notification Thresholds Configuration Modal */}
      {isHealthThresholdsModalOpen && (
        <HealthThresholdsConfigModal
          isOpen={true}
          onClose={() => setIsHealthThresholdsModalOpen(false)}
          currentThresholds={healthThresholds}
          onSaveThresholds={handleSaveHealthThresholds}
          zones={zones}
          activeZoneId={selectedZone}
        />
      )}

      {/* Historical Anomaly Log Statutory Compliance CSV Export Modal */}
      {isComplianceCsvExportModalOpen && (
        <HistoricalAnomalyCsvExportModal
          isOpen={true}
          onClose={() => setIsComplianceCsvExportModalOpen(false)}
          alerts={activeAlerts}
          zones={zones}
          selectedZoneId={selectedZone}
          thresholds={healthThresholds}
          onExportLogged={handleHistoricalComplianceExportLogged}
        />
      )}

      {/* Historical Anomaly Log Formatted PDF Document Export Modal */}
      {isCompliancePdfExportModalOpen && (
        <HistoricalAnomalyPdfExportModal
          isOpen={true}
          onClose={() => setIsCompliancePdfExportModalOpen(false)}
          alerts={activeAlerts}
          zones={zones}
          selectedZoneId={selectedZone}
          thresholds={healthThresholds}
          onExportLogged={handleHistoricalCompliancePdfExportLogged}
        />
      )}

      {/* Health Metrics Current Display Mock PDF Export Modal */}
      {isHealthMetricsPdfModalOpen && (
        <HealthMetricsPdfExportModal
          isOpen={true}
          onClose={() => setIsHealthMetricsPdfModalOpen(false)}
          zone={activeZoneObj}
          telemetryStream={telemetryStream}
          activeAlerts={activeAlerts}
          thresholds={healthThresholds}
          onReportExported={handleHealthMetricsReportExported}
        />
      )}

      {/* Comprehensive Anomaly Telemetry Parameters & Kalman State Diagnostics Modal */}
      {isAnomalyDetailModalOpen && (
        <AnomalyTelemetryDetailModal
          isOpen={true}
          onClose={() => {
            setIsAnomalyDetailModalOpen(false);
            setSelectedAnomalyForDetail(null);
          }}
          anomaly={selectedAnomalyForDetail}
          zone={activeZoneObj}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onDispatchAction={handleDispatchAction}
          onSelectZone={(zoneId) => {
            setSelectedZone(zoneId);
            setAnomalyTrendZoneId(zoneId);
            const zoneObj = zones.find((z) => z.id === zoneId) || activeZoneObj;
            const newPacket = generatePacketForZone(zoneObj, zoneObj.status === 'CRITICAL');
            const res = predictWorkforceAnomaly(newPacket, undefined, kalmanConfig);
            setTelemetryAlert(res);
          }}
        />
      )}

      {/* Download Options Modal: Select specific metrics to include in report before downloading */}
      {isDownloadOptionsModalOpen && (
        <DownloadOptionsModal
          isOpen={true}
          onClose={() => setIsDownloadOptionsModalOpen(false)}
          zones={zones}
          activeAlerts={activeAlerts}
          telemetryStream={telemetryStream}
          currentZone={activeZoneObj}
          onExportSuccess={(filename, exportFormat, metricCount) => {
            setProtocolActiveNotice(
              `Custom report downloaded (${metricCount} metrics, ${exportFormat}): ${filename}`
            );
            setTimeout(() => setProtocolActiveNotice(null), 6000);
          }}
        />
      )}

      {/* Safety Committee PDF Report Export Modal: Offline review by the Joint Health & Safety Committee */}
      {isSafetyCommitteePdfModalOpen && (
        <SafetyCommitteePdfExportModal
          isOpen={true}
          onClose={() => setIsSafetyCommitteePdfModalOpen(false)}
          activeAlerts={activeAlerts}
          currentZone={activeZoneObj}
          zones={zones}
          telemetryStream={telemetryStream}
          healthThresholds={healthThresholds}
          kalmanConfig={kalmanConfig}
          onExportSuccess={(filename) => handleSafetyCommitteeExportSuccess(filename)}
        />
      )}

      {/* Category-based Signal Filter Sidebar */}
      {isSignalFilterSidebarOpen && (
        <SignalCategoryFilterSidebar
          isOpen={true}
          onClose={() => setIsSignalFilterSidebarOpen(false)}
          categories={signalCategories}
          onToggleCategory={handleToggleSignalCategory}
          granularSignals={granularSignals}
          onToggleSignal={handleToggleGranularSignal}
          onResetFilters={handleResetSignalFilters}
          onSelectAllSignals={handleSelectAllSignals}
          showMovingAverages={showGlobalMovingAverages}
          onToggleMovingAverages={() => setShowGlobalMovingAverages((prev) => !prev)}
          maWindowHours={globalMaWindowHours}
          onChangeMaWindow={setGlobalMaWindowHours}
          isAccessibilityMode={isAccessibilityMode}
          onToggleAccessibilityMode={handleToggleAccessibilityMode}
        />
      )}

      {/* Alert History Component: Maintains a chronological list of past anomalies */}
      {(isAlertHistoryOpen || isAlertHistoryDocked) && (
        <AlertHistory
          isOpen={isAlertHistoryOpen || isAlertHistoryDocked}
          onClose={() => setIsAlertHistoryOpen(false)}
          pastAnomalies={pastAnomalies}
          onUpdateResolutionNote={handleUpdatePastAnomalyResolutionNote}
          onMarkResolved={handleMarkPastAnomalyResolved}
          onBulkMarkStatus={handleBulkUpdatePastAnomaliesStatus}
          onInspectAnomaly={handleOpenAnomalyDetails}
          onSelectZone={(zoneId) => {
            setSelectedZone(zoneId);
            setAnomalyTrendZoneId(zoneId);
          }}
          isDocked={isAlertHistoryDocked}
          onToggleDock={() => setIsAlertHistoryDocked((prev) => !prev)}
        />
      )}

      {/* Global Threshold Settings Modal */}
      {isGlobalThresholdModalOpen && (
        <GlobalThresholdSettingsModal
          isOpen={true}
          onClose={() => setIsGlobalThresholdModalOpen(false)}
          currentThresholds={healthThresholds}
          currentSensitivity={globalSensitivity}
          onSaveSettings={handleSaveGlobalThresholdSettings}
          zones={zones}
          telemetryStream={telemetryStream}
        />
      )}

      {/* Unified Enterprise Toast Notification System (Single Bottom-Right Stack, Capped at Max 2) */}
      <UnifiedNotificationToaster
        criticalToasts={criticalAnomalyToasts}
        breachToasts={activeToasts}
        onDismissCritical={handleDismissCriticalToast}
        onDismissBreach={handleDismissToast}
        onAcknowledgeCritical={handleAcknowledgeCriticalToast}
        onAcknowledgeBreach={handleAcknowledgeToast}
        onClearAll={() => {
          handleClearAllCriticalToasts();
          handleClearAllToasts();
        }}
        onDispatchCritical={handleDispatchActionForCriticalToast}
        onDispatchBreach={handleDispatchActionForToast}
        onInspectInChart={handleInspectSignalInChart}
        onOpenNotificationCenter={() => {
          const el = document.getElementById('high-risk-notification-center') || document.getElementById('notification-center-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        soundEnabled={toastSoundEnabled && !isAlertsMuted}
        onToggleSound={() => setToastSoundEnabled((s) => !s)}
      />

      {/* Real-Time Team Mobile Alerts & Engineer Read Receipts Modal Simulator */}
      {isTeamAlertModalOpen && (
        <TeamAlertMobileModal
          isOpen={true}
          onClose={() => setIsTeamAlertModalOpen(false)}
          onAlertAcknowledged={(alert) => {
            setProtocolActiveNotice(
              `Field engineer acknowledged incident ${alert.incidentId || alert.id}: ${alert.fieldNotes || 'Status updated to En Route.'}`
            );
            setTimeout(() => setProtocolActiveNotice(null), 6000);
          }}
        />
      )}

      {/* Telemetry Ingest & Industry Benchmarks Upload Modal */}
      {isUploadModalOpen && (
        <TelemetryUploadModal
          isOpen={true}
          onClose={() => setIsUploadModalOpen(false)}
          onIngestDataset={handleIngestUploadedDataset}
          onNotice={(msg) => {
            setProtocolActiveNotice(msg);
            setTimeout(() => setProtocolActiveNotice(null), 8000);
          }}
        />
      )}

      {/* Formal PDF Report Document Footer */}
      <div className="hidden print:block print-footer-banner border-t-2 border-slate-900 pt-3 mt-8 text-xs font-mono text-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <strong>Document Classification:</strong> OFFICIAL SITE SAFETY BRIEFING &bull; OSHA 1910 / ISO 45001 COMPLIANT
          </div>
          <div>
            <strong>Generated By:</strong> Prognosticator v2.0 Early-Warning Intelligence Engine
          </div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Confidential Workforce Health Record &bull; Privacy Shield Applied: k-Anonymity (N &ge; 12) &amp; &epsilon;-DP (0.5) Enforced
        </div>
      </div>
    </div>
  );
}

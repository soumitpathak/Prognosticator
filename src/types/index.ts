export interface TelemetryPacket {
  worker_id: string;
  location_zone: string;
  timestamp: string;
  hrv_series: number[];
  skin_temp_series: number[];
  heat_index: number;
  sleep_deficit_hours: number;
  twl_index?: number;
  ambient_temp_c?: number;
  aqi?: number;
  sick_leave_rate_deviation?: number;
  cohort_size?: number;
}

export type RiskTier = 'CRITICAL_RISK' | 'MODERATE_RISK' | 'STABLE';

export type SensitivityPreset = 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM';

export interface KalmanSensitivityConfig {
  preset: SensitivityPreset;
  processVarianceQ: number;
  measurementVarianceR: number;
  criticalCutoffPct: number;
  moderateCutoffPct: number;
  autoImputeMissing: boolean;
  suppressSmallCells: boolean;
}

export interface HealthSignalNotificationThresholds {
  minHrvMs: number; // minimum acceptable HRV (ms) before trigger
  maxHrvDropPct: number; // maximum acceptable HRV drop (%)
  maxSkinTempC: number; // maximum core/skin temperature (°C)
  maxAmbientHeatC: number; // maximum ambient temperature (°C)
  maxNoiseDb: number; // maximum acoustic noise limit (dBA)
  minTwlIndex: number; // minimum Thermal Work Limit (W/m²)
  riskScoreCutoffPct: number; // composite risk score cutoff (%)
  maxHeartRateBpm?: number; // maximum allowable heart rate in beats per minute (e.g. 115 bpm)
  dailyAnomalyFrequencyThreshold?: number; // e.g. 5 events/day
  criticalDailyFrequencyThreshold?: number; // e.g. 3 events/day
  proactiveRiskThreshold?: number; // 7-day moving average projected safe level (e.g. 5.5 events/day)
  sensitivityLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'CUSTOM';
  enableSmsRadioDispatch: boolean;
  enableVoiceAlerts: boolean;
  enableInAppBeacon: boolean;
  applicableZoneId: string; // 'ALL' or specific zone ID
}

export interface AnomalyPredictionResult {
  status: 'success' | 'suppressed';
  worker_id: string;
  location_zone: string;
  risk_tier: RiskTier;
  risk_probability: number;
  reconstruction_mse: number;
  explainable_attributions: Record<string, number>;
  recommended_operational_action: string;
  privacy_compliance: string;
  is_suppressed?: boolean;
  suppression_reason?: string;
  differential_privacy_noise?: number;
}

export interface ZoneWeatherData {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  windSpeed: number;
  lastFetched: string;
  source: string;
  baselineAdjustment: string;
  heatStrainIndex: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface ZoneCustomBaselines {
  baselineHrv: number; // default 68
  baselineSkinTemp: number; // default 36.5
  noiseLimitDb: number; // default 85
  heatThresholdC: number; // default 35
}

export interface FacilityZone {
  id: string;
  name: string;
  status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  count: number;
  temp: string;
  heatIndex: number;
  twl: number;
  aqi: number;
  description: string;
  activeHazards: string[];
  latitude: number;
  longitude: number;
  customBaselines?: ZoneCustomBaselines;
  liveWeather?: ZoneWeatherData;
}

export interface MedicalDispatchNotification {
  id: string;
  alertId: string;
  zone: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  recipientRole: string;
  contactMethod: 'SMS' | 'PUSH_RADIO' | 'DUAL_CHANNEL';
  recipientPhone: string;
  messagePayload: string;
  stagedAt: string;
  status: 'STAGED' | 'TRANSMITTED' | 'ACKNOWLEDGED_BY_TEAM';
  acknowledgedAt?: string;
  responderNotes?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 'ALERT_DISPATCH' | 'HYDRATION_PROTOCOL' | 'PRIVACY_SUPPRESSION' | 'CALIBRATION' | 'EXPORT_AUDIT';
  zone: string;
  cohortCount: number;
  riskTier: string;
  privacyEnforced: string;
  actionTaken: string;
}

export type AlertType = 'PREDICTIVE_MAINTENANCE' | 'HEALTH_ANOMALY' | 'ENVIRONMENTAL';

export interface ActiveAnomalyAlert {
  id: string;
  worker_id: string;
  location_zone: string;
  detected_at: string;
  anomaly_metric: string;
  raw_value: string;
  kalman_smoothed_value: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  kalman_status: 'Jitter Filtered & Validated' | 'Signal Imputed' | 'Confirmed Sensor Spike' | 'Transient Noise Suppressed';
  lead_time: string;
  recommended_action: string;
  acknowledged: boolean;
  privacy_status: string;
  // Predictive Maintenance fields
  alert_type?: AlertType;
  equipment_id?: string;
  equipment_name?: string;
  equipment_subsystem?: string;
  vibration_mm_s?: number;
  equipment_temp_c?: number;
  maintenance_urgency?: 'IMMEDIATE_STOP' | 'SCHEDULED_LUBRICATION' | 'BEARING_REPLACEMENT' | 'ROTOR_REBALANCE' | 'ROUTINE_MONITORING';
  iso_10816_class?: string;
}

export interface TelemetryDataPoint {
  timestamp: string;
  timeLabel: string;
  ambient_temp_c: number;
  noise_db: number;
  raw_noise_db: number;
  smoothed_noise_db: number;
  twl_index: number;
  aqi: number;
  hrv_drop_pct: number;
  raw_hrv: number;
  smoothed_hrv: number;
  skin_temp_c: number;
  raw_skin_temp: number;
  smoothed_skin_temp: number;
  sick_leave_rate_deviation: number;
  is_anomaly: boolean;
  risk_score: number;
  heart_rate_bpm?: number;
  raw_heart_rate_bpm?: number;
  // Equipment telemetry for predictive maintenance & multi-variable correlation
  equipment_vibration_mm_s?: number;
  equipment_bearing_temp_c?: number;
  zone?: string;
}

export interface SensorCorrelationPoint {
  id: string;
  timestamp: string;
  timeLabel: string;
  zone: string;
  ambient_temp_c: number;
  noise_db: number;
  equipment_vibration_mm_s: number;
  equipment_bearing_temp_c: number;
  skin_temp_c: number;
  hrv_drop_pct: number;
  raw_hrv: number;
  twl_index: number;
  aqi: number;
  risk_score: number;
  is_incident: boolean;
  incident_type?: AlertType | 'NONE';
  incident_label?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface SensorStreamToggles {
  ambientTemp: boolean;
  noiseDb: boolean;
  hrvDrop: boolean;
  skinTemp: boolean;
  twlHeatStrain: boolean;
  aqiAirQuality: boolean;
  riskScore: boolean;
}

export type AuditChangeCategory =
  | 'THRESHOLD_CHANGE'
  | 'ZONE_CONFIG'
  | 'FILTER_CALIBRATION'
  | 'RESOURCE_REALLOCATION'
  | 'MAINTENANCE_DISPATCH'
  | 'BIOMETRIC_SYNC'
  | 'SHIFT_HANDOVER'
  | 'REPORT_EXPORT';

export type SafetyPersonnelRole =
  | 'EMERGENCY_MEDICAL_RESPONDER'
  | 'HEAT_HYDRATION_STEWARD'
  | 'ACOUSTIC_SAFETY_OFFICER'
  | 'RELIABILITY_VIBRATION_ENGINEER'
  | 'ERGONOMIC_SAFETY_LEAD';

export interface SafetyOfficer {
  id: string;
  name: string;
  role: SafetyPersonnelRole;
  currentZoneId: string; // zone ID or 'CENTRAL_STANDBY'
  status: 'DEPLOYED' | 'EN_ROUTE' | 'STANDBY';
  assignedAt: string;
  contactNumber: string;
  specialization: string;
  experienceYears: number;
}

export interface ZoneResourceAllocation {
  zoneId: string;
  recommendedStaffCount: number;
  assignedOfficers: SafetyOfficer[];
  coverageRatio: number;
  coverageStatus: 'OPTIMAL' | 'SUFFICIENT' | 'CRITICAL_DEFICIT';
}

export interface DeploymentOrder {
  id: string;
  timestamp: string;
  fromZone: string;
  toZone: string;
  officerIds: string[];
  officerNames: string[];
  reason: string;
  urgency: 'CRITICAL' | 'ELEVATED' | 'ROUTINE';
  status: 'ACTIVE' | 'COMPLETED';
}

export interface SeverityAudioToggles {
  CRITICAL: boolean;
  HIGH: boolean;
  MODERATE: boolean;
  LOW: boolean;
}

export interface VoiceAlertSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  rate: number; // 0.8 to 1.4
  pitch: number; // 0.8 to 1.2
  announceCriticalOnly: boolean;
  chimeSound: boolean;
  selectedVoiceName?: string;
  severityAudioToggles?: SeverityAudioToggles;
}

export interface SystemAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  category: AuditChangeCategory;
  targetModule: string;
  parameter: string;
  previousValue: string;
  newValue: string;
  justification: string;
  approvalStatus: 'VERIFIED' | 'APPLIED' | 'FLAGGED';
  ipAddress?: string;
  zoneId?: string;
}

// ==========================================
// Wearable Biometric Synchronization Types
// ==========================================

export type WorkerStressTier = 'OPTIMAL' | 'MODERATE' | 'HIGH_STRESS' | 'CRITICAL_STRAIN';

export interface WearableHrvHistoryItem {
  timestamp: string;
  timeLabel: string;
  rmssd: number; // ms
  heartRate: number; // bpm
  stressScore: number; // 0-100
  skinTempC: number;
}

export interface WorkerWearableDevice {
  id: string; // e.g. 'DEV-BLE-9921'
  workerId: string; // e.g. 'W-9921'
  workerName: string;
  zoneId: string;
  zoneName: string;
  deviceModel: string; // e.g. 'Polar H10 ECG Band', 'Garmin Forerunner Pro', 'Whoop 4.0 Strap'
  deviceType: 'CHEST_STRAP' | 'WRIST_BAND' | 'SMART_RING' | 'BIO_HARNESS';
  connectionStatus: 'CONNECTED' | 'PAIRING' | 'SYNCING' | 'DISCONNECTED';
  batteryPct: number;
  rssiSignalDbm: number;
  currentHeartRate: number; // bpm
  currentRmssd: number; // Root Mean Square of Successive Differences (ms)
  currentSdnn: number; // Standard Deviation of NN intervals (ms)
  stressScore: number; // 0-100 Baevsky Stress Index normalized
  stressTier: WorkerStressTier;
  pnsIndex: number; // Parasympathetic tone index (-3 to +3)
  snsIndex: number; // Sympathetic tone index (-3 to +3)
  rrIntervals: number[]; // Rolling beat-to-beat inter-beat intervals (ms)
  recentHrvHistory: WearableHrvHistoryItem[];
  lastSyncTime: string;
  isPairingViaBluetooth?: boolean;
}

// ==========================================
// Automated Maintenance Scheduling Types
// ==========================================

export type TechnicianSpecialization =
  | 'VIBRATION_ANALYSIS_CAT_III'
  | 'ELECTRO_MECHANICAL_MILLWRIGHT'
  | 'HVAC_THERMAL_CHILLER'
  | 'HYDRAULIC_TURBINE_PUMP'
  | 'INSTRUMENTATION_CONTROLS';

export type TechnicianAvailability = 'AVAILABLE' | 'ON_REPAIR' | 'ON_BREAK' | 'OFF_DUTY';

export interface MaintenanceTechnician {
  id: string;
  name: string;
  specialization: TechnicianSpecialization;
  certification: string; // e.g. 'ISO 18436-2 Cat III Vibration Specialist'
  status: TechnicianAvailability;
  assignedZone: string;
  shiftWindow: string; // e.g. '07:00 - 15:30'
  rating: number; // e.g. 4.9
  experienceYears: number;
  activeTicketsCount: number;
  contactPhone: string;
  estimatedArrivalMin: number;
}

export type TicketUrgency =
  | 'IMMEDIATE_STOP'
  | 'BEARING_REPLACEMENT'
  | 'SCHEDULED_LUBRICATION'
  | 'ROTOR_REBALANCE'
  | 'ROUTINE_MONITORING';

export type TicketStatus = 'STAGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export interface MaintenanceTicket {
  id: string; // e.g. 'TKT-PM-9042'
  alertId: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSubsystem: string;
  zone: string;
  vibrationMmS: number;
  isoClass: string;
  urgency: TicketUrgency;
  issueDescription: string;
  recommendedAction: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  status: TicketStatus;
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  estimatedMttrHours: number; // Mean time to repair
  requiredParts: string[];
  lotoRequired: boolean; // Lockout / Tagout mandatory
  matchScorePct?: number; // Automated correlation match score (0-100%)
  managerNotes?: string;
}

// ==========================================
// Shift Handover Types
// ==========================================

export interface ShiftHandoverReport {
  id: string;
  generatedAt: string;
  shiftWindow: string; // e.g. "Last 8 Hours (03:00 - 11:00)"
  outgoingSupervisor: string;
  incomingSupervisor: string;
  totalAnomaliesDetected: number;
  criticalAnomaliesCount: number;
  highAnomaliesCount: number;
  moderateAnomaliesCount: number;
  peakAmbientTempC: number;
  peakNoiseDb: number;
  minimumWorkerRmssd: number;
  highestRiskZone: string;
  pendingMaintenanceTicketsCount: number;
  criticalLotoCount: number;
  deployedSafetyOfficersCount: number;
  standbyOfficersCount: number;
  handoverStatus: 'CLEARED_NOMINAL' | 'ELEVATED_ATTENTION' | 'CRITICAL_CONDITIONAL';
  immediateDirectives: string[];
  acknowledgedByIncoming: boolean;
}

// ==========================================
// Real-Time Notification Toast Types
// ==========================================

export type ToastSignalKey =
  | 'heartRate'
  | 'ambientTemp'
  | 'hrv'
  | 'skinTemp'
  | 'noise'
  | 'twl'
  | 'riskScore'
  | 'anomalyEngine'
  | 'predictiveMaintenance';

export interface ThresholdBreachToast {
  id: string;
  timestamp: string;
  timeFormatted: string;
  signalKey: ToastSignalKey;
  signalName: string;
  measuredValue: number;
  measuredFormatted: string;
  thresholdLimit: number;
  thresholdFormatted: string;
  unit: string;
  deltaFormatted: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  zoneId: string;
  zoneName: string;
  workerCount: number;
  recommendedAction: string;
  acknowledged: boolean;
  createdAt: number;
  autoDismissMs: number;
  privacyComplianceNotice?: string;
  alertType?: AlertType;
  anomalyId?: string;
}

// ==========================================
// Anomaly Audit Log Types
// ==========================================

export interface AnomalyAuditRecord {
  id: string;
  anomalyId: string;
  timestamp: string; // ISO timestamp
  timeFormatted: string; // e.g. "2026-11-04 09:08:15"
  relativeTime: string; // e.g. "12 mins ago"
  zone: string;
  department: string;
  anomalyMetric: string;
  measuredValue: string;
  thresholdLimit: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number; // 0 to 1, e.g. 0.948
  confidenceScoreFormatted: string; // "94.8%"
  modelAttribution: string; // e.g. "LSTM Autoencoder (MSE: 0.342) + Kalman Noise Filter"
  correctiveActionTaken: string; // Action executed/dispatched
  actionStatus: 'COMPLETED' | 'TRANSMITTED' | 'DISPATCH_STAGED' | 'VERIFIED';
  actionTakenBy: string; // e.g. "Dr. Marcus Vance, MD" | "Automated Dispatch Relay"
  workerId?: string;
  equipmentId?: string;
  privacyEnforced: string; // "k-Anonymity Verified (N >= 12)"
  responderNotes?: string;
}

// ==========================================
// 48-Hour Forecast Staffing & Resource Distribution Types
// ==========================================

export interface ForecastStaffingSuggestion {
  id: string;
  zoneId: string;
  zoneName: string;
  department: string;
  forecastWindow: string; // e.g. "+12h to +16h (Afternoon Heat Peak)"
  forecastedRiskTier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  forecastedIncidentRate: number; // e.g. 4.8 incidents/window
  anticipatedHealthSignal: string; // e.g. "Acute Parasympathetic HRV Collapse & Core Heat Strain"
  currentStaffCount: number;
  recommendedStaffCount: number;
  staffDeficit: number; // e.g. +2
  recommendedRoles: SafetyPersonnelRole[];
  suggestedAction: string;
  resourceKitRecommendations: string[];
  estimatedRiskMitigationPct: number; // e.g. 46%
  status: 'PENDING_DEPLOYMENT' | 'APPLIED';
}

// ==========================================
// 30-Day Anomaly Trend Frequency Types
// ==========================================

export interface AnomalyTrendDay {
  dayIndex: number; // 0 (30 days ago) to 29 (today)
  date: string; // e.g. "Oct 06"
  fullDate: string; // e.g. "2026-10-06"
  dayOfWeek: string; // "Mon", "Tue", etc.
  totalAnomalies: number;
  criticalCount: number;
  moderateCount: number;
  resolvedCount: number;
  movingAvg7d: number;
  anomalyRatePer100: number;
  avgAmbientTempC: number;
  avgHrvMs: number;
  peakHour: string;
  primaryDriver: string;
  isHeatwavePeriod: boolean;
  zoneCounts: Record<string, number>;
  // Comparison with Previous 30-Day Period
  prevPeriodAnomalies?: number;
  prevPeriodCritical?: number;
  prevPeriodDate?: string;
  periodVariancePct?: number;
}

// ==========================================
// Geographical & Department Anomaly Heatmap Types
// ==========================================

export interface DepartmentHeatmapRow {
  id: string;
  departmentName: string;
  facilityLocation: string;
  region: string;
  latitude: number;
  longitude: number;
  cohortSize: number;
  totalAnomalies: number;
  criticalCount: number;
  moderateCount: number;
  anomalyRatePer100: number;
  heatStrainIndex: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  primaryRiskDriver: string;
  trendShiftPct: number;
  weeklyDays: number[]; // 7 numbers (Mon-Sun)
  shiftDistribution: {
    morning: number;
    afternoonPeak: number;
    evening: number;
    night: number;
  };
}

export interface DepartmentRiskThreshold {
  departmentId: string;
  departmentName: string;
  facilityLocation: string;
  thresholdPct: number;
  defaultThresholdPct: number;
  currentRiskScore: number;
  isBreached: boolean;
  primaryRiskDriver: string;
}

// ==========================================
// Real-Time Critical Anomaly Toast Notification Types
// ==========================================

export interface CriticalAnomalyToastData {
  id: string;
  anomalyId: string;
  timestamp: string;
  timeFormatted: string;
  department: string;
  zoneId: string;
  zoneName: string;
  confidenceLevel: number; // 0.0 to 1.0 (e.g. 0.948)
  confidenceLevelFormatted: string; // e.g. "94.8%"
  reconstructionMse: number;
  anomalyMetric: string;
  measuredValue: string;
  thresholdLimit: string;
  recommendedAction: string;
  workerPseudonym: string;
  cohortCount: number;
  privacyNotice: string;
  createdAt: number;
  autoDismissMs: number;
  acknowledged: boolean;
  riskTier?: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK';
  riskProbability?: number;
  attributions?: Record<string, number>;
  dispatched?: boolean;
  // Kalman Filter Model specific properties
  kalmanSmoothedValue?: string;
  rawMeasuredValue?: string;
  kalmanStatus?: string;
  kalmanGain?: number;
  processVarianceQ?: number;
  measurementVarianceR?: number;
}

export interface AnomalyTrendDayWithProjection extends AnomalyTrendDay {
  isProjected?: boolean;
  projectedTrend?: number | null;
  projectedUpper?: number | null;
  projectedLower?: number | null;
  projectedConfidence?: number;
}

// ==========================================
// Incident Response Workflow Types
// ==========================================

export type IncidentWorkflowStatus = 'Pending' | 'Investigating' | 'Resolved';

export interface IncidentAssignee {
  id: string;
  name: string;
  role: string;
  team: 'MEDICAL_TRIAGE' | 'ACOUSTIC_DEFENSE' | 'THERMAL_COOLING' | 'MECHANICAL_RELIABILITY' | 'HAZMAT_SAFETY' | 'EHS_LEAD';
  avatarInitials: string;
  phone: string;
  activeIncidentsCount: number;
}

export interface IncidentActivityLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
  previousStatus?: IncidentWorkflowStatus;
  newStatus?: IncidentWorkflowStatus;
}

export interface IncidentAssignment {
  eventId: string;
  status: IncidentWorkflowStatus;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  assignedAt?: string;
  updatedAt: string;
  resolutionNotes?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  activityLog: IncidentActivityLogEntry[];
}

// ==========================================
// LSTM 12-Hour Predictive Risk Forecast Types
// ==========================================

export interface Lstm12hForecastHour {
  hourOffset: number; // 1 to 12
  timeLabel: string; // e.g. "+1h (16:00)"
  absoluteTime: string; // e.g. "16:00"
  projectedRiskScore: number; // 0 to 100
  projectedRiskTier: 'CRITICAL_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  reconstructionMse: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidencePct: number;
  primaryProjectedDriver: string;
  ambientHeatForecastC: number;
  hrvRestForecastMs: number;
  isProjectedPeak?: boolean;
  predictedThresholdBreach?: string;
  recommendedMitigation?: string;
}

export interface Lstm12hForecastResult {
  generatedAt: string;
  baselineCurrentRisk: number;
  projectedPeakRisk: number;
  peakHourOffset: number;
  peakTimeLabel: string;
  riskInflectionVelocity: number; // delta percentage
  hoursInHighOrCriticalRisk: number;
  modelConfidenceIndex: number; // e.g. 94.6%
  scenario: 'BASELINE' | 'HEAT_SURGE' | 'MITIGATED';
  hours: Lstm12hForecastHour[];
  keyDriversSummary: string;
}

// ==========================================
// Real-Time Team Alert & Read Receipts Types
// ==========================================

export type TeamAlertStatus = 'UNREAD' | 'READ' | 'EN_ROUTE' | 'RESOLVED';

export interface TeamAlertNotification {
  id: string;
  incidentId: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  zone: string;
  anomalyMetric: string;
  directive: string;
  timestamp: string;
  deliveredAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  status: TeamAlertStatus;
  fieldNotes?: string;
}

// ==========================================
// Anomaly Pattern Library & Signature Types
// ==========================================

export type AnomalyPatternCategory = 'ENVIRONMENTAL' | 'MECHANICAL' | 'PHYSIOLOGICAL' | 'COMBINED';

export interface AnomalySignaturePoint {
  tMinutes: number; // e.g. -60 to +60
  primaryValue: number;
  correlatedValue: number;
  baselineEnvelopeUpper: number;
  baselineEnvelopeLower: number;
  previousYearPrimaryValue?: number; // Previous year cyclical/seasonal signature value
  previousYearCorrelatedValue?: number;
  previousYearEnvelopeUpper?: number;
  previousYearEnvelopeLower?: number;
}

export interface SeasonalCyclicalMetrics {
  seasonalCycleName: string; // e.g. "Annual Summer Diurnal Heat Solstice Cycle (Q3)"
  priorYearBaselineLabel: string; // e.g. "FY2025 Historical Seasonal Baseline"
  yoyPeakAmplitudeDeltaPct: number; // e.g. +14.2% (higher peak this year)
  seasonalPhaseShiftMins: number; // e.g. -15 mins (peaking 15 mins earlier this year)
  cyclicalRecurrenceConfidence: number; // e.g. 94.6%
  recurrenceClassification: string; // e.g. "Cyclical Diurnal Thermal Escalation"
  seasonalAnalysisTakeaway: string; // e.g. "Earlier thermal inflection compared to FY2025 indicates accelerated heat storage; triggers earlier hydration rotations."
}

export interface AnomalyPatternSignature {
  id: string;
  code: string; // e.g. "SIG-ENV-HEAT-01"
  name: string;
  category: AnomalyPatternCategory;
  description: string;
  recurrenceCount90d: number;
  typicalSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  precursorWindowMins: number;
  riseVelocityPctPerMin: number;
  recoveryTimeHours: number;
  primarySignalName: string;
  primarySignalUnit: string;
  correlatedSignalName: string;
  correlatedSignalUnit: string;
  waveformData: AnomalySignaturePoint[];
  regulatoryClassification: string;
  mitigationProcedure: string;
  affectedFacilities: string[];
  lstmAttributionConfidence: number;
  seasonalMetrics?: SeasonalCyclicalMetrics;
}

export type WorkerDensityClassification = 'OPTIMAL' | 'MODERATE' | 'ELEVATED' | 'CRITICAL_OVERCROWDING';

export interface WorkerDensityIncidentRef {
  alertId: string;
  severity: 'CRITICAL' | 'HIGH';
  metric: string;
  locationZone: string;
  workerId: string;
  timeOffset: string;
  leadTime?: string;
  recommendedAction: string;
  densityAtIncident: number; // workers/100m²
}

export interface WorkerDensityHeatmapCell {
  id: string; // e.g. "cell-2026-11-04-14"
  dayIndex: number; // 0 to 6 (0 = 6 days ago, 6 = today)
  dateStr: string; // ISO date e.g. "2026-11-04"
  dayName: string; // "Wed"
  dayOfWeekFull: string; // "Wednesday"
  hour: number; // 0 to 23
  hourLabel: string; // "14:00"
  shiftLabel: string; // "Swing / Afternoon"
  workerCount: number; // total active headcount
  densityPer100Sqm: number; // workers / 100m²
  capacityUtilizationPct: number; // % of zone safe threshold
  classification: WorkerDensityClassification;
  highRiskEventCount: number;
  criticalIncidentCount: number;
  highIncidentCount: number;
  incidents: WorkerDensityIncidentRef[];
  ambientTempC: number;
  noiseDb: number;
  zoneId?: string;
  zoneName?: string;
  primaryRiskFactor: string;
  airQualityAqi: number;
}

export interface WorkerDensityCorrelationSummary {
  pearsonR: number; // Pearson correlation coefficient
  rSquared: number;
  pValue: number;
  correlationStrength: 'STRONG_POSITIVE' | 'MODERATE_POSITIVE' | 'NEGLIGIBLE';
  totalWeeklyObservations: number; // 168 (7x24)
  totalWeeklyWorkerHours: number;
  totalHighRiskEvents: number;
  eventsInElevatedOrOvercrowded: number;
  overcrowdedIncidentPercentage: number;
  riskMultiplierOver80Capacity: number;
  peakDensityCell: WorkerDensityHeatmapCell;
  lowestDensityCell: WorkerDensityHeatmapCell;
  dailyStats: Array<{
    dateStr: string;
    dayName: string;
    avgDensity: number;
    peakHeadcount: number;
    incidentCount: number;
    criticalCount: number;
  }>;
  hourlyProfile: Array<{
    hour: number;
    hourLabel: string;
    shift: string;
    avgWorkers: number;
    avgDensity: number;
    incidentFrequency: number;
    riskRatio: number;
  }>;
  zoneRiskBreakdown: Array<{
    zoneId: string;
    zoneName: string;
    safeCapacityCap: number;
    observedPeakHeadcount: number;
    peakDensity: number;
    totalIncidents: number;
    correlationScore: number;
    suggestedMitigation: string;
  }>;
}

// -------------------------------------------------------------
// BROWSER-BASED DESKTOP NOTIFICATION SERVICE TYPES
// -------------------------------------------------------------
export interface DesktopNotificationConfig {
  enabled: boolean;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  notifyOnlyWhenTabbedOut: boolean;
  minimumSeverity: 'CRITICAL' | 'HIGH';
  soundChimeEnabled: boolean;
  cooldownSeconds: number;
  lastAlertSentAt?: number;
}

export interface DesktopAlertPayload {
  id: string;
  title: string;
  body: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  zone: string;
  metric: string;
  timestamp: string;
  actionRequired: string;
}

export interface TelemetryRiskThresholdConfig {
  thresholdPct: number;
  browserAlertsEnabled: boolean;
  soundChimeEnabled: boolean;
  notifyOnlyWhenTabbedOut: boolean;
  cooldownSeconds: number;
  minimumDeltaForUrgentAlertPct: number;
}

export interface TelemetryRiskBreachEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  riskScore: number;
  threshold: number;
  delta: number;
  zoneId: string;
  zoneName: string;
  workerCount: number;
  severity: 'CRITICAL' | 'HIGH';
  triggerSignals: Array<{
    signalName: string;
    measuredValue: string;
    referenceBaseline: string;
  }>;
  recommendedAction: string;
  acknowledged: boolean;
  browserAlertDispatched: boolean;
  workerPseudonym?: string;
}

// -------------------------------------------------------------
// SYSTEM COMPLIANCE & HIPAA AUDIT TYPES
// -------------------------------------------------------------
export type ComplianceAccessAction =
  | 'VIEWED_STREAM'
  | 'EXPORTED_PDF'
  | 'EXPORTED_CSV'
  | 'OVERRODE_ALGORITHM_THRESHOLD'
  | 'DECRYPTED_PHI'
  | 'CONSENT_AUDITED'
  | 'EMERGENCY_OVERRIDE';

export type ComplianceReportType =
  | 'BIOMETRIC_TELEMETRY'
  | 'EXECUTIVE_SAFETY_REPORT'
  | 'WORKER_HEALTH_PHI'
  | 'ANOMALY_FORECAST_EXPORT'
  | 'ZONE_INCIDENT_DOSSIER'
  | 'POPULATION_HEALTH_EPIDEMIOLOGY';

export type ComplianceStatus =
  | 'COMPLIANT_AUTHORIZED'
  | 'ELEVATED_PRIVILEGE'
  | 'FLAGGED_ANOMALOUS_ACCESS'
  | 'BLOCKED_UNAUTHORIZED';

export interface ComplianceAuditEvent {
  id: string;
  timestamp: string;
  accessorId: string;
  accessorName: string;
  accessorRole: string;
  department: string;
  reportName: string;
  reportType: ComplianceReportType;
  accessAction: ComplianceAccessAction;
  hipaaClassification: string;
  privacyShieldMetric: {
    epsilonConsumed: number;
    kAnonymityCount: number;
    laplaceNoiseBudgetRemaining: number;
    status: ComplianceStatus;
  };
  dataSubjectCount: number;
  justification: string;
  ipAddress: string;
  terminalId: string;
  cryptographicHash: string;
  flaggedReason?: string;
}

export interface ComplianceSummaryMetrics {
  totalEvents24h: number;
  complianceRatePct: number;
  activeAccessorsCount: number;
  totalEpsilonExpended: number;
  flaggedCount: number;
  blockedCount: number;
  averageKAnonymity: number;
}

// -------------------------------------------------------------
// PREDICTIVE IOT ENDPOINT MAINTENANCE TYPES
// -------------------------------------------------------------
export type IoTEndpointType =
  | 'ACCELEROMETER'
  | 'PPG_BIOMETRIC'
  | 'SKIN_TEMP_PROBE'
  | 'GAS_PID'
  | 'ENVIRONMENTAL_COMBO'
  | 'EDGE_GATEWAY';

export type EndpointFailureHorizon =
  | 'CRITICAL_FAIL_24H'
  | 'HIGH_FAIL_72H'
  | 'ELEVATED_FAIL_7D'
  | 'NOMINAL';

export interface DegradationDataPoint {
  day: string;
  observedHealth: number;
  predictedDegradation: number;
  failureThreshold: number;
}

export interface ThirtyDayDegradationProjectionPoint {
  day: number; // 1 to 30
  dayLabel: string; // "Day +1", "Day +2", ...
  dateLabel: string; // "Nov 07", "Nov 08", ...
  healthIndex: number; // 0 to 100
  upperConfidenceBound: number;
  lowerConfidenceBound: number;
  dailyDegradationRate: number; // %/day
  cumulativeDegradationPct: number; // cumulative % loss from baseline
  failureProbabilityPct: number; // 0 to 100%
  criticalThreshold: number; // 30
  warningFloor: number; // 50
  status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL_FAILURE';
}

export interface IoTEndpointFailureForecast {
  endpointId: string;
  endpointName: string;
  endpointType: IoTEndpointType;
  zoneId: string;
  zoneName: string;
  firmwareVersion: string;
  installDate: string;
  lastCalibrationDate: string;
  healthScore: number; // 0 to 100
  failureProbabilityPct: number; // 0 to 100
  degradationRatePctPerDay: number;
  mttfHours: number; // Mean Time to Failure
  remainingUsefulLifeDays: number;
  forecastHorizon: EndpointFailureHorizon;
  driftDeltaPercent: number;
  signalToNoiseRatioDb: number;
  batteryVoltage: number;
  packetLossRatePct: number;
  currentAnomalyAttribution: string;
  historicalDegradationSeries: DegradationDataPoint[];
  thirtyDayProjection?: ThirtyDayDegradationProjectionPoint[];
  rootCauseVulnerability: string;
  prescribedPreventiveAction: string;
  costAvoidanceUsd: number;
  isStagedForMaintenance?: boolean;
}

// -------------------------------------------------------------
// CAUSAL INTER-ZONE CORRELATION ENGINE TYPES
// -------------------------------------------------------------
export type TransmissionVector =
  | 'THERMAL_PLUME'
  | 'HVAC_CONDUIT'
  | 'WORKER_FLOW'
  | 'ACOUSTIC_RESONANCE'
  | 'ELECTRICAL_BUS';

export interface CausalZoneNode {
  zoneId: string;
  zoneName: string;
  riskScore: number;
  activeAnomaliesCount: number;
  status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  adjacentZoneIds: string[];
  x: number; // % layout
  y: number; // % layout
  headcount: number;
  ambientTempC: number;
}

export interface CausalPropagationLink {
  id: string;
  sourceZoneId: string;
  sourceZoneName: string;
  targetZoneId: string;
  targetZoneName: string;
  pearsonR: number; // -1.0 to +1.0
  causalConfidencePct: number; // 0 to 100
  timeLagMinutes: number; // minutes before target shows anomalies
  transmissionVector: TransmissionVector;
  transmissionDescription: string;
  isCascadingActive: boolean;
  recentPropagationCount: number;
  decouplingRecommendation: string;
  historicalPValue: number;
}

export interface CausalIncidentChainEvent {
  step: number;
  timeOffset: string;
  zoneId: string;
  zoneName: string;
  incidentType: string;
  metricValue: string;
  causalRole: 'ORIGIN' | 'INTERMEDIATE_PROPAGATION' | 'TERMINAL_CASCADE';
  delayFromOriginMins: number;
  confidencePct: number;
}

// -------------------------------------------------------------
// USER MANAGEMENT & ROLE-BASED / POLICY-BASED ACCESS CONTROL (RBAC / PBAC)
// -------------------------------------------------------------
export type UserRole =
  | 'SAFETY_DIRECTOR'             // Enterprise / Site Safety Director
  | 'OCCUPATIONAL_HEALTH_OFFICER' // Medical Doctor / Industrial Hygienist
  | 'FACILITY_ENGINEER'           // Lead Mechanical & IoT Engineer
  | 'FRONTLINE_WORKER'            // Frontline / Migrant / Resident Worker
  | 'COMPLIANCE_AUDITOR';         // WSH / MOM / OSHA Regulatory Auditor

export type WorkforceType =
  | 'MIGRANT_WORKFORCE'   // Expatriate / foreign worker on work permit/pass (special heat, language & dorm rights)
  | 'DOMESTIC_WORKFORCE'  // Resident / local workforce
  | 'SUPERVISORY_STAFF'   // EHS & engineering management
  | 'INDEPENDENT_AUDITOR'; // Government / external inspection officer

export type Permission =
  | 'VIEW_AGGREGATE_ANALYTICS'      // View population heatmaps & zone risk scores
  | 'VIEW_PRIVATE_BIOMETRICS'       // View personal sovereign biometrics (Worker only)
  | 'CONFIGURE_GLOBAL_THRESHOLDS'   // Modify Kalman & OSHA/ISO baseline thresholds
  | 'ACTUATE_HVAC_REMEDIATION'      // Trigger chiller offsets & HVAC dampers
  | 'DISPATCH_MEDICAL_EMERGENCY'    // Trigger SMS/radio rapid cooling response
  | 'SCHEDULE_IOT_MAINTENANCE'      // Dispatch technician work orders for ISO 10816 equipment
  | 'EXPORT_CERTIFIED_REPORTS'      // Generate Executive PDF, HIPAA dossiers & CSVs
  | 'VIEW_COMPLIANCE_AUDIT_LOGS'    // Read tamper-evident cryptographic access logs
  | 'RUN_WHAT_IF_SIMULATIONS'       // Simulate thermal & ventilation scenarios
  | 'REQUEST_ANONYMOUS_REST_BREAK'  // Send anonymous fatigue/heat rest signal
  | 'MANAGE_USER_ROLES';            // Administer users and inspect PBAC policies

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  organization: string;
  workforceType: WorkforceType;
  jurisdiction: RegulatoryJurisdiction;
  avatarInitials: string;
  avatarColor: string;
  clearanceLevel: 'LEVEL_1_BASIC' | 'LEVEL_2_CLINICAL' | 'LEVEL_3_TECHNICAL' | 'LEVEL_4_EXECUTIVE' | 'LEVEL_5_AUDITOR';
  primaryLanguage: 'en' | 'bn' | 'ta' | 'zh' | 'tl' | 'ar' | 'hi';
  languageLabel: string;
  permissions: Permission[];
  assignedZoneOrDorm?: string;
  bioSummary: string;
}

// -------------------------------------------------------------
// COUNTRY & MIGRANT WORKFORCE REGULATORY COMPLIANCE TYPES
// -------------------------------------------------------------
export type RegulatoryJurisdiction =
  | 'SINGAPORE_MOM' // Singapore Ministry of Manpower (WSH Act 2024, Heat Stress Framework & EFMA)
  | 'GCC_MOHRE'     // GCC / UAE / Saudi Arabia (MoHRE Midday Work Ban 12:30-15:00, Heat Stress Standards)
  | 'US_OSHA_NIOSH' // United States OSHA 1910, NIOSH Criteria & Heat NEP (CPL 03-00-024)
  | 'EU_GDPR_OSHA'; // European Union EU-OSHA Directives & GDPR Article 9 Biometric Protection

export interface RegulatoryFrameworkDetail {
  jurisdiction: RegulatoryJurisdiction;
  countryName: string;
  regionLabel: string;
  regulatoryBody: string;
  keyActs: string[];
  wbgtThresholds: {
    moderateRestMinsPerHour: number; // e.g. 15 mins
    highRestMinsPerHour: number;     // e.g. 30 mins
    stopWorkWbgtC: number;           // e.g. 33.0°C
  };
  migrantWorkforceProtections: {
    mandatoryLanguages: string[];
    coolingStationsRequired: boolean;
    middayWorkBanApplies: boolean;
    middayBanHours?: string;
    dormitoryThermalStandard: string;
    nonPunitiveFatigueReportingClause: string;
    employerMedicalLiabilityClause: string;
  };
  complianceStatus: 'FULLY_COMPLIANT' | 'WARNING_ATTENTION' | 'NON_COMPLIANT';
  lastAuditDate: string;
  activeEnforcementAlerts: string[];
}


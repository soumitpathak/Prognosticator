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
  | 'SHIFT_HANDOVER';

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

export interface VoiceAlertSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  rate: number; // 0.8 to 1.4
  pitch: number; // 0.8 to 1.2
  announceCriticalOnly: boolean;
  chimeSound: boolean;
  selectedVoiceName?: string;
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




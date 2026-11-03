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

export type AuditChangeCategory = 'THRESHOLD_CHANGE' | 'ZONE_CONFIG' | 'FILTER_CALIBRATION';

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


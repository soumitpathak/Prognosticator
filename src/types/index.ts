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

export interface TelemetryDataPoint {
  timestamp: string;
  timeLabel: string;
  ambient_temp_c: number;
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

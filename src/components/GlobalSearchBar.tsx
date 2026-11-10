import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  ShieldAlert,
  Wrench,
  X,
  ArrowRight,
  Command,
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  Sparkles,
  Heart,
  UserCheck,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
  Zap,
  Flame,
  User,
  Sliders,
  CheckCircle2,
  Filter,
  Check
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert } from '../types';
import { INITIAL_WEARABLE_DEVICES } from '../services/wearableBiometricService';

export interface GlobalSearchBarProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  onSelectZone: (zoneId: string) => void;
  onSelectAlert: (alertId: string) => void;
  onSelectWorker?: (workerId: string, zoneId?: string) => void;
  onSelectTelemetryCategory?: (categoryKey: string) => void;
  onSelectReport?: (reportKey: string) => void;
  onSelectEquipment?: (equipmentId: string) => void;
  className?: string;
  theme?: 'dark' | 'high-contrast-light';
}

export type SearchCategory =
  | 'ALL'
  | 'ALERT_LOG'
  | 'WORKER'
  | 'TELEMETRY_CATEGORY'
  | 'ZONE'
  | 'PREDICTIVE_REPORT'
  | 'EQUIPMENT';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'ALERT_LOG' | 'WORKER' | 'TELEMETRY_CATEGORY' | 'ZONE' | 'PREDICTIVE_REPORT' | 'EQUIPMENT';
  badge: string;
  badgeColor: string;
  severity?: string;
  zoneId?: string;
  alertId?: string;
  reportKey?: string;
  equipmentId?: string;
  workerId?: string;
  categoryKey?: string;
  details?: string;
  actionHint: string;
}

// 1. Comprehensive Telemetry Categories & Signal Metrics
export const TELEMETRY_CATEGORIES_INDEX = [
  {
    key: 'heartRate',
    title: 'Heart Rate & Tachycardia (BPM)',
    subtitle: 'Cardiovascular pulse telemetry, exertional tachycardia threshold monitoring, and cardiac strain tracking',
    badge: 'TELEMETRY • HR',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    details: 'Exertion limits: Warning > 115 BPM, Critical > 130 BPM. Continuously ingested via BLE ECG sensors.',
    actionHint: 'Isolate Heart Rate Signal'
  },
  {
    key: 'smoothedHrv',
    title: 'Heart Rate Variability & RMSSD (ms)',
    subtitle: 'Autonomic parasympathetic nervous system index, physiological fatigue, and stress recovery estimation',
    badge: 'TELEMETRY • HRV',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    details: 'Autonomic strain: Warning < 40 ms, Critical < 25 ms. Monitored via Kalman filter state smoothing.',
    actionHint: 'Isolate HRV Stream'
  },
  {
    key: 'skinTemp',
    title: 'Core & Skin Temperature (°C)',
    subtitle: 'Dermal thermal homeostasis, hyperthermia early warning, and exertional heat stress detection',
    badge: 'TELEMETRY • TEMP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    details: 'Thermal strain: Normal 36.5°C, Hyperthermia risk > 38.0°C. Monitored across heavy labor cohorts.',
    actionHint: 'Isolate Skin Temp Signal'
  },
  {
    key: 'ambientTemp',
    title: 'Ambient Heat Index & WBGT (°C)',
    subtitle: 'Wet-Bulb Globe Temperature, solar thermal radiation, humidity envelope, and heat wave warnings',
    badge: 'TELEMETRY • WBGT',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    details: 'OSHA / NIOSH Heat Stress index: Extreme danger > 39.5°C WBGT. Correlated with worker biometric strain.',
    actionHint: 'Isolate WBGT Index'
  },
  {
    key: 'noiseDb',
    title: 'Industrial Acoustic Noise (dBA)',
    subtitle: 'Industrial sound pressure level in decibels, OSHA 85 dBA TWA action level, and hearing conservation',
    badge: 'TELEMETRY • NOISE',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    details: 'OSHA Permissible Exposure Limit: Action Level 85 dBA, Hazard Ceiling 90 dBA continuous.',
    actionHint: 'Isolate Acoustic Noise'
  },
  {
    key: 'riskScore',
    title: 'Composite Health Risk Probability (%)',
    subtitle: 'Multi-signal Kalman fusion probability of worker impairment, acute exhaustion, or physiological collapse',
    badge: 'TELEMETRY • RISK',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    details: 'Real-time multi-variate risk index computed across HRV, HR, thermal load, and acoustic stress.',
    actionHint: 'Isolate Health Risk'
  },
  {
    key: 'vibration',
    title: 'Mechanical Vibration & Rotor Jitter (mm/s RMS)',
    subtitle: 'Machinery velocity spectra, bearing wear, and equipment predictive maintenance telemetry',
    badge: 'TELEMETRY • VIB',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    details: 'ISO 10816 Vibration severity thresholds: Alert > 4.5 mm/s, Danger > 7.1 mm/s RMS.',
    actionHint: 'Isolate Vibration Signal'
  },
  {
    key: 'kalmanResiduals',
    title: 'Kalman Innovation Residuals & Jitter',
    subtitle: 'Prediction error covariance, sensor outlier rejection, and statistical state estimation diagnostics',
    badge: 'TELEMETRY • KALMAN',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    details: 'Mathematical discrepancy between predicted state and raw sensor telemetry. Triggers anomaly alerts.',
    actionHint: 'Isolate Kalman Innovation'
  },
  {
    key: 'twl',
    title: 'Thermal Work Limit (TWL W/m²)',
    subtitle: 'Metabolic thermal index indicating safe continuous work rates in severe workplace heat conditions',
    badge: 'TELEMETRY • TWL',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    details: 'Thermal Work Limit: Buffer Zone 140-220 W/m², Withdrawal Zone < 140 W/m².',
    actionHint: 'Isolate TWL Metric'
  }
];

// 2. Comprehensive Personnel & Worker IDs Roster
export const ROSTER_WORKERS_INDEX = [
  {
    workerId: 'W-9921',
    workerName: 'Marcus Vance',
    role: 'Senior Ironworker & High-Rise Welder',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Polar H10 ECG Chest Strap',
    hrvRmssd: 22,
    heartRate: 112,
    stressTier: 'CRITICAL_STRAIN',
    status: 'ACTIVE • CRITICAL STRAIN'
  },
  {
    workerId: 'W-6104',
    workerName: 'Elena Rostova',
    role: 'Tower Crane Rigger & Lift Director',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Garmin Forerunner 965 Pro',
    hrvRmssd: 38,
    heartRate: 94,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • ELEVATED'
  },
  {
    workerId: 'W-3209',
    workerName: 'Tariq Al-Mansoor',
    role: 'High-Reach Forklift Logistics Operator',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics & Staging Warehouse North',
    deviceModel: 'Whoop 4.0 Biostrap Continuous',
    hrvRmssd: 41,
    heartRate: 88,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • FATIGUE MONITORING'
  },
  {
    workerId: 'W-1842',
    workerName: 'Liam Chen',
    role: 'Robotic Welder Specialist & Cobot Cell Tech',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Oura Ring Horizon Gen 3',
    hrvRmssd: 74,
    heartRate: 72,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • OPTIMAL'
  },
  {
    workerId: 'W-5021',
    workerName: 'Mateo Morales',
    role: 'Confined Space Inspector & Geotech Lead',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Subgrade Utility Tunnel Conduit 7',
    deviceModel: 'Zephyr BioHarness 3.0 Industrial',
    hrvRmssd: 52,
    heartRate: 82,
    stressTier: 'MODERATE',
    status: 'ACTIVE • MODERATE'
  },
  {
    workerId: 'W-7740',
    workerName: 'Sofia Lindqvist',
    role: 'Precision CNC Laser Machinist & Shift Lead',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Apple Watch Ultra 2 Industrial',
    hrvRmssd: 68,
    heartRate: 75,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • OPTIMAL'
  },
  {
    workerId: 'W-4102',
    workerName: 'David Miller',
    role: 'Smelter Cell Furnace Operator',
    zoneId: 'High-Temperature-Smelter-Cell',
    zoneName: 'High-Temperature Smelter Cell',
    deviceModel: 'Biostrap Active EVO Chest Strap',
    hrvRmssd: 28,
    heartRate: 135,
    stressTier: 'CRITICAL_STRAIN',
    status: 'ACTIVE • HYPERTHERMIA WATCH'
  },
  {
    workerId: 'W-8812',
    workerName: 'Sofia Patel',
    role: 'Automated Guided Vehicle (AGV) Coordinator',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics & Staging Warehouse North',
    deviceModel: 'Polar Verity Sense Optical',
    hrvRmssd: 58,
    heartRate: 76,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • OPTIMAL'
  },
  {
    workerId: 'W-1402',
    workerName: 'Carlos Gomez',
    role: 'Structural Concrete Finisher',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Garmin Fenix 7 Solar Pro',
    hrvRmssd: 33,
    heartRate: 104,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • HIGH EXERTION'
  },
  {
    workerId: 'W-5583',
    workerName: 'Amina Diallo',
    role: 'High-Voltage Wiring Harness Assembler',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Whoop 4.0 Biostrap',
    hrvRmssd: 63,
    heartRate: 77,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-4390',
    workerName: 'Lucas Meyer',
    role: 'Geotechnical Surveyor & Tunnel Boring Tech',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Subgrade Utility Tunnel Conduit 7',
    deviceModel: 'Suunto 9 Peak Pro Industrial',
    hrvRmssd: 46,
    heartRate: 84,
    stressTier: 'MODERATE',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-5211',
    workerName: 'Jin Woo',
    role: 'Autonomous Drone Fleet & Yard Dispatcher',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics & Staging Warehouse North',
    deviceModel: 'Samsung Galaxy Watch 6 Enterprise',
    hrvRmssd: 71,
    heartRate: 69,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-1109',
    workerName: 'Hannah Schmidt',
    role: 'HAZMAT Pipefitter & Valve Inspector',
    zoneId: 'Chemical-Processing-Unit-3',
    zoneName: 'Chemical Processing & Refinement Unit 3',
    deviceModel: 'Polar H10 Intrinsically Safe',
    hrvRmssd: 34,
    heartRate: 108,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • CHEMICAL VAPOR PPE'
  },
  {
    workerId: 'W-3310',
    workerName: 'Devon Price',
    role: 'Bulk Tanker Transfer & Transfer Lead',
    zoneId: 'Chemical-Processing-Unit-3',
    zoneName: 'Chemical Processing & Refinement Unit 3',
    deviceModel: 'Garmin Instinct 2 Solar Tactical',
    hrvRmssd: 49,
    heartRate: 86,
    stressTier: 'MODERATE',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-6192',
    workerName: 'Rachel Green',
    role: '800-Ton Hydraulic Press Cell Lead',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Whoop 4.0 Biostrap',
    hrvRmssd: 55,
    heartRate: 80,
    stressTier: 'MODERATE',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-2041',
    workerName: 'Tyler Nguyen',
    role: 'Suspended Scaffolding Erector',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Polar H10 ECG Chest Strap',
    hrvRmssd: 36,
    heartRate: 102,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • WIND STRAIN'
  },
  {
    workerId: 'W-1409',
    workerName: 'Maya Lin',
    role: 'Excavation & Earthmoving Operator',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Garmin Venu 3 Plus',
    hrvRmssd: 61,
    heartRate: 78,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-0914',
    workerName: 'Samuel Jackson',
    role: 'Metrology & Quality Assurance Lead',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Oura Ring Horizon Gen 3',
    hrvRmssd: 79,
    heartRate: 67,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • OPTIMAL'
  },
  {
    workerId: 'W-7215',
    workerName: 'Chloe Bennett',
    role: 'High-Speed Conveyor Maintenance Tech',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing Assembly Line B',
    deviceModel: 'Garmin Forerunner 265',
    hrvRmssd: 44,
    heartRate: 91,
    stressTier: 'MODERATE',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-3829',
    workerName: 'Amir Khan',
    role: 'Cross-Docking Freight Sorter',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Logistics & Staging Warehouse North',
    deviceModel: 'Biostrap Active EVO',
    hrvRmssd: 51,
    heartRate: 85,
    stressTier: 'MODERATE',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-5501',
    workerName: 'Olivia Taylor',
    role: 'Distillation Column Operator',
    zoneId: 'Chemical-Processing-Unit-3',
    zoneName: 'Chemical Processing & Refinement Unit 3',
    deviceModel: 'Polar H10 ECG Chest Strap',
    hrvRmssd: 59,
    heartRate: 74,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-7140',
    workerName: 'Gabriel Santos',
    role: 'Submerged Arc Structural Welder',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Suunto Core Industrial',
    hrvRmssd: 30,
    heartRate: 118,
    stressTier: 'CRITICAL_STRAIN',
    status: 'ACTIVE • HEAT REST REQUIRED'
  },
  {
    workerId: 'W-5182',
    workerName: 'Grace Hopper',
    role: 'Subterranean Ventilation Specialist',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Subgrade Utility Tunnel Conduit 7',
    deviceModel: 'Zephyr BioHarness 3.0',
    hrvRmssd: 64,
    heartRate: 73,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • OPTIMAL'
  },
  {
    workerId: 'W-4420',
    workerName: 'Nia Washington',
    role: 'Environmental Gas Sampling Monitor',
    zoneId: 'Chemical-Processing-Unit-3',
    zoneName: 'Chemical Processing & Refinement Unit 3',
    deviceModel: 'Apple Watch Series 9 Rugged',
    hrvRmssd: 57,
    heartRate: 79,
    stressTier: 'OPTIMAL',
    status: 'ACTIVE • NORMAL'
  },
  {
    workerId: 'W-3108',
    workerName: 'Ethan Hall',
    role: 'Reinforced Concrete Rebar Placer',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    deviceModel: 'Polar Verity Sense',
    hrvRmssd: 32,
    heartRate: 114,
    stressTier: 'HIGH_STRESS',
    status: 'ACTIVE • THERMAL STRAIN'
  }
];

// 3. Seed Historical Incident Alert Logs Index
export const HISTORICAL_ALERT_LOGS_INDEX = [
  {
    alertId: 'ALR-8842-CR',
    title: 'ALR-8842-CR — Acute Autonomic & Thermal Strain',
    subtitle: 'Worker: W-9921 • Outdoor Construction Sector 4 • Raw: 124 BPM, HRV 31ms, Skin 38.4°C • Kalman: Confirmed Anomaly',
    severity: 'CRITICAL',
    zoneId: 'Outdoor-Construction-Sector-4',
    workerId: 'W-9921',
    metric: 'Autonomic & Thermal Strain',
    directive: 'Immediate extraction to air-conditioned rest tent. Administer 500ml electrolyte rehydration solution.',
    timestamp: 'Live Active Alert',
    detectionSource: 'KALMAN_INNOVATION'
  },
  {
    alertId: 'INC-2026-9104',
    title: 'INC-2026-9104 — Autonomic Deceleration & Heat Syncope Risk',
    subtitle: 'Worker: W-9921 • Outdoor Construction Sector 4 • HRV collapsed to 22ms, HR 112 BPM • Lead Time: 3.8h Prior to Syncope',
    severity: 'CRITICAL',
    zoneId: 'Outdoor-Construction-Sector-4',
    workerId: 'W-9921',
    metric: 'Acute Autonomic & Thermal Strain',
    directive: 'Immediate extraction: Escort cohort member to shaded recovery tent, cold-water immersion towel wrap.',
    timestamp: '12 mins ago',
    detectionSource: 'KALMAN_INNOVATION'
  },
  {
    alertId: 'INC-2026-9042',
    title: 'INC-2026-9042 — Conveyor Bearing Vibration & Stator Heat',
    subtitle: 'Equipment: EQUIP-CONV-4B • Outdoor Sector 4 • Vib: 7.2 mm/s RMS, Casing: 89.1°C • Lead Time: 4.2h Prior to Seizure',
    severity: 'CRITICAL',
    zoneId: 'Outdoor-Construction-Sector-4',
    workerId: 'EQUIP-CONV-4B',
    metric: 'Predictive Maintenance: Bearing Vibration & Motor Heat',
    directive: 'Emergency lubrication dispatch required. Pre-emptively throttle conveyor drive to 40% speed.',
    timestamp: '18 mins ago',
    detectionSource: 'LSTM_AUTOENCODER'
  },
  {
    alertId: 'INC-2026-8981',
    title: 'INC-2026-8981 — Core Body Hyperthermia & Exertion',
    subtitle: 'Worker: W-4102 • Smelter Cell • Core Skin: 39.2°C, HR: 138 BPM • Lead Time: 2.5h Prior to Heat Stroke',
    severity: 'CRITICAL',
    zoneId: 'High-Temperature-Smelter-Cell',
    workerId: 'W-4102',
    metric: 'Core Body Hyperthermia & Autonomic Exhaustion',
    directive: 'Immediate rotation order: Enforce active cooling vest deployment and mandatory 25-minute recovery.',
    timestamp: '1.7h ago',
    detectionSource: 'KALMAN_INNOVATION'
  },
  {
    alertId: 'ALR-7729-HI',
    title: 'ALR-7729-HI — Heavy Fabrication Noise Ceiling Breach',
    subtitle: 'Worker: W-7740 • Assembly Line B • Acoustic: 94.6 dBA continuous, HR: 122 BPM • OSHA TWA Alert',
    severity: 'HIGH',
    zoneId: 'Manufacturing-Assembly-Line-B',
    workerId: 'W-7740',
    metric: 'Sustained Tachycardia & Noise-Induced Stress',
    directive: 'Inspect dual-layer hearing protection compliance and dispatch auxiliary ventilation acoustic hood.',
    timestamp: '3.5h ago',
    detectionSource: 'THRESHOLD_BREACH'
  },
  {
    alertId: 'INC-2026-8719',
    title: 'INC-2026-8719 — Cumulative Sleep Deficit & Micro-Stamina Degradation',
    subtitle: 'Worker: W-3209 • Logistics Warehouse North • Sleep Deficit: 3.5h, RMSSD: 39ms • Low Vigilance Zone',
    severity: 'MODERATE',
    zoneId: 'Warehouse-Logistics-Hub-North',
    workerId: 'W-3209',
    metric: 'Accumulated Sleep Deficit & Micro-Stamina Degradation',
    directive: 'Reassign worker from high-reach order picking to low-velocity ground staging buffer.',
    timestamp: '5.0h ago',
    detectionSource: 'BIOMETRIC_TELEMETRY'
  },
  {
    alertId: 'ALR-5531-MD',
    title: 'ALR-5531-MD — Confined Space Humidity & Oxygen Stagnation',
    subtitle: 'Worker: W-5021 • Subgrade Tunnel Conduit 7 • Humidity: 88% RH, WBGT 31.2°C • Gas Sensor Safe',
    severity: 'MODERATE',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    workerId: 'W-5021',
    metric: 'Subgrade Thermal Work Limit Depletion',
    directive: 'Activate secondary air scrapper fan and mandate 15-minute egress break at ground surface.',
    timestamp: '7.2h ago',
    detectionSource: 'ENVIRONMENTAL'
  },
  {
    alertId: 'INC-2026-8650',
    title: 'INC-2026-8650 — Repetitive Strain Wrist Acceleration Anomaly',
    subtitle: 'Worker: W-6104 • Sector 4 Crane Cab • IMU Tremor: 3.4 Hz Jitter, HR 98 BPM • Tendon Strain',
    severity: 'MODERATE',
    zoneId: 'Outdoor-Construction-Sector-4',
    workerId: 'W-6104',
    metric: 'Ergonomic Musculoskeletal Tremor',
    directive: 'Rotate joystick controls to ergonomic neutral orientation. 10-minute wrist flexor decompression.',
    timestamp: '9.4h ago',
    detectionSource: 'BIOMETRIC_TELEMETRY'
  }
];

// 4. Reports & Administrative Index
export const PREDICTIVE_REPORTS_INDEX = [
  {
    key: 'INCIDENT_LOG',
    title: 'Incident Log & Anomaly Records',
    subtitle: 'Historical register of multi-signal alerts, Kalman innovation spikes, and physiological threshold breaches',
    badge: 'INCIDENT LOG',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    actionHint: 'View Incident Log'
  },
  {
    key: 'COHORT_COMPARISON_VIEW',
    title: 'Cohort & Site Side-by-Side Comparison View',
    subtitle: 'Select two population cohorts or sites to visualize vital health telemetry metrics side-by-side on a line chart',
    badge: 'COHORT COMPARISON',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    actionHint: 'Open Cohort Comparison'
  },
  {
    key: 'PREDICTIVE_30D_MODEL',
    title: '30-Day Forward Predictive Health Modeling',
    subtitle: 'Uses current Kalman filter data to extrapolate and project health trends over the next 30 days',
    badge: '30D KALMAN MODEL',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    actionHint: 'Open 30D Predictive Model'
  },
  {
    key: 'EXPORT_DATA',
    title: 'Export Data (CSV / PDF)',
    subtitle: 'Download current health trends time-series and active anomaly reports as structured CSV or PDF files',
    badge: 'EXPORT DATA',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    actionHint: 'Open Export Dialog'
  },
  {
    key: 'RESOURCE_UTILIZATION_HEATMAP',
    title: 'Resource Utilization & Workforce Heatmap',
    subtitle: 'Worker distribution across high-risk zones, thermal heat strain overlay, and shift rebalancing',
    badge: 'WORKFORCE HEATMAP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    actionHint: 'Open Workforce Heatmap'
  },
  {
    key: 'EXPORT_ALL_ANALYTICS_CSV',
    title: 'Export All Analytics (CSV)',
    subtitle: 'Simulated CSV download of current anomaly log and historical trend data for offline auditing',
    badge: 'OFFLINE AUDIT CSV',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    actionHint: 'Download CSV Audit Dossier'
  },
  {
    key: 'DOWNLOAD_PDF_REPORT',
    title: 'Download Comprehensive Telemetry PDF Report',
    subtitle: 'Generate a comprehensive report of current telemetry data leveraging print-friendly CSS styles (A4 Portrait)',
    badge: 'PRINT PDF',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    actionHint: 'Download Telemetry PDF'
  },
  {
    key: 'DASHBOARD_SUMMARY_PDF',
    title: 'Download Dashboard Summary Report (PDF)',
    subtitle: 'Executive 2-page documentation summarizing active metrics, anomaly events, and workplace zones',
    badge: 'PDF REPORT',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    actionHint: 'Generate Summary PDF'
  },
  {
    key: 'PREDICTIVE_SURGE_48H',
    title: '48-Hour Forward Predictive Incident Surge Report',
    subtitle: 'LSTM-Kalman predictive model projecting acute heat and fatigue incidents 48 hours forward',
    badge: 'FORWARD PROJECTION',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    actionHint: 'View Surge Forecast'
  },
  {
    key: 'SIGNED_COMPLIANCE_PDF',
    title: 'Signed Quarterly Compliance Audit Report (PDF)',
    subtitle: 'ISO 45001 & OSHA 1910 digitally signed executive compliance audit dossier with SHA-256 seal',
    badge: 'STATUTORY PDF',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    actionHint: 'Open Signed PDF Modal'
  },
  {
    key: 'DAILY_SUMMARY_REPORT',
    title: '24-Hour Daily Summary Operational Report',
    subtitle: 'Shift-by-shift workforce coverage, anomaly counts, and risk distribution analysis',
    badge: 'SHIFT SUMMARY',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    actionHint: 'Open Daily Summary'
  },
  {
    key: 'COMPLIANCE_AUDIT_LOG',
    title: 'Compliance Audit Log & Tamper-Evident Trail (CSV)',
    subtitle: 'Full audit ledger of supervisor manual overrides, threshold revisions, and automated system adjustments',
    badge: 'AUDIT CSV',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    actionHint: 'Open Compliance Audit Tab'
  },
  {
    key: 'HEALTH_METRICS_PDF',
    title: 'Real-Time Health Metrics & KPI Report (PDF)',
    subtitle: 'Multi-signal vitals snapshot, autonomic HRV distributions, and environmental heat load documentation',
    badge: 'METRICS PDF',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    actionHint: 'Generate Metrics PDF'
  },
  {
    key: 'ANOMALY_TREND_30D',
    title: '30-Day Longitudinal Anomaly Trend Analysis',
    subtitle: 'Monthly risk frequency progression and 7-day rolling moving average projections',
    badge: '30D ANALYSIS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    actionHint: 'Scroll to 30D Trend Chart'
  },
  {
    key: 'PREDICTIVE_MAINTENANCE_TAB',
    title: 'Proactive Equipment Maintenance Schedule',
    subtitle: 'Remaining Useful Life (RUL) telemetry, vibration anomalies, and technician dispatch allocation',
    badge: 'MAINTENANCE',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    actionHint: 'Open Maintenance Tab'
  }
];

function GlobalSearchBarComponent({
  zones,
  alerts,
  onSelectZone,
  onSelectAlert,
  onSelectWorker,
  onSelectTelemetryCategory,
  onSelectReport,
  onSelectEquipment,
  className = '',
  theme = 'dark'
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'high-contrast-light';

  // Global hotkey listener: '/' or 'Cmd/Ctrl + K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build Unified Search Index across all entities
  const allSearchItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Alert Logs: Active alerts + Historical Incident Records
    // Active alerts first
    const seenAlertIds = new Set<string>();

    alerts.forEach((a) => {
      seenAlertIds.add(a.id);
      items.push({
        id: `alert-active-${a.id}`,
        title: `${a.id} — ${a.anomaly_metric}`,
        subtitle: `Worker: ${a.worker_id} • Zone: ${a.location_zone} • Raw: ${a.raw_value} • Smoothed: ${a.kalman_smoothed_value}`,
        category: 'ALERT_LOG',
        badge: `${a.severity} ALERT`,
        badgeColor:
          a.severity === 'CRITICAL'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : a.severity === 'HIGH'
            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        severity: a.severity,
        alertId: a.id,
        workerId: a.worker_id,
        zoneId: a.location_zone,
        details: a.recommended_action || 'Active anomaly event awaiting supervisor resolution',
        actionHint: 'Inspect Alert Details'
      });
    });

    // Seed historical alert logs
    HISTORICAL_ALERT_LOGS_INDEX.forEach((h) => {
      if (!seenAlertIds.has(h.alertId)) {
        seenAlertIds.add(h.alertId);
        items.push({
          id: `alert-hist-${h.alertId}`,
          title: h.title,
          subtitle: h.subtitle,
          category: 'ALERT_LOG',
          badge: `${h.severity} ALERT`,
          badgeColor:
            h.severity === 'CRITICAL'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : h.severity === 'HIGH'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          severity: h.severity,
          alertId: h.alertId,
          workerId: h.workerId,
          zoneId: h.zoneId,
          details: h.directive,
          actionHint: 'View Incident Log Entry'
        });
      }
    });

    // 2. Worker IDs Roster
    const seenWorkerIds = new Set<string>();

    // From Wearable Biometric Service live devices
    INITIAL_WEARABLE_DEVICES.forEach((w) => {
      seenWorkerIds.add(w.workerId);
      items.push({
        id: `worker-ble-${w.workerId}`,
        title: `${w.workerName} (${w.workerId})`,
        subtitle: `ID: ${w.workerId} • ${w.zoneName} • ${w.deviceModel} • HR: ${w.currentHeartRate} BPM • RMSSD: ${w.currentRmssd}ms`,
        category: 'WORKER',
        badge: `WORKER • ${w.workerId}`,
        badgeColor:
          w.stressTier === 'CRITICAL_STRAIN'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : w.stressTier === 'HIGH_STRESS'
            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        workerId: w.workerId,
        zoneId: w.zoneId,
        details: `Stress Score: ${w.stressScore}/100 • Battery: ${w.batteryPct}% • Sync: ${w.lastSyncTime}`,
        actionHint: 'Focus Biometrics & Wearable'
      });
    });

    // From extended roster index
    ROSTER_WORKERS_INDEX.forEach((rw) => {
      if (!seenWorkerIds.has(rw.workerId)) {
        seenWorkerIds.add(rw.workerId);
        items.push({
          id: `worker-roster-${rw.workerId}`,
          title: `${rw.workerName} (${rw.workerId})`,
          subtitle: `ID: ${rw.workerId} • ${rw.role} • ${rw.zoneName} • HR: ${rw.heartRate} BPM, HRV: ${rw.hrvRmssd}ms`,
          category: 'WORKER',
          badge: `WORKER • ${rw.workerId}`,
          badgeColor:
            rw.stressTier === 'CRITICAL_STRAIN'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : rw.stressTier === 'HIGH_STRESS'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          workerId: rw.workerId,
          zoneId: rw.zoneId,
          details: `Device: ${rw.deviceModel} • Status: ${rw.status}`,
          actionHint: 'Focus Worker & Cohort'
        });
      }
    });

    // Dynamic workers from active alerts if any missing
    alerts.forEach((a) => {
      if (a.worker_id && !seenWorkerIds.has(a.worker_id) && !a.worker_id.startsWith('EQUIP-')) {
        seenWorkerIds.add(a.worker_id);
        items.push({
          id: `worker-alert-${a.worker_id}`,
          title: `Worker ${a.worker_id}`,
          subtitle: `Assigned to ${a.location_zone} • Active Incident: ${a.anomaly_metric}`,
          category: 'WORKER',
          badge: `WORKER • ${a.worker_id}`,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          workerId: a.worker_id,
          zoneId: a.location_zone,
          details: `Severity: ${a.severity} • Directives: ${a.recommended_action || 'Monitoring'}`,
          actionHint: 'Focus Worker Biometrics'
        });
      }
    });

    // 3. Telemetry Categories & Signal Metrics
    TELEMETRY_CATEGORIES_INDEX.forEach((tc) => {
      items.push({
        id: `telemetry-${tc.key}`,
        title: tc.title,
        subtitle: tc.subtitle,
        category: 'TELEMETRY_CATEGORY',
        badge: tc.badge,
        badgeColor: tc.badgeColor,
        categoryKey: tc.key,
        details: tc.details,
        actionHint: tc.actionHint
      });
    });

    // 4. Facility Workplace Zones
    zones.forEach((z) => {
      items.push({
        id: `zone-${z.id}`,
        title: z.name,
        subtitle: `Zone ID: ${z.id} • ${z.description} • Ambient: ${z.temp} • Cohort N=${z.count} workers`,
        category: 'ZONE',
        badge: `ZONE • ${z.status}`,
        badgeColor:
          z.status === 'CRITICAL'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : z.status === 'MODERATE'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        zoneId: z.id,
        details: `Sensors: Multi-signal environmental WBGT, thermal imaging, and RFID BLE gateways`,
        actionHint: 'Jump to Zone Heatmap & Charts'
      });
    });

    // 5. Predictive Reports & Compliance
    PREDICTIVE_REPORTS_INDEX.forEach((rep) => {
      items.push({
        id: `report-${rep.key}`,
        title: rep.title,
        subtitle: rep.subtitle,
        category: 'PREDICTIVE_REPORT',
        badge: rep.badge,
        badgeColor: rep.badgeColor,
        reportKey: rep.key,
        actionHint: rep.actionHint
      });
    });

    // 6. Industrial Equipment Nodes
    const equipmentMap = new Map<string, { name: string; zone: string; metric: string; vib?: number; temp?: number }>();
    alerts.forEach((a) => {
      if (a.equipment_id) {
        equipmentMap.set(a.equipment_id, {
          name: a.equipment_name || a.equipment_id,
          zone: a.location_zone,
          metric: a.anomaly_metric,
          vib: a.vibration_mm_s,
          temp: a.equipment_temp_c
        });
      }
    });

    if (!equipmentMap.has('MTR-DRIVE-4B')) {
      equipmentMap.set('MTR-DRIVE-4B', {
        name: 'Conveyor Drive Motor 4B',
        zone: 'Outdoor-Construction-Sector-4',
        metric: 'Vibration & Stator Heat',
        vib: 6.85,
        temp: 86.4
      });
    }
    if (!equipmentMap.has('PMP-CHILLER-02')) {
      equipmentMap.set('PMP-CHILLER-02', {
        name: 'Primary HVAC Chilled Water Pump',
        zone: 'Warehouse-Logistics-Hub-North',
        metric: 'Rotor Jitter & Cavitation Heat',
        vib: 4.92,
        temp: 74.8
      });
    }

    equipmentMap.forEach((info, eqId) => {
      items.push({
        id: `equip-${eqId}`,
        title: `${info.name} [${eqId}]`,
        subtitle: `Stationed at ${info.zone}${info.vib ? ` • Vib: ${info.vib} mm/s RMS` : ''}${info.temp ? ` • Heat: ${info.temp}°C` : ''}`,
        category: 'EQUIPMENT',
        badge: 'EQUIPMENT SENSOR',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        equipmentId: eqId,
        zoneId: info.zone,
        actionHint: 'View Predictive Maintenance'
      });
    });

    return items;
  }, [zones, alerts]);

  // Compute counts per category for filter tabs
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: allSearchItems.length,
      ALERT_LOG: 0,
      WORKER: 0,
      TELEMETRY_CATEGORY: 0,
      ZONE: 0,
      PREDICTIVE_REPORT: 0,
      EQUIPMENT: 0
    };
    allSearchItems.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  }, [allSearchItems]);

  // Filter items matching query and category filter
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allSearchItems
      .filter((item) => {
        // Category filter
        if (activeFilter !== 'ALL' && item.category !== activeFilter) {
          return false;
        }

        // Query match
        if (!q) return true;

        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.workerId && item.workerId.toLowerCase().includes(q)) ||
          (item.alertId && item.alertId.toLowerCase().includes(q)) ||
          (item.categoryKey && item.categoryKey.toLowerCase().includes(q)) ||
          (item.zoneId && item.zoneId.toLowerCase().includes(q)) ||
          (item.reportKey && item.reportKey.toLowerCase().includes(q)) ||
          (item.equipmentId && item.equipmentId.toLowerCase().includes(q)) ||
          (item.details && item.details.toLowerCase().includes(q))
        );
      })
      .slice(0, 16);
  }, [allSearchItems, query, activeFilter]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, activeFilter, query]);

  // Handle keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Tab') {
      // Cycle through category filter tabs
      e.preventDefault();
      const filters: SearchCategory[] = ['ALL', 'ALERT_LOG', 'WORKER', 'TELEMETRY_CATEGORY', 'ZONE', 'PREDICTIVE_REPORT'];
      const currentIdx = filters.indexOf(activeFilter);
      const nextIdx = (currentIdx + 1) % filters.length;
      setActiveFilter(filters[nextIdx]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.category === 'ZONE' && item.zoneId) {
      onSelectZone(item.zoneId);
      const el = document.getElementById('telemetry-charts-card') || document.getElementById('floorplan-view-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'ALERT_LOG' && item.alertId) {
      onSelectAlert(item.alertId);
      const el = document.getElementById('active-alerts-section') || document.getElementById('incident-log-section') || document.getElementById('historical-anomaly-events-log');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'WORKER') {
      if (onSelectWorker && item.workerId) {
        onSelectWorker(item.workerId, item.zoneId);
      } else if (item.zoneId) {
        onSelectZone(item.zoneId);
        const el = document.getElementById('biometric-sync-section') || document.getElementById('worker-density-correlation-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.category === 'TELEMETRY_CATEGORY') {
      if (onSelectTelemetryCategory && item.categoryKey) {
        onSelectTelemetryCategory(item.categoryKey);
      } else {
        const el = document.getElementById('historical-workforce-health-chart') || document.getElementById('telemetry-charts-card');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.category === 'PREDICTIVE_REPORT') {
      if (item.reportKey && onSelectReport) {
        onSelectReport(item.reportKey);
      }
    } else if (item.category === 'EQUIPMENT') {
      if (item.equipmentId && onSelectEquipment) {
        onSelectEquipment(item.equipmentId);
      }
      if (item.zoneId) {
        onSelectZone(item.zoneId);
      }
      const el = document.getElementById('maintenance-scheduler-section') || document.getElementById('predictive-maintenance-module');
      el?.scrollIntoView({ behavior: 'smooth' });
    }

    setIsOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'ALERT_LOG':
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case 'WORKER':
        return <UserCheck className="h-4 w-4 text-emerald-400" />;
      case 'TELEMETRY_CATEGORY':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'ZONE':
        return <MapPin className="h-4 w-4 text-blue-400" />;
      case 'PREDICTIVE_REPORT':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'EQUIPMENT':
        return <Wrench className="h-4 w-4 text-amber-400" />;
    }
  };

  // Helper to highlight matching text in title/subtitle
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark
              key={i}
              className={`rounded px-0.5 ${
                isLight ? 'bg-amber-200 text-slate-900 font-bold' : 'bg-cyan-500/30 text-cyan-200 font-bold'
              }`}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Quick chips for initial exploration
  const quickChips = [
    { label: 'Worker W-9921', queryText: 'W-9921', cat: 'WORKER' as SearchCategory },
    { label: 'Heart Rate (BPM)', queryText: 'Heart Rate', cat: 'TELEMETRY_CATEGORY' as SearchCategory },
    { label: 'Alert ALR-8842', queryText: 'ALR-8842', cat: 'ALERT_LOG' as SearchCategory },
    { label: 'HRV Strain (RMSSD)', queryText: 'HRV', cat: 'TELEMETRY_CATEGORY' as SearchCategory },
    { label: 'Acoustic Noise dBA', queryText: 'Noise', cat: 'TELEMETRY_CATEGORY' as SearchCategory },
    { label: 'Outdoor Sector 4', queryText: 'Sector 4', cat: 'ZONE' as SearchCategory },
    { label: 'WBGT Heat Index', queryText: 'WBGT', cat: 'TELEMETRY_CATEGORY' as SearchCategory },
    { label: 'Worker W-6104', queryText: 'W-6104', cat: 'WORKER' as SearchCategory }
  ];

  return (
    <div className={`relative w-full ${className}`}>
      {/* Top Search Input Bar */}
      <div className="relative flex items-center">
        <div className={`absolute left-3.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Global Search: Alert logs (ALR-8842), Worker IDs (W-9921), Telemetry (Heart Rate, HRV, WBGT)..."
          className={`w-full rounded-xl pl-10 pr-24 py-2.5 text-xs font-sans shadow-inner transition focus:outline-none focus:ring-2 ${
            isLight
              ? 'bg-white border border-slate-300 hover:border-slate-400 focus:border-cyan-600 focus:ring-cyan-500/30 text-slate-900 placeholder-slate-500'
              : 'bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:ring-cyan-500/50 text-white placeholder-slate-400'
          }`}
          aria-label="Global Search across alert logs, worker IDs, and telemetry categories"
        />

        <div className="absolute right-2.5 flex items-center space-x-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setActiveFilter('ALL');
                setIsOpen(false);
              }}
              className={`p-1 rounded cursor-pointer transition ${
                isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <span
                className={`hidden sm:inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono select-none border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="Keyboard shortcut: Press Cmd+K or Ctrl+K"
              >
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </span>
              <span
                className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono select-none border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="Keyboard shortcut: Press '/' to search"
              >
                /
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions & Results Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y backdrop-blur-xl border animate-in fade-in slide-in-from-top-1 duration-150 ${
            isLight
              ? 'bg-white/98 border-slate-300 divide-slate-200 shadow-slate-400/20 text-slate-900'
              : 'bg-slate-950/98 border-slate-700 divide-slate-800/80 shadow-black/80 text-white'
          }`}
          style={{ maxHeight: '82vh' }}
        >
          {/* Category Filter Tabs Bar */}
          <div
            className={`px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono ${
              isLight ? 'bg-slate-100/90 border-b border-slate-200' : 'bg-slate-900/90 border-b border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3 text-cyan-400" />
                <span>Filter:</span>
              </span>

              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'ALL'
                    ? isLight
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-200'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>All</span>
                <span className="opacity-70">({categoryCounts.ALL})</span>
              </button>

              <button
                onClick={() => setActiveFilter('ALERT_LOG')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'ALERT_LOG'
                    ? 'bg-rose-500 text-white font-bold shadow-xs'
                    : isLight
                    ? 'text-rose-700 hover:bg-rose-100'
                    : 'text-rose-400 hover:bg-rose-950/50'
                }`}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Alert Logs</span>
                <span className="opacity-70">({categoryCounts.ALERT_LOG})</span>
              </button>

              <button
                onClick={() => setActiveFilter('WORKER')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'WORKER'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isLight
                    ? 'text-emerald-700 hover:bg-emerald-100'
                    : 'text-emerald-400 hover:bg-emerald-950/50'
                }`}
              >
                <UserCheck className="h-3 w-3" />
                <span>Worker IDs</span>
                <span className="opacity-70">({categoryCounts.WORKER})</span>
              </button>

              <button
                onClick={() => setActiveFilter('TELEMETRY_CATEGORY')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'TELEMETRY_CATEGORY'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : isLight
                    ? 'text-cyan-800 hover:bg-cyan-100'
                    : 'text-cyan-400 hover:bg-cyan-950/50'
                }`}
              >
                <Activity className="h-3 w-3" />
                <span>Telemetry</span>
                <span className="opacity-70">({categoryCounts.TELEMETRY_CATEGORY})</span>
              </button>

              <button
                onClick={() => setActiveFilter('ZONE')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'ZONE'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isLight
                    ? 'text-blue-700 hover:bg-blue-100'
                    : 'text-blue-400 hover:bg-blue-950/50'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>Zones</span>
                <span className="opacity-70">({categoryCounts.ZONE})</span>
              </button>

              <button
                onClick={() => setActiveFilter('PREDICTIVE_REPORT')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'PREDICTIVE_REPORT'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : isLight
                    ? 'text-purple-700 hover:bg-purple-100'
                    : 'text-purple-400 hover:bg-purple-950/50'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Reports</span>
                <span className="opacity-70">({categoryCounts.PREDICTIVE_REPORT})</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 shrink-0 hidden md:inline">
              {filteredResults.length} matches
            </span>
          </div>

          {/* Quick Search Chips (Shown when input is empty) */}
          {!query && (
            <div
              className={`p-3 border-b text-xs ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Popular Quick Searches &amp; Primary Signals:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(chip.queryText);
                      setActiveFilter('ALL');
                      inputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer border flex items-center gap-1 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:border-cyan-500 hover:text-cyan-800 shadow-xs'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 hover:bg-slate-850'
                    }`}
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto py-1 divide-y divide-slate-800/30">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                <ShieldAlert className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-300 mb-1">No matching results found for "{query}"</p>
                <p className="text-[11px] text-slate-500">
                  Try searching for a worker ID (e.g. <code>W-9921</code>, <code>W-6104</code>), an alert log (e.g.{' '}
                  <code>ALR-8842</code>, <code>INC-2026</code>), or a telemetry metric (e.g. <code>Heart Rate</code>,{' '}
                  <code>HRV</code>, <code>WBGT</code>).
                </p>
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? isLight
                          ? 'bg-cyan-50 border-l-4 border-cyan-600 pl-3'
                          : 'bg-cyan-950/60 border-l-4 border-cyan-400 pl-3'
                        : isLight
                        ? 'hover:bg-slate-100'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 border ${
                          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="overflow-hidden min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {highlightMatch(item.title, query)}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                          {item.severity && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : item.severity === 'HIGH'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              {item.severity}
                            </span>
                          )}
                        </div>

                        <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {highlightMatch(item.subtitle, query)}
                        </p>

                        {item.details && (
                          <p className={`text-[10px] truncate mt-0.5 font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            {highlightMatch(item.details, query)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center pl-3 shrink-0 space-x-2">
                      <span
                        className={`hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded border items-center gap-1 transition ${
                          isSelected
                            ? isLight
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : isLight
                            ? 'text-slate-500 border-transparent'
                            : 'text-slate-500 border-transparent'
                        }`}
                      >
                        <span>{item.actionHint}</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isSelected ? (isLight ? 'text-cyan-700' : 'text-cyan-400') : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Tip */}
          <div
            className={`px-3.5 py-2 flex items-center justify-between text-[10px] font-mono border-t ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-900/90 text-slate-500 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>↑↓ Navigate</span>
              <span>•</span>
              <span>Enter Select</span>
              <span>•</span>
              <span>Tab Filter</span>
              <span>•</span>
              <span>Esc Close</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-cyan-400 font-semibold">Alert Logs</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Worker IDs</span>
              <span>•</span>
              <span className="text-purple-400 font-semibold">Telemetry Signals</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const GlobalSearchBar = React.memo(GlobalSearchBarComponent);
export default GlobalSearchBar;

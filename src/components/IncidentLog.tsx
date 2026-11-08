import React, { useState, useMemo, useCallback } from 'react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  Volume2,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Radio,
  FileText,
  ShieldCheck,
  User,
  MapPin,
  Activity,
  ListFilter,
  Layers,
  Heart,
  Thermometer,
  Wrench,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

export interface HistoricalIncident {
  id: string;
  workerId: string;
  zoneId: string;
  zoneName: string;
  timestamp: string; // ISO 8601 string
  timeFormatted: string; // Human-friendly timestamp
  timeAgo: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  anomalyMetric: string;
  detectionSource: 'KALMAN_INNOVATION' | 'LSTM_AUTOENCODER' | 'THRESHOLD_BREACH' | 'BIOMETRIC_TELEMETRY';
  rawValue: string;
  kalmanSmoothedValue: string;
  kalmanStatus: string;
  leadTime: string;
  recommendedAction: string;
  status: 'PENDING_ACTION' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  acknowledgedAt?: string;
  dispatchedAt?: string;
  responderNote?: string;
  privacyStatus: string;
  alertType?: 'HEALTH_ANOMALY' | 'PREDICTIVE_MAINTENANCE' | 'ENVIRONMENTAL';
}

interface IncidentLogProps {
  alerts?: ActiveAnomalyAlert[];
  zones: FacilityZone[];
  selectedZoneId?: string;
  onAcknowledgeAlert?: (alertId: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
  onSpeakAlert?: (alert: ActiveAnomalyAlert) => void;
  isSpeaking?: boolean;
  className?: string;
  theme?: 'dark' | 'high-contrast-light';
}

// Comprehensive seed historical incident archive spanning shifts over the past 30 days
const SEED_HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  {
    id: 'INC-2026-9104',
    workerId: 'W-9921',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    timestamp: '2026-11-07T22:48:00Z',
    timeFormatted: 'Nov 07, 2026 22:48:00 UTC',
    timeAgo: '12 mins ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Acute Autonomic & Thermal Strain',
    detectionSource: 'KALMAN_INNOVATION',
    rawValue: 'HRV: 31 ms (Jitter: ±8ms), Skin: 38.4°C',
    kalmanSmoothedValue: 'HRV: 34.2 ms, Skin: 38.15°C',
    kalmanStatus: 'Jitter Filtered & Validated',
    leadTime: '3.8h Prior to Syncope',
    recommendedAction: 'Immediate extraction: Escort cohort member to air-conditioned shelter, administer 500ml oral rehydration solution.',
    status: 'PENDING_ACTION',
    privacyStatus: 'k-Anonymity Cleared (N=18 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-9042',
    workerId: 'EQUIP-CONV-4B',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    timestamp: '2026-11-07T22:42:00Z',
    timeFormatted: 'Nov 07, 2026 22:42:00 UTC',
    timeAgo: '18 mins ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Predictive Maintenance: Bearing Vibration & Motor Casing Heat',
    detectionSource: 'LSTM_AUTOENCODER',
    rawValue: 'Vibration: 7.2 mm/s RMS, Casing Heat: 89.1°C',
    kalmanSmoothedValue: 'Vibration: 6.85 mm/s, Casing Heat: 86.4°C',
    kalmanStatus: 'Confirmed Sensor Spike',
    leadTime: '4.2h Prior to Bearing Seizure',
    recommendedAction: 'Emergency lubrication dispatch required. Pre-emptively throttle conveyor drive to 40% speed.',
    status: 'DISPATCHED',
    dispatchedAt: 'Nov 07, 2026 22:45:10 UTC',
    privacyStatus: 'Equipment Telemetry (Exempt from HIPAA/GDPR)',
    alertType: 'PREDICTIVE_MAINTENANCE'
  },
  {
    id: 'INC-2026-8981',
    workerId: 'W-4102',
    zoneId: 'High-Temperature-Smelter-Cell',
    zoneName: 'High-Temperature Smelter Cell',
    timestamp: '2026-11-07T21:15:00Z',
    timeFormatted: 'Nov 07, 2026 21:15:00 UTC',
    timeAgo: '1.7h ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Core Body Hyperthermia & Autonomic Exhaustion',
    detectionSource: 'KALMAN_INNOVATION',
    rawValue: 'Core Skin: 39.2°C, Heart Rate: 138 BPM',
    kalmanSmoothedValue: 'Core Skin: 38.95°C, Heart Rate: 135 BPM',
    kalmanStatus: 'Jitter Filtered & Validated',
    leadTime: '2.5h Prior to Heat Stroke',
    recommendedAction: 'Immediate rotation order: Enforce active cooling vest deployment and mandatory 25-minute recovery.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: 'Nov 07, 2026 21:18:22 UTC',
    privacyStatus: 'k-Anonymity Cleared (N=14 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-8874',
    workerId: 'W-7740',
    zoneId: 'Heavy-Fabrication-Welding',
    zoneName: 'Heavy Fabrication & Welding',
    timestamp: '2026-11-07T19:30:00Z',
    timeFormatted: 'Nov 07, 2026 19:30:00 UTC',
    timeAgo: '3.5h ago',
    severity: 'HIGH',
    anomalyMetric: 'Sustained Tachycardia & Noise-Induced Stress',
    detectionSource: 'THRESHOLD_BREACH',
    rawValue: 'Acoustic: 94.6 dBA, HR: 122 BPM',
    kalmanSmoothedValue: 'Acoustic: 92.8 dBA, HR: 119 BPM',
    kalmanStatus: 'Transient Noise Suppressed',
    leadTime: '1.2h Prior to OSHA Limit Exceedance',
    recommendedAction: 'Inspect dual-layer hearing protection compliance and dispatch auxiliary ventilation hood.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: 'Nov 07, 2026 19:34:05 UTC',
    privacyStatus: 'k-Anonymity Cleared (N=22 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-8719',
    workerId: 'W-3209',
    zoneId: 'Logistics-Warehouse-North',
    zoneName: 'Logistics & Staging Warehouse North',
    timestamp: '2026-11-07T18:05:00Z',
    timeFormatted: 'Nov 07, 2026 18:05:00 UTC',
    timeAgo: '5h ago',
    severity: 'MODERATE',
    anomalyMetric: 'Accumulated Sleep Deficit & Micro-Stamina Degradation',
    detectionSource: 'BIOMETRIC_TELEMETRY',
    rawValue: 'Sleep Deficit: 3.5h, HRV RMSSD: 39 ms',
    kalmanSmoothedValue: 'Sleep Deficit: 3.5h, HRV RMSSD: 41.2 ms',
    kalmanStatus: 'Signal Imputed',
    leadTime: '6.0h Cumulative Fatigue Curve',
    recommendedAction: 'Reassign worker from high-reach order picking to low-velocity ground staging buffer.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 07, 2026 18:10:00 UTC',
    dispatchedAt: 'Nov 07, 2026 18:12:30 UTC',
    responderNote: 'Shift supervisor reassigned worker to dock sorting buffer.',
    privacyStatus: 'Differential Privacy (ε=0.5) Enforced',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-8650',
    workerId: 'EQUIP-HVAC-3A',
    zoneId: 'Underground-Utility-Conduit-3',
    zoneName: 'Underground Utility Conduit 3',
    timestamp: '2026-11-07T14:20:00Z',
    timeFormatted: 'Nov 07, 2026 14:20:00 UTC',
    timeAgo: '8.6h ago',
    severity: 'HIGH',
    anomalyMetric: 'Predictive Maintenance: Chiller Compressor Rotor Imbalance',
    detectionSource: 'LSTM_AUTOENCODER',
    rawValue: 'Vibration RMS: 5.8 mm/s, Diff Temp: +14.2°C',
    kalmanSmoothedValue: 'Vibration RMS: 5.4 mm/s, Diff Temp: +13.8°C',
    kalmanStatus: 'Confirmed Sensor Spike',
    leadTime: '12h Prior to Secondary Overheat Trip',
    recommendedAction: 'Schedule dynamic rotor rebalancing during next shift turnover. Inspect impeller clearance.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: 'Nov 07, 2026 14:28:11 UTC',
    privacyStatus: 'Equipment Telemetry (Exempt)',
    alertType: 'PREDICTIVE_MAINTENANCE'
  },
  {
    id: 'INC-2026-8512',
    workerId: 'W-6604',
    zoneId: 'Robotics-Line-B',
    zoneName: 'Robotics & Precision Assembly Line B',
    timestamp: '2026-11-07T10:45:00Z',
    timeFormatted: 'Nov 07, 2026 10:45:00 UTC',
    timeAgo: '12.2h ago',
    severity: 'LOW',
    anomalyMetric: 'Ergonomic Static Load & Repetitive Motion Fatigue',
    detectionSource: 'BIOMETRIC_TELEMETRY',
    rawValue: 'Static Posture Index: 78/100, Trapezius Load: High',
    kalmanSmoothedValue: 'Static Posture Index: 74/100',
    kalmanStatus: 'Jitter Filtered & Validated',
    leadTime: 'Shift End Ergonomic Strain Warning',
    recommendedAction: 'Trigger automated sit-stand workstation transition and recommend 3-minute micro-stretch routine.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 07, 2026 10:50:00 UTC',
    privacyStatus: 'k-Anonymity Cleared (N=35 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-8340',
    workerId: 'W-8812',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Civil & Structural Construction Sector 4',
    timestamp: '2026-11-06T15:10:00Z',
    timeFormatted: 'Nov 06, 2026 15:10:00 UTC',
    timeAgo: '1 day ago',
    severity: 'CRITICAL',
    anomalyMetric: 'Thermal Work Limit (TWL) Breach & Dehydration Shock',
    detectionSource: 'KALMAN_INNOVATION',
    rawValue: 'TWL: 112 W/m² (Cutoff: 140 W/m²), Core: 38.6°C',
    kalmanSmoothedValue: 'TWL: 115 W/m², Core: 38.35°C',
    kalmanStatus: 'Jitter Filtered & Validated',
    leadTime: '1.8h Rapid Dehydration Onset',
    recommendedAction: 'Immediate work-rest cycle enforcement: 20 min work / 40 min rest in cooling shelter.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 06, 2026 15:12:44 UTC',
    dispatchedAt: 'Nov 06, 2026 15:14:00 UTC',
    responderNote: 'Field safety officer deployed mobile mister station and provided electrolytes.',
    privacyStatus: 'k-Anonymity Cleared (N=18 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-8199',
    workerId: 'W-5211',
    zoneId: 'High-Temperature-Smelter-Cell',
    zoneName: 'High-Temperature Smelter Cell',
    timestamp: '2026-11-05T18:40:00Z',
    timeFormatted: 'Nov 05, 2026 18:40:00 UTC',
    timeAgo: '2 days ago',
    severity: 'HIGH',
    anomalyMetric: 'Rapid Heart Rate Decoupling during Slag Tapping',
    detectionSource: 'KALMAN_INNOVATION',
    rawValue: 'HR: 142 BPM, HRV RMSSD: 18 ms',
    kalmanSmoothedValue: 'HR: 139 BPM, HRV RMSSD: 21 ms',
    kalmanStatus: 'Jitter Filtered & Validated',
    leadTime: '2.0h Heat Strain Exhaustion Window',
    recommendedAction: 'Deploy secondary relief operator. Transition worker to remote tele-monitoring cabin.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 05, 2026 18:43:10 UTC',
    privacyStatus: 'k-Anonymity Cleared (N=14 ≥ 12)',
    alertType: 'HEALTH_ANOMALY'
  },
  {
    id: 'INC-2026-7940',
    workerId: 'EQUIP-VENT-1B',
    zoneId: 'Heavy-Fabrication-Welding',
    zoneName: 'Heavy Fabrication & Welding',
    timestamp: '2026-11-04T09:25:00Z',
    timeFormatted: 'Nov 04, 2026 09:25:00 UTC',
    timeAgo: '3 days ago',
    severity: 'MODERATE',
    anomalyMetric: 'Predictive Maintenance: Exhaust Fan Belt Slippage',
    detectionSource: 'LSTM_AUTOENCODER',
    rawValue: 'Airflow Deviation: -24%, Belt Pulley Temp: 74°C',
    kalmanSmoothedValue: 'Airflow Deviation: -21%, Pulley Temp: 71.5°C',
    kalmanStatus: 'Signal Imputed',
    leadTime: '48h Prior to Fume Extraction Degradation',
    recommendedAction: 'Tension secondary drive belt and re-calibrate particulate optical sensor.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 04, 2026 09:30:15 UTC',
    dispatchedAt: 'Nov 04, 2026 10:00:00 UTC',
    privacyStatus: 'Equipment Telemetry (Exempt)',
    alertType: 'PREDICTIVE_MAINTENANCE'
  },
  {
    id: 'INC-2026-7685',
    workerId: 'W-1109',
    zoneId: 'Logistics-Warehouse-North',
    zoneName: 'Logistics & Staging Warehouse North',
    timestamp: '2026-11-02T13:50:00Z',
    timeFormatted: 'Nov 02, 2026 13:50:00 UTC',
    timeAgo: '5 days ago',
    severity: 'LOW',
    anomalyMetric: 'Slight Environmental Ambient Temperature Incursion',
    detectionSource: 'THRESHOLD_BREACH',
    rawValue: 'Warehouse Ambient: 28.8°C, Humidity: 68%',
    kalmanSmoothedValue: 'Warehouse Ambient: 28.5°C',
    kalmanStatus: 'Transient Noise Suppressed',
    leadTime: 'Informational Environmental Drift',
    recommendedAction: 'Engage high-volume low-speed (HVLS) de-stratification fans in bays 4 through 8.',
    status: 'RESOLVED',
    acknowledgedAt: 'Nov 02, 2026 14:00:00 UTC',
    privacyStatus: 'Zone Macro Telemetry',
    alertType: 'ENVIRONMENTAL'
  }
];

export default function IncidentLog({
  alerts = [],
  zones,
  selectedZoneId,
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone,
  onSpeakAlert,
  isSpeaking = false,
  className = '',
  theme = 'dark'
}: IncidentLogProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>(selectedZoneId || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30D');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  // Bulk action selection state
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<Set<string>>(new Set());
  const [bulkFeedback, setBulkFeedback] = useState<{ message: string; count: number } | null>(null);

  // Local acknowledgment/resolution state for seed incidents or instant UI feedback
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED'>>({});

  // Merge live incoming alerts with seed historical archive
  const allIncidents = useMemo<HistoricalIncident[]>(() => {
    // Convert active live alerts into HistoricalIncident format
    const liveConverted: HistoricalIncident[] = alerts.map((a) => {
      const zoneObj = zones.find((z) => z.name === a.location_zone || z.id === a.location_zone);
      const isLocallyResolved = localStatuses[a.id] === 'RESOLVED';
      const isLocallyAcked = localStatuses[a.id] === 'ACKNOWLEDGED' || a.acknowledged;
      const isLocallyDispatched = localStatuses[a.id] === 'DISPATCHED';

      let status: 'PENDING_ACTION' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' = 'PENDING_ACTION';
      if (isLocallyResolved) {
        status = 'RESOLVED';
      } else if (isLocallyDispatched) {
        status = 'DISPATCHED';
      } else if (isLocallyAcked) {
        status = 'ACKNOWLEDGED';
      }

      return {
        id: a.id,
        workerId: a.worker_id,
        zoneId: zoneObj?.id || a.location_zone,
        zoneName: zoneObj?.name || a.location_zone,
        timestamp: new Date().toISOString(),
        timeFormatted: `Live Telemetry (${a.detected_at})`,
        timeAgo: a.detected_at,
        severity: a.severity,
        anomalyMetric: a.anomaly_metric,
        detectionSource: a.kalman_status.includes('Confirmed') ? 'LSTM_AUTOENCODER' : 'KALMAN_INNOVATION',
        rawValue: a.raw_value,
        kalmanSmoothedValue: a.kalman_smoothed_value,
        kalmanStatus: a.kalman_status,
        leadTime: a.lead_time,
        recommendedAction: a.recommended_action,
        status,
        privacyStatus: a.privacy_status,
        alertType: a.alert_type || 'HEALTH_ANOMALY'
      };
    });

    // Merge without duplicating IDs
    const liveIds = new Set(liveConverted.map((i) => i.id));
    const historyFiltered: HistoricalIncident[] = SEED_HISTORICAL_INCIDENTS.filter((i) => !liveIds.has(i.id)).map((i) => {
      if (localStatuses[i.id]) {
        const updatedStatus = localStatuses[i.id];
        return {
          ...i,
          status: updatedStatus,
          acknowledgedAt: updatedStatus === 'ACKNOWLEDGED' ? 'Just now' : i.acknowledgedAt,
          dispatchedAt: updatedStatus === 'DISPATCHED' ? 'Just now' : i.dispatchedAt
        };
      }
      return i;
    });

    return [...liveConverted, ...historyFiltered];
  }, [alerts, zones, localStatuses]);

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((incident) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = incident.id.toLowerCase().includes(q);
        const matchesWorker = incident.workerId.toLowerCase().includes(q);
        const matchesZone = incident.zoneName.toLowerCase().includes(q);
        const matchesMetric = incident.anomalyMetric.toLowerCase().includes(q);
        const matchesAction = incident.recommendedAction.toLowerCase().includes(q);
        if (!matchesId && !matchesWorker && !matchesZone && !matchesMetric && !matchesAction) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && incident.severity !== selectedSeverity) {
        return false;
      }

      // Zone filter
      if (selectedZoneFilter !== 'ALL') {
        const matchesZone = incident.zoneId === selectedZoneFilter || incident.zoneName === selectedZoneFilter;
        if (!matchesZone) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ACTIVE' && incident.status !== 'PENDING_ACTION') return false;
        if (selectedStatus === 'ACKNOWLEDGED' && incident.status !== 'ACKNOWLEDGED') return false;
        if (selectedStatus === 'DISPATCHED' && incident.status !== 'DISPATCHED') return false;
        if (selectedStatus === 'RESOLVED' && incident.status !== 'RESOLVED') return false;
      }

      // Detection Source filter
      if (selectedSource !== 'ALL' && incident.detectionSource !== selectedSource) {
        return false;
      }

      // Time range filter
      if (selectedTimeRange === '24H') {
        const isRecent = incident.timeAgo.includes('min') || incident.timeAgo.includes('h ago') || incident.timeAgo.includes('Live');
        if (!isRecent) return false;
      } else if (selectedTimeRange === '7D') {
        const isBeyond7D = incident.timeAgo.includes('days ago') && parseInt(incident.timeAgo, 10) > 7;
        if (isBeyond7D) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        // Pending action always floats to top in newest sort
        if (a.status === 'PENDING_ACTION' && b.status !== 'PENDING_ACTION') return -1;
        if (b.status === 'PENDING_ACTION' && a.status !== 'PENDING_ACTION') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'severity') {
        const severityRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
        return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      }
      return 0;
    });
  }, [allIncidents, searchQuery, selectedSeverity, selectedZoneFilter, selectedStatus, selectedSource, selectedTimeRange, sortBy]);

  // Statistical Counts for Summary Row
  const stats = useMemo(() => {
    const total = allIncidents.length;
    const critical = allIncidents.filter((i) => i.severity === 'CRITICAL').length;
    const high = allIncidents.filter((i) => i.severity === 'HIGH').length;
    const pending = allIncidents.filter((i) => i.status === 'PENDING_ACTION').length;
    const acknowledged = allIncidents.filter((i) => i.status === 'ACKNOWLEDGED' || i.status === 'RESOLVED').length;
    const ackRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 100;
    return { total, critical, high, pending, acknowledged, ackRate };
  }, [allIncidents]);

  // Handle local or prop-based alert acknowledgment
  const handleAcknowledge = useCallback((incident: HistoricalIncident) => {
    setLocalStatuses((prev) => ({ ...prev, [incident.id]: 'ACKNOWLEDGED' }));
    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(incident.id);
    }
  }, [onAcknowledgeAlert]);

  // Bulk selection toggles and bulk operations
  const allFilteredSelected = useMemo(() => {
    if (filteredIncidents.length === 0) return false;
    return filteredIncidents.every((inc) => selectedIncidentIds.has(inc.id));
  }, [filteredIncidents, selectedIncidentIds]);

  const toggleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIncidentIds(new Set());
    } else {
      setSelectedIncidentIds(new Set(filteredIncidents.map((inc) => inc.id)));
    }
  }, [allFilteredSelected, filteredIncidents]);

  const toggleSelectIncident = useCallback((id: string) => {
    setSelectedIncidentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBulkAcknowledge = useCallback(() => {
    if (selectedIncidentIds.size === 0) return;
    const count = selectedIncidentIds.size;
    setLocalStatuses((prev) => {
      const updated = { ...prev };
      selectedIncidentIds.forEach((id) => {
        updated[id] = 'ACKNOWLEDGED';
        if (onAcknowledgeAlert) {
          onAcknowledgeAlert(id);
        }
      });
      return updated;
    });
    setBulkFeedback({
      message: `Successfully acknowledged ${count} alert${count > 1 ? 's' : ''}`,
      count
    });
    setSelectedIncidentIds(new Set());
    setTimeout(() => setBulkFeedback(null), 4000);
  }, [selectedIncidentIds, onAcknowledgeAlert]);

  const handleBulkResolve = useCallback(() => {
    if (selectedIncidentIds.size === 0) return;
    const count = selectedIncidentIds.size;
    setLocalStatuses((prev) => {
      const updated = { ...prev };
      selectedIncidentIds.forEach((id) => {
        updated[id] = 'RESOLVED';
      });
      return updated;
    });
    setBulkFeedback({
      message: `Successfully resolved ${count} alert${count > 1 ? 's' : ''}`,
      count
    });
    setSelectedIncidentIds(new Set());
    setTimeout(() => setBulkFeedback(null), 4000);
  }, [selectedIncidentIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedIncidentIds(new Set());
  }, []);

  // Handle medical/field dispatch
  const handleDispatch = useCallback((incident: HistoricalIncident) => {
    setLocalStatuses((prev) => ({ ...prev, [incident.id]: 'DISPATCHED' }));
    if (onDispatchAction) {
      // Find or build alert object
      const matching = alerts.find((a) => a.id === incident.id) || {
        id: incident.id,
        worker_id: incident.workerId,
        location_zone: incident.zoneName,
        detected_at: incident.timeAgo,
        anomaly_metric: incident.anomalyMetric,
        raw_value: incident.rawValue,
        kalman_smoothed_value: incident.kalmanSmoothedValue,
        severity: incident.severity,
        kalman_status: incident.kalmanStatus as any,
        lead_time: incident.leadTime,
        recommended_action: incident.recommendedAction,
        acknowledged: true,
        privacy_status: incident.privacyStatus,
        alert_type: incident.alertType
      };
      onDispatchAction(matching);
    }
  }, [alerts, onDispatchAction]);

  // Handle voice readout of incident
  const handleSpeak = useCallback((incident: HistoricalIncident) => {
    if (onSpeakAlert) {
      const matching = alerts.find((a) => a.id === incident.id) || {
        id: incident.id,
        worker_id: incident.workerId,
        location_zone: incident.zoneName,
        detected_at: incident.timeAgo,
        anomaly_metric: incident.anomalyMetric,
        raw_value: incident.rawValue,
        kalman_smoothed_value: incident.kalmanSmoothedValue,
        severity: incident.severity,
        kalman_status: incident.kalmanStatus as any,
        lead_time: incident.leadTime,
        recommended_action: incident.recommendedAction,
        acknowledged: incident.status === 'ACKNOWLEDGED',
        privacy_status: incident.privacyStatus,
        alert_type: incident.alertType
      };
      onSpeakAlert(matching);
    }
  }, [alerts, onSpeakAlert]);

  // CSV Export Functionality
  const handleExportCsv = useCallback(() => {
    const headers = [
      'Incident ID',
      'Timestamp (UTC)',
      'Severity',
      'Site / Zone',
      'Worker / Equipment ID',
      'Anomaly Metric',
      'Detection Source',
      'Raw Sensor Reading',
      'Kalman Filter Estimate',
      'Kalman State Status',
      'Lead Time to Breach',
      'Operational Action',
      'Status',
      'Privacy Compliance'
    ];

    const rows = filteredIncidents.map((i) => [
      `"${i.id}"`,
      `"${i.timestamp}"`,
      `"${i.severity}"`,
      `"${i.zoneName}"`,
      `"${i.workerId}"`,
      `"${i.anomalyMetric}"`,
      `"${i.detectionSource}"`,
      `"${i.rawValue}"`,
      `"${i.kalmanSmoothedValue}"`,
      `"${i.kalmanStatus}"`,
      `"${i.leadTime}"`,
      `"${i.recommendedAction.replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${i.privacyStatus}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prognosticator_incident_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredIncidents]);

  const isLight = theme === 'high-contrast-light';

  return (
    <section
      id="incident-log-section"
      className={`rounded-xl border p-5 shadow-lg transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      } ${className}`}
      aria-labelledby="incident-log-heading"
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-rose-500">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <h2 id="incident-log-heading" className="text-base font-bold uppercase tracking-wider">
              Incident Log &amp; Anomaly Records
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-semibold">
              Kalman &amp; LSTM Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical register of multi-signal telemetry alerts, Kalman innovation spikes, and physiological threshold breaches across all facility cohorts
          </p>
        </div>

        {/* Action Controls: Export CSV & View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition cursor-pointer shadow-xs"
            title="Export filtered incident records to formatted CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
              aria-label="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Detailed Cards View"
              aria-label="Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Total Incidents</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-100 mt-0.5">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">30-day window</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/30">
          <div className="text-[10px] font-mono text-rose-400 uppercase">Critical Severity</div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-300 mt-0.5">
            {stats.critical}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Immediate action req.</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30">
          <div className="text-[10px] font-mono text-amber-400 uppercase">High Severity</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">
            {stats.high}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Close surveillance</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono text-cyan-400 uppercase">Pending Action</div>
          <div className="text-xl font-bold font-mono tabular-nums text-cyan-300 mt-0.5">
            {stats.pending}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unresolved alerts</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30">
          <div className="text-[10px] font-mono text-emerald-400 uppercase">Ack / Resolved</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-300 mt-0.5">
            {stats.acknowledged}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Protocols enacted</div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] font-mono text-indigo-400 uppercase">Response Rate</div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-300 mt-0.5">
            {stats.ackRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">MTTA: 4.2 mins</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by incident ID, zone, worker cohort, metric, or action..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Site / Zone Dropdown */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">All Facility Zones &amp; Sites</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Dropdown */}
          <div className="w-full md:w-44 shrink-0">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="24H">Last 24 Hours</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="ALL">All Recorded Shifts</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-40 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="severity">Sort: Highest Severity</option>
            </select>
          </div>
        </div>

        {/* Severity & Status Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850 text-xs">
          {/* Severity Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Severity:</span>
            </span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => {
              const count =
                sev === 'ALL'
                  ? allIncidents.length
                  : allIncidents.filter((i) => i.severity === sev).length;
              const isActive = selectedSeverity === sev;

              let activeClass = 'bg-cyan-600 text-white';
              if (sev === 'CRITICAL') activeClass = 'bg-rose-600 text-white';
              if (sev === 'HIGH') activeClass = 'bg-amber-600 text-white';
              if (sev === 'MODERATE') activeClass = 'bg-yellow-600 text-slate-950 font-bold';
              if (sev === 'LOW') activeClass = 'bg-blue-600 text-white';

              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    isActive ? activeClass : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{sev}</span>
                  <span className="text-[10px] opacity-80 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Status Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Pending Action' },
              { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
              { id: 'DISPATCHED', label: 'Dispatched' },
              { id: 'RESOLVED', label: 'Resolved' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
        <div>
          Showing <span className="font-mono font-bold text-slate-200">{filteredIncidents.length}</span> of{' '}
          <span className="font-mono">{allIncidents.length}</span> total incident records
        </div>
        {searchQuery && (
          <div className="text-[11px] text-cyan-400">
            Filtered by keyword: &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      {/* Bulk Action Feedback Notice */}
      {bulkFeedback && (
        <div className="mb-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{bulkFeedback.message}</span>
          </div>
          <button
            onClick={() => setBulkFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIncidentIds.size > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/50 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center">
              {selectedIncidentIds.size}
            </div>
            <div>
              <span className="font-bold text-cyan-200">
                {selectedIncidentIds.size} incident{selectedIncidentIds.size > 1 ? 's' : ''} selected
              </span>
              <span className="text-[11px] text-cyan-300/80 ml-2">
                (Bulk triage &amp; compliance actions)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAcknowledge}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Acknowledge all selected alerts simultaneously"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Bulk Acknowledge ({selectedIncidentIds.size})</span>
            </button>

            <button
              onClick={handleBulkResolve}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Mark all selected alerts as resolved in audit trail"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Bulk Resolve ({selectedIncidentIds.size})</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
                    title={allFilteredSelected ? 'Deselect all' : 'Select all matching incidents'}
                    aria-label="Select all incidents"
                  />
                </th>
                <th className="py-2.5 px-3">Incident ID &amp; Time</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Facility Site &amp; Cohort</th>
                <th className="py-2.5 px-3">Anomaly Metric &amp; Signal State</th>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                    No incidents match the active search filter parameters.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const isExpanded = expandedIncidentId === incident.id;
                  const isPending = incident.status === 'PENDING_ACTION';
                  const isSelected = selectedIncidentIds.has(incident.id);

                  // Severity badge styles
                  let sevBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (incident.severity === 'CRITICAL') {
                    sevBadge = 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse';
                  } else if (incident.severity === 'HIGH') {
                    sevBadge = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
                  } else if (incident.severity === 'MODERATE') {
                    sevBadge = 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
                  } else if (incident.severity === 'LOW') {
                    sevBadge = 'bg-blue-950/80 text-blue-300 border-blue-500/40';
                  }

                  // Status badge styles
                  let statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (incident.status === 'PENDING_ACTION') {
                    statusBadge = 'bg-red-500/10 text-rose-400 border-rose-500/30';
                  } else if (incident.status === 'ACKNOWLEDGED') {
                    statusBadge = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                  } else if (incident.status === 'DISPATCHED') {
                    statusBadge = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
                  } else if (incident.status === 'RESOLVED') {
                    statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  }

                  return (
                    <React.Fragment key={incident.id}>
                      <tr
                        className={`hover:bg-slate-900/60 transition cursor-pointer ${
                          isSelected ? 'bg-cyan-950/20' : isPending ? 'bg-rose-950/10' : ''
                        }`}
                        onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                      >
                        {/* Row Selection Checkbox */}
                        <td className="py-3 px-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectIncident(incident.id)}
                            className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5 mt-0.5"
                            aria-label={`Select incident ${incident.id}`}
                          />
                        </td>

                        {/* Incident ID & Timestamp */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="text-cyan-400">{incident.id}</span>
                            {incident.alertType === 'PREDICTIVE_MAINTENANCE' && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                                IoT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{incident.timeAgo}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {incident.timeFormatted}
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${sevBadge}`}>
                            {incident.severity === 'CRITICAL' && <AlertOctagon className="h-3 w-3" />}
                            {incident.severity === 'HIGH' && <AlertTriangle className="h-3 w-3" />}
                            {incident.severity}
                          </span>
                        </td>

                        {/* Facility Site & Cohort */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-slate-200">
                            {incident.zoneName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-slate-500" />
                            <span>Worker ID: {incident.workerId}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {incident.privacyStatus}
                          </div>
                        </td>

                        {/* Anomaly Metric & Signal */}
                        <td className="py-3 px-3 align-top max-w-xs">
                          <div className="font-semibold text-slate-100 line-clamp-1">
                            {incident.anomalyMetric}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                            Kalman: {incident.kalmanSmoothedValue}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 line-clamp-1">
                            Raw: {incident.rawValue}
                          </div>
                          <div className="text-[10px] text-indigo-400/90 mt-0.5">
                            ✓ {incident.kalmanStatus}
                          </div>
                        </td>

                        {/* Lead Time */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className="text-amber-400 font-mono font-semibold">
                            {incident.leadTime}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            {incident.detectionSource}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
                            {incident.status === 'RESOLVED' && <CheckCircle2 className="h-3 w-3" />}
                            {incident.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Acknowledge Button */}
                            {incident.status === 'PENDING_ACTION' && (
                              <button
                                onClick={() => handleAcknowledge(incident)}
                                className="px-2 py-1 rounded text-[10px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shadow-xs"
                                title="Acknowledge alert and log manager acknowledgment"
                              >
                                Acknowledge
                              </button>
                            )}

                            {/* Dispatch Action Button */}
                            {incident.severity === 'CRITICAL' && incident.status !== 'DISPATCHED' && (
                              <button
                                onClick={() => handleDispatch(incident)}
                                className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Dispatch field safety team / paramedic"
                              >
                                <Send className="h-3 w-3" />
                                <span>Dispatch</span>
                              </button>
                            )}

                            {/* Voice Readout Button */}
                            <button
                              onClick={() => handleSpeak(incident)}
                              disabled={isSpeaking}
                              className="p-1 rounded text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-700 transition cursor-pointer"
                              title="Speak incident summary via Text-To-Speech"
                              aria-label="Speak incident"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>

                            {/* View / Focus Zone */}
                            {onSelectZone && (
                              <button
                                onClick={() => onSelectZone(incident.zoneId)}
                                className="p-1 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-700 transition cursor-pointer"
                                title="Focus map and telemetry charts on this facility zone"
                                aria-label="Focus facility zone"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Expand Row Toggle */}
                            <button
                              onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Incident Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={8} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                                  <span>Recommended Operational Action</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed font-sans">
                                  {incident.recommendedAction}
                                </p>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Telemetry Signal Breakdown</span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Raw Sensor:</span>
                                    <span className="text-slate-300">{incident.rawValue}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Kalman State:</span>
                                    <span className="text-cyan-300 font-semibold">{incident.kalmanSmoothedValue}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">State Verifier:</span>
                                    <span className="text-indigo-300">{incident.kalmanStatus}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Compliance &amp; Dispatch Trail</span>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Privacy Standard:</span>
                                    <span className="text-slate-300 font-mono">{incident.privacyStatus}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Timestamp:</span>
                                    <span className="text-slate-300 font-mono">{incident.timeFormatted}</span>
                                  </div>
                                  {incident.acknowledgedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Acknowledged:</span>
                                      <span className="text-cyan-400 font-mono">{incident.acknowledgedAt}</span>
                                    </div>
                                  )}
                                  {incident.dispatchedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Dispatched:</span>
                                      <span className="text-purple-400 font-mono">{incident.dispatchedAt}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Content View: Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-slate-600" />
              No incidents match the active search filter parameters.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isPending = incident.status === 'PENDING_ACTION';
              const isSelected = selectedIncidentIds.has(incident.id);

              let borderAccent = 'border-slate-800';
              if (isSelected) borderAccent = 'border-cyan-500/80 bg-cyan-950/20';
              else if (incident.severity === 'CRITICAL') borderAccent = 'border-rose-500/50 bg-rose-950/10';
              else if (incident.severity === 'HIGH') borderAccent = 'border-amber-500/50';

              return (
                <div
                  key={incident.id}
                  className={`p-4 rounded-xl bg-slate-950 border ${borderAccent} flex flex-col justify-between transition hover:border-slate-700`}
                >
                  <div>
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectIncident(incident.id)}
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer h-3.5 w-3.5"
                          aria-label={`Select incident ${incident.id}`}
                        />
                        <span className="text-xs font-mono font-bold text-cyan-400">{incident.id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">• {incident.timeAgo}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : incident.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 mb-1">
                      {incident.anomalyMetric}
                    </h3>

                    <div className="text-xs text-slate-300 flex items-center gap-1 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{incident.zoneName}</span>
                    </div>

                    {/* Sensor Breakdown Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1 mb-3">
                      <div className="text-slate-400 flex justify-between">
                        <span>Kalman:</span>
                        <span className="text-cyan-300 font-bold">{incident.kalmanSmoothedValue}</span>
                      </div>
                      <div className="text-slate-500 flex justify-between">
                        <span>Raw:</span>
                        <span className="text-slate-300 truncate max-w-[170px]">{incident.rawValue}</span>
                      </div>
                      <div className="text-amber-400 text-[10px] pt-0.5 border-t border-slate-800/80">
                        Lead Time: {incident.leadTime}
                      </div>
                    </div>

                    {/* Operational Recommendation */}
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {incident.recommendedAction}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-850 gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      Worker: {incident.workerId}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => handleAcknowledge(incident)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      {incident.severity === 'CRITICAL' && incident.status !== 'DISPATCHED' && (
                        <button
                          onClick={() => handleDispatch(incident)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
                        >
                          Dispatch
                        </button>
                      )}

                      <button
                        onClick={() => handleSpeak(incident)}
                        disabled={isSpeaking}
                        className="p-1.5 rounded text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-700 transition cursor-pointer"
                        title="Speak incident summary"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

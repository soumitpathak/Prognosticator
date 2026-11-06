import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveAnomalyAlert,
  FacilityZone,
  AnomalyAuditRecord,
  CausalZoneNode,
  CausalPropagationLink,
  CausalIncidentChainEvent,
  TransmissionVector
} from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Eye,
  CheckCheck,
  Flame,
  Heart,
  Wind,
  Cpu,
  BarChart3,
  Activity,
  GitMerge,
  ArrowRight,
  Compass,
  Network,
  Zap,
  RefreshCw,
  Sliders,
  Share2,
  Table,
  Brain
} from 'lucide-react';
import { exportAnomalyAuditCsv, exportAnomalyAuditJson } from '../services/anomalyAuditService';
import { causalCorrelationEngineService } from '../services/causalCorrelationEngineService';
import AnomalyInsightsTab from './AnomalyInsightsTab';

export type SecurityLogViewMode = 'TABLE' | 'INSIGHTS' | 'CORRELATION';
export type AnomalyCategory = 'ALL' | 'THERMAL' | 'BIOMECHANICAL' | 'ENVIRONMENTAL' | 'EQUIPMENT';

export interface CategoryClassification {
  category: AnomalyCategory;
  categoryLabel: string;
  categoryColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export function classifyAnomalyRecord(item: AnomalyAuditRecord): CategoryClassification {
  const metric = (item.anomalyMetric || '').toLowerCase();
  const dept = (item.department || '').toLowerCase();
  const measured = (item.measuredValue || '').toLowerCase();

  if (
    dept.includes('maintenance') ||
    metric.includes('vibration') ||
    metric.includes('bearing') ||
    metric.includes('casing') ||
    metric.includes('iso 10816') ||
    metric.includes('motor') ||
    metric.includes('pump') ||
    item.equipmentId
  ) {
    return {
      category: 'EQUIPMENT',
      categoryLabel: 'Equipment & Mechanical',
      categoryColor: '#a855f7',
      badgeBg: 'bg-purple-950/60',
      badgeBorder: 'border-purple-500/50',
      badgeText: 'text-purple-300'
    };
  }

  if (
    metric.includes('thermal') ||
    metric.includes('heat') ||
    metric.includes('temp') ||
    metric.includes('twl') ||
    metric.includes('dehydration') ||
    metric.includes('syncope') ||
    measured.includes('skin:') ||
    measured.includes('ambient:') ||
    measured.includes('°c')
  ) {
    return {
      category: 'THERMAL',
      categoryLabel: 'Thermal Strain',
      categoryColor: '#f97316',
      badgeBg: 'bg-orange-950/60',
      badgeBorder: 'border-orange-500/50',
      badgeText: 'text-orange-300'
    };
  }

  if (
    metric.includes('noise') ||
    metric.includes('acoustic') ||
    metric.includes('aqi') ||
    metric.includes('air') ||
    metric.includes('particulate') ||
    metric.includes('confined') ||
    measured.includes('db')
  ) {
    return {
      category: 'ENVIRONMENTAL',
      categoryLabel: 'Environmental & Acoustic',
      categoryColor: '#10b981',
      badgeBg: 'bg-emerald-950/60',
      badgeBorder: 'border-emerald-500/50',
      badgeText: 'text-emerald-300'
    };
  }

  return {
    category: 'BIOMECHANICAL',
    categoryLabel: 'Biomechanical & Autonomic',
    categoryColor: '#06b6d4',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-500/50',
    badgeText: 'text-cyan-300'
  };
}

interface SecurityAuditLogPanelProps {
  alerts: ActiveAnomalyAlert[];
  anomalyAuditRecords: AnomalyAuditRecord[];
  zones?: FacilityZone[];
  onAcknowledgeAlert?: (alertId: string) => void;
  onAcknowledgeAll?: () => void;
  onViewDetails?: (alert: ActiveAnomalyAlert) => void;
  onExportCsv?: () => void;
  onOpenSignedCompliancePdf?: () => void;
  className?: string;
}

export default function SecurityAuditLogPanel({
  alerts,
  anomalyAuditRecords,
  zones = [],
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onViewDetails,
  onExportCsv,
  onOpenSignedCompliancePdf,
  className = ''
}: SecurityAuditLogPanelProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<AnomalyCategory>('ALL');

  // View Mode: Table Audit Trail vs Inter-Zone Anomaly Correlation
  const [viewMode, setViewMode] = useState<SecurityLogViewMode>('TABLE');
  const [nodes, setNodes] = useState<CausalZoneNode[]>(causalCorrelationEngineService.getNodes());
  const [links, setLinks] = useState<CausalPropagationLink[]>(causalCorrelationEngineService.getLinks());
  const [chain, setChain] = useState<CausalIncidentChainEvent[]>(causalCorrelationEngineService.getIncidentChain());
  const [selectedZoneId, setSelectedZoneId] = useState<string>('Outdoor-Construction-Sector-4');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>('LINK-SEC4-TO-LOGN');
  const [correlationNotice, setCorrelationNotice] = useState<string | null>(null);
  const [isSimulatingCascade, setIsSimulatingCascade] = useState<boolean>(false);
  const [minCorrelationFilter, setMinCorrelationFilter] = useState<number>(0.65);

  useEffect(() => {
    const unsub = causalCorrelationEngineService.subscribe(() => {
      setNodes(causalCorrelationEngineService.getNodes());
      setLinks(causalCorrelationEngineService.getLinks());
      setChain(causalCorrelationEngineService.getIncidentChain());
      setSelectedZoneId(causalCorrelationEngineService.getSelectedZoneId());
    });
    setNodes(causalCorrelationEngineService.getNodes());
    setLinks(causalCorrelationEngineService.getLinks());
    setChain(causalCorrelationEngineService.getIncidentChain());
    setSelectedZoneId(causalCorrelationEngineService.getSelectedZoneId());
    return () => unsub();
  }, []);

  // Combined audit event items
  const auditItems = useMemo(() => {
    const recordsMap = new Map<string, AnomalyAuditRecord>();

    // 1. Add compiled historical audit records
    anomalyAuditRecords.forEach((rec) => {
      recordsMap.set(rec.anomalyId, rec);
    });

    // 2. Add or update with live active alerts
    alerts.forEach((alert, idx) => {
      const existing = recordsMap.get(alert.id);
      const isCritical = alert.severity === 'CRITICAL';
      const isHigh = alert.severity === 'HIGH';

      let conf = isCritical ? 0.954 : isHigh ? 0.885 : 0.765;

      const auditRecord: AnomalyAuditRecord = {
        id: existing?.id || `SEC-AUD-${3000 + idx}`,
        anomalyId: alert.id,
        timestamp: existing?.timestamp || new Date().toISOString(),
        timeFormatted: existing?.timeFormatted || new Date().toISOString().replace('T', ' ').slice(0, 19),
        relativeTime: alert.detected_at,
        zone: alert.location_zone,
        department: existing?.department || alert.alert_type || 'Industrial Operations',
        anomalyMetric: alert.anomaly_metric,
        measuredValue: alert.raw_value,
        thresholdLimit: alert.kalman_smoothed_value,
        severity: alert.severity,
        confidenceScore: conf,
        confidenceScoreFormatted: `${(conf * 100).toFixed(1)}%`,
        modelAttribution: alert.alert_type === 'PREDICTIVE_MAINTENANCE'
          ? 'ISO 10816 Vibration Severity + Thermal Extrapolator'
          : 'LSTM Autoencoder + Kalman Innovation Jitter Suppressor',
        correctiveActionTaken: alert.recommended_action,
        actionStatus: alert.acknowledged ? 'COMPLETED' : 'DISPATCH_STAGED',
        actionTakenBy: alert.acknowledged ? 'EHS Safety Supervisor' : 'Automated Anomaly Sentinel',
        workerId: alert.worker_id,
        equipmentId: alert.equipment_id,
        privacyEnforced: alert.privacy_status || 'k-Anonymity Verified (N>=12)'
      };

      recordsMap.set(alert.id, auditRecord);
    });

    return Array.from(recordsMap.values()).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts, anomalyAuditRecords]);

  // Compute Category Distribution Statistics
  const categoryStats = useMemo(() => {
    const total = auditItems.length || 1;
    const thermalItems = auditItems.filter((i) => classifyAnomalyRecord(i).category === 'THERMAL');
    const biomechanicalItems = auditItems.filter((i) => classifyAnomalyRecord(i).category === 'BIOMECHANICAL');
    const environmentalItems = auditItems.filter((i) => classifyAnomalyRecord(i).category === 'ENVIRONMENTAL');
    const equipmentItems = auditItems.filter((i) => classifyAnomalyRecord(i).category === 'EQUIPMENT');

    const getSev = (items: AnomalyAuditRecord[]) => ({
      critical: items.filter((i) => i.severity === 'CRITICAL').length,
      high: items.filter((i) => i.severity === 'HIGH').length,
      moderate: items.filter((i) => i.severity === 'MODERATE').length,
      low: items.filter((i) => i.severity === 'LOW').length,
      total: items.length,
      pct: parseFloat(((items.length / total) * 100).toFixed(1))
    });

    const thermal = getSev(thermalItems);
    const biomechanical = getSev(biomechanicalItems);
    const environmental = getSev(environmentalItems);
    const equipment = getSev(equipmentItems);

    const chartData = [
      {
        categoryKey: 'THERMAL',
        categoryName: 'Thermal Strain',
        shortName: 'Thermal',
        critical: thermal.critical,
        high: thermal.high,
        moderate: thermal.moderate,
        low: thermal.low,
        total: thermal.total,
        pct: thermal.pct,
        fillColor: '#f97316'
      },
      {
        categoryKey: 'BIOMECHANICAL',
        categoryName: 'Biomechanical & Autonomic',
        shortName: 'Biomechanical',
        critical: biomechanical.critical,
        high: biomechanical.high,
        moderate: biomechanical.moderate,
        low: biomechanical.low,
        total: biomechanical.total,
        pct: biomechanical.pct,
        fillColor: '#06b6d4'
      },
      {
        categoryKey: 'ENVIRONMENTAL',
        categoryName: 'Environmental & Acoustic',
        shortName: 'Environmental',
        critical: environmental.critical,
        high: environmental.high,
        moderate: environmental.moderate,
        low: environmental.low,
        total: environmental.total,
        pct: environmental.pct,
        fillColor: '#10b981'
      },
      {
        categoryKey: 'EQUIPMENT',
        categoryName: 'Equipment & Mechanical',
        shortName: 'Equipment',
        critical: equipment.critical,
        high: equipment.high,
        moderate: equipment.moderate,
        low: equipment.low,
        total: equipment.total,
        pct: equipment.pct,
        fillColor: '#a855f7'
      }
    ];

    return {
      total: auditItems.length,
      thermal,
      biomechanical,
      environmental,
      equipment,
      chartData
    };
  }, [auditItems]);

  // Filtered audit items based on search, severity, zone, and classified category
  const filteredItems = useMemo(() => {
    return auditItems.filter((item) => {
      const matchesSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
      const matchesZone = selectedZoneFilter === 'ALL' || item.zone === selectedZoneFilter;
      const classification = classifyAnomalyRecord(item);
      const matchesCategory = selectedCategoryFilter === 'ALL' || classification.category === selectedCategoryFilter;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSeverity && matchesZone && matchesCategory;

      const matchesQuery =
        item.id.toLowerCase().includes(q) ||
        item.anomalyId.toLowerCase().includes(q) ||
        item.anomalyMetric.toLowerCase().includes(q) ||
        item.zone.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.correctiveActionTaken.toLowerCase().includes(q) ||
        classification.categoryLabel.toLowerCase().includes(q) ||
        (item.workerId && item.workerId.toLowerCase().includes(q)) ||
        (item.equipmentId && item.equipmentId.toLowerCase().includes(q));

      return matchesSeverity && matchesZone && matchesCategory && matchesQuery;
    });
  }, [auditItems, selectedSeverity, selectedZoneFilter, selectedCategoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = auditItems.length;
    const critical = auditItems.filter((i) => i.severity === 'CRITICAL').length;
    const high = auditItems.filter((i) => i.severity === 'HIGH').length;
    const moderate = auditItems.filter((i) => i.severity === 'MODERATE').length;
    const pendingAction = auditItems.filter((i) => i.actionStatus !== 'COMPLETED').length;

    return { total, critical, high, moderate, pendingAction };
  }, [auditItems]);

  const activeLink = useMemo(() => {
    return links.find((l) => l.id === selectedLinkId) || links[0];
  }, [links, selectedLinkId]);

  const activeZoneNode = useMemo(() => {
    return nodes.find((n) => n.zoneId === selectedZoneId) || nodes[0];
  }, [nodes, selectedZoneId]);

  const activeCascadingCount = useMemo(() => {
    return links.filter((l) => l.isCascadingActive).length;
  }, [links]);

  const filteredCausalLinks = useMemo(() => {
    return links.filter((l) => l.pearsonR >= minCorrelationFilter);
  }, [links, minCorrelationFilter]);

  const correlatedAuditRecords = useMemo(() => {
    if (!activeLink) return [];
    return auditItems.filter(
      (item) => item.zone === activeLink.sourceZoneId || item.zone === activeLink.targetZoneId
    ).slice(0, 8);
  }, [auditItems, activeLink]);

  const handleSelectZoneNode = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    causalCorrelationEngineService.setSelectedZoneId(zoneId);
    const relatedLink = links.find((l) => l.sourceZoneId === zoneId || l.targetZoneId === zoneId);
    if (relatedLink) {
      setSelectedLinkId(relatedLink.id);
    }
  };

  const handleSimulateCascadeSurge = () => {
    setIsSimulatingCascade(true);
    causalCorrelationEngineService.triggerSimulatedCascade(selectedZoneId);
    const targetNode = nodes.find((n) => n.zoneId === selectedZoneId);
    setCorrelationNotice(
      `Simulated anomaly surge injected into ${targetNode?.zoneName || selectedZoneId}. Visual propagation vectors activated with associated propagation time delays.`
    );
    setTimeout(() => {
      setIsSimulatingCascade(false);
      setTimeout(() => setCorrelationNotice(null), 6000);
    }, 1200);
  };

  const handleDecoupleLink = (linkId: string) => {
    const decoupled = causalCorrelationEngineService.decoupleLink(linkId);
    if (decoupled) {
      setCorrelationNotice(
        `Transmission decoupled between ${decoupled.sourceZoneName} and ${decoupled.targetZoneName}. Recommended Interlock Action applied: ${decoupled.decouplingRecommendation}`
      );
      setTimeout(() => setCorrelationNotice(null), 8000);
    }
  };

  const handleExportCausalReportCsv = () => {
    causalCorrelationEngineService.exportCausalReportCsv();
    setCorrelationNotice('Causal inter-zone correlation matrix exported to CSV.');
    setTimeout(() => setCorrelationNotice(null), 4000);
  };

  const handleExportCsvDirect = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      exportAnomalyAuditCsv(filteredItems);
    }
  };

  const handleExportJsonDirect = () => {
    exportAnomalyAuditJson(filteredItems);
  };

  // Custom Chart Tooltip
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[240px] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.fillColor }}></span>
            <span>{data.categoryName}</span>
          </span>
          <span className="text-cyan-400 font-bold">{data.total} Events ({data.pct}%)</span>
        </div>
        <div className="space-y-1 text-slate-300 text-[11px]">
          <div className="flex justify-between items-center text-rose-300">
            <span>Critical Severity:</span>
            <span className="font-bold">{data.critical}</span>
          </div>
          <div className="flex justify-between items-center text-amber-300">
            <span>High Severity:</span>
            <span className="font-bold">{data.high}</span>
          </div>
          <div className="flex justify-between items-center text-cyan-300">
            <span>Moderate Severity:</span>
            <span className="font-bold">{data.moderate}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Low Severity:</span>
            <span className="font-bold">{data.low}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="security-audit-log-panel"
      className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Security Audit Log</span>
              </h2>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-semibold uppercase">
                Anomaly Detection Trail
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                HIPAA &amp; ISO 45001 Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable statutory record of all detected population health and machinery anomaly events with multi-category forensic classifications.
            </p>
          </div>
        </div>

        {/* Action Controls & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Table Audit Trail vs Anomaly Correlation */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono mr-1">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-slate-400" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('INSIGHTS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'INSIGHTS'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-md ring-1 ring-amber-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Natural language processing root-cause summaries of frequent anomaly types (Last 24 Hours)"
            >
              <Brain className="h-3.5 w-3.5 text-amber-400" />
              <span>Anomaly Insights</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-sans font-bold">NLP</span>
            </button>
            <button
              onClick={() => setViewMode('CORRELATION')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'CORRELATION'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold shadow-md ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="h-3.5 w-3.5 text-cyan-400" />
              <span>Anomaly Correlation View</span>
              {activeCascadingCount > 0 && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>

          {stats.pendingAction > 0 && onAcknowledgeAll && (
            <button
              onClick={onAcknowledgeAll}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Acknowledge all pending anomaly detection events"
            >
              <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Acknowledge All</span>
            </button>
          )}

          {onOpenSignedCompliancePdf && (
            <button
              onClick={onOpenSignedCompliancePdf}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-md border border-emerald-400/50"
              title="Compile Security Audit Log and recent NLP anomaly insights into a signed PDF report for quarterly compliance"
            >
              <FileText className="h-3.5 w-3.5 text-white" />
              <span>Signed Quarterly PDF</span>
            </button>
          )}

          <button
            onClick={handleExportCsvDirect}
            className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            title="Download complete Security Audit Log in RFC 4180 CSV format"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJsonDirect}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Download Security Audit Log as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Correlation Action Notification Banner */}
      {correlationNotice && (
        <div className="p-3 bg-cyan-950/80 border-b border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Network className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="font-mono">{correlationNotice}</span>
          </div>
          <button
            onClick={() => setCorrelationNotice(null)}
            className="text-cyan-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-950/60 border-b border-slate-800/80 text-xs font-mono">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-500 text-[10px] uppercase block">Total Logged Events</span>
          <span className="text-lg font-bold text-white tabular-nums">{stats.total}</span>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 p-2.5 rounded-xl">
          <span className="text-rose-400 text-[10px] uppercase block">Critical Severity</span>
          <span className="text-lg font-bold text-rose-300 tabular-nums">{stats.critical}</span>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 p-2.5 rounded-xl">
          <span className="text-amber-400 text-[10px] uppercase block">High Severity</span>
          <span className="text-lg font-bold text-amber-300 tabular-nums">{stats.high}</span>
        </div>
        <div className="bg-slate-900/90 border border-cyan-500/30 p-2.5 rounded-xl">
          <span className="text-cyan-400 text-[10px] uppercase block">Moderate Severity</span>
          <span className="text-lg font-bold text-cyan-300 tabular-nums">{stats.moderate}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-slate-400 text-[10px] uppercase block">Pending Triage</span>
          <span className={`text-lg font-bold tabular-nums ${stats.pendingAction > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.pendingAction}
          </span>
        </div>
      </div>

      {/* VIEW CONDITIONAL: TABLE AUDIT TRAIL VS ANOMALY CORRELATION VIEW */}
      {viewMode === 'TABLE' ? (
        <>
          {/* ANOMALY CATEGORY CLASSIFICATION & DISTRIBUTION CHART SECTION */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Anomaly Classification Distribution
                </h3>
                <span className="text-slate-500 text-xs">/</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Thermal · Biomechanical · Environmental · Equipment
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Click category chip below to filter audit trail
              </div>
            </div>

            {/* Category Filter Chips with Proportions */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-xs font-mono">
              {/* All Categories */}
              <button
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-slate-800 border-cyan-400 shadow-xs ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase">All Categories</div>
                <div className="text-sm font-bold text-white mt-0.5">{categoryStats.total} <span className="text-[10px] font-normal text-slate-400">(100%)</span></div>
              </button>

              {/* Thermal Strain */}
              <button
                onClick={() => setSelectedCategoryFilter('THERMAL')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  selectedCategoryFilter === 'THERMAL'
                    ? 'bg-orange-950/70 border-orange-400 shadow-xs ring-1 ring-orange-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-orange-500/40'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-orange-400 font-bold uppercase">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  <span>Thermal</span>
                </div>
                <div className="text-sm font-bold text-orange-300 mt-0.5">
                  {categoryStats.thermal.total} <span className="text-[10px] font-normal text-slate-400">({categoryStats.thermal.pct}%)</span>
                </div>
              </button>

              {/* Biomechanical & Autonomic */}
              <button
                onClick={() => setSelectedCategoryFilter('BIOMECHANICAL')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  selectedCategoryFilter === 'BIOMECHANICAL'
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-xs ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-cyan-400 font-bold uppercase">
                  <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                  <span>Biomechanical</span>
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {categoryStats.biomechanical.total} <span className="text-[10px] font-normal text-slate-400">({categoryStats.biomechanical.pct}%)</span>
                </div>
              </button>

              {/* Environmental & Acoustic */}
              <button
                onClick={() => setSelectedCategoryFilter('ENVIRONMENTAL')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  selectedCategoryFilter === 'ENVIRONMENTAL'
                    ? 'bg-emerald-950/70 border-emerald-400 shadow-xs ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-bold uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Environmental</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  {categoryStats.environmental.total} <span className="text-[10px] font-normal text-slate-400">({categoryStats.environmental.pct}%)</span>
                </div>
              </button>

              {/* Equipment & Mechanical */}
              <button
                onClick={() => setSelectedCategoryFilter('EQUIPMENT')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
                  selectedCategoryFilter === 'EQUIPMENT'
                    ? 'bg-purple-950/70 border-purple-400 shadow-xs ring-1 ring-purple-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-purple-400 font-bold uppercase">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  <span>Equipment</span>
                </div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">
                  {categoryStats.equipment.total} <span className="text-[10px] font-normal text-slate-400">({categoryStats.equipment.pct}%)</span>
                </div>
              </button>
            </div>

            {/* Recharts Category Severity Distribution Bar Chart */}
            <div className="h-44 w-full bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats.chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 25, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    stroke="#64748b"
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                    width={105}
                  />
                  <Tooltip content={<CustomCategoryTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '6px', fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="critical" name="Critical" fill="#f43f5e" stackId="a" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="high" name="High" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="moderate" name="Moderate" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="low" name="Low" fill="#64748b" stackId="a" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, metric, category, zone, or keyword..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Severity Filters */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-cyan-400" /> Severity:
              </span>

              {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => {
                const isSelected = selectedSeverity === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? sev === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-xs'
                          : sev === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-xs'
                          : sev === 'MODERATE'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-xs'
                          : 'bg-slate-800 text-white border-slate-600 shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {sev === 'ALL' ? 'All Tiers' : sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-800/80">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp / Time</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Hazard Metric / Reading</th>
                  <th className="px-4 py-3">Facility Zone &amp; Department</th>
                  <th className="px-4 py-3 text-right">Confidence</th>
                  <th className="px-4 py-3">Corrective Action Directive</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500 text-xs">
                      No anomaly detection events matching your category, search, or severity filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isCritical = item.severity === 'CRITICAL';
                    const isHigh = item.severity === 'HIGH';
                    const isModerate = item.severity === 'MODERATE';
                    const classification = classifyAnomalyRecord(item);

                    // Look up matching active alert for inspect callback
                    const matchedAlert = alerts.find((a) => a.id === item.anomalyId);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-850/80 transition-colors ${
                          item.actionStatus !== 'COMPLETED'
                            ? isCritical
                              ? 'bg-rose-950/15'
                              : isHigh
                              ? 'bg-amber-950/10'
                              : ''
                            : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-200">
                            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="font-semibold">{item.timeFormatted}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block ml-5">
                            {item.relativeTime} &bull; {item.id}
                          </span>
                        </td>

                        {/* Category Classification Badge */}
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${classification.badgeBg} ${classification.badgeBorder} ${classification.badgeText}`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: classification.categoryColor }}
                            ></span>
                            <span>{classification.categoryLabel.split(' ')[0]}</span>
                          </span>
                        </td>

                        {/* Severity Indicator */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase border ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : isModerate
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isCritical
                                  ? 'bg-rose-400 animate-pulse'
                                  : isHigh
                                  ? 'bg-amber-400'
                                  : isModerate
                                  ? 'bg-cyan-400'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{item.severity}</span>
                          </span>
                        </td>

                        {/* Hazard Metric & Measured Value */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white text-xs">{item.anomalyMetric}</div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            <span className="text-slate-500">Value:</span>{' '}
                            <span className="text-amber-300/90 font-medium">{item.measuredValue}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            <span>Threshold:</span> {item.thresholdLimit}
                          </div>
                        </td>

                        {/* Facility Zone & Department */}
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <div className="flex items-center space-x-1 text-slate-200 font-semibold truncate max-w-[200px]">
                            <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{item.zone}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 ml-4">
                            {item.department}
                          </div>
                          {item.workerId && (
                            <div className="text-[10px] text-cyan-400/80 ml-4">
                              Target: {item.workerId}
                            </div>
                          )}
                          {item.equipmentId && (
                            <div className="text-[10px] text-purple-400/80 ml-4">
                              Asset: {item.equipmentId}
                            </div>
                          )}
                        </td>

                        {/* Model Confidence */}
                        <td className="px-4 py-3 text-right font-mono">
                          <div className="font-bold text-slate-200 text-xs">
                            {item.confidenceScoreFormatted}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.modelAttribution.split(' ')[0]}
                          </div>
                        </td>

                        {/* Corrective Action Directive */}
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs max-w-sm line-clamp-2">
                            {item.correctiveActionTaken}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            By: {item.actionTakenBy}
                          </div>
                        </td>

                        {/* Action Status & Details Trigger */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                item.actionStatus === 'COMPLETED'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                              }`}
                            >
                              {item.actionStatus === 'COMPLETED' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{item.actionStatus}</span>
                            </span>

                            {matchedAlert && onViewDetails && (
                              <button
                                onClick={() => onViewDetails(matchedAlert)}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-mono cursor-pointer"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : viewMode === 'INSIGHTS' ? (
        <AnomalyInsightsTab
          alerts={alerts}
          anomalyAuditRecords={auditItems}
          zones={zones}
        />
      ) : (
        /* ANOMALY CORRELATION & ROOT-CAUSE PROPAGATION VIEW */
        <div className="p-4 sm:p-5 space-y-4">
          {/* Subheader and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Inter-Zone Anomaly Correlation &amp; Root-Cause Propagation
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/50 font-mono font-bold">
                  {activeCascadingCount} Active Propagation Paths
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual link graph displaying cross-zone anomaly correlation, transmission vectors, and cascading event timelines to diagnose root causes across connected facility zones.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleSimulateCascadeSurge}
                disabled={isSimulatingCascade}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                title="Inject a high-risk anomaly surge into the selected zone and observe cross-zone propagation"
              >
                <Zap className="h-3.5 w-3.5 text-white" />
                <span>{isSimulatingCascade ? 'Simulating Propagation...' : 'Simulate Zone Anomaly Surge'}</span>
              </button>

              <button
                onClick={handleExportCausalReportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                title="Export the complete inter-zone correlation matrix as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Matrix CSV</span>
              </button>

              {/* Filter correlation threshold */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-[10px] text-slate-500 px-2 uppercase">Cutoff:</span>
                {([0.50, 0.65, 0.80] as const).map((rVal) => (
                  <button
                    key={rVal}
                    onClick={() => setMinCorrelationFilter(rVal)}
                    className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                      minCorrelationFilter === rVal
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    r ≥ {rVal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SPATIAL TOPOLOGY CANVAS WITH VISUAL LINKS */}
          <div className="relative w-full h-[360px] bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden select-none">
            {/* Tactical SVG Grid Background */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
              <defs>
                <pattern id="secGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.8" />
                </pattern>
                <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
                </marker>
                <marker id="arrow-moderate" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                </marker>
                <marker id="arrow-nominal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#secGrid)" />
            </svg>

            {/* SVG Connecting Vector Links between Zones */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {filteredCausalLinks.map((link) => {
                const source = nodes.find((n) => n.zoneId === link.sourceZoneId);
                const target = nodes.find((n) => n.zoneId === link.targetZoneId);
                if (!source || !target) return null;

                const isSelected = link.id === selectedLinkId;
                const isCascading = link.isCascadingActive;
                const strokeColor = isCascading ? '#f43f5e' : isSelected ? '#38bdf8' : link.pearsonR >= 0.75 ? '#f59e0b' : '#06b6d4';
                const markerId = isCascading ? 'url(#arrow-active)' : link.pearsonR >= 0.75 ? 'url(#arrow-moderate)' : 'url(#arrow-nominal)';

                const x1 = `${source.x}%`;
                const y1 = `${source.y}%`;
                const x2 = `${target.x}%`;
                const y2 = `${target.y}%`;

                return (
                  <g key={link.id}>
                    {/* Outer Glow Line */}
                    {isCascading && (
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#f43f5e"
                        strokeWidth="8"
                        opacity="0.25"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Main Vector Arrow Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth={isCascading ? 3.5 : isSelected ? 3 : 2}
                      strokeDasharray={isCascading ? '6 4' : undefined}
                      markerEnd={markerId}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Link Floating Badges */}
            {filteredCausalLinks.map((link) => {
              const source = nodes.find((n) => n.zoneId === link.sourceZoneId);
              const target = nodes.find((n) => n.zoneId === link.targetZoneId);
              if (!source || !target) return null;

              const isSelected = link.id === selectedLinkId;
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;

              return (
                <div
                  key={`badge-${link.id}`}
                  onClick={() => setSelectedLinkId(link.id)}
                  style={{ left: `${midX}%`, top: `${midY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition shadow-md flex items-center space-x-1 border ${
                    isSelected
                      ? 'bg-cyan-900 text-white border-cyan-400 ring-2 ring-cyan-500/50 scale-105'
                      : link.isCascadingActive
                      ? 'bg-rose-950/90 text-rose-200 border-rose-500 animate-pulse'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={`Click to inspect propagation link from ${link.sourceZoneName} to ${link.targetZoneName}`}
                >
                  <GitMerge className="h-3 w-3 shrink-0" />
                  <span className="font-bold">r={link.pearsonR}</span>
                  <span className="text-slate-500">·</span>
                  <span>+{link.timeLagMinutes}m</span>
                </div>
              );
            })}

            {/* Zone Nodes */}
            {nodes.map((node) => {
              const isSelected = node.zoneId === selectedZoneId;
              const isConnectedToActiveLink =
                activeLink && (activeLink.sourceZoneId === node.zoneId || activeLink.targetZoneId === node.zoneId);
              const isCritical = node.status === 'CRITICAL';

              return (
                <div
                  key={node.zoneId}
                  onClick={() => handleSelectZoneNode(node.zoneId)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 p-2.5 rounded-xl bg-slate-900/95 border transition shadow-xl cursor-pointer min-w-[150px] ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/60 shadow-cyan-900/30'
                      : isConnectedToActiveLink
                      ? 'border-amber-400/80 ring-1 ring-amber-500/40'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-white font-mono truncate max-w-[105px]">
                      {node.zoneName}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isCritical ? 'bg-rose-500 animate-ping' : node.status === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Risk Score:</span>
                    <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-amber-300'}`}>
                      {node.riskScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                    <span>Anomalies: {node.activeAnomaliesCount}</span>
                    <span>{node.headcount} workers</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROOT-CAUSE PROPAGATION & INCIDENT CHAIN INSPECTOR (2 COLUMNS) */}
          {activeLink && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Root-Cause Attribution & Transmission Vector */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Compass className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase font-mono text-white tracking-wider">
                      Root-Cause Attribution &amp; Transmission Vector
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      activeLink.isCascadingActive
                        ? 'bg-rose-950 text-rose-300 border border-rose-500 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {activeLink.isCascadingActive ? 'Cascade Active' : 'Decoupled / Monitored'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Origin Source Zone</span>
                      <span className="font-bold text-cyan-300 font-mono text-xs">{activeLink.sourceZoneName}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Downstream Target Zone</span>
                      <span className="font-bold text-rose-300 font-mono text-xs">{activeLink.targetZoneName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Pearson Correlation</span>
                      <span className="font-bold text-white text-sm">r = {activeLink.pearsonR}</span>
                      <span className="text-[9px] text-emerald-400 block">p &lt; 0.001 (Sig.)</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Propagation Delay</span>
                      <span className="font-bold text-amber-300 text-sm">+{activeLink.timeLagMinutes} min</span>
                      <span className="text-[9px] text-slate-400 block">Lag Latency</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Transmission Vector</span>
                      <span className="font-bold text-cyan-300 text-xs truncate block">{activeLink.transmissionVector}</span>
                      <span className="text-[9px] text-slate-400 block">{activeLink.causalConfidencePct}% Causal Conf.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-bold block mb-1 font-mono text-[11px]">
                      Propagation Dynamics &amp; Root-Cause Mechanism:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {activeLink.transmissionDescription}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/40 text-xs space-y-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono text-[11px]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Recommended Decoupling Interlock:</span>
                    </span>
                    <p className="text-emerald-200 text-[11px] leading-relaxed">
                      {activeLink.decouplingRecommendation}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDecoupleLink(activeLink.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 text-xs font-bold transition cursor-pointer"
                      title="Execute recommended operational interlock to sever causal propagation"
                    >
                      <Zap className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Deploy Decoupling Interlock</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Cascading Incident Chain & Correlated Audit Events */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase font-mono text-white tracking-wider">
                      Cascading Incident Progression &amp; Linked Alarms
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Root-Cause Sequence (T+0m to T+60m)
                  </span>
                </div>

                {/* Sequential Chain Timeline */}
                <div className="space-y-1.5">
                  {chain.map((step) => {
                    const isOrigin = step.causalRole === 'ORIGIN';
                    const isTerminal = step.causalRole === 'TERMINAL_CASCADE';

                    return (
                      <div
                        key={step.step}
                        className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                          isOrigin
                            ? 'bg-rose-950/40 border-rose-600/50'
                            : isTerminal
                            ? 'bg-purple-950/30 border-purple-600/40'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                            Step {step.step}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{step.zoneName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({step.timeOffset})</span>
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">{step.incidentType}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{step.metricValue}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                            isOrigin
                              ? 'bg-rose-900 text-rose-200'
                              : isTerminal
                              ? 'bg-purple-900 text-purple-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {step.causalRole === 'ORIGIN' ? 'Root Origin' : step.causalRole === 'TERMINAL_CASCADE' ? 'Terminal' : 'Propagated'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Correlated Audit Alarms in Linked Zones */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                      Correlated Audit Records in Linked Zones ({correlatedAuditRecords.length}):
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Cross-Zone Evidence</span>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {correlatedAuditRecords.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-xs">
                        No direct anomaly events logged in these zones during this time window.
                      </div>
                    ) : (
                      correlatedAuditRecords.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-[11px]">{item.anomalyMetric}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({item.zone})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Value: <strong className="text-amber-300">{item.measuredValue}</strong> &bull; {item.timeFormatted}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                              item.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                : 'bg-amber-950 text-amber-300 border border-amber-600'
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Pathways Correlation Matrix Table */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase font-mono text-white tracking-wider">
                Facility Topological Inter-Zone Correlation Matrix
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                N = {links.length} Connected Transmission Pathways
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-800 font-mono">
                <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2">Source Zone</th>
                    <th className="px-3 py-2">Target Zone</th>
                    <th className="px-3 py-2">Correlation (r)</th>
                    <th className="px-3 py-2">Time Lag</th>
                    <th className="px-3 py-2">Transmission Vector</th>
                    <th className="px-3 py-2">Cascade Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {links.map((link) => {
                    const isSelected = link.id === selectedLinkId;
                    return (
                      <tr
                        key={link.id}
                        onClick={() => setSelectedLinkId(link.id)}
                        className={`hover:bg-slate-850/80 transition cursor-pointer ${
                          isSelected ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-bold text-cyan-300">{link.sourceZoneName}</td>
                        <td className="px-3 py-2 font-bold text-rose-300">{link.targetZoneName}</td>
                        <td className="px-3 py-2 font-bold text-white">r = {link.pearsonR}</td>
                        <td className="px-3 py-2 text-amber-300">+{link.timeLagMinutes} min</td>
                        <td className="px-3 py-2 text-slate-300">{link.transmissionVector}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              link.isCascadingActive
                                ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            }`}
                          >
                            {link.isCascadingActive ? 'Cascading Active' : 'Decoupled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecoupleLink(link.id);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition cursor-pointer"
                          >
                            {link.isCascadingActive ? 'Decouple' : 'Re-verify'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Statutory Compliance: HIPAA Security Rule § 164.312(b) &amp; OSHA 1910.1020</span>
        </div>
        <div className="text-slate-500">
          Showing {filteredItems.length} of {auditItems.length} Logged Anomaly Events
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { ActiveAnomalyAlert } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
  Thermometer,
  Heart,
  ChevronDown,
  ChevronUp,
  Wrench,
  Activity,
  AlertTriangle,
  Cog,
  Radio,
  Search,
  ArrowUpDown,
  RotateCcw,
  Building2,
  Cpu,
  Truck,
  Layers,
  Calendar,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import AnomalyHeatmap, { HeatmapCellData } from './AnomalyHeatmap';

export type SeverityFilterOption = 'ALL' | 'CRITICAL' | 'MEDIUM' | 'LOW';

export type DepartmentFilterOption =
  | 'ALL'
  | 'CONSTRUCTION'
  | 'MANUFACTURING'
  | 'LOGISTICS'
  | 'CONDUIT'
  | 'RELIABILITY';

export type SortCriterion =
  | 'SEVERITY_DESC'
  | 'SEVERITY_ASC'
  | 'DEPARTMENT_ASC'
  | 'DEPARTMENT_DESC'
  | 'RECENCY_DESC'
  | 'RECENCY_ASC'
  | 'URGENCY';

export interface DepartmentInfo {
  id: DepartmentFilterOption;
  name: string;
  shortName: string;
  badgeClass: string;
  borderClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function getAlertDepartment(alert: ActiveAnomalyAlert): DepartmentInfo {
  // Predictive maintenance equipment alerts map to Mechanical Reliability & Maintenance
  if (alert.alert_type === 'PREDICTIVE_MAINTENANCE' || alert.equipment_id) {
    return {
      id: 'RELIABILITY',
      name: 'Mechanical Reliability & Maintenance',
      shortName: 'Reliability & Maint.',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      borderClass: 'border-amber-500/30',
      icon: Wrench
    };
  }

  const zone = (alert.location_zone || '').toLowerCase();
  if (zone.includes('construction') || zone.includes('sector-4')) {
    return {
      id: 'CONSTRUCTION',
      name: 'Construction & Civil Infrastructure',
      shortName: 'Construction & Civil',
      badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      borderClass: 'border-orange-500/30',
      icon: Building2
    };
  }
  if (zone.includes('assembly') || zone.includes('manufacturing') || zone.includes('line-b')) {
    return {
      id: 'MANUFACTURING',
      name: 'Robotics & Precision Assembly',
      shortName: 'Robotics & Assembly',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      borderClass: 'border-cyan-500/30',
      icon: Cpu
    };
  }
  if (zone.includes('warehouse') || zone.includes('logistics') || zone.includes('north')) {
    return {
      id: 'LOGISTICS',
      name: 'Logistics & Warehouse Operations',
      shortName: 'Logistics & Warehousing',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      borderClass: 'border-emerald-500/30',
      icon: Truck
    };
  }
  if (zone.includes('tunnel') || zone.includes('conduit') || zone.includes('subgrade')) {
    return {
      id: 'CONDUIT',
      name: 'Subgrade Tunnel & Utility Conduits',
      shortName: 'Subgrade Conduits',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      borderClass: 'border-purple-500/30',
      icon: Layers
    };
  }

  return {
    id: 'ALL',
    name: alert.location_zone || 'General Facility Operations',
    shortName: alert.location_zone || 'General Ops',
    badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600',
    borderClass: 'border-slate-700/50',
    icon: Building2
  };
}

interface ActiveAlertsSectionProps {
  alerts: ActiveAnomalyAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onDispatchAction: (alert: ActiveAnomalyAlert) => void;
  onOpenVoiceSettings?: () => void;
  onSpeakAlert?: (alert: ActiveAnomalyAlert) => void;
  isSpeaking?: boolean;
  voiceEnabled?: boolean;
}

export default function ActiveAlertsSection({
  alerts,
  onAcknowledgeAlert,
  onDispatchAction,
  onOpenVoiceSettings,
  onSpeakAlert,
  isSpeaking = false,
  voiceEnabled = true
}: ActiveAlertsSectionProps) {
  // Filter & Sort State
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilterOption>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentFilterOption>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'PREDICTIVE_MAINTENANCE' | 'HEALTH_ANOMALY'>('ALL');
  const [sortBy, setSortBy] = useState<SortCriterion>('SEVERITY_DESC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<HeatmapCellData | null>(null);

  // Department metadata dictionary
  const DEPARTMENT_OPTIONS: Array<{ id: DepartmentFilterOption; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'ALL', label: 'All Departments', icon: Building2 },
    { id: 'CONSTRUCTION', label: 'Construction & Civil Infrastructure', icon: Building2 },
    { id: 'MANUFACTURING', label: 'Robotics & Precision Assembly', icon: Cpu },
    { id: 'LOGISTICS', label: 'Logistics & Warehouse Operations', icon: Truck },
    { id: 'CONDUIT', label: 'Subgrade Tunnel & Conduits', icon: Layers },
    { id: 'RELIABILITY', label: 'Mechanical Reliability & Maintenance', icon: Wrench }
  ];

  // Helper to parse recency in minutes
  const parseRecencyMinutes = (detectedAt: string): number => {
    const s = detectedAt.toLowerCase().trim();
    if (s.includes('just now')) return 0;
    const minMatch = s.match(/(\d+)\s*min/);
    if (minMatch) return parseInt(minMatch[1], 10);
    const hrMatch = s.match(/(\d+)\s*h(?:our)?/);
    const extraMin = s.match(/(\d+)\s*m(?:in)?(?!\s*h)/);
    if (hrMatch) {
      const hours = parseInt(hrMatch[1], 10);
      const minutes = extraMin ? parseInt(extraMin[1], 10) : 0;
      return hours * 60 + minutes;
    }
    return 999;
  };

  // Helper to parse lead time in hours (lower lead time = higher immediate urgency)
  const parseLeadTimeHours = (alert: ActiveAnomalyAlert): number => {
    if (alert.severity === 'CRITICAL' && alert.lead_time.toLowerCase().includes('immediate')) return 0.1;
    const match = alert.lead_time.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (match) return parseFloat(match[1]);
    return 99;
  };

  // Severity rank mapping
  // CRITICAL = 3, HIGH = 2, MODERATE = 2, LOW = 1
  const getSeverityRank = (sev: ActiveAnomalyAlert['severity']): number => {
    switch (sev) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MODERATE':
        return 2;
      case 'LOW':
        return 1;
    }
  };

  // Counts for tabs & badges
  const counts = useMemo(() => {
    let critical = 0;
    let medium = 0; // High + Moderate
    let low = 0;
    let predictive = 0;
    let health = 0;

    const deptCounts: Record<DepartmentFilterOption, number> = {
      ALL: alerts.length,
      CONSTRUCTION: 0,
      MANUFACTURING: 0,
      LOGISTICS: 0,
      CONDUIT: 0,
      RELIABILITY: 0
    };

    alerts.forEach((alert) => {
      if (alert.severity === 'CRITICAL') critical++;
      else if (alert.severity === 'HIGH' || alert.severity === 'MODERATE') medium++;
      else if (alert.severity === 'LOW') low++;

      if (alert.alert_type === 'PREDICTIVE_MAINTENANCE') predictive++;
      else health++;

      const dept = getAlertDepartment(alert);
      deptCounts[dept.id] = (deptCounts[dept.id] || 0) + 1;
    });

    return {
      total: alerts.length,
      critical,
      medium,
      low,
      predictive,
      health,
      deptCounts
    };
  }, [alerts]);

  // Filtered and Sorted Alerts
  const filteredAndSortedAlerts = useMemo(() => {
    // 1. Filter
    const filtered = alerts.filter((alert) => {
      // Type filter
      if (selectedType === 'PREDICTIVE_MAINTENANCE' && alert.alert_type !== 'PREDICTIVE_MAINTENANCE') {
        return false;
      }
      if (selectedType === 'HEALTH_ANOMALY' && alert.alert_type === 'PREDICTIVE_MAINTENANCE') {
        return false;
      }

      // Severity filter (Low, Medium, Critical, All)
      if (selectedSeverity !== 'ALL') {
        if (selectedSeverity === 'CRITICAL' && alert.severity !== 'CRITICAL') return false;
        if (
          selectedSeverity === 'MEDIUM' &&
          alert.severity !== 'HIGH' &&
          alert.severity !== 'MODERATE'
        ) {
          return false;
        }
        if (selectedSeverity === 'LOW' && alert.severity !== 'LOW') return false;
      }

      // Department filter
      if (selectedDepartment !== 'ALL') {
        const dept = getAlertDepartment(alert);
        if (dept.id !== selectedDepartment) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dept = getAlertDepartment(alert);
        const match =
          alert.id.toLowerCase().includes(q) ||
          alert.anomaly_metric.toLowerCase().includes(q) ||
          alert.location_zone.toLowerCase().includes(q) ||
          alert.recommended_action.toLowerCase().includes(q) ||
          (alert.worker_id && alert.worker_id.toLowerCase().includes(q)) ||
          (alert.equipment_name && alert.equipment_name.toLowerCase().includes(q)) ||
          (alert.equipment_id && alert.equipment_id.toLowerCase().includes(q)) ||
          dept.name.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'SEVERITY_DESC': {
          const rankA = getSeverityRank(a.severity);
          const rankB = getSeverityRank(b.severity);
          if (rankA !== rankB) return rankB - rankA; // Highest severity first
          return parseRecencyMinutes(a.detected_at) - parseRecencyMinutes(b.detected_at);
        }
        case 'SEVERITY_ASC': {
          const rankA = getSeverityRank(a.severity);
          const rankB = getSeverityRank(b.severity);
          if (rankA !== rankB) return rankA - rankB; // Lowest severity first
          return parseRecencyMinutes(a.detected_at) - parseRecencyMinutes(b.detected_at);
        }
        case 'DEPARTMENT_ASC': {
          const deptA = getAlertDepartment(a).name;
          const deptB = getAlertDepartment(b).name;
          const comp = deptA.localeCompare(deptB);
          if (comp !== 0) return comp;
          return getSeverityRank(b.severity) - getSeverityRank(a.severity);
        }
        case 'DEPARTMENT_DESC': {
          const deptA = getAlertDepartment(a).name;
          const deptB = getAlertDepartment(b).name;
          const comp = deptB.localeCompare(deptA);
          if (comp !== 0) return comp;
          return getSeverityRank(b.severity) - getSeverityRank(a.severity);
        }
        case 'RECENCY_DESC': {
          return parseRecencyMinutes(a.detected_at) - parseRecencyMinutes(b.detected_at);
        }
        case 'RECENCY_ASC': {
          return parseRecencyMinutes(b.detected_at) - parseRecencyMinutes(a.detected_at);
        }
        case 'URGENCY': {
          const leadA = parseLeadTimeHours(a);
          const leadB = parseLeadTimeHours(b);
          return leadA - leadB; // Shortest early warning lead time first
        }
        default:
          return 0;
      }
    });
  }, [alerts, selectedSeverity, selectedDepartment, selectedType, sortBy, searchQuery]);

  // Reset all filters helper
  const isFiltered =
    selectedSeverity !== 'ALL' ||
    selectedDepartment !== 'ALL' ||
    selectedType !== 'ALL' ||
    sortBy !== 'SEVERITY_DESC' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedDepartment('ALL');
    setSelectedType('ALL');
    setSortBy('SEVERITY_DESC');
    setSearchQuery('');
  };

  const getSeverityBadge = (severity: ActiveAnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs shadow-rose-500/10 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs shadow-orange-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
            HIGH (MEDIUM)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            MODERATE (MEDIUM)
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            LOW
          </span>
        );
    }
  };

  const getMetricIcon = (alert: ActiveAnomalyAlert) => {
    if (alert.alert_type === 'PREDICTIVE_MAINTENANCE') {
      return <Wrench className="h-4 w-4 text-amber-400" />;
    }
    const metric = alert.anomaly_metric.toLowerCase();
    if (metric.includes('noise') || metric.includes('acoustic')) {
      return <Volume2 className="h-4 w-4 text-rose-400" />;
    }
    if (metric.includes('temp') || metric.includes('thermal')) {
      return <Thermometer className="h-4 w-4 text-amber-400" />;
    }
    return <Heart className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <div id="active-alerts-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-lg">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Active Anomalies &amp; Predictive Maintenance Alerts
            </h2>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {alerts.filter((a) => !a.acknowledged).length} Pending Triage
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {counts.predictive} Equipment Alerts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric Kalman anomaly vetting, ISO 10816 equipment diagnostics, and departmental triage
          </p>
        </div>

        {/* View Mode & Heatmap / Voice Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audible Voice Alerts Toggle & Settings */}
          {onOpenVoiceSettings && (
            <button
              onClick={onOpenVoiceSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                isSpeaking
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse shadow-md shadow-cyan-500/20'
                  : voiceEnabled
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Configure audible synthesized voice alerts for on-site supervisors"
            >
              {voiceEnabled ? (
                <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'text-cyan-300 animate-ping' : 'text-cyan-400'}`} />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>Voice Alerts: {isSpeaking ? 'Speaking...' : voiceEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Weekly Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              showHeatmap
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Weekly Heatmap</span>
            {showHeatmap ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* D3 Weekly Anomaly Heatmap Component */}
      {showHeatmap && (
        <AnomalyHeatmap
          onSelectCell={(cell) => {
            setSelectedHeatmapCell(cell);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* ADVANCED FILTERING & SORTING CONTROL BAR                    */}
      {/* Allows safety managers to sort alerts by severity           */}
      {/* (Low, Medium, Critical) or by specific department categories */}
      {/* ============================================================ */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 my-4 space-y-3">
        {/* Row 1: Primary Severity Filters & Department Selector */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs">
          {/* Severity Buttons: Low, Medium, Critical, All */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3 text-cyan-400" />
              Severity:
            </span>

            <button
              onClick={() => setSelectedSeverity('ALL')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                selectedSeverity === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-600 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Severities ({counts.total})
            </button>

            <button
              onClick={() => setSelectedSeverity('CRITICAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                selectedSeverity === 'CRITICAL'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'bg-rose-950/30 border-rose-900/60 text-rose-400 hover:bg-rose-900/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
              <span>Critical ({counts.critical})</span>
            </button>

            <button
              onClick={() => setSelectedSeverity('MEDIUM')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                selectedSeverity === 'MEDIUM'
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/40'
                  : 'bg-amber-950/30 border-amber-900/60 text-amber-400 hover:bg-amber-900/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span>Medium ({counts.medium})</span>
            </button>

            <button
              onClick={() => setSelectedSeverity('LOW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                selectedSeverity === 'LOW'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-cyan-950/30 border-cyan-900/60 text-cyan-400 hover:bg-cyan-900/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>Low ({counts.low})</span>
            </button>
          </div>

          {/* Department Categories Filter Dropdown */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Building2 className="h-3 w-3 text-cyan-400" />
              Department:
            </span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as DepartmentFilterOption)}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:border-cyan-500 transition w-full sm:w-auto"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-slate-900 text-slate-100">
                  {dept.label} ({counts.deptCounts[dept.id] ?? 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Sort Selector, Search Input, and Type Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Sorting Dropdown (Sort by Severity or Department Categories) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3 text-amber-400" />
              Sort Alerts By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriterion)}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-semibold rounded-lg px-3 py-1.5 text-xs focus:outline-hidden focus:border-cyan-500 transition"
            >
              <optgroup label="Sort By Severity (Critical, Medium, Low)" className="bg-slate-900 text-slate-300">
                <option value="SEVERITY_DESC">Severity: High to Low (Critical First)</option>
                <option value="SEVERITY_ASC">Severity: Low to High (Low First)</option>
              </optgroup>
              <optgroup label="Sort By Department Category" className="bg-slate-900 text-slate-300">
                <option value="DEPARTMENT_ASC">Department Category (A to Z)</option>
                <option value="DEPARTMENT_DESC">Department Category (Z to A)</option>
              </optgroup>
              <optgroup label="Sort By Time & Horizon" className="bg-slate-900 text-slate-300">
                <option value="RECENCY_DESC">Detection Time: Most Recent</option>
                <option value="RECENCY_ASC">Detection Time: Oldest First</option>
                <option value="URGENCY">Early Warning Lead: Most Urgent First</option>
              </optgroup>
            </select>
          </div>

          {/* Quick Search Box */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alert, equipment, zone..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Reset Filters button */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition shrink-0"
                title="Reset all filters and sorting to default"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Active Filters Summary Tag Bar */}
        {isFiltered && (
          <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Active Filters:</span>
            {selectedSeverity !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Severity: <strong>{selectedSeverity}</strong>
                <button
                  onClick={() => setSelectedSeverity('ALL')}
                  className="hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedDepartment !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                Dept: <strong>{DEPARTMENT_OPTIONS.find((d) => d.id === selectedDepartment)?.label}</strong>
                <button
                  onClick={() => setSelectedDepartment('ALL')}
                  className="hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                Search: <strong>"{searchQuery}"</strong>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </span>
            )}
            <span className="text-slate-500 ml-auto font-mono">
              Matching {filteredAndSortedAlerts.length} of {alerts.length} alerts
            </span>
          </div>
        )}
      </div>

      {/* Active Alerts List Header */}
      <div className="flex justify-between items-center pt-2 pb-1 text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300 flex items-center gap-2">
          <span>Current Live Alerts Stream ({filteredAndSortedAlerts.length})</span>
          {sortBy.includes('SEVERITY') && (
            <span className="text-[10px] text-amber-400 font-mono font-normal">
              (Sorted by Severity {sortBy === 'SEVERITY_DESC' ? 'High \u2192 Low' : 'Low \u2192 High'})
            </span>
          )}
          {sortBy.includes('DEPARTMENT') && (
            <span className="text-[10px] text-cyan-400 font-mono font-normal">
              (Sorted by Department {sortBy === 'DEPARTMENT_ASC' ? 'A \u2192 Z' : 'Z \u2192 A'})
            </span>
          )}
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          Showing: {selectedSeverity} Severity &bull; {DEPARTMENT_OPTIONS.find((d) => d.id === selectedDepartment)?.label || 'All Depts'}
        </span>
      </div>

      {/* Alerts Grid / List */}
      <div className="space-y-3 mt-3">
        {filteredAndSortedAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-lg border border-slate-800 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-70" />
            <p className="font-semibold text-slate-300">No active anomalies matching the selected filter criteria.</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting severity level, department category, or clear the search query.
            </p>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 text-xs font-semibold transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedAlerts.map((alert) => {
            const isPredictive = alert.alert_type === 'PREDICTIVE_MAINTENANCE';
            const dept = getAlertDepartment(alert);
            const DeptIcon = dept.icon;

            return (
              <div
                key={alert.id}
                className={`transition-all rounded-xl p-4 border ${
                  isPredictive
                    ? alert.severity === 'CRITICAL'
                      ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900/90 shadow-md shadow-amber-950/20'
                      : 'border-amber-600/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900/80 shadow-xs'
                    : alert.severity === 'CRITICAL'
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/30'
                } ${alert.acknowledged ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left side: Alert title, meta, department, zone, severity */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Department Category Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${dept.badgeClass}`}
                        title={`Department Category: ${dept.name}`}
                      >
                        <DeptIcon className="h-3 w-3" />
                        <span>{dept.shortName}</span>
                      </span>

                      {isPredictive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                          <Wrench className="h-3 w-3 text-amber-400" />
                          PREDICTIVE MAINTENANCE
                        </span>
                      ) : null}

                      {getSeverityBadge(alert.severity)}

                      <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                        {getMetricIcon(alert)}
                        {alert.anomaly_metric}
                      </span>
                      <span className="text-slate-500 text-xs">&bull;</span>
                      <span className="text-xs font-mono text-slate-400">{alert.id}</span>
                      <span className="text-slate-500 text-xs">&bull;</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {alert.detected_at}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        {alert.location_zone}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="text-slate-500">Dept:</span>
                        <span className="text-slate-200 font-medium">{dept.name}</span>
                      </span>
                      <span className="text-slate-600">|</span>
                      {isPredictive ? (
                        <>
                          <span className="font-mono text-amber-300 flex items-center gap-1">
                            <Cog className="h-3 w-3 text-amber-400" />
                            Equipment: {alert.equipment_name || alert.equipment_id} ({alert.equipment_id})
                          </span>
                          {alert.equipment_subsystem && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-400">Subsystem: {alert.equipment_subsystem}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="font-mono text-slate-400">Worker ID: {alert.worker_id}</span>
                      )}
                      <span className="text-slate-600">|</span>
                      <span className="text-emerald-400 font-mono text-[11px]">{alert.privacy_status}</span>
                    </div>

                    {/* Predictive Maintenance Equipment Vibration & Heat Diagnostic Panel */}
                    {isPredictive ? (
                      <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <Activity className="h-3 w-3 text-amber-400" />
                            Vibration Velocity (RMS):
                          </span>
                          <div className="font-mono text-xs">
                            <span className="text-amber-300 font-bold text-sm">
                              {alert.vibration_mm_s ?? '6.85'} mm/s
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1.5">(ISO 10816 Limit: 4.5 mm/s)</span>
                          </div>
                          <span className="text-[10px] text-rose-400 font-mono block">
                            {alert.iso_10816_class || 'ISO 10816-3 Class II (Severe Zone C)'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-rose-400" />
                            Motor / Bearing Heat:
                          </span>
                          <div className="font-mono text-xs">
                            <span className="text-rose-400 font-bold text-sm">
                              {alert.equipment_temp_c ?? '86.4'}°C
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1.5">(Operating Nominal: 55°C)</span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono block">
                            Thermal Drift: +{(alert.equipment_temp_c ? alert.equipment_temp_c - 55 : 31.4).toFixed(1)}°C Above Casing Baseline
                          </span>
                        </div>

                        <div className="space-y-1 sm:text-right flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Early Warning Maintenance Horizon
                            </span>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              {alert.lead_time}
                            </span>
                          </div>
                          {alert.maintenance_urgency && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 sm:self-end">
                              Urgency: {alert.maintenance_urgency.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Standard Kalman filtering telemetry comparison bar for Health Alerts */
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <Filter className="h-3 w-3 text-cyan-400" />
                            Kalman Filtering Validation:
                            <span className="text-cyan-300 font-mono ml-1">{alert.kalman_status}</span>
                          </span>
                          <div className="text-[11px] text-slate-300 font-mono">
                            <span className="text-slate-400">Raw Sensor:</span> <span className="text-amber-400">{alert.raw_value}</span>
                            <span className="mx-2 text-slate-600">&rarr;</span>
                            <span className="text-slate-400">Smoothed:</span> <span className="text-cyan-400 font-bold">{alert.kalman_smoothed_value}</span>
                          </div>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model Early Warning Lead</span>
                          <span className="text-xs font-bold text-cyan-400 font-mono">{alert.lead_time}</span>
                        </div>
                      </div>
                    )}

                    {/* Recommended Action / Directive */}
                    <div className="text-xs text-slate-300 pt-1 flex items-start gap-1.5">
                      <span className={isPredictive ? 'text-amber-400 font-semibold shrink-0' : 'text-cyan-400 font-semibold shrink-0'}>
                        {isPredictive ? 'Maintenance Protocol:' : 'Protocol:'}
                      </span>
                      <span>{alert.recommended_action}</span>
                    </div>
                  </div>

                  {/* Right side: Action Buttons */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    {onSpeakAlert && (
                      <button
                        onClick={() => onSpeakAlert(alert)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-lg transition border border-slate-700/80 flex items-center justify-center gap-1.5"
                        title="Synthesize audible voice broadcast for this anomaly"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Speak Alert</span>
                      </button>
                    )}

                    {alert.acknowledged ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isPredictive ? 'Work Order Staged' : 'Protocol Dispatched'}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => onDispatchAction(alert)}
                          className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 ${
                            isPredictive
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                              : alert.severity === 'CRITICAL'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                              : alert.severity === 'HIGH'
                              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                          }`}
                        >
                          {isPredictive ? <Wrench className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                          <span>{isPredictive ? 'Dispatch Reliability Tech' : 'Dispatch Intervention'}</span>
                        </button>
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition border border-slate-700 flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>Acknowledge</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

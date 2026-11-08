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
  ChevronRight
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert } from '../types';
import { INITIAL_WEARABLE_DEVICES } from '../services/wearableBiometricService';
import { INITIAL_TECHNICIANS } from '../services/maintenanceSchedulingService';

export interface GlobalSearchBarProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  onSelectZone: (zoneId: string) => void;
  onSelectAlert: (alertId: string) => void;
  onSelectReport?: (reportKey: string) => void;
  onSelectEquipment?: (equipmentId: string) => void;
  className?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'ZONE' | 'ALERT_REPORT' | 'PREDICTIVE_REPORT' | 'EQUIPMENT' | 'WEARABLE' | 'TECHNICIAN';
  badge: string;
  badgeColor: string;
  severity?: string;
  zoneId?: string;
  alertId?: string;
  reportKey?: string;
  equipmentId?: string;
  workerId?: string;
  techId?: string;
}

export const PREDICTIVE_REPORTS_INDEX = [
  {
    key: 'RESOURCE_UTILIZATION_HEATMAP',
    title: 'Resource Utilization & Workforce Heatmap',
    subtitle: 'Worker distribution across high-risk zones, thermal heat strain overlay, and shift rebalancing',
    badge: 'WORKFORCE HEATMAP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    key: 'EXPORT_ALL_ANALYTICS_CSV',
    title: 'Export All Analytics (CSV)',
    subtitle: 'Simulated CSV download of current anomaly log and historical trend data for offline auditing',
    badge: 'OFFLINE AUDIT CSV',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    key: 'DASHBOARD_SUMMARY_PDF',
    title: 'Download Dashboard Summary Report (PDF)',
    subtitle: 'Executive 2-page documentation summarizing active metrics, anomaly events, and workplace zones',
    badge: 'PDF REPORT',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    key: 'PREDICTIVE_SURGE_48H',
    title: '48-Hour Forward Predictive Incident Surge Report',
    subtitle: 'LSTM-Kalman predictive model projecting acute heat and fatigue incidents 48 hours forward',
    badge: 'FORWARD PROJECTION',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    key: 'SIGNED_COMPLIANCE_PDF',
    title: 'Signed Quarterly Compliance Audit Report (PDF)',
    subtitle: 'ISO 45001 & OSHA 1910 digitally signed executive compliance audit dossier',
    badge: 'STATUTORY PDF',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    key: 'DAILY_SUMMARY_REPORT',
    title: '24-Hour Daily Summary Operational Report',
    subtitle: 'Shift-by-shift workforce coverage, anomaly counts, and risk distribution analysis',
    badge: 'SHIFT SUMMARY',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    key: 'COMPLIANCE_AUDIT_LOG',
    title: 'Compliance Audit Log & Tamper-Evident Trail (CSV)',
    subtitle: 'Full audit ledger of supervisor manual overrides and automated system adjustments',
    badge: 'AUDIT CSV',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    key: 'HEALTH_METRICS_PDF',
    title: 'Real-Time Health Metrics & KPI Report (PDF)',
    subtitle: 'Multi-signal vitals snapshot, autonomic HRV distributions, and environmental heat load',
    badge: 'METRICS PDF',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    key: 'ANOMALY_TREND_30D',
    title: '30-Day Longitudinal Anomaly Trend Analysis',
    subtitle: 'Monthly risk frequency progression and 7-day rolling moving average projections',
    badge: '30D ANALYSIS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    key: 'PREDICTIVE_MAINTENANCE_TAB',
    title: 'Proactive Equipment Maintenance Schedule',
    subtitle: 'RUL telemetry, vibration anomalies, and technician dispatch allocation',
    badge: 'MAINTENANCE',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  }
];

export default function GlobalSearchBar({
  zones,
  alerts,
  onSelectZone,
  onSelectAlert,
  onSelectReport,
  onSelectEquipment,
  className = ''
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Build searchable index of Zones, Anomaly Events by ID, Predictive Reports, and Equipment
  const allSearchItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Facility Zones
    zones.forEach((z) => {
      items.push({
        id: `zone-${z.id}`,
        title: z.name,
        subtitle: `Zone ID: ${z.id} • ${z.description} • Heat: ${z.temp} • Cohort N=${z.count}`,
        category: 'ZONE',
        badge: `ZONE • ${z.status}`,
        badgeColor:
          z.status === 'CRITICAL'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : z.status === 'MODERATE'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        zoneId: z.id
      });
    });

    // 2. Past Anomaly Events by ID
    alerts.forEach((a) => {
      const isPredictive = a.alert_type === 'PREDICTIVE_MAINTENANCE';
      items.push({
        id: `alert-${a.id}`,
        title: `${a.id} — ${a.anomaly_metric}`,
        subtitle: `Event ID: ${a.id} • ${a.location_zone} • Worker: ${a.worker_id} • Raw: ${a.raw_value} • Smoothed: ${a.kalman_smoothed_value}`,
        category: 'ALERT_REPORT',
        badge: `${a.severity} ANOMALY`,
        badgeColor:
          a.severity === 'CRITICAL'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : a.severity === 'HIGH'
            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        severity: a.severity,
        alertId: a.id,
        zoneId: a.location_zone
      });
    });

    // 3. Specific Predictive Reports
    PREDICTIVE_REPORTS_INDEX.forEach((rep) => {
      items.push({
        id: `report-${rep.key}`,
        title: rep.title,
        subtitle: rep.subtitle,
        category: 'PREDICTIVE_REPORT',
        badge: rep.badge,
        badgeColor: rep.badgeColor,
        reportKey: rep.key
      });
    });

    // 4. Industrial Equipment & Sensor Nodes
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
        zoneId: info.zone
      });
    });

    // 5. Wearables & Workers
    INITIAL_WEARABLE_DEVICES.slice(0, 4).forEach((w) => {
      items.push({
        id: `wearable-${w.id}`,
        title: `${w.workerName} [${w.workerId}]`,
        subtitle: `${w.deviceModel} • HR: ${w.currentHeartRate} BPM • Stress: ${w.stressScore}/100`,
        category: 'WEARABLE',
        badge: `WEARABLE`,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        zoneId: w.zoneId,
        workerId: w.workerId
      });
    });

    return items;
  }, [zones, alerts]);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show curated top items across categories
      return allSearchItems.slice(0, 8);
    }

    return allSearchItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.zoneId && item.zoneId.toLowerCase().includes(q)) ||
          (item.alertId && item.alertId.toLowerCase().includes(q)) ||
          (item.reportKey && item.reportKey.toLowerCase().includes(q)) ||
          (item.equipmentId && item.equipmentId.toLowerCase().includes(q))
        );
      })
      .slice(0, 10);
  }, [allSearchItems, query]);

  // Handle keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
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
      const el = document.getElementById('floorplan-view-section') || document.getElementById('telemetry-charts-card');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'ALERT_REPORT' && item.alertId) {
      onSelectAlert(item.alertId);
      const el = document.getElementById('active-alerts-section') || document.getElementById('historical-anomaly-events-log');
      el?.scrollIntoView({ behavior: 'smooth' });
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
    } else if (item.category === 'WEARABLE') {
      if (item.zoneId) {
        onSelectZone(item.zoneId);
      }
      const el = document.getElementById('biometric-sync-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }

    setIsOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'ZONE':
        return <MapPin className="h-4 w-4 text-cyan-400" />;
      case 'ALERT_REPORT':
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case 'PREDICTIVE_REPORT':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'EQUIPMENT':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      case 'WEARABLE':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'TECHNICIAN':
        return <UserCheck className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
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
          placeholder="Search zones, anomaly event ID (e.g. ALR-8842), or predictive reports..."
          className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 rounded-xl pl-9 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner transition font-sans"
        />

        <div className="absolute right-2 flex items-center space-x-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center space-x-0.5 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-400 select-none">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header Summary */}
          <div className="px-3 py-2 bg-slate-900/90 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>{query ? `Search results for "${query}"` : 'Quick Navigation Index'}</span>
            </span>
            <span>{filteredResults.length} matches</span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-mono">
                <ShieldAlert className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                No matching zones, anomaly IDs, or predictive reports found for "{query}".
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-cyan-950/60 border-l-2 border-cyan-400 pl-2.5' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white flex items-center gap-2 truncate">
                          <span>{item.title}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center pl-2 text-slate-500 shrink-0">
                      <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Tip */}
          <div className="px-3 py-1.5 bg-slate-900/90 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Use ↑↓ to navigate • Enter to select • Esc to dismiss</span>
            <span className="text-cyan-400">Zones • Anomaly Events • Reports</span>
          </div>
        </div>
      )}
    </div>
  );
}

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
  UserCheck
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert } from '../types';
import { INITIAL_WEARABLE_DEVICES } from '../services/wearableBiometricService';
import { INITIAL_TECHNICIANS } from '../services/maintenanceSchedulingService';

export interface GlobalSearchBarProps {
  zones: FacilityZone[];
  alerts: ActiveAnomalyAlert[];
  onSelectZone: (zoneId: string) => void;
  onSelectAlert: (alertId: string) => void;
  onSelectEquipment?: (equipmentId: string) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'ZONE' | 'EQUIPMENT' | 'ALERT_REPORT' | 'WEARABLE' | 'TECHNICIAN';
  badge: string;
  badgeColor: string;
  severity?: string;
  zoneId?: string;
  alertId?: string;
  equipmentId?: string;
  workerId?: string;
  techId?: string;
}

export default function GlobalSearchBar({
  zones,
  alerts,
  onSelectZone,
  onSelectAlert,
  onSelectEquipment
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
      } else if (e.key === '/' && document.activeElement !== inputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
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

  // Build searchable index of Zones, Sensors & Equipment, and Alert Reports
  const allSearchItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Facility Zones
    zones.forEach((z) => {
      items.push({
        id: `zone-${z.id}`,
        title: z.name,
        subtitle: `${z.description} • Heat: ${z.temp} • Cohort N=${z.count}`,
        category: 'ZONE',
        badge: z.status,
        badgeColor:
          z.status === 'CRITICAL'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : z.status === 'MODERATE'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        zoneId: z.id
      });
    });

    // 2. Equipment & Sensor IDs
    const equipmentMap = new Map<string, { name: string; zone: string; metric: string; vib?: number; temp?: number }>();

    // Seed known equipment from alerts and sensors
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

    // Additional known industrial equipment sensor nodes
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
    if (!equipmentMap.has('FAN-EXHAUST-03')) {
      equipmentMap.set('FAN-EXHAUST-03', {
        name: 'Centrifugal Exhaust Blower 3',
        zone: 'Manufacturing-Assembly-Line-B',
        metric: 'Impeller Dynamic Unbalance',
        vib: 3.75,
        temp: 68.2
      });
    }
    if (!equipmentMap.has('SEN-ACOUSTIC-4B')) {
      equipmentMap.set('SEN-ACOUSTIC-4B', {
        name: 'Sector 4 Acoustic Overpressure Sensor Array',
        zone: 'Outdoor-Construction-Sector-4',
        metric: 'Decibel Dosimetry (104.8 dB peak)'
      });
    }

    equipmentMap.forEach((info, eqId) => {
      items.push({
        id: `equip-${eqId}`,
        title: `${info.name} [${eqId}]`,
        subtitle: `Stationed at ${info.zone}${info.vib ? ` • Vib: ${info.vib} mm/s RMS` : ''}${info.temp ? ` • Heat: ${info.temp}°C` : ''}`,
        category: 'EQUIPMENT',
        badge: 'MACHINERY SENSOR',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        equipmentId: eqId,
        zoneId: info.zone
      });
    });

    // 3. Recent Alert Reports
    alerts.forEach((a) => {
      const isPredictive = a.alert_type === 'PREDICTIVE_MAINTENANCE';
      items.push({
        id: `alert-${a.id}`,
        title: `${a.id}: ${a.anomaly_metric}`,
        subtitle: `${a.location_zone} • Token: ${a.worker_id} • Raw: ${a.raw_value} • Smoothed: ${a.kalman_smoothed_value}`,
        category: 'ALERT_REPORT',
        badge: `${a.severity} ${isPredictive ? 'PREDICTIVE' : 'HEALTH'}`,
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

    // 4. Wearable Health Devices & Worker Biometrics
    INITIAL_WEARABLE_DEVICES.forEach((w) => {
      items.push({
        id: `wearable-${w.id}`,
        title: `${w.workerName} [${w.workerId}]`,
        subtitle: `${w.deviceModel} • RMSSD: ${w.currentRmssd}ms • HR: ${w.currentHeartRate} BPM • Stress: ${w.stressScore}/100`,
        category: 'WEARABLE',
        badge: `${w.stressTier.replace('_', ' ')}`,
        badgeColor:
          w.stressTier === 'CRITICAL_STRAIN'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : w.stressTier === 'HIGH_STRESS'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        zoneId: w.zoneId,
        workerId: w.workerId
      });
    });

    // 5. Maintenance Technicians & Work Orders
    INITIAL_TECHNICIANS.forEach((t) => {
      items.push({
        id: `tech-${t.id}`,
        title: `${t.name} (${t.certification.split(' ')[0]})`,
        subtitle: `${t.specialization.replace(/_/g, ' ')} • Zone: ${t.assignedZone} • Rating: ${t.rating}★`,
        category: 'TECHNICIAN',
        badge: `${t.status}`,
        badgeColor:
          t.status === 'AVAILABLE'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        zoneId: t.assignedZone,
        techId: t.id
      });
    });

    return items;
  }, [zones, alerts]);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show default top recommendations (Critical alerts, main zones, key equipment)
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
          (item.equipmentId && item.equipmentId.toLowerCase().includes(q)) ||
          (item.workerId && item.workerId.toLowerCase().includes(q)) ||
          (item.techId && item.techId.toLowerCase().includes(q))
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
      const el = document.getElementById('active-alerts-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'EQUIPMENT') {
      if (item.equipmentId && onSelectEquipment) {
        onSelectEquipment(item.equipmentId);
      }
      if (item.zoneId) {
        onSelectZone(item.zoneId);
      }
      const el = document.getElementById('maintenance-scheduler-section') || document.getElementById('sensor-correlation-scatter-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'WEARABLE') {
      if (item.zoneId) {
        onSelectZone(item.zoneId);
      }
      const el = document.getElementById('biometric-sync-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (item.category === 'TECHNICIAN') {
      if (item.zoneId) {
        onSelectZone(item.zoneId);
      }
      const el = document.getElementById('maintenance-scheduler-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }

    setIsOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'ZONE':
        return <MapPin className="h-4 w-4 text-cyan-400" />;
      case 'EQUIPMENT':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      case 'ALERT_REPORT':
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case 'WEARABLE':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'TECHNICIAN':
        return <UserCheck className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative w-full max-w-md">
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
          placeholder="Search zones, sensor IDs (e.g. MTR-DRIVE-4B), or alerts..."
          className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 rounded-xl py-2 pl-9 pr-16 text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500/50 shadow-inner transition"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="absolute right-2.5 flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none font-mono">
            <span>⌘K</span>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-slate-800"
        >
          {/* Header metadata */}
          <div className="px-3 py-2 bg-slate-950/90 flex justify-between items-center text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-300">
              {query ? `Search Results (${filteredResults.length})` : 'Recommended Quick Navigation'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Navigate: &uarr;&darr; Select: Enter
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching zones, sensor IDs, or alert reports found for "{query}".
              </div>
            ) : (
              filteredResults.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-lg cursor-pointer transition flex items-center justify-between gap-3 text-xs ${
                    selectedIndex === idx ? 'bg-cyan-500/15 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate text-xs">{item.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold shrink-0">
                    <span className="hidden sm:inline">Jump</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Building2,
  MapPin,
  X,
  ArrowRight,
  Flame,
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  CornerDownLeft,
  Filter
} from 'lucide-react';
import { FacilityZone } from '../types';

export interface DepartmentZoneEntity {
  id: string; // The specific ID used for lookup (e.g. DEPT-CONST-04 or ZONE-S4-OUTDOOR)
  rawZoneId: string; // Target FacilityZone ID for telemetry/selection
  name: string;
  type: 'DEPARTMENT' | 'ZONE';
  location: string;
  cohortSize: number;
  status: 'CRITICAL' | 'MODERATE' | 'STABLE';
  twlIndex: number;
  ambientTemp?: string | number;
  primaryHazard: string;
  departmentCode?: string;
  zoneCode?: string;
}

// Canonical departments registry mapped to zones with explicit IDs
export const CANONICAL_DEPARTMENTS: DepartmentZoneEntity[] = [
  {
    id: 'DEPT-CONST-04',
    rawZoneId: 'Outdoor-Construction-Sector-4',
    name: 'Civil & Structural Construction',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-CONST-04',
    location: 'GCC Megasite - Sector 4 Outdoor Workings',
    cohortSize: 18,
    status: 'CRITICAL',
    twlIndex: 92.4,
    ambientTemp: '44.2°C',
    primaryHazard: 'Severe Thermal Radiation & Heatwave Exhaustion'
  },
  {
    id: 'DEPT-LOG-01',
    rawZoneId: 'Warehouse-Logistics-Hub-North',
    name: 'Supply Chain & High-Bay Fulfillment',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-LOG-01',
    location: 'London Gateway - Logistics Hub North',
    cohortSize: 25,
    status: 'MODERATE',
    twlIndex: 118.0,
    ambientTemp: '36.5°C',
    primaryHazard: 'High-Bay Forklift Jitter & Musculoskeletal Fatigue'
  },
  {
    id: 'DEPT-MIN-07',
    rawZoneId: 'Subgrade-Tunnel-Conduit-7',
    name: 'Underground Infrastructure & Conduit Boring',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-MIN-07',
    location: 'Tunnel Complex - Subgrade Conduit 7',
    cohortSize: 14,
    status: 'MODERATE',
    twlIndex: 104.5,
    ambientTemp: '38.1°C',
    primaryHazard: 'Confined Space Oxygenation & k-Anonymity Guard'
  },
  {
    id: 'DEPT-ROBO-02',
    rawZoneId: 'Manufacturing-Assembly-Line-B',
    name: 'Precision Robotics Assembly & QA',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-ROBO-02',
    location: 'Silicon Fab - Cleanroom Line B',
    cohortSize: 42,
    status: 'STABLE',
    twlIndex: 142.1,
    ambientTemp: '31.0°C',
    primaryHazard: 'Repetitive Ergonomic Strain & Acoustic Jitter'
  },
  {
    id: 'DEPT-CHEM-03',
    rawZoneId: 'Chemical-Refining-Plant-C',
    name: 'Petrochemical & Catalytic Refining',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-CHEM-03',
    location: 'Coastal Refining Cluster - Battery C',
    cohortSize: 16,
    status: 'CRITICAL',
    twlIndex: 88.0,
    ambientTemp: '42.8°C',
    primaryHazard: 'Volatile Hydrocarbon Dispersion & Thermal Stagnation'
  },
  {
    id: 'DEPT-CRYO-05',
    rawZoneId: 'Cold-Chain-Cryogenic-Alpha',
    name: 'Cold-Chain Cryogenic Storage',
    type: 'DEPARTMENT',
    departmentCode: 'DEPT-CRYO-05',
    location: 'Cryogenic Deep Freeze - Vault Alpha',
    cohortSize: 12,
    status: 'MODERATE',
    twlIndex: 105.0,
    ambientTemp: '-18.5°C',
    primaryHazard: 'Extreme Cold Exposure & Hypothermia Shock'
  }
];

export interface DepartmentZoneSearchLookupProps {
  zones: FacilityZone[];
  selectedZoneId?: string;
  onSelectEntity: (entity: DepartmentZoneEntity) => void;
  className?: string;
}

export default function DepartmentZoneSearchLookup({
  zones,
  selectedZoneId,
  onSelectEntity,
  className = ''
}: DepartmentZoneSearchLookupProps) {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'ALL' | 'DEPARTMENT' | 'ZONE'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global hotkey '/' or 'Cmd/Ctrl + K'
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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aggregate searchable items: Canonical Departments + Live Facility Zones
  const allEntities = useMemo<DepartmentZoneEntity[]>(() => {
    const list: DepartmentZoneEntity[] = [...CANONICAL_DEPARTMENTS];

    // Add Worker Zones with standardized IDs
    zones.forEach((z) => {
      // Avoid duplicate department entries if already matching raw zone ID
      const existingZoneCode =
        z.id === 'Outdoor-Construction-Sector-4'
          ? 'ZONE-S4-OUTDOOR'
          : z.id === 'Warehouse-Logistics-Hub-North'
          ? 'ZONE-WHN-LOGISTICS'
          : z.id === 'Subgrade-Tunnel-Conduit-7'
          ? 'ZONE-TC7-SUBGRADE'
          : z.id === 'Manufacturing-Assembly-Line-B'
          ? 'ZONE-ALB-ROBOTICS'
          : z.id === 'Chemical-Refining-Plant-C'
          ? 'ZONE-CRP-CHEM'
          : z.id === 'Cold-Chain-Cryogenic-Alpha'
          ? 'ZONE-CCA-CRYO'
          : `ZONE-${z.id.toUpperCase().slice(0, 10)}`;

      list.push({
        id: existingZoneCode,
        rawZoneId: z.id,
        name: z.name,
        type: 'ZONE',
        zoneCode: existingZoneCode,
        location: z.description || 'Facility Operational Zone',
        cohortSize: z.count || 0,
        status: z.status as 'CRITICAL' | 'MODERATE' | 'STABLE',
        twlIndex: z.twl || 120,
        ambientTemp: z.temp,
        primaryHazard: z.activeHazards?.[0] || 'Environmental Occupational Strain'
      });
    });

    return list;
  }, [zones]);

  // Filter entities by search query and type filter
  const filteredEntities = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allEntities.filter((item) => {
      // Type filter
      if (filterType !== 'ALL' && item.type !== filterType) {
        return false;
      }

      if (!q) return true;

      const matchId = item.id.toLowerCase().includes(q);
      const matchRawId = item.rawZoneId.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchHazard = item.primaryHazard.toLowerCase().includes(q);
      const matchDeptCode = item.departmentCode ? item.departmentCode.toLowerCase().includes(q) : false;
      const matchZoneCode = item.zoneCode ? item.zoneCode.toLowerCase().includes(q) : false;

      return matchId || matchRawId || matchName || matchLoc || matchHazard || matchDeptCode || matchZoneCode;
    });
  }, [allEntities, query, filterType]);

  // Handle keyboard selection in dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredEntities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredEntities.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEntities[selectedIndex]) {
        handleSelectItem(filteredEntities[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: DepartmentZoneEntity) => {
    onSelectEntity(item);
    setQuery('');
    setIsOpen(false);
  };

  // Helper to render matched text highlight
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <span key={i} className="text-cyan-400 bg-cyan-950/80 font-bold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4 text-cyan-400" />
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
          onKeyDown={handleInputKeyDown}
          placeholder="Lookup department or worker zone by ID (e.g. DEPT-CONST-04, Sector-4)..."
          className="w-full pl-9 pr-24 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner transition font-medium"
        />

        {/* Clear & Keyboard Shortcut Badges */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
              <span>⌘K</span>
              <span>/</span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[460px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header & Filter Segmented Controls */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span>Lookup by ID:</span>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'ALL' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({allEntities.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('DEPARTMENT')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'DEPARTMENT'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="h-3 w-3" />
                <span>Departments (6)</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ZONE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'ZONE' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>Worker Zones ({zones.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Jump Hot Buttons for Key IDs */}
          {!query && (
            <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-400 shrink-0 font-medium">Quick Jump ID:</span>
              {[
                { id: 'DEPT-CONST-04', label: 'DEPT-CONST-04', tag: 'Construction' },
                { id: 'DEPT-CHEM-03', label: 'DEPT-CHEM-03', tag: 'Chemical' },
                { id: 'ZONE-S4-OUTDOOR', label: 'Sector-4', tag: 'High-Heat Zone' },
                { id: 'DEPT-ROBO-02', label: 'DEPT-ROBO-02', tag: 'Robotics' },
                { id: 'DEPT-LOG-01', label: 'DEPT-LOG-01', tag: 'Logistics' }
              ].map((jump) => (
                <button
                  key={jump.id}
                  onClick={() => {
                    const match = allEntities.find((e) => e.id === jump.id || e.rawZoneId.includes(jump.label));
                    if (match) handleSelectItem(match);
                  }}
                  className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-cyan-900/60 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 transition cursor-pointer"
                >
                  <span className="font-mono text-cyan-400">{jump.label}</span>
                  <span className="text-[10px] text-slate-400">({jump.tag})</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Result List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[340px]">
            {filteredEntities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle className="h-7 w-7 text-amber-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-300">No matching department or worker zone ID found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by code like <code className="text-cyan-400 font-mono">DEPT-CONST-04</code>,{' '}
                  <code className="text-cyan-400 font-mono">DEPT-LOG-01</code>,{' '}
                  <code className="text-cyan-400 font-mono">Sector-4</code>, or{' '}
                  <code className="text-cyan-400 font-mono">Robotics</code>.
                </p>
              </div>
            ) : (
              filteredEntities.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isCurrentActive = selectedZoneId === item.rawZoneId;

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-3 transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-cyan-950/50 text-slate-100' : 'hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                          item.type === 'DEPARTMENT'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        }`}
                      >
                        {item.type === 'DEPARTMENT' ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </div>

                      {/* Main Details */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                            {highlightMatch(item.id, query)}
                          </span>

                          <span className="font-semibold text-xs text-white truncate">
                            {highlightMatch(item.name, query)}
                          </span>

                          {/* Entity Type Label */}
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {item.type}
                          </span>

                          {/* Status Indicator */}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              item.status === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : item.status === 'MODERATE'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {item.status}
                          </span>

                          {isCurrentActive && (
                            <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active Focus</span>
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Location / Hazard */}
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{highlightMatch(item.location, query)}</span>
                          <span aria-hidden="true">·</span>
                          <span>Cohort N={item.cohortSize}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-300">TWL {item.twlIndex} W/m²</span>
                          {item.ambientTemp && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{item.ambientTemp}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400/90 truncate max-w-xs">{item.primaryHazard}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Hint */}
                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-semibold bg-cyan-950 px-2 py-1 rounded border border-cyan-500/30">
                          <span>Select</span>
                          <CornerDownLeft className="h-3 w-3" />
                        </span>
                      ) : (
                        <ArrowRight className="h-4 w-4 opacity-40" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded font-mono">↑</kbd>{' '}
                <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded font-mono">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded font-mono">Enter</kbd> to select
              </span>
              <span>
                <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded font-mono">Esc</kbd> to close
              </span>
            </div>
            <span className="text-slate-400">Total Index: {allEntities.length} Departments &amp; Zones</span>
          </div>
        </div>
      )}
    </div>
  );
}

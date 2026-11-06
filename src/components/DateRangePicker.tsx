import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  RotateCcw,
  Check,
  CalendarRange,
  ArrowRight,
  Filter,
  Sparkles,
  Info
} from 'lucide-react';

export type TimeframePreset = '7D' | '14D' | '30D' | '90D' | 'CUSTOM';

export interface DateRangeSelection {
  startDate: string; // ISO YYYY-MM-DD
  endDate: string; // ISO YYYY-MM-DD
  preset: TimeframePreset;
  label: string;
  daysCount: number;
}

export interface DateRangePickerProps {
  value: DateRangeSelection;
  onChange: (selection: DateRangeSelection) => void;
  className?: string;
  compact?: boolean;
}

// Helpers for date calculations
const toIsoDate = (d: Date): string => {
  return d.toISOString().slice(0, 10);
};

const formatDisplayDate = (isoStr: string): string => {
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DEFAULT_DATE_RANGE: DateRangeSelection = (() => {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400000);
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    preset: '30D',
    label: 'Last 30 Days (Rolling Baseline)',
    daysCount: 30
  };
})();

export default function DateRangePicker({
  value,
  onChange,
  className = '',
  compact = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customStart, setCustomStart] = useState<string>(value.startDate);
  const [customEnd, setCustomEnd] = useState<string>(value.endDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal custom date inputs when incoming value changes
  useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  }, [value.startDate, value.endDate]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = useMemo(() => toIsoDate(new Date()), []);

  const handleSelectPreset = (preset: '7D' | '14D' | '30D' | '90D') => {
    const end = new Date();
    let days = 30;
    let label = 'Last 30 Days';

    if (preset === '7D') {
      days = 7;
      label = 'Last 7 Days (Weekly Window)';
    } else if (preset === '14D') {
      days = 14;
      label = 'Last 14 Days (Bi-Weekly Window)';
    } else if (preset === '30D') {
      days = 30;
      label = 'Last 30 Days (Monthly Baseline)';
    } else if (preset === '90D') {
      days = 90;
      label = 'Last 90 Days (Quarterly Horizon)';
    }

    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const newStart = toIsoDate(start);
    const newEnd = toIsoDate(end);

    setCustomStart(newStart);
    setCustomEnd(newEnd);
    setErrorMessage(null);

    onChange({
      startDate: newStart,
      endDate: newEnd,
      preset,
      label,
      daysCount: days
    });

    setIsOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      setErrorMessage('Both start and end dates are required.');
      return;
    }

    const startD = new Date(customStart + 'T00:00:00');
    const endD = new Date(customEnd + 'T00:00:00');

    if (startD > endD) {
      setErrorMessage('Start date cannot be after end date.');
      return;
    }

    const diffMs = endD.getTime() - startD.getTime();
    const days = Math.round(diffMs / 86400000) + 1;

    if (days < 1) {
      setErrorMessage('Selected range must span at least 1 day.');
      return;
    }

    setErrorMessage(null);
    onChange({
      startDate: customStart,
      endDate: customEnd,
      preset: 'CUSTOM',
      label: `Custom Range (${days} Days)`,
      daysCount: days
    });

    setIsOpen(false);
  };

  const handleQuickShortcut = (type: 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'THIS_WEEK') {
      // Monday to today
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start = new Date(now.getTime() - diffToMonday * 86400000);
      end = now;
    } else if (type === 'LAST_WEEK') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const lastMonday = new Date(now.getTime() - (diffToMonday + 7) * 86400000);
      const lastSunday = new Date(lastMonday.getTime() + 6 * 86400000);
      start = lastMonday;
      end = lastSunday;
    } else if (type === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (type === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const sStr = toIsoDate(start);
    const eStr = toIsoDate(end);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    setCustomStart(sStr);
    setCustomEnd(eStr);
    setErrorMessage(null);

    onChange({
      startDate: sStr,
      endDate: eStr,
      preset: 'CUSTOM',
      label: `Custom (${formatDisplayDate(sStr)} – ${formatDisplayDate(eStr)})`,
      daysCount: days
    });

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
          isOpen
            ? 'bg-slate-800 border-cyan-500 text-white ring-1 ring-cyan-500/50'
            : value.preset !== '30D'
            ? 'bg-cyan-950/70 hover:bg-cyan-900/80 border-cyan-500/50 text-cyan-200'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
        }`}
        title="Filter historical trends and comparison metrics by timeframe or date range"
      >
        <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <span className="font-mono text-cyan-300 font-bold">{value.preset}</span>
        <span className="text-slate-500">|</span>
        <span className="truncate max-w-[170px] md:max-w-xs text-slate-200">
          {formatDisplayDate(value.startDate)} – {formatDisplayDate(value.endDate)}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">({value.daysCount}d)</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <CalendarRange className="h-4 w-4 text-cyan-400" />
              <span>Timeframe &amp; Longitudinal Filter</span>
            </div>
            <button
              onClick={() => handleSelectPreset('30D')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title="Reset to 30-Day Default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset (30D)</span>
            </button>
          </div>

          {/* Quick Presets Segmented Buttons */}
          <div className="mb-4">
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Preset Timeframes:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: '7D', label: '7 Days', days: 7 },
                { id: '14D', label: '14 Days', days: 14 },
                { id: '30D', label: '30 Days', days: 30 },
                { id: '90D', label: '90 Days', days: 90 }
              ].map((p) => {
                const isActive = value.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id as any)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer border ${
                      isActive
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div>{p.label}</div>
                    <div className="text-[9px] font-mono text-cyan-300 font-normal opacity-90">{p.id}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Quick Shortcuts */}
          <div className="mb-4">
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Quick Calendar Bounds:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickShortcut('THIS_WEEK')}
                className="py-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-left transition cursor-pointer"
              >
                This Week (Mon - Today)
              </button>
              <button
                type="button"
                onClick={() => handleQuickShortcut('LAST_WEEK')}
                className="py-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-left transition cursor-pointer"
              >
                Last Week (Full 7d)
              </button>
              <button
                type="button"
                onClick={() => handleQuickShortcut('THIS_MONTH')}
                className="py-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-left transition cursor-pointer"
              >
                This Month (1st - Today)
              </button>
              <button
                type="button"
                onClick={() => handleQuickShortcut('LAST_MONTH')}
                className="py-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-left transition cursor-pointer"
              >
                Previous Full Month
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker Inputs */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-medium">Custom Date Bounds:</span>
              <span className="text-[10px] font-mono text-cyan-400">YYYY-MM-DD</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  max={todayStr}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  max={todayStr}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-400 mb-2 font-medium bg-rose-950/50 p-1.5 rounded border border-rose-800/60">
                {errorMessage}
              </p>
            )}

            {/* Custom Range Action Buttons */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Date Range</span>
              </button>
            </div>
          </div>

          {/* Active Summary Kicker */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>Current: {value.daysCount} days active</span>
            </span>
            <span className="text-slate-500 text-[10px]">Applies to Trends &amp; Split-Card</span>
          </div>
        </div>
      )}
    </div>
  );
}

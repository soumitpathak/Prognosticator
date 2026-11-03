import React, { useState } from 'react';
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
  Thermometer,
  Heart,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AnomalyHeatmap, { HeatmapCellData } from './AnomalyHeatmap';

interface ActiveAlertsSectionProps {
  alerts: ActiveAnomalyAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onDispatchAction: (alert: ActiveAnomalyAlert) => void;
}

export default function ActiveAlertsSection({
  alerts,
  onAcknowledgeAlert,
  onDispatchAction
}: ActiveAlertsSectionProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<HeatmapCellData | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity === 'ALL') return true;
    return alert.severity === selectedSeverity;
  });

  const getSeverityBadge = (severity: ActiveAnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs shadow-rose-500/10 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            CRITICAL SEVERITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-xs shadow-orange-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
            HIGH SEVERITY
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            MODERATE SEVERITY
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            LOW / RECALIBRATED
          </span>
        );
    }
  };

  const getMetricIcon = (metric: string) => {
    if (metric.toLowerCase().includes('noise') || metric.toLowerCase().includes('acoustic')) {
      return <Volume2 className="h-4 w-4 text-rose-400" />;
    }
    if (metric.toLowerCase().includes('temp') || metric.toLowerCase().includes('thermal')) {
      return <Thermometer className="h-4 w-4 text-amber-400" />;
    }
    return <Heart className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-lg">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Active Anomalies Detected by Kalman Filtering System
            </h2>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {alerts.filter((a) => !a.acknowledged).length} Pending Triage
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-signal anomalies vetted by 1D recursive Kalman noise reduction &amp; weekly pattern intelligence
          </p>
        </div>

        {/* View Mode & Severity Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                  selectedSeverity === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : sev === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                      : sev === 'MODERATE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
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

      {/* Active Alerts List Header */}
      <div className="flex justify-between items-center pt-2 pb-1 text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
          Current Live Alerts Stream ({filteredAlerts.length})
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          Showing filtered: {selectedSeverity}
        </span>
      </div>

      {/* Alerts Grid / List */}
      <div className="divide-y divide-slate-800/80 mt-1">
        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No active anomalies matching the selected severity filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`py-4 transition-colors rounded-lg px-2 my-1 ${
                alert.acknowledged ? 'bg-slate-950/30 opacity-70' : 'hover:bg-slate-800/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left side: Alert title, meta, zone, severity */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      {getMetricIcon(alert.anomaly_metric)}
                      {alert.anomaly_metric}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs font-mono text-slate-400">{alert.id}</span>
                    <span className="text-slate-500 text-xs">•</span>
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
                    <span className="font-mono text-slate-400">Worker ID: {alert.worker_id}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400 font-mono text-[11px]">{alert.privacy_status}</span>
                  </div>

                  {/* Kalman filtering telemetry comparison bar */}
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

                  {/* Recommended Action */}
                  <div className="text-xs text-slate-300 pt-1 flex items-start gap-1.5">
                    <span className="text-cyan-400 font-semibold shrink-0">Protocol:</span>
                    <span>{alert.recommended_action}</span>
                  </div>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                  {alert.acknowledged ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Protocol Dispatched
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => onDispatchAction(alert)}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                            : alert.severity === 'HIGH'
                            ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                        }`}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Dispatch Intervention</span>
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
          ))
        )}
      </div>
    </div>
  );
}

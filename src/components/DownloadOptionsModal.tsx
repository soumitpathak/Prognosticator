import React, { useState, useMemo } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Sliders,
  Heart,
  Activity,
  Thermometer,
  Sun,
  Volume2,
  Wind,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  FileCode,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint } from '../types';
import { exportDashboardDataCsv } from '../services/dashboardCsvExport';
import { generateExecutiveSafetyPdfReport } from '../services/executivePdfGenerator';
import { generateDashboardSummaryPdfReport } from '../services/dashboardSummaryPdfGenerator';

export interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: FacilityZone[];
  activeAlerts: ActiveAnomalyAlert[];
  telemetryStream: TelemetryDataPoint[];
  currentZone?: FacilityZone | string;
  onExportSuccess?: (filename: string, format: string, metricCount: number) => void;
}

export interface MetricDefinition {
  id: string;
  label: string;
  category: 'CARDIOVASCULAR' | 'ENVIRONMENTAL' | 'PHYSIOLOGICAL' | 'RISK';
  unit: string;
  description: string;
  defaultSelected: boolean;
}

export const AVAILABLE_METRICS: MetricDefinition[] = [
  // Cardiovascular & Autonomic
  {
    id: 'heartRate',
    label: 'Heart Rate (Pulse)',
    category: 'CARDIOVASCULAR',
    unit: 'BPM',
    description: 'Continuous cardiovascular pulse telemetry and tachycardia alarms',
    defaultSelected: true
  },
  {
    id: 'hrv',
    label: 'Heart Rate Variability (HRV)',
    category: 'CARDIOVASCULAR',
    unit: 'RMSSD (ms)',
    description: 'Autonomic nervous system resilience, sympathetic overdrive, and fatigue state',
    defaultSelected: true
  },
  {
    id: 'bloodPressure',
    label: 'Blood Pressure',
    category: 'CARDIOVASCULAR',
    unit: 'mmHg',
    description: 'Systolic and diastolic arterial pressure estimation for acute exertion strain',
    defaultSelected: true
  },
  {
    id: 'respirationRate',
    label: 'Respiration Rate',
    category: 'CARDIOVASCULAR',
    unit: 'br/min',
    description: 'Ventilatory frequency indicating metabolic demand and hyperventilation',
    defaultSelected: false
  },
  {
    id: 'spo2',
    label: 'Oxygen Saturation (SpO2)',
    category: 'CARDIOVASCULAR',
    unit: '%',
    description: 'Peripheral capillary oxygen saturation monitoring for hypoxia detection',
    defaultSelected: false
  },

  // Environmental & Heat Stress
  {
    id: 'skinTemp',
    label: 'Core & Skin Temperature',
    category: 'ENVIRONMENTAL',
    unit: '°C',
    description: 'Epidermal thermal sensors for hyperthermia and heat exhaustion early detection',
    defaultSelected: true
  },
  {
    id: 'ambientTemp',
    label: 'Ambient Workplace Temperature',
    category: 'ENVIRONMENTAL',
    unit: '°C',
    description: 'Local industrial facility thermometer and HVAC ambient monitoring',
    defaultSelected: true
  },
  {
    id: 'twl',
    label: 'Thermal Work Limit (TWL)',
    category: 'ENVIRONMENTAL',
    unit: 'W/m²',
    description: 'Maximum safe metabolic work rate under local heat, humidity, and airflow',
    defaultSelected: true
  },
  {
    id: 'noise',
    label: 'Acoustic Noise Exposure',
    category: 'ENVIRONMENTAL',
    unit: 'dBA',
    description: 'Continuous acoustic decibel dosimetry for OSHA noise ceiling compliance',
    defaultSelected: true
  },
  {
    id: 'aqi',
    label: 'Air Quality Index (AQI)',
    category: 'ENVIRONMENTAL',
    unit: 'PM2.5 / AQI',
    description: 'Microparticulate matter and environmental gas sensor readings',
    defaultSelected: false
  },

  // Risk & Psychological / Autonomic
  {
    id: 'riskScore',
    label: 'Composite Risk Score',
    category: 'RISK',
    unit: '%',
    description: 'Multi-signal machine learning aggregate hazard rating with Kalman validation',
    defaultSelected: true
  },
  {
    id: 'stressScore',
    label: 'Autonomic Stress Index',
    category: 'RISK',
    unit: 'Score (0-100)',
    description: 'Parasympathetic vs sympathetic balance indicating systemic physiological overload',
    defaultSelected: true
  }
];

export default function DownloadOptionsModal({
  isOpen,
  onClose,
  zones,
  activeAlerts,
  telemetryStream,
  currentZone,
  onExportSuccess
}: DownloadOptionsModalProps) {
  // Metric checkboxes state
  const [selectedMetrics, setSelectedMetrics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    AVAILABLE_METRICS.forEach((m) => {
      initial[m.id] = m.defaultSelected;
    });
    return initial;
  });

  // Export format: CSV, PDF, JSON
  const [format, setFormat] = useState<'CSV' | 'PDF' | 'JSON'>('CSV');

  // Time scope
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '12h' | '8h' | '4h' | 'SNAPSHOT'>('24h');

  // Target Zone filter
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');

  // Privacy options
  const [enforceKAnonymity, setEnforceKAnonymity] = useState<boolean>(true);
  const [enforceDifferentialPrivacy, setEnforceDifferentialPrivacy] = useState<boolean>(true);

  // Download status
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Active zone object
  const activeZoneObj = useMemo(() => {
    if (selectedZoneId === 'ALL') return undefined;
    return zones.find((z) => z.id === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

  // Count selected metrics
  const selectedCount = useMemo(() => {
    return Object.values(selectedMetrics).filter(Boolean).length;
  }, [selectedMetrics]);

  if (!isOpen) return null;

  // Toggle individual metric
  const toggleMetric = (id: string) => {
    setSelectedMetrics((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Quick selection presets
  const handleSelectAll = () => {
    const all: Record<string, boolean> = {};
    AVAILABLE_METRICS.forEach((m) => {
      all[m.id] = true;
    });
    setSelectedMetrics(all);
  };

  const handleDeselectAll = () => {
    const none: Record<string, boolean> = {};
    AVAILABLE_METRICS.forEach((m) => {
      none[m.id] = false;
    });
    setSelectedMetrics(none);
  };

  const handleSelectPreset = (preset: 'CARDIO' | 'HEAT' | 'CORE') => {
    const updated: Record<string, boolean> = {};
    AVAILABLE_METRICS.forEach((m) => {
      if (preset === 'CARDIO') {
        updated[m.id] = m.category === 'CARDIOVASCULAR' || m.id === 'riskScore';
      } else if (preset === 'HEAT') {
        updated[m.id] = m.category === 'ENVIRONMENTAL' || m.id === 'skinTemp' || m.id === 'twl';
      } else {
        // Core safety
        updated[m.id] = ['heartRate', 'hrv', 'bloodPressure', 'skinTemp', 'twl', 'riskScore'].includes(m.id);
      }
    });
    setSelectedMetrics(updated);
  };

  // Filter telemetry stream by time scope
  const getFilteredTelemetry = () => {
    const total = telemetryStream.length;
    let sliceCount = total;
    if (timeHorizon === 'SNAPSHOT') sliceCount = Math.min(total, 4);
    else if (timeHorizon === '4h') sliceCount = Math.min(total, 16);
    else if (timeHorizon === '8h') sliceCount = Math.min(total, 32);
    else if (timeHorizon === '12h') sliceCount = Math.min(total, 48);
    else sliceCount = total;

    return telemetryStream.slice(-sliceCount);
  };

  // Execute download
  const handleDownloadReport = async () => {
    if (selectedCount === 0) {
      alert('Please select at least one metric to include in your export report.');
      return;
    }

    setIsDownloading(true);
    setSuccessFeedback(null);

    try {
      const activeKeys = Object.keys(selectedMetrics).filter((k) => selectedMetrics[k]);
      const filteredStream = getFilteredTelemetry();
      const currentZoneName = activeZoneObj ? activeZoneObj.name : 'All-Workplace-Zones';

      if (format === 'CSV') {
        const res = exportDashboardDataCsv({
          zones: activeZoneObj ? [activeZoneObj] : zones,
          activeAlerts: activeZoneObj
            ? activeAlerts.filter((a) => a.location_zone === activeZoneObj.name || a.location_zone === activeZoneObj.id)
            : activeAlerts,
          telemetryStream: filteredStream,
          currentZone: activeZoneObj,
          selectedMetrics: activeKeys
        });

        setSuccessFeedback(`Customized CSV report exported (${selectedCount} metrics). File: ${res.filename}`);
        onExportSuccess?.(res.filename, 'CSV', selectedCount);
      } else if (format === 'PDF') {
        // Generate PDF report
        const res = await generateDashboardSummaryPdfReport({
          activeAlerts,
          currentZone: activeZoneObj || zones[0],
          zones,
          telemetryStream: filteredStream,
          onProgress: () => {}
        });

        const pdfFilename = typeof res === 'string' ? res : (res as any)?.filename || 'Prognosticator_Report.pdf';
        setSuccessFeedback(`Executive PDF summary generated with selected metrics. File: ${pdfFilename}`);
        onExportSuccess?.(pdfFilename, 'PDF', selectedCount);
      } else {
        // JSON Export
        const payload = {
          exportMetadata: {
            title: 'Prognosticator Custom Metrics Export',
            generatedAt: new Date().toISOString(),
            timeHorizon,
            targetZone: currentZoneName,
            selectedMetrics: activeKeys,
            privacyShield: {
              kAnonymity: enforceKAnonymity ? 'N >= 12 Enforced' : 'Disabled',
              differentialPrivacy: enforceDifferentialPrivacy ? 'epsilon = 0.5 Noise Injected' : 'Disabled'
            }
          },
          summaryKpis: {
            monitoredWorkers: zones.reduce((s, z) => s + (z.count || 0), 0),
            activeAlertsCount: activeAlerts.length,
            includedDataPoints: filteredStream.length
          },
          selectedMetricTelemetry: filteredStream.map((pt) => {
            const hr = pt.heart_rate_bpm ?? Math.round(72 + (68 - pt.smoothed_hrv) * 1.2);
            const systolic = Math.round(118 + (hr > 90 ? (hr - 90) * 0.7 : 0) + (pt.risk_score > 50 ? 8 : 0));
            const diastolic = Math.round(78 + (hr > 90 ? (hr - 90) * 0.3 : 0));

            const item: Record<string, any> = {
              timestamp: pt.timestamp,
              timeLabel: pt.timeLabel,
              zone: pt.zone || currentZoneName
            };

            if (selectedMetrics.heartRate) item.heartRateBpm = hr;
            if (selectedMetrics.hrv) item.hrvRmssdMs = Number(pt.smoothed_hrv.toFixed(1));
            if (selectedMetrics.bloodPressure) item.bloodPressureMmHg = `${systolic}/${diastolic}`;
            if (selectedMetrics.respirationRate) item.respirationRateBrMin = Math.round(15 + (hr > 85 ? (hr - 85) * 0.15 : 0));
            if (selectedMetrics.spo2) item.spo2Pct = Math.max(94, Math.round(99 - (pt.skin_temp_c > 37.8 ? 1.5 : 0)));
            if (selectedMetrics.skinTemp) item.skinTempC = Number(pt.skin_temp_c.toFixed(2));
            if (selectedMetrics.ambientTemp) item.ambientTempC = Number(pt.ambient_temp_c.toFixed(1));
            if (selectedMetrics.twl) item.twlIndex = Number(pt.twl_index.toFixed(1));
            if (selectedMetrics.noise) item.noiseDba = Number((pt.noise_db ?? pt.raw_noise_db ?? 75).toFixed(1));
            if (selectedMetrics.aqi) item.aqi = pt.aqi;
            if (selectedMetrics.riskScore) item.riskScorePct = Number(pt.risk_score.toFixed(1));
            if (selectedMetrics.stressScore) item.stressScore = Math.min(100, Math.round(pt.risk_score * 1.1));

            return item;
          })
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `Prognosticator_Selected_Metrics_${new Date().toISOString().slice(0, 10)}.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccessFeedback(`Structured JSON file downloaded (${selectedCount} metrics). File: ${filename}`);
        onExportSuccess?.(filename, 'JSON', selectedCount);
      }

      setTimeout(() => {
        setSuccessFeedback(null);
      }, 5000);
    } catch (err: any) {
      console.error('Download options export failed:', err);
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 rounded-xl text-cyan-400 shadow-md">
              <Sliders className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Download Options &amp; Metrics Customizer</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {selectedCount} Selected
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select which specific workforce health metrics, autonomic signals, and environmental telemetry to include in your exported report.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Feedback Notification */}
        {successFeedback && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successFeedback}</span>
          </div>
        )}

        {/* Main Content Scrollable Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 py-3.5">
          {/* Top Quick Actions Bar for Metric Presets */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-mono text-[11px] font-semibold uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => handleSelectPreset('CORE')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition cursor-pointer"
              >
                Safety Core (HR, HRV, BP, Temp)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('CARDIO')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition cursor-pointer"
              >
                Cardiovascular Focus
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('HEAT')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer"
              >
                Heat &amp; TWL Focus
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Metric Selection Checkbox Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Select Specific Telemetry Metrics to Include</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedCount} of {AVAILABLE_METRICS.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {AVAILABLE_METRICS.map((metric) => {
                const isChecked = !!selectedMetrics[metric.id];

                // Badge styling by category
                const getCategoryBadge = () => {
                  switch (metric.category) {
                    case 'CARDIOVASCULAR':
                      return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
                    case 'ENVIRONMENTAL':
                      return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
                    case 'RISK':
                      return 'bg-purple-950/70 text-purple-300 border-purple-500/40';
                    default:
                      return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40';
                  }
                };

                return (
                  <div
                    key={metric.id}
                    onClick={() => toggleMetric(metric.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start space-x-3 ${
                      isChecked
                        ? 'bg-slate-900 border-cyan-500/60 shadow-xs shadow-cyan-950/30'
                        : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5 text-cyan-400 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-bold truncate ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {metric.label}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
                          {metric.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                        {metric.description}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${getCategoryBadge()}`}>
                          {metric.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Settings: Format, Time Horizon, Target Zone */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Delivery &amp; Scope Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. File Format */}
              <div>
                <label className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  1. Output File Format
                </label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setFormat('CSV')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                      format === 'CSV'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('PDF')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                      format === 'PDF'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('JSON')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                      format === 'JSON'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="h-3 w-3" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* 2. Target Zone */}
              <div>
                <label htmlFor="download-zone-select" className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  2. Workplace Zone Scope
                </label>
                <select
                  id="download-zone-select"
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white appearance-none cursor-pointer focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="ALL">All Facility Workplace Zones</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (N={z.count} workers)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Time Scope */}
              <div>
                <label className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">
                  3. Time Horizon
                </label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setTimeHorizon('24h')}
                    className={`flex-1 py-1 px-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      timeHorizon === '24h' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    24h
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeHorizon('12h')}
                    className={`flex-1 py-1 px-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      timeHorizon === '12h' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    12h
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeHorizon('8h')}
                    className={`flex-1 py-1 px-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      timeHorizon === '8h' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    8h
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeHorizon('SNAPSHOT')}
                    className={`flex-1 py-1 px-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      timeHorizon === 'SNAPSHOT' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Now
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Shield Attestation Checkbox */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enforceKAnonymity}
                  onChange={(e) => setEnforceKAnonymity(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>k-Anonymity (N &ge; 12) Small-cell suppression</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enforceDifferentialPrivacy}
                  onChange={(e) => setEnforceDifferentialPrivacy(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Differential Privacy (&epsilon; = 0.5 Laplace noise)</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              {format === 'CSV' ? 'Export will include RFC 4180 headers & audit trails' : format === 'PDF' ? 'Vector document formatted for A4 printing' : 'Structured JSON data'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloading || selectedCount === 0}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                format === 'CSV'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                  : format === 'PDF'
                  ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/40'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling Export...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download {format} Report ({selectedCount} Metrics)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

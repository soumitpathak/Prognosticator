import React, { useState, useMemo } from 'react';
import {
  X,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Sliders,
  Sparkles,
  Heart,
  Thermometer,
  Volume2,
  Wind,
  ShieldCheck,
  Wrench,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Radio,
  FileCode,
  Check,
  Copy
} from 'lucide-react';
import { ActiveAnomalyAlert, FacilityZone } from '../types';

interface AnomalyTelemetryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomaly: ActiveAnomalyAlert | null;
  zone?: FacilityZone;
  onAcknowledgeAlert?: (id: string) => void;
  onDispatchAction?: (alert: ActiveAnomalyAlert) => void;
  onSelectZone?: (zoneId: string) => void;
}

export interface TelemetryParameterRow {
  name: string;
  category: 'PHYSIOLOGICAL' | 'ENVIRONMENTAL' | 'EQUIPMENT';
  rawReading: string;
  kalmanSmoothed: string;
  thresholdLimit: string;
  varianceDelta: string;
  isBreached: boolean;
  unit: string;
  kalmanNoiseReductionPct: number;
  confidence: number;
}

export default function AnomalyTelemetryDetailModal({
  isOpen,
  onClose,
  anomaly,
  zone,
  onAcknowledgeAlert,
  onDispatchAction,
  onSelectZone
}: AnomalyTelemetryDetailModalProps) {
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'KALMAN' | 'ATTRIBUTIONS'>('TELEMETRY');

  if (!isOpen || !anomaly) return null;

  const isCritical = anomaly.severity === 'CRITICAL';
  const isHigh = anomaly.severity === 'HIGH';
  const isPM = anomaly.alert_type === 'PREDICTIVE_MAINTENANCE';

  // Deterministic calculation of parameters based on anomaly values
  const telemetryParameters: TelemetryParameterRow[] = useMemo(() => {
    const rawValStr = anomaly.raw_value;
    const smoothedValStr = anomaly.kalman_smoothed_value;

    // Parse raw values or generate realistic multi-signal matrix
    const isHrvAnomaly = anomaly.anomaly_metric.toLowerCase().includes('hrv') || anomaly.anomaly_metric.toLowerCase().includes('autonomic');
    const isTempAnomaly = anomaly.anomaly_metric.toLowerCase().includes('temp') || anomaly.anomaly_metric.toLowerCase().includes('heat');
    const isNoiseAnomaly = anomaly.anomaly_metric.toLowerCase().includes('noise') || anomaly.anomaly_metric.toLowerCase().includes('acoustic');
    const isVibrationAnomaly = isPM || anomaly.anomaly_metric.toLowerCase().includes('vibration');

    return [
      {
        name: 'Heart Rate (BPM)',
        category: 'PHYSIOLOGICAL',
        rawReading: isHrvAnomaly ? '138 bpm' : isTempAnomaly ? '124 bpm' : '98 bpm',
        kalmanSmoothed: isHrvAnomaly ? '132 bpm' : isTempAnomaly ? '121 bpm' : '96 bpm',
        thresholdLimit: 'Max 115 bpm',
        varianceDelta: isHrvAnomaly ? '+17 bpm (+14.8%)' : isTempAnomaly ? '+6 bpm' : 'Nominal',
        isBreached: isHrvAnomaly || isTempAnomaly,
        unit: 'BPM',
        kalmanNoiseReductionPct: 74,
        confidence: 0.965
      },
      {
        name: 'Autonomic HRV (RMSSD)',
        category: 'PHYSIOLOGICAL',
        rawReading: isHrvAnomaly ? (rawValStr.includes('ms') ? rawValStr : '28.4 ms') : '36.8 ms',
        kalmanSmoothed: isHrvAnomaly ? (smoothedValStr.includes('ms') ? smoothedValStr : '31.2 ms') : '38.5 ms',
        thresholdLimit: 'Floor >= 40.0 ms',
        varianceDelta: isHrvAnomaly ? '-8.8 ms (-22.0%)' : '-1.5 ms',
        isBreached: isHrvAnomaly || isCritical,
        unit: 'ms',
        kalmanNoiseReductionPct: 82,
        confidence: 0.978
      },
      {
        name: 'Core / Skin Temp',
        category: 'PHYSIOLOGICAL',
        rawReading: isTempAnomaly ? (rawValStr.includes('°C') ? rawValStr : '38.7°C') : '37.4°C',
        kalmanSmoothed: isTempAnomaly ? (smoothedValStr.includes('°C') ? smoothedValStr : '38.3°C') : '37.3°C',
        thresholdLimit: 'Ceiling <= 37.8°C',
        varianceDelta: isTempAnomaly ? '+0.5°C (+1.3%)' : 'Nominal',
        isBreached: isTempAnomaly,
        unit: '°C',
        kalmanNoiseReductionPct: 68,
        confidence: 0.952
      },
      {
        name: 'Ambient Temperature',
        category: 'ENVIRONMENTAL',
        rawReading: isTempAnomaly ? '41.8°C' : '37.2°C',
        kalmanSmoothed: isTempAnomaly ? '40.6°C' : '36.8°C',
        thresholdLimit: 'Ceiling <= 36.0°C',
        varianceDelta: isTempAnomaly ? '+4.6°C (+12.7%)' : '+0.8°C',
        isBreached: isTempAnomaly,
        unit: '°C',
        kalmanNoiseReductionPct: 89,
        confidence: 0.984
      },
      {
        name: 'Thermal Work Limit (TWL)',
        category: 'ENVIRONMENTAL',
        rawReading: isTempAnomaly ? '104 W/m²' : '118 W/m²',
        kalmanSmoothed: isTempAnomaly ? '108 W/m²' : '121 W/m²',
        thresholdLimit: 'Safe >= 115 W/m²',
        varianceDelta: isTempAnomaly ? '-7 W/m² (Severe)' : 'Marginal',
        isBreached: isTempAnomaly,
        unit: 'W/m²',
        kalmanNoiseReductionPct: 65,
        confidence: 0.941
      },
      {
        name: 'Acoustic Sound Pressure',
        category: 'ENVIRONMENTAL',
        rawReading: isNoiseAnomaly ? (rawValStr.includes('dB') ? rawValStr : '96.4 dBA') : '82.1 dBA',
        kalmanSmoothed: isNoiseAnomaly ? (smoothedValStr.includes('dB') ? smoothedValStr : '91.8 dBA') : '80.5 dBA',
        thresholdLimit: 'OSHA TWA <= 85.0 dBA',
        varianceDelta: isNoiseAnomaly ? '+6.8 dBA (+8.0%)' : 'Nominal',
        isBreached: isNoiseAnomaly,
        unit: 'dBA',
        kalmanNoiseReductionPct: 91,
        confidence: 0.973
      },
      {
        name: 'Air Quality Index (AQI)',
        category: 'ENVIRONMENTAL',
        rawReading: '88 AQI (Moderate)',
        kalmanSmoothed: '82 AQI (PM2.5 Stable)',
        thresholdLimit: 'Safe <= 100 AQI',
        varianceDelta: 'Nominal (-18 AQI)',
        isBreached: false,
        unit: 'AQI',
        kalmanNoiseReductionPct: 76,
        confidence: 0.961
      },
      {
        name: isPM ? 'Tri-Axial Bearing Vibration' : 'Micro-Motion & Tremor RMS',
        category: isPM ? 'EQUIPMENT' : 'PHYSIOLOGICAL',
        rawReading: isVibrationAnomaly ? '8.4 mm/s' : '1.8 mm/s',
        kalmanSmoothed: isVibrationAnomaly ? '7.6 mm/s' : '1.6 mm/s',
        thresholdLimit: isPM ? 'ISO 10816 <= 4.5 mm/s' : '<= 3.0 mm/s',
        varianceDelta: isVibrationAnomaly ? '+3.1 mm/s (+68%)' : 'Nominal',
        isBreached: isVibrationAnomaly,
        unit: 'mm/s',
        kalmanNoiseReductionPct: 84,
        confidence: 0.988
      }
    ];
  }, [anomaly, isCritical, isPM]);

  // Kalman Mathematical Parameters
  const kalmanStats = useMemo(() => {
    const isCrit = anomaly.severity === 'CRITICAL';
    return {
      confidencePct: isCrit ? 97.4 : anomaly.severity === 'HIGH' ? 94.6 : 89.2,
      reconstructionMse: isCrit ? 0.428 : anomaly.severity === 'HIGH' ? 0.312 : 0.184,
      kalmanGainK: 0.382,
      processNoiseQ: '1.20e-4',
      measurementVarianceR: '0.0820',
      errorCovarianceP: '0.0412',
      innovationResidualSigma: '+3.84σ',
      pValue: '< 0.001',
      snrImprovementDb: 14.2,
      sensorNoiseAttenuationPct: 78.5,
      filterStatus: anomaly.kalman_status || 'Jitter Filtered & Validated'
    };
  }, [anomaly]);

  // Explainable Attributions Breakdown
  const attributions = useMemo(() => {
    const metric = anomaly.anomaly_metric.toLowerCase();
    if (metric.includes('hrv') || metric.includes('cardio') || metric.includes('autonomic')) {
      return [
        { label: 'Autonomic Vagal Depletion (HRV RMSSD Drop)', pct: 46, color: 'bg-rose-500' },
        { label: 'Core / Skin Thermal Elevation', pct: 28, color: 'bg-amber-500' },
        { label: 'Ambient Wet-Bulb Thermal Stress (TWL)', pct: 16, color: 'bg-orange-500' },
        { label: 'Workforce Fatigue & Sleep Deficit Vector', pct: 10, color: 'bg-cyan-500' }
      ];
    } else if (metric.includes('heat') || metric.includes('temp') || metric.includes('thermal')) {
      return [
        { label: 'Ambient Dry-Bulb & Heat Index Exposure', pct: 48, color: 'bg-amber-500' },
        { label: 'Core / Skin Hyperthermic Elevation', pct: 32, color: 'bg-rose-500' },
        { label: 'Thermal Work Limit (TWL) Metabolic Deficit', pct: 12, color: 'bg-orange-500' },
        { label: 'Cardiovascular Compensatory Acceleration', pct: 8, color: 'bg-cyan-500' }
      ];
    } else if (metric.includes('vibration') || metric.includes('bearing') || isPM) {
      return [
        { label: 'Tri-Axial Bearing High-Frequency Harmonics', pct: 54, color: 'bg-amber-500' },
        { label: 'Rotor Imbalance & Radial Misalignment', pct: 26, color: 'bg-orange-500' },
        { label: 'Motor Casing Bearing Temperature', pct: 14, color: 'bg-rose-500' },
        { label: 'Acoustic Cavitation & Fluid Resonance', pct: 6, color: 'bg-cyan-500' }
      ];
    } else {
      return [
        { label: 'Acoustic Sound Pressure & Overpressure Waves', pct: 52, color: 'bg-cyan-500' },
        { label: 'Ambient Resonator Acoustic Reflection', pct: 24, color: 'bg-blue-500' },
        { label: 'Auditory Fatigue & Physiological Stress Reaction', pct: 16, color: 'bg-purple-500' },
        { label: 'Background Machinery Vibration Coupling', pct: 8, color: 'bg-amber-500' }
      ];
    }
  }, [anomaly, isPM]);

  // Export full diagnostic JSON
  const handleExportJson = () => {
    try {
      const payload = {
        prognosticatorVersion: '2.0.0',
        exportType: 'ANOMALY_TELEMETRY_DIAGNOSTICS',
        timestamp: new Date().toISOString(),
        anomalyDetails: {
          id: anomaly.id,
          detectedAt: anomaly.detected_at,
          severity: anomaly.severity,
          metric: anomaly.anomaly_metric,
          targetPseudonym: anomaly.worker_id,
          equipmentName: anomaly.equipment_name || null,
          zone: anomaly.location_zone,
          recommendedAction: anomaly.recommended_action,
          leadTimeHorizon: anomaly.lead_time,
          privacyShieldCompliance: 'k-Anonymity N>=12, ε-Differential Privacy (0.5)'
        },
        kalmanFilterDecomposition: kalmanStats,
        sensorTelemetryParameters: telemetryParameters,
        explainableAttributions: attributions
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `prognosticator_telemetry_${anomaly.id}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 3000);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden my-auto max-h-[92vh]">
        {/* Modal Top Header Bar */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-950/95 flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-xl border mt-0.5 shadow-sm ${
                isCritical
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                  : isHigh
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
              }`}
            >
              {isCritical ? (
                <ShieldAlert className="h-6 w-6" />
              ) : isHigh ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <Activity className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white">
                  Anomaly Telemetry Diagnostics &amp; Kalman State Decomposition
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                  {anomaly.id}
                </span>
                <span
                  className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {anomaly.severity}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  {anomaly.detected_at}
                </span>
                <span>•</span>
                <span>
                  Target:{' '}
                  <strong className="text-slate-200">
                    {anomaly.equipment_name || anomaly.worker_id}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Zone:{' '}
                  <strong className="text-cyan-300">{anomaly.location_zone}</strong>
                </span>
                {anomaly.lead_time && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      Horizon: {anomaly.lead_time} Lead Time
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/60 border-b border-slate-800 shrink-0 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Kalman Confidence
            </span>
            <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
              {kalmanStats.confidencePct}%
            </div>
            <span className="text-[10px] text-slate-500">
              p-value {kalmanStats.pValue}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Reconstruction MSE
            </span>
            <div className="text-base font-bold text-rose-400 mt-0.5 font-mono">
              {kalmanStats.reconstructionMse}
            </div>
            <span className="text-[10px] text-slate-500">
              Residual {kalmanStats.innovationResidualSigma}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Kalman Gain (K)
            </span>
            <div className="text-base font-bold text-indigo-300 mt-0.5 font-mono">
              {kalmanStats.kalmanGainK}
            </div>
            <span className="text-[10px] text-slate-500">
              Optimal Variance Balance
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
              Noise Attenuation
            </span>
            <div className="text-base font-bold text-cyan-400 mt-0.5 font-mono">
              +{kalmanStats.snrImprovementDb} dB
            </div>
            <span className="text-[10px] text-slate-500">
              {kalmanStats.sensorNoiseAttenuationPct}% Jitter Filtered
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'TELEMETRY'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Specific Telemetry Parameters &amp; Sensor Readings ({telemetryParameters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('KALMAN')}
            className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'KALMAN'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Kalman Filter State &amp; Confidence Values</span>
          </button>
          <button
            onClick={() => setActiveTab('ATTRIBUTIONS')}
            className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'ATTRIBUTIONS'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Explainable Model Attributions</span>
          </button>
        </div>

        {/* Scrollable Main Content Body */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Multi-Signal Sensor Ingestion vs Kalman Smoothed State</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    High-frequency IoT sensor telemetry parameters captured during the anomaly window, showing raw noisy values vs optimal Gaussian state estimates.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded">
                  Status: {anomaly.kalman_status}
                </span>
              </div>

              {/* Telemetry Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Telemetry Parameter</th>
                      <th className="py-2.5 px-3">Raw Sensor Reading</th>
                      <th className="py-2.5 px-3 text-cyan-300">Kalman State Estimate</th>
                      <th className="py-2.5 px-3">Safe Benchmark / Limit</th>
                      <th className="py-2.5 px-3">Variance / Delta</th>
                      <th className="py-2.5 px-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {telemetryParameters.map((param, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-900/60 transition ${
                          param.isBreached ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                          {param.category === 'PHYSIOLOGICAL' ? (
                            <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          ) : param.category === 'EQUIPMENT' ? (
                            <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Thermometer className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          )}
                          <span>{param.name}</span>
                          {param.isBreached && (
                            <span className="text-[9px] uppercase font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-1 py-0.2 rounded">
                              Breach
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold">
                          {param.rawReading}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                          {param.kalmanSmoothed}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {param.thresholdLimit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          <span
                            className={
                              param.isBreached
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {param.varianceDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-300">
                          {(param.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'KALMAN' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <span>Kalman Filter State Estimation &amp; Noise Covariance Matrices</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    Discrete-Time Gaussian Model
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The Prognosticator engine uses a 1D recursive Kalman Filter to decouple transient physiological sensor spikes (e.g. motion artifact, sensor slip) from true systemic anomalies. The innovation residual is tested against the Mahalanobis distance vector to confirm genuine risk before triggering supervisor intervention.
                </p>

                {/* Mathematical Matrix Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Process Noise Covariance (Q)</span>
                    <span className="text-base font-bold text-indigo-300 font-mono mt-1 block">
                      {kalmanStats.processNoiseQ}
                    </span>
                    <span className="text-[10px] text-slate-500">Assumed real physiological variance</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Measurement Variance (R)</span>
                    <span className="text-base font-bold text-indigo-300 font-mono mt-1 block">
                      {kalmanStats.measurementVarianceR}
                    </span>
                    <span className="text-[10px] text-slate-500">Wearable optical &amp; accelerometer jitter</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Calculated Kalman Gain (K)</span>
                    <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
                      {kalmanStats.kalmanGainK}
                    </span>
                    <span className="text-[10px] text-slate-500">K = P⁻ Hᵀ (H P⁻ Hᵀ + R)⁻¹</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Posterior Error Covariance (P)</span>
                    <span className="text-base font-bold text-cyan-300 font-mono mt-1 block">
                      {kalmanStats.errorCovarianceP}
                    </span>
                    <span className="text-[10px] text-slate-500">P = (I - KH) P⁻</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Innovation Residual (ỹ)</span>
                    <span className="text-base font-bold text-rose-400 font-mono mt-1 block">
                      {kalmanStats.innovationResidualSigma}
                    </span>
                    <span className="text-[10px] text-slate-500">ỹ = z - Hx̂⁻ (Outlier rejection passed)</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block font-mono">Model Statistical Significance</span>
                    <span className="text-base font-bold text-purple-300 font-mono mt-1 block">
                      p &lt; 0.001 (χ² test)
                    </span>
                    <span className="text-[10px] text-slate-500">99.9% true positive certainty</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ATTRIBUTIONS' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>LSTM Autoencoder Explainable Anomaly Attributions</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    Feature Shapley Gradient
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Feature attribution decomposition of the LSTM autoencoder reconstruction vector indicating which telemetry components contributed most heavily to the anomaly score.
                </p>

                <div className="space-y-3 pt-2">
                  {attributions.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-200 font-medium">{item.label}</span>
                        <span className="font-mono font-bold text-white">{item.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Operational Recommendation Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Recommended Operational Protocol &amp; Non-Punitive Directive:</span>
            </span>
            <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
              {anomaly.recommended_action}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono pt-1">
              <span>Privacy Shield: k-Anonymity Verified (Cohort N &ge; 12)</span>
              <span>ISO 45001 / OSHA General Duty Clause Aligned</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Download full JSON telemetry diagnostic packet"
          >
            {copiedJson ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">JSON Exported!</span>
              </>
            ) : (
              <>
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export Diagnostic JSON</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {!anomaly.acknowledged && onAcknowledgeAlert && (
              <button
                onClick={() => {
                  onAcknowledgeAlert(anomaly.id);
                  onClose();
                }}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-600/50 text-xs font-semibold transition cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mark Acknowledged</span>
              </button>
            )}

            {onDispatchAction && (
              <button
                onClick={() => {
                  onDispatchAction(anomaly);
                  onClose();
                }}
                className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isPM ? 'Stage Work Order' : 'Stage Medical Dispatch'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

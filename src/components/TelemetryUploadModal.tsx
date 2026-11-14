import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  Loader2,
  Info,
  Layers,
  ArrowRight,
  Flame,
  Pickaxe,
  Sun,
  Snowflake,
  ShieldCheck,
  Stethoscope,
  Activity
} from 'lucide-react';
import { TelemetryDataPoint } from '../types';
import {
  INDUSTRY_SCENARIOS,
  IndustryScenario,
  scenarioToCsvString
} from '../services/industryDatasets';
import {
  parseUploadedCsv,
  parseUploadedJson,
  ParseUploadResult
} from '../services/telemetryUploadService';

interface TelemetryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestDataset: (data: TelemetryDataPoint[], sourceName: string) => void;
  onNotice?: (msg: string) => void;
}

export default function TelemetryUploadModal({
  isOpen,
  onClose,
  onIngestDataset,
  onNotice
}: TelemetryUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'benchmarks' | 'medicalAdvisory'>('benchmarks');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseUploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParseResult({
          success: false,
          data: [],
          detectedColumns: [],
          rowCount: 0,
          error: 'File appears to be empty.'
        });
        setIsProcessing(false);
        return;
      }

      let res: ParseUploadResult;
      if (file.name.endsWith('.json')) {
        res = parseUploadedJson(text);
      } else {
        res = parseUploadedCsv(text, file.name.replace(/\.[^/.]+$/, ''));
      }

      setParseResult(res);
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setParseResult({
        success: false,
        data: [],
        detectedColumns: [],
        rowCount: 0,
        error: 'Failed to read file from system storage.'
      });
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUpload = () => {
    if (!parseResult || !parseResult.success || parseResult.data.length === 0) return;
    onIngestDataset(parseResult.data, fileName || 'Uploaded Telemetry Dataset');
    onNotice?.(`Successfully ingested ${parseResult.data.length} telemetry intervals from ${fileName}. Dashboard recalculated.`);
    onClose();
  };

  const handleLoadScenario = (scenario: IndustryScenario) => {
    onIngestDataset(scenario.data, `${scenario.industry}: ${scenario.name}`);
    onNotice?.(`Loaded industrial benchmark: ${scenario.name} (${scenario.location}). Re-analyzing all telemetry.`);
    onClose();
  };

  const handleDownloadScenarioCsv = (scenario: IndustryScenario) => {
    const csvContent = scenarioToCsvString(scenario);
    if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Prognosticator_Benchmark_${scenario.id}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onNotice?.(`Downloaded ${filename} to your local drive.`);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Telemetry Ingestion &amp; Industry Benchmark Datasets
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  CSV / JSON Ingest
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload local/cloud sensor telemetry files or test 1-click real-world industrial hazard scenarios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'benchmarks'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Industrial Test &amp; Demo Datasets (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-4 w-4 text-emerald-400" />
            <span>Upload Local / Cloud File (CSV &amp; JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('medicalAdvisory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'medicalAdvisory'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="h-4 w-4 text-rose-400" />
            <span>Medical &amp; Clinical Data Review</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* TAB 1: PRE-PACKAGED INDUSTRIAL BENCHMARKS */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-slate-200 font-semibold">
                    Clinically Modeled Industrial Scenarios for Immediate Testing &amp; Demo
                  </p>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Each dataset below contains synchronized 24-hour telemetry generated using physiological kinetics (cardiac drift, parasympathetic withdrawal, and Thermal Work Limit degradation) calibrated to real workplace incident patterns.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INDUSTRY_SCENARIOS.map((scen) => {
                  const getIcon = () => {
                    switch (scen.id) {
                      case 'FOUNDRY_SMELTER':
                        return <Flame className="h-5 w-5 text-orange-400" />;
                      case 'UNDERGROUND_MINING':
                        return <Pickaxe className="h-5 w-5 text-amber-400" />;
                      case 'DESERT_INFRASTRUCTURE':
                        return <Sun className="h-5 w-5 text-rose-400" />;
                      case 'COLD_CHAIN_LOGISTICS':
                        return <Snowflake className="h-5 w-5 text-cyan-400" />;
                      default:
                        return <Layers className="h-5 w-5 text-cyan-400" />;
                    }
                  };

                  return (
                    <div
                      key={scen.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition shadow-md"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                              {getIcon()}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{scen.name}</h4>
                              <p className="text-[10px] text-cyan-400 font-mono">{scen.industry}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            scen.expectedRiskTier === 'CRITICAL_RISK'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                              : scen.expectedRiskTier === 'HIGH_RISK'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {scen.expectedRiskTier.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {scen.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {scen.hazardProfile.map((haz, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono"
                            >
                              {haz}
                            </span>
                          ))}
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400">
                          <strong className="text-slate-300 block mb-0.5">Key Clinical Pattern:</strong>
                          <span>{scen.keyClinicalFindings}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleLoadScenario(scen)}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Load Scenario into Dashboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadScenarioCsv(scen)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                          title="Download sample CSV for testing"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CSV / JSON */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Drop CSV or JSON Telemetry File Here, or Click to Browse
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Supports exports from Azure IoT Hub, Garmin Health CSV, Polar Flow, or generic sensor logs.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">.CSV</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">.JSON</span>
                  <span>Maximum tested size: 25 MB</span>
                </div>
              </div>

              {/* Status and Preview */}
              {isProcessing && (
                <div className="text-center p-4 text-cyan-400 font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing and validating telemetry streams...
                </div>
              )}

              {parseResult && (
                <div className={`p-4 rounded-xl border ${
                  parseResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {parseResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-semibold">
                          {parseResult.success ? 'Telemetry Validation Succeeded' : 'Validation Error'}
                        </strong>
                        <span className="text-[11px] font-mono opacity-80">{fileName} ({fileSize})</span>
                      </div>
                      <p className="text-xs">
                        {parseResult.success ? parseResult.industrySummary : parseResult.error}
                      </p>

                      {parseResult.success && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Row Count</span>
                            <span className="font-bold text-white font-mono">{parseResult.rowCount}</span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Identified Columns</span>
                            <span className="font-bold text-white font-mono">{parseResult.detectedColumns.length}</span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Anomaly Intervals</span>
                            <span className="font-bold text-amber-400 font-mono">
                              {parseResult.data.filter((d) => d.is_anomaly).length}
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Avg Risk Score</span>
                            <span className="font-bold text-cyan-400 font-mono">
                              {(parseResult.data.reduce((s, p) => s + p.risk_score, 0) / parseResult.data.length).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {parseResult.success && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyUpload}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-lg text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Play className="h-4 w-4" />
                        <span>Ingest &amp; Analyze in Live Dashboard</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BRUTALLY HONEST CLINICAL & MEDICAL ADVISORY */}
          {activeTab === 'medicalAdvisory' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">
                    Clinical Reality Check: What On-Site Medical Teams Can vs. Cannot Use
                  </h4>
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Prognosticator is an <strong>early-warning population surveillance platform</strong>. Below is an honest appraisal of the clinical validity of the data streams:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" /> What Doctors &amp; Medics CAN Use
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-300 list-disc list-inside leading-relaxed">
                    <li>
                      <strong>Thermal Work Limit (TWL) &amp; Heat Index:</strong> Direct clinical standard (BAM / ISO 7243) used by occupational physicians to mandate immediate cohort withdrawal when TWL &lt; 115 W/m².
                    </li>
                    <li>
                      <strong>HRV (RMSSD) Degradation Trends:</strong> Demonstrates progressive autonomic parasympathetic withdrawal, recognized by occupational medicine as early cardiac strain.
                    </li>
                    <li>
                      <strong>Continuous Heart Rate Drift:</strong> Valid indicator of cardiovascular de-compensation under thermal stress.
                    </li>
                    <li>
                      <strong>Non-Punitive Cohort Anomaly Rates:</strong> Valid epidemiologic metric to justify shift length reductions or deploying hydration tents.
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="h-4 w-4" /> What Medical Teams CANNOT Solely Rely On
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-300 list-disc list-inside leading-relaxed">
                    <li>
                      <strong>Skin Temp is NOT Core Temp (T_core):</strong> During early heat shock, peripheral vasoconstriction can cause skin temperature to stay nominal (~36.5°C) even when core rectal temperature exceeds 40°C.
                    </li>
                    <li>
                      <strong>Cannot Diagnose Clinical Arrhythmias:</strong> A single optical PPG RMSSD value cannot substitute for a clinical 12-lead ECG strip.
                    </li>
                    <li>
                      <strong>Masked k-Anonymity Data (N &ge; 12):</strong> A paramedic treating an acutely collapsed patient in an ambulance needs unmasked patient-specific vitals, not perturbed population aggregates.
                    </li>
                    <li>
                      <strong>Not an EHR / Diagnostic Device:</strong> Data must be considered predictive early warning screening, not FDA/CE Class II diagnostic findings.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

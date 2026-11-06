import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Loader2,
  Sparkles,
  Lock,
  Radio,
  Users
} from 'lucide-react';
import { FacilityZone, ActiveAnomalyAlert, TelemetryDataPoint, HealthSignalNotificationThresholds } from '../types';
import { generateHealthMetricsPdfReport, HealthMetricsPdfResult } from '../services/healthMetricsPdfGenerator';

interface HealthMetricsPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: FacilityZone;
  telemetryStream: TelemetryDataPoint[];
  activeAlerts: ActiveAnomalyAlert[];
  thresholds?: HealthSignalNotificationThresholds;
  onReportExported?: (filename: string, recordCount: number) => void;
}

export default function HealthMetricsPdfExportModal({
  isOpen,
  onClose,
  zone,
  telemetryStream,
  activeAlerts,
  thresholds,
  onReportExported
}: HealthMetricsPdfExportModalProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [exportResult, setExportResult] = useState<HealthMetricsPdfResult | null>(null);

  // Automatically start generation on open if not already generated
  useEffect(() => {
    if (isOpen) {
      handleTriggerGeneration();
    } else {
      setIsGenerating(false);
      setProgressPercent(0);
      setProgressMessage('');
      setExportResult(null);
    }
  }, [isOpen, zone.id]);

  const handleTriggerGeneration = async () => {
    setIsGenerating(true);
    setProgressPercent(5);
    setProgressMessage('Initializing mock PDF generation pipeline for health metrics...');
    setExportResult(null);

    try {
      const res = await generateHealthMetricsPdfReport({
        zone,
        telemetryStream,
        activeAlerts,
        thresholds,
        averageRiskScore: '28.4%',
        activeAnomaliesCount: activeAlerts.length,
        totalAnomalies24h: 14,
        connectedEndpoints: '184 / 184 (100% Online)',
        safetyPersonnel: '12 Officers (9 Deployed, 3 Standby)',
        userName: 'Alex Mercer (EHS Lead Supervisor)',
        onProgress: (step, pct) => {
          setProgressMessage(step);
          setProgressPercent(pct);
        }
      });

      setExportResult(res);
      onReportExported?.(res.filename, telemetryStream.length);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setProgressMessage(`Generation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 rounded-xl text-cyan-400 shadow-md">
            <FileText className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Export Health Metrics Report</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Mock PDF Generator
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generating certified PDF document for current workforce health telemetry &amp; KPIs
            </p>
          </div>
        </div>

        {/* Progress & Status Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                  <span>Generating Health Metrics PDF...</span>
                </>
              ) : exportResult ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">PDF Successfully Generated &amp; Downloaded</span>
                </>
              ) : (
                <span>Ready to generate report</span>
              )}
            </span>
            <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                exportResult
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500 animate-pulse'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs font-mono text-slate-400 min-h-[1.25rem]">
            {progressMessage}
          </p>
        </div>

        {/* Included Metrics Summary */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs flex flex-col gap-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Included Health Display Metrics:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Avg Risk: <strong className="text-white">28.4%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Anomalies (24h): <strong className="text-white">14 Events</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              <span>IoT Status: <strong className="text-white">184 / 184 Online</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Safety Staff: <strong className="text-white">12 Officers</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>k-Anonymity (N &ge; 12) &amp; &epsilon;=0.5 DP Enforced</span>
            </span>
            <span className="font-mono text-slate-500">{zone.name}</span>
          </div>
        </div>

        {/* File Generated Notification */}
        {exportResult && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="font-bold">File ready:</div>
              <div className="font-mono text-[11px] text-emerald-400 truncate">{exportResult.filename}</div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">~48 KB PDF</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleTriggerGeneration}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>{exportResult ? 'Export Again' : 'Export Report'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

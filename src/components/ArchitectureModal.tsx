import React from 'react';
import { Layers, ShieldCheck, Activity, Cpu, Server, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Prognosticator Core Pipeline Architecture
              </h3>
              <p className="text-xs text-slate-400">
                End-to-end multi-signal ingestion, Kalman filtering, LSTM autoencoder &amp; privacy shield
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-800 text-xs transition cursor-pointer"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Diagram Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center flex flex-col justify-between">
              <div>
                <Server className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm">1. Signal Ingestion</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Azure IoT Hub ingest of environmental sensors (WBGT, AQI, TWL) + wearable biometrics (HRV, skin temp).
                </p>
              </div>
              <div className="mt-3 text-[10px] text-cyan-400 font-mono">15-min rolling window</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center flex flex-col justify-between">
              <div>
                <Cpu className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm">2. Kalman Smoothing</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recursive 1D Kalman filter imputes missing packets and dampens physical sensor jitter.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-indigo-400 font-mono">Q = 0.01, R = 0.10</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center flex flex-col justify-between">
              <div>
                <Activity className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm">3. LSTM Autoencoder</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reconstruction MSE captures cumulative strain; Integrated Gradients generates feature attributions.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-rose-400 font-mono">Sigmoid Risk Score</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center flex flex-col justify-between">
              <div>
                <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm">4. Privacy Shield</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  k-Anonymity small-cell suppression ($N &lt; 12$ masked) + Differential Privacy ($\epsilon$-DP Laplace noise).
                </p>
              </div>
              <div className="mt-3 text-[10px] text-emerald-400 font-mono">HIPAA &amp; GDPR Aligned</div>
            </div>
          </div>

          {/* Key Principles */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" /> Key Innovation Pillars
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">1. Multi-Signal Fusion</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Fuses environmental telemetry (Thermal Work Limit, WBGT, Particulate AQI) with autonomous wearable biometrics, avoiding false alarms caused by hot ambient air alone or isolated physical exertion alone.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">2. Transparent Feature Attribution (XAI)</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Replaces black-box risk scores with exact attribution breakdown (HRV drop vs skin temp spike vs ambient heat load vs sleep deficit), enabling managers to prescribe exact interventions.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">3. Ironclad Privacy Firewall</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Small-cell suppression masks active cohorts below 12 individuals ($N &lt; 12$). Laplace noise prevents linkage reconstruction attacks while allowing statistical monitoring.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">4. 3.8-Hour Backtested Lead Time</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Detects gradual physiological breakdown hours before heat stroke or acute cardiac distress occurs, allowing proactive hydration rotations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

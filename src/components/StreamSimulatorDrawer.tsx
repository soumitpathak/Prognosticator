import React, { useState } from 'react';
import { Sliders, ShieldCheck, AlertTriangle, RefreshCw, X, Play } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface StreamSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  onSimulateCustomPacket: (packet: TelemetryPacket) => void;
}

export default function StreamSimulatorDrawer({
  isOpen,
  onClose,
  currentZone,
  onSimulateCustomPacket
}: StreamSimulatorDrawerProps) {
  const [ambientTemp, setAmbientTemp] = useState<number>(42.5);
  const [heatIndex, setHeatIndex] = useState<number>(43.0);
  const [sleepDeficit, setSleepDeficit] = useState<number>(3.0);
  const [cohortSize, setCohortSize] = useState<number>(18);
  const [hrvBaselineDrop, setHrvBaselineDrop] = useState<number>(32); // percentage drop

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    // Generate synthetic series based on sliders
    const baselineHrv = 68.0 * (1 - hrvBaselineDrop / 100);
    const hrvSeries = Array.from({ length: 12 }, () =>
      Number((baselineHrv + (Math.random() - 0.5) * 5).toFixed(1))
    );
    const skinTemp = 36.6 + (ambientTemp > 38 ? 1.2 : 0.2);
    const skinTempSeries = Array.from({ length: 12 }, () =>
      Number((skinTemp + (Math.random() - 0.5) * 0.3).toFixed(2))
    );

    const customPacket: TelemetryPacket = {
      worker_id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      location_zone: currentZone,
      timestamp: new Date().toISOString(),
      hrv_series: hrvSeries,
      skin_temp_series: skinTempSeries,
      heat_index: heatIndex,
      sleep_deficit_hours: sleepDeficit,
      cohort_size: cohortSize,
      twl_index: Math.max(70, 140 - (ambientTemp - 30) * 3.5),
      ambient_temp_c: ambientTemp,
      aqi: ambientTemp > 40 ? 165 : 75
    };

    onSimulateCustomPacket(customPacket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Interactive Telemetry & Privacy Engine Simulator</h3>
              <p className="text-xs text-slate-400">
                Adjust multi-signal inputs to observe LSTM reconstruction & k-Anonymity suppression
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sliders Container */}
        <div className="py-5 space-y-4 text-xs">
          {/* Cohort Size (demonstrates N < 12 suppression) */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                Cohort Size ($N$)
                {cohortSize < 12 ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                    k-Anonymity Suppressed ($N &lt; 12$)
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    Privacy Cleared ($N \ge 12$)
                  </span>
                )}
              </span>
              <span className="font-mono text-cyan-400 text-sm font-bold">N = {cohortSize}</span>
            </div>
            <input
              type="range"
              min={4}
              max={50}
              value={cohortSize}
              onChange={(e) => setCohortSize(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Set below 12 to verify that individual telemetry alerts are strictly masked by the privacy firewall.
            </p>
          </div>

          {/* Ambient Heat Index */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-200">Wet-Bulb Globe Heat Index (°C)</span>
              <span className="font-mono text-amber-400 text-sm font-bold">{heatIndex.toFixed(1)}°C</span>
            </div>
            <input
              type="range"
              min={25}
              max={52}
              step={0.5}
              value={heatIndex}
              onChange={(e) => {
                const v = Number(e.target.value);
                setHeatIndex(v);
                setAmbientTemp(v + 1.2);
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>25°C (Comfortable)</span>
              <span>35°C (Threshold)</span>
              <span>50°C (Extreme Danger)</span>
            </div>
          </div>

          {/* HRV Drop Pct */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-200">Heart Rate Variability (HRV) Drop %</span>
              <span className="font-mono text-rose-400 text-sm font-bold">-{hrvBaselineDrop}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={hrvBaselineDrop}
              onChange={(e) => setHrvBaselineDrop(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Drop relative to healthy 68ms baseline indicates autonomic fatigue and heat strain.
            </p>
          </div>

          {/* Sleep Deficit */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-200">Cumulative Sleep Deficit (Hours)</span>
              <span className="font-mono text-cyan-400 text-sm font-bold">{sleepDeficit.toFixed(1)} hrs</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={sleepDeficit}
              onChange={(e) => setSleepDeficit(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              setAmbientTemp(32.0);
              setHeatIndex(31.0);
              setSleepDeficit(1.0);
              setCohortSize(25);
              setHrvBaselineDrop(5);
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Reset to Nominal
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleRunSimulation();
                onClose();
              }}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Inject Simulated Packet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X,
  Play,
  Zap,
  Radio,
  Flame,
  Volume2,
  HeartCrack,
  WifiOff,
  Activity
} from 'lucide-react';
import { TelemetryPacket } from '../types';

interface StreamSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  onSimulateCustomPacket: (packet: TelemetryPacket) => void;
  isStreamingActive: boolean;
  onToggleLiveStream: () => void;
  jitterEnabled: boolean;
  onToggleJitter: () => void;
  onTriggerBurst: (type: 'HEATWAVE' | 'NOISE' | 'CARDIAC' | 'DROPOUT') => void;
}

export default function StreamSimulatorDrawer({
  isOpen,
  onClose,
  currentZone,
  onSimulateCustomPacket,
  isStreamingActive,
  onToggleLiveStream,
  jitterEnabled,
  onToggleJitter,
  onTriggerBurst
}: StreamSimulatorDrawerProps) {
  const [ambientTemp, setAmbientTemp] = useState<number>(42.5);
  const [heatIndex, setHeatIndex] = useState<number>(43.0);
  const [sleepDeficit, setSleepDeficit] = useState<number>(3.0);
  const [cohortSize, setCohortSize] = useState<number>(18);
  const [hrvBaselineDrop, setHrvBaselineDrop] = useState<number>(32);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    // Generate synthetic series based on sliders
    const jitterMultiplier = jitterEnabled ? 2.5 : 0.8;
    const baselineHrv = 68.0 * (1 - hrvBaselineDrop / 100);
    const hrvSeries = Array.from({ length: 12 }, () =>
      Number((baselineHrv + (Math.random() - 0.5) * 5 * jitterMultiplier).toFixed(1))
    );
    const skinTemp = 36.6 + (ambientTemp > 38 ? 1.2 : 0.2);
    const skinTempSeries = Array.from({ length: 12 }, () =>
      Number((skinTemp + (Math.random() - 0.5) * 0.3 * jitterMultiplier).toFixed(2))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Streaming IoT Hub &amp; Burst Simulator</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  Azure IoT Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger real-time jitter, continuous stream pulses, and automated threshold-exceeding burst events
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

        {/* Content Body */}
        <div className="py-4 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Real-time Streaming & Jitter Controller */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              1. Continuous Streaming &amp; Sensor Jitter Controls
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Continuous Stream Toggle */}
              <div
                onClick={onToggleLiveStream}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  isStreamingActive
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-white">
                    <Activity className={`h-4 w-4 ${isStreamingActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    Continuous IoT Stream
                  </div>
                  <span className="text-[11px] text-slate-400">Emits packets every 3 seconds</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isStreamingActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isStreamingActive ? 'STREAMING ACTIVE' : 'PAUSED'}
                </span>
              </div>

              {/* Real-time Jitter Toggle */}
              <div
                onClick={onToggleJitter}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                  jitterEnabled
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-white">
                    <Zap className={`h-4 w-4 ${jitterEnabled ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                    High-Frequency Sensor Jitter
                  </div>
                  <span className="text-[11px] text-slate-400">Injects ±15% electromagnetic noise</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    jitterEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {jitterEnabled ? 'JITTER ON' : 'CLEAN SENSOR'}
                </span>
              </div>
            </div>
          </div>

          {/* Automated Threshold-Exceeding Burst Events */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-rose-400" />
              2. Automated Threshold-Exceeding Burst Events (1-Click Test)
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              Trigger sudden physical or environmental spikes to verify Kalman state validation, XAI attribution, and automated medical protocol staging:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Burst 1: Flash Heatwave */}
              <button
                type="button"
                onClick={() => {
                  onTriggerBurst('HEATWAVE');
                  onClose();
                }}
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition flex items-start gap-2.5 group"
              >
                <Flame className="h-5 w-5 text-rose-400 shrink-0 group-hover:scale-110 transition" />
                <div>
                  <strong className="text-white text-xs block">Flash Heatwave Exceedance</strong>
                  <span className="text-[11px] text-rose-300">Spikes ambient to 46.5°C &amp; drops TWL index</span>
                </div>
              </button>

              {/* Burst 2: Acoustic Overpressure */}
              <button
                type="button"
                onClick={() => {
                  onTriggerBurst('NOISE');
                  onClose();
                }}
                className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-left transition flex items-start gap-2.5 group"
              >
                <Volume2 className="h-5 w-5 text-orange-400 shrink-0 group-hover:scale-110 transition" />
                <div>
                  <strong className="text-white text-xs block">Acoustic Overpressure Rupture</strong>
                  <span className="text-[11px] text-orange-300">108.5 dB blast breaching OSHA permissible limit</span>
                </div>
              </button>

              {/* Burst 3: Cardiac Autonomic Collapse */}
              <button
                type="button"
                onClick={() => {
                  onTriggerBurst('CARDIAC');
                  onClose();
                }}
                className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left transition flex items-start gap-2.5 group"
              >
                <HeartCrack className="h-5 w-5 text-red-400 shrink-0 group-hover:scale-110 transition" />
                <div>
                  <strong className="text-white text-xs block">Autonomic Cardiac Collapse</strong>
                  <span className="text-[11px] text-red-300">Precipitous HRV drop to 27ms (-60% baseline)</span>
                </div>
              </button>

              {/* Burst 4: Missing Packet Dropout */}
              <button
                type="button"
                onClick={() => {
                  onTriggerBurst('DROPOUT');
                  onClose();
                }}
                className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition flex items-start gap-2.5 group"
              >
                <WifiOff className="h-5 w-5 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
                <div>
                  <strong className="text-white text-xs block">Missing Packet Dropout Test</strong>
                  <span className="text-[11px] text-cyan-300">Simulates 3 lost packets for Kalman imputation</span>
                </div>
              </button>
            </div>
          </div>

          {/* Granular Telemetry Sliders */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider">
              3. Continuous Sensor Parameter Sliders
            </span>

            {/* Cohort Size */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Cohort Size ($N$):</span>
                <span className="font-mono text-cyan-400 font-bold">
                  N = {cohortSize} {cohortSize < 12 ? '(Small-Cell Suppressed)' : '(Protected)'}
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={50}
                value={cohortSize}
                onChange={(e) => setCohortSize(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Heat Index */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Wet-Bulb Globe Heat Index (°C):</span>
                <span className="font-mono text-amber-400 font-bold">{heatIndex.toFixed(1)}°C</span>
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
                className="w-full accent-amber-400"
              />
            </div>

            {/* HRV Baseline Drop */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Heart Rate Variability Drop (%):</span>
                <span className="font-mono text-rose-400 font-bold">-{hrvBaselineDrop}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={hrvBaselineDrop}
                onChange={(e) => setHrvBaselineDrop(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
            </div>

            {/* Sleep Deficit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">Cumulative Sleep Deficit (Hours):</span>
                <span className="font-mono text-cyan-400 font-bold">{sleepDeficit.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={sleepDeficit}
                onChange={(e) => setSleepDeficit(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
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
            <RefreshCw className="h-3 w-3" /> Reset Nominals
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleRunSimulation();
                onClose();
              }}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-5 py-2 rounded-lg transition shadow-md shadow-cyan-600/20"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Inject Custom Packet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

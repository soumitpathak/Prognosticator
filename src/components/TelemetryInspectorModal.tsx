import React, { useState } from 'react';
import { TelemetryDataPoint } from '../types';
import { Activity, X, Filter, Thermometer, Wind, AlertCircle } from 'lucide-react';

interface TelemetryInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetryStream: TelemetryDataPoint[];
  zoneName: string;
}

export default function TelemetryInspectorModal({
  isOpen,
  onClose,
  telemetryStream,
  zoneName
}: TelemetryInspectorModalProps) {
  const [activeSignal, setActiveSignal] = useState<'hrv' | 'temp' | 'twl' | 'aqi'>('hrv');

  if (!isOpen) return null;

  const points = telemetryStream.slice(-30);

  // Helper to calculate SVG sparkline coordinates
  const width = 640;
  const height = 180;
  const padding = 20;

  const getHrvPoints = () => {
    const minVal = Math.min(...points.map((p) => Math.min(p.raw_hrv, p.smoothed_hrv))) - 5;
    const maxVal = Math.max(...points.map((p) => Math.max(p.raw_hrv, p.smoothed_hrv))) + 5;
    const range = maxVal - minVal || 1;

    const rawCoords = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.raw_hrv - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const smoothedCoords = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.smoothed_hrv - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return { rawCoords, smoothedCoords, minVal, maxVal };
  };

  const getGenericPoints = (key: 'ambient_temp_c' | 'twl_index' | 'aqi') => {
    const vals = points.map((p) => p[key]);
    const minVal = Math.min(...vals) * 0.95;
    const maxVal = Math.max(...vals) * 1.05;
    const range = maxVal - minVal || 1;

    const coords = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p[key] - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return { coords, minVal, maxVal };
  };

  const hrvGraph = getHrvPoints();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Signal Stream & Kalman Filter Telemetry Inspector
              </h3>
              <p className="text-xs text-slate-400">
                Zone: <span className="text-cyan-400 font-medium">{zoneName}</span> | 24-hr High-Frequency Ingestion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection for signals */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveSignal('hrv')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeSignal === 'hrv'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            HRV (Kalman Filter vs Jitter)
          </button>
          <button
            onClick={() => setActiveSignal('temp')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeSignal === 'temp'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5" />
            Ambient Temp (°C)
          </button>
          <button
            onClick={() => setActiveSignal('twl')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeSignal === 'twl'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Thermal Work Limit (TWL)
          </button>
          <button
            onClick={() => setActiveSignal('aqi')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeSignal === 'aqi'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="h-3.5 w-3.5" />
            Air Quality Index (AQI)
          </button>
        </div>

        {/* Chart View */}
        <div className="p-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-300">
                {activeSignal === 'hrv' && 'Heart Rate Variability (ms) — Raw Wearable Telemetry vs Kalman Smoothed'}
                {activeSignal === 'temp' && 'Ambient Temperature (°C) — Diurnal Shift Curve'}
                {activeSignal === 'twl' && 'Thermal Work Limit (W/m²) — Below 115 indicates high physiological strain'}
                {activeSignal === 'aqi' && 'Ambient Air Quality Index (AQI) — Particulate Telemetry'}
              </span>
              {activeSignal === 'hrv' && (
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-amber-400 font-mono">
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span> Raw Sensor Jitter
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 font-mono">
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Kalman Filtered
                  </span>
                </div>
              )}
            </div>

            {/* SVG Visualizer */}
            <div className="w-full overflow-hidden flex justify-center py-2">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
                {/* Horizontal gridlines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeDasharray="3 3" />

                {activeSignal === 'hrv' ? (
                  <>
                    {/* Raw jitter path */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeOpacity="0.75"
                      points={hrvGraph.rawCoords}
                    />
                    {/* Kalman smoothed line */}
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      points={hrvGraph.smoothedCoords}
                    />
                  </>
                ) : (
                  (() => {
                    const keyMap = {
                      temp: 'ambient_temp_c',
                      twl: 'twl_index',
                      aqi: 'aqi'
                    } as const;
                    const res = getGenericPoints(keyMap[activeSignal as 'temp' | 'twl' | 'aqi']);
                    return (
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        points={res.coords}
                      />
                    );
                  })()
                )}
              </svg>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
              <span>{points[0]?.timeLabel || 'T-6h'}</span>
              <span>Rolling Window</span>
              <span>{points[points.length - 1]?.timeLabel || 'Now'}</span>
            </div>
          </div>

          {/* Technical Explainer Note */}
          <div className="mt-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-xs text-slate-300">
            <span className="font-semibold text-cyan-400">Kalman State-Space Formulation:</span> Real-time sensor packet dropouts and industrial electromagnetic interference are compensated with a 1D recursive Kalman estimator ($Q=10^{-2}, R=0.10$). The LSTM Autoencoder reconstruction consumes this pristine signal to prevent false positive alert triggers.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

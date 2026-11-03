import React from 'react';
import { ZoneWeatherData } from '../types';
import { CloudSun, Droplets, Wind, Thermometer, RefreshCw, Radio, Compass, ShieldAlert } from 'lucide-react';

interface ZoneWeatherCardProps {
  weather: ZoneWeatherData | null;
  loading: boolean;
  onRefreshWeather: () => void;
  zoneName: string;
  latitude: number;
  longitude: number;
}

export default function ZoneWeatherCard({
  weather,
  loading,
  onRefreshWeather,
  zoneName,
  latitude,
  longitude
}: ZoneWeatherCardProps) {
  if (!weather) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <CloudSun className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Hyper-Local Meteorological Weather Ingestion
              </h3>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 animate-ping text-sky-400" />
                Open-Meteo API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>GPS: <strong className="font-mono text-slate-300">{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</strong></span>
              <span className="text-slate-600">•</span>
              <span>Updated: {weather.lastFetched}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Heat Strain Badge */}
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              weather.heatStrainIndex === 'EXTREME'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : weather.heatStrainIndex === 'HIGH'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : weather.heatStrainIndex === 'MODERATE'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {weather.heatStrainIndex} THERMAL STRAIN
          </span>

          <button
            onClick={onRefreshWeather}
            disabled={loading}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs transition border border-slate-700"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Weather Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Ambient Air Temp</span>
          <div className="text-lg font-bold text-amber-400 mt-0.5 flex items-center gap-1">
            <Thermometer className="h-4 w-4 text-amber-500" />
            {weather.temperature}°C
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Relative Humidity (RH)</span>
          <div className="text-lg font-bold text-sky-400 mt-0.5 flex items-center gap-1">
            <Droplets className="h-4 w-4 text-sky-500" />
            {weather.humidity}%
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Apparent Heat Index</span>
          <div className="text-lg font-bold text-rose-400 mt-0.5 flex items-center gap-1">
            <Thermometer className="h-4 w-4 text-rose-500" />
            {weather.apparentTemperature}°C
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Wind Velocity</span>
          <div className="text-lg font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
            <Wind className="h-4 w-4 text-cyan-500" />
            {weather.windSpeed} km/h
          </div>
        </div>
      </div>

      {/* Dynamic Baseline Adjustment Callout */}
      <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2">
        <Compass className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Dynamic Anomaly Baseline Adjustment:</strong>{' '}
          <span>{weather.baselineAdjustment}</span>
        </div>
      </div>
    </div>
  );
}

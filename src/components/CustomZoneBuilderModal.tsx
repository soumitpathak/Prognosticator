import React, { useState } from 'react';
import { FacilityZone, ZoneCustomBaselines } from '../types';
import {
  MapPin,
  Plus,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Compass,
  Thermometer,
  Heart,
  Volume2,
  Sparkles
} from 'lucide-react';

interface CustomZoneBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddZone: (newZone: FacilityZone) => void;
}

export default function CustomZoneBuilderModal({
  isOpen,
  onClose,
  onAddZone
}: CustomZoneBuilderModalProps) {
  const [zoneName, setZoneName] = useState<string>('Petrochemical-Cracker-Unit-9');
  const [description, setDescription] = useState<string>(
    'High-pressure catalytic cracking refinery unit with radiant heat pipe manifolds'
  );
  const [facilityType, setFacilityType] = useState<string>('Refining & High-Heat Chemistry');
  const [latitude, setLatitude] = useState<number>(29.7604); // Houston, TX industrial port
  const [longitude, setLongitude] = useState<number>(-95.3698);
  const [cohortCount, setCohortCount] = useState<number>(22);

  // Custom Biometric & Environmental Alert Baselines
  const [baselineHrv, setBaselineHrv] = useState<number>(66);
  const [baselineSkinTemp, setBaselineSkinTemp] = useState<number>(36.6);
  const [noiseLimitDb, setNoiseLimitDb] = useState<number>(88);
  const [heatThresholdC, setHeatThresholdC] = useState<number>(38);

  const [selectedHazards, setSelectedHazards] = useState<string[]>([
    'Radiant Manifold Heat',
    'Acoustic Turbine Overpressure',
    'Volatile VOC Trace AQI'
  ]);

  if (!isOpen) return null;

  const hazardOptions = [
    'Radiant Manifold Heat',
    'Severe Solar Radiation',
    'Acoustic Turbine Overpressure',
    'Heavy Machinery Vibration',
    'Confined Space Ventilation',
    'Volatile VOC Trace AQI',
    'Particulate Matter PM2.5',
    'High Exertion Lifting'
  ];

  const toggleHazard = (hazard: string) => {
    if (selectedHazards.includes(hazard)) {
      setSelectedHazards(selectedHazards.filter((h) => h !== hazard));
    } else {
      setSelectedHazards([...selectedHazards, hazard]);
    }
  };

  const handleApplyPresetGps = (name: string, lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customBaselines: ZoneCustomBaselines = {
      baselineHrv,
      baselineSkinTemp,
      noiseLimitDb,
      heatThresholdC
    };

    const newZone: FacilityZone = {
      id: zoneName.replace(/\s+/g, '-'),
      name: zoneName,
      status: cohortCount < 12 ? 'MODERATE' : 'STABLE',
      count: cohortCount,
      temp: `${heatThresholdC - 2}°C`,
      heatIndex: heatThresholdC,
      twl: 125.0,
      aqi: 82,
      description,
      activeHazards: selectedHazards,
      latitude,
      longitude,
      customBaselines
    };

    onAddZone(newZone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Custom Monitoring Zone &amp; Alert Baseline Builder
              </h3>
              <p className="text-xs text-slate-400">
                Define geographic facility boundary, cohort size, and customized biometric risk thresholds
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Basic Zone Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider">
              1. Facility Identity &amp; Classification
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Zone Identifier / Name</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Facility Work Type</label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="Refining & High-Heat Chemistry">Refining &amp; High-Heat Chemistry</option>
                  <option value="Outdoor Heavy Structural Work">Outdoor Heavy Structural Work</option>
                  <option value="Underground Subterranean Mine">Underground Subterranean Mine</option>
                  <option value="Logistics Distribution Port">Logistics Distribution Port</option>
                  <option value="Precision Industrial Assembly">Precision Industrial Assembly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Operational Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          {/* GPS Location & Open-Meteo Integration */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-cyan-400" />
                2. Geospatial GPS Coordinates (Live Weather Grounding)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Open-Meteo Enabled</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Latitude (°N/S)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Longitude (°E/W)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Quick GPS Location Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
              <span className="text-slate-500">Quick Coordinates:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetGps('Houston Port', 29.7604, -95.3698)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition"
              >
                Houston (Port Refineries)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetGps('Dubai Desert', 25.0657, 55.1713)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition"
              >
                Dubai (Extreme Heat)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetGps('Singapore Port', 1.3521, 103.8198)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded transition"
              >
                Singapore (High Humidity)
              </button>
            </div>
          </div>

          {/* Monitored Cohort Size & Privacy Cell Indicator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider">
                3. Active Monitored Workforce Cohort Size ($N$)
              </span>
              <span className="font-mono text-cyan-400 font-bold text-sm">N = {cohortCount} Workers</span>
            </div>

            <input
              type="range"
              min={6}
              max={65}
              value={cohortCount}
              onChange={(e) => setCohortCount(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            {cohortCount < 12 ? (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  <strong>k-Anonymity Warning:</strong> Cohort size $N={cohortCount}$ is below the privacy threshold ($N \ge 12$). Individual worker alert details will be automatically suppressed to protect privacy.
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Privacy Cleared:</strong> Cohort size meets $k$-Anonymity compliance ($N \ge 12$). Aggregated statistical early warning active.
                </span>
              </div>
            )}
          </div>

          {/* Customized Biometric & Environmental Alert Baselines */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-cyan-400" />
              4. Customized Alert Baseline Calibrations
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Baseline HRV */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-cyan-400" />
                    Resting HRV Baseline
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{baselineHrv} ms</span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={85}
                  value={baselineHrv}
                  onChange={(e) => setBaselineHrv(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500">Nominal healthy resting tone for this task cohort</span>
              </div>

              {/* Baseline Skin Temp */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                    Baseline Skin Temperature
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{baselineSkinTemp}°C</span>
                </div>
                <input
                  type="range"
                  min={35.5}
                  max={37.5}
                  step={0.1}
                  value={baselineSkinTemp}
                  onChange={(e) => setBaselineSkinTemp(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <span className="text-[10px] text-slate-500">Normative surface temperature baseline</span>
              </div>

              {/* Noise Limit */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-rose-400" />
                    Acoustic Action Limit
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{noiseLimitDb} dB</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={noiseLimitDb}
                  onChange={(e) => setNoiseLimitDb(Number(e.target.value))}
                  className="w-full accent-rose-400"
                />
                <span className="text-[10px] text-slate-500">Zone-specific PPE required limit</span>
              </div>

              {/* Heat Stress Threshold */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-red-400" />
                    Heat Stress Threshold
                  </span>
                  <span className="font-mono text-red-400 font-bold">{heatThresholdC}°C</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={46}
                  value={heatThresholdC}
                  onChange={(e) => setHeatThresholdC(Number(e.target.value))}
                  className="w-full accent-red-400"
                />
                <span className="text-[10px] text-slate-500">Mandatory rotation trigger temperature</span>
              </div>
            </div>
          </div>

          {/* Active Hazard Tags */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider">
              5. Environmental Hazard Tags
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {hazardOptions.map((opt) => {
                const isSelected = selectedHazards.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleHazard(opt)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <span className="mr-1 text-cyan-400">✓</span>}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Instantiate Monitoring Zone</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

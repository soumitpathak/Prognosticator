import React, { useState } from 'react';
import {
  Wrench,
  Fan,
  Thermometer,
  Gauge,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Power,
  Volume2
} from 'lucide-react';
import { UserPersona } from '../types';

interface FacilityEngineeringDashboardProps {
  currentUser: UserPersona;
  isAccessibilityMode?: boolean;
}

interface HvacZoneControl {
  id: string;
  name: string;
  twl: number; // Thermal Work Limit in W/m² (Safe > 220, Buffer 140-220, Critical < 140)
  wbgt: number; // °C
  ach: number; // Air Changes per Hour
  chillerSetpoint: number; // °C
  fanSpeedHz: number; // 0 - 60 Hz
  damperPosition: number; // 0 - 100%
  status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
}

interface VibrationAsset {
  id: string;
  name: string;
  location: string;
  isoClass: 'Class I' | 'Class II' | 'Class III';
  velocityRmsMmS: number; // ISO 10816: < 2.8 Good, 2.8-4.5 Acceptable, 4.5-7.1 Unsatisfactory, > 7.1 Unacceptable
  peakAccG: number;
  bearingTempC: number;
  noiseDba: number;
  maintenanceStatus: 'NOMINAL' | 'SCHEDULED_72H' | 'INSPECTION_URGENT';
}

const INITIAL_ZONES: HvacZoneControl[] = [
  {
    id: 'ZONE-A',
    name: 'Sector 4 Heavy Fabrication Bay',
    twl: 135,
    wbgt: 32.8,
    ach: 12.4,
    chillerSetpoint: 18.0,
    fanSpeedHz: 58.0,
    damperPosition: 95,
    status: 'CRITICAL'
  },
  {
    id: 'ZONE-B',
    name: 'Sector 2 Underground Tunneling Shaft',
    twl: 165,
    wbgt: 31.4,
    ach: 16.2,
    chillerSetpoint: 17.5,
    fanSpeedHz: 52.0,
    damperPosition: 85,
    status: 'ELEVATED'
  },
  {
    id: 'ZONE-C',
    name: 'Sector 1 Assembly & Electrical Enclosure',
    twl: 245,
    wbgt: 28.2,
    ach: 8.5,
    chillerSetpoint: 21.0,
    fanSpeedHz: 42.0,
    damperPosition: 65,
    status: 'OPTIMAL'
  },
  {
    id: 'ZONE-D',
    name: 'Sector 3 Primary Chiller & Pump Vault',
    twl: 195,
    wbgt: 30.1,
    ach: 14.0,
    chillerSetpoint: 19.0,
    fanSpeedHz: 48.0,
    damperPosition: 75,
    status: 'ELEVATED'
  }
];

const INITIAL_ASSETS: VibrationAsset[] = [
  {
    id: 'MTR-001',
    name: 'Primary Evaporative Chiller Pump 1A',
    location: 'Sector 3 Vault',
    isoClass: 'Class II',
    velocityRmsMmS: 5.8, // ISO 10816 Elevated
    peakAccG: 1.42,
    bearingTempC: 74.2,
    noiseDba: 87.4,
    maintenanceStatus: 'SCHEDULED_72H'
  },
  {
    id: 'FAN-004B',
    name: 'High-Volume Emergency Exhaust Fan 4B',
    location: 'Sector 4 Heavy Bay',
    isoClass: 'Class III',
    velocityRmsMmS: 7.6, // Unacceptable threshold
    peakAccG: 2.15,
    bearingTempC: 86.8,
    noiseDba: 91.2,
    maintenanceStatus: 'INSPECTION_URGENT'
  },
  {
    id: 'CMP-002',
    name: 'Rotary Screw Refrigerant Compressor 2',
    location: 'Central Plant',
    isoClass: 'Class II',
    velocityRmsMmS: 2.1, // Good
    peakAccG: 0.65,
    bearingTempC: 61.5,
    noiseDba: 82.0,
    maintenanceStatus: 'NOMINAL'
  }
];

export default function FacilityEngineeringDashboard({
  currentUser,
  isAccessibilityMode = false
}: FacilityEngineeringDashboardProps) {
  const [zones, setZones] = useState<HvacZoneControl[]>(INITIAL_ZONES);
  const [assets, setAssets] = useState<VibrationAsset[]>(INITIAL_ASSETS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleActuateDamper = (zoneId: string, delta: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const newDamper = Math.min(100, Math.max(10, z.damperPosition + delta));
        const newAch = +(z.ach * (newDamper / z.damperPosition)).toFixed(1);
        const newTwl = Math.round(z.twl + delta * 0.8);
        return {
          ...z,
          damperPosition: newDamper,
          ach: newAch,
          twl: newTwl,
          status: newTwl > 220 ? 'OPTIMAL' : newTwl > 140 ? 'ELEVATED' : 'CRITICAL'
        };
      })
    );
    setActionNotice(`Ventilation damper actuation command sent to ${zoneId} (+${delta}% airflow).`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleIssueWorkOrder = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, maintenanceStatus: 'SCHEDULED_72H' } : a))
    );
    setActionNotice(`72-Hour ISO 10816 Bearing Maintenance Work Order issued for ${assetId}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors ${
        isAccessibilityMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-md gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-950/40">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Facility Engineering &amp; Mechanical Reliability Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                OPERATIONS LEVEL 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <Fan className="h-4 w-4 text-cyan-400 animate-spin" />
            <span>Smart Chiller Automation Active</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 font-bold">
            BACnet / Modbus Connected
          </div>
        </div>
      </header>

      {/* Action Notification */}
      {actionNotice && (
        <div className="mb-5 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Engineering KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Plant Mean TWL</span>
            <Gauge className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">185 W/m²</div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">Buffer Zone (Safe &gt; 220 W/m²)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Mean Air Changes (ACH)</span>
            <Fan className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">12.8 ACH</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">ASHRAE 62.1 Compliant</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Max Bearing Vibration</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">7.6 mm/s</div>
          <div className="text-[11px] text-rose-400 mt-1 font-mono">ISO 10816 Alarm on Fan-4B</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase font-mono">Predictive Work Orders</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">2 Active</div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono">72-Hour Mean Time To Repair</div>
        </div>
      </div>

      {/* Main Grid: Sector HVAC Control & Mechanical Reliability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Sector HVAC & Thermal Work Limit Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-amber-400" />
                  <span>Sector Ventilation, Damper Actuation &amp; TWL Optimization</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct supervisory control of air handling units (AHU), chiller setpoints, and damper positions.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">4 Facility Sectors Live</span>
            </div>

            <div className="space-y-3.5">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 rounded-xl border transition ${
                    zone.status === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : zone.status === 'ELEVATED'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{zone.name}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            zone.status === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : zone.status === 'ELEVATED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {zone.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        WBGT: <strong className="text-white">{zone.wbgt}&deg;C</strong> &middot; TWL: <strong className={zone.twl < 140 ? 'text-rose-400' : 'text-amber-400'}>{zone.twl} W/m²</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {zone.ach} ACH
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Damper: {zone.damperPosition}%
                      </span>
                    </div>
                  </div>

                  {/* Damper Slider / Progress */}
                  <div className="my-3">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Damper Aperture</span>
                      <span>Fan VFD: {zone.fanSpeedHz} Hz</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${zone.damperPosition}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          zone.damperPosition > 85 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Actuation Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="text-[11px] font-mono text-slate-400">
                      Chiller Loop: <strong className="text-white">{zone.chillerSetpoint}&deg;C</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleActuateDamper(zone.id, -10)}
                        disabled={zone.damperPosition <= 10}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-mono text-[11px] transition cursor-pointer"
                      >
                        -10% Damper
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActuateDamper(zone.id, +10)}
                        disabled={zone.damperPosition >= 100}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-mono font-bold text-[11px] transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <Power className="h-3 w-3" />
                        <span>+10% Boost Flow</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): ISO 10816 Vibration & 72-Hour Predictive Maintenance */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>ISO 10816 Vibration &amp; Rotating Machinery Telemetry</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time accelerometry tracking bearing degradation, harmonic resonance, and acoustic sound exposure.
            </p>

            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">{asset.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {asset.location} &middot; {asset.isoClass}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                        asset.maintenanceStatus === 'INSPECTION_URGENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : asset.maintenanceStatus === 'SCHEDULED_72H'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {asset.maintenanceStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-500 block">RMS Velocity</span>
                      <span
                        className={`font-bold ${
                          asset.velocityRmsMmS > 7.1
                            ? 'text-rose-400'
                            : asset.velocityRmsMmS > 4.5
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {asset.velocityRmsMmS} mm/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Bearing Temp</span>
                      <span className="font-bold text-white">{asset.bearingTempC}&deg;C</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Acoustic Noise</span>
                      <span className={`font-bold ${asset.noiseDba > 85 ? 'text-amber-300' : 'text-slate-300'}`}>
                        {asset.noiseDba} dBA
                      </span>
                    </div>
                  </div>

                  {asset.maintenanceStatus !== 'SCHEDULED_72H' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleIssueWorkOrder(asset.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Wrench className="h-3 w-3" />
                        <span>Issue 72h Maintenance Order</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Physical Plant Engineering Standard</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Automated HVAC ventilation actuation directly reduces cohort physiological strain index without penalizing frontline worker rest cycles or individual work quotas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

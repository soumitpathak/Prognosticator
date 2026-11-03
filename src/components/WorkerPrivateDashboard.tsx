import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Thermometer, Moon, Droplets, Clock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function WorkerPrivateDashboard() {
  const [hydrationCountdown, setHydrationCountdown] = useState<number>(14 * 60 + 20); // 14 mins
  const [loggedGlasses, setLoggedGlasses] = useState<number>(3);
  const [requestedBreak, setRequestedBreak] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setHydrationCountdown((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Private Worker Biometric & Recovery Terminal</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  Zero Managerial Surveillance
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Your individual telemetry is protected by Prognosticator&apos;s privacy shield (k-Anonymity small-cell suppression). 
                Facility managers and supervisors only view aggregate cohort patterns where <strong>N &ge; 12</strong>. Under company policy &amp; HIPAA, 
                this data cannot be used for performance evaluations or disciplinary actions.
              </p>
            </div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pseudonymous Token</p>
            <p className="text-xs font-mono text-cyan-400 font-bold">DEVICE-#WRK-7719-EPHEMERAL</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> On-Device Key Secure
            </p>
          </div>
        </div>
      </div>

      {/* Main Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Autonomic Strain & HRV */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Autonomic Recovery</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  58 ms <span className="text-xs text-amber-400 font-medium font-mono">(-14% from rest)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Your Heart Rate Variability shows mild cardiovascular strain from sustained thermal exposure in Sector 4.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[65%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>High Strain</span>
              <span>Nominal Recovery (68 ms)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Skin & Thermal Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Surface Thermometry</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  36.9°C <span className="text-xs text-emerald-400 font-medium font-mono">(Within Safe Zone)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Thermometer className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Skin temperature is stable. Ambient wet-bulb index outside is 42.5°C; evaporative cooling is operating efficiently.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Thermal Work Limit: <strong>92 W/m²</strong></span>
            <span className="text-amber-400 font-medium">Hydration Advised</span>
          </div>
        </div>

        {/* Card 3: Sleep & Shift Readiness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Sleep & Fatigue Index</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  6.2 hrs <span className="text-xs text-cyan-400 font-medium font-mono">(1.8h deficit)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Cumulative sleep deficit slightly elevates reaction fatigue. Extra 5-minute shaded rest breaks recommended today.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Optimal recovery window: 22:00 - 06:30 tonight</span>
          </div>
        </div>
      </div>

      {/* Interactive Hydration & Safety Protocol Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Hydration Timer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-400" /> Prescribed Cooling & Hydration Protocol
            </h3>
            <span className="text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full font-mono">
              Sector 4 Requirement
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center mb-4">
            <p className="text-xs text-slate-400">Next Mandatory Hydration &amp; Shaded Pause In</p>
            <div className="text-4xl font-extrabold font-mono text-cyan-400 my-2 flex items-center justify-center gap-2">
              <Clock className="h-7 w-7 text-cyan-500" />
              {formatTime(hydrationCountdown)}
            </div>
            <p className="text-[11px] text-slate-400">
              Minimum fluid target: 250ml electrolyte solution every 20 minutes under severe thermal load
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-300">
              Logged Today: <strong className="text-cyan-400 font-mono text-sm">{loggedGlasses} / 8</strong> portions
            </div>
            <button
              onClick={() => setLoggedGlasses((g) => g + 1)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <Droplets className="h-3.5 w-3.5" /> Log 250ml Consumed
            </button>
          </div>
        </div>

        {/* Private Worker Self-Advocacy & Cooldown Request */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-400" /> Autonomous Cooling Break Request
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Under OSHA / ISO 7243 Heat Stress Regulations, every worker has an unconditional right to take immediate shaded relief if experiencing dizziness, heat exhaustion, or rapid heartbeat.
            </p>
            {requestedBreak ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <strong>Cooling Break Dispatched:</strong> Medical liaison and shaded hydration tent notified. You may immediately stand down without penalty.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Clicking below dispatches an anonymous, non-punitive relief rotation request to your zone safety officer.
                </p>
              </div>
            )}
          </div>

          {!requestedBreak && (
            <button
              onClick={() => setRequestedBreak(true)}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4" /> Request Immediate Shaded Cool-Down (Non-Punitive)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

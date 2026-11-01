import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Users, MapPin, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

export default function ManagerDashboard() {
  const [selectedZone, setSelectedZone] = useState('Outdoor-Construction-Sector-4');
  const [loading, setLoading] = useState(false);
  const [telemetryAlert, setTelemetryAlert] = useState({
    worker_id: "W-9921",
    location_zone: "Outdoor-Construction-Sector-4",
    risk_tier: "CRITICAL_RISK",
    risk_probability: 0.892,
    reconstruction_mse: 0.342,
    explainable_attributions: {
      "Heart Rate Variability (HRV) Drop": 0.42,
      "Skin Temperature Elevation": 0.18,
      "Ambient Heat Index Load": 0.31,
      "Cumulative Sleep Deficit": 0.09
    },
    recommended_operational_action: "Immediate extraction: Direct worker to shaded cooling zone and dispatch medical liaison.",
    privacy_compliance: "Enforced: k-Anonymity & Small-Cell Suppression Applied (N >= 12, Active Count: 18)"
  });

  // Simulated live refresh trigger
  const handleRefreshStream = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-lg">
            <Activity className="text-cyan-400 h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">PROGNOSTICATOR <span className="text-cyan-400 text-sm font-normal">| Azure IoT Hub Stream</span></h1>
            <p className="text-xs text-slate-400">Population & Workforce Health Early Warning Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Azure Pipeline Active</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Differential Privacy Active ($\epsilon$-DP)</span>
          </div>
        </div>
      </header>

      {/* Macro Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Monitored Workforce</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-white">1,420</h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center"><Users className="h-3 w-3 mr-1" /> 100% Anonymized</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Critical Alerts</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-rose-400">3</h3>
            <span className="text-xs text-rose-400 font-semibold flex items-center"><ShieldAlert className="h-3 w-3 mr-1" /> Immediate Action</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Avg Wet-Bulb Heat Index</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-amber-400">42.5°C</h3>
            <span className="text-xs text-slate-400">Severe Thermal Load</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Model Lead Time (Backtested)</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-bold text-cyan-400">3.8 Hours</h3>
            <span className="text-xs text-cyan-400 font-semibold">Prior to Incident</span>
          </div>
        </div>
      </div>

      {/* Main Operational Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Geospatial Zone Selector / Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-cyan-400" /> Industrial Facility Zones
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Outdoor-Construction-Sector-4', status: 'CRITICAL', count: 18, temp: '44.2°C' },
                { name: 'Manufacturing-Assembly-Line-B', status: 'STABLE', count: 42, temp: '31.0°C' },
                { name: 'Warehouse-Logistics-Hub-North', status: 'MODERATE', count: 25, temp: '36.5°C' }
              ].map((zone) => (
                <div 
                  key={zone.name}
                  onClick={() => setSelectedZone(zone.name)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedZone === zone.name 
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white' 
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{zone.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      zone.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      zone.status === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Active Cohort: N = {zone.count} (Suppressed)</span>
                    <span>Heat Load: {zone.temp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p><strong>Regulatory Notice:</strong> k-Anonymity small-cell suppression enforces strict masking on cohorts under N=12 to shield individual worker identity.</p>
          </div>
        </div>

        {/* Right 2 Cols: Real-Time Explainable AI Triage & SHAP Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-cyan-400" /> Real-Time LSTM Anomaly & Explainable AI (XAI) Drilldown
            </h2>
            <button 
              onClick={handleRefreshStream}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 transition"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Simulate Stream Packet</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-2">
              <div>
                <span className="text-xs text-slate-400 font-mono">ANOMALY ID: #9921-AZ</span>
                <h3 className="text-lg font-bold text-white flex items-center mt-1">
                  Cohort Risk Probability: <span className="text-rose-400 ml-2">89.2% (CRITICAL)</span>
                </h3>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-lg text-rose-400 text-xs font-mono">
                Reconstruction MSE: 0.342
              </div>
            </div>

            {/* Explainable AI Attribute Weights */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Integrated Gradients / Feature Attribution (Why did this alert trigger?)
              </h4>
              <div className="space-y-2.5">
                {Object.entries(telemetryAlert.explainable_attributions).map(([feature, weight]) => (
                  <div key={feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{feature}</span>
                      <span className="text-cyan-400 font-mono">{(weight * 100).toFixed(0)}% contribution</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${weight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="mt-5 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-lg">
              <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">Recommended Operational Action</p>
              <p className="text-sm text-white font-medium">{telemetryAlert.recommended_operational_action}</p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap gap-3">
            <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition shadow-lg shadow-cyan-600/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Trigger Zone Hydration Protocol
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-slate-700">
              Export Audit Log (GDPR/HIPAA)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

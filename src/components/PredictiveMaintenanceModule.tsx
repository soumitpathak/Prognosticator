import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Wrench,
  AlertTriangle,
  TrendingDown,
  Activity,
  Cpu,
  Radio,
  Battery,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Download,
  Info,
  Clock,
  Sparkles,
  Zap,
  Flame,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  IoTEndpointFailureForecast,
  EndpointFailureHorizon,
  IoTEndpointType,
  SystemAuditLogEntry
} from '../types';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import { maintenanceSchedulingService } from '../services/maintenanceSchedulingService';

interface PredictiveMaintenanceModuleProps {
  onLogAudit?: (entry: SystemAuditLogEntry) => void;
  onNotice?: (msg: string) => void;
  onNavigateToZone?: (zoneId: string) => void;
}

export default function PredictiveMaintenanceModule({
  onLogAudit,
  onNotice,
  onNavigateToZone
}: PredictiveMaintenanceModuleProps) {
  const [endpoints, setEndpoints] = useState<IoTEndpointFailureForecast[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('SENS-VIB-402');
  const [filterHorizon, setFilterHorizon] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedSeverities, setSelectedSeverities] = useState<('Critical' | 'Warning' | 'Info')[]>([
    'Critical',
    'Warning',
    'Info'
  ]);
  const [stressMultiplier, setStressMultiplier] = useState<number>(1.0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync with service
  useEffect(() => {
    const unsub = predictiveMaintenanceService.subscribe(() => {
      setEndpoints(predictiveMaintenanceService.getEndpoints());
      setStressMultiplier(predictiveMaintenanceService.getStressMultiplier());
    });
    setEndpoints(predictiveMaintenanceService.getEndpoints());
    setStressMultiplier(predictiveMaintenanceService.getStressMultiplier());
    return () => unsub();
  }, []);

  const getEndpointSeverity = (ep: IoTEndpointFailureForecast): 'Critical' | 'Warning' | 'Info' => {
    if (ep.forecastHorizon === 'CRITICAL_FAIL_24H' || ep.healthScore <= 30) return 'Critical';
    if (ep.forecastHorizon === 'HIGH_FAIL_72H' || ep.forecastHorizon === 'ELEVATED_FAIL_7D') return 'Warning';
    return 'Info';
  };

  const toggleSeverity = (sev: 'Critical' | 'Warning' | 'Info') => {
    setSelectedSeverities((prev) => {
      if (prev.includes(sev)) {
        return prev.filter((s) => s !== sev);
      } else {
        return [...prev, sev];
      }
    });
  };

  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, Warning: 0, Info: 0 };
    endpoints.forEach((ep) => {
      const s = getEndpointSeverity(ep);
      counts[s]++;
    });
    return counts;
  }, [endpoints]);

  const selectedEndpoint = useMemo(() => {
    return endpoints.find((ep) => ep.endpointId === selectedEndpointId) || endpoints[0];
  }, [endpoints, selectedEndpointId]);

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      // Multi-select severity filtering
      const epSeverity = getEndpointSeverity(ep);
      if (!selectedSeverities.includes(epSeverity)) return false;

      if (filterHorizon !== 'ALL' && ep.forecastHorizon !== filterHorizon) return false;
      if (filterType !== 'ALL' && ep.endpointType !== filterType) return false;
      return true;
    });
  }, [endpoints, selectedSeverities, filterHorizon, filterType]);

  const handleStressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    predictiveMaintenanceService.setStressMultiplier(val);
  };

  const handleStageWorkOrder = (endpoint: IoTEndpointFailureForecast) => {
    predictiveMaintenanceService.stageMaintenanceForEndpoint(endpoint.endpointId);
    
    // Also stage into maintenance scheduler service
    maintenanceSchedulingService.stageTicketFromAlert({
      id: `ALR-PM-${endpoint.endpointId}`,
      worker_id: 'SYSTEM_AUTOPILOT',
      location_zone: endpoint.zoneId,
      detected_at: new Date().toLocaleTimeString(),
      anomaly_metric: `Predictive Failure: ${endpoint.endpointName} (${endpoint.failureProbabilityPct}% probability in ${endpoint.mttfHours}h)`,
      raw_value: `${endpoint.healthScore}/100 Health Score`,
      kalman_smoothed_value: `${endpoint.degradationRatePctPerDay}%/day degradation`,
      severity: endpoint.forecastHorizon === 'CRITICAL_FAIL_24H' ? 'CRITICAL' : 'HIGH',
      kalman_status: 'Confirmed Sensor Spike',
      lead_time: `${endpoint.remainingUsefulLifeDays} days RUL`,
      recommended_action: endpoint.prescribedPreventiveAction,
      acknowledged: false,
      privacy_status: 'De-identified Telemetry',
      equipment_id: endpoint.endpointId,
      equipment_name: endpoint.endpointName,
      equipment_subsystem: endpoint.rootCauseVulnerability,
      maintenance_urgency: endpoint.forecastHorizon === 'CRITICAL_FAIL_24H' ? 'BEARING_REPLACEMENT' : 'SCHEDULED_LUBRICATION'
    });

    const msg = `Staged Urgent Work Order for ${endpoint.endpointName}. Failure Probability: ${endpoint.failureProbabilityPct}%.`;
    setActionNotice(msg);
    onNotice?.(msg);

    onLogAudit?.({
      id: `AUD-PM-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Safety Director',
      userRole: 'EHS Safety Lead',
      category: 'MAINTENANCE_DISPATCH',
      targetModule: 'IoT Endpoint Predictive Maintenance Forecast',
      parameter: `Preemptive Ticket for ${endpoint.endpointId}`,
      previousValue: `Health Score: ${endpoint.healthScore}/100`,
      newValue: `Work Order Staged (RUL: ${endpoint.remainingUsefulLifeDays}d)`,
      justification: `Predictive failure forecasted: ${endpoint.rootCauseVulnerability}. Cost avoidance: $${endpoint.costAvoidanceUsd.toLocaleString()}.`,
      approvalStatus: 'VERIFIED'
    });

    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleRecalibrate = (endpoint: IoTEndpointFailureForecast) => {
    predictiveMaintenanceService.executePreventiveCalibration(endpoint.endpointId);
    const msg = `Zero-point recalibration & baseline offset restored for ${endpoint.endpointName}. Health score restored to 96/100.`;
    setActionNotice(msg);
    onNotice?.(msg);

    onLogAudit?.({
      id: `AUD-CAL-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: 'USR-MGR-2026',
      userName: 'Safety Director',
      userRole: 'EHS Safety Lead',
      category: 'MAINTENANCE_DISPATCH',
      targetModule: 'IoT Endpoint Predictive Maintenance Forecast',
      parameter: `Recalibrated ${endpoint.endpointId}`,
      previousValue: `Drift: ${endpoint.driftDeltaPercent}%`,
      newValue: `Drift: 0.2% (Nominal)`,
      justification: `Preventive firmware zero-offset calibration executed prior to predicted failure horizon.`,
      approvalStatus: 'VERIFIED'
    });

    setTimeout(() => setActionNotice(null), 5000);
  };

  const getHorizonBadge = (horizon: EndpointFailureHorizon) => {
    switch (horizon) {
      case 'CRITICAL_FAIL_24H':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse">
            Imminent Failure (&lt; 24h)
          </span>
        );
      case 'HIGH_FAIL_72H':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
            High Risk (&lt; 72h)
          </span>
        );
      case 'ELEVATED_FAIL_7D':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-500/50">
            Elevated (&lt; 7 Days)
          </span>
        );
      case 'NOMINAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
            Nominal Health
          </span>
        );
    }
  };

  const [projectionHorizon, setProjectionHorizon] = useState<7 | 14 | 30>(30);
  const [projectionMetric, setProjectionMetric] = useState<'health_confidence' | 'degradation_rate' | 'failure_probability'>('health_confidence');
  const [activeChartTab, setActiveChartTab] = useState<'30day_projection' | 'historical_curve'>('30day_projection');

  // Filter 30-day projection points based on selected horizon
  const visibleProjectionData = useMemo(() => {
    if (!selectedEndpoint?.thirtyDayProjection) return [];
    return selectedEndpoint.thirtyDayProjection.slice(0, projectionHorizon);
  }, [selectedEndpoint, projectionHorizon]);

  // Find projected critical day (day when health index drops <= 30)
  const criticalBreachDay = useMemo(() => {
    if (!selectedEndpoint?.thirtyDayProjection) return null;
    return selectedEndpoint.thirtyDayProjection.find((p) => p.healthIndex <= 30);
  }, [selectedEndpoint]);

  // Find optimal preventive maintenance window
  const optimalMaintenancePoint = useMemo(() => {
    if (!selectedEndpoint?.thirtyDayProjection) return null;
    return selectedEndpoint.thirtyDayProjection.find((p) => p.healthIndex <= 55 && p.healthIndex > 35) || selectedEndpoint.thirtyDayProjection[Math.min(5, selectedEndpoint.thirtyDayProjection.length - 1)];
  }, [selectedEndpoint]);

  const handleExport30DayProjectionCsv = () => {
    if (!selectedEndpoint?.thirtyDayProjection) return;
    const headers = [
      'Day',
      'Date_Label',
      'Health_Index',
      'Lower_95_CI',
      'Upper_95_CI',
      'Daily_Degradation_Rate_Pct_Per_Day',
      'Cumulative_Degradation_Pct',
      'Failure_Probability_Pct',
      'Health_Status'
    ];
    const rows = selectedEndpoint.thirtyDayProjection.map((p) => [
      p.day,
      `"${p.dateLabel}"`,
      p.healthIndex,
      p.lowerConfidenceBound,
      p.upperConfidenceBound,
      p.dailyDegradationRate,
      p.cumulativeDegradationPct,
      p.failureProbabilityPct,
      `"${p.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `30Day_Degradation_Projection_${selectedEndpoint.endpointId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                IoT Endpoint Predictive Maintenance
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600/40 font-mono">
                  LSTM Degradation Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Forecasts sensor hardware failures and degradation rates over the next 30 days using real-time anomaly patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stress Multiplier Simulator */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-300 font-medium">Environmental Stress:</span>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={stressMultiplier}
              onChange={handleStressChange}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-amber-400">{stressMultiplier.toFixed(1)}x</span>
          </div>

          <button
            onClick={() => predictiveMaintenanceService.exportForecastCsv()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Forecast CSV</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="my-3 p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-lg text-xs text-cyan-200 flex items-center justify-between animate-fadeIn">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-cyan-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Endpoints list & Detailed Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left Column: Endpoints List & Filters */}
        <div className="lg:col-span-5 space-y-3">
          {/* Multi-Select Severity Level Filter Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-cyan-400" />
                Alert Severity Filter
              </span>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <button
                  onClick={() => setSelectedSeverities(['Critical', 'Warning', 'Info'])}
                  className="text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-medium"
                >
                  All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => setSelectedSeverities([])}
                  className="text-slate-400 hover:text-slate-200 transition cursor-pointer font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Critical Chip */}
              <button
                onClick={() => toggleSeverity('Critical')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  selectedSeverities.includes('Critical')
                    ? 'bg-rose-950 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-950/40 ring-1 ring-rose-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedSeverities.includes('Critical') ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>Critical</span>
                <span className="px-1 py-0.2 rounded text-[10px] bg-rose-900/60 font-mono text-rose-300">
                  {severityCounts.Critical}
                </span>
              </button>

              {/* Warning Chip */}
              <button
                onClick={() => toggleSeverity('Warning')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  selectedSeverities.includes('Warning')
                    ? 'bg-amber-950 text-amber-200 border-amber-500/60 shadow-sm shadow-amber-950/40 ring-1 ring-amber-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedSeverities.includes('Warning') ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                />
                <span>Warning</span>
                <span className="px-1 py-0.2 rounded text-[10px] bg-amber-900/60 font-mono text-amber-300">
                  {severityCounts.Warning}
                </span>
              </button>

              {/* Info Chip */}
              <button
                onClick={() => toggleSeverity('Info')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
                  selectedSeverities.includes('Info')
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-500/60 shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedSeverities.includes('Info') ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span>Info</span>
                <span className="px-1 py-0.2 rounded text-[10px] bg-emerald-900/60 font-mono text-emerald-300">
                  {severityCounts.Info}
                </span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filterHorizon}
              onChange={(e) => setFilterHorizon(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 flex-1 cursor-pointer"
            >
              <option value="ALL">All Failure Horizons</option>
              <option value="CRITICAL_FAIL_24H">Critical (&lt; 24 Hours)</option>
              <option value="HIGH_FAIL_72H">High Risk (&lt; 72 Hours)</option>
              <option value="ELEVATED_FAIL_7D">Elevated (&lt; 7 Days)</option>
              <option value="NOMINAL">Nominal</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 flex-1 cursor-pointer"
            >
              <option value="ALL">All Sensor Types</option>
              <option value="ACCELEROMETER">Vibration Accelerometer</option>
              <option value="PPG_BIOMETRIC">Wearable Optical PPG</option>
              <option value="SKIN_TEMP_PROBE">Thermal Heat Flux Array</option>
              <option value="GAS_PID">Multi-Gas PID Detector</option>
              <option value="EDGE_GATEWAY">Industrial Edge Gateway</option>
            </select>
          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredEndpoints.map((ep) => {
              const isSelected = ep.endpointId === selectedEndpoint?.endpointId;
              return (
                <div
                  key={ep.endpointId}
                  onClick={() => setSelectedEndpointId(ep.endpointId)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{ep.endpointName}</span>
                        {ep.isStagedForMaintenance && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono">
                            Work Order Staged
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {ep.endpointId} &bull; {ep.zoneName}
                      </div>
                    </div>
                    {getHorizonBadge(ep.forecastHorizon)}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[9px]">HEALTH</span>
                      <span
                        className={`font-mono font-bold ${
                          ep.healthScore < 50 ? 'text-rose-400' : ep.healthScore < 75 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {ep.healthScore}/100
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px]">FAIL PROB</span>
                      <span className="font-mono font-bold text-white">{ep.failureProbabilityPct}%</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px]">MTTF</span>
                      <span className="font-mono font-bold text-cyan-400">{ep.mttfHours}h</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px]">DEGRADE</span>
                      <span className="font-mono text-slate-300">-{ep.degradationRatePctPerDay}%/d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Forecast & Degradation Curve */}
        {selectedEndpoint && (
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Top Detail Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">{selectedEndpoint.endpointName}</h3>
                  <span className="font-mono text-xs text-cyan-400">({selectedEndpoint.endpointId})</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Location: <strong className="text-slate-200">{selectedEndpoint.zoneName}</strong> &bull; Firmware:{' '}
                  <span className="font-mono">{selectedEndpoint.firmwareVersion}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRecalibrate(selectedEndpoint)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
                  title="Execute remote zero-offset calibration and sensor noise purge"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Recalibrate</span>
                </button>

                <button
                  onClick={() => handleStageWorkOrder(selectedEndpoint)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/50 text-xs font-bold transition cursor-pointer"
                  title="Stage preemptive work order with technician dispatcher"
                >
                  <Wrench className="w-3 h-3 text-rose-400" />
                  <span>Stage Work Order</span>
                </button>
              </div>
            </div>

            {/* Chart View Mode Tabs & 30-Day Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveChartTab('30day_projection')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    activeChartTab === '30day_projection'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  30-Day Degradation Projections
                </button>
                <button
                  onClick={() => setActiveChartTab('historical_curve')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    activeChartTab === 'historical_curve'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  10-Day Historical Baseline
                </button>
              </div>

              {activeChartTab === '30day_projection' && (
                <div className="flex items-center space-x-2">
                  {/* Horizon selector */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                    <button
                      onClick={() => setProjectionHorizon(7)}
                      className={`px-2 py-0.5 rounded ${
                        projectionHorizon === 7 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      7D
                    </button>
                    <button
                      onClick={() => setProjectionHorizon(14)}
                      className={`px-2 py-0.5 rounded ${
                        projectionHorizon === 14 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      14D
                    </button>
                    <button
                      onClick={() => setProjectionHorizon(30)}
                      className={`px-2 py-0.5 rounded ${
                        projectionHorizon === 30 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      30D
                    </button>
                  </div>

                  {/* CSV Export for 30d projections */}
                  <button
                    onClick={handleExport30DayProjectionCsv}
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 text-[11px] transition cursor-pointer"
                    title="Export 30-Day Degradation Projection dataset"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* 30-DAY PROJECTION TREND CHART */}
            {activeChartTab === '30day_projection' ? (
              <div className="space-y-3">
                {/* Metric Selector Toolbar & Milestone Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 text-[11px] font-medium">Metric:</span>
                    <button
                      onClick={() => setProjectionMetric('health_confidence')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        projectionMetric === 'health_confidence'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Health Index &amp; 95% CI
                    </button>
                    <button
                      onClick={() => setProjectionMetric('degradation_rate')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        projectionMetric === 'degradation_rate'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Degradation Rate (%/day)
                    </button>
                    <button
                      onClick={() => setProjectionMetric('failure_probability')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        projectionMetric === 'failure_probability'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Failure Probability (%)
                    </button>
                  </div>

                  {/* Summary Milestone Tag */}
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    {criticalBreachDay ? (
                      <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                        Critical Breach: <strong>{criticalBreachDay.dateLabel} (Day +{criticalBreachDay.day})</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        Safe: Above Critical Threshold for 30d
                      </span>
                    )}
                  </div>
                </div>

                {/* Recharts Chart Canvas */}
                <div className="h-64 w-full bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleProjectionData} margin={{ top: 12, right: 24, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="dateLabel"
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        interval={projectionHorizon === 30 ? 2 : 0}
                      />
                      <YAxis
                        domain={projectionMetric === 'degradation_rate' ? [0, 'auto'] : [0, 100]}
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        unit={projectionMetric === 'degradation_rate' ? '%/d' : '%'}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '11px'
                        }}
                        formatter={(val: any, name: any) => {
                          if (name === 'Daily Degradation Rate') return [`${val}% / day`, name];
                          if (name === 'Cumulative Degradation') return [`${val}%`, name];
                          if (name === 'Failure Probability') return [`${val}%`, name];
                          return [`${val}/100`, name];
                        }}
                        labelFormatter={(label) => `Projection: ${label}`}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />

                      {/* Threshold reference lines for Health Metric */}
                      {projectionMetric === 'health_confidence' && (
                        <>
                          <ReferenceLine
                            y={30}
                            stroke="#f43f5e"
                            strokeDasharray="4 4"
                            label={{ value: 'Critical Threshold (≤30)', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                          />
                          <ReferenceLine
                            y={50}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            label={{ value: 'Warning Floor (≤50)', fill: '#f59e0b', fontSize: 10, position: 'right' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="upperConfidenceBound"
                            name="Upper 95% Confidence Bound"
                            stroke="#38bdf8"
                            strokeWidth={1.2}
                            strokeDasharray="3 3"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="healthIndex"
                            name="Projected Health Index"
                            stroke="#06b6d4"
                            strokeWidth={2.8}
                            dot={{ r: projectionHorizon === 30 ? 2 : 3, fill: '#06b6d4' }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="lowerConfidenceBound"
                            name="Lower 95% Confidence Bound"
                            stroke="#0284c7"
                            strokeWidth={1.2}
                            strokeDasharray="3 3"
                            dot={false}
                          />
                        </>
                      )}

                      {/* Degradation Velocity Metric */}
                      {projectionMetric === 'degradation_rate' && (
                        <>
                          <ReferenceLine
                            y={selectedEndpoint.degradationRatePctPerDay}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            label={{ value: 'Baseline Rate', fill: '#94a3b8', fontSize: 10, position: 'right' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="dailyDegradationRate"
                            name="Daily Degradation Rate"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#f59e0b' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="cumulativeDegradationPct"
                            name="Cumulative Degradation"
                            stroke="#ec4899"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </>
                      )}

                      {/* Failure Probability Curve */}
                      {projectionMetric === 'failure_probability' && (
                        <>
                          <ReferenceLine
                            y={80}
                            stroke="#f43f5e"
                            strokeDasharray="4 4"
                            label={{ value: 'Emergency Intervention Horizon (80%)', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="failureProbabilityPct"
                            name="Failure Probability"
                            stroke="#ef4444"
                            strokeWidth={2.8}
                            dot={{ r: 3, fill: '#ef4444' }}
                            activeDot={{ r: 5 }}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 30-Day Key Analytical Indicators Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">OPTIMAL SERVICE WINDOW</span>
                    <span className="text-white font-mono font-bold text-xs mt-0.5 block">
                      {optimalMaintenancePoint ? `${optimalMaintenancePoint.dateLabel} (Day ${optimalMaintenancePoint.day})` : 'Within 7 Days'}
                    </span>
                    <span className="text-[9px] text-emerald-400">Preempts catastrophic downtime</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">DAY 30 TERMINAL HEALTH</span>
                    <span className="font-mono font-bold text-xs mt-0.5 block text-amber-400">
                      {selectedEndpoint.thirtyDayProjection?.[29]?.healthIndex ?? 28}/100
                    </span>
                    <span className="text-[9px] text-slate-500">Confidence: ±3.8 pts</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">30D CUMULATIVE DEGRADATION</span>
                    <span className="font-mono font-bold text-xs mt-0.5 block text-rose-400">
                      -{selectedEndpoint.thirtyDayProjection?.[29]?.cumulativeDegradationPct ?? 52}%
                    </span>
                    <span className="text-[9px] text-slate-500">Under {stressMultiplier.toFixed(1)}x stress</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">FINAL FAILURE PROBABILITY</span>
                    <span className="font-mono font-bold text-xs mt-0.5 block text-purple-300">
                      {selectedEndpoint.thirtyDayProjection?.[29]?.failureProbabilityPct ?? 94}%
                    </span>
                    <span className="text-[9px] text-purple-400 font-medium">If uncalibrated</span>
                  </div>
                </div>
              </div>
            ) : (
              /* HISTORICAL 10-DAY OBSERVED VS PROJECTED CHART */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Recent 10-Day Historical vs Kalman Baseline
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Failure Cutoff: &le; 30 Health Index
                  </span>
                </div>

                <div className="h-56 w-full bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedEndpoint.historicalDegradationSeries} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '11px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <ReferenceLine y={30} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Critical Threshold', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                      <Line
                        type="monotone"
                        dataKey="observedHealth"
                        name="Observed Health Index"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#06b6d4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedDegradation"
                        name="LSTM Projected Curve"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Diagnostic Telemetry & Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">SENSOR DRIFT OFFSET</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    Math.abs(selectedEndpoint.driftDeltaPercent) > 10 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {selectedEndpoint.driftDeltaPercent > 0 ? '+' : ''}
                  {selectedEndpoint.driftDeltaPercent}%
                </span>
                <span className="text-[10px] text-slate-500 block">vs Calibrated Zero</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">SIGNAL-TO-NOISE (SNR)</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    selectedEndpoint.signalToNoiseRatioDb < 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedEndpoint.signalToNoiseRatioDb} dB
                </span>
                <span className="text-[10px] text-slate-500 block">Baseline: &ge; 35 dB</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">BATTERY VOLTAGE</span>
                <span className="font-mono font-bold text-sm text-cyan-300">
                  {selectedEndpoint.batteryVoltage} V
                </span>
                <span className="text-[10px] text-slate-500 block">Nominal: 3.6V</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">PACKET LOSS RATE</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    selectedEndpoint.packetLossRatePct > 5 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {selectedEndpoint.packetLossRatePct}%
                </span>
                <span className="text-[10px] text-slate-500 block">RF link reliability</span>
              </div>
            </div>

            {/* Anomaly Pattern Correlation & Root Cause */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase text-cyan-400">
                  CURRENT ANOMALY PATTERN CORRELATION
                </span>
                <p className="text-slate-200 mt-1">{selectedEndpoint.currentAnomalyAttribution}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 font-bold block text-[10px] uppercase text-amber-400">
                  ROOT-CAUSE VULNERABILITY
                </span>
                <p className="text-slate-300 mt-1">{selectedEndpoint.rootCauseVulnerability}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 font-bold block text-[10px] uppercase text-emerald-400">
                  PRESCRIBED PREVENTIVE ACTION
                </span>
                <p className="text-slate-200 mt-1 font-medium">{selectedEndpoint.prescribedPreventiveAction}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Avoided Downtime Loss:{' '}
                    <strong className="text-emerald-400 font-mono">
                      ${selectedEndpoint.costAvoidanceUsd.toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    Remaining Useful Life:{' '}
                    <strong className="text-cyan-400 font-mono">{selectedEndpoint.remainingUsefulLifeDays} Days</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

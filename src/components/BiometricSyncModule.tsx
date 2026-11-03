import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Bluetooth,
  BatteryCharging,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  WorkerWearableDevice,
  WorkerStressTier,
  WearableHrvHistoryItem,
  FacilityZone
} from '../types';
import {
  wearableBiometricService
} from '../services/wearableBiometricService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

interface BiometricSyncModuleProps {
  zones: FacilityZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onSyncBiometricToKalman?: (workerId: string, hrvRmssd: number, heartRate: number) => void;
  onNotice?: (msg: string) => void;
}

export default function BiometricSyncModule({
  zones,
  selectedZoneId,
  onSelectZone,
  onSyncBiometricToKalman,
  onNotice
}: BiometricSyncModuleProps) {
  const [devices, setDevices] = useState<WorkerWearableDevice[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('W-9921');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [isConnectingBle, setIsConnectingBle] = useState<boolean>(false);
  const [bleStatusMsg, setBleStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = wearableBiometricService.subscribe((updatedDevices) => {
      setDevices(updatedDevices);
    });
    return () => unsub();
  }, []);

  const selectedDevice =
    devices.find((d) => d.workerId === selectedWorkerId) || devices[0];

  const handleToggleStreaming = () => {
    const nextState = !isLiveStreaming;
    setIsLiveStreaming(nextState);
    wearableBiometricService.toggleLiveSync(nextState);
    if (onNotice) {
      onNotice(
        nextState
          ? 'Live Biometric Wearable Synchronization resumed (Ingesting 0.5Hz BLE packets).'
          : 'Live Biometric Wearable Synchronization paused.'
      );
    }
  };

  const handlePairBleDevice = async () => {
    if (!selectedDevice) return;
    setIsConnectingBle(true);
    setBleStatusMsg('Scanning for BLE GATT Heart Rate peripherals (0x180D)...');

    const result = await wearableBiometricService.connectWebBluetoothDevice(selectedDevice.workerId);
    setIsConnectingBle(false);

    if (result.success) {
      setBleStatusMsg(`Paired successfully to "${result.deviceName}". Ingesting live RR intervals.`);
      if (onNotice) {
        onNotice(`Wearable ${result.deviceName} synchronized with ${selectedDevice.workerName} (${selectedDevice.workerId}).`);
      }
    } else {
      setBleStatusMsg(result.error || 'Pairing completed with synthetic telemetry fallback.');
    }

    setTimeout(() => setBleStatusMsg(null), 6000);
  };

  const handleTriggerStressSurge = (workerId: string) => {
    wearableBiometricService.simulateStressSurge(workerId);
    const dev = devices.find((d) => d.workerId === workerId);
    if (onNotice) {
      onNotice(
        `Simulated acute autonomic stress surge for ${dev?.workerName || workerId}: RMSSD collapsed to 18ms, HR spiked to 125 BPM.`
      );
    }
  };

  const handleTriggerRecovery = (workerId: string) => {
    wearableBiometricService.simulateRestRecovery(workerId);
    const dev = devices.find((d) => d.workerId === workerId);
    if (onNotice) {
      onNotice(
        `Restored parasympathetic recovery for ${dev?.workerName || workerId}: RMSSD elevated to 72ms, resting HR 68 BPM.`
      );
    }
  };

  const handlePushToKalman = () => {
    if (!selectedDevice) return;
    if (onSyncBiometricToKalman) {
      onSyncBiometricToKalman(
        selectedDevice.workerId,
        selectedDevice.currentRmssd,
        selectedDevice.currentHeartRate
      );
    }
    if (onNotice) {
      onNotice(
        `Ingested live wearable biometrics for ${selectedDevice.workerId} into Kalman state estimator (RMSSD: ${selectedDevice.currentRmssd}ms, HR: ${selectedDevice.currentHeartRate} BPM).`
      );
    }
  };

  // Fleet Statistics
  const totalConnected = devices.filter((d) => d.connectionStatus === 'CONNECTED').length;
  const criticalStressCount = devices.filter((d) => d.stressTier === 'CRITICAL_STRAIN').length;
  const elevatedStressCount = devices.filter((d) => d.stressTier === 'HIGH_STRESS').length;
  const avgFleetHrv = Math.round(
    devices.reduce((acc, d) => acc + d.currentRmssd, 0) / (devices.length || 1)
  );

  return (
    <div id="biometric-sync-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
            <Heart className="h-6 w-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Real-Time Biometric Synchronization Hub
              </h2>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border border-cyan-500/40">
                Web BLE 0x180D GATT &bull; Beat-by-Beat HRV
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live ingest of inter-beat RR intervals, RMSSD parasympathetic tone, and Baevsky Autonomic Stress Index
            </p>
          </div>
        </div>

        {/* Global Hub Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Web BLE Connect */}
          <button
            onClick={handlePairBleDevice}
            disabled={isConnectingBle}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
              isConnectingBle
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
            }`}
            title="Connect external Bluetooth Low Energy (BLE) Heart Rate monitor via Web Bluetooth API"
          >
            <Bluetooth className={`h-3.5 w-3.5 ${isConnectingBle ? 'text-cyan-300 animate-spin' : 'text-cyan-400'}`} />
            <span>{isConnectingBle ? 'Pairing BLE...' : 'Connect BLE Wearable'}</span>
          </button>

          {/* Pause / Resume Live Biometric Sync */}
          <button
            onClick={handleToggleStreaming}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isLiveStreaming
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLiveStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            <span>{isLiveStreaming ? 'Live Sync Active' : 'Sync Paused'}</span>
          </button>

          {/* Ingest to Kalman Filter Button */}
          <button
            onClick={handlePushToKalman}
            className="flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
            title="Push selected worker's real-time HRV into the dashboard's Kalman anomaly engine"
          >
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Ingest into Kalman</span>
          </button>
        </div>
      </div>

      {/* BLE Status Banner */}
      {bleStatusMsg && (
        <div className="mt-3 p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="h-4 w-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>{bleStatusMsg}</span>
          </div>
          <button
            onClick={() => setBleStatusMsg(null)}
            className="text-cyan-400 hover:text-white font-semibold text-xs ml-3 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fleet Macro Biometrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Connected Wearables</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white font-mono">{totalConnected} Active</span>
            <span className="text-[10px] text-emerald-400 font-mono">100% Signal</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] text-slate-400 font-medium block">Fleet Mean RMSSD</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-cyan-400 font-mono">{avgFleetHrv} ms</span>
            <span className="text-[10px] text-slate-400 font-mono">Norm: 45–75ms</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-rose-500/30 p-3 rounded-lg bg-rose-950/10">
          <span className="text-[11px] text-rose-300 font-medium block flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-400" /> Critical Autonomic Strain
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-rose-400 font-mono">{criticalStressCount} Workers</span>
            <span className="text-[10px] text-rose-300/80 font-mono">RMSSD &lt; 25ms</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-lg bg-amber-950/10">
          <span className="text-[11px] text-amber-300 font-medium block flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" /> High Stress / Fatigue
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-400 font-mono">{elevatedStressCount} Workers</span>
            <span className="text-[10px] text-amber-300/80 font-mono">RMSSD 25–42ms</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Wearable Device Roster & Deep Dive Tachogram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Wearables Roster (5 Cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" /> Monitored Worker Wearables
            </span>
            <span className="text-[11px] text-slate-400">Click to Inspect Tachogram</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {devices.map((device) => {
              const isSelected = selectedWorkerId === device.workerId;
              const isCritical = device.stressTier === 'CRITICAL_STRAIN';
              const isHigh = device.stressTier === 'HIGH_STRESS';

              return (
                <div
                  key={device.id}
                  onClick={() => {
                    setSelectedWorkerId(device.workerId);
                    onSelectZone(device.zoneId);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{device.workerName}</span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/50">
                          {device.workerId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="truncate max-w-[140px]">{device.deviceModel}</span>
                        <span>&bull;</span>
                        <span className="text-slate-300 truncate">{device.zoneName}</span>
                      </div>
                    </div>

                    {/* Stress Tier Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isCritical ? 'CRITICAL STRAIN' : isHigh ? 'HIGH STRESS' : 'OPTIMAL'}
                    </span>
                  </div>

                  {/* Real-time metrics strip */}
                  <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-800/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">HRV RMSSD</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {device.currentRmssd} ms
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {device.currentHeartRate} BPM
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Stress Index</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          device.stressScore > 75
                            ? 'text-rose-400'
                            : device.stressScore > 50
                            ? 'text-amber-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        {device.stressScore}/100
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Battery / RSSI</span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1">
                        <BatteryCharging className="h-3 w-3 text-emerald-400" />
                        {device.batteryPct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Worker Deep Dive & Beat-to-Beat Tachogram (7 Cols) */}
        {selectedDevice && (
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              {/* Top Worker Status Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedDevice.workerName}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      ID: {selectedDevice.workerId}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedDevice.deviceModel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Zone: <strong className="text-slate-200">{selectedDevice.zoneName}</strong></span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-emerald-400" /> RSSI: {selectedDevice.rssiSignalDbm} dBm
                    </span>
                    <span>&bull;</span>
                    <span className="text-cyan-400">{selectedDevice.lastSyncTime}</span>
                  </p>
                </div>

                {/* Simulation Action Triggers */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleTriggerStressSurge(selectedDevice.workerId)}
                    className="flex items-center gap-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-semibold px-2.5 py-1 rounded-md transition"
                    title="Simulate sudden physical exertion or acute sympathetic stress spike"
                  >
                    <Flame className="h-3 w-3 text-rose-400" />
                    <span>Stress Spike</span>
                  </button>
                  <button
                    onClick={() => handleTriggerRecovery(selectedDevice.workerId)}
                    className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded-md transition"
                    title="Simulate scheduled rest pause and parasympathetic recovery"
                  >
                    <Heart className="h-3 w-3 text-emerald-400" />
                    <span>Rest Recovery</span>
                  </button>
                </div>
              </div>

              {/* Autonomic Indices & Stress Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">RMSSD (Parasympathetic)</span>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                    {selectedDevice.currentRmssd} <span className="text-xs font-normal">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {selectedDevice.currentRmssd < 25 ? 'Suppressed' : selectedDevice.currentRmssd < 45 ? 'Sub-optimal' : 'Healthy'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">SDNN (Variability)</span>
                  <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                    {selectedDevice.currentSdnn} <span className="text-xs font-normal">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Autonomic Reserve</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sympathovagal (PNS/SNS)</span>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    PNS: <span className={selectedDevice.pnsIndex < 0 ? 'text-rose-400' : 'text-emerald-400'}>{selectedDevice.pnsIndex.toFixed(1)}</span>
                    {' '}| SNS: <span className={selectedDevice.snsIndex > 1.5 ? 'text-amber-400' : 'text-slate-300'}>{selectedDevice.snsIndex.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {selectedDevice.snsIndex > 2 ? 'High Sympathetic Drive' : 'Balanced'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Baevsky Stress Index</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                    {selectedDevice.stressScore} <span className="text-xs font-normal">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {selectedDevice.stressTier.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Real-Time RR-Interval Tachogram (Beat-to-Beat Waveform) */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" /> Rolling RR Tachogram (Inter-Beat Intervals in Milliseconds)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Mean RR: ~{Math.round(60000 / selectedDevice.currentHeartRate)}ms ({selectedDevice.currentHeartRate} BPM)
                  </span>
                </div>

                <div className="h-36 w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={selectedDevice.rrIntervals.map((rr, idx) => ({
                        beatIndex: idx + 1,
                        rrIntervalMs: rr
                      }))}
                      margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="beatIndex"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        label={{ value: 'Consecutive Heart Beats', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 9 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        domain={['dataMin - 50', 'dataMax + 50']}
                        unit="ms"
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '11px'
                        }}
                        formatter={(val: any) => [`${val ?? 0} ms`, 'RR Interval']}
                        labelFormatter={(lbl) => `Beat #${lbl}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="rrIntervalMs"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#06b6d4' }}
                        activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent HRV Trajectory Trend (Last 15 Syncs) */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> HRV RMSSD &amp; Stress Trendline
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Target RMSSD: &gt; 50ms (Normal Parasympathetic Tone)
                  </span>
                </div>

                <div className="h-32 w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={selectedDevice.recentHrvHistory}
                      margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="hrvGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} unit="ms" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '11px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rmssd"
                        name="HRV RMSSD"
                        stroke="#6366f1"
                        fillOpacity={1}
                        fill="url(#hrvGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Clinical & Supervisory Physiological Guidance */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>
                  Autonomic Diagnosis:{' '}
                  <strong className="text-slate-200">
                    {selectedDevice.stressTier === 'CRITICAL_STRAIN'
                      ? 'Severe parasympathetic withdrawal. Autonomic fatigue threshold reached.'
                      : selectedDevice.stressTier === 'HIGH_STRESS'
                      ? 'Sympathetic tone dominance under industrial thermal/ergonomic strain.'
                      : 'Optimal autonomic homeostasis and cardiovascular reserve.'}
                  </strong>
                </span>
              </div>
              <button
                onClick={handlePushToKalman}
                className="text-cyan-400 hover:text-white font-medium underline flex items-center gap-1"
              >
                <span>Synchronize with Kalman Filter State</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

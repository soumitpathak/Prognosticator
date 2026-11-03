import { WorkerWearableDevice, WorkerStressTier, WearableHrvHistoryItem } from '../types';

/**
 * Real-Time Biometric Synchronization Service
 * Ingests live Heart Rate Variability (HRV) and RR inter-beat intervals from
 * wearable health devices (Polar, Garmin, Apple Watch, Whoop, BioHarness)
 * with Web Bluetooth BLE GATT Heart Rate Profile (0x180D) and synthetic telemetry.
 */

// Mathematical HRV algorithms
export function calculateRmssd(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 50;
  let sumSquaredDiffs = 0;
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    const diff = rrIntervals[i + 1] - rrIntervals[i];
    sumSquaredDiffs += diff * diff;
  }
  return Math.round(Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1)));
}

export function calculateSdnn(rrIntervals: number[]): number {
  if (rrIntervals.length < 2) return 60;
  const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const variance =
    rrIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rrIntervals.length;
  return Math.round(Math.sqrt(variance));
}

export function determineStressTier(rmssd: number, hr: number): {
  tier: WorkerStressTier;
  stressScore: number;
  pns: number;
  sns: number;
} {
  // Lower RMSSD & higher HR indicate high physiological stress / sympathetic overdrive
  let stressScore = 0;
  if (rmssd <= 25) {
    stressScore = Math.min(100, Math.round(85 + (25 - rmssd) * 0.6 + (hr > 100 ? 5 : 0)));
    return {
      tier: 'CRITICAL_STRAIN',
      stressScore,
      pns: -2.8,
      sns: 2.9
    };
  } else if (rmssd <= 42) {
    stressScore = Math.round(60 + ((42 - rmssd) / 17) * 24);
    return {
      tier: 'HIGH_STRESS',
      stressScore,
      pns: -1.6,
      sns: 1.8
    };
  } else if (rmssd <= 65) {
    stressScore = Math.round(25 + ((65 - rmssd) / 23) * 34);
    return {
      tier: 'MODERATE',
      stressScore,
      pns: 0.2,
      sns: 0.3
    };
  } else {
    stressScore = Math.max(5, Math.round(25 - ((rmssd - 65) / 35) * 20));
    return {
      tier: 'OPTIMAL',
      stressScore,
      pns: 1.9,
      sns: -1.2
    };
  }
}

// Generates realistic consecutive RR intervals for a given target HR and RMSSD
function generateSampleRrIntervals(meanHr: number, targetRmssd: number, count: number = 24): number[] {
  const baseRr = Math.round(60000 / meanHr); // e.g. 750ms for 80 bpm
  const intervals: number[] = [];
  let current = baseRr;

  for (let i = 0; i < count; i++) {
    const delta = (Math.random() - 0.5) * targetRmssd * 1.8;
    current = Math.round(Math.max(420, Math.min(1300, current + delta)));
    intervals.push(current);
  }
  return intervals;
}

export const INITIAL_WEARABLE_DEVICES: WorkerWearableDevice[] = [
  {
    id: 'DEV-BLE-9921',
    workerId: 'W-9921',
    workerName: 'Marcus Vance',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor-Construction-Sector-4',
    deviceModel: 'Polar H10 ECG Chest Strap',
    deviceType: 'CHEST_STRAP',
    connectionStatus: 'CONNECTED',
    batteryPct: 84,
    rssiSignalDbm: -62,
    currentHeartRate: 112,
    currentRmssd: 22, // Acute stress / heat strain
    currentSdnn: 31,
    stressScore: 89,
    stressTier: 'CRITICAL_STRAIN',
    pnsIndex: -2.7,
    snsIndex: 2.8,
    rrIntervals: generateSampleRrIntervals(112, 22),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 58, heartRate: 78, stressScore: 32, skinTempC: 36.6 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 49, heartRate: 85, stressScore: 48, skinTempC: 36.9 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 36, heartRate: 98, stressScore: 68, skinTempC: 37.5 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 22, heartRate: 112, stressScore: 89, skinTempC: 38.4 }
    ],
    lastSyncTime: 'Live (0.4s ago)'
  },
  {
    id: 'DEV-BLE-6104',
    workerId: 'W-6104',
    workerName: 'Elena Rostova',
    zoneId: 'Outdoor-Construction-Sector-4',
    zoneName: 'Outdoor-Construction-Sector-4',
    deviceModel: 'Garmin Forerunner 965 Pro',
    deviceType: 'WRIST_BAND',
    connectionStatus: 'CONNECTED',
    batteryPct: 71,
    rssiSignalDbm: -68,
    currentHeartRate: 94,
    currentRmssd: 38,
    currentSdnn: 44,
    stressScore: 64,
    stressTier: 'HIGH_STRESS',
    pnsIndex: -1.3,
    snsIndex: 1.5,
    rrIntervals: generateSampleRrIntervals(94, 38),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 64, heartRate: 74, stressScore: 26, skinTempC: 36.4 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 55, heartRate: 81, stressScore: 39, skinTempC: 36.6 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 44, heartRate: 88, stressScore: 54, skinTempC: 36.9 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 38, heartRate: 94, stressScore: 64, skinTempC: 37.1 }
    ],
    lastSyncTime: 'Live (0.8s ago)'
  },
  {
    id: 'DEV-BLE-3209',
    workerId: 'W-3209',
    workerName: 'Tariq Al-Mansoor',
    zoneId: 'Warehouse-Logistics-Hub-North',
    zoneName: 'Warehouse-Logistics-Hub-North',
    deviceModel: 'Whoop 4.0 Biostrap Continuous',
    deviceType: 'WRIST_BAND',
    connectionStatus: 'CONNECTED',
    batteryPct: 92,
    rssiSignalDbm: -55,
    currentHeartRate: 88,
    currentRmssd: 41,
    currentSdnn: 47,
    stressScore: 58,
    stressTier: 'HIGH_STRESS',
    pnsIndex: -0.9,
    snsIndex: 1.2,
    rrIntervals: generateSampleRrIntervals(88, 41),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 52, heartRate: 80, stressScore: 42, skinTempC: 36.5 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 48, heartRate: 83, stressScore: 49, skinTempC: 36.5 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 44, heartRate: 86, stressScore: 54, skinTempC: 36.6 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 41, heartRate: 88, stressScore: 58, skinTempC: 36.7 }
    ],
    lastSyncTime: 'Live (1.2s ago)'
  },
  {
    id: 'DEV-BLE-1842',
    workerId: 'W-1842',
    workerName: 'Liam Chen',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing-Assembly-Line-B',
    deviceModel: 'Oura Ring Horizon Gen 3',
    deviceType: 'SMART_RING',
    connectionStatus: 'CONNECTED',
    batteryPct: 63,
    rssiSignalDbm: -72,
    currentHeartRate: 72,
    currentRmssd: 74,
    currentSdnn: 68,
    stressScore: 18,
    stressTier: 'OPTIMAL',
    pnsIndex: 1.8,
    snsIndex: -1.4,
    rrIntervals: generateSampleRrIntervals(72, 74),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 72, heartRate: 71, stressScore: 20, skinTempC: 36.4 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 75, heartRate: 73, stressScore: 17, skinTempC: 36.4 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 73, heartRate: 72, stressScore: 19, skinTempC: 36.4 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 74, heartRate: 72, stressScore: 18, skinTempC: 36.4 }
    ],
    lastSyncTime: 'Live (1.5s ago)'
  },
  {
    id: 'DEV-BLE-5021',
    workerId: 'W-5021',
    workerName: 'Mateo Morales',
    zoneId: 'Subgrade-Tunnel-Conduit-7',
    zoneName: 'Subgrade-Tunnel-Conduit-7',
    deviceModel: 'Zephyr BioHarness 3.0 Industrial',
    deviceType: 'BIO_HARNESS',
    connectionStatus: 'CONNECTED',
    batteryPct: 78,
    rssiSignalDbm: -84,
    currentHeartRate: 82,
    currentRmssd: 52,
    currentSdnn: 58,
    stressScore: 44,
    stressTier: 'MODERATE',
    pnsIndex: 0.1,
    snsIndex: 0.4,
    rrIntervals: generateSampleRrIntervals(82, 52),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 56, heartRate: 79, stressScore: 38, skinTempC: 36.5 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 54, heartRate: 80, stressScore: 41, skinTempC: 36.5 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 53, heartRate: 81, stressScore: 43, skinTempC: 36.6 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 52, heartRate: 82, stressScore: 44, skinTempC: 36.6 }
    ],
    lastSyncTime: 'Live (2.1s ago)'
  },
  {
    id: 'DEV-BLE-7740',
    workerId: 'W-7740',
    workerName: 'Sofia Lindqvist',
    zoneId: 'Manufacturing-Assembly-Line-B',
    zoneName: 'Manufacturing-Assembly-Line-B',
    deviceModel: 'Apple Watch Ultra 2 Industrial',
    deviceType: 'WRIST_BAND',
    connectionStatus: 'CONNECTED',
    batteryPct: 88,
    rssiSignalDbm: -59,
    currentHeartRate: 75,
    currentRmssd: 68,
    currentSdnn: 62,
    stressScore: 24,
    stressTier: 'OPTIMAL',
    pnsIndex: 1.4,
    snsIndex: -0.8,
    rrIntervals: generateSampleRrIntervals(75, 68),
    recentHrvHistory: [
      { timestamp: '10:15', timeLabel: '10:15', rmssd: 66, heartRate: 74, stressScore: 27, skinTempC: 36.3 },
      { timestamp: '10:25', timeLabel: '10:25', rmssd: 69, heartRate: 75, stressScore: 23, skinTempC: 36.4 },
      { timestamp: '10:35', timeLabel: '10:35', rmssd: 67, heartRate: 75, stressScore: 25, skinTempC: 36.4 },
      { timestamp: '10:45', timeLabel: '10:45', rmssd: 68, heartRate: 75, stressScore: 24, skinTempC: 36.4 }
    ],
    lastSyncTime: 'Live (0.5s ago)'
  }
];

class WearableBiometricManager {
  private devices: WorkerWearableDevice[] = [...INITIAL_WEARABLE_DEVICES];
  private listeners: Set<(devices: WorkerWearableDevice[]) => void> = new Set();
  private intervalId: number | null = null;
  private isStreaming: boolean = true;
  private pairedBluetoothDevice: any = null;

  constructor() {
    this.startStreamingSimulation();
  }

  public subscribe(callback: (devices: WorkerWearableDevice[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.devices]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const copy = [...this.devices];
    this.listeners.forEach((cb) => cb(copy));
  }

  public getDevices(): WorkerWearableDevice[] {
    return [...this.devices];
  }

  public getDeviceById(id: string): WorkerWearableDevice | undefined {
    return this.devices.find((d) => d.id === id || d.workerId === id);
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Real Web Bluetooth Low Energy (BLE) Heart Rate Service (0x180D) connection
   */
  public async connectWebBluetoothDevice(targetWorkerId: string): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isWebBluetoothSupported()) {
      return {
        success: false,
        error: 'Web Bluetooth API is not supported in this browser or platform. Using simulated BLE streaming.'
      };
    }

    try {
      // @ts-ignore - Web Bluetooth API typings
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      this.pairedBluetoothDevice = bleDevice;
      const deviceName = bleDevice.name || 'External BLE Heart Rate Sensor';

      // Connect GATT Server
      const server = await bleDevice.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleBleHeartRateData(event.target.value, targetWorkerId, deviceName);
      });

      // Update device entry in roster
      this.devices = this.devices.map((d) => {
        if (d.workerId === targetWorkerId) {
          return {
            ...d,
            deviceModel: `${deviceName} (Web BLE Paired)`,
            connectionStatus: 'CONNECTED',
            lastSyncTime: 'Live BLE GATT'
          };
        }
        return d;
      });

      this.notify();
      return { success: true, deviceName };
    } catch (err: any) {
      console.warn('Bluetooth pairing cancelled or error:', err);
      return { success: false, error: err?.message || 'Bluetooth connection failed.' };
    }
  }

  /**
   * Parse GATT Heart Rate Measurement Characteristic (0x2A37)
   */
  private handleBleHeartRateData(dataView: DataView, workerId: string, _deviceName: string) {
    if (!dataView || dataView.byteLength === 0) return;

    const flags = dataView.getUint8(0);
    const is16BitHr = (flags & 0x01) !== 0;
    const hasRrIntervals = (flags & 0x10) !== 0;

    let offset = 1;
    let heartRate = 0;

    if (is16BitHr) {
      heartRate = dataView.getUint16(offset, true);
      offset += 2;
    } else {
      heartRate = dataView.getUint8(offset);
      offset += 1;
    }

    // Skip energy expended if present
    if ((flags & 0x08) !== 0) {
      offset += 2;
    }

    const newRrList: number[] = [];
    if (hasRrIntervals) {
      while (offset + 1 < dataView.byteLength) {
        const rrRaw = dataView.getUint16(offset, true);
        const rrMs = Math.round((rrRaw / 1024) * 1000); // Bluetooth GATT RR unit is 1/1024 seconds
        newRrList.push(rrMs);
        offset += 2;
      }
    }

    this.updateWorkerBiometrics(workerId, heartRate, newRrList);
  }

  /**
   * Update biometric values for a specific worker
   */
  public updateWorkerBiometrics(workerId: string, heartRate: number, incomingRrIntervals?: number[]) {
    this.devices = this.devices.map((dev) => {
      if (dev.workerId !== workerId) return dev;

      let updatedRr = dev.rrIntervals;
      if (incomingRrIntervals && incomingRrIntervals.length > 0) {
        updatedRr = [...dev.rrIntervals.slice(incomingRrIntervals.length), ...incomingRrIntervals];
      } else {
        // Synthesize single next beat
        const base = Math.round(60000 / heartRate);
        const jitter = (Math.random() - 0.5) * dev.currentRmssd * 1.5;
        const newBeat = Math.round(Math.max(450, Math.min(1250, base + jitter)));
        updatedRr = [...dev.rrIntervals.slice(1), newBeat];
      }

      const rmssd = calculateRmssd(updatedRr);
      const sdnn = calculateSdnn(updatedRr);
      const { tier, stressScore, pns, sns } = determineStressTier(rmssd, heartRate);

      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newHistoryItem: WearableHrvHistoryItem = {
        timestamp: now.toISOString(),
        timeLabel,
        rmssd,
        heartRate,
        stressScore,
        skinTempC: dev.recentHrvHistory[dev.recentHrvHistory.length - 1]?.skinTempC || 36.8
      };

      const updatedHistory = [...dev.recentHrvHistory.slice(-14), newHistoryItem];

      return {
        ...dev,
        currentHeartRate: heartRate,
        currentRmssd: rmssd,
        currentSdnn: sdnn,
        stressScore,
        stressTier: tier,
        pnsIndex: pns,
        snsIndex: sns,
        rrIntervals: updatedRr,
        recentHrvHistory: updatedHistory,
        lastSyncTime: 'Live (BLE GATT Sync)'
      };
    });

    this.notify();
  }

  /**
   * Inject acute stress surge simulation (e.g. sudden autonomic collapse or heat exhaustion)
   */
  public simulateStressSurge(workerId: string) {
    this.devices = this.devices.map((dev) => {
      if (dev.workerId !== workerId) return dev;

      // High HR, very low RR intervals, low RMSSD
      const highHr = Math.round(122 + Math.random() * 15);
      const compressedRr = generateSampleRrIntervals(highHr, 16, 24);
      const rmssd = 18;
      const sdnn = 24;
      const { tier, stressScore, pns, sns } = determineStressTier(rmssd, highHr);

      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const historyItem: WearableHrvHistoryItem = {
        timestamp: now.toISOString(),
        timeLabel,
        rmssd,
        heartRate: highHr,
        stressScore,
        skinTempC: 38.6
      };

      return {
        ...dev,
        currentHeartRate: highHr,
        currentRmssd: rmssd,
        currentSdnn: sdnn,
        stressScore,
        stressTier: tier,
        pnsIndex: pns,
        snsIndex: sns,
        rrIntervals: compressedRr,
        recentHrvHistory: [...dev.recentHrvHistory.slice(-14), historyItem],
        lastSyncTime: 'Stress Spike Ingested'
      };
    });

    this.notify();
  }

  /**
   * Restore normal autonomic recovery / calm rest state
   */
  public simulateRestRecovery(workerId: string) {
    this.devices = this.devices.map((dev) => {
      if (dev.workerId !== workerId) return dev;

      const calmHr = Math.round(68 + Math.random() * 6);
      const calmRr = generateSampleRrIntervals(calmHr, 72, 24);
      const rmssd = 72;
      const sdnn = 68;
      const { tier, stressScore, pns, sns } = determineStressTier(rmssd, calmHr);

      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const historyItem: WearableHrvHistoryItem = {
        timestamp: now.toISOString(),
        timeLabel,
        rmssd,
        heartRate: calmHr,
        stressScore,
        skinTempC: 36.5
      };

      return {
        ...dev,
        currentHeartRate: calmHr,
        currentRmssd: rmssd,
        currentSdnn: sdnn,
        stressScore,
        stressTier: tier,
        pnsIndex: pns,
        snsIndex: sns,
        rrIntervals: calmRr,
        recentHrvHistory: [...dev.recentHrvHistory.slice(-14), historyItem],
        lastSyncTime: 'Recovery Rest Protocol'
      };
    });

    this.notify();
  }

  /**
   * Continuous live telemetry simulator to animate real-time HR and HRV dynamics
   */
  private startStreamingSimulation() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      if (!this.isStreaming) return;

      this.devices = this.devices.map((dev) => {
        // Natural physiological respiratory sinus arrhythmia (RSA) fluctuation
        const hrDrift = (Math.random() - 0.49) * 2;
        let newHr = Math.round(dev.currentHeartRate + hrDrift);
        newHr = Math.max(58, Math.min(145, newHr));

        // Subtly fluctuate RMSSD
        const rmssdDrift = (Math.random() - 0.5) * 1.5;
        let newRmssd = Math.round(Math.max(14, Math.min(95, dev.currentRmssd + rmssdDrift)));

        // Generate next RR beat based on current HR and RMSSD
        const baseRr = Math.round(60000 / newHr);
        const beatDelta = (Math.random() - 0.5) * newRmssd * 1.4;
        const nextBeat = Math.round(Math.max(430, Math.min(1280, baseRr + beatDelta)));
        const updatedRr = [...dev.rrIntervals.slice(1), nextBeat];

        const calculatedRmssd = calculateRmssd(updatedRr);
        const sdnn = calculateSdnn(updatedRr);
        const { tier, stressScore, pns, sns } = determineStressTier(calculatedRmssd, newHr);

        // Every 12 seconds, push history point
        let history = dev.recentHrvHistory;
        if (Math.random() > 0.85) {
          const now = new Date();
          const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          history = [
            ...history.slice(-14),
            {
              timestamp: now.toISOString(),
              timeLabel,
              rmssd: calculatedRmssd,
              heartRate: newHr,
              stressScore,
              skinTempC: dev.recentHrvHistory[dev.recentHrvHistory.length - 1]?.skinTempC || 36.6
            }
          ];
        }

        return {
          ...dev,
          currentHeartRate: newHr,
          currentRmssd: calculatedRmssd,
          currentSdnn: sdnn,
          stressScore,
          stressTier: tier,
          pnsIndex: pns,
          snsIndex: sns,
          rrIntervals: updatedRr,
          recentHrvHistory: history,
          lastSyncTime: 'Live (0.4s ago)'
        };
      });

      this.notify();
    }, 2000);
  }

  public toggleLiveSync(enabled?: boolean) {
    this.isStreaming = enabled !== undefined ? enabled : !this.isStreaming;
  }

  public getStreamingStatus(): boolean {
    return this.isStreaming;
  }
}

export const wearableBiometricService = new WearableBiometricManager();

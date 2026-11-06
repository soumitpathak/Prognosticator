import {
  IoTEndpointFailureForecast,
  MaintenanceTechnician,
  EndpointFailureHorizon
} from '../types';
import { INITIAL_IOT_ENDPOINTS } from './predictiveMaintenanceService';
import { INITIAL_TECHNICIANS } from './maintenanceSchedulingService';

export interface ProactiveMaintenanceTask {
  id: string; // e.g. 'PM-TSK-72H-402'
  endpointId: string;
  endpointName: string;
  endpointType: string;
  zoneId: string;
  zoneName: string;
  mttfHours: number; // Mean time to failure in hours (< 72h)
  remainingUsefulLifeDays: number;
  failureProbabilityPct: number;
  forecastHorizon: EndpointFailureHorizon;
  kalmanDriftPercent: number;
  signalToNoiseRatioDb: number;
  currentAnomalyAttribution: string;
  rootCauseVulnerability: string;
  prescribedPreventiveAction: string;
  requiredPartNumber: string;
  partLocation: string;
  assignedTechnician: MaintenanceTechnician;
  costAvoidanceUsd: number;
  status: 'AUTO_STAGED' | 'DISPATCHED' | 'IN_PROGRESS' | 'REPLACED_VERIFIED';
  triggeredAt: string;
  targetCompletionDeadline: string;
  priority: 'CRITICAL_24H' | 'HIGH_72H';
  slaHoursRemaining: number;
}

type Listener = () => void;

class ProactiveMaintenanceSchedulerService {
  private tasks: ProactiveMaintenanceTask[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initializeFromPredictedFailures();
  }

  /**
   * Scans IoT endpoints and triggers proactive tasks for any sensor
   * predicted to fail within 72 hours (mttfHours <= 72).
   */
  private initializeFromPredictedFailures(): void {
    const endpointsUnder72h = INITIAL_IOT_ENDPOINTS.filter(
      (ep) => ep.mttfHours <= 72 || ep.forecastHorizon === 'CRITICAL_FAIL_24H' || ep.forecastHorizon === 'HIGH_FAIL_72H'
    );

    this.tasks = endpointsUnder72h.map((ep, idx) => {
      const isCritical = ep.mttfHours <= 24 || ep.forecastHorizon === 'CRITICAL_FAIL_24H';
      const deadline = new Date(Date.now() + ep.mttfHours * 60 * 60 * 1000).toISOString();
      const tech = this.matchTechnicianForEndpoint(ep);

      const partNum =
        ep.endpointType === 'ACCELEROMETER'
          ? 'PCB-603C01 (Ceramic Shear ICP Accelerometer)'
          : ep.endpointType === 'PPG_BIOMETRIC'
          ? 'GAR-BIO-PRO-99 (Hermetic IP68 Optical Sensor Module)'
          : ep.endpointType === 'GAS_PID'
          ? 'RAE-PID-10.6eV (MiniPID 2 Lamp & Electrode Stack)'
          : 'SEN-AIR-MULTI-X (Calibrated Laser PM/VOC Sensor)';

      const partLoc =
        idx % 2 === 0 ? 'Main Toolcrib A, Rack 04-B' : 'Critical Spares Locker C, Bin 12';

      return {
        id: `PM-TSK-72H-${ep.endpointId.replace('SENS-', '')}`,
        endpointId: ep.endpointId,
        endpointName: ep.endpointName,
        endpointType: ep.endpointType,
        zoneId: ep.zoneId,
        zoneName: ep.zoneName,
        mttfHours: ep.mttfHours,
        remainingUsefulLifeDays: ep.remainingUsefulLifeDays,
        failureProbabilityPct: ep.failureProbabilityPct,
        forecastHorizon: ep.forecastHorizon,
        kalmanDriftPercent: ep.driftDeltaPercent,
        signalToNoiseRatioDb: ep.signalToNoiseRatioDb,
        currentAnomalyAttribution: ep.currentAnomalyAttribution,
        rootCauseVulnerability: ep.rootCauseVulnerability,
        prescribedPreventiveAction: ep.prescribedPreventiveAction,
        requiredPartNumber: partNum,
        partLocation: partLoc,
        assignedTechnician: tech,
        costAvoidanceUsd: ep.costAvoidanceUsd,
        status: idx === 0 ? 'AUTO_STAGED' : 'DISPATCHED',
        triggeredAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        targetCompletionDeadline: deadline,
        priority: isCritical ? 'CRITICAL_24H' : 'HIGH_72H',
        slaHoursRemaining: Math.max(Math.round(ep.mttfHours - (idx * 1.5)), 1)
      };
    });

    // Also inject a 3rd task to guarantee rich multi-component presentation
    if (this.tasks.length < 3) {
      const deadline3 = new Date(Date.now() + 64 * 3600000).toISOString();
      const tech3 = INITIAL_TECHNICIANS.find((t) => t.specialization === 'INSTRUMENTATION_CONTROLS') || INITIAL_TECHNICIANS[0];
      this.tasks.push({
        id: 'PM-TSK-72H-TEMP204',
        endpointId: 'SENS-TEMP-204',
        endpointName: 'Precision Fluke Infrared RTD Sensor 204',
        endpointType: 'SKIN_TEMP_PROBE',
        zoneId: 'Foundry-Furnace-Bay-B',
        zoneName: 'Foundry & Furnace Bay B',
        mttfHours: 64.2,
        remainingUsefulLifeDays: 2.6,
        failureProbabilityPct: 69,
        forecastHorizon: 'HIGH_FAIL_72H',
        kalmanDriftPercent: +14.6,
        signalToNoiseRatioDb: 19.8,
        currentAnomalyAttribution:
          'Thermal cycling fatigue and ambient slag spatter causing germanium lens optical attenuation.',
        rootCauseVulnerability: 'Thermopile zero-drift under persistent ambient temperatures exceeding 52°C.',
        prescribedPreventiveAction:
          'Swap infrared pyrometer lens window with sapphire thermal shield; calibrate 0-100°C linear scale.',
        requiredPartNumber: 'FLUKE-RTD-SAPPHIRE-204 (Fused Quartz Shielded)',
        partLocation: 'Safety Stores Cabinet B, Shelf 2',
        assignedTechnician: tech3,
        costAvoidanceUsd: 8500,
        status: 'AUTO_STAGED',
        triggeredAt: new Date(Date.now() - 7200000).toISOString(),
        targetCompletionDeadline: deadline3,
        priority: 'HIGH_72H',
        slaHoursRemaining: 64
      });
    }
  }

  private matchTechnicianForEndpoint(ep: IoTEndpointFailureForecast): MaintenanceTechnician {
    if (ep.endpointType === 'ACCELEROMETER') {
      return (
        INITIAL_TECHNICIANS.find((t) => t.specialization === 'VIBRATION_ANALYSIS_CAT_III' && t.status === 'AVAILABLE') ||
        INITIAL_TECHNICIANS[0]
      );
    }
    if (ep.endpointType === 'GAS_PID') {
      return (
        INITIAL_TECHNICIANS.find((t) => t.specialization === 'INSTRUMENTATION_CONTROLS') ||
        INITIAL_TECHNICIANS[4]
      );
    }
    return (
      INITIAL_TECHNICIANS.find((t) => t.specialization === 'ELECTRO_MECHANICAL_MILLWRIGHT') ||
      INITIAL_TECHNICIANS[1]
    );
  }

  public getTasks(): ProactiveMaintenanceTask[] {
    return [...this.tasks].sort((a, b) => a.mttfHours - b.mttfHours);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public dispatchTechnician(taskId: string): void {
    this.tasks = this.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'DISPATCHED'
        };
      }
      return task;
    });
    this.notify();
  }

  public startTask(taskId: string): void {
    this.tasks = this.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'IN_PROGRESS'
        };
      }
      return task;
    });
    this.notify();
  }

  public completeAndCalibrateTask(taskId: string): void {
    this.tasks = this.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'REPLACED_VERIFIED',
          mttfHours: 1200, // Reset to healthy baseline
          remainingUsefulLifeDays: 50,
          failureProbabilityPct: 3,
          kalmanDriftPercent: 0.2
        };
      }
      return task;
    });
    this.notify();
  }

  /**
   * Injects a synthetic new LSTM-Kalman predicted sensor failure (< 72h)
   * to demonstrate dynamic scheduler auto-triggering.
   */
  public triggerSimulatedPrediction(): ProactiveMaintenanceTask {
    const idNum = Math.floor(100 + Math.random() * 899);
    const mttf = Math.round((8 + Math.random() * 60) * 10) / 10; // 8h to 68h
    const isCrit = mttf <= 24;

    const newTask: ProactiveMaintenanceTask = {
      id: `PM-TSK-72H-${idNum}`,
      endpointId: `SENS-MIC-${idNum}`,
      endpointName: `Precision Acoustic Sound-Level Transducer ${idNum}`,
      endpointType: 'ENVIRONMENTAL_COMBO',
      zoneId: 'Fabrication-Machining-Bay',
      zoneName: 'Fabrication & Machining Bay',
      mttfHours: mttf,
      remainingUsefulLifeDays: Math.round((mttf / 24) * 10) / 10,
      failureProbabilityPct: Math.round(75 + Math.random() * 20),
      forecastHorizon: isCrit ? 'CRITICAL_FAIL_24H' : 'HIGH_FAIL_72H',
      kalmanDriftPercent: Math.round((12 + Math.random() * 15) * 10) / 10,
      signalToNoiseRatioDb: 15.4,
      currentAnomalyAttribution:
        'Diaphragm particulate fouling and capacitive preamplifier bias voltage drift detected by Kalman residual monitor.',
      rootCauseVulnerability: 'Microphone condenser membrane micro-tear from acoustic resonance exceeding 110 dBA.',
      prescribedPreventiveAction:
        'Replace transducer cartridge with ruggedized stainless-steel diaphragm (Model GRAS-40AE); perform 94dB acoustic calibration.',
      requiredPartNumber: 'GRAS-40AE-RUGGED (1/2" Prepolarized Free-Field)',
      partLocation: 'Acoustic Calibration Lab, Locker 02',
      assignedTechnician: INITIAL_TECHNICIANS[4],
      costAvoidanceUsd: 6200,
      status: 'AUTO_STAGED',
      triggeredAt: new Date().toISOString(),
      targetCompletionDeadline: new Date(Date.now() + mttf * 3600000).toISOString(),
      priority: isCrit ? 'CRITICAL_24H' : 'HIGH_72H',
      slaHoursRemaining: Math.round(mttf)
    };

    this.tasks = [newTask, ...this.tasks];
    this.notify();
    return newTask;
  }

  /**
   * Export scheduled tasks to CSV.
   */
  public exportTasksCsv(): void {
    const headers = [
      'Task ID',
      'Endpoint ID',
      'Component Name',
      'Zone',
      'Predicted MTTF (Hours)',
      'Failure Probability (%)',
      'Priority',
      'Status',
      'Assigned Technician',
      'Replacement Part Number',
      'Cost Avoidance ($)',
      'Target Deadline'
    ];

    const rows = this.tasks.map((t) => [
      t.id,
      t.endpointId,
      `"${t.endpointName}"`,
      `"${t.zoneName}"`,
      t.mttfHours.toFixed(1),
      `${t.failureProbabilityPct}%`,
      t.priority,
      t.status,
      `"${t.assignedTechnician.name}"`,
      `"${t.requiredPartNumber}"`,
      `$${t.costAvoidanceUsd}`,
      t.targetCompletionDeadline
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proactive-maintenance-tasks-72h-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const proactiveMaintenanceSchedulerService = new ProactiveMaintenanceSchedulerService();

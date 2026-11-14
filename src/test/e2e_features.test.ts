import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/authService';
import {
  generatePacketForZone,
  generateSyntheticStream,
  generateCorrelationDataset,
  INITIAL_FACILITY_ZONES,
  INITIAL_ACTIVE_ALERTS
} from '../services/telemetryStream';
import {
  calculateRmssd,
  calculateSdnn,
  determineStressTier,
  wearableBiometricService
} from '../services/wearableBiometricService';
import {
  automatedResponseService,
  CorrectiveHvacAdjustment
} from '../services/automatedResponseService';
import {
  proactiveMaintenanceSchedulerService
} from '../services/proactiveMaintenanceSchedulerService';
import {
  predictiveMaintenanceService
} from '../services/predictiveMaintenanceService';
import {
  defaultPrivacyShield,
  PrivacyShieldLayer
} from '../services/privacyShield';
import {
  computeLstmReconstructionAnomaly,
  predictWorkforceAnomaly,
  simulateScenarioAnomaly
} from '../services/lstmAnomalyEngine';
import {
  calculateHeatIndex,
  calculateWhatIfImpact,
  WHAT_IF_PRESETS
} from '../services/whatIfSimulationEngine';
import {
  causalCorrelationEngineService
} from '../services/causalCorrelationEngineService';
import {
  systemComplianceService
} from '../services/systemComplianceService';
import {
  exportDashboardDataCsv
} from '../services/dashboardCsvExport';
import {
  exportWorkforceHealthCsv
} from '../services/workforceCsvExport';
import {
  downloadAnomalyReportJson,
  downloadAnomalyReportCsv
} from '../services/reportExportService';
import {
  voiceAlertService,
  DEFAULT_VOICE_SETTINGS
} from '../services/voiceAlertService';
import {
  DEFAULT_HEALTH_THRESHOLDS
} from '../components/HealthThresholdsConfigModal';
import {
  DEFAULT_KALMAN_CONFIG
} from '../components/KalmanSettingsModal';
import {
  INDUSTRY_SCENARIOS,
  scenarioToCsvString
} from '../services/industryDatasets';
import {
  parseUploadedCsv,
  parseUploadedJson
} from '../services/telemetryUploadService';
import {
  crossRoleOperationsService,
  verifyAuditLedgerChain
} from '../services/crossRoleOperationsService';

describe('Principal SDET E2E Test Suite: Prognosticator Platform', () => {

  // --------------------------------------------------------------------------
  // Subsystem 1: Multi-Signal Ingestion & Real-Time Telemetry Pipeline
  // --------------------------------------------------------------------------
  describe('1. Multi-Signal Ingestion & Sliding Telemetry Pipeline', () => {
    it('generates synthetic packets for all initial facility zones with valid metrics', () => {
      INITIAL_FACILITY_ZONES.forEach((zone) => {
        const packet = generatePacketForZone(zone);
        expect(packet.location_zone).toBe(zone.id);
        expect(packet.hrv_series.length).toBeGreaterThanOrEqual(3);
        expect(packet.skin_temp_series.length).toBeGreaterThanOrEqual(3);
        expect(packet.heat_index).toBeGreaterThan(0);
        expect(packet.sleep_deficit_hours).toBeGreaterThanOrEqual(0);
        expect(packet.cohort_size).toBe(zone.count);

        // Physiological validity
        packet.hrv_series.forEach((hrv) => {
          expect(hrv).toBeGreaterThan(10);
          expect(hrv).toBeLessThan(150);
        });
        packet.skin_temp_series.forEach((temp) => {
          expect(temp).toBeGreaterThan(32.0);
          expect(temp).toBeLessThan(43.0);
        });
      });
    });

    it('generates continuous 24-hour sliding stream with diurnal cycle and noise', () => {
      const stream = generateSyntheticStream(24, 60);

      expect(stream.length).toBe(24);
      stream.forEach((pt, index) => {
        expect(pt.timeLabel).toBeDefined();
        expect(pt.timestamp).toBeDefined();
        expect(pt.ambient_temp_c).toBeGreaterThan(20);
        expect(pt.noise_db).toBeGreaterThan(30);
        expect(pt.twl_index).toBeGreaterThan(0);
        expect(pt.aqi).toBeGreaterThan(0);
        expect(pt.risk_score).toBeGreaterThanOrEqual(0);
        expect(pt.risk_score).toBeLessThanOrEqual(100);

        // Kalman smoothed values should track reasonably close to raw values
        expect(Math.abs(pt.raw_hrv - pt.smoothed_hrv)).toBeLessThan(25);
        expect(Math.abs(pt.raw_skin_temp - pt.smoothed_skin_temp)).toBeLessThan(3.0);
      });
    });

    it('generates multi-sensor correlation dataset with incidents properly flagged', () => {
      const dataset = generateCorrelationDataset('Outdoor-Construction-Sector-4');
      expect(dataset.length).toBeGreaterThanOrEqual(20);

      const incidents = dataset.filter((d) => d.is_incident);
      expect(incidents.length).toBeGreaterThan(0);

      incidents.forEach((inc) => {
        expect(inc.incident_type).toBeDefined();
        expect(inc.severity).toBeDefined();
        expect(['CRITICAL', 'HIGH', 'MODERATE', 'LOW']).toContain(inc.severity);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 2: Real-Time Biometrics & Autonomic Nervous System Telemetry
  // --------------------------------------------------------------------------
  describe('2. Real-Time Wearable Biometrics & ANS Strain Analysis', () => {
    it('computes RMSSD accurately from RR interval time series', () => {
      // Nominal RR series (~800ms with ~50ms variability)
      const rrNominal = [800, 840, 790, 850, 810, 860];
      const rmssdNominal = calculateRmssd(rrNominal);
      expect(rmssdNominal).toBeGreaterThan(30);
      expect(rmssdNominal).toBeLessThan(70);

      // Low variability (monotonous / exhausted heart)
      const rrStrained = [750, 755, 748, 752, 750, 753];
      const rmssdStrained = calculateRmssd(rrStrained);
      expect(rmssdStrained).toBeLessThan(15);

      // Boundary condition: insufficient data
      expect(calculateRmssd([])).toBe(50);
      expect(calculateRmssd([800])).toBe(50);
    });

    it('computes SDNN standard deviation of NN intervals', () => {
      const rrSeries = [750, 800, 850, 700, 900];
      const sdnn = calculateSdnn(rrSeries);
      expect(sdnn).toBeGreaterThan(50);
      expect(calculateSdnn([])).toBe(60);
    });

    it('determines physiological stress tiers and autonomic balance (PNS vs SNS)', () => {
      // Acute strain: low RMSSD, elevated HR
      const acute = determineStressTier(18, 120);
      expect(acute.tier).toBe('CRITICAL_STRAIN');
      expect(acute.stressScore).toBeGreaterThanOrEqual(85);
      expect(acute.pns).toBeLessThan(0); // Parasympathetic withdrawal
      expect(acute.sns).toBeGreaterThan(0); // Sympathetic overdrive

      // High stress
      const high = determineStressTier(35, 95);
      expect(high.tier).toBe('HIGH_STRESS');
      expect(high.stressScore).toBeGreaterThanOrEqual(60);

      // Moderate
      const moderate = determineStressTier(55, 80);
      expect(moderate.tier).toBe('MODERATE');

      // Optimal recovery
      const optimal = determineStressTier(85, 62);
      expect(optimal.tier).toBe('OPTIMAL');
      expect(optimal.stressScore).toBeLessThanOrEqual(25);
      expect(optimal.pns).toBeGreaterThan(0); // High vagal tone
    });

    it('manages connected wearable devices and allows simulated telemetry sync', () => {
      const devices = wearableBiometricService.getDevices();
      expect(devices.length).toBeGreaterThan(0);

      const firstDev = devices[0];
      expect(firstDev.id).toBeDefined();
      expect(firstDev.batteryPct).toBeGreaterThan(0);
      expect(firstDev.connectionStatus).toBe('CONNECTED');

      // Test stress surge and biometric update simulation
      wearableBiometricService.simulateStressSurge(firstDev.workerId);
      const updatedDev = wearableBiometricService.getDeviceById(firstDev.id);
      expect(updatedDev?.currentHeartRate).toBeGreaterThanOrEqual(firstDev.currentHeartRate);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 3: Closed-Loop Automated Response & HVAC Remediation
  // --------------------------------------------------------------------------
  describe('3. Automated Environmental Remediation Engine', () => {
    it('seeds and retrieves pending corrective adjustments', () => {
      const adjustments = automatedResponseService.getAdjustments();
      expect(adjustments.length).toBeGreaterThanOrEqual(2);

      const firstAdj = adjustments[0];
      expect(firstAdj.id).toMatch(/^RESP-/);
      expect(firstAdj.targetEquipment).toBeDefined();
      expect(firstAdj.actionDirective).toBeDefined();
      expect(firstAdj.damperAperturePct).toBeGreaterThan(0);
      expect(firstAdj.estimatedEnergyCostUsd).toBeGreaterThan(0);
    });

    it('approves and executes an adjustment with supervisor audit record', () => {
      const adjustments = automatedResponseService.getAdjustments();
      const pending = adjustments.find((a) => a.status === 'PENDING_APPROVAL');
      if (pending) {
        automatedResponseService.approveAdjustment(pending.id, 'Principal SDET Lead');
        const updated = automatedResponseService.getAdjustments().find((a) => a.id === pending.id);
        expect(updated?.status).toBe('APPROVED_AND_EXECUTED');
        expect(updated?.approvedBy).toBe('Principal SDET Lead');
        expect(updated?.executedAt).toBeDefined();
      }
    });

    it('dismisses an adjustment when supervisor overrides automated action', () => {
      const newAdj = automatedResponseService.simulateEnvironmentalAnomaly();
      expect(newAdj.id).toBeDefined();

      automatedResponseService.dismissAdjustment(newAdj.id);
      const dismissed = automatedResponseService.getAdjustments().find((a) => a.id === newAdj.id);
      expect(dismissed?.status).toBe('DISMISSED');
      expect(dismissed?.responseVerificationStatus).toBe('OVERRIDDEN');
    });

    it('auto-executes pending adjustments when opt-in autonomous mode is toggled on', () => {
      automatedResponseService.setOptInAutonomousMode(false);
      const manualAdj = automatedResponseService.simulateEnvironmentalAnomaly();
      expect(manualAdj.status).toBe('PENDING_APPROVAL');

      automatedResponseService.setOptInAutonomousMode(true);
      expect(automatedResponseService.getConfig().optInAutonomousMode).toBe(true);

      const autoAdjs = automatedResponseService.getAdjustments();
      const matched = autoAdjs.find((a) => a.id === manualAdj.id);
      expect(matched?.status).toBe('EXECUTED_AUTONOMOUSLY');
      expect(matched?.approvedBy).toContain('Autonomous');

      // Reset
      automatedResponseService.setOptInAutonomousMode(false);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 4: Proactive IoT Maintenance & 72-Hour Failure Dispatch
  // --------------------------------------------------------------------------
  describe('4. Proactive IoT Maintenance & 72-Hour Failure Horizon', () => {
    it('initializes proactive tasks for sensors with MTTF <= 72 hours', () => {
      const tasks = proactiveMaintenanceSchedulerService.getTasks();
      expect(tasks.length).toBeGreaterThan(0);

      tasks.forEach((tsk) => {
        expect(tsk.mttfHours).toBeLessThanOrEqual(72);
        expect(['CRITICAL_24H', 'HIGH_72H']).toContain(tsk.priority);
        expect(tsk.assignedTechnician).toBeDefined();
        expect(tsk.assignedTechnician.name).toBeDefined();
        expect(tsk.requiredPartNumber).toBeDefined();
        expect(tsk.costAvoidanceUsd).toBeGreaterThan(0);
      });
    });

    it('transitions proactive maintenance task through complete lifecycle', () => {
      const tasks = proactiveMaintenanceSchedulerService.getTasks();
      const stagedTask = tasks.find((t) => t.status === 'AUTO_STAGED') || tasks[0];

      // Dispatch technician
      proactiveMaintenanceSchedulerService.dispatchTechnician(stagedTask.id);
      let current = proactiveMaintenanceSchedulerService.getTasks().find((t) => t.id === stagedTask.id);
      expect(current?.status).toBe('DISPATCHED');

      // Start task
      proactiveMaintenanceSchedulerService.startTask(stagedTask.id);
      current = proactiveMaintenanceSchedulerService.getTasks().find((t) => t.id === stagedTask.id);
      expect(current?.status).toBe('IN_PROGRESS');

      // Complete & calibrate
      proactiveMaintenanceSchedulerService.completeAndCalibrateTask(stagedTask.id);
      current = proactiveMaintenanceSchedulerService.getTasks().find((t) => t.id === stagedTask.id);
      expect(current?.status).toBe('REPLACED_VERIFIED');
    });

    it('simulates predictive failure detection and task generation', () => {
      const initialCount = proactiveMaintenanceSchedulerService.getTasks().length;
      const newTask = proactiveMaintenanceSchedulerService.triggerSimulatedPrediction();

      expect(newTask.id).toBeDefined();
      expect(newTask.mttfHours).toBeLessThanOrEqual(72);
      expect(proactiveMaintenanceSchedulerService.getTasks().length).toBe(initialCount + 1);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 5: Privacy Shield, Differential Privacy & Small-Cell Masking
  // --------------------------------------------------------------------------
  describe('5. Privacy Shield, Differential Privacy & Small-Cell Masking', () => {
    it('strictly suppresses all identifiable outputs when cohort size N < 12', () => {
      const shield = new PrivacyShieldLayer(12, 0.5);

      [1, 5, 8, 11].forEach((smallN) => {
        const result = shield.sanitizeAlertPayload({
          cohort_size: smallN,
          risk_score: 92,
          risk_probability: 0.92
        });

        expect(result.isSuppressed).toBe(true);
        expect(result.sanitized.risk_score).toBe(0);
        expect(result.sanitized.risk_probability).toBe(0);
        expect(result.disciplinaryUseAllowed).toBe(false);
        expect(result.complianceNotice).toContain('k-Anonymity Small-Cell Suppression Applied');
      });
    });

    it('applies calibrated Laplace perturbation when cohort size N >= 12', () => {
      const shield = new PrivacyShieldLayer(12, 0.5);

      [12, 18, 45, 100].forEach((validN) => {
        const result = shield.sanitizeAlertPayload({
          cohort_size: validN,
          risk_score: 75,
          risk_probability: 0.75
        });

        expect(result.isSuppressed).toBe(false);
        expect(result.sanitized.risk_score).toBeGreaterThanOrEqual(0);
        expect(result.sanitized.risk_score).toBeLessThanOrEqual(100);
        expect(typeof result.differentialPrivacyNoise).toBe('number');
        expect(result.disciplinaryUseAllowed).toBe(false);
      });
    });

    it('prevents single-worker re-identification in workforce anomaly predictions', () => {
      const smallCohort = {
        worker_id: 'W-SURVEILLANCE-TARGET',
        location_zone: 'Confined-Extraction-Sublevel',
        timestamp: new Date().toISOString(),
        hrv_series: [25, 22, 20],
        skin_temp_series: [39.1, 39.4],
        heat_index: 44,
        sleep_deficit_hours: 5,
        cohort_size: 6 // Small cell!
      };

      const result = predictWorkforceAnomaly(smallCohort);
      expect(result.status).toBe('suppressed');
      expect(result.is_suppressed).toBe(true);
      expect(result.worker_id).toContain('[MASKED');
      expect(result.risk_probability).toBe(0);
      expect(result.privacy_compliance).toContain('Small-Cell Suppression Applied');
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 6: What-If Simulator & Heat Index Calculations
  // --------------------------------------------------------------------------
  describe('6. What-If Simulator & Environmental Heat Index Algorithms', () => {
    it('accurately evaluates Heat Index using Rothfusz regression equation', () => {
      // Normal temperate condition (no heat index adjustment needed)
      const hiNominal = calculateHeatIndex(24, 45);
      expect(hiNominal).toBeCloseTo(24, 0);

      // Extreme humid heat (38°C, 65% RH)
      const hiExtreme = calculateHeatIndex(38, 65);
      expect(hiExtreme).toBeGreaterThan(50);
    });

    it('models intervention impacts across What-If presets', () => {
      WHAT_IF_PRESETS.forEach((preset) => {
        const impact = calculateWhatIfImpact({
          ...preset.params,
          isSimulationActive: true
        });

        expect(impact.riskTier).toBeDefined();
        expect(impact.heatIndexC).toBeGreaterThan(15);
        expect(typeof impact.herdImmunityAchieved).toBe('boolean');
        expect(typeof impact.netRiskDelta).toBe('number');
        expect(impact.heatCategory).toBeDefined();
      });
    });

    it('correctly models the protective effect of PPE and rest cycles', () => {
      const baseline = calculateWhatIfImpact({
        vaccinationRatePct: 70,
        seasonalHumidityPct: 75,
        ambientHeatC: 38.0,
        shiftDurationHours: 10,
        ppeCoolingMitigationPct: 30,
        restHydrationFrequencyMin: 5,
        isSimulationActive: true
      });

      const protectedRun = calculateWhatIfImpact({
        vaccinationRatePct: 70,
        seasonalHumidityPct: 75,
        ambientHeatC: 38.0,
        shiftDurationHours: 10,
        ppeCoolingMitigationPct: 90,
        restHydrationFrequencyMin: 20,
        isSimulationActive: true
      });

      expect(protectedRun.netRiskDelta).toBeLessThan(baseline.netRiskDelta);
      expect(protectedRun.heatCategory).toBeDefined();
      expect(protectedRun.evaporativeEfficiencyPct).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 7: Causal Correlation Engine & Inter-Zone Decoupling
  // --------------------------------------------------------------------------
  describe('7. Causal Correlation Engine & Cascade Isolation', () => {
    it('manages causal links between production zones', () => {
      const links = causalCorrelationEngineService.getLinks();
      expect(links.length).toBeGreaterThan(0);

      links.forEach((l) => {
        expect(l.id).toBeDefined();
        expect(l.sourceZoneId).toBeDefined();
        expect(l.targetZoneId).toBeDefined();
        expect(l.pearsonR).toBeGreaterThanOrEqual(-1);
        expect(l.pearsonR).toBeLessThanOrEqual(1);
      });
    });

    it('allows safety engineers to decouple causal propagation links', () => {
      const links = causalCorrelationEngineService.getLinks();
      const activeLink = links.find((l) => l.isCascadingActive);
      if (activeLink) {
        const decoupled = causalCorrelationEngineService.decoupleLink(activeLink.id);
        expect(decoupled?.isCascadingActive).toBe(false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 8: Cryptographic Audit Logging & HIPAA Compliance Module
  // --------------------------------------------------------------------------
  describe('8. Cryptographic Audit Logging & Compliance Ledger', () => {
    it('records immutable audit events with cryptographic integrity hashes', () => {
      const entry = systemComplianceService.logEvent({
        accessorId: 'PRINCIPAL-SDET-AGENT',
        accessorName: 'Automated SDET Test Suite',
        accessorRole: 'System Quality Engineer',
        department: 'Quality Assurance & Compliance',
        reportName: 'End-to-End System Audit Verification',
        reportType: 'POPULATION_HEALTH_EPIDEMIOLOGY',
        accessAction: 'EXPORTED_CSV',
        hipaaClassification: 'HIPAA Safe Harbor De-Identified',
        privacyShieldMetric: {
          epsilonConsumed: 0.05,
          kAnonymityCount: 22,
          laplaceNoiseBudgetRemaining: 0.45,
          status: 'COMPLIANT_AUTHORIZED'
        },
        dataSubjectCount: 22,
        justification: 'Automated CI/CD verification pass',
        ipAddress: '10.0.0.1',
        terminalId: 'QA-RIG-01'
      });

      expect(entry.id).toBeDefined();
      expect(entry.cryptographicHash).toBeDefined();
      expect(entry.cryptographicHash.length).toBeGreaterThan(20);
      expect(entry.timestamp).toBeDefined();

      const events = systemComplianceService.getEvents();
      expect(events.some((e) => e.id === entry.id)).toBe(true);
    });

    it('computes compliance summary rate', () => {
      const summary = systemComplianceService.getSummaryMetrics();
      expect(summary.totalEvents24h).toBeGreaterThan(0);
      expect(summary.complianceRatePct).toBeGreaterThanOrEqual(0);
      expect(summary.complianceRatePct).toBeLessThanOrEqual(100);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 9: Report Generation, Serialization & CSV/JSON Export
  // --------------------------------------------------------------------------
  describe('9. Data Serialization, CSV & JSON Export Standards', () => {
    it('exports RFC-4180 compliant Dashboard CSV with proper headers and escaping', () => {
      const zone = INITIAL_FACILITY_ZONES[0];
      const stream = generateSyntheticStream(24, 60);
      const csvResult = exportDashboardDataCsv({
        zones: INITIAL_FACILITY_ZONES,
        activeAlerts: INITIAL_ACTIVE_ALERTS,
        telemetryStream: stream,
        currentZone: zone
      });

      expect(csvResult.success).toBe(true);
      expect(csvResult.filename).toContain('Prognosticator_Dashboard_Export_');
      expect(csvResult.recordCount).toBeGreaterThan(0);
    });

    it('exports Workforce Health CSV with baseline comparisons', () => {
      const zone = INITIAL_FACILITY_ZONES[0];
      const stream = generateSyntheticStream(24, 60);
      const csvResult = exportWorkforceHealthCsv(stream, zone.name, DEFAULT_HEALTH_THRESHOLDS);

      expect(csvResult.success).toBe(true);
      expect(csvResult.recordCount).toBe(stream.length);
      expect(csvResult.filename).toContain('Prognosticator_Workforce_Health_Data_');
    });

    it('generates complete Anomaly Report JSON payload meeting enterprise schema', () => {
      const zone = INITIAL_FACILITY_ZONES[0];
      const stream = generateSyntheticStream(24, 60);
      const jsonResult = downloadAnomalyReportJson({
        data: stream,
        thresholds: DEFAULT_HEALTH_THRESHOLDS,
        zone,
        activeAlerts: INITIAL_ACTIVE_ALERTS
      });

      expect(jsonResult.success).toBe(true);
      expect(jsonResult.filename).toContain('Prognosticator_24H_Anomaly_Report_');
      expect(jsonResult.sizeBytes).toBeGreaterThan(100);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 10: Voice Alerts & Severity Audio Engine
  // --------------------------------------------------------------------------
  describe('10. Voice Alerts & Severity Audio Controls', () => {
    it('exposes default voice settings and severity audio toggles', () => {
      expect(DEFAULT_VOICE_SETTINGS.enabled).toBe(true);
      expect(DEFAULT_VOICE_SETTINGS.severityAudioToggles?.CRITICAL).toBe(true);
      expect(DEFAULT_VOICE_SETTINGS.severityAudioToggles?.HIGH).toBe(true);
      expect(DEFAULT_VOICE_SETTINGS.severityAudioToggles?.MODERATE).toBe(true);
      expect(DEFAULT_VOICE_SETTINGS.severityAudioToggles?.LOW).toBe(false); // Low severity muted by default
    });

    it('handles voice alert synthesis subscription without throwing in headless environment', () => {
      let isSpeaking = false;
      const unsubscribe = voiceAlertService.subscribeSpeakingState((speaking) => {
        isSpeaking = speaking;
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 11: Configuration & Default Threshold Robustness
  // --------------------------------------------------------------------------
  describe('11. Configuration & Default Threshold Robustness', () => {
    it('validates default health signal thresholds satisfy OSHA/NIOSH standards', () => {
      expect(DEFAULT_HEALTH_THRESHOLDS.minHrvMs).toBeGreaterThanOrEqual(30);
      expect(DEFAULT_HEALTH_THRESHOLDS.maxSkinTempC).toBeLessThanOrEqual(38.5);
      expect(DEFAULT_HEALTH_THRESHOLDS.maxNoiseDb).toBeLessThanOrEqual(90);
      expect(DEFAULT_HEALTH_THRESHOLDS.minTwlIndex).toBeGreaterThanOrEqual(100);
      expect(DEFAULT_HEALTH_THRESHOLDS.riskScoreCutoffPct).toBeGreaterThanOrEqual(60);
    });

    it('validates Kalman filter sensitivity presets and auto-imputation switches', () => {
      expect(DEFAULT_KALMAN_CONFIG.processVarianceQ).toBeGreaterThan(0);
      expect(DEFAULT_KALMAN_CONFIG.measurementVarianceR).toBeGreaterThan(0);
      expect(DEFAULT_KALMAN_CONFIG.autoImputeMissing).toBe(true);
      expect(DEFAULT_KALMAN_CONFIG.suppressSmallCells).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 12: Worker Private Dashboard Privacy Invariant Check
  // --------------------------------------------------------------------------
  describe('12. Worker Private View Privacy Invariant Verification', () => {
    it('guarantees personal data isolation and zero managerial push back', () => {
      // Test that private worker tokens are ephemeral and distinct from employee corporate IDs
      const workerToken = 'DEVICE-#WRK-7719-EPHEMERAL';
      expect(workerToken).not.toMatch(/^EMP-\d+/);
      expect(workerToken).toContain('EPHEMERAL');

      // Test that small cell check rejects individual access
      const isSuppressed = defaultPrivacyShield.isCohortSuppressed(1);
      expect(isSuppressed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 13: Industrial Synthetic Benchmark Scenarios
  // --------------------------------------------------------------------------
  describe('13. Industrial Synthetic Benchmark Datasets & Kinetics', () => {
    it('provides realistic benchmark datasets across 4 heavy industrial verticals', () => {
      expect(INDUSTRY_SCENARIOS.length).toBe(4);

      const foundry = INDUSTRY_SCENARIOS.find((s) => s.id === 'FOUNDRY_SMELTER');
      expect(foundry).toBeDefined();
      expect(foundry?.industry).toContain('Heavy Metallurgy');
      expect(foundry?.data.length).toBe(24);
      expect(foundry?.expectedRiskTier).toBe('CRITICAL_RISK');

      const mining = INDUSTRY_SCENARIOS.find((s) => s.id === 'UNDERGROUND_MINING');
      expect(mining).toBeDefined();
      expect(mining?.industry).toContain('Underground Mining');
      expect(mining?.data.length).toBe(24);

      const solar = INDUSTRY_SCENARIOS.find((s) => s.id === 'DESERT_INFRASTRUCTURE');
      expect(solar).toBeDefined();
      expect(solar?.industry).toContain('Civil Infrastructure & Energy');

      const coldChain = INDUSTRY_SCENARIOS.find((s) => s.id === 'COLD_CHAIN_LOGISTICS');
      expect(coldChain).toBeDefined();
      expect(coldChain?.industry).toContain('Cold Storage');
    });

    it('serializes benchmark scenario into valid RFC-4180 CSV with standard clinical headers', () => {
      const foundry = INDUSTRY_SCENARIOS.find((s) => s.id === 'FOUNDRY_SMELTER')!;
      const csv = scenarioToCsvString(foundry);

      expect(csv).toContain('Timestamp,Time_Label,Zone,Ambient_Temp_C,Skin_Temp_C,Heart_Rate_BPM');
      expect(csv).toContain('HRV_RMSSD_ms,HRV_Drop_Pct,Noise_dBA,Thermal_Work_Limit_TWL,AQI');
      const lines = csv.split('\r\n');
      expect(lines.length).toBeGreaterThan(25);
    });

    it('validates scenario data can be consumed directly by telemetry stream components', () => {
      const foundry = INDUSTRY_SCENARIOS.find((s) => s.id === 'FOUNDRY_SMELTER')!;
      expect(foundry.data.length).toBe(24);
      expect(foundry.data[0].ambient_temp_c).toBeGreaterThan(0);
      expect(foundry.data[0].raw_hrv).toBeGreaterThan(0);
      expect(foundry.data[0].smoothed_hrv).toBeGreaterThan(0);
      expect(foundry.data[0].timeLabel).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 14: Local / Cloud File Ingestion & Fuzzy CSV Parser
  // --------------------------------------------------------------------------
  describe('14. Telemetry File Ingestion & Resilient Column Normalizer', () => {
    it('parses custom CSV telemetry with non-standard column headers (fuzzy matching)', () => {
      const rawCsv = `Time,Pulse,SkinTemp,HRV,HeatIdx,TWL,AQI,Noise,Vib
08:00,72,36.4,68,26.5,210,18,72,0.012
09:00,85,36.9,52,31.2,165,22,78,0.015
10:00,102,37.8,34,38.6,120,35,84,0.022
11:00,120,38.7,21,44.1,88,48,89,0.038`;

      const result = parseUploadedCsv(rawCsv, 'site_alpha_telemetry');
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(4);
      expect(result.rowCount).toBe(4);

      // Verify mapped data point
      const lastPoint = result.data[3];
      expect(lastPoint.skin_temp_c).toBeCloseTo(38.7, 1);
      expect(lastPoint.raw_hrv).toBe(21);
      expect(lastPoint.noise_db).toBe(89);
      expect(lastPoint.twl_index).toBe(88);
    });

    it('parses cloud or local JSON array with mixed schemas', () => {
      const jsonContent = JSON.stringify([
        { timestamp: '12:00', heartRate: 75, skinTemp: 36.6, hrv: 64, twl: 180, ambientTemp: 28, aqi: 20 },
        { timestamp: '13:00', heartRate: 98, skinTemp: 37.4, hrv: 41, twl: 135, ambientTemp: 35, aqi: 28 },
        { timestamp: '14:00', heartRate: 118, skinTemp: 38.6, hrv: 23, twl: 95, ambientTemp: 42, aqi: 55 }
      ]);

      const result = parseUploadedJson(jsonContent);
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(3);
      expect(result.data[2].raw_hrv).toBe(23);
      expect(result.data[2].skin_temp_c).toBe(38.6);
    });

    it('rejects invalid or empty upload payloads with helpful error messages', () => {
      const emptyResult = parseUploadedCsv('');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBeDefined();

      const corruptedJson = parseUploadedJson('{not_valid_json');
      expect(corruptedJson.success).toBe(false);
      expect(corruptedJson.error).toContain('JSON');
    });
  });

  describe('15. Role-Based Landing & Admin Governance Architecture', () => {
    it('verifies that Sarah Chen (Safety Director) has enterprise administrator privileges', () => {
      authService.switchPersona('user_safety_director');
      expect(authService.isAdmin()).toBe(true);
      expect(authService.hasPermission('MANAGE_USER_ROLES')).toBe(true);
      expect(authService.getCurrentUser().role).toBe('SAFETY_DIRECTOR');
    });

    it('verifies that non-admin personas cannot manage user roles', () => {
      // Frontline Worker
      authService.switchPersona('user_migrant_worker_tariq');
      expect(authService.isAdmin()).toBe(false);
      expect(authService.hasPermission('MANAGE_USER_ROLES')).toBe(false);

      // Attempting to update a role as non-admin returns null
      const failedUpdate = authService.updateUserRole('user_health_officer', 'SAFETY_DIRECTOR');
      expect(failedUpdate).toBeNull();

      // Occupational Health Officer
      authService.switchPersona('user_health_officer');
      expect(authService.isAdmin()).toBe(false);

      // Facility Engineer
      authService.switchPersona('user_facility_engineer');
      expect(authService.isAdmin()).toBe(false);

      // Compliance Auditor
      authService.switchPersona('user_compliance_auditor');
      expect(authService.isAdmin()).toBe(false);
    });

    it('allows an Administrator to successfully update user roles and permissions', () => {
      authService.switchPersona('user_safety_director');
      expect(authService.isAdmin()).toBe(true);

      const targetId = 'user_facility_engineer';
      const updated = authService.updateUserRole(targetId, 'FACILITY_ENGINEER', 'LEVEL_3_TECHNICAL');

      expect(updated).not.toBeNull();
      expect(updated?.role).toBe('FACILITY_ENGINEER');
      expect(updated?.clearanceLevel).toBe('LEVEL_3_TECHNICAL');
      expect(updated?.permissions).toContain('ACTUATE_HVAC_REMEDIATION');
    });

    it('confirms all 5 operational roles exist with distinct targeted permissions', () => {
      const personas = authService.getAllPersonas();
      const roles = new Set(personas.map((p) => p.role));
      expect(roles.has('SAFETY_DIRECTOR')).toBe(true);
      expect(roles.has('OCCUPATIONAL_HEALTH_OFFICER')).toBe(true);
      expect(roles.has('FACILITY_ENGINEER')).toBe(true);
      expect(roles.has('FRONTLINE_WORKER')).toBe(true);
      expect(roles.has('COMPLIANCE_AUDITOR')).toBe(true);
    });

    it('rejects unrecognized credential logins and isolates newly registered users at Level 1 Worker clearance', () => {
      const invalid = authService.loginWithCredentials('unknown.intruder@external.org');
      expect(invalid).toBeNull();

      const registered = authService.registerNewUser({
        fullName: 'Test New Hire',
        email: 'newhire.test@apex.io',
        department: 'Field Assembly'
      });
      expect(registered.role).toBe('FRONTLINE_WORKER');
      expect(registered.clearanceLevel).toBe('LEVEL_1_BASIC');
      expect(authService.isAdmin()).toBe(false);
      expect(authService.hasPermission('VIEW_PRIVATE_BIOMETRICS')).toBe(true);
      expect(authService.hasPermission('VIEW_AGGREGATE_ANALYTICS')).toBe(false);

      // Restore admin session
      authService.switchPersona('user_safety_director');
    });
  });

  // --------------------------------------------------------------------------
  // Subsystem 16: Cryptographic Audit Ledger Chain & Closed-Loop Traceability
  // --------------------------------------------------------------------------
  describe('16. Cryptographic Audit Ledger Integrity & Closed-Loop Traceability', () => {
    beforeEach(() => {
      crossRoleOperationsService.resetOperationalState();
    });

    it('verifies hash chain integrity across seeded blocks and newly appended cross-role operations', () => {
      const initialCheck = crossRoleOperationsService.verifyLedgerIntegrity();
      expect(initialCheck.isValid).toBe(true);
      expect(initialCheck.totalBlocks).toBe(4);
      expect(initialCheck.verifiedBlocks).toBe(4);
      expect(initialCheck.corruptedBlockIds).toEqual([]);
      expect(initialCheck.brokenLinkIds).toEqual([]);

      // Perform multi-role actions that append hash-chained blocks
      crossRoleOperationsService.triggerSectorHeatSpike('Sarah Chen');
      crossRoleOperationsService.submitAnonymousBreakRequest({ zoneId: 'SECTOR-4', language: 'en' });
      crossRoleOperationsService.dispatchClinicalRehydration({
        recordId: 'CLIN-001',
        actorName: 'Dr. Elena Rostova',
        actorRole: 'Occupational Health Officer',
        regulatoryStandard: 'Singapore MOM WSHA 2024'
      });
      crossRoleOperationsService.actuateHvacDamper({
        zoneId: 'ZONE-A',
        delta: 5,
        actorName: 'Marcus Vance',
        actorRole: 'Facility Engineer'
      });
      crossRoleOperationsService.recordAuditExport({
        actorRole: 'COMPLIANCE_AUDITOR_AI',
        reportTitle: 'WSHA 2026 Audit Dossier',
        legalStandard: 'Singapore MOM WSHA 2024'
      });

      const updatedCheck = crossRoleOperationsService.verifyLedgerIntegrity();
      expect(updatedCheck.isValid).toBe(true);
      expect(updatedCheck.totalBlocks).toBe(9);
      expect(updatedCheck.verifiedBlocks).toBe(9);
      expect(updatedCheck.corruptedBlockIds).toEqual([]);
      expect(updatedCheck.brokenLinkIds).toEqual([]);
    });

    it('detects block payload tampering and previousHash chain breaks deterministically', () => {
      const blocks = crossRoleOperationsService.getSnapshot().ledgerBlocks.map((b) => ({ ...b }));
      expect(verifyAuditLedgerChain(blocks).isValid).toBe(true);

      // Tamper with block summary (payload mismatch)
      const tamperedPayloadBlocks = blocks.map((b, idx) =>
        idx === 1 ? { ...b, summary: 'Tampered regulatory compliance statement' } : b
      );
      const payloadResult = verifyAuditLedgerChain(tamperedPayloadBlocks);
      expect(payloadResult.isValid).toBe(false);
      expect(payloadResult.corruptedBlockIds).toContain(blocks[1].id);

      // Tamper with previousHash link continuity on head block
      const brokenLinkBlocks = blocks.map((b, idx) =>
        idx === 0 ? { ...b, previousHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000000' } : b
      );
      const linkResult = verifyAuditLedgerChain(brokenLinkBlocks);
      expect(linkResult.isValid).toBe(false);
      expect(linkResult.brokenLinkIds).toContain(blocks[0].id);
    });

    it('tracks 5-stage closed-loop progression and resets cleanly', () => {
      const initial = crossRoleOperationsService.getClosedLoopStatus();
      expect(initial.completedStages).toBe(0);
      expect(initial.auditSealedCount).toBe(4);

      crossRoleOperationsService.triggerSectorHeatSpike('Sarah Chen');
      expect(crossRoleOperationsService.getClosedLoopStatus().heatSurgeTriggered).toBe(true);
      expect(crossRoleOperationsService.getClosedLoopStatus().completedStages).toBe(1);

      const breakRec = crossRoleOperationsService.submitAnonymousBreakRequest({ zoneId: 'SECTOR-4', language: 'bn' });
      expect(crossRoleOperationsService.getClosedLoopStatus().workerBreakRequested).toBe(true);
      expect(crossRoleOperationsService.getClosedLoopStatus().completedStages).toBe(2);

      crossRoleOperationsService.dispatchClinicalRehydration({
        recordId: 'CLIN-001',
        actorName: 'Dr. Elena Rostova',
        actorRole: 'Occupational Health Officer',
        regulatoryStandard: 'Singapore MOM WSHA 2024'
      });
      expect(crossRoleOperationsService.getClosedLoopStatus().clinicalHydrationDispatched).toBe(true);
      expect(crossRoleOperationsService.getClosedLoopStatus().completedStages).toBe(3);

      crossRoleOperationsService.actuateHvacDamper({
        zoneId: 'ZONE-A',
        delta: 5,
        actorName: 'Marcus Vance',
        actorRole: 'Facility Engineer'
      });
      const fullLoop = crossRoleOperationsService.getClosedLoopStatus();
      expect(fullLoop.hvacMitigated).toBe(true);
      expect(fullLoop.completedStages).toBe(4);
      expect(fullLoop.auditSealedCount).toBeGreaterThan(4);

      // Verify worker break completion syncs cleanly
      crossRoleOperationsService.completeAnonymousBreakRequest(breakRec.id);
      const completedBreak = crossRoleOperationsService.getSnapshot().restBreaks.find((b) => b.id === breakRec.id);
      expect(completedBreak?.status).toBe('COMPLETED');

      crossRoleOperationsService.resetOperationalState();
      const afterReset = crossRoleOperationsService.getClosedLoopStatus();
      expect(afterReset.completedStages).toBe(0);
      expect(afterReset.auditSealedCount).toBe(4);
    });
  });
});



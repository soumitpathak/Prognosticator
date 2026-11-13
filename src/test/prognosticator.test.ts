import { describe, it, expect } from 'vitest';
import { KalmanFilterSimulator, defaultKalman } from '../services/kalmanFilter';
import { PrivacyShieldLayer, defaultPrivacyShield } from '../services/privacyShield';
import {
  computeLstmReconstructionAnomaly,
  predictWorkforceAnomaly,
  simulateScenarioAnomaly,
  computeHeatIndexFromTempAndHumidity
} from '../services/lstmAnomalyEngine';
import { calculateHeatIndex, calculateWhatIfImpact, WHAT_IF_PRESETS } from '../services/whatIfSimulationEngine';
import {
  generate30DayDegradationProjection,
  predictiveMaintenanceService,
  INITIAL_IOT_ENDPOINTS
} from '../services/predictiveMaintenanceService';
import { causalCorrelationEngineService } from '../services/causalCorrelationEngineService';
import {
  generateWeeklyWorkerDensityMatrix,
  getPast7DaysDates
} from '../services/workerDensityCorrelationService';
import { systemComplianceService } from '../services/systemComplianceService';
import { nlpAnomalyInsightsService } from '../services/nlpAnomalyInsightsService';
import { generateLstm12hForecast } from '../services/lstm12hForecastingService';
import { authService, TARGET_PERSONAS, REGULATORY_FRAMEWORKS } from '../services/authService';

describe('1. Kalman Filter & Signal Processing', () => {
  it('should return an empty array when smoothing an empty or null array', () => {
    const filter = new KalmanFilterSimulator();
    expect(filter.smooth([])).toEqual([]);
    // @ts-expect-error testing runtime null resilience
    expect(filter.smooth(null)).toEqual([]);
  });

  it('should reduce variance and smooth high-frequency sensor noise', () => {
    const filter = new KalmanFilterSimulator(0.01, 0.5);
    const noisyData = [70, 78, 65, 82, 63, 79, 64, 80];
    const smoothed = filter.smooth(noisyData);

    expect(smoothed.length).toBe(noisyData.length);
    for (const val of smoothed) {
      expect(val).toBeGreaterThan(60);
      expect(val).toBeLessThan(85);
    }
    const finalVal = smoothed[smoothed.length - 1];
    expect(Math.abs(finalVal - 72.6)).toBeLessThan(5);
  });

  it('should impute missing or non-finite measurements safely without throwing', () => {
    const filter = new KalmanFilterSimulator();
    const dataWithGaps = [70, NaN, 72, Infinity, -Infinity, 71];
    const smoothed = filter.smooth(dataWithGaps);

    expect(smoothed.length).toBe(dataWithGaps.length);
    smoothed.forEach((val) => {
      expect(Number.isFinite(val)).toBe(true);
    });
  });

  it('should perform single step updates correctly', () => {
    const filter = new KalmanFilterSimulator(0.02, 0.1);
    const step1 = filter.step(75, 70, 1.0);
    expect(step1.estimate).toBeGreaterThan(70);
    expect(step1.estimate).toBeLessThanOrEqual(75);
    expect(step1.covariance).toBeGreaterThan(0);
  });
});

describe('2. Privacy Shield & k-Anonymity Layer', () => {
  it('should enforce k-Anonymity small-cell suppression when cohort N < 12', () => {
    const shield = new PrivacyShieldLayer(12, 0.5);

    expect(shield.isCohortSuppressed(11)).toBe(true);
    expect(shield.isCohortSuppressed(5)).toBe(true);
    expect(shield.isCohortSuppressed(12)).toBe(false);
    expect(shield.isCohortSuppressed(20)).toBe(false);

    const suppressedResult = shield.sanitizeAlertPayload({
      cohort_size: 7,
      risk_score: 85,
      risk_probability: 0.85
    });

    expect(suppressedResult.isSuppressed).toBe(true);
    expect(suppressedResult.sanitized.risk_score).toBe(0);
    expect(suppressedResult.sanitized.risk_probability).toBe(0);
    expect(suppressedResult.disciplinaryUseAllowed).toBe(false);
    expect(suppressedResult.complianceNotice).toContain('Small-Cell Suppression Applied');
  });

  it('should allow cohort aggregation and inject Laplace differential privacy noise when N >= 12', () => {
    const shield = new PrivacyShieldLayer(12, 0.5);
    const result = shield.sanitizeAlertPayload({
      cohort_size: 15,
      risk_score: 50,
      risk_probability: 0.5
    });

    expect(result.isSuppressed).toBe(false);
    expect(typeof result.differentialPrivacyNoise).toBe('number');
    expect(Number.isFinite(result.differentialPrivacyNoise)).toBe(true);
    expect(result.sanitized.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.sanitized.risk_score).toBeLessThanOrEqual(100);
    expect(result.disciplinaryUseAllowed).toBe(false);
  });

  it('should handle Laplace noise sampling safely across multiple draws', () => {
    const shield = new PrivacyShieldLayer(12, 0.5);
    for (let i = 0; i < 50; i++) {
      const sample = shield.sampleLaplace(1.0);
      expect(Number.isFinite(sample)).toBe(true);
      expect(Number.isNaN(sample)).toBe(false);
    }
  });
});

describe('3. LSTM Explainable Anomaly Detection Engine', () => {
  it('should compute physiological reconstruction MSE and tier classifications accurately', () => {
    const normal = computeLstmReconstructionAnomaly([68, 67, 68], [36.5, 36.6], 28.0, 0);
    expect(normal.riskTier).toBe('STABLE');
    expect(normal.riskProbability).toBeLessThan(0.40);
    expect(normal.mseScore).toBeLessThan(0.15);

    const critical = computeLstmReconstructionAnomaly([35, 30, 25], [38.5, 39.0, 39.2], 45.0, 6.0);
    expect(critical.riskTier).toBe('CRITICAL_RISK');
    expect(critical.riskProbability).toBeGreaterThan(0.75);
    expect(critical.attributions['Heart Rate Variability (HRV) Drop']).toBeGreaterThan(0);
    expect(critical.recommendedAction).toContain('Immediate extraction');
  });

  it('should predict workforce anomaly with privacy shield integration', () => {
    const payload = {
      worker_id: 'W-9042',
      location_zone: 'Zone-Foundry-A',
      timestamp: new Date().toISOString(),
      hrv_series: [68, 65, 55, 42, 38],
      skin_temp_series: [36.5, 36.8, 37.4, 38.1],
      heat_index: 41,
      sleep_deficit_hours: 4.5,
      cohort_size: 16
    };

    const result = predictWorkforceAnomaly(payload);
    expect(result.status).toBe('success');
    expect(result.is_suppressed).toBe(false);
    expect(result.risk_probability).toBeGreaterThan(0);
    expect(Object.keys(result.explainable_attributions).length).toBe(4);
  });

  it('should suppress prediction when cohort size violates k-anonymity', () => {
    const smallCohortPayload = {
      worker_id: 'W-SECRET-01',
      location_zone: 'Zone-Isolated-01',
      timestamp: new Date().toISOString(),
      hrv_series: [40, 38],
      skin_temp_series: [38.5],
      heat_index: 44,
      sleep_deficit_hours: 5,
      cohort_size: 4
    };

    const result = predictWorkforceAnomaly(smallCohortPayload);
    expect(result.status).toBe('suppressed');
    expect(result.is_suppressed).toBe(true);
    expect(result.worker_id).toContain('[MASKED');
  });

  it('should simulate scenario anomaly with explainability attributions', () => {
    const simResult = simulateScenarioAnomaly({
      ambientTempC: 42,
      relativeHumidityPct: 75,
      noiseLevelDb: 95,
      trafficDensityLevel: 8,
      workerHeartRateBpm: 135,
      hrvMs: 28,
      sleepDeficitHours: 4.0
    });

    expect(simResult.riskTier).toBe('CRITICAL_RISK');
    expect(simResult.topAttributions.length).toBeGreaterThan(0);
    expect(simResult.topAttributions[0].attributionPct).toBeGreaterThan(0);
    expect(simResult.explainabilitySummary).toContain('LSTM-Kalman engine');
  });
});

describe('4. Heat Index and What-If Simulation Engine', () => {
  it('should compute Heat Index in Celsius consistently', () => {
    const hiHigh = calculateHeatIndex(35, 70);
    expect(hiHigh).toBeGreaterThan(45);

    const hiLow = calculateHeatIndex(22, 50);
    expect(hiLow).toBeCloseTo(22, 0);
  });

  it('should compute What-If parameter impacts and calculate herd immunity transitions', () => {
    const nominal = calculateWhatIfImpact({
      vaccinationRatePct: 82,
      seasonalHumidityPct: 55,
      ambientHeatC: 34.0,
      shiftDurationHours: 8.5,
      ppeCoolingMitigationPct: 85,
      restHydrationFrequencyMin: 15,
      isSimulationActive: true
    });

    expect(nominal.herdImmunityAchieved).toBe(true);
    expect(nominal.netRiskDelta).toBeCloseTo(0, 0);

    const severe = calculateWhatIfImpact({
      vaccinationRatePct: 40,
      seasonalHumidityPct: 80,
      ambientHeatC: 45.0,
      shiftDurationHours: 12.0,
      ppeCoolingMitigationPct: 50,
      restHydrationFrequencyMin: 5,
      isSimulationActive: true
    });

    expect(severe.herdImmunityAchieved).toBe(false);
    expect(severe.netRiskDelta).toBeGreaterThan(20);
    expect(severe.riskTier).toBe('CRITICAL_SURGE');
  });

  it('should validate What-If presets consistency', () => {
    expect(WHAT_IF_PRESETS.length).toBeGreaterThanOrEqual(4);
    const summer = WHAT_IF_PRESETS.find((p) => p.id === 'SUMMER_HEATWAVE');
    expect(summer).toBeDefined();
    expect(summer?.params.ambientHeatC).toBeGreaterThan(40);
  });
});

describe('5. Predictive IoT Maintenance & 30-Day Projections', () => {
  it('should generate 30 days of forward degradation projections', () => {
    const endpoints = predictiveMaintenanceService.getEndpoints();
    expect(endpoints.length).toBeGreaterThan(0);

    const firstEp = endpoints[0];
    const projection = generate30DayDegradationProjection(firstEp, 1.0);

    expect(projection.length).toBe(30);
    expect(projection[0].day).toBe(1);
    expect(projection[29].day).toBe(30);

    expect(projection[29].healthIndex).toBeLessThanOrEqual(projection[0].healthIndex);
    expect(projection[0].healthIndex).toBeLessThanOrEqual(100);
    expect(projection[29].healthIndex).toBeGreaterThanOrEqual(0);
  });

  it('should stage maintenance and execute preventive recalibration', () => {
    const endpoints = predictiveMaintenanceService.getEndpoints();
    const targetId = endpoints[0].endpointId;

    const staged = predictiveMaintenanceService.stageMaintenanceForEndpoint(targetId);
    expect(staged?.isStagedForMaintenance).toBe(true);

    const recalibrated = predictiveMaintenanceService.executePreventiveCalibration(targetId);
    expect(recalibrated?.healthScore).toBe(96);
    expect(recalibrated?.forecastHorizon).toBe('NOMINAL');
    expect(recalibrated?.isStagedForMaintenance).toBe(false);
  });
});

describe('6. Causal Correlation Engine & Inter-Zone Propagation', () => {
  it('should retrieve active inter-zone causal nodes and propagation links', () => {
    const links = causalCorrelationEngineService.getLinks();
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.sourceZoneId).toBeDefined();
      expect(link.targetZoneId).toBeDefined();
      expect(link.pearsonR).toBeGreaterThanOrEqual(-1);
      expect(link.pearsonR).toBeLessThanOrEqual(1);
      expect(link.causalConfidencePct).toBeGreaterThanOrEqual(0);
      expect(link.causalConfidencePct).toBeLessThanOrEqual(100);
    }

    const nodes = causalCorrelationEngineService.getNodes();
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('should simulate cascade and allow decoupling link', () => {
    const links = causalCorrelationEngineService.getLinks();
    const firstLink = links[0];
    const decoupled = causalCorrelationEngineService.decoupleLink(firstLink.id);
    expect(decoupled?.isCascadingActive).toBe(false);
    expect(decoupled?.causalConfidencePct).toBeLessThan(firstLink.causalConfidencePct);

    causalCorrelationEngineService.triggerSimulatedCascade(links[0].sourceZoneId);
    const updatedLinks = causalCorrelationEngineService.getLinks();
    expect(updatedLinks.length).toBeGreaterThan(0);
  });
});

describe('7. Worker Density Correlation & Overcrowding Detection', () => {
  it('should calculate 168-hour weekly density matrix and Pearson correlation coefficient', () => {
    const { cells, summary } = generateWeeklyWorkerDensityMatrix([], 'ALL', 'ALL');

    expect(cells.length).toBe(168);
    expect(summary.totalWeeklyObservations).toBe(168);
    expect(summary.pearsonR).toBeGreaterThan(-1);
    expect(summary.pearsonR).toBeLessThanOrEqual(1);
    expect(summary.dailyStats.length).toBe(7);
    expect(summary.hourlyProfile.length).toBe(24);
  });

  it('should retrieve 7 past calendar dates', () => {
    const days = getPast7DaysDates();
    expect(days.length).toBe(7);
    days.forEach((d) => {
      expect(d.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

describe('8. System Compliance & HIPAA Audit Module', () => {
  it('should record audit events with cryptographic seals and privacy verification', () => {
    const initialEvents = systemComplianceService.getEvents();
    const initialCount = initialEvents.length;

    const newEvent = systemComplianceService.logEvent({
      accessorId: 'USR-TEST-01',
      accessorName: 'Security Lead Jane Doe',
      accessorRole: 'EHS Director',
      department: 'Occupational Health',
      reportName: 'Biometric Anomaly Triage',
      reportType: 'BIOMETRIC_TELEMETRY',
      accessAction: 'VIEWED_STREAM',
      hipaaClassification: 'HIPAA Safe Harbor De-Identified',
      privacyShieldMetric: {
        epsilonConsumed: 0.05,
        kAnonymityCount: 18,
        laplaceNoiseBudgetRemaining: 0.45,
        status: 'COMPLIANT_AUTHORIZED'
      },
      dataSubjectCount: 18,
      justification: 'Automated test suite validation',
      ipAddress: '127.0.0.1',
      terminalId: 'TEST-TERM-01'
    });

    expect(newEvent.cryptographicHash).toBeDefined();
    expect(newEvent.cryptographicHash.length).toBeGreaterThan(20);

    const updatedEvents = systemComplianceService.getEvents();
    expect(updatedEvents.length).toBe(initialCount + 1);

    const metrics = systemComplianceService.getSummaryMetrics();
    expect(metrics.totalEvents24h).toBeGreaterThan(0);
    expect(metrics.complianceRatePct).toBeGreaterThan(70);
  });
});

describe('9. NLP Anomaly Semantic Insights Service', () => {
  it('should synthesize root-cause summaries and entity extraction', () => {
    const report = nlpAnomalyInsightsService.generate24hInsights([], [], 24);

    expect(report.totalAnomaliesProcessed).toBeGreaterThan(0);
    expect(report.topAnomalyTypes.length).toBeGreaterThan(0);
    expect(report.executiveDiagnosticNarrative).toBeDefined();
    expect(report.executiveDiagnosticNarrative.length).toBeGreaterThan(50);
    expect(report.modelMetadata.semanticCoherenceScore).toBeGreaterThan(0.9);
  });
});

describe('10. LSTM 12-Hour Forward Forecasting', () => {
  it('should project 12 hours forward for baseline, heat surge, and mitigated scenarios', () => {
    const dummyAlerts = [
      {
        id: 'A-1',
        worker_id: 'W-1',
        location_zone: 'Outdoor-Construction-Sector-4',
        detected_at: new Date().toISOString(),
        anomaly_metric: 'HRV',
        raw_value: '35 ms',
        kalman_smoothed_value: '36 ms',
        severity: 'CRITICAL' as const,
        kalman_status: 'Jitter Filtered & Validated' as const,
        lead_time: '2h',
        recommended_action: 'Cooling',
        acknowledged: false,
        privacy_status: 'Masked'
      }
    ];

    const baselineForecast = generateLstm12hForecast(dummyAlerts, undefined, { scenario: 'BASELINE' });
    expect(baselineForecast.hours.length).toBe(12);
    expect(baselineForecast.peakHourOffset).toBeGreaterThanOrEqual(1);
    expect(baselineForecast.peakHourOffset).toBeLessThanOrEqual(12);

    const heatSurgeForecast = generateLstm12hForecast(dummyAlerts, undefined, { scenario: 'HEAT_SURGE' });
    expect(heatSurgeForecast.projectedPeakRisk).toBeGreaterThanOrEqual(baselineForecast.projectedPeakRisk);

    const mitigatedForecast = generateLstm12hForecast(dummyAlerts, undefined, { scenario: 'MITIGATED' });
    expect(mitigatedForecast.projectedPeakRisk).toBeLessThanOrEqual(baselineForecast.projectedPeakRisk);
  });
});

describe('11. Rolling 30-Day Health Signals vs. Baseline Metrics', () => {
  it('should generate valid 30-day health telemetry metrics and baseline variance', async () => {
    const { generate30DayWorkforceHealthMetrics } = await import('../services/workforceHealth30DaysService');
    const mockZone = {
      id: 'Outdoor-Construction-Sector-4',
      name: 'Civil & Structural Construction',
      status: 'CRITICAL' as const,
      count: 24,
      temp: '38.5°C',
      heatIndex: 43.2,
      twl: 112,
      aqi: 72,
      description: 'Outdoor high heat zone',
      activeHazards: ['Heat Stress'],
      latitude: 25.2,
      longitude: 55.3,
      customBaselines: {
        baselineHrv: 68,
        baselineSkinTemp: 36.4,
        noiseLimitDb: 85,
        heatThresholdC: 35
      }
    };

    const result = generate30DayWorkforceHealthMetrics(mockZone);
    expect(result.data.length).toBe(30);

    // Verify day sequence and values
    result.data.forEach((day, idx) => {
      expect(day.dayIndex).toBe(idx);
      expect(day.avgHrv).toBeGreaterThan(20);
      expect(day.avgHrv).toBeLessThan(120);
      expect(day.avgSkinTemp).toBeGreaterThan(34);
      expect(day.avgSkinTemp).toBeLessThan(42);
      expect(day.thermalWorkLimit).toBeGreaterThan(80);
      expect(day.thermalWorkLimit).toBeLessThan(250);
      expect(day.healthSafetyScore).toBeGreaterThanOrEqual(0);
      expect(day.healthSafetyScore).toBeLessThanOrEqual(100);
    });

    // Verify summary statistics
    expect(result.summary.meanHrvMs).toBeGreaterThan(30);
    expect(result.summary.meanSkinTempC).toBeGreaterThan(35);
    expect(result.summary.meanThermalWorkLimit).toBeGreaterThan(90);
  });
});

describe('11. Enterprise User Personas & RBAC / PBAC Authorization', () => {
  it('loads all targeted challenge personas with assigned workforce categories', () => {
    const personas = authService.getAllPersonas();
    expect(personas.length).toBeGreaterThanOrEqual(5);

    const roles = personas.map((p) => p.role);
    expect(roles).toContain('SAFETY_DIRECTOR');
    expect(roles).toContain('OCCUPATIONAL_HEALTH_OFFICER');
    expect(roles).toContain('FACILITY_ENGINEER');
    expect(roles).toContain('FRONTLINE_WORKER');
    expect(roles).toContain('COMPLIANCE_AUDITOR');

    const migrantWorkers = personas.filter((p) => p.workforceType === 'MIGRANT_WORKFORCE');
    expect(migrantWorkers.length).toBe(1);
    expect(migrantWorkers[0].id).toBe('user_migrant_worker_tariq');
    expect(migrantWorkers[0].primaryLanguage).toBe('en');
  });

  it('permits safety directors to actuate HVAC and configure thresholds', () => {
    authService.switchPersona('user_safety_director');
    expect(authService.hasPermission('ACTUATE_HVAC_REMEDIATION')).toBe(true);
    expect(authService.hasPermission('CONFIGURE_GLOBAL_THRESHOLDS')).toBe(true);
    expect(authService.hasPermission('DISPATCH_MEDICAL_EMERGENCY')).toBe(true);

    const policy = authService.evaluatePolicy('ACTUATE_HVAC_REMEDIATION');
    expect(policy.allowed).toBe(true);
    expect(policy.policyCode).toBe('PBAC_PERMIT_200');
  });

  it('enforces sovereign privacy shield on frontline migrant workers (denies manager surveillance)', () => {
    authService.switchPersona('user_migrant_worker_tariq');
    expect(authService.hasPermission('VIEW_PRIVATE_BIOMETRICS')).toBe(true);
    expect(authService.hasPermission('REQUEST_ANONYMOUS_REST_BREAK')).toBe(true);

    // Frontline worker cannot access aggregate managerial surveillance
    expect(authService.hasPermission('VIEW_AGGREGATE_ANALYTICS')).toBe(false);
    expect(authService.hasPermission('ACTUATE_HVAC_REMEDIATION')).toBe(false);

    const policy = authService.evaluatePolicy('VIEW_AGGREGATE_ANALYTICS');
    expect(policy.allowed).toBe(false);
    expect(policy.policyCode).toBe('PBAC_DENY_WORKER_SOVEREIGN_ISOLATION');
  });

  it('restricts government compliance auditors to read-only oversight', () => {
    authService.switchPersona('user_compliance_auditor');
    expect(authService.hasPermission('VIEW_COMPLIANCE_AUDIT_LOGS')).toBe(true);
    expect(authService.hasPermission('EXPORT_CERTIFIED_REPORTS')).toBe(true);
    expect(authService.hasPermission('ACTUATE_HVAC_REMEDIATION')).toBe(false);

    const policy = authService.evaluatePolicy('ACTUATE_HVAC_REMEDIATION');
    expect(policy.allowed).toBe(false);
    expect(policy.policyCode).toBe('PBAC_DENY_AUDITOR_READONLY');
  });
});

describe('12. Country & Migrant Workforce Regulatory Compliance', () => {
  it('validates Singapore MOM WSH Act and Heat Stress 2024 parameters', () => {
    const sg = REGULATORY_FRAMEWORKS.SINGAPORE_MOM;
    expect(sg.countryName).toBe('Singapore');
    expect(sg.regulatoryBody).toContain('Ministry of Manpower');
    expect(sg.wbgtThresholds.moderateRestMinsPerHour).toBe(15);
    expect(sg.wbgtThresholds.highRestMinsPerHour).toBe(30);
    expect(sg.wbgtThresholds.stopWorkWbgtC).toBe(33.0);
    expect(sg.migrantWorkforceProtections.mandatoryLanguages).toContain('Bengali (বাংলা)');
    expect(sg.migrantWorkforceProtections.mandatoryLanguages).toContain('Tamil (தமிழ்)');
    expect(sg.complianceStatus).toBe('FULLY_COMPLIANT');
  });

  it('validates GCC MoHRE Midday Summer Work Ban regulations', () => {
    const gcc = REGULATORY_FRAMEWORKS.GCC_MOHRE;
    expect(gcc.regulatoryBody).toContain('MoHRE');
    expect(gcc.migrantWorkforceProtections.middayWorkBanApplies).toBe(true);
    expect(gcc.migrantWorkforceProtections.middayBanHours).toContain('12:30 PM to 3:00 PM');
    expect(gcc.migrantWorkforceProtections.coolingStationsRequired).toBe(true);
  });

  it('validates US OSHA & NIOSH Heat NEP and HIPAA Safe Harbor', () => {
    const us = REGULATORY_FRAMEWORKS.US_OSHA_NIOSH;
    expect(us.keyActs.some((act) => act.includes('OSHA National Emphasis Program'))).toBe(true);
    expect(us.keyActs.some((act) => act.includes('HIPAA'))).toBe(true);
    expect(us.complianceStatus).toBe('FULLY_COMPLIANT');
  });
});

describe('13. Global i18n, Single-Select Language Optimization & RTL Support', async () => {
  const { i18nService, LANGUAGE_OPTIONS } = await import('../services/i18nService');

  it('defaults to English and provides single-select autocomplete language options', () => {
    expect(i18nService.getLanguage()).toBe('en');
    expect(LANGUAGE_OPTIONS.length).toBe(8);
    expect(LANGUAGE_OPTIONS.map((l) => l.code)).toEqual(['en', 'bn', 'ta', 'zh', 'tl', 'ar', 'hi', 'es']);
  });

  it('switches across all supported languages one at a time and optimizes directionality for RTL', () => {
    for (const option of LANGUAGE_OPTIONS) {
      i18nService.setLanguage(option.code);
      expect(i18nService.getLanguage()).toBe(option.code);
      expect(i18nService.getLanguageOption().direction).toBe(option.code === 'ar' ? 'rtl' : 'ltr');

      const dict = i18nService.getTranslations(option.code);
      expect(dict.home.signInTitle.length).toBeGreaterThan(0);
      expect(dict.home.previewTitle.length).toBeGreaterThan(0);
      expect(dict.home.previewPrivacy.length).toBeGreaterThan(0);
      expect(dict.shell.logOut.length).toBeGreaterThan(0);
      expect(dict.shell.loadingWorker.length).toBeGreaterThan(0);
      expect(dict.worker.title.length).toBeGreaterThan(0);
      expect(dict.worker.migrantPassBadge.length).toBeGreaterThan(0);
      expect(dict.worker.twlSevereHeatBadge.length).toBeGreaterThan(0);
      expect(dict.worker.middayWorkBanPrefix.length).toBeGreaterThan(0);
      expect(dict.clinician.title.length).toBeGreaterThan(0);
      expect(dict.engineer.title.length).toBeGreaterThan(0);
      expect(dict.auditor.title.length).toBeGreaterThan(0);
      expect(dict.manager.surveillanceCommand.length).toBeGreaterThan(0);
    }
    i18nService.setLanguage('en');
  });
});

describe('14. Cross-Role Live Operations Bus & Audit Chain Synchronization', async () => {
  const { crossRoleOperationsService } = await import('../services/crossRoleOperationsService');

  it('propagates Worker anonymous break to Clinical Triage, Director Relief, and Auditor SHA-256 Ledger with Zero PII', () => {
    crossRoleOperationsService.resetOperationalState();
    const initialBlocks = crossRoleOperationsService.getSnapshot().ledgerBlocks.length;

    const brk = crossRoleOperationsService.submitAnonymousBreakRequest({
      zoneId: 'Sector 4 Heavy Works',
      language: 'ar',
      skinTempC: 38.0,
      hrvMs: 42
    });

    const snapAfterWorker = crossRoleOperationsService.getSnapshot();
    expect(brk.ephemeralToken).toMatch(/^ANON-\d{4}$/);
    expect(snapAfterWorker.restBreaks[0].status).toBe('DISPATCHED');
    expect(snapAfterWorker.ledgerBlocks.length).toBe(initialBlocks + 1);
    expect(snapAfterWorker.ledgerBlocks[0].eventType).toBe('REST_BREAK_ISSUED');
    expect(snapAfterWorker.triageQueue.some((t) => t.workerPseudonym === brk.ephemeralToken)).toBe(true);

    // Zero PII check on ledger block and activity feed
    expect(JSON.stringify(snapAfterWorker.ledgerBlocks[0])).not.toContain('tariq');

    // Director acknowledges relief -> Worker break updates to HYDRATION_DISPATCHED
    const ackCount = crossRoleOperationsService.acknowledgePendingCoolingBreaks('Sarah Chen, CSP');
    expect(ackCount).toBe(1);
    const snapAfterAck = crossRoleOperationsService.getSnapshot();
    expect(snapAfterAck.restBreaks[0].status).toBe('HYDRATION_DISPATCHED');
    expect(snapAfterAck.ledgerBlocks.length).toBe(initialBlocks + 2);
  });

  it('propagates Engineer HVAC damper actuation and Clinician rehydration to shared state and Auditor ledger', () => {
    crossRoleOperationsService.resetOperationalState();
    const beforeTwl = crossRoleOperationsService.getSnapshot().hvacZones[0].twl;

    crossRoleOperationsService.actuateHvacDamper({
      zoneId: 'ZONE-A',
      delta: 5,
      actorName: 'Marcus Vance, PE',
      actorRole: 'Lead Mechanical Engineer'
    });

    const snap = crossRoleOperationsService.getSnapshot();
    expect(snap.hvacZones[0].twl).toBeGreaterThan(beforeTwl);
    expect(snap.ledgerBlocks[0].eventType).toBe('HVAC_ACTUATION');

    crossRoleOperationsService.dispatchClinicalRehydration({
      recordId: 'CLIN-001',
      actorName: 'Dr. Aravind Krishnan',
      actorRole: 'Chief Occupational Health Officer',
      regulatoryStandard: 'Singapore MOM & HIPAA §164.514'
    });

    const snap2 = crossRoleOperationsService.getSnapshot();
    expect(snap2.triageQueue.find((r) => r.id === 'CLIN-001')?.status).toBe('DISPATCHED');
    expect(snap2.ledgerBlocks[0].eventType).toBe('MEDICAL_DISPATCH');
  });
});





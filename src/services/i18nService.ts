import { useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'bn' | 'ta' | 'zh' | 'tl' | 'ar' | 'hi' | 'es';

export interface LanguageOption {
  code: SupportedLanguage;
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  regionLabel: string;
  keywords: string[];
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    direction: 'ltr',
    regionLabel: 'Global · US / SG / EU',
    keywords: ['english', 'en', 'us', 'uk', 'singapore', 'default']
  },
  {
    code: 'bn',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    direction: 'ltr',
    regionLabel: 'South Asia · SG / GCC',
    keywords: ['bengali', 'bangla', 'bn', 'বাংলা', 'bangladesh']
  },
  {
    code: 'ta',
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    direction: 'ltr',
    regionLabel: 'South Asia · Singapore MOM',
    keywords: ['tamil', 'ta', 'தமிழ்', 'singapore', 'india']
  },
  {
    code: 'zh',
    englishName: 'Chinese (Mandarin)',
    nativeName: '中文',
    direction: 'ltr',
    regionLabel: 'East Asia · Singapore MOM',
    keywords: ['chinese', 'mandarin', 'zh', 'cn', '中文', '普通话']
  },
  {
    code: 'tl',
    englishName: 'Tagalog',
    nativeName: 'Tagalog',
    direction: 'ltr',
    regionLabel: 'Southeast Asia · ASEAN',
    keywords: ['tagalog', 'filipino', 'tl', 'pilipino', 'philippines']
  },
  {
    code: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    regionLabel: 'Middle East · GCC MoHRE',
    keywords: ['arabic', 'ar', 'العربية', 'gcc', 'uae', 'rtl']
  },
  {
    code: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    regionLabel: 'South Asia · GCC / Global',
    keywords: ['hindi', 'hi', 'हिन्दी', 'india']
  },
  {
    code: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    regionLabel: 'Americas · US OSHA',
    keywords: ['spanish', 'espanol', 'es', 'español', 'osha']
  }
];

export interface TranslationDictionary {
  langSelector: {
    label: string;
    placeholder: string;
    noMatch: string;
    selectOneHint: string;
  };
  home: {
    brandSubtitle: string;
    adminGovernanceBadge: string;
    heroKicker: string;
    heroTitle: string;
    heroDescription: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    signInTitle: string;
    signUpTitle: string;
    forgotTitle: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    forgotSubtitle: string;
    tabSignIn: string;
    tabSignUp: string;
    googleSsoBtn: string;
    orCredentials: string;
    emailLabel: string;
    passwordLabel: string;
    rememberMe: string;
    forgotLink: string;
    signInSubmitBtn: string;
    directoryHeader: string;
    roleDirectorBtn: string;
    roleClinicianBtn: string;
    roleEngineerBtn: string;
    roleAuditorBtn: string;
    roleWorkerBtn: string;
    signupNoticeTitle: string;
    signupNoticeDesc: string;
    fullNameLabel: string;
    deptLabel: string;
    confirmPasswordLabel: string;
    signupSubmitBtn: string;
    alreadyHaveAccount: string;
    forgotDesc: string;
    resetSubmitBtn: string;
    backToSignIn: string;
    footerCopyright: string;
    footerTagline: string;
    previewTitle: string;
    previewDesc: string;
    previewHeatIndex: string;
    previewMse: string;
    previewPrivacy: string;
  };
  shell: {
    surveillanceActive: string;
    roleTabDirector: string;
    roleTabClinician: string;
    roleTabEngineer: string;
    roleTabAuditor: string;
    roleTabWorker: string;
    strictRoleSeparation: string;
    switchLabel: string;
    rbacLabel: string;
    statutesLabel: string;
    sovereignShield: string;
    a11yLabel: string;
    logOut: string;
    adminPreviewTitle: string;
    adminPreviewViewing: string;
    returnToExec: string;
    footerCopyright: string;
    footerCertified: string;
    footerInvariants: string;
    loadingGateway: string;
    loadingDirector: string;
    loadingClinician: string;
    loadingEngineer: string;
    loadingAuditor: string;
    loadingWorker: string;
  };
  worker: {
    title: string;
    zeroSurveillance: string;
    privacyNotice: string;
    autonomicRecovery: string;
    mildStrainNotice: string;
    skinTemp: string;
    skinTempNotice: string;
    sleepBufferTitle: string;
    sleepBufferNotice: string;
    hydrationCountdown: string;
    hydrationNotice: string;
    loggedToday: string;
    portionsLabel: string;
    logButton: string;
    cooldownTitle: string;
    cooldownDesc: string;
    cooldownHelper: string;
    requestBreakBtn: string;
    breakDispatchedTitle: string;
    breakDispatchedDesc: string;
    resumeShiftBtn: string;
    statutoryNotice: string;
    loggedWorkerLabel: string;
    ephemeralKeyActive: string;
    statutoryHeader: string;
    dormitoryHeader: string;
    whistleblowerHeader: string;
    languageAccessLabel: string;
    migrantPassBadge: string;
    hrvDeltaTag: string;
    highStrainLabel: string;
    nominalRecoveryLabel: string;
    skinDeltaTag: string;
    baselineTempLabel: string;
    exhaustionTempLabel: string;
    hoursUnit: string;
    restorativeTag: string;
    sleepDeficitLabel: string;
    sleepOptimalLabel: string;
    twlSevereHeatBadge: string;
    hydrationConfirmedPrefix: string;
    siteMedicalSafetyTeam: string;
    middayWorkBanPrefix: string;
    wbgtRestCyclesPrefix: string;
  };
  clinician: {
    title: string;
    badge: string;
    loggedInAs: string;
    jurisdiction: string;
    hipaaGuarded: string;
    zeroDisciplinary: string;
    scopePermitted: string;
    scopeBlocked: string;
    tabTriage: string;
    tabAnalytics: string;
    tabSimulator: string;
    tabAuditReports: string;
    kpiHrv: string;
    kpiSkinTemp: string;
    kpiMeanHr: string;
    kpiRehydration: string;
    triageQueueTitle: string;
    triageQueueDesc: string;
    markEvaluated: string;
    dispatchLiaison: string;
    ansCorrelationTitle: string;
    ansCorrelationDesc: string;
    ethicalBoundaryTitle: string;
    ethicalBoundaryDesc: string;
    cohortAnalyticsTitle: string;
    cohortAnalyticsDesc: string;
    simulatorTitle: string;
    projectedOutcomeTitle: string;
    auditTrailTitle: string;
    certifiedExportsTitle: string;
    exportPdfBtn: string;
    exportCsvBtn: string;
  };
  engineer: {
    title: string;
    badge: string;
    loggedInAs: string;
    jurisdiction: string;
    chillerActive: string;
    bacnetConnected: string;
    scopePermitted: string;
    scopeBlocked: string;
    tabHvac: string;
    tabMaintenance: string;
    tabSimulator: string;
    tabAudit: string;
    kpiTwl: string;
    kpiAch: string;
    kpiVibration: string;
    kpiWorkOrders: string;
    sectorVentTitle: string;
    sectorVentDesc: string;
    remediationQueueTitle: string;
    aggregateEnvTitle: string;
    vibrationTelemetryTitle: string;
    maintenanceQueueTitle: string;
    simulatorTitle: string;
    projectedThermalTitle: string;
    auditLogTitle: string;
    damperMinus: string;
    damperPlus: string;
    approveActuate: string;
    overrideBtn: string;
  };
  auditor: {
    title: string;
    badge: string;
    loggedInAs: string;
    primaryJurisdiction: string;
    exportDossierBtn: string;
    scopePermitted: string;
    scopeBlocked: string;
    tabLedger: string;
    tabAggregate: string;
    tabExports: string;
    kpiMomWsha: string;
    kpiKAnonymity: string;
    kpiEpsilon: string;
    kpiAuditChain: string;
    ledgerTitle: string;
    ledgerDesc: string;
    liveHipaaEvents: string;
    privacyProofTitle: string;
    privacyProofDesc: string;
    legalWarrantyTitle: string;
    aggregateComplianceTitle: string;
    multiJurisdictionTitle: string;
    certifiedExportsTitle: string;
    certifiedExportsDesc: string;
  };
  manager: {
    surveillanceCommand: string;
    monitoredPersonnel: string;
    kalmanActive: string;
    roleView: string;
    safetyOfficer: string;
    maintenanceCrew: string;
    opsLead: string;
    mute: string;
    alertsMuted: string;
    downloadCsv: string;
    downloadPdfReport: string;
    simulateKalman: string;
    whatIfSimulator: string;
    ingestBenchmarks: string;
    reportsExport: string;
    signalVisibility: string;
    cardiacSignals: string;
    environmentalSignals: string;
    performanceSignals: string;
    historicalMovingAvg: string;
    resetFilters: string;
    configureSignals: string;
    execOverviewHeader: string;
    kpiActiveAnomalies: string;
    kpiWorkerCoverage: string;
    kpiEngineUptime: string;
    kpiSystemLatency: string;
    tabLive: string;
    tabResources: string;
    tabComplianceAudit: string;
    tabHipaaLog: string;
    tabPredictiveMaint: string;
    tabCorrelation: string;
    tabWorkerDensity: string;
    tabPatternLibrary: string;
  };
}

const EN: TranslationDictionary = {
  langSelector: {
    label: 'Language',
    placeholder: 'Search or select language...',
    noMatch: 'No matching language found',
    selectOneHint: 'Select one language at a time',
  },
  home: {
    brandSubtitle: 'Multi-Signal Workforce Health Early-Warning Intelligence',
    adminGovernanceBadge: 'Admin-Managed Role Governance',
    heroKicker: 'Near-Real-Time Population & Workforce Health Intelligence',
    heroTitle: 'Synthesize disparate signals to prevent health threats before they escalate.',
    heroDescription:
      'Early signs of heat stress, autonomic collapse, or occupational overexposure rarely sit in a single database. Prognosticator unites continuous wearable biometrics, environmental microclimate telemetry, workplace acoustic levels, and absence patterns into calibrated, explainable early warnings.',
    card1Title: 'Industrial Surveillance Command',
    card1Desc: 'Live biometric heat maps & 12-hour predictive anomaly forecasting.',
    card2Title: 'Edge Biometric & Microclimate IoT',
    card2Desc: 'Continuous HRV, epidermal temperature, and Thermal Work Limit (TWL).',
    signInTitle: 'Enterprise Sign In',
    signUpTitle: 'Request Enterprise Access',
    forgotTitle: 'Reset Security Token',
    signInSubtitle: 'Authorized workforce identity & access console.',
    signUpSubtitle: 'Role & persona clearance verified by Administrator.',
    forgotSubtitle: 'Dispatch recovery credentials to work email.',
    tabSignIn: 'Sign In',
    tabSignUp: 'Sign Up',
    googleSsoBtn: 'Sign In with Google Cloud SSO',
    orCredentials: 'Or Enterprise Credentials',
    emailLabel: 'Corporate Work Email',
    passwordLabel: 'Password or SSO Security Key',
    rememberMe: 'Remember workstation',
    forgotLink: 'Forgot password?',
    signInSubmitBtn: 'Sign In to Surveillance Console',
    directoryHeader: 'Directory Quick-Fill by Role & Landing Console:',
    roleDirectorBtn: 'Safety Director (Admin)',
    roleClinicianBtn: 'Clinical Health MD',
    roleEngineerBtn: 'Facility Engineer',
    roleAuditorBtn: 'WSH Compliance Auditor',
    roleWorkerBtn: 'Frontline Worker',
    signupNoticeTitle: 'Zero-Trust Admin Role Governance',
    signupNoticeDesc:
      'New registrations start at Level 1 Sovereign Worker clearance until the site Safety Director (Admin) assigns an elevated operational role in the RBAC console.',
    fullNameLabel: 'Full Legal Name',
    deptLabel: 'Department / Operational Division',
    confirmPasswordLabel: 'Confirm Password',
    signupSubmitBtn: 'Request Access & Register Account',
    alreadyHaveAccount: 'Already have an account?',
    forgotDesc:
      'Enter your enterprise work email. A cryptographic recovery token will be dispatched to your inbox or company SSO directory.',
    resetSubmitBtn: 'Dispatch Password Reset Link',
    backToSignIn: '← Back to Sign In',
    footerCopyright: '© 2026 Prognosticator System. All rights reserved.',
    footerTagline: 'Role-Governed Health Early-Warning Architecture',
    previewTitle: 'Live Edge Signal Preview',
    previewDesc: 'Kalman-smoothed thermal & autonomic telemetry before sign-in',
    previewHeatIndex: 'Heat Index',
    previewMse: 'Baseline MSE',
    previewPrivacy: 'Privacy Shield'
  },
  shell: {
    surveillanceActive: 'Surveillance Active:',
    roleTabDirector: 'Executive Command',
    roleTabClinician: 'Clinical Health',
    roleTabEngineer: 'Facility HVAC',
    roleTabAuditor: 'WSH Audit',
    roleTabWorker: 'Worker Shield',
    strictRoleSeparation: 'Strict Role Separation',
    switchLabel: 'SWITCH',
    rbacLabel: 'RBAC',
    statutesLabel: 'Statutes',
    sovereignShield: 'Sovereign Privacy Shield',
    a11yLabel: 'A11y',
    logOut: 'Log Out',
    adminPreviewTitle: 'Admin Role Audit Preview:',
    adminPreviewViewing: 'Viewing the exact landing console for',
    returnToExec: 'Return to Executive Command →',
    footerCopyright: '© 2026 Prognosticator Intelligence Platform',
    footerCertified: 'HIPAA Shield Certified',
    footerInvariants: 'Dual Workforce Equity · Non-Punitive Telemetry · k-Anonymity (N ≥ 12) & ε-DP (0.5) Enforced',
    loadingGateway: 'Loading Enterprise Authentication Gateway...',
    loadingDirector: 'Loading Executive Command Console...',
    loadingClinician: 'Loading Occupational Health & Clinical Triage Console...',
    loadingEngineer: 'Loading Facility Engineering & Mechanical Reliability Console...',
    loadingAuditor: 'Loading Statutory Regulatory Compliance & WSH Audit Inspectorate...',
    loadingWorker: 'Loading sovereign private biometric shield...'
  },
  worker: {
    title: 'Private Worker Biometric & Recovery Terminal',
    zeroSurveillance: 'Zero Managerial Surveillance',
    privacyNotice:
      'Your individual telemetry is protected by Prognosticator’s privacy shield (k-Anonymity N ≥ 12). Under company policy, MOM & HIPAA, this data cannot be used for disciplinary actions or wage docking.',
    autonomicRecovery: 'Autonomic Recovery',
    mildStrainNotice:
      'Heart Rate Variability shows mild cardiovascular strain from sustained thermal exposure in Sector 4.',
    skinTemp: 'Skin & Thermal Load',
    skinTempNotice:
      'Skin temperature is climbing due to high ambient radiation in Sector 4. Evaporative cooling threshold approached.',
    sleepBufferTitle: 'Sleep & Fatigue Buffer',
    sleepBufferNotice:
      'Circadian buffer remains resilient. Nighttime recovery sleep in dormitory met quality thermal thresholds.',
    hydrationCountdown: 'Hydration & Electrolyte Countdown',
    hydrationNotice:
      'Minimum fluid target: 250ml electrolyte solution every 20 minutes under severe thermal load.',
    loggedToday: 'Logged Today:',
    portionsLabel: 'portions',
    logButton: 'Log 250ml Consumed',
    cooldownTitle: 'Autonomous Cooling Break Request',
    cooldownDesc:
      'Under Singapore MOM & GCC MoHRE Heat Regulations, every worker has an unconditional statutory right to take immediate shaded rest if experiencing dizziness or heat exhaustion.',
    cooldownHelper:
      'Clicking below dispatches an anonymous, non-punitive relief rotation request to your zone safety officer.',
    requestBreakBtn: 'Request Immediate Shaded Cool-Down (Non-Punitive)',
    breakDispatchedTitle: 'Cooling Break Dispatched',
    breakDispatchedDesc:
      'Medical liaison and shaded hydration tent notified. You may immediately stand down without penalty.',
    resumeShiftBtn: 'Cool-Down Completed • Resume Active Shift',
    statutoryNotice: 'Protected by Singapore MOM WSH Act & GCC MoHRE Midday Work Ban Regulations.',
    loggedWorkerLabel: 'Logged Worker',
    ephemeralKeyActive: 'Ephemeral Sovereign Key Active',
    statutoryHeader: 'Active Statutory Protection',
    dormitoryHeader: 'Dormitory & Cooling Standard',
    whistleblowerHeader: 'Non-Punitive Whistleblower Guarantee',
    languageAccessLabel: 'Preferred Console Language',
    migrantPassBadge: 'Migrant Pass Holder',
    hrvDeltaTag: '(-14% from rest)',
    highStrainLabel: 'High Strain',
    nominalRecoveryLabel: 'Nominal Recovery (68 ms)',
    skinDeltaTag: '(Elevated +0.9°C)',
    baselineTempLabel: 'Baseline 36.5°C',
    exhaustionTempLabel: 'Exhaustion >38.2°C',
    hoursUnit: 'hrs',
    restorativeTag: '(Restorative)',
    sleepDeficitLabel: 'Deficit (<5h)',
    sleepOptimalLabel: 'Optimal (>7h)',
    twlSevereHeatBadge: 'TWL 115 W/m² (Severe Heat)',
    hydrationConfirmedPrefix: 'Shaded hydration & cooling support confirmed by',
    siteMedicalSafetyTeam: 'Site Medical & Safety Team',
    middayWorkBanPrefix: 'Midday Work Ban Active:',
    wbgtRestCyclesPrefix: 'Live WBGT Rest Cycles:'
  },
  clinician: {
    title: 'Occupational Health & Clinical Triage Center',
    badge: 'CLINICAL MD CONSOLE',
    loggedInAs: 'Logged in as',
    jurisdiction: 'Jurisdiction:',
    hipaaGuarded: 'HIPAA §164.514 & GDPR Art. 9 Guarded',
    zeroDisciplinary: 'Zero Disciplinary Tracking',
    scopePermitted:
      'Clinical Scope Permitted: Physiological Triage, Emergency Medical Dispatch, Aggregate Cohort Analytics, Clinical What-If Modeling, Certified Reports & HIPAA Audit Logs',
    scopeBlocked:
      'Blocked by PBAC: Global Threshold Edits, HVAC Plant Actuation, IoT Maintenance, Role Admin',
    tabTriage: 'Clinical Triage & Medical Dispatch',
    tabAnalytics: 'Aggregate Cohort Analytics',
    tabSimulator: 'Clinical Heat Strain Simulator',
    tabAuditReports: 'Clinical Audit Log & Certified Reports',
    kpiHrv: 'Cohort Mean HRV',
    kpiSkinTemp: 'Epidermal Core Temp',
    kpiMeanHr: 'Mean Exertion HR',
    kpiRehydration: 'Oral Rehydration Queue',
    triageQueueTitle: 'Active Physiological Strain & Dehydration Triage Queue',
    triageQueueDesc:
      'Pseudonymized clinical flags prioritized by autonomic cardiac strain and core temperature spike.',
    markEvaluated: 'Mark Evaluated',
    dispatchLiaison: 'Dispatch Oral Rehydration Liaison',
    ansCorrelationTitle: 'Autonomic Nervous System Correlation (HRV vs HR)',
    ansCorrelationDesc:
      'Inverse autonomic relationship between heart rate elevation and parasympathetic HRV suppression.',
    ethicalBoundaryTitle: 'Physician Ethical Boundary Standard',
    ethicalBoundaryDesc:
      'All clinical records are de-identified under HIPAA §164.514 Safe Harbor and GDPR Article 9. Site supervisors receive aggregate readiness alerts only; individual health telemetry is legally privileged.',
    cohortAnalyticsTitle: 'De-Identified Cohort Health & Thermal Strain by Zone',
    cohortAnalyticsDesc:
      'Aggregate epidemiological surveillance guarded by k-Anonymity (N ≥ 12) small-cell suppression.',
    simulatorTitle: 'Clinical Thermal Strain & Hydration Protocol Simulator',
    projectedOutcomeTitle: 'Projected Clinical Outcome',
    auditTrailTitle: 'HIPAA §164.312 Clinical Access & Compliance Trail',
    certifiedExportsTitle: 'Certified Clinical Report Exports',
    exportPdfBtn: 'Export Health Metrics Audit PDF',
    exportCsvBtn: 'Export Cohort Physiological CSV'
  },
  engineer: {
    title: 'Facility Engineering & Mechanical Reliability Console',
    badge: 'OPERATIONS',
    loggedInAs: 'Logged in as',
    jurisdiction: 'Jurisdiction:',
    chillerActive: 'Smart Chiller Automation Active',
    bacnetConnected: 'BACnet / Modbus Connected',
    scopePermitted:
      'Engineering Scope Permitted: HVAC & Damper Actuation, ISO 10816 Vibration & IoT Maintenance, Plant Analytics, Thermal What-If & Engineering Audit Logs',
    scopeBlocked:
      'Blocked by PBAC: Worker Biometrics, Medical Dispatch, Certified HIPAA Exports, Global Health Thresholds',
    tabHvac: 'HVAC & Automated Remediation',
    tabMaintenance: 'ISO 10816 Vibration & IoT Maintenance',
    tabSimulator: 'Thermal & Ventilation Simulator',
    tabAudit: 'Engineering Audit Log',
    kpiTwl: 'Plant Mean TWL',
    kpiAch: 'Mean Air Changes (ACH)',
    kpiVibration: 'Max Bearing Vibration',
    kpiWorkOrders: '72h IoT Work Orders',
    sectorVentTitle: 'Sector Ventilation, Damper Actuation & TWL Optimization',
    sectorVentDesc:
      'Direct supervisory control of air handling units (AHU), chiller setpoints, and damper positions.',
    remediationQueueTitle: 'Closed-Loop HVAC Remediation Queue',
    aggregateEnvTitle: 'Aggregate Zone Environmental Telemetry',
    vibrationTelemetryTitle: 'ISO 10816 Vibration & Rotating Machinery Telemetry',
    maintenanceQueueTitle: '72-Hour Predictive IoT Sensor Maintenance Queue',
    simulatorTitle: 'Facility HVAC & Cooling Mitigation What-If Simulator',
    projectedThermalTitle: 'Projected Thermal Impact',
    auditLogTitle: 'Engineering Actuation & Compliance Audit Log (Read-Only)',
    damperMinus: '-10% Damper',
    damperPlus: '+10% Boost Flow',
    approveActuate: 'Approve & Actuate',
    overrideBtn: 'Override'
  },
  auditor: {
    title: 'Statutory Regulatory Compliance & WSH Audit Inspectorate',
    badge: 'AUDITOR CLEARANCE',
    loggedInAs: 'Logged in as',
    primaryJurisdiction: 'Primary Jurisdiction:',
    exportDossierBtn: 'Export Regulatory Dossier',
    scopePermitted:
      'Inspector Scope Permitted: Immutable Cryptographic Audit Trails, Aggregate De-Identified Analytics (k ≥ 12) & Certified Compliance Dossiers',
    scopeBlocked:
      'Strict Read-Only Duty Separation: Blocked from HVAC Actuation, Medical Dispatch, Threshold Edits & Unmasked Biometrics',
    tabLedger: 'Cryptographic Audit Ledger & Privacy Proofs',
    tabAggregate: 'Aggregate Compliance & Jurisdictions',
    tabExports: 'Certified Regulatory Exports',
    kpiMomWsha: 'Singapore MOM WSHA',
    kpiKAnonymity: 'Small-Cell k-Anonymity',
    kpiEpsilon: 'ε-Differential Privacy',
    kpiAuditChain: 'Audit Chain Integrity',
    ledgerTitle: 'Immutable Cryptographic Tamper-Evident Audit Ledger',
    ledgerDesc:
      'Append-only cryptographic blocks timestamped with SHA-256 hashes verifying all system overrides and rest breaks.',
    liveHipaaEvents: 'Live HIPAA & Operational Compliance Events',
    privacyProofTitle: 'Small-Cell Privacy & Anti-Surveillance Proof',
    privacyProofDesc:
      'Mathematical guarantees preventing individual re-identification by supervisors or third parties.',
    legalWarrantyTitle: 'Statutory Auditor Legal Warranty',
    aggregateComplianceTitle: 'Aggregate Facility Zone Compliance (Small-Cell Masked at N < 12)',
    multiJurisdictionTitle: 'Multi-Jurisdiction Migrant & Workforce Statutory Frameworks',
    certifiedExportsTitle: 'Certified Statutory Inspection Dossier Exports',
    certifiedExportsDesc:
      'Every export executed from the Inspector Console is de-identified via HIPAA §164.514 Safe Harbor and cryptographically recorded in the immutable audit chain.'
  },
  manager: {
    surveillanceCommand: 'Surveillance Command',
    monitoredPersonnel: 'Monitored Personnel',
    kalmanActive: 'Kalman Active',
    roleView: 'Role View:',
    safetyOfficer: 'Safety Officer',
    maintenanceCrew: 'Maintenance Crew',
    opsLead: 'Ops Lead',
    mute: 'Mute',
    alertsMuted: 'Alerts Muted',
    downloadCsv: 'Download CSV',
    downloadPdfReport: 'Download PDF Report',
    simulateKalman: 'Simulate Kalman Anomaly',
    whatIfSimulator: 'What-If Simulator',
    ingestBenchmarks: 'Ingest & Benchmarks',
    reportsExport: 'Reports & Export',
    signalVisibility: 'Signal Visibility:',
    cardiacSignals: 'Cardiac Signals',
    environmentalSignals: 'Environmental Signals',
    performanceSignals: 'Performance Signals',
    historicalMovingAvg: 'Historical Moving Averages',
    resetFilters: 'Reset Filters',
    configureSignals: 'Configure Signals →',
    execOverviewHeader: 'Executive Health Operations & Telemetry Status',
    kpiActiveAnomalies: 'Active Anomalies',
    kpiWorkerCoverage: 'Worker Coverage',
    kpiEngineUptime: 'Engine Uptime',
    kpiSystemLatency: 'System Latency',
    tabLive: 'Live Surveillance',
    tabResources: 'Resource Utilization',
    tabComplianceAudit: 'Compliance Audit Log',
    tabHipaaLog: 'HIPAA Access Log',
    tabPredictiveMaint: 'Predictive Maintenance',
    tabCorrelation: 'Correlation Engine',
    tabWorkerDensity: 'Worker Density (D3)',
    tabPatternLibrary: 'Pattern Library'
  }
};

const BN: TranslationDictionary = {
  langSelector: {
    label: 'ভাষা',
    placeholder: 'ভাষা খুঁজুন বা নির্বাচন করুন...',
    noMatch: 'কোনো মিল পাওয়া যায়নি',
    selectOneHint: 'একবারে একটি ভাষা নির্বাচন করুন'
  },
  home: {
    brandSubtitle: 'বহু-সংকেত কর্মী স্বাস্থ্য আগাম সতর্কীকরণ বুদ্ধিমত্তা',
    adminGovernanceBadge: 'অ্যাডমিন-পরিচালিত ভূমিকা শাসন',
    heroKicker: 'রিয়েল-টাইম জনসংখ্যা ও কর্মী স্বাস্থ্য বুদ্ধিমত্তা',
    heroTitle: 'স্বাস্থ্য ঝুঁকি বাড়ার আগেই বিভিন্ন সংকেত বিশ্লেষণ করে প্রতিরোধ করুন।',
    heroDescription:
      'তাপজনিত ক্লান্তি বা পেশাগত ঝুঁকির প্রাথমিক লক্ষণ এক জায়গায় থাকে না। প্রগনস্টিকেটর পরিধানযোগ্য বায়োমেট্রিক, পরিবেশগত তাপমাত্রা, শব্দের মাত্রা এবং অনুপস্থিতির তথ্য একত্র করে ব্যাখ্যাযোগ্য আগাম সতর্কতা প্রদান করে।',
    card1Title: 'শিল্প নজরদারি কমান্ড',
    card1Desc: 'লাইভ বায়োমেট্রিক হিট ম্যাপ ও ১২ ঘণ্টার আগাম পূর্বাভাস।',
    card2Title: 'এজ বায়োমেট্রিক ও মাইক্রোক্লাইমেট IoT',
    card2Desc: 'নিরবচ্ছিন্ন HRV, ত্বকের তাপমাত্রা এবং থার্মাল ওয়ার্ক লিমিট (TWL)।',
    signInTitle: 'এন্টারপ্রাইজ সাইন ইন',
    signUpTitle: 'অ্যাক্সেসের অনুরোধ করুন',
    forgotTitle: 'নিরাপত্তা টোকেন রিসেট করুন',
    signInSubtitle: 'অনুমোদিত কর্মী পরিচয় ও অ্যাক্সেস কনসোল।',
    signUpSubtitle: 'ভূমিকা ও ক্লিয়ারেন্স অ্যাডমিনিস্ট্রেটর দ্বারা যাচাই করা হয়।',
    forgotSubtitle: 'কর্মক্ষেত্রের ইমেলে পুনরুদ্ধার লিংক পাঠান।',
    tabSignIn: 'সাইন ইন',
    tabSignUp: 'সাইন আপ',
    googleSsoBtn: 'Google Cloud SSO দিয়ে সাইন ইন',
    orCredentials: 'অথবা এন্টারপ্রাইজ পরিচয়পত্র',
    emailLabel: 'কর্পোরেট কর্মক্ষেত্র ইমেল',
    passwordLabel: 'পাসওয়ার্ড বা SSO নিরাপত্তা কী',
    rememberMe: 'ওয়ার্কস্টেশন মনে রাখুন',
    forgotLink: 'পাসওয়ার্ড ভুলে গেছেন?',
    signInSubmitBtn: 'সার্ভেইল্যান্স কনসোলে প্রবেশ করুন',
    directoryHeader: 'ভূমিকা ও ল্যান্ডিং কনসোল অনুযায়ী দ্রুত নির্বাচন:',
    roleDirectorBtn: 'নিরাপত্তা পরিচালক (অ্যাডমিন)',
    roleClinicianBtn: 'ক্লিনিক্যাল স্বাস্থ্য MD',
    roleEngineerBtn: 'ফ্যাসিলিটি ইঞ্জিনিয়ার',
    roleAuditorBtn: 'WSH কমপ্লায়েন্স অডিটর',
    roleWorkerBtn: 'ফ্রন্টলাইন কর্মী',
    signupNoticeTitle: 'জিরো-ট্রাস্ট অ্যাডমিন ভূমিকা শাসন',
    signupNoticeDesc:
      'নতুন নিবন্ধন লেভেল ১ সভরেন কর্মী ক্লিয়ারেন্স থেকে শুরু হয় যতক্ষণ না অ্যাডমিন RBAC কনসোলে উচ্চতর ভূমিকা দেন।',
    fullNameLabel: 'পূর্ণ আইনি নাম',
    deptLabel: 'বিভাগ / অপারেশনাল ইউনিট',
    confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করুন',
    signupSubmitBtn: 'অ্যাক্সেসের অনুরোধ ও নিবন্ধন',
    alreadyHaveAccount: 'ইতিমধ্যেই অ্যাকাউন্ট আছে?',
    forgotDesc: 'আপনার কর্মক্ষেত্রের ইমেল দিন। পাসওয়ার্ড রিসেট টোকেন পাঠানো হবে।',
    resetSubmitBtn: 'পাসওয়ার্ড রিসেট লিংক পাঠান',
    backToSignIn: '← সাইন ইনে ফিরে যান',
    footerCopyright: '© ২০২৬ প্রগনস্টিকেটর সিস্টেম। সর্বস্বত্ব সংরক্ষিত।',
    footerTagline: 'ভূমিকা-শাসিত স্বাস্থ্য আগাম-সতর্কতা আর্কিটেকচার',
    previewTitle: 'লাইভ এজ সিগন্যাল প্রিভিউ',
    previewDesc: 'সাইন-ইনের আগে কালম্যান-স্মুথড তাপ ও বায়োমেট্রিক টেলিমেট্রি',
    previewHeatIndex: 'তাপ সূচক',
    previewMse: 'বেসলাইন MSE',
    previewPrivacy: 'প্রাইভেসি শিল্ড'
  },
  shell: {
    surveillanceActive: 'নজরদারি সক্রিয়:',
    roleTabDirector: 'নির্বাহী কমান্ড',
    roleTabClinician: 'ক্লিনিক্যাল স্বাস্থ্য',
    roleTabEngineer: 'ফ্যাসিলিটি HVAC',
    roleTabAuditor: 'WSH অডিট',
    roleTabWorker: 'কর্মী সুরক্ষা শিল্ড',
    strictRoleSeparation: 'কঠোর ভূমিকা পৃথকীকরণ',
    switchLabel: 'পরিবর্তন',
    rbacLabel: 'RBAC',
    statutesLabel: 'আইনসমূহ',
    sovereignShield: 'সভরেন গোপনীয়তা শিল্ড',
    a11yLabel: 'সহজলভ্যতা',
    logOut: 'লগ আউট',
    adminPreviewTitle: 'অ্যাডমিন ভূমিকা অডিট প্রিভিউ:',
    adminPreviewViewing: 'নির্বাচিত ভূমিকার ল্যান্ডিং কনসোল প্রদর্শিত হচ্ছে:',
    returnToExec: 'নির্বাহী কমান্ডে ফিরুন →',
    footerCopyright: '© ২০২৬ প্রগনস্টিকেটর ইন্টেলিজেন্স প্ল্যাটফর্ম',
    footerCertified: 'HIPAA শিল্ড সার্টিফাইড',
    footerInvariants: 'দ্বৈত শ্রম সমতা · শাস্তিমুক্ত টেলিমেট্রি · k-Anonymity (N ≥ 12) এবং ε-DP (0.5) কার্যকর',
    loadingGateway: 'এন্টারপ্রাইজ অথেনটিকেশন গেটওয়ে লোড হচ্ছে...',
    loadingDirector: 'নির্বাহী কমান্ড কনসোল লোড হচ্ছে...',
    loadingClinician: 'পেশাগত স্বাস্থ্য ও ক্লিনিক্যাল ট্রায়াজ কনসোল লোড হচ্ছে...',
    loadingEngineer: 'ফ্যাসিলিটি ইঞ্জিনিয়ারিং ও যান্ত্রিক নির্ভরযোগ্যতা কনসোল লোড হচ্ছে...',
    loadingAuditor: 'সংবিধিবদ্ধ কমপ্লায়েন্স ও WSH অডিট কনসোল লোড হচ্ছে...',
    loadingWorker: 'সভরেন ব্যক্তিগত বায়োমেট্রিক শিল্ড লোড হচ্ছে...'
  },
  worker: {
    title: 'ব্যক্তিগত কর্মী বায়োমেট্রিক ও বিশ্রাম টার্মিনাল',
    zeroSurveillance: 'কোনো ব্যবস্থাপনা নজরদারি নেই',
    privacyNotice:
      'আপনার ব্যক্তিগত বায়োমেট্রিক তথ্য গোপনীয়তা শিল্ড (k-Anonymity N ≥ 12) দ্বারা সুরক্ষিত। কোম্পানির নীতি ও আন্তর্জাতিক আইন অনুযায়ী কোনো বেতন কাটা বা শাস্তিমূলক ব্যবস্থা নেওয়া যাবে না।',
    autonomicRecovery: 'শারীরিক ক্লান্তি ও হার্ট রেট ভ্যারিয়েবিলিটি',
    mildStrainNotice: 'তীব্র তাপমাত্রায় কাজ করার কারণে মৃদু হৃদযন্ত্রের ক্লান্তি শনাক্ত হয়েছে। পর্যাপ্ত পানি ও বিশ্রাম নিন।',
    skinTemp: 'শরীরের তাপমাত্রা ও তাপের প্রভাব',
    skinTempNotice: 'সেক্টর ৪-এ উচ্চ তাপের কারণে ত্বকের তাপমাত্রা বাড়ছে। দ্রুত শীতল স্থানে বিশ্রাম নিন।',
    sleepBufferTitle: 'ঘুম ও ক্লান্তি পুনরুদ্ধার',
    sleepBufferNotice: 'সার্কেডিয়ান বিশ্রাম স্থিতিশীল রয়েছে। ডরমিটরিতে রাতের ঘুম তাপীয় মানদণ্ড পূরণ করেছে।',
    hydrationCountdown: 'পানি ও ইলেক্ট্রোলাইট পানের কাউন্টডাউন',
    hydrationNotice: 'প্রতি ২০ মিনিটে অন্তত ২৫০ মিলি পানি বা ওআরএস দ্রবণ পান করার সুপারিশ করা হচ্ছে।',
    loggedToday: 'আজ পান করা হয়েছে:',
    portionsLabel: 'অংশ',
    logButton: '২৫০ মিলি পানি পান সম্পন্ন',
    cooldownTitle: 'ছায়াযুক্ত স্থানে তাৎক্ষণিক বিশ্রামের আবেদন',
    cooldownDesc:
      'সিঙ্গাপুর MOM এবং উপসাগরীয় MoHRE আইন অনুযায়ী, মাথা ঘোরা বা চরম গরমে তাৎক্ষণিক ছায়ায় বিশ্রাম নেওয়া আপনার আইনি অধিকার। কোনো জরিমানা নেই।',
    cooldownHelper: 'নিচে ক্লিক করলে বেনামী ও শাস্তিমুক্ত বিশ্রাম রোটেশন অনুরোধ পাঠানো হবে।',
    requestBreakBtn: 'তাৎক্ষণিক ছায়ায় বিশ্রাম নিন (কোনো শাস্তি নেই)',
    breakDispatchedTitle: 'বিশ্রামের অনুরোধ অনুমোদিত ও প্রেরিত',
    breakDispatchedDesc: 'মেডিক্যাল টিম এবং ছায়াযুক্ত বিশ্রাম কেন্দ্র অবহিত হয়েছে। আপনি নির্ভয়ে বিশ্রাম নিতে পারেন।',
    resumeShiftBtn: 'বিশ্রাম শেষ • পুনরায় কাজ শুরু করুন',
    statutoryNotice: 'সিঙ্গাপুর MOM ডব্লিউএসএইচ আইন এবং প্রবাসী কর্মী সুরক্ষা দ্বারা সুরক্ষিত।',
    loggedWorkerLabel: 'লগইনকৃত কর্মী',
    ephemeralKeyActive: 'ক্ষণস্থায়ী সভরেন কী সক্রিয়',
    statutoryHeader: 'সক্রিয় আইনি সুরক্ষা',
    dormitoryHeader: 'ডরমিটরি ও শীতলকরণ মানদণ্ড',
    whistleblowerHeader: 'শাস্তিমুক্ত অভিযোগ সুরক্ষা',
    languageAccessLabel: 'পছন্দের কনসোল ভাষা',
    migrantPassBadge: 'অভিবাসী পাস ধারক',
    hrvDeltaTag: '(বিশ্রাম থেকে -১৪%)',
    highStrainLabel: 'উচ্চ চাপ',
    nominalRecoveryLabel: 'স্বাভাবিক পুনরুদ্ধার (৬৮ ms)',
    skinDeltaTag: '(বৃদ্ধি +০.৯°C)',
    baselineTempLabel: 'বেসলাইন ৩৬.৫°C',
    exhaustionTempLabel: 'অতিরিক্ত ক্লান্তি >৩৮.২°C',
    hoursUnit: 'ঘণ্টা',
    restorativeTag: '(পুনরুদ্ধারমূলক)',
    sleepDeficitLabel: 'ঘাটতি (<৫ ঘণ্টা)',
    sleepOptimalLabel: 'উত্তম (>৭ ঘণ্টা)',
    twlSevereHeatBadge: 'TWL ১১৫ W/m² (তীব্র তাপ)',
    hydrationConfirmedPrefix: 'ছায়াযুক্ত পানি ও শীতলকরণ সহায়তা নিশ্চিত করেছে:',
    siteMedicalSafetyTeam: 'সাইট মেডিক্যাল ও নিরাপত্তা দল',
    middayWorkBanPrefix: 'দুপুরের কাজের নিষেধাজ্ঞা সক্রিয়:',
    wbgtRestCyclesPrefix: 'লাইভ WBGT বিশ্রাম চক্র:'
  },
  clinician: {
    title: 'পেশাগত স্বাস্থ্য ও ক্লিনিক্যাল ট্রায়াজ কেন্দ্র',
    badge: 'ক্লিনিক্যাল MD কনসোল',
    loggedInAs: 'লগইনকৃত:',
    jurisdiction: 'অধিক্ষেত্র:',
    hipaaGuarded: 'HIPAA §164.514 ও GDPR অনুচ্ছেদ ৯ সুরক্ষিত',
    zeroDisciplinary: 'শাস্তিমূলক ট্র্যাকিং শূন্য',
    scopePermitted:
      'অনুমোদিত পরিধি: শারীরবৃত্তীয় ট্রায়াজ, জরুরি চিকিৎসা প্রেরণ, সমষ্টিগত বিশ্লেষণ, ক্লিনিক্যাল সিমুলেশন, সার্টিফাইড রিপোর্ট ও HIPAA লগ',
    scopeBlocked: 'PBAC দ্বারা সীমাবদ্ধ: গ্লোবাল থ্রেশহোল্ড, HVAC নিয়ন্ত্রণ, IoT রক্ষণাবেক্ষণ, ভূমিকা অ্যাডমিন',
    tabTriage: 'ক্লিনিক্যাল ট্রায়াজ ও চিকিৎসা প্রেরণ',
    tabAnalytics: 'সমষ্টিগত কোহর্ট বিশ্লেষণ',
    tabSimulator: 'ক্লিনিক্যাল তাপ চাপ সিমুলেটর',
    tabAuditReports: 'ক্লিনিক্যাল অডিট লগ ও সার্টিফাইড রিপোর্ট',
    kpiHrv: 'গড় কোহর্ট HRV',
    kpiSkinTemp: 'ত্বকের মূল তাপমাত্রা',
    kpiMeanHr: 'গড় হৃদস্পন্দন',
    kpiRehydration: 'ইলেক্ট্রোলাইট কিউ',
    triageQueueTitle: 'সক্রিয় শারীরবৃত্তীয় ক্লান্তি ও পানিশূন্যতা ট্রায়াজ তালিকা',
    triageQueueDesc: 'অটোনমিক কার্ডিয়াক স্ট্রেন ও তাপমাত্রার ভিত্তিতে ছদ্মনামকৃত ক্লিনিক্যাল ফ্ল্যাগ।',
    markEvaluated: 'মূল্যায়িত চিহ্নিত করুন',
    dispatchLiaison: 'ওরাল রিহাইড্রেশন টিম পাঠান',
    ansCorrelationTitle: 'স্বয়ংক্রিয় স্নায়ুতন্ত্রের সম্পর্ক (HRV বনাম HR)',
    ansCorrelationDesc: 'হৃদস্পন্দন বৃদ্ধি এবং প্যারাসিমপ্যাথেটিক HRV হ্রাসের বিপরীত সম্পর্ক।',
    ethicalBoundaryTitle: 'চিকিৎসক নৈতিক সীমানা মানদণ্ড',
    ethicalBoundaryDesc: 'HIPAA §164.514 ও GDPR অনুচ্ছেদ ৯ অনুযায়ী সমস্ত রেকর্ড বেনামী করা হয়।',
    cohortAnalyticsTitle: 'জোন অনুযায়ী বেনামী কোহর্ট স্বাস্থ্য ও তাপ চাপ',
    cohortAnalyticsDesc: 'k-Anonymity (N ≥ 12) দ্বারা সুরক্ষিত সমষ্টিগত স্বাস্থ্য পর্যবেক্ষণ।',
    simulatorTitle: 'ক্লিনিক্যাল তাপ চাপ ও হাইড্রেশন প্রোটোকল সিমুলেটর',
    projectedOutcomeTitle: 'প্রত্যাশিত ক্লিনিক্যাল ফলাফল',
    auditTrailTitle: 'HIPAA §164.312 ক্লিনিক্যাল অ্যাক্সেস ও কমপ্লায়েন্স ট্রেইল',
    certifiedExportsTitle: 'সার্টিফাইড ক্লিনিক্যাল রিপোর্ট এক্সপোর্ট',
    exportPdfBtn: 'স্বাস্থ্য মেট্রিক্স অডিট PDF এক্সপোর্ট',
    exportCsvBtn: 'কোহর্ট ফিজিওলজিক্যাল CSV এক্সপোর্ট'
  },
  engineer: {
    title: 'ফ্যাসিলিটি ইঞ্জিনিয়ারিং ও যান্ত্রিক নির্ভরযোগ্যতা কনসোল',
    badge: 'অপারেশনস',
    loggedInAs: 'লগইনকৃত:',
    jurisdiction: 'অধিক্ষেত্র:',
    chillerActive: 'স্মার্ট চিলার অটোমেশন সক্রিয়',
    bacnetConnected: 'BACnet / Modbus সংযুক্ত',
    scopePermitted:
      'অনুমোদিত পরিধি: HVAC ও ড্যাম্পার নিয়ন্ত্রণ, ISO 10816 কম্পন ও IoT রক্ষণাবেক্ষণ, প্ল্যান্ট অ্যানালিটিক্স, থার্মাল সিমুলেটর ও অডিট লগ',
    scopeBlocked: 'PBAC দ্বারা সীমাবদ্ধ: কর্মী বায়োমেট্রিক, চিকিৎসা প্রেরণ, HIPAA এক্সপোর্ট, গ্লোবাল থ্রেশহোল্ড',
    tabHvac: 'HVAC ও স্বয়ংক্রিয় প্রতিকার',
    tabMaintenance: 'ISO 10816 কম্পন ও IoT রক্ষণাবেক্ষণ',
    tabSimulator: 'তাপ ও বায়ুচলাচল সিমুলেটর',
    tabAudit: 'ইঞ্জিনিয়ারিং অডিট লগ',
    kpiTwl: 'প্ল্যান্ট গড় TWL',
    kpiAch: 'গড় বায়ু পরিবর্তন (ACH)',
    kpiVibration: 'সর্বোচ্চ বিয়ারিং কম্পন',
    kpiWorkOrders: '৭২ ঘণ্টার IoT কাজের আদেশ',
    sectorVentTitle: 'সেক্টর বায়ুচলাচল, ড্যাম্পার নিয়ন্ত্রণ ও TWL অপ্টিমাইজেশন',
    sectorVentDesc: 'এয়ার হ্যান্ডলিং ইউনিট (AHU), চিলার সেটপয়েন্ট ও ড্যাম্পার পজিশনের সরাসরি নিয়ন্ত্রণ।',
    remediationQueueTitle: 'ক্লোজড-লুপ HVAC প্রতিকার কিউ',
    aggregateEnvTitle: 'সমষ্টিগত জোন পরিবেশগত টেলিমেট্রি',
    vibrationTelemetryTitle: 'ISO 10816 কম্পন ও ঘূর্ণায়মান যন্ত্রপাতি টেলিমেট্রি',
    maintenanceQueueTitle: '৭২ ঘণ্টার ভবিষ্যদ্বাণীমূলক IoT সেন্সর রক্ষণাবেক্ষণ কিউ',
    simulatorTitle: 'ফ্যাসিলিটি HVAC ও শীতলকরণ প্রশমন সিমুলেটর',
    projectedThermalTitle: 'প্রত্যাশিত তাপীয় প্রভাব',
    auditLogTitle: 'ইঞ্জিনিয়ারিং অ্যাকচুয়েশন ও কমপ্লায়েন্স অডিট লগ (শুধুমাত্র পাঠযোগ্য)',
    damperMinus: '-১০% ড্যাম্পার',
    damperPlus: '+১০% প্রবাহ বাড়ান',
    approveActuate: 'অনুমোদন ও চালু করুন',
    overrideBtn: 'ওভাররাইড'
  },
  auditor: {
    title: 'সংবিধিবদ্ধ নিয়ন্ত্রক কমপ্লায়েন্স ও WSH অডিট পরিদর্শন',
    badge: 'অডিটর ক্লিয়ারেন্স',
    loggedInAs: 'লগইনকৃত:',
    primaryJurisdiction: 'প্রাথমিক অধিক্ষেত্র:',
    exportDossierBtn: 'নিয়ন্ত্রক ডসিয়ার এক্সপোর্ট',
    scopePermitted:
      'পরিদর্শকের অনুমোদিত পরিধি: অপরিবর্তনীয় ক্রিপ্টোগ্রাফিক অডিট ট্রেইল, বেনামী সমষ্টিগত বিশ্লেষণ (k ≥ 12) ও সার্টিফাইড ডসিয়ার',
    scopeBlocked: 'কঠোর পাঠযোগ্য পৃথকীকরণ: HVAC নিয়ন্ত্রণ, চিকিৎসা প্রেরণ, থ্রেশহোল্ড পরিবর্তন ও ব্যক্তিগত বায়োমেট্রিক নিষিদ্ধ',
    tabLedger: 'ক্রিপ্টোগ্রাফিক অডিট লেজার ও গোপনীয়তা প্রমাণ',
    tabAggregate: 'সমষ্টিগত কমপ্লায়েন্স ও অধিক্ষেত্র',
    tabExports: 'সার্টিফাইড নিয়ন্ত্রক এক্সপোর্ট',
    kpiMomWsha: 'সিঙ্গাপুর MOM WSHA',
    kpiKAnonymity: 'স্মল-সেল k-Anonymity',
    kpiEpsilon: 'ε-ডিফারেনশিয়াল প্রাইভেসি',
    kpiAuditChain: 'অডিট চেইন অখণ্ডতা',
    ledgerTitle: 'অপরিবর্তনীয় ক্রিপ্টোগ্রাফিক অডিট লেজার',
    ledgerDesc: 'সমস্ত সিস্টেম ওভাররাইড ও বিশ্রাম বিরতি যাচাইকারী SHA-256 হ্যাশযুক্ত ব্লক।',
    liveHipaaEvents: 'লাইভ HIPAA ও অপারেশনাল কমপ্লায়েন্স ইভেন্ট',
    privacyProofTitle: 'স্মল-সেল গোপনীয়তা ও নজরদারি-বিরোধী প্রমাণ',
    privacyProofDesc: 'তত্ত্বাবধায়ক বা তৃতীয় পক্ষ দ্বারা ব্যক্তিগত শনাক্তকরণ প্রতিরোধী গাণিতিক নিশ্চয়তা।',
    legalWarrantyTitle: 'সংবিধিবদ্ধ অডিটর আইনি নিশ্চয়তা',
    aggregateComplianceTitle: 'সমষ্টিগত ফ্যাসিলিটি জোন কমপ্লায়েন্স (N < 12-এ সুরক্ষিত)',
    multiJurisdictionTitle: 'বহু-অধিক্ষেত্র অভিবাসী ও কর্মী সংবিধিবদ্ধ কাঠামো',
    certifiedExportsTitle: 'সার্টিফাইড পরিদর্শন ডসিয়ার এক্সপোর্ট',
    certifiedExportsDesc: 'পরিদর্শক কনসোল থেকে প্রতিটি এক্সপোর্ট HIPAA §164.514 অনুযায়ী বেনামী ও অডিট চেইনে সংরক্ষিত।'
  },
  manager: {
    surveillanceCommand: 'নজরদারি কমান্ড',
    monitoredPersonnel: 'নজরদারিভুক্ত কর্মী',
    kalmanActive: 'কালমান সক্রিয়',
    roleView: 'ভূমিকা দর্শন:',
    safetyOfficer: 'নিরাপত্তা কর্মকর্তা',
    maintenanceCrew: 'রক্ষণাবেক্ষণ দল',
    opsLead: 'অপারেশনস প্রধান',
    mute: 'নিঃশব্দ',
    alertsMuted: 'সতর্কতা নিঃশব্দ',
    downloadCsv: 'CSV ডাউনলোড',
    downloadPdfReport: 'PDF রিপোর্ট ডাউনলোড',
    simulateKalman: 'কালমান অসঙ্গতি সিমুলেট',
    whatIfSimulator: 'হোয়াট-ইফ সিমুলেটর',
    ingestBenchmarks: 'ডেটা ইনজেস্ট ও বেঞ্চমার্ক',
    reportsExport: 'রিপোর্ট ও এক্সপোর্ট',
    signalVisibility: 'সংকেত দৃশ্যমানতা:',
    cardiacSignals: 'হৃদযন্ত্রের সংকেত',
    environmentalSignals: 'পরিবেশগত সংকেত',
    performanceSignals: 'কর্মক্ষমতা সংকেত',
    historicalMovingAvg: 'ঐতিহাসিক চলমান গড়',
    resetFilters: 'ফিল্টার রিসেট',
    configureSignals: 'সংকেত কনফিগার →',
    execOverviewHeader: 'নির্বাহী স্বাস্থ্য অপারেশন ও টেলিমেট্রি স্থিতি',
    kpiActiveAnomalies: 'সক্রিয় অসঙ্গতি',
    kpiWorkerCoverage: 'কর্মী কভারেজ',
    kpiEngineUptime: 'ইঞ্জিন আপটাইম',
    kpiSystemLatency: 'সিস্টেম লেটেন্সি',
    tabLive: 'লাইভ নজরদারি',
    tabResources: 'সম্পদ ব্যবহার',
    tabComplianceAudit: 'কমপ্লায়েন্স অডিট লগ',
    tabHipaaLog: 'HIPAA অ্যাক্সেস লগ',
    tabPredictiveMaint: 'ভবিষ্যদ্বাণীমূলক রক্ষণাবেক্ষণ',
    tabCorrelation: 'সহসম্পর্ক ইঞ্জিন',
    tabWorkerDensity: 'কর্মী ঘনত্ব (D3)',
    tabPatternLibrary: 'প্যাটার্ন লাইব্রেরি'
  }
};

const TA: TranslationDictionary = {
  langSelector: {
    label: 'மொழி',
    placeholder: 'மொழியைத் தேடவும் அல்லது தேர்ந்தெடுக்கவும்...',
    noMatch: 'பொருத்தமான மொழி இல்லை',
    selectOneHint: 'ஒரு நேரத்தில் ஒரு மொழியைத் தேர்ந்தெடுக்கவும்'
  },
  home: {
    brandSubtitle: 'பல்-சமிக்ஞை பணியாளர் நலன் முன்கூட்டிய எச்சரிக்கை நுண்ணறிவு',
    adminGovernanceBadge: 'நிர்வாகி-நிர்வகிக்கும் பங்கு ஆளுமை',
    heroKicker: 'நிகழ்நேர மக்கள் & பணியாளர் நலன் நுண்ணறிவு',
    heroTitle: 'உடல்நல அபாயங்கள் அதிகரிக்கும் முன் பல சமிக்ஞைகளை ஒருங்கிணைத்து தடுக்கவும்.',
    heroDescription:
      'வெப்ப அழுத்தம் அல்லது உடல் சோர்வின் ஆரம்ப அறிகுறிகள் ஒரே தரவுத்தளத்தில் இருப்பதில்லை. அணியக்கூடிய பயோமெட்ரிக், சுற்றுச்சூழல் வெப்பநிலை, ஒலி அளவு ஆகியவற்றை இணைத்து துல்லியமான எச்சரிக்கைகளை வழங்குகிறது.',
    card1Title: 'தொழில்துறை கண்காணிப்பு கட்டளை மையம்',
    card1Desc: 'நேரடி பயோமெட்ரிக் வெப்ப வரைபடங்கள் மற்றும் 12-மணி நேர முன்கணிப்பு.',
    card2Title: 'எட்ஜ் பயோமெட்ரிக் & மைக்ரோகிளைமேட் IoT',
    card2Desc: 'தொடர்ச்சியான HRV, தோல் வெப்பநிலை மற்றும் வெப்ப வேலை வரம்பு (TWL).',
    signInTitle: 'நிறுவன உள்நுழைவு',
    signUpTitle: 'நிறுவன அணுகல் கோரிக்கை',
    forgotTitle: 'பாதுகாப்பு டோக்கன் மீட்டமை',
    signInSubtitle: 'அங்கீகரிக்கப்பட்ட பணியாளர் அடையாளம் & அணுகல் தளம்.',
    signUpSubtitle: 'பங்கு அனுமதி நிர்வாகியால் சரிபார்க்கப்படும்.',
    forgotSubtitle: 'பணி மின்னஞ்சலுக்கு மீட்பு இணைப்பை அனுப்பவும்.',
    tabSignIn: 'உள்நுழைக',
    tabSignUp: 'பதிவு செய்க',
    googleSsoBtn: 'Google Cloud SSO மூலம் உள்நுழையவும்',
    orCredentials: 'அல்லது நிறுவன சான்றுகள்',
    emailLabel: 'நிறுவன பணி மின்னஞ்சல்',
    passwordLabel: 'கடவுச்சொல் அல்லது SSO பாதுகாப்பு விசை',
    rememberMe: 'பணிநிலையத்தை நினைவில் கொள்',
    forgotLink: 'கடவுச்சொல் மறந்ததா?',
    signInSubmitBtn: 'கண்காணிப்பு தளத்தில் உள்நுழையவும்',
    directoryHeader: 'பங்கு மற்றும் முகப்புத் தளம் வாரியாக விரைவு நிரப்பல்:',
    roleDirectorBtn: 'பாதுகாப்பு இயக்குநர் (நிர்வாகி)',
    roleClinicianBtn: 'மருத்துவ நல அதிகாரி',
    roleEngineerBtn: 'வசதி பொறியாளர்',
    roleAuditorBtn: 'WSH இணக்கத் தணிக்கையாளர்',
    roleWorkerBtn: 'களப் பணியாளர்',
    signupNoticeTitle: 'பூஜ்ய-நம்பிக்கை நிர்வாகி பங்கு ஆளுமை',
    signupNoticeDesc:
      'புதிய பதிவுகள் நிலை 1 தொழிலாளர் அனுமதியுடன் தொடங்கும்; நிர்வாகி உயர்ந்த பங்கை வழங்கும் வரை பாதுகாக்கப்படும்.',
    fullNameLabel: 'முழு சட்டப்பூர்வ பெயர்',
    deptLabel: 'துறை / செயல்பாட்டுப் பிரிவு',
    confirmPasswordLabel: 'கடவுச்சொல்லை உறுதி செய்க',
    signupSubmitBtn: 'அணுகல் கோரி கணக்கை உருவாக்குக',
    alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    forgotDesc: 'உங்கள் பணி மின்னஞ்சலை உள்ளிடவும். பாதுகாப்பு மீட்பு டோக்கன் அனுப்பப்படும்.',
    resetSubmitBtn: 'மீட்டமை இணைப்பை அனுப்பவும்',
    backToSignIn: '← உள்நுழைவுக்குத் திரும்புக',
    footerCopyright: '© 2026 ப்ரோக்னாஸ்டிகேட்டர் அமைப்பு. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    footerTagline: 'பங்கு-ஆளுமை நலன் முன்கூட்டிய எச்சரிக்கை கட்டமைப்பு',
    previewTitle: 'நேரடி எட்ஜ் சிக்னல் முன்னோட்டம்',
    previewDesc: 'உள்நுழைவதற்கு முன் கல்மன் வெப்ப மற்றும் உயிரளவீடு கண்காணிப்பு',
    previewHeatIndex: 'வெப்ப குறியீடு',
    previewMse: 'அடிப்படை MSE',
    previewPrivacy: 'தனியுரிமை கவசம்'
  },
  shell: {
    surveillanceActive: 'கண்காணிப்பு செயலில்:',
    roleTabDirector: 'நிர்வாக கட்டளை',
    roleTabClinician: 'மருத்துவ நலன்',
    roleTabEngineer: 'வசதி HVAC',
    roleTabAuditor: 'WSH தணிக்கை',
    roleTabWorker: 'தொழிலாளர் கவசம்',
    strictRoleSeparation: 'கண்டிப்பான பங்கு பிரிப்பு',
    switchLabel: 'மாற்று',
    rbacLabel: 'RBAC',
    statutesLabel: 'சட்டங்கள்',
    sovereignShield: 'இறையாண்மை தனியுரிமை கவசம்',
    a11yLabel: 'அணுகல்',
    logOut: 'வெளியேறு',
    adminPreviewTitle: 'நிர்வாகி பங்கு தணிக்கை முன்னோட்டம்:',
    adminPreviewViewing: 'காணப்படும் முகப்புத் தளம்:',
    returnToExec: 'நிர்வாக கட்டளைக்குத் திரும்புக →',
    footerCopyright: '© 2026 ப்ரோக்னாஸ்டிகேட்டர் நுண்ணறிவு தளம்',
    footerCertified: 'HIPAA கவசம் சான்றளிக்கப்பட்டது',
    footerInvariants: 'இருதரப்பு பணியாளர் சமத்துவம் · தண்டனையற்ற அளவீடு · k-Anonymity (N ≥ 12) & ε-DP (0.5)',
    loadingGateway: 'நிறுவன அங்கீகார நுழைவாயில் ஏற்றப்படுகிறது...',
    loadingDirector: 'நிர்வாகக் கட்டளை முனையம் ஏற்றப்படுகிறது...',
    loadingClinician: 'தொழில்சார் சுகாதாரம் மற்றும் மருத்துவப் பிரிவு முனையம் ஏற்றப்படுகிறது...',
    loadingEngineer: 'வசதி பொறியியல் மற்றும் இயந்திர நம்பகத்தன்மை முனையம் ஏற்றப்படுகிறது...',
    loadingAuditor: 'சட்டப்பூர்வ இணக்கம் மற்றும் WSH தணிக்கை ஆய்வகம் ஏற்றப்படுகிறது...',
    loadingWorker: 'தனிப்பட்ட பயோமெட்ரிக் பாதுகாப்பு கவசம் ஏற்றப்படுகிறது...'
  },
  worker: {
    title: 'தனியார் தொழிலாளர் பயோமெட்ரிக் மற்றும் ஓய்வு தளம்',
    zeroSurveillance: 'மேற்பார்வை கண்காணிப்பு இல்லை',
    privacyNotice:
      'உங்கள் தனிப்பட்ட உடல்நலத் தகவல்கள் முழுமையாகப் பாதுகாக்கப்பட்டுள்ளன (k-அனானிமிட்டி N ≥ 12). சட்டப்படி இந்த விவரங்களை வைத்து சம்பளம் குறைக்கப்படவோ தண்டிக்கப்படவோ முடியாது.',
    autonomicRecovery: 'இதய துடிப்பு மற்றும் உடல் சோர்வு',
    mildStrainNotice: 'கடுமையான வெப்பத்தின் காரணமாக லேசான உடல் சோர்வு ஏற்பட்டுள்ளது. நிழலில் ஓய்வெடுக்கவும்.',
    skinTemp: 'தோல் மற்றும் வெப்ப நிலை',
    skinTempNotice: 'பிரிவு 4-இல் அதிக வெப்பத்தால் தோல் வெப்பநிலை உயர்ந்து வருகிறது. குளிரூட்டல் தேவை.',
    sleepBufferTitle: 'உறக்கம் மற்றும் சோர்வு மீட்பு',
    sleepBufferNotice: 'இரவு தூக்க மீட்பு தங்குமிட வெப்ப வரம்புகளுக்குள் சீராக உள்ளது.',
    hydrationCountdown: 'நீர் மற்றும் எலக்ட்ரோலைட் பருகுவதற்கான நேரம்',
    hydrationNotice: 'அதிக வெப்பத்தில் ஒவ்வொரு 20 நிமிடங்களுக்கும் குறைந்தது 250 மிலி நீர் அருந்தவும்.',
    loggedToday: 'இன்று அருந்தியது:',
    portionsLabel: 'முறை',
    logButton: '250 மிலி நீர் பருகப்பட்டது',
    cooldownTitle: 'உடனடி நிழல் ஓய்வு கோரிக்கை',
    cooldownDesc:
      'சிங்கப்பூர் MOM மற்றும் MoHRE விதிகளின்படி, மயக்கம் அல்லது அதீத வெப்பம் ஏற்பட்டால் உடனடியாக நிழலில் ஓய்வெடுப்பது உங்கள் சட்டப்பூர்வ உரிமை.',
    cooldownHelper: 'கீழே கிளிக் செய்வதன் மூலம் தண்டனையற்ற அநாமதேய ஓய்வு கோரிக்கை அனுப்பப்படும்.',
    requestBreakBtn: 'உடனடி நிழல் ஓய்வு கோருங்கள் (அபராதம் இல்லை)',
    breakDispatchedTitle: 'ஓய்வு கோரிக்கை அனுப்பப்பட்டது',
    breakDispatchedDesc: 'மருத்துவக் குழுவிற்கும் குளிரூட்டப்பட்ட ஓய்வுக் கூடாரத்திற்கும் தெரிவிக்கப்பட்டுள்ளது.',
    resumeShiftBtn: 'ஓய்வு முடிந்தது • பணியைத் தொடரவும்',
    statutoryNotice: 'சிங்கப்பூர் மனிதவள அமைச்சு (MOM) மற்றும் தொழிலாளர் நலச் சட்டத்தின்படி பாதுகாக்கப்பட்டது.',
    loggedWorkerLabel: 'பணியாளர்',
    ephemeralKeyActive: 'பாதுகாப்பான தனியுரிமை விசை செயலில்',
    statutoryHeader: 'செயலில் உள்ள சட்ட பாதுகாப்பு',
    dormitoryHeader: 'தங்குமிடம் மற்றும் குளிரூட்டல் தரம்',
    whistleblowerHeader: 'தண்டனையற்ற புகார் பாதுகாப்பு',
    languageAccessLabel: 'விருப்பமான மொழி',
    migrantPassBadge: 'புலம்பெயர் அனுமதி வைத்திருப்பவர்',
    hrvDeltaTag: '(ஓய்விலிருந்து -14%)',
    highStrainLabel: 'அதிக அழுத்தம்',
    nominalRecoveryLabel: 'இயல்பான மீட்பு (68 ms)',
    skinDeltaTag: '(உயர்வு +0.9°C)',
    baselineTempLabel: 'அடிப்படை 36.5°C',
    exhaustionTempLabel: 'அதிக சோர்வு >38.2°C',
    hoursUnit: 'மணி',
    restorativeTag: '(மீட்டெடுப்பு)',
    sleepDeficitLabel: 'பற்றாக்குறை (<5ம)',
    sleepOptimalLabel: 'சிறந்தது (>7ம)',
    twlSevereHeatBadge: 'TWL 115 W/m² (கடும் வெப்பம்)',
    hydrationConfirmedPrefix: 'நிழல் குடிநீர் மற்றும் குளிரூட்டல் உதவி உறுதிசெய்யப்பட்டது:',
    siteMedicalSafetyTeam: 'தள மருத்துவம் மற்றும் பாதுகாப்பு குழு',
    middayWorkBanPrefix: 'மதிய வேலை தடை அமலில்:',
    wbgtRestCyclesPrefix: 'நேரடி WBGT ஓய்வு சுழற்சி:'
  },
  clinician: {
    title: 'தொழில்சார் நலன் & மருத்துவ முன்னுரிமை மையம்',
    badge: 'மருத்துவ MD தளம்',
    loggedInAs: 'உள்நுழைந்தவர்:',
    jurisdiction: 'ஆட்சி எல்லை:',
    hipaaGuarded: 'HIPAA §164.514 & GDPR Art. 9 பாதுகாப்பு',
    zeroDisciplinary: 'ஒழுங்குமுறை கண்காணிப்பு இல்லை',
    scopePermitted: 'மருத்துவ அனுமதி: உடல்நல வகைப்பாடு, அவசர மருத்துவ அனுப்புதல், தொகுப்பு பகுப்பாய்வு, சான்றளிக்கப்பட்ட அறிக்கைகள்',
    scopeBlocked: 'PBAC தடுக்கப்பட்டது: உலகளாவிய வரம்பு மாற்றம், HVAC இயக்கம், IoT பராமரிப்பு, நிர்வாக பங்கு',
    tabTriage: 'மருத்துவ முன்னுரிமை & அனுப்புதல்',
    tabAnalytics: 'தொகுப்பு குழு பகுப்பாய்வு',
    tabSimulator: 'மருத்துவ வெப்ப அழுத்த உருவகப்படுத்தி',
    tabAuditReports: 'மருத்துவ தணிக்கை பதிவு & அறிக்கைகள்',
    kpiHrv: 'குழு சராசரி HRV',
    kpiSkinTemp: 'தோல் வெப்பநிலை',
    kpiMeanHr: 'சராசரி இதயத்துடிப்பு',
    kpiRehydration: 'நீரேற்ற வரிசை',
    triageQueueTitle: 'உடல் சோர்வு & நீரிழப்பு முன்னுரிமை வரிசை',
    triageQueueDesc: 'இதய அழுத்தம் மற்றும் வெப்ப உயர்வைப் பொறுத்து அடையாளம் மறைக்கப்பட்ட மருத்துவ பதிவுகள்.',
    markEvaluated: 'பரிசோதிக்கப்பட்டதாக குறி',
    dispatchLiaison: 'மருத்துவ நீரேற்ற குழுவை அனுப்புக',
    ansCorrelationTitle: 'நரம்பு மண்டல தொடர்பு (HRV vs HR)',
    ansCorrelationDesc: 'இதயத்துடிப்பு உயர்வுக்கும் HRV குறைவுக்கும் இடையிலான தொடர்பு.',
    ethicalBoundaryTitle: 'மருத்துவர் நெறிமுறை எல்லை',
    ethicalBoundaryDesc: 'HIPAA §164.514 மற்றும் GDPR கீழ் தனிப்பட்ட தரவுகள் மறைக்கப்பட்டுள்ளன.',
    cohortAnalyticsTitle: 'மண்டலம் வாரியாக குழு நலன் & வெப்ப அழுத்தம்',
    cohortAnalyticsDesc: 'k-Anonymity (N ≥ 12) பாதுகாக்கப்பட்ட தொகுப்பு கண்காணிப்பு.',
    simulatorTitle: 'மருத்துவ வெப்ப அழுத்த & நீரேற்ற உருவகப்படுத்தி',
    projectedOutcomeTitle: 'கணிக்கப்பட்ட மருத்துவ விளைவு',
    auditTrailTitle: 'HIPAA §164.312 மருத்துவ அணுகல் பதிவு',
    certifiedExportsTitle: 'சான்றளிக்கப்பட்ட மருத்துவ அறிக்கை ஏற்றுமதி',
    exportPdfBtn: 'நல அளவீடுகள் PDF ஏற்றுமதி',
    exportCsvBtn: 'குழு உடல்நல CSV ஏற்றுமதி'
  },
  engineer: {
    title: 'வசதி பொறியியல் & இயந்திர நம்பகத்தன்மை தளம்',
    badge: 'செயல்பாடுகள்',
    loggedInAs: 'உள்நுழைந்தவர்:',
    jurisdiction: 'ஆட்சி எல்லை:',
    chillerActive: 'ஸ்மார்ட் குளிரூட்டி தானியங்கி செயலில்',
    bacnetConnected: 'BACnet / Modbus இணைக்கப்பட்டது',
    scopePermitted: 'பொறியியல் அனுமதி: HVAC & டாம்பர் இயக்கம், ISO 10816 அதிர்வு & IoT பராமரிப்பு, வெப்ப உருவகப்படுத்தி',
    scopeBlocked: 'PBAC தடுக்கப்பட்டது: பணியாளர் பயோமெட்ரிக், மருத்துவ அனுப்புதல், HIPAA ஏற்றுமதி',
    tabHvac: 'HVAC & தானியங்கி சீரமைப்பு',
    tabMaintenance: 'ISO 10816 அதிர்வு & IoT பராமரிப்பு',
    tabSimulator: 'வெப்ப & காற்றோட்ட உருவகப்படுத்தி',
    tabAudit: 'பொறியியல் தணிக்கை பதிவு',
    kpiTwl: 'ஆலை சராசரி TWL',
    kpiAch: 'சராசரி காற்று மாற்றம் (ACH)',
    kpiVibration: 'அதிகபட்ச தாங்கி அதிர்வு',
    kpiWorkOrders: '72-மணி நேர IoT பணிகள்',
    sectorVentTitle: 'பிரிவு காற்றோட்டம், டாம்பர் இயக்கம் & TWL மேம்படுத்தல்',
    sectorVentDesc: 'காற்று கையாளும் அலகுகள் (AHU), குளிரூட்டி மற்றும் டாம்பர் நிலைகளின் நேரடி கட்டுப்பாடு.',
    remediationQueueTitle: 'மூடிய-வளைய HVAC சீரமைப்பு வரிசை',
    aggregateEnvTitle: 'தொகுப்பு மண்டல சுற்றுச்சூழல் அளவீடு',
    vibrationTelemetryTitle: 'ISO 10816 அதிர்வு & இயந்திர அளவீடு',
    maintenanceQueueTitle: '72-மணி நேர முன்கணிப்பு IoT பராமரிப்பு வரிசை',
    simulatorTitle: 'வசதி HVAC & குளிரூட்டல் உருவகப்படுத்தி',
    projectedThermalTitle: 'கணிக்கப்பட்ட வெப்ப தாக்கம்',
    auditLogTitle: 'பொறியியல் செயல்பாடு & இணக்க தணிக்கை பதிவு (படிக்க மட்டும்)',
    damperMinus: '-10% டாம்பர்',
    damperPlus: '+10% காற்றோட்டம் கூட்டு',
    approveActuate: 'அனுமதி & இயக்கு',
    overrideBtn: 'மாற்றுக'
  },
  auditor: {
    title: 'சட்டப்பூர்வ ஒழுங்குமுறை இணக்கம் & WSH தணிக்கை ஆய்வகம்',
    badge: 'தணிக்கையாளர் அனுமதி',
    loggedInAs: 'உள்நுழைந்தவர்:',
    primaryJurisdiction: 'முதன்மை ஆட்சி எல்லை:',
    exportDossierBtn: 'ஒழுங்குமுறை ஆவணம் ஏற்றுமதி',
    scopePermitted: 'ஆய்வாளர் அனுமதி: மாற்ற முடியாத கிரிப்டோகிராபிக் தணிக்கை பதிவுகள், தொகுப்பு பகுப்பாய்வு (k ≥ 12)',
    scopeBlocked: 'படிக்க மட்டும் பிரிப்பு: HVAC இயக்கம், மருத்துவ அனுப்புதல் மற்றும் தனிப்பட்ட பயோமெட்ரிக் தடுக்கப்பட்டது',
    tabLedger: 'கிரிப்டோகிராபிக் தணிக்கை பதிவேடு & தனியுரிமை சான்றுகள்',
    tabAggregate: 'தொகுப்பு இணக்கம் & ஆட்சி எல்லைகள்',
    tabExports: 'சான்றளிக்கப்பட்ட ஒழுங்குமுறை ஏற்றுமதிகள்',
    kpiMomWsha: 'சிங்கப்பூர் MOM WSHA',
    kpiKAnonymity: 'சிறு-கலம் k-Anonymity',
    kpiEpsilon: 'ε-வேறுபாடு தனியுரிமை',
    kpiAuditChain: 'தணிக்கை சங்கிலி நம்பகத்தன்மை',
    ledgerTitle: 'மாற்ற முடியாத SHA-256 தணிக்கை பதிவேடு',
    ledgerDesc: 'அனைத்து அமைப்பு மாற்றங்களும் ஓய்வு இடைவேளைகளும் SHA-256 ஹாஷ் மூலம் பதிவு செய்யப்பட்டுள்ளன.',
    liveHipaaEvents: 'நேரடி HIPAA & செயல்பாட்டு இணக்க நிகழ்வுகள்',
    privacyProofTitle: 'சிறு-கலம் தனியுரிமை & கண்காணிப்பு எதிர்ப்பு சான்று',
    privacyProofDesc: 'தனிநபர் அடையாளத்தை வெளிப்படுத்துவதைத் தடுக்கும் கணித உத்தரவாதங்கள்.',
    legalWarrantyTitle: 'சட்டப்பூர்வ தணிக்கையாளர் உத்தரவாதம்',
    aggregateComplianceTitle: 'தொகுப்பு வசதி மண்டல இணக்கம் (N < 12 மறைக்கப்பட்டது)',
    multiJurisdictionTitle: 'பல்-நாட்டு புலம்பெயர் & பணியாளர் சட்ட கட்டமைப்புகள்',
    certifiedExportsTitle: 'சான்றளிக்கப்பட்ட ஆய்வு ஆவண ஏற்றுமதிகள்',
    certifiedExportsDesc: 'ஒவ்வொரு ஏற்றுமதியும் HIPAA §164.514 படி அடையாளம் நீக்கப்பட்டு பதிவேட்டில் சேர்க்கப்படும்.'
  },
  manager: {
    surveillanceCommand: 'கண்காணிப்பு கட்டளை',
    monitoredPersonnel: 'கண்காணிக்கப்படும் பணியாளர்கள்',
    kalmanActive: 'கால்மன் செயலில்',
    roleView: 'பங்கு காட்சி:',
    safetyOfficer: 'பாதுகாப்பு அதிகாரி',
    maintenanceCrew: 'பராமரிப்பு குழு',
    opsLead: 'செயல்பாட்டு தலைவர்',
    mute: 'ஒலியடக்கு',
    alertsMuted: 'எச்சரிக்கை ஒலியடக்கப்பட்டது',
    downloadCsv: 'CSV பதிவிறக்கு',
    downloadPdfReport: 'PDF அறிக்கை பதிவிறக்கு',
    simulateKalman: 'கால்மன் முரண்பாடு உருவகப்படுத்து',
    whatIfSimulator: 'என்ன-என்றால் உருவகப்படுத்தி',
    ingestBenchmarks: 'தரவு உள்ளீடு & அளவுகோல்',
    reportsExport: 'அறிக்கைகள் & ஏற்றுமதி',
    signalVisibility: 'சமிக்ஞை பார்வை:',
    cardiacSignals: 'இதய சமிக்ஞைகள்',
    environmentalSignals: 'சுற்றுச்சூழல் சமிக்ஞைகள்',
    performanceSignals: 'செயல்திறன் சமிக்ஞைகள்',
    historicalMovingAvg: 'வரலாற்று நகரும் சராசரி',
    resetFilters: 'வடிகட்டிகளை மீட்டமை',
    configureSignals: 'சமிக்ஞைகளை அமை →',
    execOverviewHeader: 'நிர்வாக நல செயல்பாடுகள் & அளவீட்டு நிலை',
    kpiActiveAnomalies: 'செயலில் உள்ள முரண்பாடுகள்',
    kpiWorkerCoverage: 'பணியாளர் கவரேஜ்',
    kpiEngineUptime: 'இயந்திர செயல்நேரம்',
    kpiSystemLatency: 'அமைப்பு தாமதம்',
    tabLive: 'நேரடி கண்காணிப்பு',
    tabResources: 'வள பயன்பாடு',
    tabComplianceAudit: 'இணக்க தணிக்கை பதிவு',
    tabHipaaLog: 'HIPAA அணுகல் பதிவு',
    tabPredictiveMaint: 'முன்கணிப்பு பராமரிப்பு',
    tabCorrelation: 'தொடர்பு இயந்திரம்',
    tabWorkerDensity: 'பணியாளர் அடர்த்தி (D3)',
    tabPatternLibrary: 'மாதிரி நூலகம்'
  }
};

const ZH: TranslationDictionary = {
  langSelector: {
    label: '语言',
    placeholder: '搜索或选择语言...',
    noMatch: '未找到匹配的语言',
    selectOneHint: '每次仅可选择一种语言'
  },
  home: {
    brandSubtitle: '多信号劳动力健康早期预警智能平台',
    adminGovernanceBadge: '管理员托管角色治理',
    heroKicker: '近实时人群与劳动力健康智能监测',
    heroTitle: '综合多维信号，在健康风险升级之前主动预防。',
    heroDescription:
      '热应激、自主神经衰竭或职业过度暴露的早期迹象很少存在于单一数据库中。Prognosticator 整合可穿戴生理指标、微气候遥测、作业噪声和缺勤模式，生成可解释的精准预警。',
    card1Title: '工业健康监控指挥中心',
    card1Desc: '实时生理热图与 12 小时异常预测模型。',
    card2Title: '边缘生物识别与微气候物联网',
    card2Desc: '持续监测 HRV、皮肤温度与热作业极限 (TWL)。',
    signInTitle: '企业登录',
    signUpTitle: '申请企业访问权限',
    forgotTitle: '重置安全令牌',
    signInSubtitle: '授权员工身份与控制台访问。',
    signUpSubtitle: '角色与权限等级由系统管理员核准。',
    forgotSubtitle: '向工作邮箱发送重置凭证。',
    tabSignIn: '登录',
    tabSignUp: '注册',
    googleSsoBtn: '使用 Google Cloud SSO 登录',
    orCredentials: '或使用企业凭据',
    emailLabel: '企业工作邮箱',
    passwordLabel: '密码或 SSO 安全密钥',
    rememberMe: '记住此工作站',
    forgotLink: '忘记密码？',
    signInSubmitBtn: '登录监控控制台',
    directoryHeader: '按角色与落地控制台快速填充目录：',
    roleDirectorBtn: '安全总监 (管理员)',
    roleClinicianBtn: '职业健康医师',
    roleEngineerBtn: '设施工程师',
    roleAuditorBtn: 'WSH 合规审计员',
    roleWorkerBtn: '一线工人',
    signupNoticeTitle: '零信任管理员角色治理',
    signupNoticeDesc: '新注册账户默认以 1 级主权工人权限启动，直到安全总监在 RBAC 控制台中分配更高职责。',
    fullNameLabel: '法定全名',
    deptLabel: '部门 / 运营分部',
    confirmPasswordLabel: '确认密码',
    signupSubmitBtn: '申请权限并注册账户',
    alreadyHaveAccount: '已有账户？',
    forgotDesc: '输入您的企业工作邮箱，系统将发送一次性密码重置令牌。',
    resetSubmitBtn: '发送密码重置链接',
    backToSignIn: '← 返回登录',
    footerCopyright: '© 2026 Prognosticator 系统。保留所有权利。',
    footerTagline: '基于角色治理的健康早期预警架构',
    previewTitle: '实时边缘信号预览',
    previewDesc: '登录前即可查看卡尔曼平滑热指数与自主神经基线偏差',
    previewHeatIndex: '热指数',
    previewMse: '基线均方误差',
    previewPrivacy: '隐私护盾'
  },
  shell: {
    surveillanceActive: '监控运行中：',
    roleTabDirector: '高管指挥',
    roleTabClinician: '临床健康',
    roleTabEngineer: '设施 HVAC',
    roleTabAuditor: 'WSH 审计',
    roleTabWorker: '工人隐私盾',
    strictRoleSeparation: '严格角色隔离',
    switchLabel: '切换',
    rbacLabel: 'RBAC',
    statutesLabel: '法规',
    sovereignShield: '主权隐私护盾',
    a11yLabel: '无障碍',
    logOut: '退出登录',
    adminPreviewTitle: '管理员角色审计预览：',
    adminPreviewViewing: '当前正在查看专用落地控制台：',
    returnToExec: '返回高管指挥台 →',
    footerCopyright: '© 2026 Prognosticator 智能平台',
    footerCertified: 'HIPAA 隐私护盾认证',
    footerInvariants: '双重劳工公平 · 非惩罚性遥测 · 强制 k-匿名 (N ≥ 12) 与 ε-差分隐私 (0.5)',
    loadingGateway: '正在加载企业认证网关...',
    loadingDirector: '正在加载执行指挥控制台...',
    loadingClinician: '正在加载职业健康与临床分诊控制台...',
    loadingEngineer: '正在加载设施工程与机械可靠性控制台...',
    loadingAuditor: '正在加载法定合规与 WSH 审计检查台...',
    loadingWorker: '正在加载个人主权生物识别保护盾...'
  },
  worker: {
    title: '工人个人生理体征与自主恢复终端',
    zeroSurveillance: '完全免受管理层个别监控',
    privacyNotice:
      '您的个人健康监测数据受 Prognosticator 隐私护盾算法（k-匿名性 N ≥ 12）严格保护。依据公司政策、MOM 与 HIPAA 法规，此数据绝不用于纪律处分或扣减工资。',
    autonomicRecovery: '自主神经恢复状态 (HRV)',
    mildStrainNotice: '心率变异性监测显示 4 区持续高温导致轻度心血管负荷。',
    skinTemp: '体表温度与热负荷',
    skinTempNotice: '因环境辐射较高，皮肤温度正在上升，已接近蒸发散热阈值。',
    sleepBufferTitle: '睡眠与疲劳缓冲',
    sleepBufferNotice: '昼夜节律恢复稳定，宿舍夜间睡眠温度符合健康标准。',
    hydrationCountdown: '补水与电解质倒计时',
    hydrationNotice: '在严重热负荷环境下，建议每 20 分钟饮用至少 250 毫升电解质水。',
    loggedToday: '今日已记录：',
    portionsLabel: '份',
    logButton: '记录已饮用 250ml',
    cooldownTitle: '自主申请降温休息',
    cooldownDesc: '根据新加坡 MOM 及海湾 MoHRE 法规，工人如感头晕或中暑先兆，享有立即进入阴凉处休息的无条件法定权利。',
    cooldownHelper: '点击下方将向区域安全官发送匿名、非惩罚性的轮换休息请求。',
    requestBreakBtn: '申请立即进入遮阴处降温（免责免处罚）',
    breakDispatchedTitle: '降温休息已派发',
    breakDispatchedDesc: '已通知医疗联络员及阴凉补水帐篷，您可立即停工休整。',
    resumeShiftBtn: '降温完毕 • 返回工作岗位',
    statutoryNotice: '受新加坡《工作场所安全与卫生法令》及 MoHRE 午间停工法规保护。',
    loggedWorkerLabel: '当前工人',
    ephemeralKeyActive: '主权临时密钥已激活',
    statutoryHeader: '现行法定保护',
    dormitoryHeader: '宿舍与降温标准',
    whistleblowerHeader: '非惩罚性举报保障',
    languageAccessLabel: '控制台语言',
    migrantPassBadge: '外籍劳工准证持有者',
    hrvDeltaTag: '(较静息 -14%)',
    highStrainLabel: '高负荷',
    nominalRecoveryLabel: '正常恢复 (68 ms)',
    skinDeltaTag: '(升高 +0.9°C)',
    baselineTempLabel: '基线 36.5°C',
    exhaustionTempLabel: '衰竭警戒 >38.2°C',
    hoursUnit: '小时',
    restorativeTag: '(恢复良好)',
    sleepDeficitLabel: '不足 (<5小时)',
    sleepOptimalLabel: '最佳 (>7小时)',
    twlSevereHeatBadge: 'TWL 115 W/m² (严酷高温)',
    hydrationConfirmedPrefix: '阴凉补水与降温支持已确认，执行方：',
    siteMedicalSafetyTeam: '现场医疗与安全团队',
    middayWorkBanPrefix: '午间禁工令生效：',
    wbgtRestCyclesPrefix: '实时 WBGT 休息周期：'
  },
  clinician: {
    title: '职业健康与临床分诊中心',
    badge: '临床医师控制台',
    loggedInAs: '当前登录：',
    jurisdiction: '适用管辖区：',
    hipaaGuarded: 'HIPAA §164.514 与 GDPR 第 9 条保护',
    zeroDisciplinary: '零纪律追踪',
    scopePermitted: '临床许可范围：生理分诊、紧急医疗派遣、人群聚合分析、临床推演、认证报告与 HIPAA 审计日志',
    scopeBlocked: 'PBAC 限制：全局阈值修改、HVAC 机械控制、IoT 维保、角色管理',
    tabTriage: '临床分诊与医疗派遣',
    tabAnalytics: '人群聚合分析',
    tabSimulator: '临床热应激模拟器',
    tabAuditReports: '临床审计日志与认证报告',
    kpiHrv: '队列均值 HRV',
    kpiSkinTemp: '体表核心温度',
    kpiMeanHr: '平均负荷心率',
    kpiRehydration: '口服补液队列',
    triageQueueTitle: '活跃生理负荷与脱水临床分诊队列',
    triageQueueDesc: '按自主神经负荷与核心体温峰值排序的假名化临床警报。',
    markEvaluated: '标记为已评估',
    dispatchLiaison: '派遣口服补液联络员',
    ansCorrelationTitle: '自主神经系统相关性 (HRV 与心率)',
    ansCorrelationDesc: '心率升高与副交感神经 HRV 抑制之间的负相关关系。',
    ethicalBoundaryTitle: '医师伦理边界标准',
    ethicalBoundaryDesc: '所有临床记录均依 HIPAA §164.514 去标识化；主管仅接收汇总预警。',
    cohortAnalyticsTitle: '按区域划分的去标识化队列健康与热负荷',
    cohortAnalyticsDesc: '受 k-匿名性 (N ≥ 12) 小单元抑制保护的人群流行病学监测。',
    simulatorTitle: '临床热负荷与补水方案模拟器',
    projectedOutcomeTitle: '预计临床结果',
    auditTrailTitle: 'HIPAA §164.312 临床访问与合规审计跟踪',
    certifiedExportsTitle: '认证临床报告导出',
    exportPdfBtn: '导出健康指标审计 PDF',
    exportCsvBtn: '导出队列生理指标 CSV'
  },
  engineer: {
    title: '设施工程与机械可靠性控制台',
    badge: '工程运维',
    loggedInAs: '当前登录：',
    jurisdiction: '适用管辖区：',
    chillerActive: '智能冷机自动化已激活',
    bacnetConnected: 'BACnet / Modbus 已连接',
    scopePermitted: '工程许可范围：HVAC 与风阀控制、ISO 10816 振动与 IoT 维保、厂区环境分析、热工模拟与工程日志',
    scopeBlocked: 'PBAC 限制：员工生物识别、医疗派遣、HIPAA 导出、全局健康阈值',
    tabHvac: 'HVAC 与自动环境修复',
    tabMaintenance: 'ISO 10816 振动与 IoT 维保',
    tabSimulator: '热工与通风模拟器',
    tabAudit: '工程审计日志',
    kpiTwl: '厂区平均 TWL',
    kpiAch: '平均换气次数 (ACH)',
    kpiVibration: '最大轴承振动',
    kpiWorkOrders: '72 小时 IoT 工单',
    sectorVentTitle: '区域通风、风阀驱动与 TWL 优化',
    sectorVentDesc: '直接控制空气处理机组 (AHU)、冷机设定点与风阀开度。',
    remediationQueueTitle: '闭环 HVAC 修复队列',
    aggregateEnvTitle: '区域聚合环境遥测',
    vibrationTelemetryTitle: 'ISO 10816 振动与旋转机械遥测',
    maintenanceQueueTitle: '72 小时预测性 IoT 传感器维保队列',
    simulatorTitle: '设施 HVAC 与降温缓解假设模拟器',
    projectedThermalTitle: '预计热工影响',
    auditLogTitle: '工程驱动与合规审计日志（只读）',
    damperMinus: '-10% 风阀',
    damperPlus: '+10% 增强风量',
    approveActuate: '批准并执行',
    overrideBtn: '人工接管'
  },
  auditor: {
    title: '法定监管合规与 WSH 审计督察台',
    badge: '审计员权限',
    loggedInAs: '当前登录：',
    primaryJurisdiction: '主要管辖区：',
    exportDossierBtn: '导出监管审计档案',
    scopePermitted: '督察许可范围：不可篡改加密审计链、去标识化聚合分析 (k ≥ 12) 与认证合规档案',
    scopeBlocked: '严格只读职责隔离：禁止控制 HVAC、医疗派遣、修改阈值或查看明文生理数据',
    tabLedger: '加密审计账本与隐私证明',
    tabAggregate: '聚合合规与多国管辖区',
    tabExports: '认证监管报告导出',
    kpiMomWsha: '新加坡 MOM WSHA',
    kpiKAnonymity: '小单元 k-匿名性',
    kpiEpsilon: 'ε-差分隐私预算',
    kpiAuditChain: '审计链完整性',
    ledgerTitle: '不可篡改加密防伪审计账本',
    ledgerDesc: '带有 SHA-256 哈希时间戳的只追加加密区块，验证所有系统覆写与工间休息。',
    liveHipaaEvents: '实时 HIPAA 与运营合规事件',
    privacyProofTitle: '小单元隐私与防监控数学证明',
    privacyProofDesc: '从数学上确保主管或第三方无法重新识别个人身份。',
    legalWarrantyTitle: '法定审计员法律保障',
    aggregateComplianceTitle: '设施区域聚合合规性（N < 12 自动掩码）',
    multiJurisdictionTitle: '多管辖区劳工与外籍工人法定框架',
    certifiedExportsTitle: '认证法定督察档案导出',
    certifiedExportsDesc: '从督察控制台导出的每份报告均经过 HIPAA §164.514 去标识化并记入审计链。'
  },
  manager: {
    surveillanceCommand: '健康监控指挥台',
    monitoredPersonnel: '在网监测人数',
    kalmanActive: '卡尔曼滤波运行中',
    roleView: '角色视角：',
    safetyOfficer: '安全主管',
    maintenanceCrew: '运维工程组',
    opsLead: '运营负责人',
    mute: '静音',
    alertsMuted: '警报已静音',
    downloadCsv: '下载 CSV',
    downloadPdfReport: '下载 PDF 报告',
    simulateKalman: '模拟卡尔曼异常',
    whatIfSimulator: '假设模拟器',
    ingestBenchmarks: '数据导入与基准',
    reportsExport: '报告与导出',
    signalVisibility: '信号可见性：',
    cardiacSignals: '心脏生理信号',
    environmentalSignals: '环境微气候信号',
    performanceSignals: '效能与风险信号',
    historicalMovingAvg: '历史滑动均值',
    resetFilters: '重置筛选',
    configureSignals: '配置信号 →',
    execOverviewHeader: '高管健康运营与遥测状态概览',
    kpiActiveAnomalies: '活跃异常告警',
    kpiWorkerCoverage: '工人覆盖率',
    kpiEngineUptime: '引擎可用率',
    kpiSystemLatency: '系统延迟',
    tabLive: '实时监控',
    tabResources: '资源调度',
    tabComplianceAudit: '合规审计日志',
    tabHipaaLog: 'HIPAA 访问日志',
    tabPredictiveMaint: '预测性维保',
    tabCorrelation: '因果关联引擎',
    tabWorkerDensity: '人员密度 (D3)',
    tabPatternLibrary: '模式库'
  }
};

const TL: TranslationDictionary = {
  langSelector: {
    label: 'Wika',
    placeholder: 'Maghanap o pumili ng wika...',
    noMatch: 'Walang nahanap na katugmang wika',
    selectOneHint: 'Pumili ng isang wika nang paisa-isa'
  },
  home: {
    brandSubtitle: 'Katalinuhan sa Maagang Babala para sa Kalusugan ng Manggagawa',
    adminGovernanceBadge: 'Pamamahalang Papel ng Admin',
    heroKicker: 'Halos Real-Time na Katalinuhan sa Kalusugan ng Manggagawa',
    heroTitle: 'Pagsamahin ang mga signal upang maiwasan ang panganib bago ito lumala.',
    heroDescription:
      'Ang maagang palatandaan ng heat stress o sobrang pagkapagod ay bihirang nasa iisang database. Pinagsasama ng Prognosticator ang wearable biometrics, klima ng kapaligiran, at antas ng ingay sa malinaw na babala.',
    card1Title: 'Sentro ng Pagsubaybay sa Industriya',
    card1Desc: 'Live biometric heat map at 12-oras na prediksyon ng anomalya.',
    card2Title: 'Edge Biometric at Microclimate IoT',
    card2Desc: 'Tuloy-tuloy na HRV, temperatura ng balat, at Thermal Work Limit (TWL).',
    signInTitle: 'Mag-sign In sa Enterprise',
    signUpTitle: 'Humiling ng Access',
    forgotTitle: 'I-reset ang Security Token',
    signInSubtitle: 'Awtorisadong pagkakakilanlan at console ng manggagawa.',
    signUpSubtitle: 'Bineberipika ng Administrator ang antas ng clearance.',
    forgotSubtitle: 'Magpadala ng recovery link sa work email.',
    tabSignIn: 'Mag-sign In',
    tabSignUp: 'Magparehistro',
    googleSsoBtn: 'Mag-sign In gamit ang Google Cloud SSO',
    orCredentials: 'O Mga Kredensyal ng Enterprise',
    emailLabel: 'Work Email ng Kumpanya',
    passwordLabel: 'Password o SSO Security Key',
    rememberMe: 'Tandaan ang workstation',
    forgotLink: 'Nakalimutan ang password?',
    signInSubmitBtn: 'Pumasok sa Surveillance Console',
    directoryHeader: 'Mabilisang Pagpili ayon sa Papel at Console:',
    roleDirectorBtn: 'Direktor ng Kaligtasan (Admin)',
    roleClinicianBtn: 'Doktor sa Kalusugan',
    roleEngineerBtn: 'Inhinyero ng Pasilidad',
    roleAuditorBtn: 'Tagasuri ng Pagsunod (WSH)',
    roleWorkerBtn: 'Manggagawa sa Larangan',
    signupNoticeTitle: 'Zero-Trust na Pamamahala ng Admin',
    signupNoticeDesc:
      'Ang mga bagong rehistrasyon ay nagsisimula sa Level 1 Worker clearance hanggang itaas ng Safety Director sa RBAC console.',
    fullNameLabel: 'Buong Legal na Pangalan',
    deptLabel: 'Departamento / Dibisyon',
    confirmPasswordLabel: 'Kumpirmahin ang Password',
    signupSubmitBtn: 'Humiling ng Access at Magrehistro',
    alreadyHaveAccount: 'Mayroon ka nang account?',
    forgotDesc: 'Ilagay ang iyong work email upang makatanggap ng password reset token.',
    resetSubmitBtn: 'Ipadala ang Password Reset Link',
    backToSignIn: '← Bumalik sa Sign In',
    footerCopyright: '© 2026 Prognosticator System. Nakalaan ang lahat ng karapatan.',
    footerTagline: 'Arkitektura ng Maagang Babala na Pinamamahalaan ng Papel',
    previewTitle: 'Live na Edge Signal Preview',
    previewDesc: 'Kalman-smoothed na init at biometric telemetry bago mag-sign in',
    previewHeatIndex: 'Indeks ng Init',
    previewMse: 'Baseline MSE',
    previewPrivacy: 'Kalasag sa Privacy'
  },
  shell: {
    surveillanceActive: 'Aktibong Pagsubaybay:',
    roleTabDirector: 'Executive Command',
    roleTabClinician: 'Klinikal na Kalusugan',
    roleTabEngineer: 'Pasilidad HVAC',
    roleTabAuditor: 'WSH Audit',
    roleTabWorker: 'Kalasag ng Manggagawa',
    strictRoleSeparation: 'Mahigpit na Paghihiwalay ng Papel',
    switchLabel: 'PALITAN',
    rbacLabel: 'RBAC',
    statutesLabel: 'Mga Batas',
    sovereignShield: 'Sovereign Privacy Shield',
    a11yLabel: 'A11y',
    logOut: 'Mag-log Out',
    adminPreviewTitle: 'Preview ng Pag-audit ng Admin:',
    adminPreviewViewing: 'Tinitingnan ang console para sa',
    returnToExec: 'Bumalik sa Executive Command →',
    footerCopyright: '© 2026 Prognosticator Intelligence Platform',
    footerCertified: 'Sertipikadong HIPAA Shield',
    footerInvariants: 'Pantay na Karapatan · Walang Parusang Telemetry · k-Anonymity (N ≥ 12) & ε-DP (0.5)',
    loadingGateway: 'Nilo-load ang Enterprise Authentication Gateway...',
    loadingDirector: 'Nilo-load ang Executive Command Console...',
    loadingClinician: 'Nilo-load ang Occupational Health at Clinical Triage Console...',
    loadingEngineer: 'Nilo-load ang Facility Engineering at Mechanical Reliability Console...',
    loadingAuditor: 'Nilo-load ang Statutory Regulatory Compliance at WSH Audit Console...',
    loadingWorker: 'Nilo-load ang pribadong biometric shield...'
  },
  worker: {
    title: 'Pribadong Terminal ng Kalusugan at Pahinga ng Manggagawa',
    zeroSurveillance: 'Walang Surveillance ng Pamunuan',
    privacyNotice:
      'Protektado ang iyong datos ng privacy shield (k-Anonymity N ≥ 12). Hindi ito maaaring gamitin para sa bawas-sahod o parusa ayon sa batas ng paggawa.',
    autonomicRecovery: 'Autonomic Recovery at Pagod',
    mildStrainNotice: 'May banayad na pagkapagod ang iyong puso dahil sa mataas na temperatura sa Sector 4.',
    skinTemp: 'Temperatura ng Balat at Init',
    skinTempNotice: 'Tumataas ang temperatura ng balat dahil sa matinding init. Malapit na sa antas ng pagpapalamig.',
    sleepBufferTitle: 'Pahinga sa Pagtulog at Pagod',
    sleepBufferNotice: 'Maayos ang iyong tulog at pasok sa tamang temperatura ng dormitoryo.',
    hydrationCountdown: 'Oras ng Pag-inom ng Tubig at Electrolytes',
    hydrationNotice: 'Uminom ng hindi bababa sa 250ml na tubig kada 20 minuto sa matinding init.',
    loggedToday: 'Nainom Ngayon:',
    portionsLabel: 'baso',
    logButton: 'Naitala ang 250ml na Nainom',
    cooldownTitle: 'Hiling para sa Agarang Pagpapalamig',
    cooldownDesc:
      'Karapatan ng bawat manggagawa sa ilalim ng batas MOM at MoHRE na magpahinga agad sa lilim kapag nakakaranas ng pagkahilo o sobrang init.',
    cooldownHelper: 'Magpapadala ito ng hindi nagpapakilalang kahilingan ng pahinga na walang parusa.',
    requestBreakBtn: 'Humiling ng Agarang Pahinga sa Lilim (Walang Parusa)',
    breakDispatchedTitle: 'Naipadala ang Hiling ng Pahinga',
    breakDispatchedDesc: 'Naabisuhan na ang medical liaison at hydration tent. Maaari ka nang magpahinga agad.',
    resumeShiftBtn: 'Tapos na ang Pahinga • Bumalik sa Trabaho',
    statutoryNotice: 'Protektado sa ilalim ng WSH Act at Proteksyon sa Migranteng Manggagawa.',
    loggedWorkerLabel: 'Naka-log na Manggagawa',
    ephemeralKeyActive: 'Aktibo ang Pribadong Susi',
    statutoryHeader: 'Aktibong Batas na Proteksyon',
    dormitoryHeader: 'Pamantayan sa Dormitoryo at Paglamig',
    whistleblowerHeader: 'Garantiyang Walang Parusa',
    languageAccessLabel: 'Napiling Wika',
    migrantPassBadge: 'Migrant Pass Holder',
    hrvDeltaTag: '(-14% mula pahinga)',
    highStrainLabel: 'Mataas na Pagod',
    nominalRecoveryLabel: 'Normal na Pagbawi (68 ms)',
    skinDeltaTag: '(Tumaas +0.9°C)',
    baselineTempLabel: 'Baseline 36.5°C',
    exhaustionTempLabel: 'Panganib >38.2°C',
    hoursUnit: 'oras',
    restorativeTag: '(Nakakabawi)',
    sleepDeficitLabel: 'Kulang (<5o)',
    sleepOptimalLabel: 'Sapat (>7o)',
    twlSevereHeatBadge: 'TWL 115 W/m² (Matinding Init)',
    hydrationConfirmedPrefix: 'Nakumpirma ang suporta sa tubig at lilim ng',
    siteMedicalSafetyTeam: 'Koponan ng Medikal at Kaligtasan sa Site',
    middayWorkBanPrefix: 'Aktibong Bawal sa Tanghali:',
    wbgtRestCyclesPrefix: 'Live na WBGT Pahinga:'
  },
  clinician: {
    title: 'Sentro ng Kalusugan sa Trabaho at Klinikal na Triage',
    badge: 'KLINIKAL MD CONSOLE',
    loggedInAs: 'Naka-login bilang',
    jurisdiction: 'Huridiksyon:',
    hipaaGuarded: 'Protektado ng HIPAA §164.514 & GDPR',
    zeroDisciplinary: 'Walang Pagsubaybay sa Disiplina',
    scopePermitted: 'Pinahihintulutang Saklaw: Klinikal na Triage, Medikal na Dispatch, Pagsusuri ng Grupo, Mga Sertipikadong Ulat',
    scopeBlocked: 'Harang ng PBAC: Pandaigdigang Limitasyon, Pagkontrol ng HVAC, IoT Maintenance, Role Admin',
    tabTriage: 'Klinikal na Triage at Medikal na Dispatch',
    tabAnalytics: 'Pagsusuri ng Grupo (Cohort)',
    tabSimulator: 'Simulator ng Init sa Katawan',
    tabAuditReports: 'Audit Log at Mga Sertipikadong Ulat',
    kpiHrv: 'Karaniwang HRV ng Grupo',
    kpiSkinTemp: 'Temperatura ng Balat',
    kpiMeanHr: 'Karaniwang Tibok ng Puso',
    kpiRehydration: 'Pila sa Electrolyte',
    triageQueueTitle: 'Aktibong Pila ng Pagkapagod at Dehydration',
    triageQueueDesc: 'Mga flag na nakatago ang pangalan batay sa pagod ng puso at pagtaas ng init.',
    markEvaluated: 'Markahang Nasuri',
    dispatchLiaison: 'Magpadala ng Electrolyte Liaison',
    ansCorrelationTitle: 'Ugnayan ng Autonomic Nervous System (HRV vs HR)',
    ansCorrelationDesc: 'Kabaligtarang ugnayan ng pagtaas ng tibok ng puso at pagbaba ng HRV.',
    ethicalBoundaryTitle: 'Pamantayan sa Etika ng Doktor',
    ethicalBoundaryDesc: 'Lahat ng tala ay walang pangalan alinsunod sa HIPAA §164.514 at GDPR.',
    cohortAnalyticsTitle: 'Pangkalahatang Kalusugan ayon sa Sona',
    cohortAnalyticsDesc: 'Sinusuri nang may proteksyong k-Anonymity (N ≥ 12).',
    simulatorTitle: 'Simulator ng Heat Strain at Hydration Protocol',
    projectedOutcomeTitle: 'Inaasahang Resultang Klinikal',
    auditTrailTitle: 'HIPAA §164.312 Klinikal na Access Trail',
    certifiedExportsTitle: 'Mga Sertipikadong Klinikal na Export',
    exportPdfBtn: 'I-export ang Health Metrics PDF',
    exportCsvBtn: 'I-export ang Cohort CSV'
  },
  engineer: {
    title: 'Console ng Inhinyeriya ng Pasilidad at Pagiging Maaasahan',
    badge: 'OPERASYON',
    loggedInAs: 'Naka-login bilang',
    jurisdiction: 'Huridiksyon:',
    chillerActive: 'Aktibo ang Smart Chiller',
    bacnetConnected: 'Nakakonekta ang BACnet / Modbus',
    scopePermitted: 'Saklaw ng Inhinyeriya: Pagkontrol sa HVAC at Damper, ISO 10816 Vibration, IoT Maintenance, Audit Log',
    scopeBlocked: 'Harang ng PBAC: Biometrics ng Manggagawa, Medikal na Dispatch, HIPAA Export',
    tabHvac: 'HVAC at Awtomatikong Pagsasaayos',
    tabMaintenance: 'ISO 10816 Vibration at IoT Maintenance',
    tabSimulator: 'Simulator ng Init at Bentilasyon',
    tabAudit: 'Log ng Pag-audit ng Inhinyeriya',
    kpiTwl: 'Karaniwang TWL ng Planta',
    kpiAch: 'Air Changes (ACH)',
    kpiVibration: 'Pinakamataas na Vibration',
    kpiWorkOrders: '72h IoT Work Orders',
    sectorVentTitle: 'Bentilasyon ng Sektor at Pag-optimize ng TWL',
    sectorVentDesc: 'Direktang kontrol sa air handling units (AHU), chiller, at damper.',
    remediationQueueTitle: 'Pila ng HVAC Remediation',
    aggregateEnvTitle: 'Datos ng Kapaligiran ayon sa Sona',
    vibrationTelemetryTitle: 'ISO 10816 Vibration ng Makinarya',
    maintenanceQueueTitle: '72-Oras na IoT Sensor Maintenance Queue',
    simulatorTitle: 'Simulator ng HVAC at Pagpapalamig',
    projectedThermalTitle: 'Inaasahang Epekto sa Init',
    auditLogTitle: 'Log ng Inhinyeriya (Read-Only)',
    damperMinus: '-10% Damper',
    damperPlus: '+10% Dagdag Hangin',
    approveActuate: 'Aprubahan at Paganahin',
    overrideBtn: 'Baguhin'
  },
  auditor: {
    title: 'Inspektorado ng Pagsunod sa Batas at WSH Audit',
    badge: 'CLEARANCE NG AUDITOR',
    loggedInAs: 'Naka-login bilang',
    primaryJurisdiction: 'Pangunahing Huridiksyon:',
    exportDossierBtn: 'I-export ang Regulatory Dossier',
    scopePermitted: 'Saklaw ng Inspektor: Hindi Nababagong Audit Trails, Analytics (k ≥ 12) at Mga Sertipikadong Dossier',
    scopeBlocked: 'Read-Only Lamang: Bawal ang HVAC Control, Medikal na Dispatch, at Raw Biometrics',
    tabLedger: 'Cryptographic Audit Ledger at Patunay ng Privacy',
    tabAggregate: 'Pangkalahatang Pagsunod at Mga Batas',
    tabExports: 'Mga Sertipikadong Regulatory Export',
    kpiMomWsha: 'Singapore MOM WSHA',
    kpiKAnonymity: 'Small-Cell k-Anonymity',
    kpiEpsilon: 'ε-Differential Privacy',
    kpiAuditChain: 'Integridad ng Audit Chain',
    ledgerTitle: 'Hindi Nababagong Cryptographic Audit Ledger',
    ledgerDesc: 'Mga nakaselyong bloke na may SHA-256 hash para sa lahat ng pagsusuri.',
    liveHipaaEvents: 'Live na HIPAA at Operational Events',
    privacyProofTitle: 'Patunay sa Small-Cell Privacy',
    privacyProofDesc: 'Matematikong garantiya laban sa indibidwal na pagsubaybay.',
    legalWarrantyTitle: 'Legal na Garantiya ng Auditor',
    aggregateComplianceTitle: 'Pagsunod ng Bawat Sona (Nakatago kung N < 12)',
    multiJurisdictionTitle: 'Mga Batas para sa Migranteng Manggagawa',
    certifiedExportsTitle: 'Sertipikadong Inspection Dossier Exports',
    certifiedExportsDesc: 'Lahat ng export ay sumusunod sa HIPAA §164.514 Safe Harbor.'
  },
  manager: {
    surveillanceCommand: 'Sentro ng Pagsubaybay',
    monitoredPersonnel: 'Sinusubaybayang Tauhan',
    kalmanActive: 'Aktibo ang Kalman',
    roleView: 'View ng Papel:',
    safetyOfficer: 'Safety Officer',
    maintenanceCrew: 'Maintenance Crew',
    opsLead: 'Ops Lead',
    mute: 'I-mute',
    alertsMuted: 'Naka-mute ang Mga Alerto',
    downloadCsv: 'I-download ang CSV',
    downloadPdfReport: 'I-download ang PDF',
    simulateKalman: 'I-simulate ang Kalman',
    whatIfSimulator: 'What-If Simulator',
    ingestBenchmarks: 'Mag-upload ng Datos',
    reportsExport: 'Mga Ulat at Export',
    signalVisibility: 'Mga Nakikitang Signal:',
    cardiacSignals: 'Signal sa Puso',
    environmentalSignals: 'Signal sa Kapaligiran',
    performanceSignals: 'Signal sa Pagganap',
    historicalMovingAvg: 'Historical Moving Average',
    resetFilters: 'I-reset ang Filter',
    configureSignals: 'Ayusin ang Signal →',
    execOverviewHeader: 'Pangkalahatang Kalagayan ng Kalusugan at Telemetry',
    kpiActiveAnomalies: 'Aktibong Anomalya',
    kpiWorkerCoverage: 'Saklaw ng Manggagawa',
    kpiEngineUptime: 'Uptime ng Makina',
    kpiSystemLatency: 'Latency ng Sistema',
    tabLive: 'Live na Pagsubaybay',
    tabResources: 'Paggamit ng Yaman',
    tabComplianceAudit: 'Compliance Audit Log',
    tabHipaaLog: 'HIPAA Access Log',
    tabPredictiveMaint: 'Predictive Maintenance',
    tabCorrelation: 'Correlation Engine',
    tabWorkerDensity: 'Densidad ng Manggagawa (D3)',
    tabPatternLibrary: 'Aklatan ng Pattern'
  }
};

const AR: TranslationDictionary = {
  langSelector: {
    label: 'اللغة',
    placeholder: 'ابحث أو اختر اللغة...',
    noMatch: 'لم يتم العثور على لغة مطابقة',
    selectOneHint: 'اختر لغة واحدة في كل مرة'
  },
  home: {
    brandSubtitle: 'ذكاء الإنذار المبكر متعدد الإشارات لصحة القوى العاملة',
    adminGovernanceBadge: 'حوكمة الأدوار بإدارة المسؤول',
    heroKicker: 'ذكاء الصحة المهنية والقوى العاملة في الوقت الفعلي',
    heroTitle: 'وحّد الإشارات المتفرقة لمنع المخاطر الصحية قبل تفاقمها.',
    heroDescription:
      'نادراً ما تظهر العلامات المبكرة للإجهاد الحراري أو الإرهاق في قاعدة بيانات واحدة. يدمج Prognosticator المؤشرات الحيوية القابلة للارتداء والبيئة المحيطة ومستويات الضوضاء لإصدار إنذارات مبكرة دقيقة.',
    card1Title: 'مركز قيادة المراقبة الصناعية',
    card1Desc: 'خرائط حرارية حيوية فورية وتنبؤات للـ 12 ساعة القادمة.',
    card2Title: 'إنترنت الأشياء الحيوي والمناخ الدقيق',
    card2Desc: 'رصد مستمر لتقلب معدل ضربات القلب وحرارة الجلد وحد العمل الحراري (TWL).',
    signInTitle: 'تسجيل الدخول للمؤسسات',
    signUpTitle: 'طلب صلاحية الوصول',
    forgotTitle: 'إعادة تعيين رمز الأمان',
    signInSubtitle: 'وحدة هوية القوى العاملة المصرح بها.',
    signUpSubtitle: 'يتم التحقق من الدور والصلاحية من قبل المسؤول.',
    forgotSubtitle: 'إرسال بيانات الاسترداد إلى بريد العمل.',
    tabSignIn: 'تسجيل الدخول',
    tabSignUp: 'إنشاء حساب',
    googleSsoBtn: 'تسجيل الدخول عبر Google Cloud SSO',
    orCredentials: 'أو بيانات اعتماد المؤسسة',
    emailLabel: 'البريد الإلكتروني للعمل',
    passwordLabel: 'كلمة المرور أو مفتاح SSO',
    rememberMe: 'تذكر محطة العمل',
    forgotLink: 'نسيت كلمة المرور؟',
    signInSubmitBtn: 'الدخول إلى وحدة التحكم',
    directoryHeader: 'تعبئة سريعة حسب الدور ولوحة الهبوط:',
    roleDirectorBtn: 'مدير السلامة (مسؤول)',
    roleClinicianBtn: 'طبيب الصحة المهنية',
    roleEngineerBtn: 'مهندس المرافق',
    roleAuditorBtn: 'مدقق الامتثال (WSH)',
    roleWorkerBtn: 'عامل ميداني',
    signupNoticeTitle: 'حوكمة انعدام الثقة بإدارة المسؤول',
    signupNoticeDesc: 'تبدأ الحسابات الجديدة بمستوى صلاحية العامل حتى يقوم مدير السلامة بترقيتها في وحدة RBAC.',
    fullNameLabel: 'الاسم القانوني الكامل',
    deptLabel: 'القسم / الوحدة التشغيلية',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    signupSubmitBtn: 'طلب الوصول وتسجيل الحساب',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    forgotDesc: 'أدخل بريد عملك المؤسسي لإرسال رمز استرداد مشفر.',
    resetSubmitBtn: 'إرسال رابط إعادة التعيين',
    backToSignIn: '← العودة لتسجيل الدخول',
    footerCopyright: '© 2026 نظام Prognosticator. جميع الحقوق محفوظة.',
    footerTagline: 'بنية الإنذار المبكر الصحي المحكومة بالأدوار',
    previewTitle: 'معاينة إشارة الحافة الحية',
    previewDesc: 'قياس حراري وحيوي منعم بفلتر كالمان قبل تسجيل الدخول',
    previewHeatIndex: 'مؤشر الحرارة',
    previewMse: 'خطأ خط الأساس',
    previewPrivacy: 'درع الخصوصية'
  },
  shell: {
    surveillanceActive: 'المراقبة نشطة:',
    roleTabDirector: 'القيادة التنفيذية',
    roleTabClinician: 'الصحة السريرية',
    roleTabEngineer: 'تكييف المرافق',
    roleTabAuditor: 'تدقيق السلامة',
    roleTabWorker: 'درع العامل',
    strictRoleSeparation: 'فصل صارم للأدوار',
    switchLabel: 'تبديل',
    rbacLabel: 'RBAC',
    statutesLabel: 'الأنظمة',
    sovereignShield: 'درع الخصوصية السيادي',
    a11yLabel: 'إتاحة',
    logOut: 'تسجيل الخروج',
    adminPreviewTitle: 'معاينة تدقيق الدور للمسؤول:',
    adminPreviewViewing: 'عرض لوحة الهبوط المخصصة لـ',
    returnToExec: 'العودة للقيادة التنفيذية ←',
    footerCopyright: '© 2026 منصة Prognosticator الذكية',
    footerCertified: 'معتمد وفق درع HIPAA',
    footerInvariants: 'عدالة القوى العاملة · قياس غير عقابي · إخفاء الهوية k-Anonymity (N ≥ 12) و ε-DP (0.5)',
    loadingGateway: 'جارٍ تحميل بوابة المصادقة المؤسسية...',
    loadingDirector: 'جارٍ تحميل وحدة القيادة التنفيذية...',
    loadingClinician: 'جارٍ تحميل وحدة الصحة المهنية والفرز السريري...',
    loadingEngineer: 'جارٍ تحميل وحدة هندسة المرافق والموثوقية الميكانيكية...',
    loadingAuditor: 'جارٍ تحميل هيئة الامتثال التنظيمي وتدقيق WSH...',
    loadingWorker: 'جارٍ تحميل درع القياسات الحيوية الخاص...'
  },
  worker: {
    title: 'محطة المؤشرات الحيوية والتعافي الخاصة بالعامل',
    zeroSurveillance: 'حماية كاملة من المراقبة الإدارية الفردية',
    privacyNotice:
      'بياناتك الحيوية محمية بنظام درع الخصوصية (k-Anonymity N ≥ 12). بموجب القانون ولوائح العمل، لا يجوز استخدام هذه البيانات لخصم الأجور أو اتخاذ تدابير تأديبية.',
    autonomicRecovery: 'مستوى التعافي والإجهاد القلبي',
    mildStrainNotice: 'يُظهر تقلب معدل ضربات القلب إجهاداً حرارياً خفيفاً ناتجاً عن درجات الحرارة العالية في القطاع 4.',
    skinTemp: 'حرارة الجلد والحمل الحراري',
    skinTempNotice: 'ترتفع حرارة الجلد بسبب الإشعاع الحراري في القطاع 4. يُنصح بالتبريد.',
    sleepBufferTitle: 'رصيد النوم والتعافي',
    sleepBufferNotice: 'التعافي الليلي مستقر وحقق معايير التبريد في السكن.',
    hydrationCountdown: 'العد التنازلي لشرب الماء والأملاح',
    hydrationNotice: 'الهدف الأدنى: شرب 250 مل من محلول الأملاح كل 20 دقيقة في الأجواء شديدة الحرارة.',
    loggedToday: 'المسجل اليوم:',
    portionsLabel: 'حصص',
    logButton: 'تسجيل استهلاك 250 مل',
    cooldownTitle: 'طلب استراحة تبريد فورية في الظل',
    cooldownDesc:
      'بموجب قرار حظر العمل وقت الظهيرة ولوائح وزارة الموارد البشرية، يحق لك نظاماً التوقف وأخذ استراحة مظللة فوراً دون أي خصم.',
    cooldownHelper: 'الضغط أدناه يرسل طلباً مجهول الهوية وغير عقابي لمسؤول السلامة.',
    requestBreakBtn: 'طلب استراحة فورية في منطقة مظللة (بدون عقوبة)',
    breakDispatchedTitle: 'تم إرسال طلب استراحة التبريد',
    breakDispatchedDesc: 'تم إخطار الطاقم الطبي وخيمة الترطيب المبردة. يمكنك التوقف عن العمل فوراً بأمان.',
    resumeShiftBtn: 'اكتمل التبريد • استئناف الوردية',
    statutoryNotice: 'محمي بموجب قرارات وزارة الموارد البشرية ولوائح حماية العمال.',
    loggedWorkerLabel: 'العامل المسجل',
    ephemeralKeyActive: 'مفتاح الخصوصية السيادي نشط',
    statutoryHeader: 'الحماية القانونية النشطة',
    dormitoryHeader: 'معايير السكن والتبريد',
    whistleblowerHeader: 'ضمان الإبلاغ دون عقوبة',
    languageAccessLabel: 'لغة لوحة التحكم',
    migrantPassBadge: 'حامل تصريح عمل وافد',
    hrvDeltaTag: '(-14% عن الراحة)',
    highStrainLabel: 'إجهاد مرتفع',
    nominalRecoveryLabel: 'تعافٍ طبيعي (68 ms)',
    skinDeltaTag: '(ارتفاع +0.9°C)',
    baselineTempLabel: 'الأساس 36.5°C',
    exhaustionTempLabel: 'إرهاق >38.2°C',
    hoursUnit: 'ساعات',
    restorativeTag: '(مجدد للنشاط)',
    sleepDeficitLabel: 'نقص (<5 ساعات)',
    sleepOptimalLabel: 'مثالي (>7 ساعات)',
    twlSevereHeatBadge: 'TWL 115 W/m² (حرارة شديدة)',
    hydrationConfirmedPrefix: 'تم تأكيد دعم الترطيب والتبريد المظلل بواسطة:',
    siteMedicalSafetyTeam: 'فريق الصحة والسلامة بالموقع',
    middayWorkBanPrefix: 'حظر العمل وقت الظهيرة نشط:',
    wbgtRestCyclesPrefix: 'دورات راحة WBGT المباشرة:'
  },
  clinician: {
    title: 'مركز الصحة المهنية والفرز السريري',
    badge: 'وحدة الطبيب السريري',
    loggedInAs: 'مسجل الدخول باسم',
    jurisdiction: 'الاختصاص القضائي:',
    hipaaGuarded: 'محمي وفق HIPAA §164.514 و GDPR',
    zeroDisciplinary: 'صفر تتبع تأديبي',
    scopePermitted: 'النطاق السريري المسموح: الفرز الفسيولوجي، الإرسال الطبي، التحليل الجماعي، التقارير المعتمدة وسجلات HIPAA',
    scopeBlocked: 'محظور عبر PBAC: تعديل الحدود العامة، تشغيل التكييف، صيانة IoT، إدارة الأدوار',
    tabTriage: 'الفرز السريري والإرسال الطبي',
    tabAnalytics: 'تحليلات المجموعات الإجمالية',
    tabSimulator: 'محاكي الإجهاد الحراري السريري',
    tabAuditReports: 'سجل التدقيق السريري والتقارير المعتمدة',
    kpiHrv: 'متوسط HRV للمجموعة',
    kpiSkinTemp: 'حرارة الجلد الأساسية',
    kpiMeanHr: 'متوسط نبض القلب',
    kpiRehydration: 'قائمة الإماهة الفموية',
    triageQueueTitle: 'قائمة الفرز النشطة للإجهاد الفسيولوجي والجفاف',
    triageQueueDesc: 'إشارات سريرية بأسماء مستعارة مرتبة حسب الإجهاد القلبي والحرارة.',
    markEvaluated: 'تحديد كمقيّم',
    dispatchLiaison: 'إرسال فريق الإماهة الفموية',
    ansCorrelationTitle: 'ارتباط الجهاز العصبي اللاإرادي (HRV مقابل HR)',
    ansCorrelationDesc: 'العلاقة العكسية بين ارتفاع نبض القلب وانخفاض HRV.',
    ethicalBoundaryTitle: 'المعيار الأخلاقي للطبيب',
    ethicalBoundaryDesc: 'جميع السجلات منزوعة الهوية بموجب HIPAA §164.514 ولا يطّلع المشرفون إلا على الملخصات.',
    cohortAnalyticsTitle: 'صحة المجموعات والحمل الحراري حسب المنطقة',
    cohortAnalyticsDesc: 'رصد وبائي محمي بإخفاء الخلايا الصغيرة (N ≥ 12).',
    simulatorTitle: 'محاكي الإجهاد الحراري وبروتوكول الترطيب',
    projectedOutcomeTitle: 'النتيجة السريرية المتوقعة',
    auditTrailTitle: 'سجل الوصول السريري HIPAA §164.312',
    certifiedExportsTitle: 'تصدير التقارير السريرية المعتمدة',
    exportPdfBtn: 'تصدير تدقيق المقاييس الصحية PDF',
    exportCsvBtn: 'تصدير البيانات الفسيولوجية CSV'
  },
  engineer: {
    title: 'وحدة هندسة المرافق والموثوقية الميكانيكية',
    badge: 'العمليات الهندسية',
    loggedInAs: 'مسجل الدخول باسم',
    jurisdiction: 'الاختصاص القضائي:',
    chillerActive: 'أتمتة المبردات الذكية نشطة',
    bacnetConnected: 'BACnet / Modbus متصل',
    scopePermitted: 'النطاق الهندسي: تشغيل HVAC والمخمدات، اهتزاز ISO 10816، صيانة IoT، المحاكاة الحرارية وسجل الهندسة',
    scopeBlocked: 'محظور عبر PBAC: المؤشرات الحيوية للعمال، الإرسال الطبي، تقارير HIPAA',
    tabHvac: 'HVAC والمعالجة التلقائية',
    tabMaintenance: 'اهتزاز ISO 10816 وصيانة IoT',
    tabSimulator: 'محاكي الحرارة والتهوية',
    tabAudit: 'سجل التدقيق الهندسي',
    kpiTwl: 'متوسط TWL للمصنع',
    kpiAch: 'معدل تبديل الهواء (ACH)',
    kpiVibration: 'أقصى اهتزاز للمحامل',
    kpiWorkOrders: 'أوامر عمل IoT لـ 72 ساعة',
    sectorVentTitle: 'تهوية القطاعات، تشغيل المخمدات وتحسين TWL',
    sectorVentDesc: 'تحكم مباشر بوحدات مناولة الهواء (AHU) ونقاط ضبط المبردات.',
    remediationQueueTitle: 'قائمة معالجة HVAC المغلقة',
    aggregateEnvTitle: 'القياس البيئي الإجمالي للمناطق',
    vibrationTelemetryTitle: 'قياس اهتزاز الآلات الدوارة ISO 10816',
    maintenanceQueueTitle: 'قائمة صيانة مستشعرات IoT خلال 72 ساعة',
    simulatorTitle: 'محاكي تبريد المرافق وتخفيف الحرارة',
    projectedThermalTitle: 'الأثر الحراري المتوقع',
    auditLogTitle: 'سجل التشغيل الهندسي والامتثال (للقراءة فقط)',
    damperMinus: '-10% مخمد',
    damperPlus: '+10% تعزيز التدفق',
    approveActuate: 'اعتماد وتشغيل',
    overrideBtn: 'تجاوز'
  },
  auditor: {
    title: 'هيئة الامتثال التنظيمي وتدقيق السلامة المهنية WSH',
    badge: 'تصريح المدقق',
    loggedInAs: 'مسجل الدخول باسم',
    primaryJurisdiction: 'الاختصاص الرئيسي:',
    exportDossierBtn: 'تصدير الملف التنظيمي',
    scopePermitted: 'نطاق المفتش: سجلات التدقيق المشفرة غير القابلة للتعديل، التحليلات الإجمالية (k ≥ 12) والملفات المعتمدة',
    scopeBlocked: 'فصل صارم للقراءة فقط: محظور من تشغيل التكييف، الإرسال الطبي، أو المؤشرات الفردية',
    tabLedger: 'دفتر التدقيق المشفر وإثباتات الخصوصية',
    tabAggregate: 'الامتثال الإجمالي والأنظمة القضائية',
    tabExports: 'الصادرات التنظيمية المعتمدة',
    kpiMomWsha: 'قانون WSHA السنغافوري',
    kpiKAnonymity: 'إخفاء الهوية k-Anonymity',
    kpiEpsilon: 'الخصوصية التفاضلية ε',
    kpiAuditChain: 'سلامة سلسلة التدقيق',
    ledgerTitle: 'سجل التدقيق التشفيري المقاوم للتلاعب',
    ledgerDesc: 'كتل تشفيرية مختومة بـ SHA-256 للتحقق من جميع التجاوزات وفترات الراحة.',
    liveHipaaEvents: 'أحداث الامتثال و HIPAA المباشرة',
    privacyProofTitle: 'البرهان الرياضي للخصوصية ومنع المراقبة',
    privacyProofDesc: 'ضمانات رياضية تمنع إعادة تحديد هوية العمال.',
    legalWarrantyTitle: 'الضمان القانوني للمدقق النظامي',
    aggregateComplianceTitle: 'امتثال المناطق الإجمالي (مخفي عند N < 12)',
    multiJurisdictionTitle: 'الأطر القانونية متعددة الاختصاصات للعمال',
    certifiedExportsTitle: 'صادرات ملفات التفتيش المعتمدة',
    certifiedExportsDesc: 'كل تصدير يتم إزالة هويته عبر HIPAA §164.514 وتوثيقه في سلسلة التدقيق.'
  },
  manager: {
    surveillanceCommand: 'قيادة المراقبة',
    monitoredPersonnel: 'الأفراد المراقبون',
    kalmanActive: 'مرشح كالمان نشط',
    roleView: 'عرض الدور:',
    safetyOfficer: 'مسؤول السلامة',
    maintenanceCrew: 'فريق الصيانة',
    opsLead: 'قائد العمليات',
    mute: 'كتم الصوت',
    alertsMuted: 'التنبيهات مكتومة',
    downloadCsv: 'تنزيل CSV',
    downloadPdfReport: 'تنزيل تقرير PDF',
    simulateKalman: 'محاكاة شذوذ كالمان',
    whatIfSimulator: 'محاكي الاحتمالات',
    ingestBenchmarks: 'استيراد البيانات والمعايير',
    reportsExport: 'التقارير والتصدير',
    signalVisibility: 'إظهار الإشارات:',
    cardiacSignals: 'الإشارات القلبية',
    environmentalSignals: 'الإشارات البيئية',
    performanceSignals: 'إشارات الأداء',
    historicalMovingAvg: 'المتوسط المتحرك التاريخي',
    resetFilters: 'إعادة ضبط المرشحات',
    configureSignals: 'ضبط الإشارات ←',
    execOverviewHeader: 'عمليات الصحة التنفيذية وحالة القياس عن بُعد',
    kpiActiveAnomalies: 'الحالات الشاذة النشطة',
    kpiWorkerCoverage: 'تغطية العمال',
    kpiEngineUptime: 'جاهزية المحرك',
    kpiSystemLatency: 'زمن الاستجابة',
    tabLive: 'المراقبة الحية',
    tabResources: 'توزيع الموارد',
    tabComplianceAudit: 'سجل تدقيق الامتثال',
    tabHipaaLog: 'سجل وصول HIPAA',
    tabPredictiveMaint: 'الصيانة التنبؤية',
    tabCorrelation: 'محرك الارتباط',
    tabWorkerDensity: 'كثافة العمال (D3)',
    tabPatternLibrary: 'مكتبة الأنماط'
  }
};

const HI: TranslationDictionary = {
  langSelector: {
    label: 'भाषा',
    placeholder: 'भाषा खोजें या चुनें...',
    noMatch: 'कोई मेल खाने वाली भाषा नहीं मिली',
    selectOneHint: 'एक समय में एक भाषा चुनें'
  },
  home: {
    brandSubtitle: 'बहु-संकेत कार्यबल स्वास्थ्य पूर्व-चेतावनी इंटेलिजेंस',
    adminGovernanceBadge: 'एडमिन-प्रबंधित भूमिका शासन',
    heroKicker: 'रियल-टाइम जनसंख्या एवं कार्यबल स्वास्थ्य इंटेलिजेंस',
    heroTitle: 'स्वास्थ्य खतरों के बढ़ने से पहले उन्हें रोकने के लिए विविध संकेतों को जोड़ें।',
    heroDescription:
      'हीट स्ट्रेस या शारीरिक थकान के शुरुआती लक्षण एक ही डेटाबेस में नहीं होते। प्रोग्नॉस्टिकेटर पहनने योग्य बायोमेट्रिक्स, पर्यावरणीय तापमान और शोर स्तर को मिलाकर सटीक पूर्व-चेतावनी प्रदान करता है।',
    card1Title: 'औद्योगिक निगरानी कमांड सेंटर',
    card1Desc: 'लाइव बायोमेट्रिक हीट मैप और 12-घंटे का पूर्वानुमान।',
    card2Title: 'एज बायोमेट्रिक और माइक्रोक्लाइमेट IoT',
    card2Desc: 'निरंतर HRV, त्वचा का तापमान और थर्मल वर्क लिमिट (TWL)।',
    signInTitle: 'एंटरप्राइज साइन इन',
    signUpTitle: 'एंटरप्राइज एक्सेस का अनुरोध करें',
    forgotTitle: 'सुरक्षा टोकन रीसेट करें',
    signInSubtitle: 'अधिकृत कार्यबल पहचान एवं एक्सेस कंसोल।',
    signUpSubtitle: 'भूमिका एवं क्लीयरेंस एडमिनिस्ट्रेटर द्वारा सत्यापित।',
    forgotSubtitle: 'कार्य ईमेल पर रिकवरी क्रेडेंशियल भेजें।',
    tabSignIn: 'साइन इन',
    tabSignUp: 'साइन अप',
    googleSsoBtn: 'Google Cloud SSO से साइन इन करें',
    orCredentials: 'या एंटरप्राइज क्रेडेंशियल',
    emailLabel: 'कॉर्पोरेट कार्य ईमेल',
    passwordLabel: 'पासवर्ड या SSO सुरक्षा कुंजी',
    rememberMe: 'वर्कस्टेशन याद रखें',
    forgotLink: 'पासवर्ड भूल गए?',
    signInSubmitBtn: 'निगरानी कंसोल में साइन इन करें',
    directoryHeader: 'भूमिका और लैंडिंग कंसोल के अनुसार त्वरित चयन:',
    roleDirectorBtn: 'सुरक्षा निदेशक (एडमिन)',
    roleClinicianBtn: 'व्यावसायिक स्वास्थ्य चिकित्सक',
    roleEngineerBtn: 'सुविधा इंजीनियर',
    roleAuditorBtn: 'WSH अनुपालन लेखा परीक्षक',
    roleWorkerBtn: 'फ्रंटलाइन श्रमिक',
    signupNoticeTitle: 'जीरो-ट्रस्ट एडमिन भूमिका शासन',
    signupNoticeDesc:
      'नए पंजीकरण स्तर 1 श्रमिक क्लीयरेंस से शुरू होते हैं जब तक कि सुरक्षा निदेशक RBAC कंसोल में उच्च भूमिका न दें।',
    fullNameLabel: 'पूर्ण कानूनी नाम',
    deptLabel: 'विभाग / परिचालन प्रभाग',
    confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
    signupSubmitBtn: 'एक्सेस अनुरोध और पंजीकरण करें',
    alreadyHaveAccount: 'पहले से खाता है?',
    forgotDesc: 'अपना कार्य ईमेल दर्ज करें। एक सुरक्षित रीसेट टोकन भेजा जाएगा।',
    resetSubmitBtn: 'पासवर्ड रीसेट लिंक भेजें',
    backToSignIn: '← साइन इन पर वापस जाएं',
    footerCopyright: '© 2026 प्रोग्नॉस्टिकेटर सिस्टम। सर्वाधिकार सुरक्षित।',
    footerTagline: 'भूमिका-शासित स्वास्थ्य पूर्व-चेतावनी आर्किटेक्चर',
    previewTitle: 'लाइव एज सिग्नल प्रीव्यू',
    previewDesc: 'साइन-इन से पहले कलमैन-स्मूथ्ड ताप और बायोमेट्रिक टेलीमेट्री',
    previewHeatIndex: 'ताप सूचकांक',
    previewMse: 'बेसलाइन MSE',
    previewPrivacy: 'प्राइवेसी शील्ड'
  },
  shell: {
    surveillanceActive: 'निगरानी सक्रिय:',
    roleTabDirector: 'कार्यकारी कमांड',
    roleTabClinician: 'चिकित्सा स्वास्थ्य',
    roleTabEngineer: 'सुविधा HVAC',
    roleTabAuditor: 'WSH ऑडिट',
    roleTabWorker: 'श्रमिक सुरक्षा शील्ड',
    strictRoleSeparation: 'सख्त भूमिका पृथक्करण',
    switchLabel: 'बदलें',
    rbacLabel: 'RBAC',
    statutesLabel: 'कानून',
    sovereignShield: 'संप्रभु गोपनीयता शील्ड',
    a11yLabel: 'सुगम्यता',
    logOut: 'लॉग आउट',
    adminPreviewTitle: 'एडमिन भूमिका ऑडिट पूर्वावलोकन:',
    adminPreviewViewing: 'इस भूमिका का लैंडिंग कंसोल देख रहे हैं:',
    returnToExec: 'कार्यकारी कमांड पर लौटें →',
    footerCopyright: '© 2026 प्रोग्नॉस्टिकेटर इंटेलिजेंस प्लेटफॉर्म',
    footerCertified: 'HIPAA शील्ड प्रमाणित',
    footerInvariants: 'दोहरी कार्यबल समानता · गैर-दंडात्मक टेलीमेट्री · k-Anonymity (N ≥ 12) एवं ε-DP (0.5)',
    loadingGateway: 'एंटरप्राइज़ प्रमाणीकरण गेटवे लोड हो रहा है...',
    loadingDirector: 'कार्यकारी कमांड कंसोल लोड हो रहा है...',
    loadingClinician: 'व्यावसायिक स्वास्थ्य एवं नैदानिक ट्रायज कंसोल लोड हो रहा है...',
    loadingEngineer: 'सुविधा इंजीनियरिंग एवं यांत्रिक विश्वसनीयता कंसोल लोड हो रहा है...',
    loadingAuditor: 'वैधानिक अनुपालन एवं WSH ऑडिट कंसोल लोड हो रहा है...',
    loadingWorker: 'संप्रभु निजी बायोमेट्रिक शील्ड लोड हो रही है...'
  },
  worker: {
    title: 'श्रमिक व्यक्तिगत बायोमेट्रिक एवं स्वास्थ्य रिकवरी टर्मिनल',
    zeroSurveillance: 'प्रबंधन द्वारा व्यक्तिगत निगरानी से पूर्ण सुरक्षा',
    privacyNotice:
      'आपका स्वास्थ्य डेटा गोपनीयता शील्ड (k-Anonymity N ≥ 12) द्वारा सुरक्षित है। कंपनी नीति और श्रम कानूनों के अनुसार इस आधार पर वेतन नहीं काटा जा सकता।',
    autonomicRecovery: 'शारीरिक रिकवरी एवं हृदय गति संतुलन',
    mildStrainNotice: 'भीषण गर्मी के कारण हल्का तनाव दर्ज किया गया है। कृपया समय पर पानी पिएं और छाया में आराम करें।',
    skinTemp: 'शरीर का तापमान एवं हीट लोड',
    skinTempNotice: 'सेक्टर 4 में अत्यधिक गर्मी के कारण त्वचा का तापमान बढ़ रहा है। शीतलन की आवश्यकता है।',
    sleepBufferTitle: 'नींद और थकान रिकवरी',
    sleepBufferNotice: 'रात की नींद डॉरमेट्री के सुरक्षित तापमान मानकों के अनुरूप रही।',
    hydrationCountdown: 'जल एवं इलेक्ट्रोलाइट सेवन काउंटडाउन',
    hydrationNotice: 'गंभीर गर्मी में हर 20 मिनट में कम से कम 250 मिलीलीटर पानी अथवा ओआरएस पिएं।',
    loggedToday: 'आज दर्ज:',
    portionsLabel: 'खुराक',
    logButton: '250 मिली पानी पिया गया दर्ज करें',
    cooldownTitle: 'छाया में त्वरित विश्राम का अनुरोध',
    cooldownDesc:
      'सिंगापुर MOM एवं खाड़ी MoHRE नियमों के तहत, चक्कर आने या अत्यधिक गर्मी लगने पर तुरंत छायादार स्थान पर आराम पाना आपका कानूनी अधिकार है।',
    cooldownHelper: 'नीचे क्लिक करने पर सुरक्षा अधिकारी को बिना किसी दंड के गुमनाम विश्राम अनुरोध भेजा जाएगा।',
    requestBreakBtn: 'तुरंत छाया में आराम का अनुरोध करें (बिना जुर्माने के)',
    breakDispatchedTitle: 'विश्राम अनुरोध स्वीकृत एवं प्रेषित',
    breakDispatchedDesc: 'चिकित्सा दल एवं वातानुकूलित हाइड्रेशन टेंट को सूचित कर दिया गया है। आप तुरंत विश्राम कर सकते हैं।',
    resumeShiftBtn: 'विश्राम पूर्ण • कार्य पर लौटें',
    statutoryNotice: 'सिंगापुर WSH अधिनियम एवं प्रवासी श्रमिक सुरक्षा कानूनों द्वारा संरक्षित।',
    loggedWorkerLabel: 'लॉगिन श्रमिक',
    ephemeralKeyActive: 'गोपनीय संप्रभु कुंजी सक्रिय',
    statutoryHeader: 'सक्रिय वैधानिक सुरक्षा',
    dormitoryHeader: 'आवास और शीतलन मानक',
    whistleblowerHeader: 'गैर-दंडात्मक शिकायत गारंटी',
    languageAccessLabel: 'पसंदीदा कंसोल भाषा',
    migrantPassBadge: 'प्रवासी कार्य पास धारक',
    hrvDeltaTag: '(आराम से -14%)',
    highStrainLabel: 'उच्च तनाव',
    nominalRecoveryLabel: 'सामान्य रिकवरी (68 ms)',
    skinDeltaTag: '(बढ़ा हुआ +0.9°C)',
    baselineTempLabel: 'आधारभूत 36.5°C',
    exhaustionTempLabel: 'थकावट सीमा >38.2°C',
    hoursUnit: 'घंटे',
    restorativeTag: '(पुनर्स्थापनात्मक)',
    sleepDeficitLabel: 'कमी (<5 घंटे)',
    sleepOptimalLabel: 'उत्तम (>7 घंटे)',
    twlSevereHeatBadge: 'TWL 115 W/m² (भीषण गर्मी)',
    hydrationConfirmedPrefix: 'छाया और हाइड्रेशन सहायता की पुष्टि की गई:',
    siteMedicalSafetyTeam: 'साइट मेडिकल एवं सुरक्षा दल',
    middayWorkBanPrefix: 'दोपहर कार्य प्रतिबंध सक्रिय:',
    wbgtRestCyclesPrefix: 'लाइव WBGT विश्राम चक्र:'
  },
  clinician: {
    title: 'व्यावसायिक स्वास्थ्य एवं नैदानिक ट्रायज केंद्र',
    badge: 'चिकित्सक MD कंसोल',
    loggedInAs: 'लॉगिन:',
    jurisdiction: 'अधिकार क्षेत्र:',
    hipaaGuarded: 'HIPAA §164.514 एवं GDPR अनुच्छेद 9 सुरक्षित',
    zeroDisciplinary: 'शून्य अनुशासनात्मक ट्रैकिंग',
    scopePermitted: 'अनुमत दायरा: शारीरिक ट्रायज, आपातकालीन चिकित्सा प्रेषण, समूह विश्लेषण, प्रमाणित रिपोर्ट एवं HIPAA ऑडिट लॉग',
    scopeBlocked: 'PBAC द्वारा अवरुद्ध: वैश्विक सीमा संपादन, HVAC संचालन, IoT रखरखाव, भूमिका एडमिन',
    tabTriage: 'नैदानिक ट्रायज एवं चिकित्सा प्रेषण',
    tabAnalytics: 'समग्र समूह विश्लेषण',
    tabSimulator: 'नैदानिक हीट स्ट्रेन सिम्युलेटर',
    tabAuditReports: 'ऑडिट लॉग एवं प्रमाणित रिपोर्ट',
    kpiHrv: 'समूह औसत HRV',
    kpiSkinTemp: 'त्वचा कोर तापमान',
    kpiMeanHr: 'औसत हृदय गति',
    kpiRehydration: 'ओआरएस कतार',
    triageQueueTitle: 'सक्रिय शारीरिक तनाव एवं निर्जलीकरण ट्रायज कतार',
    triageQueueDesc: 'हृदय तनाव और तापमान वृद्धि के आधार पर छद्मनामित नैदानिक संकेत।',
    markEvaluated: 'मूल्यांकित चिह्नित करें',
    dispatchLiaison: 'ओआरएस चिकित्सा दल भेजें',
    ansCorrelationTitle: 'स्वायत्त तंत्रिका तंत्र सहसंबंध (HRV बनाम HR)',
    ansCorrelationDesc: 'हृदय गति में वृद्धि और पैरासिम्पेथेटिक HRV गिरावट के बीच विपरीत संबंध।',
    ethicalBoundaryTitle: 'चिकित्सक नैतिक सीमा मानक',
    ethicalBoundaryDesc: 'HIPAA §164.514 के तहत सभी रिकॉर्ड गुमनाम हैं; पर्यवेक्षकों को केवल समग्र अलर्ट मिलते हैं।',
    cohortAnalyticsTitle: 'ज़ोन के अनुसार गुमनाम समूह स्वास्थ्य एवं ताप तनाव',
    cohortAnalyticsDesc: 'k-Anonymity (N ≥ 12) द्वारा सुरक्षित समग्र निगरानी।',
    simulatorTitle: 'नैदानिक ताप तनाव और हाइड्रेशन सिम्युलेटर',
    projectedOutcomeTitle: 'अनुमानित नैदानिक परिणाम',
    auditTrailTitle: 'HIPAA §164.312 नैदानिक एक्सेस ट्रेल',
    certifiedExportsTitle: 'प्रमाणित नैदानिक रिपोर्ट निर्यात',
    exportPdfBtn: 'स्वास्थ्य मेट्रिक्स ऑडिट PDF निर्यात करें',
    exportCsvBtn: 'समूह शारीरिक डेटा CSV निर्यात करें'
  },
  engineer: {
    title: 'सुविधा इंजीनियरिंग एवं यांत्रिक विश्वसनीयता कंसोल',
    badge: 'संचालन',
    loggedInAs: 'लॉगिन:',
    jurisdiction: 'अधिकार क्षेत्र:',
    chillerActive: 'स्मार्ट चिलर स्वचालन सक्रिय',
    bacnetConnected: 'BACnet / Modbus जुड़ा हुआ',
    scopePermitted: 'इंजीनियरिंग दायरा: HVAC व डैम्पर संचालन, ISO 10816 कंपन व IoT रखरखाव, थर्मल सिम्युलेटर व ऑडिट लॉग',
    scopeBlocked: 'PBAC द्वारा अवरुद्ध: श्रमिक बायोमेट्रिक्स, चिकित्सा प्रेषण, HIPAA निर्यात',
    tabHvac: 'HVAC और स्वचालित सुधार',
    tabMaintenance: 'ISO 10816 कंपन और IoT रखरखाव',
    tabSimulator: 'थर्मल और वेंटिलेशन सिम्युलेटर',
    tabAudit: 'इंजीनियरिंग ऑडिट लॉग',
    kpiTwl: 'संयंत्र औसत TWL',
    kpiAch: 'वायु परिवर्तन (ACH)',
    kpiVibration: 'अधिकतम बेयरिंग कंपन',
    kpiWorkOrders: '72-घंटे IoT कार्य आदेश',
    sectorVentTitle: 'सेक्टर वेंटिलेशन, डैम्पर संचालन एवं TWL अनुकूलन',
    sectorVentDesc: 'एयर हैंडलिंग यूनिट (AHU), चिलर और डैम्पर का सीधा नियंत्रण।',
    remediationQueueTitle: 'क्लोज्ड-लूप HVAC सुधार कतार',
    aggregateEnvTitle: 'समग्र ज़ोन पर्यावरणीय टेलीमेट्री',
    vibrationTelemetryTitle: 'ISO 10816 कंपन और मशीनरी टेलीमेट्री',
    maintenanceQueueTitle: '72-घंटे पूर्वानुमानित IoT सेंसर रखरखाव कतार',
    simulatorTitle: 'सुविधा HVAC और शीतलन शमन सिम्युलेटर',
    projectedThermalTitle: 'अनुमानित तापीय प्रभाव',
    auditLogTitle: 'इंजीनियरिंग संचालन और अनुपालन लॉग (केवल पढ़ने योग्य)',
    damperMinus: '-10% डैम्पर',
    damperPlus: '+10% वायु प्रवाह बढ़ाएं',
    approveActuate: 'स्वीकृत कर चालू करें',
    overrideBtn: 'ओवरराइड'
  },
  auditor: {
    title: 'वैधानिक विनियामक अनुपालन एवं WSH ऑडिट निरीक्षकालय',
    badge: 'ऑडिटर क्लीयरेंस',
    loggedInAs: 'लॉगिन:',
    primaryJurisdiction: 'प्राथमिक अधिकार क्षेत्र:',
    exportDossierBtn: 'विनियामक डोजियर निर्यात करें',
    scopePermitted: 'निरीक्षक दायरा: अपरिवर्तनीय क्रिप्टोग्राफिक ऑडिट ट्रेल, समग्र विश्लेषण (k ≥ 12) एवं प्रमाणित डोजियर',
    scopeBlocked: 'केवल पढ़ने योग्य अलगाव: HVAC संचालन, चिकित्सा प्रेषण व व्यक्तिगत बायोमेट्रिक्स प्रतिबंधित',
    tabLedger: 'क्रिप्टोग्राफिक ऑडिट लेजर एवं गोपनीयता प्रमाण',
    tabAggregate: 'समग्र अनुपालन एवं अधिकार क्षेत्र',
    tabExports: 'प्रमाणित विनियामक निर्यात',
    kpiMomWsha: 'सिंगापुर MOM WSHA',
    kpiKAnonymity: 'स्मॉल-सेल k-Anonymity',
    kpiEpsilon: 'ε-डिफरेंशियल प्राइवेसी',
    kpiAuditChain: 'ऑडिट चेन अखंडता',
    ledgerTitle: 'अपरिवर्तनीय SHA-256 क्रिप्टोग्राफिक ऑडिट लेजर',
    ledgerDesc: 'सभी ओवरराइड और विश्राम अवकाश को सत्यापित करने वाले SHA-256 ब्लॉक।',
    liveHipaaEvents: 'लाइव HIPAA और परिचालन अनुपालन घटनाएं',
    privacyProofTitle: 'स्मॉल-सेल गोपनीयता एवं निगरानी-रोधी प्रमाण',
    privacyProofDesc: 'व्यक्तिगत पहचान को रोकने की गणितीय गारंटी।',
    legalWarrantyTitle: 'वैधानिक ऑडिटर कानूनी वारंटी',
    aggregateComplianceTitle: 'समग्र सुविधा ज़ोन अनुपालन (N < 12 पर मास्क्ड)',
    multiJurisdictionTitle: 'बहु-अधिकार क्षेत्र श्रमिक वैधानिक ढांचे',
    certifiedExportsTitle: 'प्रमाणित निरीक्षण डोजियर निर्यात',
    certifiedExportsDesc: 'निरीक्षक कंसोल से प्रत्येक निर्यात HIPAA §164.514 के तहत गुमनाम है।'
  },
  manager: {
    surveillanceCommand: 'निगरानी कमांड',
    monitoredPersonnel: 'निगरानी में कर्मी',
    kalmanActive: 'कालमैन सक्रिय',
    roleView: 'भूमिका दृश्य:',
    safetyOfficer: 'सुरक्षा अधिकारी',
    maintenanceCrew: 'रखरखाव दल',
    opsLead: 'संचालन प्रमुख',
    mute: 'म्यूट करें',
    alertsMuted: 'अलर्ट म्यूट हैं',
    downloadCsv: 'CSV डाउनलोड',
    downloadPdfReport: 'PDF रिपोर्ट डाउनलोड',
    simulateKalman: 'कालमैन विसंगति सिम्युलेट करें',
    whatIfSimulator: 'व्हाट-इफ सिम्युलेटर',
    ingestBenchmarks: 'डेटा अपलोड और बेंचमार्क',
    reportsExport: 'रिपोर्ट और निर्यात',
    signalVisibility: 'सिग्नल दृश्यता:',
    cardiacSignals: 'हृदय संकेत',
    environmentalSignals: 'पर्यावरणीय संकेत',
    performanceSignals: 'प्रदर्शन संकेत',
    historicalMovingAvg: 'ऐतिहासिक मूविंग औसत',
    resetFilters: 'फ़िल्टर रीसेट करें',
    configureSignals: 'सिग्नल कॉन्फ़िगर करें →',
    execOverviewHeader: 'कार्यकारी स्वास्थ्य संचालन एवं टेलीमेट्री स्थिति',
    kpiActiveAnomalies: 'सक्रिय विसंगतियां',
    kpiWorkerCoverage: 'श्रमिक कवरेज',
    kpiEngineUptime: 'इंजन अपटाइम',
    kpiSystemLatency: 'सिस्टम विलंबता',
    tabLive: 'लाइव निगरानी',
    tabResources: 'संसाधन उपयोग',
    tabComplianceAudit: 'अनुपालन ऑडिट लॉग',
    tabHipaaLog: 'HIPAA एक्सेस लॉग',
    tabPredictiveMaint: 'पूर्वानुमानित रखरखाव',
    tabCorrelation: 'सहसंबंध इंजन',
    tabWorkerDensity: 'श्रमिक घनत्व (D3)',
    tabPatternLibrary: 'पैटर्न लाइब्रेरी'
  }
};

const ES: TranslationDictionary = {
  langSelector: {
    label: 'Idioma',
    placeholder: 'Buscar o seleccionar idioma...',
    noMatch: 'No se encontró ningún idioma coincidente',
    selectOneHint: 'Seleccione un idioma a la vez'
  },
  home: {
    brandSubtitle: 'Inteligencia de Alerta Temprana Multi-Señal para la Salud Laboral',
    adminGovernanceBadge: 'Gobernanza de Roles Administrada',
    heroKicker: 'Inteligencia de Salud Laboral y Poblacional en Tiempo Real',
    heroTitle: 'Sintetiza señales diversas para prevenir riesgos de salud antes de que escalen.',
    heroDescription:
      'Los primeros signos de estrés térmico o agotamiento rara vez están en una sola base de datos. Prognosticator une biometría portátil, telemetría ambiental y niveles acústicos en alertas tempranas explicables.',
    card1Title: 'Comando de Vigilancia Industrial',
    card1Desc: 'Mapas térmicos biométricos en vivo y pronóstico de anomalías a 12 horas.',
    card2Title: 'IoT Biométrico y Microclima en Borde',
    card2Desc: 'HRV continuo, temperatura cutánea y Límite Térmico de Trabajo (TWL).',
    signInTitle: 'Acceso Empresarial',
    signUpTitle: 'Solicitar Acceso Empresarial',
    forgotTitle: 'Restablecer Token de Seguridad',
    signInSubtitle: 'Identidad laboral autorizada y consola de acceso.',
    signUpSubtitle: 'Nivel de autorización verificado por el Administrador.',
    forgotSubtitle: 'Enviar credenciales de recuperación al correo laboral.',
    tabSignIn: 'Iniciar Sesión',
    tabSignUp: 'Registrarse',
    googleSsoBtn: 'Iniciar Sesión con Google Cloud SSO',
    orCredentials: 'O Credenciales Empresariales',
    emailLabel: 'Correo Electrónico Corporativo',
    passwordLabel: 'Contraseña o Clave SSO',
    rememberMe: 'Recordar estación de trabajo',
    forgotLink: '¿Olvidaste tu contraseña?',
    signInSubmitBtn: 'Ingresar a la Consola de Vigilancia',
    directoryHeader: 'Selección Rápida por Rol y Consola de Destino:',
    roleDirectorBtn: 'Directora de Seguridad (Admin)',
    roleClinicianBtn: 'Médico de Salud Ocupacional',
    roleEngineerBtn: 'Ingeniero de Instalaciones',
    roleAuditorBtn: 'Auditora de Cumplimiento WSH',
    roleWorkerBtn: 'Trabajador de Primera Línea',
    signupNoticeTitle: 'Gobernanza de Roles Zero-Trust',
    signupNoticeDesc:
      'Los nuevos registros comienzan con autorización de Trabajador Nivel 1 hasta que el Administrador asigne un rol superior en la consola RBAC.',
    fullNameLabel: 'Nombre Legal Completo',
    deptLabel: 'Departamento / División Operativa',
    confirmPasswordLabel: 'Confirmar Contraseña',
    signupSubmitBtn: 'Solicitar Acceso y Registrar Cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    forgotDesc: 'Ingresa tu correo laboral para recibir un token criptográfico de recuperación.',
    resetSubmitBtn: 'Enviar Enlace de Restablecimiento',
    backToSignIn: '← Volver a Iniciar Sesión',
    footerCopyright: '© 2026 Sistema Prognosticator. Todos los derechos reservados.',
    footerTagline: 'Arquitectura de Alerta Temprana Regida por Roles',
    previewTitle: 'Vista Previa de Señal Edge',
    previewDesc: 'Telemetría térmica y autonómica suavizada por Kalman antes de acceder',
    previewHeatIndex: 'Índice de Calor',
    previewMse: 'ECM Base',
    previewPrivacy: 'Escudo de Privacidad'
  },
  shell: {
    surveillanceActive: 'Vigilancia Activa:',
    roleTabDirector: 'Comando Ejecutivo',
    roleTabClinician: 'Salud Clínica',
    roleTabEngineer: 'HVAC Planta',
    roleTabAuditor: 'Auditoría WSH',
    roleTabWorker: 'Escudo Laboral',
    strictRoleSeparation: 'Separación Estricta de Roles',
    switchLabel: 'CAMBIAR',
    rbacLabel: 'RBAC',
    statutesLabel: 'Estatutos',
    sovereignShield: 'Escudo de Privacidad Soberana',
    a11yLabel: 'Accesibilidad',
    logOut: 'Cerrar Sesión',
    adminPreviewTitle: 'Vista Previa de Auditoría Admin:',
    adminPreviewViewing: 'Viendo la consola de inicio para',
    returnToExec: 'Volver al Comando Ejecutivo →',
    footerCopyright: '© 2026 Plataforma de Inteligencia Prognosticator',
    footerCertified: 'Certificado HIPAA Shield',
    footerInvariants: 'Equidad Dual · Telemetría No Punitiva · k-Anonimato (N ≥ 12) y ε-DP (0.5)',
    loadingGateway: 'Cargando Puerta de Autenticación Empresarial...',
    loadingDirector: 'Cargando Consola de Comando Ejecutivo...',
    loadingClinician: 'Cargando Consola de Salud Ocupacional y Triaje Clínico...',
    loadingEngineer: 'Cargando Consola de Ingeniería y Confiabilidad Mecánica...',
    loadingAuditor: 'Cargando Inspectoría de Cumplimiento Normativo y Auditoría WSH...',
    loadingWorker: 'Cargando escudo biométrico privado soberano...'
  },
  worker: {
    title: 'Terminal Privada Biométrica y de Recuperación del Trabajador',
    zeroSurveillance: 'Cero Vigilancia Gerencial',
    privacyNotice:
      'Su telemetría individual está protegida por el escudo de privacidad (k-Anonimato N ≥ 12). Según la ley, estos datos no pueden usarse para sanciones ni descuentos salariales.',
    autonomicRecovery: 'Recuperación Autonómica',
    mildStrainNotice: 'La variabilidad cardíaca muestra estrés cardiovascular leve por exposición térmica sostenida en el Sector 4.',
    skinTemp: 'Temperatura Cutánea y Carga Térmica',
    skinTempNotice: 'La temperatura de la piel está subiendo debido a la radiación ambiental. Acerque el enfriamiento.',
    sleepBufferTitle: 'Reserva de Sueño y Fatiga',
    sleepBufferNotice: 'El descanso nocturno en el dormitorio cumplió con los estándares térmicos.',
    hydrationCountdown: 'Cuenta Regresiva de Hidratación y Electrolitos',
    hydrationNotice: 'Objetivo mínimo: 250 ml de solución electrolítica cada 20 minutos bajo calor severo.',
    loggedToday: 'Registrado Hoy:',
    portionsLabel: 'porciones',
    logButton: 'Registrar 250ml Consumidos',
    cooldownTitle: 'Solicitud Autónoma de Pausa Térmica',
    cooldownDesc:
      'Bajo las normativas MOM y MoHRE, todo trabajador tiene el derecho legal incondicional a descansar a la sombra si siente mareos o agotamiento por calor.',
    cooldownHelper: 'Al hacer clic se envía una solicitud anónima y no punitiva de relevo al oficial de seguridad.',
    requestBreakBtn: 'Solicitar Enfriamiento Inmediato a la Sombra (Sin Sanción)',
    breakDispatchedTitle: 'Pausa de Enfriamiento Enviada',
    breakDispatchedDesc: 'Enlace médico y carpa de hidratación notificados. Puede detenerse de inmediato sin penalización.',
    resumeShiftBtn: 'Enfriamiento Completado • Reanudar Turno',
    statutoryNotice: 'Protegido por la Ley WSH de MOM y las regulaciones laborales de protección térmica.',
    loggedWorkerLabel: 'Trabajador Conectado',
    ephemeralKeyActive: 'Clave Soberana Efímera Activa',
    statutoryHeader: 'Protección Legal Activa',
    dormitoryHeader: 'Estándar de Dormitorio y Enfriamiento',
    whistleblowerHeader: 'Garantía de Denuncia No Punitiva',
    languageAccessLabel: 'Idioma de la Consola',
    migrantPassBadge: 'Titular de Pase Migrante',
    hrvDeltaTag: '(-14% desde reposo)',
    highStrainLabel: 'Carga Alta',
    nominalRecoveryLabel: 'Recuperación Nominal (68 ms)',
    skinDeltaTag: '(Elevada +0.9°C)',
    baselineTempLabel: 'Base 36.5°C',
    exhaustionTempLabel: 'Agotamiento >38.2°C',
    hoursUnit: 'hrs',
    restorativeTag: '(Reparador)',
    sleepDeficitLabel: 'Déficit (<5h)',
    sleepOptimalLabel: 'Óptimo (>7h)',
    twlSevereHeatBadge: 'TWL 115 W/m² (Calor Severo)',
    hydrationConfirmedPrefix: 'Soporte de hidratación y enfriamiento confirmado por',
    siteMedicalSafetyTeam: 'Equipo Médico y de Seguridad del Sitio',
    middayWorkBanPrefix: 'Prohibición de Trabajo al Mediodía Activa:',
    wbgtRestCyclesPrefix: 'Ciclos de Descanso WBGT en Vivo:'
  },
  clinician: {
    title: 'Centro de Salud Ocupacional y Triaje Clínico',
    badge: 'CONSOLA MÉDICA CLÍNICA',
    loggedInAs: 'Conectado como',
    jurisdiction: 'Jurisdicción:',
    hipaaGuarded: 'Protegido por HIPAA §164.514 y GDPR Art. 9',
    zeroDisciplinary: 'Cero Seguimiento Disciplinario',
    scopePermitted:
      'Alcance Clínico Permitido: Triaje Fisiológico, Despacho Médico, Analítica de Cohortes, Simulación Clínica, Reportes Certificados y Registros HIPAA',
    scopeBlocked: 'Bloqueado por PBAC: Umbrales Globales, Control HVAC, Mantenimiento IoT, Admin de Roles',
    tabTriage: 'Triaje Clínico y Despacho Médico',
    tabAnalytics: 'Analítica Agregada de Cohortes',
    tabSimulator: 'Simulador Clínico de Estrés Térmico',
    tabAuditReports: 'Registro de Auditoría y Reportes Certificados',
    kpiHrv: 'HRV Medio de Cohorte',
    kpiSkinTemp: 'Temperatura Cutánea',
    kpiMeanHr: 'Frecuencia Cardíaca Media',
    kpiRehydration: 'Cola de Rehidratación Oral',
    triageQueueTitle: 'Cola Activa de Triaje por Estrés y Deshidratación',
    triageQueueDesc: 'Alertas clínicas seudonimizadas priorizadas por estrés cardíaco y pico térmico.',
    markEvaluated: 'Marcar Evaluado',
    dispatchLiaison: 'Despachar Enlace de Rehidratación Oral',
    ansCorrelationTitle: 'Correlación del Sistema Nervioso Autónomo (HRV vs FC)',
    ansCorrelationDesc: 'Relación inversa entre el aumento del ritmo cardíaco y la supresión de HRV.',
    ethicalBoundaryTitle: 'Estándar Ético Médico',
    ethicalBoundaryDesc: 'Todos los registros están desidentificados según HIPAA §164.514 y GDPR Artículo 9.',
    cohortAnalyticsTitle: 'Salud de Cohorte Desidentificada por Zona',
    cohortAnalyticsDesc: 'Vigilancia epidemiológica protegida por k-Anonimato (N ≥ 12).',
    simulatorTitle: 'Simulador Clínico de Estrés Térmico e Hidratación',
    projectedOutcomeTitle: 'Resultado Clínico Proyectado',
    auditTrailTitle: 'Registro de Acceso Clínico HIPAA §164.312',
    certifiedExportsTitle: 'Exportación de Reportes Clínicos Certificados',
    exportPdfBtn: 'Exportar PDF de Auditoría de Salud',
    exportCsvBtn: 'Exportar CSV Fisiológico de Cohorte'
  },
  engineer: {
    title: 'Consola de Ingeniería de Instalaciones y Confiabilidad Mecánica',
    badge: 'OPERACIONES',
    loggedInAs: 'Conectado como',
    jurisdiction: 'Jurisdicción:',
    chillerActive: 'Automatización Inteligente de Chiller Activa',
    bacnetConnected: 'BACnet / Modbus Conectado',
    scopePermitted:
      'Alcance de Ingeniería: Control de HVAC y Compuertas, Vibración ISO 10816, Mantenimiento IoT, Simulador Térmico y Registro',
    scopeBlocked: 'Bloqueado por PBAC: Biometría Laboral, Despacho Médico, Exportación HIPAA, Umbrales Globales',
    tabHvac: 'HVAC y Remediación Automatizada',
    tabMaintenance: 'Vibración ISO 10816 y Mantenimiento IoT',
    tabSimulator: 'Simulador Térmico y Ventilación',
    tabAudit: 'Registro de Auditoría de Ingeniería',
    kpiTwl: 'TWL Medio de Planta',
    kpiAch: 'Cambios de Aire (ACH)',
    kpiVibration: 'Vibración Máxima de Rodamiento',
    kpiWorkOrders: 'Órdenes IoT 72h',
    sectorVentTitle: 'Ventilación de Sector, Compuertas y Optimización TWL',
    sectorVentDesc: 'Control directo de unidades manejadoras de aire (AHU), chillers y compuertas.',
    remediationQueueTitle: 'Cola de Remediación HVAC en Bucle Cerrado',
    aggregateEnvTitle: 'Telemetría Ambiental Agregada por Zona',
    vibrationTelemetryTitle: 'Telemetría de Vibración ISO 10816 y Maquinaria',
    maintenanceQueueTitle: 'Cola Predictiva de Sensores IoT a 72 Horas',
    simulatorTitle: 'Simulador de Mitigación Térmica y HVAC',
    projectedThermalTitle: 'Impacto Térmico Proyectado',
    auditLogTitle: 'Registro de Actuación e Ingeniería (Solo Lectura)',
    damperMinus: '-10% Compuerta',
    damperPlus: '+10% Flujo de Aire',
    approveActuate: 'Aprobar y Actuar',
    overrideBtn: 'Anular'
  },
  auditor: {
    title: 'Inspectoría de Cumplimiento Normativo y Auditoría WSH',
    badge: 'AUTORIZACIÓN DE AUDITOR',
    loggedInAs: 'Conectado como',
    primaryJurisdiction: 'Jurisdicción Principal:',
    exportDossierBtn: 'Exportar Dossier Regulatorio',
    scopePermitted:
      'Alcance de Inspector: Registros Criptográficos Inmutables, Analítica Agregada (k ≥ 12) y Dossiers Certificados',
    scopeBlocked: 'Separación Estricta de Solo Lectura: Bloqueado de HVAC, Despacho Médico y Biometría Cruda',
    tabLedger: 'Libro Mayor Criptográfico y Pruebas de Privacidad',
    tabAggregate: 'Cumplimiento Agregado y Jurisdicciones',
    tabExports: 'Exportaciones Regulatorias Certificadas',
    kpiMomWsha: 'MOM WSHA Singapur',
    kpiKAnonymity: 'k-Anonimato de Celda Pequeña',
    kpiEpsilon: 'Privacidad Diferencial ε',
    kpiAuditChain: 'Integridad de la Cadena',
    ledgerTitle: 'Libro Mayor Criptográfico Inmutable a Prueba de Manipulaciones',
    ledgerDesc: 'Bloques sellados con hashes SHA-256 que verifican anulaciones y pausas térmicas.',
    liveHipaaEvents: 'Eventos HIPAA y Cumplimiento en Vivo',
    privacyProofTitle: 'Prueba Matemática de Privacidad y Anti-Vigilancia',
    privacyProofDesc: 'Garantías que impiden la reidentificación individual.',
    legalWarrantyTitle: 'Garantía Legal del Auditor Estatutario',
    aggregateComplianceTitle: 'Cumplimiento Agregado por Zona (Oculto en N < 12)',
    multiJurisdictionTitle: 'Marcos Legales Multi-Jurisdicción para Fuerza Laboral',
    certifiedExportsTitle: 'Exportaciones de Dossiers de Inspección Certificados',
    certifiedExportsDesc: 'Cada exportación se desidentifica bajo HIPAA §164.514 y se registra en la cadena.'
  },
  manager: {
    surveillanceCommand: 'Comando de Vigilancia',
    monitoredPersonnel: 'Personal Monitoreado',
    kalmanActive: 'Kalman Activo',
    roleView: 'Vista de Rol:',
    safetyOfficer: 'Oficial de Seguridad',
    maintenanceCrew: 'Equipo de Mantenimiento',
    opsLead: 'Líder de Operaciones',
    mute: 'Silenciar',
    alertsMuted: 'Alertas Silenciadas',
    downloadCsv: 'Descargar CSV',
    downloadPdfReport: 'Descargar Informe PDF',
    simulateKalman: 'Simular Anomalía Kalman',
    whatIfSimulator: 'Simulador What-If',
    ingestBenchmarks: 'Ingesta y Benchmarks',
    reportsExport: 'Reportes y Exportación',
    signalVisibility: 'Visibilidad de Señales:',
    cardiacSignals: 'Señales Cardíacas',
    environmentalSignals: 'Señales Ambientales',
    performanceSignals: 'Señales de Rendimiento',
    historicalMovingAvg: 'Media Móvil Histórica',
    resetFilters: 'Restablecer Filtros',
    configureSignals: 'Configurar Señales →',
    execOverviewHeader: 'Estado de Operaciones de Salud y Telemetría',
    kpiActiveAnomalies: 'Anomalías Activas',
    kpiWorkerCoverage: 'Cobertura Laboral',
    kpiEngineUptime: 'Disponibilidad del Motor',
    kpiSystemLatency: 'Latencia del Sistema',
    tabLive: 'Vigilancia en Vivo',
    tabResources: 'Uso de Recursos',
    tabComplianceAudit: 'Registro de Auditoría',
    tabHipaaLog: 'Registro Acceso HIPAA',
    tabPredictiveMaint: 'Mantenimiento Predictivo',
    tabCorrelation: 'Motor de Correlación',
    tabWorkerDensity: 'Densidad Laboral (D3)',
    tabPatternLibrary: 'Biblioteca de Patrones'
  }
};

export const TRANSLATION_BUNDLES: Record<SupportedLanguage, TranslationDictionary> = {
  en: EN,
  bn: BN,
  ta: TA,
  zh: ZH,
  tl: TL,
  ar: AR,
  hi: HI,
  es: ES
};

const STORAGE_KEY_LANG = 'prognosticator_active_language';
const LANG_EVENT_NAME = 'prognosticator_language_changed';

class I18nService {
  private currentLanguage: SupportedLanguage = 'en';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_LANG) as SupportedLanguage | null;
      if (saved && TRANSLATION_BUNDLES[saved]) {
        this.currentLanguage = saved;
      }
      this.applyDocumentOptimizations(this.currentLanguage);
    }
  }

  private applyDocumentOptimizations(lang: SupportedLanguage): void {
    if (typeof document === 'undefined') return;
    const opt = LANGUAGE_OPTIONS.find((o) => o.code === lang) || LANGUAGE_OPTIONS[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = opt.direction;
    document.documentElement.setAttribute('data-lang', lang);
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getLanguageOption(lang?: SupportedLanguage): LanguageOption {
    const code = lang || this.currentLanguage;
    return LANGUAGE_OPTIONS.find((o) => o.code === code) || LANGUAGE_OPTIONS[0];
  }

  public getAllLanguages(): LanguageOption[] {
    return LANGUAGE_OPTIONS;
  }

  public setLanguage(lang: SupportedLanguage): SupportedLanguage {
    if (!TRANSLATION_BUNDLES[lang]) {
      return this.currentLanguage;
    }
    this.currentLanguage = lang;
    this.applyDocumentOptimizations(lang);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_LANG, lang);
        window.dispatchEvent(new CustomEvent(LANG_EVENT_NAME, { detail: { lang } }));
      } catch (e) {
        console.error('Failed to persist language:', e);
      }
    }
    return this.currentLanguage;
  }

  public getTranslations(lang?: SupportedLanguage): TranslationDictionary {
    const code = lang || this.currentLanguage;
    return TRANSLATION_BUNDLES[code] || EN;
  }

  public subscribe(callback: (lang: SupportedLanguage) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      callback(custom.detail?.lang || this.currentLanguage);
    };
    window.addEventListener(LANG_EVENT_NAME, handler);
    return () => window.removeEventListener(LANG_EVENT_NAME, handler);
  }
}

export const i18nService = new I18nService();

export function useTranslation() {
  const [lang, setLangState] = useState<SupportedLanguage>(() => i18nService.getLanguage());

  useEffect(() => {
    return i18nService.subscribe((nextLang) => {
      setLangState(nextLang);
    });
  }, []);

  const setLanguage = (next: SupportedLanguage) => {
    i18nService.setLanguage(next);
  };

  return {
    lang,
    langOption: i18nService.getLanguageOption(lang),
    setLanguage,
    t: i18nService.getTranslations(lang),
    languages: LANGUAGE_OPTIONS
  };
}

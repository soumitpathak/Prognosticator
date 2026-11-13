import {
  ComplianceAuditEvent,
  ComplianceSummaryMetrics,
  ComplianceAccessAction,
  ComplianceReportType,
  ComplianceStatus
} from '../types';

export const INITIAL_COMPLIANCE_AUDIT_LOGS: ComplianceAuditEvent[] = [
  {
    id: 'HIPAA-TRC-9842-SEC',
    timestamp: '2026-11-06T15:18:22.408Z',
    accessorId: 'USR-MGR-419',
    accessorName: 'Dr. Evelyn Vance, MD',
    accessorRole: 'Chief Occupational Medical Officer',
    department: 'Occupational Health & Clinical Hygiene',
    reportName: 'Continuous ECG & Autonomic Cardiac Strain Dossier (Worker W-9921)',
    reportType: 'WORKER_HEALTH_PHI',
    accessAction: 'DECRYPTED_PHI',
    hipaaClassification: 'HIPAA §164.312(a)(2)(iv) Decryption of Protected EPHI',
    privacyShieldMetric: {
      epsilonConsumed: 0.45,
      kAnonymityCount: 14,
      laplaceNoiseBudgetRemaining: 2.15,
      status: 'COMPLIANT_AUTHORIZED'
    },
    dataSubjectCount: 1,
    justification: 'Emergency clinical response protocol for acute autonomic deceleration (HRV 31ms, skin temp 38.4°C) during heat dome alert.',
    ipAddress: '10.240.12.84',
    terminalId: 'CLINIC-WS-02',
    cryptographicHash: 'a7f34c90b638b97321e0fc49c819ea2387123984128fba48937bc901aef48112'
  },
  {
    id: 'HIPAA-TRC-9835-AUD',
    timestamp: '2026-11-06T14:45:10.190Z',
    accessorId: 'USR-EHS-202',
    accessorName: 'Safety Director (CSP)',
    accessorRole: 'EHS Safety Director',
    department: 'Environmental Health & Safety',
    reportName: 'Outdoor Sector 4 Heat Strain & Thermal Work Limit (TWL) Executive Summary',
    reportType: 'EXECUTIVE_SAFETY_REPORT',
    accessAction: 'EXPORTED_PDF',
    hipaaClassification: 'HIPAA §164.312(b) Audit Controls & De-identified Population Aggregates',
    privacyShieldMetric: {
      epsilonConsumed: 0.12,
      kAnonymityCount: 38,
      laplaceNoiseBudgetRemaining: 2.60,
      status: 'COMPLIANT_AUTHORIZED'
    },
    dataSubjectCount: 38,
    justification: 'Daily OSHA Heat Illness Prevention regulatory filing and shift rotation adjustment.',
    ipAddress: '10.240.8.14',
    terminalId: 'OPS-MGR-TERMINAL-1',
    cryptographicHash: 'f420cb881938b871923ac341a99812739102938472910fae83917412abef091a'
  },
  {
    id: 'HIPAA-TRC-9828-PRV',
    timestamp: '2026-11-06T14:12:04.882Z',
    accessorId: 'SYS-AUTOPILOT-01',
    accessorName: 'Prognosticator Core AI Engine',
    accessorRole: 'Autonomous LSTM-Kalman Stream Processor',
    department: 'Autonomous Telemetry Core',
    reportName: 'Subgrade Tunnel Conduit 7 Multi-Signal Biometric Cluster',
    reportType: 'BIOMETRIC_TELEMETRY',
    accessAction: 'VIEWED_STREAM',
    hipaaClassification: 'HIPAA §164.514(b) De-identification via Laplace Differential Privacy',
    privacyShieldMetric: {
      epsilonConsumed: 0.05,
      kAnonymityCount: 22,
      laplaceNoiseBudgetRemaining: 2.72,
      status: 'COMPLIANT_AUTHORIZED'
    },
    dataSubjectCount: 22,
    justification: 'Automated Kalman noise filtration and anomaly detection pipeline execution.',
    ipAddress: '127.0.0.1 (Loopback Gateway)',
    terminalId: 'IOT-CORE-CLUSTER-0',
    cryptographicHash: '992819adfcbe8173491823abce09182390184712893810293847aefbc0192837'
  },
  {
    id: 'HIPAA-TRC-9819-WRN',
    timestamp: '2026-11-06T13:30:45.311Z',
    accessorId: 'USR-EXT-AUD-09',
    accessorName: 'Brenda Miller, CIA',
    accessorRole: 'Third-Party Compliance Auditor',
    department: 'External Risk & Compliance Advisory',
    reportName: 'Manufacturing Assembly Line B Full Biometric Raw Log CSV',
    reportType: 'WORKER_HEALTH_PHI',
    accessAction: 'EXPORTED_CSV',
    hipaaClassification: 'HIPAA §164.502(b) Minimum Necessary Standard Evaluation',
    privacyShieldMetric: {
      epsilonConsumed: 0.50,
      kAnonymityCount: 12,
      laplaceNoiseBudgetRemaining: 2.77,
      status: 'FLAGGED_ANOMALOUS_ACCESS'
    },
    dataSubjectCount: 64,
    justification: 'Quarterly ISO 45001 occupational safety audit sampling; cohort requested without full redaction mask.',
    ipAddress: '192.168.100.45',
    terminalId: 'REMOTE-VPN-AUDITOR-3',
    cryptographicHash: 'bb412093847291028374aefbc901928347102938471928374019283749102938',
    flaggedReason: 'Large raw export requested from external VPN session. Flagged for secondary dual-key authorization.'
  },
  {
    id: 'HIPAA-TRC-9810-OVR',
    timestamp: '2026-11-06T12:05:18.990Z',
    accessorId: 'USR-MGR-419',
    accessorName: 'Dr. Evelyn Vance, MD',
    accessorRole: 'Chief Occupational Medical Officer',
    department: 'Occupational Health & Clinical Hygiene',
    reportName: 'Kalman Filter Cutoff & Sensor Heart Rate Alert Thresholds',
    reportType: 'ANOMALY_FORECAST_EXPORT',
    accessAction: 'OVERRODE_ALGORITHM_THRESHOLD',
    hipaaClassification: 'HIPAA §164.308(a)(1)(ii)(D) Information System Activity Review',
    privacyShieldMetric: {
      epsilonConsumed: 0.08,
      kAnonymityCount: 50,
      laplaceNoiseBudgetRemaining: 3.27,
      status: 'ELEVATED_PRIVILEGE'
    },
    dataSubjectCount: 50,
    justification: 'Temporarily lowered maximum heart rate cutoff from 120 bpm to 110 bpm due to wet-bulb temperature advisory.',
    ipAddress: '10.240.12.84',
    terminalId: 'CLINIC-WS-02',
    cryptographicHash: 'c091823746192837491029384719283749102938471928374910293847192837'
  },
  {
    id: 'HIPAA-TRC-9804-BLK',
    timestamp: '2026-11-06T10:14:30.012Z',
    accessorId: 'USR-SUP-882',
    accessorName: 'Dave Kowalski',
    accessorRole: 'Junior Shift Dispatcher',
    department: 'Logistics Operations',
    reportName: 'Raw Sleep Deficit & Heart Rate Variability Wearable Sync Stream',
    reportType: 'WORKER_HEALTH_PHI',
    accessAction: 'DECRYPTED_PHI',
    hipaaClassification: 'HIPAA §164.312(a)(1) Access Control Role-Based Authorization Failure',
    privacyShieldMetric: {
      epsilonConsumed: 0.00,
      kAnonymityCount: 1,
      laplaceNoiseBudgetRemaining: 3.35,
      status: 'BLOCKED_UNAUTHORIZED'
    },
    dataSubjectCount: 1,
    justification: 'Dispatcher attempted to view individual worker sleep log without clinical role privilege.',
    ipAddress: '10.240.33.19',
    terminalId: 'DISPATCH-DESK-4',
    cryptographicHash: '0192837461928374910293847192837491029384719283749102938471928374',
    flaggedReason: 'Unauthorized role access attempt. Automatic denial enforced by Privacy Shield RBAC.'
  },
  {
    id: 'HIPAA-TRC-9799-CNS',
    timestamp: '2026-11-06T09:00:15.540Z',
    accessorId: 'USR-HR-101',
    accessorName: 'Patricia Morales',
    accessorRole: 'Workforce Privacy Compliance Officer',
    department: 'Human Resources & Employee Relations',
    reportName: 'Wearable Biometric Continuous Consent Ledger & Opt-In Registry',
    reportType: 'POPULATION_HEALTH_EPIDEMIOLOGY',
    accessAction: 'CONSENT_AUDITED',
    hipaaClassification: 'HIPAA §164.508 Worker Consent & Voluntary Health Authorization',
    privacyShieldMetric: {
      epsilonConsumed: 0.02,
      kAnonymityCount: 142,
      laplaceNoiseBudgetRemaining: 3.35,
      status: 'COMPLIANT_AUTHORIZED'
    },
    dataSubjectCount: 142,
    justification: 'Routine bi-weekly verification that 100% of shift workers have active, unrevoked consent for telemetry tracking.',
    ipAddress: '10.240.5.21',
    terminalId: 'HR-COMPLIANCE-01',
    cryptographicHash: 'ee09182374619283749102938471928374910293847192837491029384719283'
  }
];

class SystemComplianceManager {
  private events: ComplianceAuditEvent[] = [...INITIAL_COMPLIANCE_AUDIT_LOGS];
  private listeners: Set<() => void> = new Set();

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getEvents(): ComplianceAuditEvent[] {
    return [...this.events];
  }

  public logEvent(event: Omit<ComplianceAuditEvent, 'id' | 'timestamp' | 'cryptographicHash'>): ComplianceAuditEvent {
    const id = `HIPAA-TRC-${Math.floor(1000 + Math.random() * 9000)}-${event.privacyShieldMetric.status.slice(0, 3)}`;
    const timestamp = new Date().toISOString();
    
    // Generate pseudo SHA-256 seal
    const rawString = `${id}|${timestamp}|${event.accessorId}|${event.reportName}|${event.privacyShieldMetric.status}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }
    const cryptographicHash = Math.abs(hash).toString(16).padStart(16, '0') + '7a9c8b01de23f45a89201bc4';

    const fullEvent: ComplianceAuditEvent = {
      ...event,
      id,
      timestamp,
      cryptographicHash
    };

    this.events = [fullEvent, ...this.events];
    this.notify();
    return fullEvent;
  }

  public getSummaryMetrics(): ComplianceSummaryMetrics {
    const total = this.events.length;
    const compliant = this.events.filter((e) => e.privacyShieldMetric.status === 'COMPLIANT_AUTHORIZED' || e.privacyShieldMetric.status === 'ELEVATED_PRIVILEGE').length;
    const flagged = this.events.filter((e) => e.privacyShieldMetric.status === 'FLAGGED_ANOMALOUS_ACCESS').length;
    const blocked = this.events.filter((e) => e.privacyShieldMetric.status === 'BLOCKED_UNAUTHORIZED').length;
    const accessors = new Set(this.events.map((e) => e.accessorId)).size;
    const totalEpsilon = Number(this.events.reduce((acc, curr) => acc + curr.privacyShieldMetric.epsilonConsumed, 0).toFixed(2));
    const avgK = Math.round(this.events.reduce((acc, curr) => acc + curr.privacyShieldMetric.kAnonymityCount, 0) / (total || 1));

    return {
      totalEvents24h: total,
      complianceRatePct: total > 0 ? Number(((compliant / total) * 100).toFixed(1)) : 100,
      activeAccessorsCount: accessors,
      totalEpsilonExpended: totalEpsilon,
      flaggedCount: flagged,
      blockedCount: blocked,
      averageKAnonymity: avgK
    };
  }

  public exportAuditLogsAsCsv(customEvents?: ComplianceAuditEvent[], filenameSuffix?: string): void {
    const targetEvents = customEvents || this.events;
    const headers = [
      'Audit_ID',
      'Timestamp_UTC',
      'Accessor_ID',
      'Accessor_Name',
      'Accessor_Role',
      'Department',
      'Report_Name',
      'Report_Type',
      'Action_Taken',
      'HIPAA_Classification',
      'Compliance_Status',
      'Epsilon_Consumed',
      'K_Anonymity',
      'Justification',
      'IP_Address',
      'Cryptographic_Hash'
    ];

    const rows = targetEvents.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.accessorId}"`,
      `"${e.accessorName.replace(/"/g, '""')}"`,
      `"${e.accessorRole}"`,
      `"${e.department}"`,
      `"${e.reportName.replace(/"/g, '""')}"`,
      `"${e.reportType}"`,
      `"${e.accessAction}"`,
      `"${e.hipaaClassification.replace(/"/g, '""')}"`,
      `"${e.privacyShieldMetric.status}"`,
      e.privacyShieldMetric.epsilonConsumed,
      e.privacyShieldMetric.kAnonymityCount,
      `"${e.justification.replace(/"/g, '""')}"`,
      `"${e.ipAddress}"`,
      `"${e.cryptographicHash}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const suffix = filenameSuffix ? `_${filenameSuffix}` : '';
    link.setAttribute('download', `HIPAA_Compliance_Audit_Log${suffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public exportAuditLogsAsJson(): void {
    const payload = {
      meta: {
        platform: 'Prognosticator Enterprise Workforce Intelligence',
        module: 'System Compliance Audit Service',
        standard: 'HIPAA Security Rule §164.312(b) & Privacy Rule §164.514',
        generatedAt: new Date().toISOString(),
        summary: this.getSummaryMetrics()
      },
      auditRecords: this.events
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HIPAA_Compliance_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const systemComplianceService = new SystemComplianceManager();

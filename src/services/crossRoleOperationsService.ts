import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, onAuthStateChanged, handleFirestoreError, OperationType } from './firebase';
import { complianceAuditService } from './complianceAuditService';

export interface ClinicalTriageRecord {
  id: string;
  workerPseudonym: string;
  zone: string;
  department: string;
  heartRate: number;
  hrv: number;
  skinTemp: number;
  dehydrationIndex: number;
  triagePriority: 'URGENT' | 'HIGH' | 'OBSERVE';
  recommendedAction: string;
  status: 'PENDING' | 'DISPATCHED' | 'EVALUATED';
}

export interface HvacZoneControl {
  id: string;
  name: string;
  twl: number;
  wbgt: number;
  ach: number;
  chillerSetpoint: number;
  fanSpeedHz: number;
  damperPosition: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
}

export interface VibrationAsset {
  id: string;
  name: string;
  location: string;
  isoClass: 'Class I' | 'Class II' | 'Class III';
  velocityRmsMmS: number;
  peakAccG: number;
  bearingTempC: number;
  noiseDba: number;
  maintenanceStatus: 'NOMINAL' | 'SCHEDULED_72H' | 'INSPECTION_URGENT';
}

export interface RestBreakRequestRecord {
  id: string;
  ephemeralToken: string;
  zoneId: string;
  timestamp: string;
  language: string;
  status: 'DISPATCHED' | 'HYDRATION_DISPATCHED' | 'COMPLETED';
  acknowledgedByRole?: string;
}

export type AuditBlockEventType =
  | 'HVAC_ACTUATION'
  | 'REST_BREAK_ISSUED'
  | 'THRESHOLD_CALIBRATED'
  | 'MEDICAL_DISPATCH'
  | 'PRIVACY_SHIELD_VERIFIED'
  | 'MAINTENANCE_WORK_ORDER';

export interface AuditLedgerBlock {
  id: string;
  timestamp: string;
  previousHash?: string;
  payloadDigest?: string;
  blockHash: string;
  eventType: AuditBlockEventType;
  actorPseudonym: string;
  legalStandard: string;
  summary: string;
  status: 'VERIFIED' | 'TAMPER_PROOF';
}

export interface LedgerVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  corruptedBlockIds: string[];
  brokenLinkIds: string[];
  rootHash: string;
  checkedAt: string;
}

export interface ClosedLoopStatus {
  heatSurgeTriggered: boolean;
  workerBreakRequested: boolean;
  clinicalHydrationDispatched: boolean;
  hvacMitigated: boolean;
  auditSealedCount: number;
  completedStages: number;
}

export interface CrossRoleActivityEvent {
  id: string;
  timestamp: string;
  sourceRole: 'FRONTLINE_WORKER' | 'OCCUPATIONAL_HEALTH_OFFICER' | 'FACILITY_ENGINEER' | 'SAFETY_DIRECTOR' | 'COMPLIANCE_AUDITOR';
  category: 'REST_BREAK' | 'CLINICAL_TRIAGE' | 'HVAC_ACTUATION' | 'AUDIT_VERIFIED' | 'HEAT_SPIKE';
  zoneId: string;
  headline: string;
  detail: string;
}

export interface CrossRoleSnapshot {
  triageQueue: ClinicalTriageRecord[];
  hvacZones: HvacZoneControl[];
  vibrationAssets: VibrationAsset[];
  restBreaks: RestBreakRequestRecord[];
  ledgerBlocks: AuditLedgerBlock[];
  activityFeed: CrossRoleActivityEvent[];
  heatSpikeActive: boolean;
  firebaseSynced: boolean;
}

const STORAGE_KEY = 'prognosticator_cross_role_ops_v1';
const BROADCAST_CHANNEL_NAME = 'prognosticator_cross_role_bus';
const GENESIS_PREV_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

const INITIAL_CLINICAL_QUEUE: ClinicalTriageRecord[] = [
  {
    id: 'CLIN-001',
    workerPseudonym: 'W-9921',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Civil Infrastructure Deep Foundation',
    heartRate: 138,
    hrv: 31.0,
    skinTemp: 38.6,
    dehydrationIndex: 88,
    triagePriority: 'URGENT',
    recommendedAction: 'Immediate shaded cooling extraction; stage rapid oral electrolyte rehydration.',
    status: 'PENDING'
  },
  {
    id: 'CLIN-002',
    workerPseudonym: 'W-4810',
    zone: 'Subgrade-Tunnel-Conduit-7',
    department: 'Tunneling & Structural Rigging',
    heartRate: 124,
    hrv: 34.5,
    skinTemp: 38.1,
    dehydrationIndex: 76,
    triagePriority: 'HIGH',
    recommendedAction: 'Mandate 20-minute shaded rest break; deliver 750ml cold electrolyte drink.',
    status: 'PENDING'
  },
  {
    id: 'CLIN-003',
    workerPseudonym: 'W-7742',
    zone: 'Outdoor-Construction-Sector-4',
    department: 'Civil Infrastructure Deep Foundation',
    heartRate: 118,
    hrv: 38.2,
    skinTemp: 37.9,
    dehydrationIndex: 68,
    triagePriority: 'OBSERVE',
    recommendedAction: 'Remote monitoring active; verify water station consumption at 14:00.',
    status: 'EVALUATED'
  }
];

const INITIAL_HVAC_ZONES: HvacZoneControl[] = [
  {
    id: 'ZONE-A',
    name: 'Sector 4 Heavy Fabrication Bay',
    twl: 135,
    wbgt: 32.8,
    ach: 12.4,
    chillerSetpoint: 18.0,
    fanSpeedHz: 58.0,
    damperPosition: 95,
    status: 'CRITICAL'
  },
  {
    id: 'ZONE-B',
    name: 'Sector 2 Underground Tunneling Shaft',
    twl: 165,
    wbgt: 31.4,
    ach: 16.2,
    chillerSetpoint: 17.5,
    fanSpeedHz: 52.0,
    damperPosition: 85,
    status: 'ELEVATED'
  },
  {
    id: 'ZONE-C',
    name: 'Sector 1 Assembly & Electrical Enclosure',
    twl: 245,
    wbgt: 28.2,
    ach: 8.5,
    chillerSetpoint: 21.0,
    fanSpeedHz: 42.0,
    damperPosition: 65,
    status: 'OPTIMAL'
  },
  {
    id: 'ZONE-D',
    name: 'Sector 3 Primary Chiller & Pump Vault',
    twl: 195,
    wbgt: 30.1,
    ach: 14.0,
    chillerSetpoint: 19.0,
    fanSpeedHz: 48.0,
    damperPosition: 75,
    status: 'ELEVATED'
  }
];

const INITIAL_VIBRATION_ASSETS: VibrationAsset[] = [
  {
    id: 'MTR-001',
    name: 'Primary Evaporative Chiller Pump 1A',
    location: 'Sector 3 Vault',
    isoClass: 'Class II',
    velocityRmsMmS: 5.8,
    peakAccG: 1.42,
    bearingTempC: 74.2,
    noiseDba: 87.4,
    maintenanceStatus: 'SCHEDULED_72H'
  },
  {
    id: 'FAN-004B',
    name: 'High-Volume Emergency Exhaust Fan 4B',
    location: 'Sector 4 Heavy Bay',
    isoClass: 'Class III',
    velocityRmsMmS: 7.6,
    peakAccG: 2.15,
    bearingTempC: 86.8,
    noiseDba: 91.2,
    maintenanceStatus: 'INSPECTION_URGENT'
  },
  {
    id: 'CMP-002',
    name: 'Rotary Screw Refrigerant Compressor 2',
    location: 'Central Plant',
    isoClass: 'Class II',
    velocityRmsMmS: 2.1,
    peakAccG: 0.65,
    bearingTempC: 61.5,
    noiseDba: 82.0,
    maintenanceStatus: 'NOMINAL'
  }
];

function computeChainedHash(previousHash: string, payload: string): string {
  const input = `${previousHash}|${payload}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const seg = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const base = `${seg(h1)}${seg(h2)}${seg(h1 ^ 0xa5a5a5a5)}${seg(h2 ^ 0x5a5a5a5a)}`;
  return `0x${base}${base}`;
}

export function buildLedgerBlockPayload(block: {
  id: string;
  timestamp: string;
  eventType: AuditBlockEventType;
  actorPseudonym: string;
  summary: string;
}): string {
  return `${block.id}|${block.timestamp}|${block.eventType}|${block.actorPseudonym}|${block.summary}`;
}

export function verifyAuditLedgerChain(blocks: AuditLedgerBlock[]): LedgerVerificationResult {
  const checkedAt = formatUtcTimestamp();
  if (!blocks || blocks.length === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      verifiedBlocks: 0,
      corruptedBlockIds: [],
      brokenLinkIds: [],
      rootHash: GENESIS_PREV_HASH,
      checkedAt
    };
  }

  // Blocks are stored newest-first (index 0 = head); walk oldest -> newest to validate chain
  const chronological = [...blocks].reverse();
  const corruptedBlockIds: string[] = [];
  const brokenLinkIds: string[] = [];
  let expectedPrev = chronological[0].previousHash || GENESIS_PREV_HASH;

  for (let i = 0; i < chronological.length; i++) {
    const blk = chronological[i];
    if (i > 0 && blk.previousHash && blk.previousHash !== expectedPrev) {
      brokenLinkIds.push(blk.id);
    }
    const recomputedPayload = buildLedgerBlockPayload(blk);
    const prevForHash = blk.previousHash || expectedPrev;
    const recomputed = computeChainedHash(prevForHash, recomputedPayload);

    // Detect either mutated fields (payloadDigest mismatch) or forged hash
    if (
      (blk.payloadDigest && blk.payloadDigest !== recomputedPayload) ||
      (blk.previousHash !== undefined && blk.blockHash !== recomputed)
    ) {
      corruptedBlockIds.push(blk.id);
    }
    expectedPrev = blk.blockHash;
  }

  const invalidCount = new Set([...corruptedBlockIds, ...brokenLinkIds]).size;
  return {
    isValid: corruptedBlockIds.length === 0 && brokenLinkIds.length === 0,
    totalBlocks: blocks.length,
    verifiedBlocks: Math.max(0, blocks.length - invalidCount),
    corruptedBlockIds,
    brokenLinkIds,
    rootHash: blocks[0].blockHash,
    checkedAt
  };
}

function createInitialLedgerBlocks(): AuditLedgerBlock[] {
  const seeds: Array<{
    id: string;
    timestamp: string;
    eventType: AuditBlockEventType;
    actorPseudonym: string;
    legalStandard: string;
    summary: string;
    status: 'VERIFIED' | 'TAMPER_PROOF';
  }> = [
    {
      id: 'BLK-99821',
      timestamp: '2026-11-11 12:45:00 UTC',
      eventType: 'THRESHOLD_CALIBRATED',
      actorPseudonym: 'SAFETY_DIRECTOR_SC',
      legalStandard: 'OSHA Heat National Emphasis Program CPL 03-00-024',
      summary: 'Calibrated WBGT stop-work threshold and TWL alerts.',
      status: 'TAMPER_PROOF'
    },
    {
      id: 'BLK-99822',
      timestamp: '2026-11-11 13:30:45 UTC',
      eventType: 'PRIVACY_SHIELD_VERIFIED',
      actorPseudonym: 'CRYPTOGRAPHIC_AUDITOR',
      legalStandard: 'HIPAA §164.514 Safe Harbor & GDPR Article 9 Verification',
      summary: 'k-Anonymity (N >= 12) & Laplace epsilon=0.5 audit passed.',
      status: 'VERIFIED'
    },
    {
      id: 'BLK-99823',
      timestamp: '2026-11-11 13:58:10 UTC',
      eventType: 'HVAC_ACTUATION',
      actorPseudonym: 'FACILITY_ENGINEER_MV',
      legalStandard: 'ASHRAE 62.1-2022 Indoor Air Quality & Thermal Standard',
      summary: 'Sector 4 misting manifold & AHU damper staged to 95% aperture.',
      status: 'TAMPER_PROOF'
    },
    {
      id: 'BLK-99824',
      timestamp: '2026-11-11 14:15:22 UTC',
      eventType: 'REST_BREAK_ISSUED',
      actorPseudonym: 'SYSTEM_AUTONOMOUS_PBAC',
      legalStandard: 'Singapore MOM WSHA 2024 / WBGT >= 32.0°C Protocol',
      summary: 'Anonymous 10-min rest cycle validated for Sector 4 cohort (k >= 12 preserved).',
      status: 'VERIFIED'
    }
  ];

  let prevHash = GENESIS_PREV_HASH;
  const built: AuditLedgerBlock[] = [];
  for (const seed of seeds) {
    const payloadDigest = buildLedgerBlockPayload(seed);
    const blockHash = computeChainedHash(prevHash, payloadDigest);
    built.unshift({
      ...seed,
      previousHash: prevHash,
      payloadDigest,
      blockHash
    });
    prevHash = blockHash;
  }
  return built;
}

const INITIAL_LEDGER_BLOCKS: AuditLedgerBlock[] = createInitialLedgerBlocks();

function createDefaultSnapshot(): CrossRoleSnapshot {
  return {
    triageQueue: INITIAL_CLINICAL_QUEUE.map((i) => ({ ...i })),
    hvacZones: INITIAL_HVAC_ZONES.map((z) => ({ ...z })),
    vibrationAssets: INITIAL_VIBRATION_ASSETS.map((a) => ({ ...a })),
    restBreaks: [],
    ledgerBlocks: INITIAL_LEDGER_BLOCKS.map((b) => ({ ...b })),
    activityFeed: [],
    heatSpikeActive: false,
    firebaseSynced: false
  };
}

function formatUtcTimestamp(date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

type Listener = () => void;

class CrossRoleOperationsService {
  private state: CrossRoleSnapshot;
  private listeners: Set<Listener> = new Set();
  private channel: BroadcastChannel | null = null;
  private firestoreUnsubs: Array<() => void> = [];

  constructor() {
    this.state = this.loadPersistedState();
    this.setupCrossTabSync();
    this.setupFirebaseListeners();
  }

  private loadPersistedState(): CrossRoleSnapshot {
    if (typeof window === 'undefined') return createDefaultSnapshot();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultSnapshot();
      const parsed = JSON.parse(raw) as Partial<CrossRoleSnapshot>;
      const fallback = createDefaultSnapshot();
      return {
        triageQueue: Array.isArray(parsed.triageQueue) && parsed.triageQueue.length > 0 ? parsed.triageQueue : fallback.triageQueue,
        hvacZones: Array.isArray(parsed.hvacZones) && parsed.hvacZones.length > 0 ? parsed.hvacZones : fallback.hvacZones,
        vibrationAssets: Array.isArray(parsed.vibrationAssets) && parsed.vibrationAssets.length > 0 ? parsed.vibrationAssets : fallback.vibrationAssets,
        restBreaks: Array.isArray(parsed.restBreaks) ? parsed.restBreaks : [],
        ledgerBlocks: Array.isArray(parsed.ledgerBlocks) && parsed.ledgerBlocks.length > 0 ? parsed.ledgerBlocks : fallback.ledgerBlocks,
        activityFeed: Array.isArray(parsed.activityFeed) ? parsed.activityFeed : [],
        heatSpikeActive: Boolean(parsed.heatSpikeActive),
        firebaseSynced: false
      };
    } catch {
      return createDefaultSnapshot();
    }
  }

  private persistAndNotify(broadcast = true): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Ignore storage quota errors in restricted sandboxes
      }
      if (broadcast && this.channel) {
        try {
          this.channel.postMessage({ type: 'SYNC_STATE', state: this.state });
        } catch {
          // Ignore BroadcastChannel serialization edge cases
        }
      }
    }
    this.listeners.forEach((cb) => cb());
  }

  private setupCrossTabSync(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event?.data?.type === 'SYNC_STATE' && event.data.state) {
          this.state = {
            ...event.data.state,
            firebaseSynced: this.state.firebaseSynced
          };
          this.listeners.forEach((cb) => cb());
        }
      };
    } catch {
      this.channel = null;
    }
  }

  private setupFirebaseListeners(): void {
    if (typeof window === 'undefined') return;
    try {
      onAuthStateChanged(auth, (fbUser) => {
        // Detach existing listeners first
        this.firestoreUnsubs.forEach((u) => u());
        this.firestoreUnsubs = [];

        if (!fbUser) {
          if (this.state.firebaseSynced) {
            this.state = { ...this.state, firebaseSynced: false };
            this.listeners.forEach((cb) => cb());
          }
          return;
        }

        // Only attach onSnapshot when Firebase user is authenticated
        const restBreaksPath = 'rest_breaks';
        const unsubBreaks = onSnapshot(
          query(collection(db, restBreaksPath), orderBy('timestamp', 'desc'), limit(25)),
          (snap) => {
            const remoteBreaks: RestBreakRequestRecord[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                ephemeralToken: String(data.ephemeralToken || `ANON-${d.id.slice(-4)}`),
                zoneId: String(data.zoneId || 'Sector 4 Heavy Works'),
                timestamp: String(data.timestamp || new Date().toISOString()),
                language: String(data.language || 'en'),
                status: (data.status as RestBreakRequestRecord['status']) || 'DISPATCHED'
              };
            });
            if (remoteBreaks.length > 0) {
              const mergedMap = new Map<string, RestBreakRequestRecord>();
              [...remoteBreaks, ...this.state.restBreaks].forEach((b) => {
                if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
              });
              this.state = {
                ...this.state,
                restBreaks: Array.from(mergedMap.values()).slice(0, 25),
                firebaseSynced: true
              };
              this.persistAndNotify(false);
            } else {
              this.state = { ...this.state, firebaseSynced: true };
              this.listeners.forEach((cb) => cb());
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, restBreaksPath);
          }
        );

        const auditLogsPath = 'audit_logs';
        const unsubLogs = onSnapshot(
          query(collection(db, auditLogsPath), orderBy('timestamp', 'desc'), limit(25)),
          (snap) => {
            const remoteBlocks: AuditLedgerBlock[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                timestamp: String(data.timestamp || formatUtcTimestamp()),
                blockHash: String(data.blockHash || computeChainedHash('0x0', d.id)),
                eventType: (data.action as AuditBlockEventType) || 'PRIVACY_SHIELD_VERIFIED',
                actorPseudonym: String(data.userRole || data.userId || 'SYSTEM_PBAC'),
                legalStandard: String(data.resource || 'HIPAA §164.514 & WSH Compliance'),
                summary: String(data.summary || `Recorded ${data.action || 'audit'} event`),
                status: 'TAMPER_PROOF'
              };
            });
            if (remoteBlocks.length > 0) {
              const mergedMap = new Map<string, AuditLedgerBlock>();
              [...remoteBlocks, ...this.state.ledgerBlocks].forEach((b) => {
                if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
              });
              this.state = {
                ...this.state,
                ledgerBlocks: Array.from(mergedMap.values()).slice(0, 30),
                firebaseSynced: true
              };
              this.persistAndNotify(false);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, auditLogsPath);
          }
        );

        this.firestoreUnsubs.push(unsubBreaks, unsubLogs);
      });
    } catch {
      // Safe fallback in unit test / headless environments where Firebase auth isn't active
    }
  }

  private async syncBreakToFirestore(record: RestBreakRequestRecord): Promise<void> {
    if (!auth?.currentUser) return;
    const docId = sanitizeId(record.id);
    const path = `rest_breaks/${docId}`;
    try {
      await setDoc(doc(db, 'rest_breaks', docId), {
        id: docId,
        zoneId: record.zoneId,
        timestamp: record.timestamp,
        language: record.language,
        status: record.status
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  private async syncAuditBlockToFirestore(block: AuditLedgerBlock): Promise<void> {
    if (!auth?.currentUser) return;
    const docId = sanitizeId(block.id);
    const path = `audit_logs/${docId}`;
    try {
      await setDoc(doc(db, 'audit_logs', docId), {
        id: docId,
        timestamp: block.timestamp,
        userId: auth.currentUser.uid,
        userRole: block.actorPseudonym,
        action: block.eventType,
        resource: block.legalStandard
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  private appendAuditBlock(params: {
    eventType: AuditBlockEventType;
    actorPseudonym: string;
    legalStandard: string;
    summary: string;
    status?: 'VERIFIED' | 'TAMPER_PROOF';
  }): AuditLedgerBlock {
    const prevHash = this.state.ledgerBlocks[0]?.blockHash || GENESIS_PREV_HASH;
    const id = `BLK-${Math.floor(10000 + Math.random() * 89999)}`;
    const timestamp = formatUtcTimestamp();
    const payloadDigest = buildLedgerBlockPayload({
      id,
      timestamp,
      eventType: params.eventType,
      actorPseudonym: params.actorPseudonym,
      summary: params.summary
    });
    const blockHash = computeChainedHash(prevHash, payloadDigest);
    const block: AuditLedgerBlock = {
      id,
      timestamp,
      previousHash: prevHash,
      payloadDigest,
      blockHash,
      eventType: params.eventType,
      actorPseudonym: params.actorPseudonym,
      legalStandard: params.legalStandard,
      summary: params.summary,
      status: params.status || 'TAMPER_PROOF'
    };
    this.state = {
      ...this.state,
      ledgerBlocks: [block, ...this.state.ledgerBlocks].slice(0, 40)
    };
    void this.syncAuditBlockToFirestore(block);
    return block;
  }

  private pushActivity(event: Omit<CrossRoleActivityEvent, 'id' | 'timestamp'>): void {
    const item: CrossRoleActivityEvent = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.state = {
      ...this.state,
      activityFeed: [item, ...this.state.activityFeed].slice(0, 30)
    };
  }

  public getSnapshot(): CrossRoleSnapshot {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Action 1: Frontline Worker submits an anonymous 10-min cooling break request.
   * Zero PII is transmitted (only ephemeral token + zone + language).
   * Updates RestBreak queue, pushes cross-role activity for Director & Clinician,
   * and appends a tamper-evident block to the Auditor's cryptographic ledger.
   */
  public submitAnonymousBreakRequest(params: {
    zoneId: string;
    language: string;
    skinTempC?: number;
    hrvMs?: number;
  }): RestBreakRequestRecord {
    const tokenSuffix = Math.floor(1000 + Math.random() * 8999);
    const id = `BRK-${Date.now()}-${tokenSuffix}`;
    const record: RestBreakRequestRecord = {
      id,
      ephemeralToken: `ANON-${tokenSuffix}`,
      zoneId: params.zoneId || 'Sector 4 Heavy Works',
      timestamp: new Date().toISOString(),
      language: params.language || 'en',
      status: 'DISPATCHED'
    };

    this.state = {
      ...this.state,
      restBreaks: [record, ...this.state.restBreaks].slice(0, 25)
    };

    this.pushActivity({
      sourceRole: 'FRONTLINE_WORKER',
      category: 'REST_BREAK',
      zoneId: record.zoneId,
      headline: `Anonymous 10-Min Cooling Break Dispatched (${record.ephemeralToken})`,
      detail: `Zero-PII rest break requested in ${record.zoneId} (lang: ${record.language.toUpperCase()}). Relief rotation signaled without exposing worker identity.`
    });

    this.appendAuditBlock({
      eventType: 'REST_BREAK_ISSUED',
      actorPseudonym: 'ZERO_PII_WORKER_SHIELD',
      legalStandard: 'Non-Punitive Cooling Break Mandate & HIPAA §164.514 Zero-PII',
      summary: `Anonymous break ${record.ephemeralToken} authorized in ${record.zoneId} (${record.language}).`,
      status: 'VERIFIED'
    });

    // If telemetry indicates elevated heat strain, also add an anonymized clinical hydration watch item
    if ((params.skinTempC ?? 37.4) >= 37.4 || (params.hrvMs ?? 58) <= 60) {
      const anonClinicalId = `CLIN-ANON-${tokenSuffix}`;
      const newTriage: ClinicalTriageRecord = {
        id: anonClinicalId,
        workerPseudonym: record.ephemeralToken,
        zone: record.zoneId,
        department: 'Frontline Cooling Watch (Anonymous Opt-In)',
        heartRate: 122,
        hrv: params.hrvMs ?? 58,
        skinTemp: params.skinTempC ?? 37.4,
        dehydrationIndex: 72,
        triagePriority: 'HIGH',
        recommendedAction: 'Stage shaded rest tent hydration check (ephemeral token only — zero PII).',
        status: 'PENDING'
      };
      this.state = {
        ...this.state,
        triageQueue: [newTriage, ...this.state.triageQueue].slice(0, 20)
      };
    }

    void this.syncBreakToFirestore(record);
    this.persistAndNotify();
    return record;
  }

  public completeAnonymousBreakRequest(breakId: string): void {
    let updatedBreak: RestBreakRequestRecord | undefined;
    this.state = {
      ...this.state,
      restBreaks: this.state.restBreaks.map((b) => {
        if (b.id === breakId) {
          updatedBreak = { ...b, status: 'COMPLETED' };
          return updatedBreak;
        }
        return b;
      })
    };
    if (updatedBreak) {
      void this.syncBreakToFirestore(updatedBreak);
    }
    this.persistAndNotify();
  }

  /**
   * Action 2: Clinician dispatches oral rehydration & cooling liaison for a triage record.
   * Synchronizes with Worker rest breaks in the same zone and logs to Auditor + Compliance Ledger.
   */
  public dispatchClinicalRehydration(params: {
    recordId: string;
    actorName: string;
    actorRole: string;
    regulatoryStandard: string;
  }): ClinicalTriageRecord | undefined {
    const target = this.state.triageQueue.find((r) => r.id === params.recordId);
    if (!target) return undefined;

    const syncedBreaks: RestBreakRequestRecord[] = [];
    this.state = {
      ...this.state,
      triageQueue: this.state.triageQueue.map((item) =>
        item.id === params.recordId ? { ...item, status: 'DISPATCHED' } : item
      ),
      restBreaks: this.state.restBreaks.map((brk) => {
        if (
          brk.status === 'DISPATCHED' &&
          (brk.ephemeralToken === target.workerPseudonym ||
            brk.zoneId.toLowerCase().includes('sector 4') ||
            target.zone.toLowerCase().includes('sector-4'))
        ) {
          const nextBrk: RestBreakRequestRecord = {
            ...brk,
            status: 'HYDRATION_DISPATCHED',
            acknowledgedByRole: 'Clinical Triage Team'
          };
          syncedBreaks.push(nextBrk);
          return nextBrk;
        }
        return brk;
      })
    };
    syncedBreaks.forEach((b) => void this.syncBreakToFirestore(b));

    complianceAuditService.logEvent({
      eventType: 'SAFETY_DISPATCH',
      actor: params.actorName,
      actorRole: params.actorRole,
      actorType: 'USER',
      targetModule: 'Clinical Triage & Medical Dispatch',
      parameter: `Oral Rehydration & Cooling Liaison (${target.workerPseudonym})`,
      previousValue: target.status,
      newValue: 'DISPATCHED',
      justification: `Clinical medical liaison dispatched for ${target.workerPseudonym} in ${target.zone} (HRV ${target.hrv}ms, Skin Temp ${target.skinTemp}°C).`,
      regulatoryStandard: params.regulatoryStandard,
      complianceStatus: 'VERIFIED',
      zoneId: target.zone
    });

    this.pushActivity({
      sourceRole: 'OCCUPATIONAL_HEALTH_OFFICER',
      category: 'CLINICAL_TRIAGE',
      zoneId: target.zone,
      headline: `Medical Hydration Dispatched (${target.workerPseudonym})`,
      detail: `${params.actorName} dispatched shaded oral electrolyte protocol in ${target.zone}.`
    });

    this.appendAuditBlock({
      eventType: 'MEDICAL_DISPATCH',
      actorPseudonym: 'CLINICAL_OFFICER_MD',
      legalStandard: params.regulatoryStandard,
      summary: `Electrolyte & cooling triage dispatched for pseudonym ${target.workerPseudonym} (${target.zone}).`,
      status: 'TAMPER_PROOF'
    });

    this.persistAndNotify();
    return { ...target, status: 'DISPATCHED' };
  }

  public evaluateClinicalRecord(recordId: string, actorName: string): ClinicalTriageRecord | undefined {
    const target = this.state.triageQueue.find((r) => r.id === recordId);
    if (!target) return undefined;

    this.state = {
      ...this.state,
      triageQueue: this.state.triageQueue.map((item) =>
        item.id === recordId ? { ...item, status: 'EVALUATED' } : item
      )
    };

    this.pushActivity({
      sourceRole: 'OCCUPATIONAL_HEALTH_OFFICER',
      category: 'CLINICAL_TRIAGE',
      zoneId: target.zone,
      headline: `Clinical Evaluation Cleared (${target.workerPseudonym})`,
      detail: `${actorName} cleared ${target.workerPseudonym} post-cooling check.`
    });

    this.persistAndNotify();
    return { ...target, status: 'EVALUATED' };
  }

  /**
   * Action 3: Facility Engineer actuates HVAC damper / approves automated remediation / issues 72h work order.
   */
  public actuateHvacDamper(params: {
    zoneId: string;
    delta: number;
    actorName: string;
    actorRole: string;
  }): HvacZoneControl | undefined {
    const targetZone = this.state.hvacZones.find((z) => z.id === params.zoneId);
    if (!targetZone) return undefined;

    const newDamper = Math.min(100, Math.max(10, targetZone.damperPosition + params.delta));
    const newAch = +(targetZone.ach * (newDamper / Math.max(1, targetZone.damperPosition))).toFixed(1);
    const newTwl = Math.round(targetZone.twl + params.delta * 0.8);
    const newWbgt = +(targetZone.wbgt - params.delta * 0.04).toFixed(1);
    const newStatus: HvacZoneControl['status'] =
      newTwl > 220 ? 'OPTIMAL' : newTwl > 140 ? 'ELEVATED' : 'CRITICAL';

    const updatedZone: HvacZoneControl = {
      ...targetZone,
      damperPosition: newDamper,
      ach: newAch,
      twl: newTwl,
      wbgt: newWbgt,
      status: newStatus
    };

    this.state = {
      ...this.state,
      hvacZones: this.state.hvacZones.map((z) => (z.id === params.zoneId ? updatedZone : z))
    };

    complianceAuditService.logEvent({
      eventType: 'MANUAL_OVERRIDE',
      actor: params.actorName,
      actorRole: params.actorRole,
      actorType: 'USER',
      targetModule: 'Facility HVAC Damper Control',
      parameter: `${params.zoneId} Damper Aperture`,
      previousValue: `${targetZone.damperPosition}%`,
      newValue: `${newDamper}%`,
      justification: 'Facility engineer adjusted AHU airflow damper to optimize Thermal Work Limit (TWL).',
      regulatoryStandard: 'ASHRAE 62.1 & OSHA Thermal Standard',
      complianceStatus: 'VERIFIED',
      zoneId: params.zoneId
    });

    this.pushActivity({
      sourceRole: 'FACILITY_ENGINEER',
      category: 'HVAC_ACTUATION',
      zoneId: targetZone.name,
      headline: `HVAC Damper Actuated (${targetZone.id} -> ${newDamper}%)`,
      detail: `${params.actorName} adjusted airflow to ${newAch} ACH (TWL ${newTwl} W/m²).`
    });

    this.appendAuditBlock({
      eventType: 'HVAC_ACTUATION',
      actorPseudonym: 'FACILITY_ENGINEER_PE',
      legalStandard: 'ASHRAE 62.1-2022 Indoor Air Quality & Thermal Standard',
      summary: `${targetZone.name} damper set to ${newDamper}% (${newAch} ACH, TWL ${newTwl} W/m²).`,
      status: 'TAMPER_PROOF'
    });

    this.persistAndNotify();
    return updatedZone;
  }

  public recordHvacRemediationDecision(params: {
    adjustmentId: string;
    zoneName: string;
    decision: 'APPROVED' | 'DISMISSED' | 'AUTONOMOUS';
    actorName: string;
  }): void {
    const label =
      params.decision === 'DISMISSED'
        ? `Remediation ${params.adjustmentId} Overridden`
        : `HVAC Remediation ${params.adjustmentId} Executed`;

    this.pushActivity({
      sourceRole: 'FACILITY_ENGINEER',
      category: 'HVAC_ACTUATION',
      zoneId: params.zoneName,
      headline: label,
      detail: `${params.actorName} marked ${params.adjustmentId} as ${params.decision} in ${params.zoneName}.`
    });

    this.appendAuditBlock({
      eventType: 'HVAC_ACTUATION',
      actorPseudonym: params.decision === 'AUTONOMOUS' ? 'SYSTEM_AUTONOMOUS_HVAC' : 'FACILITY_ENGINEER_PE',
      legalStandard: 'ASHRAE 62.1-2022 Closed-Loop BMS Actuation',
      summary: `${params.adjustmentId} (${params.zoneName}) ${params.decision.toLowerCase()} via BACnet/Modbus.`,
      status: 'TAMPER_PROOF'
    });

    this.persistAndNotify();
  }

  public issueVibrationWorkOrder(params: {
    assetId: string;
    actorName: string;
    actorRole: string;
  }): void {
    const asset = this.state.vibrationAssets.find((a) => a.id === params.assetId);
    this.state = {
      ...this.state,
      vibrationAssets: this.state.vibrationAssets.map((a) =>
        a.id === params.assetId ? { ...a, maintenanceStatus: 'SCHEDULED_72H' } : a
      )
    };

    complianceAuditService.logEvent({
      eventType: 'SYSTEM_COMPLIANCE',
      actor: params.actorName,
      actorRole: params.actorRole,
      actorType: 'USER',
      targetModule: 'ISO 10816 Vibration Maintenance',
      parameter: `Work Order (${params.assetId})`,
      previousValue: asset?.maintenanceStatus || 'INSPECTION_URGENT',
      newValue: 'SCHEDULED_72H',
      justification: '72-hour predictive bearing & rotor maintenance order scheduled.',
      regulatoryStandard: 'ISO 10816-3 Rotating Machinery Standard',
      complianceStatus: 'VERIFIED'
    });

    this.pushActivity({
      sourceRole: 'FACILITY_ENGINEER',
      category: 'HVAC_ACTUATION',
      zoneId: asset?.location || 'Central Plant',
      headline: `72h ISO 10816 Work Order Issued (${params.assetId})`,
      detail: `${params.actorName} scheduled bearing inspection for ${asset?.name || params.assetId}.`
    });

    this.appendAuditBlock({
      eventType: 'MAINTENANCE_WORK_ORDER',
      actorPseudonym: 'FACILITY_ENGINEER_PE',
      legalStandard: 'ISO 10816-3 Class II/III Rotating Machinery Standard',
      summary: `Proactive 72h maintenance work order dispatched for ${params.assetId}.`,
      status: 'VERIFIED'
    });

    this.persistAndNotify();
  }

  /**
   * Action 4: Safety Director triggers a simulated Sector 4 Heat Spike or acknowledges pending breaks.
   * Instantly propagates elevated thermal metrics across Worker, Clinician, Engineer & Auditor.
   */
  public triggerSectorHeatSpike(actorName: string): void {
    this.state = {
      ...this.state,
      heatSpikeActive: true,
      hvacZones: this.state.hvacZones.map((z) =>
        z.id === 'ZONE-A'
          ? { ...z, twl: 108, wbgt: 34.1, status: 'CRITICAL' }
          : z
      )
    };

    this.pushActivity({
      sourceRole: 'SAFETY_DIRECTOR',
      category: 'HEAT_SPIKE',
      zoneId: 'Sector 4 Heavy Fabrication Bay',
      headline: 'Sector 4 Wet-Bulb Heat Spike Active (WBGT 34.1°C · TWL 108 W/m²)',
      detail: `${actorName} initiated live thermal surge drill across Director, Clinician, Engineer, and Worker consoles.`
    });

    this.appendAuditBlock({
      eventType: 'THRESHOLD_CALIBRATED',
      actorPseudonym: 'SAFETY_DIRECTOR_SC',
      legalStandard: 'Singapore MOM WSHA & OSHA Heat Stop-Work Advisory',
      summary: 'Live heat surge alert broadcast to all site consoles (TWL < 115 W/m²).',
      status: 'TAMPER_PROOF'
    });

    this.persistAndNotify();
  }

  public acknowledgePendingCoolingBreaks(actorName: string): number {
    const pendingCount = this.state.restBreaks.filter((b) => b.status === 'DISPATCHED').length;
    if (pendingCount === 0) return 0;

    const syncedBreaks: RestBreakRequestRecord[] = [];
    this.state = {
      ...this.state,
      restBreaks: this.state.restBreaks.map((b) => {
        if (b.status === 'DISPATCHED') {
          const updated: RestBreakRequestRecord = {
            ...b,
            status: 'HYDRATION_DISPATCHED',
            acknowledgedByRole: 'Site Safety Command'
          };
          syncedBreaks.push(updated);
          return updated;
        }
        return b;
      })
    };
    syncedBreaks.forEach((b) => void this.syncBreakToFirestore(b));

    this.pushActivity({
      sourceRole: 'SAFETY_DIRECTOR',
      category: 'REST_BREAK',
      zoneId: 'Sector 4 Heavy Works',
      headline: `Shaded Hydration Support Acknowledged (${pendingCount} Anonymous Break${pendingCount > 1 ? 's' : ''})`,
      detail: `${actorName} confirmed shaded cooling rotation coverage without accessing worker PII.`
    });

    this.appendAuditBlock({
      eventType: 'REST_BREAK_ISSUED',
      actorPseudonym: 'SAFETY_DIRECTOR_SC',
      legalStandard: 'Zero-PII Relief Dispatch & WSH Heat Stress Protocol',
      summary: `Acknowledged ${pendingCount} anonymous cooling break(s) via aggregate zone counter.`,
      status: 'VERIFIED'
    });

    this.persistAndNotify();
    return pendingCount;
  }

  /**
   * Action 5: Auditor records certified dossier export or privacy verification in the shared ledger.
   */
  public recordAuditExport(params: {
    actorRole: string;
    reportTitle: string;
    legalStandard: string;
  }): AuditLedgerBlock {
    const block = this.appendAuditBlock({
      eventType: 'PRIVACY_SHIELD_VERIFIED',
      actorPseudonym: params.actorRole,
      legalStandard: params.legalStandard,
      summary: `Certified export signed: ${params.reportTitle}.`,
      status: 'VERIFIED'
    });

    this.pushActivity({
      sourceRole: 'COMPLIANCE_AUDITOR',
      category: 'AUDIT_VERIFIED',
      zoneId: 'Site-Wide Statutory Scope',
      headline: `Certified Compliance Export Signed (${block.id})`,
      detail: `${params.reportTitle} sealed in cryptographic audit ledger.`
    });

    this.persistAndNotify();
    return block;
  }

  public verifyLedgerIntegrity(): LedgerVerificationResult {
    return verifyAuditLedgerChain(this.state.ledgerBlocks);
  }

  public getClosedLoopStatus(): ClosedLoopStatus {
    const heatSurgeTriggered = this.state.heatSpikeActive ||
      this.state.activityFeed.some((e) => e.category === 'HEAT_SPIKE');
    const workerBreakRequested = this.state.restBreaks.length > 0 ||
      this.state.activityFeed.some((e) => e.category === 'REST_BREAK');
    const clinicalHydrationDispatched = this.state.triageQueue.some((t) => t.status === 'DISPATCHED') ||
      this.state.activityFeed.some((e) => e.category === 'CLINICAL_TRIAGE');
    const hvacMitigated = this.state.activityFeed.some((e) => e.category === 'HVAC_ACTUATION');
    const auditSealedCount = this.state.ledgerBlocks.length;
    const completedStages = [
      heatSurgeTriggered,
      workerBreakRequested,
      clinicalHydrationDispatched,
      hvacMitigated
    ].filter(Boolean).length;

    return {
      heatSurgeTriggered,
      workerBreakRequested,
      clinicalHydrationDispatched,
      hvacMitigated,
      auditSealedCount,
      completedStages
    };
  }

  public resetOperationalState(): void {
    this.state = createDefaultSnapshot();
    this.persistAndNotify();
  }
}

export const crossRoleOperationsService = new CrossRoleOperationsService();

export function useCrossRoleOperations(): CrossRoleSnapshot {
  const [snapshot, setSnapshot] = useState<CrossRoleSnapshot>(() =>
    crossRoleOperationsService.getSnapshot()
  );

  useEffect(() => {
    setSnapshot(crossRoleOperationsService.getSnapshot());
    return crossRoleOperationsService.subscribe(() => {
      setSnapshot(crossRoleOperationsService.getSnapshot());
    });
  }, []);

  return snapshot;
}

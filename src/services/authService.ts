import {
  UserPersona,
  UserRole,
  Permission,
  RegulatoryJurisdiction,
  RegulatoryFrameworkDetail
} from '../types';

// Pre-configured enterprise personas targeted for workforce and migrant health
export const TARGET_PERSONAS: UserPersona[] = [
  {
    id: 'user_safety_director',
    name: 'Sarah Chen, CSP',
    email: 'sarah.chen@prognosticator.io',
    role: 'SAFETY_DIRECTOR',
    roleTitle: 'Enterprise Site Safety Director',
    department: 'Corporate Environmental Health & Safety (EHS)',
    organization: 'Apex Industrial Infrastructure Consortium',
    workforceType: 'SUPERVISORY_STAFF',
    jurisdiction: 'SINGAPORE_MOM',
    avatarInitials: 'SC',
    avatarColor: 'bg-cyan-600',
    clearanceLevel: 'LEVEL_4_EXECUTIVE',
    primaryLanguage: 'en',
    languageLabel: 'English',
    bioSummary: 'Oversees site-wide health surveillance, heat stress compliance, and automated emergency escalation across all zones.',
    permissions: [
      'VIEW_AGGREGATE_ANALYTICS',
      'CONFIGURE_GLOBAL_THRESHOLDS',
      'ACTUATE_HVAC_REMEDIATION',
      'DISPATCH_MEDICAL_EMERGENCY',
      'SCHEDULE_IOT_MAINTENANCE',
      'EXPORT_CERTIFIED_REPORTS',
      'VIEW_COMPLIANCE_AUDIT_LOGS',
      'RUN_WHAT_IF_SIMULATIONS',
      'MANAGE_USER_ROLES'
    ]
  },
  {
    id: 'user_health_officer',
    name: 'Dr. Aravind Krishnan, MD, MOH',
    email: 'dr.aravind@prognosticator.io',
    role: 'OCCUPATIONAL_HEALTH_OFFICER',
    roleTitle: 'Chief Occupational Health & Clinic Physician',
    department: 'Onsite Occupational Health & Medical Triage Center',
    organization: 'Apex Health Services Division',
    workforceType: 'SUPERVISORY_STAFF',
    jurisdiction: 'SINGAPORE_MOM',
    avatarInitials: 'AK',
    avatarColor: 'bg-emerald-600',
    clearanceLevel: 'LEVEL_2_CLINICAL',
    primaryLanguage: 'en',
    languageLabel: 'English',
    bioSummary: 'Monitors cohort autonomic nervous system drift (HRV), thermal strain indices, and dispatches rapid oral electrolyte rehydration.',
    permissions: [
      'VIEW_AGGREGATE_ANALYTICS',
      'DISPATCH_MEDICAL_EMERGENCY',
      'EXPORT_CERTIFIED_REPORTS',
      'VIEW_COMPLIANCE_AUDIT_LOGS',
      'RUN_WHAT_IF_SIMULATIONS'
    ]
  },
  {
    id: 'user_facility_engineer',
    name: 'Marcus Vance, PE',
    email: 'marcus.vance@plantops.net',
    role: 'FACILITY_ENGINEER',
    roleTitle: 'Lead Mechanical & Automation Reliability Engineer',
    department: 'Plant Operations, HVAC & Smart Chiller Maintenance',
    organization: 'Apex Facility Engineering Group',
    workforceType: 'SUPERVISORY_STAFF',
    jurisdiction: 'US_OSHA_NIOSH',
    avatarInitials: 'MV',
    avatarColor: 'bg-amber-600',
    clearanceLevel: 'LEVEL_3_TECHNICAL',
    primaryLanguage: 'en',
    languageLabel: 'English',
    bioSummary: 'Analyzes ISO 10816 bearing vibration telemetry, operates building ventilation dampers, and schedules 72-hour proactive maintenance.',
    permissions: [
      'VIEW_AGGREGATE_ANALYTICS',
      'ACTUATE_HVAC_REMEDIATION',
      'SCHEDULE_IOT_MAINTENANCE',
      'RUN_WHAT_IF_SIMULATIONS',
      'VIEW_COMPLIANCE_AUDIT_LOGS'
    ]
  },
  {
    id: 'user_migrant_worker_tariq',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@worker.local',
    role: 'FRONTLINE_WORKER',
    roleTitle: 'Heavy Rigging & Scaffold Specialist (Migrant Workforce)',
    department: 'Civil Infrastructure Deep Foundation Team',
    organization: 'Gulf & Asia Construction Labour Corp',
    workforceType: 'MIGRANT_WORKFORCE',
    jurisdiction: 'GCC_MOHRE',
    avatarInitials: 'TM',
    avatarColor: 'bg-purple-600',
    clearanceLevel: 'LEVEL_1_BASIC',
    primaryLanguage: 'bn',
    languageLabel: 'বাংলা (Bengali)',
    assignedZoneOrDorm: 'Sector 4 Heavy Works & Dormitory Bay 12',
    bioSummary: 'Frontline migrant worker equipped with BLE biometric sensor band. Protected by Sovereign Worker Privacy Shield and Midday Work Ban policies.',
    permissions: [
      'VIEW_PRIVATE_BIOMETRICS',
      'REQUEST_ANONYMOUS_REST_BREAK'
    ]
  },
  {
    id: 'user_migrant_worker_rajan',
    name: 'Rajan Pillai',
    email: 'rajan.pillai@worker.local',
    role: 'FRONTLINE_WORKER',
    roleTitle: 'High-Voltage Electrical Conduit Technician (Work Permit Pass)',
    department: 'Marine Offshore & Port Electrical Fabrication',
    organization: 'Straits Technical Contracting Pte Ltd',
    workforceType: 'MIGRANT_WORKFORCE',
    jurisdiction: 'SINGAPORE_MOM',
    avatarInitials: 'RP',
    avatarColor: 'bg-indigo-600',
    clearanceLevel: 'LEVEL_1_BASIC',
    primaryLanguage: 'ta',
    languageLabel: 'தமிழ் (Tamil)',
    assignedZoneOrDorm: 'Tuas Marine Yard & Jurong East Lodge',
    bioSummary: 'Foreign migrant worker covered under Singapore Ministry of Manpower (MOM) 2024 Heat Stress & WSH Medical Examination Regulations.',
    permissions: [
      'VIEW_PRIVATE_BIOMETRICS',
      'REQUEST_ANONYMOUS_REST_BREAK'
    ]
  },
  {
    id: 'user_compliance_auditor',
    name: 'Inspector Elena Rostova',
    email: 'e.rostova@wsh-inspector.gov',
    role: 'COMPLIANCE_AUDITOR',
    roleTitle: 'Senior Workplace Safety & Health (WSH) Government Inspector',
    department: 'Occupational Safety & Health Inspectorate',
    organization: 'Ministry of Manpower / Federal Health Audit Authority',
    workforceType: 'INDEPENDENT_AUDITOR',
    jurisdiction: 'SINGAPORE_MOM',
    avatarInitials: 'ER',
    avatarColor: 'bg-rose-600',
    clearanceLevel: 'LEVEL_5_AUDITOR',
    primaryLanguage: 'en',
    languageLabel: 'English',
    bioSummary: 'External regulatory auditor reviewing de-identified HIPAA §164.514 trails, GDPR compliance dossiers, and migrant workforce heat protocols.',
    permissions: [
      'VIEW_AGGREGATE_ANALYTICS',
      'EXPORT_CERTIFIED_REPORTS',
      'VIEW_COMPLIANCE_AUDIT_LOGS'
    ]
  }
];

// Regulatory frameworks by jurisdiction focusing on country workforce and migrant workforce protections
export const REGULATORY_FRAMEWORKS: Record<RegulatoryJurisdiction, RegulatoryFrameworkDetail> = {
  SINGAPORE_MOM: {
    jurisdiction: 'SINGAPORE_MOM',
    countryName: 'Singapore',
    regionLabel: 'Southeast Asia (ASEAN)',
    regulatoryBody: 'Ministry of Manpower (MOM) & WSH Council',
    keyActs: [
      'Workplace Safety and Health Act (WSHA) Cap. 354A',
      'MOM Heat Stress Management Framework for Outdoor Work (Updated 2024)',
      'Employment of Foreign Manpower Act (EFMA) - Migrant Worker Housing & Welfare',
      'WSH (Medical Examination) Regulations'
    ],
    wbgtThresholds: {
      moderateRestMinsPerHour: 15, // When WBGT is 31.0°C to 31.9°C
      highRestMinsPerHour: 30,     // When WBGT is 32.0°C to 32.9°C
      stopWorkWbgtC: 33.0          // When WBGT >= 33.0°C (Mandatory shaded rest / work suspension for unacclimatized crews)
    },
    migrantWorkforceProtections: {
      mandatoryLanguages: ['English', 'Bengali (বাংলা)', 'Tamil (தமிழ்)', 'Mandarin (中文)', 'Tagalog'],
      coolingStationsRequired: true,
      middayWorkBanApplies: false, // Singapore uses live WBGT sensor-driven rest cycles rather than fixed clock hours
      dormitoryThermalStandard: 'Adequate mechanical ventilation / max indoor heat index <= 30°C in migrant worker dormitories (FWMOMCare standards)',
      nonPunitiveFatigueReportingClause: 'Workers may report thermal distress or symptoms without fear of disciplinary retaliation or work permit cancellation (MOM Whistleblower Protection)',
      employerMedicalLiabilityClause: 'Employers must provide mandatory primary healthcare plan (PCP) coverage and immediate medical transport for suspected heat injury'
    },
    complianceStatus: 'FULLY_COMPLIANT',
    lastAuditDate: '2026-11-08T09:30:00Z',
    activeEnforcementAlerts: [
      'MOM WBGT Advisory: Mandatory 15-min rest break per hour in effect for unshaded outdoor fabrication cells.',
      'Primary Care Plan (PCP) Active: Rapid clinic triage on standby at Jurong and Tuas worksites.'
    ]
  },
  GCC_MOHRE: {
    jurisdiction: 'GCC_MOHRE',
    countryName: 'United Arab Emirates / Saudi Arabia / Qatar',
    regionLabel: 'Gulf Cooperation Council (GCC)',
    regulatoryBody: 'Ministry of Human Resources and Emiratisation (MoHRE) / Ministry of Labor',
    keyActs: [
      'MoHRE Ministerial Resolution on Midday Summer Work Ban (June 15 – September 15)',
      'Occupational Safety & Health Standard on High Ambient Heat & Direct Sun Exposure',
      'Wage Protection System (WPS) & Migrant Health Shield Guidelines'
    ],
    wbgtThresholds: {
      moderateRestMinsPerHour: 20,
      highRestMinsPerHour: 40,
      stopWorkWbgtC: 34.0
    },
    migrantWorkforceProtections: {
      mandatoryLanguages: ['Arabic (العربية)', 'Hindi (हिन्दी)', 'Bengali (বাংলা)', 'Urdu (اردو)', 'Tagalog', 'English'],
      coolingStationsRequired: true,
      middayWorkBanApplies: true,
      middayBanHours: '12:30 PM to 3:00 PM (Mandatory outdoor work cessation for all open-air worksites)',
      dormitoryThermalStandard: 'Air-conditioned residential accommodation with continuous potable cold drinking water and electrolyte dispensers',
      nonPunitiveFatigueReportingClause: 'Midday rest non-negotiable; employers prohibited from deducting rest hours from daily wages or contract pay',
      employerMedicalLiabilityClause: 'Full emergency evacuation and thermal cooling tent facilities required on site with trained paramedical staff'
    },
    complianceStatus: 'FULLY_COMPLIANT',
    lastAuditDate: '2026-11-05T14:15:00Z',
    activeEnforcementAlerts: [
      'MoHRE Heat Protocol Active: Midday summer outdoor work curfew enforced. Air-conditioned hydration rest tents deployed.',
      'Electrolyte & hydration packs inspected and replenished across Sector 4 desert camp.'
    ]
  },
  US_OSHA_NIOSH: {
    jurisdiction: 'US_OSHA_NIOSH',
    countryName: 'United States',
    regionLabel: 'North America',
    regulatoryBody: 'Occupational Safety and Health Administration (OSHA) & NIOSH',
    keyActs: [
      'OSHA General Duty Clause Section 5(a)(1)',
      'OSHA National Emphasis Program on Outdoor and Indoor Heat-Related Hazards (CPL 03-00-024)',
      'NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments',
      'HIPAA Security Rule § 164.514 (De-Identification and Safe Harbor)'
    ],
    wbgtThresholds: {
      moderateRestMinsPerHour: 15,
      highRestMinsPerHour: 30,
      stopWorkWbgtC: 32.5
    },
    migrantWorkforceProtections: {
      mandatoryLanguages: ['English', 'Spanish (Español)', 'Vietnamese', 'Mandarin'],
      coolingStationsRequired: true,
      middayWorkBanApplies: false,
      dormitoryThermalStandard: 'OSHA 1910.142 Temporary Labor Camps environmental and sanitary controls',
      nonPunitiveFatigueReportingClause: 'OSHA Whistleblower Protection Section 11(c) prohibits adverse action against workers raising safety/heat concerns',
      employerMedicalLiabilityClause: 'First aid trained responders and cold water immersion basins for rapid core cooling'
    },
    complianceStatus: 'FULLY_COMPLIANT',
    lastAuditDate: '2026-11-02T11:00:00Z',
    activeEnforcementAlerts: [
      'OSHA Heat NEP in effect: 80°F (26.6°C) trigger for drinking water and rest break access.',
      'HIPAA §164.514 cryptographic audit trail validated with zero PII breaches.'
    ]
  },
  EU_GDPR_OSHA: {
    jurisdiction: 'EU_GDPR_OSHA',
    countryName: 'European Union (Germany / Belgium / Netherlands)',
    regionLabel: 'European Union',
    regulatoryBody: 'European Agency for Safety and Health at Work (EU-OSHA) & Data Protection Authorities',
    keyActs: [
      'EU Framework Directive 89/391/EEC (Workplace Safety and Health)',
      'EU GDPR Article 9 (Prohibition of Processing Special Category Biometric Data without explicit statutory safeguard)',
      'German ArbSchG (Occupational Safety Act) & ASR A3.5 (Room Temperature Directives)'
    ],
    wbgtThresholds: {
      moderateRestMinsPerHour: 15,
      highRestMinsPerHour: 30,
      stopWorkWbgtC: 32.0
    },
    migrantWorkforceProtections: {
      mandatoryLanguages: ['English', 'German (Deutsch)', 'French (Français)', 'Polish (Polski)', 'Romanian'],
      coolingStationsRequired: true,
      middayWorkBanApplies: false,
      dormitoryThermalStandard: 'EU posted workers housing quality directive & energy performance standards',
      nonPunitiveFatigueReportingClause: 'Works Council (Betriebsrat) right of co-determination on occupational health and thermal breaks',
      employerMedicalLiabilityClause: 'Statutory accident insurance (Berufsgenossenschaft) immediate coverage'
    },
    complianceStatus: 'FULLY_COMPLIANT',
    lastAuditDate: '2026-11-01T16:00:00Z',
    activeEnforcementAlerts: [
      'GDPR Art. 9 Privacy Shield verified: k-Anonymity (N >= 12) strictly enforces zero manager biometric visibility.',
      'EU-OSHA Thermal Guidelines: Technical HVAC ventilation prioritized over personal work quotas.'
    ]
  }
};

const STORAGE_KEY_USER = 'prognosticator_active_user_id';
const STORAGE_KEY_JURISDICTION = 'prognosticator_active_jurisdiction';
const STORAGE_KEY_AUTH_STATUS = 'prognosticator_is_authenticated';
const AUTH_EVENT_NAME = 'prognosticator_auth_changed';

export class AuthService {
  private currentUser: UserPersona;
  private currentJurisdiction: RegulatoryJurisdiction;
  private loggedIn: boolean;

  constructor() {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER) : null;
    const foundUser = TARGET_PERSONAS.find((p) => p.id === savedUserId);
    this.currentUser = foundUser || TARGET_PERSONAS[0]; // Default: Sarah Chen (Safety Director)

    const savedAuth = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_AUTH_STATUS) : null;
    // Default to true if not explicitly set to false, or true on first load
    this.loggedIn = savedAuth === null ? true : savedAuth === 'true';

    const savedJurisdiction = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY_JURISDICTION) as RegulatoryJurisdiction | null)
      : null;
    this.currentJurisdiction = savedJurisdiction && REGULATORY_FRAMEWORKS[savedJurisdiction]
      ? savedJurisdiction
      : this.currentUser.jurisdiction;
  }

  public isAuthenticated(): boolean {
    return this.loggedIn;
  }

  public getCurrentUser(): UserPersona {
    return this.currentUser;
  }

  public getAllPersonas(): UserPersona[] {
    return TARGET_PERSONAS;
  }

  public switchPersona(personaId: string): UserPersona {
    const target = TARGET_PERSONAS.find((p) => p.id === personaId);
    if (!target) {
      console.warn(`Persona with id ${personaId} not found. Keeping current user.`);
      return this.currentUser;
    }

    this.currentUser = target;
    this.currentJurisdiction = target.jurisdiction;
    this.loggedIn = true;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_USER, target.id);
        localStorage.setItem(STORAGE_KEY_JURISDICTION, target.jurisdiction);
        localStorage.setItem(STORAGE_KEY_AUTH_STATUS, 'true');
        window.dispatchEvent(
          new CustomEvent(AUTH_EVENT_NAME, {
            detail: { user: target, jurisdiction: target.jurisdiction, isAuthenticated: true }
          })
        );
      } catch (e) {
        console.error('Failed to persist user session:', e);
      }
    }

    return this.currentUser;
  }

  public loginWithCredentials(email: string, _password?: string): UserPersona {
    const normalized = email.trim().toLowerCase();
    const found = TARGET_PERSONAS.find((p) => p.email.toLowerCase() === normalized);
    if (found) {
      return this.switchPersona(found.id);
    }
    // If not exact match, log in with Safety Director
    return this.switchPersona('user_safety_director');
  }

  public logout(): void {
    this.loggedIn = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH_STATUS, 'false');
        window.dispatchEvent(
          new CustomEvent(AUTH_EVENT_NAME, {
            detail: { user: this.currentUser, jurisdiction: this.currentJurisdiction, isAuthenticated: false }
          })
        );
      } catch (e) {
        console.error('Failed to clear session:', e);
      }
    }
  }

  public hasPermission(permission: Permission): boolean {
    return this.currentUser.permissions.includes(permission);
  }

  public hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.currentUser.permissions.includes(p));
  }

  public evaluatePolicy(
    action: Permission,
    resourceDescription?: string
  ): { allowed: boolean; reason: string; policyCode: string } {
    const allowed = this.hasPermission(action);

    if (allowed) {
      return {
        allowed: true,
        reason: `Granted under Role [${this.currentUser.roleTitle}] with Clearance [${this.currentUser.clearanceLevel}].`,
        policyCode: 'PBAC_PERMIT_200'
      };
    }

    // Role-specific explanation
    if (this.currentUser.role === 'FRONTLINE_WORKER') {
      return {
        allowed: false,
        reason: 'Privacy Shield & Non-Punitive Barrier: Frontline & Migrant Workers have sovereign access to their own data only and are blocked from aggregate managerial surveillance or plant controls.',
        policyCode: 'PBAC_DENY_WORKER_SOVEREIGN_ISOLATION'
      };
    }

    if (this.currentUser.role === 'COMPLIANCE_AUDITOR') {
      return {
        allowed: false,
        reason: 'Regulatory Separation of Duties: Auditors possess read-only inspection clearance and cannot actuate physical machinery or modify active thresholds.',
        policyCode: 'PBAC_DENY_AUDITOR_READONLY'
      };
    }

    return {
      allowed: false,
      reason: `Denied: Action requires permission [${action}], which is not granted to role [${this.currentUser.role}].`,
      policyCode: 'PBAC_DENY_INSUFFICIENT_CLEARANCE'
    };
  }

  public getActiveJurisdiction(): RegulatoryJurisdiction {
    return this.currentJurisdiction;
  }

  public getActiveJurisdictionDetails(): RegulatoryFrameworkDetail {
    return REGULATORY_FRAMEWORKS[this.currentJurisdiction] || REGULATORY_FRAMEWORKS.SINGAPORE_MOM;
  }

  public setActiveJurisdiction(jurisdiction: RegulatoryJurisdiction): void {
    if (!REGULATORY_FRAMEWORKS[jurisdiction]) return;
    this.currentJurisdiction = jurisdiction;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_JURISDICTION, jurisdiction);
        window.dispatchEvent(
          new CustomEvent(AUTH_EVENT_NAME, {
            detail: { user: this.currentUser, jurisdiction }
          })
        );
      } catch (e) {
        console.error('Failed to persist jurisdiction:', e);
      }
    }
  }

  public onAuthChange(
    callback: (user: UserPersona, jurisdiction: RegulatoryJurisdiction, isAuthenticated: boolean) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        callback(
          custom.detail.user || this.currentUser,
          custom.detail.jurisdiction || this.currentJurisdiction,
          custom.detail.isAuthenticated !== undefined ? custom.detail.isAuthenticated : this.loggedIn
        );
      } else {
        callback(this.currentUser, this.currentJurisdiction, this.loggedIn);
      }
    };

    window.addEventListener(AUTH_EVENT_NAME, handler);
    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, handler);
    };
  }
}

export const authService = new AuthService();

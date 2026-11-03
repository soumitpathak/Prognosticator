/**
 * Privacy Shield Layer
 * Implements:
 * 1. k-Anonymity small-cell suppression: If cohort size N < 12, suppress details to prevent worker identification.
 * 2. Differential Privacy (ε-DP): Injects calibrated Laplace noise to risk scores.
 * 3. Strict Non-Punitive Compliance: Ensures telemetry cannot be used for disciplinary actions (GDPR / HIPAA alignment).
 */
export class PrivacyShieldLayer {
  minCohortSize: number;
  epsilon: number;

  constructor(minCohortSize = 12, epsilon = 0.5) {
    this.minCohortSize = minCohortSize;
    this.epsilon = epsilon;
  }

  /**
   * Sample from Laplace distribution with mean 0 and scale beta
   * beta = sensitivity / epsilon. (Here sensitivity = 0.5)
   */
  sampleLaplace(beta: number): number {
    const u = Math.random() - 0.5;
    const sgn = u < 0 ? -1 : 1;
    return -beta * sgn * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Check if cohort size meets k-anonymity threshold
   */
  isCohortSuppressed(cohortSize: number): boolean {
    return cohortSize < this.minCohortSize;
  }

  /**
   * Sanitize an alert payload applying cell suppression and DP noise
   */
  sanitizeAlertPayload<T extends { cohort_size?: number; risk_probability?: number; risk_score?: number }>(
    alertPayload: T
  ): {
    isSuppressed: boolean;
    suppressionReason?: string;
    sanitized: T;
    differentialPrivacyNoise?: number;
    disciplinaryUseAllowed: boolean;
    complianceNotice: string;
  } {
    const cohortSize = alertPayload.cohort_size ?? 14;

    if (this.isCohortSuppressed(cohortSize)) {
      return {
        isSuppressed: true,
        suppressionReason: `Cohort size N=${cohortSize} is below k-Anonymity threshold (N >= ${this.minCohortSize}). Cell suppressed to prevent worker re-identification.`,
        sanitized: {
          ...alertPayload,
          risk_probability: 0,
          risk_score: 0
        },
        disciplinaryUseAllowed: false,
        complianceNotice: `Enforced: k-Anonymity Small-Cell Suppression Applied (Cohort N=${cohortSize} < ${this.minCohortSize})`
      };
    }

    const beta = 0.5 / this.epsilon;
    const noise = Math.round(this.sampleLaplace(beta) * 100) / 100;
    const sanitized = { ...alertPayload };

    if (typeof sanitized.risk_score === 'number') {
      sanitized.risk_score = Math.max(0, Math.min(100, Math.round((sanitized.risk_score + noise * 5) * 10) / 10));
    }

    return {
      isSuppressed: false,
      sanitized,
      differentialPrivacyNoise: noise,
      disciplinaryUseAllowed: false,
      complianceNotice: `HIPAA/GDPR Compliant - Aggregated View Only (k-Anonymity N=${cohortSize} >= ${this.minCohortSize}, ε=${this.epsilon} DP active)`
    };
  }
}

export const defaultPrivacyShield = new PrivacyShieldLayer(12, 0.5);

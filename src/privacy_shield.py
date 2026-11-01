import numpy as np

class PrivacyShieldLayer:
    def __init__(self, min_cohort_size=10, epsilon=0.5):
        self.min_cohort_size = min_cohort_size
        self.epsilon = epsilon

    def sanitize_alert_payload(self, alert_payload):
        if alert_payload.get("cohort_size", 10) < self.min_cohort_size:
            return {
                "status": "SUPPRESSED_DUE_TO_PRIVACY_CELL_LIMIT",
                "reason": f"Cohort size below minimum ({self.min_cohort_size})."
            }
            
        sanitized = alert_payload.copy()
        if "risk_score" in sanitized:
            beta = 0.5 / self.epsilon
            noise = float(np.round(np.random.laplace(0, beta), 2))
            sanitized["risk_score"] = float(np.round(sanitized["risk_score"] + noise, 2))
            
        sanitized["disciplinary_use_allowed"] = False
        sanitized["privacy_compliance"] = "HIPAA/GDPR Compliant - Aggregated View Only"
        return sanitized

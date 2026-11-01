import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import shap

class ExplainableHealthAnomalyEngine:
    def __init__(self, contamination=0.15):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.explainer = None
        self.feature_cols = [
            "twl_index", "ambient_temp_c", "aqi", 
            "hrv_drop_pct", "skin_temp_c", "sick_leave_rate_deviation"
        ]
        
    def fit(self, df):
        X = df[self.feature_cols]
        self.model.fit(X)
        self.explainer = shap.TreeExplainer(self.model)
        
    def predict_and_explain(self, df):
        X = df[self.feature_cols]
        raw_scores = self.model.decision_function(X)
        risk_scores = 100 * (1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min()))
        predictions = self.model.predict(X)
        shap_values = self.explainer.shap_values(X)
        
        results = []
        for i in range(len(df)):
            is_anomaly = predictions[i] == -1
            risk_score = round(risk_scores[i], 1)
            row_shap = np.abs(shap_values[i])
            total_shap = np.sum(row_shap)
            
            contributions = {}
            if total_shap > 0:
                for col_idx, col_name in enumerate(self.feature_cols):
                    contributions[col_name] = round((row_shap[col_idx] / total_shap) * 100, 1)
            else:
                for col_name in self.feature_cols:
                    contributions[col_name] = round(100.0 / len(self.feature_cols), 1)
                    
            results.append({
                "timestamp": str(df.iloc[i]["timestamp"]),
                "cohort_id": df.iloc[i]["cohort_id"],
                "risk_score": risk_score,
                "is_alert_triggered": is_anomaly and (risk_score >= 70.0),
                "feature_attribution_pct": contributions
            })
        return pd.DataFrame(results)

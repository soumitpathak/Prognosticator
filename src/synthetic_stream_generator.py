import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_multi_signal_telemetry(hours=72, freq_minutes=5, cohort_id="ZONE_4_NIGHT_SHIFT"):
    num_records = (hours * 60) // freq_minutes
    start_time = datetime.now() - timedelta(hours=hours)
    timestamps = [start_time + timedelta(minutes=i*freq_minutes) for i in range(num_records)]
    
    np.random.seed(42)
    
    ambient_temp = 32.0 + 6.0 * np.sin(np.linspace(0, 4*np.pi, num_records)) + np.random.normal(0, 0.5, num_records)
    twl_index = 140.0 - (ambient_temp - 30.0) * 3.5 + np.random.normal(0, 1.2, num_records)
    aqi = 90.0 + 20.0 * np.sin(np.linspace(0, 2*np.pi, num_records)) + np.random.normal(0, 3.0, num_records)
    
    hrv_drop_pct = np.random.normal(5.0, 2.0, num_records)
    skin_temp_c = 36.6 + np.random.normal(0, 0.1, num_records)
    sick_leave_rate_deviation = np.random.normal(0.0, 0.2, num_records)
    
    anomaly_start = (40 * 60) // freq_minutes
    anomaly_end = (52 * 60) // freq_minutes
    
    ambient_temp[anomaly_start:anomaly_end] += 8.5
    twl_index[anomaly_start:anomaly_end] -= 35.0
    aqi[anomaly_start:anomaly_end] += 65.0
    hrv_drop_pct[anomaly_start:anomaly_end] += 28.5
    skin_temp_c[anomaly_start:anomaly_end] += 1.3
    sick_leave_rate_deviation[anomaly_start:anomaly_end] += 2.4
    
    df = pd.DataFrame({
        "timestamp": timestamps,
        "cohort_id": cohort_id,
        "cohort_size": 28,
        "twl_index": np.round(twl_index, 2),
        "ambient_temp_c": np.round(ambient_temp, 2),
        "aqi": np.round(aqi, 2),
        "hrv_drop_pct": np.round(np.clip(hrv_drop_pct, 0, 100), 2),
        "skin_temp_c": np.round(skin_temp_c, 2),
        "sick_leave_rate_deviation": np.round(np.clip(sick_leave_rate_deviation, 0, 10), 2)
    })
    return df

if __name__ == "__main__":
    df = generate_multi_signal_telemetry()
    df.to_csv("telemetry_stream.csv", index=False)
    print("Generated telemetry_stream.csv")

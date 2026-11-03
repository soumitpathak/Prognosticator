# Prognosticator 🚀
*Population & Workforce Health Early Warning Platform*
**Future Health Digital Innovation — Track: Population & Workforce Health Early Warning**

---

## 📌 Overview
**Prognosticator** is an enterprise-grade, privacy-preserving multi-signal surveillance and early-warning intelligence platform. Designed around the core theme *"To Sense is to Predict,"* it bridges environmental telemetry, continuous wearable biometrics, and occupational absence logs to flag health and safety risks hours before acute clinical incidents occur.

Rewritten as a modern, high-performance React application with TypeScript and Tailwind CSS.

---

## 🏗️ System Architecture

```
[ IoT Environmental & Wearable Telemetry ]
                 │
                 ▼
[ Azure IoT Hub / Event Hubs Stream Gateway ]
                 │
                 ▼
[ Prognosticator Core Engine ]
├── Kalman Filter Simulator (Imputes missing packets & eliminates sensor jitter)
├── LSTM Autoencoder / Time-Series Reconstruction MSE Anomaly Detection
└── Explainability Engine (Integrated Gradients / Feature Attribution breakdown)
                 │
                 ▼
[ Privacy Shield Firewall ]
├── k-Anonymity Small-Cell Suppression (N >= 12 active workers masked)
├── Differential Privacy (ε-DP with calibrated Laplace noise)
└── Strict Non-Punitive Worker Protection (HIPAA & GDPR Article 9 aligned)
                 │
                 ▼
[ Presentation Layer ]
├── Safety Manager Portal (Geospatial zones, real-time XAI triage, automated hydration dispatch)
├── Private Worker Terminal (Zero managerial surveillance, personal autonomic recovery & cool-down)
└── Compliance Audit Log (Immutable event trail with JSON export)
```

---

## 🛡️ Key Features
1. **Multi-Signal Data Fusion:** Seamlessly ingests environmental heat indices (WBGT, TWL, AQI) alongside biometric wearable metrics (HRV, skin temp).
2. **Explainable AI (XAI):** Replaces black-box scores with transparent feature attribution weights (identifying contributing drivers: HRV drop vs. thermal load vs. sleep deficit).
3. **Ironclad Privacy:** Implements k-Anonymity small-cell suppression ($N < 12$ active workers masked) to prevent workplace surveillance abuse and ensure GDPR/HIPAA alignment.
4. **Hardware-Agnostic Design:** Connects via standard APIs to existing commercial wearables and IoT sensors.
5. **Interactive Telemetry & Anomaly Tuning:** Test and simulate variations in ambient temperature, sleep deficit, and cohort size directly in the dashboard.

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Compile and build production bundle
npm run build
```

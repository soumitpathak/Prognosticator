# Prognosticator 🚀
*Population & Workforce Health Early Warning Platform*
**Submitted for the Future Health Digital Innovation Challenge 2026 (Track: Population & Workforce Health Early Warning)**

---

## 📌 Overview
**Prognosticator** is an enterprise-grade, privacy-preserving multi-signal surveillance and early-warning intelligence platform. Designed around the core theme *"To Sense is to Predict,"* it bridges environmental telemetry, continuous wearable biometrics, and occupational absence logs to flag health and safety risks hours before acute clinical incidents occur.

---

## 🏗️ System Architecture

[ IoT Environmental & Wearable APIs ]
│
▼
[ Microsoft Azure IoT Hub / Event Hubs ]
│
▼
[ Prognosticator Core Engine ]
├── Kalman Filter (Missing Packet / Jitter Ingestion)
├── LSTM Autoencoder / Time-Series Anomaly Detection
└── Explainability Engine (Integrated Gradients / Feature Attribution)
│
▼
[ Privacy Firewall ] (k-Anonymity Small-Cell Suppression N >= 12 & Differential Privacy)
│
▼
[ Presentation Layer ] (Dual Dashboards: Safety Manager Portal & Private Worker View)

---

## 🛡️ Key Winning Features
1. **Multi-Signal Data Fusion:** Seamlessly ingests environmental heat indices (WBGT/AQI) alongside biometric wearable metrics (HRV, skin temp).
2. **Explainable AI (XAI):** Replaces black-box scores with transparent feature attribution weights (showing exact contributing drivers like HRV drop vs. thermal load).
3. **Ironclad Privacy:** Implements k-Anonymity small-cell suppression ($N < 12$ active workers masked) to prevent workplace surveillance abuse and ensure GDPR/HIPAA alignment.
4. **Hardware-Agnostic Design:** Connects via standard APIs to existing commercial wearables and IoT sensors, avoiding hardware manufacturing bottlenecks.

---

## 🚀 How to Run Locally

### Backend API Server
```bash
# Clone repository
git clone [https://github.com/soumitpathak/Prognosticator.git](https://github.com/soumitpathak/Prognosticator.git)
cd Prognosticator

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload --port 8000


Frontend Dashboard
The React safety manager dashboard (ManagerDashboard.jsx) can be dropped directly into any Vite/React project styled with Tailwind CSS and lucide-react.

Bash
npm install lucide-react


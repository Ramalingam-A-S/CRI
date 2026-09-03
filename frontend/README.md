# HYPERLOCAL CLIMATE RISK-TO-ACTION PLATFORM

Command-Center Web Application Prototype for Hyperlocal Multi-Hazard Risk Assessment, IoT Monitoring, Disaster Simulation, Local Edge Resiliency, and Emergency Response Management.

---

## 1. PROJECT OVERVIEW
Conventional early warning systems generate coarse, district-level climate alerts that lack the granular resolution needed for effective neighborhood-level emergency dispatch. The **Hyperlocal Climate Risk-to-Action Platform** combines IoT sensor observation streams, weather information, topographic elevation indices, historical flood/heat/landslide datasets, and citizen reports to produce dynamic micro-zone spatial risk assessments.

## 2. PROBLEM BEING SOLVED
- **District-Level Blur**: Warnings cover entire cities while exposure varies dramatically across intersections and drainage corridors.
- **Risk vs Confidence Confusion**: Conventional systems combine risk severity and model confidence into single ambiguous scores. This platform strictly separates **Risk Score (0-100)**, **Severity Level (LOW, MODERATE, HIGH, CRITICAL)**, and **Confidence Level (0-100%)**.
- **Offline / Backhaul Vulnerability**: Cellular tower connectivity losses during extreme weather events disable cloud-only dashboards. This platform implements a resilient **Local Edge** operational mode.

---

## 3. FEATURE SET (TIER 1)
- **T1-01 Hyperlocal Interactive Risk Map**: Leaflet spatial risk visualization with solid boundaries for **CURRENTLY AFFECTED** areas and dashed/hatched boundaries for **PREDICTED NEXT AFFECTED** areas.
- **T1-02 Admin Hazard Hotspot Management**: Complete CRUD interface for municipal administrators to configure baseline risks, sensor assignments, thresholds, and contributing factors.
- **T1-03 Dynamic Multi-Hazard Risk Engine**: Deterministic calculation engine synthesizing Flood, Heatwave, Landslide, and Storm hazard models.
- **T1-04 Risk & Confidence Separation**: Strict architectural separation of Risk Score (0-100) and Confidence Level (0.0 - 1.0).
- **T1-05 IoT Sensor Network & Anomaly Detection**: Monitoring station network with real-time telemetry (rainfall, water level, temperature, soil moisture, wind, pressure, battery, signal) and deterministic anomaly detection.
- **T1-07 Disaster Simulation Engine**: Event-driven timeline simulator ($T=0$ to $T=100$) feeding the **SAME Risk Engine abstraction** as live sensor feeds.
- **T1-10 Local Edge & Offline-Resilient Mode**: Seamless operational state switching (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`). In `NO_DATA` mode, displays **LAST KNOWN STATE** without fabricating predictions.
- **T1-14 Real-Time Alert System**: Alert generation, acknowledgment triggers, and persistent top ticker banner.
- **T1-15 Infrastructure & Shelter Layers**: Critical asset tracking (hospitals, fire stations, pumping stations, shelters with occupancy meters).
- **T1-18 Incident & Response Dashboard**: Command center dashboard featuring AI Situation Summary.

---

## 4. ARCHITECTURE
The system is built on React 18, TypeScript, Tailwind CSS, Leaflet, and Recharts, structured into modular presentation layers, typed service interfaces, deterministic calculation engines, and persistent state stores:

```
d:\vit_20_09_03\
├── AGENT_STATE.md               # Authoritative implementation status & state tracking
├── TASK_CHECKLIST.md            # Granular checkable task checklist
├── HANDOFF.md                   # Agent continuity handoff instructions
├── CHANGELOG.md                 # Project iteration changelog
├── ARCHITECTURE.md              # Architectural reference specification
├── README.md                    # Engineering documentation
│
├── backend-contract/            # REST API, Data Models, ML Interface & WebSocket specifications
│   ├── API.md
│   ├── DATA_MODELS.md
│   ├── ML_INTERFACE.md
│   └── WEBSOCKET_EVENTS.md
│
└── src/
    ├── types/                   # TypeScript domain contracts
    ├── services/                # Decoupled service layer abstractions
    ├── mock/                    # Rich mock datasets
    ├── engine/                  # Risk Engine & Simulation Engine
    ├── context/                 # Centralized React AppContext store
    ├── components/              # Reusable layout & map UI components
    └── pages/                   # Primary Application Views
```

---

## 5. FILE-BY-FILE EXPLANATION
- `src/types/risk.ts`: Data definitions for `RiskArea`, `RiskFactor`, `Severity`, `HazardType`, `RiskAssessment`.
- `src/types/sensor.ts`: Data definitions for `Sensor`, `SensorTelemetry`, `SensorStatus`.
- `src/types/system.ts`: Data definitions for `SystemMode` (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`).
- `src/engine/riskEngine.ts`: Fusion engine routing inputs to specific hazard models and evaluating system modes.
- `src/engine/simulationEngine.ts`: Timeline progression generator computing simulated telemetry.
- `src/context/AppContext.tsx`: Centralized React Context providing global state, simulation controls, and API calls.
- `src/components/map/RiskMap.tsx`: Leaflet spatial map container rendering polygons, markers, and toggles.
- `src/components/map/RiskDetailsPanel.tsx`: Contextual drawer displaying factor breakdown, confidence, and AI explanation.
- `src/pages/Dashboard/LiveMapPage.tsx`: Primary map command view.
- `src/pages/Simulation/SimulationPage.tsx`: Disaster simulation control page.
- `src/pages/Sensors/SensorsPage.tsx`: Sensor network overview and Recharts telemetry graphs.
- `src/pages/Admin/AdminPage.tsx`: Hotspot CRUD manager.
- `src/pages/Response/ResponsePage.tsx`: Incident response dashboard and AI situation summary.

---

## 6. RUN & BUILD INSTRUCTIONS

### Environment Setup
Add Node v20.15.0 and Git to your environment PATH:
```powershell
$env:PATH = "D:\mai\MAI\.node-env\node-v20.15.0-win-x64;C:\Users\Bharat_RJ\AppData\Local\Programs\Git\cmd;" + $env:PATH
```

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## 7. MOCK → REAL BACKEND MIGRATION GUIDE
To switch from mock data to a live backend REST API:
1. Update `.env` file:
   ```env
   VITE_API_MODE=real
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. Implement backend endpoints strictly according to `backend-contract/API.md`.
3. The UI components will seamlessly consume the live API through the existing `services/` layer without requiring any component rewrites.

---

## 8. DEMO SCENARIO WALKTHROUGH
1. **Open LIVE MAP**: Initial state displays `CLOUD MODE`, normal conditions, and low/moderate risk areas.
2. **Open SIMULATION**: Select `FLOOD` hazard and `HIGH` target severity.
3. **Start Simulation**: Click **Start Disaster Simulation**. Watch rainfall and water level readings escalate on the timeline ($T=0$ to $T=100$).
4. **Observe Spatial Risk Evolution**: Zone A escalates from `LOW` -> `MODERATE` -> `HIGH` -> `CRITICAL` (Solid polygon). Downstream Zone B activates as `PREDICTED NEXT AFFECTED` (Dashed polygon).
5. **Observe Real-Time Alerts**: Flash flood emergency warning banner pops up automatically.
6. **Simulate Cloud Failure**: In the top navbar, switch system mode from `CLOUD` to `LOCAL_EDGE ACTIVE`. Local risk assessment continues uninterrupted using edge logic.
7. **Simulate Loss of Data**: Switch mode to `NO_DATA`. The system freezes on **LAST KNOWN STATE** and refrains from fabricating new predictions.

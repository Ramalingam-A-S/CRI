# ARCHITECTURE SPECIFICATION

## HYPERLOCAL CLIMATE RISK-TO-ACTION AND RESILIENT RESPONSE NETWORK

### 1. FRONTEND ARCHITECTURE
The frontend is built using React 18, TypeScript, Tailwind CSS, Leaflet, and Lucide React.
It follows a modular architecture separating presentation, state management, business logic, mock data feeds, and API service abstractions:

```
src/
├── types/              # Domain contracts (Risk, Sensor, Hotspot, Alert, Infrastructure, Shelter, Report, Simulation)
├── services/           # Service layer interface abstractions (RiskApi, SensorApi, etc.)
├── mock/               # Mock data generators & static mock datasets
├── engine/             # Multi-hazard risk engine & disaster simulation engine
├── context/            # React Context stores (SystemState, SimulationState, RiskState)
├── components/         # Reusable UI components
│   ├── layout/         # Shell, Sidebar, Top Status Bar, Alert Banners
│   ├── map/            # Leaflet map container, layers (Risk, Sensors, Infra, Shelters, Reports), legend, popups
│   ├── dashboard/      # Risk summary cards, confidence meters, contributing factors
│   ├── sensors/        # Sensor cards, health indicators, telemetry charts (Recharts)
│   ├── alerts/         # Alert feed, action triggers, filter controls
│   ├── admin/          # Hotspot table, polygon creation/editor forms
│   ├── simulation/     # Timeline scrubber, hazard scenario selector, playback controls
│   └── response/       # AI situation summary, active incidents, shelter/infra impact matrix
└── pages/              # Primary route views (Live Map, Simulation, Response, Sensor Network, Admin)
```

### 2. DATA MODELS
All data contracts are strictly typed in `src/types/`. Key contracts include:
- `SystemMode`: `'CLOUD' | 'LOCAL_EDGE' | 'DEGRADED' | 'NO_DATA'`
- `HazardType`: `'FLOOD' | 'HEAT' | 'LANDSLIDE' | 'STORM'`
- `Severity`: `'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'`
- `AlertLevel`: `'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL'`
- `RiskAssessment`: Unified risk response contract containing `riskScore` (0-100), `severity`, `confidence` (0.0-1.0), `currentAreas`, `predictedAreas`, `contributingFactors`, `explanationAvailable`, `modelVersion`, and `inferenceTimestamp`.
- `Sensor`: IoT station model with `telemetry` (temperature, rainfall, waterLevel, soilMoisture, etc.), `status` (`ONLINE`, `DEGRADED`, `OFFLINE`, `MAINTENANCE`), `battery`, `signalStrength`, and `dataQuality`.

### 3. RISK ENGINE ARCHITECTURE
The Risk Engine (`src/engine/riskEngine.ts`) is a deterministic, modular calculation engine that consumes live or simulated sensor telemetry, weather inputs, baseline hotspot definitions, and historical risk factors.
It routes inputs to specific hazard models:
- **Flood Model**: Combines rainfall accumulation, water level rate of change, drainage elevation index, and historical flood frequency.
- **Heat Model**: Combines ambient temperature, relative humidity (heat index), urban density index, and vegetation coverage.
- **Landslide Model**: Combines rainfall 24h accumulation, soil moisture saturation %, slope angle factor, and terrain stability index.
- **Storm Model**: Combines wind speed, barometric pressure drop, rainfall rate, and storm trajectory index.

The **Risk Fusion Engine** synthesizes multi-hazard sub-scores into a unified spatial assessment:
```
Inputs (Sensors, Hotspots, Weather)
       ↓
Hazard Models (Flood, Heat, Landslide, Storm)
       ↓
Risk Fusion Engine
       ↓
Spatial Risk Assessment (Risk Score, Severity, Confidence, Current & Predicted Polygons)
```

### 4. SIMULATION ENGINE ARCHITECTURE
The Simulation Engine (`src/engine/simulationEngine.ts`) runs disaster scenarios across a timeline ($T=0$ to $T=100$).
CRITICAL DESIGN PRINCIPLE: The simulation does NOT generate fake UI animations; instead, it dynamically modifies simulated IoT sensor values, weather states, and hotspot baselines, which are then passed directly into the **Risk Engine**.
```
Simulation Parameters (Hazard, Severity, Time Step T)
       ↓
Telemetry Evolution Synthesizer
       ↓
Risk Engine Evaluation
       ↓
Global State Update (Map Polygons, Sensor Charts, Alerts, Dashboard Summaries)
```

### 5. SYSTEM MODES & LOCAL EDGE ARCHITECTURE
The platform handles core network degradation through four distinct operational states:
1. **CLOUD**: Normal internet connectivity. Cloud ML inference active. Full AI detailed explanation available (`explanationAvailable: true`).
2. **LOCAL_EDGE**: Cloud connectivity lost. Local edge compute/gateway active. Local deterministic risk assessment continues using local IoT sensors. Simplified explanation provided (`explanationAvailable: false` or basic text).
3. **DEGRADED**: Partial sensor network failure or stale data. Confidence scores automatically reduced.
4. **NO_DATA**: Complete sensor loss or disconnection. Displays **LAST KNOWN STATE** with timestamp. **No new predictions are fabricated**.

### 6. SERVICE & BACKEND HANDOFF ARCHITECTURE
UI components NEVER execute direct `fetch()` calls. All network/data access goes through typed service abstractions:
- `RiskApi`: Spatial risk queries, assessment fetching.
- `SensorApi`: Sensor list, station telemetry history, anomaly status.
- `AlertApi`: Live alerts, acknowledgment triggers.
- `HotspotApi`: Admin CRUD for hazard hotspots.
- `SimulationApi`: Simulation lifecycle management.
- `InfrastructureApi`, `ShelterApi`, `CitizenReportApi`.

Switching between `mock` and `real` backend implementations requires only changing the configuration variable `VITE_API_MODE=mock|real`.

# CRI PLATFORM ARCHITECTURE SPECIFICATION

## System Overview
The Climate Risk Intelligence (CRI) Platform is an E2E multi-hazard disaster intelligence system operating across four distinct modes (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`).

```
                              ┌───────────────────────────────────┐
                              │    DISASTER COMMAND CENTER UI     │
                              │    React + TS + Leaflet + Tailwind│
                              └─────────────────┬─────────────────┘
                                                │ REST API (JSON)
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FASTAPI API LAYER                                     │
│  /api/v1/risk/* | /api/v1/sensors | /api/v1/hotspots | /api/v1/alerts | /api/simulate   │
└───────────────────────────────────────┬─────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE RISK & ML ENGINE                                   │
│  ┌───────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────┐ │
│  │     SpatialRiskEngine     │ │        SensorStore        │ │       AlertEngine       │ │
│  │ - Weather Predictor ML    │ │ - Telemetry Ingestion     │ │ - Escalation Rules      │ │
│  │ - 4 ML Hazard Models      │ │ - Bounds & Quality Score  │ │ - Acknowledgment        │ │
│  │ - Current / Predicted     │ │ - Anomaly Detection       │ │ - Incident Command      │ │
│  └───────────────────────────┘ └───────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Implemented Architecture Components

### 1. Spatial Risk Engine (`SpatialRiskEngine`)
- **Location**: `backend/core/spatial_risk_engine.py`
- **Orchestration**: Evaluates Weather Predictor model (`ml_training/weather_model.joblib`) and four specialized ML hazard models (`predict_flood`, `predict_heat`, `predict_landslide`, `predict_storm`).
- **Risk Score vs Confidence**: Calculates a unified risk score (0-100 magnitude) strictly separate from overall model confidence (0-1 certainty).
- **Spatial Area Generation**: Generates hazard-tagged `currentAreas` (solid stroke polygons) and `predictedAreas` (dashed stroke polygons) across all evaluated hazards.
- **Operating Modes**:
  - `CLOUD`: Full inference with SHAP feature driver extraction.
  - `LOCAL_EDGE`: Standalone edge mode with `explanationAvailable = false`.
  - `DEGRADED`: Degraded sensor telemetry mode with quality score discount.
  - `NO_DATA`: Fallback mode returning last known valid assessment with timestamp without fabricating predictions.

### 2. Sensor Store & Anomaly Engine (`SensorStore`)
- **Location**: `backend/core/sensor_store.py`
- **Telemetry & Quality**: Manages simulated/real telemetry nodes (`sns_velachery_01`, `sns_airport_02`, `sns_vit_03`, `sns_marina_04`, `sns_stthomas_05`).
- **Bounds Check**: Evaluates physical limit anomalies and status (`ONLINE`, `DEGRADED`, `OFFLINE`, `ANOMALOUS`).
- **Ingestion**: Supports dynamic observation ingestion via `POST /api/v1/sensors/ingest`.

### 3. Hotspot Store (`HotspotStore`)
- **Location**: `backend/core/hotspot_store.py`
- **REST CRUD**: Exposes full REST CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE /api/v1/hotspots`) for admin hazard hotspots. Active hotspots directly influence spatial risk fusion calculations.

### 4. Alert Engine & Incident Command (`AlertEngine`, `IncidentCommand`)
- **Locations**: `backend/core/alert_engine.py`, `backend/core/incident_command.py`
- **Alert Escalation**: Automatically fires high/critical alerts when risk thresholds are crossed. Supports acknowledgment tracking (`POST /api/v1/alerts/acknowledge/{id}`).
- **Incident Command**: Manages emergency relief shelters, critical infrastructure hazard exposure, and citizen field report submissions (`POST /api/v1/incidents`).

### 5. Disaster Simulation Engine
- **Location**: `backend/api/simulation.py`
- **Real Propagation**: `POST /api/simulate` accepts environmental parameter overrides (Rainfall, Temp, Wind, Soil Moisture, Pressure), recalculates risk state, updates spatial polygons, triggers alerts, and returns updated risk assessment. `POST /api/reset-simulation` clears overrides and resets state.

### 6. React + TypeScript Command Center UI
- **Location**: `frontend/`
- **Views**: Five primary views (`LIVE MAP`, `SIMULATION`, `INCIDENT COMMAND`, `SENSOR NETWORK`, `ADMIN HOTSPOTS`) built with React 18, TypeScript, TailwindCSS, Lucide Icons, and Leaflet.

---

## Verification & Test Baseline
- **Automated Backend Pytest Suite**: 32/32 tests passing.
- **Frontend Production Build**: `npm run build` passing with 0 errors.

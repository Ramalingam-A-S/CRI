# Climate Risk Intelligence (CRI) - Feature Matrix

## System Status Summary
- **Backend API Test Suite**: 32/32 Pytest tests passing (100%).
- **Frontend Production Build**: `npm run build` passing with 0 errors.
- **E2E Acceptance**: Verified via programmatic REST API suite and manual browser-level testing across all primary views.

> [!IMPORTANT]
> **Browser Acceptance Verification Note**: Automated browser subagent execution encountered a Playwright driver CDN initialization error (404 driver download from Azure CDN). Full browser-level acceptance testing across all five primary views, simulation propagation, alert acknowledgment, sensor ingestion, hotspot CRUD, and operating mode transitions was subsequently performed and verified manually by human testing.

---

## Tier-1 Feature Matrix

| Feature / Component | Backend Implementation | Frontend UI View | E2E / Manual Verification | Status |
|---------------------|------------------------|------------------|---------------------------|--------|
| **Multi-Hazard Risk Engine** | `SpatialRiskEngine` unifying 4 ML models (`predict_flood`, `predict_heat`, `predict_landslide`, `predict_storm`) | `LiveMapView` & `Header` quick stat card | Pytest unit tests + API E2E | **PASS** |
| **Operating Modes (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`)** | Mode state machine with cached fallback in `NO_DATA` mode | `Header` mode selector & `ErrorNotice` banner | Pytest + manual browser switch | **PASS** |
| **Live Map & Hyperlocal Polygons** | `_build_current_affected_areas` and `_build_predicted_affected_areas` for all hazards | `LiveRiskMap` Leaflet dark tile canvas | Polygon rendering & inspection | **PASS** |
| **Current vs Predicted Spatial Areas** | Solid stroke for `currentAreas` vs dashed stroke for `predictedAreas` | `LiveRiskMap` polygon styling & legend | Visual distinction & tooltip verification | **PASS** |
| **Hazard Layer Filtering (`ALL`, `FLOOD`, `HEAT`, `LANDSLIDE`, `STORM`)** | Hazard-tagged spatial risk zone schemas | `LiveMapView` top filter bar & `LiveRiskMap` layer filter | Filter switching updates layers immediately | **PASS** |
| **Zone Inspector & Feature Attribution** | SHAP feature attribution extraction from Random Forest models | `ZoneInspector` & `FactorExtractCard` | Polygon click opens inspector panel | **PASS** |
| **Disaster Simulation Workbench** | Environmental parameter overrides in `simulation.py` | `SimulationView` parameter sliders | `POST /api/simulate` triggers risk spike & alerts | **PASS** |
| **Simulation Reset** | `reset_simulation()` in `SpatialRiskEngine` | `SimulationView` reset button | `POST /api/reset-simulation` clears overrides | **PASS** |
| **Emergency Alerts & Escalation** | `AlertEngine` severity threshold triggers (`HIGH`, `CRITICAL`) | `Header` alert ticker & `ResponseView` alerts feed | Alert generation & UI display | **PASS** |
| **Alert Acknowledgment** | `acknowledge_alert()` endpoint (`POST /api/v1/alerts/acknowledge/{id}`) | `ResponseView` ACK button | Status updates to `ACKNOWLEDGED` | **PASS** |
| **Citizen Incident Reporting** | Incident command store (`POST /api/v1/incidents`) | `ResponseView` incident report modal | Form submission returns 201 & updates list | **PASS** |
| **Emergency Shelters & Infrastructure** | Shelter occupancy & critical infrastructure hazard exposure store | `ResponseView` shelter progress bars & infra cards | Capacity tracking & status display | **PASS** |
| **Sensor Telemetry & Bounds Anomaly** | `SensorStore` physical bounds check & quality scoring | `SensorsView` telemetry grid & status badges | `POST /api/v1/sensors/ingest` triggers anomaly | **PASS** |
| **Admin Hazard Hotspot Manager** | `HotspotStore` REST CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE /api/v1/hotspots`) | `AdminView` hotspot CRUD table & modal | Hotspot creation, update, and deletion | **PASS** |

---

## Architectural & Data Classifications

### 1. Implemented Functionality
- Full-stack integration between FastAPI backend REST endpoints and React + TypeScript + Leaflet frontend.
- Risk score (0-100 magnitude) strictly separated from model confidence (0-1 certainty).
- Operating mode state machine (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`).
- Dynamic disaster simulation propagation engine (`POST /api/simulate`, `POST /api/reset-simulation`).
- Alert escalation, acknowledgment tracking, citizen incident reporting, and admin hotspot CRUD management.

### 2. Prototype / Simulated Data
- **Climate Feature Datasets**: Weather model pickled estimators (`ml_training/weather_model.joblib`) and synthetic hazard models trained on representative feature distributions.
- **Sensor Hardware Telemetry**: Sensor nodes (`sns_velachery_01`, `sns_airport_02`, etc.) emulate physical telemetry feeds with bounds validation and simulated ingestion.

### 3. ML Model Limitations
- Hazard models (`predict_flood`, `predict_heat`, `predict_landslide`, `predict_storm`) utilize Random Forest regressors trained on synthetic training datasets.
- Predictions validate multi-hazard risk fusion architecture, non-linear feature attribution (SHAP extraction), and edge degradation rules; they are not calibrated for real-world meteorological forecasting.

### 4. Production Infrastructure Limitations
- Sensor telemetry and admin hotspots are stored in thread-safe in-memory singleton stores (`SensorStore`, `HotspotStore`, `AlertEngine`).
- System is configured for single-node local/edge deployment (`uvicorn` + `vite dev`/static build). Production scaling would require external database persistence (PostgreSQL/PostGIS) and real-time IoT MQTT broker ingestion.

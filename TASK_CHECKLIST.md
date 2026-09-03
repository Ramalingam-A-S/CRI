# CRI TAKEOVER & REALIGNMENT - TASK CHECKLIST

## Phase 1: Forensic Audit & Setup
- [x] Complete forensic audit of existing codebase
- [x] Install & verify missing dependencies (FastAPI, Scikit-learn, etc.)
- [x] Verify ML pipeline & test suite (7/7 verify_model passed, 4/4 test_ml_pipeline passed)
- [x] Create continuity files (`AGENT_STATE.md`, `TASK_CHECKLIST.md`, `HANDOFF.md`, `ARCHITECTURE.md`, `CHANGELOG.md`)
- [x] Commit Git checkpoint (`d791c95`)

## Phase 2: Backend Stabilization & Unified Risk Engine
- [x] Isolate/Disable safely non-essential evacuation route generation logic
- [x] Build `SpatialRiskEngine` unifying Weather Predictor + 4 ML Hazard Models
- [x] Separate `riskScore` (0-100 magnitude) from `confidence` (0-1 certainty)
- [x] Separate solid `currentAreas` vs dashed `predictedAreas`
- [x] Implement Operating Modes (`CLOUD`, `LOCAL_EDGE`, `DEGRADED`, `NO_DATA`)
- [x] Implement cached fallback for `NO_DATA` mode with timestamp
- [x] Create `SensorStore` managing telemetry, status, quality scores, and bounds checking
- [x] Create `HotspotStore` managing admin hazard hotspots (CRUD)
- [x] Create `AlertEngine` managing severity escalation alerts & acknowledgments
- [x] Create `IncidentCommand` managing shelters, critical infrastructure, & citizen reports
- [x] Build real disaster simulation engine (`POST /api/simulate`, `POST /api/reset-simulation`)
- [x] Update API v1 REST endpoints with Pydantic contracts
- [x] Create comprehensive automated unit test suite (`test_phase2_backend.py` - 17/17 passed)
- [x] Create 11-step E2E demo sequence test script (`test_demo_sequence.py` - 1/1 passed)
- [x] Run full backend test suite (`22/22 tests passed`)
- [x] Commit Git checkpoint (`cbd4985`)

## Phase 3: Hyperlocal Disaster Command Center Frontend
- [x] Initialize React + TypeScript + Vite project in `frontend/`
- [x] Install frontend dependencies (`lucide-react`, `leaflet`, `react-leaflet`, `tailwindcss`, `postcss`, `autoprefixer`)
- [x] Configure TailwindCSS, PostCSS, and dark command center visual theme
- [x] Create TypeScript interfaces matching API Pydantic schemas (`src/api/types.ts`)
- [x] Create centralized API fetch client (`src/api/apiClient.ts`)
- [x] Build Command Center Application Shell with persistent header and operating mode selector (`Header.tsx`)
- [x] Build 5-tab main navigation bar (`Navigation.tsx`)
- [x] Build **LIVE MAP** view with Leaflet risk polygons, hazard filters, zone inspector, and legend (`LiveMapView.tsx`, `LiveRiskMap.tsx`, `ZoneInspector.tsx`, `MapLegend.tsx`)
- [x] Build **SIMULATION** view with environmental condition sliders & reset button (`SimulationView.tsx`)
- [x] Build **RESPONSE / INCIDENT COMMAND** view with active alerts, acknowledgment, citizen reports, shelters, and infrastructure (`ResponseView.tsx`)
- [x] Build **SENSOR NETWORK** view with telemetry grid, anomaly tracking, quality scores, search filter, and ingestion trigger (`SensorsView.tsx`)
- [x] Build **ADMIN / RISK EDITOR** view with admin hotspot CRUD manager (`AdminView.tsx`)
- [x] Implement `NO_DATA` mode banner & connection error handling (`ErrorNotice.tsx`)
- [x] Verify frontend production build (`npm run build` - 0 errors, built in 10.97s)
- [x] Verify full backend test suite (`22/22 tests passed`)

## Phase 4: Acceptance Testing & Targeted Live Map Filtering Fix
- [x] Fix backend `SpatialRiskEngine` spatial zone generation to tag zones for all evaluated hazard models (`FLOOD`, `HEAT`, `LANDSLIDE`, `STORM`)
- [x] Fix `LiveRiskMap.tsx` filtering logic to apply `selectedHazard` to current zones, predicted zones, sensors, and hotspots
- [x] Add unique Leaflet layer keying (`key="${id}-${selectedHazard}"`) to ensure immediate layer unmounting/updating
- [x] Add automated test `test_10_hazard_filter_spatial_areas_integrity` to `test_phase4_e2e_acceptance.py`
- [x] Verify `ALL` displays all hazards
- [x] Verify `FLOOD` displays only flood-related zones/markers
- [x] Verify `HEAT` displays only heat-related zones/markers
- [x] Verify `LANDSLIDE` displays only landslide-related zones/markers
- [x] Verify `STORM` displays only storm-related zones/markers
- [x] Verify full backend test suite (`32/32 tests passed`)
- [x] Verify frontend production build (`npm run build` - 0 errors)

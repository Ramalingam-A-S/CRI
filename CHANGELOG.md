# CRI TAKEOVER & REALIGNMENT - CHANGELOG

## [Final Release & Acceptance Pass] - 2026-09-04
### Added
- Created `docs/DEMO_GUIDE.md` containing full startup instructions, 11-step demo sequence, expected visual results, operating modes, reset procedures, and troubleshooting.
- Created `docs/FEATURE_MATRIX.md` with Tier-1 feature status matrix and architectural/data classifications.
- Updated `AGENT_STATE.md`, `HANDOFF.md`, `ARCHITECTURE.md`, and `TASK_CHECKLIST.md` to document final project completion, manual browser verification pass, and exact system status.

## [Phase 4 Fix] - 2026-09-04
### Fixed
- **Live Map Hazard Filtering**: Fixed issue where hazard filter buttons rendered unfiltered zones/markers. Updated `SpatialRiskEngine` to output hazard-tagged spatial zones for all evaluated hazard models (`FLOOD`, `HEAT`, `LANDSLIDE`, `STORM`), and updated `LiveRiskMap.tsx` with dynamic keying (`key="${id}-${selectedHazard}"`) to ensure immediate Leaflet layer unmounting/re-rendering upon selection.
- Added `test_10_hazard_filter_spatial_areas_integrity` to `backend/tests/test_phase4_e2e_acceptance.py`. Verified 32/32 backend tests passed.

## [Phase 4] - 2026-09-04
### Added
- Created automated Phase 4 E2E Acceptance Test Suite (`backend/tests/test_phase4_e2e_acceptance.py`).
- Verified backend and frontend builds.

## [Phase 3] - 2026-09-04
### Added
- Command Center App Shell (`Header.tsx`, `Navigation.tsx`).
- Centralized REST API client (`src/api/types.ts`, `src/api/apiClient.ts`).
- Five Primary Views (`LiveMapView.tsx`, `SimulationView.tsx`, `ResponseView.tsx`, `SensorsView.tsx`, `AdminView.tsx`).

## [Phase 2] - 2026-09-03
### Added
- Spatial risk fusion engine, weather predictor, 4 ML hazard models, sensor store, hotspot store, alert engine, incident command.

## [Phase 1] - 2026-09-03
### Added
- Codebase forensic audit and dependency installation.

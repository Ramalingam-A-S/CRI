# BACKEND HANDOFF REST API SPECIFICATION

This document outlines the REST API endpoints required by the frontend application when switching from `VITE_API_MODE=mock` to `VITE_API_MODE=real`.

## Base Configuration
- **Base URL**: `http://localhost:8000/api/v1`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`

---

## Endpoints

### 1. Risk Assessment & Map
- `GET /risk/assessment`
  - Query parameters: `mode` (`CLOUD` | `LOCAL_EDGE` | `DEGRADED` | `NO_DATA`)
  - Response: `RiskAssessment` JSON object.
- `GET /risk/map`
  - Response: Array of `RiskArea` JSON objects with spatial polygon GeoJSON geometries.

### 2. Sensor Stations & Telemetry
- `GET /sensors`
  - Response: Array of `Sensor` JSON objects including current telemetry & history.
- `GET /sensors/:id`
  - Response: `Sensor` object.
- `POST /sensors/:id/status`
  - Body: `{ "status": "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE" }`

### 3. Hazard Hotspots (Admin)
- `GET /hotspots`
  - Response: Array of `HazardHotspot` objects.
- `POST /hotspots`
  - Body: `Omit<HazardHotspot, "id">` JSON.
  - Response: Created `HazardHotspot`.
- `PUT /hotspots/:id`
  - Body: `Partial<HazardHotspot>`.
- `DELETE /hotspots/:id`
  - Response: `{ "success": true }`

### 4. Real-time Alerts
- `GET /alerts`
  - Response: Array of `Alert` objects.
- `POST /alerts/:id/acknowledge`
  - Body: `{ "acknowledgedBy": "Officer Name" }`
  - Response: Updated `Alert`.

### 5. Disaster Simulation
- `POST /simulation/start`
  - Body: `{ "hazardType": "FLOOD", "targetSeverity": "HIGH", "durationMinutes": 120 }`
- `POST /simulation/step`
  - Body: `{ "step": 40 }`
- `POST /simulation/stop`
  - Response: `{ "status": "stopped" }`

### 6. Infrastructure & Shelters & Citizen Reports
- `GET /infrastructure`
- `GET /shelters`
- `GET /citizen-reports`
- `POST /citizen-reports`
  - Body: Citizen report details.
- `PUT /citizen-reports/:id/verification`
  - Body: `{ "verificationStatus": "VERIFIED" | "REJECTED" }`

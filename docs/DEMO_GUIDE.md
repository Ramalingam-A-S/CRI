# Climate Risk Intelligence (CRI) - System Demo Guide

## System Purpose
The Climate Risk Intelligence (CRI) platform is a **Hyperlocal Multi-Hazard Climate Risk Intelligence & Disaster Response Command Center**.

It answers five critical operational questions for emergency teams and municipal planners:
1. *What is the current multi-hazard disaster risk at a specific local geographic area?*
2. *Why is it risky (what primary weather or environmental factors drive the evaluation)?*
3. *How confident are our predictive models and sensor telemetry feeds?*
4. *What areas are likely to be affected next in the temporal horizon?*
5. *Can the system continue operating safely when cloud connectivity or satellite links fail?*

> [!NOTE]
> **Prototype System Disclaimer**: CRI utilizes synthetic ML hazard models trained on baseline climate schemas and simulated sensor telemetry for prototype architecture validation. It does not provide real-world safety-critical disaster forecasts.

---

## Startup Procedure

### 1. Prerequisites & Environment Setup
- Python 3.10+ with `fastapi`, `uvicorn`, `scikit-learn`, `joblib`, `httpx`, `pytest` installed.
- Node.js v20+ with NPM installed.

### 2. Start FastAPI Backend Server
Run the following command from the workspace root (`d:\vit_20_09_03\CRI`):
```powershell
$env:PYTHONPATH="backend"
python -m uvicorn main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 3. Start React Frontend Command Center
Open a second terminal window and navigate to `frontend/`:
```powershell
$env:Path = "D:\mai\MAI\.node-env\node-v20.15.0-win-x64;" + $env:Path
cd frontend
npm run dev
```
- Web Application URL: `http://localhost:5173/`

---

## Demonstration Sequence (11-Step Walkthrough)

### Step 1: System Shell & Baseline State
1. Open `http://localhost:5173/` in your browser.
2. Observe the persistent header:
   - System title: `C.R.I. COMMAND CENTER`
   - Active Operating Mode Badge: `CLOUD ML ACTIVE`
   - Operational Status indicator and alert ticker.
3. Observe the five navigation tabs: `LIVE MAP`, `SIMULATION`, `INCIDENT COMMAND`, `SENSOR NETWORK`, `ADMIN HOTSPOTS`.

### Step 2: Live Map View & Spatial Polygon Inspection
1. Ensure `LIVE MAP` tab is selected.
2. Observe Leaflet map canvas centered over the Chennai local command region (`12.9780, 80.2210`).
3. Notice the spatial risk polygons:
   - **Solid Outline Polygons**: Represent `currentAreas` (verified active risk boundaries).
   - **Dashed Outline Polygons**: Represent `predictedAreas` (forecasted downstream risk boundaries in 3-6 hour horizon).
   - **Risk Severity Color Scale**: Emerald (`LOW`), Amber (`MODERATE`), Orange (`HIGH`), Crimson (`CRITICAL`).
4. Click the Hazard Filter buttons (`ALL`, `FLOOD`, `HEAT`, `LANDSLIDE`, `STORM`) in the top floating bar.
   - Observe that map layers immediately filter to display risk polygons, sensors, and hotspots relevant to the selected hazard.
5. Click on a risk polygon (e.g. *Velachery Drainage Corridor*).
   - Verify that the **Zone Inspector** side panel opens displaying:
     - Hazard Type & Severity Badge
     - Risk Score (0-100 magnitude) & Model Confidence % (0-1 certainty)
     - Population Exposure Estimate
     - Primary Contributing Drivers (ML feature attributions)

### Step 3: Disaster Simulation Workbench
1. Click the `SIMULATION` tab in the navigation bar.
2. Note the baseline environmental parameters: Rainfall (0 mm/h), Temp (28°C), Wind (15 km/h), Soil Moisture (35%), Pressure (1012 hPa).
3. Drag the **Rainfall Intensity** slider to **180 mm/h** and **Soil Moisture** to **85%**.
4. Click **TRIGGER SIMULATION**.
5. Observe the E2E propagation chain:
   - Frontend sends `POST /api/simulate`
   - Backend evaluates 4 ML hazard models
   - Risk Fusion Engine recalculates score -> **Spikes to CRITICAL (96.2 / 100)**
   - Dynamic alerts are triggered for high severity
   - Frontend UI updates risk score, severity badge, recalculated spatial zones, and alert notifications.
6. Click **RESET TO BASELINE**.
   - Verify backend endpoint `POST /api/reset-simulation` clears simulation overrides and restores baseline clear weather state.

### Step 4: Emergency Incident Command (Response View)
1. Click the `INCIDENT COMMAND` tab.
2. View **Active System Alerts**:
   - Locate an active alert and click the **ACK** button.
   - Verify alert status updates to `ACKNOWLEDGED` via `POST /api/v1/alerts/acknowledge/{id}`.
3. Click **SUBMIT INCIDENT REPORT**:
   - Enter Title: `Submerged Bridge Underpass`, Hazard: `FLOOD`, Severity: `HIGH`, Description: `3 feet standing water`.
   - Click **SUBMIT REPORT**.
   - Verify new report appears immediately in the incident feed via `POST /api/v1/incidents`.
4. View **Emergency Relief Shelters** (capacity vs current occupancy progress bars) and **Critical Infrastructure Protection** nodes.

### Step 5: Sensor Network & Physical Bounds Anomaly Testing
1. Click the `SENSOR NETWORK` tab.
2. View telemetry status counters (Total, Online, Degraded, Offline, Anomalous) and interactive table.
3. Click **INGEST TEST TELEMETRY**:
   - Select target sensor: `sns_velachery_01`
   - Enter Temperature: `180` (out-of-bounds anomaly test value).
   - Click **INGEST TELEMETRY**.
   - Verify physical bounds check triggers in backend (`POST /api/v1/sensors/ingest`), marking sensor status to `ANOMALOUS` with quality penalty.

### Step 6: Admin Hazard Hotspots Management
1. Click the `ADMIN HOTSPOTS` tab.
2. Click **NEW HAZARD HOTSPOT**:
   - Enter Name: `Velachery Low Elevation Basin`, Hazard: `FLOOD`, Severity: `CRITICAL`, Baseline Score: `90`, Lat/Lng coordinates.
   - Click **CREATE HOTSPOT**.
   - Verify hotspot appears in table via `POST /api/v1/hotspots`.
3. Click the **Delete** icon button to remove test hotspot via `DELETE /api/v1/hotspots/{id}`.

### Step 7: Operating Mode Transitions & Fallback Rules
1. In the top persistent header, click **LOCAL EDGE**:
   - Mode badge updates to `LOCAL EDGE ACTIVE`.
   - Backend evaluates standalone edge logic; SHAP feature attributions display *"Detailed explanation unavailable in Local Edge mode"*.
2. Click **NO DATA**:
   - Mode badge updates to `NO DATA MODE`.
   - System displays `NO DATA` banner showing last known valid assessment timestamp without fabricating new predictions.
3. Click **CLOUD**:
   - System restores to `CLOUD ML ACTIVE` full inference.

---

## Reset / Recovery Procedure
To reset all simulation states, alerts, and sensor telemetry back to initial startup defaults:
1. Click the `SIMULATION` tab and click **RESET TO BASELINE**.
2. Or issue an HTTP POST request: `POST http://localhost:8000/api/reset-simulation`.

---

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| `BACKEND CONNECTION UNAVAILABLE` banner appears in UI | FastAPI server is not running on port 8000 | Verify backend is started using `$env:PYTHONPATH="backend"; python -m uvicorn main:app --port 8000` |
| `npm run dev` fails with module errors | Frontend dependencies missing | Run `npm install` inside `frontend/` directory |
| Python missing packages (`httpx`, `joblib`, etc.) | Virtual environment missing dependencies | Run `pip install fastapi uvicorn scikit-learn joblib httpx pytest pydantic` |
| Map tiles do not load | Device disconnected from internet | CARTO map tile layer requires network access; Leaflet spatial risk polygons render independently |

# ClimateRoute Intelligence (CRI) Platform 🌍⚡

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF.svg)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6%2B-F7931E.svg)](https://scikit-learn.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9%2B-199900.svg)](https://leafletjs.com/)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-23%2F23%20PASS-brightgreen.svg)]()
[![E2E Tests](https://img.shields.io/badge/E2E%20Acceptance-11%2F11%20PASS-brightgreen.svg)]()

> **Hyperlocal Multi-Hazard Risk Intelligence, Disaster Simulation & Directional Hazard-Propagation Platform**  
> **Version 1.0 REALIGNED** — Centered on **Sadasiva Sankarapuram** (`13.386°N, 79.798°E`, Nagalapuram mandal, Tirupati district, Andhra Pradesh).

---

## 🌟 Executive Overview

The **ClimateRoute Intelligence (CRI)** platform is a single-region, physics-informed, manually-configured disaster prediction and emergency management system. Built to eliminate the ambiguity of regional weather forecasts, CRI delivers hyperlocal multi-hazard risk assessment and **directional hazard-propagation modeling** within a designated 12.5 km bounding sector.

### Core Architectural Pillars

1. **Zero Pre-Seeded Boot (100% Manual Placement)**:
   - Completely removes hardcoded Chennai zones and sensors.
   - Boots with **0 hotspots** and **0 sensors** in SQLite persistence (`backend/data/cri.db`).
   - Incident commanders and field operators manually trace custom vulnerability polygons and place IoT telemetry nodes directly on the map.
2. **Topographic Terrain Engine & Relief Basemap**:
   - Models the distinct physical landscape of Nagalapuram: the steep Eastern Ghats mountain ridge to the west (elevations $>450\text{m}$, slopes $>30^\circ$) and the low-lying agricultural drainage basin to the east (~$70\text{m}$, slopes $<3^\circ$).
   - Polygon centroids automatically receive elevation and slope values, which actively govern physical hazard compatibility (e.g. landslides are penalized on plains and boosted on steep slopes).
   - High-contrast dark relief basemap blending Esri World Hillshade (35% opacity) over Esri Dark Gray Base with reference labels and optional MapTiler support.
3. **Directional Hazard-Propagation Machine Learning Engine**:
   - Predicts downwind next-hotspot risk from any origin sensor using a `HistGradientBoostingRegressor` trained on 15,000 synthetic physics-informed scenarios ($R^2 = 0.9957$, $\text{RMSE} = 1.307\%$, latency $2.23\text{ ms}$).
   - Employs exact closed-form physics equations as an offline fallback for `LOCAL_EDGE` and `DEGRADED` operating modes.
   - Returns top-3 ranked candidate hotspots with arrival probabilities, forward bearings, distances, and 4-factor **XAI (Explainable AI)** attribution breakdowns (`Wind Alignment`, `Hazard Compatibility & Slope`, `Proximity Distance`, `Event Intensity`).
4. **4-Tier Operating Mode State Machine**:
   - `CLOUD`: Full ML inference with live weather APIs and neural regression.
   - `LOCAL_EDGE`: Local physics equations fallback when cloud connectivity drops.
   - `DEGRADED`: Telemetry dropout mode with sensor anomaly penalization.
   - `NO_DATA`: Safe failover preserving UI responsiveness without generating false alerts.
5. **Weather Provider Adapter**:
   - Adapter pattern querying India Meteorological Department (IMD) when `IMD_API_KEY` is provided, with zero-configuration live fallback to Open-Meteo for Sadasiva Sankarapuram telemetry.

---

## 🏗️ System Architecture

```
                                 ┌────────────────────────────────────────┐
                                 │       React 18 + Vite Command UI       │
                                 │   (RiskMap, CompassDial, SimPanel)     │
                                 └───────────────────┬────────────────────┘
                                                     │ REST API (/api & /api/v1)
                                 ┌───────────────────▼────────────────────┐
                                 │           FastAPI Backend              │
                                 │       (main.py, routers, v1)           │
                                 └─────────┬────────────────────┬─────────┘
                                           │                    │
                     ┌─────────────────────▼──────┐      ┌──────▼─────────────────────┐
                     │     SpatialRiskEngine      │      │     Simulation API         │
                     │ (Multi-Hazard Fusion &     │      │ (Directional Propagation & │
                     │  Operating Mode Machine)   │      │  Next-Hotspot Ranking)     │
                     └─────────────┬──────────────┘      └──────────────┬─────────────┘
                                   │                                    │
             ┌─────────────────────┼────────────────────┐               │
             │                     │                    │               │
    ┌────────▼────────┐   ┌────────▼────────┐  ┌────────▼────────┐      │
    │   Flood Model   │   │   Heat Model    │  │ Landslide Model │      │
    │  (RandomForest) │   │  (RandomForest) │  │  (DecisionTree) │      │
    └─────────────────┘   └─────────────────┘  └─────────────────┘      │
             │                     │                    │               │
             └─────────────────────┼────────────────────┘               │
                                   │                                    │
                         ┌─────────▼───────────────┐          ┌─────────▼───────────────┐
                         │   Storm / Rain Model    │          │  Propagation ML Model   │
                         │     (RandomForest)      │          │ (HistGradientBoosting)  │
                         └─────────┬───────────────┘          └─────────┬───────────────┘
                                   │                                    │
                         ┌─────────▼────────────────────────────────────▼─────────┐
                         │              Authoritative Physics & Stores            │
                         │  - propagation_formula.py (Great-Circle & Slope Decay) │
                         │  - terrain.py (Nagalapuram Elevation / Slope Engine)   │
                         │  - weather_provider.py (IMD / Open-Meteo Adapter)      │
                         │  - db.py (SQLite Persistence: backend/data/cri.db)     │
                         └────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── api/
│   │   ├── routes.py                 # Core endpoints (health, live weather)
│   │   ├── simulation.py             # Directional propagation simulation inference API
│   │   └── v1_routes.py              # Hotspot, sensor, mode, alert CRUD endpoints
│   ├── core/
│   │   ├── alert_engine.py           # Automated alert generation & acknowledgement
│   │   ├── db.py                     # SQLite connection manager & schema migrations
│   │   ├── hotspot_store.py          # SQLite-backed dynamic hotspot storage
│   │   ├── incident_command.py       # Citizen reporting, shelter & infrastructure store
│   │   ├── sensor_store.py           # SQLite-backed sensor telemetry & anomaly detector
│   │   ├── spatial_risk_engine.py    # Hyperlocal multi-hazard fusion & mode controller
│   │   ├── terrain.py                # Topographic elevation & slope resolver
│   │   ├── weather_predictor.py      # ML multi-target weather predictor wrapper
│   │   └── weather_provider.py       # IMD & Open-Meteo weather adapter pattern
│   ├── data/
│   │   └── cri.db                    # SQLite database (gitignored; boots clean at 0)
│   ├── ml/
│   │   ├── hazard_models.py          # Flood, Heat, Landslide, Storm inference & XAI
│   │   └── propagation_formula.py    # Authoritative propagation physics & hyperparameters
│   ├── tests/
│   │   ├── test_demo_sequence.py     # 11-step end-to-end API walkthrough test
│   │   ├── test_ml_pipeline.py       # ML inference & anomaly detection unit tests
│   │   ├── test_phase2_backend.py    # 23 comprehensive backend regression tests
│   │   └── test_phase4_e2e_acceptance.py # 11 pytest e2e acceptance tests
│   ├── main.py                       # FastAPI application entry point
│   └── requirements.txt              # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Header, navigation, status badges
│   │   │   ├── map/
│   │   │   │   ├── CompassDial.tsx   # Interactive 0-360° wind compass dial component
│   │   │   │   ├── RiskMap.tsx       # Leaflet map with hillshade relief & Geoman drawing
│   │   │   │   └── RiskInspector.tsx # Zone risk inspector popup card
│   │   │   ├── alerts/               # Alert feed components
│   │   │   ├── sensors/              # Sensor telemetry badges & list
│   │   │   └── incidents/            # Citizen incident forms
│   │   ├── context/
│   │   │   └── AppContext.tsx         # Global application state & CRUD handlers
│   │   ├── pages/
│   │   │   ├── LiveMap/              # Primary operations map view
│   │   │   ├── Simulation/           # Redesigned directional simulation command view
│   │   │   ├── IncidentCommand/      # Emergency alert dispatch & shelter management
│   │   │   ├── SensorNetwork/        # IoT sensor telemetry & quality monitor
│   │   │   └── AdminHotspots/        # Hotspot inventory management view
│   │   ├── services/
│   │   │   ├── hotspotApi.ts         # REST client for /api/hotspots
│   │   │   ├── sensorApi.ts          # REST client for /api/sensors
│   │   │   ├── simulationApi.ts      # REST client for /api/simulate/run & /api/weather/live
│   │   │   └── api.ts                # General backend client
│   │   ├── types/                    # TypeScript data contracts & schemas
│   │   ├── App.tsx                   # Top-level view router & state provider
│   │   └── main.tsx                  # React DOM root
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── ml_training/
│   ├── flood/                        # Serialized flood model & metadata
│   ├── heatwave/                     # Serialized heatwave model & metadata
│   ├── landslide/                    # Serialized landslide model & metadata
│   ├── storm/                        # Serialized storm model & metadata
│   ├── data_processor.py             # Feature normalization & synthetic generator
│   ├── propagation_metadata.json     # Hyperparameters & feature definitions
│   ├── propagation_model.joblib      # Trained HistGradientBoosting propagation model
│   ├── train_propagation_model.py    # Training script for directional propagation
│   ├── verify_model.py               # Comprehensive verification script for all ML models
│   └── weather_model.joblib          # Weather predictor regressor
│
└── README.md
```

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10, 3.11, or 3.12
- Node.js 18+ and npm
- Git

---

### 1. Backend Setup

```powershell
# Navigate to repository root
cd d:\Aracnids

# Activate existing virtual environment (or create a new one)
.\backend\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Run the backend FastAPI server
$env:PYTHONPATH="backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

In a separate terminal:

```powershell
cd d:\Aracnids\frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 3. ML Model Verification

Verify that all 5 machine learning models and fallback engines operate within expected latency and accuracy tolerances:

```powershell
$env:PYTHONPATH="backend"
python ml_training/verify_model.py
```

*Expected output: All 5 models verified successfully (0 errors, latency $<5\text{ ms}$).*

---

## 🧪 Testing & Verification Matrix

The repository contains three complete test suites verifying unit logic, integration boundaries, and end-to-end acceptance:

### 1. Backend Regression Matrix (23 Tests)
Verifies health, weather ML, hazard models, risk fusion, boundary limits, simulation overrides, sensor quality scoring, anomaly triggers, hotspot CRUD, alert lifecycle, operating modes, and directional propagation prediction:

```powershell
$env:PYTHONPATH="backend"
python -m unittest discover -s backend/tests -v
```
*Result: `Ran 23 tests ... OK` (100% Pass Rate).*

### 2. End-to-End Acceptance Suite (11 Tests)
Pytest-based automated acceptance suite covering health, operating mode transitions, schema contracts, simulation chains, alert acknowledgment, sensor telemetry ingestion, hotspot CRUD, citizen reporting, shelter tracking, and directional next-hotspot propagation:

```powershell
pytest backend/tests/test_phase4_e2e_acceptance.py -v
```
*Result: `11 passed in 11.99s` (100% Pass Rate).*

### 3. Frontend Production Build
Validates TypeScript compilation, module resolution, and Vite bundling:

```powershell
cd frontend
npm run build
```
*Result: `tsc && vite build` completed with zero errors.*

---

## 🧭 How to Use the Simulation Panel

1. **Draw Hotspots**: In either the **Live Map** or **Simulation** view, click **DRAW HOTSPOT** at the top of the map. Use the polygon tool to outline 2–3 hazard zones across the terrain (e.g., on the western ridge and in the eastern lowlands). Select a hazard type (`flood`, `landslide`, `heatwave`, `heavy_rain`) and save.
2. **Place Sensors**: Click **PLACE SENSOR** and click anywhere on the map to drop a telemetry node. Drag the marker to fine-tune its position.
3. **Configure Simulation**:
   - Open the **SIMULATION** tab.
   - Select your **Source Sensor Origin**.
   - Click and drag the **0–360° Compass Dial** to rotate the wind direction.
   - Adjust atmospheric sliders (Rainfall, Wind Speed, Temperature) or click **PREFILL LIVE WEATHER** to query live Open-Meteo conditions for Sadasiva Sankarapuram.
4. **Run Simulation**:
   - Click **RUN SIMULATION**.
   - The map displays animated directional vectors radiating from the source sensor toward predicted hotspots.
   - Review the **Top-3 Ranked Candidate Cards** on the left with exact probability percentages and the 4-factor XAI breakdown.

---

## 🔑 Environment Variables (Optional)

Create a `.env` file in `backend/` or `frontend/` to override default configurations:

| Variable | Target | Description | Default |
| :--- | :--- | :--- | :--- |
| `IMD_API_KEY` | Backend | India Meteorological Department API key | Falls back to Open-Meteo |
| `VITE_MAPTILER_KEY` | Frontend | MapTiler vector basemap key | Falls back to Esri Hillshade raster |
| `DATABASE_PATH` | Backend | Custom SQLite file location | `backend/data/cri.db` |

---

## 📄 License & Attribution
Developed for the **RECURSION Edition II Hackathon** at VIT Chennai. Built with physics-informed climate risk intelligence and explainable machine learning.

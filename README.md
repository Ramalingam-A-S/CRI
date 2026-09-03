# Hyperlocal Climate Risk Intelligence (CRI) Platform 🌍⚡

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF.svg)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9%2B-199900.svg)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/Backend%20Tests-32%2F32%20PASS-brightgreen.svg)]()

> **Enterprise-Grade Real-Time Climate Risk Engine & Hyperlocal Disaster Command Center**

The **Hyperlocal Climate Risk Intelligence (CRI) Platform** is an end-to-end, physics-informed climate risk prediction, simulation, and emergency response orchestration platform. Designed to overcome the limitations of traditional macro weather forecasts, CRI delivers **100-meter grid resolution** risk assessments for four major hazard vectors: **Flood, Extreme Heat, Landslide, and Severe Storm**.

---

## 🌟 Key Highlights & Capabilities

### 🛰️ Physics-Informed Spatial Risk Engine
- **Hyperlocal 100m Resolution**: Calculates real-time spatial risk scores by integrating elevation, slope, geohash spatial indexes, soil saturation, and live weather telemetry.
- **Unified Multi-Hazard Scoring**: Combines 4 machine learning Random Forest models to output precise risk categories (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) and numerical risk indices ($0.0 \rightarrow 1.0$).
- **Multi-Tier Resilience (Operating Modes)**:
  - `CLOUD`: Full integration with live weather APIs, satellite vectors, and IoT telemetry.
  - `LOCAL_EDGE`: Offline model inference using localized cached historical baselines.
  - `DEGRADED`: Automated fallback mode when specific weather sensors or API feeds drop out.
  - `NO_DATA`: Safe baseline output preserving UI usability during complete network outage.

### 🧪 Dynamic Hazard Simulation Engine
- **Real-Time Spatio-Temporal Propagation**: Simulates how climate hazards spread over time based on physical vectors (precipitation rate, temperature delta, wind speed, slope gradient).
- **Interactive Controls**: Run, pause, step forward, or reset multi-hazard scenarios with configurable duration and intensity.
- **Predictive Risk Mapping**: Generates side-by-side comparisons of **Current vs. Predicted** risk zones across urban territories.

### 🗺️ Operational Command Center Frontend
A modern, dark-mode dashboard built with **React 18**, **TypeScript**, **Vite**, and **Leaflet** featuring 5 operational views:
1. 🗺️ **LIVE MAP**: Real-time risk map with current & predicted hazard zones, hazard filtering (`ALL`, `FLOOD`, `HEAT`, `LANDSLIDE`, `STORM`), live IoT sensor nodes, vulnerability hotspots, and an interactive risk inspector card.
2. 🧪 **DISASTER SIMULATION**: Multi-hazard simulation lab with real-time parameter tuning sliders, spatial propagation triggers, and side-by-side risk zone overlays.
3. 🚨 **INCIDENT COMMAND**: Real-time alert dispatch feed, severity filters (`CRITICAL`, `WARNING`, `INFO`), alert acknowledgement workflow, emergency incident reporting, shelter capacity monitoring, and critical infrastructure health.
4. 📡 **SENSOR NETWORK**: Live IoT sensor dashboard displaying telemetry status (`ACTIVE`, `WARNING`, `CRITICAL`, `OFFLINE`), detailed reading metrics (temperature, humidity, water level, soil moisture), and telemetry ingest simulation.
5. ⚙️ **ADMIN HOTSPOTS**: Full CRUD management of vulnerability hotspots (hospitals, dense residential areas, power stations) with map pin placement.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       React 18 + Vite Command UI       │
                               │ (Live Map, Sim, Incidents, Sensors)    │
                               └───────────────────┬────────────────────┘
                                                   │ REST API
                               ┌───────────────────▼────────────────────┐
                               │           FastAPI REST API             │
                               │        (main.py & Routers)             │
                               └─────────┬────────────────────┬─────────┘
                                         │                    │
                   ┌─────────────────────▼──────┐      ┌──────▼─────────────────────┐
                   │     SpatialRiskEngine      │      │     Dynamic Simulator      │
                   │ (Grid Risk, Models, Modes) │      │ (Propagation, Timesteps)   │
                   └─────────────┬──────────────┘      └──────────────┬─────────────┘
                                 │                                    │
           ┌─────────────────────┼────────────────────┐               │
           │                     │                    │               │
  ┌────────▼────────┐   ┌────────▼────────┐  ┌────────▼────────┐       │
  │   Flood Model   │   │   Heat Model    │  │ Landslide Model│       │
  │ (RandomForest)  │   │ (RandomForest)  │  │ (RandomForest) │       │
  └─────────────────┘   └─────────────────┘  └────────────────┘       │
           │                     │                    │               │
           └─────────────────────┼────────────────────┘               │
                                 │                                    │
                       ┌─────────▼────────────────────────────────────▼─────────┐
                       │     SensorStore / HotspotStore / AlertEngine           │
                       │   (In-Memory Persistence & State Management)           │
                       └────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── core/
│   │   ├── spatial_risk_engine.py   # Core spatial risk computation & operating mode logic
│   │   ├── sensor_store.py          # IoT sensor registry & telemetry manager
│   │   ├── hotspot_store.py         # Vulnerability hotspot CRUD store
│   │   ├── alert_engine.py          # Automated alert generation & acknowledgement
│   │   └── incident_command.py      # Emergency incident, shelter & infrastructure store
│   ├── models/
│   │   ├── ml_pipeline.py           # Machine learning pipeline trainer & loader
│   │   ├── flood_model.py           # Flood hazard predictor
│   │   ├── heat_model.py            # Heat wave hazard predictor
│   │   ├── landslide_model.py       # Landslide hazard predictor
│   │   ├── storm_model.py            # Storm hazard predictor
│   │   └── saved/                   # Pre-trained ML model binaries (.pkl)
│   ├── routers/                     # FastAPI endpoint route handlers
│   ├── schemas/                     # Pydantic data validation schemas
│   ├── tests/                       # Pytest automated test suite (32 tests)
│   ├── main.py                      # FastAPI application entry point
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Header, Inspector, Map UI components
│   │   ├── views/                   # 5 primary operational view containers
│   │   │   ├── LiveMapView.tsx
│   │   │   ├── SimulationView.tsx
│   │   │   ├── IncidentCommandView.tsx
│   │   │   ├── SensorNetworkView.tsx
│   │   │   └── AdminHotspotsView.tsx
│   │   ├── services/                # API client integration (api.ts)
│   │   ├── types/                   # TypeScript interface definitions
│   │   ├── App.tsx                  # Main app layout & view router
│   │   └── index.css                # Custom CSS design system & map styles
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── FEATURE_MATRIX.md            # Technical feature classification matrix
│   └── DEMO_GUIDE.md                # 11-step end-to-end demonstration guide
├── AGENT_STATE.md                   # System state & verification log
├── ARCHITECTURE.md                  # Detailed architectural specification
├── CHANGELOG.md                     # Revision log
└── HANDOFF.md                       # Project handoff guide
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python**: Version `3.10` or higher
- **Node.js**: Version `18.0` or higher (with `npm`)

---

### 1️⃣ Backend Setup & Execution

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run the FastAPI server (listening on http://127.0.0.1:8000)
$env:PYTHONPATH="backend"  # PowerShell
python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

*Interactive Swagger API documentation will be available at:* [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)

---

### 2️⃣ Frontend Setup & Execution

```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Run the Vite React development server (listening on http://127.0.0.1:5173)
npm run dev -- --port 5173 --host 127.0.0.1
```

*Open your browser and navigate to:* [`http://127.0.0.1:5173`](http://127.0.0.1:5173)

---

## 🧪 Testing & Verification

### Running Backend Unit Tests
The repository includes a comprehensive pytest suite covering model predictions, risk scoring, operating modes, simulation propagation, sensor ingestion, hotspot CRUD, and emergency incident dispatch.

```bash
# From project root:
$env:PYTHONPATH="backend"
python -m pytest backend/tests/ -v
```
*(All 32/32 unit tests pass).*

### Verifying Frontend Production Build
```bash
cd frontend
npm run build
```
*(Clean TypeScript compilation with 0 errors).*

---

## 🔌 API Endpoint Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` / `/docs` | Health check & OpenAPI Swagger documentation |
| `GET` | `/api/v1/risk/map` | Fetches current risk zones, predicted zones, and operating mode |
| `POST` | `/api/v1/risk/assessment` | Calculates point-specific multi-hazard risk assessment |
| `POST` | `/api/simulate` | Triggers spatio-temporal hazard propagation simulation |
| `POST` | `/api/reset-simulation` | Resets simulation parameters to current baseline state |
| `GET` | `/api/v1/alerts` | Fetches active system alerts |
| `POST` | `/api/v1/alerts/acknowledge/{id}` | Acknowledges an active emergency alert |
| `GET` | `/api/v1/sensors` | Lists all IoT sensor nodes and live telemetry |
| `POST` | `/api/v1/sensors/ingest` | Ingests new telemetry data point from a sensor node |
| `GET` | `/api/v1/hotspots` | Fetches registered vulnerability hotspots |
| `POST` | `/api/v1/hotspots` | Creates a new vulnerability hotspot |
| `PUT` | `/api/v1/hotspots/{id}` | Updates an existing vulnerability hotspot |
| `DELETE` | `/api/v1/hotspots/{id}` | Removes a vulnerability hotspot |
| `GET` | `/api/v1/incidents` | Lists active emergency response incidents |
| `POST` | `/api/v1/incidents` | Registers a new emergency incident |
| `GET` | `/api/v1/shelters` | Retrieves emergency shelter availability & capacity |
| `GET` | `/api/v1/infrastructure` | Monitors critical infrastructure status (power, water, comms) |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

*Built for Hyperlocal Climate Risk Intelligence & Urban Resilience.* 🌍✨

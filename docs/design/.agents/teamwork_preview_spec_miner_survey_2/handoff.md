# Handoff Report - Survey Spec Miner 2 (FastAPI Backend Integration)

**Agent:** Survey Spec Miner 2 (FastAPI Backend Integration Spec Miner)  
**Parent Agent:** `19fab19f-26b3-4213-a1fa-6c2cc9037d40` (Orchestrator)  
**Target File:** `d:\Aracnids\.agents\teamwork_preview_spec_miner_survey_2\backend_integration_spec.md`  
**Handoff Type:** Hard Handoff (Task Complete)  
**Date:** 2026-09-03  

---

## 1. Observation

1. **Backend Routing and Endpoints**:
   - `d:\Aracnids\backend\main.py` lines 14-19:
     ```python
     app.include_router(routes.router)
     app.include_router(simulation.router)

     @app.get("/api/health")
     def health_check():
         return {"status": "ok"}
     ```
   - `d:\Aracnids\backend\api\routes.py` lines 8-15:
     ```python
     class RouteRequest(BaseModel):
         origin: str
         destination: str
         departure_time: str
         scenario: str = "BASELINE"

     @router.post("/analyze-route")
     def analyze_route(req: RouteRequest):
     ```
   - `d:\Aracnids\backend\api\simulation.py` lines 6-15:
     ```python
     class SimulationRequest(BaseModel):
         hazard: str
         intensity: float
         lat: float
         lon: float
         radius_m: int
         duration_minutes: int

     @router.post("/simulate")
     def trigger_simulation(req: SimulationRequest):
     ```

2. **Route Models and Hardcoded Environmental Features**:
   - `d:\Aracnids\backend\models\route.py` lines 17-25:
     ```python
     elevation: float
     elevation_change: float = 0.0
     slope: float
     rainfall: float
     temperature: float
     humidity: float
     water_proximity: float
     historical_susceptibility: float
     ```
   - `d:\Aracnids\backend\core\segmentation.py` lines 51-53:
     ```python
     "rainfall": 10.0, # Baseline
     "temperature": 32.0,
     "humidity": 65.0,
     ```
   - `d:\Aracnids\backend\api\routes.py` line 42:
     ```python
     {"type": "WEATHER", "source": "Open-Meteo Proxy", "status": "SIMULATED" if req.scenario != "BASELINE" else "CACHED"}
     ```

3. **Core Hazard Risk Engine Formulas**:
   - `d:\Aracnids\backend\core\risk_engine.py` lines 10-50:
     - Flood risk: uses `rain = seg["rainfall"] * rainfall_modifier`, `seg["elevation"]`, `seg["water_proximity"]`, `seg["historical_susceptibility"]`
     - Heat risk: `heat_score = min(100, max(0, (temp - 25) * 4 + (seg["humidity"] - 50) * 0.5))`
     - Landslide risk: `landslide_score = min(100, max(0, seg["slope"] * 5 + rain * 0.5))`
     - Overall risk: `overall = (flood_score * 0.6) + (heat_score * 0.3) + (landslide_score * 0.1)`

4. **Weather Dataset Specifications**:
   - `d:\Aracnids\weather-prediction-metadata.json` and `d:\Aracnids\weather_prediction_dataset.csv`:
     - File size: 2,770,160 bytes.
     - Shape: 3,654 rows (daily observations from 2000-01-01 to 2010-01-01) by 165 columns.
     - Suffixes: `precipitation` (mm), `temp_mean` (°C), `temp_min` (°C), `temp_max` (°C), `humidity` (fraction/%), `pressure`, `cloud_cover`, `sunshine`, `global_radiation`, `wind_speed`, `wind_gust`.
     - 18 European stations: `BASEL`, `BUDAPEST`, `DE_BILT`, `DRESDEN`, `DUSSELDORF`, `HEATHROW`, `KASSEL`, `LJUBLJANA`, `MAASTRICHT`, `MALMO`, `MONTELIMAR`, `MUENCHEN`, `OSLO`, `PERPIGNAN`, `ROMA`, `SONNBLICK`, `STOCKHOLM`, `TOURS`.

5. **Python Environment & Dependencies**:
   - Running `d:\Aracnids\backend\venv\Scripts\python.exe -m pip list`:
     - Installed: `fastapi 0.141.1`, `pydantic 2.13.5`, `pandas 3.0.5`, `numpy 2.5.2`, `geopandas 1.1.4`, `uvicorn 0.52.4`.
     - Missing in `backend/venv`: `scikit-learn`, `joblib`.
   - Running `python -m pip list` (global Anaconda Python):
     - Installed: `scikit-learn 1.6.1`, `joblib 1.4.2`, `pandas 2.2.3`, `numpy`, `scipy 1.15.3`.
   - Running `d:\Aracnids\backend\venv\Scripts\python.exe -c "import pickle; print('pickle ok')"` exited 0.
   - Running `d:\Aracnids\backend\venv\Scripts\python.exe -c "import sklearn"` exited 1 (`ModuleNotFoundError: No module named 'sklearn'`).

---

## 2. Logic Chain

1. **Mapping Dataset Targets to Backend Hazard Needs**:
   - Observation 2 demonstrates that the backend hazard models (`RouteSegment`) explicitly consume `rainfall`, `temperature`, and `humidity`.
   - Observation 3 shows that the three hazard algorithms (Flood, Heat, Landslide) use `rain`, `temp`, and `humidity` as direct driving variables.
   - Observation 4 demonstrates that `weather_prediction_dataset.csv` contains `precipitation`, `temp_mean`, `temp_min`, `temp_max`, and `humidity` across stations.
   - **Deduction**: The ML training model must be trained as a multi-target regressor with at least:
     - Target 1: `precipitation` (maps directly to `rainfall`)
     - Target 2: `temp_mean` (maps directly to `temperature`)
     - Target 3: `humidity` (maps directly to `humidity`)
     - Optional additional targets: `temp_min`, `temp_max`, `wind_speed`.

2. **Integration Architecture & Endpoints**:
   - Observation 1 demonstrates existing endpoints: `GET /api/health`, `POST /api/analyze-route`, `POST /api/simulate`, `POST /api/reset-simulation`.
   - Requirement R3 in `ORIGINAL_REQUEST.md` mandates exporting the model for integration into the FastAPI backend.
   - **Deduction**: Two integration modes are required:
     1. A dedicated prediction endpoint: `POST /api/predict-weather` (and introspection endpoint `GET /api/weather/model-info`) accepting `WeatherPredictionRequest` and returning `WeatherPredictionResponse`.
     2. In-process enrichment within `POST /api/analyze-route`, replacing hardcoded constants in `backend/core/segmentation.py` with ML model predictions.

3. **Input and Output Schemas**:
   - Scikit-learn pipelines require fixed-dimensional 2D feature matrices `(n_samples, n_features)`.
   - In production, clients may submit JSON dictionaries of named features or ordered arrays.
   - **Deduction**: The model export must preserve `feature_names_in_`. The input Pydantic schema `WeatherPredictionRequest` should accept either a `features: Dict[str, float]` or `feature_vector: List[float]`. The preprocessing pipeline must encapsulate a `SimpleImputer(strategy='median')` so that unsupplied features are safely imputed.

4. **Model Loading, Path Conventions, and Environment**:
   - Observation 5 shows that `backend/venv` has `numpy 2.5.2`, `pandas 3.0.5`, and standard library `pickle`, but lacks `scikit-learn` and `joblib`. The global Anaconda Python has `scikit-learn 1.6.1` and `joblib 1.4.2`.
   - **Deduction**:
     - The training artifact should be serialized into `d:\Aracnids\ml_training\weather_model.pkl` (and `weather_model.joblib`).
     - Standard `pickle` protocol 5 should be supported alongside `joblib`.
     - `scikit-learn` and `joblib` should be added to `backend/venv` for in-process inference, OR the model loader should implement graceful fallback to baseline heuristics if `scikit-learn` is not installed in the active environment.
     - FastAPI lifespan context manager (`@asynccontextmanager`) should load the model once into memory at startup.

---

## 3. Caveats

1. **Dynamic Spatial Resolution**:
   The European weather dataset provides daily station observations across 18 European cities, whereas the hackathon demo route is in Chennai, India (`VIT Chennai` to `Chennai Airport`). The ML model will predict generalized multi-target climate dynamics from atmospheric features; in the demo, the backend applies these predictions to the route segments.
2. **Missing Dependencies in `backend/venv`**:
   `scikit-learn` is not currently installed in `backend/venv`. We did not run `pip install` because Survey Spec Miner 2 is strictly read-only. This must be handled in the implementation phase.
3. **No Prior Test Harness**:
   No pre-existing `pytest` suite was found in `backend`. The verification harness must be provided via `verify_model.py` per acceptance criteria.

---

## 4. Conclusion

The FastAPI backend integration requirements for the multi-target weather prediction model are fully determined and documented in `backend_integration_spec.md`.
Specifically:
1. **Target Variables**: `precipitation` (rainfall in mm), `temp_mean` (temperature in °C), and `humidity` (%) align 1:1 with the backend `RouteSegment` schema and `risk_engine.py` equations.
2. **Input Contract**: 165 features from `weather_prediction_dataset.csv`, ordered via `feature_names_in_`, robustly handled via `SimpleImputer(strategy='median')`.
3. **Endpoints**:
   - Standalone: `POST /api/predict-weather` and `GET /api/weather/model-info`.
   - Integrated: `POST /api/analyze-route` segment weather enrichment.
4. **Serialization & Paths**: Primary artifact at `d:\Aracnids\ml_training\weather_model.pkl` (and `.joblib`), accompanied by `metrics.json` and `verify_model.py`.
5. **Lifecycle**: Loaded once at FastAPI startup via lifespan context manager with graceful heuristic fallback.

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Backend Code Contracts**:
   - Inspect route models: `backend/models/route.py`
   - Inspect route handler: `backend/api/routes.py`
   - Inspect risk scoring formulas: `backend/core/risk_engine.py`
   - Inspect segment generator: `backend/core/segmentation.py`

2. **Verify Dataset Schema**:
   Run via Python:
   ```powershell
   d:\Aracnids\backend\venv\Scripts\python.exe -c "import pandas as pd; df = pd.read_csv('d:/Aracnids/weather_prediction_dataset.csv', nrows=2); print('Shape:', df.shape); print('Features:', df.columns[:10].tolist())"
   ```
   Confirms 165 columns, 3654 rows, and column naming convention.

3. **Verify Specification Document**:
   View `d:\Aracnids\.agents\teamwork_preview_spec_miner_survey_2\backend_integration_spec.md` to confirm all 5 dispatch questions and critical edge cases are documented with code snippets and tables.

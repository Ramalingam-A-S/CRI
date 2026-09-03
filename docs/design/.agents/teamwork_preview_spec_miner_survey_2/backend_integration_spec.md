# FastAPI Backend Integration Specification for Weather Prediction ML Model

**Document Version:** 1.0.0  
**Author:** Survey Spec Miner 2 (FastAPI Backend Integration Spec Miner)  
**Target Project:** ClimateRoute Intelligence (`d:\Aracnids\backend`)  
**Associated Training Directory:** `d:\Aracnids\ml_training`  
**Date:** 2026-09-03  

---

## Executive Summary

This specification document provides the authoritative integration blueprint connecting the trained multi-target weather prediction machine learning model (`d:\Aracnids\ml_training`) with the FastAPI backend service (`d:\Aracnids\backend`).

The backend currently implements route hazard evaluation (`POST /api/analyze-route`) based on deterministic environmental heuristics, using hardcoded baseline meteorological values (`rainfall = 10.0 mm`, `temperature = 32.0 °C`, `humidity = 65.0 %`). The multi-target weather ML model provides the dynamic predictive core that supplies real-time, time-aware multi-variable meteorological predictions (`precipitation`, `temp_mean`, `temp_min`, `temp_max`, `humidity`) directly to the backend hazard scoring engine (`risk_engine.py`) and dedicated prediction endpoints (`/api/predict-weather`).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | API Routing | Health Check (`GET /api/health`) | API health and liveness heartbeat | None | `{"status": "ok"}` (JSON) | 500 on server crash | `backend/main.py:18` |
| 2 | API Routing | Route Hazard Analysis (`POST /api/analyze-route`) | Main route segmentation and multi-hazard risk engine | `RouteRequest` JSON (`origin`, `destination`, `departure_time`, `scenario`) | Full route response (`route`, `segments`, `temporal_risk`, `departure_comparison`, `overall_risk`, `critical_segment`, `data_provenance`) | 404 if route not found by providers; 422 for invalid body | `backend/api/routes.py:14` |
| 3 | API Routing | Scenario Simulator (`POST /api/simulate`) | Injects localized hazard anomaly for testing | `SimulationRequest` JSON (`hazard`, `intensity`, `lat`, `lon`, `radius_m`, `duration_minutes`) | `{"status": "simulated", "scenario": ...}` | 422 for validation error | `backend/api/simulation.py:14` |
| 4 | API Routing | Reset Simulation (`POST /api/reset-simulation`) | Clears simulated hazard overrides | None | `{"status": "reset"}` | 500 on failure | `backend/api/simulation.py:19` |
| 5 | Data Models | `HazardScore` Pydantic Model | Schema for individual hazard risks (score 0-100, level, breakdown factors) | Numeric score, level string, factor dictionary | Serialized Pydantic dict | ValidationError if fields missing | `backend/models/route.py:4` |
| 6 | Data Models | `RouteSegment` Pydantic Model | Geospatial segment schema containing terrain and environmental attributes | Segment geometry, distances, arrival time, coords, elevation, slope, rainfall, temperature, humidity, hazard scores | Full segment dictionary | ValidationError if types mismatch | `backend/models/route.py:9` |
| 7 | Data Models | `NormalizedRoute` Pydantic Model | Standardized route representation across routing providers (OSM, Google, Fallback) | `provider`, `status`, `distance_m`, `duration_s`, `geometry`, `bounds` | Standardized route dict | ValidationError if structure invalid | `backend/models/route.py:35` |
| 8 | Core Risk Engine | Heuristic Flood Risk Scoring | Evaluates flood hazard using rainfall, elevation, water proximity, and historical exposure | `rainfall` (mm), `elevation` (m), `water_proximity` (m), `historical_susceptibility` (0-1) | Score (0-100), Level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), factor decomposition | Clamped to [0, 100] via `min(100, max(0, ...))` | `backend/core/risk_engine.py:13` |
| 9 | Core Risk Engine | Heuristic Heat Risk Scoring | Evaluates heat hazard using temperature and relative humidity | `temperature` (°C), `humidity` (%) | Score (0-100), Level, factor decomposition | Clamped to [0, 100] | `backend/core/risk_engine.py:31` |
| 10 | Core Risk Engine | Heuristic Landslide Risk Scoring | Evaluates landslide hazard using terrain slope and rainfall | `slope` (degrees/gradient), `rainfall` (mm) | Score (0-100), Level, factor decomposition | Clamped to [0, 100] | `backend/core/risk_engine.py:39` |
| 11 | Core Risk Engine | Overall Risk Aggregation | Weighted combination of flood (60%), heat (30%), and landslide (10%) scores | `flood_score`, `heat_score`, `landslide_score` | `overall_risk_score` (0-100), `overall_risk_level`, `confidence` | Clamped to valid range | `backend/core/risk_engine.py:48` |
| 12 | Core Temporal | Temporal Risk Curve Forecasting | Forecasts risk progression across T, T+15, T+30, T+45 min travel windows | Critical segment base hazard scores, departure time, scenario curve | List of 4 temporal forecast entries with flood, heat, landslide, and overall scores | Defaults to current time if parse fails | `backend/core/temporal_engine.py:9` |
| 13 | Core Temporal | Departure Window Comparison | Compares waiting intervals (T, T+30, T+60, T+90 min) to recommend departure | Base departure time string, scenario | List of 4 departure recommendations (`LOW`, `MODERATE`, `HIGH`) | Defaults to current time on string error | `backend/core/temporal_engine.py:49` |
| 14 | Spatial Segmentation | Route Interpolation & Slicing | Slices polyline geometry into equidistant segments (~100m) and computes terrain/arrival | `NormalizedRoute`, `departure_time_str`, `segment_length_m` | List of segment dictionaries with arrival time, elevation dip, and weather attributes | Returns `[]` if < 2 coordinates | `backend/core/segmentation.py:5` |
| 15 | Routing Engine | Multi-Provider Fallback Routing | Tries Google Maps API -> OSM (OSMnx) -> Local Fallback JSON (`routes.json`) | `origin`, `destination` strings | `NormalizedRoute` or `None` | Returns `None` if all fail; API triggers HTTP 404 | `backend/routing/router.py:10` |
| 16 | Planned ML Integration | Dedicated Weather Predictor (`POST /api/predict-weather`) | Dedicated inference API exposing multi-target weather model to clients | Feature dictionary or feature vector JSON | Dictionary of predicted targets (`precipitation`, `temp_mean`, `temp_min`, `temp_max`, `humidity`, etc.) | HTTP 422 on bad format, 503 if model uninitialized | Architectural discovery per R2/R3 |
| 17 | Planned ML Integration | Model Info Endpoint (`GET /api/weather/model-info`) | Introspection endpoint providing model architecture, metrics, and feature list | None | JSON with model name, targets, feature names, R2/RMSE metrics, timestamp | 503 if model not loaded | Architectural discovery per R3 |
| 18 | Planned ML Integration | In-Process ML Segment Weather Enrichment | Dynamic replacement of hardcoded segment rainfall/temp/humidity with ML predictions | Route segment coordinates / date-time context | Injected `rainfall`, `temperature`, `humidity` values into `RouteSegment` | Falls back to cached baseline if inference fails | `backend/core/segmentation.py:51` |
| 19 | Planned ML Integration | Dynamic Data Provenance Attribution | Updates data provenance to declare ML model inference and artifact source | Model execution status | `{"type": "WEATHER", "source": "Multi-Target ML Predictor", "status": "PREDICTED"}` | N/A | `backend/api/routes.py:41` |

---

## Edge Cases

| # | Feature | Input / Condition | Observed / Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | Route Analysis | Origin/Destination not matching routing graph or fallback | `get_route()` returns `None`; endpoint raises `HTTPException(status_code=404, detail="Route could not be calculated by any provider")` |
| 2 | Route Segmentation | Route coordinates empty or single point (`len(coords) < 2`) | `segmentation.segment_route()` safely returns empty list `[]` |
| 3 | Temporal Calculation | Malformed or unparseable `departure_time` (e.g. invalid string) | `strptime` throws `ValueError`; `except` handler catches and defaults to `datetime.now()` |
| 4 | Risk Engine | Extreme negative or astronomical rainfall/temperature inputs | Clamping logic `min(100, max(0, ...))` prevents out-of-bounds hazard scores, preserving score bounds [0.0, 100.0] |
| 5 | Risk Engine | Zero segments returned from segmentation | `crit_seg = max(scored_segments, ...) if scored_segments else None`; overall risk defaults to `level: "LOW"`, `score: 0` |
| 6 | Weather Model Loading | Model artifact file missing at designated path (`weather_model.pkl`) | Backend logs startup warning; falls back to internal baseline values (`rainfall: 10.0`, `temperature: 32.0`, `humidity: 65.0`) without crashing API server |
| 7 | Weather Model Inference | Missing feature keys in input JSON dictionary | Scikit-learn pipeline imputer (`SimpleImputer(strategy='median')`) or fallback defaults fill missing feature values without raising exception |
| 8 | Weather Model Inference | Feature array length mismatch (e.g. 50 values supplied instead of 165) | Pydantic schema validation or inference wrapper returns HTTP 422 with descriptive error listing required feature length |
| 9 | Weather Prediction Outputs | Physical impossibility (e.g. negative precipitation or humidity > 100%) | Output post-processing clips precipitation to `max(0.0, pred)` and humidity to `[0.0, 100.0]` |
| 10 | Concurrency & Threading | Simultaneous async requests hitting `.predict()` | Scikit-learn tree-based and linear models are read-only and thread-safe for `.predict()`; memory remains constant |

---

## 1. Backend Endpoints for Weather Predictions

### 1.1 Existing Backend Endpoints

The backend currently registers routes in `backend/main.py` via two APIRouters (`routes.router` and `simulation.router`):

1. **`GET /api/health`**
   - File: `backend/main.py:18`
   - Purpose: Liveness probe for containers, orchestrators, and UI.
   - Status: Active.

2. **`POST /api/analyze-route`**
   - File: `backend/api/routes.py:14`
   - Purpose: Computes route geometry, creates geospatial segments, attaches environmental attributes, calculates multi-hazard risk scores, and generates temporal risk forecasts.
   - Status: Active (currently uses hardcoded baseline weather: `rainfall=10.0`, `temp=32.0`, `humidity=65.0`).

3. **`POST /api/simulate`**
   - File: `backend/api/simulation.py:14`
   - Purpose: Injects localized hazards (e.g. simulated flash flood radius) for dynamic scenario testing.
   - Status: Active.

4. **`POST /api/reset-simulation`**
   - File: `backend/api/simulation.py:19`
   - Purpose: Resets any active scenario overrides.
   - Status: Active.

### 1.2 Target & Planned Endpoints for Weather ML Integration

To satisfy user requirements R2 and R3 from `ORIGINAL_REQUEST.md`, the backend integration architecture specifies two dedicated endpoints:

#### Endpoint A: `POST /api/predict-weather`
- **Purpose**: Direct programmatic multi-target weather prediction from raw features or date/location parameters.
- **HTTP Method**: `POST`
- **URL Path**: `/api/predict-weather` (or `/api/weather/predict`)
- **Tags**: `["Weather ML"]`
- **Request Body**: `WeatherPredictionRequest` (detailed in Section 2)
- **Response Body**: `WeatherPredictionResponse` (detailed in Section 4)
- **Status Codes**:
  - `200 OK`: Inference successful.
  - `422 Unprocessable Entity`: Input validation failed.
  - `503 Service Unavailable`: Model artifact failed to load at startup.

#### Endpoint B: `GET /api/weather/model-info`
- **Purpose**: Inspect the loaded model's metadata, target variable inventory, input feature list, training date, and validation metrics.
- **HTTP Method**: `GET`
- **URL Path**: `/api/weather/model-info`
- **Tags**: `["Weather ML"]`
- **Response Body**: `WeatherModelMetadata`
- **Status Codes**:
  - `200 OK`: Metadata returned.
  - `503 Service Unavailable`: Model not initialized.

#### Endpoint C: Segment Weather Enrichment inside `POST /api/analyze-route`
- **Purpose**: In-process integration where route segments are enriched by the ML model.
- **Flow**:
  1. `segmentation.segment_route()` slices route into segments.
  2. For each segment or for the entire route bounding box, `weather_service.predict_segment_weather(lat, lon, departure_time)` is invoked.
  3. The returned values populate `segment["rainfall"]`, `segment["temperature"]`, and `segment["humidity"]`.
  4. `risk_engine.score_segments()` computes dynamic flood, heat, and landslide risks using these predicted values.
  5. `data_provenance` outputs `{"type": "WEATHER", "source": "Multi-Target ML Predictor", "status": "PREDICTED"}`.

---

## 2. Input Schemas (Pydantic Models)

The following Pydantic models define the input schemas expected by the backend.

### 2.1 Single Weather Prediction Input Schema

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any

class WeatherPredictionRequest(BaseModel):
    """
    Request model for single-instance weather prediction.
    Clients can supply either a key-value dictionary of features,
    or an ordered numerical feature vector.
    """
    # Optional temporal context
    date: Optional[int] = Field(
        None, 
        description="Date in YYYYMMDD integer format", 
        example=20260903
    )
    month: Optional[int] = Field(
        None, 
        ge=1, 
        le=12, 
        description="Month of year (1-12)", 
        example=9
    )
    
    # Feature dictionary (named features)
    features: Optional[Dict[str, float]] = Field(
        None,
        description="Dictionary mapping feature names (e.g. 'BASEL_temp_mean', 'BASEL_pressure') to values",
        example={
            "BASEL_temp_mean": 18.5,
            "BASEL_humidity": 72.0,
            "BASEL_pressure": 1014.2,
            "BASEL_cloud_cover": 4.0,
            "BASEL_global_radiation": 160.0,
            "BASEL_precipitation": 0.0,
            "BASEL_sunshine": 6.5
        }
    )
    
    # Raw feature vector (ordered list matching model training columns)
    feature_vector: Optional[List[float]] = Field(
        None,
        description="Raw ordered feature list matching model feature_names_in_"
    )
    
    # Optional geospatial coordinates
    latitude: Optional[float] = Field(None, example=12.8406)
    longitude: Optional[float] = Field(None, example=80.1534)
```

### 2.2 Batch Weather Prediction Input Schema

```python
class WeatherBatchPredictionRequest(BaseModel):
    """
    Request model for batch predictions across multiple segments or horizons.
    """
    records: List[WeatherPredictionRequest] = Field(
        ..., 
        description="List of prediction requests to execute in batch"
    )
```

### 2.3 Route Request Schema (Existing Contract)

```python
class RouteRequest(BaseModel):
    origin: str = Field(..., example="VIT Chennai")
    destination: str = Field(..., example="Chennai Airport")
    departure_time: str = Field(..., example="17:30")
    scenario: str = Field("BASELINE", example="BASELINE")
```

---

## 3. Feature Names, Types, Units, and Ordering

### 3.1 Dataset Feature Inventory (`weather_prediction_dataset.csv`)

The underlying dataset contains **165 columns** and **3,654 rows** (daily historical records from 2000-01-01 to 2010-01-01).

- **Temporal features (2 columns)**:
  - `DATE`: `int64` (Format: `YYYYMMDD`, e.g. 20000101)
  - `MONTH`: `int64` (Range: 1 to 12)
- **Station measurement features (163 columns)** across 18 European weather stations:
  - `BASEL` (9 features)
  - `BUDAPEST` (8 features)
  - `DE_BILT` (11 features)
  - `DRESDEN` (10 features)
  - `DUSSELDORF` (11 features)
  - `HEATHROW` (9 features)
  - `KASSEL` (10 features)
  - `LJUBLJANA` (10 features)
  - `MAASTRICHT` (11 features)
  - `MALMO` (5 features)
  - `MONTELIMAR` (8 features)
  - `MUENCHEN` (11 features)
  - `OSLO` (11 features)
  - `PERPIGNAN` (8 features)
  - `ROMA` (8 features)
  - `SONNBLICK` (8 features)
  - `STOCKHOLM` (7 features)
  - `TOURS` (8 features)

### 3.2 Meteorological Variables, Types, and Units

| Variable Suffix | Python Type | Physical Unit | Description | Typical Value Range |
|-----------------|-------------|---------------|-------------|---------------------|
| `precipitation` | `float64` | millimeters (mm) | Daily accumulated liquid rainfall | `0.0` to `120.0 mm` |
| `temp_mean` | `float64` | degrees Celsius (°C) | Mean daily ambient temperature | `-25.0` to `42.0 °C` |
| `temp_min` | `float64` | degrees Celsius (°C) | Minimum daily temperature | `-30.0` to `35.0 °C` |
| `temp_max` | `float64` | degrees Celsius (°C) | Maximum daily temperature | `-20.0` to `45.0 °C` |
| `humidity` | `float64` | ratio (0-1) or % | Relative atmospheric humidity | `0.10` to `1.00` (or `10%` to `100%`) |
| `pressure` | `float64` | bars / hPa | Atmospheric surface pressure | `0.950` to `1.045 bar` (`950` to `1045 hPa`) |
| `cloud_cover` | `int64` / `float64` | oktas (0-8) | Fractional sky cloud coverage | `0` to `8 oktas` |
| `sunshine` | `float64` | hours | Daily sunshine duration | `0.0` to `24.0 hours` |
| `global_radiation` | `float64` | W/m² or J/cm² | Solar irradiance measurement | `0.0` to `450.0 W/m²` |
| `wind_speed` | `float64` | m/s or km/h | Mean wind speed | `0.0` to `35.0 m/s` |
| `wind_gust` | `float64` | m/s or km/h | Maximum peak wind gust | `0.0` to `55.0 m/s` |

### 3.3 Target Variables for Multi-Target Regression

Per `ORIGINAL_REQUEST.md` (R2: "Train a machine learning model capable of predicting multiple weather/climate variables simultaneously (e.g., temperature, rainfall)") and backend hazard requirements:

The primary multi-target regression variables are:
1. **Target 1: Precipitation / Rainfall** (`precipitation` or `rainfall`)
   - Type: `float`
   - Unit: `mm`
   - Backend Consumer: `backend/core/risk_engine.py` (Flood risk formula: `rain * 2`; Landslide risk formula: `rain * 0.5`)
2. **Target 2: Temperature** (`temp_mean`, `temp_max`, `temp_min`)
   - Type: `float`
   - Unit: `°C`
   - Backend Consumer: `backend/core/risk_engine.py` (Heat risk formula: `(temp - 25) * 4`)
3. **Target 3: Humidity** (`humidity`)
   - Type: `float`
   - Unit: `%`
   - Backend Consumer: `backend/core/risk_engine.py` (Heat risk formula: `(humidity - 50) * 0.5`)
4. **Target 4: Wind Speed** (`wind_speed` or `wind_gust`)
   - Type: `float`
   - Unit: `m/s`
   - Backend Consumer: Secondary storm hazard modifier.

### 3.4 Feature Ordering & Schema Contract

To guarantee deterministic inference across training and backend serving:
1. The exported model artifact MUST store an explicit list of feature column names (e.g. `feature_names_in_` in scikit-learn).
2. The verification script (`verify_model.py`) and backend loader must accept an input dictionary or feature array and align features strictly against `feature_names_in_`.
3. If an input dictionary is passed:
   ```python
   feature_vector = [input_dict.get(col, np.nan) for col in model.feature_names_in_]
   ```
4. The preprocessing pipeline MUST include an imputer step (`SimpleImputer(strategy='median')` or `IterativeImputer`) so that missing or omitted input features do not cause runtime failures.

---

## 4. Output Prediction Format/Schema

### 4.1 Single Prediction Output Schema

```python
class WeatherPredictionResponse(BaseModel):
    """
    Standardized multi-target prediction response.
    """
    status: str = Field("success", example="success")
    predictions: Dict[str, float] = Field(
        ...,
        description="Dictionary mapping target variable names to numeric predicted values",
        example={
            "precipitation": 3.8,
            "temp_mean": 29.4,
            "temp_min": 24.2,
            "temp_max": 33.1,
            "humidity": 68.5
        }
    )
    raw_predictions: Optional[List[float]] = Field(
        None,
        description="Raw output vector from model.predict() matching target ordering",
        example=[3.8, 29.4, 24.2, 33.1, 68.5]
    )
    target_names: List[str] = Field(
        default=["precipitation", "temp_mean", "temp_min", "temp_max", "humidity"]
    )
    units: Dict[str, str] = Field(
        default={
            "precipitation": "mm",
            "temp_mean": "degC",
            "temp_min": "degC",
            "temp_max": "degC",
            "humidity": "%"
        }
    )
    model_version: str = "1.0.0"
    timestamp: str = Field(default="2026-09-03T18:00:00Z")
```

### 4.2 Batch Prediction Output Schema

```python
class WeatherBatchPredictionResponse(BaseModel):
    status: str = "success"
    count: int = Field(..., description="Number of prediction records in batch")
    results: List[WeatherPredictionResponse]
```

### 4.3 Direct Mapping into Backend `RouteSegment`

When integrated into `backend/core/segmentation.py` or `backend/api/routes.py`:
```python
# Extract predicted meteorological variables
pred_precip = max(0.0, float(predictions["precipitation"]))
pred_temp = float(predictions["temp_mean"])
pred_humidity = min(100.0, max(0.0, float(predictions["humidity"])))

# Direct assignment to RouteSegment attributes
segment["rainfall"] = round(pred_precip, 1)
segment["temperature"] = round(pred_temp, 1)
segment["humidity"] = round(pred_humidity, 1)
```

These values immediately feed into `backend/core/risk_engine.py`:
- **Flood Risk**:
  $$\text{flood\_score} = \min(100, \max(0, (\text{rainfall} \times 2) + (20 - \text{elevation}) \times 1.5 + (500 - \text{proximity}) \times 0.05 + (\text{historical} \times 20)))$$
- **Heat Risk**:
  $$\text{heat\_score} = \min(100, \max(0, (\text{temperature} - 25) \times 4 + (\text{humidity} - 50) \times 0.5))$$
- **Landslide Risk**:
  $$\text{landslide\_score} = \min(100, \max(0, \text{slope} \times 5 + \text{rainfall} \times 0.5))$$
- **Overall Risk**:
  $$\text{overall} = (0.6 \times \text{flood}) + (0.3 \times \text{heat}) + (0.1 \times \text{landslide})$$

---

## 5. Model Serialization, Loading, and Dependencies

### 5.1 Serialized Model Path Conventions

The model training pipeline in `d:\Aracnids\ml_training` must export artifacts adhering to the following path hierarchy:

1. **Primary Working Directory Artifact**:
   `d:\Aracnids\ml_training\weather_model.pkl` (and/or `d:\Aracnids\ml_training\weather_model.joblib`)
2. **Metadata & Evaluation Report**:
   `d:\Aracnids\ml_training\metrics.json` (and `metrics.txt`)
   Contains holdout evaluation metrics (RMSE, MAE, $R^2$) for each target variable and aggregate score.
3. **Verification Harness**:
   `d:\Aracnids\ml_training\verify_model.py`
4. **Backend Model Mirror / Asset Directory (Optional)**:
   `d:\Aracnids\backend\models\weather_model.pkl`

### 5.2 Serialization Format Comparison (`.pkl` vs `.joblib`)

| Feature | `.pkl` (Python standard `pickle`) | `.joblib` (`joblib.dump`) |
|---------|-----------------------------------|---------------------------|
| **Standard Library** | Yes (built-in `pickle` module) | No (requires `joblib` package) |
| **NumPy Optimization** | Good (with `pickle.HIGHEST_PROTOCOL` / protocol 5) | Best (zero-copy memory mapping for large arrays) |
| **Backend venv Status** | Available immediately without extra install | Requires `pip install joblib` in `backend/venv` |
| **Recommendation** | **Export both**, or use `.joblib` with standard `pickle` fallback in loader |

### 5.3 Unified Backend Model Loader Implementation

The backend should provide a robust model loader in `backend/core/weather_service.py` (or `backend/hazards/weather_model.py`):

```python
import os
import sys
from typing import Any, Optional

def get_model_path() -> str:
    """Resolve model file from environment variable or standard relative paths."""
    candidates = [
        os.getenv("WEATHER_MODEL_PATH", ""),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_training", "weather_model.pkl")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_training", "weather_model.joblib")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "weather_model.pkl")),
    ]
    for p in candidates:
        if p and os.path.exists(p):
            return p
    return candidates[1] # Default fallback path

def load_serialized_model(model_path: Optional[str] = None) -> Any:
    """Load serialized model pipeline supporting both joblib and pickle formats."""
    path = model_path or get_model_path()
    if not os.path.exists(path):
        raise FileNotFoundError(f"Weather model artifact not found at: {path}")
        
    if path.endswith(".joblib"):
        try:
            import joblib
            return joblib.load(path)
        except ImportError:
            pass # Fall through to pickle
            
    import pickle
    with open(path, "rb") as f:
        return pickle.load(f)
```

### 5.4 FastAPI Lifespan Management

FastAPI 0.141+ uses Starlette `lifespan` context managers for clean startup and shutdown:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging

logger = logging.getLogger("uvicorn")
model_registry = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load model into memory
    try:
        model_registry["weather_model"] = load_serialized_model()
        logger.info("Weather ML model successfully loaded.")
    except Exception as e:
        logger.warning(f"Weather ML model could not be loaded: {e}. Fallback enabled.")
        model_registry["weather_model"] = None
    yield
    # Shutdown: Release resources
    model_registry.clear()
```

### 5.5 Runtime Dependencies & Environment Requirements

- **Current `backend/venv` state**:
  - Python 3.13
  - Installed: `fastapi 0.141.1`, `pydantic 2.13.5`, `pandas 3.0.5`, `numpy 2.5.2`, `uvicorn 0.52.4`.
  - **Required Additions**:
    To load scikit-learn pipelines directly inside `backend/venv`, the virtual environment requires:
    - `scikit-learn` (e.g. `scikit-learn>=1.6.0`)
    - `joblib` (e.g. `joblib>=1.4.0`)
- **Global Python Environment (Anaconda)**:
  - Already has `scikit-learn 1.6.1` and `joblib 1.4.2` installed.
  - Python 3.12/3.13 compatible.
  - Verification scripts and training scripts can execute seamlessly in this environment.

---

## 6. Verification Harness Specification (`verify_model.py`)

Per acceptance criteria in `ORIGINAL_REQUEST.md`:
"A short verification script (`verify_model.py`) is provided. When run, it must successfully load the serialized model, accept a dummy input array/dictionary matching the feature schema, and output the multi-variable predictions without throwing any errors."

### Verification Script Interface Contract:

```python
"""
verify_model.py - Standalone Verification Harness for Weather Prediction ML Model
Location: d:/Aracnids/ml_training/verify_model.py
"""
import os
import sys
import numpy as np

def verify():
    # 1. Locate serialized model artifact
    model_path = os.path.join(os.path.dirname(__file__), "weather_model.pkl")
    if not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(__file__), "weather_model.joblib")
    assert os.path.exists(model_path), f"Artifact missing: {model_path}"
    
    # 2. Load model
    try:
        import joblib
        model = joblib.load(model_path)
    except Exception:
        import pickle
        with open(model_path, "rb") as f:
            model = pickle.load(f)
            
    # 3. Formulate representative dummy input
    # Must support feature dictionary or feature vector matching feature_names_in_
    n_features = len(model.feature_names_in_) if hasattr(model, "feature_names_in_") else 165
    dummy_features = np.zeros((1, n_features))
    
    # 4. Perform multi-target prediction
    predictions = model.predict(dummy_features)
    
    # 5. Assertions on output
    assert predictions.ndim == 2, "Expected 2D predictions array (n_samples, n_targets)"
    assert predictions.shape[0] == 1, "Expected 1 sample in output"
    assert predictions.shape[1] >= 2, f"Expected multi-target (>=2), got {predictions.shape[1]}"
    
    print("SUCCESS: Model verified successfully.")
    print(f"Output shape: {predictions.shape}")
    print(f"Predictions: {predictions[0]}")
    return True

if __name__ == "__main__":
    verify()
```

---

## 7. Architecture Summary & Data Flow Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT / UI                                |
|  - Web Frontend (React / Leaflet)                                       |
|  - Third-party IoT / Commuter / Logistics Services                      |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
POST /api/analyze-route                              POST /api/predict-weather
          |                                                   |
          v                                                   v
+-----------------------+                           +-------------------+
|  Routing Provider     |                           |  Weather Pydantic |
|  (Google / OSM /      |                           |  Input Validation |
|   Fallback JSON)      |                           +-------------------+
+-----------------------+                                     |
          |                                                   |
          v                                                   |
+-----------------------+                                     |
|  Route Segmentation   |                                     |
|  (~100m slices)       |                                     |
+-----------------------+                                     |
          |                                                   |
          +-------------------------+-------------------------+
                                    |
                                    v
                     +-----------------------------+
                     |   Weather ML Service        |
                     |   (Lifespan in-memory model |
                     |    weather_model.pkl)       |
                     +-----------------------------+
                                    |
               Predicts: [precipitation, temp, humidity]
                                    |
          +-------------------------+
          |
          v
+-----------------------------------+
|  Hazard Risk Engine               |
|  - Flood Risk: rain + elevation   |
|  - Heat Risk: temp + humidity     |
|  - Landslide Risk: slope + rain   |
|  - Overall Weighted Risk          |
+-----------------------------------+
          |
          v
+-----------------------------------+
|  Temporal Engine & Recommendation |
|  - T+15, T+30, T+45 forecast      |
|  - Departure window comparison    |
+-----------------------------------+
          |
          v
+-----------------------------------+
|  Response JSON                    |
|  (segments, risks, provenance)    |
+-----------------------------------+
```

---

## 8. Recommendations for Orchestrator & Implementation Track

1. **Target Variables Selection**:
   Train the multi-target model to predict at least the core trio:
   - `precipitation` (or `rainfall`) [mm]
   - `temp_mean` (or `temperature`) [°C]
   - `humidity` [%]
   Plus auxiliary targets: `temp_min`, `temp_max`, `cloud_cover`.
2. **Export Both Formats**:
   Save both `weather_model.pkl` (using `pickle.dump(..., protocol=5)`) and `weather_model.joblib`.
3. **Embed Preprocessing in Pipeline**:
   Ensure `Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler()), ('regressor', MultiOutputRegressor(...))])` is self-contained so the backend only needs to feed raw numbers without separate preprocessing code.
4. **Backward-Compatible Backend Changes**:
   When implementing weather model loading in `backend`, keep the existing heuristic baseline as a fallback so that all existing frontend features and fallback routes continue functioning without regression.

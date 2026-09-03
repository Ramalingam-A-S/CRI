# Test Infrastructure & Specification Document: Weather Prediction ML & FastAPI Integration

**Target Project**: ClimateRoute Weather Prediction ML & FastAPI Intelligence  
**Document**: `TEST_INFRA.md`  
**Test Suite File**: `d:\Aracnids\tests\test_e2e_weather_ml.py`  
**Author**: E2E Test Writer  
**Integrity Mode**: Development / Independent Verification  
**Date**: 2026-09-03  

---

## 1. Test Architecture & Methodology

This test infrastructure is designed as an **opaque-box, requirement-driven end-to-end (E2E) test harness** verifying all requirements (R1 Data Processing, R2 Model Training, R3 Model Export) and acceptance criteria outlined in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `backend_integration_spec.md`.

### Core Architectural Principles:
1. **Opaque-Box Verification**: The test suite tests the system via public interfaces, CLI commands, file artifacts, and REST API endpoints without coupling to internal private implementation details.
2. **Authoritative Expected Output Derivation**: Every test case derives expected results from an explicit oracle:
   - Historical ground-truth dataset schemas (`weather_prediction_dataset.csv` and `weather-prediction-metadata.json`).
   - Physical atmospheric laws (e.g. non-negative precipitation $RR \ge 0.0$, relative humidity bounded $0 \le HU \le 100\%$, barometric pressure near $1000\text{ hPa}$).
   - Mathematical equations governing downstream hazard risk scores (`risk_engine.py`).
   - Pydantic schema contracts and HTTP status codes defined in `backend_integration_spec.md`.
3. **Dual Test Runner Compatibility**: The test suite is implemented to execute interchangeably under both standard **`pytest`** and Python's built-in **`unittest`** (`python -m unittest tests/test_e2e_weather_ml.py`), requiring no proprietary test runners.
4. **Strict Test Isolation & Independence**: Each test manages its own temporary state, test client context, or isolated data subsets without cross-test state leakage.
5. **Adversarial & Fault Resilience Testing**: Includes stress tests for missing keys, all-NaN arrays, out-of-bounds meteorological inputs, malformed temporal strings, and extreme hazard values.

---

## 2. Feature Inventory & Requirement Traceability Matrix

| Feature ID | Feature Name | Source Requirement | Target Component | Test Coverage Tier |
|:---|:---|:---|:---|:---|
| **F1** | Dataset Ingestion & Schema Integrity | R1 Data Processing | `weather_prediction_dataset.csv`, `weather-prediction-metadata.json` | Tier 1 (T1.1) |
| **F2** | European Meteorological Sentinel Cleaning | R1 Data Processing | `ml_training/data_processor.py` | Tier 1 (T1.2), Tier 2 (T2.2) |
| **F3** | Preprocessing Pipeline (Imputation & Scaling) | R1 Data Processing | `SimpleImputer`, `StandardScaler`, cyclical encodings | Tier 1 (T1.3), Tier 2 (T2.1) |
| **F4** | Multi-Target Regression Model Inference | R2 Model Training | `MultiOutputRegressor`, multi-target vector `(N, K)` | Tier 1 (T1.4), Tier 3 (T3.1) |
| **F5** | Serialized Artifact Export (`.joblib` / `.pkl`) | R3 Model Export, AC 1 | `ml_training/model.joblib`, `weather_model.pkl` | Tier 1 (T1.5), Tier 3 (T3.2) |
| **F6** | Holdout Evaluation Reports (`metrics.json`/`txt`) | R2 Model Training, AC 2 | `ml_training/metrics.json`, `ml_training/metrics.txt` | Tier 1 (T1.6) |
| **F7** | Verification Harness Script (`verify_model.py`) | AC 3 (Programmatic Verification) | `ml_training/verify_model.py` | Tier 1 (T1.7), Tier 3 (T3.3) |
| **F8** | Dedicated Weather API (`POST /api/predict-weather`) | R3 Backend Integration | `backend/api/routes.py`, `backend/core/weather_predictor.py` | Tier 4 (T4.1) |
| **F9** | Model Introspection API (`GET /api/weather/model-info`)| R3 Backend Integration | `backend/api/routes.py` | Tier 4 (T4.2) |
| **F10**| Route Segment Environmental Enrichment | Backend Integration | `backend/core/segmentation.py` | Tier 4 (T4.3) |
| **F11**| Dynamic Multi-Hazard Risk Scoring | Backend Risk Engine | `backend/core/risk_engine.py` | Tier 4 (T4.3, T4.4) |
| **F12**| Data Provenance & Attribution | Backend Auditing | `backend/api/routes.py:41` | Tier 4 (T4.5) |

---

## 3. Four-Tier Test Case Mapping

### Tier 1: Feature Coverage
Validates the fundamental functional capabilities, file artifacts, interfaces, and evaluation outputs.

| Test ID | Test Name | Target Subject | Inputs | Authoritative Oracle / Expected Output | Assertions |
|:---|:---|:---|:---|:---|:---|
| **T1.1** | `test_tier1_dataset_schema_and_completeness` | Dataset & Croissant Metadata | `weather_prediction_dataset.csv`, `weather-prediction-metadata.json` | 3,654 rows, 165 columns, DATE 20000101 to 20100101, zero missing dates | `df.shape == (3654, 165)`, `metadata["cr:recordSet"]` stations count == 18 |
| **T1.2** | `test_tier1_sentinel_value_detection_and_cleaning` | Sentinel Value Sanitization | Raw station columns with known sentinel codes (`-99`, `-0.0990`, `0.0003`, `-1.70`) | Sentinel values identified, replaced with NaN, and handled by median imputation | No sentinel flags remain after cleaning; `SimpleImputer` fills medians without error |
| **T1.3** | `test_tier1_preprocessing_pipeline_transformers` | Preprocessing Transformers | Cyclical calendar inputs ($\sin/\cos$) and numerical features | $\sin, \cos \in [-1.0, 1.0]$; `StandardScaler` produces $\mu \approx 0, \sigma \approx 1$ | Transformation bounds strictly maintained; transformed shape matches input shape |
| **T1.4** | `test_tier1_multi_target_inference_shape` | Multi-Target Regression | 2D dummy sample `(1, n_features)` | Output vector has dimension `(1, K)` with $K \ge 3$ (temp, precip, humidity) | `preds.shape[1] >= 3`, all values finite floats |
| **T1.5** | `test_tier1_model_serialization_artifacts_exist` | Artifact Verification | Model files in `d:\Aracnids\ml_training` | At least one serialized artifact exists (`model.joblib` or `weather_model.pkl`) and `model_metadata.json` exists | File size > 10 KB, valid load via `joblib.load` / `pickle.load` |
| **T1.6** | `test_tier1_evaluation_metrics_report_format` | Metrics Reports | `ml_training/metrics.json` and `metrics.txt` | JSON contains `overall_metrics` with RMSE, MAE, $R^2$; TXT contains formatted table | `metrics.json` parses as valid dict, $R^2 > 0$ for temperature, text file non-empty |
| **T1.7** | `test_tier1_verify_model_script_execution` | Standalone Harness | `python ml_training/verify_model.py` via subprocess | Acceptance Criteria 3: executes without error, exits with code 0 | Subprocess `returncode == 0`, output contains verification confirmation |

---

### Tier 2: Boundary & Corner Cases
Validates stability and error handling under extreme, degenerate, or missing inputs.

| Test ID | Test Name | Target Subject | Inputs | Authoritative Oracle / Expected Output | Assertions |
|:---|:---|:---|:---|:---|:---|
| **T2.1** | `test_tier2_all_zeros_feature_input` | Model Imputer & Regressor | Feature vector of all zeros `(1, n_features)` | Valid numeric output; no zero-division or crash | All output targets finite, no NaN, no Inf |
| **T2.2** | `test_tier2_all_nan_feature_input` | Imputation Robustness | Feature vector of all `np.nan` values | Imputer fills station medians; model returns baseline predictions | Outputs are non-NaN finite floats |
| **T2.3** | `test_tier2_partial_dict_missing_features` | Inference Interface | Dictionary with only 1 or 2 features provided | Missing keys automatically imputed with medians | Successful prediction matching target schema |
| **T2.4** | `test_tier2_extreme_meteorological_values` | Physical Boundary Clamping | Inputs with extreme values: temp +65 °C, temp -50 °C, rainfall 500 mm | Physical constraints enforced: precipitation $\ge 0.0$, humidity clamped $[0, 100]\%$ | `pred_precip >= 0.0`, `0.0 <= pred_humidity <= 100.0` |
| **T2.5** | `test_tier2_invalid_feature_dimension_rejection` | Input Dimension Validation | Feature array of incorrect shape (e.g. `(1, 10)` instead of 165) | Dimension mismatch raises ValueError or returns HTTP 422 | `ValueError` raised or 422 Unprocessable Entity |
| **T2.6** | `test_tier2_route_segmentation_degenerate_inputs` | Geospatial Segmentation | Empty route coordinates `[]` or single point `[[0, 0]]` | `segment_route()` returns empty list `[]` without crash | `len(segments) == 0` |
| **T2.7** | `test_tier2_invalid_departure_time_format` | Temporal Engine | Malformed time strings: `"invalid"`, `"25:99"` | Falls back gracefully to current time without 500 crash | Route analysis completes, valid arrival times produced |

---

### Tier 3: Cross-Feature Combinations
Validates end-to-end multi-module pipelines, serialization interchangeability, and cross-component consistency.

| Test ID | Test Name | Target Subject | Inputs | Authoritative Oracle / Expected Output | Assertions |
|:---|:---|:---|:---|:---|:---|
| **T3.1** | `test_tier3_e2e_training_pipeline_roundtrip` | Full Training Pipeline Roundtrip | Raw slice of `weather_prediction_dataset.csv` | Train pipeline -> dump to disk -> load from disk -> predictions match in-memory model | Difference between in-memory and loaded predictions $|\Delta| < 10^{-5}$ |
| **T3.2** | `test_tier3_serialization_format_interchangeability` | Joblib vs Pickle Compatibility | Pipeline serialized to `.joblib` and `.pkl` | Both loaders (`joblib.load` and `pickle.load`) deserialize functional pipelines | Output predictions numerically identical across formats |
| **T3.3** | `test_tier3_metadata_schema_alignment` | Model ↔ Metadata Alignment | `model_metadata.json` vs loaded model artifact | Feature count and names match `model.feature_names_in_`; targets match output columns | Length equality, exact string set equality |
| **T3.4** | `test_tier3_model_disk_artifact_to_weather_service` | Model Disk Artifact ↔ Backend Service | Serialized artifact loaded via `WeatherPredictorService` | Singleton service loads disk artifact, serves predictions matching direct model call | Predicted rainfall, temp, and humidity align within rounding tolerance |

---

### Tier 4: Real-World Application Scenarios
Validates user journeys and system integration: FastAPI HTTP calls, dynamic route segment weather enrichment, hazard scoring, and scenario overrides.

| Test ID | Test Name | Target Subject | Inputs | Authoritative Oracle / Expected Output | Assertions |
|:---|:---|:---|:---|:---|:---|
| **T4.1** | `test_tier4_fastapi_predict_weather_endpoint` | Dedicated Weather Endpoint | `POST /api/predict-weather` with realistic features dict | HTTP 200, `status == "success"`, numeric `temperature`, `rainfall`, `humidity` | Schema adherence, valid temperature ([-20, 50] °C), rainfall $\ge 0.0$ |
| **T4.2** | `test_tier4_fastapi_weather_model_info_endpoint` | Model Introspection Endpoint | `GET /api/weather/model-info` | HTTP 200, contains model name, targets list, feature count | `resp.status_code == 200`, `"targets"` in response |
| **T4.3** | `test_tier4_route_analysis_with_ml_weather_enrichment` | Route Analysis Endpoint | `POST /api/analyze-route` with `origin="VIT Chennai"`, `destination="Chennai Airport"` | HTTP 200, route segments contain dynamic `rainfall`, `temperature`, `humidity` | Segments non-empty, hazard scores present and bounded $[0, 100]$ |
| **T4.4** | `test_tier4_hazard_risk_engine_mathematical_precision` | Core Risk Engine | Route segment with known weather values | Risk engine formulas match spec: flood, heat, landslide, overall weighted risk | Calculated scores match mathematical definitions within $\pm 0.1$ |
| **T4.5** | `test_tier4_scenario_multiplier_heavy_rain` | Hazard Scenario Interaction | `POST /api/analyze-route` with `scenario="HEAVY RAIN"` | 2.5x rainfall modifier increases flood risk relative to `BASELINE` | `flood_score_heavy >= flood_score_baseline` |
| **T4.6** | `test_tier4_data_provenance_attribution` | System Audit & Provenance | `POST /api/analyze-route` response | `data_provenance` contains entry for `WEATHER` with declared source and status | Prov entry exists, `type == "WEATHER"` |

---

## 4. Execution & Verification Guide

### 4.1 Running with Pytest
```powershell
# Run the complete E2E test suite with verbose output
python -m pytest tests/test_e2e_weather_ml.py -v

# Run a specific tier (e.g. Tier 1)
python -m pytest tests/test_e2e_weather_ml.py -k "tier1" -v

# Run with stdout printing enabled
python -m pytest tests/test_e2e_weather_ml.py -s -v
```

### 4.2 Running with Python Built-in Unittest
```powershell
python -m unittest tests/test_e2e_weather_ml.py -v
```

### 4.3 Environment Configuration
The test suite automatically configures the environment to prevent Windows 11 `loky`/`wmic` warnings by setting `os.environ['LOKY_MAX_CPU_COUNT'] = '4'`.

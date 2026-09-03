# Project: Weather Prediction Machine Learning & FastAPI Integration

## Architecture
- **Data Source**: `d:\Aracnids\weather_prediction_dataset.csv` (10 years daily weather, 3654 rows × 165 cols from 18 European meteorological stations) and `weather-prediction-metadata.json`.
- **Target Variables (Multi-Target Regression)**:
  - `BASEL_temp_mean` (°C) — Maps to backend route segment temperature.
  - `BASEL_precipitation` (cm / mm) — Maps to backend route segment rainfall.
  - `BASEL_humidity` (fraction / %) — Maps to backend route segment humidity.
  - Auxiliary targets: `BASEL_temp_min`, `BASEL_temp_max`, `BASEL_sunshine`.
- **ML Pipeline Architecture**:
  - Sentinel value cleaning (Stockholm & Tours sentinel pressure/cloud/sunshine codes).
  - Feature engineering: calendar cyclical ($\sin/\cos$), lag features, rolling statistics.
  - Chronological 80/20 train-test split (Train: 2000–2007, Holdout Test: 2008–2009).
  - Scikit-Learn `Pipeline` encapsulating `SimpleImputer(strategy='median')`, `StandardScaler()`, and `MultiOutputRegressor(HistGradientBoostingRegressor(max_iter=100, max_depth=8, l2_regularization=1.0, random_state=42))`.
  - Serialization: Compressed `model.joblib` (and `weather_model.pkl` / `weather_model.joblib`) in `d:\Aracnids\ml_training`.
- **FastAPI Integration**:
  - In `d:\Aracnids\backend`: Dedicated prediction endpoints `POST /api/predict-weather` and `GET /api/weather/model-info`.
  - In-process enrichment in `backend/core/segmentation.py` replacing hardcoded constants with dynamic model predictions.
  - Verification harness: `d:\Aracnids\ml_training\verify_model.py`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Dataset Ingestion & Sentinel Sanitization | Load `weather_prediction_dataset.csv`, clean negative pressure/sunshine and invalid cloud sentinels | M1 | Survey 1 |
| 2 | Feature Engineering & Preprocessing Pipeline | Cyclical calendar features, imputation (`SimpleImputer`), scaling (`StandardScaler`), temporal split | M1 | Survey 1, 3 |
| 3 | Multi-Target Model Training | Train `MultiOutputRegressor` on temperature, precipitation, and humidity targets | M2 | Survey 3, R2 |
| 4 | Holdout Model Evaluation & Reports | Calculate RMSE, MAE, R² on 2008–2009 holdout set; export `metrics.json` and `metrics.txt` | M2 | Survey 3, R2 |
| 5 | Model Serialization | Export trained pipeline to `weather_model.pkl`, `weather_model.joblib`, and `model_metadata.json` in `ml_training` | M3 | Survey 2, 3, R3 |
| 6 | Verification Script (`verify_model.py`) | Standalone harness in `ml_training` validating model loading, schema inference, imputation, bounds, latency | M3 | Acceptance Criteria |
| 7 | FastAPI Backend Weather Integration | Implement `POST /api/predict-weather` endpoint and update route segment weather enrichment | M3 | Survey 2, R3 |
| 8 | E2E Testing Suite (Tiers 1–4) | Requirement-driven opaque-box test suite verifying all acceptance criteria, interfaces, and endpoints | E2E-Track | Dual Track |
| 9 | 100% E2E Pass & Adversarial Hardening (Tier 5) | Validate all E2E tests pass 100% and execute adversarial white-box coverage hardening | M4 | Final Milestone |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Requirement-driven test harness, Tiers 1-4 tests, publish TEST_READY.md | none | IN_PROGRESS |
| M1 | Data Processing & Preprocessing Pipeline | Sentinel cleaning, temporal splitting, feature transformation pipeline in `ml_training/data_processor.py` | none | IN_PROGRESS |
| M2 | Multi-Target ML Model Training & Evaluation | Train multi-target regressor, compute validation metrics, output `metrics.json` and `metrics.txt` | M1 | PLANNED |
| M3 | Model Export, Verification Script & FastAPI Bridge | Export `weather_model.pkl`/`.joblib`, create `verify_model.py`, integrate FastAPI endpoints | M2 | PLANNED |
| M4 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Pass 100% E2E test suite and conduct Tier 5 adversarial stress testing | E2E, M3 | PLANNED |

## Interface Contracts
### Data Processing ↔ Model Training
- Function: `get_preprocessed_data(data_path: str = 'd:/Aracnids/weather_prediction_dataset.csv') -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, List[str], List[str]]`
- Returns: `(X_train, y_train, X_test, y_test, feature_names, target_names)`
- Target columns: `['BASEL_temp_mean', 'BASEL_precipitation', 'BASEL_humidity']`
- Preprocessing transformer: `SimpleImputer(strategy='median')` followed by `StandardScaler()`.

### Serialized Model ↔ Verification Script (`verify_model.py`)
- Artifact Path: `d:\Aracnids\ml_training\weather_model.pkl` and `weather_model.joblib`
- Loader: `joblib.load()` or `pickle.load()`
- Input Schema: 2D array of shape `(N, n_features)` OR pandas DataFrame with feature column names OR dict with partial/full feature names.
- Output: 2D array `(N, 3)` or dict of predicted values `{'temperature': float, 'rainfall': float, 'humidity': float}`.
- Exit code: 0 on success with prediction outputs printed to stdout.

### ML Model ↔ FastAPI Backend
- Endpoint: `POST /api/predict-weather`
- Request Schema:
  ```json
  {
    "features": {"BASEL_temp_mean": 15.2, "BASEL_humidity": 0.65, "...": 0.0},
    "station": "BASEL"
  }
  ```
- Response Schema:
  ```json
  {
    "temperature": 16.1,
    "rainfall": 0.12,
    "humidity": 0.68,
    "status": "success"
  }
  ```

## Code Layout
```
d:\Aracnids/
├── weather_prediction_dataset.csv          # Raw European weather dataset
├── weather-prediction-metadata.json        # Dataset Croissant metadata
├── ml_training/                            # Implementation artifacts
│   ├── __init__.py
│   ├── data_processor.py                   # Data ingestion, cleaning, pipeline definition
│   ├── train.py                            # Training script, hyperparameter tuning, evaluation
│   ├── weather_model.pkl                   # Serialized trained model (pickle)
│   ├── weather_model.joblib                # Serialized trained model (joblib)
│   ├── model_metadata.json                 # Feature names, targets, preprocessing schema
│   ├── metrics.json                        # Machine-readable evaluation report
│   ├── metrics.txt                         # Human-readable evaluation report
│   └── verify_model.py                     # Programmatic verification test harness
├── backend/
│   ├── api/routes.py                       # FastAPI route handlers (predict-weather, analyze-route)
│   ├── core/weather_predictor.py           # Model loader & inference singleton
│   └── core/risk_engine.py                 # Hazard scoring using ML predicted weather
└── tests/
    └── test_e2e_weather_ml.py              # Requirement-driven E2E test suite
```

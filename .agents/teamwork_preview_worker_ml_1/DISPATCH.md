# DISPATCH - ML Implementation Worker

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mission
Implement the full Weather Prediction Machine Learning system and FastAPI integration per requirements R1, R2, R3.

Read these essential inputs before starting:
- `d:\Aracnids\.agents\ORIGINAL_REQUEST.md`
- `d:\Aracnids\.agents\PROJECT.md`
- `d:\Aracnids\.agents\teamwork_preview_explorer_survey_1\survey_dataset_report.md`
- `d:\Aracnids\.agents\teamwork_preview_spec_miner_survey_2\backend_integration_spec.md`
- `d:\Aracnids\.agents\teamwork_preview_explorer_survey_3\ml_architecture_report.md`

Exclusively Owned Files:
- `d:\Aracnids\ml_training\__init__.py`
- `d:\Aracnids\ml_training\data_processor.py`
- `d:\Aracnids\ml_training\train.py`
- `d:\Aracnids\ml_training\weather_model.pkl`
- `d:\Aracnids\ml_training\weather_model.joblib`
- `d:\Aracnids\ml_training\model_metadata.json`
- `d:\Aracnids\ml_training\metrics.json`
- `d:\Aracnids\ml_training\metrics.txt`
- `d:\Aracnids\ml_training\verify_model.py`
- `d:\Aracnids\backend\core\weather_predictor.py`
- `d:\Aracnids\backend\api\routes.py` (add /api/predict-weather and /api/weather/model-info endpoints)

Implementation Steps:
1. `ml_training/data_processor.py`:
   - Load `weather_prediction_dataset.csv`.
   - Clean sentinel codes (`STOCKHOLM_cloud_cover`, `STOCKHOLM_pressure`, `TOURS_pressure`, `STOCKHOLM_sunshine`).
   - Create chronological split: Train (2000–2007), Holdout Test (2008–2009).
   - Define multi-target vectors: `BASEL_temp_mean`, `BASEL_precipitation`, `BASEL_humidity` (plus auxiliary targets if helpful).
   - Set up Scikit-learn preprocessing pipeline (`SimpleImputer(strategy='median')` and `StandardScaler()`).
2. `ml_training/train.py`:
   - Construct end-to-end `Pipeline` with `SimpleImputer`, `StandardScaler`, and `MultiOutputRegressor(HistGradientBoostingRegressor(max_iter=100, max_depth=8, l2_regularization=1.0, random_state=42))`.
   - Include Random Forest fallback if necessary.
   - Note Windows 11 Loky fix: `os.environ['LOKY_MAX_CPU_COUNT'] = '4'`.
   - Fit model on training split.
   - Evaluate on holdout test set (calculate RMSE, MAE, R² per target and overall).
   - Export evaluation reports: `ml_training/metrics.json` and `ml_training/metrics.txt`.
   - Export serialized artifacts: `ml_training/weather_model.pkl` and `ml_training/weather_model.joblib` (and `model.joblib`), plus `model_metadata.json`.
3. `ml_training/verify_model.py`:
   - Standalone script adhering to acceptance criteria:
     - Loads serialized model from `ml_training`.
     - Accepts dummy input array/dictionary matching feature schema.
     - Tests missing value imputation handling.
     - Checks prediction outputs are multi-variable and within physical bounds.
     - Exits with code 0 upon success, printing clear verification results.
4. FastAPI Backend Integration:
   - Ensure `scikit-learn` and `joblib` are available in the backend environment (e.g. `d:\Aracnids\backend\venv\Scripts\pip.exe install scikit-learn joblib`).
   - Create `backend/core/weather_predictor.py` singleton loader.
   - Add `POST /api/predict-weather` and `GET /api/weather/model-info` to `backend/api/routes.py`.
   - Verify server starts and endpoints respond correctly.
5. Run full builds and verification tests to confirm all artifacts exist and `verify_model.py` passes.
6. Write full handoff report to `d:\Aracnids\.agents\teamwork_preview_worker_ml_1\handoff.md`.

## 2026-09-03T16:04:06Z
Received user assignment:
Implement the complete Weather Prediction Machine Learning pipeline and FastAPI integration:
1. `ml_training/data_processor.py`: Data ingestion, sentinel cleaning, feature engineering, chronological train/test split.
2. `ml_training/train.py`: Multi-target regression pipeline (`SimpleImputer` + `StandardScaler` + `MultiOutputRegressor(HistGradientBoostingRegressor(random_state=42))`), model training on train split, evaluation on holdout test split, generation of `metrics.json` and `metrics.txt`, export of `weather_model.pkl` and `weather_model.joblib` (and `model.joblib`), plus `model_metadata.json`. (Remember: set `os.environ['LOKY_MAX_CPU_COUNT'] = '4'`).
3. `ml_training/verify_model.py`: Standalone script meeting acceptance criteria (loads model, tests dummy inputs, tests missing feature imputation, verifies multi-variable output, bounds, latency, exits with code 0).
4. FastAPI Integration: Sync `scikit-learn` and `joblib` into `backend/venv`, add `backend/core/weather_predictor.py`, and implement `POST /api/predict-weather` and `GET /api/weather/model-info` in `backend/api/routes.py`.
5. Run the build/training commands and execute `verify_model.py` to confirm all artifacts are generated and passing.
6. Write your complete handoff report to `d:\Aracnids\.agents\teamwork_preview_worker_ml_1\handoff.md`.


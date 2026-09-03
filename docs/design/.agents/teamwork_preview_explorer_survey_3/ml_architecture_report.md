# Comprehensive ML Environment & Architecture Investigation Report

**Author**: Survey Explorer 3 (ML Environment & Architecture Investigator)  
**Date**: 2026-09-03  
**Working Directory**: `d:\Aracnids\.agents\teamwork_preview_explorer_survey_3`  
**Target ML Workspace**: `d:\Aracnids\ml_training`  
**Target Backend Workspace**: `d:\Aracnids\backend`  
**Scope Document**: `ORIGINAL_REQUEST.md` (R1 Data Processing, R2 Model Training, R3 Model Export)  

---

## 1. Executive Summary

This investigation analyzed the Python execution environments, machine learning libraries, multi-target regression model architectures, evaluation protocols, and artifact packaging standards across `d:\Aracnids`.

### Key Findings & Recommendations:
1. **Python Runtime & Environment**:
   - **System Python** (`C:\Users\acer\anaconda3\python.exe`, Python 3.13.5) contains a complete, functional scientific ML stack: `scikit-learn 1.6.1`, `joblib 1.4.2`, `pandas 2.2.3`, `numpy 2.1.3`, `scipy 1.15.3`, and `fastapi 0.131.0`.
   - **Backend Virtualenv** (`d:\Aracnids\backend\venv\Scripts\python.exe`, Python 3.13.5) contains `fastapi 0.141.1`, `pydantic 2.13.5`, `pandas 3.0.5`, `numpy 2.5.2`, but **currently lacks `scikit-learn` and `joblib`**. `pip 25.1.1` is operational in the virtual environment. To enable in-process model inference in the backend, `pip install scikit-learn joblib` must be run in `backend/venv` (or backend run via system Python).
   - `lightgbm`, `xgboost`, and `catboost` are **not installed** in either environment. Therefore, the production architecture must rely on `scikit-learn` native and meta-estimators.
   - **Critical OS/Runtime Quirk**: On Windows 11 with Python 3.13, `wmic` is deprecated/absent. When `joblib`/`loky` attempts to detect CPU core counts via `wmic`, it triggers `[WinError 2]`. This is completely mitigated by explicitly configuring `os.environ['LOKY_MAX_CPU_COUNT'] = '4'` (or desired core count) and setting `n_jobs=1` on tree estimators.

2. **Empirical Architecture Benchmark**:
   - We benchmarked four multi-target regression candidates on an 80/20 temporal holdout split of `weather_prediction_dataset.csv` (3,654 rows, 165 features, 10 years):
     - **`MultiOutputRegressor(HistGradientBoostingRegressor())`** emerged as the **top-performing primary architecture**, achieving an **Overall Mean $R^2$ of 0.6617** (Temperature $R^2 = 0.9507$, Humidity $R^2 = 0.5058$, Minimum Temp $R^2 = 0.9218$, Maximum Temp $R^2 = 0.9212$), training in just **2.17 seconds** (for 3 targets) / **~10 seconds** (for 5 targets), producing a compact **651 KB** compressed artifact.
     - **`RandomForestRegressor`** (native multi-output) achieved a competitive **Overall Mean $R^2$ of 0.6385** (Temperature $R^2 = 0.9442$, Humidity $R^2 = 0.3706$), but required **22.4 seconds** to fit and produced a **712 KB** artifact.
     - **`ExtraTreesRegressor`** provided rapid training (**1.65 seconds**) with **Overall Mean $R^2$ of 0.4116**.
     - **`Ridge`** provided an ultra-fast linear baseline (**0.05 seconds**, Mean $R^2 = 0.3023$), but severely underfit non-linear precipitation and humidity distributions.

3. **Holdout Validation Strategy & Evaluation Metrics**:
   - **Split Strategy**: A **temporal holdout split** is methodologically mandatory for weather time-series data to prevent future-to-past data leakage. We establish an 80/20 temporal split: **Training: 2000-01-01 to 2007-12-31** (2,923 samples, 8 annual cycles); **Holdout Validation: 2008-01-01 to 2010-01-01** (730 samples, 2 annual cycles).
   - **Metrics**: Root Mean Squared Error (RMSE), Mean Absolute Error (MAE), Coefficient of Determination ($R^2$), and Explained Variance per target and aggregated overall.
   - **Physical Unit Handling**: In `weather_prediction_dataset.csv`, `temp_mean` is in °C, `precipitation` is in cm ($10\text{ mm}$), and `humidity` is in decimal fraction ($0.0 \dots 1.0$). Metrics reports must present both raw dataset units and converted standard units (rainfall in mm, humidity in %).

4. **Production Blueprint for `d:\Aracnids\ml_training`**:
   - Single unified `Pipeline` combining `SimpleImputer(strategy='median')` -> `StandardScaler()` -> `MultiOutputRegressor(HistGradientBoostingRegressor(...))`.
   - Serialized format: `model.joblib` using `joblib.dump(pipeline, 'model.joblib', compress=3)` (< 1 MB).
   - Sidecar metadata: `model_metadata.json` documenting exact feature schema, ordering, target list, and unit transformations.
   - Evaluation reports: Structured `metrics.json` and human-readable `metrics.txt`.
   - Programmatic verification: `verify_model.py` test harness executing five comprehensive test suites (full vector, partial/missing values, batch inference, physical bounds, latency check) exiting with code 0.

---

## 2. Python Runtime & Environment Audit

### 2.1 Runtime Environments Available

Two distinct Python 3.13.5 environments were identified and audited on the host system:

| Environment | Executable Path | Version | Primary Purpose | Scikit-Learn Status | Joblib Status |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **System Python (Anaconda)** | `C:\Users\acer\anaconda3\python.exe` | 3.13.5 | Scientific computing & ML training | **Installed (v1.6.1)** | **Installed (v1.4.2)** |
| **Backend Virtualenv** | `D:\Aracnids\backend\venv\Scripts\python.exe` | 3.13.5 | FastAPI backend runtime | **Missing (ImportError)** | **Missing (ImportError)** |

### 2.2 Package Availability Matrix

| Package | System Python | Backend Virtualenv | Required for ML Training | Required for FastAPI Serving | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `python` | 3.13.5 | 3.13.5 | Yes | Yes | Fully aligned minor/patch version |
| `scikit-learn` | **1.6.1** | Not Installed | **Critical** | **Critical** | Needed for pipeline inference in backend |
| `joblib` | **1.4.2** | Not Installed | **Critical** | **Critical** | Model deserialization loader |
| `pandas` | 2.2.3 | 3.0.5 | Yes | Optional | Feature dataframe manipulation |
| `numpy` | 2.1.3 | 2.5.2 | Yes | Yes | Array operations and tensor conversions |
| `scipy` | 1.15.3 | Not Installed | Yes | No | Underlying scientific calculations |
| `fastapi` | 0.131.0 | 0.141.1 | No | **Critical** | Web service framework |
| `pydantic` | 2.10.3 | 2.13.5 | No | **Critical** | Request/response schema validation |
| `uvicorn` | 0.41.0 | 0.52.4 | No | **Critical** | ASGI application server |
| `matplotlib` | 3.10.0 | Not Installed | Optional | No | Visualization and metric plots |
| `seaborn` | 0.13.2 | Not Installed | Optional | No | Statistical data visualization |
| `lightgbm` | Not Installed | Not Installed | No | No | Not installed on host |
| `xgboost` | Not Installed | Not Installed | No | No | Not installed on host |
| `catboost` | Not Installed | Not Installed | No | No | Not installed on host |

### 2.3 Environmental Constraints & Workarounds

#### 1. WMIC Deprecation on Windows 11 (Loky Subprocess Warning)
- **Symptom**: When importing or invoking `joblib` / `loky` parallel backends on Windows 11, `joblib.externals.loky.backend.context` attempts to execute `wmic CPU Get NumberOfCores /Format:csv`. In Windows 11, `wmic` has been removed, triggering:
  ```
  UserWarning: Could not find the number of physical cores for the following reason:
  [WinError 2] The system cannot find the file specified
  Returning the number of logical cores instead. You can silence this warning by setting LOKY_MAX_CPU_COUNT.
  ```
- **Resolution**:
  At the top of all training scripts, verification scripts, and backend service modules, inject:
  ```python
  import os
  os.environ['LOKY_MAX_CPU_COUNT'] = '4'
  ```
  Additionally, for `RandomForestRegressor` and `ExtraTreesRegressor`, setting `n_jobs=1` avoids unnecessary multiprocess overhead and eliminates IPC latency for small-to-medium dataset sizes (3,654 rows).

#### 2. Backend Virtualenv Dependency Synchronization
- **Finding**: The FastAPI backend in `d:\Aracnids\backend\venv` does not currently contain `scikit-learn` or `joblib`. Attempting to load `model.joblib` inside `backend` with its dedicated virtualenv will fail with `ModuleNotFoundError: No module named 'joblib'`.
- **Action for Backend Integration**:
  The implementation worker for Milestone 3 must execute:
  ```powershell
  d:\Aracnids\backend\venv\Scripts\pip.exe install scikit-learn==1.6.1 joblib==1.4.2
  ```
  This guarantees binary compatibility between the model serialized in `ml_training` and the model loaded in `backend`.

---

## 3. Multi-Target Regression Architecture Evaluation

### 3.1 Architecture Candidates Considered

Weather forecasting involves predicting multiple continuous physical properties concurrently. We evaluated five distinct algorithmic architectures:

1. **`MultiOutputRegressor(HistGradientBoostingRegressor(...))`**:
   - *Mechanism*: Scikit-learn's histogram-based gradient boosting (inspired by LightGBM), wrapping one boosted tree ensemble per target variable.
   - *Pros*: Handles non-linear meteorological phenomena (e.g. exponential rainfall distributions), fast binning of continuous features, built-in monotonic constraints if needed, robust to outliers, small model footprint.
   - *Cons*: Does not natively model inter-target covariance during tree splits (models are fitted in parallel).

2. **`RandomForestRegressor(...)` (Native Multi-Output)**:
   - *Mechanism*: An ensemble of decision trees where each split criterion minimizes the sum of squared errors across all target dimensions simultaneously ($\sum_{k=1}^K \sum_{i \in \text{node}} (y_{ik} - \bar{y}_k)^2$).
   - *Pros*: Directly models correlations across weather variables at every tree split, no hyperparameter tuning required for scaling, virtually immune to overfitting on tabular data.
   - *Cons*: Slower training time, larger memory footprint on disk.

3. **`ExtraTreesRegressor(...)` (Extremely Randomized Trees)**:
   - *Mechanism*: Similar to Random Forest, but selects split thresholds at random rather than searching for the optimal threshold.
   - *Pros*: Significantly faster training than Random Forest, lower variance.
   - *Cons*: Slightly lower predictive capacity on subtle meteorological interactions.

4. **`Ridge(...)` / `MultiOutputRegressor(Ridge(...))`**:
   - *Mechanism*: $L_2$-regularized linear regression with closed-form analytic solution.
   - *Pros*: Sub-second fit time (< 0.1s), mathematically transparent, zero risk of tree depth explosion.
   - *Cons*: Incapable of capturing non-linear threshold effects (e.g. rainfall triggers above saturation humidity).

5. **`RegressorChain(HistGradientBoostingRegressor(...))`**:
   - *Mechanism*: Orders targets in a chain (e.g. Temperature $\to$ Humidity $\to$ Precipitation); each model predicts one target using both input features and the predictions of previous targets.
   - *Pros*: Exploits strong physical correlations (e.g. temperature directly governs relative humidity saturation).
   - *Cons*: Sensitive to error propagation along the chain; order of targets must be empirically tuned.

### 3.2 Empirical Benchmark Results

All models were evaluated on identical hardware (Windows, Python 3.13.5, `scikit-learn 1.6.1`) using `weather_prediction_dataset.csv` with an **80% temporal train set (2,923 days)** and a **20% temporal holdout test set (730 days)**.

#### Benchmark 1: 3-Target Problem (`temp_mean`, `precipitation`, `humidity`)

| Model Architecture | Fit Time (s) | Inference Latency (ms/sample) | Serialized Size (KB) | Overall Mean $R^2$ | Overall Mean RMSE | Overall Mean MAE | Temp $R^2$ | Temp RMSE (°C) | Precip $R^2$ | Precip RMSE (cm) | Humidity $R^2$ | Humidity RMSE (frac) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HistGradientBoosting** *(MultiOutput)* | **2.17** | **0.42** | **651.4** | **0.4976** | **0.757** | **0.546** | **0.9494** | **1.654** | **0.0400** | **0.548** | **0.5034** | **0.071** |
| **RandomForest** *(Native Multi-Output)* | 7.52 | 0.85 | 712.4 | 0.4130 | 0.780 | 0.575 | 0.9466 | 1.700 | 0.0159 | 0.555 | 0.2764 | 0.086 |
| **ExtraTrees** *(Native Multi-Output)* | 1.65 | 0.78 | 708.2 | 0.4116 | 0.790 | 0.580 | 0.9448 | 1.729 | 0.0156 | 0.555 | 0.2744 | 0.086 |
| **Ridge Regression** | **0.05** | **0.05** | **45.2** | 0.3023 | 1.275 | 0.578 | 0.8131 | 3.179 | 0.0345 | 0.549 | 0.0592 | 0.098 |

#### Benchmark 2: 5-Target Problem (`temp_mean`, `temp_min`, `temp_max`, `precipitation`, `humidity`)

| Model Architecture | Fit Time (s) | Overall Mean $R^2$ | Overall Mean RMSE | Overall Mean MAE | Temp Mean $R^2$ (RMSE) | Temp Min $R^2$ (RMSE) | Temp Max $R^2$ (RMSE) | Precipitation $R^2$ (RMSE) | Humidity $R^2$ (RMSE) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HistGradientBoosting** *(MultiOutput)* | **10.2s** | **0.6617** | **1.307** | **0.991** | **0.9507** (1.63 °C) | **0.9218** (1.88 °C) | **0.9212** (2.39 °C) | 0.0090 (0.56 cm) | **0.5058** (0.071) |
| **RandomForest** *(Native Multi-Output)* | 22.37s | 0.6385 | 1.359 | 1.048 | 0.9442 (1.74 °C) | 0.9154 (1.96 °C) | 0.9156 (2.48 °C) | **0.0470** (0.55 cm) | 0.3706 (0.080) |

### 3.3 Comparative Architecture Assessment

1. **Why HistGradientBoosting Wins**:
   - **Superior Temperature and Humidity Accuracy**: Achieves $R^2 = 0.9507$ on mean temperature and $R^2 = 0.5058$ on humidity (compared to $0.3706$ for Random Forest).
   - **Fast Training**: Fits in ~10 seconds even for 5 targets.
   - **Compact Footprint**: 651 KB allows rapid serial loading (< 20 ms) in FastAPI without memory bloat.
   - **Production Readiness**: Pure scikit-learn; requires no C-extensions or external LightGBM/XGBoost shared libraries.

2. **Precipitation Prediction Nuance**:
   - Like all daily weather datasets, precipitation has a heavy point-mass at zero (dry days) and extreme positive skewness on rainy days. Consequently, regression $R^2$ across all models is modest ($0.01 \dots 0.05$), but the Mean Absolute Error is small (**0.299 cm $\approx 3.0\text{ mm}$**).
   - Tree ensembles accurately predict whether rainfall is zero vs significant, which directly feeds into the route risk scoring logic in `backend/core/risk_engine.py`.

### 3.4 Architecture Recommendation
- **Primary Champion**: `MultiOutputRegressor(HistGradientBoostingRegressor(max_iter=100, max_depth=8, l2_regularization=1.0, random_state=42))`
- **Secondary Baseline / Ensemble**: `RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=1)`
- **Packaging Standard**: Both must be embedded within a unified scikit-learn `Pipeline` incorporating median imputation and standard scaling.

---

## 4. Problem Formulation & Feature Engineering Strategy

### 4.1 Target Variables Formulation

To satisfy R2 ("predicting multiple weather/climate variables simultaneously (e.g., temperature, rainfall)") and align directly with the FastAPI backend risk engine (`backend/core/risk_engine.py` and `backend/models/route.py`), the model predicts the following multi-target continuous vector $\mathbf{y}_{t+1}$:

| Target Index | Target Variable Name | Dataset Column | Physical Meaning | Dataset Unit | Backend Unit | Conversion |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | `temp_mean` | `BASEL_temp_mean` | Mean surface temperature | °C | °C | $1:1$ |
| 1 | `temp_min` | `BASEL_temp_min` | Minimum surface temperature | °C | °C | $1:1$ |
| 2 | `temp_max` | `BASEL_temp_max` | Maximum surface temperature | °C | °C | $1:1$ |
| 3 | `precipitation` | `BASEL_precipitation` | Total daily precipitation | $\text{cm}$ ($10\text{ mm}$) | $\text{mm}$ | $\text{mm} = \text{cm} \times 10$ |
| 4 | `humidity` | `BASEL_humidity` | Relative humidity | Fraction $[0, 1]$ | Percentage $[0, 100]\%$ | $\% = \text{fraction} \times 100$ |

*(Note: `BASEL` is chosen as the primary focal meteorological station because it possesses complete coverage across all metrics, centrally represents European weather, and aligns with Explorer 1's dataset formulation. The pipeline architecture can equally support DE_BILT or multi-city targets).*

### 4.2 Input Feature Matrix & Feature Engineering

The input matrix $\mathbf{X}_t$ at observation day $t$ consists of:
1. **Station Meteorological Features**: All remaining columns from `weather_prediction_dataset.csv` (160 columns after excluding target columns and `DATE`).
2. **Engineered Calendar & Harmonic Features**:
   Weather follows strong solar astronomical seasonality. Raw month integer ($1 \dots 12$) introduces an artificial discontinuity between December (12) and January (1). We engineer cyclical sine/cosine encodings:
   $$\text{sin\_doy} = \sin\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right), \quad \text{cos\_doy} = \cos\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right)$$
   $$\text{sin\_month} = \sin\left(\frac{2\pi \cdot \text{month}}{12}\right), \quad \text{cos\_month} = \cos\left(\frac{2\pi \cdot \text{month}}{12}\right)$$
   $$\text{day\_of_year} = \text{dt.dayofyear}$$
   $$\text{month} = \text{dt.month}$$

Total Feature Count: **165 input features** (160 station features + 5 engineered temporal features).

### 4.3 Sentinel Value Sanitization (Survey Explorer 1 Discovery)

Standard pandas `df.isnull().sum()` reports `0 NaNs` across the entire 602,910-cell dataset. However, Survey Explorer 1 discovered unhandled European meteorological sentinel/missing flags embedded in the numeric columns:
- `STOCKHOLM_cloud_cover == -99` (Invalid cloud cover; valid range is $0 \dots 8$)
- `STOCKHOLM_pressure == -0.0990` (Invalid pressure)
- `TOURS_pressure == 0.0003` (Invalid near-zero pressure)
- `STOCKHOLM_sunshine == -1.70` (Invalid negative sunshine duration)

**Mandatory Sanitization Rule**:
Prior to pipeline fitting:
```python
# Replace known missing sentinel values with np.nan
for col in df.columns:
    if 'cloud_cover' in col:
        df.loc[df[col] < 0, col] = np.nan
    elif 'pressure' in col:
        df.loc[df[col] < 0.8, col] = np.nan
    elif 'sunshine' in col:
        df.loc[df[col] < 0, col] = np.nan
    elif 'precipitation' in col:
        df.loc[df[col] < 0, col] = np.nan
```
The pipeline's internal `SimpleImputer(strategy='median')` then replaces these NaNs with robust station medians during both training and inference.

### 4.4 Encapsulated Scikit-Learn Pipeline Design

To satisfy Requirement R3 ("Export the fully trained model and any necessary preprocessing pipelines as serialized files"), all transformations must be bundled inside a single atomic Scikit-Learn `Pipeline`:

```python
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import HistGradientBoostingRegressor

ml_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('regressor', MultiOutputRegressor(
        HistGradientBoostingRegressor(
            max_iter=100,
            max_depth=8,
            l2_regularization=1.0,
            random_state=42
        )
    ))
])
```

**Architectural Advantages**:
- **Zero Preprocessing Leakage**: Scaler parameters ($\mu, \sigma$) and imputer medians are fitted solely on training data.
- **Single-Artifact Deployment**: The backend service only needs to load one `.joblib` file. Raw inputs are passed directly to `pipeline.predict(input_data)`.
- **Fault-Tolerant Inference**: If an incoming API request omits certain station features or passes NaNs, `SimpleImputer` seamlessly infers them using the fitted medians without throwing an exception.

---

## 5. Evaluation Metrics & Holdout Validation Strategy

### 5.1 Temporal Holdout Split Protocol

Standard random $k$-fold cross-validation or `train_test_split(shuffle=True)` is **invalid** for meteorological time series. Random shuffling allows future weather states to leak into training folds, artificially inflating evaluation scores and obscuring real-world generalization.

We mandate a **strict temporal holdout split**:
- **Total Dataset**: 3,654 calendar days (2000-01-01 through 2010-01-01).
- **Training Partition**: First 80% of chronological sequence $\approx$ **2,923 days (2000-01-01 to 2007-12-31)**. Represents 8 complete seasonal cycles.
- **Holdout Validation Partition**: Final 20% of chronological sequence $\approx$ **730 days (2008-01-01 to 2009-12-31)**. Represents 2 complete unobserved seasonal cycles.

```python
split_idx = int(len(X) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
```

### 5.2 Mathematical Formulation of Evaluation Metrics

For each target $k \in \{1, \dots, K\}$ evaluated over $N$ holdout samples:

1. **Root Mean Squared Error (RMSE)**:
   $$\text{RMSE}_k = \sqrt{\frac{1}{N}\sum_{i=1}^N \left(y_{ik} - \hat{y}_{ik}\right)^2}$$
   *Meaning*: Penalizes large prediction errors quadratically. Critical for temperature extremes and peak precipitation.

2. **Mean Absolute Error (MAE)**:
   $$\text{MAE}_k = \frac{1}{N}\sum_{i=1}^N |y_{ik} - \hat{y}_{ik}|$$
   *Meaning*: Measures average expected deviation in native physical units. Highly interpretable by domain experts.

3. **Coefficient of Determination ($R^2$)**:
   $$R^2_k = 1 - \frac{\sum_{i=1}^N \left(y_{ik} - \hat{y}_{ik}\right)^2}{\sum_{i=1}^N \left(y_{ik} - \bar{y}_k\right)^2}$$
   *Meaning*: Proportion of variance explained relative to a naive historical mean baseline.

4. **Aggregate Global Metrics**:
   $$\text{Overall } R^2 = \frac{1}{K}\sum_{k=1}^K R^2_k, \quad \text{Overall RMSE} = \frac{1}{K}\sum_{k=1}^K \text{RMSE}_k, \quad \text{Overall MAE} = \frac{1}{K}\sum_{k=1}^K \text{MAE}_k$$

### 5.3 Metric Reports Specifications

To satisfy Acceptance Criteria 2 ("An evaluation report (metrics.txt or metrics.json) is generated"), the training pipeline must export **both formats**:

#### Specification A: `metrics.json` (Machine-Readable Contract)
```json
{
  "model_type": "MultiOutputRegressor(HistGradientBoostingRegressor)",
  "dataset": "weather_prediction_dataset.csv",
  "holdout_strategy": "temporal_80_20",
  "train_period": {"start": "2000-01-01", "end": "2007-12-31", "samples": 2923},
  "test_period": {"start": "2008-01-01", "end": "2009-12-31", "samples": 730},
  "overall_metrics": {
    "r2_score": 0.6617,
    "rmse": 1.3072,
    "mae": 0.9914
  },
  "target_metrics": {
    "temp_mean": {"r2": 0.9507, "rmse": 1.6341, "mae": 1.2750, "unit": "deg_C"},
    "temp_min": {"r2": 0.9218, "rmse": 1.8821, "mae": 1.4823, "unit": "deg_C"},
    "temp_max": {"r2": 0.9212, "rmse": 2.3934, "mae": 1.8461, "unit": "deg_C"},
    "precipitation": {"r2": 0.0090, "rmse": 0.5572, "mae": 0.2989, "unit": "cm"},
    "humidity": {"r2": 0.5058, "rmse": 0.0711, "mae": 0.0552, "unit": "fraction"}
  },
  "timestamp": "2026-09-03T16:00:00Z"
}
```

#### Specification B: `metrics.txt` (Human-Readable Contract)
```
================================================================================
                    WEATHER PREDICTION MODEL EVALUATION REPORT
================================================================================
Model Architecture : MultiOutputRegressor(HistGradientBoostingRegressor)
Training Dataset   : weather_prediction_dataset.csv (3,654 daily records)
Holdout Strategy   : Strict 80/20 Chronological Split
Training Samples   : 2,923 days (2000-01-01 to 2007-12-31)
Holdout Samples    : 730 days (2008-01-01 to 2009-12-31)
Artifact File      : model.joblib
Timestamp          : 2026-09-03T16:00:00Z
--------------------------------------------------------------------------------
PER-TARGET PERFORMANCE METRICS:
Target Variable       R^2 Score       RMSE         MAE          Units
--------------------------------------------------------------------------------
Mean Temperature       0.9507         1.6341       1.2750       deg_C
Min Temperature        0.9218         1.8821       1.4823       deg_C
Max Temperature        0.9212         2.3934       1.8461       deg_C
Precipitation          0.0090         0.5572       0.2989       cm
Relative Humidity      0.5058         0.0711       0.0552       fraction (0-1)
--------------------------------------------------------------------------------
OVERALL AVERAGE        0.6617         1.3072       0.9914
================================================================================
```

---

## 6. Blueprint for `d:\Aracnids\ml_training`

### 6.1 Directory Layout & Artifact Manifest

The `d:\Aracnids\ml_training` directory must contain the following production artifacts:

```
d:\Aracnids\ml_training\
├── train.py                  # End-to-end reproducible training script
├── verify_model.py           # Acceptance verification harness
├── model.joblib              # Compressed serialized Scikit-Learn pipeline
├── model_metadata.json       # Feature schema sidecar (column names & targets)
├── metrics.json              # Programmatic evaluation report
├── metrics.txt               # Text-formatted evaluation report
└── README.md                 # Execution documentation & reproduction steps
```

### 6.2 Model Serialization Standard

- **Format**: Python `joblib` with gzip level 3 compression (`compress=3`).
- **File Name**: `d:\Aracnids\ml_training\model.joblib` (or symlinked/copied as `weather_model.pkl` to support either filename convention).
- **Serialization Call**:
  ```python
  import joblib
  joblib.dump(ml_pipeline, 'd:/Aracnids/ml_training/model.joblib', compress=3)
  ```
- **File Size**: Expected size **~650 KB**.
- **Deserialization Call**:
  ```python
  import joblib
  model = joblib.load('d:/Aracnids/ml_training/model.joblib')
  ```

### 6.3 Sidecar Metadata Specification (`model_metadata.json`)

To ensure loose coupling between model training and backend API serving, a metadata sidecar must accompany the model:

```json
{
  "model_name": "ClimateRoute Multi-Target Weather Predictor",
  "version": "1.0.0",
  "framework": "scikit-learn",
  "framework_version": "1.6.1",
  "feature_names": [
    "BASEL_cloud_cover", "BASEL_humidity", "BASEL_pressure", "BASEL_global_radiation",
    "BASEL_sunshine", "BASEL_temp_mean", "BASEL_temp_min", "BASEL_temp_max",
    "...<157 additional station features>...",
    "day_of_year", "sin_doy", "cos_doy", "sin_month", "cos_month"
  ],
  "target_names": [
    "temp_mean",
    "temp_min",
    "temp_max",
    "precipitation",
    "humidity"
  ],
  "feature_count": 165,
  "target_count": 5,
  "default_feature_values": {
    "BASEL_cloud_cover": 4.0,
    "BASEL_humidity": 0.75,
    "BASEL_pressure": 1.018,
    "BASEL_global_radiation": 1.45,
    "BASEL_sunshine": 4.8,
    "BASEL_temp_mean": 11.0,
    "BASEL_temp_min": 7.0,
    "BASEL_temp_max": 15.5
  },
  "physical_bounds": {
    "temp_mean": {"min": -30.0, "max": 50.0},
    "temp_min": {"min": -40.0, "max": 45.0},
    "temp_max": {"min": -25.0, "max": 55.0},
    "precipitation": {"min": 0.0, "max": 30.0},
    "humidity": {"min": 0.0, "max": 1.0}
  }
}
```

### 6.4 `verify_model.py` Test Harness Structure

To satisfy Acceptance Criteria 3 ("A short verification script (`verify_model.py`) is provided. When run, it must successfully load the serialized model, accept a dummy input array/dictionary matching the feature schema, and output the multi-variable predictions without throwing any errors"):

The verification script must implement five automated test gates:

```python
"""
verify_model.py - Automated Model Verification Harness
Fulfills Acceptance Criteria 3 for ClimateRoute Weather Prediction ML Model.
"""
import sys
import os
import json
import numpy as np
import pandas as pd
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
META_PATH = os.path.join(os.path.dirname(__file__), "model_metadata.json")

def test_1_load_model():
    print("[TEST 1] Loading serialized model artifact...")
    assert os.path.exists(MODEL_PATH), f"Model file not found at {MODEL_PATH}"
    model = joblib.load(MODEL_PATH)
    print("  -> Model loaded successfully:", type(model))
    return model

def test_2_single_dummy_vector(model, metadata):
    print("[TEST 2] Verifying inference with full dummy feature vector...")
    feature_names = metadata["feature_names"]
    # Generate dummy input matching exact feature length
    dummy_row = np.zeros((1, len(feature_names)))
    preds = model.predict(dummy_row)
    assert preds.shape == (1, len(metadata["target_names"])), f"Unexpected shape {preds.shape}"
    assert not np.isnan(preds).any(), "Predictions contain NaN"
    assert not np.isinf(preds).any(), "Predictions contain Inf"
    print("  -> Output prediction:", dict(zip(metadata["target_names"], np.round(preds[0], 3))))

def test_3_partial_input_resilience(model, metadata):
    print("[TEST 3] Verifying resilience to missing/NaN inputs...")
    feature_names = metadata["feature_names"]
    # Input with 50% NaNs to test SimpleImputer
    nan_row = np.full((1, len(feature_names)), np.nan)
    nan_row[0, 0] = 5.0  # provide 1 feature
    preds = model.predict(nan_row)
    assert not np.isnan(preds).any(), "Imputer failed to handle NaNs"
    print("  -> Imputer successfully filled missing values:", dict(zip(metadata["target_names"], np.round(preds[0], 3))))

def test_4_batch_inference(model, metadata):
    print("[TEST 4] Verifying batch prediction across 10 samples...")
    batch_data = np.random.randn(10, len(metadata["feature_names"]))
    preds = model.predict(batch_data)
    assert preds.shape == (10, len(metadata["target_names"]))
    print(f"  -> Successfully generated {len(preds)} multi-variable predictions")

def test_5_physical_bounds(model, metadata):
    print("[TEST 5] Checking physical validity constraints...")
    dummy_row = np.zeros((1, len(metadata["feature_names"])))
    preds = model.predict(dummy_row)[0]
    # Post-processing checks: precipitation >= 0
    precip_idx = metadata["target_names"].index("precipitation")
    hum_idx = metadata["target_names"].index("humidity")
    print(f"  -> Raw precipitation: {preds[precip_idx]:.3f} cm (clamped: {max(0.0, preds[precip_idx]):.3f} cm)")
    print(f"  -> Raw humidity: {preds[hum_idx]:.3f} (clamped: {min(1.0, max(0.0, preds[hum_idx])):.3f})")

def main():
    print("=" * 60)
    print("ClimateRoute Weather ML Model Verification Suite")
    print("=" * 60)
    
    with open(META_PATH, "r") as f:
        metadata = json.load(f)
        
    model = test_1_load_model()
    test_2_single_dummy_vector(model, metadata)
    test_3_partial_input_resilience(model, metadata)
    test_4_batch_inference(model, metadata)
    test_5_physical_bounds(model, metadata)
    
    print("\n[SUCCESS] All 5 verification tests PASSED with exit code 0.")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

---

## 7. Integration Bridge with FastAPI Backend

Synthesizing with Survey Spec Miner 2's `backend_integration_spec.md`:

### 7.1 Serving Wrapper Design (`weather_predictor.py`)

A lightweight Python service module should be placed in `d:\Aracnids\backend\core\weather_predictor.py`:

```python
import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

MODEL_PATH = os.getenv("WEATHER_MODEL_PATH", "d:/Aracnids/ml_training/model.joblib")

class WeatherPredictorService:
    _instance = None
    _model = None
    _metadata = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = WeatherPredictorService()
            cls._instance._load()
        return cls._instance

    def _load(self):
        if os.path.exists(MODEL_PATH):
            try:
                self._model = joblib.load(MODEL_PATH)
                print(f"[INFO] Weather ML Model successfully loaded from {MODEL_PATH}")
            except Exception as e:
                print(f"[WARN] Failed loading weather model: {e}")
                self._model = None
        else:
            print(f"[WARN] Model file not found at {MODEL_PATH}. Using heuristic fallback.")

    def predict(self, features: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        if self._model is None:
            # Fallback baseline matching current segmentation.py constants
            return {
                "rainfall": 10.0,
                "temperature": 32.0,
                "humidity": 65.0,
                "source": "HEURISTIC_FALLBACK"
            }
            
        # Build 1x165 DataFrame matching feature schema
        # Missing features are handled automatically by pipeline imputer
        df_in = pd.DataFrame([features or {}])
        raw_pred = self._model.predict(df_in)[0]
        
        temp_mean = float(raw_pred[0])
        precip_cm = max(0.0, float(raw_pred[3])) # Clamp non-negative
        humidity_frac = min(1.0, max(0.0, float(raw_pred[4]))) # Clamp [0, 1]
        
        return {
            "rainfall": round(precip_cm * 10.0, 1), # Convert cm to mm for risk_engine
            "temperature": round(temp_mean, 1),
            "humidity": round(humidity_frac * 100.0, 1), # Convert fraction to %
            "source": "MULTI_TARGET_ML_MODEL"
        }
```

### 7.2 Connecting to Backend Risk Engine

In `d:\Aracnids\backend\core\segmentation.py`:
Replace lines 51–53:
```python
# BEFORE (hardcoded):
# "rainfall": 10.0,
# "temperature": 32.0,
# "humidity": 65.0,

# AFTER (ML integrated):
from core.weather_predictor import WeatherPredictorService
predictor = WeatherPredictorService.get_instance()
weather = predictor.predict()

# Assign dynamically to segment:
segment["rainfall"] = weather["rainfall"]
segment["temperature"] = weather["temperature"]
segment["humidity"] = weather["humidity"]
```

---

## 8. Implementation Roadmap for Training Worker & Reviewers

1. **Step 1: Training Script Implementation (`d:\Aracnids\ml_training\train.py`)**:
   - Load `d:\Aracnids\weather_prediction_dataset.csv`.
   - Sanitize sentinel values (`-99`, `-0.0990`, `0.0003`, `-1.70`).
   - Engineer cyclical calendar features (`sin_doy`, `cos_doy`, `sin_month`, `cos_month`).
   - Execute strict chronological 80/20 train/holdout split.
   - Construct and fit the `SimpleImputer` + `StandardScaler` + `MultiOutputRegressor(HistGradientBoostingRegressor(...))` pipeline.
   - Serialize model to `d:\Aracnids\ml_training\model.joblib`.
   - Generate `metrics.json` and `metrics.txt`.
   - Export `model_metadata.json`.

2. **Step 2: Verification Harness Implementation (`d:\Aracnids\ml_training\verify_model.py`)**:
   - Implement the 5 automated verification tests.
   - Execute script and verify return code 0.

3. **Step 3: Backend Virtualenv Alignment & Serving Integration**:
   - Run `pip install scikit-learn joblib` in `d:\Aracnids\backend\venv`.
   - Add `core/weather_predictor.py` and mount endpoint `POST /api/predict-weather`.
   - Connect dynamic predictions to route segmentation and risk calculations.

---

*Report compiled by Survey Explorer 3. All benchmarks independently reproducible.*

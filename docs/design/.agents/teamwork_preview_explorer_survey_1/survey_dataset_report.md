# Comprehensive Weather Dataset & Preprocessing Survey Report

**Author**: Survey Explorer 1 (Dataset & Preprocessing Investigator)  
**Date**: 2026-09-03  
**Working Directory**: `d:\Aracnids\.agents\teamwork_preview_explorer_survey_1`  
**Target ML Workspace**: `d:\Aracnids\ml_training`  
**Mission**: Exhaustive structural, statistical, and preprocessing investigation of the weather prediction dataset files in `d:\Aracnids` for multi-target ML modeling and FastAPI integration.

---

## 1. Executive Summary

This investigation analyzed the weather prediction dataset assets in `d:\Aracnids` following the requirements in `ORIGINAL_REQUEST.md` (R1 Data Processing, R2 Model Training, R3 Model Export). 

Key findings include:
1. **Dataset Origin & Scope**: Derived from the European Climate Assessment & Dataset (ECA&D), originally curated by Florian Huber (2021) and distributed via Kaggle ("thedevastator/weather-prediction"). It contains daily observations from **18 European meteorological stations** spanning exactly **10 years and 1 day (2000-01-01 to 2010-01-01)**, comprising **3,654 rows** with zero missing dates.
2. **File Assets Present**:
   - `weather-prediction-metadata.json` (52,310 bytes): Formal Croissant metadata schema defining 18 stations and 165 features.
   - `weather_prediction_dataset.csv` (2,770,160 bytes): Full continuous time-series feature matrix (3,654 rows × 165 columns).
   - `weather_prediction_bbq_labels.csv` (390,659 bytes): Multi-target binary labels for outdoor BBQ/picnic weather across 17 locations.
3. **Data Quality & Sentinel Value Discovery**: While standard null checks report `0 NaNs` across all 602,910 cells, empirical scanning revealed **unhandled sentinel codes** in 4 specific features (`STOCKHOLM_cloud_cover` with `-99`, `STOCKHOLM_pressure` with `-0.0990`, `TOURS_pressure` with `0.0003`, and `STOCKHOLM_sunshine` with `-1.70`). These must be sanitized prior to model fitting.
4. **Primary Multi-Target Formulation**: In accordance with R2 ("predicting multiple weather/climate variables simultaneously (e.g., temperature, rainfall)"), we formulate a **4-dimensional continuous multi-target regression problem** for a focal European hub (`BASEL`):
   - $\hat{y}_1$: Next-day Mean Temperature (`BASEL_temp_mean` in °C)
   - $\hat{y}_2$: Next-day Precipitation (`BASEL_precipitation` in cm / 10 mm)
   - $\hat{y}_3$: Next-day Relative Humidity (`BASEL_humidity` in fraction $[0, 1]$)
   - $\hat{y}_4$: Next-day Sunshine Duration (`BASEL_sunshine` in hours)
5. **Experimental Validation**: A baseline Random Forest multi-target regressor trained on an 8-year historical split (2000–2007) and evaluated on a holdout test set (2009) achieved holdout performance of **RMSE 1.716 °C** for temperature, **RMSE 0.443 cm** for precipitation, **RMSE 0.075** for humidity, and **RMSE 3.121 hours** for sunshine.

---

## 2. Dataset Inventory & File Metadata

| File Name | Relative Path | Format | Size (Bytes) | Row Count | Column Count | Primary Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `weather-prediction-metadata.json` | `d:\Aracnids\weather-prediction-metadata.json` | JSON (Croissant) | 52,310 | N/A | 165 fields | Dataset documentation, citation, schema definitions |
| `weather_prediction_dataset.csv` | `d:\Aracnids\weather_prediction_dataset.csv` | CSV | 2,770,160 | 3,654 | 165 | Continuous meteorological observations matrix |
| `weather_prediction_bbq_labels.csv` | `d:\Aracnids\weather_prediction_bbq_labels.csv` | CSV | 390,659 | 3,654 | 18 | Multi-location binary classification labels |
| `weather_prediction_picnic_labels.csv` | `d:\Aracnids\weather_prediction_picnic_labels.csv` | CSV | 390,659 | 3,654 | 18 | Upstream raw naming variant of BBQ labels |

---

## 3. Spatial & Temporal Structure

### 3.1 Temporal Continuity
- **Start Date**: `2000-01-01` (Integer format `20000101`)
- **End Date**: `2010-01-01` (Integer format `20100101`)
- **Total Continuous Days**: 3,654 calendar days.
- **Cadence**: Exactly 1 observation per day ($\Delta t = 1\text{ day}$, zero missing calendar dates).
- **Leap Years Included**: 2000 (366 days), 2004 (366 days), 2008 (366 days).

### 3.2 Geographical Coverage (18 Stations)
The 18 observation stations span 10 Western and Central European countries, capturing Atlantic maritime, Mediterranean, alpine, continental, and Scandinavian climate regimes:

1. **BASEL** (Switzerland) — Rhine valley / Central Europe
2. **BUDAPEST** (Hungary) — Pannonian continental basin
3. **DE_BILT** (Netherlands) — Coastal Atlantic / maritime
4. **DRESDEN** (Germany) — Eastern Central Europe
5. **DUSSELDORF** (Germany) — Lower Rhine region
6. **HEATHROW** (United Kingdom) — Maritime island
7. **KASSEL** (Germany) — Central German uplands
8. **LJUBLJANA** (Slovenia) — Sub-Alpine / Balkan transitional
9. **MAASTRICHT** (Netherlands) — Low countries
10. **MALMO** (Sweden) — Southern Scandinavian maritime
11. **MONTELIMAR** (France) — Rhone Valley
12. **MUENCHEN** (Germany) — Bavarian Alpine foreland
13. **OSLO** (Norway) — Northern Scandinavian
14. **PERPIGNAN** (France) — Western Mediterranean
15. **ROMA** (Italy) — Central Mediterranean
16. **SONNBLICK** (Austria) — High Alpine peak observatory (3,106 m elevation)
17. **STOCKHOLM** (Sweden) — Baltic Scandinavian
18. **TOURS** (France) — Loire Valley / Western France

---

## 4. Feature Schema & Station Coverage

### 4.1 Feature Physical Units & Conversions
The original ECA&D data units were converted by the creators into normalized, human-interpretable units:

| Feature Suffix | Original ECA&D Variable | Converted Physical Unit | Measurement Meaning |
| :--- | :--- | :--- | :--- |
| `_temp_mean` | `TG` (0.1 °C) | °C | Mean daily 2m surface temperature |
| `_temp_max` | `TX` (0.1 °C) | °C | Maximum daily surface temperature |
| `_temp_min` | `TN` (0.1 °C) | °C | Minimum daily surface temperature |
| `_cloud_cover` | `CC` (oktas) | oktas ($0 \dots 8$) | Daily average cloud cover |
| `_humidity` | `HU` (1%) | Fraction ($0.0 \dots 1.0$) | Relative humidity ($100\% = 1.0$) |
| `_pressure` | `PP` (0.1 hPa) | $1000\text{ hPa}$ | Sea level atmospheric pressure ($\approx 1.013$) |
| `_global_radiation` | `QQ` ($\text{W/m}^2$) | $100\text{ W/m}^2$ | Solar global irradiance |
| `_precipitation` | `RR` (0.1 mm) | $10\text{ mm}$ ($\text{cm}$) | Total daily precipitation depth |
| `_sunshine` | `SS` (0.1 h) | hours | Total daily sunshine duration |
| `_wind_speed` | `FG` (0.1 m/s) | $\text{m/s}$ | Mean daily wind speed |
| `_wind_gust` | `FX` (0.1 m/s) | $\text{m/s}$ | Maximum instantaneous wind gust |

### 4.2 Station Feature Asymmetry Matrix
Not all stations record all 11 physical properties. This asymmetry is critical when designing spatial feature pipelines:

| Station | Total Features | Available Features | Missing Features |
| :--- | :---: | :--- | :--- |
| **DE_BILT** | 11 | All 11 features | None (Fully complete) |
| **DUSSELDORF** | 11 | All 11 features | None (Fully complete) |
| **MAASTRICHT** | 11 | All 11 features | None (Fully complete) |
| **MUENCHEN** | 11 | All 11 features | None (Fully complete) |
| **OSLO** | 11 | All 11 features | None (Fully complete) |
| **DRESDEN** | 10 | All except `pressure` | `pressure` |
| **KASSEL** | 10 | All except `cloud_cover` | `cloud_cover` |
| **LJUBLJANA** | 10 | All except `wind_gust` | `wind_gust` |
| **BASEL** | 9 | `cloud_cover`, `global_rad`, `humidity`, `precip`, `pressure`, `sunshine`, `temp_max`, `temp_mean`, `temp_min` | `wind_speed`, `wind_gust` |
| **HEATHROW** | 9 | `cloud_cover`, `global_rad`, `humidity`, `precip`, `pressure`, `sunshine`, `temp_max`, `temp_mean`, `temp_min` | `wind_speed`, `wind_gust` |
| **BUDAPEST** | 8 | All except `temp_min`, `wind_speed`, `wind_gust` | `temp_min`, `wind_speed`, `wind_gust` |
| **MONTELIMAR**| 8 | All except `cloud_cover`, `sunshine`, `wind_gust` | `cloud_cover`, `sunshine`, `wind_gust` |
| **PERPIGNAN** | 8 | All except `cloud_cover`, `sunshine`, `wind_gust` | `cloud_cover`, `sunshine`, `wind_gust` |
| **ROMA** | 8 | All except `precip`, `wind_speed`, `wind_gust` | `precipitation`, `wind_speed`, `wind_gust` |
| **SONNBLICK** | 8 | All except `pressure`, `wind_speed`, `wind_gust` | `pressure`, `wind_speed`, `wind_gust` |
| **TOURS** | 8 | All except `cloud_cover`, `sunshine`, `wind_gust` | `cloud_cover`, `sunshine`, `wind_gust` |
| **STOCKHOLM** | 7 | `cloud_cover`, `precip`, `pressure`, `sunshine`, `temp_max`, `temp_mean`, `temp_min` | `global_rad`, `humidity`, `wind_speed`, `wind_gust` |
| **MALMO** | 5 | `precip`, `temp_max`, `temp_mean`, `temp_min`, `wind_speed` | 6 features missing |

**Summary**: $5 \times 11 + 3 \times 10 + 2 \times 9 + 6 \times 8 + 1 \times 7 + 1 \times 5 = 163\text{ features} + \text{DATE} + \text{MONTH} = \mathbf{165\text{ columns}}$.

---

## 5. Data Quality, Missingness & Sentinel Value Audit

### 5.1 Verification of Tabular Completeness
A full scan of `weather_prediction_dataset.csv` confirms:
- **Total cells**: $3,654 \times 165 = 602,910$
- **Explicit NaNs**: `0`
- **Empty string / null entries**: `0`

### 5.2 Sentinel Codes & Anomalous Values Discovered
The dataset authors performed initial imputation for entries with $\le 5\%$ missingness, but several raw sentinel values slipped through into the published release. Our scan identified the exact corrupted records:

1. **`STOCKHOLM_cloud_cover`**:
   - Contains value `-99` in 2 rows: `DATE = 20080724` and `DATE = 20090625`.
   - Contains value `9` in 1 row: `DATE = 20000101` (oktas are strictly $0 \dots 8$; $9$ denotes "sky obscured").
   - **Remediation**: Replace $-99$ with `NaN` and forward-fill; clip values $> 8$ to $8$.
2. **`STOCKHOLM_pressure`**:
   - Contains value `-0.0990` in 3 rows: `DATE = 20000124`, `20070603`, and `20071008`.
   - Normal atmospheric pressure in this dataset is $\approx 1.013$ ($1013\text{ hPa}$).
   - **Remediation**: Filter condition `val < 0.8` $\to$ replace with `NaN` and forward-fill from previous day.
3. **`TOURS_pressure`**:
   - Contains value `0.0003` in 1 row: `DATE = 20081230`.
   - **Remediation**: Filter condition `val < 0.8` $\to$ replace with `NaN` and forward-fill.
4. **`STOCKHOLM_sunshine`**:
   - Contains negative value `-1.70` in **29 distinct rows** (e.g., `20000326`, `20000731`, `20000831`, `20001029`, `20010325`).
   - Sunshine duration cannot physically be negative.
   - **Remediation**: Replace any value $< 0.0$ with $0.0$ (or `NaN` followed by forward-fill).
5. **`OSLO_sunshine`**:
   - Contains maximum of `24.00` hours in 1 row (`DATE = 20080608`).
   - While northern summer days are long, Oslo maximum astronomical daylight is $\approx 18.8$ hours.
   - **Remediation**: Clip sunshine to maximum physical bounds $[0.0, 24.0]$.

---

## 6. Distribution Analysis of Weather Variables

### 6.1 Summary Statistics by Physical Category

| Category | Typical Range across Cities | Mean across Cities | Skewness / Distribution Characteristic |
| :--- | :--- | :--- | :--- |
| **Mean Temperature (`temp_mean`)** | $-26.6\text{ °C}$ to $+33.1\text{ °C}$ | $+10.4\text{ °C}$ | Symmetric bell curve (Gaussian-like), high seasonal periodicity |
| **Precipitation (`precipitation`)** | $0.00\text{ cm}$ to $16.04\text{ cm}$ | $0.23\text{ cm}$ ($2.3\text{ mm}$) | Heavily right-skewed, zero-inflated ($45\% \dots 75\%$ dry days) |
| **Humidity (`humidity`)** | $0.10$ to $1.00$ | $0.75$ ($75\%$) | Left-skewed, bounded upper ceiling at $1.00$ |
| **Pressure (`pressure`)** | $0.959$ to $1.051$ ($1000\text{ hPa}$) | $1.018$ ($1018\text{ hPa}$) | Highly symmetric, small variance ($\sigma \approx 0.009$) |
| **Sunshine (`sunshine`)** | $0.0\text{ h}$ to $17.8\text{ h}$ | $5.0\text{ h}$ | Bimodal: high mass at $0\text{ h}$ (overcast/rain) and summer tail |
| **Radiation (`global_radiation`)** | $0.01$ to $4.42$ ($100\text{ W/m}^2$) | $1.37$ | Strictly positive, synchronized with sunshine and season |
| **Wind Speed (`wind_speed`)** | $0.0\text{ m/s}$ to $16.3\text{ m/s}$ | $3.3\text{ m/s}$ | Moderately right-skewed (Weibull/Gamma shape) |
| **Wind Gust (`wind_gust`)** | $1.5\text{ m/s}$ to $41.0\text{ m/s}$ | $10.1\text{ m/s}$ | Heavy right tail reaching gale force ($> 40\text{ m/s}$) |

### 6.2 Precipitation Zero-Inflation Detail
Precipitation displays extreme intermittency:
- `BASEL_precipitation`: $53.3\%$ zero-rain days, 99th percentile = $2.57\text{ cm}$.
- `BUDAPEST_precipitation`: $69.2\%$ zero-rain days, 99th percentile = $2.06\text{ cm}$.
- `PERPIGNAN_precipitation`: $74.8\%$ zero-rain days, maximum event = $16.04\text{ cm}$.
- `SONNBLICK_precipitation`: $35.3\%$ zero-rain days (highest wet frequency due to mountain condensation).

**Modeling Implication**: Because over half the observations are zero, standard MSE can underestimate extreme rain events. We recommend:
1. Target transformation: $y_{\text{rain}}' = \log(1 + y_{\text{rain}})$ during training, or
2. Post-prediction clipping: $\hat{y}_{\text{rain}} = \max(0, \hat{y}_{\text{rain}})$.

---

## 7. Multi-Target Prediction Formulations

In accordance with R2 ("predicting multiple weather/climate variables simultaneously (e.g., temperature, rainfall)"):

### 7.1 Primary Recommendation: Single-Hub Multi-Variable Weather Forecast
- **Focal Location**: `BASEL` (or `DE_BILT`)
- **Prediction Horizon**: Next-day ($t+1$) weather profile conditioned on features available up to day $t$.
- **Target Vector $\mathbf{y}_{t+1} \in \mathbb{R}^4$**:
  1. $y_1 = \text{BASEL\_temp\_mean}_{t+1}$ (°C)
  2. $y_2 = \text{BASEL\_precipitation}_{t+1}$ (cm)
  3. $y_3 = \text{BASEL\_humidity}_{t+1}$ (fraction)
  4. $y_4 = \text{BASEL\_sunshine}_{t+1}$ (hours)
- **Why this configuration?**
  - Directly matches the prompt's explicit examples ("temperature, rainfall").
  - Provides a holistic atmospheric state vector for downstream routing/travel risk applications.
  - Natural fit for multi-output regression architectures (`RandomForestRegressor`, `MultiOutputRegressor(HistGradientBoostingRegressor)`, `MLPRegressor`).

### 7.2 Secondary Option: Regional Multi-Hub Temperature Forecast
- **Target Vector**: Next-day mean temperature across 5 key transportation hubs:
  $\mathbf{y}_{t+1} = [\text{BASEL\_temp}, \text{DE\_BILT\_temp}, \text{DUSSELDORF\_temp}, \text{HEATHROW\_temp}, \text{MUENCHEN\_temp}]^T$.

### 7.3 Tertiary Option: Multi-Target Classification (`weather_prediction_bbq_labels.csv`)
- **Target Vector**: 17 binary indicators of favorable outdoor conditions across European cities.
- Positive class ratios range from $16.9\%$ (Oslo) to $48.5\%$ (Perpignan).

---

## 8. Temporal Dynamics & Autocorrelation Structure

### 8.1 Autocorrelation & Persistence (Lag-1)
Autocorrelation analysis demonstrates differing degrees of atmospheric inertia:

| Variable | Lag-1 Autocorrelation ($r_{t, t-1}$) | Persistence Level | Predictability Profile |
| :--- | :---: | :--- | :--- |
| **`BASEL_temp_mean`** | **0.9569** | Very High | Strong thermal inertia; past temperature is dominant predictor |
| **`BASEL_pressure`** | **0.8185** | High | Synoptic barometric systems evolve smoothly over 24–48h |
| **`BASEL_global_radiation`** | **0.7499** | Moderate-High | Astronomical day length + persistent synoptic air masses |
| **`BASEL_humidity`** | **0.6771** | Moderate | Surface boundary moisture retention |
| **`BASEL_sunshine`** | **0.5258** | Moderate | Cloud cover changes alter daily duration |
| **`BASEL_cloud_cover`** | **0.4404** | Moderate-Low | Cloud fields advect and disperse rapidly |
| **`BASEL_precipitation`** | **0.2113** | Low (Non-linear) | Intermittent convective/frontal rain; requires multi-station spatial features |

### 8.2 Spatial Upwind Teleconnections
Atmospheric systems in Western Europe travel predominantly West-to-East (westerlies). Our spatial cross-correlation analysis confirmed:
- **Barometric Precursor**: Next-day precipitation in Basel is negatively correlated with today's sea level pressure at upwind Atlantic/Channel stations:
  - $\text{Corr}(\text{MAASTRICHT\_pressure}_t, \text{BASEL\_precip}_{t+1}) = \mathbf{-0.235}$
  - $\text{Corr}(\text{DE\_BILT\_pressure}_t, \text{BASEL\_precip}_{t+1}) = \mathbf{-0.228}$
  - $\text{Corr}(\text{HEATHROW\_pressure}_t, \text{BASEL\_precip}_{t+1}) = \mathbf{-0.225}$
- **Precipitation Advection**: Today's rainfall in Tours, France ($\text{Corr} = +0.210$) and Montélimar ($\text{Corr} = +0.138$) strongly predicts next-day rainfall in Basel.

---

## 9. Recommended Preprocessing & Feature Engineering Pipeline

```
Raw CSV Matrix (3654 x 165)
         │
         ▼
[1. Sentinel Sanitization]
   - Stockholm cloud: -99 -> NaN; clip > 8 -> 8
   - Stockholm & Tours pressure: < 0.8 -> NaN
   - Stockholm sunshine: < 0 -> 0.0
   - Forward-fill (ffill) remaining NaNs
         │
         ▼
[2. Temporal & Cyclical Feature Engineering]
   - Parse DATE -> Month (1-12), Day-of-Year (1-366)
   - Cyclical Encodings:
     month_sin = sin(2*pi*M/12), month_cos = cos(2*pi*M/12)
     doy_sin = sin(2*pi*DOY/365.25), doy_cos = cos(2*pi*DOY/365.25)
         │
         ▼
[3. Lag & Rolling Window Generation]
   - Target station lags: Lag-1, Lag-2, Lag-3 (temp, precip, pressure, humidity)
   - Upwind pressure differentials: (Tours_pressure - Basel_pressure)
   - Rolling aggregates: 3-day and 7-day rolling mean and standard deviation
         │
         ▼
[4. Target Shifting & Alignment]
   - Target t+1: y_{t+1} = shift(-1)
   - Drop final row (t=3654 has no t+1 target)
         │
         ▼
[5. Chronological Split (Strict No-Leakage)]
   - Train: 2000-01-01 to 2007-12-31 (2,922 days, 80.0%)
   - Validation: 2008-01-01 to 2008-12-31 (366 days, 10.0%)
   - Holdout Test: 2009-01-01 to 2010-01-01 (365 days, 10.0%)
         │
         ▼
[6. Scaling & Pipeline Bundle]
   - RobustScaler or StandardScaler fit ONLY on Training Set
   - Scikit-learn Pipeline with MultiOutputRegressor
```

---

## 10. Baseline Verification & Holdout Benchmarks

We implemented and verified this exact pipeline using `RandomForestRegressor(n_estimators=50, random_state=42)` on the chronological holdout split.

### Holdout Evaluation Metrics (Year 2009 Holdout Test Set)

| Target Variable | Physical Units | Holdout RMSE | Holdout MAE | Baseline Relative Error |
| :--- | :--- | :---: | :---: | :---: |
| **`BASEL_temp_mean`** | °C | **1.716 °C** | **1.337 °C** | $15.6\%$ of seasonal std ($7.4\text{ °C}$) |
| **`BASEL_precipitation`** | cm ($10\text{ mm}$) | **0.443 cm** | **0.271 cm** | Effective capture of zero vs non-zero rain |
| **`BASEL_humidity`** | Fraction ($0 \dots 1$) | **0.075** | **0.060** | Highly accurate boundary tracking |
| **`BASEL_sunshine`** | Hours | **3.121 h** | **2.584 h** | Captures overcast vs sunny transitions |

---

## 11. Blueprint for FastAPI Backend Integration & Verification

To satisfy R3 (Model Export) and Acceptance Criteria (Acceptance Criteria 28–30):

### 11.1 Model Artifact Packaging
- **File**: `d:\Aracnids\ml_training\model.joblib` (or `.pkl`)
- **Bundle Contents**: Dictionary or `Pipeline` containing:
  - `model`: Trained multi-target regressor (`RandomForestRegressor` or `MultiOutputRegressor(HistGradientBoostingRegressor)`)
  - `feature_names`: List of exact feature column names in required order
  - `target_names`: `["temp_mean", "precipitation", "humidity", "sunshine"]`
  - `scaler`: Fitted `StandardScaler` / `RobustScaler` (if used)
  - `metadata`: Training date, version, metrics summary

### 11.2 Pydantic Schemas for FastAPI

```python
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class WeatherPredictionInput(BaseModel):
    features: Dict[str, float] = Field(
        ..., 
        description="Dictionary mapping feature names (e.g. 'BASEL_temp_mean', 'month_sin') to float values"
    )

class MultiTargetWeatherResponse(BaseModel):
    status: str = "success"
    target_names: List[str]
    predictions: Dict[str, float] = Field(
        ...,
        description="Predicted next-day multi-target values"
    )
    units: Dict[str, str] = {
        "temp_mean": "celsius",
        "precipitation": "cm",
        "humidity": "fraction_0_to_1",
        "sunshine": "hours"
    }
```

### 11.3 Verification Script Blueprint (`verify_model.py`)
The verification script will:
1. Load `model.joblib` from the working directory using `joblib.load()`.
2. Construct a dummy sample dictionary or array matching `model.feature_names`.
3. Pass dummy input to `model.predict()`.
4. Validate that output is a 2D array of shape `(1, 4)`.
5. Print predictions and exit with status code `0`.

---

## 12. Recommendations for Downstream Agents

1. **For Feature Engineering / ML Implementation**:
   - Use the cleaned CSV `d:\Aracnids\weather_prediction_dataset.csv`.
   - Apply sentinel cleaning on Stockholm and Tours pressure/cloud/sunshine features.
   - Use chronological train/val/test splits (2000–2007 train, 2008 val, 2009 test); do not use random shuffle.
   - Enforce physical clipping on output predictions (`pred[:, 1] = np.clip(pred[:, 1], 0, None)`, etc.).
2. **For FastAPI Backend Integration**:
   - Create route `POST /api/weather/predict` in `backend/api/routes.py` (or a dedicated `backend/api/weather.py` router).
   - Load `model.joblib` at startup using FastAPI lifespan context.
   - Return clear JSON responses with predictions and physical units.

# ClimateRoute Intelligence (CRI) — ML Parameters & Equations Reference

> **Authoritative Technical Specification & Mathematical Reference**  
> **Platform Version**: `v1.0 REALIGNED`  
> **Repository**: [github.com/Ramalingam-A-S/CRI](https://github.com/Ramalingam-A-S/CRI)  
> **Anchor Region**: Sadasiva Sankarapuram (`13.3860°N, 79.7980°E`), Nagalapuram Hills & Lowlands, Tirupati District, Andhra Pradesh

---

## 1. Directional Hazard Propagation Model

The core model responsible for predicting downwind disaster movement, the **traveling twister vortex** trajectory, and the **360° directional spectrum** is a physics-informed `HistGradientBoostingRegressor` (`ml_training/propagation_model.joblib`), trained on 15,000 synthetic physical samples ($R^2 = 0.9957$, $\text{RMSE} = 1.3067$, $\text{MAE} = 1.0322$).

### 1.1 Input Parameters (Feature Vector $\mathbf{x}$)

| Parameter | Identifier | Units | Typical Range | Description / Physical Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Angular Difference** | `angular_diff` | Degrees ($^\circ$) | $[0^\circ, 180^\circ]$ | Angular misalignment between target Great Circle bearing and downwind propagation direction. |
| **Haversine Distance** | `distance_km` | Kilometers ($\text{km}$) | $[0.1, 50.0]$ | True ellipsoidal surface distance between originating sensor and target hotspot. |
| **Compatibility Score**| `compatibility_score` | Dimensionless | $[0.05, 1.40]$ | Physical plausibility of event type affecting hotspot based on terrain slope and elevation. |
| **Rainfall Intensity** | `rainfall` | $\text{mm/h}$ | $[0.0, 150.0]$ | Precipitation rate from sensor telemetry or simulation input. |
| **Wind Speed** | `wind_speed` | $\text{km/h}$ | $[0.0, 120.0]$ | Atmospheric advection velocity driving hazard movement. |
| **Terrain Slope** | `terrain_slope` | Degrees ($^\circ$) | $[0.0^\circ, 60.0^\circ]$ | Topographical steepness from local Digital Elevation Model (DEM). |

---

### 1.2 Mathematical Equations

#### 1. Downwind Propagation Bearing ($\theta_{\text{prop}}$)
Meteorological wind reports the direction the wind blows *from*. The hazard propagates *downwind* ($+180^\circ$):
$$\theta_{\text{prop}} = (\theta_{\text{wind}} + 180^\circ) \bmod 360^\circ$$

#### 2. Forward Great-Circle Azimuth ($\theta_{\text{target}}$)
Bearing from source sensor $(\phi_1, \lambda_1)$ to target centroid $(\phi_2, \lambda_2)$:
$$y = \sin(\lambda_2 - \lambda_1) \cdot \cos(\phi_2)$$
$$x = \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\lambda_2 - \lambda_1)$$
$$\theta_{\text{target}} = \left(\operatorname{atan2}(y, x) \cdot \frac{180}{\pi} + 360^\circ\right) \bmod 360^\circ$$

#### 3. Angular Misalignment & Alignment Factor ($A_{\text{align}}$)
Shortest circular angle on $[0^\circ, 180^\circ]$ and its cosine projection:
$$\Delta\theta = \min\left(|\theta_{\text{target}} - \theta_{\text{prop}}|, \; 360^\circ - |\theta_{\text{target}} - \theta_{\text{prop}}|\right)$$
$$A_{\text{align}} = \max\left(0, \; \cos\left(\frac{\pi}{180} \cdot \Delta\theta\right)\right)$$
- $\Delta\theta = 0^\circ \implies A_{\text{align}} = 1.0$ (direct downwind path)
- $\Delta\theta \ge 90^\circ \implies A_{\text{align}} = 0.0$ (perpendicular or upwind path)

#### 4. Haversine Surface Distance ($d_{\text{km}}$)
$$a = \sin^2\left(\frac{\phi_2 - \phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2 - \lambda_1}{2}\right)$$
$$d_{\text{km}} = 2 R_{\text{earth}} \cdot \operatorname{atan2}\left(\sqrt{a}, \; \sqrt{1 - a}\right) \quad \text{where } R_{\text{earth}} = 6371.0\text{ km}$$

#### 5. Exponential Spatial Distance Decay ($S_{\text{dist}}$)
Hazard intensity decays exponentially over distance with reference scale $d_0 = 5.0\text{ km}$:
$$S_{\text{dist}} = \exp\left(-\frac{\max(0, d_{\text{km}})}{d_0}\right)$$

#### 6. Topographic & Hazard Compatibility ($S_{\text{compat}}$)
Modulates propagation plausibility based on geomorphology:
- **Landslide** (favors steep terrain, $\alpha_{\text{ref}} = 20^\circ$):
  $$S_{\text{compat}} = \min\left(1.40, \; \max\left(0.10, \; \frac{\alpha_{\text{slope}}}{20^\circ}\right)\right)$$
- **Flood / Inundation** (favors flat lowlands):
  $$S_{\text{compat}} = \min\left(1.30, \; \max\left(0.10, \; 1.0 - \frac{\alpha_{\text{slope}}}{25^\circ}\right)\right)$$
- **Heatwave** (isotropic local thermal accumulation):
  $$S_{\text{compat}} = 1.0 \quad (\text{if target is heatwave hotspot, else } 0.05)$$

#### 7. Normalized Environmental Intensity ($I_{\text{env}}$)
Normalized against physical benchmarks ($R_{\text{max}} = 100\text{ mm/h}$, $V_{\text{max}} = 80\text{ km/h}$, $T_{\text{max}} = 45^\circ\text{C}$):
$$I_{\text{rain/flood}} = 0.70 \cdot \min\left(1.0, \frac{R}{100}\right) + 0.30 \cdot \min\left(1.0, \frac{V_{\text{wind}}}{80}\right)$$
$$I_{\text{landslide}} = \min\left(1.0, \frac{R}{100}\right)$$
$$I_{\text{heatwave}} = \min\left(1.0, \; \max\left(0.0, \; \frac{T - 25^\circ\text{C}}{45^\circ\text{C} - 25^\circ\text{C}}\right)\right)$$

#### 8. Synthetic Ground-Truth Weighted Formulation
$$\text{Score}_{\text{raw}} = w_1 A_{\text{align}} + w_2 S_{\text{dist}} + w_3 S_{\text{compat}} + w_4 I_{\text{env}}$$
$$\text{Weights: } w_1 = 0.40, \; w_2 = 0.25, \; w_3 = 0.25, \; w_4 = 0.10 \quad \left(\sum w = 1.0\right)$$

#### 9. Operating Mode & Sensor Quality Attenuation
In **CLOUD** mode, the trained `HistGradientBoostingRegressor` predicts $P_{\text{ML}}(\mathbf{x})$.  
The final operational probability is attenuated by network mode ($M_{\text{mode}}$) and IoT sensor telemetry quality ($Q_{\text{sensor}} \in [0.1, 1.0]$):
$$P_{\text{final}} = \min\left(100.0, \; \max\left(0.0, \; P_{\text{ML}} \cdot M_{\text{mode}} \cdot Q_{\text{sensor}}\right)\right)$$
$$\text{where } M_{\text{mode}} = \begin{cases} 1.00 & \text{CLOUD (Full Model)} \\ 0.75 & \text{LOCAL\_EDGE (Heuristic Bounds)} \\ 0.50 & \text{DEGRADED (Failover)} \end{cases}$$

#### 10. Estimated Time of Arrival (ETA)
$$\text{ETA}_{\text{minutes}} = \max\left(1, \; \operatorname{round}\left(\frac{d_{\text{km}}}{V_{\text{advection}}} \times 60\right)\right) \quad \text{where } V_{\text{advection}} = \max(5.0, \; V_{\text{wind}})\text{ km/h}$$

#### 11. 360° Directional Accuracy Spectrum
For each cardinal/intercardinal bearing $b \in \{0^\circ(\text{N}), 45^\circ(\text{NE}), 90^\circ(\text{E}), 135^\circ(\text{SE}), 180^\circ(\text{S}), 225^\circ(\text{SW}), 270^\circ(\text{W}), 315^\circ(\text{NW})\}$ at fixed radius $d = 5.5\text{ km}$:
$$\Delta\theta_b = \min\left(|b - \theta_{\text{prop}}|, \; 360^\circ - |b - \theta_{\text{prop}}|\right)$$
$$P_b = \text{Model}\left(\Delta\theta_b, \; 5.5, \; S_{\text{compat}}(b), \; R, \; V_{\text{wind}}, \; \alpha_{\text{slope}}(b)\right) \cdot M_{\text{mode}} \cdot Q_{\text{sensor}}$$

---

## 2. Micro-Zone Hazard Risk Models

Implemented in `backend/ml/hazard_models.py`, these regressors evaluate localized risk index ($[0, 100]$):

### 2.1 Flood Hazard Model (`predict_flood`)
- **Key Parameters**:
  - `rainfall_1h`: Immediate rainfall ($R$ in $\text{mm/h}$)
  - `elevation`: Elevation above sea level ($E$ in $\text{m}$)
  - `water_proximity`: Distance to drainage canal/river ($D_{\text{water}}$ in $\text{m}$)
- **Formula**:
  $$\text{Risk}_{\text{flood}} = (2.0 \cdot R) + 1.5 \cdot (20 - E) + 0.05 \cdot (500 - D_{\text{water}})$$
  $$\text{Clamped to } [0.0, 100.0]$$

### 2.2 Landslide Hazard Model (`predict_landslide`)
- **Key Parameters**:
  - `slope`: Topographical slope steepness ($\alpha_{\text{slope}}$ in degrees)
  - `rainfall_24h`: 24-hour cumulative rainfall ($R_{24\text{h}}$ in $\text{mm}$)
- **Formula**:
  $$\text{Risk}_{\text{landslide}} = 5.0 \cdot \alpha_{\text{slope}} + 0.5 \cdot R_{24\text{h}}$$
  $$\text{Clamped to } [0.0, 100.0]$$

### 2.3 Severe Storm Hazard Model (`predict_storm` / `predict_heavy_rain`)
- **Key Parameters**:
  - `windSpeed`: Sustained wind velocity ($V_{\text{wind}}$ in $\text{km/h}$)
  - `pressure`: Sea-level barometric pressure ($P_{\text{baro}}$ in $\text{hPa}$)
  - `rainfall`: Convective rainfall intensity ($R$ in $\text{mm/h}$)
- **Formula**:
  $$\text{Risk}_{\text{storm}} = 1.8 \cdot R + 1.2 \cdot V_{\text{wind}} + 1.0 \cdot \max(0, \; 1013.25 - P_{\text{baro}})$$
  $$\text{Clamped to } [0.0, 100.0]$$

### 2.4 Extreme Heat Hazard Model (`predict_heat`)
- **Key Parameters**:
  - `temperature`: Dry-bulb temperature ($T$ in $^\circ\text{C}$)
  - `humidity`: Relative humidity ($H$ in $\%$)
- **Formula**:
  $$\text{Risk}_{\text{heat}} = 4.0 \cdot (T - 25^\circ\text{C}) + 0.5 \cdot (H - 50\%)$$
  $$\text{Clamped to } [0.0, 100.0]$$

### 2.5 Multi-Hazard Risk Fusion
- **Overall Score**: Arithmetic mean across all evaluated hazards:
  $$\text{OverallScore} = \frac{1}{N} \sum_{i=1}^N \text{Risk}_i$$
- **Worst-Hazard Anchored Severity**:
  $$\text{OverallSeverity} = \operatorname{SeverityLevel}\left(\max_{i} \text{Risk}_i\right)$$
  $$\text{Classification: } \begin{cases} [0, 33) & \text{LOW} \\ [33, 66) & \text{MODERATE} \\ [66, 85) & \text{HIGH} \\ [85, 100] & \text{CRITICAL} \end{cases}$$

---

## 3. IoT Sensor Quality Index & Anomaly Detection

Implemented in `backend/ml/anomaly_detection.py`, sensor telemetry quality ($Q_{\text{sensor}}$) gates model confidence and probability scaling:

$$Q_{\text{sensor}} = 1.0 - 0.50 \cdot \left(\frac{N_{\text{missing}}}{N_{\text{expected}}}\right) - 0.20 \cdot N_{\text{critical\_anomalies}} - 0.10 \cdot N_{\text{medium\_anomalies}}$$
$$\text{Subject to clamping: } 0.10 \le Q_{\text{sensor}} \le 1.00$$

### Physical Boundary Checks ($N_{\text{expected}} = 5$):
| Metric | Minimum Bound | Maximum Bound | Unit |
| :--- | :--- | :--- | :--- |
| **Temperature** | $-50.0$ | $+60.0$ | $^\circ\text{C}$ |
| **Relative Humidity** | $0.0$ | $100.0$ | $\%$ |
| **Rainfall Rate** | $0.0$ | $500.0$ | $\text{mm/h}$ |
| **Wind Speed** | $0.0$ | $300.0$ | $\text{km/h}$ |
| **Atmospheric Pressure** | $850.0$ | $1080.0$ | $\text{hPa}$ |

---

## 4. Multi-Target Synoptic Weather Predictor

Implemented in `backend/ml/weather_model.py` and serialized as `ml_training/weather_model.joblib`:
- **Model Type**: Multi-Output Scikit-Learn Pipeline (`SimpleImputer` $\to$ `StandardScaler` $\to$ `HistGradientBoostingRegressor`).
- **Feature Count**: 169 synoptic weather inputs across multi-station regional networks.
- **Harmonic Date Encoding**: Prevents seasonal discontinuity:
  $$\text{DOY} = \frac{2\pi \cdot \text{day\_of\_year}}{365.25}, \quad \mathbf{x}_{\text{cyclical}} = [\sin(\text{DOY}), \; \cos(\text{DOY}), \; \sin(\text{Month}), \; \cos(\text{Month})]$$
- **Target Outputs**:
  $$\mathbf{y} = \begin{bmatrix} \text{Mean Surface Temperature } (^\circ\text{C}) \\ \text{Precipitation Depth } (\text{cm}) \\ \text{Relative Humidity } (\text{fraction } 0.0 - 1.0) \end{bmatrix}$$

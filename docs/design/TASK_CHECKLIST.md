# Phase 1 â€” Finish Current Weather Model
- [x] dataset preprocessing
- [x] feature engineering
- [x] multi-target weather model
- [x] validation/evaluation
- [x] metrics
- [x] model serialization
- [x] preprocessing serialization
- [x] verification script
- [x] FastAPI-compatible loading

# Phase 2 â€” Make Weather Model Reusable
- [ ] Refactor weather model to expose clean inference interface

# Phase 3 â€” Prepare for Disaster Models
- [ ] Create interfaces for predict_flood, predict_heat, predict_landslide, predict_storm

# Phase 4 â€” Risk Fusion
- [ ] Create risk-fusion layer separating riskScore and confidence

# Phase 5 â€” Current and Predicted Areas
- [ ] Implement spatial prediction interfaces

# Phase 6 â€” Local Edge
- [ ] Define CLOUD and LOCAL_EDGE environments

# Phase 7 â€” Operating Modes
- [ ] Support CLOUD, LOCAL_EDGE, DEGRADED, NO_DATA

# Phase 8 â€” FastAPI Contract
- [ ] Create stable abstraction mapping ML interfaces to FastAPI


# Phase 8 — Flood Model
- [x] Check for real data
- [x] Build data schema
- [x] Feature pipeline
- [x] Train synthetic prototype pipeline
- [x] Model interface integration


# Phase 9 — Heatwave Model
- [x] Check for real data
- [x] Build data schema
- [x] Feature pipeline
- [x] Train synthetic prototype pipeline
- [x] Model interface integration


# Phase 10 — Landslide Model
- [x] Check for real data
- [x] Build data schema
- [x] Feature pipeline
- [x] Train synthetic prototype pipeline
- [x] Model interface integration


# Phase 11 — Storm Model
- [x] Check for real data via /browser
- [x] Build data schema
- [x] Feature pipeline
- [x] Train synthetic prototype pipeline
- [x] Model interface integration


# Phase 14 & 15 — Sensor Quality and Anomaly Detection
- [x] Enforce hard physical limits
- [x] Missing data penalty
- [x] Confidence reduction
- [x] Frontend payload integration


# Phase 18 — Explainability
- [x] Extract Feature Importances
- [x] Expose via JSON payload

# Phase 27 — Testing
- [x] Edge/Cloud Degradation tests
- [x] Sensor penalty tests
- [x] End-to-end inference verification

# ML & HAZARD FUSION ENGINE INTERFACE CONTRACT

This document specifies the interface for integrating production ML inference models (PyTorch, TensorFlow, ONNX) into the backend platform.

## Hazard Pipelines
1. **FloodModel**:
   - **Inputs**: Rainfall rate ($mm/h$), Water level ($cm$), Drainage elevation ($m$), Historical flood frequency.
   - **Outputs**: Flood Risk Score (0-100), Inundation area polygon, Time to peak inundation.

2. **HeatModel**:
   - **Inputs**: Ambient Temperature ($°C$), Relative Humidity (%), Impervious Asphalt Area Ratio, Tree Canopy NDVI.
   - **Outputs**: Heat Stress Score (0-100), Urban Heat Island Thermal Anomaly ($°C$).

3. **LandslideModel**:
   - **Inputs**: 24h Accumulated Rainfall ($mm$), Subsoil Volumetric Saturation (%), Slope Angle ($deg$), Soil Cohesion Index.
   - **Outputs**: Geotechnical Failure Probability, Runout Zone Polygon.

4. **StormModel**:
   - **Inputs**: Wind Velocity ($km/h$), Barometric Pressure Drop ($hPa$), Radar Rain Vector.
   - **Outputs**: Squall Vector, Wind Hazard Score (0-100).

## Risk Fusion Engine Output Contract
The ML backend must produce the following standardized payload:
```json
{
  "mode": "CLOUD",
  "timestamp": "2026-09-03T18:30:00Z",
  "hazard": "FLOOD",
  "riskScore": 88,
  "severity": "CRITICAL",
  "confidence": 0.92,
  "currentAreas": [],
  "predictedAreas": [],
  "contributingFactors": [],
  "explanationAvailable": true,
  "explanationText": "Multi-hazard inference indicates CRITICAL risk driven by flood inundation...",
  "modelVersion": "onnx-fusion-v4.2",
  "inferenceTimestamp": "2026-09-03T18:30:00Z"
}
```

"""
backend/api/simulation.py - Dynamic Disaster Simulation & Directional Hazard-Propagation API
"""
import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

from core.spatial_risk_engine import SpatialRiskEngine
from core.sensor_store import SensorStore
from core.hotspot_store import HotspotStore
from core.alert_engine import AlertEngine
from ml.hazard_models import OperatingMode
from ml.propagation_formula import (
    calculate_propagation_bearing,
    calculate_great_circle_bearing,
    calculate_angular_alignment,
    calculate_haversine_distance_km,
    calculate_distance_score,
    calculate_compatibility_score,
    calculate_intensity_factor,
    evaluate_propagation_physics
)

router = APIRouter(prefix="/api")

# Lazy-load trained directional propagation model
_propagation_model = None

def _get_propagation_model():
    global _propagation_model
    if _propagation_model is None:
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml_training", "propagation_model.joblib")
        if os.path.exists(model_path):
            try:
                _propagation_model = joblib.load(model_path)
            except Exception:
                _propagation_model = None
    return _propagation_model


class SimulationRequest(BaseModel):
    hazard: Optional[str] = Field("FLOOD", description="Primary hazard focus (FLOOD, HEAT, LANDSLIDE, STORM, HEAVY_RAIN)")
    rainfall_mm_h: Optional[float] = Field(None, ge=0.0, le=500.0, description="Simulated rainfall intensity (mm/h)")
    temperature_c: Optional[float] = Field(None, ge=-30.0, le=60.0, description="Simulated ambient temperature (°C)")
    wind_speed_kmh: Optional[float] = Field(None, ge=0.0, le=300.0, description="Simulated wind speed (km/h)")
    soil_moisture_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated soil moisture (0.0 - 1.0)")
    pressure_hpa: Optional[float] = Field(None, ge=850.0, le=1080.0, description="Simulated atmospheric pressure (hPa)")
    mode: Optional[str] = Field("CLOUD", description="Operating mode override")


class DirectedSimulationRequest(BaseModel):
    eventType: str = Field("heavy_rain", description="Event type: flood, heatwave, landslide, heavy_rain")
    sensorId: Optional[str] = Field(None, description="Source sensor ID originating the event")
    sourceSensorId: Optional[str] = Field(None, description="Source sensor ID alias")
    dataPoints: Dict[str, float] = Field(default_factory=dict, description="Environmental data points")
    mode: Optional[str] = Field("CLOUD", description="Operating mode override (CLOUD, LOCAL_EDGE, DEGRADED, NO_DATA)")
    windDirection: Optional[float] = None
    windDirectionDeg: Optional[float] = None
    windSpeed: Optional[float] = None
    windSpeedKmh: Optional[float] = None
    rainfall: Optional[float] = None
    rainfallRate: Optional[float] = None
    rainfallMmHr: Optional[float] = None
    temperature: Optional[float] = None
    temperatureC: Optional[float] = None
    humidity: Optional[float] = None
    humidityPct: Optional[float] = None
    pressure: Optional[float] = None
    pressureHpa: Optional[float] = None


@router.post("/simulate/run")
def run_directed_simulation(req: DirectedSimulationRequest):
    """
    Task 7 Inference Endpoint: Directional Next-Hotspot Hazard Propagation Prediction.
    Evaluates placed candidate hotspots downwind from source sensor, ranking top 3
    with XAI factor attribution and directional cone geometry.
    """
    sensor_store = SensorStore.get_instance()
    hotspot_store = HotspotStore.get_instance()

    # Resolve operating mode
    op_str = (req.mode or "CLOUD").upper()
    try:
        op_mode = OperatingMode(op_str)
    except ValueError:
        op_mode = OperatingMode.CLOUD

    if op_mode == OperatingMode.NO_DATA:
        return {
            "status": "NO_DATA",
            "eventType": req.eventType,
            "message": "System operating without active telemetry feed. Directional propagation suspended.",
            "rankedCandidates": [],
            "predictions": [],
            "coneGeometry": [],
            "mode": op_mode.value,
            "confidence": 0.0
        }

    # Resolve source sensor
    sensors = sensor_store.get_all_sensors()
    source_sensor = None
    sensor_id = req.sensorId or req.sourceSensorId
    if sensor_id:
        source_sensor = sensor_store.get_sensor(sensor_id)
    if not source_sensor and sensors:
        source_sensor = sensors[0]

    s_lat = source_sensor["lat"] if source_sensor else 13.386
    s_lng = source_sensor["lng"] if source_sensor else 79.798
    s_name = source_sensor["name"] if source_sensor else "Regional Center Reference"
    s_quality = source_sensor.get("qualityScore", 1.0) if source_sensor else 1.0

    # Environmental parameters
    wind_deg = float(
        req.dataPoints.get("windDirectionDeg",
        req.dataPoints.get("windDirection",
        req.windDirectionDeg if req.windDirectionDeg is not None else
        (req.windDirection if req.windDirection is not None else 180.0)))
    )
    wind_speed = float(
        req.dataPoints.get("windSpeedKmh",
        req.dataPoints.get("windSpeed",
        req.windSpeedKmh if req.windSpeedKmh is not None else
        (req.windSpeed if req.windSpeed is not None else 15.0)))
    )
    rainfall = float(
        req.dataPoints.get("rainfallMmHr",
        req.dataPoints.get("rainfall",
        req.rainfallMmHr if req.rainfallMmHr is not None else
        (req.rainfallRate if req.rainfallRate is not None else
        (req.rainfall if req.rainfall is not None else 0.0))))
    )
    prop_bearing = calculate_propagation_bearing(wind_deg)

    # Gather candidate hotspots
    hotspots = hotspot_store.get_all_hotspots()
    if not hotspots:
        return {
            "status": "SUCCESS",
            "eventType": req.eventType,
            "sourceSensor": {"id": source_sensor["id"] if source_sensor else "none", "name": s_name, "coordinates": [s_lat, s_lng]},
            "windDirectionDeg": wind_deg,
            "propagationBearingDeg": prop_bearing,
            "rankedCandidates": [],
            "predictions": [],
            "coneGeometry": [],
            "message": "No hotspots currently drawn in region. Draw hotspots on map to predict propagation.",
            "mode": op_mode.value,
            "confidence": 0.0
        }

    model = _get_propagation_model() if op_mode == OperatingMode.CLOUD else None
    ranked_candidates = []

    for hs in hotspots:
        h_lat, h_lng = hs["centroid"]
        h_tag = hs["hazardTag"]
        h_slope = hs.get("slope", 2.0)
        h_elev = hs.get("elevation", 70.0)

        # 1. Exact physics evaluation (used for factor attribution & fallback)
        physics = evaluate_propagation_physics(
            sensor_lat=s_lat,
            sensor_lng=s_lng,
            hotspot_lat=h_lat,
            hotspot_lng=h_lng,
            hazard_tag=h_tag,
            event_type=req.eventType,
            wind_deg=wind_deg,
            data_points=req.dataPoints,
            slope_deg=h_slope,
            elevation_m=h_elev
        )

        probability = physics["probability"]

        # 2. In CLOUD mode on directional events, use trained scikit-learn model
        if model is not None and physics.get("isDirectional", True):
            bearing = calculate_great_circle_bearing(s_lat, s_lng, h_lat, h_lng)
            ang_diff, _ = calculate_angular_alignment(bearing, prop_bearing)
            dist_km = physics["distanceKm"]
            compat = calculate_compatibility_score(req.eventType, h_tag, h_slope, h_elev)

            feat_df = pd.DataFrame([{
                "angular_diff": ang_diff,
                "distance_km": dist_km,
                "compatibility_score": compat,
                "rainfall": rainfall,
                "wind_speed": wind_speed,
                "terrain_slope": h_slope
            }])
            try:
                ml_prob = float(model.predict(feat_df)[0])
                probability = min(100.0, max(0.0, round(ml_prob, 1)))
            except Exception:
                pass

        # Operating mode attenuation
        mode_multiplier = 1.0 if op_mode == OperatingMode.CLOUD else (0.75 if op_mode == OperatingMode.LOCAL_EDGE else 0.50)
        final_prob = min(100.0, max(0.0, round(probability * mode_multiplier * s_quality, 1)))

        # Build directional cone / arrow geometry
        bearing_deg = physics["bearingDeg"]
        dist_km = physics["distanceKm"]
        cone = {
            "origin": [s_lat, s_lng],
            "target": [h_lat, h_lng],
            "bearing": bearing_deg,
            "distanceKm": dist_km
        }

        ranked_candidates.append({
            "hotspotId": hs["id"],
            "name": hs.get("name") or hs.get("title") or "Hotspot",
            "title": hs.get("name") or hs.get("title") or "Hotspot",
            "hazardTag": h_tag,
            "probability": final_prob,
            "bearing": bearing_deg,
            "bearingDeg": bearing_deg,
            "distanceKm": dist_km,
            "slopeDeg": h_slope,
            "elevationM": h_elev,
            "factors": physics["factors"],
            "cone": cone,
            "isDirectional": physics.get("isDirectional", True)
        })

    # Sort descending by probability
    ranked_candidates.sort(key=lambda c: c["probability"], reverse=True)
    top_candidates = ranked_candidates[:3]

    base_confidence = 0.90 if op_mode == OperatingMode.CLOUD else (0.65 if op_mode == OperatingMode.LOCAL_EDGE else 0.40)
    overall_confidence = round(base_confidence * s_quality, 2)

    return {
        "status": "SUCCESS",
        "eventType": req.eventType,
        "sourceSensor": {
            "id": source_sensor["id"] if source_sensor else "none",
            "name": s_name,
            "coordinates": [s_lat, s_lng]
        },
        "windDirectionDeg": wind_deg,
        "propagationBearingDeg": prop_bearing,
        "rankedCandidates": top_candidates,
        "predictions": top_candidates,
        "coneGeometry": [c["cone"] for c in top_candidates if "cone" in c],
        "mode": op_mode.value,
        "confidence": overall_confidence
    }


@router.post("/simulate")
def trigger_simulation(req: SimulationRequest):
    risk_engine = SpatialRiskEngine.get_instance()
    sensor_store = SensorStore.get_instance()
    alert_engine = AlertEngine.get_instance()

    overrides = {}
    if req.rainfall_mm_h is not None:
        overrides["rainfall"] = req.rainfall_mm_h
    if req.temperature_c is not None:
        overrides["temperature"] = req.temperature_c
    if req.wind_speed_kmh is not None:
        overrides["windSpeed"] = req.wind_speed_kmh
    if req.soil_moisture_ratio is not None:
        overrides["soil_moisture"] = req.soil_moisture_ratio
    if req.pressure_hpa is not None:
        overrides["pressure"] = req.pressure_hpa

    risk_engine.set_simulation_overrides(overrides)

    if overrides:
        for s in sensor_store.get_all_sensors():
            sensor_store.ingest_reading(s["id"], overrides)

    mode = req.mode or risk_engine.current_operating_mode
    updated_assessment = risk_engine.evaluate_risk(mode=mode)
    active_alerts = alert_engine.get_all_alerts(status_filter="ACTIVE")

    return {
        "status": "SIMULATED",
        "scenario": req.dict() if hasattr(req, "dict") else req.model_dump(),
        "riskAssessment": updated_assessment,
        "activeAlerts": active_alerts
    }


@router.post("/reset-simulation")
def reset_simulation():
    risk_engine = SpatialRiskEngine.get_instance()
    risk_engine.reset_simulation()
    return {
        "status": "RESET",
        "message": "Simulation parameters reset to live baseline telemetry."
    }

"""
backend/api/simulation.py - Dynamic Disaster Simulation Propagation API
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.spatial_risk_engine import SpatialRiskEngine
from core.sensor_store import SensorStore
from core.alert_engine import AlertEngine

router = APIRouter(prefix="/api")

class SimulationRequest(BaseModel):
    hazard: Optional[str] = Field("FLOOD", description="Primary hazard focus (FLOOD, HEAT, LANDSLIDE, STORM)")
    rainfall_mm_h: Optional[float] = Field(None, ge=0.0, le=500.0, description="Simulated rainfall intensity (mm/h)")
    temperature_c: Optional[float] = Field(None, ge=-30.0, le=60.0, description="Simulated ambient temperature (°C)")
    wind_speed_kmh: Optional[float] = Field(None, ge=0.0, le=300.0, description="Simulated wind speed (km/h)")
    soil_moisture_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated soil moisture (0.0 - 1.0)")
    pressure_hpa: Optional[float] = Field(None, ge=850.0, le=1080.0, description="Simulated atmospheric pressure (hPa)")
    mode: Optional[str] = Field("CLOUD", description="Operating mode override")

@router.post("/simulate")
def trigger_simulation(req: SimulationRequest):
    risk_engine = SpatialRiskEngine.get_instance()
    sensor_store = SensorStore.get_instance()
    alert_engine = AlertEngine.get_instance()

    # Build override map
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

    # 1. Update risk engine simulation state
    risk_engine.set_simulation_overrides(overrides)

    # 2. Propagate simulated telemetry into sensor network
    if overrides:
        for sns in sensor_store.sensors.values():
            sns.update_readings(overrides)

    # 3. Recalculate spatial risk state
    mode = req.mode or risk_engine.current_operating_mode
    updated_assessment = risk_engine.evaluate_risk(mode=mode)

    # 4. Fetch newly generated alerts
    active_alerts = alert_engine.get_all_alerts(status_filter="ACTIVE")

    return {
        "status": "SIMULATED",
        "scenario": req.dict(),
        "riskAssessment": updated_assessment,
        "activeAlerts": active_alerts
    }

@router.post("/reset-simulation")
def reset_simulation():
    risk_engine = SpatialRiskEngine.get_instance()
    sensor_store = SensorStore.get_instance()

    # Reset overrides and alerts
    risk_engine.reset_simulation()

    # Reset default sensors
    sensor_store._init_default_sensors()

    # Recalculate baseline assessment
    baseline = risk_engine.evaluate_risk()

    return {
        "status": "RESET",
        "message": "Simulation parameters reset to baseline environmental state.",
        "riskAssessment": baseline
    }

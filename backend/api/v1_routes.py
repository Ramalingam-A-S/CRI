"""
backend/api/v1_routes.py - Authoritative Primary API Endpoint Routes for CRI
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Path, status
from pydantic import BaseModel, Field

from core.spatial_risk_engine import SpatialRiskEngine
from core.sensor_store import SensorStore
from core.hotspot_store import HotspotStore
from core.alert_engine import AlertEngine
from core.incident_command import IncidentCommand
from ml.hazard_models import OperatingMode

v1_router = APIRouter(prefix="/api/v1")

# --- REQUEST SCHEMAS ---
class ModeRequest(BaseModel):
    mode: str = Field(..., description="Operating mode: CLOUD, LOCAL_EDGE, DEGRADED, NO_DATA")

class SensorIngestRequest(BaseModel):
    sensor_id: str
    readings: Dict[str, float]

class HotspotCreateRequest(BaseModel):
    name: str
    latitude: float
    longitude: float
    hazard: str = "FLOOD"
    severity: str = "HIGH"
    baselineRiskScore: int = 70
    radius_m: int = 500
    active: bool = True
    notes: Optional[str] = "Admin defined hotspot"

class HotspotUpdateRequest(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    hazard: Optional[str] = None
    severity: Optional[str] = None
    baselineRiskScore: Optional[int] = None
    radius_m: Optional[int] = None
    active: Optional[bool] = None
    notes: Optional[str] = None

class IncidentCreateRequest(BaseModel):
    title: str
    hazard: str
    severity: str = "MODERATE"
    latitude: float
    longitude: float
    reporter: Optional[str] = "Citizen Report"
    description: Optional[str] = "No description provided"


# --- OPERATING MODE ROUTES ---
@v1_router.get("/mode")
def get_mode():
    engine = SpatialRiskEngine.get_instance()
    return {"mode": engine.current_operating_mode}

@v1_router.post("/mode")
def set_mode(req: ModeRequest):
    valid_modes = [m.value for m in OperatingMode]
    mode_str = req.mode.upper()
    if mode_str not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid operating mode '{req.mode}'. Allowed modes: {valid_modes}"
        )
    engine = SpatialRiskEngine.get_instance()
    new_mode = engine.set_operating_mode(mode_str)
    return {"mode": new_mode, "status": "updated"}


# --- RISK ASSESSMENT ROUTES ---
@v1_router.get("/risk/assessment")
def get_risk_assessment(mode: Optional[str] = Query(None, description="Override mode (CLOUD, LOCAL_EDGE, DEGRADED, NO_DATA)")):
    engine = SpatialRiskEngine.get_instance()
    assessment = engine.evaluate_risk(mode=mode)
    return assessment

@v1_router.get("/risk/map")
def get_risk_map(mode: Optional[str] = Query(None)):
    engine = SpatialRiskEngine.get_instance()
    assessment = engine.evaluate_risk(mode=mode)
    return {
        "mode": assessment.get("mode"),
        "timestamp": assessment.get("timestamp"),
        "currentAreas": assessment.get("currentAreas", []),
        "predictedAreas": assessment.get("predictedAreas", [])
    }


# --- SENSOR NETWORK ROUTES ---
@v1_router.get("/sensors")
def get_sensors():
    store = SensorStore.get_instance()
    return store.get_all_sensors()

@v1_router.get("/sensors/{sensor_id}")
def get_sensor_by_id(sensor_id: str = Path(...)):
    store = SensorStore.get_instance()
    sensor = store.get_sensor(sensor_id)
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor '{sensor_id}' not found.")
    return sensor

@v1_router.post("/sensors/ingest")
def ingest_sensor_reading(req: SensorIngestRequest):
    if not req.readings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Readings dictionary cannot be empty.")
    store = SensorStore.get_instance()
    updated = store.ingest_reading(req.sensor_id, req.readings)
    return {"status": "ingested", "sensor": updated}


# --- HOTSPOT MANAGEMENT ROUTES ---
@v1_router.get("/hotspots")
def get_hotspots():
    store = HotspotStore.get_instance()
    return store.get_all_hotspots()

@v1_router.post("/hotspots", status_code=status.HTTP_201_CREATED)
def create_hotspot(req: HotspotCreateRequest):
    store = HotspotStore.get_instance()
    created = store.create_hotspot(req.dict())
    return created

@v1_router.put("/hotspots/{hotspot_id}")
def update_hotspot(hotspot_id: str, req: HotspotUpdateRequest):
    store = HotspotStore.get_instance()
    updated = store.update_hotspot(hotspot_id, req.dict())
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hotspot '{hotspot_id}' not found.")
    return updated

@v1_router.delete("/hotspots/{hotspot_id}")
def delete_hotspot(hotspot_id: str):
    store = HotspotStore.get_instance()
    deleted = store.delete_hotspot(hotspot_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hotspot '{hotspot_id}' not found.")
    return {"status": "deleted", "id": hotspot_id}


# --- ALERTS & INCIDENT COMMAND ROUTES ---
@v1_router.get("/alerts")
def get_alerts(status_filter: Optional[str] = Query(None, alias="status")):
    engine = AlertEngine.get_instance()
    return engine.get_all_alerts(status_filter=status_filter)

@v1_router.post("/alerts/acknowledge/{alert_id}")
def acknowledge_alert(alert_id: str):
    engine = AlertEngine.get_instance()
    ack = engine.acknowledge_alert(alert_id)
    if not ack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found.")
    return ack

@v1_router.get("/shelters")
def get_shelters():
    cmd = IncidentCommand.get_instance()
    return cmd.get_all_shelters()

@v1_router.get("/infrastructure")
def get_infrastructure():
    cmd = IncidentCommand.get_instance()
    return cmd.get_all_infrastructure()

@v1_router.get("/incidents")
def get_incidents():
    cmd = IncidentCommand.get_instance()
    return cmd.get_all_incidents()

@v1_router.post("/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(req: IncidentCreateRequest):
    cmd = IncidentCommand.get_instance()
    created = cmd.create_incident(req.dict())
    return created

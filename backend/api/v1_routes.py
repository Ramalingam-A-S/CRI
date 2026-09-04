"""
backend/api/v1_routes.py - Hotspots, Sensors, Alerts, and Operating Mode API Routes
"""
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from core.spatial_risk_engine import SpatialRiskEngine
from core.sensor_store import SensorStore
from core.hotspot_store import HotspotStore
from core.alert_engine import AlertEngine
from core.incident_command import IncidentCommand


v1_router = APIRouter(prefix="/api/v1")
api_router = APIRouter(prefix="/api")

# --- REQUEST SCHEMAS ---
class ModeRequest(BaseModel):
    mode: str = Field(..., description="Operating mode: CLOUD, LOCAL_EDGE, DEGRADED, NO_DATA")

class SensorIngestRequest(BaseModel):
    sensor_id: str
    readings: Dict[str, float]

class SensorCreateRequest(BaseModel):
    name: Optional[str] = Field("Sensor", description="Sensor human name")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude")
    latitude: Optional[float] = Field(None, description="Latitude alias")
    longitude: Optional[float] = Field(None, description="Longitude alias")
    readings: Optional[Dict[str, float]] = None
    unit: Optional[str] = "°C"
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    rainfall_rate: Optional[float] = None
    pressure: Optional[float] = None

class SensorUpdateRequest(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    readings: Optional[Dict[str, float]] = None
    unit: Optional[str] = None

class HotspotCreateRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    hazardTag: Optional[str] = None
    primaryTag: Optional[str] = None
    hazard: Optional[str] = "FLOOD"
    geometry: Optional[Dict[str, Any]] = None
    polygon: Optional[List[Any]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = "HIGH"
    baselineRiskScore: Optional[int] = 70
    radius_m: Optional[int] = 500
    active: Optional[bool] = True
    notes: Optional[str] = ""
    description: Optional[str] = ""

class HotspotUpdateRequest(BaseModel):
    name: Optional[str] = None
    hazardTag: Optional[str] = None
    hazard: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = None
    baselineRiskScore: Optional[int] = None
    radius_m: Optional[int] = None
    active: Optional[bool] = None
    notes: Optional[str] = None

class IncidentCreateRequest(BaseModel):
    title: str
    hazard: str = "FLOOD"
    severity: str = "HIGH"
    latitude: float
    longitude: float
    reporter: str = "Anonymous Citizen"
    description: str = ""


# --- SHARED ROUTE IMPLEMENTATIONS ---

def _set_mode(req: ModeRequest):
    engine = SpatialRiskEngine.get_instance()
    new_mode = engine.set_operating_mode(req.mode)
    return {"status": "success", "mode": new_mode}

def _get_assessment(mode: Optional[str] = None):
    engine = SpatialRiskEngine.get_instance()
    return engine.evaluate_risk(mode=mode)

def _get_risk_map(mode: Optional[str] = None):
    engine = SpatialRiskEngine.get_instance()
    assessment = engine.evaluate_risk(mode=mode)
    return {
        "mode": assessment.get("mode"),
        "timestamp": assessment.get("timestamp"),
        "currentAreas": assessment.get("currentAreas", []),
        "predictedAreas": assessment.get("predictedAreas", [])
    }

def _get_sensors():
    return SensorStore.get_instance().get_all_sensors()

def _create_sensor(req: SensorCreateRequest):
    store = SensorStore.get_instance()
    payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    # Resolve coordinate aliases
    if payload.get("lat") is None and payload.get("latitude") is not None:
        payload["lat"] = payload["latitude"]
    if payload.get("lng") is None and payload.get("longitude") is not None:
        payload["lng"] = payload["longitude"]
    # If flat readings were passed, bundle into readings dict
    readings = payload.get("readings") or {}
    for k in ["temperature", "humidity", "wind_speed", "wind_direction", "rainfall_rate", "pressure"]:
        if payload.get(k) is not None and k not in readings:
            readings[k] = payload[k]
    if readings:
        payload["readings"] = readings
    created = store.create_sensor(payload)
    return created

def _get_sensor_by_id(sensor_id: str):
    store = SensorStore.get_instance()
    sensor = store.get_sensor(sensor_id)
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor '{sensor_id}' not found.")
    return sensor

def _update_sensor(sensor_id: str, req: SensorUpdateRequest):
    store = SensorStore.get_instance()
    payload = req.model_dump(exclude_unset=True) if hasattr(req, "model_dump") else req.dict(exclude_unset=True)
    if payload.get("lat") is None and payload.get("latitude") is not None:
        payload["lat"] = payload["latitude"]
    if payload.get("lng") is None and payload.get("longitude") is not None:
        payload["lng"] = payload["longitude"]
    updated = store.update_sensor(sensor_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor '{sensor_id}' not found.")
    return updated

def _delete_sensor(sensor_id: str):
    store = SensorStore.get_instance()
    deleted = store.delete_sensor(sensor_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sensor '{sensor_id}' not found.")
    return {"status": "deleted", "id": sensor_id}

def _ingest_reading(req: SensorIngestRequest):
    if not req.readings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Readings dictionary cannot be empty.")
    store = SensorStore.get_instance()
    updated = store.ingest_reading(req.sensor_id, req.readings)
    return {"status": "ingested", "sensor": updated}

def _get_hotspots():
    return HotspotStore.get_instance().get_all_hotspots()

def _create_hotspot(req: HotspotCreateRequest):
    store = HotspotStore.get_instance()
    payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    if not payload.get("name") and payload.get("title"):
        payload["name"] = payload["title"]
    elif not payload.get("name"):
        payload["name"] = "Custom Hotspot"
    if not payload.get("hazardTag") and payload.get("primaryTag"):
        payload["hazardTag"] = payload["primaryTag"]
    if not payload.get("notes") and payload.get("description"):
        payload["notes"] = payload["description"]
    if not payload.get("geometry") and payload.get("polygon"):
        poly = payload["polygon"]
        if poly and poly[0] != poly[-1]:
            poly = poly + [poly[0]]
        payload["geometry"] = {
            "type": "Polygon",
            "coordinates": [poly]
        }
    created = store.create_hotspot(payload)
    return created

def _update_hotspot(hotspot_id: str, req: HotspotUpdateRequest):
    store = HotspotStore.get_instance()
    payload = req.model_dump(exclude_unset=True) if hasattr(req, "model_dump") else req.dict(exclude_unset=True)
    updated = store.update_hotspot(hotspot_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hotspot '{hotspot_id}' not found.")
    return updated

def _delete_hotspot(hotspot_id: str):
    store = HotspotStore.get_instance()
    deleted = store.delete_hotspot(hotspot_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hotspot '{hotspot_id}' not found.")
    return {"status": "deleted", "id": hotspot_id}

def _get_alerts(status_filter: Optional[str] = None):
    return AlertEngine.get_instance().get_all_alerts(status_filter=status_filter)

def _acknowledge_alert(alert_id: str):
    ack = AlertEngine.get_instance().acknowledge_alert(alert_id)
    if not ack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found.")
    return ack


# --- BIND TO BOTH /api/v1 AND /api FOR FULL CLIENT & TEST COMPATIBILITY ---

def _create_incident(req: IncidentCreateRequest):
    cmd = IncidentCommand.get_instance()
    payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    return cmd.create_incident(payload)

for r in [v1_router, api_router]:
    r.add_api_route("/mode", _set_mode, methods=["POST"])
    r.add_api_route("/risk/assessment", _get_assessment, methods=["GET"])
    r.add_api_route("/risk/map", _get_risk_map, methods=["GET"])

    r.add_api_route("/sensors", _get_sensors, methods=["GET"])
    r.add_api_route("/sensors", _create_sensor, methods=["POST"], status_code=status.HTTP_201_CREATED)
    r.add_api_route("/sensors/{sensor_id}", _get_sensor_by_id, methods=["GET"])
    r.add_api_route("/sensors/{sensor_id}", _update_sensor, methods=["PUT"])
    r.add_api_route("/sensors/{sensor_id}", _delete_sensor, methods=["DELETE"])
    r.add_api_route("/sensors/ingest", _ingest_reading, methods=["POST"])

    r.add_api_route("/hotspots", _get_hotspots, methods=["GET"])
    r.add_api_route("/hotspots", _create_hotspot, methods=["POST"], status_code=status.HTTP_201_CREATED)
    r.add_api_route("/hotspots/{hotspot_id}", _update_hotspot, methods=["PUT"])
    r.add_api_route("/hotspots/{hotspot_id}", _delete_hotspot, methods=["DELETE"])

    r.add_api_route("/alerts", _get_alerts, methods=["GET"])
    r.add_api_route("/alerts/acknowledge/{alert_id}", _acknowledge_alert, methods=["POST"])

    r.add_api_route("/incidents", lambda: IncidentCommand.get_instance().get_all_incidents(), methods=["GET"])
    r.add_api_route("/incidents", _create_incident, methods=["POST"], status_code=status.HTTP_201_CREATED)

    r.add_api_route("/shelters", lambda: IncidentCommand.get_instance().get_all_shelters(), methods=["GET"])
    r.add_api_route("/infrastructure", lambda: IncidentCommand.get_instance().get_all_infrastructure(), methods=["GET"])



from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api")

class SimulationRequest(BaseModel):
    hazard: str
    intensity: float
    lat: float
    lon: float
    radius_m: int
    duration_minutes: int

@router.post("/simulate")
def trigger_simulation(req: SimulationRequest):
    # Update global mock state or similar for the hackathon MVP
    return {"status": "simulated", "scenario": req.dict()}

@router.post("/reset-simulation")
def reset_simulation():
    return {"status": "reset"}

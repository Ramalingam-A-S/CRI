from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class HazardScore(BaseModel):
    score: float # 0-100
    level: str # LOW, MODERATE, HIGH, CRITICAL
    factors: Dict[str, float] # e.g., {"Heavy rainfall": 29, "Low elevation": 21}

class RouteSegment(BaseModel):
    segment_id: int
    geometry: Dict[str, Any]
    distance_from_origin: float
    distance_to_destination: float
    estimated_arrival_time: str
    latitude: float
    longitude: float
    elevation: float
    elevation_change: float = 0.0
    slope: float
    rainfall: float
    temperature: float
    humidity: float
    water_proximity: float
    historical_susceptibility: float
    
    flood_risk: Optional[HazardScore] = None
    heat_risk: Optional[HazardScore] = None
    landslide_risk: Optional[HazardScore] = None
    
    overall_risk_score: Optional[float] = None
    overall_risk_level: Optional[str] = None
    confidence: float = 0.85
    timestamp: str = "2026-09-03T18:00:00Z"

class NormalizedRoute(BaseModel):
    route_id: str = ""
    provider: str
    status: str
    distance_m: float
    duration_s: float
    geometry: List[List[float]]
    bounds: Dict[str, float]

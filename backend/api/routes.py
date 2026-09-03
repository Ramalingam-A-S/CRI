from typing import Optional, Dict, List, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routing.router import get_routes
from core import segmentation, temporal_engine
from ml.hazard_models import OperatingMode

router = APIRouter(prefix="/api")

class RouteRequest(BaseModel):
    origin: str
    destination: str
    departure_time: str
    scenario: str = "BASELINE"
    mode: str = "CLOUD"

def get_rain_level(rainfall: float) -> str:
    if rainfall > 50: return 'SEVERE'
    if rainfall > 30: return 'HIGH'
    if rainfall > 10: return 'MODERATE'
    return 'LOW'

@router.post("/analyze-route")
def analyze_route(req: RouteRequest):
    # Guard: same origin and destination
    if req.origin.strip() == req.destination.strip():
        raise HTTPException(status_code=400, detail="Origin and destination must be different locations.")

    routes = get_routes(req.origin, req.destination)
    if not routes:
        raise HTTPException(status_code=404, detail="Route could not be calculated by any provider")
        
    try:
        op_mode = OperatingMode(req.mode)
    except ValueError:
        op_mode = OperatingMode.CLOUD
        
    rain_mod = 2.5 if req.scenario == "HEAVY RAIN" else 1.0
        
    evaluated_routes = []
    
    for i, route in enumerate(routes):
        scored_segments = segmentation.segment_route(route, req.departure_time, rain_mod=rain_mod, mode=op_mode)
        
        high_risk_segments = [s for s in scored_segments if s["overall_risk_level"] in ["HIGH", "CRITICAL"]]
        num_high_risk = len(high_risk_segments)
        exposure_percent = int((num_high_risk / len(scored_segments)) * 100) if scored_segments else 0
        
        crit_seg = max(scored_segments, key=lambda s: s["overall_risk_score"]) if scored_segments else None
        overall_level = crit_seg["overall_risk_level"] if crit_seg else "LOW"
        
        # Calculate climate score (lower is better)
        avg_score = sum(s["overall_risk_score"] for s in scored_segments) / len(scored_segments) if scored_segments else 0
        climate_score = avg_score + (num_high_risk * 1.5)
        if crit_seg:
            climate_score += crit_seg["overall_risk_score"] * 0.2
            
        hazard_counts = {"FLOOD": 0, "HEAT": 0, "LANDSLIDE": 0, "RAIN": 0}
        for s in high_risk_segments:
            if s["flood_risk"]["level"] in ["HIGH", "CRITICAL"]: hazard_counts["FLOOD"] += 1
            if s["heat_risk"]["level"] in ["HIGH", "CRITICAL"]: hazard_counts["HEAT"] += 1
            if s["landslide_risk"]["level"] in ["HIGH", "CRITICAL"]: hazard_counts["LANDSLIDE"] += 1
            if get_rain_level(s["rainfall"]) in ["HIGH", "SEVERE"]: hazard_counts["RAIN"] += 1
            
        dominant_hazard = max(hazard_counts.items(), key=lambda x: x[1])[0] if num_high_risk > 0 else "NONE"
        
        # Build explanation
        reasons = []
        if num_high_risk > 0:
            reasons.append(f"⚠ {num_high_risk} high-risk segments")
            if dominant_hazard != "NONE":
                reasons.append(f"⚠ High {dominant_hazard.lower()} exposure")
        
        evaluated_routes.append({
            "route_id": route.route_id,
            "type": "FASTEST" if i == 0 else "ALTERNATIVE",
            "route": route.dict(),
            "segments": scored_segments,
            "overall_risk": {
                "level": overall_level,
                "score": crit_seg["overall_risk_score"] if crit_seg else 0
            },
            "summary": {
                "high_risk_segments": num_high_risk,
                "exposure_percent": exposure_percent,
                "dominant_hazard": dominant_hazard,
                "climate_score": round(climate_score, 1),
                "reasons": reasons
            }
        })

    fastest = evaluated_routes[0]
    safer = None
    recommendation = "FASTEST ROUTE"
    
    # We always want to return an alternative to show comparison if available
    alt_route = evaluated_routes[1] if len(evaluated_routes) > 1 else None
    
    if alt_route:
        fastest_score = fastest["summary"]["climate_score"]
        alt_score = alt_route["summary"]["climate_score"]
        
        # Determine if it's significantly safer
        if alt_score < fastest_score - 2.0:
            safer = alt_route
            safer["type"] = "SAFER_ALTERNATIVE"
            
            fastest_risk = fastest["summary"]["high_risk_segments"]
            safer_risk = safer["summary"]["high_risk_segments"]
            
            if safer_risk < fastest_risk:
                safer["summary"]["reasons"] = [f"✓ Avoids {fastest_risk - safer_risk} high-risk segments"]
            else:
                safer["summary"]["reasons"] = [f"✓ Lower overall climate exposure"]
                
            time_diff = int((safer["route"]["duration_s"] - fastest["route"]["duration_s"]) / 60)
            if time_diff > 0:
                safer["summary"]["reasons"].append(f"✓ Only +{time_diff} min travel time")
                recommendation = f"SAFER ROUTE — +{time_diff} MIN"
            else:
                recommendation = "CLIMATE-SAFER ROUTE"
        else:
            # It's not significantly safer
            safer = alt_route
            safer["type"] = "ALTERNATIVE"
            safer["summary"]["reasons"] = ["Route has comparable or higher climate risk"]
            
            if fastest["summary"]["high_risk_segments"] > (len(fastest["segments"]) * 0.5):
                recommendation = "RECONSIDER DEPARTURE"
            else:
                recommendation = "NO CLEAR ADVANTAGE"
    else:
        if fastest["summary"]["high_risk_segments"] > (len(fastest["segments"]) * 0.5):
            recommendation = "RECONSIDER DEPARTURE"
            
    final_routes = [fastest]
    if safer:
        final_routes.append(safer)
        
    return {
        "recommended_route_id": safer["route_id"] if safer else fastest["route_id"],
        "recommendation_reason": recommendation,
        "routes": final_routes,
        "data_provenance": [
            {"type": "WEATHER", "source": "Multi-Target ML Predictor", "status": "SIMULATED" if req.scenario != "BASELINE" else "PREDICTED"},
            {"type": "ROUTE", "source": f"{routes[0].provider.upper()}", "status": routes[0].status.upper()},
            {"type": "ELEVATION", "source": "Local DEM Pseudo-Hash", "status": "DERIVED"}
        ]
    }

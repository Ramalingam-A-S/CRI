def get_level(score):
    if score < 33: return "LOW"
    if score < 66: return "MODERATE"
    if score < 85: return "HIGH"
    return "CRITICAL"

def score_segments(segments, rainfall_modifier=1.0, temp_modifier=1.0):
    for seg in segments:
        # Apply scenario modifiers
        rain = seg["rainfall"] * rainfall_modifier
        temp = seg["temperature"] * temp_modifier
        
        # Flood Heuristic
        # Low elevation + high rain + water proximity
        flood_score = min(100, max(0, 
            (rain * 2) + 
            (20 - seg["elevation"]) * 1.5 + 
            (500 - seg["water_proximity"]) * 0.05 + 
            (seg["historical_susceptibility"] * 20)
        ))
        
        flood_factors = {
            "Rainfall intensity": round(rain * 2, 1),
            "Low elevation": round((20 - seg["elevation"]) * 1.5, 1),
            "Water proximity": round((500 - seg["water_proximity"]) * 0.05, 1),
            "Historical exposure": round(seg["historical_susceptibility"] * 20, 1)
        }
        
        seg["flood_risk"] = {"score": round(flood_score, 1), "level": get_level(flood_score), "factors": flood_factors}
        
        # Heat Heuristic
        heat_score = min(100, max(0, (temp - 25) * 4 + (seg["humidity"] - 50) * 0.5))
        heat_factors = {
            "Temperature": round((temp - 25) * 4, 1),
            "Humidity": round((seg["humidity"] - 50) * 0.5, 1)
        }
        seg["heat_risk"] = {"score": round(heat_score, 1), "level": get_level(heat_score), "factors": heat_factors}
        
        # Landslide Heuristic
        landslide_score = min(100, max(0, seg["slope"] * 5 + rain * 0.5))
        landslide_factors = {
            "Slope": round(seg["slope"] * 5, 1),
            "Rainfall": round(rain * 0.5, 1)
        }
        seg["landslide_risk"] = {"score": round(landslide_score, 1), "level": get_level(landslide_score), "factors": landslide_factors}
        
        # Overall Risk (weighted)
        overall = (flood_score * 0.6) + (heat_score * 0.3) + (landslide_score * 0.1)
        seg["overall_risk_score"] = round(overall, 1)
        seg["overall_risk_level"] = get_level(overall)
        seg["confidence"] = 82.5
        seg["timestamp"] = "2026-09-03T18:00:00Z"
        
    return segments

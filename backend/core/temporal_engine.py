from datetime import datetime, timedelta

def get_level(score):
    if score < 33: return "LOW"
    if score < 66: return "MODERATE"
    if score < 85: return "HIGH"
    return "CRITICAL"

def calculate_temporal(segments, departure_time_str, scenario="BASELINE"):
    try:
        dt = datetime.strptime(departure_time_str, "%H:%M")
    except:
        dt = datetime.now()
        
    # Find the most critical segment to act as the route's benchmark
    if not segments:
        return []
        
    crit_seg = max(segments, key=lambda s: s["overall_risk_score"])
    base_flood = crit_seg["flood_risk"]["score"]
    base_heat = crit_seg["heat_risk"]["score"]
    base_land = crit_seg["landslide_risk"]["score"]
    
    # We will generate a forecast matrix for T, T+15, T+30, T+45
    forecast = []
    
    # Simulated forecast curve
    curve = [1.0, 1.2, 1.5, 1.1] if scenario == "HEAVY RAIN" else [1.0, 1.0, 1.0, 1.0]
    
    for i in range(4):
        t = dt + timedelta(minutes=15 * i)
        
        f_score = min(100, base_flood * curve[i])
        h_score = min(100, base_heat) # Heat doesn't change much with rain
        l_score = min(100, base_land * curve[i])
        
        overall = (f_score * 0.6) + (h_score * 0.3) + (l_score * 0.1)
        
        forecast.append({
            "time": t.strftime("%H:%M"),
            "flood": {"score": round(f_score,1), "level": get_level(f_score)},
            "heat": {"score": round(h_score,1), "level": get_level(h_score)},
            "landslide": {"score": round(l_score,1), "level": get_level(l_score)},
            "overall": {"score": round(overall,1), "level": get_level(overall)}
        })
        
    return forecast
    
def compare_departures(base_departure_str, scenario="BASELINE"):
    try:
        dt = datetime.strptime(base_departure_str, "%H:%M")
    except:
        dt = datetime.now()
        
    windows = []
    # Evaluate 4 departure windows
    for i in range(4):
        dep = dt + timedelta(minutes=30 * i)
        
        # Simulate that waiting 90 mins clears the rain
        risk = "HIGH"
        if scenario == "HEAVY RAIN":
            if i >= 2: risk = "MODERATE"
            if i >= 3: risk = "LOW"
        else:
            risk = "MODERATE" if i < 2 else "LOW"
            
        windows.append({
            "departure": dep.strftime("%H:%M"),
            "expected_risk": risk
        })
        
    return windows

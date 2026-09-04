"""
backend/ml/propagation_formula.py - Authoritative Directional Propagation Physics Formulae & Factor Attribution
"""
import math
from typing import Dict, Any, Tuple, List

# Centralized Propagation Hyperparameters & Reference Constants
PROPAGATION_WEIGHTS = {
    "alignment": 0.40,      # w1: Angular wind alignment
    "distance": 0.25,       # w2: Distance decay
    "compatibility": 0.25,  # w3: Hazard & terrain compatibility
    "intensity": 0.10       # w4: Environmental event intensity
}

DISTANCE_DECAY_D0_KM = 5.0
TERRAIN_SLOPE_REFERENCE_DEG = 20.0
REFERENCE_MAX_RAINFALL_MM_H = 100.0
REFERENCE_MAX_WIND_KM_H = 80.0
REFERENCE_MAX_TEMP_C = 45.0

def calculate_propagation_bearing(wind_deg: float) -> float:
    """
    Direction hazard travels TOWARD: meteorological wind is direction blown FROM,
    so propagation travels downwind (+180°).
    """
    return (float(wind_deg) + 180.0) % 360.0

def calculate_great_circle_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Standard forward azimuth / initial bearing from (lat1, lon1) to (lat2, lon2)."""
    phi1, lambda1 = math.radians(lat1), math.radians(lon1)
    phi2, lambda2 = math.radians(lat2), math.radians(lon2)
    delta_lambda = lambda2 - lambda1

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - (math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))
    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360.0) % 360.0

def calculate_angular_alignment(bearing_deg: float, propagation_deg: float) -> Tuple[float, float]:
    """
    Returns (angular_diff_deg, alignment_score).
    alignment_score is in [0, 1]: 1.0 = directly downwind, 0.0 = perpendicular/upwind.
    """
    diff = abs(bearing_deg - propagation_deg)
    delta_theta = min(diff, 360.0 - diff)
    alignment_score = max(0.0, math.cos(math.radians(delta_theta)))
    return round(delta_theta, 1), round(alignment_score, 4)

def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometers between two geographic points."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(dlam / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 3)

def calculate_distance_score(dist_km: float, d0_km: float = DISTANCE_DECAY_D0_KM) -> float:
    """Exponential distance decay score in [0, 1]."""
    return round(math.exp(-max(0.0, dist_km) / d0_km), 4)

def calculate_compatibility_score(
    event_type: str,
    hazard_tag: str,
    slope_deg: float = 2.0,
    elevation_m: float = 70.0
) -> float:
    """
    Evaluates physical plausibility of event triggering candidate hotspot,
    actively modulated by terrain slope and elevation.
    """
    ev = event_type.lower()
    tag = hazard_tag.lower()
    if tag == "heavy_rain":
        tag = "heavy_rain"
    elif tag == "heat":
        tag = "heatwave"

    if ev in ["heavy_rain", "flood"]:
        if tag == "landslide":
            # Landslide requires slope: steep terrain (>20°) boosted, flat terrain (<4°) penalized
            slope_factor = min(1.40, max(0.10, slope_deg / TERRAIN_SLOPE_REFERENCE_DEG))
            return round(1.0 * slope_factor, 3)
        elif tag in ["flood", "heavy_rain"]:
            # Flood favored on low slopes / low drainage elevation
            lowland_factor = min(1.30, max(0.10, 1.0 - (slope_deg / 25.0)))
            return round(1.0 * lowland_factor, 3)
        else:
            return 0.05

    elif ev == "landslide":
        if tag == "landslide":
            slope_factor = min(1.40, max(0.20, slope_deg / TERRAIN_SLOPE_REFERENCE_DEG))
            return round(1.0 * slope_factor, 3)
        elif tag in ["flood", "heavy_rain"]:
            # Debris damming downstream watercourse
            return 0.35
        else:
            return 0.05

    elif ev == "heatwave":
        if tag == "heatwave":
            return 1.0
        else:
            return 0.05

    return 0.10

def calculate_intensity_factor(event_type: str, data_points: Dict[str, float]) -> float:
    """Normalized intensity factor in [0, 1]."""
    rain = float(data_points.get("rainfallMmHr", data_points.get("rainfall", 0.0)))
    wind = float(data_points.get("windSpeedKmh", data_points.get("windSpeed", 0.0)))
    temp = float(data_points.get("temperatureC", data_points.get("temperature", 28.0)))

    ev = event_type.lower()
    if ev in ["heavy_rain", "flood"]:
        rain_norm = min(1.0, rain / REFERENCE_MAX_RAINFALL_MM_H)
        wind_norm = min(1.0, wind / REFERENCE_MAX_WIND_KM_H)
        return round((rain_norm * 0.7) + (wind_norm * 0.3), 3)
    elif ev == "landslide":
        rain_norm = min(1.0, rain / REFERENCE_MAX_RAINFALL_MM_H)
        return round(rain_norm, 3)
    elif ev == "heatwave":
        temp_norm = min(1.0, max(0.0, (temp - 25.0) / (REFERENCE_MAX_TEMP_C - 25.0)))
        return round(temp_norm, 3)

    return 0.50

def evaluate_propagation_physics(
    sensor_lat: float,
    sensor_lng: float,
    hotspot_lat: float,
    hotspot_lng: float,
    hazard_tag: str,
    event_type: str,
    wind_deg: float,
    data_points: Dict[str, float],
    slope_deg: float = 2.0,
    elevation_m: float = 70.0
) -> Dict[str, Any]:
    """
    Computes exact physics-informed directional hazard propagation score
    and factor attribution. Used for LOCAL_EDGE/DEGRADED modes and training data generation.
    """
    prop_deg = calculate_propagation_bearing(wind_deg)
    bearing = calculate_great_circle_bearing(sensor_lat, sensor_lng, hotspot_lat, hotspot_lng)
    ang_diff, alignment_score = calculate_angular_alignment(bearing, prop_deg)
    dist_km = calculate_haversine_distance_km(sensor_lat, sensor_lng, hotspot_lat, hotspot_lng)
    distance_score = calculate_distance_score(dist_km)
    compat_score = calculate_compatibility_score(event_type, hazard_tag, slope_deg, elevation_m)
    intensity = calculate_intensity_factor(event_type, data_points)

    w1 = PROPAGATION_WEIGHTS["alignment"]
    w2 = PROPAGATION_WEIGHTS["distance"]
    w3 = PROPAGATION_WEIGHTS["compatibility"]
    w4 = PROPAGATION_WEIGHTS["intensity"]
    total_w = w1 + w2 + w3 + w4

    # Special physical rule for heatwave: heatwaves do not propagate downwind
    if event_type.lower() == "heatwave":
        # Purely local intensity + compatibility
        raw_score = (w3 * compat_score) + ((w1 + w2 + w4) * intensity)
        prob = min(100.0, max(0.0, (raw_score / total_w) * 100.0))
        factors = [
            {"name": "Local Temperature Intensity", "contributionPct": 65},
            {"name": "Hazard Compatibility", "contributionPct": 35}
        ]
        return {
            "probability": round(prob, 1),
            "bearingDeg": round(bearing, 1),
            "distanceKm": dist_km,
            "rawScore": round(raw_score, 3),
            "factors": factors,
            "isDirectional": False
        }

    # Directional hazards: alignment, distance, compatibility, intensity
    part_align = w1 * alignment_score
    part_dist = w2 * distance_score
    part_compat = w3 * compat_score
    part_intens = w4 * intensity

    raw_score = part_align + part_dist + part_compat + part_intens
    prob = min(100.0, max(0.0, (raw_score / total_w) * 100.0))

    # Factor attribution decomposition
    subtotal = max(0.001, raw_score)
    f_align = round((part_align / subtotal) * 100)
    f_compat = round((part_compat / subtotal) * 100)
    f_dist = round((part_dist / subtotal) * 100)
    f_intens = max(0, 100 - (f_align + f_compat + f_dist))

    factors = [
        {"name": "Wind Alignment", "contributionPct": f_align},
        {"name": "Hazard Compatibility & Slope", "contributionPct": f_compat},
        {"name": "Proximity Distance", "contributionPct": f_dist}
    ]
    if f_intens > 10:
        factors.append({"name": "Event Intensity", "contributionPct": f_intens})
    factors.sort(key=lambda x: x["contributionPct"], reverse=True)

    return {
        "probability": round(prob, 1),
        "bearingDeg": round(bearing, 1),
        "distanceKm": dist_km,
        "rawScore": round(raw_score, 3),
        "factors": factors[:3],
        "isDirectional": True
    }

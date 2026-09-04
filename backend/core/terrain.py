"""
backend/core/terrain.py - Topographic Elevation and Slope Resolver for Sadasiva Sankarapuram Region
"""
import math
from typing import Tuple
import urllib.request
import json

# Region Bounding Box constants
REGION_CENTER_LAT = 13.386
REGION_CENTER_LNG = 79.798
WESTERN_RIDGE_LNG = 79.750  # Nagalapuram hill crest approx longitude

def calculate_local_topography(lat: float, lng: float) -> Tuple[float, float]:
    """
    High-fidelity physical approximation of the Nagalapuram terrain:
    - West of 79.798 climbs up into the Nagalapuram / Eastern Ghats hill range (elevations 150m - 600m, slope 15° - 35°).
    - East of 79.798 is low-lying drainage plain toward Araniar river/reservoir (elevations 50m - 75m, slope 0.5° - 3°).
    """
    # Longitudinal distance from ridge crest (degrees)
    # Ridge peaks around 79.750
    dist_to_ridge = abs(lng - WESTERN_RIDGE_LNG)
    
    if lng <= REGION_CENTER_LNG:
        # Western hilly zone
        hill_intensity = max(0.0, 1.0 - (dist_to_ridge / 0.055))
        # Elevation reaches ~520m at crest, base is 75m
        elevation = 75.0 + (445.0 * (hill_intensity ** 1.5))
        # Slope scales with gradient: steep slopes (20° - 35°) on flanks
        slope = 2.0 + (32.0 * math.sin(hill_intensity * math.pi * 0.5))
    else:
        # Eastern lowland / plain
        east_dist = lng - REGION_CENTER_LNG
        elevation = max(45.0, 75.0 - (east_dist * 350.0))
        slope = max(0.5, 2.5 - (east_dist * 20.0))

    # Add slight micro-topography based on latitude variation
    lat_mod = math.sin((lat - REGION_CENTER_LAT) * 100.0) * 8.0
    elevation = max(40.0, round(elevation + lat_mod, 1))
    slope = max(0.5, min(45.0, round(slope + abs(lat_mod) * 0.2, 1)))

    return elevation, slope

def get_terrain_profile(lat: float, lng: float) -> Tuple[float, float]:
    """
    Attempts online elevation lookup with fast fallback to local topographic model.
    Returns (elevation_m, slope_deg).
    """
    # Fast physical model as primary baseline
    base_elev, slope = calculate_local_topography(lat, lng)
    
    # Try quick Open-Elevation query if online (optional enhancement with low timeout)
    try:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat:.5f},{lng:.5f}"
        req = urllib.request.Request(url, headers={"User-Agent": "CRI-TerrainEngine/1.0"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                results = data.get("results", [])
                if results and "elevation" in results[0]:
                    online_elev = float(results[0]["elevation"])
                    if 30.0 <= online_elev <= 1500.0:
                        return online_elev, slope
    except Exception:
        pass

    return base_elev, slope

"""
backend/core/hotspot_store.py - Admin Hazard Hotspots Storage & CRUD Manager
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

class HotspotStore:
    _instance = None

    def __init__(self):
        self.hotspots: Dict[str, Dict[str, Any]] = {}
        self._init_defaults()

    @classmethod
    def get_instance(cls) -> "HotspotStore":
        if cls._instance is None:
            cls._instance = HotspotStore()
        return cls._instance

    def _init_defaults(self):
        defaults = [
            {
                "id": "hotspot_velachery_underpass",
                "name": "Velachery Railway Bridge Underpass",
                "latitude": 12.9780,
                "longitude": 80.2210,
                "hazard": "FLOOD",
                "severity": "HIGH",
                "baselineRiskScore": 75,
                "radius_m": 500,
                "active": True,
                "notes": "Low elevation basin prone to severe waterlogging during monsoon.",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "hotspot_st_thomas_slope",
                "name": "St. Thomas Mount Southern Slope",
                "latitude": 13.0040,
                "longitude": 80.1940,
                "hazard": "LANDSLIDE",
                "severity": "MODERATE",
                "baselineRiskScore": 55,
                "radius_m": 300,
                "active": True,
                "notes": "Steep unreinforced rock slope subject to erosion under high soil moisture.",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "hotspot_central_basin",
                "name": "Central Railway Terminal Coastal Lowland",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "hazard": "STORM",
                "severity": "MODERATE",
                "baselineRiskScore": 60,
                "radius_m": 800,
                "active": True,
                "notes": "Exposed coastal plain prone to sea surge and cyclone winds.",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for hs in defaults:
            self.hotspots[hs["id"]] = hs

    def get_all_hotspots(self) -> List[Dict[str, Any]]:
        return list(self.hotspots.values())

    def get_hotspot(self, hotspot_id: str) -> Optional[Dict[str, Any]]:
        return self.hotspots.get(hotspot_id)

    def create_hotspot(self, data: Dict[str, Any]) -> Dict[str, Any]:
        hotspot_id = data.get("id") or f"hs_{uuid.uuid4().hex[:8]}"
        hotspot = {
            "id": hotspot_id,
            "name": data.get("name", "Custom Hazard Hotspot"),
            "latitude": float(data.get("latitude", 12.9716)),
            "longitude": float(data.get("longitude", 80.2450)),
            "hazard": data.get("hazard", "FLOOD").upper(),
            "severity": data.get("severity", "HIGH").upper(),
            "baselineRiskScore": int(data.get("baselineRiskScore", 70)),
            "radius_m": int(data.get("radius_m", 500)),
            "active": bool(data.get("active", True)),
            "notes": data.get("notes", "Admin created hazard zone"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.hotspots[hotspot_id] = hotspot
        return hotspot

    def update_hotspot(self, hotspot_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if hotspot_id not in self.hotspots:
            return None
        existing = self.hotspots[hotspot_id]
        for k, v in data.items():
            if v is not None and k != "id":
                existing[k] = v
        return existing

    def delete_hotspot(self, hotspot_id: str) -> bool:
        if hotspot_id in self.hotspots:
            del self.hotspots[hotspot_id]
            return True
        return False

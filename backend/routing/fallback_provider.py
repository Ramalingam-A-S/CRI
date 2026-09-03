import json
import os
from routing.base import BaseRoutingProvider
from models.route import NormalizedRoute

class FallbackRoutingProvider(BaseRoutingProvider):
    def __init__(self, data_path: str):
        self.data_path = data_path
        
    def get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:
        try:
            with open(self.data_path, "r") as f:
                routes = json.load(f)
            
            key = f"{origin}_{destination}"
            if key in routes:
                r = routes[key]
                return [NormalizedRoute(
                    route_id="fallback_0",
                    provider="local",
                    status="offline",
                    distance_m=r["distance_m"],
                    duration_s=r["duration_s"],
                    geometry=r["geometry"],
                    bounds={"north": 0, "south": 0, "east": 0, "west": 0}
                )]
            return []
        except Exception:
            return []

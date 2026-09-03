import os
import httpx
import polyline
from routing.base import BaseRoutingProvider
from models.route import NormalizedRoute

class GoogleRoutingProvider(BaseRoutingProvider):
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        
    def get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:
        if not self.api_key:
            return []
        
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": origin,
            "destination": destination,
            "key": self.api_key,
            "alternatives": "true"
        }
        
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, params=params)
                res.raise_for_status()
                data = res.json()
                
                if data.get("status") != "OK" or not data.get("routes"):
                    return []
                    
                routes_list = []
                for i, route in enumerate(data["routes"]):
                    leg = route["legs"][0]
                    distance = leg["distance"]["value"]
                    duration = leg["duration"]["value"]
                    poly = route["overview_polyline"]["points"]
                    
                    # polyline returns (lat, lon), we need [lon, lat]
                    coords = [[c[1], c[0]] for c in polyline.decode(poly)]
                    
                    bounds = route["bounds"]
                    
                    routes_list.append(NormalizedRoute(
                        route_id=f"google_{i}",
                        provider="google",
                        status="live",
                        distance_m=distance,
                        duration_s=duration,
                        geometry=coords,
                        bounds={
                            "north": bounds["northeast"]["lat"],
                            "south": bounds["southwest"]["lat"],
                            "east": bounds["northeast"]["lng"],
                            "west": bounds["southwest"]["lng"]
                        }
                    ))
                return routes_list
        except Exception as e:
            print(f"Google Routing Error: {e}")
            return []

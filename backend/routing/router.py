import os
from dotenv import load_dotenv
from routing.google_provider import GoogleRoutingProvider
from routing.osm_provider import OSMRoutingProvider
from routing.fallback_provider import FallbackRoutingProvider
from models.route import NormalizedRoute

load_dotenv()

class RoutingEngine:
    def __init__(self):
        fallback_path = os.path.join(os.path.dirname(__file__), "..", "data", "fallback", "routes.json")
        self.providers = [
            GoogleRoutingProvider(),
            OSMRoutingProvider(),
            FallbackRoutingProvider(fallback_path)
        ]
        
    def get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:
        for provider in self.providers:
            routes = provider.get_routes(origin, destination)
            if routes:
                return routes
        return []

engine = RoutingEngine()
def get_routes(origin: str, destination: str):
    return engine.get_routes(origin, destination)

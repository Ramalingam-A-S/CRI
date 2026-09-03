import os

# 1. Update models/route.py
route_py_path = r'd:\Aracnids\backend\models\route.py'
with open(route_py_path, 'r') as f:
    route_py = f.read()
if 'route_id: str = ""' not in route_py:
    route_py = route_py.replace('provider: str', 'route_id: str = ""\n    provider: str')
    with open(route_py_path, 'w') as f:
        f.write(route_py)

# 2. Update routing/base.py
base_py_path = r'd:\Aracnids\backend\routing\base.py'
with open(base_py_path, 'r') as f:
    base_py = f.read()
base_py = base_py.replace('get_route(self, origin: str, destination: str) -> Optional[NormalizedRoute]', 'get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]')
with open(base_py_path, 'w') as f:
    f.write(base_py)

# 3. Update routing/router.py
router_py_path = r'd:\Aracnids\backend\routing\router.py'
with open(router_py_path, 'r') as f:
    router_py = f.read()
router_py = router_py.replace('get_route(self, origin: str, destination: str) -> NormalizedRoute | None:', 'get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:')
router_py = router_py.replace('''            route = provider.get_route(origin, destination)
            if route:
                return route
        return None''', '''            routes = provider.get_routes(origin, destination)
            if routes:
                return routes
        return []''')
router_py = router_py.replace('def get_route(origin: str, destination: str):', 'def get_routes(origin: str, destination: str):')
router_py = router_py.replace('return engine.get_route(origin, destination)', 'return engine.get_routes(origin, destination)')
with open(router_py_path, 'w') as f:
    f.write(router_py)

# 4. Update routing/osm_provider.py
osm_py_path = r'd:\Aracnids\backend\routing\osm_provider.py'
with open(osm_py_path, 'r') as f:
    osm_py = f.read()
osm_py = osm_py.replace('get_route(self, origin: str, destination: str) -> NormalizedRoute | None:', 'get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:')
osm_py = osm_py.replace('return None', 'return []')
osm_py = osm_py.replace('route = data["routes"][0]', 'routes_list = []\n            for i, route in enumerate(data["routes"]):')
osm_py = osm_py.replace('''            # Convert geojson [lon, lat] to [lat, lon] for Leaflet
            coords = []
            for pt in route["geometry"]["coordinates"]:
                coords.append([pt[1], pt[0]])
                
            distance = route["distance"]
            duration = route["duration"]
            
            return NormalizedRoute(
                provider="OSRM_PUBLIC",
                status="ok",
                distance_m=distance,
                duration_s=duration,
                geometry=coords,
                bounds={"north": 0, "south": 0, "east": 0, "west": 0}
            )''', '''                # Convert geojson [lon, lat] to [lat, lon] for Leaflet
                coords = []
                for pt in route["geometry"]["coordinates"]:
                    coords.append([pt[1], pt[0]])
                    
                distance = route["distance"]
                duration = route["duration"]
                
                routes_list.append(NormalizedRoute(
                    route_id=f"osm_{i}",
                    provider="OSRM_PUBLIC",
                    status="ok",
                    distance_m=distance,
                    duration_s=duration,
                    geometry=coords,
                    bounds={"north": 0, "south": 0, "east": 0, "west": 0}
                ))
            return routes_list''')
with open(osm_py_path, 'w') as f:
    f.write(osm_py)

# 5. Update routing/google_provider.py
google_py_path = r'd:\Aracnids\backend\routing\google_provider.py'
with open(google_py_path, 'r') as f:
    google_py = f.read()
google_py = google_py.replace('get_route(self, origin: str, destination: str) -> NormalizedRoute | None:', 'get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:')
google_py = google_py.replace('return None', 'return []')
google_py = google_py.replace('"key": self.api_key', '"key": self.api_key,\n            "alternatives": "true"')
google_py = google_py.replace('route = data["routes"][0]', 'routes_list = []\n                for i, route in enumerate(data["routes"]):')
google_py = google_py.replace('''                leg = route["legs"][0]
                distance = leg["distance"]["value"]
                duration = leg["duration"]["value"]
                poly = route["overview_polyline"]["points"]
                
                # polyline returns (lat, lon), we need [lon, lat]
                coords = [[c[1], c[0]] for c in polyline.decode(poly)]
                
                bounds = route["bounds"]
                
                return NormalizedRoute(
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
                )''', '''                    leg = route["legs"][0]
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
                return routes_list''')
with open(google_py_path, 'w') as f:
    f.write(google_py)

print('Updated providers successfully')

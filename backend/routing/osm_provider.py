import requests
from routing.base import BaseRoutingProvider
from models.route import NormalizedRoute

class OSMRoutingProvider(BaseRoutingProvider):
    def get_routes(self, origin: str, destination: str) -> list[NormalizedRoute]:
        try:
            if ',' not in origin or ',' not in destination:
                return []
                
            lat1, lon1 = origin.split(',')
            lat2, lon2 = destination.split(',')
            
            # 1. Fastest Route
            url1 = f"http://router.project-osrm.org/route/v1/driving/{lon1.strip()},{lat1.strip()};{lon2.strip()},{lat2.strip()}?overview=full&geometries=geojson"
            headers = {"User-Agent": "ClimaRoute-Hackathon-MVP/1.0"}
            resp1 = requests.get(url1, headers=headers, timeout=5)
            
            routes_list = []
            if resp1.status_code == 200:
                data1 = resp1.json()
                if data1.get("code") == "Ok" and data1.get("routes"):
                    r = data1["routes"][0]
                    coords = [[pt[1], pt[0]] for pt in r["geometry"]["coordinates"]]
                    routes_list.append(NormalizedRoute(
                        route_id="osm_fastest",
                        provider="OSRM_PUBLIC",
                        status="ok",
                        distance_m=r["distance"],
                        duration_s=r["duration"],
                        geometry=coords,
                        bounds={"north": 0, "south": 0, "east": 0, "west": 0}
                    ))
            
            # 2. Alternative Route (via an offset waypoint)
            # Find a midpoint, offset it to avoid typical low-lying areas in Chennai (which are often coastal/east)
            # Offset it to the West by 0.05 degrees (~5km)
            mid_lat = (float(lat1) + float(lat2)) / 2.0
            mid_lon = (float(lon1) + float(lon2)) / 2.0 - 0.05
            
            url2 = f"http://router.project-osrm.org/route/v1/driving/{lon1.strip()},{lat1.strip()};{mid_lon},{mid_lat};{lon2.strip()},{lat2.strip()}?overview=full&geometries=geojson"
            resp2 = requests.get(url2, headers=headers, timeout=5)
            
            if resp2.status_code == 200:
                data2 = resp2.json()
                if data2.get("code") == "Ok" and data2.get("routes"):
                    r = data2["routes"][0]
                    coords = [[pt[1], pt[0]] for pt in r["geometry"]["coordinates"]]
                    routes_list.append(NormalizedRoute(
                        route_id="osm_alternative",
                        provider="OSRM_PUBLIC",
                        status="ok",
                        distance_m=r["distance"],
                        duration_s=r["duration"],
                        geometry=coords,
                        bounds={"north": 0, "south": 0, "east": 0, "west": 0}
                    ))
            
            return routes_list
        except Exception as e:
            print(f"OSRM Error: {e}")
            return []

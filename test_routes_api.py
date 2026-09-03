import requests
import json

try:
    res = requests.post(
        'http://localhost:8000/api/analyze-route',
        json={
            "origin": "12.8406,80.1534",
            "destination": "12.9941,80.1709",
            "departure_time": "17:30",
            "scenario": "BASELINE"
        },
        timeout=30
    )
    res.raise_for_status()
    data = res.json()
    print("Recommendation:", data.get("recommendation_reason"))
    print("Number of routes:", len(data.get("routes", [])))
    for r in data.get("routes", []):
        print(f"Route {r['route_id']} ({r['type']}): {r['summary']['climate_score']} score, {r['summary']['high_risk_segments']} high risk segs")
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'response') and e.response is not None:
        print("Response:", e.response.text)

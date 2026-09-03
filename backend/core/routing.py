def get_route(origin: str, destination: str):
    # Mocked route (VIT Chennai to Airport approx)
    # Using simple line string
    return {
        "type": "LineString",
        "coordinates": [
            [80.1534, 12.8406], # VIT
            [80.1700, 12.9000],
            [80.1650, 12.9800]  # Airport
        ]
    }

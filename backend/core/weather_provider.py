"""
backend/core/weather_provider.py - WeatherProvider Adapter Pattern (IMD + OpenMeteo Fallback)
"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import urllib.request

logger = logging.getLogger("cri.weather")
logging.basicConfig(level=logging.INFO)

class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch current atmospheric telemetry for given coordinate."""
        pass

class OpenMeteoProvider(WeatherProvider):
    """
    Zero-key, reliable public weather provider using Open-Meteo API.
    Used by default and as fallback when IMD key is unavailable.
    """
    NAME = "Open-Meteo (Free Public Fallback)"

    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat:.4f}&longitude={lon:.4f}"
            "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CRI-WeatherProvider/1.0"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())
                    current = data.get("current", {})
                    return {
                        "temperature": float(current.get("temperature_2m", 28.5)),
                        "humidity": float(current.get("relative_humidity_2m", 62.0)),
                        "rainfall": float(current.get("precipitation", 0.0)),
                        "windSpeed": float(current.get("wind_speed_10m", 14.0)),
                        "windDirection": float(current.get("wind_direction_10m", 215.0)),
                        "pressure": float(current.get("surface_pressure", 1011.0)),
                        "provider": "Open-Meteo",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
        except Exception as e:
            logger.warning(f"Open-Meteo live request failed ({e}), using default regional climate baseline.")

        # Offline fallback for Sadasiva Sankarapuram region
        return {
            "temperature": 29.0,
            "humidity": 65.0,
            "rainfall": 0.0,
            "windSpeed": 12.0,
            "windDirection": 220.0,
            "pressure": 1012.0,
            "provider": "LocalBaseline (Offline)",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class IMDProvider(WeatherProvider):
    """
    India Meteorological Department (IMD) API Adapter.
    Requires IMD_API_KEY environment variable.
    """
    NAME = "IMD (India Meteorological Department)"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fallback = OpenMeteoProvider()

    def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        # IMD official API endpoints require approved credentials and JWT token
        # When granted, endpoint e.g.: https://api.imd.gov.in/v1/nowcast/observations
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "CRI-IMDAdapter/1.0"
        }
        try:
            url = f"https://api.imd.gov.in/v1/weather/current?lat={lat:.4f}&lon={lon:.4f}"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())
                    return {
                        "temperature": float(data.get("temp", 28.0)),
                        "humidity": float(data.get("rh", 60.0)),
                        "rainfall": float(data.get("rain_mm", 0.0)),
                        "windSpeed": float(data.get("wind_spd_kmh", 10.0)),
                        "windDirection": float(data.get("wind_dir_deg", 180.0)),
                        "pressure": float(data.get("mslp_hpa", 1012.0)),
                        "provider": "IMD",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
        except Exception as e:
            logger.warning(f"IMD API endpoint returned: {e}. Falling back to Open-Meteo.")

        return self.fallback.get_current_weather(lat, lon)


def get_active_weather_provider() -> WeatherProvider:
    imd_key = os.environ.get("IMD_API_KEY", "").strip()
    if imd_key:
        logger.info("[WeatherProvider] Active provider: IMDProvider (IMD_API_KEY is configured)")
        return IMDProvider(imd_key)
    else:
        logger.info("[WeatherProvider] IMD_API_KEY not found. Active provider: OpenMeteoProvider (Free public fallback)")
        return OpenMeteoProvider()

# Singleton provider instance
active_weather_provider = get_active_weather_provider()

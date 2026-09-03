"""
backend/core/sensor_store.py - Sensor Network, Telemetry Ingestion & Anomaly Detection
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from enum import Enum
import math
from ml.anomaly_detection import check_sensor_quality, AnomalyDetector

class SensorStatus(str, Enum):
    ONLINE = "ONLINE"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"

class SensorType(str, Enum):
    RAIN = "RAIN"
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"
    WATER_LEVEL = "WATER_LEVEL"
    SOIL_MOISTURE = "SOIL_MOISTURE"
    WIND_SPEED = "WIND_SPEED"
    PRESSURE = "PRESSURE"
    MULTI = "MULTI"

class SensorNode:
    def __init__(
        self,
        sensor_id: str,
        name: str,
        sensor_type: str,
        lat: float,
        lng: float,
        readings: Dict[str, float],
        unit: str = "",
        is_simulated: bool = True
    ):
        self.sensor_id = sensor_id
        self.name = name
        self.sensor_type = sensor_type
        self.latitude = lat
        self.longitude = lng
        self.readings = readings
        self.unit = unit
        self.is_simulated = is_simulated
        self.last_updated = datetime.now(timezone.utc).isoformat()
        self.status = SensorStatus.ONLINE.value
        self.quality_score = 1.0
        self.anomalies: List[Dict[str, Any]] = []
        self.evaluate_health()

    def update_readings(self, new_readings: Dict[str, float]):
        self.readings.update(new_readings)
        self.last_updated = datetime.now(timezone.utc).isoformat()
        self.evaluate_health()

    def evaluate_health(self):
        quality = check_sensor_quality(self.sensor_id, self.readings)
        self.quality_score = quality["qualityScore"]
        self.anomalies = quality["anomalies"]
        if any(a["severity"] == "CRITICAL" for a in self.anomalies):
            self.status = SensorStatus.DEGRADED.value
        else:
            self.status = SensorStatus.ONLINE.value

    def to_dict(self) -> Dict[str, Any]:
        primary_val = list(self.readings.values())[0] if self.readings else 0.0
        return {
            "sensorId": self.sensor_id,
            "name": self.name,
            "type": self.sensor_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "value": round(primary_val, 2),
            "unit": self.unit,
            "readings": self.readings,
            "timestamp": self.last_updated,
            "status": self.status,
            "health": "ANOMALOUS" if self.anomalies else "HEALTHY",
            "anomaly": "ANOMALOUS" if self.anomalies else "NORMAL",
            "qualityScore": self.quality_score,
            "anomalies": self.anomalies,
            "isSimulated": self.is_simulated
        }

class SensorStore:
    _instance = None

    def __init__(self):
        self.sensors: Dict[str, SensorNode] = {}
        self._init_default_sensors()

    @classmethod
    def get_instance(cls) -> "SensorStore":
        if cls._instance is None:
            cls._instance = SensorStore()
        return cls._instance

    def _init_default_sensors(self):
        defaults = [
            {
                "sensor_id": "sns_velachery_01",
                "name": "Velachery River Water Level Sensor",
                "sensor_type": SensorType.WATER_LEVEL.value,
                "lat": 12.9780,
                "lng": 80.2210,
                "readings": {"water_level_m": 0.4, "rainfall": 0.0, "humidity": 60.0},
                "unit": "m"
            },
            {
                "sensor_id": "sns_airport_02",
                "name": "Chennai Airport Weather Station",
                "sensor_type": SensorType.MULTI.value,
                "lat": 12.9941,
                "lng": 80.1709,
                "readings": {"temperature": 28.0, "humidity": 60.0, "rainfall": 0.0, "windSpeed": 12.0, "pressure": 1012.0},
                "unit": "°C"
            },
            {
                "sensor_id": "sns_vit_03",
                "name": "VIT Chennai Campus Environmental Node",
                "sensor_type": SensorType.MULTI.value,
                "lat": 12.8406,
                "lng": 80.1534,
                "readings": {"temperature": 29.0, "humidity": 55.0, "rainfall": 0.0, "soil_moisture": 0.35, "windSpeed": 10.0},
                "unit": "°C"
            },
            {
                "sensor_id": "sns_marina_04",
                "name": "Marina Coastal Storm Pressure Sensor",
                "sensor_type": SensorType.PRESSURE.value,
                "lat": 13.0475,
                "lng": 80.2824,
                "readings": {"pressure": 1012.0, "windSpeed": 15.0, "humidity": 65.0, "rainfall": 0.0},
                "unit": "hPa"
            },
            {
                "sensor_id": "sns_stthomas_05",
                "name": "St. Thomas Mount Slope Stability Sensor",
                "sensor_type": SensorType.SOIL_MOISTURE.value,
                "lat": 13.0040,
                "lng": 80.1940,
                "readings": {"soil_moisture": 0.30, "slope": 22.0, "rainfall": 0.0},
                "unit": "ratio"
            }
        ]

        for d in defaults:
            node = SensorNode(**d, is_simulated=True)
            node.evaluate_health()
            self.sensors[node.sensor_id] = node

    def get_all_sensors(self) -> List[Dict[str, Any]]:
        return [node.to_dict() for node in self.sensors.values()]

    def get_sensor(self, sensor_id: str) -> Optional[Dict[str, Any]]:
        if sensor_id in self.sensors:
            return self.sensors[sensor_id].to_dict()
        return None

    def ingest_reading(self, sensor_id: str, readings: Dict[str, float]) -> Dict[str, Any]:
        if sensor_id not in self.sensors:
            # Create dynamic sensor node
            node = SensorNode(
                sensor_id=sensor_id,
                name=f"Sensor {sensor_id}",
                sensor_type=SensorType.MULTI.value,
                lat=12.9716,
                lng=80.2450,
                readings=readings,
                unit="",
                is_simulated=True
            )
            self.sensors[sensor_id] = node
        else:
            node = self.sensors[sensor_id]
            node.update_readings(readings)

        return node.to_dict()

    def get_aggregate_environmental_state(self) -> Dict[str, float]:
        """Aggregate readings across online sensors."""
        valid_nodes = [n for n in self.sensors.values() if n.status != SensorStatus.OFFLINE.value]
        if not valid_nodes:
            return {"temperature": 28.0, "humidity": 65.0, "rainfall": 0.0, "windSpeed": 10.0, "pressure": 1012.0, "soil_moisture": 0.4}

        temps = [n.readings["temperature"] for n in valid_nodes if "temperature" in n.readings]
        hums = [n.readings["humidity"] for n in valid_nodes if "humidity" in n.readings]
        rains = [n.readings["rainfall"] for n in valid_nodes if "rainfall" in n.readings]
        winds = [n.readings["windSpeed"] for n in valid_nodes if "windSpeed" in n.readings]
        press = [n.readings["pressure"] for n in valid_nodes if "pressure" in n.readings]
        soils = [n.readings["soil_moisture"] for n in valid_nodes if "soil_moisture" in n.readings]

        return {
            "temperature": float(sum(temps)/len(temps)) if temps else 28.0,
            "humidity": float(sum(hums)/len(hums)) if hums else 65.0,
            "rainfall": float(sum(rains)/len(rains)) if rains else 0.0,
            "windSpeed": float(sum(winds)/len(winds)) if winds else 10.0,
            "pressure": float(sum(press)/len(press)) if press else 1012.0,
            "soil_moisture": float(sum(soils)/len(soils)) if soils else 0.4
        }

    def calculate_average_quality(self) -> float:
        if not self.sensors:
            return 1.0
        scores = [n.quality_score for n in self.sensors.values()]
        return round(sum(scores) / len(scores), 2)

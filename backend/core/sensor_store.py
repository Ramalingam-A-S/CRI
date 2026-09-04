"""
backend/core/sensor_store.py - SQLite-Backed Dynamic Sensor Network & Telemetry Ingestion
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import json
import uuid
from core.db import get_db_connection
from ml.anomaly_detection import check_sensor_quality

class SensorStore:
    _instance = None

    def __init__(self):
        # Empty initialization - zero pre-seeded records
        pass

    @classmethod
    def get_instance(cls) -> "SensorStore":
        if cls._instance is None:
            cls._instance = SensorStore()
        return cls._instance

    @property
    def sensors(self) -> Dict[str, Any]:
        return {s["id"]: s for s in self.get_all_sensors()}


    def _row_to_dict(self, row) -> Dict[str, Any]:
        readings = json.loads(row["readings"]) if isinstance(row["readings"], str) else row["readings"]
        anomalies = json.loads(row["anomalies"]) if isinstance(row["anomalies"], str) else row["anomalies"]
        
        primary_val = list(readings.values())[0] if readings else 0.0
        
        return {
            "sensorId": row["id"],
            "id": row["id"],
            "name": row["name"],
            "latitude": float(row["lat"]),
            "longitude": float(row["lng"]),
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "coordinates": [float(row["lat"]), float(row["lng"])],
            "value": round(float(primary_val), 2),
            "unit": row["unit"] or "°C",
            "readings": readings,
            "timestamp": row["created_at"],
            "status": row["status"],
            "health": "ANOMALOUS" if anomalies else "HEALTHY",
            "anomaly": "ANOMALOUS" if anomalies else "NORMAL",
            "qualityScore": float(row["quality_score"]),
            "anomalies": anomalies,
            "isSimulated": False,
            "primaryHazard": "FLOOD"
        }

    def get_all_sensors(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM sensors ORDER BY created_at DESC").fetchall()
        conn.close()
        return [self._row_to_dict(r) for r in rows]

    def get_sensor(self, sensor_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM sensors WHERE id = ?", (sensor_id,)).fetchone()
        conn.close()
        if not row:
            return None
        return self._row_to_dict(row)

    def create_sensor(self, data: Dict[str, Any]) -> Dict[str, Any]:
        s_id = data.get("id") or data.get("sensor_id") or f"sns_{uuid.uuid4().hex[:8]}"
        name = data.get("name", "Field Telemetry Sensor")
        lat = float(data.get("lat") if "lat" in data else data.get("latitude", 13.386))
        lng = float(data.get("lng") if "lng" in data else data.get("longitude", 79.798))

        readings = data.get("readings") or {
            "temperature": 28.0,
            "humidity": 65.0,
            "rainfall": 0.0,
            "windSpeed": 12.0,
            "pressure": 1012.0
        }
        unit = data.get("unit") or "°C"
        created_at = datetime.now(timezone.utc).isoformat()


        # Run anomaly / quality check
        quality = check_sensor_quality(s_id, readings)
        quality_score = quality["qualityScore"]
        anomalies = quality["anomalies"]
        status = "DEGRADED" if any(a.get("severity") == "CRITICAL" for a in anomalies) else "ONLINE"

        conn = get_db_connection()
        conn.execute("""
            INSERT INTO sensors (id, name, lat, lng, readings, unit, status, quality_score, anomalies, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (s_id, name, lat, lng, json.dumps(readings), unit, status, quality_score, json.dumps(anomalies), created_at))
        conn.commit()
        conn.close()

        return self.get_sensor(s_id)

    def update_sensor(self, sensor_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        current = self.get_sensor(sensor_id)
        if not current:
            return None

        name = data.get("name", current["name"])
        lat = float(data.get("lat") if "lat" in data else data.get("latitude", current["lat"]))
        lng = float(data.get("lng") if "lng" in data else data.get("longitude", current["lng"]))
        readings = data.get("readings", current["readings"])
        unit = data.get("unit", current["unit"])

        quality = check_sensor_quality(sensor_id, readings)
        quality_score = quality["qualityScore"]
        anomalies = quality["anomalies"]
        status = "DEGRADED" if any(a.get("severity") == "CRITICAL" for a in anomalies) else "ONLINE"

        conn = get_db_connection()
        conn.execute("""
            UPDATE sensors
            SET name = ?, lat = ?, lng = ?, readings = ?, unit = ?, status = ?, quality_score = ?, anomalies = ?
            WHERE id = ?
        """, (name, lat, lng, json.dumps(readings), unit, status, quality_score, json.dumps(anomalies), sensor_id))
        conn.commit()
        conn.close()

        return self.get_sensor(sensor_id)

    def delete_sensor(self, sensor_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.execute("DELETE FROM sensors WHERE id = ?", (sensor_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted

    def ingest_reading(self, sensor_id: str, new_readings: Dict[str, float]) -> Dict[str, Any]:
        current = self.get_sensor(sensor_id)
        if not current:
            # Create on the fly if not existing yet (helpful for ingest tests)
            current = self.create_sensor({"id": sensor_id, "name": f"Sensor {sensor_id}", "readings": new_readings})
            return current

        merged_readings = dict(current["readings"])
        merged_readings.update(new_readings)

        quality = check_sensor_quality(sensor_id, merged_readings)
        quality_score = quality["qualityScore"]
        anomalies = quality["anomalies"]
        status = "DEGRADED" if any(a.get("severity") == "CRITICAL" for a in anomalies) else "ONLINE"

        conn = get_db_connection()
        conn.execute("""
            UPDATE sensors
            SET readings = ?, status = ?, quality_score = ?, anomalies = ?
            WHERE id = ?
        """, (json.dumps(merged_readings), status, quality_score, json.dumps(anomalies), sensor_id))
        conn.commit()
        conn.close()

        return self.get_sensor(sensor_id)

    def get_aggregate_environmental_state(self) -> Dict[str, float]:
        sensors = self.get_all_sensors()
        if not sensors:
            return {
                "temperature": 28.0,
                "humidity": 65.0,
                "rainfall": 0.0,
                "windSpeed": 10.0,
                "pressure": 1012.0
            }

        keys = ["temperature", "humidity", "rainfall", "windSpeed", "pressure", "water_level_m", "soil_moisture"]
        aggregates: Dict[str, float] = {}
        for k in keys:
            vals = [s["readings"][k] for s in sensors if k in s.get("readings", {})]
            if vals:
                aggregates[k] = round(sum(vals) / len(vals), 2)
            else:
                defaults = {"temperature": 28.0, "humidity": 65.0, "rainfall": 0.0, "windSpeed": 10.0, "pressure": 1012.0}
                if k in defaults:
                    aggregates[k] = defaults[k]

        return aggregates

    def calculate_average_quality(self) -> float:
        sensors = self.get_all_sensors()
        if not sensors:
            return 1.0
        scores = [s.get("qualityScore", 1.0) for s in sensors]
        return round(sum(scores) / len(scores), 2)

    def clear_all(self):
        """Helper for test suites to reset state."""
        conn = get_db_connection()
        conn.execute("DELETE FROM sensors")
        conn.commit()
        conn.close()

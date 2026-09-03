from typing import Dict, Any, List

class AnomalyDetector:
    def __init__(self):
        # Basic physical limits for sensors
        self.limits = {
            "temperature": {"min": -50.0, "max": 60.0},
            "humidity": {"min": 0.0, "max": 100.0},
            "rainfall": {"min": 0.0, "max": 500.0},
            "windSpeed": {"min": 0.0, "max": 300.0},
            "pressure": {"min": 850.0, "max": 1080.0},
        }

    def detect_anomalies(self, sensor_id: str, readings: Dict[str, float]) -> List[Dict[str, Any]]:
        anomalies = []
        for feature, value in readings.items():
            if feature in self.limits and value is not None:
                if value < self.limits[feature]["min"] or value > self.limits[feature]["max"]:
                    anomalies.append({
                        "sensorId": sensor_id,
                        "feature": feature,
                        "anomaly": True,
                        "type": "PHYSICAL_LIMIT_EXCEEDED",
                        "severity": "CRITICAL",
                        "message": f"Value {value} out of bounds for {feature}"
                    })
                # We could add rolling stats / z-score here if we had history state,
                # but for now physical limits satisfy the baseline requirement.
        return anomalies

    def calculate_sensor_quality(self, anomalies: List[Dict[str, Any]], missing_features: int, total_expected: int) -> float:
        quality = 1.0
        
        # Penalize for missing data
        if total_expected > 0:
            missing_ratio = missing_features / total_expected
            quality -= (missing_ratio * 0.5)  # Max 50% penalty for missing data
            
        # Penalize for critical anomalies
        for anomaly in anomalies:
            if anomaly["severity"] == "CRITICAL":
                quality -= 0.2
            elif anomaly["severity"] == "MEDIUM":
                quality -= 0.1
                
        return max(0.1, min(1.0, quality)) # Never drop below 0.1 to maintain at least some confidence scale

# Global singleton
_detector = AnomalyDetector()

def check_sensor_quality(sensor_id: str, readings: Dict[str, float]) -> Dict[str, Any]:
    expected_features = 5 # temp, humidity, rainfall, windSpeed, pressure
    missing = expected_features - len([k for k in readings.keys() if k in _detector.limits])
    
    anomalies = _detector.detect_anomalies(sensor_id, readings)
    quality = _detector.calculate_sensor_quality(anomalies, missing, expected_features)
    
    return {
        "sensorId": sensor_id,
        "qualityScore": round(quality, 2),
        "anomalies": anomalies
    }

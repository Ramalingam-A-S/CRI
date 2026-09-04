"""
backend/core/alert_engine.py - Alert Generation & Incident Command Tracking
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

class AlertEngine:
    _instance = None

    def __init__(self):
        self.alerts: Dict[str, Dict[str, Any]] = {}
        self._init_defaults()

    @classmethod
    def get_instance(cls) -> "AlertEngine":
        if cls._instance is None:
            cls._instance = AlertEngine()
        return cls._instance

    def _init_defaults(self):
        initial = {
            "id": "alt_baseline_01",
            "hazard": "FLOOD",
            "severity": "MODERATE",
            "riskScore": 62.0,
            "confidence": 0.50,
            "location": {
                "name": "Sadasiva Sankarapuram Drainage Basin",
                "latitude": 13.3860,
                "longitude": 79.7980
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": "Elevated rainfall accumulation in drainage channel.",
            "mode": "CLOUD",
            "status": "ACTIVE"
        }
        self.alerts[initial["id"]] = initial

    def get_all_alerts(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        alerts = list(self.alerts.values())
        if status_filter:
            alerts = [a for a in alerts if a.get("status") == status_filter.upper()]
        # Sort by timestamp descending
        alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return alerts

    def trigger_alert(
        self,
        hazard: str,
        severity: str,
        risk_score: float,
        confidence: float,
        location_name: str,
        lat: float,
        lng: float,
        reason: str,
        mode: str = "CLOUD"
    ) -> Dict[str, Any]:
        alert_id = f"alt_{uuid.uuid4().hex[:8]}"
        alert = {
            "id": alert_id,
            "hazard": hazard.upper(),
            "severity": severity.upper(),
            "riskScore": round(float(risk_score), 1),
            "confidence": round(float(confidence), 2),
            "location": {
                "name": location_name,
                "latitude": float(lat),
                "longitude": float(lng)
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "mode": mode,
            "status": "ACTIVE"
        }
        self.alerts[alert_id] = alert
        return alert

    def acknowledge_alert(self, alert_id: str) -> Optional[Dict[str, Any]]:
        if alert_id in self.alerts:
            self.alerts[alert_id]["status"] = "ACKNOWLEDGED"
            return self.alerts[alert_id]
        return None

    def clear_simulation_alerts(self):
        """Reset alerts to baseline."""
        self.alerts = {}
        self._init_defaults()

"""
backend/core/incident_command.py - Incident Command, Shelters & Infrastructure Manager
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

class IncidentCommand:
    _instance = None

    def __init__(self):
        self.incidents: Dict[str, Dict[str, Any]] = {}
        self.shelters: Dict[str, Dict[str, Any]] = {}
        self.infrastructure: Dict[str, Dict[str, Any]] = {}
        self._init_defaults()

    @classmethod
    def get_instance(cls) -> "IncidentCommand":
        if cls._instance is None:
            cls._instance = IncidentCommand()
        return cls._instance

    def _init_defaults(self):
        # Default Shelters
        shelters_list = [
            {
                "id": "shl_velachery_community",
                "name": "Velachery Community Disaster Relief Shelter",
                "latitude": 12.9720,
                "longitude": 80.2180,
                "capacity": 800,
                "currentOccupancy": 120,
                "status": "OPEN",
                "suppliesStatus": "ADEQUATE",
                "contactNumber": "+91-44-2244-9900"
            },
            {
                "id": "shl_guindy_stadium",
                "name": "Guindy Indoor Emergency Center",
                "latitude": 13.0067,
                "longitude": 80.2020,
                "capacity": 1500,
                "currentOccupancy": 340,
                "status": "OPEN",
                "suppliesStatus": "HIGH",
                "contactNumber": "+91-44-2244-8811"
            }
        ]
        for s in shelters_list:
            self.shelters[s["id"]] = s

        # Default Infrastructure Nodes
        infra_list = [
            {
                "id": "inf_velachery_substation",
                "name": "Velachery 230kV Power Substation",
                "type": "POWER",
                "latitude": 12.9750,
                "longitude": 80.2240,
                "status": "OPERATIONAL",
                "criticalLevel": "HIGH",
                "hazardExposure": "FLOOD"
            },
            {
                "id": "inf_chennai_general_hospital",
                "name": "District General Hospital",
                "type": "MEDICAL",
                "latitude": 12.9810,
                "longitude": 80.2190,
                "status": "OPERATIONAL",
                "criticalLevel": "CRITICAL",
                "hazardExposure": "MULTI"
            }
        ]
        for inf in infra_list:
            self.infrastructure[inf["id"]] = inf

        # Default Active Incidents
        inc_list = [
            {
                "id": "inc_waterlogging_01",
                "title": "Severe Waterlogging on 100ft Bypass Road",
                "hazard": "FLOOD",
                "severity": "HIGH",
                "latitude": 12.9770,
                "longitude": 80.2220,
                "reporter": "Citizen Report #441",
                "status": "IN_PROGRESS",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "description": "Submerged road section (water level approx 2.5 ft). Vehicles stalled."
            }
        ]
        for inc in inc_list:
            self.incidents[inc["id"]] = inc

    def get_all_shelters(self) -> List[Dict[str, Any]]:
        return list(self.shelters.values())

    def get_all_infrastructure(self) -> List[Dict[str, Any]]:
        return list(self.infrastructure.values())

    def get_all_incidents(self) -> List[Dict[str, Any]]:
        return list(self.incidents.values())

    def create_incident(self, data: Dict[str, Any]) -> Dict[str, Any]:
        inc_id = data.get("id") or f"inc_{uuid.uuid4().hex[:8]}"
        incident = {
            "id": inc_id,
            "title": data.get("title", "Citizen Reported Hazard Incident"),
            "hazard": data.get("hazard", "FLOOD").upper(),
            "severity": data.get("severity", "MODERATE").upper(),
            "latitude": float(data.get("latitude", 12.9716)),
            "longitude": float(data.get("longitude", 80.2450)),
            "reporter": data.get("reporter", "Citizen Report"),
            "status": "NEW",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "description": data.get("description", "No details provided.")
        }
        self.incidents[inc_id] = incident
        return incident

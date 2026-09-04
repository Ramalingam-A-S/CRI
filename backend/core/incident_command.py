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
                "id": "shl_nagalapuram_community",
                "name": "Nagalapuram Community Disaster Relief Shelter",
                "latitude": 13.3850,
                "longitude": 79.7990,
                "capacity": 800,
                "currentOccupancy": 120,
                "status": "OPEN",
                "suppliesStatus": "ADEQUATE",
                "contactNumber": "+91-877-2244-9900"
            },
            {
                "id": "shl_sankarapuram_school",
                "name": "Sankarapuram Emergency High School Center",
                "latitude": 13.3880,
                "longitude": 79.7960,
                "capacity": 1500,
                "currentOccupancy": 340,
                "status": "OPEN",
                "suppliesStatus": "HIGH",
                "contactNumber": "+91-877-2244-8811"
            },
            {
                "id": "shl_ridge_view_community",
                "name": "West Foothills Community Hall",
                "latitude": 13.3820,
                "longitude": 79.7750,
                "capacity": 500,
                "currentOccupancy": 80,
                "status": "OPEN",
                "suppliesStatus": "ADEQUATE",
                "contactNumber": "+91-877-2244-7722"
            }
        ]
        for s in shelters_list:
            self.shelters[s["id"]] = s

        # Default Infrastructure Nodes
        infra_list = [
            {
                "id": "inf_sankarapuram_substation",
                "name": "Sankarapuram 33kV Power Substation",
                "type": "POWER",
                "latitude": 13.3840,
                "longitude": 79.7970,
                "status": "OPERATIONAL",
                "criticalLevel": "HIGH",
                "hazardExposure": "FLOOD"
            },
            {
                "id": "inf_nagalapuram_phc",
                "name": "Nagalapuram Primary Health Centre",
                "type": "MEDICAL",
                "latitude": 13.3870,
                "longitude": 79.8010,
                "status": "OPERATIONAL",
                "criticalLevel": "CRITICAL",
                "hazardExposure": "MULTI"
            },
            {
                "id": "inf_floodway_pumping",
                "name": "East Sankarapuram Drainage Pumping Station",
                "type": "PUMPING",
                "latitude": 13.3835,
                "longitude": 79.8150,
                "status": "OPERATIONAL",
                "criticalLevel": "HIGH",
                "hazardExposure": "FLOOD"
            },
            {
                "id": "inf_telecom_tower_01",
                "name": "Nagalapuram Emergency Telecom Repeater Mast",
                "type": "COMMUNICATION",
                "latitude": 13.3910,
                "longitude": 79.7920,
                "status": "OPERATIONAL",
                "criticalLevel": "MODERATE",
                "hazardExposure": "STORM"
            }
        ]
        for inf in infra_list:
            self.infrastructure[inf["id"]] = inf

        # Default Active Incidents
        inc_list = [
            {
                "id": "inc_waterlogging_01",
                "title": "Severe Waterlogging on Nagalapuram Lowland Pass",
                "hazard": "FLOOD",
                "severity": "HIGH",
                "latitude": 13.3875,
                "longitude": 79.7995,
                "reporter": "Citizen Report #441",
                "status": "IN_PROGRESS",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "description": "Submerged road section (water level approx 2.5 ft) near drainage canal. Vehicles diverted."
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
            "latitude": float(data.get("latitude", 13.3860)),
            "longitude": float(data.get("longitude", 79.7980)),
            "reporter": data.get("reporter", "Citizen Report"),
            "status": "NEW",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "description": data.get("description", "No details provided.")
        }
        self.incidents[inc_id] = incident
        return incident

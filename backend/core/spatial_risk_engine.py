"""
backend/core/spatial_risk_engine.py - Authoritative Spatial Risk Fusion Engine
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import copy
from ml.hazard_models import (
    predict_flood,
    predict_heat,
    predict_landslide,
    predict_storm,
    risk_fusion,
    OperatingMode,
    get_risk_level,
    RiskLevel
)
from core.sensor_store import SensorStore
from core.hotspot_store import HotspotStore
from core.alert_engine import AlertEngine
from core.weather_predictor import WeatherPredictor
from core.terrain import get_terrain_profile

class SpatialRiskEngine:
    _instance = None

    def __init__(self):
        self.sensor_store = SensorStore.get_instance()
        self.hotspot_store = HotspotStore.get_instance()
        self.alert_engine = AlertEngine.get_instance()
        self.weather_predictor = WeatherPredictor.get_instance()
        
        self.current_operating_mode = OperatingMode.CLOUD.value
        self.last_valid_assessment: Optional[Dict[str, Any]] = None
        self.simulation_overrides: Dict[str, float] = {}

    @classmethod
    def get_instance(cls) -> "SpatialRiskEngine":
        if cls._instance is None:
            cls._instance = SpatialRiskEngine()
        return cls._instance

    def set_operating_mode(self, mode: str) -> str:
        valid_modes = [m.value for m in OperatingMode]
        if mode.upper() in valid_modes:
            self.current_operating_mode = mode.upper()
        return self.current_operating_mode

    def set_simulation_overrides(self, overrides: Dict[str, float]):
        self.simulation_overrides = overrides

    def reset_simulation(self):
        self.simulation_overrides = {}
        self.alert_engine.clear_simulation_alerts()

    def evaluate_risk(self, mode: Optional[str] = None) -> Dict[str, Any]:
        op_str = (mode or self.current_operating_mode).upper()
        
        try:
            op_mode = OperatingMode(op_str)
        except ValueError:
            op_mode = OperatingMode.CLOUD

        # --- NO_DATA OPERATING MODE ---
        if op_mode == OperatingMode.NO_DATA:
            if self.last_valid_assessment:
                cached = copy.deepcopy(self.last_valid_assessment)
                cached["mode"] = OperatingMode.NO_DATA.value
                cached["status"] = "NO_DATA"
                cached["message"] = "Showing last known assessment. System operating without active telemetry feed."
                cached["confidence"] = 0.0
                return cached
            else:
                return {
                    "mode": OperatingMode.NO_DATA.value,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "hazard": "NONE",
                    "severity": RiskLevel.LOW.value,
                    "riskScore": 0.0,
                    "confidence": 0.0,
                    "currentAreas": [],
                    "predictedAreas": [],
                    "contributingFactors": [],
                    "explanationAvailable": False,
                    "modelVersion": "v1.0-synthetic",
                    "status": "NO_DATA",
                    "message": "No telemetry or historical assessment available."
                }

        # --- GATHER ENVIRONMENTAL DATA ---
        env_state = self.sensor_store.get_aggregate_environmental_state()
        
        # Apply simulation overrides if present
        if self.simulation_overrides:
            for k, v in self.simulation_overrides.items():
                if v is not None:
                    env_state[k] = float(v)

        # Predict ML weather if model is available
        ml_weather = self.weather_predictor.predict(features=env_state)
        combined_weather = {
            "temperature": env_state.get("temperature", ml_weather.get("temperature", 28.0)),
            "humidity": env_state.get("humidity", ml_weather.get("humidity", 65.0)),
            "rainfall": env_state.get("rainfall", ml_weather.get("rainfall", 0.0)),
            "windSpeed": env_state.get("windSpeed", 10.0),
            "pressure": env_state.get("pressure", 1012.0)
        }

        # Representative geospatial feature profile for local risk center (Sadasiva Sankarapuram)
        elev, slope = get_terrain_profile(13.386, 79.798)
        geo_features = {
            "elevation": elev,
            "slope": slope,
            "water_proximity": 1200.0,
            "historical_susceptibility": 0.25
        }

        # --- RUN HAZARD MODELS ---
        flood_res = predict_flood(combined_weather, geo_features, op_mode)
        heat_res = predict_heat(combined_weather, geo_features, op_mode)
        landslide_res = predict_landslide(combined_weather, geo_features, op_mode)
        storm_res = predict_storm(combined_weather, geo_features, op_mode)

        hazard_results = {
            "FLOOD": flood_res,
            "HEAT": heat_res,
            "LANDSLIDE": landslide_res,
            "STORM": storm_res
        }

        # Determine dominant hazard
        dominant_hazard, top_res = max(hazard_results.items(), key=lambda item: item[1]["riskScore"])
        
        # Check active admin hotspots for baseline boost
        hotspots = self.hotspot_store.get_all_hotspots()
        hotspot_boost = 0.0
        for hs in hotspots:
            if hs.get("active") and hs.get("hazard") == dominant_hazard:
                hotspot_boost += (hs.get("baselineRiskScore", 50) * 0.15)
        hotspot_boost = min(25.0, hotspot_boost)

        # Compute sensor quality multiplier
        sensor_quality = self.sensor_store.calculate_average_quality()
        if op_mode == OperatingMode.DEGRADED:
            sensor_quality *= 0.50

        # Run Risk Fusion
        fusion = risk_fusion(hazard_results, sensor_quality=sensor_quality)
        
        raw_fusion_score = max(top_res["riskScore"], fusion["overallScore"]) + hotspot_boost
        final_risk_score = min(100.0, max(0.0, raw_fusion_score))
        final_severity = get_risk_level(final_risk_score)
        final_confidence = fusion["overallConfidence"]

        # --- SPATIAL ZONES: CURRENT VS PREDICTED AREAS FOR ALL EVALUATED HAZARDS ---
        current_areas = self._build_current_affected_areas(hazard_results, dominant_hazard, final_confidence, combined_weather)
        predicted_areas = self._build_predicted_affected_areas(hazard_results, dominant_hazard, final_confidence, combined_weather)

        # Format contributing factors
        factors = []
        for k, v in top_res.get("factors", {}).items():
            factors.append({
                "name": k,
                "weight": 0.5,
                "currentValue": v,
                "contribution": 50,
                "source": "ML Hazard Model Factor Extract"
            })

        explanation_available = (op_mode == OperatingMode.CLOUD and len(factors) > 0)

        assessment = {
            "mode": op_mode.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hazard": dominant_hazard,
            "severity": final_severity,
            "riskScore": round(final_risk_score, 1),
            "confidence": round(final_confidence, 2),
            "currentAreas": current_areas,
            "predictedAreas": predicted_areas,
            "contributingFactors": factors,
            "explanationAvailable": explanation_available,
            "modelVersion": "v1.0-synthetic-prototype",
            "inferenceTimestamp": datetime.now(timezone.utc).isoformat(),
            "hazardBreakdown": {
                "flood": flood_res,
                "heat": heat_res,
                "landslide": landslide_res,
                "storm": storm_res
            },
            "sensorQuality": sensor_quality
        }

        # Save as last valid assessment for NO_DATA fallback
        self.last_valid_assessment = assessment

        # --- TRIGGER ALERT IF HIGH / CRITICAL THRESHOLD CROSSED ---
        if final_severity in ["HIGH", "CRITICAL"]:
            self.alert_engine.trigger_alert(
                hazard=dominant_hazard,
                severity=final_severity,
                risk_score=final_risk_score,
                confidence=final_confidence,
                location_name=current_areas[0]["name"] if current_areas else "Sadasiva Sankarapuram Command Sector",
                lat=current_areas[0]["center"][0] if current_areas else 13.3860,
                lng=current_areas[0]["center"][1] if current_areas else 79.7980,
                reason=f"Elevated {dominant_hazard} risk score ({final_risk_score:.1f}) in {final_severity} severity bracket under {op_mode.value} mode.",
                mode=op_mode.value
            )

        return assessment

    def _build_current_affected_areas(
        self,
        hazard_results: Dict[str, Any],
        dominant_hazard: str,
        overall_confidence: float,
        weather: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        hotspots = self.hotspot_store.get_all_hotspots()
        if not hotspots:
            return []

        areas = []
        for hs in hotspots:
            haz_key = hs.get("hazard", "FLOOD").upper()
            if haz_key == "HEATWAVE":
                haz_key = "HEAT"
            elif haz_key == "HEAVY_RAIN":
                haz_key = "STORM"
            
            res = hazard_results.get(haz_key, hazard_results.get("FLOOD", {}))
            score = res.get("riskScore", 50.0)
            sev = res.get("severity", get_risk_level(score))
            conf = res.get("confidence", overall_confidence)
            
            geom = hs.get("geometry", {})
            coords = geom.get("coordinates", [[]]) if isinstance(geom, dict) else [[]]

            areas.append({
                "id": f"zone-current-{hs['id']}",
                "hotspotId": hs["id"],
                "name": hs["name"],
                "hazardType": haz_key,
                "riskScore": round(score, 1),
                "severity": sev,
                "confidence": round(conf, 2),
                "isPredicted": False,
                "geometry": geom if isinstance(geom, dict) else {"type": "Polygon", "coordinates": coords},
                "center": hs.get("centroid", [13.386, 79.798]),
                "lastUpdated": datetime.now(timezone.utc).isoformat(),
                "affectedPopulationEstimate": 2500 if sev in ["HIGH", "CRITICAL"] else 800
            })
        return areas

    def _build_predicted_affected_areas(
        self,
        hazard_results: Dict[str, Any],
        dominant_hazard: str,
        overall_confidence: float,
        weather: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        hotspots = self.hotspot_store.get_all_hotspots()
        if not hotspots:
            return []

        areas = []
        for hs in hotspots:
            haz_key = hs.get("hazard", "FLOOD").upper()
            if haz_key == "HEATWAVE":
                haz_key = "HEAT"
            elif haz_key == "HEAVY_RAIN":
                haz_key = "STORM"

            res = hazard_results.get(haz_key, hazard_results.get("FLOOD", {}))
            score = res.get("riskScore", 50.0)
            pred_score = min(100.0, score * 1.15) if score > 40 else score * 0.85
            pred_sev = get_risk_level(pred_score)
            conf = res.get("confidence", overall_confidence) * 0.85

            geom = hs.get("geometry", {})
            coords = geom.get("coordinates", [[]]) if isinstance(geom, dict) else [[]]

            areas.append({
                "id": f"zone-pred-{hs['id']}",
                "hotspotId": hs["id"],
                "name": f"Projected Hazard Extension: {hs['name']}",
                "hazardType": haz_key,
                "riskScore": round(pred_score, 1),
                "severity": pred_sev,
                "confidence": round(conf, 2),
                "isPredicted": True,
                "timeHorizonMinutes": 120,
                "geometry": geom if isinstance(geom, dict) else {"type": "Polygon", "coordinates": coords},
                "center": hs.get("centroid", [13.386, 79.798]),
                "lastUpdated": datetime.now(timezone.utc).isoformat(),
                "affectedPopulationEstimate": 4500 if pred_sev in ["HIGH", "CRITICAL"] else 1200
            })
        return areas



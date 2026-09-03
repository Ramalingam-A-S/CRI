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

        # Representative geospatial feature profile for local risk center
        geo_features = {
            "elevation": 5.0,
            "slope": 3.0,
            "water_proximity": 150.0,
            "historical_susceptibility": 0.75
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
                location_name=current_areas[0]["name"] if current_areas else "Primary Local Zone",
                lat=current_areas[0]["center"][0] if current_areas else 12.9780,
                lng=current_areas[0]["center"][1] if current_areas else 80.2210,
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
        areas = []
        hazard_specs = {
            "FLOOD": [
                {
                    "id": "zone-current-velachery-flood",
                    "name": "Velachery Drainage Corridor & Underpass",
                    "coords": [[12.9780, 80.2210], [12.9850, 80.2260], [12.9750, 80.2350], [12.9690, 80.2280], [12.9780, 80.2210]],
                    "center": [12.9768, 80.2275],
                    "base_pop": 18500
                },
                {
                    "id": "zone-current-perungudi-flood",
                    "name": "Perungudi Low Marshland Basin",
                    "coords": [[12.9600, 80.2380], [12.9680, 80.2450], [12.9580, 80.2520], [12.9520, 80.2420], [12.9600, 80.2380]],
                    "center": [12.9595, 80.2442],
                    "base_pop": 12100
                }
            ],
            "HEAT": [
                {
                    "id": "zone-current-guindy-heat",
                    "name": "Guindy Industrial Heat Island Corridor",
                    "coords": [[13.0060, 80.2020], [13.0120, 80.2150], [13.0020, 80.2220], [12.9960, 80.2080], [13.0060, 80.2020]],
                    "center": [13.0040, 80.2118],
                    "base_pop": 21000
                },
                {
                    "id": "zone-current-tnagar-heat",
                    "name": "T. Nagar High-Density Commercial Belt",
                    "coords": [[13.0380, 80.2280], [13.0450, 80.2380], [13.0350, 80.2450], [13.0280, 80.2340], [13.0380, 80.2280]],
                    "center": [13.0365, 80.2362],
                    "base_pop": 34000
                }
            ],
            "LANDSLIDE": [
                {
                    "id": "zone-current-stthomas-landslide",
                    "name": "St. Thomas Mount Ridge Slope",
                    "coords": [[12.9920, 80.1980], [13.0000, 80.2050], [12.9900, 80.2120], [12.9820, 80.2020], [12.9920, 80.1980]],
                    "center": [12.9910, 80.2042],
                    "base_pop": 8900
                },
                {
                    "id": "zone-current-pallavaram-landslide",
                    "name": "Pallavaram Quarry Escarpment Cut",
                    "coords": [[12.9700, 80.1780], [12.9780, 80.1850], [12.9680, 80.1920], [12.9600, 80.1820], [12.9700, 80.1780]],
                    "center": [12.9690, 80.1842],
                    "base_pop": 6400
                }
            ],
            "STORM": [
                {
                    "id": "zone-current-marina-storm",
                    "name": "Marina Beach Coastal Surge Front",
                    "coords": [[13.0480, 80.2780], [13.0600, 80.2850], [13.0450, 80.2920], [13.0350, 80.2820], [13.0480, 80.2780]],
                    "center": [13.0470, 80.2842],
                    "base_pop": 29000
                },
                {
                    "id": "zone-current-foreshore-storm",
                    "name": "Foreshore Estate Harbor Exposure Belt",
                    "coords": [[13.0250, 80.2720], [13.0350, 80.2790], [13.0220, 80.2860], [13.0150, 80.2760], [13.0250, 80.2720]],
                    "center": [13.0242, 80.2782],
                    "base_pop": 16500
                }
            ]
        }

        for haz_key, specs in hazard_specs.items():
            res = hazard_results.get(haz_key, {})
            score = res.get("riskScore", 0.0)
            sev = res.get("severity", get_risk_level(score))
            conf = res.get("confidence", overall_confidence)
            
            for spec in specs:
                areas.append({
                    "id": spec["id"],
                    "name": spec["name"],
                    "hazardType": haz_key,
                    "riskScore": round(score, 1),
                    "severity": sev,
                    "confidence": round(conf, 2),
                    "isPredicted": False,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [spec["coords"]]
                    },
                    "center": spec["center"],
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                    "affectedPopulationEstimate": spec["base_pop"] if sev in ["HIGH", "CRITICAL"] else int(spec["base_pop"] * 0.25)
                })
        return areas

    def _build_predicted_affected_areas(
        self,
        hazard_results: Dict[str, Any],
        dominant_hazard: str,
        overall_confidence: float,
        weather: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        areas = []
        pred_specs = {
            "FLOOD": [
                {
                    "id": "zone-pred-madipakkam-flood",
                    "name": "Madipakkam Downstream Overflow Basin",
                    "coords": [[12.9650, 80.1980], [12.9730, 80.2050], [12.9620, 80.2150], [12.9550, 80.2050], [12.9650, 80.1980]],
                    "center": [12.9638, 80.2058],
                    "horizon": 180,
                    "base_pop": 24000
                }
            ],
            "HEAT": [
                {
                    "id": "zone-pred-saidapet-heat",
                    "name": "Saidapet Canopy Thermal Expansion Sector",
                    "coords": [[13.0200, 80.2150], [13.0280, 80.2250], [13.0180, 80.2320], [13.0100, 80.2220], [13.0200, 80.2150]],
                    "center": [13.0190, 80.2235],
                    "horizon": 120,
                    "base_pop": 19500
                }
            ],
            "LANDSLIDE": [
                {
                    "id": "zone-pred-chromepet-landslide",
                    "name": "Chromepet Foothill Instability Front",
                    "coords": [[12.9500, 80.1450], [12.9580, 80.1550], [12.9480, 80.1620], [12.9400, 80.1500], [12.9500, 80.1450]],
                    "center": [12.9490, 80.1530],
                    "horizon": 240,
                    "base_pop": 11200
                }
            ],
            "STORM": [
                {
                    "id": "zone-pred-royapuram-storm",
                    "name": "Royapuram Port Surge Inundation Front",
                    "coords": [[13.1050, 80.2880], [13.1180, 80.2950], [13.1020, 80.3020], [13.0950, 80.2920], [13.1050, 80.2880]],
                    "center": [13.1050, 80.2942],
                    "horizon": 180,
                    "base_pop": 31000
                }
            ]
        }

        for haz_key, specs in pred_specs.items():
            res = hazard_results.get(haz_key, {})
            score = res.get("riskScore", 0.0)
            pred_score = min(100.0, score * 1.15) if score > 40 else score * 0.8
            pred_sev = get_risk_level(pred_score)
            conf = res.get("confidence", overall_confidence) * 0.85
            
            for spec in specs:
                areas.append({
                    "id": spec["id"],
                    "name": spec["name"],
                    "hazardType": haz_key,
                    "riskScore": round(pred_score, 1),
                    "severity": pred_sev,
                    "confidence": round(conf, 2),
                    "isPredicted": True,
                    "timeHorizonMinutes": spec["horizon"],
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [spec["coords"]]
                    },
                    "center": spec["center"],
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                    "affectedPopulationEstimate": spec["base_pop"] if pred_sev in ["HIGH", "CRITICAL"] else int(spec["base_pop"] * 0.25)
                })
        return areas


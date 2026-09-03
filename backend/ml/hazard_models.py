from typing import Dict, Any, Optional
from enum import Enum
import os
import json
import numpy as np
import pandas as pd
import joblib

def extract_factors(model, feature_names, input_df):
    try:
        if not model or not feature_names: return {}
        
        # Get feature importances from the random forest
        rf = model.named_steps.get('regressor')
        if not rf: return {}
        importances = rf.feature_importances_
        
        # Combine importance with the actual normalized value to estimate local contribution
        # For a hackathon MVP, returning the globally most important features that are present in the input is sufficient
        scaler = model.named_steps.get('scaler')
        scaled_input = scaler.transform(input_df)[0] if scaler else input_df.iloc[0].values
        
        # approximate contribution = absolute scaled feature * importance
        contributions = np.abs(scaled_input) * importances
        
        factors = {}
        for i, name in enumerate(feature_names):
            if contributions[i] > 0.05: # Threshold
                clean_name = name.replace('_', ' ').title()
                factors[clean_name] = round(float(contributions[i]), 2)
                
        # Sort and return top 3
        sorted_factors = dict(sorted(factors.items(), key=lambda item: item[1], reverse=True)[:3])
        return sorted_factors
    except Exception as e:
        return {}


class OperatingMode(Enum):
    CLOUD = "CLOUD"
    LOCAL_EDGE = "LOCAL_EDGE"
    DEGRADED = "DEGRADED"
    NO_DATA = "NO_DATA"

class RiskLevel(Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

def get_risk_level(score: float) -> str:
    if score < 33: return RiskLevel.LOW.value
    if score < 66: return RiskLevel.MODERATE.value
    if score < 85: return RiskLevel.HIGH.value
    return RiskLevel.CRITICAL.value

_flood_model = None
_flood_features = []
_heat_model = None
_heat_features = []
_landslide_model = None
_landslide_features = []
_storm_model = None
_storm_features = []

def _load_models():
    global _flood_model, _flood_features, _heat_model, _heat_features, _landslide_model, _landslide_features, _storm_model, _storm_features
    base_ml_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml_training")
    
    if _flood_model is None:
        try:
            _flood_model = joblib.load(os.path.join(base_ml_dir, "flood", "flood_model.joblib"))
            with open(os.path.join(base_ml_dir, "flood", "flood_metadata.json"), "r") as f:
                _flood_features = json.load(f)["features"]
        except: pass
    if _heat_model is None:
        try:
            _heat_model = joblib.load(os.path.join(base_ml_dir, "heatwave", "heatwave_model.joblib"))
            with open(os.path.join(base_ml_dir, "heatwave", "heatwave_metadata.json"), "r") as f:
                _heat_features = json.load(f)["features"]
        except: pass
    if _landslide_model is None:
        try:
            _landslide_model = joblib.load(os.path.join(base_ml_dir, "landslide", "landslide_model.joblib"))
            with open(os.path.join(base_ml_dir, "landslide", "landslide_metadata.json"), "r") as f:
                _landslide_features = json.load(f)["features"]
        except: pass
    if _storm_model is None:
        try:
            _storm_model = joblib.load(os.path.join(base_ml_dir, "storm", "storm_model.joblib"))
            with open(os.path.join(base_ml_dir, "storm", "storm_metadata.json"), "r") as f:
                _storm_features = json.load(f)["features"]
        except: pass

def predict_flood(weather_features: Dict[str, float], geo_features: Dict[str, float], mode: OperatingMode = OperatingMode.CLOUD) -> Dict[str, Any]:
    if mode == OperatingMode.NO_DATA: return {"riskScore": 0.0, "severity": RiskLevel.LOW.value, "confidence": 0.0}
    _load_models()
    rain = weather_features.get("rainfall", 0.0)
    
    if _flood_model and _flood_features:
        input_dict = {
            "rainfall_1h": rain, "rainfall_accumulation_24h": rain * 3, "predicted_rainfall_ml": rain,
            "elevation": geo_features.get("elevation", 10.0), "slope": geo_features.get("slope", 0.0),
            "water_proximity": geo_features.get("water_proximity", 500.0), "soil_moisture": 0.6,
            "historical_hotspot_risk": geo_features.get("historical_susceptibility", 0.2)
        }
        df = pd.DataFrame([{col: input_dict.get(col, 0.0) for col in _flood_features}])
        score = float(_flood_model.predict(df)[0])
        factors = extract_factors(_flood_model, _flood_features, df)
    else:
        elevation, water_prox = geo_features.get("elevation", 10.0), geo_features.get("water_proximity", 500.0)
        score = (rain * 2) + (20 - elevation) * 1.5 + (500 - water_prox) * 0.05
        factors = {"Rain": round(rain, 2), "Elevation": round(elevation, 1)}
        
    score = min(100.0, max(0.0, score))
    return {"riskScore": round(score, 1), "severity": get_risk_level(score), "confidence": 0.50 if mode == OperatingMode.CLOUD else 0.30, "factors": factors}

def predict_heat(weather_features: Dict[str, float], geo_features: Dict[str, float], mode: OperatingMode = OperatingMode.CLOUD) -> Dict[str, Any]:
    if mode == OperatingMode.NO_DATA: return {"riskScore": 0.0, "severity": RiskLevel.LOW.value, "confidence": 0.0}
    _load_models()
    temp, humidity = weather_features.get("temperature", 25.0), weather_features.get("humidity", 50.0)
    
    if _heat_model and _heat_features:
        input_dict = {
            "temperature": temp, "humidity": humidity, "predicted_temp_ml": temp, "predicted_humidity_ml": humidity,
            "solar_exposure": 5.0, "building_density": 0.5, "vegetation_cover": 0.3,
            "historical_hotspot_risk": geo_features.get("historical_susceptibility", 0.2)
        }
        df = pd.DataFrame([{col: input_dict.get(col, 0.0) for col in _heat_features}])
        score = float(_heat_model.predict(df)[0])
        factors = extract_factors(_heat_model, _heat_features, df)
    else:
        score = (temp - 25) * 4 + (humidity - 50) * 0.5
        factors = {"Temperature": round(temp, 1), "Humidity": round(humidity, 1)}
        
    score = min(100.0, max(0.0, score))
    return {"riskScore": round(score, 1), "severity": get_risk_level(score), "confidence": 0.50 if mode == OperatingMode.CLOUD else 0.30, "factors": factors}

def predict_landslide(weather_features: Dict[str, float], geo_features: Dict[str, float], mode: OperatingMode = OperatingMode.CLOUD) -> Dict[str, Any]:
    if mode == OperatingMode.NO_DATA: return {"riskScore": 0.0, "severity": RiskLevel.LOW.value, "confidence": 0.0}
    _load_models()
    rain, slope = weather_features.get("rainfall", 0.0), geo_features.get("slope", 0.0)
    
    if _landslide_model and _landslide_features:
        input_dict = {
            "rainfall_24h": rain * 3, "rainfall_72h": rain * 8, "predicted_rainfall_ml": rain,
            "soil_moisture": 0.6, "slope": slope, "elevation": geo_features.get("elevation", 10.0),
            "vegetation_cover": 0.5, "historical_hotspot_risk": geo_features.get("historical_susceptibility", 0.2)
        }
        df = pd.DataFrame([{col: input_dict.get(col, 0.0) for col in _landslide_features}])
        score = float(_landslide_model.predict(df)[0])
        factors = extract_factors(_landslide_model, _landslide_features, df)
    else:
        score = slope * 5 + rain * 0.5
        factors = {"Slope": round(slope, 1), "Rain": round(rain, 1)}
        
    score = min(100.0, max(0.0, score))
    return {"riskScore": round(score, 1), "severity": get_risk_level(score), "confidence": 0.50 if mode == OperatingMode.CLOUD else 0.30, "factors": factors}

def predict_storm(weather_features: Dict[str, float], geo_features: Dict[str, float], mode: OperatingMode = OperatingMode.CLOUD) -> Dict[str, Any]:
    if mode == OperatingMode.NO_DATA: return {"riskScore": 0.0, "severity": RiskLevel.LOW.value, "confidence": 0.0}
    _load_models()
    wind, pressure = weather_features.get("windSpeed", 0.0), weather_features.get("pressure", 1013.25)
    
    if _storm_model and _storm_features:
        input_dict = {
            "windSpeed": wind, "pressure": pressure, "pressure_trend_3h": -2.0,
            "predicted_rainfall_ml": weather_features.get("rainfall", 0.0),
            "humidity": weather_features.get("humidity", 70.0),
            "historical_hotspot_risk": geo_features.get("historical_susceptibility", 0.2)
        }
        df = pd.DataFrame([{col: input_dict.get(col, 0.0) for col in _storm_features}])
        score = float(_storm_model.predict(df)[0])
        factors = extract_factors(_storm_model, _storm_features, df)
    else:
        score = wind * 2 + (1013 - pressure) * 1.5
        factors = {"Wind": round(wind, 1), "Pressure": round(pressure, 1)}
        
    score = min(100.0, max(0.0, score))
    return {"riskScore": round(score, 1), "severity": get_risk_level(score), "confidence": 0.50 if mode == OperatingMode.CLOUD else 0.30, "factors": factors}

def risk_fusion(hazard_predictions: Dict[str, Dict[str, Any]], sensor_quality: float = 1.0) -> Dict[str, Any]:
    scores = [haz["riskScore"] for haz in hazard_predictions.values()]
    confidences = [haz["confidence"] for haz in hazard_predictions.values()]
    # Use max score to drive the overall severity — the worst hazard determines route danger
    max_score = max(scores) if scores else 0.0
    avg_score = sum(scores) / len(scores) if scores else 0.0
    overall_confidence = (sum(confidences) / len(confidences) if confidences else 0.0) * sensor_quality
    return {
        "overallScore": round(avg_score, 1),
        "overallSeverity": get_risk_level(max_score),   # worst-hazard driven
        "overallConfidence": round(overall_confidence, 2)
    }

def get_affected_areas(spatial_data_source: Optional[str] = None):
    if not spatial_data_source:
        return {"status": "DATA_REQUIRED", "message": "Spatial boundary vectors and real-time mesh required.", "currentAffectedAreas": [], "predictedAffectedAreas": []}
    pass

import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime

class WeatherModel:
    def __init__(self, model_dir: str):
        self.model = None
        self.feature_names = []
        try:
            self.model = joblib.load(os.path.join(model_dir, "weather_model.joblib"))
            with open(os.path.join(model_dir, "model_metadata.json"), "r") as f:
                meta = json.load(f)
                self.feature_names = meta["feature_names"]
        except Exception as e:
            print(f"WeatherModel Init Error: {e}")

    def predict_weather(self, input_features: dict) -> dict:
        if self.model is None or not self.feature_names:
            # Fallback values if model fails to load
            return {
                "temperature": 25.0,
                "rainfall": 0.0,
                "humidity": 60.0,
                "windSpeed": None,
                "pressure": None,
                "timestamp": datetime.now().isoformat()
            }
            
        # Build sparse dataframe mapping input features to model feature schema
        # Missing features are handled via internal imputation
        df = pd.DataFrame([{col: input_features.get(col, np.nan) for col in self.feature_names}])
        
        preds = self.model.predict(df)[0]
        
        # Parse outputs (assuming indices 0: temp, 1: precip, 2: humidity based on metadata)
        temp = float(preds[0])
        precip = max(0.0, float(preds[1])) * 10.0 # scaling for visibility
        humidity = min(100.0, max(0.0, float(preds[2]) * 100.0))
        
        return {
            "temperature": round(temp, 2),
            "rainfall": round(precip, 2),
            "humidity": round(humidity, 2),
            "windSpeed": None,  # Not predicted by current model iteration
            "pressure": None,   # Not predicted by current model iteration
            "timestamp": datetime.now().isoformat()
        }

# Global Singleton
_weather_model = None

def get_weather_model() -> WeatherModel:
    global _weather_model
    if _weather_model is None:
        model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml_training")
        _weather_model = WeatherModel(model_dir)
    return _weather_model

def predict_weather(input_features: dict) -> dict:
    model = get_weather_model()
    return model.predict_weather(input_features)

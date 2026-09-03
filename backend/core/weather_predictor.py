"""
backend/core/weather_predictor.py - Model loader and inference singleton for FastAPI.
"""
import os
import sys
import json
import logging
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd

# Windows 11 / Loky workaround
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

logger = logging.getLogger("uvicorn.error")

# Determine search paths for serialized artifacts
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ML_TRAINING_DIR = os.path.join(BASE_DIR, "ml_training")


class WeatherPredictor:
    """
    Singleton service managing model loading, schema resolution, and inference.
    """
    _instance = None

    def __init__(self):
        self.model = None
        self.metadata = {}
        self.feature_names = []
        self.target_names = ["BASEL_temp_mean", "BASEL_precipitation", "BASEL_humidity"]
        self.is_loaded = False
        self._load()

    @classmethod
    def get_instance(cls) -> "WeatherPredictor":
        if cls._instance is None:
            cls._instance = WeatherPredictor()
        return cls._instance

    def _load(self):
        # 1. Load metadata if present
        meta_path = os.path.join(ML_TRAINING_DIR, "model_metadata.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.feature_names = self.metadata.get("feature_names", [])
                    self.target_names = self.metadata.get("target_names", self.target_names)
            except Exception as e:
                logger.warning(f"Could not load model_metadata.json: {e}")

        # 2. Locate serialized model artifact
        candidates = [
            os.getenv("WEATHER_MODEL_PATH", ""),
            os.path.join(ML_TRAINING_DIR, "weather_model.joblib"),
            os.path.join(ML_TRAINING_DIR, "model.joblib"),
            os.path.join(ML_TRAINING_DIR, "weather_model.pkl"),
            os.path.join(BASE_DIR, "backend", "models", "weather_model.pkl"),
        ]

        model_path = None
        for c in candidates:
            if c and os.path.exists(c):
                model_path = c
                break

        if not model_path:
            logger.warning("No weather ML model artifact found. Falling back to heuristic baseline.")
            return

        try:
            if model_path.endswith(".joblib"):
                import joblib
                self.model = joblib.load(model_path)
            else:
                import pickle
                with open(model_path, "rb") as f:
                    self.model = pickle.load(f)
            self.is_loaded = True
            logger.info(f"Weather ML model successfully loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load weather model from {model_path}: {e}")
            self.model = None
            self.is_loaded = False

    def predict(
        self,
        features: Optional[Dict[str, float]] = None,
        feature_vector: Optional[List[float]] = None,
        station: str = "BASEL"
    ) -> Dict[str, Any]:
        """
        Execute prediction from dictionary of features or numeric vector.
        """
        if not self.is_loaded or self.model is None:
            # Fallback baseline
            return {
                "temperature": 18.0,
                "rainfall": 0.1,
                "humidity": 0.65,
                "temp_mean": 18.0,
                "precipitation": 0.1,
                "predictions": {
                    "BASEL_temp_mean": 18.0,
                    "BASEL_precipitation": 0.1,
                    "BASEL_humidity": 0.65,
                    "temperature": 18.0,
                    "rainfall": 0.1,
                    "humidity": 0.65
                },
                "status": "fallback",
                "source": "HEURISTIC_FALLBACK"
            }

        try:
            if feature_vector is not None:
                # Direct numeric vector input
                X_in = np.array(feature_vector).reshape(1, -1)
            elif features is not None and self.feature_names:
                # Dictionary input aligned to schema
                row_dict = {col: features.get(col, np.nan) for col in self.feature_names}
                # Also support alias keys (e.g. 'temperature' -> 'BASEL_temp_mean')
                if "temperature" in features and "BASEL_temp_mean" in self.feature_names:
                    row_dict["BASEL_temp_mean"] = features["temperature"]
                if "rainfall" in features and "BASEL_precipitation" in self.feature_names:
                    row_dict["BASEL_precipitation"] = features["rainfall"]
                if "humidity" in features and "BASEL_humidity" in self.feature_names:
                    row_dict["BASEL_humidity"] = features["humidity"]
                X_in = pd.DataFrame([row_dict])
            elif self.feature_names:
                # Empty input -> all NaNs, filled by SimpleImputer medians
                row_dict = {col: np.nan for col in self.feature_names}
                X_in = pd.DataFrame([row_dict])
            else:
                X_in = np.zeros((1, 169))

            raw_preds = self.model.predict(X_in)
            preds_row = raw_preds[0]

            temp_val = float(preds_row[0])
            precip_val = max(0.0, float(preds_row[1])) # Clamp non-negative
            humidity_val = min(1.0, max(0.0, float(preds_row[2]))) # Clamp [0, 1]

            return {
                "temperature": round(temp_val, 2),
                "rainfall": round(precip_val, 2),
                "humidity": round(humidity_val, 2),
                "temp_mean": round(temp_val, 2),
                "precipitation": round(precip_val, 2),
                "station": station,
                "predictions": {
                    "BASEL_temp_mean": round(temp_val, 2),
                    "BASEL_precipitation": round(precip_val, 2),
                    "BASEL_humidity": round(humidity_val, 2),
                    "temperature": round(temp_val, 2),
                    "rainfall": round(precip_val, 2),
                    "humidity": round(humidity_val, 2)
                },
                "status": "success",
                "source": "MULTI_TARGET_ML_MODEL"
            }
        except Exception as e:
            logger.error(f"Inference error in weather predictor: {e}")
            return {
                "temperature": 18.0,
                "rainfall": 0.1,
                "humidity": 0.65,
                "status": "error",
                "message": str(e),
                "source": "HEURISTIC_FALLBACK"
            }

    def get_model_info(self) -> Dict[str, Any]:
        """
        Return model metadata and status.
        """
        return {
            "status": "ok" if self.is_loaded else "uninitialized",
            "model_loaded": self.is_loaded,
            "model_name": self.metadata.get("model_name", "ClimateRoute Multi-Target Weather Predictor"),
            "version": self.metadata.get("version", "1.0.0"),
            "framework": self.metadata.get("framework", "scikit-learn"),
            "feature_count": len(self.feature_names),
            "target_names": self.target_names,
            "metrics": self.metadata.get("metrics", {}),
            "timestamp": self.metadata.get("timestamp", "")
        }

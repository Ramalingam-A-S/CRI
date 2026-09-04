"""
ml_training/train_propagation_model.py - Synthetic Generation & Training of Directional Propagation Model
"""
import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Ensure backend modules can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ml.propagation_formula import (
    PROPAGATION_WEIGHTS,
    DISTANCE_DECAY_D0_KM,
    calculate_propagation_bearing,
    calculate_great_circle_bearing,
    calculate_angular_alignment,
    calculate_haversine_distance_km,
    calculate_distance_score,
    calculate_compatibility_score,
    calculate_intensity_factor
)
from core.terrain import calculate_local_topography

def generate_synthetic_dataset(n_samples: int = 15000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    records = []

    # Directional event types (heatwave is non-directional and uses local scoring)
    event_types = ["heavy_rain", "flood", "landslide"]
    hazard_tags = ["flood", "landslide", "heatwave", "heavy_rain"]

    # Sadasiva Sankarapuram region bounding box
    min_lat, max_lat = 13.326, 13.446
    min_lng, max_lng = 79.738, 79.858

    w1 = PROPAGATION_WEIGHTS["alignment"]
    w2 = PROPAGATION_WEIGHTS["distance"]
    w3 = PROPAGATION_WEIGHTS["compatibility"]
    w4 = PROPAGATION_WEIGHTS["intensity"]
    total_w = w1 + w2 + w3 + w4

    for _ in range(n_samples):
        s_lat = np.random.uniform(min_lat, max_lat)
        s_lng = np.random.uniform(min_lng, max_lng)

        h_lat = np.random.uniform(min_lat, max_lat)
        h_lng = np.random.uniform(min_lng, max_lng)

        event_type = np.random.choice(event_types)
        hazard_tag = np.random.choice(hazard_tags)

        wind_deg = np.random.uniform(0.0, 360.0)
        wind_speed = np.random.uniform(5.0, 80.0)
        rainfall = np.random.uniform(0.0, 150.0)

        data_points = {
            "rainfallMmHr": rainfall,
            "windSpeedKmh": wind_speed
        }

        # Calculate terrain features (elevation & slope)
        elevation, slope = calculate_local_topography(h_lat, h_lng)

        # Great-circle bearing and propagation direction
        prop_deg = calculate_propagation_bearing(wind_deg)
        bearing = calculate_great_circle_bearing(s_lat, s_lng, h_lat, h_lng)
        ang_diff, alignment_score = calculate_angular_alignment(bearing, prop_deg)

        # Distance
        dist_km = calculate_haversine_distance_km(s_lat, s_lng, h_lat, h_lng)
        distance_score = calculate_distance_score(dist_km, DISTANCE_DECAY_D0_KM)

        # Compatibility (actively influenced by slope and elevation)
        compat_score = calculate_compatibility_score(event_type, hazard_tag, slope, elevation)
        intensity = calculate_intensity_factor(event_type, data_points)

        raw_score = (w1 * alignment_score) + (w2 * distance_score) + (w3 * compat_score) + (w4 * intensity)
        noise = np.random.normal(0.0, 1.0)
        prob = np.clip((raw_score / total_w) * 100.0 + noise, 0.0, 100.0)

        records.append({
            "angular_diff": ang_diff,
            "distance_km": dist_km,
            "compatibility_score": compat_score,
            "rainfall": rainfall,
            "wind_speed": wind_speed,
            "terrain_slope": slope,
            "probability": prob
        })

    return pd.DataFrame(records)

def train_and_export():
    print("=" * 70)
    print("Training Directional Hazard-Propagation Model (HistGradientBoosting)")
    print("=" * 70)

    print("Generating 15,000 synthetic physics-informed scenarios...")
    df = generate_synthetic_dataset(n_samples=15000)

    feature_cols = [
        "angular_diff",
        "distance_km",
        "compatibility_score",
        "rainfall",
        "wind_speed",
        "terrain_slope"
    ]
    target_col = "probability"

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    print(f"Training dataset: {len(X_train)} samples, Test holdout: {len(X_test)} samples.")
    model = HistGradientBoostingRegressor(
        max_iter=250,
        learning_rate=0.1,
        max_depth=8,
        min_samples_leaf=10,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\nModel Evaluation Metrics on 20% Holdout:")
    print(f"  RMSE: {rmse:.3f} %")
    print(f"  MAE:  {mae:.3f} %")
    print(f"  R^2:  {r2:.4f}")

    assert r2 > 0.90, f"R^2 ({r2}) below acceptance threshold of 0.90"

    # Export model artifact
    model_path = os.path.join(CURRENT_DIR, "propagation_model.joblib")
    joblib.dump(model, model_path)
    print(f"\nSaved model artifact to: {model_path}")

    # Export metadata
    meta = {
        "model_type": "HistGradientBoostingRegressor",
        "target": "probability",
        "features": feature_cols,
        "n_samples": len(df),
        "weights": PROPAGATION_WEIGHTS,
        "decay_d0_km": DISTANCE_DECAY_D0_KM,
        "metrics": {
            "rmse": round(float(rmse), 4),
            "mae": round(float(mae), 4),
            "r2": round(float(r2), 4)
        }
    }
    meta_path = os.path.join(CURRENT_DIR, "propagation_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved metadata to: {meta_path}")

    print("\nTraining completed successfully.")

if __name__ == "__main__":
    train_and_export()

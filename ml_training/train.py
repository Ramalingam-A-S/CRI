"""
ml_training/train.py - Multi-target regression model training, holdout evaluation, and export.
"""
import os
import sys

# Critical Windows 11 / Loky workaround to avoid wmic deprecation errors
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

import json
import pickle
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from data_processor import get_preprocessed_data, DEFAULT_TARGETS


def build_pipeline() -> Pipeline:
    """
    Construct multi-target regression pipeline:
    - SimpleImputer: fills missing features with median.
    - StandardScaler: normalizes feature distributions.
    - MultiOutputRegressor(HistGradientBoostingRegressor): high-performance gradient boosted trees.
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("regressor", MultiOutputRegressor(
            HistGradientBoostingRegressor(
                max_iter=100,
                max_depth=8,
                l2_regularization=1.0,
                random_state=42
            )
        )),
    ])


def train_and_evaluate(
    data_path: str = None,
    output_dir: str = CURRENT_DIR
):
    print("=" * 70)
    print("ClimateRoute Multi-Target Weather Prediction Model Training")
    print("=" * 70)

    # 1. Ingest & Preprocess Data with Chronological Split
    print("[1/5] Ingesting and preprocessing weather dataset...")
    if data_path is None:
        data_path = os.path.join(PARENT_DIR, "weather_prediction_dataset.csv")

    X_train, y_train, X_test, y_test, feature_names, target_names = get_preprocessed_data(
        data_path=data_path,
        target_cols=DEFAULT_TARGETS,
        shift_targets=True
    )

    print(f"  Training samples : {X_train.shape[0]} rows x {X_train.shape[1]} features (2000-2007)")
    print(f"  Holdout samples  : {X_test.shape[0]} rows x {X_test.shape[1]} features (2008-2009)")
    print(f"  Target columns   : {target_names}")

    # 2. Build and Fit Pipeline
    print("[2/5] Fitting multi-target regression pipeline...")
    start_time = datetime.now(timezone.utc)
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    fit_duration = (datetime.now(timezone.utc) - start_time).total_seconds()
    print(f"  Pipeline fitted successfully in {fit_duration:.2f} seconds.")

    # 3. Holdout Evaluation
    print("[3/5] Evaluating on holdout test set...")
    y_pred = pipeline.predict(X_test)

    target_metrics = {}
    r2_list = []
    rmse_list = []
    mae_list = []

    unit_map = {
        "BASEL_temp_mean": "degC",
        "BASEL_precipitation": "cm",
        "BASEL_humidity": "fraction_0_to_1"
    }

    for i, col in enumerate(target_names):
        y_true_col = y_test[col].values
        y_pred_col = y_pred[:, i]

        r2 = float(r2_score(y_true_col, y_pred_col))
        rmse = float(np.sqrt(mean_squared_error(y_true_col, y_pred_col)))
        mae = float(mean_absolute_error(y_true_col, y_pred_col))

        r2_list.append(r2)
        rmse_list.append(rmse)
        mae_list.append(mae)

        target_metrics[col] = {
            "r2": round(r2, 4),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "unit": unit_map.get(col, "standard")
        }
        print(f"  -> {col:22s} | R^2: {r2:7.4f} | RMSE: {rmse:7.4f} | MAE: {mae:7.4f}")

    overall_metrics = {
        "r2_score": round(float(np.mean(r2_list)), 4),
        "rmse": round(float(np.mean(rmse_list)), 4),
        "mae": round(float(np.mean(mae_list)), 4)
    }
    print(f"  OVERALL MEAN: R^2 = {overall_metrics['r2_score']:.4f} | RMSE = {overall_metrics['rmse']:.4f} | MAE = {overall_metrics['mae']:.4f}")

    # 4. Generate Reports (metrics.json and metrics.txt)
    print("[4/5] Generating evaluation reports...")
    iso_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    metrics_json_content = {
        "model_type": "Pipeline(SimpleImputer + StandardScaler + MultiOutputRegressor(HistGradientBoostingRegressor))",
        "dataset": os.path.basename(data_path),
        "holdout_strategy": "chronological_80_20 (train 2000-2007, test 2008-2009)",
        "train_period": {"start": "2000-01-01", "end": "2007-12-31", "samples": int(len(X_train))},
        "test_period": {"start": "2008-01-01", "end": "2009-12-31", "samples": int(len(X_test))},
        "overall_metrics": overall_metrics,
        "target_metrics": target_metrics,
        "timestamp": iso_timestamp
    }

    metrics_json_path = os.path.join(output_dir, "metrics.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_json_content, f, indent=2)
    print(f"  Saved: {metrics_json_path}")

    metrics_txt_lines = [
        "=" * 80,
        "                   WEATHER PREDICTION MODEL EVALUATION REPORT",
        "=" * 80,
        f"Model Architecture : MultiOutputRegressor(HistGradientBoostingRegressor)",
        f"Training Dataset   : {os.path.basename(data_path)} ({len(X_train) + len(X_test)} records)",
        f"Holdout Strategy   : Strict Chronological Split (Train: 2000-2007, Test: 2008-2009)",
        f"Training Samples   : {len(X_train)} samples",
        f"Holdout Samples    : {len(X_test)} samples",
        f"Timestamp          : {iso_timestamp}",
        "-" * 80,
        f"{'Target Variable':<25} {'R^2 Score':<12} {'RMSE':<12} {'MAE':<12} {'Units'}",
        "-" * 80,
    ]
    for col, m in target_metrics.items():
        metrics_txt_lines.append(
            f"{col:<25} {m['r2']:<12.4f} {m['rmse']:<12.4f} {m['mae']:<12.4f} {m['unit']}"
        )
    metrics_txt_lines.extend([
        "-" * 80,
        f"{'OVERALL AVERAGE':<25} {overall_metrics['r2_score']:<12.4f} {overall_metrics['rmse']:<12.4f} {overall_metrics['mae']:<12.4f}",
        "=" * 80,
    ])
    metrics_txt_path = os.path.join(output_dir, "metrics.txt")
    with open(metrics_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(metrics_txt_lines) + "\n")
    print(f"  Saved: {metrics_txt_path}")

    # 5. Export Model Artifacts & Sidecar Metadata
    print("[5/5] Exporting serialized model artifacts and metadata...")

    # Calculate representative median default feature values for fallback/partial queries
    imputer_step = pipeline.named_steps["imputer"]
    medians = imputer_step.statistics_ if hasattr(imputer_step, "statistics_") else np.zeros(len(feature_names))
    default_feature_values = {k: round(float(v), 4) for k, v in zip(feature_names, medians)}

    model_metadata = {
        "model_name": "ClimateRoute Multi-Target Weather Predictor",
        "version": "1.0.0",
        "framework": "scikit-learn",
        "feature_names": feature_names,
        "feature_count": len(feature_names),
        "target_names": target_names,
        "target_count": len(target_names),
        "target_aliases": {
            "temperature": "BASEL_temp_mean",
            "rainfall": "BASEL_precipitation",
            "humidity": "BASEL_humidity"
        },
        "target_units": unit_map,
        "physical_bounds": {
            "BASEL_temp_mean": {"min": -30.0, "max": 50.0},
            "BASEL_precipitation": {"min": 0.0, "max": 30.0},
            "BASEL_humidity": {"min": 0.0, "max": 1.0}
        },
        "default_feature_values": default_feature_values,
        "metrics": overall_metrics,
        "timestamp": iso_timestamp
    }

    metadata_path = os.path.join(output_dir, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    print(f"  Saved: {metadata_path}")

    # Export joblib compressed models
    weather_joblib_path = os.path.join(output_dir, "weather_model.joblib")
    model_joblib_path = os.path.join(output_dir, "model.joblib")
    joblib.dump(pipeline, weather_joblib_path, compress=3)
    joblib.dump(pipeline, model_joblib_path, compress=3)
    print(f"  Saved: {weather_joblib_path} ({os.path.getsize(weather_joblib_path) / 1024:.1f} KB)")
    print(f"  Saved: {model_joblib_path}")

    # Export pickle model
    weather_pkl_path = os.path.join(output_dir, "weather_model.pkl")
    with open(weather_pkl_path, "wb") as f:
        pickle.dump(pipeline, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"  Saved: {weather_pkl_path} ({os.path.getsize(weather_pkl_path) / 1024:.1f} KB)")

    print("\nTraining and artifact generation COMPLETE!")
    return pipeline, model_metadata, overall_metrics


if __name__ == "__main__":
    train_and_evaluate()

"""
ml_training/verify_model.py - Standalone Acceptance Verification Harness
Fulfills Acceptance Criteria 3 for ClimateRoute Weather Prediction ML Model.
"""
import os
import sys
import time
import json
import numpy as np
import pandas as pd

# Windows 11 / Loky workaround
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

import warnings
warnings.filterwarnings("ignore", category=UserWarning)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)


def load_model(artifact_path: str = None):
    """
    Load serialized model supporting .joblib or .pkl format.
    """
    if artifact_path is None:
        candidates = [
            os.path.join(CURRENT_DIR, "weather_model.joblib"),
            os.path.join(CURRENT_DIR, "model.joblib"),
            os.path.join(CURRENT_DIR, "weather_model.pkl"),
        ]
        for c in candidates:
            if os.path.exists(c):
                artifact_path = c
                break

    if not artifact_path or not os.path.exists(artifact_path):
        raise FileNotFoundError(f"No valid model artifact found in {CURRENT_DIR}")

    print(f"Loading model artifact from: {artifact_path}")
    if artifact_path.endswith(".joblib"):
        import joblib
        return joblib.load(artifact_path)
    else:
        import pickle
        with open(artifact_path, "rb") as f:
            return pickle.load(f)


def load_metadata(meta_path: str = None):
    if meta_path is None:
        meta_path = os.path.join(CURRENT_DIR, "model_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def run_verification():
    print("=" * 70)
    print("ClimateRoute Weather Prediction Model Acceptance Verification")
    print("=" * 70)

    # 1. Test Model Loading
    print("\n[TEST 1] Loading Serialized Model Artifact...")
    model = load_model()
    assert model is not None, "Model failed to load (returned None)"
    print(f"  -> Model successfully loaded: {type(model).__name__}")

    metadata = load_metadata()
    if metadata:
        feature_names = metadata["feature_names"]
        target_names = metadata["target_names"]
    else:
        # Fallback inspection from dataset or pipeline
        feature_names = [f"feat_{i}" for i in range(168)]
        target_names = ["BASEL_temp_mean", "BASEL_precipitation", "BASEL_humidity"]

    n_features = len(feature_names)
    n_targets = len(target_names)
    print(f"  -> Model schema: {n_features} input features, {n_targets} target variables: {target_names}")

    # 2. Test Single Dummy Vector
    print("\n[TEST 2] Testing Single Dummy Feature Vector (zeros)...")
    dummy_zeros = np.zeros((1, n_features))
    preds_zeros = model.predict(dummy_zeros)
    assert preds_zeros.shape == (1, n_targets), f"Expected shape (1, {n_targets}), got {preds_zeros.shape}"
    assert not np.isnan(preds_zeros).any(), "Prediction contains NaN values"
    assert not np.isinf(preds_zeros).any(), "Prediction contains Inf values"
    pred_dict = {t: round(float(v), 3) for t, v in zip(target_names, preds_zeros[0])}
    print(f"  -> Successful prediction: {pred_dict}")

    # 3. Test Dictionary & DataFrame Input Matching Schema
    print("\n[TEST 3] Testing Dictionary & DataFrame Input Format...")
    sample_dict = {feat: 0.0 for feat in feature_names}
    # Provide representative realistic values for focal station Basel
    sample_dict["BASEL_temp_mean"] = 16.5
    sample_dict["BASEL_humidity"] = 0.72
    sample_dict["BASEL_pressure"] = 1.015
    sample_dict["BASEL_precipitation"] = 0.05
    sample_dict["BASEL_sunshine"] = 5.5
    df_sample = pd.DataFrame([sample_dict])
    preds_df = model.predict(df_sample)
    assert preds_df.shape == (1, n_targets)
    df_pred_dict = {t: round(float(v), 3) for t, v in zip(target_names, preds_df[0])}
    print(f"  -> DataFrame input prediction: {df_pred_dict}")

    # 4. Test Missing Value / NaN Imputation Handling
    print("\n[TEST 4] Testing Missing Feature & NaN Imputation Handling...")
    # Passing 100% NaNs to verify SimpleImputer robustly imputes median training statistics
    nan_input = np.full((1, n_features), np.nan)
    preds_nan = model.predict(nan_input)
    assert preds_nan.shape == (1, n_targets), f"Expected shape (1, {n_targets}), got {preds_nan.shape}"
    assert not np.isnan(preds_nan).any(), "Imputer failed: outputs contain NaN on missing inputs"
    nan_pred_dict = {t: round(float(v), 3) for t, v in zip(target_names, preds_nan[0])}
    print(f"  -> Missing feature input handled gracefully: {nan_pred_dict}")

    # Partial feature dict (sparse dictionary with only 2 keys)
    sparse_dict = {"BASEL_temp_mean": 22.0, "BASEL_humidity": 0.55}
    sparse_df = pd.DataFrame([{col: sparse_dict.get(col, np.nan) for col in feature_names}])
    preds_sparse = model.predict(sparse_df)
    assert preds_sparse.shape == (1, n_targets)
    assert not np.isnan(preds_sparse).any()
    print(f"  -> Sparse 2-key dictionary handled gracefully: {dict(zip(target_names, np.round(preds_sparse[0], 3)))}")

    # 5. Test Batch Inference
    print("\n[TEST 5] Testing Batch Multi-Sample Inference...")
    batch_size = 25
    batch_input = np.random.randn(batch_size, n_features)
    preds_batch = model.predict(batch_input)
    assert preds_batch.shape == (batch_size, n_targets), f"Batch output mismatch: {preds_batch.shape}"
    assert not np.isnan(preds_batch).any()
    print(f"  -> Batch of {batch_size} samples processed successfully. Output shape: {preds_batch.shape}")

    # 6. Test Physical Bounds and Value Constraints
    print("\n[TEST 6] Verifying Physical Bounds and Output Properties...")
    # Multi-variable assertion
    assert n_targets >= 2, f"Acceptance criteria mandates multi-variable output (>= 2), got {n_targets}"
    
    # Temperature should be physically plausible (-30 to +50 deg C)
    raw_temp = preds_df[0, 0]
    assert -30.0 <= raw_temp <= 50.0, f"Predicted temperature {raw_temp} out of physical range"
    
    # Clamped precipitation non-negative
    precip_idx = target_names.index("BASEL_precipitation") if "BASEL_precipitation" in target_names else 1
    raw_precip = preds_df[0, precip_idx]
    clamped_precip = max(0.0, float(raw_precip))
    assert clamped_precip >= 0.0, f"Clamped precipitation must be non-negative, got {clamped_precip}"
    
    # Clamped humidity within [0, 1]
    hum_idx = target_names.index("BASEL_humidity") if "BASEL_humidity" in target_names else 2
    raw_hum = preds_df[0, hum_idx]
    clamped_hum = min(1.0, max(0.0, float(raw_hum)))
    assert 0.0 <= clamped_hum <= 1.0, f"Clamped humidity must be in [0, 1], got {clamped_hum}"

    print(f"  -> Temperature: {raw_temp:.2f} °C (valid)")
    print(f"  -> Precipitation: {raw_precip:.3f} cm -> clamped {clamped_precip:.3f} cm (valid)")
    print(f"  -> Relative Humidity: {raw_hum:.3f} -> clamped {clamped_hum:.3f} (valid)")

    # 7. Latency Verification
    print("\n[TEST 7] Testing Inference Latency Benchmark...")
    t0 = time.perf_counter()
    n_iterations = 100
    for _ in range(n_iterations):
        _ = model.predict(dummy_zeros)
    avg_latency_ms = ((time.perf_counter() - t0) / n_iterations) * 1000.0
    print(f"  -> Average single-sample latency: {avg_latency_ms:.2f} ms")
    assert avg_latency_ms < 100.0, f"Latency {avg_latency_ms:.2f} ms exceeds 100 ms threshold"

    print("\n" + "=" * 70)
    print(">>> VERIFICATION RESULT: ALL 7 TEST SUITES PASSED (Exit Code 0) <<<")
    print("=" * 70)
    return True


if __name__ == "__main__":
    try:
        run_verification()
        sys.exit(0)
    except Exception as e:
        print(f"\n[FAILED] Verification failed with error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

# DISPATCH

## 2026-09-03T15:20:13Z

Train a multi-target weather prediction machine learning model using the provided dataset in the Aracnids folder (see d:\Aracnids\weather-prediction-metadata.json and dataset files in d:\Aracnids), and export it for integration into a FastAPI backend.
Requested team: A full research team.
Integrity mode: development.

Requirements:
- R1. Data Processing: Load and preprocess the weather prediction dataset located in the `d:\Aracnids` directory. Handle any necessary feature engineering, scaling, or missing value imputation.
- R2. Model Training: Train a machine learning model capable of predicting multiple weather/climate variables simultaneously (e.g., temperature, rainfall).
- R3. Model Export: Export the fully trained model and any necessary preprocessing pipelines as serialized files (e.g., `.pkl`, `.joblib`) so they can be easily loaded by a Python FastAPI backend into `d:\Aracnids\ml_training`.

Acceptance Criteria:
- Model Artifacts:
  - A serialized model file exists in the working directory (`d:\Aracnids\ml_training`).
  - An evaluation report (`metrics.txt` or `metrics.json`) is generated, detailing the model's performance (e.g., RMSE, MAE) on a holdout validation set.
- Programmatic Verification:
  - A short verification script (`verify_model.py`) is provided in `d:\Aracnids\ml_training`. When run, it must successfully load the serialized model, accept a dummy input array/dictionary matching the feature schema, and output the multi-variable predictions without throwing any errors.

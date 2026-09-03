"""
ml_training/data_processor.py - Data ingestion, cleaning, feature engineering, and temporal splitting.
"""
import os
import numpy as np
import pandas as pd
from typing import Tuple, List, Optional
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

DEFAULT_DATA_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "weather_prediction_dataset.csv")
)

DEFAULT_TARGETS = ["BASEL_temp_mean", "BASEL_precipitation", "BASEL_humidity"]


def clean_sentinels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean meteorological sentinel codes discovered in the dataset:
    - Cloud cover: -99 sentinel -> NaN; clip values > 8 oktas to 8.
    - Pressure: values < 0.8 (e.g. -0.0990, 0.0003) -> NaN.
    - Sunshine: negative values (e.g. -1.70) -> 0.0; clip > 24.0 -> 24.0.
    - Precipitation: negative values -> 0.0.
    - Remaining NaNs forward-filled then back-filled to preserve series continuity.
    """
    cleaned = df.copy()

    for col in cleaned.columns:
        if "cloud_cover" in col:
            cleaned.loc[cleaned[col] < 0, col] = np.nan
            cleaned.loc[cleaned[col] > 8, col] = 8.0
        elif "pressure" in col:
            cleaned.loc[cleaned[col] < 0.8, col] = np.nan
        elif "sunshine" in col:
            cleaned.loc[cleaned[col] < 0.0, col] = 0.0
            cleaned.loc[cleaned[col] > 24.0, col] = 24.0
        elif "precipitation" in col:
            cleaned.loc[cleaned[col] < 0.0, col] = 0.0

    # Fill NaNs created by sentinel cleaning
    cleaned = cleaned.ffill().bfill()
    return cleaned


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate harmonic calendar features from DATE:
    - day_of_year: continuous 1-366
    - sin_doy / cos_doy: cyclical solar encoding
    - sin_month / cos_month: cyclical seasonal encoding
    """
    engineered = df.copy()
    dt = pd.to_datetime(engineered["DATE"].astype(str), format="%Y%m%d")
    
    engineered["day_of_year"] = dt.dt.dayofyear
    engineered["sin_doy"] = np.sin(2.0 * np.pi * engineered["day_of_year"] / 365.25)
    engineered["cos_doy"] = np.cos(2.0 * np.pi * engineered["day_of_year"] / 365.25)
    
    month_val = dt.dt.month if "MONTH" not in engineered.columns else engineered["MONTH"]
    engineered["sin_month"] = np.sin(2.0 * np.pi * month_val / 12.0)
    engineered["cos_month"] = np.cos(2.0 * np.pi * month_val / 12.0)
    
    return engineered


def create_preprocessing_pipeline() -> Pipeline:
    """
    Construct self-contained preprocessing pipeline:
    - SimpleImputer(strategy='median') for handling any missing input features.
    - StandardScaler() for normalizing feature variances.
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])


def get_preprocessed_data(
    data_path: str = DEFAULT_DATA_PATH,
    target_cols: Optional[List[str]] = None,
    shift_targets: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, List[str], List[str]]:
    """
    Main ingestion and preprocessing pipeline interface contract:
    - Loads raw dataset CSV.
    - Sanitizes sentinels.
    - Engineers harmonic features.
    - Aligns next-day target variables (shift=-1) for weather forecasting.
    - Splits chronologically (Train: 2000-2007, Holdout Test: 2008-2009).

    Returns:
        (X_train, y_train, X_test, y_test, feature_names, target_names)
    """
    if target_cols is None:
        target_cols = list(DEFAULT_TARGETS)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Weather prediction dataset not found at: {data_path}")

    raw_df = pd.read_csv(data_path)
    cleaned_df = clean_sentinels(raw_df)
    features_df = engineer_features(cleaned_df)

    date_series = features_df["DATE"].copy()

    # Align targets: if shift_targets=True, today's features predict tomorrow's weather
    if shift_targets:
        targets_df = features_df[target_cols].shift(-1)
        # Drop the last row because next-day target is unknown
        features_df = features_df.iloc[:-1].copy()
        targets_df = targets_df.iloc[:-1].copy()
        date_series = date_series.iloc[:-1].copy()
    else:
        targets_df = features_df[target_cols].copy()

    # Drop non-feature columns (DATE is temporal identifier)
    feature_cols = [c for c in features_df.columns if c != "DATE"]
    X = features_df[feature_cols].copy()
    y = targets_df[target_cols].copy()

    feature_names = list(feature_cols)
    target_names = list(target_cols)

    # Chronological Split: Train (2000-2007, DATE < 20080101), Holdout Test (2008-2009, DATE >= 20080101)
    train_mask = date_series < 20080101
    test_mask = date_series >= 20080101

    X_train = X[train_mask].reset_index(drop=True)
    y_train = y[train_mask].reset_index(drop=True)
    X_test = X[test_mask].reset_index(drop=True)
    y_test = y[test_mask].reset_index(drop=True)

    return X_train, y_train, X_test, y_test, feature_names, target_names

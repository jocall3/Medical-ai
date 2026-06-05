import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from src.monitoring.monitoring_config import MonitoringConfig

class VitalSignPreprocessor:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.vital_keys = config.VITAL_SIGNS_KEYS
        self.norm_params = config.NORMALIZATION_PARAMS

    def clean_and_clamp(self, key: str, value: float) -> float:
        """Clamps extreme outliers to physiological limits."""
        if key not in self.norm_params:
            return value
        limits = self.norm_params[key]
        return float(np.clip(value, limits["min"], limits["max"]))

    def normalize(self, key: str, value: float) -> float:
        """Z-score normalization based on clinical population statistics."""
        if key not in self.norm_params:
            return value
        params = self.norm_params[key]
        clamped = self.clean_and_clamp(key, value)
        return (clamped - params["mean"]) / params["std"]

    def denormalize(self, key: str, normalized_value: float) -> float:
        """Reverts Z-score normalization back to physiological units."""
        if key not in self.norm_params:
            return normalized_value
        params = self.norm_params[key]
        return (normalized_value * params["std"]) + params["mean"]

    def preprocess_stream_window(self, raw_sequence: List[Dict[str, float]]) -> np.ndarray:
        """
        Takes a raw sequence of vital sign dictionaries, aligns them,
        imputes missing values using forward-fill then mean-fill,
        and normalizes the output into a numpy array of shape (sequence_length, input_dim).
        """
        df = pd.DataFrame(raw_sequence)
        
        # Ensure all vital sign columns exist
        for key in self.vital_keys:
            if key not in df.columns:
                df[key] = np.nan

        # Reorder columns to match config
        df = df[self.vital_keys]

        # Forward fill missing values, then fill remaining NaNs with population means
        df = df.ffill()
        for key in self.vital_keys:
            mean_val = self.norm_params[key]["mean"]
            df[key] = df[key].fillna(mean_val)

        # Clamp and Normalize
        normalized_data = np.zeros((len(df), len(self.vital_keys)), dtype=np.float32)
        for i, key in enumerate(self.vital_keys):
            clamped_series = df[key].apply(lambda x: self.clean_and_clamp(key, x))
            normalized_data[:, i] = (clamped_series - self.norm_params[key]["mean"]) / self.norm_params[key]["std"]

        # Ensure sequence length matches config by padding or truncating
        target_len = self.config.SEQUENCE_LENGTH
        current_len = len(normalized_data)
        if current_len < target_len:
            # Zero-pad at the beginning (pre-padding)
            padding = np.zeros((target_len - current_len, len(self.vital_keys)), dtype=np.float32)
            normalized_data = np.vstack([padding, normalized_data])
        elif current_len > target_len:
            # Truncate to keep the most recent data
            normalized_data = normalized_data[-target_len:]

        return normalized_data

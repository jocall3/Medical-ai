import numpy as np
from scipy.stats import ks_2samp

class ModelDriftMonitor:
    def __init__(self, baseline_distribution):
        self.baseline = baseline_distribution

    def detect_drift(self, current_batch, threshold=0.05):
        stat, p_value = ks_2samp(self.baseline, current_batch)
        return p_value < threshold, p_value
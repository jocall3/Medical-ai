import unittest
import numpy as np

class ModelDriftDetector:
    """
    Detects when the AI's performance or input distribution drops/shifts
    due to changes in patient demographics (e.g., age, comorbidities).
    Uses Population Stability Index (PSI) to measure drift.
    """
    def __init__(self, threshold=0.2):
        self.threshold = threshold

    def calculate_psi(self, baseline: np.ndarray, current: np.ndarray, bins=10) -> float:
        """
        Calculates the Population Stability Index (PSI) between baseline and current distributions.
        """
        bin_edges = np.histogram_bin_edges(baseline, bins=bins)
        
        baseline_counts, _ = np.histogram(baseline, bins=bin_edges)
        current_counts, _ = np.histogram(current, bins=bin_edges)
        
        baseline_pct = (baseline_counts / len(baseline)) + 1e-5
        current_pct = (current_counts / len(current)) + 1e-5
        
        psi_value = np.sum((current_pct - baseline_pct) * np.log(current_pct / baseline_pct))
        return float(psi_value)

    def is_drift_detected(self, baseline: np.ndarray, current: np.ndarray) -> bool:
        psi = self.calculate_psi(baseline, current)
        return psi > self.threshold

class TestModelDriftDetector(unittest.TestCase):
    def setUp(self):
        self.detector = ModelDriftDetector(threshold=0.2)
        np.random.seed(42)
        self.baseline_ages = np.random.normal(loc=45, scale=15, size=1000)

    def test_no_drift(self):
        current_ages = np.random.normal(loc=45, scale=15, size=1000)
        psi = self.detector.calculate_psi(self.baseline_ages, current_ages)
        print(f'[Drift Test] PSI (No Drift): {psi:.4f}')
        self.assertFalse(self.detector.is_drift_detected(self.baseline_ages, current_ages))

    def test_significant_demographic_drift(self):
        current_ages = np.random.normal(loc=65, scale=12, size=1000)
        psi = self.detector.calculate_psi(self.baseline_ages, current_ages)
        print(f'[Drift Test] PSI (Significant Drift): {psi:.4f}')
        self.assertTrue(self.detector.is_drift_detected(self.baseline_ages, current_ages),
                        'Should detect significant demographic drift.')

if __name__ == '__main__':
    unittest.main()
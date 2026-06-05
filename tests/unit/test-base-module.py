import unittest
from unittest.mock import MagicMock, patch
import numpy as np

class TestBaseMedicalAIModule(unittest.TestCase):
    """
    Base template for unit testing any new medical AI module.
    Provides standard setup, teardown, mock data generation, and safety assertion helpers.
    """
    def setUp(self):
        self.random_seed = 42
        np.random.seed(self.random_seed)
        
    def tearDown(self):
        pass

    def generate_mock_patient_data(self, num_samples=10):
        """Helper to generate synthetic patient clinical data for testing."""
        return {
            "age": np.random.randint(18, 90, size=num_samples),
            "systolic_bp": np.random.randint(90, 180, size=num_samples),
            "diastolic_bp": np.random.randint(60, 110, size=num_samples),
            "heart_rate": np.random.randint(50, 120, size=num_samples),
            "temperature": np.random.uniform(36.0, 40.0, size=num_samples),
            "oxygen_saturation": np.random.uniform(85.0, 100.0, size=num_samples)
        }

    def assert_safety_bounds(self, predictions, min_val, max_val):
        """Asserts that model predictions fall within clinically safe/realistic bounds."""
        predictions = np.array(predictions)
        self.assertTrue(np.all(predictions >= min_val), f"Predictions fell below safe minimum: {min_val}")
        self.assertTrue(np.all(predictions <= max_val), f"Predictions exceeded safe maximum: {max_val}")

    def test_template_placeholder(self):
        """Placeholder test to verify the base test class functions correctly."""
        data = self.generate_mock_patient_data(5)
        self.assertEqual(len(data["age"]), 5)
        self.assert_safety_bounds(data["oxygen_saturation"], 0.0, 100.0)

if __name__ == "__main__":
    unittest.main()
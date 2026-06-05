import unittest
import numpy as np

class RobustTriageTrainer:
    """
    A training pipeline simulator for Triage AI that includes anomaly detection
    and robust loss functions to mitigate training data poisoning.
    """
    def __init__(self, contamination_threshold=0.1):
        self.contamination_threshold = contamination_threshold
        self.weights = np.zeros(3)
        self.bias = 0.0

    def detect_outliers(self, X, y):
        # Simple Mahalanobis or Z-score distance to detect poisoned labels
        mean = np.mean(X, axis=0)
        std = np.std(X, axis=0) + 1e-5
        z_scores = np.abs((X - mean) / std)
        max_z = np.max(z_scores, axis=1)
        
        # Filter out samples that are extreme outliers
        clean_indices = max_z < 3.0
        return clean_indices

    def train(self, X, y):
        # Filter poisoned data
        clean_indices = self.detect_outliers(X, y)
        X_clean, y_clean = X[clean_indices], y[clean_indices]
        
        # Train using a robust loss (Huber-like or simple gradient descent)
        # to prevent remaining small poison samples from dominating gradients
        for _ in range(100):
            predictions = 1 / (1 + np.exp(-(np.dot(X_clean, self.weights) + self.bias)))
            errors = y_clean - predictions
            # Huber-like gradient clipping to mitigate high-leverage poisoned points
            clipped_errors = np.clip(errors, -0.5, 0.5)
            
            self.weights += 0.01 * np.dot(X_clean.T, clipped_errors) / len(X_clean)
            self.bias += 0.01 * np.sum(clipped_errors) / len(X_clean)

    def predict(self, X):
        return 1 / (1 + np.exp(-(np.dot(X, self.weights) + self.bias)))

class TestInputPoisoning(unittest.TestCase):
    def setUp(self):
        # Features: [HeartRate_Normalized, PainScale_Normalized, OxygenSat_Normalized]
        # Normal emergency: High heart rate, high pain, low oxygen -> Priority 1 (Emergency)
        self.X_clean = np.array([
            [0.9, 0.9, 0.2], # Emergency
            [0.8, 0.8, 0.3], # Emergency
            [0.2, 0.2, 0.9], # Non-emergency
            [0.3, 0.1, 0.95], # Non-emergency
            [0.1, 0.3, 0.9], # Non-emergency
        ])
        self.y_clean = np.array([1.0, 1.0, 0.0, 0.0, 0.0])

    def test_poisoning_mitigation(self):
        # Injecting a malicious poisoned sample:
        # An extreme emergency case labeled as non-emergency (0.0) to trick the model
        # into ignoring critical patients.
        poison_X = np.array([[0.95, 0.95, 0.1]]) # Extreme emergency
        poison_y = np.array([0.0]) # Maliciously labeled as non-emergency

        X_poisoned = np.vstack([self.X_clean, poison_X])
        y_poisoned = np.concatenate([self.y_clean, poison_y])

        # Train standard model (no defense) vs Robust model
        trainer_robust = RobustTriageTrainer()
        trainer_robust.train(X_poisoned, y_poisoned)

        # Test on a clean emergency case
        test_case = np.array([[0.85, 0.85, 0.25]])
        prediction = trainer_robust.predict(test_case)[0]

        print(f'[Poisoning Test] Robust Model Prediction for Emergency: {prediction:.4f}')
        # The robust model should successfully filter or ignore the poisoned sample
        self.assertGreater(prediction, 0.7, 'Robust trainer failed to mitigate input poisoning attack.')

if __name__ == '__main__':
    unittest.main()
import unittest
import numpy as np

class MockLSTMMonitoringEngine:
    def __init__(self):
        self.hidden_state = np.zeros((1, 64))
        self.cell_state = np.zeros((1, 64))

    def reset_states(self):
        self.hidden_state = np.zeros((1, 64))
        self.cell_state = np.zeros((1, 64))

    def process_sequence(self, vitals_sequence):
        anomalies_detected = []
        for t, step in enumerate(vitals_sequence):
            hr, spo2, temp = step
            self.hidden_state += 0.01 * np.random.randn(1, 64)
            is_anomaly = False
            reasons = []
            if hr > 140 or hr < 40:
                is_anomaly = True
                reasons.append("Abnormal Heart Rate")
            if spo2 < 90:
                is_anomaly = True
                reasons.append("Hypoxia")
            if temp > 39.5 or temp < 35.0:
                is_anomaly = True
                reasons.append("Abnormal Temperature")
            if is_anomaly:
                anomalies_detected.append({"timestep": t, "reasons": reasons})
        risk_score = min(max(np.linalg.norm(self.hidden_state) / 10.0, 0.0), 1.0)
        return {"risk_score": risk_score, "anomalies": anomalies_detected}

class TestPatientMonitoring(unittest.TestCase):
    def setUp(self):
        self.engine = MockLSTMMonitoringEngine()

    def test_stable_sequence(self):
        stable_vitals = np.array([
            [72, 98, 36.6],
            [74, 98, 36.7],
            [71, 99, 36.6],
            [73, 98, 36.5],
            [75, 97, 36.6]
        ])
        result = self.engine.process_sequence(stable_vitals)
        self.assertEqual(len(result["anomalies"]), 0)
        self.assertLess(result["risk_score"], 0.5)

    def test_anomalous_sequence(self):
        unstable_vitals = np.array([
            [72, 98, 36.6],
            [74, 98, 36.7],
            [110, 94, 36.8],
            [145, 88, 37.0],
            [150, 85, 37.2]
        ])
        result = self.engine.process_sequence(unstable_vitals)
        self.assertGreater(len(result["anomalies"]), 0)
        timesteps_with_anomalies = [a["timestep"] for a in result["anomalies"]]
        self.assertIn(3, timesteps_with_anomalies)
        self.assertIn(4, timesteps_with_anomalies)

    def test_state_reset(self):
        self.engine.hidden_state = np.ones((1, 64))
        self.engine.reset_states()
        self.assertTrue(np.all(self.engine.hidden_state == 0.0))

if __name__ == "__main__":
    unittest.main()
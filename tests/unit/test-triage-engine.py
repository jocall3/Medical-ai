import unittest
import numpy as np

class MockPSNNTriageEngine:
    def __init__(self):
        self.weights = np.array([0.3, 0.2, 0.1, 0.4])

    def predict_severity_score(self, hr, temp, spo2, age):
        norm_hr = min(max((hr - 60) / 60, 0), 1)
        norm_temp = min(max((temp - 36.5) / 3.5, 0), 1)
        norm_spo2 = min(max((100 - spo2) / 15, 0), 1)
        norm_age = min(max(age / 100, 0), 1)
        features = np.array([norm_hr, norm_temp, norm_spo2, norm_age])
        score = np.dot(features, self.weights)
        return float(score)

    def get_triage_category(self, score):
        if score > 0.7:
            return "RED"
        elif score > 0.4:
            return "YELLOW"
        else:
            return "GREEN"

class TestTriageEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MockPSNNTriageEngine()

    def test_critical_patient_triage(self):
        score = self.engine.predict_severity_score(hr=130, temp=40.0, spo2=85, age=85)
        category = self.engine.get_triage_category(score)
        self.assertEqual(category, "RED")
        self.assertGreaterEqual(score, 0.7)

    def test_stable_patient_triage(self):
        score = self.engine.predict_severity_score(hr=72, temp=36.6, spo2=99, age=25)
        category = self.engine.get_triage_category(score)
        self.assertEqual(category, "GREEN")
        self.assertLess(score, 0.4)

    def test_edge_case_inputs(self):
        score_extreme = self.engine.predict_severity_score(hr=300, temp=45.0, spo2=50, age=150)
        self.assertTrue(0.0 <= score_extreme <= 1.0)

if __name__ == "__main__":
    unittest.main()
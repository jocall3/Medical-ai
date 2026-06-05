import unittest
import numpy as np

class MockAPBS:
    def calculate_hrv_features(self, rr_intervals):
        diffs = np.diff(rr_intervals)
        rmssd = np.sqrt(np.mean(diffs ** 2))
        return {"RMSSD": rmssd}

    def analyze_speech_features(self, audio_signal):
        f0_mean = np.mean(audio_signal) * 100 + 120
        jitter = np.std(audio_signal) * 0.02
        return {"F0_mean": f0_mean, "jitter": jitter}

    def classify_state(self, hrv_features, speech_features, phq9_score):
        score = 0.0
        if hrv_features["RMSSD"] < 20:
            score += 0.4
        if speech_features["jitter"] > 0.05:
            score += 0.3
        score += (phq9_score / 27) * 0.3
        if score > 0.6:
            return "DEPRESSIVE_STATE_RISK"
        elif score > 0.3:
            return "ELEVATED_STRESS"
        else:
            return "STABLE"

class TestPsychiatricBiomarker(unittest.TestCase):
    def setUp(self):
        self.apbs = MockAPBS()

    def test_hrv_calculation(self):
        rr_intervals = np.array([800, 820, 790, 810, 830])
        features = self.apbs.calculate_hrv_features(rr_intervals)
        self.assertIn("RMSSD", features)
        self.assertGreater(features["RMSSD"], 0)

    def test_speech_feature_extraction(self):
        mock_audio = np.random.rand(1000)
        features = self.apbs.analyze_speech_features(mock_audio)
        self.assertIn("F0_mean", features)
        self.assertIn("jitter", features)

    def test_state_classification(self):
        hrv = {"RMSSD": 15}
        speech = {"F0_mean": 150, "jitter": 0.06}
        phq9 = 20
        state = self.apbs.classify_state(hrv, speech, phq9)
        self.assertEqual(state, "DEPRESSIVE_STATE_RISK")
        hrv_stable = {"RMSSD": 50}
        speech_stable = {"F0_mean": 120, "jitter": 0.01}
        phq_stable = 2
        state_stable = self.apbs.classify_state(hrv_stable, speech_stable, phq_stable)
        self.assertEqual(state_stable, "STABLE")

if __name__ == "__main__":
    unittest.main()
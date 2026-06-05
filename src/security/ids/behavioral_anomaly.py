import numpy as np

class BehavioralAnomalyDetector:
    def __init__(self):
        self.baseline = 0.5

    def detect(self, traffic_features):
        score = np.mean(traffic_features)
        return score > 0.85
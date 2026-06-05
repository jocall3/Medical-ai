import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.05)

    def train(self, data):
        self.model.fit(data)

    def predict(self, data):
        return self.model.predict(data) # -1 for anomaly, 1 for normal
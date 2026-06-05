import unittest
from src.longevity.aging_clock_predictor import AgingClockPredictor

class TestLongevity(unittest.TestCase):
    def test_clock_init(self):
        model = AgingClockPredictor(100)
        self.assertIsNotNone(model)
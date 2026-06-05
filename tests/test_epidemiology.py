import unittest
from src.epidemiology.transmission_modeler import HybridSEIRModel

class TestEpidemiology(unittest.TestCase):
    def test_model_init(self):
        model = HybridSEIRModel({'beta': 0.1})
        self.assertIsNotNone(model)
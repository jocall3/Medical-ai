import unittest
from src.drug_discovery.molecular_generator import MolecularVAE

class TestDrugDiscovery(unittest.TestCase):
    def test_vae_output(self):
        model = MolecularVAE()
        self.assertIsNotNone(model)
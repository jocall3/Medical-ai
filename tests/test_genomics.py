import unittest
from src.genomics.variant_caller import VariantCNN

class TestGenomics(unittest.TestCase):
    def test_cnn_init(self):
        model = VariantCNN()
        self.assertIsNotNone(model)
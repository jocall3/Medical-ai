import unittest
import numpy as np

class MockDenseNet121RadiologyModel:
    def __init__(self):
        self.num_classes = 3

    def preprocess_image(self, image_array):
        if image_array.ndim != 3:
            raise ValueError("Image must be 3-dimensional (H, W, C)")
        return image_array / 255.0

    def predict(self, preprocessed_image):
        mean_val = np.mean(preprocessed_image)
        if mean_val > 0.6:
            return np.array([0.8, 0.1, 0.1])
        elif mean_val < 0.3:
            return np.array([0.1, 0.8, 0.1])
        else:
            return np.array([0.1, 0.1, 0.8])

    def generate_gradcam(self, image_array):
        return np.random.rand(image_array.shape[0], image_array.shape[1])

class TestRadiologyModel(unittest.TestCase):
    def setUp(self):
        self.model = MockDenseNet121RadiologyModel()

    def test_preprocess_image_shape_validation(self):
        invalid_image = np.random.rand(224, 224)
        with self.assertRaises(ValueError):
            self.model.preprocess_image(invalid_image)

    def test_prediction_output_format(self):
        valid_image = np.random.rand(224, 224, 3) * 255
        preprocessed = self.model.preprocess_image(valid_image)
        predictions = self.model.predict(preprocessed)
        self.assertEqual(len(predictions), 3)
        self.assertAlmostEqual(np.sum(predictions), 1.0)

    def test_gradcam_generation(self):
        image = np.random.rand(224, 224, 3)
        heatmap = self.model.generate_gradcam(image)
        self.assertEqual(heatmap.shape, (224, 224))
        self.assertTrue(np.all(heatmap >= 0.0) and np.all(heatmap <= 1.0))

if __name__ == "__main__":
    unittest.main()
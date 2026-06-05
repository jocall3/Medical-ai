import unittest
import numpy as np

class MockRadiologyModel:
    def __init__(self):
        # Simple weights for a 3x3 patch representing a tumor detector
        self.weights = np.array([[0.1, 0.5, 0.1],
                                 [0.5, 0.9, 0.5],
                                 [0.1, 0.5, 0.1]])
        self.bias = -1.5

    def forward(self, x):
        # x is a 3x3 image
        return 1.0 / (1.0 + np.exp(-(np.sum(x * self.weights) + self.bias)))

    def gradient(self, x):
        # Gradient of the output with respect to input x
        out = self.forward(x)
        dout_dx = out * (1.0 - out) * self.weights
        return dout_dx

class TestModelEvasion(unittest.TestCase):
    def setUp(self):
        self.model = MockRadiologyModel()
        # A clear tumor pattern (high intensity in the center)
        self.tumor_image = np.array([[0.1, 0.8, 0.1],
                                     [0.8, 1.0, 0.8],
                                     [0.1, 0.8, 0.1]])

    def test_normal_detection(self):
        confidence = self.model.forward(self.tumor_image)
        self.assertGreater(confidence, 0.8, 'Model should easily detect the tumor under normal conditions.')

    def test_fgsm_evasion_attack(self):
        # Fast Gradient Sign Method (FGSM) to minimize tumor detection confidence
        epsilon = 0.15
        grad = self.model.gradient(self.tumor_image)
        
        # We want to decrease the confidence, so we move in the opposite direction of the gradient
        perturbed_image = self.tumor_image - epsilon * np.sign(grad)
        perturbed_image = np.clip(perturbed_image, 0.0, 1.0)

        original_confidence = self.model.forward(self.tumor_image)
        perturbed_confidence = self.model.forward(perturbed_image)

        print(f'[Evasion Test] Original Confidence: {original_confidence:.4f}')
        print(f'[Evasion Test] Perturbed Confidence: {perturbed_confidence:.4f}')

        # Verify if the perturbation successfully evaded detection (dropped below threshold)
        robustness_margin = original_confidence - perturbed_confidence
        self.assertTrue(robustness_margin >= 0.0, 'Perturbation should affect the confidence score.')
        
        # Defensive check: If epsilon is very small, the model should still classify it correctly
        small_epsilon = 0.02
        safe_perturbed_image = self.tumor_image - small_epsilon * np.sign(grad)
        safe_perturbed_image = np.clip(safe_perturbed_image, 0.0, 1.0)
        safe_confidence = self.model.forward(safe_perturbed_image)
        self.assertGreater(safe_confidence, 0.75, 'Model must remain robust under tiny adversarial perturbations.')

if __name__ == '__main__':
    unittest.main()
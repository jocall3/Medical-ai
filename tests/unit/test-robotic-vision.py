import unittest
import numpy as np

class MockRoboticVisionEngine:
    def segment_tissue_boundaries(self, frame):
        H, W, _ = frame.shape
        critical_mask = np.zeros((H, W), dtype=np.uint8)
        tool_mask = np.zeros((H, W), dtype=np.uint8)
        critical_mask[H//2-10:H//2+10, :] = 1
        tool_mask[0:H//4, W//2-5:W//2+5] = 1
        return {"critical_mask": critical_mask, "tool_mask": tool_mask}

    def calculate_minimum_distance(self, critical_mask, tool_mask):
        critical_coords = np.argwhere(critical_mask > 0)
        tool_coords = np.argwhere(tool_mask > 0)
        if len(critical_coords) == 0 or len(tool_coords) == 0:
            return float("inf")
        min_dist = float("inf")
        for tc in tool_coords[::5]:
            dists = np.linalg.norm(critical_coords - tc, axis=1)
            min_dist = min(min_dist, np.min(dists))
        return float(min_dist)

    def check_safety_violation(self, distance, threshold=15.0):
        return distance < threshold

class TestRoboticVision(unittest.TestCase):
    def setUp(self):
        self.engine = MockRoboticVisionEngine()

    def test_segmentation_output_shapes(self):
        frame = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
        masks = self.engine.segment_tissue_boundaries(frame)
        self.assertEqual(masks["critical_mask"].shape, (100, 100))
        self.assertEqual(masks["tool_mask"].shape, (100, 100))

    def test_distance_calculation(self):
        critical_mask = np.zeros((100, 100), dtype=np.uint8)
        tool_mask = np.zeros((100, 100), dtype=np.uint8)
        critical_mask[50, 50] = 1
        tool_mask[30, 50] = 1
        distance = self.engine.calculate_minimum_distance(critical_mask, tool_mask)
        self.assertAlmostEqual(distance, 20.0)

    def test_safety_violation_trigger(self):
        self.assertTrue(self.engine.check_safety_violation(10.0, threshold=15.0))
        self.assertFalse(self.engine.check_safety_violation(25.0, threshold=15.0))

if __name__ == "__main__":
    unittest.main()
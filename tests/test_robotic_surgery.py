import unittest
import numpy as np
import torch
import time
from src.robotic_surgery.surgery_config import SurgeryConfig
from src.robotic_surgery.tissue_segmentation import TissueSegmentationViTUNet
from src.robotic_surgery.spatial_mapper import SpatialMapper
from src.robotic_surgery.latency_monitor import LatencyMonitor
from src.robotic_surgery.safety_watchdog import SafetyWatchdog
from src.robotic_surgery.robotic_controller_interface import RoboticControllerInterface

class TestRoboticSurgeryPipeline(unittest.TestCase):
    def setUp(self):
        self.config = SurgeryConfig()
        
    def test_tissue_segmentation_shape(self):
        """Tests that the segmentation model outputs the correct shape and number of classes."""
        model = TissueSegmentationViTUNet(
            img_size=512,
            in_channels=3,
            num_classes=self.config.segmentation.num_classes
        )
        model.eval()
        dummy_input = torch.randn(1, 3, 512, 512)
        with torch.no_grad():
            output = model(dummy_input)
            
        expected_shape = (1, self.config.segmentation.num_classes, 512, 512)
        self.assertEqual(output.shape, expected_shape)

    def test_spatial_mapper_accuracy(self):
        """Tests that the spatial mapper correctly transforms pixel coordinates to robot coordinates."""
        mapper = SpatialMapper(self.config)
        
        u, v = 960.0, 540.0
        depth = 100.0
        
        point_cam = mapper.pixel_to_camera_frame(u, v, depth)
        self.assertAlmostEqual(point_cam[0], 0.0, places=4)
        self.assertAlmostEqual(point_cam[1], 0.0, places=4)
        self.assertAlmostEqual(point_cam[2], depth, places=4)
        
        point_robot = mapper.camera_to_robot_frame(point_cam)
        expected_z = -depth + self.config.robotic.coordinate_offset_xyz[2]
        self.assertAlmostEqual(point_robot[2], expected_z, places=4)

    def test_latency_monitor(self):
        """Tests that the latency monitor correctly tracks stage durations and FPS."""
        monitor = LatencyMonitor(window_size=10, max_allowed_latency_ms=20.0)
        
        for _ in range(5):
            start = monitor.start_stage("segmentation")
            time.sleep(0.005)
            monitor.end_stage("segmentation", start)
            monitor.record_frame()
            
        avg_latency = monitor.get_average_latency("segmentation")
        self.assertTrue(4.0 <= avg_latency <= 15.0)
        self.assertFalse(monitor.is_violating_constraints())

    def test_safety_watchdog_timeout(self):
        """Tests that the safety watchdog triggers an emergency stop on timeout."""
        stop_triggered = False
        
        def emergency_stop_callback():
            nonlocal stop_triggered
            stop_triggered = True
            
        self.config.safety.watchdog_timeout_ms = 10.0
        watchdog = SafetyWatchdog(self.config, emergency_stop_callback)
        
        watchdog.start()
        time.sleep(0.02)
        
        self.assertTrue(stop_triggered)
        watchdog.stop()

    def test_safety_watchdog_boundary_breach(self):
        """Tests that the safety watchdog triggers an emergency stop on boundary breach."""
        stop_triggered = False
        
        def emergency_stop_callback():
            nonlocal stop_triggered
            stop_triggered = True
            
        watchdog = SafetyWatchdog(self.config, emergency_stop_callback)
        watchdog.start()
        
        breach_distance = self.config.safety.critical_boundary_margin_mm - 0.5
        watchdog.check_boundary_breach(breach_distance)
        
        self.assertTrue(stop_triggered)
        watchdog.stop()

if __name__ == "__main__":
    unittest.main()

import numpy as np
from typing import List, Tuple
from src.robotic_surgery.surgery_config import SurgeryConfig

class SpatialMapper:
    """
    Transforms 2D image-space coordinates (pixels) into 3D robotic effector-space coordinates (mm)
    using camera intrinsics, extrinsics, and depth information.
    """
    def __init__(self, config: SurgeryConfig):
        self.config = config
        self.K = np.array(config.camera.intrinsic_matrix, dtype=np.float64)
        self.dist_coeffs = np.array(config.camera.distortion_coefficients, dtype=np.float64)
        
        self.R_cam_to_robot = np.array([
            [1.0,  0.0,  0.0],
            [0.0, -1.0,  0.0],
            [0.0,  0.0, -1.0]
        ], dtype=np.float64)
        
        self.t_cam_to_robot = np.array(config.robotic.coordinate_offset_xyz, dtype=np.float64)

    def pixel_to_camera_frame(self, u: float, v: float, depth_mm: float) -> np.ndarray:
        """
        Converts a 2D pixel coordinate (u, v) and its corresponding depth (Z)
        into a 3D point in the camera coordinate frame.
        """
        fx = self.K[0, 0]
        fy = self.K[1, 1]
        cx = self.K[0, 2]
        cy = self.K[1, 2]
        
        x_c = (u - cx) * depth_mm / fx
        y_c = (v - cy) * depth_mm / fy
        z_c = depth_mm
        
        return np.array([x_c, y_c, z_c], dtype=np.float64)

    def camera_to_robot_frame(self, point_cam: np.ndarray) -> np.ndarray:
        """
        Transforms a 3D point from the camera coordinate frame to the robotic effector coordinate frame.
        """
        point_robot = self.R_cam_to_robot @ point_cam + self.t_cam_to_robot
        return point_robot

    def map_boundaries_to_robot(self, image_boundaries: List[Tuple[float, float]], depth_map: np.ndarray) -> List[np.ndarray]:
        """
        Maps a list of 2D boundary pixels to 3D robot coordinates.
        """
        robot_coordinates = []
        h, w = depth_map.shape
        
        for u, v in image_boundaries:
            u_idx = int(max(0, min(u, w - 1)))
            v_idx = int(max(0, min(v, h - 1)))
            depth = depth_map[v_idx, u_idx]
            
            if depth <= 0:
                depth = 100.0
                
            point_cam = self.pixel_to_camera_frame(u, v, depth)
            point_robot = self.camera_to_robot_frame(point_cam)
            robot_coordinates.append(point_robot)
            
        return robot_coordinates

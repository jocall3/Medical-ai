from dataclasses import dataclass, field
from typing import Tuple, List

@dataclass
class CameraConfig:
    resolution: Tuple[int, int] = (1920, 1080)
    fps: int = 60
    fov: float = 120.0  # degrees
    intrinsic_matrix: List[List[float]] = field(default_factory=lambda: [
        [1150.0, 0.0, 960.0],
        [0.0, 1150.0, 540.0],
        [0.0, 0.0, 1.0]
    ])
    distortion_coefficients: List[float] = field(default_factory=lambda: [
        -0.2, 0.1, 0.0, 0.0, 0.0
    ])

@dataclass
class SegmentationConfig:
    model_path: str = "models/tissue_unet_vit.pt"
    input_size: Tuple[int, int] = (512, 512)
    confidence_threshold: float = 0.85
    num_classes: int = 4  # Background, Safe Tissue, Critical Structure (Artery/Nerve), Instrument
    class_labels: List[str] = field(default_factory=lambda: [
        "background", "safe_tissue", "critical_structure", "instrument"
    ])

@dataclass
class SafetyConfig:
    critical_boundary_margin_mm: float = 2.0  # Minimum distance to critical structures
    max_allowed_latency_ms: float = 16.67     # 1 frame at 60 FPS
    watchdog_timeout_ms: float = 30.0         # Trigger override if no heartbeat in 30ms
    max_velocity_limit_mm_s: float = 50.0     # Maximum robotic arm speed
    emergency_stop_gpio_pin: int = 18

@dataclass
class RoboticInterfaceConfig:
    ip_address: str = "192.168.1.100"
    port: int = 8080
    control_frequency_hz: int = 500
    coordinate_offset_xyz: List[float] = field(default_factory=lambda: [0.0, 0.0, 150.0]) # mm

@dataclass
class SurgeryConfig:
    camera: CameraConfig = field(default_factory=CameraConfig)
    segmentation: SegmentationConfig = field(default_factory=SegmentationConfig)
    safety: SafetyConfig = field(default_factory=SafetyConfig)
    robotic: RoboticInterfaceConfig = field(default_factory=RoboticInterfaceConfig)

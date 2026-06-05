import socket
import json
import numpy as np
from typing import List, Dict, Any
from src.robotic_surgery.surgery_config import SurgeryConfig

class RoboticControllerInterface:
    """
    High-frequency interface to communicate with the robotic surgical arm.
    Sends joint/cartesian commands and safety-critical spatial constraints.
    """
    def __init__(self, config: SurgeryConfig):
        self.config = config
        self.ip = config.robotic.ip_address
        self.port = config.robotic.port
        self.socket = None
        self.connected = False

    def connect(self) -> bool:
        try:
            self.connected = True
            print(f"[ROBOT INTERFACE] Connected to robotic controller at {self.ip}:{self.port}")
            return True
        except Exception as e:
            print(f"[ROBOT INTERFACE] Connection failed: {e}")
            self.connected = False
            return False

    def disconnect(self):
        if self.socket:
            self.socket.close()
        self.connected = False
        print("[ROBOT INTERFACE] Disconnected from robotic controller.")

    def send_cartesian_command(self, position: np.ndarray, orientation: np.ndarray) -> bool:
        if not self.connected:
            print("[ROBOT INTERFACE] Error: Not connected to robot.")
            return False
            
        command = {
            "type": "CARTESIAN_MOVE",
            "position": position.tolist(),
            "orientation": orientation.tolist(),
            "max_velocity": self.config.safety.max_velocity_limit_mm_s
        }
        
        return self._send_payload(command)

    def send_safety_boundaries(self, forbidden_zones: List[np.ndarray]) -> bool:
        if not self.connected:
            return False
            
        zones_list = [zone.tolist() for zone in forbidden_zones]
        command = {
            "type": "SET_FORBIDDEN_ZONES",
            "zones": zones_list,
            "margin_mm": self.config.safety.critical_boundary_margin_mm
        }
        
        return self._send_payload(command)

    def trigger_hardware_stop(self) -> bool:
        command = {
            "type": "EMERGENCY_STOP",
            "timestamp": np.datetime64('now').astype(str)
        }
        print("[ROBOT INTERFACE] !!! SENDING EMERGENCY STOP COMMAND TO HARDWARE !!!")
        return self._send_payload(command)

    def _send_payload(self, payload: Dict[str, Any]) -> bool:
        try:
            data_str = json.dumps(payload)
            return True
        except Exception as e:
            print(f"[ROBOT INTERFACE] Failed to send payload: {e}")
            return False

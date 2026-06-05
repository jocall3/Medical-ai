import time
import threading
from typing import Callable
from src.robotic_surgery.surgery_config import SurgeryConfig

class SafetyWatchdog:
    """
    Monitors the health of the surgical vision pipeline.
    Triggers an emergency stop or manual override if:
    1. The pipeline fails to send a heartbeat within the timeout window.
    2. A critical boundary breach is detected.
    3. Latency constraints are violated.
    """
    def __init__(self, config: SurgeryConfig, emergency_stop_callback: Callable[[], None]):
        self.config = config
        self.emergency_stop_callback = emergency_stop_callback
        self.last_heartbeat_time = time.time()
        self.is_active = False
        self.watchdog_thread = None
        self.lock = threading.Lock()
        self.tripped = False

    def start(self):
        with self.lock:
            if self.is_active:
                return
            self.is_active = True
            self.tripped = False
            self.last_heartbeat_time = time.time()
            self.watchdog_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.watchdog_thread.start()

    def stop(self):
        with self.lock:
            self.is_active = False

    def feed_heartbeat(self):
        with self.lock:
            self.last_heartbeat_time = time.time()

    def check_boundary_breach(self, min_distance_mm: float):
        if min_distance_mm < self.config.safety.critical_boundary_margin_mm:
            self.trigger_emergency_stop("CRITICAL BOUNDARY BREACH DETECTED!")

    def trigger_emergency_stop(self, reason: str):
        with self.lock:
            if not self.tripped:
                self.tripped = True
                self.is_active = False
                print(f"[SAFETY WATCHDOG] EMERGENCY STOP TRIGGERED: {reason}")
                self.emergency_stop_callback()

    def _monitor_loop(self):
        timeout_s = self.config.safety.watchdog_timeout_ms / 1000.0
        while self.is_active:
            time.sleep(0.005)
            with self.lock:
                if not self.is_active:
                    break
                elapsed = time.time() - self.last_heartbeat_time
                if elapsed > timeout_s:
                    self.trigger_emergency_stop(f"Pipeline heartbeat timeout! Elapsed: {elapsed*1000:.2f}ms")
                    break

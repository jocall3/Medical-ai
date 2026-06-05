import time
from collections import deque
from typing import Dict

class LatencyMonitor:
    """
    Monitors the latency of individual pipeline stages and overall frame rate.
    Ensures safety-critical temporal constraints are met.
    """
    def __init__(self, window_size: int = 100, max_allowed_latency_ms: float = 16.67):
        self.window_size = window_size
        self.max_allowed_latency_ms = max_allowed_latency_ms
        self.stage_latencies = {}
        self.frame_timestamps = deque(maxlen=window_size)
        
    def start_stage(self, stage_name: str) -> float:
        return time.perf_counter()

    def end_stage(self, stage_name: str, start_time: float) -> float:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        if stage_name not in self.stage_latencies:
            self.stage_latencies[stage_name] = deque(maxlen=self.window_size)
        self.stage_latencies[stage_name].append(duration_ms)
        return duration_ms

    def record_frame(self):
        self.frame_timestamps.append(time.perf_counter())

    def get_fps(self) -> float:
        if len(self.frame_timestamps) < 2:
            return 0.0
        total_time = self.frame_timestamps[-1] - self.frame_timestamps[0]
        if total_time == 0:
            return 0.0
        return (len(self.frame_timestamps) - 1) / total_time

    def get_average_latency(self, stage_name: str) -> float:
        if stage_name not in self.stage_latencies or not self.stage_latencies[stage_name]:
            return 0.0
        return sum(self.stage_latencies[stage_name]) / len(self.stage_latencies[stage_name])

    def get_total_pipeline_latency(self) -> float:
        return sum(self.get_average_latency(stage) for stage in self.stage_latencies)

    def is_violating_constraints(self) -> bool:
        return self.get_total_pipeline_latency() > self.max_allowed_latency_ms

    def get_report(self) -> Dict[str, float]:
        report = {
            "fps": self.get_fps(),
            "total_latency_ms": self.get_total_pipeline_latency(),
            "violating_constraints": self.is_violating_constraints()
        }
        for stage in self.stage_latencies:
            report[f"stage_{stage}_avg_ms"] = self.get_average_latency(stage)
        return report

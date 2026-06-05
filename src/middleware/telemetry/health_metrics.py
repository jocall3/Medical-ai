import os
import time
import threading
import logging
import subprocess
from typing import Dict, Any, Optional
from opentelemetry import metrics

logger = logging.getLogger(__name__)

class AIInferenceNodeHealthCollector:
    """
    Periodically collects and records health metrics specific to AI inference nodes,
    such as GPU memory utilization, model load times, inference queue depth,
    and medical safety guardrail violations.
    """
    
    def __init__(self, interval_seconds: int = 10):
        self.interval_seconds = interval_seconds
        self.meter = metrics.get_meter("medical.ai.node.health")
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

        # Initialize instruments
        self.gpu_memory_util = self.meter.create_gauge(
            name="medical.ai.gpu.memory.utilization",
            description="GPU memory utilization percentage",
            unit="%"
        )
        self.gpu_temp = self.meter.create_gauge(
            name="medical.ai.gpu.temperature",
            description="GPU temperature in Celsius",
            unit="C"
        )
        self.inference_queue_depth = self.meter.create_gauge(
            name="medical.ai.inference.queue.depth",
            description="Number of inference requests waiting in queue",
            unit="1"
        )
        self.guardrail_violations = self.meter.create_counter(
            name="medical.ai.safety.guardrail.violations",
            description="Number of medical safety guardrail violations detected",
            unit="1"
        )
        self.model_load_time = self.meter.create_histogram(
            name="medical.ai.model.load.time",
            description="Time taken to load AI models into memory",
            unit="ms"
        )

    def start(self) -> None:
        """Starts the background collection thread."""
        if self._thread is not None:
            logger.warning("Health collector thread is already running.")
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        logger.info("AI Inference Node Health Collector started.")

    def stop(self) -> None:
        """Stops the background collection thread."""
        if self._thread is None:
            return
        self._stop_event.set()
        self._thread.join(timeout=5)
        self._thread = None
        logger.info("AI Inference Node Health Collector stopped.")

    def record_guardrail_violation(self, rule_name: str, severity: str) -> None:
        """
        Helper to record a medical safety guardrail violation.
        """
        self.guardrail_violations.add(1, {"rule.name": rule_name, "severity": severity})

    def record_model_load_time(self, model_name: str, duration_ms: float) -> None:
        """
        Helper to record model load times.
        """
        self.model_load_time.record(duration_ms, {"model.name": model_name})

    def _run(self) -> None:
        while not self._stop_event.is_set():
            try:
                self._collect_gpu_metrics()
                self._collect_queue_metrics()
            except Exception as e:
                logger.error(f"Error collecting AI node health metrics: {e}")
            time.sleep(self.interval_seconds)

    def _collect_gpu_metrics(self) -> None:
        """Queries nvidia-smi to record GPU health metrics."""
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.memory,temperature.gpu", "--format=csv,noheader,nounits"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=2
            )
            if result.returncode == 0 and result.stdout:
                parts = result.stdout.strip().split(",")
                if len(parts) >= 2:
                    mem_util = float(parts[0].strip())
                    temp = float(parts[1].strip())
                    
                    self.gpu_memory_util.set(mem_util, {"device": "gpu0"})
                    self.gpu_temp.set(temp, {"device": "gpu0"})
        except Exception:
            # Fallback or ignore if nvidia-smi is not available
            pass

    def _collect_queue_metrics(self) -> None:
        """Records the current inference queue depth (mocked or integrated with queue manager)."""
        queue_depth = int(os.getenv("INFERENCE_QUEUE_DEPTH", "0"))
        self.inference_queue_depth.set(queue_depth)

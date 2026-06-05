import time
import json
import os

try:
    import pynvml
    NVML_AVAILABLE = True
except ImportError:
    NVML_AVAILABLE = False

class GPUMonitor:
    def __init__(self):
        self.enabled = NVML_AVAILABLE
        if self.enabled:
            try:
                pynvml.nvmlInit()
                self.device_count = pynvml.nvmlDeviceGetCount()
            except Exception as e:
                print(f"Failed to initialize NVML: {e}. Falling back to mock mode.")
                self.enabled = False
        else:
            print("pynvml not installed. Running in Mock/Simulation mode.")
            self.device_count = 1

    def get_metrics(self):
        metrics = []
        if self.enabled:
            for i in range(self.device_count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode('utf-8')
                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                temp = pynvml.nvmlDeviceGetTemperature(handle, 0)
                power = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0
                metrics.append({
                    "gpu_index": i,
                    "name": name,
                    "vram_used_mb": mem_info.used / (1024 ** 2),
                    "vram_total_mb": mem_info.total / (1024 ** 2),
                    "vram_utilization_percent": (mem_info.used / mem_info.total) * 100.0,
                    "gpu_compute_utilization_percent": util.gpu,
                    "temperature_c": temp,
                    "power_draw_watts": power
                })
        else:
            metrics.append({
                "gpu_index": 0,
                "name": "NVIDIA A100-SXM4-80GB (Mock)",
                "vram_used_mb": 42150.0 + (time.time() % 10) * 150.0,
                "vram_total_mb": 81920.0,
                "vram_utilization_percent": 51.4,
                "gpu_compute_utilization_percent": 85.0 + (time.time() % 5) * 2.5,
                "temperature_c": 68.0,
                "power_draw_watts": 245.5
            })
        return metrics

    def monitor_session(self, duration_seconds=10, interval_seconds=1):
        print(f"Starting GPU Utilization Monitor for {duration_seconds} seconds...")
        history = []
        start_time = time.time()
        while time.time() - start_time < duration_seconds:
            current_metrics = self.get_metrics()
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            for m in current_metrics:
                m["timestamp"] = timestamp
                print(f"[{timestamp}] GPU {m['gpu_index']} ({m['name']}): Compute: {m['gpu_compute_utilization_percent']}% | VRAM: {m['vram_used_mb']:.1f}/{m['vram_total_mb']:.1f} MB | Temp: {m['temperature_c']}C")
                history.append(m)
            time.sleep(interval_seconds)
        os.makedirs("reports", exist_ok=True)
        with open("reports/gpu_utilization_report.json", "w") as f:
            json.dump(history, f, indent=2)
        print("GPU monitoring session completed. Report saved to reports/gpu_utilization_report.json")

if __name__ == "__main__":
    monitor = GPUMonitor()
    monitor.monitor_session(duration_seconds=5, interval_seconds=1)

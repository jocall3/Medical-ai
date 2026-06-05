import time
import numpy as np
import json
import os

class MockRadiologyModel:
    def __init__(self):
        time.sleep(0.5)
    
    def forward(self, x):
        _ = np.dot(x[0, 0, :64, :64], x[0, 0, :64, :64])
        time.sleep(0.045 + np.random.exponential(0.005))
        return np.random.rand(1, 3, 512, 512)

def run_benchmark(num_images=100, image_shape=(1, 1, 512, 512)):
    print(f"Initializing Radiology AI Latency Benchmark with {num_images} DICOM frames...")
    model = MockRadiologyModel()
    latencies = []
    
    print("Running warm-up iterations...")
    for _ in range(10):
        mock_dicom = np.random.rand(*image_shape).astype(np.float32)
        _ = model.forward(mock_dicom)
        
    print("Starting benchmark...")
    for i in range(num_images):
        mock_dicom = np.random.rand(*image_shape).astype(np.float32)
        start_time = time.perf_counter()
        _ = model.forward(mock_dicom)
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000.0
        latencies.append(latency_ms)
        if (i + 1) % 20 == 0:
            print(f"Processed {i + 1}/{num_images} frames. Current mean: {np.mean(latencies):.2f} ms")
            
    mean_lat = np.mean(latencies)
    median_lat = np.median(latencies)
    p95_lat = np.percentile(latencies, 95)
    p99_lat = np.percentile(latencies, 99)
    min_lat = np.min(latencies)
    max_lat = np.max(latencies)
    std_dev = np.std(latencies)
    
    report = {
        "benchmark_target": "Radiology AI DICOM Inference",
        "total_frames_processed": num_images,
        "image_dimensions": list(image_shape),
        "metrics_ms": {
            "mean": round(mean_lat, 3),
            "median": round(median_lat, 3),
            "p95": round(p95_lat, 3),
            "p99": round(p99_lat, 3),
            "min": round(min_lat, 3),
            "max": round(max_lat, 3),
            "std_dev": round(std_dev, 3)
        },
        "sla_compliance": {
            "p99_under_100ms": p99_lat < 100.0,
            "p95_under_50ms": p95_lat < 50.0
        }
    }
    
    print("\n--- BENCHMARK RESULTS ---")
    print(json.dumps(report, indent=2))
    os.makedirs("reports", exist_ok=True)
    with open("reports/radiology_latency_report.json", "w") as f:
        json.dump(report, f, indent=2)
    return report

if __name__ == "__main__":
    run_benchmark()

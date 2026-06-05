import time
import numpy as np
import json
import os

class MockCDSClient:
    def __init__(self):
        pass

    def call_api(self, endpoint):
        if endpoint == "/api/v1/cds/drug-interaction":
            base = 12.0
            noise = np.random.lognormal(mean=1.5, sigma=0.5)
        elif endpoint == "/api/v1/cds/sepsis-risk":
            base = 45.0
            noise = np.random.lognormal(mean=2.2, sigma=0.6)
        else:
            base = 8.0
            noise = np.random.lognormal(mean=1.0, sigma=0.3)
        latency_ms = base + noise
        time.sleep(latency_ms / 1000.0)
        return latency_ms

def analyze_api_distribution():
    endpoints = [
        "/api/v1/cds/drug-interaction",
        "/api/v1/cds/sepsis-risk",
        "/api/v1/cds/triage-recommendation"
    ]
    client = MockCDSClient()
    num_requests = 200
    results = {}
    print("Starting API Response Time Distribution Analysis...")
    for endpoint in endpoints:
        print(f"Benchmarking {endpoint} with {num_requests} requests...")
        latencies = []
        for _ in range(num_requests):
            lat = client.call_api(endpoint)
            latencies.append(lat)
        latencies = np.array(latencies)
        results[endpoint] = {
            "p50": float(np.percentile(latencies, 50)),
            "p90": float(np.percentile(latencies, 90)),
            "p95": float(np.percentile(latencies, 95)),
            "p99": float(np.percentile(latencies, 99)),
            "p99.9": float(np.percentile(latencies, 99.9)),
            "mean": float(np.mean(latencies)),
            "std_dev": float(np.std(latencies)),
            "max": float(np.max(latencies))
        }
    print("\n================ API LATENCY DISTRIBUTION ================")
    for endpoint, metrics in results.items():
        print(f"\nEndpoint: {endpoint}")
        print(f"  Median (p50):  {metrics['p50']:.2f} ms")
        print(f"  95th %ile:     {metrics['p95']:.2f} ms")
        print(f"  99th %ile:     {metrics['p99']:.2f} ms (SLA Target: < 150ms)")
        print(f"  99.9th %ile:   {metrics['p99.9']:.2f} ms")
        print(f"  Max Latency:   {metrics['max']:.2f} ms")
        if metrics['p99'] < 150.0:
            print("  SLA Status:    PASSED")
        else:
            print("  SLA Status:    FAILED")
    os.makedirs("reports", exist_ok=True)
    with open("reports/api_latency_distribution.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nReport saved to reports/api_latency_distribution.json")

if __name__ == "__main__":
    analyze_api_distribution()

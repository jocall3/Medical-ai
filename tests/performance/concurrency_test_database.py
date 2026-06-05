import asyncio
import time
import random
import sqlite3
import os

class MockDatabase:
    def __init__(self, db_path="test_clinical.db"):
        self.db_path = db_path
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS patient_telemetry (
                patient_id TEXT PRIMARY KEY,
                heart_rate INTEGER,
                blood_pressure TEXT,
                last_updated TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def write_telemetry(self, patient_id, hr, bp):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        try:
            with conn:
                conn.execute("""
                    INSERT INTO patient_telemetry (patient_id, heart_rate, blood_pressure, last_updated)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(patient_id) DO UPDATE SET
                        heart_rate = excluded.heart_rate,
                        blood_pressure = excluded.blood_pressure,
                        last_updated = excluded.last_updated
                """)
        finally:
            conn.close()

async def agent_worker(agent_id, db, num_updates, stats):
    patient_pool = [f"PATIENT_{i:03d}" for i in range(10)]
    for _ in range(num_updates):
        patient_id = random.choice(patient_pool)
        hr = random.randint(60, 120)
        bp = f"{random.randint(110, 130)}/{random.randint(70, 85)}"
        start_time = time.perf_counter()
        try:
            await asyncio.to_thread(db.write_telemetry, patient_id, hr, bp)
            duration = time.perf_counter() - start_time
            stats["success"] += 1
            stats["latencies"].append(duration)
        except Exception as e:
            stats["failures"] += 1
            stats["errors"].append(str(e))
        await asyncio.sleep(random.uniform(0.01, 0.05))

async def run_concurrency_test():
    print("Initializing Database Concurrency and Lock Contention Test...")
    db = MockDatabase()
    num_agents = 50
    updates_per_agent = 20
    stats = {
        "success": 0,
        "failures": 0,
        "latencies": [],
        "errors": []
    }
    start_time = time.perf_counter()
    tasks = [agent_worker(i, db, updates_per_agent, stats) for i in range(num_agents)]
    await asyncio.gather(*tasks)
    total_duration = time.perf_counter() - start_time
    latencies = stats["latencies"]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    max_latency = max(latencies) if latencies else 0
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0
    print("\n================ CONCURRENCY TEST RESULTS ================")
    print(f"Total Agents:         {num_agents}")
    print(f"Total Write Attempts: {num_agents * updates_per_agent}")
    print(f"Successful Writes:    {stats['success']}")
    print(f"Failed Writes:        {stats['failures']}")
    print(f"Total Duration:       {total_duration:.2f} seconds")
    print(f"Throughput:           {stats['success'] / total_duration:.2f} writes/sec")
    print(f"Average Latency:      {avg_latency * 1000.0:.2f} ms")
    print(f"95th Percentile Lat:  {p95_latency * 1000.0:.2f} ms")
    print(f"Max Latency:          {max_latency * 1000.0:.2f} ms")
    if stats["errors"]:
        print(f"Sample Error:         {stats['errors'][0]}")
    if os.path.exists("test_clinical.db"):
        os.remove("test_clinical.db")
    if os.path.exists("test_clinical.db-wal"):
        os.remove("test_clinical.db-wal")
    if os.path.exists("test_clinical.db-shm"):
        os.remove("test_clinical.db-shm")
    print("==========================================================")

if __name__ == "__main__":
    asyncio.run(run_concurrency_test())

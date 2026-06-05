import redis

class CircuitBreaker:
    def __init__(self, redis_client: redis.Redis, name: str, threshold: int = 5):
        self.redis = redis_client
        self.name = f"cb:{name}"
        self.threshold = threshold

    def record_failure(self):
        failures = self.redis.incr(f"{self.name}:failures")
        if failures >= self.threshold:
            self.redis.setex(f"{self.name}:open", 60, "true")

    def is_open(self) -> bool:
        return self.redis.exists(f"{self.name}:open") == 1
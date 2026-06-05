import redis
import time

class DistributedRateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        current_time = int(time.time())
        window_key = f"rate:{key}:{current_time // window}"
        count = self.redis.incr(window_key)
        if count == 1:
            self.redis.expire(window_key, window)
        return count <= limit
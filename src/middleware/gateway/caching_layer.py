import redis

class CachingLayer:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def get(self, key: str):
        return self.redis.get(key)

    def set(self, key: str, value: str, ttl: int = 3600):
        self.redis.setex(key, ttl, value)
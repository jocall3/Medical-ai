import redis

class QuotaManager:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def check_quota(self, tenant_id: str, limit: int) -> bool:
        usage = self.redis.get(f"quota:{tenant_id}")
        return int(usage or 0) < limit

    def increment_usage(self, tenant_id: str):
        self.redis.incr(f"quota:{tenant_id}")
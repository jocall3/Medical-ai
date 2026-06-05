import time
from typing import Dict, Any, List, Callable

class DataRetentionPolicy:
    """
    Enforces data retention and deletion policies.
    Ensures clinical logs, audit trails, and patient records are purged or archived
    after their legally mandated retention periods (e.g., HIPAA 6 years, GDPR minimization).
    """
    def __init__(self):
        self.retention_periods = {
            "CLINICAL_LOGS": 6 * 365 * 24 * 3600,
            "AUDIT_TRAILS": 7 * 365 * 24 * 3600,
            "TEMPORARY_CACHE": 30 * 24 * 3600,
            "ANONYMIZED_DATA": float('inf')
        }
        self.deletion_callbacks: List[Callable[[str, str], None]] = []

    def register_deletion_callback(self, callback: Callable[[str, str], None]):
        self.deletion_callbacks.append(callback)

    def is_expired(self, category: str, creation_timestamp: float) -> bool:
        period = self.retention_periods.get(category, 365 * 24 * 3600)
        if period == float('inf'):
            return False
        return (time.time() - creation_timestamp) > period

    def enforce_retention(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        active_records = []
        for record in records:
            category = record.get("category", "TEMPORARY_CACHE")
            created_at = record.get("timestamp", time.time())
            record_id = record.get("id", "unknown")
            
            if self.is_expired(category, created_at):
                for callback in self.deletion_callbacks:
                    try:
                        callback(record_id, category)
                    except Exception:
                        pass
            else:
                active_records.append(record)
        return active_records

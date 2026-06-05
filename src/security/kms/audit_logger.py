import json
import logging
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict

class CryptographicAuditLogger:
    """
    Tamper-evident audit logger for cryptographic operations.
    Maintains a cryptographic hash chain of all log entries to prevent tampering.
    """
    def __init__(self, logger_name: str = "KMS_Audit"):
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        
        self.last_log_hash: str = "0" * 64

    def _calculate_hash(self, entry: Dict[str, Any]) -> str:
        serialized = json.dumps(entry, sort_keys=True)
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def log_operation(self, actor: str, operation: str, resource_id: str, status: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Logs a cryptographic operation and chains it to the previous log entry.
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor": actor,
            "operation": operation,
            "resource_id": resource_id,
            "status": status,
            "details": details or {},
            "previous_hash": self.last_log_hash
        }
        
        current_hash = self._calculate_hash(entry)
        entry["hash"] = current_hash
        self.last_log_hash = current_hash

        self.logger.info(json.dumps(entry))
        return entry
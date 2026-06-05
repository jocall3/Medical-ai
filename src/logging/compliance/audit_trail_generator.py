import hashlib
import json
import time
from typing import Dict, Any, List, Optional

class AuditTrailGenerator:
    """
    Generates cryptographically chained, immutable audit trails for regulatory review.
    Each log entry contains a hash of the previous entry, preventing silent tampering.
    """
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path
        self.chain: List[Dict[str, Any]] = []
        self._initialize_chain()

    def _initialize_chain(self):
        genesis_entry = {
            "index": 0,
            "timestamp": time.time(),
            "event_type": "GENESIS",
            "payload": {"message": "Audit trail initialized"},
            "previous_hash": "0" * 64
        }
        genesis_entry["hash"] = self._calculate_hash(genesis_entry)
        self.chain.append(genesis_entry)

    def _calculate_hash(self, entry: Dict[str, Any]) -> str:
        entry_copy = {k: v for k, v in entry.items() if k != "hash"}
        serialized = json.dumps(entry_copy, sort_keys=True).encode('utf-8')
        return hashlib.sha256(serialized).hexdigest()

    def append_event(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        previous_entry = self.chain[-1]
        new_entry = {
            "index": len(self.chain),
            "timestamp": time.time(),
            "event_type": event_type,
            "payload": payload,
            "previous_hash": previous_entry["hash"]
        }
        new_entry["hash"] = self._calculate_hash(new_entry)
        self.chain.append(new_entry)
        
        if self.storage_path:
            self._persist_entry(new_entry)
            
        return new_entry

    def _persist_entry(self, entry: Dict[str, Any]):
        with open(self.storage_path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def verify_integrity(self) -> bool:
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]
            
            if current["hash"] != self._calculate_hash(current):
                return False
                
            if current["previous_hash"] != previous["hash"]:
                return False
                
        return True

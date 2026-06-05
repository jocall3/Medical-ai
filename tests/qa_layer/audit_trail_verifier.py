import hashlib

class AuditTrailVerifier:
    def verify_integrity(self, log_entry, signature):
        computed_hash = hashlib.sha256(str(log_entry).encode()).hexdigest()
        return computed_hash == signature
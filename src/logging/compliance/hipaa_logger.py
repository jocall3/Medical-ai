import logging
import json
import time
from typing import Any, Dict, Optional

class HIPAALogger:
    """
    Specialized logger for HIPAA compliance events.
    Ensures all access, modification, and disclosure of Protected Health Information (PHI)
    is logged with strict structured metadata for auditability under 45 CFR § 164.312(b).
    """
    def __init__(self, name: str = "hipaa_compliance", level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def _log_event(self, action: str, user_id: str, patient_id: str, status: str, details: Dict[str, Any], disclosure_reason: Optional[str] = None):
        event = {
            "timestamp": time.time(),
            "compliance_framework": "HIPAA",
            "action": action,
            "user_id": user_id,
            "patient_id": patient_id,
            "status": status,
            "disclosure_reason": disclosure_reason,
            "details": details
        }
        self.logger.info(json.dumps(event))

    def log_phi_access(self, user_id: str, patient_id: str, fields_accessed: list, status: str = "SUCCESS", disclosure_reason: Optional[str] = None):
        self._log_event(
            action="PHI_ACCESS",
            user_id=user_id,
            patient_id=patient_id,
            status=status,
            details={"fields_accessed": fields_accessed},
            disclosure_reason=disclosure_reason
        )

    def log_phi_modification(self, user_id: str, patient_id: str, fields_modified: Dict[str, Any], status: str = "SUCCESS"):
        self._log_event(
            action="PHI_MODIFICATION",
            user_id=user_id,
            patient_id=patient_id,
            status=status,
            details={"fields_modified": list(fields_modified.keys()), "changes": fields_modified}
        )

    def log_authorization_failure(self, user_id: str, patient_id: str, attempted_action: str, reason: str):
        self._log_event(
            action="AUTHORIZATION_FAILURE",
            user_id=user_id,
            patient_id=patient_id,
            status="FAILED",
            details={"attempted_action": attempted_action, "reason": reason}
        )

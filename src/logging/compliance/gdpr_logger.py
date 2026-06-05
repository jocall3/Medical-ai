import logging
import json
import time
from typing import Any, Dict, Optional

class GDPRLogger:
    """
    Specialized logger for GDPR compliance.
    Tracks data subject rights requests, consent lifecycle, and cross-border transfers
    to satisfy accountability and transparency requirements under GDPR Articles 5(2) and 30.
    """
    def __init__(self, name: str = "gdpr_compliance", level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def _log_event(self, action: str, subject_id: str, status: str, details: Dict[str, Any]):
        event = {
            "timestamp": time.time(),
            "compliance_framework": "GDPR",
            "action": action,
            "subject_id": subject_id,
            "status": status,
            "details": details
        }
        self.logger.info(json.dumps(event))

    def log_dsar_request(self, subject_id: str, request_type: str, status: str = "RECEIVED", details: Optional[Dict[str, Any]] = None):
        self._log_event(
            action=f"DSAR_{request_type.upper()}",
            subject_id=subject_id,
            status=status,
            details=details or {}
        )

    def log_consent_change(self, subject_id: str, purpose: str, consented: bool, mechanism: str):
        self._log_event(
            action="CONSENT_CHANGE",
            subject_id=subject_id,
            status="SUCCESS",
            details={"purpose": purpose, "consented": consented, "mechanism": mechanism}
        )

    def log_cross_border_transfer(self, subject_id: str, destination_country: str, transfer_mechanism: str, data_categories: list):
        self._log_event(
            action="CROSS_BORDER_TRANSFER",
            subject_id=subject_id,
            status="SUCCESS",
            details={
                "destination_country": destination_country,
                "transfer_mechanism": transfer_mechanism,
                "data_categories": data_categories
            }
        )

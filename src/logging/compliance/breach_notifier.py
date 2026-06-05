import time
import logging
from typing import Dict, Any, List, Optional

class BreachNotifier:
    """
    Automated notification system for potential data breaches.
    Evaluates security events, determines severity, and triggers alerts
    to compliance officers and external APIs to meet the 72-hour GDPR notification window.
    """
    def __init__(self, compliance_email: str = "compliance@medicalai.org"):
        self.compliance_email = compliance_email
        self.logger = logging.getLogger("breach_notifier")
        self.incident_log: List[Dict[str, Any]] = []

    def evaluate_event(self, event: Dict[str, Any]) -> bool:
        action = event.get("action")
        status = event.get("status")
        
        is_auth_failure = action == "AUTHORIZATION_FAILURE"
        is_bulk_access = action == "PHI_ACCESS" and len(event.get("details", {}).get("fields_accessed", [])) > 10
        is_failed_admin = action == "ADMIN_ACCESS" and status == "FAILED"
        
        if is_auth_failure or is_bulk_access or is_failed_admin:
            self._trigger_breach_protocol(event)
            return True
        return False

    def _trigger_breach_protocol(self, event: Dict[str, Any]):
        incident_id = f"INC-{int(time.time())}"
        incident_report = {
            "incident_id": incident_id,
            "timestamp": time.time(),
            "severity": "HIGH" if event.get("action") == "AUTHORIZATION_FAILURE" else "MEDIUM",
            "triggering_event": event,
            "status": "INVESTIGATING"
        }
        self.incident_log.append(incident_report)
        
        self.logger.critical(
            f"[BREACH ALERT] Potential data breach detected! Incident ID: {incident_id}. "
            f"Trigger event: {event.get('action')} by user {event.get('user_id', 'unknown')}"
        )
        self._send_notification_email(incident_report)

    def _send_notification_email(self, report: Dict[str, Any]):
        self.logger.info(f"[EMAIL SENT] To: {self.compliance_email} | Subject: CRITICAL: Potential Data Breach {report['incident_id']}")

    def get_active_incidents(self) -> List[Dict[str, Any]]:
        return [inc for inc in self.incident_log if inc["status"] == "INVESTIGATING"]

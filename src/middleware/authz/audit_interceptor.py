import logging
import datetime
from typing import Dict, Any, Optional

# Configure a secure audit logger
audit_logger = logging.getLogger("medical_ai.audit")
audit_logger.setLevel(logging.INFO)

class AuditInterceptor:
    """
    Intercepts and logs all authorization decisions.
    Ensures compliance with HIPAA/GDPR by avoiding logging of raw PHI (Protected Health Information),
    while maintaining a complete, immutable audit trail of access.
    """
    @staticmethod
    def log_decision(
        subject_id: str,
        action: str,
        resource_id: str,
        decision: bool,
        reason: str,
        context: Dict[str, Any],
        is_break_glass: bool = False
    ) -> Dict[str, Any]:
        log_payload = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "subject_id": subject_id,
            "action": action,
            "resource_id": resource_id,
            "decision": "ALLOWED" if decision else "DENIED",
            "reason": reason,
            "is_break_glass": is_break_glass,
            "ip_address": context.get("ip_address", "unknown"),
            "location": context.get("location", "unknown"),
            "correlation_id": context.get("correlation_id", "N/A")
        }
        
        # Format log message
        msg = (
            f"[AUDIT] [{log_payload['timestamp']}] User: {subject_id} | Action: {action} | "
            f"Resource: {resource_id} | Decision: {log_payload['decision']} | "
            f"BreakGlass: {is_break_glass} | Reason: {reason} | IP: {log_payload['ip_address']}"
        )
        
        if is_break_glass:
            audit_logger.warning(f"[BREAK-GLASS ALERT] {msg}")
        elif not decision:
            audit_logger.warning(f"[ACCESS DENIED] {msg}")
        else:
            audit_logger.info(msg)
            
        return log_payload

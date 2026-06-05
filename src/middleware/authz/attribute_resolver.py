from typing import Dict, Any, Optional
import datetime

class AttributeResolver:
    """
    Resolves user, resource, and environmental attributes for ABAC evaluation.
    Integrates with user databases, resource metadata, and system context.
    """
    def __init__(self, user_db: Optional[Dict[str, Dict[str, Any]]] = None, resource_db: Optional[Dict[str, Dict[str, Any]]] = None):
        self.user_db = user_db or {}
        self.resource_db = resource_db or {}

    def resolve_subject_attributes(self, user_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Resolves subject (user) attributes including role, department, and clearance level."""
        user_data = self.user_db.get(user_id, {})
        attributes = {
            "id": user_id,
            "role": user_data.get("role", "anonymous"),
            "department": user_data.get("department", "unknown"),
            "clearance_level": user_data.get("clearance_level", 0),
            "is_active": user_data.get("is_active", False),
            "training_completed": user_data.get("training_completed", False),
        }
        # Merge with dynamic context overrides
        if "subject_override" in context:
            attributes.update(context["subject_override"])
        return attributes

    def resolve_resource_attributes(self, resource_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Resolves resource (e.g., EHR, AI Model, Patient Record) attributes."""
        resource_data = self.resource_db.get(resource_id, {})
        attributes = {
            "id": resource_id,
            "type": resource_data.get("type", "unknown"),
            "owner_id": resource_data.get("owner_id", ""),
            "department": resource_data.get("department", "unknown"),
            "confidentiality_level": resource_data.get("confidentiality_level", 0),
            "requires_break_glass": resource_data.get("requires_break_glass", False),
        }
        # Merge with dynamic context overrides
        if "resource_override" in context:
            attributes.update(context["resource_override"])
        return attributes

    def resolve_environment_attributes(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Resolves environmental attributes such as time, IP address, and emergency status."""
        now = datetime.datetime.utcnow()
        attributes = {
            "current_time": now.isoformat(),
            "hour_of_day": now.hour,
            "ip_address": context.get("ip_address", "127.0.0.1"),
            "is_emergency": context.get("is_emergency", False),
            "location": context.get("location", "unknown"),
            "break_glass_active": context.get("break_glass_active", False),
        }
        return attributes

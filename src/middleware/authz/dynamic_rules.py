import datetime
from typing import Dict, Any, List

class DynamicRulesEvaluator:
    """
    Evaluates dynamic, context-aware rules such as time-of-day windows,
    IP range restrictions, and emergency break-glass overrides.
    """
    @staticmethod
    def evaluate_time_window(env_attrs: Dict[str, Any], start_hour: int, end_hour: int) -> bool:
        """Checks if the current hour is within the allowed window (e.g., 8 to 18 for normal shifts)."""
        current_hour = env_attrs.get("hour_of_day")
        if current_hour is None:
            return False
        if start_hour <= end_hour:
            return start_hour <= current_hour < end_hour
        else:  # Over midnight
            return current_hour >= start_hour or current_hour < end_hour

    @staticmethod
    def evaluate_ip_range(env_attrs: Dict[str, Any], allowed_prefixes: List[str]) -> bool:
        """Checks if the request IP starts with any of the allowed prefixes (e.g., hospital intranet)."""
        ip = env_attrs.get("ip_address", "")
        return any(ip.startswith(prefix) for prefix in allowed_prefixes)

    @staticmethod
    def evaluate_emergency_override(env_attrs: Dict[str, Any]) -> bool:
        """Checks if break-glass emergency mode is active."""
        return env_attrs.get("break_glass_active", False) or env_attrs.get("is_emergency", False)

    @staticmethod
    def evaluate_rule(rule_name: str, rule_value: Any, subject: Dict[str, Any], resource: Dict[str, Any], env: Dict[str, Any]) -> bool:
        """Evaluates a single dynamic rule condition."""
        if rule_name == "time_window":
            # rule_value expected to be [start_hour, end_hour]
            return DynamicRulesEvaluator.evaluate_time_window(env, rule_value[0], rule_value[1])
        elif rule_name == "allowed_ips":
            return DynamicRulesEvaluator.evaluate_ip_range(env, rule_value)
        elif rule_name == "same_department":
            return subject.get("department") == resource.get("department")
        elif rule_name == "is_owner":
            return subject.get("id") == resource.get("owner_id")
        elif rule_name == "min_clearance":
            return int(subject.get("clearance_level", 0)) >= int(rule_value)
        elif rule_name == "emergency_override_allowed":
            return DynamicRulesEvaluator.evaluate_emergency_override(env) and subject.get("role") in ["doctor", "attending", "surgeon"]
        return False

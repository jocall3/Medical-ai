from typing import Dict, Any, List
from .policy_store import PolicyStore, ABACPolicy
from .dynamic_rules import DynamicRulesEvaluator

class ABACEngine:
    """
    Attribute-Based Access Control evaluation engine.
    Evaluates complex policies based on subject, resource, action, and environment attributes.
    Implements a Deny-Overrides strategy.
    """
    def __init__(self, policy_store: PolicyStore):
        self.policy_store = policy_store

    def evaluate(self, subject_attrs: Dict[str, Any], resource_attrs: Dict[str, Any], env_attrs: Dict[str, Any], action: str) -> bool:
        """
        Evaluates ABAC policies. Returns True if access is allowed, False otherwise.
        """
        policies = self.policy_store.get_abac_policies()
        applicable_policies = [p for p in policies if p.target_action == action]

        if not applicable_policies:
            return False  # Default deny if no policies match the action

        allow_triggered = False

        for policy in applicable_policies:
            # Evaluate all rules in the policy
            policy_matched = True
            for rule in policy.rules:
                for rule_name, rule_value in rule.items():
                    if not DynamicRulesEvaluator.evaluate_rule(rule_name, rule_value, subject_attrs, resource_attrs, env_attrs):
                        policy_matched = False
                        break
                if not policy_matched:
                    break

            if policy_matched:
                if policy.effect == "deny":
                    return False  # Immediate deny override
                elif policy.effect == "allow":
                    allow_triggered = True

        return allow_triggered

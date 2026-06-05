from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

@dataclass
class RBACPolicy:
    role: str
    permissions: List[str]

@dataclass
class ABACPolicy:
    policy_id: str
    description: str
    target_action: str
    # Rules are represented as structured conditions
    # e.g., [{"same_department": True}, {"min_clearance": 2}]
    rules: List[Dict[str, Any]]
    effect: str = "allow"  # "allow" or "deny"

class PolicyStore:
    """
    In-memory storage and retrieval of authorization policies.
    Supports both RBAC role-to-permission mappings and ABAC attribute-based rules.
    """
    def __init__(self):
        self.rbac_policies: Dict[str, List[str]] = {}
        self.abac_policies: List[ABACPolicy] = []

    def add_rbac_policy(self, role: str, permissions: List[str]):
        if role not in self.rbac_policies:
            self.rbac_policies[role] = []
        self.rbac_policies[role].extend(permissions)

    def get_permissions_for_role(self, role: str) -> List[str]:
        return self.rbac_policies.get(role, [])

    def add_abac_policy(self, policy: ABACPolicy):
        self.abac_policies.append(policy)

    def get_abac_policies(self) -> List[ABACPolicy]:
        return self.abac_policies

    def clear_policies(self):
        self.rbac_policies.clear()
        self.abac_policies.clear()

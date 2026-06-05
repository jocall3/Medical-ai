from typing import Set
from .role_hierarchy import RoleHierarchy
from .policy_store import PolicyStore

class RBACEngine:
    """
    Role-Based Access Control evaluation engine.
    Determines if a user's role (or inherited roles) has the required permission.
    """
    def __init__(self, role_hierarchy: RoleHierarchy, policy_store: PolicyStore):
        self.role_hierarchy = role_hierarchy
        self.policy_store = policy_store

    def evaluate(self, user_role: str, required_permission: str) -> bool:
        """
        Evaluates if the user's role (or any inherited roles) has the required permission.
        """
        if not user_role or not required_permission:
            return False

        # Resolve all roles the user has via inheritance
        effective_roles = self.role_hierarchy.get_all_inherited_roles(user_role)

        # Check if any of these roles have the required permission
        for role in effective_roles:
            permissions = self.policy_store.get_permissions_for_role(role)
            if required_permission in permissions:
                return True

        return False

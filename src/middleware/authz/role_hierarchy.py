from typing import Dict, Set, List

class RoleHierarchy:
    """
    Manages hierarchical role inheritance for the medical AI platform.
    Allows higher-level roles (e.g., ChiefOfMedicine) to automatically inherit
    permissions from lower-level roles (e.g., AttendingPhysician, Resident).
    """
    def __init__(self, hierarchy_map: Dict[str, List[str]] = None):
        # Map of role -> list of roles it directly inherits
        self.hierarchy: Dict[str, Set[str]] = {}
        if hierarchy_map:
            for role, parents in hierarchy_map.items():
                self.hierarchy[role] = set(parents)

    def add_inheritance(self, child_role: str, parent_role: str):
        """
        Configures child_role to inherit permissions from parent_role.
        Example: add_inheritance('attending', 'resident') means attending has all resident permissions.
        """
        if child_role not in self.hierarchy:
            self.hierarchy[child_role] = set()
        self.hierarchy[child_role].add(parent_role)

    def get_all_inherited_roles(self, role: str) -> Set[str]:
        """
        Returns all roles that the given role inherits, recursively.
        Uses Breadth-First Search (BFS) to resolve the full inheritance tree.
        """
        visited = set()
        queue = [role]
        while queue:
            current = queue.pop(0)
            if current not in visited:
                visited.add(current)
                parents = self.hierarchy.get(current, set())
                for parent in parents:
                    if parent not in visited:
                        queue.append(parent)
        return visited

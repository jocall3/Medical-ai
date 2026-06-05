from enum import Enum
from typing import Set, Dict

class Role(Enum):
    ADMIN = "admin"
    AUDITOR = "auditor"
    DATA_SCIENTIST = "data_scientist"
    CLINICAL_APP = "clinical_app"

class Permission(Enum):
    KEY_CREATE = "key:create"
    KEY_READ = "key:read"
    KEY_ROTATE = "key:rotate"
    KEY_DELETE = "key:delete"
    DECRYPT = "crypto:decrypt"
    ENCRYPT = "crypto:encrypt"

class AccessControlManager:
    """
    Role-Based Access Control (RBAC) for Key Management Service operations.
    Ensures strict separation of duties and least privilege access.
    """
    def __init__(self):
        self._role_permissions: Dict[Role, Set[Permission]] = {
            Role.ADMIN: {
                Permission.KEY_CREATE,
                Permission.KEY_READ,
                Permission.KEY_ROTATE,
                Permission.KEY_DELETE,
                Permission.ENCRYPT,
                Permission.DECRYPT
            },
            Role.AUDITOR: {
                Permission.KEY_READ
            },
            Role.DATA_SCIENTIST: {
                Permission.ENCRYPT,
                Permission.DECRYPT
            },
            Role.CLINICAL_APP: {
                Permission.ENCRYPT,
                Permission.DECRYPT
            }
        }

    def authorize(self, role: Role, permission: Permission) -> bool:
        """
        Checks if a given role has permission to perform an action.
        """
        permissions = self._role_permissions.get(role, set())
        return permission in permissions

    def enforce(self, role: Role, permission: Permission) -> None:
        """
        Enforces authorization, raising PermissionError if unauthorized.
        """
        if not self.authorize(role, permission):
            raise PermissionError(f"Role '{role.value}' is not authorized to perform '{permission.value}'")
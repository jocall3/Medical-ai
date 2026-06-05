import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class Delegation:
    delegator_id: str
    delegatee_id: str
    resource_id: Optional[str]  # If None, delegates all accessible resources
    permission: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    is_active: bool = True

class DelegationManager:
    """
    Manages temporary delegation of access rights.
    Allows clinical staff to delegate specific permissions to colleagues (e.g., during shifts or leave).
    """
    def __init__(self):
        self.delegations: List[Delegation] = []

    def create_delegation(self, delegator_id: str, delegatee_id: str, permission: str, 
                          start_time: datetime.datetime, end_time: datetime.datetime, 
                          resource_id: Optional[str] = None) -> Delegation:
        """Creates a temporary delegation of a permission."""
        if start_time >= end_time:
            raise ValueError("Start time must be before end time.")
        
        delegation = Delegation(
            delegator_id=delegator_id,
            delegatee_id=delegatee_id,
            resource_id=resource_id,
            permission=permission,
            start_time=start_time,
            end_time=end_time
        )
        self.delegations.append(delegation)
        return delegation

    def is_delegated(self, delegatee_id: str, permission: str, resource_id: str, current_time: Optional[datetime.datetime] = None) -> bool:
        """Checks if the delegatee has active delegated permission for the resource."""
        now = current_time or datetime.datetime.utcnow()
        for d in self.delegations:
            if d.is_active and d.delegatee_id == delegatee_id and d.permission == permission:
                if d.start_time <= now <= d.end_time:
                    if d.resource_id is None or d.resource_id == resource_id:
                        return True
        return False

    def revoke_delegation(self, delegator_id: str, delegatee_id: str, permission: str):
        """Revokes an active delegation."""
        for d in self.delegations:
            if d.delegator_id == delegator_id and d.delegatee_id == delegatee_id and d.permission == permission:
                d.is_active = False

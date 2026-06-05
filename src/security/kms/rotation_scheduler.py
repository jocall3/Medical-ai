import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Callable, Optional
from src.security.kms.key_vault import KeyVault

class RotationScheduler:
    """
    Automated scheduling and execution of key rotations.
    Ensures cryptographic keys are rotated periodically to limit blast radius.
    """
    def __init__(self, vault: KeyVault, rotation_interval_days: int = 90):
        self.vault = vault
        self.rotation_interval = timedelta(days=rotation_interval_days)
        self._rotation_callbacks: Dict[str, Callable[[], bytes]] = {}

    def register_key_generator(self, purpose: str, generator_fn: Callable[[], bytes]):
        """Registers a generator function for a specific key purpose."""
        self._rotation_callbacks[purpose] = generator_fn

    def needs_rotation(self, key_id: str) -> bool:
        keys = self.vault.list_keys()
        for k in keys:
            if k["key_id"] == key_id:
                created_at = datetime.fromisoformat(k["created_at"])
                return datetime.now(timezone.utc) - created_at > self.rotation_interval
        return False

    def rotate_key(self, key_id: str) -> str:
        """
        Rotates an existing key by generating a new version and archiving the old one.
        Returns the new key ID.
        """
        keys = self.vault.list_keys()
        target_key = next((k for k in keys if k["key_id"] == key_id), None)
        if not target_key:
            raise ValueError(f"Key {key_id} not found in vault.")

        purpose = target_key["purpose"]
        generator = self._rotation_callbacks.get(purpose)
        if not generator:
            generator = lambda: secrets.token_bytes(32)

        new_key_bytes = generator()
        version = target_key["metadata"].get("version", 1) + 1
        new_key_id = f"{key_id.split('_v')[0]}_v{version}"

        self.vault.store_key(
            key_id=new_key_id,
            key_bytes=new_key_bytes,
            purpose=purpose,
            metadata={
                "version": version,
                "previous_key_id": key_id,
                "rotated_at": datetime.now(timezone.utc).isoformat()
            }
        )

        old_key_bytes = self.vault.get_key(key_id)
        if old_key_bytes:
            self.vault.store_key(
                key_id=key_id,
                key_bytes=old_key_bytes,
                purpose=purpose,
                metadata={
                    **target_key["metadata"],
                    "status": "deprecated",
                    "replaced_by": new_key_id
                }
            )

        return new_key_id
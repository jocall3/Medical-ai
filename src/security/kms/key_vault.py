import os
import json
import base64
from typing import Dict, Optional, List
from datetime import datetime, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class KeyVault:
    """
    Secure Key Vault for storing and retrieving cryptographic keys.
    Uses AES-GCM for encrypting keys at rest using a Master Key.
    """
    def __init__(self, master_key: bytes):
        if len(master_key) != 32:
            raise ValueError("Master key must be exactly 32 bytes (256 bits).")
        self._master_key = master_key
        self._vault: Dict[str, Dict] = {}

    def _encrypt_key(self, key_bytes: bytes) -> tuple[bytes, bytes]:
        aesgcm = AESGCM(self._master_key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, key_bytes, None)
        return nonce, ciphertext

    def _decrypt_key(self, nonce: bytes, ciphertext: bytes) -> bytes:
        aesgcm = AESGCM(self._master_key)
        return aesgcm.decrypt(nonce, ciphertext, None)

    def store_key(self, key_id: str, key_bytes: bytes, purpose: str, metadata: Optional[dict] = None) -> None:
        nonce, ciphertext = self._encrypt_key(key_bytes)
        self._vault[key_id] = {
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
            "purpose": purpose,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }

    def get_key(self, key_id: str) -> Optional[bytes]:
        record = self._vault.get(key_id)
        if not record:
            return None
        nonce = base64.b64decode(record["nonce"])
        ciphertext = base64.b64decode(record["ciphertext"])
        return self._decrypt_key(nonce, ciphertext)

    def delete_key(self, key_id: str) -> bool:
        if key_id in self._vault:
            del self._vault[key_id]
            return True
        return False

    def list_keys(self) -> List[dict]:
        return [
            {
                "key_id": kid,
                "purpose": data["purpose"],
                "created_at": data["created_at"],
                "metadata": data["metadata"]
            }
            for kid, data in self._vault.items()
        ]
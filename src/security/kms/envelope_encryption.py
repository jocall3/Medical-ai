import os
import base64
from typing import Dict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from src.security.kms.key_vault import KeyVault

class EnvelopeEncryptor:
    """
    Implements Envelope Encryption for large datasets (e.g., medical imaging, genomic data).
    Data is encrypted with a local Data Encryption Key (DEK).
    The DEK is encrypted with a Key Encryption Key (KEK) managed by the KeyVault.
    """
    def __init__(self, vault: KeyVault):
        self.vault = vault

    def encrypt_data(self, data: bytes, kek_id: str) -> Dict[str, str]:
        """
        Encrypts data using envelope encryption.
        Returns a dictionary containing the encrypted data, encrypted DEK, and nonces.
        """
        kek = self.vault.get_key(kek_id)
        if not kek:
            raise ValueError(f"KEK with ID '{kek_id}' not found in vault.")

        dek = AESGCM.generate_key(bit_length=256)

        aesgcm_data = AESGCM(dek)
        data_nonce = os.urandom(12)
        encrypted_data = aesgcm_data.encrypt(data_nonce, data, None)

        aesgcm_kek = AESGCM(kek)
        dek_nonce = os.urandom(12)
        encrypted_dek = aesgcm_kek.encrypt(dek_nonce, dek, None)

        return {
            "encrypted_data": base64.b64encode(encrypted_data).decode('utf-8'),
            "data_nonce": base64.b64encode(data_nonce).decode('utf-8'),
            "encrypted_dek": base64.b64encode(encrypted_dek).decode('utf-8'),
            "dek_nonce": base64.b64encode(dek_nonce).decode('utf-8'),
            "kek_id": kek_id
        }

    def decrypt_data(self, payload: Dict[str, str]) -> bytes:
        """
        Decrypts envelope-encrypted data.
        """
        kek_id = payload["kek_id"]
        kek = self.vault.get_key(kek_id)
        if not kek:
            raise ValueError(f"KEK with ID '{kek_id}' not found in vault.")

        encrypted_data = base64.b64decode(payload["encrypted_data"])
        data_nonce = base64.b64decode(payload["data_nonce"])
        encrypted_dek = base64.b64decode(payload["encrypted_dek"])
        dek_nonce = base64.b64decode(payload["dek_nonce"])

        aesgcm_kek = AESGCM(kek)
        dek = aesgcm_kek.decrypt(dek_nonce, encrypted_dek, None)

        aesgcm_data = AESGCM(dek)
        return aesgcm_data.decrypt(data_nonce, encrypted_data, None)
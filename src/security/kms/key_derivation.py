import os
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

class KeyDerivator:
    """
    Provides secure key derivation functions (HKDF and PBKDF2)
    for generating session keys, storage keys, or sub-keys.
    """
    @staticmethod
    def derive_hkdf(master_secret: bytes, salt: bytes, info: bytes, length: int = 32) -> bytes:
        """
        Derives a cryptographically strong key from a master secret using HKDF.
        """
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            info=info,
        )
        return hkdf.derive(master_secret)

    @staticmethod
    def derive_pbkdf2(password: bytes, salt: bytes, iterations: int = 600000, length: int = 32) -> bytes:
        """
        Derives a key from a password/passphrase using PBKDF2 with SHA-256.
        Recommended iterations: 600,000+ for OWASP compliance.
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            iterations=iterations,
        )
        return kdf.derive(password)
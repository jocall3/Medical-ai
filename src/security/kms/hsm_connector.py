import os
from abc import ABC, abstractmethod
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

class HSMConnectorInterface(ABC):
    @abstractmethod
    def generate_key_pair(self, key_label: str) -> None:
        pass

    @abstractmethod
    def sign_data(self, key_label: str, data: bytes) -> bytes:
        pass

    @abstractmethod
    def decrypt_data(self, key_label: str, ciphertext: bytes) -> bytes:
        pass

class SimulatedHSMConnector(HSMConnectorInterface):
    """
    Simulates a Hardware Security Module (HSM) interface using PKCS#11 standards.
    In production, this would load a shared library (.so/.dll) and communicate with physical HSMs.
    """
    def __init__(self):
        self._key_store: dict[str, rsa.RSAPrivateKey] = {}

    def generate_key_pair(self, key_label: str) -> None:
        """Generates an RSA keypair inside the HSM boundary."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096
        )
        self._key_store[key_label] = private_key

    def sign_data(self, key_label: str, data: bytes) -> bytes:
        """Signs data using a private key stored inside the HSM."""
        private_key = self._key_store.get(key_label)
        if not private_key:
            raise ValueError(f"Key label '{key_label}' not found in HSM.")
        
        return private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

    def decrypt_data(self, key_label: str, ciphertext: bytes) -> bytes:
        """Decrypts data using a private key stored inside the HSM."""
        private_key = self._key_store.get(key_label)
        if not private_key:
            raise ValueError(f"Key label '{key_label}' not found in HSM.")

        return private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
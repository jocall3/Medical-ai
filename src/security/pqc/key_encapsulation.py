import abc
from typing import Tuple

class KeyEncapsulationInterface(abc.ABC):
    """
    Abstract Base Class defining the interface for Key Encapsulation Mechanisms (KEM).
    All post-quantum and classical KEM implementations must inherit from this class.
    """
    
    @property
    @abc.abstractmethod
    def algorithm_name(self) -> str:
        """Returns the name of the KEM algorithm."""
        pass

    @abc.abstractmethod
    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """
        Generates a public key and a secret key.
        
        Returns:
            Tuple[bytes, bytes]: (public_key, secret_key)
        """
        pass

    @abc.abstractmethod
    def encapsulate(self, public_key: bytes) -> Tuple[bytes, bytes]:
        """
        Generates a shared secret and encapsulates it using the recipient's public key.
        
        Args:
            public_key (bytes): The recipient's public key.
            
        Returns:
            Tuple[bytes, bytes]: (ciphertext, shared_secret)
        """
        pass

    @abc.abstractmethod
    def decapsulate(self, ciphertext: bytes, secret_key: bytes) -> bytes:
        """
        Decapsulates the ciphertext using the secret key to recover the shared secret.
        
        Args:
            ciphertext (bytes): The encapsulated shared secret.
            secret_key (bytes): The recipient's secret key.
            
        Returns:
            bytes: The recovered shared secret.
        """
        pass

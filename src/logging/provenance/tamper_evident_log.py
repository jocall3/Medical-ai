import hashlib
import json
import time
from typing import Dict, Any, List, Optional
from src.logging.provenance.metadata_signer import MetadataSigner

class LogBlock:
    """
    A single block in the tamper-evident cryptographic ledger.
    """
    def __init__(self, index: int, timestamp: float, data: Dict[str, Any], previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()
        self.signature: Optional[str] = None
        self.signature_algorithm: Optional[str] = None

    def calculate_hash(self) -> str:
        """
        Calculates the SHA-256 hash of the block contents.
        """
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True).encode('utf-8')
        return hashlib.sha256(block_string).hexdigest()

    def sign(self, signer: MetadataSigner) -> None:
        """
        Signs the block hash using the provided MetadataSigner.
        """
        sig, algo = signer.sign_metadata({"hash": self.hash})
        self.signature = sig
        self.signature_algorithm = algo

    def verify_signature(self, signer: MetadataSigner) -> bool:
        """
        Verifies the block signature.
        """
        if not self.signature or not self.signature_algorithm:
            return False
        return signer.verify_metadata({"hash": self.hash}, self.signature, self.signature_algorithm)

class TamperEvidentLog:
    """
    Maintains an append-only, tamper-evident cryptographic ledger of provenance events.
    """
    def __init__(self, signer: Optional[MetadataSigner] = None):
        self.chain: List[LogBlock] = []
        self.signer = signer or MetadataSigner()
        self._create_genesis_block()

    def _create_genesis_block(self) -> None:
        genesis_block = LogBlock(0, time.time(), {"message": "Genesis Block - Secure Provenance Ledger"}, "0")
        genesis_block.sign(self.signer)
        self.chain.append(genesis_block)

    def get_latest_block(self) -> LogBlock:
        return self.chain[-1]

    def add_log(self, data: Dict[str, Any]) -> LogBlock:
        """
        Appends a new provenance event to the ledger.
        """
        latest = self.get_latest_block()
        new_block = LogBlock(
            index=latest.index + 1,
            timestamp=time.time(),
            data=data,
            previous_hash=latest.hash
        )
        new_block.sign(self.signer)
        self.chain.append(new_block)
        return new_block

    def validate_chain(self) -> bool:
        """
        Validates the integrity of the entire ledger chain.
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            # Verify current block hash
            if current.hash != current.calculate_hash():
                return False

            # Verify link to previous block
            if current.previous_hash != previous.hash:
                return False

            # Verify cryptographic signature
            if not current.verify_signature(self.signer):
                return False

        return True

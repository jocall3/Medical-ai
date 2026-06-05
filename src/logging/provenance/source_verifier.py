import hashlib
import os
from typing import Dict, Any, Optional

class SourceVerifier:
    """
    Verifies the integrity and authenticity of original clinical data sources (e.g., DICOM, EHR, Genomics).
    """
    @staticmethod
    def calculate_sha256(file_path: str) -> str:
        """
        Calculates the SHA-256 checksum of a file.
        """
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def verify_source(
        self, 
        file_path: str, 
        expected_hash: str, 
        metadata: Dict[str, Any], 
        required_fields: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Verifies file integrity and validates metadata schema.
        """
        if not os.path.exists(file_path):
            return {"status": "failed", "reason": f"File not found: {file_path}"}

        # Verify Hash
        actual_hash = self.calculate_sha256(file_path)
        if actual_hash != expected_hash:
            return {
                "status": "failed", 
                "reason": f"Hash mismatch. Expected: {expected_hash}, Got: {actual_hash}"
            }

        # Validate Metadata Schema
        if required_fields:
            missing_fields = [field for field in required_fields if field not in metadata]
            if missing_fields:
                return {
                    "status": "failed", 
                    "reason": f"Missing required metadata fields: {missing_fields}"
                }

        return {
            "status": "verified",
            "file_path": file_path,
            "sha256": actual_hash,
            "metadata_valid": True
        }

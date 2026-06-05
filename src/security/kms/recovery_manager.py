from typing import List, Tuple
from src.security.kms.secret_sharing import ShamirSecretSharing
from src.security.kms.key_vault import KeyVault
from src.security.kms.audit_logger import CryptographicAuditLogger

class DisasterRecoveryManager:
    """
    Manages disaster recovery procedures for the Key Management Service.
    Reconstructs the master key using Shamir's Secret Sharing shares.
    """
    def __init__(self, audit_logger: CryptographicAuditLogger):
        self.audit_logger = audit_logger
        self._reconstructed_vault: KeyVault = None

    def initiate_recovery(self, shares: List[Tuple[int, bytes]]) -> KeyVault:
        """
        Reconstructs the master key from the provided shares and initializes the KeyVault.
        """
        self.audit_logger.log_operation(
            actor="SYSTEM_RECOVERY",
            operation="RECOVERY_INITIATED",
            resource_id="MASTER_KEY",
            status="PENDING",
            details={"provided_shares_count": len(shares)}
        )

        try:
            master_key = ShamirSecretSharing.reconstruct_secret(shares)
            if len(master_key) != 32:
                raise ValueError("Reconstructed master key is invalid or corrupted.")

            self._reconstructed_vault = KeyVault(master_key)

            self.audit_logger.log_operation(
                actor="SYSTEM_RECOVERY",
                operation="RECOVERY_COMPLETED",
                resource_id="MASTER_KEY",
                status="SUCCESS",
                details={"vault_initialized": True}
            )
            return self._reconstructed_vault

        except Exception as e:
            self.audit_logger.log_operation(
                actor="SYSTEM_RECOVERY",
                operation="RECOVERY_FAILED",
                resource_id="MASTER_KEY",
                status="FAILED",
                details={"error": str(e)}
            )
            raise e
# Secure Enclaves for Longevity Research

Proprietary longevity AI model weights are protected using Intel SGX and AMD SEV.

## Confidential Computing
- Model weights are loaded into encrypted memory enclaves.
- The CPU prevents the OS or hypervisor from accessing the enclave memory.
- Remote attestation ensures that the AI model has not been tampered with during execution, protecting the integrity of anti-aging research.
# Confidential Computing in Medical AI

## Abstract
This dissertation explores the integration of hardware-based Trusted Execution Environments (TEEs) to secure medical AI pipelines. By isolating model inference and patient data processing within enclaves, we mitigate risks from privileged insiders and infrastructure compromises.

## Core Pillars
1. **Data-in-Use Protection**: Utilizing memory encryption to prevent unauthorized access to PHI.
2. **Remote Attestation**: Establishing a verifiable chain of trust for clinical AI models.
3. **Zero-Trust Architecture**: Ensuring that even the host OS cannot inspect the medical AI's internal state.
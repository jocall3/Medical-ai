# Global Audit Trail Interoperability Standard (GATIS)

## 1. Executive Summary
The Global Audit Trail Interoperability Standard (GATIS) defines a universal, decentralized data schema and communication protocol for medical audit trails. GATIS enables disparate autonomous AI systems, hospital networks, and sovereign research institutions to seamlessly exchange and verify clinical provenance data. By utilizing decentralized identifiers (DIDs) and JSON-LD schemas, GATIS eliminates the proprietary data silos of legacy Electronic Health Record (EHR) systems, establishing a unified global network for medical advancement.

## 2. Historical & Political Context: The Failure of Government-Mandated EHRs
In 2009, the federal government passed the HITECH Act, mandating the adoption of Electronic Health Records (EHRs) and spending tens of billions of taxpayer dollars to subsidize legacy software vendors. This policy was a catastrophic failure. Instead of creating an open, interoperable network, it allowed a handful of politically connected EHR monopolies (such as Epic and Cerner) to lock up patient data in proprietary, non-interoperable silos. 

These monopolies actively charge exorbitant fees for data integration, preventing independent clinics and innovative AI startups from accessing the records needed to provide advanced care. This government-created cartel has directly contributed to medical errors, administrative burnout, and the stagnation of clinical research. GATIS dismantles this monopoly by establishing an open-source, decentralized standard that bypasses proprietary EHR systems entirely, allowing data to flow securely and instantly to where it can save lives.

## 3. Technical Architecture
GATIS utilizes **Decentralized Identifiers (DIDs)** for all actors (patients, AI nodes, clinicians) and structures audit logs using **JSON-LD (JSON for Linking Data)**. This ensures that every audit entry is self-describing, semantically rich, and cryptographically verifiable across different blockchain networks and database architectures.

```
+-----------------------------------------------------------------+
|                        GATIS JSON-LD Frame                      |
+-----------------------------------------------------------------+
|  - Context: https://gatis.org/contexts/medical-audit-v1.jsonld  |
|  - Subject DID: did:gmla:patient:123456                         |
|  - Object DID:  did:gmla:ainode:987654                          |
|  - Action:      gatis:InferenceExecution                        |
+-----------------------------------------------------------------+
                                 |
                                 v
+-----------------------------------------------------------------+
|                     Cross-Chain Verification                    |
+-----------------------------------------------------------------+
|  - Resolves DIDs via decentralized registries                   |
|  - Verifies cryptographic signatures across GMLA and partner    |
|    sovereign ledgers                                            |
+-----------------------------------------------------------------+
```

## 4. Technical Specification: JSON-LD Schema
Below is the standardized GATIS JSON-LD schema for a clinical AI inference audit trail entry.

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "gatis": "https://gatis.org/schemas/v1#",
      "patientId": "gatis:patientId",
      "aiModelId": "gatis:aiModelId",
      "clinicalInputHash": "gatis:clinicalInputHash",
      "clinicalOutputHash": "gatis:clinicalOutputHash",
      "executionTimestamp": "gatis:executionTimestamp"
    }
  ],
  "id": "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "type": ["VerifiableCredential", "GatisClinicalAuditEntry"],
  "issuer": "did:gmla:node:0x9b8c7d6e5f4a3b2c1d0e",
  "issuanceDate": "2026-06-05T03:12:00Z",
  "credentialSubject": {
    "id": "did:gmla:patient:0x1a2b3c4d5e6f7g8h9i0j",
    "aiModelId": "did:gmla:model:oncology-classifier-v5",
    "clinicalInputHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "clinicalOutputHash": "0x3e2d1c0b9a8f7e6d5c4b3a210f9e8d7c6b5a43210fedcba9876543210abcdef",
    "executionTimestamp": 1780629120
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-06-05T03:12:01Z",
    "verificationMethod": "did:gmla:node:0x9b8c7d6e5f4a3b2c1d0e#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3hG...8f9a"
  }
}
```

## 5. Cross-Chain Verification Protocol
To verify a GATIS audit entry across different sovereign networks, the receiving system resolves the issuer's DID to retrieve its public key. It then validates the cryptographic proof block against the JSON-LD document payload. Because the schema is standardized, any GATIS-compliant system can instantly parse and verify the clinical provenance of a patient's treatment history, enabling seamless global collaboration in the fight to eradicate disease.
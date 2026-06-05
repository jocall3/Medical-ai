# Unified RBAC/ABAC Authorization System Design

## 1. Executive Summary
In medical AI systems, security and compliance are not optional add-ons; they are core architectural requirements. This document details the design of our unified, enterprise-grade authorization system. By combining **Role-Based Access Control (RBAC)** for coarse-grained permissions with **Attribute-Based Access Control (ABAC)** for fine-grained, context-aware policies, we ensure that patient data, model weights, and clinical workflows remain secure, compliant, and highly auditable.

## 2. Architecture Overview
Our authorization system uses a hybrid model that evaluates permissions in a multi-stage pipeline:

```
[Request: User, Action, Resource, Context]
                   │
                   ▼
       [Attribute Resolution]
                   │
                   ├─► [Break-Glass Check] ──(Active & Authorized)──► [ALLOW & ALERT]
                   │
                   ├─► [Delegation Check] ──(Active Delegation)─────► [ALLOW & LOG]
                   │
                   ▼
             [RBAC Engine] ──(Role lacks permission)───────────────► [DENY & LOG]
                   │
                   ▼
             [ABAC Engine] ──(Attributes mismatch)─────────────────► [DENY & LOG]
                   │
                   ▼
               [ALLOW]
```

## 3. Component Breakdown

### 3.1 Role Hierarchy (`role_hierarchy.py`)
Manages hierarchical role inheritance. For example, a `ChiefOfMedicine` inherits all permissions of an `AttendingPhysician`, who in turn inherits from a `Resident`. This reduces policy duplication and simplifies role management.

### 3.2 Policy Store (`policy_store.py`)
An in-memory, high-performance store for authorization policies. It holds both RBAC role-to-permission mappings and ABAC attribute-based rules, allowing rapid evaluation during runtime.

### 3.3 Attribute Resolver (`attribute_resolver.py`)
Resolves real-time attributes for the subject (user), resource, and environment. It acts as the bridge between our authorization engine and external identity/resource databases.

### 3.4 Dynamic Rules (`dynamic_rules.py`)
Evaluates dynamic conditions such as:
- **Time-of-Day Windows:** Restricting access to specific shift hours.
- **IP Range Restrictions:** Ensuring clinical data is only accessed from the hospital intranet.
- **Relationship Matching:** Verifying if the requesting doctor is assigned to the patient's department.

### 3.5 RBAC Engine (`rbac_engine.py`)
Evaluates whether the user's active role (or any inherited roles) possesses the required permission for the requested action.

### 3.6 ABAC Engine (`abac_engine.py`)
Evaluates complex, multi-attribute policies. It implements a **Deny-Overrides** strategy, ensuring that any explicit deny rule immediately blocks access, even if other rules allow it.

### 3.7 Delegation Manager (`delegation_manager.py`)
Handles temporary delegation of access rights. This is critical in clinical environments where a doctor must temporarily delegate patient record access to a resident or colleague during a shift or leave.

### 3.8 Audit Interceptor (`audit_interceptor.py`)
Intercepts and logs all authorization decisions. To maintain **HIPAA** and **GDPR** compliance, the interceptor logs the *who, when, what, and why* of every decision without logging raw Protected Health Information (PHI).

### 3.9 Permission Evaluator (`permission_evaluator.py`)
The core orchestrator that coordinates all engines, resolves attributes, checks delegations, evaluates RBAC/ABAC, and triggers audit logging.

## 4. Break-Glass Protocol (Emergency Override)
In life-or-death clinical emergencies, strict access controls must not prevent doctors from saving lives. The system supports a **Break-Glass Protocol**:
1. An authorized clinical user (e.g., Doctor, Surgeon) can assert an emergency override.
2. The system bypasses standard RBAC/ABAC checks to grant immediate access.
3. The `AuditInterceptor` triggers a high-priority warning log, alerting security administrators and compliance officers immediately for post-event review.

## 5. HIPAA & GDPR Compliance Mapping
- **HIPAA §164.312(a)(1) Access Control:** Implemented via strict RBAC/ABAC verification and unique user identification.
- **HIPAA §164.312(b) Audit Controls:** Handled by the `AuditInterceptor`, recording all successful and failed access attempts.
- **GDPR Article 25 (Privacy by Design):** Ensured by default-deny policies and fine-grained attribute matching, minimizing data exposure.

from typing import Dict, Any, Optional
import datetime
from .rbac_engine import RBACEngine
from .abac_engine import ABACEngine
from .attribute_resolver import AttributeResolver
from .delegation_manager import DelegationManager
from .audit_interceptor import AuditInterceptor

class PermissionEvaluator:
    """
    Unified permission evaluation engine.
    Combines RBAC, ABAC, Delegation, and Break-Glass protocols into a single entry point.
    """
    def __init__(
        self,
        rbac_engine: RBACEngine,
        abac_engine: ABACEngine,
        attribute_resolver: AttributeResolver,
        delegation_manager: DelegationManager
    ):
        self.rbac_engine = rbac_engine
        self.abac_engine = abac_engine
        self.attribute_resolver = attribute_resolver
        self.delegation_manager = delegation_manager

    def evaluate(
        self,
        user_id: str,
        action: str,
        resource_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        ctx = context or {}
        now = datetime.datetime.utcnow()

        # 1. Resolve Attributes
        subject_attrs = self.attribute_resolver.resolve_subject_attributes(user_id, ctx)
        resource_attrs = self.attribute_resolver.resolve_resource_attributes(resource_id, ctx)
        env_attrs = self.attribute_resolver.resolve_environment_attributes(ctx)

        user_role = subject_attrs.get("role", "anonymous")
        is_break_glass = env_attrs.get("break_glass_active", False) or ctx.get("is_emergency", False)

        # 2. Check Break-Glass Emergency Override
        if is_break_glass:
            # Break-glass is only allowed for authorized clinical roles (e.g., doctors, surgeons)
            if user_role in ["doctor", "attending", "surgeon"]:
                AuditInterceptor.log_decision(
                    subject_id=user_id,
                    action=action,
                    resource_id=resource_id,
                    decision=True,
                    reason="Break-glass emergency override activated by authorized clinical staff.",
                    context=ctx,
                    is_break_glass=True
                )
                return True
            else:
                AuditInterceptor.log_decision(
                    subject_id=user_id,
                    action=action,
                    resource_id=resource_id,
                    decision=False,
                    reason="Break-glass emergency override attempted by unauthorized role.",
                    context=ctx,
                    is_break_glass=True
                )
                return False

        # 3. Check Delegation
        if self.delegation_manager.is_delegated(user_id, action, resource_id, now):
            AuditInterceptor.log_decision(
                subject_id=user_id,
                action=action,
                resource_id=resource_id,
                decision=True,
                reason="Access granted via active temporary delegation.",
                context=ctx
            )
            return True

        # 4. Evaluate RBAC
        # RBAC acts as a coarse-grained filter. The user must have the base permission.
        rbac_allowed = self.rbac_engine.evaluate(user_role, action)
        if not rbac_allowed:
            AuditInterceptor.log_decision(
                subject_id=user_id,
                action=action,
                resource_id=resource_id,
                decision=False,
                reason=f"RBAC check failed. Role '{user_role}' does not possess permission '{action}'.",
                context=ctx
            )
            return False

        # 5. Evaluate ABAC
        # ABAC acts as a fine-grained filter (e.g., checking department match, time-of-day, IP range).
        abac_allowed = self.abac_engine.evaluate(subject_attrs, resource_attrs, env_attrs, action)
        if not abac_allowed:
            AuditInterceptor.log_decision(
                subject_id=user_id,
                action=action,
                resource_id=resource_id,
                decision=False,
                reason="ABAC policy evaluation failed (fine-grained attributes or dynamic rules mismatch).",
                context=ctx
            )
            return False

        # 6. Access Granted
        AuditInterceptor.log_decision(
            subject_id=user_id,
            action=action,
            resource_id=resource_id,
            decision=True,
            reason="Access granted. Both RBAC and ABAC evaluations succeeded.",
            context=ctx
        )
        return True

import { Request, Response, NextFunction } from 'express';
import { TokenValidator } from './token-validator';
import { AuditLogger } from './audit-logger';
import { FhirScopeParser } from './fhir-scopes';

export interface AuthenticatedRequest extends Request {
  fhirContext?: {
    userId?: string;
    patientId?: string;
    encounterId?: string;
    scopes: string[];
  };
}

export class AuthMiddleware {
  private validator: TokenValidator;
  private auditLogger: AuditLogger;

  constructor(validator: TokenValidator, auditLogger: AuditLogger) {
    this.validator = validator;
    this.auditLogger = auditLogger;
  }

  public getHandler() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const authHeader = req.headers.authorization;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.auditLogger.log({
          eventType: 'TOKEN_VALIDATION_FAILURE',
          actor: { ipAddress, userAgent, userType: 'UNKNOWN' },
          context: {},
          outcome: 'FAILURE',
          failureReason: 'Missing or malformed Authorization header',
        });
        res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token' });
        return;
      }

      const token = authHeader.substring(7);
      const validationResult = await this.validator.validateToken(token);

      if (!validationResult.isValid || !validationResult.payload) {
        this.auditLogger.log({
          eventType: 'TOKEN_VALIDATION_FAILURE',
          actor: { ipAddress, userAgent, userType: 'UNKNOWN' },
          context: {},
          outcome: 'FAILURE',
          failureReason: validationResult.error || 'Invalid token signature or claims',
        });
        res.status(401).json({ error: `Unauthorized: ${validationResult.error || 'Invalid token'}` });
        return;
      }

      const payload = validationResult.payload;
      const scopes = payload.scope ? payload.scope.split(/\s+/) : [];

      req.fhirContext = {
        userId: payload.fhirUser,
        patientId: payload.patient,
        encounterId: payload.encounter,
        scopes,
      };

      this.auditLogger.log({
        eventType: 'AUTH_LOGIN',
        actor: {
          userId: payload.fhirUser,
          userType: 'CLINICIAN',
          ipAddress,
          userAgent,
        },
        context: {
          patientId: payload.patient,
          encounterId: payload.encounter,
        },
        outcome: 'SUCCESS',
      });

      next();
    };
  }

  public requireResourcePermission(resource: string, action: 'read' | 'write') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!req.fhirContext) {
        res.status(401).json({ error: 'Unauthorized: Context missing' });
        return;
      }

      const hasAccess = FhirScopeParser.hasPermission(req.fhirContext.scopes, {
        context: 'patient',
        resource,
        action,
      }) || FhirScopeParser.hasPermission(req.fhirContext.scopes, {
        context: 'user',
        resource,
        action,
      });

      if (!hasAccess) {
        this.auditLogger.log({
          eventType: 'ACCESS_DENIED',
          actor: {
            userId: req.fhirContext.userId,
            userType: 'CLINICIAN',
            ipAddress,
            userAgent,
          },
          context: {
            patientId: req.fhirContext.patientId,
            encounterId: req.fhirContext.encounterId,
          },
          resource: {
            type: resource,
            action: action === 'read' ? 'READ' : 'WRITE',
          },
          outcome: 'FAILURE',
          failureReason: `Insufficient scopes. Required: patient/${resource}.${action} or user/${resource}.${action}`,
        });

        res.status(403).json({
          error: `Forbidden: Insufficient permissions to ${action} resource ${resource}`,
        });
        return;
      }

      next();
    };
  }
}
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuditEvent {
  timestamp: string;
  eventId: string;
  eventType: 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'TOKEN_REFRESH' | 'ACCESS_DENIED' | 'TOKEN_VALIDATION_FAILURE' | 'SESSION_EXPIRED';
  actor: {
    userId?: string;
    userType?: 'CLINICIAN' | 'PATIENT' | 'SYSTEM' | 'UNKNOWN';
    ipAddress: string;
    userAgent: string;
  };
  context: {
    patientId?: string;
    encounterId?: string;
    tenantId?: string;
  };
  resource?: {
    type: string;
    id?: string;
    action: 'READ' | 'WRITE' | 'EXECUTE';
  };
  outcome: 'SUCCESS' | 'FAILURE';
  failureReason?: string;
}

export class AuditLogger {
  private logFilePath: string;

  constructor(logDirectory: string = './logs') {
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    this.logFilePath = path.join(logDirectory, 'hipaa-audit.log');
  }

  public log(event: Omit<AuditEvent, 'timestamp' | 'eventId'>): void {
    const fullEvent: AuditEvent = {
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID ? crypto.randomUUID() : this.generateFallbackUUID(),
      ...event,
    };

    const logLine = JSON.stringify(fullEvent);
    
    console.log(`[AUDIT] ${logLine}`);

    try {
      fs.appendFileSync(this.logFilePath, logLine + '\n', 'utf8');
    } catch (err) {
      console.error('CRITICAL: Failed to write to HIPAA audit log file:', err);
    }
  }

  private generateFallbackUUID(): string {
    return 'audit-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
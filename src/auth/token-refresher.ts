import { SmartFhirAuthClient } from './smart-fhir-auth';
import { SessionStore, ClinicalSession } from './session-store';
import { AuditLogger } from './audit-logger';

export class TokenRefresher {
  private authClient: SmartFhirAuthClient;
  private sessionStore: SessionStore;
  private auditLogger: AuditLogger;
  private refreshIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private activeRefreshes: Map<string, Promise<ClinicalSession>> = new Map();

  constructor(config: {
    authClient: SmartFhirAuthClient;
    sessionStore: SessionStore;
    auditLogger: AuditLogger;
    refreshIntervalMs?: number;
  }) {
    this.authClient = config.authClient;
    this.sessionStore = config.sessionStore;
    this.auditLogger = config.auditLogger;
    this.refreshIntervalMs = config.refreshIntervalMs || 60000;
  }

  public start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.checkAndRefreshSessions(), this.refreshIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async refreshSession(sessionId: string, ipAddress = '127.0.0.1', userAgent = 'System-Refresher'): Promise<ClinicalSession> {
    const existing = this.activeRefreshes.get(sessionId);
    if (existing) return existing;

    const refreshPromise = (async () => {
      const session = await this.sessionStore.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.refreshToken) {
        throw new Error(`No refresh token available for session ${sessionId}`);
      }

      try {
        const tokenResponse = await this.authClient.refreshAccessToken({
          refreshToken: session.refreshToken,
        });

        const updatedSession: ClinicalSession = {
          ...session,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || session.refreshToken,
          expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        };

        await this.sessionStore.saveSession(updatedSession, 86400);

        this.auditLogger.log({
          eventType: 'TOKEN_REFRESH',
          actor: {
            userId: session.userId,
            userType: 'CLINICIAN',
            ipAddress,
            userAgent,
          },
          context: {
            patientId: session.patientId,
            encounterId: session.encounterId,
          },
          outcome: 'SUCCESS',
        });

        return updatedSession;
      } catch (error) {
        this.auditLogger.log({
          eventType: 'TOKEN_REFRESH',
          actor: {
            userId: session.userId,
            userType: 'CLINICIAN',
            ipAddress,
            userAgent,
          },
          context: {
            patientId: session.patientId,
            encounterId: session.encounterId,
          },
          outcome: 'FAILURE',
          failureReason: (error as Error).message,
        });
        throw error;
      }
    })();

    this.activeRefreshes.set(sessionId, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      this.activeRefreshes.delete(sessionId);
    }
  }

  private async checkAndRefreshSessions(): Promise<void> {
    // Background scanning logic placeholder
  }
}
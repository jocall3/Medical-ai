import * as crypto from 'crypto';

export interface ClinicalSession {
  sessionId: string;
  userId: string;
  patientId?: string;
  encounterId?: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scopes: string[];
  expiresAt: number;
  createdAt: number;
}

export interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', duration?: number): Promise<string | null>;
  del(key: string): Promise<number>;
}

export class SessionStore {
  private redis: RedisClientInterface;
  private encryptionKey: Buffer;
  private sessionPrefix = 'clinical_session:';

  constructor(redisClient: RedisClientInterface, encryptionKeyHex: string) {
    this.redis = redisClient;
    this.encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted session format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public async saveSession(session: ClinicalSession, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(session);
    const encrypted = this.encrypt(serialized);
    const key = `${this.sessionPrefix}${session.sessionId}`;
    await this.redis.set(key, encrypted, 'EX', ttlSeconds);
  }

  public async getSession(sessionId: string): Promise<ClinicalSession | null> {
    const key = `${this.sessionPrefix}${sessionId}`;
    const encrypted = await this.redis.get(key);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as ClinicalSession;
    } catch (error) {
      throw new Error(`Failed to decrypt or parse session: ${(error as Error).message}`);
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.sessionPrefix}${sessionId}`;
    await this.redis.del(key);
  }

  public async refreshSessionTTL(sessionId: string, ttlSeconds: number): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.saveSession(session, ttlSeconds);
    }
  }
}
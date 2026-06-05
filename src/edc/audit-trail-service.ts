import * as crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SIGN' | 'QUERY_RAISE' | 'QUERY_RESOLVE';
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  performedBy: string;
  performedAt: Date;
  ipAddress: string;
  reasonForChange: string;
  previousHash: string;
  currentHash: string;
}

export class AuditTrailService {
  private chain: AuditLogEntry[] = [];

  constructor() {
    this.createGenesisEntry();
  }

  private createGenesisEntry(): void {
    const genesis: AuditLogEntry = {
      id: '00000000-0000-0000-0000-000000000000',
      tableName: 'SYSTEM',
      recordId: '00000000-0000-0000-0000-000000000000',
      action: 'INSERT',
      oldValues: null,
      newValues: { system: 'initialized' },
      performedBy: 'SYSTEM',
      performedAt: new Date('2026-01-01T00:00:00.000Z'),
      ipAddress: '127.0.0.1',
      reasonForChange: 'System Initialization',
      previousHash: '0'.repeat(64),
      currentHash: '',
    };
    genesis.currentHash = this.calculateHash(genesis);
    this.chain.push(genesis);
  }

  private calculateHash(entry: Omit<AuditLogEntry, 'currentHash'>): string {
    const dataStr = JSON.stringify({
      id: entry.id,
      tableName: entry.tableName,
      recordId: entry.recordId,
      action: entry.action,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      performedBy: entry.performedBy,
      performedAt: entry.performedAt.toISOString(),
      ipAddress: entry.ipAddress,
      reasonForChange: entry.reasonForChange,
      previousHash: entry.previousHash,
    });
    return crypto.createHash('sha256').update(dataStr).digest('hex');
  }

  public logChange(params: { 
    tableName: string; 
    recordId: string; 
    action: AuditLogEntry['action']; 
    oldValues: Record<string, any> | null; 
    newValues: Record<string, any> | null; 
    performedBy: string; 
    ipAddress: string; 
    reasonForChange: string; 
  }): AuditLogEntry {
    const lastEntry = this.chain[this.chain.length - 1];
    const id = crypto.randomUUID();
    const performedAt = new Date();

    const entryWithoutHash: Omit<AuditLogEntry, 'currentHash'> = {
      id,
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      oldValues: params.oldValues,
      newValues: params.newValues,
      performedBy: params.performedBy,
      performedAt,
      ipAddress: params.ipAddress,
      reasonForChange: params.reasonForChange,
      previousHash: lastEntry.currentHash,
    };

    const currentHash = this.calculateHash(entryWithoutHash);
    const fullEntry: AuditLogEntry = { ...entryWithoutHash, currentHash };

    this.chain.push(fullEntry);
    return fullEntry;
  }

  public getLogsForRecord(tableName: string, recordId: string): AuditLogEntry[] {
    return this.chain.filter((entry) => entry.tableName === tableName && entry.recordId === recordId);
  }

  public getFullChain(): AuditLogEntry[] {
    return [...this.chain];
  }

  public verifyIntegrity(): { isValid: boolean; corruptedIndex?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.currentHash) {
        return { isValid: false, corruptedIndex: i };
      }

      const recalculatedHash = this.calculateHash(current);
      if (current.currentHash !== recalculatedHash) {
        return { isValid: false, corruptedIndex: i };
      }
    }
    return { isValid: true };
  }
}
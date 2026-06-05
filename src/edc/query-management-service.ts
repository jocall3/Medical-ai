import * as crypto from 'crypto';
import { AuditTrailService } from './audit-trail-service';

export type QueryStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';

export interface DataQuery {
  id: string;
  crfDataEntryId: string;
  fieldKey: string;
  status: QueryStatus;
  queryText: string;
  raisedBy: string;
  raisedAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionText?: string;
  responseText?: string;
}

export class QueryManagementService {
  private queries: Map<string, DataQuery> = new Map();

  constructor(private auditTrailService: AuditTrailService) {}

  public raiseQuery(params: {
    crfDataEntryId: string;
    fieldKey: string;
    queryText: string;
    raisedBy: string;
    ipAddress: string;
  }): DataQuery {
    const id = crypto.randomUUID();
    const query: DataQuery = {
      id,
      crfDataEntryId: params.crfDataEntryId,
      fieldKey: params.fieldKey,
      status: 'OPEN',
      queryText: params.queryText,
      raisedBy: params.raisedBy,
      raisedAt: new Date(),
    };

    this.queries.set(id, query);

    this.auditTrailService.logChange({
      tableName: 'queries',
      recordId: id,
      action: 'QUERY_RAISE',
      oldValues: null,
      newValues: query,
      performedBy: params.raisedBy,
      ipAddress: params.ipAddress,
      reasonForChange: `Query raised on field ${params.fieldKey}: ${params.queryText}`,
    });

    return query;
  }

  public answerQuery(params: {
    queryId: string;
    responseText: string;
    answeredBy: string;
    ipAddress: string;
  }): DataQuery {
    const query = this.queries.get(params.queryId);
    if (!query) {
      throw new Error(`Query with ID ${params.queryId} not found.`);
    }
    if (query.status !== 'OPEN') {
      throw new Error(`Query is not in OPEN state. Current state: ${query.status}`);
    }

    const oldValues = { ...query };
    query.status = 'ANSWERED';
    query.responseText = params.responseText;

    this.queries.set(params.queryId, query);

    this.auditTrailService.logChange({
      tableName: 'queries',
      recordId: query.id,
      action: 'UPDATE',
      oldValues,
      newValues: query,
      performedBy: params.answeredBy,
      ipAddress: params.ipAddress,
      reasonForChange: `Query answered: ${params.responseText}`,
    });

    return query;
  }

  public resolveQuery(params: {
    queryId: string;
    resolutionText: string;
    resolvedBy: string;
    ipAddress: string;
  }): DataQuery {
    const query = this.queries.get(params.queryId);
    if (!query) {
      throw new Error(`Query with ID ${params.queryId} not found.`);
    }
    if (query.status !== 'ANSWERED' && query.status !== 'OPEN') {
      throw new Error(`Query must be OPEN or ANSWERED to be resolved.`);
    }

    const oldValues = { ...query };
    query.status = 'RESOLVED';
    query.resolvedBy = params.resolvedBy;
    query.resolvedAt = new Date();
    query.resolutionText = params.resolutionText;

    this.queries.set(params.queryId, query);

    this.auditTrailService.logChange({
      tableName: 'queries',
      recordId: query.id,
      action: 'QUERY_RESOLVE',
      oldValues,
      newValues: query,
      performedBy: params.resolvedBy,
      ipAddress: params.ipAddress,
      reasonForChange: `Query resolved: ${params.resolutionText}`,
    });

    return query;
  }

  public closeQuery(params: {
    queryId: string;
    closedBy: string;
    ipAddress: string;
  }): DataQuery {
    const query = this.queries.get(params.queryId);
    if (!query) {
      throw new Error(`Query with ID ${params.queryId} not found.`);
    }
    if (query.status !== 'RESOLVED') {
      throw new Error(`Only RESOLVED queries can be closed.`);
    }

    const oldValues = { ...query };
    query.status = 'CLOSED';

    this.queries.set(params.queryId, query);

    this.auditTrailService.logChange({
      tableName: 'queries',
      recordId: query.id,
      action: 'UPDATE',
      oldValues,
      newValues: query,
      performedBy: params.closedBy,
      ipAddress: params.ipAddress,
      reasonForChange: 'Query closed by monitor/data manager.',
    });

    return query;
  }

  public getQueriesForCRF(crfDataEntryId: string): DataQuery[] {
    return Array.from(this.queries.values()).filter((q) => q.crfDataEntryId === crfDataEntryId);
  }
}
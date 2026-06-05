export interface CompassionateUseRequest {
  requestId: string;
  patientId: string;
  drugId: string;
  physicianId: string;
  justification: string;
  urgency: 'Critical' | 'High' | 'Medium';
}

export interface ApprovalWorkflow {
  irbApproval: boolean;
  fdaApproval: boolean;
  manufacturerConsent: boolean;
  status: 'Pending' | 'Approved' | 'Denied';
}

export class CompassionateUseCase {
  private requests: Map<string, { request: CompassionateUseRequest, workflow: ApprovalWorkflow }> = new Map();

  /**
   * Manages the ethical and regulatory workflow for providing experimental treatments.
   */
  public initiateRequest(request: CompassionateUseRequest): string {
    const id = request.requestId;
    this.requests.set(id, {
      request,
      workflow: { irbApproval: false, fdaApproval: false, manufacturerConsent: false, status: 'Pending' }
    });
    return id;
  }

  public updateApproval(requestId: string, step: keyof Omit<ApprovalWorkflow, 'status'>, value: boolean): void {
    const entry = this.requests.get(requestId);
    if (!entry) throw new Error('Request not found');
    
    entry.workflow[step] = value;
    
    if (entry.workflow.irbApproval && entry.workflow.fdaApproval && entry.workflow.manufacturerConsent) {
      entry.workflow.status = 'Approved';
    }
  }

  public getRequestStatus(requestId: string): ApprovalWorkflow {
    return this.requests.get(requestId)?.workflow || { irbApproval: false, fdaApproval: false, manufacturerConsent: false, status: 'Denied' };
  }
}
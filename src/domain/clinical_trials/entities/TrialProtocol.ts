export enum TrialPhase {
  PHASE_I = "Phase I",
  PHASE_II = "Phase II",
  PHASE_III = "Phase III",
  PHASE_IV = "Phase IV"
}

export enum TrialStatus {
  DRAFT = "Draft",
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
  COMPLETED = "Completed"
}

export interface Criterion {
  id: string;
  description: string;
  field: string;
  operator: "GT" | "LT" | "EQ" | "GTE" | "LTE" | "IN" | "CONTAINS";
  value: any;
}

export interface Endpoint {
  id: string;
  name: string;
  type: "PRIMARY" | "SECONDARY";
  metric: "OS" | "PFS" | "ORR" | "SAFETY" | "BIOMARKER";
  description: string;
}

export class TrialProtocol {
  constructor(
    public readonly id: string,
    public title: string,
    public phase: TrialPhase,
    public status: TrialStatus,
    public inclusionCriteria: Criterion[],
    public exclusionCriteria: Criterion[],
    public endpoints: Endpoint[],
    public targetCohortSize: number
  ) {}

  public validateEligibility(patientData: Record<string, any>): { eligible: boolean; failedCriteria: string[] } {
    const failedCriteria: string[] = [];

    for (const criterion of this.inclusionCriteria) {
      if (!this.evaluateCriterion(criterion, patientData)) {
        failedCriteria.push(`Inclusion failed: ${criterion.description}`);
      }
    }

    for (const criterion of this.exclusionCriteria) {
      if (this.evaluateCriterion(criterion, patientData)) {
        failedCriteria.push(`Exclusion triggered: ${criterion.description}`);
      }
    }

    return {
      eligible: failedCriteria.length === 0,
      failedCriteria
    };
  }

  private evaluateCriterion(criterion: Criterion, data: Record<string, any>): boolean {
    const val = data[criterion.field];
    if (val === undefined || val === null) return false;

    switch (criterion.operator) {
      case "GT": return val > criterion.value;
      case "LT": return val < criterion.value;
      case "EQ": return val === criterion.value;
      case "GTE": return val >= criterion.value;
      case "LTE": return val <= criterion.value;
      case "IN": return Array.isArray(criterion.value) && criterion.value.includes(val);
      case "CONTAINS": return Array.isArray(val) && val.includes(criterion.value);
      default: return false;
    }
  }
}
export enum ParticipantStatus {
  SCREENING = "Screening",
  ENROLLED = "Enrolled",
  ACTIVE = "Active",
  COMPLETED = "Completed",
  WITHDRAWN = "Withdrawn",
  LOST_TO_FOLLOW_UP = "LostToFollowUp"
}

export interface Demographics {
  age: number;
  sex: "M" | "F" | "O";
  ethnicity: string;
  weightKg: number;
  heightCm: number;
}

export class Participant {
  public informedConsentSigned: boolean = false;
  public consentDate?: Date;
  public adherenceRate: number = 1.0;
  public status: ParticipantStatus = ParticipantStatus.SCREENING;
  public assignedArmId?: string;
  public enrolledAt?: Date;
  public withdrawalReason?: string;

  constructor(
    public readonly id: string,
    public readonly trialId: string,
    public readonly demographics: Demographics,
    public readonly medicalHistory: Record<string, any> = {}
  ) {}

  public signConsent(): void {
    this.informedConsentSigned = true;
    this.consentDate = new Date();
    this.status = ParticipantStatus.ENROLLED;
  }

  public assignArm(armId: string): void {
    if (!this.informedConsentSigned) {
      throw new Error("Cannot assign arm to participant without informed consent.");
    }
    this.assignedArmId = armId;
    this.status = ParticipantStatus.ACTIVE;
    this.enrolledAt = new Date();
  }

  public updateAdherence(completedVisits: number, totalVisits: number): void {
    if (totalVisits <= 0) {
      throw new Error("Total visits must be greater than zero.");
    }
    this.adherenceRate = Math.min(1.0, Math.max(0.0, completedVisits / totalVisits));
  }

  public withdraw(reason: string): void {
    this.status = ParticipantStatus.WITHDRAWN;
    this.withdrawalReason = reason;
  }

  public completeTrial(): void {
    if (this.status !== ParticipantStatus.ACTIVE) {
      throw new Error("Only active participants can complete the trial.");
    }
    this.status = ParticipantStatus.COMPLETED;
  }
}
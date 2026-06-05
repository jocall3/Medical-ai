export enum CTCAEGrade {
  GRADE_1 = 1,
  GRADE_2 = 2,
  GRADE_3 = 3,
  GRADE_4 = 4,
  GRADE_5 = 5
}

export enum RelationshipToTreatment {
  NOT_RELATED = "Not Related",
  UNLIKELY = "Unlikely",
  POSSIBLY = "Possibly",
  PROBABLY = "Probably",
  DEFINITELY = "Definitely"
}

export enum AEOutcome {
  RECOVERED = "Recovered/Resolved",
  RECOVERING = "Recovering/Resolving",
  NOT_RECOVERED = "Not Recovered/Not Resolved",
  FATAL = "Fatal",
  UNKNOWN = "Unknown"
}

export class AdverseEvent {
  public resolutionDate?: Date;
  public outcome: AEOutcome = AEOutcome.UNKNOWN;

  constructor(
    public readonly id: string,
    public readonly participantId: string,
    public readonly description: string,
    public readonly severity: CTCAEGrade,
    public readonly onsetDate: Date,
    public readonly relationship: RelationshipToTreatment,
    public readonly isSeriousAdverseEvent: boolean = false
  ) {
    if (severity === CTCAEGrade.GRADE_5 && !isSeriousAdverseEvent) {
      this.isSeriousAdverseEvent = true;
    }
  }

  public isSevere(): boolean {
    return this.severity >= CTCAEGrade.GRADE_3;
  }

  public resolve(date: Date, outcome: AEOutcome): void {
    if (date < this.onsetDate) {
      throw new Error("Resolution date cannot be before onset date.");
    }
    this.resolutionDate = date;
    this.outcome = outcome;
  }
}
import { FrailtyMarker } from '../entities/FrailtyMarker';

export interface CognitiveAssessment {
  mmseScore: number;
  mocaScore: number;
  deliriumPresent: boolean;
}

export interface FunctionalStatus {
  activitiesOfDailyLivingScore: number; // 0-6 (Katz Index)
  instrumentalADLScore: number; // 0-8 (Lawton)
}

export class GeriatricAssessment {
  constructor(
    public readonly assessmentId: string,
    public readonly patientId: string,
    public date: Date,
    public frailty: FrailtyMarker,
    public cognition: CognitiveAssessment,
    public functionStatus: FunctionalStatus,
    public polypharmacyFlag: boolean
  ) {}

  public generateCarePlan(): string[] {
    const plan: string[] = [];
    
    if (this.frailty.getFrailtyStatus() === 'Frail') {
      plan.push("Initiate comprehensive frailty intervention: nutritional supplementation and supervised resistance training.");
    }
    
    if (this.cognition.mocaScore < 26) {
      plan.push("Mild cognitive impairment detected. Schedule neurology consult and MRI brain.");
    }
    
    if (this.functionStatus.activitiesOfDailyLivingScore < 6) {
      plan.push("ADL deficit identified. Arrange for home health aide evaluation.");
    }

    if (this.polypharmacyFlag) {
      plan.push("Polypharmacy detected. Schedule pharmacist-led medication therapy management (MTM) session.");
    }

    return plan;
  }
}

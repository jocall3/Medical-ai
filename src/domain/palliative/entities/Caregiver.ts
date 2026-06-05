/**
 * Entity representing the primary family member or friend providing support.
 * In palliative care, the patient and family are treated as a single unit of care.
 * Caregiver burnout is a major risk factor for complicated grief and poor patient outcomes.
 */

export enum CaregiverStressLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  SEVERE_BURNOUT = 'SEVERE_BURNOUT'
}

export interface PsychosocialAssessment {
  date: Date;
  zaritBurdenScore: number; // 0-88 scale
  phq9Score: number; // Depression screening
  gad7Score: number; // Anxiety screening
  financialDistress: boolean;
}

export class Caregiver {
  private constructor(
    public readonly id: string,
    public readonly patientId: string,
    public name: string,
    public relationship: string,
    private assessments: PsychosocialAssessment[],
    public supportInterventions: string[]
  ) {}

  public static create(id: string, patientId: string, name: string, relationship: string): Caregiver {
    return new Caregiver(id, patientId, name, relationship, [], []);
  }

  public addAssessment(assessment: PsychosocialAssessment): void {
    this.assessments.push(assessment);
  }

  /**
   * Calculates the current stress level based on the latest validated instruments.
   * Zarit Burden Interview (ZBI) > 40 indicates severe burden.
   */
  public getCurrentStressLevel(): CaregiverStressLevel {
    if (this.assessments.length === 0) return CaregiverStressLevel.LOW;
    
    const latest = this.assessments[this.assessments.length - 1];
    
    if (latest.zaritBurdenScore >= 41 || latest.phq9Score >= 15 || latest.gad7Score >= 15) {
      return CaregiverStressLevel.SEVERE_BURNOUT;
    }
    if (latest.zaritBurdenScore >= 21 || latest.phq9Score >= 10 || latest.gad7Score >= 10) {
      return CaregiverStressLevel.HIGH;
    }
    if (latest.zaritBurdenScore >= 10) {
      return CaregiverStressLevel.MODERATE;
    }
    return CaregiverStressLevel.LOW;
  }

  public recommendInterventions(): string[] {
    const level = this.getCurrentStressLevel();
    const recommendations = [];
    
    if (level === CaregiverStressLevel.SEVERE_BURNOUT) {
      recommendations.push('Immediate Respite Care Referral');
      recommendations.push('Psychiatric Evaluation for Caregiver');
    } else if (level === CaregiverStressLevel.HIGH) {
      recommendations.push('Social Work Consultation');
      recommendations.push('Caregiver Support Group');
    }
    
    const latest = this.assessments[this.assessments.length - 1];
    if (latest?.financialDistress) {
      recommendations.push('Financial Counseling / Grant Assistance');
    }
    
    return recommendations;
  }
}

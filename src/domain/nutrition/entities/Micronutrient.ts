export type MicronutrientType = 'VITAMIN_WATER_SOLUBLE' | 'VITAMIN_FAT_SOLUBLE' | 'MACROMINERAL' | 'MICROMINERAL';

export interface DietaryReferenceIntake {
  rda: number;
  ear?: number;
  ul?: number;
  unit: 'mg' | 'mcg' | 'g' | 'IU';
}

export class Micronutrient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: MicronutrientType,
    public readonly dri: DietaryReferenceIntake,
    public readonly coenzymeRoles: string[],
    public readonly physiologicalFunctions: string[],
    public readonly deficiencyDiseases: string[],
    public readonly toxicitySymptoms: string[]
  ) {}

  public evaluateIntakeStatus(dailyIntake: number): {
    status: 'DEFICIENT' | 'ADEQUATE' | 'EXCESSIVE' | 'TOXIC';
    deviationPercentage: number;
    clinicalWarning?: string;
  } {
    const rda = this.dri.rda;
    const ul = this.dri.ul;
    const deviationPercentage = ((dailyIntake - rda) / rda) * 100;

    if (dailyIntake < rda * 0.5) {
      return {
        status: 'DEFICIENT',
        deviationPercentage,
        clinicalWarning: `Critical risk of developing ${this.deficiencyDiseases.join(' or ')}.`
      };
    }
    if (ul && dailyIntake > ul) {
      return {
        status: 'TOXIC',
        deviationPercentage,
        clinicalWarning: `Intake exceeds Tolerable Upper Limit of ${ul}${this.dri.unit}. Risk of: ${this.toxicitySymptoms.join(', ')}.`
      };
    }
    if (dailyIntake > rda * 1.5) {
      return {
        status: 'EXCESSIVE',
        deviationPercentage
      };
    }
    return {
      status: 'ADEQUATE',
      deviationPercentage
    };
  }
}
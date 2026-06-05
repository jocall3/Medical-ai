export interface PatientBiometrics {
  ageYears: number;
  gender: 'MALE' | 'FEMALE';
  weightKg: number;
  heightCm: number;
}

export type StressFactorType = 
  | 'NONE' 
  | 'MINOR_SURGERY' 
  | 'MAJOR_TRAUMA' 
  | 'SEVERE_SEPSIS' 
  | 'BURNS_UNDER_20_PERCENT' 
  | 'BURNS_OVER_20_PERCENT' 
  | 'MECHANICAL_VENTILATION';

export class BasalMetabolicRateCalculator {
  public static calculateMifflinStJeor(biometrics: PatientBiometrics): number {
    const { ageYears, gender, weightKg, heightCm } = biometrics;
    if (ageYears <= 0 || weightKg <= 0 || heightCm <= 0) {
      throw new Error("Biometrics must be positive non-zero values.");
    }

    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
    return gender === 'MALE' ? base + 5 : base - 161;
  }

  public static getStressMultiplier(factor: StressFactorType): number {
    switch (factor) {
      case 'NONE': return 1.0;
      case 'MINOR_SURGERY': return 1.2;
      case 'MAJOR_TRAUMA': return 1.4;
      case 'SEVERE_SEPSIS': return 1.6;
      case 'BURNS_UNDER_20_PERCENT': return 1.5;
      case 'BURNS_OVER_20_PERCENT': return 2.0;
      case 'MECHANICAL_VENTILATION': return 1.15;
      default: return 1.0;
    }
  }

  public static calculateTotalEnergyRequirement(
    biometrics: PatientBiometrics,
    stressFactor: StressFactorType,
    activityMultiplier: number = 1.2
  ): {
    basalMetabolicRateKcal: number;
    adjustedEnergyRequirementKcal: number;
    explanation: string;
  } {
    const bmr = this.calculateMifflinStJeor(biometrics);
    const stressMultiplier = this.getStressMultiplier(stressFactor);
    const totalKcal = bmr * stressMultiplier * activityMultiplier;

    const explanation = `Calculated BMR of ${bmr.toFixed(1)} kcal/day using Mifflin-St Jeor. ` +
      `Adjusted by a clinical stress factor multiplier of ${stressMultiplier} (${stressFactor}) ` +
      `and activity multiplier of ${activityMultiplier}, yielding a total daily energy requirement of ${totalKcal.toFixed(1)} kcal/day.`;

    return {
      basalMetabolicRateKcal: bmr,
      adjustedEnergyRequirementKcal: totalKcal,
      explanation
    };
  }
}
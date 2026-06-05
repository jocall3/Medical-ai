import { Antibody } from "../entities/Antibody";
import { Leukocyte } from "../entities/Leukocyte";

export interface VaccineDose {
  antigenPayloadMcg: number;
  adjuvantType: "ALUM" | "MF59" | "AS01B" | "NONE";
  daysSinceFirstDose: number;
}

export interface EfficacyPrediction {
  neutralizingAntibodyTiter: number;
  memoryBCellCount: number;
  memoryTCellCount: number;
  estimatedProtectionDurationMonths: number;
  neutralizationBreadthScore: number;
}

export class VaccineEfficacyPredictor {
  public static predictEfficacy(
    doses: VaccineDose[],
    patientAgeYears: number,
    baselineImmuneCompetence: number
  ): EfficacyPrediction {
    let memoryBCells = 0;
    let memoryTCells = 0;
    let antibodyTiter = 0.0;
    let somaticHypermutations = 0;

    const ageFactor = patientAgeYears > 65 
      ? Math.max(0.2, 1.0 - (patientAgeYears - 65) * 0.02) 
      : 1.0;

    const effectiveCompetence = baselineImmuneCompetence * ageFactor;

    for (const dose of doses) {
      let adjuvantMultiplier = 1.0;
      switch (dose.adjuvantType) {
        case "AS01B": adjuvantMultiplier = 3.0; break;
        case "MF59": adjuvantMultiplier = 2.2; break;
        case "ALUM": adjuvantMultiplier = 1.5; break;
        case "NONE": adjuvantMultiplier = 0.8; break;
      }

      const immunogenicity = dose.antigenPayloadMcg * adjuvantMultiplier * effectiveCompetence;

      if (dose.daysSinceFirstDose === 0) {
        antibodyTiter += immunogenicity * 0.5;
        memoryBCells += immunogenicity * 10;
        memoryTCells += immunogenicity * 8;
        somaticHypermutations += 2;
      } else {
        const intervalDays = dose.daysSinceFirstDose;
        const intervalFactor = intervalDays < 21 
          ? 0.3 
          : intervalDays > 180 
            ? 1.5 
            : 1.0;

        antibodyTiter += immunogenicity * 4.0 * intervalFactor;
        memoryBCells += immunogenicity * 50 * intervalFactor;
        memoryTCells += immunogenicity * 35 * intervalFactor;
        somaticHypermutations += 8;
      }
    }

    const neutralizationBreadthScore = Math.min(0.98, 0.1 + (somaticHypermutations * 0.06));

    const decayRate = 0.05 / ageFactor;
    const estimatedProtectionDurationMonths = Math.max(
      0,
      Math.log(Math.max(1, antibodyTiter) / 10) / decayRate
    );

    return {
      neutralizingAntibodyTiter: antibodyTiter,
      memoryBCellCount: Math.round(memoryBCells),
      memoryTCellCount: Math.round(memoryTCells),
      estimatedProtectionDurationMonths: parseFloat(estimatedProtectionDurationMonths.toFixed(1)),
      neutralizationBreadthScore: parseFloat(neutralizationBreadthScore.toFixed(2))
    };
  }
}
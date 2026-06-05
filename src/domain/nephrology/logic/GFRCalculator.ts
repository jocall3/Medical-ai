/**
 * GFRCalculator
 * Implements the gold-standard clinical equations for estimating Glomerular Filtration Rate (eGFR).
 * Includes the CKD-EPI (2021) Creatinine, Cystatin C, and Combined Creatinine-Cystatin C equations,
 * as well as the historical MDRD equation.
 * Note: The 2021 CKD-EPI equations intentionally omit race to align with modern clinical guidelines.
 */
export interface GFRInput {
  serumCreatinine?: number; // mg/dL
  serumCystatinC?: number;  // mg/L
  age: number;              // years
  sex: 'male' | 'female';
}

export interface GFRResult {
  equation: string;
  gfr: number; // mL/min/1.73m^2
  classification: string;
}

export class GFRCalculator {
  /**
   * Calculates eGFR using the CKD-EPI Creatinine (2021) equation.
   */
  public static calculateCKDEPICreatinine(input: GFRInput): GFRResult {
    if (!input.serumCreatinine) {
      throw new Error('Serum creatinine is required for CKD-EPI Creatinine equation.');
    }

    const scr = input.serumCreatinine;
    const age = input.age;
    const isFemale = input.sex === 'female';

    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const genderMultiplier = isFemale ? 1.012 : 1.0;

    const minTerm = Math.pow(Math.min(scr / kappa, 1), alpha);
    const maxTerm = Math.pow(Math.max(scr / kappa, 1), -1.200);
    const ageTerm = Math.pow(0.9938, age);

    const gfr = 142 * minTerm * maxTerm * ageTerm * genderMultiplier;

    return {
      equation: 'CKD-EPI Creatinine (2021)',
      gfr: Math.round(gfr * 10) / 10,
      classification: this.classifyCKDStage(gfr),
    };
  }

  /**
   * Calculates eGFR using the CKD-EPI Cystatin C (2021) equation.
   */
  public static calculateCKDEPICystatinC(input: GFRInput): GFRResult {
    if (!input.serumCystatinC) {
      throw new Error('Serum cystatin C is required for CKD-EPI Cystatin C equation.');
    }

    const scys = input.serumCystatinC;
    const age = input.age;
    const isFemale = input.sex === 'female';

    const minTerm = Math.pow(Math.min(scys / 0.8, 1), -0.499);
    const maxTerm = Math.pow(Math.max(scys / 0.8, 1), -1.328);
    const ageTerm = Math.pow(0.996, age);
    const genderMultiplier = isFemale ? 0.932 : 1.0;

    const gfr = 133 * minTerm * maxTerm * ageTerm * genderMultiplier;

    return {
      equation: 'CKD-EPI Cystatin C (2021)',
      gfr: Math.round(gfr * 10) / 10,
      classification: this.classifyCKDStage(gfr),
    };
  }

  /**
   * Calculates eGFR using the CKD-EPI Creatinine-Cystatin C (2021) equation.
   */
  public static calculateCKDEPICreatinineCystatinC(input: GFRInput): GFRResult {
    if (!input.serumCreatinine || !input.serumCystatinC) {
      throw new Error('Both serum creatinine and cystatin C are required for the combined equation.');
    }

    const scr = input.serumCreatinine;
    const scys = input.serumCystatinC;
    const age = input.age;
    const isFemale = input.sex === 'female';

    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.219 : -0.286;
    const genderMultiplier = isFemale ? 0.963 : 1.0;

    const minScrTerm = Math.pow(Math.min(scr / kappa, 1), alpha);
    const maxScrTerm = Math.pow(Math.max(scr / kappa, 1), -0.544);
    const minScysTerm = Math.pow(Math.min(scys / 0.8, 1), -0.323);
    const maxScysTerm = Math.pow(Math.max(scys / 0.8, 1), -0.778);
    const ageTerm = Math.pow(0.9961, age);

    const gfr = 135 * minScrTerm * maxScrTerm * minScysTerm * maxScysTerm * ageTerm * genderMultiplier;

    return {
      equation: 'CKD-EPI Creatinine-Cystatin C (2021)',
      gfr: Math.round(gfr * 10) / 10,
      classification: this.classifyCKDStage(gfr),
    };
  }

  /**
   * Calculates eGFR using the 4-Variable MDRD Study equation.
   */
  public static calculateMDRD(input: GFRInput): GFRResult {
    if (!input.serumCreatinine) {
      throw new Error('Serum creatinine is required for MDRD equation.');
    }

    const scr = input.serumCreatinine;
    const age = input.age;
    const isFemale = input.sex === 'female';

    const genderMultiplier = isFemale ? 0.742 : 1.0;
    const gfr = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203) * genderMultiplier;

    return {
      equation: 'MDRD Study Equation',
      gfr: Math.round(gfr * 10) / 10,
      classification: this.classifyCKDStage(gfr),
    };
  }

  /**
   * Classifies the GFR into KDIGO CKD Stages
   */
  public static classifyCKDStage(gfr: number): string {
    if (gfr >= 90) return 'G1 - Normal or high';
    if (gfr >= 60) return 'G2 - Mildly decreased';
    if (gfr >= 45) return 'G3a - Mildly to moderately decreased';
    if (gfr >= 30) return 'G3b - Moderately to severely decreased';
    if (gfr >= 15) return 'G4 - Severely decreased';
    return 'G5 - Kidney failure (End-Stage Renal Disease)';
  }
}
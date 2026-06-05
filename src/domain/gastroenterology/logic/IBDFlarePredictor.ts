export interface IBDClinicalMetrics {
  fecalCalprotectinMcgG: number; // Key biomarker of intestinal inflammation (Normal < 50 mcg/g)
  crpMgL: number;                // C-Reactive Protein (Normal < 5.0 mg/L)
  stressScore: number;           // Subjective stress scale (0 to 10)
  dietaryTriggersCount: number;  // Number of inflammatory foods consumed recently
  medicationAdherenceRate: number; // 0.0 to 1.0
}

export interface CrohnsDiseaseActivityIndexInput {
  liquidStoolsCount: number;      // Sum of liquid/very soft stools in 7 days
  abdominalPainScore: number;     // Sum of 7 days (0=none, 1=mild, 2=moderate, 3=severe)
  generalWellbeingScore: number;  // Sum of 7 days (0=well, 1=slightly under par, 2=poor, 3=very poor, 4=terrible)
  complicationsCount: number;     // Arthritis, uveitis, erythema nodosum, anal fissure, fistula, fever >37.8C
  takingLomotilOrOpiates: boolean;
  abdominalMass: 'None' | 'Questionable' | 'Definite';
  hematocrit: number;             // Patient's hematocrit percentage
  standardHematocrit: number;     // Normal hematocrit (typically 47 for men, 42 for women)
  weightDeviationPercentage: number; // Deviation from standard weight
}

export class IBDFlarePredictor {
  /**
   * Predicts the probability of an IBD flare (Crohn's or Ulcerative Colitis) within the next 30 days.
   * Uses a weighted logistic-like scoring model based on clinical biomarkers and lifestyle triggers.
   */
  public static predictFlareProbability(metrics: IBDClinicalMetrics): {
    probability: number;
    riskCategory: 'Low' | 'Moderate' | 'High' | 'Imminent';
    primaryDriver: string;
  } {
    let score = 0.0;
    let primaryDriver = 'None';

    if (metrics.fecalCalprotectinMcgG > 250) {
      score += 0.45;
      primaryDriver = 'Severe Mucosal Inflammation (Calprotectin)';
    } else if (metrics.fecalCalprotectinMcgG > 100) {
      score += 0.20;
      primaryDriver = 'Mild Mucosal Inflammation (Calprotectin)';
    }

    if (metrics.crpMgL > 10.0) {
      score += 0.20;
      if (score === 0.20) primaryDriver = 'Systemic Inflammation (CRP)';
    }

    const nonAdherence = 1.0 - metrics.medicationAdherenceRate;
    if (nonAdherence > 0.2) {
      score += nonAdherence * 0.35;
      if (nonAdherence > 0.5) primaryDriver = 'Medication Non-Adherence';
    }

    const stressFactor = (metrics.stressScore / 10) * 0.15;
    const dietFactor = Math.min(0.15, metrics.dietaryTriggersCount * 0.03);
    score += stressFactor + dietFactor;

    const probability = Math.min(0.99, score);
    let riskCategory: 'Low' | 'Moderate' | 'High' | 'Imminent' = 'Low';
    if (probability > 0.75) riskCategory = 'Imminent';
    else if (probability > 0.50) riskCategory = 'High';
    else if (probability > 0.25) riskCategory = 'Moderate';

    return {
      probability,
      riskCategory,
      primaryDriver
    };
  }

  /**
   * Calculates the Crohn's Disease Activity Index (CDAI).
   * CDAI < 150: Remission, 150-220: Mild-to-moderate, 220-450: Moderate-to-severe, >450: Very severe.
   */
  public static calculateCrohnsDiseaseActivityIndex(input: CrohnsDiseaseActivityIndexInput): number {
    let cdai = 0;

    cdai += input.liquidStoolsCount * 2;
    cdai += input.abdominalPainScore * 5;
    cdai += input.generalWellbeingScore * 7;
    cdai += input.complicationsCount * 20;

    if (input.takingLomotilOrOpiates) {
      cdai += 30;
    }

    if (input.abdominalMass === 'Questionable') {
      cdai += 20;
    } else if (input.abdominalMass === 'Definite') {
      cdai += 50;
    }

    const hctDeficit = input.standardHematocrit - input.hematocrit;
    if (hctDeficit > 0) {
      cdai += hctDeficit * 6;
    }

    cdai += Math.abs(input.weightDeviationPercentage);
    return cdai;
  }
}
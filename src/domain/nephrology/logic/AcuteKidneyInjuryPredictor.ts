/**
 * AcuteKidneyInjuryPredictor
 * Predicts the risk and KDIGO stage of Acute Kidney Injury (AKI) based on clinical exposures:
 * nephrotoxic drugs, hypotension duration, and contrast dye administration.
 */
export interface AKIExposureProfile {
  nephrotoxicDrugs: string[]; // e.g., 'NSAID', 'Aminoglycoside', 'Vancomycin', 'Colistin', 'ACEi'
  meanArterialPressure: number; // mmHg
  hypotensionDurationMinutes: number;
  contrastDyeVolumeMl: number; // Contrast-induced nephropathy risk
  baselineCreatinine: number;  // mg/dL
  currentCreatinine: number;   // mg/dL
  urineOutputMlKgHr: number;   // Urine output over last 6-12 hours
}

export interface AKIPrediction {
  riskScore: number; // 0 to 100
  kdigoStage: 0 | 1 | 2 | 3;
  riskCategory: 'Low' | 'Moderate' | 'High' | 'Extreme';
  pathophysiologyExplanation: string;
  preventiveMeasures: string[];
}

export class AcuteKidneyInjuryPredictor {
  /**
   * Predicts AKI risk and classifies current KDIGO stage based on creatinine and urine output.
   */
  public static predictAndStage(profile: AKIExposureProfile): AKIPrediction {
    let riskScore = 0;
    const preventiveMeasures: string[] = [];
    const explanations: string[] = [];

    let kdigoStage: 0 | 1 | 2 | 3 = 0;
    const creatinineRatio = profile.currentCreatinine / profile.baselineCreatinine;
    const creatinineIncrease = profile.currentCreatinine - profile.baselineCreatinine;

    if (creatinineRatio >= 3.0 || profile.currentCreatinine >= 4.0 || (creatinineIncrease >= 0.3 && profile.currentCreatinine >= 4.0)) {
      kdigoStage = 3;
    } else if (creatinineRatio >= 2.0 && creatinineRatio < 3.0) {
      kdigoStage = 2;
    } else if (creatinineRatio >= 1.5 || creatinineIncrease >= 0.3) {
      kdigoStage = 1;
    }

    if (profile.urineOutputMlKgHr < 0.3 && profile.urineOutputMlKgHr >= 0) {
      kdigoStage = Math.max(kdigoStage, 3) as 0 | 1 | 2 | 3;
    } else if (profile.urineOutputMlKgHr < 0.5) {
      kdigoStage = Math.max(kdigoStage, 2) as 0 | 1 | 2 | 3;
    }

    if (profile.nephrotoxicDrugs.length > 0) {
      riskScore += profile.nephrotoxicDrugs.length * 15;
      explanations.push(`Exposure to ${profile.nephrotoxicDrugs.length} nephrotoxic agent(s) increases tubular workload and direct cytotoxicity.`);
      preventiveMeasures.push('Perform therapeutic drug monitoring (TDM) for Vancomycin/Aminoglycosides.');
      preventiveMeasures.push('Discontinue non-essential nephrotoxins (especially NSAIDs) immediately.');
    }

    if (profile.meanArterialPressure < 65) {
      const hypotensionSeverity = (65 - profile.meanArterialPressure) * (profile.hypotensionDurationMinutes / 30);
      riskScore += Math.min(40, hypotensionSeverity);
      explanations.push(`Hypotension (MAP < 65 mmHg) for ${profile.hypotensionDurationMinutes} mins compromises renal perfusion, risking Acute Tubular Necrosis (ATN).`);
      preventiveMeasures.push('Optimize hemodynamics: Maintain MAP >= 65 mmHg using isotonic crystalloids or vasopressors.');
    }

    if (profile.contrastDyeVolumeMl > 0) {
      const contrastRisk = (profile.contrastDyeVolumeMl / 100) * 10;
      riskScore += Math.min(25, contrastRisk);
      explanations.push(`Contrast dye volume of ${profile.contrastDyeVolumeMl} mL increases risk of contrast-induced acute kidney injury (CI-AKI) via medullary vasoconstriction.`);
      preventiveMeasures.push('Administer prophylactic IV hydration with 0.9% Normal Saline or Sodium Bicarbonate before and after contrast exposure.');
    }

    if (profile.baselineCreatinine > 1.5) {
      riskScore += 15;
      explanations.push('Pre-existing chronic kidney disease (baseline creatinine > 1.5 mg/dL) significantly lowers renal reserve.');
    }

    riskScore = Math.min(100, Math.round(riskScore));

    let riskCategory: 'Low' | 'Moderate' | 'High' | 'Extreme' = 'Low';
    if (riskScore >= 75 || kdigoStage === 3) riskCategory = 'Extreme';
    else if (riskScore >= 50 || kdigoStage === 2) riskCategory = 'High';
    else if (riskScore >= 25 || kdigoStage === 1) riskCategory = 'Moderate';

    return {
      riskScore,
      kdigoStage,
      riskCategory,
      pathophysiologyExplanation: explanations.join(' '),
      preventiveMeasures: preventiveMeasures.length > 0 ? preventiveMeasures : ['Continue routine monitoring of serum creatinine and urine output.']
    };
  }
}
export type EFClassification = 
  | 'HFrEF'  // Heart Failure with reduced Ejection Fraction (<= 40%)
  | 'HFmrEF' // Heart Failure with mildly reduced Ejection Fraction (41% - 49%)
  | 'HFpEF'  // Heart Failure with preserved Ejection Fraction (>= 50%)
  | 'NORMAL';

export interface EjectionFractionResult {
  ejectionFractionPercentage: number;
  strokeVolumeMl: number;
  cardiacOutputLMin: number;
  classification: EFClassification;
  clinicalInterpretation: string;
}

export class EjectionFractionCalculator {
  /**
   * Derives Left Ventricular Ejection Fraction (LVEF) from end-diastolic and end-systolic volumes.
   * LVEF = ((EDV - ESV) / EDV) * 100
   */
  public calculateLVEF(
    endDiastolicVolumeMl: number,
    endSystolicVolumeMl: number,
    heartRateBpm: number
  ): EjectionFractionResult {
    if (endDiastolicVolumeMl <= 0) {
      throw new Error("End-diastolic volume must be greater than zero.");
    }
    if (endSystolicVolumeMl >= endDiastolicVolumeMl) {
      throw new Error("End-systolic volume cannot be greater than or equal to end-diastolic volume.");
    }

    const strokeVolumeMl = endDiastolicVolumeMl - endSystolicVolumeMl;
    const ejectionFractionPercentage = (strokeVolumeMl / endDiastolicVolumeMl) * 100;
    const cardiacOutputLMin = (strokeVolumeMl * heartRateBpm) / 1000;

    let classification: EFClassification = 'NORMAL';
    let clinicalInterpretation = '';

    if (ejectionFractionPercentage <= 40) {
      classification = 'HFrEF';
      clinicalInterpretation = "Heart Failure with reduced Ejection Fraction. Severe systolic dysfunction. High risk of decompensation; neurohormonal blockade (ARNI/ACEi, Beta-blocker, MRA, SGLT2i) strongly indicated.";
    } else if (ejectionFractionPercentage > 40 && ejectionFractionPercentage < 50) {
      classification = 'HFmrEF';
      clinicalInterpretation = "Heart Failure with mildly reduced Ejection Fraction. Mild systolic impairment. Monitor closely and optimize guideline-directed medical therapy.";
    } else if (ejectionFractionPercentage >= 50) {
      classification = 'HFpEF';
      clinicalInterpretation = "Preserved Ejection Fraction. If symptomatic, evaluate for diastolic dysfunction, left ventricular hypertrophy, and elevated filling pressures.";
    }

    if (ejectionFractionPercentage >= 55 && ejectionFractionPercentage <= 70) {
      classification = 'NORMAL';
      clinicalInterpretation = "Normal left ventricular systolic function.";
    }

    return {
      ejectionFractionPercentage,
      strokeVolumeMl,
      cardiacOutputLMin,
      classification,
      clinicalInterpretation
    };
  }
}
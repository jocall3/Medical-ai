/**
 * Models the predictable phases of decline in terminal diseases.
 * Different diseases have distinct trajectories (e.g., steady decline in cancer vs.
 * stuttering decline with acute exacerbations in organ failure).
 * This engine aids in prognostic communication and timely hospice referrals.
 */

export enum DiseaseTrajectoryType {
  CANCER = 'CANCER', // Steady, predictable decline
  ORGAN_FAILURE = 'ORGAN_FAILURE', // Gradual decline punctuated by severe exacerbations
  FRAILTY_DEMENTIA = 'FRAILTY_DEMENTIA', // Prolonged, gradual dwindling
  SUDDEN_DEATH = 'SUDDEN_DEATH'
}

export interface TrajectoryPrediction {
  estimatedPrognosisDays: number;
  confidenceInterval: [number, number];
  recommendedCareTransition: string;
  phase: 'STABLE' | 'UNSTABLE' | 'DETERIORATING' | 'TERMINAL';
}

export class EndStageTrajectoryEngine {
  /**
   * Predicts the end-of-life trajectory based on disease type, current PPS, and rate of decline.
   * @param diseaseType The primary terminal diagnosis category.
   * @param currentPPS Current Palliative Performance Scale (0-100).
   * @param ppsDeclineOver30Days How much the PPS has dropped in the last month.
   */
  public static predictTrajectory(
    diseaseType: DiseaseTrajectoryType,
    currentPPS: number,
    ppsDeclineOver30Days: number
  ): TrajectoryPrediction {
    let estimatedDays = 180;
    let phase: TrajectoryPrediction['phase'] = 'STABLE';

    if (currentPPS <= 20) {
      phase = 'TERMINAL';
      estimatedDays = diseaseType === DiseaseTrajectoryType.CANCER ? 7 : 14;
    } else if (currentPPS <= 40) {
      phase = 'DETERIORATING';
      estimatedDays = diseaseType === DiseaseTrajectoryType.CANCER ? 30 : 60;
    } else if (ppsDeclineOver30Days >= 20) {
      phase = 'UNSTABLE';
      estimatedDays = 90;
    }

    // Adjust based on trajectory type
    switch (diseaseType) {
      case DiseaseTrajectoryType.CANCER:
        // Cancer decline is usually steep at the end
        if (currentPPS <= 50) estimatedDays *= 0.8;
        break;
      case DiseaseTrajectoryType.ORGAN_FAILURE:
        // High unpredictability due to exacerbations (e.g., CHF, COPD)
        estimatedDays *= 1.2;
        break;
      case DiseaseTrajectoryType.FRAILTY_DEMENTIA:
        // Very slow dwindling
        estimatedDays *= 2.0;
        break;
    }

    const confidenceMargin = diseaseType === DiseaseTrajectoryType.ORGAN_FAILURE ? 0.5 : 0.2;
    const ciLower = Math.max(1, Math.round(estimatedDays * (1 - confidenceMargin)));
    const ciUpper = Math.round(estimatedDays * (1 + confidenceMargin));

    let recommendation = 'Continue current management';
    if (phase === 'TERMINAL') recommendation = 'Initiate Active Dying Comfort Measures; Continuous Care';
    else if (phase === 'DETERIORATING' || estimatedDays <= 180) recommendation = 'Hospice Evaluation Recommended';
    else if (phase === 'UNSTABLE') recommendation = 'Palliative Care Consult; Advance Care Planning';

    return {
      estimatedPrognosisDays: Math.round(estimatedDays),
      confidenceInterval: [ciLower, ciUpper],
      recommendedCareTransition: recommendation,
      phase
    };
  }
}

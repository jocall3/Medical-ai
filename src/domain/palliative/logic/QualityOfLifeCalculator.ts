/**
 * Quantifies patient well-being using validated palliative instruments.
 * This engine processes raw clinical inputs into standardized metrics like the
 * Edmonton Symptom Assessment System (ESAS) and Palliative Performance Scale (PPS).
 */

export interface ESASInput {
  pain: number;
  tiredness: number;
  drowsiness: number;
  nausea: number;
  lackOfAppetite: number;
  shortnessOfBreath: number;
  depression: number;
  anxiety: number;
  wellbeing: number;
}

export interface PPSInput {
  ambulation: 'FULL' | 'REDUCED' | 'MAINLY_SIT_LIE' | 'TOTALLY_BED_BOUND';
  activityEvidenceOfDisease: 'NORMAL' | 'SOME' | 'SIGNIFICANT' | 'EXTENSIVE';
  selfCare: 'FULL' | 'OCCASIONAL_ASSISTANCE' | 'CONSIDERABLE_ASSISTANCE' | 'MAINLY_ASSISTANCE' | 'TOTAL_CARE';
  intake: 'NORMAL' | 'REDUCED' | 'MINIMAL_SIPS' | 'MOUTH_CARE_ONLY';
  consciousLevel: 'FULL' | 'CONFUSION' | 'DROWSY_OR_COMA';
}

export class QualityOfLifeCalculator {
  /**
   * Calculates the total ESAS distress score (0-90).
   * Higher scores indicate worse symptom burden.
   */
  public static calculateESAS(input: ESASInput): number {
    return Object.values(input).reduce((sum, val) => sum + Math.max(0, Math.min(10, val)), 0);
  }

  /**
   * Determines the Palliative Performance Scale (PPS) percentage (0-100%).
   * PPS is a crucial prognostic tool in palliative care.
   */
  public static calculatePPS(input: PPSInput): number {
    // Simplified PPS logic matrix
    if (input.ambulation === 'TOTALLY_BED_BOUND') {
      if (input.intake === 'MOUTH_CARE_ONLY' || input.consciousLevel === 'DROWSY_OR_COMA') return 10;
      if (input.intake === 'MINIMAL_SIPS') return 20;
      return 30;
    }
    if (input.ambulation === 'MAINLY_SIT_LIE') {
      if (input.selfCare === 'MAINLY_ASSISTANCE') return 40;
      return 50;
    }
    if (input.ambulation === 'REDUCED') {
      if (input.selfCare === 'OCCASIONAL_ASSISTANCE') return 60;
      return 70;
    }
    // FULL ambulation
    if (input.activityEvidenceOfDisease === 'SOME') return 80;
    if (input.activityEvidenceOfDisease === 'NORMAL' && input.selfCare === 'FULL') return 100;
    return 90;
  }

  /**
   * Generates a holistic QoL index combining physical and functional metrics.
   */
  public static generateHolisticIndex(esas: ESASInput, pps: PPSInput): number {
    const esasScore = this.calculateESAS(esas);
    const ppsScore = this.calculatePPS(pps);
    
    // Normalize ESAS (0-90) to a 0-100 scale where 100 is perfect (0 distress)
    const normalizedEsas = 100 - ((esasScore / 90) * 100);
    
    // Weighted average: PPS (functionality) is often a stronger predictor of overall trajectory
    return (normalizedEsas * 0.4) + (ppsScore * 0.6);
  }
}

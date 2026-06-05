export interface HepaticMetabolicState {
  toxinConcentrationMgL: number;
  conjugatedBilirubinMgDl: number;
  unconjugatedBilirubinMgDl: number;
  clottingFactorSynthesisRate: number;
}

export class HepaticClearanceSimulator {
  /**
   * Simulates toxin clearance using the Well-Stirred Model of hepatic clearance:
   * Cl_h = Q * E = Q * (f_u * Cl_int) / (Q + f_u * Cl_int)
   */
  public static simulateToxinClearance(
    initialConcentrationMgL: number,
    bloodFlowRateLMin: number, // Normal: ~1.45 L/min
    intrinsicClearanceLMin: number,
    unboundFraction: number,
    durationHours: number
  ): number {
    if (initialConcentrationMgL <= 0) return 0;

    const numerator = unboundFraction * intrinsicClearanceLMin;
    const denominator = bloodFlowRateLMin + numerator;
    const hepaticClearance = bloodFlowRateLMin * (numerator / denominator);

    const volumeOfDistributionL = 42.0;
    const kePerMinute = hepaticClearance / volumeOfDistributionL;
    const kePerHour = kePerMinute * 60;

    const finalConcentration = initialConcentrationMgL * Math.exp(-kePerHour * durationHours);
    return Math.max(0, finalConcentration);
  }

  /**
   * Simulates bilirubin conjugation by UGT1A1 enzyme.
   */
  public static calculateBilirubinConjugation(
    unconjugatedBilirubinMgDl: number,
    ugt1a1ActivityFraction: number // 1.0 is normal, lower in Gilbert's syndrome
  ): {
    remainingUnconjugated: number;
    newConjugated: number;
  } {
    const Vmax = 1.2 * ugt1a1ActivityFraction;
    const Km = 0.5;

    if (unconjugatedBilirubinMgDl <= 0) {
      return { remainingUnconjugated: 0, newConjugated: 0 };
    }

    const velocity = (Vmax * unconjugatedBilirubinMgDl) / (Km + unconjugatedBilirubinMgDl);
    const conjugated = Math.min(unconjugatedBilirubinMgDl, velocity);
    
    return {
      remainingUnconjugated: unconjugatedBilirubinMgDl - conjugated,
      newConjugated: conjugated
    };
  }

  /**
   * Predicts clotting factor synthesis based on liver synthetic function markers (INR and Albumin).
   */
  public static predictClottingFactorSynthesis(
    inr: number,
    albuminGdl: number
  ): {
    synthesisRate: number;
    coagulopathyRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  } {
    let synthesisRate = 1.0;

    if (inr > 1.1) {
      synthesisRate -= (inr - 1.1) * 0.4;
    }

    if (albuminGdl < 3.5) {
      const deficit = 3.5 - albuminGdl;
      synthesisRate -= deficit * 0.15;
    }

    synthesisRate = Math.max(0.1, Math.min(1.0, synthesisRate));

    let coagulopathyRisk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    if (synthesisRate < 0.4 || inr > 2.0) {
      coagulopathyRisk = 'Severe';
    } else if (synthesisRate < 0.6 || inr > 1.5) {
      coagulopathyRisk = 'High';
    } else if (synthesisRate < 0.8 || inr > 1.2) {
      coagulopathyRisk = 'Moderate';
    }

    return {
      synthesisRate,
      coagulopathyRisk
    };
  }
}
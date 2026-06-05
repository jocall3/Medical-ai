/**
 * Models the accumulation of Amyloid-beta plaques and Tau tangles to predict
 * the trajectory of Alzheimer's disease and other dementias.
 */
export class CognitiveDeclinePredictor {
  /**
   * Predicts the cognitive decline trajectory over a specified number of years.
   * @param baselineAmyloid Baseline PET SUVr for Amyloid
   * @param baselineTau Baseline PET SUVr for Tau
   * @param geneticRiskFactor e.g., APOE4 allele count (0, 1, or 2)
   * @param years Years to project
   */
  public predictTrajectory(baselineAmyloid: number, baselineTau: number, geneticRiskFactor: number, years: number): Array<{ year: number, mmseScore: number, amyloidLoad: number, tauLoad: number }> {
    const trajectory = [];
    let currentAmyloid = baselineAmyloid;
    let currentTau = baselineTau;
    let currentMMSE = 30; // Mini-Mental State Examination max score

    const amyloidGrowthRate = 0.02 + (geneticRiskFactor * 0.015);
    
    for (let y = 0; y <= years; y++) {
      // Tau spread is accelerated by Amyloid presence
      const tauGrowthRate = 0.01 + (currentAmyloid > 1.2 ? 0.03 : 0.005);
      
      currentAmyloid += currentAmyloid * amyloidGrowthRate;
      currentTau += currentTau * tauGrowthRate;

      // Cognitive decline accelerates as Tau accumulates in neocortex
      if (currentTau > 1.3) {
        const declineRate = (currentTau - 1.3) * 2.5;
        currentMMSE = Math.max(0, currentMMSE - declineRate);
      }

      trajectory.push({
        year: y,
        mmseScore: Math.round(currentMMSE * 10) / 10,
        amyloidLoad: currentAmyloid,
        tauLoad: currentTau
      });
    }

    return trajectory;
  }
}

export class SarcopeniaSimulator {
  /**
   * Simulates skeletal muscle mass over time.
   * @param currentMassKg Current appendicular skeletal muscle mass (ASM) in kg
   * @param ageYears Patient's age
   * @param proteinIntakeGramsPerKg Daily protein intake
   * @param resistanceTrainingDaysPerWeek Frequency of resistance training
   * @param timeYears Time horizon to simulate
   */
  public simulateMuscleMass(
    currentMassKg: number,
    ageYears: number,
    proteinIntakeGramsPerKg: number,
    resistanceTrainingDaysPerWeek: number,
    timeYears: number
  ): number {
    // Base age-related decline (approx 1% per year after 50)
    let annualDeclineRate = ageYears > 50 ? 0.01 : 0.002;
    
    // Accelerates after 70
    if (ageYears > 70) annualDeclineRate = 0.015;

    // Protein synthesis resistance in aging (anabolic resistance)
    const proteinFactor = proteinIntakeGramsPerKg >= 1.2 ? 0.005 : -0.005;
    
    // Resistance training is the most potent intervention
    const exerciseFactor = resistanceTrainingDaysPerWeek * 0.008;

    const netAnnualChangeRate = exerciseFactor + proteinFactor - annualDeclineRate;

    let projectedMass = currentMassKg;
    for (let i = 0; i < timeYears; i++) {
      projectedMass += projectedMass * netAnnualChangeRate;
    }

    return Math.max(0, projectedMass);
  }
}

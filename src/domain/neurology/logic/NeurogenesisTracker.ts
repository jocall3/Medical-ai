/**
 * Calculates the rate of new neuron formation in the dentate gyrus of the hippocampus.
 * Factors in lifestyle interventions (exercise, diet) and pharmacological agents.
 */
export class NeurogenesisTracker {
  private baseRate: number = 700; // Approx new neurons per day in adult human hippocampus

  /**
   * Calculates the adjusted neurogenesis rate.
   * @param exerciseHoursPerWeek Hours of aerobic exercise
   * @param dietQualityIndex 0 to 100 scale (e.g., Mediterranean diet adherence)
   * @param ssriActive Boolean indicating if patient is on SSRI antidepressants
   */
  public calculateRate(exerciseHoursPerWeek: number, dietQualityIndex: number, ssriActive: boolean): number {
    let multiplier = 1.0;

    // Aerobic exercise increases BDNF, boosting neurogenesis
    if (exerciseHoursPerWeek > 3) {
      multiplier += 0.3; // 30% boost
    }

    // High quality diet (omega-3s, flavonoids) supports survival of new neurons
    if (dietQualityIndex > 80) {
      multiplier += 0.15;
    } else if (dietQualityIndex < 40) {
      multiplier -= 0.2; // Poor diet/inflammation reduces neurogenesis
    }

    // SSRIs are known to increase hippocampal neurogenesis
    if (ssriActive) {
      multiplier += 0.25;
    }

    return Math.round(this.baseRate * multiplier);
  }
}

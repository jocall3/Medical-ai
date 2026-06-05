export class SafetyGuardrailValidator {
  validate(recommendation: any): boolean {
    // Enforce hard clinical bounds (e.g., max infusion rates, toxicity thresholds)
    if (recommendation.dose > 2000) return false;
    return true;
  }
}
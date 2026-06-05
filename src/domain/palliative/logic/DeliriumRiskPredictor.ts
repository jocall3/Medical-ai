/**
 * Identifies the risk of terminal delirium based on medication burden, infection,
 * and metabolic derangements. Terminal delirium (agitated restlessness) occurs in
 * up to 88% of dying patients and causes severe distress to families.
 * 
 * Uses the PINCH ME mnemonic conceptually: Pain, INfection, Constipation, Hydration, Medication, Environment.
 */

export interface DeliriumRiskFactors {
  age: number;
  hasDementia: boolean;
  infectionPresent: boolean;
  daysWithoutBowelMovement: number;
  bunCrRatio: number; // Indicator of dehydration
  anticholinergicBurdenScore: number; // 0-10+
  opioidDoseEscalation: boolean; // Rapid escalation increases risk
  painScore: number;
}

export class DeliriumRiskPredictor {
  /**
   * Calculates a percentage risk (0-100%) of developing terminal delirium within 48 hours.
   */
  public static calculateRisk(factors: DeliriumRiskFactors): number {
    let riskScore = 0;

    // Baseline vulnerabilities
    if (factors.age > 75) riskScore += 10;
    if (factors.hasDementia) riskScore += 25;

    // Acute precipitants (PINCH ME)
    if (factors.painScore > 6) riskScore += 15; // Uncontrolled Pain
    if (factors.infectionPresent) riskScore += 20; // INfection
    if (factors.daysWithoutBowelMovement > 3) riskScore += 10; // Constipation
    if (factors.bunCrRatio > 20) riskScore += 15; // Hydration (Dehydration)
    
    // Medications
    riskScore += (factors.anticholinergicBurdenScore * 5);
    if (factors.opioidDoseEscalation) riskScore += 20; // Opioid-induced neurotoxicity (OIN)

    return Math.min(100, riskScore);
  }

  /**
   * Generates actionable recommendations to mitigate delirium risk.
   */
  public static generateMitigationPlan(factors: DeliriumRiskFactors): string[] {
    const plan: string[] = [];
    const risk = this.calculateRisk(factors);

    if (risk > 50) {
      plan.push('High Risk for Delirium: Educate family on terminal restlessness.');
    }

    if (factors.anticholinergicBurdenScore > 3) {
      plan.push('Review and deprescribe non-essential anticholinergic medications.');
    }
    if (factors.opioidDoseEscalation) {
      plan.push('Consider opioid rotation or hydration to clear active metabolites (OIN).');
    }
    if (factors.daysWithoutBowelMovement > 3) {
      plan.push('Administer aggressive bowel regimen (e.g., Senna/Docusate, Enema).');
    }
    if (factors.painScore > 6 && factors.hasDementia) {
      plan.push('Assess for unrecognized pain as a cause of agitation; consider scheduled analgesia.');
    }

    return plan;
  }
}

export interface FallRiskFactors {
  timedUpAndGoSeconds: number;
  visionAcuityLogMAR: number;
  systolicDropStanding: number; // Orthostatic hypotension
  homeHazardScore: number; // 0-10
  previousFallsCount: number;
}

export class FallRiskPredictor {
  public predictFallProbability(factors: FallRiskFactors): number {
    let riskScore = 0;

    // TUG test > 12 seconds indicates high risk
    if (factors.timedUpAndGoSeconds > 12) riskScore += 0.3;
    
    // Vision impairment
    if (factors.visionAcuityLogMAR > 0.3) riskScore += 0.15;
    
    // Orthostatic hypotension (>20 mmHg drop)
    if (factors.systolicDropStanding >= 20) riskScore += 0.25;
    
    // Home hazards
    riskScore += (factors.homeHazardScore / 10) * 0.1;
    
    // Previous falls are the strongest predictor
    if (factors.previousFallsCount > 0) riskScore += 0.4;

    return Math.min(1.0, riskScore);
  }

  public generateRecommendations(factors: FallRiskFactors): string[] {
    const recs: string[] = [];
    if (factors.timedUpAndGoSeconds > 12) recs.push("Initiate physical therapy for gait and balance training.");
    if (factors.systolicDropStanding >= 20) recs.push("Review antihypertensive medications; advise slow positional changes.");
    if (factors.homeHazardScore > 5) recs.push("Order occupational therapy home safety evaluation.");
    return recs;
  }
}

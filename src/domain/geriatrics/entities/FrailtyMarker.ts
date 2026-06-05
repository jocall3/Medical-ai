export class FrailtyMarker {
  constructor(
    public readonly patientId: string,
    public gripStrengthKg: number,
    public walkingSpeedMps: number,
    public unintentionalWeightLossKg: number,
    public exhaustionScore: number, // 0-3 scale
    public lowPhysicalActivity: boolean
  ) {}

  public calculateFriedFrailtyScore(): number {
    let score = 0;
    if (this.gripStrengthKg < 26) score++; // Simplified threshold for men
    if (this.walkingSpeedMps < 0.8) score++;
    if (this.unintentionalWeightLossKg > 4.5) score++;
    if (this.exhaustionScore >= 2) score++;
    if (this.lowPhysicalActivity) score++;
    return score;
  }

  public getFrailtyStatus(): 'Robust' | 'Pre-frail' | 'Frail' {
    const score = this.calculateFriedFrailtyScore();
    if (score === 0) return 'Robust';
    if (score <= 2) return 'Pre-frail';
    return 'Frail';
  }
}

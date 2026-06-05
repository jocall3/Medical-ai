export class Telomere {
  private static readonly HAYFLICK_LIMIT = 50;
  private static readonly CRITICAL_LENGTH_BP = 3000;

  constructor(
    public readonly chromosomeId: string,
    public lengthInBasePairs: number,
    public divisionCount: number = 0,
    public attritionRatePerDivision: number = 50
  ) {}

  public divide(): void {
    if (this.divisionCount >= Telomere.HAYFLICK_LIMIT || this.lengthInBasePairs <= Telomere.CRITICAL_LENGTH_BP) {
      throw new Error("Cellular senescence triggered: Hayflick limit reached or critical telomere length.");
    }
    this.lengthInBasePairs -= this.attritionRatePerDivision;
    this.divisionCount++;
  }

  public applyTelomerase(activityLevel: number): void {
    const basePairsAdded = activityLevel * 10;
    this.lengthInBasePairs += basePairsAdded;
  }

  public isCriticallyShort(): boolean {
    return this.lengthInBasePairs <= Telomere.CRITICAL_LENGTH_BP;
  }
}

export type SmallIntestineSection = 'Duodenum' | 'Jejunum' | 'Ileum';
export type MarshClassification = 'Marsh_0' | 'Marsh_1' | 'Marsh_2' | 'Marsh_3a' | 'Marsh_3b' | 'Marsh_3c';

export class IntestinalVilli {
  constructor(
    public readonly section: SmallIntestineSection,
    public averageHeightMicrometers: number, // Normal: ~500-1000 um
    public cryptDepthMicrometers: number,    // Normal: ~150-300 um
    public marshScore: MarshClassification = 'Marsh_0'
  ) {}

  /**
   * Calculates the villus-to-crypt ratio.
   * Normal ratio is typically between 3:1 and 5:1. Ratios below 2:1 indicate significant blunting/atrophy.
   */
  public getVillusToCryptRatio(): number {
    if (this.cryptDepthMicrometers <= 0) return 0;
    return this.averageHeightMicrometers / this.cryptDepthMicrometers;
  }

  /**
   * Calculates the surface area multiplier based on villus height and crypt depth.
   * Healthy villi increase the absorptive surface area of the small intestine by up to 30-fold.
   */
  public calculateSurfaceAreaMultiplier(): number {
    const ratio = this.getVillusToCryptRatio();
    if (this.marshScore === 'Marsh_3c') return 1.2; // Total villous atrophy, surface area severely reduced
    if (this.marshScore === 'Marsh_3b') return 2.5; // Subtotal villous atrophy
    if (this.marshScore === 'Marsh_3a') return 5.0; // Partial villous atrophy
    
    // Dynamic calculation based on height and ratio
    const baseMultiplier = 30.0;
    const healthFactor = Math.min(1.0, ratio / 4.0);
    return Math.max(1.0, baseMultiplier * healthFactor);
  }

  /**
   * Assesses the severity of villous atrophy.
   */
  public assessAtrophySeverity(): 'None' | 'Mild' | 'Moderate' | 'Severe' {
    const ratio = this.getVillusToCryptRatio();
    if (this.marshScore === 'Marsh_3c' || ratio < 1.0) {
      return 'Severe';
    }
    if (this.marshScore === 'Marsh_3b' || (ratio >= 1.0 && ratio < 2.0)) {
      return 'Moderate';
    }
    if (this.marshScore === 'Marsh_3a' || this.marshScore === 'Marsh_2' || (ratio >= 2.0 && ratio < 3.0)) {
      return 'Mild';
    }
    return 'None';
  }

  /**
   * Updates the villi metrics based on a new biopsy report.
   */
  public updateFromBiopsy(height: number, depth: number, marsh: MarshClassification): void {
    if (height <= 0 || depth <= 0) {
      throw new Error("Villus height and crypt depth must be positive values.");
    }
    this.averageHeightMicrometers = height;
    this.cryptDepthMicrometers = depth;
    this.marshScore = marsh;
  }
}
export class VesselSegment {
  constructor(
    public readonly segmentId: string,
    public readonly name: string,
    public readonly lengthCm: number,
    public radiusMm: number,
    public elasticityYoungsModulusMPa: number, // Young's modulus (higher means stiffer)
    public plaqueBuildupPercentage: number,    // 0 to 100
    public endothelialHealthIndex: number,     // 0.0 (dead) to 1.0 (perfect)
    public calcificationScoreAgatston: number,
    public shearStressDynesCm2: number = 15.0
  ) {}

  /**
   * Calculates vascular resistance using Poiseuille's Law: R = (8 * eta * L) / (pi * r^4)
   * @param bloodViscositycP cP (centipoise), default is 3.5 cP (0.0035 Pa·s)
   */
  public calculateResistance(bloodViscositycP: number = 3.5): number {
    const eta = bloodViscositycP * 0.001; // Convert to Pa·s
    const lengthMeters = this.lengthCm / 100;
    // Adjust radius based on plaque buildup
    const effectiveRadiusMeters = (this.radiusMm * (1 - this.plaqueBuildupPercentage / 100)) / 1000;

    if (effectiveRadiusMeters <= 0) {
      return Infinity;
    }

    return (8 * eta * lengthMeters) / (Math.PI * Math.pow(effectiveRadiusMeters, 4));
  }

  /**
   * Updates endothelial health based on local shear stress and systemic inflammatory markers.
   */
  public updateEndothelialHealth(hsCRP: number, ldlMgDl: number): void {
    // Low shear stress (< 10 dynes/cm2) or extremely high turbulent shear stress (> 100 dynes/cm2)
    // combined with high hsCRP and LDL degrades endothelial health.
    let degradation = 0.0;
    if (this.shearStressDynesCm2 < 10.0) {
      degradation += 0.05;
    } else if (this.shearStressDynesCm2 > 70.0) {
      degradation += 0.08;
    }

    if (hsCRP > 3.0) {
      degradation += 0.05;
    }
    if (ldlMgDl > 130) {
      degradation += 0.04;
    }

    this.endothelialHealthIndex = Math.max(0.0, Math.min(1.0, this.endothelialHealthIndex - degradation));
  }

  /**
   * Calculates wall shear stress (WSS) based on flow rate (mL/s)
   * WSS = (4 * eta * Q) / (pi * r^3)
   */
  public calculateAndSetShearStress(flowRateMlPerSec: number, bloodViscositycP: number = 3.5): void {
    const eta = bloodViscositycP * 0.001; // Pa·s
    const flowRateM3PerSec = flowRateMlPerSec * 1e-6;
    const effectiveRadiusMeters = (this.radiusMm * (1 - this.plaqueBuildupPercentage / 100)) / 1000;

    if (effectiveRadiusMeters <= 0) {
      this.shearStressDynesCm2 = 0;
      return;
    }

    const wssPa = (4 * eta * flowRateM3PerSec) / (Math.PI * Math.pow(effectiveRadiusMeters, 3));
    this.shearStressDynesCm2 = wssPa * 10; // 1 Pa = 10 dynes/cm2
  }
}
export type ValveType = 'MITRAL' | 'AORTIC' | 'TRICUSPID' | 'PULMONARY';
export type SeverityLevel = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

export class HeartValve {
  constructor(
    public readonly valveType: ValveType,
    public effectiveOrificeAreaCm2: number,
    public regurgitantFraction: number, // 0.0 to 1.0
    public meanGradientMmHg: number,
    public stenosisSeverity: SeverityLevel = 'NONE',
    public regurgitationSeverity: SeverityLevel = 'NONE',
    public calcificationLevel: SeverityLevel = 'NONE'
  ) {
    this.evaluateSeverities();
  }

  public evaluateSeverities(): void {
    // Evaluate Stenosis based on ACC/AHA guidelines
    if (this.valveType === 'AORTIC') {
      if (this.effectiveOrificeAreaCm2 <= 1.0 || this.meanGradientMmHg >= 40) {
        this.stenosisSeverity = 'SEVERE';
      } else if (this.effectiveOrificeAreaCm2 <= 1.5 || this.meanGradientMmHg >= 20) {
        this.stenosisSeverity = 'MODERATE';
      } else if (this.effectiveOrificeAreaCm2 < 2.0) {
        this.stenosisSeverity = 'MILD';
      } else {
        this.stenosisSeverity = 'NONE';
      }
    } else if (this.valveType === 'MITRAL') {
      if (this.effectiveOrificeAreaCm2 <= 1.0) {
        this.stenosisSeverity = 'SEVERE';
      } else if (this.effectiveOrificeAreaCm2 <= 1.5) {
        this.stenosisSeverity = 'MODERATE';
      } else if (this.effectiveOrificeAreaCm2 <= 2.5) {
        this.stenosisSeverity = 'MILD';
      } else {
        this.stenosisSeverity = 'NONE';
      }
    }

    // Evaluate Regurgitation based on Regurgitant Fraction
    if (this.regurgitantFraction >= 0.5) {
      this.regurgitationSeverity = 'SEVERE';
    } else if (this.regurgitantFraction >= 0.3) {
      this.regurgitationSeverity = 'MODERATE';
    } else if (this.regurgitantFraction >= 0.15) {
      this.regurgitationSeverity = 'MILD';
    } else {
      this.regurgitationSeverity = 'NONE';
    }
  }

  /**
   * Calculates pressure drop across the valve using the simplified Bernoulli equation:
   * Delta P = 4 * v^2, where v = flowRate / (effectiveOrificeArea)
   */
  public calculatePressureDrop(flowRateMlPerSec: number): number {
    if (this.effectiveOrificeAreaCm2 <= 0) {
      return Infinity;
    }
    // Flow rate in cm3/s (which is equal to mL/s)
    const velocityCmSec = flowRateMlPerSec / this.effectiveOrificeAreaCm2;
    const velocityMSec = velocityCmSec / 100;
    return 4 * Math.pow(velocityMSec, 2);
  }
}
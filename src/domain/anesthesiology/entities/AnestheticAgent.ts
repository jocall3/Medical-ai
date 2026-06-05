/**
 * Models pharmacological properties of anesthetic agents, including inhaled (Volatiles)
 * and intravenous (IV) drugs. Tracks MAC, EC50, and Context-Sensitive Half-Time (CSHT).
 */
export enum AgentRoute {
  INHALED = 'INHALED',
  INTRAVENOUS = 'INTRAVENOUS',
  NEURAXIAL = 'NEURAXIAL'
}

export class AnestheticAgent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly route: AgentRoute,
    public readonly macValue?: number, // Minimum Alveolar Concentration (for inhaled)
    public readonly ec50?: number,     // Effective Concentration 50% (for IV)
    private cshtCurve: Map<number, number> = new Map() // Infusion duration (mins) -> CSHT (mins)
  ) {}

  /**
   * Calculates the Context-Sensitive Half-Time based on the duration of continuous infusion.
   * @param infusionDurationMinutes The time the drug has been continuously infused.
   * @returns The estimated time for the plasma concentration to drop by 50%.
   */
  public getContextSensitiveHalfTime(infusionDurationMinutes: number): number {
    if (this.route !== AgentRoute.INTRAVENOUS) {
      throw new Error('CSHT is primarily modeled for continuous intravenous infusions.');
    }
    
    // Interpolate from the CSHT curve (simplified linear interpolation for the model)
    let lowerBound = 0;
    let upperBound = Math.max(...Array.from(this.cshtCurve.keys()));
    
    for (const duration of Array.from(this.cshtCurve.keys()).sort((a, b) => a - b)) {
      if (duration === infusionDurationMinutes) return this.cshtCurve.get(duration)!;
      if (duration < infusionDurationMinutes) lowerBound = duration;
      if (duration > infusionDurationMinutes) {
        upperBound = duration;
        break;
      }
    }
    
    const lowerCSHT = this.cshtCurve.get(lowerBound) || 0;
    const upperCSHT = this.cshtCurve.get(upperBound) || lowerCSHT;
    
    if (upperBound === lowerBound) return lowerCSHT;
    
    const ratio = (infusionDurationMinutes - lowerBound) / (upperBound - lowerBound);
    return lowerCSHT + ratio * (upperCSHT - lowerCSHT);
  }

  public calculateAgeAdjustedMAC(age: number): number {
    if (this.route !== AgentRoute.INHALED || !this.macValue) {
      throw new Error('MAC adjustment only applies to inhaled anesthetics.');
    }
    // Mapleson's equation for age-adjusted MAC: MAC_age = MAC_40 * 10^(-0.00269 * (age - 40))
    return this.macValue * Math.pow(10, -0.00269 * (age - 40));
  }
}

export interface EnzymeKinetics {
  vMax: number;
  kM: number;
}

export class Enzyme {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly primarySubstrates: string[],
    public readonly products: string[],
    public readonly optimalPhRange: { min: number; max: number },
    public readonly optimalTemperatureCelsius: number,
    public readonly secretionSite: string,
    public readonly kinetics: EnzymeKinetics
  ) {}

  public calculateRelativeActivity(currentPh: number, currentTempCelsius: number): number {
    const phMin = this.optimalPhRange.min;
    const phMax = this.optimalPhRange.max;
    const phOpt = (phMin + phMax) / 2;
    const phSpan = phMax - phMin;
    
    const phFactor = Math.max(0, 1 - Math.pow((currentPh - phOpt) / (phSpan / 2), 2));
    
    let tempFactor = 0;
    if (currentTempCelsius <= this.optimalTemperatureCelsius) {
      tempFactor = Math.pow(2, (currentTempCelsius - this.optimalTemperatureCelsius) / 10);
    } else {
      tempFactor = Math.max(0, 1 - Math.pow((currentTempCelsius - this.optimalTemperatureCelsius) / 5, 2));
    }

    return Math.min(1, Math.max(0, phFactor * tempFactor));
  }

  public calculateReactionRate(substrateConcentrationMm: number, relativeActivity: number): number {
    const effectiveVmax = this.kinetics.vMax * relativeActivity;
    return (effectiveVmax * substrateConcentrationMm) / (this.kinetics.kM + substrateConcentrationMm);
  }
}
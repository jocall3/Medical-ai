export type CytokineType = "PRO_INFLAMMATORY" | "ANTI_INFLAMMATORY" | "CHEMOKINE" | "GROWTH_FACTOR";

export class Cytokine {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: CytokineType,
    public concentrationPgMl: number,
    public readonly halfLifeMinutes: number,
    public diffusionCoefficient: number,
    public receptorKdMolar: number
  ) {}

  public decay(elapsedMinutes: number): void {
    const decayConstant = Math.LN2 / this.halfLifeMinutes;
    this.concentrationPgMl = this.concentrationPgMl * Math.exp(-decayConstant * elapsedMinutes);
    if (this.concentrationPgMl < 1e-5) {
      this.concentrationPgMl = 0;
    }
  }

  public calculateReceptorOccupancy(receptorDensity: number): number {
    const molarity = (this.concentrationPgMl * 1e-12) / 20000;
    const occupancy = molarity / (molarity + this.receptorKdMolar);
    return occupancy * receptorDensity;
  }

  public simulateDiffusion(distanceMm: number, hours: number): number {
    if (hours <= 0) return this.concentrationPgMl;
    const denominator = 2 * Math.sqrt(this.diffusionCoefficient * hours);
    const argument = distanceMm / denominator;
    
    const erfc = (z: number): number => {
      const t = 1.0 / (1.0 + 0.5 * Math.abs(z));
      const ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
      return z >= 0 ? ans : 2.0 - ans;
    };

    return this.concentrationPgMl * erfc(argument); 
  }
}
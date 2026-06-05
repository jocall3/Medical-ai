export type ImmunoglobulinIsotype = "IgG" | "IgA" | "IgM" | "IgE" | "IgD";

export interface ParatopeSequence {
  cdr1: string;
  cdr2: string;
  cdr3: string;
}

export class Antibody {
  constructor(
    public readonly id: string,
    public isotype: ImmunoglobulinIsotype,
    public readonly paratope: ParatopeSequence,
    public antigenAffinityKd: number,
    public somaticHypermutationCount: number = 0,
    public halfLifeDays: number = 21,
    public concentrationMgMl: number = 0.1
  ) {
    this.setHalfLifeByIsotype();
  }

  private setHalfLifeByIsotype(): void {
    switch (this.isotype) { 
      case "IgG": this.halfLifeDays = 21; break;
      case "IgA": this.halfLifeDays = 6; break;
      case "IgM": this.halfLifeDays = 5; break;
      case "IgE": this.halfLifeDays = 2; break;
      case "IgD": this.halfLifeDays = 3; break;
    }
  }

  public performSomaticHypermutation(mutationRate: number, selectionPressure: number): void {
    this.somaticHypermutationCount++;
    const roll = Math.random();
    const mutationEffect = (roll - (0.4 + selectionPressure * 0.2));
    
    if (mutationEffect < 0) {
      const improvementFactor = 1 + Math.abs(mutationEffect) * 2;
      this.antigenAffinityKd = this.antigenAffinityKd / improvementFactor;
    } else {
      const worseningFactor = 1 + mutationEffect * 1.5;
      this.antigenAffinityKd = this.antigenAffinityKd * worseningFactor;
    }

    if (this.antigenAffinityKd < 1e-12) {
      this.antigenAffinityKd = 1e-12;
    }
  }

  public switchIsotype(newIsotype: ImmunoglobulinIsotype): void {
    this.isotype = newIsotype;
    this.setHalfLifeByIsotype();
  }

  public calculateNeutralizationIndex(antigenConcentrationM: number): number {
    const abMolar = this.concentrationMgMl / (this.isotype === "IgM" ? 900000 : 150000);
    const boundFraction = abMolar / (abMolar + this.antigenAffinityKd);
    return boundFraction;
  }
}
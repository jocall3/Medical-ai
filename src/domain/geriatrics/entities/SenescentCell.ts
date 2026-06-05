export enum SASPFactor {
  IL6 = 'IL-6',
  IL8 = 'IL-8',
  TNF_ALPHA = 'TNF-alpha',
  MMP3 = 'MMP-3',
  MMP9 = 'MMP-9',
  TGF_BETA = 'TGF-beta'
}

export class SenescentCell {
  constructor(
    public readonly id: string,
    public cellType: string,
    public p16INK4aExpression: number,
    public p21Cip1Expression: number,
    public saspProfile: Set<SASPFactor>,
    public metabolicActivity: number,
    public apoptosisResistance: boolean = true
  ) {}

  public secreteSASP(): SASPFactor[] {
    return Array.from(this.saspProfile);
  }

  public applySenolytic(drugEfficacy: number): boolean {
    if (this.apoptosisResistance && drugEfficacy > 0.8) {
      this.apoptosisResistance = false;
      return true; // Cell undergoes apoptosis
    }
    return false;
  }
}

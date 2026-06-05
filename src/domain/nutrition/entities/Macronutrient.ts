export type MacronutrientType = 'CARBOHYDRATE' | 'PROTEIN' | 'FAT';

export interface MetabolicPathway {
  name: string;
  keyEnzymes: string[];
  primarySubstrates: string[];
  endProducts: string[];
  atpYieldPerMole: number;
}

export class Macronutrient {
  constructor(
    public readonly type: MacronutrientType,
    public readonly name: string,
    public readonly caloricDensityKcalPerGram: number,
    public readonly metabolicPathways: MetabolicPathway[],
    public readonly absorptionSite: string,
    public readonly rdaPercentageOfTotalCalories: { min: number; max: number }
  ) {}

  public calculateEnergyYield(grams: number): number {
    if (grams < 0) throw new Error("Grams cannot be negative");
    return grams * this.caloricDensityKcalPerGram;
  }

  public estimateMetabolicWaterProduction(grams: number): number {
    switch (this.type) {
      case 'FAT':
        return grams * 1.07;
      case 'CARBOHYDRATE':
        return grams * 0.6;
      case 'PROTEIN':
        return grams * 0.41;
      default:
        return 0;
    }
  }
}
export type PhylumType = 'Firmicutes' | 'Bacteroidetes' | 'Actinobacteria' | 'Proteobacteria' | 'Verrucomicrobia' | 'Other';
export type OxygenToleranceType = 'ObligateAnaerobe' | 'FacultativeAnaerobe' | 'ObligateAerobe' | 'Microaerophilic';

export interface ShortChainFattyAcids {
  acetate: number;   // mmol/L per unit abundance per hour
  propionate: number; // mmol/L per unit abundance per hour
  butyrate: number;   // mmol/L per unit abundance per hour
}

export class GutMicrobe {
  constructor(
    public readonly strainId: string,
    public readonly strainName: string,
    public readonly phylum: PhylumType,
    public abundancePercentage: number, // 0.0 to 100.0
    public readonly metabolicByproducts: ShortChainFattyAcids,
    public readonly optimalPh: number,
    public readonly oxygenTolerance: OxygenToleranceType
  ) {
    if (abundancePercentage < 0 || abundancePercentage > 100) {
      throw new Error("Abundance percentage must be between 0 and 100.");
    }
  }

  /**
   * Calculates the metabolic output of short-chain fatty acids (SCFAs) based on substrate availability.
   * SCFAs are critical for colonocyte health, immune regulation, and maintaining mucosal barrier integrity.
   * @param substrateAvailability Factor representing prebiotic/fiber availability (0.0 to 1.0)
   */
  public calculateMetabolicOutput(substrateAvailability: number): ShortChainFattyAcids {
    const boundedSubstrate = Math.max(0, Math.min(1, substrateAvailability));
    const abundanceFraction = this.abundancePercentage / 100;

    return {
      acetate: this.metabolicByproducts.acetate * abundanceFraction * boundedSubstrate,
      propionate: this.metabolicByproducts.propionate * abundanceFraction * boundedSubstrate,
      butyrate: this.metabolicByproducts.butyrate * abundanceFraction * boundedSubstrate,
    };
  }

  /**
   * Determines if the current abundance of this strain indicates potential dysbiosis.
   * For example, overgrowth of Proteobacteria or extreme depletion of butyrate-producing Firmicutes.
   */
  public isDysbiotic(): boolean {
    if (this.phylum === 'Proteobacteria' && this.abundancePercentage > 15.0) {
      return true; // Proteobacteria overgrowth is associated with inflammatory states
    }
    if (this.strainName.toLowerCase().includes('faecalibacterium prausnitzii') && this.abundancePercentage < 1.0) {
      return true; // Depletion of key anti-inflammatory butyrate producers
    }
    return false;
  }
}
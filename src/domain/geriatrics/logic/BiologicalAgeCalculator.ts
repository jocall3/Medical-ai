export interface EpigeneticProfile {
  cpgSites: Record<string, number>; // Methylation beta values
}

export interface BiomarkerPanel {
  albumin: number;
  creatinine: number;
  glucose: number;
  cReactiveProtein: number;
  lymphocytePercent: number;
  meanCellVolume: number;
  redCellDistributionWidth: number;
  alkalinePhosphatase: number;
  whiteBloodCellCount: number;
  chronologicalAge: number;
}

export class BiologicalAgeCalculator {
  public calculateHorvathClock(profile: EpigeneticProfile): number {
    // Simplified simulation of the Horvath multi-tissue clock (353 CpG sites)
    let ageEstimate = 0;
    const weights = { 'cg16867657': 0.5, 'cg24724428': -0.3 }; // Mock weights
    for (const [site, beta] of Object.entries(profile.cpgSites)) {
      if (weights[site as keyof typeof weights]) {
        ageEstimate += beta * weights[site as keyof typeof weights];
      }
    }
    return Math.max(0, ageEstimate * 100); // Mock transformation
  }

  public calculatePhenoAge(panel: BiomarkerPanel): number {
    // Levine's Phenotypic Age calculation (simplified mock)
    const mortalityScore = 
      -19.907 - 0.0336 * panel.albumin + 0.0095 * panel.creatinine + 
      0.1953 * panel.glucose + 0.0954 * Math.log(panel.cReactiveProtein) + 
      0.012 * panel.lymphocytePercent + 0.0268 * panel.meanCellVolume + 
      0.3306 * panel.redCellDistributionWidth + 0.00188 * panel.alkalinePhosphatase + 
      0.0554 * panel.whiteBloodCellCount + 0.0804 * panel.chronologicalAge;
    
    const phenoAge = 141.50225 + 118.2842 * mortalityScore;
    return phenoAge;
  }
}

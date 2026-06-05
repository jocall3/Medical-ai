export enum SenolyticAgent {
  DASATINIB_QUERCETIN = 'Dasatinib+Quercetin',
  FISETIN = 'Fisetin',
  NAVITOCLAX = 'Navitoclax'
}

export enum CR_Mimetic {
  RAPAMYCIN = 'Rapamycin',
  METFORMIN = 'Metformin',
  RESVERATROL = 'Resveratrol'
}

export class LongevityIntervention {
  constructor(
    public readonly protocolId: string,
    public readonly patientId: string,
    public activeSenolytics: SenolyticAgent[] = [],
    public activeCRMimetics: CR_Mimetic[] = [],
    public nadBoosters: boolean = false,
    public hormoneOptimization: boolean = false
  ) {}

  public prescribeSenolytic(agent: SenolyticAgent): void {
    if (!this.activeSenolytics.includes(agent)) {
      this.activeSenolytics.push(agent);
    }
  }

  public prescribeCRMimetic(agent: CR_Mimetic): void {
    if (!this.activeCRMimetics.includes(agent)) {
      this.activeCRMimetics.push(agent);
    }
  }

  public evaluateEfficacy(baselineBiologicalAge: number, currentBiologicalAge: number): string {
    const ageReduction = baselineBiologicalAge - currentBiologicalAge;
    if (ageReduction > 0) {
      return `Protocol Successful: Biological age reduced by ${ageReduction.toFixed(2)} years.`;
    } else {
      return `Protocol Ineffective: Biological age increased or remained stagnant. Consider adjusting mTOR inhibitors or senolytic frequency.`;
    }
  }
}

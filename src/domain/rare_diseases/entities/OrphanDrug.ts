export interface OrphanDrugDetails {
  mechanismOfAction: string;
  therapeuticClass: 'AntisenseOligonucleotide' | 'GeneTherapy' | 'SmallMolecule' | 'EnzymeReplacement';
  regulatoryStatus: 'Investigational' | 'OrphanDesignation' | 'Approved';
  targetGene: string;
  deliveryMethod: string;
}

export class OrphanDrug {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly details: OrphanDrugDetails,
    public readonly manufacturer: string,
    public readonly dosageGuidelines: string,
    public readonly indications: string[]
  ) {}

  public isApprovedFor(conditionId: string): boolean {
    return this.indications.includes(conditionId);
  }

  public getTherapeuticCategory(): string {
    return this.details.therapeuticClass;
  }
}
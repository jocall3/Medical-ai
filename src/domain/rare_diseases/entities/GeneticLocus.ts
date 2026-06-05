export class GeneticLocus {
  constructor(
    public readonly chromosome: string, // e.g., '1', 'X', 'Y'
    public readonly startPosition: number,
    public readonly endPosition: number,
    public readonly referenceGenome: 'GRCh37' | 'GRCh38',
    public readonly associatedGene: string,
    public readonly variantType: 'SNV' | 'Indel' | 'CNV' | 'Translocation'
  ) {}

  public getRange(): string {
    return `chr${this.chromosome}:${this.startPosition}-${this.endPosition}`;
  }

  public getLocusLength(): number {
    return this.endPosition - this.startPosition;
  }
}
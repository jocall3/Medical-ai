/**
 * Models a clinical sign using the Human Phenotype Ontology (HPO) standard.
 * HPO terms are used to turn clinical descriptions into computable formats.
 */
export class PhenotypeFeature {
  constructor(
    public readonly hpoId: string, // e.g., 'HP:0001166' for arachnodactyly
    public readonly term: string, // e.g., 'Arachnodactyly'
    public readonly severity: 'Mild' | 'Moderate' | 'Severe',
    public readonly onsetAge: number | null,
    public readonly isPathognomonic: boolean = false
  ) {}

  public getIdentifier(): string {
    return this.hpoId;
  }

  public equals(other: PhenotypeFeature): boolean {
    return this.hpoId === other.hpoId;
  }
}
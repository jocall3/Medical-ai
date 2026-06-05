import { PhenotypeFeature } from '../entities/PhenotypeFeature';
import { GeneticLocus } from '../entities/GeneticLocus';

export interface PatientRecord {
  patientId: string;
  phenotypes: PhenotypeFeature[];
  genotypes: GeneticLocus[];
  outcome: string;
}

export class RareDiseaseRegistry {
  private records: Map<string, PatientRecord> = new Map();

  public addPatient(record: PatientRecord): void {
    this.records.set(record.patientId, record);
  }

  /**
   * Identifies novel genotype-phenotype correlations by pooling global anonymized data.
   */
  public findCorrelations(hpoId: string, locus: string): number {
    const matches = Array.from(this.records.values()).filter(r => 
      r.phenotypes.some(p => p.hpoId === hpoId) && 
      r.genotypes.some(g => g.getRange() === locus)
    );
    return matches.length;
  }

  public getGlobalPrevalence(diseaseId: string): number {
    return this.records.size; // Simplified
  }
}
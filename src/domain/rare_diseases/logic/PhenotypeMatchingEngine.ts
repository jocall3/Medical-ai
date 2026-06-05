import { PhenotypeFeature } from '../entities/PhenotypeFeature';

interface DiseaseProfile {
  diseaseId: string;
  expectedPhenotypes: PhenotypeFeature[];
  prevalence: number;
}

export class PhenotypeMatchingEngine {
  private diseaseDatabase: DiseaseProfile[] = [];

  public registerDiseaseProfile(profile: DiseaseProfile): void {
    this.diseaseDatabase.push(profile);
  }

  /**
   * Compares patient symptoms against known rare disease profiles using a weighted Jaccard similarity
   * or HPO semantic similarity score.
   */
  public suggestDiagnosis(patientPhenotypes: PhenotypeFeature[]): { diseaseId: string; confidence: number }[] {
    return this.diseaseDatabase
      .map(disease => {
        const intersection = patientPhenotypes.filter(p => 
          disease.expectedPhenotypes.some(dp => dp.hpoId === p.hpoId)
        ).length;
        
        const union = new Set([
          ...patientPhenotypes.map(p => p.hpoId),
          ...disease.expectedPhenotypes.map(dp => dp.hpoId)
        ]).size;

        const similarity = intersection / union;
        return { diseaseId: disease.diseaseId, confidence: similarity };
      })
      .sort((a, b) => b.confidence - a.confidence);
  }
}
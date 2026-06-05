/**
 * @module TissueSample
 * @description Represents a physical biopsy or resection specimen in the pathology pipeline.
 * This entity tracks the origin, fixation method, and sectioning details, which are critical
 * for normalizing AI inferences (e.g., formalin fixation can alter cellular morphology).
 */

export enum FixationMethod {
  FORMALIN_10_PERCENT = 'FORMALIN_10_PERCENT',
  GLUTARALDEHYDE = 'GLUTARALDEHYDE',
  BOUINS_SOLUTION = 'BOUINS_SOLUTION',
  FRESH_FROZEN = 'FRESH_FROZEN',
  ETHANOL = 'ETHANOL'
}

export enum SpecimenType {
  CORE_NEEDLE_BIOPSY = 'CORE_NEEDLE_BIOPSY',
  EXCISIONAL_BIOPSY = 'EXCISIONAL_BIOPSY',
  INCISIONAL_BIOPSY = 'INCISIONAL_BIOPSY',
  FINE_NEEDLE_ASPIRATION = 'FINE_NEEDLE_ASPIRATION',
  SURGICAL_RESECTION = 'SURGICAL_RESECTION'
}

export class TissueSample {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly collectionDate: Date,
    public readonly anatomicalSite: string,
    public readonly specimenType: SpecimenType,
    public readonly fixationMethod: FixationMethod,
    public readonly sectionThicknessMicrons: number,
    public readonly coldIschemiaTimeMinutes: number
  ) {}

  /**
   * Evaluates if the sample's pre-analytical variables are optimal for AI analysis.
   * Prolonged cold ischemia or improper fixation can degrade RNA/DNA and alter morphology.
   */
  public isOptimalForDeepLearning(): boolean {
    if (this.coldIschemiaTimeMinutes > 60) return false;
    if (this.sectionThicknessMicrons < 3 || this.sectionThicknessMicrons > 5) return false;
    return true;
  }

  public getMetadataSummary(): Record<string, any> {
    return {
      sampleId: this.id,
      site: this.anatomicalSite,
      type: this.specimenType,
      fixation: this.fixationMethod,
      viabilityScore: this.isOptimalForDeepLearning() ? 1.0 : 0.6
    };
  }
}

/**
 * @module StainMarker
 * @description Represents Immunohistochemical (IHC) or special stains applied to tissue.
 * Crucial for molecular subtyping of tumors (e.g., ER/PR/HER2 in breast cancer) and
 * guiding targeted therapies.
 */

export enum StainType {
  H_AND_E = 'H_AND_E', // Hematoxylin and Eosin
  IHC = 'IHC', // Immunohistochemistry
  IMMUNOFLUORESCENCE = 'IMMUNOFLUORESCENCE',
  SPECIAL_STAIN = 'SPECIAL_STAIN' // e.g., PAS, Trichrome, Silver
}

export enum CellularLocalization {
  NUCLEAR = 'NUCLEAR',
  CYTOPLASMIC = 'CYTOPLASMIC',
  MEMBRANOUS = 'MEMBRANOUS',
  EXTRACELLULAR = 'EXTRACELLULAR'
}

export class StainMarker {
  constructor(
    public readonly id: string,
    public readonly markerName: string, // e.g., 'Ki-67', 'p53', 'HER2'
    public readonly stainType: StainType,
    public readonly localization: CellularLocalization,
    public readonly percentagePositive: number, // 0 to 100
    public readonly intensityScore: number // 0, 1+, 2+, 3+
  ) {}

  /**
   * Interprets the clinical significance of the stain based on standard oncology guidelines.
   * E.g., HER2 3+ is positive, 2+ is equivocal (requires FISH), 0/1+ is negative.
   */
  public getClinicalInterpretation(): string {
    if (this.markerName.toUpperCase() === 'HER2') {
      if (this.intensityScore === 3) return 'POSITIVE';
      if (this.intensityScore === 2) return 'EQUIVOCAL_REQUIRE_FISH';
      return 'NEGATIVE';
    }
    
    if (this.markerName.toUpperCase() === 'KI67') {
      return this.percentagePositive > 20 ? 'HIGH_PROLIFERATION' : 'LOW_PROLIFERATION';
    }

    // Generic thresholding for other markers
    return this.percentagePositive > 10 ? 'EXPRESSED' : 'NOT_EXPRESSED';
  }

  public toVector(): number[] {
    // Useful for feeding into multimodal AI models
    return [this.percentagePositive / 100.0, this.intensityScore / 3.0];
  }
}

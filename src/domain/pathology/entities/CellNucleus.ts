/**
 * @module CellNucleus
 * @description Models the morphological and morphometric features of a single nucleus.
 * Nuclear atypia is a hallmark of malignancy. This entity stores high-dimensional data
 * extracted via instance segmentation models (e.g., HoVer-Net or Mask R-CNN).
 */

export interface MorphometricData {
  areaSquareMicrons: number;
  perimeterMicrons: number;
  eccentricity: number; // 0 = perfect circle, 1 = line
  solidity: number; // Measure of contour convexity
}

export class CellNucleus {
  constructor(
    public readonly id: string,
    public readonly slideId: string,
    public readonly coordinates: { x: number; y: number },
    public readonly morphometrics: MorphometricData,
    public readonly hyperchromasiaIndex: number, // 0.0 to 1.0 scale of chromatin darkness
    public readonly nucleolarProminence: number, // Count or size of nucleoli
    public readonly pleomorphismScore: number // Deviation from normal baseline
  ) {}

  /**
   * Determines if the nucleus exhibits malignant characteristics based on standard
   * pathological criteria (enlargement, irregular contours, hyperchromasia).
   */
  public isAtypical(): boolean {
    const isEnlarged = this.morphometrics.areaSquareMicrons > 50; // Baseline dependent on tissue
    const isIrregular = this.morphometrics.solidity < 0.85;
    const isHyperchromatic = this.hyperchromasiaIndex > 0.7;
    
    return (isEnlarged && isIrregular) || isHyperchromatic || this.pleomorphismScore > 0.8;
  }

  /**
   * Calculates the Nuclear-to-Cytoplasmic (N:C) ratio proxy if cytoplasmic data is linked.
   * High N:C ratio is a strong indicator of dysplasia/malignancy.
   */
  public calculateNCRatio(cytoplasmArea: number): number {
    if (cytoplasmArea <= 0) throw new Error('Invalid cytoplasm area');
    return this.morphometrics.areaSquareMicrons / cytoplasmArea;
  }
}

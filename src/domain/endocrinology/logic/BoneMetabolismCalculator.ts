export interface BoneMarkers {
  osteoblastActivity: number; // Bone formation rate
  osteoclastActivity: number; // Bone resorption rate
  calciumLevel: number; // Serum Ca2+ (mg/dL)
}

export class BoneMetabolismCalculator {
  private readonly CA_TARGET = 9.5; // Target serum calcium

  /**
   * Calculates the change in bone density and serum calcium based on hormone levels.
   * @param pth Parathyroid Hormone level
   * @param vitD Vitamin D (Calcitriol) level
   * @param calcitonin Calcitonin level
   */
  public calculateMetabolicShift(pth: number, vitD: number, calcitonin: number, currentMarkers: BoneMarkers): BoneMarkers {
    // PTH increases osteoclast activity and calcium reabsorption
    const pthEffect = pth * 0.5;
    
    // Vitamin D increases calcium absorption from gut and works with PTH
    const vitDEffect = vitD * 0.3;
    
    // Calcitonin inhibits osteoclasts
    const calcitoninEffect = calcitonin * 0.4;

    const newOsteoclastActivity = currentMarkers.osteoclastActivity + pthEffect + vitDEffect - calcitoninEffect;
    const newOsteoblastActivity = currentMarkers.osteoblastActivity + (calcitoninEffect * 0.2) - (pthEffect * 0.1);
    
    // Serum calcium change: (Resorption - Formation) + Gut Absorption
    const calciumDelta = (newOsteoclastActivity - newOsteoblastActivity) * 0.1 + (vitDEffect * 0.2);
    const newCalciumLevel = currentMarkers.calciumLevel + calciumDelta;

    return {
      osteoblastActivity: Math.max(0, newOsteoblastActivity),
      osteoclastActivity: Math.max(0, newOsteoclastActivity),
      calciumLevel: newCalciumLevel
    };
  }

  public getPTHResponse(currentCalcium: number): number {
    // Inverse relationship: Low calcium -> High PTH
    return this.CA_TARGET / (currentCalcium + 0.1);
  }
}
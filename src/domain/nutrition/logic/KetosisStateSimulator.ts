export interface KetosisSimulationState {
  hoursOfFasting: number;
  hepaticGlycogenGrams: number;
  bloodGlucoseMmolL: number;
  bloodBetaHydroxybutyrateMmolL: number;
  bloodAcetoacetateMmolL: number;
  isKetoacidosisRisk: boolean;
}

export class KetosisStateSimulator {
  private static readonly MAX_HEPATIC_GLYCOGEN = 120.0;
  private static readonly GLYCOGEN_DEPLETION_RATE_PER_HOUR = 6.5;

  public static simulateFastingTransition(
    hours: number,
    initialGlycogen: number = 120.0,
    isDiabeticType1: boolean = false
  ): KetosisSimulationState[] {
    const timeline: KetosisSimulationState[] = [];
    let currentGlycogen = initialGlycogen;
    let currentGlucose = 5.5;
    let currentBHB = 0.1;
    let currentAcetoacetate = 0.05;

    for (let h = 0; h <= hours; h++) {
      if (h > 0) {
        const depletion = Math.min(currentGlycogen, this.GLYCOGEN_DEPLETION_RATE_PER_HOUR);
        currentGlycogen -= depletion;

        if (currentGlycogen > 20) {
          currentGlucose = Math.max(4.0, currentGlucose - 0.05);
          currentBHB = Math.min(0.3, currentBHB + 0.01);
        } else {
          currentGlucose = Math.max(3.3, currentGlucose - 0.1);
          const ketogenesisFactor = (this.MAX_HEPATIC_GLYCOGEN - currentGlycogen) / this.MAX_HEPATIC_GLYCOGEN;
          
          if (isDiabeticType1) {
            currentBHB += 0.4 * ketogenesisFactor;
            currentAcetoacetate += 0.15 * ketogenesisFactor;
          } else {
            currentBHB = Math.min(6.0, currentBHB + 0.15 * ketogenesisFactor);
            currentAcetoacetate = Math.min(2.0, currentAcetoacetate + 0.05 * ketogenesisFactor);
          }
        }
      }

      const totalKetones = currentBHB + currentAcetoacetate;
      const isKetoacidosisRisk = isDiabeticType1 && totalKetones > 10.0 && currentGlucose > 11.0;

      timeline.push({
        hoursOfFasting: h,
        hepaticGlycogenGrams: parseFloat(currentGlycogen.toFixed(2)),
        bloodGlucoseMmolL: parseFloat(currentGlucose.toFixed(2)),
        bloodBetaHydroxybutyrateMmolL: parseFloat(currentBHB.toFixed(2)),
        bloodAcetoacetateMmolL: parseFloat(currentAcetoacetate.toFixed(2)),
        isKetoacidosisRisk
      });
    }

    return timeline;
  }
}
import { VesselSegment } from "../entities/VesselSegment";

export interface AtheroRiskFactors {
  systolicBP: number;
  ldlMgDl: number;
  hdlMgDl: number;
  isSmoker: boolean;
  hasDiabetes: boolean;
  systemicInflammationCRP: number;
}

export class AtherosclerosisProgressionModel {
  /**
   * Simulates the accumulation of LDL cholesterol and macrophage foam cells in the arterial intima over decades.
   */
  public simulateProgression(
    initialSegment: VesselSegment,
    patientAgeYears: number,
    yearsToSimulate: number,
    riskFactors: AtheroRiskFactors
  ): VesselSegment {
    let currentPlaque = initialSegment.plaqueBuildupPercentage;
    let currentRadius = initialSegment.radiusMm;
    let currentCalcification = initialSegment.calcificationScoreAgatston;
    let currentEndothelialHealth = initialSegment.endothelialHealthIndex;

    let annualPlaqueRate = 0.2;

    if (riskFactors.ldlMgDl > 100) {
      annualPlaqueRate += Math.pow((riskFactors.ldlMgDl - 100) / 50, 1.5) * 0.4;
    }

    if (riskFactors.hdlMgDl < 40) {
      annualPlaqueRate += 0.3;
    } else if (riskFactors.hdlMgDl > 60) {
      annualPlaqueRate -= 0.15;
    }

    if (riskFactors.systolicBP > 130) {
      annualPlaqueRate += ((riskFactors.systolicBP - 130) / 10) * 0.25;
    }

    if (riskFactors.isSmoker) {
      annualPlaqueRate += 0.8;
    }
    if (riskFactors.hasDiabetes) {
      annualPlaqueRate += 1.1;
    }

    if (riskFactors.systemicInflammationCRP > 2.0) {
      annualPlaqueRate += (riskFactors.systemicInflammationCRP / 2.0) * 0.3;
    }

    annualPlaqueRate = Math.max(0.05, annualPlaqueRate);

    for (let year = 1; year <= yearsToSimulate; year++) {
      const currentAge = patientAgeYears + year;
      const ageFactor = currentAge > 50 ? (currentAge - 50) * 0.005 : 0;
      currentEndothelialHealth = Math.max(0.05, currentEndothelialHealth - (annualPlaqueRate * 0.01) - ageFactor);

      currentPlaque += annualPlaqueRate * (2.0 - currentEndothelialHealth);

      if (currentPlaque > 20 && currentAge > 40) {
        const calcificationRate = (currentPlaque - 20) * 0.1 * (riskFactors.hasDiabetes ? 1.5 : 1.0);
        currentCalcification += calcificationRate;
      }

      if (currentPlaque > 40) {
        const narrowingFactor = (currentPlaque - 40) * 0.005;
        currentRadius = Math.max(0.5, currentRadius * (1 - narrowingFactor));
      }
    }

    currentPlaque = Math.min(100.0, currentPlaque);

    return new VesselSegment(
      initialSegment.segmentId,
      initialSegment.name,
      initialSegment.lengthCm,
      parseFloat(currentRadius.toFixed(2)),
      initialSegment.elasticityYoungsModulusMPa * (1 + (currentCalcification / 1000)),
      parseFloat(currentPlaque.toFixed(2)),
      parseFloat(currentEndothelialHealth.toFixed(2)),
      Math.round(currentCalcification),
      initialSegment.shearStressDynesCm2
    );
  }
}
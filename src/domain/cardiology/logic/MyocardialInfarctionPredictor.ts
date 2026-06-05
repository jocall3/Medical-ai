import { VesselSegment } from "../entities/VesselSegment";

export interface LipidProfile {
  ldlMgDl: number;
  hdlMgDl: number;
  triglyceridesMgDl: number;
  totalCholesterolMgDl: number;
}

export interface Biomarkers {
  hsCRP: number;       // mg/L (inflammatory marker)
  troponinT: number;   // ng/mL (ischemia/necrosis marker)
  bnp: number;         // pg/mL (stretch/heart failure marker)
}

export interface StressTestResult {
  stSegmentDepressionMm: number;
  anginaInduced: boolean;
  maxHeartRateAchieved: number;
}

export interface MIPrediction {
  plaqueRuptureProbability: number; // 0.0 to 1.0
  ischemiaRiskIndex: number;        // 0.0 to 1.0
  overallMIPredictionScore: number; // 0.0 to 1.0
  clinicalRecommendation: string;
}

export class MyocardialInfarctionPredictor {
  /**
   * Calculates the probability of acute plaque rupture and subsequent myocardial ischemia.
   */
  public predictMIPrompt(
    vessels: VesselSegment[],
    lipidProfile: LipidProfile,
    biomarkers: Biomarkers,
    stressTest: StressTestResult
  ): MIPrediction {
    let maxPlaqueBuildup = 0;
    let highShearStressCount = 0;
    let lowEndothelialHealthCount = 0;

    for (const vessel of vessels) {
      if (vessel.plaqueBuildupPercentage > maxPlaqueBuildup) {
        maxPlaqueBuildup = vessel.plaqueBuildupPercentage;
      }
      if (vessel.shearStressDynesCm2 > 50.0) {
        highShearStressCount++;
      }
      if (vessel.endothelialHealthIndex < 0.4) {
        lowEndothelialHealthCount++;
      }
    }

    const ldlFactor = Math.min(1.0, lipidProfile.ldlMgDl / 200);
    const hscrpFactor = Math.min(1.0, biomarkers.hsCRP / 10.0);
    const shearFactor = Math.min(1.0, highShearStressCount / (vessels.length || 1));
    const endothelialFactor = 1.0 - (vessels.reduce((sum, v) => sum + v.endothelialHealthIndex, 0) / (vessels.length || 1));

    const plaqueRuptureProbability = Math.min(0.99, (
      (maxPlaqueBuildup / 100) * 0.3 +
      ldlFactor * 0.2 +
      hscrpFactor * 0.25 +
      shearFactor * 0.15 +
      endothelialFactor * 0.1
    ));

    const stDepressionFactor = Math.min(1.0, stressTest.stSegmentDepressionMm / 4.0);
    const anginaFactor = stressTest.anginaInduced ? 0.4 : 0.0;
    const troponinFactor = Math.min(1.0, biomarkers.troponinT / 0.1);

    const ischemiaRiskIndex = Math.min(0.99, (
      stDepressionFactor * 0.4 +
      anginaFactor * 0.3 +
      troponinFactor * 0.3
    ));

    const overallMIPredictionScore = Math.min(0.99, (plaqueRuptureProbability * 0.5 + ischemiaRiskIndex * 0.5));

    let clinicalRecommendation = "Low risk. Continue routine cardiovascular screening.";
    if (overallMIPredictionScore >= 0.75) {
      clinicalRecommendation = "CRITICAL RISK: High probability of imminent plaque rupture or active ischemia. Immediate coronary angiography and potential percutaneous coronary intervention (PCI) indicated.";
    } else if (overallMIPredictionScore >= 0.45) {
      clinicalRecommendation = "MODERATE-HIGH RISK: Significant plaque burden and inflammatory activity. Recommend aggressive lipid-lowering therapy (statins/PCSK9 inhibitors), beta-blockers, and a nuclear stress test.";
    } else if (overallMIPredictionScore >= 0.25) {
      clinicalRecommendation = "MODERATE RISK: Early signs of atherosclerosis and endothelial dysfunction. Optimize lifestyle, diet, and initiate low-dose statin therapy.";
    }

    return {
      plaqueRuptureProbability,
      ischemiaRiskIndex,
      overallMIPredictionScore,
      clinicalRecommendation
    };
  }
}
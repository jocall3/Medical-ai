export interface EnteralFormula {
  id: string;
  name: string;
  type: 'POLYMERIC' | 'ELEMENTAL' | 'SEMI_ELEMENTAL' | 'RENAL' | 'HEPATIC';
  kcalPerMl: number;
  proteinGramsPerMl: number;
  carbsGramsPerMl: number;
  fatGramsPerMl: number;
  potassiumMeqPerLiter: number;
  phosphorusMgPerLiter: number;
  magnesiumMeqPerLiter: number;
}

export interface RefeedRiskAssessment {
  isHighRisk: boolean;
  riskFactors: string[];
  recommendedStartingRateMlPerHour: number;
  titrationStepMlPerHour: number;
  titrationIntervalHours: number;
}

export interface FeedingSchedule {
  formulaId: string;
  targetRateMlPerHour: number;
  startingRateMlPerHour: number;
  titrationSteps: { hour: number; rateMlPerHour: number }[];
  totalVolumeMl24h: number;
  totalKcal24h: number;
  totalProteinGrams24h: number;
  electrolyteMonitoringRequired: string[];
}

export class EnteralFeedingEngine {
  public static assessRefeedingRisk(criteria: {
    bmi: number;
    unintentionalWeightLossPercent6Months: number;
    starvationDays: number;
    historyOfAlcoholAbuseOrChemo: boolean;
  }): RefeedRiskAssessment {
    const riskFactors: string[] = [];
    let isHighRisk = false;

    if (criteria.bmi < 16) {
      riskFactors.push("BMI < 16 kg/m2");
      isHighRisk = true;
    }
    if (criteria.unintentionalWeightLossPercent6Months > 15) {
      riskFactors.push("Unintentional weight loss > 15% in 6 months");
      isHighRisk = true;
    }
    if (criteria.starvationDays > 10) {
      riskFactors.push("Little or no nutritional intake for > 10 days");
      isHighRisk = true;
    }
    if (criteria.historyOfAlcoholAbuseOrChemo) {
      riskFactors.push("History of chronic alcohol abuse or chemotherapy");
      isHighRisk = true;
    }

    let moderateCount = 0;
    if (criteria.bmi >= 16 && criteria.bmi < 18.5) moderateCount++;
    if (criteria.unintentionalWeightLossPercent6Months >= 10 && criteria.unintentionalWeightLossPercent6Months <= 15) moderateCount++;
    if (criteria.starvationDays >= 5 && criteria.starvationDays <= 10) moderateCount++;

    if (moderateCount >= 2) {
      riskFactors.push("Multiple moderate risk factors (BMI 16-18.5, weight loss 10-15%, or 5-10 days starvation)");
      isHighRisk = true;
    }

    return {
      isHighRisk,
      riskFactors,
      recommendedStartingRateMlPerHour: isHighRisk ? 10 : 20,
      titrationStepMlPerHour: isHighRisk ? 5 : 10,
      titrationIntervalHours: isHighRisk ? 24 : 12
    };
  }

  public static generateFeedingSchedule(
    formula: EnteralFormula,
    targetKcalPerDay: number,
    refeedRisk: RefeedRiskAssessment
  ): FeedingSchedule {
    const targetVolumeMl = targetKcalPerDay / formula.kcalPerMl;
    const targetRateMlPerHour = Math.round(targetVolumeMl / 24);

    const startingRate = refeedRisk.recommendedStartingRateMlPerHour;
    const step = refeedRisk.titrationStepMlPerHour;
    const interval = refeedRisk.titrationIntervalHours;

    const titrationSteps: { hour: number; rateMlPerHour: number }[] = [];
    let currentRate = startingRate;
    let currentHour = 0;

    while (currentRate < targetRateMlPerHour) {
      titrationSteps.push({ hour: currentHour, rateMlPerHour: currentRate });
      currentRate += step;
      currentHour += interval;
    }
    titrationSteps.push({ hour: currentHour, rateMlPerHour: targetRateMlPerHour });

    const totalVolumeMl24h = targetRateMlPerHour * 24;
    const totalKcal24h = totalVolumeMl24h * formula.kcalPerMl;
    const totalProteinGrams24h = totalVolumeMl24h * formula.proteinGramsPerMl;

    const electrolyteMonitoringRequired = refeedRisk.isHighRisk 
      ? ["Potassium (K)", "Phosphorus (P)", "Magnesium (Mg)", "Thiamine supplementation mandatory before feeding"]
      : ["Routine daily electrolytes"];

    return {
      formulaId: formula.id,
      targetRateMlPerHour,
      startingRateMlPerHour: startingRate,
      titrationSteps,
      totalVolumeMl24h,
      totalKcal24h,
      totalProteinGrams24h,
      electrolyteMonitoringRequired
    };
  }
}
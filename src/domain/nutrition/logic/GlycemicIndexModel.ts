export interface FoodItem {
  name: string;
  glycemicIndex: number;
  carbohydratesGrams: number;
}

export interface PatientInsulinProfile {
  insulinSensitivityFactor: number;
  insulinToCarbRatio: number;
  baselineGlucoseMgDl: number;
}

export interface GlycemicCurvePoint {
  minutesPostprandial: number;
  bloodGlucoseMgDl: number;
  insulinActiveUnits: number;
}

export class GlycemicIndexModel {
  public static calculateGlycemicLoad(food: FoodItem): number {
    return (food.glycemicIndex * food.carbohydratesGrams) / 100;
  }

  public static simulatePostprandialGlucose(
    meal: FoodItem[],
    profile: PatientInsulinProfile,
    bolusInsulinUnits: number = 0
  ): GlycemicCurvePoint[] {
    const totalGlycemicLoad = meal.reduce((sum, food) => sum + this.calculateGlycemicLoad(food), 0);
    const curve: GlycemicCurvePoint[] = [];
    let currentGlucose = profile.baselineGlucoseMgDl;

    const timeStepMinutes = 10;
    const totalDurationMinutes = 240;

    for (let t = 0; t <= totalDurationMinutes; t += timeStepMinutes) {
      const averageGi = meal.length > 0 
        ? meal.reduce((sum, f) => sum + f.glycemicIndex, 0) / meal.length 
        : 50;
      
      const peakTime = 30 + (100 - averageGi) * 0.3;
      const absorptionFactor = Math.exp(-Math.pow((t - peakTime) / 40, 2));
      const glucoseInflow = totalGlycemicLoad * 1.8 * absorptionFactor;

      const insulinActionFactor = Math.max(0, (t / 60) * Math.exp(1 - t / 60));
      const glucoseOutflow = bolusInsulinUnits * (profile.insulinSensitivityFactor / 12) * insulinActionFactor;

      const endogenousInsulinResponse = bolusInsulinUnits === 0 
        ? (currentGlucose > 100 ? (currentGlucose - 100) * 0.05 : 0)
        : 0;
      
      const totalClearance = glucoseOutflow + (endogenousInsulinResponse * 2.5);

      currentGlucose = currentGlucose + glucoseInflow - totalClearance;
      currentGlucose = Math.max(40, currentGlucose);

      const activeInsulinRemaining = bolusInsulinUnits * Math.exp(-t / 180);

      curve.push({
        minutesPostprandial: t,
        bloodGlucoseMgDl: parseFloat(currentGlucose.toFixed(1)),
        insulinActiveUnits: parseFloat(activeInsulinRemaining.toFixed(2))
      });
    }

    return curve;
  }
}
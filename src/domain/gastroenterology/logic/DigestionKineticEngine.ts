export interface MealComposition {
  carbohydratesGrams: number;
  proteinsGrams: number;
  lipidsGrams: number;
  waterVolumeMl: number;
}

export interface DigestionState {
  remainingGastricVolumeMl: number;
  emptiedCarbsGrams: number;
  emptiedProteinsGrams: number;
  emptiedLipidsGrams: number;
  gastricEmptyingFraction: number;
}

export class DigestionKineticEngine {
  /**
   * Simulates gastric emptying using Elashoff's power exponential model:
   * f(t) = exp(-(t / t_half)^beta)
   * Lipids delay gastric emptying significantly via cholecystokinin (CCK) feedback.
   */
  public static simulateGastricEmptying(
    meal: MealComposition,
    timeMinutes: number
  ): DigestionState {
    const totalSolidMass = meal.carbohydratesGrams + meal.proteinsGrams + meal.lipidsGrams;
    const totalVolume = meal.waterVolumeMl + (totalSolidMass * 0.8);

    if (totalVolume <= 0) {
      return { remainingGastricVolumeMl: 0, emptiedCarbsGrams: 0, emptiedProteinsGrams: 0, emptiedLipidsGrams: 0, gastricEmptyingFraction: 1.0 };
    }

    const baseThalfMinutes = 30.0;
    const lipidDelay = meal.lipidsGrams * 2.5;
    const proteinDelay = meal.proteinsGrams * 1.2;
    const carbDelay = meal.carbohydratesGrams * 0.5;
    
    const tHalf = baseThalfMinutes + lipidDelay + proteinDelay + carbDelay;
    const beta = totalSolidMass > 50 ? 1.4 : 1.0;

    const fractionRemaining = Math.exp(-Math.pow(timeMinutes / tHalf, beta));
    const fractionEmptied = 1 - fractionRemaining;

    return {
      remainingGastricVolumeMl: totalVolume * fractionRemaining,
      emptiedCarbsGrams: meal.carbohydratesGrams * fractionEmptied,
      emptiedProteinsGrams: meal.proteinsGrams * fractionEmptied,
      emptiedLipidsGrams: meal.lipidsGrams * fractionEmptied,
      gastricEmptyingFraction: fractionEmptied
    };
  }

  /**
   * Calculates the intestinal transit time (ITT) in hours.
   * Influenced by dietary fiber, hydration, and physical activity.
   * Normal transit time ranges from 20 to 72 hours.
   */
  public static calculateIntestinalTransitTime(
    fiberContentGrams: number,
    hydrationLiters: number,
    physicalActivityLevel: 'Sedentary' | 'Moderate' | 'Active'
  ): number {
    const baseTransitTimeHours = 48.0;
    const fiberEffect = Math.min(20, fiberContentGrams * 0.6); 
    
    let hydrationEffect = 0;
    if (hydrationLiters < 1.5) {
      hydrationEffect = (1.5 - hydrationLiters) * 12.0;
    } else {
      hydrationEffect = -Math.min(6.0, (hydrationLiters - 1.5) * 2.0);
    }

    let activityEffect = 0;
    if (physicalActivityLevel === 'Active') {
      activityEffect = -8.0;
    } else if (physicalActivityLevel === 'Sedentary') {
      activityEffect = 10.0;
    }

    const calculatedTransitTime = baseTransitTimeHours - fiberEffect + hydrationEffect + activityEffect;
    return Math.max(12.0, Math.min(120.0, calculatedTransitTime));
  }
}
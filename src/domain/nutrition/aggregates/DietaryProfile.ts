export interface Allergy {
  allergen: string;
  severity: 'MILD' | 'MODERATE' | 'ANAPHYLACTIC';
  symptoms: string[];
}

export interface Intolerance {
  substance: string;
  severity: 'MILD' | 'SEVERE';
}

export interface NutritionalGoal {
  type: 'WEIGHT_LOSS' | 'HYPERTROPHY' | 'GLYCEMIC_CONTROL' | 'RENAL_PROTECTION' | 'CARDIOVASCULAR_HEALTH';
  targetDailyKcal: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
}

export class DietaryProfile {
  private allergies: Map<string, Allergy> = new Map();
  private intolerances: Map<string, Intolerance> = new Map();
  private preferredMacronutrientRatio: { carbs: number; protein: number; fat: number } = { carbs: 50, protein: 20, fat: 30 };

  constructor(
    public readonly patientId: string,
    public goals: NutritionalGoal[],
    public dietaryHabits: string[]
  ) {}

  public addAllergy(allergy: Allergy): void {
    this.allergies.set(allergy.allergen.toLowerCase(), allergy);
  }

  public removeAllergy(allergen: string): void {
    this.allergies.delete(allergen.toLowerCase());
  }

  public addIntolerance(intolerance: Intolerance): void {
    this.intolerances.set(intolerance.substance.toLowerCase(), intolerance);
  }

  public checkFoodSafety(ingredients: string[]): {
    isSafe: boolean;
    contraindications: string[];
  } {
    const contraindications: string[] = [];
    let isSafe = true;

    for (const ingredient of ingredients) {
      const normalized = ingredient.toLowerCase();
      
      const allergy = this.allergies.get(normalized);
      if (allergy) {
        isSafe = false;
        contraindications.push(`ALLERGY WARNING: ${allergy.allergen} causes ${allergy.severity} reaction (${allergy.symptoms.join(', ')}).`);
      }

      const intolerance = this.intolerances.get(normalized);
      if (intolerance) {
        isSafe = false;
        contraindications.push(`INTOLERANCE WARNING: ${intolerance.substance} causes ${intolerance.severity} discomfort.`);
      }
    }

    return { isSafe, contraindications };
  }

  public setMacronutrientRatio(carbs: number, protein: number, fat: number): void {
    if (carbs + protein + fat !== 100) {
      throw new Error("Macronutrient percentages must sum to exactly 100%.");
    }
    this.preferredMacronutrientRatio = { carbs, protein, fat };
  }

  public getMacronutrientRatio(): { carbs: number; protein: number; fat: number } {
    return { ...this.preferredMacronutrientRatio };
  }

  public getAllAllergies(): Allergy[] {
    return Array.from(this.allergies.values());
  }

  public getAllIntolerances(): Intolerance[] {
    return Array.from(this.intolerances.values());
  }
}
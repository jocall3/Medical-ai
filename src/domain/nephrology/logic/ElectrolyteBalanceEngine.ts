/**
 * ElectrolyteBalanceEngine
 * Simulates the renal regulation of Sodium, Potassium, Calcium, and Phosphate.
 * Predicts clinical risks (e.g., cardiac arrhythmias, neuromuscular excitability)
 * based on severe electrolyte imbalances.
 */
export interface ElectrolyteProfile {
  sodium: number;      // mEq/L (Normal: 135-145)
  potassium: number;   // mEq/L (Normal: 3.5-5.0)
  calcium: number;     // mg/dL (Normal: 8.5-10.5 total)
  phosphate: number;   // mg/dL (Normal: 2.5-4.5)
}

export interface HormonalRegulators {
  aldosterone: number; // pg/mL (Normal: 30-150)
  parathyroidHormone: number; // pg/mL (Normal: 10-65)
  antidiureticHormone: number; // pg/mL (Normal: 1-5)
}

export interface ClinicalRiskAssessment {
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  arrhythmiaRisk: string;
  neuromuscularRisk: string;
  clinicalRecommendations: string[];
}

export class ElectrolyteBalanceEngine {
  /**
   * Simulates the renal response to electrolyte loads under hormonal influence
   */
  public static simulateRenalResponse(
    current: ElectrolyteProfile,
    hormones: HormonalRegulators,
    gfr: number
  ): ElectrolyteProfile {
    const aldoFactor = hormones.aldosterone / 100;
    const pthFactor = hormones.parathyroidHormone / 40;
    const adhFactor = hormones.antidiureticHormone / 3;
    const gfrFactor = Math.max(0.1, gfr / 120);

    let nextSodium = current.sodium;
    let nextPotassium = current.potassium;
    let nextCalcium = current.calcium;
    let nextPhosphate = current.phosphate;

    const sodiumExcretion = 1.5 * gfrFactor * (1 / Math.max(0.5, aldoFactor));
    const waterRetention = 1.2 * adhFactor;
    nextSodium = current.sodium - (sodiumExcretion - waterRetention) * 0.1;

    const potassiumExcretion = 2.0 * gfrFactor * aldoFactor;
    nextPotassium = current.potassium - (potassiumExcretion - 1.5) * 0.1;

    const calciumExcretion = 1.0 * gfrFactor * (1 / Math.max(0.5, pthFactor));
    nextCalcium = current.calcium - (calciumExcretion - 0.8) * 0.1;

    const phosphateExcretion = 1.5 * gfrFactor * pthFactor;
    nextPhosphate = current.phosphate - (phosphateExcretion - 1.2) * 0.1;

    return {
      sodium: Math.round(nextSodium * 10) / 10,
      potassium: Math.round(nextPotassium * 10) / 10,
      calcium: Math.round(nextCalcium * 10) / 10,
      phosphate: Math.round(nextPhosphate * 10) / 10,
    };
  }

  /**
   * Analyzes electrolyte levels to predict life-threatening clinical risks
   */
  public static assessClinicalRisks(profile: ElectrolyteProfile): ClinicalRiskAssessment {
    const recommendations: string[] = [];
    let maxSeverity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical' = 'Normal';
    let arrhythmiaRisk = 'Negligible';
    let neuromuscularRisk = 'Normal tone';

    if (profile.potassium > 6.5) {
      maxSeverity = 'Critical';
      arrhythmiaRisk = 'Extremely High: Risk of Peaked T-waves, PR prolongation, Sine Wave, Ventricular Fibrillation, or Asystole.';
      recommendations.push('EMERGENCY: Administer Calcium Gluconate 10% IV immediately for cardiac membrane stabilization.');
      recommendations.push('Shift potassium intracellularly: Insulin (10 units IV) with Dextrose 50%, or Albuterol nebulizers.');
      recommendations.push('Initiate urgent hemodialysis or potassium binders (e.g., Lokelma, Veltassa).');
    } else if (profile.potassium > 5.5) {
      maxSeverity = 'Severe';
      arrhythmiaRisk = 'High: Risk of ECG changes (peaked T-waves).';
      recommendations.push('Discontinue potassium-sparing diuretics, ACE inhibitors, and ARBs.');
      recommendations.push('Consider loop diuretics (Furosemide) and oral potassium binders.');
    } else if (profile.potassium < 3.0) {
      maxSeverity = 'Severe';
      arrhythmiaRisk = 'High: Risk of QTc prolongation, U-waves, T-wave flattening, and Torsades de Pointes.';
      recommendations.push('Administer oral or intravenous Potassium Chloride replacement.');
      recommendations.push('Check and replete Magnesium levels, as hypomagnesemia makes hypokalemia refractory.');
    } else if (profile.potassium < 3.5) {
      maxSeverity = 'Mild';
      arrhythmiaRisk = 'Moderate: Increased risk of atrial fibrillation.';
      recommendations.push('Encourage potassium-rich diet or initiate low-dose oral potassium supplementation.');
    }

    if (profile.sodium > 160) {
      maxSeverity = maxSeverity === 'Critical' ? 'Critical' : 'Severe';
      neuromuscularRisk = 'Severe: Risk of brain shrinkage, intracranial hemorrhage, seizures, and coma.';
      recommendations.push('Calculate free water deficit and replete slowly with hypotonic fluids (D5W or 0.45% Saline).');
      recommendations.push('Limit sodium correction rate to < 10-12 mEq/L per 24 hours to prevent cerebral edema.');
    } else if (profile.sodium < 120) {
      maxSeverity = 'Critical';
      neuromuscularRisk = 'Critical: Risk of cerebral edema, brain herniation, seizures, and status epilepticus.';
      recommendations.push('For symptomatic severe hyponatremia, administer 3% Hypertonic Saline bolus (100mL over 10-20 min).');
      recommendations.push('STRICT WARNING: Do not correct sodium faster than 8 mEq/L in 24 hours to avoid Osmotic Demyelination Syndrome (ODS).');
    } else if (profile.sodium < 130) {
      maxSeverity = maxSeverity === 'Normal' || maxSeverity === 'Mild' ? 'Moderate' : maxSeverity;
      neuromuscularRisk = 'Moderate: Lethargy, confusion, muscle cramps.';
      recommendations.push('Evaluate volume status (hypovolemic, euvolemic, hypervolemic) to guide therapy.');
    }

    if (profile.calcium > 12.0) {
      maxSeverity = maxSeverity === 'Critical' ? 'Critical' : 'Severe';
      arrhythmiaRisk = arrhythmiaRisk === 'Negligible' ? 'Moderate: Shortened QT interval.' : arrhythmiaRisk;
      neuromuscularRisk = 'Moderate: Lethargy, weakness, abdominal pain, and cognitive dysfunction.';
      recommendations.push('Aggressive volume expansion with 0.9% Normal Saline to promote calciuresis.');
      recommendations.push('Consider IV Bisphosphonates (Zoledronic acid) or Calcitonin.');
    } else if (profile.calcium < 7.0) {
      maxSeverity = maxSeverity === 'Critical' ? 'Critical' : 'Severe';
      arrhythmiaRisk = arrhythmiaRisk === 'Negligible' ? 'Moderate: Prolonged QT interval.' : arrhythmiaRisk;
      neuromuscularRisk = 'Severe: Neuromuscular hyperexcitability, positive Chvostek and Trousseau signs, tetany, laryngospasm.';
      recommendations.push('Administer IV Calcium Gluconate or Calcium Chloride.');
    }

    if (profile.phosphate > 6.0) {
      recommendations.push('Initiate dietary phosphate restriction and oral phosphate binders (e.g., Sevelamer, Calcium Acetate) with meals.');
    } else if (profile.phosphate < 1.5) {
      recommendations.push('Severe hypophosphatemia: Risk of diaphragmatic weakness, respiratory failure, and hemolysis. Replete with IV or oral phosphate.');
    }

    return { 
      severity: maxSeverity,
      arrhythmiaRisk,
      neuromuscularRisk,
      clinicalRecommendations: recommendations.length > 0 ? recommendations : ['Electrolytes are within acceptable physiological ranges.']
    };
  }
}
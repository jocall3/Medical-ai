/**
 * UrineOsmolalityModel
 * Simulates the concentrating and diluting ability of the kidney under the influence of
 * Antidiuretic Hormone (ADH / Vasopressin) and the medullary osmotic gradient.
 * Helps diagnose Diabetes Insipidus (Central vs. Nephrogenic) and SIADH.
 */
export interface OsmolalityInput {
  serumOsmolality: number;      // mOsm/kg (Normal: 275-295)
  urineOsmolality: number;      // mOsm/kg (Normal: 50-1200)
  adhLevel: number;             // pg/mL (Normal: 1-5)
  waterIntakeLitersPerDay: number;
}

export interface OsmolalityDiagnosis {
  concentratingAbility: 'Normal' | 'Impaired' | 'Maximally Diluted' | 'Maximally Concentrated';
  differentialDiagnosis: string;
  pathophysiology: string;
  suggestedClinicalTest: string;
}

export class UrineOsmolalityModel {
  /**
   * Simulates the expected urine osmolality based on serum osmolality and ADH levels
   */
  public static simulateUrineOsmolality(serumOsm: number, adh: number, nephronSensitivity = 1.0): number {
    const baselineDilute = 50;
    const maxConcentration = 1200 * nephronSensitivity;

    const adhEffect = 1 / (1 + Math.exp(-(adh - 2.5)));
    const expectedUrineOsm = baselineDilute + (maxConcentration - baselineDilute) * adhEffect;

    return Math.round(expectedUrineOsm);
  }

  /**
   * Diagnoses water balance disorders based on serum and urine osmolality
   */
  public static diagnoseWaterImbalance(input: OsmolalityInput): OsmolalityDiagnosis {
    let concentratingAbility: 'Normal' | 'Impaired' | 'Maximally Diluted' | 'Maximally Concentrated' = 'Normal';
    let differentialDiagnosis = 'Euvolemic water balance';
    let pathophysiology = 'The kidneys are appropriately concentrating or diluting urine in response to serum osmolality.';
    let suggestedClinicalTest = 'No immediate dynamic testing required.';

    const isSerumHyperosmolar = input.serumOsmolality > 295;
    const isSerumHyposmolar = input.serumOsmolality < 275;
    const isUrineConcentrated = input.urineOsmolality > 600;
    const isUrineDilute = input.urineOsmolality < 150;

    if (isSerumHyperosmolar) {
      if (isUrineDilute) {
        concentratingAbility = 'Impaired';
        if (input.adhLevel < 1.0) {
          differentialDiagnosis = 'Central Diabetes Insipidus (CDI)';
          pathophysiology = 'Inadequate hypothalamic synthesis or pituitary release of ADH despite high serum osmolality, leading to profound water diuresis.';
          suggestedClinicalTest = 'Desmopressin (dDAVP) Stimulation Test. If urine osmolality increases by >50%, it confirms Central DI.';
        } else {
          differentialDiagnosis = 'Nephrogenic Diabetes Insipidus (NDI)';
          pathophysiology = 'Renal resistance to ADH at the collecting duct level (often due to V2 receptor mutations, lithium toxicity, or hypercalcemia).';
          suggestedClinicalTest = 'Desmopressin (dDAVP) Stimulation Test. If urine osmolality fails to rise (<10% increase), it confirms Nephrogenic DI.';
        }
      } else if (isUrineConcentrated) {
        concentratingAbility = 'Maximally Concentrated';
        differentialDiagnosis = 'Dehydration / Primary Polydipsia recovery';
        pathophysiology = 'Appropriate physiological response. High serum osmolality has triggered maximal ADH release to conserve water.';
        suggestedClinicalTest = 'Oral rehydration or IV hypotonic fluids.';
      }
    } else if (isSerumHyposmolar) {
      if (isUrineConcentrated) {
        concentratingAbility = 'Impaired';
        differentialDiagnosis = 'Syndrome of Inappropriate Antidiuretic Hormone (SIADH)';
        pathophysiology = 'Non-physiological, autonomous release of ADH despite serum hyposmolality, causing water retention and dilutional hyponatremia.';
        suggestedClinicalTest = 'Volume status assessment (SIADH is strictly euvolemic). Check thyroid function and cortisol levels to rule out secondary causes.';
      } else if (isUrineDilute) {
        concentratingAbility = 'Maximally Diluted';
        differentialDiagnosis = 'Primary Polydipsia (Psychogenic Polydipsia)';
        pathophysiology = 'Excessive water intake overwhelms the renal diluting capacity. ADH is appropriately suppressed.';
        suggestedClinicalTest = 'Water restriction test under close supervision to monitor rise in urine osmolality.';
      }
    }

    return {
      concentratingAbility,
      differentialDiagnosis,
      pathophysiology,
      suggestedClinicalTest,
    };
  }
}
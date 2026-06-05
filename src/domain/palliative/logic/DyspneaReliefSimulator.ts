/**
 * Optimizes the use of low-dose opioids, oxygen, and anxiolytics to relieve
 * the sensation of breathlessness (dyspnea) without causing respiratory arrest.
 * Dyspnea is one of the most frightening symptoms at the end of life.
 */

export interface PatientRespiratoryState {
  respiratoryRate: number;
  oxygenSaturation: number;
  dyspneaScore: number; // 0-10
  opioidNaive: boolean;
  renalFunctionCrCl: number;
}

export interface DyspneaIntervention {
  medication: 'MORPHINE' | 'HYDROMORPHONE' | 'FENTANYL' | 'LORAZEPAM' | 'OXYGEN';
  dose: number;
  route: 'PO' | 'IV' | 'SUBCUT' | 'NASAL_CANNULA';
}

export class DyspneaReliefSimulator {
  /**
   * Recommends an initial intervention for refractory dyspnea.
   * Uses evidence-based palliative guidelines (e.g., low dose systemic opioids are first-line).
   */
  public static recommendInitialIntervention(state: PatientRespiratoryState): DyspneaIntervention {
    if (state.oxygenSaturation < 88) {
      return { medication: 'OXYGEN', dose: 2, route: 'NASAL_CANNULA' };
    }

    // If renal function is poor, avoid Morphine due to active metabolites (M3G, M6G)
    if (state.renalFunctionCrCl < 30) {
      return {
        medication: 'HYDROMORPHONE',
        dose: state.opioidNaive ? 0.2 : 0.5,
        route: 'IV'
      };
    }

    return {
      medication: 'MORPHINE',
      dose: state.opioidNaive ? 2.0 : 5.0,
      route: 'PO' // Oral liquid morphine is standard first-line for dyspnea
    };
  }

  /**
   * Simulates the effect of an intervention on the patient's respiratory state.
   * Ensures we balance symptom relief against the risk of fatal respiratory depression.
   */
  public static simulateEffect(state: PatientRespiratoryState, intervention: DyspneaIntervention): PatientRespiratoryState {
    const newState = { ...state };

    if (intervention.medication === 'OXYGEN') {
      newState.oxygenSaturation = Math.min(100, state.oxygenSaturation + (intervention.dose * 3));
      newState.dyspneaScore = Math.max(0, state.dyspneaScore - 1); // Oxygen alone often has minimal effect on the *sensation* of dyspnea if not hypoxic
    }

    if (['MORPHINE', 'HYDROMORPHONE', 'FENTANYL'].includes(intervention.medication)) {
      // Opioids reduce the central respiratory drive and the sensation of breathlessness
      const reliefFactor = intervention.route === 'IV' ? 3 : 2;
      newState.dyspneaScore = Math.max(0, state.dyspneaScore - reliefFactor);
      newState.respiratoryRate = Math.max(8, state.respiratoryRate - 4); // Risk of respiratory depression
    }

    if (intervention.medication === 'LORAZEPAM') {
      // Anxiolytics help with the panic component of dyspnea
      newState.dyspneaScore = Math.max(0, state.dyspneaScore - 1.5);
      newState.respiratoryRate = Math.max(10, state.respiratoryRate - 2);
    }

    return newState;
  }
}

/**
 * Analyzes family dynamics and the nature of the patient's death to predict
 * the risk of complicated grief (Prolonged Grief Disorder) in survivors.
 * Palliative care extends beyond the patient's death to support the bereaved.
 */

export interface DeathCircumstances {
  wasSudden: boolean;
  patientAge: number;
  symptomControlAtEnd: 'EXCELLENT' | 'FAIR' | 'POOR';
  locationOfDeath: 'HOME' | 'HOSPICE_UNIT' | 'ICU' | 'ER';
}

export interface SurvivorProfile {
  relationshipToDeceased: 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
  historyOfDepression: boolean;
  perceivedSocialSupport: 'HIGH' | 'MODERATE' | 'LOW';
  caregiverBurnoutLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
}

export class BereavementSupportModel {
  /**
   * Assesses the risk of complicated grief on a scale of 0 to 100.
   */
  public static assessGriefRisk(circumstances: DeathCircumstances, survivor: SurvivorProfile): number {
    let risk = 0;

    // Circumstantial factors
    if (circumstances.wasSudden) risk += 20;
    if (circumstances.patientAge < 18) risk += 30; // Death of a child is a massive risk factor
    if (circumstances.symptomControlAtEnd === 'POOR') risk += 15; // Traumatic memories of suffering
    if (circumstances.locationOfDeath === 'ICU' || circumstances.locationOfDeath === 'ER') risk += 10;

    // Survivor factors
    if (survivor.relationshipToDeceased === 'SPOUSE') risk += 10;
    if (survivor.relationshipToDeceased === 'PARENT' && circumstances.patientAge < 18) risk += 20;
    if (survivor.historyOfDepression) risk += 15;
    if (survivor.perceivedSocialSupport === 'LOW') risk += 20;
    if (survivor.caregiverBurnoutLevel === 'SEVERE') risk += 15;

    return Math.min(100, risk);
  }

  /**
   * Recommends a bereavement follow-up plan based on risk stratification.
   */
  public static recommendFollowUpPlan(riskScore: number): string {
    if (riskScore >= 70) {
      return 'HIGH RISK: Immediate referral to specialized grief counseling. Weekly check-ins for first 2 months. Psychiatric evaluation recommended.';
    }
    if (riskScore >= 40) {
      return 'MODERATE RISK: Monthly phone calls from bereavement coordinator. Provide support group information. Monitor for clinical depression.';
    }
    return 'STANDARD RISK: Standard bereavement mailings at 1, 3, 6, and 12 months. Open invitation to community memorial services.';
  }
}

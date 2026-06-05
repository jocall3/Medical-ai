/**
 * Aggregate root managing the transition from curative to comfort-focused care.
 * Coordinates nursing, social work, chaplaincy, and medical interventions.
 */

import { AdvanceDirective } from '../entities/AdvanceDirective';
import { Caregiver } from '../entities/Caregiver';
import { SymptomCluster } from '../entities/SymptomCluster';

export enum CareLevel {
  ROUTINE_HOME_CARE = 'ROUTINE_HOME_CARE',
  CONTINUOUS_HOME_CARE = 'CONTINUOUS_HOME_CARE',
  INPATIENT_RESPITE = 'INPATIENT_RESPITE',
  GENERAL_INPATIENT = 'GENERAL_INPATIENT'
}

export class HospiceCarePlan {
  private constructor(
    public readonly planId: string,
    public readonly patientId: string,
    public careLevel: CareLevel,
    public advanceDirective: AdvanceDirective,
    public primaryCaregiver: Caregiver | null,
    private activeSymptomClusters: SymptomCluster[],
    public interdisciplinaryTeam: string[] // IDs of nurse, social worker, chaplain, MD
  ) {}

  public static create(
    planId: string,
    patientId: string,
    directive: AdvanceDirective,
    team: string[]
  ): HospiceCarePlan {
    return new HospiceCarePlan(planId, patientId, CareLevel.ROUTINE_HOME_CARE, directive, null, [], team);
  }

  public assignCaregiver(caregiver: Caregiver): void {
    this.primaryCaregiver = caregiver;
  }

  public recordSymptomCluster(cluster: SymptomCluster): void {
    this.activeSymptomClusters.push(cluster);
    this.evaluateCareLevel();
  }

  /**
   * Automatically escalates care level based on symptom distress and caregiver burnout.
   */
  private evaluateCareLevel(): void {
    const maxDistress = Math.max(...this.activeSymptomClusters.map(c => c.calculateClusterDistressScore()));
    
    // If symptoms are refractory and severe, escalate to General Inpatient (GIP)
    if (maxDistress > 40) {
      this.careLevel = CareLevel.GENERAL_INPATIENT;
      return;
    }

    // If caregiver is severely burned out, recommend Respite
    if (this.primaryCaregiver && this.primaryCaregiver.getCurrentStressLevel() === 'SEVERE_BURNOUT') {
      this.careLevel = CareLevel.INPATIENT_RESPITE;
      return;
    }

    // If symptoms require >8 hours of nursing care per day, Continuous Care
    if (maxDistress > 25) {
      this.careLevel = CareLevel.CONTINUOUS_HOME_CARE;
      return;
    }

    this.careLevel = CareLevel.ROUTINE_HOME_CARE;
  }

  public getActivePlanSummary(): object {
    return {
      planId: this.planId,
      careLevel: this.careLevel,
      codeStatus: this.advanceDirective.codeStatus,
      caregiverStatus: this.primaryCaregiver ? this.primaryCaregiver.getCurrentStressLevel() : 'NO_CAREGIVER',
      symptomBurden: this.activeSymptomClusters.length
    };
  }
}

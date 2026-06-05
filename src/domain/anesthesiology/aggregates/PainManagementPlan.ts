/**
 * Aggregate Root managing multimodal analgesia strategies.
 * Combines opioids, NSAIDs, and regional nerve blocks to optimize comfort and minimize addiction risk.
 */
export enum AnalgesicClass {
  OPIOID = 'OPIOID',
  NSAID = 'NSAID',
  ACETAMINOPHEN = 'ACETAMINOPHEN',
  GABAPENTINOID = 'GABAPENTINOID',
  NMDA_ANTAGONIST = 'NMDA_ANTAGONIST',
  LOCAL_ANESTHETIC = 'LOCAL_ANESTHETIC'
}

export interface AnalgesicPrescription {
  medicationName: string;
  drugClass: AnalgesicClass;
  dose: number;
  unit: string;
  frequencyHours: number;
  isPRN: boolean; // Pro re nata (as needed)
}

export class PainManagementPlan {
  private prescriptions: AnalgesicPrescription[] = [];
  private regionalBlockPerformed: boolean = false;

  constructor(
    public readonly planId: string,
    public readonly patientId: string,
    private opioidRiskToolScore: number // 0-27 scale assessing risk of opioid abuse
  ) {}

  public addPrescription(prescription: AnalgesicPrescription): void {
    // Enforce multimodal constraints
    if (prescription.drugClass === AnalgesicClass.OPIOID && this.opioidRiskToolScore > 7) {
      console.warn('High Opioid Risk Tool score detected. Ensure strict monitoring and maximize non-opioid adjuncts.');
    }
    this.prescriptions.push(prescription);
  }

  public recordRegionalBlock(blockType: string): void {
    this.regionalBlockPerformed = true;
    // Adjust plan to reduce systemic opioids
    this.prescriptions = this.prescriptions.map(rx => {
      if (rx.drugClass === AnalgesicClass.OPIOID && !rx.isPRN) {
        return { ...rx, isPRN: true }; // Convert scheduled opioids to PRN if block is successful
      }
      return rx;
    });
  }

  public evaluateMultimodalEfficacy(): string {
    const classesUsed = new Set(this.prescriptions.map(rx => rx.drugClass));
    
    if (classesUsed.size < 3 && !this.regionalBlockPerformed) {
      return 'SUBOPTIMAL: Plan relies on too few analgesic pathways. Consider adding NSAIDs, Acetaminophen, or Gabapentinoids to reduce opioid consumption.';
    }

    if (this.regionalBlockPerformed && classesUsed.has(AnalgesicClass.NSAID) && classesUsed.has(AnalgesicClass.ACETAMINOPHEN)) {
      return 'OPTIMAL: Excellent multimodal ERAS (Enhanced Recovery After Surgery) protocol in place.';
    }

    return 'ADEQUATE: Multimodal approach is utilized, but could be optimized further based on patient contraindications.';
  }

  public getActivePlan(): AnalgesicPrescription[] {
    return [...this.prescriptions];
  }
}

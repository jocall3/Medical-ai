export interface Medication {
  rxcui: string;
  name: string;
  anticholinergicScore: number; // 0-3 (ACB scale)
  cypInteractions: string[]; // e.g., 'CYP3A4_inhibitor'
}

export class PolypharmacyRiskEngine {
  public calculateAnticholinergicBurden(medications: Medication[]): number {
    return medications.reduce((total, med) => total + med.anticholinergicScore, 0);
  }

  public evaluateInteractions(medications: Medication[]): string[] {
    const warnings: string[] = [];
    const inhibitors = medications.filter(m => m.cypInteractions.includes('CYP3A4_inhibitor'));
    const substrates = medications.filter(m => m.cypInteractions.includes('CYP3A4_substrate'));

    if (inhibitors.length > 0 && substrates.length > 0) {
      warnings.push(`High Risk: CYP3A4 inhibitors (${inhibitors.map(i=>i.name).join(', ')}) mixed with substrates (${substrates.map(s=>s.name).join(', ')}).`);
    }

    if (medications.length >= 5) {
      warnings.push("Polypharmacy Alert: Patient is taking 5 or more medications, increasing risk of adverse drug events.");
    }

    return warnings;
  }
}

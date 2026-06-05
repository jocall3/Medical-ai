export enum DementiaType {
  ALZHEIMERS = 'Alzheimers',
  VASCULAR = 'Vascular',
  LEWY_BODY = 'Lewy_Body',
  FRONTOTEMPORAL = 'Frontotemporal'
}

export interface CognitiveState {
  mmseScore: number; // Mini-Mental State Exam (0-30)
  cdrScore: number; // Clinical Dementia Rating (0-3)
  monthsSinceOnset: number;
}

export class DementiaProgressionModel {
  public simulateDecline(
    currentState: CognitiveState, 
    type: DementiaType, 
    timeMonths: number, 
    cholinesteraseInhibitor: boolean
  ): CognitiveState {
    let declineRatePerYear = 0;

    switch (type) {
      case DementiaType.ALZHEIMERS:
        declineRatePerYear = 3.0; // Average MMSE points lost per year
        break;
      case DementiaType.VASCULAR:
        declineRatePerYear = 2.5; // Step-wise, but averaged
        break;
      case DementiaType.LEWY_BODY:
        declineRatePerYear = 4.0;
        break;
      case DementiaType.FRONTOTEMPORAL:
        declineRatePerYear = 3.5;
        break;
    }

    if (cholinesteraseInhibitor) {
      declineRatePerYear *= 0.8; // 20% slowing of cognitive decline
    }

    const totalDecline = declineRatePerYear * (timeMonths / 12);
    const newMmse = Math.max(0, currentState.mmseScore - totalDecline);
    
    let newCdr = currentState.cdrScore;
    if (newMmse < 10) newCdr = 3;
    else if (newMmse < 20) newCdr = 2;
    else if (newMmse < 26) newCdr = 1;

    return {
      mmseScore: newMmse,
      cdrScore: newCdr,
      monthsSinceOnset: currentState.monthsSinceOnset + timeMonths
    };
  }
}

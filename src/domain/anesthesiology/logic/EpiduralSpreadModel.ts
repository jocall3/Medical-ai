/**
 * Simulates the dermatomal spread of local anesthetics injected into the epidural space.
 * Uses volume, concentration, patient height, and positioning to predict the block level.
 */
export enum PatientPosition {
  SUPINE = 'SUPINE',
  SITTING = 'SITTING',
  TRENDELENBURG = 'TRENDELENBURG',
  REVERSE_TRENDELENBURG = 'REVERSE_TRENDELENBURG'
}

export class EpiduralSpreadModel {
  private readonly DERMATOMES = [
    'C1','C2','C3','C4','C5','C6','C7','C8',
    'T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12',
    'L1','L2','L3','L4','L5',
    'S1','S2','S3','S4','S5'
  ];

  /**
   * Predicts the upper and lower dermatome levels of the sensory block.
   */
  public simulateSpread(
    injectionInterspace: string, // e.g., 'L3-L4'
    volumeMl: number,
    patientHeightCm: number,
    position: PatientPosition,
    age: number
  ): { upperLevel: string; lowerLevel: string } {
    // Base assumption: 1.5 to 2.0 mL of local anesthetic per segment to be blocked
    // Older patients require less volume per segment (wider spread)
    const ageFactor = age > 60 ? 1.2 : 1.0;
    const heightFactor = 170 / patientHeightCm; // Taller patients get less spread per mL
    
    const segmentsBlocked = Math.round((volumeMl / 1.5) * ageFactor * heightFactor);

    // Parse injection site (e.g., 'L3-L4' -> 'L3')
    const injectionSegment = injectionInterspace.split('-')[0];
    const injectionIndex = this.DERMATOMES.indexOf(injectionSegment);

    if (injectionIndex === -1) throw new Error('Invalid injection interspace.');

    let upwardSpread = Math.floor(segmentsBlocked / 2);
    let downwardSpread = Math.ceil(segmentsBlocked / 2);

    // Gravity effects based on patient positioning
    switch (position) {
      case PatientPosition.SITTING:
      case PatientPosition.REVERSE_TRENDELENBURG:
        upwardSpread -= 2;
        downwardSpread += 2;
        break;
      case PatientPosition.TRENDELENBURG:
        upwardSpread += 3;
        downwardSpread -= 1;
        break;
      case PatientPosition.SUPINE:
      default:
        // Even spread
        break;
    }

    const upperIndex = Math.max(0, injectionIndex - upwardSpread);
    const lowerIndex = Math.min(this.DERMATOMES.length - 1, injectionIndex + downwardSpread);

    return {
      upperLevel: this.DERMATOMES[upperIndex],
      lowerLevel: this.DERMATOMES[lowerIndex]
    };
  }
}

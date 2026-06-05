/**
 * Aggregate root that combines clinical exam findings with multimodal diagnostic data
 * (EEG, MRI) to represent a complete, holistic neurological state of a patient.
 */
export class NeurologicalAssessment {
  public patientId: string;
  public assessmentDate: Date;
  
  // Clinical Exam
  public cranialNervesIntact: boolean[]; // Array of 12 booleans
  public motorStrength: Record<string, number>; // e.g., { 'LeftArm': 5, 'RightArm': 4 } (0-5 scale)
  public deepTendonReflexes: Record<string, number>; // 0 to 4+ scale
  
  // Diagnostic Data
  public eegFindings: {
    dominantRhythm: string; // e.g., 'Alpha'
    epileptiformDischargesPresent: boolean;
    focalSlowing: string | null;
  };
  
  public mriFindings: {
    atrophyLevel: string; // 'None', 'Mild', 'Moderate', 'Severe'
    whiteMatterHyperintensities: boolean;
    infarctsPresent: boolean;
  };

  constructor(patientId: string) {
    this.patientId = patientId;
    this.assessmentDate = new Date();
    this.cranialNervesIntact = new Array(12).fill(true);
    this.motorStrength = { LeftArm: 5, RightArm: 5, LeftLeg: 5, RightLeg: 5 };
    this.deepTendonReflexes = { Biceps: 2, Patellar: 2, Achilles: 2 };
    this.eegFindings = { dominantRhythm: 'Alpha', epileptiformDischargesPresent: false, focalSlowing: null };
    this.mriFindings = { atrophyLevel: 'None', whiteMatterHyperintensities: false, infarctsPresent: false };
  }

  /**
   * Evaluates the assessment to flag critical neurological emergencies.
   */
  public isEmergency(): boolean {
    const hasMotorDeficit = Object.values(this.motorStrength).some(strength => strength < 3);
    const hasSeizureActivity = this.eegFindings.epileptiformDischargesPresent;
    const hasAcuteInfarct = this.mriFindings.infarctsPresent; // Simplified assumption of acuity

    return hasMotorDeficit || hasSeizureActivity || hasAcuteInfarct;
  }
}

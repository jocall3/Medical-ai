import { DialysisClearanceSimulator, DialysisParameters } from '../logic/DialysisClearanceSimulator';

/**
 * DialysisSession Aggregate Root
 * Manages the parameters, real-time monitoring, and adequacy calculations of a single dialysis treatment.
 * Tracks ultrafiltration rate, dialysate composition, and monitors for intradialytic hypotension.
 */
export interface DialysateComposition {
  sodium: number;      // mEq/L (typically 135-145)
  potassium: number;   // mEq/L (typically 1.0-3.0)
  calcium: number;     // mEq/L (typically 1.25-1.75)
  bicarbonate: number; // mEq/L (typically 32-40)
}

export interface VitalSignReading {
  timestamp: Date;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
}

export class DialysisSession {
  private sessionId: string;
  private patientId: string;
  private parameters: DialysisParameters;
  private dialysate: DialysateComposition;
  private preTreatmentUrea: number; // mg/dL
  private vitalsLog: VitalSignReading[];
  private isCompleted: boolean;

  constructor(
    sessionId: string,
    patientId: string,
    preTreatmentUrea: number,
    parameters: DialysisParameters,
    dialysate: DialysateComposition
  ) {
    this.sessionId = sessionId;
    this.patientId = patientId;
    this.preTreatmentUrea = preTreatmentUrea;
    this.parameters = parameters;
    this.dialysate = dialysate;
    this.vitalsLog = [];
    this.isCompleted = false;
  }

  /**
   * Logs a vital sign reading during the session and checks for Intradialytic Hypotension (IDH)
   */
  public logVitals(reading: VitalSignReading): { idhDetected: boolean; actionRequired: string | null } {
    this.vitalsLog.push(reading);

    if (this.vitalsLog.length > 1) {
      const baseline = this.vitalsLog[0];
      const bpDrop = baseline.systolicBP - reading.systolicBP;

      if (reading.systolicBP < 90 || bpDrop >= 20) {
        return {
          idhDetected: true,
          actionRequired: 'CRITICAL: Intradialytic Hypotension detected. Place patient in Trendelenburg position, reduce Ultrafiltration Rate (UFR) to zero, and administer 100-200 mL Normal Saline bolus.',
        };
      }
    } else if (reading.systolicBP < 90) {
      return {
        idhDetected: true,
        actionRequired: 'CRITICAL: Low baseline systolic blood pressure. Re-evaluate ultrafiltration targets before proceeding.',
      };
    }

    return { idhDetected: false, actionRequired: null };
  }

  /**
   * Calculates the current Ultrafiltration Rate (UFR) in mL/kg/hour
   * High UFR (> 10-13 mL/kg/hr) is strongly associated with cardiovascular mortality and IDH.
   */
  public calculateUltrafiltrationRate(): number {
    const totalUfMl = this.parameters.ultrafiltrationVolume * 1000;
    const durationHours = this.parameters.durationMinutes / 60;
    const weight = this.parameters.patientWeightPost;

    if (weight <= 0 || durationHours <= 0) return 0;
    return Math.round((totalUfMl / weight / durationHours) * 100) / 100;
  }

  /**
   * Completes the session and calculates the final clearance metrics
   */
  public completeSession(): {
    ktV: number;
    urr: number;
    postUrea: number;
    ufrSafetyStatus: 'Safe' | 'Caution' | 'High Risk';
  } {
    this.isCompleted = true;

    const clearanceResult = DialysisClearanceSimulator.simulateSession(
      this.preTreatmentUrea,
      this.parameters
    );

    const ufr = this.calculateUltrafiltrationRate();
    let ufrSafetyStatus: 'Safe' | 'Caution' | 'High Risk' = 'Safe';
    if (ufr > 13) {
      ufrSafetyStatus = 'High Risk';
    } else if (ufr > 10) {
      ufrSafetyStatus = 'Caution';
    }

    return {
      ktV: clearanceResult.ktV,
      urr: clearanceResult.ureaReductionRatio,
      postUrea: clearanceResult.postDialysisUrea,
      ufrSafetyStatus,
    };
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getPatientId(): string {
    return this.patientId;
  }

  public getParameters(): DialysisParameters {
    return { ...this.parameters };
  }

  public getDialysate(): DialysateComposition {
    return { ...this.dialysate };
  }

  public getVitalsLog(): VitalSignReading[] {
    return [...this.vitalsLog];
  }
}
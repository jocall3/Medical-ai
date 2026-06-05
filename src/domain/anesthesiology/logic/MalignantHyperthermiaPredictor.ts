/**
 * Detects the rapid onset of hypermetabolism indicative of Malignant Hyperthermia (MH).
 * Analyzes ETCO2, temperature, heart rate, and genetic susceptibility.
 */
export interface IntraopVitals {
  etco2: number; // mmHg
  temperature: number; // Celsius
  heartRate: number; // bpm
  minuteVentilation: number; // L/min
}

export interface PatientGenetics {
  hasRYR1Mutation: boolean;
  hasCACNA1SMutation: boolean;
  familyHistoryOfMH: boolean;
}

export class MalignantHyperthermiaPredictor {
  private baselineVitals: IntraopVitals | null = null;
  private vitalsHistory: { time: number; vitals: IntraopVitals }[] = [];

  public setBaseline(vitals: IntraopVitals): void {
    this.baselineVitals = vitals;
  }

  public addVitalsReading(timeMs: number, vitals: IntraopVitals): void {
    this.vitalsHistory.push({ time: timeMs, vitals });
    // Keep only last 15 minutes of data for rate-of-rise calculations
    const fifteenMinsMs = 15 * 60 * 1000;
    this.vitalsHistory = this.vitalsHistory.filter(v => timeMs - v.time <= fifteenMinsMs);
  }

  /**
   * Analyzes current state to predict MH probability.
   * Returns a risk score from 0.0 to 1.0 and an alert message.
   */
  public analyzeRisk(currentVitals: IntraopVitals, genetics: PatientGenetics, volatileAgentActive: boolean): { riskScore: number; alert: string } {
    if (!volatileAgentActive && !genetics.hasRYR1Mutation) {
      return { riskScore: 0.0, alert: 'Low Risk: No triggering agents active.' };
    }

    let riskScore = 0.0;
    const alerts: string[] = [];

    // Genetic predisposition
    if (genetics.hasRYR1Mutation || genetics.hasCACNA1SMutation) riskScore += 0.4;
    else if (genetics.familyHistoryOfMH) riskScore += 0.2;

    // ETCO2 Analysis (Unexplained rise despite constant minute ventilation)
    if (this.baselineVitals) {
      const etco2Rise = currentVitals.etco2 - this.baselineVitals.etco2;
      if (etco2Rise > 15) {
        riskScore += 0.3;
        alerts.push('Rapid, unexplained rise in ETCO2 detected.');
      }
    }

    // Temperature Analysis (Late but definitive sign)
    if (this.vitalsHistory.length > 1) {
      const oldest = this.vitalsHistory[0];
      const tempRiseRate = (currentVitals.temperature - oldest.vitals.temperature) / ((Date.now() - oldest.time) / 60000); // degrees per min
      if (tempRiseRate > 0.1) { // > 0.1 C per minute is highly suspicious
        riskScore += 0.3;
        alerts.push('Rapid temperature rise detected (>0.1°C/min).');
      }
    }

    // Tachycardia
    if (this.baselineVitals && currentVitals.heartRate > this.baselineVitals.heartRate + 30) {
      riskScore += 0.1;
    }

    riskScore = Math.min(1.0, riskScore);

    if (riskScore >= 0.7) {
      return { riskScore, alert: `CRITICAL MH ALERT: ${alerts.join(' ')} Discontinue volatiles, hyperventilate with 100% O2, prepare Dantrolene.` };
    } else if (riskScore >= 0.4) {
      return { riskScore, alert: `WARNING: Possible hypermetabolic state. ${alerts.join(' ')} Evaluate for MH, sepsis, or light anesthesia.` };
    }

    return { riskScore, alert: 'Normal metabolic state.' };
  }
}

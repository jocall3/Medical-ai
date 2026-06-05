/**
 * DialysisClearanceSimulator
 * Models the diffusion of urea and other uremic toxins across a semipermeable membrane
 * during Hemodialysis (HD) or Peritoneal Dialysis (PD).
 * Implements the formal Daugirdas second-generation formula for single-pool Kt/V.
 */
export interface DialysisParameters {
  bloodFlowRate: number;       // Qb (mL/min), typical 300-500 mL/min
  dialysateFlowRate: number;   // Qd (mL/min), typical 500-800 mL/min
  dialyzerKoA: number;         // Mass transfer area coefficient (mL/min), typical 500-1000
  durationMinutes: number;     // Treatment duration (t)
  ultrafiltrationVolume: number; // UF volume removed (L)
  patientWeightPost: number;   // Post-dialysis weight (W) in kg
  patientV: number;            // Urea distribution volume (V) in Liters (approx 58% of body weight)
}

export interface ClearanceResult {
  dialyzerClearance: number;   // Kd (mL/min)
  ktV: number;                 // Dimensionless adequacy index (Target >= 1.2 for HD)
  ureaReductionRatio: number;  // URR = (C_pre - C_post) / C_pre
  postDialysisUrea: number;    // Estimated post-dialysis BUN (mg/dL)
}

export class DialysisClearanceSimulator {
  /**
   * Calculates dialyzer clearance (Kd) using the mathematical model of counter-current flow:
   * Kd = Qb * [1 - exp(KoA * (1/Qb - 1/Qd))] / [Qd/Qb - exp(KoA * (1/Qb - 1/Qd))]
   */
  public static calculateDialyzerClearance(Qb: number, Qd: number, KoA: number): number {
    if (Qb === Qd) {
      return Qb * (KoA / (Qb + KoA));
    }

    const ratio = Qd / Qb;
    const exponent = KoA * (1 / Qb - 1 / Qd);
    const expTerm = Math.exp(exponent);

    const clearance = Qb * ((1 - expTerm) / (ratio - expTerm));
    return Math.min(clearance, Qb);
  }

  /**
   * Simulates a dialysis session and calculates clearance metrics including Kt/V and URR.
   */
  public static simulateSession(
    preDialysisUrea: number,
    params: DialysisParameters
  ): ClearanceResult {
    const Kd = this.calculateDialyzerClearance(params.bloodFlowRate, params.dialysateFlowRate, params.dialyzerKoA);
    const t = params.durationMinutes;
    const V = params.patientV;
    const UF = params.ultrafiltrationVolume;
    const W = params.patientWeightPost;

    const kdtV = (Kd * t) / (V * 1000);
    const R_est = Math.exp(-kdtV);
    const R = Math.max(0.05, R_est * (1 - UF / V));

    const lnTerm = -Math.log(R - 0.008 * (t / 60));
    const ufTerm = (4 - 3.5 * R) * (UF / W);
    const ktV = Math.max(0, lnTerm + ufTerm);

    const urr = (1 - R) * 100;
    const postDialysisUrea = preDialysisUrea * R;

    return {
      dialyzerClearance: Math.round(Kd * 10) / 10,
      ktV: Math.round(ktV * 100) / 100,
      ureaReductionRatio: Math.round(urr * 10) / 10,
      postDialysisUrea: Math.round(postDialysisUrea * 10) / 10,
    };
  }
}
export type NYHAClass = 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IV';

export interface TreatmentAdherence {
  betaBlockerAdherence: number; // 0.0 to 1.0
  arniOrAceiAdherence: number;  // 0.0 to 1.0
  sglt2iAdherence: number;      // 0.0 to 1.0
  dietarySodiumRestriction: boolean;
}

export interface TrajectoryUpdate {
  newNyhaClass: NYHAClass;
  raasActivationLevel: number;
  snsActivationLevel: number;
  bnpLevelPgMl: number;
  fluidRetentionLiters: number;
  remodelingIndex: number;
  decompensationRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export class HeartFailureTrajectory {
  constructor(
    public nyhaClass: NYHAClass,
    public raasActivationLevel: number, // Renin-Angiotensin-Aldosterone System activation (0.0 to 1.0)
    public snsActivationLevel: number,  // Sympathetic Nervous System activation (0.0 to 1.0)
    public bnpLevelPgMl: number,        // Brain Natriuretic Peptide (pg/mL)
    public fluidRetentionLiters: number,
    public remodelingIndex: number      // Ventricular remodeling/hypertrophy index (0.0 to 1.0)
  ) {}

  /**
   * Simulates the progression of congestive heart failure over a given timeframe (in months)
   * based on treatment adherence and neurohormonal compensatory mechanisms.
   */
  public evolveTrajectory(
    months: number,
    treatment: TreatmentAdherence
  ): TrajectoryUpdate {
    const raasInhibition = treatment.arniOrAceiAdherence * 0.6;
    const snsInhibition = treatment.betaBlockerAdherence * 0.5;
    const sglt2iEffect = treatment.sglt2iAdherence * 0.4;

    const baseRemodelingRate = 0.015;
    const activeRaasFactor = Math.max(0, this.raasActivationLevel - raasInhibition);
    const activeSnsFactor = Math.max(0, this.snsActivationLevel - snsInhibition);

    const monthlyRemodelingIncrease = baseRemodelingRate * (1 + activeRaasFactor * 2 + activeSnsFactor * 1.5) - (sglt2iEffect * 0.01);
    this.remodelingIndex = Math.max(0.0, Math.min(1.0, this.remodelingIndex + (monthlyRemodelingIncrease * months)));

    this.raasActivationLevel = Math.max(0.0, Math.min(1.0, 0.2 + (this.remodelingIndex * 0.8) - raasInhibition));
    this.snsActivationLevel = Math.max(0.0, Math.min(1.0, 0.3 + (this.remodelingIndex * 0.7) - snsInhibition));

    const baseFluidRetention = this.raasActivationLevel * 5.0;
    const sodiumPenalty = treatment.dietarySodiumRestriction ? 0 : 2.0;
    this.fluidRetentionLiters = Math.max(0.0, baseFluidRetention + sodiumPenalty - (sglt2iEffect * 2.0));

    this.bnpLevelPgMl = Math.round((this.remodelingIndex * 800) + (this.fluidRetentionLiters * 150));

    if (this.remodelingIndex > 0.75 || this.fluidRetentionLiters > 6.0) {
      this.nyhaClass = 'CLASS_IV';
    } else if (this.remodelingIndex > 0.50 || this.fluidRetentionLiters > 3.5) {
      this.nyhaClass = 'CLASS_III';
    } else if (this.remodelingIndex > 0.25 || this.fluidRetentionLiters > 1.5) {
      this.nyhaClass = 'CLASS_II';
    } else {
      this.nyhaClass = 'CLASS_I';
    }

    let decompensationRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (this.bnpLevelPgMl > 1000 || this.fluidRetentionLiters > 7.0) {
      decompensationRisk = 'CRITICAL';
    } else if (this.bnpLevelPgMl > 500 || this.fluidRetentionLiters > 4.0) {
      decompensationRisk = 'HIGH';
    } else if (this.bnpLevelPgMl > 200 || this.fluidRetentionLiters > 2.0) {
      decompensationRisk = 'MODERATE';
    }

    return {
      newNyhaClass: this.nyhaClass,
      raasActivationLevel: parseFloat(this.raasActivationLevel.toFixed(2)),
      snsActivationLevel: parseFloat(this.snsActivationLevel.toFixed(2)),
      bnpLevelPgMl: this.bnpLevelPgMl,
      fluidRetentionLiters: parseFloat(this.fluidRetentionLiters.toFixed(2)),
      remodelingIndex: parseFloat(this.remodelingIndex.toFixed(2)),
      decompensationRisk
    };
  }
}
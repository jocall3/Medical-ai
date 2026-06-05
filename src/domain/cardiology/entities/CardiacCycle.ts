export enum CardiacPhase {
  ATRIAL_SYSTOLE = "ATRIAL_SYSTOLE",
  ISOVOLUMETRIC_CONTRACTION = "ISOVOLUMETRIC_CONTRACTION",
  VENTRICULAR_EJECTION = "VENTRICULAR_EJECTION",
  ISOVOLUMETRIC_RELAXATION = "ISOVOLUMETRIC_RELAXATION",
  RAPID_FILLING = "RAPID_FILLING",
  REDUCED_FILLING = "REDUCED_FILLING"
}

export interface WiggersState {
  leftVentricularPressure: number; // mmHg
  leftAtrialPressure: number;     // mmHg
  aorticPressure: number;         // mmHg
  leftVentricularVolume: number;  // mL
  ecgSegment: string;             // e.g., "P-wave", "QRS complex", "T-wave"
}

export class CardiacCycle {
  constructor(
    public currentPhase: CardiacPhase,
    public durationMs: number,
    public state: WiggersState
  ) {}

  public validateThermodynamicConsistency(): boolean {
    const { leftVentricularPressure, leftAtrialPressure, aorticPressure, leftVentricularVolume } = this.state;

    switch (this.currentPhase) {
      case CardiacPhase.ISOVOLUMETRIC_CONTRACTION:
        // Mitral and aortic valves are closed. Volume must remain constant.
        // LV pressure must be rising rapidly, exceeding LA pressure but still below aortic pressure.
        return leftVentricularPressure >= leftAtrialPressure && leftVentricularPressure <= aorticPressure;

      case CardiacPhase.VENTRICULAR_EJECTION:
        // Aortic valve is open. LV pressure must exceed aortic pressure (or be equal in ideal flow).
        return leftVentricularPressure >= aorticPressure;

      case CardiacPhase.ISOVOLUMETRIC_RELAXATION:
        // Both valves closed. Volume must remain constant.
        // LV pressure drops below aortic pressure but remains above LA pressure.
        return leftVentricularPressure <= aorticPressure && leftVentricularPressure >= leftAtrialPressure;

      case CardiacPhase.ATRIAL_SYSTOLE:
      case CardiacPhase.RAPID_FILLING:
      case CardiacPhase.REDUCED_FILLING:
        // Mitral valve is open. LA pressure must be greater than or equal to LV pressure.
        return leftAtrialPressure >= leftVentricularPressure;

      default:
        return true;
    }
  }

  public transitionTo(nextPhase: CardiacPhase, newState: WiggersState): void {
    this.currentPhase = nextPhase;
    this.state = newState;
    if (!this.validateThermodynamicConsistency()) {
      console.warn(`Warning: Cardiac cycle state in phase ${nextPhase} violates hemodynamic/thermodynamic consistency rules.`);
    }
  }
}
/**
 * Represents an airway management device (e.g., Endotracheal Tube, LMA).
 * Tracks physical properties, cuff pressure, and placement verification status.
 */
export enum AirwayDeviceType {
  ENDOTRACHEAL_TUBE = 'ENDOTRACHEAL_TUBE',
  SUPRAGLOTTIC_AIRWAY = 'SUPRAGLOTTIC_AIRWAY',
  TRACHEOSTOMY = 'TRACHEOSTOMY'
}

export enum PlacementStatus {
  UNPLACED = 'UNPLACED',
  ATTEMPTING = 'ATTEMPTING',
  PLACED_UNVERIFIED = 'PLACED_UNVERIFIED',
  VERIFIED_TRACHEAL = 'VERIFIED_TRACHEAL',
  ESOPHAGEAL_INTUBATION = 'ESOPHAGEAL_INTUBATION'
}

export class AirwayDevice {
  private cuffPressureCmH2O: number = 0;
  private placementStatus: PlacementStatus = PlacementStatus.UNPLACED;
  private depthAtTeethCm: number | null = null;

  constructor(
    public readonly id: string,
    public readonly type: AirwayDeviceType,
    public readonly size: number, // Internal Diameter (ID) in mm or LMA size
    public readonly hasCuff: boolean = true
  ) {}

  public inflateCuff(pressure: number): void {
    if (!this.hasCuff) throw new Error('Device does not have a cuff.');
    if (pressure > 30) {
      console.warn('Warning: Cuff pressure exceeds 30 cmH2O. Risk of tracheal mucosal ischemia.');
    }
    this.cuffPressureCmH2O = pressure;
  }

  public getCuffPressure(): number {
    return this.cuffPressureCmH2O;
  }

  public recordPlacement(depthCm: number): void {
    this.depthAtTeethCm = depthCm;
    this.placementStatus = PlacementStatus.PLACED_UNVERIFIED;
  }

  public verifyPlacement(etco2Present: boolean, bilateralBreathSounds: boolean, ultrasoundConfirmed: boolean): void {
    if (this.placementStatus !== PlacementStatus.PLACED_UNVERIFIED) {
      throw new Error('Device must be placed before verification.');
    }

    if (etco2Present && bilateralBreathSounds) {
      this.placementStatus = PlacementStatus.VERIFIED_TRACHEAL;
    } else if (!etco2Present && ultrasoundConfirmed) {
      this.placementStatus = PlacementStatus.ESOPHAGEAL_INTUBATION;
    } else {
      this.placementStatus = PlacementStatus.PLACED_UNVERIFIED; // Needs further assessment
    }
  }

  public getStatus(): PlacementStatus {
    return this.placementStatus;
  }
}

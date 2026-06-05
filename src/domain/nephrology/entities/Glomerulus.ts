/**
 * Glomerulus Entity
 * Models the capillary tuft of a single nephron, tracking hydrostatic and oncotic pressures,
 * podocyte integrity, and calculating the Single Nephron Glomerular Filtration Rate (SNGFR).
 */
export interface GlomerularPressures {
  hydrostaticCapillary: number; // P_GC (mmHg), normal ~45-50 mmHg
  hydrostaticBowman: number;   // P_BS (mmHg), normal ~10-15 mmHg
  oncoticCapillary: number;     // pi_GC (mmHg), normal ~25-35 mmHg (increases along capillary)
  oncoticBowman: number;       // pi_BS (mmHg), normal ~0 mmHg (protein-free filtrate)
}

export class Glomerulus {
  private id: string;
  private pressures: GlomerularPressures;
  private podocyteIntegrity: number; // Scale from 0.0 (complete effacement/loss) to 1.0 (fully intact)
  private capillarySurfaceArea: number; // Relative scale or actual estimated area (e.g., mm^2)
  private hydraulicConductivity: number; // Lp (m/s/mmHg)

  constructor(
    id: string,
    pressures: Partial<GlomerularPressures> = {},
    podocyteIntegrity = 1.0,
    capillarySurfaceArea = 1.0,
    hydraulicConductivity = 12.5 // Standard baseline Kf factor
  ) {
    this.id = id;
    this.pressures = {
      hydrostaticCapillary: pressures.hydrostaticCapillary ?? 45.0,
      hydrostaticBowman: pressures.hydrostaticBowman ?? 10.0,
      oncoticCapillary: pressures.oncoticCapillary ?? 28.0,
      oncoticBowman: pressures.oncoticBowman ?? 0.0,
    };
    this.podocyteIntegrity = Math.max(0, Math.min(1, podocyteIntegrity));
    this.capillarySurfaceArea = capillarySurfaceArea;
    this.hydraulicConductivity = hydraulicConductivity;
  }

  /**
   * Calculates the Net Filtration Pressure (NFP)
   * NFP = (P_GC - P_BS) - (pi_GC - pi_BS)
   */
  public calculateNetFiltrationPressure(): number {
    const hydrostaticGradient = this.pressures.hydrostaticCapillary - this.pressures.hydrostaticBowman;
    const oncoticGradient = this.pressures.oncoticCapillary - this.pressures.oncoticBowman;
    return hydrostaticGradient - oncoticGradient;
  }

  /**
   * Calculates the ultrafiltration coefficient (Kf)
   * Kf is proportional to capillary surface area and hydraulic conductivity,
   * and is heavily degraded by loss of podocyte integrity.
   */
  public calculateFiltrationCoefficient(): number {
    return this.hydraulicConductivity * this.capillarySurfaceArea * this.podocyteIntegrity;
  }

  /**
   * Calculates Single Nephron Glomerular Filtration Rate (SNGFR) in nL/min
   * SNGFR = Kf * NFP
   */
  public calculateSNGFR(): number {
    const nfp = this.calculateNetFiltrationPressure();
    const kf = this.calculateFiltrationCoefficient();
    return Math.max(0, kf * nfp);
  }

  /**
   * Simulates the effect of systemic hypertension or afferent/efferent arteriole resistance changes
   */
  public updateHemodynamics(afferentResistance: number, efferentResistance: number, meanArterialPressure: number): void {
    const totalResistance = afferentResistance + efferentResistance;
    if (totalResistance > 0) {
      this.pressures.hydrostaticCapillary = meanArterialPressure * (efferentResistance / totalResistance);
    }
  }

  /**
   * Simulates podocyte damage due to hyperfiltration or immunological attack
   */
  public applyPodocyteInsult(damageFactor: number): void {
    this.podocyteIntegrity = Math.max(0, this.podocyteIntegrity - damageFactor);
  }

  public repairPodocytes(repairFactor: number): void {
    this.podocyteIntegrity = Math.min(1.0, this.podocyteIntegrity + repairFactor);
  }

  public getPressures(): GlomerularPressures {
    return { ...this.pressures };
  }

  public getPodocyteIntegrity(): number {
    return this.podocyteIntegrity;
  }

  public getId(): string {
    return this.id;
  }
}
import { Hormone } from '../entities/Hormone';

/**
 * Implementation of the Bergman Minimal Model
 * Describes the relationship between glucose and insulin in the blood.
 */
export class GlucoseInsulinLoop {
  // Constants for a standard adult
  private readonly G_B = 90; // Basal glucose (mg/dL)
  private readonly S_I = 0.001; // Insulin sensitivity (1/min/uU/mL)
  private readonly G_D = 0.01; // Glucose effectiveness (1/min)

  constructor(
    private currentGlucose: number,
    private currentInsulin: number
  ) {}

  /**
   * Simulates one time step (dt) of the glucose-insulin interaction.
   * @param dt Time step in minutes
   * @param glucoseInput External glucose input (e.g., meal) in mg/dL/min
   */
  public simulateStep(dt: number, glucoseInput: number): { glucose: number; insulin: number } {
    // 1. Rate of change of glucose (dG/dt)
    // dG/dt = - (S_I * X * G) - (G_D * (G - G_B)) + GlucoseInput
    // X is the 'active' insulin in the interstitial space
    const activeInsulin = this.currentInsulin * 0.1; // Simplified interstitial delay
    const dG = (-(this.S_I * activeInsulin * this.currentGlucose) - 
                (this.G_D * (this.currentGlucose - this.G_B)) + 
                glucoseInput) * dt;

    // 2. Rate of change of insulin (dI/dt)
    // Simplified: Insulin secretion is proportional to glucose above basal
    const insulinSecretionRate = this.currentGlucose > this.G_B 
      ? (this.currentGlucose - this.G_B) * 0.05 
      : 0;
    const insulinClearance = this.currentInsulin * 0.02; // First order clearance
    const dI = (insulinSecretionRate - insulinClearance) * dt;

    this.currentGlucose += dG;
    this.currentInsulin += dI;

    return { 
      glucose: Math.max(0, this.currentGlucose), 
      insulin: Math.max(0, this.currentInsulin) 
    };
  }

  public getGlucose(): number { return this.currentGlucose; }
  public getInsulin(): number { return this.currentInsulin; }
}
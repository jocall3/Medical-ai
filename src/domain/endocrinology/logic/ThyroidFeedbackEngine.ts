import { EndocrineGland } from '../entities/EndocrineGland';
import { GlandState } from '../entities/EndocrineGland';

export class ThyroidFeedbackEngine {
  private trhLevel: number = 1.0; // Hypothalamus
  private tshLevel: number = 1.0; // Pituitary
  private t4Level: number = 1.0;  // Thyroid
  private t3Level: number = 0.2;  // Peripheral conversion

  constructor(
    private thyroidGland: EndocrineGland
  ) {}

  /**
   * Simulates the HPT axis feedback loop.
   * T3/T4 inhibit TRH and TSH production (Negative Feedback).
   */
  public update(dt: number): { trh: number; tsh: number; t4: number; t3: number } {
    // 1. Negative Feedback: T4/T3 inhibit TRH and TSH
    const feedbackInhibition = (this.t4Level * 0.8 + this.t3Level * 1.2);
    
    // 2. Hypothalamus: TRH production
    const trhProduction = 1.0 / (1.0 + feedbackInhibition);
    this.trhLevel += (trhProduction - this.trhLevel * 0.1) * dt;

    // 3. Pituitary: TSH production (stimulated by TRH, inhibited by T4/T3)
    const tshProduction = (this.trhLevel * 2.0) / (1.0 + feedbackInhibition);
    this.tshLevel += (tshProduction - this.tshLevel * 0.1) * dt;

    // 4. Thyroid: T4 production (stimulated by TSH)
    const t4Production = this.thyroidGland.calculateSecretion(this.tshLevel);
    this.t4Level += (t4Production - this.t4Level * 0.05) * dt;

    // 5. Peripheral: T4 to T3 conversion
    const conversionRate = this.t4Level * 0.1;
    this.t3Level += (conversionRate - this.t3Level * 0.1) * dt;

    return { 
      trh: this.trhLevel, 
      tsh: this.tshLevel, 
      t4: this.t4Level, 
      t3: this.t3Level 
    };
  }

  public setThyroidState(state: GlandState): void {
    this.thyroidGland.updateState(state);
  }
}
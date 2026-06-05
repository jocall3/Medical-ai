export type HormoneType = 'Insulin' | 'Glucagon' | 'Thyroxine' | 'Triiodothyronine' | 'Cortisol' | 'ACTH' | 'TSH' | 'TRH' | 'Estrogen' | 'Progesterone' | 'LH' | 'FSH' | 'PTH' | 'Calcitonin';

export interface HormoneBindingProperties {
  bindingProtein: string;
  affinityConstant: number; // Ka in M-1
  freeFraction: number; // Percentage of hormone not bound to protein
}

export class Hormone {
  constructor(
    public readonly type: HormoneType,
    public readonly halfLifeMinutes: number,
    public readonly molecularWeight: number,
    public bindingProperties?: HormoneBindingProperties
  ) {}

  /**
   * Calculates the remaining concentration of the hormone after a given time interval.
   * Based on first-order elimination kinetics.
   */
  public calculateDecay(initialConcentration: number, elapsedMinutes: number): number {
    const decayConstant = Math.LN2 / this.halfLifeMinutes;
    return initialConcentration * Math.exp(-decayConstant * elapsedMinutes);
  }

  public getFreeConcentration(totalConcentration: number): number {
    return this.bindingProperties 
      ? totalConcentration * this.bindingProperties.freeFraction 
      : totalConcentration;
  }
}
/**
 * Tracks the synthesis, release, and reuptake levels of major neurotransmitters.
 * Essential for modeling pharmacological interventions (e.g., SSRIs, L-DOPA) and
 * psychiatric/neurological conditions.
 */
export class NeurotransmitterPool {
  public levels: {
    dopamine: number;
    serotonin: number;
    glutamate: number;
    gaba: number;
  };

  constructor() {
    this.levels = {
      dopamine: 100, // Baseline arbitrary units
      serotonin: 100,
      glutamate: 100,
      gaba: 100
    };
  }

  public synthesize(transmitter: keyof typeof this.levels, amount: number): void {
    this.levels[transmitter] += amount;
  }

  public release(transmitter: keyof typeof this.levels, amount: number): number {
    const released = Math.min(this.levels[transmitter], amount);
    this.levels[transmitter] -= released;
    return released;
  }

  public reuptake(transmitter: keyof typeof this.levels, amount: number): void {
    this.levels[transmitter] += amount * 0.8; // 80% efficiency in reuptake
  }
}

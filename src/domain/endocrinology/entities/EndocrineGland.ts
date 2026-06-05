export enum GlandState {
  ATROPHIED = 'ATROPHIED',
  NORMAL = 'NORMAL',
  HYPERTROPHIED = 'HYPERTROPHIED',
  FIBROTIC = 'FIBROTIC'
}

export interface GlandCapacity {
  maxSecretoryRate: number; // units/hour
  baselineSecretoryRate: number; // units/hour
  responsiveness: number; // sensitivity to stimulating hormones (0.0 to 1.0)
}

export class EndocrineGland {
  constructor(
    public readonly name: string,
    public state: GlandState,
    public capacity: GlandCapacity
  ) {}

  /**
   * Calculates the actual secretion rate based on a stimulating signal (e.g., TSH for Thyroid).
   * @param stimulusIntensity Normalized value from 0 to 1
   */
  public calculateSecretion(stimulusIntensity: number): number {
    const stateMultiplier = this.getStateMultiplier();
    const effectiveRate = this.capacity.baselineSecretoryRate + 
      (this.capacity.maxSecretoryRate - this.capacity.baselineSecretoryRate) * 
      stimulusIntensity * this.capacity.responsiveness * stateMultiplier;
    
    return effectiveRate;
  }

  private getStateMultiplier(): number {
    switch (this.state) {
      case GlandState.ATROPHIED: return 0.3;
      case GlandState.NORMAL: return 1.0;
      case GlandState.HYPERTROPHIED: return 1.5;
      case GlandState.FIBROTIC: return 0.1;
      default: return 1.0;
    }
  }

  public updateState(newState: GlandState): void {
    this.state = newState;
  }
}
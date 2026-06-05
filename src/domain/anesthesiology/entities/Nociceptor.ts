/**
 * Represents a pain-sensing neuron (Nociceptor) in the peripheral nervous system.
 * Models A-delta and C-fiber characteristics, activation thresholds, and sensitization states.
 */
export enum NociceptorType {
  A_DELTA = 'A_DELTA', // Fast, sharp, localized pain
  C_FIBER = 'C_FIBER'  // Slow, dull, poorly localized pain
}

export enum SensitizationState {
  NORMAL = 'NORMAL',
  PERIPHERAL_SENSITIZATION = 'PERIPHERAL_SENSITIZATION', // Hyperalgesia
  CENTRAL_SENSITIZATION = 'CENTRAL_SENSITIZATION'        // Allodynia
}

export class Nociceptor {
  constructor(
    public readonly id: string,
    public readonly type: NociceptorType,
    private baseActivationThreshold: number, // in mV or arbitrary stimulus units
    private currentState: SensitizationState = SensitizationState.NORMAL,
    private inflammatoryMediators: string[] = [] // e.g., Prostaglandins, Bradykinin, Substance P
  ) {}

  public applyStimulus(intensity: number): boolean {
    const currentThreshold = this.calculateCurrentThreshold();
    return intensity >= currentThreshold;
  }

  public exposeToMediators(mediators: string[]): void {
    this.inflammatoryMediators.push(...mediators);
    this.updateSensitizationState();
  }

  private updateSensitizationState(): void {
    if (this.inflammatoryMediators.includes('Substance P') || this.inflammatoryMediators.includes('CGRP')) {
      this.currentState = SensitizationState.CENTRAL_SENSITIZATION;
    } else if (this.inflammatoryMediators.length > 0) {
      this.currentState = SensitizationState.PERIPHERAL_SENSITIZATION;
    }
  }

  private calculateCurrentThreshold(): number {
    switch (this.currentState) {
      case SensitizationState.PERIPHERAL_SENSITIZATION:
        return this.baseActivationThreshold * 0.7; // 30% lower threshold
      case SensitizationState.CENTRAL_SENSITIZATION:
        return this.baseActivationThreshold * 0.4; // 60% lower threshold (Allodynia)
      default:
        return this.baseActivationThreshold;
    }
  }
}

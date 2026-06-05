/**
 * Models the legal and ethical instructions for end-of-life care.
 * This entity is paramount for ensuring goal-concordant care, preventing
 * unwanted medical interventions, and respecting patient autonomy.
 */

export enum CodeStatus {
  FULL_CODE = 'FULL_CODE',
  DNR = 'DO_NOT_RESUSCITATE',
  DNI = 'DO_NOT_INTUBATE',
  DNR_DNI = 'DNR_DNI',
  ALLOW_NATURAL_DEATH = 'ALLOW_NATURAL_DEATH'
}

export interface HealthcareProxy {
  name: string;
  relationship: string;
  contactNumber: string;
  isPrimary: boolean;
}

export class AdvanceDirective {
  private constructor(
    public readonly id: string,
    public readonly patientId: string,
    public codeStatus: CodeStatus,
    public proxies: HealthcareProxy[],
    public artificialNutrition: boolean,
    public artificialHydration: boolean,
    public mechanicalVentilation: boolean,
    public readonly lastUpdated: Date,
    public documentUrl?: string
  ) {}

  public static create(
    id: string,
    patientId: string,
    codeStatus: CodeStatus,
    proxies: HealthcareProxy[]
  ): AdvanceDirective {
    return new AdvanceDirective(
      id,
      patientId,
      codeStatus,
      proxies,
      false, // Default to false in palliative context unless specified
      false,
      false,
      new Date()
    );
  }

  public updateCodeStatus(newStatus: CodeStatus): void {
    this.codeStatus = newStatus;
    // In a real system, this would trigger domain events to notify the care team immediately.
  }

  public addProxy(proxy: HealthcareProxy): void {
    if (proxy.isPrimary) {
      this.proxies.forEach(p => p.isPrimary = false);
    }
    this.proxies.push(proxy);
  }

  public getPrimaryProxy(): HealthcareProxy | undefined {
    return this.proxies.find(p => p.isPrimary) || this.proxies[0];
  }

  /**
   * Evaluates if a proposed intervention conflicts with the directive.
   */
  public isInterventionAllowed(interventionType: 'CPR' | 'INTUBATION' | 'TUBE_FEEDING' | 'IV_FLUIDS'): boolean {
    switch (interventionType) {
      case 'CPR':
        return this.codeStatus === CodeStatus.FULL_CODE || this.codeStatus === CodeStatus.DNI;
      case 'INTUBATION':
        return this.codeStatus === CodeStatus.FULL_CODE || this.codeStatus === CodeStatus.DNR;
      case 'TUBE_FEEDING':
        return this.artificialNutrition;
      case 'IV_FLUIDS':
        return this.artificialHydration;
      default:
        return false;
    }
  }
}

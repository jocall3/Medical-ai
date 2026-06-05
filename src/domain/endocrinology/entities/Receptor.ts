export enum ReceptorType {
  GPCR = 'G-Protein Coupled Receptor',
  Nuclear = 'Nuclear Receptor',
  EnzymeLinked = 'Enzyme Linked Receptor'
}

export class Receptor {
  constructor(
    public readonly targetTissue: string,
    public readonly hormoneType: string,
    public type: ReceptorType,
    public density: number, // Receptors per cell
    public sensitivity: number // Binding affinity/efficacy
  ) {}

  /**
   * Simulates the effect of hormone concentration on receptor activation.
   * Uses a Hill Equation for sigmoidal response.
   */
  public calculateActivation(hormoneConcentration: number, hillCoefficient: number = 1.0): number {
    const kd = 1 / this.sensitivity;
    return (Math.pow(hormoneConcentration, hillCoefficient)) / 
           (Math.pow(kd, hillCoefficient) + Math.pow(hormoneConcentration, hillCoefficient));
  }

  public upregulate(percentage: number): void {
    this.density *= (1 + percentage / 100);
  }

  public downregulate(percentage: number): void {
    this.density *= (1 - percentage / 100);
  }

  public getEffectiveResponse(hormoneConcentration: number): number {
    const activation = this.calculateActivation(hormoneConcentration);
    return activation * this.density;
  }
}
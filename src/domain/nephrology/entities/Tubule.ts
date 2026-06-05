/**
 * Tubule Entity
 * Models the tubular segments of a single nephron (Proximal Tubule, Loop of Henle, Distal Tubule, Collecting Duct).
 * Tracks reabsorption and secretion of key solutes and water, and models tubular cell health.
 */
export type TubuleSegment = 'ProximalConvoluted' | 'LoopOfHenle' | 'DistalConvoluted' | 'CollectingDuct';

export interface SoluteFlux {
  sodium: number;      // mEq/L or relative rate
  potassium: number;   // mEq/L
  chloride: number;    // mEq/L
  bicarbonate: number; // mEq/L
  calcium: number;     // mEq/L
  phosphate: number;   // mg/dL
  glucose: number;     // mg/dL
  urea: number;        // mg/dL
  water: number;       // mL/min (reabsorption rate)
}

export class Tubule {
  private segment: TubuleSegment;
  private tubularHealth: number; // 0.0 (Acute Tubular Necrosis) to 1.0 (Fully functional)
  private glucoseTransportMax: number; // TmG in mg/min, normal ~375 mg/min
  private phosphateTransportMax: number; // TmP in mg/min

  constructor(
    segment: TubuleSegment,
    tubularHealth = 1.0,
    glucoseTransportMax = 375,
    phosphateTransportMax = 4.0
  ) {
    this.segment = segment;
    this.tubularHealth = Math.max(0, Math.min(1, tubularHealth));
    this.glucoseTransportMax = glucoseTransportMax;
    this.phosphateTransportMax = phosphateTransportMax;
  }

  /**
   * Simulates the reabsorption and secretion profile of the specific segment
   * based on the incoming load and tubular health.
   */
  public processFiltrate(incomingLoad: SoluteFlux): { reabsorbed: SoluteFlux; excreted: SoluteFlux } {
    const reabsorbed: SoluteFlux = { sodium: 0, potassium: 0, chloride: 0, bicarbonate: 0, calcium: 0, phosphate: 0, glucose: 0, urea: 0, water: 0 };
    const excreted: SoluteFlux = { sodium: 0, potassium: 0, chloride: 0, bicarbonate: 0, calcium: 0, phosphate: 0, glucose: 0, urea: 0, water: 0 };

    const healthFactor = this.tubularHealth;

    switch (this.segment) {
      case 'ProximalConvoluted':
        reabsorbed.sodium = incomingLoad.sodium * 0.65 * healthFactor;
        reabsorbed.water = incomingLoad.water * 0.65 * healthFactor;
        reabsorbed.chloride = incomingLoad.chloride * 0.65 * healthFactor;
        reabsorbed.bicarbonate = incomingLoad.bicarbonate * 0.90 * healthFactor;
        reabsorbed.potassium = incomingLoad.potassium * 0.65 * healthFactor;
        reabsorbed.calcium = incomingLoad.calcium * 0.65 * healthFactor;
        reabsorbed.glucose = Math.min(incomingLoad.glucose * healthFactor, this.glucoseTransportMax);
        reabsorbed.phosphate = Math.min(incomingLoad.phosphate * 0.80 * healthFactor, this.phosphateTransportMax);
        reabsorbed.urea = incomingLoad.urea * 0.50 * healthFactor;
        break;

      case 'LoopOfHenle':
        reabsorbed.sodium = incomingLoad.sodium * 0.25 * healthFactor;
        reabsorbed.chloride = incomingLoad.chloride * 0.25 * healthFactor;
        reabsorbed.water = incomingLoad.water * 0.15 * healthFactor;
        reabsorbed.potassium = incomingLoad.potassium * 0.20 * healthFactor;
        reabsorbed.calcium = incomingLoad.calcium * 0.25 * healthFactor;
        reabsorbed.bicarbonate = incomingLoad.bicarbonate * 0.05 * healthFactor;
        break;

      case 'DistalConvoluted':
        reabsorbed.sodium = incomingLoad.sodium * 0.05 * healthFactor;
        reabsorbed.chloride = incomingLoad.chloride * 0.05 * healthFactor;
        reabsorbed.water = incomingLoad.water * 0.05 * healthFactor;
        reabsorbed.calcium = incomingLoad.calcium * 0.08 * healthFactor;
        break;

      case 'CollectingDuct':
        reabsorbed.sodium = incomingLoad.sodium * 0.04 * healthFactor;
        reabsorbed.chloride = incomingLoad.chloride * 0.04 * healthFactor;
        reabsorbed.potassium = -incomingLoad.potassium * 0.10 * healthFactor; // Secretion
        reabsorbed.water = incomingLoad.water * 0.10 * healthFactor;
        reabsorbed.urea = incomingLoad.urea * 0.15 * healthFactor;
        break;
    }

    excreted.sodium = Math.max(0, incomingLoad.sodium - reabsorbed.sodium);
    excreted.potassium = Math.max(0, incomingLoad.potassium - reabsorbed.potassium);
    excreted.chloride = Math.max(0, incomingLoad.chloride - reabsorbed.chloride);
    excreted.bicarbonate = Math.max(0, incomingLoad.bicarbonate - reabsorbed.bicarbonate);
    excreted.calcium = Math.max(0, incomingLoad.calcium - reabsorbed.calcium);
    excreted.phosphate = Math.max(0, incomingLoad.phosphate - reabsorbed.phosphate);
    excreted.glucose = Math.max(0, incomingLoad.glucose - reabsorbed.glucose);
    excreted.urea = Math.max(0, incomingLoad.urea - reabsorbed.urea);
    excreted.water = Math.max(0.01, incomingLoad.water - reabsorbed.water);

    return { reabsorbed, excreted };
  }

  public applyIschemicInsult(severity: number): void {
    const sensitivity = this.segment === 'ProximalConvoluted' || this.segment === 'LoopOfHenle' ? 1.5 : 0.5;
    this.tubularHealth = Math.max(0, this.tubularHealth - severity * sensitivity);
  }

  public regenerateCells(recoveryRate: number): void {
    this.tubularHealth = Math.min(1.0, this.tubularHealth + recoveryRate);
  }

  public getSegment(): TubuleSegment {
    return this.segment;
  }

  public getTubularHealth(): number {
    return this.tubularHealth;
  }
}
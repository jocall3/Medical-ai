import { Glomerulus } from './Glomerulus';
import { Tubule, TubuleSegment, SoluteFlux } from './Tubule';

/**
 * Nephron Entity
 * Represents the functional unit of the kidney, orchestrating the glomerulus and the tubular segments.
 * Tracks overall health, ischemic damage index, and oxygenation status.
 */
export class Nephron {
  private id: string;
  private glomerulus: Glomerulus;
  private tubules: Map<TubuleSegment, Tubule>;
  private ischemicDamageIndex: number; // 0.0 (no damage) to 1.0 (complete necrosis)
  private oxygenationStatus: number;   // Partial pressure of O2 or relative oxygenation (0.0 to 1.0)

  constructor(id: string) {
    this.id = id;
    this.glomerulus = new Glomerulus(`${id}-glomerulus`);
    this.tubules = new Map<TubuleSegment, Tubule>([
      ['ProximalConvoluted', new Tubule('ProximalConvoluted')],
      ['LoopOfHenle', new Tubule('LoopOfHenle')],
      ['DistalConvoluted', new Tubule('DistalConvoluted')],
      ['CollectingDuct', new Tubule('CollectingDuct')],
    ]);
    this.ischemicDamageIndex = 0.0;
    this.oxygenationStatus = 1.0;
  }

  /**
   * Simulates a single physiological cycle of filtration and tubular processing
   */
  public processCycle(plasmaConcentrations: SoluteFlux): { filtered: SoluteFlux; excreted: SoluteFlux } {
    const sngfr = this.glomerulus.calculateSNGFR(); // nL/min
    
    const filteredLoad: SoluteFlux = {
      sodium: plasmaConcentrations.sodium * (sngfr / 1000),
      potassium: plasmaConcentrations.potassium * (sngfr / 1000),
      chloride: plasmaConcentrations.chloride * (sngfr / 1000),
      bicarbonate: plasmaConcentrations.bicarbonate * (sngfr / 1000),
      calcium: plasmaConcentrations.calcium * (sngfr / 1000) * 0.60, // Only ionized/free calcium is filtered (~60%)
      phosphate: plasmaConcentrations.phosphate * (sngfr / 1000) * 0.90, // ~90% filtered
      glucose: plasmaConcentrations.glucose * (sngfr / 1000),
      urea: plasmaConcentrations.urea * (sngfr / 1000),
      water: sngfr / 1000,
    };

    let currentLoad = { ...filteredLoad };
    const segments: TubuleSegment[] = ['ProximalConvoluted', 'LoopOfHenle', 'DistalConvoluted', 'CollectingDuct'];
    for (const segment of segments) {
      const tubule = this.tubules.get(segment);
      if (tubule) {
        const result = tubule.processFiltrate(currentLoad);
        currentLoad = result.excreted;
      }
    }

    return {
      filtered: filteredLoad,
      excreted: currentLoad,
    };
  }

  /**
   * Simulates the impact of systemic perfusion pressure on nephron health
   * MAP < 65 mmHg triggers ischemic cascades, damaging podocytes and tubular cells.
   */
  public simulatePerfusion(meanArterialPressure: number, durationMinutes: number): void {
    if (meanArterialPressure < 65) {
      const severity = ((65 - meanArterialPressure) / 65) * (durationMinutes / 60);
      this.oxygenationStatus = Math.max(0.1, this.oxygenationStatus - severity);
      this.ischemicDamageIndex = Math.min(1.0, this.ischemicDamageIndex + severity * 0.5);

      this.glomerulus.applyPodocyteInsult(severity * 0.2);
      for (const tubule of this.tubules.values()) {
        tubule.applyIschemicInsult(severity);
      }
    } else {
      this.oxygenationStatus = Math.min(1.0, this.oxygenationStatus + 0.1);
      this.ischemicDamageIndex = Math.max(0.0, this.ischemicDamageIndex - 0.02);
      
      this.glomerulus.repairPodocytes(0.01);
      for (const tubule of this.tubules.values()) {
        tubule.regenerateCells(0.02);
      }
    }
  }

  public getGlomerulus(): Glomerulus {
    return this.glomerulus;
  }

  public getTubule(segment: TubuleSegment): Tubule | undefined {
    return this.tubules.get(segment);
  }

  public getIschemicDamageIndex(): number {
    return this.ischemicDamageIndex;
  }

  public getOxygenationStatus(): number {
    return this.oxygenationStatus;
  }

  public getId(): string {
    return this.id;
  }
}
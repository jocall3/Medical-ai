/**
 * Models the paralysis of skeletal muscle using Train-of-Four (TOF) monitoring.
 * Guides paralytic dosing and recommends appropriate reversal agents.
 */
export interface TOFReading {
  twitches: number; // 0 to 4
  ratio: number;    // T4/T1 ratio (0.0 to 1.0). Only valid if twitches == 4
  postTetanicCount?: number; // Used when twitches == 0
}

export enum ParalyticAgent {
  ROCURONIUM = 'ROCURONIUM',
  VECURONIUM = 'VECURONIUM',
  CISATRACURIUM = 'CISATRACURIUM',
  SUCCINYLCHOLINE = 'SUCCINYLCHOLINE'
}

export class NeuromuscularBlockadeCalculator {
  /**
   * Evaluates the depth of the neuromuscular blockade.
   */
  public evaluateBlockadeDepth(reading: TOFReading): string {
    if (reading.twitches === 0) {
      if (reading.postTetanicCount !== undefined && reading.postTetanicCount > 0) {
        return 'PROFOUND_BLOCK';
      }
      return 'DEEP_BLOCK';
    }
    if (reading.twitches >= 1 && reading.twitches <= 3) {
      return 'MODERATE_BLOCK';
    }
    if (reading.twitches === 4) {
      if (reading.ratio < 0.9) return 'SHALLOW_BLOCK';
      return 'RECOVERED';
    }
    throw new Error('Invalid TOF reading');
  }

  /**
   * Recommends a reversal strategy based on the current blockade depth and the agent used.
   */
  public recommendReversal(agent: ParalyticAgent, reading: TOFReading, patientWeightKg: number): string {
    const depth = this.evaluateBlockadeDepth(reading);

    if (agent === ParalyticAgent.SUCCINYLCHOLINE) {
      return 'No reversal agent indicated for depolarizing blockers. Wait for plasma cholinesterase metabolism.';
    }

    if (depth === 'RECOVERED') {
      return 'No reversal needed. TOF ratio >= 0.9.';
    }

    // Sugammadex is specific to aminosteroids (Rocuronium, Vecuronium)
    const isAminosteroid = agent === ParalyticAgent.ROCURONIUM || agent === ParalyticAgent.VECURONIUM;

    if (isAminosteroid) {
      if (depth === 'PROFOUND_BLOCK' || depth === 'DEEP_BLOCK') {
        const dose = depth === 'PROFOUND_BLOCK' ? 16 : 4; // mg/kg
        return `Administer Sugammadex ${dose} mg/kg (${dose * patientWeightKg} mg total).`;
      } else if (depth === 'MODERATE_BLOCK' || depth === 'SHALLOW_BLOCK') {
        return `Administer Sugammadex 2 mg/kg (${2 * patientWeightKg} mg total).`;
      }
    }

    // Neostigmine + Glycopyrrolate for benzylisoquinoliniums (Cisatracurium) or if Sugammadex is unavailable
    if (depth === 'PROFOUND_BLOCK' || depth === 'DEEP_BLOCK') {
      return 'Block is too deep for Neostigmine reversal. Wait for spontaneous recovery to at least 1 twitch.';
    }

    return `Administer Neostigmine 0.05 mg/kg (max 5mg) with Glycopyrrolate 0.01 mg/kg.`;
  }
}

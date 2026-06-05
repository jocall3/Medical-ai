/**
 * Analyzes EEG data and pharmacokinetic models to calculate the depth of unconsciousness.
 * Designed to prevent intraoperative awareness and optimize anesthetic delivery.
 */
export interface EEGData {
  timestamp: number;
  spectralEdgeFrequency95: number; // Hz
  burstSuppressionRatio: number;   // Percentage (0-100)
  betaRatio: number;               // Log ratio of beta to alpha/theta power
}

export class AnestheticDepthEngine {
  /**
   * Calculates a proprietary Depth of Anesthesia Index (similar to BIS - Bispectral Index).
   * Scale: 0 (Isoelectric) to 100 (Fully Awake). Target for general anesthesia is typically 40-60.
   */
  public calculateDepthIndex(eeg: EEGData): number {
    // Advanced heuristic combining SEF95, BSR, and Beta Ratio
    let index = 100;

    // High beta ratio indicates wakefulness
    index -= (1 - eeg.betaRatio) * 20;

    // SEF95 drops as anesthesia deepens (awake ~20Hz, anesthetized ~10-14Hz)
    if (eeg.spectralEdgeFrequency95 < 14) {
      index -= (14 - eeg.spectralEdgeFrequency95) * 3;
    }

    // Burst suppression strongly drives the index down towards 0
    if (eeg.burstSuppressionRatio > 0) {
      index = 40 - (eeg.burstSuppressionRatio * 0.4);
    }

    return Math.max(0, Math.min(100, Math.round(index)));
  }

  /**
   * Evaluates the risk of intraoperative awareness based on depth index and MAC fraction.
   */
  public detectAwarenessRisk(depthIndex: number, currentMacFraction: number, neuromuscularBlockadeActive: boolean): string {
    if (depthIndex > 60 && currentMacFraction < 0.7) {
      if (neuromuscularBlockadeActive) {
        return 'CRITICAL RISK: High awareness probability with paralysis. Administer amnesic/hypnotic immediately.';
      }
      return 'HIGH RISK: Patient may be conscious. Deepen anesthesia.';
    }
    
    if (depthIndex < 40 && currentMacFraction > 1.2) {
      return 'OVER-SEDATION: Risk of hemodynamic instability and delayed emergence. Consider reducing anesthetic.';
    }

    return 'OPTIMAL: Patient is at an appropriate depth of anesthesia.';
  }
}

/**
 * Predicts postoperative pain levels using patient-specific variables, surgical invasiveness,
 * and preemptive analgesic interventions.
 */
export interface PatientPainProfile {
  opioidTolerance: number; // 1 (Naive) to 10 (Highly Tolerant)
  anxietyScore: number;    // 1 to 10
  genetics: { cyp2d6Status: 'POOR' | 'NORMAL' | 'ULTRA_RAPID' };
}

export interface SurgicalFactor {
  invasivenessScore: number; // 1 (Minimally invasive) to 10 (Major open surgery)
  expectedInflammation: number; // 1 to 10
}

export interface AnalgesicIntervention {
  type: 'REGIONAL_BLOCK' | 'NSAID' | 'ACETAMINOPHEN' | 'GABAPENTINOID' | 'KETAMINE';
  efficacyDurationHours: number;
  administeredAtHour: number;
}

export class PainTrajectorySimulator {
  /**
   * Simulates the Visual Analog Scale (VAS) pain score (0-10) over a 72-hour postoperative period.
   * @returns An array of VAS scores representing each hour from 0 to 72.
   */
  public predictTrajectory(
    patient: PatientPainProfile,
    surgery: SurgicalFactor,
    interventions: AnalgesicIntervention[]
  ): number[] {
    const trajectory: number[] = [];
    const basePain = (surgery.invasivenessScore * 0.6) + (surgery.expectedInflammation * 0.4);
    const psychologicalMultiplier = 1 + (patient.anxietyScore * 0.05);
    const toleranceMultiplier = 1 + (patient.opioidTolerance * 0.1);

    for (let hour = 0; hour <= 72; hour++) {
      // Natural decay of surgical pain over time (exponential decay)
      let currentPain = basePain * Math.exp(-0.015 * hour) * psychologicalMultiplier * toleranceMultiplier;

      // Apply interventions
      let interventionRelief = 0;
      for (const intervention of interventions) {
        if (hour >= intervention.administeredAtHour && hour < intervention.administeredAtHour + intervention.efficacyDurationHours) {
          switch (intervention.type) {
            case 'REGIONAL_BLOCK': interventionRelief += 4.0; break;
            case 'NSAID': interventionRelief += 1.5; break;
            case 'ACETAMINOPHEN': interventionRelief += 1.0; break;
            case 'GABAPENTINOID': interventionRelief += 1.2; break;
            case 'KETAMINE': interventionRelief += 2.0; break;
          }
        }
      }

      // Calculate final VAS score, bounded between 0 and 10
      let finalVas = currentPain - interventionRelief;
      finalVas = Math.max(0, Math.min(10, finalVas));
      
      trajectory.push(parseFloat(finalVas.toFixed(1)));
    }

    return trajectory;
  }
}

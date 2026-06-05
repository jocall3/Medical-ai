import { Participant } from "../entities/Participant";
import { AdverseEvent, CTCAEGrade } from "../entities/AdverseEvent";

export interface DropoutRiskAssessment {
  participantId: string;
  riskScore: number;
  riskCategory: "Low" | "Medium" | "High";
  topRiskFactors: string[];
}

export class DropoutRiskPredictor {
  public static predictDropoutRisk(
    participant: Participant,
    adverseEvents: AdverseEvent[],
    clinicDistanceKm: number
  ): DropoutRiskAssessment {
    let score = 0.0;
    const topRiskFactors: string[] = [];

    if (participant.adherenceRate < 0.8) {
      score += 0.35;
      topRiskFactors.push(`Low adherence rate (${(participant.adherenceRate * 100).toFixed(1)}%)`);
    } else if (participant.adherenceRate < 0.9) {
      score += 0.15;
      topRiskFactors.push("Sub-optimal adherence rate");
    }

    const participantAEs = adverseEvents.filter(ae => ae.participantId === participant.id);
    const severeAEs = participantAEs.filter(ae => ae.severity >= CTCAEGrade.GRADE_3);
    const moderateAEs = participantAEs.filter(ae => ae.severity === CTCAEGrade.GRADE_2);

    if (severeAEs.length > 0) {
      score += 0.3;
      topRiskFactors.push(`Experienced ${severeAEs.length} severe adverse event(s) (CTCAE Grade >= 3)`);
    } else if (moderateAEs.length >= 2) {
      score += 0.15;
      topRiskFactors.push("Experienced multiple moderate adverse events (CTCAE Grade 2)");
    }

    if (clinicDistanceKm > 100) {
      score += 0.2;
      topRiskFactors.push(`High logistical burden (Distance to clinic: ${clinicDistanceKm} km)`);
    } else if (clinicDistanceKm > 50) {
      score += 0.1;
      topRiskFactors.push(`Moderate logistical burden (Distance to clinic: ${clinicDistanceKm} km)`);
    }

    if (participant.demographics.age > 75) {
      score += 0.1;
      topRiskFactors.push("Advanced age (potential mobility/support challenges)");
    } else if (participant.demographics.age < 21) {
      score += 0.05;
      topRiskFactors.push("Young adult cohort (statistically higher loss-to-follow-up)");
    }

    const finalScore = parseFloat(Math.min(1.0, score).toFixed(2));

    let riskCategory: "Low" | "Medium" | "High" = "Low";
    if (finalScore >= 0.6) {
      riskCategory = "High";
    } else if (finalScore >= 0.3) {
      riskCategory = "Medium";
    }

    return {
      participantId: participant.id,
      riskScore: finalScore,
      riskCategory,
      topRiskFactors
    };
  }
}
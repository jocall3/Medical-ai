import { TrialProtocol } from "../entities/TrialProtocol";

export interface EHRRecord {
  patientId: string;
  demographics: {
    age: number;
    sex: "M" | "F" | "O";
    ethnicity: string;
    weightKg: number;
    heightCm: number;
  };
  diagnoses: string[];
  labResults: Record<string, number>;
  medications: string[];
  genomics?: Record<string, any>;
}

export interface SelectionResult {
  patientId: string;
  eligible: boolean;
  matchScore: number;
  failedCriteria: string[];
  recommendation: "ENROLL" | "CONSIDER" | "EXCLUDE";
}

export class CohortSelectionEngine {
  public static scanEHRRecords(records: EHRRecord[], protocol: TrialProtocol): SelectionResult[] {
    return records.map(record => {
      const flatData: Record<string, any> = {
        age: record.demographics.age,
        sex: record.demographics.sex,
        weightKg: record.demographics.weightKg,
        heightCm: record.demographics.heightCm,
        ...record.labResults,
        diagnoses: record.diagnoses,
        medications: record.medications,
        ...record.genomics
      };

      const evaluation = protocol.validateEligibility(flatData);
      const totalCriteria = protocol.inclusionCriteria.length + protocol.exclusionCriteria.length;
      const passedCount = totalCriteria - evaluation.failedCriteria.length;
      const matchScore = totalCriteria > 0 ? passedCount / totalCriteria : 1.0;

      let recommendation: "ENROLL" | "CONSIDER" | "EXCLUDE" = "EXCLUDE";
      if (evaluation.eligible) {
        recommendation = "ENROLL";
      } else if (matchScore >= 0.75) {
        recommendation = "CONSIDER";
      }

      return {
        patientId: record.patientId,
        eligible: evaluation.eligible,
        matchScore,
        failedCriteria: evaluation.failedCriteria,
        recommendation
      };
    });
  }
}
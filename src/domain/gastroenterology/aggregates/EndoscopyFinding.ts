export type ProcedureType = 'COLONOSCOPY' | 'EGD';
export type FindingType = 'POLYP' | 'ULCER' | 'INFLAMMATION' | 'BARRETTS_ESOPHAGUS' | 'NORMAL';

export interface BiopsyHistology {
  isDysplastic: boolean;
  isMalignant: boolean;
  description: string;
}

export interface FindingDetail {
  location: string;
  type: FindingType;
  sizeMm?: number;
  biopsyTaken: boolean;
  histology?: BiopsyHistology;
}

export class EndoscopyFinding {
  constructor(
    public readonly procedureId: string,
    public readonly patientId: string,
    public readonly procedureType: ProcedureType,
    public readonly findings: FindingDetail[],
    public readonly bostonBowelPreparationScore?: number, // 0 to 9
    public readonly complications: string[] = [],
    public readonly procedureDate: Date = new Date()
  ) {
    if (procedureType === 'COLONOSCOPY' && bostonBowelPreparationScore !== undefined) {
      if (bostonBowelPreparationScore < 0 || bostonBowelPreparationScore > 9) {
        throw new Error("Boston Bowel Preparation Score must be between 0 and 9.");
      }
    }
  }

  /**
   * Calculates the risk score for colorectal cancer (CRC) or esophageal adenocarcinoma.
   */
  public calculateCancerRiskScore(): {
    riskScore: number;
    riskCategory: 'Low' | 'Moderate' | 'High' | 'Critical';
  } {
    let score = 0.0;

    for (const finding of this.findings) {
      if (finding.type === 'POLYP') {
        const size = finding.sizeMm || 0;
        if (size >= 10) {
          score += 0.4;
        } else {
          score += 0.1;
        }

        if (finding.histology?.isDysplastic) {
          score += 0.3;
        }
        if (finding.histology?.isMalignant) {
          score = 1.0;
        }
      }

      if (finding.type === 'BARRETTS_ESOPHAGUS') {
        score += 0.3;
        if (finding.histology?.isDysplastic) {
          score += 0.4;
        }
      }

      if (finding.type === 'ULCER' && finding.histology?.isMalignant) {
        score = 1.0;
      }
    }

    const finalScore = Math.min(1.0, score);
    let riskCategory: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    if (finalScore >= 0.8) riskCategory = 'Critical';
    else if (finalScore >= 0.5) riskCategory = 'High';
    else if (finalScore >= 0.2) riskCategory = 'Moderate';

    return {
      riskScore: finalScore,
      riskCategory
    };
  }

  /**
   * Recommends the surveillance interval in years based on USMSTF guidelines.
   */
  public requiresSurveillanceIntervalYears(): number {
    if (this.procedureType === 'EGD') {
      const hasBarretts = this.findings.some(f => f.type === 'BARRETTS_ESOPHAGUS');
      const hasDysplasia = this.findings.some(f => f.type === 'BARRETTS_ESOPHAGUS' && f.histology?.isDysplastic);
      
      if (hasDysplasia) return 1;
      if (hasBarretts) return 3;
      return 10;
    }

    if (this.bostonBowelPreparationScore !== undefined && this.bostonBowelPreparationScore < 6) {
      return 1;
    }

    const polyps = this.findings.filter(f => f.type === 'POLYP');
    if (polyps.length === 0) {
      return 10;
    }

    const hasLargePolyp = polyps.some(p => (p.sizeMm || 0) >= 10);
    const hasDysplasticPolyp = polyps.some(p => p.histology?.isDysplastic);
    const polypCount = polyps.length;

    if (polypCount >= 10) return 1;
    if (polypCount >= 5 || hasLargePolyp || hasDysplasticPolyp) return 3;
    if (polypCount >= 3) return 5;
    
    return 7;
  }
}
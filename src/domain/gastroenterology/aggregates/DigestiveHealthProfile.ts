import { GutMicrobe } from '../entities/GutMicrobe';
import { IntestinalVilli } from '../entities/IntestinalVilli';
import { GastricAcid } from '../entities/GastricAcid';
import { MicrobiomeDiversityCalculator } from '../logic/MicrobiomeDiversityCalculator';

export interface LiverStatus {
  inr: number;
  albuminGdl: number;
  totalBilirubinMgDl: number;
}

export class DigestiveHealthProfile {
  constructor(
    public readonly patientId: string,
    public readonly microbes: GutMicrobe[],
    public readonly villi: IntestinalVilli[],
    public readonly gastricAcid: GastricAcid,
    public liverStatus: LiverStatus,
    public lastUpdated: Date = new Date()
  ) {}

  /**
   * Calculates a comprehensive Digestive Health Score (0 to 100).
   * Integrates microbiome diversity, mucosal/villi structural integrity, gastric acid function, and liver synthetic capacity.
   */
  public assessOverallDigestiveHealthScore(): number {
    let score = 100;

    const dysbiosisResult = MicrobiomeDiversityCalculator.evaluateDysbiosisIndex(this.microbes);
    score -= (dysbiosisResult.dysbiosisScore * 25);

    let totalVilliAtrophyPenalty = 0;
    for (const villus of this.villi) {
      const severity = villus.assessAtrophySeverity();
      if (severity === 'Severe') totalVilliAtrophyPenalty += 12.5;
      else if (severity === 'Moderate') totalVilliAtrophyPenalty += 8.0;
      else if (severity === 'Mild') totalVilliAtrophyPenalty += 4.0;
    }
    score -= Math.min(25, totalVilliAtrophyPenalty);

    if (this.gastricAcid.pH > 4.5) {
      score -= 15;
    } else if (this.gastricAcid.pH > 3.5) {
      score -= 8;
    } else if (this.gastricAcid.pH < 1.2 && this.gastricAcid.volumeMl > 150) {
      score -= 10;
    }

    if (this.liverStatus.inr > 1.5) score -= 15;
    else if (this.liverStatus.inr > 1.2) score -= 7;

    if (this.liverStatus.albuminGdl < 3.0) score -= 10;
    else if (this.liverStatus.albuminGdl < 3.5) score -= 5;

    return Math.max(0, Math.round(score));
  }

  /**
   * Evaluates the risk of malabsorption based on villous atrophy and gastric acid pH.
   */
  public getMalabsorptionRisk(): 'Low' | 'Moderate' | 'High' {
    let riskPoints = 0;

    for (const villus of this.villi) {
      const severity = villus.assessAtrophySeverity();
      if (severity === 'Severe') riskPoints += 3;
      else if (severity === 'Moderate') riskPoints += 2;
      else if (severity === 'Mild') riskPoints += 1;
    }

    if (this.gastricAcid.pH > 4.0) {
      riskPoints += 1.5;
    }

    if (riskPoints >= 3.0) return 'High';
    if (riskPoints >= 1.5) return 'Moderate';
    return 'Low';
  }

  /**
   * Generates a comprehensive clinical report of the patient's digestive health.
   */
  public generateComprehensiveReport(): {
    patientId: string;
    overallScore: number;
    dysbiosisStatus: string;
    malabsorptionRisk: 'Low' | 'Moderate' | 'High';
    recommendations: string[];
  } {
    const overallScore = this.assessOverallDigestiveHealthScore();
    const dysbiosis = MicrobiomeDiversityCalculator.evaluateDysbiosisIndex(this.microbes);
    const malabsorption = this.getMalabsorptionRisk();
    const recommendations: string[] = [];

    if (dysbiosis.classification !== 'Healthy') {
      recommendations.push("Consider prebiotic fiber supplementation and targeted probiotics to restore Shannon diversity.");
    }
    if (malabsorption === 'High') {
      recommendations.push("Initiate screening for Celiac disease (anti-tTG IgA) and evaluate for fat-soluble vitamin deficiencies (A, D, E, K).");
    }
    if (this.gastricAcid.pH > 4.5) {
      recommendations.push("Review PPI usage; long-term acid suppression may lead to SIBO and micronutrient malabsorption.");
    }
    if (this.liverStatus.inr > 1.3) {
      recommendations.push("Impaired hepatic synthetic function detected. Monitor coagulation profile and assess for portal hypertension.");
    }

    return {
      patientId: this.patientId,
      overallScore,
      dysbiosisStatus: `${dysbiosis.classification} (Score: ${dysbiosis.dysbiosisScore.toFixed(2)}, F/B Ratio: ${dysbiosis.fbRatio.toFixed(2)})`,
      malabsorptionRisk: malabsorption,
      recommendations
    };
  }
}
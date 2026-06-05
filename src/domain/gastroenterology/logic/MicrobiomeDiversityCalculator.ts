import { GutMicrobe } from '../entities/GutMicrobe';

export class MicrobiomeDiversityCalculator {
  /**
   * Calculates the Shannon Diversity Index (H').
   * Measures both species richness and evenness.
   * H' = -sum(p_i * ln(p_i))
   */
  public static calculateShannonIndex(microbes: GutMicrobe[]): number {
    const totalAbundance = microbes.reduce((sum, m) => sum + m.abundancePercentage, 0);
    if (totalAbundance === 0) return 0;

    let shannon = 0;
    for (const microbe of microbes) {
      const p = microbe.abundancePercentage / totalAbundance;
      if (p > 0) {
        shannon -= p * Math.log(p);
      }
    }
    return shannon;
  }

  /**
   * Calculates the Simpson Diversity Index (D).
   * Measures the probability that two individuals randomly selected from a sample will belong to the same species.
   * D = sum(p_i^2). We return 1 - D (Gini-Simpson Index) for intuitive scaling (higher = more diverse).
   */
  public static calculateSimpsonIndex(microbes: GutMicrobe[]): number {
    const totalAbundance = microbes.reduce((sum, m) => sum + m.abundancePercentage, 0);
    if (totalAbundance === 0) return 0;

    let sumSq = 0;
    for (const microbe of microbes) {
      const p = microbe.abundancePercentage / totalAbundance;
      sumSq += p * p;
    }
    return 1 - sumSq;
  }

  /**
   * Calculates the Chao1 Richness Estimator.
   * Estimates total species richness including rare undetected species.
   * Chao1 = S_obs + (F1^2 / (2 * F2))
   */
  public static calculateChao1(observedSpecies: number, singletons: number, doubletons: number): number {
    if (doubletons === 0) {
      return observedSpecies + (singletons * (singletons - 1)) / 2;
    }
    return observedSpecies + (Math.pow(singletons, 2) / (2 * doubletons));
  }

  /**
   * Calculates the Bray-Curtis Dissimilarity between two microbiome profiles.
   * BC = 1 - (2 * C_ij) / (S_i + S_j)
   */
  public static calculateBrayCurtis(profileA: GutMicrobe[], profileB: GutMicrobe[]): number {
    const mapA = new Map(profileA.map(m => [m.strainId, m.abundancePercentage]));
    const mapB = new Map(profileB.map(m => [m.strainId, m.abundancePercentage]));

    const allStrainIds = new Set([...mapA.keys(), ...mapB.keys()]);

    let sumDifference = 0;
    let sumTotal = 0;

    for (const id of allStrainIds) {
      const abA = mapA.get(id) || 0;
      const abB = mapB.get(id) || 0;
      sumDifference += Math.abs(abA - abB);
      sumTotal += abA + abB;
    }

    return sumTotal === 0 ? 0 : sumDifference / sumTotal;
  }

  /**
   * Evaluates the Dysbiosis Index based on diversity metrics and the Firmicutes-to-Bacteroidetes (F/B) ratio.
   * An altered F/B ratio is a classic hallmark of obesity, IBD, and metabolic syndrome.
   */
  public static evaluateDysbiosisIndex(microbes: GutMicrobe[]): {
    dysbiosisScore: number;
    fbRatio: number;
    classification: 'Healthy' | 'Mild Dysbiosis' | 'Severe Dysbiosis';
  } {
    const shannon = this.calculateShannonIndex(microbes);
    
    let firmicutesAbundance = 0;
    let bacteroidetesAbundance = 0;

    for (const microbe of microbes) {
      if (microbe.phylum === 'Firmicutes') {
        firmicutesAbundance += microbe.abundancePercentage;
      } else if (microbe.phylum === 'Bacteroidetes') {
        bacteroidetesAbundance += microbe.abundancePercentage;
      }
    }

    const fbRatio = bacteroidetesAbundance === 0 ? 0 : firmicutesAbundance / bacteroidetesAbundance;
    let score = 0;

    if (shannon < 1.5) score += 0.5;
    else if (shannon < 2.5) score += 0.25;

    if (fbRatio > 5.0 || fbRatio < 0.2) {
      score += 0.3;
    } else if (fbRatio > 3.0 || fbRatio < 0.5) {
      score += 0.15;
    }

    const proteo = microbes.find(m => m.phylum === 'Proteobacteria');
    if (proteo && proteo.abundancePercentage > 15) {
      score += 0.2;
    }

    const finalScore = Math.min(1.0, score);
    let classification: 'Healthy' | 'Mild Dysbiosis' | 'Severe Dysbiosis' = 'Healthy';
    if (finalScore > 0.6) classification = 'Severe Dysbiosis';
    else if (finalScore > 0.2) classification = 'Mild Dysbiosis';

    return {
      dysbiosisScore: finalScore,
      fbRatio,
      classification
    };
  }
}
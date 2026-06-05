/**
 * @module VariantPathogenicityCalculator
 * @description AI logic engine utilizing evolutionary conservation scores (e.g., PhyloP)
 * and structural protein predictions to calculate the pathogenic probability of novel variants.
 */

import { GeneVariant, VariantType } from '../entities/GeneVariant';

export interface PathogenicityScore {
    probability: number;
    classification: string;
    confidenceInterval: [number, number];
    contributingFactors: Record<string, number>;
}

export class VariantPathogenicityCalculator {
    /**
     * Calculates the probability that a given variant is pathogenic.
     * This is a simplified representation of a complex ensemble machine learning model.
     * 
     * @param variant The genetic variant to analyze.
     * @param phyloPScore Evolutionary conservation score (higher means more conserved).
     * @param structuralImpactScore AI-predicted impact on protein folding (0.0 to 1.0).
     * @param alleleFrequency Population frequency of the variant.
     * @returns {PathogenicityScore} The calculated pathogenicity metrics.
     */
    public calculatePathogenicity(
        variant: GeneVariant,
        phyloPScore: number,
        structuralImpactScore: number,
        alleleFrequency: number
    ): PathogenicityScore {
        let riskScore = 0;
        const factors: Record<string, number> = {};

        // 1. Evolutionary Conservation (PhyloP typically ranges from -14 to +6)
        // Highly conserved regions are less tolerant to mutation.
        const conservationRisk = Math.max(0, (phyloPScore / 6) * 0.4);
        riskScore += conservationRisk;
        factors['conservation'] = conservationRisk;

        // 2. Structural Impact (e.g., AlphaFold delta)
        const structuralRisk = structuralImpactScore * 0.35;
        riskScore += structuralRisk;
        factors['structuralImpact'] = structuralRisk;

        // 3. Allele Frequency (Common variants are less likely to be highly pathogenic)
        // Rare variants (< 1%) get a higher risk weight.
        const frequencyRisk = alleleFrequency < 0.01 ? 0.15 : (alleleFrequency < 0.05 ? 0.05 : 0);
        riskScore += frequencyRisk;
        factors['alleleFrequency'] = frequencyRisk;

        // 4. Variant Type intrinsic risk
        let typeRisk = 0;
        if (variant.variantType === VariantType.INDEL && variant.getAlterationLength() % 3 !== 0) {
            typeRisk = 0.1; // Frameshift penalty
        } else if (variant.variantType === VariantType.CNV) {
            typeRisk = 0.08;
        }
        riskScore += typeRisk;
        factors['variantType'] = typeRisk;

        // Normalize probability to [0, 1]
        const probability = Math.min(1.0, Math.max(0.0, riskScore));

        return {
            probability,
            classification: this.classifyProbability(probability),
            confidenceInterval: [Math.max(0, probability - 0.05), Math.min(1, probability + 0.05)],
            contributingFactors: factors
        };
    }

    private classifyProbability(prob: number): string {
        if (prob >= 0.90) return 'Highly Pathogenic';
        if (prob >= 0.70) return 'Likely Pathogenic';
        if (prob >= 0.30) return 'Variant of Uncertain Significance';
        if (prob >= 0.10) return 'Likely Benign';
        return 'Benign';
    }
}

/**
 * @module MethylationStateAnalyzer
 * @description Epigenetic logic for analyzing CpG island methylation patterns.
 * Predicts gene silencing probabilities and calculates biological aging (epigenetic clocks).
 */

import { DNASequence } from '../entities/DNASequence';

export interface CpGIsland {
    startIndex: number;
    endIndex: number;
    cgPercentage: number;
    observedExpectedRatio: number;
    methylationLevel: number; // 0.0 (unmethylated) to 1.0 (fully methylated)
}

export class MethylationStateAnalyzer {
    /**
     * Identifies CpG islands in a sequence and maps provided methylation data to them.
     * 
     * @param dna The promoter or genomic DNA sequence.
     * @param methylationData Array of methylation beta values corresponding to CG dinucleotides.
     * @returns {CpGIsland[]} Array of analyzed CpG islands.
     */
    public analyzeCpGIslands(dna: DNASequence, methylationData: number[]): CpGIsland[] {
        const seq = dna.getSequence();
        const islands: CpGIsland[] = [];
        const windowSize = 200;
        
        // Simplified sliding window approach for CpG island detection
        // Criteria: >200bp, GC content > 50%, Obs/Exp CpG ratio > 0.6
        for (let i = 0; i <= seq.length - windowSize; i += 50) {
            const window = seq.substring(i, i + windowSize);
            const cCount = (window.match(/C/g) || []).length;
            const gCount = (window.match(/G/g) || []).length;
            const cgCount = (window.match(/CG/g) || []).length;
            
            const gcContent = (cCount + gCount) / windowSize;
            const expectedCG = (cCount * gCount) / windowSize;
            const obsExpRatio = expectedCG === 0 ? 0 : cgCount / expectedCG;

            if (gcContent > 0.5 && obsExpRatio > 0.6) {
                // Map methylation data (mock mapping for demonstration)
                const avgMethylation = methylationData.length > 0 
                    ? methylationData.reduce((a, b) => a + b, 0) / methylationData.length 
                    : 0;

                islands.push({
                    startIndex: i,
                    endIndex: i + windowSize,
                    cgPercentage: gcContent * 100,
                    observedExpectedRatio: obsExpRatio,
                    methylationLevel: avgMethylation
                });
            }
        }
        return islands;
    }

    /**
     * Predicts the probability of gene silencing based on promoter methylation.
     * Hypermethylation of promoter CpG islands typically represses transcription.
     */
    public predictGeneSilencing(promoterIslands: CpGIsland[]): number {
        if (promoterIslands.length === 0) return 0.1; // Baseline risk
        
        const maxMethylation = Math.max(...promoterIslands.map(i => i.methylationLevel));
        // Sigmoid function to model silencing probability
        const k = 10; // Steepness
        const x0 = 0.6; // Midpoint (60% methylation)
        return 1 / (1 + Math.exp(-k * (maxMethylation - x0)));
    }

    /**
     * Calculates biological age using a simplified Horvath-style epigenetic clock model.
     * 
     * @param clockCpGs Methylation levels of specific clock-associated CpG sites.
     * @returns {number} Estimated biological age in years.
     */
    public predictBiologicalAge(clockCpGs: number[]): number {
        // In reality, this is a penalized regression model (Elastic Net) over 353+ CpGs.
        // Simplified linear combination for demonstration.
        const intercept = 0.7;
        const weights = clockCpGs.map((_, i) => (i % 2 === 0 ? 45.5 : -30.2)); // Alternating positive/negative weights
        
        let ageScore = intercept;
        for (let i = 0; i < clockCpGs.length; i++) {
            ageScore += clockCpGs[i] * weights[i];
        }
        
        // Inverse Horvath transformation (simplified)
        const age = ageScore < 0 ? (1 + 20 * Math.exp(ageScore)) : (21 + ageScore * 20);
        return Math.max(0, age);
    }
}

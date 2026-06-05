/**
 * @module CRISPRTargetingEngine
 * @description Algorithm for identifying optimal sgRNA target sites, calculating
 * off-target probabilities, and simulating Cas9 cleavage efficiency.
 */

import { DNASequence } from '../entities/DNASequence';

export interface SgRNATarget {
    sequence: string;
    pam: string;
    position: number;
    strand: '+' | '-';
    onTargetScore: number; // 0 to 100
    offTargetRisk: number; // 0 to 100
}

export class CRISPRTargetingEngine {
    /**
     * Finds potential sgRNA targets in a given DNA sequence based on a PAM motif.
     * Default PAM is 'NGG' for SpCas9.
     * 
     * @param dna The target DNA sequence.
     * @param pamRegex Regular expression for the Protospacer Adjacent Motif.
     * @param spacerLength Length of the guide RNA spacer (usually 20).
     * @returns {SgRNATarget[]} Array of potential targets.
     */
    public findSgRNATargets(
        dna: DNASequence,
        pamRegex: RegExp = /(?=(?<spacer>[ACGT]{20})(?<pam>[ACGT]GG))/gi,
        spacerLength: number = 20
    ): SgRNATarget[] {
        const targets: SgRNATarget[] = [];
        const seq = dna.getSequence();
        
        // Search positive strand
        let match;
        while ((match = pamRegex.exec(seq)) !== null) {
            if (match.groups) {
                targets.push({
                    sequence: match.groups.spacer,
                    pam: match.groups.pam,
                    position: match.index,
                    strand: '+',
                    onTargetScore: this.calculateOnTargetEfficiency(match.groups.spacer),
                    offTargetRisk: this.estimateOffTargetRisk(match.groups.spacer)
                });
            }
            // Advance index manually to allow overlapping matches in lookaheads
            pamRegex.lastIndex = match.index + 1;
        }

        // Search negative strand (reverse complement)
        const revCompSeq = dna.reverseComplement().getSequence();
        pamRegex.lastIndex = 0;
        while ((match = pamRegex.exec(revCompSeq)) !== null) {
            if (match.groups) {
                targets.push({
                    sequence: match.groups.spacer,
                    pam: match.groups.pam,
                    position: seq.length - match.index - spacerLength - match.groups.pam.length,
                    strand: '-',
                    onTargetScore: this.calculateOnTargetEfficiency(match.groups.spacer),
                    offTargetRisk: this.estimateOffTargetRisk(match.groups.spacer)
                });
            }
            pamRegex.lastIndex = match.index + 1;
        }

        return targets.sort((a, b) => b.onTargetScore - a.onTargetScore);
    }

    /**
     * Calculates a heuristic on-target efficiency score (e.g., Doench/Root rules).
     * Simplified for demonstration.
     */
    private calculateOnTargetEfficiency(spacer: string): number {
        let score = 50;
        // Preference for G at position 20 (adjacent to PAM)
        if (spacer[19] === 'G') score += 15;
        // Penalty for U/T rich regions (premature termination in Pol III promoters)
        if ((spacer.match(/T/g) || []).length > 4) score -= 20;
        // GC content preference (40-60% is ideal)
        const gc = (spacer.match(/[GC]/g) || []).length / spacer.length;
        if (gc >= 0.4 && gc <= 0.6) score += 20;
        else score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Estimates off-target risk based on sequence uniqueness and seed region complexity.
     */
    private estimateOffTargetRisk(spacer: string): number {
        // In a real system, this would query a whole-genome index (e.g., Bowtie/BWA)
        // Here we use a dummy heuristic based on sequence complexity.
        const uniqueChars = new Set(spacer.split('')).size;
        let risk = 100 - (uniqueChars * 20); // Low complexity = high risk
        return Math.max(0, Math.min(100, risk));
    }
}

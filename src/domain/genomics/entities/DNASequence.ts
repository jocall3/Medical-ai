/**
 * @module DNASequence
 * @description Represents a core nucleotide sequence in the genomic domain.
 * This entity encapsulates the fundamental operations of molecular biology,
 * serving as the foundational data structure for downstream genomic analysis.
 */

import { RNASequence } from './RNASequence';

export class DNASequence {
    private readonly sequence: string;

    constructor(sequence: string) {
        this.validateSequence(sequence);
        this.sequence = sequence.toUpperCase();
    }

    /**
     * Validates that the sequence contains only standard DNA nucleotides.
     */
    private validateSequence(seq: string): void {
        if (!/^[ACGTN]+$/i.test(seq)) {
            throw new Error('Invalid DNA sequence. Must contain only A, C, G, T, or N.');
        }
    }

    public getSequence(): string {
        return this.sequence;
    }

    /**
     * Calculates the GC-content of the DNA sequence.
     * GC-content is crucial for determining the melting temperature of DNA
     * and identifying genomic features like CpG islands and promoter regions.
     * 
     * @returns {number} The percentage of G and C nucleotides.
     */
    public calculateGCContent(): number {
        const gcCount = (this.sequence.match(/[GC]/g) || []).length;
        return (gcCount / this.sequence.length) * 100;
    }

    /**
     * Transcribes the DNA sequence into an RNA sequence.
     * In biology, transcription reads the template strand to produce an mRNA
     * sequence where Thymine (T) is replaced by Uracil (U).
     * 
     * @returns {RNASequence} The resulting transcribed RNA sequence.
     */
    public transcribe(): RNASequence {
        const rnaSeq = this.sequence.replace(/T/g, 'U');
        return new RNASequence(rnaSeq);
    }

    /**
     * Generates the reverse complement of the DNA sequence.
     * Essential for primer design, CRISPR targeting, and understanding
     * double-stranded DNA interactions.
     * 
     * @returns {DNASequence} A new DNASequence representing the reverse complement.
     */
    public reverseComplement(): DNASequence {
        const complementMap: { [key: string]: string } = {
            'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N'
        };
        const revComp = this.sequence
            .split('')
            .reverse()
            .map(nucleotide => complementMap[nucleotide])
            .join('');
        return new DNASequence(revComp);
    }
}

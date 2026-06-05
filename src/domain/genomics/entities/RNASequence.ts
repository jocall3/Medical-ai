/**
 * @module RNASequence
 * @description Entity representing messenger RNA (mRNA) and transfer RNA (tRNA).
 * Handles complex post-transcriptional modifications like splicing and the
 * translation of nucleotide codons into amino acid sequences (proteins).
 */

export class RNASequence {
    private sequence: string;

    constructor(sequence: string) {
        this.validateSequence(sequence);
        this.sequence = sequence.toUpperCase();
    }

    private validateSequence(seq: string): void {
        if (!/^[ACGUN]+$/i.test(seq)) {
            throw new Error('Invalid RNA sequence. Must contain only A, C, G, U, or N.');
        }
    }

    public getSequence(): string {
        return this.sequence;
    }

    /**
     * Simulates RNA splicing by removing intronic regions and concatenating exons.
     * 
     * @param introns Array of [start, end] indices representing introns to remove.
     * @returns {RNASequence} A new mature RNASequence.
     */
    public splice(introns: Array<[number, number]>): RNASequence {
        // Sort introns by start index descending to avoid index shifting during removal
        const sortedIntrons = [...introns].sort((a, b) => b[0] - a[0]);
        let splicedSeq = this.sequence;

        for (const [start, end] of sortedIntrons) {
            if (start < 0 || end > splicedSeq.length || start >= end) {
                throw new Error(`Invalid intron boundaries: [${start}, ${end}]`);
            }
            splicedSeq = splicedSeq.slice(0, start) + splicedSeq.slice(end);
        }

        return new RNASequence(splicedSeq);
    }

    /**
     * Translates the RNA sequence into an amino acid sequence (protein) using
     * the standard genetic code. Stops at the first stop codon.
     * 
     * @returns {string} The resulting amino acid sequence.
     */
    public translate(): string {
        const codonTable: { [key: string]: string } = {
            'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
            'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
            'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M', // Start
            'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
            'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
            'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
            'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
            'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
            'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*', // Stop
            'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
            'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
            'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
            'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W', // Stop
            'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
            'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
            'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
        };

        let protein = '';
        // Find start codon
        const startIndex = this.sequence.indexOf('AUG');
        if (startIndex === -1) return ''; // No start codon found

        for (let i = startIndex; i < this.sequence.length - 2; i += 3) {
            const codon = this.sequence.substring(i, i + 3);
            const aminoAcid = codonTable[codon] || 'X'; // X for unknown/N
            if (aminoAcid === '*') break; // Stop codon
            protein += aminoAcid;
        }

        return protein;
    }
}

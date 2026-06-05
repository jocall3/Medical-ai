/**
 * @module GeneVariant
 * @description Represents a specific genetic mutation or structural variation.
 * Maps to standard bioinformatics ontologies like dbSNP and ClinVar to provide
 * clinical context to raw genomic alterations.
 */

export enum VariantType {
    SNP = 'Single Nucleotide Polymorphism',
    INDEL = 'Insertion/Deletion',
    CNV = 'Copy Number Variation',
    SV = 'Structural Variant'
}

export enum ClinVarSignificance {
    PATHOGENIC = 'Pathogenic',
    LIKELY_PATHOGENIC = 'Likely Pathogenic',
    UNCERTAIN_SIGNIFICANCE = 'Variant of Uncertain Significance (VUS)',
    LIKELY_BENIGN = 'Likely Benign',
    BENIGN = 'Benign',
    NOT_PROVIDED = 'Not Provided'
}

export class GeneVariant {
    constructor(
        public readonly id: string,
        public readonly chromosome: string,
        public readonly position: number,
        public readonly referenceAllele: string,
        public readonly alternateAllele: string,
        public readonly variantType: VariantType,
        public readonly dbSnpId?: string,
        public readonly clinVarSignificance: ClinVarSignificance = ClinVarSignificance.NOT_PROVIDED,
        public readonly alleleFrequency?: number
    ) {}

    /**
     * Determines if the variant is considered clinically actionable based on
     * its ClinVar classification.
     */
    public isActionable(): boolean {
        return this.clinVarSignificance === ClinVarSignificance.PATHOGENIC ||
               this.clinVarSignificance === ClinVarSignificance.LIKELY_PATHOGENIC;
    }

    /**
     * Calculates the length of the alteration. Useful for INDELs and CNVs.
     */
    public getAlterationLength(): number {
        return Math.abs(this.alternateAllele.length - this.referenceAllele.length);
    }

    /**
     * Returns a standard HGVS-like genomic coordinate string.
     */
    public toGenomicCoordinate(): string {
        return `chr${this.chromosome}:g.${this.position}${this.referenceAllele}>${this.alternateAllele}`;
    }
}

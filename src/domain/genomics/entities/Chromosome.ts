/**
 * @module Chromosome
 * @description Entity modeling macroscopic chromosomal structures.
 * Handles telomere regions, centromere locations, and provides the foundation
 * for karyotype analysis and large-scale structural variant detection.
 */

export class Chromosome {
    constructor(
        public readonly name: string, // e.g., '1', '22', 'X', 'Y'
        public readonly lengthBasePairs: number,
        public readonly centromerePosition: number,
        public readonly pArmLength: number,
        public readonly qArmLength: number,
        private telomereLength5Prime: number,
        private telomereLength3Prime: number
    ) {
        if (pArmLength + qArmLength !== lengthBasePairs) {
            throw new Error('Sum of p and q arms must equal total chromosome length.');
        }
    }

    /**
     * Retrieves the current estimated length of the 5' telomere.
     */
    public get5PrimeTelomereLength(): number {
        return this.telomereLength5Prime;
    }

    /**
     * Retrieves the current estimated length of the 3' telomere.
     */
    public get3PrimeTelomereLength(): number {
        return this.telomereLength3Prime;
    }

    /**
     * Simulates telomeric attrition due to cellular division (end-replication problem).
     * 
     * @param basePairsLost The number of base pairs lost in this division cycle.
     */
    public degradeTelomeres(basePairsLost: number): void {
        this.telomereLength5Prime = Math.max(0, this.telomereLength5Prime - basePairsLost);
        this.telomereLength3Prime = Math.max(0, this.telomereLength3Prime - basePairsLost);
    }

    /**
     * Determines if the chromosome has reached a critical telomere length,
     * triggering cellular senescence (Hayflick limit).
     * 
     * @param criticalThreshold The length in base pairs considered critical (e.g., 4000).
     */
    public isCriticallyShort(criticalThreshold: number = 4000): boolean {
        return this.telomereLength5Prime <= criticalThreshold || 
               this.telomereLength3Prime <= criticalThreshold;
    }

    /**
     * Classifies the chromosome based on centromere position.
     */
    public getMorphology(): string {
        const ratio = this.qArmLength / this.pArmLength;
        if (ratio >= 1.0 && ratio < 1.7) return 'Metacentric';
        if (ratio >= 1.7 && ratio < 3.0) return 'Submetacentric';
        if (ratio >= 3.0 && ratio < 7.0) return 'Acrocentric';
        return 'Telocentric';
    }
}

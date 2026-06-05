/**
 * @module PatientGenomeProfile
 * @description Aggregate root combining a patient's full variant list, epigenetic markers,
 * and polygenic risk scores into a unified clinical profile. This is the central entity
 * for personalized medicine queries.
 */

import { GeneVariant } from '../entities/GeneVariant';
import { CpGIsland } from '../logic/MethylationStateAnalyzer';

export interface EpigeneticMarker {
    locus: string;
    island: CpGIsland;
    associatedGene: string;
}

export class PatientGenomeProfile {
    private variants: Map<string, GeneVariant> = new Map();
    private epigeneticMarkers: EpigeneticMarker[] = [];
    private polygenicRiskScores: Map<string, number> = new Map();

    constructor(
        public readonly patientId: string,
        public readonly sequencingDate: Date
    ) {}

    /**
     * Adds a genetic variant to the patient's profile.
     */
    public addVariant(variant: GeneVariant): void {
        this.variants.set(variant.id, variant);
    }

    /**
     * Retrieves all clinically actionable variants for immediate medical review.
     */
    public getActionableVariants(): GeneVariant[] {
        return Array.from(this.variants.values()).filter(v => v.isActionable());
    }

    /**
     * Registers an epigenetic marker, such as a hypermethylated promoter.
     */
    public addEpigeneticMarker(marker: EpigeneticMarker): void {
        this.epigeneticMarkers.push(marker);
    }

    /**
     * Sets a Polygenic Risk Score (PRS) for a specific complex disease (e.g., Type 2 Diabetes).
     * 
     * @param diseaseTrait The trait or disease name.
     * @param percentile The patient's risk percentile compared to the population (0-100).
     */
    public setPolygenicRiskScore(diseaseTrait: string, percentile: number): void {
        if (percentile < 0 || percentile > 100) {
            throw new Error('PRS percentile must be between 0 and 100.');
        }
        this.polygenicRiskScores.set(diseaseTrait, percentile);
    }

    /**
     * Retrieves the PRS for a given trait.
     */
    public getPolygenicRiskScore(diseaseTrait: string): number | undefined {
        return this.polygenicRiskScores.get(diseaseTrait);
    }

    /**
     * Generates a comprehensive summary of the patient's genomic health risks.
     */
    public generateHealthSummary(): Record<string, any> {
        return {
            patientId: this.patientId,
            totalVariants: this.variants.size,
            actionableVariantsCount: this.getActionableVariants().length,
            highRiskTraits: Array.from(this.polygenicRiskScores.entries())
                .filter(([_, score]) => score >= 90)
                .map(([trait]) => trait),
            epigeneticSilencingRisks: this.epigeneticMarkers
                .filter(m => m.island.methylationLevel > 0.8)
                .map(m => m.associatedGene)
        };
    }
}

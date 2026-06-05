/**
 * @module PharmacogenomicInteraction
 * @description Aggregate mapping a patient's genomic profile to specific drug metabolic
 * pathways (e.g., CYP450 enzymes) to predict drug efficacy and toxicity.
 */

import { PatientGenomeProfile } from './PatientGenomeProfile';

export enum MetabolizerPhenotype {
    POOR = 'Poor Metabolizer (PM)',
    INTERMEDIATE = 'Intermediate Metabolizer (IM)',
    NORMAL = 'Normal Metabolizer (NM)',
    RAPID = 'Rapid Metabolizer (RM)',
    ULTRARAPID = 'Ultrarapid Metabolizer (UM)'
}

export interface DrugPathway {
    drugName: string;
    primaryEnzyme: string; // e.g., 'CYP2D6'
    isProdrug: boolean; // If true, requires metabolism to become active
}

export interface DrugResponsePrediction {
    drugName: string;
    phenotype: MetabolizerPhenotype;
    efficacyPrediction: string;
    toxicityRisk: string;
    dosageRecommendation: string;
}

export class PharmacogenomicInteraction {
    // Mapping of specific variant IDs to enzyme activity scores (simplified)
    private static readonly ENZYME_ALLELE_SCORES: Record<string, number> = {
        'rs3892097': 0, // CYP2D6*4 (No function)
        'rs1065852': 0.5, // CYP2D6*10 (Decreased function)
        'rs16947': 1.0, // CYP2D6*2 (Normal function)
        // ... thousands of other alleles would be mapped here
    };

    constructor(private readonly patientProfile: PatientGenomeProfile) {}

    /**
     * Evaluates how a patient will respond to a specific drug based on their genetics.
     * 
     * @param pathway The metabolic pathway of the drug.
     * @param patientAlleles The specific variant IDs the patient carries for this enzyme.
     * @returns {DrugResponsePrediction} Clinical recommendations for the drug.
     */
    public evaluateDrugResponse(pathway: DrugPathway, patientAlleles: string[]): DrugResponsePrediction {
        // Calculate Activity Score (AS) based on CPIC guidelines
        let activityScore = 0;
        for (const allele of patientAlleles) {
            activityScore += PharmacogenomicInteraction.ENZYME_ALLELE_SCORES[allele] ?? 1.0; // Default to normal
        }

        const phenotype = this.determinePhenotype(activityScore);
        return this.generateClinicalRecommendation(pathway, phenotype);
    }

    private determinePhenotype(activityScore: number): MetabolizerPhenotype {
        if (activityScore === 0) return MetabolizerPhenotype.POOR;
        if (activityScore > 0 && activityScore < 1.25) return MetabolizerPhenotype.INTERMEDIATE;
        if (activityScore >= 1.25 && activityScore <= 2.25) return MetabolizerPhenotype.NORMAL;
        if (activityScore > 2.25 && activityScore <= 3.0) return MetabolizerPhenotype.RAPID;
        return MetabolizerPhenotype.ULTRARAPID;
    }

    private generateClinicalRecommendation(pathway: DrugPathway, phenotype: MetabolizerPhenotype): DrugResponsePrediction {
        let efficacy = 'Normal';
        let toxicity = 'Standard';
        let recommendation = 'Standard dosing based on age and weight.';

        if (pathway.isProdrug) {
            // Prodrugs need the enzyme to become ACTIVE
            if (phenotype === MetabolizerPhenotype.POOR) {
                efficacy = 'Significantly Reduced';
                recommendation = 'Avoid drug; consider alternative therapy due to lack of efficacy.';
            } else if (phenotype === MetabolizerPhenotype.ULTRARAPID) {
                toxicity = 'High Risk';
                recommendation = 'Reduce dose or avoid; high risk of rapid active metabolite accumulation.';
            }
        } else {
            // Active drugs need the enzyme to be CLEARED
            if (phenotype === MetabolizerPhenotype.POOR) {
                toxicity = 'High Risk';
                recommendation = 'Reduce dose significantly; high risk of drug accumulation and toxicity.';
            } else if (phenotype === MetabolizerPhenotype.ULTRARAPID) {
                efficacy = 'Significantly Reduced';
                recommendation = 'Increase dose or consider alternative; drug cleared too quickly to be effective.';
            }
        }

        return {
            drugName: pathway.drugName,
            phenotype,
            efficacyPrediction: efficacy,
            toxicityRisk: toxicity,
            dosageRecommendation: recommendation
        };
    }
}

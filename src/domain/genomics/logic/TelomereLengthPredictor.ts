/**
 * @module TelomereLengthPredictor
 * @description Mathematical model predicting cellular senescence and replication limits
 * based on telomeric attrition rates and oxidative stress factors.
 */

export interface SenescencePrediction {
    remainingDivisions: number;
    estimatedYearsToSenescence: number;
    criticalShorteningProbability: number;
}

export class TelomereLengthPredictor {
    private readonly HAYFLICK_LIMIT_BP = 4000; // Critical length where senescence triggers
    private readonly BASE_ATTRITION_RATE = 50; // Base pairs lost per division

    /**
     * Predicts the remaining replicative lifespan of a cell lineage.
     * 
     * @param currentLengthBp Current telomere length in base pairs.
     * @param oxidativeStressFactor Multiplier for attrition (1.0 = normal, >1.0 = high stress).
     * @param divisionsPerYear Estimated number of cell divisions per year for the tissue type.
     * @returns {SenescencePrediction} Prediction metrics.
     */
    public predictSenescence(
        currentLengthBp: number,
        oxidativeStressFactor: number = 1.0,
        divisionsPerYear: number = 10
    ): SenescencePrediction {
        if (currentLengthBp <= this.HAYFLICK_LIMIT_BP) {
            return {
                remainingDivisions: 0,
                estimatedYearsToSenescence: 0,
                criticalShorteningProbability: 1.0
            };
        }

        const effectiveAttritionRate = this.BASE_ATTRITION_RATE * oxidativeStressFactor;
        const remainingBp = currentLengthBp - this.HAYFLICK_LIMIT_BP;
        const remainingDivisions = Math.floor(remainingBp / effectiveAttritionRate);
        const estimatedYearsToSenescence = remainingDivisions / divisionsPerYear;

        // Probability increases exponentially as it approaches the limit
        const criticalShorteningProbability = Math.exp(-remainingDivisions / 20);

        return {
            remainingDivisions,
            estimatedYearsToSenescence,
            criticalShorteningProbability: Math.min(1.0, criticalShorteningProbability)
        };
    }

    /**
     * Evaluates the impact of Telomerase Reverse Transcriptase (TERT) activation.
     * 
     * @param currentLengthBp Current length.
     * @param tertActivityLevel Activity level of telomerase (0.0 to 1.0).
     * @returns {number} New steady-state telomere length or net gain/loss per division.
     */
    public calculateTertImpact(currentLengthBp: number, tertActivityLevel: number): number {
        const maxAddition = 100; // Max bp added per cycle by TERT
        const addition = tertActivityLevel * maxAddition;
        const netChange = addition - this.BASE_ATTRITION_RATE;
        return netChange;
    }
}

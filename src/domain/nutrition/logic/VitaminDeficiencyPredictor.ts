export interface ClinicalSymptom {
  id: string;
  name: string;
  systemAffected: 'DERMATOLOGIC' | 'NEUROLOGIC' | 'OPHTHALMIC' | 'HEMATOLOGIC' | 'MUSCULOSKELETAL' | 'ORAL';
}

export interface DietaryRecallSummary {
  lowFruitAndVegIntake: boolean;
  noAnimalProductIntake: boolean;
  lowSunExposure: boolean;
  chronicAlcoholIntake: boolean;
  malabsorptionHistory: boolean;
}

export interface DeficiencyPrediction {
  deficiencyName: string;
  associatedDisease: string;
  confidenceScore: number;
  physiologicalMechanism: string;
  recommendedInterventions: string[];
}

export class VitaminDeficiencyPredictor {
  public static predictDeficiencies(
    symptoms: ClinicalSymptom[],
    recall: DietaryRecallSummary
  ): DeficiencyPrediction[] {
    const predictions: DeficiencyPrediction[] = [];
    const symptomNames = symptoms.map(s => s.name.toLowerCase());

    let scurvyScore = 0;
    if (recall.lowFruitAndVegIntake) scurvyScore += 0.4;
    if (symptomNames.includes('bleeding gums')) scurvyScore += 0.3;
    if (symptomNames.includes('petechiae') || symptomNames.includes('easy bruising')) scurvyScore += 0.3;
    if (scurvyScore >= 0.4) {
      predictions.push({
        deficiencyName: 'Vitamin C (Ascorbic Acid)',
        associatedDisease: 'Scurvy',
        confidenceScore: Math.min(1.0, scurvyScore),
        physiologicalMechanism: 'Defective collagen synthesis due to lack of vitamin C as a co-factor for prolyl and lysyl hydroxylases, leading to capillary fragility and impaired wound healing.',
        recommendedInterventions: [
          'Ascorbic acid supplementation (e.g., 100-250 mg 1-3 times daily)',
          'Increase dietary intake of citrus fruits, bell peppers, and leafy greens'
        ]
      });
    }

    let b12Score = 0;
    if (recall.noAnimalProductIntake) b12Score += 0.3;
    if (recall.malabsorptionHistory) b12Score += 0.3;
    if (symptomNames.includes('peripheral neuropathy') || symptomNames.includes('paresthesia')) b12Score += 0.2;
    if (symptomNames.includes('macrocytic anemia') || symptomNames.includes('fatigue')) b12Score += 0.2;
    if (b12Score >= 0.4) {
      predictions.push({
        deficiencyName: 'Vitamin B12 (Cobalamin)',
        associatedDisease: 'Pernicious Anemia / Subacute Combined Degeneration of the Spinal Cord',
        confidenceScore: Math.min(1.0, b12Score),
        physiologicalMechanism: 'Impaired DNA synthesis due to folate trapping (lack of methionine synthase activity) and accumulation of methylmalonic acid (MMA) causing myelin sheath degeneration.',
        recommendedInterventions: [
          'Intramuscular cyanocobalamin injections (1000 mcg weekly, then monthly)',
          'High-dose oral B12 (1000-2000 mcg daily) if intrinsic factor is present'
        ]
      });
    }

    let vitDScore = 0;
    if (recall.lowSunExposure) vitDScore += 0.3;
    if (recall.malabsorptionHistory) vitDScore += 0.2;
    if (symptomNames.includes('bone pain') || symptomNames.includes('muscle weakness')) vitDScore += 0.3;
    if (symptomNames.includes('rickets') || symptomNames.includes('osteomalacia')) vitDScore += 0.4;
    if (vitDScore >= 0.4) {
      predictions.push({
        deficiencyName: 'Vitamin D (Cholecalciferol)',
        associatedDisease: 'Rickets (children) / Osteomalacia (adults)',
        confidenceScore: Math.min(1.0, vitDScore),
        physiologicalMechanism: 'Inadequate calcium and phosphorus absorption from the gut due to low active vitamin D (1,25-dihydroxyvitamin D), leading to impaired mineralization of bone osteoid.',
        recommendedInterventions: [
          'Cholecalciferol (Vitamin D3) supplementation (e.g., 50,000 IU weekly for 8 weeks)',
          'Encourage safe sunlight exposure and calcium-rich diet'
        ]
      });
    }

    let b1Score = 0;
    if (recall.chronicAlcoholIntake) b1Score += 0.4;
    if (symptomNames.includes('ataxia') || symptomNames.includes('confusion') || symptomNames.includes('ophthalmoplegia')) b1Score += 0.4;
    if (symptomNames.includes('high-output heart failure') || symptomNames.includes('edema')) b1Score += 0.2;
    if (b1Score >= 0.4) {
      predictions.push({
        deficiencyName: 'Vitamin B1 (Thiamine)',
        associatedDisease: 'Beriberi (Wet/Dry) or Wernicke-Korsakoff Syndrome',
        confidenceScore: Math.min(1.0, b1Score),
        physiologicalMechanism: 'Depletion of thiamine pyrophosphate (TPP), a critical coenzyme for pyruvate dehydrogenase and alpha-ketoglutarate dehydrogenase, leading to impaired aerobic glucose metabolism and cellular energy failure in high-demand tissues (brain, heart).',
        recommendedInterventions: [
          'Immediate intravenous thiamine (100-500 mg every 8 hours) before any glucose administration to prevent precipitating Wernicke encephalopathy'
        ]
      });
    }

    return predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);
  } 
}
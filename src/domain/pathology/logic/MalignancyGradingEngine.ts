/**
 * @module MalignancyGradingEngine
 * @description Advanced AI logic engine for automated histological grading.
 * Utilizes simulated deep learning embeddings to evaluate tissue architecture
 * and cellular atypia, assigning standardized grades (e.g., Gleason, Nottingham).
 */

import { CellNucleus } from '../entities/CellNucleus';

export interface NottinghamGrade {
  tubuleFormationScore: number; // 1-3
  nuclearPleomorphismScore: number; // 1-3
  mitoticCountScore: number; // 1-3
  totalScore: number; // 3-9
  grade: string; // Grade I, II, or III
}

export class MalignancyGradingEngine {
  /**
   * Calculates the Nottingham Prognostic Index / Grade for Breast Carcinoma.
   * @param nuclei Array of segmented nuclei from the tumor region.
   * @param tubulePercentage AI-derived percentage of tumor forming tubules.
   * @param mitosesPer10HPF Count of mitotic figures per 10 High Power Fields.
   */
  public calculateNottinghamGrade(
    nuclei: CellNucleus[],
    tubulePercentage: number,
    mitosesPer10HPF: number
  ): NottinghamGrade {
    // 1. Tubule Formation Score
    let tubuleScore = 3;
    if (tubulePercentage > 75) tubuleScore = 1;
    else if (tubulePercentage >= 10) tubuleScore = 2;

    // 2. Nuclear Pleomorphism Score
    const avgPleomorphism = nuclei.reduce((acc, n) => acc + n.pleomorphismScore, 0) / (nuclei.length || 1);
    let pleoScore = 1;
    if (avgPleomorphism > 0.7) pleoScore = 3;
    else if (avgPleomorphism > 0.4) pleoScore = 2;

    // 3. Mitotic Count Score (Assuming standard field diameter of 0.55mm)
    let mitoticScore = 1;
    if (mitosesPer10HPF >= 12) mitoticScore = 3;
    else if (mitosesPer10HPF >= 6) mitoticScore = 2;

    const totalScore = tubuleScore + pleoScore + mitoticScore;
    let grade = 'Grade I (Well differentiated)';
    if (totalScore >= 8) grade = 'Grade III (Poorly differentiated)';
    else if (totalScore >= 6) grade = 'Grade II (Moderately differentiated)';

    return {
      tubuleFormationScore: tubuleScore,
      nuclearPleomorphismScore: pleoScore,
      mitoticCountScore: mitoticScore,
      totalScore,
      grade
    };
  }

  /**
   * Calculates the Gleason Score for Prostate Adenocarcinoma.
   * @param primaryPattern Most common architectural pattern (1-5).
   * @param secondaryPattern Second most common architectural pattern (1-5).
   */
  public calculateGleasonScore(primaryPattern: number, secondaryPattern: number): string {
    if (primaryPattern < 3 || secondaryPattern < 3) {
      console.warn('Gleason patterns 1 and 2 are rarely diagnosed in modern practice.');
    }
    const total = primaryPattern + secondaryPattern;
    let gradeGroup = 1;
    if (total === 7) gradeGroup = primaryPattern === 3 ? 2 : 3;
    else if (total === 8) gradeGroup = 4;
    else if (total >= 9) gradeGroup = 5;

    return `Gleason ${primaryPattern}+${secondaryPattern}=${total} (Grade Group ${gradeGroup})`;
  }
}

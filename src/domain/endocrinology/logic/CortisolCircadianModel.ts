export class CortisolCircadianModel {
  /**
   * Calculates the expected cortisol level based on the time of day.
   * Cortisol follows a diurnal rhythm: peak shortly after waking (CAR), trough at midnight.
   * @param hour Hour of the day (0-23)
   * @param stressFactor Multiplier for acute stress (1.0 = normal)
   */
  public calculateExpectedCortisol(hour: number, stressFactor: number = 1.0): number {
    // Simplified cosine wave to model diurnal rhythm
    // Peak at 7 AM, Trough at 11 PM
    const peakHour = 7;
    const radians = (2 * Math.PI * (hour - peakHour)) / 24;
    
    // Base level + Amplitude * cos(radians)
    const baseLevel = 10; // mcg/dL
    const amplitude = 8;   // mcg/dL
    
    const circadianValue = baseLevel + amplitude * Math.cos(radians);
    
    return circadianValue * stressFactor;
  }

  /**
   * Simulates the HPA axis response to an acute stressor.
   * @param currentLevel Current cortisol level
   * @param stressIntensity Intensity of stressor (0 to 1)
   * @param durationMinutes Duration of stressor
   */
  public simulateStressResponse(currentLevel: number, stressIntensity: number, durationMinutes: number): number {
    const acthSurge = stressIntensity * 5.0; // Simulated ACTH increase
    const productionIncrease = acthSurge * 2.0; // Cortisol production increase
    const decayRate = 0.01; // Cortisol half-life effect

    // Integration over duration
    const delta = (productionIncrease - (currentLevel * decayRate)) * durationMinutes;
    return currentLevel + delta;
  }
}
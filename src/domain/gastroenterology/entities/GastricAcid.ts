export class GastricAcid {
  constructor(
    public volumeMl: number, // Normal fasting volume: ~20-100 mL
    public pH: number,       // Normal fasting pH: 1.5 - 3.5
    public parietalCellActivityIndex: number, // 0.0 (completely inactive/atrophic) to 1.0 (hyperactive)
    public ppiConcentrationMolar: number = 0.0 // Concentration of Proton Pump Inhibitors in parietal cells
  ) {
    if (pH < 0 || pH > 14) {
      throw new Error("pH must be between 0 and 14.");
    }
  }

  /**
   * Calculates the concentration of free hydrogen ions [H+] in mol/L.
   */
  public calculateFreeHydrogenIons(): number {
    return Math.pow(10, -this.pH);
  }

  /**
   * Simulates acid secretion over a given duration, influenced by physiological stimulants
   * (Histamine, Gastrin, Acetylcholine) and inhibited by PPI concentration.
   */
  public simulateAcidSecretion(stimulated: boolean, durationMinutes: number): void {
    const baseSecretionRateMlMin = 1.5; // mL/min
    const stimulationFactor = stimulated ? 3.0 : 1.0;
    
    // PPIs block the H+/K+ ATPase pump irreversibly
    const ppiInhibitionFactor = Math.max(0, 1 - (this.ppiConcentrationMolar * 100000)); 
    const effectiveParietalActivity = this.parietalCellActivityIndex * ppiInhibitionFactor;

    const secretedVolume = baseSecretionRateMlMin * stimulationFactor * effectiveParietalActivity * durationMinutes;
    this.volumeMl += secretedVolume;

    // Calculate new pH based on secreted acid (pH ~ 1.0 for pure parietal secretion)
    const currentHions = this.calculateFreeHydrogenIons() * (this.volumeMl - secretedVolume) / 1000;
    const secretedHions = Math.pow(10, -1.0) * secretedVolume / 1000; // pure gastric juice pH is ~1.0
    const totalHions = currentHions + secretedHions;
    
    const newPH = -Math.log10(totalHions / (this.volumeMl / 1000));
    this.pH = Math.max(0.8, Math.min(7.0, newPH));
  }

  /**
   * Administers a Proton Pump Inhibitor (e.g., Omeprazole, Esomeprazole),
   * which binds covalently to H+/K+-ATPase pumps.
   */
  public administerPPI(doseMg: number, bioavailability: number): void {
    const effectiveDose = doseMg * bioavailability;
    // Simple pharmacokinetic representation of PPI accumulation in parietal cells
    this.ppiConcentrationMolar += (effectiveDose * 0.00005);
    
    // Adjust pH upwards due to pump inhibition
    const phIncrease = Math.min(4.0, this.ppiConcentrationMolar * 50000);
    this.pH = Math.min(6.5, this.pH + phIncrease);
  }

  /**
   * Simulates the buffering effect of food intake.
   */
  public bufferWithFood(foodVolumeMl: number, foodPh: number): void {
    const currentHions = this.calculateFreeHydrogenIons() * (this.volumeMl / 1000);
    const foodHions = Math.pow(10, -foodPh) * (foodVolumeMl / 1000);
    
    this.volumeMl += foodVolumeMl;
    const totalHions = currentHions + foodHions;
    const mixedPh = -Math.log10(totalHions / (this.volumeMl / 1000));
    
    this.pH = Math.max(1.0, Math.min(6.8, mixedPh));
  }
}
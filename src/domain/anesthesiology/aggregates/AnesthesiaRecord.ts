/**
 * Aggregate Root capturing the minute-by-minute intraoperative state.
 * Orchestrates vitals, drug administrations, and fluid balance.
 */
export interface VitalSignEntry {
  timestamp: Date;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  spo2: number;
  etco2: number;
}

export interface DrugAdministration {
  timestamp: Date;
  drugId: string;
  dose: number;
  unit: string;
  route: string;
}

export interface FluidEntry {
  timestamp: Date;
  type: 'CRYSTALLOID' | 'COLLOID' | 'BLOOD_PRODUCT' | 'URINE_OUTPUT' | 'ESTIMATED_BLOOD_LOSS';
  volumeMl: number;
  isInput: boolean;
}

export class AnesthesiaRecord {
  private vitalsTimeline: VitalSignEntry[] = [];
  private drugBoluses: DrugAdministration[] = [];
  private fluidEntries: FluidEntry[] = [];

  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly surgeryStartTime: Date
  ) {}

  public recordVitalSign(entry: VitalSignEntry): void {
    this.vitalsTimeline.push(entry);
    // Domain event could be dispatched here: VitalSignRecordedEvent
  }

  public administerDrug(entry: DrugAdministration): void {
    this.drugBoluses.push(entry);
    // Domain event: DrugAdministeredEvent
  }

  public recordFluid(entry: FluidEntry): void {
    this.fluidEntries.push(entry);
  }

  public calculateFluidBalance(): number {
    let balance = 0;
    for (const fluid of this.fluidEntries) {
      if (fluid.isInput) {
        balance += fluid.volumeMl;
      } else {
        balance -= fluid.volumeMl;
      }
    }
    return balance;
  }

  public getLatestVitals(): VitalSignEntry | null {
    if (this.vitalsTimeline.length === 0) return null;
    return this.vitalsTimeline[this.vitalsTimeline.length - 1];
  }

  public generateSummaryReport(): string {
    const totalFluidsIn = this.fluidEntries.filter(f => f.isInput).reduce((sum, f) => sum + f.volumeMl, 0);
    const totalFluidsOut = this.fluidEntries.filter(f => !f.isInput).reduce((sum, f) => sum + f.volumeMl, 0);
    
    return `Anesthesia Record Summary [${this.recordId}]\nPatient: ${this.patientId}\nTotal Drugs Administered: ${this.drugBoluses.length}\nFluid Balance: +${totalFluidsIn} mL / -${totalFluidsOut} mL (Net: ${this.calculateFluidBalance()} mL)`;
  }
}

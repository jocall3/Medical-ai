export interface TDMObservation {
  patientId: string;
  drugId: string;
  concentration: number;
  timestamp: Date;
}

export class TDMObservationStore {
  async persist(observation: TDMObservation): Promise<void> {
    // Persist to clinical database (e.g., PostgreSQL/FHIR Server)
  }
}
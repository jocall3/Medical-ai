export interface MIPDState {
  concentrationCurve: number[];
  currentDose: number;
  isLocked: boolean;
}

export const initialState: MIPDState = {
  concentrationCurve: [],
  currentDose: 0,
  isLocked: false
};
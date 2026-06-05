export const cdsStateSlice = {
  initialState: { activeCards: [] },
  reducers: {
    addCard: (state: any, action: any) => { state.activeCards.push(action.payload); },
    removeCard: (state: any, action: any) => { state.activeCards = state.activeCards.filter((c: any) => c.id !== action.payload); }
  }
};
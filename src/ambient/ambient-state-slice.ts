export interface AmbientState {
  transcript: string[];
  entities: any[];
  status: 'listening' | 'processing' | 'idle';
}
export const initialState: AmbientState = { transcript: [], entities: [], status: 'idle' };
export enum State { IDLE, STREAMING, TRANSCRIBING, DIARIZING, EXTRACTING, COMPLETE }
export class TranscriptionStateMachine {
  private state: State = State.IDLE;
  transition(next: State) { this.state = next; }
  getState() { return this.state; }
}
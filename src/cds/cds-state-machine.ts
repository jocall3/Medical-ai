export enum CardState { RENDERED, CLICKED, DISMISSED, OVERRIDDEN }
export class CDSStateMachine {
  static track(cardId: string, state: CardState, metadata: any) {
    console.log(`Tracking ${cardId} as ${state}`, metadata);
  }
}
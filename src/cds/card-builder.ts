export class CardBuilder {
  private cards: any[] = [];
  addInfoCard(summary: string, detail: string) {
    this.cards.push({ summary, detail, indicator: 'info', source: { label: 'Medical AI' } });
    return this;
  }
  addSuggestionCard(summary: string, detail: string, label: string) {
    this.cards.push({ summary, detail, indicator: 'warning', suggestions: [{ label }] });
    return this;
  }
  build() { return this.cards; }
}
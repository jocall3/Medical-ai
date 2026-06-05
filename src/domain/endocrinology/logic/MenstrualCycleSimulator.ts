export interface CycleState {
  day: number;
  estrogen: number;
  progesterone: number;
  lh: number;
  fsh: number;
  phase: 'Follicular' | 'Ovulatory' | 'Luteal' | 'Menstrual';
}

export class MenstrualCycleSimulator {
  private day = 1;
  private state: CycleState = {
    day: 1,
    estrogen: 20,
    progesterone: 1,
    lh: 5,
    fsh: 10,
    phase: 'Menstrual'
  };

  public nextDay(): CycleState {
    this.day = (this.day % 28) + 1;
    this.updateHormones();
    this.updatePhase();
    return this.state;
  }

  private updateHormones(): void {
    const d = this.day;
    
    // Simplified hormonal curves
    if (d <= 5) {
      this.state.estrogen = 20 + d * 2;
      this.state.progesterone = 1;
      this.state.fsh = 10 - d * 0.5;
      this.state.lh = 5;
    } else if (d <= 13) {
      this.state.estrogen = 30 + (d - 5) * 10;
      this.state.progesterone = 1 + (d - 5) * 0.1;
      this.state.fsh = 5;
      this.state.lh = 5 + (d - 10) * 2;
    } else if (d === 14) {
      this.state.estrogen = 200; // Peak
      this.state.lh = 80; // LH Surge
      this.state.fsh = 20;
      this.state.progesterone = 2;
    } else if (d <= 25) {
      this.state.estrogen = 150 - (d - 14) * 5;
      this.state.progesterone = 2 + (d - 14) * 3;
      this.state.lh = 10 - (d - 14) * 0.5;
      this.state.fsh = 5;
    } else {
      this.state.estrogen = 40 - (d - 25) * 5;
      this.state.progesterone = 15 - (d - 25) * 3;
      this.state.lh = 4;
      this.state.fsh = 6 + (d - 25) * 1;
    }
    
    this.state.day = d;
  }

  private updatePhase(): void {
    const d = this.day;
    if (d <= 5) this.state.phase = 'Menstrual';
    else if (d <= 13) this.state.phase = 'Follicular';
    else if (d === 14) this.state.phase = 'Ovulatory';
    else this.state.phase = 'Luteal';
  }
}
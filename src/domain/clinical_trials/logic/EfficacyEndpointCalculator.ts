export interface SurvivalEvent {
  time: number;
  censored: boolean;
  group: string;
}

export interface KMPoint {
  time: number;
  atRisk: number;
  events: number;
  censored: number;
  survivalProbability: number;
}

export class EfficacyEndpointCalculator {
  public static calculateKaplanMeier(events: SurvivalEvent[]): Map<string, KMPoint[]> {
    const groups = Array.from(new Set(events.map(e => e.group)));
    const results = new Map<string, KMPoint[]>();

    for (const group of groups) {
      const groupEvents = events.filter(e => e.group === group);
      groupEvents.sort((a, b) => a.time - b.time);

      const points: KMPoint[] = [];
      let atRisk = groupEvents.length;
      let currentSurvival = 1.0;

      const uniqueTimes = Array.from(new Set(groupEvents.map(e => e.time))).sort((a, b) => a - b);

      for (const time of uniqueTimes) {
        const eventsAtTime = groupEvents.filter(e => e.time === time);
        const eventCount = eventsAtTime.filter(e => !e.censored).length;
        const censoredCount = eventsAtTime.filter(e => e.censored).length;

        if (atRisk > 0) {
          currentSurvival = currentSurvival * (1 - eventCount / atRisk);
        } else {
          currentSurvival = 0;
        }

        points.push({
          time,
          atRisk,
          events: eventCount,
          censored: censoredCount,
          survivalProbability: parseFloat(currentSurvival.toFixed(4))
        });

        atRisk -= (eventCount + censoredCount);
      }

      results.set(group, points);
    }

    return results;
  }

  public static calculateHazardRatio(events: SurvivalEvent[], treatmentGroup: string, controlGroup: string): number {
    const treatmentEvents = events.filter(e => e.group === treatmentGroup);
    const controlEvents = events.filter(e => e.group === controlGroup);

    const treatmentObserved = treatmentEvents.filter(e => !e.censored).length;
    const controlObserved = controlEvents.filter(e => !e.censored).length;

    const totalObserved = treatmentObserved + controlObserved;
    if (totalObserved === 0) return 1.0;

    const treatmentExpected = totalObserved * (treatmentEvents.length / events.length);
    const controlExpected = totalObserved * (controlEvents.length / events.length);

    if (treatmentExpected === 0 || controlExpected === 0) return 1.0;

    const hazardRatio = (treatmentObserved / treatmentExpected) / (controlObserved / controlExpected);
    return parseFloat(hazardRatio.toFixed(3));
  }
}
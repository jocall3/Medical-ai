import { HormoneType } from '../entities/Hormone';

export interface MetabolicMarker {
  value: number;
  unit: string;
  timestamp: Date;
  referenceRange: [number, number];
}

export class MetabolicPanel {
  private markers: Map<string, MetabolicMarker> = new Map();

  constructor(
    public readonly patientId: string,
    public readonly collectionDate: Date
  ) {}

  public addMarker(name: string, value: number, unit: string, range: [number, number]): void {
    this.markers.set(name, {
      value,
      unit,
      timestamp: this.collectionDate,
      referenceRange: range
    });
  }

  public getMarker(name: string): MetabolicMarker | undefined {
    return this.markers.get(name);
  }

  public isMarkerAbnormal(name: string): boolean {
    const marker = this.markers.get(name);
    if (!marker) return false;
    const [min, max] = marker.referenceRange;
    return marker.value < min || marker.value > max;
  }

  public getSummary(): { abnormalMarkers: string[]; allMarkers: Record<string, number> } {
    const abnormalMarkers: string[] = [];
    const allMarkers: Record<string, number> = {};

    this.markers.forEach((marker, name) => {
      allMarkers[name] = marker.value;
      if (this.isMarkerAbnormal(name)) {
        abnormalMarkers.push(name);
      }
    });

    return { abnormalMarkers, allMarkers };
  }
}
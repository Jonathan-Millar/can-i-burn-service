import { GPSCoordinates, Location, FireStatusData } from '../../types';
export interface FireDataProvider {
  getName(): string;
  getCoverage(): string[];
  isAvailableForLocation(location: Location): boolean;
  isAvailableForCoordinates(coordinates: GPSCoordinates): boolean;
  getFireStatus(location: Location): Promise<FireStatusData | null>;
  getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null>;
}
export interface FireDetection {
  latitude: number;
  longitude: number;
  confidence: number;
  datetime: Date;
  brightness?: number;
  satellite?: string;
  instrument?: string;
}
export interface FireDangerRating {
  level: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  index: number;
  valid_from: Date;
  valid_to: Date;
}
//# sourceMappingURL=fireDataProvider.d.ts.map

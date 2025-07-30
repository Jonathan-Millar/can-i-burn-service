export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}
export interface Location {
  province: string;
  state: string;
  county: string;
  country: string;
}
export declare enum FireStatus {
  NO_BURN = 0,
  RESTRICTED_BURN = 1,
  OPEN_BURN = 2,
}
export interface FireWatchResponse {
  status: FireStatus;
  valid_from: Date;
  valid_to: Date;
  location: Location;
  coordinates: GPSCoordinates;
  jurisdiction?: string;
  restrictions?: string[];
}
export interface ReverseGeocodeResult {
  location: Location;
  accuracy: 'high' | 'medium' | 'low';
}
export interface FireStatusData {
  status: FireStatus;
  valid_from: Date;
  valid_to: Date;
  jurisdiction: string;
  restrictions?: string[];
}
//# sourceMappingURL=index.d.ts.map

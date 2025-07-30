import { GPSCoordinates, ReverseGeocodeResult } from '../types';
export declare class LocationService {
  private readonly nominatimBaseUrl;
  private readonly userAgent;
  reverseGeocode(coordinates: GPSCoordinates): Promise<ReverseGeocodeResult>;
  private fetchLocationFromNominatim;
  private parseNominatimResponse;
  private extractCountyFromDisplayName;
}
//# sourceMappingURL=locationService.d.ts.map

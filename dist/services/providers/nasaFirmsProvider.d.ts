import { GPSCoordinates, Location, FireStatusData } from '../../types';
import { FireDataProvider } from '../interfaces/fireDataProvider';
export declare class NASAFirmsProvider implements FireDataProvider {
  private readonly baseUrl;
  private readonly mapKey;
  private readonly userAgent;
  private readonly proximityRadius;
  private readonly cache;
  private readonly cacheTimeout;
  constructor(mapKey?: string);
  getName(): string;
  getCoverage(): string[];
  isAvailableForLocation(location: Location): boolean;
  isAvailableForCoordinates(coordinates: GPSCoordinates): boolean;
  getFireStatus(location: Location): Promise<FireStatusData | null>;
  getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null>;
  private getNearbyFireDetections;
  private parseCSVData;
  private inferFireStatusFromDetections;
  private calculateDistance;
}
//# sourceMappingURL=nasaFirmsProvider.d.ts.map

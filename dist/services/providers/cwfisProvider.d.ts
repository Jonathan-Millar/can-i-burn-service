import { GPSCoordinates, Location, FireStatusData } from '../../types';
import { FireDataProvider } from '../interfaces/fireDataProvider';
export declare class CWFISProvider implements FireDataProvider {
  private readonly baseUrl;
  private readonly userAgent;
  private readonly cache;
  private readonly cacheTimeout;
  getName(): string;
  getCoverage(): string[];
  isAvailableForLocation(location: Location): boolean;
  isAvailableForCoordinates(coordinates: GPSCoordinates): boolean;
  getFireStatus(location: Location): Promise<FireStatusData | null>;
  getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null>;
  private getCWFISFireData;
  private getNearbyFires;
  private getFireDangerRating;
  private getFireDangerRatingByCoordinates;
  private parseGeoJsonFeatures;
  private extractCoordinates;
  private interpretFireStatus;
  private interpretFireStatusFromCoordinates;
  private getAgencyCode;
  private calculateDistance;
  private getProvinceCoordinates;
  private parseFireWeatherData;
  private calculateFireDangerRating;
}
//# sourceMappingURL=cwfisProvider.d.ts.map

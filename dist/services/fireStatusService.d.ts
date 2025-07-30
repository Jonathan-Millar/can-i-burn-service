import { GPSCoordinates, Location, FireStatusData } from '../types';
export declare class FireStatusService {
  private providers;
  constructor();
  private mockFireStatusData;
  getFireStatus(location: Location): Promise<FireStatusData>;
  getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null>;
  private getFallbackStatus;
  getAvailableProviders(): string[];
  getProviderCoverage(providerName: string): string[];
}
//# sourceMappingURL=fireStatusService.d.ts.map

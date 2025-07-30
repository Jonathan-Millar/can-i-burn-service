import { GPSCoordinates, FireWatchResponse } from '../types';
import { LocationService } from './locationService';
import { FireStatusService } from './fireStatusService';
import { validateCoordinates } from '../utils/validation';

export class CanIBurnService {
  private locationService: LocationService;
  private fireStatusService: FireStatusService;

  constructor() {
    this.locationService = new LocationService();
    this.fireStatusService = new FireStatusService();
  }

  async getFireWatchStatus(
    coordinates: GPSCoordinates
  ): Promise<FireWatchResponse> {
    validateCoordinates(coordinates);

    // Try coordinate-based lookup first (more accurate for satellite data)
    let fireStatusData =
      await this.fireStatusService.getFireStatusByCoordinates(coordinates);

    // Fall back to location-based lookup if no coordinate data available
    if (!fireStatusData) {
      const geocodeResult =
        await this.locationService.reverseGeocode(coordinates);
      fireStatusData = await this.fireStatusService.getFireStatus(
        geocodeResult.location
      );
    }

    // Always get location info for response
    const geocodeResult =
      await this.locationService.reverseGeocode(coordinates);

    return {
      status: fireStatusData.status,
      valid_from: fireStatusData.valid_from,
      valid_to: fireStatusData.valid_to,
      location: geocodeResult.location,
      coordinates,
      jurisdiction: fireStatusData.jurisdiction,
      restrictions: fireStatusData.restrictions,
    };
  }
}

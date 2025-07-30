import { GPSCoordinates, Location, ReverseGeocodeResult } from '../types';
import {
  LocationNotFoundError,
  ExternalServiceError,
  InvalidCoordinatesError,
} from '../errors';
import { validateCoordinates } from '../utils/validation';

interface NominatimResponse {
  address: {
    county?: string;
    state_district?: string;
    state?: string;
    province?: string;
    country?: string;
    country_code?: string;
  };
  display_name: string;
}

export class LocationService {
  private readonly nominatimBaseUrl =
    'https://nominatim.openstreetmap.org/reverse';
  private readonly userAgent = 'CanIBurnService/1.0';

  async reverseGeocode(
    coordinates: GPSCoordinates
  ): Promise<ReverseGeocodeResult> {
    try {
      validateCoordinates(coordinates);

      const location = await this.fetchLocationFromNominatim(coordinates);

      return {
        location,
        accuracy: 'high',
      };
    } catch (error) {
      if (
        error instanceof LocationNotFoundError ||
        error instanceof InvalidCoordinatesError
      ) {
        throw error;
      }
      throw new ExternalServiceError('LocationService', error as Error);
    }
  }

  private async fetchLocationFromNominatim(
    coordinates: GPSCoordinates
  ): Promise<Location> {
    const url = new URL(this.nominatimBaseUrl);
    url.searchParams.set('lat', coordinates.latitude.toString());
    url.searchParams.set('lon', coordinates.longitude.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as NominatimResponse;

    if (!data.address) {
      throw new LocationNotFoundError(
        coordinates.latitude,
        coordinates.longitude
      );
    }

    return this.parseNominatimResponse(data, coordinates);
  }

  private parseNominatimResponse(
    data: NominatimResponse,
    coordinates: GPSCoordinates
  ): Location {
    const { address } = data;

    let country = '';
    if (address.country_code === 'ca') {
      country = 'Canada';
    } else if (address.country_code === 'us') {
      country = 'United States';
    } else {
      country = address.country || 'Unknown Country';
    }

    const province =
      address.province || address.state || 'Unknown Province/State';
    const state = address.state || address.province || 'Unknown State/Province';

    const county =
      address.county ||
      address.state_district ||
      this.extractCountyFromDisplayName(data.display_name) ||
      'Unknown County';

    if (
      country === 'Unknown Country' ||
      province === 'Unknown Province/State'
    ) {
      throw new LocationNotFoundError(
        coordinates.latitude,
        coordinates.longitude
      );
    }

    return {
      province,
      state,
      county,
      country,
    };
  }

  private extractCountyFromDisplayName(displayName: string): string | null {
    const parts = displayName.split(', ');

    for (const part of parts) {
      if (
        part.toLowerCase().includes('county') ||
        part.toLowerCase().includes('regional municipality') ||
        part.toLowerCase().includes('district')
      ) {
        return part.trim();
      }
    }

    return null;
  }
}

import { GPSCoordinates, Location, FireStatus, FireStatusData } from '../types';
import { FireStatusNotFoundError, ExternalServiceError } from '../errors';
import { FireDataProvider } from './interfaces/fireDataProvider';
import { CWFISProvider } from './providers/cwfisProvider';
import { NASAFirmsProvider } from './providers/nasaFirmsProvider';

export class FireStatusService {
  private providers: FireDataProvider[];

  constructor() {
    this.providers = [new NASAFirmsProvider(), new CWFISProvider()];
  }

  private mockFireStatusData: Map<string, FireStatusData> = new Map([
    [
      'Ontario,Toronto',
      {
        status: FireStatus.RESTRICTED_BURN,
        valid_from: new Date('2024-07-01T00:00:00Z'),
        valid_to: new Date('2024-09-30T23:59:59Z'),
        jurisdiction: 'City of Toronto',
        restrictions: [
          'No burning between 8 AM and 8 PM',
          'Maximum pile size 2m x 2m',
        ],
      },
    ],
    [
      'British Columbia,Vancouver',
      {
        status: FireStatus.NO_BURN,
        valid_from: new Date('2024-06-15T00:00:00Z'),
        valid_to: new Date('2024-10-15T23:59:59Z'),
        jurisdiction: 'BC Wildfire Service',
        restrictions: [
          'Complete fire ban in effect',
          'All open fires prohibited',
        ],
      },
    ],
    [
      'Alberta,Calgary',
      {
        status: FireStatus.OPEN_BURN,
        valid_from: new Date('2024-05-01T00:00:00Z'),
        valid_to: new Date('2024-11-30T23:59:59Z'),
        jurisdiction: 'Alberta Agriculture and Forestry',
      },
    ],
    [
      'New York,New York County',
      {
        status: FireStatus.RESTRICTED_BURN,
        valid_from: new Date('2024-04-01T00:00:00Z'),
        valid_to: new Date('2024-11-30T23:59:59Z'),
        jurisdiction: 'New York State Department of Environmental Conservation',
        restrictions: [
          'Permit required',
          'No burning during high wind conditions',
        ],
      },
    ],
    [
      'California,Los Angeles County',
      {
        status: FireStatus.NO_BURN,
        valid_from: new Date('2024-05-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        jurisdiction: 'California Department of Forestry and Fire Protection',
        restrictions: [
          'Red flag warning in effect',
          'All outdoor burning prohibited',
        ],
      },
    ],
  ]);

  async getFireStatus(location: Location): Promise<FireStatusData> {
    try {
      // Try each provider in priority order
      for (const provider of this.providers) {
        if (provider.isAvailableForLocation(location)) {
          try {
            const status = await provider.getFireStatus(location);
            if (status) {
              return status;
            }
          } catch (error) {
            console.warn(
              `Provider ${provider.getName()} failed for location:`,
              error
            );
            continue;
          }
        }
      }

      // Fall back to mock data if no provider has data
      const key = `${location.province || location.state},${location.county}`;
      const fireStatus = this.mockFireStatusData.get(key);

      if (!fireStatus) {
        const fallbackStatus = this.getFallbackStatus(location);
        if (fallbackStatus) {
          return fallbackStatus;
        }
        throw new FireStatusNotFoundError(
          `${location.province || location.state}, ${location.county}`
        );
      }

      return fireStatus;
    } catch (error) {
      if (error instanceof FireStatusNotFoundError) {
        throw error;
      }
      console.error('FireStatusService encountered an error:', error);
      throw new ExternalServiceError('FireStatusService', error as Error);
    }
  }

  async getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null> {
    try {
      // Try each provider in priority order
      for (const provider of this.providers) {
        if (provider.isAvailableForCoordinates(coordinates)) {
          try {
            const status =
              await provider.getFireStatusByCoordinates(coordinates);
            if (status) {
              return status;
            }
          } catch (error) {
            console.warn(
              `Provider ${provider.getName()} failed for coordinates:`,
              error
            );
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      throw new ExternalServiceError('FireStatusService', error as Error);
    }
  }

  private getFallbackStatus(location: Location): FireStatusData | null {
    const currentDate = new Date();
    const winterMonths = [11, 0, 1, 2];
    const summerMonths = [5, 6, 7, 8];
    const currentMonth = currentDate.getMonth();

    if (location.country === 'Canada') {
      if (winterMonths.includes(currentMonth)) {
        return {
          status: FireStatus.OPEN_BURN,
          valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
          valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
          jurisdiction: 'Provincial Fire Authority',
        };
      } else if (summerMonths.includes(currentMonth)) {
        return {
          status: FireStatus.RESTRICTED_BURN,
          valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
          valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
          jurisdiction: 'Provincial Fire Authority',
          restrictions: ['Seasonal fire restrictions in effect'],
        };
      }
    }

    if (location.country === 'United States') {
      if (winterMonths.includes(currentMonth)) {
        return {
          status: FireStatus.RESTRICTED_BURN,
          valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
          valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
          jurisdiction: 'State Fire Authority',
          restrictions: ['Permit may be required'],
        };
      } else if (summerMonths.includes(currentMonth)) {
        return {
          status: FireStatus.NO_BURN,
          valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
          valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
          jurisdiction: 'State Fire Authority',
          restrictions: ['High fire danger period'],
        };
      }
    }

    return null;
  }

  getAvailableProviders(): string[] {
    return this.providers.map((provider) => provider.getName());
  }

  getProviderCoverage(providerName: string): string[] {
    const provider = this.providers.find((p) => p.getName() === providerName);
    return provider ? provider.getCoverage() : [];
  }
}

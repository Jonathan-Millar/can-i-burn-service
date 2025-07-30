import { describe, it, expect, beforeEach } from 'vitest';
import { LocationService } from '../../src/services/locationService';
import {
  InvalidCoordinatesError,
  LocationNotFoundError,
} from '../../src/errors';

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
  });

  describe('reverseGeocode', () => {
    it('should return high accuracy result for Toronto coordinates', async () => {
      const coordinates = { latitude: 43.6532, longitude: -79.3832 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.province).toBe('Ontario');
      expect(result.location.county).toBe('Golden Horseshoe');
      expect(result.location.country).toBe('Canada');
    });

    it('should return high accuracy result for nearby Toronto coordinates', async () => {
      const coordinates = { latitude: 43.65, longitude: -79.38 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.country).toBe('Canada');
      expect(result.location.province).toBe('Ontario');
    });

    it('should return high accuracy result for Manitoba coordinates', async () => {
      const coordinates = { latitude: 55.0, longitude: -100.0 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.country).toBe('Canada');
      expect(result.location.province).toBe('Manitoba');
    });

    it('should return high accuracy result for Texas coordinates', async () => {
      const coordinates = { latitude: 35.0, longitude: -100.0 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.country).toBe('United States');
      expect(result.location.state).toBe('Texas');
    });

    it('should throw InvalidCoordinatesError for invalid coordinates', async () => {
      const coordinates = { latitude: 91, longitude: 0 };

      await expect(locationService.reverseGeocode(coordinates)).rejects.toThrow(
        InvalidCoordinatesError
      );
    });

    it('should throw LocationNotFoundError for coordinates outside known regions', async () => {
      const coordinates = { latitude: 0, longitude: 0 };

      await expect(locationService.reverseGeocode(coordinates)).rejects.toThrow(
        LocationNotFoundError
      );
    });

    it('should handle Vancouver coordinates correctly', async () => {
      const coordinates = { latitude: 49.2827, longitude: -123.1207 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.province).toBe('British Columbia');
      expect(result.location.county).toBe('Metro Vancouver Regional District');
      expect(result.location.country).toBe('Canada');
    });

    it('should handle US coordinates correctly', async () => {
      const coordinates = { latitude: 40.7128, longitude: -74.006 };
      const result = await locationService.reverseGeocode(coordinates);

      expect(result.accuracy).toBe('high');
      expect(result.location.state).toBe('New York');
      expect(result.location.county).toBe('New York County');
      expect(result.location.country).toBe('United States');
    });
  });
});

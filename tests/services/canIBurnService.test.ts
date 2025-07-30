import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanIBurnService } from '../../src/services/canIBurnService';
import { FireStatus } from '../../src/types';
import {
  InvalidCoordinatesError,
  LocationNotFoundError,
} from '../../src/errors';

describe('CanIBurnService', () => {
  let canIBurnService: CanIBurnService;

  beforeEach(() => {
    canIBurnService = new CanIBurnService();
  });

  describe('getFireWatchStatus', () => {
    it('should return complete fire watch status for Toronto coordinates', async () => {
      const coordinates = { latitude: 43.6532, longitude: -79.3832 };
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBeOneOf([
        FireStatus.NO_BURN,
        FireStatus.RESTRICTED_BURN,
        FireStatus.OPEN_BURN,
      ]);
      expect(result.location.province).toBe('Ontario');
      expect(typeof result.location.county).toBe('string');
      expect(result.location.country).toBe('Canada');
      expect(result.coordinates).toEqual(coordinates);
      expect(result.valid_from).toBeInstanceOf(Date);
      expect(result.valid_to).toBeInstanceOf(Date);
      expect(typeof result.jurisdiction).toBe('string');
    }, 10000);

    it('should return complete fire watch status for Vancouver coordinates', async () => {
      const coordinates = { latitude: 49.2827, longitude: -123.1207 };
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.location.province).toBe('British Columbia');
      expect(result.location.county).toBe('Metro Vancouver Regional District');
      expect(result.location.country).toBe('Canada');
      expect(result.coordinates).toEqual(coordinates);
    }, 10000);

    it('should return complete fire watch status for Calgary coordinates', async () => {
      const coordinates = { latitude: 51.0447, longitude: -114.0719 };
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.location.province).toBe('Alberta');
      expect(result.location.country).toBe('Canada');
      expect(result.coordinates).toEqual(coordinates);
    }, 10000);

    it('should return complete fire watch status for New York coordinates', async () => {
      const coordinates = { latitude: 40.7128, longitude: -74.006 };
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.location.state).toBe('New York');
      expect(result.location.county).toBe('New York County');
      expect(result.location.country).toBe('United States');
      expect(result.coordinates).toEqual(coordinates);
    }, 10000);

    it('should return complete fire watch status for Los Angeles coordinates', async () => {
      const coordinates = { latitude: 34.0522, longitude: -118.2437 };
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBe(FireStatus.NO_BURN);
      expect(result.location.state).toBe('California');
      expect(result.location.county).toBe('Los Angeles County');
      expect(result.location.country).toBe('United States');
      expect(result.coordinates).toEqual(coordinates);
    }, 10000);

    it('should handle Manitoba location with fallback fire status', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-07-15')); // Summer month

      const coordinates = { latitude: 55.0, longitude: -100.0 }; // Manitoba, Canada
      const result = await canIBurnService.getFireWatchStatus(coordinates);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.location.country).toBe('Canada');
      expect(result.location.province).toBe('Manitoba');
      expect(result.coordinates).toEqual(coordinates);

      vi.useRealTimers();
    }, 10000);

    it('should throw InvalidCoordinatesError for invalid coordinates', async () => {
      const coordinates = { latitude: 91, longitude: 0 };

      await expect(
        canIBurnService.getFireWatchStatus(coordinates)
      ).rejects.toThrow(InvalidCoordinatesError);
    });

    it('should throw LocationNotFoundError for coordinates outside known regions', async () => {
      const coordinates = { latitude: 0, longitude: 0 }; // Middle of Atlantic Ocean

      await expect(
        canIBurnService.getFireWatchStatus(coordinates)
      ).rejects.toThrow(LocationNotFoundError);
    });

    it('should validate coordinates before processing', async () => {
      const invalidCoordinates = [
        { latitude: NaN, longitude: 0 },
        { latitude: 0, longitude: NaN },
        { latitude: 91, longitude: 0 },
        { latitude: -91, longitude: 0 },
        { latitude: 0, longitude: 181 },
        { latitude: 0, longitude: -181 },
      ];

      for (const coords of invalidCoordinates) {
        await expect(
          canIBurnService.getFireWatchStatus(coords)
        ).rejects.toThrow(InvalidCoordinatesError);
      }
    });

    it('should handle edge case coordinates', async () => {
      const edgeCoordinates = [
        { latitude: 90, longitude: 180 },
        { latitude: -90, longitude: -180 },
        { latitude: 0, longitude: 0 },
      ];

      // These should not throw validation errors, but may throw LocationNotFoundError
      for (const coords of edgeCoordinates) {
        try {
          await canIBurnService.getFireWatchStatus(coords);
        } catch (error) {
          expect(error).not.toBeInstanceOf(InvalidCoordinatesError);
        }
      }
    });
  });
});

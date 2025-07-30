import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NASAFirmsProvider } from '../../../src/services/providers/nasaFirmsProvider';
import { FireStatus } from '../../../src/types';
import { ExternalServiceError } from '../../../src/errors';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NASAFirmsProvider', () => {
  let provider: NASAFirmsProvider;

  beforeEach(() => {
    provider = new NASAFirmsProvider('test-api-key');
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use provided API key', () => {
      const providerWithKey = new NASAFirmsProvider('my-key');
      expect(providerWithKey).toBeDefined();
    });

    it('should use environment variable when no key provided', () => {
      const originalEnv = process.env.NASA_FIRMS_MAP_KEY;
      process.env.NASA_FIRMS_MAP_KEY = 'env-key';

      const providerFromEnv = new NASAFirmsProvider();
      expect(providerFromEnv).toBeDefined();

      process.env.NASA_FIRMS_MAP_KEY = originalEnv;
    });

    it('should warn when no API key is available', () => {
      const originalEnv = process.env.NASA_FIRMS_MAP_KEY;
      delete process.env.NASA_FIRMS_MAP_KEY;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      new NASAFirmsProvider();
      expect(consoleSpy).toHaveBeenCalledWith(
        'NASA FIRMS MAP_KEY not provided. Fire detection will be limited.'
      );

      consoleSpy.mockRestore();
      process.env.NASA_FIRMS_MAP_KEY = originalEnv;
    });
  });

  describe('basic provider info', () => {
    it('should return correct name', () => {
      expect(provider.getName()).toBe('NASA FIRMS');
    });

    it('should return correct coverage', () => {
      expect(provider.getCoverage()).toEqual([
        'United States',
        'Canada',
        'Global',
      ]);
    });
  });

  describe('isAvailableForLocation', () => {
    it('should return true for US locations', () => {
      const location = {
        province: 'California',
        state: 'California',
        county: 'Los Angeles',
        country: 'United States',
      };
      expect(provider.isAvailableForLocation(location)).toBe(true);
    });

    it('should return true for Canadian locations', () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };
      expect(provider.isAvailableForLocation(location)).toBe(true);
    });

    it('should return false for other countries', () => {
      const location = {
        province: 'England',
        state: 'England',
        county: 'London',
        country: 'United Kingdom',
      };
      expect(provider.isAvailableForLocation(location)).toBe(false);
    });
  });

  describe('isAvailableForCoordinates', () => {
    it('should return true for coordinates within North America', () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 }; // Ottawa
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(true);
    });

    it('should return false for coordinates outside North America', () => {
      const coordinates = { latitude: 51.5074, longitude: -0.1278 }; // London, UK
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far south', () => {
      const coordinates = { latitude: 20.0, longitude: -100.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far north', () => {
      const coordinates = { latitude: 90.0, longitude: -100.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far east', () => {
      const coordinates = { latitude: 45.0, longitude: -40.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far west', () => {
      const coordinates = { latitude: 45.0, longitude: -180.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });
  });

  describe('getFireStatus', () => {
    it('should always return null as NASA FIRMS provides detection data, not regulatory status', async () => {
      const location = {
        province: 'California',
        state: 'California',
        county: 'Los Angeles',
        country: 'United States',
      };
      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
    });
  });

  describe('getFireStatusByCoordinates', () => {
    it('should return null when no API key is available', async () => {
      const providerNoKey = new NASAFirmsProvider('');
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      // Clear any cached data that might interfere
      mockFetch.mockClear();

      const result =
        await providerNoKey.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle successful API response with no fire detections', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n',
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });

    it('should handle successful API response with low confidence detections', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,2024-01-15,1230,NOAA-20,VIIRS,30,2.0NRT,290.2,15.5,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull(); // Low confidence detection should be filtered out
    });

    it('should return RESTRICTED_BURN status for moderate fire activity', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      // Create recent date for fire detections
      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      // Need exactly 2 recent detections to trigger RESTRICTED_BURN (not 3+ which would be NO_BURN)
      // And they should be far enough away (>5km) to not trigger nearby detection logic
      // 0.05 degrees ≈ 5.5km, so these should be outside the 5km threshold
      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.05,-75.05,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,70,2.0NRT,290.2,15.5,D
45.06,-75.06,305.2,1.3,1.2,${recentDate},1235,NOAA-20,VIIRS,75,2.0NRT,295.1,18.2,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result?.jurisdiction).toBe('NASA FIRMS Fire Detection');
      expect(result?.restrictions).toContain('Recent fire activity detected');
    });

    it('should return NO_BURN status for high confidence nearby fires', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,85,2.0NRT,290.2,15.5,D
45.002,-75.002,305.2,1.3,1.2,${recentDate},1235,NOAA-20,VIIRS,90,2.0NRT,295.1,18.2,D
45.003,-75.003,310.1,1.4,1.3,${recentDate},1240,NOAA-20,VIIRS,95,2.0NRT,300.3,20.1,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
      expect(result?.jurisdiction).toBe('NASA FIRMS Fire Detection');
      expect(result?.restrictions).toContain('Active fire detected in area');
    });

    it('should return NO_BURN status for very close fires', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      // Fire very close (within 5km) - need confidence >= 50 to be included
      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,60,2.0NRT,290.2,15.5,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
    });

    it('should handle API rate limit errors', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(
        provider.getFireStatusByCoordinates(coordinates)
      ).rejects.toThrow(ExternalServiceError);
    });

    it('should handle other API errors', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        provider.getFireStatusByCoordinates(coordinates)
      ).rejects.toThrow(ExternalServiceError);
    });

    it('should handle network errors', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        provider.getFireStatusByCoordinates(coordinates)
      ).rejects.toThrow(ExternalServiceError);
    });

    it('should use cached data when available', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () =>
          'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n',
      });

      // First call
      await provider.getFireStatusByCoordinates(coordinates);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await provider.getFireStatusByCoordinates(coordinates);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty CSV data', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });

    it('should handle CSV with only headers', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () =>
          'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight',
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });

    it('should handle malformed CSV rows gracefully', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,85,2.0NRT,290.2,15.5,D
invalid,row,data
45.002,-75.002,305.2,1.3,1.2,${recentDate},1235,NOAA-20,VIIRS,90,2.0NRT,295.1,18.2,D
45.003,-75.003,310.1,1.4,1.3,${recentDate},1240,NOAA-20,VIIRS,95,2.0NRT,300.3,20.1,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull(); // Should still process valid rows
    });

    it('should handle rows with insufficient columns', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001
45.002,-75.002,305.2,1.3,1.2,${recentDate},1235,NOAA-20,VIIRS,90,2.0NRT,295.1,18.2,D
45.003,-75.003,310.1,1.4,1.3,${recentDate},1240,NOAA-20,VIIRS,95,2.0NRT,300.3,20.1,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull(); // Should process the valid rows
    });

    it('should handle old fire detections (older than 72 hours)', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5); // 5 days ago
      const oldDateStr = oldDate.toISOString().split('T')[0];

      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,${oldDateStr},1230,NOAA-20,VIIRS,85,2.0NRT,290.2,15.5,D
45.002,-75.002,305.2,1.3,1.2,${oldDateStr},1235,NOAA-20,VIIRS,90,2.0NRT,295.1,18.2,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull(); // Old detections should not trigger restrictions
    });

    it('should calculate distance correctly for nearby coordinates', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      // Fire very close (should be within 5km threshold) - need confidence >= 50
      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.001,-75.001,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,60,2.0NRT,290.2,15.5,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
    });

    it('should not trigger for distant fires', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 };

      const now = new Date();
      const recentDate = now.toISOString().split('T')[0];

      // Fire far away (should be outside 5km threshold)
      const csvData = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
45.1,-75.1,300.5,1.2,1.1,${recentDate},1230,NOAA-20,VIIRS,60,2.0NRT,290.2,15.5,D`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => csvData,
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull(); // Should not trigger for distant fires
    });
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CWFISProvider } from '../../../src/services/providers/cwfisProvider';
import { FireStatus } from '../../../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CWFISProvider', () => {
  let provider: CWFISProvider;

  beforeEach(() => {
    provider = new CWFISProvider();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic provider info', () => {
    it('should return correct name', () => {
      expect(provider.getName()).toBe(
        'Canadian Wildland Fire Information System'
      );
    });

    it('should return correct coverage', () => {
      expect(provider.getCoverage()).toEqual(['Canada']);
    });
  });

  describe('isAvailableForLocation', () => {
    it('should return true for Canadian locations', () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };
      expect(provider.isAvailableForLocation(location)).toBe(true);
    });

    it('should return false for non-Canadian locations', () => {
      const location = {
        province: 'California',
        state: 'California',
        county: 'Los Angeles',
        country: 'United States',
      };
      expect(provider.isAvailableForLocation(location)).toBe(false);
    });
  });

  describe('isAvailableForCoordinates', () => {
    it('should return true for coordinates within Canada boundaries', () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 }; // Ottawa
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(true);
    });

    it('should return false for coordinates outside Canada boundaries', () => {
      const coordinates = { latitude: 40.7128, longitude: -74.006 }; // New York
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far north', () => {
      const coordinates = { latitude: 85.0, longitude: -75.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far south', () => {
      const coordinates = { latitude: 40.0, longitude: -75.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far east', () => {
      const coordinates = { latitude: 45.0, longitude: -50.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });

    it('should return false for coordinates too far west', () => {
      const coordinates = { latitude: 45.0, longitude: -145.0 };
      expect(provider.isAvailableForCoordinates(coordinates)).toBe(false);
    });
  });

  describe('getFireStatus', () => {
    it('should return null for non-Canadian locations', async () => {
      const location = {
        province: 'California',
        state: 'California',
        county: 'Los Angeles',
        country: 'United States',
      };
      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
    });

    it('should return null for unknown Canadian provinces', async () => {
      const location = {
        province: 'Unknown Province',
        state: 'Unknown Province',
        county: 'Unknown',
        country: 'Canada',
      };
      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
    });

    it('should handle HTTP errors gracefully', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
    });

    it('should return fire status for known province with no active fires', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5, // Moderate fire weather index
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                dsr: 0.5,
                rep_date: new Date().toISOString(),
                name: 'Test Station',
                wmo: 12345,
                agency: 'MSC',
                prov: 'ON',
                lat: 43.6532,
                lon: -79.3832,
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result?.jurisdiction).toBe(
        'Canadian Wildland Fire Information System'
      );
    });

    it('should return NO_BURN status when active fires are present', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                firename: 'Test Fire',
                stage_of_control: 'UC', // Under Control
                agency: 'on',
              },
              geometry: {
                type: 'Point',
                coordinates: [-79.3832, 43.6532],
              },
            },
          ],
        }),
      });

      // Mock fire weather data API call (won't be used since active fires take precedence)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5,
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
      expect(result?.restrictions).toContain('1 active wildfire(s) in Ontario');
    });

    it('should handle different fire danger ratings', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather data API call with high FWI
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 10, // High fire weather index
                ffmc: 90,
                dmc: 25,
                dc: 300,
                isi: 8,
                bui: 35,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.RESTRICTED_BURN);
    });

    it('should handle low fire danger rating', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather data API call with low FWI
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 1, // Low fire weather index
                ffmc: 70,
                dmc: 5,
                dc: 100,
                isi: 1,
                bui: 10,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.OPEN_BURN);
    });
  });

  describe('getFireStatusByCoordinates', () => {
    it('should return null for coordinates outside Canada', async () => {
      const coordinates = { latitude: 40.7128, longitude: -74.006 }; // New York
      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 }; // Ottawa

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });

    it('should return fire status for valid coordinates with no nearby fires', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 }; // Ottawa

      // Mock nearby fires API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather data API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5, // Moderate fire weather index
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.RESTRICTED_BURN);
    });

    it('should return NO_BURN status when nearby active fires are present', async () => {
      const coordinates = { latitude: 45.0, longitude: -75.0 }; // Ottawa

      // Mock nearby fires API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                firename: 'Nearby Fire',
                stage_of_control: 'OC', // Out of Control
                agency: 'on',
                lat: 45.01,
                lon: -75.01,
              },
              geometry: {
                type: 'Point',
                coordinates: [-75.01, 45.01],
              },
            },
          ],
        }),
      });

      // Mock fire weather data API call (won't be used since nearby fires take precedence)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5,
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatusByCoordinates(coordinates);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
      expect(result?.restrictions?.[0]).toContain('Active wildfire within');
    });
  });

  describe('caching behavior', () => {
    it('should use cached data when available', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call (no active fires)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5,
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                dsr: 0.5,
                rep_date: new Date().toISOString(),
                name: 'Test Station',
                wmo: 12345,
                agency: 'MSC',
                prov: 'ON',
                lat: 43.6532,
                lon: -79.3832,
              },
            },
          ],
        }),
      });

      // First call - should make 2 API calls (fire data + fire weather)
      await provider.getFireStatus(location);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call should use cache for both
      await provider.getFireStatus(location);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fire weather integration', () => {
    it('should handle extreme fire weather index correctly', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call (no active fires)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather data API call with extreme FWI
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 35, // Extreme fire weather index
                ffmc: 95,
                dmc: 50,
                dc: 500,
                isi: 15,
                bui: 75,
                date: new Date().toISOString(),
                station: 'Test Station',
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
      expect(result?.restrictions).toContain('Fire danger rating: Extreme');
    });

    it('should handle fire weather API errors gracefully', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call (no active fires)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [],
        }),
      });

      // Mock fire weather API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await provider.getFireStatus(location);
      // Should still return a result, but without fire weather data
      expect(result).toBeNull();
    });
  });

  describe('parseGeoJsonFeatures', () => {
    it('should handle empty features', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      // Mock fire data API call (empty features)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: null,
        }),
      });

      // Mock fire weather API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                fwi: 5,
                ffmc: 85,
                dmc: 15,
                dc: 200,
                isi: 3,
                bui: 25,
                dsr: 0.5,
                rep_date: new Date().toISOString(),
                name: 'Test Station',
                wmo: 12345,
                agency: 'MSC',
                prov: 'ON',
                lat: 43.6532,
                lon: -79.3832,
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
    });

    it('should parse features with polygon geometry', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                firename: 'Test Fire',
                stage_of_control: 'active',
                agency: 'on',
                hectares: 100,
                startdate: '2024-01-01',
                response_type: 'full',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-79.4, 43.6],
                    [-79.3, 43.6],
                    [-79.3, 43.7],
                    [-79.4, 43.7],
                    [-79.4, 43.6],
                  ],
                ],
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
    });

    it('should parse features with point geometry', async () => {
      const location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                firename: 'Point Fire',
                stage_of_control: 'uc',
                agency: 'on',
              },
              geometry: {
                type: 'Point',
                coordinates: [-79.3832, 43.6532],
              },
            },
          ],
        }),
      });

      const result = await provider.getFireStatus(location);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(FireStatus.NO_BURN);
    });
  });

  describe('getAgencyCode', () => {
    it('should return correct agency codes for known provinces', async () => {
      const provinces = [
        { name: 'Alberta', code: 'ab' },
        { name: 'British Columbia', code: 'bc' },
        { name: 'Ontario', code: 'on' },
        { name: 'Quebec', code: 'qc' },
      ];

      for (const province of provinces) {
        const location = {
          province: province.name,
          state: province.name,
          county: 'Test',
          country: 'Canada',
        };

        // Mock fire data API call (first call)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ features: [] }),
        });

        // Mock fire weather API call (second call)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ features: [] }),
        });

        await provider.getFireStatus(location);

        // Check that the correct agency code was used in the fire data API call (first call)
        const firstCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 2];
        const url = firstCall[0];
        expect(url).toContain(`agency+%3D+%27${province.code}%27`);
      }
    });

    it('should handle unknown provinces with fallback', async () => {
      const location = {
        province: 'Unknown Province',
        state: 'Unknown Province',
        county: 'Test',
        country: 'Canada',
      };

      // This should return null before making API call due to unknown province check
      const result = await provider.getFireStatus(location);
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

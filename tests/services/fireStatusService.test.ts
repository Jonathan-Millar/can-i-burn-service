import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FireStatusService } from '../../src/services/fireStatusService';
import { FireStatus, Location, GPSCoordinates } from '../../src/types';
import { FireStatusNotFoundError } from '../../src/errors';

describe('FireStatusService', () => {
  let fireStatusService: FireStatusService;

  beforeEach(() => {
    fireStatusService = new FireStatusService();
    vi.useFakeTimers();
  });

  describe('getFireStatus', () => {
    it('should return fire status for known location (Toronto)', async () => {
      const location: Location = {
        province: 'Ontario',
        state: 'Ontario',
        county: 'Toronto',
        country: 'Canada',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBeOneOf([
        FireStatus.NO_BURN,
        FireStatus.RESTRICTED_BURN,
        FireStatus.OPEN_BURN,
      ]);
      expect(typeof result.jurisdiction).toBe('string');
      expect(result.valid_from).toBeInstanceOf(Date);
      expect(result.valid_to).toBeInstanceOf(Date);
    });

    it('should return fire status for known location (Vancouver)', async () => {
      const location: Location = {
        province: 'British Columbia',
        state: 'British Columbia',
        county: 'Vancouver',
        country: 'Canada',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBeOneOf([
        FireStatus.NO_BURN,
        FireStatus.RESTRICTED_BURN,
        FireStatus.OPEN_BURN,
      ]);
      expect(typeof result.jurisdiction).toBe('string');
      expect(result.valid_from).toBeInstanceOf(Date);
      expect(result.valid_to).toBeInstanceOf(Date);
    });

    it('should return fire status for US location (New York)', async () => {
      const location: Location = {
        province: 'New York',
        state: 'New York',
        county: 'New York County',
        country: 'United States',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.jurisdiction).toBe(
        'New York State Department of Environmental Conservation'
      );
      expect(result.restrictions).toContain('Permit required');
    });

    it('should return fallback status for unknown Canadian location in winter', async () => {
      vi.setSystemTime(new Date('2024-01-15'));

      const location: Location = {
        province: 'TestProvince123456789',
        state: 'TestProvince123456789',
        county: 'TestCounty123456789',
        country: 'Canada',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.OPEN_BURN);
      expect(result.jurisdiction).toBe('Provincial Fire Authority');
    });

    it('should return fallback status for unknown Canadian location in summer', async () => {
      vi.setSystemTime(new Date('2024-07-15'));

      const location: Location = {
        province: 'NonExistent Province',
        state: 'NonExistent Province',
        county: 'Unknown County',
        country: 'Canada',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.jurisdiction).toBe('Provincial Fire Authority');
      expect(result.restrictions).toContain(
        'Seasonal fire restrictions in effect'
      );
    });

    it('should return fallback status for unknown US location in winter', async () => {
      vi.setSystemTime(new Date('2024-01-15'));

      const location: Location = {
        province: 'Texas',
        state: 'Texas',
        county: 'Unknown County',
        country: 'United States',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.RESTRICTED_BURN);
      expect(result.jurisdiction).toBe('State Fire Authority');
      expect(result.restrictions).toContain('Permit may be required');
    });

    it('should return fallback status for unknown US location in summer', async () => {
      vi.setSystemTime(new Date('2024-07-15'));

      const location: Location = {
        province: 'Nevada',
        state: 'Nevada',
        county: 'Unknown County',
        country: 'United States',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.NO_BURN);
      expect(result.jurisdiction).toBe('State Fire Authority');
      expect(result.restrictions).toContain('High fire danger period');
    });

    it('should throw FireStatusNotFoundError for unknown location without fallback', async () => {
      vi.setSystemTime(new Date('2024-04-15')); // Spring month, no fallback

      const location: Location = {
        province: 'Unknown',
        state: 'Unknown',
        county: 'Unknown County',
        country: 'Unknown Country',
      };

      await expect(fireStatusService.getFireStatus(location)).rejects.toThrow(
        FireStatusNotFoundError
      );
    });

    it('should handle location with state instead of province', async () => {
      const location: Location = {
        province: '',
        state: 'California',
        county: 'Los Angeles County',
        country: 'United States',
      };

      const result = await fireStatusService.getFireStatus(location);

      expect(result.status).toBe(FireStatus.NO_BURN);
      expect(result.jurisdiction).toBe(
        'California Department of Forestry and Fire Protection'
      );
    });
  });

  describe('getFireStatusByCoordinates', () => {
    it('should return null for coordinates outside North America', async () => {
      const coordinates: GPSCoordinates = {
        latitude: 51.5074, // London, UK
        longitude: -0.1278,
      };

      const result =
        await fireStatusService.getFireStatusByCoordinates(coordinates);
      expect(result).toBeNull();
    });
  });

  describe('provider management', () => {
    it('should return list of available providers', () => {
      const providers = fireStatusService.getAvailableProviders();
      expect(providers).toContain('Canadian Wildland Fire Information System');
      expect(providers).toContain('NASA FIRMS');
    });

    it('should return coverage for specific provider', () => {
      const coverage = fireStatusService.getProviderCoverage(
        'Canadian Wildland Fire Information System'
      );
      expect(Array.isArray(coverage)).toBe(true);
    });

    it('should return empty array for unknown provider', () => {
      const coverage =
        fireStatusService.getProviderCoverage('Unknown Provider');
      expect(coverage).toEqual([]);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  FireServiceError,
  InvalidCoordinatesError,
  LocationNotFoundError,
  FireStatusNotFoundError,
  ExternalServiceError,
  ValidationError,
} from '../../src/errors';

describe('error classes', () => {
  describe('FireServiceError', () => {
    it('should create error with correct properties', () => {
      const error = new FireServiceError('Test message', 'TEST_CODE', 400);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('FireServiceError');
    });

    it('should default to status code 500', () => {
      const error = new FireServiceError('Test message', 'TEST_CODE');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('InvalidCoordinatesError', () => {
    it('should create error with correct message and properties', () => {
      const error = new InvalidCoordinatesError(91, 0);

      expect(error.message).toContain(
        'Invalid GPS coordinates: latitude 91, longitude 0'
      );
      expect(error.code).toBe('INVALID_COORDINATES');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('LocationNotFoundError', () => {
    it('should create error with correct message and properties', () => {
      const error = new LocationNotFoundError(43.6532, -79.3832);

      expect(error.message).toContain(
        'Unable to determine location for coordinates: 43.6532, -79.3832'
      );
      expect(error.code).toBe('LOCATION_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('FireStatusNotFoundError', () => {
    it('should create error with correct message and properties', () => {
      const error = new FireStatusNotFoundError('Ontario, Toronto');

      expect(error.message).toContain(
        'Fire status not available for location: Ontario, Toronto'
      );
      expect(error.code).toBe('FIRE_STATUS_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create error with service name and original error', () => {
      const originalError = new Error('Original error message');
      const error = new ExternalServiceError('TestService', originalError);

      expect(error.message).toContain(
        'External service error from TestService: Original error message'
      );
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.statusCode).toBe(503);
    });

    it('should handle missing original error', () => {
      const error = new ExternalServiceError('TestService');

      expect(error.message).toContain(
        'External service error from TestService: Unknown error'
      );
    });
  });

  describe('ValidationError', () => {
    it('should create error with field, value, and reason', () => {
      const error = new ValidationError(
        'latitude',
        91,
        'must be between -90 and 90'
      );

      expect(error.message).toContain(
        'Validation failed for field "latitude" with value "91": must be between -90 and 90'
      );
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });
});

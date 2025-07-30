import { describe, it, expect } from 'vitest';
import {
  validateCoordinates,
  isValidDate,
  isDateInRange,
} from '../../src/utils/validation';
import { InvalidCoordinatesError } from '../../src/errors';

describe('validation utils', () => {
  describe('validateCoordinates', () => {
    it('should pass for valid coordinates', () => {
      expect(() =>
        validateCoordinates({ latitude: 43.6532, longitude: -79.3832 })
      ).not.toThrow();
      expect(() =>
        validateCoordinates({ latitude: 0, longitude: 0 })
      ).not.toThrow();
      expect(() =>
        validateCoordinates({ latitude: 90, longitude: 180 })
      ).not.toThrow();
      expect(() =>
        validateCoordinates({ latitude: -90, longitude: -180 })
      ).not.toThrow();
    });

    it('should throw InvalidCoordinatesError for invalid latitude', () => {
      expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow(
        InvalidCoordinatesError
      );
      expect(() =>
        validateCoordinates({ latitude: -91, longitude: 0 })
      ).toThrow(InvalidCoordinatesError);
    });

    it('should throw InvalidCoordinatesError for invalid longitude', () => {
      expect(() =>
        validateCoordinates({ latitude: 0, longitude: 181 })
      ).toThrow(InvalidCoordinatesError);
      expect(() =>
        validateCoordinates({ latitude: 0, longitude: -181 })
      ).toThrow(InvalidCoordinatesError);
    });

    it('should throw InvalidCoordinatesError for NaN values', () => {
      expect(() =>
        validateCoordinates({ latitude: NaN, longitude: 0 })
      ).toThrow(InvalidCoordinatesError);
      expect(() =>
        validateCoordinates({ latitude: 0, longitude: NaN })
      ).toThrow(InvalidCoordinatesError);
    });

    it('should throw InvalidCoordinatesError for non-number values', () => {
      expect(() =>
        validateCoordinates({ latitude: 'invalid' as any, longitude: 0 })
      ).toThrow(InvalidCoordinatesError);
      expect(() =>
        validateCoordinates({ latitude: 0, longitude: null as any })
      ).toThrow(InvalidCoordinatesError);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-01'))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('not a date' as any)).toBe(false);
    });
  });

  describe('isDateInRange', () => {
    const validFrom = new Date('2024-01-01');
    const validTo = new Date('2024-12-31');

    it('should return true for dates within range', () => {
      expect(isDateInRange(new Date('2024-06-01'), validFrom, validTo)).toBe(
        true
      );
      expect(isDateInRange(validFrom, validFrom, validTo)).toBe(true);
      expect(isDateInRange(validTo, validFrom, validTo)).toBe(true);
    });

    it('should return false for dates outside range', () => {
      expect(isDateInRange(new Date('2023-12-31'), validFrom, validTo)).toBe(
        false
      );
      expect(isDateInRange(new Date('2025-01-01'), validFrom, validTo)).toBe(
        false
      );
    });
  });
});

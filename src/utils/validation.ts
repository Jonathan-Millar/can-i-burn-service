import { GPSCoordinates } from '../types';
import { InvalidCoordinatesError } from '../errors';

export const validateCoordinates = (coordinates: GPSCoordinates): void => {
  const { latitude, longitude } = coordinates;

  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new InvalidCoordinatesError(latitude, longitude);
  }

  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new InvalidCoordinatesError(latitude, longitude);
  }

  if (latitude < -90 || latitude > 90) {
    throw new InvalidCoordinatesError(latitude, longitude);
  }

  if (longitude < -180 || longitude > 180) {
    throw new InvalidCoordinatesError(latitude, longitude);
  }
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isDateInRange = (
  date: Date,
  validFrom: Date,
  validTo: Date
): boolean => {
  return date >= validFrom && date <= validTo;
};

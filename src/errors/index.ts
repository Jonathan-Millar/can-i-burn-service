export class FireServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'FireServiceError';
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidCoordinatesError extends FireServiceError {
  constructor(latitude: number, longitude: number) {
    super(
      `Invalid GPS coordinates: latitude ${latitude}, longitude ${longitude}. Latitude must be between -90 and 90, longitude between -180 and 180.`,
      'INVALID_COORDINATES',
      400
    );
  }
}

export class LocationNotFoundError extends FireServiceError {
  constructor(latitude: number, longitude: number) {
    super(
      `Unable to determine location for coordinates: ${latitude}, ${longitude}`,
      'LOCATION_NOT_FOUND',
      404
    );
  }
}

export class FireStatusNotFoundError extends FireServiceError {
  constructor(location: string) {
    super(
      `Fire status not available for location: ${location}`,
      'FIRE_STATUS_NOT_FOUND',
      404
    );
  }
}

export class ExternalServiceError extends FireServiceError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error from ${service}: ${
        originalError?.message || 'Unknown error'
      }`,
      'EXTERNAL_SERVICE_ERROR',
      503
    );
  }
}

export class ValidationError extends FireServiceError {
  constructor(field: string, value: unknown, reason: string) {
    super(
      `Validation failed for field "${field}" with value "${value}": ${reason}`,
      'VALIDATION_ERROR',
      400
    );
  }
}

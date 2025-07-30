"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ExternalServiceError = exports.FireStatusNotFoundError = exports.LocationNotFoundError = exports.InvalidCoordinatesError = exports.FireServiceError = void 0;
class FireServiceError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'FireServiceError';
        this.code = code;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.FireServiceError = FireServiceError;
class InvalidCoordinatesError extends FireServiceError {
    constructor(latitude, longitude) {
        super(`Invalid GPS coordinates: latitude ${latitude}, longitude ${longitude}. Latitude must be between -90 and 90, longitude between -180 and 180.`, 'INVALID_COORDINATES', 400);
    }
}
exports.InvalidCoordinatesError = InvalidCoordinatesError;
class LocationNotFoundError extends FireServiceError {
    constructor(latitude, longitude) {
        super(`Unable to determine location for coordinates: ${latitude}, ${longitude}`, 'LOCATION_NOT_FOUND', 404);
    }
}
exports.LocationNotFoundError = LocationNotFoundError;
class FireStatusNotFoundError extends FireServiceError {
    constructor(location) {
        super(`Fire status not available for location: ${location}`, 'FIRE_STATUS_NOT_FOUND', 404);
    }
}
exports.FireStatusNotFoundError = FireStatusNotFoundError;
class ExternalServiceError extends FireServiceError {
    constructor(service, originalError) {
        super(`External service error from ${service}: ${originalError?.message || 'Unknown error'}`, 'EXTERNAL_SERVICE_ERROR', 503);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class ValidationError extends FireServiceError {
    constructor(field, value, reason) {
        super(`Validation failed for field "${field}" with value "${value}": ${reason}`, 'VALIDATION_ERROR', 400);
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=index.js.map
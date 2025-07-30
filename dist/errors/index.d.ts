export declare class FireServiceError extends Error {
  readonly code: string;
  readonly statusCode: number;
  constructor(message: string, code: string, statusCode?: number);
}
export declare class InvalidCoordinatesError extends FireServiceError {
  constructor(latitude: number, longitude: number);
}
export declare class LocationNotFoundError extends FireServiceError {
  constructor(latitude: number, longitude: number);
}
export declare class FireStatusNotFoundError extends FireServiceError {
  constructor(location: string);
}
export declare class ExternalServiceError extends FireServiceError {
  constructor(service: string, originalError?: Error);
}
export declare class ValidationError extends FireServiceError {
  constructor(field: string, value: unknown, reason: string);
}
//# sourceMappingURL=index.d.ts.map

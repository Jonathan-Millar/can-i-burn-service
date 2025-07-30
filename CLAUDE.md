# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Start TypeScript compiler in watch mode
- `npm run typecheck` - Run TypeScript type checking without emitting files

### Testing
- `npm test` - Run all tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Run tests with coverage reporting
- Tests are located in `tests/` directory, mirroring the `src/` structure

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format code with Prettier

## Architecture Overview

This is a TypeScript library that provides fire watch status information based on GPS coordinates. The service determines whether burning is allowed in a given location.

### Core Architecture
The service follows a layered architecture with three main service classes:

1. **CanIBurnService** (main entry point) - Orchestrates the workflow by:
   - Validating GPS coordinates
   - Getting location information via LocationService
   - Retrieving fire status via FireStatusService
   - Returning combined fire watch response

2. **LocationService** - Handles reverse geocoding:
   - Converts GPS coordinates to location information (province/state, county, country)
   - Uses mock data with distance-based fallback for nearby locations
   - Provides country-level approximation for unknown coordinates

3. **FireStatusService** - Manages fire status data:
   - Maintains fire status information by location
   - Provides seasonal fallback logic for Canada/US when specific data unavailable
   - Returns status (NO_BURN=0, RESTRICTED_BURN=1, OPEN_BURN=2) with validity dates

### Key Data Flow
`GPS Coordinates → Location → Fire Status → Combined Response`

### Type System
- **GPSCoordinates**: latitude/longitude interface
- **Location**: province/state, county, country structure  
- **FireStatus**: enum (NO_BURN, RESTRICTED_BURN, OPEN_BURN)
- **FireWatchResponse**: main response combining status, location, coordinates, jurisdiction, and restrictions

### Error Handling
Custom error hierarchy extending FireServiceError with specific error types:
- InvalidCoordinatesError (400)
- LocationNotFoundError (404) 
- FireStatusNotFoundError (404)
- ExternalServiceError (503)
- ValidationError (400)

### Current Implementation Notes
- **LocationService**: Uses Nominatim API (OpenStreetMap) for real geocoding data
- **FireStatusService**: Integrated with real New Brunswick fire watch API + mock data for other regions
- **NewBrunswickFireService**: Fetches real-time fire status from NB government API
- Real-time data available for all 15 New Brunswick counties (Albert, Carleton, Charlotte, Gloucester, Kent, Kings, Madawaska, Northumberland, Queens, Restigouche, Saint John, Sunbury, Victoria, Westmorland, York)
- Nominatim API provides accurate county/district information for coordinates
- All validation handled through utils/validation.ts
- Both services include proper User-Agent headers for API compliance
- NB fire data updates daily and includes time-valid burning conditions

### Testing Strategy
- Unit tests for each service and utility function
- Tests located in `tests/` mirroring `src/` structure
- Vitest configuration with Node environment and coverage reporting
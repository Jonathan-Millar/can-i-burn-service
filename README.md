# 🔥 Can I Burn Service

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

> A comprehensive TypeScript service for determining fire burning restrictions and status based on GPS coordinates and location data.

- **🌍 Multi-Provider Support**: Integrates with multiple fire data providers (CWFIS, NASA FIRMS)
- **📍 GPS Coordinate Lookup**: Get fire status using precise GPS coordinates
- **🗺️ Location-Based Queries**: Support for location-based fire status queries
- **🔄 Fallback System**: Intelligent fallback between coordinate and location-based lookups
- **🛡️ Type Safety**: Full TypeScript support with comprehensive type definitions


### 🚀 Quick Start

#### Installation

```bash
npm install can-i-burn-service
```

#### Basic Usage

```typescript
import { CanIBurnService, GPSCoordinates, FireStatus } from 'can-i-burn-service';

const service = new CanIBurnService();

// Check fire status by GPS coordinates
const coordinates: GPSCoordinates = {
  latitude: 45.5017,
  longitude: -73.5673
};

try {
  const result = await service.getFireWatchStatus(coordinates);
  
  console.log(`Fire Status: ${FireStatus[result.status]}`);
  console.log(`Location: ${result.location.province}, ${result.location.country}`);
  console.log(`Valid from: ${result.valid_from} to ${result.valid_to}`);
  console.log(`Jurisdiction: ${result.jurisdiction}`);
  
  if (result.restrictions) {
    console.log(`Restrictions: ${result.restrictions.join(', ')}`);
  }
} catch (error) {
  console.error('Error checking fire status:', error);
}
```

### 📖 API Reference

#### Core Classes

##### `CanIBurnService`

The main service class for fire status queries.

```typescript
class CanIBurnService {
  async getFireWatchStatus(coordinates: GPSCoordinates): Promise<FireWatchResponse>
}
```

##### `LocationService`

Handles reverse geocoding and location-based operations.

```typescript
class LocationService {
  async reverseGeocode(coordinates: GPSCoordinates): Promise<ReverseGeocodeResult>
}
```

##### `FireStatusService`

Manages fire status data from multiple providers.

```typescript
class FireStatusService {
  async getFireStatus(location: Location): Promise<FireStatusData | null>
  async getFireStatusByCoordinates(coordinates: GPSCoordinates): Promise<FireStatusData | null>
  getAvailableProviders(): string[]
  getProviderCoverage(): Record<string, string[]>
}
```

#### Data Providers

##### `CWFISProvider`

Canadian Wildland Fire Information System provider.

- **Coverage**: Canada
- **Features**: Fire danger ratings, active fire data, weather conditions
- **Data Sources**: Government of Canada CWFIS API

##### `NASAFirmsProvider`

NASA Fire Information for Resource Management System provider.

- **Coverage**: Global
- **Features**: Satellite fire detections, real-time fire data
- **Data Sources**: NASA FIRMS API

#### Types

##### `FireStatus`

```typescript
enum FireStatus {
  NO_BURN = 0,        // No burning allowed
  RESTRICTED_BURN = 1, // Restricted burning conditions
  OPEN_BURN = 2       // Open burning allowed
}
```

##### `GPSCoordinates`

```typescript
interface GPSCoordinates {
  latitude: number;   // Latitude in decimal degrees
  longitude: number;  // Longitude in decimal degrees
}
```

##### `FireWatchResponse`

```typescript
interface FireWatchResponse {
  status: FireStatus;
  valid_from: Date;
  valid_to: Date;
  location: Location;
  coordinates: GPSCoordinates;
  jurisdiction?: string;
  restrictions?: string[];
}
```

##### `Location`

```typescript
interface Location {
  province: string;
  state: string;
  county: string;
  country: string;
}
```

### 🛠️ Development

#### Prerequisites

- Node.js 18+ 
- npm or yarn

#### Setup

```bash
# Clone the repository
git clone <repository-url>
cd can-i-burn-service

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

#### Project Structure

```
src/
├── errors/           # Custom error classes
├── services/         # Core service classes
│   ├── interfaces/   # Service interfaces
│   └── providers/    # Data provider implementations
├── types/            # TypeScript type definitions
└── utils/            # Utility functions

tests/
├── __mocks__/        # Test mocks
├── errors/           # Error class tests
├── services/         # Service tests
│   └── providers/    # Provider tests
└── utils/            # Utility tests
```

#### Testing

The project uses [Vitest](https://vitest.dev/) for testing with comprehensive coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

#### Code Quality

- **TypeScript**: Full type safety with strict mode enabled
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Consistent code formatting
- **Vitest**: Modern testing framework with coverage reporting

### 🔧 Configuration

#### Environment Variables

The service can be configured using environment variables:

```bash
# API endpoints (optional - defaults provided)
CWFIS_API_URL=https://cwfis.cfs.nrcan.gc.ca/
NASA_FIRMS_API_URL=https://firms.modaps.eosdis.nasa.gov/

# API keys (if required by providers)
NASA_FIRMS_API_KEY=your_api_key_here
```

### Provider Configuration

Providers can be configured individually:

```typescript
import { FireStatusService, CWFISProvider, NASAFirmsProvider } from 'can-i-burn-service';

const fireStatusService = new FireStatusService();

// Providers are automatically registered, but you can customize them
const cwfisProvider = new CWFISProvider();
const nasaProvider = new NASAFirmsProvider('your_api_key');
```

### 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

#### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Lint your code: `npm run lint`
7. Format your code: `npm run format`
8. Commit your changes: `git commit -m 'Add amazing feature'`
9. Push to the branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

#### Code Standards

- Follow TypeScript best practices
- Maintain test coverage above 85%
- Use meaningful commit messages
- Document new features and APIs
- Follow the existing code style

### 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- **Canadian Wildland Fire Information System (CWFIS)** for providing comprehensive fire data for Canada
- **NASA FIRMS** for global satellite fire detection data
- **OpenStreetMap Nominatim** for reverse geocoding services

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/your-username/can-i-burn-service/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/can-i-burn-service/discussions)

## 🗺️ Roadmap

- [ ] **Additional Providers**: Support for more regional fire data providers
- [ ] **Caching Layer**: Implement intelligent caching for improved performance
- [ ] **Real-time Updates**: WebSocket support for real-time fire status updates
- [ ] **Mobile SDK**: React Native and Flutter SDK development
- [ ] **GraphQL API**: GraphQL endpoint for flexible data querying

---

<div align="center">
  <strong>Built with ❤️ for fire safety and environmental awareness</strong>
</div>

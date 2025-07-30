import {
  GPSCoordinates,
  Location,
  FireStatus,
  FireStatusData,
} from '../../types';
import {
  FireDataProvider,
  FireDangerRating,
} from '../interfaces/fireDataProvider';
import { ExternalServiceError } from '../../errors';

interface CWFISFireData {
  firename: string;
  lat: number;
  lon: number;
  startdate: string;
  hectares: number;
  stage_of_control: string;
  agency: string;
  response_type: string;
}

export class CWFISProvider implements FireDataProvider {
  private readonly baseUrl = 'https://cwfis.cfs.nrcan.gc.ca/geoserver/ows';
  private readonly userAgent = 'CanIBurnService/1.0';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  getName(): string {
    return 'Canadian Wildland Fire Information System';
  }

  getCoverage(): string[] {
    return ['Canada'];
  }

  isAvailableForLocation(location: Location): boolean {
    return location.country === 'Canada';
  }

  isAvailableForCoordinates(coordinates: GPSCoordinates): boolean {
    const { latitude, longitude } = coordinates;
    // Canada boundaries (approximate)
    return (
      latitude >= 41.7 &&
      latitude <= 83.1 &&
      longitude >= -141 &&
      longitude <= -52.6
    );
  }

  async getFireStatus(location: Location): Promise<FireStatusData | null> {
    if (!this.isAvailableForLocation(location)) {
      return null;
    }

    // Check if this is a known Canadian province/territory
    const knownProvinces = [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Northwest Territories',
      'Nova Scotia',
      'Nunavut',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Yukon',
    ];

    if (!knownProvinces.includes(location.province)) {
      return null; // Let fallback method handle unknown provinces
    }

    try {
      const fireData = await this.getCWFISFireData(location.province);
      const dangerRating = await this.getFireDangerRating(location);

      return this.interpretFireStatus(fireData, dangerRating, location);
    } catch (error) {
      console.warn(
        `CWFIS provider failed for location ${location.province}: ${error}`
      );
      return null;
    }
  }

  async getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null> {
    if (!this.isAvailableForCoordinates(coordinates)) {
      return null;
    }

    try {
      const nearbyFires = await this.getNearbyFires(coordinates);
      const dangerRating =
        await this.getFireDangerRatingByCoordinates(coordinates);

      return this.interpretFireStatusFromCoordinates(
        nearbyFires,
        dangerRating,
        coordinates
      );
    } catch (error) {
      console.warn(
        `CWFIS provider failed for coordinates ${coordinates.latitude},${coordinates.longitude}: ${error}`
      );
      return null;
    }
  }

  private async getCWFISFireData(province: string): Promise<CWFISFireData[]> {
    const cacheKey = `fires_${province}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // WFS request for active fires
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'public:activefires_current',
      outputFormat: 'application/json',
      CQL_FILTER: `agency = '${this.getAgencyCode(province)}'`,
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(
        `CWFIS API error: ${response.status} ${response.statusText}`
      );
    }

    const geoJson = await response.json();
    const fireData = this.parseGeoJsonFeatures(geoJson);

    this.cache.set(cacheKey, { data: fireData, timestamp: Date.now() });
    return fireData;
  }

  private async getNearbyFires(
    coordinates: GPSCoordinates,
    radiusKm: number = 50
  ): Promise<CWFISFireData[]> {
    const cacheKey = `nearby_${coordinates.latitude.toFixed(3)}_${coordinates.longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Create bounding box
    const latOffset = radiusKm / 111; // ~1 degree = 111km
    const lonOffset =
      radiusKm / (111 * Math.cos((coordinates.latitude * Math.PI) / 180));

    const bbox = [
      coordinates.longitude - lonOffset,
      coordinates.latitude - latOffset,
      coordinates.longitude + lonOffset,
      coordinates.latitude + latOffset,
    ].join(',');

    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'public:activefires_current',
      outputFormat: 'application/json',
      bbox: bbox,
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(
        `CWFIS API error: ${response.status} ${response.statusText}`
      );
    }

    const geoJson = await response.json();
    const fireData = this.parseGeoJsonFeatures(geoJson);

    this.cache.set(cacheKey, { data: fireData, timestamp: Date.now() });
    return fireData;
  }

  private async getFireDangerRating(
    location: Location
  ): Promise<FireDangerRating | null> {
    try {
      // Get coordinates for the province/location to query fire weather data
      const coordinates = await this.getProvinceCoordinates(location.province);
      if (!coordinates) {
        return null;
      }

      return await this.getFireDangerRatingByCoordinates(coordinates);
    } catch (error) {
      console.warn(
        `Failed to get fire danger rating for ${location.province}: ${error}`
      );
      return null;
    }
  }

  private async getFireDangerRatingByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireDangerRating | null> {
    const cacheKey = `fire_weather_${coordinates.latitude.toFixed(3)}_${coordinates.longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Query CWFIS fire weather data using WFS
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'public:firewx_stns_current', // Fire Weather Stations Current layer
        outputFormat: 'application/json',
        CQL_FILTER: `DWITHIN(the_geom, POINT(${coordinates.longitude} ${coordinates.latitude}), 50000, meters)`, // Within 50km
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(
          `CWFIS Fire Weather API error: ${response.status} ${response.statusText}`
        );
      }

      const geoJson = await response.json();
      const fireWeatherData = this.parseFireWeatherData(geoJson);

      if (!fireWeatherData) {
        return null;
      }

      const rating = this.calculateFireDangerRating(fireWeatherData);
      this.cache.set(cacheKey, { data: rating, timestamp: Date.now() });

      return rating;
    } catch (error) {
      console.warn(`Failed to fetch CWFIS fire weather data: ${error}`);
      return null;
    }
  }

  private parseGeoJsonFeatures(geoJson: any): CWFISFireData[] {
    if (!geoJson.features) {
      return [];
    }

    return geoJson.features.map((feature: any) => {
      const props = feature.properties;
      const coords = this.extractCoordinates(feature.geometry);

      return {
        firename: props.firename || '',
        lat: props.lat || coords.latitude,
        lon: props.lon || coords.longitude,
        startdate: props.startdate || '',
        hectares: props.hectares || 0,
        stage_of_control: props.stage_of_control || '',
        agency: props.agency || '',
        response_type: props.response_type || '',
      };
    });
  }

  private extractCoordinates(geometry: any): {
    latitude: number;
    longitude: number;
  } {
    // Extract centroid from polygon geometry
    if (
      geometry.type === 'Polygon' &&
      geometry.coordinates &&
      geometry.coordinates[0]
    ) {
      const coords = geometry.coordinates[0];
      const latSum = coords.reduce(
        (sum: number, coord: number[]) => sum + coord[1],
        0
      );
      const lonSum = coords.reduce(
        (sum: number, coord: number[]) => sum + coord[0],
        0
      );
      return {
        latitude: latSum / coords.length,
        longitude: lonSum / coords.length,
      };
    }

    if (geometry.type === 'Point' && geometry.coordinates) {
      return {
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
      };
    }

    return { latitude: 0, longitude: 0 };
  }

  private interpretFireStatus(
    fireData: CWFISFireData[],
    dangerRating: FireDangerRating | null,
    location: Location
  ): FireStatusData | null {
    const now = new Date();
    const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Check for active fires in the province
    const activeFires = fireData.filter(
      (fire) =>
        fire.stage_of_control.toLowerCase().includes('uc') ||
        fire.stage_of_control.toLowerCase().includes('oc') ||
        fire.stage_of_control.toLowerCase().includes('active')
    );

    if (activeFires.length > 0) {
      return {
        status: FireStatus.NO_BURN,
        valid_from: now,
        valid_to: validTo,
        jurisdiction: 'Canadian Wildland Fire Information System',
        restrictions: [
          `${activeFires.length} active wildfire(s) in ${location.province}`,
          'All burning prohibited during active fire conditions',
        ],
      };
    }

    // Base decision on fire danger rating
    if (dangerRating) {
      switch (dangerRating.level) {
        case 'Extreme':
        case 'Very High':
          return {
            status: FireStatus.NO_BURN,
            valid_from: now,
            valid_to: validTo,
            jurisdiction: 'Canadian Wildland Fire Information System',
            restrictions: [
              `Fire danger rating: ${dangerRating.level}`,
              'No open burning permitted',
            ],
          };

        case 'High':
          return {
            status: FireStatus.RESTRICTED_BURN,
            valid_from: now,
            valid_to: validTo,
            jurisdiction: 'Canadian Wildland Fire Information System',
            restrictions: [
              `Fire danger rating: ${dangerRating.level}`,
              'Restricted burning - permits required',
            ],
          };

        case 'Moderate':
          return {
            status: FireStatus.RESTRICTED_BURN,
            valid_from: now,
            valid_to: validTo,
            jurisdiction: 'Canadian Wildland Fire Information System',
            restrictions: [
              'Moderate fire danger',
              'Exercise caution when burning',
            ],
          };

        case 'Low':
          return {
            status: FireStatus.OPEN_BURN,
            valid_from: now,
            valid_to: validTo,
            jurisdiction: 'Canadian Wildland Fire Information System',
          };
      }
    }

    return null;
  }

  private interpretFireStatusFromCoordinates(
    nearbyFires: CWFISFireData[],
    dangerRating: FireDangerRating | null,
    coordinates: GPSCoordinates
  ): FireStatusData | null {
    const now = new Date();
    const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Check for nearby active fires
    const closeFires = nearbyFires.filter((fire) => {
      const distance = this.calculateDistance(coordinates, {
        latitude: fire.lat,
        longitude: fire.lon,
      });
      return (
        distance < 25 &&
        (fire.stage_of_control.toLowerCase().includes('uc') ||
          fire.stage_of_control.toLowerCase().includes('oc') ||
          fire.stage_of_control.toLowerCase().includes('active'))
      );
    });

    if (closeFires.length > 0) {
      const closestDistance = Math.min(
        ...closeFires.map((fire) =>
          this.calculateDistance(coordinates, {
            latitude: fire.lat,
            longitude: fire.lon,
          })
        )
      );

      return {
        status: FireStatus.NO_BURN,
        valid_from: now,
        valid_to: validTo,
        jurisdiction: 'Canadian Wildland Fire Information System',
        restrictions: [
          `Active wildfire within ${closestDistance.toFixed(1)}km`,
          'No burning permitted due to nearby fire activity',
        ],
      };
    }

    // Fall back to danger rating
    return this.interpretFireStatus([], dangerRating, {
      province: '',
      state: '',
      county: '',
      country: 'Canada',
    });
  }

  private getAgencyCode(province: string): string {
    const agencyMap: { [key: string]: string } = {
      Alberta: 'ab',
      'British Columbia': 'bc',
      Manitoba: 'mb',
      'New Brunswick': 'nb',
      'Newfoundland and Labrador': 'nl',
      'Northwest Territories': 'nt',
      'Nova Scotia': 'ns',
      Nunavut: 'nu',
      Ontario: 'on',
      'Prince Edward Island': 'pe',
      Quebec: 'qc',
      Saskatchewan: 'sk',
      Yukon: 'yt',
    };

    return agencyMap[province] || province.toLowerCase().substring(0, 2);
  }

  private calculateDistance(
    coord1: GPSCoordinates,
    coord2: GPSCoordinates
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getProvinceCoordinates(province: string): GPSCoordinates | null {
    // Approximate center coordinates for Canadian provinces/territories
    const provinceCoords: { [key: string]: GPSCoordinates } = {
      Alberta: { latitude: 53.9333, longitude: -116.5765 },
      'British Columbia': { latitude: 53.7267, longitude: -127.6476 },
      Manitoba: { latitude: 53.7609, longitude: -98.8139 },
      'New Brunswick': { latitude: 46.5653, longitude: -66.4619 },
      'Newfoundland and Labrador': { latitude: 53.1355, longitude: -57.6604 },
      'Northwest Territories': { latitude: 64.8255, longitude: -124.8457 },
      'Nova Scotia': { latitude: 44.682, longitude: -63.7443 },
      Nunavut: { latitude: 70.2998, longitude: -83.1076 },
      Ontario: { latitude: 51.2538, longitude: -85.3232 },
      'Prince Edward Island': { latitude: 46.5107, longitude: -63.4168 },
      Quebec: { latitude: 53.9214, longitude: -73.2492 },
      Saskatchewan: { latitude: 52.9399, longitude: -106.4509 },
      Yukon: { latitude: 64.0685, longitude: -139.0686 },
    };

    return provinceCoords[province] || null;
  }

  private parseFireWeatherData(geoJson: any): any | null {
    if (!geoJson.features || geoJson.features.length === 0) {
      return null;
    }

    // Get the closest fire weather station data
    const feature = geoJson.features[0];
    const props = feature.properties;

    return {
      fwi: props.fwi || 0, // Fire Weather Index
      ffmc: props.ffmc || 0, // Fine Fuel Moisture Code
      dmc: props.dmc || 0, // Duff Moisture Code
      dc: props.dc || 0, // Drought Code
      isi: props.isi || 0, // Initial Spread Index
      bui: props.bui || 0, // Buildup Index
      dsr: props.dsr || 0, // Daily Severity Rating
      date: props.rep_date || new Date().toISOString(), // Updated field name
      station: props.name || 'Unknown', // Updated field name
      wmo: props.wmo || null, // WMO station ID
      agency: props.agency || '', // Agency code
      prov: props.prov || '', // Province
      lat: props.lat || 0, // Latitude
      lon: props.lon || 0, // Longitude
    };
  }

  private calculateFireDangerRating(fireWeatherData: any): FireDangerRating {
    const fwi = fireWeatherData.fwi || 0;
    const now = new Date();
    const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Fire Weather Index classification based on Canadian standards
    if (fwi >= 30) {
      return {
        level: 'Extreme',
        index: 5,
        valid_from: now,
        valid_to: validTo,
      };
    } else if (fwi >= 17) {
      return {
        level: 'Very High',
        index: 4,
        valid_from: now,
        valid_to: validTo,
      };
    } else if (fwi >= 8) {
      return {
        level: 'High',
        index: 3,
        valid_from: now,
        valid_to: validTo,
      };
    } else if (fwi >= 3) {
      return {
        level: 'Moderate',
        index: 2,
        valid_from: now,
        valid_to: validTo,
      };
    } else {
      return {
        level: 'Low',
        index: 1,
        valid_from: now,
        valid_to: validTo,
      };
    }
  }
}

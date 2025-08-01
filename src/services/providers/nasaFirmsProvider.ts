import {
  GPSCoordinates,
  Location,
  FireStatus,
  FireStatusData,
} from '../../types';
import {
  FireDataProvider,
  FireDetection,
} from '../interfaces/fireDataProvider';
import { ExternalServiceError } from '../../errors';

export class NASAFirmsProvider implements FireDataProvider {
  private readonly baseUrl =
    'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  private readonly mapKey: string;
  private readonly userAgent = 'CanIBurnService/1.0';
  private readonly proximityRadius = 10; // km radius for fire detection
  private readonly cache = new Map<
    string,
    { data: FireDetection[]; timestamp: number }
  >();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  constructor(mapKey?: string) {
    this.mapKey =
      mapKey !== undefined ? mapKey : process.env.NASA_FIRMS_MAP_KEY || '';
    if (!this.mapKey) {
      console.warn(
        'NASA FIRMS MAP_KEY not provided. Fire detection will be limited.'
      );
    }
  }

  getName(): string {
    return 'NASA FIRMS';
  }

  getCoverage(): string[] {
    return ['United States', 'Canada', 'Global'];
  }

  isAvailableForLocation(location: Location): boolean {
    return (
      location.country === 'United States' || location.country === 'Canada'
    );
  }

  isAvailableForCoordinates(coordinates: GPSCoordinates): boolean {
    const { latitude, longitude } = coordinates;
    // North America coverage (primary focus)
    return (
      latitude >= 25 && latitude <= 85 && longitude >= -170 && longitude <= -50
    );
  }

  async getFireStatus(location: Location): Promise<FireStatusData | null> {
    // NASA FIRMS provides fire detection data, not regulatory burn status
    // We'll need to infer status based on nearby fire activity
    return null;
  }

  async getFireStatusByCoordinates(
    coordinates: GPSCoordinates
  ): Promise<FireStatusData | null> {
    if (!this.mapKey || this.mapKey.trim() === '') {
      return null;
    }

    try {
      const fireDetections = await this.getNearbyFireDetections(coordinates);
      return this.inferFireStatusFromDetections(fireDetections, coordinates);
    } catch (error) {
      throw new ExternalServiceError('NASA FIRMS', error as Error);
    }
  }

  private async getNearbyFireDetections(
    coordinates: GPSCoordinates
  ): Promise<FireDetection[]> {
    const cacheKey = `${coordinates.latitude.toFixed(3)},${coordinates.longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const { latitude, longitude } = coordinates;
    const days = 7; // Look back 7 days for fire activity

    // Create bounding box around coordinates
    const latOffset = this.proximityRadius / 111; // ~1 degree = 111km
    const lonOffset =
      this.proximityRadius / (111 * Math.cos((latitude * Math.PI) / 180));

    const minLat = latitude - latOffset;
    const maxLat = latitude + latOffset;
    const minLon = longitude - lonOffset;
    const maxLon = longitude + lonOffset;

    const area = `${minLon},${minLat},${maxLon},${maxLat}`;
    const url = `${this.baseUrl}/${this.mapKey}/VIIRS_SNPP_NRT/${area}/${days}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('NASA FIRMS rate limit exceeded');
      }
      throw new Error(
        `NASA FIRMS API error: ${response.status} ${response.statusText}`
      );
    }

    const csvData = await response.text();
    const detections = this.parseCSVData(csvData);

    this.cache.set(cacheKey, { data: detections, timestamp: Date.now() });
    return detections;
  }

  private parseCSVData(csvData: string): FireDetection[] {
    const lines = csvData.trim().split('\n');
    if (lines.length <= 1) {
      return [];
    }

    const headers = lines[0].split(',');
    const detections: FireDetection[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      try {
        // Format time from HHMM to HH:MM:SS
        const timeStr = values[6];
        const formattedTime =
          timeStr.length === 4
            ? `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00`
            : '00:00:00';

        const detection: FireDetection = {
          latitude: parseFloat(values[0]),
          longitude: parseFloat(values[1]),
          brightness: parseFloat(values[2]) || undefined,
          datetime: new Date(values[5] + 'T' + formattedTime + 'Z'),
          satellite: values[7] || undefined,
          instrument: values[8] || undefined,
          confidence: parseFloat(values[9]) || 0,
        };

        if (detection.confidence >= 50) {
          // Only include high-confidence detections
          detections.push(detection);
        }
      } catch (error) {
        // Skip malformed rows
        continue;
      }
    }

    return detections;
  }

  private inferFireStatusFromDetections(
    detections: FireDetection[],
    coordinates: GPSCoordinates
  ): FireStatusData | null {
    if (detections.length === 0) {
      return null;
    }

    // Calculate fire activity metrics
    const recentDetections = detections.filter(
      (d) => Date.now() - d.datetime.getTime() < 72 * 60 * 60 * 1000 // Last 72 hours
    );

    const highConfidenceDetections = recentDetections.filter(
      (d) => d.confidence >= 80
    );
    const nearbyDetections = recentDetections.filter(
      (d) =>
        this.calculateDistance(coordinates, {
          latitude: d.latitude,
          longitude: d.longitude,
        }) < 5
    );

    const now = new Date();
    const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Valid for 24 hours

    // Determine fire status based on detection patterns
    if (nearbyDetections.length > 0 || highConfidenceDetections.length >= 3) {
      return {
        status: FireStatus.NO_BURN,
        valid_from: now,
        valid_to: validTo,
        jurisdiction: 'NASA FIRMS Fire Detection',
        restrictions: [
          'Active fire detected in area',
          'No burning recommended due to fire activity',
        ],
      };
    }

    if (recentDetections.length >= 2) {
      return {
        status: FireStatus.RESTRICTED_BURN,
        valid_from: now,
        valid_to: validTo,
        jurisdiction: 'NASA FIRMS Fire Detection',
        restrictions: [
          'Recent fire activity detected',
          'Exercise extreme caution',
        ],
      };
    }

    return null; // No significant fire activity detected
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
}

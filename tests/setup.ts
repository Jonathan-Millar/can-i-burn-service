import { expect, vi } from 'vitest';

// Extend Vitest's expect interface
interface CustomMatchers<R = unknown> {
  toBeOneOf(expected: any[]): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Add custom matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);

    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Mock fetch globally
global.fetch = vi.fn();

// Function to find closest mock response
const findClosestMockResponse = (lat: number, lon: number): any | null => {
  const mockResponses = [
    // Toronto coordinates
    {
      lat: 43.6532,
      lon: -79.3832,
      response: {
        address: {
          county: 'Golden Horseshoe',
          state: 'Ontario',
          province: 'Ontario',
          country: 'Canada',
          country_code: 'ca',
        },
        display_name: 'Toronto, Golden Horseshoe, Ontario, Canada',
      },
    },
    // Vancouver coordinates
    {
      lat: 49.2827,
      lon: -123.1207,
      response: {
        address: {
          county: 'Metro Vancouver Regional District',
          state: 'British Columbia',
          province: 'British Columbia',
          country: 'Canada',
          country_code: 'ca',
        },
        display_name:
          'Vancouver, Metro Vancouver Regional District, British Columbia, Canada',
      },
    },
    // Calgary coordinates
    {
      lat: 51.0447,
      lon: -114.0719,
      response: {
        address: {
          county: 'Calgary',
          state: 'Alberta',
          province: 'Alberta',
          country: 'Canada',
          country_code: 'ca',
        },
        display_name: 'Calgary, Alberta, Canada',
      },
    },
    // New York coordinates
    {
      lat: 40.7128,
      lon: -74.006,
      response: {
        address: {
          county: 'New York County',
          state: 'New York',
          country: 'United States',
          country_code: 'us',
        },
        display_name: 'New York, New York County, New York, United States',
      },
    },
    // Los Angeles coordinates
    {
      lat: 34.0522,
      lon: -118.2437,
      response: {
        address: {
          county: 'Los Angeles County',
          state: 'California',
          country: 'United States',
          country_code: 'us',
        },
        display_name:
          'Los Angeles, Los Angeles County, California, United States',
      },
    },
    // Manitoba coordinates
    {
      lat: 55.0,
      lon: -100.0,
      response: {
        address: {
          county: 'Manitoba',
          state: 'Manitoba',
          province: 'Manitoba',
          country: 'Canada',
          country_code: 'ca',
        },
        display_name: 'Manitoba, Canada',
      },
    },
    // Texas coordinates
    {
      lat: 35.0,
      lon: -100.0,
      response: {
        address: {
          county: 'Texas County',
          state: 'Texas',
          country: 'United States',
          country_code: 'us',
        },
        display_name: 'Texas, United States',
      },
    },
    // Toronto nearby coordinates
    {
      lat: 43.65,
      lon: -79.38,
      response: {
        address: {
          county: 'Golden Horseshoe',
          state: 'Ontario',
          province: 'Ontario',
          country: 'Canada',
          country_code: 'ca',
        },
        display_name: 'Toronto Area, Golden Horseshoe, Ontario, Canada',
      },
    },
  ];

  // Find the closest match within a reasonable distance (0.1 degrees)
  for (const mock of mockResponses) {
    const latDiff = Math.abs(lat - mock.lat);
    const lonDiff = Math.abs(lon - mock.lon);
    if (latDiff < 0.1 && lonDiff < 0.1) {
      return mock.response;
    }
  }

  return null;
};

// Setup fetch mock implementation
(global.fetch as any).mockImplementation((url: string) => {
  // Handle Nominatim API calls
  if (url.includes('nominatim.openstreetmap.org')) {
    const urlObj = new URL(url);
    const lat = urlObj.searchParams.get('lat');
    const lon = urlObj.searchParams.get('lon');

    if (lat && lon) {
      const response = findClosestMockResponse(
        parseFloat(lat),
        parseFloat(lon)
      );

      if (response) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response),
        });
      }
    }

    // Return empty response for unknown coordinates
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ address: null }),
    });
  }

  // Handle CWFIS API calls
  if (url.includes('cwfis.cfs.nrcan.gc.ca')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ features: [] }),
    });
  }

  // Default response for other APIs
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const errors_1 = require("../errors");
const validation_1 = require("../utils/validation");
class LocationService {
    nominatimBaseUrl = 'https://nominatim.openstreetmap.org/reverse';
    userAgent = 'CanIBurnService/1.0';
    async reverseGeocode(coordinates) {
        try {
            (0, validation_1.validateCoordinates)(coordinates);
            const location = await this.fetchLocationFromNominatim(coordinates);
            return {
                location,
                accuracy: 'high',
            };
        }
        catch (error) {
            if (error instanceof errors_1.LocationNotFoundError || error instanceof errors_1.InvalidCoordinatesError) {
                throw error;
            }
            throw new errors_1.ExternalServiceError('LocationService', error);
        }
    }
    async fetchLocationFromNominatim(coordinates) {
        const url = new URL(this.nominatimBaseUrl);
        url.searchParams.set('lat', coordinates.latitude.toString());
        url.searchParams.set('lon', coordinates.longitude.toString());
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('zoom', '18');
        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': this.userAgent,
            },
        });
        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.address) {
            throw new errors_1.LocationNotFoundError(coordinates.latitude, coordinates.longitude);
        }
        return this.parseNominatimResponse(data, coordinates);
    }
    parseNominatimResponse(data, coordinates) {
        const { address } = data;
        let country = '';
        if (address.country_code === 'ca') {
            country = 'Canada';
        }
        else if (address.country_code === 'us') {
            country = 'United States';
        }
        else {
            country = address.country || 'Unknown Country';
        }
        const province = address.province || address.state || 'Unknown Province/State';
        const state = address.state || address.province || 'Unknown State/Province';
        const county = address.county ||
            address.state_district ||
            this.extractCountyFromDisplayName(data.display_name) ||
            'Unknown County';
        if (country === 'Unknown Country' || province === 'Unknown Province/State') {
            throw new errors_1.LocationNotFoundError(coordinates.latitude, coordinates.longitude);
        }
        return {
            province,
            state,
            county,
            country,
        };
    }
    extractCountyFromDisplayName(displayName) {
        const parts = displayName.split(', ');
        for (const part of parts) {
            if (part.toLowerCase().includes('county') ||
                part.toLowerCase().includes('regional municipality') ||
                part.toLowerCase().includes('district')) {
                return part.trim();
            }
        }
        return null;
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=locationService.js.map
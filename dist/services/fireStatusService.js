"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireStatusService = void 0;
const types_1 = require("../types");
const errors_1 = require("../errors");
const cwfisProvider_1 = require("./providers/cwfisProvider");
const nasaFirmsProvider_1 = require("./providers/nasaFirmsProvider");
class FireStatusService {
    providers;
    constructor() {
        this.providers = [
            new nasaFirmsProvider_1.NASAFirmsProvider(),
            new cwfisProvider_1.CWFISProvider(),
        ];
    }
    mockFireStatusData = new Map([
        ['Ontario,Toronto', {
                status: types_1.FireStatus.RESTRICTED_BURN,
                valid_from: new Date('2024-07-01T00:00:00Z'),
                valid_to: new Date('2024-09-30T23:59:59Z'),
                jurisdiction: 'City of Toronto',
                restrictions: ['No burning between 8 AM and 8 PM', 'Maximum pile size 2m x 2m'],
            }],
        ['British Columbia,Vancouver', {
                status: types_1.FireStatus.NO_BURN,
                valid_from: new Date('2024-06-15T00:00:00Z'),
                valid_to: new Date('2024-10-15T23:59:59Z'),
                jurisdiction: 'BC Wildfire Service',
                restrictions: ['Complete fire ban in effect', 'All open fires prohibited'],
            }],
        ['Alberta,Calgary', {
                status: types_1.FireStatus.OPEN_BURN,
                valid_from: new Date('2024-05-01T00:00:00Z'),
                valid_to: new Date('2024-11-30T23:59:59Z'),
                jurisdiction: 'Alberta Agriculture and Forestry',
            }],
        ['New York,New York County', {
                status: types_1.FireStatus.RESTRICTED_BURN,
                valid_from: new Date('2024-04-01T00:00:00Z'),
                valid_to: new Date('2024-11-30T23:59:59Z'),
                jurisdiction: 'New York State Department of Environmental Conservation',
                restrictions: ['Permit required', 'No burning during high wind conditions'],
            }],
        ['California,Los Angeles County', {
                status: types_1.FireStatus.NO_BURN,
                valid_from: new Date('2024-05-01T00:00:00Z'),
                valid_to: new Date('2024-12-31T23:59:59Z'),
                jurisdiction: 'California Department of Forestry and Fire Protection',
                restrictions: ['Red flag warning in effect', 'All outdoor burning prohibited'],
            }],
    ]);
    async getFireStatus(location) {
        try {
            // Try each provider in priority order
            for (const provider of this.providers) {
                if (provider.isAvailableForLocation(location)) {
                    try {
                        const status = await provider.getFireStatus(location);
                        if (status) {
                            return status;
                        }
                    }
                    catch (error) {
                        console.warn(`Provider ${provider.getName()} failed for location:`, error);
                        continue;
                    }
                }
            }
            // Fall back to mock data if no provider has data
            const key = `${location.province || location.state},${location.county}`;
            const fireStatus = this.mockFireStatusData.get(key);
            if (!fireStatus) {
                const fallbackStatus = this.getFallbackStatus(location);
                if (fallbackStatus) {
                    return fallbackStatus;
                }
                throw new errors_1.FireStatusNotFoundError(`${location.province || location.state}, ${location.county}`);
            }
            return fireStatus;
        }
        catch (error) {
            if (error instanceof errors_1.FireStatusNotFoundError) {
                throw error;
            }
            console.error('FireStatusService encountered an error:', error);
            throw new errors_1.ExternalServiceError('FireStatusService', error);
        }
    }
    async getFireStatusByCoordinates(coordinates) {
        try {
            // Try each provider in priority order
            for (const provider of this.providers) {
                if (provider.isAvailableForCoordinates(coordinates)) {
                    try {
                        const status = await provider.getFireStatusByCoordinates(coordinates);
                        if (status) {
                            return status;
                        }
                    }
                    catch (error) {
                        console.warn(`Provider ${provider.getName()} failed for coordinates:`, error);
                        continue;
                    }
                }
            }
            return null;
        }
        catch (error) {
            throw new errors_1.ExternalServiceError('FireStatusService', error);
        }
    }
    getFallbackStatus(location) {
        const currentDate = new Date();
        const winterMonths = [11, 0, 1, 2];
        const summerMonths = [5, 6, 7, 8];
        const currentMonth = currentDate.getMonth();
        if (location.country === 'Canada') {
            if (winterMonths.includes(currentMonth)) {
                return {
                    status: types_1.FireStatus.OPEN_BURN,
                    valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
                    valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
                    jurisdiction: 'Provincial Fire Authority',
                };
            }
            else if (summerMonths.includes(currentMonth)) {
                return {
                    status: types_1.FireStatus.RESTRICTED_BURN,
                    valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
                    valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
                    jurisdiction: 'Provincial Fire Authority',
                    restrictions: ['Seasonal fire restrictions in effect'],
                };
            }
        }
        if (location.country === 'United States') {
            if (winterMonths.includes(currentMonth)) {
                return {
                    status: types_1.FireStatus.RESTRICTED_BURN,
                    valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
                    valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
                    jurisdiction: 'State Fire Authority',
                    restrictions: ['Permit may be required'],
                };
            }
            else if (summerMonths.includes(currentMonth)) {
                return {
                    status: types_1.FireStatus.NO_BURN,
                    valid_from: new Date(currentDate.getFullYear(), currentMonth, 1),
                    valid_to: new Date(currentDate.getFullYear(), currentMonth + 1, 0),
                    jurisdiction: 'State Fire Authority',
                    restrictions: ['High fire danger period'],
                };
            }
        }
        return null;
    }
    getAvailableProviders() {
        return this.providers.map(provider => provider.getName());
    }
    getProviderCoverage(providerName) {
        const provider = this.providers.find(p => p.getName() === providerName);
        return provider ? provider.getCoverage() : [];
    }
}
exports.FireStatusService = FireStatusService;
//# sourceMappingURL=fireStatusService.js.map
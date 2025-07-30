"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanIBurnService = void 0;
const locationService_1 = require("./locationService");
const fireStatusService_1 = require("./fireStatusService");
const validation_1 = require("../utils/validation");
class CanIBurnService {
    locationService;
    fireStatusService;
    constructor() {
        this.locationService = new locationService_1.LocationService();
        this.fireStatusService = new fireStatusService_1.FireStatusService();
    }
    async getFireWatchStatus(coordinates) {
        (0, validation_1.validateCoordinates)(coordinates);
        // Try coordinate-based lookup first (more accurate for satellite data)
        let fireStatusData = await this.fireStatusService.getFireStatusByCoordinates(coordinates);
        // Fall back to location-based lookup if no coordinate data available
        if (!fireStatusData) {
            const geocodeResult = await this.locationService.reverseGeocode(coordinates);
            fireStatusData = await this.fireStatusService.getFireStatus(geocodeResult.location);
        }
        // Always get location info for response
        const geocodeResult = await this.locationService.reverseGeocode(coordinates);
        return {
            status: fireStatusData.status,
            valid_from: fireStatusData.valid_from,
            valid_to: fireStatusData.valid_to,
            location: geocodeResult.location,
            coordinates,
            jurisdiction: fireStatusData.jurisdiction,
            restrictions: fireStatusData.restrictions,
        };
    }
}
exports.CanIBurnService = CanIBurnService;
//# sourceMappingURL=canIBurnService.js.map
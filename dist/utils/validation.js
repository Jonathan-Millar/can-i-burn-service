"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateInRange = exports.isValidDate = exports.validateCoordinates = void 0;
const errors_1 = require("../errors");
const validateCoordinates = (coordinates) => {
    const { latitude, longitude } = coordinates;
    if (typeof latitude !== 'number' || isNaN(latitude)) {
        throw new errors_1.InvalidCoordinatesError(latitude, longitude);
    }
    if (typeof longitude !== 'number' || isNaN(longitude)) {
        throw new errors_1.InvalidCoordinatesError(latitude, longitude);
    }
    if (latitude < -90 || latitude > 90) {
        throw new errors_1.InvalidCoordinatesError(latitude, longitude);
    }
    if (longitude < -180 || longitude > 180) {
        throw new errors_1.InvalidCoordinatesError(latitude, longitude);
    }
};
exports.validateCoordinates = validateCoordinates;
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
const isDateInRange = (date, validFrom, validTo) => {
    return date >= validFrom && date <= validTo;
};
exports.isDateInRange = isDateInRange;
//# sourceMappingURL=validation.js.map
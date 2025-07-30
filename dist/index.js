"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireStatusService = exports.LocationService = exports.CanIBurnService = void 0;
var canIBurnService_1 = require("./services/canIBurnService");
Object.defineProperty(exports, "CanIBurnService", { enumerable: true, get: function () { return canIBurnService_1.CanIBurnService; } });
var locationService_1 = require("./services/locationService");
Object.defineProperty(exports, "LocationService", { enumerable: true, get: function () { return locationService_1.LocationService; } });
var fireStatusService_1 = require("./services/fireStatusService");
Object.defineProperty(exports, "FireStatusService", { enumerable: true, get: function () { return fireStatusService_1.FireStatusService; } });
__exportStar(require("./types"), exports);
__exportStar(require("./errors"), exports);
//# sourceMappingURL=index.js.map
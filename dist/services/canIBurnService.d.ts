import { GPSCoordinates, FireWatchResponse } from '../types';
export declare class CanIBurnService {
  private locationService;
  private fireStatusService;
  constructor();
  getFireWatchStatus(coordinates: GPSCoordinates): Promise<FireWatchResponse>;
}
//# sourceMappingURL=canIBurnService.d.ts.map

import { describe, it, expect } from 'vitest';
import { CanIBurnService, FireStatus } from '../src/index';

describe('CanIBurnService integration', () => {
  it('should export CanIBurnService and work end-to-end', async () => {
    const service = new CanIBurnService();
    const coordinates = { latitude: 43.6532, longitude: -79.3832 };

    const result = await service.getFireWatchStatus(coordinates);

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('valid_from');
    expect(result).toHaveProperty('valid_to');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('coordinates');
    expect(Object.values(FireStatus)).toContain(result.status);
  }, 10000);
});

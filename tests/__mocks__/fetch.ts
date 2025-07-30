import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Helper function to mock successful responses
export const mockFetchSuccess = (data: any) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
};

// Helper function to mock failed responses
export const mockFetchError = (status: number, statusText: string) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
  });
};

// Reset mocks
export const resetFetchMocks = () => {
  vi.clearAllMocks();
};

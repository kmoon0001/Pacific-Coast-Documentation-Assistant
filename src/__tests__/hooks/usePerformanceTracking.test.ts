import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePerformanceTracking, useAPITracking, useInteractionTracking, useAsyncTracking } from '../../hooks/usePerformanceTracking';

// Mock the monitoring service
vi.mock('../../lib/monitoring', () => ({
  monitoring: {
    recordMetric: vi.fn(),
    trackAPICall: vi.fn(),
    trackInteraction: vi.fn(),
    captureError: vi.fn(),
  },
}));

describe('Performance Tracking Hooks', () => {
  describe('usePerformanceTracking', () => {
    it('should track component mount', () => {
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'));

      expect(result.current.renderCount).toBeGreaterThanOrEqual(0);
    });

    it('should increment render count', () => {
      const { result, rerender } = renderHook(() => usePerformanceTracking('TestComponent'));

      const initialCount = result.current.renderCount;
      rerender();

      expect(result.current.renderCount).toBeGreaterThan(initialCount);
    });
  });

  describe('useAPITracking', () => {
    it('should track successful API call', async () => {
      const { result } = renderHook(() => useAPITracking());
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' });

      const response = await result.current.trackAPICall('/api/test', mockApiCall);

      expect(response).toEqual({ data: 'success' });
      expect(mockApiCall).toHaveBeenCalled();
    });

    it('should track failed API call', async () => {
      const { result } = renderHook(() => useAPITracking());
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));

      await expect(
        result.current.trackAPICall('/api/test', mockApiCall)
      ).rejects.toThrow('API Error');
    });
  });

  describe('useInteractionTracking', () => {
    it('should track interaction', () => {
      const { result } = renderHook(() => useInteractionTracking());

      expect(() => result.current.trackInteraction('test-action')).not.toThrow();
    });

    it('should track click', () => {
      const { result } = renderHook(() => useInteractionTracking());

      expect(() => result.current.trackClick('test-button')).not.toThrow();
    });

    it('should track form submit', () => {
      const { result } = renderHook(() => useInteractionTracking());

      expect(() => result.current.trackFormSubmit('test-form')).not.toThrow();
    });

    it('should track navigation', () => {
      const { result } = renderHook(() => useInteractionTracking());

      expect(() => result.current.trackNavigation('/test-route')).not.toThrow();
    });
  });

  describe('useAsyncTracking', () => {
    it('should track successful async operation', async () => {
      const { result } = renderHook(() => useAsyncTracking());
      const mockOperation = vi.fn().mockResolvedValue('success');

      const response = await result.current.trackAsync('test-operation', mockOperation);

      expect(response).toBe('success');
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should track failed async operation', async () => {
      const { result } = renderHook(() => useAsyncTracking());
      const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(
        result.current.trackAsync('test-operation', mockOperation)
      ).rejects.toThrow('Operation failed');
    });
  });
});

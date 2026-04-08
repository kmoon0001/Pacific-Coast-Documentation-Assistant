import { useEffect, useRef, useCallback } from 'react';
import { monitoring } from '../lib/monitoring';

/**
 * Hook for tracking component performance
 */
export function usePerformanceTracking(componentName: string) {
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    // Track mount time
    const mountDuration = Date.now() - mountTime.current;
    monitoring.recordMetric('component-mount', mountDuration, {
      component: componentName,
    });

    // Track unmount
    return () => {
      const lifetimeDuration = Date.now() - mountTime.current;
      monitoring.recordMetric('component-lifetime', lifetimeDuration, {
        component: componentName,
        renders: renderCount.current.toString(),
      });
    };
  }, [componentName]);

  // Track renders
  useEffect(() => {
    renderCount.current++;
    monitoring.recordMetric('component-render', 1, {
      component: componentName,
      renderCount: renderCount.current.toString(),
    });
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook for tracking API call performance
 */
export function useAPITracking() {
  const trackAPICall = useCallback(
    async <T,>(
      endpoint: string,
      apiCall: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();

      try {
        const result = await apiCall();
        const duration = Date.now() - startTime;

        monitoring.trackAPICall(endpoint, duration, 200);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        monitoring.trackAPICall(endpoint, duration, 500);
        monitoring.captureError(error as Error, {
          type: 'api-error',
          severity: 'high',
          extra: { endpoint },
        });
        throw error;
      }
    },
    []
  );

  return { trackAPICall };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback((action: string, metadata?: Record<string, string>) => {
    monitoring.trackInteraction(action);
    monitoring.recordMetric('user-action', 1, {
      action,
      ...metadata,
    });
  }, []);

  const trackClick = useCallback((elementName: string) => {
    trackInteraction('click', { element: elementName });
  }, [trackInteraction]);

  const trackFormSubmit = useCallback((formName: string) => {
    trackInteraction('form-submit', { form: formName });
  }, [trackInteraction]);

  const trackNavigation = useCallback((route: string) => {
    trackInteraction('navigation', { route });
  }, [trackInteraction]);

  return {
    trackInteraction,
    trackClick,
    trackFormSubmit,
    trackNavigation,
  };
}

/**
 * Hook for tracking async operations
 */
export function useAsyncTracking() {
  const trackAsync = useCallback(
    async <T,>(
      operationName: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();

      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        monitoring.recordMetric('async-operation', duration, {
          operation: operationName,
          status: 'success',
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        monitoring.recordMetric('async-operation', duration, {
          operation: operationName,
          status: 'error',
        });

        monitoring.captureError(error as Error, {
          type: 'async-error',
          severity: 'medium',
          extra: { operation: operationName },
        });

        throw error;
      }
    },
    []
  );

  return { trackAsync };
}

/**
 * Hook for tracking render performance with detailed metrics
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const slowRenderThreshold = 16; // 16ms = 60fps

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderDuration = performance.now() - renderStartTime.current;
    renderCount.current++;

    monitoring.recordMetric('render-duration', renderDuration, {
      component: componentName,
      renderNumber: renderCount.current.toString(),
    });

    // Warn about slow renders
    if (renderDuration > slowRenderThreshold) {
      console.warn(
        `Slow render detected in ${componentName}: ${renderDuration.toFixed(2)}ms`
      );
    }
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook for tracking memory usage
 */
export function useMemoryTracking(componentName: string) {
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;

      monitoring.recordMetric('memory-usage', memory.usedJSHeapSize, {
        component: componentName,
        total: memory.totalJSHeapSize.toString(),
        limit: memory.jsHeapSizeLimit.toString(),
      });
    }
  }, [componentName]);
}

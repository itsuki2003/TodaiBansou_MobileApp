import { useCallback, useRef, useMemo } from 'react';

// Debounce utility for search and input fields
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Throttle utility for scroll events and frequent updates
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T => {
  const inThrottle = useRef(false);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [callback, limit]
  );
};

// Memoized date formatter for calendar components
export const useDateFormatter = () => {
  return useMemo(() => {
    const formatters = new Map<string, Intl.DateTimeFormat>();
    
    return {
      formatDate: (date: Date, format: string, locale = 'ja-JP') => {
        const key = `${format}-${locale}`;
        if (!formatters.has(key)) {
          const options: Intl.DateTimeFormatOptions = {};
          
          switch (format) {
            case 'short':
              options.month = 'numeric';
              options.day = 'numeric';
              break;
            case 'medium':
              options.month = 'short';
              options.day = 'numeric';
              options.weekday = 'short';
              break;
            case 'long':
              options.year = 'numeric';
              options.month = 'long';
              options.day = 'numeric';
              options.weekday = 'long';
              break;
            case 'time':
              options.hour = '2-digit';
              options.minute = '2-digit';
              break;
          }
          
          formatters.set(key, new Intl.DateTimeFormat(locale, options));
        }
        
        return formatters.get(key)!.format(date);
      }
    };
  }, []);
};

// Optimized image loading utility
export const useOptimizedImageLoader = () => {
  const imageCache = useRef(new Map<string, boolean>());

  return useCallback((uri: string) => {
    if (imageCache.current.has(uri)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(uri, true);
        resolve();
      };
      img.onerror = reject;
      img.src = uri;
    });
  }, []);
};

// Memory management for large lists
export const useListOptimization = <T>(
  data: T[],
  pageSize: number = 20
) => {
  const currentPage = useRef(0);
  
  const getVisibleItems = useCallback(() => {
    const startIndex = 0;
    const endIndex = Math.min((currentPage.current + 1) * pageSize, data.length);
    return data.slice(startIndex, endIndex);
  }, [data, pageSize]);

  const loadMore = useCallback(() => {
    if ((currentPage.current + 1) * pageSize < data.length) {
      currentPage.current += 1;
    }
  }, [data.length, pageSize]);

  const reset = useCallback(() => {
    currentPage.current = 0;
  }, []);

  const hasMore = useMemo(() => {
    return (currentPage.current + 1) * pageSize < data.length;
  }, [currentPage.current, data.length, pageSize]);

  return {
    visibleItems: getVisibleItems(),
    loadMore,
    reset,
    hasMore,
    totalItems: data.length,
    loadedItems: Math.min((currentPage.current + 1) * pageSize, data.length)
  };
};

// Cache utility for API responses
export class APICache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }

  static remove(key: string) {
    this.cache.delete(key);
  }

  static getSize() {
    return this.cache.size;
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const times = this.metrics.get(label)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      // Log slow operations (> 100ms)
      if (duration > 100) {
        console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getMetrics(label: string) {
    const times = this.metrics.get(label) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, count: times.length };
  }

  static getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      if (times.length > 0) {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        result[label] = { avg, min, max, count: times.length };
      }
    }
    
    return result;
  }

  static clear() {
    this.metrics.clear();
  }
}

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (__DEV__) {
    console.log('Bundle analysis (development mode):');
    console.log('- React Native:', 'Core framework');
    console.log('- Expo:', 'Development platform');
    console.log('- Supabase:', 'Backend services');
    console.log('- Date-fns:', 'Date utilities');
    console.log('- Lucide React Native:', 'Icons');
    console.log('- React Native Reanimated:', 'Animations');
    
    // Add bundle size recommendations
    console.log('\nOptimization recommendations:');
    console.log('- Use tree shaking for date-fns');
    console.log('- Optimize image assets');
    console.log('- Consider code splitting for admin features');
  }
};

// Memory usage monitor
export const useMemoryMonitor = () => {
  const checkMemory = useCallback(() => {
    if (__DEV__ && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }, []);

  return { checkMemory };
};

// Optimized async operation utility
export const useOptimizedAsync = <T>(
  asyncOperation: () => Promise<T>,
  dependencies: any[] = []
) => {
  const abortControllerRef = useRef<AbortController>();
  
  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const result = await asyncOperation();
      
      // Check if operation was aborted
      if (abortControllerRef.current.signal.aborted) {
        return null;
      }
      
      return result;
    } catch (error) {
      if (abortControllerRef.current.signal.aborted) {
        return null;
      }
      throw error;
    }
  }, dependencies);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { execute, cancel };
};
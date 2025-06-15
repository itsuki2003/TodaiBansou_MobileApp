import { useState, useEffect, useCallback, useRef } from 'react';
import { APICache, PerformanceMonitor } from '@/utils/performanceHelpers';

interface UseOptimizedQueryOptions {
  cacheKey?: string;
  cacheTTL?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface UseOptimizedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseOptimizedQueryOptions = {}
): UseOptimizedQueryResult<T> {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    refetchOnWindowFocus = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>();
  const retryCountRef = useRef(0);

  const executeQuery = useCallback(async (isRetry = false) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const endTiming = PerformanceMonitor.startTiming(`query:${cacheKey || 'unnamed'}`);

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        retryCountRef.current = 0;
      }

      // Check cache first
      if (cacheKey) {
        const cachedData = APICache.get(cacheKey);
        if (cachedData && !isRetry) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      const result = await queryFn();

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setData(result);
      setError(null);
      retryCountRef.current = 0;

      // Cache the result
      if (cacheKey) {
        APICache.set(cacheKey, result, cacheTTL);
      }

    } catch (err) {
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const error = err as Error;
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current += 1;
        setTimeout(() => {
          executeQuery(true);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(error);
      console.error(`Query error (${cacheKey}):`, error);
    } finally {
      setLoading(false);
      endTiming();
    }
  }, [queryFn, cacheKey, cacheTTL, retryCount, retryDelay, ...dependencies]);

  const refetch = useCallback(async () => {
    // Clear cache before refetching
    if (cacheKey) {
      APICache.remove(cacheKey);
    }
    await executeQuery();
  }, [executeQuery, cacheKey]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      APICache.remove(cacheKey);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (enabled) {
      executeQuery();
    }

    // Cleanup function to abort ongoing request
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, ...dependencies]);

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled && data) {
        executeQuery();
      }
    };

    // Note: In React Native, we might want to use AppState instead
    // This is a placeholder for web-like behavior
    const focusListener = () => handleFocus();

    return () => {
      // Remove listener if needed
    };
  }, [refetchOnWindowFocus, enabled, data, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
}

// Specialized hook for Supabase queries
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  dependencies: any[] = [],
  options: UseOptimizedQueryOptions = {}
): UseOptimizedQueryResult<T> {
  const wrappedQueryFn = useCallback(async () => {
    const result = await queryFn();
    if (result.error) {
      throw new Error(result.error.message || 'Supabase query failed');
    }
    return result.data!;
  }, [queryFn]);

  return useOptimizedQuery(wrappedQueryFn, dependencies, options);
}
import { useState, useCallback } from 'react';
import { useErrorHandler, AppError } from './useErrorHandler';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

export function useAsyncOperation<T = any>() {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { handleError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const appError = handleError(error, errorMessage);
      setState(prev => ({ ...prev, loading: false, error: appError }));
      return null;
    }
  }, [handleError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setLoading,
    clearError,
  };
}
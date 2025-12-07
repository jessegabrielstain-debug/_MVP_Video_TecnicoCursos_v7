
/**
 * 🔄 HOOK DE RECUPERAÇÃO DE ERROS
 * Hook personalizado para recuperação automática de erros
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { errorLogger } from '@/lib/error-handling/error-logger';
import { ApiError, apiClient } from '@/lib/error-handling/api-error-handler';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onError?: (error: Error, attempt: number) => void;
  onRecovered?: (attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export function useErrorRecovery<T>(
  asyncFunction: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onError,
    onRecovered,
    onMaxRetriesReached,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback((attempt: number) => {
    if (exponentialBackoff) {
      return retryDelay * Math.pow(2, attempt);
    }
    return retryDelay;
  }, [retryDelay, exponentialBackoff]);

  const executeFunction = useCallback(async (attempt: number = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const result = await asyncFunction();
      setData(result);
      
      if (attempt > 0) {
        onRecovered?.(attempt);
        errorLogger.logInfo(`Function recovered after ${attempt} attempts`, {
          component: 'useErrorRecovery',
          attempts: attempt
        });
      }
      
      setRetryCount(0);
      setIsRecovering(false);
    } catch (err) {
      const currentError = err as Error;
      setError(currentError);
      
      errorLogger.logError({
        message: `Function failed (attempt ${attempt + 1}/${maxRetries + 1})`,
        error: currentError,
        context: {
          component: 'useErrorRecovery',
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        }
      });
      
      onError?.(currentError, attempt + 1);
      
      if (attempt < maxRetries) {
        setIsRecovering(true);
        setRetryCount(attempt + 1);
        
        const delay = calculateDelay(attempt);
        
        timeoutRef.current = setTimeout(() => {
          executeFunction(attempt + 1);
        }, delay);
      } else {
        setIsRecovering(false);
        onMaxRetriesReached?.(currentError);
        
        errorLogger.logError({
          message: `Function failed permanently after ${maxRetries + 1} attempts`,
          error: currentError,
          context: {
            component: 'useErrorRecovery',
            totalAttempts: maxRetries + 1
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [asyncFunction, maxRetries, calculateDelay, onError, onRecovered, onMaxRetriesReached]);

  const retry = useCallback(() => {
    if (!loading) {
      executeFunction(retryCount);
    }
  }, [executeFunction, retryCount, loading]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setLoading(false);
    setIsRecovering(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    setRetryCount(0);
    setIsRecovering(false);
  }, [cancel]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    error,
    retryCount,
    maxRetries,
    isRecovering,
    execute: () => executeFunction(0),
    retry,
    cancel,
    reset,
  };
}

// Hook para API calls com recuperação automática
export function useApiRecovery<T>(
  url: string,
  options: RequestInit & {
    autoExecute?: boolean;
    recoveryOptions?: ErrorRecoveryOptions;
  } = {}
) {
  const { autoExecute = false, recoveryOptions, ...requestOptions } = options;

  const apiCall = useCallback(async () => {
    return await apiClient.request<T>(url, {
      ...requestOptions,
      headers: requestOptions.headers as Record<string, string> | undefined
    });
  }, [url, requestOptions]);

  const recovery = useErrorRecovery(apiCall, recoveryOptions);

  useEffect(() => {
    if (autoExecute) {
      recovery.execute();
    }
  }, [autoExecute, recovery.execute]);

  return recovery;
}

// Hook para monitoramento de conexão com recuperação
export function useConnectionRecovery(options: ErrorRecoveryOptions = {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  const testConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${(error as Error).message}`);
    }
  }, []);

  const recovery = useErrorRecovery(testConnection, {
    maxRetries: 5,
    retryDelay: 2000,
    exponentialBackoff: true,
    onError: (error) => {
      setConnectionError(error);
      setIsOnline(false);
    },
    onRecovered: () => {
      setConnectionError(null);
      setIsOnline(true);
    },
    ...options,
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
      recovery.execute();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError(new Error('Internet connection lost'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [recovery.execute]);

  return {
    isOnline,
    connectionError,
    ...recovery,
  };
}

// Hook para recuperação de componentes
export function useComponentRecovery(
  componentName: string,
  options: ErrorRecoveryOptions = {}
) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<Error | null>(null);
  const [recoveryCount, setRecoveryCount] = useState(0);

  const reportError = useCallback((error: Error) => {
    setHasError(true);
    setErrorInfo(error);
    
    errorLogger.logError({
      message: `Component error: ${componentName}`,
      error,
      context: {
        component: componentName,
        recoveryCount,
        useComponentRecovery: true
      }
    });

    options.onError?.(error, recoveryCount + 1);
  }, [componentName, recoveryCount, options]);

  const recover = useCallback(() => {
    if (recoveryCount < (options.maxRetries || 3)) {
      setRecoveryCount(count => count + 1);
      setHasError(false);
      setErrorInfo(null);
      
      errorLogger.logInfo(`Component recovery attempt: ${componentName}`, {
        component: componentName,
        recoveryAttempt: recoveryCount + 1
      });
      
      options.onRecovered?.(recoveryCount + 1);
    } else {
      options.onMaxRetriesReached?.(errorInfo!);
    }
  }, [componentName, recoveryCount, options, errorInfo]);

  const reset = useCallback(() => {
    setHasError(false);
    setErrorInfo(null);
    setRecoveryCount(0);
  }, []);

  return {
    hasError,
    errorInfo,
    recoveryCount,
    maxRecoveries: options.maxRetries || 3,
    reportError,
    recover,
    reset,
    canRecover: recoveryCount < (options.maxRetries || 3),
  };
}

// Hook para debounce de erros
export function useDebouncedError(delay: number = 300) {
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setDebouncedError = useCallback((newError: Error | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setError(newError);
    }, delay);
  }, [delay]);

  const clearError = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    error,
    setError: setDebouncedError,
    clearError,
  };
}

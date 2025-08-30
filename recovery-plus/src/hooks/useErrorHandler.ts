import { useCallback } from 'react';
import { handleError } from '../services/errorHandler';

interface UseErrorHandlerOptions {
  userId?: string;
  screen?: string;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const reportError = useCallback(
    (error: Error | string, action?: string) => {
      return handleError(error, {
        ...options,
        action,
      });
    },
    [options]
  );

  const reportNetworkError = useCallback(
    (error: Error | string, action?: string) => {
      return handleError(error, {
        ...options,
        action,
        type: 'network',
      });
    },
    [options]
  );

  const reportAuthError = useCallback(
    (error: Error | string, action?: string) => {
      return handleError(error, {
        ...options,
        action,
        type: 'auth',
      });
    },
    [options]
  );

  const reportValidationError = useCallback(
    (error: Error | string, action?: string) => {
      return handleError(error, {
        ...options,
        action,
        type: 'validation',
      });
    },
    [options]
  );

  return {
    reportError,
    reportNetworkError,
    reportAuthError,
    reportValidationError,
  };
};

import { useCallback, useEffect, useMemo } from 'react';
import { logger } from '../services/logger';
import { useAppStore } from '../store';

interface UseLoggerOptions {
  category?: string;
  screen?: string;
}

export const useLogger = (options: UseLoggerOptions = {}) => {
  const { user } = useAppStore();

  // Create scoped logger with user context
  const scopedLogger = useMemo(() => {
    const context = {
      userId: user?.id,
      screen: options.screen,
    };

    if (options.category) {
      return logger.createScopedLogger(options.category, context);
    }

    return {
      debug: (message: string, metadata?: Record<string, unknown>) =>
        logger.debug(message, metadata, undefined, context),
      info: (message: string, metadata?: Record<string, unknown>) =>
        logger.info(message, metadata, undefined, context),
      warn: (message: string, metadata?: Record<string, unknown>) =>
        logger.warn(message, metadata, undefined, context),
      error: (message: string, metadata?: Record<string, unknown>) =>
        logger.error(message, metadata, undefined, context),
    };
  }, [user?.id, options.category, options.screen]);

  // Screen navigation logging
  const logScreenEnter = useCallback(() => {
    if (options.screen) {
      scopedLogger.info(`Entered screen: ${options.screen}`);
    }
  }, [options.screen, scopedLogger]);

  const logScreenExit = useCallback(() => {
    if (options.screen) {
      scopedLogger.info(`Exited screen: ${options.screen}`);
    }
  }, [options.screen, scopedLogger]);

  // Action logging helpers
  const logAction = useCallback(
    (action: string, metadata?: Record<string, unknown>) => {
      scopedLogger.info(`Action: ${action}`, metadata);
    },
    [scopedLogger]
  );

  const logError = useCallback(
    (error: string | Error, action?: string) => {
      const message = typeof error === 'string' ? error : error.message;
      const metadata = action ? { action } : undefined;
      scopedLogger.error(message, metadata);
    },
    [scopedLogger]
  );

  const logPerformance = useCallback(
    (
      operation: string,
      startTime: number,
      metadata?: Record<string, unknown>
    ) => {
      const duration = Date.now() - startTime;
      scopedLogger.info(`Performance: ${operation} took ${duration}ms`, {
        duration,
        ...metadata,
      });
    },
    [scopedLogger]
  );

  // Auto-log screen entry (only once per mount)
  useEffect(() => {
    logScreenEnter();
    return logScreenExit;
  }, []); // Empty dependency array for mount/unmount only

  return {
    debug: scopedLogger.debug,
    info: scopedLogger.info,
    warn: scopedLogger.warn,
    error: scopedLogger.error,
    logAction,
    logError,
    logPerformance,
    logScreenEnter,
    logScreenExit,
  };
};

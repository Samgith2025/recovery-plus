// Comprehensive logging service for debugging and monitoring

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  category?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  screen?: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private minLevel: LogLevel = false ? 'debug' : 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private levelColors: Record<LogLevel, string> = {
    debug: '#8E8E93',
    info: '#007AFF',
    warn: '#FF9500',
    error: '#FF3B30',
  };

  private levelEmojis: Record<LogLevel, string> = {
    debug: '🐛',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Debug log - for detailed debugging information
   */
  debug(
    message: string,
    metadata?: Record<string, unknown>,
    category?: string
  ): void {
    this.log('debug', message, metadata, category);
  }

  /**
   * Info log - for general information
   */
  info(
    message: string,
    metadata?: Record<string, unknown>,
    category?: string
  ): void {
    this.log('info', message, metadata, category);
  }

  /**
   * Warning log - for potentially problematic situations
   */
  warn(
    message: string,
    metadata?: Record<string, unknown>,
    category?: string
  ): void {
    this.log('warn', message, metadata, category);
  }

  /**
   * Error log - for error conditions
   */
  error(
    message: string,
    metadata?: Record<string, unknown>,
    category?: string
  ): void {
    this.log('error', message, metadata, category);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    category?: string,
    context?: { userId?: string; screen?: string }
  ): void {
    // Check if we should log at this level
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date().toISOString(),
      category,
      metadata,
      userId: context?.userId,
      screen: context?.screen,
    };

    // Add to log history
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Output to console with formatting
    this.outputToConsole(logEntry);

    // In production, you might want to send to a logging service
    if (!__DEV__ && level === 'error') {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Format and output log to console
   */
  private outputToConsole(entry: LogEntry): void {
    const emoji = this.levelEmojis[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const category = entry.category ? `[${entry.category}] ` : '';
    const context = entry.screen ? ` (${entry.screen})` : '';

    const logMessage = `${emoji} ${time} ${category}${entry.message}${context}`;

    // Choose appropriate console method
    const consoleMethod =
      entry.level === 'debug'
        ? console.log
        : entry.level === 'info'
          ? console.info
          : entry.level === 'warn'
            ? console.warn
            : console.error;

    if (entry.metadata) {
      consoleMethod(logMessage, entry.metadata);
    } else {
      consoleMethod(logMessage);
    }
  }

  /**
   * Send log to external service (placeholder)
   */
  private sendToLoggingService(entry: LogEntry): void {
    // In a real app, you would send this to a logging service
    console.log('📊 Sending log to external service:', entry.id);
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
    userId?: string;
    screen?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        const minPriority = this.levelPriority[filter.level];
        filtered = filtered.filter(
          log => this.levelPriority[log.level] >= minPriority
        );
      }

      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }

      if (filter.since) {
        const sinceTime = filter.since.getTime();
        filtered = filtered.filter(
          log => new Date(log.timestamp).getTime() >= sinceTime
        );
      }

      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }

      if (filter.screen) {
        filtered = filtered.filter(log => log.screen === filter.screen);
      }

      if (filter.limit) {
        filtered = filtered.slice(0, filter.limit);
      }
    }

    return filtered;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
    recent1h: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    const byCategory: Record<string, number> = {};
    let recent1h = 0;

    this.logs.forEach(log => {
      byLevel[log.level]++;

      if (log.category) {
        byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      }

      if (new Date(log.timestamp).getTime() > oneHourAgo) {
        recent1h++;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
      recent1h,
    };
  }

  /**
   * Create a scoped logger for specific categories
   */
  createScopedLogger(
    category: string,
    context?: { userId?: string; screen?: string }
  ) {
    return {
      debug: (message: string, metadata?: Record<string, unknown>) =>
        this.log('debug', message, metadata, category, context),
      info: (message: string, metadata?: Record<string, unknown>) =>
        this.log('info', message, metadata, category, context),
      warn: (message: string, metadata?: Record<string, unknown>) =>
        this.log('warn', message, metadata, category, context),
      error: (message: string, metadata?: Record<string, unknown>) =>
        this.log('error', message, metadata, category, context),
    };
  }
}

// Export singleton instance
export const logger = new LoggerService();

// Category-specific loggers
export const authLogger = logger.createScopedLogger('AUTH');
export const apiLogger = logger.createScopedLogger('API');
export const navigationLogger = logger.createScopedLogger('NAVIGATION');
export const exerciseLogger = logger.createScopedLogger('EXERCISE');
export const chatLogger = logger.createScopedLogger('CHAT');
export const storeLogger = logger.createScopedLogger('STORE');
export const videoLogger = logger.createScopedLogger('VIDEO');

// Convenience functions
export const logDebug = (message: string, metadata?: Record<string, unknown>) =>
  logger.debug(message, metadata);
export const logInfo = (message: string, metadata?: Record<string, unknown>) =>
  logger.info(message, metadata);
export const logWarn = (message: string, metadata?: Record<string, unknown>) =>
  logger.warn(message, metadata);
export const logError = (message: string, metadata?: Record<string, unknown>) =>
  logger.error(message, metadata);

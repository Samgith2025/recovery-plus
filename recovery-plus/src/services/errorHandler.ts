// Global error handling service

export interface AppError {
  id: string;
  message: string;
  code?: string;
  type: 'network' | 'auth' | 'validation' | 'system' | 'unknown';
  timestamp: string;
  stack?: string;
  userContext?: {
    userId?: string;
    screen?: string;
    action?: string;
  };
}

class ErrorHandlerService {
  private errors: AppError[] = [];
  private maxErrors = 50; // Keep last 50 errors

  // Error type mappings
  private errorTypeMap: Record<string, AppError['type']> = {
    NetworkError: 'network',
    TypeError: 'system',
    ReferenceError: 'system',
    AuthError: 'auth',
    ValidationError: 'validation',
  };

  /**
   * Handle and log an error
   */
  handleError(
    error: Error | string,
    context?: {
      userId?: string;
      screen?: string;
      action?: string;
      type?: AppError['type'];
    }
  ): AppError {
    const appError = this.createAppError(error, context);

    // Add to error history
    this.errors.unshift(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Log error
    this.logError(appError);

    // In production, you might want to send to crash reporting service
    if (false) {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Create standardized error object
   */
  private createAppError(
    error: Error | string,
    context?: {
      userId?: string;
      screen?: string;
      action?: string;
      type?: AppError['type'];
    }
  ): AppError {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    if (typeof error === 'string') {
      return {
        id,
        message: error,
        type: context?.type || 'unknown',
        timestamp,
        userContext: context,
      };
    }

    const type = context?.type || this.getErrorType(error);

    return {
      id,
      message: error.message || 'Unknown error occurred',
      code: (error as any).code,
      type,
      timestamp,
      stack: error.stack,
      userContext: context,
    };
  }

  /**
   * Determine error type from error object
   */
  private getErrorType(error: Error): AppError['type'] {
    const errorName = error.constructor.name;
    return this.errorTypeMap[errorName] || 'unknown';
  }

  /**
   * Log error to console with formatting
   */
  private logError(error: AppError): void {
    const logMessage = `
╭─ ERROR [${error.type.toUpperCase()}] ─────────────────────
│ ID: ${error.id}
│ Time: ${error.timestamp}
│ Message: ${error.message}
${error.code ? `│ Code: ${error.code}` : ''}
${error.userContext?.userId ? `│ User: ${error.userContext.userId}` : ''}
${error.userContext?.screen ? `│ Screen: ${error.userContext.screen}` : ''}
${error.userContext?.action ? `│ Action: ${error.userContext.action}` : ''}
╰─────────────────────────────────────────────────────────
${error.stack ? error.stack : ''}
    `;

    if (error.type === 'system') {
      console.error(logMessage);
    } else {
      console.warn(logMessage);
    }
  }

  /**
   * Report error to external service (placeholder)
   */
  private reportError(error: AppError): void {
    // In a real app, you would send this to a crash reporting service
    // like Sentry, Bugsnag, or Firebase Crashlytics
    console.log('📊 Reporting error to external service:', error.id);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): AppError[] {
    return this.errors.slice(0, count);
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<AppError['type'], number>;
    recent24h: number;
  } {
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    const byType: Record<AppError['type'], number> = {
      network: 0,
      auth: 0,
      validation: 0,
      system: 0,
      unknown: 0,
    };

    let recent24h = 0;

    this.errors.forEach(error => {
      byType[error.type]++;
      if (new Date(error.timestamp).getTime() > yesterday) {
        recent24h++;
      }
    });

    return {
      total: this.errors.length,
      byType,
      recent24h,
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();

// Convenience functions
export const handleError = (
  error: Error | string,
  context?: Parameters<typeof errorHandler.handleError>[1]
) => errorHandler.handleError(error, context);

export const getRecentErrors = (count?: number) =>
  errorHandler.getRecentErrors(count);
export const clearErrors = () => errorHandler.clearErrors();
export const getErrorStats = () => errorHandler.getErrorStats();

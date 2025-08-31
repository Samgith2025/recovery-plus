// Performance measurement and optimization utilities

// React Native global declaration
declare const __DEV__: boolean;

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private maxCompleted = 100; // Keep last 100 completed metrics

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * End timing an operation and calculate duration
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);

    if (!metric) {
      console.warn(`Performance metric '${name}' was not started`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
    };

    // Add to completed metrics
    this.completedMetrics.unshift(completedMetric);
    if (this.completedMetrics.length > this.maxCompleted) {
      this.completedMetrics.pop();
    }

    // Remove from active metrics
    this.metrics.delete(name);

    // Log if in development
    if (__DEV__) {
      console.log(`⏱️ ${name}: ${duration}ms`, metric?.metadata || '');
    }

    return duration;
  }

  /**
   * Get all completed metrics
   */
  getMetrics(filterByName?: string): PerformanceMetric[] {
    if (filterByName) {
      return this.completedMetrics.filter(m => m.name === filterByName);
    }
    return [...this.completedMetrics];
  }

  /**
   * Get performance statistics
   */
  getStats(name?: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } {
    const metrics = name ? this.getMetrics(name) : this.completedMetrics;

    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
    }

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);

    if (durations.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
    }

    const total = durations.reduce((sum, d) => sum + d, 0);
    const avg = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: durations.length,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      total,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (name: string, metadata?: Record<string, unknown>) =>
  performanceMonitor.start(name, metadata);

export const endTimer = (name: string) => performanceMonitor.end(name);

export const getPerformanceStats = (name?: string) =>
  performanceMonitor.getStats(name);

// Higher-order function to measure function execution time
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> => {
  startTimer(name, metadata);
  try {
    const result = await fn();
    return result;
  } finally {
    endTimer(name);
  }
};

export const measure = <T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T => {
  startTimer(name, metadata);
  try {
    const result = fn();
    return result;
  } finally {
    endTimer(name);
  }
};

// React Native specific performance utilities
export const measureComponentRender = (componentName: string) => {
  const timerName = `${componentName}_render`;
  return {
    start: () => startTimer(timerName, { component: componentName }),
    end: () => endTimer(timerName),
  };
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let timeout: ReturnType<typeof setTimeout>;

  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let lastCall = 0;

  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  }) as T;
};

// Memory usage helper (development only)
export const logMemoryUsage = (label: string) => {
  if (__DEV__ && (global as any).performance?.memory) {
    const memory = (global as any).performance.memory;
    console.log(`🧠 Memory [${label}]:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
    });
  }
};

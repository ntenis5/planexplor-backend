// src/utils/performanceMonitor.ts - PERFORMANCE MONITORING
import { logger } from './logger.js';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(operation: string): void {
    this.measurements.set(operation, performance.now());
  }

  end(operation: string): void {
    const startTime = this.measurements.get(operation);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.info({
        operation,
        duration: `${duration.toFixed(2)}ms`,
        type: 'performance'
      }, `⏱️ ${operation} completed`);

      this.measurements.delete(operation);
    }
  }

  // 🚀 Async performance tracking
  async track<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(operation);
    }
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();

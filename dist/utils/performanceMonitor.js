import { logger } from './logger.js';
export class PerformanceMonitor {
    static instance;
    measurements = new Map();
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    start(operation) {
        this.measurements.set(operation, performance.now());
    }
    end(operation) {
        const startTime = this.measurements.get(operation);
        if (startTime) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            logger.info({
                operation,
                duration: `${duration.toFixed(2)}ms`,
                type: 'performance'
            }, `Performance: ${operation}`);
            this.measurements.delete(operation);
        }
    }
    async track(operation, fn) {
        this.start(operation);
        try {
            const result = await fn();
            return result;
        }
        finally {
            this.end(operation);
        }
    }
}
export const perfMonitor = PerformanceMonitor.getInstance();

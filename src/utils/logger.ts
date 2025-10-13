// src/utils/logger.ts - PERFORMANCE OPTIMIZED
import pino from 'pino';

// Cache environment variables për performance
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

// Krijo transport configuration me lazy loading
const getTransportConfig = () => {
  if (!isDevelopment) return undefined;
  
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
      singleLine: true, // 🚀 Performance optimization
      sync: false,      // 🚀 Async logging për performance
    }
  };
};

// Krijo logger instance me optimized configuration
const pinoLogger = pino({
  level: LOG_LEVEL,
  transport: getTransportConfig(),
  formatters: {
    level: (label) => ({ level: label }), // 🚀 Structured logging
  },
  serializers: {
    err: pino.stdSerializers.err,        // 🚀 Optimized error serialization
    req: pino.stdSerializers.req,        // 🚀 Optimized request serialization
    res: pino.stdSerializers.res,        // 🚀 Optimized response serialization
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`, // 🚀 Fast timestamp
  base: undefined, // 🚀 Remove pid, hostname për performance
});

// Eksporto logger të optimizuar
export const logger = pinoLogger;

// 🚀 Child logger factory për performance
export const createChildLogger = (module: string) => {
  return pinoLogger.child({ module });
};

// 🚀 Performance monitoring middleware
export const performanceLogger = pino({
  level: 'info',
  name: 'performance',
  formatters: {
    level: (label) => ({ level: label })
  }
});

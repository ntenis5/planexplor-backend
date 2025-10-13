// src/utils/logger.ts - PRODUCTION PERFORMANCE
import pino from 'pino';

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info');

// Production-optimized transport
const getTransport = () => {
  if (isProduction) {
    return undefined; // JSON format në production për performance
  }
  
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
      singleLine: true,
    }
  };
};

// High-performance logger configuration
export const logger = pino({
  level: LOG_LEVEL,
  transport: getTransport(),
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined, // Remove unnecessary fields
  enabled: true,
});

// Performance-optimized child logger
export const createChildLogger = (module: string) => {
  return logger.child({ 
    module,
    pid: process.pid 
  });
};

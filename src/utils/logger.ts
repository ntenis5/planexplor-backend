// src/utils/logger.ts

import pino from 'pino'; // Importo Pino (jo pino-http)

// Konfigurimi i logarit qendror
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname', // Injoro fushat që nuk nevojiten
    }
  } : undefined,
});

// Eksport i emërtuar që të mund të importohet nga shërbimet
export const logger = pinoLogger;

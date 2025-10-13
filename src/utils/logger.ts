import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info');

const getTransport = () => {
  if (isProduction) {
    return undefined;
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
  base: undefined,
  enabled: true,
});

export const createChildLogger = (module: string) => {
  return logger.child({ 
    module,
    pid: process.pid 
  });
};

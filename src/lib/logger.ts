import pino from 'pino';

/**
 * Structured logging service using Pino
 * Provides consistent logging across the application with context tracking
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  // Browser environments cannot use pino.destination() or worker_threads based transports like pino-pretty
  browser: {
    asObject: true,
  }
});

/**
 * Create a child logger with context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Log levels
 */
export const logLevels = {
  debug: (msg: string, data?: any) => logger.debug(data, msg),
  info: (msg: string, data?: any) => logger.info(data, msg),
  warn: (msg: string, data?: any) => logger.warn(data, msg),
  error: (msg: string, error?: Error | any, data?: any) => {
    if (error instanceof Error) {
      logger.error({ err: error, ...data }, msg);
    } else {
      logger.error(error, msg);
    }
  },
};

export default logger;

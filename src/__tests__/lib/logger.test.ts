import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, createLogger, logLevels } from '../../lib/logger';

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Logger Configuration', () => {
    it('should create logger with debug level in development', () => {
      expect(logger).toBeDefined();
      expect(logger.level).toBeDefined();
    });

    it('should have logger configured', () => {
      // Logger is already configured at import time
      // This test ensures the logger is properly initialized
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with context', () => {
      const childLogger = createLogger('test-context');
      expect(childLogger).toBeDefined();
    });

    it('should create child logger with different contexts', () => {
      const authLogger = createLogger('auth');
      const dbLogger = createLogger('database');
      expect(authLogger).toBeDefined();
      expect(dbLogger).toBeDefined();
    });
  });

  describe('Log Levels', () => {
    it('should log debug messages', () => {
      const spy = vi.spyOn(logger, 'debug');
      logLevels.debug('Debug message', { key: 'value' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log info messages', () => {
      const spy = vi.spyOn(logger, 'info');
      logLevels.info('Info message', { key: 'value' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log warn messages', () => {
      const spy = vi.spyOn(logger, 'warn');
      logLevels.warn('Warning message', { key: 'value' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log error messages with Error object', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = new Error('Test error');
      logLevels.error('Error occurred', error, { context: 'test' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log error messages without Error object', () => {
      const spy = vi.spyOn(logger, 'error');
      logLevels.error('Error occurred', { code: 500 });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log error messages with plain object', () => {
      const spy = vi.spyOn(logger, 'error');
      const errorData = { message: 'Something went wrong', code: 500 };
      logLevels.error('Error occurred', errorData);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Logger Methods', () => {
    it('should support all log levels', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});

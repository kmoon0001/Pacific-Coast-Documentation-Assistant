import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChildLogger, mockLoggerInstance, mockDestination, mockPino } = vi.hoisted(() => {
  const child = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };

  const logger = {
    child: vi.fn(() => child),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const destination = vi.fn(() => 'dest');
  const pinoFactory = vi.fn(() => logger) as any;
  pinoFactory.destination = destination;

  return {
    mockChildLogger: child,
    mockLoggerInstance: logger,
    mockDestination: destination,
    mockPino: pinoFactory,
  } as const;
});

vi.mock('pino', () => ({ default: mockPino }));

import { createLogger, logLevels } from './logger';

describe('logger', () => {
  beforeEach(() => {
    mockLoggerInstance.debug.mockClear();
    mockLoggerInstance.info.mockClear();
    mockLoggerInstance.warn.mockClear();
    mockLoggerInstance.error.mockClear();
    mockLoggerInstance.child.mockClear();
    mockChildLogger.child.mockClear();
    mockChildLogger.debug.mockClear();
    mockChildLogger.info.mockClear();
    mockChildLogger.warn.mockClear();
    mockChildLogger.error.mockClear();
  });

  it('configures pino with pretty transport in non-production environments', () => {
    expect(mockPino).toHaveBeenCalled();
    const config = mockPino.mock.calls[0][0];
    expect(config.level).toBe('debug');
    expect(config.browser?.asObject).toBe(true);
  });

  it('creates contextual child loggers', () => {
    const child = createLogger('therapy-session');
    expect(mockLoggerInstance.child).toHaveBeenCalledWith({ context: 'therapy-session' });
    expect(child).toBe(mockChildLogger);
  });

  it('routes structured messages through the helper log level functions', () => {
    const payload = { sessionId: 'abc123' };
    logLevels.debug('rendered', payload);
    expect(mockLoggerInstance.debug).toHaveBeenCalledWith(payload, 'rendered');

    logLevels.info('saved note');
    expect(mockLoggerInstance.info).toHaveBeenCalledWith(undefined, 'saved note');

    logLevels.warn('slow response', { duration: 1200 });
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith({ duration: 1200 }, 'slow response');
  });

  it('logs error instances with sanitized metadata', () => {
    const error = new Error('boom');
    logLevels.error('generate failed', error, { correlationId: 'req-1' });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, correlationId: 'req-1' }),
      'generate failed'
    );
  });

  it('logs non-error payloads without coercion', () => {
    logLevels.error('generate failed', { status: 500 });
    expect(mockLoggerInstance.error).toHaveBeenCalledWith({ status: 500 }, 'generate failed');
  });
});

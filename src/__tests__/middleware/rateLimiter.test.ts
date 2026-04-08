import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimiter, rateLimitPresets } from '../../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };
    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      statusCode: 200,
    };
    mockNext = vi.fn();
  });

  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const middleware = rateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const middleware = rateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });

      // Create a unique IP for this test
      const testReq = { ...mockReq, ip: '192.168.1.100' };

      // First request
      middleware(testReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request
      middleware(testReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      // Third request (should be blocked)
      const blockRes = {
        ...mockRes,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      middleware(testReq, blockRes, mockNext);
      expect(blockRes.status).toHaveBeenCalledWith(429);
      expect(blockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
        })
      );
    });

    it('should set rate limit headers', () => {
      const middleware = rateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should use custom message', () => {
      const customMessage = 'Custom rate limit message';
      const middleware = rateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      });

      // First request
      middleware(mockReq, mockRes, mockNext);

      // Second request (blocked)
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage,
        })
      );
    });

    it('should handle different IPs separately', () => {
      const middleware = rateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      // Request from IP 1
      const req1 = { ...mockReq, ip: '192.168.1.1', socket: { remoteAddress: '192.168.1.1' } };
      const res1 = { ...mockRes };
      const next1 = vi.fn();
      middleware(req1, res1, next1);
      expect(next1).toHaveBeenCalledTimes(1);

      // Request from IP 2 (should be allowed)
      const req2 = { ...mockReq, ip: '192.168.1.2', socket: { remoteAddress: '192.168.1.2' } };
      const res2 = { ...mockRes };
      const next2 = vi.fn();
      middleware(req2, res2, next2);
      expect(next2).toHaveBeenCalledTimes(1);
    });
  });

  describe('rateLimitPresets', () => {
    it('should have auth preset', () => {
      expect(rateLimitPresets.auth).toBeDefined();
      expect(typeof rateLimitPresets.auth).toBe('function');
    });

    it('should have api preset', () => {
      expect(rateLimitPresets.api).toBeDefined();
      expect(typeof rateLimitPresets.api).toBe('function');
    });

    it('should have aiGeneration preset', () => {
      expect(rateLimitPresets.aiGeneration).toBeDefined();
      expect(typeof rateLimitPresets.aiGeneration).toBe('function');
    });

    it('should have upload preset', () => {
      expect(rateLimitPresets.upload).toBeDefined();
      expect(typeof rateLimitPresets.upload).toBe('function');
    });

    it('should have sensitive preset', () => {
      expect(rateLimitPresets.sensitive).toBeDefined();
      expect(typeof rateLimitPresets.sensitive).toBe('function');
    });
  });
});

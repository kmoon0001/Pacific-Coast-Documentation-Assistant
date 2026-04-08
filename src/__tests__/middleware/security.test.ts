import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentSecurityPolicy, sanitizeRequest, corsMiddleware, securityAuditLogger } from '../../middleware/security';

describe('Security Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      query: {},
      body: {},
      params: {},
      headers: {},
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
    };
    mockRes = {
      setHeader: vi.fn(),
      sendStatus: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe('contentSecurityPolicy', () => {
    it('should set CSP headers', () => {
      const middleware = contentSecurityPolicy();
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.stringContaining("default-src 'self'"));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set HSTS header', () => {
      const middleware = contentSecurityPolicy();
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', expect.any(String));
    });

    it('should set X-Frame-Options', () => {
      const middleware = contentSecurityPolicy();
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set X-Content-Type-Options', () => {
      const middleware = contentSecurityPolicy();
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should respect config options', () => {
      const middleware = contentSecurityPolicy({ enableCSP: false });
      middleware(mockReq, mockRes, mockNext);

      const cspCalls = (mockRes.setHeader as any).mock.calls.filter(
        (call: any) => call[0] === 'Content-Security-Policy'
      );
      expect(cspCalls.length).toBe(0);
    });
  });

  describe('sanitizeRequest', () => {
    it('should sanitize query parameters', () => {
      mockReq.query = {
        name: '<script>alert("xss")</script>John',
        age: '25',
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.query.name).not.toContain('<script>');
      expect(mockReq.query.age).toBe('25');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize body object', () => {
      mockReq.body = {
        comment: '<script>alert("xss")</script>Hello',
        rating: 5,
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.comment).not.toContain('<script>');
      expect(mockReq.body.rating).toBe(5);
    });

    it('should remove javascript: protocol', () => {
      mockReq.body = {
        link: 'javascript:alert("xss")',
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.link).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      mockReq.body = {
        html: '<div onclick="alert()">Click</div>',
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.html).not.toContain('onclick=');
    });

    it('should handle nested objects', () => {
      mockReq.body = {
        user: {
          name: '<script>alert("xss")</script>John',
          profile: {
            bio: 'javascript:alert("xss")',
          },
        },
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.user.name).not.toContain('<script>');
      expect(mockReq.body.user.profile.bio).not.toContain('javascript:');
    });

    it('should handle arrays', () => {
      mockReq.body = {
        tags: ['<script>tag1</script>', 'tag2', 'javascript:tag3'],
      };

      sanitizeRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.tags[0]).not.toContain('<script>');
      expect(mockReq.body.tags[2]).not.toContain('javascript:');
    });
  });

  describe('corsMiddleware', () => {
    it('should set CORS headers for allowed origin', () => {
      mockReq.headers.origin = 'http://localhost:3001';
      const middleware = corsMiddleware(['http://localhost:3001']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3001');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set CORS headers for disallowed origin', () => {
      mockReq.headers.origin = 'http://evil.com';
      const middleware = corsMiddleware(['http://localhost:3001']);

      middleware(mockReq, mockRes, mockNext);

      const originCalls = (mockRes.setHeader as any).mock.calls.filter(
        (call: any) => call[0] === 'Access-Control-Allow-Origin'
      );
      expect(originCalls.length).toBe(0);
    });

    it('should handle OPTIONS preflight requests', () => {
      mockReq.method = 'OPTIONS';
      mockReq.headers.origin = 'http://localhost:3001';
      const middleware = corsMiddleware(['http://localhost:3001']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.sendStatus).toHaveBeenCalledWith(204);
    });
  });

  describe('securityAuditLogger', () => {
    it('should log suspicious patterns', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockReq.query = { search: '../../../etc/passwd' };
      securityAuditLogger(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should detect SQL injection attempts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockReq.body = { query: 'SELECT * FROM users' };
      securityAuditLogger(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should not log for safe requests', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockReq.query = { search: 'therapy notes' };
      securityAuditLogger(mockReq, mockRes, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

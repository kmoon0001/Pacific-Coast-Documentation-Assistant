import { Document } from '../types';

/**
 * SecurityHardeningService
 * Provides file validation, rate limiting, and security audit logging
 */
class SecurityHardeningService {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private securityEvents: Array<{
    timestamp: Date;
    userId: string;
    action: string;
    details: Record<string, any>;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  private readonly ALLOWED_FILE_TYPES = ['pdf', 'docx', 'txt', 'md'];
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly FILE_SIGNATURES: Record<string, string[]> = {
    pdf: ['25504446'], // %PDF
    docx: ['504b0304'], // PK..
    txt: [],
    md: [],
  };

  /**
   * Validate file before upload
   */
  validateFile(file: File, fileType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(fileType)) {
      errors.push(
        `File type '${fileType}' is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`
      );
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File size (${file.size} bytes) exceeds maximum allowed size (${this.MAX_FILE_SIZE} bytes)`
      );
    }

    // Check file size minimum
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check file name
    if (!file.name || file.name.length === 0) {
      errors.push('File name is required');
    }

    // Check for suspicious patterns in filename
    if (file.name && /[<>:"|?*]/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file content
   */
  async validateFileContent(
    file: File,
    fileType: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Read first few bytes to check file signature
      const buffer = await file.slice(0, 4).arrayBuffer();
      const view = new Uint8Array(buffer);
      const signature = Array.from(view)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const expectedSignatures = this.FILE_SIGNATURES[fileType];
      if (expectedSignatures && expectedSignatures.length > 0) {
        const isValidSignature = expectedSignatures.some((sig) => signature.startsWith(sig));
        if (!isValidSignature) {
          errors.push(`File signature does not match expected ${fileType} format`);
        }
      }

      // Check for suspicious content patterns
      const text = await file.text();
      if (this.containsSuspiciousPatterns(text)) {
        errors.push('File contains suspicious content patterns');
      }
    } catch (error) {
      errors.push(
        `Failed to validate file content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for suspicious content patterns
   */
  private containsSuspiciousPatterns(content: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /eval\s*\(/gi, // Eval function
      /exec\s*\(/gi, // Exec function
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check rate limit for user
   */
  checkRateLimit(
    userId: string,
    action: string,
    limit: number = 100,
    windowMs: number = 60000
  ): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();

    let entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.rateLimitMap.set(key, entry);
      return true;
    }

    entry.count++;

    if (entry.count > limit) {
      this.logSecurityEvent(
        userId,
        'rate_limit_exceeded',
        { action, limit, count: entry.count },
        'medium'
      );
      return false;
    }

    return true;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(
    userId: string,
    action: string,
    limit: number = 100
  ): { remaining: number; resetTime: Date } {
    const key = `${userId}:${action}`;
    const entry = this.rateLimitMap.get(key);

    if (!entry) {
      return {
        remaining: limit,
        resetTime: new Date(Date.now() + 60000),
      };
    }

    return {
      remaining: Math.max(0, limit - entry.count),
      resetTime: new Date(entry.resetTime),
    };
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string, key: string): string {
    // Simple XOR encryption for demonstration
    // In production, use proper encryption like AES-256
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encrypted: string, key: string): string {
    try {
      const data = atob(encrypted); // Base64 decode
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch (error) {
      throw new Error(
        `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' = 'low'
  ): void {
    this.securityEvents.push({
      timestamp: new Date(),
      userId,
      action,
      details,
      severity,
    });

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }

    // Log high severity events
    if (severity === 'high') {
      console.warn(`[SECURITY] High severity event: ${action} by user ${userId}`, details);
    }
  }

  /**
   * Get security events
   */
  getSecurityEvents(userId?: string, severity?: 'low' | 'medium' | 'high'): Array<any> {
    let events = this.securityEvents;

    if (userId) {
      events = events.filter((e) => e.userId === userId);
    }

    if (severity) {
      events = events.filter((e) => e.severity === severity);
    }

    return events;
  }

  /**
   * Get security report
   */
  getSecurityReport(): {
    totalEvents: number;
    highSeverityEvents: number;
    mediumSeverityEvents: number;
    lowSeverityEvents: number;
    recentEvents: Array<any>;
  } {
    const highSeverity = this.securityEvents.filter((e) => e.severity === 'high').length;
    const mediumSeverity = this.securityEvents.filter((e) => e.severity === 'medium').length;
    const lowSeverity = this.securityEvents.filter((e) => e.severity === 'low').length;

    return {
      totalEvents: this.securityEvents.length,
      highSeverityEvents: highSeverity,
      mediumSeverityEvents: mediumSeverity,
      lowSeverityEvents: lowSeverity,
      recentEvents: this.securityEvents.slice(-10),
    };
  }

  /**
   * Clear security events
   */
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Validate document for security
   */
  validateDocumentSecurity(document: Document): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for suspicious metadata
    if (document.metadata && typeof document.metadata === 'object') {
      const metadataStr = JSON.stringify(document.metadata);
      if (this.containsSuspiciousPatterns(metadataStr)) {
        issues.push('Document metadata contains suspicious patterns');
      }
    }

    // Check content length
    if (document.content.length > 10 * 1024 * 1024) {
      issues.push('Document content exceeds maximum allowed size');
    }

    // Check for suspicious content
    if (this.containsSuspiciousPatterns(document.content)) {
      issues.push('Document content contains suspicious patterns');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Sanitize document content
   */
  sanitizeDocumentContent(content: string): string {
    // Remove script tags
    let sanitized = content.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    return sanitized;
  }

  /**
   * Clear rate limit map
   */
  clearRateLimits(): void {
    this.rateLimitMap.clear();
  }

  /**
   * Get allowed file types
   */
  getAllowedFileTypes(): string[] {
    return [...this.ALLOWED_FILE_TYPES];
  }

  /**
   * Get max file size
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }
}

export const securityHardeningService = new SecurityHardeningService();

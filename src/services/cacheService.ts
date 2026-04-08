import { CacheEntry, CacheStats } from '../types';

/**
 * CacheService
 * Provides in-memory caching with TTL support
 * Tracks cache statistics and performance metrics
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hits++;

    return entry.value as T;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    // Clean up expired entries
    this.cleanupExpired();

    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.value).length;
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    const averageEntrySize = this.cache.size > 0 ? totalSize / this.cache.size : 0;

    return {
      totalEntries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      averageEntrySize,
      totalSize,
    };
  }

  /**
   * Get cache health status
   */
  getHealth(): { status: 'healthy' | 'degraded' | 'unhealthy'; message: string } {
    const stats = this.getStats();

    if (stats.totalSize > 100 * 1024 * 1024) {
      // Over 100MB
      return { status: 'unhealthy', message: 'Cache size exceeds 100MB' };
    }

    if (stats.totalSize > 50 * 1024 * 1024) {
      // Over 50MB
      return { status: 'degraded', message: 'Cache size exceeds 50MB' };
    }

    if (stats.hitRate < 30) {
      return { status: 'degraded', message: 'Cache hit rate below 30%' };
    }

    return { status: 'healthy', message: 'Cache is operating normally' };
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return count;
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidatePrefix(prefix: string): number {
    return this.invalidatePattern(new RegExp(`^${prefix}`));
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry count
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Get cache entry details
   */
  getEntry<T>(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }

  /**
   * Set default TTL for new entries
   */
  setDefaultTTL(ttlMs: number): void {
    this.defaultTTL = ttlMs;
  }

  /**
   * Get default TTL
   */
  getDefaultTTL(): number {
    return this.defaultTTL;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheService = new CacheService();

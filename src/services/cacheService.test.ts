import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from './cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear();
    cacheService.resetStats();
  });

  describe('set and get', () => {
    it('should set and retrieve a value', () => {
      cacheService.set('key1', 'value1');
      const value = cacheService.get('key1');

      expect(value).toBe('value1');
    });

    it('should handle different data types', () => {
      cacheService.set('string', 'test');
      cacheService.set('number', 42);
      cacheService.set('object', { foo: 'bar' });
      cacheService.set('array', [1, 2, 3]);

      expect(cacheService.get('string')).toBe('test');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('object')).toEqual({ foo: 'bar' });
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
    });

    it('should return null for non-existent keys', () => {
      const value = cacheService.get('nonexistent');

      expect(value).toBeNull();
    });

    it('should overwrite existing values', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key1', 'value2');

      expect(cacheService.get('key1')).toBe('value2');
    });

    it('should track cache hits', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('key1');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', () => {
      cacheService.get('nonexistent1');
      cacheService.get('nonexistent2');

      const stats = cacheService.getStats();
      expect(stats.misses).toBe(2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cacheService.set('key1', 'value1', 100); // 100ms TTL
      expect(cacheService.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheService.get('key1')).toBeNull();
    });

    it('should use default TTL if not specified', () => {
      cacheService.set('key1', 'value1');
      const entry = cacheService.getEntry('key1');

      expect(entry).toBeDefined();
      expect(entry?.expiresAt).toBeInstanceOf(Date);
    });

    it('should allow custom TTL', () => {
      const customTTL = 10000; // 10 seconds
      cacheService.set('key1', 'value1', customTTL);
      const entry = cacheService.getEntry('key1');

      expect(entry).toBeDefined();
      const timeDiff = entry!.expiresAt.getTime() - entry!.createdAt.getTime();
      expect(timeDiff).toBeCloseTo(customTTL, -2);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cacheService.set('key1', 'value1');

      expect(cacheService.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cacheService.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cacheService.set('key1', 'value1', 100);
      expect(cacheService.has('key1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cacheService.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.has('key1')).toBe(true);

      const deleted = cacheService.delete('key1');
      expect(deleted).toBe(true);
      expect(cacheService.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheService.delete('nonexistent');

      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      expect(cacheService.size()).toBe(3);

      cacheService.clear();

      expect(cacheService.size()).toBe(0);
      expect(cacheService.get('key1')).toBeNull();
    });

    it('should reset statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('nonexistent');

      let stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      cacheService.clear();

      stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.get('key1');
      cacheService.get('nonexistent');

      const stats = cacheService.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(50, 1);
      expect(stats.averageEntrySize).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('key1');
      cacheService.get('key1');
      cacheService.get('nonexistent');

      const stats = cacheService.getStats();

      expect(stats.hitRate).toBeCloseTo(75, 1);
    });

    it('should handle zero requests', () => {
      const stats = cacheService.getStats();

      expect(stats.hitRate).toBe(0);
    });
  });

  describe('getHealth', () => {
    it('should return healthy status for normal cache', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');

      const health = cacheService.getHealth();

      expect(health.status).toBe('healthy');
    });

    it('should return degraded status for low hit rate', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('nonexistent1');
      cacheService.get('nonexistent2');
      cacheService.get('nonexistent3');
      cacheService.get('nonexistent4');
      cacheService.get('nonexistent5');

      const health = cacheService.getHealth();

      expect(health.status).toBe('degraded');
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate entries matching pattern', () => {
      cacheService.set('user:1', 'data1');
      cacheService.set('user:2', 'data2');
      cacheService.set('post:1', 'data3');

      const count = cacheService.invalidatePattern(/^user:/);

      expect(count).toBe(2);
      expect(cacheService.has('user:1')).toBe(false);
      expect(cacheService.has('user:2')).toBe(false);
      expect(cacheService.has('post:1')).toBe(true);
    });

    it('should return count of invalidated entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      const count = cacheService.invalidatePattern(/^key[12]$/);

      expect(count).toBe(2);
    });

    it('should handle no matches', () => {
      cacheService.set('key1', 'value1');

      const count = cacheService.invalidatePattern(/^nomatch:/);

      expect(count).toBe(0);
      expect(cacheService.has('key1')).toBe(true);
    });
  });

  describe('invalidatePrefix', () => {
    it('should invalidate entries with prefix', () => {
      cacheService.set('user:1', 'data1');
      cacheService.set('user:2', 'data2');
      cacheService.set('post:1', 'data3');

      const count = cacheService.invalidatePrefix('user:');

      expect(count).toBe(2);
      expect(cacheService.has('user:1')).toBe(false);
      expect(cacheService.has('user:2')).toBe(false);
      expect(cacheService.has('post:1')).toBe(true);
    });
  });

  describe('getKeys', () => {
    it('should return all cache keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      const keys = cacheService.getKeys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys).toHaveLength(3);
    });

    it('should return empty array when cache is empty', () => {
      const keys = cacheService.getKeys();

      expect(keys).toHaveLength(0);
    });
  });

  describe('size', () => {
    it('should return cache size', () => {
      expect(cacheService.size()).toBe(0);

      cacheService.set('key1', 'value1');
      expect(cacheService.size()).toBe(1);

      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);

      cacheService.delete('key1');
      expect(cacheService.size()).toBe(1);
    });
  });

  describe('setDefaultTTL and getDefaultTTL', () => {
    it('should set and get default TTL', () => {
      const customTTL = 30000;
      cacheService.setDefaultTTL(customTTL);

      expect(cacheService.getDefaultTTL()).toBe(customTTL);
    });

    it('should use new default TTL for new entries', () => {
      const customTTL = 10000;
      cacheService.setDefaultTTL(customTTL);

      cacheService.set('key1', 'value1');
      const entry = cacheService.getEntry('key1');

      const timeDiff = entry!.expiresAt.getTime() - entry!.createdAt.getTime();
      expect(timeDiff).toBeCloseTo(customTTL, -2);
    });
  });

  describe('getEntry', () => {
    it('should return cache entry details', () => {
      cacheService.set('key1', 'value1');
      const entry = cacheService.getEntry('key1');

      expect(entry).toBeDefined();
      expect(entry?.key).toBe('key1');
      expect(entry?.value).toBe('value1');
      expect(entry?.createdAt).toBeInstanceOf(Date);
      expect(entry?.expiresAt).toBeInstanceOf(Date);
      expect(entry?.hits).toBe(0);
    });

    it('should return null for non-existent entry', () => {
      const entry = cacheService.getEntry('nonexistent');

      expect(entry).toBeNull();
    });

    it('should track hits in entry', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('key1');

      const entry = cacheService.getEntry('key1');

      expect(entry?.hits).toBe(2);
    });
  });

  describe('resetStats', () => {
    it('should reset hit and miss counters', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('nonexistent');

      let stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      cacheService.resetStats();

      stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle policy caching', () => {
      const policies = [
        { id: 'p1', name: 'Policy 1' },
        { id: 'p2', name: 'Policy 2' },
      ];

      cacheService.set('policies:all', policies, 60000);
      const cached = cacheService.get('policies:all');

      expect(cached).toEqual(policies);
    });

    it('should handle search result caching', () => {
      const searchResults = [
        { id: 'doc1', title: 'Document 1', score: 0.95 },
        { id: 'doc2', title: 'Document 2', score: 0.87 },
      ];

      cacheService.set('search:therapy', searchResults, 30000);
      const cached = cacheService.get('search:therapy');

      expect(cached).toEqual(searchResults);
    });

    it('should handle analytics caching', () => {
      const analytics = {
        totalDocuments: 100,
        adoptionRate: 85,
        complianceScore: 92,
      };

      cacheService.set('analytics:summary', analytics, 300000);
      const cached = cacheService.get('analytics:summary');

      expect(cached).toEqual(analytics);
    });

    it('should invalidate related cache entries', () => {
      cacheService.set('doc:1:content', 'content1');
      cacheService.set('doc:1:metadata', 'metadata1');
      cacheService.set('doc:2:content', 'content2');

      const count = cacheService.invalidatePrefix('doc:1:');

      expect(count).toBe(2);
      expect(cacheService.has('doc:1:content')).toBe(false);
      expect(cacheService.has('doc:1:metadata')).toBe(false);
      expect(cacheService.has('doc:2:content')).toBe(true);
    });
  });
});

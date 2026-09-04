interface CacheItem<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class MemoryCacheStore {
  private cache = new Map<string, CacheItem<unknown>>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = 10, tags: string[] = []): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt, tags });
  }

  invalidateTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new MemoryCacheStore();

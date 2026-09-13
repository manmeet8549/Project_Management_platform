/**
 * Client-Side LocalStorage & Memory Cache Manager
 * Implements Stale-While-Revalidate (SWR) pattern for local-first data access with Supabase/Backend sync.
 */

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours stale fallback TTL

class ClientCacheStore {
  private memoryCache = new Map<string, ClientCacheEntry<unknown>>();

  private getStorageKey(key: string): string {
    return `pm_cache_${key}`;
  }

  /**
   * Reads data from Memory Cache or LocalStorage.
   * Returns { data, isStale }
   */
  get<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): { data: T | null; isStale: boolean } {
    const now = Date.now();

    // 1. Check Memory Cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key) as ClientCacheEntry<T>;
      const isStale = (now - entry.timestamp) > ttlMs;
      return { data: entry.data, isStale };
    }

    // 2. Check LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.getStorageKey(key));
        if (raw) {
          const entry: ClientCacheEntry<T> = JSON.parse(raw);
          const age = now - entry.timestamp;
          if (age < STALE_TTL_MS) {
            this.memoryCache.set(key, entry);
            const isStale = age > ttlMs;
            return { data: entry.data, isStale };
          }
        }
      } catch (err) {
        console.warn('LocalStorage read error for key:', key, err);
      }
    }

    return { data: null, isStale: true };
  }

  /**
   * Saves data into both Memory Cache & LocalStorage
   */
  set<T>(key: string, data: T): void {
    const entry: ClientCacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    this.memoryCache.set(key, entry);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
      } catch (err) {
        console.warn('LocalStorage set error for key:', key, err);
      }
    }
  }

  /**
   * Removes specific cache key
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.getStorageKey(key));
      } catch (err) {
        console.warn('LocalStorage remove error for key:', key, err);
      }
    }
  }

  /**
   * Clears all client cache entries matching prefix
   */
  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('pm_cache_')) {
            localStorage.removeItem(k);
          }
        });
      } catch (err) {
        console.warn('LocalStorage clear error:', err);
      }
    }
  }
}

export const clientCache = new ClientCacheStore();

/**
 * Invalidates client-side cache keys
 */
export function invalidateClientCache(keys?: string[]): void {
  if (keys && keys.length > 0) {
    keys.forEach((key) => clientCache.remove(key));
  } else {
    clientCache.clear();
  }
}

/**
 * Smart fetch function with Stale-While-Revalidate (SWR) logic.
 * 1. Immediately returns cached data if present.
 * 2. Fetches fresh data from API in background if cache is stale or missing.
 * 3. Updates cache and triggers callback when fresh data arrives.
 */
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  onData: (data: T, fromCache: boolean) => void,
  options?: { ttlMs?: number; forceRefresh?: boolean }
): Promise<T | null> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const forceRefresh = options?.forceRefresh ?? false;

  // 1. Return cached data immediately if present and not forcing refresh
  if (!forceRefresh) {
    const { data: cachedData, isStale } = clientCache.get<T>(cacheKey, ttlMs);
    if (cachedData !== null) {
      onData(cachedData, true);
      // If data is fresh and not stale, skip network fetch!
      if (!isStale) {
        return cachedData;
      }
    }
  }

  // 2. Fetch fresh data from network / Supabase API
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const resData = await res.json();
    if (resData.success && resData.data !== undefined) {
      const freshData = resData.data as T;
      clientCache.set(cacheKey, freshData);
      onData(freshData, false);
      return freshData;
    }
  } catch (err) {
    console.warn(`Fetch error for ${url}, falling back to cache:`, err);
    // If network fetch failed, fall back to whatever cached data exists
    const { data: cachedData } = clientCache.get<T>(cacheKey, STALE_TTL_MS);
    if (cachedData !== null) {
      onData(cachedData, true);
      return cachedData;
    }
  }

  return null;
}

/**
 * Client-Side LocalStorage & Memory Cache Manager
 * Implements Stale-While-Revalidate (SWR) pattern for local-first data access with Supabase/Backend sync.
 */

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CachedTaskItem {
  id: string;
  projectId?: string;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  description?: string | null;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours stale fallback TTL

class ClientCacheStore {
  private memoryCache = new Map<string, ClientCacheEntry<unknown>>();

  private getStorageKey(key: string): string {
    let userPrefix = 'anonymous';
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) userPrefix = parsed.id;
        }
      } catch {}
    }
    return `pm_cache_${userPrefix}_${key}`;
  }

  /**
   * Reads data from Memory Cache or LocalStorage.
   * Returns { data, isStale }
   */
  get<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): { data: T | null; isStale: boolean } {
    const now = Date.now();
    const internalKey = this.getStorageKey(key);

    // 1. Check Memory Cache
    if (this.memoryCache.has(internalKey)) {
      const entry = this.memoryCache.get(internalKey) as ClientCacheEntry<T>;
      const isStale = (now - entry.timestamp) > ttlMs;
      return { data: entry.data, isStale };
    }

    // 2. Check LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(internalKey);
        if (raw) {
          const entry: ClientCacheEntry<T> = JSON.parse(raw);
          const age = now - entry.timestamp;
          if (age < STALE_TTL_MS) {
            this.memoryCache.set(internalKey, entry);
            const isStale = age > ttlMs;
            return { data: entry.data, isStale };
          }
        }
      } catch (err) {
        console.warn('LocalStorage read error for key:', internalKey, err);
      }
    }

    return { data: null, isStale: true };
  }

  /**
   * Saves data into both Memory Cache & LocalStorage
   */
  set<T>(key: string, data: T): void {
    const internalKey = this.getStorageKey(key);
    const entry: ClientCacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    this.memoryCache.set(internalKey, entry);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(internalKey, JSON.stringify(entry));
      } catch (err) {
        console.warn('LocalStorage set error for key:', internalKey, err);
      }
    }
  }

  /**
   * Removes specific cache key
   */
  remove(key: string): void {
    const internalKey = this.getStorageKey(key);
    this.memoryCache.delete(internalKey);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(internalKey);
      } catch (err) {
        console.warn('LocalStorage remove error for key:', internalKey, err);
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

  /**
   * Directly updates a task across all relevant cached task lists (project list, global list, dashboard list)
   */
  updateTaskInCache(projectId: string, taskId: string, updates: Record<string, unknown>): void {
    const projectKey = `tasks_list_${projectId}`;
    const { data: projectTasks } = this.get<CachedTaskItem[]>(projectKey, Infinity);
    if (Array.isArray(projectTasks)) {
      const updated = projectTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      this.set(projectKey, updated);
    }

    const { data: globalTasks } = this.get<CachedTaskItem[]>('tasks_list', Infinity);
    if (Array.isArray(globalTasks)) {
      const updated = globalTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      this.set('tasks_list', updated);
    }

    const { data: dashTasks } = this.get<CachedTaskItem[]>('dashboard_tasks', Infinity);
    if (Array.isArray(dashTasks)) {
      const updated = dashTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      this.set('dashboard_tasks', updated);
    }
  }

  /**
   * Directly adds a new task to cached task lists
   */
  addTaskToCache(projectId: string, newTask: CachedTaskItem): void {
    const projectKey = `tasks_list_${projectId}`;
    const { data: projectTasks } = this.get<CachedTaskItem[]>(projectKey, Infinity);
    this.set(projectKey, [newTask, ...(Array.isArray(projectTasks) ? projectTasks : [])]);

    const { data: globalTasks } = this.get<CachedTaskItem[]>('tasks_list', Infinity);
    this.set('tasks_list', [newTask, ...(Array.isArray(globalTasks) ? globalTasks : [])]);

    const { data: dashTasks } = this.get<CachedTaskItem[]>('dashboard_tasks', Infinity);
    this.set('dashboard_tasks', [newTask, ...(Array.isArray(dashTasks) ? dashTasks : [])]);
  }

  /**
   * Directly removes a task from cached task lists
   */
  deleteTaskFromCache(projectId: string, taskId: string): void {
    const projectKey = `tasks_list_${projectId}`;
    const { data: projectTasks } = this.get<CachedTaskItem[]>(projectKey, Infinity);
    if (Array.isArray(projectTasks)) {
      this.set(projectKey, projectTasks.filter((t) => t.id !== taskId));
    }

    const { data: globalTasks } = this.get<CachedTaskItem[]>('tasks_list', Infinity);
    if (Array.isArray(globalTasks)) {
      this.set('tasks_list', globalTasks.filter((t) => t.id !== taskId));
    }

    const { data: dashTasks } = this.get<CachedTaskItem[]>('dashboard_tasks', Infinity);
    if (Array.isArray(dashTasks)) {
      this.set('dashboard_tasks', dashTasks.filter((t) => t.id !== taskId));
    }
  }

  /**
   * Replaces a temporary client task ID with the real database ID in cached task lists
   */
  replaceTaskIdInCache(projectId: string, tempId: string, realId: string): void {
    const projectKey = `tasks_list_${projectId}`;
    const { data: projectTasks } = this.get<CachedTaskItem[]>(projectKey, Infinity);
    if (Array.isArray(projectTasks)) {
      const updated = projectTasks.map((t) => (t.id === tempId ? { ...t, id: realId } : t));
      this.set(projectKey, updated);
    }

    const { data: globalTasks } = this.get<CachedTaskItem[]>('tasks_list', Infinity);
    if (Array.isArray(globalTasks)) {
      const updated = globalTasks.map((t) => (t.id === tempId ? { ...t, id: realId } : t));
      this.set('tasks_list', updated);
    }

    const { data: dashTasks } = this.get<CachedTaskItem[]>('dashboard_tasks', Infinity);
    if (Array.isArray(dashTasks)) {
      const updated = dashTasks.map((t) => (t.id === tempId ? { ...t, id: realId } : t));
      this.set('dashboard_tasks', updated);
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

  // 1. Immediately return cached data if present (instant 0ms render on reload!)
  const { data: cachedData, isStale } = clientCache.get<T>(cacheKey, ttlMs);
  if (cachedData !== null) {
    onData(cachedData, true);
    // If data is fresh and not forced to refresh, skip background fetch
    if (!isStale && !forceRefresh) {
      return cachedData;
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

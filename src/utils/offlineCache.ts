const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function cacheData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(`edutrack_cache_${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

export function getCachedData<T>(key: string, maxAge = DEFAULT_TTL): T | null {
  try {
    const raw = localStorage.getItem(`edutrack_cache_${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAge) {
      localStorage.removeItem(`edutrack_cache_${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(`edutrack_cache_${key}`);
  } else {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("edutrack_cache_"));
    keys.forEach((k) => localStorage.removeItem(k));
  }
}

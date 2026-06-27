export type OfflineCacheKey = 'posts' | 'vlogs' | 'meetRooms';

const OFFLINE_CACHE_PREFIX = 'dronehub-offline-cache';
const OFFLINE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const getStorageKey = (key: OfflineCacheKey) => `${OFFLINE_CACHE_PREFIX}:${key}`;

type CachedPayload<T> = { cachedAt: number; data: T };

const parseCachedPayload = <T,>(rawValue: string): CachedPayload<T> | null => {
  try {
    return JSON.parse(rawValue) as CachedPayload<T>;
  } catch {
    return null;
  }
};

export const readCachedData = <T,>(key: OfflineCacheKey, options?: { allowStale?: boolean }): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(key));
    if (!rawValue) return null;

    const parsed = parseCachedPayload<T>(rawValue);
    if (!parsed) return null;

    const isFresh = Date.now() - parsed.cachedAt < OFFLINE_CACHE_TTL_MS;
    if (isFresh || options?.allowStale) {
      return parsed.data;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to read offline cache for ${key}:`, error);
    return null;
  }
};

export const writeCachedData = <T,>(key: OfflineCacheKey, data: T) => {
  if (typeof window === 'undefined') return;

  try {
    const payload: CachedPayload<T> = {
      cachedAt: Date.now(),
      data,
    };

    window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
  } catch (error) {
    console.warn(`Failed to write offline cache for ${key}:`, error);
  }
};

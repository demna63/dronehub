export type OfflineCacheKey = 'posts' | 'vlogs' | 'meetRooms';

const OFFLINE_CACHE_PREFIX = 'dronehub-offline-cache';
const OFFLINE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const getStorageKey = (key: OfflineCacheKey) => `${OFFLINE_CACHE_PREFIX}:${key}`;

export const readCachedData = <T,>(key: OfflineCacheKey): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storageKey = getStorageKey(key);
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as { cachedAt: number; data: T };
    const isFresh = Date.now() - parsed.cachedAt < OFFLINE_CACHE_TTL_MS;

    return isFresh ? parsed.data : null;
  } catch (error) {
    console.warn(`Failed to read offline cache for ${key}:`, error);
    return null;
  }
};

export const writeCachedData = <T,>(key: OfflineCacheKey, data: T) => {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      cachedAt: Date.now(),
      data,
    };

    window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
  } catch (error) {
    console.warn(`Failed to write offline cache for ${key}:`, error);
  }
};

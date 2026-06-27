import { describe, expect, it } from 'vitest';
import { isUserAdmin, isDemoAuthEnabled } from './authUtils';
import { pickAllowedProfileFields } from './userProfileAllowlist';
import { readCachedData, writeCachedData } from './offlineCache';
import type { User } from '../types';

describe('authUtils', () => {
  it('uses isAdmin as the single admin flag', () => {
    expect(isUserAdmin({ id: '1', name: 'A', email: 'a@test.com', avatar: '', reputation: 0, isAdmin: true })).toBe(true);
    expect(isUserAdmin({ id: '1', name: 'A', email: 'a@test.com', avatar: '', reputation: 0, role: 'admin' })).toBe(false);
  });
});

describe('userProfileAllowlist', () => {
  it('strips privileged profile fields', () => {
    const user: Partial<User> = {
      name: 'Pilot',
      bio: 'FPV',
      isAdmin: true,
      role: 'admin',
      reputation: 999,
    };

    expect(pickAllowedProfileFields(user)).toEqual({
      name: 'Pilot',
      bio: 'FPV',
    });
  });
});

describe('offlineCache', () => {
  it('returns stale cache when allowStale is enabled', () => {
    const storage = new Map<string, string>();

    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
        },
      },
      configurable: true,
    });

    writeCachedData('posts', [{ id: '1' } as never]);
    const payload = storage.get('dronehub-offline-cache:posts');
    if (!payload) throw new Error('missing cache payload');

    const parsed = JSON.parse(payload);
    parsed.cachedAt = Date.now() - 1000 * 60 * 60 * 48;
    storage.set('dronehub-offline-cache:posts', JSON.stringify(parsed));

    expect(readCachedData('posts')).toBeNull();
    expect(readCachedData('posts', { allowStale: true })).toEqual([{ id: '1' }]);
  });
});

describe('isDemoAuthEnabled', () => {
  it('respects the explicit false flag', () => {
    const previous = import.meta.env.VITE_ENABLE_DEMO_AUTH;
    import.meta.env.VITE_ENABLE_DEMO_AUTH = 'false';
    expect(isDemoAuthEnabled()).toBe(false);
    import.meta.env.VITE_ENABLE_DEMO_AUTH = previous;
  });
});

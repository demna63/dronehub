import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The service worker is plain JS served as-is, so it never passes through the
 * type checker or the bundler. These assertions are the only thing standing
 * between a one-character edit and a site that pins every returning visitor to
 * an old build.
 *
 * That is not hypothetical. Under the previous version one browser held three
 * different vintages of index.html and rendered the oldest of them after a
 * fresh deploy: the shell was served cache-first, the shell names the hashed
 * bundles, and those bundles are immutable — so nothing ever forced an update.
 */
const sw = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');
const firebaseConfig = JSON.parse(
  readFileSync(resolve(__dirname, '../../firebase.json'), 'utf8'),
) as { hosting: { headers?: { source: string; headers: { key: string; value: string }[] }[] } };

const headerFor = (source: string, key: string) =>
  firebaseConfig.hosting.headers
    ?.find((entry) => entry.source === source)
    ?.headers.find((header) => header.key === key)?.value;

describe('service worker caching policy', () => {
  it('serves the HTML shell network-first, by path as well as by request mode', () => {
    // `request.mode === 'navigate'` is not enough: a plain fetch of '/' or
    // '/index.html' is not a navigation, and the old code fell through to the
    // cache-first branch because both paths are in APP_SHELL.
    expect(sw).toMatch(/NETWORK_FIRST\s*=\s*\[[^\]]*'\/'[^\]]*'\/index\.html'[^\]]*\]/);
    expect(sw).toContain("NETWORK_FIRST.includes(url.pathname)");
  });

  it('only writes a shell into the cache when the response was ok', () => {
    // Firebase rewrites ** -> /index.html, so an error page during a bad deploy
    // would otherwise be cached and then served as the offline fallback.
    expect(sw).toMatch(/if \(response && response\.ok\)/);
  });

  it('falls back to the cached shell when the network fails', () => {
    expect(sw).toMatch(/\.catch\(\(\) => caches\.match\('\/index\.html'\)\)/);
  });

  it('names its cache with a version that can be bumped', () => {
    expect(sw).toMatch(/const CACHE_NAME = 'dronehub-shell-v\d+'/);
  });

  it('deletes every cache but the current one on activate', () => {
    expect(sw).toMatch(/keys\.filter\(\(key\) => key !== CACHE_NAME\)/);
  });

  it('is itself served no-cache, so a new worker can be picked up', () => {
    // A cached sw.js is a cache that can never be invalidated.
    expect(headerFor('/sw.js', 'Cache-Control')).toBe('no-cache');
  });

  it('serves index.html no-cache from hosting too', () => {
    expect(headerFor('/index.html', 'Cache-Control')).toBe('no-cache');
  });

  it('keeps hashed assets immutable, which is what makes cache-first safe', () => {
    expect(headerFor('/assets/**', 'Cache-Control')).toContain('immutable');
  });
});

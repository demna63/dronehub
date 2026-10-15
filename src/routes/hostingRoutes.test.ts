import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Hosting answers a path with the SPA shell only if a rewrite claims it; any
 * other path gets dist/404.html with a real 404 status. The shell rewrite is a
 * hand-written regex in firebase.json, so a route added to AppRoutes without
 * updating it would 404 on a hard refresh. This test reads both files and
 * fails the build when they drift.
 */
const root = resolve(__dirname, '../..');
const firebase = JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8')) as {
  hosting: { rewrites: Array<{ source?: string; regex?: string; destination?: string; function?: unknown }> };
};

const shellRewrite = firebase.hosting.rewrites.find((r) => r.destination === '/app-shell.html');
const shellRegex = new RegExp(shellRewrite?.regex ?? '(?!)');
const postRewrite = firebase.hosting.rewrites.find((r) => r.source === '/post/**');

/** What Hosting does with a path, ignoring static files other than `/`. */
const servedBy = (path: string): 'static' | 'shell' | 'function' | '404' => {
  if (path === '/') return 'static';
  if (postRewrite && path.startsWith('/post/')) return 'function';
  return shellRegex.test(path) ? 'shell' : '404';
};

/** A concrete URL for a route pattern: params and splats filled in. */
const sample = (pattern: string): string =>
  pattern.replace(/:[A-Za-z]+/g, 'abc123').replace(/\/\*$/, '/some/deep/path');

const routePaths = (file: string): string[] =>
  [...readFileSync(resolve(root, file), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);

describe('firebase.json shell rewrite covers every SPA route', () => {
  it('has the shell rewrite and no catch-all', () => {
    expect(shellRewrite?.regex).toBeTruthy();
    expect(firebase.hosting.rewrites.some((r) => r.source === '**')).toBe(false);
  });

  const appRoutes = routePaths('src/routes/AppRoutes.tsx').filter((p) => p !== '*');
  const toolRoutes = routePaths('src/components/ToolsHub.tsx').map((p) => `/tools/${p}`);

  it.each([...appRoutes, ...toolRoutes])('%s is served', (pattern) => {
    expect(servedBy(sample(pattern))).not.toBe('404');
    // The bare prefix of a splat route (/vlogs for /vlogs/*) must work too.
    if (pattern.endsWith('/*')) expect(servedBy(pattern.slice(0, -2))).not.toBe('404');
  });

  it.each(['/nope', '/wp-admin', '/admin/extra', '/u', '/u/a/b', '/market/x', '/chat/x', '/feed'])(
    '%s is a real 404',
    (path) => {
      expect(servedBy(path)).toBe('404');
    },
  );
});

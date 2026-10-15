/**
 * Build-time SEO prerender: one static HTML file per sitemap URL.
 *
 * Hosting used to answer every path with the same `index.html`, whose raw
 * `<head>` declared `https://dronehub.ge/` canonical. Google reads that before
 * rendering, so each post was reported as "Duplicate, Google chose different
 * canonical than user" and folded into the homepage.
 *
 * After `vite build` this plugin:
 *  - writes `dist/<path>/index.html` for every `<loc>` in `dist/sitemap.xml`,
 *    with that route's title, description, canonical and OpenGraph tags
 *    (resolved by the same `resolveRouteMeta` that `PageMeta` uses at runtime);
 *  - writes `dist/app-shell.html`, the rewrite target for every other path,
 *    with no canonical at all — `PageMeta` adds the right one once it runs.
 *
 * `firebase.json` serves these with `trailingSlash: false`: `/post/abc` is
 * answered by `post/abc/index.html` with a 200, while `/index.html` stays a
 * 200 too (`cleanUrls` would 301 it, breaking the service worker's shell).
 *
 * The React tree is not prerendered — `createRoot` would discard it anyway —
 * only the document head, which is what the canonical decision reads.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { translations } from '../src/utils/translations';
import { SITE_ORIGIN, resolveRouteMeta, type RouteMeta } from '../src/utils/routeMeta';

export const APP_SHELL_FILE = 'app-shell.html';
/** Hosting serves this, with a 404 status, for any path no rewrite claims. */
export const NOT_FOUND_FILE = '404.html';

const FIRESTORE_POSTS =
  'https://firestore.googleapis.com/v1/projects/dronehubgeorgia-a7bd5/databases/(default)/documents/posts';
const FETCH_TIMEOUT_MS = 20_000;

interface PostSeo {
  title: string;
  content: string;
  image: string | null;
}

interface FirestoreString {
  stringValue?: string;
}

interface FirestoreListResponse {
  documents?: Array<{ name: string; fields?: Record<string, FirestoreString | undefined> }>;
  nextPageToken?: string;
}

/** Georgian is the site's default language and what crawlers are served. */
const kaStrings: Readonly<Record<string, string>> = translations.ka;
const t = (key: string): string => kaStrings[key] ?? key;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Replace exactly one tag. A template edit that removes or duplicates a tag
 * fails the build here instead of shipping pages with a stale canonical.
 */
const replaceOne = (html: string, pattern: RegExp, replacement: string, label: string): string => {
  const count = html.match(new RegExp(pattern.source, 'g'))?.length ?? 0;
  if (count !== 1) {
    throw new Error(`[seo-prerender] expected exactly one ${label} in index.html, found ${count}`);
  }
  // A replacer function: `$&`-style sequences in post titles stay literal.
  return html.replace(pattern, () => replacement);
};

const metaTag = (attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta\\s+${attr}="${key.replace(/[.:]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`);

const CANONICAL_TAG = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/;

interface PageHead extends RouteMeta {
  type: 'website' | 'article';
  image: string | null;
}

export const renderHead = (template: string, head: PageHead): string => {
  const title = escapeHtml(head.title);
  const description = escapeHtml(head.description);
  const canonical = escapeHtml(head.canonical);

  let html = replaceOne(template, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>');
  html = replaceOne(html, metaTag('name', 'description'), `<meta name="description" content="${description}" />`, 'meta description');
  html = replaceOne(html, metaTag('property', 'og:title'), `<meta property="og:title" content="${title}" />`, 'og:title');
  html = replaceOne(html, metaTag('property', 'og:description'), `<meta property="og:description" content="${description}" />`, 'og:description');
  html = replaceOne(html, metaTag('property', 'og:url'), `<meta property="og:url" content="${canonical}" />`, 'og:url');
  html = replaceOne(html, metaTag('property', 'og:type'), `<meta property="og:type" content="${head.type}" />`, 'og:type');
  html = replaceOne(html, metaTag('name', 'twitter:title'), `<meta name="twitter:title" content="${title}" />`, 'twitter:title');
  html = replaceOne(html, metaTag('name', 'twitter:description'), `<meta name="twitter:description" content="${description}" />`, 'twitter:description');
  html = replaceOne(html, CANONICAL_TAG, `<link rel="canonical" href="${canonical}" />`, 'canonical link');

  if (head.image) {
    const image = escapeHtml(head.image);
    html = replaceOne(html, metaTag('property', 'og:image'), `<meta property="og:image" content="${image}" />`, 'og:image');
    html = replaceOne(html, metaTag('name', 'twitter:image'), `<meta name="twitter:image" content="${image}" />`, 'twitter:image');
    // The template's 1200×630 dimensions describe the default card, not this image.
    html = html.replace(/\s*<meta\s+property="og:image:(?:width|height)"\s+content="[^"]*"\s*\/?>/g, '');
  }

  return html;
};

/** The rewrite target for every non-prerendered path: no canonical claim at all. */
export const renderAppShell = (template: string): string =>
  replaceOne(template, new RegExp(`\\s*${CANONICAL_TAG.source}`), '', 'canonical link');

/**
 * The page Hosting returns for paths outside the SPA's route table: the same
 * shell (so the app boots and renders NotFound), but with a real 404 status
 * and `noindex` in the raw HTML. Before this, every unknown URL was the app
 * shell with a 200 and `index, follow` until JavaScript ran — a soft 404.
 */
export const renderNotFound = (template: string): string =>
  replaceOne(
    renderAppShell(template),
    metaTag('name', 'robots'),
    '<meta name="robots" content="noindex, follow" />',
    'meta robots',
  );

export const sitemapPaths = (sitemapXml: string): string[] => {
  const paths = new Set<string>();
  for (const [, loc] of sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const url = new URL(loc);
    if (url.origin === SITE_ORIGIN) paths.add(url.pathname);
  }
  return [...paths];
};

const fetchPosts = async (): Promise<Map<string, PostSeo>> => {
  const posts = new Map<string, PostSeo>();
  let pageToken = '';
  do {
    const params = new URLSearchParams({ pageSize: '300' });
    for (const field of ['title', 'content', 'image']) params.append('mask.fieldPaths', field);
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${FIRESTORE_POSTS}?${params}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    const data = (await res.json()) as FirestoreListResponse;

    for (const doc of data.documents ?? []) {
      const id = doc.name.split('/').pop();
      if (!id) continue;
      const image = doc.fields?.image?.stringValue ?? '';
      posts.set(id, {
        title: doc.fields?.title?.stringValue?.trim() ?? '',
        content: doc.fields?.content?.stringValue ?? '',
        image: image.startsWith('https://') ? image : null,
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return posts;
};

const headFor = (path: string, posts: Map<string, PostSeo> | null): PageHead | null => {
  const postMatch = /^\/post\/([^/]+)$/.exec(path);
  if (!postMatch) {
    return { ...resolveRouteMeta(path, t), type: 'website', image: null };
  }
  const post = posts?.get(postMatch[1]);
  // Unknown post: leave it to the app shell rather than guess its metadata.
  if (!post) return null;
  return {
    ...resolveRouteMeta(path, t, { title: post.title || undefined, description: post.content || undefined }),
    type: 'article',
    image: post.image,
  };
};

export const seoPrerender = (): Plugin => {
  let config: ResolvedConfig;

  return {
    name: 'dronehub-seo-prerender',
    apply: 'build',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const outDir = config.build.outDir;
      const template = await readFile(join(outDir, 'index.html'), 'utf8');
      const paths = sitemapPaths(await readFile(join(outDir, 'sitemap.xml'), 'utf8'));

      let posts: Map<string, PostSeo> | null = null;
      if (paths.some((path) => path.startsWith('/post/'))) {
        try {
          posts = await fetchPosts();
        } catch (error) {
          config.logger.warn(
            `[seo-prerender] posts unavailable (${(error as Error).message}); ` +
              'post URLs will be served by the app shell without a static canonical.',
          );
        }
      }

      await writeFile(join(outDir, APP_SHELL_FILE), renderAppShell(template));
      await writeFile(join(outDir, NOT_FOUND_FILE), renderNotFound(template));

      let written = 0;
      let skipped = 0;
      await Promise.all(
        paths.map(async (path) => {
          const head = headFor(path, posts);
          if (!head) {
            skipped += 1;
            return;
          }
          const dir = path === '/' ? outDir : join(outDir, path);
          // Paths come from the sitemap, which comes from Firestore document
          // ids; never let one resolve outside the output directory.
          if (!dir.startsWith(outDir)) throw new Error(`[seo-prerender] path escapes outDir: ${path}`);
          await mkdir(dir, { recursive: true });
          await writeFile(join(dir, 'index.html'), renderHead(template, head));
          written += 1;
        }),
      );

      config.logger.info(
        `[seo-prerender] ${written} pages written${skipped ? `, ${skipped} unknown posts left to the app shell` : ''}`,
      );
    },
  };
};

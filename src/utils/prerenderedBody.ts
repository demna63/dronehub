/**
 * The crawler-readable body written into #root by build/seoPrerender.ts and
 * functions/postMeta.js.
 *
 * `createRoot` discards that markup on first render. Googlebot's renderer
 * cannot complete Firestore's WebChannel `Listen` stream, so a post page used
 * to stay on its loading skeleton: every post rendered to the same document
 * and was reported as a duplicate. Keeping the markup until the post resolves
 * gives each URL its own content without another network request.
 */
let captured: { path: string; html: string } | null = null;

/**
 * Call once, before React mounts.
 *
 * The canonical link proves the markup describes this URL: the service worker
 * may answer a navigation with the home page's shell, whose #root holds the
 * home page's body, and the app shell carries no canonical at all.
 */
export const capturePrerenderedBody = (root: HTMLElement, doc: Document = document): void => {
  const html = root.innerHTML.trim();
  const canonical = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  if (!html || !canonical) return;

  const path = new URL(canonical).pathname;
  captured = path === doc.location.pathname ? { path, html } : null;
};

/** The captured markup, only for the document's original path. */
export const prerenderedBodyFor = (pathname: string): string | null =>
  captured?.path === pathname ? captured.html : null;

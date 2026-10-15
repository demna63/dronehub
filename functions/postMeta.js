/**
 * Per-post link previews for an SPA.
 *
 * Facebook, Telegram, Slack and X do not run JavaScript, so every
 * `/post/:id` link used to unfurl with the site-wide <title> and og:* tags
 * baked into index.html. Hosting rewrites `/post/**` to the `postMeta`
 * function, which serves that same shell with the post's own title,
 * description, image and canonical URL written into <head>. The SPA then
 * boots exactly as before; PageMeta keeps the tags in sync client-side.
 *
 * Pure string functions only — the request handler lives in index.js — so
 * this can be unit-tested without the Functions runtime.
 */

const SITE = 'https://dronehub.ge';
const BASE_TITLE = 'DroneHub Georgia';
const DESCRIPTION_MAX = 160;

/** Firestore auto-ids; anything else cannot be a post and skips the lookup. */
const POST_ID = /^[A-Za-z0-9]{1,128}$/;

/**
 * Hosts whose own index.html may be used as the template. The shell must come
 * from the host being served: a preview channel's asset hashes differ from
 * production's, so a production shell would load nothing there. Anything not
 * listed falls back to production, which also keeps the fetch off arbitrary
 * hosts named in a forged X-Forwarded-Host.
 */
const ALLOWED_HOST = /^(?:www\.)?dronehub\.ge$|^dronehubgeorgia-a7bd5(?:--[a-z0-9-]+)?\.(?:web\.app|firebaseapp\.com)$/;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const templateHost = (forwardedHost) => {
  const host = String(forwardedHost || '').split(',')[0].trim().toLowerCase();
  return ALLOWED_HOST.test(host) ? host : 'dronehub.ge';
};

const summarize = (content) => {
  const flat = String(content || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= DESCRIPTION_MAX) return flat;
  return `${flat.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`;
};

/** Only absolute https images: crawlers resolve nothing else reliably. */
const httpsUrl = (value) => (typeof value === 'string' && /^https:\/\/\S+$/.test(value) ? value : null);

/**
 * Replaces the `content` of one `<meta name|property="key">` tag. A tag the
 * template does not carry is left absent rather than invented, so a change to
 * index.html can never produce duplicate tags.
 */
const setMeta = (html, key, value) => {
  const pattern = new RegExp(`(<meta\\s+(?:name|property)="${key.replace(/[.:]/g, '\\$&')}"\\s+content=")[^"]*(")`);
  return html.replace(pattern, (_, head, tail) => `${head}${escapeHtml(value)}${tail}`);
};

const removeMeta = (html, key) => {
  const pattern = new RegExp(`\\s*<meta\\s+(?:name|property)="${key.replace(/[.:]/g, '\\$&')}"[^>]*>`);
  return html.replace(pattern, '');
};

/**
 * @param {string} template index.html as served by Hosting.
 * @param {string} postId
 * @param {{ title?: string, content?: string, image?: string, imageWidth?: number, imageHeight?: number } | null} post
 *   null when the post does not exist.
 * @returns {string}
 */
const renderPostShell = (template, postId, post) => {
  const url = `${SITE}/post/${encodeURIComponent(postId)}`;
  let html = template;

  if (!post) {
    // Real 404 status is set by the caller; noindex matches what NotFound sets
    // client-side, so crawlers get the same answer with or without JS.
    return setMeta(html, 'robots', 'noindex, follow');
  }

  const title = String(post.title || '').trim() || BASE_TITLE;
  const fullTitle = title === BASE_TITLE ? title : `${title} | ${BASE_TITLE}`;
  const description = summarize(post.content);
  const image = httpsUrl(post.image);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${escapeHtml(url)}$2`);

  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'twitter:title', title);
  html = setMeta(html, 'og:type', 'article');
  html = setMeta(html, 'og:url', url);
  if (description) {
    html = setMeta(html, 'description', description);
    html = setMeta(html, 'og:description', description);
    html = setMeta(html, 'twitter:description', description);
  }

  if (image) {
    html = setMeta(html, 'og:image', image);
    html = setMeta(html, 'twitter:image', image);
    // The template's 1200×630 describes the default card, not this image.
    if (Number.isFinite(post.imageWidth) && Number.isFinite(post.imageHeight)) {
      html = setMeta(html, 'og:image:width', String(post.imageWidth));
      html = setMeta(html, 'og:image:height', String(post.imageHeight));
    } else {
      html = removeMeta(html, 'og:image:width');
      html = removeMeta(html, 'og:image:height');
    }
  }

  return html;
};

module.exports = { POST_ID, renderPostShell, templateHost, escapeHtml, summarize };

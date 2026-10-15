/**
 * What a crawler sees of a post before any JavaScript runs.
 *
 * Shared by build/seoPrerender.ts (posts that exist at build time) and
 * postMeta (posts created since): one implementation, so a post's raw HTML
 * is the same whichever path served it.
 *
 * - `postJsonLd`: schema.org DiscussionForumPosting — headline, body, author,
 *   dates, image, comment count — which Google uses for forum/community
 *   result features. Before this, post pages carried only the site-wide
 *   Organization/WebSite graph.
 * - `bodyHtml`: an <h1> and the opening text, placed inside #root. The SPA
 *   mounts with createRoot (not hydrate), which replaces it on first render;
 *   until then crawlers that don't execute JS (Bing's first pass, AI crawlers,
 *   link unfurlers) read the page instead of an empty <div>.
 */

const SITE = 'https://dronehub.ge';
/** Google truncates headlines past this. */
const HEADLINE_MAX = 110;
/** Enough body for a crawler to understand the post; not a full mirror. */
const BODY_PREVIEW_MAX = 1200;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cut = (text, max) => {
  const chars = Array.from(String(text || '').trim());
  if (chars.length <= max) return chars.join('');
  return `${chars.slice(0, max - 1).join('').trimEnd()}…`;
};

const isoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * @param {object} post normalised post: { title, content, image, author, authorId,
 *   createdAt, updatedAt, commentsCount } — dates as Date or ISO strings.
 * @param {string} id
 * @param {string} headline the title the page shows (already derived for untitled posts)
 * @returns {object} JSON-LD object
 */
const postJsonLd = (post, id, headline) => {
  const url = `${SITE}/post/${encodeURIComponent(id)}`;
  const published = isoOrNull(post.createdAt);
  const modified = isoOrNull(post.updatedAt);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': `${url}#posting`,
    url,
    mainEntityOfPage: url,
    headline: cut(headline, HEADLINE_MAX),
    text: String(post.content || '').trim(),
    isPartOf: { '@id': `${SITE}/#website` },
  };
  if (published) ld.datePublished = published;
  if (modified) ld.dateModified = modified;
  if (post.author) {
    ld.author = { '@type': 'Person', name: String(post.author) };
    if (post.authorId) ld.author.url = `${SITE}/u/${encodeURIComponent(post.authorId)}`;
  }
  if (typeof post.image === 'string' && /^https:\/\/\S+$/.test(post.image)) ld.image = [post.image];
  if (Number.isFinite(post.commentsCount)) {
    ld.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: post.commentsCount,
    };
  }
  return ld;
};

/** A <script> tag for `ld`, safe inside HTML: `<` can never close the script. */
const jsonLdScript = (ld) =>
  `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;

/**
 * Static content for #root. Inline styles only: no stylesheet has loaded yet,
 * and the block is replaced as soon as React mounts.
 * @param {{ heading: string, lead?: string, body?: string }} content
 */
const bodyHtml = ({ heading, lead, body }) => {
  const paragraphs = cut(body, BODY_PREVIEW_MAX)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return (
    '<main style="max-width:720px;margin:0 auto;padding:24px 16px;color:#cbd5e1;font:16px/1.6 system-ui,sans-serif">' +
    `<h1 style="color:#f8fafc;font-size:26px;line-height:1.25">${escapeHtml(heading)}</h1>` +
    (lead ? `<p style="color:#94a3b8">${escapeHtml(lead)}</p>` : '') +
    paragraphs +
    '</main>'
  );
};

/**
 * Sets the content of `<div id="root">`. postMeta's template is the
 * prerendered home page, whose root already holds the home page's content,
 * so this replaces rather than fills. bodyHtml never emits a <div>, so the
 * first </div> after the opening tag is the root's own.
 */
const ROOT = /<div id="root">(?:(?!<div)[\s\S])*?<\/div>/;
const fillRoot = (html, inner) => html.replace(ROOT, () => `<div id="root">${inner}</div>`);

/** Adds `<script>` before </head>. */
const addToHead = (html, tag) => html.replace('</head>', () => `${tag}\n  </head>`);

module.exports = { postJsonLd, jsonLdScript, bodyHtml, fillRoot, addToHead, escapeHtml };

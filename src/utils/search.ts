import type { Post } from '../types';

/**
 * search.ts — how a query is matched against a post.
 *
 * Kept out of the Firestore layer and out of the page so it can be tested
 * directly: matching rules are exactly the sort of thing that silently rots
 * when they live inline in a `.filter()`.
 *
 * Matching is client-side because Firestore has no full-text index. That is a
 * deliberate limit, not an oversight — see {@link SEARCH_SCAN_LIMIT}.
 */

/** How many recent posts are scanned. Beyond this, a real index is needed. */
export const SEARCH_SCAN_LIMIT = 300;

/**
 * Georgian has no letter case, so `toLowerCase` is a no-op there; it matters
 * for the Latin half of the corpus ("Betaflight" vs "betaflight"). Collapsing
 * whitespace keeps a pasted query with newlines from tokenising into blanks.
 */
const normalize = (value: unknown): string =>
  String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Split a query into the tokens that must ALL be present. */
export const tokenizeQuery = (query: string): string[] =>
  normalize(query).split(' ').filter(Boolean);

interface PostHaystack {
  title: string;
  tags: string;
  body: string;
}

/**
 * Every field is coerced, never assumed.
 *
 * The previous implementation called `post.title.toLowerCase()` directly, so a
 * single legacy document missing `title`, `content` or `author` threw a
 * TypeError that took the entire result set with it.
 */
const haystackOf = (post: Post): PostHaystack => ({
  title: normalize(post.title),
  tags: normalize([...(post.tags ?? []), post.category, post.subCategory, post.brand].join(' ')),
  body: normalize([post.content, post.author].join(' ')),
});

/**
 * Relevance for one post, or 0 when it does not match.
 *
 * A post must contain *every* token — two words narrow the search rather than
 * widening it, which is what people expect and what the old single-substring
 * match got wrong ("fpv camera" matched nothing because no post contains that
 * exact string).
 *
 * Weighting puts title hits first, then tags/category, then body, so the most
 * on-topic post is not buried under one that merely mentions the word in
 * passing. A whole-word hit outscores a substring hit at the same weight.
 */
export const scorePost = (post: Post, tokens: string[]): number => {
  if (tokens.length === 0) return 0;

  const hay = haystackOf(post);
  let score = 0;

  for (const token of tokens) {
    const inTitle = hay.title.includes(token);
    const inTags = hay.tags.includes(token);
    const inBody = hay.body.includes(token);

    if (!inTitle && !inTags && !inBody) return 0;

    if (inTitle) score += hay.title.split(' ').includes(token) ? 12 : 8;
    if (inTags) score += 4;
    if (inBody) score += 1;
  }

  return score;
};

/** Posts matching every token, most relevant first. Ties keep input order. */
export const searchPosts = (posts: Post[], query: string): Post[] => {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  return posts
    .map((post, index) => ({ post, index, score: scorePost(post, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((entry) => entry.post);
};

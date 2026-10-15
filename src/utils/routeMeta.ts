/**
 * Route → document metadata (title, description, canonical URL).
 *
 * Pure on purpose: the same resolution runs in the browser (`PageMeta`) and at
 * build time (`build/seoPrerender.ts`), which writes a static HTML file per
 * sitemap URL. If the two disagreed, Google would see one canonical in the raw
 * HTML and another after rendering — exactly the "Google chose different
 * canonical than user" report this module exists to prevent.
 */

export const SITE_ORIGIN = 'https://dronehub.ge';
export const BASE_TITLE = 'DroneHub Georgia';

/** Upper bound for meta descriptions; Google truncates around here anyway. */
export const META_DESCRIPTION_MAX = 160;

/**
 * Google shows roughly 60 characters of a title. Past that, the
 * ` | DroneHub Georgia` suffix is what gets cut, and it crowds out the words
 * that describe the page — so a long page title goes out without it.
 */
export const TITLE_MAX = 60;

/** A post with no title is named after the start of its body, not "Post". */
const UNTITLED_POST_MAX = 60;

/** `Title | DroneHub Georgia`, or just `Title` when the pair would be too long. */
export const pageTitle = (title: string): string => {
  const full = `${title} | ${BASE_TITLE}`;
  return Array.from(full).length <= TITLE_MAX ? full : title;
};

export type Translate = (key: string) => string;

export interface RouteMeta {
  title: string;
  description: string;
  /** Absolute URL, no trailing slash except for the root. */
  canonical: string;
}

export interface RouteMetaOverride {
  title?: string;
  description?: string;
}

const ROUTE_TITLE_KEYS: Readonly<Record<string, string>> = {
  '': 'route_home',
  popular: 'route_popular',
  saved: 'route_saved',
  u: 'route_user',
  vlogs: 'route_vlogs',
  blogs: 'route_vlogs',
  chat: 'route_chat',
  regulations: 'route_regulations',
  wiki: 'route_regulations',
  marketplace: 'route_market',
  market: 'route_market',
  community: 'route_community',
  tools: 'route_tools',
  search: 'route_search',
  map: 'route_map',
  c: 'route_category',
  category: 'route_category',
};

const TOOL_TITLE_KEYS: Readonly<Record<string, string>> = {
  'battery-calc': 'tool_title_battery',
  'channel-tuner': 'tool_title_channel',
  'antenna-tuner': 'tool_title_antenna',
  fresnel: 'tool_title_fresnel',
  unlocker: 'tool_title_vtx',
  harmonics: 'tool_title_harmonics',
  stl: 'tool_title_stl',
  'zone-check': 'tool_title_zone',
  converter: 'tool_title_rf',
  'fpv-range': 'tool_title_range',
};

const ROUTE_DESC_KEYS: Readonly<Record<string, string>> = {
  '': 'meta_desc_default',
  market: 'meta_desc_market',
  marketplace: 'meta_desc_market',
  tools: 'meta_desc_tools',
  map: 'meta_desc_map',
  regulations: 'meta_desc_regulations',
  wiki: 'meta_desc_regulations',
  vlogs: 'meta_desc_vlogs',
};

/** One description per tool: nine pages sharing meta_desc_tools read as duplicates. */
const TOOL_DESC_KEYS: Readonly<Record<string, string>> = {
  'fpv-range': 'meta_desc_range',
  stl: 'meta_desc_stl',
  'battery-calc': 'meta_desc_battery',
  'channel-tuner': 'meta_desc_channel',
  'antenna-tuner': 'meta_desc_antenna',
  fresnel: 'meta_desc_fresnel',
  unlocker: 'meta_desc_vtx',
  harmonics: 'meta_desc_harmonics',
  'zone-check': 'meta_desc_zone',
  converter: 'meta_desc_rf',
};

/**
 * Paths that render the same content as another path. Without this, `/wiki`
 * and `/regulations` would each claim to be canonical for the same page.
 */
const CANONICAL_ALIASES: Readonly<Record<string, string>> = {
  '/wiki': '/regulations',
  '/marketplace': '/market',
  '/blogs': '/vlogs',
};

/** `/tools/` and `/tools` are one page; the slash-less form is canonical. */
export const canonicalPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '');
  const path = trimmed === '' ? '/' : trimmed;
  return CANONICAL_ALIASES[path] ?? path;
};

export const canonicalUrl = (pathname: string): string => `${SITE_ORIGIN}${canonicalPath(pathname)}`;

/**
 * Collapse whitespace and cut to `max` code points, ending in an ellipsis when
 * cut. `Array.from` splits by code point, so an emoji or a Georgian letter is
 * never halved into a lone surrogate.
 */
export const summarize = (text: string, max: number = META_DESCRIPTION_MAX): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  if (chars.length <= max) return flat;
  return `${chars.slice(0, max - 1).join('').trimEnd()}…`;
};

export const resolveRouteMeta = (
  pathname: string,
  t: Translate,
  override: RouteMetaOverride = {},
): RouteMeta => {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0] ?? '';
  const second = segments[1] ?? '';

  let title: string;
  // Only free text (a post body) is cut; the curated route descriptions are
  // kept whole so the prerendered HTML matches what the app has always set.
  let description = override.description ? summarize(override.description) : '';

  if (override.title) {
    title = pageTitle(override.title);
  } else if (first === 'post' && override.description) {
    title = pageTitle(summarize(override.description, UNTITLED_POST_MAX));
  } else if (first === '' || first === 'feed') {
    title = t('home_page_title');
  } else if (first === 'tools' && second && TOOL_TITLE_KEYS[second]) {
    title = `${t(TOOL_TITLE_KEYS[second])} | ${BASE_TITLE}`;
    if (!description) description = t(TOOL_DESC_KEYS[second] ?? 'meta_desc_tools');
  } else {
    const key = ROUTE_TITLE_KEYS[first];
    const pageName = key ? t(key) : first.charAt(0).toUpperCase() + first.slice(1);
    title = pageName ? `${pageName} | ${BASE_TITLE}` : t('home_page_title');
  }

  if (!description && ROUTE_DESC_KEYS[first] !== undefined) {
    description = t(ROUTE_DESC_KEYS[first]);
  }
  if (!description) description = t('meta_desc_default');

  return { title, description, canonical: canonicalUrl(pathname) };
};

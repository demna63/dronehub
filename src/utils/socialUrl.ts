/**
 * A profile link is only safe to store and to put in `href` when it is an
 * http(s) address. Anything else — `javascript:`, a bare word, an empty
 * string — is dropped rather than rendered.
 */
export const normalizeSocialUrl = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname.includes('.')) return null;
  return url.toString();
};

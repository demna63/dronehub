/**
 * The feed row's preview of a post body.
 *
 * Collapses newlines into spaces so `line-clamp` can cut two lines, and
 * returns nothing when the body is empty or only repeats the title — a second
 * copy of the headline is not a preview.
 */
export const feedExcerpt = (content: string | null | undefined, title: string): string => {
  const flat = (content ?? '').replace(/\s+/g, ' ').trim();
  if (!flat || flat === title.trim()) return '';
  return flat;
};

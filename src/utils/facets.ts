/**
 * facets.ts — the one definition of how a post's category, sub-category and
 * tags collapse into a single queryable array.
 *
 * The feed filters by category, sub-category OR tag. Firestore cannot express a
 * disjunction across three different fields in one query that also orders and
 * paginates, so the filter used to run on the client over whatever page happened
 * to be loaded: a category whose newest post fell outside that window rendered
 * as "no posts in this category yet".
 *
 * Flattening the three fields into one array turns that disjunction into a
 * single `array-contains`, which composes with `orderBy` and `startAfter`.
 *
 * Mirrored in functions/index.js for the backfill — see the FACETS block there.
 */

/** Lowercased and trimmed; empty and duplicate entries are dropped. */
export const buildFacets = (input: {
  category?: string | null;
  subCategory?: string | null;
  tags?: readonly (string | null | undefined)[] | null;
}): string[] => {
  const parts = [input.category, input.subCategory, ...(input.tags ?? [])];
  const seen = new Set<string>();
  for (const part of parts) {
    if (typeof part !== 'string') continue;
    const normalised = part.trim().toLowerCase();
    // Firestore caps array-contains at 10 values per query, not per document,
    // so a long tag list is fine here — but an empty string would match the
    // "no category" case and pull every such post into an unrelated filter.
    if (normalised) seen.add(normalised);
  }
  return [...seen];
};

/** The same normalisation applied to the value being searched for. */
export const toFacet = (value: string): string => value.trim().toLowerCase();

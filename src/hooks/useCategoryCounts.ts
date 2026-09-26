import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

/**
 * Session-wide cache: the sidebar mounts once, but a remount (HMR, a layout
 * change) must not re-bill the aggregation queries. A settled failure is
 * cached as `null` so an outage costs one attempt, not one per render.
 */
const cache = new Map<string, Promise<number | null>>();

const countFor = (facet: string): Promise<number | null> => {
  let pending = cache.get(facet);
  if (!pending) {
    pending = apiService.countPostsByFacet(facet).catch((error: unknown) => {
      console.error(`Post count failed for "${facet}":`, error);
      return null;
    });
    cache.set(facet, pending);
  }
  return pending;
};

/**
 * Post counts per category facet for the sidebar.
 *
 * A count that is loading or failed is absent from the map; the caller shows
 * nothing rather than a zero that was never measured.
 */
export const useCategoryCounts = (facets: readonly string[]): Readonly<Record<string, number>> => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = facets.join('|');

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split('|') : [];
    void Promise.all(list.map(async (facet) => [facet, await countFor(facet)] as const)).then((entries) => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [facet, count] of entries) {
        if (count !== null) next[facet] = count;
      }
      setCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return counts;
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import { MARKET_CATEGORY } from '../constants/market';
import { toFacet } from '../utils/facets';
import type { PostCursor } from '../services/firestoreRepository';
import type { Post } from '../types';
import { useLanguage } from '../contexts/useLanguage';

interface MarketItemsState {
  items: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  retry: () => void;
}

/**
 * Marketplace listings, paged.
 *
 * The marketplace used to render `posts.filter(isMarketItem)` over the app's
 * shared feed array. That was already fragile — the page showed only listings
 * that happened to be among the newest 50 posts site-wide — and paging the feed
 * would have reduced it to whatever listings fell inside one 12-post page.
 *
 * Listings live in the same `posts` collection as everything else, so the query
 * is the ordinary feed query narrowed to the market facet, newest first:
 * ranking a classified ad by community rating makes no sense.
 *
 * `subCategory` filtering stays on the client. Adding it to the query would
 * need another composite index per sub-category ordering, and a page of
 * listings is small enough that the difference is not measurable.
 */
export const useMarketItems = (): MarketItemsState => {
  const { t } = useLanguage();
  const [items, setItems] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<PostCursor | null>(null);
  const inFlightRef = useRef(false);
  /** Incremented by `retry` to re-run the effect without changing any input. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;
    setIsLoading(true);
    setError(null);

    apiService
      .getPostPage({ sort: 'new', facet: toFacet(MARKET_CATEGORY) })
      .then((page) => {
        if (cancelled) return;
        cursorRef.current = page.cursor;
        setItems(page.posts);
        setHasMore(page.hasMore);
      })
      .catch((fetchError) => {
        console.error('Failed to load market items:', fetchError);
        if (!cancelled) setError(t('market_load_failed'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [attempt, t]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !cursorRef.current) return;
    inFlightRef.current = true;
    setIsLoadingMore(true);

    apiService
      .getPostPage({ sort: 'new', facet: toFacet(MARKET_CATEGORY), cursor: cursorRef.current })
      .then((page) => {
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
        setItems((previous) => {
          const seen = new Set(previous.map((item) => item.id));
          return [...previous, ...page.posts.filter((item) => !seen.has(item.id))];
        });
      })
      .catch((fetchError) => {
        console.error('Failed to load more market items:', fetchError);
        setError(t('next_page_failed'));
      })
      .finally(() => {
        inFlightRef.current = false;
        setIsLoadingMore(false);
      });
  }, [t]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { items, isLoading, isLoadingMore, hasMore, error, loadMore, retry };
};

import { useEffect, useRef } from 'react';
import { getAppScrollRoot } from '../utils/appScroll';

interface UseInfiniteScrollOptions {
  /** Whether another page exists. The observer is not attached when false. */
  hasMore: boolean;
  /** True while a page is in flight; prevents a second request. */
  isLoading: boolean;
  onLoadMore: () => void;
  /** How far below the viewport the sentinel triggers. */
  rootMargin?: string;
}

/**
 * Calls `onLoadMore` when the returned sentinel ref scrolls into view.
 *
 * The callback is reached through a ref so the observer is created once per
 * (hasMore, isLoading) change rather than on every parent render — consumers
 * pass an inline arrow, and re-creating an IntersectionObserver on each render
 * re-fires it against an element that is already on screen.
 *
 * `IntersectionObserver` is absent in jsdom and in a handful of older mobile
 * browsers; the hook simply does nothing there, which is why the caller must
 * keep a real button as well.
 */
export const useInfiniteScroll = <T extends HTMLElement>({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = '600px',
}: UseInfiniteScrollOptions) => {
  const sentinelRef = useRef<T | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
      },
      // Root is the app's scroll container when there is one. Against the
      // viewport, a sentinel inside that container is clipped the moment it
      // scrolls out of sight, and `rootMargin` would buy nothing.
      { root: getAppScrollRoot(), rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, rootMargin]);

  return sentinelRef;
};

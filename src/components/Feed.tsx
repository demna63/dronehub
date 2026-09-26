import React, { useEffect } from 'react';
import { Post, User } from '../types';
import type { PostSort } from '../services/firestoreRepository';
import { useParams } from 'react-router-dom';
import { isUserAdmin } from '../utils/authUtils';
import PostCardSkeleton from './PostCardSkeleton';
import PostRow from './PostRow';
import PageHeader from './PageHeader';
import FlightStatusStrip from './FlightStatusStrip';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { toFacet } from '../utils/facets';
import { postCategoryLabel } from '../utils/postCategory';
import { useLanguage } from '../contexts/useLanguage';


export interface FeedProps {
  user?: User | null;
  isFetching?: boolean;
  onLoginClick?: () => void;
  onToggleSave?: (id: string) => void;
  posts: Post[];
  savedPostIds?: string[];
  /** Used by the post page, which receives these same props. */
  onAddComment?: (postId: string, text: string) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
  onEditPost?: (post: Post) => void;
  postSort?: PostSort;
  onChangeSort?: (sort: PostSort) => void;
  /** Set when the last fetch failed; distinct from an empty feed. */
  error?: string | null;
  onRetry?: () => void;
  /** Tells the data layer which category to query. Null means the whole feed. */
  onFacetChange?: (facet: string | null) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

/**
 * Translation KEYS, not labels. The table is at module scope, where `t` does
 * not exist; resolving the keys at render time is what lets the sort control
 * follow the language switch.
 */
const SORT_OPTIONS: { value: PostSort; labelKey: string; hintKey: string }[] = [
  { value: 'rated', labelKey: 'feed_sort_rated', hintKey: 'feed_sort_rated_hint' },
  { value: 'new', labelKey: 'feed_sort_new', hintKey: 'feed_sort_new_hint' },
];

const SECONDARY_BUTTON =
  'h-10 rounded-[10px] border border-white/10 px-[18px] text-sm font-bold text-ink-2 transition-colors duration-150 hover:bg-white/5 disabled:opacity-50';

/**
 * The home and category feed (2c, F14, F15, F19).
 *
 * One bordered list of compact rows. Rating, comments, editing and the full
 * content are on the post page; the old inline card carried all of them, so a
 * page of twelve posts was twelve battery gauges and twelve comment boxes.
 */
const Feed: React.FC<FeedProps> = ({
  user, isFetching, onToggleSave, posts, savedPostIds = [], onDeletePost, error, onRetry,
  postSort = 'rated', onChangeSort,
  onFacetChange, onLoadMore, hasMore = false, isLoadingMore = false,
}) => {
  const { t } = useLanguage();
  const { categoryId } = useParams();

  /**
   * The route owns the category; the data layer owns the query. This is the
   * one line joining them. Previously the category was applied by filtering the
   * already-fetched page in the browser, so a category whose posts fell outside
   * that window rendered as "no posts in this category yet".
   */
  useEffect(() => {
    onFacetChange?.(categoryId ? toFacet(categoryId) : null);
  }, [categoryId, onFacetChange]);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    hasMore,
    isLoading: Boolean(isFetching) || isLoadingMore,
    onLoadMore: () => onLoadMore?.(),
  });

  const title = categoryId ? (postCategoryLabel({ category: categoryId }, t) ?? t('route_home')) : t('route_home');
  const subtitle = categoryId ? t('feed_category_subtitle') : t('feed_subtitle');

  const sortControl = onChangeSort && (
    <div role="group" aria-label={t('feed_sort_label')} className="flex gap-0.5 rounded-[10px] border border-white/[0.08] p-[3px]">
      {SORT_OPTIONS.map((option) => {
        const isActive = postSort === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChangeSort(option.value)}
            aria-pressed={isActive}
            title={t(option.hintKey)}
            className={`h-[30px] rounded-lg px-3.5 text-[13px] font-bold transition-colors duration-150 ${
              isActive ? 'bg-accent-tint text-accent' : 'text-ink-2 hover:bg-white/5'
            }`}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );

  const displayedPosts = posts ?? [];
  let body: React.ReactNode;

  if (isFetching && displayedPosts.length === 0) {
    body = (
      <div aria-busy="true" aria-label={t('state_loading_short')}>
        <PostCardSkeleton rows={4} />
      </div>
    );
  } else if (error && displayedPosts.length === 0) {
    // A failed read must not fall through to the empty state, which would say
    // there is nothing here when in fact nothing loaded.
    body = (
      <div className="rounded-2xl border border-bad/30 bg-surface px-6 py-16 text-center">
        <p role="alert" className="mb-4 text-sm font-bold text-bad">{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
            {t('action_retry')}
          </button>
        )}
      </div>
    );
  } else if (displayedPosts.length === 0) {
    body = (
      <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
        <p className="text-base font-bold text-ink">{t('feed_empty_title')}</p>
        <p className="mt-2 text-sm text-ink-3">{t('feed_empty_hint')}</p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {displayedPosts.map((post, index) => (
            <PostRow
              key={post.id}
              post={post}
              isSaved={savedPostIds.includes(post.id)}
              onToggleSave={onToggleSave}
              canManage={Boolean(user && (user.id === post.authorId || isUserAdmin(user)))}
              onDelete={onDeletePost ? (id) => { void onDeletePost(id); } : undefined}
              priority={index === 0}
            />
          ))}
        </div>

        {/*
          Both a sentinel and a button, deliberately. The sentinel is the
          automatic path; the button keeps later pages reachable by keyboard,
          gives a way to stop, and works where IntersectionObserver is missing.
        */}
        {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

        {hasMore && (
          <button
            type="button"
            onClick={() => onLoadMore?.()}
            disabled={isLoadingMore}
            className={`${SECONDARY_BUTTON} self-center`}
          >
            {isLoadingMore ? t('state_loading') : t('action_load_more')}
          </button>
        )}

        {!hasMore && <p className="text-center text-xs text-ink-3">{t('feed_end')}</p>}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FlightStatusStrip className="xl:hidden" />
      <PageHeader title={title} subtitle={subtitle} action={sortControl} />
      {body}
    </div>
  );
};

export default Feed;

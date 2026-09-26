import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import type { Post, User } from '../types';
import { apiService } from '../services/apiService';
import { SEARCH_SCAN_LIMIT } from '../utils/search';
import PostRow from './PostRow';
import PageHeader from './PageHeader';
import PostCardSkeleton from './PostCardSkeleton';
import { useLanguage } from '../contexts/useLanguage';

export interface SearchPageProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onToggleSave?: (postId: string) => void;
  savedPostIds?: string[];
  /** Accepted for route compatibility; comments are written on the post page. */
  onAddComment?: (postId: string, text: string) => Promise<void>;
}

/**
 * Search results for `?q=`.
 *
 * The query lives in the URL rather than in component state so a result page is
 * linkable and the browser's back button steps through searches. That also
 * makes the navbar's job trivial: it navigates, and this page owns everything
 * else.
 */
const SearchPage: React.FC<SearchPageProps> = ({
  onToggleSave,
  savedPostIds = [],
}) => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get('q') ?? '').trim();

  const [draft, setDraft] = useState(query);
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  /**
   * Bumped by the retry button. Retrying used to re-write the same `q` into the
   * URL, which leaves `query` identical, so the effect never re-ran and the
   * button did nothing at all.
   */
  const [retryToken, setRetryToken] = useState(0);

  // The URL is the source of truth; a back/forward navigation must move the
  // input too, not just the results.
  useEffect(() => { setDraft(query); }, [query]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsSearching(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setFailed(false);

    apiService
      .searchPosts(query)
      .then((found) => { if (!cancelled) setResults(found); })
      .catch((error) => {
        console.error('Search failed:', error);
        if (cancelled) return;
        setResults([]);
        setFailed(true);
      })
      .finally(() => { if (!cancelled) setIsSearching(false); });

    return () => { cancelled = true; };
  }, [query, retryToken]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) return;
    // `replace` so refining a query does not stack a history entry per keystroke
    // of thought — back still returns to wherever the search started.
    setSearchParams({ q: next }, { replace: true });
  };

  const EMPTY_BOX = 'rounded-2xl border border-line bg-surface px-6 py-16 text-center';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title={t('route_search')} />

      <form role="search" onSubmit={submit} className="relative">
        <SearchIcon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          type="search"
          name="q"
          id="search-page-input"
          value={draft}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('search_page_placeholder')}
          aria-label={t('route_search')}
          className="h-11 w-full rounded-[10px] border border-white/10 bg-surface pl-12 pr-12 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-accent/50 focus:outline-none"
        />
        {draft && (
          <button
            type="button"
            aria-label={t('action_clear')}
            onClick={() => { setDraft(''); navigate('/search', { replace: true }); }}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </form>

      {query && (
        <p aria-live="polite" className="px-1 text-[13px] text-ink-3">
          {isSearching
            ? t('search_searching')
            : failed
              ? t('search_failed_short')
              : t('search_result_summary', { query, count: results.length })}
        </p>
      )}

      {isSearching && (
        <div aria-hidden="true">
          <PostCardSkeleton rows={2} />
        </div>
      )}

      {!isSearching && failed && (
        <div className={`${EMPTY_BOX} border-bad/30`}>
          <p className="mb-4 text-sm font-bold text-bad">{t('search_failed')}</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="h-10 rounded-[10px] border border-white/10 px-[18px] text-sm font-bold text-ink-2 transition-colors hover:bg-white/5"
          >
            {t('action_retry')}
          </button>
        </div>
      )}

      {!isSearching && !failed && query && results.length === 0 && (
        <div className={EMPTY_BOX}>
          <p className="mb-2 text-sm font-bold text-ink-2">{t('search_no_results')}</p>
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-ink-3">
            {t('search_no_results_hint', { limit: SEARCH_SCAN_LIMIT })}
          </p>
        </div>
      )}

      {!isSearching && !failed && !query && (
        <div className={EMPTY_BOX}>
          <p className="text-sm font-bold text-ink-2">{t('search_prompt')}</p>
          <p className="mt-2 text-[13px] text-ink-3">{t('search_fields_hint')}</p>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {results.map((post, index) => (
            <PostRow
              key={post.id}
              post={post}
              isSaved={savedPostIds.includes(post.id)}
              onToggleSave={onToggleSave}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

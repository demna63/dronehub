import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import type { Post, User } from '../types';
import { apiService } from '../services/apiService';
import { SEARCH_SCAN_LIMIT } from '../utils/search';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { useLanguage } from '../contexts/useLanguage';

export interface SearchPageProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onToggleSave?: (postId: string) => void;
  savedPostIds?: string[];
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
  currentUser,
  onLoginClick,
  onToggleSave,
  savedPostIds = [],
  onAddComment,
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

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-300">
      <form onSubmit={submit} className="relative mb-6">
        <SearchIcon
          size={18}
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
        />
        {draft && (
          <button
            type="button"
            aria-label={t('action_clear')}
            onClick={() => { setDraft(''); navigate('/search', { replace: true }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {query && (
        <p className="px-1 mb-5 text-xs font-bold text-slate-400">
          {isSearching
            ? t('search_searching')
            : failed
              ? t('search_failed_short')
              : <>„<span className="text-white">{query}</span>" — <span className="text-white">{results.length}</span> შედეგი</>}
        </p>
      )}

      {isSearching && (
        <div className="space-y-6" aria-hidden="true">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {!isSearching && failed && (
        <div className="text-center py-16 border-2 border-dashed border-rose-500/20 rounded-3xl">
          <p className="text-sm text-rose-400 font-bold mb-4">{t('search_failed')}</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors"
          >
            {t('action_retry')}
          </button>
        </div>
      )}

      {!isSearching && !failed && query && results.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl px-6">
          <SearchIcon size={40} className="mx-auto text-slate-700 mb-4" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-300 mb-2">{t('search_no_results')}</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            სცადე ერთი სიტყვით ძებნა — ყველა სიტყვა უნდა დაემთხვეს.
            ძებნა ბოლო {SEARCH_SCAN_LIMIT} პოსტში მუშაობს.
          </p>
        </div>
      )}

      {!isSearching && !failed && !query && (
        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
          <SearchIcon size={40} className="mx-auto text-slate-700 mb-4" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-300">{t('search_prompt')}</p>
          <p className="text-xs text-slate-500 mt-2">{t('search_fields_hint')}</p>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-6">
          {results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              isSaved={savedPostIds.includes(post.id)}
              onToggleSave={onToggleSave}
              onLoginClick={onLoginClick}
              onAddComment={onAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

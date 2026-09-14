import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare, Share2, Tag,
  Gamepad2
} from 'lucide-react';
import { Post, User } from '../types';
import type { PostSort } from '../services/firestoreRepository';
import { useNavigate, useParams } from 'react-router-dom';
import { isUserAdmin } from '../utils/authUtils';
import { usePostEdit } from '../hooks/usePostEdit';
import PostCardSkeleton from './PostCardSkeleton';
import PostCardHeader from './PostCardHeader';
import PostContentBlock from './PostContentBlock';
import PostCommentsSection from './PostCommentsSection';
import OptimizedImage from './OptimizedImage';
import PostTelemetryBar from './PostTelemetryBar';
import { useToast } from '../contexts/useToast';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { toFacet } from '../utils/facets';
import { useLanguage } from '../contexts/useLanguage';


export interface FeedProps {
  user?: User | null;
  isFetching?: boolean;
  onLoginClick?: () => void;
  onToggleSave?: (id: string) => void;
  posts: Post[];
  savedPostIds?: string[];
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

const Feed: React.FC<FeedProps> = ({
  user, isFetching, onLoginClick, onToggleSave, posts, savedPostIds = [], onDeletePost, onEditPost, onAddComment, error, onRetry,
  postSort = 'rated', onChangeSort,
  onFacetChange, onLoadMore, hasMore = false, isLoadingMore = false,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const { editingPostId, editContent, setEditContent, isSaving: isSavingEdit, saveError, startEdit, cancelEdit, saveEdit } = usePostEdit(
    onEditPost ? (post, newContent) => onEditPost({ ...post, content: newContent }) : undefined
  );

  const navigate = useNavigate();
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

  // Stable identities for everything handed to the React.memo'd row
  // components. Inline arrows here made the shallow compare fail on every
  // render, so the memo cost a comparison and skipped nothing.
  const toggleExpand = useCallback((postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId); else newSet.add(postId);
      return newSet;
    });
  }, []);

  const handleAuthorClick = useCallback((authorId: string) => navigate(`/u/${authorId}`), [navigate]);

  const handleMenuToggle = useCallback((postId: string) => {
    // Functional update so this does not have to close over `activeMenu`.
    setActiveMenu(prev => (prev === postId ? null : postId));
  }, []);

  const handleStartEdit = useCallback((post: Post) => {
    startEdit(post);
    setActiveMenu(null);
  }, [startEdit]);

  const handleRequestDelete = useCallback((postId: string) => {
    // window.confirm blocks the whole page; the strip on the card asks the same
    // question without freezing the tab.
    setPendingDeleteId(postId);
    setActiveMenu(null);
  }, []);

  const handleToggleExpand = useCallback((postId: string) => {
    toggleExpand(postId);
    setActiveMenu(null);
  }, [toggleExpand]);

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    // writeText REJECTS on a denied permission or a non-secure context; the
    // old code announced success unconditionally and left the rejection
    // unhandled, so the user pasted whatever was on the clipboard before.
    navigator.clipboard.writeText(url)
      .then(() => showToast(t('share_link_copied'), 'success'))
      .catch(() => showToast(t('share_link_failed'), 'error'));
  };

  const handleCommentSubmit = async (postId: string, text: string) => {
    if (!user || !text.trim() || !onAddComment) return;
    try {
      await onAddComment(postId, text);
    } catch (error) {
      console.error('Comment failed', error);
      showToast(t('comment_send_failed'), 'error');
      // Rethrown so the composer keeps the draft instead of clearing it.
      throw error;
    }
  };

  if (isFetching && (!posts || posts.length === 0)) {
    return (
      <div className="space-y-6">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  // A failed read used to fall through to the empty state, telling the user
  // there was nothing here when in fact nothing had loaded.
  if (error && (!posts || posts.length === 0)) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-rose-500/20 rounded-3xl px-6">
        <p role="alert" className="text-sm font-bold text-rose-400 mb-4">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors"
          >
            {t('action_retry')}
          </button>
        )}
      </div>
    );
  }

  // The query is already filtered by facet, so this is the whole page.
  const displayedPosts = posts ?? [];

  if (!isFetching && displayedPosts.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl">
        <Gamepad2 size={40} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-bold">{t('feed_empty_title')}</p>
        <p className="text-sm mt-2">{t('feed_empty_hint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="sr-only">{t('feed_heading')}</h1>

      {onChangeSort && (
        <div
          role="group"
          aria-label={t('feed_sort_label')}
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/5 w-fit"
        >
          {SORT_OPTIONS.map((option) => {
            const isActive = postSort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeSort(option.value)}
                aria-pressed={isActive}
                title={t(option.hintKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      )}
      {displayedPosts.map((post, index) => {
        const content = post.content || "";
        const isExpanded = expandedPosts.has(post.id);
        const isCommentsOpen = showComments === post.id;
        const displayContent = isExpanded || content.length <= 180 ? content : `${content.slice(0, 180)}...`;
        
        // Layout reservation: without an intrinsic ratio the <img> collapses to 0px
        // until the bytes land, shifting everything below it (CLS). Posts created
        // before dimensions were persisted fall back to 16:10 while collapsed, and
        // release to the natural ratio once the user expands them (a click-driven
        // shift is excluded from CLS).
        const hasImageSize = Boolean(post.imageWidth && post.imageHeight);
        const imageAspectW = hasImageSize ? post.imageWidth : 16;
        const imageAspectH = hasImageSize ? post.imageHeight : 10;
        const reserveAspectRatio = hasImageSize || !isExpanded;

        const canManage = user && (user.id === post.authorId || isUserAdmin(user));

        return (
          <article
            key={post.id}
            className="group bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-[border-color,box-shadow] duration-300 relative shadow-xl shadow-black/20 animate-post-enter"
            style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
          >
            {/* Two-step delete, replacing window.confirm — which blocks the
                whole page and cannot be styled or dismissed with Escape. */}
            {pendingDeleteId === post.id && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-rose-500/10 border-b border-rose-500/20">
                <span className="text-xs font-bold text-rose-300">{t('post_delete_question')}</span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { onDeletePost?.(post.id); setPendingDeleteId(null); }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-400 transition-colors"
                  >
                    დიახ, წაშალე
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-colors"
                  >
                    გაუქმება
                  </button>
                </span>
              </div>
            )}

            {/* HEADER */}
            <PostCardHeader
              post={post}
              canManage={Boolean(canManage)}
              activeMenu={activeMenu}
              onAuthorClick={handleAuthorClick}
              onMenuToggle={handleMenuToggle}
              onEdit={handleStartEdit}
              onDelete={handleRequestDelete}
            />

            {/* CONTENT */}
            <PostContentBlock
              post={post}
              displayContent={displayContent}
              isExpanded={isExpanded}
              editingPostId={editingPostId}
              editContent={editContent}
              isSavingEdit={isSavingEdit}
              saveError={editingPostId === post.id ? saveError : null}
              onToggleExpand={handleToggleExpand}
              onEditContentChange={setEditContent}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
            />

            {/* IMAGE */}
            {post.image && !editingPostId && (
              <div className="mt-2 cursor-pointer bg-black/40 overflow-hidden border-y border-white/5" onClick={() => toggleExpand(post.id)}>
                <OptimizedImage
                  src={post.image}
                  {...(hasImageSize ? { width: post.imageWidth, height: post.imageHeight } : {})}
                  style={reserveAspectRatio ? { aspectRatio: `${imageAspectW} / ${imageAspectH}` } : undefined}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className={`w-full h-auto transition-[max-height,opacity] duration-700 ${isExpanded ? 'max-h-none object-contain' : 'max-h-[500px] object-cover'}`}
                  alt={post.title}
                />
              </div>
            )}

            {/* FOOTER / TELEMETRY */}
            <div className="p-3 mt-1 border-t border-white/5 flex items-start gap-2 relative z-10" onClick={(e) => editingPostId === post.id && e.stopPropagation()}>
              <PostTelemetryBar post={post} currentUser={user ?? null} onLoginClick={onLoginClick} />

              <div className="flex items-center shrink-0">
                <button
                  aria-label={t('comments_title')}
                  onClick={() => {
                    // Each panel owns its own draft now, so nothing to clear.
                    setShowComments(isCommentsOpen ? null : post.id);
                  }}
                  className={`p-2 transition-all relative ${isCommentsOpen ? 'text-sky-400 bg-sky-500/10 rounded-xl' : 'text-slate-400 hover:text-sky-400'}`}
                >
                  <MessageSquare size={18} />
                  {(post.commentsCount || 0) > 0 && <span className="absolute -top-1.5 -right-1 text-[8px] font-black bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">{post.commentsCount}</span>}
                </button>
                <button aria-label="შენახვა" onClick={(e) => { e.stopPropagation(); onToggleSave?.(post.id); }} className={`p-2 rounded-xl transition-all ${savedPostIds?.includes(post.id) ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}>
                  <Tag size={18} className={savedPostIds?.includes(post.id) ? "fill-current" : ""} />
                </button>
                <button aria-label={t('action_share')} onClick={(e) => { e.stopPropagation(); handleShare(post.id); }} className="p-2 text-slate-400 hover:text-white transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* INLINE COMMENTS SECTION */}
            {isCommentsOpen && (
              <PostCommentsSection
                post={post}
                user={user}
                onLoginClick={onLoginClick}
                onCommentSubmit={handleCommentSubmit}
              />
            )}
          </article>
        );
      })}

      {/*
        Both a sentinel and a button, deliberately.

        The sentinel is the automatic path. The button is not a fallback for
        old browsers alone: an infinite list with no control is unreachable by
        keyboard past the first page, gives no way to stop loading, and does
        nothing at all where IntersectionObserver is missing. The sentinel sits
        above the button so it trips before the button is in view.
      */}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {hasMore && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => onLoadMore?.()}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? t('state_loading') : t('action_load_more')}
          </button>
        </div>
      )}

      {isLoadingMore && (
        <div className="space-y-6" aria-live="polite" aria-label={t('state_loading_short')}>
          <PostCardSkeleton />
        </div>
      )}

      {!hasMore && displayedPosts.length > 0 && (
        <p className="pt-6 text-center text-xs text-slate-500">{t('feed_end')}</p>
      )}
    </div>
  );
};

export default Feed;
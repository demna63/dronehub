import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, MessageSquare, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';
import type { Post } from '../types';
import { useLanguage } from '../contexts/useLanguage';
import { useToast } from '../contexts/useToast';
import { telemetryDisplay } from '../utils/telemetry';
import { feedExcerpt } from '../utils/feedExcerpt';
import { postCategoryLabel } from '../utils/postCategory';
import { PostTime } from './PostTime';
import OptimizedImage from './OptimizedImage';

export interface PostRowProps {
  post: Post;
  isSaved: boolean;
  onToggleSave?: (postId: string) => void;
  /** Author or admin: adds edit and delete to the ⋯ menu. */
  canManage?: boolean;
  onDelete?: (postId: string) => void;
  /** Load the thumbnail eagerly — the first row is usually the LCP element. */
  priority?: boolean;
}

/** 36px read-only stat in the action row. */
const STAT = 'flex min-h-9 items-center gap-1.5 px-2.5 text-[13px] text-ink-2';

/** 36px action-row control (F14). */
const ACTION =
  'relative z-10 flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 transition-colors duration-150 hover:bg-white/5';

/** Sits above the row's stretched title link, so it receives the click. */
const META_LINK =
  'relative z-10 rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * The compact post row (2c, F14, F15), used by the feed, saved posts, the
 * profile and search.
 *
 * The whole row opens the post: the title link's `::after` is stretched over
 * the row, and the action controls sit above it on `z-10`. That keeps one real
 * link per row instead of nesting buttons inside an anchor, which is invalid
 * HTML and unusable by keyboard. Rating (`PostTelemetry`), comments and editing
 * live on the post page; the row only summarises them.
 */
const PostRow: React.FC<PostRowProps> = ({ post, isSaved, onToggleSave, canManage = false, onDelete, priority = false }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const href = `/post/${post.id}`;
  const categoryId = (post.subCategory || post.category || '').trim();
  const category = postCategoryLabel(post, t);
  const excerpt = feedExcerpt(post.content, post.title);
  const { stars, count, isConfirmed } = telemetryDisplay(post.telemetry);

  const handleShare = () => {
    setIsMenuOpen(false);
    // writeText rejects on a denied permission or a non-secure context;
    // announcing success unconditionally left the old clipboard content.
    navigator.clipboard.writeText(`${window.location.origin}${href}`)
      .then(() => showToast(t('share_link_copied'), 'success'))
      .catch(() => showToast(t('share_link_failed'), 'error'));
  };

  return (
    <article className="relative flex gap-4 border-t border-line px-4 py-4 first:border-t-0 transition-colors duration-150 hover:bg-white/[0.02] sm:px-[18px]">
      {isConfirmingDelete && (
        // Two-step delete, never window.confirm (see CommentBody).
        <div role="alert" className="absolute inset-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-surface px-4 sm:px-[18px]">
          <span className="text-sm font-bold text-ink">{t('post_delete_question')}</span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsConfirmingDelete(false); onDelete?.(post.id); }}
              className="h-9 rounded-[10px] bg-bad px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-bad/90"
            >
              {t('delete_confirm_yes')}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="h-9 rounded-[10px] border border-white/10 px-3.5 text-[13px] font-bold text-ink-2 transition-colors hover:bg-white/5"
            >
              {t('action_cancel')}
            </button>
          </span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-ink-3">
          {category && (
            <Link to={`/category/${categoryId}`} className={`${META_LINK} font-bold text-accent`}>
              {category}
            </Link>
          )}
          {category && <span aria-hidden="true">·</span>}
          {post.authorId ? (
            <Link to={`/u/${post.authorId}`} className={`${META_LINK} min-w-0 max-w-full truncate`}>
              {post.author}
            </Link>
          ) : (
            <span className="truncate">{post.author}</span>
          )}
          <span aria-hidden="true">·</span>
          <PostTime value={post.createdAt} withIcon={false} />
        </p>

        <h2 className="text-[15px] font-bold leading-[1.4] text-ink [text-wrap:pretty] sm:text-base">
          <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-accent">
            {post.title}
          </Link>
        </h2>

        {excerpt && (
          <p className="line-clamp-2 text-[13px] leading-snug text-ink-2">{excerpt}</p>
        )}

        <div className="-ml-2.5 flex flex-wrap items-center gap-1">
          <span className={STAT}>
            <span aria-hidden="true" className="text-rating">★</span>
            {count === 0 ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">{t('rating_none')}</span>
              </>
            ) : (
              <span className={!isConfirmed ? 'text-ink-3' : ''}>
                {`${stars.toFixed(1)} (${count})`}
              </span>
            )}
          </span>

          <Link to={`${href}#comments`} className={ACTION} aria-label={t('comments_count_aria', { count: post.commentsCount || 0 })}>
            <MessageSquare size={16} aria-hidden="true" />
            <span aria-hidden="true">{post.commentsCount || 0}</span>
          </Link>

          {onToggleSave && (
            <button
              type="button"
              aria-pressed={isSaved}
              onClick={() => onToggleSave(post.id)}
              className={`${ACTION} ${isSaved ? 'text-accent' : ''}`}
            >
              <Bookmark size={16} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
              <span className="max-sm:sr-only">{isSaved ? t('action_saved') : t('action_save')}</span>
            </button>
          )}

          {/*
            More actions expand inline, in the row's own action strip, rather
            than as a popover: a dropdown here covered the next post, and on
            a phone the strip simply wraps inside this row.
          */}
          <div ref={menuRef} className="relative z-10 flex flex-wrap items-center gap-1">
            <button
              type="button"
              aria-label={t('post_menu')}
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`${ACTION} ${isMenuOpen ? 'bg-white/5 text-ink' : ''}`}
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
            {isMenuOpen && (
              <div id={menuId} role="group" aria-label={t('post_menu')} className="flex flex-wrap items-center gap-1 border-l border-line pl-1">
                <button type="button" onClick={handleShare} className={ACTION}>
                  <Share2 size={16} aria-hidden="true" /> {t('action_share')}
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); navigate(href, { state: { edit: true } }); }}
                    className={ACTION}
                  >
                    <Pencil size={16} aria-hidden="true" /> {t('action_edit')}
                  </button>
                )}
                {canManage && onDelete && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); setIsConfirmingDelete(true); }}
                    className={`${ACTION} text-bad hover:bg-bad/10`}
                  >
                    <Trash2 size={16} aria-hidden="true" /> {t('action_delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {post.image && (
        <OptimizedImage
          src={post.image}
          alt=""
          width={120}
          height={88}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-16 w-[84px] shrink-0 rounded-[10px] bg-surface-2 object-cover sm:h-[88px] sm:w-[120px]"
        />
      )}
    </article>
  );
};

/** Memoised: one per feed row, and the feed re-renders on every page load. */
export default React.memo(PostRow);

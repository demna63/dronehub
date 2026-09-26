import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Share2, Bookmark, MoreHorizontal,
  Check, Trash2, Edit, Send,
} from 'lucide-react';
import { Post, User, PostTelemetryVote, Comment } from '../types';
import PostTelemetry from './PostTelemetry';
import { usePostTelemetry } from '../hooks/usePostTelemetry';
import { useNavigate } from 'react-router-dom';
import { usePostEdit } from '../hooks/usePostEdit';
import { usePostComments } from '../hooks/usePostComments';
import { isUserAdmin } from '../utils/authUtils';
import CommentBody from './CommentBody';
import Avatar from './Avatar';
import { COMMENT_MAX_LENGTH } from '../constants/limits';
import { useLanguage } from '../contexts/useLanguage';
import { PostTime } from './PostTime';
import { postCategoryLabel } from '../utils/postCategory';

// --- MAIN POST CARD COMPONENT ---
interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onToggleSave?: (postId: string) => void;
  isSaved: boolean;
  onLoginClick: () => void;
  onDelete?: (postId: string) => void;
  onEdit?: (newContent: string) => void;
  onAddComment?: (postId: string, text: string) => Promise<void>;
  defaultExpanded?: boolean;
  /** Open straight into the editor (the feed row's ⋯ → Edit lands here). */
  startInEdit?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  currentUser, 
  onToggleSave, 
  isSaved,
  onLoginClick,
  onDelete,
  onEdit,
  onAddComment,
  defaultExpanded = false,
  startInEdit = false,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showComments, setShowComments] = useState(defaultExpanded);
  const {
    comments: loadedComments,
    hasLoaded: commentsLoaded,
    error: commentsError,
    pendingCommentId,
    editComment,
    removeComment,
    refresh: refreshComments,
  } = usePostComments(post.id, showComments);
  // After the subcollection has been read it is authoritative: `post.comments`
  // holds only legacy embedded comments plus the optimistic row App pushes, so
  // deleting the last comment must not resurrect that stale copy.
  const displayComments = commentsLoaded ? loadedComments : (post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const { editingPostId, editContent, setEditContent, isSaving, saveError, startEdit, cancelEdit, saveEdit } = usePostEdit(
    onEdit ? (_post, newContent) => onEdit(newContent) : undefined
  );
  const isEditing = editingPostId === post.id;

  // Once per mount: re-entering edit after a save or cancel would trap the user.
  const startedInEditRef = useRef(false);
  useEffect(() => {
    if (startInEdit && onEdit && !startedInEditRef.current) {
      startedInEditRef.current = true;
      startEdit(post);
    }
  }, [startInEdit, onEdit, startEdit, post]);
  const menuRef = useRef<HTMLDivElement>(null);

  const { telemetry, userVote, isLoadingVote, rate } = usePostTelemetry(
    post.id,
    post.telemetry,
    currentUser,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTelemetryRate = async (ratings: PostTelemetryVote) => {
    if (!currentUser) { onLoginClick(); return; }
    await rate(ratings);
  };

  const handleToggleComments = (e: React.MouseEvent) => { e.stopPropagation(); setShowComments(!showComments); };
  
  const handleSubmitComment = async (e: React.FormEvent) => { 
    e.preventDefault(); e.stopPropagation();
    if (!commentText.trim()) return;
    if (!currentUser) return onLoginClick();
    if (!onAddComment) return;
    setIsSubmitting(true);
    setCommentError(null);
    try {
      await onAddComment(post.id, commentText);
      setCommentText('');
      // The hook only refetches when postId/enabled change, so the new comment
      // would otherwise stay invisible until the panel is reopened.
      refreshComments();
    }
    catch (error) {
      console.error("Comment failed", error);
      setCommentError(t('comment_send_failed'));
    }
    finally { setIsSubmitting(false); }
  };

  const handleSave = (e: React.MouseEvent) => { e.stopPropagation(); if (!currentUser) return onLoginClick(); onToggleSave?.(post.id); };
  
  const handleShare = (e: React.MouseEvent) => { 
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error: unknown) => console.error('Copy failed:', error));
  };

  const handleAuthorClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/u/${post.authorId}`); };
  const handleCategoryClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/category/${post.subCategory || post.category}`); };

  const isOwner = currentUser?.id === post.authorId || isUserAdmin(currentUser);

  const category = postCategoryLabel(post, t);
  const commentCount = post.commentsCount || displayComments.length || 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAuthorClick}
            aria-label={t('author_profile_aria', { name: post.author })}
            className="shrink-0 rounded-full"
          >
            <Avatar src={post.avatar || post.authorAvatar} name={post.author} size={36} />
          </button>
          <div className="flex min-w-0 flex-col">
            <button type="button" onClick={handleAuthorClick} className="truncate text-left text-sm font-bold text-ink hover:underline">
              {post.author}
            </button>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-3">
              {category && (
                <>
                  <button type="button" onClick={handleCategoryClick} className="font-bold text-accent hover:underline">
                    {category}
                  </button>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <PostTime value={post.createdAt} withIcon={false} />
            </p>
          </div>
        </header>

        <h2 className="text-xl font-extrabold leading-snug text-ink [text-wrap:pretty] sm:text-2xl">{post.title}</h2>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              aria-label={t('action_edit')}
              className="custom-scrollbar min-h-[140px] w-full rounded-[10px] border border-white/10 bg-bg p-3 text-sm text-ink-2 focus:border-accent/50 focus:outline-none"
              autoFocus
            />
            {saveError && <p role="alert" className="text-xs font-bold text-bad">{saveError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className="h-9 rounded-[10px] border border-white/10 px-3.5 text-[13px] font-bold text-ink-2 transition-colors hover:bg-white/5"
              >
                {t('action_cancel')}
              </button>
              <button
                type="button"
                onClick={() => { void saveEdit(post); }}
                disabled={isSaving}
                className="h-9 rounded-[10px] bg-accent-fill px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-fill-hover disabled:opacity-60"
              >
                {isSaving ? t('action_saving') : t('action_save')}
              </button>
            </div>
          </div>
        ) : (
          post.content && <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{post.content}</p>
        )}

        {post.image && !isEditing && (
          <div className="overflow-hidden rounded-[10px] bg-surface-2">
            <img
              src={post.image}
              alt={post.title}
              {...(post.imageWidth && post.imageHeight ? { width: post.imageWidth, height: post.imageHeight } : {})}
              className="h-auto max-h-[640px] w-full object-contain"
            />
          </div>
        )}

        {/* The three-axis rating lives here, not in the feed row (F14). */}
        <PostTelemetry
          stats={telemetry}
          onRate={handleTelemetryRate}
          currentUserVote={userVote ?? null}
          isLoadingVote={isLoadingVote}
          canRate={Boolean(currentUser)}
          onRequireLogin={onLoginClick}
        />

        <div className="-ml-2.5 flex flex-wrap items-center gap-1 border-t border-line pt-3">
          <button
            type="button"
            aria-expanded={showComments}
            aria-controls="comments"
            onClick={handleToggleComments}
            className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-white/5 ${showComments ? 'text-accent' : 'text-ink-2'}`}
          >
            <MessageCircle size={16} aria-hidden="true" />
            {t('comments_count_aria', { count: commentCount })}
          </button>
          <button
            type="button"
            aria-pressed={isSaved}
            onClick={handleSave}
            className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-white/5 ${isSaved ? 'text-accent' : 'text-ink-2'}`}
          >
            <Bookmark size={16} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? t('action_saved') : t('action_save')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 transition-colors hover:bg-white/5"
          >
            {isCopied ? <Check size={16} aria-hidden="true" className="text-ok" /> : <Share2 size={16} aria-hidden="true" />}
            {isCopied ? t('share_link_copied') : t('action_share')}
          </button>

          {isOwner && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                type="button"
                aria-label={t('post_menu')}
                aria-haspopup="menu"
                aria-expanded={showMenu}
                onClick={() => setShowMenu(!showMenu)}
                className={`flex min-h-9 items-center rounded-lg px-2.5 text-ink-2 transition-colors hover:bg-white/5 ${showMenu ? 'bg-white/5' : ''}`}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>
              {showMenu && (
                <div role="menu" className="absolute bottom-full right-0 z-30 mb-2 w-44 overflow-hidden rounded-[10px] border border-white/10 bg-surface py-1 shadow-2xl">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setShowMenu(false); startEdit(post); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-2 hover:bg-white/5"
                  >
                    <Edit size={16} aria-hidden="true" /> {t('action_edit')}
                  </button>
                  {isConfirmingDelete ? (
                    <div className="flex flex-col gap-2 border-t border-line px-3.5 py-2.5">
                      <span className="text-[13px] font-bold text-ink">{t('post_delete_question')}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowMenu(false); setIsConfirmingDelete(false); onDelete?.(post.id); }}
                          className="h-8 flex-1 rounded-lg bg-bad text-xs font-bold text-white"
                        >
                          {t('delete_confirm_yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="h-8 flex-1 rounded-lg border border-white/10 text-xs font-bold text-ink-2"
                        >
                          {t('action_cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2.5 text-left text-sm text-bad hover:bg-bad/10"
                    >
                      <Trash2 size={16} aria-hidden="true" /> {t('action_delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <section id="comments" aria-label={t('comments_title')} className="border-t border-line bg-bg/40 p-5 sm:p-6">
          <form onSubmit={handleSubmitComment} className="mb-4 flex gap-3">
            <Avatar src={currentUser?.avatar} name={currentUser?.name} size={32} />
            <div className="relative flex-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('comment_placeholder_short')}
                aria-label={t('comment_singular')}
                maxLength={COMMENT_MAX_LENGTH}
                disabled={!currentUser || isSubmitting}
                className="h-10 w-full rounded-[10px] border border-white/10 bg-surface pl-3.5 pr-11 text-sm text-ink placeholder:text-ink-3 focus:border-accent/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label={t('comment_send')}
                disabled={!commentText.trim() || isSubmitting}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-accent disabled:text-ink-3"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>
          </form>
          {!currentUser && (
            <button type="button" onClick={onLoginClick} className="mb-4 text-[13px] font-bold text-accent hover:underline">
              {t('comment_sign_in_prompt')}
            </button>
          )}
          {(commentError || commentsError) && (
            <p role="alert" className="mb-3 text-xs font-bold text-bad">{commentError || commentsError}</p>
          )}
          <div className="flex flex-col gap-3">
            {displayComments.map((comment: Comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar src={comment.avatar || comment.authorAvatar} name={comment.author || comment.authorName} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="inline-block max-w-full rounded-[10px] bg-surface-2 px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-[13px] font-bold text-ink-2">{comment.author || comment.authorName}</span>
                      {comment.createdAt
                        ? <PostTime value={comment.createdAt} withIcon={false} className="text-xs text-ink-3" />
                        : <span className="text-xs text-ink-3">{comment.timestamp}</span>}
                    </div>
                    <CommentBody
                      comment={comment}
                      user={currentUser}
                      isPending={pendingCommentId === comment.id}
                      onEdit={editComment}
                      onDelete={removeComment}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default PostCard;
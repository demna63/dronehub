import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Hash, Clock, Check, Trash2, Edit, Send, Star,
} from 'lucide-react';
import { Post, User, PostTelemetryVote, Comment } from '../types';
import PostTelemetry from './PostTelemetry';
import { telemetryDisplay } from '../utils/telemetry';
import { usePostTelemetry } from '../hooks/usePostTelemetry';
import { useNavigate } from 'react-router-dom';
import { usePostEdit } from '../hooks/usePostEdit';
import { usePostComments } from '../hooks/usePostComments';
import { isUserAdmin } from '../utils/authUtils';
import CommentBody from './CommentBody';
import Avatar from './Avatar';
import { COMMENT_MAX_LENGTH } from '../constants/limits';
import { useLanguage } from '../contexts/useLanguage';

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
  defaultExpanded = false
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
  const menuRef = useRef<HTMLDivElement>(null);

  const { telemetry, userVote, isLoadingVote, rate } = usePostTelemetry(
    post.id,
    post.telemetry,
    currentUser,
  );

  // Once confirmed the gauge reads the shrunk score, so a single 5-star rating
  // cannot fill the cell; below the threshold it reads the raw mean, drawn in a
  // muted tone. It never shows nothing — an empty gauge right after rating is
  // indistinguishable from a rating that failed to save.
  const { percent: score, stars, isConfirmed, hasAny } = telemetryDisplay(telemetry);

  let batteryColorClass = 'bg-slate-600';
  let shadowClass = '';
  const batteryFillHeight = hasAny ? `${Math.max(score, 5)}%` : '5%';

  if (isConfirmed) {
    if (score >= 70) {
      batteryColorClass = 'bg-[#00ff00]';
      shadowClass = 'shadow-[0_0_15px_#00ff00]';
    } else if (score >= 40) {
      batteryColorClass = 'bg-yellow-400';
      shadowClass = 'shadow-[0_0_10px_#facc15]';
    } else {
      batteryColorClass = 'bg-rose-500';
      shadowClass = 'shadow-[0_0_10px_#f43f5e]';
    }
  } else if (hasAny) {
    batteryColorClass = 'bg-slate-400';
  }

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
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePostClick = () => { navigate(`/post/${post.id}`); };
  const handleAuthorClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/u/${post.authorId}`); };
  const handleCategoryClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/category/${post.category}`); };

  const isOwner = currentUser?.id === post.authorId || isUserAdmin(currentUser);

  return (
    <div 
      onClick={handlePostClick}
      className="group bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer flex flex-col relative"
    >
      <div className="flex w-full">
        {/* LEFT SIDEBAR: BATTERY */}
        <div className="w-14 bg-slate-950/50 flex flex-col items-center justify-center py-4 border-r border-white/5 gap-1 shrink-0 relative">
           <div className="relative w-6 h-20 bg-slate-800/80 border-2 border-slate-600/80 rounded-md overflow-hidden flex items-center justify-center">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-slate-600/80 rounded-t-sm"></div>
              <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-out ${batteryColorClass} ${shadowClass}`}
                style={{ height: batteryFillHeight }}
              ></div>
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <span className={`font-bold text-xs drop-shadow-md tabular-nums ${isConfirmed ? 'text-white' : 'text-slate-300'}`}>
                  {hasAny ? stars.toFixed(1) : '–'}
                </span>
                <Star
                  size={8}
                  className={isConfirmed ? 'text-amber-400' : 'text-slate-500'}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              </div>
           </div>
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 p-4 sm:p-5 pb-2 flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAuthorClick}
                aria-label={t('author_profile_aria', { name: post.author })}
                className="text-left relative hover:opacity-60 transition-opacity"
              >
                {post.avatar ? (
                  <img src={post.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {post.author?.[0]}
                  </div>
                )}
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                <button type="button" onClick={handleAuthorClick} className="text-left text-sm font-bold text-slate-200 hover:underline">{post.author}</button>
                <span className="hidden sm:inline text-slate-400 text-xs">•</span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{post.timestamp ?? t('time_just_now')}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCategoryClick}
              className="text-left flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors uppercase tracking-wide"
            >
              <Hash size={10} />
              {post.category}
            </button>
          </div>

          <div className="mb-4" onClick={(e) => isEditing && e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors">{post.title}</h2>
            
            {/* ✅ შეცვლილი Content ბლოკი რედაქტირებისთვის */}
            {isEditing ? (
              <div className="space-y-3 mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-300 text-sm min-h-[100px] focus:border-indigo-500 focus:outline-none custom-scrollbar"
                  autoFocus
                />
                {saveError && (
                  <p role="alert" className="text-[11px] font-bold text-rose-400">{saveError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                    className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    disabled={isSaving}
                  >
                    გაუქმება
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); void saveEdit(post); }}
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? t('action_saving') : t('action_save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                {post.content}
              </p>
            )}
          </div>

          {post.image && !isEditing && (
            <div className="mb-4 rounded-xl overflow-hidden border border-white/5 bg-black/20">
              <img src={post.image} alt={post.title} className="w-full h-auto max-h-[400px] object-cover" />
            </div>
          )}

          <div className="flex-1"></div>

          <div className="flex items-start justify-between pt-3 border-t border-white/5 mb-2 gap-2" onClick={(e) => isEditing && e.stopPropagation()}>
            <div className="flex items-center gap-2 mt-1">
              <button 
                aria-label={t('comments_title')}
                onClick={handleToggleComments}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-sm group/btn ${
                  showComments ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle size={18} className={showComments ? "fill-current" : "group-hover/btn:text-indigo-400"} />
                <span className="font-medium">{post.commentsCount || displayComments.length || 0}</span>
              </button>
              <button aria-label={t('action_share')} onClick={handleShare} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                 {isCopied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
              </button>
            </div>

            <div className="flex-1 min-w-0 mx-2">
              <PostTelemetry
                stats={telemetry}
                onRate={handleTelemetryRate}
                currentUserVote={userVote ?? null}
                isLoadingVote={isLoadingVote}
                canRate={Boolean(currentUser)}
                onRequireLogin={onLoginClick}
              />
            </div>

            <div className="flex items-center gap-2 relative mt-1" ref={menuRef}>
              <button aria-label={t('action_save')} onClick={handleSave} className={`p-2 rounded-lg transition-all ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
              
              {/* ✅ მენიუს გახსნის ღილაკი */}
              <button aria-label={t('post_menu')} aria-expanded={showMenu} onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <MoreHorizontal size={18} />
              </button>

              {/* ✅ შესწორებული მენიუ წაშლით და რედაქტირებით */}
              {showMenu && isOwner && (
                <div className="absolute bottom-full right-0 mb-2 w-40 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      startEdit(post);
                    }} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white text-left transition-colors"
                  >
                    <Edit size={16} /> რედაქტირება
                  </button>
                  <div className="h-px bg-white/5"></div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowMenu(false); 
                      onDelete?.(post.id); 
                    }} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-left transition-colors"
                  >
                    <Trash2 size={16} /> წაშლა
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-white/5 bg-slate-950/30 p-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleSubmitComment} className="flex gap-3 mb-4">
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name}
              size={32}
            />
            <div className="flex-1 relative">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('comment_placeholder_short')} aria-label={t('comment_singular')} maxLength={COMMENT_MAX_LENGTH} className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 pr-10" disabled={!currentUser || isSubmitting} />
              <button type="submit" disabled={!commentText.trim() || isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50"><Send size={16} /></button>
            </div>
          </form>
          {(commentError || commentsError) && (
            <p role="alert" className="mb-2 text-[10px] font-bold text-rose-400 uppercase tracking-wide">{commentError || commentsError}</p>
          )}
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {displayComments.map((comment: Comment) => (
               <div key={comment.id} className="flex gap-3">
                 <Avatar
                   src={comment.avatar || comment.authorAvatar}
                   name={comment.author || comment.authorName}
                   size={28}
                 />
                 <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-full relative group/comm">
                      <div className="flex items-center gap-2 mb-0.5 pr-16">
                        <span className="text-xs font-bold text-slate-300">{comment.author || comment.authorName}</span>
                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
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
        </div>
      )}
    </div>
  );
};

export default PostCard;
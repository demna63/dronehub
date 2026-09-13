import React, { useState } from 'react';
import { MessageSquare, Heart, Reply, Send, Plus } from 'lucide-react';
import type { Comment, Post, User } from '../types';
import { usePostComments } from '../hooks/usePostComments';
import CommentBody from './CommentBody';
import Avatar from './Avatar';
import { COMMENT_MAX_LENGTH } from '../constants/limits';

interface PostCommentsSectionProps {
  post: Post;
  user?: User | null;
  onLoginClick?: () => void;
  /** Rejects if the write failed, so the draft is not cleared. */
  onCommentSubmit: (postId: string, text: string) => void | Promise<void>;
}

/**
 * The composer state lives here, not in Feed.
 *
 * Feed used to hold a single shared `commentText` for the whole list, so every
 * keystroke re-rendered all ~50 post cards — and the draft leaked between posts
 * whenever the open panel changed.
 */
const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({
  post,
  user,
  onLoginClick,
  onCommentSubmit,
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const {
    comments: loadedComments,
    loading,
    hasLoaded,
    error,
    pendingCommentId,
    editComment,
    removeComment,
    refresh,
  } = usePostComments(post.id, true);

  // Until the subcollection has been read, `post.comments` is the only thing to
  // show; afterwards it is the source of truth, so an emptied list stays empty
  // instead of falling back to the stale embedded copy.
  const comments = hasLoaded ? loadedComments : (post.comments || []);

  /**
   * Never rejects.
   *
   * Feed's handler rethrows on purpose so the draft survives a failed write —
   * but the call sites below fire it from an event handler, where a rejected
   * promise is unhandled: it lands in the console, trips Vite's error overlay
   * in dev, and reaches any window.onunhandledrejection reporter. The failure
   * is already surfaced to the user as a toast by the caller, so it is caught
   * and swallowed here.
   */
  const handleSubmit = async (): Promise<void> => {
    const text = commentText.trim();
    if (!text || !user) return;
    const final = replyTo ? `@${replyTo.name} ${text}` : text;

    try {
      await onCommentSubmit(post.id, final);
    } catch {
      // Draft and reply target deliberately kept so the text is not lost.
      return;
    }

    setCommentText('');
    setReplyTo(null);
    refresh();
  };

  return (
    <div className="bg-black/30 border-t border-white/5 p-4 animate-in slide-in-from-top-2">
      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        {loading && comments.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs uppercase tracking-widest">იტვირთება...</div>
        ) : comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
              <Avatar
                src={comment.avatar}
                name={comment.author}
                size={32}
                ringClassName="border border-white/5"
              />
              <div className="flex-1">
                <div className="bg-white/5 rounded-2xl p-3 relative group/comm">
                  <span className="text-[11px] font-bold text-sky-400 block mb-0.5 pr-16">{comment.author}</span>
                  <CommentBody
                    comment={comment}
                    user={user}
                    isPending={pendingCommentId === comment.id}
                    onEdit={editComment}
                    onDelete={removeComment}
                  />

                  <div className="flex gap-4 mt-2">
                    <button aria-label="კომენტარის მოწონება" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition-colors">
                      <Heart size={12} /> {comment.likes || 0}
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo({ id: comment.id, name: comment.author });
                        document.getElementById(`input-${post.id}`)?.focus();
                      }}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      <Reply size={12} /> პასუხი
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <MessageSquare size={24} className="mx-auto text-slate-700 mb-2" />
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">კომენტარები ჯერ არ არის</p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-2 text-[10px] font-bold text-rose-400 uppercase tracking-wide">{error}</p>
      )}

      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        {replyTo && (
          <div className="flex items-center justify-between bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 animate-in slide-in-from-bottom-2">
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-2">
              <Reply size={10} /> პასუხი: @{replyTo.name}
            </span>
            <button aria-label="პასუხის გაუქმება" onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-white transition-colors">
              <Plus size={14} className="rotate-45" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size={36}
            ringClassName="border border-white/10"
          />
          <div className="flex-1 relative">
            <input
              id={`input-${post.id}`}
              type="text"
              placeholder={user ? 'დაწერე კომენტარი...' : 'ავტორიზაცია აუცილებელია...'}
              value={commentText}
              maxLength={COMMENT_MAX_LENGTH}
              aria-label="კომენტარი"
              disabled={!user}
              onClick={!user ? onLoginClick : undefined}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-400 pr-12"
            />
            <button
              aria-label="გაგზავნა"
              onClick={() => void handleSubmit()}
              disabled={!user || !commentText.trim()}
              className="absolute right-2 top-1.5 p-2 text-sky-500 hover:text-sky-400 disabled:text-slate-700 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCommentsSection;

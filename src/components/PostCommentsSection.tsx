import React from 'react';
import { MessageSquare, Heart, Reply, Send, Plus } from 'lucide-react';
import type { Comment, Post, User } from '../types';
import { usePostComments } from '../hooks/usePostComments';

interface PostCommentsSectionProps {
  post: Post;
  user?: User | null;
  commentText: string;
  replyTo: { id: string; name: string } | null;
  onLoginClick?: () => void;
  onCommentTextChange: (value: string) => void;
  onCommentSubmit: (postId: string) => void;
  onReplyToComment: (comment: Comment) => void;
  onCancelReply: () => void;
}

const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({
  post,
  user,
  commentText,
  replyTo,
  onLoginClick,
  onCommentTextChange,
  onCommentSubmit,
  onReplyToComment,
  onCancelReply,
}) => {
  const { comments: loadedComments, loading } = usePostComments(post.id, true);
  const comments = loadedComments.length > 0 ? loadedComments : (post.comments || []);

  return (
    <div className="bg-black/30 border-t border-white/5 p-4 animate-in slide-in-from-top-2">
      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        {loading && comments.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs uppercase tracking-widest">იტვირთება...</div>
        ) : comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
              <img
                src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 rounded-full border border-white/5 shrink-0 bg-slate-800"
                alt=""
              />
              <div className="flex-1">
                <div className="bg-white/5 rounded-2xl p-3 relative group/comm">
                  <span className="text-[11px] font-bold text-sky-400 block mb-0.5">{comment.author}</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{comment.text}</p>

                  <div className="flex gap-4 mt-2">
                    <button aria-label="კომენტარის მოწონება" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition-colors">
                      <Heart size={12} /> {comment.likes || 0}
                    </button>
                    <button
                      onClick={() => onReplyToComment(comment)}
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

      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        {replyTo && (
          <div className="flex items-center justify-between bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 animate-in slide-in-from-bottom-2">
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-2">
              <Reply size={10} /> პასუხი: @{replyTo.name}
            </span>
            <button aria-label="პასუხის გაუქმება" onClick={onCancelReply} className="text-slate-400 hover:text-white transition-colors">
              <Plus size={14} className="rotate-45" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`}
            className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 shrink-0"
            alt=""
          />
          <div className="flex-1 relative">
            <input
              id={`input-${post.id}`}
              type="text"
              placeholder={user ? 'დაწერე კომენტარი...' : 'ავტორიზაცია აუცილებელია...'}
              value={commentText}
              disabled={!user}
              onClick={!user ? onLoginClick : undefined}
              onChange={(event) => onCommentTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onCommentSubmit(post.id);
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-400 pr-12"
            />
            <button
              aria-label="გაგზავნა"
              onClick={() => onCommentSubmit(post.id)}
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

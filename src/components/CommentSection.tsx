import React, { useState, useMemo } from 'react';
import { Comment, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, CornerDownRight, Edit2, Send, MessageSquare, Trash2, User as UserIcon } from 'lucide-react';

// ტიპების დაზღვევა, თუ types.ts ჯერ არ განახლებულა
interface SafeComment extends Comment {
  createdAt?: any;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string, parentId?: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onVoteComment: (commentId: string, delta: number) => void;
  onDeleteComment: (commentId: string) => void; // <--- ახალი პროპი
  user: User | null;
  onLoginClick: () => void;
  ghostMode?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments, 
  onAddComment,
  onEditComment,
  onVoteComment,
  onDeleteComment,
  user,
  onLoginClick,
  ghostMode = false
}) => {
  const [newCommentText, setNewCommentText] = useState('');

  // მთავარი კომენტარის გაგზავნა
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLoginClick();
      return;
    }
    if (newCommentText.trim()) {
      onAddComment(newCommentText.trim());
      setNewCommentText('');
    }
  };

  // სორტირება (უსაფრთხოდ)
  const sortedComments = useMemo(() => {
    const rootComments = comments.filter(c => !c.parentId) as SafeComment[];
    return [...rootComments].sort((a, b) => {
      // ვცდილობთ წავიკითხოთ createdAt, თუ არა და ვიყენებთ 0-ს
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      
      // Best (ლაიქებით) თუ New (დროით)? 
      // ამ ვერსიაში ვაკეთებთ დროით (უახლესი ზევით)
      return timeB - timeA; 
    });
  }, [comments]);

  return (
    <div className="mt-4 space-y-6">
      {/* 1. მთავარი ინპუტი */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            {user ? (
              <img src={user.avatar} className="w-9 h-9 rounded-full border border-white/10 object-cover" alt={user.name} />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <UserIcon size={18} />
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <textarea
              id="main-comment-input"
              name="comment-text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={user ? (ghostMode ? "დააკომენტარე ფარულად..." : "დაწერე კომენტარი...") : "შედი კომენტარის დასაწერად..."}
              disabled={!user}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-4 pr-14 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500/50 focus:bg-slate-900 transition-all min-h-[48px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            {/* გაგზავნის ღილაკი */}
            <button
              type="submit"
              disabled={!newCommentText.trim() || !user}
              className="absolute right-2 bottom-2 p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-400 disabled:opacity-30 disabled:scale-95 transition-all shadow-lg shadow-sky-500/20 active:scale-90"
              title="გამოქვეყნება"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* 2. კომენტარების სია */}
      <div className="space-y-4">
        {sortedComments.length > 0 ? (
          sortedComments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              allComments={comments}
              user={user}
              onVote={onVoteComment}
              onEdit={onEditComment}
              onDelete={onDeleteComment} // <--- გადავცემთ წაშლის ფუნქციას
              onReply={onAddComment}
              onLoginClick={onLoginClick}
            />
          ))
        ) : (
          <div className="text-center py-10 opacity-40">
            <MessageSquare size={32} className="mx-auto mb-2" />
            <p className="text-xs uppercase tracking-widest font-bold font-mtavruli">ჯერ კომენტარები არ არის</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- დამხმარე კომპონენტი: CommentItem ---
const CommentItem = ({ comment, allComments, user, onVote, onEdit, onDelete, onReply, depth = 0 }: any) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const replies = allComments.filter((c: any) => c.parentId === comment.id);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(replyText.trim(), comment.id);
      setReplyText('');
      setIsReplying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group ${depth > 0 ? 'mt-3' : 'mb-6'}`}
    >
      <div className="flex gap-3">
        {/* ავატარი */}
        <div className="flex-shrink-0">
          <img src={comment.avatar} width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-white/5 object-cover" alt="" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* ბუშტი */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-colors relative group/bubble">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-tight">{comment.author}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{comment.timestamp}</span>
              </div>
              
              {/* წაშლის ღილაკი (მხოლოდ ავტორისთვის) */}
              {user?.id === comment.authorId && !isEditing && (
                <div className="flex gap-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                   <button 
                     onClick={() => setIsEditing(true)} 
                     className="text-slate-400 hover:text-white" 
                     title="რედაქტირება"
                   >
                     <Edit2 size={12} />
                   </button>
                   <button 
                     onClick={() => onDelete(comment.id)} 
                     className="text-slate-400 hover:text-red-500" 
                     title="წაშლა"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              )}
            </div>

            {/* ტექსტი ან ედიტორი */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea 
                  id={`edit-comment-${comment.id}`}
                  name="edit-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-sm text-white focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-slate-400 uppercase">გაუქმება</button>
                  <button onClick={() => { onEdit(comment.id, editText); setIsEditing(false); }} className="text-[10px] font-bold text-sky-400 uppercase">შენახვა</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
            )}
          </div>

          {/* მოქმედებები (Like, Reply) */}
          <div className="flex items-center gap-4 mt-2 ml-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
              <button onClick={() => onVote(comment.id, 1)} className="text-slate-400 hover:text-orange-500 transition-colors">
                <ThumbsUp size={12} />
              </button>
              <span className="text-[10px] font-black text-slate-400 min-w-[12px] text-center">{comment.votes || 0}</span>
            </div>

            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-[10px] font-black text-slate-400 uppercase hover:text-sky-400 transition-colors flex items-center gap-1"
            >
              <CornerDownRight size={12} /> პასუხი
            </button>
          </div>

          {/* პასუხის ინპუტი */}
          <AnimatePresence>
            {isReplying && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleReplySubmit}
                className="mt-3 flex gap-2"
              >
                <input 
                  id={`reply-input-${comment.id}`}
                  name="reply-text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="უპასუხე..."
                  autoFocus
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-sky-500 text-white p-2 rounded-xl disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ქვეკომენტარები (რეკურსია) */}
          {replies.length > 0 && (
            <div className="mt-3 border-l-2 border-white/5 pl-4 ml-1">
              {replies.map((reply: any) => (
                <CommentItem 
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  user={user}
                  onVote={onVote}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CommentSection;
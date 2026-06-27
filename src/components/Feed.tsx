import React, { useState } from 'react';
import {
  MessageSquare, Share2, BatteryCharging, Zap, Eye, Wrench, LucideIcon, Tag, Plus,
  Gamepad2
} from 'lucide-react';
import { Post, User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { isUserAdmin } from '../utils/authUtils';
import { usePostEdit } from '../hooks/usePostEdit';
import PostCardSkeleton from './PostCardSkeleton';
import PostCardHeader from './PostCardHeader';
import PostContentBlock from './PostContentBlock';
import PostCommentsSection from './PostCommentsSection';
import OptimizedImage from './OptimizedImage';

// 1. ბატარეის ფუნქცია
const getBatteryStatus = (telemetry?: Partial<Post['telemetry']>) => {
  const totalPoints = (telemetry?.utility || 0) + (telemetry?.skill || 0) + (telemetry?.vision || 0);
  const charge = Math.min(100, totalPoints); 
  let color = 'text-slate-400';
  if (charge >= 80) color = 'text-emerald-400';
  else if (charge >= 50) color = 'text-amber-400';
  else if (charge >= 10) color = 'text-rose-400';
  return { charge, color };
};

// 2. ტელემეტრიის ფანჯარა
const RatingWindow = ({ icon: Icon, label, value, total, colorText, colorBg, onClick }: { 
  icon: LucideIcon, label: string, value: number, total: number, colorText: string, colorBg: string, onClick: (e: React.MouseEvent) => void 
}) => {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <button aria-label={`შეაფასე ${label}`} onClick={onClick} className="group/window flex-1 flex flex-col gap-1 min-w-[55px] cursor-pointer relative hover:bg-white/5 rounded-lg p-1 transition-all">
      <div className="flex items-center justify-between px-0.5 text-[9px] w-full">
        <div className={`flex items-center gap-1 font-black uppercase ${colorText}`}>
          <Icon size={10} />
          <span className="hidden sm:inline">{label}</span>
        </div>
        <span className="font-mono text-slate-400 group-hover/window:hidden">{value || 0}</span>
        <span className={`hidden group-hover/window:flex items-center font-bold ${colorText} animate-bounce`}>
          <Plus size={8} />1
        </span>
      </div>
      <div className="h-1 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5 relative">
        <div className={`h-full transition-all duration-500 ${colorBg}`} style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
};

export interface FeedProps {
  user?: User | null;
  isFetching?: boolean;
  onLoginClick?: () => void;
  onToggleSave?: (id: string) => void;
  onVote?: (id: string, type: 'up' | 'down' | 'utility' | 'skill' | 'vision') => void;
  posts: Post[];
  savedPostIds?: string[];
  onAddComment?: (postId: string, text: string) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
  onEditPost?: (post: Post) => void;
}

const Feed: React.FC<FeedProps> = ({
  user, isFetching, onLoginClick, onToggleSave, onVote, posts, savedPostIds = [], onDeletePost, onEditPost, onAddComment
}) => {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{id: string, name: string} | null>(null);
  
  const { editingPostId, editContent, setEditContent, isSaving: isSavingEdit, startEdit, cancelEdit, saveEdit } = usePostEdit(
    onEditPost ? (post, newContent) => onEditPost({ ...post, content: newContent }) : undefined
  );

  const navigate = useNavigate();
  const { categoryId } = useParams();

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId); else newSet.add(postId);
      return newSet;
    });
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    alert('ბმული დაკოპირებულია!');
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!user || !commentText.trim() || !onAddComment) return;
    const final_text = replyTo ? `@${replyTo.name} ${commentText}` : commentText;
    await onAddComment(postId, final_text);
    setCommentText("");
    setReplyTo(null);
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

  const displayedPosts = posts?.filter(post => {
    if (!categoryId) return true;
    const currentCat = categoryId.toLowerCase();
    return (
      post.category?.toLowerCase() === currentCat || 
      post.subCategory?.toLowerCase() === currentCat ||
      post.tags?.some(tag => tag.toLowerCase() === currentCat)
    );
  }) || [];

  if (!isFetching && displayedPosts.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl">
        <Gamepad2 size={40} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-bold">ამ კატეგორიაში პოსტები ჯერ არ არის.</p>
        <p className="text-sm mt-2">იყავი პირველი, ვინც დაამატებს პოსტს!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {displayedPosts.map((post, index) => {
        const content = post.content || "";
        const isExpanded = expandedPosts.has(post.id);
        const isCommentsOpen = showComments === post.id;
        const displayContent = isExpanded || content.length <= 180 ? content : `${content.slice(0, 180)}...`;
        
        const telemetry = post.telemetry || { utility: 0, skill: 0, vision: 0, count: 0 };
        const { charge, color } = getBatteryStatus(telemetry);
        const totalCount = telemetry.count || (telemetry.utility + telemetry.skill + telemetry.vision) || 1;
        const canManage = user && (user.id === post.authorId || isUserAdmin(user));

        return (
          <article
            key={post.id}
            className="group bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-[border-color,box-shadow] duration-300 relative shadow-xl shadow-black/20 animate-post-enter"
            style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
          >
            
            {/* HEADER */}
            <PostCardHeader
              post={post}
              canManage={Boolean(canManage)}
              activeMenu={activeMenu}
              onAuthorClick={() => navigate(`/u/${post.authorId}`)}
              onMenuToggle={(postId) => setActiveMenu(activeMenu === postId ? null : postId)}
              onEdit={() => {
                startEdit(post);
                setActiveMenu(null);
              }}
              onDelete={() => {
                if (window.confirm('ნამდვილად გსურთ პოსტის წაშლა?')) {
                  onDeletePost?.(post.id);
                }
                setActiveMenu(null);
              }}
            />

            {/* CONTENT */}
            <PostContentBlock
              post={post}
              displayContent={displayContent}
              isExpanded={isExpanded}
              editingPostId={editingPostId}
              editContent={editContent}
              isSavingEdit={isSavingEdit}
              onToggleExpand={(postId) => {
                toggleExpand(postId);
                setActiveMenu(null);
              }}
              onEditContentChange={setEditContent}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
            />

            {/* IMAGE */}
            {post.image && !editingPostId && (
              <div className="mt-2 cursor-pointer bg-black/40 overflow-hidden border-y border-white/5" onClick={() => toggleExpand(post.id)}>
                <OptimizedImage
                  src={post.image}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className={`w-full transition-all duration-700 ${isExpanded ? 'max-h-none' : 'max-h-[500px] object-cover'}`}
                  alt={post.title}
                />
              </div>
            )}

            {/* FOOTER / TELEMETRY */}
            <div className="p-3 mt-1 border-t border-white/5 flex items-center gap-2 relative z-10" onClick={(e) => editingPostId === post.id && e.stopPropagation()}>
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-black/40 border border-white/5 shrink-0 ${color} shadow-inner shadow-black`}>
                <BatteryCharging size={16} className={charge > 0 ? "animate-pulse" : ""} />
                <span className="text-xs font-black font-mono text-slate-300">{charge}%</span>
              </div>

              <div className="flex-1 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white/[0.03] border border-white/5 min-w-0">
                <RatingWindow icon={Wrench} label="Utility" value={telemetry.utility} total={totalCount} colorText="text-emerald-400" colorBg="bg-emerald-500" onClick={(e) => { e.stopPropagation(); onVote?.(post.id, 'utility'); }} />
                <RatingWindow icon={Zap} label="Skill" value={telemetry.skill} total={totalCount} colorText="text-amber-400" colorBg="bg-amber-500" onClick={(e) => { e.stopPropagation(); onVote?.(post.id, 'skill'); }} />
                <RatingWindow icon={Eye} label="Vision" value={telemetry.vision} total={totalCount} colorText="text-purple-400" colorBg="bg-purple-500" onClick={(e) => { e.stopPropagation(); onVote?.(post.id, 'vision'); }} />
              </div>

              <div className="flex items-center shrink-0">
                <button
                  aria-label="კომენტარები"
                  onClick={() => {
                    setShowComments(isCommentsOpen ? null : post.id);
                    // FIX: clear shared input state so it doesn't carry over between posts
                    setCommentText("");
                    setReplyTo(null);
                  }}
                  className={`p-2 transition-all relative ${isCommentsOpen ? 'text-sky-400 bg-sky-500/10 rounded-xl' : 'text-slate-400 hover:text-sky-400'}`}
                >
                  <MessageSquare size={18} />
                  {(post.commentsCount || 0) > 0 && <span className="absolute -top-1.5 -right-1 text-[8px] font-black bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">{post.commentsCount}</span>}
                </button>
                <button aria-label="შენახვა" onClick={(e) => { e.stopPropagation(); onToggleSave?.(post.id); }} className={`p-2 rounded-xl transition-all ${savedPostIds?.includes(post.id) ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}>
                  <Tag size={18} className={savedPostIds?.includes(post.id) ? "fill-current" : ""} />
                </button>
                <button aria-label="გაზიარება" onClick={(e) => { e.stopPropagation(); handleShare(post.id); }} className="p-2 text-slate-400 hover:text-white transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* INLINE COMMENTS SECTION */}
            {isCommentsOpen && (
              <PostCommentsSection
                post={post}
                user={user}
                commentText={commentText}
                replyTo={replyTo}
                onLoginClick={onLoginClick}
                onCommentTextChange={setCommentText}
                onCommentSubmit={handleCommentSubmit}
                onReplyToComment={(comment) => {
                  setReplyTo({ id: comment.id, name: comment.author });
                  document.getElementById(`input-${post.id}`)?.focus();
                }}
                onCancelReply={() => setReplyTo(null)}
              />
            )}
          </article>
        );
      })}
    </div>
  );
};

export default Feed;
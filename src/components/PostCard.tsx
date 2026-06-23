import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Hash, Clock, Check, Trash2, Edit, Send,
  Activity, Zap, Eye, ChevronDown
} from 'lucide-react';
import { Post, User, PostRatings, Comment } from '../types';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { usePostEdit } from '../hooks/usePostEdit';

// --- EXPANDABLE TELEMETRY COMPONENT ---
interface PostTelemetryProps {
  stats: PostRatings;
  onRate: (u: number, s: number, v: number) => Promise<void>;
  userHasVoted: boolean;
  currentUserVote: { u: number, s: number, v: number } | null;
}

const PostTelemetry: React.FC<PostTelemetryProps> = ({ stats, onRate, userHasVoted, currentUserVote }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasVoted = userHasVoted; 
  
  const [inputs, setInputs] = useState({ 
    u: currentUserVote?.u || 50, 
    s: currentUserVote?.s || 50, 
    v: currentUserVote?.v || 50 
  });

  useEffect(() => {
    if (currentUserVote) {
      setInputs(currentUserVote);
    } else {
      // FIX: reset to defaults when vote is cleared (e.g. user navigates away)
      setInputs({ u: 50, s: 50, v: 50 });
    }
  }, [currentUserVote]);

  const count = stats.count || 0;
  const avgU = count ? Math.round(stats.utility / count) : 0;
  const avgS = count ? Math.round(stats.skill / count) : 0;
  const avgV = count ? Math.round(stats.vision / count) : 0;
  const totalXP = Math.round((avgU + avgS + avgV) / 3);
  

  const handleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    await onRate(inputs.u, inputs.s, inputs.v);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const xpColor = totalXP >= 70 ? 'text-[#00ff00]' : totalXP >= 40 ? 'text-yellow-400' : 'text-slate-400';
  const barColor = totalXP >= 70 ? 'bg-[#00ff00]' : totalXP >= 40 ? 'bg-yellow-400' : 'bg-slate-500';

  return (
    <div className={`relative flex-1 mx-2 transition-all duration-300 ${isOpen ? 'mb-2' : ''}`}>
      <div 
        onClick={toggleOpen}
        className={`h-9 bg-slate-950/50 border border-white/5 hover:border-white/20 rounded-lg flex items-center justify-between px-3 cursor-pointer transition-all group ${isOpen ? 'border-white/20 bg-slate-900' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className={xpColor} />
          <span className={`text-xs font-bold font-mono ${xpColor}`}>
            {count > 0 ? `${totalXP} XP` : 'RATE'}
          </span>
        </div>

        {!isOpen && (
          <div className="flex gap-1 h-1.5 items-end">
            <div className="w-1 bg-slate-700 rounded-sm overflow-hidden h-full relative">
              <div style={{ height: `${avgU}%` }} className={`absolute bottom-0 w-full ${barColor} opacity-60 transition-all duration-500`}></div>
            </div>
            <div className="w-1 bg-slate-700 rounded-sm overflow-hidden h-full relative">
              <div style={{ height: `${avgS}%` }} className={`absolute bottom-0 w-full ${barColor} opacity-60 transition-all duration-500`}></div>
            </div>
            <div className="w-1 bg-slate-700 rounded-sm overflow-hidden h-full relative">
              <div style={{ height: `${avgV}%` }} className={`absolute bottom-0 w-full ${barColor} opacity-60 transition-all duration-500`}></div>
            </div>
          </div>
        )}

        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200"
        >
           <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {hasVoted ? 'EDIT TELEMETRY' : 'TELEMETRY INPUT'}
              </span>
           </div>

           <div className="space-y-4 font-mono text-[#00ff00]">
             {[
               { label: 'UTILITY', val: inputs.u, set: (v: number) => setInputs(prev => ({...prev, u: v})), icon: Zap },
               { label: 'SKILL', val: inputs.s, set: (v: number) => setInputs(prev => ({...prev, s: v})), icon: Activity },
               { label: 'VISION', val: inputs.v, set: (v: number) => setInputs(prev => ({...prev, v: v})), icon: Eye }
             ].map((item) => (
               <div key={item.label} className="space-y-1">
                 <div className="flex justify-between text-[10px]">
                   <span className="flex items-center gap-1 opacity-60"><item.icon size={10}/> {item.label}</span> 
                   <span>{item.val}%</span>
                 </div>
                 <input 
                   type="range" min="0" max="100" value={item.val} 
                   onChange={e => item.set(Number(e.target.value))} 
                   className="w-full accent-[#00ff00] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                 />
               </div>
             ))}
             
             <button 
               onClick={handleSubmit} 
               className="w-full mt-2 bg-[#00ff00] text-black font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
             >
               <Check size={12} /> {hasVoted ? 'UPDATE DATA' : 'CONFIRM DATA'}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN POST CARD COMPONENT ---
interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onVote?: (postId: string, type: 'up' | 'down') => void;
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
  onVote, 
  onToggleSave, 
  isSaved,
  onLoginClick,
  onDelete,
  onEdit,
  onAddComment,
  defaultExpanded = false
}) => {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(defaultExpanded);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { editingPostId, editContent, setEditContent, isSaving, startEdit, cancelEdit, saveEdit } = usePostEdit(
    onEdit ? (_post, newContent) => onEdit(newContent) : undefined
  );
  const isEditing = editingPostId === post.id;
  const menuRef = useRef<HTMLDivElement>(null);

  const [localTelemetry, setLocalTelemetry] = useState<PostRatings>(
    post.telemetry || { utility: 0, skill: 0, vision: 0, count: 0 }
  );
  
  const [localUserVoted, setLocalUserVoted] = useState(false);
  const [userLastVote, setUserLastVote] = useState<{ u: number, s: number, v: number } | null>(null);

  useEffect(() => {
    if (post.telemetry) {
      setLocalTelemetry(post.telemetry);
    }
  }, [post.telemetry]);

  const count = localTelemetry.count;
  const avgU = count ? localTelemetry.utility / count : 0;
  const avgS = count ? localTelemetry.skill / count : 0;
  const avgV = count ? localTelemetry.vision / count : 0;
  const avgXP = count ? Math.round((avgU + avgS + avgV) / 3) : 0;

  let batteryColorClass = 'bg-slate-600'; 
  let shadowClass = '';
  const batteryFillHeight = count > 0 ? `${Math.max(avgXP, 5)}%` : '5%'; 

  if (count > 0) {
    if (avgXP >= 70) {
      batteryColorClass = 'bg-[#00ff00]';
      shadowClass = 'shadow-[0_0_15px_#00ff00]';
    } else if (avgXP >= 40) {
      batteryColorClass = 'bg-yellow-400';
      shadowClass = 'shadow-[0_0_10px_#facc15]';
    } else {
      batteryColorClass = 'bg-rose-500';
      shadowClass = 'shadow-[0_0_10px_#f43f5e]';
    }
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

  // --- ✅ FIXED: handleTelemetryRate & handleVoteClick ---
  const handleTelemetryRate = async (u: number, s: number, v: number) => { 
    if (!currentUser) { onLoginClick(); return; }
    
    let newStats = { ...localTelemetry };
    
    if (localUserVoted && userLastVote) {
        newStats.utility = newStats.utility - userLastVote.u + u;
        newStats.skill = newStats.skill - userLastVote.s + s;
        newStats.vision = newStats.vision - userLastVote.v + v;
    } else {
        newStats.utility += u;
        newStats.skill += s;
        newStats.vision += v;
        newStats.count += 1;
    }

    setLocalTelemetry(newStats);
    setLocalUserVoted(true);
    setUserLastVote({ u, s, v });

    // Sync with Firebase
    try {
        await apiService.ratePostTelemetry(
          post.id, 
          currentUser.id, 
          'utility', // Default category for complex vote
          1,         // Increment count
          post.authorId,
          post.title,
          currentUser
        );
    } catch (err) {
        console.error("Telemetry sync failed", err);
    }
  };

  const handleToggleComments = (e: React.MouseEvent) => { e.stopPropagation(); setShowComments(!showComments); };
  
  const handleSubmitComment = async (e: React.FormEvent) => { 
    e.preventDefault(); e.stopPropagation();
    if (!commentText.trim()) return;
    if (!currentUser) return onLoginClick();
    if (!onAddComment) return;
    setIsSubmitting(true);
    try { await onAddComment(post.id, commentText); setCommentText(''); } 
    catch (error) { console.error("Comment failed", error); } 
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
  const handleCategoryClick = (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/c/${post.category}`); };

  const isOwner = currentUser?.id === post.authorId || currentUser?.isAdmin || currentUser?.role === 'admin';

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
                <span className={`font-bold text-xs drop-shadow-md ${count === 0 ? 'text-slate-400' : 'text-white'}`}>
                  {count > 0 ? avgXP : '0'}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">XP</span>
              </div>
           </div>
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 p-4 sm:p-5 pb-2 flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div onClick={handleAuthorClick} className="relative hover:opacity-60 transition-opacity">
                {post.avatar ? (
                  <img src={post.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {post.author?.[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                <span onClick={handleAuthorClick} className="text-sm font-bold text-slate-200 hover:underline">{post.author}</span>
                <span className="hidden sm:inline text-slate-400 text-xs">•</span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{post.timestamp ?? 'ახლახანს'}</span>
                </div>
              </div>
            </div>
            <div onClick={handleCategoryClick} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors uppercase tracking-wide">
              <Hash size={10} />
              {post.category}
            </div>
          </div>

          <div className="mb-4" onClick={(e) => isEditing && e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors">{post.title}</h3>
            
            {/* ✅ შეცვლილი Content ბლოკი რედაქტირებისთვის */}
            {isEditing ? (
              <div className="space-y-3 mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-300 text-sm min-h-[100px] focus:border-indigo-500 focus:outline-none custom-scrollbar"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                    className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    disabled={isSaving}
                  >
                    გაუქმება
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); saveEdit(post); }}
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? "ინახება..." : "შენახვა"}
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
                onClick={handleToggleComments}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-sm group/btn ${
                  showComments ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle size={18} className={showComments ? "fill-current" : "group-hover/btn:text-indigo-400"} />
                <span className="font-medium">{post.comments?.length || 0}</span>
              </button>
              <button onClick={handleShare} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                 {isCopied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
              </button>
            </div>

            <PostTelemetry 
              stats={localTelemetry} 
              onRate={handleTelemetryRate}
              userHasVoted={localUserVoted}
              currentUserVote={userLastVote} 
            />

            <div className="flex items-center gap-2 relative mt-1" ref={menuRef}>
              <button onClick={handleSave} className={`p-2 rounded-lg transition-all ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
              
              {/* ✅ მენიუს გახსნის ღილაკი */}
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
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
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 overflow-hidden">
              {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt="me" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold bg-indigo-600">{currentUser?.name?.[0] || '?'}</div>}
            </div>
            <div className="flex-1 relative">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="კომენტარი..." className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 pr-10" disabled={!currentUser || isSubmitting} />
              <button type="submit" disabled={!commentText.trim() || isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50"><Send size={16} /></button>
            </div>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {post.comments?.map((comment: Comment) => (
               <div key={comment.id} className="flex gap-3">
                 <div className="w-7 h-7 rounded-full bg-slate-800 shrink-0 overflow-hidden">
                    <img src={comment.avatar || comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`} className="w-full h-full object-cover" alt="author" />
                 </div>
                 <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-full">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-300">{comment.author || comment.authorName}</span>
                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-300 break-words">{comment.text}</p>
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
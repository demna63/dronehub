import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import PostCard from './PostCard';
import MarketItemView from './MarketItemView'; // ✅ ახალი იმპორტი
import { CornerDownLeft, ArrowRight, Hash, AlertTriangle } from 'lucide-react';

interface SinglePostPageProps {
  post: Post;
  currentUser: User | null;
  allPosts: Post[];
  onVote: (postId: string, type: 'up' | 'down') => void;
  onToggleSave: (postId: string) => void;
  savedPostIds: string[];
  onLoginClick: () => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
}

const SinglePostPage: React.FC<SinglePostPageProps> = ({
  post, currentUser, allPosts, onVote, onToggleSave, savedPostIds,
  onLoginClick, onDeletePost, onEditPost, onAddComment
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(post.category === 'marketplace' ? '/marketplace' : '/');
    }
  };

  const similarPosts = useMemo(() => {
    if (post.category === 'marketplace') return [];
    return allPosts
      .filter(p => p.id !== post.id && (p.category === post.category || p.tags?.some(t => post.tags?.includes(t))))
      .slice(0, 3);
  }, [post, allPosts]);

  const isMarketItem = post.category === 'marketplace';

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Back Button */}
      <div className="mb-6 pt-4 px-4 md:px-0">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <CornerDownLeft size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">უკან დაბრუნება</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 md:px-0">
        
        {/* MAIN CONTENT AREA */}
        <div className={isMarketItem ? "lg:col-span-3" : "lg:col-span-2"}>
          
          {/* ✅ ლოგიკა: მარკეტისთვის MarketItemView, სხვებისთვის PostCard */}
          {isMarketItem ? (
            <MarketItemView 
              item={post}
              currentUser={currentUser}
              onLoginClick={onLoginClick}
              onToggleSave={onToggleSave}
              isSaved={savedPostIds.includes(post.id)}
            />
          ) : (
            <PostCard 
              post={post}
              currentUser={currentUser}
              onVote={async () => onVote(post.id, 'up')}
              onToggleSave={() => onToggleSave(post.id)}
              isSaved={savedPostIds.includes(post.id)}
              onLoginClick={onLoginClick}
              onDelete={() => onDeletePost(post.id)}
              onEdit={() => onEditPost(post)}
              onAddComment={(id, text) => onAddComment(id, text)}
              defaultExpanded={true}
            />
          )}

        </div>

        {/* SIDEBAR (მხოლოდ ჩვეულებრივი პოსტებისთვის) */}
        {!isMarketItem && (
          <div className="hidden lg:block space-y-4">
             <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 sticky top-24">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Hash size={14} /> მსგავსი თემები
               </h3>
               
               <div className="space-y-3">
                 {similarPosts.length > 0 ? (
                   similarPosts.map(simPost => (
                     <div 
                       key={simPost.id} 
                       onClick={() => navigate(`/post/${simPost.id}`)}
                       className="group cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                     >
                        <h4 className="text-sm font-bold text-slate-300 group-hover:text-indigo-400 line-clamp-2 transition-colors mb-1">
                          {simPost.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{simPost.author}</span>
                          <div className="flex items-center gap-1">
                             <span>{simPost.commentsCount || 0} კომენტარი</span>
                             <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center text-xs text-slate-400 py-8 flex flex-col items-center gap-2">
                     <AlertTriangle size={24} className="opacity-20" />
                     მსგავსი პოსტები არ მოიძებნა
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SinglePostPage;
import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { apiService } from '../services/apiService';
import PostCard from './PostCard';
import { Bookmark, Loader2 } from 'lucide-react';

interface SavedPostsProps {
  currentUser: User | null;
  onToggleSave: (id: string) => void;
  onLoginClick: () => void;
}

const SavedPosts: React.FC<SavedPostsProps> = ({ currentUser, onToggleSave, onLoginClick }) => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const savedIds = currentUser?.savedPosts;

  useEffect(() => {
    let cancelled = false;

    const fetchSavedPosts = async () => {
      if (!currentUser || !savedIds || savedIds.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Fetched by id rather than by scanning the newest 50 posts: a bookmark
        // older than that window used to disappear from this page while its id
        // stayed in `savedPosts`, so the count and the list disagreed.
        const saved = await apiService.getPostsByIds(currentUser.savedPosts);
        if (!cancelled) setSavedPosts(saved);
      } catch (fetchError) {
        console.error("Error fetching saved posts:", fetchError);
        // The empty state used to double as the error state, which told the
        // user they had saved nothing — a lie on a failed read.
        if (!cancelled) setError('შენახული პოსტები ვერ ჩაიტვირთა.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSavedPosts();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, savedIds?.join(',')]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">იტვირთება შენახული პოსტები...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
        <Bookmark className="mx-auto text-slate-700 mb-4" size={48} />
        <p className="text-slate-400 mb-4 font-bold">გთხოვთ გაიაროთ ავტორიზაცია შენახული პოსტების სანახავად</p>
        <button onClick={onLoginClick} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">ავტორიზაცია</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
            <Bookmark className="text-indigo-500" /> შენახული პოსტები
          </h1>
          <p className="text-xs text-slate-500 font-bold tracking-tight">თქვენს მიერ მონიშნული საინტერესო მასალები</p>
        </div>
        <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          {savedPosts.length} POSTS
        </div>
      </div>

      {error && (
        <p role="alert" className="text-center py-10 text-sm font-bold text-rose-400 border-2 border-dashed border-rose-500/20 rounded-3xl">
          {error}
        </p>
      )}

      {!error && savedPosts.length > 0 ? (
        <div className="space-y-4">
          {savedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser}
              onToggleSave={onToggleSave}
              isSaved={true}
              onLoginClick={onLoginClick}
            />
          ))}
        </div>
      ) : !error ? (
        <div className="text-center py-32 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
          <Bookmark className="mx-auto text-slate-800 mb-4" size={40} />
          <p className="text-slate-500 font-bold text-sm">ჯერჯერობით არაფერი გაქვთ შენახული</p>
        </div>
      ) : null}
    </div>
  );
};

export default SavedPosts;
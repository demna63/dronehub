import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import PostCard from './PostCard';
import MarketItemView from './MarketItemView'; // ✅ ახალი იმპორტი
import { ArrowLeft } from 'lucide-react';
import { isMarketItem } from '../constants/market';
import { useLanguage } from '../contexts/useLanguage';
import { scrollAppToTop } from '../utils/appScroll';

interface SinglePostPageProps {
  post: Post;
  currentUser: User | null;
  allPosts: Post[];
  onToggleSave: (postId: string) => void;
  savedPostIds: string[];
  onLoginClick: () => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
}

const SinglePostPage: React.FC<SinglePostPageProps> = ({
  post, currentUser, allPosts, onToggleSave, savedPostIds,
  onLoginClick, onDeletePost, onEditPost, onAddComment
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  /** Set by the feed row's ⋯ → Edit. */
  const startInEdit = Boolean((location.state as { edit?: boolean } | null)?.edit);

  useEffect(() => {
    scrollAppToTop();
  }, [post.id]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(isMarketItem(post.category) ? '/market' : '/');
    }
  };

  const similarPosts = useMemo(() => {
    if (isMarketItem(post.category)) return [];
    return allPosts
      .filter(p => p.id !== post.id && (p.category === post.category || p.tags?.some(t => post.tags?.includes(t))))
      .slice(0, 3);
  }, [post, allPosts]);

  const isListing = isMarketItem(post.category);

  return (
    <div>
      {!isListing && <h1 className="sr-only">{post.title}</h1>}

      <button
        type="button"
        onClick={handleBack}
        className="mb-5 flex h-9 items-center gap-2 rounded-[10px] px-2.5 -ml-2.5 text-sm font-bold text-ink-2 transition-colors hover:bg-white/5"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('action_back')}
      </button>

      <div className={`grid grid-cols-1 gap-6 ${isListing ? '' : 'lg:grid-cols-[minmax(0,1fr)_280px]'}`}>
        <div className="min-w-0">
          {isListing ? (
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
              onToggleSave={() => onToggleSave(post.id)}
              isSaved={savedPostIds.includes(post.id)}
              onLoginClick={onLoginClick}
              onDelete={() => { onDeletePost(post.id); handleBack(); }}
              // The editor hands back the new content; passing the old `post`
              // here made the page keep rendering the pre-edit text.
              onEdit={(newContent) => onEditPost({ ...post, content: newContent })}
              onAddComment={(id, text) => onAddComment(id, text)}
              defaultExpanded={true}
              startInEdit={startInEdit}
            />
          )}
        </div>

        {!isListing && (
          <aside aria-label={t('related_topics')} className="hidden lg:block">
            <div className="sticky top-0 rounded-2xl border border-line bg-surface p-4">
              <h2 className="mb-3 px-1 text-sm font-bold text-ink">{t('related_topics')}</h2>
              {similarPosts.length > 0 ? (
                <div className="flex flex-col">
                  {similarPosts.map(simPost => (
                    <button
                      type="button"
                      key={simPost.id}
                      onClick={() => navigate(`/post/${simPost.id}`)}
                      className="flex flex-col gap-1 rounded-[10px] px-2.5 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="line-clamp-2 text-sm font-bold text-ink-2">{simPost.title}</span>
                      <span className="text-xs text-ink-3">
                        {simPost.author} · {t('related_comments_count', { count: simPost.commentsCount || 0 })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-1 py-6 text-center text-[13px] text-ink-3">{t('related_none')}</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default SinglePostPage;
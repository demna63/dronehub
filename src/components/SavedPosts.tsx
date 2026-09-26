import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { apiService } from '../services/apiService';
import PostRow from './PostRow';
import PageHeader from './PageHeader';
import PostCardSkeleton from './PostCardSkeleton';
import { useLanguage } from '../contexts/useLanguage';

interface SavedPostsProps {
  currentUser: User | null;
  onToggleSave: (id: string) => void;
  onLoginClick: () => void;
}

const SavedPosts: React.FC<SavedPostsProps> = ({ currentUser, onToggleSave, onLoginClick }) => {
  const { t } = useLanguage();
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
        if (!cancelled) setError(t('saved_load_failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSavedPosts();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, savedIds?.join(',')]);

  if (!currentUser) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('saved_title')} subtitle={t('saved_subtitle')} />
        <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <p className="mb-4 text-sm font-bold text-ink-2">{t('saved_needs_auth')}</p>
          <button
            type="button"
            onClick={onLoginClick}
            className="h-10 rounded-[10px] bg-accent-fill px-4 text-sm font-bold text-white transition-colors hover:bg-accent-fill-hover"
          >
            {t('action_sign_in')}
          </button>
        </div>
      </div>
    );
  }

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div aria-busy="true" aria-label={t('saved_loading')}>
        <PostCardSkeleton rows={3} />
      </div>
    );
  } else if (error) {
    body = (
      <p role="alert" className="rounded-2xl border border-bad/30 bg-surface px-6 py-10 text-center text-sm font-bold text-bad">
        {error}
      </p>
    );
  } else if (savedPosts.length === 0) {
    body = (
      <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
        <p className="text-sm font-bold text-ink-2">{t('saved_empty')}</p>
      </div>
    );
  } else {
    body = (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {savedPosts.map((post, index) => (
          <PostRow
            key={post.id}
            post={post}
            isSaved={currentUser.savedPosts?.includes(post.id) ?? true}
            onToggleSave={onToggleSave}
            priority={index === 0}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('saved_title')}
        subtitle={t('saved_subtitle')}
        action={!loading && !error ? (
          <span className="text-[13px] text-ink-3">{t('saved_count', { count: savedPosts.length })}</span>
        ) : undefined}
      />
      {body}
    </div>
  );
};

export default SavedPosts;
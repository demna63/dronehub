import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { Post, User } from '../types';
import { getPostByIdFromFirestore } from '../services/firestoreRepository';
import SinglePostPage from './SinglePostPage';
import PageMeta from './PageMeta';
import type { FeedProps } from './Feed';
import PostCardSkeleton from './PostCardSkeleton';
import NotFound from './NotFound';
import { useLanguage } from '../contexts/useLanguage';

interface PostPageProps {
  posts: Post[];
  currentUser: User | null;
  feedProps: FeedProps;
}

const PostPage: React.FC<PostPageProps> = ({ posts, currentUser, feedProps }) => {
  const { t } = useLanguage();
  const { postId } = useParams<{ postId: string }>();
  /**
   * The fetch result is keyed by the id it was fetched for. A `loading` flag
   * set inside the effect is still `false` on the first render, which used to
   * send every deep link to a post outside the cached feed straight to `/` —
   * Google saw each such post as a redirect to the homepage.
   */
  const [remote, setRemote] = useState<{ id: string; post: Post | null; failed: boolean } | null>(null);

  const cachedPost = useMemo(
    () => posts.find((post) => post.id === postId) || null,
    [posts, postId]
  );

  const resolved = remote !== null && remote.id === postId;
  const post = cachedPost || (resolved ? remote.post : null);

  useEffect(() => {
    if (!postId || cachedPost) return;

    let cancelled = false;

    getPostByIdFromFirestore(postId)
      .then((fetchedPost) => {
        if (!cancelled) setRemote({ id: postId, post: fetchedPost, failed: false });
      })
      .catch(() => {
        if (!cancelled) setRemote({ id: postId, post: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [postId, cachedPost]);

  if (!postId) {
    return <Navigate to="/" replace />;
  }

  if (!post && !resolved) {
    return (
      <div aria-busy="true" aria-label={t('state_loading')} >
        <PostCardSkeleton />
      </div>
    );
  }

  if (!post) {
    // A deleted post is a 404, not a redirect to the feed. A failed fetch is
    // not evidence the post is gone, so it must not tell crawlers to drop it.
    return <NotFound noindex={!remote?.failed} />;
  }

  return (
    <>
      <PageMeta title={post.title} description={post.content || undefined} />
      <SinglePostPage
        post={post}
        currentUser={currentUser}
        allPosts={posts}
        onToggleSave={feedProps.onToggleSave ?? (() => {})}
        savedPostIds={feedProps.savedPostIds ?? []}
        onLoginClick={feedProps.onLoginClick ?? (() => {})}
        onDeletePost={feedProps.onDeletePost ?? (async () => {})}
        onEditPost={feedProps.onEditPost ?? (() => {})}
        onAddComment={feedProps.onAddComment ?? (async () => {})}
      />
    </>
  );
};

export default PostPage;

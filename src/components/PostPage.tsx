import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { Post, User } from '../types';
import { getPostByIdFromFirestore } from '../services/firestoreRepository';
import SinglePostPage from './SinglePostPage';
import PageMeta from './PageMeta';
import type { FeedProps } from './Feed';
import PostCardSkeleton from './PostCardSkeleton';
import { useLanguage } from '../contexts/useLanguage';

interface PostPageProps {
  posts: Post[];
  currentUser: User | null;
  feedProps: FeedProps;
}

const PostPage: React.FC<PostPageProps> = ({ posts, currentUser, feedProps }) => {
  const { t } = useLanguage();
  const { postId } = useParams<{ postId: string }>();
  const [remotePost, setRemotePost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  const cachedPost = useMemo(
    () => posts.find((post) => post.id === postId) || null,
    [posts, postId]
  );

  const post = cachedPost || remotePost;

  useEffect(() => {
    if (!postId || cachedPost) return;

    let cancelled = false;
    setLoading(true);

    getPostByIdFromFirestore(postId)
      .then((fetchedPost) => {
        if (!cancelled) setRemotePost(fetchedPost);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, cachedPost]);

  if (!postId) {
    return <Navigate to="/" replace />;
  }

  if (loading && !post) {
    return (
      <div aria-busy="true" aria-label={t('state_loading')} >
        <PostCardSkeleton />
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <PageMeta title={post.title} description={post.content ? post.content.slice(0, 160) : undefined} />
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

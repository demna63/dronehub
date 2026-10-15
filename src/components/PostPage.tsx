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
  // The id the last Firestore lookup finished for. Comparing it to `postId`
  // (instead of a `loading` flag that starts false) means the first render of a
  // direct visit shows the skeleton rather than concluding "not found" before
  // the fetch has even started — that early verdict used to redirect every
  // deep link (and Googlebot) to `/`.
  const [remote, setRemote] = useState<{ id: string; post: Post | null } | null>(null);

  const cachedPost = useMemo(
    () => posts.find((post) => post.id === postId) || null,
    [posts, postId]
  );

  const remoteSettled = remote !== null && remote.id === postId;
  const post = cachedPost || (remoteSettled ? remote.post : null);

  useEffect(() => {
    if (!postId || cachedPost) return;

    let cancelled = false;

    getPostByIdFromFirestore(postId)
      .catch(() => null)
      .then((fetchedPost) => {
        if (!cancelled) setRemote({ id: postId, post: fetchedPost });
      });

    return () => {
      cancelled = true;
    };
  }, [postId, cachedPost]);

  if (!postId) {
    return <Navigate to="/" replace />;
  }

  if (!post && !remoteSettled) {
    return (
      <div aria-busy="true" aria-label={t('state_loading')} >
        <PostCardSkeleton />
      </div>
    );
  }

  if (!post) {
    // A deleted post is gone, not moved: a 404 view (noindex) lets Google drop
    // the URL instead of reporting it as "Page with redirect".
    return <NotFound />;
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

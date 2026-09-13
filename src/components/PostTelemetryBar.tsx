import React from 'react';
import type { Post, PostTelemetryVote, User } from '../types';
import { usePostTelemetry } from '../hooks/usePostTelemetry';
import PostTelemetry from './PostTelemetry';

export interface PostTelemetryBarProps {
  post: Post;
  currentUser: User | null;
  onLoginClick?: () => void;
}

/**
 * The feed card's rating block.
 *
 * This used to render a battery, three read-only axis bars *and* a collapsed
 * score bar — three representations of one number, stacked. It is now a thin
 * container: it owns the post's rating state and hands it to the single
 * {@link PostTelemetry} widget, so the feed and the post card show the same
 * control backed by the same hook.
 */
const PostTelemetryBar: React.FC<PostTelemetryBarProps> = ({ post, currentUser, onLoginClick }) => {
  const { telemetry, userVote, isLoadingVote, rate } = usePostTelemetry(
    post.id,
    post.telemetry,
    currentUser,
  );

  const handleRate = async (ratings: PostTelemetryVote) => {
    if (!currentUser) {
      onLoginClick?.();
      return;
    }
    await rate(ratings);
  };

  return (
    <div className="flex-1 min-w-0">
      <PostTelemetry
        stats={telemetry}
        onRate={handleRate}
        currentUserVote={userVote ?? null}
        isLoadingVote={isLoadingVote}
        canRate={Boolean(currentUser)}
        onRequireLogin={onLoginClick}
      />
    </div>
  );
};

/** Memoised: these render once per feed card, so an unrelated Feed state
    change used to re-render all of them. */
export default React.memo(PostTelemetryBar);

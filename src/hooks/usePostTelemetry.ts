import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import type { PostRatings, PostTelemetryVote, User } from '../types';
import { applyOptimisticVote } from '../utils/telemetry';

const EMPTY: PostRatings = { utility: 0, skill: 0, vision: 0, count: 0 };

export interface UsePostTelemetryResult {
  telemetry: PostRatings;
  /** `undefined` while loading, `null` when the user has not rated. */
  userVote: PostTelemetryVote | null | undefined;
  isLoadingVote: boolean;
  /** Rejects if the server refused; the optimistic state is rolled back first. */
  rate: (ratings: PostTelemetryVote) => Promise<void>;
}

/**
 * Owns one post's rating state: the aggregate, the caller's own vote, and
 * submitting a rating.
 *
 * Two surfaces show ratings (the feed and the post card) and both previously
 * kept their own copy of this logic with different, incompatible rules. Sharing
 * one hook is what keeps them honest about the same data.
 *
 * The caller's vote is fetched rather than assumed: initialising it to "has not
 * voted" made returning users re-rate, and the server then discarded the
 * duplicate, so the UI and the database disagreed until a reload.
 */
export const usePostTelemetry = (
  postId: string,
  initialTelemetry: PostRatings | undefined,
  currentUser: User | null,
): UsePostTelemetryResult => {
  const [telemetry, setTelemetry] = useState<PostRatings>(initialTelemetry || EMPTY);
  const [userVote, setUserVote] = useState<PostTelemetryVote | null | undefined>(undefined);

  useEffect(() => {
    setTelemetry(initialTelemetry || EMPTY);
  }, [initialTelemetry]);

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    if (!currentUserId) {
      setUserVote(null);
      return;
    }

    let cancelled = false;
    setUserVote(undefined);
    apiService
      .getUserTelemetryVote(postId, currentUserId)
      .then((vote) => { if (!cancelled) setUserVote(vote); })
      .catch(() => { if (!cancelled) setUserVote(null); });

    return () => { cancelled = true; };
    // Keyed on the id, NOT the user object. App.tsx mints a new `currentUser`
    // reference on every bookmark toggle, and this hook runs once per rendered
    // post card — so bookmarking a single post refired ~50 billed vote reads.
  }, [postId, currentUserId]);

  const rate = useCallback(
    async (ratings: PostTelemetryVote) => {
      if (!currentUser) return;

      const previousTelemetry = telemetry;
      const previousVote = userVote;

      // Optimistic, then reconciled against the server's own aggregate so the
      // card can never drift away from what the database actually holds.
      setTelemetry(applyOptimisticVote(telemetry, ratings, userVote));
      setUserVote(ratings);

      try {
        const result = await apiService.ratePostTelemetry(postId, ratings);
        if (result?.telemetry) setTelemetry(result.telemetry);
      } catch (err) {
        setTelemetry(previousTelemetry);
        setUserVote(previousVote ?? null);
        throw err;
      }
    },
    [postId, currentUser, telemetry, userVote],
  );

  return { telemetry, userVote, isLoadingVote: userVote === undefined, rate };
};

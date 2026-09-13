/**
 * telemetry.ts — the single definition of how a post's UTILITY / SKILL / VISION
 * ratings collapse into one number.
 *
 * The same formula exists in two places: here, for display, and in the
 * `ratePost` Cloud Function, which owns the persisted `telemetryScore` that
 * ranking reads. Functions is CommonJS and deploys separately, so it cannot
 * import this module — it mirrors these constants deliberately. If you change a
 * constant here, change it there too (functions/index.js, TELEMETRY block).
 */

import type { PostRatings } from '../types';

/** Ratings are percentages. Anything outside is a bug or a hostile client. */
export const RATING_MIN = 0;
export const RATING_MAX = 100;

/**
 * Below this many raters a post has an opinion, not a rating. The UI withholds
 * a verdict rather than presenting one person's slider as the community's view.
 */
export const MIN_VOTES_FOR_VERDICT = 3;

/** Neutral prior: an unrated post is "unknown", not "bad". */
export const PRIOR_MEAN = 50;

/**
 * How many virtual votes the prior is worth. At 5, a lone 100% rating lands
 * near 58 instead of 100 — so one enthusiastic friend cannot outrank a post
 * that forty people actually rated highly.
 */
export const PRIOR_WEIGHT = 5;

export const clampRating = (value: number): number =>
  Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(Number(value) || 0)));

/**
 * Ratings are entered as five taps, not a 0-100 slider.
 *
 * Storage stays in percent so nothing has to be migrated and the Cloud Function
 * is untouched; the star scale is purely a presentation layer over it. One star
 * is the lowest rating a person can give — zero means "has not rated yet" and is
 * never submitted.
 */
export const RATING_STARS = 5;
export const STAR_STEP = RATING_MAX / RATING_STARS;

/** 1..5 stars -> 20..100 percent. */
export const starsToPercent = (stars: number): number =>
  clampRating(Math.round(Number(stars) || 0) * STAR_STEP);

/**
 * 0-100 -> 0-5, kept to one decimal. Averages are shown fractionally on
 * purpose: rounding 4.9 and 4.1 to the same five stars throws away the only
 * difference a reader cares about.
 */
export const percentToStars = (percent: number): number =>
  Math.round((clampRating(percent) / STAR_STEP) * 10) / 10;

export interface TelemetryAverages {
  utility: number;
  skill: number;
  vision: number;
}

/**
 * Per-axis averages in 0-100. All zero when nobody has rated.
 *
 * The result is clamped, not merely divided. A sum and a count can disagree —
 * documents written by the old one-click UI counted clicks in `count` while
 * storing +1 in the axis, so a post can hold sums of 100 against a count of 1
 * and average to 101%. Nothing should ever render a bar past full: clamp here
 * rather than at each call site.
 */
export const telemetryAverages = (stats?: PostRatings | null): TelemetryAverages => {
  const count = stats?.count ?? 0;
  if (!count || !stats) return { utility: 0, skill: 0, vision: 0 };
  return {
    utility: clampRating(stats.utility / count),
    skill: clampRating(stats.skill / count),
    vision: clampRating(stats.vision / count),
  };
};

/**
 * Bayesian average across all three axes, shrunk toward {@link PRIOR_MEAN} by
 * {@link PRIOR_WEIGHT} virtual votes. Returns the prior for an unrated post, so
 * the value is always a usable sort key.
 */
export const telemetryScore = (stats?: PostRatings | null): number => {
  const count = stats?.count ?? 0;
  if (!count || !stats) return PRIOR_MEAN;
  return Math.round(
    (PRIOR_WEIGHT * PRIOR_MEAN + count * telemetryRawMean(stats)) / (PRIOR_WEIGHT + count),
  );
};

/**
 * The unshrunk mean across all three axes, 0-100. Zero when nobody has rated.
 *
 * Clamped for the same reason as the averages: an inconsistent sum/count pair
 * must not push the value outside the scale it is drawn on.
 */
export const telemetryRawMean = (stats?: PostRatings | null): number => {
  const count = stats?.count ?? 0;
  if (!count || !stats) return 0;
  return clampRating((stats.utility + stats.skill + stats.vision) / (3 * count));
};

/** True once enough people have rated for the score to carry meaning. */
export const hasEnoughVotes = (stats?: PostRatings | null): boolean =>
  (stats?.count ?? 0) >= MIN_VOTES_FOR_VERDICT;

export interface TelemetryDisplay {
  /** 0-100, for a bar or gauge fill. */
  percent: number;
  /** 0-5, for a star row. */
  stars: number;
  /** True once MIN_VOTES_FOR_VERDICT people have rated. */
  isConfirmed: boolean;
  /** False only when literally nobody has rated. */
  hasAny: boolean;
  count: number;
}

/**
 * What a surface should actually draw for a post's rating.
 *
 * Both the feed widget and the post card's gauge read this, so they cannot
 * disagree about what a given post is worth.
 *
 * Below the vote threshold it returns the RAW mean, not the Bayesian score:
 * someone who has just given four stars must not be told the post sits at 2.9.
 * The shrunk score is a sort key, not a label — ranking keeps using it, and the
 * caller marks a sub-threshold number as provisional rather than hiding it.
 * Hiding it was the earlier behaviour and it read as "my rating didn't save".
 */
export const telemetryDisplay = (stats?: PostRatings | null): TelemetryDisplay => {
  const count = stats?.count ?? 0;
  const isConfirmed = hasEnoughVotes(stats);
  const percent = count === 0
    ? 0
    : isConfirmed ? telemetryScore(stats) : telemetryRawMean(stats);

  return { percent, stars: percentToStars(percent), isConfirmed, hasAny: count > 0, count };
};

/** A single person's rating collapsed to one star value, for "your rating". */
export const voteStars = (vote?: { utility: number; skill: number; vision: number } | null): number =>
  vote ? percentToStars((vote.utility + vote.skill + vote.vision) / 3) : 0;

/**
 * The aggregate a post should show immediately after `voter` submits `ratings`.
 *
 * Re-rating must apply the DELTA against the voter's previous vote, not add the
 * new value again — otherwise one person rating twice inflates the sums while
 * `count` stays put, and every future average is wrong. First-time votes add
 * the values and increment `count`.
 *
 * Pure so it can be tested; the hook reconciles against the server's own
 * aggregate immediately afterwards, and rolls back to the previous value if the
 * write is refused.
 */
export const applyOptimisticVote = (
  current: PostRatings,
  ratings: { utility: number; skill: number; vision: number },
  previousVote: { utility: number; skill: number; vision: number } | null | undefined,
): PostRatings => {
  const next: PostRatings = { ...current };

  for (const axis of ['utility', 'skill', 'vision'] as const) {
    const delta = previousVote ? ratings[axis] - previousVote[axis] : ratings[axis];
    // Sums can never go negative, even against a contaminated starting value.
    next[axis] = Math.max(0, (Number(current[axis]) || 0) + delta);
  }

  if (!previousVote) next.count = (Number(current.count) || 0) + 1;
  return next;
};

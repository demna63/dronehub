import { describe, expect, it } from 'vitest';
import {
  MIN_VOTES_FOR_VERDICT,
  PRIOR_MEAN,
  RATING_STARS,
  applyOptimisticVote,
  clampRating,
  hasEnoughVotes,
  percentToStars,
  starsToPercent,
  telemetryAverages,
  telemetryDisplay,
  telemetryRawMean,
  telemetryScore,
  voteStars,
} from './telemetry';
import type { PostRatings } from '../types';

/** Sums, as stored on the post — never averages. */
const stats = (utility: number, skill: number, vision: number, count: number): PostRatings =>
  ({ utility, skill, vision, count });

describe('clampRating', () => {
  it('keeps ratings inside 0-100', () => {
    expect(clampRating(-40)).toBe(0);
    expect(clampRating(101)).toBe(100);
    expect(clampRating(73)).toBe(73);
  });

  it('treats junk as zero rather than propagating NaN into the sums', () => {
    expect(clampRating(Number.NaN)).toBe(0);
    expect(clampRating(undefined as unknown as number)).toBe(0);
    expect(clampRating('55' as unknown as number)).toBe(55);
  });
});

describe('telemetryAverages', () => {
  it('divides each axis by the number of raters', () => {
    // two raters: (80,60,40) and (60,40,20)
    expect(telemetryAverages(stats(140, 100, 60, 2))).toEqual({
      utility: 70, skill: 50, vision: 30,
    });
  });

  it('returns zeros rather than dividing by zero', () => {
    expect(telemetryAverages(stats(0, 0, 0, 0))).toEqual({ utility: 0, skill: 0, vision: 0 });
    expect(telemetryAverages(undefined)).toEqual({ utility: 0, skill: 0, vision: 0 });
  });
});

describe('telemetryScore', () => {
  it('returns the neutral prior for an unrated post', () => {
    expect(telemetryScore(stats(0, 0, 0, 0))).toBe(PRIOR_MEAN);
    expect(telemetryScore(undefined)).toBe(PRIOR_MEAN);
  });

  it('shrinks a lone perfect rating toward the prior', () => {
    // One 100% vote must not read as 100. (5*50 + 1*100) / 6 = 58.33
    expect(telemetryScore(stats(100, 100, 100, 1))).toBe(58);
  });

  it('lets a real consensus outweigh a single enthusiast', () => {
    const oneFan = telemetryScore(stats(100, 100, 100, 1));
    const fortyRaters = telemetryScore(stats(40 * 85, 40 * 85, 40 * 85, 40));
    expect(fortyRaters).toBeGreaterThan(oneFan);
  });

  it('converges on the observed mean as votes accumulate', () => {
    const many = telemetryScore(stats(500 * 80, 500 * 80, 500 * 80, 500));
    expect(Math.abs(many - 80)).toBeLessThanOrEqual(1);
  });

  it('is monotonic in the ratings', () => {
    expect(telemetryScore(stats(300, 300, 300, 10)))
      .toBeLessThan(telemetryScore(stats(600, 600, 600, 10)));
  });

  it('averages across all three axes, not just one', () => {
    // Regression guard: the old write path only ever stored `utility`, so
    // skill/vision sat at 0 and the score collapsed toward the floor.
    const balanced = telemetryScore(stats(300, 300, 300, 10));
    const utilityOnly = telemetryScore(stats(300, 0, 0, 10));
    expect(balanced).toBeGreaterThan(utilityOnly);
  });
});

describe('inconsistent legacy data', () => {
  // The old one-click UI incremented `count` per click while adding +1 to a
  // single axis, so sums and counts in the database do not always agree. The
  // display must stay inside 0-100 whatever it is handed.
  it('never averages above 100 when the sum exceeds count * 100', () => {
    const avg = telemetryAverages(stats(101, 100, 100, 1));
    expect(avg).toEqual({ utility: 100, skill: 100, vision: 100 });
  });

  it('never scores above 100 on the same data', () => {
    expect(telemetryScore(stats(101, 100, 100, 1))).toBeLessThanOrEqual(100);
  });

  it('never returns a negative average', () => {
    expect(telemetryAverages(stats(-50, -50, -50, 2))).toEqual({ utility: 0, skill: 0, vision: 0 });
  });
});

describe('hasEnoughVotes', () => {
  it('withholds a verdict below the threshold', () => {
    for (let n = 0; n < MIN_VOTES_FOR_VERDICT; n += 1) {
      expect(hasEnoughVotes(stats(n * 90, n * 90, n * 90, n))).toBe(false);
    }
  });

  it('allows one at the threshold', () => {
    const n = MIN_VOTES_FOR_VERDICT;
    expect(hasEnoughVotes(stats(n * 90, n * 90, n * 90, n))).toBe(true);
  });

  it('handles a missing aggregate', () => {
    expect(hasEnoughVotes(undefined)).toBe(false);
  });
});

describe('star scale', () => {
  it('maps 1-5 stars onto the stored percent scale', () => {
    expect(starsToPercent(1)).toBe(20);
    expect(starsToPercent(3)).toBe(60);
    expect(starsToPercent(5)).toBe(100);
  });

  it('never emits a value outside the stored scale', () => {
    expect(starsToPercent(0)).toBe(0);
    expect(starsToPercent(9)).toBe(100);
    expect(starsToPercent(-2)).toBe(0);
    expect(starsToPercent(Number.NaN)).toBe(0);
  });

  it('round-trips every selectable star value', () => {
    for (let stars = 1; stars <= RATING_STARS; stars += 1) {
      expect(percentToStars(starsToPercent(stars))).toBe(stars);
    }
  });

  it('keeps averages fractional rather than rounding to whole stars', () => {
    expect(percentToStars(84)).toBe(4.2);
    expect(percentToStars(98)).toBe(4.9);
    expect(percentToStars(PRIOR_MEAN)).toBe(2.5);
  });

  it('clamps a contaminated aggregate instead of drawing past five stars', () => {
    expect(percentToStars(140)).toBe(5);
  });
});

describe('telemetryDisplay', () => {
  it('shows nothing at all only when nobody has rated', () => {
    const view = telemetryDisplay(stats(0, 0, 0, 0));
    expect(view.hasAny).toBe(false);
    expect(view.isConfirmed).toBe(false);
    expect(view.stars).toBe(0);
  });

  it('shows the rater their own raw mean below the vote threshold', () => {
    // One person rated 100/80/60 — they must see 4.0, not the shrunk 2.9 the
    // ranking key holds.
    const oneVote = stats(100, 80, 60, 1);
    const view = telemetryDisplay(oneVote);
    expect(view.hasAny).toBe(true);
    expect(view.isConfirmed).toBe(false);
    expect(view.percent).toBe(telemetryRawMean(oneVote));
    expect(view.stars).toBe(4);
    expect(telemetryScore(oneVote)).toBeLessThan(view.percent);
  });

  it('switches to the shrunk score once the threshold is met', () => {
    const threeVotes = stats(300, 240, 180, 3);
    const view = telemetryDisplay(threeVotes);
    expect(view.isConfirmed).toBe(true);
    expect(view.percent).toBe(telemetryScore(threeVotes));
  });

  it('never draws past five stars on a contaminated aggregate', () => {
    expect(telemetryDisplay(stats(400, 400, 400, 2)).stars).toBeLessThanOrEqual(RATING_STARS);
  });
});

describe('voteStars', () => {
  it('collapses one person\u2019s three axes to a single star value', () => {
    expect(voteStars({ utility: 100, skill: 80, vision: 60 })).toBe(4);
    expect(voteStars(null)).toBe(0);
  });
});

describe('applyOptimisticVote', () => {
  const vote = (utility: number, skill: number, vision: number) => ({ utility, skill, vision });

  it('adds the values and increments count for a first-time voter', () => {
    expect(applyOptimisticVote(stats(0, 0, 0, 0), vote(80, 60, 40), null))
      .toEqual({ utility: 80, skill: 60, vision: 40, count: 1 });
  });

  it('applies the DELTA when re-rating, and does not touch count', () => {
    // Someone who rated 80 and changes to 100 adds 20, not 100. Adding the full
    // value again inflates the sums while count stays put, so every future
    // average is silently wrong.
    const after = applyOptimisticVote(stats(80, 60, 40, 1), vote(100, 60, 20), vote(80, 60, 40));
    expect(after).toEqual({ utility: 100, skill: 60, vision: 20, count: 1 });
  });

  it('stays inside the scale after a re-rate round trip', () => {
    const first = applyOptimisticVote(stats(0, 0, 0, 0), vote(100, 100, 100), null);
    const second = applyOptimisticVote(first, vote(20, 20, 20), vote(100, 100, 100));
    expect(second).toEqual({ utility: 20, skill: 20, vision: 20, count: 1 });
    expect(telemetryAverages(second)).toEqual({ utility: 20, skill: 20, vision: 20 });
  });

  it('never drives a sum negative against a contaminated aggregate', () => {
    // Legacy one-click documents left sums and counts disagreeing.
    const after = applyOptimisticVote(stats(10, 10, 10, 3), vote(0, 0, 0), vote(100, 100, 100));
    expect(after.utility).toBe(0);
    expect(after.count).toBe(3);
  });
});

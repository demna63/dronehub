import type { PostRatings } from '../types';
import { telemetryDisplay } from './telemetry';

/**
 * Mean star rating across a pilot's posts that at least one person has rated.
 *
 * Unrated posts are left out, so a long list of new posts does not drag a
 * real average toward zero. Null when nothing has been rated — the header
 * shows a dash instead of inventing a score.
 */
export const profileAverageStars = (
  posts: readonly { telemetry?: PostRatings | null }[],
): number | null => {
  const rated = posts
    .map((post) => telemetryDisplay(post.telemetry))
    .filter((view) => view.hasAny);
  if (rated.length === 0) return null;
  const mean = rated.reduce((sum, view) => sum + view.stars, 0) / rated.length;
  return Math.round(mean * 10) / 10;
};

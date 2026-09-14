/**
 * telemetryService.ts — client half of post ratings.
 *
 * The aggregate on a post is denormalised, so a client able to write it is a
 * client able to forge it. firestore.rules therefore forbids clients from
 * touching `telemetry`, `telemetryScore` and the votes subcollection; the
 * `ratePost` Cloud Function performs the write with admin credentials inside a
 * transaction. This module is the only way in from the browser.
 */

import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';
import { clampRating } from '../utils/telemetry';
import type { PostRatings, PostTelemetryVote } from '../types';

type RatePostRequest = PostTelemetryVote & { postId: string };
type RatePostResponse = { telemetry: PostRatings; telemetryScore: number };

/**
 * Deployed callable name.
 *
 * The original `ratePost` deployment wedged (404 on describe, 409 "already
 * exists" on every create) and has since been deleted from the project; the
 * name is kept retired to avoid re-entering that state. Change this constant
 * and the export name in functions/index.js together.
 */
const RATE_POST_FUNCTION = 'ratePostV2';

let functionsInstance: ReturnType<typeof getFunctions> | null = null;

const getRatePostCallable = () => {
  if (!functionsInstance) {
    functionsInstance = getFunctions(
      app,
      import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1',
    );
  }
  return httpsCallable<RatePostRequest, RatePostResponse>(functionsInstance, RATE_POST_FUNCTION);
};

/**
 * Submit (or replace) the caller's rating of a post.
 *
 * Re-rating is a replacement, not a second vote: the function applies the delta
 * against the caller's previous values, so `count` stays a count of distinct
 * raters. Returns the authoritative aggregate so the caller can reconcile its
 * optimistic state instead of guessing.
 *
 * Throws on failure — callers must roll their optimistic update back rather
 * than leaving the UI showing a rating the server never accepted.
 */
/**
 * Turn a callable failure into something a pilot can act on.
 *
 * Returns a TRANSLATION KEY, not a sentence. A service has no access to the
 * language context, and hardcoding one language here would mean a Georgian
 * error appearing in an English UI.
 *
 * A single "could not save" covers up the two cases that matter most: the
 * function is not deployed (the whole feature is down, retrying is pointless),
 * and the user is signed out (retrying after signing in will work).
 */
const describeFailure = (error: unknown): string => {
  const code = (error as FunctionsError)?.code;
  switch (code) {
    case 'functions/not-found':
    case 'functions/unavailable':
      return 'rating_service_unavailable';
    case 'functions/unauthenticated':
      return 'rating_needs_auth';
    case 'functions/permission-denied':
      return 'rating_not_allowed';
    case 'functions/deadline-exceeded':
      return 'rating_timeout';
    default:
      return 'rating_save_failed';
  }
};

export const ratePost = async (
  postId: string,
  ratings: PostTelemetryVote,
): Promise<RatePostResponse> => {
  const callable = getRatePostCallable();
  try {
    const response = await callable({
      postId,
      utility: clampRating(ratings.utility),
      skill: clampRating(ratings.skill),
      vision: clampRating(ratings.vision),
    });
    return response.data;
  } catch (error) {
    // Keep the original as `cause` so console/error reporting still sees the
    // Firebase code, while the UI gets a sentence worth showing a user.
    throw new Error(describeFailure(error), { cause: error });
  }
};

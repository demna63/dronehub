// runtime: Node.js 22
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const getModel = (apiKey) => {
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: 'gemini-3.6-flash' });
};

const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text || '{}');
  } catch {
    return fallback;
  }
};

/**
 * Caps on everything a caller controls.
 *
 * `checkZoneWithAI` and `checkRestrictedZone` used to be reachable without
 * authentication, with `cors: true` and an uncapped `query` interpolated
 * straight into the prompt — which is a free, internet-facing Gemini endpoint
 * billed to this project. Given docs/security-incident-2026-07.md, that is the
 * same failure mode as the incident, through a different door.
 *
 * Every action now requires a signed-in caller, every free-text field is
 * truncated, and each account gets a daily budget. `maxInstances` bounds the
 * worst case even if all of that is somehow defeated.
 */
const GEMINI_ACTIONS = new Set(['analyzePost', 'checkZoneWithAI', 'translateText', 'checkRestrictedZone']);

const GEMINI_LIMITS = {
  title: 200,
  content: 4000,
  text: 2000,
  query: 500,
  callsPerDay: 60,
};

/** Truncate rather than reject: a long post should still be analysable. */
const capText = (value, max) => String(value ?? '').slice(0, max);

const assertCoordinate = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > 180) {
    throw new HttpsError('invalid-argument', `Invalid ${name}.`);
  }
  return number;
};

/**
 * One transactional counter per user per UTC day.
 *
 * Fails open on an unexpected error: a broken quota check must not take the
 * feature down, and `maxInstances` still bounds the blast radius.
 */
const assertGeminiQuota = async (uid) => {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`aiUsage/${uid}_${day}`);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const used = snap.exists ? Number(snap.get('calls')) || 0 : 0;
      if (used >= GEMINI_LIMITS.callsPerDay) {
        throw new HttpsError('resource-exhausted', 'დღიური ლიმიტი ამოიწურა. სცადე ხვალ.');
      }
      tx.set(ref, {
        calls: used + 1,
        day,
        uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('AI quota check failed, allowing the call:', error);
  }
};

exports.geminiProxy = onCall(
  {
    secrets: [geminiApiKey],
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    const { action, payload = {} } = request.data || {};
    if (!action) {
      throw new HttpsError('invalid-argument', 'Missing action.');
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'შესასვლელად გაიარე ავტორიზაცია.');
    }

    // Validate the action before spending the caller's daily budget on it.
    if (!GEMINI_ACTIONS.has(action)) {
      throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }

    await assertGeminiQuota(request.auth.uid);

    const model = getModel(geminiApiKey.value());

    switch (action) {
      case 'analyzePost': {
        const title = capText(payload.title, GEMINI_LIMITS.title);
        const content = capText(payload.content, GEMINI_LIMITS.content);
        const prompt = `Analyze this drone community post.\nTitle: "${title}"\nContent: "${content}"\nReturn JSON with suggestedCategory, suggestedSubCategory, tags (max 5), summary in Georgian (max 100 chars).`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { suggestedCategory: 'general', suggestedSubCategory: '', tags: [], summary: '' }) };
      }

      case 'checkZoneWithAI': {
        const lat = assertCoordinate(payload.lat, 'lat');
        const lng = assertCoordinate(payload.lng, 'lng');
        const prompt = `I am a drone pilot in Georgia. Coordinates: ${lat}, ${lng}. Return JSON: {"status":"RESTRICTED"|"CAUTION"|"CLEAR","message":"Georgian max 20 words"}`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' }) };
      }

      case 'translateText': {
        const text = capText(payload.text, GEMINI_LIMITS.text);
        const prompt = `Translate to English (if Georgian) or Georgian (if English), drone pilot slang ok: "${text}"`;
        const response = await model.generateContent(prompt);
        return { result: response.response.text() || text };
      }

      case 'checkRestrictedZone': {
        const query = capText(payload.query, GEMINI_LIMITS.query);
        const prompt = `Drone pilot in Georgia asks about: "${query}". Return JSON status RESTRICTED|CAUTION|CLEAR and Georgian message max 20 words.`;
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        return { result: parseJson(response.response.text(), { status: 'CAUTION', message: 'ვერ მოხერხდა შემოწმება.' }) };
      }

      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  }
);

// =============================================================================
// TELEMETRY — post ratings (UTILITY / SKILL / VISION)
// =============================================================================
//
// The aggregate on a post is denormalised for read speed, so a client that can
// write it can also forge it: firestore.rules therefore forbids clients from
// touching `telemetry`, `telemetryScore` and the votes subcollection, and every
// rating goes through this callable instead. It runs with admin credentials,
// so it bypasses those rules by design.
//
// The individual vote documents are the source of truth; the sums on the post
// are a cache that can always be rebuilt from them.
//
// These constants mirror src/utils/telemetry.ts. That module cannot be imported
// here (ESM/TS source, deployed separately), so the two are kept in sync by
// hand — change one, change the other.
const TELEMETRY = {
  AXES: ['utility', 'skill', 'vision'],
  MIN: 0,
  MAX: 100,
  PRIOR_MEAN: 50,
  PRIOR_WEIGHT: 5,
};

const clampRating = (value) =>
  Math.min(TELEMETRY.MAX, Math.max(TELEMETRY.MIN, Math.round(Number(value) || 0)));

/** Bayesian average shrunk toward the neutral prior. Mirrors telemetryScore(). */
const computeTelemetryScore = ({ utility, skill, vision, count }) => {
  if (!count) return TELEMETRY.PRIOR_MEAN;
  const observedMean = (utility + skill + vision) / (3 * count);
  return Math.round(
    (TELEMETRY.PRIOR_WEIGHT * TELEMETRY.PRIOR_MEAN + count * observedMean) /
      (TELEMETRY.PRIOR_WEIGHT + count),
  );
};

/**
 * Record (or replace) one user's rating of one post.
 *
 * Idempotent per user: re-rating applies the delta between the old and new
 * values rather than adding a second vote, so `count` only ever counts distinct
 * raters. The whole thing is one Firestore transaction — concurrent raters
 * cannot interleave and lose an increment.
 */
// Named ratePostV2, not ratePost: the original name is wedged in Cloud
// Functions — `gcloud functions describe` returns 404 and `list` does not show
// it, yet every create returns 409 "already exists". A stuck name is cheaper to
// abandon than to fight; keep this name and do not resurrect the old one.
exports.ratePostV2 = onCall({ region: 'us-central1', cors: true }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in to rate a post.');
  }

  const { postId, utility, skill, vision } = request.data || {};
  if (typeof postId !== 'string' || !postId || postId.length > 200 || postId.includes('/')) {
    throw new HttpsError('invalid-argument', 'A valid postId is required.');
  }

  const next = {
    utility: clampRating(utility),
    skill: clampRating(skill),
    vision: clampRating(vision),
  };

  const postRef = db.collection('posts').doc(postId);
  const voteRef = postRef.collection('votes').doc(uid);

  const aggregate = await db.runTransaction(async (tx) => {
    const [postSnap, voteSnap] = await Promise.all([tx.get(postRef), tx.get(voteRef)]);
    if (!postSnap.exists) {
      throw new HttpsError('not-found', 'That post no longer exists.');
    }

    const previous = voteSnap.exists ? voteSnap.data() : null;
    const current = postSnap.get('telemetry') || {};

    // Everything below is coerced through Number(...) || 0 because the documents
    // predating this function are a different shape: posts may carry a
    // `telemetry` map without `count`, and vote docs from the old one-click UI
    // hold {category, value} with no per-axis fields at all. An undefined
    // reaching the arithmetic yields NaN, and Firestore rejects NaN — which
    // surfaced as a bare `internal` error with no clue as to the cause.
    const currentCount = Number(current.count) || 0;
    const updated = { count: currentCount + (previous ? 0 : 1) };
    for (const axis of TELEMETRY.AXES) {
      const before = previous ? clampRating(previous[axis]) : 0;
      const delta = next[axis] - before;
      updated[axis] = Math.max(0, (Number(current[axis]) || 0) + delta);
    }

    // Firestore also rejects an explicit `undefined`. Legacy vote docs are not
    // guaranteed to have createdAt, so fall back rather than passing it through.
    const createdAt = (previous && previous.createdAt)
      ? previous.createdAt
      : admin.firestore.FieldValue.serverTimestamp();

    tx.set(voteRef, {
      userId: uid,
      ...next,
      createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(postRef, {
      telemetry: updated,
      telemetryScore: computeTelemetryScore(updated),
    });

    return updated;
  });

  return { telemetry: aggregate, telemetryScore: computeTelemetryScore(aggregate) };
});

/**
 * Keep `posts/{postId}.commentsCount` truthful.
 *
 * The client cannot maintain this. `firestore.rules` only lets a post's own
 * author update the post, and a commenter is usually somebody else — so the
 * count was incremented in React state alone and never written anywhere. A post
 * with forty comments showed no badge the moment the tab reloaded.
 *
 * Same ownership model as `ratePostV2`: the server owns the aggregate, clients
 * only ever write the underlying documents.
 */
const COMMENT_COUNT_PATH = 'posts/{postId}/comments/{commentId}';

/**
 * Firestore triggers must sit in the DATABASE's region, not the region the
 * callables happen to use.
 *
 * This database is in europe-west1. Deploying these two to us-central1 (copied
 * from the callables above) still works, but every comment write takes a
 * transatlantic Eventarc hop before the counter is touched — latency on each
 * write plus cross-region egress, for a function that only does an increment.
 *
 * The callables stay in us-central1 deliberately: they are invoked directly by
 * the browser, so their region is a client-latency decision, not a database one,
 * and moving them would change their URLs.
 */
const FIRESTORE_REGION = 'europe-west1';
const commentCountOptions = { document: COMMENT_COUNT_PATH, region: FIRESTORE_REGION };

const adjustCommentCount = async (postId, delta) => {
  if (!postId) return;
  try {
    await db.doc(`posts/${postId}`).update({
      commentsCount: admin.firestore.FieldValue.increment(delta),
    });
  } catch (error) {
    // A deleted post takes its comment subcollection with it, so the delete
    // trigger routinely fires for a document that no longer exists. That is
    // expected, not a failure worth retrying.
    if (error && error.code === 5) return;
    console.error(`Failed to adjust commentsCount for ${postId}:`, error);
    throw error;
  }
};

exports.onCommentCreated = onDocumentCreated(commentCountOptions, (event) =>
  adjustCommentCount(event.params.postId, 1));

exports.onCommentDeleted = onDocumentDeleted(commentCountOptions, (event) =>
  adjustCommentCount(event.params.postId, -1));

// =============================================================================
// BACKFILL — one-off maintenance, admin only
// =============================================================================
//
// Temporary. Delete this export and redeploy once the dry run reports nothing
// left to write. It exists because the two jobs below are impossible from a
// browser by design: `facets` is not in the posts update allowlist, and
// `telemetryScore` is refused outright.
//
// FACETS — mirrors buildFacets() in src/utils/facets.ts. Change one, change the
// other; src/utils/facets.mirror.test.ts fails the build if they drift.
const buildFacets = ({ category, subCategory, tags }) => {
  const seen = new Set();
  for (const part of [category, subCategory, ...(Array.isArray(tags) ? tags : [])]) {
    if (typeof part !== 'string') continue;
    const normalised = part.trim().toLowerCase();
    if (normalised) seen.add(normalised);
  }
  return [...seen];
};

const sameFacets = (a, b) =>
  Array.isArray(a) && a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Adds `facets` and a neutral `telemetryScore` to posts written before either
 * existed.
 *
 * Idempotent: a second run reports zero writes. Always `dryRun` first — the
 * counts it returns are what the real run will do.
 */
exports.backfillPosts = onCall({ region: 'us-central1', cors: true }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const caller = await db.doc(`users/${uid}`).get();
  const profile = caller.exists ? caller.data() : null;
  if (!profile || (profile.isAdmin !== true && profile.role !== 'admin')) {
    throw new HttpsError('permission-denied', 'Admins only.');
  }

  const dryRun = request.data && request.data.dryRun !== false;
  const snapshot = await db.collection('posts').get();

  const pending = [];
  for (const document of snapshot.docs) {
    const post = document.data();
    const update = {};

    const facets = buildFacets(post);
    if (!sameFacets(post.facets, facets)) update.facets = facets;

    // Only seed a score where there is none. A post that has been rated owns a
    // real score, and overwriting it with the prior would discard every vote.
    if (typeof post.telemetryScore !== 'number') {
      update.telemetryScore = TELEMETRY.PRIOR_MEAN;
    }

    if (Object.keys(update).length > 0) pending.push({ ref: document.ref, update });
  }

  if (!dryRun) {
    // Firestore caps a batch at 500 writes.
    for (let index = 0; index < pending.length; index += 400) {
      const batch = db.batch();
      for (const { ref, update } of pending.slice(index, index + 400)) {
        batch.update(ref, update);
      }
      await batch.commit();
    }
  }

  return {
    dryRun,
    scanned: snapshot.size,
    toWrite: pending.length,
    facetsAdded: pending.filter((item) => item.update.facets !== undefined).length,
    scoresSeeded: pending.filter((item) => item.update.telemetryScore !== undefined).length,
  };
});

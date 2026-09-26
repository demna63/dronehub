import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  documentId,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Comment, MeetRoomData, Post, PostTelemetryVote, User, VlogEntry } from '../types';
import { pickAllowedProfileFields } from '../utils/userProfileAllowlist';
import { SEARCH_SCAN_LIMIT, searchPosts } from '../utils/search';

/**
 * True only for `{}` literals — not for class instances.
 *
 * This distinction is the whole point of the sanitizer below.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Strip `undefined`, which Firestore rejects, without touching anything else.
 *
 * Only PLAIN objects are rebuilt. The previous version recursed into every
 * object, which quietly destroyed the SDK's sentinel values: `serverTimestamp()`
 * returns a `FieldValue` instance, and copying its enumerable properties into a
 * fresh `{}` produces `{ _methodName: 'serverTimestamp' }` — an ordinary map as
 * far as Firestore is concerned. It was stored verbatim instead of being
 * resolved to the write time.
 *
 * The damage was not obvious. Such a post has a `createdAt` that is not a date,
 * so every reader fell back to "just now" and it read as new forever; and
 * because Firestore orders a map AFTER a timestamp, `orderBy('createdAt',
 * 'desc')` parked it permanently at the top of the feed.
 *
 * The same applies to `Timestamp`, `GeoPoint`, `DocumentReference`, `Bytes` and
 * `increment()` — every one of them is a class instance that must reach the SDK
 * intact.
 */
export const sanitizeFirestoreData = <T extends DocumentData>(data: T): T => {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizeFirestoreData(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (isPlainObject(data)) {
    return Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = sanitizeFirestoreData(value as DocumentData);
      }
      return acc;
    }, {}) as T;
  }

  return data;
};

const isValidId = (id?: string | null): boolean => Boolean(id && typeof id === 'string' && id.trim());

/**
 * Default ceiling for collection reads.
 *
 * Every one of these queries used to be unbounded, so their cost grew linearly
 * with the corpus forever and a single page view could scan an entire
 * collection. A bound that is generous today is still a bound.
 */
const COLLECTION_LIMIT = 100;

/** Firestore caps an `in`/`documentId()` filter at 30 values per query. */
const IN_CLAUSE_MAX = 30;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

/** How the feed is ordered. */
export type PostSort = 'rated' | 'new';

/** How many posts one page of the feed holds. */
export const FEED_PAGE_SIZE = 12;

/**
 * An opaque position in the feed. Holding the Firestore snapshot rather than a
 * field value keeps the cursor correct for the two-field `rated` ordering,
 * where reconstructing it by hand would need both the score and the timestamp
 * and would tie-break differently.
 */
export type PostCursor = QueryDocumentSnapshot<DocumentData>;

export interface PostPage {
  posts: Post[];
  /** Pass to the next call. Null once the end of the feed is reached. */
  cursor: PostCursor | null;
  hasMore: boolean;
}

export interface PostPageOptions {
  sort?: PostSort;
  /** A value from `facets` — lowercased category, sub-category or tag. */
  facet?: string | null;
  cursor?: PostCursor | null;
  pageSize?: number;
}

/**
 * Fetch one page of the feed.
 *
 * `rated` orders by the stored Bayesian score, then by recency. The secondary
 * sort matters more than it looks: every post below the vote threshold carries
 * the same neutral prior, so without it they would come back in an arbitrary
 * order — with it, unrated posts stay in newest-first order among themselves
 * while genuinely well-rated posts rise above them.
 *
 * The category filter runs here rather than on the client. Filtering a fetched
 * page in the browser means the number of results depends on how much of the
 * feed happens to be loaded, which with pagination is a guarantee that
 * categories look emptier than they are.
 *
 * There is no longer a second query merging in posts that lack
 * `telemetryScore`: every post is now created with the neutral prior and the
 * backfill added it to the rest. That merge could not have been paginated
 * anyway — two independently ordered result sets have no single cursor.
 */
export const getPostPageFromFirestore = async ({
  sort = 'rated',
  facet = null,
  cursor = null,
  pageSize = FEED_PAGE_SIZE,
}: PostPageOptions = {}): Promise<PostPage> => {
  const constraints = [
    ...(facet ? [where('facets', 'array-contains', facet)] : []),
    ...(sort === 'rated' ? [orderBy('telemetryScore', 'desc')] : []),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    // One extra document is requested purely to answer "is there more?" without
    // a second round trip; it is dropped before the page is returned.
    limit(pageSize + 1),
  ];

  const snapshot = await getDocs(query(collection(db, 'posts'), ...constraints));
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

  return {
    posts: docs.map((document) => ({ id: document.id, ...document.data() }) as Post),
    cursor: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
};

/**
 * How many posts carry a facet, counted server-side.
 *
 * An aggregation query bills one read per 1000 index entries, so the sidebar's
 * category counts cost a handful of reads instead of downloading the posts.
 */
export const countPostsByFacetFromFirestore = async (facet: string): Promise<number> => {
  const snapshot = await getCountFromServer(
    query(collection(db, 'posts'), where('facets', 'array-contains', facet)),
  );
  return snapshot.data().count;
};

/**
 * Fetch the feed as a single list.
 *
 * Kept for the admin dashboard, which needs a broad view rather than a page.
 * Everything user-facing should page through {@link getPostPageFromFirestore}.
 */
export const getPostsFromFirestore = async (
  limitCount = 50,
  sort: PostSort = 'rated',
): Promise<Post[]> => {
  const toPosts = (snapshot: QuerySnapshot<DocumentData>): Post[] =>
    snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as Post[];

  const ordering = sort === 'rated'
    ? [orderBy('telemetryScore', 'desc'), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')];

  return toPosts(await getDocs(
    query(collection(db, 'posts'), ...ordering, limit(limitCount)),
  ));
};

/**
 * Fetch specific posts by id.
 *
 * SavedPosts used to call `getPosts()` and filter client-side: a user with
 * three bookmarks paid 50 reads, and any post older than that window silently
 * vanished from the page while its id stayed in `savedPosts` — so the counter
 * and the list disagreed and it looked like bookmarks had been lost.
 */
export const getPostsByIdsFromFirestore = async (postIds: string[]): Promise<Post[]> => {
  const ids = [...new Set(postIds.filter(isValidId))];
  if (ids.length === 0) return [];

  const batches = await Promise.all(
    chunk(ids, IN_CLAUSE_MAX).map((group) =>
      getDocs(query(collection(db, 'posts'), where(documentId(), 'in', group)))),
  );

  const byId = new Map<string, Post>();
  for (const snapshot of batches) {
    for (const document of snapshot.docs) {
      byId.set(document.id, { id: document.id, ...document.data() } as Post);
    }
  }

  // Preserve the caller's order; a document that has since been deleted is
  // simply absent rather than a hole.
  return ids.map((id) => byId.get(id)).filter((post): post is Post => Boolean(post));
};

export const getPostByIdFromFirestore = async (postId: string): Promise<Post | null> => {
  if (!isValidId(postId)) return null;
  const snapshot = await getDoc(doc(db, 'posts', postId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Post;
};

export const getCommentsFromFirestore = async (postId: string): Promise<Comment[]> => {
  if (!isValidId(postId)) return [];
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({
    ...document.data(),
    // The document id must win over any `id` field an older client wrote into
    // the payload: edit and delete address the document, so a stale client-side
    // id would silently target nothing. Same reasoning for `postId`.
    postId,
    id: document.id,
  })) as Comment[];
};

/**
 * Full-text search over recent posts.
 *
 * Firestore has no full-text index, so the newest {@link SEARCH_SCAN_LIMIT}
 * posts are fetched and matched in memory. That is fine at the current corpus
 * size and honest about its ceiling: past that limit older posts stop being
 * searchable and a real index (Algolia/Typesense, or a search-terms array field
 * written on save) becomes necessary.
 *
 * Ranking and field handling live in utils/search.ts so they can be tested
 * without a database.
 */
export const getPostsBySearchFromFirestore = async (searchQuery: string): Promise<Post[]> => {
  if (!searchQuery || !searchQuery.trim()) return [];

  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(SEARCH_SCAN_LIMIT));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as Post));

  return searchPosts(posts, searchQuery);
};

export const addPostToFirestore = async (newPost: DocumentData): Promise<void> => {
  const payload = sanitizeFirestoreData(newPost);
  await addDoc(collection(db, 'posts'), payload);
};

export const deletePostFromFirestore = async (postId: string): Promise<void> => {
  if (!isValidId(postId)) return;
  await deleteDoc(doc(db, 'posts', postId));
};

export const updateUserProfileInFirestore = async (userId: string, data: Partial<User>): Promise<void> => {
  if (!isValidId(userId)) return;
  const sanitizedData = sanitizeFirestoreData(pickAllowedProfileFields(data));
  if (Object.keys(sanitizedData).length === 0) return;

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...sanitizedData,
    updatedAt: serverTimestamp(),
  });
};

export const addVlogToFirestore = async (vlogData: DocumentData): Promise<{ id: string; data: DocumentData }> => {
  const payload = sanitizeFirestoreData(vlogData);
  const docRef = await addDoc(collection(db, 'vlogs'), payload);
  return { id: docRef.id, data: payload };
};

export const getVlogsFromFirestore = async (): Promise<VlogEntry[]> => {
  const q = query(collection(db, 'vlogs'), orderBy('createdAt', 'desc'), limit(COLLECTION_LIMIT));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as VlogEntry[];
};

export const getMeetRoomsFromFirestore = async (): Promise<MeetRoomData[]> => {
  const snapshot = await getDocs(query(collection(db, 'meetRooms'), limit(COLLECTION_LIMIT)));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as MeetRoomData[];
};

export const createNotificationInFirestore = async (notificationData: DocumentData): Promise<void> => {
  const payload = sanitizeFirestoreData(notificationData);
  await addDoc(collection(db, 'notifications'), payload);
};

/**
 * Read the signed-in user's own rating of a post, if they have one.
 *
 * Without this the UI could not tell a first-time visitor from someone who
 * already rated: `userHasVoted` reset to false on every mount, so returning
 * users were invited to rate again and their "new" rating was silently
 * discarded server-side.
 *
 * Returns null when there is no vote, and also when the read fails — a missing
 * rating must degrade to "not rated yet", never break the card.
 */
export const getUserTelemetryVote = async (
  postId: string,
  userId: string,
): Promise<PostTelemetryVote | null> => {
  if (!isValidId(postId) || !isValidId(userId)) return null;

  try {
    const snapshot = await getDoc(doc(db, 'posts', postId, 'votes', userId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
      utility: Number(data.utility) || 0,
      skill: Number(data.skill) || 0,
      vision: Number(data.vision) || 0,
    };
  } catch {
    return null;
  }
};

/** Longest comment body accepted by the editor; mirrors the compose input. */
export const MAX_COMMENT_LENGTH = 2000;

export const addCommentToFirestore = async (
  postId: string,
  commentData: DocumentData,
): Promise<string | null> => {
  if (!isValidId(postId)) return null;

  const payload: DocumentData = { ...commentData };
  // Callers still mint a client-side id for their optimistic row. Persisting it
  // would shadow the real document id on read, so it never reaches Firestore.
  delete payload.id;

  const commentRef = doc(collection(db, 'posts', postId, 'comments'));
  await setDoc(commentRef, sanitizeFirestoreData({
    ...payload,
    createdAt: serverTimestamp(),
  }));
  return commentRef.id;
};

/**
 * Rewrite a comment body. Authorisation is enforced by the Firestore rule
 * (`isOwner(resource.data.authorId) || isAdmin()`); this only shapes the write
 * so a rejected attempt fails at the rule rather than corrupting the document.
 */
export const updateCommentInFirestore = async (
  postId: string,
  commentId: string,
  text: string,
): Promise<void> => {
  if (!isValidId(postId) || !isValidId(commentId)) {
    throw new Error('Invalid comment reference.');
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Comment text cannot be empty.');

  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    text: trimmed.slice(0, MAX_COMMENT_LENGTH),
    editedAt: serverTimestamp(),
  });
};

export const deleteCommentFromFirestore = async (
  postId: string,
  commentId: string,
): Promise<void> => {
  if (!isValidId(postId) || !isValidId(commentId)) {
    throw new Error('Invalid comment reference.');
  }
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
};

export const addDocumentToFirestore = async (collectionName: string, data: DocumentData): Promise<{ id: string }> => {
  const payload = sanitizeFirestoreData(data);
  const docRef = await addDoc(collection(db, collectionName), payload);
  return { id: docRef.id };
};

export const getCollectionDocuments = async (collectionName: string): Promise<DocumentData[]> => {
  const snapshot = await getDocs(query(collection(db, collectionName), limit(COLLECTION_LIMIT)));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const getUserDroneBuildsFromFirestore = async (userId: string): Promise<DocumentData[]> => {
  const q = query(
    collection(db, 'droneBuilds'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(COLLECTION_LIMIT),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const getPresetsFromFirestore = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, 'presets'), orderBy('createdAt', 'desc'), limit(COLLECTION_LIMIT));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const updatePostInFirestore = async (postId: string, data: DocumentData): Promise<void> => {
  if (!isValidId(postId)) return;
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, sanitizeFirestoreData(data));
};

export const markNotificationAsReadInFirestore = async (notificationId: string): Promise<void> => {
  if (!isValidId(notificationId)) return;
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const getSpotsFromFirestore = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, 'spots'), orderBy('createdAt', 'desc'), limit(COLLECTION_LIMIT));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const addSpotToFirestore = async (spotData: DocumentData): Promise<{ id: string; data: DocumentData }> => {
  const payload = sanitizeFirestoreData(spotData);
  const docRef = await addDoc(collection(db, 'spots'), payload);
  return { id: docRef.id, data: payload };
};

export const deleteDroneBuildFromFirestore = async (buildId: string): Promise<void> => {
  if (!isValidId(buildId)) return;
  await deleteDoc(doc(db, 'droneBuilds', buildId));
};

export const updateDroneBuildInFirestore = async (buildId: string, buildData: DocumentData): Promise<void> => {
  if (!isValidId(buildId)) return;
  const buildRef = doc(db, 'droneBuilds', buildId);
  await updateDoc(buildRef, sanitizeFirestoreData(buildData));
};

export const getSTLFilesFromFirestore = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, 'stlFiles'), orderBy('createdAt', 'desc'), limit(COLLECTION_LIMIT));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const addSTLItemToFirestore = async (stlData: DocumentData): Promise<void> => {
  const payload = sanitizeFirestoreData(stlData);
  await addDoc(collection(db, 'stlFiles'), payload);
};

export const addDroneBuildToFirestore = async (buildData: DocumentData): Promise<{ id: string; data: DocumentData }> => {
  const payload = sanitizeFirestoreData(buildData);
  const docRef = await addDoc(collection(db, 'droneBuilds'), payload);
  return { id: docRef.id, data: payload };
};

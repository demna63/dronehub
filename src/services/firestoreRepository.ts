import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  increment,
  writeBatch,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Comment, MeetRoomData, Post, User, VlogEntry } from '../types';
import { pickAllowedProfileFields } from '../utils/userProfileAllowlist';

const sanitizeFirestoreData = <T extends DocumentData>(data: T): T => {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizeFirestoreData(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (data instanceof Date) {
    return data as T;
  }

  if (typeof data === 'object') {
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

export const getPostsFromFirestore = async (limitCount = 50): Promise<Post[]> => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as Post[];
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
    id: document.id,
    postId,
    ...document.data(),
  })) as Comment[];
};

export const getPostsBySearchFromFirestore = async (searchQuery: string): Promise<Post[]> => {
  if (!searchQuery) return [];
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(200));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as Post));
  const lowerQuery = searchQuery.toLowerCase();
  return posts.filter((post) =>
    post.title.toLowerCase().includes(lowerQuery) ||
    post.content.toLowerCase().includes(lowerQuery) ||
    post.author.toLowerCase().includes(lowerQuery) ||
    post.brand?.toLowerCase().includes(lowerQuery)
  );
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
  const q = query(collection(db, 'vlogs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as VlogEntry[];
};

export const getMeetRoomsFromFirestore = async (): Promise<MeetRoomData[]> => {
  const snapshot = await getDocs(collection(db, 'meetRooms'));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as MeetRoomData[];
};

export const createNotificationInFirestore = async (notificationData: DocumentData): Promise<void> => {
  const payload = sanitizeFirestoreData(notificationData);
  await addDoc(collection(db, 'notifications'), payload);
};

export const ratePostTelemetryInFirestore = async (
  postId: string,
  userId: string,
  category: string,
  voteValue: number
): Promise<void> => {
  if (!isValidId(postId) || !isValidId(userId) || !['utility', 'skill', 'vision'].includes(category)) return;

  const voteRef = doc(db, 'posts', postId, 'votes', userId);
  const existingVote = await getDoc(voteRef);
  if (existingVote.exists()) return;

  const postRef = doc(db, 'posts', postId);
  const batch = writeBatch(db);

  batch.set(voteRef, sanitizeFirestoreData({
    userId,
    category,
    value: voteValue,
    createdAt: serverTimestamp(),
  }));

  batch.update(postRef, {
    [`telemetry.${category}`]: increment(voteValue),
    'telemetry.count': increment(1),
    votes: increment(voteValue),
  });

  await batch.commit();
};

export const addCommentToFirestore = async (postId: string, commentData: DocumentData): Promise<void> => {
  if (!isValidId(postId)) return;

  const commentRef = doc(collection(db, 'posts', postId, 'comments'));
  await setDoc(commentRef, sanitizeFirestoreData({
    ...commentData,
    createdAt: serverTimestamp(),
  }));
};

export const addDocumentToFirestore = async (collectionName: string, data: DocumentData): Promise<{ id: string }> => {
  const payload = sanitizeFirestoreData(data);
  const docRef = await addDoc(collection(db, collectionName), payload);
  return { id: docRef.id };
};

export const getCollectionDocuments = async (collectionName: string): Promise<DocumentData[]> => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const getUserDroneBuildsFromFirestore = async (userId: string): Promise<DocumentData[]> => {
  const q = query(
    collection(db, 'droneBuilds'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
};

export const getPresetsFromFirestore = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, 'presets'), orderBy('createdAt', 'desc'));
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
  const q = query(collection(db, 'spots'), orderBy('createdAt', 'desc'));
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
  const q = query(collection(db, 'stlFiles'), orderBy('createdAt', 'desc'));
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

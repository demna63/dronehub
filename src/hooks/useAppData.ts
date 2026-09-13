import { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from '../lib/firebase';

/** Newest notifications kept in memory and streamed. */
const NOTIFICATION_LIMIT = 40;
import { apiService } from '../services/apiService';
import type { MeetRoomData, Notification as NotificationType, Post, User, VlogEntry } from '../types';
import type { PostSort } from '../services/firestoreRepository';
import { readCachedData, writeCachedData } from '../utils/offlineCache';

const readStaleCache = <T,>(key: 'posts' | 'vlogs' | 'meetRooms') =>
  readCachedData<T>(key, { allowStale: true });

export const useAppData = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  /**
   * Feed ordering. Held in a ref rather than state because fetchPosts is
   * memoised with an empty dependency list — making it depend on the sort would
   * recreate it on every change and re-trigger every effect that consumes it.
   */
  const postSortRef = useRef<PostSort>('rated');
  const [postSort, setPostSortState] = useState<PostSort>('rated');

  // fetchPosts is defined below; the ref lets setPostSort call it without
  // forcing either callback to depend on the other.
  const fetchPostsRef = useRef<((sort?: PostSort) => Promise<void>) | null>(null);

  const setPostSort = useCallback((sort: PostSort) => {
    setPostSortState(sort);
    void fetchPostsRef.current?.(sort);
  }, []);

  const [posts, setPosts] = useState<Post[]>(() => {
    // Seed the first render from the newest post the inline HTML probe already
    // fetched (window.__DHG_LCP_POST__), so the LCP image paints immediately
    // instead of waiting for the Firestore SDK query. Best-effort and safe: the
    // shape mirrors apiService.getPosts(); the cache effect and fetchPosts below
    // overwrite it with the fuller list as soon as either resolves.
    try {
      const seed = (window as unknown as { __DHG_LCP_POST__?: Post }).__DHG_LCP_POST__;
      return seed && seed.id ? [seed] : [];
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [vlogs, setVlogs] = useState<VlogEntry[]>([]);
  const [meetRooms, setMeetRooms] = useState<MeetRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  // Distinct from `loading`, which only tracks auth. The feed used to bind its
  // spinner to the auth flag, so a cold visit showed "no posts yet" while the
  // query was still in flight — and showed the same thing when it failed.
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => typeof window !== 'undefined' ? !window.navigator.onLine : false);

  useEffect(() => {
    const updateConnectivity = () => setIsOffline(!window.navigator.onLine);
    updateConnectivity();

    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);

    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
    };
  }, []);

  useEffect(() => {
    const cachedPosts = readStaleCache<Post[]>('posts');
    const cachedVlogs = readStaleCache<VlogEntry[]>('vlogs');
    const cachedMeetRooms = readStaleCache<MeetRoomData[]>('meetRooms');

    if (cachedPosts) setPosts(cachedPosts);
    if (cachedVlogs) setVlogs(cachedVlogs);
    if (cachedMeetRooms) setMeetRooms(cachedMeetRooms);
  }, []);

  const fetchPosts = useCallback(async (sort: PostSort = postSortRef.current) => {
    postSortRef.current = sort;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const nextPosts = await apiService.getPosts(sort);
      if (nextPosts.length > 0) {
        setPosts(nextPosts);
        writeCachedData('posts', nextPosts);
      } else {
        const cachedPosts = readCachedData<Post[]>('posts') || readStaleCache<Post[]>('posts');
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
        } else {
          setPosts(nextPosts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      const cachedPosts = readStaleCache<Post[]>('posts');
      if (cachedPosts && cachedPosts.length > 0) {
        // Stale content beats an error screen, but say so rather than passing
        // it off as fresh.
        setPosts(cachedPosts);
        setPostsError('ვერ განვაახლე — ნაჩვენებია შენახული ვერსია.');
      } else {
        setPostsError('პოსტები ვერ ჩაიტვირთა.');
      }
    } finally {
      setPostsLoading(false);
    }
  }, []);

  fetchPostsRef.current = fetchPosts;

  const fetchVlogs = useCallback(async () => {
    try {
      const nextVlogs = await apiService.getVlogs();
      if (nextVlogs.length > 0) {
        setVlogs(nextVlogs);
        writeCachedData('vlogs', nextVlogs);
      } else {
        const cachedVlogs = readCachedData<VlogEntry[]>('vlogs') || readStaleCache<VlogEntry[]>('vlogs');
        if (cachedVlogs && cachedVlogs.length > 0) {
          setVlogs(cachedVlogs);
        } else {
          setVlogs(nextVlogs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vlogs:', error);
      const cachedVlogs = readStaleCache<VlogEntry[]>('vlogs');
      if (cachedVlogs) setVlogs(cachedVlogs);
    }
  }, []);

  const fetchMeetRooms = useCallback(async () => {
    try {
      const nextMeetRooms = await apiService.getMeetRooms();
      if (nextMeetRooms.length > 0) {
        setMeetRooms(nextMeetRooms);
        writeCachedData('meetRooms', nextMeetRooms);
      } else {
        const cachedMeetRooms = readCachedData<MeetRoomData[]>('meetRooms') || readStaleCache<MeetRoomData[]>('meetRooms');
        if (cachedMeetRooms && cachedMeetRooms.length > 0) {
          setMeetRooms(cachedMeetRooms);
        } else {
          setMeetRooms(nextMeetRooms);
        }
      }
    } catch (error) {
      console.error('Failed to fetch meet rooms:', error);
      const cachedMeetRooms = readStaleCache<MeetRoomData[]>('meetRooms');
      if (cachedMeetRooms) setMeetRooms(cachedMeetRooms);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      /**
       * Everything here runs inside a `finally`.
       *
       * `getDoc` used to be awaited bare: one rejected profile read — a flaky
       * connection, a rules change, an offline reload — meant `setLoading(false)`
       * was never reached, and App.tsx's full-screen "Initializing System"
       * spinner stayed up forever with no error and no way out but a hard
       * reload, which reproduced it.
       */
      try {
        if (!user) {
          setCurrentUser(null);
          return;
        }

        // The identity Firebase Auth already gave us. Enough to render the app
        // even if the profile document is unreachable.
        const fallbackUser: User = {
          id: user.uid,
          name: user.displayName || 'Pilot',
          avatar: user.photoURL || '',
          email: user.email || '',
          reputation: 0,
          isAdmin: false,
          role: 'pilot',
          createdAt: new Date().toISOString(),
        };

        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          setCurrentUser(userDocSnap.exists()
            ? ({ id: user.uid, ...userDocSnap.data() } as User)
            : fallbackUser);
        } catch (profileError) {
          console.error('Failed to load profile, continuing with auth identity:', profileError);
          setCurrentUser(fallbackUser);
        }
      } catch (authError) {
        console.error('Auth state handling failed:', authError);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }, (observerError) => {
      // The observer can error INSTEAD of emitting — blocked IndexedDB in a
      // private window, a persistence-init failure. Without this the `next`
      // callback never runs, nothing reaches the finally above, and the splash
      // screen hangs exactly as it did before the try/catch was added.
      console.error('Auth observer error:', observerError);
      setCurrentUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Posts only. `fetchVlogs`/`fetchMeetRooms` used to run here too, so every
    // visitor who never opened /vlogs or /meet still paid for two full
    // collection scans on every cold load. Those routes are lazy and now fetch
    // their own data on mount.
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      // Unbounded before: a long-tenured user streamed their entire history on
      // every boot and held a realtime listener over all of it.
      limit(NOTIFICATION_LIMIT),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as NotificationType[]);
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    return () => unsubscribe();
    // Keyed on the id, not the object: App.tsx mints a new `currentUser`
    // reference on every bookmark toggle, which used to tear this listener down
    // and rebuild it each time. The rule cannot see that the id is the only
    // part of `currentUser` this effect reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return {
    currentUser,
    setCurrentUser,
    posts,
    setPosts,
    notifications,
    setNotifications,
    vlogs,
    setVlogs,
    meetRooms,
    setMeetRooms,
    loading,
    postsLoading,
    postsError,
    refetchPosts: fetchPosts,
    isOffline,
    fetchPosts,
    postSort,
    setPostSort,
    fetchVlogs,
    fetchMeetRooms,
  };
};
